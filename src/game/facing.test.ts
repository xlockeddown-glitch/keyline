import assert from "node:assert/strict";
import { test } from "node:test";
import { faceFromYaw, walkRow } from "./facing.ts";

const deg = (d: number) => (d * Math.PI) / 180;
// GameMap on-foot yaw: atan2(-east, north)
const fromKeys = (east: number, north: number) => Math.atan2(-east, north);

test("cardinal directions pick their own row", () => {
  assert.equal(walkRow(fromKeys(0, 1)), 3);
  assert.equal(walkRow(fromKeys(0, -1)), 0);
  assert.equal(walkRow(fromKeys(-1, 0)), 1);
  assert.equal(walkRow(fromKeys(1, 0)), 2);
});

test("diagonals show the side profile symmetrically", () => {
  assert.equal(walkRow(fromKeys(1, 1)), 2, "NE faces right");
  assert.equal(walkRow(fromKeys(1, -1)), 2, "SE faces right");
  assert.equal(walkRow(fromKeys(-1, 1)), 1, "NW faces left");
  assert.equal(walkRow(fromKeys(-1, -1)), 1, "SW faces left");
});

test("cab faces follow the same rule and wrap negative yaw", () => {
  assert.equal(faceFromYaw(deg(-90)), "right");
  assert.equal(faceFromYaw(deg(450)), "left");
  assert.equal(faceFromYaw(deg(170)), "down");
  assert.equal(faceFromYaw(deg(10)), "up");
});
