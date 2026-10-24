import type { SeriesKind } from "./data.ts";
import { TIER_ORDER, TIER_VALUE } from "./rewards.ts";
import type { Tier } from "./types";

/**
 * 0.1.36 perfect-ladder prize (Ryan). A ladder (The Climb / The Run / The Stack) cleared with every card
 * "perfect" rolls ONE match of any tier, weighted by the ladder, plus a flat coin bonus. It replaces the old
 * fixed bonus match (Run → amber, Stack → red). Expected value stays near that old bonus (Run ≈ 815 vs amber 810,
 * Stack ≈ 2230 vs red 2430), and the Climb sits under the Run. Rolled on the server with the grade (wallet.ts).
 * Odds are percents, white → violet, and each row sums to 100.
 */
export const PRIZE_ODDS: Record<SeriesKind, readonly number[]> = {
  climb: [35, 30, 20, 10, 4, 1],
  run: [10, 20, 30, 25, 12, 3],
  stack: [2, 5, 13, 30, 35, 15],
};

/** Coin on top of the normal clear, about half the pay tier's value (blue 90, green 270, amber 810). */
export const PRIZE_COIN: Record<SeriesKind, number> = { climb: 50, run: 150, stack: 400 };

/** Boost-line label the result screen shows. */
export const PRIZE_TAG = "Perfect ladder";

/** The prize tier for a roll in [0, 1). */
export function prizeTier(kind: SeriesKind, roll: number): Tier {
  const odds = PRIZE_ODDS[kind];
  let r = Math.min(0.999999, Math.max(0, Number.isFinite(roll) ? roll : 0)) * 100;
  for (let i = 0; i < odds.length; i++) {
    r -= odds[i]!;
    if (r < 0) return TIER_ORDER[i]!;
  }
  return TIER_ORDER[odds.length - 1]!;
}

/** Expected coin value of the prize match (for tests and the report). */
export function prizeValue(kind: SeriesKind): number {
  return PRIZE_ODDS[kind].reduce((a, p, i) => a + (p / 100) * TIER_VALUE[TIER_ORDER[i]!], 0);
}
