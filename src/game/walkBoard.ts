import type { Sql } from "../lib/db.ts";
import { rankDistance, type DistanceAgg } from "./standings.ts";

/** A late post cannot dump the whole idle. Credit stops at this window. */
export const WALK_WINDOW_MS = 45_000;
/** First post of a walker: credit at most a few seconds, so the opening flush is not thrown away. */
export const WALK_OPEN_MS = 8_000;
/** Clock skew only. Not enough to matter on the board. */
export const WALK_SLACK = 1.02;
/** Posts closer than this do not move the clock. */
export const WALK_MIN_GAP_MS = 1_000;

export type WalkAgg = DistanceAgg;

export type WalkPost = {
  accepted: number;
  opened: boolean;
  /** Too soon. The clock did not move; the caller should try these metres again. */
  retry: boolean;
};

/**
 * Metres to keep from one post. `elapsedMs` is the server's own clock since the previous
 * accepted post, never the client's. Anything above the fastest coat's sprint, or past
 * WALK_WINDOW_MS, is cut.
 */
export function creditWalk(reportedM: number, elapsedMs: number, topMps: number, windowMs = WALK_WINDOW_MS): number {
  const asked = Math.floor(Number(reportedM));
  if (!Number.isFinite(asked) || asked <= 0) return 0;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  if (!Number.isFinite(topMps) || topMps <= 0) return 0;
  const windowed = Math.min(elapsedMs, windowMs);
  const cap = Math.floor((windowed / 1000) * topMps * WALK_SLACK);
  return Math.min(asked, Math.max(0, cap));
}

/** Opening post: there is no previous clock, so the window is a short fixed one. */
export function creditOpen(reportedM: number, topMps: number): number {
  return creditWalk(reportedM, WALK_OPEN_MS, topMps, WALK_OPEN_MS);
}

function stamp(v: unknown): number | null {
  if (v == null) return null;
  if (v instanceof Date) {
    const n = v.getTime();
    return Number.isFinite(n) ? n : null;
  }
  const n = Date.parse(String(v));
  return Number.isFinite(n) ? n : null;
}

function asMeters(v: unknown): number {
  const n = typeof v === "bigint" ? Number(v) : Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/**
 * Move this walker's clock and add whatever the sprint cap allows.
 * One statement: a second post inside WALK_MIN_GAP_MS changes nothing.
 */
export async function recordWalk(
  sql: Sql,
  userId: string,
  city: string,
  reportedM: number,
  topMps: number,
  now = Date.now(),
): Promise<WalkPost> {
  const asked = Math.floor(Number(reportedM));
  if (!userId || !city || !Number.isFinite(asked) || asked <= 0) return { accepted: 0, opened: false, retry: false };
  const at = new Date(now);
  const rows = await sql<{ prev_at: Date | string | null; posted_at: Date | string }>`
    insert into walk_clock (user_id, posted_at, prev_at)
    values (${userId}, ${at}, null)
    on conflict (user_id) do update set
      prev_at = walk_clock.posted_at,
      posted_at = ${at}
    where walk_clock.posted_at <= ${at}::timestamptz - interval '1 second'
    returning prev_at, posted_at
  `;
  const row = rows[0];
  if (!row) return { accepted: 0, opened: false, retry: true };
  const prevMs = stamp(row.prev_at);
  const opened = prevMs == null;
  const elapsed = opened ? 0 : now - prevMs;
  const accepted = opened ? creditOpen(asked, topMps) : creditWalk(asked, elapsed, topMps);
  if (accepted > 0) {
    await sql`
      insert into walk_distance (user_id, city, meters, updated_at)
      values (${userId}, ${city}, ${accepted}, ${at})
      on conflict (user_id, city) do update set
        meters = walk_distance.meters + ${accepted},
        updated_at = ${at}
    `;
  }
  return { accepted, opened, retry: false };
}

type DistanceSqlRow = {
  user_id: string;
  display_name: string | null;
  meters: number | bigint;
  updated_at: Date | string;
};

async function folded(sql: Sql, city: string | null): Promise<DistanceSqlRow[]> {
  return city
    ? await sql<DistanceSqlRow>`
        select f.user_id, u.name as display_name, f.meters, f.updated_at
        from (
          select user_id, sum(meters)::bigint as meters, max(updated_at) as updated_at
          from walk_distance_by_player
          where city = ${city}
          group by user_id
        ) f
        left join "user" u on u.id = f.user_id
        where f.meters > 0
      `
    : await sql<DistanceSqlRow>`
        select f.user_id, u.name as display_name, f.meters, f.updated_at
        from (
          select user_id, sum(meters)::bigint as meters, max(updated_at) as updated_at
          from walk_distance_by_player
          group by user_id
        ) f
        left join "user" u on u.id = f.user_id
        where f.meters > 0
      `;
}

export function aggsFromDistance(rows: DistanceSqlRow[]): WalkAgg[] {
  return rows.map((row) => ({
    userId: row.user_id,
    name: row.display_name ?? "",
    meters: asMeters(row.meters),
    updatedAt: stamp(row.updated_at) ?? 0,
  }));
}

/** Ranked distance rows for one city, or every city summed. Most metres first. */
export async function loadDistanceBoard(sql: Sql, city: string | null, limit = 25) {
  return rankDistance(aggsFromDistance(await folded(sql, city)), limit);
}

export async function loadMyDistance(
  sql: Sql,
  userId: string,
  city: string | null,
): Promise<{ meters: number; rank: number | null }> {
  const aggs = aggsFromDistance(await folded(sql, city));
  const mine = rankDistance(aggs, aggs.length || 1).find((r) => r.userId === userId);
  return { meters: mine?.meters ?? 0, rank: mine?.rank ?? null };
}
