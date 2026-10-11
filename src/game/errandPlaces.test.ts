import assert from "node:assert/strict";
import { test } from "node:test";
import { CITY_LIST, cityBoard, cityCounter, cityShop } from "./data.ts";
import { distM } from "./geo.ts";

test("every city has a counter and a notice board, a short walk from spawn and from the outfitter", () => {
  for (const city of CITY_LIST) {
    const counter = cityCounter(city.id);
    const board = cityBoard(city.id);
    const shop = cityShop(city.id);
    assert.ok(counter, city.id);
    assert.ok(board, city.id);
    assert.equal(city.pois.filter((p) => p.kind === "counter").length, 1, city.id);
    assert.equal(city.pois.filter((p) => p.kind === "board").length, 1, city.id);
    const counterD = distM(city.spawn.lat, city.spawn.lng, counter!.lat, counter!.lng);
    const boardD = distM(city.spawn.lat, city.spawn.lng, board!.lat, board!.lng);
    // Outside the 140 m "you've arrived" circle, still a short walk.
    assert.ok(counterD > 150 && counterD < 280, `${city.id} counter ${Math.round(counterD)}`);
    assert.ok(boardD > 150 && boardD < 280, `${city.id} board ${Math.round(boardD)}`);
    assert.ok(distM(counter!.lat, counter!.lng, board!.lat, board!.lng) > 40, `${city.id} apart`);
    if (shop) {
      assert.ok(distM(counter!.lat, counter!.lng, shop.lat, shop.lng) > 40, `${city.id} counter/shop`);
      assert.ok(distM(board!.lat, board!.lng, shop.lat, shop.lng) > 40, `${city.id} board/shop`);
    }
  }
});
