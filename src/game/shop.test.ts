// 0.1.120: Lantern Shops are retired. The till math stays for the one-time buy-back; buy and collect are refused.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2999-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { LocalSnap } from "./wallet.ts";
import { SHOP_RETIRE_KEY, applyClientOp, shopsOf, syncPlayer } from "./walletApply.ts";
import { canonicalWallet, mutateWallet } from "./walletSql.ts";
import { COIN_CAP } from "./wallet.ts";
import { thanksClock } from "./thanksGift.ts";
import { SHOP_CAP, SHOP_EVERY_MS, SHOP_PAY, SHOP_PRICE, shopAnchor, shopOutput } from "./shop.ts";
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
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
const H = SHOP_EVERY_MS;

test("till math: 2k per 4 h, part-made payout carries over, till caps at 3", () => {
  const t0 = 1_800_000_000_000;
  assert.deepEqual(shopOutput(t0, t0 + H - 1), { n: 0, coin: 0, nextAnchor: t0, readyAt: t0 + H });
  assert.equal(shopOutput(t0, t0 + H + 60_000).coin, SHOP_PAY);
  assert.equal(shopOutput(t0, t0 + 2.5 * H).coin, 2 * SHOP_PAY);
  assert.equal(shopOutput(t0, t0 + 10 * H).coin, SHOP_CAP * SHOP_PAY);
  assert.equal(shopOutput(t0, t0 - 5).n, 0);
  assert.equal(shopAnchor(t0, [t0 + H, t0 + 3 * H]), t0 + 3 * H);
  assert.equal(SHOP_PRICE, 600_000);
});

const seedShop = (sql: Sql, uid: string, city: string, at: number) =>
  mutateWallet(sql, uid, `shop:${city}`, (w) => ({ ok: true, wallet: w, detail: JSON.stringify({ city, at }) }));

test("0.1.120 buy-back: 600k per shop plus its till, once per account; no shop, no gift", async () => {
  const sql = await db();
  const none = await syncPlayer(sql, "nos", snap, "nosphone1");
  assert.ok(!(none.giftNotes ?? []).some((n) => /Lantern Shops/.test(n)));
  assert.equal((await sql`select 1 from wallet_ledger where op_key = ${SHOP_RETIRE_KEY}`).length, 0, "no row for a non-owner");

  await syncPlayer(sql, "own", snap, "ownphone1");
  const wid = (await canonicalWallet(sql, "own")).id;
  await sql`update player_wallets set coins = 100 where user_id = ${wid}`;
  await seedShop(sql, "own", "austin", Date.now() - 9 * H); // till full: 3 payouts
  await seedShop(sql, "own", "nyc", Date.now() - 1.5 * H); // 1 payout
  await mutateWallet(sql, "own", `shopc:nyc:${Date.now() - 1.5 * H}`, (w) => ({ ok: true, wallet: w, detail: "{}" }));
  const want = 2 * SHOP_PRICE + SHOP_CAP * SHOP_PAY + SHOP_PAY;
  const s = await syncPlayer(sql, "own", snap, "ownphone1");
  assert.ok((s.giftNotes ?? []).includes(`Lantern Shops are retired. Your 2 shops were bought back for ${want.toLocaleString("en-US")} coins.`), JSON.stringify(s.giftNotes));
  assert.equal((await canonicalWallet(sql, "own")).wallet.coins, 100 + want);
  assert.equal(s.owned && "shops" in s.owned, false, "sync no longer sends shops");
  const again = await syncPlayer(sql, "own", snap, "ownphone2");
  assert.ok(!(again.giftNotes ?? []).some((n) => /Lantern Shops/.test(n)), "second device pays nothing");
  assert.equal((await canonicalWallet(sql, "own")).wallet.coins, 100 + want);
  assert.deepEqual(Object.keys(await shopsOf(sql, "own")).sort(), ["austin", "nyc"], "ledger rows stay");
});

test("0.1.120 buy-back clamps at the coin cap and says so", async () => {
  const sql = await db();
  await syncPlayer(sql, "cap", snap, "capphone1");
  const wid = (await canonicalWallet(sql, "cap")).id;
  await sql`update player_wallets set coins = ${COIN_CAP - 1000} where user_id = ${wid}`;
  await seedShop(sql, "cap", "austin", Date.now());
  const s = await syncPlayer(sql, "cap", snap, "capphone1");
  assert.ok((s.giftNotes ?? []).some((n) => /Your 1 shop was bought back for 600,000 coins\. \(your coins were near the cap/.test(n)), JSON.stringify(s.giftNotes));
  assert.equal((await canonicalWallet(sql, "cap")).wallet.coins, COIN_CAP);
});

test("0.1.120: old tabs' shop and shopCollect ops are refused as retired and move no coin", async () => {
  const sql = await db();
  await syncPlayer(sql, "old", snap, "oldphone1");
  const wid = (await canonicalWallet(sql, "old")).id;
  await sql`update player_wallets set coins = ${SHOP_PRICE * 2} where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "old", { kind: "shop", city: "austin" })).reason, "retired");
  assert.equal((await applyClientOp(sql, "old", { kind: "shopCollect", city: "austin" })).reason, "retired");
  assert.equal((await canonicalWallet(sql, "old")).wallet.coins, SHOP_PRICE * 2);
  assert.deepEqual(await shopsOf(sql, "old"), {});
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
  assert.match(pkg, /src\/game\/shop\.test\.ts/);
});

test("0.1.120: old shopc rows still read as Shop in Recent rewards", async () => {
  const { rewardOfRow, SOURCE_LABEL } = await import("./recentRewards.ts");
  const r = rewardOfRow("shopc:austin:123", JSON.stringify({ coins: 2000 }), 1, () => undefined);
  assert.equal(r?.src, "shop");
  assert.equal(SOURCE_LABEL.shop, "Shop");
});

test("0.1.60 copy (kept): Travel at the station, never Board train", () => {
  const hud = readFileSync(new URL("../components/keyline/Hud.tsx", import.meta.url), "utf8");
  const map = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(hud + map, /Board train|Board the train/);
  assert.match(hud, /cue = `Travel · T · /);
  assert.doesNotMatch(hud, /T to board/);
});
