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
import type { CityId, Poi, Tier } from "./types";
import { CITIES } from "./data.ts";

/** 0.1.2: a market cycle is 15 minutes: open 10, dark 5, then it reopens at a new spot. "hour" fields now count cycles. */
export const MARKET_OPEN_MS = 10 * 60_000;
export const MARKET_DARK_MS = 5 * 60_000;
export const MARKET_HOUR_MS = MARKET_OPEN_MS + MARKET_DARK_MS;
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
export const MARKET_CLASSES = new Set(["pedestrian", "living_street", "residential", "unclassified", "tertiary", "secondary", "primary", "footway", "path"]);
/** 0.0.90: a market street wants at least this many lamps within MARKET_LAMP_M… */
export const MARKET_MIN_LAMPS = 3;
/** …and when a city has fewer than this many such streets, it takes its best-lit streets instead. */
export const MARKET_MIN_STREETS = 4;
/** 0.0.90: lamps on the open market street relight this many times faster. */
export const MARKET_RELIGHT = 3;

/** A lamp's dark time: a third while it stands on the open market (mult > 1). */
export function marketCoolMs(baseMs: number, mult: number): number {
  return mult > 1 ? Math.round(baseMs / MARKET_RELIGHT) : baseMs;
}
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
  return pois.filter((p) => p.kind !== "shop" && p.kind !== "counter" && p.kind !== "board");
}

export type EligibleWhy = "ok" | "unnamed" | "class" | "freeway" | "unwalkable" | "underground" | "unreachable" | "short" | "no-lamps" | "few-lamps";

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
 *  - has at least MARKET_MIN_LAMPS lamps (named marks) within MARKET_LAMP_M — or, in a city with fewer than
 *    MARKET_MIN_STREETS such streets, is one of its MARKET_MIN_STREETS best-lit streets (0.0.90; was one lamp).
 * Named footways and paths count too (0.0.90), still only if they pass isWalkableWay; never freeways or service drives.
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
  const lit = streets.filter((s) => s.lamps.length >= MARKET_MIN_LAMPS);
  let keep = lit;
  if (lit.length < MARKET_MIN_STREETS) {
    const best = [...streets].sort((a, b) => b.lamps.length - a.lamps.length || b.lenM - a.lenM || (a.name < b.name ? -1 : 1));
    keep = best.slice(0, Math.max(MARKET_MIN_STREETS, lit.length));
  }
  for (const s of streets) if (!keep.includes(s)) why.set(s.name, "few-lamps");
  keep.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { streets: keep, why };
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

/** "2026-10-03T10:15" — the UTC start of the cycle that seeds a market. */
export function hourLabel(hour: number): string {
  return new Date(hour * MARKET_HOUR_MS).toISOString().slice(0, 16);
}

/** The seed for one city in one UTC hour. */
export function marketSeed(city: CityId, hour: number): number {
  return hash32(`keyline-night-market|${city}|${hourLabel(hour)}`);
}

/**
 * That city-hour's seeded street, stepping forward past any index in `skip`. With `weights` (0.0.90: lamp
 * counts) the seed lands on a street in proportion to its weight, so better-lit streets run more often.
 */
function draw(city: CityId, hour: number, n: number, skip: Set<number>, weights?: readonly number[]): number {
  let start = marketSeed(city, hour) % n;
  if (weights && weights.length === n) {
    const total = weights.reduce((a, w) => a + Math.max(1, w), 0);
    let r = marketSeed(city, hour) % total;
    for (let i = 0; i < n; i++) {
      r -= Math.max(1, weights[i]!);
      if (r < 0) {
        start = i;
        break;
      }
    }
  }
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
export function marketIndex(city: CityId, hour: number, n: number, weights?: readonly number[]): number {
  if (n <= 1) return 0;
  if (n === 2) return hour % 2;
  if (hour % 2 === 0) return draw(city, hour, n, new Set(), weights);
  const prev = draw(city, hour - 1, n, new Set(), weights);
  const next = draw(city, hour + 1, n, new Set(), weights);
  return draw(city, hour, n, new Set([prev, next]), weights);
}

/** 0.1.00: a market is a zone (2-4 blocks) around a square/park by the market street; every lamp inside counts. */
export type MarketZone = { lat: number; lng: number; r: number; lamps: string[]; plaza: string | null };
export const ZONE_MIN_R = 200;
export const ZONE_MAX_R = 400;
/** Sparse downtowns may stretch to this to reach the floor. */
export const ZONE_STRETCH_R = 600;
/** A zone grows (up to ZONE_MAX_R) until it holds ZONE_GROW_LAMPS lamps. */
export const ZONE_GROW_LAMPS = 5;
/** Size floor: a market whose zone ends with fewer lamps than this is never picked. */
export const ZONE_MIN_LAMPS = 3;
const PLAZA_NEAR_M = 300;

/** Zones of one city sit at least this far apart, so the rotation actually moves (Chicago's streets all met at Crown Fountain). */
export const ZONE_APART_M = 500;
export function marketZone(s: MarketStreet, pois: readonly Poi[], avoid: readonly { lat: number; lng: number }[] = []): MarketZone {
  const lamps = marketLamps([...pois]);
  const count = (c: { lat: number; lng: number }, rr: number) => lamps.filter((p) => distM(c.lat, c.lng, p.lat, p.lng) <= rr).length;
  // Candidate centres: parks/squares near the street (preferred on ties), then points along the street.
  const along: { lat: number; lng: number; plaza: string | null }[] = [];
  for (const l of s.lines) for (let i = 0; i + 1 < l.length; i += 2) along.push({ lat: l[i]!, lng: l[i + 1]!, plaza: null });
  const parks = pois
    .filter((p) => p.kind === "park" && along.some((q) => distM(q.lat, q.lng, p.lat, p.lng) <= PLAZA_NEAR_M))
    .map((p) => ({ lat: p.lat, lng: p.lng, plaza: p.name as string | null }));
  const clear = (c: { lat: number; lng: number }) => avoid.every((a) => distM(a.lat, a.lng, c.lat, c.lng) >= ZONE_APART_M);
  const cands = [...parks, ...along].filter(clear);
  const pool = cands.length ? cands : [...parks, ...along];
  let best = pool[0] ?? { ...marketAnchor(s), plaza: null };
  let bestN = -1;
  for (const c of pool) {
    const n = count(c, ZONE_MIN_R) + (c.plaza ? 0.5 : 0);
    if (n > bestN) [best, bestN] = [c, n];
  }
  let r = ZONE_MIN_R;
  while (r < ZONE_MAX_R && count(best, r) < ZONE_GROW_LAMPS) r += 25;
  while (r < ZONE_STRETCH_R && count(best, r) < ZONE_MIN_LAMPS) r += 25;
  const inside = lamps.filter((p) => distM(best.lat, best.lng, p.lat, p.lng) <= r).map((p) => p.id);
  return { lat: best.lat, lng: best.lng, r, lamps: inside, plaza: best.plaza };
}

const ZONES = new Map<string, MarketZone>();
export function zoneOf(city: CityId, s: MarketStreet): MarketZone {
  const k = `${city}|${s.name}`;
  let z = ZONES.get(k);
  if (!z) {
    // Zones are laid out once per city, street by street in name order, each kept clear of the ones before.
    const pois = CITIES[city]?.pois ?? [];
    const placed: MarketZone[] = [];
    for (const st of marketStreets(city)) {
      const zz = marketZone(st, pois, placed);
      placed.push(zz);
      ZONES.set(`${city}|${st.name}`, zz);
    }
    z = ZONES.get(k) ?? marketZone(s, pois);
    ZONES.set(k, z);
  }
  return z;
}

export function inZone(z: MarketZone, lat: number, lng: number): boolean {
  return distM(z.lat, z.lng, lat, lng) <= z.r;
}

export type NightMarket = {
  city: CityId;
  hour: number;
  street: MarketStreet;
  zone: MarketZone;
  startsAt: number;
  endsAt: number;
};

/** 0.0.95: a market needs at least this much connected walkable street (same-name pieces that touch merge). */
export const MARKET_MIN_RUN_M = 300;
/** Pieces whose ends sit this close count as touching (the bake simplifies and clips lines). */
const JOIN_M = 15;

/** Connected runs of a street: same-name pieces whose endpoints touch, merged. Longest first. */
export function streetRuns(lines: readonly number[][]): { lines: number[][]; lenM: number }[] {
  const n = lines.length;
  const parent = lines.map((_, i) => i);
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i]!)));
  const ends = lines.map((l) => [[l[0]!, l[1]!], [l[l.length - 2]!, l[l.length - 1]!]] as const);
  const pts = (l: readonly number[]) => {
    const out: [number, number][] = [];
    for (let i = 0; i + 1 < l.length; i += 2) out.push([l[i]!, l[i + 1]!]);
    return out;
  };
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) {
      if (root(a) === root(b)) continue;
      // An end of one piece touching any vertex of the other (T-joins, simplified ends).
      const touch =
        ends[a]!.some(([la, ln]) => pts(lines[b]!).some(([lb, mb]) => distM(la, ln, lb, mb) <= JOIN_M)) ||
        ends[b]!.some(([la, ln]) => pts(lines[a]!).some(([lb, mb]) => distM(la, ln, lb, mb) <= JOIN_M));
      if (touch) parent[root(a)] = root(b);
    }
  const groups = new Map<number, number[][]>();
  lines.forEach((l, i) => {
    const r = root(i);
    groups.set(r, [...(groups.get(r) ?? []), l]);
  });
  return [...groups.values()].map((g) => ({ lines: g, lenM: g.reduce((t, l) => t + lineLength(l), 0) })).sort((x, y) => y.lenM - x.lenM);
}

/**
 * 0.0.95: the market runs only on its longest connected stretch, and only streets whose stretch is at least
 * MARKET_MIN_RUN_M qualify ("like 3 dots" in Temple). A city with none keeps its single longest stretch.
 */
export function fitMarketStreets(all: readonly MarketStreet[], minRunM = MARKET_MIN_RUN_M): MarketStreet[] {
  const fitted = all.map((s) => {
    const run = streetRuns(s.lines)[0];
    if (!run) return { ...s, lenM: 0 };
    return { ...s, lines: run.lines, lenM: Math.round(run.lenM) };
  });
  const long = fitted.filter((s) => s.lenM >= minRunM);
  if (long.length) return long;
  const best = [...fitted].sort((a, b) => b.lenM - a.lenM)[0];
  return best ? [best] : [];
}

const FITTED = new Map<CityId, MarketStreet[]>();

export function marketStreets(city: CityId): MarketStreet[] {
  let s = FITTED.get(city);
  if (!s) {
    const fit = fitMarketStreets(MARKET_STREETS[city] ?? []);
    // 0.1.00: prefer markets whose zone clears the lamp floor; keep 3 so the hour rotates (best-lit fill-ins).
    const pois = CITIES[city]?.pois ?? [];
    const lit = (x: MarketStreet) => marketZone(x, pois).lamps.length;
    const ok = fit.filter((x) => lit(x) >= ZONE_MIN_LAMPS);
    s = ok.length >= 3 || ok.length === fit.length ? ok : [...fit].sort((a, b) => lit(b) - lit(a)).slice(0, Math.min(3, fit.length));
    FITTED.set(city, s);
  }
  return s;
}

/** The market open in this city at this moment (null only if a city has no eligible street). */
export function marketAt(city: CityId, at: number, streets: MarketStreet[] = marketStreets(city)): NightMarket | null {
  if (!streets.length) return null;
  const hour = utcHour(at);
  // 0.1.2: dark for the last 5 minutes of each cycle (the server's wallet checks this same clock).
  if (at - hour * MARKET_HOUR_MS >= MARKET_OPEN_MS) return null;
  return cycleMarket(city, hour, streets);
}

function cycleMarket(city: CityId, hour: number, streets: MarketStreet[]): NightMarket {
  const street = streets[marketIndex(city, hour, streets.length, streets.map((s) => s.lamps.length))]!;
  return { city, hour, street, zone: zoneOf(city, street), startsAt: hour * MARKET_HOUR_MS, endsAt: hour * MARKET_HOUR_MS + MARKET_OPEN_MS };
}

/** The next market to open (the one after this cycle, open or dark). */
export function nextMarket(city: CityId, at: number, streets: MarketStreet[] = marketStreets(city)) {
  if (!streets.length) return null;
  return cycleMarket(city, utcHour(at) + 1, streets);
}

/** "m:ss" countdown. */
export function clock(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** "42 min left" / "under a minute". */
export function marketLeft(m: NightMarket, at: number): string {
  const ms = Math.max(0, m.endsAt - at);
  return `closes in ${clock(ms)}`;
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
  // 0.1.00: anything inside the market zone counts.
  if (m.zone && (inZone(m.zone, spot.lat, spot.lng) || (spot.kind === "lamp" && m.zone.lamps.includes(spot.poiId)))) return true;
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
export function marketMatches(_have: number, _cap: number, mult: number): number {
  // 0.0.97: all `mult` land; a full pocket turns the extras into merge credits (goals.ts settlePocket).
  return Math.max(1, mult);
}

/**
 * A market match that won't fit the pocket pays its ladder value in coin instead (as a full pocket does for the
 * Lantern Run and a spark), so the ×2 is never lost to the cap. `added` is what marketMatches let in.
 */
export function marketOverflowCoin(_tier: Tier, _mult: number, _added: number): number {
  // 0.0.97: overflow merges up instead of paying coin.
  return 0;
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
