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

test("0.1.123: every city's house lot is within 200 m of where you start, so it's on the first screen", async () => {
  const { CITIES } = await import("./data.ts");
  for (const [id, lot] of Object.entries(HOUSE_LOTS)) {
    const c = CITIES[id as keyof typeof CITIES] as { spawn: { lat: number; lng: number }; start?: { lat: number; lng: number } };
    const s = c.start ?? c.spawn;
    const r = Math.PI / 180;
    const m = Math.hypot((lot.lng - s.lng) * r * Math.cos(s.lat * r), (lot.lat - s.lat) * r) * 6_371_000;
    assert.ok(m <= 200, `${id}: house lot is ${Math.round(m)} m from the start`);
  }
});

/** WebP extended header: canvas size and the alpha flag (VP8X chunk). */
function webpInfo(path: string): { w: number; h: number; alpha: boolean } {
  const b = readFileSync(new URL(path, import.meta.url));
  assert.equal(b.toString("ascii", 0, 4), "RIFF");
  assert.equal(b.toString("ascii", 12, 16), "VP8X", `${path} should be an extended (alpha) webp`);
  return { alpha: (b[20] & 0x10) !== 0, w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
}

test("0.1.157: the approved Gemini houses ship as transparent cutouts, at least 3x their CSS size", () => {
  for (const h of HOUSES) {
    const map = webpInfo(`../../public/houses/${h.id}-map.webp`);
    const art = webpInfo(`../../public/houses/${h.id}.webp`);
    const pin = webpInfo(`../../public/houses/${h.id}-pin.webp`);
    for (const x of [map, art, pin]) assert.ok(x.alpha, `${h.id}: no alpha`);
    assert.ok(map.w >= 3 * 48 * 2, `${h.id}-map is ${map.w} px wide`); // ~48 CSS px at street zoom, up to ~2x that closer in
    assert.ok(art.w >= 1050 && art.w * 3 === art.h * 4, `${h.id}.webp is ${art.w}x${art.h}`); // sheet hero ~350 CSS px, 4:3
    assert.ok(pin.w >= 3 * 96 && pin.h >= 3 * 72, `${h.id}-pin is ${pin.w}x${pin.h}`); // sheet thumb 96x72
  }
  const sheet = readFileSync(new URL("../components/keyline/HouseSheet.tsx", import.meta.url), "utf8");
  assert.match(sheet, /className="house-thumb" src=\{housePin\(h\.id\)\}/);
});
