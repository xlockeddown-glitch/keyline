import { test } from "node:test";
import assert from "node:assert/strict";
import { cabSpeed, walkSpeed, WALK_PACE } from "./data.ts";

test("every coat walks at one pace, with no sprint", () => {
  assert.equal(walkSpeed(), WALK_PACE);
});

test("cab is 2x grid and 2.5x arterial", () => {
  assert.equal(cabSpeed(false), WALK_PACE * 2);
  assert.equal(cabSpeed(true), WALK_PACE * 2.5);
  assert.ok(walkSpeed() < cabSpeed(false));
});
