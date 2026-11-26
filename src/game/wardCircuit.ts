/**
 * 0.1.184 Ward Circuit (CARD-185): a daily cross-town trail next to the Daily Lantern Run (which can still sit
 * downtown). Once per city per city-local day the server seeds four existing street lamps in four different 800 m
 * districts, every pair within 6,000 m. Any order. Two hours from the first light. All four pays 200 coin, no keys.
 * Pure rules here; the server write is walletApply.wardLight and everything it knows lives in wallet_ledger rows
 * (no migration, no save field).
 *
 *  - The device only says "I am at this lamp, here". It never sends a count, a list, a time or a "done".
 *  - A light is reach-only: no vault answer, no grade, no token; it pays 0 and writes no grade or district row.
 *  - One attempt per city per city-local day: the window opens at the first light and is never reopened that day.
 *  - A city that cannot field four districts inside the spread has no circuit that day (never three lamps).
 */
import { CITIES } from "./data.ts";
import { DAILY_JITTER_MS, DAILY_MAX_MS, DAILY_MIN_SEP_M, DAILY_REACH_M, dailyTopSpeed, hash32, mulberry32, spotFloorMs } from "./dailyRun.ts";
import { districtOf } from "./district.ts";
import { distM } from "./geo.ts";
import { holidayMarketLamp } from "./holidayLights.ts";
import { cityDay } from "./vaultStack.ts";
import type { CityId, Poi } from "./types";

export const WARD_LAMPS = 4;
/** Coin for lighting all four lamps inside the window: once per city per city-local day. */
export const WARD_COIN = 200;
/** The window, from the first light (the Daily Run's own two hours). */
export const WARD_WINDOW_MS = DAILY_MAX_MS;
/** Reachability: every PAIR of the four lamps sits within this many metres (great-circle, baked coordinates). */
export const WARD_SPREAD_M = 6000;
/** Distance checks one search may spend before the city simply has no circuit that day. */
export const WARD_SEARCH_STEPS = 400_000;

export type WardLamp = { id: string; name: string; lat: number; lng: number };
/** A pool lamp with its 800 m district already worked out, so the selector is pure over what it is handed. */
export type WardPoolLamp = WardLamp & { district: string };
/** One city's circuit today as the server tells a signed-in device. `lit` is in route order. */
export type WardCity = { day: string; lit: string[]; startedAt: number; done: boolean };
export type WardState = Partial<Record<CityId, WardCity>>;

export const WARD_LIGHT_PREFIX = "ward:";
export const WARD_DONE_PREFIX = "ward-done:";
/** Ledger key of one light (zero delta). */
export const wardLightKey = (city: string, day: string, lamp: string) => `${WARD_LIGHT_PREFIX}${city}:${day}:${lamp}`;
/** Ledger key of a city-day's one finish pay. */
export const wardDoneKey = (city: string, day: string) => `${WARD_DONE_PREFIX}${city}:${day}`;

export function wardSeed(city: CityId, day: string): number {
  return hash32(`keyline-ward-circuit|${city}|${day}`);
}

/**
 * The pool: the named street lamps the Daily Lantern Run allows (no outfitter, station, counter, board or print
 * shop), city-wide, with a real district, never a possible night-market lamp, sorted by id. Only the city's own
 * baked pois: never the Comet, a Hearth, a placed or owned lantern, or any other pin.
 */
export function wardEligible(cityId: CityId): WardPoolLamp[] {
  const city = Object.hasOwn(CITIES, cityId) ? CITIES[cityId] : null;
  if (!city) return [];
  const ok = (p: Poi) => p.kind !== "shop" && p.kind !== "station" && p.kind !== "counter" && p.kind !== "board" && !p.printShop;
  return city.pois
    .filter(ok)
    .map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, district: districtOf(cityId, p.lat, p.lng) }))
    .filter((p) => p.district !== "" && !holidayMarketLamp(cityId, p))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The selector, pure over the pool it is handed: a seeded shuffle, then the first set of four in shuffled order
 * (depth-first, backing up when a pick cannot be completed) whose lamps sit in four DIFFERENT districts, at least
 * DAILY_MIN_SEP_M apart, every pair within WARD_SPREAD_M. No such set (or the step budget spent): [] — never a
 * shorter route. The four come back walked nearest-next from `from`, for a stable display order only.
 */
export function wardPick(pool: readonly WardPoolLamp[], seed: number, from: { lat: number; lng: number }): WardPoolLamp[] {
  const list = pool.filter((p) => p.district !== "").sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(list.map((p) => p.district)).size < WARD_LAMPS) return [];
  const rnd = mulberry32(seed);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = list[i]!;
    list[i] = list[j]!;
    list[j] = t;
  }
  let steps = 0;
  const picks: WardPoolLamp[] = [];
  const fits = (p: WardPoolLamp) =>
    picks.every((q) => {
      if (q.district === p.district) return false;
      steps++;
      const d = distM(p.lat, p.lng, q.lat, q.lng);
      return d >= DAILY_MIN_SEP_M && d <= WARD_SPREAD_M;
    });
  const grow = (start: number): boolean => {
    if (picks.length === WARD_LAMPS) return true;
    for (let i = start; i < list.length; i++) {
      if (steps > WARD_SEARCH_STEPS) return false;
      const p = list[i]!;
      if (!fits(p)) continue;
      picks.push(p);
      if (grow(i + 1)) return true;
      picks.pop();
    }
    return false;
  };
  if (!grow(0)) return [];
  const ordered: WardPoolLamp[] = [];
  let cur = from;
  const left = [...picks];
  while (left.length) {
    left.sort((a, b) => distM(cur.lat, cur.lng, a.lat, a.lng) - distM(cur.lat, cur.lng, b.lat, b.lng) || a.id.localeCompare(b.id));
    const nxt = left.shift()!;
    ordered.push(nxt);
    cur = nxt;
  }
  return ordered;
}

const ROUTES = new Map<string, WardLamp[]>();
const ROUTES_KEEP = 96;
const POOLS = new Map<CityId, WardPoolLamp[]>();

/** The city's circuit for one city-local day: a pure function of (city, day). [] when the city has none that day. */
export function wardRoute(cityId: CityId, day: string): WardLamp[] {
  const city = Object.hasOwn(CITIES, cityId) ? CITIES[cityId] : null;
  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
  const key = `${cityId}|${day}`;
  const had = ROUTES.get(key);
  if (had) return had;
  let pool = POOLS.get(cityId);
  if (!pool) POOLS.set(cityId, (pool = wardEligible(cityId)));
  const out = wardPick(pool, wardSeed(cityId, day), city.spawn).map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng }));
  if (ROUTES.size >= ROUTES_KEEP) ROUTES.delete(ROUTES.keys().next().value!);
  ROUTES.set(key, out);
  return out;
}

/** The circuit of the city's own local day at `nowMs` (cityDay: the 0.1.7 rest / 0.1.14 district clock). */
export function wardRouteAt(cityId: CityId, nowMs: number): WardLamp[] {
  return Object.hasOwn(CITIES, cityId) ? wardRoute(cityId, cityDay(cityId, nowMs)) : [];
}

/**
 * Fewest milliseconds between lights at two lamps: the Daily Run's spotFloorMs (straight line, less 10%), which is
 * timed at the walk pace, scaled to `topMps` when the account can honestly move faster than a walk (seated: the
 * Sunday Drive seated ceiling for the cars it owns). A light can be made seated, so a walk-pace floor alone would
 * refuse an honest drive. Never looser than the fastest honest speed, never tighter than the walk floor.
 */
export function wardFloorMs(a: { lat: number; lng: number }, b: { lat: number; lng: number }, topMps: number = dailyTopSpeed()): number {
  const walk = dailyTopSpeed();
  const top = Number.isFinite(topMps) && topMps > walk ? topMps : walk;
  return Math.floor((spotFloorMs(a, b) * walk) / top);
}

export type WardRefusal = "route" | "far" | "expired" | "fast" | "done";
/** An earlier light of the same city-day: which lamp, and the server's clock when it was written. */
export type WardLit = { lamp: string; at: number };

/**
 * The server's whole light rule at server time `nowMs`, given this account's earlier lights of the same city-day
 * (`lit`, from its ledger rows) and whether that day's finish has paid.
 *  - "route": the city has no circuit today, or the lamp is not on today's route.
 *  - "done": the finish already paid (nothing more to do today).
 *  - "far": the spot is farther than DAILY_REACH_M from the lamp (the Daily Run's server reach).
 *  - "expired": the first light was more than WARD_WINDOW_MS ago. There is no restart that day.
 *  - "fast": a teleport — less time since an earlier light than the straight line between the two lamps takes at
 *    the account's top honest speed `topMps` (wardFloorMs), less DAILY_JITTER_MS of network slack.
 * A lamp that is already lit passes ("again": the stored row is replayed, nothing new is written).
 */
export function wardCheck(
  city: CityId,
  lampId: string,
  lat: number,
  lng: number,
  nowMs: number,
  lit: readonly WardLit[],
  paid: boolean,
  topMps: number = dailyTopSpeed(),
): { ok: true; lamp: WardLamp; again: boolean } | { ok: false; reason: WardRefusal } {
  const route = wardRouteAt(city, nowMs);
  const lamp = route.find((l) => l.id === lampId);
  if (!lamp) return { ok: false, reason: "route" };
  if (paid) return { ok: false, reason: "done" };
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || distM(lat, lng, lamp.lat, lamp.lng) > DAILY_REACH_M) return { ok: false, reason: "far" };
  const mine = lit.filter((r) => route.some((l) => l.id === r.lamp) && Number.isFinite(r.at));
  if (mine.length && nowMs > Math.min(...mine.map((r) => r.at)) + WARD_WINDOW_MS) return { ok: false, reason: "expired" };
  if (mine.some((r) => r.lamp === lamp.id)) return { ok: true, lamp, again: true };
  for (const r of mine) {
    const other = route.find((l) => l.id === r.lamp)!;
    if (nowMs - r.at < wardFloorMs(other, lamp, topMps) - DAILY_JITTER_MS) return { ok: false, reason: "fast" };
  }
  return { ok: true, lamp, again: false };
}

/** Do these lights finish the route? All four route lamps, every one inside [first, first + window]. */
export function wardFinished(route: readonly WardLamp[], lit: readonly WardLit[]): boolean {
  if (route.length !== WARD_LAMPS) return false;
  const at = route.map((l) => lit.find((r) => r.lamp === l.id)?.at);
  if (at.some((t) => t == null || !Number.isFinite(t))) return false;
  const first = Math.min(...(at as number[]));
  return (at as number[]).every((t) => t >= first && t <= first + WARD_WINDOW_MS);
}

/**
 * Ledger rows to the state at server time `nowMs`. Exact prefixes, the city's own day and route membership are
 * checked here, in JS (ids hold `_`, which a SQL LIKE would read as a wildcard): a row for another day, another
 * city's lamp or an off-route lamp counts for nothing. `at` is the server clock the light row was written with.
 */
export function wardFromRows(rows: readonly { op_key: string; detail?: string | null }[], nowMs: number): WardState {
  const out: WardState = {};
  const lights: Partial<Record<CityId, WardLit[]>> = {};
  const paid = new Set<CityId>();
  for (const r of rows) {
    const k = r.op_key;
    if (k.startsWith(WARD_DONE_PREFIX)) {
      const [city, day, ...rest] = k.slice(WARD_DONE_PREFIX.length).split(":");
      if (rest.length === 0 && city && Object.hasOwn(CITIES, city) && day === cityDay(city as CityId, nowMs) && wardRoute(city as CityId, day).length) paid.add(city as CityId);
      continue;
    }
    if (!k.startsWith(WARD_LIGHT_PREFIX)) continue;
    const [city, day, ...rest] = k.slice(WARD_LIGHT_PREFIX.length).split(":");
    const lamp = rest.join(":");
    if (!city || !day || !lamp || !Object.hasOwn(CITIES, city) || day !== cityDay(city as CityId, nowMs)) continue;
    if (!wardRoute(city as CityId, day).some((l) => l.id === lamp)) continue;
    let at = Number.NaN;
    try {
      const d = JSON.parse(r.detail || "null") as { wd?: unknown; at?: unknown } | null;
      if (d && d.wd === 1 && typeof d.at === "number") at = d.at;
    } catch {
      /* not a light row */
    }
    if (!Number.isFinite(at)) continue;
    const list = (lights[city as CityId] ??= []);
    if (!list.some((x) => x.lamp === lamp)) list.push({ lamp, at });
  }
  for (const city of new Set<CityId>([...(Object.keys(lights) as CityId[]), ...paid])) {
    const day = cityDay(city, nowMs);
    const route = wardRoute(city, day);
    const mine = lights[city] ?? [];
    if (!mine.length) continue;
    out[city] = { day, lit: route.filter((l) => mine.some((r) => r.lamp === l.id)).map((l) => l.id), startedAt: Math.min(...mine.map((r) => r.at)), done: paid.has(city) };
  }
  return out;
}

/** The lights behind one city's state, for the server's own checks (same filtering as wardFromRows). */
export function wardLitOf(rows: readonly { op_key: string; detail?: string | null }[], city: CityId, nowMs: number): WardLit[] {
  const day = cityDay(city, nowMs);
  const out: WardLit[] = [];
  for (const l of wardRoute(city, day)) {
    const row = rows.find((r) => r.op_key === wardLightKey(city, day, l.id));
    if (!row) continue;
    try {
      const d = JSON.parse(row.detail || "null") as { wd?: unknown; at?: unknown } | null;
      if (d && d.wd === 1 && typeof d.at === "number" && Number.isFinite(d.at)) out.push({ lamp: l.id, at: d.at });
    } catch {
      /* not a light row */
    }
  }
  return out;
}

export type WardView = { n: number; phase: "idle" | "open" | "done" | "lapsed"; leftMs: number };

/** What the HUD and the Journal show for one city at `nowMs`; null when the city has no circuit today. */
export function wardView(w: WardState | null | undefined, city: CityId, nowMs: number): WardView | null {
  if (wardRouteAt(city, nowMs).length !== WARD_LAMPS) return null;
  const c = w?.[city];
  if (!c || c.day !== cityDay(city, nowMs) || !c.lit.length) return { n: 0, phase: "idle", leftMs: WARD_WINDOW_MS };
  const n = Math.min(WARD_LAMPS, c.lit.length);
  if (c.done) return { n, phase: "done", leftMs: 0 };
  const leftMs = c.startedAt + WARD_WINDOW_MS - nowMs;
  return leftMs < 0 ? { n, phase: "lapsed", leftMs: 0 } : { n, phase: "open", leftMs };
}

/** "1h 23m" / "23m" / "under 1m". */
export function wardLeftText(ms: number): string {
  const m = Math.floor(Math.max(0, ms) / 60_000);
  if (m < 1) return "under 1m";
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

/** The HUD's one plain-text line. */
export function wardText(v: WardView): string {
  const head = `Ward Circuit ${v.n}/${WARD_LAMPS}`;
  if (v.phase === "done") return `${head} · done`;
  if (v.phase === "lapsed") return `${head} · lapsed`;
  return v.phase === "open" ? `${head} · ${wardLeftText(v.leftMs)} left` : head;
}

/** The Journal's line for today's circuit in the current city. */
export function wardGoalLine(v: WardView): string {
  if (v.phase === "idle") return `${wardText(v)} · reach the four lettered lamps across town, any order, within 2 hours of the first, for ${WARD_COIN} coin`;
  if (v.phase === "done") return `${wardText(v)} · ${WARD_COIN} coin paid. A new circuit comes at the city's midnight`;
  if (v.phase === "lapsed") return `${wardText(v)} · the 2 hours ran out. A new circuit comes at the city's midnight`;
  return wardText(v);
}

export const wardLightLine = (n: number) => `Ward Circuit · lamp ${Math.min(WARD_LAMPS, Math.max(0, Math.floor(n) || 0))}/${WARD_LAMPS}`;
export const wardFinishLine = (coin: number = WARD_COIN) => `Ward Circuit +${coin} coin`;
