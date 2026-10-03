/**
 * Night markets (0.0.46): in each city one street is a night market for one UTC hour, and lamp,
 * trivia card and match rewards earned on that street pay double.
 *
 * Shared and serverless: the street is picked from the city's baked street list (marketStreets.ts)
 * with a seed of city + UTC hour, so every walker in a city sees the same market at the same time.
 *
 * Pure — the bake script (scripts/bake-market-streets.mts), the game store, the map and the tests use these rules.
 */
import { distM, metersPerDegLng } from "./geo.ts";
import { isFreeway, isWalkableWay, type WayTags } from "./walkable.ts";
import { MARKET_STREETS } from "./marketStreets.ts";
import { TIER_VALUE } from "./rewards.ts";
import type { CityId, Poi, Tier } from "./types";

export const MARKET_HOUR_MS = 60 * 60_000;
/** Market rewards pay this many times over. */
export const MARKET_MULT = 2;
/** Candidate streets come from the city's walk within this distance of spawn (same reach as the Lantern Run). */
export const MARKET_RADIUS_M = 1600;
/** A lamp is "on" a street if the street passes this close (lamps sit back from the curb in plazas and parks). */
export const MARKET_LAMP_M = 60;
/** A street match (or a Run/Stack lamp, which sit on the curb) counts if it lies this close to the street. */
export const MARKET_CURB_M = 30;
/** A candidate needs at least this much street inside the radius, so the market is a real walk. */
export const MARKET_MIN_LEN_M = 150;
/** Street classes a market may sit on — walkable streets with a name (no service alleys, tracks or paths). */
export const MARKET_CLASSES = new Set(["pedestrian", "living_street", "residential", "unclassified", "tertiary", "secondary", "primary"]);
/** Names that say freeway even where a stretch is tagged as a surface road (service drives along the trench). */
export const FREEWAY_NAME = /\b(freeway|expressway|motorway|interstate|turnpike|service drive)\b/i;

/** One baked market street: OSM name, highway classes, packed [lat,lng,…] lines, the named lamps on it. */
export type MarketStreet = {
  name: string;
  hw: string[];
  lines: number[][];
  lamps: string[];
  lenM: number;
};

export type OsmWay = { id?: number; tags: WayTags & { name?: string; tunnel?: string; layer?: string }; line: number[] };

// ───────────────────────── eligibility (bake time and tests) ─────────────────────────

const nodeKey = (lat: number, lng: number) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

function find(parent: Map<string, string>, k: string): string {
  let r = k;
  while (parent.get(r) !== r) r = parent.get(r)!;
  let c = k;
  while (parent.get(c) !== r) {
    const n = parent.get(c)!;
    parent.set(c, r);
    c = n;
  }
  return r;
}

/** Union-find over every walkable way (the walkable.ts rule). Returns the component id of each node key. */
export function walkComponents(ways: OsmWay[]) {
  const parent = new Map<string, string>();
  const add = (k: string) => {
    if (!parent.has(k)) parent.set(k, k);
  };
  for (const w of ways) {
    if (!isWalkableWay(w.tags)) continue;
    let prev: string | null = null;
    for (let i = 0; i + 1 < w.line.length; i += 2) {
      const k = nodeKey(w.line[i]!, w.line[i + 1]!);
      add(k);
      if (prev) {
        const a = find(parent, prev);
        const b = find(parent, k);
        if (a !== b) parent.set(a, b);
      }
      prev = k;
    }
  }
  return { comp: (k: string) => (parent.has(k) ? find(parent, k) : null), keys: [...parent.keys()] };
}

/**
 * The walk component that holds the city start: of the walkable nodes within `maxM` of spawn, the one on
 * the biggest connected walk (a spawn on a plaza can sit nearest an island footway that goes nowhere —
 * the walker snaps to the street network around it, not to the island).
 */
export function spawnComponent(ways: OsmWay[], spawn: { lat: number; lng: number }, maxM = 250) {
  const { comp, keys } = walkComponents(ways);
  const size = new Map<string, number>();
  for (const k of keys) {
    const r = comp(k)!;
    size.set(r, (size.get(r) ?? 0) + 1);
  }
  let root: string | null = null;
  for (const k of keys) {
    const [lat, lng] = k.split(",").map(Number) as [number, number];
    if (distM(spawn.lat, spawn.lng, lat, lng) > maxM) continue;
    const r = comp(k)!;
    if (!root || size.get(r)! > size.get(root)!) root = r;
  }
  return { comp, root };
}

/** Is this way part of the walk you can reach on foot from spawn? */
export function wayReachable(w: OsmWay, comp: (k: string) => string | null, root: string | null) {
  if (!root || w.line.length < 4) return false;
  return comp(nodeKey(w.line[0]!, w.line[1]!)) === root;
}

/** Metres from a point to a packed polyline. */
export function distToLine(lat: number, lng: number, line: number[]): number {
  let best = Infinity;
  const kx = metersPerDegLng(lat);
  const ky = 111_320;
  for (let i = 0; i + 3 < line.length; i += 2) {
    const ax = (line[i + 1]! - lng) * kx;
    const ay = (line[i]! - lat) * ky;
    const bx = (line[i + 3]! - lng) * kx;
    const by = (line[i + 2]! - lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const L = dx * dx + dy * dy;
    const t = L > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0;
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best) best = d;
  }
  if (line.length === 2) best = distM(lat, lng, line[0]!, line[1]!);
  return best;
}

export function distToStreet(lat: number, lng: number, s: Pick<MarketStreet, "lines">): number {
  let best = Infinity;
  for (const ln of s.lines) best = Math.min(best, distToLine(lat, lng, ln));
  return best;
}

export function lineLength(line: number[]) {
  let m = 0;
  for (let i = 0; i + 3 < line.length; i += 2) m += distM(line[i]!, line[i + 1]!, line[i + 2]!, line[i + 3]!);
  return m;
}

/** Keep the parts of a line inside the radius (split where it leaves). */
function clipLine(line: number[], spawn: { lat: number; lng: number }, r: number): number[][] {
  const out: number[][] = [];
  let cur: number[] = [];
  for (let i = 0; i + 1 < line.length; i += 2) {
    const inside = distM(spawn.lat, spawn.lng, line[i]!, line[i + 1]!) <= r;
    if (inside) cur.push(line[i]!, line[i + 1]!);
    else if (cur.length) {
      if (cur.length >= 4) out.push(cur);
      cur = [];
    }
  }
  if (cur.length >= 4) out.push(cur);
  return out;
}

/** Douglas–Peucker in metres on a packed line. */
export function simplifyLine(line: number[], tolM = 5): number[] {
  const n = line.length / 2;
  if (n <= 2) return line.slice();
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let worst = -1;
    let wi = -1;
    const seg = [line[a * 2]!, line[a * 2 + 1]!, line[b * 2]!, line[b * 2 + 1]!];
    for (let i = a + 1; i < b; i++) {
      const d = distToLine(line[i * 2]!, line[i * 2 + 1]!, seg);
      if (d > worst) {
        worst = d;
        wi = i;
      }
    }
    if (wi > 0 && worst > tolM) {
      keep[wi] = 1;
      stack.push([a, wi], [wi, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(Math.round(line[i * 2]! * 1e5) / 1e5, Math.round(line[i * 2 + 1]! * 1e5) / 1e5);
  return out;
}

/** Lamps a market can double: every named mark except the outfitter (no trivia card there). */
export function marketLamps(pois: Poi[]) {
  return pois.filter((p) => p.kind !== "shop");
}

export type EligibleWhy = "ok" | "unnamed" | "class" | "freeway" | "unwalkable" | "underground" | "unreachable" | "short" | "no-lamps";

/** Tunnels and lower decks (Lower Wacker, the 2nd Street Tunnel): walkable, but no place for a lit market the map can show. */
export function underground(tags: OsmWay["tags"]): boolean {
  const t = tags.tunnel ?? "";
  if (t && t !== "no") return true;
  const layer = Number(tags.layer ?? 0);
  return Number.isFinite(layer) && layer < 0;
}

/**
 * Night-market candidates for one city from raw OSM ways. A street qualifies when it:
 *  - is a named street of a MARKET_CLASSES class that passes isWalkableWay (walkable.ts), above ground,
 *  - is never a freeway: no way with that name is a motorway/trunk/ramp, and the name isn't a freeway's,
 *  - is reachable on foot from the city start (same walk component as spawn) — unreachable stretches are dropped,
 *  - keeps MARKET_MIN_LEN_M of street within MARKET_RADIUS_M of spawn,
 *  - has at least one lamp (named mark) within MARKET_LAMP_M.
 * Streets are grouped by OSM name; the result is sorted by name so the bake is stable.
 */
export function eligibleStreets(
  ways: OsmWay[],
  spawn: { lat: number; lng: number },
  pois: Poi[],
  opts: { radiusM?: number; lampM?: number; minLenM?: number } = {},
): { streets: MarketStreet[]; why: Map<string, EligibleWhy> } {
  const radiusM = opts.radiusM ?? MARKET_RADIUS_M;
  const lampM = opts.lampM ?? MARKET_LAMP_M;
  const minLenM = opts.minLenM ?? MARKET_MIN_LEN_M;
  const why = new Map<string, EligibleWhy>();
  const freewayNames = new Set<string>();
  for (const w of ways) if (w.tags.name && isFreeway(w.tags)) freewayNames.add(w.tags.name);
  const { comp, root } = spawnComponent(ways, spawn);
  const groups = new Map<string, { hw: Set<string>; lines: number[][] }>();
  for (const w of ways) {
    const name = w.tags.name?.trim();
    if (!name) continue;
    const hw = w.tags.highway ?? "";
    const note = (r: EligibleWhy) => {
      if (!why.has(name) || why.get(name) !== "ok") why.set(name, r);
    };
    if (freewayNames.has(name) || FREEWAY_NAME.test(name) || isFreeway(w.tags)) {
      why.set(name, "freeway");
      continue;
    }
    if (!MARKET_CLASSES.has(hw)) {
      note("class");
      continue;
    }
    if (!isWalkableWay(w.tags)) {
      note("unwalkable");
      continue;
    }
    if (underground(w.tags)) {
      note("underground");
      continue;
    }
    if (!wayReachable(w, comp, root)) {
      note("unreachable");
      continue;
    }
    const clipped = clipLine(w.line, spawn, radiusM);
    if (!clipped.length) {
      note("short");
      continue;
    }
    const g = groups.get(name) ?? { hw: new Set<string>(), lines: [] };
    g.hw.add(hw);
    g.lines.push(...clipped);
    groups.set(name, g);
  }
  const lamps = marketLamps(pois);
  const streets: MarketStreet[] = [];
  for (const [name, g] of groups) {
    if (freewayNames.has(name) || why.get(name) === "freeway") continue;
    const lenM = g.lines.reduce((s, l) => s + lineLength(l), 0);
    if (lenM < minLenM) {
      why.set(name, "short");
      continue;
    }
    const on = lamps.filter((p) => g.lines.some((l) => distToLine(p.lat, p.lng, l) <= lampM)).map((p) => p.id);
    if (!on.length) {
      why.set(name, "no-lamps");
      continue;
    }
    why.set(name, "ok");
    streets.push({ name, hw: [...g.hw].sort(), lines: g.lines.map((l) => simplifyLine(l)), lamps: on.sort(), lenM: Math.round(lenM) });
  }
  streets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { streets, why };
}

// ───────────────────────── schedule (runtime, shared) ─────────────────────────

/** FNV-1a, 32-bit. Stable across engines. */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Whole UTC hours since the epoch. */
export function utcHour(at: number): number {
  return Math.floor(at / MARKET_HOUR_MS);
}

/** "2026-10-03T10" — the UTC hour label that seeds a market. */
export function hourLabel(hour: number): string {
  return new Date(hour * MARKET_HOUR_MS).toISOString().slice(0, 13);
}

/** The seed for one city in one UTC hour. */
export function marketSeed(city: CityId, hour: number): number {
  return hash32(`keyline-night-market|${city}|${hourLabel(hour)}`);
}

/** That city-hour's seeded street, stepping forward past any index in `skip`. */
function draw(city: CityId, hour: number, n: number, skip: Set<number>): number {
  const start = marketSeed(city, hour) % n;
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (!skip.has(i)) return i;
  }
  return start;
}

/**
 * Which street index runs the market in this hour. Even UTC hours take their seeded draw;
 * odd hours take their seeded draw but step past both even neighbours' streets — so the
 * market never sits on the same street two hours running, and any hour can be worked out
 * from its own seed and its neighbours' (no chain back to the epoch, no server).
 */
export function marketIndex(city: CityId, hour: number, n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return hour % 2;
  if (hour % 2 === 0) return draw(city, hour, n, new Set());
  const prev = draw(city, hour - 1, n, new Set());
  const next = draw(city, hour + 1, n, new Set());
  return draw(city, hour, n, new Set([prev, next]));
}

export type NightMarket = {
  city: CityId;
  hour: number;
  street: MarketStreet;
  startsAt: number;
  endsAt: number;
};

export function marketStreets(city: CityId): MarketStreet[] {
  return MARKET_STREETS[city] ?? [];
}

/** The market open in this city at this moment (null only if a city has no eligible street). */
export function marketAt(city: CityId, at: number, streets: MarketStreet[] = marketStreets(city)): NightMarket | null {
  if (!streets.length) return null;
  const hour = utcHour(at);
  const street = streets[marketIndex(city, hour, streets.length)]!;
  return { city, hour, street, startsAt: hour * MARKET_HOUR_MS, endsAt: (hour + 1) * MARKET_HOUR_MS };
}

/** The next hour's market (for the Journal's "next" line). */
export function nextMarket(city: CityId, at: number, streets: MarketStreet[] = marketStreets(city)) {
  return marketAt(city, (utcHour(at) + 1) * MARKET_HOUR_MS, streets);
}

/** "42 min left" / "under a minute". */
export function marketLeft(m: NightMarket, at: number): string {
  const ms = Math.max(0, m.endsAt - at);
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "under a minute left";
  return `${min} min left`;
}

/** Midpoint of the market's longest line — where the map marker sits. */
export function marketAnchor(s: MarketStreet): { lat: number; lng: number } {
  let best = s.lines[0] ?? [];
  for (const l of s.lines) if (lineLength(l) > lineLength(best)) best = l;
  const half = lineLength(best) / 2;
  let acc = 0;
  for (let i = 0; i + 3 < best.length; i += 2) {
    const d = distM(best[i]!, best[i + 1]!, best[i + 2]!, best[i + 3]!);
    if (acc + d >= half) {
      const t = d > 0 ? (half - acc) / d : 0;
      return { lat: best[i]! + (best[i + 2]! - best[i]!) * t, lng: best[i + 1]! + (best[i + 3]! - best[i + 1]!) * t };
    }
    acc += d;
  }
  return { lat: best[0] ?? 0, lng: best[1] ?? 0 };
}

/** A seeded-at-random point along the market street (where the next street match drops while it's open). */
export function pointOnMarket(s: MarketStreet, rnd: () => number = Math.random): { lat: number; lng: number } {
  const total = s.lines.reduce((t, l) => t + lineLength(l), 0);
  let want = rnd() * total;
  for (const l of s.lines) {
    for (let i = 0; i + 3 < l.length; i += 2) {
      const d = distM(l[i]!, l[i + 1]!, l[i + 2]!, l[i + 3]!);
      if (want <= d) {
        const t = d > 0 ? want / d : 0;
        return { lat: l[i]! + (l[i + 2]! - l[i]!) * t, lng: l[i + 1]! + (l[i + 3]! - l[i + 1]!) * t };
      }
      want -= d;
    }
  }
  return marketAnchor(s);
}

// ───────────────────────── doubling scope ─────────────────────────

/**
 * What a night market doubles — and what it never touches. One table so the store, the reward UI
 * and the tests agree.
 */
export const MARKET_DOUBLES = {
  lampCoin: true, // trivia-card coin at a lamp on the street (before boosts and cloth tips)
  lampMatches: true, // bonus matches a lamp's trivia card pays (lucky charm, perfect blue)
  spark: true, // the match a spark earns at a lamp on the street
  seriesCoin: true, // The Run / The Stack, when its lamp stands on the street
  seriesMatches: true,
  streetMatch: true, // a match picked up off the market street
  dailyRun: false, // Daily Lantern Run finish (2 white + 1 blue) — server-checked, never doubled
  printShop: false, // print shop / crafting prices
  bank: false, // bank exchange (4 up / 3 down)
  ride: false, // ride mini-game payouts
  boosts: false, // boost cards, goals, contracts, train tickets, wheel, quests, cloth tips
  materials: false, // brass, ink, vellum, schematics, press ingredients
  clears: false, // leaderboard clears count one per trivia card
} as const;

export type MarketSpot =
  | { kind: "lamp"; poiId: string; lat: number; lng: number }
  | { kind: "series"; lat: number; lng: number }
  | { kind: "match"; lat: number; lng: number };

/** Is this reward spot on the market street? Named lamps use the baked list; the rest are measured. */
export function onMarket(m: NightMarket | null, spot: MarketSpot): boolean {
  if (!m) return false;
  if (spot.kind === "lamp" && m.street.lamps.includes(spot.poiId)) return true;
  const reach = spot.kind === "lamp" ? MARKET_LAMP_M : MARKET_CURB_M;
  return distToStreet(spot.lat, spot.lng, m.street) <= reach;
}

/** Multiplier for a reward earned at this spot at this moment (1 or MARKET_MULT). */
export function marketMult(city: CityId, at: number, spot: MarketSpot, streets?: MarketStreet[]): number {
  return onMarket(marketAt(city, at, streets), spot) ? MARKET_MULT : 1;
}

/** Double a match bundle (bonus matches from a lamp or a series). */
export function doubleKeys(keys: Partial<Record<Tier, number>>, mult: number): Partial<Record<Tier, number>> {
  if (mult === 1) return { ...keys };
  const out: Partial<Record<Tier, number>> = {};
  for (const [t, n] of Object.entries(keys) as [Tier, number][]) if (n) out[t] = n * mult;
  return out;
}

export const MARKET_TAG = `Night market ×${MARKET_MULT}`;

/** Coin and bonus matches a lamp or series pays, after the market. `extra` is what the market added. */
export function marketPay(coin: number, keys: Partial<Record<Tier, number>>, mult: number) {
  const paidKeys = doubleKeys(keys, mult);
  const base = Object.values(keys).reduce((t: number, n) => t + (n ?? 0), 0);
  return { coin: coin * mult, keys: paidKeys, extraCoin: coin * (mult - 1), extraMatches: base * (mult - 1) };
}

/** Matches a spark (or a street pick-up) adds: `mult` of them, but never past the pocket cap (at least 1). */
export function marketMatches(have: number, cap: number, mult: number): number {
  return Math.max(1, Math.min(mult, cap - have));
}

/**
 * A market match that won't fit the pocket pays its ladder value in coin instead (as a full pocket does for the
 * Lantern Run and a spark), so the ×2 is never lost to the cap. `added` is what marketMatches let in.
 */
export function marketOverflowCoin(tier: Tier, mult: number, added: number): number {
  return Math.max(0, mult - added) * TIER_VALUE[tier];
}

/** Closest point on the market street to a walker (where the HUD line walks you). */
export function closestOnStreet(s: Pick<MarketStreet, "lines">, lat: number, lng: number): { lat: number; lng: number; dist: number } {
  let best = { lat: s.lines[0]?.[0] ?? lat, lng: s.lines[0]?.[1] ?? lng, dist: Infinity };
  const kx = metersPerDegLng(lat);
  const ky = 111_320;
  for (const l of s.lines) {
    for (let i = 0; i + 3 < l.length; i += 2) {
      const ax = (l[i + 1]! - lng) * kx;
      const ay = (l[i]! - lat) * ky;
      const dx = (l[i + 3]! - l[i + 1]!) * kx;
      const dy = (l[i + 2]! - l[i]!) * ky;
      const L = dx * dx + dy * dy;
      const t = L > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0;
      const d = Math.hypot(ax + t * dx, ay + t * dy);
      if (d < best.dist) best = { lat: l[i]! + (l[i + 2]! - l[i]!) * t, lng: l[i + 1]! + (l[i + 3]! - l[i + 1]!) * t, dist: d };
    }
  }
  return best;
}
