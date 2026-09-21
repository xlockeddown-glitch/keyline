import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import { fareDesk, fareMs, formatEta, isFareDesk, sparkState, transitLoot } from "./ticket.ts";

test("every ward has a desk", () => {
  for (const c of Object.values(CITIES)) {
    const d = fareDesk(c);
    assert.ok(d, c.id);
    assert.ok(isFareDesk(d) || d === c.pois[0]);
  }
});

test("nearby wards are under two minutes", () => {
  const ms = fareMs("austin", "temple");
  assert.ok(ms >= 48_000);
  assert.ok(ms < 120_000, String(ms));
});

test("cross-country is capped", () => {
  const ms = fareMs("boston", "la");
  assert.ok(ms <= 14 * 60_000);
  assert.ok(ms > 6 * 60_000);
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

test("open tab adds an extra white", () => {
  assert.deepEqual(transitLoot(48_000, 25_000), { white: 2, blue: 0, green: 0 });
  assert.deepEqual(transitLoot(48_000, 10_000), { white: 1, blue: 0, green: 0 });
});

test("waiting longer finds more whites", () => {
  assert.equal(transitLoot(4 * 60_000, 0).white, 3);
  assert.equal(transitLoot(8 * 60_000, 0).white, 4);
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
