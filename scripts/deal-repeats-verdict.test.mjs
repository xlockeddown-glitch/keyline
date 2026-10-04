import { test } from "node:test";
import assert from "node:assert/strict";
import { repeatVerdict, repeatsWithin, shortestGap } from "./deal-repeats-verdict.mjs";

test("repeat windows and gaps", () => {
  const ids = ["a", "b", "a", "c", "d", "b"];
  assert.equal(repeatsWithin(ids, 1), 0);
  assert.equal(repeatsWithin(ids, 2), 1);
  assert.equal(repeatsWithin(ids, 4), 2);
  assert.equal(shortestGap(ids), 2);
  assert.equal(shortestGap(["a", "b"]), Infinity);
});

test("verdict: a repeat inside 50 fails, unless the pool is smaller and the gap covers it", () => {
  const ids = Array.from({ length: 60 }, (_, i) => `c${i % 30}`);
  assert.equal(repeatVerdict("x", ids).problems.length, 1);
  assert.equal(repeatVerdict("x", ids, 30).problems.length, 0);
  assert.deepEqual(repeatVerdict("y", ["a", "b"]).row.shortestGap, null);
});
