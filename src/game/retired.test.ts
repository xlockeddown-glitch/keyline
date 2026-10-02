import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import { RETIRED_POIS, livePoiId, migratePoiIds } from "./retired.ts";
import { surveyHave, SURVEY_GOALS } from "./survey.ts";

test("retired marks are off the map and every replacement is a live place in the same city", () => {
  for (const [id, r] of Object.entries(RETIRED_POIS)) {
    for (const c of Object.values(CITIES)) assert.ok(!c.pois.some((p) => p.id === id), `${id} still on ${c.id}`);
    if (r.replacedBy) assert.ok(CITIES[r.cityId].pois.some((p) => p.id === r.replacedBy), `${id} → ${r.replacedBy}`);
  }
  assert.equal(livePoiId("sf-depot"), "sf-depot");
  assert.equal(livePoiId("cannon-pk"), "jones-pk-t");
  assert.equal(livePoiId("keefer-pk"), null);
  assert.equal(livePoiId("sosa-ave"), "sosa-carrillo");
  const tuc = migratePoiIds({ atlas: { "sosa-ave": true } as Record<string, true>, vaults: { "sosa-ave": { state: "cooling" } } });
  assert.equal(tuc.atlas!["sosa-carrillo"], true);
  assert.deepEqual(Object.keys(tuc.vaults!), ["sosa-carrillo"]);
});

test("an old save naming retired marks loads cleanly: progress moves or stays, nothing dangles", () => {
  const old = {
    atlas: { "cannon-pk": true, "keefer-pk": true, "sf-depot": true } as Record<string, true>,
    vaults: { "railroad-park-t": { state: "cooling", coolUntil: 9 }, "midtown-temple": { state: "cooling", coolUntil: 1 } },
    contract: { ids: ["veterans-pk-t", "railroad-park-t", "kyle-hotel"], done: ["railroad-park-t"] },
    sparkLamps: ["ave-a-depot", "railroad-park-t", "south-1st-green"],
  };
  const m = migratePoiIds(old);
  assert.equal(m.atlas!["jones-pk-t"], true, "visit moves to the replacement");
  assert.equal(m.atlas!["keefer-pk"], true, "removed visit kept so counts don't drop");
  assert.deepEqual(Object.keys(m.vaults!), ["santa-fe-plaza"]);
  assert.deepEqual(m.contract, { ids: ["santa-fe-plaza", "kyle-hotel"], done: ["santa-fe-plaza"] });
  assert.deepEqual(m.sparkLamps, ["santa-fe-plaza"]);
  for (const id of m.contract!.ids) assert.ok(CITIES.temple.pois.some((p) => p.id === id));
  // A contract made only of gone marks is cleared so a fresh one is seeded.
  assert.equal(migratePoiIds({ contract: { ids: ["keefer-pk"], done: [] } }).contract, null);
  // Survey counts never drop for a player who visited a retired park.
  const parks = SURVEY_GOALS.find((g) => g.kind === "kind" && g.poiKind === "park")!;
  const ward = SURVEY_GOALS.find((g) => g.kind === "ward" && g.cityId === "temple")!;
  assert.equal(surveyHave(parks, old.atlas, 0), 2, "retired parks still count before migration");
  assert.ok(surveyHave(parks, m.atlas!, 0) >= 2);
  assert.ok(surveyHave(ward, m.atlas!, 0) >= surveyHave(ward, old.atlas, 0));
  // Saves without these fields pass through.
  assert.deepEqual(migratePoiIds({}), {});
});
