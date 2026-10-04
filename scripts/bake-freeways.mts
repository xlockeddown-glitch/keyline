// 0.0.52b: bake each city's freeway layer (motorways, trunks, their ramps and feeders) for the walk graph's
// no-walk check, so walks stay off them even when the live Overpass fetch fails and the graph is only the baked
// foot routes. One file per city, loaded with /streets/<id>.json:
//   node --experimental-strip-types scripts/bake-freeways.mts [cityId…]  → public/streets/<id>-fw.json
// Lines are delta-packed integers at 1e-5°: [lat0, lng0, dLat1, dLng1, …], points ≥ STEP m apart.
import { writeFileSync } from "node:fs";
import { CITIES } from "../src/game/data.ts";
import { FREEWAY_HIGHWAY_RE, isFreeway } from "../src/game/walkable.ts";

const URLS = ["https://overpass.openstreetmap.fr/api/interpreter", "https://overpass-api.de/api/interpreter"];
const PAD_M = 900; // the ward's 420 m pad plus a walking margin
const STEP = 24;
const only = new Set(process.argv.slice(2));

function pack(geom: { lat: number; lon: number }[]): number[] {
  const pts: [number, number][] = [];
  for (const p of geom) {
    if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return [];
    const q: [number, number] = [Math.round(p.lat * 1e5), Math.round(p.lon * 1e5)];
    const prev = pts[pts.length - 1];
    if (prev) {
      const d = Math.hypot((q[0] - prev[0]) * 1.1132, (q[1] - prev[1]) * 1.1132 * Math.cos((p.lat * Math.PI) / 180));
      if (d < STEP && p !== geom[geom.length - 1]) continue;
    }
    pts.push(q);
  }
  if (pts.length < 2) return [];
  const out = [pts[0]![0], pts[0]![1]];
  for (let i = 1; i < pts.length; i++) out.push(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  return out;
}

for (const city of Object.values(CITIES)) {
  if (only.size && !only.has(city.id)) continue;
  const pts = [city.spawn, ...city.pois];
  const lat0 = Math.min(...pts.map((p) => p.lat));
  const lat1 = Math.max(...pts.map((p) => p.lat));
  const lng0 = Math.min(...pts.map((p) => p.lng));
  const lng1 = Math.max(...pts.map((p) => p.lng));
  const dLat = PAD_M / 111_320;
  const dLng = PAD_M / (111_320 * Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180));
  const bbox = `${(lat0 - dLat).toFixed(5)},${(lng0 - dLng).toFixed(5)},${(lat1 + dLat).toFixed(5)},${(lng1 + dLng).toFixed(5)}`;
  const q = `[out:json][timeout:120];(way["highway"~"^(${FREEWAY_HIGHWAY_RE})$"](${bbox});way["motorroad"="yes"](${bbox});way["highway"~"^(primary|primary_link|secondary|secondary_link)$"]["name"~"(Expressway|Expwy|Expy|Freeway|Fwy|Feeder)",i](${bbox}););out tags geom;`;
  let json: { elements?: { tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }[] } | null = null;
  for (const u of URLS) {
    try {
      const res = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "keyline-bake-freeways/1.0 (github.com/xlockeddown-glitch/keyline)" }, signal: AbortSignal.timeout(180000) });
      if (res.ok) {
        json = await res.json();
        break;
      }
      console.error(city.id, u, res.status);
    } catch (e) {
      console.error(city.id, u, (e as Error).message);
    }
  }
  if (!json) {
    console.error(city.id, "FAILED");
    continue;
  }
  const lines: number[][] = [];
  for (const el of json.elements ?? []) {
    if (!isFreeway(el.tags) || !el.geometry) continue;
    const line = pack(el.geometry);
    if (line.length >= 4) lines.push(line);
  }
  writeFileSync(`public/streets/${city.id}-fw.json`, JSON.stringify({ v: 1, step: STEP, source: "OpenStreetMap contributors (ODbL)", lines }));
  console.log(city.id, "freeway lines", lines.length);
}
