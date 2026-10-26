import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { COIN_CAP, type GradePay, type LocalSnap } from "./wallet.ts";
import { canonicalWallet } from "./walletSql.ts";
import { catBoost, cotdAt } from "./carPerks.ts";
import { applyClientOp, awardGrade, housesOf, lampGiftsOpen, syncPlayer } from "./walletApply.ts";
import { thanksClock } from "./thanksGift.ts";
import { DOUBLE_MS, WELCOME_COIN, WELCOME_KEY, lampGiftClock, welcomeClock, welcomeNote } from "./lampGift.ts";
import { CITIES } from "./data.ts";
import type { CityId, Tier } from "./types.ts";

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
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(readFileSync(new URL(`../../migrations/${m}`, import.meta.url), "utf8"));
  return sqlOf(pg);
}
const snap = (city: CityId = "detroit"): LocalSnap => ({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: city, unlocked: [city], freePick: false } });
const OFF = "2999-01-01T00:00:00Z";
const grade = (over: Partial<GradePay> = {}) => ({ correct: true, elapsedMs: 3000, mult: 1, city: "austin" as const, diff: 2 as const, clearTier: "blue" as Tier, poiTier: "blue" as Tier, poiId: "ut-tower", lat: 30.28, lng: -97.74, series: null, step: 0, steps: 1, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], topic: null, dealtAt: Date.UTC(2026, 9, 16, 18), luckyHit: false, perfectBlue: false, prevNonce: "", ...over });
const coins = async (sql: Sql, u: string) => (await canonicalWallet(sql, u)).wallet.coins;

/** Make an account whose rows all sit at `at` (gifts off while it is made), then put the cutoffs at `cutoff`. */
async function account(sql: Sql, u: string, at: number, cutoff: string, city: CityId = "detroit") {
  lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
  welcomeClock.cutoff = OFF;
  await syncPlayer(sql, u, snap(city), `${u}-phone1`);
  await sql.query(`update wallet_ledger set created_at = $2 where user_id = $1`, [(await canonicalWallet(sql, u)).id, new Date(at).toISOString()]);
  lampGiftClock.cutoff = cutoff;
  welcomeClock.cutoff = cutoff;
}

test("cutoff: a first row 1 ms before is a current player (four lanterns, no pack); at the cutoff is new (the pack, once)", async () => {
  const sql = await db();
  const cut = Date.now() - 3600_000;
  const iso = new Date(cut).toISOString();
  await account(sql, "cur", cut - 1, iso);
  const c = await syncPlayer(sql, "cur", snap(), "cur-phone1");
  assert.match(c.giftNotes?.[0] ?? "", /Free White, Blue, Green and Amber lanterns/);
  assert.equal(c.giftNotes?.length, 1);
  assert.equal(c.doubleUntil, undefined, "existing players get no double hour");
  assert.equal((await sql`select op_key from wallet_ledger where op_key = ${WELCOME_KEY}`).length, 0);

  await account(sql, "neo", cut, iso, "detroit");
  welcomeClock.now = () => cut + 60_000;
  const before = await coins(sql, "neo");
  const n = await syncPlayer(sql, "neo", snap(), "neo-phone1");
  assert.deepEqual(n.giftNotes, [welcomeNote(CITIES.detroit.name)]);
  assert.match(n.giftNotes![0]!, /Lantern Cottage in Detroit, 15,000 coins, a free White lantern .* and double rewards for your first hour/);
  assert.equal(await coins(sql, "neo"), before + WELCOME_COIN, "coins exact");
  assert.deepEqual(await housesOf(sql, "neo"), { detroit: { tier: "cottage" } }, "house in the start city");
  assert.deepEqual(await lampGiftsOpen(sql, "neo"), ["white"]);
  assert.equal(n.doubleUntil, cut + DOUBLE_MS);
  // Granted once: a later sync (or another device) adds nothing.
  const again = await syncPlayer(sql, "neo", snap(), "neo-phone2");
  assert.equal(again.giftNotes, undefined);
  assert.equal(await coins(sql, "neo"), before + WELCOME_COIN);
  // Free white: claimable, free, and separate from a bought white.
  const w = Object.values(CITIES).flatMap((x) => x.pois).filter((p) => p.tier === "white" && p.kind !== "station");
  assert.equal((await applyClientOp(sql, "neo", { kind: "own", poi: w[0]!.id, free: true })).ok, true);
  assert.equal(await coins(sql, "neo"), before + WELCOME_COIN);
  assert.equal((await applyClientOp(sql, "neo", { kind: "own", poi: w[1]!.id, free: true })).reason, "owned");
  assert.equal((await applyClientOp(sql, "neo", { kind: "own", poi: lampsOf("blue")[0]!.id, free: true })).reason, "no-gift");
  welcomeClock.now = () => Date.now();
});

const lampsOf = (t: Tier) => Object.values(CITIES).flatMap((x) => x.pois).filter((p) => p.tier === t && p.kind !== "station");

test("double coin: inside the first hour a lamp pays 2x (recorded x2), after it 1x; a replay never doubles; clamps at COIN_CAP", async () => {
  const sql = await db();
  const cut = Date.now() - 3 * 3600_000;
  const iso = new Date(cut).toISOString();
  const start = cut + 1000;
  for (const u of ["in", "out", "cap"]) {
    await account(sql, u, start, iso, "austin");
    welcomeClock.now = () => start + 10 * 60_000;
    await syncPlayer(sql, u, snap("austin"), `${u}-phone1`);
  }
  // In the hour.
  const a0 = await coins(sql, "in");
  await awardGrade(sql, "in", "g-in", grade());
  const gainIn = (await coins(sql, "in")) - a0;
  const row = await sql<{ detail: string }>`select detail from wallet_ledger where op_key = ${"grade:g-in"}`;
  assert.equal(JSON.parse(row[0]!.detail).x2, 2, "the row shows the multiplier");
  // Replay: no second pay, no second double.
  await awardGrade(sql, "in", "g-in", grade());
  assert.equal((await coins(sql, "in")) - a0, gainIn);
  // After the hour.
  welcomeClock.now = () => start + DOUBLE_MS + 1;
  const b0 = await coins(sql, "out");
  await awardGrade(sql, "out", "g-out", grade());
  const gainOut = (await coins(sql, "out")) - b0;
  assert.ok(gainOut > 0);
  assert.equal(gainIn, 2 * gainOut, "exactly double inside the hour");
  assert.equal(JSON.parse((await sql<{ detail: string }>`select detail from wallet_ledger where op_key = ${"grade:g-out"}`)[0]!.detail).x2, undefined);
  // Cap.
  welcomeClock.now = () => start + 5 * 60_000;
  const cid = (await canonicalWallet(sql, "cap")).id;
  await sql`update player_wallets set coins = ${COIN_CAP - 5} where user_id = ${cid}`;
  await awardGrade(sql, "cap", "g-cap", grade());
  assert.equal(await coins(sql, "cap"), COIN_CAP);
  // Purchases and gifts aren't doubled: a lantern buy spends exactly its price.
  welcomeClock.now = () => Date.now();
});

test("0.1.45 stacking: a category-of-the-day lamp in the first hour pays the boost and then the double", async () => {
  const sql = await db();
  const cut = Date.now() - 3 * 3600_000;
  const iso = new Date(cut).toISOString();
  const start = cut + 1000;
  for (const u of ["plain", "boost"]) {
    await account(sql, u, start, iso, "austin");
    welcomeClock.now = () => start + 10 * 60_000;
    await syncPlayer(sql, u, snap("austin"), `${u}-phone1`);
  }
  const at = Date.UTC(2026, 9, 16, 18);
  const day = cotdAt(at);
  const plain = day === "music" ? "arts" : "music";
  welcomeClock.now = () => start + 10 * 60_000;
  const p0 = await coins(sql, "plain");
  await awardGrade(sql, "plain", "s-plain", grade({ topic: plain, dealtAt: at }));
  const b0 = await coins(sql, "boost");
  await awardGrade(sql, "boost", "s-boost", grade({ topic: day, favs: [day], dealtAt: at }));
  const gp = (await coins(sql, "plain")) - p0;
  const gb = (await coins(sql, "boost")) - b0;
  assert.equal(catBoost(day, [day], at).x, 1.4);
  assert.ok(Math.abs(gb / gp - 1.4) < 0.02, `${gb}/${gp}: both doubled, the boosted one 1.4x on top`);
  assert.equal(gb % 2, 0, "doubled after the boost");
  welcomeClock.now = () => Date.now();
});
