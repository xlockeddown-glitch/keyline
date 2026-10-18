import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { CityId, Tier } from "./types";
import { standingName } from "./standingName";
import { canonicalId } from "./playerLinks";
import {
  emptyStandingBoard,
  publicStandingName,
  rankKind,
  rankLanterns,
  EMPTY_RIDE_BOARDS,
  RIDE_BOARD_TOP,
  type MyRideRanks,
  type RideBoards,
  type AttemptAgg,
  type StandingBoard,
  type StandingKind,
} from "./standings";
import { loadDistanceBoard, loadMyDistance } from "./walkBoard";

export const ROLL_TIERS = ["white", "blue", "green", "amber", "red", "violet"] as const;

const CITY_IDS = [
  "austin",
  "temple",
  "nyc",
  "sf",
  "london",
  "chicago",
  "detroit",
  "tucson",
  "toronto",
  "la",
  "boston",
  "nola",
  "seattle",
  "denver",
  "nashville",
] as const;

const KindSchema = z.enum(["cards", "speed", "accuracy", "distance"]);
const CitySchema = z.enum(CITY_IDS);

export type BoardRow = {
  userId: string;
  name: string;
  correct: number;
  rank: number;
};

export type Board = {
  byTier: Record<Tier, BoardRow[]>;
};

export type MyPlates = {
  byTier: Record<Tier, { correct: number; rank: number | null }>;
};

function emptyBoard(): Board {
  return {
    byTier: {
      white: [],
      blue: [],
      green: [],
      amber: [],
      red: [],
      violet: [],
    },
  };
}

function emptyMine(): MyPlates {
  return {
    byTier: {
      white: { correct: 0, rank: null },
      blue: { correct: 0, rank: null },
      green: { correct: 0, rank: null },
      amber: { correct: 0, rank: null },
      red: { correct: 0, rank: null },
      violet: { correct: 0, rank: null },
    },
  };
}

function publicName(name: string | null | undefined) {
  return standingName(name);
}

function boardFromClears(rows: { user_id: string; display_name: string; tier: Tier; correct: number; rank: number }[]): Board {
  const board = emptyBoard();
  for (const row of rows) {
    if (!ROLL_TIERS.includes(row.tier)) continue;
    board.byTier[row.tier].push({
      userId: row.user_id,
      name: publicName(row.display_name),
      correct: Number(row.correct) || 0,
      rank: Number(row.rank) || 0,
    });
  }
  return board;
}

/** Public ranked read — guests may view. Writes stay behind authMiddleware. */
export const fetchBoard = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      display_name: string;
      tier: Tier;
      correct: number;
      rank: number;
    }>`
    with ranked as (
      select
        user_id,
        display_name,
        tier,
        correct,
        row_number() over (
          partition by tier
          order by correct desc, updated_at asc, user_id asc
        ) as rank
      from vault_clears_by_player
      where correct > 0
    )
    select user_id, display_name, tier, correct, rank
    from ranked
    where rank <= 25
    order by tier, rank
  `;
    return boardFromClears(rows);
  } catch {
    return emptyBoard();
  }
});

export const fetchMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    // 0.0.54b: linked sign-ins share the primary's row (player_links).
    const me = await canonicalId(sql, context.userId);
    const rows = await sql<{
      tier: Tier;
      correct: number;
      rank: number;
    }>`
      select
        a.tier,
        a.correct,
        (
          select count(*)::int + 1
          from vault_clears_by_player b
          where b.tier = a.tier
            and (
              b.correct > a.correct
              or (b.correct = a.correct and b.updated_at < a.updated_at)
              or (b.correct = a.correct and b.updated_at = a.updated_at and b.user_id < a.user_id)
            )
        ) as rank
      from vault_clears_by_player a
      where a.user_id = ${me}
    `;
    const mine = emptyMine();
    for (const row of rows) {
      if (!ROLL_TIERS.includes(row.tier)) continue;
      mine.byTier[row.tier] = {
        correct: Number(row.correct) || 0,
        rank: Number(row.rank) || null,
      };
    }
    return mine;
  });

// 0.0.53: there is no client-callable "report a clear" any more — the server adds the +1 to vault_clears itself
// when it grades a right trivia answer (triviaService.grade), so the rolls can't be padded from the browser.

type EventAggRow = {
  user_id: string;
  display_name: string | null;
  tier: Tier;
  attempts: number;
  correct: number;
  latency_sum: number;
};

function aggsFromEvents(rows: EventAggRow[]): Record<Tier, AttemptAgg[]> {
  const byTier: Record<Tier, AttemptAgg[]> = {
    white: [],
    blue: [],
    green: [],
    amber: [],
    red: [],
    violet: [],
  };
  for (const row of rows) {
    if (!ROLL_TIERS.includes(row.tier)) continue;
    byTier[row.tier].push({
      userId: row.user_id,
      name: publicStandingName(row.display_name),
      attempts: Number(row.attempts) || 0,
      correct: Number(row.correct) || 0,
      latencySum: Number(row.latency_sum) || 0,
    });
  }
  return byTier;
}

async function loadEventAggs(city: CityId | null): Promise<Record<Tier, AttemptAgg[]>> {
  const sql = await getSql();
  const rows = city
    ? await sql<EventAggRow>`
        select
          e.user_id,
          max(u.name) as display_name,
          e.rarity as tier,
          count(*)::int as attempts,
          count(*) filter (where e.correct)::int as correct,
          coalesce(sum(e.latency_ms), 0)::bigint as latency_sum
        from plate_events_by_player e
        left join "user" u on u.id = e.user_id
        where e.city = ${city}
        group by e.user_id, e.rarity
      `
    : await sql<EventAggRow>`
        select
          e.user_id,
          max(u.name) as display_name,
          e.rarity as tier,
          count(*)::int as attempts,
          count(*) filter (where e.correct)::int as correct,
          coalesce(sum(e.latency_ms), 0)::bigint as latency_sum
        from plate_events_by_player e
        left join "user" u on u.id = e.user_id
        group by e.user_id, e.rarity
      `;
  return aggsFromEvents(rows);
}

function boardFromAggs(kind: StandingKind, scope: "all" | "city", city: CityId | null, byTier: Record<Tier, AttemptAgg[]>): StandingBoard {
  const board = emptyStandingBoard(kind, scope, city);
  for (const tier of ROLL_TIERS) {
    board.byTier[tier] = rankKind(kind, byTier[tier]);
  }
  return board;
}

/** 0.0.98: level, title and name colour on every board row. Never fails the board. */
async function tagBoard(board: StandingBoard): Promise<StandingBoard> {
  try {
    const rows = [...board.distance, ...Object.values(board.byTier).flat()];
    const ids = [...new Set(rows.map((r) => r.userId))];
    if (!ids.length) return board;
    const { levelTags } = await import("./levelsServer.ts");
    const tags = await levelTags(await getSql(), ids);
    for (const r of rows) {
      const t = tags.get(r.userId);
      if (t) {
        r.level = t.level;
        r.title = t.title;
        r.color = t.color;
      }
    }
  } catch {
    /* untagged */
  }
  return board;
}

/** Telemetry standings: cards / fastest / accuracy, all cities or one city. */
export const fetchStandings = createServerFn({ method: "GET" })
  .validator((u: unknown) =>
    z
      .object({
        kind: KindSchema.default("cards"),
        city: CitySchema.nullable().optional(),
      })
      .parse(u ?? {}),
  )
  .handler(async ({ data }): Promise<StandingBoard> => tagBoard(await (async (): Promise<StandingBoard> => {
    const kind = data.kind;
    const city = data.city ?? null;
    const scope = city ? "city" : "all";
    try {
      if (kind === "distance") {
        const sql = await getSql();
        const next = emptyStandingBoard("distance", scope, city);
        next.distance = await loadDistanceBoard(sql, city);
        return next;
      }
      if (kind === "cards" && !city) {
        const sql = await getSql();
        const rows = await sql<{
          user_id: string;
          display_name: string;
          tier: Tier;
          correct: number;
          rank: number;
        }>`
          with ranked as (
            select
              user_id,
              display_name,
              tier,
              correct,
              row_number() over (
                partition by tier
                order by correct desc, updated_at asc, user_id asc
              ) as rank
            from vault_clears_by_player
            where correct > 0
          )
          select user_id, display_name, tier, correct, rank
          from ranked
          where rank <= 25
          order by tier, rank
        `;
        const next = emptyStandingBoard("cards", "all", null);
        for (const row of rows) {
          if (!ROLL_TIERS.includes(row.tier)) continue;
          next.byTier[row.tier].push({
            userId: row.user_id,
            name: publicStandingName(row.display_name),
            rank: Number(row.rank) || 0,
            correct: Number(row.correct) || 0,
            attempts: Number(row.correct) || 0,
            avgMs: null,
            rate: null,
          });
        }
        return next;
      }
      const byTier = await loadEventAggs(city);
      return boardFromAggs(kind, scope, city, byTier);
    } catch {
      return emptyStandingBoard(kind, scope, city);
    }
  })()));

// ── 0.0.94: whole-game boards for the ride side panel ───────────────────

/** Top 5 by lanterns answered correctly (all colours) and top 5 by metres walked (server-credited, capped per post). */
export const fetchRideBoards = createServerFn({ method: "GET" }).handler(async (): Promise<RideBoards> => {
  try {
    const sql = await getSql();
    const rows = await sql<{ user_id: string; display_name: string | null; correct: number; updated_at: Date | string | null }>`
      select user_id, max(display_name) as display_name, sum(correct)::int as correct, max(updated_at) as updated_at
      from vault_clears_by_player
      where correct > 0
      group by user_id
      order by sum(correct) desc
      limit 25
    `;
    const lanterns = rankLanterns(
      rows.map((r) => ({ userId: r.user_id, name: r.display_name ?? "", correct: Number(r.correct) || 0, updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : 0 })),
    );
    const distance = (await loadDistanceBoard(sql, null, RIDE_BOARD_TOP)).map((r) => ({ userId: r.userId, name: r.name, rank: r.rank, value: r.meters ?? 0 }));
    return { lanterns, distance };
  } catch {
    return EMPTY_RIDE_BOARDS;
  }
});

/** The signed-in player's own totals and ranks on both ride boards. */
export const fetchMyRideRanks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MyRideRanks> => {
    const none: MyRideRanks = { lanterns: { value: 0, rank: null }, distance: { value: 0, rank: null } };
    try {
      const sql = await getSql();
      const me = await canonicalId(sql, context.userId);
      const rows = await sql<{ correct: number; rank: number }>`
        with t as (
          select user_id, sum(correct)::int as correct, max(updated_at) as updated_at
          from vault_clears_by_player
          group by user_id
        )
        select a.correct, (
          select count(*)::int + 1 from t b
          where b.correct > a.correct
             or (b.correct = a.correct and b.updated_at < a.updated_at)
             or (b.correct = a.correct and b.updated_at = a.updated_at and b.user_id < a.user_id)
        ) as rank
        from t a where a.user_id = ${me}
      `;
      const walk = await loadMyDistance(sql, me, null);
      const c = Number(rows[0]?.correct) || 0;
      return { lanterns: { value: c, rank: c > 0 ? Number(rows[0]?.rank) || null : null }, distance: { value: walk.meters, rank: walk.rank } };
    } catch {
      return none;
    }
  });
