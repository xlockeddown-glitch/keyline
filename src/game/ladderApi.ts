import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { canonicalId } from "./playerLinks";
import type { LadderBoard } from "./ladderBoard";
import type { TriviaCat } from "./types";

const CATS = ["sports", "local", "political", "food", "arts", "math", "science", "history", "nature", "games", "celebrity", "music", "books", "geography"] as const satisfies readonly TriviaCat[];
const Input = (u: unknown) => z.object({ cat: z.enum(CATS) }).parse(u);
const empty = (cat: TriviaCat): LadderBoard => ({ cat, top: [], mine: { value: 0, pct: null, rank: null, rung: null, rival: null } });

/** 0.1.69: a category's Ladders board (top 5), for anyone. */
export const fetchLadder = createServerFn({ method: "GET" })
  .validator(Input)
  .handler(async ({ data }): Promise<LadderBoard> => {
    try {
      const { ladderBoard } = await import("./ladderBoard");
      return await ladderBoard(await getSql(), data.cat);
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
      return await ladderBoard(sql, data.cat, await canonicalId(sql, context.userId));
    } catch {
      return empty(data.cat);
    }
  });
