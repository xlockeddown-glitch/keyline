import type { Tier } from "./types";

/**
 * 0.0.57: the one place a match leaves the pocket. Every spend checks and deducts in the same
 * step, so a lamp can never open on a match that isn't there (a stale count, a second tab, an
 * exchange or a payment that ran while the card was up). Counts are whole numbers, never below 0.
 */
export const MATCH_TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

/** A pocket with every tier a whole number at or above 0 (a bad save value reads as 0, never as "has one"). */
export function cleanKeys(keys: Partial<Record<Tier, unknown>> | null | undefined): Record<Tier, number> {
  const out = {} as Record<Tier, number>;
  for (const t of MATCH_TIERS) {
    const n = Number(keys?.[t]);
    out[t] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  return out;
}

/** How many matches of a tier the pocket really holds. */
export function matchCount(keys: Partial<Record<Tier, unknown>>, tier: Tier) {
  return cleanKeys(keys)[tier];
}

export function hasMatch(keys: Partial<Record<Tier, unknown>>, tier: Tier, n = 1) {
  return matchCount(keys, tier) >= n;
}

/** Take `n` matches of a tier, or null if the pocket doesn't hold them. Check and deduct together. */
export function spendMatch(keys: Partial<Record<Tier, unknown>>, tier: Tier, n = 1): Record<Tier, number> | null {
  const k = cleanKeys(keys);
  if (!(n >= 1) || k[tier] < n) return null;
  return { ...k, [tier]: k[tier] - n };
}

/** Put a held match back (walked away from a lamp before answering). */
export function refundMatch(keys: Partial<Record<Tier, unknown>>, tier: Tier, n = 1): Record<Tier, number> {
  const k = cleanKeys(keys);
  return { ...k, [tier]: k[tier] + Math.max(0, Math.floor(n)) };
}

/**
 * The pocket written by another tab of the same save (the `storage` event's new value), or null
 * if it isn't a save this build reads. Without this a second tab keeps showing — and spending —
 * matches the first tab already used.
 */
export function savedKeys(raw: string | null | undefined): Record<Tier, number> | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { version?: number; keys?: Partial<Record<Tier, unknown>> };
    if (!data || (data.version !== 1 && data.version !== 2) || !data.keys || typeof data.keys !== "object") return null;
    return cleanKeys(data.keys);
  } catch {
    return null;
  }
}
