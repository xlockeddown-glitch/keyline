import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph, graphCovers, ingestBaked, ingestLine, routeOnGraph, type BakedCity } from "./streets.ts";

// A plus-shaped walk (two ways sharing the center node) and a freeway row off to the east.
function plus(): BakedCity {
  const abs = [
    [4100000, -8760000],
    [4100100, -8760000],
    [4100200, -8760000],
    [4100100, -8760100],
    [4100100, -8759900],
    [4100000, -8759000],
    [4100200, -8759000],
  ];
  const nodes: number[] = [];
  let pl = 0;
  let pa = 0;
  for (const [la, lo] of abs) {
    nodes.push(la! - pl, lo! - pa);
    pl = la!;
    pa = lo!;
  }
  return { v: 2, city: "t", snapshot: "2026-10-27", source: "© OpenStreetMap contributors, ODbL", bbox: [40.99, -87.61, 41.01, -87.58], cls: ["walk", "motorway"], names: [""], nodes, ways: [[0, 0, 1, 0, 1, 2], [0, 0, 1, 3, 1, 4], [1, 0, 4, 5, 6]] };
}

test("baked walk: junction shared by index, freeway goes to the no-walk layer", () => {
  const g = ingestBaked(createGraph(41.001, -87.6), plus());
  assert.equal(g.nodes.length, 5);
  assert.equal(g.segs.length, 4);
  assert.ok(g.fw.length >= 1);
  const path = routeOnGraph(g, { lat: 41.0, lng: -87.6 }, { lat: 41.001, lng: -87.599 });
  assert.ok(path, "routes across the shared corner");
});

test("baked bbox counts as covered, so the live fetch is skipped inside it but not past it", () => {
  const g = ingestBaked(createGraph(41.001, -87.6), plus());
  assert.equal(graphCovers(g, 41.0, -87.595), true);
  assert.equal(graphCovers(g, 41.2, -87.595), false);
});

test("a later live line merges onto baked nodes (lazy node keys)", () => {
  const g = ingestBaked(createGraph(41.001, -87.6), plus());
  const before = g.nodes.length;
  ingestLine(g, [{ lat: 41.002, lng: -87.6 }, { lat: 41.003, lng: -87.6 }]);
  assert.equal(g.nodes.length, before + 1, "the shared end reuses the baked node");
});
