import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createGraph, ingestLine, nearest, nearestFullScan } from "./streets.ts";

// 0.1.34 heat: the pruned nearest() must give exactly the same snap as the old full scan on a real city.
test("nearest matches the full scan on baked city streets", () => {
  for (const city of ["detroit", "austin"]) {
    const { lines } = JSON.parse(readFileSync(new URL(`../../public/streets/${city}.json`, import.meta.url), "utf8")) as { lines: number[][] };
    const g = createGraph(lines[0]![0]!, lines[0]![1]!);
    for (const l of lines) {
      const pts = [];
      for (let i = 0; i + 1 < l.length; i += 2) pts.push({ lat: l[i]!, lng: l[i + 1]! });
      ingestLine(g, pts);
    }
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const o = { lat: lines[0]![0]!, lng: lines[0]![1]! };
    let hits = 0;
    for (let i = 0; i < 4000; i++) {
      const lat = o.lat + (rnd() - 0.5) * 0.06, lng = o.lng + (rnd() - 0.5) * 0.08;
      const max = [5, 22, 40, 50, 80, 150, 240, 400, 1400][i % 9]!;
      const a = nearest(g, lat, lng, max), b = nearestFullScan(g, lat, lng, max);
      assert.deepEqual(a, b, `${city} ${lat},${lng} max ${max}`);
      if (a) hits++;
    }
    // Right on or beside street corners, where two segments tie on distance.
    for (let i = 0; i < 4000; i++) {
      const n = g.nodes[Math.floor(rnd() * g.nodes.length)]!;
      const lat = n.lat + (i % 2 ? (rnd() - 0.5) * 0.0004 : 0), lng = n.lng + (i % 2 ? (rnd() - 0.5) * 0.0004 : 0);
      const max = [22, 40, 50, 80, 240][i % 5]!;
      assert.deepEqual(nearest(g, lat, lng, max), nearestFullScan(g, lat, lng, max), `${city} node ${lat},${lng} max ${max}`);
    }
    assert.ok(hits > 500, `${city} hits ${hits}`);
  }
});
