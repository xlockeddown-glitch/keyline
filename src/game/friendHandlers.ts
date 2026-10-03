import { z } from "zod";
import { TOKEN_RE } from "./friendTicket.ts";
import { standingName } from "./standingName.ts";
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
} from "./friendService.ts";

/**
 * Friend tickets (0.0.50) — the API layer behind each server function in friendApi.ts: input validation,
 * the caller's identity (a verified user id from authMiddleware, or null for a guest), the rate limit, then
 * the service. Kept free of TanStack so friendApi.test.ts drives the very same code the endpoints run.
 */
export type Slow = { status: "slow" };
export const SLOW: Slow = { status: "slow" };

export const TokenIn = z.string().regex(TOKEN_RE);
export const CardIdIn = z.string().min(1).max(64).regex(/^[A-Za-z0-9_:.-]+$/);
export const SendIn = z.object({ cardId: CardIdIn });
export const PeekIn = z.object({ token: z.string().max(64) });
export const OpenIn = z.object({ token: TokenIn });
export const AnswerIn = z.object({ token: TokenIn, choice: z.string().min(1).max(200) });
export const AckIn = z.object({ ids: z.array(z.string().max(40)).max(40) });

/** First L. for the toast and the friend page, with the first name's first letter capitalised ("ben carter" → "Ben C."). */
export function friendName(name: string | null | undefined): string {
  const s = standingName(name);
  return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}

/** Display name for a user id, from the auth user table. */
export async function userOf(d: FriendDeps, id: string): Promise<FriendUser> {
  const rows = await d.sql<{ name: string | null }>`select name from "user" where id = ${id} limit 1`;
  return { id, name: friendName(rows[0]?.name) };
}

export async function apiSend(d: FriendDeps, userId: string | null, input: unknown): Promise<CreateResult | Slow> {
  const data = SendIn.parse(input);
  if (!userId) return { ok: false, reason: "guest", left: 0 };
  if (!(await rateHit(d.sql, `create:${userId}`, RATE.create, d.now()))) return SLOW;
  return createTicket(d, await userOf(d, userId), data.cardId);
}

export async function apiPeek(d: FriendDeps, ip: string, input: unknown): Promise<PeekResult | Slow> {
  const data = PeekIn.parse(input);
  if (!(await rateHit(d.sql, `peek:${ip}`, RATE.peek, d.now()))) return SLOW;
  return peekTicket(d, data.token);
}

export async function apiOpen(d: FriendDeps, userId: string, input: unknown): Promise<OpenResult | Slow> {
  const data = OpenIn.parse(input);
  if (!(await rateHit(d.sql, `play:${userId}`, RATE.play, d.now()))) return SLOW;
  return openTicket(d, await userOf(d, userId), data.token);
}

export async function apiAnswer(d: FriendDeps, userId: string, input: unknown): Promise<AnswerResult | Slow> {
  const data = AnswerIn.parse(input);
  if (!(await rateHit(d.sql, `play:${userId}`, RATE.play, d.now()))) return SLOW;
  return answerTicket(d, await userOf(d, userId), data.token, data.choice);
}

export async function apiNews(d: FriendDeps, userId: string): Promise<NewsItem[]> {
  if (!(await rateHit(d.sql, `news:${userId}`, RATE.news, d.now()))) return [];
  return friendNews(d, userId);
}

export async function apiAck(d: FriendDeps, userId: string, input: unknown): Promise<{ acked: number }> {
  const data = AckIn.parse(input);
  if (!(await rateHit(d.sql, `ack:${userId}`, RATE.ack, d.now()))) return { acked: 0 };
  return { acked: await ackNews(d, userId, data.ids) };
}
