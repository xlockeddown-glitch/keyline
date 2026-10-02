import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { CITIES } from "../src/game/data.ts";

// Foot profile only. Never router.project-osrm.org — it answers every profile with car routes
// (that's how detroit.json came to run down the Lodge and Fisher freeways before 0.0.32).
const OSRM = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const FORCE = new Set(process.argv.slice(2));

async function route(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const url = `${OSRM}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  await new Promise((r) => setTimeout(r, 200));
  const res = await fetch(url, { headers: { "User-Agent": "keyline-bake/1.0" } });
  if (!res.ok) return null;
  const j = (await res.json()) as { routes?: { geometry?: { coordinates?: [number, number][] } }[] };
  const coords = j.routes?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const line: number[] = [];
  for (const [lng, lat] of coords) {
    line.push(Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5);
  }
  return line;
}

async function bake() {
  mkdirSync("public/streets", { recursive: true });
  for (const city of Object.values(CITIES)) {
    if (FORCE.size && !FORCE.has(city.id)) continue;
    if (!FORCE.has(city.id) && existsSync(`public/streets/${city.id}.json`)) {
      console.log(city.id, "skip");
      continue;
    }
    const lines: number[][] = [];
    for (const p of city.pois) {
      const ln = await route(city.spawn, p);
      if (ln) lines.push(ln);
    }
    const left = [...city.pois];
    let cur: { lat: number; lng: number } = city.spawn;
    while (left.length) {
      left.sort((a, b) => {
        const da = (a.lat - cur.lat) ** 2 + (a.lng - cur.lng) ** 2;
        const db = (b.lat - cur.lat) ** 2 + (b.lng - cur.lng) ** 2;
        return da - db;
      });
      const nxt = left.shift()!;
      const ln = await route(cur, nxt);
      if (ln) lines.push(ln);
      cur = nxt;
    }
    writeFileSync(`public/streets/${city.id}.json`, JSON.stringify({ lines }));
    console.log(city.id, "lines", lines.length);
  }
}

void bake();
