import assert from "node:assert/strict";
import { test } from "node:test";
import { packLine } from "./streetApi.ts";
import { createGraph, ingestOsmWays, pathLength, routeOnGraph } from "./streets.ts";
import { sharedVertices } from "./walkable.ts";

// 0.1.35: OSM ways come with dense vertices; thinning to 14 m used to drop the shared corner vertex from both ways, so
// the crossing never joined and walks looped around blocks (Corktown: Michigan Ave to Rosa Parks at Bagley) or
// couldn't reach a lamp beside the walker (Midtown). Route length across a corner must stay ~direct.
test("thinned ways still join at their shared corner", () => {
  const o = { lat: 42.3315, lon: -83.064 };
  const dLat = 1 / 111320, dLon = 1 / (111320 * Math.cos((o.lat * Math.PI) / 180));
  const at = (x: number, y: number) => ({ lat: o.lat + y * dLat, lon: o.lon + x * dLon });
  const ns = [], ew = [], ring = [];
  for (let y = -200; y <= 200; y += 4) ns.push(at(0, y)); // Rosa Parks
  for (let x = -200; x <= 200; x += 4) ew.push(at(x, 0)); // Michigan
  // The long way round (east, south, back west), like Church St / Leverette.
  for (const [x, y] of [[200, 0], [200, -300], [0, -300], [0, -200]] as const) ring.push(at(x, y));
  const els = [{ geometry: ns }, { geometry: ew }, { geometry: ring }];
  const keep = sharedVertices(els);
  const g = createGraph(o.lat, o.lon);
  // Server thinning (packLine), then the client graph build (ingestOsmWays: its own 12 m thinning + stitch).
  const ways = els.map((el) => {
    const packed = packLine(el.geometry, keep);
    const geometry = [];
    for (let i = 0; i + 1 < packed.length; i += 2) geometry.push({ lat: packed[i]!, lon: packed[i + 1]! });
    return { geometry };
  });
  ingestOsmWays(g, ways);
  const from = at(-60, 0), to = at(0, -120);
  const path = routeOnGraph(g, { lat: from.lat, lng: from.lon }, { lat: to.lat, lng: to.lon });
  assert.ok(path, "no route");
  assert.ok(pathLength(path) < 200, `detour ${pathLength(path).toFixed(0)} m (direct is 180 m)`);
});
