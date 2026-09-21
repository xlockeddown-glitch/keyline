import type { Tier } from "./types";

/** Locked reward ladder A. One table drives coin and Bank exchange. */
export const TIER_VALUE: Record<Tier, number> = {
  white: 30,
  blue: 90,
  green: 270,
  amber: 810,
  red: 2430,
  violet: 7290,
};

export const TIER_ORDER: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

export const BANK_DOWN = 3;
export const BANK_UP = 4;

export function nextTier(tier: Tier): Tier | null {
  const i = TIER_ORDER.indexOf(tier);
  if (i < 0 || i >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[i + 1]!;
}

export function prevTier(tier: Tier): Tier | null {
  const i = TIER_ORDER.indexOf(tier);
  if (i <= 0) return null;
  return TIER_ORDER[i - 1]!;
}

export function rewardPoints(
  tier: Tier,
  opts: { mult: number; bonus: number; diffMult?: number; loot?: number; series?: boolean },
): number {
  const base = TIER_VALUE[tier];
  const diff = opts.diffMult ?? 1;
  const loot = opts.loot ?? 1;
  const series = opts.series ? 1.15 : 1;
  return Math.round(base * opts.mult * opts.bonus * diff * loot * series);
}

/** 4 lower → 1 higher. Tax of one lower match vs the 3× table. */
export function bankUpSpec(from: Tier) {
  const to = nextTier(from);
  if (!to) return null;
  return { pay: from, payN: BANK_UP, get: to, getN: 1 as const };
}

/** 1 higher → 3 lower. Exact table value, no tax. */
export function bankDownSpec(from: Tier) {
  const to = prevTier(from);
  if (!to) return null;
  return { pay: from, payN: 1 as const, get: to, getN: BANK_DOWN };
}

export function applyBank(
  keys: Record<Tier, number>,
  spec: { pay: Tier; payN: number; get: Tier; getN: number },
  cap: (tier: Tier) => number,
): Record<Tier, number> | null {
  if ((keys[spec.pay] ?? 0) < spec.payN) return null;
  const next = { ...keys, [spec.pay]: keys[spec.pay]! - spec.payN, [spec.get]: (keys[spec.get] ?? 0) + spec.getN };
  if (next[spec.get]! > cap(spec.get)) return null;
  return next;
}
