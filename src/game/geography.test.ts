import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAT_LABEL, FAV_BONUS, FAV_BOTH, SCOUT_FAV, cotdOf } from "./carPerks.ts";

test("0.1.53: Geography is the 14th category and the Giraffe favors it", () => {
  const meta = readFileSync(new URL("./triviaMeta.ts", import.meta.url), "utf8");
  assert.equal(meta.match(/^\s+(\{ )?id: "/gm)?.length, 14);
  assert.match(meta, /id: "geography", label: "Geography", blurb: "Maps, capitals, rivers, flags\."/);
  assert.equal(CAT_LABEL.geography, "Geography");
  assert.equal(SCOUT_FAV.giraffe, "geography");
  assert.equal(FAV_BONUS, 0.15);
  assert.equal(FAV_BOTH, 0.25);
  const seen = new Set<string>();
  for (let d = 0; d < 400 && !seen.has("geography"); d++) seen.add(cotdOf(new Date(Date.UTC(2026, 0, 1) + d * 86_400_000).toISOString().slice(0, 10)));
  assert.ok(seen.has("geography"), "Geography can be the category of the day");
});
