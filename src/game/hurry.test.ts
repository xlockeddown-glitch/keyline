import { test } from "node:test";
import assert from "node:assert/strict";
import { FARE_MAX_MS, HURRY_MIN_RIDE_MS, fareMs, hurriedLoot, hurryCost, hurryTarget, transitLoot } from "./ticket.ts";
import { CITY_LIST } from "./data.ts";

test("0.1.2 rides: every fare sits between 30 s and the 5-minute cap", () => {
  for (const a of CITY_LIST) for (const b of CITY_LIST) if (a.id !== b.id) {
    const ms = fareMs(a.id, b.id);
    assert.ok(ms >= HURRY_MIN_RIDE_MS && ms <= FARE_MAX_MS, `${a.id}->${b.id} ${ms}`);
  }
  assert.equal(FARE_MAX_MS, 5 * 60_000);
});

test("Hurry up: per-minute price, 30 s floor, never before now", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((m) => hurryCost(m * 60_000)), [25, 50, 75, 100, 125]);
  assert.equal(hurryCost(61_000), 50, "a started minute counts whole");
  const d = 1_000_000, a = d + FARE_MAX_MS;
  assert.equal(hurryTarget(d, a, d + 10_000, 1), a - 60_000);
  assert.equal(hurryTarget(d, a, d + 10_000, 5), d + HURRY_MIN_RIDE_MS, "floors at 30 s total");
  assert.equal(hurryTarget(d, d + HURRY_MIN_RIDE_MS, d + 5_000, 1), null, "nothing left to skip");
  assert.ok(hurryTarget(d, a, a - 20_000, 5)! >= a - 20_000 + 1_000 || hurryTarget(d, a, a - 20_000, 5) === null);
});

test("Hurry up keeps seat pay, forfeits the game bonus for the skipped part", () => {
  const full = FARE_MAX_MS, short = 60_000;
  const won = { kind: "won" as const, perf: 1 };
  const plain = transitLoot(full, full, full, { kind: "idle" });
  const hurriedIdle = hurriedLoot(short, short, short, full, { kind: "idle" });
  assert.deepEqual(hurriedIdle, plain, "idle seat pay is the full ride's");
  const hurriedWon = hurriedLoot(short, short, short, full, won);
  const fullWon = transitLoot(full, full, full, won);
  assert.ok(hurriedWon.white >= plain.white, "never below seat pay");
  assert.ok(hurriedWon.white + 3 * hurriedWon.blue < fullWon.white + 3 * fullWon.blue, "a skipped ride's game bonus is smaller");
  assert.deepEqual(hurriedLoot(full, full, full, full, won), fullWon, "unhurried rides unchanged");
});
