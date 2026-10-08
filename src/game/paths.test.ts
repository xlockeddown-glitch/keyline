import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canGrabMatch, clearOfFreeway, constrainStep, createGraph, finishPath, freewayRide, ingestFreeway, ingestLine, ingestOsmWays, unpackFreeways, MATCH_GRAB_M, nearest, offFreeway, onFreeway, OSRM_FOOT, pickWalk, pullToStreet, randomOnStreet, routeOnGraph, spreadOnGraph, standOpen, type Pt } from "./streets.ts";
import { isExpresswayNamed, isFreeway, isWalkableWay } from "./walkable.ts";
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
  // 0.0.52b: Ryan's River West screenshot — the walker on the Ohio Street feeder (I-90/94 motorway_link) bridge over the
  // North Branch, walking to Union Station / the next lamp. Starts sit on the feeder itself.
  { city: "chicago", name: "Ohio St feeder bridge → Chicago Union Station", from: { lat: 41.89246, lng: -87.642 }, to: { lat: 41.8786, lng: -87.6394 } },
  { city: "chicago", name: "Ohio St feeder at Desplaines → Chicago Union Station", from: { lat: 41.89243, lng: -87.6448 }, to: { lat: 41.8786, lng: -87.6394 } },
  { city: "chicago", name: "Ohio St feeder at Kingsbury → Merchandise Mart lamp", from: { lat: 41.89247, lng: -87.641 }, to: { lat: 41.8885, lng: -87.635 } },
  { city: "chicago", name: "Ohio St feeder at Union Ave → Civic Opera House lamp", from: { lat: 41.89253, lng: -87.6459 }, to: { lat: 41.8826, lng: -87.6373 } },
  { city: "chicago", name: "Ohio St feeder at Orleans → Chicago & Franklin lamp", from: { lat: 41.89243, lng: -87.6378 }, to: { lat: 41.8966, lng: -87.6355 } },
  { city: "chicago", name: "River West, Grand & Halsted → Chicago & Franklin (across the North Branch)", from: { lat: 41.8912, lng: -87.6476 }, to: { lat: 41.8966, lng: -87.6355 } },
  { city: "chicago", name: "Ontario feeder at Orleans → Ohio & Halsted, River West", from: { lat: 41.893, lng: -87.6385 }, to: { lat: 41.8922, lng: -87.6478 } },
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
  for (const city of ["detroit", "nyc", "austin", "la", "chicago"]) {
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
    // Start and end snap to walkable ways, never a freeway centerline (a street or lot under a viaduct is fine).
    const walk = walkables(c.city);
    assert.ok(freewayGap(a, fw) > 3 || freewayGap(a, walk) < 1, `start snapped onto a freeway (${freewayGap(a, fw).toFixed(1)} m)`);
    assert.ok(freewayGap(b, fw) > 3 || freewayGap(b, walk) < 1, `end snapped onto a freeway (${freewayGap(b, fw).toFixed(1)} m)`);
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
  for (const city of ["detroit", "nyc", "austin", "seattle", "denver", "nashville", "chicago"]) {
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

// ---- 0.0.52b: the Ohio Street feeder (Chicago, River West) and the freeway no-walk layer ----

/** The Ohio Street feeder (I-90/94 motorway_link) from Halsted over the North Branch to Orleans, as one line. */
function ohioFeeder(): Pt[] {
  const f = fixture("chicago");
  const order = [898010482, 23810482, 1315998481, 1013537658, 1315998484, 421091628, 435551676, 26231854];
  const out: Pt[] = [];
  for (const id of order) {
    const w = f.ways.find((x) => x.id === id);
    assert.ok(w, `feeder way ${id} in the Chicago fixture`);
    assert.equal(w!.tags.highway, "motorway_link");
    out.push(...pts(w!));
  }
  return out;
}
const FEEDER_BRIDGE = { lat: 41.89246, lng: -87.642 };
const UNION_STATION = { lat: 41.8786, lng: -87.6394 };

test("walkable rule: expressway lanes mapped as arterials and motorroad=yes are freeways; service drives still walk", () => {
  assert.equal(isWalkableWay({ highway: "primary", name: "Kennedy Expressway" }), false);
  assert.equal(isFreeway({ highway: "primary", name: "Kennedy Expressway" }), true);
  assert.equal(isFreeway({ highway: "secondary", name: "Ohio Street Feeder" }), true);
  assert.equal(isWalkableWay({ highway: "primary", name: "Kennedy Expressway", sidewalk: "both" }), true, "a mapped sidewalk walks");
  assert.equal(isWalkableWay({ highway: "primary", name: "Kennedy Expressway", "sidewalk:right": "separate" }), true);
  assert.equal(isWalkableWay({ highway: "primary", name: "Kennedy Expressway", foot: "yes" }), true);
  assert.equal(isWalkableWay({ highway: "tertiary", name: "Fisher Freeway Service Drive West" }), true);
  assert.equal(isWalkableWay({ highway: "tertiary", name: "West Fisher Freeway" }), true, "tertiary service drive");
  assert.equal(isWalkableWay({ highway: "secondary", name: "North Interstate 35" }), true, "I-35 frontage road");
  assert.equal(isExpresswayNamed({ highway: "secondary", name: "John C Lodge Service Drive" }), false);
  assert.equal(isFreeway({ highway: "primary", motorroad: "yes" }), true);
  assert.equal(isFreeway({ highway: "primary", name: "West Ohio Street" }), false);
  // The Chicago fixture's feeder really is tagged as a ramp — the walk filter drops it by class, not by name.
  assert.ok(ohioFeeder().length > 10);
});

test("Chicago: the walk graph keeps the Ohio Street feeder only as a no-walk layer", () => {
  const g = walkGraph("chicago");
  assert.ok(g.fw.length > 200, "freeway layer loaded");
  // On the feeder bridge deck over the river: freeway. The walk graph has nothing there.
  assert.equal(onFreeway(g, FEEDER_BRIDGE), true);
  assert.ok((nearest(g, FEEDER_BRIDGE.lat, FEEDER_BRIDGE.lng, 30)?.dist ?? Infinity) > 20, "no walkable way on the feeder bridge");
  // Ground-level West Ohio Street beside the feeder, and Halsted on its bridge over it, are walkable.
  assert.equal(onFreeway(g, { lat: 41.89229, lng: -87.6400 }), false, "West Ohio Street under the feeder");
  assert.equal(onFreeway(g, { lat: 41.89245, lng: -87.64766 }), false, "Halsted over the feeder");
  // The feeder itself is all freeway to the walk check.
  assert.ok(freewayRide(g, ohioFeeder()) > 200, "riding the feeder scores as a freeway ride");
});

test("Chicago: a walker dropped on the Ohio Street feeder is moved to the closest walkable street", () => {
  const g = walkGraph("chicago");
  const walk = walkables("chicago");
  for (const p of ohioFeeder()) {
    const q = offFreeway(g, p);
    assert.equal(onFreeway(g, q), false, `still on the feeder at ${p.lat},${p.lng}`);
    assert.ok(freewayGap(q, walk) < 6, `moved onto a walkable way (${freewayGap(q, walk).toFixed(1)} m off)`);
    assert.ok(distM(p, q) < 120, `moved ${distM(p, q).toFixed(0)} m`);
  }
  // Not on a freeway: left alone.
  const street = { lat: 41.89229, lng: -87.64 };
  assert.deepEqual(offFreeway(g, street), street);
});

test("Chicago: from the stub path at the foot of the feeder bridge, the walk still comes off the graph", () => {
  const g = walkGraph("chicago");
  // 1316013400: a two-node footway the rest of the network doesn't reach. A snap onto it used to make
  // routeOnGraph return null, and pickWalk then took the online route unchecked.
  const stub = { lat: 41.89222, lng: -87.64128 };
  const path = routeOnGraph(g, stub, pullToStreet(g, UNION_STATION.lat, UNION_STATION.lng, 220, stub));
  assert.ok(path && path.length >= 2, "a graph walk exists from the stub");
  assert.ok(ride("chicago", path!).run < 20);
  assert.ok(distM(path![0]!, stub) < 90, "starts near the walker");
  // …on Kingsbury, south of the feeder like the walker — not up the parking aisle under the deck.
  const fw = freeways("chicago");
  assert.ok(freewayGap(path![0]!, fw) > 7, `starts beside the feeder (${freewayGap(path![0]!, fw).toFixed(1)} m)`);
  assert.ok(path![0]!.lat < 41.8924, "starts south of the feeder");
});

test("Chicago: an online route along the Ohio Street feeder is never used or stitched in", () => {
  const g = walkGraph("chicago");
  const feeder = ohioFeeder();
  const from = pullToStreet(g, feeder[0]!.lat, feeder[0]!.lng, 140);
  const to = pullToStreet(g, feeder[feeder.length - 1]!.lat, feeder[feeder.length - 1]!.lng, 220);
  const online = [from, ...feeder, to];
  const before = g.segs.length;
  const out = pickWalk(g, online, from, to);
  assert.ok(out && out.length >= 2);
  assert.ok(ride("chicago", out!).run < 20, "graph route chosen over the feeder");
  assert.equal(g.segs.length, before, "feeder geometry not stitched into the walk graph");
  // No graph route at all (two scraps of street): the feeder route is still refused.
  const bare = createGraph(41.8925, -87.642);
  ingestFreeway(bare, feeder);
  ingestLine(bare, [from, { lat: from.lat - 0.0003, lng: from.lng }]);
  ingestLine(bare, [to, { lat: to.lat - 0.0003, lng: to.lng }]);
  assert.equal(pickWalk(bare, online, from, to), null);
});

test("a north hold stops at the end of the curb instead of bouncing back", () => {
  const g = createGraph(30.27, -97.74);
  ingestLine(g, [
    { lat: 30.27, lng: -97.74 },
    { lat: 30.27025, lng: -97.74 },
  ]);
  const start = pullToStreet(g, 30.27002, -97.74, 40);
  let p = start;
  let far = 0;
  for (let i = 0; i < 40; i++) {
    p = constrainStep(g, p.lat, p.lng, 0, 2, true);
    far = Math.max(far, (p.lat - start.lat) * 111_320);
  }
  const back = (p.lat - start.lat) * 111_320;
  assert.ok(far > 10, `never got going (${far.toFixed(1)} m)`);
  assert.ok(back > far - 2.5, `bounced back to ${back.toFixed(1)} m after reaching ${far.toFixed(1)} m`);
});

test("a fresh stand steps back when north dies in a few metres", () => {
  const g = createGraph(30.27, -97.74);
  ingestLine(g, [
    { lat: 30.27, lng: -97.74 },
    { lat: 30.27045, lng: -97.74 },
  ]);
  const end = pullToStreet(g, 30.27042, -97.74, 30);
  const stood = standOpen(g, end.lat, end.lng);
  const room = (q: Pt) => {
    let p = q;
    for (let i = 0; i < 14; i++) p = constrainStep(g, p.lat, p.lng, 0, 3, true);
    return (p.lat - q.lat) * 111_320;
  };
  assert.ok(room(stood) > room(end) + 8, `stood ${room(stood).toFixed(1)} m north, the dead end only ${room(end).toFixed(1)}`);
  assert.ok(distM(end, stood) < 75, "does not walk off to another ward");
});

test("Chicago: loose steps off the graph can't walk onto the feeder, and a walker on it steps off", () => {
  const g = walkGraph("chicago");
  // Over the river 12 m south of the feeder bridge, well clear of any walkable way (a door step, an old spot).
  let p: Pt = { lat: 41.89235, lng: -87.642 };
  assert.ok((nearest(g, p.lat, p.lng, 80)?.dist ?? 0) > 16, "off the graph: loose steps");
  assert.equal(onFreeway(g, p), false);
  for (let i = 0; i < 40; i++) {
    p = constrainStep(g, p.lat, p.lng, 0, 1.2, true); // north, onto the bridge (0.0.52 walked straight across it)
    assert.equal(onFreeway(g, p), false, `walked onto the feeder at ${p.lat},${p.lng}`);
  }
  assert.ok(p.lat < 41.8924, "held south of the feeder");
  // Standing on the deck already: the next step goes to a walkable street.
  const q = constrainStep(g, FEEDER_BRIDGE.lat, FEEDER_BRIDGE.lng, Math.PI / 2, 1.2, true);
  assert.equal(onFreeway(g, q), false);
  assert.ok((nearest(g, q.lat, q.lng, 5)?.dist ?? Infinity) < 1, "on a walkable way");
});

test("Chicago: a door step never lands on or cuts across the feeder", () => {
  const g = walkGraph("chicago");
  const curb = pullToStreet(g, 41.89235, -87.6407, 20); // Kingsbury sidewalk at the east foot of the feeder bridge
  const path = [pullToStreet(g, 41.8915, -87.6399, 60), curb];
  const lamp = { lat: 41.89245, lng: -87.6417 }; // a lamp an old save left on the feeder bridge deck
  assert.equal(onFreeway(g, lamp), true);
  const out = finishPath(path, path[0]!, lamp, { door: true, graph: g })!;
  assert.ok(distM(out[out.length - 1]!, lamp) > 6, "no hop onto the feeder");
  // A door off the curb that isn't a freeway still gets its step.
  const door = { lat: 41.8921, lng: -87.6404 };
  const ok = finishPath(path, path[0]!, door, { door: true, graph: g })!;
  assert.ok(distM(ok[ok.length - 1]!, door) < 1);
});

test("every fixture city: a start dropped on any ramp or feeder snaps off it and walks off freeways", () => {
  for (const city of ["chicago", "detroit", "nyc", "austin", "la", "seattle", "denver", "nashville"]) {
    const f = fixture(city);
    const g = walkGraph(city);
    const ramps = f.ways.filter((w) => /_link$/.test(w.tags.highway ?? ""));
    assert.ok(ramps.length > 10, `${city} has ramps`);
    const center = pullToStreet(g, f.area.lat, f.area.lng, 220);
    let checked = 0;
    let rides = 0;
    const step = Math.max(1, Math.floor(ramps.length / 14));
    for (let i = 0; i < ramps.length; i += step) {
      const line = pts(ramps[i]!);
      const p = line[Math.floor(line.length / 2)]!;
      const start = pullToStreet(g, offFreeway(g, p).lat, offFreeway(g, p).lng, 140);
      assert.equal(onFreeway(g, start), false, `${city}: start on ramp ${ramps[i]!.id} snapped onto a freeway at ${start.lat},${start.lng}`);
      const path = routeOnGraph(g, start, center);
      if (!path) continue;
      checked++;
      const r = ride(city, path);
      if (r.run >= 20) {
        rides++;
        console.log(`${city}: ramp ${ramps[i]!.id} walk rides ${r.run.toFixed(0)} m near ${r.at?.lat},${r.at?.lng}`);
      }
    }
    assert.ok(checked >= 5, `${city}: ${checked} ramp starts walked`);
    assert.equal(rides, 0, `${city}: walks from ramp starts rode a freeway`);
  }
});

test("baked freeway layers: every city ships one, and Chicago's holds the Ohio Street feeder with no live fetch", async () => {
  const { CITIES } = await import("./data.ts");
  for (const id of Object.keys(CITIES)) {
    const packed = JSON.parse(readFileSync(new URL(`../../public/streets/${id}-fw.json`, import.meta.url), "utf8")) as { lines: number[][] };
    assert.ok(packed.lines.length > 20, `${id}-fw.json has freeway lines`);
  }
  // The sparse graph a failed Overpass fetch leaves: baked foot routes + the baked freeway layer only.
  const g = createGraph(41.8827, -87.6233);
  const baked = JSON.parse(readFileSync(new URL("../../public/streets/chicago.json", import.meta.url), "utf8")) as { lines: number[][] };
  for (const l of baked.lines) {
    const line: Pt[] = [];
    for (let i = 0; i + 1 < l.length; i += 2) line.push({ lat: l[i]!, lng: l[i + 1]! });
    ingestLine(g, line);
  }
  const fwBaked = JSON.parse(readFileSync(new URL("../../public/streets/chicago-fw.json", import.meta.url), "utf8")) as { lines: number[][] };
  for (const line of unpackFreeways(fwBaked.lines)) ingestFreeway(g, line);
  // Every point of the fixture's feeder is covered by the baked layer.
  for (const p of ohioFeeder()) assert.equal(onFreeway(g, p), true, `baked layer misses the feeder at ${p.lat},${p.lng}`);
  // Loose walking (the walker is far off this sparse graph) can't climb onto the feeder from beside it.
  let p: Pt = { lat: 41.8922, lng: -87.6445 }; // ground-level Ohio St at Desplaines, 20 m south of the feeder
  assert.ok((nearest(g, p.lat, p.lng, 80)?.dist ?? Infinity) > 16, "off the sparse graph");
  for (let i = 0; i < 60; i++) {
    p = constrainStep(g, p.lat, p.lng, 0, 1.2, true);
    assert.equal(onFreeway(g, p), false, `walked onto the feeder at ${p.lat},${p.lng}`);
  }
});

function distM(a: Pt, b: Pt) {
  const k = 111_320;
  return Math.hypot((a.lat - b.lat) * k, (a.lng - b.lng) * k * Math.cos((a.lat * Math.PI) / 180));
}

test("every city: spawn and start sit off the baked freeway layer", async () => {
  const { CITIES } = await import("./data.ts");
  for (const city of Object.values(CITIES)) {
    const g = createGraph(city.spawn.lat, city.spawn.lng);
    const packed = JSON.parse(readFileSync(new URL(`../../public/streets/${city.id}-fw.json`, import.meta.url), "utf8")) as { lines: number[][] };
    for (const line of unpackFreeways(packed.lines)) ingestFreeway(g, line);
    // (Lamps and the fare desk may sit under a viaduct — New Orleans' station is under the Pontchartrain
    // Expressway — so placeOnStreet / offFreeway handle those against the live walk graph instead.)
    for (const [label, p] of [["spawn", city.spawn], ["start", city.start]] as const) {
      if (!p) continue;
      assert.equal(onFreeway(g, p), false, `${city.id} ${label} at ${p.lat},${p.lng} is on a freeway`);
    }
  }
});

test("Chicago: a building-cutting walk never starts, ends or hops onto the feeder", () => {
  const g = walkGraph("chicago");
  const curb = pullToStreet(g, 41.8915, -87.6399, 60);
  const lamp = { lat: 41.89245, lng: -87.6417 }; // an old lamp on the feeder bridge deck
  const out = finishPath([curb, pullToStreet(g, 41.89235, -87.6407, 20)], FEEDER_BRIDGE, lamp, { cutBuildings: true, graph: g })!;
  assert.ok(out && out.length >= 2);
  for (const p of out) assert.equal(onFreeway(g, p), false, `cut walk touches the feeder at ${p.lat},${p.lng}`);
  // Off-freeway ends still get their straight hops.
  const door = { lat: 41.8921, lng: -87.6404 };
  const ok = finishPath([curb], { lat: 41.8912, lng: -87.6399 }, door, { cutBuildings: true, graph: g })!;
  assert.ok(distM(ok[ok.length - 1]!, door) < 1);
});

test("Chicago: a walk start on the parking aisle under the feeder slides clear of it", () => {
  const g = walkGraph("chicago");
  // 1315998504: a two-node parking aisle right under the Ohio Street feeder at Kingsbury. Walks snapped onto it,
  // so the walker looked parked on the feeder (it's walkable, so onFreeway alone lets it be).
  const aisle = { lat: 41.89245, lng: -87.641058 };
  assert.ok((nearest(g, aisle.lat, aisle.lng, 5)?.dist ?? Infinity) < 1, "aisle is in the walk graph");
  assert.equal(onFreeway(g, aisle), false, "walkable, so not 'on' the freeway");
  const q = clearOfFreeway(g, aisle);
  assert.ok(freewayGap(q, freeways("chicago")) > 7, `still beside the feeder (${freewayGap(q, freeways("chicago")).toFixed(1)} m)`);
  assert.ok((nearest(g, q.lat, q.lng, 5)?.dist ?? Infinity) < 0.5, "on a walkable way");
  assert.ok(distM(aisle, q) <= 40, `moved ${distM(aisle, q).toFixed(0)} m`);
  const path = routeOnGraph(g, q, pullToStreet(g, UNION_STATION.lat, UNION_STATION.lng, 220, q));
  assert.ok(path && ride("chicago", path).run < 20);
  // The foot router snaps that start back onto the aisle: the graph's walk from the clear start wins.
  const online = [aisle, { lat: 41.8922, lng: -87.6409 }, { lat: 41.8915, lng: -87.6399 }];
  const picked = pickWalk(g, online, q, pullToStreet(g, 41.8915, -87.6399, 60, q))!;
  assert.ok(picked && freewayGap(picked[0]!, freeways("chicago")) > 7, "picked walk starts clear of the feeder");
  // Away from freeways, untouched.
  const street = { lat: 41.8915, lng: -87.6399 };
  const s = pullToStreet(g, street.lat, street.lng, 60);
  assert.deepEqual(clearOfFreeway(g, s), s);
});
