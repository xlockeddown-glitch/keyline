// 0.1.48: validate the baked city maps (scripts/bake-city-graph.mts) the way the game uses them.
//   node --experimental-strip-types scripts/check-city-graphs.mts [cityId…]   (offline; exit 1 on any failure)
// Per city: spawn, start, every lamp / station / service stand and the car lot snap within 60 m (stadiums: WALK_REACH_M) of the walk graph and
// sit in the spawn's walk component; 200 seeded lamp-to-lamp walks via routeOnGraph exist, are ≤ 2.5× the straight
// line and ride no freeway; the largest walk component holds > 95% of the walk length; gz size within budget.
// Drive gets the same snap/component/route report (informational until slice 2 drives from the baked map).
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { CITIES } from "../src/game/data.ts";
import { DEALERS } from "../src/game/cars.ts";
import { distM } from "../src/game/geo.ts";
import { createGraph, freewayRide, ingestBaked, nearest, pathLength, routeOnGraph, WALK_REACH_M, type BakedCity, type StreetGraph } from "../src/game/streets.ts";

const SNAP_M = 60;
const ROUTES = 200;
const MAX_RATIO = 2.5;
const MIN_BIG_SHARE = 0.95;
/** gz bytes per city; Chicago is the biggest play area (186 km²). */
/**
 * Points OSM itself leaves far from any walkable way (the same in a live fetch, so not a bake regression). Listed with
 * the distance measured at bake time; a known point still fails if it drifts farther than this.
 */
const KNOWN_GAPS: Record<string, number> = {
  "nashville:stadium:nash-nissan": 125, // Nissan Stadium: the lots around it are mapped as area=yes / private service.
};
/** Lamps the road can only reach the long way round (straight line is over water); drive ratio cap for routes touching them. */
const DRIVE_DETOUR: Record<string, number> = {
  "chicago:chi-northerly": 3.2, // Northerly Island: one causeway in, Solidarity Drive, so routes south loop the harbor.
  // Same ratios on a full live fetch (measured with every service road in): the car's curb is in a lot reached the long way.
  "nashville:nash-capitol": 3.3, // Capitol Hill: its drives loop up from Charlotte / 6th.
  "nashville:nash-nissan": 2.8, // Nissan Stadium lots: in from the east bank only.
};
const BUDGET_GZ: Record<string, number> = { chicago: 1_600_000, default: 600_000 };

function comps(g: StreetGraph) {
  const comp = new Int32Array(g.nodes.length).fill(-1);
  const len: number[] = [];
  for (let s = 0; s < g.nodes.length; s++) {
    if (comp[s] !== -1 || !g.adj[s]!.length) continue;
    const id = len.length;
    let m = 0;
    const stack = [s];
    comp[s] = id;
    while (stack.length) {
      const v = stack.pop()!;
      for (const e of g.adj[v]!) {
        const seg = g.segs[e]!;
        if (seg.a === v) m += seg.length;
        const o = seg.a === v ? seg.b : seg.a;
        if (comp[o] === -1) {
          comp[o] = id;
          stack.push(o);
        }
      }
    }
    len.push(m);
  }
  return { comp, len };
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const man = JSON.parse(readFileSync("public/streets/v2/manifest.json", "utf8")) as { cities: Record<string, { file: string }> };
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
let bad = 0;
const fail = (msg: string) => {
  bad++;
  console.log("FAIL", msg);
};
for (const [city, { file }] of Object.entries(man.cities)) {
  if (only.length && !only.includes(city)) continue;
  const c = CITIES[city as keyof typeof CITIES];
  const packed = readFileSync(`public/streets/v2/${file}`);
  const raw = file.endsWith(".gz") ? gunzipSync(packed) : packed;
  const gz = packed.length;
  const d = JSON.parse(raw.toString("utf8")) as BakedCity;
  const budget = BUDGET_GZ[city] ?? BUDGET_GZ.default!;
  console.log(`\n${city}: ${file} ${(raw.length / 1e6).toFixed(2)} MB, ${(gz / 1e6).toFixed(2)} MB gz (budget ${(budget / 1e6).toFixed(2)}), snapshot ${d.snapshot}`);
  if (gz > budget) fail(`${city} size ${gz} > ${budget}`);
  if (!/OpenStreetMap contributors/.test(d.source) || !/ODbL/.test(d.source)) fail(`${city} missing ODbL source`);
  const hasDrive = d.ways.some((w) => (w[2]! & 2) !== 0);
  for (const mode of hasDrive ? (["walk", "drive"] as const) : (["walk"] as const)) {
    const t0 = performance.now();
    const g = ingestBaked(createGraph(c.spawn.lat, c.spawn.lng), d, mode === "drive");
    const ms = performance.now() - t0;
    const { comp, len } = comps(g);
    const total = len.reduce((a, b) => a + b, 0);
    const spawnSnap = nearest(g, c.spawn.lat, c.spawn.lng, SNAP_M);
    const root = spawnSnap ? comp[g.segs[spawnSnap.seg]!.a]! : -1;
    const share = root >= 0 ? len[root]! / total : 0;
    const bigShare = Math.max(...len) / total;
    const strict = true;
    const report = (m: string) => (strict ? fail(m) : console.log("note", m));
    console.log(`  ${mode}: ${g.nodes.length} nodes, ${g.segs.length} segs, ${g.fw.length} fw segs, ingest ${ms.toFixed(0)} ms (node), ${len.length} comps, largest ${(bigShare * 100).toFixed(1)}%, spawn's ${(share * 100).toFixed(1)}%`);
    if (share < MIN_BIG_SHARE) report(`${city} ${mode} spawn component ${(share * 100).toFixed(1)}% < 95%`);
    if (mode === "drive") {
      // Car lot: its door snaps onto the road within 60 m, on the main road network. Lamps: the curb the car stops at
      // (the nearest road within 250 m) must be on the main network, or the car can't get there.
      const dl = DEALERS[c.id];
      const ds = nearest(g, dl.lat, dl.lng, SNAP_M, comp, root);
      if (!ds || ds.dist > SNAP_M) report(`${city} drive car lot not within ${SNAP_M} m of the main road network`);
      let curbBad = 0;
      let curbWorst = 0;
      for (const p of c.pois) {
        // A stub of lot road beside the lamp may be its own piece; routeOnGraph then stops on the main network's
        // nearest curb, so that one must be within 250 m.
        const main = nearest(g, p.lat, p.lng, 250, comp, root);
        const d = main && main.dist <= 250 ? main.dist : Infinity;
        curbWorst = Math.max(curbWorst, d);
        if (d === Infinity) {
          curbBad++;
          report(`${city} drive: no curb on the main road network within 250 m of ${p.id}`);
        }
      }
      console.log(`  drive: car lot ${ds ? ds.dist.toFixed(0) : "–"} m from road; ${c.pois.length - curbBad}/${c.pois.length} lamp curbs on the main network (farthest curb ${curbWorst.toFixed(0)} m)`);
    }
    const pts: { id: string; lat: number; lng: number; big?: boolean }[] = mode === "drive" ? [] : [
      { id: "spawn", ...c.spawn },
      ...(c.start ? [{ id: "start", ...c.start }] : []),
      // Stadiums are big footprints: the walk only has to come within the game's walk reach (WALK_REACH_M).
      ...c.pois.map((p) => ({ id: `${p.kind}:${p.id}`, lat: p.lat, lng: p.lng, big: p.kind === "stadium" })),
      { id: "dealer", lat: DEALERS[c.id].lat, lng: DEALERS[c.id].lng },
    ];
    let off = 0;
    let worst = 0;
    for (const p of pts) {
      const s0 = nearest(g, p.lat, p.lng, SNAP_M, comp, root);
      const s = s0 && s0.dist <= (p.big ? WALK_REACH_M : SNAP_M) ? s0 : null;
      const known = mode === "walk" ? KNOWN_GAPS[`${city}:${p.id}`] : undefined;
      if (!s && known !== undefined) {
        const any = nearest(g, p.lat, p.lng, 400);
        if (any && any.dist <= known) {
          console.log(`  known gap: ${p.id} ${any.dist.toFixed(0)} m from the nearest walk way (allowed ${known} m)`);
          continue;
        }
      }
      if (!s) {
        off++;
        const any = nearest(g, p.lat, p.lng, 400);
        report(`${city} ${mode} ${p.id} not within ${SNAP_M} m of the spawn's ${mode} component (nearest any ${any ? any.dist.toFixed(0) + " m" : "> 400 m"})`);
      } else worst = Math.max(worst, s.dist);
    }
    if (pts.length) console.log(`  ${mode}: ${pts.length - off}/${pts.length} points snap on the spawn's component (≤ ${SNAP_M} m, stadiums ≤ ${WALK_REACH_M} m; worst ${worst.toFixed(0)} m)`);
    const lamps = c.pois.filter((p) => p.kind !== "station" && !/counter|board|outfitter/.test(p.kind));
    const r = rng(148);
    let ok = 0;
    let nulls = 0;
    let long = 0;
    let fwHits = 0;
    let maxRatio = 0;
    let routeMs = 0;
    for (let i = 0; i < ROUTES; i++) {
      const a = lamps[Math.floor(r() * lamps.length)]!;
      let b = lamps[Math.floor(r() * lamps.length)]!;
      if (b === a) b = lamps[(lamps.indexOf(a) + 1) % lamps.length]!;
      const t = performance.now();
      // The walker stands where its last walk ended, on the street network, not on a stray footway stub by the lamp.
      const from = nearest(g, a.lat, a.lng, 160, comp, root) ?? a;
      const path = routeOnGraph(g, from, b);
      routeMs = Math.max(routeMs, performance.now() - t);
      if (!path) {
        nulls++;
        if (nulls <= 5) report(`${city} ${mode} no route ${a.id} → ${b.id} (${distM(a.lat, a.lng, b.lat, b.lng).toFixed(0)} m)`);
        continue;
      }
      const straight = Math.max(distM(a.lat, a.lng, b.lat, b.lng), 50);
      const ratio = pathLength(path) / straight;
      maxRatio = Math.max(maxRatio, ratio);
      const cap = mode === "drive" ? Math.max(MAX_RATIO, DRIVE_DETOUR[`${city}:${a.id}`] ?? 0, DRIVE_DETOUR[`${city}:${b.id}`] ?? 0) : MAX_RATIO;
      if (ratio > cap) {
        long++;
        if (long <= 5) report(`${city} ${mode} ${a.id} → ${b.id} ${ratio.toFixed(2)}× straight`);
        continue;
      }
      if (mode === "walk") {
        const fw = freewayRide(g, path);
        if (fw >= 20) {
          fwHits++;
          if (fwHits <= 5) fail(`${city} walk ${a.id} → ${b.id} rides ${fw.toFixed(0)} m of freeway`);
          continue;
        }
      }
      ok++;
    }
    if (nulls > 5 || long > 5 || fwHits > 5) report(`${city} ${mode}: ${nulls} null, ${long} too long, ${fwHits} on freeway (first 5 shown)`);
    console.log(`  ${mode}: ${ok}/${ROUTES} routes ok (null ${nulls}, > ${MAX_RATIO}× ${long}, freeway ${fwHits}), max ratio ${maxRatio.toFixed(2)}, slowest route ${routeMs.toFixed(0)} ms`);
  }
}
console.log(bad ? `\ncheck:city-graphs FAIL — ${bad} problem(s)` : "\ncheck:city-graphs ok");
process.exit(bad ? 1 : 0);
