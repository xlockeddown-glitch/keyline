// 0.1.153: one press-shop recolor a week, 25,000 coin, once.
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
import { PRESS_PULL_PRICE, pressMonday, pressOffer, pressWeek } from "./pressPull.ts";
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
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", "0008_wardrobes.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap = (coins: number): LocalSnap => ({ coins, keys: { white: 4, blue: 2 }, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });

const monday = Date.UTC(2026, 10, 9);
const nextMonday = Date.UTC(2026, 10, 16);

test("the offer changes on Monday and stays put through the week", () => {
  assert.equal(new Date(pressMonday(monday)).getUTCDay(), 1);
  assert.equal(pressMonday(monday + 3 * 24 * 60 * 60 * 1000), pressMonday(monday));
  assert.equal(pressWeek(nextMonday), pressWeek(monday) + 1);
  const a = pressOffer(monday);
  const b = pressOffer(nextMonday);
  assert.notEqual(`${a.job}:${a.color}`, `${b.job}:${b.color}`);
  assert.equal(PRESS_PULL_PRICE, 25_000);
});

test("press pull: 25,000 once, a missed week is a new offer, and pay is untouched", async () => {
  const { grantPressPull, syncPlayer } = await import("./walletApply.ts");
  const { canonicalWallet } = await import("./walletSql.ts");
  const sql = await db();
  await syncPlayer(sql, "ace", snap(100), "acephone1");
  const bare = await grantPressPull(sql, "ace", monday);
  assert.equal(bare.reason, "unowned");
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 100);

  await sql`insert into wardrobes (user_id, owned, paid, coat, lantern, equip_at) values ('ace', ${JSON.stringify(["oilskin", "copper"])}, '{}', 'oilskin', 'copper', 1)`;
  const short = await grantPressPull(sql, "ace", monday);
  assert.equal(short.reason, "short-coins");
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 100);
  const pulls = async () => sql<{ n: string }>`select count(*) as n from wallet_ledger where user_id = 'ace' and op_key like ${"pull:%"}`;
  assert.equal(Number((await pulls())[0]?.n ?? 0), 0);

  await sql`update player_wallets set coins = 25000 where user_id = 'ace'`;
  const keys = (await canonicalWallet(sql, "ace")).wallet.keys;
  const bought = await grantPressPull(sql, "ace", monday);
  assert.equal(bought.ok, true);
  assert.equal(bought.replay, false);
  assert.equal(bought.pull?.week, pressWeek(monday));
  const pocket = await canonicalWallet(sql, "ace");
  assert.equal(pocket.wallet.coins, 0);
  assert.deepEqual(pocket.wallet.keys, keys);
  const dye = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'ace' and op_key like ${"dye:%"}`;
  assert.equal(dye.length, 1);
  assert.equal(dye[0]!.op_key, `dye:${bought.pull!.job}:${bought.pull!.color}`);

  await sql`update player_wallets set coins = 25000 where user_id = 'ace'`;
  const again = await grantPressPull(sql, "ace", monday + 2 * 24 * 60 * 60 * 1000);
  assert.equal(again.replay, true);
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 25_000, "a refresh the same week does not charge");

  const next = await grantPressPull(sql, "ace", nextMonday);
  assert.equal(next.ok, true);
  assert.equal(next.replay, false);
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 0);
  assert.notEqual(`${next.pull?.job}:${next.pull?.color}`, `${bought.pull?.job}:${bought.pull?.color}`);
});

test("the pull does not touch payouts", () => {
  const src = readFileSync(new URL("./walletApply.ts", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function grantPressPull"), src.indexOf("function refused"));
  assert.doesNotMatch(fn, /HEARTH_CUT|marketCoinX|keys:/);
  assert.match(fn, /pressKey\(offer\.week\)/);
});
