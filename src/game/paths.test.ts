import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canGrabMatch, createGraph, ingestOsmWays, MATCH_GRAB_M, nearest, OSRM_FOOT, pickWalk, pullToStreet, randomOnStreet, routeOnGraph, spreadOnGraph, type Pt } from "./streets.ts";
import { isFreeway, isWalkableWay } from "./walkable.ts";
import { freewayGap, freewayRun } from "./pathCheck.ts";

// Real OSM snapshots (scripts/fetch-path-fixtures.mjs) around freeways that walks used to ride.
type FixWay = { id: number; tags: Record<string, string>; line: number[] };
const fixtures = new Map<string, { area: { lat: number; lng: number }; ways: FixWay[] }>();
function fixture(id: string) {
  if (!fixtures.has(id)) fixtures.set(id, JSON.parse(readFileSync(new URL(`./fixtures/paths-${id}.json`, import.meta.url), "utf8")));
  return fixtures.get(id)!;
}
const geom = (w: FixWay) => {
  const out: { lat: number; lon: number }[] = [];
  for (let i = 0; i + 1 < w.line.length; i += 2) out.push({ lat: w.line[i]!, lon: w.line[i + 1]! });
  return out;
};
const pts = (w: FixWay): Pt[] => geom(w).map((p) => ({ lat: p.lat, lng: p.lon }));
function freeways(id: string) {
  return fixture(id).ways.filter((w) => isFreeway(w.tags)).map(pts);
}
function walkables(id: string) {
  return fixture(id).ways.filter((w) => isWalkableWay(w.tags)).map(pts);
}
/** Meters a path spends on freeway geometry and not on a walkable way (under a viaduct, a ramp's landing). */
function ride(id: string, path: Pt[]) {
  return freewayRun(path, freeways(id), 6, 25, walkables(id), 4);
}
/** Graph from the raw fetch — every highway way, freeways included — so the walk filter has to do its job. */
function walkGraph(id: string, raw = false) {
  const f = fixture(id);
  const g = createGraph(f.area.lat, f.area.lng);
  ingestOsmWays(g, f.ways.map((w) => ({ geometry: geom(w), tags: raw ? undefined : w.tags })));
  return g;
}

const CASES: { city: string; name: string; from: Pt; to: Pt }[] = [
  // Ryan's 0.0.31 screenshot: the walk ran down the Lodge trench and through the I-75/M-10 interchange.
  { city: "detroit", name: "Temple & Trumbull → Grand Circus Park (across the Lodge)", from: { lat: 42.3405, lng: -83.064 }, to: { lat: 42.3365, lng: -83.0497 } },
  { city: "detroit", name: "Temple & Trumbull → Corktown, Michigan Ave (across I-75)", from: { lat: 42.3405, lng: -83.064 }, to: { lat: 42.3315, lng: -83.0678 } },
  { city: "detroit", name: "Cherry St → Little Caesars Arena (through the interchange)", from: { lat: 42.3338, lng: -83.0668 }, to: { lat: 42.3411, lng: -83.0554 } },
  { city: "detroit", name: "Pine St → Orchestra Hall", from: { lat: 42.3375, lng: -83.0638 }, to: { lat: 42.3389, lng: -83.0592 } },
  { city: "nyc", name: "2nd Ave & E 42nd → East River Greenway at E 25th (FDR)", from: { lat: 40.7505, lng: -73.9725 }, to: { lat: 40.736, lng: -73.974 } },
  { city: "nyc", name: "1st Ave & E 34th → East 36th St esplanade (FDR)", from: { lat: 40.7448, lng: -73.9727 }, to: { lat: 40.7445, lng: -73.9705 } },
  { city: "austin", name: "Red River & E 7th → E 5th & Comal (I-35)", from: { lat: 30.268, lng: -97.7365 }, to: { lat: 30.2625, lng: -97.731 } },
  { city: "austin", name: "E 11th & Red River → E 12th & Chicon side (I-35)", from: { lat: 30.2712, lng: -97.7362 }, to: { lat: 30.2705, lng: -97.7305 } },
  { city: "la", name: "Union Station → City Hall (101)", from: { lat: 34.056, lng: -118.2365 }, to: { lat: 34.0537, lng: -118.2428 } },
  { city: "la", name: "Bunker Hill → Temple-Beaudry (110)", from: { lat: 34.056, lng: -118.25 }, to: { lat: 34.06, lng: -118.266 } },
  // 0.0.48 (k48a): the new cities' freeways — I-5 through downtown Seattle, I-25 west of the Platte, Nashville's I-40 loop and I-24.
  { city: "seattle", name: "Westlake, 4th & Pine → Pine & Bellevue, Capitol Hill (over I-5)", from: { lat: 47.6112, lng: -122.3372 }, to: { lat: 47.615, lng: -122.3255 } },
  { city: "seattle", name: "King Street Station → S Jackson & 12th, Little Saigon (under I-5)", from: { lat: 47.5985, lng: -122.3297 }, to: { lat: 47.5992, lng: -122.317 } },
  { city: "seattle", name: "2nd & James → 9th & Jefferson, Harborview (over I-5)", from: { lat: 47.6025, lng: -122.333 }, to: { lat: 47.604, lng: -122.3235 } },
  { city: "denver", name: "Union Station → W 23rd Ave, Jefferson Park (over I-25)", from: { lat: 39.753, lng: -105.0005 }, to: { lat: 39.7505, lng: -105.0195 } },
  { city: "denver", name: "Auraria, Tivoli → Empower Field at Mile High (across I-25)", from: { lat: 39.7452, lng: -105.0058 }, to: { lat: 39.744, lng: -105.019 } },
  { city: "denver", name: "Commons Park → Lower Highland (across I-25)", from: { lat: 39.7575, lng: -105.0055 }, to: { lat: 39.76, lng: -105.013 } },
  { city: "nashville", name: "Union Station → Music Row roundabout (over the I-40 loop)", from: { lat: 36.1572, lng: -86.7847 }, to: { lat: 36.1525, lng: -86.7925 } },
  { city: "nashville", name: "Charlotte Ave & 7th → Charlotte Ave west of the loop (I-40)", from: { lat: 36.164, lng: -86.786 }, to: { lat: 36.16, lng: -86.7985 } },
  { city: "nashville", name: "Nissan Stadium → East Nashville (across I-24)", from: { lat: 36.1665, lng: -86.7714 }, to: { lat: 36.169, lng: -86.762 } },
];

test("walkable rule: freeways, ramps, and foot=no never walk; streets and sidewalks do", () => {
  for (const hw of ["motorway", "motorway_link", "trunk", "trunk_link"]) assert.equal(isWalkableWay({ highway: hw }), false, hw);
  assert.equal(isWalkableWay({ highway: "trunk", foot: "yes" }), false, "trunk with foot=yes still off — no sidewalk walking along trunk roads");
  assert.equal(isWalkableWay({ highway: "primary", foot: "no" }), false);
  assert.equal(isWalkableWay({ highway: "primary", foot: "use_sidepath" }), false);
  assert.equal(isWalkableWay({ highway: "secondary", motorroad: "yes" }), false);
  assert.equal(isWalkableWay({ highway: "service", access: "private" }), false);
  assert.equal(isWalkableWay({ highway: "service", access: "no", foot: "yes" }), true);
  assert.equal(isWalkableWay({ highway: "corridor" }), false);
  for (const hw of ["footway", "pedestrian", "residential", "tertiary", "secondary", "primary", "steps", "path"]) assert.equal(isWalkableWay({ highway: hw }), true, hw);
});

test("foot routing never falls back to a car router", () => {
  for (const u of OSRM_FOOT) {
    assert.ok(!u.includes("router.project-osrm.org"), "project-osrm.org serves the car profile for every URL");
    assert.ok(/foot/.test(u));
  }
});

test("walk graph drops every freeway way from a raw fetch", () => {
  for (const city of ["detroit", "nyc", "austin", "la"]) {
    const g = walkGraph(city);
    const fw = fixture(city).ways.filter((w) => isFreeway(w.tags));
    assert.ok(fw.length > 5, `${city} fixture has freeways`);
    const walk = walkables(city);
    // Every freeway point that isn't also a walkable way (a crossing, a viaduct over a street) is off the graph.
    let probes = 0;
    for (const w of fw) {
      for (const p of pts(w)) {
        if (freewayGap(p, walk) < 10) continue;
        probes++;
        const hit = nearest(g, p.lat, p.lng, 3);
        assert.ok(!hit || hit.dist > 3, `${city}: graph has freeway way ${w.id} (${w.tags.name ?? w.tags.ref ?? w.tags.highway}) at ${p.lat},${p.lng}`);
      }
    }
    assert.ok(probes > 30, `${city}: probed ${probes} freeway points`);
  }
});

for (const c of CASES) {
  test(`offline walk stays off freeways: ${c.city} — ${c.name}`, () => {
    const g = walkGraph(c.city);
    const fw = freeways(c.city);
    const a = pullToStreet(g, c.from.lat, c.from.lng, 140);
    const b = pullToStreet(g, c.to.lat, c.to.lng, 220, c.from);
    // Start and end snap to walkable ways, never a freeway centerline.
    assert.ok(freewayGap(a, fw) > 3, `start snapped onto a freeway (${freewayGap(a, fw).toFixed(1)} m)`);
    assert.ok(freewayGap(b, fw) > 3, `end snapped onto a freeway (${freewayGap(b, fw).toFixed(1)} m)`);
    const path = routeOnGraph(g, a, b);
    assert.ok(path && path.length >= 2, "a walk exists");
    const { run, at } = ride(c.city, path!);
    assert.ok(run < 20, `walk rides a freeway for ${run.toFixed(0)} m near ${at?.lat.toFixed(5)},${at?.lng.toFixed(5)}`);
  });
}

test("detector check: a graph that keeps freeways (the 0.0.31 failure) does ride them", () => {
  let rides = 0;
  for (const c of CASES.filter((x) => x.city === "detroit")) {
    const g = walkGraph(c.city, true);
    const path = routeOnGraph(g, pullToStreet(g, c.from.lat, c.from.lng, 140), pullToStreet(g, c.to.lat, c.to.lng, 220));
    if (path && ride(c.city, path).run >= 20) rides++;
  }
  assert.ok(rides >= 1, "with freeways left in, at least one Detroit walk should use the trench");
});

test("an online route down the Lodge trench loses to the walk graph", () => {
  const g = walkGraph("detroit");
  const trench = fixture("detroit").ways.filter((w) => w.tags.highway === "motorway" && /Lodge/.test(w.tags.name ?? "")).map(pts);
  // Chain a run of trench geometry as a fake "online" answer.
  const line = trench.sort((x, y) => y.length - x.length)[0]!;
  const from = pullToStreet(g, line[0]!.lat, line[0]!.lng, 140);
  const to = pullToStreet(g, line[line.length - 1]!.lat, line[line.length - 1]!.lng, 220);
  const online = [from, ...line, to];
  const segsBefore = g.segs.length;
  const out = pickWalk(g, online, from, to);
  assert.ok(out && out.length >= 2);
  assert.ok(freewayRun(online, freeways("detroit")).run > 200, "the fake online route really is the trench");
  assert.ok(ride("detroit", out!).run < 20, "graph route chosen");
  assert.equal(g.segs.length, segsBefore, "trench geometry is not stitched into the walk graph");
});

test("baked city streets don't ride freeways", () => {
  for (const city of ["detroit", "nyc", "austin", "seattle", "denver", "nashville"]) {
    const baked = JSON.parse(readFileSync(new URL(`../../public/streets/${city}.json`, import.meta.url), "utf8")) as { lines: number[][] };
    for (const l of baked.lines) {
      const path: Pt[] = [];
      for (let i = 0; i + 1 < l.length; i += 2) path.push({ lat: l[i]!, lng: l[i + 1]! });
      const { run, at } = ride(city, path);
      assert.ok(run < 25, `${city} baked line rides a freeway ${run.toFixed(0)} m near ${at?.lat},${at?.lng}`);
    }
  }
});

test("white matches spawn only on walkable ways (Detroit around the Lodge / I-75 interchange)", () => {
  const g = walkGraph("detroit");
  const walk = walkables("detroit");
  const fw = freeways("detroit");
  const center = { lat: 42.3375, lng: -83.0615 };
  // Seeded so a failure reproduces.
  const real = Math.random;
  let seed = 0x5eed;
  Math.random = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32);
  const drops = [...Array.from({ length: 400 }, () => randomOnStreet(g, center, 20, 900)), ...spreadOnGraph(g, [center], 40, 60)];
  Math.random = real;
  for (const p of drops) {
    // On a walkable way (within the graph's 12 m decimation slop on curves), and never on freeway-only geometry.
    assert.ok(freewayGap(p, walk) < 10, `drop ${p.lat},${p.lng} is off every walkable way (${freewayGap(p, walk).toFixed(1)} m; freeway ${freewayGap(p, fw).toFixed(1)} m)`);
    // Freeway-only: on a freeway centerline and clear of every walkable way, bridges over it included
    // (a footbridge across the Lodge sits ~3 m off its mapped line once the graph decimates it).
    assert.ok(!(freewayGap(p, fw) < 3 && freewayGap(p, walk) > 6), `drop on a freeway at ${p.lat},${p.lng}`);
  }
});

test("a match an old save left in the Lodge trench is collectable from the closest curb", () => {
  const g = walkGraph("detroit");
  const walk = walkables("detroit");
  // A Lodge Freeway point well away from any walkable way — where 0.0.31 could drop a match.
  const trench = fixture("detroit").ways.filter((w) => w.tags.highway === "motorway" && /Lodge/.test(w.tags.name ?? "")).flatMap(pts);
  const spot = trench.map((p) => ({ p, gap: freewayGap(p, walk) })).filter((x) => x.gap > 24 && x.gap < 50).sort((a, b) => a.gap - b.gap)[0];
  assert.ok(spot, "found a trench point 24–50 m from the nearest walkable way");
  const curb = nearest(g, spot!.p.lat, spot!.p.lng, 70)!;
  assert.ok(curb.dist > MATCH_GRAB_M, "out of plain grab range from the curb (the 0.0.31 dead end)");
  assert.equal(canGrabMatch(g, curb, spot!.p), true, "standing at the closest curb collects it");
  // A walk to it ends at that curb.
  const start = pullToStreet(g, 42.3405, -83.064, 140);
  const path = routeOnGraph(g, start, pullToStreet(g, spot!.p.lat, spot!.p.lng, 220, start))!;
  const end = path[path.length - 1]!;
  assert.equal(canGrabMatch(g, end, spot!.p), true, "the walk's last step collects it");
  // Still no grabbing from down the block.
  const away = pullToStreet(g, curb.lat + 0.0006, curb.lng, 140);
  assert.equal(canGrabMatch(g, away, spot!.p), false);
});
