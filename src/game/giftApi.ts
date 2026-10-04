import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { claimGift, listGifts } from "./giftService";
import type { Gift } from "./gifts";

/** 0.0.54 gifts — signed-in only; scoped to the verified session user (giftService.ts). */
export const fetchGifts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Gift[]> => listGifts({ sql: await getSql() }, context.userId));

export const claimGiftNote = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ id: z.string().min(1).max(64) }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => claimGift({ sql: await getSql() }, context.userId, data.id));
