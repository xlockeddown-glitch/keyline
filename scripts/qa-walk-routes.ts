// Live check: the online foot router's answers for the freeway cases in paths.test.ts stay off freeways.
// node --experimental-strip-types scripts/qa-walk-routes.ts
import { readFileSync } from "node:fs";
import { clearOfFreeway, createGraph, ingestOsmWays, offFreeway, onFreeway, osrmRoute, pickWalk, pullToStreet } from "../src/game/streets.ts";
import { isFreeway, isWalkableWay } from "../src/game/walkable.ts";
import { freewayGap, freewayRun } from "../src/game/pathCheck.ts";
import { dailyRoute, utcDay } from "../src/game/dailyRun.ts";
import { CITIES } from "../src/game/data.ts";

const src = readFileSync(new URL("../src/game/paths.test.ts", import.meta.url), "utf8");
const cases = [...src.matchAll(/city: "(\w+)", name: "([^"]+)", from: \{ lat: ([\d.-]+), lng: ([\d.-]+) \}, to: \{ lat: ([\d.-]+), lng: ([\d.-]+) \}/g)];
let bad = 0;
for (const m of cases) {
  const [, city, name, a, b, c, d] = m;
  const f = JSON.parse(readFileSync(new URL(`../src/game/fixtures/paths-${city}.json`, import.meta.url), "utf8"));
  const P = (w: { line: number[] }) => { const o = []; for (let i = 0; i + 1 < w.line.length; i += 2) o.push({ lat: w.line[i]!, lng: w.line[i + 1]! }); return o; };
  const fw = f.ways.filter((w: { tags: object }) => isFreeway(w.tags)).map(P);
  const walk = f.ways.filter((w: { tags: object }) => isWalkableWay(w.tags)).map(P);
  const path = await osrmRoute({ lat: +a!, lng: +b! }, { lat: +c!, lng: +d! });
  if (!path) { console.log("NO ROUTE", city, name); continue; }
  const r = freewayRun(path, fw, 6, 25, walk, 4);
  if (r.run >= 20) bad++;
  console.log(r.run >= 20 ? "FAIL" : "ok  ", city.padEnd(8), name, `freeway ride ${r.run.toFixed(0)} m`, r.at ? `near ${r.at.lat.toFixed(5)},${r.at.lng.toFixed(5)}` : "");
}
// 0.0.43 Daily Lantern Run: today's route legs (spawn → lamp 1 → … → lamp 5) from the online foot router.
const day = utcDay();
for (const city of ["detroit", "austin", "nyc", "seattle", "denver", "nashville"] as const) {
  const f = JSON.parse(readFileSync(new URL(`../src/game/fixtures/paths-daily-${city}.json`, import.meta.url), "utf8"));
  const P = (w: { line: number[] }) => { const o = []; for (let i = 0; i + 1 < w.line.length; i += 2) o.push({ lat: w.line[i]!, lng: w.line[i + 1]! }); return o; };
  const fw = f.ways.filter((w: { tags: object }) => isFreeway(w.tags)).map(P);
  const walk = f.ways.filter((w: { tags: object }) => isWalkableWay(w.tags)).map(P);
  const r = dailyRoute(city, day);
  const stops = [CITIES[city].spawn, ...r.lamps];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    const name = `daily ${day} ${i === 1 ? "spawn" : `lamp ${i - 1}`} → lamp ${i} (${(b as { name?: string }).name ?? ""})`;
    const path = await osrmRoute({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
    if (!path) { console.log("NO ROUTE", city, name); continue; }
    const res = freewayRun(path, fw, 6, 25, walk, 4);
    if (res.run >= 20) bad++;
    console.log(res.run >= 20 ? "FAIL" : "ok  ", city.padEnd(8), name, `freeway ride ${res.run.toFixed(0)} m`, res.at ? `near ${res.at.lat.toFixed(5)},${res.at.lng.toFixed(5)}` : "");
  }
}
// 0.0.52b: ramp/feeder spot-check — from the middle of a few motorway/trunk ramps in every fixture city (the Ohio
// Street feeder in Chicago among them), the online foot router's walk to the fixture's center stays off freeways.
for (const city of ["chicago", "detroit", "nyc", "austin", "la", "seattle", "denver", "nashville"]) {
  const f = JSON.parse(readFileSync(new URL(`../src/game/fixtures/paths-${city}.json`, import.meta.url), "utf8"));
  const P = (w: { line: number[] }) => { const o = []; for (let i = 0; i + 1 < w.line.length; i += 2) o.push({ lat: w.line[i]!, lng: w.line[i + 1]! }); return o; };
  const fw = f.ways.filter((w: { tags: object }) => isFreeway(w.tags)).map(P);
  const walk = f.ways.filter((w: { tags: object }) => isWalkableWay(w.tags)).map(P);
  const ramps = f.ways.filter((w: { tags: { highway?: string } }) => /^(motorway|trunk)_link$/.test(w.tags.highway ?? ""));
  const pick = city === "chicago" ? [...ramps.filter((w: { id: number }) => [898010482, 1013537658, 435551676].includes(w.id)), ramps[0]] : [0, 1, 2, 3].map((k) => ramps[Math.floor(((k + 0.5) * ramps.length) / 4)]);
  for (const w of pick) {
    if (!w) continue;
    const line = P(w);
    const a = line[Math.floor(line.length / 2)]!;
    const path = await osrmRoute(a, { lat: f.area.lat, lng: f.area.lng });
    const name = `ramp ${w.id} (${w.tags.name ?? w.tags.ref ?? w.tags.highway}) → center`;
    if (!path) { console.log("NO ROUTE", city, name); continue; }
    const r = freewayRun(path, fw, 6, 25, walk, 4);
    if (r.run >= 20) bad++;
    console.log(r.run >= 20 ? "FAIL" : "ok  ", city.padEnd(8), name, `freeway ride ${r.run.toFixed(0)} m`, r.at ? `near ${r.at.lat.toFixed(5)},${r.at.lng.toFixed(5)}` : "");
  }
}
// 0.0.52b: Ryan's River West screenshot, end to end — the walker dropped on the Ohio Street feeder, the start the
// game would use (offFreeway + pullToStreet on the fixture's walk graph), the live foot route, and the walk
// pickWalk actually hands the map. No step of it may sit on or ride a freeway, ramp or feeder.
{
  const f = JSON.parse(readFileSync(new URL("../src/game/fixtures/paths-chicago.json", import.meta.url), "utf8"));
  const P = (w: { line: number[] }) => { const o = []; for (let i = 0; i + 1 < w.line.length; i += 2) o.push({ lat: w.line[i]!, lng: w.line[i + 1]! }); return o; };
  const fw = f.ways.filter((w: { tags: object }) => isFreeway(w.tags)).map(P);
  const walk = f.ways.filter((w: { tags: object }) => isWalkableWay(w.tags)).map(P);
  const g = createGraph(f.area.lat, f.area.lng);
  ingestOsmWays(g, f.ways.map((w: { line: number[]; tags: Record<string, string> }) => ({ geometry: P(w).map((p) => ({ lat: p.lat, lon: p.lng })), tags: w.tags })));
  const chi = cases.filter((m) => m[1] === "chicago");
  for (const m of chi) {
    const [, , name, a, b, c, d] = m;
    const raw = { lat: +a!, lng: +b! };
    const off = offFreeway(g, raw);
    const from = clearOfFreeway(g, pullToStreet(g, off.lat, off.lng, 140));
    const to = pullToStreet(g, +c!, +d!, 220, from);
    const online = await osrmRoute(from, to);
    const path = pickWalk(g, online, from, to);
    const startBad = onFreeway(g, from) || freewayGap(from, fw) <= 7;
    if (!path) { console.log("NO ROUTE", "chicago ", "picked", name); continue; }
    const r = freewayRun(path, fw, 6, 25, walk, 4);
    const fail = startBad || r.run >= 20;
    if (fail) bad++;
    console.log(fail ? "FAIL" : "ok  ", "chicago ", "picked walk:", name, `start ${startBad ? "ON FREEWAY" : `${freewayGap(from, fw).toFixed(0)} m off freeways`} (moved ${Math.round(Math.hypot((raw.lat - from.lat) * 111320, (raw.lng - from.lng) * 82900))} m), freeway ride ${r.run.toFixed(0)} m`, r.at ? `near ${r.at.lat.toFixed(5)},${r.at.lng.toFixed(5)}` : "");
  }
}
process.exit(bad ? 1 : 0);
