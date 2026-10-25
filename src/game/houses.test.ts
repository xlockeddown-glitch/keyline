import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HOUSES, houseCost, houseList, HOUSE_LOTS, isHouseTier } from "./houses.ts";
import { COIN_CAP } from "./wallet.ts";

test("house price ladder and step-up difference", () => {
  assert.deepEqual(HOUSES.map((h) => h.price), [40000, 130000, 300000, 1200000]);
  assert.deepEqual(HOUSES.map((h) => h.match), ["white", "blue", "green", "amber"]);
  assert.ok(HOUSES.every((h) => !("purse" in h)), "no coin purse");
  assert.equal(houseCost(null, "villa"), 1200000);
  assert.equal(houseCost("cottage", "town"), 260000);
  assert.equal(houseCost("town", "town"), null);
  assert.equal(houseCost("villa", "row"), null);
  assert.ok(isHouseTier("row") && !isHouseTier("castle"));
  assert.ok(COIN_CAP >= 1200000);
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

test("houseList: owned houses first with their tier, every other city's lot for sale from the cottage price", () => {
  const none = houseList({});
  assert.equal(none.owned.length, 0);
  assert.equal(none.forSale.length, Object.keys(HOUSE_LOTS).length);
  assert.ok(none.forSale.every((r) => r.from === 40_000));
  const two = houseList({ detroit: { tier: "town" }, nyc: { tier: "cottage" }, austin: { tier: "bogus" as never } });
  assert.deepEqual(two.owned.map((r) => [r.city, r.house.name]).sort(), [["detroit", "Ivy Townhouse"], ["nyc", "Lantern Cottage"]]);
  assert.equal(two.forSale.length, Object.keys(HOUSE_LOTS).length - 2);
  assert.ok(two.forSale.some((r) => r.city === "austin"));
  assert.ok(!two.forSale.some((r) => r.city === "detroit"));
});
