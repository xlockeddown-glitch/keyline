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

/**
 * 0.1.60: hand-placed shop lots, one per city, about 110 m from the house lot (so the house and shop buttons never
 * show together; each reach is 40 m) on a sidewalk node of a named street in the baked walk graph — never a park
 * path. Picked by /workspace/bake-scope/k160/pick.py; shop.test.ts checks each snaps onto the baked walk.
 */
export const SHOP_LOTS: Record<CityId, { name: string; lat: number; lng: number }> = {
  austin: { name: "Nueces Street", lat: 30.26627, lng: -97.74971 },
  temple: { name: "West Avenue B", lat: 31.09696, lng: -97.34651 },
  nyc: { name: "7th Avenue", lat: 40.7599, lng: -73.98413 },
  sf: { name: "Washington Street", lat: 37.79555, lng: -122.40324 },
  london: { name: "Charing Cross Road", lat: 51.51057, lng: -0.1284 },
  chicago: { name: "East Washington Street", lat: 41.88325, lng: -87.6257 },
  detroit: { name: "Monroe Street", lat: 42.33227, lng: -83.04627 },
  tucson: { name: "East Toole Avenue", lat: 32.22368, lng: -110.96787 },
  toronto: { name: "Dundas Street West", lat: 43.65576, lng: -79.38359 },
  la: { name: "North Broadway", lat: 34.05563, lng: -118.24369 },
  boston: { name: "Tremont Street", lat: 42.35346, lng: -71.06421 },
  nola: { name: "Madison Avenue", lat: 29.95803, lng: -90.06176 },
  seattle: { name: "Union Street", lat: 47.6087, lng: -122.33701 },
  denver: { name: "Arapahoe Street", lat: 39.74821, lng: -104.99522 },
  nashville: { name: "Commerce Street", lat: 36.16288, lng: -86.77693 },
};

export function shopLot(city: CityId): { city: CityId; name: string; lat: number; lng: number } {
  const fixed = SHOP_LOTS[city];
  if (fixed) return { city, ...fixed };
  // A city added later without a lot: about 90 m east of its house lot until one is placed.
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

/** 0.1.88: the Journal till line, e.g. "4,000 waiting · 2/3" or "Next in 1 h 20 min". */
export function tillLine(anchor: number, now: number): string {
  const o = shopOutput(anchor, now);
  return o.n ? `${o.coin.toLocaleString("en-US")} waiting · ${o.n}/${SHOP_CAP}` : `Next in ${formatWait(o.readyAt - now)}`;
}
