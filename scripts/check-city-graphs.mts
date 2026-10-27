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
/** Kinds that are not lamps: they need the walk, not a curb (you park and walk to a counter or a board). */
const NOT_LAMP = /station|counter|board|outfitter|shop/;

/**
 * Per-city rules. Every exception carries its reason; anything not listed fails.
 * - budget: gz bytes (measured size + ~10%).
 * - water: the city's network is split by water (a river, a harbor). The > 95% component rule is replaced by: every
 *   point and lamp sits on the spawn's component and every sampled lamp-to-lamp route exists. The script prints the
 *   other big components so the split can be checked against a map.
 * - walkRatio / driveRatio: route-length cap over the straight line for the whole city (water crossings, one-ways).
 * - snap: per-point allowance in meters (OSM leaves the point that far from any way, the same in a live fetch).
 * - gaps: `walk:<lamp>` / `drive:<lamp>` the baked map can't reach, and a live Overpass fetch can't either (same query,
 *   same filters). Skipped in route sampling, printed as KNOWN UNREACHABLE in every run; they stay real problems until
 *   the lamp moves or OSM changes.
 */
type Rules = { budget: number; water?: string; walkRatio?: number; driveRatio?: number; snap?: Record<string, number>; gaps?: Record<string, string> };
// Budgets: the 2026-10-27 bake's gz bytes + ~10%. Ratio caps: the measured worst over the seeded 200 routes, rounded up;
// the long ones are short hops (straight line floored at 50 m) where a one-way grid, a river or a pedestrian mall
// forces a loop around the block.
const RULES: Record<string, Rules> = {
  austin: { budget: 720_000, walkRatio: 2.8, driveRatio: 4.0 }, // Lady Bird Lake: bridges every ~1 km; Congress/6th one-ways.
  boston: { budget: 810_000, driveRatio: 5.8, water: "Inner Harbor: East Boston is reached by tunnels only (no walk; drive tunnels are freeways)" }, // Quincy Mkt→Faneuil: pedestrian plaza, car loops the one-ways.
  chicago: { budget: 1_560_000, driveRatio: 3.2 }, // Northerly Island: one causeway, routes south loop the harbor.
  denver: { budget: 500_000, walkRatio: 4.5, driveRatio: 4.4 }, // Elitch/Aquarium/Ball Arena: the Platte, I-25 and rail yards; Byers→Dam: Cherry Creek.
  detroit: {
    budget: 650_000, walkRatio: 2.7, driveRatio: 7.3, water: "Detroit River: the Windsor side (Ambassador Bridge / tunnel are freeways, no walk)",
    gaps: { "walk:ford-field": "stadium footprint: nearest public walk way 122–126 m out (stairs, footways at the edge), past the 110 m walk reach" },
  }, // Hart Plaza→Spirit: Woodward/Jefferson one-ways + plaza, short hop.
  la: { budget: 1_600_000, driveRatio: 4.6 }, // Little Tokyo/JANM: 1st St one-way pair; Hollywood/Highland mall.
  london: { budget: 1_070_000, driveRatio: 7.8 }, // Tower Bridge→Tate etc.: one-ways, the Tower, bus-only lanes.
  nashville: { budget: 310_000, driveRatio: 3.3, snap: { "stadium:nash-nissan": 125 } }, // Capitol Hill drive loop; Nissan lots are area=yes/private.
  nola: { budget: 230_000, driveRatio: 3.3, water: "Mississippi: Algiers (Crescent City Connection is a freeway, no walk; the ferry isn't a way)" }, // Jackson Sq pedestrian mall.
  nyc: {
    budget: 850_000, driveRatio: 4.5, // NYPL→Bryant Park: next door, the car loops the 42nd/40th one-ways.
    water: "Hudson: the New Jersey side (Lincoln/Holland tunnels are freeways, no walk)",
    gaps: {
      "drive:bethesda": "Central Park drives are car-free (no motor vehicles); nearest drivable way 251 m, a park service road off the network",
      "drive:brooklyn-br": "lamp sits at 40.7061,-73.9969, ~180 m off the bridge line; nearest drivable way 325 m (South St)",
    },
  },
  seattle: { budget: 440_000, driveRatio: 6.1 }, // Seattle Center: the campus is pedestrian, cars loop Mercer/Denny.
  sf: { budget: 690_000, driveRatio: 3.3, gaps: { "walk:gg-crissy": "lamp at 37.8076,-122.4667 is ~200 m out in the bay; nearest walk way 203 m" } }, // Twin Peaks figure-eight.
  temple: {
    budget: 370_000, walkRatio: 3.5, driveRatio: 3.6,
    gaps: {
      "walk:sammons": "the park's path loop (11 m away) is its own piece; the street network is > 110 m away (the offline proof still arrives, ending 117 m out)",
      "walk:draughon": "Draughon-Miller airport: nearest way of any kind 290–309 m",
      "drive:draughon": "Draughon-Miller airport: nearest way of any kind 290–309 m",
    },
  }, // Woodson Field ↔ THS: the campus has one gate.
  toronto: { budget: 790_000 },
  tucson: {
    budget: 1_010_000, walkRatio: 3.3, driveRatio: 3.7, // TCC ↔ St. Augustine: the convention-center superblock.
    gaps: {
      "walk:tuc-santa-rita": "park interior: its footways (54 m) are their own piece; the nearest street is 140 m (the offline proof still arrives, ending 119 m out)",
      "walk:pima-air": "museum grounds: its paths are their own piece (access=customers); the public street is > 110 m",
      "walk:raytheon-tucson": "secured campus: every way within 180 m is access=private (dropped); nearest public way 126 m",
      "drive:raytheon-tucson": "secured campus: the service roads 182 m out connect only through access=private roads",
    },
  },
};
const ratioCap = (r: Rules, mode: "walk" | "drive") => (mode === "walk" ? r.walkRatio : r.driveRatio) ?? MAX_RATIO;

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
const summary: string[] = [];
const knownGaps: string[] = [];
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
  const badBefore = bad;
  if (!RULES[city]) fail(`${city} has no RULES entry (budget etc.)`);
  const rules = RULES[city] ?? { budget: 600_000 };
  const budget = rules.budget;
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
    const waterSplit = share < MIN_BIG_SHARE && !!rules.water;
    if (share < MIN_BIG_SHARE && !rules.water) report(`${city} ${mode} spawn component ${(share * 100).toFixed(1)}% < 95%`);
    if (waterSplit) {
      // Show the other big pieces (share, center) so the split can be checked against a map: across the river, or broken data?
      const order = len.map((l, i) => [l, i] as const).filter(([, i]) => i !== root).sort((x, y) => y[0] - x[0]).slice(0, 3);
      const desc = order.map(([l, i]) => {
        let la = 0, lo = 0, n = 0;
        for (let k = 0; k < g.nodes.length; k++) if (comp[k] === i) { la += g.nodes[k]!.lat; lo += g.nodes[k]!.lng; n++; }
        return `${((l / total) * 100).toFixed(1)}% @ ${(la / n).toFixed(4)},${(lo / n).toFixed(4)}`;
      });
      console.log(`  ${mode}: water split (${rules.water}): spawn's piece ${(share * 100).toFixed(1)}%; others ${desc.join("; ")}`);
    }
    if (mode === "drive") {
      // Car lot: its door snaps onto the road within 60 m, on the main road network. Lamps: the curb the car stops at
      // (the nearest road within 250 m) must be on the main network, or the car can't get there.
      const dl = DEALERS[c.id];
      const ds = nearest(g, dl.lat, dl.lng, SNAP_M, comp, root);
      if (!ds || ds.dist > SNAP_M) report(`${city} drive car lot not within ${SNAP_M} m of the main road network`);
      let curbBad = 0;
      const driveToast: string[] = [];
      let curbWorst = 0;
      for (const p of c.pois) {
        if (NOT_LAMP.test(p.kind)) continue;
        if (rules.gaps?.[`drive:${p.id}`]) {
          console.log(`  KNOWN UNREACHABLE: drive ${p.id} — ${rules.gaps[`drive:${p.id}`]}`);
          knownGaps.push(`${city} drive ${p.id}`);
          continue;
        }
        // A stub of lot road beside the lamp may be its own piece; routeOnGraph then stops on the main network's
        // nearest curb, so that one must be within 250 m.
        // A seated tap more than 140 m from any road toasts "No road that way." (GameMap): the player parks and walks.
        // Not a failure (park interiors, pedestrian bridges), but listed so it's a known, deliberate stop.
        const near = nearest(g, p.lat, p.lng, 140);
        if (!near || near.dist > 140) driveToast.push(p.id);
        const main = nearest(g, p.lat, p.lng, 250, comp, root);
        const d = main && main.dist <= 250 ? main.dist : Infinity;
        curbWorst = Math.max(curbWorst, d);
        if (d === Infinity) {
          curbBad++;
          report(`${city} drive: no curb on the main road network within 250 m of ${p.id}`);
        }
      }
      if (driveToast.length) console.log(`  drive: no road within 140 m (in a car the tap toasts; park and walk): ${driveToast.join(", ")}`);
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
            // The game's walk ends on the street and hops the last gap when it is ≤ WALK_REACH_M (finishPath), so a lamp counts
      // as reached when the spawn's network comes that close. Spawn, start and dealer must sit on it (≤ SNAP_M).
      const reach = p.id === "spawn" || p.id === "start" || p.id === "dealer" ? SNAP_M : WALK_REACH_M;
      const s1 = nearest(g, p.lat, p.lng, reach, comp, root);
      const s = s1 && s1.dist <= reach ? s1 : null;
      const poiId = p.id.split(":")[1] ?? p.id;
      const gap = rules.gaps?.[`${mode}:${poiId}`];
      const known = rules.snap?.[p.id] ?? (gap ? Infinity : undefined);
      if (!s && known !== undefined) {
        const any = nearest(g, p.lat, p.lng, 400);
        if (known === Infinity || (any && any.dist <= known)) {
          if (known === Infinity) {
            console.log(`  KNOWN UNREACHABLE: ${p.id} (${any ? any.dist.toFixed(0) + " m to any way" : "> 400 m"}) — ${gap}`);
            knownGaps.push(`${city} ${mode} ${poiId}`);
            continue;
          }
          console.log(`  known gap: ${p.id} ${any.dist.toFixed(0)} m from the nearest ${mode} way (allowed ${known} m)`);
          continue;
        }
      }
      if (!s) {
        off++;
        const any = nearest(g, p.lat, p.lng, 400);
        report(`${city} ${mode} ${p.id} not within walk reach of the spawn's ${mode} component (nearest any ${any ? any.dist.toFixed(0) + " m" : "> 400 m"})`);
      } else worst = Math.max(worst, s.dist);
    }
    if (pts.length) console.log(`  ${mode}: ${pts.length - off}/${pts.length} points on the spawn's component (spawn/dealer ≤ ${SNAP_M} m, lamps ≤ ${WALK_REACH_M} m walk reach; worst ${worst.toFixed(0)} m)`);
    const lamps = c.pois.filter((p) => !NOT_LAMP.test(p.kind) && !rules.gaps?.[`${mode}:${p.id}`]);
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
      const cap = ratioCap(rules, mode);
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
    if (waterSplit && nulls) report(`${city} ${mode}: water split allowed only when every lamp route exists (${nulls} null)`);
    if (nulls > 5 || long > 5 || fwHits > 5) report(`${city} ${mode}: ${nulls} null, ${long} too long, ${fwHits} on freeway (first 5 shown)`);
    console.log(`  ${mode}: ${ok}/${ROUTES} routes ok (null ${nulls}, > ${ratioCap(rules, mode)}× ${long}, freeway ${fwHits}), max ratio ${maxRatio.toFixed(2)}, slowest route ${routeMs.toFixed(0)} ms`);
  }
  summary.push(`${city}:${bad === badBefore ? "PASS" : `FAIL(${bad - badBefore})`}`);
}
console.log("\nsummary:", summary.join("  "));
if (knownGaps.length) console.log(`\nKNOWN UNREACHABLE (not failing, still real problems): ${knownGaps.join("; ")}`);
console.log(bad ? `\ncheck:city-graphs FAIL — ${bad} problem(s)` : "\ncheck:city-graphs ok");
process.exit(bad ? 1 : 0);
