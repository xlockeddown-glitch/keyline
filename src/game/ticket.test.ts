import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import { fareDesk, fareMs, FARE_MAX_MS, formatEta, isFareDesk, lampCoolMs, landOldTrain, settleRide, sparkState, transitLoot } from "./ticket.ts";
import type { Journey, Tier } from "./types.ts";

test("eight night marks, and a violet lamp sleeps six hours", () => {
  const ids = Object.values(CITIES).flatMap((c) => c.pois.filter((p) => p.tier === "violet").map((p) => p.id));
  assert.deepEqual(ids.sort(), ["big-ben", "cn-tower", "den-capitol", "esb", "nash-ryman", "phl-indhall", "sea-needle", "tx-capitol"]);
  assert.equal(lampCoolMs("violet"), 6 * 60 * 60_000);
  assert.equal(lampCoolMs("red"), 400_000);
});

test("every ward has a desk", () => {
  for (const c of Object.values(CITIES)) {
    const d = fareDesk(c);
    assert.ok(d, c.id);
    assert.ok(isFareDesk(d) || d === c.pois[0]);
  }
});

test("nearby wards are under 75 s (0.1.2)", () => {
  const ms = fareMs("austin", "temple");
  assert.ok(ms >= 30_000);
  assert.ok(ms < 75_000, String(ms));
});

test("cross-country is capped at eleven minutes", () => {
  const ms = fareMs("boston", "la");
  assert.equal(ms, FARE_MAX_MS);
  assert.ok(fareMs("austin", "chicago") < FARE_MAX_MS);
});

test("eta copy", () => {
  assert.equal(formatEta(12_000), "12s");
  assert.equal(formatEta(60_000), "1m");
  assert.equal(formatEta(90_000), "1m 30s");
});

test("short closed tab still yields one match", () => {
  assert.deepEqual(transitLoot(48_000, 0), { white: 1, blue: 0, green: 0 });
  assert.deepEqual(transitLoot(5_000, 0), { white: 0, blue: 0, green: 0 });
});

test("open tab no longer trickles extra whites", () => {
  assert.deepEqual(transitLoot(48_000, 25_000), { white: 1, blue: 0, green: 0 });
  assert.deepEqual(transitLoot(48_000, 10_000), { white: 1, blue: 0, green: 0 });
});

test("an idle ride pays its idle rate, not more per minute", () => {
  // 0.1.2: old minutes × 5/8.
  assert.equal(transitLoot(4 * 37_500, 0, 4 * 37_500).white, 1);
  assert.equal(transitLoot(8 * 37_500, 0, 8 * 37_500).white, 1);
  assert.equal(transitLoot(14 * 37_500, 0, 14 * 37_500).white, 2);
});

test("ten minutes is a blue, green only if the tab sat the haul", () => {
  const closed = transitLoot(10 * 60_000, 0);
  assert.equal(closed.blue, 1);
  assert.equal(closed.green, 0);
  const watched = transitLoot(10 * 60_000, 10 * 60_000);
  assert.equal(watched.blue, 1);
  assert.equal(watched.green, 1);
  const ducked = transitLoot(10 * 60_000, 4 * 60_000);
  assert.equal(ducked.green, 0);
  assert.equal(ducked.blue, 1);
});

test("spark resets on a new day", () => {
  const same = sparkState("2026-09-21", 4, ["a"], "2026-09-21");
  assert.equal(same.sparkN, 4);
  const next = sparkState("2026-09-21", 4, ["a"], "2026-09-22");
  assert.equal(next.sparkN, 0);
  assert.deepEqual(next.sparkLamps, []);
});

test("0.1.95: an old save mid-train loads at the platform, round dropped, and the next tick lands it", () => {
  const now = Date.UTC(2026, 10, 1, 18);
  const old = { from: "austin", to: "detroit", departAt: now - 60_000, arriveAt: now + 9 * 60_000, openMs: 30_000, lastTickAt: now - 5_000, grantedWhite: 1, rideGame: "lamplighter", roundAt: now - 2_000, roundBonus: true } as unknown as Journey;
  const j = landOldTrain(old, now)!;
  assert.ok(j && j.arriveAt <= now, "arrived");
  assert.equal(j.to, "detroit");
  assert.equal(j.roundAt, undefined);
  assert.equal(j.fullMs, 10 * 60_000);
  const tick = settleRide(j, { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 } as Record<Tier, number>, now, false);
  assert.equal(tick.arrived, true);
  // Already-arrived rides keep their time; junk or a retired city clears instead of crashing.
  const done = { ...old, arriveAt: now - 1_000 } as Journey;
  assert.equal(landOldTrain(done, now)!.arriveAt, now - 1_000);
  assert.equal(landOldTrain(null, now), null);
  assert.equal(landOldTrain(undefined, now), null);
  assert.equal(landOldTrain({ ...old, to: "atlantis" } as unknown as Journey, now), null);
  assert.equal(landOldTrain("x" as unknown as Journey, now), null);
});
