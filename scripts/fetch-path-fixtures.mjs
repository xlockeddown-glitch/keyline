// Snapshot OSM ways around known freeway trouble spots for streets.test.ts (offline, real geometry).
// node scripts/fetch-path-fixtures.mjs  → src/game/fixtures/paths-<id>.json
import { writeFileSync } from "node:fs";
const AREAS = {
  detroit: { lat: 42.3375, lng: -83.0590, r: 1200 },
  nyc: { lat: 40.7430, lng: -73.9730, r: 900 },
  austin: { lat: 30.2645, lng: -97.7345, r: 900 },
  la: { lat: 34.0560, lng: -118.2500, r: 1500 },
  // 0.0.43 Daily Lantern Run: every daily-eligible lamp (≤1600 m of spawn) plus a walking margin.
  "daily-detroit": { lat: 42.3314, lng: -83.0466, r: 1900 },
  "daily-austin": { lat: 30.2681, lng: -97.7418, r: 1900 },
  "daily-nyc": { lat: 40.758, lng: -73.9855, r: 1900 },
};
const URLS = ["https://overpass.openstreetmap.fr/api/interpreter", "https://overpass-api.de/api/interpreter"];
const KEEP = ["highway", "name", "ref", "foot", "access", "motorroad", "area", "sidewalk", "bridge", "tunnel", "layer"];
const only = process.argv[2];
for (const [id, a] of Object.entries(AREAS)) {
  if (only && id !== only) continue;
  const q = `[out:json][timeout:90];way["highway"](around:${a.r},${a.lat},${a.lng});out tags geom;`;
  let json = null;
  for (const u of URLS) {
    try {
      const res = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "keyline-path-fixtures/1.0 (github.com/xlockeddown-glitch/keyline)" }, signal: AbortSignal.timeout(120000) });
      if (res.ok) { json = await res.json(); break; }
      console.error(id, u, res.status);
    } catch (e) { console.error(id, u, e.message); }
  }
  if (!json) { console.error(id, "FAILED"); continue; }
  const ways = [];
  for (const el of json.elements ?? []) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const tags = {};
    for (const k of KEEP) if (el.tags?.[k] != null) tags[k] = el.tags[k];
    const line = [];
    for (const p of el.geometry) line.push(Math.round(p.lat * 1e6) / 1e6, Math.round(p.lon * 1e6) / 1e6);
    ways.push({ id: el.id, tags, line });
  }
  writeFileSync(`src/game/fixtures/paths-${id}.json`, JSON.stringify({ area: a, source: "OpenStreetMap contributors (ODbL), Overpass snapshot " + new Date().toISOString().slice(0, 10), ways }));
  console.log(id, ways.length);
}
