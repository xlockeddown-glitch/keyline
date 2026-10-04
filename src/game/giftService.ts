import type { Sql } from "../lib/db.ts";
import { giftsFor, giftMatches, type Gift, type GiftRow } from "./gifts.ts";

/**
 * 0.0.54 gifts — server side, called from giftApi.ts with the verified session user. Every read and write is
 * scoped to that user: the list only names gifts that match them, and a claim only lands for a gift that does.
 */
export type GiftDeps = { sql: Sql };

async function userName(sql: Sql, userId: string): Promise<string | null> {
  const rows = await sql<{ name: string | null }>`select name from "user" where id = ${userId} limit 1`;
  return rows[0]?.name ?? null;
}

async function mine(sql: Sql, userId: string): Promise<Gift[]> {
  const name = await userName(sql, userId);
  const rows = await sql<GiftRow>`select id, scout, user_id, first_name, message from gifts order by created_at, id`;
  if (!rows.some((r) => giftMatches(r, { id: userId, name }))) return [];
  const claims = await sql<{ gift_id: string }>`select gift_id from gift_claims where user_id = ${userId}`;
  return giftsFor(rows, { id: userId, name }, claims.map((c) => c.gift_id));
}

export async function listGifts(d: GiftDeps, userId: string): Promise<Gift[]> {
  return mine(d.sql, userId);
}

/** Mark a gift's note seen for this user (idempotent). False when the gift isn't theirs. */
export async function claimGift(d: GiftDeps, userId: string, giftId: string): Promise<{ ok: boolean }> {
  const gifts = await mine(d.sql, userId);
  if (!gifts.some((g) => g.id === giftId)) return { ok: false };
  await d.sql`insert into gift_claims (user_id, gift_id) values (${userId}, ${giftId}) on conflict do nothing`;
  return { ok: true };
}
