import { CITY_LIST, KIND_LABEL, TIER_LABEL } from "./data";
import type { CityId, PoiKind, Tier } from "./types";

export type SurveyGoal = {
  id: string;
  kind: "walk" | "visit" | "kind" | "ward";
  need: number;
  reward: Tier;
  label: string;
  blurb: string;
  poiKind?: PoiKind;
  cityId?: CityId;
};

const WALK: SurveyGoal[] = [
  { id: "walk-4", kind: "walk", need: 4_000, reward: "blue", label: "Warm legs", blurb: "Walk 4 km on the street." },
  { id: "walk-12", kind: "walk", need: 12_000, reward: "green", label: "Long circuit", blurb: "Walk 12 km." },
  { id: "walk-30", kind: "walk", need: 30_000, reward: "amber", label: "Across the ward", blurb: "Walk 30 km." },
  { id: "walk-70", kind: "walk", need: 70_000, reward: "red", label: "Cartographer", blurb: "Walk 70 km." },
  { id: "walk-150", kind: "walk", need: 150_000, reward: "violet", label: "The long map", blurb: "Walk 150 km." },
];

const VISIT: SurveyGoal[] = [
  { id: "visit-4", kind: "visit", need: 4, reward: "blue", label: "Four stamps", blurb: "Walk up to 4 different marks." },
  { id: "visit-10", kind: "visit", need: 10, reward: "green", label: "Ten stamps", blurb: "Stamp 10 marks in the atlas." },
  { id: "visit-18", kind: "visit", need: 18, reward: "amber", label: "Eighteen stamps", blurb: "Stamp 18 marks." },
  { id: "visit-32", kind: "visit", need: 32, reward: "red", label: "City reader", blurb: "Stamp 32 marks." },
  { id: "visit-55", kind: "visit", need: 55, reward: "violet", label: "Full plate", blurb: "Stamp 55 marks across the atlas." },
];

const KIND: SurveyGoal[] = [
  { id: "kind-park-6", kind: "kind", poiKind: "park", need: 6, reward: "green", label: "Park circuit", blurb: "Visit 6 parks." },
  { id: "kind-civic-4", kind: "kind", poiKind: "civic", need: 4, reward: "amber", label: "Civic tour", blurb: "Visit 4 civic marks." },
  { id: "kind-museum-4", kind: "kind", poiKind: "museum", need: 4, reward: "green", label: "Gallery walk", blurb: "Visit 4 museums." },
  { id: "kind-food-5", kind: "kind", poiKind: "food", need: 5, reward: "blue", label: "Table tour", blurb: "Visit 5 food marks." },
  { id: "kind-theatre-3", kind: "kind", poiKind: "theatre", need: 3, reward: "green", label: "Marquee night", blurb: "Visit 3 theatres." },
  { id: "kind-stadium-3", kind: "kind", poiKind: "stadium", need: 3, reward: "amber", label: "Arena run", blurb: "Visit 3 stadiums." },
  { id: "kind-campus-3", kind: "kind", poiKind: "campus", need: 3, reward: "green", label: "Quad walk", blurb: "Visit 3 campus marks." },
  { id: "kind-water-3", kind: "kind", poiKind: "water", need: 3, reward: "blue", label: "Waterline", blurb: "Visit 3 water marks." },
];

const WARD: SurveyGoal[] = CITY_LIST.flatMap((c) => [
  {
    id: `ward-${c.id}-8`,
    kind: "ward" as const,
    cityId: c.id,
    need: 8,
    reward: "green" as const,
    label: `${c.name} survey`,
    blurb: `Stamp 8 marks in ${c.name}.`,
  },
  {
    id: `ward-${c.id}-all`,
    kind: "ward" as const,
    cityId: c.id,
    need: c.pois.length,
    reward: "amber" as const,
    label: `${c.name} atlas`,
    blurb: `Stamp every mark in ${c.name}.`,
  },
]);

export const SURVEY_GOALS: SurveyGoal[] = [...WALK, ...VISIT, ...KIND, ...WARD];

const POI_KIND: Record<string, PoiKind> = {};
const POI_CITY: Record<string, CityId> = {};
const POI_NAME: Record<string, string> = {};
for (const c of CITY_LIST) {
  for (const p of c.pois) {
    POI_KIND[p.id] = p.kind;
    POI_CITY[p.id] = c.id;
    POI_NAME[p.id] = p.name;
  }
}

export function poiName(id: string) {
  return POI_NAME[id] ?? "Mark";
}

export type SurveySnap = {
  atlas: Record<string, true>;
  distanceM: number;
  survey: Record<string, true>;
  keys: Record<Tier, number>;
};

export function surveyHave(g: SurveyGoal, atlas: Record<string, true>, distanceM: number) {
  if (g.kind === "walk") return distanceM;
  const ids = Object.keys(atlas);
  if (g.kind === "visit") return ids.length;
  if (g.kind === "kind" && g.poiKind) return ids.filter((id) => POI_KIND[id] === g.poiKind).length;
  if (g.kind === "ward" && g.cityId) return ids.filter((id) => POI_CITY[id] === g.cityId).length;
  return 0;
}

export function takeSurvey(s: SurveySnap): { keys: Record<Tier, number>; survey: Record<string, true>; message: string } | null {
  const survey = { ...s.survey };
  const keys = { ...s.keys };
  const issued: SurveyGoal[] = [];
  for (const g of SURVEY_GOALS) {
    if (survey[g.id]) continue;
    if (surveyHave(g, s.atlas, s.distanceM) < g.need) continue;
    survey[g.id] = true;
    keys[g.reward] += 1;
    issued.push(g);
  }
  if (!issued.length) return null;
  const rank: Record<Tier, number> = { white: 0, blue: 1, green: 2, amber: 3, red: 4, violet: 5 };
  issued.sort((a, b) => rank[b.reward] - rank[a.reward]);
  const top = issued[0]!;
  const extra = issued.length > 1 ? ` · +${issued.length - 1} more` : "";
  return {
    keys,
    survey,
    message: `${top.label} · ${TIER_LABEL[top.reward]} match${extra}`,
  };
}

export function nextSurvey(s: SurveySnap & { cityId: CityId }) {
  const open = SURVEY_GOALS.filter((g) => {
    if (s.survey[g.id]) return false;
    if (g.kind === "ward" && g.cityId !== s.cityId) return false;
    return true;
  });
  if (!open.length) return null;
  let best = open[0]!;
  let bestRatio = -1;
  for (const g of open) {
    const have = surveyHave(g, s.atlas, s.distanceM);
    const ratio = have / g.need;
    if (ratio > bestRatio) {
      best = g;
      bestRatio = ratio;
    }
  }
  const have = surveyHave(best, s.atlas, s.distanceM);
  const kindBit = best.poiKind ? KIND_LABEL[best.poiKind].toLowerCase() : "stamps";
  const progress =
    best.kind === "walk"
      ? `${(have / 1000).toFixed(1)} / ${(best.need / 1000).toFixed(0)} km`
      : `${Math.min(have, best.need)} / ${best.need} ${best.kind === "kind" ? kindBit : "stamps"}`;
  return { goal: best, have, line: `${progress} · ${TIER_LABEL[best.reward]}` };
}
