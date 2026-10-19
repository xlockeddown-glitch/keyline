import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { SCOUTS } from "./data";
import { WORN_SELECT, WORN_UPSERT, wornFromRow, type Worn } from "./wornScoutSql";

/**
 * 0.1.6: the scout a signed-in walker wears, on the account, so every device, the home-screen app and Safari
 * agree. Scoped to the session user. If the worn_scouts table isn't there yet (migration 0018 not applied on
 * the published DB), both calls answer null and the game keeps the worn scout in the local save as before.
 */
async function load(userId: string): Promise<Worn | null> {
  const sql = await getSql();
  const rows = await sql.query<{ scout: string; worn_at: number | string }>(WORN_SELECT, [userId]);
  return wornFromRow(rows[0]);
}

export const fetchWornScout = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Worn | null> => {
    try {
      return await load(context.userId);
    } catch {
      return null;
    }
  });

export const syncWornScout = createServerFn({ method: "POST" })
  .validator((u: unknown) =>
    z.object({ scout: z.string().min(1).max(40).refine((x) => x in SCOUTS), at: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER) }).parse(u),
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Worn | null> => {
    try {
      const sql = await getSql();
      await sql.query(WORN_UPSERT, [context.userId, data.scout, data.at]);
      return await load(context.userId);
    } catch {
      return null;
    }
  });
