import { test } from "node:test";
import assert from "node:assert/strict";
import { inventoryProblems } from "./inventory-layout-verdict.mjs";

const clean = { W: 390, H: 844, panel: { l: 0, t: 70, r: 390, b: 844 }, overflowX: false, offX: [], below: [], clipped: [], tiny: [], overlaps: [], textOut: [], tabsScroll: [], covered: [] };

test("a sheet that fits has no problems", () => {
  assert.deepEqual(inventoryProblems("satchel", clean), []);
});

test("each kind of breakage is reported", () => {
  const m = { ...clean, overflowX: true, panel: { l: 0, t: 70, r: 420, b: 900 }, tabsScroll: ["Journal sections 400>373"], covered: ["leaflet-control-zoom at 10,63"], tiny: ["How to play 65x16"] };
  const p = inventoryProblems("journal", m).join("\n");
  for (const want of ["scrolls sideways", "wider than the screen", "runs off the screen", "tab row runs off", "covered by leaflet-control-zoom", "squashed tap target"]) assert.match(p, new RegExp(want));
  assert.deepEqual(inventoryProblems("x", { missing: true }), ["x: sheet did not open"]);
});
