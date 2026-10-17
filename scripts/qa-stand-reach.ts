// 0.0.80: every map stand (outfitter, station, street counter, notice board) must sit within a walker's
// reach of the live walk graph — the same Overpass walk query and ingest the game uses (streets.ts).
// A stand farther than the interact radius from the nearest walkable edge of the big street network
// (a park interior, an island footway) can't be opened. Exit 1 on any.
// node --experimental-strip-types scripts/qa-stand-reach.ts [city…]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CITY_LIST, interactRadius, isService } from "../src/game/data.ts";
import { STAND_AT } from "../src/game/standSpots.ts";
import { distM } from "../src/game/geo.ts";
import { createGraph, ingestOsmWays, nearest, type StreetGraph } from "../src/game/streets.ts";
import { FREEWAY_HIGHWAY_RE, WALK_HIGHWAY_RE, WALK_OVERPASS_FILTERS } from "../src/game/walkable.ts";

const R = 700;
const REACH = interactRadius(false);
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.openstreetmap.fr/api/interpreter"];
const cacheDir = join(tmpdir(), "keyline-stand-reach");
mkdirSync(cacheDir, { recursive: true });

async function ways(lat: number, lng: number) {
  const f = join(cacheDir, `${lat.toFixed(5)},${lng.toFixed(5)},${R}.json`);
  if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8"));
  const at = `(around:${R},${lat.toFixed(5)},${lng.toFixed(5)})`;
  const q = `[out:json][timeout:60];(way["highway"~"^(${WALK_HIGHWAY_RE})$"]${WALK_OVERPASS_FILTERS}${at};way["highway"~"^(${FREEWAY_HIGHWAY_RE})$"]${at};);out tags geom;`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length]!;
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "keyline-qa/1.0" }, body: `data=${encodeURIComponent(q)}`, signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(String(res.status));
      const els = ((await res.json()) as { elements?: unknown[] }).elements ?? [];
      writeFileSync(f, JSON.stringify(els));
      return els;
    } catch {
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  throw new Error(`overpass failed at ${lat},${lng}`);
}

/** Node components over walk segs; the biggest one is "the street network" (not a fenced park loop). */
function bigComp(g: StreetGraph) {
  const comp = new Int32Array(g.nodes.length).fill(-1);
  const size: number[] = [];
  for (let s = 0; s < g.nodes.length; s++) {
    if (comp[s] !== -1) continue;
    const id = size.length;
    let n = 0;
    const stack = [s];
    comp[s] = id;
    while (stack.length) {
      const v = stack.pop()!;
      n++;
      for (const e of g.adj[v] ?? []) {
        const seg = g.segs[e]!;
        const o = seg.a === v ? seg.b : seg.a;
        if (comp[o] === -1) {
          comp[o] = id;
          stack.push(o);
        }
      }
    }
    size.push(n);
  }
  const big = size.indexOf(Math.max(...size));
  return { comp, big };
}

const WRITE = process.argv.includes("--write");
/** With --write, counters and boards this far off the street move onto it (src/game/standSpots.ts). */
const SNAP_M = 40;
const moved: Record<string, { lat: number; lng: number }> = { ...STAND_AT };
const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--")));
let bad = 0;
const perCity: string[] = [];
for (const city of CITY_LIST) {
  if (only.size && !only.has(city.id)) continue;
  let n = 0;
  for (const p of city.pois.filter(isService)) {
    const g = createGraph(p.lat, p.lng);
    ingestOsmWays(g, (await ways(p.lat, p.lng)) as never);
    const { comp, big } = bigComp(g);
    const snap = nearest(g, p.lat, p.lng, R, comp, big);
    const d = snap ? snap.dist : Infinity;
    const fail = d > REACH;
    if (fail) n++;
    if (WRITE && snap && d > SNAP_M && (p.kind === "counter" || p.kind === "board")) {
      // Closest curb point on the big walk that keeps clear of every lamp and the outfitter (errandPlaces.test.ts: > 80 m).
      const keepOff = city.pois.filter((o) => o.kind !== "counter" && o.kind !== "board" && o.kind !== "station");
      let best: { lat: number; lng: number; d: number } | null = null;
      for (const seg of g.segs) {
        if (comp[seg.a] !== big) continue;
        const a = g.nodes[seg.a]!;
        const b = g.nodes[seg.b]!;
        const steps = Math.max(1, Math.ceil(distM(a.lat, a.lng, b.lat, b.lng) / 4));
        for (let i = 0; i <= steps; i++) {
          const lat = a.lat + ((b.lat - a.lat) * i) / steps;
          const lng = a.lng + ((b.lng - a.lng) * i) / steps;
          const dd = distM(p.lat, p.lng, lat, lng);
          if (best && dd >= best.d) continue;
          if (keepOff.some((o) => distM(lat, lng, o.lat, o.lng) <= 90)) continue;
          best = { lat, lng, d: dd };
        }
      }
      if (best) moved[p.id] = { lat: Math.round(best.lat * 1e5) / 1e5, lng: Math.round(best.lng * 1e5) / 1e5 };
    }
    console.log(fail ? "FAIL" : "ok  ", city.id.padEnd(9), p.kind.padEnd(7), p.id.padEnd(22), `${d.toFixed(0)} m to street`, p.name);
  }
  bad += n;
  perCity.push(`${city.id}:${n}`);
}
if (WRITE) {
  const body = Object.keys(moved).sort().map((k) => `  "${k}": { lat: ${moved[k]!.lat}, lng: ${moved[k]!.lng} },`).join("\n");
  const head = readFileSync(new URL("../src/game/standSpots.ts", import.meta.url), "utf8").split("export const")[0];
  writeFileSync(new URL("../src/game/standSpots.ts", import.meta.url), `${head}export const STAND_AT: Record<string, { lat: number; lng: number }> = {\n${body}\n};\n`);
  console.log(`wrote ${Object.keys(moved).length} stand spot(s) to src/game/standSpots.ts`);
}
console.log(`\nunreachable per city (> ${REACH} m): ${perCity.join(" ")}`);
console.log(bad ? `qa:stands FAIL — ${bad} stand(s) off the walk` : "qa:stands ok — every stand is in reach of the walk");
process.exit(bad ? 1 : 0);
