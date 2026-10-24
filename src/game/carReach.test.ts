import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { lampFromRide, rideOf, seatIsOwnCar, trimToReach } from "./carReach.ts";
import { dest, distM } from "./geo.ts";

test("own car answers lamps, the city cab does not, on foot does", () => {
  assert.equal(rideOf(false, true), "foot");
  assert.equal(rideOf(true, true), "own");
  assert.equal(rideOf(true, false), "cab");
  assert.equal(lampFromRide("own"), true);
  assert.equal(lampFromRide("foot"), true);
  assert.equal(lampFromRide("cab"), false);
});

test("a drive to a lamp stops at the curb within reach, not at the road's end", () => {
  const o = { lat: 41.88, lng: -87.63 };
  const path = Array.from({ length: 11 }, (_, i) => dest(o.lat, o.lng, 0, i * 100)); // 1 km east
  const lamp = dest(o.lat, o.lng, 60, 1000);
  const cut = trimToReach(path, lamp, 112);
  const end = cut[cut.length - 1]!;
  assert.ok(distM(end.lat, end.lng, lamp.lat, lamp.lng) <= 112.5);
  assert.ok(distM(end.lat, end.lng, lamp.lat, lamp.lng) > 90, "stops as soon as it is in reach");
  assert.ok(distM(end.lat, end.lng, path[10]!.lat, path[10]!.lng) > 50, "short of the road end");
  assert.deepEqual(trimToReach(path, dest(o.lat, o.lng, 900, 0), 50), path, "never in reach: unchanged");
});

test("GameMap: lamp, vault and match taps use the ride rule; dealer and house stay on foot", () => {
  const src = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  assert.match(src, /if \(d > reach\(\) \|\| !lampFromRide\(ride\(\)\)\)/);
  assert.match(src, /if \(!lampFromRide\(ride\(\)\)\) \{\n\s*flash\("Park at the curb. Matches are on foot."/);
  assert.match(src, /trimToReach\(raw, target/);
  assert.match(src, /Step out of the car to visit the lot\./);
  assert.match(src, /Step out of the car to go home\./);
});

test("0.1.35: owning a car makes any seat your car; it answers lamps and picks matches up while driving", () => {
  assert.equal(seatIsOwnCar("roadster"), true);
  assert.equal(seatIsOwnCar(null), false, "chose the cab on purpose (carOn null): still the city cab");
  assert.equal(lampFromRide(rideOf(true, seatIsOwnCar("roadster"))), true);
  assert.equal(lampFromRide(rideOf(true, seatIsOwnCar(null))), false);
  const src = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  // Entering a cab already parked at the curb used to keep own unset, so lamps said "Park at the curb".
  assert.match(src, /cab\.seated = true;\n\s*cab\.hail = null;\n\s*cab\.own = seatIsOwnCar\(useGame\.getState\(\)\.carOn\);/);
  // The drive-by match pickup used to stop for any seat.
  assert.match(src, /if \(!lampFromRide\(ride\(\)\)\) break;\n\s*if \(canGrabMatch\(foot/);
  assert.doesNotMatch(src, /if \(seated\) break;\n\s*if \(canGrabMatch/);
});
