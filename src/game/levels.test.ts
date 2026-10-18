import test from "node:test";
import assert from "node:assert/strict";
import { BONUS_TITLES, CAT_LADDERS, DRAFT_LADDERS, bestRun, colorsAt, levelMatch, levelOf, needFor, rewardFor, titleName, titleRows, xpOf } from "./levels.ts";
const ALL_CATS = ["sports", "local", "political", "food", "arts", "math", "science", "history", "nature", "games", "celebrity"] as const;

test("0.0.98 curve: fast early, slower later, monotonic", () => {
  assert.equal(needFor(1), 100);
  for (let l = 1; l < 99; l++) assert.ok(needFor(l + 1) >= needFor(l));
  assert.ok(needFor(20) > 5 * needFor(1));
  assert.deepEqual(levelOf(0), { level: 1, into: 0, need: 100, xp: 0 });
  assert.equal(levelOf(100).level, 2);
  assert.equal(levelOf(99).level, 1);
  assert.equal(levelOf(1e12).level, 100);
});

test("XP: higher tiers pay more; walking, goals and rides count", () => {
  const w = xpOf({ correctByTier: { white: 1 }, meters: 0, goals: 0, rides: 0 });
  const v = xpOf({ correctByTier: { violet: 1 }, meters: 0, goals: 0, rides: 0 });
  assert.ok(v > w * 10);
  assert.equal(xpOf({ correctByTier: {}, meters: 5000, goals: 2, rides: 1 }), 100 + 80 + 30);
});

test("rewards never give permanent power: matches, colours, gift and 15-min boost only; tier rises with level", () => {
  const order = ["white", "blue", "green", "amber", "red", "violet"];
  let last = 0;
  for (let l = 2; l <= 100; l++) {
    const r = rewardFor(l);
    assert.deepEqual(Object.keys(r).filter((k) => !["level", "match", "nameColor", "gift", "boost"].includes(k)), []);
    const rank = order.indexOf(levelMatch(l).tier);
    if (levelMatch(l).tier !== "violet") {
      assert.ok(rank >= last, `tier fell at ${l}`);
      last = rank;
    }
  }
  assert.equal(rewardFor(5).nameColor, "amber");
  assert.equal(rewardFor(4).boost, true);
  assert.equal(rewardFor(3).gift, true);
  assert.deepEqual(colorsAt(12), ["amber", "teal"]);
});

test("titles: a ladder for every trivia category, 250/1000/2000; drafts flagged; bonus titles", () => {
  for (const c of ALL_CATS) assert.equal(CAT_LADDERS[c].length, 3, c);
  assert.deepEqual([...DRAFT_LADDERS].sort(), ["arts", "food", "nature", "political", "sports"]);
  const rows = titleRows({ byCat: { science: 1000 }, marketLamps: 0, bestStreak: 25, perfects: 0, violet: 0, cityCorrect: { austin: 200 } }, ["austin", "nyc"]);
  const sci = rows.filter((r) => r.group === "science");
  assert.deepEqual(sci.map((r) => r.earned), [true, true, false]);
  assert.equal(rows.find((r) => r.id === "hot-streak")!.earned, true);
  assert.equal(rows.find((r) => r.id === "globetrotter")!.have, 0, "weakest city counts");
  assert.equal(rows.length, ALL_CATS.length * 3 + BONUS_TITLES.length);
  assert.equal(titleName("cat:science:2"), "Big Brain");
  assert.equal(titleName("violet-hunter"), "Violet Hunter");
  assert.equal(titleName("nope"), null);
  assert.equal(bestRun([true, true, false, true, true, true]), 3);
});
