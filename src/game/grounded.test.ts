import assert from "node:assert/strict";
import test from "node:test";
import { roadTilt, worldScale } from "./grounded.ts";

test("worldScale: 1 at zoom 17, floored for tapping, capped", () => {
  assert.equal(worldScale(17), 1);
  assert.equal(worldScale(15), 0.8);
  assert.ok(worldScale(18) > 1 && worldScale(18) <= 1.3);
  assert.equal(worldScale(20), 1.3);
});

test("roadTilt: square roads need no tilt, diagonals tilt toward the road", () => {
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) assert.equal(Math.abs(roadTilt(yaw)), 0);
  // 30° east of north (yaw is counter-clockwise, so −30°): the up sprite turns 30° clockwise.
  assert.equal(roadTilt((-30 * Math.PI) / 180), 30);
  // 20° west of north: the up sprite turns 20° counter-clockwise.
  assert.equal(roadTilt((20 * Math.PI) / 180), -20);
  // heading east-south-east (110° clockwise): the right sprite turns 20° clockwise.
  assert.equal(roadTilt((-110 * Math.PI) / 180), 20);
  for (let d = -180; d <= 180; d += 7) assert.ok(Math.abs(roadTilt((d * Math.PI) / 180)) <= 45);
});
