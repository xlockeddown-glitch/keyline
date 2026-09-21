import assert from "node:assert/strict";
import { test } from "node:test";
import { clampWard, inWard, wardFrom } from "./ward.ts";

test("the ward contains every point it was built from", () => {
  const pts = [
    { lat: 30.27, lng: -97.74 },
    { lat: 30.29, lng: -97.73 },
    { lat: 30.25, lng: -97.76 },
  ];
  const w = wardFrom(pts);
  for (const p of pts) assert.equal(inWard(w, p.lat, p.lng), true);
});

test("the fog is outside the box", () => {
  const w = wardFrom([{ lat: 30.27, lng: -97.74 }]);
  assert.equal(inWard(w, 0, 0), false);
  const edge = clampWard(w, w.north + 1, w.east + 1);
  assert.equal(edge.lat, w.north);
  assert.equal(edge.lng, w.east);
});
