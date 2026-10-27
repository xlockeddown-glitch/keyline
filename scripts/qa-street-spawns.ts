// 0.0.90: every street match spawn lands on the walk you can reach on foot from the city start.
// Samples a full day of spawns per city (the seed + the day cap from streetDrop, plus night-market drops on
// every baked market street) on the city's OSM walk graph, and asserts 100% are within MATCH_GRAB_M of a
// segment in the start's walk component. `--before` measures the pre-0.0.90 drop (any segment, raw market point).
// OSM per city: /tmp/keyline-market-osm/<city>.json (fetched from Overpass and cached when missing).
// node --experimental-strip-types scripts/qa-street-spawns.ts [--before]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { MATCH_GRAB_M, bindWalkGraph, createGraph, ingestOsmWays, nearest, onStreet, randomOnStreet, reachableDrop, startReach, streetDrop, walkReach } from "../src/game/streets.ts";
import { CITIES, CITY_LIST } from "../src/game/data.ts";
import { SEED, STREET_DAY_CAP } from "../src/game/streetSpots.ts";
import { MARKET_STREETS } from "../src/game/marketStreets.ts";
import { pointOnMarket } from "../src/game/nightMarket.ts";

const before = process.argv.includes("--before");
const DIR = "/tmp/keyline-market-osm";
type Way = { id: number; tags: Record<string, string>; line: number[] };

const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.openstreetmap.fr/api/interpreter"];

/** OSM ways for a city, or null when every Overpass mirror fails (the city is then skipped, not failed). */
async function waysFor(city: string, lat: number, lng: number): Promise<Way[] | null> {
  const f = `${DIR}/${city}.json`;
  if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8"));
  const q = `[out:json][timeout:120];way(around:3000,${lat},${lng})[highway];out tags geom;`;
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "keyline-qa/1.0" }, body: "data=" + encodeURIComponent(q), signal: AbortSignal.timeout(150_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { elements: { id: number; tags: Record<string, string>; geometry?: ({ lat: number; lon: number } | null)[] }[] };
      // Null geometry points (Overpass gaps) are dropped; a way left with < 2 points is skipped.
      const ways = j.elements
        .map((e) => ({ id: e.id, tags: e.tags, pts: (e.geometry ?? []).filter((p): p is { lat: number; lon: number } => p != null) }))
        .filter((e) => e.pts.length >= 2)
        .map((e) => ({ id: e.id, tags: e.tags, line: e.pts.flatMap((p) => [p.lat, p.lon]) }));
      mkdirSync(DIR, { recursive: true });
      writeFileSync(f, JSON.stringify(ways));
      return ways;
    } catch (err) {
      console.log(`     ${city}: Overpass ${new URL(url).host} failed (${(err as Error).message})`);
    }
  }
  return null;
}

let rnd = 1;
Math.random = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648);

let failed = 0;
const skipped: string[] = [];
for (const c of CITY_LIST) {
  const city = CITIES[c.id];
  const start = city.start ?? city.spawn;
  const ways = await waysFor(c.id, city.spawn.lat, city.spawn.lng);
  if (!ways) {
    console.log(`SKIP ${c.id.padEnd(10)} no OSM data (Overpass unreachable, nothing cached)`);
    skipped.push(c.id);
    continue;
  }
  const g = createGraph(city.spawn.lat, city.spawn.lng);
  ingestOsmWays(g, ways.map((w) => ({ tags: w.tags, geometry: Array.from({ length: w.line.length / 2 }, (_, i) => ({ lat: w.line[2 * i]!, lon: w.line[2 * i + 1]! })) })));
  bindWalkGraph(g, start);
  const reach = startReach(g, start)!;
  const pts: { lat: number; lng: number }[] = [];
  const n = SEED.length + STREET_DAY_CAP;
  for (let i = 0; i < n; i++) {
    const [minM, maxM] = i < SEED.length ? [160 + i * 90, 2100] : [220, 2200];
    pts.push(before ? randomOnStreet(g, city.spawn, minM, maxM) : streetDrop(city.spawn, minM, maxM));
  }
  for (const s of MARKET_STREETS[c.id] ?? []) {
    for (let k = 0; k < 6; k++) {
      const raw = pointOnMarket(s);
      pts.push(before ? onStreet(g, raw.lat, raw.lng) : reachableDrop(raw));
    }
  }
  void walkReach;
  let bad = 0;
  for (const p of pts) {
    const near = nearest(g, p.lat, p.lng, MATCH_GRAB_M, reach.labels, reach.id);
    if (!near || near.dist > MATCH_GRAB_M) bad++;
  }
  const pct = (100 * bad) / pts.length;
  console.log(`${bad ? "FAIL" : "ok  "} ${c.id.padEnd(10)} ${pts.length} spawns, unreachable ${bad} (${pct.toFixed(1)}%)`);
  if (bad && !before) failed++;
}
bindWalkGraph(null);
if (skipped.length) console.log(`qa:street-spawns: SKIPPED ${skipped.length} cities, Overpass unreachable: ${skipped.join(" ")} (network, not a game failure)`);
if (failed) {
  console.log(`qa:street-spawns: ${failed} cities with unreachable spawns`);
  process.exit(1);
}
if (skipped.length === CITY_LIST.length) { console.log("qa:street-spawns: nothing checked (no network); treat as skipped"); process.exit(0); }
console.log(before ? "qa:street-spawns --before: measured" : `qa:street-spawns: 100% reachable in every ${skipped.length ? "checked " : ""}city`);
