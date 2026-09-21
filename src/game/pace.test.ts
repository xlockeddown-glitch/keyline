import { test } from "node:test";
import assert from "node:assert/strict";
import { cabSpeed, walkSpeed, WALK_PACE } from "./data.ts";

test("sprint is 1.5x walk", () => {
  assert.equal(walkSpeed(false), WALK_PACE);
  assert.equal(walkSpeed(true), WALK_PACE * 1.5);
});

test("cab is 2x grid and 2.5x arterial", () => {
  assert.equal(cabSpeed(false), WALK_PACE * 2);
  assert.equal(cabSpeed(true), WALK_PACE * 2.5);
  assert.ok(walkSpeed(true) < cabSpeed(false));
});
