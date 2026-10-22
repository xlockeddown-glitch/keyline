import { cityStaple, type IngredientId } from "./ingredients.ts";
import type { CityId, Tier } from "./types.ts";

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
  seattle: "Seattle",
  denver: "Denver",
  nashville: "Nashville",
};

export type ClothId = "road-dust" | "red-book" | "night-glass" | `scarf-${CityId}`;

export type Errand = { kind: "row"; n: number } | { kind: "ladder"; seen: Array<"white" | "blue" | "green"> };

/** 0.1.22: what an old save still owes from the retired milestones and charms, sent to the server once. */
export type LegacyLog = {
  claimed: string[];
  circuits: CityId[];
  unfinished: boolean;
  charms: string[];
};

export type QuestLog = {
  errand: Errand;
  cloths: ClothId[];
  worn: ClothId | null;
  title: string | null;
  patterns: number;
  /** Set while an old save still has milestone / charm items to move; null once the move is done. */
  legacy: LegacyLog | null;
};

const LADDER = ["white", "blue", "green"] as const;
export function freshQuests(_cityId?: CityId): QuestLog {
  return { errand: { kind: "row", n: 0 }, cloths: [], worn: null, title: null, patterns: 0, legacy: null };
}

type OldCircuit = { red?: boolean; ward?: boolean; printed?: boolean; claimed?: boolean };
type OldLog = {
  circuit?: Partial<Record<CityId, OldCircuit>>;
  perfects?: number;
  bestRow?: number;
  reds?: Partial<Record<CityId, true>>;
  sawViolet?: boolean;
  claimed?: Partial<Record<string, true>>;
  legacy?: LegacyLog | null;
};

/** What a pre-0.1.22 quest log still owes: unclaimed armed circuits, claimed long ids, and whether anything was half done. */
export function legacyOf(raw: OldLog, charms: readonly string[] = []): LegacyLog | null {
  const old = raw.circuit !== undefined || raw.claimed !== undefined || raw.perfects !== undefined;
  if (!old && !charms.length) return null;
  const claimed = Object.keys(raw.claimed ?? {}).filter((k) => raw.claimed?.[k]);
  const circuits: CityId[] = [];
  let unfinished = false;
  for (const [city, c] of Object.entries(raw.circuit ?? {}) as [CityId, OldCircuit][]) {
    if (!c || c.claimed) continue;
    if (c.red && c.ward) circuits.push(city);
    else if (c.red || c.ward || c.printed) unfinished = true;
  }
  const started: Record<string, boolean> = {
    hundred: (raw.perfects ?? 0) > 0,
    unbroken: (raw.bestRow ?? 0) > 0,
    violet: false,
    walk: false,
    redbook: Object.keys(raw.reds ?? {}).length > 0,
  };
  for (const [id, s] of Object.entries(started)) if (s && !claimed.includes(id)) unfinished = true;
  return { claimed, circuits, unfinished, charms: [...charms] };
}

export function hydrateQuests(raw: (Partial<QuestLog> & OldLog) | null | undefined, cityId?: CityId, charms: readonly string[] = []): QuestLog {
  const base = freshQuests(cityId);
  if (!raw) return { ...base, legacy: charms.length ? legacyOf({}, charms) : null };
  const legacy = raw.legacy !== undefined ? raw.legacy : legacyOf(raw, charms);
  return {
    errand: raw.errand ?? base.errand,
    cloths: raw.cloths ?? [],
    worn: raw.worn ?? null,
    title: raw.title ?? null,
    patterns: raw.patterns ?? 0,
    legacy,
  };
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

export function noteAnswer(log: QuestLog, correct: boolean, _perfect?: boolean): QuestLog {
  if (correct || log.errand.kind !== "row") return log;
  return { ...log, errand: { kind: "row", n: 0 } };
}

export function noteClear(log: QuestLog, hit: { cityId: CityId; poiId: string; tier: Tier }): QuestLog {
  let errand = log.errand;
  if (!errandDone(errand)) {
    if (errand.kind === "row") errand = { kind: "row", n: errand.n + 1 };
    else if (hit.tier === "white" || hit.tier === "blue" || hit.tier === "green") {
      errand = { kind: "ladder", seen: errand.seen.includes(hit.tier) ? errand.seen : [...errand.seen, hit.tier] };
    }
  }
  return errand === log.errand ? log : { ...log, errand };
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

/** Night glass: a pattern plus one press stock, or (0.1.22) a pattern plus a schematic. */
export function printPattern(log: QuestLog, stock: { press: boolean; schematics: number }): { log: QuestLog; spend: "press" | "schematic" } | null {
  if (log.patterns < 1 || log.cloths.includes("night-glass")) return null;
  const spend = stock.press ? "press" : stock.schematics > 0 ? "schematic" : null;
  if (!spend) return null;
  return { spend, log: { ...log, patterns: log.patterns - 1, cloths: [...log.cloths, "night-glass"], worn: log.worn ?? "night-glass" } };
}

export function clothName(id: ClothId): string {
  if (id === "road-dust") return "Road dust";
  if (id === "red-book") return "Red book";
  if (id === "night-glass") return "Night glass";
  return CITY_NAME[id.slice(6) as CityId] ? `${CITY_NAME[id.slice(6) as CityId]} scarf` : "Scarf";
}

export function clothEarn(id: ClothId): string {
  if (id === "road-dust") return "A rare red scrap from a red lamp.";
  if (id === "red-book") return "No longer earned. Kept by those who have it.";
  if (id === "night-glass") return "Print a violet pattern. Spends one press stock, or a schematic.";
  return "No longer earned. Kept by those who have it.";
}

export function clothPerk(id: ClothId): string {
  if (id === "road-dust") return "Worn: every clear pays 20 extra coin.";
  if (id === "red-book") return "Worn: a red clear pays 80 extra coin.";
  if (id === "night-glass") return "Worn: a violet clear pays 150 extra coin.";
  return "Worn in its city: a clear pays 45 extra coin.";
}

/** Extra coin for the cloth currently worn. Zero if it does not apply. */
export function clothCoin(worn: ClothId | null, cityId: CityId, tier: Tier): number {
  if (worn === "road-dust") return 20;
  if (worn === "red-book" && tier === "red") return 80;
  if (worn === "night-glass" && tier === "violet") return 150;
  if (worn?.startsWith("scarf-") && worn.slice(6) === cityId) return 45;
  return 0;
}

/** Closet rows: road dust, the night glass, then any legacy cloth this walker owns (scarves, the red book). */
export function clothShelf(log: QuestLog, _cityId?: CityId): ClothId[] {
  const ids: ClothId[] = ["road-dust", "night-glass"];
  for (const id of log.cloths) if (!ids.includes(id)) ids.push(id);
  return ids;
}
