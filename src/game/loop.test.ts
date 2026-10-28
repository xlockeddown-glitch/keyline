import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LOOP_CRATE_ONE_IN, LOOP_MS, addPoster, cleanPosters, loopCrate, loopCrateLoot, posterHue, posterKey, posterRoute } from "./loop.ts";
import { PACK, recipeLength } from "./sfxPack.ts";

test("Loop crate: about 1 ride in 12, same roll for the same ticket", () => {
  const t0 = Date.UTC(2026, 9, 27, 20);
  let hits = 0;
  const N = 24_000;
  for (let i = 0; i < N; i++) if (loopCrate(t0 + i * 997)) hits++;
  const rate = hits / N;
  assert.ok(Math.abs(rate - 1 / LOOP_CRATE_ONE_IN) < 0.01, `rate ${rate}`);
  assert.equal(loopCrate(t0), loopCrate(t0));
  const loot = loopCrateLoot();
  assert.equal(loot.white, 5);
  assert.equal(loot.blue, 1);
});

test("Loop posters: one per direction, deduped and cleaned", () => {
  assert.equal(posterKey("chicago", "nyc"), "poster:chicago-nyc");
  assert.notEqual(posterKey("nyc", "chicago"), posterKey("chicago", "nyc"));
  const a = addPoster([], "poster:chicago-nyc");
  assert.deepEqual(addPoster(a, "poster:chicago-nyc"), a);
  assert.deepEqual(cleanPosters(["poster:chicago-nyc", "poster:chicago-nyc", 3, "car:belair57", "poster:la-sf"]), ["poster:chicago-nyc", "poster:la-sf"]);
  assert.deepEqual(cleanPosters(null), []);
  assert.deepEqual(posterRoute("poster:la-sf"), { from: "la", to: "sf" });
  assert.equal(posterRoute("car:x"), null);
  const h = posterHue("poster:la-sf");
  assert.ok(h >= 0 && h < 360);
});

test("Loop cutscene runs 6 to 8 s and its whoosh stays a short pack effect", () => {
  assert.ok(LOOP_MS >= 6000 && LOOP_MS <= 8000);
  assert.ok(recipeLength(PACK.loopWhoosh) < 1.2);
});

test("Travel sheet offers Arrive, Loop and the old train; the server closes an early ticket", () => {
  const sheet = readFileSync(new URL("../components/keyline/Timetable.tsx", import.meta.url), "utf8");
  for (const how of ["skip", "loop", "train"]) assert.match(sheet, new RegExp(`punch\\(c\\.id, "${how}"\\)`));
  const server = readFileSync(new URL("./walletApply.ts", import.meta.url), "utf8");
  assert.match(server, /if \(op\.kind === "loop"\) return loopArrive\(/);
  assert.match(server, /now < \(\(await hurriedArrive\(sql, id, prev\.at\)\) \?\? prev\.at \+ prev\.ms\)/);
  const cut = readFileSync(new URL("../components/keyline/LoopScreen.tsx", import.meta.url), "utf8");
  assert.match(cut, /prefers-reduced-motion: reduce/);
  assert.match(cut, /data-testid="loop-skip"/);
});
