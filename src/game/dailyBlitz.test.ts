import assert from "node:assert/strict";
import { test } from "node:test";
import { BLITZ_FULL, BLITZ_STEPS, blitzBank, blitzDue } from "./dailyBlitz.ts";

test("Daily Blitz is due until played today", () => {
  assert.equal(blitzDue("", "2026-10-05"), true);
  assert.equal(blitzDue("2026-10-04", "2026-10-05"), true);
  assert.equal(blitzDue("2026-10-05", "2026-10-05"), false);
});

test("later lanterns pay more, and a miss keeps only what was already cleared", () => {
  const pays = BLITZ_STEPS.map((s) => s.pay);
  for (let i = 1; i < pays.length; i++) assert.ok(pays[i]! > pays[i - 1]!, `${pays[i]} after ${pays[i - 1]}`);
  assert.equal(blitzBank(0), 0);
  assert.equal(blitzBank(1), 20);
  assert.equal(blitzBank(2), 50);
  assert.equal(blitzBank(3), 100);
  assert.equal(blitzBank(BLITZ_STEPS.length), BLITZ_FULL);
  assert.equal(BLITZ_FULL, 510);
  assert.ok(blitzBank(3) > 80, "three lanterns beat the old City Pulse");
});

test("the ladder climbs white to violet", () => {
  assert.deepEqual(
    BLITZ_STEPS.map((s) => s.tier),
    ["white", "blue", "green", "amber", "red", "violet"],
  );
});
