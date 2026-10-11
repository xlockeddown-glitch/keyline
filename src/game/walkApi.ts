import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { dailyTopSpeed } from "./dailyRun";
import { canonicalId } from "./playerLinks";
import { loadMyDistance, recordWalk } from "./walkBoard";

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

const CitySchema = z.enum(CITY_IDS);

export type MyWalk = { meters: number; rank: number | null };

/** Foot metres since the last post. Guests are refused. The sprint cap is applied here, not on the client. */
export const postWalk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((u: unknown) =>
    z
      .object({
        city: CitySchema,
        meters: z.number().int().positive().max(100_000),
      })
      .parse(u),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const me = await canonicalId(sql, context.userId);
    return recordWalk(sql, me, data.city, data.meters, dailyTopSpeed());
  });

/** This walker's posted distance, all cities or one. Rank is among everyone, not just the top 25. */
export const fetchMyWalk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((u: unknown) =>
    z
      .object({
        city: CitySchema.nullable().optional(),
      })
      .parse(u ?? {}),
  )
  .handler(async ({ data, context }): Promise<MyWalk> => {
    const sql = await getSql();
    const me = await canonicalId(sql, context.userId);
    try {
      return await loadMyDistance(sql, me, data.city ?? null);
    } catch {
      return { meters: 0, rank: null };
    }
  });
