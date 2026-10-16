import type { Sql } from "../lib/db.ts";
import { groupIds } from "./playerLinks.ts";
import { mutateWallet, canonicalWallet, priorGrades, type MutateResult } from "./walletSql.ts";
import {
  applyDelta,
  bankOp,
  blitzOp,
  contractOp,
  crateOp,
  dailyOp,
  friendOp,
  goalOp,
  gradeGrant,
  kioskOp,
  mergeFirstSync,
  printOp,
  pulseOp,
  refundMatchOp,
  rideOp,
  scoutOp,
  spendMatchOp,
  startOp,
  surveyOp,
  unlockOp,
  viewOf,
  type AwardView,
  type GradePay,
  type LocalSnap,
  type WalletState,
} from "./wallet.ts";
import type { KioskId } from "./data.ts";
import { cleanWardrobe, type CosmeticId, type Wardrobe } from "./cosmetics.ts";
import { WARDROBE_UPSERT } from "./wardrobeSql.ts";
import { buildWheel, grantWheelPrize, WHEEL_EVERY } from "./wheel.ts";
import { marketMatches, marketMult, marketOverflowCoin } from "./nightMarket.ts";
import { matchCap } from "./ticket.ts";
import type { CityId, Tier } from "./types.ts";
import type { RideOutcome } from "./rideGames.ts";

/** What the browser is allowed to see. */
export type WalletView = { coins: number; keys: Record<Tier, number>; cities: WalletState["cities"] };

export type Applied = MutateResult & { view: WalletView; authoritative: boolean };

function applied(r: MutateResult): Applied {
  return { ...r, view: viewOf(r.wallet), authoritative: r.wallet.migrated };
}

/** First sync takes the max, once, plus one revise so a reward landing mid-sync is not dropped. */
export async function syncPlayer(sql: Sql, userId: string, local: LocalSnap): Promise<Applied> {
  const { wallet } = await canonicalWallet(sql, userId);
  if (wallet.migrated && wallet.meta.revised) return applied({ ok: true, replay: true, wallet });
  const key = wallet.migrated ? "migrate-revise" : "migrate";
  const r = await mutateWallet(sql, userId, key, (w) => {
    if (w.migrated && (w.meta.revised || key === "migrate")) return { ok: true, wallet: w };
    const merged = mergeFirstSync(w, local);
    merged.migrated = true;
    if (key === "migrate-revise") merged.meta = { ...merged.meta, revised: true };
    return { ok: true, wallet: merged, detail: "sync" };
  });
  return applied(r);
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
    lucky: pay.lucky,
    cloth: pay.cloth,
    charmDay: pay.charmDay,
    charmTopics: pay.charmTopics,
    topic: pay.topic,
    dealtAt: pay.dealtAt,
    luckyHit: pay.luckyHit,
    perfectBlue: pay.perfectBlue,
  };
  const r = await mutateWallet(sql, userId, `grade:${nonce}`, (w) => {
    let base = w;
    // A walk-away put the match back. Answering after that takes it again, in this same write.
    if (refunded.length && full.clearTier) {
      const spent = spendMatchOp(base, full.clearTier);
      if (!spent.ok) {
        const letter = full.elapsedMs <= 3000 ? "perfect" : full.elapsedMs <= 10000 ? "great" : "good";
        const detail = JSON.stringify({ coins: 0, keys: {}, boosts: [], g: full.correct ? letter : "miss", pv: prevNonce });
        return { ok: true, wallet: w, award: { coins: 0, keys: {}, boosts: [] }, detail };
      }
      base = spent.wallet;
    }
    const grant = gradeGrant(base, full);
    if (!grant.ok) return grant;
    const letter = full.elapsedMs <= 3000 ? "perfect" : full.elapsedMs <= 10000 ? "great" : "good";
    const detail = JSON.stringify({ ...(grant.award ?? { coins: 0, keys: {}, boosts: [] }), g: full.correct ? letter : "miss", pv: prevNonce });
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
  | { kind: "kiosk"; id: KioskId }
  | { kind: "print"; id: CosmeticId }
  | { kind: "refund"; token: string }
  | { kind: "street"; id: string; tier: Tier; city: CityId; lat: number; lng: number }
  | { kind: "daily"; day: string; city: CityId }
  | { kind: "friend"; id: string }
  | { kind: "survey"; id: string }
  | { kind: "crate" }
  | { kind: "pulse" }
  | { kind: "contract"; id: string }
  | { kind: "blitz"; step: number }
  | { kind: "wheel"; tier: Tier; city: CityId }
  | { kind: "ride"; departAt: number; arriveAt: number; openMs: number; outcome: RideOutcome };

export type ClientResult = Applied & { wardrobe?: Wardrobe; ingredient?: { id: string; n: number }; line?: string };

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
    const rows = await sql<{ voided: boolean }>`
      select voided from daily_runs where day = ${op.day} and city = ${op.city} and user_id = ${sessionUserId} limit 1
    `;
    // The finish post can still be in flight when the pocket pays. A voided run never pays.
    // Missing row: pay once (the ledger key is the day and city). A forged call is one payout a day.
    if (rows[0]?.voided) return { ...applied({ ok: false, replay: false, reason: "no-run", wallet }), authoritative: true };
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
    return { ...applied(r), ingredient, line };
  }

  const key = opKey(op, wallet);
  const r = await mutateWallet(sql, sessionUserId, key, (w) => {
    switch (op.kind) {
      case "unlock":
        return unlockOp(w, op.cityId);
      case "start":
        return startOp(w, op.cityId);
      case "goal":
        return goalOp(w, op.cityId);
      case "bank":
        return bankOp(w, op.dir, op.tier);
      case "scout":
        return scoutOp(w, op.id);
      case "kiosk":
        return kioskOp(w, op.id);
      case "street": {
        const mult = marketMult(op.city, Date.now(), { kind: "match", lat: op.lat, lng: op.lng });
        const add = mult > 1 ? marketMatches(w.keys[op.tier] ?? 0, Math.max(matchCap(op.tier), (w.keys[op.tier] ?? 0) + 1), mult) : 1;
        const coin = mult > 1 ? marketOverflowCoin(op.tier, mult, add) : 0;
        return applyDelta(w, { coins: coin, keys: { [op.tier]: add } });
      }
      case "survey":
        return surveyOp(w, op.id);
      case "crate":
        return crateOp(w, today());
      case "pulse":
        return pulseOp(w);
      case "contract":
        return contractOp(w, today());
      case "blitz":
        return blitzOp(w, today(), op.step);
      case "ride":
        return rideOp(w, { ...op, now: Date.now() });
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
    case "street":
      return `street:${op.id}`;
    case "survey":
      return `survey:${op.id}`;
    case "crate":
      return `crate:${today()}`;
    case "pulse":
      return `pulse:${today()}`;
    case "contract":
      return `contract:${op.id}`;
    case "blitz":
      return `blitz:${today()}:${op.step}`;
    case "ride":
      return `ride:${op.departAt}:${Math.floor(op.openMs / 1000)}:${op.outcome.kind}`;
    default:
      return `op:${op.kind}`;
  }
}
