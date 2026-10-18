import { test } from "node:test";
import assert from "node:assert/strict";
import { CAB_PACE, cabSpeed, walkSpeed, WALK_PACE } from "./data.ts";

test("every coat walks at one pace, with no sprint", () => {
  assert.equal(walkSpeed(), WALK_PACE);
});

test("cab is 2x grid and 2.5x arterial", () => {
  assert.equal(cabSpeed(false), CAB_PACE * 2);
  assert.equal(cabSpeed(true), CAB_PACE * 2.5);
  assert.ok(walkSpeed() < cabSpeed(false));
});

test("0.0.90: walk +15% (92 → 105.8), cab +25% (184/230 → 230/287.5)", () => {
  assert.ok(Math.abs(walkSpeed() - 105.8) < 1e-9);
  assert.ok(Math.abs(cabSpeed(false) - 230) < 1e-9);
  assert.ok(Math.abs(cabSpeed(true) - 287.5) < 1e-9);
});
