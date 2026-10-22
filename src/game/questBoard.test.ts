// 0.1.22: quest banks, per-player fair sets, and progress from server events.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BANK, BANK_V2, BONUS, CHALLENGES, FAIR, FAIR_V2, isV2, SET_SIZE, fairSets, longestRun, progressOf, questDef, questProgress, questSet, rewardLine, rewardValue, type QuestEvent } from "./questBoard.ts";
import { currentPeriod, dayKey, monthKey, previousPeriod, weekKey } from "./questPeriods.ts";
import type { CityId, Tier, TriviaCat } from "./types.ts";

const lamp = (at: number, tier: Tier, city: CityId = "austin", topic: TriviaCat | null = "science", market = false, district: string | null = null): QuestEvent => ({ k: "lamp", at, tier, city, topic, market, district });
const prog = (id: string, ev: QuestEvent[]) => progressOf(questDef(id)!, ev);
const KINDS = ["day", "week", "month"] as const;

test("bank sizes, rewards scaled to their siblings, no violet anywhere", () => {
  assert.equal(BANK.day.length, 11);
  assert.equal(BANK.week.length, 9);
  assert.equal(BANK.month.length, 7);
  for (const d of BANK.day) assert.ok(d.reward.coins >= 60 && d.reward.coins <= 150 && d.reward.matches.length === 1, d.id);
  for (const d of BANK.week) assert.ok(d.reward.coins >= 1_000 && d.reward.coins <= 2_000, d.id);
  for (const d of BANK.month) assert.ok(d.reward.coins >= 12_000 && d.reward.coins <= 20_000, d.id);
  for (const k of KINDS) for (const d of [...BANK[k], BONUS[k]]) assert.ok(!d.reward.matches.includes("violet"), d.id);
  assert.equal(rewardLine(BONUS.day.reward), "green match");
  assert.equal(rewardLine(BONUS.week.reward), "red match");
  assert.equal(rewardLine(BONUS.month.reward), "Lucky next month");
  assert.equal(rewardLine(questDef("w-streak")!.reward), "1,000 coin + blue match + green match");
});

test("a set is the same every time for the same player and period, and fixed for the period", () => {
  const t = Date.UTC(2026, 9, 21, 18);
  for (const k of KINDS) {
    const key = currentPeriod(k, t).key;
    assert.deepEqual(questSet(k, "acct-1", key, { house: true }).map((d) => d.id), questSet(k, "acct-1", key, { house: true }).map((d) => d.id));
    // Later in the same period: same key, so same set.
    assert.equal(currentPeriod(k, t + 3_600_000).key, key);
  }
});

test("different players get different sets; a new period redraws", () => {
  const t = Date.UTC(2026, 9, 21, 18);
  for (const k of KINDS) {
    const key = currentPeriod(k, t).key;
    const sigs = new Set<string>();
    for (let i = 0; i < 60; i++) sigs.add(questSet(k, `p${i}`, key, { house: true }).map((d) => d.id).join(","));
    assert.ok(sigs.size >= 8, `${k}: ${sigs.size}`);
    // Over many periods one player sees more than one set.
    const mine = new Set<string>();
    let p = currentPeriod(k, t);
    for (let i = 0; i < 12; i++) {
      mine.add(questSet(k, "p1", p.key, { house: true }).map((d) => d.id).join(","));
      p = previousPeriod(k, p.start + 1);
    }
    assert.ok(mine.size >= 3, `${k} across periods: ${mine.size}`);
  }
  assert.equal(dayKey(Date.UTC(2026, 9, 22, 4, 59)), "D2026-10-21"); // 11:59 PM CT
  assert.equal(dayKey(Date.UTC(2026, 9, 22, 5, 0)), "D2026-10-22"); // CT midnight
  assert.ok(weekKey(t).startsWith("W") && monthKey(t) === "M2026-10");
});

test("every set a player can draw is inside the fairness band, with or without a house", () => {
  for (const k of KINDS)
    for (const house of [true, false]) {
      const sets = fairSets(k, { house });
      assert.ok(sets.length >= 10, `${k} house=${house}: ${sets.length}`);
      for (const s of sets) {
        assert.equal(s.length, SET_SIZE[k]);
        assert.equal(new Set(s.map((d) => d.id)).size, s.length);
        const e = s.reduce((a, d) => a + d.effort, 0);
        const v = s.reduce((a, d) => a + rewardValue(d.reward), 0);
        assert.ok(e >= FAIR[k].effort[0] && e <= FAIR[k].effort[1], `${k} effort ${e}`);
        assert.ok(v >= FAIR[k].value[0] && v <= FAIR[k].value[1], `${k} value ${v}`);
        assert.ok(s.some((d) => d.effort >= 2), "never all easy");
        assert.ok(s.some((d) => d.effort <= 2), "never all hard");
      }
    }
});

test("no impossible picks: a player without a house never draws a house quest; no daily market quest", () => {
  for (const k of KINDS)
    for (let i = 0; i < 300; i++) {
      const key = currentPeriod(k, Date.UTC(2026, 0, 1) + i * 86_400_000).key;
      assert.ok(!questSet(k, `nohouse${i}`, key, { house: false }).some((d) => d.needs === "house"));
    }
  assert.ok(!BANK.day.some((d) => d.id.includes("night") || d.id.includes("market")));
  // With a house it can come up.
  let seen = false;
  for (let i = 0; i < 300 && !seen; i++) seen = questSet("day", `h${i}`, "D2026-10-21", { house: true }).some((d) => d.id === "d-house");
  assert.ok(seen);
});

test("daily progress for each daily quest", () => {
  let t = 0;
  const ev: QuestEvent[] = [];
  for (let i = 0; i < 7; i++) ev.push(lamp(++t, "white", "austin", "science", false, "downtown"));
  assert.equal(prog("d-right", ev).done, false);
  ev.push(lamp(++t, "blue", "austin", "history", false, "east"), lamp(++t, "blue", "austin", "music", false, "zilker"), lamp(++t, "blue"));
  assert.equal(prog("d-right", ev).done, true);
  assert.equal(prog("d-blue", ev).done, true);
  assert.equal(prog("d-topics", ev).done, true);
  assert.equal(prog("d-roam", ev).done, true);
  assert.equal(prog("d-green", ev).have, 0);
  assert.equal(prog("d-streak", ev).done, true);
  assert.equal(prog("d-amber", ev).done, false);
  ev.push(lamp(++t, "amber"));
  assert.equal(prog("d-amber", ev).done, true);
  assert.equal(prog("d-cache", [{ k: "cache", at: 1 }]).done, true);
  assert.equal(prog("d-house", [{ k: "hook", at: 1, day: "2026-10-21" }]).done, true);
  assert.equal(prog("d-ride", [{ k: "ride", at: 1, game: "lamplighter" }]).done, true);
  assert.equal(prog("d-street", [1, 2].map((at) => ({ k: "street" as const, at }))).done, false);
  assert.equal(prog("d-street", [1, 2, 3].map((at) => ({ k: "street" as const, at }))).done, true);
});

test("weekly progress, including the new weekly quests", () => {
  const ev: QuestEvent[] = [];
  let t = 0;
  for (let i = 0; i < 24; i++) ev.push(lamp(++t, "green"));
  ev.push(lamp(++t, "white"), lamp(++t, "blue"), lamp(++t, "amber"));
  assert.deepEqual([prog("w-lamps", ev).have, prog("w-lamps", ev).done], [25, true]);
  assert.equal(prog("w-ladder", ev).have, 4);
  ev.push(lamp(++t, "red"));
  assert.equal(prog("w-ladder", ev).done, true);
  const rides: QuestEvent[] = ["a", "a", "b"].map((game, i) => ({ k: "ride", at: i, game }));
  assert.equal(prog("w-out", rides).have, 2); // the same game twice counts once
  assert.equal(prog("w-cache", [1, 2, 3, 4].map((at) => ({ k: "cache" as const, at }))).done, true);
  assert.equal(prog("w-house", ["d1", "d1", "d2"].map((day, at) => ({ k: "hook" as const, at, day }))).have, 2); // two cities one day = one day
  assert.equal(prog("w-street", Array.from({ length: 12 }, (_, at) => ({ k: "street" as const, at }))).done, true);
  const roam = Array.from({ length: 10 }, (_, i) => lamp(i, "white", "austin", "science", false, `d${i % 9}`));
  assert.equal(prog("w-roam", roam).have, 9);
  assert.equal(prog("w-amber", [1, 2, 3, 4, 5].map((at) => lamp(at, at % 2 ? "amber" : "red"))).done, true);
});

test("a miss breaks a streak; sparks are not events so they neither count nor break it", () => {
  const ev: QuestEvent[] = [];
  for (let i = 0; i < 10; i++) ev.push(lamp(i, "white"));
  ev.push({ k: "miss", at: 10 });
  for (let i = 11; i < 25; i++) ev.push(lamp(i, "white"));
  assert.equal(longestRun(ev), 14);
  assert.equal(prog("w-streak", ev).done, false);
  assert.equal(prog("m-streak", ev).have, 14);
});

test("monthly progress, including the new monthly quests, then the bonus over the player's set", () => {
  const ev: QuestEvent[] = [];
  let t = 0;
  const cats: TriviaCat[] = ["science", "history", "books", "music"];
  for (const c of cats) for (let i = 0; i < 12; i++) ev.push(lamp(++t, "blue", "austin", c));
  assert.equal(prog("m-shelf", ev).have, 48);
  assert.equal(prog("m-shelf", ev).done, false);
  for (let i = 0; i < 12; i++) ev.push(lamp(++t, "blue", (["nyc", "la", "boston"] as CityId[])[i % 3], "sports", true));
  assert.equal(prog("m-shelf", ev).done, true);
  assert.equal(prog("m-tour", ev).done, true);
  assert.equal(prog("m-night", ev).done, true);
  assert.equal(prog("m-hop", ev).done, true);
  assert.equal(prog("m-streak", ev).done, true);
  const narrow: QuestEvent[] = [];
  for (let i = 0; i < 60; i++) narrow.push(lamp(i, "blue", "austin", cats[i % 3]!));
  assert.equal(prog("m-shelf", narrow).done, false);
  assert.equal(prog("m-red", Array.from({ length: 10 }, (_, i) => lamp(i, i % 2 ? "red" : "violet"))).done, true);
  const days = Array.from({ length: 12 }, (_, i) => lamp(Date.UTC(2026, 9, 1, 18) + i * 86_400_000, "white"));
  assert.equal(prog("m-days", days).done, true);
  assert.equal(prog("m-days", days.map((e) => ({ ...e, at: Date.UTC(2026, 9, 1, 18) }))).have, 1);
  const set = ["m-tour", "m-night", "m-shelf", "m-streak"].map((id) => questDef(id)!);
  const rows = questProgress("month", set, ev);
  assert.deepEqual(rows.map((r) => r.id), ["m-tour", "m-night", "m-shelf", "m-streak", "m-bonus"]);
  assert.equal(rows.at(-1)!.done, true);
  assert.equal(questProgress("month", set, narrow).at(-1)!.done, false);
});

test("0.1.27 banks start next period: this week and October keep their sets, the next week and November get a Challenge", () => {
  assert.equal(isV2("week", "W2026-10-19"), false);
  assert.equal(isV2("week", "W2026-10-26"), true);
  assert.equal(isV2("month", "M2026-10"), false);
  assert.equal(isV2("month", "M2026-11"), true);
  assert.equal(isV2("day", "D2026-12-01"), false);
  for (let i = 0; i < 50; i++) {
    const old = questSet("week", `p${i}`, "W2026-10-19", { house: true });
    assert.ok(old.every((d) => BANK.week.includes(d)) && !old.some((d) => d.challenge));
    for (const [k, key] of [["week", "W2026-10-26"], ["month", "M2026-11"]] as const) {
      const set = questSet(k, `p${i}`, key, { house: i % 2 === 0 });
      assert.equal(set.length, SET_SIZE[k]);
      assert.equal(set.filter((d) => d.challenge).length, 1, `${k} ${i}`);
      assert.ok(set.at(-1)!.challenge);
      assert.ok(set.slice(0, -1).every((d) => BANK_V2[k].includes(d)));
    }
  }
  // Challenges vary between players too.
  const seen = new Set(Array.from({ length: 60 }, (_, i) => questSet("week", `p${i}`, "W2026-10-26", { house: true }).at(-1)!.id));
  assert.equal(seen.size, CHALLENGES.week.length);
});

test("0.1.27 regular slots stay inside their fairness band; challenges pay more and never violet", () => {
  for (const k of ["week", "month"] as const)
    for (const house of [true, false]) {
      const sets = fairSets(k, { house }, true);
      assert.ok(sets.length >= 20, `${k} ${house} ${sets.length}`);
      for (const set of sets) {
        assert.equal(set.length, SET_SIZE[k] - 1);
        const e = set.reduce((a, d) => a + d.effort, 0);
        const v = set.reduce((a, d) => a + rewardValue(d.reward), 0);
        assert.ok(e >= FAIR_V2[k].effort[0] && e <= FAIR_V2[k].effort[1]);
        assert.ok(v >= FAIR_V2[k].value[0] && v <= FAIR_V2[k].value[1]);
        if (!house) assert.ok(!set.some((d) => d.needs === "house"));
      }
      const top = Math.max(...BANK_V2[k].map((d) => rewardValue(d.reward)));
      for (const c of CHALLENGES[k]) {
        assert.ok(rewardValue(c.reward) > top, c.id);
        assert.ok(c.reward.matches.includes("red") && !c.reward.matches.includes("violet"));
      }
    }
  assert.equal(rewardLine(questDef("mc-run")!.reward), "40,000 coin + 2 red matches");
  // Higher targets on the busiest quests.
  assert.equal(questDef("w-lamps2")!.need, 50);
  assert.equal(questDef("w-street2")!.need, 25);
  assert.equal(questDef("m-shelf2")!.need, 120);
});

test("challenge and v2 counters: perfect answers, long runs, volume, the bigger shelf", () => {
  const p = (at: number, perfect: boolean): QuestEvent => ({ ...lamp(at, "white"), perfect } as QuestEvent);
  const ev = Array.from({ length: 30 }, (_, i) => p(i, i % 2 === 0));
  assert.equal(prog("wc-perfect", ev).have, 15);
  assert.equal(prog("wc-perfect", Array.from({ length: 30 }, (_, i) => p(i, true))).done, true);
  assert.equal(prog("wc-run", Array.from({ length: 40 }, (_, i) => lamp(i, "white"))).done, true);
  assert.equal(prog("wc-red", Array.from({ length: 6 }, (_, i) => lamp(i, "red"))).done, true);
  assert.equal(prog("mc-volume", Array.from({ length: 499 }, (_, i) => lamp(i, "white"))).done, false);
  assert.equal(prog("w-lamps2", Array.from({ length: 49 }, (_, i) => lamp(i, "green"))).done, false);
  const cats: TriviaCat[] = ["science", "history", "books", "music"];
  const shelf = Array.from({ length: 120 }, (_, i) => lamp(i, "blue", "austin", cats[i % 4]!));
  assert.equal(prog("m-shelf2", shelf).done, true);
  assert.equal(prog("m-shelf2", shelf.slice(0, 119)).done, false);
});
