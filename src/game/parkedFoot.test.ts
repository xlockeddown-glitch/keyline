import assert from "node:assert/strict";
import { test } from "node:test";
import { dest, distM } from "./geo.ts";
import { createGraph, curbAfterCab, ingestLine, parkedFoot, startReach } from "./streets.ts";

function cityWithWalkOnlyAtStart() {
  const o = { lat: 42.3314, lng: -83.0458 };
  const g = createGraph(o.lat, o.lng);
  // The walk streets loaded around the start only (the live fetch failed along the drive).
  ingestLine(g, [o, dest(o.lat, o.lng, 0, 120), dest(o.lat, o.lng, 120, 120)]);
  return { g, o, main: startReach(g, o, 250) };
}

test("0.1.41: parking 1.5 km from the start used to put you back at the start", () => {
  const { g, o, main } = cityWithWalkOnlyAtStart();
  const parked = dest(o.lat, o.lng, 1500, 200);
  const old = curbAfterCab(g, parked, main);
  assert.ok(distM(old.lat, old.lng, parked.lat, parked.lng) > 1000, "the old curb snap jumps back to the start's walk");
  const foot = parkedFoot(g, parked, main);
  assert.ok(distM(foot.lat, foot.lng, parked.lat, parked.lng) < 1, "you stand where you parked");
});

test("0.1.41: parking by a walk street still steps onto it", () => {
  const { g, o, main } = cityWithWalkOnlyAtStart();
  const parked = dest(o.lat, o.lng, 30, 120 + 20);
  const foot = parkedFoot(g, parked, main);
  assert.ok(distM(foot.lat, foot.lng, parked.lat, parked.lng) <= 25);
  assert.ok(distM(foot.lat, foot.lng, parked.lat, parked.lng) > 15, "pulled onto the curb");
});

test("0.1.41: a nearby walk off the main one beats standing in the road", () => {
  const { g, o, main } = cityWithWalkOnlyAtStart();
  const far = dest(o.lat, o.lng, 2000, 0);
  ingestLine(g, [far, dest(far.lat, far.lng, 0, 100)]);
  const parked = dest(far.lat, far.lng, 20, 50);
  const foot = parkedFoot(g, parked, main);
  assert.ok(distM(foot.lat, foot.lng, parked.lat, parked.lng) <= 22);
});
