import { isClassic } from "./classicKind.ts";
/**
 * 0.1.45: car perks, favorite categories and the category of the day (design: /workspace/car-perks-design.md).
 * A car's perk works only while you sit in that car. A car perk and a coat perk of the same kind don't add up:
 * the higher one wins. Category boosts add up and cap at +40%, on lamp coin only (gradeGrant, before the market).
 */
import type { CarId } from "./cars.ts";
import { distM } from "./geo.ts";
import { chicagoDay } from "./questPeriods.ts";
import type { FieldPick, ScoutId, TriviaCat } from "./types.ts";

/** 0.1.46 Roadster 2.0 Magnet: radius, spacing and a per-city daily cap inside the street cap of 80. */
export const MAGNET_M = 35;
export const MAGNET_GAP_MS = 3000;
export const MAGNET_DAY_CAP = 30;
/** How long the suction pull animation runs before the match lands. */
export const MAGNET_PULL_MS = 420;
/** How often a seated Roadster 2.0 tells the server it is driving in this city (the Magnet needs one within 5 min). */
export const DRIVE_PING_MS = 60_000;
/** 0.1.51 Ioniq 5 Vehicle-to-load: +1 white per lit lamp while seated, this many a day per player (Chicago day). */
export const V2L_DAY_CAP = 20;
/** 0.1.178 Duesenberg Odometer: every this-many-th vault opened while seated in it pays +1 amber key (lifetime count, no RNG). */
export const ODOMETER_EVERY = 25;
/** 0.1.179 VW Microbus Encore: a failed vault pays back this share of that vault color's base ladder coin (TIER_VALUE), rounded down. */
export const ENCORE_RATE = 0.2;
/** Encore pays at most this many times a day per player (America/Chicago calendar day, for every city). */
export const ENCORE_DAY_CAP = 20;
export type CarPerk = { label: string; encore?: number; odometer?: number; vaultMs?: number; reach?: number; cool?: number; refund?: number; magnet?: boolean; v2l?: number; autopilot?: number; roadTrip?: boolean };

export const CAR_PERKS: Record<CarId, CarPerk> = {
  civic: { label: "Glovebox · +1 s on vault timers", vaultMs: 1000 },
  f150: { label: "Truck bed · 1.5× key pickup reach", reach: 1.5 },
  microbus: { label: `Encore · a failed vault pays back ${Math.round(ENCORE_RATE * 100)}% of its base coin (${ENCORE_DAY_CAP} a day)`, encore: ENCORE_RATE },
  ioniq5: { label: `Vehicle-to-load · each vault opened pays +1 white key, ${V2L_DAY_CAP} a day`, v2l: 1 },
  mustang: { label: "Quick stop · vault rests 15% shorter", cool: 0.85 },
  belair57: { label: "Road trip · the first vault you open in each city each day pays +1 white key", roadTrip: true },
  model3: { label: "Autopilot · 1 in 10 vault questions drop a wrong answer", autopilot: 10 },
  roadster: { label: "Regen · 1 in 5 failed vaults refund the key", refund: 5 },
  duesenberg: { label: `Odometer · every ${ODOMETER_EVERY}th vault opened pays +1 amber key`, odometer: ODOMETER_EVERY },
  roadster2: { label: `Magnet · pulls in street keys within ${MAGNET_M} m as you drive`, magnet: true },
};

export const hasMagnet = (car: CarId | null | undefined) => Boolean(car && CAR_PERKS[car].magnet);

export const CAR_FAV: Record<CarId, TriviaCat> = { civic: "local", f150: "nature", microbus: "music", ioniq5: "arts", mustang: "sports",
  belair57: "geography",
  model3: "math", roadster: "science", duesenberg: "history", roadster2: "games" };
export const SCOUT_FAV: Record<ScoutId, FieldPick> = {
  raccoon: "food",
  cat: "arts",
  turtle: "history",
  owl: "books",
  corgi: "celebrity",
  sloth: "political",
  giraffe: "geography",
  fox: "math",
  // 0.1.116 (Ryan): the Penguin favors Random (+15% on top of Random's own +10%).
  lynx: "random",
  panda: "music",
};

export const CAT_LABEL: Record<FieldPick, string> = {
  sports: "Sports", local: "Local", political: "Political", food: "Food", arts: "Arts", math: "Math", science: "Science",
  history: "History", nature: "Nature", games: "Video games", celebrity: "Celebrity", music: "Music", books: "Books", geography: "Geography", random: "Random",
};

export const FAV_BONUS = 0.15;
/** 0.1.45: the worn coat and the seated car both favor the card's category. */
export const FAV_BOTH = 0.25;
/** Favorite bonus for how many of [coat, car] favor this category. */
export const favBonus = (n: number) => (n >= 2 ? FAV_BOTH : n === 1 ? FAV_BONUS : 0);
export const COTD_BONUS = 0.25;
export const CAT_BONUS_CAP = 0.4;
/** 0.1.116: a Random pick pays +10% coin, server-applied from the sealed deal (inside the +40% cap). */
export const RANDOM_BONUS = 0.1;

const CATS: readonly TriviaCat[] = ["sports", "local", "political", "food", "arts", "math", "science", "history", "nature", "games", "celebrity", "music", "books", "geography"];

/** The category of the day for a Chicago date ("2026-10-25"): the same on every server and device. */
export function cotdOf(day: string): TriviaCat {
  let h = 0x811c9dc5;
  const s = `cotd:${day}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return CATS[(h >>> 0) % CATS.length]!;
}
export const cotdAt = (ms: number) => cotdOf(chicagoDay(ms));

/** Coin factor and labels for a lamp of category `topic`: 1 + min(0.40, favorites 0.15 each + category of the day 0.25). */
/** 0.1.110: `noCotd` for a Hearth vault (its 4 fields are fixed, so the category of the day never adds there). */
/** 0.1.116: `topic` "random" is a Random pick: +10%, plus favorites that favor Random; never the category of the day. */
export function catBoost(topic: FieldPick | null | undefined, favs: readonly FieldPick[], at: number, noCotd = false): { x: number; labels: string[] } {
  if (!topic) return { x: 1, labels: [] };
  let add = 0;
  const labels: string[] = [];
  if (topic === "random") {
    add += RANDOM_BONUS;
    labels.push(`Random +${Math.round(RANDOM_BONUS * 100)}%`);
  }
  // favs is [coat?, car?]: one match is +15%, both is +25%.
  const fav = favBonus(favs.filter((f) => f === topic).length);
  add += fav;
  if (fav) labels.push(`Favorite +${Math.round(fav * 100)}%`);
  if (!noCotd && cotdAt(at) === topic) {
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

function roll(tag: string, nonce: string): number {
  let h = 0x811c9dc5;
  const s = `${tag}:${nonce}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  // Finalizer (murmur3 fmix32): FNV alone clusters on near-identical nonces.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 0.1.51 Model 3 Autopilot: does this lamp question lose one wrong answer? From the deal nonce, so it is fixed per question. */
export function autopilotHit(car: CarId | null, nonce: string): boolean {
  const n = car ? CAR_PERKS[car].autopilot : undefined;
  return Boolean(n && roll("autopilot", nonce) < 1 / n);
}

/** The wrong option Autopilot hides (never the answer), picked from the nonce too. */
export function autopilotStrike(car: CarId | null, nonce: string, choices: readonly string[], answer: string, kind?: string): string | null {
  if (!isClassic({ kind })) return null;
  if (!autopilotHit(car, nonce)) return null;
  // 0.1.158: never on a two-choice (True/False) or no-choice card.
  if (choices.length < 3) return null;
  const wrong = [...choices].filter((c) => c !== answer).sort();
  if (!wrong.length) return null;
  return wrong[Math.min(wrong.length - 1, Math.floor(roll("autopilot-pick", nonce) * wrong.length))]!;
}

/** 0.1.51 Ioniq 5 Vehicle-to-load: does this lit lamp pay the extra white? `usedToday` is today's V2L pays so far. */
export function v2lPays(car: CarId | null, usedToday: number): boolean {
  return Boolean(car && CAR_PERKS[car].v2l) && usedToday < V2L_DAY_CAP;
}

/** 0.1.55 Bel Air Road trip: does this lit lamp pay the extra white? `paidHereToday`: a Road trip white already paid in this city today. */
export function roadTripPays(car: CarId | null, paidHereToday: boolean): boolean {
  return Boolean(car && CAR_PERKS[car].roadTrip) && !paidHereToday;
}

/** 0.1.178 Duesenberg Odometer: does a car carry the counter at all (only vaults opened seated in it count)? */
export const hasOdometer = (car: CarId | null | undefined) => Boolean(car && CAR_PERKS[car].odometer);

/**
 * 0.1.178 Duesenberg Odometer: does the vault that brought the lifetime count to `count` pay the amber key?
 * `count` is the server's own count of vaults opened in this car (walletApply.awardGrade), this one included:
 * 25, 50, 75… pay; nothing else does. No roll.
 */
export function odometerPays(car: CarId | null, count: number): boolean {
  const n = car ? CAR_PERKS[car].odometer : undefined;
  return Boolean(n) && Number.isInteger(count) && count > 0 && count % n! === 0;
}

/** "Odometer 17/25" for the HUD and the showroom: how far into the current 25 the server's count is. */
export function odometerText(count: number): string {
  const n = Math.max(0, Math.floor(count) || 0);
  return `Odometer ${n % ODOMETER_EVERY}/${ODOMETER_EVERY}`;
}

/** 0.1.179 VW Microbus Encore: does a car carry the perk at all (only a fail graded while seated in it pays)? */
export const hasEncore = (car: CarId | null | undefined) => Boolean(car && CAR_PERKS[car].encore);

/**
 * 0.1.179 VW Microbus Encore: the coin a failed vault pays back. `base` is that vault color's BASE ladder coin
 * (rewards.TIER_VALUE: no streak, booster, hearth, market, car-pace or any other modifier) and `usedToday` is the
 * server's count of Encore pays already made this Chicago day. Pay = Math.floor(ENCORE_RATE * base), an integer.
 * 0 when not seated in the Microbus, when the day's ENCORE_DAY_CAP is used up, or when the floor is 0 (base below
 * 5): a 0 pays nothing and takes no daily slot. No roll.
 */
export function encorePays(car: CarId | null | undefined, base: number, usedToday: number): number {
  const rate = car ? CAR_PERKS[car].encore : undefined;
  if (!rate || !Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isInteger(usedToday) || usedToday < 0 || usedToday >= ENCORE_DAY_CAP) return 0;
  // Integer math (rate is a whole percent), so 0.2 * 15 can never land on 2.9999.
  return Math.max(0, Math.floor((Math.round(rate * 100) * Math.floor(base)) / 100));
}

/** "Encore 3/20" for the HUD and the showroom: today's pays out of the daily cap, from the server's count. */
export function encoreText(usedToday: number): string {
  const n = Math.min(ENCORE_DAY_CAP, Math.max(0, Math.floor(usedToday) || 0));
  return `Encore ${n}/${ENCORE_DAY_CAP}`;
}

/**
 * The server's Encore count as it stands at `nowMs`: its `used` while its Chicago day is still today, 0 once that
 * day has passed (the cap has reset; the next sync or grade reply brings the new day's count). Display only.
 */
export function encoreToday(e: { used: number; day: string } | null | undefined, nowMs: number): number {
  return e && e.day === chicagoDay(nowMs) ? e.used : 0;
}

/** The boost line a paid Encore puts on the miss result. */
export const encoreLine = (coin: number) => `Encore +${coin} coin`;

/** Favorite categories that count on a lamp: the worn coat's (when proven) and the seated car's. */
export function perkFavs(scout: ScoutId | null, scoutProven: boolean, car: CarId | null): FieldPick[] {
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
