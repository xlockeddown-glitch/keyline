// 0.1.22: quest progress from server events.
import assert from "node:assert/strict";
import { test } from "node:test";
import { QUESTS, longestRun, questProgress, rewardLine, type QuestEvent } from "./questBoard.ts";
import type { CityId, Tier, TriviaCat } from "./types.ts";

const lamp = (at: number, tier: Tier, city: CityId = "austin", topic: TriviaCat | null = "science", market = false): QuestEvent => ({ k: "lamp", at, tier, city, topic, market });
const row = (rows: ReturnType<typeof questProgress>, id: string) => rows.find((r) => r.id === id)!;

test("the quest list and rewards match the design doc", () => {
  assert.deepEqual(
    QUESTS.map((q) => [q.id, rewardLine(q.reward)]),
    [
      ["w-lamps", "2,000 coin + green match"],
      ["w-ladder", "1,500 coin + amber match"],
      ["w-streak", "1,000 coin + blue match + green match"],
      ["w-out", "1,200 coin + blue match"],
      ["w-bonus", "red match"],
      ["m-tour", "15,000 coin + red match"],
      ["m-night", "20,000 coin + amber match"],
      ["m-shelf", "12,000 coin + red match"],
      ["m-bonus", "Lucky next month"],
    ],
  );
});

test("weekly progress: green+ lamps, the colour ladder, a streak, ride games, then the bonus", () => {
  const ev: QuestEvent[] = [];
  let t = 0;
  for (let i = 0; i < 24; i++) ev.push(lamp(++t, "green"));
  ev.push(lamp(++t, "white"), lamp(++t, "blue"), lamp(++t, "amber"));
  let rows = questProgress("week", ev);
  assert.deepEqual([row(rows, "w-lamps").have, row(rows, "w-lamps").done], [25, true]);
  assert.equal(row(rows, "w-ladder").have, 4);
  assert.equal(row(rows, "w-streak").done, true);
  assert.equal(row(rows, "w-out").have, 0);
  assert.equal(row(rows, "w-bonus").have, 2);
  ev.push(lamp(++t, "red"), { k: "ride", at: ++t, game: "lamplighter" }, { k: "ride", at: ++t, game: "lamplighter" }, { k: "ride", at: ++t, game: "where-am-i" });
  rows = questProgress("week", ev);
  assert.equal(row(rows, "w-ladder").done, true);
  assert.equal(row(rows, "w-out").have, 2); // the same game twice counts once
  ev.push({ k: "ride", at: ++t, game: "match-sorter" });
  rows = questProgress("week", ev);
  assert.equal(row(rows, "w-bonus").done, true);
});

test("a miss breaks a streak; sparks are not events so they neither count nor break it", () => {
  const ev: QuestEvent[] = [];
  for (let i = 0; i < 10; i++) ev.push(lamp(i, "white"));
  ev.push({ k: "miss", at: 10 });
  for (let i = 11; i < 25; i++) ev.push(lamp(i, "white"));
  assert.equal(longestRun(ev), 14);
  assert.equal(row(questProgress("week", ev), "w-streak").done, false);
  assert.equal(row(questProgress("week", ev), "w-lamps").have, 0); // white lamps aren't green+
});

test("monthly progress: four cities, night markets, and the shelf needs 4 categories of 10+", () => {
  const ev: QuestEvent[] = [];
  let t = 0;
  const cats: TriviaCat[] = ["science", "history", "books", "music"];
  for (const c of cats) for (let i = 0; i < 12; i++) ev.push(lamp(++t, "blue", "austin", c));
  let rows = questProgress("month", ev);
  assert.equal(row(rows, "m-shelf").have, 48);
  assert.equal(row(rows, "m-shelf").done, false);
  for (let i = 0; i < 12; i++) ev.push(lamp(++t, "blue", (["nyc", "la", "boston"] as CityId[])[i % 3], "sports", true));
  rows = questProgress("month", ev);
  assert.equal(row(rows, "m-shelf").done, true);
  assert.equal(row(rows, "m-tour").done, true);
  assert.equal(row(rows, "m-night").done, true);
  assert.equal(row(rows, "m-bonus").done, true);
  // 60 lamps in only three categories is not enough.
  const narrow: QuestEvent[] = [];
  for (let i = 0; i < 60; i++) narrow.push(lamp(i, "blue", "austin", cats[i % 3]!));
  assert.equal(row(questProgress("month", narrow), "m-shelf").done, false);
});
