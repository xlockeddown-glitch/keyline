import type { Sql } from "../lib/db.ts";

/**
 * Player links (0.0.54b) — one walker, several sign-ins. See migrations/0011_player_links.sql.
 *
 * Better Auth makes a new user whenever a sign-in carries a different email (X vs Google, a second Google
 * account, a Grok viewer identity without an email). Those can't be merged on the server's say-so. Instead the
 * walker proves both: they make a one-time code while signed in on one sign-in, and enter it while signed in on
 * the other. The two are then linked, the oldest user id stays primary, and the standings show one row.
 */
export const CODE_TTL_MS = 10 * 60_000;
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
export const CODE_LEN = 8;

export type LinkDeps = { sql: Sql; now: () => number; random?: () => number };

export function newCode(random: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return s;
}

/** Normalise what the walker typed: upper-case, drop spaces and dashes. Null when it can't be a code. */
export function cleanCode(raw: string): string | null {
  const c = raw.toUpperCase().replace(/[\s-]/g, "");
  if (c.length !== CODE_LEN) return null;
  for (const ch of c) if (!CODE_ALPHABET.includes(ch)) return null;
  return c;
}

/** The primary user id for `userId` (itself when unlinked). */
export async function canonicalId(sql: Sql, userId: string): Promise<string> {
  const rows = await sql<{ primary_id: string }>`select primary_id from player_links where alias_id = ${userId} limit 1`;
  return rows[0]?.primary_id ?? userId;
}

/** Every user id in this walker's group (primary first), for "is this me?" checks. */
export async function groupIds(sql: Sql, userId: string): Promise<string[]> {
  const primary = await canonicalId(sql, userId);
  const rows = await sql<{ alias_id: string }>`select alias_id from player_links where primary_id = ${primary} order by alias_id`;
  return [primary, ...rows.map((r) => r.alias_id)];
}

export async function makeLinkCode(d: LinkDeps, userId: string): Promise<{ code: string; expiresAt: number }> {
  const now = d.now();
  const expiresAt = now + CODE_TTL_MS;
  // One live code per user: a new one replaces any unused older one.
  await d.sql`delete from link_codes where user_id = ${userId} and used_by is null`;
  for (let i = 0; i < 5; i++) {
    const code = newCode(d.random);
    const rows = await d.sql<{ code: string }>`
      insert into link_codes (code, user_id, created_at, expires_at)
      values (${code}, ${userId}, ${new Date(now).toISOString()}::timestamptz, ${new Date(expiresAt).toISOString()}::timestamptz)
      on conflict (code) do nothing
      returning code
    `;
    if (rows.length) return { code, expiresAt };
  }
  throw new Error("could not mint a link code");
}

export type RedeemResult =
  | { ok: true; primaryId: string; linked: string[] }
  | { ok: false; reason: "bad-code" | "expired" | "used" | "same" };

async function createdAt(sql: Sql, userId: string): Promise<number> {
  const rows = await sql<{ createdAt: string | Date }>`select "createdAt" from "user" where id = ${userId} limit 1`;
  const v = rows[0]?.createdAt;
  return v ? new Date(v).getTime() : Number.MAX_SAFE_INTEGER;
}

/**
 * Redeem a code made by another sign-in. Both groups merge under the older primary; every alias of the newer
 * group is re-pointed so links stay one level deep.
 */
export async function redeemLinkCode(d: LinkDeps, userId: string, raw: string): Promise<RedeemResult> {
  const code = cleanCode(raw);
  if (!code) return { ok: false, reason: "bad-code" };
  const rows = await d.sql<{ user_id: string; expires_at: string | Date; used_by: string | null }>`
    select user_id, expires_at, used_by from link_codes where code = ${code} limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, reason: "bad-code" };
  if (row.used_by) return { ok: false, reason: "used" };
  if (new Date(row.expires_at).getTime() < d.now()) return { ok: false, reason: "expired" };
  const a = await canonicalId(d.sql, row.user_id);
  const b = await canonicalId(d.sql, userId);
  if (a === b) return { ok: false, reason: "same" };
  // Claim the code first (once), so two redemptions at once can't both link.
  const claimed = await d.sql<{ code: string }>`
    update link_codes set used_by = ${userId}, used_at = ${new Date(d.now()).toISOString()}::timestamptz
    where code = ${code} and used_by is null
    returning code
  `;
  if (!claimed.length) return { ok: false, reason: "used" };
  const [ta, tb] = [await createdAt(d.sql, a), await createdAt(d.sql, b)];
  const primary = ta < tb || (ta === tb && a < b) ? a : b;
  const other = primary === a ? b : a;
  await d.sql`update player_links set primary_id = ${primary} where primary_id = ${other}`;
  await d.sql`
    insert into player_links (alias_id, primary_id, how) values (${other}, ${primary}, 'code')
    on conflict (alias_id) do update set primary_id = excluded.primary_id, how = 'code', linked_at = now()
  `;
  return { ok: true, primaryId: primary, linked: await groupIds(d.sql, primary) };
}
