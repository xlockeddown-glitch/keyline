import { cityHasWard, cityStaple, isNamedWard, type IngredientId } from "./ingredients.ts";
import type { CityId, Tier } from "./types.ts";

const CITY_IDS: CityId[] = [
  "austin",
  "temple",
  "nyc",
  "sf",
  "london",
  "chicago",
  "detroit",
  "tucson",
  "toronto",
  "la",
  "boston",
  "nola",
];

const CITY_NAME: Record<CityId, string> = {
  austin: "Austin",
  temple: "Temple",
  nyc: "New York",
  sf: "San Francisco",
  london: "London",
  chicago: "Chicago",
  detroit: "Detroit",
  tucson: "Tucson",
  toronto: "Toronto",
  la: "Los Angeles",
  boston: "Boston",
  nola: "New Orleans",
};

export type ClothId = "road-dust" | "red-book" | "night-glass" | `scarf-${CityId}`;

export type Errand = { kind: "row"; n: number } | { kind: "ladder"; seen: Array<"white" | "blue" | "green"> };

export type Circuit = { red: boolean; ward: boolean; printed: boolean; claimed: boolean };

export type LongId = "hundred" | "unbroken" | "walk" | "violet" | "redbook";

export type QuestLog = {
  errand: Errand;
  circuit: Partial<Record<CityId, Circuit>>;
  perfects: number;
  perfectRow: number;
  bestRow: number;
  reds: Partial<Record<CityId, true>>;
  sawViolet: boolean;
  claimed: Partial<Record<LongId, true>>;
  cloths: ClothId[];
  worn: ClothId | null;
  title: string | null;
  patterns: number;
};

const LADDER = ["white", "blue", "green"] as const;
const AREA_TIERS: Tier[] = ["amber", "red", "violet"];

export function freshQuests(cityId: CityId): QuestLog {
  return {
    errand: { kind: "row", n: 0 },
    circuit: { [cityId]: emptyCircuit() },
    perfects: 0,
    perfectRow: 0,
    bestRow: 0,
    reds: {},
    sawViolet: false,
    claimed: {},
    cloths: [],
    worn: null,
    title: null,
    patterns: 0,
  };
}

export function hydrateQuests(raw: Partial<QuestLog> | null | undefined, cityId: CityId): QuestLog {
  const base = freshQuests(cityId);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    errand: raw.errand ?? base.errand,
    circuit: raw.circuit ?? {},
    reds: raw.reds ?? {},
    claimed: raw.claimed ?? {},
    cloths: raw.cloths ?? [],
    worn: raw.worn ?? null,
    patterns: raw.patterns ?? 0,
    perfects: raw.perfects ?? 0,
    perfectRow: raw.perfectRow ?? 0,
    bestRow: raw.bestRow ?? 0,
  };
}

function emptyCircuit(): Circuit {
  return { red: false, ward: false, printed: false, claimed: false };
}

function circuit(log: QuestLog, cityId: CityId): Circuit {
  return log.circuit[cityId] ?? emptyCircuit();
}

export function errandDone(errand: Errand): boolean {
  if (errand.kind === "row") return errand.n >= 3;
  return LADDER.every((t) => errand.seen.includes(t));
}

export function errandLabel(errand: Errand): { title: string; sub: string } {
  if (errand.kind === "row") {
    return { title: "Three in a row", sub: `${Math.min(errand.n, 3)}/3 vaults, no miss. Pays one city ingredient.` };
  }
  const n = LADDER.filter((t) => errand.seen.includes(t)).length;
  return { title: "White, blue, green", sub: `${n}/3 colors in this city. Pays one city ingredient.` };
}

export function noteAnswer(log: QuestLog, correct: boolean, perfect: boolean): QuestLog {
  if (!correct) {
    const errand = log.errand.kind === "row" ? { kind: "row" as const, n: 0 } : log.errand;
    return { ...log, perfectRow: 0, errand };
  }
  const perfectRow = perfect ? log.perfectRow + 1 : 0;
  return {
    ...log,
    perfects: log.perfects + (perfect ? 1 : 0),
    perfectRow,
    bestRow: Math.max(log.bestRow, perfectRow),
  };
}

export function noteClear(log: QuestLog, hit: { cityId: CityId; poiId: string; tier: Tier }): QuestLog {
  let errand = log.errand;
  if (!errandDone(errand)) {
    if (errand.kind === "row") errand = { kind: "row", n: errand.n + 1 };
    else if (hit.tier === "white" || hit.tier === "blue" || hit.tier === "green") {
      errand = { kind: "ladder", seen: errand.seen.includes(hit.tier) ? errand.seen : [...errand.seen, hit.tier] };
    }
  }
  const cur = circuit(log, hit.cityId);
  const next: Circuit = { ...cur };
  if (hit.tier === "red") next.red = true;
  const wardHere = cityHasWard(hit.cityId);
  if (wardHere && isNamedWard(hit.poiId) && AREA_TIERS.includes(hit.tier)) next.ward = true;
  if (!wardHere && AREA_TIERS.includes(hit.tier)) next.ward = true;
  return {
    ...log,
    errand,
    circuit: { ...log.circuit, [hit.cityId]: next },
    reds: hit.tier === "red" ? { ...log.reds, [hit.cityId]: true } : log.reds,
    sawViolet: log.sawViolet || hit.tier === "violet",
  };
}

export function notePrint(log: QuestLog, cityId: CityId): QuestLog {
  const cur = circuit(log, cityId);
  return { ...log, circuit: { ...log.circuit, [cityId]: { ...cur, printed: true } } };
}

export function rareExtra(tier: Tier, roll: number): "scrap" | "pattern" | null {
  if (tier === "red" && roll < 0.12) return "scrap";
  if (tier === "violet" && roll < 0.18) return "pattern";
  return null;
}

export function grantScrap(log: QuestLog): { log: QuestLog; fresh: boolean } {
  if (log.cloths.includes("road-dust")) return { log, fresh: false };
  return { log: { ...log, cloths: [...log.cloths, "road-dust"] }, fresh: true };
}

export function claimErrand(log: QuestLog, cityId: CityId): { log: QuestLog; ingredient: IngredientId } | null {
  if (!errandDone(log.errand)) return null;
  const ingredient = cityStaple(cityId);
  const errand: Errand = log.errand.kind === "row" ? { kind: "ladder", seen: [] } : { kind: "row", n: 0 };
  return { log: { ...log, errand }, ingredient };
}

export function circuitReady(log: QuestLog, cityId: CityId, staple: number, charms: number): boolean {
  const c = circuit(log, cityId);
  if (c.claimed) return false;
  return c.red && c.ward && staple >= 3 && (c.printed || charms > 0);
}

export function claimCircuit(log: QuestLog, cityId: CityId, staple: number, charms: number): { log: QuestLog; cloth: ClothId } | null {
  if (!circuitReady(log, cityId, staple, charms)) return null;
  const cloth: ClothId = `scarf-${cityId}`;
  const cur = circuit(log, cityId);
  const cloths = log.cloths.includes(cloth) ? log.cloths : [...log.cloths, cloth];
  return {
    cloth,
    log: { ...log, cloths, worn: log.worn ?? cloth, circuit: { ...log.circuit, [cityId]: { ...cur, claimed: true } } },
  };
}

export function longProgress(log: QuestLog, distanceM: number): Record<LongId, { n: number; need: number; ready: boolean; done: boolean }> {
  const reds = CITY_IDS.filter((id) => log.reds[id]).length;
  return {
    hundred: { n: log.perfects, need: 100, ready: log.perfects >= 100 && !log.claimed.hundred, done: Boolean(log.claimed.hundred) },
    unbroken: { n: log.bestRow, need: 10, ready: log.bestRow >= 10 && !log.claimed.unbroken, done: Boolean(log.claimed.unbroken) },
    walk: { n: distanceM, need: 10_000, ready: distanceM >= 10_000 && !log.claimed.walk, done: Boolean(log.claimed.walk) },
    violet: { n: log.sawViolet ? 1 : 0, need: 1, ready: log.sawViolet && !log.claimed.violet, done: Boolean(log.claimed.violet) },
    redbook: { n: reds, need: CITY_IDS.length, ready: reds >= CITY_IDS.length && !log.claimed.redbook, done: Boolean(log.claimed.redbook) },
  };
}

export function claimLong(log: QuestLog, id: LongId, distanceM: number): { log: QuestLog; schematic?: boolean; pattern?: boolean; cloth?: ClothId; title?: string } | null {
  const row = longProgress(log, distanceM)[id];
  if (!row.ready) return null;
  const claimed = { ...log.claimed, [id]: true as const };
  if (id === "hundred") return { log: { ...log, claimed, title: "Clean hundred" }, title: "Clean hundred" };
  if (id === "unbroken") return { log: { ...log, claimed }, schematic: true };
  if (id === "violet") return { log: { ...log, claimed, patterns: log.patterns + 1 }, pattern: true };
  if (id === "walk") {
    const cloths = log.cloths.includes("road-dust") ? log.cloths : [...log.cloths, "road-dust" as const];
    return { log: { ...log, claimed, cloths, worn: log.worn ?? "road-dust", title: log.title ?? "Walker" }, cloth: "road-dust", title: "Walker" };
  }
  const cloths = log.cloths.includes("red-book") ? log.cloths : [...log.cloths, "red-book" as const];
  return { log: { ...log, claimed, cloths, worn: log.worn ?? "red-book" }, cloth: "red-book" };
}

export function printPattern(log: QuestLog): { log: QuestLog } | null {
  if (log.patterns < 1 || log.cloths.includes("night-glass")) return null;
  return { log: { ...log, patterns: log.patterns - 1, cloths: [...log.cloths, "night-glass"], worn: log.worn ?? "night-glass" } };
}

export function clothName(id: ClothId): string {
  if (id === "road-dust") return "Road dust";
  if (id === "red-book") return "Red book";
  if (id === "night-glass") return "Night glass";
  return CITY_NAME[id.slice(6) as CityId] ? `${CITY_NAME[id.slice(6) as CityId]} scarf` : "Scarf";
}

export function clothBlurb(id: ClothId): string {
  if (id === "road-dust") return "Common. A tint on the lantern. From the long walk, or a rare red scrap.";
  if (id === "red-book") return "Rare. One red vault in every city.";
  if (id === "night-glass") return "Violet pattern, printed. The lantern glass goes night-purple.";
  return "This city's circuit. Scarf on the lantern.";
}

export const LONG_COPY: Record<LongId, { title: string; sub: string }> = {
  hundred: { title: "Clean hundred", sub: "100 perfect answers. A title under the coat." },
  unbroken: { title: "Unbroken", sub: "10 perfects in a row. Pays a schematic." },
  walk: { title: "The long walk", sub: "10 km on foot. Road-dust cloth." },
  violet: { title: "Night mark", sub: "Open one violet. Pays a print pattern." },
  redbook: { title: "The Red Book", sub: "A red vault in every city. Rare cloth." },
};
