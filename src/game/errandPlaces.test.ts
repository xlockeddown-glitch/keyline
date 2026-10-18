import assert from "node:assert/strict";
import { test } from "node:test";
import { CITY_LIST, cityBoard, cityBoards, cityCounter, cityCounters, cityShop, isQuestBoard } from "./data.ts";
import { distM } from "./geo.ts";

/** Compact cities keep one of each. Bigger maps get two or three, spread across the lamps. */
const WANT: Record<string, number> = {
  nashville: 1,
  denver: 1,
  nola: 1,
  seattle: 2,
  boston: 2,
  detroit: 2,
  tucson: 2,
  toronto: 2,
  austin: 2,
  temple: 3,
  london: 3,
  chicago: 3,
  la: 3,
  nyc: 3,
  sf: 3,
};

test("counters and notice boards are spread across the city, with more in the big ones", () => {
  for (const city of CITY_LIST) {
    const counters = cityCounters(city.id);
    // 0.0.93: the Quest Board sits by the start lamp on purpose; the spread rule is for the errand boards.
    const boards = cityBoards(city.id).filter((p) => !isQuestBoard(p));
    const shop = cityShop(city.id);
    const lamps = city.pois.filter((p) => p.kind !== "shop" && p.kind !== "counter" && p.kind !== "board" && p.kind !== "station");
    assert.equal(counters.length, WANT[city.id], `${city.id} counters`);
    assert.equal(boards.length, WANT[city.id], `${city.id} boards`);
    assert.equal(cityCounter(city.id)?.id, `counter-${city.id}`);
    assert.equal(cityBoard(city.id)?.id, `board-${city.id}`);
    const spots = [...counters, ...boards];
    const names = new Set(spots.map((p) => p.name));
    assert.equal(names.size, spots.length, `${city.id} names`);
    for (const spot of spots) {
      const fromSpawn = distM(city.spawn.lat, city.spawn.lng, spot.lat, spot.lng);
      assert.ok(fromSpawn > 400, `${city.id} ${spot.name} is ${Math.round(fromSpawn)}m from spawn`);
      const nearLamp = Math.min(...lamps.map((l) => distM(spot.lat, spot.lng, l.lat, l.lng)));
      assert.ok(nearLamp > 80, `${city.id} ${spot.name} sits on a lamp (${Math.round(nearLamp)}m)`);
      if (shop) assert.ok(distM(spot.lat, spot.lng, shop.lat, shop.lng) > 80, `${city.id} ${spot.name} on the shop`);
    }
    let farthest = 0;
    for (let i = 0; i < spots.length; i++) {
      farthest = Math.max(farthest, distM(city.spawn.lat, city.spawn.lng, spots[i]!.lat, spots[i]!.lng));
      for (let j = i + 1; j < spots.length; j++) {
        const d = distM(spots[i]!.lat, spots[i]!.lng, spots[j]!.lat, spots[j]!.lng);
        assert.ok(d > 600, `${city.id} ${spots[i]!.name} and ${spots[j]!.name} are ${Math.round(d)}m apart`);
      }
    }
    assert.ok(farthest > 800, `${city.id} farthest errand is only ${Math.round(farthest)}m out`);
  }
});
