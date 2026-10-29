/**
 * 0.1.69 Ladders board: per trivia category, most right answers, the title rung reached (CAT_LADDERS at
 * TITLE_RUNGS), global top 5 plus your rank and the player just above you ("N behind <name>").
 * No migration: counts are rebuilt from the answer records (right answers grouped by player and card, then
 * each card mapped to its category in JS, since the category is not a column), cached 60 s per server.
 */
import type { Sql } from "../lib/db.ts";
import { CAT_LADDERS, TITLE_RUNGS } from "./levels.ts";
import { RIDE_BOARD_TOP, publicStandingName } from "./standings.ts";
import type { TriviaCat } from "./types.ts";

export const LADDER_CATS = Object.keys(CAT_LADDERS) as TriviaCat[];

export type LadderRow = { userId: string; name: string; rank: number; value: number; rung: string | null };
export type LadderMine = { value: number; rank: number | null; rung: string | null; rival: { name: string; gap: number } | null };
export type LadderBoard = { cat: TriviaCat; top: LadderRow[]; mine: LadderMine };

/** Highest title reached in `cat` with `n` right answers, or null below the first rung. */
export function rungFor(cat: TriviaCat, n: number): string | null {
  let out: string | null = null;
  TITLE_RUNGS.forEach((need, i) => {
    if (n >= need) out = CAT_LADDERS[cat][i] ?? out;
  });
  return out;
}

type Count = { userId: string; n: number };
const order = (a: Count, b: Count) => b.n - a.n || a.userId.localeCompare(b.userId);

/** Per-category counts from (player, card, right answers) rows. Unknown cards are skipped. */
export function countByCat(rows: { userId: string; plateId: string; n: number }[], catOf: (id: string) => TriviaCat | null): Map<TriviaCat, Count[]> {
  const acc = new Map<TriviaCat, Map<string, number>>();
  for (const r of rows) {
    const c = catOf(r.plateId);
    if (!c) continue;
    const m = acc.get(c) ?? new Map<string, number>();
    m.set(r.userId, (m.get(r.userId) ?? 0) + r.n);
    acc.set(c, m);
  }
  const out = new Map<TriviaCat, Count[]>();
  for (const [c, m] of acc) out.set(c, [...m].map(([userId, n]) => ({ userId, n })).filter((x) => x.n > 0).sort(order));
  return out;
}

/** Top `limit`, plus my value, rank, rung and the player one place above me (names resolved by `names`). */
export function rankLadder(cat: TriviaCat, sorted: Count[], names: Map<string, string>, me?: string | null, limit = RIDE_BOARD_TOP): { top: LadderRow[]; mine: LadderMine } {
  const top = sorted.slice(0, limit).map((r, i) => ({ userId: r.userId, name: publicStandingName(names.get(r.userId) ?? ""), rank: i + 1, value: r.n, rung: rungFor(cat, r.n) }));
  const i = me ? sorted.findIndex((r) => r.userId === me) : -1;
  if (i < 0) return { top, mine: { value: 0, rank: null, rung: null, rival: null } };
  const mine = sorted[i]!;
  const above = i > 0 ? sorted[i - 1]! : null;
  return {
    top,
    mine: {
      value: mine.n,
      rank: i + 1,
      rung: rungFor(cat, mine.n),
      rival: above ? { name: publicStandingName(names.get(above.userId) ?? ""), gap: above.n - mine.n } : null,
    },
  };
}

const COUNT_SQL = `
  select user_id, plate_id, count(*)::int as n
  from plate_events_by_player where correct and answered_at is not null
  group by user_id, plate_id
`;

let cache: { at: number; byCat: Map<TriviaCat, Count[]> } | null = null;

type CatOf = (id: string) => TriviaCat | null;

async function counts(sql: Sql, catOf?: CatOf): Promise<Map<TriviaCat, Count[]>> {
  if (!cache || Date.now() - cache.at > 60_000) {
    const rows = await sql.query<{ user_id: string; plate_id: string; n: number }>(COUNT_SQL);
    const of = catOf ?? (await import("./triviaBank.ts")).cardCat;
    cache = { at: Date.now(), byCat: countByCat(rows.map((r) => ({ userId: r.user_id, plateId: r.plate_id, n: Number(r.n) || 0 })), of) };
  }
  return cache.byCat;
}

/** One category's board. Recomputed at most once a minute per server (all 14 categories in one pass). */
/** `catOf` is a test hook; the server maps cards with triviaBank's cardCat. */
export async function ladderBoard(sql: Sql, cat: TriviaCat, me?: string | null, catOf?: CatOf): Promise<LadderBoard> {
  const sorted = (await counts(sql, catOf)).get(cat) ?? [];
  const i = me ? sorted.findIndex((r) => r.userId === me) : -1;
  const ids = sorted.slice(0, RIDE_BOARD_TOP).map((r) => r.userId);
  if (i > 0) ids.push(sorted[i - 1]!.userId);
  const names = new Map<string, string>();
  if (ids.length) {
    const n = await sql.query<{ id: string; name: string | null }>(`select id, name from "user" where id = any($1)`, [ids]).catch(() => []);
    for (const r of n) names.set(r.id, r.name ?? "");
  }
  return { cat, ...rankLadder(cat, sorted, names, me) };
}

/** Test hook. */
export function resetLadderCache() {
  cache = null;
}
