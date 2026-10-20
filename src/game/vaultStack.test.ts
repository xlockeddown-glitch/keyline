import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cityDay, openNumber, stackedCoolMs } from "./vaultStack.ts";
import { lampCoolMs } from "./ticket.ts";
import { marketCoolMs, MARKET_MULT } from "./nightMarket.ts";

test("0.1.7: the nth open of a lamp today rests n times as long; a new city day starts over", () => {
  const white = lampCoolMs("white"); // 90 s
  const day = "2026-10-19";
  let v: { opens?: number; openDay?: string } | undefined;
  const rests: number[] = [];
  for (let i = 0; i < 3; i++) {
    const n = openNumber(v, day);
    rests.push(stackedCoolMs(white, n));
    v = { opens: n, openDay: day };
  }
  assert.deepEqual(rests, [90_000, 180_000, 270_000]);
  assert.equal(openNumber(v, "2026-10-20"), 1, "midnight resets");
  // Market lamps stack on their 4x rest: 6, 12, 18 minutes for a white.
  assert.deepEqual([1, 2, 3].map((n) => stackedCoolMs(marketCoolMs(white, MARKET_MULT), n)), [360_000, 720_000, 1_080_000]);
});

test("0.1.7: the day is the city's own — 11:30 PM in Austin is still the same day there, not UTC's next day", () => {
  const at = Date.UTC(2026, 9, 20, 4, 30); // 11:30 PM Oct 19 in Austin (CDT)
  assert.equal(cityDay("austin", at), "2026-10-19");
  assert.equal(cityDay("austin", at + 60 * 60_000), "2026-10-20");
  assert.equal(cityDay("nyc", at), "2026-10-20"); // 12:30 AM in New York
});

test("0.1.7: the store keeps the count with the lamp's cooldown", () => {
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(store, /stackedCoolMs\(marketCoolMs\(lampCoolMs\(poi\.tier\), lampMult\), opens\)/);
  assert.match(store, /coolUntil: Date\.now\(\) \+ lanternLeft, opens, openDay/);
});
