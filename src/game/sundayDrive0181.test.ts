// 0.1.181 Sunday Drive (CARD-183): every whole 1,000 m moved on the streets pays 25 coin, 8 pays an America/Chicago
// day. The device only claims "I moved X m in mode M"; the clock, the meter, the day and the pay count are the
// server's (migration 0019 sunday_drive + `sd:<day>:<k>` ledger rows). Nothing here touches the network.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { COIN_CAP, type LocalSnap } from "./wallet.ts";
import { applyClientOp, sundayOf, sundayPing, syncPlayer, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { cabSpeed } from "./data.ts";
import { DAILY_JITTER_MS, dailyTopSpeed } from "./dailyRun.ts";
import { TURBO_PACE } from "./streakMile.ts";
import { chicagoDay } from "./questPeriods.ts";
import {
  SUNDAY_COIN, SUNDAY_DAY_CAP, SUNDAY_KM_M, SUNDAY_MIN_FOOT_MPS, SUNDAY_MIN_LEG_M, SUNDAY_OPEN_MS, SUNDAY_PING_MAX_M, SUNDAY_SLACK,
  sundayCeiling, sundayCrossed, sundayKey, sundayLeg, sundayLine, sundayStep, sundayText, sundayToday, type SundayMeter, type SundayMode,
} from "./sundayDrive.ts";
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
const SD_MIG = "0019_sunday_drive.sql";
const opened: PGlite[] = [];
afterEach(async () => {
  for (const pg of opened.splice(0)) await pg.close();
});
async function db(migs: string[] = [SD_MIG]) {
  const pg = new PGlite();
  opened.push(pg);
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", ...migs]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const coinsOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet.coins;
const sdRows = async (sql: Sql, user: string) =>
  (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${(await canonicalWallet(sql, user)).id} and op_key like ${"sd:%"} order by op_key`).map((r) => r.op_key);
const meterOf = async (sql: Sql, user: string) => (await sql<{ day: string; meters: number }>`select day, meters from sunday_drive where user_id = ${user}`)[0] ?? null;

// 2025-11-25/26 is Central Standard Time (UTC-6): midnight CT on the 26th is 06:00Z. Past days on purpose (a pinned
// clock ahead of the real one leaves the database driver waiting on a timer after the tests).
const ct = (day: number, h: number, m = 0, s = 0) => Date.UTC(2025, 10, day, h + 6, m, s);
const NOON = ct(25, 12);
const DAY = "2025-11-25";
beforeEach(() => mock.timers.enable({ apis: ["Date"], now: NOON }));
afterEach(() => mock.timers.reset());

const FOOT = dailyTopSpeed();
/** An honest walker: `m` metres every `gapS` seconds. Returns the last reply. */
async function walk(sql: Sql, who: string, start: number, pings: number, m = 500, gapS = 8, mode: SundayMode = "walk") {
  let last = await sundayPing(sql, who, { mode, meters: m }, start);
  for (let i = 1; i < pings; i++) last = await sundayPing(sql, who, { mode, meters: m }, start + i * gapS * 1000);
  return last;
}

test("rules: 1,000 m a pay, 25 coin, 8 a day; the ceilings; the HUD text and its day guard", () => {
  assert.deepEqual([SUNDAY_KM_M, SUNDAY_COIN, SUNDAY_DAY_CAP, SUNDAY_MIN_LEG_M, SUNDAY_MIN_FOOT_MPS], [1000, 25, 8, 10, 0.5]);
  assert.equal(SUNDAY_COIN * SUNDAY_DAY_CAP, 200);
  assert.equal(sundayCeiling("walk"), dailyTopSpeed());
  // Seated: the arterial cab speed, the best car the account owns (never under the city cab's 1.00), and turbo.
  assert.equal(sundayCeiling("drive", []), cabSpeed(true) * TURBO_PACE);
  assert.equal(sundayCeiling("drive", ["civic", "roadster2"]), cabSpeed(true) * 1.3 * TURBO_PACE);
  assert.equal(sundayCeiling("drive", ["not-a-car"]), cabSpeed(true) * TURBO_PACE);
  assert.ok(sundayCeiling("drive") > sundayCeiling("walk"));
  assert.equal(sundayKey(DAY, 3), "sd:2025-11-25:3");
  assert.equal(sundayText(0), "Sunday Drive 0/8 km");
  assert.equal(sundayText(3), "Sunday Drive 3/8 km");
  assert.equal(sundayText(99), "Sunday Drive 8/8 km");
  assert.equal(sundayText(-2), "Sunday Drive 0/8 km");
  assert.equal(sundayLine(25), "Sunday Drive +25 coin");
  // Day rollover guard: yesterday's count reads 0 until the server sends the new day's.
  assert.equal(sundayToday({ paid: 5, day: DAY }, ct(25, 23, 59)), 5);
  assert.equal(sundayToday({ paid: 5, day: DAY }, ct(26, 0, 0, 5)), 0);
  assert.equal(sundayToday(null, NOON), 0);
  // Whole km only, in order, never past the cap.
  assert.deepEqual(sundayCrossed(0, 999), []);
  assert.deepEqual(sundayCrossed(999, 1000), [1]);
  assert.deepEqual(sundayCrossed(900, 3100), [1, 2, 3]);
  assert.deepEqual(sundayCrossed(7900, 12_000), [8]);
  assert.deepEqual(sundayCrossed(8000, 9000), []);
});

test("25 coin pays on the 1st through 8th whole km and not on the 9th", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const base = await coinsOf(sql, "ann");
  // 500 m every 8 s: the 2nd, 4th, ... ping crosses a whole km.
  for (let i = 0; i < 18; i++) {
    const r = await sundayPing(sql, "ann", { mode: "walk", meters: 500 }, NOON + i * 8000);
    const km = Math.floor(((i + 1) * 500) / 1000);
    const paid = Math.min(8, km);
    assert.equal(r.ok, true);
    assert.deepEqual(r.sunday, { paid, day: DAY }, `ping ${i + 1}`);
    const pays = (i + 1) % 2 === 0 && km <= 8;
    assert.equal(r.award?.coins ?? 0, pays ? 25 : 0, `ping ${i + 1}`);
    if (pays) assert.deepEqual(r.award?.boosts, ["Sunday Drive +25 coin"]);
    assert.equal(await coinsOf(sql, "ann"), base + paid * 25);
    assert.equal(r.view.coins, base + paid * 25, "the reply carries the paid wallet");
  }
  // 9 km on the meter, 8 pays in the ledger, 200 coin, and the HUD stays 8/8.
  assert.equal((await meterOf(sql, "ann"))!.meters, 9000);
  assert.deepEqual(await sdRows(sql, "ann"), [1, 2, 3, 4, 5, 6, 7, 8].map((k) => `sd:${DAY}:${k}`));
  assert.equal(await coinsOf(sql, "ann"), base + 200);
  assert.deepEqual(await sundayOf(sql, "ann", NOON + 600_000), { paid: 8, day: DAY });
  assert.equal(sundayText((await syncPlayer(sql, "ann", snap, "ann-phone")).sunday!.paid), "Sunday Drive 8/8 km");
  // The first hour's double rewards do not touch it: exactly 25 a km.
  const row = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${"ann"} and op_key = ${sundayKey(DAY, 1)}`;
  assert.equal(JSON.parse(row[0]!.detail).coins, 25);
});

test("one big ping may cross several km: each is paid, in order, up to the cap; never a fraction", async () => {
  const sql = await db();
  await syncPlayer(sql, "bea", snap, "bea-phone");
  const base = await coinsOf(sql, "bea");
  await sundayPing(sql, "bea", { mode: "drive", meters: 999 }, NOON);
  assert.equal(await coinsOf(sql, "bea"), base, "999 m is not a km");
  // 20 s seated: 3,500 m is well under the drive ceiling. 999 + 3,500 = 4,499 m: km 1..4.
  const r = await sundayPing(sql, "bea", { mode: "drive", meters: 3500 }, NOON + 20_000);
  assert.equal(r.award?.coins, 100);
  assert.deepEqual(r.award?.boosts, ["Sunday Drive +100 coin"]);
  assert.deepEqual(r.sunday, { paid: 4, day: DAY });
  assert.deepEqual(await sdRows(sql, "bea"), [1, 2, 3, 4].map((k) => `sd:${DAY}:${k}`));
  // A big one past the cap: 4,499 + 15,000 = 19,499 m pays km 5..8 only.
  const big = await sundayPing(sql, "bea", { mode: "drive", meters: 15_000 }, NOON + 80_000);
  assert.equal(big.award?.coins, 100);
  assert.deepEqual(big.sunday, { paid: 8, day: DAY });
  assert.equal(await coinsOf(sql, "bea"), base + 200);
  assert.equal((await sdRows(sql, "bea")).length, 8);
  // Replaying a pay key by hand is a no-op: the ledger row is the pay.
  const again = await sundayPing(sql, "bea", { mode: "drive", meters: 5000 }, NOON + 120_000);
  assert.equal(again.award, undefined);
  assert.equal(await coinsOf(sql, "bea"), base + 200);
});

test("coin respects COIN_CAP like every other op", async () => {
  const sql = await db();
  await syncPlayer(sql, "max", snap, "max-phone");
  await sql`update player_wallets set coins = ${COIN_CAP - 10} where user_id = ${"max"}`;
  const r = await walk(sql, "max", NOON, 2);
  assert.deepEqual(r.sunday, { paid: 1, day: DAY });
  assert.equal(await coinsOf(sql, "max"), COIN_CAP);
});

test("leftover meters carry then drop at Chicago midnight", async () => {
  const sql = await db();
  await syncPlayer(sql, "cal", snap, "cal-phone");
  const base = await coinsOf(sql, "cal");
  // 1,600 m just before midnight CT: one pay, 600 m carried.
  await walk(sql, "cal", ct(25, 23, 59, 0), 4, 400);
  assert.deepEqual(await meterOf(sql, "cal"), { day: DAY, meters: 1600 });
  // The carry counts later the same day: +400 m makes the 2nd km.
  const carry = await sundayPing(sql, "cal", { mode: "walk", meters: 400 }, ct(25, 23, 59, 32));
  assert.deepEqual(carry.sunday, { paid: 2, day: DAY });
  await sundayPing(sql, "cal", { mode: "walk", meters: 900 }, ct(25, 23, 59, 40));
  assert.deepEqual(await meterOf(sql, "cal"), { day: DAY, meters: 2900 });
  assert.equal(await coinsOf(sql, "cal"), base + 50);
  // After midnight the 900 m leftover is gone: 500 m is just 500 m, no pay, and the new day's count is 0.
  const next = await sundayPing(sql, "cal", { mode: "walk", meters: 500 }, ct(26, 0, 0, 10));
  assert.deepEqual(next.sunday, { paid: 0, day: "2025-11-26" });
  assert.equal(next.award, undefined);
  assert.deepEqual(await meterOf(sql, "cal"), { day: "2025-11-26", meters: 500 });
  assert.equal(await coinsOf(sql, "cal"), base + 50);
  // The new day has its own 8: yesterday's rows do not count against it, and stay paid.
  const km = await sundayPing(sql, "cal", { mode: "walk", meters: 500 }, ct(26, 0, 0, 18));
  assert.deepEqual(km.sunday, { paid: 1, day: "2025-11-26" });
  assert.deepEqual(await sdRows(sql, "cal"), ["sd:2025-11-25:1", "sd:2025-11-25:2", "sd:2025-11-26:1"]);
  // Pure rule, same story.
  const m: SundayMeter = { day: DAY, meters: 2900, lastAt: ct(25, 23, 59, 40) };
  assert.deepEqual(sundayStep(m, { mode: "walk", meters: 500 }, ct(26, 0, 0, 10), FOOT), { meter: { day: "2025-11-26", meters: 500, lastAt: ct(26, 0, 0, 10) }, added: 500, pays: [] });
});

test("straddling-midnight ping is not split; meters go to the receipt day's Chicago day", async () => {
  const before = ct(25, 23, 59, 50);
  const after = ct(26, 0, 0, 5);
  assert.equal(chicagoDay(before), DAY);
  assert.equal(chicagoDay(after), "2025-11-26");
  // Pure: 950 m on the 25th, then a 15 s leg that began at 23:59:50 CT and is received at 00:00:05 CT.
  const prev: SundayMeter = { day: DAY, meters: 950, lastAt: before };
  const step = sundayStep(prev, { mode: "walk", meters: 1200 }, after, FOOT);
  assert.equal(step.added, 1200, "the whole ping is accepted");
  assert.deepEqual(step.meter, { day: "2025-11-26", meters: 1200, lastAt: after }, "all of it on the receipt day, none on the 25th");
  assert.deepEqual(step.pays, [1], "km 1 of the 26th; the 25th's 950 m leftover never becomes a km");
  // Server: the same instants.
  const sql = await db();
  await syncPlayer(sql, "dee", snap, "dee-phone");
  const base = await coinsOf(sql, "dee");
  await sundayPing(sql, "dee", { mode: "walk", meters: 500 }, before - 8000);
  await sundayPing(sql, "dee", { mode: "walk", meters: 450 }, before);
  assert.deepEqual(await meterOf(sql, "dee"), { day: DAY, meters: 950 });
  const r = await sundayPing(sql, "dee", { mode: "walk", meters: 1200 }, after);
  assert.deepEqual(r.sunday, { paid: 1, day: "2025-11-26" });
  assert.deepEqual(await meterOf(sql, "dee"), { day: "2025-11-26", meters: 1200 });
  assert.deepEqual(await sdRows(sql, "dee"), ["sd:2025-11-26:1"]);
  assert.equal(await coinsOf(sql, "dee"), base + 25);
  assert.deepEqual(await sundayOf(sql, "dee", before), { paid: 0, day: DAY }, "nothing was paid for the 25th");
});

test("a teleport ping is rejected", async () => {
  // Pure: rejected whole, never clamped. The cap is (elapsed + jitter) * ceiling * slack.
  const cap8 = ((8000 + DAILY_JITTER_MS) / 1000) * FOOT * SUNDAY_SLACK;
  assert.equal(sundayLeg("walk", Math.floor(cap8), 8000, FOOT), Math.floor(cap8));
  assert.equal(sundayLeg("walk", Math.floor(cap8) + 1, 8000, FOOT), 0);
  assert.equal(sundayLeg("walk", 5000, 8000, FOOT), 0, "not clamped down to the cap");
  // A seated leg may be faster than a foot one, but not past its own ceiling.
  const drive = sundayCeiling("drive", []);
  assert.equal(sundayLeg("drive", 2500, 8000, drive), 2500);
  assert.equal(sundayLeg("walk", 2500, 8000, FOOT), 0);
  assert.equal(sundayLeg("drive", 20_000, 8000, drive), 0);
  assert.equal(sundayLeg("walk", 500, 0, FOOT), 0);
  assert.equal(sundayLeg("walk", Number.NaN, 8000, FOOT), 0);

  const sql = await db();
  await syncPlayer(sql, "eve", snap, "eve-phone");
  const base = await coinsOf(sql, "eve");
  await walk(sql, "eve", NOON, 3); // 1,500 m, 1 pay
  // Three impossible legs in a short window: each adds 0, nothing else is voided.
  for (let i = 0; i < 3; i++) {
    const bad = await sundayPing(sql, "eve", { mode: "walk", meters: 9000 }, NOON + 16_000 + (i + 1) * 2000);
    assert.equal(bad.ok, true);
    assert.equal(bad.award, undefined);
    assert.deepEqual(bad.sunday, { paid: 1, day: DAY }, "the paid km stays paid");
  }
  assert.deepEqual(await meterOf(sql, "eve"), { day: DAY, meters: 1500 }, "the meter and the day are untouched");
  assert.equal(await coinsOf(sql, "eve"), base + 25);
  // An honest leg right after still counts: no strikes, no voided day.
  const ok = await sundayPing(sql, "eve", { mode: "walk", meters: 500 }, NOON + 30_000);
  assert.deepEqual(ok.sunday, { paid: 2, day: DAY });
  // A rejected ping burned its own window: waiting does not bank time for a jump (the clock moved on the bad ping).
  await sundayPing(sql, "eve", { mode: "walk", meters: 15_000 }, NOON + 130_000);
  const jump = await sundayPing(sql, "eve", { mode: "walk", meters: 15_000 }, NOON + 132_000);
  assert.equal(jump.award, undefined);
  assert.deepEqual(await meterOf(sql, "eve"), { day: DAY, meters: 2000 });
  // "drive" on an account with no car gets the city cab's ceiling, not a bought car's.
  const far = Math.floor(((8000 + DAILY_JITTER_MS) / 1000) * sundayCeiling("drive", []) * SUNDAY_SLACK) + 1;
  await sundayPing(sql, "eve", { mode: "drive", meters: far }, NOON + 140_000);
  assert.deepEqual(await meterOf(sql, "eve"), { day: DAY, meters: 2000 });
  // An account's very first ping is judged over the short opening window, so it cannot open with a jump either.
  await syncPlayer(sql, "fay", snap, "fay-phone");
  assert.ok(SUNDAY_PING_MAX_M > ((SUNDAY_OPEN_MS + DAILY_JITTER_MS) / 1000) * FOOT * SUNDAY_SLACK);
  await sundayPing(sql, "fay", { mode: "walk", meters: 8000 }, NOON);
  assert.deepEqual(await meterOf(sql, "fay"), { day: DAY, meters: 0 });
  assert.deepEqual(await sdRows(sql, "fay"), []);
});

test("parked / jitter legs add 0 m", async () => {
  // Under 10 m: nothing, at any speed, seated or not.
  assert.equal(sundayLeg("walk", 9, 8000, FOOT), 0);
  assert.equal(sundayLeg("drive", 9, 8000, sundayCeiling("drive")), 0);
  assert.equal(sundayLeg("walk", 9.9, 1000, FOOT), 0);
  assert.equal(sundayLeg("walk", 10, 8000, FOOT), 10);
  // On foot under 0.5 m/s by the server's clock: nothing. 12 m in 60 s is 0.2 m/s; 30 m in 60 s is exactly 0.5.
  assert.equal(sundayLeg("walk", 12, 60_000, FOOT), 0);
  assert.equal(sundayLeg("walk", 29, 60_000, FOOT), 0);
  assert.equal(sundayLeg("walk", 30, 60_000, FOOT), 30);
  // Seated has no slow floor (a car in traffic is still a drive), only the 10 m one.
  assert.equal(sundayLeg("drive", 12, 60_000, sundayCeiling("drive")), 12);

  const sql = await db();
  await syncPlayer(sql, "gus", snap, "gus-phone");
  const base = await coinsOf(sql, "gus");
  await sundayPing(sql, "gus", { mode: "walk", meters: 990 }, NOON);
  // A parked phone: 400 jittery pings of 5-9 m, 8 s apart, then slow creep of 20 m a minute. None of it counts.
  for (let i = 1; i <= 400; i++) await sundayPing(sql, "gus", { mode: "walk", meters: 5 + (i % 5) }, NOON + i * 8000);
  for (let i = 1; i <= 30; i++) await sundayPing(sql, "gus", { mode: "walk", meters: 20 }, NOON + 3_200_000 + i * 60_000);
  assert.deepEqual(await meterOf(sql, "gus"), { day: DAY, meters: 990 });
  assert.deepEqual(await sdRows(sql, "gus"), []);
  assert.equal(await coinsOf(sql, "gus"), base);
});

test("back-and-forth on one street still pays", async () => {
  // The rule has no street, segment or direction in it at all: the op is only a mode and a length.
  const api = src("./walletApi.ts");
  const op = api.match(/z\.object\(\{ kind: z\.literal\("sunday"\)[^\n]*\}\),/)?.[0] ?? "";
  assert.match(op, /mode: z\.enum\(\["walk", "drive"\]\), meters: z\.number\(\)\.int\(\)\.positive\(\)\.max\(SUNDAY_PING_MAX_M\) \}\),$/);
  const code = (src("./sundayDrive.ts") + src("../../migrations/0019_sunday_drive.sql")).replace(/\/\*[\s\S]*?\*\/|^\s*(\/\/|--).*$/gm, "");
  assert.doesNotMatch(code, /\b(segs?|edge|unique|distinct|visited)\b/i);
  // One 200 m block, up and down, 40 times (a turn every 2 s): 8,000 m, all 8 pays.
  const sql = await db();
  await syncPlayer(sql, "hal", snap, "hal-phone");
  const base = await coinsOf(sql, "hal");
  const r = await walk(sql, "hal", NOON, 40, 200, 2);
  assert.deepEqual(r.sunday, { paid: 8, day: DAY });
  assert.equal(await coinsOf(sql, "hal"), base + 200);
});

test("sunday-drive counter cannot be incremented from the client", async () => {
  const sql = await db();
  await syncPlayer(sql, "ivy", snap, "ivy-phone");
  const base = await coinsOf(sql, "ivy");
  // The wire schema is a mode and a length. Zod strips anything else, so a count or a total never reaches the op.
  const api = src("./walletApi.ts");
  const fields = (api.match(/z\.object\(\{ kind: z\.literal\("sunday"\), ([^\n]*)/)?.[1] ?? "paid");
  assert.deepEqual(fields.match(/\b\w+(?=: z\.)/g), ["mode", "meters"]);
  assert.doesNotMatch(fields, /passthrough|strict|catchall/);
  assert.match(api, /\.validator\(\(u: unknown\) => Op\.parse\(u\)\)/);
  // Even handed straight to the apply layer, extra fields do nothing: the handler reads mode and meters only.
  const forged = { kind: "sunday", mode: "walk", meters: 500, paid: 8, count: 8, km: 8, day: "2025-11-24", total: 8000, elapsed: 999_999, now: 0 } as unknown as ClientOp;
  const r = await applyClientOp(sql, "ivy", forged);
  assert.deepEqual(r.sunday, { paid: 0, day: DAY });
  assert.deepEqual(await meterOf(sql, "ivy"), { day: DAY, meters: 500 });
  // N pings with no server time between them add nothing (the pinned clock has not moved): the clock is the server's.
  for (let i = 0; i < 50; i++) {
    const again = await applyClientOp(sql, "ivy", { kind: "sunday", mode: "walk", meters: 500 });
    assert.equal(again.ok, false);
    assert.equal(again.reason, "retry");
    assert.deepEqual(again.sunday, { paid: 0, day: DAY });
  }
  assert.deepEqual(await meterOf(sql, "ivy"), { day: DAY, meters: 500 });
  assert.equal(await coinsOf(sql, "ivy"), base);
  // No wallet or save field carries it: a sync that claims a count, or the old counters at any value, moves nothing.
  const lie = { ...snap, coins: 0, sunday: { paid: 8, day: DAY }, sundayPaid: 8, sundayMeters: 8000 } as unknown as LocalSnap;
  assert.deepEqual((await syncPlayer(sql, "ivy", lie, "ivy-phone")).sunday, { paid: 0, day: DAY });
  assert.deepEqual((await syncPlayer(sql, "ivy", lie, "ivy-tablet")).sunday, { paid: 0, day: DAY });
  assert.deepEqual(await sdRows(sql, "ivy"), []);
  // The count is the account's own sd: rows for today, nothing else: another player's rows and yesterday's do not count.
  await syncPlayer(sql, "jon", snap, "jon-phone");
  await walk(sql, "jon", NOON + 1000, 6);
  assert.deepEqual(await sundayOf(sql, "jon"), { paid: 3, day: DAY });
  assert.deepEqual(await sundayOf(sql, "ivy"), { paid: 0, day: DAY });
  // No other op writes an sd: key, and the client keeps no counter of its own: the store field is only ever set
  // from a server reply and is not in the save.
  const apply = src("./walletApply.ts");
  assert.equal(apply.match(/sundayKey\(/g)?.length, 1, "one writer");
  assert.doesNotMatch(apply, /["'`]sd:[^"'`]*["'`]\s*[,)]\s*\(w\)/);
  const client = src("./walkClient.ts");
  assert.match(client, /commitWallet\(\{ kind: "sunday", mode, meters: whole \}\)/);
  assert.match(client, /if \(r\.sunday\) useGame\.setState\(\{ sunday: r\.sunday \}\)/);
  assert.doesNotMatch(client, /sunday:\s*\{\s*paid/);
  const store = src("./store.ts");
  assert.equal(store.match(/\bsunday: null,/g)?.length, 1);
  assert.doesNotMatch(store, /saved\?\.sunday|sunday: s\.sunday|sunday: get\(\)\.sunday/);
  assert.match(src("../components/keyline/WalletSync.tsx"), /odometer: null, encore: null, sunday: null \}\)/);
});

test("pays nothing when signed out / guest", async () => {
  // Signed out: the only way in is applyWallet / syncWallet, both behind authMiddleware (a guest request is refused
  // before any handler runs), and the device sends nothing while there is no live server wallet.
  const api = src("./walletApi.ts");
  assert.match(api, /export const applyWallet = createServerFn\(\{ method: "POST" \}\)\s*\.middleware\(\[authMiddleware\]\)/);
  assert.match(api, /export const syncWallet = createServerFn\(\{ method: "POST" \}\)\s*\.middleware\(\[authMiddleware\]\)/);
  const client = src("./walkClient.ts");
  assert.match(client, /if \(!\(meters > 0\) \|\| meters > MAX_TICK_M \|\| !walletLive\(\)\) return;/);
  assert.match(src("./walletClient.ts"), /export async function commitWallet\(op: ClientOp\)[^\n]*\n\s*if \(!live\) return null;/);
  // The HUD chip is the server's count or nothing: a guest (store.sunday === null) sees no chip.
  assert.match(src("../components/keyline/Hud.tsx"), /\{sunday != null \? \(\s*<span className="odo-chip tabular-nums" data-testid="hud-sunday">\s*\{sundayText\(sundayToday\(sunday, Date\.now\(\)\)\)\}/);
  // An id with no server wallet (never synced: what a guest is to the apply layer) is refused and writes nothing.
  const sql = await db();
  for (let i = 0; i < 4; i++) {
    const r = await applyClientOp(sql, "guest", { kind: "sunday", mode: "walk", meters: 800 });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "sync");
    assert.equal(r.award, undefined);
    assert.equal(r.sunday, undefined);
    mock.timers.setTime(NOON + (i + 1) * 8000);
  }
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from sunday_drive`)[0]!.n), 0);
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where op_key like ${"sd:%"}`)[0]!.n), 0);
  assert.equal(await coinsOf(sql, "guest"), 0);
});

test("the op through applyClientOp on the server clock; a linked sign-in shares one meter; no 0019 table = refused, nothing paid", async () => {
  const sql = await db();
  await syncPlayer(sql, "kim", snap, "kim-phone");
  const base = await coinsOf(sql, "kim");
  const a = await applyClientOp(sql, "kim", { kind: "sunday", mode: "walk", meters: 600 });
  assert.equal(a.ok, true);
  mock.timers.setTime(NOON + 8000);
  const b = await applyClientOp(sql, "kim", { kind: "sunday", mode: "walk", meters: 600 });
  assert.deepEqual(b.sunday, { paid: 1, day: DAY });
  assert.equal(b.award?.coins, 25);
  assert.equal(await coinsOf(sql, "kim"), base + 25);
  // A linked sign-in is the same player: same meter row, same ledger, one cap.
  await sql`insert into player_links (alias_id, primary_id, how) values (${"kim-x"}, ${"kim"}, ${"test"})`;
  mock.timers.setTime(NOON + 16_000);
  const c = await applyClientOp(sql, "kim-x", { kind: "sunday", mode: "walk", meters: 800 });
  assert.deepEqual(c.sunday, { paid: 2, day: DAY });
  assert.deepEqual(await meterOf(sql, "kim"), { day: DAY, meters: 2000 });
  assert.equal(await meterOf(sql, "kim-x"), null);

  // Published before the migration ran: refused, no coin, no rows; a sync still answers (count 0).
  const bare = await db([]);
  await syncPlayer(bare, "lou", snap, "lou-phone");
  const before = await coinsOf(bare, "lou");
  const r = await applyClientOp(bare, "lou", { kind: "sunday", mode: "walk", meters: 900 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "unready");
  assert.equal(await coinsOf(bare, "lou"), before);
  assert.deepEqual((await syncPlayer(bare, "lou", snap, "lou-phone")).sunday, { paid: 0, day: DAY });
});

test("migration 0019 is additive and safe to run twice; the client feed and the HUD are wired as the card says", async () => {
  const sqlText = mig(SD_MIG);
  assert.match(sqlText, /create table if not exists sunday_drive/);
  assert.doesNotMatch(sqlText.replace(/^--.*$/gm, ""), /\b(drop|alter|delete|truncate)\b/i);
  const sql = await db([SD_MIG, SD_MIG]);
  await syncPlayer(sql, "moe", snap, "moe-phone");
  await walk(sql, "moe", NOON, 2);
  await sql.query(mig(SD_MIG));
  assert.deepEqual(await meterOf(sql, "moe"), { day: DAY, meters: 1000 }, "re-running keeps the rows");
  // Map loop: the snapped step feeds Sunday Drive in both modes, next to (not instead of) the foot-only walk feed.
  const map = src("../components/keyline/GameMap.tsx");
  assert.match(map, /if \(!seated && stepped > 0\.2\) distAcc\.current \+= stepped;\n[^\n]*\n\s*if \(stepped > 0\.2\) noteSunday\(seated \? "drive" : "walk", stepped\);/);
  // Same 8 s cadence and hide flush as the walk post.
  const client = src("./walkClient.ts");
  assert.match(client, /void flushWalk\(\);\n\s*void flushSunday\(\);\n\s*\}, FLUSH_MS\);/);
  assert.match(client, /void flushWalk\(\{ min: 1 \}\);\n\s*void flushSunday\(\);/);
  // The walk leaderboard post is untouched: still foot metres from the store's distance, still postWalk.
  assert.match(client, /noteWalk\(s\.cityId, d\);/);
  assert.match(src("./walkApi.ts"), /return recordWalk\(sql, me, data\.city, data\.meters, dailyTopSpeed\(\)\);/);
});
