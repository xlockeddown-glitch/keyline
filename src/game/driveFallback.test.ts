import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("0.1.32: live roads failing (Temple), the car drives the baked streets within seconds", async () => {
  const baked = readFileSync(new URL("../../public/streets/temple.json", import.meta.url), "utf8");
  const real = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith("/streets/temple.json")) return new Response(baked, { status: 200 });
    throw new TypeError("network down"); // server fn, Overpass, OSRM: all failing
  }) as typeof fetch;
  try {
    const { bootstrapDrive } = await import("./streets.ts");
    const t0 = Date.now();
    const g = await bootstrapDrive(31.0957, -97.3452, [], undefined, "temple");
    assert.ok(g.segs.length >= 8, `drive graph has ${g.segs.length} segs`);
    assert.ok(Date.now() - t0 < 9000, "no 45 s wait for spines");
  } finally {
    globalThis.fetch = real;
  }
});

test("0.1.32: both map setups hand the city to the drive bootstrap; an unloaded graph says so", () => {
  const map = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  assert.equal(map.match(/bootstrapDrive\([^)]*abort\.signal, city\.id\)/g)?.length, 2);
  assert.match(map, /The roads are still loading/);
});
