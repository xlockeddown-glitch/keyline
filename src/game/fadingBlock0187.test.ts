// 0.1.187 Fading block (CARD-189): a soft anti-camp rule, not a new faucet. After the 3rd right vault in one 800 m
// square on one city-local day, the 4th and every later right vault there pays floor(0.50 x coin): the grade's whole
// coin plus the Stray lamp extra as one total. Keys, the key-back and the streak prize are unchanged. Night-market,
// Comet and Hearth vaults never count and are never faded. The count is the server's own grade rows (no table, no
// migration, nothing from the client). Nothing here touches the network.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { CITIES } from "./data.ts";
import { gradeGrant, type GradePay, type LocalSnap } from "./wallet.ts";
import { applyClientOp, awardGrade, holidayStamp, sundayPing, syncPlayer, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import {
  DISTRICT_M, FADE_AFTER, FADE_GUIDE, FADE_RATE, FADE_TAG, FRESH_DISTRICT_TAG, districtOf, districtsInDetails, fadeCoin, fadeDue, freshDistrictCoin, rightsInSquare,
} from "./district.ts";
import { COMET_TAG, COMET_TIER, cometOfWindow, cometStart, cometWindow } from "./eventVault.ts";
import { payMatchesOf } from "./goals.ts";
import { holidayRoute } from "./holidayLights.ts";
import { meetCollectKey, meetLeaveKey } from "./meetDrop.ts";
import { MARKET_HOUR_MS, marketAt, marketMult } from "./nightMarket.ts";
import { TIER_VALUE, rewardPoints } from "./rewards.ts";
import { sealPlate } from "./rarity.ts";
import { strayBonus, strayEligible, strayEnd, strayKey, strayLine, strayOfWindow, strayPays, strayStart, strayWindow } from "./strayLamp.ts";
import { SUNDAY_COIN } from "./sundayDrive.ts";
import { DIFF_MULT } from "./triviaMeta.ts";
import { DealIn, dealFor, grade, resetGradeRing, publicCardId, type TriviaDeps } from "./triviaService.ts";
import { GradeIn } from "./triviaSchema.ts";
import type { CityId, Poi, Tier, TriviaQ } from "./types";
import { cityDay } from "./vaultStack.ts";
import { wardRouteAt } from "./wardCircuit.ts";
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
const opened: PGlite[] = [];
afterEach(async () => {
  for (const pg of opened.splice(0)) await pg.close();
});
async function db(extra: string[] = []) {
  const pg = new PGlite();
  opened.push(pg);
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", ...extra]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const KEYS: Partial<Record<Tier, number>> = { white: 9, blue: 9, green: 9, amber: 9, red: 9, violet: 9 };
const snap: LocalSnap = { coins: 0, keys: KEYS, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const walletOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet;
const coinsOf = async (sql: Sql, user: string) => (await walletOf(sql, user)).coins;
const keysOf = async (sql: Sql, user: string) => ({ ...(await walletOf(sql, user)).keys });
const gradeDetail = async (sql: Sql, user: string, nonce: string) => {
  const { id } = await canonicalWallet(sql, user);
  return String((await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${"grade:" + nonce}`)[0]?.detail ?? "");
};
const gradeRows = async (sql: Sql, user: string) => {
  const { id } = await canonicalWallet(sql, user);
  return (await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"}`).map((r) => String(r.detail));
};
const keyList = async (sql: Sql, user: string) => {
  const { id } = await canonicalWallet(sql, user);
  return (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} order by op_key`).map((r) => r.op_key);
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const CITY: CityId = "austin";
// A fixed moment in the past: 13:00 in Austin, 19:00 in London. Every grade below names its own server clock
// (pay.now) and its ledger row is then stamped with that same moment, so nothing depends on the real clock.
const T0 = Date.UTC(2026, 5, 10, 18);

/** Baked street lamps that are never a night-market lamp and are not the stray lamp at any of `times`. */
function lampsOf(city: CityId, times: number[]) {
  const pool = strayEligible(city).filter((p) => times.every((t) => !strayPays({ city, poiId: p.id, dealtAt: t - 5000 }, t)));
  const by = new Map<string, Poi[]>();
  for (const p of pool) by.set(p.district, [...(by.get(p.district) ?? []), p.poi]);
  const squares = [...by.entries()].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1));
  assert.ok(squares.length >= 2 && squares[0]![1].length >= 2, `${city}: two squares, one with two lamps`);
  // a1 and a2 share a square; b is in another one.
  return { a1: squares[0]![1][0]!, a2: squares[0]![1][1]!, b: squares[1]![1][0]!, square: squares[0]![0], other: squares[1]![0] };
}
const SPAN = Array.from({ length: 60 }, (_, i) => T0 + i * MIN);
const { a1: A1, a2: A2, b: B, square: SQUARE, other: OTHER_SQUARE } = lampsOf(CITY, SPAN);
const TIER: Tier = "blue";

type Pay = Omit<GradePay, "prior"> & { prevNonce: string; now?: number; timedOut?: boolean; struck?: boolean };
/** A right answer on a lit lamp at server time `now`, dealt five seconds earlier. Every lamp pays as a blue vault. */
function pay(lamp: Poi, now: number, over: Partial<Pay> = {}, city: CityId = CITY): Pay {
  return {
    correct: true, elapsedMs: 5000, mult: 1, city, diff: 2, clearTier: TIER, poiTier: TIER, poiId: lamp.id,
    lat: lamp.lat, lng: lamp.lng, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "",
    charmTopics: [], topic: "science", dealtAt: now - 5000, luckyHit: false, perfectBlue: false, prevNonce: "", now, ...over,
  };
}
/** Grade at `now`, then stamp the grade row with that moment (the database's own now() is the real clock). */
async function right(sql: Sql, who: string, nonce: string, lamp: Poi, now: number, over: Partial<Pay> = {}, city: CityId = CITY) {
  const r = await awardGrade(sql, who, nonce, pay(lamp, now, over, city));
  assert.ok(r.ok, `${who} ${nonce}`);
  const { id } = await canonicalWallet(sql, who);
  await sql`update wallet_ledger set created_at = ${new Date(now).toISOString()} where user_id = ${id} and op_key = ${"grade:" + nonce}`;
  return r;
}
const faded = (r: { award?: { boosts: string[] } }) => (r.award?.boosts ?? []).includes(FADE_TAG);
const freshLine = (r: { award?: { boosts: string[] } }) => (r.award?.boosts ?? []).find((b) => b.startsWith(FRESH_DISTRICT_TAG));
/** The plain blue lamp coin for `pay()` as it stands: round(90 x 1 x (1 + 0.05) x 1 x 1). */
const G = Math.round(rewardPoints(TIER, { mult: 1, bonus: 1.05, diffMult: DIFF_MULT[2], loot: 1 }));

test("pure rules: fadeCoin, rightsInSquare, fadeDue", () => {
  assert.deepEqual([FADE_AFTER, FADE_RATE, FADE_TAG], [3, 0.5, "Fading block: half coin"]);
  // floor(0.50 x coin), never below 0.
  assert.deepEqual([0, 1, 2, 3, 7, 94, 95, 2431, -4, Number.NaN, Number.POSITIVE_INFINITY].map(fadeCoin), [0, 0, 1, 1, 3, 47, 47, 1215, 0, 0, 0]);
  for (let c = 0; c < 400; c++) assert.equal(fadeCoin(c), Math.floor(0.5 * c));
  // The fade is due from the 4th right on: three already on the ledger.
  assert.deepEqual([0, 1, 2, 3, 4, 5, 50].map(fadeDue), [false, false, false, true, true, true, true]);
  // What counts: a right carrying this square. What does not: a miss, another square, a market, Comet or Hearth row.
  const row = (o: Record<string, unknown>) => JSON.stringify({ coins: 94, keys: {}, boosts: [], g: "great", t: "blue", pv: "", pi: "lamp-1", c: "austin", ...o });
  const rows = [
    row({ d: "0:0" }),
    row({ d: "0:0", sy: 1 }), // a Stray lamp right counts
    row({ d: "0:0", oh: 1 }), // a put-in-order near-miss counts
    row({ d: "0:0", fb: 1 }), // an already faded right counts
    row({ d: "0:0", g: "miss" }),
    row({ g: "miss" }),
    row({ sp: 1 }), // a spark carries no square
    row({ d: "0:1" }),
    row({ d: "-1:0" }),
    row({ d: "0:0", mk: 1 }),
    row({ d: "0:0", ev: 1 }),
    row({ d: "0:0", hh: 1 }),
    row({ d: "0:0", pi: "placed-abc" }), // a Hearth right written before 0.1.187 (no hh yet)
    "not json",
    "",
  ];
  assert.equal(rightsInSquare(rows, "0:0"), 4);
  assert.equal(rightsInSquare(rows, "0:1"), 1);
  assert.equal(rightsInSquare(rows, "-1:0"), 1);
  assert.equal(rightsInSquare(rows, "5:5"), 0);
  assert.equal(rightsInSquare(rows, ""), 0, "no square, no count");
  assert.equal(rightsInSquare([], "0:0"), 0);
  // "1:0" is not a prefix match for "11:0" or "1:01".
  assert.equal(rightsInSquare([row({ d: "11:0" }), row({ d: "1:01" }), row({ d: "-1:0" })], "1:0"), 0);
  // The district bonus still reads market, Comet and Hearth rows as lit squares; only the fade count leaves them out.
  assert.equal(districtsInDetails(rows).filter((d) => d === "0:0").length, 8);
  // district.ts stays pure and shared: no clock, no state, no client-only module.
  const code = src("./district.ts");
  assert.deepEqual([...code.matchAll(/from "([^"]+)"/g)].map((m) => m[1]).sort(), ["./data.ts", "./types.ts"]);
  assert.doesNotMatch(code.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, ""), /Date\.now|gameNow|window\.|document\.|localStorage|useGame|Math\.random/);
  // The header says what counts, what is excluded, the clock, and that it is ledger-only.
  for (const say of [/What counts:/, /What is excluded/, /same cityDay clock/, /Ledger-only/]) assert.match(code, say);
});

test("1st-3rd rights in a square pay full, 4th pays half", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  assert.equal(districtOf(CITY, A1.lat, A1.lng), SQUARE);
  assert.equal(districtOf(CITY, A2.lat, A2.lng), SQUARE, "two lamps, one 800 m square");
  assert.notEqual(A1.id, A2.id);
  assert.equal(DISTRICT_M, 800);
  assert.equal(G, 95, "a lamp with a known coin: round(90 x 1.05)");
  const base = await coinsOf(sql, "ann");
  const fresh = freshDistrictCoin(G);
  // 1st: full, and still the New district bonus.
  const r1 = await right(sql, "ann", "n1", A1, T0);
  assert.equal(freshLine(r1), `${FRESH_DISTRICT_TAG} +${fresh}`);
  assert.equal(r1.award!.coins, G + fresh);
  assert.equal(faded(r1), false);
  // 2nd and 3rd: full (the 3rd on another lamp of the same square).
  const r2 = await right(sql, "ann", "n2", A1, T0 + MIN);
  const r3 = await right(sql, "ann", "n3", A2, T0 + 2 * MIN);
  for (const r of [r2, r3]) {
    assert.equal(r.award!.coins, G);
    assert.equal(faded(r), false);
    assert.equal(freshLine(r), undefined);
  }
  assert.equal(await coinsOf(sql, "ann"), base + 3 * G + fresh);
  // 4th: floor(0.50 x coin), with the label last on the reward card's list.
  const r4 = await right(sql, "ann", "n4", A1, T0 + 3 * MIN);
  assert.equal(r4.award!.coins, Math.floor(0.5 * G));
  assert.equal(r4.award!.coins, 47);
  assert.deepEqual(r4.award!.boosts, [...r2.award!.boosts, FADE_TAG]);
  assert.deepEqual(r4.award!.keys, r2.award!.keys);
  assert.equal(await coinsOf(sql, "ann"), base + 3 * G + fresh + 47, "the wallet gained the faded coin, no more");
  // The ledger: every right carries the square; only the 4th is flagged.
  for (const n of ["n1", "n2", "n3"]) {
    assert.match(await gradeDetail(sql, "ann", n), new RegExp(`"d":"${SQUARE}"`));
    assert.doesNotMatch(await gradeDetail(sql, "ann", n), /"fb"|"hh"|"mk"|"ev"/);
  }
  assert.match(await gradeDetail(sql, "ann", "n4"), /"fb":1/);
  assert.equal(JSON.parse(await gradeDetail(sql, "ann", "n4")).coins, 47);
  // A put-in-order near-miss is a right: it counts, and a faded one pays half of its own half.
  await syncPlayer(sql, "ord", snap, "ord-phone");
  const o1 = await right(sql, "ord", "o1", A1, T0, { orderHalf: true });
  assert.equal(o1.award!.coins, Math.floor((G + fresh) / 2));
  const o2 = await right(sql, "ord", "o2", A1, T0 + MIN, { orderHalf: true });
  const o3 = await right(sql, "ord", "o3", A1, T0 + 2 * MIN, { orderHalf: true });
  assert.deepEqual([o2.award!.coins, o3.award!.coins], [Math.floor(G / 2), Math.floor(G / 2)]);
  const o4 = await right(sql, "ord", "o4", A1, T0 + 3 * MIN, { orderHalf: true });
  assert.equal(faded(o4), true, "three near-misses were counted");
  assert.equal(o4.award!.coins, Math.floor(Math.floor(G / 2) / 2));
  assert.equal(o4.award!.coins, 23);
});

test("a 6th right in the same square the same city day pays floor(50%)", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const got: number[] = [];
  const flags: boolean[] = [];
  for (let i = 1; i <= 8; i++) {
    const r = await right(sql, "ann", `n${i}`, i % 2 ? A1 : A2, T0 + i * MIN);
    got.push(r.award!.coins);
    flags.push(faded(r));
  }
  const half = Math.floor(0.5 * G);
  assert.equal(G % 2, 1, "an odd coin, so the floor matters");
  assert.deepEqual(got, [G + freshDistrictCoin(G), G, G, half, half, half, half, half]);
  assert.deepEqual(flags, [false, false, false, true, true, true, true, true]);
  assert.match(await gradeDetail(sql, "ann", "n6"), /"fb":1/);
  assert.equal(JSON.parse(await gradeDetail(sql, "ann", "n6")).coins, 47);
  // Eight prior rights: the server run is 8, so this answer's bonus is 1.40. The request's streak and loot are ignored.
  const full = Math.round(rewardPoints(TIER, { mult: 0.7, bonus: 1.4, diffMult: DIFF_MULT[3], loot: 1 }));
  const r9 = await right(sql, "ann", "n9", A1, T0 + 9 * MIN, { mult: 0.7, streak: 80, diff: 3, loot: 1.1 });
  assert.equal(r9.award!.coins, Math.floor(0.5 * full));
});

test("keys unchanged: the key-back, a perfect blue key and a rummaged key are paid in full on a faded grade", async () => {
  const sql = await db();
  const over: Partial<Pay> = { elapsedMs: 1500, perfectBlue: true, scout: "raccoon", rummage: true };
  for (const who of ["fade", "full"]) {
    await syncPlayer(sql, who, snap, `${who}-phone`);
    for (let i = 1; i <= 3; i++) await right(sql, who, `n${i}`, A1, T0 + i * MIN);
  }
  const before = { fade: await keysOf(sql, "fade"), full: await keysOf(sql, "full") };
  assert.deepEqual(before.fade, before.full);
  // Same account history, same answer: one in the camped square, one a drive away.
  const f = await right(sql, "fade", "n4", A1, T0 + 4 * MIN, over);
  const u = await right(sql, "full", "n4", B, T0 + 4 * MIN, over);
  assert.equal(faded(f), true);
  assert.equal(faded(u), false);
  assert.deepEqual(f.award!.keys, u.award!.keys);
  assert.ok((f.award!.keys.blue ?? 0) >= 2, "the key-back and the extra blue keys are all there");
  assert.deepEqual(await keysOf(sql, "fade"), await keysOf(sql, "full"), "and in the wallet");
  assert.notDeepEqual(await keysOf(sql, "fade"), before.fade);
  // Coin: the same grade, halved (the one a drive away also took New district).
  const fresh = Number(/\+(\d+)$/.exec(freshLine(u)!)![1]);
  assert.equal(f.award!.coins, Math.floor(0.5 * (u.award!.coins - fresh)));
  assert.deepEqual(f.award!.boosts, [...u.award!.boosts.filter((b) => !b.startsWith(FRESH_DISTRICT_TAG)), FADE_TAG]);
});

test("the 1-coin fixture pays 0: floor(0.5 x 1) = 0, and the keys still arrive", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const w = await walletOf(sql, "ann");
  const { now: _now, prevNonce: _pv, ...p } = pay(A1, T0, { poiTier: "white", clearTier: "white", mult: 0.03 });
  void _now;
  void _pv;
  const one = gradeGrant(w, p);
  assert.ok(one.ok);
  assert.equal(one.award!.coins, 1, "the fixture: a grade worth exactly 1 coin");
  const zero = gradeGrant(w, { ...p, fade: { extra: 0 } });
  assert.ok(zero.ok);
  assert.equal(zero.award!.coins, 0);
  assert.equal(zero.wallet.coins, w.coins);
  assert.deepEqual(zero.award!.keys, one.award!.keys);
  assert.deepEqual(zero.wallet.keys, one.wallet.keys);
  assert.deepEqual(zero.award!.boosts, [...one.award!.boosts, FADE_TAG]);
  // With a stray extra x the grade pays floor((G + x) / 2) − floor(x / 2); the extra's half is added by awardGrade.
  for (const x of [0, 1, 2, 3, 15, 45]) {
    const g = gradeGrant(w, { ...p, fade: { extra: x } });
    assert.equal(g.award!.coins + fadeCoin(x), Math.floor(0.5 * (1 + x)), `x=${x}`);
  }
  // A spark has no vault coin to fade: the flag is ignored there.
  const spark = { ...p, clearTier: null };
  assert.deepEqual(gradeGrant(w, { ...spark, fade: { extra: 0 } }).award, gradeGrant(w, spark).award);
  // The same fixture through the server: three rights, then a 1-coin 4th pays 0 coin and its key-back.
  for (let i = 1; i <= 3; i++) await right(sql, "ann", `n${i}`, A1, T0 + i * MIN);
  const coins = await coinsOf(sql, "ann");
  const r = await right(sql, "ann", "n4", A1, T0 + 4 * MIN, { poiTier: "white", clearTier: "white", mult: 0.03 });
  assert.equal(faded(r), true);
  assert.equal(r.award!.coins, 0);
  // gradeGrant still applies the request's empty charm list (a topic key). The server has already paid science today, so only the white key-back remains.
  assert.deepEqual(r.award!.keys, { white: 1 });
  assert.equal(await coinsOf(sql, "ann"), coins);
});

test("a 4th right in a different district pays full, and each square keeps its own count", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  assert.equal(districtOf(CITY, B.lat, B.lng), OTHER_SQUARE);
  assert.notEqual(SQUARE, OTHER_SQUARE);
  for (let i = 1; i <= 3; i++) await right(sql, "ann", `a${i}`, A1, T0 + i * MIN);
  // A drive to another square: full, with New district.
  const b1 = await right(sql, "ann", "b1", B, T0 + 4 * MIN);
  assert.equal(faded(b1), false);
  assert.equal(b1.award!.coins, G + freshDistrictCoin(G));
  assert.doesNotMatch(await gradeDetail(sql, "ann", "b1"), /"fb"/);
  // Back in the first square it is still the 4th there.
  const a4 = await right(sql, "ann", "a4", A2, T0 + 5 * MIN);
  assert.equal(faded(a4), true);
  assert.equal(a4.award!.coins, Math.floor(0.5 * G));
  // The other square: 2nd and 3rd full, its own 4th half.
  const b2 = await right(sql, "ann", "b2", B, T0 + 6 * MIN);
  const b3 = await right(sql, "ann", "b3", B, T0 + 7 * MIN);
  const b4 = await right(sql, "ann", "b4", B, T0 + 8 * MIN);
  assert.deepEqual([b2, b3, b4].map((r) => r.award!.coins), [G, G, Math.floor(0.5 * G)]);
  assert.deepEqual([b2, b3, b4].map(faded), [false, false, true]);
  // Another city is another set of squares.
  const far = lampsOf("london", SPAN).a1;
  const l1 = await right(sql, "ann", "l1", far, T0 + 9 * MIN, {}, "london");
  assert.equal(faded(l1), false);
  // Another player has their own count.
  await syncPlayer(sql, "bob", snap, "bob-phone");
  assert.equal(faded(await right(sql, "bob", "x1", A1, T0 + 10 * MIN)), false);
});

test("the 4th right after city midnight pays full again: the city's own midnight, not Chicago's, not UTC's", async () => {
  for (const city of ["austin", "london", "la"] as CityId[]) {
    const sql = await db();
    // The city's next local midnight after T0, to the minute.
    let mid = T0;
    while (cityDay(city, mid) === cityDay(city, T0)) mid += MIN;
    assert.equal(cityDay(city, mid - 1) !== cityDay(city, mid), true);
    const times = [-30, -20, -10, -1, 1, 2, 3, 4].map((m) => mid + m * MIN);
    const lamp = lampsOf(city, times).a1;
    for (const who of ["late", "next"]) {
      await syncPlayer(sql, `${city}-${who}`, snap, `${city}-${who}-phone`);
      for (let i = 0; i < 3; i++) await right(sql, `${city}-${who}`, `n${i + 1}`, lamp, times[i]!, {}, city);
    }
    // One minute before midnight: the 4th of the day, half.
    const late = await right(sql, `${city}-late`, "n4", lamp, mid - MIN, {}, city);
    assert.equal(faded(late), true, city);
    assert.equal(late.award!.coins, Math.floor(0.5 * G));
    // One minute after: a new city day. Full again (and the square is new for the day too).
    const next = await right(sql, `${city}-next`, "n4", lamp, mid + MIN, {}, city);
    assert.equal(faded(next), false, city);
    assert.equal(next.award!.coins, G + freshDistrictCoin(G), city);
    // ...and the new day counts from one: 2nd and 3rd full, 4th half.
    const more = [];
    for (let i = 5; i <= 7; i++) more.push(await right(sql, `${city}-next`, `n${i}`, lamp, times[i]!, {}, city));
    assert.deepEqual(more.map(faded), [false, false, true], city);
    assert.deepEqual(more.map((r) => r.award!.coins), [G, G, Math.floor(0.5 * G)], city);
    // The account that faded before midnight is fresh after it as well.
    assert.equal(faded(await right(sql, `${city}-late`, "n5", lamp, mid + 2 * MIN, {}, city)), false, city);
  }
  // London across Chicago's midnight (and Austin's): the same London day, so the count holds.
  const sql = await db();
  let chi = T0;
  while (cityDay("chicago", chi) === cityDay("chicago", T0)) chi += MIN;
  assert.equal(cityDay("london", chi - 30 * MIN), cityDay("london", chi + 10 * MIN), "no London midnight here");
  assert.notEqual(cityDay("chicago", chi - MIN), cityDay("chicago", chi + MIN));
  const times = [-30, -20, -10, 5].map((m) => chi + m * MIN);
  const lamp = lampsOf("london", times).a1;
  await syncPlayer(sql, "lon", snap, "lon-phone");
  for (let i = 0; i < 3; i++) await right(sql, "lon", `n${i + 1}`, lamp, times[i]!, {}, "london");
  assert.equal(faded(await right(sql, "lon", "n4", lamp, times[3]!, {}, "london")), true);
  // Both city-day reads in awardGrade use the grade's own server clock.
  const apply = src("./walletApply.ts");
  assert.match(apply, /isFreshDistrict\(district, await districtsToday\(sql, id, full\.city, pay\.now \?\? Date\.now\(\)\)\)/);
  assert.match(apply, /fadeDue\(await squareRightsToday\(sql, id, full\.city, district, nonce, pay\.now \?\? Date\.now\(\)\)\)/);
});

test("market, comet and hearth rights are exempt and do not count", async () => {
  const sql = await db();
  // --- Night market: a baked lamp on the market street, while the market is open there.
  let m = marketAt(CITY, T0 + MIN);
  let lamp: Poi | undefined;
  for (let t = T0 - (T0 % MARKET_HOUR_MS) + MARKET_HOUR_MS; !lamp && t < T0 + 8 * HOUR; t += MARKET_HOUR_MS) {
    m = marketAt(CITY, t + MIN);
    lamp = m ? CITIES[CITY].pois.find((p) => m!.street.lamps.includes(p.id) && districtOf(CITY, p.lat, p.lng) !== "") : undefined;
  }
  assert.ok(m && lamp, "a market with a baked lamp");
  assert.equal(cityDay(CITY, m.startsAt - 5 * MIN), cityDay(CITY, m.endsAt + 5 * MIN), "one city day");
  const spot = { kind: "lamp" as const, poiId: lamp.id, lat: lamp.lat, lng: lamp.lng };
  const open = [1, 2, 3, 4].map((i) => m!.startsAt + i * MIN);
  const dark = [1, 2, 3, 4].map((i) => m!.endsAt + i * MIN - 30_000);
  for (const t of open) assert.equal(marketMult(CITY, t - 5000, spot), 2);
  for (const t of dark) assert.equal(marketMult(CITY, t - 5000, spot), 1, "the same lamp in the dark five minutes");
  for (const t of [...open, ...dark]) assert.equal(strayPays({ city: CITY, poiId: lamp.id, dealtAt: t - 5000 }, t), null);
  await syncPlayer(sql, "mia", snap, "mia-phone");
  const mk = [];
  for (let i = 0; i < 4; i++) mk.push(await right(sql, "mia", `mk${i}`, lamp, open[i]!));
  // Four market rights: all at the market's double, none faded, none counted.
  assert.deepEqual(mk.map(faded), [false, false, false, false]);
  assert.deepEqual(mk.map((r) => r.award!.coins), [2 * G, 2 * G, 2 * G, 2 * G]);
  for (let i = 0; i < 4; i++) {
    assert.match(await gradeDetail(sql, "mia", `mk${i}`), /"mk":1/);
    assert.doesNotMatch(await gradeDetail(sql, "mia", `mk${i}`), /"fb"/);
  }
  assert.equal(rightsInSquare(await gradeRows(sql, "mia"), districtOf(CITY, lamp.lat, lamp.lng)), 0);
  // 3 market + 1 normal => the normal one pays full. Then the square counts from that one.
  const plain = [];
  for (let i = 0; i < 4; i++) plain.push(await right(sql, "mia", `pl${i}`, lamp, dark[i]!));
  assert.deepEqual(plain.map(faded), [false, false, false, true]);
  assert.deepEqual(plain.map((r) => r.award!.coins), [G, G, G, Math.floor(0.5 * G)]);
  // A market right after three counted rights in the square is still not faded.
  await syncPlayer(sql, "moe", snap, "moe-phone");
  for (let i = 0; i < 3; i++) await right(sql, "moe", `pl${i}`, lamp, m.startsAt - (4 - i) * MIN);
  assert.equal(marketMult(CITY, m.startsAt - 4 * MIN - 5000, spot), 1);
  const late = await right(sql, "moe", "mk", lamp, open[0]!);
  assert.equal(faded(late), false);
  assert.equal(late.award!.coins, 2 * G);
  assert.match(await gradeDetail(sql, "moe", "mk"), /"mk":1/);

  // --- Comet: the comet vault inside its window. A second token on the same comet pays as a plain green vault.
  const cw = cometWindow(CITY, T0) + 1;
  const comet = cometOfWindow(CITY, cw)!;
  const cs = cometStart(CITY, cw);
  assert.equal(cityDay(CITY, cs), cityDay(CITY, cs + 20 * MIN));
  const cSquare = districtOf(CITY, comet.lat, comet.lng);
  assert.notEqual(cSquare, "");
  const cPay: Partial<Pay> = { poiTier: COMET_TIER, clearTier: COMET_TIER };
  // Half-minute steps, all while no night market reaches the comet's spot.
  const ct = (i: number) => cs + i * 30_000;
  for (let i = 1; i <= 8; i++) assert.equal(marketMult(CITY, ct(i) - 5000, { kind: "lamp", poiId: comet.id, lat: comet.lat, lng: comet.lng }), 1);
  await syncPlayer(sql, "cal", snap, "cal-phone");
  const ev = [];
  for (let i = 0; i < 3; i++) ev.push(await right(sql, "cal", `ev${i}`, comet, ct(i + 1), cPay));
  for (let i = 0; i < 3; i++) {
    assert.ok(ev[i]!.award!.boosts.includes(COMET_TAG));
    assert.equal(faded(ev[i]!), false);
    assert.match(await gradeDetail(sql, "cal", `ev${i}`), /"ev":1/);
    assert.doesNotMatch(await gradeDetail(sql, "cal", `ev${i}`), /"fb"|"mk"/);
  }
  assert.equal(ev[2]!.award!.coins, ev[1]!.award!.coins);
  assert.equal(rightsInSquare(await gradeRows(sql, "cal"), cSquare), 0);
  // 3 comet + 1 normal in that square => the normal one pays full; three normal later, the 4th is half.
  const green = [];
  for (let i = 0; i < 4; i++) green.push(await right(sql, "cal", `gr${i}`, comet, ct(i + 4), { ...cPay, cometSpent: true }));
  assert.deepEqual(green.map(faded), [false, false, false, true]);
  assert.equal(green[2]!.award!.coins, green[1]!.award!.coins);
  assert.equal(green[3]!.award!.coins, Math.floor(0.5 * green[1]!.award!.coins));
  for (let i = 0; i < 4; i++) assert.doesNotMatch(await gradeDetail(sql, "cal", `gr${i}`), /"ev"/);
  // A Comet clear after three counted rights in the square is still not faded.
  const evLate = await right(sql, "cal", "ev-late", comet, ct(8), cPay);
  assert.equal(faded(evLate), false);
  assert.equal(evLate.award!.coins, ev[1]!.award!.coins);

  // --- Hearth: a placed vault in the camped square (single, and both steps of a Double).
  const hearth: Poi = { ...A1, id: "placed-abc123" };
  await syncPlayer(sql, "hal", snap, "hal-phone");
  const hh = [
    await right(sql, "hal", "hh0", hearth, T0 + MIN),
    await right(sql, "hal", "hh1", hearth, T0 + 2 * MIN, { hearth: { v: 2, step: 0 } }),
    await right(sql, "hal", "hh2", hearth, T0 + 3 * MIN, { hearth: { v: 2, step: 1 } }),
    await right(sql, "hal", "hh3", hearth, T0 + 4 * MIN, { hearth: { v: 3, step: 2 } }),
  ];
  assert.deepEqual(hh.map(faded), [false, false, false, false]);
  for (let i = 0; i < 4; i++) {
    assert.match(await gradeDetail(sql, "hal", `hh${i}`), /"hh":1/);
    assert.doesNotMatch(await gradeDetail(sql, "hal", `hh${i}`), /"fb"/);
  }
  assert.equal(rightsInSquare(await gradeRows(sql, "hal"), SQUARE), 0);
  // 3 hearth + 1 normal => the normal one pays full; the 4th normal is half; a Hearth right after that is not faded.
  const lamps = [];
  for (let i = 0; i < 4; i++) lamps.push(await right(sql, "hal", `pl${i}`, A1, T0 + (5 + i) * MIN));
  assert.deepEqual(lamps.map(faded), [false, false, false, true]);
  assert.deepEqual(lamps.map((r) => r.award!.coins), [G, G, G, Math.floor(0.5 * G)]);
  const hhLate = await right(sql, "hal", "hh-late", hearth, T0 + 10 * MIN);
  assert.equal(faded(hhLate), false);
  assert.equal(hhLate.award!.coins, hh[0]!.award!.coins - (Number(/\+(\d+)$/.exec(freshLine(hh[0]!) ?? "+0")![1]) || 0));
  // A plain lamp right carries no hh.
  assert.doesNotMatch(await gradeDetail(sql, "hal", "pl0"), /"hh"/);
});

test("a wrong answer, a timeout and a spark do not count", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const base = await coinsOf(sql, "ann");
  const r1 = await right(sql, "ann", "r1", A1, T0);
  const wrong = await right(sql, "ann", "w1", A1, T0 + MIN, { correct: false, mult: 0 });
  const r2 = await right(sql, "ann", "r2", A1, T0 + 2 * MIN);
  const late = await right(sql, "ann", "w2", A1, T0 + 3 * MIN, { correct: false, mult: 0, timedOut: true });
  const wrong2 = await right(sql, "ann", "w3", A1, T0 + 4 * MIN, { correct: false, mult: 0 });
  // A spark: a right answer with no key spent. It pays a key, never coin, and carries no square.
  const spark = await right(sql, "ann", "s1", A1, T0 + 5 * MIN, { clearTier: null, poiTier: "white" });
  const spark2 = await right(sql, "ann", "s2", A2, T0 + 6 * MIN, { clearTier: null, poiTier: "white" });
  for (const r of [wrong, late, wrong2, spark, spark2]) {
    assert.equal(r.award?.coins ?? 0, 0);
    assert.equal(faded(r), false);
  }
  for (const n of ["w1", "w2", "w3"]) {
    assert.match(await gradeDetail(sql, "ann", n), /"g":"miss"/);
    assert.doesNotMatch(await gradeDetail(sql, "ann", n), /"d":|"fb"/);
  }
  for (const n of ["s1", "s2"]) {
    assert.match(await gradeDetail(sql, "ann", n), /"sp":1/);
    assert.doesNotMatch(await gradeDetail(sql, "ann", n), /"d":|"fb"/, "a spark's grade row carries no square");
  }
  assert.equal(rightsInSquare(await gradeRows(sql, "ann"), SQUARE), 2, "seven grade rows, two counted rights");
  // The 3rd right is still full (five other cards came before it), the 4th is half.
  const r3 = await right(sql, "ann", "r3", A1, T0 + 7 * MIN);
  assert.equal(faded(r3), false);
  assert.equal(r3.award!.coins, G);
  const r4 = await right(sql, "ann", "r4", A1, T0 + 8 * MIN);
  assert.equal(faded(r4), true);
  assert.equal(await coinsOf(sql, "ann"), base + r1.award!.coins + r2.award!.coins + G + Math.floor(0.5 * G));
  // A wrong answer in a faded square is a plain miss; a spark there is not faded either.
  const w = await right(sql, "ann", "w4", A1, T0 + 9 * MIN, { correct: false, mult: 0 });
  assert.equal(faded(w), false);
  assert.doesNotMatch(await gradeDetail(sql, "ann", "w4"), /"fb"/);
  const s = await right(sql, "ann", "s3", B, T0 + 10 * MIN, { clearTier: null, poiTier: "white" });
  assert.equal(faded(s), false);
  // A walked-away card never reaches the grade write: its key is refunded under refund:<nonce>, not grade:<nonce>.
  const apply = src("./walletApply.ts");
  assert.match(apply, /op_key = \$\{"refund:" \+ nonce\}/);
  assert.match(apply, /const district = full\.correct && full\.clearTier \? districtOf\(full\.city, full\.lat, full\.lng\) : "";/);
});

test("ward circuit lights, holiday stamps, sunday drive and meet transfers are not vault rights: never counted, never faded", async () => {
  const sql = await db(["0019_sunday_drive.sql"]);
  await syncPlayer(sql, "ann", snap, "ann-phone");
  // Three rights at the Ward Circuit's first lamp today: its square is one right short of fading.
  const route = wardRouteAt(CITY, T0);
  assert.ok(route.length > 0);
  const stop = CITIES[CITY].pois.find((p) => p.id === route[0]!.id)!;
  const square = districtOf(CITY, stop.lat, stop.lng);
  for (let i = 0; i < 6; i++) assert.equal(strayPays({ city: CITY, poiId: stop.id, dealtAt: T0 + i * MIN - 5000 }, T0 + i * MIN), null);
  const count = async () => rightsInSquare(await gradeRows(sql, "ann"), square);
  const others = async () => (await keyList(sql, "ann")).filter((k) => !k.startsWith("grade:") && !k.startsWith("sync"));
  const start = await others();
  // Reach-only things first: none of them writes a grade row or a square.
  const light = await applyClientOp(sql, "ann", { kind: "ward", city: CITY, lamp: stop.id, lat: stop.lat, lng: stop.lng } as ClientOp, { now: T0 });
  assert.equal(light.ok, true);
  assert.equal(faded(light), false);
  const OPEN = Date.UTC(2026, 11, 13, 18);
  const dressed = holidayRoute(CITY)[0]!;
  const stamp = await holidayStamp(sql, "ann", { city: CITY, lamp: dressed.id, lat: dressed.lat, lng: dressed.lng }, OPEN);
  assert.equal(stamp.ok, true);
  assert.equal(faded(stamp), false);
  // Sunday Drive keeps its own meter on the real clock: two honest pings eight seconds apart cross a whole km.
  const REAL = Date.now() - 60_000;
  await sundayPing(sql, "ann", { mode: "walk", meters: 500 }, REAL);
  const km = await sundayPing(sql, "ann", { mode: "walk", meters: 500 }, REAL + 8000);
  assert.equal(km.award?.coins, SUNDAY_COIN);
  const made = (await others()).filter((k) => !start.includes(k));
  assert.ok(made.some((k) => k.startsWith("ward:")), made.join());
  assert.ok(made.some((k) => k.startsWith("lights")), made.join());
  assert.ok(made.some((k) => k.startsWith("sd:")), made.join());
  assert.deepEqual(await gradeRows(sql, "ann"), [], "no grade row from a light, a stamp or a Sunday km");
  const { id } = await canonicalWallet(sql, "ann");
  for (const r of await sql<{ op_key: string; detail: string | null }>`select op_key, detail from wallet_ledger where user_id = ${id}`) {
    assert.doesNotMatch(String(r.detail ?? ""), /"d":"-?\d+:-?\d+"/, r.op_key);
  }
  assert.equal(await count(), 0);
  // Even a row of those families that somehow carried a counted right's whole detail is not read: only grade: rows are.
  const copy = JSON.stringify({ coins: 95, keys: {}, boosts: [], g: "great", t: "blue", ql: 1, pv: "", pi: stop.id, c: CITY, d: square });
  const at = new Date(T0).toISOString();
  const keys = [`ward:${CITY}:x`, `ward-done:${CITY}:x`, "lights:x", "sd:2026-06-10:9", meetLeaveKey("x"), meetCollectKey("x"), "meetback:x", `stray:${CITY}:1`];
  for (const k of keys) {
    assert.equal(k.startsWith("grade:"), false, k);
    await sql`insert into wallet_ledger (user_id, op_key, detail, created_at) values (${id}, ${k}, ${copy}, ${at})`;
  }
  assert.deepEqual([meetLeaveKey("x"), meetCollectKey("x")], ["meet:x", "meetget:x"]);
  // So the first three vault rights at that route lamp are full (they count like any street-lamp right)...
  const got = [];
  for (let i = 1; i <= 3; i++) got.push(await right(sql, "ann", `n${i}`, stop, T0 + i * MIN));
  assert.deepEqual(got.map(faded), [false, false, false]);
  assert.equal(await count(), 3);
  // ...and with the square now fading, a light, a stamp and a Sunday km pay exactly what they always do.
  const again = await applyClientOp(sql, "ann", { kind: "ward", city: CITY, lamp: stop.id, lat: stop.lat, lng: stop.lng } as ClientOp, { now: T0 + 4 * MIN });
  assert.equal(faded(again), false);
  await sundayPing(sql, "ann", { mode: "walk", meters: 500 }, REAL + 16_000);
  const km2 = await sundayPing(sql, "ann", { mode: "walk", meters: 500 }, REAL + 24_000);
  assert.equal(km2.award?.coins, SUNDAY_COIN);
  assert.equal(faded(km2), false);
  assert.equal(await count(), 3, "still three");
  const r4 = await right(sql, "ann", "n4", stop, T0 + 5 * MIN);
  assert.equal(faded(r4), true, "the 4th vault right at the route lamp fades like any other");
  // The count reads grade rows and nothing else; none of those features' code knows the fade.
  const apply = src("./walletApply.ts");
  const fn = apply.slice(apply.indexOf("async function squareRightsToday("), apply.indexOf("/** 0.1.00: market lights this account bought"));
  assert.match(fn, /op_key like \$\{"grade:%"\} and op_key <> \$\{"grade:" \+ nonce\}/);
  assert.equal([...fn.matchAll(/op_key like/g)].length, 1);
  for (const f of ["./wardCircuit.ts", "./holidayLights.ts", "./sundayDrive.ts", "./meetDrop.ts", "./meetService.ts", "./radioHop.ts"]) assert.doesNotMatch(src(f), /fade|FADE_|rightsInSquare/i, f);
  assert.equal([...apply.matchAll(/full\.fade = /g)].length, 1, "one place sets the fade: awardGrade");
});

test("fade covers the stray extra: total = floor(0.5 × (G+S))", async () => {
  const sql = await db();
  // The first stray window after T0 that fields a lamp.
  let w = strayWindow(CITY, T0) + 1;
  while (!strayOfWindow(CITY, w)) w++;
  const lamp = strayOfWindow(CITY, w)!;
  const s = strayStart(CITY, w), e = strayEnd(CITY, w);
  assert.equal(cityDay(CITY, s - 15 * MIN), cityDay(CITY, e));
  const S = strayBonus(TIER_VALUE[TIER]);
  assert.equal(S, 45);
  assert.equal((G + S) % 2, 0);
  assert.equal(G % 2 === 1 && S % 2 === 1, true, "both odd: floor(G/2) + floor(S/2) is one short of floor((G+S)/2)");
  await syncPlayer(sql, "ann", snap, "ann-phone");
  // Three rights at that lamp before it wakes (no extra: the window is closed).
  for (let i = 1; i <= 3; i++) {
    const r = await right(sql, "ann", `n${i}`, lamp, s - (15 - i) * MIN);
    assert.equal(r.award!.boosts.some((b) => b.startsWith("Stray")), false);
  }
  const before = await coinsOf(sql, "ann");
  const keysBefore = await keysOf(sql, "ann");
  // The 4th, inside the window: faded, and the stray extra fades with it as one total.
  const r4 = await right(sql, "ann", "n4", lamp, s + 2 * MIN);
  assert.equal(faded(r4), true);
  assert.equal(r4.award!.coins, Math.floor(0.5 * (G + S)));
  assert.equal(r4.award!.coins, 70);
  assert.notEqual(r4.award!.coins, Math.floor(0.5 * G) + Math.floor(0.5 * S), "not the sum of two floors (69)");
  assert.ok(r4.award!.boosts.includes(strayLine(Math.floor(S / 2))), "the stray line shows what it added");
  assert.equal(await coinsOf(sql, "ann"), before + 70);
  const d = JSON.parse(await gradeDetail(sql, "ann", "n4")) as { coins: number; fb?: number; sy?: number };
  assert.deepEqual([d.coins, d.fb, d.sy], [70, 1, 1]);
  // The window's one claim is taken as usual, and keys are what an unfaded clear pays.
  assert.ok((await keyList(sql, "ann")).includes(strayKey(CITY, w)));
  await syncPlayer(sql, "bob", snap, "bob-phone");
  // (One earlier right there, so the square is not new for the day.)
  await right(sql, "bob", "b0", lamp, s - 14 * MIN);
  const bob = await right(sql, "bob", "b1", lamp, s + 2 * MIN);
  assert.equal(faded(bob), false);
  assert.equal(bob.award!.coins, G + S, "the unfaded pair: G + S");
  assert.deepEqual(r4.award!.keys, bob.award!.keys);
  assert.equal(Object.values(await keysOf(sql, "ann")).reduce((a, b) => a + b, 0) - Object.values(keysBefore).reduce((a, b) => a + b, 0), Object.values(r4.award!.keys).reduce((a, b) => a + (b ?? 0), 0));
  // A 5th in the same window: the claim is spent, so it is the plain faded grade.
  const r5 = await right(sql, "ann", "n5", lamp, s + 4 * MIN);
  assert.equal(r5.award!.boosts.some((b) => b.startsWith("Stray")), false);
  assert.equal(r5.award!.coins, Math.floor(0.5 * G));
  // Other totals, on the two functions the server adds together (G from gradeGrant, the extra's half from withStray).
  const wallet = await walletOf(sql, "bob");
  const { now: _n, prevNonce: _p, ...p } = pay(lamp, s + 2 * MIN);
  void _n;
  void _p;
  for (const mult of [0.4, 0.7, 1]) {
    for (const x of [0, 15, 45, 135, 405, 1215, 3645]) {
      const g = gradeGrant(wallet, { ...p, mult }).award!.coins;
      const f = gradeGrant(wallet, { ...p, mult, fade: { extra: x } }).award!.coins;
      assert.equal(f + fadeCoin(x), Math.floor(0.5 * (g + x)), `mult ${mult} x ${x}`);
      assert.ok(f >= 0);
    }
  }
  const apply = src("./walletApply.ts");
  assert.match(apply, /if \(faded\) full\.fade = \{ extra: strayCoin \};/);
  assert.match(apply, /const coin = fbPaid \? fadeCoin\(strayCoin\) : strayCoin;/);
  assert.doesNotMatch(apply, /CARD-189, not built/);
});

test("streak prize unchanged by the fade", async () => {
  const sql = await db();
  // Normal pockets: the 5th right in a row pays its white key, faded or not.
  for (const who of ["camp", "roam"]) await syncPlayer(sql, who, snap, `${who}-phone`);
  for (let i = 1; i <= 4; i++) {
    await right(sql, "camp", `n${i}`, A1, T0 + i * MIN);
    // Two rights in each square, then a 3rd in the first: never faded, never New district on the 5th.
    await right(sql, "roam", `n${i}`, i <= 2 ? A1 : B, T0 + i * MIN);
  }
  const c5 = await right(sql, "camp", "n5", A1, T0 + 5 * MIN);
  const r5 = await right(sql, "roam", "n5", A1, T0 + 5 * MIN);
  assert.equal(faded(c5), true);
  assert.equal(faded(r5), false);
  assert.ok(c5.award!.boosts.includes("5 in a row") && r5.award!.boosts.includes("5 in a row"));
  assert.deepEqual(c5.award!.keys, r5.award!.keys, "the streak key and the key-back");
  assert.ok((c5.award!.keys.white ?? 0) >= 1);
  assert.equal(r5.award!.coins, G);
  assert.equal(c5.award!.coins, Math.floor(0.5 * G));
  // The prize is keys only (payMatchesOf never pays coin; a full pocket settles into merge credits), so there is no
  // prize coin for the fade to touch. Full pockets: the same keys land, faded or not.
  assert.equal(payMatchesOf((await walletOf(sql, "roam")).keys, "white", 1).coin, 0);
  const packed: LocalSnap = { ...snap, keys: { white: 30, blue: 30, green: 30, amber: 30, red: 30, violet: 30 } };
  for (const who of ["camp2", "roam2"]) await syncPlayer(sql, who, packed, `${who}-phone`);
  for (let i = 1; i <= 4; i++) {
    await right(sql, "camp2", `n${i}`, A1, T0 + i * MIN);
    await right(sql, "roam2", `n${i}`, i <= 2 ? A1 : B, T0 + i * MIN);
  }
  assert.deepEqual(await keysOf(sql, "camp2"), await keysOf(sql, "roam2"));
  const c = await right(sql, "camp2", "n5", A1, T0 + 5 * MIN);
  const r = await right(sql, "roam2", "n5", A1, T0 + 5 * MIN);
  assert.equal(faded(c), true);
  assert.equal(faded(r), false);
  assert.deepEqual(c.award!.keys, r.award!.keys);
  assert.deepEqual(await keysOf(sql, "camp2"), await keysOf(sql, "roam2"));
  assert.equal(c.award!.coins, Math.floor(0.5 * r.award!.coins), "half of the grade's coin, key-overflow coin included");
  // The order in the code: the fade is inside gradeGrant; the prize is added after it, untouched.
  const apply = src("./walletApply.ts");
  const block = apply.slice(apply.indexOf("if (streakTier && grant.ok) {"), apply.indexOf("return withV2l(withStray({ ...grant, detail }));"));
  assert.doesNotMatch(block, /fade/i);
});

test("the faded row replays: same nonce, same award, nothing new", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const first = [];
  for (let i = 1; i <= 4; i++) first.push(await right(sql, "ann", `n${i}`, A1, T0 + i * MIN));
  assert.equal(faded(first[3]!), true);
  const coins = await coinsOf(sql, "ann");
  const rows = (await keyList(sql, "ann")).length;
  const detail = await gradeDetail(sql, "ann", "n4");
  // The faded 4th again: the stored row.
  const again = await awardGrade(sql, "ann", "n4", pay(A1, T0 + 4 * MIN));
  assert.equal(again.replay, true);
  assert.deepEqual(again.award, first[3]!.award);
  // ...also the next city day, when a new grade there would be full.
  const tomorrow = await awardGrade(sql, "ann", "n4", pay(A1, T0 + 26 * HOUR));
  assert.equal(tomorrow.replay, true);
  assert.deepEqual(tomorrow.award, first[3]!.award);
  // An unfaded row replayed after the square started fading stays unfaded: nothing is recounted.
  for (const [i, n] of ["n1", "n2", "n3"].entries()) {
    const r = await awardGrade(sql, "ann", n, pay(A1, T0 + 9 * MIN));
    assert.equal(r.replay, true);
    assert.deepEqual(r.award, first[i]!.award);
    assert.equal(faded(r), false);
  }
  assert.equal(await coinsOf(sql, "ann"), coins);
  assert.equal((await keyList(sql, "ann")).length, rows);
  assert.equal(await gradeDetail(sql, "ann", "n4"), detail);
  // A replay does not count twice either: the next new right is the 5th, and the count is 4, not 9.
  assert.equal(rightsInSquare(await gradeRows(sql, "ann"), SQUARE), 4);
  // A grade never counts its own row: the 3rd right sent twice at once is one full row, not a faded one.
  await syncPlayer(sql, "bob", snap, "bob-phone");
  for (let i = 1; i <= 2; i++) await right(sql, "bob", `n${i}`, A1, T0 + i * MIN);
  const twin = await Promise.all([awardGrade(sql, "bob", "n3", pay(A1, T0 + 3 * MIN)), awardGrade(sql, "bob", "n3", pay(A1, T0 + 3 * MIN))]);
  assert.deepEqual(twin.map(faded), [false, false]);
  assert.doesNotMatch(await gradeDetail(sql, "bob", "n3"), /"fb"/);
  assert.equal(JSON.parse(await gradeDetail(sql, "bob", "n3")).coins, G);
});

test("fading-block count cannot be incremented from the client", async () => {
  const sql = await db(["0001_auth.sql", "0002_vault_clears.sql", "0004_plate_stats.sql", "0015_paint_finds.sql"]);
  // 1. No op, schema or request field carries the fade, a count or a square.
  const apply = src("./walletApply.ts");
  const ops = apply.slice(apply.indexOf("export type ClientOp"), apply.indexOf("export async function applyClientOp("));
  assert.doesNotMatch(ops, /kind: "(grade|fade|fading)[^"]*"|\bfade\??:|rightsInSquare/, "no ClientOp names it, and none is a grade");
  for (const f of ["./walletApi.ts", "./triviaSchema.ts", "./triviaApi.ts", "./triviaService.ts", "./walletClient.ts", "../components/keyline/WalletSync.tsx", "../components/keyline/VaultModal.tsx"]) {
    assert.doesNotMatch(src(f), /fade\??:|FADE_|fadeCoin|fadeDue|rightsInSquare|"fb"|\bfb:/, f);
  }
  const forged = { fade: { extra: 0 }, faded: false, fb: 0, hh: 1, mk: 1, ev: 1, d: "9:9", district: "9:9", count: 0, rights: 0, now: T0, freshDistrict: true };
  assert.deepEqual(Object.keys(GradeIn.parse({ token: "t".repeat(40), choice: "x", clientMs: 900, ...forged })).sort(), ["choice", "clientMs", "token"]);
  const dealPay = { streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: A1.lat, lng: A1.lng };
  const SAVE = "11111111-2222-3333-4444-555555555555";
  const dealIn = DealIn.parse({ city: CITY, cat: "local", poiId: A1.id, windowMs: 25000, seen: [], saveId: SAVE, ...forged, pay: { ...dealPay, ...forged } });
  for (const k of Object.keys(forged)) {
    assert.ok(!(k in dealIn), k);
    assert.ok(!(k in (dealIn.pay ?? {})), `pay.${k}`);
  }
  // The grade the service hands to the wallet is built field by field from the sealed token; it names no fade.
  const svc = src("./triviaService.ts");
  const call = svc.slice(svc.indexOf("const awarded = await awardGrade("), svc.indexOf("canRoll:"));
  assert.doesNotMatch(call, /fade|\.\.\.input|\.\.\.body|\.\.\.req/);
  // And awardGrade rebuilds the pay itself: a `fade` handed in is dropped, a real one is found on its own.
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const lie = await right(sql, "ann", "n1", A1, T0, { fade: { extra: 0 } });
  assert.equal(faded(lie), false, "a fade passed in does not fade");
  assert.doesNotMatch(await gradeDetail(sql, "ann", "n1"), /"fb"/);
  const built = apply.slice(apply.indexOf("const full: GradePay = {"), apply.indexOf("// 0.0.93: answer streak from the server's own grade rows"));
  assert.doesNotMatch(built, /fade|\.\.\.pay\b/);
  // 2. Made-up wallet ops and a forged sync write no grade row and move no count.
  const before = await keyList(sql, "ann");
  const bad = [
    { kind: "grade", nonce: "n9", city: CITY, d: SQUARE, correct: true },
    { kind: "fade", city: CITY, district: SQUARE, count: 0 },
    { kind: "fading-block", reset: true },
    { kind: "ward", city: CITY, lamp: A1.id, lat: A1.lat, lng: A1.lng, d: SQUARE, fb: 0, fade: false },
  ];
  for (const op of bad) {
    try {
      const r = await applyClientOp(sql, "ann", op as unknown as ClientOp, { now: T0 });
      assert.equal(faded(r), false);
    } catch {
      /* an unknown op may throw: either way nothing is written */
    }
  }
  await syncPlayer(sql, "ann", { ...snap, fade: false, rights: {}, districts: { [SQUARE]: 0 }, fadingBlock: { [SQUARE]: 0 } } as unknown as LocalSnap, "ann-phone");
  await syncPlayer(sql, "ann", { ...snap, fade: false } as unknown as LocalSnap, "ann-tablet");
  const after = await keyList(sql, "ann");
  assert.deepEqual(after.filter((k) => k.startsWith("grade:")), ["grade:n1"]);
  assert.deepEqual(after.filter((k) => !before.includes(k)).filter((k) => k.startsWith("grade:")), []);
  assert.equal(rightsInSquare(await gradeRows(sql, "ann"), SQUARE), 1);
  // 3. Through the real deal and grade service: three rights on the ledger, then a 4th whose request denies it.
  for (let i = 2; i <= 3; i++) await right(sql, "ann", `n${i}`, A1, T0 + i * MIN);
  resetGradeRing();
  const BANK: TriviaQ[] = [
    sealPlate({ q: "Which river runs through Austin?", choices: ["Colorado", "Brazos", "Pecos", "Trinity"], answer: "Colorado", diff: 1 }),
    sealPlate({ q: "How many stories is the UT Tower?", choices: ["14", "21", "27", "33"], answer: "27", diff: 2 }),
  ];
  const all = new Map<string, TriviaQ>();
  for (const c of BANK) {
    all.set(c.id, c);
    all.set(publicCardId(c), c);
  }
  const clock = { t: T0 + 4 * MIN };
  let nonce = 0;
  const deps: TriviaDeps = {
    now: () => clock.t,
    secret: "test-secret",
    pick: () => ({ ...BANK[nonce % 2]!, rarity: A1.tier }),
    card: (cid) => all.get(cid) ?? null,
    namedPoi: (c, pid) => CITIES[c as CityId]?.pois.find((p) => p.id === pid) ?? null,
    sql: async () => sql,
    rand: () => 0.42,
    nonce: () => `fb-${++nonce}`,
  };
  const rightOf = (c: { choices: string[] }) => c.choices.find((x) => x === "Colorado" || x === "27")!;
  const play = async (who: string, lamp: Poi, extra: Record<string, unknown> = {}) => {
    // The request names another square's coordinates too: a named lamp is graded at its own baked spot.
    const d = await dealFor(deps, { userId: who }, DealIn.parse({ city: CITY, cat: "local", poiId: lamp.id, windowMs: 25000, seen: [], saveId: SAVE, pay: { ...dealPay, lat: B.lat, lng: B.lng, ...extra }, ...extra }));
    assert.ok(d.ok, `${who}: dealt`);
    if (!d.ok) throw new Error("no deal");
    clock.t += 4000;
    const g = await grade(deps, { userId: who }, { token: d.token, choice: rightOf(d.card), clientMs: 3900, ...extra } as never);
    assert.ok(g.ok && g.correct, `${who}: right`);
    if (!g.ok) throw new Error("no grade");
    return g;
  };
  const fourth = await play("ann", A1, forged);
  assert.equal(faded(fourth as never), true, "the server's own three rows fade the 4th, whatever the request says");
  const row = (await gradeRows(sql, "ann")).find((r) => r.includes('"fb":1'))!;
  assert.match(row, new RegExp(`"d":"${SQUARE}"`), "graded in the lamp's own square, not the one the request named");
  // A first right with a request that claims a fade, a count and a flag: full.
  await syncPlayer(sql, "eve", snap, "eve-phone");
  const honest = await play("eve", A1, { ...forged, fade: { extra: 0 }, faded: true, fb: 1, count: 99, rights: 99 });
  assert.equal(faded(honest as never), false);
  assert.deepEqual((await gradeRows(sql, "eve")).filter((r) => r.includes('"fb"')), []);
  // 4. A guest has no server wallet: no award from the server, no row, nothing to count.
  const gd = await dealFor(deps, { userId: null }, DealIn.parse({ city: CITY, cat: "local", poiId: A1.id, windowMs: 25000, seen: [], saveId: SAVE, pay: dealPay }));
  assert.ok(gd.ok);
  if (gd.ok) {
    const gg = await grade(deps, { userId: null }, { token: gd.token, choice: rightOf(gd.card), clientMs: 900 });
    assert.ok(gg.ok);
    if (gg.ok) assert.equal(gg.award, undefined, "no server award for a guest");
  }
  // An account that never synced has no wallet on the server: nothing is faded, nothing is paid.
  const ghost = await awardGrade(sql, "ghost", "g4", pay(A1, T0 + 9 * MIN));
  assert.equal(faded(ghost), false);
});

test("client: text only. One Field Guide line, the label rides the server award, guests are not faded, no art or CSS", () => {
  assert.equal(
    FADE_GUIDE,
    "Fading block: signed in, after your 3rd right vault in one 800 m square on a city day, the 4th and every later one there pays half coin (keys, your streak and the perfect-answer key-back are unchanged). Night-market, Comet and Hearth vaults do not count and are never faded. A drive to another square pays full again, and so does the next city day.",
  );
  const guide = src("../components/keyline/FieldGuide.tsx");
  assert.match(guide, /import \{ FADE_GUIDE \} from "@\/game\/district";/);
  assert.equal([...guide.matchAll(/<li>\{FADE_GUIDE\}<\/li>/g)].length, 1);
  // The reward card already lists the server award's boosts, so the label needs no UI code of its own.
  const store = src("./store.ts");
  assert.match(store, /points: award\.coins \+ \(contractDone \? 1500 : 0\),\n\s*keys,\n\s*boosts: award\.boosts\.length \? award\.boosts : undefined,/);
  assert.match(src("../components/keyline/LootToast.tsx"), /loot\.boosts\.map\(\(b\) => \(/);
  // The guest payout (this device only) is untouched: no fade there.
  assert.doesNotMatch(store, /FADE_|fadeCoin|fadeDue|rightsInSquare|Fading block/);
  // Nothing drawn: no stylesheet, pin or component names it.
  for (const f of ["../styles.css", "./pins.ts", "../components/keyline/GameMap.tsx", "../components/keyline/Hud.tsx", "../components/keyline/LootToast.tsx"]) assert.doesNotMatch(src(f), /fading|FADE_/i, f);
});

test("version: the 0.1.187 / k1187a changelog line, the test entry, and no migration", () => {
  // 0.1.188: the live version moved on; the current-version pins live in the newest slice's test.
  const v = src("../version.ts");
  assert.match(v, /\n\/\/ 0\.1\.187: Fading block — [^\n]*\(k1187a\)\.\n/);
  const pkg = JSON.parse(src("../../package.json")) as { version: string; scripts: { test: string } };
  assert.match(pkg.scripts.test, / src\/game\/fadingBlock0187\.test\.ts /);
  // No migration: 0021 (Meet you there) is still the newest, and no migration knows the fade.
  const migs = readdirSync(new URL("../../migrations/", import.meta.url)).filter((f) => f.endsWith(".sql")).sort();
  assert.equal(migs.at(-1), "0021_meet_drops.sql");
  for (const f of migs) assert.doesNotMatch(mig(f), /fade|fading/i, f);
  assert.doesNotMatch(src("./district.ts"), /migration 00|create table/);
  // The Stray lamp's note about the fade is now a true one.
  assert.match(src("./walletApply.ts"), /Fade \(0\.1\.187 Fading block, CARD-189\): when the grade is faded the extra fades with it as one total/);
});
