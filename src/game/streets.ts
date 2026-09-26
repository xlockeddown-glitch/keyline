import { dest, distM, metersPerDegLng, yawToTarget } from "./geo.ts";
import { getOsmWays } from "./streetApi.ts";
import type { Poi, Tier } from "./types";

export type Pt = { lat: number; lng: number };

type Seg = { a: number; b: number; length: number; arterial: boolean };

export type Snap = {
  lat: number;
  lng: number;
  dist: number;
  seg: number;
  t: number;
};

export type StreetGraph = {
  nodes: Pt[];
  segs: Seg[];
  adj: number[][];
  originLat: number;
  originLng: number;
  grid: Map<string, number[]>;
  nodeIndex: Map<string, number>;
  cell: number;
  covers: { lat: number; lng: number; r: number }[];
};

const M_PER_DEG_LAT = 111_320;
const CELL = 80;
const MERGE = 1e-5;
const MIN_SEG = 2.2;
const DECIMATE = 12;
const HIGHWAY =
  "primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|pedestrian|footway|path|steps|cycleway|service|track|bridleway|corridor";
const HIGHWAY_DRIVE =
  "primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service";
const ARTERIAL = new Set(["primary", "primary_link", "secondary", "secondary_link"]);
/** These OSM classes cut through Manhattan blocks. Keep the curb, not the shortcut. */
const WALK_SKIP = new Set(["footway", "path", "steps", "cycleway", "track", "bridleway", "corridor", "service"]);
const OSRM_FOOT = [
  "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
  "https://router.project-osrm.org/route/v1/foot",
];
const OVERPASS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const OSRM_DRIVE = [
  "https://router.project-osrm.org/route/v1/driving",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving",
];

function nodeKey(lat: number, lng: number) {
  return `${(Math.round(lat / MERGE) * MERGE).toFixed(5)},${(Math.round(lng / MERGE) * MERGE).toFixed(5)}`;
}

function toXY(g: StreetGraph, lat: number, lng: number) {
  return {
    x: (lng - g.originLng) * metersPerDegLng(g.originLat),
    y: (lat - g.originLat) * M_PER_DEG_LAT,
  };
}

function cellKey(ix: number, iy: number) {
  return `${ix},${iy}`;
}

export function createGraph(lat: number, lng: number): StreetGraph {
  return {
    nodes: [],
    segs: [],
    adj: [],
    originLat: lat,
    originLng: lng,
    grid: new Map(),
    nodeIndex: new Map(),
    cell: CELL,
    covers: [],
  };
}

function addNode(g: StreetGraph, lat: number, lng: number) {
  const k = nodeKey(lat, lng);
  const existing = g.nodeIndex.get(k);
  if (existing !== undefined) return existing;
  const id = g.nodes.length;
  g.nodes.push({ lat, lng });
  g.adj.push([]);
  g.nodeIndex.set(k, id);
  return id;
}

function coverSeg(g: StreetGraph, a: Pt, b: Pt, segId: number) {
  const pa = toXY(g, a.lat, a.lng);
  const pb = toXY(g, b.lat, b.lng);
  const minx = Math.min(pa.x, pb.x);
  const maxx = Math.max(pa.x, pb.x);
  const miny = Math.min(pa.y, pb.y);
  const maxy = Math.max(pa.y, pb.y);
  const x0 = Math.floor(minx / g.cell);
  const x1 = Math.floor(maxx / g.cell);
  const y0 = Math.floor(miny / g.cell);
  const y1 = Math.floor(maxy / g.cell);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const key = cellKey(x, y);
      const list = g.grid.get(key);
      if (list) list.push(segId);
      else g.grid.set(key, [segId]);
    }
  }
}

function addSeg(g: StreetGraph, ia: number, ib: number, arterial = false) {
  if (ia === ib) return;
  for (const s of g.adj[ia]!) {
    const seg = g.segs[s]!;
    if ((seg.a === ia && seg.b === ib) || (seg.a === ib && seg.b === ia)) {
      if (arterial) seg.arterial = true;
      return;
    }
  }
  const a = g.nodes[ia]!;
  const b = g.nodes[ib]!;
  const length = distM(a.lat, a.lng, b.lat, b.lng);
  if (length < MIN_SEG) return;
  const id = g.segs.length;
  g.segs.push({ a: ia, b: ib, length, arterial });
  g.adj[ia]!.push(id);
  g.adj[ib]!.push(id);
  coverSeg(g, a, b, id);
}

function splitSeg(g: StreetGraph, segId: number, mid: number) {
  const seg = g.segs[segId]!;
  if (seg.a === mid || seg.b === mid) return;
  const b = seg.b;
  g.adj[b] = g.adj[b]!.filter((id) => id !== segId);
  seg.b = mid;
  seg.length = distM(g.nodes[seg.a]!.lat, g.nodes[seg.a]!.lng, g.nodes[mid]!.lat, g.nodes[mid]!.lng);
  if (!g.adj[mid]!.includes(segId)) g.adj[mid]!.push(segId);
  coverSeg(g, g.nodes[seg.a]!, g.nodes[mid]!, segId);
  addSeg(g, mid, b, seg.arterial);
}

function stitchNode(g: StreetGraph, id: number) {
  const p = g.nodes[id]!;
  const { x, y } = toXY(g, p.lat, p.lng);
  const cx = Math.floor(x / g.cell);
  const cy = Math.floor(y / g.cell);
  let best: Snap | null = null;
  for (let ix = cx - 1; ix <= cx + 1; ix++) {
    for (let iy = cy - 1; iy <= cy + 1; iy++) {
      const list = g.grid.get(cellKey(ix, iy));
      if (!list) continue;
      for (const sid of list) {
        const seg = g.segs[sid]!;
        if (seg.a === id || seg.b === id) continue;
        const snap = projectToSeg(g, p.lat, p.lng, seg);
        snap.seg = sid;
        if (!best || snap.dist < best.dist) best = snap;
      }
    }
  }
  if (best && best.dist < 8 && best.t > 0.02 && best.t < 0.98) splitSeg(g, best.seg, id);
}

function decimate(pts: Pt[]): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [pts[0]!];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = out[out.length - 1]!;
    const p = pts[i]!;
    if (distM(prev.lat, prev.lng, p.lat, p.lng) >= DECIMATE) out.push(p);
  }
  const last = pts[pts.length - 1]!;
  const tail = out[out.length - 1]!;
  if (tail !== last) {
    if (distM(tail.lat, tail.lng, last.lat, last.lng) < MIN_SEG && out.length > 1) out[out.length - 1] = last;
    else out.push(last);
  }
  return out;
}

export function ingestLine(g: StreetGraph, raw: Pt[], arterial = false) {
  const pts = decimate(raw.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)));
  if (pts.length < 2) return;
  const ids: number[] = [];
  let prev = addNode(g, pts[0]!.lat, pts[0]!.lng);
  ids.push(prev);
  for (let i = 1; i < pts.length; i++) {
    const id = addNode(g, pts[i]!.lat, pts[i]!.lng);
    addSeg(g, prev, id, arterial);
    ids.push(id);
    prev = id;
  }
  for (const id of ids) stitchNode(g, id);
}

type OsmWay = {
  geometry?: { lat: number; lon: number }[];
  tags?: { highway?: string };
  arterial?: boolean;
};

export function ingestOsmWays(g: StreetGraph, ways: OsmWay[], drive = false) {
  for (const way of ways) {
    const geom = way.geometry;
    if (!geom || geom.length < 2) continue;
    const hw = way.tags?.highway ?? "";
    if (!drive && WALK_SKIP.has(hw)) continue;
    if (drive && hw && !ARTERIAL.has(hw) && !HIGHWAY_DRIVE.split("|").includes(hw)) continue;
    const arterial = way.arterial ?? ARTERIAL.has(hw);
    ingestLine(
      g,
      geom.map((p) => ({ lat: p.lat, lng: p.lon })),
      drive && arterial,
    );
  }
}

function projectToSeg(g: StreetGraph, lat: number, lng: number, seg: Seg): Snap {
  const a = g.nodes[seg.a]!;
  const b = g.nodes[seg.b]!;
  const dLat = (b.lat - a.lat) * M_PER_DEG_LAT;
  const dLng = (b.lng - a.lng) * metersPerDegLng((a.lat + b.lat) / 2);
  const pLat = (lat - a.lat) * M_PER_DEG_LAT;
  const pLng = (lng - a.lng) * metersPerDegLng(a.lat);
  const denom = dLat * dLat + dLng * dLng;
  const t = denom < 1e-6 ? 0 : Math.max(0, Math.min(1, (pLat * dLat + pLng * dLng) / denom));
  const slat = a.lat + (b.lat - a.lat) * t;
  const slng = a.lng + (b.lng - a.lng) * t;
  return { lat: slat, lng: slng, dist: distM(lat, lng, slat, slng), seg: -1, t };
}

export function nearest(g: StreetGraph, lat: number, lng: number, max = 90): Snap | null {
  if (!g.segs.length) return null;
  const { x, y } = toXY(g, lat, lng);
  const cx = Math.floor(x / g.cell);
  const cy = Math.floor(y / g.cell);
  let best: Snap | null = null;
  const ring = Math.min(18, Math.max(1, Math.ceil(max / g.cell) + 1));
  for (let ix = cx - ring; ix <= cx + ring; ix++) {
    for (let iy = cy - ring; iy <= cy + ring; iy++) {
      const list = g.grid.get(cellKey(ix, iy));
      if (!list) continue;
      for (const id of list) {
        const seg = g.segs[id]!;
        const snap = projectToSeg(g, lat, lng, seg);
        snap.seg = id;
        if (!best || snap.dist < best.dist) best = snap;
      }
    }
  }
  if (best && best.dist <= max) return best;
  return best && best.dist <= max * 1.8 ? best : null;
}

/** Always a point on a loaded road or path. Falls back to a random segment. */
export function onStreet(g: StreetGraph, lat: number, lng: number): Pt {
  if (!g.segs.length) return { lat, lng };
  const close = nearest(g, lat, lng, 1400);
  if (close) return { lat: close.lat, lng: close.lng };
  let best: Snap | null = null;
  const step = Math.max(1, Math.floor(g.segs.length / 2800));
  for (let i = 0; i < g.segs.length; i += step) {
    const snap = projectToSeg(g, lat, lng, g.segs[i]!);
    snap.seg = i;
    if (!best || snap.dist < best.dist) best = snap;
  }
  return best ? { lat: best.lat, lng: best.lng } : { lat, lng };
}

export function randomOnStreet(g: StreetGraph, near: Pt, minM = 60, maxM = 900): Pt {
  if (!g.segs.length) return near;
  const { x, y } = toXY(g, near.lat, near.lng);
  const cx = Math.floor(x / g.cell);
  const cy = Math.floor(y / g.cell);
  const maxC = Math.ceil(maxM / g.cell) + 1;
  const ids: number[] = [];
  const seen = new Set<number>();
  for (let ix = cx - maxC; ix <= cx + maxC; ix++) {
    for (let iy = cy - maxC; iy <= cy + maxC; iy++) {
      const d = Math.hypot(ix - cx, iy - cy) * g.cell;
      if (d < minM - g.cell || d > maxM + g.cell) continue;
      const list = g.grid.get(cellKey(ix, iy));
      if (!list) continue;
      for (const id of list) {
        if (seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
      }
    }
  }
  const pool = ids.length ? ids : g.segs.map((_, i) => i);
  const id = pool[(Math.random() * pool.length) | 0]!;
  const seg = g.segs[id]!;
  const t = 0.12 + Math.random() * 0.76;
  return lerpSeg(g, seg, t);
}

let walkGraph: StreetGraph | null = null;

export function bindWalkGraph(g: StreetGraph | null) {
  walkGraph = g;
}

export function streetDrop(near: Pt, minM = 80, maxM = 860): Pt {
  if (walkGraph?.segs.length) return randomOnStreet(walkGraph, near, minM, maxM);
  const ang = Math.random() * Math.PI * 2;
  const r = minM + Math.random() * Math.max(10, maxM - minM);
  return dest(near.lat, near.lng, Math.cos(ang) * r, Math.sin(ang) * r);
}

function headingNE(yaw: number) {
  return { n: Math.cos(yaw), e: -Math.sin(yaw) };
}

function segDir(g: StreetGraph, seg: Seg) {
  const a = g.nodes[seg.a]!;
  const b = g.nodes[seg.b]!;
  const n = (b.lat - a.lat) * M_PER_DEG_LAT;
  const e = (b.lng - a.lng) * metersPerDegLng((a.lat + b.lat) / 2);
  const len = Math.hypot(n, e) || 1;
  return { n: n / len, e: e / len };
}

function lerpSeg(g: StreetGraph, seg: Seg, t: number): Pt {
  const a = g.nodes[seg.a]!;
  const b = g.nodes[seg.b]!;
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

const BLANK_CELL = 380;
const BLANK_CAP = 28;
const BLANK_CLEAR = 210;
const DIRS = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"] as const;

function cellAt(g: StreetGraph, lat: number, lng: number, size: number) {
  const { x, y } = toXY(g, lat, lng);
  return `${Math.round(x / size)},${Math.round(y / size)}`;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
  return arr;
}

function blankLabel(p: Pt, origin: Pt, used: Set<string>) {
  const n = (p.lat - origin.lat) * M_PER_DEG_LAT;
  const e = (p.lng - origin.lng) * metersPerDegLng((p.lat + origin.lat) / 2);
  const ang = (Math.atan2(e, n) * 180) / Math.PI;
  const dir = DIRS[Math.round(((ang + 360) % 360) / 45) % 8]!;
  let name = `${dir} blank`;
  let n2 = 2;
  while (used.has(name)) {
    name = `${dir} blank ${n2}`;
    n2 += 1;
  }
  used.add(name);
  return name;
}

/** Unnamed lamps on empty blocks so the ward isn't a downtown clump. */
export function scatterStreetLamps(g: StreetGraph, hubs: Pt[], cityId: string): Poi[] {
  if (!g.segs.length) return [];
  const occupied = new Set<string>();
  for (const h of hubs) occupied.add(cellAt(g, h.lat, h.lng, BLANK_CELL));
  const buckets = new Map<string, Pt[]>();
  const step = Math.max(1, Math.floor(g.segs.length / 2200));
  for (let i = 0; i < g.segs.length; i += step) {
    const p = lerpSeg(g, g.segs[i]!, 0.5);
    const k = cellAt(g, p.lat, p.lng, BLANK_CELL);
    if (occupied.has(k)) continue;
    const list = buckets.get(k);
    if (list) list.push(p);
    else buckets.set(k, [p]);
  }
  const keys = shuffleInPlace([...buckets.keys()]);
  const origin = hubs[0] ?? { lat: g.originLat, lng: g.originLng };
  const used = hubs.map((h) => ({ lat: h.lat, lng: h.lng }));
  const names = new Set<string>();
  const out: Poi[] = [];
  for (const k of keys) {
    if (out.length >= BLANK_CAP) break;
    const cand = buckets.get(k)!;
    const p = cand[(Math.random() * cand.length) | 0]!;
    if (used.some((u) => distM(u.lat, u.lng, p.lat, p.lng) < BLANK_CLEAR)) continue;
    const i = out.length;
    const tier: Tier = i % 12 === 0 ? "green" : i % 4 === 0 ? "blue" : "white";
    out.push({
      id: `${cityId}-blank-${i}`,
      name: blankLabel(p, origin, names),
      lat: p.lat,
      lng: p.lng,
      kind: "landmark",
      tier,
      lore: "A lamp the atlas left unnamed. The block still has a question.",
    });
    used.push(p);
  }
  return out;
}

/** Spread points across empty street cells. */
export function spreadOnGraph(g: StreetGraph, avoid: Pt[], n: number, minSep = 160): Pt[] {
  if (!g.segs.length || n <= 0) return [];
  const occupied = new Set<string>();
  for (const h of avoid) occupied.add(cellAt(g, h.lat, h.lng, BLANK_CELL));
  const buckets = new Map<string, Pt[]>();
  const step = Math.max(1, Math.floor(g.segs.length / 1800));
  for (let i = 0; i < g.segs.length; i += step) {
    const p = lerpSeg(g, g.segs[i]!, 0.5);
    const k = cellAt(g, p.lat, p.lng, BLANK_CELL);
    if (occupied.has(k)) continue;
    const list = buckets.get(k);
    if (list) list.push(p);
    else buckets.set(k, [p]);
  }
  const keys = shuffleInPlace([...buckets.keys()]);
  const used = avoid.map((h) => ({ lat: h.lat, lng: h.lng }));
  const out: Pt[] = [];
  for (const k of keys) {
    if (out.length >= n) break;
    const cand = buckets.get(k)!;
    const p = cand[(Math.random() * cand.length) | 0]!;
    if (used.some((u) => distM(u.lat, u.lng, p.lat, p.lng) < minSep)) continue;
    out.push(p);
    used.push(p);
  }
  while (out.length < n) {
    out.push(randomOnStreet(g, avoid[0] ?? { lat: g.originLat, lng: g.originLng }, 80, 2400));
  }
  return out;
}

function walkFromNode(g: StreetGraph, node: number, yaw: number, leftover: number, hops = 0): Pt {
  const here = g.nodes[node]!;
  if (leftover < 0.15 || hops > 16) return here;
  const h = headingNE(yaw);
  let bestId = -1;
  let bestDot = -Infinity;
  for (const id of g.adj[node]!) {
    const seg = g.segs[id]!;
    const dir = segDir(g, seg);
    const sign = seg.a === node ? 1 : -1;
    const dot = (dir.n * h.n + dir.e * h.e) * sign;
    if (dot > bestDot) {
      bestDot = dot;
      bestId = id;
    }
  }
  if (bestId < 0) return here;
  const seg = g.segs[bestId]!;
  const forward = seg.a === node;
  if (leftover <= seg.length) {
    const t = forward ? leftover / seg.length : 1 - leftover / seg.length;
    return lerpSeg(g, seg, t);
  }
  const next = forward ? seg.b : seg.a;
  return walkFromNode(g, next, yaw, leftover - seg.length, hops + 1);
}

function slide(g: StreetGraph, snap: Snap, yaw: number, dist: number): Pt {
  const seg = g.segs[snap.seg];
  if (!seg || Math.abs(dist) < 0.05) return { lat: snap.lat, lng: snap.lng };
  const h = headingNE(yaw);
  const dir = segDir(g, seg);
  const along = dir.n * h.n + dir.e * h.e;
  const sign = (along >= 0 ? 1 : -1) * Math.sign(dist);
  const travel = Math.abs(dist);
  const t = snap.t;
  const remaining = sign > 0 ? (1 - t) * seg.length : t * seg.length;
  if (travel <= remaining) {
    const nt = t + (sign * travel) / seg.length;
    return lerpSeg(g, seg, nt);
  }
  const node = sign > 0 ? seg.b : seg.a;
  return walkFromNode(g, node, yaw, travel - remaining);
}

export function constrainStep(g: StreetGraph, lat: number, lng: number, yaw: number, dist: number, loose = false): Pt {
  let here = nearest(g, lat, lng, 80);
  if (!here) here = nearest(g, lat, lng, 240);
  if (!here) {
    return dest(lat, lng, Math.cos(yaw) * dist, -Math.sin(yaw) * dist);
  }
  if (Math.abs(dist) < 0.04) return { lat: here.lat, lng: here.lng };

  if (loose && here.dist > 16) {
    const proposed = dest(lat, lng, Math.cos(yaw) * dist, -Math.sin(yaw) * dist);
    const there = nearest(g, proposed.lat, proposed.lng, 22);
    if (there && there.dist < 8) return { lat: there.lat, lng: there.lng };
    return proposed;
  }

  const proposed = dest(lat, lng, Math.cos(yaw) * dist, -Math.sin(yaw) * dist);
  const there = nearest(g, proposed.lat, proposed.lng, 50);
  if (there && there.dist < 16) {
    const step = distM(here.lat, here.lng, there.lat, there.lng);
    const mid = nearest(g, (here.lat + there.lat) / 2, (here.lng + there.lng) / 2, 40);
    if (mid && mid.dist < 14 && step < Math.abs(dist) * 1.8 + 8 && step > 0.06) {
      return { lat: there.lat, lng: there.lng };
    }
  }

  return slide(g, here, yaw, dist);
}

export function pullToStreet(g: StreetGraph, lat: number, lng: number, max = 110): Pt {
  const s = nearest(g, lat, lng, max);
  return s ? { lat: s.lat, lng: s.lng } : onStreet(g, lat, lng);
}

export function faceAlongStreet(g: StreetGraph, lat: number, lng: number, toward?: Pt) {
  const s = nearest(g, lat, lng, 80);
  if (!s) return 0;
  const seg = g.segs[s.seg]!;
  const a = g.nodes[seg.a]!;
  const b = g.nodes[seg.b]!;
  const yawAb = Math.atan2(-(b.lng - a.lng) * metersPerDegLng(a.lat), (b.lat - a.lat) * M_PER_DEG_LAT);
  const yawBa = Math.atan2(-(a.lng - b.lng) * metersPerDegLng(a.lat), (a.lat - b.lat) * M_PER_DEG_LAT);
  if (!toward) return yawAb;
  const toAb = Math.abs(yawToTarget(lat, lng, yawAb, toward.lat, toward.lng));
  const toBa = Math.abs(yawToTarget(lat, lng, yawBa, toward.lat, toward.lng));
  return toAb <= toBa ? yawAb : yawBa;
}

export function graphCovers(g: StreetGraph, lat: number, lng: number, margin = 420) {
  return g.covers.some((c) => distM(lat, lng, c.lat, c.lng) < c.r - margin);
}

function overpassQuery(lat: number, lng: number, radius: number, drive = false) {
  const r = Math.round(radius);
  const hw = drive ? HIGHWAY_DRIVE : HIGHWAY;
  return `[out:json][timeout:25];way["highway"~"^(${hw})$"]["area"!="yes"]["access"!="private"]["access"!="no"](around:${r},${lat.toFixed(5)},${lng.toFixed(5)});out tags geom;`;
}

function mergeAbort(signal: AbortSignal | undefined, ms: number) {
  const extra = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, extra]) : extra;
}

async function postOverpass(url: string, query: string, signal?: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: `data=${encodeURIComponent(query)}`,
    signal: mergeAbort(signal, 4000),
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  return (await res.json()) as { elements?: OsmWay[] };
}

function unpackLines(lines: number[][]): OsmWay[] {
  return lines.map((line) => {
    const geometry: { lat: number; lon: number }[] = [];
    for (let i = 0; i + 1 < line.length; i += 2) geometry.push({ lat: line[i]!, lon: line[i + 1]! });
    return { geometry };
  });
}

export async function fetchStreets(
  lat: number,
  lng: number,
  radius: number,
  signal?: AbortSignal,
  drive = false,
): Promise<OsmWay[]> {
  try {
    const packed = await getOsmWays({ data: { lat, lng, radius }, signal });
    if (drive) {
      const rows = packed?.drive;
      if (rows?.length) {
        return rows.map((row) => {
          const geometry: { lat: number; lon: number }[] = [];
          for (let i = 0; i + 1 < row.line.length; i += 2) geometry.push({ lat: row.line[i]!, lon: row.line[i + 1]! });
          return { geometry, arterial: row.arterial };
        });
      }
    } else {
      const lines = packed?.lines;
      if (lines?.length) return unpackLines(lines);
    }
    throw new Error("empty osm payload " + JSON.stringify(packed && Object.keys(packed)));
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
  }
  const q = overpassQuery(lat, lng, radius, drive);
  let last: Error | null = null;
  for (const url of OVERPASS) {
    try {
      const data = await postOverpass(url, q, signal);
      return data.elements ?? [];
    } catch (err) {
      last = err as Error;
    }
  }
  throw last ?? new Error("overpass failed");
}

export async function expandGraph(
  g: StreetGraph,
  lat: number,
  lng: number,
  radius: number,
  signal?: AbortSignal,
  drive = false,
) {
  if (graphCovers(g, lat, lng, 380) && g.segs.length > 20) return g;
  const ways = await fetchStreets(lat, lng, radius, signal, drive);
  ingestOsmWays(g, ways, drive);
  g.covers.push({ lat, lng, r: radius });
  return g;
}

export async function osrmRoute(from: Pt, to: Pt, signal?: AbortSignal, drive = false): Promise<Pt[] | null> {
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const bases = drive ? OSRM_DRIVE : OSRM_FOOT;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/${path}`, { signal: mergeAbort(signal, 8000) });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        code?: string;
        routes?: { geometry?: { coordinates?: [number, number][] } }[];
      };
      const coords = data.routes?.[0]?.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      return coords.map(([lng, lat]) => ({ lat, lng }));
    } catch {
      /* try next */
    }
  }
  return null;
}

type HeapItem = { f: number; i: number };

function heapPush(h: HeapItem[], item: HeapItem) {
  h.push(item);
  let i = h.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (h[p]!.f <= h[i]!.f) break;
    const tmp = h[p]!;
    h[p] = h[i]!;
    h[i] = tmp;
    i = p;
  }
}

function heapPop(h: HeapItem[]) {
  if (!h.length) return undefined;
  const top = h[0]!;
  const last = h.pop()!;
  if (!h.length) return top;
  h[0] = last;
  let i = 0;
  for (;;) {
    const l = i * 2 + 1;
    const r = l + 1;
    let s = i;
    if (l < h.length && h[l]!.f < h[s]!.f) s = l;
    if (r < h.length && h[r]!.f < h[s]!.f) s = r;
    if (s === i) break;
    const tmp = h[i]!;
    h[i] = h[s]!;
    h[s] = tmp;
    i = s;
  }
  return top;
}

export function routeOnGraph(g: StreetGraph, from: Pt, to: Pt): Pt[] | null {
  const a = nearest(g, from.lat, from.lng, 160);
  const b = nearest(g, to.lat, to.lng, 200);
  if (!a || !b) return null;
  if (a.seg === b.seg || distM(a.lat, a.lng, b.lat, b.lng) < 12) return tidyPath([a, b]);

  const startSeg = g.segs[a.seg]!;
  const goalA = g.segs[b.seg]!.a;
  const goalB = g.segs[b.seg]!.b;
  const goalPt = { lat: b.lat, lng: b.lng };

  const distNode = (i: number) => distM(g.nodes[i]!.lat, g.nodes[i]!.lng, goalPt.lat, goalPt.lng);
  const start = [
    { i: startSeg.a, cost: distM(a.lat, a.lng, g.nodes[startSeg.a]!.lat, g.nodes[startSeg.a]!.lng) },
    { i: startSeg.b, cost: distM(a.lat, a.lng, g.nodes[startSeg.b]!.lat, g.nodes[startSeg.b]!.lng) },
  ];

  const best = new Float64Array(g.nodes.length).fill(Infinity);
  const came = new Int32Array(g.nodes.length).fill(-1);
  const heap: HeapItem[] = [];
  for (const s of start) {
    best[s.i] = s.cost;
    heapPush(heap, { f: s.cost + distNode(s.i), i: s.i });
  }

  let found = -1;
  let guard = 0;
  const limit = Math.min(80_000, Math.max(14_000, g.nodes.length * 8));
  while (heap.length && guard++ < limit) {
    const cur = heapPop(heap)!;
    if (cur.i === goalA || cur.i === goalB) {
      found = cur.i;
      break;
    }
    if (cur.f - distNode(cur.i) > best[cur.i]! + 0.01) continue;
    for (const sid of g.adj[cur.i]!) {
      const seg = g.segs[sid]!;
      const nxt = seg.a === cur.i ? seg.b : seg.a;
      const ng = best[cur.i]! + seg.length;
      if (ng + 0.01 < best[nxt]!) {
        best[nxt] = ng;
        came[nxt] = cur.i;
        heapPush(heap, { f: ng + distNode(nxt), i: nxt });
      }
    }
  }
  if (found < 0) return null;
  const nodes: number[] = [];
  let c = found;
  while (c >= 0 && nodes.length < 8000) {
    nodes.push(c);
    c = came[c]!;
  }
  nodes.reverse();
  const path: Pt[] = [{ lat: a.lat, lng: a.lng }];
  for (const i of nodes) path.push(g.nodes[i]!);
  path.push({ lat: b.lat, lng: b.lng });
  return tidyPath(path);
}

function tidyPath(path: Pt[]): Pt[] {
  if (path.length < 3) return path;
  const out: Pt[] = [path[0]!];
  for (let i = 1; i < path.length; i++) {
    const p = path[i]!;
    const prev = out[out.length - 1]!;
    if (distM(prev.lat, prev.lng, p.lat, p.lng) < 1.5) {
      out[out.length - 1] = p;
      continue;
    }
    out.push(p);
  }
  const last = path[path.length - 1]!;
  const tail = out[out.length - 1]!;
  if (tail !== last && distM(tail.lat, tail.lng, last.lat, last.lng) > 0.4) out.push(last);
  else out[out.length - 1] = last;
  return out;
}

export function pathLength(path: Pt[]): number {
  let n = 0;
  for (let i = 0; i < path.length - 1; i++) n += distM(path[i]!.lat, path[i]!.lng, path[i + 1]!.lat, path[i + 1]!.lng);
  return n;
}

/** Super Legendary (lynx) may cut. Default scouts never cut buildings. */
export function canCutBuildings(scout?: string | null): boolean {
  return scout === "lynx";
}

/**
 * Direct hop toward a door. Default is off — only a future canCutBuildings perk may use it.
 * The ~18 m near-target hop used to skip through blocks.
 */
export function stuckNudge(from: Pt, to: Pt, cutBuildings = false): Pt | null {
  if (!cutBuildings) return null;
  const left = distM(from.lat, from.lng, to.lat, to.lng);
  if (left >= 80 || left < 0.4) return null;
  const hop = Math.min(18, left);
  const n = ((to.lat - from.lat) * 111_320) / left;
  const e = ((to.lng - from.lng) * 111_320 * Math.cos((from.lat * Math.PI) / 180)) / left;
  return dest(from.lat, from.lng, n * hop, e * hop);
}

/** Keep a walk on the street graph. Off-graph hops only if cutBuildings is true. */
export function finishPath(path: Pt[] | null, from: Pt, to: Pt, opts?: { cutBuildings?: boolean }): Pt[] | null {
  const cut = Boolean(opts?.cutBuildings);
  const out = path && path.length ? path.slice() : [];
  if (cut) {
    if (!out.length) out.push({ lat: from.lat, lng: from.lng });
    if (distM(out[0]!.lat, out[0]!.lng, from.lat, from.lng) > 8) out.unshift({ lat: from.lat, lng: from.lng });
    const last = out[out.length - 1]!;
    if (distM(last.lat, last.lng, to.lat, to.lng) > 8) out.push({ lat: to.lat, lng: to.lng });
  }
  if (!out.length) return null;
  const tidy = tidyPath(out);
  return tidy.length >= 2 ? tidy : null;
}

export function routeHugsGraph(g: StreetGraph, path: Pt[], maxOff = 32): boolean {
  if (!g.segs.length || path.length < 2) return false;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const span = distM(a.lat, a.lng, b.lat, b.lng);
    const steps = Math.max(1, Math.ceil(span / 24));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const lat = a.lat + (b.lat - a.lat) * t;
      const lng = a.lng + (b.lng - a.lng) * t;
      const near = nearest(g, lat, lng, maxOff);
      if (!near || near.dist > maxOff) return false;
    }
  }
  return true;
}

export async function routeWalk(g: StreetGraph | null, from: Pt, to: Pt, signal?: AbortSignal): Promise<Pt[] | null> {
  const snappedTo = g ? pullToStreet(g, to.lat, to.lng, 220) : to;
  const snappedFrom = g ? pullToStreet(g, from.lat, from.lng, 140) : from;
  const online = await osrmRoute(snappedFrom, snappedTo, signal, false);
  if (online && online.length >= 2 && (!g || routeHugsGraph(g, online))) {
    return tidyPath(online);
  }
  if (g) return routeOnGraph(g, snappedFrom, snappedTo);
  return null;
}

export async function routeDrive(g: StreetGraph | null, from: Pt, to: Pt, signal?: AbortSignal): Promise<Pt[] | null> {
  const snappedTo = g ? pullToStreet(g, to.lat, to.lng, 160) : to;
  const snappedFrom = g ? pullToStreet(g, from.lat, from.lng, 140) : from;
  if (g && distM(snappedTo.lat, snappedTo.lng, to.lat, to.lng) > 160) return null;
  const online = await osrmRoute(snappedFrom, snappedTo, signal, true);
  if (online && online.length >= 2) {
    if (g) ingestLine(g, online, false);
    return tidyPath(online);
  }
  if (g) return routeOnGraph(g, snappedFrom, snappedTo);
  return null;
}

export function onArterial(g: StreetGraph | null, lat: number, lng: number) {
  if (!g) return false;
  const s = nearest(g, lat, lng, 28);
  if (!s) return false;
  return Boolean(g.segs[s.seg]?.arterial);
}

export async function bootstrapDrive(lat: number, lng: number, hubs: Pt[], signal?: AbortSignal) {
  const g = createGraph(lat, lng);
  try {
    await expandGraph(g, lat, lng, 2000, signal, true);
  } catch {
    /* live fail — try spines */
  }
  if (g.segs.length < 8) {
    const nearby = [...hubs]
      .sort((a, b) => distM(lat, lng, a.lat, a.lng) - distM(lat, lng, b.lat, b.lng))
      .slice(0, 8);
    for (const p of nearby) {
      const path = await osrmRoute({ lat, lng }, p, signal, true);
      if (path) ingestLine(g, path, false);
    }
    if (g.segs.length) g.covers.push({ lat, lng, r: 900 });
  }
  return g;
}

export async function bootstrapStreets(cityId: string, lat: number, lng: number, hubs: Pt[], signal?: AbortSignal) {
  const g = createGraph(lat, lng);
  try {
    const res = await fetch(`/streets/${cityId}.json`);
    if (res.ok) {
      const packed = (await res.json()) as { lines?: number[][] };
      if (packed.lines?.length) {
        ingestOsmWays(g, unpackLines(packed.lines));
        g.covers.push({ lat, lng, r: 720 });
      }
    }
  } catch {
    /* live fetch next */
  }
  if (g.segs.length < 8) {
    try {
      await expandGraph(g, lat, lng, 2000, signal);
    } catch {
      /* fall through to OSRM spine */
    }
  }
  if (g.segs.length < 8) {
    const nearby = [...hubs]
      .sort((a, b) => distM(lat, lng, a.lat, a.lng) - distM(lat, lng, b.lat, b.lng))
      .slice(0, 8);
    for (const p of nearby) {
      const path = await osrmRoute({ lat, lng }, p, signal);
      if (path) ingestLine(g, path);
    }
    if (g.segs.length) g.covers.push({ lat, lng, r: 900 });
  }
  if (!g.segs.length) throw new Error("no streets");
  return g;
}

export async function fillSurroundings(
  g: StreetGraph,
  lat: number,
  lng: number,
  hubs: Pt[],
  signal?: AbortSignal,
  drive = false,
) {
  const ring = 1500;
  const pts: Pt[] = [
    { lat, lng },
    dest(lat, lng, ring, 0),
    dest(lat, lng, 0, ring),
    dest(lat, lng, -ring, 0),
    dest(lat, lng, 0, -ring),
  ];
  const far = [...hubs]
    .sort((a, b) => distM(lat, lng, b.lat, b.lng) - distM(lat, lng, a.lat, a.lng))
    .slice(0, 2);
  pts.push(...far);
  for (const p of pts) {
    if (signal?.aborted) return g;
    try {
      const r = p.lat === lat && p.lng === lng ? 2000 : 1100;
      await expandGraph(g, p.lat, p.lng, r, signal, drive);
    } catch {
      /* keep the graph we have */
    }
  }
  return g;
}

export function closestOnPath(path: Pt[], lat: number, lng: number, hintAlong = -1) {
  let bestI = 0;
  let bestT = 0;
  let bestD = Infinity;
  let bestScore = Infinity;
  let acc = 0;
  const prefix = [0];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const len = distM(a.lat, a.lng, b.lat, b.lng) || 1;
    const dLat = (b.lat - a.lat) * M_PER_DEG_LAT;
    const dLng = (b.lng - a.lng) * metersPerDegLng((a.lat + b.lat) / 2);
    const pLat = (lat - a.lat) * M_PER_DEG_LAT;
    const pLng = (lng - a.lng) * metersPerDegLng(a.lat);
    const t = Math.max(0, Math.min(1, (pLat * dLat + pLng * dLng) / (dLat * dLat + dLng * dLng || 1)));
    const slat = a.lat + (b.lat - a.lat) * t;
    const slng = a.lng + (b.lng - a.lng) * t;
    const d = distM(lat, lng, slat, slng);
    const alongHere = acc + t * len;
    let score = d;
    if (hintAlong >= 0 && alongHere + 16 < hintAlong) score += (hintAlong - alongHere) * 0.4;
    if (score < bestScore) {
      bestScore = score;
      bestD = d;
      bestI = i;
      bestT = t;
    }
    acc += len;
    prefix.push(acc);
  }
  const along =
    prefix[bestI]! +
    bestT * (distM(path[bestI]!.lat, path[bestI]!.lng, path[bestI + 1]!.lat, path[bestI + 1]!.lng) || 1);
  return { i: bestI, t: bestT, dist: bestD, along, total: acc };
}

export function pointAlongPath(path: Pt[], meters: number): Pt {
  if (path.length === 1) return path[0]!;
  let left = Math.max(0, meters);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const len = distM(a.lat, a.lng, b.lat, b.lng);
    if (left <= len) {
      const t = len < 1e-3 ? 0 : left / len;
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    }
    left -= len;
  }
  return path[path.length - 1]!;
}
