/**
 * 0.1.120: Lantern Shops are retired; this is only the till math the one-time buy-back (grantShopRetire) needs.
 * 0.1.59 Lantern Shop: a buildable track of its own (not a house tier). One per city, bought at the shop lot next
 * to the house lot. It makes SHOP_PAY coin every SHOP_EVERY_MS; output waits at the shop up to SHOP_CAP payouts.
 * Server ledger only, no new table:
 *   shop:<city>               the buy (detail { city, at })       `at` = the server clock when bought
 *   shopc:<city>:<anchor>     a collect (detail { city, anchor, n, coin })  `anchor` = where the next payout counts from
 * The anchor key makes a collect idempotent: a retry of the same collect hits the same row.
 */

export const SHOP_PRICE = 600_000;
export const SHOP_PAY = 2_000;
export const SHOP_EVERY_MS = 4 * 60 * 60 * 1000;
export const SHOP_CAP = 3;

/** Payouts waiting, the coin they make, the next anchor after collecting, and when the next payout is ready. */
export function shopOutput(anchor: number, now: number): { n: number; coin: number; nextAnchor: number; readyAt: number } {
  const span = Math.max(0, now - anchor);
  const whole = Math.floor(span / SHOP_EVERY_MS);
  const n = Math.min(SHOP_CAP, whole);
  // Full: the clock restarts at the collect, on the minute so two taps race to the same ledger key (time past the cap
  // is lost). Otherwise the part-made payout carries over.
  const full = whole >= SHOP_CAP;
  const nextAnchor = full ? Math.max(anchor + n * SHOP_EVERY_MS, Math.floor(now / 60_000) * 60_000) : anchor + n * SHOP_EVERY_MS;
  const readyAt = full ? now : anchor + (whole + 1) * SHOP_EVERY_MS;
  return { n, coin: n * SHOP_PAY, nextAnchor, readyAt };
}

/** Where output counts from: the latest collect's anchor, else the buy time. */
export function shopAnchor(boughtAt: number, collects: readonly number[]): number {
  return Math.max(boughtAt, ...collects);
}

export type ShopState = { at: number; anchor: number };
