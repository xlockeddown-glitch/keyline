import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { bridgeByFoot, createGraph, ingestFreeway, ingestOsmWays, nearest, routeOnGraph, unpackFreeways, WALK_REACH_M } from "./streets.ts";

// Cass Corridor, Oct 24: live streets down, baked Detroit spines only. The green lamp by 2nd Ave / Brainard sat
// ~400 m off every baked street, so the tap said "No street that way." The foot router's walk now joins the graph.
const player = { lat: 42.3423, lng: -83.059 };
const lamp = { lat: 42.3478, lng: -83.064 };

function bakedDetroit() {
  const read = (f: string) => JSON.parse(fs.readFileSync(new URL(`../../public/streets/${f}`, import.meta.url), "utf8")) as { lines: number[][] };
  const g = createGraph(player.lat, player.lng);
  for (const l of unpackFreeways(read("detroit-fw.json").lines)) ingestFreeway(g, l);
  ingestOsmWays(
    g,
    read("detroit.json").lines.map((line) => {
      const geometry: { lat: number; lon: number }[] = [];
      for (let i = 0; i + 1 < line.length; i += 2) geometry.push({ lat: line[i]!, lon: line[i + 1]! });
      return { geometry };
    }),
  );
  return g;
}

function stubOsrm(coords: [number, number][]) {
  const real = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ code: "Ok", routes: [{ geometry: { coordinates: coords } }] }))) as typeof fetch;
  return () => (globalThis.fetch = real);
}

test("0.1.36: a lamp off the baked streets is reachable once the foot route bridges in", async () => {
  const g = bakedDetroit();
  assert.ok((nearest(g, lamp.lat, lamp.lng, 2000)?.dist ?? 0) > WALK_REACH_M, "fixture: lamp starts off the graph");
  const restore = stubOsrm([[-83.05898, 42.34231], [-83.06233, 42.34819], [-83.06393, 42.34768]]);
  try {
    assert.equal(await bridgeByFoot(g, player, lamp), true);
  } finally {
    restore();
  }
  const snap = nearest(g, lamp.lat, lamp.lng, 220);
  assert.ok(snap && snap.dist <= WALK_REACH_M, `lamp now ${snap?.dist} m from the walk graph`);
  assert.ok(routeOnGraph(g, player, lamp));
});

test("0.1.36: a foot route that stops short of the spot is not ingested", async () => {
  const g = bakedDetroit();
  const before = g.segs.length;
  const restore = stubOsrm([[-83.05898, 42.34231], [-83.06, 42.344]]);
  try {
    assert.equal(await bridgeByFoot(g, player, lamp), false);
  } finally {
    restore();
  }
  assert.equal(g.segs.length, before);
});
