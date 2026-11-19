/** 0.1.173 Put in order: the one half-coin rule and the input guard. Pure; shared by the server wallet and the guest store. */
export type OrderOutcome = "exact" | "swap" | "miss";

/** Longest submission the server reads: four tokens of at most 64 characters. */
export const ORDER_MAX_ITEMS = 4;
export const ORDER_MAX_TOKEN = 64;

/** A submitted permutation, or [] (a miss) for anything that is not a short list of short strings. */
export function cleanOrder(v: unknown): string[] {
  if (!Array.isArray(v) || v.length > ORDER_MAX_ITEMS) return [];
  return v.every((t) => typeof t === "string" && t.length <= ORDER_MAX_TOKEN) ? (v as string[]) : [];
}

/**
 * Coins a graded order card pays out of its normal `total`: one adjacent swap pays half, rounded down.
 * `total` is the whole integer coin grant (vault coin, tips, key-back, boosts), never just the base multiplier.
 */
export function orderCoins(total: number, outcome: OrderOutcome | null | undefined): number {
  return outcome === "swap" ? Math.floor(Math.max(0, total) / 2) : total;
}
