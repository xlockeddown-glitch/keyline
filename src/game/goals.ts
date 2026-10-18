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

export function streakLine(run: number, tier: Tier): string {
  return `${run} in a row! A ${tier} match.`;
}

/** One match into the pocket, or that tier's coin value when the pocket is full. */
export function payMatch(keys: Record<Tier, number>, tier: Tier): { keys: Record<Tier, number>; coin: number; match: boolean } {
  const have = keys[tier] ?? 0;
  if (have < matchCap(tier)) return { keys: { ...keys, [tier]: have + 1 }, coin: 0, match: true };
  return { keys, coin: TIER_VALUE[tier], match: false };
}

/* ---------------------------------------------------------------- match cache */

export const CACHE_GRAB_M = 30;
const CACHE_TIERS: Tier[] = ["white", "blue", "green"];

/** Same raw spot for everyone in a city on a day (the client snaps it onto the reachable walk, off main roads). */
export function cacheSeed(city: string, day: string, start: { lat: number; lng: number }): { lat: number; lng: number } {
  const h = fnv1a(`cache|${city}|${day}`);
  const ang = ((h % 3600) / 3600) * Math.PI * 2;
  const dist = 320 + ((h >>> 12) % 520);
  const dLat = (Math.cos(ang) * dist) / 111_320;
  const dLng = (Math.sin(ang) * dist) / (111_320 * Math.cos((start.lat * Math.PI) / 180));
  return { lat: start.lat + dLat, lng: start.lng + dLng };
}

/** 2–3 matches, white/blue/green only (never violet). Seeded per player and day so a retry pays the same. */
export function cachePrize(player: string, day: string): Tier[] {
  const h = fnv1a(`cache-pay|${player}|${day}`);
  const n = 2 + (h % 2);
  const out: Tier[] = [];
  for (let i = 0; i < n; i++) {
    const r = (fnv1a(`${h}|${i}`) % 100) / 100;
    out.push(r < 0.6 ? CACHE_TIERS[0]! : r < 0.9 ? CACHE_TIERS[1]! : CACHE_TIERS[2]!);
  }
  return out;
}

/** Pay a list of matches with overflow coin. */
export function payMatches(keys: Record<Tier, number>, tiers: Tier[]): { keys: Record<Tier, number>; coin: number; got: Tier[] } {
  let k = keys;
  let coin = 0;
  const got: Tier[] = [];
  for (const t of tiers) {
    const p = payMatch(k, t);
    k = p.keys;
    coin += p.coin;
    if (p.match) got.push(t);
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
