// 0.1.154: 12,000 coin for one vat color on a hired scout, once per pair.
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
import { SCOUTS } from "./data.ts";
import { COLLAR_COLORS, COLLAR_PRICE, COLLAR_SCOUTS, collarHireBudget, collarKey, parseCollarRows, settleCollars, undoCollarBuy } from "./scoutCollar.ts";
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

test("six vat colors, ten scouts, 12,000 each, and the scarf is not a coat dye", () => {
  assert.equal(COLLAR_PRICE, 12_000);
  assert.deepEqual([...COLLAR_COLORS], ["white", "blue", "green", "amber", "red", "violet"]);
  assert.equal(COLLAR_SCOUTS.length, 10);
  assert.deepEqual([...COLLAR_SCOUTS].sort(), Object.keys(SCOUTS).sort());
  assert.equal(COLLAR_SCOUTS.length * COLLAR_COLORS.length * COLLAR_PRICE, 720_000);
  const book = parseCollarRows([
    { op_key: "collar:raccoon:amber", detail: '{"scout":"raccoon","color":"amber"}' },
    { op_key: "collar:raccoon:red", detail: "{}" },
    { op_key: "collaron:raccoon:5", detail: '{"color":"amber"}' },
    { op_key: "collar:lynx:prism", detail: "{}" },
  ]);
  assert.deepEqual(book.owned, ["raccoon:amber", "raccoon:red"]);
  assert.equal(book.worn.raccoon, "amber");
});

test("scout collar: 12,000 once per color, a second tap is free, an unhired scout is refused, and pay is untouched", async () => {
  const { applyClientOp, collarsOf, grantCollarOn, grantScoutCollar, syncPlayer } = await import("./walletApply.ts");
  const { canonicalWallet } = await import("./walletSql.ts");
  const sql = await db();
  await syncPlayer(sql, "ace", snap(80_000), "acephone1");
  const pocket = async () => (await canonicalWallet(sql, "ace")).wallet;
  const keys = (await pocket()).keys;
  const rows = async (like: string) => Number((await sql<{ n: string }>`select count(*) as n from wallet_ledger where user_id = 'ace' and op_key like ${like}`)[0]?.n ?? 0);

  const penguin = await grantScoutCollar(sql, "ace", "lynx", "red");
  assert.equal(penguin.reason, "unowned");
  assert.equal((await pocket()).coins, 80_000);
  assert.equal(await rows("collar:%"), 0);

  await sql`update player_wallets set coins = 100 where user_id = 'ace'`;
  const short = await grantScoutCollar(sql, "ace", "raccoon", "amber");
  assert.equal(short.reason, "short-coins");
  assert.equal((await pocket()).coins, 100);
  assert.equal(await rows("collar:%"), 0);

  await sql`update player_wallets set coins = 80000 where user_id = 'ace'`;
  const bought = await applyClientOp(sql, "ace", { kind: "collar", scout: "raccoon", color: "amber" });
  assert.equal(bought.ok, true);
  assert.equal(bought.replay, false);
  assert.equal(bought.collar?.color, "amber");
  assert.equal((await pocket()).coins, 68_000);
  assert.deepEqual((await pocket()).keys, keys);
  assert.equal(await rows("dye:%"), 0);

  const again = await grantScoutCollar(sql, "ace", "raccoon", "amber");
  assert.equal(again.replay, true);
  assert.equal((await pocket()).coins, 68_000, "a refresh does not charge");

  const [a, b] = await Promise.all([grantScoutCollar(sql, "ace", "raccoon", "red"), grantScoutCollar(sql, "ace", "raccoon", "red")]);
  assert.equal([a.ok, b.ok].filter(Boolean).length, 2);
  assert.equal([a.replay, b.replay].filter(Boolean).length, 1);
  assert.equal((await pocket()).coins, 56_000, "two taps at once charge once");
  assert.equal(await rows(collarKey("raccoon", "red")), 1);

  const wore = await grantCollarOn(sql, "ace", "raccoon", "amber");
  assert.equal(wore.ok, true);
  assert.equal(wore.replay, false);
  assert.equal((await pocket()).coins, 56_000);
  const held = await collarsOf(sql, "ace");
  assert.equal(held.worn.raccoon, "amber");
  assert.deepEqual(held.owned, ["raccoon:amber", "raccoon:red"]);
  const woreAgain = await grantCollarOn(sql, "ace", "raccoon", "amber");
  assert.equal(woreAgain.replay, true);
  assert.equal(await rows("collaron:%"), 1);

  const cat = await applyClientOp(sql, "ace", { kind: "scout", id: "cat" });
  assert.equal(cat.ok, true);
  assert.equal((await pocket()).coins, 48_000);
  const blue = await grantScoutCollar(sql, "ace", "cat", "blue");
  assert.equal(blue.ok, true);
  assert.equal((await pocket()).coins, 36_000);
  assert.deepEqual((await pocket()).keys, keys);

  const bare = await grantScoutCollar(sql, "ace", "fox", "violet");
  assert.equal(bare.reason, "unowned");
  assert.equal((await pocket()).coins, 36_000);
});

test("a failed buy puts the old scarf back, and sign-in does not charge a spend that already stuck", () => {
  const undone = undoCollarBuy({ owned: ["raccoon:amber", "raccoon:red"], worn: { raccoon: "red" } }, "raccoon", "red", "amber");
  assert.deepEqual(undone.owned, ["raccoon:amber"]);
  assert.equal(undone.worn.raccoon, "amber");
  const local = { owned: ["raccoon:amber"], worn: { raccoon: "amber" as const } };
  const server = { owned: [] as string[], worn: {} };
  const stuck = settleCollars(local, server, true, []);
  assert.deepEqual(stuck.owned, ["raccoon:amber"]);
  assert.equal(stuck.worn.raccoon, "amber");
  const dropped = settleCollars(local, server, false, []);
  assert.deepEqual(dropped.owned, []);
  const charged = settleCollars(local, server, false, ["raccoon:amber"]);
  assert.deepEqual(charged.owned, ["raccoon:amber"]);
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const fn = store.slice(store.indexOf("syncCollars: async"), store.indexOf("adoptWardrobe: (w)"));
  assert.match(fn, /spendStuck/);
  assert.match(fn, /collarHireBudget/);
  assert.doesNotMatch(fn, /keepPoints/);
  assert.equal(collarHireBudget(SCOUTS.cat.coins + COLLAR_PRICE, "cat"), true);
  assert.equal(collarHireBudget(SCOUTS.cat.coins + COLLAR_PRICE - 1, "cat"), false);
  assert.equal(collarHireBudget(COLLAR_PRICE, "raccoon"), true);
});

test("the collar does not touch payouts", () => {
  const src = readFileSync(new URL("./walletApply.ts", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function grantScoutCollar"), src.indexOf("function refused"));
  assert.doesNotMatch(fn, /HEARTH_CUT|marketCoinX|keys:/);
  assert.match(fn, /COLLAR_PRICE/);
  assert.match(fn, /collarKey\(scout, color\)/);
});
