import { hasShield, streakRun } from "./scoutPerks.ts";
import { marketMult } from "./nightMarket.ts";
import { districtOf, districtsInDetails, isFreshDistrict } from "./district.ts";
import { carOf, isCarId, type CarId } from "./cars.ts";
import { HOME_LAMPS, KEY_MATCHES, houseCost, houseOf, isHouseTier, houseRank, type HouseState } from "./houses.ts";
import { cityDay } from "./vaultStack.ts";
import { CAN_ODDS, canId, colorOf, paintPrice, parseCan, rollCan, type Can } from "./carPaint.ts";
import { LONG_IDS, applyLegacy, claimQuest, luckyLive, type LegacyGrant, type LegacyIn, type LongId } from "./questServer.ts";
import { periodOf } from "./questPeriods.ts";
import { GOAL_ALL_PROOF_RIGHT, GOAL_ALL_TIER, GOAL_COIN, GOAL_PROOF_RIGHT, cachePrize, goalDay, payMatch, payMatches, payMatchesOf, streakPrize } from "./goals.ts";
import { PASS_GIFT_KEY, giftPass } from "./cityPass.ts";
import type { Sql } from "../lib/db.ts";
import { groupIds } from "./playerLinks.ts";
import { mutateWallet, canonicalWallet, priorGrades, type MutateResult } from "./walletSql.ts";
import {
  acceptNonces,
  applyDelta,
  PASS_CAP,
  bankOp,
  blitzOp,
  clothOp,
  contractOp,
  crateOp,
  dailyOp,
  friendOp,
  goalOp,
  gradeGrant,
  gradedPlace,
  kioskOp,
  mergeFirstSync,
  printOp,
  provenBoost,
  refundMatchOp,
  rideOp,
  scoutOp,
  spendMatchOp,
  startOp,
  streetOp,
  surveyOp,
  unlockOp,
  viewOf,
  type AwardView,
  type GradePay,
  type LocalSnap,
  type OpResult,
  type WalletState,
} from "./wallet.ts";
import { CITIES, SCOUTS, type KioskId } from "./data.ts";
import type { ScoutId } from "./types.ts";
import { rideSeed, scoreRide, type RideMoves } from "./rideGrade.ts";
import { rideRamp } from "./rideGames.ts";
import { MARKET_LIGHTS, bestLight, nextLight, type LightId } from "./marketLights.ts";
import { THANKS_CAR, THANKS_CAR_COIN, THANKS_CAR_KEY, THANKS_GIFT_KEY, thanksClock, THANKS_HOUSE, THANKS_HOUSE_COIN, THANKS_HOUSE_KEY, thanksCity, thanksNote, type ThanksCar, type ThanksHouse } from "./thanksGift.ts";
import { COIN_CAP } from "./wallet.ts";
import { SCOUT_GIFTS, type ScoutGift, MATCH_GIFTS, giftsFor, type MatchGift } from "./matchGift.ts";
import type { RideGameId } from "./rideGames.ts";
import { cleanWardrobe, type CosmeticId, type Wardrobe } from "./cosmetics.ts";
import { WARDROBE_UPSERT } from "./wardrobeSql.ts";
import { buildWheel, grantWheelPrize, WHEEL_EVERY } from "./wheel.ts";
import { isPlace, surveyProven } from "./survey.ts";
import { parseStreetId, STREET_DAY_CAP, STREET_FRESH_MS, streetSpot } from "./streetSpots.ts";
import { MAGNET_DAY_CAP, MAGNET_GAP_MS, v2lPays } from "./carPerks.ts";
import { fareMs, FARES_CAP, lampCoolMs, sparkAllowed, sparkTier, hurryCost, hurryTarget, VAULTS_PER_FARE } from "./ticket.ts";
import { BLITZ_STEPS, CONTRACT_LAMPS } from "./dailyBlitz.ts";
import type { CityId, Tier } from "./types.ts";
import { OWN_CLAIM_USER, OWN_DAILY_CAP, OWN_PRICE, ownPayFor, type OwnedLamp } from "./ownLamps.ts";
import { standingName } from "./standingName.ts";
import { LOVE_COIN, LOVE_EMAIL, LOVE_X_ID, LOVE_X_NAME, LOVE_GIFT_KEY, LOVE_NOTE, DOUBLE_MS, GIFT_TIERS, LAMP_GIFTS, WELCOME_COIN, WELCOME_HOUSE, WELCOME_KEY, giftKeysFor, lampGiftClock, lampGiftNote, welcomeClock, welcomeNote } from "./lampGift.ts";

/** What the browser is allowed to see. */
export type WalletView = { coins: number; keys: Record<Tier, number>; cities: WalletState["cities"]; credit?: Partial<Record<Tier, number>> };

export type Applied = MutateResult & { view: WalletView; authoritative: boolean };

function applied(r: MutateResult): Applied {
  return { ...r, view: viewOf(r.wallet), authoritative: r.wallet.migrated };
}

/** One device may merge its local save once, plus one revise. A sixth device is ignored. */
export const DEVICE_CAP = 5;
const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;

export type SyncApplied = Applied & { deviceClosed: boolean; playerId: string; giftNotes?: string[]; doubleUntil?: number; owned?: { scouts: ScoutId[]; charms: string[]; cloths: string[]; lights?: string[]; cars?: string[]; cans?: string[]; paint?: Partial<Record<CarId, string>>; houses?: Partial<Record<CityId, HouseState>>; homeClaims?: string[] } };

function deviceOf(opKey: string): string | null {
  if (opKey.startsWith("migrate-revise:")) return opKey.slice("migrate-revise:".length);
  if (opKey.startsWith("migrate:")) return opKey.slice("migrate:".length);
  return null;
}

/** First sync on this device takes the max, then one revise so a reward landing mid-sync is not dropped. */
/** 0.0.90: one free city pass per player, once (ledger key makes a second call a no-op). */
export async function grantPassGift(sql: Sql, userId: string): Promise<MutateResult> {
  return mutateWallet(sql, userId, PASS_GIFT_KEY, (w) =>
    applyDelta(w, { cities: giftPass(w.cities, PASS_CAP) }),
  );
}

/** 0.0.95: pay any one-time match gift addressed to this player (session or primary id). Notes for gifts paid just now. */
export async function grantMatchGifts(sql: Sql, userId: string, list: readonly MatchGift[] = MATCH_GIFTS): Promise<string[]> {
  const { id } = await canonicalWallet(sql, userId);
  const notes: string[] = [];
  for (const g of giftsFor([userId, id], list)) {
    const r = await mutateWallet(sql, userId, g.key, (w) => {
      const paid = payMatchesOf(w.keys, g.tier, g.n);
      return applyDelta(w, { keys: paid.add, coins: paid.coin });
    });
    if (r.ok && !r.replay) notes.push(g.note);
  }
  return notes;
}

/** When this account's first ledger row was written (gift rows excluded), or null for a wallet with no rows yet. */
async function firstRowAt(sql: Sql, id: string): Promise<number | null> {
  const first = await sql<{ t: unknown }>`
    select min(created_at) as t from wallet_ledger where user_id = ${id} and op_key not like ${"gift:lamp-%"} and op_key <> ${WELCOME_KEY}
  `;
  const t0 = first[0]?.t;
  if (t0 == null) return null;
  const at = new Date(t0 instanceof Date ? t0.getTime() : String(t0)).getTime();
  return Number.isFinite(at) ? at : null;
}

/** 0.1.43 / 0.1.44: the current-player gift lanterns (lampGift.ts LAMP_GIFTS, who "current"); one note for what's new. */
export async function grantLampGift(sql: Sql, userId: string): Promise<string[]> {
  const { id } = await canonicalWallet(sql, userId);
  const at = await firstRowAt(sql, id);
  if (at == null || !(at < Date.parse(lampGiftClock.cutoff))) return [];
  const fresh: Tier[] = [];
  for (const g of LAMP_GIFTS.filter((x) => x.who === "current")) {
    const r = await mutateWallet(sql, userId, g.key, (w) => ({ ...applyDelta(w, {}), detail: JSON.stringify({ lamp: g.tier }) }));
    if (r.ok && !r.replay) fresh.push(g.tier);
  }
  return fresh.length ? [lampGiftNote(fresh)] : [];
}

/**
 * 0.1.44: the welcome pack for a new player (first ledger row at or after welcomeClock.cutoff), once, on a sync after
 * the wallet exists: a cottage in the starting city (if no house there yet), WELCOME_COIN, a free white lantern
 * (gift:lamp-0144-new-white) and double coin for the first hour (walletSql.mutateWallet reads `start` off this row).
 */
export async function grantWelcomePack(sql: Sql, userId: string, localStart: CityId | null): Promise<string[]> {
  const { id, wallet } = await canonicalWallet(sql, userId);
  const at = await firstRowAt(sql, id);
  if (at == null || at < Date.parse(welcomeClock.cutoff)) return [];
  const city = thanksCity(wallet.cities, localStart && localStart in CITIES ? localStart : null);
  const has = city ? ((await housesOf(sql, userId))[city]?.tier ?? null) : null;
  const house = Boolean(city && !has);
  const r = await mutateWallet(sql, userId, WELCOME_KEY, (w) => ({ ...applyDelta(w, { coins: WELCOME_COIN }), detail: JSON.stringify({ start: at, city, house, coin: WELCOME_COIN }) }));
  if (!r.ok || r.replay) return [];
  if (house && city) await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${`house:${city}:${WELCOME_HOUSE}`}, ${JSON.stringify({ city, tier: WELCOME_HOUSE, from: null, gift: true })}) on conflict (user_id, op_key) do nothing`;
  for (const g of LAMP_GIFTS.filter((x) => x.who === "new")) await mutateWallet(sql, userId, g.key, (w) => ({ ...applyDelta(w, {}), detail: JSON.stringify({ lamp: g.tier }) }));
  return [welcomeNote(house && city ? CITIES[city].name : null)];
}

/** 0.1.45: the one-time love gift. Only an account whose "user".email is hers (this login or the wallet it links to). */
export async function grantLoveGift(sql: Sql, userId: string): Promise<string[]> {
  try {
    const { id } = await canonicalWallet(sql, userId);
    const rows = await sql<{ email: string | null }>`select email from "user" where id = ${userId} or id = ${id}`;
    const byEmail = rows.some((r) => {
      const e = (r.email ?? "").trim().toLowerCase();
      return e === LOVE_EMAIL || e.includes(LOVE_X_ID);
    });
    const x = byEmail
      ? []
      : await sql<{ account_id: string; name: string | null }>`select a."accountId" as account_id, u.name from account a join "user" u on u.id = a."userId" where a."providerId" = ${"grok-x"} and (a."userId" = ${userId} or a."userId" = ${id})`;
    const byX = x.some((r) => r.account_id === LOVE_X_ID || (r.name ?? "").trim().toLowerCase() === LOVE_X_NAME);
    if (!byEmail && !byX) return [];
    let clamped = false;
    const r = await mutateWallet(sql, userId, LOVE_GIFT_KEY, (w) => {
      const next = applyDelta(w, { coins: LOVE_COIN });
      if (!next.ok) return next;
      const paid = next.wallet.coins - w.coins;
      clamped = paid < LOVE_COIN;
      return { ...next, detail: JSON.stringify({ coin: LOVE_COIN, paid }) };
    });
    if (!r.ok || r.replay) return [];
    return [clamped ? `${LOVE_NOTE} (your coins were near the cap, so this filled them to the top)` : LOVE_NOTE];
  } catch (e) {
    console.warn("[wallet] love gift skipped", e instanceof Error ? e.message : e);
    return [];
  }
}

/** 0.1.44: when a new player's double-coin hour ends (ms), or 0 when there is none or it is over. */
export async function doubleUntil(sql: Sql, userId: string): Promise<number> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${WELCOME_KEY} limit 1`;
  let start = 0;
  try {
    start = Number((JSON.parse(rows[0]?.detail ?? "{}") as { start?: number }).start) || 0;
  } catch {
    start = 0;
  }
  const end = start ? start + DOUBLE_MS : 0;
  return end > welcomeClock.now() ? end : 0;
}

/** 0.1.43: gifted lanterns this account may still place (granted, not yet claimed). */
export async function lampGiftsOpen(sql: Sql, userId: string): Promise<string[]> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and (op_key like ${"gift:lamp-%"} or op_key like ${"ownfree:%"})`;
  const keys = new Set(rows.map((r) => r.op_key));
  return GIFT_TIERS.filter((t) => giftKeysFor(t).some((k) => keys.has(k)) && !keys.has(`ownfree:${t}`));
}

/**
 * 0.1.39: the one-time thank-you gift (thanksGift.ts). Keyed to the canonical wallet id, so linked sign-ins share it.
 * Only for accounts whose earliest ledger row predates THANKS_GIFT_CUTOFF. Each half is its own idempotent key; the
 * car/house rows are written like a purchase (car:f150, house:<city>:town) with detail { gift: true } and 0 coin.
 */
export async function grantThanksGift(sql: Sql, userId: string, localStart: CityId | null = null): Promise<string[]> {
  const { id, wallet } = await canonicalWallet(sql, userId);
  const first = await sql<{ t: unknown }>`
    select min(created_at) as t from wallet_ledger where user_id = ${id} and op_key not like ${"gift:thanks-0139%"}
  `;
  const t0 = first[0]?.t;
  if (t0 == null) return [];
  const at = new Date(t0 instanceof Date ? t0.getTime() : String(t0)).getTime();
  if (!(at < Date.parse(thanksClock.cutoff))) return [];
  let car: ThanksCar | null = null;
  let house: ThanksHouse | null = null;
  const lost = { car: 0, house: 0 };
  const pay = (w: WalletState, coin: number, half: "car" | "house") => {
    lost[half] = Math.max(0, Math.min(coin, w.coins + coin - COIN_CAP));
    return applyDelta(w, { coins: coin });
  };
  const hasCar = (await carsOf(sql, userId)).includes(THANKS_CAR);
  const c = await mutateWallet(sql, userId, THANKS_CAR_KEY, (w) => ({ ...pay(w, hasCar ? THANKS_CAR_COIN : 0, "car"), detail: JSON.stringify({ car: THANKS_CAR, coin: hasCar ? THANKS_CAR_COIN : 0 }) }));
  if (c.ok && !c.replay) {
    car = hasCar ? "coin" : "given";
    if (!hasCar) await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:" + THANKS_CAR}, ${JSON.stringify({ car: THANKS_CAR, gift: true })}) on conflict (user_id, op_key) do nothing`;
  }
  const city = thanksCity(wallet.cities, localStart && localStart in CITIES ? localStart : null);
  const owned = city ? ((await housesOf(sql, userId))[city]?.tier ?? null) : null;
  const coinHouse = !city || houseRank(owned) >= houseRank(THANKS_HOUSE);
  const h = await mutateWallet(sql, userId, THANKS_HOUSE_KEY, (w) => ({ ...pay(w, coinHouse ? THANKS_HOUSE_COIN : 0, "house"), detail: JSON.stringify({ city, from: owned, coin: coinHouse ? THANKS_HOUSE_COIN : 0 }) }));
  if (h.ok && !h.replay) {
    house = coinHouse ? "coin" : owned ? "upgraded" : "given";
    if (!coinHouse && city) await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${`house:${city}:${THANKS_HOUSE}`}, ${JSON.stringify({ city, tier: THANKS_HOUSE, from: owned, gift: true })}) on conflict (user_id, op_key) do nothing`;
  }
  if (!car && !house) return [];
  const note = thanksNote({ car, house, cityName: city ? CITIES[city].name : null, lost: (car ? lost.car : 0) + (house ? lost.house : 0), cap: COIN_CAP });
  await mutateWallet(sql, userId, THANKS_GIFT_KEY, (w) => ({ ...applyDelta(w, {}), detail: note }));
  return [note];
}

/** 0.0.95: restore a gifted scout once, refunding duplicate server-recorded purchases of it. */
export async function grantScoutGifts(sql: Sql, userId: string, list: readonly ScoutGift[] = SCOUT_GIFTS): Promise<string[]> {
  const { id } = await canonicalWallet(sql, userId);
  const notes: string[] = [];
  for (const g of list.filter((x) => x.userId === userId || x.userId === id)) {
    const rows = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"scout:" + g.scout + "%"}`;
    const dupes = Math.max(0, Number(rows[0]?.n ?? 0) - 1);
    const coin = dupes * g.refund;
    const r = await mutateWallet(sql, userId, g.key, (w) => ({ ...applyDelta(w, { coins: coin }), detail: JSON.stringify({ scout: g.scout, dupes, coin }) }));
    if (r.ok && !r.replay) notes.push(coin ? `${g.note} Refund for ${dupes} extra purchase${dupes === 1 ? "" : "s"}: +${coin.toLocaleString("en-US")} coin.` : g.note);
  }
  return notes;
}

/**
 * 0.0.95: what this account owns, from the server's own records, so a purchase survives logout and shows on
 * every device: scouts bought (scout:<id>) or restored (scout gifts), charms crafted (charm:<id>), cloths in meta.
 */
export async function ownedOf(sql: Sql, userId: string): Promise<{ scouts: ScoutId[]; charms: string[]; cloths: string[] }> {
  const { id, wallet } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string }>`
    select op_key from wallet_ledger where user_id = ${id} and (op_key like ${"scout:%"} or op_key like ${"charm:%"} or op_key like ${"gift:%"})
  `;
  const scouts = new Set<ScoutId>();
  const charms = new Set<string>();
  for (const { op_key: k } of rows) {
    if (k.startsWith("scout:")) {
      const s = k.slice(6);
      if (s in SCOUTS) scouts.add(s as ScoutId);
    } else if (k === "charm:lucky") charms.add("lucky");
    else {
      const g = SCOUT_GIFTS.find((x) => x.key === k);
      if (g) scouts.add(g.scout);
    }
  }
  // 0.1.22: Lucky is the only charm left; it is owned when the wallet says so (crafted before, or kept through the legacy move).
  if (wallet.meta.lucky) charms.add("lucky");
  return { scouts: [...scouts], charms: [...charms], cloths: [...(wallet.meta.cloths ?? [])] };
}

/** 0.1.8: cars this account bought (car:<id> ledger rows). No table of its own, so nothing to migrate. */
export async function carsOf(sql: Sql, userId: string): Promise<CarId[]> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${"car:%"}`;
  return [...new Set(rows.map((r) => r.op_key.slice(4)).filter(isCarId))];
}

/**
 * 0.1.9: paint cans this account holds (can:* rows not yet spent by a paint:<can key> row) and each car's color
 * (the newest paint row per car). Ledger only, like cars: nothing to migrate.
 */
export async function paintOf(sql: Sql, userId: string): Promise<{ cans: { key: string; can: Can }[]; paint: Partial<Record<CarId, string>> }> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string; detail: string }>`
    select op_key, detail from wallet_ledger where user_id = ${id} and (op_key like ${"can:%"} or op_key like ${"paint:%"}) order by created_at asc, op_key asc
  `;
  const spent = new Set<string>();
  const paint: Partial<Record<CarId, string>> = {};
  for (const r of rows) {
    if (!r.op_key.startsWith("paint:")) continue;
    spent.add(r.op_key.slice(6));
    const c = canOfDetail(r.detail);
    if (c) paint[c.car] = c.color;
  }
  const cans = rows.filter((r) => r.op_key.startsWith("can:") && !spent.has(r.op_key)).flatMap((r) => {
    const can = canOfDetail(r.detail);
    return can ? [{ key: r.op_key, can }] : [];
  });
  return { cans, paint };
}

function canOfDetail(detail: string): Can | null {
  try {
    const d = JSON.parse(detail || "null") as { can?: string } | null;
    return parseCan(d?.can);
  } catch {
    return null;
  }
}

/** 0.1.9: maybe drop a paint can (server roll). key is can:<source>, so a replay never drops a second one. */
export async function grantCan(sql: Sql, userId: string, source: string, odds: number, roll: number, pick: number): Promise<Can | null> {
  if (!(roll < odds)) return null;
  const can = rollCan(pick);
  const r = await mutateWallet(sql, userId, `can:${source}`, (w) => ({ ...applyDelta(w, {}), detail: JSON.stringify({ can: canId(can) }) }));
  return r.ok && !r.replay ? can : null;
}

/** 0.1.12: houses this account owns (house:<city>:<tier> rows; the highest tier per city wins). */
export async function housesOf(sql: Sql, userId: string): Promise<Partial<Record<CityId, HouseState>>> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${"house:%"}`;
  const out: Partial<Record<CityId, HouseState>> = {};
  for (const r of rows) {
    const [, city, tier] = r.op_key.split(":");
    if (!city || !(city in CITIES) || !isHouseTier(tier)) continue;
    const c = city as CityId;
    if (houseRank(tier) > houseRank(out[c]?.tier)) out[c] = { tier };
  }
  return out;
}

/** 0.1.12: recent key claims (hook:<city>:<day> keys from the last two days). */
export async function homeClaimsOf(sql: Sql, userId: string): Promise<string[]> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string }>`
    select op_key from wallet_ledger where user_id = ${id} and op_key like ${"hook:%"}
      and created_at >= ${new Date(Date.now() - 50 * 3600_000).toISOString()}
  `;
  return rows.map((r) => r.op_key);
}

/** 0.1.12: correct lamps in this city on its local day (grade rows carry c = city from 0.1.12). */
export async function lampsToday(sql: Sql, userId: string, city: CityId, now = Date.now()): Promise<number> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ detail: string; created_at: unknown }>`
    select detail, created_at from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"}
      and created_at >= ${new Date(now - 30 * 3600_000).toISOString()} and detail like ${`%"c":"${city}"%`}
  `;
  const day = cityDay(city, now);
  return rows.filter((r) => !String(r.detail).includes('"g":"miss"') && cityDay(city, new Date(String(r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at)).getTime()) === day).length;
}

/** 0.1.14: district squares of today's right lamps in this city (city-local day). `id` is the canonical wallet id. */
async function districtsToday(sql: Sql, id: string, city: CityId, now = Date.now()): Promise<string[]> {
  const rows = await sql<{ detail: string; created_at: unknown }>`
    select detail, created_at from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"}
      and created_at >= ${new Date(now - 30 * 3600_000).toISOString()} and detail like ${`%"c":"${city}"%`}
  `;
  const day = cityDay(city, now);
  const today = rows.filter((r) => cityDay(city, new Date(String(r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at)).getTime()) === day);
  return districtsInDetails(today.map((r) => String(r.detail)));
}

/** 0.1.00: market lights this account bought (light:<id> ledger rows); amber is free. */
export async function lightsOf(sql: Sql, userId: string): Promise<{ ids: LightId[]; best: LightId }> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${"light:%"}`;
  const ids: LightId[] = ["amber", ...rows.map((r) => r.op_key.slice(6) as LightId).filter((x) => MARKET_LIGHTS.some((l) => l.id === x))];
  return { ids: [...new Set(ids)], best: bestLight(ids).id };
}

export async function syncPlayer(sql: Sql, userId: string, local: LocalSnap, deviceId: string): Promise<SyncApplied> {
  await grantPassGift(sql, userId);
  const giftNotes = [...(await grantMatchGifts(sql, userId)), ...(await grantScoutGifts(sql, userId)), ...(await grantThanksGift(sql, userId, startOfLocal(local))), ...(await grantLampGift(sql, userId))];
  const done = await syncCore(sql, userId, local, deviceId);
  // 0.1.44: the welcome pack needs the wallet's first row, so it runs after the first sync wrote it.
  giftNotes.push(...(await grantWelcomePack(sql, userId, startOfLocal(local))));
  giftNotes.push(...(await grantLoveGift(sql, userId)));
  const pt = await paintOf(sql, userId);
  const owned = { ...(await ownedOf(sql, userId)), lights: (await lightsOf(sql, userId)).ids, cars: await carsOf(sql, userId), cans: pt.cans.map((c) => canId(c.can)), paint: pt.paint, houses: await housesOf(sql, userId), homeClaims: await homeClaimsOf(sql, userId) };
  const until = await doubleUntil(sql, userId);
  const out = { ...done, owned, ...(until ? { doubleUntil: until } : {}) };
  return giftNotes.length ? { ...out, giftNotes } : out;
}

function startOfLocal(local: LocalSnap): CityId | null {
  const s = (local.cities as { start?: unknown } | null | undefined)?.start;
  return typeof s === "string" && s in CITIES ? (s as CityId) : null;
}

async function syncCore(sql: Sql, userId: string, local: LocalSnap, deviceId: string): Promise<SyncApplied> {
  const { id, wallet } = await canonicalWallet(sql, userId);
  if (!DEVICE_RE.test(deviceId)) return { ...applied({ ok: false, replay: false, reason: "device", wallet }), deviceClosed: true, playerId: id };
  const rows = await sql<{ op_key: string }>`
    select op_key from wallet_ledger
    where user_id = ${id} and (op_key like ${"migrate:%"} or op_key like ${"migrate-revise:%"})
  `;
  const devices = new Set<string>();
  let opened = false;
  let closed = false;
  for (const row of rows) {
    const d = deviceOf(row.op_key);
    if (!d) continue;
    devices.add(d);
    if (d !== deviceId) continue;
    if (row.op_key.startsWith("migrate-revise:")) closed = true;
    else opened = true;
  }
  // This device already had its revise. Later syncs return the server pocket and change nothing.
  if (closed) return { ...applied({ ok: true, replay: true, wallet }), deviceClosed: true, playerId: id };
  // A new device past the cap does not get a ledger row, so it cannot mint by inventing ids.
  if (!opened && devices.size >= DEVICE_CAP) return { ...applied({ ok: true, replay: true, wallet }), deviceClosed: true, playerId: id };
  const revise = opened;
  const key = `${revise ? "migrate-revise" : "migrate"}:${deviceId}`;
  const r = await mutateWallet(sql, userId, key, (w) => {
    const merged = mergeFirstSync(w, local);
    merged.migrated = true;
    return { ok: true, wallet: merged, detail: revise ? "sync-revise" : "sync" };
  });
  return { ...applied(r), deviceClosed: revise && r.ok, playerId: id };
}

/**
 * Grade award. Before the first sync the ledger remembers the token but the coins stay
 * in the local save (the sync maxes them in). After that, the balance moves here.
 */
function chicagoDay(at: unknown): string {
  const d = at instanceof Date ? at : new Date(String(at));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

export async function awardGrade(
  sql: Sql,
  userId: string,
  nonce: string,
  pay: Omit<GradePay, "prior"> & { prevNonce: string; canRoll?: [number, number]; car?: CarId | null },
): Promise<Applied & { can?: Can }> {
  const { id } = await canonicalWallet(sql, userId);
  const prevNonce = pay.prevNonce;
  const prior = pay.series && pay.step > 0 && prevNonce ? await priorGrades(sql, userId, prevNonce, 6) : [];
  const refunded = pay.clearTier
    ? await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key = ${"refund:" + nonce} limit 1`
    : [];
  const full: GradePay = {
    correct: pay.correct,
    elapsedMs: pay.elapsedMs,
    mult: pay.mult,
    city: pay.city,
    diff: pay.diff,
    clearTier: pay.clearTier,
    poiTier: pay.poiTier,
    poiId: pay.poiId,
    lat: pay.lat,
    lng: pay.lng,
    series: pay.series,
    ...(typeof pay.prizeRoll === "number" ? { prizeRoll: pay.prizeRoll } : {}),
    step: pay.step,
    steps: pay.steps,
    prior,
    streak: pay.streak,
    loot: pay.loot,
    lucky: false,
    cloth: null,
    charmDay: pay.charmDay,
    charmTopics: pay.charmTopics,
    favs: pay.favs,
    topic: pay.topic,
    dealtAt: pay.dealtAt,
    luckyHit: false,
    perfectBlue: pay.perfectBlue,
    scout: pay.scout ?? null,
    rummage: pay.rummage === true,
    doubleUp: pay.doubleUp === true,
    shellBack: pay.shellBack === true,
    light: (await lightsOf(sql, id)).best,
  };
  // 0.0.93: answer streak from the server's own grade rows (newest first): right answers since the last miss.
  // 0.0.96 Tabby (Nine lives): the first miss of each day (Chicago) does not break the run.
  const shield = hasShield(full.scout ?? null);
  const recent = full.correct
    ? await sql<{ detail: string; created_at: unknown }>`
        select detail, created_at from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"} and op_key <> ${"grade:" + nonce}
        order by created_at desc limit ${shield ? 40 : 9}
      `
    : [];
  const run = streakRun(
    recent.map((row) => ({ miss: String(row.detail).includes('"g":"miss"'), day: chicagoDay(row.created_at) })),
    shield,
  );
  const streakTier = full.correct ? streakPrize(run + 1) : null;
  // 0.1.14: new-district bonus on a single lamp (not a series card): has this 800 m square been lit today here?
  const district = full.correct && full.clearTier && !full.series ? districtOf(full.city, full.lat, full.lng) : "";
  if (district) full.freshDistrict = isFreshDistrict(district, await districtsToday(sql, id, full.city));
  // 0.1.19: a spark (no match held) is capped on the server too: six a day, one per lamp (Chicago day).
  const spark = full.correct && full.clearTier == null && !full.series && !full.poiId.startsWith("blitz-");
  const sparkOk = spark && !sparkTier(full.poiTier)
    ? false
    : spark
    ? sparkAllowed(
        (
          await sql<{ detail: string; created_at: unknown }>`
            select detail, created_at from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"} and op_key <> ${"grade:" + nonce}
              and created_at >= ${new Date(Date.now() - 30 * 3600_000).toISOString()} and detail like ${'%"sp":1%'}
          `
        )
          .filter((row) => chicagoDay(row.created_at) === chicagoDay(new Date()))
          .map((row) => String(row.detail)),
        full.poiId,
      )
    : true;
  // 0.1.51 Ioniq 5 Vehicle-to-load: a lit lamp (a right answer that spent a match; a series pays on its last card) while
  // seated in the proven car pays +1 white, at most V2L_DAY_CAP a day per player. Each pay is flagged v2 on its grade row.
  const v2lLamp = full.correct && full.clearTier != null && !full.poiId.startsWith("blitz-") && (!full.series || full.step >= full.steps - 1);
  const v2l = v2lLamp && v2lPays(pay.car ?? null, 0)
    ? v2lPays(
        pay.car ?? null,
        (
          await sql<{ created_at: unknown }>`
            select created_at from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"} and op_key <> ${"grade:" + nonce}
              and created_at >= ${new Date(Date.now() - 30 * 3600_000).toISOString()} and detail like ${'%"v2":1%'}
          `
        ).filter((row) => chicagoDay(row.created_at) === chicagoDay(new Date())).length,
      )
    : false;
  let v2Paid = false;
  const letter = full.elapsedMs <= 3000 ? "perfect" : full.elapsedMs <= 10000 ? "great" : "good";
  // 0.1.22: a quest lamp is a right answer on a lamp that spent a match (never a spark, never a blitz card).
  const questLamp = full.correct && full.clearTier != null && !spark && !full.poiId.startsWith("blitz-");
  const detailOf = (award: AwardView, counts = true) =>
    JSON.stringify({
      ...award,
      g: full.correct ? letter : "miss",
      ...(full.correct ? { t: full.poiTier } : {}),
      ...(questLamp && counts ? { ql: 1 } : {}),
      ...(full.correct && full.topic ? { tp: full.topic } : {}),
      pv: prevNonce,
      ...(full.correct && full.poiId ? { pi: full.poiId } : {}),
      // 0.1.12: the city, so a house can count today's lamps there (market lanterns and unnamed spots included).
      ...(full.correct ? { c: full.city } : {}),
      ...(district ? { d: district } : {}),
      ...(spark && sparkOk ? { sp: 1 } : {}),
      ...(v2Paid ? { v2: 1 } : {}),
      // 0.0.98: night-market lamp, for the Night Owl title.
      ...(full.correct && marketMult(full.city, full.dealtAt, { kind: "lamp", poiId: full.poiId, lat: full.lat, lng: full.lng }) > 1 ? { mk: 1 } : {}),
    });
  // 0.1.42: did this write burn a match on a miss (an owned lamp's owner is paid for those)?
  let matchLost = false;
  const withV2l = (res: OpResult & { detail?: string }): OpResult & { detail?: string } => {
    if (!v2l || !res.ok || !res.wallet.migrated) return res;
    const p = payMatch(res.wallet.keys, "white");
    const k = p.tier ? { [p.tier]: 1 } : {};
    const extra = applyDelta(res.wallet, { coins: p.coin, keys: k });
    if (!extra.ok) return res;
    const award = res.award ?? { coins: 0, keys: {}, boosts: [] };
    const keys = { ...award.keys };
    for (const [t, n] of Object.entries(k) as [Tier, number][]) keys[t] = (keys[t] ?? 0) + n;
    const v2Award = { ...award, coins: award.coins + p.coin, keys, boosts: [...award.boosts, "Vehicle-to-load: +1 white"] };
    v2Paid = true;
    return { ok: true, wallet: extra.wallet, award: v2Award, detail: detailOf(v2Award) };
  };
  const r = await mutateWallet(sql, userId, `grade:${nonce}`, (w) => {
    matchLost = false;
    v2Paid = false;
    const owned = provenBoost(pay.lucky, pay.cloth, { lucky: luckyLive(w.meta), cloths: new Set(w.meta.cloths) });
    full.lucky = owned.lucky;
    full.cloth = owned.cloth;
    full.luckyHit = owned.lucky && pay.luckyHit;
    let base = w;
    // A walk-away put the match back. Answering after that takes it again, in this same write.
    if (refunded.length && full.clearTier) {
      const spent = spendMatchOp(base, full.clearTier);
      if (!spent.ok) {
        const award = { coins: 0, keys: {}, boosts: [] };
        return { ok: true, wallet: w, award, detail: detailOf(award, false) };
      }
      base = spent.wallet;
    }
    if (!sparkOk) {
      const award = { coins: 0, keys: {}, boosts: [sparkTier(full.poiTier) ? "Sparks are spent today" : "Violet needs a violet match"] };
      return { ok: true, wallet: base, award, detail: detailOf(award) };
    }
    const grant = gradeGrant(base, full);
    if (!grant.ok) return grant;
    const detail = detailOf(grant.award ?? { coins: 0, keys: {}, boosts: [] });
    matchLost = !full.correct && full.clearTier != null;
    // 0.0.96 Plate (Shell): a server-rolled 1 in 3 failed lamps hands the spent match back (overflow coin if full).
    if (base.migrated && !full.correct && full.shellBack && full.clearTier) {
      const p = payMatch(base.keys, full.clearTier);
      const k = p.tier ? { [p.tier]: 1 } : {};
      const back = applyDelta(base, { coins: p.coin, keys: k });
      if (back.ok) {
        matchLost = false;
        const award = { coins: p.coin, keys: k, boosts: p.up ? ["Shell: match back ↑"] : ["Shell: match back"] };
        return { ok: true, wallet: back.wallet, award, detail: detailOf(award) };
      }
    }
    if (!base.migrated || !full.correct) return { ok: true, wallet: base, award: grant.award, detail };
    if (streakTier && grant.ok) {
      // 0.0.98: a level boost (15 min, spent from a token) doubles the streak pay.
      const doubled = grant.wallet.meta.boostUntil > Date.now();
      const p = payMatchesOf(grant.wallet.keys, streakTier, doubled ? 2 : 1);
      const extra = applyDelta(grant.wallet, { coins: p.coin, keys: p.add });
      if (extra.ok) {
        const award = grant.award ?? { coins: 0, keys: {}, boosts: [] };
        const keys = { ...award.keys };
        for (const [t, n] of Object.entries(p.add) as [Tier, number][]) keys[t] = (keys[t] ?? 0) + n;
        const label = `${run + 1} in a row${doubled ? " ×2" : ""}`;
        const streakAward = { ...award, coins: award.coins + p.coin, keys, boosts: [...award.boosts, label] };
        return withV2l({ ok: true, wallet: extra.wallet, award: streakAward, detail: detailOf(streakAward) });
      }
    }
    return withV2l({ ...grant, detail });
  });
  if (r.ok && !r.replay && matchLost && !full.series && full.poiId) await payOwner(sql, id, nonce, full.poiId);
  // 0.1.9: a right answer on an amber / red vault sometimes turns up a paint can.
  const odds = full.clearTier === "amber" ? CAN_ODDS.amber : full.clearTier === "red" ? CAN_ODDS.red : 0;
  if (r.ok && !r.replay && r.wallet.migrated && full.correct && odds && pay.canRoll) {
    const can = await grantCan(sql, userId, `g:${nonce}`, odds, pay.canRoll[0], pay.canRoll[1]);
    if (can) return { ...applied(r), can };
  }
  return applied(r);
}

/* ---------------------------------------------------------------- 0.1.42 owned lanterns */

/** A lamp POI that can be owned: any tiered city POI except train stations. */
export function ownableLamp(poiId: string): { poi: (typeof CITIES)[CityId]["pois"][number]; city: CityId } | null {
  for (const c of Object.values(CITIES)) {
    const p = c.pois.find((x) => x.id === poiId);
    if (p) return p.kind === "station" ? null : { poi: p, city: c.id };
  }
  return null;
}

type ClaimDetail = { owner: string; tier: Tier; city: string; name: string; free?: 1 };

function parseClaim(detail: unknown): ClaimDetail | null {
  try {
    const o = JSON.parse(String(detail)) as Partial<ClaimDetail>;
    return typeof o.owner === "string" && typeof o.tier === "string" ? (o as ClaimDetail) : null;
  } catch {
    return null;
  }
}

/** Every owned lamp, from the global claim rows. `mine` when the canonical viewer owns it. */
export async function ownedLamps(sql: Sql, viewerId: string | null): Promise<(OwnedLamp & { mine: boolean; free?: boolean })[]> {
  const me = viewerId ? (await canonicalWallet(sql, viewerId)).id : null;
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${OWN_CLAIM_USER} and op_key like ${"ownpoi:%"}`;
  const out: (OwnedLamp & { mine: boolean; free?: boolean })[] = [];
  for (const r of rows) {
    const c = parseClaim(r.detail);
    if (c) out.push({ poi: r.op_key.slice("ownpoi:".length), tier: c.tier, city: c.city, name: c.name, mine: c.owner === me, ...(c.owner === me && c.free ? { free: true } : {}) });
  }
  return out;
}

async function ownerName(sql: Sql, userId: string): Promise<string> {
  try {
    const rows = await sql<{ name: string | null }>`select name from "user" where id = ${userId} limit 1`;
    return standingName(rows[0]?.name);
  } catch {
    return standingName(null);
  }
}

/**
 * Buy a lamp: `own:<tier>` on the buyer (one per color, spends OWN_PRICE) plus a global `ownpoi:<poi>` claim row.
 * The claim insert is the lock (primary key): it is taken first, and released if the purchase does not land, so two
 * buyers can't both get one lamp and one buyer can't get two lamps of a color.
 */
async function ownLampOp(sql: Sql, sessionUserId: string, poiId: string, free = false): Promise<ClientResult> {
  const { id, wallet } = await canonicalWallet(sql, sessionUserId);
  const hit = ownableLamp(poiId);
  if (!hit) return refused(wallet, "unknown");
  const tier = hit.poi.tier;
  // 0.1.43: a gifted lantern is its own key (ownfree:<tier>), free, and needs the gift row; it doesn't use up own:<tier>.
  const key = `${free ? "ownfree" : "own"}:${tier}`;
  const price = free ? 0 : OWN_PRICE[tier];
  if (free) {
    const keys = giftKeysFor(tier);
    const gift = keys.length ? await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${"gift:lamp-%"}` : [];
    if (!gift.some((g) => keys.includes(g.op_key))) return refused(wallet, "no-gift");
  }
  const held = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${key} limit 1`;
  const heldPoi = (d: string | undefined) => {
    try {
      return (JSON.parse(d ?? "{}") as { poi?: string }).poi ?? null;
    } catch {
      return null;
    }
  };
  if (held.length) return heldPoi(held[0]!.detail) === poiId ? applied({ ok: true, replay: true, wallet }) : refused(wallet, "owned");
  if (wallet.coins < price) return refused(wallet, "short-coins");
  const name = await ownerName(sql, sessionUserId);
  const claim = await sql<{ op_key: string }>`
    insert into wallet_ledger (user_id, op_key, detail) values (${OWN_CLAIM_USER}, ${"ownpoi:" + poiId}, ${JSON.stringify({ owner: id, tier, city: hit.city, name, ...(free ? { free: 1 } : {}) })})
    on conflict (user_id, op_key) do nothing returning op_key
  `;
  if (!claim.length) return refused(wallet, "taken");
  const release = () => sql`delete from wallet_ledger where user_id = ${OWN_CLAIM_USER} and op_key = ${"ownpoi:" + poiId} and detail like ${`%"owner":${JSON.stringify(id)}%`}`;
  try {
    const r = await mutateWallet(sql, sessionUserId, key, (w) =>
      w.coins < price ? { ok: false, reason: "short-coins" } : { ...applyDelta(w, { coins: -price }), detail: JSON.stringify({ poi: poiId, city: hit.city, name }) },
    );
    // A same-color buy that raced this one won with another lamp: give this lamp back.
    if (!r.ok || (r.replay && heldPoi(r.detail) !== poiId)) {
      await release();
      return r.ok ? refused(r.wallet, "owned") : { ...applied(r), authoritative: true };
    }
    return applied(r);
  } catch (e) {
    await release();
    throw e;
  }
}

/**
 * Pay the owner of `poiId` for a visitor's miss (grade nonce `nonce`), once, as `ownpay:<nonce>`.
 * Not for the owner's own plays; at most once per the lamp's cooldown; OWN_DAILY_CAP a Chicago day; clamped at COIN_CAP.
 */
export async function payOwner(sql: Sql, visitorId: string, nonce: string, poiId: string): Promise<boolean> {
  const rows = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${OWN_CLAIM_USER} and op_key = ${"ownpoi:" + poiId} limit 1`;
  const c = parseClaim(rows[0]?.detail);
  if (!c || c.owner === visitorId) return false;
  const tier = c.tier;
  const now = Date.now();
  const paid = await sql<{ created_at: unknown }>`
    select created_at from wallet_ledger where user_id = ${c.owner} and op_key like ${"ownpay:%"} and detail like ${`%"poi":${JSON.stringify(poiId)}%`}
      and created_at >= ${new Date(now - 30 * 3600_000).toISOString()} order by created_at desc
  `;
  const at = (v: unknown) => (v instanceof Date ? v : new Date(String(v))).getTime();
  if (paid[0] && now - at(paid[0].created_at) < lampCoolMs(tier)) return false;
  const today = chicagoDay(new Date(now));
  if (paid.filter((p) => chicagoDay(p.created_at) === today).length >= OWN_DAILY_CAP) return false;
  const p = ownPayFor(tier, nonce);
  const r = await mutateWallet(sql, c.owner, `ownpay:${nonce}`, (w) => {
    const coins = Math.max(0, Math.min(p.coins, COIN_CAP - w.coins));
    const d = applyDelta(w, { coins, keys: p.match ? { [tier]: 1 } : {} });
    return d.ok ? { ...d, detail: JSON.stringify({ poi: poiId, t: tier, coins, m: p.match ? 1 : 0 }) } : d;
  });
  return r.ok && !r.replay;
}

export async function spendDealt(sql: Sql, userId: string, nonce: string, tier: Tier): Promise<Applied & { skipped?: boolean }> {
  const { wallet } = await canonicalWallet(sql, userId);
  if (!wallet.migrated) return { ...applied({ ok: true, replay: false, wallet }), skipped: true };
  const r = await mutateWallet(sql, userId, `deal:${nonce}`, (w) => spendMatchOp(w, tier));
  return applied(r);
}

export async function refundDealt(sql: Sql, userId: string, nonce: string, tier: Tier): Promise<Applied & { skipped?: boolean }> {
  const { id, wallet } = await canonicalWallet(sql, userId);
  if (!wallet.migrated) return { ...applied({ ok: true, replay: false, wallet }), skipped: true };
  const spent = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key = ${"deal:" + nonce} limit 1`;
  if (!spent.length) return { ...applied({ ok: true, replay: false, wallet }), skipped: true };
  const r = await mutateWallet(sql, userId, `refund:${nonce}`, (w) => refundMatchOp(w, tier));
  return applied(r);
}

type WardrobeRow = { owned: unknown; paid: unknown; coat: string | null; lantern: string | null; equip_at: number | string };

async function loadWardrobe(sql: Sql, id: string): Promise<Wardrobe> {
  const rows = await sql<WardrobeRow>`select owned, paid, coat, lantern, equip_at from wardrobes where user_id = ${id} limit 1`;
  const r = rows[0];
  if (!r) return cleanWardrobe(null);
  const parse = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);
  return cleanWardrobe({ owned: parse(r.owned), paid: parse(r.paid), coat: r.coat, lantern: r.lantern, at: Number(r.equip_at) || 0 });
}

async function saveWardrobe(sql: Sql, id: string, w: Wardrobe) {
  await sql.query(WARDROBE_UPSERT, [id, JSON.stringify(w.owned), JSON.stringify(w.paid), w.coat, w.lantern, w.at]);
}

const today = () => new Date().toISOString().slice(0, 10);

export type ClientOp =
  | { kind: "unlock"; cityId: CityId }
  | { kind: "start"; cityId: CityId }
  | { kind: "goal"; cityId: CityId }
  | { kind: "bank"; dir: "up" | "down"; tier: Tier }
  | { kind: "scout"; id: string }
  | { kind: "kiosk"; id: KioskId; poi?: string }
  | { kind: "print"; id: CosmeticId }
  | { kind: "refund"; token: string }
  | { kind: "street"; id: string; tier: Tier; city: CityId; lat: number; lng: number; via?: "magnet" }
  | { kind: "drive"; city: CityId }
  | { kind: "quest"; period: string; id: string }
  | { kind: "legacy"; claimed: string[]; circuits: string[]; unfinished: boolean; charms: string[] }
  | { kind: "cloth"; id: string }
  | { kind: "daily"; day: string; city: CityId }
  | { kind: "friend"; id: string }
  | { kind: "survey"; id: string }
  | { kind: "crate" }
  | { kind: "contract"; nonces: string[] }
  | { kind: "blitz"; step: number; nonces: string[] }
  | { kind: "wheel"; tier: Tier; city: CityId }
  | { kind: "board"; from: CityId; to: CityId }
  | { kind: "cache"; city: CityId }
  | { kind: "dgoal"; i: number }
  | { kind: "light"; id: string }
  | { kind: "car"; id: string }
  | { kind: "paint"; car: string; color: string }
  | { kind: "house"; city: CityId; tier: string }
  | { kind: "home"; city: CityId }
  | { kind: "own"; poi: string; free?: boolean }
  | { kind: "hurry"; min: number }
  | {
      kind: "ride";
      watch?: boolean;
      play?: boolean;
      deal?: RideGameId;
      round?: { n: number } & RideMoves;
    };

export type RideDeal = { seed: number; n: number; ms: number; game: string; ramp?: number; bonus?: boolean };

export type ClientResult = Applied & {
  wardrobe?: Wardrobe;
  ingredient?: { id: string; n: number };
  line?: string;
  /** 0.0.92: index of the slice the server rolled and paid (the client animates to it). */
  wheelWin?: number;
  /** 0.0.93: the matches a cache paid (the rest became coin). */
  cache?: { got: Tier[]; coin: number; already?: boolean };
  rideDeal?: RideDeal;
  /** 0.1.2: the arrival and charge the server set for a Hurry up. */
  hurry?: { arriveAt: number; cost: number };
  /** 0.1.9: a paint can found (cache), or the color a paint op set. */
  can?: Can;
  /** 0.1.12: what turning the key paid (0 / null when that part was already taken today). */
  home?: { match: Tier | null; n?: number; coin?: number; day: string };
  /** 0.1.22: the quest a claim paid (and the month Lucky turned on for, from a Full month). */
  quest?: { id: string; period: string; lucky?: string };
  /** 0.1.22: what the one-time milestone / charm move paid (fresh grants only; a replay is empty). */
  legacy?: LegacyGrant[];
};

export async function applyClientOp(sql: Sql, sessionUserId: string, op: ClientOp): Promise<ClientResult> {
  const { id, wallet } = await canonicalWallet(sql, sessionUserId);
  if (!wallet.migrated) return { ...applied({ ok: false, replay: false, reason: "sync", wallet }), authoritative: false };

  if (op.kind === "refund") {
    const { triviaDeps } = await import("./triviaBank.ts");
    const { openToken } = await import("./triviaService.ts");
    const deps = await triviaDeps();
    const t = openToken(deps.secret, op.token);
    if (!t || t.s !== `u:${sessionUserId}` || !t.k) return { ...applied({ ok: false, replay: false, reason: "bad-token", wallet }), authoritative: true };
    return refundDealt(sql, sessionUserId, t.n, t.k);
  }

  if (op.kind === "own") return ownLampOp(sql, sessionUserId, op.poi, op.free === true);

  if (op.kind === "print") {
    const wardrobe = await loadWardrobe(sql, id);
    let nextWardrobe: Wardrobe | undefined;
    const r = await mutateWallet(sql, sessionUserId, `print:${op.id}:${wardrobe.paid[op.id]?.white ?? 0}:${wardrobe.paid[op.id]?.blue ?? 0}:${wardrobe.owned.includes(op.id) ? 1 : 0}`, (w) => {
      const res = printOp(w, wardrobe, op.id, Date.now());
      if (res.ok && res.wardrobe) nextWardrobe = res.wardrobe;
      return res;
    });
    if (r.ok && !r.replay && nextWardrobe) await saveWardrobe(sql, id, nextWardrobe);
    const saved = r.replay ? await loadWardrobe(sql, id) : nextWardrobe;
    return { ...applied(r), wardrobe: saved };
  }

  if (op.kind === "daily") {
    // One finished Lantern Run per city per the day that run started. The row is the proof.
    const ids = await groupIds(sql, sessionUserId);
    let done = false;
    for (const uid of ids) {
      const rows = await sql<{ time_ms: number | null; voided: boolean }>`
        select time_ms, voided from daily_runs where day = ${op.day} and city = ${op.city} and user_id = ${uid} limit 1
      `;
      const row = rows[0];
      if (row && Number(row.time_ms) > 0 && row.voided !== true) done = true;
    }
    if (!done) return refused(wallet, "no-run");
    const r = await mutateWallet(sql, sessionUserId, `daily:${op.day}:${op.city}`, (w) => dailyOp(w, op.day, op.city));
    return applied(r);
  }

  if (op.kind === "friend") {
    const token = op.id.replace(/^[sf]:/, "");
    const ids = await groupIds(sql, sessionUserId);
    const rows = await sql<{ rewarded: boolean; sender_id: string; friend_id: string | null; pair_key: string | null }>`
      select rewarded, sender_id, friend_id, pair_key from friend_tickets where token = ${token} limit 1
    `;
    const row = rows[0];
    if (!row?.rewarded || (!ids.includes(row.sender_id) && !(row.friend_id && ids.includes(row.friend_id)))) {
      return { ...applied({ ok: false, replay: false, reason: "no-ticket", wallet }), authoritative: true };
    }
    // 0.1.26: the ladder color, replayed from the pair's tickets on the server (never from the client).
    const { ticketPay } = await import("./friendService.ts");
    const pay = await ticketPay(sql, row.pair_key, token);
    const r = await mutateWallet(sql, sessionUserId, `friend:${op.id}`, (w) => {
      const done = friendOp(w, 1, pay.tier);
      return done.ok ? { ...done, detail: JSON.stringify({ t: pay.tier, rung: pay.rung + 1 }) } : done;
    });
    return applied(r);
  }

  if (op.kind === "wheel") {
    const clears = await sql<{ tier: string; correct: number }>`select tier, correct from vault_clears_by_player where user_id = ${id}`;
    const correct: Partial<Record<Tier, number>> = {};
    for (const c of clears) correct[c.tier as Tier] = Number(c.correct) || 0;
    const claimed = wallet.meta.wheel[op.tier] ?? 0;
    if (Math.floor((correct[op.tier] ?? 0) / WHEEL_EVERY) <= claimed) {
      return { ...applied({ ok: false, replay: false, reason: "no-spin", wallet }), authoritative: true };
    }
    // Roll once. A compare-and-swap retry must not land a different prize.
    const offer = buildWheel(op.tier, op.city, Math.random());
    const prize = offer.slices[offer.win]!;
    // 0.0.92: Take all carries the wheel's one ingredient slice (Stock) too.
    const ing = prize.kind === "ingredient" ? prize : prize.kind === "all" ? prize.parts.find((p) => p.kind === "ingredient") : undefined;
    const ingredient = ing && ing.kind === "ingredient" ? { id: ing.id, n: ing.n } : undefined;
    let line = "";
    const r = await mutateWallet(sql, sessionUserId, `wheel:${op.tier}:${claimed}`, (w) => {
      if ((w.meta.wheel[op.tier] ?? 0) !== claimed) return { ok: false, reason: "busy" };
      const paid = grantWheelPrize(prize, { keys: w.keys, points: w.coins, pantry: {} });
      line = paid.line;
      const keys: Partial<Record<Tier, number>> = {};
      for (const t of ["white", "blue", "green", "amber", "red", "violet"] as const) {
        const d = (paid.keys[t] ?? 0) - (w.keys[t] ?? 0);
        if (d) keys[t] = d;
      }
      const delta = applyDelta(w, { coins: paid.points - w.coins, keys });
      if (!delta.ok) return delta;
      return {
        ok: true as const,
        wallet: { ...delta.wallet, meta: { ...delta.wallet.meta, wheel: { ...w.meta.wheel, [op.tier]: claimed + 1 } } },
        detail: line,
      };
    });
    return { ...applied(r), ingredient, line, wheelWin: offer.win };
  }

  // 0.0.93: the day's match cache. Once per player per day (any city); the prize is seeded per player and day.
  if (op.kind === "cache") {
    const day = today();
    if (!wallet.cities.unlocked.includes(op.city)) return refused(wallet, "locked");
    const tiers = cachePrize(id, day);
    let got: Tier[] = [];
    let coin = 0;
    const r = await mutateWallet(sql, sessionUserId, `cache:${day}`, (w) => {
      const paid = payMatches(w.keys, tiers);
      got = paid.got;
      coin = paid.coin;
      const keys: Partial<Record<Tier, number>> = {};
      for (const t of got) keys[t] = (keys[t] ?? 0) + 1;
      const delta = applyDelta(w, { coins: paid.coin, keys });
      return delta.ok ? { ...delta, detail: JSON.stringify({ got, coin }) } : delta;
    });
    // 0.1.23: a replay (today's cache already opened, e.g. on another device) used to answer got [] / coin 0, which
    // the device showed as "Every pocket is full: +0 coin". Say it was already opened, with what it paid then.
    if (r.ok && r.replay) {
      let first: { got?: unknown; coin?: unknown } = {};
      try {
        first = JSON.parse(r.detail ?? "{}");
      } catch {
        /* old row: no detail */
      }
      const was = Array.isArray(first.got) ? (first.got as Tier[]) : [];
      return { ...applied(r), cache: { got: was, coin: Number(first.coin) || 0, already: true } };
    }
    const can = r.ok && !r.replay ? await grantCan(sql, sessionUserId, `c:${day}`, CAN_ODDS.cache, Math.random(), Math.random()) : null;
    return { ...applied(r), cache: { got, coin }, ...(can ? { can } : {}) };
  }

  // 0.0.93: daily goals. i = 0..2 pays GOAL_COIN once each; i = 3 (all three paid) pays a green match. The server
  // can't see the goals themselves, so it asks for proof of play: graded right answers today.
  // 0.1.00: market lights are bought in ladder order with coin; the server owns the list.
  if (op.kind === "light") {
    const owned = await lightsOf(sql, sessionUserId);
    if ((owned.ids as string[]).includes(op.id)) return applied({ ok: true, replay: true, wallet });
    const next = nextLight(owned.ids);
    if (!next || next.id !== op.id) return refused(wallet, "not-next");
    const r = await mutateWallet(sql, sessionUserId, `light:${next.id}`, (w) =>
      w.coins < next.price ? { ok: false, reason: "short-coins" } : { ...applyDelta(w, { coins: -next.price }), detail: JSON.stringify({ light: next.id }) },
    );
    return applied(r);
  }

  // 0.1.8: a car is bought once, any order, at the price the server knows; a second buy is a free replay.
  if (op.kind === "car") {
    const car = carOf(op.id);
    if (!car) return refused(wallet, "unknown");
    if ((await carsOf(sql, sessionUserId)).includes(car.id)) return applied({ ok: true, replay: true, wallet });
    const r = await mutateWallet(sql, sessionUserId, `car:${car.id}`, (w) =>
      w.coins < car.price ? { ok: false, reason: "short-coins" } : { ...applyDelta(w, { coins: -car.price }), detail: JSON.stringify({ car: car.id }) },
    );
    return applied(r);
  }

  // 0.1.9: repaint a car you own with a can of its color, for 10% of its price. The can is spent by key.
  if (op.kind === "paint") {
    const car = carOf(op.car);
    if (!car || !colorOf(car.id, op.color)) return refused(wallet, "unknown");
    if (!(await carsOf(sql, sessionUserId)).includes(car.id)) return refused(wallet, "no-car");
    const held = (await paintOf(sql, sessionUserId)).cans.find((c) => c.can.car === car.id && c.can.color === op.color);
    if (!held) return refused(wallet, "no-can");
    const price = paintPrice(car.id);
    const r = await mutateWallet(sql, sessionUserId, `paint:${held.key}`, (w) =>
      w.coins < price ? { ok: false, reason: "short-coins" } : { ...applyDelta(w, { coins: -price }), detail: JSON.stringify({ can: canId(held.can) }) },
    );
    return { ...applied(r), ...(r.ok ? { can: held.can } : {}) };
  }

  // 0.1.12: buy a house, or step up: any order, the difference in price, never down. Signed-in only (sync above).
  if (op.kind === "house") {
    const def = houseOf(op.tier);
    if (!def || !(op.city in CITIES)) return refused(wallet, "unknown");
    const owned = (await housesOf(sql, sessionUserId))[op.city]?.tier ?? null;
    if (owned === def.id) return applied({ ok: true, replay: true, wallet });
    const cost = houseCost(owned, def.id);
    if (cost === null) return refused(wallet, "owned");
    const r = await mutateWallet(sql, sessionUserId, `house:${op.city}:${def.id}`, (w) =>
      w.coins < cost ? { ok: false, reason: "short-coins" } : { ...applyDelta(w, { coins: -cost }), detail: JSON.stringify({ city: op.city, tier: def.id, from: owned }) },
    );
    return applied(r);
  }

  // 0.1.12: turn the key. Needs a house here and three correct lamps in this city today. Pays no coin: just the
  // tier's match, once per city per local day (hook:<city>:<day>).
  if (op.kind === "home") {
    if (!(op.city in CITIES)) return refused(wallet, "unknown");
    const tier = (await housesOf(sql, sessionUserId))[op.city]?.tier;
    if (!tier) return refused(wallet, "no-house");
    if ((await lampsToday(sql, sessionUserId, op.city)) < HOME_LAMPS) return { ...refused(wallet, "unproven"), authoritative: true };
    const def = houseOf(tier)!;
    const day = cityDay(op.city, Date.now());
    let match: Tier | null = null;
    let paid = 0;
    // 0.1.42: KEY_MATCHES of the house's color (overflow becomes credits, as every match grant) plus the tier's coin, clamped at COIN_CAP.
    const hook = await mutateWallet(sql, sessionUserId, `hook:${op.city}:${day}`, (w) => {
      const p = payMatchesOf(w.keys, def.match, KEY_MATCHES);
      const coin = Math.max(0, Math.min(def.keyCoin + p.coin, COIN_CAP - w.coins));
      const d = applyDelta(w, { coins: coin, keys: p.add });
      if (d.ok) {
        match = def.match;
        paid = coin;
      }
      return d.ok ? { ...d, detail: JSON.stringify({ city: op.city, match: def.match, n: KEY_MATCHES, coin }) } : d;
    });
    const fresh = hook.ok && !hook.replay;
    return { ...applied(hook), home: { match: fresh ? match : null, n: fresh ? KEY_MATCHES : 0, coin: fresh ? paid : 0, day } };
  }

  if (op.kind === "dgoal") {
    // 0.1.22: the goals' day is the Chicago day (was UTC), the same clock as quests.
    const day = goalDay();
    const dayStart = periodOf(`D${day}`)!.start;
    const i = op.i;
    if (!Number.isInteger(i) || i < 0 || i > 3) return refused(wallet, "unproven");
    const rows = await sql<{ n: number }>`
      select count(*)::int as n from wallet_ledger
      where user_id = ${id} and op_key like ${"grade:%"} and created_at >= ${new Date(dayStart).toISOString()}
        and detail not like ${'%"g":"miss"%'}
    `;
    const right = Number(rows[0]?.n) || 0;
    if (right < (i === 3 ? GOAL_ALL_PROOF_RIGHT : GOAL_PROOF_RIGHT)) return { ...refused(wallet, "unproven"), authoritative: true };
    if (i === 3) {
      const three = await sql<{ n: number }>`
        select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key in (${`goal:${day}:0`}, ${`goal:${day}:1`}, ${`goal:${day}:2`})
      `;
      if ((Number(three[0]?.n) || 0) < 3) return { ...refused(wallet, "unproven"), authoritative: true };
    }
    const r = await mutateWallet(sql, sessionUserId, `goal:${day}:${i}`, (w) => {
      if (i < 3) return applyDelta(w, { coins: GOAL_COIN });
      const p = payMatch(w.keys, GOAL_ALL_TIER);
      return applyDelta(w, { coins: p.coin, keys: p.tier ? { [p.tier]: 1 } : {} });
    });
    return applied(r);
  }

  // 0.1.46: a seated Roadster 2.0 says "driving in this city" (one row per city, its time moved forward). The Magnet needs one in the last 5 min.
  if (op.kind === "drive") {
    if (!wallet.cities.unlocked.includes(op.city)) return refused(wallet, "locked");
    if (!(await carsOf(sql, sessionUserId)).includes("roadster2")) return refused(wallet, "no-car");
    await sql`
      insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${`drive:${op.city}`}, ${JSON.stringify({ car: "roadster2" })})
      on conflict (user_id, op_key) do update set created_at = now()
    `;
    return { ...applied({ ok: true, replay: false, wallet }), authoritative: true };
  }

  if (op.kind === "street") {
    const parsed = parseStreetId(op.id);
    const day = today();
    if (!parsed || parsed.city !== op.city || parsed.day !== day) return refused(wallet, "unproven");
    const spot = streetSpot(id, op.city, day, parsed.index);
    if (!spot || spot.id !== op.id) return refused(wallet, "unproven");
    const key = `street:${spot.id}`;
    const existing = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key = ${key} limit 1`;
    if (!existing.length) {
      if (!wallet.cities.unlocked.includes(op.city)) return refused(wallet, "locked");
      const ids = await groupIds(sql, sessionUserId);
      // 0.1.46: a Magnet pull proves freshness with the drive ping (in magnetRefusal) instead of a walk post.
      if (op.via !== "magnet" && !(await cityFresh(sql, id, ids, op.city))) return refused(wallet, "unproven");
      const prior = await sql<{ n: number }>`
        select count(*)::int as n from wallet_ledger
        where user_id = ${id} and op_key like ${"street:sk:" + op.city + ":" + day + ":%"}
      `;
      if ((Number(prior[0]?.n) || 0) >= STREET_DAY_CAP) return refused(wallet, "capped");
      if (op.via === "magnet") {
        const why = await magnetRefusal(sql, sessionUserId, id, op.city, day);
        if (why) return refused(wallet, why);
      }
    }
    const magnet = op.via === "magnet" && !existing.length;
    const r = await mutateWallet(sql, sessionUserId, key, (w) => {
      const out = streetOp(w, op.city, spot.tier, spot.market);
      return magnet && out.ok ? { ...out, detail: JSON.stringify({ ...detailOf(out.detail), mg: 1 }) } : out;
    });
    return applied(r);
  }

  if (op.kind === "quest") {
    const r = await claimQuest(sql, sessionUserId, op.period, op.id);
    return { ...applied(r), authoritative: true, quest: r.quest };
  }

  if (op.kind === "legacy") {
    const meters = Math.max(wallet.meta.walkM, await walkedMeters(sql, id));
    const visited = await visitedPlaces(sql, id);
    for (const poi of wallet.meta.visits) if (isPlace(poi)) visited.add(poi);
    const input: LegacyIn = {
      claimed: op.claimed.filter((x): x is LongId => (LONG_IDS as string[]).includes(x)),
      circuits: op.circuits.filter((c): c is CityId => c in CITIES),
      unfinished: op.unfinished === true,
      charms: op.charms.slice(0, 8),
    };
    const r = await applyLegacy(sql, sessionUserId, input, { meters, visited });
    return { ...applied({ ok: true, replay: false, wallet: r.wallet }), authoritative: true, legacy: r.grants };
  }

  if (op.kind === "cloth") {
    const meters = Math.max(wallet.meta.walkM, await walkedMeters(sql, id));
    const places = await visitedPlaces(sql, id);
    for (const poi of wallet.meta.visits) if (isPlace(poi)) places.add(poi);
    const r = await mutateWallet(sql, sessionUserId, `cloth:${op.id}`, (w) => clothOp(w, op.id, { meters, visited: places }));
    return applied(r);
  }

  if (op.kind === "kiosk" && op.id === "smear") {
    const city = poiCity(op.poi ?? "");
    if (!city || !wallet.cities.unlocked.includes(city)) return refused(wallet, "unknown");
    const r = await mutateWallet(sql, sessionUserId, `kiosk:smear:${op.poi}`, (w) => kioskOp(w, "smear"));
    return applied(r);
  }

  if (op.kind === "goal" || op.kind === "survey") {
    const places = await visitedPlaces(sql, id);
    for (const poi of wallet.meta.visits) if (isPlace(poi)) places.add(poi);
    let meters = wallet.meta.walkM;
    if (op.kind === "survey" && op.id.startsWith("walk-")) meters = Math.max(meters, await walkedMeters(sql, id));
    if (op.kind === "goal") {
      const r = await mutateWallet(sql, sessionUserId, `goal:${op.cityId}`, (w) => goalOp(w, op.cityId, places));
      return applied(r);
    }
    const proven = surveyProven(op.id, places, meters);
    const r = await mutateWallet(sql, sessionUserId, `survey:${op.id}`, (w) => surveyOp(w, op.id, proven));
    return applied(r);
  }

  if (op.kind === "contract" || op.kind === "blitz") {
    const day = today();
    const asked = op.nonces;
    const dealt = await blitzDealt(sql, id, asked);
    if (op.kind === "contract") {
      const lamps = asked.filter((n) => !dealt.has(n));
      if (lamps.length < CONTRACT_LAMPS) return refused(wallet, "unproven");
      return noncePayout(sql, sessionUserId, id, wallet, lamps, (nonces) => `contract:${[...nonces].sort().join(".")}`, (w, nonces) =>
        contractOp(w, day, nonces),
      );
    }
    const cards = asked.filter((n) => dealt.get(n) === op.step);
    if (!cards.length) return refused(wallet, "unproven");
    return noncePayout(sql, sessionUserId, id, wallet, cards, () => `blitz:${day}:${op.step}`, (w, nonces) => blitzOp(w, day, op.step, nonces));
  }

  if (op.kind === "board") return boardTicket(sql, sessionUserId, id, wallet, op.from, op.to);
  if (op.kind === "ride") return payRide(sql, sessionUserId, id, wallet, op);
  if (op.kind === "hurry") return hurryRide(sql, sessionUserId, id, wallet, op.min);

  // 0.0.98: a scout the account already owns on the server (bought under any key, or restored by a gift such as
  // gift:bethb-corgi-0095) is never charged again and never refused, so a device that hasn't caught up can't
  // roll the scout back on a "short-coins" refusal.
  if (op.kind === "scout" && (await ownedOf(sql, sessionUserId)).scouts.includes(op.id as ScoutId)) {
    return applied({ ok: true, replay: true, wallet });
  }

  const key = opKey(op, wallet);
  const r = await mutateWallet(sql, sessionUserId, key, (w) => {
    switch (op.kind) {
      case "unlock":
        return unlockOp(w, op.cityId);
      case "start":
        return startOp(w, op.cityId);
      case "bank":
        return bankOp(w, op.dir, op.tier);
      case "scout":
        return scoutOp(w, op.id);
      case "kiosk":
        return kioskOp(w, op.id);
      case "crate":
        return crateOp(w, today());
      default:
        return { ok: false, reason: "unknown" };
    }
  });
  return applied(r);
}

function pocketStamp(w: WalletState) {
  return [w.coins, w.keys.white, w.keys.blue, w.keys.green, w.keys.amber, w.keys.red, w.keys.violet].join(".");
}

function opKey(op: ClientOp, w: WalletState): string {
  switch (op.kind) {
    case "unlock":
      return `unlock:${op.cityId}`;
    case "start":
      return `start:${op.cityId}`;
    case "goal":
      return `goal:${op.cityId}`;
    case "bank":
      // Same pocket twice is one trade. A second trade has different counts, so a new key.
      return `bank:${op.dir}:${op.tier}:${pocketStamp(w)}`;
    case "scout":
      return `scout:${op.id}`;
    case "kiosk":
      return `kiosk:${op.id}:${pocketStamp(w)}`;
    case "crate":
      return `crate:${today()}`;
    default:
      return `op:${op.kind}`;
  }
}

function refused(wallet: WalletState, reason: string): ClientResult {
  return { ...applied({ ok: false, replay: false, reason, wallet }), authoritative: true };
}

function poiCity(poi: string): CityId | null {
  if (!poi) return null;
  for (const [cityId, city] of Object.entries(CITIES) as [CityId, (typeof CITIES)[CityId]][]) {
    if (city.pois.some((p) => p.id === poi)) return cityId;
  }
  return null;
}

async function gradedPlaces(sql: Sql, userId: string): Promise<Set<string>> {
  const rows = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${userId} and op_key like ${"grade:%"}`;
  const out = new Set<string>();
  for (const row of rows) {
    const place = gradedPlace(row.detail);
    if (place) out.add(place);
  }
  return out;
}

/** Graded visits plus atlas names the kiosk smear actually bought. */
async function visitedPlaces(sql: Sql, userId: string): Promise<Set<string>> {
  const out = await gradedPlaces(sql, userId);
  const named = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${userId} and op_key like ${"kiosk:smear:%"}`;
  for (const row of named) {
    const poi = row.op_key.slice("kiosk:smear:".length);
    if (poiCity(poi)) out.add(poi);
  }
  return out;
}

async function walkedMeters(sql: Sql, userId: string): Promise<number> {
  const rows = await sql<{ n: number }>`select coalesce(sum(meters), 0)::int as n from walk_distance_by_player where user_id = ${userId}`;
  return Number(rows[0]?.n) || 0;
}

function detailOf(d: string | undefined): Record<string, unknown> {
  try {
    const v = JSON.parse(d || "{}") as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** 0.1.46 Magnet: owns the Roadster 2.0, drove in this city in the last 5 min, 3 s since the last pull, under 30 today. */
async function magnetRefusal(sql: Sql, sessionUserId: string, id: string, city: CityId, day: string): Promise<string | null> {
  if (!(await carsOf(sql, sessionUserId)).includes("roadster2")) return "no-car";
  const since = new Date(Date.now() - STREET_FRESH_MS).toISOString();
  const drove = await sql<{ n: number }>`select 1 as n from wallet_ledger where user_id = ${id} and op_key = ${`drive:${city}`} and created_at >= ${since}::timestamptz limit 1`;
  if (!drove.length) return "not-driving";
  const rows = await sql<{ n: number; last: string | null }>`
    select count(*)::int as n, max(created_at) as last from wallet_ledger
    where user_id = ${id} and op_key like ${"street:sk:" + city + ":" + day + ":%"} and detail like ${'%"mg":1%'}
  `;
  if ((Number(rows[0]?.n) || 0) >= MAGNET_DAY_CAP) return "magnet-capped";
  const last = rows[0]?.last ? new Date(rows[0].last).getTime() : 0;
  if (last && Date.now() - last < MAGNET_GAP_MS) return "magnet-wait";
  return null;
}

/** A walk post or a dealt card in this city within the last few minutes. */
async function cityFresh(sql: Sql, id: string, userIds: string[], city: CityId): Promise<boolean> {
  const since = new Date(Date.now() - STREET_FRESH_MS).toISOString();
  for (const uid of userIds) {
    const walk = await sql<{ n: number }>`
      select 1 as n from walk_distance
      where user_id = ${uid} and city = ${city} and updated_at >= ${since}::timestamptz
      limit 1
    `;
    if (walk.length) return true;
    const dealt = await sql<{ n: number }>`
      select 1 as n from plate_events
      where user_id = ${uid} and city = ${city} and answered_at >= ${since}::timestamptz
      limit 1
    `;
    if (dealt.length) return true;
  }
  const grades = await sql<{ detail: string }>`
    select detail from wallet_ledger
    where user_id = ${id} and op_key like ${"grade:%"} and created_at >= ${since}::timestamptz
    limit 20
  `;
  for (const row of grades) {
    const place = gradedPlace(row.detail);
    if (place && poiCity(place) === city) return true;
  }
  return false;
}

/** Step of a blitz-dealt card, keyed by nonce. A street grade is not in here. */
async function blitzDealt(sql: Sql, id: string, nonces: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (const n of nonces.slice(0, 8)) {
    const rows = await sql<{ detail: string }>`
      select detail from wallet_ledger where user_id = ${id} and op_key = ${"blitz-card:" + n} limit 1
    `;
    const m = /^blitz-(\d+)$/.exec(rows[0]?.detail ?? "");
    if (m) out.set(n, Number(m[1]));
  }
  return out;
}

/** Remember that this nonce was a blitz card of this step. The blitz payout will not take any other card. */
export async function noteBlitzCard(sql: Sql, userId: string, nonce: string, step: number): Promise<void> {
  if (!Number.isInteger(step) || step < 0 || step >= BLITZ_STEPS.length) return;
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(nonce)) return;
  await mutateWallet(sql, userId, `blitz-card:${nonce}`, (w) => ({ ok: true, wallet: w, detail: `blitz-${step}` }));
}

async function gradedNoncesToday(sql: Sql, userIds: string[], nonces: string[], day: string): Promise<Set<string>> {
  const start = `${day}T00:00:00.000Z`;
  const end = new Date(Date.parse(start) + 86_400_000).toISOString();
  const seen = new Set<string>();
  for (const n of nonces) {
    const rows = await sql<{ user_id: string }>`
      select user_id from plate_events
      where id = ${"t:" + n} and correct = true
        and answered_at >= ${start}::timestamptz
        and answered_at < ${end}::timestamptz
      limit 1
    `;
    if (rows[0] && userIds.includes(rows[0].user_id)) seen.add(n);
  }
  return seen;
}

async function usedPayNonces(sql: Sql, userId: string): Promise<Set<string>> {
  const rows = await sql<{ detail: string }>`
    select detail from wallet_ledger
    where user_id = ${userId} and (op_key like ${"contract:%"} or op_key like ${"blitz:%"})
  `;
  const used = new Set<string>();
  for (const row of rows) {
    try {
      const d = JSON.parse(row.detail) as { nonces?: unknown };
      if (!Array.isArray(d.nonces)) continue;
      for (const n of d.nonces) if (typeof n === "string") used.add(n);
    } catch {
      /* a note, not a nonce list */
    }
  }
  return used;
}

/** Pay once for nonces graded today that no contract or blitz has used. A repeat of the same key replays. */
async function noncePayout(
  sql: Sql,
  sessionUserId: string,
  id: string,
  wallet: WalletState,
  asked: string[],
  keyFor: (nonces: string[]) => string,
  pay: (w: WalletState, nonces: string[]) => OpResult,
): Promise<ClientResult> {
  const ids = await groupIds(sql, sessionUserId);
  const seen = await gradedNoncesToday(sql, ids, asked.slice(0, 8), today());
  const qualified = acceptNonces(asked, seen);
  if (!qualified) return refused(wallet, "unproven");
  const used = await usedPayNonces(sql, id);
  const fresh = qualified.filter((n) => !used.has(n));
  const key = keyFor(qualified);
  if (fresh.length !== qualified.length) {
    const r = await mutateWallet(sql, sessionUserId, key, () => ({ ok: false, reason: "used" }));
    return applied(r);
  }
  const r = await mutateWallet(sql, sessionUserId, key, (w) => pay(w, fresh));
  return applied(r);
}

type TicketRow = { at: number; from: CityId; to: CityId; ms: number };

function parseTicket(detail: string | undefined): TicketRow | null {
  if (!detail) return null;
  try {
    const d = JSON.parse(detail) as { at?: unknown; from?: unknown; to?: unknown; ms?: unknown };
    if (typeof d.at !== "number" || typeof d.ms !== "number" || typeof d.from !== "string" || typeof d.to !== "string") return null;
    if (!(d.at > 0) || !(d.ms > 0)) return null;
    return { at: d.at, from: d.from as CityId, to: d.to as CityId, ms: d.ms };
  } catch {
    return null;
  }
}

async function latestTicket(sql: Sql, id: string): Promise<TicketRow | null> {
  const rows = await sql<{ detail: string }>`
    select detail from wallet_ledger
    where user_id = ${id} and op_key like ${"ticket:%"}
    order by created_at desc
    limit 1
  `;
  return parseTicket(rows[0]?.detail);
}

async function ticketsEarned(sql: Sql, id: string, userIds: string[], synced: number): Promise<number> {
  let clears = 0;
  for (const uid of userIds) {
    const rows = await sql<{ n: number }>`select coalesce(sum(correct), 0)::int as n from vault_clears where user_id = ${uid}`;
    clears += Number(rows[0]?.n) || 0;
  }
  const bought = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"kiosk:fare:%"}`;
  const fromPlay = Math.floor(clears / VAULTS_PER_FARE) + (Number(bought[0]?.n) || 0);
  return Math.min(FARES_CAP, Math.max(0, Math.floor(synced))) + fromPlay;
}

/** Spend one server ticket. The row's clock is Date.now(), and a second board while that train is out does not spend another. */
async function boardTicket(sql: Sql, sessionUserId: string, id: string, wallet: WalletState, from: CityId, to: CityId): Promise<ClientResult> {
  if (from === to) return refused(wallet, "bad-ride");
  if (!wallet.cities.unlocked.includes(from) || !wallet.cities.unlocked.includes(to)) return refused(wallet, "locked");
  const ids = await groupIds(sql, sessionUserId);
  const earned = await ticketsEarned(sql, id, ids, wallet.meta.fares);
  const spentRows = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"ticket:%"}`;
  const spent = Number(spentRows[0]?.n) || 0;
  const held = Math.min(FARES_CAP, Math.max(0, earned - spent));
  const prev = await latestTicket(sql, id);
  const now = Date.now();
  if (prev && now < prev.at + prev.ms) return { ...applied({ ok: true, replay: true, wallet }), authoritative: true };
  if (held < 1) return refused(wallet, "no-ticket");
  const ms = fareMs(from, to);
  const r = await mutateWallet(sql, sessionUserId, `ticket:${spent}`, (w) => {
    if (!w.cities.unlocked.includes(from) || !w.cities.unlocked.includes(to)) return { ok: false, reason: "locked" };
    return { ok: true, wallet: w, detail: JSON.stringify({ at: now, from, to, ms }) };
  });
  return applied(r);
}

function rideDealOf(detail: string | undefined): RideDeal | undefined {
  if (!detail) return;
  try {
    const d = JSON.parse(detail) as Partial<RideDeal>;
    if (typeof d.seed === "number" && typeof d.n === "number" && typeof d.ms === "number" && typeof d.game === "string") {
      return { seed: d.seed, n: d.n, ms: d.ms, game: d.game, ramp: typeof d.ramp === "number" ? d.ramp : 1, bonus: d.bonus === true };
    }
  } catch {
    /* a heartbeat stores no deal */
  }
  return;
}

function nextRound(w: WalletState, departAt: number) {
  if (w.meta.rideAt !== departAt || w.meta.rideOpenN < 0) return 0;
  return w.meta.rideOpenN + 1;
}

/** 0.1.2: the arrival Hurry up set for this ticket, if any (latest wins; each hurry only ever moves it earlier). */
async function hurriedArrive(sql: Sql, id: string, at: number): Promise<number | null> {
  const rows = await sql<{ detail: string }>`
    select detail from wallet_ledger where user_id = ${id} and op_key like ${`hurry:${at}:%`} order by created_at desc limit 1
  `;
  try {
    const d = JSON.parse(rows[0]?.detail ?? "") as { arrive?: number };
    return typeof d.arrive === "number" ? d.arrive : null;
  } catch {
    return null;
  }
}

/** 0.1.2 Hurry up: skip whole minutes of the open ride for coin. The server sets the new arrival (30 s floor, never before now) and charges it. */
async function hurryRide(sql: Sql, sessionUserId: string, id: string, wallet: WalletState, min: number): Promise<ClientResult> {
  const ticket = await latestTicket(sql, id);
  const now = Date.now();
  if (!ticket) return refused(wallet, "no-ticket");
  const cur = (await hurriedArrive(sql, id, ticket.at)) ?? ticket.at + ticket.ms;
  if (now >= cur) return refused(wallet, "arrived");
  const target = hurryTarget(ticket.at, cur, now, min);
  if (target == null) return refused(wallet, "nothing-to-skip");
  const cost = hurryCost(cur - target);
  const r = await mutateWallet(sql, sessionUserId, `hurry:${ticket.at}:${cur}`, (w) =>
    w.coins < cost ? { ok: false, reason: "short-coins" } : { ...applyDelta(w, { coins: -cost }), detail: JSON.stringify({ arrive: target, full: ticket.ms, cost }) },
  );
  return { ...applied(r), hurry: r.ok ? { arriveAt: target, cost } : undefined };
}

/** Pay the open ticket from the server clock. A win is scored here from the dealt seed and the submitted moves. */
async function payRide(sql: Sql, sessionUserId: string, id: string, wallet: WalletState, op: Extract<ClientOp, { kind: "ride" }>): Promise<ClientResult> {
  const ticket = await latestTicket(sql, id);
  if (!ticket) return refused(wallet, "no-ticket");
  const now = Date.now();
  const hurried = await hurriedArrive(sql, id, ticket.at);
  const clock = { departAt: ticket.at, arriveAt: hurried ?? ticket.at + ticket.ms, now, fullMs: ticket.ms };
  const watch = op.watch === true;
  if (op.deal) {
    const seed = rideSeed(id, ticket.at);
    const n = nextRound(wallet, ticket.at);
    const r = await mutateWallet(sql, sessionUserId, `ride:${ticket.at}:d:${n}`, (w) => rideOp(w, { ...clock, deal: { game: op.deal!, n, seed } }));
    const rideDeal = r.ok ? rideDealOf(r.detail) : undefined;
    return { ...applied(r), rideDeal };
  }
  if (op.round) {
    const n = Math.floor(op.round.n);
    const open = wallet.meta.rideAt === ticket.at && wallet.meta.rideOpenN === n && wallet.meta.rideGame;
    if (!open) {
      const wallSec = Math.floor(Math.max(0, Math.min(ticket.ms, now - ticket.at)) / 1000);
      const r = await mutateWallet(sql, sessionUserId, `ride:${ticket.at}:${wallSec}:p`, (w) => rideOp(w, { ...clock, play: true, watch }));
      return applied(r);
    }
    const moves = op.round;
    const r = await mutateWallet(sql, sessionUserId, `ride:${ticket.at}:r:${n}`, (w) => {
      if (w.meta.rideAt !== ticket.at || w.meta.rideOpenN !== n || !w.meta.rideGame) return { ok: false, reason: "busy" };
      const ramp = rideRamp(n, w.meta.rideBonusN === n);
      const outcome = scoreRide(w.meta.rideGame, rideSeed(id, ticket.at), n, w.meta.rideMs, ticket.to, moves, ramp);
      return rideOp(w, { ...clock, play: true, watch, touch: true, outcome });
    });
    return applied(r);
  }
  const wallSec = Math.floor(Math.max(0, Math.min(ticket.ms, now - ticket.at)) / 1000);
  const play = op.play === true;
  const r = await mutateWallet(sql, sessionUserId, `ride:${ticket.at}:${wallSec}${watch ? ":w" : ""}${play ? ":p" : ""}`, (w) =>
    rideOp(w, { ...clock, watch, play }),
  );
  return applied(r);
}
