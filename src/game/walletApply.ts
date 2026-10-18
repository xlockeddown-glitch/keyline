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
  charmOp,
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
import { CITIES, type KioskId } from "./data.ts";
import { rideSeed, scoreRide, type RideMoves } from "./rideGrade.ts";
import type { RideGameId } from "./rideGames.ts";
import { cleanWardrobe, type CosmeticId, type Wardrobe } from "./cosmetics.ts";
import { WARDROBE_UPSERT } from "./wardrobeSql.ts";
import { buildWheel, grantWheelPrize, WHEEL_EVERY } from "./wheel.ts";
import { isPlace, surveyProven } from "./survey.ts";
import { parseStreetId, STREET_DAY_CAP, STREET_FRESH_MS, streetSpot } from "./streetSpots.ts";
import { fareMs, FARES_CAP, VAULTS_PER_FARE } from "./ticket.ts";
import { BLITZ_STEPS, CONTRACT_LAMPS } from "./dailyBlitz.ts";
import type { CityId, Tier } from "./types.ts";

/** What the browser is allowed to see. */
export type WalletView = { coins: number; keys: Record<Tier, number>; cities: WalletState["cities"] };

export type Applied = MutateResult & { view: WalletView; authoritative: boolean };

function applied(r: MutateResult): Applied {
  return { ...r, view: viewOf(r.wallet), authoritative: r.wallet.migrated };
}

/** One device may merge its local save once, plus one revise. A sixth device is ignored. */
export const DEVICE_CAP = 5;
const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;

export type SyncApplied = Applied & { deviceClosed: boolean; playerId: string };

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

export async function syncPlayer(sql: Sql, userId: string, local: LocalSnap, deviceId: string): Promise<SyncApplied> {
  await grantPassGift(sql, userId);
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
export async function awardGrade(sql: Sql, userId: string, nonce: string, pay: Omit<GradePay, "prior"> & { prevNonce: string }): Promise<Applied> {
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
    step: pay.step,
    steps: pay.steps,
    prior,
    streak: pay.streak,
    loot: pay.loot,
    lucky: false,
    cloth: null,
    charmDay: pay.charmDay,
    charmTopics: pay.charmTopics,
    topic: pay.topic,
    dealtAt: pay.dealtAt,
    luckyHit: false,
    perfectBlue: pay.perfectBlue,
  };
  const letter = full.elapsedMs <= 3000 ? "perfect" : full.elapsedMs <= 10000 ? "great" : "good";
  const detailOf = (award: AwardView) =>
    JSON.stringify({
      ...award,
      g: full.correct ? letter : "miss",
      pv: prevNonce,
      ...(full.correct && full.poiId ? { pi: full.poiId } : {}),
    });
  const r = await mutateWallet(sql, userId, `grade:${nonce}`, (w) => {
    const owned = provenBoost(pay.lucky, pay.cloth, { lucky: w.meta.lucky, cloths: new Set(w.meta.cloths) });
    full.lucky = owned.lucky;
    full.cloth = owned.cloth;
    full.luckyHit = owned.lucky && pay.luckyHit;
    let base = w;
    // A walk-away put the match back. Answering after that takes it again, in this same write.
    if (refunded.length && full.clearTier) {
      const spent = spendMatchOp(base, full.clearTier);
      if (!spent.ok) {
        const award = { coins: 0, keys: {}, boosts: [] };
        return { ok: true, wallet: w, award, detail: detailOf(award) };
      }
      base = spent.wallet;
    }
    const grant = gradeGrant(base, full);
    if (!grant.ok) return grant;
    const detail = detailOf(grant.award ?? { coins: 0, keys: {}, boosts: [] });
    if (!base.migrated || !full.correct) return { ok: true, wallet: base, award: grant.award, detail };
    return { ...grant, detail };
  });
  return applied(r);
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
  | { kind: "street"; id: string; tier: Tier; city: CityId; lat: number; lng: number }
  | { kind: "charm"; id: string }
  | { kind: "cloth"; id: string }
  | { kind: "daily"; day: string; city: CityId }
  | { kind: "friend"; id: string }
  | { kind: "survey"; id: string }
  | { kind: "crate" }
  | { kind: "contract"; nonces: string[] }
  | { kind: "blitz"; step: number; nonces: string[] }
  | { kind: "wheel"; tier: Tier; city: CityId }
  | { kind: "board"; from: CityId; to: CityId }
  | {
      kind: "ride";
      watch?: boolean;
      play?: boolean;
      deal?: RideGameId;
      round?: { n: number } & RideMoves;
    };

export type RideDeal = { seed: number; n: number; ms: number; game: string };

export type ClientResult = Applied & {
  wardrobe?: Wardrobe;
  ingredient?: { id: string; n: number };
  line?: string;
  /** 0.0.92: index of the slice the server rolled and paid (the client animates to it). */
  wheelWin?: number;
  rideDeal?: RideDeal;
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
    const rows = await sql<{ rewarded: boolean; sender_id: string; friend_id: string | null }>`
      select rewarded, sender_id, friend_id from friend_tickets where token = ${token} limit 1
    `;
    const row = rows[0];
    if (!row?.rewarded || (!ids.includes(row.sender_id) && !(row.friend_id && ids.includes(row.friend_id)))) {
      return { ...applied({ ok: false, replay: false, reason: "no-ticket", wallet }), authoritative: true };
    }
    const r = await mutateWallet(sql, sessionUserId, `friend:${op.id}`, (w) => friendOp(w, 1));
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
    const ingredient = prize.kind === "ingredient" ? { id: prize.id, n: prize.n } : undefined;
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
      if (!(await cityFresh(sql, id, ids, op.city))) return refused(wallet, "unproven");
      const prior = await sql<{ n: number }>`
        select count(*)::int as n from wallet_ledger
        where user_id = ${id} and op_key like ${"street:sk:" + op.city + ":" + day + ":%"}
      `;
      if ((Number(prior[0]?.n) || 0) >= STREET_DAY_CAP) return refused(wallet, "capped");
    }
    const r = await mutateWallet(sql, sessionUserId, key, (w) => streetOp(w, op.city, spot.tier, spot.market));
    return applied(r);
  }

  if (op.kind === "charm") {
    const r = await mutateWallet(sql, sessionUserId, `charm:${op.id}`, (w) => charmOp(w, op.id));
    return applied(r);
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
      return { seed: d.seed, n: d.n, ms: d.ms, game: d.game };
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

/** Pay the open ticket from the server clock. A win is scored here from the dealt seed and the submitted moves. */
async function payRide(sql: Sql, sessionUserId: string, id: string, wallet: WalletState, op: Extract<ClientOp, { kind: "ride" }>): Promise<ClientResult> {
  const ticket = await latestTicket(sql, id);
  if (!ticket) return refused(wallet, "no-ticket");
  const now = Date.now();
  const clock = { departAt: ticket.at, arriveAt: ticket.at + ticket.ms, now };
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
      const outcome = scoreRide(w.meta.rideGame, rideSeed(id, ticket.at), n, w.meta.rideMs, ticket.to, moves);
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
