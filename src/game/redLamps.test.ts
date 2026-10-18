import assert from "node:assert/strict";
import { test } from "node:test";
import { CITIES } from "./data.ts";

test("0.0.95: every city has at least one red lantern", () => {
  for (const c of Object.values(CITIES)) assert.ok(c.pois.some((p) => p.tier === "red"), c.id);
});

test("0.0.95: every night market street has a connected walkable stretch of 300 m+ (Temple's 196 m street is out)", async () => {
  const { marketStreets, streetRuns, MARKET_MIN_RUN_M } = await import("./nightMarket.ts");
  const { MARKET_STREETS } = await import("./marketStreets.ts");
  for (const city of Object.keys(MARKET_STREETS) as (keyof typeof MARKET_STREETS)[]) {
    const list = marketStreets(city);
    assert.ok(list.length >= 1, city);
    for (const s of list) {
      assert.ok(s.lenM >= MARKET_MIN_RUN_M, `${city} ${s.name} ${s.lenM}`);
      assert.equal(streetRuns(s.lines).length, 1, "only the one connected stretch is lit");
    }
  }
  assert.ok(!marketStreets("temple").some((s) => s.name === "North 2nd Street"));
});
