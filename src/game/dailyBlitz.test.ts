import assert from "node:assert/strict";
import { test } from "node:test";
import { BLITZ_FULL, BLITZ_STEPS, blitzBank, blitzDue, blitzMatch, blitzMatchLine, blitzTakeLine } from "./dailyBlitz.ts";
import { TIER_VALUE } from "./rewards.ts";

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
  assert.equal(BLITZ_FULL, 880);
  assert.ok(blitzBank(3) > 80, "three lanterns beat the old City Pulse");
});

test("the ladder climbs white to violet", () => {
  assert.deepEqual(
    BLITZ_STEPS.map((s) => s.tier),
    ["white", "blue", "green", "amber", "red", "violet"],
  );
});

test("each right lantern drops a match of its color, or the match's coin when that pocket is full", () => {
  assert.deepEqual(blitzMatch("white", 0, 4), { match: true, overflow: 0 });
  assert.deepEqual(blitzMatch("white", 3, 4), { match: true, overflow: 0 });
  assert.deepEqual(blitzMatch("white", 4, 4), { match: false, overflow: TIER_VALUE.white });
  assert.deepEqual(blitzMatch("green", 1, 1), { match: false, overflow: TIER_VALUE.green });
  assert.deepEqual(blitzMatch("violet", 0, 99), { match: true, overflow: 0 });
  assert.equal(blitzMatchLine(["white"]), "a White match");
  assert.equal(blitzMatchLine(["white", "blue"]), "White and Blue matches");
  assert.equal(blitzTakeLine(100, ["white", "blue", "green"]), "100 coin and White, Blue and Green matches");
  assert.equal(blitzTakeLine(20, []), "20 coin");
});