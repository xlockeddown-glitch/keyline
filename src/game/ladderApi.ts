import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { canonicalId } from "./playerLinks";
import { isLadderCity, type LadderBoard } from "./ladderBoard";
import type { CityId, TriviaCat } from "./types";

const CATS = ["sports", "local", "political", "food", "arts", "math", "science", "history", "nature", "games", "celebrity", "music", "books", "geography"] as const satisfies readonly TriviaCat[];
/** 0.1.156: span / scope / city are optional; an older client gets the all-time, everyone board. */
const Input = (u: unknown) =>
  z
    .object({
      cat: z.enum(CATS),
      span: z.enum(["all", "week"]).default("all"),
      scope: z.enum(["all", "city", "friends"]).default("all"),
      city: z.custom<CityId>((c) => isLadderCity(c)).optional(),
    })
    .refine((d) => d.scope !== "city" || d.city)
    .parse(u);
const empty = (cat: TriviaCat): LadderBoard => ({ cat, top: [], mine: { value: 0, pct: null, rank: null, rung: null, rival: null } });

/** 0.1.69: a category's Ladders board (top 5), for anyone. 0.1.156: a guest's friends board is empty. */
export const fetchLadder = createServerFn({ method: "GET" })
  .validator(Input)
  .handler(async ({ data }): Promise<LadderBoard> => {
    try {
      const { ladderBoard } = await import("./ladderBoard");
      const { cat, span, scope, city } = data;
      return await ladderBoard(await getSql(), cat, null, { span, scope, city, friendIds: [] });
    } catch {
      return empty(data.cat);
    }
  });

/** 0.1.69: the same board with the signed-in player's rank, rung and rival line. */
export const fetchMyLadder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(Input)
  .handler(async ({ data, context }): Promise<LadderBoard> => {
    try {
      const sql = await getSql();
      const { ladderBoard } = await import("./ladderBoard");
      const me = await canonicalId(sql, context.userId);
      const { cat, span, scope, city } = data;
      const friendIds = scope === "friends" ? await (await import("./friendService")).friendIdsOf(sql, me) : [];
      return await ladderBoard(sql, cat, me, { span, scope, city, friendIds });
    } catch {
      return empty(data.cat);
    }
  });
