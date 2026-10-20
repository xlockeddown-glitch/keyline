// 0.0.93: answer streaks, the daily match cache, and the three daily goals. Pure rules shared by the
// client and the server wallet (walletApply.ts).
import { fnv1a } from "./rarity.ts";
import { TIER_VALUE } from "./rewards.ts";
import { matchCap } from "./ticket.ts";
import type { Tier } from "./types.ts";

/* ---------------------------------------------------------------- streaks */

/** 5 right in a row pays a white match, 10 a blue; then it goes round again (15 white, 20 blue…). */
export function streakPrize(run: number): Tier | null {
  if (!Number.isInteger(run) || run <= 0) return null;
  if (run % 10 === 5) return "white";
  if (run % 10 === 0) return "blue";
  return null;
}

/** 0.1.3 celebrations: the scout cheers at these streaks (then every 25). Bigger streak, bigger cheer. */
export const CHEER_STREAKS = [5, 10, 25] as const;
export type Cheer = "hop" | "jump" | "party" | "violet";
export function cheerFor(run: number): Cheer | null {
  if (!Number.isInteger(run) || run < 5) return null;
  if (run === 5) return "hop";
  if (run === 10) return "jump";
  return run % 25 === 0 ? "party" : null;
}

/** The plain line under a streak pop: what you won and what it is for. */
export function streakSub(tier: Tier): string {
  return `You won a ${tier} match. Use it on a ${tier} lamp.`;
}

export function streakLine(run: number, tier: Tier): string {
  return `${run} in a row! A ${tier} match.`;
}

/**
 * 0.0.97 pocket rule (Ryan): every colour holds POCKET (30). A match landing on a full pocket becomes one
 * overflow credit of that colour; every 3 credits merge into 1 match of the NEXT colour only (white→blue→
 * green→amber→red→violet), which lands by the same rule. Leftover credits (0-2 per colour) persist. A full
 * violet pocket pays violet's coin value per overflow match. Pockets already above 30 (old 150 caps) keep
 * what they hold; new matches of that colour count as overflow.
 *
 * Reward code just adds matches; settlePocket (run once per write: walletSql.mutateWallet on the server,
 * the store's pocket hook on the client) turns any rise past the pocket into credits and merges.
 */
export const POCKET = 30;
export type Credit = Partial<Record<Tier, number>>;
export type Settled = {
  keys: Record<Tier, number>;
  credit: Credit;
  coin: number;
  /** Matches made by merging, per colour they landed in. */
  merged: Partial<Record<Tier, number>>;
  /** Overflow credits added this settle, per colour. */
  credited: Partial<Record<Tier, number>>;
};

export function cleanCredit(raw: unknown): Credit {
  const out: Credit = {};
  if (!raw || typeof raw !== "object") return out;
  for (const t of STEP_TIERS) {
    const n = Math.floor(Number((raw as Record<string, unknown>)[t]) || 0);
    if (t !== "violet" && n > 0) out[t] = Math.min(2, n);
  }
  return out;
}

export function settlePocket(before: Record<Tier, number>, after: Record<Tier, number>, credit: Credit = {}): Settled {
  const keys = { ...after };
  const cr: Credit = cleanCredit(credit);
  const merged: Partial<Record<Tier, number>> = {};
  const credited: Partial<Record<Tier, number>> = {};
  let coin = 0;
  let carry = 0;
  for (let i = 0; i < STEP_TIERS.length; i++) {
    const t = STEP_TIERS[i]!;
    const b = before[t] ?? 0;
    const a = after[t] ?? 0;
    const cur = a > b ? b : a;
    const inc = Math.max(0, a - b) + carry;
    if (carry) merged[t] = (merged[t] ?? 0) + carry;
    carry = 0;
    const land = Math.min(inc, Math.max(0, matchCap(t) - cur));
    keys[t] = cur + land;
    const over = inc - land;
    if (!over) continue;
    if (t === "violet") {
      coin += over * TIER_VALUE.violet;
      continue;
    }
    credited[t] = (credited[t] ?? 0) + over;
    const c = (cr[t] ?? 0) + over;
    carry = Math.floor(c / 3);
    if (c % 3) cr[t] = c % 3;
    else delete cr[t];
  }
  return { keys, credit: cr, coin, merged, credited };
}

/** "2/3 toward blue" for a colour's leftover credits, or null. */
export function creditHint(credit: Credit, tier: Tier): string | null {
  const n = credit[tier] ?? 0;
  const next = STEP_TIERS[STEP_TIERS.indexOf(tier) + 1];
  return n > 0 && next ? `${n}/3 toward ${next}` : null;
}

/** 0.0.97: a match always lands in its own colour; the pocket rule happens in settlePocket. */
export function stepMatch(_keys: Record<Tier, number>, tier: Tier): { tier: Tier | null; coin: number } {
  return { tier, coin: 0 };
}

/** One match of `tier` added (settlePocket turns overflow into credits). */
export function payMatch(keys: Record<Tier, number>, tier: Tier): { keys: Record<Tier, number>; coin: number; match: boolean; tier: Tier | null; up: boolean } {
  return { keys: { ...keys, [tier]: (keys[tier] ?? 0) + 1 }, coin: 0, match: true, tier, up: false };
}

/** Several matches of one tier added (settlePocket turns overflow into credits). */
export function payMatchesOf(keys: Record<Tier, number>, tier: Tier, n: number): { keys: Record<Tier, number>; add: Partial<Record<Tier, number>>; coin: number; up: number } {
  const c = Math.max(0, Math.floor(n));
  if (!c) return { keys, add: {}, coin: 0, up: 0 };
  return { keys: { ...keys, [tier]: (keys[tier] ?? 0) + c }, add: { [tier]: c }, coin: 0, up: 0 };
}

/* ---------------------------------------------------------------- match cache */

export const CACHE_GRAB_M = 30;
/** 0.0.96: how close you must be to see the cache on the map (the Owl sees it from anywhere). */
export const CACHE_SEE_M = 450;
/** 0.1.7 (Ryan): a cache only holds high matches — amber 2 in 3, red 1 in 3, never violet (and never white, blue, green). */
const CACHE_TIERS: Tier[] = ["amber", "red"];

/** Same raw spot for everyone in a city on a day (the client snaps it onto the reachable walk, off main roads). */
export function cacheSeed(city: string, day: string, start: { lat: number; lng: number }): { lat: number; lng: number } {
  const h = fnv1a(`cache|${city}|${day}`);
  const ang = ((h % 3600) / 3600) * Math.PI * 2;
  const dist = 320 + ((h >>> 12) % 520);
  const dLat = (Math.cos(ang) * dist) / 111_320;
  const dLng = (Math.sin(ang) * dist) / (111_320 * Math.cos((start.lat * Math.PI) / 180));
  return { lat: start.lat + dLat, lng: start.lng + dLng };
}

/** 2–3 matches, amber (2/3) or red (1/3) only — never white, blue, green or violet. Seeded per player and day so a retry pays the same. */
export function cachePrize(player: string, day: string): Tier[] {
  const h = fnv1a(`cache-pay|${player}|${day}`);
  const n = 2 + (h % 2);
  const out: Tier[] = [];
  for (let i = 0; i < n; i++) {
    out.push(fnv1a(`${h}|${i}`) % 3 < 2 ? CACHE_TIERS[0]! : CACHE_TIERS[1]!);
  }
  return out;
}

/** Pay a list of matches with overflow coin. */
export const STEP_TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

/**
 * The cache always pays (0.0.95): a rolled colour whose pocket is full steps up to the next
 * tier with room (white → blue → … → violet); only when every tier from there up is full does
 * it pay overflow coin (the rolled tier's value).
 */
export function payMatches(keys: Record<Tier, number>, tiers: Tier[]): { keys: Record<Tier, number>; coin: number; got: Tier[] } {
  let k = keys;
  let coin = 0;
  const got: Tier[] = [];
  for (const t of tiers) {
    const p = payMatch(k, t);
    k = p.keys;
    if (p.tier) got.push(p.tier);
    coin += p.coin;
  }
  return { keys: k, coin, got };
}

/* ---------------------------------------------------------------- daily goals */

export type GoalKind = "green" | "blue" | "right" | "cab" | "ride" | "walk" | "street";
export type GoalDef = { kind: GoalKind; need: number; title: string };

const POOL: GoalDef[] = [
  { kind: "green", need: 3, title: "Light 3 green lanterns" },
  { kind: "blue", need: 3, title: "Light 3 blue lanterns" },
  { kind: "right", need: 8, title: "Answer 8 lanterns right" },
  { kind: "cab", need: 1, title: "Take a cab" },
  { kind: "ride", need: 1, title: "Finish a ride game" },
  { kind: "walk", need: 800, title: "Walk 800 m" },
  { kind: "street", need: 5, title: "Pick up 5 street matches" },
];

export const GOAL_COIN = 60;
export const GOAL_ALL_TIER: Tier = "green";
/** Proof of play the server asks for before it pays a goal: graded right answers today. */
export const GOAL_PROOF_RIGHT = 2;
export const GOAL_ALL_PROOF_RIGHT = 6;

/** Today's three goals: the same for everyone, drawn without repeats. */
export function dailyGoals(day: string): GoalDef[] {
  const pool = [...POOL];
  const out: GoalDef[] = [];
  let h = fnv1a(`goals|${day}`);
  while (out.length < 3) {
    const i = h % pool.length;
    out.push(pool.splice(i, 1)[0]!);
    h = fnv1a(`${h}`);
  }
  return out;
}

export type GoalDay = { day: string; n: [number, number, number]; paid: [boolean, boolean, boolean]; all: boolean; seen: boolean };

export function freshGoals(day: string): GoalDay {
  return { day, n: [0, 0, 0], paid: [false, false, false], all: false, seen: false };
}

export function cleanGoals(raw: unknown, day: string): GoalDay {
  const g = raw as Partial<GoalDay> | null;
  if (!g || g.day !== day || !Array.isArray(g.n) || !Array.isArray(g.paid)) return freshGoals(day);
  const n = g.n.slice(0, 3).map((v) => (Number.isFinite(v) && v > 0 ? Math.floor(v as number) : 0)) as [number, number, number];
  const paid = g.paid.slice(0, 3).map(Boolean) as [boolean, boolean, boolean];
  return { day, n, paid, all: Boolean(g.all), seen: Boolean(g.seen) };
}

/** Count progress on today's goals of this kind. A new day starts fresh. */
export function noteGoal(g: GoalDay, kind: GoalKind, amount: number, day: string): GoalDay {
  const cur = g.day === day ? g : freshGoals(day);
  const defs = dailyGoals(day);
  let changed = false;
  const n = [...cur.n] as [number, number, number];
  defs.forEach((d, i) => {
    if (d.kind !== kind || n[i]! >= d.need) return;
    n[i] = Math.min(d.need, n[i]! + amount);
    changed = true;
  });
  return changed || cur !== g ? { ...cur, n } : g;
}

export function goalDone(g: GoalDay, i: number): boolean {
  const d = dailyGoals(g.day)[i];
  return Boolean(d && g.n[i]! >= d.need);
}

/** Something on the board to collect: a finished goal not yet paid, or all three paid but not the green match. */
export function goalsClaimable(g: GoalDay): boolean {
  for (let i = 0; i < 3; i++) if (goalDone(g, i) && !g.paid[i]) return true;
  return g.paid.every(Boolean) && !g.all;
}

/** The Quest Board glows with "!" on a new day, until today's goals are looked at, and while something is ready. */
export function questAlert(g: GoalDay, day = new Date().toISOString().slice(0, 10)): boolean {
  return g.day !== day || !g.seen || goalsClaimable(g);
}
