/**
 * 0.1.69 Ladders board: per trivia category, most right answers, the title rung reached (CAT_LADDERS at
 * TITLE_RUNGS), global top 5 plus your rank and the player just above you ("N behind <name>").
 * No migration: counts are rebuilt from the answer records (right answers grouped by player and card, then
 * each card mapped to its category in JS, since the category is not a column), cached 60 s per server.
 */
import type { Sql } from "../lib/db.ts";
import { CAT_LADDERS, TITLE_RUNGS } from "./levels.ts";
import { RIDE_BOARD_TOP, publicStandingName } from "./standings.ts";
import { currentPeriod, previousPeriod, weekKey } from "./questPeriods.ts";
import { CITY_IDS, type CityId, type TriviaCat } from "./types.ts";

export const LADDER_CATS = Object.keys(CAT_LADDERS) as TriviaCat[];

/** 0.1.90: `pct` = whole percent right of all answered tries in the category; null when no tries are known. */
/** 0.1.156: `first` = holds a first-to-title in this category (absent on older boards). */
export type LadderRow = { userId: string; name: string; rank: number; value: number; pct: number | null; rung: string | null; first?: boolean };
export type LadderMine = { value: number; pct: number | null; rank: number | null; rung: string | null; rival: { name: string; gap: number } | null; first?: boolean };
/** 0.1.156: span/scope/week/lastWeek/firsts are optional so older cached boards still read. */
export type LadderBoard = {
  cat: TriviaCat;
  top: LadderRow[];
  mine: LadderMine;
  span?: LadderSpan;
  scope?: LadderScope;
  week?: { key: string; end: number };
  lastWeek?: { name: string; value: number } | null;
  firsts?: LadderFirst[];
};

/** Highest title reached in `cat` with `n` right answers, or null below the first rung. */
export function rungFor(cat: TriviaCat, n: number): string | null {
  let out: string | null = null;
  TITLE_RUNGS.forEach((need, i) => {
    if (n >= need) out = CAT_LADDERS[cat][i] ?? out;
  });
  return out;
}

type Count = { userId: string; n: number; tries: number };

/** Whole percent right, or null when there are no tries. */
export function pctOf(n: number, tries: number): number | null {
  return tries > 0 ? Math.round((100 * Math.min(n, tries)) / tries) : null;
}
const order = (a: Count, b: Count) => b.n - a.n || a.userId.localeCompare(b.userId);

/** Per-category counts from (player, card, right answers) rows. Unknown cards are skipped. */
export function countByCat(rows: { userId: string; plateId: string; n: number; tries?: number }[], catOf: (id: string) => TriviaCat | null): Map<TriviaCat, Count[]> {
  const acc = new Map<TriviaCat, Map<string, { n: number; tries: number }>>();
  for (const r of rows) {
    const c = catOf(r.plateId);
    if (!c) continue;
    const m = acc.get(c) ?? new Map<string, { n: number; tries: number }>();
    const prev = m.get(r.userId) ?? { n: 0, tries: 0 };
    m.set(r.userId, { n: prev.n + r.n, tries: prev.tries + (r.tries ?? r.n) });
    acc.set(c, m);
  }
  const out = new Map<TriviaCat, Count[]>();
  for (const [c, m] of acc) out.set(c, [...m].map(([userId, v]) => ({ userId, n: v.n, tries: v.tries })).filter((x) => x.n > 0).sort(order));
  return out;
}

/** Top `limit`, plus my value, rank, rung and the player one place above me (names resolved by `names`). */
export function rankLadder(cat: TriviaCat, sorted: Count[], names: Map<string, string>, me?: string | null, limit = RIDE_BOARD_TOP): { top: LadderRow[]; mine: LadderMine } {
  const top = sorted.slice(0, limit).map((r, i) => ({ userId: r.userId, name: publicStandingName(names.get(r.userId) ?? ""), rank: i + 1, value: r.n, pct: pctOf(r.n, r.tries), rung: rungFor(cat, r.n) }));
  const i = me ? sorted.findIndex((r) => r.userId === me) : -1;
  if (i < 0) return { top, mine: { value: 0, pct: null, rank: null, rung: null, rival: null } };
  const mine = sorted[i]!;
  const above = i > 0 ? sorted[i - 1]! : null;
  return {
    top,
    mine: {
      value: mine.n,
      pct: pctOf(mine.n, mine.tries),
      rank: i + 1,
      rung: rungFor(cat, mine.n),
      rival: above ? { name: publicStandingName(names.get(above.userId) ?? ""), gap: above.n - mine.n } : null,
    },
  };
}

const COUNT_SQL = `
  select user_id, plate_id, city,
    (case when answered_at >= $1 then 2 when answered_at >= $2 then 1 else 0 end)::int as wk,
    (count(*) filter (where correct))::int as n, count(*)::int as tries
  from plate_events_by_player where answered_at is not null
  group by 1, 2, 3, 4
`;

export type LadderSpan = "all" | "week";
export type LadderScope = "all" | "city" | "friends";
/** First player to reach a title rung in a category, derived from current answer history (no extra table). */
export type LadderFirst = { rung: string; userId: string; name: string; at: number };
export type LadderOpts = { span?: LadderSpan; scope?: LadderScope; city?: CityId | null; friendIds?: readonly string[]; now?: number; catOf?: CatOf };

type Row = { userId: string; plateId: string; city: string | null; wk: number; n: number; tries: number };
type First = { cat: TriviaCat; rung: number; userId: string; at: number };
type Cache = { at: number; week: string; rows: Row[]; of: CatOf; views: Map<string, Map<TriviaCat, Count[]>>; firsts: First[] };
let cache: Cache | null = null;

type CatOf = (id: string) => TriviaCat | null;

export const isLadderCity = (c: unknown): c is CityId => typeof c === "string" && (CITY_IDS as readonly string[]).includes(c);

const ms = (v: string | Date) => (v instanceof Date ? v.getTime() : Date.parse(String(v)));

/**
 * 0.1.156: firsts are computed from the same answer records as the board — no new table, so a publish
 * without DATABASE_URL still shows badges. Walk each title-holder's right answers in time order (ties by
 * answer id); the first to each rung under today's card categories wins. A recategorized card or a newly
 * linked account can move a badge on the next recompute.
 */
async function loadFirsts(sql: Sql, all: Map<TriviaCat, Count[]>, of: CatOf): Promise<First[]> {
  const ids = [...new Set([...all.values()].flatMap((sorted) => sorted.filter((r) => r.n >= TITLE_RUNGS[0]!).map((r) => r.userId)))];
  if (!ids.length) return [];
  const rows = await sql.query<{ id: string; user_id: string; plate_id: string; answered_at: string | Date }>(
    `select id, user_id, plate_id, answered_at from plate_events_by_player where correct and answered_at is not null and user_id = any($1) order by answered_at, id`,
    [ids],
  );
  const run = new Map<string, number>();
  const taken = new Map<string, First>();
  for (const r of rows) {
    const cat = of(r.plate_id);
    if (!cat) continue;
    const key = `${r.user_id}\0${cat}`;
    const k = (run.get(key) ?? 0) + 1;
    run.set(key, k);
    TITLE_RUNGS.forEach((need, rung) => {
      if (k !== need) return;
      const id = `${cat}:${rung}`;
      if (!taken.has(id)) taken.set(id, { cat, rung, userId: r.user_id, at: ms(r.answered_at) });
    });
  }
  return [...taken.values()];
}

let inflight: Promise<Cache> | null = null;

function fresh(now: number, week: string) {
  return Boolean(cache && cache.week === week && now - cache.at <= 60_000);
}

async function fill(sql: Sql, now: number, week: string, catOf?: CatOf): Promise<Cache> {
  const cur = currentPeriod("week", now);
  const prev = previousPeriod("week", now);
  const raw = await sql.query<{ user_id: string; plate_id: string; city: string | null; wk: number; n: number; tries: number }>(COUNT_SQL, [new Date(cur.start).toISOString(), new Date(prev.start).toISOString()]);
  const of = catOf ?? (await import("./triviaBank.ts")).cardCat;
  const rows = raw.map((r) => ({ userId: r.user_id, plateId: r.plate_id, city: r.city, wk: Number(r.wk) || 0, n: Number(r.n) || 0, tries: Number(r.tries) || 0 }));
  cache = { at: now, week, rows, of, views: new Map(), firsts: [] };
  cache.firsts = await loadFirsts(sql, view("all", null), of);
  return cache!;
}

async function load(sql: Sql, now: number, catOf?: CatOf): Promise<Cache> {
  const week = weekKey(now);
  if (fresh(now, week)) return cache!;
  if (!inflight) inflight = fill(sql, now, week, catOf).finally(() => { inflight = null; });
  await inflight;
  if (fresh(now, week)) return cache!;
  // The in-flight fill was for a different Chicago week (the Monday midnight edge).
  return fill(sql, now, week, catOf);
}

/** Counts for a span ("last" = the week before this one) and an optional city, built once per recompute. */
function view(span: LadderSpan | "last", city: CityId | null): Map<TriviaCat, Count[]> {
  const c = cache!;
  const key = `${span}:${city ?? ""}`;
  let v = c.views.get(key);
  if (!v) {
    const wk = span === "week" ? 2 : span === "last" ? 1 : -1;
    v = countByCat(c.rows.filter((r) => (wk < 0 || r.wk === wk) && (!city || r.city === city)), c.of);
    c.views.set(key, v);
  }
  return v;
}

async function namesOf(sql: Sql, ids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (ids.length) {
    const n = await sql.query<{ id: string; name: string | null }>(`select id, name from "user" where id = any($1)`, [[...new Set(ids)]]).catch(() => []);
    for (const r of n) names.set(r.id, r.name ?? "");
  }
  return names;
}

/**
 * One category's board. Recomputed at most once a minute per server (all categories, spans and cities in one
 * scan), and again when the Chicago week turns. Defaults are the 0.1.69 all-time, everyone board.
 * 0.1.156: a 4th-arg function is still the `catOf` test hook; the server maps cards with triviaBank's cardCat.
 */
export async function ladderBoard(sql: Sql, cat: TriviaCat, me?: string | null, opts?: CatOf | LadderOpts): Promise<LadderBoard> {
  const o: LadderOpts = typeof opts === "function" ? { catOf: opts } : (opts ?? {});
  const span = o.span ?? "all";
  const scope = o.scope ?? "all";
  if (scope === "city" && !isLadderCity(o.city)) throw new Error("bad city");
  const city = scope === "city" ? (o.city as CityId) : null;
  const now = o.now ?? Date.now();
  const c = await load(sql, now, o.catOf);
  const keep = scope === "friends" ? new Set(me ? [me, ...(o.friendIds ?? [])] : []) : null;
  const pick = (v: Map<TriviaCat, Count[]>) => (v.get(cat) ?? []).filter((r) => !keep || keep.has(r.userId));
  const sorted = pick(view(span, city));
  const last = span === "week" ? (pick(view("last", city))[0] ?? null) : null;
  const firsts = c.firsts.filter((f) => f.cat === cat);
  const i = me ? sorted.findIndex((r) => r.userId === me) : -1;
  const ids = sorted.slice(0, RIDE_BOARD_TOP).map((r) => r.userId);
  if (i > 0) ids.push(sorted[i - 1]!.userId);
  if (last) ids.push(last.userId);
  ids.push(...firsts.map((f) => f.userId));
  const names = await namesOf(sql, ids);
  const { top, mine } = rankLadder(cat, sorted, names, me);
  // Titles are earned once: weekly, city and friends rows still show the all-time rung.
  const allTime = new Map((view("all", null).get(cat) ?? []).map((r) => [r.userId, r.n]));
  const held = new Set(firsts.map((f) => f.userId));
  const rows = top.map((r) => ({ ...r, rung: rungFor(cat, allTime.get(r.userId) ?? r.value), ...(held.has(r.userId) ? { first: true } : {}) }));
  const week = currentPeriod("week", now);
  return {
    cat,
    top: rows,
    mine: { ...mine, rung: me && mine.rank ? rungFor(cat, allTime.get(me) ?? mine.value) : mine.rung, ...(me && held.has(me) ? { first: true } : {}) },
    span,
    scope,
    week: { key: week.key, end: week.end },
    lastWeek: last ? { name: publicStandingName(names.get(last.userId) ?? ""), value: last.n } : null,
    firsts: firsts.map((f) => ({ rung: CAT_LADDERS[cat][f.rung] ?? "", userId: f.userId, name: publicStandingName(names.get(f.userId) ?? ""), at: f.at })),
  };
}

/** Test hook. */
export function resetLadderCache() {
  cache = null;
  inflight = null;
}
