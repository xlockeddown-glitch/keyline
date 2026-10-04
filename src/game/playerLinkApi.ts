import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { rateHit } from "./friendService";
import { groupIds, makeLinkCode, redeemLinkCode, type RedeemResult } from "./playerLinks";

/**
 * 0.0.54b player links — signed-in only, scoped to the verified session user (playerLinks.ts). Rate-limited
 * (rate_hits from 0009) so codes can't be guessed: 6 codes made and 10 tries a minute per user.
 */
const RATE = { make: { limit: 6, windowMs: 60_000 }, redeem: { limit: 10, windowMs: 60_000 } } as const;
type Slow = { status: "slow" };

export type LinkStatus = { playerId: string; signIns: number };

export const fetchLinkStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LinkStatus> => {
    const ids = await groupIds(await getSql(), context.userId);
    return { playerId: ids[0]!, signIns: ids.length };
  });

export const makePlayerLinkCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ code: string; expiresAt: number } | Slow> => {
    const sql = await getSql();
    if (!(await rateHit(sql, `link-make:${context.userId}`, RATE.make, Date.now()))) return { status: "slow" };
    return makeLinkCode({ sql, now: () => Date.now() }, context.userId);
  });

export const redeemPlayerLinkCode = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ code: z.string().min(1).max(32) }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<RedeemResult | Slow> => {
    const sql = await getSql();
    if (!(await rateHit(sql, `link-redeem:${context.userId}`, RATE.redeem, Date.now()))) return { status: "slow" };
    return redeemLinkCode({ sql, now: () => Date.now() }, context.userId, data.code);
  });
