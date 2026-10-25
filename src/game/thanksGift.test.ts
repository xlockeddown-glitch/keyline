import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { LocalSnap } from "./wallet.ts";
import { COIN_CAP } from "./wallet.ts";
import { canonicalWallet } from "./walletSql.ts";
import { carsOf, grantThanksGift, housesOf, syncPlayer } from "./walletApply.ts";
import { THANKS_GIFT_CUTOFF, thanksClock, thanksCity, thanksNote } from "./thanksGift.ts";
import type { CityId } from "./types.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  await pg.exec(readFileSync(new URL("../../migrations/0016_player_wallet.sql", import.meta.url), "utf8"));
  return sqlOf(pg);
}

const start = (city: CityId) => ({ ...freshUnlocks(), start: city, unlocked: [city], freePick: false });
const snap = (city: CityId): LocalSnap => ({ coins: 0, keys: {}, cities: start(city) });

/** An account that played before the cutoff: one sync, then its rows are backdated a day. */
async function veteran(sql: Sql, id: string, city: CityId = "austin") {
  thanksClock.cutoff = "2000-01-01T00:00:00Z";
  await syncPlayer(sql, id, snap(city), `${id}-phone1`);
  await sql.query(`update wallet_ledger set created_at = now() - interval '1 day' where user_id = $1`, [id]);
  thanksClock.cutoff = new Date(Date.now() - 3600_000).toISOString();
}
const own = (sql: Sql, id: string, key: string) => sql.query(`insert into wallet_ledger (user_id, op_key, created_at) values ($1, $2, now() - interval '2 day')`, [id, key]);
const coins = async (sql: Sql, id: string) => (await canonicalWallet(sql, id)).wallet.coins;

test("cutoff constant is just after the 0.1.39 release", () => {
  assert.equal(THANKS_GIFT_CUTOFF, "2026-10-25T06:00:00Z");
});

test("owns neither: free F-150 and Ivy Townhouse in the starting city, note once", async () => {
  const sql = await db();
  await veteran(sql, "p1", "detroit");
  const c0 = await coins(sql, "p1");
  const r = await syncPlayer(sql, "p1", snap("detroit"), "p1-phone1");
  assert.deepEqual(r.giftNotes, ["Thanks for playing Keyline! Here's a Ford F-150 and an Ivy Townhouse in Detroit, on us. — Ryan & Grok"]);
  assert.ok(r.owned!.cars!.includes("f150"));
  assert.equal(r.owned!.houses!.detroit?.tier, "town");
  assert.equal(await coins(sql, "p1"), c0);
  const again = await syncPlayer(sql, "p1", snap("detroit"), "p1-phone1");
  assert.equal(again.giftNotes, undefined, "repeat sync pays nothing");
  assert.deepEqual(await grantThanksGift(sql, "p1"), []);
  assert.equal(await coins(sql, "p1"), c0);
});

test("truck only, house only, both", async () => {
  const sql = await db();
  await veteran(sql, "t"); await own(sql, "t", "car:f150");
  let c0 = await coins(sql, "t");
  let n = await grantThanksGift(sql, "t");
  assert.match(n[0]!, /Here's an Ivy Townhouse in Austin, on us\. You already had the F-150, so here's \+50,000 coin instead\./);
  assert.equal(await coins(sql, "t"), c0 + 50_000);
  assert.equal((await housesOf(sql, "t")).austin?.tier, "town");

  await veteran(sql, "h"); await own(sql, "h", "house:austin:town");
  c0 = await coins(sql, "h");
  n = await grantThanksGift(sql, "h");
  assert.match(n[0]!, /Here's a Ford F-150, on us\. You already had an Ivy Townhouse or better in Austin, so here's \+300,000 coin instead\./);
  assert.equal(await coins(sql, "h"), c0 + 300_000);
  assert.ok((await carsOf(sql, "h")).includes("f150"));

  await veteran(sql, "b"); await own(sql, "b", "car:f150"); await own(sql, "b", "house:austin:villa");
  c0 = await coins(sql, "b");
  n = await grantThanksGift(sql, "b");
  assert.doesNotMatch(n[0]!, /Here's/);
  assert.equal(await coins(sql, "b"), c0 + 350_000);
  assert.equal((await housesOf(sql, "b")).austin?.tier, "villa", "villa stays");
});

test("cottage and row upgrade free to the townhouse; another city's house does not count", async () => {
  const sql = await db();
  for (const tier of ["cottage", "row"]) {
    const id = `u-${tier}`;
    await veteran(sql, id); await own(sql, id, `house:austin:${tier}`); await own(sql, id, "house:detroit:villa");
    const c0 = await coins(sql, id);
    const n = await grantThanksGift(sql, id);
    assert.match(n[0]!, /Your house in Austin got a free upgrade to an Ivy Townhouse\./);
    assert.equal((await housesOf(sql, id)).austin?.tier, "town");
    assert.equal(await coins(sql, id), c0);
  }
});

test("linked sign-in pays once", async () => {
  const sql = await db();
  await veteran(sql, "ann");
  await sql`insert into player_links (alias_id, primary_id, how) values ('ann-y', 'ann', 'code')`;
  assert.equal((await grantThanksGift(sql, "ann-y")).length, 1);
  assert.deepEqual(await grantThanksGift(sql, "ann"), []);
  assert.deepEqual(await grantThanksGift(sql, "ann-y"), []);
});

test("accounts after the cutoff and guests (no wallet rows) get nothing", async () => {
  const sql = await db();
  thanksClock.cutoff = new Date(Date.now() - 3600_000).toISOString();
  const r = await syncPlayer(sql, "newbie", snap("austin"), "newbie-phone1");
  assert.equal(r.giftNotes, undefined);
  assert.deepEqual(await grantThanksGift(sql, "newbie"), []);
  assert.ok(!(await carsOf(sql, "newbie")).includes("f150"));
  assert.deepEqual(await grantThanksGift(sql, "never-synced-guest"), []);
});

test("coin over the cap is clamped and the note says so", async () => {
  const sql = await db();
  await veteran(sql, "rich"); await own(sql, "rich", "car:f150"); await own(sql, "rich", "house:austin:town");
  await sql.query(`update player_wallets set coins = $2 where user_id = $1`, ["rich", COIN_CAP - 100_000]);
  const n = await grantThanksGift(sql, "rich");
  assert.equal(await coins(sql, "rich"), COIN_CAP);
  assert.match(n[0]!, /Part of the coins \(250,000\) went over the 5,000,000 limit\./);
});

test("starting city: wallet start, else first unlocked, else the device save", () => {
  assert.equal(thanksCity({ start: "nyc" as CityId, unlocked: ["austin" as CityId] }, null), "nyc");
  assert.equal(thanksCity({ start: null, unlocked: ["austin" as CityId] }, "nyc" as CityId), "austin");
  assert.equal(thanksCity({ start: null, unlocked: [] }, "nyc" as CityId), "nyc");
  assert.match(thanksNote({ car: "given", house: "coin", cityName: null, lost: 0, cap: COIN_CAP }), /Here's a Ford F-150, on us\./);
});
