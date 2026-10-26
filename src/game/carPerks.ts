/**
 * 0.1.45: car perks, favorite categories and the category of the day (design: /workspace/car-perks-design.md).
 * A car's perk works only while you sit in that car. A car perk and a coat perk of the same kind don't add up:
 * the higher one wins. Category boosts add up and cap at +40%, on lamp coin only (gradeGrant, before the market).
 */
import type { CarId } from "./cars.ts";
import { distM } from "./geo.ts";
import { chicagoDay } from "./questPeriods.ts";
import type { ScoutId, TriviaCat } from "./types.ts";

/** 0.1.46 Roadster 2.0 Magnet: radius, spacing and a per-city daily cap inside the street cap of 80. */
export const MAGNET_M = 35;
export const MAGNET_GAP_MS = 3000;
export const MAGNET_DAY_CAP = 30;
/** How long the suction pull animation runs before the match lands. */
export const MAGNET_PULL_MS = 420;
/** How often a seated Roadster 2.0 tells the server it is driving in this city (the Magnet needs one within 5 min). */
export const DRIVE_PING_MS = 60_000;
export type CarPerk = { label: string; vaultMs?: number; reach?: number; cool?: number; refund?: number; magnet?: boolean };

export const CAR_PERKS: Record<CarId, CarPerk> = {
  civic: { label: "Glovebox · +1 s on lamp timers", vaultMs: 1000 },
  f150: { label: "Truck bed · 1.5× match pickup reach", reach: 1.5 },
  mustang: { label: "Quick stop · lamp rests 15% shorter", cool: 0.85 },
  roadster: { label: "Regen · 1 in 5 failed lamps refund the match", refund: 5 },
  roadster2: { label: `Magnet · pulls in street matches within ${MAGNET_M} m as you drive`, magnet: true },
};

export const hasMagnet = (car: CarId | null | undefined) => Boolean(car && CAR_PERKS[car].magnet);

export const CAR_FAV: Record<CarId, TriviaCat> = { civic: "local", f150: "nature", mustang: "sports", roadster: "science", roadster2: "games" };
export const SCOUT_FAV: Record<ScoutId, TriviaCat> = {
  raccoon: "food",
  cat: "arts",
  turtle: "history",
  owl: "books",
  corgi: "celebrity",
  sloth: "political",
  giraffe: "science",
  fox: "math",
  lynx: "music",
};

export const CAT_LABEL: Record<TriviaCat, string> = {
  sports: "Sports", local: "Local", political: "Political", food: "Food", arts: "Arts", math: "Math", science: "Science",
  history: "History", nature: "Nature", games: "Video games", celebrity: "Celebrity", music: "Music", books: "Books",
};

export const FAV_BONUS = 0.15;
/** 0.1.45: the worn coat and the seated car both favor the card's category. */
export const FAV_BOTH = 0.25;
/** Favorite bonus for how many of [coat, car] favor this category. */
export const favBonus = (n: number) => (n >= 2 ? FAV_BOTH : n === 1 ? FAV_BONUS : 0);
export const COTD_BONUS = 0.25;
export const CAT_BONUS_CAP = 0.4;

const CATS: readonly TriviaCat[] = ["sports", "local", "political", "food", "arts", "math", "science", "history", "nature", "games", "celebrity", "music", "books"];

/** The category of the day for a Chicago date ("2026-10-25"): the same on every server and device. */
export function cotdOf(day: string): TriviaCat {
  let h = 0x811c9dc5;
  const s = `cotd:${day}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return CATS[(h >>> 0) % CATS.length]!;
}
export const cotdAt = (ms: number) => cotdOf(chicagoDay(ms));

/** Coin factor and labels for a lamp of category `topic`: 1 + min(0.40, favorites 0.15 each + category of the day 0.25). */
export function catBoost(topic: TriviaCat | null | undefined, favs: readonly TriviaCat[], at: number): { x: number; labels: string[] } {
  if (!topic) return { x: 1, labels: [] };
  let add = 0;
  const labels: string[] = [];
  // favs is [coat?, car?]: one match is +15%, both is +25%.
  add += favBonus(favs.filter((f) => f === topic).length);
  if (add) labels.push(`Favorite +${Math.round(add * 100)}%`);
  if (cotdAt(at) === topic) {
    add += COTD_BONUS;
    labels.push(`Category of the day +${Math.round(COTD_BONUS * 100)}%`);
  }
  return { x: 1 + Math.min(CAT_BONUS_CAP, add), labels };
}

/** Same perk from coat and car: the higher wins. */
export const bestVaultMs = (scoutMs: number | undefined, car: CarId | null) => Math.max(scoutMs ?? 0, car ? (CAR_PERKS[car].vaultMs ?? 0) : 0);
export const bestReach = (scoutReach: number, car: CarId | null) => Math.max(scoutReach, car ? (CAR_PERKS[car].reach ?? 1) : 1);
export const carCool = (car: CarId | null) => (car ? (CAR_PERKS[car].cool ?? 1) : 1);

/** Roadster Regen: does this failed lamp refund its match? Rolled from the grade nonce, so a replay agrees. */
export function regenHit(car: CarId | null, nonce: string): boolean {
  const n = car ? CAR_PERKS[car].refund : undefined;
  if (!n) return false;
  let h = 0x811c9dc5;
  const s = `regen:${nonce}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0) / 4294967296 < 1 / n;
}

/** Favorite categories that count on a lamp: the worn coat's (when proven) and the seated car's. */
export function perkFavs(scout: ScoutId | null, scoutProven: boolean, car: CarId | null): TriviaCat[] {
  return [...(scout && scoutProven ? [SCOUT_FAV[scout]] : []), ...(car ? [CAR_FAV[car]] : [])];
}

/** 0.1.46: the street match the Magnet pulls now — the nearest within MAGNET_M, and only once MAGNET_GAP_MS has passed. */
export function magnetPick(car: CarId | null, at: { lat: number; lng: number }, keys: readonly { id: string; lat: number; lng: number }[], lastMs: number, nowMs: number): string | null {
  if (!hasMagnet(car) || nowMs - lastMs < MAGNET_GAP_MS) return null;
  let best: { id: string; d: number } | null = null;
  for (const k of keys) {
    const d = distM(at.lat, at.lng, k.lat, k.lng);
    if (d <= MAGNET_M && (!best || d < best.d)) best = { id: k.id, d };
  }
  return best?.id ?? null;
}
