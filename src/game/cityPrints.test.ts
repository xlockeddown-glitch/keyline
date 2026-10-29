import test from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import { ALL_PRINTS, CITY_PRINTS, PRINTS_PENDING, PRINT_GOALS, applyPrintLayer, printProgress } from "./cityPrints.ts";
import type { CityId } from "./types.ts";

test("0.0.99: print goals are Ryan's (500 right + 150/300/500 km walking) and each print uses its slot's goal", () => {
  assert.deepEqual(PRINT_GOALS.map((g) => g.meters), [150_000, 300_000, 500_000]);
  for (const list of Object.values(CITY_PRINTS)) list?.forEach((p, i) => assert.deepEqual(p.goal, PRINT_GOALS[i], p.id));
  for (const list of Object.values(CITY_PRINTS)) assert.ok((list?.length ?? 0) <= 3);
});

test("0.0.99: every city has a print or is on the shrinking pending list (new cities cannot ship without one)", () => {
  for (const id of Object.keys(CITIES) as CityId[]) {
    const has = (CITY_PRINTS[id]?.length ?? 0) > 0;
    const pending = PRINTS_PENDING.includes(id);
    assert.ok(has || pending, `${id} has no print`);
    assert.ok(!(has && pending), `${id} has a print: drop it from PRINTS_PENDING`);
  }
  for (const id of PRINTS_PENDING) assert.ok(id in CITIES, `${id} pending but not a city`);
});

test("prints: unique ids, tiles rectangular with known colours, later prints never easier", () => {
  assert.equal(new Set(ALL_PRINTS.map((p) => p.id)).size, ALL_PRINTS.length);
  for (const p of ALL_PRINTS) {
    const w = p.tile[0]!.length;
    for (const row of p.tile) {
      assert.equal(row.length, w, p.id);
      for (const ch of row) assert.ok(ch in p.palette, `${p.id} ${ch}`);
    }
  }
  for (const list of Object.values(CITY_PRINTS)) {
    for (let i = 1; i < (list?.length ?? 0); i++) {
      assert.ok(list![i]!.goal.correct >= list![i - 1]!.goal.correct && list![i]!.goal.meters >= list![i - 1]!.goal.meters);
    }
  }
});

test("print progress needs both legs; layer only touches the coat mask", () => {
  const p = ALL_PRINTS[0]!;
  assert.equal(printProgress(p, { correct: p.goal.correct, meters: 0 }).done, false);
  assert.equal(printProgress(p, { correct: p.goal.correct, meters: p.goal.meters }).done, true);
  const base = new Uint8ClampedArray([100, 100, 100, 255, 100, 100, 100, 255]);
  const mask = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 255]);
  const out = applyPrintLayer(base, mask, 2, p, { L: 40, C: 10, h: 0 });
  assert.notDeepEqual([...out.slice(0, 3)], [100, 100, 100]);
  assert.deepEqual([...out.slice(4)], [100, 100, 100, 255]);
});

test("0.1.64: denver, nashville, nola and seattle each have a first print; nothing is pending", () => {
  assert.deepEqual([...PRINTS_PENDING], []);
  for (const id of ["denver", "nashville", "nola", "seattle"] as CityId[]) {
    const list = CITY_PRINTS[id] ?? [];
    assert.ok(list.length >= 1, id);
    assert.deepEqual(list[0]!.goal, { correct: 500, meters: 150_000 }, id);
  }
});
