// 0.1.127 (Ryan): the Quest Board left the map; goals live in the Journal's Goals tab (collect works anywhere).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITY_LIST } from "./data.ts";
import { RETIRED_POIS, migratePoiIds } from "./retired.ts";
import { SURVEY_GOALS, surveyHave } from "./survey.ts";

const src = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

test("no city has a Quest Board; the errand notice boards stay", () => {
  for (const c of CITY_LIST) {
    assert.ok(!c.pois.some((p) => p.id === `board-${c.id}-quest` || p.name === "Quest Board"), c.id);
    assert.ok(c.pois.some((p) => p.kind === "board"), `${c.id} keeps its notice boards`);
  }
});

test("old saves: a stamped Quest Board still counts toward its city's surveys; 'All of' needs one place fewer", () => {
  for (const c of CITY_LIST) {
    const id = `board-${c.id}-quest`;
    const all0 = SURVEY_GOALS.find((g) => g.id === `ward-${c.id}-all`)!;
    // 0.1.128: Philadelphia arrived after the board left, so it never had one to retire.
    if (c.id === "philly") { assert.equal(RETIRED_POIS[id], undefined); assert.equal(all0.need, c.pois.length); continue; }
    assert.deepEqual(RETIRED_POIS[id], { cityId: c.id, kind: "board", name: "Quest Board" });
    const all = SURVEY_GOALS.find((g) => g.id === `ward-${c.id}-all`)!;
    assert.equal(all.need, c.pois.length);
    assert.equal(surveyHave(all, { [id]: true }, 0), 1, "an earned visit isn't taken back");
  }
  // A save carrying the board id (and the old questVisited flag) loads unchanged.
  const save = { atlas: { "board-chicago-quest": true as const }, questVisited: true, sparkLamps: ["board-chicago-quest"] };
  const out = migratePoiIds(save);
  assert.equal(out.atlas?.["board-chicago-quest"], true);
  assert.deepEqual(out.sparkLamps, []);
});

test("no pin, arrow, walk button or tutorial line points at the Quest Board", () => {
  const map = src("../components/keyline/GameMap.tsx");
  assert.doesNotMatch(map, /quest-arrow|isQuestBoard|questPinHtml|questWalk/);
  assert.doesNotMatch(src("../components/keyline/DailyGoals.tsx"), /goals-walk|walkToQuest/);
  assert.doesNotMatch(src("./store.ts"), /openQuest|walkToQuest|questVisited/);
  const tut = src("../components/keyline/Tutorial.tsx");
  assert.match(tut, /"Open the Journal to see today's goals\."/);
  assert.doesNotMatch(tut, /Quest Board/);
  // Collect still lives in the Journal's Goals tab.
  assert.match(src("../components/keyline/HqPanel.tsx"), /<DailyGoals act=\{false\} \/>/);
});
