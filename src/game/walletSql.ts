import type { Sql } from "../lib/db.ts";
import { settlePocket } from "./goals.ts";
import { canonicalId } from "./playerLinks.ts";
import { cleanKeys } from "./matchSpend.ts";
import { cleanUnlocks } from "./cityPass.ts";
import { DOUBLE_MS, WELCOME_KEY, doubles, welcomeClock } from "./lampGift.ts";
import { COIN_CAP, clampWallet, emptyWallet, type AwardView, type OpResult, type WalletState } from "./wallet.ts";

/**
 * One row per canonical player (player_links). A ledger key applies once.
 * The version column is a compare-and-swap so two awards can't drop each other.
 */

type DbRow = {
  coins: number | string;
  white: number;
  blue: number;
  green: number;
  amber: number;
  red: number;
  violet: number;
  cities: unknown;
  meta: unknown;
  migrated: boolean;
  version: number;
};

const json = (v: unknown) => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as unknown;
    } catch {
      return {};
    }
  }
  return v ?? {};
};

export function rowToState(r: DbRow): WalletState {
  return clampWallet({
    coins: Math.max(0, Math.floor(Number(r.coins) || 0)),
    keys: cleanKeys({
      white: Number(r.white) || 0,
      blue: Number(r.blue) || 0,
      green: Number(r.green) || 0,
      amber: Number(r.amber) || 0,
      red: Number(r.red) || 0,
      violet: Number(r.violet) || 0,
    }),
    cities: cleanUnlocks(json(r.cities)),
    meta: json(r.meta),
    migrated: r.migrated === true,
    version: Number(r.version) || 0,
  });
}

const SELECT = `select coins, white, blue, green, amber, red, violet, cities, meta, migrated, version from player_wallets where user_id = $1 limit 1`;

export async function canonicalWallet(sql: Sql, userId: string): Promise<{ id: string; wallet: WalletState }> {
  const id = await canonicalId(sql, userId);
  await sql`insert into player_wallets (user_id) values (${id}) on conflict (user_id) do nothing`;
  const rows = await sql.query<DbRow>(SELECT, [id]);
  return { id, wallet: rows[0] ? rowToState(rows[0]) : emptyWallet() };
}

export type MutateResult = {
  ok: boolean;
  replay: boolean;
  reason?: string;
  wallet: WalletState;
  award?: AwardView;
  detail?: string;
};

/**
 * Run `fn` once for `opKey`. A second call with the same key returns the stored
 * wallet and does not run `fn` again. `fn` returning ok:false releases the key
 * so a later attempt (once the pocket can pay) can succeed.
 */
export async function mutateWallet(
  sql: Sql,
  userId: string,
  opKey: string,
  fn: (w: WalletState) => OpResult,
): Promise<MutateResult> {
  const { id } = await canonicalWallet(sql, userId);
  const claimed = await sql<{ op_key: string }>`
    insert into wallet_ledger (user_id, op_key) values (${id}, ${opKey})
    on conflict (user_id, op_key) do nothing
    returning op_key
  `;
  if (!claimed.length) {
    const { wallet } = await canonicalWallet(sql, userId);
    const detail = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${opKey} limit 1`;
    let award: AwardView | undefined;
    try {
      const parsed = JSON.parse(detail[0]?.detail || "null") as { coins?: number; keys?: AwardView["keys"]; boosts?: string[] } | null;
      if (parsed && typeof parsed.coins === "number") award = { coins: parsed.coins, keys: parsed.keys ?? {}, boosts: parsed.boosts ?? [] };
    } catch {
      /* detail is a note, not an award */
    }
    return { ok: true, replay: true, wallet, award, detail: detail[0]?.detail };
  }
  // 0.1.44: a new player's first hour doubles the coin these writes gain (lampGift.ts DOUBLE_PREFIXES). Decided once,
  // before the write; a replay returns above and never doubles again. Matches, spends and caps are untouched.
  let x2 = false;
  if (doubles(opKey)) {
    const wel = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${WELCOME_KEY} limit 1`;
    try {
      const start = Number((JSON.parse(wel[0]?.detail ?? "{}") as { start?: number }).start) || 0;
      const now = welcomeClock.now();
      x2 = start > 0 && now >= start && now < start + DOUBLE_MS;
    } catch {
      x2 = false;
    }
  }
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { wallet } = await canonicalWallet(sql, userId);
      const res = fn(wallet);
      if (!res.ok) {
        await sql`delete from wallet_ledger where user_id = ${id} and op_key = ${opKey}`;
        return { ok: false, replay: false, reason: res.reason, wallet };
      }
      // 0.0.97: one pocket rule for every server write: rises past 30 become credits that merge 3→1 up.
      // A first sync (migrate*) only carries the save over; it is not a reward and must not mint credits.
      let next = res.wallet;
      let award = res.award;
      const gain = next.coins - wallet.coins;
      const extra = x2 && gain > 0 ? Math.max(0, Math.min(gain, COIN_CAP - next.coins)) : 0;
      if (extra) {
        next = { ...next, coins: next.coins + extra };
        if (award) award = { ...award, coins: award.coins + extra, boosts: [...award.boosts, "Double rewards ×2"] };
      }
      let merged: Partial<Record<string, number>> = {};
      if (!opKey.startsWith("migrate")) {
        const st = settlePocket(wallet.keys, next.keys, wallet.meta.credit);
        merged = st.merged;
        next = { ...next, coins: next.coins + st.coin, keys: st.keys, meta: { ...next.meta, credit: st.credit } };
      } else {
        next = { ...next, meta: { ...next.meta, credit: wallet.meta.credit } };
      }
      let detail = withDelta(res.detail ?? (award ? JSON.stringify(award) : ""), opKey, wallet, next, merged);
      if (extra) detail = markDouble(detail, extra);
      const updated = await sql.query<{ version: number }>(
        `update player_wallets set
           coins = $2, white = $3, blue = $4, green = $5, amber = $6, red = $7, violet = $8,
           cities = $9::jsonb, meta = $10::jsonb, migrated = $11, version = version + 1, updated_at = now()
         where user_id = $1 and version = $12
         returning version`,
        [
          id,
          next.coins,
          next.keys.white,
          next.keys.blue,
          next.keys.green,
          next.keys.amber,
          next.keys.red,
          next.keys.violet,
          JSON.stringify(next.cities),
          JSON.stringify(next.meta),
          next.migrated,
          wallet.version,
        ],
      );
      if (!updated.length) continue;
      if (detail) await sql`update wallet_ledger set detail = ${detail} where user_id = ${id} and op_key = ${opKey}`;
      return { ok: true, replay: false, wallet: { ...next, version: wallet.version + 1 }, award, detail };
    }
  } catch (e) {
    await sql`delete from wallet_ledger where user_id = ${id} and op_key = ${opKey}`;
    throw e;
  }
  await sql`delete from wallet_ledger where user_id = ${id} and op_key = ${opKey}`;
  const { wallet } = await canonicalWallet(sql, userId);
  return { ok: false, replay: false, reason: "busy", wallet };
}

/** Earlier Run/Stack grades for this walker, oldest first. Stops at a missing link. */
export async function priorGrades(sql: Sql, userId: string, prevNonce: string, limit: number): Promise<Array<"perfect" | "great" | "good">> {
  const { id } = await canonicalWallet(sql, userId);
  const out: Array<"perfect" | "great" | "good"> = [];
  let n: string | null = prevNonce;
  for (let i = 0; i < limit && n; i++) {
    const rows = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${"grade:" + n} limit 1`;
    if (!rows[0]?.detail) break;
    try {
      const d = JSON.parse(rows[0].detail) as { g?: string; pv?: string };
      if (d.g !== "perfect" && d.g !== "great" && d.g !== "good") break;
      out.unshift(d.g);
      n = typeof d.pv === "string" && d.pv ? d.pv : null;
    } catch {
      break;
    }
  }
  return out;
}

/**
 * 0.0.99 Recent rewards: the ledger row also carries what the write actually changed ("_d": coin, matches
 * and 3→1 merges), so the Journal can list the last rewards with no new table. Notes that aren't JSON stay as
 * they are (those rows show their source only).
 */
export function withDelta(detail: string, opKey: string, before: WalletState, after: WalletState, merged: Partial<Record<string, number>>): string {
  if (opKey.startsWith("migrate")) return detail;
  const k: Record<string, number> = {};
  for (const t of Object.keys(after.keys) as (keyof WalletState["keys"])[]) {
    const d = (after.keys[t] ?? 0) - (before.keys[t] ?? 0);
    if (d) k[t] = d;
  }
  const c = after.coins - before.coins;
  const cr: Record<string, number> = {};
  for (const [t, n] of Object.entries(after.meta.credit ?? {})) {
    const dn = (n ?? 0) - ((before.meta.credit as Record<string, number> | undefined)?.[t] ?? 0);
    if (dn > 0) cr[t] = dn;
  }
  if (!c && !Object.keys(k).length && !Object.keys(merged).length && !Object.keys(cr).length) return detail;
  const d = { c, k, ...(Object.keys(merged).length ? { mg: merged } : {}), ...(Object.keys(cr).length ? { cr } : {}) };
  if (!detail) return JSON.stringify({ _d: d });
  try {
    const o = JSON.parse(detail);
    if (o && typeof o === "object" && !Array.isArray(o)) return JSON.stringify({ ...o, _d: d });
  } catch {
    /* a plain note */
  }
  return detail;
}

/** 0.1.44: record the first-hour double on the row: x2 (the multiplier) and dx (the extra coin it added). */
function markDouble(detail: string, extra: number): string {
  try {
    const o = JSON.parse(detail || "{}");
    if (o && typeof o === "object" && !Array.isArray(o)) return JSON.stringify({ ...o, x2: 2, dx: extra });
  } catch {
    /* a note: wrap it */
  }
  return JSON.stringify({ note: detail, x2: 2, dx: extra });
}
