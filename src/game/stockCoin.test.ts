/** 0.1.82: the one-time stock trade-in: rates, caps, server-only counts, and once per account. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { LocalSnap } from "./wallet.ts";
import { STOCK_CAPS, STOCK_COIN_KEY, STOCK_COIN_MAX, STOCK_RATES, stockCoin } from "./stockCoin.ts";
import { thanksClock } from "./thanksGift.ts";
import { syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";

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
  await pg.exec(mig("0016_player_wallet.sql"));
  await pg.exec(mig("0003_plate_events.sql"));
  await pg.exec(mig("0014_walk_distance.sql"));
  return sqlOf(pg);
}
const snap = (over: Partial<LocalSnap> = {}): LocalSnap => ({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false }, ...over });

test("rates are Ryan's (100 press, 200 brass/ink/vellum, 500 schematic) and each count is held to the wallet cap", () => {
  assert.deepEqual(STOCK_RATES, { press: 100, brass: 200, ink: 200, vellum: 200, schematic: 500 });
  assert.deepEqual(STOCK_CAPS, { press: 24, brass: 48, ink: 32, vellum: 32, schematic: 8 });
  assert.equal(stockCoin({ press: 5, brass: 31, ink: 12, vellum: 9, schematic: 2 }), 500 + 6200 + 2400 + 1800 + 1000);
  assert.equal(stockCoin({ brass: 9_999, press: -4, ink: NaN, vellum: 2.9 }), 48 * 200 + 2 * 200);
  assert.equal(stockCoin({}), 0);
  assert.equal(STOCK_COIN_MAX, 2400 + 9600 + 6400 + 6400 + 4000);
  assert.equal(STOCK_COIN_MAX, 28_800);
});

/** A pre-0.1.82 account: its wallet already exists with stock on it, and no trade-in row yet. */
async function oldAccount(sql: Sql, name: string, stock: Record<string, number>) {
  await syncPlayer(sql, name, snap(), `${name}phone01`);
  const { id, wallet } = await canonicalWallet(sql, name);
  await sql`delete from wallet_ledger where user_id = ${id} and op_key = ${STOCK_COIN_KEY}`;
  await sql.query(`update player_wallets set meta = $2::jsonb where user_id = $1`, [id, JSON.stringify({ ...wallet.meta, ...stock })]);
  return id;
}

test("server: pays once from the wallet's own counts; the client's numbers don't count; replays pay nothing", async () => {
  const sql = await db();
  await oldAccount(sql, "st", { brass: 31, ink: 12, vellum: 9, schematic: 2, press: 5 });
  const before = (await canonicalWallet(sql, "st")).wallet.coins;
  const r = await syncPlayer(sql, "st", snap({ brass: 999, ink: 999, press: 999, schematic: 999 } as Partial<LocalSnap>), "stphone01");
  const after = (await canonicalWallet(sql, "st")).wallet;
  assert.equal(after.coins - before, 11_900);
  assert.ok(r.giftNotes?.some((n) => n.includes("11,900 coin")), JSON.stringify(r.giftNotes));
  assert.equal(after.meta.brass, 31, "stock fields are left alone");
  const again = await syncPlayer(sql, "st", snap(), "stphone02");
  assert.equal((await canonicalWallet(sql, "st")).wallet.coins, after.coins);
  assert.ok(!again.giftNotes?.some((n) => n.includes("traded")));
});

test("server: a full bag at every cap pays exactly the max; a new account pays nothing and can't later", async () => {
  const sql = await db();
  await oldAccount(sql, "cap", { ...STOCK_CAPS });
  const before = (await canonicalWallet(sql, "cap")).wallet.coins;
  await syncPlayer(sql, "cap", snap(), "capphone1");
  assert.equal((await canonicalWallet(sql, "cap")).wallet.coins - before, STOCK_COIN_MAX);
  await syncPlayer(sql, "nu", snap({ brass: 48, press: 24 } as Partial<LocalSnap>), "nuphone01");
  const nu = (await canonicalWallet(sql, "nu")).wallet;
  assert.equal(nu.meta.brass, 0, "first sync keeps the server's (empty) stock");
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${(await canonicalWallet(sql, "nu")).id} and op_key = ${STOCK_COIN_KEY}`;
  assert.equal(rows.length, 1, "the trade-in row is spent at 0 coin");
});
