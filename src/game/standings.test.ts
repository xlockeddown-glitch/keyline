import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACCURACY_MIN,
  SPEED_MIN,
  emptyStandingBoard,
  formatAvg,
  formatRate,
  mineFromBoard,
  publicStandingName,
  rankAccuracy,
  rankCards,
  rankKind,
  rankSpeed,
  standingValue,
  type AttemptAgg,
} from "./standings.ts";
import { standingName } from "./standingName.ts";

function walker(partial: Partial<AttemptAgg> & Pick<AttemptAgg, "userId" | "name">): AttemptAgg {
  return {
    attempts: 0,
    correct: 0,
    latencySum: 0,
    ...partial,
  };
}

test("rankCards orders by correct desc, then attempts, then user id", () => {
  const ranked = rankCards([
    walker({ userId: "b", name: "Bea", correct: 10, attempts: 12 }),
    walker({ userId: "a", name: "Ada", correct: 12, attempts: 20 }),
    walker({ userId: "c", name: "Cy", correct: 10, attempts: 40 }),
    walker({ userId: "z", name: "Zero", correct: 0, attempts: 8 }),
  ]);
  assert.equal(ranked.length, 3);
  assert.deepEqual(
    ranked.map((r) => r.userId),
    ["a", "c", "b"],
  );
  assert.equal(ranked[0]!.rank, 1);
  assert.equal(ranked[0]!.correct, 12);
  assert.equal(ranked[2]!.rank, 3);
});

test("rankSpeed orders by lowest average time; SPEED_MIN attempts required", () => {
  const ranked = rankSpeed([
    walker({ userId: "slow", name: "Sam Slow", attempts: 20, correct: 10, latencySum: 20 * 4000 }),
    walker({ userId: "fast", name: "Fay Fast", attempts: 20, correct: 8, latencySum: 20 * 900 }),
    walker({ userId: "thin", name: "Tiny", attempts: SPEED_MIN - 1, correct: 9, latencySum: 9 * 100 }),
    walker({ userId: "also", name: "Ann Also", attempts: SPEED_MIN, correct: 5, latencySum: SPEED_MIN * 900 }),
  ]);
  assert.equal(ranked.length, 3);
  assert.equal(ranked[0]!.userId, "fast");
  assert.equal(ranked[1]!.userId, "also");
  assert.equal(ranked[2]!.userId, "slow");
  assert.ok(!ranked.some((r) => r.userId === "thin"));
  assert.equal(ranked[0]!.avgMs, 900);
});

test("rankAccuracy requires 100 attempts and ranks by share correct", () => {
  assert.equal(ACCURACY_MIN, 100);
  const ranked = rankAccuracy([
    walker({ userId: "hot", name: "Holly Hot", attempts: 100, correct: 90, latencySum: 100_000 }),
    walker({ userId: "mid", name: "Mel Mid", attempts: 200, correct: 160, latencySum: 200_000 }),
    walker({ userId: "low", name: "Lou Low", attempts: 100, correct: 40, latencySum: 80_000 }),
    walker({ userId: "shy", name: "Sid Shy", attempts: 99, correct: 99, latencySum: 10_000 }),
  ]);
  assert.equal(ranked.length, 3);
  assert.deepEqual(
    ranked.map((r) => r.userId),
    ["hot", "mid", "low"],
  );
  assert.ok(!ranked.some((r) => r.userId === "shy"));
  assert.equal(ranked[0]!.rate, 0.9);
  assert.equal(ranked[1]!.rate, 0.8);
  assert.equal(ranked[2]!.attempts, 100);
});

test("accuracy tie breaks toward more attempts", () => {
  const ranked = rankAccuracy([
    walker({ userId: "short", name: "Short", attempts: 100, correct: 80, latencySum: 1 }),
    walker({ userId: "long", name: "Long", attempts: 200, correct: 160, latencySum: 1 }),
  ]);
  assert.equal(ranked[0]!.userId, "long");
  assert.equal(ranked[1]!.userId, "short");
});

test("rankKind dispatches to the matching board", () => {
  const rows = [
    walker({ userId: "a", name: "Ada Able", attempts: 120, correct: 60, latencySum: 120 * 2000 }),
    walker({ userId: "b", name: "Bea Best", attempts: 120, correct: 108, latencySum: 120 * 5000 }),
  ];
  assert.equal(rankKind("cards", rows)[0]!.userId, "b");
  assert.equal(rankKind("speed", rows)[0]!.userId, "a");
  assert.equal(rankKind("accuracy", rows)[0]!.userId, "b");
});

test("standings names are First + last initial only", () => {
  const ranked = rankCards([
    walker({ userId: "1", name: "Ryan Gray", correct: 4, attempts: 4 }),
    walker({ userId: "2", name: "Madonna", correct: 3, attempts: 3 }),
    walker({ userId: "3", name: "", correct: 2, attempts: 2 }),
  ]);
  assert.equal(ranked[0]!.name, "Ryan G.");
  assert.equal(ranked[1]!.name, "Madonna");
  assert.equal(ranked[2]!.name, "Walker");
  assert.equal(publicStandingName("mary ann smith"), "mary S.");
  assert.equal(standingName("Ryan Gray"), "Ryan G.");
  assert.equal(standingName("Jean-Luc Picard"), "Jean-Luc P.");
});

test("mineFromBoard and display helpers", () => {
  const board = emptyStandingBoard("accuracy", "all", null);
  board.byTier.white = rankAccuracy([
    walker({ userId: "me", name: "Ryan Gray", attempts: 100, correct: 80, latencySum: 100 * 1500 }),
  ]);
  const mine = mineFromBoard(board, "me", "white");
  assert.ok(mine);
  assert.equal(mine!.name, "Ryan G.");
  assert.equal(standingValue("accuracy", mine!), "80%");
  assert.equal(standingValue("speed", mine!), "1.50 s");
  assert.equal(standingValue("cards", mine!), "80");
  assert.equal(formatRate(0.875), "88%");
  assert.equal(formatAvg(null), "\u2014");
  assert.equal(mineFromBoard(board, "nope", "white"), null);
});
