/**
 * 0.1.107 Vault Keys lock-out (Ryan): a wrong answer at a keyed street vault locks that vault electronically for
 * 3 minutes (tiers I-III) or 5 minutes (IV-VI). The key is used up as before (it left the pocket on the deal);
 * nothing is ejected. Signed in, the server writes the lock as a wallet_ledger row (`lockout:<poiId>`, detail =
 * unlock time in ms) and refuses a new deal there until it runs out, so a reload or a cleared save can't skip it.
 * No migration: the row lives in the existing ledger. Ladders and Blitz keep their own rules.
 */
import type { Sql } from "../lib/db.ts";
import type { Tier } from "./types.ts";

export const LOCKOUT_SHORT_MS = 3 * 60_000;
export const LOCKOUT_LONG_MS = 5 * 60_000;

export function lockoutMs(tier: Tier): number {
  return tier === "white" || tier === "blue" || tier === "green" ? LOCKOUT_SHORT_MS : LOCKOUT_LONG_MS;
}

export const lockoutKey = (poiId: string) => `lockout:${poiId}`;

/** Milliseconds still locked, from a ledger detail (unlock time in ms). Bad or past values are 0. */
export function lockoutLeft(detail: string | null | undefined, now: number): number {
  const until = Number(detail);
  if (!Number.isFinite(until)) return 0;
  return Math.max(0, Math.min(LOCKOUT_LONG_MS, until - now));
}

/** True for a deal or grade that the lock-out covers: a street or placed vault, not a ladder or Blitz card. */
export function lockable(poiId: string, series: boolean): boolean {
  return !series && poiId.length > 0 && !poiId.startsWith("blitz-") && !poiId.startsWith("__");
}

export async function noteLockout(sql: Sql, userId: string, poiId: string, until: number): Promise<void> {
  await sql`
    insert into wallet_ledger (user_id, op_key, detail, created_at)
    values (${userId}, ${lockoutKey(poiId)}, ${String(Math.round(until))}, now())
    on conflict (user_id, op_key) do update set detail = excluded.detail, created_at = now()
  `;
}

export async function lockoutLeftFor(sql: Sql, userId: string, poiId: string, now: number): Promise<number> {
  const rows = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${userId} and op_key = ${lockoutKey(poiId)}`;
  return lockoutLeft(rows[0]?.detail, now);
}

/** Countdown text for a lock-out, m:ss. */
export function lockClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
