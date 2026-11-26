import { test } from "node:test";
import assert from "node:assert/strict";
import { retryingCache } from "./dyeCache.ts";

test("0.1.193: a rejected load is not cached; the next request retries and a success is cached", async () => {
  const c = retryingCache<string>();
  let calls = 0;
  const load = async () => {
    calls++;
    if (calls === 1) throw new Error("decode failed");
    return "sheet";
  };
  assert.equal(await c.get("corgi", load), null, "the failure resolves to null, never rejects");
  assert.deepEqual(c.keys(), [], "the failed load was evicted");
  assert.equal(await c.get("corgi", load), "sheet");
  assert.equal(await c.get("corgi", load), "sheet");
  assert.equal(calls, 2, "the success is cached");
});

test("0.1.193: an empty load is retried too, and deleting a key forces a reload", async () => {
  const c = retryingCache<number>();
  let n = 0;
  assert.equal(await c.get("k", async () => (++n === 1 ? null : n)), null);
  assert.equal(await c.get("k", async () => (++n === 1 ? null : n)), 2);
  c.delete("k");
  assert.equal(await c.get("k", async () => ++n), 3);
});

test("0.1.193: concurrent requests share one load", async () => {
  const c = retryingCache<string>();
  let calls = 0;
  const load = async () => (++calls, "x");
  const [a, b] = await Promise.all([c.get("k", load), c.get("k", load)]);
  assert.deepEqual([a, b, calls], ["x", "x", 1]);
});
