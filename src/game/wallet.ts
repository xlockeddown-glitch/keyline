import { applyTriviaBoosts, creditWhite } from "./boosts.ts";
import { chooseStart, cleanUnlocks, freshUnlocks, lampLit, runFinished, unlockCity, type CityUnlocks } from "./cityPass.ts";
import { CITIES, KIOSK, SCOUTS, SERIES, type KioskId } from "./data.ts";
import { payIn, type CosmeticId, type Wardrobe } from "./cosmetics.ts";
import { payDaily } from "./dailyRun.ts";
import { BLITZ_STEPS, CONTRACT_LAMPS, blitzMatch } from "./dailyBlitz.ts";
import { SURVEY_GOALS, isPlace } from "./survey.ts";
import { MARKET_MULT, marketAt, marketMatches, marketMult, marketOverflowCoin, marketPay } from "./nightMarket.ts";
import { cleanKeys, refundMatch, spendMatch } from "./matchSpend.ts";
import { owlExtraCoin, owlMatchCoin } from "./scoutPerks.ts";
import { lightOf, type LightId } from "./marketLights.ts";
import { FRESH_DISTRICT_TAG, freshDistrictCoin } from "./district.ts";
import { cleanCredit, payMatch, payMatchesOf } from "./goals.ts";
import type { ScoutId } from "./types";
import { clothCoin, type ClothId } from "./quests.ts";
import { applyBank, bankDownSpec, bankUpSpec, rewardPoints } from "./rewards.ts";
/** Same table as triviaMeta DIFF_MULT. Inlined so this module doesn't pull the street graph into node tests. */
const DIFF_MULT: Record<number, number> = { 1: 0.7, 2: 1, 3: 1.45 };
import type { CityId, Tier, TriviaCat, TriviaDiff } from "./types.ts";
import { LUCKY_MATCH_CHANCE, PERFECT_BLUE_CHANCE } from "./vaultPay.ts";
import { crateLoot, nextCrateStreak, CRATE_MAX } from "./crate.ts";
import { payFriend } from "./friendTicket.ts";
import { betterOutcome, bonusDue, IDLE, RIDE_BONUS_WHITE, rideRamp, rideRoundMs, type RideGameId, type RideOutcome } from "./rideGames.ts";
import { perfectBack, perfectRefund } from "./perfectRefund.ts";
import { FARE_MAX_MS, FARES_CAP, hurriedLoot, matchCap, pocketRide, transitLoot } from "./ticket.ts";

/**
 * 0.0.78 server wallet. Coins, matches (`keys`), city unlocks and city passes.
 * Pure: the database adapter (walletSql) applies the result once per op key.
 * Guests never call this.
 */

/** First sync clamps each device to these before it can raise the server pocket. */
/** 0.1.12: the wallet holds up to 5,000,000 (Ryan raised it from 250,000 so the villa and the Roadster fit). */
export const COIN_CAP = 5_000_000;
/** A device's own save still carries at most the old 250,000 into its first sync: raising the wallet cap must not
 * let an edited local save mint more. */
export const FIRST_SYNC_COIN_CAP = 250_000;
export const KEY_CAP = 300;
export const PASS_CAP = 25;
export const RUN_CAP = 9_999;
/** Longest survey walk the server will keep. A device does not bring its own. */
export const WALK_CAP = 150_000;
/** One of each real cloth (dust, book, glass, and a scarf per city). */
export const CLOTH_CAP = 18;
/** Craft stock the server will keep. A device does not bring its own. */
const BRASS_CAP = 48;
const INK_CAP = 32;
const VELLUM_CAP = 32;
const SCHEMATIC_CAP = 8;
const PRESS_CAP = 24;
const PATTERN_CAP = 4;
/** The long walk (quests.ts). Road dust is that distance, already on the wallet. */
const DUST_WALK_M = 10_000;
/** Real places a first sync may keep. The atlas is about 580. */
const VISIT_CAP = 640;
const TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

export type WalletMeta = {
  crateDay: string;
  crateStreak: number;
  blitzDay: string;
  /** How many blitz lamps have already paid today (0–6). 6 means the day is closed. */
  blitzStep: number;
  wheel: Partial<Record<Tier, number>>;
  /** Left over from the single-device sync. Per-device ledger keys are the lock now. */
  revised: boolean;
  /** Depart time of the ride currently paying, plus what that ride has already been credited. */
  rideAt: number;
  rideWhite: number;
  rideBlue: number;
  rideGreen: number;
  contractDay: string;
  contractN: number;
  /** Lucky bit crafted or brought in on a first sync. Grades pay the spare match only when this is set. */
  lucky: boolean;
  /** 0.1.22: Lucky on for this one month ("M2026-12"), from a Full month quest bonus. */
  luckyMonth: string;
  /** Cloth the server has recorded. A grade tip applies only for one of these. */
  cloths: string[];
  /** Metres the first sync already counted, before the walk board had them. */
  walkM: number;
  /** Tab-open time on the current ride, measured between server heartbeats. */
  rideOpen: number;
  rideSeen: number;
  /** Server times of the first and latest play event on this ride. Equal means one instant. */
  rideLo: number;
  rideHi: number;
  /** 0 idle, 1 played, 2 won. A win is kept even before the ride has been played long enough to pay it. */
  rideRank: number;
  /** Win performance in thousandths, so 1000 is a clean sheet. */
  ridePerf: number;
  ridePerfect: boolean;
  /** A round was dealt or a submit landed. Bare tab heartbeats do not set this. */
  rideTouch: boolean;
  /** Open round index, or -1 when this ride has not been dealt. */
  rideOpenN: number;
  /** 0.0.94: index of this ride's bonus round, or -1 before the midway deal. */
  rideBonusN: number;
  /** 0.0.94: the bonus round was won (pays RIDE_BONUS_WHITE once). */
  rideBonusWon: boolean;
  rideGame: string;
  /** Length of the open round, the one the server dealt. */
  rideMs: number;
  /** Train tickets held. Never above FARES_CAP. */
  fares: number;
  /** Atlas visits from a first sync, real place ids only. */
  visits: string[];
  /** Press stock the lucky bit and the cloths spend. */
  brass: number;
  ink: number;
  vellum: number;
  schematic: number;
  press: number;
  patterns: number;
  /** 0.0.97: overflow credits per colour (0-2), the server's own; never taken from a client save. */
  credit: Partial<Record<Tier, number>>;
  /** 0.0.98 levels: the level rewards are paid through (first look sets the baseline, no retro pay). */
  lvl: number;
  lvlInit: boolean;
  /** Cached for the boards: level and XP at the last server look. */
  xp: number;
  title: string;
  color: string;
  /** Held tokens: 15-min double streak pay, and matches to send a friend. */
  boosts: number;
  gifts: number;
  boostUntil: number;
  /** Server time of the newest friend gift already shown. */
  giftSeen: number;
};

export type WalletState = {
  coins: number;
  keys: Record<Tier, number>;
  cities: CityUnlocks;
  meta: WalletMeta;
  migrated: boolean;
  version: number;
};

export type LocalSnap = {
  coins: number;
  keys: Partial<Record<Tier, unknown>> | null | undefined;
  cities: unknown;
  crateDay?: string;
  crateStreak?: number;
  blitzDay?: string;
  blitzStep?: number;
  wheel?: Partial<Record<Tier, number>>;
  lucky?: boolean;
  cloths?: string[];
  distanceM?: number;
  fares?: number;
  atlas?: string[];
  brass?: number;
  ink?: number;
  vellum?: number;
  schematic?: number;
  press?: number;
  patterns?: number;
};

export type AwardView = {
  coins: number;
  keys: Partial<Record<Tier, number>>;
  boosts: string[];
};

export type OpResult = { ok: true; wallet: WalletState; award?: AwardView; detail?: string } | { ok: false; reason: string };

const emptyMeta = (): WalletMeta => ({
  crateDay: "",
  crateStreak: 0,
  blitzDay: "",
  blitzStep: 0,
  wheel: {},
  revised: false,
  rideAt: 0,
  rideWhite: 0,
  rideBlue: 0,
  rideGreen: 0,
  contractDay: "",
  contractN: 0,
  lucky: false,
  luckyMonth: "",
  cloths: [],
  walkM: 0,
  rideOpen: 0,
  rideSeen: 0,
  rideLo: 0,
  rideHi: 0,
  rideRank: 0,
  ridePerf: 0,
  ridePerfect: false,
  rideTouch: false,
  rideOpenN: -1,
  rideBonusN: -1,
  rideBonusWon: false,
  rideGame: "",
  rideMs: 0,
  fares: 0,
  visits: [],
  brass: 0,
  ink: 0,
  vellum: 0,
  schematic: 0,
  press: 0,
  patterns: 0,
  credit: {},
  lvl: 0,
  lvlInit: false,
  xp: 0,
  title: "",
  color: "",
  boosts: 0,
  gifts: 0,
  boostUntil: 0,
  giftSeen: 0,
});

export function emptyWallet(): WalletState {
  return { coins: 0, keys: cleanKeys(null), cities: freshUnlocks(), meta: emptyMeta(), migrated: false, version: 0 };
}

function num(v: unknown, cap: number) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(cap, Math.floor(n));
}

/** Round index. Zero is a real round; anything negative means none has been dealt. */
function openIndex(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return -1;
  return Math.min(12, Math.floor(n));
}

const RIDE_GAME_IDS = ["lamplighter", "where-am-i", "match-sorter", "route-puzzle"] as const;

function rideGameOf(v: unknown): RideGameId | "" {
  return (RIDE_GAME_IDS as readonly string[]).includes(String(v)) ? (v as RideGameId) : "";
}

export function cleanMeta(raw: unknown): WalletMeta {
  const m = raw && typeof raw === "object" ? (raw as Partial<WalletMeta>) : {};
  const wheel: Partial<Record<Tier, number>> = {};
  if (m.wheel && typeof m.wheel === "object") {
    for (const t of TIERS) wheel[t] = num((m.wheel as Partial<Record<Tier, unknown>>)[t], 100_000);
  }
  return {
    crateDay: typeof m.crateDay === "string" ? m.crateDay.slice(0, 10) : "",
    crateStreak: num(m.crateStreak, CRATE_MAX),
    blitzDay: typeof m.blitzDay === "string" ? m.blitzDay.slice(0, 10) : "",
    blitzStep: num(m.blitzStep, BLITZ_STEPS.length),
    wheel,
    revised: m.revised === true,
    rideAt: num(m.rideAt, Number.MAX_SAFE_INTEGER),
    rideWhite: num(m.rideWhite, 99),
    rideBlue: num(m.rideBlue, 99),
    rideGreen: num(m.rideGreen, 99),
    contractDay: typeof m.contractDay === "string" ? m.contractDay.slice(0, 10) : "",
    contractN: num(m.contractN, 24),
    lucky: m.lucky === true,
    luckyMonth: typeof m.luckyMonth === "string" && /^M\d{4}-\d{2}$/.test(m.luckyMonth) ? m.luckyMonth : "",
    cloths: cleanCloths(m.cloths),
    walkM: num(m.walkM, WALK_CAP),
    rideOpen: num(m.rideOpen, FARE_MAX_MS),
    rideSeen: num(m.rideSeen, Number.MAX_SAFE_INTEGER),
    rideLo: num(m.rideLo, Number.MAX_SAFE_INTEGER),
    rideHi: num(m.rideHi, Number.MAX_SAFE_INTEGER),
    rideRank: m.rideRank === 1 || m.rideRank === 2 ? m.rideRank : 0,
    ridePerf: num(m.ridePerf, 1000),
    ridePerfect: m.ridePerfect === true,
    rideTouch: m.rideTouch === true,
    rideOpenN: openIndex(m.rideOpenN),
    rideBonusN: openIndex(m.rideBonusN),
    rideBonusWon: m.rideBonusWon === true,
    rideGame: rideGameOf(m.rideGame),
    rideMs: num(m.rideMs, 120_000),
    fares: num(m.fares, FARES_CAP),
    visits: cleanVisits(m.visits),
    brass: num(m.brass, BRASS_CAP),
    ink: num(m.ink, INK_CAP),
    vellum: num(m.vellum, VELLUM_CAP),
    schematic: num(m.schematic, SCHEMATIC_CAP),
    press: num(m.press, PRESS_CAP),
    patterns: num(m.patterns, PATTERN_CAP),
    credit: cleanCredit(m.credit),
    lvl: num(m.lvl, 100),
    lvlInit: m.lvlInit === true,
    xp: num(m.xp, Number.MAX_SAFE_INTEGER),
    title: typeof m.title === "string" ? m.title.slice(0, 40) : "",
    color: typeof m.color === "string" ? m.color.slice(0, 16) : "",
    boosts: num(m.boosts, 99),
    gifts: num(m.gifts, 99),
    boostUntil: num(m.boostUntil, Number.MAX_SAFE_INTEGER),
    giftSeen: num(m.giftSeen, Number.MAX_SAFE_INTEGER),
  };
}

/** A cloth id the game actually has. Anything else is dropped. */
export function realCloth(id: string): ClothId | null {
  if (id === "road-dust" || id === "red-book" || id === "night-glass") return id;
  if (id.startsWith("scarf-") && Object.prototype.hasOwnProperty.call(CITIES, id.slice(6))) return id as ClothId;
  return null;
}

function cleanCloths(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) {
    const cloth = typeof id === "string" ? realCloth(id) : null;
    if (!cloth || out.includes(cloth)) continue;
    out.push(cloth);
    if (out.length >= CLOTH_CAP) break;
  }
  return out;
}

function capCities(u: CityUnlocks): CityUnlocks {
  const runs: CityUnlocks["runs"] = {};
  for (const [k, v] of Object.entries(u.runs)) runs[k as CityId] = Math.min(RUN_CAP, v ?? 0);
  return { ...u, passes: Math.min(PASS_CAP, u.passes), runs };
}

function cleanVisits(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || !isPlace(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= VISIT_CAP) break;
  }
  return out;
}

/** Coins, matches and passes on the way out of the database, not only on the way in. */
export function clampWallet(w: Omit<WalletState, "meta"> & { meta: unknown }): WalletState {
  const src = cleanKeys(w.keys);
  const keys = cleanKeys(null);
  for (const t of TIERS) keys[t] = Math.min(KEY_CAP, src[t] ?? 0);
  return {
    ...w,
    coins: Math.min(COIN_CAP, Math.max(0, Math.floor(Number(w.coins) || 0))),
    keys,
    cities: capCities(cleanUnlocks(w.cities)),
    meta: cleanMeta(w.meta),
  };
}

export function viewOf(w: WalletState) {
  return { coins: w.coins, keys: { ...w.keys }, cities: w.cities, credit: { ...w.meta.credit } };
}

/**
 * Coins, matches and tickets, whichever side is higher, then the cap.
 * Unlocked cities union, and only when the id is a real city.
 * Passes, atlas visits, craft stock, lucky, cloths and distance stay as the server has them.
 */
export function mergeFirstSync(server: WalletState, local: LocalSnap): WalletState {
  const lk = cleanKeys(local.keys);
  const keys = cleanKeys(null);
  for (const t of TIERS) keys[t] = Math.min(KEY_CAP, Math.max(server.keys[t] ?? 0, lk[t] ?? 0));
  const coins = Math.min(COIN_CAP, Math.max(server.coins, Math.min(FIRST_SYNC_COIN_CAP, num(local.coins, FIRST_SYNC_COIN_CAP))));
  const a = server.cities;
  const unlocked = [...a.unlocked];
  for (const id of cleanUnlocks(local.cities).unlocked) {
    if (!unlocked.includes(id)) unlocked.push(id);
  }
  const cities = capCities(
    cleanUnlocks({
      ...a,
      unlocked,
      freePick: unlocked.length < 2 ? a.freePick : false,
    }),
  );
  const meta = cleanMeta(server.meta);
  meta.fares = Math.min(FARES_CAP, Math.max(meta.fares, num(local.fares, FARES_CAP)));
  return { ...server, coins, keys, cities, meta, migrated: true };
}

function keyDiff(before: Record<Tier, number>, after: Record<Tier, number>): Partial<Record<Tier, number>> {
  const d: Partial<Record<Tier, number>> = {};
  for (const t of TIERS) {
    const n = (after[t] ?? 0) - (before[t] ?? 0);
    if (n) d[t] = n;
  }
  return d;
}

/** Apply a coin/match delta. A debit that would go below zero fails the whole op. Caps clamp credits. */
export function applyDelta(
  w: WalletState,
  d: { coins?: number; keys?: Partial<Record<Tier, number>>; cities?: CityUnlocks; meta?: Partial<WalletMeta> },
): OpResult {
  let coins = w.coins + (d.coins ?? 0);
  if (!Number.isFinite(coins) || coins < 0) return { ok: false, reason: "short-coins" };
  coins = Math.min(COIN_CAP, Math.floor(coins));
  const keys = cleanKeys(w.keys);
  for (const t of TIERS) {
    const n = d.keys?.[t] ?? 0;
    const next = (keys[t] ?? 0) + n;
    if (next < 0) return { ok: false, reason: "short-match" };
    keys[t] = Math.min(KEY_CAP, next);
  }
  const cities = d.cities ? capCities(cleanUnlocks(d.cities)) : capCities(w.cities);
  const meta = d.meta ? cleanMeta({ ...w.meta, ...d.meta }) : w.meta;
  return { ok: true, wallet: { ...w, coins, keys, cities, meta } };
}

export function spendMatchOp(w: WalletState, tier: Tier, n = 1): OpResult {
  const next = spendMatch(w.keys, tier, n);
  if (!next) return { ok: false, reason: "short-match" };
  return applyDelta(w, { keys: keyDiff(w.keys, next) });
}

export function refundMatchOp(w: WalletState, tier: Tier, n = 1): OpResult {
  const next = refundMatch(w.keys, tier, n);
  return applyDelta(w, { keys: keyDiff(w.keys, next) });
}

export function unlockOp(w: WalletState, cityId: CityId): OpResult {
  const r = unlockCity(w.cities, cityId);
  if (!r) return { ok: false, reason: "locked" };
  return applyDelta(w, { cities: r.u });
}

export function startOp(w: WalletState, cityId: CityId): OpResult {
  return applyDelta(w, { cities: chooseStart(w.cities, cityId) });
}

/** A graded visit the server recorded: a right answer whose grade row names the place. */
export function gradedPlace(detail: string | null | undefined): string | null {
  if (!detail) return null;
  try {
    const d = JSON.parse(detail) as { g?: unknown; pi?: unknown };
    if (d.g !== "perfect" && d.g !== "great" && d.g !== "good") return null;
    return typeof d.pi === "string" && d.pi ? d.pi : null;
  } catch {
    return null;
  }
}

/** One city pass when every place in the city has a server-graded visit. Once per city. */
export function goalOp(w: WalletState, cityId: CityId, visited: ReadonlySet<string>): OpResult {
  if (!w.cities.unlocked.includes(cityId)) return { ok: false, reason: "locked" };
  if (w.cities.goalsPaid.includes(cityId)) return { ok: true, wallet: w };
  const pois = CITIES[cityId]?.pois ?? [];
  if (!pois.length || !pois.every((p) => visited.has(p.id))) return { ok: false, reason: "unproven" };
  return applyDelta(w, { cities: { ...w.cities, goalsPaid: [...w.cities.goalsPaid, cityId], passes: w.cities.passes + 1 } });
}

export function bankOp(w: WalletState, dir: "up" | "down", tier: Tier): OpResult {
  const spec = dir === "up" ? bankUpSpec(tier) : bankDownSpec(tier);
  if (!spec) return { ok: false, reason: "no-trade" };
  const next = applyBank(w.keys, spec, matchCap);
  if (!next) return { ok: false, reason: "short-match" };
  return applyDelta(w, { keys: keyDiff(w.keys, next) });
}

export function scoutOp(w: WalletState, id: string): OpResult {
  const s = SCOUTS[id as keyof typeof SCOUTS];
  if (!s) return { ok: false, reason: "unknown" };
  if (!s.coins) return { ok: true, wallet: w };
  if (w.coins < s.coins) return { ok: false, reason: "short-coins" };
  return applyDelta(w, { coins: -s.coins });
}

export function kioskOp(w: WalletState, id: KioskId): OpResult {
  const item = KIOSK[id];
  if (!item) return { ok: false, reason: "unknown" };
  if (w.coins < item.cost) return { ok: false, reason: "short-coins" };
  if (id === "tinder" || id === "wick") {
    const tier: Tier = id === "wick" ? "blue" : "white";
    const add = id === "tinder" ? 2 : 1;
    // 0.0.97: no "pocket full" refusal; overflow becomes merge credits.
    return applyDelta(w, { coins: -item.cost, keys: { [tier]: add } });
  }
  if (id === "amber" || id === "oil") {
    const tier: Tier = id === "oil" ? "violet" : "amber";
    return applyDelta(w, { coins: -item.cost, keys: { [tier]: 1 } });
  }
  // Train ticket, press pass, atlas smear: coin only. The device keeps the non-wallet effect.
  return applyDelta(w, { coins: -item.cost });
}

export function printOp(w: WalletState, wardrobe: Wardrobe, id: CosmeticId, now: number): OpResult & { wardrobe?: Wardrobe } {
  const pay = payIn(wardrobe, w.keys, id, now);
  if (!pay) return { ok: false, reason: "short-match" };
  const applied = applyDelta(w, { keys: keyDiff(w.keys, pay.keys) });
  if (!applied.ok) return applied;
  return { ...applied, wardrobe: pay.wardrobe };
}

export function dailyOp(w: WalletState, _day: string, cityId: CityId): OpResult {
  const paid = payDaily(w.keys, w.coins);
  const runs = runFinished(w.cities, cityId);
  const diff = keyDiff(w.keys, paid.keys);
  return applyDelta(w, { coins: paid.points - w.coins, keys: diff, cities: runs.u });
}

export function friendOp(w: WalletState, n: number): OpResult {
  const paid = payFriend(w.keys, w.coins, n, matchCap("white"), payMatchesOf);
  return applyDelta(w, { coins: paid.points - w.coins, keys: keyDiff(w.keys, paid.keys) });
}

export function surveyOp(w: WalletState, id: string, proven: boolean): OpResult {
  const g = SURVEY_GOALS.find((x) => x.id === id);
  if (!g) return { ok: false, reason: "unknown" };
  if (!proven) return { ok: false, reason: "unproven" };
  return applyDelta(w, { keys: { [g.reward]: 1 } });
}

export function crateOp(w: WalletState, today: string): OpResult {
  if (w.meta.crateDay === today) return { ok: false, reason: "claimed" };
  const day = nextCrateStreak(w.meta.crateDay, w.meta.crateStreak, today);
  const loot = crateLoot(day);
  return applyDelta(w, { keys: loot, meta: { crateDay: today, crateStreak: day } });
}

/** Nonces from today's graded tokens. Unknown, repeated, or extra ones are dropped. At least one must remain. */
export function acceptNonces(asked: readonly string[], seen: ReadonlySet<string>): string[] | null {
  const out: string[] = [];
  for (const raw of asked) {
    if (typeof raw !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(raw)) continue;
    if (out.includes(raw) || !seen.has(raw)) continue;
    out.push(raw);
    if (out.length === 8) break;
  }
  return out.length ? out : null;
}

export function contractOp(w: WalletState, day: string, nonces: readonly string[]): OpResult {
  const n = w.meta.contractDay === day ? w.meta.contractN : 0;
  if (n >= 24) return { ok: false, reason: "capped" };
  if (nonces.length < CONTRACT_LAMPS) return { ok: false, reason: "unproven" };
  const applied = applyDelta(w, { coins: 1500, keys: { amber: 1 }, meta: { contractDay: day, contractN: n + 1 } });
  if (!applied.ok) return applied;
  return { ...applied, detail: JSON.stringify({ nonces: [...nonces] }) };
}

export function blitzOp(w: WalletState, day: string, step: number, nonces: readonly string[]): OpResult {
  if (step < 0 || step >= BLITZ_STEPS.length) return { ok: false, reason: "unknown" };
  if (!nonces.length) return { ok: false, reason: "unproven" };
  if (w.meta.blitzDay === day && w.meta.blitzStep !== step) return { ok: false, reason: "order" };
  if (w.meta.blitzDay && w.meta.blitzDay !== day && w.meta.blitzDay > day) return { ok: false, reason: "order" };
  const spec = BLITZ_STEPS[step]!;
  const grant = blitzMatch(spec.tier, w.keys[spec.tier] ?? 0, matchCap(spec.tier));
  const applied = applyDelta(w, {
    coins: spec.pay + grant.overflow,
    keys: grant.match ? { [spec.tier]: 1 } : {},
    meta: { blitzDay: day, blitzStep: step + 1 },
  });
  if (!applied.ok) return applied;
  return { ...applied, detail: JSON.stringify({ nonces: [...nonces] }) };
}

const MIN_RIDE_GAP_MS = 48_000;

/** One heartbeat can add at most this much tab-open time. The clock is the server's. */
const RIDE_WATCH_MS = 45_000;

export type RideDealInput = { game: string; n: number; seed: number };

/**
 * Pay a ride from the server's ticket clock. `departAt` / `arriveAt` / `now` are the ticket row
 * and the server clock. A win arrives only as `outcome`, already scored from a dealt round.
 * Tab-open time grows only when `watch` is set. Played and won pay only once play events
 * span at least half the ride, and never above the guest table.
 */
export function rideOp(
  w: WalletState,
  input: {
    departAt: number;
    arriveAt: number;
    now: number;
    watch?: boolean;
    play?: boolean;
    touch?: boolean;
    deal?: RideDealInput;
    outcome?: RideOutcome | null;
    /** 0.1.2: booked length when Hurry up shortened the ride (server ledger), for seat pay. */
    fullMs?: number;
  },
): OpResult {
  const departAt = num(input.departAt, Number.MAX_SAFE_INTEGER);
  const arriveAt = Math.min(departAt + FARE_MAX_MS, num(input.arriveAt, Number.MAX_SAFE_INTEGER));
  if (!(departAt > 0) || !(arriveAt > departAt)) return { ok: false, reason: "bad-ride" };
  const same = w.meta.rideAt === departAt;
  if (!same && w.meta.rideAt && departAt < w.meta.rideAt + MIN_RIDE_GAP_MS) return { ok: false, reason: "soon" };
  const now = num(input.now, Number.MAX_SAFE_INTEGER);
  const wallMs = Math.max(0, Math.min(now, arriveAt) - departAt);
  const rideLen = arriveAt - departAt;
  let open = same ? w.meta.rideOpen : 0;
  let seen = same ? w.meta.rideSeen : 0;
  if (input.watch) {
    const prev = seen > departAt ? seen : departAt;
    open = Math.min(FARE_MAX_MS, open + Math.min(RIDE_WATCH_MS, Math.max(0, now - prev)));
    seen = now;
  }
  let lo = same ? w.meta.rideLo : 0;
  let hi = same ? w.meta.rideHi : 0;
  let touch = same ? w.meta.rideTouch : false;
  let openN = same ? w.meta.rideOpenN : -1;
  let bonusN = same ? w.meta.rideBonusN : -1;
  let bonusWon = same ? w.meta.rideBonusWon : false;
  let game = same ? w.meta.rideGame : "";
  let roundMs = same ? w.meta.rideMs : 0;
  let best: RideOutcome = same ? storedRide(w.meta) : IDLE;
  let detail: string | undefined;
  if (input.deal) {
    const dealt = rideGameOf(input.deal.game);
    const left = arriveAt - Math.min(Math.max(now, departAt), arriveAt);
    const n = openN < 0 ? 0 : openN + 1;
    const bonus = bonusDue(departAt, arriveAt, now, bonusN);
    const ramp = rideRamp(n, bonus);
    const ms = dealt ? rideRoundMs(dealt, left, ramp) : null;
    if (!dealt || ms == null || n > 12 || n !== Math.floor(input.deal.n)) return { ok: false, reason: n !== Math.floor(input.deal.n) ? "busy" : "no-round" };
    openN = n;
    if (bonus) bonusN = n;
    game = dealt;
    roundMs = ms;
    touch = true;
    detail = JSON.stringify({ seed: input.deal.seed, n, ms, game: dealt, ramp, bonus });
  }
  if (input.outcome) best = betterOutcome(best, input.outcome);
  if (input.outcome?.kind === "won" && openN >= 0 && openN === bonusN) bonusWon = true;
  if (input.touch || input.outcome || input.deal) touch = true;
  if (touch && (input.deal || input.touch || input.outcome || input.play)) {
    const stamp = Math.min(arriveAt, Math.max(departAt, now));
    if (lo <= 0 || stamp < lo) lo = stamp;
    if (stamp > hi) hi = stamp;
  }
  const span = hi > lo ? hi - lo : 0;
  const playedOk = touch && hi > lo && span >= rideLen * 0.5;
  const paying: RideOutcome = !playedOk ? IDLE : best.kind === "won" ? best : { kind: "played" };
  const due0 = hurriedLoot(wallMs, open, rideLen, Math.min(FARE_MAX_MS, num(input.fullMs ?? rideLen, FARE_MAX_MS)), paying);
  const due = { ...due0, white: due0.white + (bonusWon ? RIDE_BONUS_WHITE : 0) };
  const have = same ? { white: w.meta.rideWhite, blue: w.meta.rideBlue, green: w.meta.rideGreen } : { white: 0, blue: 0, green: 0 };
  const owe = {
    white: Math.max(0, due.white - have.white),
    blue: Math.max(0, due.blue - have.blue),
    green: Math.max(0, due.green - have.green),
  };
  const paid = pocketRide(w.keys, owe);
  const gained = keyDiff(w.keys, paid.keys);
  const meta = {
    rideAt: departAt,
    rideWhite: due.white,
    rideBlue: due.blue,
    rideGreen: due.green,
    rideOpen: open,
    rideSeen: seen,
    rideLo: lo,
    rideHi: hi,
    rideTouch: touch,
    rideOpenN: openN,
    rideBonusN: bonusN,
    rideBonusWon: bonusWon,
    rideGame: game,
    rideMs: roundMs,
    ...rankOf(best),
  };
  const applied = !gained.white && !gained.blue && !gained.green ? applyDelta(w, { meta }) : applyDelta(w, { keys: gained, meta });
  if (!applied.ok || !detail) return applied;
  return { ...applied, detail };
}

function storedRide(m: WalletMeta): RideOutcome {
  if (m.rideRank >= 2) {
    const perf = Math.min(1, m.ridePerf / 1000);
    return m.ridePerfect ? { kind: "won", perf, perfect: true } : { kind: "won", perf };
  }
  if (m.rideRank === 1) return { kind: "played" };
  return IDLE;
}

function rankOf(o: RideOutcome): Pick<WalletMeta, "rideRank" | "ridePerf" | "ridePerfect"> {
  if (o.kind === "won") return { rideRank: 2, ridePerf: Math.round(Math.min(1, Math.max(0, o.perf)) * 1000), ridePerfect: Boolean(o.perfect) };
  if (o.kind === "played") return { rideRank: 1, ridePerf: 0, ridePerfect: false };
  return { rideRank: 0, ridePerf: 0, ridePerfect: false };
}

/**
 * One claim from the player's city-day list. The city has to be unlocked.
 * A night-market spot pays two matches while that city's market is open at `at`, the same pocket rule as a guest, and it is still one claim.
 */
export function streetOp(w: WalletState, city: CityId, tier: Tier, market = false, at = Date.now()): OpResult {
  if (!w.cities.unlocked.includes(city)) return { ok: false, reason: "locked" };
  const open = market && marketAt(city, at) != null;
  if (!open) return applyDelta(w, { keys: { [tier]: 1 } });
  const have = w.keys[tier] ?? 0;
  // 0.0.96: the first street match always lands; the market's second goes through the shared pocket rule.
  const first = { ...w.keys, [tier]: have + 1 };
  const second = payMatchesOf(first, tier, MARKET_MULT - 1);
  const keys: Partial<Record<Tier, number>> = { ...second.add, [tier]: (second.add[tier] ?? 0) + 1 };
  return applyDelta(w, { coins: second.coin, keys });
}

type StockCost = { brass?: number; ink?: number; vellum?: number; schematic?: number; press?: number; patterns?: number };

/** Take the craft's cost off the wallet. Short stock spends nothing. */
function spendStock(meta: WalletMeta, cost: StockCost): WalletMeta | null {
  const next = { ...meta };
  for (const key of ["brass", "ink", "vellum", "schematic", "press", "patterns"] as const) {
    const n = cost[key] ?? 0;
    if (n < 1) continue;
    if (next[key] < n) return null;
    next[key] -= n;
  }
  return next;
}

function redCities(visited: ReadonlySet<string> | undefined): number {
  if (!visited) return 0;
  let n = 0;
  for (const city of Object.values(CITIES)) {
    if (city.pois.some((p) => p.tier === "red" && visited.has(p.id))) n += 1;
  }
  return n;
}

/**
 * One real cloth, paid for in the same write.
 * Night glass spends a pattern and a press stock (0.1.22: or a pattern and a schematic). A scarf spends the circuit's three stock.
 * Road dust needs the 10 km the server already counted. The red book needs a red vault in every city.
 */
export function clothOp(w: WalletState, id: string, proof?: { meters?: number; visited?: ReadonlySet<string> }): OpResult {
  const cloth = realCloth(id);
  if (!cloth) return { ok: false, reason: "unknown" };
  if (w.meta.cloths.includes(cloth)) return { ok: true, wallet: w };
  if (w.meta.cloths.length >= CLOTH_CAP) return { ok: false, reason: "capped" };
  let meta = w.meta;
  if (cloth === "night-glass") {
    const spent = spendStock(meta, { patterns: 1, press: 1 }) ?? spendStock(meta, { patterns: 1, schematic: 1 });
    if (!spent) return { ok: false, reason: "short" };
    meta = spent;
  } else if (cloth.startsWith("scarf-")) {
    const city = cloth.slice(6) as CityId;
    if (!w.cities.unlocked.includes(city)) return { ok: false, reason: "locked" };
    const spent = spendStock(meta, { press: 3 });
    if (!spent) return { ok: false, reason: "short" };
    meta = spent;
  } else if (cloth === "road-dust") {
    const meters = Math.max(meta.walkM, proof?.meters ?? 0);
    if (meters < DUST_WALK_M) return { ok: false, reason: "unproven" };
  } else if (cloth === "red-book") {
    if (redCities(proof?.visited) < Object.keys(CITIES).length) return { ok: false, reason: "unproven" };
  }
  return applyDelta(w, { meta: { ...meta, cloths: [...meta.cloths, cloth] } });
}

export type GradePay = {
  correct: boolean;
  elapsedMs: number;
  /** Grade multiplier already decided by the server clock (1 / 0.7 / 0.4). */
  mult: number;
  city: CityId;
  diff: TriviaDiff;
  /** Tier a lamp clear pays on. Null for a spark. */
  clearTier: Tier | null;
  poiTier: Tier;
  poiId: string;
  lat: number;
  lng: number;
  series: "run" | "stack" | null;
  step: number;
  steps: number;
  /** Grades of the earlier cards in this Run/Stack, oldest first, not including this one. */
  prior: Array<"perfect" | "great" | "good">;
  /** Streak before this answer. */
  streak: number;
  loot: number;
  lucky: boolean;
  cloth: ClothId | null;
  charmDay: string;
  charmTopics: TriviaCat[];
  topic: TriviaCat | null;
  dealtAt: number;
  luckyHit: boolean;
  perfectBlue: boolean;
  /** 0.0.96: worn coat and the server's ability rolls (Raccoon blue drop, Plate refund). */
  scout?: ScoutId | null;
  rummage?: boolean;
  shellBack?: boolean;
  /** 0.1.00: the market light the SERVER found in this account's ledger (never from the client). */
  light?: LightId;
  /** 0.1.14: first right lamp today in this 800 m square (server-decided from its grade rows, see district.ts). */
  freshDistrict?: boolean;
};

function gradeLetter(ms: number): "perfect" | "great" | "good" {
  if (ms <= 3000) return "perfect";
  if (ms <= 10000) return "great";
  return "good";
}

function boostOf(p: GradePay, streakAfter: number) {
  return applyTriviaBoosts({
    correct: p.correct,
    elapsedMs: p.elapsedMs,
    topic: p.topic,
    streakAfter,
    charmDay: p.charmDay,
    charmTopics: p.charmTopics,
    now: new Date(p.dealtAt),
  });
}

function withBoost(w: WalletState, coins: number, keys: Partial<Record<Tier, number>>, boost: ReturnType<typeof applyTriviaBoosts>, cities?: CityUnlocks): OpResult & { award: AwardView } {
  const base = cleanKeys({ ...cleanKeys(null), ...keys });
  const paid = creditWhite({ ...w.keys, ...addKeys(w.keys, base) }, boost.white);
  const whiteAdded = paid.added;
  const awardKeys: Partial<Record<Tier, number>> = {};
  for (const t of TIERS) {
    const n = (base[t] ?? 0) + (t === "white" ? whiteAdded : 0);
    if (n) awardKeys[t] = n;
  }
  const award: AwardView = { coins: coins + boost.coins, keys: awardKeys, boosts: boost.labels };
  const applied = applyDelta(w, { coins: award.coins, keys: award.keys, ...(cities ? { cities } : {}) });
  if (!applied.ok) return { ...applied, award };
  return { ...applied, award };
}

function sumKeys(have: Record<Tier, number>, add: Partial<Record<Tier, number>>): Record<Tier, number> {
  const out = { ...have };
  for (const [t, n] of Object.entries(add) as [Tier, number][]) out[t] = (out[t] ?? 0) + (n ?? 0);
  return out;
}

function addKeys(have: Record<Tier, number>, add: Record<Tier, number>): Record<Tier, number> {
  const out = { ...have };
  for (const t of TIERS) if (add[t]) out[t] = (out[t] ?? 0) + add[t]!;
  return out;
}

/**
 * Coins and matches a graded card pays. Matches the street formulas (lamp, spark, Run/Stack,
 * boosts, night market, cloth) using only values the server sealed or rolled itself.
 */
export function gradeGrant(w: WalletState, p: GradePay): OpResult & { award?: AwardView } {
  if (!p.correct) return { ok: true, wallet: w, award: { coins: 0, keys: {}, boosts: [] } };
  const streakAfter = p.streak + 1;
  const boost = boostOf(p, streakAfter);
  const bonus = 1 + Math.min(0.4, streakAfter * 0.05);
  const spot = { kind: "lamp" as const, poiId: p.poiId, lat: p.lat, lng: p.lng };

  if (p.clearTier == null) {
    const tier = p.poiTier;
    const have = w.keys[tier] ?? 0;
    const cap = matchCap(tier);
    const mult = marketMult(p.city, p.dealtAt, spot);
    const owl = owlMatchCoin(p.scout ?? null, mult, tier, lightOf(p.light));
    // 0.0.96: the wick's match(es) go through the shared pocket rule: a full tier steps up (match ↑),
    // coin only when every allowed tier above is full.
    void have;
    void cap;
    const paid = payMatchesOf(w.keys, tier, mult);
    return withBoost(w, paid.coin + owl, paid.add, boost);
  }

  if (p.series) {
    const def = SERIES[p.series];
    const letter = gradeLetter(p.elapsedMs);
    const last = p.step + 1 >= p.steps;
    if (!last) return withBoost(w, 0, {}, boost);
    const grades = [...p.prior, letter];
    let mult = 0.4;
    if (grades.every((g) => g === "perfect")) mult = 1;
    else if (grades.filter((g) => g === "perfect" || g === "great").length >= 2) mult = 0.75;
    else if (grades.some((g) => g === "great" || g === "perfect")) mult = 0.55;
    const seriesCoin = rewardPoints(def.pay, { mult, bonus, loot: p.loot, series: true });
    const baseKeys: Partial<Record<Tier, number>> = { [def.pay]: 1 };
    if (grades.every((g) => g === "perfect")) baseKeys[def.bonus] = (baseKeys[def.bonus] ?? 0) + 1;
    else if (p.lucky && p.luckyHit) baseKeys.blue = (baseKeys.blue ?? 0) + 1;
    const sMult = marketMult(p.city, p.dealtAt, { kind: "series", lat: p.lat, lng: p.lng });
    const pay = marketPay(seriesCoin, baseKeys, sMult);
    pay.coin += owlExtraCoin(p.scout ?? null, sMult, seriesCoin, lightOf(p.light));
    // 0.0.90: reaching the last card means every card was right: the spent match comes back (not violet).
    const back = perfectBack(def.cost, sumKeys(w.keys, pay.keys));
    const sKeys = { ...pay.keys };
    if (back.match) sKeys[back.tier] = (sKeys[back.tier] ?? 0) + back.match;
    return withBoost(w, pay.coin + back.coin, sKeys, boost);
  }

  const lampCoin = rewardPoints(p.poiTier, {
    mult: p.mult,
    bonus,
    diffMult: DIFF_MULT[p.diff] ?? 1,
    loot: p.loot,
  });
  const tip = clothCoin(p.cloth, p.city, p.poiTier);
  const baseKeys: Partial<Record<Tier, number>> = {};
  if (p.lucky && p.luckyHit) baseKeys[p.poiTier] = 1;
  if (gradeLetter(p.elapsedMs) === "perfect" && p.perfectBlue) baseKeys.blue = (baseKeys.blue ?? 0) + 1;
  const lampMult = marketMult(p.city, p.dealtAt, spot);
  const pay = marketPay(lampCoin, baseKeys, lampMult);
  pay.coin += owlExtraCoin(p.scout ?? null, lampMult, lampCoin, lightOf(p.light));
  const lit = lampLit(w.cities, p.poiTier);
  // 0.0.90: a single-question lamp answered right is a perfect lamp: match back, same tier (not violet).
  const back = perfectBack(p.poiTier, sumKeys(w.keys, pay.keys));
  const lKeys = { ...pay.keys };
  if (back.match) lKeys[back.tier] = (lKeys[back.tier] ?? 0) + back.match;
  // 0.0.96 Raccoon (Rummager): a server-rolled blue match on top (overflow coin when the blue pocket is full).
  let rummageCoin = 0;
  if (p.rummage) {
    const have = { ...w.keys };
    for (const [t, n] of Object.entries(lKeys) as [Tier, number][]) have[t] = (have[t] ?? 0) + (n ?? 0);
    const r = payMatch(have, "blue");
    if (r.tier) lKeys[r.tier] = (lKeys[r.tier] ?? 0) + 1;
    rummageCoin = r.coin;
  }
  // 0.1.14: new-district bonus, a quarter of the base lamp coin. Never on a market lamp (no camping reward).
  const fresh = p.freshDistrict && lampMult === 1 ? freshDistrictCoin(lampCoin) : 0;
  const tagged = fresh ? { ...boost, labels: [...boost.labels, `${FRESH_DISTRICT_TAG} +${fresh}`] } : boost;
  return withBoost(w, pay.coin + tip + back.coin + rummageCoin + fresh, lKeys, tagged, lit.u);
}

/** Lucky and a quest cloth pay only when this wallet already records them. */
export function provenBoost(
  lucky: boolean,
  cloth: ClothId | null,
  owned: { lucky: boolean; cloths: ReadonlySet<string> },
): { lucky: boolean; cloth: ClothId | null } {
  return {
    lucky: lucky && owned.lucky,
    cloth: cloth && owned.cloths.has(cloth) ? cloth : null,
  };
}

export function clampLoot(n: number) {
  // 0.0.96: Fox and Penguin pay +10%; 1.01 stays for a client still on 0.0.95.
  if (Math.abs(n - 1.1) < 0.001) return 1.1;
  return Math.abs(n - 1.01) < 0.001 ? 1.01 : 1;
}

export function clampStreak(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(80, Math.floor(n));
}

export function clampCloth(id: string | null | undefined, city: CityId): ClothId | null {
  if (!id) return null;
  if (id === "road-dust" || id === "red-book" || id === "night-glass") return id;
  if (id === `scarf-${city}`) return id as ClothId;
  return null;
}

export { LUCKY_MATCH_CHANCE, PERFECT_BLUE_CHANCE };
