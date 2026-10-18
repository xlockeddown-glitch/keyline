/**
 * 0.0.99: Longest streak board: most right answers in a row, all-time best per player, computed on the server
 * from the answer records (plate_events_by_player, in answer order). No client number is read, and it covers
 * the whole history, so every player is backfilled.
 */
import type { Sql } from "../lib/db.ts";
import { RIDE_BOARD_TOP, publicStandingName, type RideBoardRow } from "./standings.ts";

const BEST_SQL = `
  with e as (
    select user_id, correct,
           sum(case when correct then 0 else 1 end) over (partition by user_id order by answered_at, id) as grp
    from plate_events_by_player where answered_at is not null
  ), runs as (
    select user_id, count(*) filter (where correct)::int as n from e group by user_id, grp
  )
  select user_id, max(n)::int as best from runs group by user_id having max(n) > 0
`;

export async function streakBests(sql: Sql): Promise<{ userId: string; best: number }[]> {
  const rows = await sql.query<{ user_id: string; best: number }>(BEST_SQL);
  return rows.map((r) => ({ userId: r.user_id, best: Number(r.best) || 0 }));
}

export function rankStreaks(rows: { userId: string; best: number }[], names: Map<string, string>, limit = RIDE_BOARD_TOP): RideBoardRow[] {
  return [...rows]
    .filter((r) => r.best > 0)
    .sort((a, b) => b.best - a.best || a.userId.localeCompare(b.userId))
    .slice(0, limit)
    .map((r, i) => ({ userId: r.userId, name: publicStandingName(names.get(r.userId) ?? ""), rank: i + 1, value: r.best }));
}

let cache: { at: number; rows: { userId: string; best: number }[] } | null = null;

/** Top 5 and (optionally) one player's best and rank. Recomputed at most once a minute per server. */
export async function streakBoard(sql: Sql, me?: string | null): Promise<{ top: RideBoardRow[]; mine: { value: number; rank: number | null } }> {
  if (!cache || Date.now() - cache.at > 60_000) cache = { at: Date.now(), rows: await streakBests(sql) };
  const rows = cache.rows;
  const topIds = [...rows].sort((a, b) => b.best - a.best || a.userId.localeCompare(b.userId)).slice(0, RIDE_BOARD_TOP).map((r) => r.userId);
  const names = new Map<string, string>();
  if (topIds.length) {
    const n = await sql.query<{ id: string; name: string | null }>(`select id, name from "user" where id = any($1)`, [topIds]).catch(() => []);
    for (const r of n) names.set(r.id, r.name ?? "");
  }
  const top = rankStreaks(rows, names);
  const mineRow = me ? rows.find((r) => r.userId === me) : undefined;
  const mine = mineRow ? { value: mineRow.best, rank: rows.filter((r) => r.best > mineRow.best || (r.best === mineRow.best && r.userId < mineRow.userId)).length + 1 } : { value: 0, rank: null };
  return { top, mine };
}

/** Test hook. */
export function resetStreakCache() {
  cache = null;
}
