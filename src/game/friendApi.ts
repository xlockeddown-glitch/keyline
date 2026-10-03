import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { AckIn, AnswerIn, OpenIn, PeekIn, SendIn, apiAck, apiAnswer, apiNews, apiOpen, apiPeek, apiSend, type Slow } from "./friendHandlers";
import type { AnswerResult, CreateResult, FriendDeps, NewsItem, OpenResult, PeekResult } from "./friendService";

/**
 * Friend tickets (0.0.50) — server functions. Sending, opening, answering and news need a signed-in
 * session (authMiddleware; every query is scoped to the verified user id). The peek is public and says
 * only who sent a ticket and whether it's still live — never the card. Each endpoint is rate-limited.
 * The bodies live in friendHandlers.ts (tested in friendApi.test.ts).
 */
export type { Slow };

async function deps(): Promise<FriendDeps> {
  const sql = await getSql();
  const { cardById } = await import("./friendCards");
  return { sql, now: () => Date.now(), findCard: cardById };
}

async function clientIp(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const h = getRequest()?.headers;
    const ip = h?.get("x-forwarded-for")?.split(",")[0]?.trim() || h?.get("x-real-ip")?.trim();
    return (ip || "local").slice(0, 64);
  } catch {
    return "local";
  }
}

export const sendFriendTicket = createServerFn({ method: "POST" })
  .validator((u: unknown) => SendIn.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<CreateResult | Slow> => apiSend(await deps(), context.userId, data));

export const peekFriendTicket = createServerFn({ method: "GET" })
  .validator((u: unknown) => PeekIn.parse(u))
  .handler(async ({ data }): Promise<PeekResult | Slow> => apiPeek(await deps(), await clientIp(), data));

export const openFriendTicket = createServerFn({ method: "POST" })
  .validator((u: unknown) => OpenIn.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<OpenResult | Slow> => apiOpen(await deps(), context.userId, data));

export const answerFriendTicket = createServerFn({ method: "POST" })
  .validator((u: unknown) => AnswerIn.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<AnswerResult | Slow> => apiAnswer(await deps(), context.userId, data));

export const fetchFriendNews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<NewsItem[]> => apiNews(await deps(), context.userId));

export const ackFriendNews = createServerFn({ method: "POST" })
  .validator((u: unknown) => AckIn.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ acked: number }> => apiAck(await deps(), context.userId, data));
