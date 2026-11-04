/**
 * What an old train fare pays (the ride mini-games themselves were removed in 0.1.95 / 0.1.121).
 * Pure — no store, no DOM — so node tests can run it straight.
 */

/** `perfect` marks a clean sheet in games that offer the bonus (Where am I? 5/5). */
export type RideOutcome = { kind: "idle" } | { kind: "played" } | { kind: "won"; perf: number; perfect?: boolean };

export const IDLE: RideOutcome = { kind: "idle" };

/** Payout table is written for a six-minute ride and scaled from there (0.0.94: was eight; rides got shorter, pay per ride holds). */
export const RIDE_BASE_MS = Math.round(3.75 * 60_000); // 0.1.2: 6 min × 5/8, so rides pay the same under the 5-min cap
export const BASE_IDLE = 1;
export const BASE_PLAYED = 3;
export const BASE_WON_LOW = 5;
export const BASE_WON_HIGH = 7;
/** A win at or above this performance is strong: it can trade three whites for a blue. */
export const STRONG_WIN = 0.75;
/** Rides this long can trade twice (0.0.94: 9 min, was 12, scaled with the six-minute base). */
export const LONG_RIDE_MS = Math.round(5.625 * 60_000); // 0.1.2: 9 min × 5/8
export const BLUE_IN_WHITES = 3;
/** Flat whites a perfect round adds on top of the ride's pay. Not scaled by ride length. */
export const RIDE_PERFECT_BONUS = 1;

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Matches one ride pays for its best outcome. Scale = minutes / 8, rounded, at least 1.
 * Played never pays under idle, won never under played, and a strong win always beats played.
 * Strong wins worth 5+ whites swap 3 whites for 1 blue (two swaps on 12+ minute rides at 10+).
 * A perfect win then adds RIDE_PERFECT_BONUS whites flat, after the swap.
 */
export function rideReward(rideMs: number, outcome: RideOutcome): { white: number; blue: number } {
  const scale = Math.max(0, rideMs) / RIDE_BASE_MS;
  const idle = Math.max(1, Math.round(BASE_IDLE * scale));
  if (outcome.kind === "idle") return { white: idle, blue: 0 };
  const played = Math.max(idle, Math.round(BASE_PLAYED * scale));
  if (outcome.kind === "played") return { white: played, blue: 0 };
  const perf = clamp01(outcome.perf);
  const strong = perf >= STRONG_WIN;
  let white = Math.max(played, Math.round((BASE_WON_LOW + (BASE_WON_HIGH - BASE_WON_LOW) * perf) * scale));
  if (strong) white = Math.max(white, played + 1);
  let blue = 0;
  if (strong && white >= 5) {
    blue = rideMs >= LONG_RIDE_MS && white >= 10 ? 2 : 1;
    white -= BLUE_IN_WHITES * blue;
  }
  if (outcome.perfect) white += RIDE_PERFECT_BONUS;
  return { white, blue };
}

/** Result-screen line for a perfect round's bonus, or undefined when there isn't one. */
export function perfectLine(outcome: RideOutcome): string | undefined {
  if (outcome.kind !== "won" || !outcome.perfect) return undefined;
  return `Perfect round: +${RIDE_PERFECT_BONUS} white bonus on top of the ride's pay.`;
}

/** Worth in whites, for comparing payouts. */
export function rideValue(r: { white: number; blue: number }) {
  return r.white + BLUE_IN_WHITES * r.blue;
}

const RANK = { idle: 0, played: 1, won: 2 } as const;

/** The better of two outcomes. A ride only ever pays its best. */
export function betterOutcome(a: RideOutcome, b: RideOutcome): RideOutcome {
  if (RANK[b.kind] !== RANK[a.kind]) return RANK[b.kind] > RANK[a.kind] ? b : a;
  if (a.kind === "won" && b.kind === "won") {
    if (b.perf !== a.perf) return b.perf > a.perf ? b : a;
    return b.perfect && !a.perfect ? b : a;
  }
  return a;
}

/** What the journey remembers about ride games. Lives on the save so a reload can't re-pay. */
export type RideGameMark = {
  /** The game this ride was dealt when it boarded: the picker's "Suggested". Missing on rides from saves before 0.0.35. */
  rideGame?: RideGameId;
  /** The game the player picked (0.0.41). Missing until they choose; the suggestion stands in. */
  chosenGame?: RideGameId;
  /** Best finished round this ride. */
  game?: { kind: "played" | "won"; perf: number; rounds: number; perfect?: boolean };
  /** Set while a round is running. Still set on load means the tab closed mid-round. */
  roundAt?: number;
  forfeits?: number;
  /** How the last unfinished round ended (0.0.42): the player pressed Stop, or the tab closed. Missing on older saves. */
  lastCut?: "stopped" | "closed";
  /** 0.0.94: the open round is this ride's midway bonus round. */
  roundBonus?: boolean;
  /** 0.0.94: a bonus round has been dealt this ride (only one per ride). */
  bonusDealt?: boolean;
  /** 0.0.94: the bonus round was won; the ride pays RIDE_BONUS_WHITE more. */
  bonusWon?: boolean;
};

export function journeyOutcome(j: RideGameMark): RideOutcome {
  const g = j.game;
  if (!g) return IDLE;
  if (g.kind === "won") return g.perfect ? { kind: "won", perf: clamp01(g.perf), perfect: true } : { kind: "won", perf: clamp01(g.perf) };
  return { kind: "played" };
}

// 0.1.121: the ride games went in 0.1.95. What's left pays an old save's train ride when it lands (ticket.ts
// settleRide) and types old wallet meta; the game picker, rounds, lamp, sorter and route timing are gone.
export type RideGameId = "lamplighter" | "where-am-i" | "match-sorter" | "route-puzzle";

/** 0.0.94: a won midway bonus round added this many whites (an old journey's bonusWon still pays it). */
export const RIDE_BONUS_WHITE = 2;
