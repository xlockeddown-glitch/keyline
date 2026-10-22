import { TIER_VALUE } from "./rewards.ts";
import type { Tier } from "./types";

/**
 * Friend tickets (0.0.50): the rules, kept pure so they're tested on their own. The server functions
 * (friendApi.ts → friendService.ts) apply them against Postgres; nothing here trusts the client.
 *
 * A signed-in walker who has just answered a trivia card can send that card as a link (/t/<token>).
 * A signed-in friend opens it and gets that exact card, timed like a lamp card on the server clock.
 * A right answer in time pays both of them one white match, within these caps:
 *  - no redeeming your own ticket; one redemption per ticket; tickets expire 48 h after they're made
 *  - a sender makes at most 5 tickets and earns at most 3 rewarded redemptions per UTC day
 *  - a friend pair (either direction) is rewarded at most once per UTC day
 */
export const TICKET_TTL_MS = 48 * 60 * 60 * 1000;
export const DAILY_TICKETS = 5;
export const DAILY_REWARDS = 3;
/** Same wick as a lamp's trivia card. */
export const CARD_MS = 25_000;
/** Network slack on top of the wick before the server calls an answer late. */
export const ANSWER_GRACE_MS = 2_500;
export const TOKEN_BYTES = 18;
export const TOKEN_RE = /^[A-Za-z0-9_-]{24}$/;
/** What a friend ticket pays each side at the bottom rung (and for a card too easy for the pair's rung). */
export const FRIEND_REWARD: Tier = "white";

/**
 * 0.1.26 friend ladder (Ryan). Each friend PAIR (either direction) climbs a rung with every rewarded ticket:
 * white → blue → green → amber → red, then back to white. Both sides get the current rung's match.
 *  - a wrong or late answer resets the pair to white
 *  - a right answer blocked by a cap (pair once a day, sender three a day) leaves the rung where it is
 *  - 48 h with no rewarded ticket resets to white
 *  - green and amber need a card of difficulty 2+, red needs 3; a card too easy for the rung pays white and
 *    neither climbs nor resets
 *  - never violet
 * No table or column holds the rung: the server replays the pair's answered friend_tickets rows (oldest first)
 * every time, so the rung, and the colour each rewarded ticket paid, come only from server records.
 */
export const LADDER: readonly Tier[] = ["white", "blue", "green", "amber", "red"];
export const LADDER_FLOOR: readonly number[] = [1, 1, 2, 2, 3];
export const LADDER_IDLE_MS = 48 * 60 * 60 * 1000;

export type LadderStep = { token: string; at: number; correct: boolean; late: boolean; rewarded: boolean; capped: boolean; diff: number };
export type LadderPay = { tier: Tier; rung: number };
export type LadderState = { rung: number; lastAt: number | null; paid: Map<string, LadderPay> };

/** Replay a pair's answered tickets (any order; sorted here by answer time, then token). */
export function replayLadder(steps: readonly LadderStep[]): LadderState {
  const sorted = [...steps].sort((a, b) => a.at - b.at || (a.token < b.token ? -1 : 1));
  let rung = 0;
  let lastAt: number | null = null;
  const paid = new Map<string, LadderPay>();
  for (const s of sorted) {
    if (lastAt != null && s.at - lastAt > LADDER_IDLE_MS) rung = 0;
    if (s.late || !s.correct) {
      rung = 0;
      continue;
    }
    if (!s.rewarded) continue; // capped (or not yet settled): the rung stays
    lastAt = s.at;
    if ((Number(s.diff) || 2) < LADDER_FLOOR[rung]!) {
      paid.set(s.token, { tier: FRIEND_REWARD, rung: 0 });
      continue;
    }
    paid.set(s.token, { tier: LADDER[rung]!, rung });
    rung = (rung + 1) % LADDER.length;
  }
  return { rung, lastAt, paid };
}

/** The rung the pair's next rewarded ticket pays at `now` (idle reset applied). */
export function ladderNext(st: LadderState, now: number): { rung: number; tier: Tier; floor: number } {
  const rung = st.lastAt != null && now - st.lastAt > LADDER_IDLE_MS ? 0 : st.rung;
  return { rung, tier: LADDER[rung]!, floor: LADDER_FLOOR[rung]! };
}

const cap = (t: Tier) => t[0]!.toUpperCase() + t.slice(1);

/** "Get this right for an Amber match each. Streak 4 of 5." (0.1.26 plain words). */
export function ladderNextLine(tier: Tier, rung: number): string {
  return `Get this right for ${/^[AEIOU]/i.test(tier) ? "an" : "a"} ${cap(tier)} match each. Streak ${rung + 1} of ${LADDER.length}.`;
}

/** Shown under the card when its difficulty is below the streak's floor. */
export function tooEasyLine(tier: Tier): string {
  return `This card is too easy for ${cap(tier)}, so it pays White.`;
}

export function utcDay(at: number): string {
  return new Date(at).toISOString().slice(0, 10);
}

/** 144 random bits from the platform CSPRNG, base64url (24 chars). */
export function newToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isToken(s: unknown): s is string {
  return typeof s === "string" && TOKEN_RE.test(s);
}

/** Order-free key, so A→B and B→A count as the same pair. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Fisher–Yates with an injectable source, so the dealt order is fixed when the ticket is made. */
export function dealChoices(choices: readonly string[], rand: () => number = Math.random): string[] {
  const out = [...choices];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export type TicketRow = {
  token: string;
  senderId: string;
  senderName: string;
  createdAt: number;
  expiresAt: number;
  friendId: string | null;
  openedAt: number | null;
  answeredAt: number | null;
  correct: boolean | null;
  rewarded: boolean;
};

export type CreateDecision = { kind: "ok" } | { kind: "reject"; reason: "guest" | "daily-cap" | "unknown-card" };

export function createDecision(p: { signedIn: boolean; createdToday: number; cardKnown: boolean }): CreateDecision {
  if (!p.signedIn) return { kind: "reject", reason: "guest" };
  if (!p.cardKnown) return { kind: "reject", reason: "unknown-card" };
  if (p.createdToday >= DAILY_TICKETS) return { kind: "reject", reason: "daily-cap" };
  return { kind: "ok" };
}

export type OpenDecision =
  | { kind: "missing" }
  | { kind: "self" }
  | { kind: "expired" }
  | { kind: "taken" }
  /** This friend already answered it. */
  | { kind: "done" }
  /** This friend opened it and the wick is still burning: same card, remaining time. */
  | { kind: "resume"; msLeft: number }
  /** This friend opened it and let the wick run out (tab closed): scored as a miss. */
  | { kind: "lapsed" }
  /** Unclaimed and live: this friend claims it and the clock starts now. */
  | { kind: "claim" };

export function deadlineOf(openedAt: number): number {
  return openedAt + CARD_MS;
}

export function openDecision(row: TicketRow | null, userId: string, now: number): OpenDecision {
  if (!row) return { kind: "missing" };
  if (row.senderId === userId) return { kind: "self" };
  if (row.friendId && row.friendId !== userId) return { kind: "taken" };
  if (row.friendId === userId) {
    if (row.answeredAt != null) return { kind: "done" };
    const left = deadlineOf(row.openedAt ?? now) - now;
    return left > 0 ? { kind: "resume", msLeft: left } : { kind: "lapsed" };
  }
  if (now >= row.expiresAt) return { kind: "expired" };
  return { kind: "claim" };
}

export type AnswerDecision =
  | { kind: "reject"; reason: "missing" | "self" | "not-yours" | "answered" | "not-open" }
  | { kind: "score"; correct: boolean; late: boolean };

/** Is this answer accepted, and is it right and on time? The reward caps are applied after (rewardDecision). */
export function answerDecision(row: TicketRow | null, userId: string, choice: string, answer: string, now: number): AnswerDecision {
  if (!row) return { kind: "reject", reason: "missing" };
  if (row.senderId === userId) return { kind: "reject", reason: "self" };
  if (row.friendId !== userId) return { kind: "reject", reason: row.friendId ? "not-yours" : "not-open" };
  if (row.answeredAt != null) return { kind: "reject", reason: "answered" };
  if (row.openedAt == null) return { kind: "reject", reason: "not-open" };
  const late = now > deadlineOf(row.openedAt) + ANSWER_GRACE_MS;
  return { kind: "score", correct: !late && choice === answer, late };
}

export type RewardWhy = "wrong" | "late" | "sender-cap" | "pair-cap";
export type RewardDecision = { rewarded: true } | { rewarded: false; why: RewardWhy };

/** A right, on-time answer pays both sides unless the sender's daily rewards or this pair's daily reward are used up. */
export function rewardDecision(p: { correct: boolean; late: boolean; senderRewardedToday: number; pairRewardedToday: number }): RewardDecision {
  if (p.late) return { rewarded: false, why: "late" };
  if (!p.correct) return { rewarded: false, why: "wrong" };
  if (p.pairRewardedToday > 0) return { rewarded: false, why: "pair-cap" };
  if (p.senderRewardedToday >= DAILY_REWARDS) return { rewarded: false, why: "sender-cap" };
  return { rewarded: true };
}

export function rewardLine(why: RewardWhy | null, from: string, pay: LadderPay = { tier: FRIEND_REWARD, rung: 0 }): string {
  if (why == null) return `You and ${from} each got ${/^[AEIOU]/i.test(pay.tier) ? "an" : "a"} ${cap(pay.tier)} match. Streak ${pay.rung + 1} of ${LADDER.length}.`;
  if (why === "pair-cap") return `Right! You two already got a friend ticket match today, so no match this time. Your streak stays.`;
  if (why === "sender-cap") return `Right! ${from} already got three friend ticket matches today, so no match this time. Your streak stays.`;
  if (why === "late") return "Time ran out before your answer arrived. Your streak starts over at White.";
  return "Not this time. Your streak starts over at White.";
}

/**
 * Land `n` friend-ticket whites in a save; a full pocket pays the white's ladder value in coin (as the Daily
 * run does). `cap` is the white pocket (ticket.ts matchCap), passed in so the /t page never loads the city data.
 */
export function payFriend(
  keys: Record<Tier, number>,
  points: number,
  n: number,
  cap: number,
  step?: (keys: Record<Tier, number>, tier: Tier, n: number) => { keys: Record<Tier, number>; add: Partial<Record<Tier, number>>; coin: number },
  tier: Tier = FRIEND_REWARD,
) {
  if (step) {
    // 0.0.96: full pocket steps up (match ↑); coin only when every tier above is full. 0.1.26: the ladder's colour.
    const paid = step(keys, LADDER.includes(tier) ? tier : FRIEND_REWARD, Math.max(0, n));
    const added = Object.values(paid.add).reduce((a, b) => a + (b ?? 0), 0);
    return { keys: paid.keys, points: points + paid.coin, added, coins: paid.coin };
  }
  const next = { ...keys };
  const room = Math.max(0, cap - (next[FRIEND_REWARD] ?? 0));
  const fit = Math.min(room, Math.max(0, n));
  next[FRIEND_REWARD] = (next[FRIEND_REWARD] ?? 0) + fit;
  const coins = (Math.max(0, n) - fit) * TIER_VALUE[FRIEND_REWARD];
  return { keys: next, points: points + coins, added: fit, coins };
}

/** Ids of friend-ticket rewards already landed in this save ("s:<token>" sender, "f:<token>" friend). Newest kept. */
export const FRIEND_PAID_KEEP = 80;
export function markFriendPaid(paid: readonly string[], ids: readonly string[]): { paid: string[]; fresh: string[] } {
  const have = new Set(paid);
  const fresh = ids.filter((id, i) => !have.has(id) && ids.indexOf(id) === i);
  return { paid: [...paid, ...fresh].slice(-FRIEND_PAID_KEEP), fresh };
}
