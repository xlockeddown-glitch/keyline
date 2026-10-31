// 0.1.22: weekly / monthly quests on the server, and the one-time move off the old milestones and charms.
// Progress is recounted from this account's own ledger rows inside the period's Chicago window; the
// device never sends a count. Each quest pays once per period (op key quest:<period>:<id>).
import type { Sql } from "../lib/db.ts";
import { CITIES } from "./data.ts";
import { payMatchesOf } from "./goals.ts";
import { BONUS, LUCKY_OWNED_COIN, questDef, questProgress, questSet, type QuestCtx, type QuestDef, type QuestEvent, type QuestReward, type QuestRow } from "./questBoard.ts";
import { claimOpen, currentPeriod, monthKey, nextMonthKey, periodOf, previousPeriod, QUEST_GRACE_MS, type Period, type PeriodKind } from "./questPeriods.ts";
import type { CityId, Tier, TriviaCat } from "./types.ts";
import { STOCK_RATES } from "./stockCoin.ts";
import { applyDelta, type OpResult, type WalletState } from "./wallet.ts";
import { canonicalWallet, mutateWallet, type MutateResult } from "./walletSql.ts";

const TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];
const iso = (ms: number) => new Date(ms).toISOString();

function parse(detail: string): Record<string, unknown> | null {
  try {
    const d = JSON.parse(detail) as unknown;
    return d && typeof d === "object" ? (d as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const at = (v: unknown) => (v instanceof Date ? v.getTime() : new Date(String(v)).getTime());

/**
 * Quest events in [start, end). A lamp event is a graded right answer the server marked `ql`
 * (a lamp clear that spent a match: never a spark, never a blitz card). Any miss breaks a streak.
 * A ride event is a ride-game round the server scored, named by the game it dealt.
 */
export async function questEvents(sql: Sql, id: string, start: number, end: number): Promise<QuestEvent[]> {
  const out: QuestEvent[] = [];
  const grades = await sql<{ detail: string; created_at: unknown }>`
    select detail, created_at from wallet_ledger
    where user_id = ${id} and op_key like ${"grade:%"} and created_at >= ${iso(start)} and created_at < ${iso(end)}
  `;
  for (const row of grades) {
    const d = parse(String(row.detail));
    if (!d) continue;
    const t = at(row.created_at);
    if (d.g === "miss") out.push({ k: "miss", at: t });
    else if (d.ql === 1 && typeof d.t === "string" && TIERS.includes(d.t as Tier)) {
      out.push({
        k: "lamp",
        at: t,
        tier: d.t as Tier,
        city: typeof d.c === "string" && d.c in CITIES ? (d.c as CityId) : null,
        topic: typeof d.tp === "string" && d.tp ? (d.tp as TriviaCat) : null,
        market: d.mk === 1,
        district: typeof d.d === "string" && d.d ? d.d : null,
        perfect: d.g === "perfect",
      });
    }
  }
  const rounds = await sql<{ op_key: string; created_at: unknown }>`
    select op_key, created_at from wallet_ledger
    where user_id = ${id} and op_key like ${"ride:%:r:%"} and created_at >= ${iso(start)} and created_at < ${iso(end)}
  `;
  if (rounds.length) {
    const deals = await sql<{ op_key: string; detail: string }>`
      select op_key, detail from wallet_ledger where user_id = ${id} and op_key like ${"ride:%:d:%"} and created_at >= ${iso(start - QUEST_GRACE_MS)}
    `;
    const game = new Map<string, string>();
    for (const d of deals) {
      const g = parse(String(d.detail))?.game;
      if (typeof g === "string") game.set(d.op_key, g);
    }
    for (const r of rounds) {
      const g = game.get(r.op_key.replace(":r:", ":d:"));
      if (g) out.push({ k: "ride", at: at(r.created_at), game: g });
    }
  }
  // 0.1.22 banks: the daily match cache (cache:<day>), street matches (street:sk:…), a house key (hook:<city>:<day>).
  const other = await sql<{ op_key: string; created_at: unknown }>`
    select op_key, created_at from wallet_ledger
    where user_id = ${id} and (op_key like ${"cache:%"} or op_key like ${"street:sk:%"} or op_key like ${"hook:%"})
      and created_at >= ${iso(start)} and created_at < ${iso(end)}
  `;
  for (const o of other) {
    const t = at(o.created_at);
    if (o.op_key.startsWith("cache:")) out.push({ k: "cache", at: t });
    else if (o.op_key.startsWith("street:")) out.push({ k: "street", at: t });
    else out.push({ k: "hook", at: t, day: o.op_key.split(":")[2] ?? "" });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** What this account can do, so a quest it can't finish (a house key with no house) is never in its set. */
export async function questCtx(sql: Sql, id: string): Promise<QuestCtx> {
  const rows = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"house:%"}`;
  return { house: (Number(rows[0]?.n) || 0) > 0 };
}

export type QuestPeriodView = { key: string; kind: PeriodKind; start: number; end: number; grace: boolean; rows: Array<QuestRow & { paid: boolean }> };
export type QuestStatus = { now: number; periods: QuestPeriodView[]; lucky: { forever: boolean; month: string } };

async function paidKeys(sql: Sql, id: string, keys: string[]): Promise<Set<string>> {
  if (!keys.length) return new Set();
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${"quest:%"}`;
  const want = new Set(keys);
  return new Set(rows.map((r) => r.op_key).filter((k) => want.has(k)));
}

async function periodRows(sql: Sql, id: string, p: Period, now: number, ctx: QuestCtx): Promise<{ set: QuestDef[]; rows: QuestRow[] }> {
  const set = questSet(p.kind, id, p.key, ctx);
  return { set, rows: questProgress(p.kind, set, await questEvents(sql, id, p.start, Math.min(p.end, now + 1))) };
}

async function periodView(sql: Sql, id: string, p: Period, now: number, ctx: QuestCtx): Promise<QuestPeriodView> {
  const { rows } = await periodRows(sql, id, p, now, ctx);
  const paid = await paidKeys(sql, id, rows.map((r) => `quest:${p.key}:${r.id}`));
  return { key: p.key, kind: p.kind, start: p.start, end: p.end, grace: now >= p.end, rows: rows.map((r) => ({ ...r, paid: paid.has(`quest:${p.key}:${r.id}`) })) };
}

/** Today, this week and this month; the one before too while its 24 h grace runs and something is left to collect. */
export async function questStatus(sql: Sql, userId: string, now = Date.now()): Promise<QuestStatus> {
  const { id, wallet } = await canonicalWallet(sql, userId);
  const ctx = await questCtx(sql, id);
  const periods: QuestPeriodView[] = [];
  for (const kind of ["day", "week", "month"] as const) {
    periods.push(await periodView(sql, id, currentPeriod(kind, now), now, ctx));
    const prev = previousPeriod(kind, now);
    if (claimOpen(prev.key, now)) {
      const v = await periodView(sql, id, prev, now, ctx);
      if (v.rows.some((r) => r.done && !r.paid)) periods.push(v);
    }
  }
  return { now, periods, lucky: { forever: wallet.meta.lucky, month: wallet.meta.luckyMonth } };
}

/** Pay a quest's reward into the wallet. Matches go through the normal pocket rule (overflow becomes credit). */
export function payQuest(w: WalletState, reward: QuestReward, periodKey: string): OpResult & { lucky?: string } {
  let keys = w.keys;
  const add: Partial<Record<Tier, number>> = {};
  for (const t of reward.matches) {
    const p = payMatchesOf(keys, t, 1);
    keys = p.keys;
    add[t] = (add[t] ?? 0) + 1;
  }
  let coins = reward.coins;
  let meta: Partial<WalletState["meta"]> | undefined;
  let lucky: string | undefined;
  if (reward.lucky) {
    if (w.meta.lucky) coins += LUCKY_OWNED_COIN;
    else {
      lucky = nextMonthKey(periodKey) ?? undefined;
      if (lucky) meta = { luckyMonth: lucky };
    }
  }
  const r = applyDelta(w, { coins, keys: add, meta });
  if (!r.ok) return r;
  const boosts = lucky ? [`Lucky on for ${lucky.slice(1)}`] : [];
  return { ...r, award: { coins, keys: add, boosts }, detail: JSON.stringify({ coins, keys: add, boosts, ...(lucky ? { lucky } : {}) }), lucky };
}

export type QuestClaim = MutateResult & { quest?: { id: string; period: string; lucky?: string } };

/** Claim one quest. Refused unless the server's own recount says it is done in that period's window. */
export async function claimQuest(sql: Sql, userId: string, periodKey: string, questId: string, now = Date.now()): Promise<QuestClaim> {
  const { id, wallet } = await canonicalWallet(sql, userId);
  const def = questDef(questId);
  const p = periodOf(periodKey);
  if (!def || !p || p.kind !== def.kind) return { ok: false, replay: false, reason: "unknown", wallet };
  if (!claimOpen(periodKey, now)) return { ok: false, replay: false, reason: "closed", wallet };
  const { set, rows } = await periodRows(sql, id, p, now, await questCtx(sql, id));
  // Only this player's own set (and its bonus) for that period can be claimed.
  if (def.id !== BONUS[p.kind].id && !set.some((d) => d.id === def.id)) return { ok: false, replay: false, reason: "not-yours", wallet };
  if (!rows.find((r) => r.id === def.id)?.done) return { ok: false, replay: false, reason: "unproven", wallet };
  let lucky: string | undefined;
  const r = await mutateWallet(sql, userId, `quest:${periodKey}:${def.id}`, (w) => {
    const paid = payQuest(w, def.reward, periodKey);
    if (paid.ok) lucky = paid.lucky;
    return paid;
  });
  if (r.replay && r.detail) lucky = (parse(r.detail)?.lucky as string | undefined) ?? undefined;
  return { ...r, quest: { id: def.id, period: periodKey, lucky } };
}

/** Lucky pays on a grade when the account owns it for good, or this is the month a Full month bonus turned it on. */
export function luckyLive(meta: { lucky: boolean; luckyMonth: string }, now = Date.now()): boolean {
  return meta.lucky || (meta.luckyMonth !== "" && meta.luckyMonth === monthKey(now));
}


/* ------------------------------------------------------------------ legacy (milestones + charms) */

export type LongId = "hundred" | "unbroken" | "walk" | "violet" | "redbook";
export const LONG_IDS: LongId[] = ["hundred", "unbroken", "walk", "violet", "redbook"];
/** What each retired charm cost to print (stock + schematic, and one press ingredient). */
export const LEGACY_CHARM_COST = {
  scholar: { brass: 8, ink: 4, vellum: 0, schematic: 1 },
  sprinter: { brass: 6, ink: 0, vellum: 8, schematic: 1 },
  lantern: { brass: 10, ink: 6, vellum: 0, schematic: 1 },
} as const;
export type LegacyCharm = keyof typeof LEGACY_CHARM_COST;
/** 0.1.86: stock and schematics are cut (0.1.84), so legacy rewards that paid them pay coin at the trade-in rates (STOCK_RATES). */
export const LEGACY_UNBROKEN_COIN = STOCK_RATES.schematic;
export function legacyRefundCoin(charm: LegacyCharm): number {
  const c = LEGACY_CHARM_COST[charm];
  return (c.brass + c.ink + c.vellum) * STOCK_RATES.brass + c.schematic * STOCK_RATES.schematic + STOCK_RATES.press;
}
export const LEGACY_CHARM_CAP = 3;
export const LEGACY_THANKS_COIN = 1_000;

export type LegacyIn = {
  /** Long milestones the device already claimed (their rewards are already on the device). */
  claimed: LongId[];
  /** Cities whose circuit the device had armed (red + area) but not claimed. */
  circuits: CityId[];
  /** The device had milestone progress that was not finished. */
  unfinished: boolean;
  /** Charms the device printed. */
  charms: string[];
};

export type LegacyGrant =
  | { kind: "title"; id: LongId; title: string }
  | { kind: "coin"; id: LongId; coins: number }
  | { kind: "pattern"; id: LongId }
  | { kind: "cloth"; id: LongId | `scarf-${CityId}`; cloth: string }
  | { kind: "thanks"; coins: number }
  | { kind: "refund"; charm: LegacyCharm; coins: number }
  | { kind: "lucky" };

export type LegacyProof = { meters: number; visited: ReadonlySet<string> };

const POI = new Map<string, { tier: Tier; city: CityId }>();
for (const [cityId, city] of Object.entries(CITIES) as [CityId, (typeof CITIES)[CityId]][]) {
  for (const p of city.pois) POI.set(p.id, { tier: p.tier, city: cityId });
}

async function gradeRows(sql: Sql, id: string): Promise<Array<Record<string, unknown>>> {
  const rows = await sql<{ detail: string; created_at: unknown }>`
    select detail, created_at from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"} order by created_at asc, op_key asc
  `;
  return rows.map((r) => parse(String(r.detail))).filter((d): d is Record<string, unknown> => d != null);
}

/** Server checks for a long milestone, from records the server already keeps. */
export function longProven(id: LongId, grades: Array<Record<string, unknown>>, proof: LegacyProof): boolean {
  if (id === "hundred") return grades.filter((g) => g.g === "perfect").length >= 100;
  if (id === "unbroken") {
    let run = 0;
    for (const g of grades) {
      run = g.g === "perfect" ? run + 1 : 0;
      if (run >= 10) return true;
    }
    return false;
  }
  if (id === "walk") return proof.meters >= 10_000;
  if (id === "violet") return grades.some((g) => g.g !== "miss" && typeof g.pi === "string" && POI.get(g.pi)?.tier === "violet");
  const reds = new Set<CityId>();
  for (const pid of proof.visited) {
    const p = POI.get(pid);
    if (p?.tier === "red") reds.add(p.city);
  }
  return reds.size >= Object.keys(CITIES).length;
}

function redIn(city: CityId, grades: Array<Record<string, unknown>>): boolean {
  return grades.some((g) => g.g !== "miss" && typeof g.pi === "string" && POI.get(g.pi)?.tier === "red" && POI.get(g.pi)?.city === city);
}

function addCloth(w: WalletState, cloth: string): OpResult {
  if (w.meta.cloths.includes(cloth)) return { ok: true, wallet: w };
  return applyDelta(w, { meta: { cloths: [...w.meta.cloths, cloth] } });
}

/**
 * The move off milestones and charms, once per account (each part has its own legacy:* op key).
 * Earned rewards stay; a milestone the device had not claimed pays here only if the server can prove it;
 * unfinished progress gets 1,000 coin once; retired charms refund their print cost in coin, at most 3 per account;
 * a device's Lucky bit stays Lucky for good.
 */
export async function applyLegacy(sql: Sql, userId: string, input: LegacyIn, proof: LegacyProof): Promise<{ grants: LegacyGrant[]; wallet: WalletState }> {
  const { id } = await canonicalWallet(sql, userId);
  const grades = await gradeRows(sql, id);
  const grants: LegacyGrant[] = [];
  let last: WalletState | null = null;
  const run = async (key: string, fn: (w: WalletState) => OpResult, grant: LegacyGrant) => {
    const r = await mutateWallet(sql, userId, `legacy:${key}`, fn);
    last = r.wallet;
    if (r.ok && !r.replay) grants.push(grant);
  };
  const claimed = new Set(input.claimed.filter((x) => LONG_IDS.includes(x)));
  for (const lid of LONG_IDS) {
    if (claimed.has(lid) || !longProven(lid, grades, proof)) continue;
    if (lid === "hundred") await run(lid, (w) => applyDelta(w, { meta: { title: w.meta.title || "Clean hundred" } }), { kind: "title", id: lid, title: "Clean hundred" });
    else if (lid === "unbroken") await run(lid, (w) => applyDelta(w, { coins: LEGACY_UNBROKEN_COIN }), { kind: "coin", id: lid, coins: LEGACY_UNBROKEN_COIN });
    else if (lid === "violet") await run(lid, (w) => applyDelta(w, { meta: { patterns: w.meta.patterns + 1 } }), { kind: "pattern", id: lid });
    else if (lid === "walk") {
      await run(lid, (w) => {
        const c = addCloth(w, "road-dust");
        return c.ok ? applyDelta(c.wallet, { meta: { title: c.wallet.meta.title || "Walker" } }) : c;
      }, { kind: "cloth", id: lid, cloth: "road-dust" });
    } else await run(lid, (w) => addCloth(w, "red-book"), { kind: "cloth", id: lid, cloth: "red-book" });
  }
  for (const city of new Set(input.circuits)) {
    if (!(city in CITIES) || !redIn(city, grades)) continue;
    const cloth = `scarf-${city}` as const;
    await run(cloth, (w) => (w.cities.unlocked.includes(city) ? addCloth(w, cloth) : { ok: false, reason: "locked" }), { kind: "cloth", id: cloth, cloth });
  }
  if (input.unfinished) {
    await run("thanks", (w) => applyDelta(w, { coins: LEGACY_THANKS_COIN }), { kind: "thanks", coins: LEGACY_THANKS_COIN });
  }
  const charms = [...new Set(input.charms)];
  if (charms.includes("lucky")) await run("lucky", (w) => applyDelta(w, { meta: { lucky: true } }), { kind: "lucky" });
  for (const c of charms) {
    if (!(c in LEGACY_CHARM_COST)) continue;
    const charm = c as LegacyCharm;
    const done = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"legacy:charm:%"}`;
    if ((Number(done[0]?.n) || 0) >= LEGACY_CHARM_CAP) break;
    const coins = legacyRefundCoin(charm);
    await run(`charm:${charm}`, (w) => applyDelta(w, { coins }), { kind: "refund", charm, coins });
  }
  return { grants, wallet: last ?? (await canonicalWallet(sql, userId)).wallet };
}
