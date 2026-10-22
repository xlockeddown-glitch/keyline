import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { triviaCardCount } from "./trivia-count.mjs";
import { loadCatalog } from "./trivia-balance.mjs";
import { triviaCountLabel } from "../src/game/triviaCount.ts";

test("title tracker count equals the trivia bank length", () => {
  const n = triviaCardCount();
  assert.equal(n, loadCatalog().length);
  assert.ok(n > 1000);
});

test("vite bakes the bank count into __TRIVIA_COUNT__", () => {
  const cfg = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
  assert.match(cfg, /__TRIVIA_COUNT__:\s*JSON\.stringify\(triviaCardCount\(\)\)/);
});

test("label uses commas", () => {
  assert.equal(triviaCountLabel(10793), "10,793 trivia cards");
  assert.equal(triviaCountLabel(1), "1 trivia card");
});
