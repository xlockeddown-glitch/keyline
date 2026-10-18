import { test } from "node:test";
import assert from "node:assert/strict";
import { cachePrize, cacheSeed, dailyGoals, freshGoals, goalDone, goalsClaimable, noteGoal, payMatch, streakPrize } from "./goals.ts";
import { matchCap } from "./ticket.ts";

test("streak prizes: 5 white, 10 blue, round again", () => {
  assert.deepEqual([1, 4, 5, 9, 10, 15, 20, 25].map(streakPrize), [null, null, "white", null, "blue", "white", "blue", "white"]);
});

test("0.0.97: payMatch adds in its own colour (the pocket rule settles later)", () => {
  const keys = { white: matchCap("white"), blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const p = payMatch(keys, "white");
  assert.equal(p.keys.white, matchCap("white") + 1);
  assert.equal(p.coin, 0);
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

test("0.0.97 payMatches lands each rolled colour as is", async () => {
  const { payMatches } = await import("./goals.ts");
  const z = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const r = payMatches(z, ["white", "blue", "white"]);
  assert.deepEqual(r.got, ["white", "blue", "white"]);
  assert.deepEqual([r.keys.white, r.keys.blue, r.coin], [2, 1, 0]);
});

test("0.0.97: payMatchesOf adds n of one colour", async () => {
  const { payMatchesOf } = await import("./goals.ts");
  const z = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  assert.deepEqual(payMatchesOf({ ...z, white: 29 }, "white", 3).add, { white: 3 });
});

test("0.0.97 pocket rule: every colour holds 30; 3 extras merge into 1 of the next colour only", async () => {
  const { settlePocket, creditHint, POCKET } = await import("./goals.ts");
  const { matchCap } = await import("./ticket.ts");
  const { TIER_VALUE } = await import("./rewards.ts");
  assert.equal(POCKET, 30);
  for (const t of ["white", "blue", "green", "amber", "red", "violet"] as const) assert.equal(matchCap(t), 30);
  const z = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  // Room: lands as is.
  assert.deepEqual(settlePocket(z, { ...z, white: 5 }).keys, { ...z, white: 5 });
  // Full white: 2 extras → credits, persisted; the third merges into blue (never amber).
  const full = { ...z, white: 30 };
  const a = settlePocket(full, { ...full, white: 32 });
  assert.deepEqual(a.keys, full);
  assert.deepEqual(a.credit, { white: 2 });
  assert.equal(creditHint(a.credit, "white"), "2/3 toward blue");
  const b = settlePocket(full, { ...full, white: 31 }, a.credit);
  assert.deepEqual(b.keys, { ...full, blue: 1 });
  assert.deepEqual(b.credit, {});
  assert.deepEqual(b.merged, { blue: 1 });
  // Chain: white→blue full→credit there, never skipping a colour.
  const wb = { ...z, white: 30, blue: 30 };
  const c = settlePocket(wb, { ...wb, white: 33 }, { blue: 2 });
  assert.deepEqual(c.keys, { ...wb, green: 1 });
  assert.deepEqual(c.credit, {});
  assert.equal(c.keys.amber, 0, "no jump to amber");
  // Full violet pays violet's coin per overflow match.
  const v = settlePocket({ ...z, violet: 30 }, { ...z, violet: 32 });
  assert.equal(v.coin, 2 * TIER_VALUE.violet);
  assert.equal(v.keys.violet, 30);
  // Existing players above 30 keep what they have; new ones count as overflow; spending still works.
  const old = { ...z, amber: 150 };
  const o = settlePocket(old, { ...old, amber: 151 });
  assert.equal(o.keys.amber, 150);
  assert.deepEqual(o.credit, { amber: 1 });
  assert.equal(settlePocket(old, { ...old, amber: 149 }).keys.amber, 149, "spends are untouched");
  // Forged credits are clamped to 0-2 (and none on violet).
  const f = settlePocket(z, z, { white: 99, violet: 5 } as never);
  assert.deepEqual(f.credit, { white: 2 });
});
