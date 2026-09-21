import { test } from "node:test";
import assert from "node:assert/strict";
import { crateLine, crateLoot, dayGap, nextCrateStreak } from "./crate.ts";

test("day gap is calendar days", () => {
  assert.equal(dayGap("2026-09-18", "2026-09-19"), 1);
  assert.equal(dayGap("2026-09-18", "2026-09-20"), 2);
  assert.equal(dayGap("2026-09-18", "2026-09-21"), 3);
});

test("one missed day is forgiven", () => {
  assert.equal(nextCrateStreak("2026-09-18", 4, "2026-09-19"), 5);
  assert.equal(nextCrateStreak("2026-09-18", 4, "2026-09-20"), 5);
  assert.equal(nextCrateStreak("2026-09-18", 4, "2026-09-21"), 1);
});

test("first claim is day 1", () => {
  assert.equal(nextCrateStreak("", 0, "2026-09-20"), 1);
});

test("streak caps at 30", () => {
  assert.equal(nextCrateStreak("2026-09-19", 30, "2026-09-20"), 30);
});

test("day 1 is five white and one blue", () => {
  assert.deepEqual(crateLoot(1), {
    white: 5,
    blue: 1,
    green: 0,
    amber: 0,
    red: 0,
    violet: 0,
  });
});

test("day 30 is a violet", () => {
  const loot = crateLoot(30);
  assert.equal(loot.violet, 1);
  assert.equal(crateLine(loot).includes("violet"), true);
});