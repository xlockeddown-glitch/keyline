import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { meetCollectInput, meetLeaveInput, type MeetStatus } from "./meetDrop";
import type { MeetResult } from "./meetService";

/**
 * 0.1.186 Meet you there: signed-in only, scoped to the verified session user. The device sends a lamp, its spot, a
 * friend, a kind and a nonce (leave) or a drop id and its spot (collect); the amount, state, expiry, day, slot and
 * sender are the server's (meetService.ts). The clock is the server's own.
 */
export const meetStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MeetStatus> => {
    const { meetStatus: status } = await import("./meetService");
    return status(await getSql(), context.userId, Date.now());
  });

export const meetLeave = createServerFn({ method: "POST" })
  .validator((u: unknown) => meetLeaveInput.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<MeetResult> => {
    const { meetLeave: leave } = await import("./meetService");
    return leave(await getSql(), context.userId, data, Date.now());
  });

export const meetCollect = createServerFn({ method: "POST" })
  .validator((u: unknown) => meetCollectInput.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<MeetResult> => {
    const { meetCollect: collect } = await import("./meetService");
    return collect(await getSql(), context.userId, data, Date.now());
  });
