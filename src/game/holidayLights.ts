/**
 * 0.1.182 Holiday Lights (CARD-188): a mid-December cross-town loop. One stable route per city for the whole event:
 * five existing street lamps in five different 800 m districts. Reaching a route lamp for the first time stamps one
 * Journal ornament (cosmetic, 0 coin); stamping all five of a city pays 200 coin once per city for the event.
 * Ornaments stay in the Journal after the window; the loop and the pay do not. Pure rules here; the server write is
 * walletApply.holidayStamp and everything it knows lives in wallet_ledger rows (no migration, no save field).
 *
 *  - The device only says "I am at this lamp, here". It never sends a count.
 *  - A stamp is reach-only: no vault answer, no grade, no token; it pays 0 and writes no grade or district row.
 *  - The window is the server's clock. Only the dev server may shift it (gameClock.ts cookie); a build never can.
 */
import { CITIES } from "./data.ts";
import { DAILY_MIN_SEP_M, DAILY_REACH_M, hash32, mulberry32 } from "./dailyRun.ts";
import { parseDevShift } from "./gameClock.ts";
import { districtOf } from "./district.ts";
import { distM } from "./geo.ts";
import { marketStreets, onMarket, zoneOf } from "./nightMarket.ts";
import type { CityId, Poi } from "./types";

/** [2026-12-12 00:00, 2027-01-03 00:00) America/Chicago (CST, UTC-6 on both ends). The end is exclusive. */
export const HOLIDAY_START_MS = Date.parse("2026-12-12T06:00:00Z");
export const HOLIDAY_END_MS = Date.parse("2027-01-03T06:00:00Z");
/** The event's year tag in the seed and the finish key. */
export const HOLIDAY_YEAR = 2026;
export const HOLIDAY_LAMPS = 5;
/** Coin for stamping all five lamps of one city: once per city for the whole event. */
export const HOLIDAY_FINISH_COIN = 200;
/**
 * Reachability bound: route lamps sit within this many metres of the city's spawn (dailyEligible's own widest
 * ring), so "across town" never means a lamp out past the walkable street graph.
 */
export const HOLIDAY_RADIUS_M = 6000;

export function holidayOpen(nowMs: number): boolean {
  return Number.isFinite(nowMs) && nowMs >= HOLIDAY_START_MS && nowMs < HOLIDAY_END_MS;
}

/**
 * The server's clock for the window. A production build passes dev = false and gets the real clock whatever the
 * cookie says; only the dev server (import.meta.env.DEV) honours the QA shift, the way triviaBank.ts does.
 */
export function holidayClock(realNowMs: number, dev: boolean, cookie: string | null | undefined): number {
  return dev ? realNowMs + parseDevShift(cookie) : realNowMs;
}

/** What the server tells a signed-in device: stamped route lamp ids per city, and the cities whose finish paid. */
export type HolidayState = { stamped: Partial<Record<CityId, string[]>>; done: CityId[] };
export type HolidayLamp = { id: string; name: string; lat: number; lng: number };

/** Ledger key of one stamp (zero delta). */
export const holidayStampKey = (city: string, lamp: string) => `lights:${city}:${lamp}`;
/** Ledger key of a city's one finish pay. */
export const holidayDoneKey = (city: string) => `lights-done:${city}:${HOLIDAY_YEAR}`;
export const HOLIDAY_STAMP_PREFIX = "lights:";
export const HOLIDAY_DONE_PREFIX = "lights-done:";

export function holidaySeed(city: CityId): number {
  // No day in the seed: the route is the same from the first minute of the event to the last.
  return hash32(`keyline-holiday-lights|${HOLIDAY_YEAR}|${city}`);
}

/**
 * Can this lamp ever stand on a night market? Markets move every 15 minutes, but only among the city's baked
 * market streets and their zones, so the set is static: a lamp on any of them is left out of the route.
 */
export function holidayMarketLamp(city: CityId, p: { id: string; lat: number; lng: number }): boolean {
  return marketStreets(city).some((street) =>
    onMarket({ city, hour: 0, street, zone: zoneOf(city, street), startsAt: 0, endsAt: 0 }, { kind: "lamp", poiId: p.id, lat: p.lat, lng: p.lng }),
  );
}

/**
 * The pool: the named street lamps the Daily Lantern Run allows (no outfitter, station, counter, board or print
 * shop), city-wide but within HOLIDAY_RADIUS_M of spawn, never a possible market lamp, sorted by id. Only the
 * city's own baked pois: never the Comet, a Hearth, a placed or owned lantern, or any other pin.
 */
export function holidayEligible(cityId: CityId): Poi[] {
  const city = CITIES[cityId];
  if (!city) return [];
  // dailyEligible stops widening once it has enough lamps downtown; this is its same kind rule, out to the full bound.
  const ok = (p: Poi) =>
    p.kind !== "shop" && p.kind !== "station" && p.kind !== "counter" && p.kind !== "board" && !p.printShop &&
    distM(city.spawn.lat, city.spawn.lng, p.lat, p.lng) <= HOLIDAY_RADIUS_M && districtOf(cityId, p.lat, p.lng) !== "" && !holidayMarketLamp(cityId, p);
  return city.pois.filter(ok).sort((a, b) => a.id.localeCompare(b.id));
}

const ROUTES = new Map<CityId, HolidayLamp[]>();

/**
 * The city's route for the whole event: a seeded shuffle of the pool, then greedily the lamps whose 800 m district
 * is not used yet and that sit at least DAILY_MIN_SEP_M from every pick, until five; walked nearest-next from spawn.
 * Lamp i (0..4) carries ornament i + 1. A city that cannot field five districts has no route ([]): no event there.
 */
export function holidayRoute(cityId: CityId): HolidayLamp[] {
  const had = ROUTES.get(cityId);
  if (had) return had;
  const city = CITIES[cityId];
  if (!city) return [];
  const rnd = mulberry32(holidaySeed(cityId));
  const pool = holidayEligible(cityId);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = t;
  }
  const picks: Poi[] = [];
  const used = new Set<string>();
  for (const p of pool) {
    if (picks.length >= HOLIDAY_LAMPS) break;
    const d = districtOf(cityId, p.lat, p.lng);
    if (used.has(d) || picks.some((q) => distM(p.lat, p.lng, q.lat, q.lng) < DAILY_MIN_SEP_M)) continue;
    used.add(d);
    picks.push(p);
  }
  const ordered: Poi[] = [];
  if (picks.length === HOLIDAY_LAMPS) {
    let cur: { lat: number; lng: number } = city.spawn;
    const left = [...picks];
    while (left.length) {
      left.sort((a, b) => distM(cur.lat, cur.lng, a.lat, a.lng) - distM(cur.lat, cur.lng, b.lat, b.lng) || a.id.localeCompare(b.id));
      const nxt = left.shift()!;
      ordered.push(nxt);
      cur = nxt;
    }
  }
  const out = ordered.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng }));
  ROUTES.set(cityId, out);
  return out;
}

/** Ornament number (1..5) of a route lamp, 0 when the lamp is not on that city's route. */
export function holidayOrnament(cityId: CityId, lampId: string): number {
  return holidayRoute(cityId).findIndex((l) => l.id === lampId) + 1;
}

export type HolidayRefusal = "closed" | "route" | "far";

/** The server's whole stamp rule: the window, the route, the at-lamp reach (the Daily Run's server reach). */
export function holidayCheck(city: CityId, lampId: string, lat: number, lng: number, nowMs: number): { ok: true; lamp: HolidayLamp } | { ok: false; reason: HolidayRefusal } {
  if (!holidayOpen(nowMs)) return { ok: false, reason: "closed" };
  const lamp = holidayRoute(city).find((l) => l.id === lampId);
  if (!lamp) return { ok: false, reason: "route" };
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || distM(lat, lng, lamp.lat, lamp.lng) > DAILY_REACH_M) return { ok: false, reason: "far" };
  return { ok: true, lamp };
}

/**
 * Ledger op_keys to the state. Exact prefixes and route membership are checked here, in JS (ids hold `_`, which a
 * SQL LIKE would read as a wildcard); a stamp for a lamp that is not on its city's route counts for nothing.
 */
export function holidayFromKeys(keys: readonly string[]): HolidayState {
  const stamped: Partial<Record<CityId, string[]>> = {};
  const done: CityId[] = [];
  for (const k of keys) {
    if (k.startsWith(HOLIDAY_DONE_PREFIX)) {
      const [city, year, ...rest] = k.slice(HOLIDAY_DONE_PREFIX.length).split(":");
      if (rest.length === 0 && year === String(HOLIDAY_YEAR) && city && holidayRoute(city as CityId).length && !done.includes(city as CityId)) done.push(city as CityId);
      continue;
    }
    if (!k.startsWith(HOLIDAY_STAMP_PREFIX)) continue;
    const rest = k.slice(HOLIDAY_STAMP_PREFIX.length);
    const cut = rest.indexOf(":");
    if (cut <= 0) continue;
    const city = rest.slice(0, cut) as CityId;
    const lamp = rest.slice(cut + 1);
    if (!holidayOrnament(city, lamp)) continue;
    const list = (stamped[city] ??= []);
    if (!list.includes(lamp)) list.push(lamp);
  }
  // Route order, so the Journal shows ornaments 1..5 left to right.
  for (const c of Object.keys(stamped) as CityId[]) stamped[c]!.sort((a, b) => holidayOrnament(c, a) - holidayOrnament(c, b));
  done.sort();
  return { stamped, done };
}

/** Ornament numbers (1..5, ascending) this state holds for a city. */
export function holidayOrnaments(h: HolidayState | null | undefined, city: CityId): number[] {
  return (h?.stamped[city] ?? []).map((id) => holidayOrnament(city, id)).filter((n) => n > 0).sort((a, b) => a - b);
}

/** Does the player own at least one ornament from this event? */
export function holidayOwned(h: HolidayState | null | undefined): boolean {
  return Boolean(h && Object.values(h.stamped).some((l) => (l?.length ?? 0) > 0));
}

export const holidayStampLine = (n: number) => `Holiday Lights · ornament ${Math.min(HOLIDAY_LAMPS, Math.max(0, Math.floor(n) || 0))}/${HOLIDAY_LAMPS}`;
export const holidayFinishLine = (coin: number = HOLIDAY_FINISH_COIN) => `Holiday Lights +${coin} coin`;
export const holidayProgressLine = (n: number) =>
  n > 0 ? `Holiday Lights ${Math.min(HOLIDAY_LAMPS, n)}/${HOLIDAY_LAMPS}` : `Holiday Lights 0/${HOLIDAY_LAMPS} · find the five dressed lamps across town`;
