// 0.0.94 ride boards (the leaderboard rows), kept after the train and ride games went (0.1.95, 0.1.121).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ownLine, rankLanterns } from "./standings.ts";

test("ride boards: top 5 lanterns, and your own line only when you're off the top 5", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({ userId: `u${i}`, name: `P${i}`, correct: 100 - i * 10, updatedAt: i }));
  const top = rankLanterns(rows);
  assert.equal(top.length, 5);
  assert.deepEqual(top.map((r) => r.value), [100, 90, 80, 70, 60]);
  assert.equal(ownLine(top, "u1", { value: 90, rank: 2 }), null, "already on the board");
  assert.deepEqual(ownLine(top, "u7", { value: 30, rank: 8 }), { rank: 8, value: 30 });
  assert.equal(ownLine(top, null, { value: 30, rank: 8 }), null);
  assert.equal(ownLine(top, "u9", { value: 0, rank: null }), null);
});
