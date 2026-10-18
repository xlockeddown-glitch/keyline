import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { LevelView } from "./levelsServer";

/** 0.0.98 levels and titles: signed-in only, scoped to the verified session user. */
export const fetchLevel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LevelView> => {
    const { levelLook } = await import("./levelsServer");
    return levelLook(await getSql(), context.userId);
  });

export const pickLevelLook = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ title: z.string().max(40).optional(), color: z.string().max(16).optional() }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { setLevelLook } = await import("./levelsServer");
    return setLevelLook(await getSql(), context.userId, data);
  });

export const startLevelBoost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { useLevelBoost } = await import("./levelsServer");
    return useLevelBoost(await getSql(), context.userId);
  });

export const sendFriendGift = createServerFn({ method: "POST" })
  .validator((u: unknown) =>
    z.object({ to: z.string().min(4).max(80), item: z.enum(["match", "boost"]), nonce: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/) }).parse(u),
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { sendLevelGift } = await import("./levelsServer");
    return sendLevelGift(await getSql(), context.userId, data.to, data.item, data.nonce);
  });
