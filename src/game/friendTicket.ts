import { TIER_VALUE } from "./rewards.ts";
import { matchCap } from "./ticket.ts";
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
/** What a friend ticket pays each side. */
export const FRIEND_REWARD: Tier = "white";

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

export function rewardLine(why: RewardWhy | null, from: string): string {
  if (why == null) return `+1 White match for you and ${from}.`;
  if (why === "pair-cap") return `Right! You two already shared a white today, so this one is for bragging rights.`;
  if (why === "sender-cap") return `Right! ${from} has had their three friend-ticket whites today, so no match this time.`;
  if (why === "late") return "The wick burned out before the answer landed.";
  return "Not this time.";
}

/** Land `n` friend-ticket whites in a save; a full pocket pays the white's ladder value in coin (as the Daily run does). */
export function payFriend(keys: Record<Tier, number>, points: number, n: number) {
  const next = { ...keys };
  const room = Math.max(0, matchCap(FRIEND_REWARD) - (next[FRIEND_REWARD] ?? 0));
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
