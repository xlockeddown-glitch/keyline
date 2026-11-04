/**
 * 0.1.99 placed lantern, slice 1: the unlock, one `plantok` ledger row on the player. 0.1.119: the ladders are gone,
 * so it is now PLANT_RED_NEED right answers on red (V) or violet vaults; an old perfect Stack clear still counts
 * (findPerfectStack). Pure rules here; the reads and writes are in walletApply.ts (plantUnlocked, awardGrade).
 */
import { STACK_ID } from "./data.ts";

/** The boost line the last card of a perfect ladder carried (0.1.36 to 0.1.118); only the back-fill reads it now. */
export const PRIZE_TAG = "Perfect ladder";

export const PLANT_OK_KEY = "plantok";
/** 0.1.119 (Ryan): with the ladders gone, a Hearth unlocks at this many right answers on red (V) or violet vaults. */
export const PLANT_RED_NEED = 10;

type Detail = { g?: string; pi?: string; boosts?: unknown };

function parse(detail: string): Detail | null {
  try {
    const d = JSON.parse(detail) as unknown;
    return d && typeof d === "object" ? (d as Detail) : null;
  } catch {
    return null;
  }
}

/**
 * Back-fill: find a past perfect Stack in a player's `grade:` rows. One exact signal, nothing guessed: since 0.1.36
 * the last card of a perfect ladder carries the "Perfect ladder: …" boost, and a Stack card's row has
 * `pi: "__stack__"`. Older clears can't be told apart: grade rows don't record the step, so a pv chain of four
 * perfect Stack cards can span two different Stacks (one that failed later), and that is not proof.
 * Returns the op_key of the row that proves it, or null.
 */
export function findPerfectStack(rows: readonly { op_key: string; detail: string }[]): string | null {
  for (const r of rows) {
    if (!r.op_key.startsWith("grade:")) continue;
    const d = parse(r.detail);
    if (!d || d.pi !== STACK_ID || d.g !== "perfect") continue;
    if (Array.isArray(d.boosts) && d.boosts.some((b) => typeof b === "string" && b.startsWith(`${PRIZE_TAG}:`))) return r.op_key;
  }
  return null;
}

// ---- 0.1.109 slice 2: placing the Hearth vault. Pure rules; the op is plantOp in walletApply.ts. ----

export const PLACED_USER = "~placed";
/**
 * 0.1.122 (Ryan): one Hearth per version per player. A Single, and every Hearth placed before 0.1.122 whatever its
 * version, sits on `placed:<owner>`; a new Double or Triple gets `placed:<owner>:v2` / `:v3` (`slot` on the row), and a
 * new Single goes to `:v1` only when an old Double/Triple already holds the bare key. Old rows are never rewritten.
 */
export const placedKey = (ownerId: string, slot?: 1 | 2 | 3) => (slot ? `placed:${ownerId}:v${slot}` : `placed:${ownerId}`);
export const placedKeys = (ownerId: string) => [placedKey(ownerId), placedKey(ownerId, 1), placedKey(ownerId, 2), placedKey(ownerId, 3)];
/** The player's mirror row for a placement (the bare-key one keeps the old `plant`). */
export const plantKey = (slot?: 1 | 2 | 3) => (slot ? `plant:v${slot}` : "plant");
export const PLANT_NAMES = [
  "Porch Light", "Corner Glow", "Night Owl", "Hearthside", "Little Beacon", "Wayfinder", "Evening Star", "Lamplight Lane",
  "Kind Light", "North Window", "Warm Welcome", "Moth's Delight", "Steady Flame", "Neighbor's Lamp", "Late Shift", "Lantern Rest",
  "Quiet Corner", "Bright Idea", "Homeward", "First Light", "Good Evening", "Old Faithful", "Night Watch", "Easy Glow",
] as const;
export const PLANT_CATS = [
  "local", "history", "science", "music", "sports", "food", "books", "arts", "political", "celebrity", "games", "nature", "geography", "math",
] as const;
export type PlantCat = (typeof PLANT_CATS)[number];
/** Nearest lamp or other placed vault. */
export const PLANT_GAP_M = 40;
/** At most PLANT_DENSE placed vaults within PLANT_DENSE_M. */
export const PLANT_DENSE = 6;
export const PLANT_DENSE_M = 300;
/** How far from the city's spawn a vault can go (the baked street area is ~6 km across). */
export const PLANT_CITY_M = 9000;

/** 0.1.117: `v` is the version (1 Single, 2 Double, 3 Triple); a row without it is Single. */
export type PlacedVault = { owner: string; city: string; lat: number; lng: number; name: number; cats: PlantCat[]; at: number; v?: 1 | 2 | 3; /** 0.1.122: the per-version key it sits on (absent: the bare `placed:<owner>`). */ slot?: 1 | 2 | 3 };
type LL = { lat: number; lng: number };

function dist(a: LL, b: LL): number {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6_371_000;
}

/** Metres to the nearest lamp or placed vault (Infinity when none). */
export function plantGap(at: LL, lamps: readonly LL[], placed: readonly LL[]): number {
  let best = Infinity;
  for (const p of lamps) best = Math.min(best, dist(at, p));
  for (const p of placed) best = Math.min(best, dist(at, p));
  return best;
}

export type PlantInput = { city: string; lat: number; lng: number; name: number; cats: readonly string[]; v?: number };
export type PlantRefusal = "name" | "cats" | "version" | "far" | "close" | "dense";

/** The place rules that don't need the database: null when the spot and choices are fine. */
export function plantRefusal(input: PlantInput, spawn: LL, lamps: readonly LL[], placed: readonly LL[]): PlantRefusal | null {
  if (!Number.isInteger(input.name) || input.name < 0 || input.name >= PLANT_NAMES.length) return "name";
  const cats = new Set(input.cats);
  if (input.cats.length !== 4 || cats.size !== 4 || [...cats].some((c) => !(PLANT_CATS as readonly string[]).includes(c))) return "cats";
  if (input.v !== undefined && input.v !== 1 && input.v !== 2 && input.v !== 3) return "version";
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || dist(input, spawn) > PLANT_CITY_M) return "far";
  if (plantGap(input, lamps, placed) < PLANT_GAP_M) return "close";
  if (placed.filter((p) => dist(input, p) <= PLANT_DENSE_M).length >= PLANT_DENSE) return "dense";
  return null;
}

export function parsePlaced(detail: string | null | undefined): PlacedVault | null {
  try {
    const d = JSON.parse(detail ?? "") as PlacedVault;
    return d && typeof d.owner === "string" && Number.isFinite(d.lat) && Number.isFinite(d.lng) ? d : null;
  } catch {
    return null;
  }
}

// ---- 0.1.111 slice 3: the owner's cut. ----
export const HEARTH_CUT = 50;
export const HEARTH_CUT_CAP = 1000;
/** New accounts don't pay a cut: under HEARTH_NEW_DAYS days old or under HEARTH_NEW_RIGHT right answers. */
export const HEARTH_NEW_DAYS = 3;
export const HEARTH_NEW_RIGHT = 25;
export type HearthStats = { today: { opens: number; coin: number; keys: number }; total: { opens: number; coin: number; keys: number }; cap: number };

function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}
/** One paid open per visitor a day; the visitor is hashed so their id never sits in the owner's rows. */
export const hearthCutKey = (day: string, visitor: string) => `hcut:${day}:${fnv(`v:${visitor}`).toString(36)}`;
/** 1 in 10 cuts also pay the owner a V (red) key, rolled from the grade nonce. */
export const hearthMatch = (nonce: string) => fnv(`hcut:${nonce}`) % 10 === 0;
