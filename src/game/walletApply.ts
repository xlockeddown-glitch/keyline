import { isSkinId, skinOf, skinOwned } from "./skins.ts";
import { SHOP_PRICE, shopAnchor, shopOutput, type ShopState } from "./shop.ts";
import { loopCrate, loopCrateLoot, posterKey } from "./loop.ts";
import { canFly, souvenirKey } from "./flight.ts";
import { hasShield, streakRun } from "./scoutPerks.ts";
import { marketMult } from "./nightMarket.ts";
import { districtOf, districtsInDetails, isFreshDistrict } from "./district.ts";
import { carOf, isCarId, type CarId } from "./cars.ts";
import { printLook } from "./printsServer.ts";
import { HOME_LAMPS, KEY_MATCHES, houseCost, houseOf, isHouseTier, houseRank, type HouseState } from "./houses.ts";
import { cityDay } from "./vaultStack.ts";
import { PAINT_COLORS, type PaintColor } from "./ingredients.ts";
import { paintCost, type PaintBench, type PaintJob } from "./paint.ts";
import { CAN_ODDS, canId, colorOf, paintPrice, parseCan, rollCan, type Can } from "./carPaint.ts";
import { LONG_IDS, applyLegacy, claimQuest, luckyLive, type LegacyGrant, type LegacyIn, type LongId } from "./questServer.ts";
import { periodOf } from "./questPeriods.ts";
import { GOAL_ALL_PROOF_RIGHT, GOAL_ALL_TIER, GOAL_COIN, GOAL_PROOF_RIGHT, cachePrize, goalDay, payMatch, payMatches, payMatchesOf, streakPrize } from "./goals.ts";
import { PASS_GIFT_KEY, giftPass } from "./cityPass.ts";
import type { Sql } from "../lib/db.ts";
import { groupIds } from "./playerLinks.ts";
import { STOCK_COIN_KEY, stockCoin, stockNote } from "./stockCoin.ts";
import { mutateWallet, canonicalWallet, type MutateResult } from "./walletSql.ts";
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
import { PLACED_USER, PLANT_OK_KEY, placedKeys, plantKey, PLANT_RED_NEED, findPerfectStack, parsePlaced, placedKey, plantRefusal, type PlacedVault, type PlantCat } from "./placedLantern.ts";
import type { ScoutId } from "./types.ts";
import { MARKET_LIGHTS, bestLight, nextLight, type LightId } from "./marketLights.ts";
import { THANKS_CAR, THANKS_CAR_COIN, THANKS_CAR_KEY, THANKS_GIFT_KEY, thanksClock, THANKS_HOUSE, THANKS_HOUSE_COIN, THANKS_HOUSE_KEY, thanksCity, thanksNote, type ThanksCar, type ThanksHouse } from "./thanksGift.ts";
import { COIN_CAP } from "./wallet.ts";
import { SCOUT_GIFTS, type ScoutGift, MATCH_GIFTS, giftsFor, type MatchGift } from "./matchGift.ts";
import { cleanWardrobe, type CosmeticId, type Wardrobe } from "./cosmetics.ts";
import { WARDROBE_UPSERT } from "./wardrobeSql.ts";
import { buildWheel, grantWheelPrize, WHEEL_EVERY } from "./wheel.ts";
import { isPlace, surveyProven } from "./survey.ts";
import { parseStreetId, STREET_DAY_CAP, STREET_FRESH_MS, streetSpot } from "./streetSpots.ts";
import { MAGNET_DAY_CAP, MAGNET_GAP_MS, roadTripPays, v2lPays } from "./carPerks.ts";
import { fareMs, FARES_CAP, lampCoolMs, sparkAllowed, sparkTier, hurryCost, hurryTarget, VAULTS_PER_FARE } from "./ticket.ts";
import { BLITZ_STEPS, CONTRACT_LAMPS } from "./dailyBlitz.ts";
import type { CityId, Tier } from "./types.ts";
import { OWN_CLAIM_USER, OWN_DAILY_CAP, ownPayFor, type OwnedLamp } from "./ownLamps.ts";
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

export type SyncApplied = Applied & { deviceClosed: boolean; playerId: string; giftNotes?: string[]; doubleUntil?: number; owned?: { scouts: ScoutId[]; charms: string[]; cloths: string[]; lights?: string[]; cars?: string[]; cans?: string[]; paint?: Partial<Record<CarId, string>>; houses?: Partial<Record<CityId, HouseState>>; homeClaims?: string[]; skins?: string[]; skin?: string | null; dyes?: AccountDyes; worn?: AccountWorn } };

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

/**
 * 0.1.82: trade the retired stock (brass, ink, vellum, schematics, press) for coin once, from the server wallet's own
 * counts (stockCoin.ts). One ledger key per canonical wallet, so a replay, a second device or a linked sign-in pays
 * nothing more. The stock fields are left as they are. Never fails the sync.
 */
export async function grantStockCoin(sql: Sql, userId: string): Promise<string[]> {
  try {
    let coin = 0;
    let clamped = false;
    const r = await mutateWallet(sql, userId, STOCK_COIN_KEY, (w) => {
      const m = w.meta;
      coin = stockCoin({ brass: m.brass, ink: m.ink, vellum: m.vellum, schematic: m.schematic, press: m.press });
      const next = applyDelta(w, { coins: coin });
      if (!next.ok) return next;
      const paid = next.wallet.coins - w.coins;
      clamped = paid < coin;
      return { ...next, detail: JSON.stringify({ coin, paid, brass: m.brass, ink: m.ink, vellum: m.vellum, schematic: m.schematic, press: m.press }) };
    });
    if (!r.ok || r.replay || coin <= 0) return [];
    return [clamped ? `${stockNote(coin)} (your coins were near the cap, so this filled them to the top)` : stockNote(coin)];
  } catch (e) {
    console.warn("[wallet] stock trade-in skipped", e instanceof Error ? e.message : e);
    return [];
  }
}

/** 0.1.120: Lantern Shops retired. One ledger key per canonical wallet (one-time buy-back). */
export const SHOP_RETIRE_KEY = "gift:shop-retire-0120";
export function shopRetireNote(n: number, coin: number): string {
  return `Lantern Shops are retired. Your ${n} shop${n === 1 ? " was" : "s were"} bought back for ${coin.toLocaleString("en-US")} coins.`;
}

/**
 * 0.1.120: buy back every Lantern Shop this account owns: SHOP_PRICE each plus the coin waiting in its till, once,
 * clamped at the coin cap. Accounts with no shop write nothing. The shop:/shopc: rows stay as they are. Never fails the sync.
 */
export async function grantShopRetire(sql: Sql, userId: string): Promise<string[]> {
  try {
    const shops = Object.entries(await shopsOf(sql, userId)) as [CityId, ShopState][];
    if (!shops.length) return [];
    const now = Date.now();
    const coin = shops.reduce((sum, [, st]) => sum + SHOP_PRICE + shopOutput(st.anchor, now).coin, 0);
    let clamped = false;
    const r = await mutateWallet(sql, userId, SHOP_RETIRE_KEY, (w) => {
      const next = applyDelta(w, { coins: coin });
      if (!next.ok) return next;
      const paid = next.wallet.coins - w.coins;
      clamped = paid < coin;
      return { ...next, detail: JSON.stringify({ coin, paid, at: now, shops: shops.map(([c, st]) => ({ city: c, anchor: st.anchor, till: shopOutput(st.anchor, now).coin })) }) };
    });
    if (!r.ok || r.replay) return [];
    const note = shopRetireNote(shops.length, coin);
    return [clamped ? `${note} (your coins were near the cap, so this filled them to the top)` : note];
  } catch (e) {
    console.warn("[wallet] shop buy-back skipped", e instanceof Error ? e.message : e);
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

/** 0.1.61: map skins this account bought (skin:<id>) and the one it wears (latest skinon:<ms>). */
export async function skinsOf(sql: Sql, userId: string): Promise<{ skins: string[]; skin: string | null }> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string; detail: string }>`
    select op_key, detail from wallet_ledger where user_id = ${id} and (op_key like ${"skin:%"} or op_key like ${"skinon:%"}) order by created_at asc, op_key asc
  `;
  const skins: string[] = [];
  let skin: string | null = null;
  for (const r of rows) {
    const [kind, rest] = r.op_key.split(":");
    if (kind === "skin" && isSkinId(rest) && !skins.includes(rest)) skins.push(rest);
    else if (kind === "skinon") {
      try {
        const want = (JSON.parse(r.detail ?? "{}") as { id?: unknown }).id;
        if (isSkinId(want)) skin = want;
      } catch {
        /* a row without an id changes nothing */
      }
    }
  }
  return { skins, skin };
}

/** 0.1.106: what the account wears in each slot. A missing slot means no device has chosen one yet (it may backfill). */
export type WearSlot = "print" | "cloth" | "car" | "light";
export type AccountWorn = Partial<Record<WearSlot, string | null>>;

/**
 * 0.1.106 worn picks (worn:<slot>:<ms>, detail {id}). Latest row wins. Buying a car or a market light puts it on
 * too (car:<id> / light:<id> rows count as picks), as the shop does on a device; a gifted car does not.
 */
export async function wornOf(sql: Sql, userId: string): Promise<AccountWorn> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string; detail: string | null }>`
    select op_key, detail from wallet_ledger where user_id = ${id} and (op_key like ${"worn:%"} or op_key like ${"car:%"} or op_key like ${"light:%"}) order by created_at asc, op_key asc
  `;
  const out: AccountWorn = {};
  for (const r of rows) {
    const [kind, a] = r.op_key.split(":");
    // A gifted car (the thanks car) is owned, not chosen: it never overrides a pick.
    if (kind === "car" && isCarId(a) && !/"gift":true/.test(r.detail ?? "")) out.car = a;
    else if (kind === "light" && MARKET_LIGHTS.some((l) => l.id === a)) out.light = a;
    else if (kind === "worn" && (a === "print" || a === "cloth" || a === "car" || a === "light")) {
      try {
        const want = (JSON.parse(r.detail ?? "{}") as { id?: unknown }).id;
        if (want === null || typeof want === "string") out[a] = want;
      } catch {
        /* a row without an id changes nothing */
      }
    }
  }
  return out;
}

/** Why the account can't wear `id` in `slot` (null = it can). */
async function wearRefusal(sql: Sql, userId: string, slot: WearSlot, id: string | null): Promise<string | null> {
  if (slot === "print") {
    if (id === null) return null;
    const row = (await printLook(sql, userId)).find((p) => p.id === id);
    return !row ? "unknown" : row.earned ? null : "not-owned";
  }
  if (slot === "cloth") {
    if (id === null) return null;
    return (await ownedOf(sql, userId)).cloths.includes(id) ? null : "not-owned";
  }
  if (slot === "car") {
    if (id === null || id === "cab") return null;
    if (!isCarId(id)) return "unknown";
    return (await carsOf(sql, userId)).includes(id) ? null : "not-owned";
  }
  if (id === null || !MARKET_LIGHTS.some((l) => l.id === id)) return "unknown";
  return ((await lightsOf(sql, userId)).ids as string[]).includes(id) ? null : "not-owned";
}

/** 0.1.105: the account's paint bench. `rows` = 0 means this account never synced any (a device may backfill). */
export type AccountDyes = PaintBench & { rows: number };

const isPaintColor = (v: unknown): v is PaintColor => typeof v === "string" && (PAINT_COLORS as readonly string[]).includes(v);

/**
 * 0.1.105 coat / vault paint (dye:<job>:<color> once per mix, dyeon:<job>:<ms> for the worn one). A mix also puts it
 * on, like the vat does on a device; the latest row of a job decides what that job wears.
 */
export async function dyesOf(sql: Sql, userId: string): Promise<AccountDyes> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string; detail: string | null }>`
    select op_key, detail from wallet_ledger where user_id = ${id} and (op_key like ${"dye:%"} or op_key like ${"dyeon:%"}) order by created_at asc, op_key asc
  `;
  const out: AccountDyes = { coats: [], vaults: [], wornCoat: null, wornVault: null, rows: rows.length };
  for (const r of rows) {
    const [kind, job, rest] = r.op_key.split(":");
    if (job !== "coat" && job !== "vault") continue;
    const list = job === "coat" ? out.coats : out.vaults;
    let color: PaintColor | null | undefined;
    if (kind === "dye" && isPaintColor(rest)) {
      if (!list.includes(rest)) list.push(rest);
      color = rest;
    } else if (kind === "dyeon") {
      try {
        const want = (JSON.parse(r.detail ?? "{}") as { color?: unknown }).color;
        color = want === null ? null : isPaintColor(want) && list.includes(want) ? want : undefined;
      } catch {
        /* a row without a colour changes nothing */
      }
    }
    if (color === undefined) continue;
    if (job === "coat") out.wornCoat = color;
    else out.wornVault = color;
  }
  return out;
}

/**
 * 0.1.105: paint cans this account can prove it found, per colour. Green and up (and prism) are recorded one row per
 * find in paint_finds; white and blue are never recorded, so they are capped by right answers on that tier (a clear
 * drops at most one can of its colour). Linked sign-ins count together.
 */
export async function cansFound(sql: Sql, userId: string): Promise<Record<PaintColor, number>> {
  const ids = await groupIds(sql, userId);
  const out = Object.fromEntries(PAINT_COLORS.map((c) => [c, 0])) as Record<PaintColor, number>;
  for (const uid of ids) {
    const finds = await sql<{ paint: string; n: number }>`select paint, count(*)::int as n from paint_finds where user_id = ${uid} group by paint`;
    for (const f of finds) if (isPaintColor(f.paint) && f.paint !== "white" && f.paint !== "blue") out[f.paint] += Number(f.n) || 0;
    const clears = await sql<{ tier: string; correct: number }>`select tier, correct from vault_clears where user_id = ${uid} and tier in ('white', 'blue')`;
    for (const c of clears) if (c.tier === "white" || c.tier === "blue") out[c.tier] += Number(c.correct) || 0;
  }
  return out;
}

/** Cans of each colour the account's mixes have used (coat and vault jobs share the colour's cans). */
function cansSpent(d: PaintBench): Record<PaintColor, number> {
  const out = Object.fromEntries(PAINT_COLORS.map((c) => [c, 0])) as Record<PaintColor, number>;
  for (const c of d.coats) out[c] += paintCost(c, "coat");
  for (const c of d.vaults) out[c] += paintCost(c, "vault");
  return out;
}

/** 0.1.59: Lantern Shops this account owns (shop:<city> rows) with each one's clock (latest shopc:<city>:<anchor>). */
export async function shopsOf(sql: Sql, userId: string): Promise<Partial<Record<CityId, ShopState>>> {
  const { id } = await canonicalWallet(sql, userId);
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${id} and (op_key like ${"shop:%"} or op_key like ${"shopc:%"})`;
  const bought: Partial<Record<CityId, number>> = {};
  const collects: Partial<Record<CityId, number[]>> = {};
  for (const r of rows) {
    const [kind, city, anchor] = r.op_key.split(":");
    if (!city || !(city in CITIES)) continue;
    const c = city as CityId;
    if (kind === "shop") {
      try {
        const at = Number((JSON.parse(r.detail ?? "{}") as { at?: unknown }).at);
        if (at > 0) bought[c] = at;
      } catch {
        /* a row without a clock is not a shop */
      }
    } else if (kind === "shopc" && Number(anchor) > 0) (collects[c] ??= []).push(Number(anchor));
  }
  const out: Partial<Record<CityId, ShopState>> = {};
  for (const [c, at] of Object.entries(bought) as [CityId, number][]) out[c] = { at, anchor: shopAnchor(at, collects[c] ?? []) };
  return out;
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
  giftNotes.push(...(await grantStockCoin(sql, userId)));
  giftNotes.push(...(await grantShopRetire(sql, userId)));
  const pt = await paintOf(sql, userId);
  const owned = { ...(await ownedOf(sql, userId)), lights: (await lightsOf(sql, userId)).ids, cars: await carsOf(sql, userId), cans: pt.cans.map((c) => canId(c.can)), paint: pt.paint, houses: await housesOf(sql, userId), homeClaims: await homeClaimsOf(sql, userId), ...(await skinsOf(sql, userId)), dyes: await dyesOf(sql, userId), worn: await wornOf(sql, userId) };
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
  pay: GradePay & { prevNonce: string; canRoll?: [number, number]; car?: CarId | null },
): Promise<Applied & { can?: Can }> {
  const { id } = await canonicalWallet(sql, userId);
  const prevNonce = pay.prevNonce;
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
    ...(pay.hearth ? { hearth: pay.hearth } : {}),
    streak: pay.streak,
    loot: pay.loot,
    lucky: false,
    cloth: null,
    charmDay: pay.charmDay,
    charmTopics: pay.charmTopics,
    favs: pay.favs,
    random: pay.random === true,
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
  // 0.1.14: new-district bonus on a lamp: has this 800 m square been lit today here?
  const district = full.correct && full.clearTier ? districtOf(full.city, full.lat, full.lng) : "";
  if (district) full.freshDistrict = isFreshDistrict(district, await districtsToday(sql, id, full.city));
  // 0.1.19: a spark (no match held) is capped on the server too: six a day, one per lamp (Chicago day).
  const spark = full.correct && full.clearTier == null && !full.poiId.startsWith("blitz-");
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
  // 0.1.51 Ioniq 5 Vehicle-to-load: a lit lamp (a right answer that spent a match) while
  // seated in the proven car pays +1 white, at most V2L_DAY_CAP a day per player. Each pay is flagged v2 on its grade row.
  const v2lLamp = full.correct && full.clearTier != null && !full.poiId.startsWith("blitz-");
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
  // 0.1.55 Bel Air Road trip: the first lit lamp in each city each day (Chicago day) while seated in the proven car
  // pays +1 white. Flagged rt on its grade row (which already carries the city), so at most one per city per day.
  const rt = v2lLamp && roadTripPays(pay.car ?? null, false)
    ? roadTripPays(
        pay.car ?? null,
        (
          await sql<{ detail: string; created_at: unknown }>`
            select detail, created_at from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"} and op_key <> ${"grade:" + nonce}
              and created_at >= ${new Date(Date.now() - 30 * 3600_000).toISOString()} and detail like ${'%"rt":1%'}
          `
        ).some((row) => chicagoDay(row.created_at) === chicagoDay(new Date()) && String(row.detail).includes(`"c":${JSON.stringify(full.city)}`)),
      )
    : false;
  let v2Paid = false;
  let rtPaid = false;
  const letter = full.elapsedMs <= 3000 ? "perfect" : full.elapsedMs <= 10000 ? "great" : "good";
  // 0.1.22: a quest lamp is a right answer on a lamp that spent a match (never a spark, never a blitz card).
  const questLamp = full.correct && full.clearTier != null && !spark && !full.poiId.startsWith("blitz-");
  const detailOf = (award: AwardView, counts = true) =>
    JSON.stringify({
      ...award,
      g: full.correct ? letter : "miss",
      ...(full.correct ? { t: full.poiTier } : {}),
      ...(questLamp && counts ? { ql: 1 } : {}),
      // 0.1.119: the last right answer of a Double/Triple Hearth run (the "Hearth climber" weekly quest).
      ...(full.correct && full.hearth && full.hearth.step + 1 >= (full.hearth.v === 3 ? 3 : 2) ? { hc: 1 } : {}),
      ...(full.correct && full.topic ? { tp: full.topic } : {}),
      pv: prevNonce,
      ...(full.correct && full.poiId ? { pi: full.poiId } : {}),
      // 0.1.12: the city, so a house can count today's lamps there (market lanterns and unnamed spots included).
      ...(full.correct ? { c: full.city } : {}),
      ...(district ? { d: district } : {}),
      ...(spark && sparkOk ? { sp: 1 } : {}),
      ...(v2Paid ? { v2: 1 } : {}),
      ...(rtPaid ? { rt: 1 } : {}),
      // 0.0.98: night-market lamp, for the Night Owl title.
      ...(full.correct && marketMult(full.city, full.dealtAt, { kind: "lamp", poiId: full.poiId, lat: full.lat, lng: full.lng }) > 1 ? { mk: 1 } : {}),
    });
  // 0.1.42: did this write burn a match on a miss (an owned lamp's owner is paid for those)?
  let matchLost = false;
  const withV2l = (res: OpResult & { detail?: string }): OpResult & { detail?: string } => {
    const flag = v2l ? "v2" : rt ? "rt" : null;
    if (!flag || !res.ok || !res.wallet.migrated) return res;
    const p = payMatch(res.wallet.keys, "white");
    const k = p.tier ? { [p.tier]: 1 } : {};
    const extra = applyDelta(res.wallet, { coins: p.coin, keys: k });
    if (!extra.ok) return res;
    const award = res.award ?? { coins: 0, keys: {}, boosts: [] };
    const keys = { ...award.keys };
    for (const [t, n] of Object.entries(k) as [Tier, number][]) keys[t] = (keys[t] ?? 0) + n;
    const v2Award = { ...award, coins: award.coins + p.coin, keys, boosts: [...award.boosts, flag === "v2" ? "Vehicle-to-load: +1 white" : "Road trip: +1 white"] };
    if (flag === "v2") v2Paid = true;
    else rtPaid = true;
    return { ok: true, wallet: extra.wallet, award: v2Award, detail: detailOf(v2Award) };
  };
  const r = await mutateWallet(sql, userId, `grade:${nonce}`, (w) => {
    matchLost = false;
    v2Paid = false;
    rtPaid = false;
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
      const award = { coins: 0, keys: {}, boosts: [sparkTier(full.poiTier) ? "Sparks are spent today" : "Violet needs a violet key"] };
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
        const award = { coins: p.coin, keys: k, boosts: p.up ? ["Shell: key back ↑"] : ["Shell: key back"] };
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
  if (r.ok && !r.replay && matchLost && full.poiId) await payOwner(sql, id, nonce, full.poiId);
  // 0.1.111: a visitor's right answer at a placed Hearth vault pays its owner a cut.
  if (r.ok && !r.replay && full.correct && full.poiId.startsWith("placed-")) {
    try {
      await payHearthOwner(sql, id, nonce, full.poiId, full.city);
    } catch (e) {
      console.warn("[hearth] owner cut failed", e instanceof Error ? e.message : e);
    }
  }
  // 0.1.119: the 10th right red (V) or violet answer unlocks the Hearth vault, once (the ladders are gone).
  if (r.ok && !r.replay && full.correct && (full.poiTier === "red" || full.poiTier === "violet")) {
    if ((await redRight(sql, id)) >= PLANT_RED_NEED) {
      await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${PLANT_OK_KEY}, ${JSON.stringify({ via: "red10", g: "grade:" + nonce })}) on conflict (user_id, op_key) do nothing`;
    }
  }
  // 0.1.9: a right answer on an amber / red vault sometimes turns up a paint can.
  const odds = full.clearTier === "amber" ? CAN_ODDS.amber : full.clearTier === "red" ? CAN_ODDS.red : 0;
  // 0.1.117: a Double/Triple Hearth rolls its can on the last question only (like a ladder's last card).
  const canStep = !full.hearth || full.hearth.step + 1 >= (full.hearth.v === 3 ? 3 : 2);
  if (r.ok && !r.replay && r.wallet.migrated && full.correct && odds && pay.canRoll && canStep) {
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
 * Place a gifted lantern: `ownfree:<tier>` on the player plus a global `ownpoi:<poi>` claim row. The claim insert is
 * the lock (primary key): taken first, released if the placement doesn't land, so two players can't get one lamp.
 * 0.1.115 (Ryan): street vaults can no longer be bought (`own:<tier>` is closed: "closed"); existing owners keep
 * their claim rows and payOwner still pays them.
 */
async function ownLampOp(sql: Sql, sessionUserId: string, poiId: string, free = false): Promise<ClientResult> {
  const { id, wallet } = await canonicalWallet(sql, sessionUserId);
  if (!free) return refused(wallet, "closed");
  const hit = ownableLamp(poiId);
  if (!hit) return refused(wallet, "unknown");
  const tier = hit.poi.tier;
  // 0.1.43: a gifted lantern is its own key (ownfree:<tier>), free, and needs the gift row.
  const key = `ownfree:${tier}`;
  const keys = giftKeysFor(tier);
  const gift = keys.length ? await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${"gift:lamp-%"}` : [];
  if (!gift.some((g) => keys.includes(g.op_key))) return refused(wallet, "no-gift");
  const held = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${key} limit 1`;
  const heldPoi = (d: string | undefined) => {
    try {
      return (JSON.parse(d ?? "{}") as { poi?: string }).poi ?? null;
    } catch {
      return null;
    }
  };
  if (held.length) return heldPoi(held[0]!.detail) === poiId ? applied({ ok: true, replay: true, wallet }) : refused(wallet, "owned");
  const name = await ownerName(sql, sessionUserId);
  const claim = await sql<{ op_key: string }>`
    insert into wallet_ledger (user_id, op_key, detail) values (${OWN_CLAIM_USER}, ${"ownpoi:" + poiId}, ${JSON.stringify({ owner: id, tier, city: hit.city, name, free: 1 })})
    on conflict (user_id, op_key) do nothing returning op_key
  `;
  if (!claim.length) return refused(wallet, "taken");
  const release = () => sql`delete from wallet_ledger where user_id = ${OWN_CLAIM_USER} and op_key = ${"ownpoi:" + poiId} and detail like ${`%"owner":${JSON.stringify(id)}%`}`;
  try {
    const r = await mutateWallet(sql, sessionUserId, key, (w) => ({ ...applyDelta(w, {}), detail: JSON.stringify({ poi: poiId, city: hit.city, name }) }));
    // A same-color placement that raced this one won with another lamp: give this lamp back.
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

/** 0.1.109: every placed Hearth vault in `city` (all cities when null). */
export async function placedIn(sql: Sql, city: string | null): Promise<PlacedVault[]> {
  const rows = city
    ? await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${PLACED_USER} and detail like ${`%"city":${JSON.stringify(city)}%`}`
    : await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${PLACED_USER}`;
  return rows.map((r) => parsePlaced(r.detail)).filter((p): p is PlacedVault => p !== null && (!city || p.city === city));
}

/** 0.1.110: what anyone sees of a city's Hearth vaults: public id, spot, name, fields, "First L." (no owner id). */
export async function placedViews(sql: Sql, city: string, viewerId: string | null): Promise<import("./hearthVaults.ts").HearthView[]> {
  const { rowId } = await import("./hearthVaults.ts");
  const me = viewerId ? (await canonicalWallet(sql, viewerId)).id : null;
  const out = [];
  for (const p of await placedIn(sql, city)) {
    out.push({ id: rowId(p), city: p.city, lat: p.lat, lng: p.lng, name: p.name, cats: p.cats, by: await ownerName(sql, p.owner), ...(p.v === 2 || p.v === 3 ? { v: p.v } : {}), ...(me === p.owner ? { mine: true } : {}) });
  }
  return out;
}

/**
 * 0.1.111: the owner's cut. HEARTH_CUT coin per visitor right answer, one paid open per visitor a Chicago day
 * (`hcut:<day>:<visitor hash>` on the owner: the key is the lock), HEARTH_CUT_CAP a day, 1 in 10 also a V key.
 * Never the owner's own opens; never a new account (under 3 days or under 25 right answers).
 */
export async function payHearthOwner(sql: Sql, visitorId: string, nonce: string, poiId: string, city: string, now = Date.now()): Promise<boolean> {
  const { rowId } = await import("./hearthVaults.ts");
  const { HEARTH_CUT, HEARTH_CUT_CAP, HEARTH_NEW_DAYS, HEARTH_NEW_RIGHT, hearthCutKey, hearthMatch } = await import("./placedLantern.ts");
  const placed = (await placedIn(sql, city)).find((p) => rowId(p) === poiId);
  if (!placed) return false;
  const owner = placed.owner;
  const visitor = (await canonicalWallet(sql, visitorId)).id;
  if (visitor === owner) return false;
  const first = await sql<{ t: unknown }>`select min(created_at) as t from wallet_ledger where user_id = ${visitor}`;
  const born = first[0]?.t ? new Date(String(first[0].t instanceof Date ? first[0].t.toISOString() : first[0].t)).getTime() : now;
  if (now - born < HEARTH_NEW_DAYS * 86_400_000) return false;
  const right = await sql<{ n: unknown }>`select count(*) as n from wallet_ledger where user_id = ${visitor} and op_key like ${"grade:%"} and detail not like ${'%"g":"miss"%'}`;
  if (Number(right[0]?.n ?? 0) < HEARTH_NEW_RIGHT) return false;
  const day = chicagoDay(new Date(now));
  const today = await sql<{ n: unknown }>`select count(*) as n from wallet_ledger where user_id = ${owner} and op_key like ${`hcut:${day}:%`}`;
  if (Number(today[0]?.n ?? 0) * HEARTH_CUT >= HEARTH_CUT_CAP) return false;
  const match = hearthMatch(nonce);
  // 0.1.122: one paid open per visitor a day per Hearth (a per-version Hearth adds ":v<slot>"); the daily cap stays per owner.
  const slot = placed.slot;
  const r = await mutateWallet(sql, owner, hearthCutKey(day, visitor) + (slot ? `:v${slot}` : ""), (w) => {
    const coins = Math.max(0, Math.min(HEARTH_CUT, COIN_CAP - w.coins));
    const d = applyDelta(w, { coins, keys: match ? { red: 1 } : {} });
    return d.ok ? { ...d, detail: JSON.stringify({ c: coins, m: match ? 1 : 0, at: now, ...(slot ? { s: slot } : {}) }) } : d;
  });
  return r.ok && !r.replay;
}

/** 0.1.111: the owner's "Your Hearth" numbers (counts only; no visitor ids leave the server). */
export async function hearthStats(sql: Sql, ownerId: string, now = Date.now(), only?: { slot?: 1 | 2 | 3 }): Promise<import("./placedLantern.ts").HearthStats> {
  const { HEARTH_CUT_CAP } = await import("./placedLantern.ts");
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${ownerId} and op_key like ${"hcut:%"}`;
  const day = chicagoDay(new Date(now));
  const s = { today: { opens: 0, coin: 0, keys: 0 }, total: { opens: 0, coin: 0, keys: 0 }, cap: HEARTH_CUT_CAP };
  for (const r of rows) {
    let d: { c?: number; m?: number; s?: number } = {};
    try {
      d = JSON.parse(r.detail);
    } catch {
      /* keep zeros */
    }
    // 0.1.122: per Hearth when asked; a row without `s` is the bare-key (pre-0.1.122) Hearth's.
    if (only && (d.s || undefined) !== only.slot) continue;
    const add = (b: { opens: number; coin: number; keys: number }) => {
      b.opens += 1;
      b.coin += Number(d.c) || 0;
      b.keys += d.m ? 1 : 0;
    };
    add(s.total);
    if (r.op_key.startsWith(`hcut:${day}:`)) add(s.today);
  }
  return s;
}

/** 0.1.122: the player's placed Hearth rows (at most one per version), oldest key first. */
async function myPlaced(sql: Sql, id: string): Promise<PlacedVault[]> {
  const keys = placedKeys(id);
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${PLACED_USER} and op_key like ${`placed:${id}%`}`; // filtered to exact keys below
  const out: PlacedVault[] = [];
  for (const k of keys) {
    const p = parsePlaced(rows.find((r) => r.op_key === k)?.detail);
    if (p) out.push(p);
  }
  return out;
}

export type MyHearth = { v: 1 | 2 | 3; id: string; mine: PlacedVault; stats: import("./placedLantern.ts").HearthStats };

/**
 * 0.1.109: the player's Hearth vault state for the Journal: locked, ready, or placed. 0.1.122: `hearths` lists one
 * entry per placed version (each with its own stats); `mine`/`stats` stay as the first, for old clients.
 */
export async function plantStatus(sql: Sql, userId: string): Promise<{ unlocked: boolean; mine: PlacedVault | null; stats?: import("./placedLantern.ts").HearthStats; red?: number; hearths?: MyHearth[] }> {
  const { id } = await canonicalWallet(sql, userId);
  const { rowId } = await import("./hearthVaults.ts");
  const { hearthVersion } = await import("./hearthMulti.ts");
  const rows = await myPlaced(sql, id);
  if (!rows.length) {
    const unlocked = await plantUnlocked(sql, userId);
    return { unlocked, mine: null, ...(unlocked ? {} : { red: Math.min(PLANT_RED_NEED, await redRight(sql, id)) }) };
  }
  // 0.1.111: the owner id stays on the server; the client gets the spot, name, fields and counts.
  const hearths: MyHearth[] = [];
  for (const p of rows) {
    const { owner: _owner, ...pub } = p;
    hearths.push({ v: hearthVersion(p.v), id: rowId(p), mine: { ...pub, owner: "" }, stats: await hearthStats(sql, id, Date.now(), { slot: p.slot }) });
  }
  hearths.sort((a, b) => a.v - b.v);
  return { unlocked: true, mine: hearths[0]!.mine, stats: hearths[0]!.stats, hearths };
}

/**
 * 0.1.109: place a Hearth vault, for good. Needs the Hearth unlock (10 right reds, 0.1.119) and an unlocked city; preset name,
 * exactly 4 fields, 40 m clear of every lamp and placed vault (your own too), ≤ 6 within 300 m. 0.1.122: one per
 * version (Single, Double, Triple): the version's `placed:` key (placedKey) is the lock (primary key); the player's
 * mirror row follows. Never moved or removed. Street snapping is checked on the client (the baked streets aren't in the server bundle).
 */
async function plantOp(sql: Sql, sessionUserId: string, op: { city: CityId; lat: number; lng: number; name: number; cats: string[]; v?: number }): Promise<ClientResult> {
  const { id, wallet } = await canonicalWallet(sql, sessionUserId);
  const city = CITIES[op.city];
  if (!city) return refused(wallet, "unknown");
  if (op.v !== undefined && op.v !== 1 && op.v !== 2 && op.v !== 3) return refused(wallet, "version");
  const v: 1 | 2 | 3 = op.v === 2 || op.v === 3 ? op.v : 1;
  const { hearthVersion } = await import("./hearthMulti.ts");
  const mine = await myPlaced(sql, id);
  const held = mine.find((p) => hearthVersion(p.v) === v);
  if (held) {
    const same = held.city === op.city && Math.abs(held.lat - op.lat) < 1e-6 && Math.abs(held.lng - op.lng) < 1e-6 && held.name === op.name;
    return same ? applied({ ok: true, replay: true, wallet }) : refused(wallet, "placed");
  }
  if (!(await plantUnlocked(sql, sessionUserId))) return refused(wallet, "no-unlock");
  if (!wallet.cities.unlocked.includes(op.city)) return refused(wallet, "locked");
  const others = await placedIn(sql, op.city);
  const why = plantRefusal(op, city.spawn, city.pois, others);
  if (why) return refused(wallet, why);
  // A Single takes the bare key when it's free (as before 0.1.122); everything else its own version key.
  const bareFree = !mine.some((p) => !p.slot);
  const slot: 1 | 2 | 3 | undefined = v === 1 && bareFree ? undefined : v;
  const row: PlacedVault = { owner: id, city: op.city, lat: op.lat, lng: op.lng, name: op.name, cats: op.cats as PlantCat[], at: Date.now(), ...(v > 1 ? { v } : {}), ...(slot ? { slot } : {}) };
  const claim = await sql<{ op_key: string }>`
    insert into wallet_ledger (user_id, op_key, detail) values (${PLACED_USER}, ${placedKey(id, slot)}, ${JSON.stringify(row)})
    on conflict (user_id, op_key) do nothing returning op_key
  `;
  if (!claim.length) return refused(wallet, "placed");
  const r = await mutateWallet(sql, sessionUserId, plantKey(slot), (w) => ({ ...applyDelta(w, {}), detail: JSON.stringify(row) }));
  return applied(r);
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
  // 0.1.117: a card that was already answered is not a walk-away (a Double/Triple Hearth's first key stays spent).
  const graded = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key = ${"grade:" + nonce} limit 1`;
  if (graded.length) return { ...applied({ ok: true, replay: false, wallet }), skipped: true };
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
  /** 0.1.59 Lantern Shop: buy one in a city; collect its waiting coin. */
  | { kind: "shop"; city: CityId }
  | { kind: "shopCollect"; city: CityId }
  /** 0.1.61 map skins: buy one; choose the one to wear (any owned or free skin). */
  | { kind: "skin"; id: string }
  | { kind: "skinOn"; id: string }
  /** 0.1.105 coat / vault paint on the account: mix one (spends found cans, puts it on), or wear one (null = off). */
  | { kind: "dye"; job: PaintJob; color: PaintColor }
  | { kind: "dyeOn"; job: PaintJob; color: PaintColor | null }
  /** 0.1.106 worn picks on the account: city print on the coat, cloth, car ("cab" = the city cab, null = best owned), market light. */
  | { kind: "wear"; slot: WearSlot; id: string | null }
  | { kind: "own"; poi: string; free?: boolean }
  | { kind: "plant"; city: CityId; lat: number; lng: number; name: number; cats: string[]; v?: 1 | 2 | 3 }
  | { kind: "hurry"; min: number }
  /** 0.1.58: arrive now (skip the ride); `ride` = took the Loop (crate roll + route poster). */
  | { kind: "loop"; ride: boolean }
  /** 0.1.70: arrive by air (far routes only): closes the ticket and files the destination souvenir. */
  | { kind: "fly" }
  | {
      kind: "ride";
      watch?: boolean;
      play?: boolean;
      /** 0.1.121: still parsed for old tabs, always refused. */
      deal?: string;
      round?: { n: number } & Record<string, unknown>;
    };

export type ClientResult = Applied & {
  wardrobe?: Wardrobe;
  ingredient?: { id: string; n: number };
  line?: string;
  /** 0.0.92: index of the slice the server rolled and paid (the client animates to it). */
  wheelWin?: number;
  wheelRoll?: number;
  /** 0.0.93: the matches a cache paid (the rest became coin). */
  cache?: { got: Tier[]; coin: number; already?: boolean };
  /** 0.1.2: the arrival and charge the server set for a Hurry up. */
  hurry?: { arriveAt: number; cost: number };
  /** 0.1.58: the Loop ride paid a mystery crate. */
  loop?: { crate: boolean };
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

  if (op.kind === "plant") return plantOp(sql, sessionUserId, op);

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
    // 0.1.97: the same roll sets the coin jitter; it goes back to the client so its faces match the payout.
    const wheelRoll = Math.random();
    const offer = buildWheel(op.tier, op.city, wheelRoll);
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
    return { ...applied(r), ingredient, line, wheelWin: offer.win, wheelRoll };
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

  // 0.1.61: buy a map skin (free skins need no row).
  if (op.kind === "skin") {
    const def = skinOf(op.id);
    if (!def) return refused(wallet, "unknown");
    if (def.price === 0 || (await skinsOf(sql, sessionUserId)).skins.includes(def.id)) return applied({ ok: true, replay: true, wallet });
    const r = await mutateWallet(sql, sessionUserId, `skin:${def.id}`, (w) =>
      w.coins < def.price ? { ok: false, reason: "short-coins" } : { ...applyDelta(w, { coins: -def.price }), detail: JSON.stringify({ id: def.id }) },
    );
    return applied(r);
  }

  // 0.1.61: wear a skin. Only an owned (or free) one; the latest skinon row is the account's choice.
  if (op.kind === "skinOn") {
    const def = skinOf(op.id);
    if (!def) return refused(wallet, "unknown");
    const mine = await skinsOf(sql, sessionUserId);
    if (!skinOwned(def.id, mine.skins)) return refused(wallet, "not-owned");
    if (mine.skin === def.id) return applied({ ok: true, replay: true, wallet });
    const r = await mutateWallet(sql, sessionUserId, `skinon:${Date.now()}`, (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ id: def.id }) }));
    return applied(r);
  }

  // 0.1.105: mix a coat / vault paint on the account. Spends cans the server can prove were found.
  if (op.kind === "dye") {
    if (!isPaintColor(op.color) || (op.job !== "coat" && op.job !== "vault")) return refused(wallet, "unknown");
    const mine = await dyesOf(sql, sessionUserId);
    if ((op.job === "coat" ? mine.coats : mine.vaults).includes(op.color)) return applied({ ok: true, replay: true, wallet });
    const left = (await cansFound(sql, sessionUserId))[op.color] - cansSpent(mine)[op.color];
    if (left < paintCost(op.color, op.job)) return refused(wallet, "short-paint");
    const r = await mutateWallet(sql, sessionUserId, `dye:${op.job}:${op.color}`, (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ cans: paintCost(op.color, op.job) }) }));
    return applied(r);
  }

  // 0.1.106: wear a print / cloth / car / market light the account owns. Latest row wins.
  if (op.kind === "wear") {
    if (op.slot !== "print" && op.slot !== "cloth" && op.slot !== "car" && op.slot !== "light") return refused(wallet, "unknown");
    const why = await wearRefusal(sql, sessionUserId, op.slot, op.id);
    if (why) return refused(wallet, why);
    const now = await wornOf(sql, sessionUserId);
    if (op.slot in now && now[op.slot] === op.id) return applied({ ok: true, replay: true, wallet });
    const r = await mutateWallet(sql, sessionUserId, `worn:${op.slot}:${Date.now()}`, (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ id: op.id }) }));
    return applied(r);
  }

  // 0.1.105: wear a mixed paint (or take it off). Only one this account mixed; the latest row is the choice.
  if (op.kind === "dyeOn") {
    if (op.job !== "coat" && op.job !== "vault") return refused(wallet, "unknown");
    if (op.color !== null && !isPaintColor(op.color)) return refused(wallet, "unknown");
    const mine = await dyesOf(sql, sessionUserId);
    if (op.color !== null && !(op.job === "coat" ? mine.coats : mine.vaults).includes(op.color)) return refused(wallet, "not-owned");
    if ((op.job === "coat" ? mine.wornCoat : mine.wornVault) === op.color) return applied({ ok: true, replay: true, wallet });
    const r = await mutateWallet(sql, sessionUserId, `dyeon:${op.job}:${Date.now()}`, (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ color: op.color }) }));
    return applied(r);
  }

  // 0.1.120: Lantern Shops are retired (bought back once by grantShopRetire). Old tabs still send these ops.
  if (op.kind === "shop") {
    return refused(wallet, "retired");
  }

  // 0.1.120: Lantern Shops are retired (bought back once by grantShopRetire). Old tabs still send these ops.
  if (op.kind === "shopCollect") {
    return refused(wallet, "retired");
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
  // 0.1.121: the timed train and its ride games went in 0.1.95; old tabs still send the ride op.
  if (op.kind === "ride") return refused(wallet, "retired");
  if (op.kind === "loop") return loopArrive(sql, sessionUserId, id, wallet, op.ride);
  if (op.kind === "fly") return flyArrive(sql, sessionUserId, id, wallet);
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
  // 0.1.58: an early arrival (Hurry up, skip, Loop) closes the ticket, so the next board spends a new one.
  if (prev && now < ((await hurriedArrive(sql, id, prev.at)) ?? prev.at + prev.ms)) return { ...applied({ ok: true, replay: true, wallet }), authoritative: true };
  if (held < 1) return refused(wallet, "no-ticket");
  const ms = fareMs(from, to);
  const r = await mutateWallet(sql, sessionUserId, `ticket:${spent}`, (w) => {
    if (!w.cities.unlocked.includes(from) || !w.cities.unlocked.includes(to)) return { ok: false, reason: "locked" };
    return { ok: true, wallet: w, detail: JSON.stringify({ at: now, from, to, ms }) };
  });
  return applied(r);
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

/** 0.1.58: arrive now. Closes the open ticket at no charge; a Loop ride also rolls its crate and files the route poster. */
async function loopArrive(sql: Sql, sessionUserId: string, id: string, wallet: WalletState, ride: boolean): Promise<ClientResult> {
  const ticket = await latestTicket(sql, id);
  const now = Date.now();
  if (!ticket) return refused(wallet, "no-ticket");
  const cur = (await hurriedArrive(sql, id, ticket.at)) ?? ticket.at + ticket.ms;
  if (now >= cur) return refused(wallet, "arrived");
  const crate = ride && loopCrate(ticket.at);
  const r = await mutateWallet(sql, sessionUserId, `hurry:${ticket.at}:loop`, (w) =>
    crate
      ? { ...applyDelta(w, { keys: loopCrateLoot() }), detail: JSON.stringify({ arrive: now, full: ticket.ms, cost: 0, crate }) }
      : { ok: true, wallet: w, detail: JSON.stringify({ arrive: now, full: ticket.ms, cost: 0 }) },
  );
  if (r.ok && ride) {
    await mutateWallet(sql, sessionUserId, posterKey(ticket.from, ticket.to), (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ at: now }) }));
  }
  return { ...applied(r), loop: r.ok ? { crate } : undefined };
}

/** 0.1.70: arrive by air. Like the Loop: closes the open ticket at no charge, but only on a far route, and files `souvenir:<to>` once. */
async function flyArrive(sql: Sql, sessionUserId: string, id: string, wallet: WalletState): Promise<ClientResult> {
  const ticket = await latestTicket(sql, id);
  const now = Date.now();
  if (!ticket) return refused(wallet, "no-ticket");
  if (!canFly(ticket.from as CityId, ticket.to as CityId)) return refused(wallet, "too-near");
  const cur = (await hurriedArrive(sql, id, ticket.at)) ?? ticket.at + ticket.ms;
  if (now >= cur) return refused(wallet, "arrived");
  const r = await mutateWallet(sql, sessionUserId, `hurry:${ticket.at}:fly`, (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ arrive: now, full: ticket.ms, cost: 0, fly: true }) }));
  if (r.ok) await mutateWallet(sql, sessionUserId, souvenirKey(ticket.to as CityId), (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ at: now, from: ticket.from }) }));
  return applied(r);
}

/** 0.1.119: right answers on red (V) or violet vaults, from the server's grade rows (`t` is only on a right answer). */
export async function redRight(sql: Sql, id: string): Promise<number> {
  const rows = await sql<{ n: unknown }>`
    select count(*) as n from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"}
      and (detail like ${'%"t":"red"%'} or detail like ${'%"t":"violet"%'}) and detail not like ${'%"g":"miss"%'}
  `;
  return Number(rows[0]?.n ?? 0);
}

/**
 * 0.1.99: has this player unlocked the placed lantern? The `plantok` row, or (back-fill) a past perfect Stack in
 * their grade rows since 0.1.36, which writes the row the first time it's found.
 */
export async function plantUnlocked(sql: Sql, userId: string): Promise<boolean> {
  const { id } = await canonicalWallet(sql, userId);
  const have = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key = ${PLANT_OK_KEY} limit 1`;
  if (have.length) return true;
  // 0.1.119: 10 right red (V) or violet answers unlock it (counted from the server's own grade rows).
  if ((await redRight(sql, id)) >= PLANT_RED_NEED) {
    await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${PLANT_OK_KEY}, ${JSON.stringify({ via: "red10" })}) on conflict (user_id, op_key) do nothing`;
    return true;
  }
  const rows = await sql<{ op_key: string; detail: string }>`
    select op_key, detail from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"} and detail like ${'%"pi":"__stack__"%'} and detail like ${"%Perfect ladder:%"}
  `;
  const proof = findPerfectStack(rows);
  if (!proof) return false;
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${PLANT_OK_KEY}, ${JSON.stringify({ g: proof, backfill: 1 })}) on conflict (user_id, op_key) do nothing`;
  return true;
}
