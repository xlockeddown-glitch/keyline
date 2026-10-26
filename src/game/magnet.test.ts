// 0.1.46: the Roadster 2.0 Magnet rides the street claim path with two more server checks (owns car:roadster2,
// a drive ping in this city within 5 min), one pull every 3 s, 30 a city a day inside the 80, no duplicates.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { STREET_DAY_CAP, streetSpot } from "./streetSpots.ts";
import { canonicalWallet } from "./walletSql.ts";
import { applyClientOp, syncPlayer } from "./walletApply.ts";
import { thanksClock } from "./thanksGift.ts";
import type { LocalSnap } from "./wallet.ts";
import { CAR_PERKS, MAGNET_DAY_CAP, MAGNET_GAP_MS, MAGNET_M, hasMagnet, magnetPick } from "./carPerks.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
const mig = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const austin = { ...freshUnlocks(), start: "austin" as const, unlocked: ["austin" as const], freePick: false };
const snap: LocalSnap = { coins: 0, keys: {}, cities: austin };
const day = () => new Date().toISOString().slice(0, 10);
async function player(sql: Sql, u: string, car: string | null) {
  await syncPlayer(sql, u, snap, `${u}-phone`);
  const { id } = await canonicalWallet(sql, u);
  if (car) await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${`car:${car}`}, '{}')`;
  return id;
}
const pull = (sql: Sql, u: string, i: number, via: "magnet" | null = "magnet") => {
  const s = streetSpot(u, "austin", day(), i)!;
  return applyClientOp(sql, u, { kind: "street", id: s.id, tier: s.tier, city: "austin", lat: 0, lng: 0, ...(via ? { via } : {}) });
};
/** Move every magnet row back past the 3 s spacing (instead of sleeping). */
const rewind = (sql: Sql, id: string) => sql`update wallet_ledger set created_at = created_at - interval '4 seconds' where user_id = ${id} and op_key like ${"street:%"}`;

test("client side: only the Roadster 2.0 has a Magnet; nearest match within 35 m; one every 3 s", () => {
  assert.equal(MAGNET_M, 35);
  assert.equal(MAGNET_GAP_MS, 3000);
  assert.equal(MAGNET_DAY_CAP, 30);
  for (const c of ["civic", "f150", "mustang", "roadster"] as const) assert.equal(hasMagnet(c), false, c);
  assert.equal(hasMagnet(null), false);
  assert.equal(hasMagnet("roadster2"), true);
  assert.match(CAR_PERKS.roadster2.label, /Magnet/);
  const at = { lat: 42.33, lng: -83.05 };
  const m = (dm: number) => 42.33 + dm / 111_320;
  const keys = [{ id: "far", lat: m(40), lng: -83.05 }, { id: "near", lat: m(20), lng: -83.05 }, { id: "edge", lat: m(34), lng: -83.05 }];
  assert.equal(magnetPick("roadster2", at, keys, 0, 10_000), "near");
  assert.equal(magnetPick("roadster2", at, [keys[0]!], 0, 10_000), null, "40 m is out of reach");
  assert.equal(magnetPick("roadster2", at, [keys[2]!], 0, 10_000), "edge", "34 m is in");
  assert.equal(magnetPick("roadster2", at, keys, 8_000, 10_000), null, "2 s after the last pull: wait");
  assert.equal(magnetPick("roadster2", at, keys, 7_000, 10_000), "near", "3 s: go");
  assert.equal(magnetPick("roadster", at, keys, 0, 10_000), null, "the first Roadster has no Magnet");
  assert.equal(magnetPick(null, at, keys, 0, 10_000), null, "not seated: nothing");
});

test("owner only, and only while driving in this city (a drive ping in the last 5 min; walking doesn't count)", async () => {
  const sql = await db();
  await player(sql, "nocar", null);
  await player(sql, "r1", "roadster");
  const id = await player(sql, "own", "roadster2");
  for (const u of ["nocar", "r1"]) {
    assert.equal((await applyClientOp(sql, u, { kind: "drive", city: "austin" })).reason, "no-car", u);
    await sql`insert into walk_distance (user_id, city, meters, updated_at) values (${u}, 'austin', 40, now())`;
    const r = await pull(sql, u, 0);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "no-car", `${u}: other cars don't pull`);
    { const w = await pull(sql, u, 0, null); assert.equal(w.ok, true, `${u}: walking still works: ${w.reason}`); }
  }
  await sql`insert into walk_distance (user_id, city, meters, updated_at) values ('own', 'austin', 40, now())`;
  assert.equal((await pull(sql, "own", 0)).reason, "not-driving", "a walk post isn't driving");
  assert.equal((await applyClientOp(sql, "own", { kind: "drive", city: "nyc" })).reason, "locked");
  assert.equal((await applyClientOp(sql, "own", { kind: "drive", city: "austin" })).ok, true);
  const ok = await pull(sql, "own", 0);
  assert.equal(ok.ok, true);
  const row = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key like ${"street:%"}`;
  assert.equal(JSON.parse(row[0]!.detail).mg, 1);
  // Stale ping.
  await sql`update wallet_ledger set created_at = now() - interval '6 minutes' where user_id = ${id} and op_key = 'drive:austin'`;
  await rewind(sql, id);
  assert.equal((await pull(sql, "own", 1)).reason, "not-driving", "6 min since the last drive ping");
  // A ping moves the same row forward (one row per city).
  await applyClientOp(sql, "own", { kind: "drive", city: "austin" });
  await applyClientOp(sql, "own", { kind: "drive", city: "austin" });
  assert.equal((await sql`select 1 from wallet_ledger where user_id = ${id} and op_key = 'drive:austin'`).length, 1);
  assert.equal((await pull(sql, "own", 1)).ok, true);
});

test("3 s spacing, replays pay nothing, 30 a day, and the 80 still holds", async () => {
  const sql = await db();
  const id = await player(sql, "mg", "roadster2");
  await sql`insert into walk_distance (user_id, city, meters, updated_at) values ('mg', 'austin', 40, now())`;
  await applyClientOp(sql, "mg", { kind: "drive", city: "austin" });
  const first = await pull(sql, "mg", 0);
  assert.equal(first.ok, true);
  assert.equal((await pull(sql, "mg", 1)).reason, "magnet-wait", "under 3 s");
  // Replay of the same match: no second pay, no new row, whichever way it's sent.
  const keys = JSON.stringify(first.wallet.keys);
  const again = await pull(sql, "mg", 0);
  assert.equal(again.replay, true);
  assert.equal(JSON.stringify(again.wallet.keys), keys);
  assert.equal((await pull(sql, "mg", 0, null)).replay, true);
  for (let i = 1; i < MAGNET_DAY_CAP; i++) {
    await rewind(sql, id);
    const r = await pull(sql, "mg", i);
    assert.equal(r.ok, true, `pull ${i}: ${r.reason}`);
  }
  await rewind(sql, id);
  assert.equal((await pull(sql, "mg", MAGNET_DAY_CAP)).reason, "magnet-capped");
  const mg = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like 'street:%' and detail like '%"mg":1%'`;
  assert.equal(Number(mg[0]!.n), MAGNET_DAY_CAP);
  // Walk the rest of the 80, then even the Magnet stops at the street cap.
  for (let i = MAGNET_DAY_CAP; i < STREET_DAY_CAP; i++) assert.equal((await pull(sql, "mg", i, null)).ok, true, `walk ${i}`);
  assert.equal((await pull(sql, "mg", STREET_DAY_CAP, null)).reason, "capped");
  assert.equal((await pull(sql, "mg", STREET_DAY_CAP)).reason, "capped");
  const all = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like 'street:%'`;
  assert.equal(Number(all[0]!.n), STREET_DAY_CAP);
});

test("a full pocket overflows exactly as a walked pickup does", async () => {
  const sql = await db();
  const mid = await player(sql, "full", "roadster2");
  const wid = await player(sql, "walker", null);
  await applyClientOp(sql, "full", { kind: "drive", city: "austin" });
  await sql`insert into walk_distance (user_id, city, meters, updated_at) values ('walker', 'austin', 40, now())`;
  for (const id of [mid, wid]) await sql.query(`update player_wallets set white = 30, blue = 30, green = 30, amber = 30, red = 30, violet = 30 where user_id = $1`, [id]);
  const ms = streetSpot("full", "austin", day(), 0)!;
  let j = 0;
  while (streetSpot("walker", "austin", day(), j)!.tier !== ms.tier || streetSpot("walker", "austin", day(), j)!.market !== ms.market) j++;
  const r = await pull(sql, "full", 0);
  const w = await pull(sql, "walker", j, null);
  assert.equal(r.ok, true, r.reason);
  assert.equal(w.ok, true, w.reason);
  assert.deepEqual(r.wallet.keys, w.wallet.keys);
  assert.deepEqual(r.wallet.meta.credit, w.wallet.meta.credit);
  assert.equal(r.wallet.coins, w.wallet.coins);
  assert.equal(r.wallet.keys[ms.tier], 30, "pocket stays at 30; the extra becomes credit as today");
});
