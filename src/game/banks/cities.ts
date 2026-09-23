import { stampCityRecord } from "../rarity";
import type { CityId, TriviaCat, TriviaQ } from "../types";
import { CITY_WEEKLY } from "./cities_weekly";
import { CITY_EXTRA_PART_A } from "./cities_part_a";
import { CITY_EXTRA_PART_B } from "./cities_part_b";
import { CITY_EXTRA_PART_C } from "./cities_part_c";

function mergeParts(
  ...parts: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>>[]
): Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>> {
  const out = {} as Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>;
  for (const part of parts) {
    for (const city of Object.keys(part) as CityId[]) {
      const src = part[city];
      if (!src) continue;
      out[city] ??= {};
      for (const cat of Object.keys(src) as TriviaCat[]) {
        const add = src[cat];
        if (!add?.length) continue;
        out[city][cat] = [...(out[city][cat] ?? []), ...add];
      }
    }
  }
  return out;
}

export const CITY_EXTRA = mergeParts(CITY_EXTRA_PART_A, CITY_EXTRA_PART_B, CITY_EXTRA_PART_C);


function mergeWeekly(
  extra: Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>,
  weekly: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>>,
): void {
  for (const city of Object.keys(weekly) as CityId[]) {
    const weeklyCity = weekly[city];
    if (!weeklyCity) continue;
    extra[city] ??= {};
    for (const cat of Object.keys(weeklyCity) as TriviaCat[]) {
      const add = weeklyCity[cat];
      if (!add?.length) continue;
      const existing = extra[city][cat] ?? [];
      const seen = new Set(existing.map((x) => x.q));
      extra[city][cat] = [...existing, ...add.filter((x) => !seen.has(x.q))];
    }
  }
}

mergeWeekly(CITY_EXTRA, CITY_WEEKLY);
stampCityRecord(CITY_EXTRA);
