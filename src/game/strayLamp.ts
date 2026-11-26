/**
 * 0.1.185 Stray lamp (CARD-186): between Comet windows, one of the city's own street lamps "wakes" for 15 minutes
 * every 90 minutes and a right answer there pays a modest extra. Not a new vault and not a new pin: the lamp keeps
 * its id, tier, key cost and vault flow, and the map only borrows the Comet's painted halo while it is awake.
 *
 * Pure and shared, like eventVault.ts: the schedule and the spot are functions of the clock and the baked POIs, so
 * the server rebuilds the same window and lamp from its own clock. There is no state, no migration, and nothing a
 * device sends names the lamp, the window or the bonus (the pay is walletApply.awardGrade's, one `stray:<city>:<w>`
 * ledger row per player per window).
 *
 *  - Schedule: window `w` opens at the city's offset + w × 90 min and stays open 15 min.
 *  - Comet skip: a window that touches that city's Comet open (± 1 min pad) does not happen at all.
 *  - Spot: consecutive NON-SKIPPED windows always land in different 800 m districts. The districts that hold an
 *    eligible lamp are sorted and split by index parity into two groups; the window's rank among non-skipped
 *    windows picks the group by its own parity. A skipped window has no rank, so "the previous window" is always
 *    the previous non-skipped one, with nothing to remember.
 */
import { CITIES } from "./data.ts";
import { districtOf } from "./district.ts";
import { COMET_EVERY_MS, COMET_SKEW_MS, cometEnd, cometStart, cometWindow } from "./eventVault.ts";
import { holidayMarketLamp } from "./holidayLights.ts";
import { hash32 } from "./nightMarket.ts";
import type { CityId, Poi } from "./types";

export const STRAY_EVERY_MS = 90 * 60_000;
export const STRAY_OPEN_MS = 15 * 60_000;
/** The extra on a right answer: floor(STRAY_BONUS_RATE × the lamp color's BASE ladder coin), nothing else on it. */
export const STRAY_BONUS_RATE = 0.5;
/** Clock skew the server allows at the close, for the grade and for the sealed deal time alike (the Comet's minute). */
export const STRAY_SKEW_MS = COMET_SKEW_MS;
/** A stray window keeps this far clear of the city's Comet open, on both edges. */
export const STRAY_COMET_PAD_MS = 60_000;
/** The skip pattern repeats every this many windows (one Comet cycle = 6 h = 4 × 90 min). */
export const STRAY_CYCLE = COMET_EVERY_MS / STRAY_EVERY_MS;
/** The map pin's title while the lamp is awake. */
export const STRAY_PIN_TITLE = "Stray lamp · bonus open";
export const STRAY_PREFIX = "stray:";
/** Ledger key of one player's one bonus in window `w` of a city (zero delta; the coin rides the grade row). */
export const strayKey = (city: string, w: number) => `${STRAY_PREFIX}${city}:${w}`;
/** Reward-card line for the extra. */
export const strayLine = (coin: number) => `Stray lamp +${coin} coin`;
/** The extra for a lamp whose color pays `base` on the base ladder (TIER_VALUE). No other modifier ever touches it. */
export const strayBonus = (base: number) => (Number.isFinite(base) && base > 0 ? Math.floor(STRAY_BONUS_RATE * base) : 0);
/** The Field Guide's one line. */
export const STRAY_GUIDE = `Stray lamp: signed in, one street lamp in each city wakes with a halo for ${STRAY_OPEN_MS / 60_000} minutes every ${STRAY_EVERY_MS / 60_000} minutes (never while a Comet is open). A right answer there pays +${Math.round(STRAY_BONUS_RATE * 100)}% of that vault's base coin, once per waking; the next one wakes in another district.`;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Each city's start offset inside the 90-minute cycle (whole minutes, stable forever). */
export function strayOffset(city: CityId): number {
  return (hash32(`keyline-stray|${city}`) % (STRAY_EVERY_MS / 60_000)) * 60_000;
}

/** The window index this moment falls in (a window starts every STRAY_EVERY_MS from the city's offset). */
export function strayWindow(city: CityId, at: number): number {
  return Math.floor((at - strayOffset(city)) / STRAY_EVERY_MS);
}

export function strayStart(city: CityId, w: number): number {
  return strayOffset(city) + w * STRAY_EVERY_MS;
}

/** When window `w` closes. */
export function strayEnd(city: CityId, w: number): number {
  return strayStart(city, w) + STRAY_OPEN_MS;
}

export type StrayState = { city: CityId; w: number; startsAt: number; endsAt: number; open: boolean };

/** Where this city's stray schedule stands: the current window when open, else the next one (skips not applied). */
export function strayAt(city: CityId, at: number): StrayState {
  const w = strayWindow(city, at);
  const s = strayStart(city, w);
  if (at - s < STRAY_OPEN_MS) return { city, w, startsAt: s, endsAt: s + STRAY_OPEN_MS, open: true };
  return { city, w: w + 1, startsAt: strayStart(city, w + 1), endsAt: strayEnd(city, w + 1), open: false };
}

/**
 * Is window `w` skipped? Yes when [start, end) meets a Comet open of the same city widened by the pad on both
 * edges: [cometStart − pad, cometEnd + pad). Only the Comet window the stray starts in and its two neighbours can
 * reach it.
 */
export function straySkipped(city: CityId, w: number): boolean {
  const s = strayStart(city, w), e = strayEnd(city, w);
  const c0 = cometWindow(city, s);
  for (let c = c0 - 1; c <= c0 + 1; c++) {
    if (s < cometEnd(city, c) + STRAY_COMET_PAD_MS && e > cometStart(city, c) - STRAY_COMET_PAD_MS) return true;
  }
  return false;
}

const PATTERNS = new Map<CityId, boolean[]>();

/** The city's skip pattern over one Comet cycle: entry r is true when every window with w mod 4 = r is skipped. */
export function strayPattern(city: CityId): boolean[] {
  let p = PATTERNS.get(city);
  if (!p) PATTERNS.set(city, (p = Array.from({ length: STRAY_CYCLE }, (_, r) => straySkipped(city, r))));
  return p;
}

/**
 * The rank of window `w` among the city's NON-SKIPPED windows (…, −1, 0, 1, …), or null when `w` is skipped.
 * Closed form from the mod-4 pattern, so it is a pure function of `w`: consecutive non-skipped windows have
 * consecutive ranks, however many skipped ones sit between them.
 */
export function strayRank(city: CityId, w: number): number | null {
  if (!Number.isSafeInteger(w)) return null;
  const p = strayPattern(city);
  const r = mod(w, STRAY_CYCLE);
  if (p[r]) return null;
  const q = (w - r) / STRAY_CYCLE;
  let before = 0;
  for (let i = 0; i < r; i++) if (!p[i]) before++;
  return q * p.filter((x) => !x).length + before;
}

/** A pool lamp with its 800 m district already worked out, so the selector is pure over what it is handed. */
export type StrayPoolLamp = { id: string; district: string };

const byCode = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The pool: the named street lamps the Daily Lantern Run allows (no outfitter, station, counter, board or print
 * shop), city-wide, with a real district, never a possible night-market lamp, sorted by id. Only the city's own
 * baked pois: never the Comet, a Hearth, a placed or owned lantern, or any other pin.
 */
export function strayEligible(cityId: CityId): (StrayPoolLamp & { poi: Poi })[] {
  const city = Object.hasOwn(CITIES, cityId) ? CITIES[cityId] : null;
  if (!city) return [];
  const ok = (p: Poi) => p.kind !== "shop" && p.kind !== "station" && p.kind !== "counter" && p.kind !== "board" && !p.printShop;
  return city.pois
    .filter(ok)
    .map((p) => ({ id: p.id, district: districtOf(cityId, p.lat, p.lng), poi: p }))
    .filter((p) => p.district !== "" && !holidayMarketLamp(cityId, p.poi))
    .sort((a, b) => byCode(a.id, b.id));
}

/**
 * The selector, pure over the pool it is handed. The districts holding a lamp are sorted and split by index parity
 * (even-index / odd-index); rank `n` uses group n mod 2, then a seeded district in that group, then a seeded lamp
 * in that district. Ranks n and n + 1 therefore never share a district. Fewer than two districts (an empty group)
 * means no stray lamp: null, never a fallback.
 */
export function strayPick<T extends StrayPoolLamp>(pool: readonly T[], city: string, n: number): T | null {
  const by = new Map<string, T[]>();
  for (const p of [...pool].filter((x) => x.district !== "").sort((a, b) => byCode(a.id, b.id))) {
    const list = by.get(p.district);
    if (list) list.push(p);
    else by.set(p.district, [p]);
  }
  const keys = [...by.keys()].sort(byCode);
  const group = keys.filter((_, i) => i % 2 === mod(n, 2));
  if (keys.length < 2 || !group.length) return null;
  const lamps = by.get(group[hash32(`keyline-stray-d|${city}|${n}`) % group.length]!)!;
  return lamps[hash32(`keyline-stray-l|${city}|${n}`) % lamps.length]!;
}

const POOLS = new Map<CityId, (StrayPoolLamp & { poi: Poi })[]>();
const LAMPS = new Map<string, Poi | null>();

/** The stray lamp of window `w` (open or not): the same lamp on every device and on the server. null when the
 *  window is skipped for the Comet or the city cannot field two districts. */
export function strayOfWindow(city: CityId, w: number): Poi | null {
  if (!Object.hasOwn(CITIES, city) || !Number.isSafeInteger(w)) return null;
  const key = `${city}|${w}`;
  if (LAMPS.has(key)) return LAMPS.get(key)!;
  const n = strayRank(city, w);
  let poi: Poi | null = null;
  if (n != null) {
    let pool = POOLS.get(city);
    if (!pool) POOLS.set(city, (pool = strayEligible(city)));
    poi = strayPick(pool, city, n)?.poi ?? null;
  }
  if (LAMPS.size > 256) LAMPS.clear();
  LAMPS.set(key, poi);
  return poi;
}

export type StrayLamp = { w: number; lamp: Poi; startsAt: number; endsAt: number };

/** The lamp awake in this city at this moment; null between windows, in a skipped window, or with no spot. */
export function strayLampAt(city: CityId, at: number): StrayLamp | null {
  return strayOf(city, null, at, 0);
}

/**
 * The window in which `poiId` is the city's stray lamp at `at`: open, or up to `graceMs` past its close. null
 * otherwise (another lamp, closed, skipped, no spot). `poiId` null asks for whichever lamp is awake.
 */
export function strayOf(city: CityId, poiId: string | null, at: number, graceMs = 0): StrayLamp | null {
  if (!Object.hasOwn(CITIES, city) || !Number.isFinite(at)) return null;
  const w = strayWindow(city, at);
  const s = strayStart(city, w);
  if (at < s || at >= s + STRAY_OPEN_MS + Math.max(0, graceMs)) return null;
  const lamp = strayOfWindow(city, w);
  if (!lamp || (poiId != null && lamp.id !== poiId)) return null;
  return { w, lamp, startsAt: s, endsAt: s + STRAY_OPEN_MS };
}

/**
 * The server's whole grade-time rule: does a lit-lamp grade on `poiId`, dealt at `dealtAt` (sealed in the token)
 * and graded at server time `now`, sit on this city's stray lamp? `now` must be inside the window, or within
 * STRAY_SKEW_MS after its close, and the sealed deal time inside [start − skew, end + skew]. Returns the window.
 */
export function strayPays(p: { city: CityId; poiId: string; dealtAt: number }, now: number): StrayLamp | null {
  const hit = strayOf(p.city, p.poiId, now, STRAY_SKEW_MS);
  if (!hit || !Number.isFinite(p.dealtAt)) return null;
  if (p.dealtAt < hit.startsAt - STRAY_SKEW_MS || p.dealtAt > hit.endsAt + STRAY_SKEW_MS) return null;
  return hit;
}
