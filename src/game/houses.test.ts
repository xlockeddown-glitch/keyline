import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HOUSES, houseCost, HOUSE_LOTS, isHouseTier } from "./houses.ts";
import { COIN_CAP } from "./wallet.ts";

test("house price ladder and step-up difference", () => {
  assert.deepEqual(HOUSES.map((h) => h.price), [20000, 65000, 150000, 600000]);
  assert.deepEqual(HOUSES.map((h) => h.purse), [350, 700, 1200, 2400]);
  assert.equal(houseCost(null, "villa"), 600000);
  assert.equal(houseCost("cottage", "town"), 130000);
  assert.equal(houseCost("town", "town"), null);
  assert.equal(houseCost("villa", "row"), null);
  assert.ok(isHouseTier("row") && !isHouseTier("castle"));
  assert.ok(COIN_CAP >= 600000);
  for (const lot of Object.values(HOUSE_LOTS)) assert.ok(lot.name && Number.isFinite(lot.lat));
});

test("paintCab never removes the dealer or house markers", () => {
  const src = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  const i = src.indexOf("function paintCab()");
  assert.ok(i > 0);
  const body = src.slice(i, src.indexOf("\n  }\n", i));
  assert.ok(body.length > 50);
  assert.ok(!/dealerMarker|houseMarker/.test(body), "paintCab touches dealer/house marker");
});
