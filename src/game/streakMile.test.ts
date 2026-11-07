// 0.1.133 answer-streak milestones. Clocks match the other wallet tests so a sync does not mint a welcome pack.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { thanksClock } from "./thanksGift.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { titleName, titleRows, type TitleStats } from "./levels.ts";
import { levelLook, setLevelLook } from "./levelsServer.ts";
import { marketAt } from "./nightMarket.ts";
import { lightOf } from "./marketLights.ts";
import { TIER_VALUE } from "./rewards.ts";
import { streakRun } from "./scoutPerks.ts";
import {
  BASE_ACCEL,
  FAST_ACCEL,
  TURBO_PACE,
  driveAccel,
  drivePace,
  mileCrossLabels,
  perksAt,
  streakMarketCoin,
  streakWalk,
} from "./streakMile.ts";
import { cleanMeta, emptyWallet, gradeGrant, mergeFirstSync, streetOp, type GradePay, type LocalSnap } from "./wallet.ts";
import { awardGrade, rememberStreak, syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";

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
  await pg.exec(`create view plate_events_by_player as select * from plate_events`);
  await pg.exec(`create table "user" (id text primary key, name text)`);
  return sqlOf(pg);
}

const snap = (over: Partial<LocalSnap> = {}): LocalSnap => ({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false }, ...over });

function pay(over: Partial<GradePay> = {}): GradePay {
  return {
    correct: true,
    elapsedMs: 3000,
    mult: 1,
    city: "austin",
    diff: 2,
    clearTier: "blue",
    poiTier: "blue",
    poiId: "ut-tower",
    lat: 30.28,
    lng: -97.74,
    streak: 0,
    loot: 1,
    lucky: false,
    cloth: null,
    charmDay: "",
    charmTopics: [],
    topic: null,
    dealtAt: Date.UTC(2026, 9, 16, 18),
    luckyHit: false,
    perfectBlue: false,
    ...over,
  };
}

const stats = (over: Partial<TitleStats> = {}): TitleStats => ({
  byCat: {},
  marketLamps: 0,
  bestStreak: 0,
  perfects: 0,
  violet: 0,
  cityCorrect: {},
  ...over,
});

test("thresholds: 19 stays quiet, 20 turns turbo on, and the rest stack only at their own marks", () => {
  assert.equal(perksAt(19).turbo, false);
  assert.equal(perksAt(20).turbo, true);
  assert.equal(perksAt(20).trail, false);
  assert.equal(perksAt(29).trail, false);
  assert.equal(perksAt(30).trail, true);
  assert.equal(perksAt(30).market, false);
  assert.equal(perksAt(39).market, false);
  assert.equal(perksAt(40).market, true);
  assert.equal(perksAt(49).pixel, false);
  assert.equal(perksAt(49).fastAccel, false);
  assert.equal(perksAt(50).pixel, true);
  assert.equal(perksAt(50).fastAccel, true);
  assert.equal(perksAt(74).triple, false);
  assert.equal(perksAt(75).triple, true);
  assert.deepEqual(perksAt(75), { turbo: true, trail: true, market: true, pixel: true, fastAccel: true, triple: true });
  assert.deepEqual(mileCrossLabels(19, 20), ["Streak 20 · Turbo"]);
  assert.deepEqual(mileCrossLabels(20, 21), []);
  assert.deepEqual(mileCrossLabels(74, 75), ["Streak 75 · Triple vault coin"]);
});

test("car effects are seated driving only, and the numbers stay modest", () => {
  assert.equal(drivePace(50, true, true), TURBO_PACE);
  assert.equal(TURBO_PACE, 1.12);
  assert.equal(drivePace(50, true, false), 1, "parked");
  assert.equal(drivePace(50, false, true), 1, "on foot");
  assert.equal(drivePace(19, true, true), 1);
  assert.equal(driveAccel(50, true, true), FAST_ACCEL);
  assert.equal(FAST_ACCEL, 7.2);
  assert.equal(driveAccel(50, true, false), BASE_ACCEL);
  assert.equal(driveAccel(0, false, false), BASE_ACCEL);
  assert.equal(BASE_ACCEL, 4.2);
});

test("night-market rung is +0.1 vault coin, capped, and a miss or a short run adds nothing", () => {
  assert.equal(streakMarketCoin(100, lightOf("amber").mult, undefined), 10);
  assert.equal(streakMarketCoin(100, lightOf("rainbow").mult, 2.5), 0, "Rainbow + Owl is already at the cap");
  assert.equal(streakMarketCoin(0, 2, undefined), 0);
  const cycle = 15 * 60_000;
  const openAt = Math.floor(Date.now() / cycle) * cycle + 5 * 60_000;
  const m = marketAt("austin", openAt);
  assert.ok(m);
  const line = m.street.lines[0]!;
  const on = { dealtAt: openAt, poiId: "", lat: line[0]!, lng: line[1]! };
  const low = gradeGrant(emptyWallet(), pay({ ...on, serverRun: 39 }));
  const high = gradeGrant(emptyWallet(), pay({ ...on, serverRun: 40 }));
  assert.ok(low.award && high.award);
  const bare = gradeGrant(emptyWallet(), pay({ dealtAt: openAt, lat: 0, lng: 0, serverRun: 39 }));
  assert.ok(bare.award);
  assert.ok(high.award.coins > low.award.coins);
  assert.equal(high.award.coins - low.award.coins, streakMarketCoin(bare.award.coins, lightOf("amber").mult, undefined));
  const offLow = gradeGrant(emptyWallet(), pay({ ...on, lat: 0, lng: 0, serverRun: 39 }));
  const offHigh = gradeGrant(emptyWallet(), pay({ ...on, lat: 0, lng: 0, serverRun: 40 }));
  assert.equal(offHigh.award?.coins, offLow.award?.coins, "off the market the rung is zero");
  const cappedLow = gradeGrant(emptyWallet(), pay({ ...on, serverRun: 39, scout: "owl", light: "rainbow" }));
  const cappedHigh = gradeGrant(emptyWallet(), pay({ ...on, serverRun: 40, scout: "owl", light: "rainbow" }));
  assert.equal(cappedHigh.award?.coins, cappedLow.award?.coins, "already at ×3");
});

test("triple coin is vault answers only: not a spark, a miss, a cloth tip, or a street key", () => {
  const lo = gradeGrant(emptyWallet(), pay({ serverRun: 74 }));
  const hi = gradeGrant(emptyWallet(), pay({ serverRun: 75 }));
  assert.ok(lo.award && hi.award);
  assert.equal(hi.award.coins, lo.award.coins * 3);
  assert.deepEqual(hi.award.keys, lo.award.keys, "keys are not tripled");
  assert.ok(hi.award.boosts.includes("Streak ×3 vault coin"));
  const tip = (run: number) => gradeGrant(emptyWallet(), pay({ serverRun: run, cloth: "road-dust" })).award!.coins;
  assert.equal(tip(74) - lo.award.coins, tip(75) - hi.award.coins, "the cloth tip is the same 20");
  assert.equal(tip(74) - lo.award.coins, 20);
  const spark = (run: number) => gradeGrant(emptyWallet(), pay({ serverRun: run, clearTier: null }));
  assert.equal(spark(80).award?.coins, spark(0).award?.coins);
  assert.deepEqual(spark(80).award?.keys, spark(0).award?.keys);
  assert.equal(gradeGrant(emptyWallet(), pay({ correct: false, serverRun: 80 })).award?.coins, 0);
  const pocket = emptyWallet();
  pocket.cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false };
  const street = streetOp(pocket, "austin", "white", false);
  assert.equal(street.ok && street.wallet.keys.white, 1);
  assert.equal(street.ok && street.wallet.coins, 0);
});

test("the walk matches the old streakRun, including a forgiven miss, and a reset starts a new anchor", () => {
  const rows = [
    { miss: false, day: "2026-11-07", key: "grade:c" },
    { miss: true, day: "2026-11-07", key: "grade:b" },
    { miss: false, day: "2026-11-07", key: "grade:a" },
  ];
  assert.equal(streakWalk(rows, true).run, streakRun(rows, true));
  assert.equal(streakWalk(rows, true).run, 2);
  assert.equal(streakWalk(rows, true).anchor, "grade:a");
  assert.equal(streakWalk(rows, false).run, 1);
  assert.equal(streakWalk([{ miss: true, day: "2026-11-07", key: "grade:m" }], false).run, 0);
  assert.equal(streakWalk([{ miss: true, day: "2026-11-07", key: "grade:m" }], false).anchor, "");
});

test("Streak Lord is earned from a 250 best or the permanent flag, and stays when the best is lower", () => {
  const cities = ["austin"] as const;
  assert.equal(titleRows(stats({ bestStreak: 249 }), cities).find((r) => r.id === "streak-lord")!.earned, false);
  assert.equal(titleRows(stats({ bestStreak: 250 }), cities).find((r) => r.id === "streak-lord")!.earned, true);
  const kept = titleRows(stats({ bestStreak: 10, streakLord: true }), cities).find((r) => r.id === "streak-lord")!;
  assert.equal(kept.earned, true);
  assert.equal(kept.have, 250);
  assert.equal(titleName("streak-lord"), "Streak Lord");
});

test("old meta and a device snap cannot mint a streak", () => {
  assert.equal(cleanMeta({}).streakRun, 0);
  assert.equal(cleanMeta({}).streakLord, false);
  assert.equal(cleanMeta({ streakLord: true, streakRun: 40, streakAnchor: "grade:a" }).streakLord, true);
  assert.equal(cleanMeta({ streakLord: "yes", streakRun: 99_999 }).streakLord, false);
  assert.equal(cleanMeta({ streakRun: 99_999 }).streakRun, 10_000);
  const merged = mergeFirstSync(emptyWallet(), { ...snap(), streakRun: 100, streakLord: true } as LocalSnap);
  assert.equal(merged.meta.streakRun, 0);
  assert.equal(merged.meta.streakLord, false);
});

async function seedGrades(sql: Sql, userId: string, n: number, prefix: string, newestAgoSec: number) {
  const { id } = await canonicalWallet(sql, userId);
  for (let i = 0; i < n; i++) {
    const ago = newestAgoSec + (n - 1 - i);
    await sql.query(
      `insert into wallet_ledger (user_id, op_key, detail, created_at) values ($1, $2, $3, now() - ($4 || ' seconds')::interval)`,
      [id, `grade:${prefix}${String(i).padStart(3, "0")}`, JSON.stringify({ g: "perfect", coins: 0, keys: {}, boosts: [] }), String(ago)],
    );
  }
}

test("server run: 19 then 20, a miss resets, a replay does not pay again, and a forged serverRun is ignored", async () => {
  const sql = await db();
  await syncPlayer(sql, "run", snap(), "runphone1");
  let last;
  for (let i = 1; i <= 19; i++) last = await awardGrade(sql, "run", `r${i}`, { ...pay(), prevNonce: "" });
  assert.equal(last!.wallet.meta.streakRun, 19);
  assert.ok(!last!.award?.boosts.includes("Streak 20 · Turbo"));
  const twentieth = await awardGrade(sql, "run", "r20", { ...pay(), prevNonce: "" });
  assert.equal(twentieth.wallet.meta.streakRun, 20);
  assert.ok(twentieth.award?.boosts.includes("Streak 20 · Turbo"));
  const replay = await awardGrade(sql, "run", "r20", { ...pay(), prevNonce: "" });
  assert.equal(replay.replay, true);
  assert.equal(replay.wallet.coins, twentieth.wallet.coins);
  assert.equal(replay.wallet.meta.streakRun, 20);
  const miss = await awardGrade(sql, "run", "rmiss", { ...pay({ correct: false }), prevNonce: "" });
  assert.equal(miss.wallet.meta.streakRun, 0);
  assert.equal(miss.wallet.meta.streakAnchor, "");
  const again = await awardGrade(sql, "run", "r21", { ...pay(), prevNonce: "" });
  assert.equal(again.wallet.meta.streakRun, 1);
  assert.ok(!again.award?.boosts.includes("Streak 20 · Turbo"));

  await syncPlayer(sql, "forge", snap(), "forgephone1");
  await syncPlayer(sql, "plain", snap(), "plainphone1");
  const forged = await awardGrade(sql, "forge", "f1", { ...pay(), prevNonce: "", serverRun: 80 });
  const plain = await awardGrade(sql, "plain", "p1", { ...pay(), prevNonce: "" });
  assert.equal(forged.wallet.meta.streakRun, 1);
  assert.equal(forged.wallet.coins, plain.wallet.coins);
  assert.equal(forged.wallet.keys.violet, 0);
  assert.ok(!forged.award?.boosts.some((b) => b.includes("×3")));
});

test("violet is once per run, a replay and the next answer do not mint another, a new run can, and a full pocket pays coin", async () => {
  const sql = await db();
  await syncPlayer(sql, "vio", snap(), "viophone1");
  await seedGrades(sql, "vio", 99, "a", 500);
  const cross = await awardGrade(sql, "vio", "cross", { ...pay(), prevNonce: "" });
  assert.equal(cross.wallet.keys.violet, 1);
  assert.ok(cross.award?.boosts.includes("Streak 100 · Violet key"));
  const again = await awardGrade(sql, "vio", "cross", { ...pay(), prevNonce: "" });
  assert.equal(again.replay, true);
  assert.equal(again.wallet.keys.violet, 1);
  const next = await awardGrade(sql, "vio", "after", { ...pay(), prevNonce: "" });
  assert.equal(next.wallet.keys.violet, 1, "101 does not pay a second violet");
  const smiles = await sql<{ op_key: string }>`select op_key from wallet_ledger where op_key like ${"smile:100:%"}`;
  assert.equal(smiles.length, 1);

  const { id } = await canonicalWallet(sql, "vio");
  await sql.query(`update wallet_ledger set created_at = now() - interval '300 seconds' where user_id = $1 and op_key = $2`, [id, "grade:cross"]);
  await sql.query(`update wallet_ledger set created_at = now() - interval '280 seconds' where user_id = $1 and op_key = $2`, [id, "grade:after"]);
  const miss = await awardGrade(sql, "vio", "break", { ...pay({ correct: false }), prevNonce: "" });
  assert.equal(miss.wallet.meta.streakRun, 0);
  await sql.query(`update wallet_ledger set created_at = now() - interval '200 seconds' where user_id = $1 and op_key = $2`, [id, "grade:break"]);
  await seedGrades(sql, "vio", 99, "b", 20);
  const second = await awardGrade(sql, "vio", "cross2", { ...pay(), prevNonce: "" });
  assert.equal(second.wallet.keys.violet, 2, "a new run pays one violet again");
  const smiles2 = await sql<{ op_key: string }>`select op_key from wallet_ledger where op_key like ${"smile:100:%"}`;
  assert.equal(smiles2.length, 2);
  const secondReplay = await awardGrade(sql, "vio", "cross2", { ...pay(), prevNonce: "" });
  assert.equal(secondReplay.wallet.keys.violet, 2);

  await syncPlayer(sql, "full", snap(), "fullphone1");
  await syncPlayer(sql, "open", snap(), "openphone1");
  await seedGrades(sql, "full", 99, "f", 500);
  await seedGrades(sql, "open", 99, "o", 500);
  await sql.query(`update player_wallets set violet = 30 where user_id = $1`, ["full"]);
  const beforeFull = (await canonicalWallet(sql, "full")).wallet.coins;
  const beforeOpen = (await canonicalWallet(sql, "open")).wallet.coins;
  const full = await awardGrade(sql, "full", "fullcross", { ...pay(), prevNonce: "" });
  const open = await awardGrade(sql, "open", "opencross", { ...pay(), prevNonce: "" });
  assert.equal(full.wallet.keys.violet, 30);
  assert.equal(open.wallet.keys.violet, 1);
  assert.equal(full.wallet.coins - beforeFull - (open.wallet.coins - beforeOpen), TIER_VALUE.violet);
});

test("an old run already past 100 is not paid backward, and a reload recount keeps the run without minting", async () => {
  const sql = await db();
  await syncPlayer(sql, "old", snap(), "oldphone1");
  await seedGrades(sql, "old", 100, "h", 30);
  assert.equal((await canonicalWallet(sql, "old")).wallet.meta.streakRun, 0, "untouched meta");
  const recounted = await rememberStreak(sql, "old");
  assert.equal(recounted.run, 100);
  assert.equal((await canonicalWallet(sql, "old")).wallet.keys.violet, 0, "recount does not mint");
  const step = await awardGrade(sql, "old", "old1", { ...pay(), prevNonce: "" });
  assert.equal(step.wallet.meta.streakRun, 101);
  assert.equal(step.wallet.keys.violet, 0);
  assert.ok(!step.award?.boosts.includes("Streak 100 · Violet key"));
  const synced = await syncPlayer(sql, "old", snap(), "oldphone1");
  assert.equal(synced.view.streakRun, 101);
  assert.equal(synced.wallet.keys.violet, 0);
});

test("Tabby shield survives a reload recount, and a miss without the shield clears the run", async () => {
  const sql = await db();
  await syncPlayer(sql, "tab", snap(), "tabphone1");
  for (let i = 0; i < 4; i++) await awardGrade(sql, "tab", `t${i}`, { ...pay({ scout: "cat" }), prevNonce: "" });
  const miss = await awardGrade(sql, "tab", "tmiss", { ...pay({ correct: false, scout: "cat" }), prevNonce: "" });
  assert.equal(miss.wallet.meta.streakRun, 4);
  assert.equal(miss.wallet.meta.streakShield, true);
  const kept = await rememberStreak(sql, "tab");
  assert.equal(kept.run, 4);

  await syncPlayer(sql, "rac", snap(), "racphone1");
  for (let i = 0; i < 4; i++) await awardGrade(sql, "rac", `r${i}`, { ...pay({ scout: "raccoon" }), prevNonce: "" });
  const broke = await awardGrade(sql, "rac", "rmiss", { ...pay({ correct: false, scout: "raccoon" }), prevNonce: "" });
  assert.equal(broke.wallet.meta.streakRun, 0);
  assert.equal((await rememberStreak(sql, "rac")).run, 0);
});

test("two answers crossing 100 at once pay exactly one violet key", async () => {
  const sql = await db();
  await syncPlayer(sql, "race", snap(), "racephone1");
  await seedGrades(sql, "race", 99, "z", 400);
  const [a, b] = await Promise.all([
    awardGrade(sql, "race", "raceA", { ...pay(), prevNonce: "" }),
    awardGrade(sql, "race", "raceB", { ...pay(), prevNonce: "" }),
  ]);
  assert.equal(a.ok && b.ok, true);
  const wallet = (await canonicalWallet(sql, "race")).wallet;
  assert.equal(wallet.keys.violet, 1, "exactly one violet");
  const smiles = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${(await canonicalWallet(sql, "race")).id} and op_key like ${"smile:100:%"}`;
  assert.equal(smiles.length, 1);
  const grades = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${(await canonicalWallet(sql, "race")).id} and op_key like ${"grade:race%"}`;
  assert.equal(grades.length, 2, "both answers landed");
  const again = await Promise.all([
    awardGrade(sql, "race", "raceA", { ...pay(), prevNonce: "" }),
    awardGrade(sql, "race", "raceB", { ...pay(), prevNonce: "" }),
  ]);
  assert.equal(again[0].replay && again[1].replay, true);
  assert.equal((await canonicalWallet(sql, "race")).wallet.keys.violet, 1);
});

test("Streak Lord equips from the existing picker and stays after the run is reset", async () => {
  const sql = await db();
  await syncPlayer(sql, "lord", snap(), "lordphone1");
  assert.equal((await setLevelLook(sql, "lord", { title: "streak-lord" }, () => null)).ok, false);
  const { id } = await canonicalWallet(sql, "lord");
  await sql.query(`update player_wallets set meta = meta || '{"streakLord":true,"streakRun":0}'::jsonb where user_id = $1`, [id]);
  assert.equal((await setLevelLook(sql, "lord", { title: "streak-lord" }, () => null)).ok, true);
  const view = await levelLook(sql, "lord", () => null);
  assert.equal(view.title, "streak-lord");
  assert.equal(view.titleName, "Streak Lord");
  assert.equal(view.rows.find((r) => r.id === "streak-lord")!.earned, true);
  await sql.query(`update player_wallets set meta = meta || '{"streakRun":0}'::jsonb where user_id = $1`, [id]);
  const after = await levelLook(sql, "lord", () => null);
  assert.equal(after.titleName, "Streak Lord");
  assert.equal(after.rows.find((r) => r.id === "streak-lord")!.earned, true);
});
