/**
 * 0.1.59 Lantern Shop: a buildable track of its own (not a house tier). One per city, bought at the shop lot next
 * to the house lot. It makes SHOP_PAY coin every SHOP_EVERY_MS; output waits at the shop up to SHOP_CAP payouts.
 * Server ledger only, no new table:
 *   shop:<city>               the buy (detail { city, at })       `at` = the server clock when bought
 *   shopc:<city>:<anchor>     a collect (detail { city, anchor, n, coin })  `anchor` = where the next payout counts from
 * The anchor key makes a collect idempotent: a retry of the same collect hits the same row.
 */
import { distM } from "./geo.ts";
import { HOUSE_LOTS } from "./houses.ts";
import type { CityId } from "./types.ts";

export const SHOP_PRICE = 600_000;
export const SHOP_PAY = 2_000;
export const SHOP_EVERY_MS = 4 * 60 * 60 * 1000;
export const SHOP_CAP = 3;
export const SHOP_REACH_M = 40;
export const SHOP_NAME = "Lantern Shop";

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

export function cleanShops(raw: unknown): Partial<Record<CityId, ShopState>> {
  const out: Partial<Record<CityId, ShopState>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!(k in HOUSE_LOTS) || !v || typeof v !== "object") continue;
    const at = Number((v as { at?: unknown }).at);
    const anchor = Number((v as { anchor?: unknown }).anchor);
    if (Number.isFinite(at) && at > 0) out[k as CityId] = { at, anchor: Number.isFinite(anchor) && anchor >= at ? anchor : at };
  }
  return out;
}

/** The shop lot: about 90 m east of the house lot, so the two read as neighbours. The client snaps it to the walk. */
export function shopLot(city: CityId): { city: CityId; name: string; lat: number; lng: number } {
  const h = HOUSE_LOTS[city];
  return { city, name: h.name, lat: h.lat, lng: h.lng + 90 / (111_320 * Math.cos((h.lat * Math.PI) / 180)) };
}

export function atShop(city: CityId, lat: number, lng: number, door?: { lat: number; lng: number } | null): boolean {
  const d = door ?? shopLot(city);
  return distM(lat, lng, d.lat, d.lng) <= SHOP_REACH_M;
}

export const shopArt = "/houses/shop.webp";
export const shopMapArt = "/houses/shop-map.webp";
export const SHOP_METERS = 10;

export function formatWait(ms: number): string {
  const m = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
}
