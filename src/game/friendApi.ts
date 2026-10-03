import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { standingName } from "./standingName";
import { TOKEN_RE } from "./friendTicket";
import {
  RATE,
  ackNews,
  answerTicket,
  createTicket,
  friendNews,
  openTicket,
  peekTicket,
  rateHit,
  type AnswerResult,
  type CreateResult,
  type FriendDeps,
  type FriendUser,
  type NewsItem,
  type OpenResult,
  type PeekResult,
} from "./friendService";

/**
 * Friend tickets (0.0.50) — server functions. Sending, opening, answering and news need a signed-in
 * session (authMiddleware; every query is scoped to the verified user id). The peek is public and says
 * only who sent a ticket and whether it's still live — never the card. Each endpoint is rate-limited.
 */
export type Slow = { status: "slow" };
const SLOW: Slow = { status: "slow" };

const Token = z.string().regex(TOKEN_RE);
const CardId = z.string().min(1).max(64).regex(/^[A-Za-z0-9_:.-]+$/);

async function deps(): Promise<FriendDeps> {
  const sql = await getSql();
  const { cardById } = await import("./friendCards");
  return { sql, now: () => Date.now(), findCard: cardById };
}

async function userOf(d: FriendDeps, id: string): Promise<FriendUser> {
  const rows = await d.sql<{ name: string | null }>`select name from "user" where id = ${id} limit 1`;
  return { id, name: standingName(rows[0]?.name) };
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
  .validator((u: unknown) => z.object({ cardId: CardId }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<CreateResult | Slow> => {
    const d = await deps();
    if (!(await rateHit(d.sql, `create:${context.userId}`, RATE.create, d.now()))) return SLOW;
    return createTicket(d, await userOf(d, context.userId), data.cardId);
  });

export const peekFriendTicket = createServerFn({ method: "GET" })
  .validator((u: unknown) => z.object({ token: z.string().max(64) }).parse(u))
  .handler(async ({ data }): Promise<PeekResult | Slow> => {
    const d = await deps();
    if (!(await rateHit(d.sql, `peek:${await clientIp()}`, RATE.peek, d.now()))) return SLOW;
    return peekTicket(d, data.token);
  });

export const openFriendTicket = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ token: Token }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<OpenResult | Slow> => {
    const d = await deps();
    if (!(await rateHit(d.sql, `play:${context.userId}`, RATE.play, d.now()))) return SLOW;
    return openTicket(d, await userOf(d, context.userId), data.token);
  });

export const answerFriendTicket = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ token: Token, choice: z.string().min(1).max(200) }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<AnswerResult | Slow> => {
    const d = await deps();
    if (!(await rateHit(d.sql, `play:${context.userId}`, RATE.play, d.now()))) return SLOW;
    return answerTicket(d, await userOf(d, context.userId), data.token, data.choice);
  });

export const fetchFriendNews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<NewsItem[]> => {
    const d = await deps();
    if (!(await rateHit(d.sql, `news:${context.userId}`, RATE.news, d.now()))) return [];
    return friendNews(d, context.userId);
  });

export const ackFriendNews = createServerFn({ method: "POST" })
  .validator((u: unknown) => z.object({ ids: z.array(z.string().max(40)).max(40) }).parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ acked: number }> => {
    const d = await deps();
    return { acked: await ackNews(d, context.userId, data.ids) };
  });
