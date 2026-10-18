import { test } from "node:test";
import assert from "node:assert/strict";
import { cachePrize, cacheSeed, dailyGoals, freshGoals, goalDone, goalsClaimable, noteGoal, payMatch, streakPrize } from "./goals.ts";
import { matchCap } from "./ticket.ts";

test("streak prizes: 5 white, 10 blue, round again", () => {
  assert.deepEqual([1, 4, 5, 9, 10, 15, 20, 25].map(streakPrize), [null, null, "white", null, "blue", "white", "blue", "white"]);
});

test("full pocket pays overflow coin", () => {
  const keys = { white: matchCap("white"), blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const p = payMatch(keys, "white");
  assert.equal(p.match, false);
  assert.ok(p.coin > 0);
});

test("cache: same spot per city/day, 2-3 matches never violet, same prize on retry", () => {
  const s = { lat: 30.27, lng: -97.74 };
  assert.deepEqual(cacheSeed("austin", "2026-10-18", s), cacheSeed("austin", "2026-10-18", s));
  assert.notDeepEqual(cacheSeed("austin", "2026-10-18", s), cacheSeed("austin", "2026-10-19", s));
  for (let d = 1; d <= 28; d++) {
    const p = cachePrize("pl", `2026-10-${String(d).padStart(2, "0")}`);
    assert.ok(p.length >= 2 && p.length <= 3);
    assert.ok(p.every((t) => t === "white" || t === "blue" || t === "green"));
  }
});

test("daily goals: three distinct, progress counts, claimable", () => {
  const day = "2026-10-18";
  const defs = dailyGoals(day);
  assert.equal(new Set(defs.map((d) => d.kind)).size, 3);
  let g = freshGoals(day);
  for (const d of defs) g = noteGoal(g, d.kind, d.need, day);
  assert.ok([0, 1, 2].every((i) => goalDone(g, i)));
  assert.ok(goalsClaimable(g));
  g = { ...g, paid: [true, true, true] };
  assert.ok(goalsClaimable(g), "the green match for all three");
  g = { ...g, all: true };
  assert.ok(!goalsClaimable(g));
  assert.equal(noteGoal(g, defs[0]!.kind, 1, "2026-10-19").day, "2026-10-19", "a new day starts fresh");
});
