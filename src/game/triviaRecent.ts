import type { Sql } from "../lib/db.ts";

/**
 * 0.0.58 — SERVER-ONLY: a signed-in walker's recently dealt cards (migration 0013, `trivia_recent`). The deal
 * merges these with the save's own seen list, so a card can't come back just because the walker switched phone,
 * tab or sign-in. Rows are per (walker, card) with the latest deal time; the oldest past RECENT_KEEP are dropped.
 */
export const RECENT_KEEP = 600;

/** The walker behind a sign-in: linked sign-ins (player_links) share the primary's memory. */
async function walker(sql: Sql, userId: string): Promise<string> {
  const rows = await sql<{ primary_id: string }>`select primary_id from player_links where alias_id = ${userId} limit 1`;
  return rows[0]?.primary_id ?? userId;
}

/** Raw card ids this walker was dealt, oldest first (the picker's history order). */
export async function loadRecent(sql: Sql, userId: string, keep = RECENT_KEEP): Promise<string[]> {
  const who = await walker(sql, userId);
  const rows = await sql<{ card_id: string }>`
    select card_id from trivia_recent where user_id = ${who} order by dealt_at desc limit ${keep}
  `;
  return rows.map((r) => r.card_id).reverse();
}

/** Note a dealt card (newest), and trim the walker's list to the newest `keep`. */
export async function noteDealt(sql: Sql, userId: string, cardId: string, at: Date, keep = RECENT_KEEP): Promise<void> {
  const who = await walker(sql, userId);
  await sql`
    insert into trivia_recent (user_id, card_id, dealt_at) values (${who}, ${cardId}, ${at.toISOString()}::timestamptz)
    on conflict (user_id, card_id) do update set dealt_at = excluded.dealt_at
  `;
  await sql`
    delete from trivia_recent
    where user_id = ${who}
      and card_id in (select card_id from trivia_recent where user_id = ${who} order by dealt_at desc offset ${keep})
  `;
}
