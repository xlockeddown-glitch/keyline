// 0.1.48: bake each city's whole street map (walk + drive + freeway layer) from OpenStreetMap, so walks don't
// wait on live Overpass inside the play area.
//   node --experimental-strip-types scripts/bake-city-graph.mts [cityId…] [--force] [--drive] [--mirrors] [--allow-stale]
// → public/streets/v2/<city>.<hash>.json.gz + public/streets/v2/manifest.json
// Bbox: spawn + every lamp, padded 900 m (same as bake-freeways). Two polite Overpass queries per city (walk + freeway,
// drive), one at a time, mirror rotation with backoff; raw answers cached in .bake-cache/ (gitignored), so reruns are
// offline and idempotent. --force re-fetches. Output format (v2):
//   nodes: delta ints at 1e-5° [lat0,lng0,dLat1,dLng1,…]; ways: [cls, name, flags, n0, d1, d2, …] node indexes (first absolute, then deltas);
//   flags: 1 walk (the game's own walk ingest), 2 drive (getOsmWays' drive rule; only with --drive), 4 freeway (no-walk layer), 8 arterial.
// Freeway/drive rows: thinned at 14 m like packLine, shared vertices always kept. Walk rows: see buildCity.
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { CITIES } from "../src/game/data.ts";
import { DEALERS } from "../src/game/cars.ts";
import { createGraph, ingestOsmWays } from "../src/game/streets.ts";
import { packLine } from "../src/game/streetApi.ts";
import { sharedVertices } from "../src/game/walkable.ts";
import { FREEWAY_HIGHWAY_RE, isFreeway, WALK_HIGHWAY_RE, WALK_OVERPASS_FILTERS, type WayTags } from "../src/game/walkable.ts";

export const BAKE_PAD_M = 900;
const DRIVE = "primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service";
const DRIVE_SET = new Set(DRIVE.split("|"));
const ARTERIAL = new Set(["primary", "primary_link", "secondary", "secondary_link"]);
// overpass-api.de is the source of truth: the kumi / .fr mirrors answered Oct 27 with snapshots 2–5 months old.
// --mirrors lets the others in (their answers still have to pass the snapshot-age check).
const MAIN = "https://overpass-api.de/api/interpreter";
const URLS = process.argv.includes("--mirrors") ? [MAIN, "https://overpass.kumi.systems/api/interpreter", "https://overpass.openstreetmap.fr/api/interpreter"] : [MAIN];
/** Refuse map data older than this (osm3s.timestamp_osm_base); --allow-stale overrides. */
const MAX_AGE_DAYS = 7;
function snapshotAgeDays(json: { osm3s?: { timestamp_osm_base?: string } }) {
  const t = Date.parse(json.osm3s?.timestamp_osm_base ?? "");
  return Number.isFinite(t) ? (Date.now() - t) / 86_400_000 : Infinity;
}
const UA = "keyline-bake-city-graph/1.0 (github.com/xlockeddown-glitch/keyline)";
const OUT = "public/streets/v2";
const CACHE = ".bake-cache";
const THIN_M = 14;

type El = { type?: string; id?: number; tags?: WayTags & Record<string, string>; geometry?: { lat: number; lon: number }[] };

export function cityBbox(id: string): [number, number, number, number] {
  const c = CITIES[id as keyof typeof CITIES];
  const pts = [c.spawn, ...c.pois];
  const lat0 = Math.min(...pts.map((p) => p.lat));
  const lat1 = Math.max(...pts.map((p) => p.lat));
  const lng0 = Math.min(...pts.map((p) => p.lng));
  const lng1 = Math.max(...pts.map((p) => p.lng));
  const dLat = BAKE_PAD_M / 111_320;
  const dLng = BAKE_PAD_M / (111_320 * Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180));
  return [lat0 - dLat, lng0 - dLng, lat1 + dLat, lng1 + dLng].map((x) => +x.toFixed(5)) as [number, number, number, number];
}

function query(b: string, mode: "walk" | "drive") {
  if (mode === "drive") return `[out:json][timeout:300];way["highway"~"^(${DRIVE})$"]["area"!="yes"]["access"!="private"]["access"!="no"](${b});out tags geom;`;
  return `[out:json][timeout:300];(way["highway"~"^(${WALK_HIGHWAY_RE})$"]${WALK_OVERPASS_FILTERS}(${b});way["highway"~"^(${FREEWAY_HIGHWAY_RE})$"](${b});way["motorroad"="yes"](${b}););out tags geom;`;
}

async function fetchRaw(city: string, mode: "walk" | "drive", force: boolean) {
  const f = `${CACHE}/${city}-${mode}.osm.json`;
  if (!force && existsSync(f)) return JSON.parse(readFileSync(f, "utf8"));
  const q = query(cityBbox(city).join(","), mode);
  for (let att = 0; att < 8; att++) {
    const u = URLS[att % URLS.length]!;
    try {
      const t = Date.now();
      const res = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA }, signal: AbortSignal.timeout(360_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = await res.text();
      const json = JSON.parse(txt);
      const age = snapshotAgeDays(json);
      if (age > MAX_AGE_DAYS) throw new Error(`stale snapshot ${json.osm3s?.timestamp_osm_base} (${age.toFixed(0)} days old)`);
      writeFileSync(f, txt);
      console.log(city, mode, `${(txt.length / 1e6).toFixed(1)} MB`, `${Math.round((Date.now() - t) / 1000)} s`, u);
      return json;
    } catch (e) {
      console.error(city, mode, u, (e as Error).message, `retry in ${20 * (att + 1)} s`);
      await new Promise((r) => setTimeout(r, Math.min(300_000, 30_000 * 2 ** att)));
    }
  }
  throw new Error(`${city} ${mode}: overpass failed`);
}

const distM = (a: [number, number], b: [number, number]) => Math.hypot((a[0] - b[0]) * 1.1132, (a[1] - b[1]) * 1.1132 * Math.cos((a[0] / 1e5) * (Math.PI / 180)));

export function buildCity(city: string, walkEls: El[], driveEls: El[], snapshot: string, withDrive = false) {
  // Overpass can return null points inside a way's geometry (NYC, Oct 27; the node is outside what it served). Split
  // the way there, like qa:stands does, rather than join across the hole. Pieces keep the way's id with a suffix.
  const split = (els: El[]): El[] =>
    els.flatMap((el) => {
      const g = el.geometry ?? [];
      if (g.every((p) => p != null)) return [el];
      const parts: El[] = [];
      let cur: { lat: number; lon: number }[] = [];
      for (const p of [...g, null]) {
        if (p != null && Number.isFinite(p.lat) && Number.isFinite(p.lon)) cur.push(p);
        else {
          if (cur.length >= 2) parts.push({ ...el, id: el.id! + parts.length * 1e12, geometry: cur });
          cur = [];
        }
      }
      return parts;
    });
  walkEls = split(walkEls);
  driveEls = split(driveEls);
  const byId = new Map<number, { el: El; walkQ: boolean; driveQ: boolean }>();
  for (const el of walkEls) if (el.type === "way" && el.id != null) byId.set(el.id, { el, walkQ: true, driveQ: false });
  for (const el of driveEls) {
    if (el.type !== "way" || el.id == null) continue;
    const hit = byId.get(el.id);
    if (hit) hit.driveQ = true;
    else byId.set(el.id, { el, walkQ: false, driveQ: true });
  }
  const c = CITIES[city as keyof typeof CITIES];
  const places = [c.spawn, ...(c.start ? [c.start] : []), ...c.pois, DEALERS[c.id as keyof typeof DEALERS]];
  const nearPlace = (geom: { lat: number; lon: number }[]) =>
    geom.some((p) => p && places.some((q) => Math.abs(p.lat - q.lat) * 111_320 < 300 && Math.hypot((p.lat - q.lat) * 111_320, (p.lon - q.lng) * 111_320 * Math.cos((q.lat * Math.PI) / 180)) < 300));
  const ways = [...byId.values()].sort((a, b) => a.el.id! - b.el.id!);
  const count = new Map<string, number>();
  for (const { el } of ways) for (const k of new Set((el.geometry ?? []).filter(Boolean).map((p) => `${Math.round(p.lat * 1e5)},${Math.round(p.lon * 1e5)}`))) count.set(k, (count.get(k) ?? 0) + 1);
  const nid = new Map<string, number>();
  const nodes: [number, number][] = [];
  const cls = new Map<string, number>();
  const names = new Map<string, number>([["", 0]]);
  const out: number[][] = [];
  for (const { el, walkQ, driveQ } of ways) {
    const t = el.tags ?? {};
    const hw = t.highway ?? "";
    let flags = 0;
    if (walkQ && isFreeway(t)) flags |= 4;
    // Service roads (alleys, lots, driveways) are ~40% of drive rows and the static output is capped at 8 MB, so only
    // the ones within 300 m of a lamp, stand, car lot or spawn ship: those are the curbs a car stops at.
    if (withDrive && driveQ && DRIVE_SET.has(hw) && (hw !== "service" || nearPlace(el.geometry ?? []))) flags |= 2;
    if (flags & 2 && ARTERIAL.has(hw)) flags |= 8;
    if (!flags) continue;
    const g = (el.geometry ?? []).filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon));
    const pts: [number, number][] = [];
    for (let i = 0; i < g.length; i++) {
      const q: [number, number] = [Math.round(g[i]!.lat * 1e5), Math.round(g[i]!.lon * 1e5)];
      const prev = pts[pts.length - 1];
      if (prev && prev[0] === q[0] && prev[1] === q[1]) continue;
      const junction = (count.get(`${q[0]},${q[1]}`) ?? 0) > 1;
      if (prev && i < g.length - 1 && !junction && distM(prev, q) < THIN_M) continue;
      pts.push(q);
    }
    if (pts.length < 2) continue;
    if (!cls.has(hw)) cls.set(hw, cls.size);
    const nm = t.name ?? "";
    if (!names.has(nm)) names.set(nm, names.size);
    const row = [cls.get(hw)!, names.get(nm)!, flags];
    for (const p of pts) {
      const k = `${p[0]},${p[1]}`;
      let id = nid.get(k);
      if (id === undefined) {
        id = nodes.length;
        nid.set(k, id);
        nodes.push(p);
      }
      row.push(id);
    }
    out.push(row);
  }
  // Walk: the live pipeline exactly (server packLine at 14 m keeping junctions, then the client's ingestOsmWays:
  // 12 m decimation, 8 m corner stitches and splits, freeway-aware bridges), exported as chains between junctions.
  // So a baked walk is the walk the game builds from a good live fetch, with every corner joined the same way.
  const walkWays = ways.filter((w) => w.walkQ).map(({ el }) => el);
  const keep = sharedVertices(walkWays);
  const live: { geometry: { lat: number; lon: number }[]; tags: WayTags }[] = [];
  for (const el of walkWays) {
    const packed = packLine(el.geometry ?? [], keep);
    if (packed.length < 4) continue;
    const geometry: { lat: number; lon: number }[] = [];
    for (let i = 0; i + 1 < packed.length; i += 2) geometry.push({ lat: packed[i]!, lon: packed[i + 1]! });
    live.push({ geometry, tags: el.tags ?? {} });
  }
  const [b0, b1, b2, b3] = cityBbox(city);
  const g = createGraph((b0 + b2) / 2, (b1 + b3) / 2);
  ingestOsmWays(g, live as never);
  if (!cls.has("walk")) cls.set("walk", cls.size);
  const walkCls = cls.get("walk")!;
  const gid = (i: number) => {
    const p = g.nodes[i]!;
    const q: [number, number] = [Math.round(p.lat * 1e5), Math.round(p.lng * 1e5)];
    const k = `${q[0]},${q[1]}`;
    let id = nid.get(k);
    if (id === undefined) {
      id = nodes.length;
      nid.set(k, id);
      nodes.push(q);
    }
    return id;
  };
  const used = new Uint8Array(g.segs.length);
  const deg = (i: number) => g.adj[i]!.length;
  const chain = (start: number, sid: number) => {
    const row = [walkCls, 0, 1, gid(start)];
    let cur = start;
    let s = sid;
    for (;;) {
      used[s] = 1;
      const seg = g.segs[s]!;
      const nxt = seg.a === cur ? seg.b : seg.a;
      row.push(gid(nxt));
      cur = nxt;
      if (deg(cur) !== 2 || cur === start) break;
      const n2 = g.adj[cur]!.find((x) => !used[x]);
      if (n2 === undefined) break;
      s = n2;
    }
    out.push(row);
  };
  for (let i = 0; i < g.nodes.length; i++) if (deg(i) !== 2) for (const s of g.adj[i]!) if (!used[s]) chain(i, s);
  for (let i = 0; i < g.nodes.length; i++) for (const s of g.adj[i]!) if (!used[s]) chain(i, s); // loops
  // Node indexes after the first are deltas from the previous one (neighbors are mostly numbered close together).
  for (const row of out) for (let k = row.length - 1; k > 3; k--) row[k] = row[k]! - row[k - 1]!;
  const flat: number[] = [];
  let pl = 0;
  let pa = 0;
  for (const [la, lo] of nodes) {
    flat.push(la - pl, lo - pa);
    pl = la;
    pa = lo;
  }
  return {
    v: 3,
    city,
    snapshot,
    source: "© OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright)",
    bbox: cityBbox(city),
    cls: [...cls.keys()],
    names: [...names.keys()],
    nodes: flat,
    ways: out,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  // Drive rows (flag 2) add ~25% gz and nothing reads them until the car drives from the baked map (slice 2).
  const withDrive = args.includes("--drive");
  const only = args.filter((a) => !a.startsWith("--"));
  const cities = only.length ? only : ["chicago", "nashville"];
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CACHE, { recursive: true });
  const manPath = `${OUT}/manifest.json`;
  const manifest: { v: number; source: string; cities: Record<string, { file: string; snapshot: string; bytes: number; gz: number }> } = existsSync(manPath)
    ? JSON.parse(readFileSync(manPath, "utf8"))
    : { v: 2, source: "© OpenStreetMap contributors, ODbL", cities: {} };
  for (const city of cities) {
    if (!(city in CITIES)) throw new Error(`unknown city ${city}`);
    const walk = await fetchRaw(city, "walk", force);
    const drive = await fetchRaw(city, "drive", force);
    const snapshot = String(walk.osm3s?.timestamp_osm_base ?? "").slice(0, 10);
    for (const [m, j] of [["walk", walk], ["drive", drive]] as const) {
      const age = snapshotAgeDays(j);
      if (age > MAX_AGE_DAYS && !args.includes("--allow-stale")) throw new Error(`${city} ${m}: cached snapshot ${j.osm3s?.timestamp_osm_base} is ${age.toFixed(0)} days old; re-fetch with --force`);
    }
    const data = buildCity(city, walk.elements ?? [], drive.elements ?? [], snapshot, withDrive);
    const body = JSON.stringify(data);
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 10);
    // Shipped gzipped: deploy-guard caps the static output at 8 MB and the JSON is ~4× its gz size. The client
    // inflates with DecompressionStream (or takes it as-is if the host already decoded it).
    const file = `${city}.${hash}.json.gz`;
    const gz = gzipSync(body, { level: 9 });
    for (const f of readdirSync(OUT)) if (f.startsWith(`${city}.`) && f !== file) unlinkSync(`${OUT}/${f}`);
    if (!existsSync(`${OUT}/${file}`)) writeFileSync(`${OUT}/${file}`, gz);
    manifest.cities[city] = { file, snapshot, bytes: body.length, gz: gz.length };
    console.log(city, file, `${(body.length / 1e6).toFixed(2)} MB, ${(gz.length / 1e6).toFixed(2)} MB gz`, `${data.ways.length} ways`, `${data.nodes.length / 2} nodes`);
  }
  manifest.cities = Object.fromEntries(Object.entries(manifest.cities).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(manPath, JSON.stringify(manifest, null, 1) + "\n");
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
