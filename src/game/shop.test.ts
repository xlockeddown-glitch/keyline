// 0.1.59 Lantern Shop: buy once per city, coin every 4 h, till caps at 3 payouts, server clock only.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2999-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createGraph, ingestBaked, nearest, routeOnGraph, type BakedCity } from "./streets.ts";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { LocalSnap } from "./wallet.ts";
import { applyClientOp, shopsOf, syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { SHOP_REACH_M, SHOP_CAP, SHOP_EVERY_MS, SHOP_PAY, SHOP_PRICE, cleanShops, formatWait, tillLine, shopAnchor, shopLot, shopOutput } from "./shop.ts";
import { HOUSE_LOTS } from "./houses.ts";
import { distM } from "./geo.ts";
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

test("collect math: 2k per 4 h, part-made payout carries over, till caps at 3 and restarts", () => {
  const t0 = 1_800_000_000_000;
  assert.deepEqual(shopOutput(t0, t0 + H - 1), { n: 0, coin: 0, nextAnchor: t0, readyAt: t0 + H });
  const one = shopOutput(t0, t0 + H + 60_000);
  assert.equal(one.n, 1);
  assert.equal(one.coin, SHOP_PAY);
  assert.equal(one.nextAnchor, t0 + H, "the extra minute counts toward the next payout");
  assert.equal(one.readyAt, t0 + 2 * H);
  const two = shopOutput(t0, t0 + 2.5 * H);
  assert.equal(two.coin, 2 * SHOP_PAY);
  const full = shopOutput(t0, t0 + 10 * H + 12_345);
  assert.equal(full.n, SHOP_CAP);
  assert.equal(full.coin, SHOP_CAP * SHOP_PAY);
  assert.equal(full.nextAnchor, Math.floor((t0 + 10 * H + 12_345) / 60_000) * 60_000, "a full till restarts at the collect (minute)");
  assert.equal(shopOutput(t0, t0 - 5).n, 0, "a clock behind the anchor pays nothing");
  assert.equal(shopAnchor(t0, []), t0);
  assert.equal(shopAnchor(t0, [t0 + H, t0 + 3 * H]), t0 + 3 * H);
  assert.equal(SHOP_PRICE, 600_000);
  assert.equal(formatWait(H), "4 h 0 min");
  assert.equal(formatWait(61_000), "2 min");
  assert.equal(tillLine(t0, t0 + H / 4), "Next in 3 h 0 min", "nothing ready: countdown");
  assert.equal(tillLine(t0, t0 + 2 * H + 5), `${(2 * SHOP_PAY).toLocaleString("en-US")} waiting · 2/${SHOP_CAP}`);
  assert.equal(tillLine(t0, t0 + 9 * H), `${(SHOP_CAP * SHOP_PAY).toLocaleString("en-US")} waiting · ${SHOP_CAP}/${SHOP_CAP}`, "capped");
  assert.deepEqual(cleanShops({ austin: { at: 5, anchor: 9 }, mars: { at: 5 }, nyc: { at: -1 }, la: { at: 7, anchor: 3 } }), { austin: { at: 5, anchor: 9 }, la: { at: 7, anchor: 7 } });
  for (const c of Object.keys(HOUSE_LOTS) as (keyof typeof HOUSE_LOTS)[]) {
    const d = distM(HOUSE_LOTS[c].lat, HOUSE_LOTS[c].lng, shopLot(c).lat, shopLot(c).lng);
    assert.ok(d > 60 && d < 200, `${c} shop lot ${d} m from the house lot pin (the snapped doors are checked below)`);
  }
});

test("buy: needs 600k, one per city, a second buy is a free replay; shops sync with their clock", async () => {
  const sql = await db();
  await syncPlayer(sql, "shp", snap, "shpphone1");
  const wid = (await canonicalWallet(sql, "shp")).id;
  await sql`update player_wallets set coins = ${SHOP_PRICE - 1} where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "shp", { kind: "shop", city: "austin" })).reason, "short-coins");
  assert.deepEqual(await shopsOf(sql, "shp"), {});
  await sql`update player_wallets set coins = ${SHOP_PRICE * 2 + 5} where user_id = ${wid}`;
  const before = Date.now();
  const r = await applyClientOp(sql, "shp", { kind: "shop", city: "austin" });
  assert.equal(r.ok, true);
  assert.ok(r.shop && r.shop.at >= before && r.shop.at <= Date.now(), "server stamps the buy");
  assert.equal((await canonicalWallet(sql, "shp")).wallet.coins, SHOP_PRICE + 5);
  const again = await applyClientOp(sql, "shp", { kind: "shop", city: "austin" });
  assert.equal(again.ok, true);
  assert.equal(again.replay, true);
  assert.equal((await canonicalWallet(sql, "shp")).wallet.coins, SHOP_PRICE + 5, "no double charge");
  assert.equal((await applyClientOp(sql, "shp", { kind: "shop", city: "nyc" })).ok, true, "another city is its own shop");
  assert.equal((await canonicalWallet(sql, "shp")).wallet.coins, 5);
  assert.equal((await applyClientOp(sql, "shp", { kind: "shop", city: "atlantis" as never })).reason, "unknown");
  const s = await syncPlayer(sql, "shp", snap, "shpphone1");
  assert.deepEqual(Object.keys(s.owned?.shops ?? {}).sort(), ["austin", "nyc"]);
});

test("collect: server clock, idempotent, capped at 3 payouts, nothing without a shop", async () => {
  const sql = await db();
  await syncPlayer(sql, "col", snap, "colphone1");
  const wid = (await canonicalWallet(sql, "col")).id;
  assert.equal((await applyClientOp(sql, "col", { kind: "shopCollect", city: "austin" })).reason, "no-shop");
  await sql`update player_wallets set coins = ${SHOP_PRICE} where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "col", { kind: "shop", city: "austin" })).ok, true);
  const coins = async () => (await canonicalWallet(sql, "col")).wallet.coins;
  const early = await applyClientOp(sql, "col", { kind: "shopCollect", city: "austin" });
  assert.equal(early.shop?.coin, 0, "nothing made yet");
  assert.equal(await coins(), 0);
  // The only clock is the ledger row the server wrote: move the buy back 9 h (2 payouts and a quarter).
  const back = (ms: number) => sql`update wallet_ledger set detail = ${JSON.stringify({ city: "austin", at: Date.now() - ms })} where user_id = ${wid} and op_key = ${"shop:austin"}`;
  await back(2.25 * H);
  const a = await applyClientOp(sql, "col", { kind: "shopCollect", city: "austin" });
  assert.equal(a.shop?.n, 2);
  assert.equal(a.shop?.coin, 2 * SHOP_PAY);
  assert.equal(await coins(), 2 * SHOP_PAY);
  const twice = await applyClientOp(sql, "col", { kind: "shopCollect", city: "austin" });
  assert.equal(twice.shop?.coin, 0, "a second tap pays nothing");
  assert.equal(await coins(), 2 * SHOP_PAY);
  const st = (await shopsOf(sql, "col")).austin!;
  assert.ok(Date.now() - st.anchor > 0.2 * H && Date.now() - st.anchor < 0.3 * H, "the quarter payout carries over");
  // A long absence: the till holds 3 payouts, no more.
  await sql`delete from wallet_ledger where user_id = ${wid} and op_key like ${"shopc:%"}`;
  await back(30 * H);
  const full = await applyClientOp(sql, "col", { kind: "shopCollect", city: "austin" });
  assert.equal(full.shop?.n, SHOP_CAP);
  assert.equal(full.shop?.coin, SHOP_CAP * SHOP_PAY);
  assert.equal(await coins(), (2 + SHOP_CAP) * SHOP_PAY);
  assert.equal((await applyClientOp(sql, "col", { kind: "shopCollect", city: "austin" })).shop?.coin, 0, "full till restarts at the collect");
});

test("client sends no clock: the shop ops carry only the city", () => {
  const api = readFileSync(new URL("./walletApi.ts", import.meta.url), "utf8");
  assert.match(api, /z\.object\(\{ kind: z\.literal\("shop"\), city: City \}\)/);
  assert.match(api, /z\.object\(\{ kind: z\.literal\("shopCollect"\), city: City \}\)/);
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
  assert.match(pkg, /src\/game\/shop\.test\.ts/);
});

test("0.1.60: every shop lot snaps onto its city's baked walk graph and connects to the house lot", () => {
  const dir = new URL("../../public/streets/v2/", import.meta.url);
  const files = readdirSync(dir);
  for (const c of Object.keys(HOUSE_LOTS) as (keyof typeof HOUSE_LOTS)[]) {
    const f = files.find((x) => x.startsWith(`${c}.`) && x.endsWith(".json.gz"));
    assert.ok(f, `${c} baked streets`);
    const baked = JSON.parse(gunzipSync(readFileSync(new URL(f!, dir))).toString("utf8")) as BakedCity;
    const lot = shopLot(c);
    const g = ingestBaked(createGraph(lot.lat, lot.lng), baked);
    const snap = nearest(g, lot.lat, lot.lng, 80);
    assert.ok(snap && snap.dist <= 6, `${c} shop lot ${snap?.dist} m off the walk`);
    const home = nearest(g, HOUSE_LOTS[c].lat, HOUSE_LOTS[c].lng, 80);
    assert.ok(home, `${c} house lot on the walk`);
    assert.ok(routeOnGraph(g, { lat: home!.lat, lng: home!.lng }, { lat: snap!.lat, lng: snap!.lng }), `${c} house → shop walkable`);
    assert.ok(distM(home!.lat, home!.lng, snap!.lat, snap!.lng) > SHOP_REACH_M * 2, `${c} house and shop buttons never overlap`);
  }
});

test("0.1.60 copy: Travel at the station, owner footer on the shop sheet, Shop label on collects", async () => {
  const hud = readFileSync(new URL("../components/keyline/Hud.tsx", import.meta.url), "utf8");
  const map = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(hud + map, /Board train|Board the train/);
  assert.match(hud, /cue = `Travel · T · /);
  assert.doesNotMatch(hud, /T to board/);
  const sheet = readFileSync(new URL("../components/keyline/LanternSheet.tsx", import.meta.url), "utf8");
  const foot = sheet.slice(sheet.indexOf('data-testid="shop-foot"'));
  assert.match(foot, /\{shop\s*\?\s*"Yours for good\./, "owners don't see Sign in to buy");
  const { rewardOfRow, SOURCE_LABEL } = await import("./recentRewards.ts");
  const r = rewardOfRow("shopc:austin:123", JSON.stringify({ coins: 2000 }), 1, () => undefined);
  assert.equal(r?.src, "shop");
  assert.equal(SOURCE_LABEL.shop, "Shop");
});
