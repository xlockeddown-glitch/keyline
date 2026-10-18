import { test } from "node:test";
import assert from "node:assert/strict";
import { cachePrize, cacheSeed, dailyGoals, freshGoals, goalDone, goalsClaimable, noteGoal, payMatch, streakPrize } from "./goals.ts";
import { matchCap } from "./ticket.ts";

test("streak prizes: 5 white, 10 blue, round again", () => {
  assert.deepEqual([1, 4, 5, 9, 10, 15, 20, 25].map(streakPrize), [null, null, "white", null, "blue", "white", "blue", "white"]);
});

test("0.0.96: coin only when every pocket above is full", () => {
  const keys = { white: matchCap("white"), blue: matchCap("blue"), green: matchCap("green"), amber: matchCap("amber"), red: matchCap("red"), violet: 0 };
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

test("0.0.95 payMatches steps a full colour up to the next tier with room, coin only when all are full", async () => {
  const { payMatches } = await import("./goals.ts");
  const { matchCap } = await import("./ticket.ts");
  const z = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const full = (ts: string[]) => ({ ...z, ...Object.fromEntries(ts.map((t) => [t, matchCap(t as never)])) });
  assert.deepEqual(payMatches(full(["white"]), ["white"]).got, ["blue"]);
  assert.deepEqual(payMatches(full(["white", "blue", "green"]), ["blue"]).got, ["amber"]);
  assert.deepEqual(payMatches(full(["green"]), ["green", "green"]).got, ["amber", "amber"].slice(0, 2));
  assert.deepEqual(payMatches(z, ["white"]).got, ["white"], "room: pays the rolled colour");
  const none = payMatches(full(["white", "blue", "green", "amber", "red", "violet"]), ["white", "blue"]);
  assert.deepEqual(none.got, []);
  assert.ok(none.coin > 0);
});

test("0.0.96: pockets ~50% bigger and one shared step-up rule (violet only from red)", async () => {
  const { matchCap } = await import("./ticket.ts");
  const { stepMatch, payMatch, payMatchesOf } = await import("./goals.ts");
  assert.deepEqual(["white", "blue", "green", "amber", "red", "violet"].map((t) => matchCap(t as never)), [6, 6, 2, 150, 150, 150]);
  const z = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  assert.equal(stepMatch({ ...z, white: 6 }, "white").tier, "blue");
  assert.equal(stepMatch({ ...z, white: 6, blue: 6, green: 2 }, "white").tier, "amber");
  // Violet is never reached from white/blue/green/amber.
  const fullToRed = { white: 6, blue: 6, green: 2, amber: 150, red: 150, violet: 0 };
  const w = stepMatch(fullToRed, "white");
  assert.equal(w.tier, null);
  assert.ok(w.coin > 0);
  assert.equal(stepMatch(fullToRed, "red").tier, "violet");
  const p = payMatch({ ...z, blue: 6 }, "blue");
  assert.equal(p.tier, "green");
  assert.equal(p.up, true);
  assert.equal(p.coin, 0);
  const many = payMatchesOf({ ...z, white: 5 }, "white", 3);
  assert.deepEqual(many.add, { white: 1, blue: 2 });
});
