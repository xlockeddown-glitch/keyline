import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CAFE_MS,
  PACK_SIZE,
  cafeActive,
  cafeTick,
  cityTaggedCards,
  creditCafeWhite,
  drawCityPack,
  mergeHeld,
  type CityCardBank,
} from "./pass2.ts";
import type { TriviaQ } from "./types.ts";

function card(id: string, q: string): TriviaQ {
  return { id, q, choices: ["a", "b", "c", "d"], answer: "a", diff: 1, rarity: "white" };
}

const bank: CityCardBank = {
  austin: {
    local: [card("a1", "Sixth?"), card("a2", "Drag?"), card("a3", "Zilker?"), card("a4", "Tower?"), card("a5", "I-35?"), card("a6", "Barton?")],
    food: [card("a7", "BBQ?")],
  },
};

test("cafe drip only runs when visible and focused", () => {
  assert.equal(cafeActive(true, true), true);
  assert.equal(cafeActive(false, true), false);
  assert.equal(cafeActive(true, false), false);
  const off = cafeTick(CAFE_MS - 1, 50, false, true);
  assert.equal(off.drop, 0);
  assert.equal(off.running, false);
  assert.equal(off.acc, CAFE_MS - 1);
  const on = cafeTick(CAFE_MS - 10, 20, true, true);
  assert.equal(on.drop, 1);
  assert.equal(on.running, true);
});

test("hidden tab does not accumulate toward the next white", () => {
  const a = cafeTick(10_000, 30_000, false, false);
  assert.equal(a.acc, 10_000);
  assert.equal(a.drop, 0);
});

test("creditCafeWhite respects the pocket", () => {
  const keys = { white: 3, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const one = creditCafeWhite(keys, 1);
  assert.equal(one.added, 1);
  assert.equal(one.keys.white, 4);
  assert.equal(creditCafeWhite(one.keys, 1).added, 0);
});

test("city pack draws existing tagged trivia cards and skips held ids", () => {
  const pool = cityTaggedCards("austin", bank);
  assert.ok(pool.length >= PACK_SIZE);
  const pack = drawCityPack("austin", [], bank);
  assert.equal(pack.length, PACK_SIZE);
  const held = mergeHeld([], "austin", pack);
  assert.equal(held.length, PACK_SIZE);
  const again = drawCityPack("austin", held.map((h) => h.id), bank);
  assert.ok(again.every((c) => !held.some((h) => h.id === c.id)));
});
