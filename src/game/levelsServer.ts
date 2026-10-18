/**
 * 0.0.98 levels and titles, server side. XP and title progress come from the server's own records
 * (plate_events, walk_distance, wallet_ledger), so every existing player is backfilled the first time
 * they (or a board) look. Level rewards are paid once per level through the wallet ledger (`level:<n>`).
 *
 * Backfill rule: the first look records the player's current level as the baseline and pays nothing for
 * the levels earned before 0.0.98 (no grants to existing players without Ryan's OK). Flip
 * LEVEL_BACKFILL_PAY to pay those levels instead.
 */
import type { Sql } from "../lib/db.ts";
import { CITY_LIST } from "./data.ts";
import { payMatchesOf } from "./goals.ts";
import {
  BOOST_MS,
  colorsAt,
  levelMatch,
  levelOf,
  rewardFor,
  titleName,
  titleRows,
  bestRun,
  xpOf,
  type LevelReward,
  type LevelTag,
  type TitleRow,
  type TitleStats,
  type XpInput,
} from "./levels.ts";
import { publicStandingName as standingName } from "./standings.ts";
import type { CityId, Tier, TriviaCat } from "./types.ts";
import { canonicalWallet, mutateWallet } from "./walletSql.ts";
import type { WalletState } from "./wallet.ts";

export const LEVEL_BACKFILL_PAY = false;

export type LevelStats = { xpIn: XpInput; stats: TitleStats };

export async function levelStats(sql: Sql, id: string, catOf?: (plateId: string) => TriviaCat | null): Promise<LevelStats> {
  const cat = catOf ?? (await import("./triviaBank.ts")).cardCat;
  const rows = await sql<{ plate_id: string; rarity: Tier; city: string | null; correct: boolean }>`
    select plate_id, rarity, city, correct from plate_events_by_player where user_id = ${id} order by answered_at, id
  `;
  const correctByTier: Partial<Record<Tier, number>> = {};
  const byCat: Partial<Record<TriviaCat, number>> = {};
  const cityCorrect: Partial<Record<CityId, number>> = {};
  const seq: boolean[] = [];
  for (const r of rows) {
    seq.push(Boolean(r.correct));
    if (!r.correct) continue;
    correctByTier[r.rarity] = (correctByTier[r.rarity] ?? 0) + 1;
    const c = cat(r.plate_id);
    if (c) byCat[c] = (byCat[c] ?? 0) + 1;
    if (r.city) cityCorrect[r.city as CityId] = (cityCorrect[r.city as CityId] ?? 0) + 1;
  }
  const walk = await sql<{ n: number }>`select coalesce(sum(meters), 0)::bigint as n from walk_distance_by_player where user_id = ${id}`;
  const led = await sql<{ goals: number; rides: number; perfects: number; market: number }>`
    select
      count(*) filter (where op_key like 'goal:%')::int as goals,
      count(distinct split_part(op_key, ':', 2)) filter (where op_key like 'ride:%')::int as rides,
      count(*) filter (where op_key like 'grade:%' and detail like '%"g":"perfect"%')::int as perfects,
      count(*) filter (where op_key like 'grade:%' and detail like '%"mk":1%')::int as market
    from wallet_ledger where user_id = ${id}
  `;
  const l = led[0];
  return {
    xpIn: { correctByTier, meters: Number(walk[0]?.n) || 0, goals: Number(l?.goals) || 0, rides: Number(l?.rides) || 0 },
    stats: {
      byCat,
      marketLamps: Number(l?.market) || 0,
      bestStreak: bestRun(seq),
      perfects: Number(l?.perfects) || 0,
      violet: correctByTier.violet ?? 0,
      cityCorrect,
    },
  };
}

export type GiftIn = { from: string; item: "match" | "boost"; tier?: Tier; at: number };

export type LevelView = {
  level: number;
  into: number;
  need: number;
  xp: number;
  title: string;
  titleName: string | null;
  color: string;
  colors: string[];
  rows: TitleRow[];
  boosts: number;
  gifts: number;
  boostUntil: number;
  /** Levels paid on this look (the client pops these). */
  paid: LevelReward[];
  giftsIn: GiftIn[];
  wallet: { coins: number; keys: Record<Tier, number> };
};

function payReward(w: WalletState, r: LevelReward): WalletState {
  const m = payMatchesOf(w.keys, r.match.tier, r.match.n);
  const next = { ...w, coins: w.coins + m.coin };
  return {
    ...next,
    keys: m.keys,
    meta: { ...next.meta, lvl: r.level, boosts: next.meta.boosts + (r.boost ? 1 : 0), gifts: next.meta.gifts + (r.gift ? 1 : 0) },
  };
}

async function patchMeta(sql: Sql, id: string, patch: Record<string, unknown>) {
  await sql.query(`update player_wallets set meta = meta || $2::jsonb, version = version + 1, updated_at = now() where user_id = $1`, [id, JSON.stringify(patch)]);
}

/** Look at a player's level: backfill, pay any new levels, refresh the board cache. */
export async function levelLook(sql: Sql, userId: string, catOf?: (plateId: string) => TriviaCat | null): Promise<LevelView> {
  const { id, wallet: w0 } = await canonicalWallet(sql, userId);
  const { xpIn, stats } = await levelStats(sql, id, catOf);
  const xp = xpOf(xpIn);
  const lv = levelOf(xp);
  if (!w0.meta.lvlInit) {
    await mutateWallet(sql, userId, "lvinit", (w) => ({ ok: true, wallet: { ...w, meta: { ...w.meta, lvlInit: true, lvl: LEVEL_BACKFILL_PAY ? 1 : lv.level } } }));
  }
  const paid: LevelReward[] = [];
  let w = (await canonicalWallet(sql, userId)).wallet;
  for (let n = Math.max(2, w.meta.lvl + 1); n <= lv.level; n++) {
    const r = rewardFor(n);
    const res = await mutateWallet(sql, userId, `level:${n}`, (cur) => (cur.meta.lvl >= n ? { ok: true, wallet: cur } : { ok: true, wallet: payReward(cur, r) }));
    if (!res.replay) paid.push(r);
    w = res.wallet;
  }
  if (w.meta.xp !== xp) await patchMeta(sql, id, { xp });
  // Friend gifts that landed since the last look.
  const got = await sql<{ detail: string; at: string }>`
    select detail, (extract(epoch from created_at) * 1000)::bigint::text as at from wallet_ledger
    where user_id = ${id} and op_key like 'lvgot:%' and created_at > to_timestamp(${w.meta.giftSeen / 1000}) order by created_at
  `;
  const giftsIn: GiftIn[] = [];
  for (const g of got) {
    try {
      giftsIn.push({ ...(JSON.parse(g.detail) as Omit<GiftIn, "at">), at: Number(g.at) });
    } catch {
      /* not a gift note */
    }
  }
  if (giftsIn.length) await patchMeta(sql, id, { giftSeen: Math.max(...giftsIn.map((g) => g.at)) });
  w = (await canonicalWallet(sql, userId)).wallet;
  const rows = titleRows(stats, CITY_LIST.map((c) => c.id));
  return {
    ...lv,
    title: w.meta.title,
    titleName: titleName(w.meta.title),
    color: w.meta.color,
    colors: colorsAt(lv.level),
    rows,
    boosts: w.meta.boosts,
    gifts: w.meta.gifts,
    boostUntil: w.meta.boostUntil,
    paid,
    giftsIn,
    wallet: { coins: w.coins, keys: w.keys },
  };
}

/** Pick the displayed title and name colour ("" clears). Only earned ones. */
export async function setLevelLook(sql: Sql, userId: string, pick: { title?: string; color?: string }, catOf?: (plateId: string) => TriviaCat | null): Promise<{ ok: boolean; reason?: string }> {
  const { id } = await canonicalWallet(sql, userId);
  const patch: Record<string, string> = {};
  if (pick.title != null) {
    if (pick.title) {
      const { stats } = await levelStats(sql, id, catOf);
      const row = titleRows(stats, CITY_LIST.map((c) => c.id)).find((r) => r.id === pick.title);
      if (!row?.earned) return { ok: false, reason: "not-earned" };
    }
    patch.title = pick.title;
  }
  if (pick.color != null) {
    if (pick.color) {
      const { xpIn } = await levelStats(sql, id, catOf);
      if (!colorsAt(levelOf(xpOf(xpIn)).level).includes(pick.color as never)) return { ok: false, reason: "not-earned" };
    }
    patch.color = pick.color;
  }
  await patchMeta(sql, id, patch);
  return { ok: true };
}

/** Spend a boost token: double streak pay for 15 minutes. */
export async function useLevelBoost(sql: Sql, userId: string, now = Date.now()): Promise<{ ok: boolean; boostUntil: number; reason?: string }> {
  const r = await mutateWallet(sql, userId, `lvboost:${now}`, (w) => {
    if (w.meta.boosts <= 0) return { ok: false, reason: "none" };
    if (w.meta.boostUntil > now) return { ok: false, reason: "running" };
    return { ok: true, wallet: { ...w, meta: { ...w.meta, boosts: w.meta.boosts - 1, boostUntil: now + BOOST_MS } } };
  });
  return { ok: r.ok, boostUntil: r.wallet.meta.boostUntil, ...(r.reason ? { reason: r.reason } : {}) };
}

/** True while a level boost doubles streak pay. */
export function boostOn(w: WalletState, now = Date.now()): boolean {
  return w.meta.boostUntil > now;
}

/** Send a friend a match (gift token) or a 15-min boost (boost token). Idempotent per nonce. */
export async function sendLevelGift(
  sql: Sql,
  userId: string,
  to: string,
  item: "match" | "boost",
  nonce: string,
): Promise<{ ok: boolean; reason?: string }> {
  const { id: from } = await canonicalWallet(sql, userId);
  const exists = await sql<{ user_id: string }>`select user_id from player_wallets where user_id = ${to} limit 1`;
  if (!exists.length) return { ok: false, reason: "no-player" };
  const { id: target } = await canonicalWallet(sql, to);
  if (target === from) return { ok: false, reason: "self" };
  let tier: Tier = "white";
  const sent = await mutateWallet(sql, userId, `lvsend:${nonce}`, (w) => {
    if (item === "match" && w.meta.gifts <= 0) return { ok: false, reason: "none" };
    if (item === "boost" && w.meta.boosts <= 0) return { ok: false, reason: "none" };
    tier = levelMatch(Math.max(2, w.meta.lvl)).tier;
    const meta = item === "match" ? { ...w.meta, gifts: w.meta.gifts - 1 } : { ...w.meta, boosts: w.meta.boosts - 1 };
    return { ok: true, wallet: { ...w, meta }, detail: JSON.stringify({ to: target, item, tier }) };
  });
  if (!sent.ok) return { ok: false, reason: sent.reason };
  if (sent.replay) {
    try {
      tier = (JSON.parse(sent.detail ?? "{}") as { tier?: Tier }).tier ?? tier;
    } catch {
      /* keep */
    }
  }
  const nameRow = await sql<{ name: string | null }>`select name from "user" where id = ${from} limit 1`;
  const fromName = standingName(nameRow[0]?.name ?? null);
  await mutateWallet(sql, target, `lvgot:${from}:${nonce}`, (w) => {
    if (item === "boost") return { ok: true, wallet: { ...w, meta: { ...w.meta, boosts: Math.min(99, w.meta.boosts + 1) } }, detail: JSON.stringify({ from: fromName, item }) };
    const m = payMatchesOf(w.keys, tier, 1);
    return { ok: true, wallet: { ...w, coins: w.coins + m.coin, keys: m.keys }, detail: JSON.stringify({ from: fromName, item, tier }) };
  });
  return { ok: true };
}

/** Level, title and name colour for board rows. Players never looked at get a look now (bounded). */
export async function levelTags(sql: Sql, ids: readonly string[], maxLooks = 25): Promise<Map<string, LevelTag>> {
  const out = new Map<string, LevelTag>();
  if (!ids.length) return out;
  const rows = await sql.query<{ user_id: string; meta: Record<string, unknown> | string | null }>(
    `select user_id, meta from player_wallets where user_id = any($1::text[])`,
    [ids as string[]],
  );
  const seen = new Set<string>();
  for (const r of rows) {
    const m = (typeof r.meta === "string" ? JSON.parse(r.meta) : r.meta) ?? {};
    if (m.lvlInit !== true) continue;
    seen.add(r.user_id);
    const title = typeof m.title === "string" ? titleName(m.title) : null;
    out.set(r.user_id, { level: levelOf(Number(m.xp) || 0).level, title, color: typeof m.color === "string" && m.color ? m.color : null });
  }
  let looks = 0;
  for (const id of ids) {
    if (seen.has(id) || looks >= maxLooks) continue;
    looks++;
    try {
      const { xpIn } = await levelStats(sql, id);
      out.set(id, { level: levelOf(xpOf(xpIn)).level, title: null, color: null });
    } catch {
      /* board still shows */
    }
  }
  return out;
}
