import { applyTriviaBoosts, creditWhite } from "./boosts.ts";
import { chooseStart, cleanUnlocks, freshUnlocks, lampLit, runFinished, unlockCity, type CityUnlocks } from "./cityPass.ts";
import { CITIES, KIOSK, SCOUTS, SERIES, type KioskId } from "./data.ts";
import { payIn, type CosmeticId, type Wardrobe } from "./cosmetics.ts";
import { payDaily } from "./dailyRun.ts";
import { BLITZ_STEPS, blitzMatch } from "./dailyBlitz.ts";
import { SURVEY_GOALS } from "./survey.ts";
import { marketMatches, marketMult, marketOverflowCoin, marketPay } from "./nightMarket.ts";
import { cleanKeys, refundMatch, spendMatch } from "./matchSpend.ts";
import { clothCoin, type ClothId } from "./quests.ts";
import { applyBank, bankDownSpec, bankUpSpec, rewardPoints } from "./rewards.ts";
/** Same table as triviaMeta DIFF_MULT. Inlined so this module doesn't pull the street graph into node tests. */
const DIFF_MULT: Record<number, number> = { 1: 0.7, 2: 1, 3: 1.45 };
import type { CityId, Tier, TriviaCat, TriviaDiff } from "./types.ts";
import { LUCKY_MATCH_CHANCE, PERFECT_BLUE_CHANCE } from "./vaultPay.ts";
import { crateLoot, nextCrateStreak, CRATE_MAX } from "./crate.ts";
import { payFriend } from "./friendTicket.ts";
import { FARE_MAX_MS, matchCap, pocketRide, transitLoot } from "./ticket.ts";

/**
 * 0.0.78 server wallet. Coins, matches (`keys`), city unlocks and city passes.
 * Pure: the database adapter (walletSql) applies the result once per op key.
 * Guests never call this.
 */

/** First sync clamps each device to these before it can raise the server pocket. */
export const COIN_CAP = 250_000;
export const KEY_CAP = 300;
export const PASS_CAP = 25;
export const RUN_CAP = 9_999;
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
});

export function emptyWallet(): WalletState {
  return { coins: 0, keys: cleanKeys(null), cities: freshUnlocks(), meta: emptyMeta(), migrated: false, version: 0 };
}

function num(v: unknown, cap: number) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(cap, Math.floor(n));
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
  };
}

function capCities(u: CityUnlocks): CityUnlocks {
  const runs: CityUnlocks["runs"] = {};
  for (const [k, v] of Object.entries(u.runs)) runs[k as CityId] = Math.min(RUN_CAP, v ?? 0);
  return { ...u, passes: Math.min(PASS_CAP, u.passes), runs };
}

export function viewOf(w: WalletState) {
  return { coins: w.coins, keys: { ...w.keys }, cities: w.cities };
}

/** Higher of each balance, then the cap. Cities and paid goals union. Never lowers a counter, and never sums. */
export function mergeFirstSync(server: WalletState, local: LocalSnap): WalletState {
  const lk = cleanKeys(local.keys);
  const keys = cleanKeys(null);
  for (const t of TIERS) keys[t] = Math.min(KEY_CAP, Math.max(server.keys[t] ?? 0, lk[t] ?? 0));
  const coins = Math.min(COIN_CAP, Math.max(server.coins, num(local.coins, COIN_CAP)));
  const b = cleanUnlocks(local.cities);
  const a = server.cities;
  const unlocked = [...new Set([...a.unlocked, ...b.unlocked])];
  const start = a.start ?? b.start;
  if (start && !unlocked.includes(start)) unlocked.unshift(start);
  const runs: CityUnlocks["runs"] = { ...a.runs };
  for (const [k, v] of Object.entries(b.runs)) {
    const id = k as CityId;
    runs[id] = Math.min(RUN_CAP, Math.max(runs[id] ?? 0, v ?? 0));
  }
  const cities = capCities(
    cleanUnlocks({
      start,
      unlocked,
      freePick: unlocked.length < 2,
      passes: Math.max(a.passes, b.passes),
      lampPts: Math.max(a.lampPts, b.lampPts),
      goalsPaid: [...new Set([...a.goalsPaid, ...b.goalsPaid])],
      runsPaid: [...new Set([...a.runsPaid, ...b.runsPaid])],
      runs,
    }),
  );
  const meta = cleanMeta(server.meta);
  const localCrate = typeof local.crateDay === "string" ? local.crateDay.slice(0, 10) : "";
  if (localCrate && (!meta.crateDay || localCrate > meta.crateDay)) {
    meta.crateDay = localCrate;
    meta.crateStreak = num(local.crateStreak, CRATE_MAX);
  } else if (localCrate && localCrate === meta.crateDay) {
    meta.crateStreak = Math.max(meta.crateStreak, num(local.crateStreak, CRATE_MAX));
  }
  const localBlitz = typeof local.blitzDay === "string" ? local.blitzDay.slice(0, 10) : "";
  if (localBlitz && (!meta.blitzDay || localBlitz > meta.blitzDay)) {
    meta.blitzDay = localBlitz;
    meta.blitzStep = num(local.blitzStep, BLITZ_STEPS.length);
  } else if (localBlitz && localBlitz === meta.blitzDay) {
    meta.blitzStep = Math.max(meta.blitzStep, num(local.blitzStep, BLITZ_STEPS.length));
  }
  if (local.wheel) {
    for (const t of TIERS) meta.wheel[t] = Math.max(meta.wheel[t] ?? 0, num(local.wheel[t], 100_000));
  }
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
  if (d.keys) {
    for (const t of TIERS) {
      const n = d.keys[t];
      if (!n) continue;
      const next = (keys[t] ?? 0) + n;
      if (next < 0) return { ok: false, reason: "short-match" };
      keys[t] = Math.min(KEY_CAP, next);
    }
  }
  const cities = d.cities ? capCities(cleanUnlocks(d.cities)) : w.cities;
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
    const room = Math.max(0, matchCap(tier) - (w.keys[tier] ?? 0));
    const n = Math.min(add, room);
    if (n < 1) return { ok: false, reason: "full" };
    return applyDelta(w, { coins: -item.cost, keys: { [tier]: n } });
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
  const paid = payFriend(w.keys, w.coins, n, matchCap("white"));
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
  if (!nonces.length) return { ok: false, reason: "unproven" };
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

/**
 * Pay a ride from the server's ticket clock. `departAt` / `arriveAt` / `now` are the ticket row
 * and the server clock. The idle schedule is the only one: a client win or a tab-open timer is not a payout.
 */
export function rideOp(w: WalletState, input: { departAt: number; arriveAt: number; now: number }): OpResult {
  const departAt = num(input.departAt, Number.MAX_SAFE_INTEGER);
  const arriveAt = Math.min(departAt + FARE_MAX_MS, num(input.arriveAt, Number.MAX_SAFE_INTEGER));
  if (!(departAt > 0) || !(arriveAt > departAt)) return { ok: false, reason: "bad-ride" };
  const same = w.meta.rideAt === departAt;
  if (!same && w.meta.rideAt && departAt < w.meta.rideAt + MIN_RIDE_GAP_MS) return { ok: false, reason: "soon" };
  const wallMs = Math.max(0, Math.min(num(input.now, Number.MAX_SAFE_INTEGER), arriveAt) - departAt);
  const rideMs = arriveAt - departAt;
  const due = transitLoot(wallMs, 0, rideMs);
  const have = same ? { white: w.meta.rideWhite, blue: w.meta.rideBlue, green: w.meta.rideGreen } : { white: 0, blue: 0, green: 0 };
  const owe = {
    white: Math.max(0, due.white - have.white),
    blue: Math.max(0, due.blue - have.blue),
    green: Math.max(0, due.green - have.green),
  };
  const paid = pocketRide(w.keys, owe);
  const gained = keyDiff(w.keys, paid.keys);
  const meta = { rideAt: departAt, rideWhite: due.white, rideBlue: due.blue, rideGreen: due.green };
  if (!gained.white && !gained.blue && !gained.green) return applyDelta(w, { meta });
  return applyDelta(w, { keys: gained, meta });
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
    if (have >= cap) return withBoost(w, 12 * mult, {}, boost);
    const add = marketMatches(have, cap, mult);
    const coin = mult > 1 && have < cap ? marketOverflowCoin(tier, mult, add) : 0;
    return withBoost(w, coin, { [tier]: add }, boost);
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
    return withBoost(w, pay.coin, pay.keys, boost);
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
  const lit = lampLit(w.cities, p.poiTier);
  return withBoost(w, pay.coin + tip, pay.keys, boost, lit.u);
}

/**
 * Lucky and a quest cloth pay only when the server has a record that this player owns them.
 * Nothing in the database records either today, so a grade treats both as none.
 */
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
