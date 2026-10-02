/**
 * Route puzzle — a ride game for 6 minute and longer trips. A small map of real places in the
 * city ahead: a start, a finish and three or four stops between. Tap the stops in the order that
 * makes the shortest trip from start to finish. Distances are straight-line hops, the same thing
 * the map shows, so everything you need is on screen.
 * Pure — no store, no DOM — so node tests can run it straight.
 */
import type { Poi, PoiKind } from "./types";
import { seededRng, type RideOutcome } from "./rideGames.ts";
export { ROUTE_ROUND_MAX_MS, ROUTE_ROUND_MIN_MS, routeRoundMs } from "./rideGames.ts";

/** Routes per round, and how many stops each one has between start and finish. */
export const ROUTE_SIZES: readonly number[] = [3, 4, 4];
export const ROUTE_PUZZLES = ROUTE_SIZES.length;
/** Points needed to win a round: a shortest route is 1, a close one 0.5. */
export const ROUTE_WIN = 2;
/** Within this of the shortest counts as close. */
export const ROUTE_CLOSE = 0.9;
/** The shortest order must beat every other order by at least this much, so there's one right answer. */
export const ROUTE_MARGIN = 1.06;
/** No two places on one map closer than this share of the map's longer side, so taps can't miss. */
export const ROUTE_MIN_GAP = 0.14;
/** How long the answer stays up before the next map. */
export const ROUTE_REVEAL_MS = 2_600;
/** Letters the stops wear on the map, the list and the keyboard. */
export const STOP_LETTERS = ["A", "B", "C", "D", "E"] as const;

export type RouteStop = { id: string; name: string; kind: PoiKind; letter: string; x: number; y: number };
/** x, y are 0–1 on the map panel, y down. */
export type RoutePoint = { id: string; name: string; kind: PoiKind; x: number; y: number };
export type RoutePuzzleMap = {
  start: RoutePoint;
  finish: RoutePoint;
  /** In letter order (A, B, C…), which is never the shortest order. */
  stops: RouteStop[];
  /** Stop ids in the shortest order. */
  best: string[];
  /** Metres. */
  bestM: number;
  /** The runner-up order's length, for the margin. */
  nextM: number;
};

type Pt = { p: Poi; x: number; y: number };

/** Places a route can use: real, unique, not shops and not game-made marks. */
export function routePool(pois: readonly Poi[]): Poi[] {
  const ids = new Set<string>();
  const names = new Set<string>();
  return pois.filter((p) => {
    if (p.kind === "shop" || p.noClue || ids.has(p.id) || names.has(p.name)) return false;
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
    ids.add(p.id);
    names.add(p.name);
    return true;
  });
}

/** Local metres east/north of a reference point. Plenty for a few kilometres. */
function project(ps: readonly Poi[], lat0: number, lng0: number): Pt[] {
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  return ps.map((p) => ({ p, x: (p.lng - lng0) * kx, y: (p.lat - lat0) * 110_540 }));
}

const hop = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

function permutations<T>(xs: readonly T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  const out: T[][] = [];
  xs.forEach((x, i) => {
    for (const rest of permutations([...xs.slice(0, i), ...xs.slice(i + 1)])) out.push([x, ...rest]);
  });
  return out;
}

/** Length of start → stops in this order → finish, in the units of the points. */
export function routeLength(start: { x: number; y: number }, order: readonly { x: number; y: number }[], finish: { x: number; y: number }) {
  let d = 0;
  let at = start;
  for (const s of order) {
    d += hop(at, s);
    at = s;
  }
  return d + hop(at, finish);
}

/** Every order, shortest first. */
function rankOrders(start: Pt, stops: Pt[], finish: Pt) {
  return permutations(stops)
    .map((o) => ({ o, d: routeLength(start, o, finish) }))
    .sort((a, b) => a.d - b.d);
}

function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Search radii, tight first: a walkable cluster reads best, the whole city is the fallback. */
const RADII_M = [2_500, 5_000, 12_000, Number.POSITIVE_INFINITY];

/** One map with `size` stops, or null when this city can't make one. `avoid` ids are used only as a last resort. */
export function makeRoute(pois: readonly Poi[], size: number, rnd: () => number, avoid: ReadonlySet<string> = new Set()): RoutePuzzleMap | null {
  const pool = routePool(pois);
  const need = size + 2;
  if (pool.length < need) return null;
  for (const allowUsed of [false, true]) {
    const base = allowUsed ? pool : pool.filter((p) => !avoid.has(p.id));
    if (base.length < need) continue;
    for (const radius of RADII_M) {
      for (let attempt = 0; attempt < 120; attempt++) {
        const hub = base[Math.floor(rnd() * base.length)]!;
        const near = project(base, hub.lat, hub.lng).filter((q) => hop(q, { x: 0, y: 0 }) <= radius);
        if (near.length < need) continue;
        const pick = shuffle(near, rnd).slice(0, need);
        const got = build(pick, rnd);
        if (got) return got;
      }
    }
  }
  return null;
}

/** Turn six-ish projected places into a map, or null if it's cramped or has no single best order. */
function build(pick: Pt[], rnd: () => number): RoutePuzzleMap | null {
  // Start and finish are the farthest-apart pair, so the trip has a direction.
  let si = 0;
  let fi = 1;
  let far = -1;
  for (let i = 0; i < pick.length; i++)
    for (let j = i + 1; j < pick.length; j++) {
      const d = hop(pick[i]!, pick[j]!);
      if (d > far) [far, si, fi] = [d, i, j];
    }
  if (rnd() < 0.5) [si, fi] = [fi, si];
  const start = pick[si]!;
  const finish = pick[fi]!;
  const stops = pick.filter((_, i) => i !== si && i !== fi);
  // Fit the map: normalise to the longer side, keep the aspect.
  const xs = pick.map((q) => q.x);
  const ys = pick.map((q) => q.y);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const span = Math.max(Math.max(...xs) - minX, maxY - Math.min(...ys), 1);
  for (let i = 0; i < pick.length; i++)
    for (let j = i + 1; j < pick.length; j++) if (hop(pick[i]!, pick[j]!) / span < ROUTE_MIN_GAP) return null;
  const ranked = rankOrders(start, stops, finish);
  const best = ranked[0]!;
  const next = ranked[1]!;
  if (next.d < best.d * ROUTE_MARGIN) return null;
  const at = (q: Pt) => ({ x: (q.x - minX) / span, y: (maxY - q.y) / span });
  const pt = (q: Pt): RoutePoint => ({ id: q.p.id, name: q.p.name, kind: q.p.kind, ...at(q) });
  // Letters in an order that isn't already the answer.
  let lettered = shuffle(stops, rnd);
  for (let k = 0; k < 6 && lettered.every((q, i) => q === best.o[i]); k++) lettered = shuffle(stops, rnd);
  if (lettered.every((q, i) => q === best.o[i])) lettered = [...lettered.slice(1), lettered[0]!];
  return {
    start: pt(start),
    finish: pt(finish),
    stops: lettered.map((q, i) => ({ ...pt(q), letter: STOP_LETTERS[i]! })),
    best: best.o.map((q) => q.p.id),
    bestM: Math.round(best.d),
    nextM: Math.round(next.d),
  };
}

/** Maps for round `round` (0-based) of a ride. Seeded by the ride, so a reload deals the same maps. */
export function routeRound(pois: readonly Poi[], rideSeed: number, round: number): RoutePuzzleMap[] {
  const rnd = seededRng(Math.floor(rideSeed) * 31 + Math.max(0, round) * 7919 + 3);
  const used = new Set<string>();
  const out: RoutePuzzleMap[] = [];
  for (const size of ROUTE_SIZES) {
    const m = makeRoute(pois, size, rnd, used);
    if (!m) continue;
    for (const id of [m.start.id, m.finish.id, ...m.stops.map((s) => s.id)]) used.add(id);
    out.push(m);
  }
  return out;
}

/** Map-unit length of an order (0–1 panel units), for grading without the POI list. */
export function orderSpan(m: RoutePuzzleMap, order: readonly string[]) {
  const byId = new Map(m.stops.map((s) => [s.id, s]));
  return routeLength(m.start, order.map((id) => byId.get(id)!), m.finish);
}

export type RouteGrade = "shortest" | "close" | "long";

/** Grade a full order against the map. The answer is unique (ROUTE_MARGIN), so "shortest" means the same order. */
export function gradeRoute(m: RoutePuzzleMap, order: readonly string[]): { grade: RouteGrade; ratio: number; metres: number } {
  if (order.length !== m.stops.length || new Set(order).size !== order.length) return { grade: "long", ratio: 0, metres: 0 };
  if (order.every((id, i) => id === m.best[i])) return { grade: "shortest", ratio: 1, metres: m.bestM };
  const ratio = orderSpan(m, m.best) / Math.max(1e-9, orderSpan(m, order));
  const metres = Math.round(m.bestM / Math.max(1e-9, ratio));
  return { grade: ratio >= ROUTE_CLOSE ? "close" : "long", ratio, metres };
}

export type RouteTally = { total: number; done: number; shortest: number; close: number };

export function routeScore(t: Pick<RouteTally, "shortest" | "close">) {
  return t.shortest + t.close * 0.5;
}

/** Every map of a full round on its shortest route. Earns the flat perfect-round bonus. */
export function routePerfect(t: RouteTally) {
  return t.total >= ROUTE_PUZZLES && t.done >= t.total && t.shortest >= t.total;
}

/** Win at 2 points of 3 (shortest 1, close ½); perf runs 0 → 1 from there to a clean sheet. */
export function routeOutcome(t: RouteTally): RideOutcome {
  const score = routeScore(t);
  const need = Math.min(ROUTE_WIN, t.total);
  if (t.total > 0 && score >= need) {
    const perf = t.total > need ? Math.min(1, (score - need) / (t.total - need)) : 1;
    return routePerfect(t) ? { kind: "won", perf, perfect: true } : { kind: "won", perf };
  }
  return { kind: "played" };
}

/** Kilometres for the screen. */
export function km(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

/** End-of-round line, in the conductor's voice. */
export function routeVerdict(t: RouteTally, city: string) {
  const of = `${t.shortest} of ${t.total} on the shortest route.`;
  if (routePerfect(t)) return `${of} You could drive a cab in ${city}.`;
  if (routeOutcome(t).kind === "won") return `${of} Near enough to get paid.`;
  if (t.done < t.total) return `${of} The clock beat you. The seat still pays.`;
  return `${of} The long way round. You still get the carriage rate.`;
}
