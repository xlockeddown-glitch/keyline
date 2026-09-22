#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const root = new URL("..", import.meta.url).pathname;
function patchCities() {
  const p = join(root, "src/game/banks/cities.ts");
  let t = readFileSync(p, "utf8");
  if (!t.includes("cities_weekly")) {
    t = t.replace(
      'import type { CityId, TriviaCat, TriviaQ } from "../types";\n',
      'import type { CityId, TriviaCat, TriviaQ } from "../types";\nimport { CITY_WEEKLY } from "./cities_weekly";\n',
    );
    const merge = `
function mergeWeekly(
  base: Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>,
  weekly: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>>,
) {
  for (const [cityId, cats] of Object.entries(weekly)) {
    if (!cats) continue;
    const city = (base[cityId as CityId] ??= {});
    for (const [cat, list] of Object.entries(cats)) {
      if (!list?.length) continue;
      const key = cat as TriviaCat;
      city[key] = [...(city[key] ?? []), ...list];
    }
  }
  return base;
}

mergeWeekly(CITY_EXTRA, CITY_WEEKLY);
`;
    t = t.replace("stampCityRecord(CITY_EXTRA);", merge + "\nstampCityRecord(CITY_EXTRA);");
  }
  t = t.replace(
    "riverfront tower cluster (GM's headquarters among tenants)",
    "riverfront tower cluster long tied to GM (HQ moved to Hudson's in 2026)",
  );
  writeFileSync(p, t);
}
function patchTrivia() {
  const p = join(root, "src/game/trivia.ts");
  let t = readFileSync(p, "utf8");
  if (!t.includes("weekly_20260922")) {
    t = t.replace(
      'import { NATURE_LIFE } from "@/game/banks/nature_life";\n',
      'import { NATURE_LIFE } from "@/game/banks/nature_life";\nimport { WEEKLY_NATURE, WEEKLY_HISTORY, WEEKLY_SCIENCE, WEEKLY_POLITICAL } from "@/game/banks/weekly_20260922";\n',
    );
    t = t.replace(
      "science: mergeCat(mergeCat(SCIENCE_BANK, SCIENCE_MORE), SCIENCE_LIFE),",
      "science: mergeCat(mergeCat(mergeCat(SCIENCE_BANK, SCIENCE_MORE), SCIENCE_LIFE), WEEKLY_SCIENCE),",
    );
    t = t.replace(
      "history: mergeCat(mergeCat(HISTORY_BANK, HISTORY_MORE), HISTORY_LIFE),",
      "history: mergeCat(mergeCat(mergeCat(HISTORY_BANK, HISTORY_MORE), HISTORY_LIFE), WEEKLY_HISTORY),",
    );
    t = t.replace(
      "nature: mergeCat(mergeCat(NATURE_BANK, NATURE_MORE), NATURE_LIFE),",
      "nature: mergeCat(mergeCat(mergeCat(NATURE_BANK, NATURE_MORE), NATURE_LIFE), WEEKLY_NATURE),",
    );
    t = t.replace(
      "political: mergeCat(CORE_GENERAL.political ?? [], GENERAL_BANK.political ?? []),",
      "political: mergeCat(mergeCat(CORE_GENERAL.political ?? [], GENERAL_BANK.political ?? []), WEEKLY_POLITICAL),",
    );
  }
  writeFileSync(p, t);
}
patchCities();
patchTrivia();
console.log("weekly wire applied");
