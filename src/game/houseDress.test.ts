// 0.1.154: dresser pieces on a house you own. Once each. The key is untouched.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { thanksClock } from "./thanksGift.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { DRESS, DRESS_TOTAL } from "./houseDress.ts";
import type { LocalSnap } from "./wallet.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
const mig = (n: string) => readFileSync(new URL(`../../migrations/${n}`, import.meta.url), "utf8");
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap = (coins: number): LocalSnap => ({ coins, keys: { white: 3, amber: 1 }, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });

test("four pieces, any order, 205,000 for a full door", () => {
  assert.deepEqual(DRESS.map((d) => d.price), [15_000, 30_000, 60_000, 100_000]);
  assert.equal(DRESS_TOTAL, 205_000);
});

test("dresser: once per piece, no house means no charge, and the key is untouched", async () => {
  const { applyClientOp, grantHouseDress, housesOf, syncPlayer } = await import("./walletApply.ts");
  const { canonicalWallet } = await import("./walletSql.ts");
  const sql = await db();
  await syncPlayer(sql, "ace", snap(250_000), "acephone1");
  const pocket = async () => (await canonicalWallet(sql, "ace")).wallet;
  const keys = (await pocket()).keys;
  const rows = async () => Number((await sql<{ n: string }>`select count(*) as n from wallet_ledger where user_id = 'ace' and op_key like ${"decor:%"}`)[0]?.n ?? 0);

  const bare = await grantHouseDress(sql, "ace", "austin", "lamp");
  assert.equal(bare.reason, "unowned");
  assert.equal((await pocket()).coins, 250_000);
  assert.equal(await rows(), 0);

  assert.equal((await applyClientOp(sql, "ace", { kind: "house", city: "austin", tier: "cottage" })).ok, true);
  assert.equal((await pocket()).coins, 210_000);

  await sql`update player_wallets set coins = 1000 where user_id = 'ace'`;
  const short = await grantHouseDress(sql, "ace", "austin", "lamp");
  assert.equal(short.reason, "short-coins");
  assert.equal((await pocket()).coins, 1_000);
  assert.equal(await rows(), 0);

  await sql`update player_wallets set coins = 210000 where user_id = 'ace'`;
  const lamp = await applyClientOp(sql, "ace", { kind: "decor", city: "austin", item: "lamp" });
  assert.equal(lamp.ok, true);
  assert.equal(lamp.replay, false);
  assert.equal((await pocket()).coins, 195_000);
  assert.deepEqual((await pocket()).keys, keys);

  const again = await grantHouseDress(sql, "ace", "austin", "lamp");
  assert.equal(again.replay, true);
  assert.equal((await pocket()).coins, 195_000, "a refresh does not charge");

  const [a, b] = await Promise.all([grantHouseDress(sql, "ace", "austin", "rail"), grantHouseDress(sql, "ace", "austin", "rail")]);
  assert.equal([a.replay, b.replay].filter(Boolean).length, 1);
  assert.equal((await pocket()).coins, 165_000);

  assert.equal((await grantHouseDress(sql, "ace", "austin", "window")).ok, true);
  assert.equal((await grantHouseDress(sql, "ace", "austin", "plate")).ok, true);
  assert.equal((await pocket()).coins, 5_000);
  assert.deepEqual((await pocket()).keys, keys);
  const held = (await housesOf(sql, "ace")).austin;
  assert.equal(held?.tier, "cottage");
  assert.deepEqual([...(held?.items ?? [])].sort(), ["lamp", "plate", "rail", "window"]);
  assert.equal(await rows(), 4);
});

test("the dresser does not touch the key", () => {
  const src = readFileSync(new URL("./walletApply.ts", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function grantHouseDress"), src.indexOf("export async function applyClientOp"));
  assert.doesNotMatch(fn, /KEY_MATCHES|hook:/);
  assert.match(fn, /dressKey\(city, piece\.id\)/);
});
