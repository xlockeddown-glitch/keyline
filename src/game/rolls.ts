import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { CityId, Tier } from "./types";
import { standingName } from "./standingName";
import {
  emptyStandingBoard,
  publicStandingName,
  rankKind,
  type AttemptAgg,
  type StandingBoard,
  type StandingKind,
} from "./standings";

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
] as const;

const TierSchema = z.enum(ROLL_TIERS);
const KindSchema = z.enum(["cards", "speed", "accuracy"]);
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
      from vault_clears
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
          from vault_clears b
          where b.tier = a.tier
            and (
              b.correct > a.correct
              or (b.correct = a.correct and b.updated_at < a.updated_at)
              or (b.correct = a.correct and b.updated_at = a.updated_at and b.user_id < a.user_id)
            )
        ) as rank
      from vault_clears a
      where a.user_id = ${context.userId}
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

export const reportCorrect = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ tier: TierSchema }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const people = await sql<{ name: string | null }>`
      select name from "user" where id = ${context.userId} limit 1
    `;
    const name = publicName(people[0]?.name);
    const tier = data.tier;
    await sql`
      insert into vault_clears (user_id, display_name, tier, correct, updated_at)
      values (${context.userId}, ${name}, ${tier}, 1, now())
      on conflict (user_id, tier)
      do update set
        correct = vault_clears.correct + 1,
        display_name = excluded.display_name,
        updated_at = now()
    `;
    return { ok: true as const };
  });

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
        from plate_events e
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
        from plate_events e
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
  .handler(async ({ data }): Promise<StandingBoard> => {
    const kind = data.kind;
    const city = data.city ?? null;
    const scope = city ? "city" : "all";
    try {
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
            from vault_clears
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
  });
