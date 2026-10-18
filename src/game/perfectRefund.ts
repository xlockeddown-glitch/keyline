import type { Tier } from "./types";
import { TIER_VALUE } from "./rewards.ts";
import { stepMatch } from "./goals.ts";

/**
 * 0.0.90: a perfect lamp (every question on it right, incl. Run/Stack) gives back the match
 * spent to light it, same tier. Violet lamps are excluded. A full pocket pays the usual
 * overflow coin (the tier's value) instead. Client and server both call this.
 */
export type PerfectRefund = { match: number; coin: number };

export const PERFECT_REFUND_LINE = "Perfect · match back";

export function perfectRefund(tier: Tier, have: number, cap: number): PerfectRefund {
  if (tier === "violet") return { match: 0, coin: 0 };
  if (have < cap) return { match: 1, coin: 0 };
  return { match: 0, coin: TIER_VALUE[tier] };
}

/**
 * 0.0.96: the perfect match back through the shared pocket rule (goals.ts stepMatch): a full tier steps it up
 * (match ↑), coin only when every allowed tier above is full. `tier` is where it landed.
 */
export function perfectBack(tier: Tier, keys: Record<Tier, number>): PerfectRefund & { tier: Tier; up: boolean } {
  if (tier === "violet") return { match: 0, coin: 0, tier, up: false };
  const s = stepMatch(keys, tier);
  if (!s.tier) return { match: 0, coin: s.coin, tier, up: false };
  return { match: 1, coin: 0, tier: s.tier, up: s.tier !== tier };
}
