import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CHARM_TOPICS_PER_DAY,
  PERFECT_COINS,
  PERFECT_MS,
  STREAK_SPARK_N,
  applyTriviaBoosts,
  creditWhite,
  utcDay,
} from "./boosts.ts";
import { WHITE_POCKET } from "./ticket.ts";
import type { TriviaCat } from "./types.ts";

const empty = {
  charmDay: "2026-09-21",
  charmTopics: [] as TriviaCat[],
  now: new Date("2026-09-21T15:00:00Z"),
};

function hit(partial: Partial<Parameters<typeof applyTriviaBoosts>[0]> & { streakAfter: number; correct?: boolean; elapsedMs?: number }) {
  return applyTriviaBoosts({
    correct: partial.correct ?? true,
    elapsedMs: partial.elapsedMs ?? 4000,
    topic: partial.topic ?? null,
    streakAfter: partial.streakAfter,
    charmDay: partial.charmDay ?? empty.charmDay,
    charmTopics: partial.charmTopics ?? empty.charmTopics,
    now: partial.now ?? empty.now,
  });
}

test("utcDay is the UTC calendar date", () => {
  assert.equal(utcDay(new Date("2026-09-22T00:00:00Z")), "2026-09-22");
  assert.equal(utcDay(new Date("2026-09-21T23:59:59.999Z")), "2026-09-21");
});

test("Streak spark: 3 correct in a row pays +1 white", () => {
  assert.equal(STREAK_SPARK_N, 3);
  assert.equal(hit({ streakAfter: 1 }).white, 0);
  assert.equal(hit({ streakAfter: 2 }).white, 0);
  const third = hit({ streakAfter: 3 });
  assert.equal(third.white, 1);
  assert.ok(third.labels.includes("Streak spark"));
  assert.equal(hit({ streakAfter: 4 }).white, 0);
  assert.equal(hit({ streakAfter: 6 }).white, 1);
});

test("Streak spark resets on a miss — two after a miss do not pay", () => {
  const miss = hit({ correct: false, streakAfter: 0, elapsedMs: 800 });
  assert.equal(miss.white, 0);
  assert.equal(miss.coins, 0);
  assert.deepEqual(miss.labels, []);
  assert.equal(hit({ streakAfter: 1 }).white, 0);
  assert.equal(hit({ streakAfter: 2 }).white, 0);
});

test("Perfect timing: correct under 3.0s pays +5 coins; 3.0s and slower do not", () => {
  assert.equal(PERFECT_MS, 3000);
  assert.equal(PERFECT_COINS, 5);
  const fast = hit({ streakAfter: 1, elapsedMs: 2999 });
  assert.equal(fast.coins, 5);
  assert.ok(fast.labels.includes("Perfect timing"));
  assert.equal(hit({ streakAfter: 1, elapsedMs: 0 }).coins, 5);
  assert.equal(hit({ streakAfter: 1, elapsedMs: 3000 }).coins, 0);
  assert.equal(hit({ streakAfter: 1, elapsedMs: 3001 }).coins, 0);
});

test("a miss never pays Perfect timing", () => {
  const miss = hit({ correct: false, streakAfter: 0, elapsedMs: 400 });
  assert.equal(miss.coins, 0);
  assert.ok(!miss.labels.includes("Perfect timing"));
});

test("Category charm: first correct of a topic each UTC day pays +1 white, max 3 topics", () => {
  assert.equal(CHARM_TOPICS_PER_DAY, 3);
  const local = hit({ streakAfter: 1, topic: "local" });
  assert.equal(local.white, 1);
  assert.ok(local.labels.includes("Category charm"));
  assert.deepEqual(local.charmTopics, ["local"]);

  const localAgain = hit({ streakAfter: 1, topic: "local", charmTopics: ["local"] });
  assert.equal(localAgain.white, 0);
  assert.deepEqual(localAgain.charmTopics, ["local"]);

  const sports = hit({ streakAfter: 1, topic: "sports", charmTopics: ["local"] });
  assert.equal(sports.white, 1);
  assert.deepEqual(sports.charmTopics, ["local", "sports"]);

  const food = hit({ streakAfter: 1, topic: "food", charmTopics: ["local", "sports"] });
  assert.equal(food.white, 1);
  assert.deepEqual(food.charmTopics, ["local", "sports", "food"]);

  const arts = hit({ streakAfter: 1, topic: "arts", charmTopics: ["local", "sports", "food"] });
  assert.equal(arts.white, 0);
  assert.deepEqual(arts.charmTopics, ["local", "sports", "food"]);
});

test("Category charm rolls over at the UTC day boundary", () => {
  const late = new Date("2026-09-21T23:59:00Z");
  const first = hit({ streakAfter: 1, topic: "history", now: late, charmDay: "2026-09-21" });
  assert.deepEqual(first.charmTopics, ["history"]);
  assert.equal(first.charmDay, "2026-09-21");

  const next = hit({
    streakAfter: 1,
    topic: "history",
    charmDay: first.charmDay,
    charmTopics: first.charmTopics,
    now: new Date("2026-09-22T00:00:30Z"),
  });
  assert.equal(next.charmDay, "2026-09-22");
  assert.equal(next.white, 1);
  assert.deepEqual(next.charmTopics, ["history"]);
});

test("a miss after midnight keeps yesterday's topics from leaking into today", () => {
  const miss = hit({
    correct: false,
    streakAfter: 0,
    charmDay: "2026-09-21",
    charmTopics: ["local", "sports", "food"],
    now: new Date("2026-09-22T00:05:00Z"),
  });
  assert.equal(miss.charmDay, "2026-09-22");
  assert.deepEqual(miss.charmTopics, []);
});

test("third streak plus a new topic plus a fast answer stacks", () => {
  const stacked = hit({ streakAfter: 3, elapsedMs: 1200, topic: "science" });
  assert.equal(stacked.white, 2);
  assert.equal(stacked.coins, 5);
  assert.deepEqual(stacked.labels, ["Streak spark", "Perfect timing", "Category charm"]);
});

test("creditWhite respects the white pocket", () => {
  const keys = { white: 3, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const one = creditWhite(keys, 1);
  assert.equal(one.added, 1);
  assert.equal(one.keys.white, 4);
  const full = creditWhite(one.keys, 1);
  assert.equal(full.added, 0);
  assert.equal(full.keys.white, WHITE_POCKET);
  const two = creditWhite(keys, 2);
  assert.equal(two.added, 1);
  assert.equal(two.keys.white, WHITE_POCKET);
});

test("no topic means no Category charm", () => {
  const none = hit({ streakAfter: 1, topic: null });
  assert.equal(none.white, 0);
  assert.deepEqual(none.charmTopics, []);
});
