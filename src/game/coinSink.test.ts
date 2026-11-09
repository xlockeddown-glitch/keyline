// 0.1.138: the key desk is closed, and a patron lamp is one coin charge per market cycle.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2999-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { KIOSK, KIOSK_RETIRED, kioskRetired } from "./data.ts";
import { MARKET_HOUR_MS, MARKET_OPEN_MS } from "./nightMarket.ts";
import { cleanPatron, patronLive, patronOpen, patronUntil, type PatronBulb } from "./patron.ts";
import { thanksClock } from "./thanksGift.ts";
import { kioskOp, type WalletState } from "./wallet.ts";
import { applyClientOp, grantPatron } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import type { LocalSnap } from "./wallet.ts";
thanksClock.cutoff = "2999-01-01T00:00:00Z";

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
const snap = (coins: number): LocalSnap => ({ coins, keys: { white: 4, blue: 2, violet: 1 }, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });

const openAt = (cycle = 1_700_000_000) => cycle * MARKET_HOUR_MS + 60_000;
const darkAt = (cycle = 1_700_000_000) => cycle * MARKET_HOUR_MS + MARKET_OPEN_MS + 1_000;

test("the desk tray no longer lists the four key rows", () => {
  assert.deepEqual(Object.keys(KIOSK).sort(), ["fare", "pass", "smear"]);
  assert.deepEqual(Object.keys(KIOSK_RETIRED).sort(), ["amber", "oil", "tinder", "wick"]);
  for (const id of Object.keys(KIOSK_RETIRED)) assert.equal(kioskRetired(id), true);
  const counter = readFileSync(new URL("../components/keyline/WardCounter.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(counter, /Tinder tin|Blue wick|Amber reprint|Night oil/);
});

test("an old save that already holds keys is unchanged when a retired row is asked for", () => {
  const pocket = { white: 4, blue: 2, green: 0, amber: 1, red: 0, violet: 3 };
  const w = { coins: 50_000, keys: pocket } as WalletState;
  for (const id of ["tinder", "wick", "amber", "oil"] as const) {
    const r = kioskOp(w, id);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "retired");
  }
  assert.equal(w.coins, 50_000);
  assert.deepEqual(w.keys, pocket);
});

test("server: a retired kiosk row charges nothing and leaves keys already in the pocket", async () => {
  const sql = await db();
  const { syncPlayer } = await import("./walletApply.ts");
  await syncPlayer(sql, "old", snap(50_000), "oldphone1");
  const before = await canonicalWallet(sql, "old");
  for (const id of ["tinder", "wick", "amber", "oil"] as const) {
    const r = await applyClientOp(sql, "old", { kind: "kiosk", id });
    assert.equal(r.ok, false, id);
    assert.equal(r.reason, "retired", id);
  }
  const after = await canonicalWallet(sql, "old");
  assert.equal(after.wallet.coins, before.wallet.coins);
  assert.deepEqual(after.wallet.keys, before.wallet.keys);
  assert.equal(after.wallet.keys.white, 4);
  assert.equal(after.wallet.keys.violet, 1);
});

test("patron lamp: price, one charge, short pocket, replay, other bulb, and the tint ends when the cycle does", async () => {
  const sql = await db();
  const { syncPlayer } = await import("./walletApply.ts");
  await syncPlayer(sql, "pat", snap(5_000), "patphone1");
  const at = openAt();
  assert.equal(patronOpen(at), true);
  assert.equal(patronOpen(darkAt()), false);

  const short = await grantPatron(sql, "pat", "night", at);
  assert.equal(short.ok, false);
  assert.equal(short.reason, "short-coins");
  assert.equal((await canonicalWallet(sql, "pat")).wallet.coins, 5_000);

  const bought = await grantPatron(sql, "pat", "copper", at);
  assert.equal(bought.ok, true);
  assert.equal(bought.replay, false);
  assert.equal(bought.patron?.bulb, "copper");
  assert.equal((await canonicalWallet(sql, "pat")).wallet.coins, 0);
  assert.equal(bought.patron && patronLive(bought.patron, at), true);
  assert.equal(bought.patron && patronLive(bought.patron, darkAt()), false, "the tint ends when the market goes dark");
  assert.equal(bought.patron && patronLive(bought.patron, patronUntil(bought.patron.cycle)), false);

  await sql`update player_wallets set coins = 20000 where user_id = ${(await canonicalWallet(sql, "pat")).id}`;
  const again = await grantPatron(sql, "pat", "copper", at);
  assert.equal(again.replay, true);
  assert.equal((await canonicalWallet(sql, "pat")).wallet.coins, 20_000, "a second tap does not charge");

  const other = await grantPatron(sql, "pat", "brass", at);
  assert.equal(other.ok, false);
  assert.equal(other.reason, "held");
  assert.equal(other.patron?.bulb, "copper");
  assert.equal((await canonicalWallet(sql, "pat")).wallet.coins, 20_000);

  const closed = await grantPatron(sql, "pat", "brass", darkAt());
  assert.equal(closed.reason, "closed");
  assert.equal((await canonicalWallet(sql, "pat")).wallet.coins, 20_000);

  const next = await grantPatron(sql, "pat", "brass", openAt(1_700_000_001));
  assert.equal(next.ok, true);
  assert.equal(next.patron?.bulb, "brass");
  assert.equal((await canonicalWallet(sql, "pat")).wallet.coins, 18_000);

  assert.equal(cleanPatron({ bulb: "nope", cycle: 1, until: 2 }, at), null);
  assert.equal((["brass", "copper", "night"] as PatronBulb[]).length, 3);
});

test("patron tint is local, static, and does not touch the market multiplier", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  const start = css.indexOf("0.1.138 patron lamp");
  const block = css.slice(start, css.indexOf("/* 0.1.6", start));
  assert.match(block, /data-patron="brass"/);
  assert.match(block, /data-patron="copper"/);
  assert.match(block, /data-patron="night"/);
  assert.match(block, /animation:\s*none/);
  assert.doesNotMatch(block, /@keyframes/);
  const src = readFileSync(new URL("./walletApply.ts", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function grantPatron"), src.indexOf("async function patronNow"));
  assert.doesNotMatch(fn, /keys:|marketCoinX|TRIPLE_COIN|loot/);
});
