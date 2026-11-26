/**
 * 0.1.186 Meet you there: the server. Every rule is decided here from the session user, the server clock, the baked
 * POIs, the friend graph and the meet_drops row. The device names a lamp, a spot, a friend, a kind and a nonce;
 * never an amount, a state, an expiry, a day, a slot or a sender.
 *
 * Money moves three ways only, each one ledger key that applies once (walletSql.mutateWallet):
 *   meet:<id>      the dropper's debit at leave time (the row's amount is now the escrow)
 *   meetget:<id>   the named friend's credit, after the atomic open -> collected gate
 *   meetback:<id>  the dropper's refund, after the atomic open/pending -> expired gate
 * A row is in exactly one of collected / expired, so an escrow is paid out at most once, to exactly one side.
 * A drop only opens once its debit is proven on the ledger (the row's own delta), so nothing is ever minted.
 */
import type { Sql } from "../lib/db.ts";
import { DAILY_REACH_M } from "./dailyRun.ts";
import { friendIdsOf } from "./friendService.ts";
import { distM } from "./geo.ts";
import {
  MEET_COIN,
  MEET_KEY_N,
  MEET_KEY_TIER,
  MEET_NONCE,
  MEET_PENDING_MS,
  MEET_TTL_MS,
  meetAmount,
  meetCap,
  meetCls,
  meetCollectKey,
  meetCollectLine,
  meetLamp,
  meetLeaveKey,
  meetLeaveLine,
  meetRefundKey,
  type MeetDropView,
  type MeetKind,
  type MeetReason,
  type MeetStatus,
} from "./meetDrop.ts";
import { canonicalId } from "./playerLinks.ts";
import { standingName } from "./standingName.ts";
import { cityDay } from "./vaultStack.ts";
import { applyDelta, viewOf } from "./wallet.ts";
import { canonicalWallet, mutateWallet } from "./walletSql.ts";
import type { CityId } from "./types";

type WalletView = ReturnType<typeof viewOf>;
export type MeetResult = { ok: boolean; reason?: MeetReason; replay?: boolean; drop?: MeetDropView; line?: string; view?: WalletView };
export type MeetLeaveOp = { city: string; lamp: string; lat: number; lng: number; friend: string; kind: MeetKind; nonce: string };
export type MeetCollectOp = { id: string; lat: number; lng: number };

type Row = { id: string; dropper_id: string; friend_id: string; city: string; poi_id: string; kind: MeetKind; amount: number; state: "pending" | "open" | "collected" | "expired"; settled: boolean; exp: number | string };
const COLS = `id, dropper_id, friend_id, city, poi_id, kind, amount, state, settled, (extract(epoch from expires_at) * 1000)::bigint as exp`;
const iso = (ms: number) => new Date(ms).toISOString();

/** Postgres undefined_table (42P01): migration 0021 has not run. */
function tableMissing(e: unknown): boolean {
  const x = e as { code?: unknown; message?: unknown } | null;
  return x?.code === "42P01" || (typeof x?.message === "string" && /relation "?meet_drops"? does not exist/i.test(x.message));
}

async function rowOf(sql: Sql, id: string): Promise<Row | null> {
  return (await sql.query<Row>(`select ${COLS} from meet_drops where id = $1 limit 1`, [id]))[0] ?? null;
}

async function namesOf(sql: Sql, ids: readonly string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!ids.length) return out;
  try {
    const rows = await sql.query<{ id: string; name: string | null }>(`select id, name from "user" where id = any($1::text[])`, [ids as string[]]);
    for (const r of rows) out.set(r.id, standingName(r.name));
  } catch {
    /* names are decoration: a drop still lists */
  }
  return out;
}

function viewOfRow(r: Row, name: string): MeetDropView {
  return { id: r.id, name, city: r.city, lamp: r.poi_id, lampName: meetLamp(r.city, r.poi_id)?.name ?? "a street lamp", kind: r.kind, amount: Number(r.amount) || 0, expiresAt: Number(r.exp) || 0 };
}

const escrowDelta = (kind: MeetKind, sign: 1 | -1) => (kind === "coin" ? { coins: sign * MEET_COIN } : { keys: { [MEET_KEY_TIER]: sign * MEET_KEY_N } });

/**
 * Did the dropper's debit really land? "yes": the ledger row meet:<id> carries the exact delta the wallet write
 * recorded (walletSql.withDelta). "no": no such row. "unknown": a row with no delta (a write still in flight, or
 * one that died half way) — never treated as paid.
 */
async function debitOf(sql: Sql, r: Row): Promise<"yes" | "no" | "unknown"> {
  const rows = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${r.dropper_id} and op_key = ${meetLeaveKey(r.id)} limit 1`;
  if (!rows.length) return "no";
  try {
    const d = (JSON.parse(rows[0]!.detail || "{}") as { _d?: { c?: unknown; k?: Record<string, unknown> } })._d;
    if (r.kind === "coin" && Number(d?.c) === -MEET_COIN) return "yes";
    if (r.kind === "key" && Number(d?.k?.[MEET_KEY_TIER]) === -MEET_KEY_N) return "yes";
  } catch {
    /* not a delta */
  }
  return "unknown";
}

/**
 * Finish a row the gate already moved to collected or expired. Collected: credit the escrow to the friend. Expired:
 * give it back to the dropper, only when the debit is proven. Each is one ledger key, so calling this again (a
 * retry, a second tab, a later sweep after a crash) never pays twice. True once the row is settled.
 */
async function settle(sql: Sql, r: Row): Promise<boolean> {
  if (r.state !== "collected" && r.state !== "expired") return false;
  if (r.kind !== "wave") {
    if (r.state === "collected") {
      const pay = await mutateWallet(sql, r.friend_id, meetCollectKey(r.id), (w) => ({ ...applyDelta(w, escrowDelta(r.kind, 1)), detail: JSON.stringify({ meet: "get", kind: r.kind }) }));
      if (!pay.ok) return false;
    } else {
      const debit = await debitOf(sql, r);
      if (debit === "unknown") return false;
      if (debit === "yes") {
        const back = await mutateWallet(sql, r.dropper_id, meetRefundKey(r.id), (w) => ({ ...applyDelta(w, escrowDelta(r.kind, 1)), detail: JSON.stringify({ meet: "back", kind: r.kind }) }));
        if (!back.ok) return false;
      }
    }
  }
  await sql`update meet_drops set settled = true where id = ${r.id} and state = ${r.state}`;
  return true;
}

/**
 * Lazy expiry, no cron: every open drop past its 24 hours and every unfinished leave past its 5 minutes that this
 * player left or was named on moves to expired (one atomic update), then each is settled. Also finishes any of
 * their collected-or-expired rows a crash left unsettled. An expired drop keeps its cap slot.
 */
async function sweep(sql: Sql, me: string, now: number): Promise<void> {
  await sql.query(
    `update meet_drops set state = 'expired', settled_at = $2::timestamptz
     where (dropper_id = $1 or friend_id = $1) and state in ('open', 'pending') and expires_at <= $2::timestamptz`,
    [me, iso(now)],
  );
  const todo = await sql.query<Row>(`select ${COLS} from meet_drops where (dropper_id = $1 or friend_id = $1) and settled = false and state in ('collected', 'expired')`, [me]);
  for (const r of todo) await settle(sql, r);
}

/** Take a pending leave to open: debit into escrow (once, by ledger key), prove it, then open for 24 hours. */
async function finishLeave(sql: Sql, userId: string, row: Row, now: number): Promise<MeetReason | null> {
  if (row.state === "open" || row.state === "collected") return null;
  if (row.state !== "pending") return "gone";
  // This id was already refunded once: it can never back a second drop.
  const back = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${row.dropper_id} and op_key = ${meetRefundKey(row.id)} limit 1`;
  if (back.length) return "spent";
  const debit = await mutateWallet(sql, userId, meetLeaveKey(row.id), (w) => ({ ...applyDelta(w, escrowDelta(row.kind, -1)), detail: JSON.stringify({ meet: "leave", kind: row.kind, to: row.friend_id, lamp: row.poi_id }) }));
  if (!debit.ok) {
    // Nothing was taken, so no slot is spent. Never remove a row another request has started paying for.
    await sql.query(
      `delete from meet_drops where id = $1 and state = 'pending'
       and not exists (select 1 from wallet_ledger where user_id = $2 and op_key = $3)`,
      [row.id, row.dropper_id, meetLeaveKey(row.id)],
    );
    return debit.reason === "short-coins" || debit.reason === "short-match" ? "short" : "again";
  }
  if ((await debitOf(sql, row)) !== "yes") return "again";
  const opened = await sql.query<{ id: string }>(
    `update meet_drops set state = 'open', expires_at = $2::timestamptz where id = $1 and state = 'pending' returning id`,
    [row.id, iso(now + MEET_TTL_MS)],
  );
  if (opened.length) return null;
  const cur = await rowOf(sql, row.id);
  if (cur && (cur.state === "open" || cur.state === "collected")) return null;
  // The row lapsed (or went away) while the debit landed: the coin or key goes straight back, once.
  await mutateWallet(sql, row.dropper_id, meetRefundKey(row.id), (w) => ({ ...applyDelta(w, escrowDelta(row.kind, 1)), detail: JSON.stringify({ meet: "back", kind: row.kind }) }));
  if (cur) await sql`update meet_drops set settled = true where id = ${row.id} and state = ${"expired"}`;
  return "again";
}

export async function meetLeave(sql: Sql, userId: string, op: MeetLeaveOp, now = Date.now()): Promise<MeetResult> {
  try {
    const { id: me, wallet } = await canonicalWallet(sql, userId);
    await sweep(sql, me, now);
    if (!wallet.migrated) return { ok: false, reason: "sync" };
    const nonce = String(op.nonce);
    if (!MEET_NONCE.test(nonce)) return { ok: false, reason: "again" };
    const kind = op.kind;
    if (kind !== "wave" && kind !== "key" && kind !== "coin") return { ok: false, reason: "again" };
    const city = String(op.city);
    const lamp = meetLamp(city, String(op.lamp));
    const friend = await canonicalId(sql, String(op.friend));

    let row = await rowOf(sql, nonce);
    let replay = Boolean(row);
    if (row) {
      // A nonce is one drop: never someone else's, never re-aimed at another lamp, friend or kind.
      if (row.dropper_id !== me || row.city !== city || row.poi_id !== lamp?.id || row.friend_id !== friend || row.kind !== kind) return { ok: false, reason: "spent" };
    } else {
      if (!lamp) return { ok: false, reason: "lamp" };
      const lat = Number(op.lat);
      const lng = Number(op.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || distM(lat, lng, lamp.lat, lamp.lng) > DAILY_REACH_M) return { ok: false, reason: "far" };
      if (friend === me || !(await friendIdsOf(sql, userId)).includes(friend)) return { ok: false, reason: "friend" };
      const here = () => sql<{ id: string }>`select id from meet_drops where dropper_id = ${me} and poi_id = ${lamp.id} and state in ('pending', 'open') limit 1`;
      if ((await here()).length) return { ok: false, reason: "open" };
      const cls = meetCls(kind);
      const cap = meetCap(cls);
      const day = cityDay(city as CityId, now);
      const used = new Set((await sql<{ slot: number }>`select slot from meet_drops where dropper_id = ${me} and day = ${day} and cls = ${cls}`).map((r) => Number(r.slot)));
      if (used.size >= cap) return { ok: false, reason: "cap" };
      // An id that already moved coin or a key (a leave that was undone) can never open a fresh drop.
      const stale = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${me} and op_key in (${meetLeaveKey(nonce)}, ${meetRefundKey(nonce)}) limit 1`;
      if (stale.length) return { ok: false, reason: "spent" };
      const wave = kind === "wave";
      for (let slot = 1; slot <= cap && !row; slot++) {
        if (used.has(slot)) continue;
        // The unique (dropper, day, cls, slot) index is the cap: a racing leave that loses this slot tries the next.
        const ins = await sql.query<{ id: string }>(
          `insert into meet_drops (id, dropper_id, friend_id, city, poi_id, kind, amount, day, cls, slot, state, created_at, expires_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz, $13::timestamptz)
           on conflict do nothing returning id`,
          [nonce, me, friend, city, lamp.id, kind, meetAmount(kind), day, cls, slot, wave ? "open" : "pending", iso(now), iso(now + (wave ? MEET_TTL_MS : MEET_PENDING_MS))],
        );
        if (ins.length) row = await rowOf(sql, nonce);
        else {
          const same = await rowOf(sql, nonce);
          if (same) {
            if (same.dropper_id !== me || same.city !== city || same.poi_id !== lamp.id || same.friend_id !== friend || same.kind !== kind) return { ok: false, reason: "spent" };
            row = same;
            replay = true;
          } else if ((await here()).length) return { ok: false, reason: "open" };
        }
      }
      if (!row) return { ok: false, reason: "cap" };
    }
    const fail = await finishLeave(sql, userId, row, now);
    const fresh = (await canonicalWallet(sql, userId)).wallet;
    if (fail) return { ok: false, reason: fail, view: viewOf(fresh) };
    const cur = (await rowOf(sql, row.id)) ?? row;
    const toName = (await namesOf(sql, [cur.friend_id])).get(cur.friend_id) ?? "Walker";
    return { ok: true, replay, drop: viewOfRow(cur, toName), line: meetLeaveLine(cur.kind, toName), view: viewOf(fresh) };
  } catch (e) {
    if (tableMissing(e)) return { ok: false, reason: "unready" };
    throw e;
  }
}

export async function meetCollect(sql: Sql, userId: string, op: MeetCollectOp, now = Date.now()): Promise<MeetResult> {
  try {
    const { id: me, wallet } = await canonicalWallet(sql, userId);
    const id = String(op.id);
    let row = await rowOf(sql, id);
    if (!wallet.migrated) return { ok: false, reason: "sync" };
    // Only the named friend. The dropper (any of their sign-ins folds to the same id) and everyone else get nothing.
    if (!row || row.friend_id !== me || row.dropper_id === me) return { ok: false, reason: "gone" };
    const done = async (r: Row, replay: boolean): Promise<MeetResult> => {
      if (!(await settle(sql, r))) return { ok: false, reason: "again" };
      const fromName = (await namesOf(sql, [r.dropper_id])).get(r.dropper_id) ?? "Walker";
      return { ok: true, replay, drop: viewOfRow(r, fromName), line: meetCollectLine(r.kind, fromName), view: viewOf((await canonicalWallet(sql, userId)).wallet) };
    };
    if (row.state === "collected") return done(row, true);
    if ((row.state === "open" || row.state === "pending") && Number(row.exp) <= now) {
      // Too late: the escrow goes back to the dropper and the collector gets nothing.
      const gone = await sql.query<Row>(
        `update meet_drops set state = 'expired', settled_at = $2::timestamptz where id = $1 and state in ('open', 'pending') and expires_at <= $2::timestamptz returning ${COLS}`,
        [id, iso(now)],
      );
      if (gone[0]) await settle(sql, gone[0]);
      return { ok: false, reason: "gone" };
    }
    if (row.state !== "open") return { ok: false, reason: "gone" };
    const lamp = meetLamp(row.city, row.poi_id);
    if (!lamp) return { ok: false, reason: "lamp" };
    const lat = Number(op.lat);
    const lng = Number(op.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || distM(lat, lng, lamp.lat, lamp.lng) > DAILY_REACH_M) return { ok: false, reason: "far" };
    // The gate: only the one call that moves the row open -> collected goes on to credit.
    const got = await sql.query<Row>(
      `update meet_drops set state = 'collected', settled_at = $3::timestamptz
       where id = $1 and friend_id = $2 and state = 'open' and expires_at > $3::timestamptz returning ${COLS}`,
      [id, me, iso(now)],
    );
    if (got[0]) return done(got[0], false);
    row = await rowOf(sql, id);
    if (row?.state === "collected" && row.friend_id === me) return done(row, true);
    return { ok: false, reason: "gone" };
  } catch (e) {
    if (tableMissing(e)) return { ok: false, reason: "unready" };
    throw e;
  }
}

export async function meetStatus(sql: Sql, userId: string, now = Date.now()): Promise<MeetStatus> {
  try {
    const { id: me } = await canonicalWallet(sql, userId);
    await sweep(sql, me, now);
    const friendIds = await friendIdsOf(sql, userId);
    const incoming = await sql.query<Row>(`select ${COLS} from meet_drops where friend_id = $1 and state = 'open' and expires_at > $2::timestamptz order by expires_at, id`, [me, iso(now)]);
    const mine = await sql.query<Row>(`select ${COLS} from meet_drops where dropper_id = $1 and state in ('pending', 'open') and expires_at > $2::timestamptz order by expires_at, id`, [me, iso(now)]);
    const names = await namesOf(sql, [...new Set([...friendIds, ...incoming.map((r) => r.dropper_id), ...mine.map((r) => r.friend_id)])]);
    const name = (id: string) => names.get(id) ?? "Walker";
    return {
      ready: true,
      friends: friendIds.map((id) => ({ id, name: name(id) })),
      incoming: incoming.map((r) => viewOfRow(r, name(r.dropper_id))),
      mine: mine.map((r) => viewOfRow(r, name(r.friend_id))),
    };
  } catch (e) {
    if (tableMissing(e)) return { ready: false, friends: [], incoming: [], mine: [] };
    throw e;
  }
}
