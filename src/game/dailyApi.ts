import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { CityId } from "./types";
import { CITIES } from "./data";
import { standingName } from "./standingName";
import {
  DAILY_STRIKES,
  dailyRoute,
  lightDecision,
  rankDaily,
  runFloorMs,
  startDecision,
  utcDay,
  type DailyStanding,
  type RunRow,
} from "./dailyRun";

const CITY_IDS = ["austin", "temple", "nyc", "sf", "london", "chicago", "detroit", "tucson", "toronto", "la", "boston", "nola"] as const;
const CitySchema = z.enum(CITY_IDS);
const AtSchema = { lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180) };

type DbRow = {
  day: string;
  user_id: string;
  city: CityId;
  display_name: string;
  started_at: string | Date;
  last_at: string | Date;
  last_lat: number;
  last_lng: number;
  lit: number;
  splits: unknown;
  client_splits: unknown;
  time_ms: number | null;
  strikes: number;
  voided: boolean;
};

const ms = (v: string | Date) => (v instanceof Date ? v.getTime() : Date.parse(v));
const nums = (v: unknown): number[] => {
  const arr = typeof v === "string" ? (JSON.parse(v) as unknown) : v;
  return Array.isArray(arr) ? arr.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [];
};

function toRun(r: DbRow): RunRow {
  return {
    city: r.city,
    day: r.day,
    lit: Number(r.lit) || 1,
    startedAt: ms(r.started_at),
    lastAt: ms(r.last_at),
    splits: nums(r.splits),
    clientSplits: nums(r.client_splits),
    timeMs: r.time_ms == null ? null : Number(r.time_ms),
    voided: Boolean(r.voided),
    strikes: Number(r.strikes) || 0,
    lastLat: Number(r.last_lat),
    lastLng: Number(r.last_lng),
  };
}

export type DailyState = {
  status: "open" | "done" | "void" | "taken" | "far" | "none";
  day: string;
  city: CityId | null;
  lit: number;
  startedAt: number | null;
  timeMs: number | null;
  rank: number | null;
  reason?: string;
  serverNow: number;
};

async function rowFor(userId: string, day: string): Promise<DbRow | null> {
  const sql = await getSql();
  const rows = await sql<DbRow>`select * from daily_runs where day = ${day} and user_id = ${userId} limit 1`;
  return rows[0] ?? null;
}

/** Rank of a finished time on its day's city board (1-based). */
async function rankOf(day: string, city: CityId, userId: string): Promise<number | null> {
  const board = await loadBoard(day, city, 500);
  return board.find((r) => r.userId === userId)?.rank ?? null;
}

async function loadBoard(day: string, city: CityId, limit = 25): Promise<DailyStanding[]> {
  const sql = await getSql();
  const rows = await sql<{ user_id: string; display_name: string; time_ms: number; finished_at: string | Date }>`
    select user_id, display_name, time_ms, finished_at
    from daily_runs
    where day = ${day} and city = ${city} and time_ms is not null and not voided
    order by time_ms asc, finished_at asc, user_id asc
    limit ${limit}
  `;
  return rankDaily(
    rows.map((r) => ({ userId: r.user_id, name: standingName(r.display_name), timeMs: Number(r.time_ms), finishedAt: ms(r.finished_at) })),
    runFloorMs(dailyRoute(city, day)),
    limit,
  );
}

function stateOf(row: RunRow | null, day: string, status: DailyState["status"], rank: number | null = null, reason?: string): DailyState {
  return {
    status,
    day,
    city: row?.city ?? null,
    lit: row?.lit ?? 0,
    startedAt: row?.startedAt ?? null,
    timeMs: row?.timeMs ?? null,
    rank,
    reason,
    serverNow: Date.now(),
  };
}

/** Today's city board — public, guests may read. Names are First + Last initial. */
export const fetchDailyBoard = createServerFn({ method: "GET" })
  .validator((u: unknown) => z.object({ city: CitySchema }).parse(u))
  .handler(async ({ data }): Promise<{ day: string; city: CityId; rows: DailyStanding[] }> => {
    const day = utcDay();
    try {
      return { day, city: data.city, rows: await loadBoard(day, data.city) };
    } catch {
      return { day, city: data.city, rows: [] };
    }
  });

/** The signed-in walker's run today, if any. */
export const fetchDailyMine = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DailyState> => {
    const day = utcDay();
    const r = await rowFor(context.userId, day);
    if (!r) return stateOf(null, day, "none");
    const row = toRun(r);
    if (row.voided) return stateOf(row, day, "void");
    if (row.timeMs != null) return stateOf(row, day, "done", await rankOf(day, row.city, context.userId));
    return stateOf(row, day, "open");
  });

/** Lamp 1: starts (or resumes) today's one run on the server clock. */
export const startDailyRun = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ city: CitySchema, ...AtSchema }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<DailyState> => {
    const day = utcDay();
    const route = dailyRoute(data.city, day);
    const sql = await getSql();
    const had = await rowFor(context.userId, day);
    const now = Date.now();
    const d = startDecision(route, had ? toRun(had) : null, data, now);
    if (d.kind === "far") return stateOf(null, day, "far", null, "Stand at lamp 1 to start the clock.");
    if (d.kind === "void") return stateOf(had ? toRun(had) : null, day, "void", null, "Today's run was voided.");
    if (d.kind === "taken") return stateOf(had ? toRun(had) : null, day, "taken", null, `Today's run is already under way in ${CITIES[d.city]?.name ?? d.city}.`);
    if (d.kind === "done") return stateOf(d.row, day, "done", await rankOf(day, d.row.city, context.userId));
    if (d.kind === "resume") return stateOf(d.row, day, "open");
    const people = await sql<{ name: string | null }>`select name from "user" where id = ${context.userId} limit 1`;
    const name = standingName(people[0]?.name);
    const at = new Date(now).toISOString();
    await sql`
      insert into daily_runs (day, user_id, city, display_name, started_at, last_at, last_lat, last_lng, lit)
      values (${day}, ${context.userId}, ${data.city}, ${name}, ${at}, ${at}, ${data.lat}, ${data.lng}, 1)
      on conflict (day, user_id) do nothing
    `;
    const fresh = await rowFor(context.userId, day);
    if (!fresh) throw new Error("daily run did not save");
    const row = toRun(fresh);
    return stateOf(row, day, row.city === data.city ? "open" : "taken");
  });

/** Lamps 2..5. The server times each leg itself and refuses legs no walker could make. */
export const lightDailyLamp = createServerFn({ method: "POST" })
  .validator((u: unknown) =>
    z.object({ index: z.number().int().min(1).max(4), clientMs: z.number().finite().min(0), ...AtSchema }).parse(u),
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<DailyState> => {
    const sql = await getSql();
    const open = await sql<DbRow>`
      select * from daily_runs
      where user_id = ${context.userId} and time_ms is null and not voided
      order by started_at desc
      limit 1
    `;
    const day = utcDay();
    if (!open[0]) {
      const today = await rowFor(context.userId, day);
      if (today && toRun(today).timeMs != null) return stateOf(toRun(today), day, "done", await rankOf(day, toRun(today).city, context.userId));
      return stateOf(null, day, "none", null, "Light lamp 1 first.");
    }
    const row = toRun(open[0]);
    const route = dailyRoute(row.city, row.day);
    const now = Date.now();
    const d = lightDecision(route, row, data.index, data, data.clientMs, now);
    if (d.kind === "already") return stateOf(row, row.day, "open");
    if (d.kind === "expire") {
      await sql`update daily_runs set voided = true where day = ${row.day} and user_id = ${context.userId}`;
      return stateOf(row, row.day, "void", null, "Two hours passed. Today's run expired.");
    }
    if (d.kind === "reject") {
      if (d.strike) {
        const strikes = row.strikes + 1;
        const voided = strikes >= DAILY_STRIKES;
        await sql`update daily_runs set strikes = ${strikes}, voided = ${voided} where day = ${row.day} and user_id = ${context.userId}`;
        if (voided) return stateOf(row, row.day, "void", null, "Too many impossible legs. Today's run was voided.");
      }
      const why = d.reason === "too-fast" ? "Faster than any walker. That lamp didn't count." : d.reason === "far" ? "Not at the lamp yet." : "Lamps light in order.";
      return stateOf(row, row.day, "open", null, why);
    }
    const next = d.row;
    const finishedAt = d.finished ? new Date(now).toISOString() : null;
    const updated = await sql<{ lit: number }>`
      update daily_runs set
        lit = ${next.lit},
        last_at = ${new Date(now).toISOString()},
        last_lat = ${next.lastLat},
        last_lng = ${next.lastLng},
        splits = ${JSON.stringify(next.splits)}::jsonb,
        client_splits = ${JSON.stringify(next.clientSplits)}::jsonb,
        finished_at = ${finishedAt},
        time_ms = ${next.timeMs}
      where day = ${row.day} and user_id = ${context.userId} and lit = ${row.lit} and time_ms is null and not voided
      returning lit
    `;
    if (!updated.length) return stateOf(row, row.day, "open");
    if (d.finished) return stateOf(next, row.day, "done", await rankOf(row.day, row.city, context.userId));
    return stateOf(next, row.day, "open");
  });
