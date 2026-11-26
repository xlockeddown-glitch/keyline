// 0.1.184 Ward Circuit (CARD-185): a daily cross-town trail. Once per city per city-local day the server seeds four
// street lamps in four different 800 m districts, every pair within 6,000 m. Any order, two hours from the first
// light, 200 coin for all four, no keys. The device only says "I am at this lamp, here"; the route, the clock, the
// lights and the pay are the server's (`ward:` / `ward-done:` ledger rows, no migration). Nothing here touches the
// network.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { z } from "zod";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { CITIES, CITY_LIST } from "./data.ts";
import { COIN_CAP, type LocalSnap } from "./wallet.ts";
import { applyClientOp, syncPlayer, wardLight, wardOf, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { DAILY_JITTER_MS, DAILY_MAX_MS, DAILY_MIN_SEP_M, DAILY_REACH_M, dailyTopSpeed, spotFloorMs } from "./dailyRun.ts";
import { DISTRICT_M, districtOf, districtsInDetails } from "./district.ts";
import { distM } from "./geo.ts";
import { holidayMarketLamp } from "./holidayLights.ts";
import { CITY_TZ } from "./sky.ts";
import { sundayCeiling } from "./sundayDrive.ts";
import { cityDay } from "./vaultStack.ts";
import type { CityId } from "./types";
import {
  WARD_COIN, WARD_LAMPS, WARD_SPREAD_M, WARD_WINDOW_MS,
  wardCheck, wardDoneKey, wardEligible, wardFinishLine, wardFinished, wardFloorMs, wardFromRows, wardGoalLine, wardLeftText, wardLightKey, wardLightLine,
  wardPick, wardRoute, wardRouteAt, wardSeed, wardText, wardView, type WardCity, type WardPoolLamp,
} from "./wardCircuit.ts";
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
async function db() {
  const pg = new PGlite();
  opened.push(pg);
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const walletOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet;
const coinsOf = async (sql: Sql, user: string) => (await walletOf(sql, user)).coins;
const rowsOf = async (sql: Sql, user: string) =>
  (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${(await canonicalWallet(sql, user)).id} order by op_key`).map((r) => r.op_key).filter((k) => k.startsWith("ward"));
const allWard = async (sql: Sql) => (await sql<{ op_key: string }>`select op_key from wallet_ledger order by op_key`).map((r) => r.op_key).filter((k) => k.startsWith("ward:") || k.startsWith("ward-done:"));

const CITY: CityId = "austin";
// The server reads the last two days of ledger rows, so the test clock sits at noon today in the test city: every
// time used below (the same day, the 2-hour window, the city's midnight, tomorrow) is within a day of the real clock.
const REAL = Date.now();
const hourAt = (ms: number) => Number(new Intl.DateTimeFormat("en-US", { timeZone: CITY_TZ[CITY], hour: "numeric", hourCycle: "h23" }).format(ms));
let noon = Math.floor(REAL / 3_600_000) * 3_600_000;
// Twice so a clock change between now and noon still lands on 12:00 local.
for (let i = 0; i < 2; i++) noon += (12 - hourAt(noon)) * 3_600_000;
const T0 = noon;
const DAY = cityDay(CITY, T0);
const ROUTE = wardRoute(CITY, DAY);
const MIN = 60_000;
/** Ten minutes between lights: far above any travel floor on a 6 km circuit, and four of them fit the window. */
const STEP = 10 * MIN;
const at = (i: number, city: CityId = CITY, now: number = T0) => {
  const l = wardRouteAt(city, now)[i]!;
  return { city, lamp: l.id, lat: l.lat, lng: l.lng };
};
const CITY_IDS = CITY_LIST.map((c) => c.id);
const days = (n: number, from = Date.UTC(2026, 10, 20)) => Array.from({ length: n }, (_, d) => new Date(from + d * 86_400_000).toISOString().slice(0, 10));
const pairs = <T,>(xs: readonly T[]) => xs.flatMap((a, i) => xs.slice(i + 1).map((b) => [a, b] as const));

// Synthetic pools: lamps on a line east of a centre, `m` metres out, each in the district it is given.
const C = { lat: 30, lng: -97 };
const east = (m: number) => ({ lat: C.lat, lng: C.lng + m / (111_320 * Math.cos((C.lat * Math.PI) / 180)) });
const lamp = (id: string, m: number, district: string): WardPoolLamp => ({ id, name: id, ...east(m), district });

test("constants: 4 lamps, 200 coin, a 2-hour window, a 6,000 m spread, the Daily Run's own separation and reach", () => {
  assert.equal(WARD_LAMPS, 4);
  assert.equal(WARD_COIN, 200);
  assert.equal(WARD_WINDOW_MS, 2 * 60 * 60_000);
  assert.equal(WARD_WINDOW_MS, DAILY_MAX_MS);
  assert.equal(WARD_SPREAD_M, 6000);
  assert.equal(DAILY_MIN_SEP_M, 400);
  assert.equal(DAILY_REACH_M, 170);
  assert.equal(DISTRICT_M, 800);
  assert.equal(ROUTE.length, 4, "the test city fields a circuit today");
});

test("route: every city, every day sampled has 4 lamps in 4 different districts, every pair 400 m to 6,000 m apart, none of the excluded kinds, never a market lamp", () => {
  for (const c of CITY_IDS) {
    const city = CITIES[c];
    let moved = 0;
    let prev = "";
    for (const day of days(60)) {
      const r = wardRoute(c, day);
      assert.ok(r.length === 0 || r.length === WARD_LAMPS, `${c} ${day}: four or none`);
      // Today every bundled city fields a circuit every day; a city that could not would have none (never a short one).
      assert.equal(r.length, WARD_LAMPS, `${c} ${day}`);
      assert.equal(new Set(r.map((l) => l.id)).size, 4);
      assert.equal(new Set(r.map((l) => districtOf(c, l.lat, l.lng))).size, 4, `${c} ${day}: four different districts`);
      for (const [a, b] of pairs(r)) {
        const d = distM(a.lat, a.lng, b.lat, b.lng);
        assert.ok(d <= WARD_SPREAD_M, `${c} ${day}: ${a.id} to ${b.id} is ${Math.round(d)} m`);
        assert.ok(d >= DAILY_MIN_SEP_M, `${c} ${day}: ${a.id} to ${b.id} is ${Math.round(d)} m`);
      }
      for (const l of r) {
        const p = city.pois.find((x) => x.id === l.id)!;
        assert.ok(p, "a baked poi of this city");
        assert.ok(p.kind !== "shop" && p.kind !== "station" && p.kind !== "counter" && p.kind !== "board" && !p.printShop, `${c}: ${p.id} is a plain street lamp`);
        assert.notEqual(districtOf(c, l.lat, l.lng), "");
        assert.equal(holidayMarketLamp(c, l), false, `${c}: ${l.id} can never stand on a night market`);
      }
      const sig = r.map((l) => l.id).sort().join(",");
      if (prev && sig !== prev) moved++;
      prev = sig;
    }
    assert.ok(moved > 30, `${c}: the set changes from day to day (${moved}/59)`);
  }
});

test("route: a pure function of (city, cityDay) — the same all day, the city's own midnight turns it, and the seed is keyline-ward-circuit|city|day", () => {
  assert.notEqual(wardSeed("austin", "2026-11-26"), wardSeed("austin", "2026-11-27"));
  assert.notEqual(wardSeed("austin", "2026-11-26"), wardSeed("nyc", "2026-11-26"));
  assert.match(src("./wardCircuit.ts"), /hash32\(`keyline-ward-circuit\|\$\{city\}\|\$\{day\}`\)/);
  for (const c of CITY_IDS) {
    const day = cityDay(c, T0);
    assert.deepEqual(wardRouteAt(c, T0), wardRoute(c, day));
    assert.deepEqual(wardRoute(c, day), wardRoute(c, day), "deterministic");
    assert.deepEqual(
      wardPick(wardEligible(c), wardSeed(c, day), CITIES[c].spawn).map((l) => l.id),
      wardRoute(c, day).map((l) => l.id),
      "the cached route is the selector over the city's pool",
    );
  }
  // 05:59 and 06:01 UTC on a winter day straddle Austin's midnight (CST, UTC-6) but not New York's or London's.
  const before = Date.UTC(2026, 11, 2, 5, 59);
  const after = Date.UTC(2026, 11, 2, 6, 1);
  assert.equal(cityDay("austin", before), "2026-12-01");
  assert.equal(cityDay("austin", after), "2026-12-02");
  assert.deepEqual(wardRouteAt("austin", before), wardRoute("austin", "2026-12-01"));
  assert.deepEqual(wardRouteAt("austin", after), wardRoute("austin", "2026-12-02"));
  assert.equal(cityDay("nyc", before), cityDay("nyc", after));
  assert.deepEqual(wardRouteAt("nyc", before), wardRouteAt("nyc", after));
  // Unknown cities and malformed days have no circuit.
  assert.deepEqual(wardRoute("nowhere" as CityId, "2026-12-01"), []);
  assert.deepEqual(wardRoute("austin", "today"), []);
  assert.deepEqual(wardRoute("constructor" as CityId, "2026-12-01"), []);
  assert.deepEqual(wardRouteAt("nowhere" as CityId, T0), []);
});

test("a lamp in a repeated district is not seeded", () => {
  // Six lamps in district a, one each in b, c, d: whatever the shuffle, the four picks are one per district.
  const pool = [
    ...[0, 1, 2, 3, 4, 5].map((i) => lamp(`a${i}`, i * 450, "0:0")),
    lamp("b", 3000, "0:4"),
    lamp("c", 3600, "0:5"),
    lamp("d", 4200, "0:5b"),
  ];
  for (let seed = 1; seed <= 300; seed++) {
    const r = wardPick(pool, seed, C);
    assert.equal(r.length, 4, `seed ${seed}`);
    assert.deepEqual(r.map((l) => l.district).sort(), ["0:0", "0:4", "0:5", "0:5b"], `seed ${seed}`);
    assert.equal(r.filter((l) => l.id.startsWith("a")).length, 1, `seed ${seed}: one lamp from the crowded district`);
  }
  // Lamps with no district are never seeded, and the input pool is not reordered.
  const idsBefore = pool.map((l) => l.id);
  const blank = [...pool.filter((l) => l.district !== "0:5b"), lamp("x", 4200, "")];
  assert.deepEqual(wardPick(blank, 7, C), []);
  assert.deepEqual(pool.map((l) => l.id), idsBefore);
  // The real routes too: no day, no city ever holds two lamps of one district.
  for (const c of CITY_IDS) for (const day of days(30)) assert.equal(new Set(wardRoute(c, day).map((l) => districtOf(c, l.lat, l.lng))).size, 4);
});

test("a set that cannot fit within ~6 km is not offered", () => {
  // Four districts, but d is 6,400 m from a: no set of four fits, so there is no circuit (never three lamps).
  const far = [lamp("a", 0, "0:0"), lamp("b", 2000, "0:2"), lamp("c", 4000, "0:5"), lamp("d", 6400, "0:8")];
  for (let seed = 1; seed <= 100; seed++) assert.deepEqual(wardPick(far, seed, C), [], `seed ${seed}`);
  // The same four with d pulled in to 5,900 m is a circuit.
  const near = [...far.slice(0, 3), lamp("d", 5900, "0:7")];
  for (let seed = 1; seed <= 100; seed++) assert.deepEqual(wardPick(near, seed, C).map((l) => l.id), ["a", "b", "c", "d"], `seed ${seed}: nearest-next from the centre`);
  // A fifth district out of range never drags the set past the bound: the far lamp is simply left out.
  const mixed = [...near, lamp("e", 9000, "0:11")];
  for (let seed = 1; seed <= 100; seed++) {
    const r = wardPick(mixed, seed, C);
    assert.equal(r.length, 4);
    for (const [p, q] of pairs(r)) assert.ok(distM(p.lat, p.lng, q.lat, q.lng) <= WARD_SPREAD_M, `seed ${seed}`);
    assert.ok(!r.some((l) => l.id === "e"));
  }
  // The search backs up: with a0 first, only a1 completes a set, and it is found.
  const back = [lamp("a0", -3000, "0:-4"), lamp("a1", 0, "0:0"), lamp("b", 2000, "0:2"), lamp("c", 4000, "0:5"), lamp("d", 5900, "0:7")];
  for (let seed = 1; seed <= 100; seed++) {
    const r = wardPick(back, seed, C);
    assert.equal(r.length, 4, `seed ${seed}`);
    for (const [p, q] of pairs(r)) assert.ok(distM(p.lat, p.lng, q.lat, q.lng) <= WARD_SPREAD_M);
  }
  // Lamps closer than the Daily Run's 400 m separation are not paired either.
  const tight = [lamp("a", 0, "0:0"), lamp("b", 300, "0:1"), lamp("c", 2000, "0:2"), lamp("d", 4000, "0:5")];
  for (let seed = 1; seed <= 50; seed++) assert.deepEqual(wardPick(tight, seed, C), []);
});

test("a downtown-only set is not offered: a single-district pool, or three districts, has no circuit", () => {
  const downtown = Array.from({ length: 12 }, (_, i) => lamp(`d${i}`, i * 60, "0:0"));
  const three = [...downtown, lamp("n1", 1500, "0:2"), lamp("n2", 2500, "0:3")];
  for (let seed = 1; seed <= 100; seed++) {
    assert.deepEqual(wardPick(downtown, seed, C), [], `single district, seed ${seed}`);
    assert.deepEqual(wardPick(three, seed, C), [], `three districts, seed ${seed}`);
  }
  assert.deepEqual(wardPick([], 1, C), []);
  // The fourth district makes it a circuit.
  assert.equal(wardPick([...three, lamp("n3", 3500, "0:4")], 5, C).length, 4);
  // The real pool is the whole city, not the Daily Run's downtown ring: every real route leaves the spawn's own square.
  for (const c of CITY_IDS) assert.ok(new Set(wardEligible(c).map((l) => l.district)).size >= 4, c);
});

test("a 4-district finish pays 200 once", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const base = await walletOf(sql, "ann");
  // Any order: 2, 0, 3, 1.
  const order = [2, 0, 3, 1];
  for (let n = 0; n < 4; n++) {
    const now = T0 + n * STEP;
    const r = await wardLight(sql, "ann", at(order[n]!), now);
    assert.equal(r.ok, true, `light ${n + 1}`);
    assert.equal(r.replay, false);
    const w: WardCity = r.ward![CITY]!;
    assert.equal(w.day, DAY);
    assert.equal(w.startedAt, T0, "the window opened at the first light, on the server's clock");
    assert.deepEqual(w.lit, ROUTE.filter((_, i) => order.slice(0, n + 1).includes(i)).map((l) => l.id), "route order, whatever order they were lit in");
    if (n < 3) {
      // No coin delta and no key delta on a light.
      assert.equal(r.award?.coins, 0);
      assert.deepEqual(r.award?.keys, {});
      assert.deepEqual(r.award?.boosts, [`Ward Circuit · lamp ${n + 1}/4`]);
      assert.equal(w.done, false);
      const mid = await walletOf(sql, "ann");
      assert.equal(mid.coins, base.coins);
      assert.deepEqual(mid.keys, base.keys);
    } else {
      assert.equal(r.award?.coins, 200);
      assert.deepEqual(r.award?.keys, {}, "no keys");
      assert.deepEqual(r.award?.boosts, ["Ward Circuit · lamp 4/4", "Ward Circuit +200 coin"]);
      assert.equal(w.done, true);
      assert.equal(r.view.coins, base.coins + 200, "the reply carries the paid wallet");
    }
  }
  const end = await walletOf(sql, "ann");
  assert.equal(end.coins, base.coins + 200);
  assert.deepEqual(end.keys, base.keys, "the finish pays no keys");
  assert.deepEqual(await rowsOf(sql, "ann"), [`ward-done:${CITY}:${DAY}`, ...ROUTE.map((l) => `ward:${CITY}:${DAY}:${l.id}`)].sort());
  // Each light row is a zero delta carrying the server's clock; the finish row is exactly 200.
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${"ann"} and op_key like ${"ward%"}`;
  for (const r of rows) {
    const d = JSON.parse(r.detail || "{}") as { _d?: unknown; coins?: number; keys?: object; wd?: number; at?: number };
    if (r.op_key.startsWith("ward-done:")) {
      assert.equal(d.coins, 200);
      assert.deepEqual(d.keys, {});
    } else {
      assert.equal(d.wd, 1);
      assert.ok(typeof d.at === "number" && d.at >= T0 && d.at <= T0 + 3 * STEP);
      assert.equal(d._d, undefined, "no coin, no keys moved");
      assert.equal(d.coins, undefined);
    }
  }
  // Another city the same day is its own circuit and its own 200.
  const other = CITY_IDS.find((c) => c !== CITY)!;
  for (let i = 0; i < 4; i++) assert.equal((await wardLight(sql, "ann", at(i, other), T0 + i * STEP)).ok, true);
  assert.equal(await coinsOf(sql, "ann"), base.coins + 400);
  assert.equal((await wardOf(sql, "ann", T0 + 4 * STEP))[other]!.done, true);
  // The finish goes through the usual COIN_CAP path.
  await syncPlayer(sql, "max", snap, "max-phone");
  await sql`update player_wallets set coins = ${COIN_CAP - 10} where user_id = ${"max"}`;
  for (let i = 0; i < 4; i++) await wardLight(sql, "max", at(i), T0 + i * STEP);
  assert.equal(await coinsOf(sql, "max"), COIN_CAP);
  assert.equal((await wardOf(sql, "max", T0 + 4 * STEP))[CITY]!.done, true);
  // A linked sign-in is the same player: the same lights, one finish.
  await syncPlayer(sql, "kim", snap, "kim-phone");
  const kb = await coinsOf(sql, "kim");
  await sql`insert into player_links (alias_id, primary_id, how) values (${"kim-x"}, ${"kim"}, ${"test"})`;
  for (let i = 0; i < 4; i++) await wardLight(sql, i % 2 ? "kim-x" : "kim", at(i), T0 + i * STEP);
  assert.equal(await coinsOf(sql, "kim"), kb + 200);
  assert.deepEqual(await wardOf(sql, "kim-x", T0 + 4 * STEP), await wardOf(sql, "kim", T0 + 4 * STEP));
});

test("a 3-lamp route pays 0", async () => {
  const sql = await db();
  await syncPlayer(sql, "bea", snap, "bea-phone");
  const base = await coinsOf(sql, "bea");
  for (let i = 0; i < 3; i++) assert.equal((await wardLight(sql, "bea", at(i), T0 + i * STEP)).ok, true);
  assert.equal(await coinsOf(sql, "bea"), base);
  assert.deepEqual((await wardOf(sql, "bea", T0 + 3 * STEP))[CITY], { day: DAY, lit: ROUTE.slice(0, 3).map((l) => l.id), startedAt: T0, done: false });
  assert.ok(!(await rowsOf(sql, "bea")).some((k) => k.startsWith("ward-done:")));
  // Relighting the three, any number of times, is still three and still 0.
  for (let n = 0; n < 3; n++) for (let i = 0; i < 3; i++) await wardLight(sql, "bea", at(i), T0 + 3 * STEP + n * MIN);
  assert.equal(await coinsOf(sql, "bea"), base);
  assert.equal((await rowsOf(sql, "bea")).length, 3);
  assert.equal(wardFinished(ROUTE, ROUTE.slice(0, 3).map((l, i) => ({ lamp: l.id, at: T0 + i }))), false);
  assert.equal(wardFinished(ROUTE.slice(0, 3), ROUTE.slice(0, 3).map((l, i) => ({ lamp: l.id, at: T0 + i }))), false, "a three-lamp route can never finish");
});

test("a second finish the same city day pays 0", async () => {
  const sql = await db();
  await syncPlayer(sql, "cal", snap, "cal-phone");
  const base = await coinsOf(sql, "cal");
  for (let i = 0; i < 4; i++) await wardLight(sql, "cal", at(i), T0 + i * STEP);
  assert.equal(await coinsOf(sql, "cal"), base + 200);
  const rows = await rowsOf(sql, "cal");
  // Every lamp again, later the same day, inside and outside the window, and at once from two devices.
  for (const later of [T0 + 4 * STEP, T0 + WARD_WINDOW_MS + MIN, T0 + 6 * 3_600_000]) {
    for (let i = 0; i < 4; i++) {
      const r = await wardLight(sql, "cal", at(i), later);
      assert.equal(r.ok, false);
      assert.equal(r.reason, "done");
      assert.equal(r.award, undefined);
      assert.equal(r.ward![CITY]!.done, true);
    }
  }
  await Promise.all([0, 1, 2, 3, 0, 1, 2, 3].map((i) => wardLight(sql, "cal", at(i), T0 + 5 * STEP)));
  assert.equal(await coinsOf(sql, "cal"), base + 200);
  assert.deepEqual(await rowsOf(sql, "cal"), rows);
  // A race on the last light pays once.
  await syncPlayer(sql, "dee", snap, "dee-phone");
  const db0 = await coinsOf(sql, "dee");
  for (let i = 0; i < 3; i++) await wardLight(sql, "dee", at(i), T0 + i * STEP);
  const race = await Promise.all([1, 2, 3, 4, 5].map(() => wardLight(sql, "dee", at(3), T0 + 3 * STEP)));
  assert.equal(race.filter((r) => (r.award?.coins ?? 0) > 0).length, 1, "one reply carries the 200");
  assert.equal(await coinsOf(sql, "dee"), db0 + 200);
});

test("lapsed window cannot be restarted the same city day", async () => {
  const sql = await db();
  await syncPlayer(sql, "eve", snap, "eve-phone");
  const base = await coinsOf(sql, "eve");
  assert.equal((await wardLight(sql, "eve", at(0), T0)).ok, true);
  assert.equal((await wardLight(sql, "eve", at(1), T0 + STEP)).ok, true);
  const rows = await rowsOf(sql, "eve");
  // The window closes two hours after the first light. From then on every light that day is refused: the lamps
  // already lit, the ones never lit, hours later too. No new window opens and no new set is seeded.
  for (const later of [T0 + WARD_WINDOW_MS + 1, T0 + WARD_WINDOW_MS + STEP, T0 + 5 * 3_600_000, T0 + 11 * 3_600_000]) {
    assert.equal(cityDay(CITY, later), DAY, "still the same city day");
    assert.deepEqual(wardRouteAt(CITY, later), ROUTE, "the same four lamps: no new set that day");
    for (let i = 0; i < 4; i++) {
      const r = await wardLight(sql, "eve", at(i), later);
      assert.equal(r.ok, false, `lamp ${i + 1} at +${Math.round((later - T0) / MIN)} min`);
      assert.equal(r.reason, "expired");
      assert.equal(r.award, undefined);
      assert.deepEqual(r.ward![CITY], { day: DAY, lit: ROUTE.slice(0, 2).map((l) => l.id), startedAt: T0, done: false }, "the window start never moves");
    }
  }
  assert.deepEqual(await rowsOf(sql, "eve"), rows, "nothing written after the lapse");
  assert.equal(await coinsOf(sql, "eve"), base, "the unfinished circuit pays 0");
  // The view the HUD and the Journal show.
  const w = await wardOf(sql, "eve", T0 + WARD_WINDOW_MS + 1);
  assert.deepEqual(wardView(w, CITY, T0 + WARD_WINDOW_MS + 1), { n: 2, phase: "lapsed", leftMs: 0 });
  assert.equal(wardText(wardView(w, CITY, T0 + WARD_WINDOW_MS + 1)!), "Ward Circuit 2/4 · lapsed");
  // The pure rule: with a first light on record, any light past first + window is "expired", whichever lamp.
  const lit = [{ lamp: ROUTE[0]!.id, at: T0 }];
  for (let i = 0; i < 4; i++) {
    const l = ROUTE[i]!;
    assert.deepEqual(wardCheck(CITY, l.id, l.lat, l.lng, T0 + WARD_WINDOW_MS + 1, lit, false), { ok: false, reason: "expired" });
  }
});

test("a light after the two-hour window does not count and pays 0", async () => {
  const sql = await db();
  await syncPlayer(sql, "fay", snap, "fay-phone");
  const base = await coinsOf(sql, "fay");
  for (let i = 0; i < 3; i++) await wardLight(sql, "fay", at(i), T0 + i * STEP);
  // The fourth lamp one millisecond late: refused, not counted, not paid.
  const late = await wardLight(sql, "fay", at(3), T0 + WARD_WINDOW_MS + 1);
  assert.equal(late.ok, false);
  assert.equal(late.reason, "expired");
  assert.equal(late.ward![CITY]!.lit.length, 3);
  assert.equal(late.ward![CITY]!.done, false);
  assert.equal(await coinsOf(sql, "fay"), base);
  assert.equal((await rowsOf(sql, "fay")).length, 3);
  // Exactly at the two-hour mark is still inside.
  await syncPlayer(sql, "gus", snap, "gus-phone");
  const gb = await coinsOf(sql, "gus");
  for (let i = 0; i < 3; i++) await wardLight(sql, "gus", at(i), T0 + i * STEP);
  const edge = await wardLight(sql, "gus", at(3), T0 + WARD_WINDOW_MS);
  assert.equal(edge.ok, true);
  assert.equal(edge.award?.coins, 200);
  assert.equal(await coinsOf(sql, "gus"), gb + 200);
  // Even a row that somehow sits outside the window never completes a finish.
  const four = ROUTE.map((l, i) => ({ lamp: l.id, at: T0 + i * STEP }));
  assert.equal(wardFinished(ROUTE, four), true);
  assert.equal(wardFinished(ROUTE, [...four.slice(0, 3), { lamp: ROUTE[3]!.id, at: T0 + WARD_WINDOW_MS + 1 }]), false);
});

test("next city-day reseeds and a new attempt is allowed", async () => {
  const sql = await db();
  await syncPlayer(sql, "hal", snap, "hal-phone");
  const base = await coinsOf(sql, "hal");
  // Today: two lights, then the window lapses.
  await wardLight(sql, "hal", at(0), T0);
  await wardLight(sql, "hal", at(1), T0 + STEP);
  assert.equal((await wardLight(sql, "hal", at(2), T0 + WARD_WINDOW_MS + MIN)).reason, "expired");
  // Tomorrow noon in the city: its own day, its own route, a fresh attempt that can be finished and paid.
  const T1 = T0 + 24 * 3_600_000;
  const day1 = cityDay(CITY, T1);
  assert.notEqual(day1, DAY);
  const route1 = wardRoute(CITY, day1);
  assert.equal(route1.length, 4);
  assert.deepEqual(wardRouteAt(CITY, T1), route1);
  assert.equal(wardSeed(CITY, day1) === wardSeed(CITY, DAY), false, "a new seed");
  // Yesterday's lights are not today's progress.
  assert.equal((await wardOf(sql, "hal", T1))[CITY], undefined);
  assert.deepEqual(wardView(await wardOf(sql, "hal", T1), CITY, T1), { n: 0, phase: "idle", leftMs: WARD_WINDOW_MS });
  for (let i = 0; i < 4; i++) {
    const r = await wardLight(sql, "hal", at(i, CITY, T1), T1 + i * STEP);
    assert.equal(r.ok, true, `tomorrow's lamp ${i + 1}`);
    assert.equal(r.ward![CITY]!.day, day1);
    assert.equal(r.ward![CITY]!.startedAt, T1);
  }
  assert.equal(await coinsOf(sql, "hal"), base + 200);
  assert.ok((await rowsOf(sql, "hal")).includes(wardDoneKey(CITY, day1)));
  assert.ok(!(await rowsOf(sql, "hal")).includes(wardDoneKey(CITY, DAY)), "yesterday's unfinished circuit was never paid");
  // A finished day, then the next day: paid again, once per city day.
  await syncPlayer(sql, "ida", snap, "ida-phone");
  const ib = await coinsOf(sql, "ida");
  for (let i = 0; i < 4; i++) await wardLight(sql, "ida", at(i), T0 + i * STEP);
  for (let i = 0; i < 4; i++) await wardLight(sql, "ida", at(i, CITY, T1), T1 + i * STEP);
  assert.equal(await coinsOf(sql, "ida"), ib + 400);
});

test("a window never carries across the city's midnight: a light after midnight is judged against the new day's route", async () => {
  const sql = await db();
  await syncPlayer(sql, "jo", snap, "jo-phone");
  const base = await coinsOf(sql, "jo");
  const eve = T0 + 11.5 * 3_600_000; // 23:30 in the city
  const morn = T0 + 12 * 3_600_000 + 10 * MIN; // 00:10 the next day, 40 minutes into the "window"
  assert.equal(cityDay(CITY, eve), DAY);
  const day1 = cityDay(CITY, morn);
  assert.notEqual(day1, DAY);
  const route1 = wardRoute(CITY, day1);
  assert.equal((await wardLight(sql, "jo", at(0), eve)).ok, true);
  assert.equal((await wardLight(sql, "jo", at(1), eve + 10 * MIN)).ok, true);
  // After midnight yesterday's lamps are only lightable if today's route happens to hold them, and then as today's.
  for (const l of ROUTE.filter((x) => !route1.some((y) => y.id === x.id))) {
    const r = await wardLight(sql, "jo", { city: CITY, lamp: l.id, lat: l.lat, lng: l.lng }, morn);
    assert.equal(r.reason, "route");
  }
  assert.equal((await wardOf(sql, "jo", morn))[CITY], undefined, "nothing of yesterday's is carried over");
  const first = await wardLight(sql, "jo", at(0, CITY, morn), morn);
  assert.equal(first.ok, true);
  assert.deepEqual(first.ward![CITY], { day: day1, lit: [route1[0]!.id], startedAt: morn, done: false }, "the first light of a new attempt");
  // Yesterday's two plus today's lights never add up to yesterday's finish.
  for (let i = 1; i < 3; i++) await wardLight(sql, "jo", at(i, CITY, morn), morn + i * STEP);
  assert.equal(await coinsOf(sql, "jo"), base);
  assert.equal((await wardLight(sql, "jo", at(3, CITY, morn), morn + 3 * STEP)).award?.coins, 200);
  assert.deepEqual((await rowsOf(sql, "jo")).filter((k) => k.startsWith("ward-done:")), [wardDoneKey(CITY, day1)]);
  assert.match(src("./walletApply.ts"), /a window\s+\*\s+never carries across the city's midnight: a light after midnight is judged against the NEW day's route/);
});

test("lights are reach-only (no vault answer required): no grade row, no district detail, never counted as a district-fresh row", async () => {
  const sql = await db();
  await syncPlayer(sql, "kay", snap, "kay-phone");
  const before = (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${"kay"}`).map((r) => r.op_key);
  // The op is a city, a lamp and a spot: there is no answer, token, card or grade in it, and all four light anyway.
  for (let i = 0; i < 4; i++) {
    const op: ClientOp = { kind: "ward", ...at(i) };
    assert.deepEqual(Object.keys(op).sort(), ["city", "kind", "lamp", "lat", "lng"]);
    assert.equal((await applyClientOp(sql, "kay", op, { now: T0 + i * STEP })).ok, true);
  }
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${"kay"}`;
  const added = rows.filter((r) => !before.includes(r.op_key));
  assert.equal(added.length, 5, "four lights and one finish, nothing else");
  for (const r of added) {
    assert.match(r.op_key, /^ward(-done)?:/);
    assert.doesNotMatch(r.op_key, /^grade:/);
    assert.doesNotMatch(r.detail, /"d":"|"c":"|"g":"/, "no district, city or grade field");
  }
  // The district counts read grade rows' details; a circuit light is neither.
  assert.deepEqual(districtsInDetails(added.map((r) => r.detail)), []);
  assert.equal(rows.filter((r) => r.op_key.startsWith("grade:")).length, 0);
  // The light writer takes no trivia input and touches no grade path.
  const apply = src("./walletApply.ts");
  const body = apply.slice(apply.indexOf("export async function wardLight("), apply.indexOf("/** `clock.now` is the server's own time"));
  assert.ok(body.length > 500);
  assert.doesNotMatch(body, /token|openToken|grade|triviaDeps|districtsToday|freshDistrict|keys: \{ ?\w/);
  assert.match(body, /detail: JSON\.stringify\(\{ wd: 1, at: now \}\)/);
  // A light from within the Daily Run's reach of the lamp counts wherever the walker stands in it.
  await syncPlayer(sql, "lee", snap, "lee-phone");
  const l = ROUTE[0]!;
  const off = (m: number) => ({ city: CITY, lamp: l.id, lat: l.lat + m / 111_320, lng: l.lng });
  assert.equal((await wardLight(sql, "lee", off(DAILY_REACH_M - 2), T0)).ok, true);
});

test("far rejected: a spot farther than the Daily Run's reach from the lamp lights nothing", async () => {
  const sql = await db();
  await syncPlayer(sql, "moe", snap, "moe-phone");
  const l = ROUTE[0]!;
  const spots = [
    { lat: l.lat + (DAILY_REACH_M + 5) / 111_320, lng: l.lng },
    { lat: CITIES[CITY].spawn.lat + 0.5, lng: CITIES[CITY].spawn.lng },
    { lat: ROUTE[1]!.lat, lng: ROUTE[1]!.lng }, // standing at another circuit lamp
    { lat: 0, lng: 0 },
    { lat: Number.NaN, lng: l.lng },
  ];
  for (const s of spots) {
    const r = await wardLight(sql, "moe", { city: CITY, lamp: l.id, ...s }, T0);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "far");
    assert.equal(r.award, undefined);
  }
  assert.deepEqual(await rowsOf(sql, "moe"), []);
  assert.deepEqual(await wardOf(sql, "moe", T0), {}, "a refused light does not open the window");
  // A far claim after an honest first light is refused too, and the honest light stands.
  assert.equal((await wardLight(sql, "moe", at(0), T0)).ok, true);
  assert.equal((await wardLight(sql, "moe", { ...at(1), lat: l.lat, lng: l.lng }, T0 + STEP)).reason, "far");
  assert.equal((await rowsOf(sql, "moe")).length, 1);
});

test("teleport (too-fast) rejected: a light sooner after another than the straight line allows is refused, an honest drive is not", async () => {
  // The two lamps of today's route that sit farthest apart.
  const [a, b] = pairs(ROUTE).sort((p, q) => distM(q[0].lat, q[0].lng, q[1].lat, q[1].lng) - distM(p[0].lat, p[0].lng, p[1].lat, p[1].lng))[0]!;
  const spot = (l: { id: string; lat: number; lng: number }) => ({ city: CITY, lamp: l.id, lat: l.lat, lng: l.lng });
  const top = sundayCeiling("drive", []);
  const floor = wardFloorMs(a, b, top) - DAILY_JITTER_MS;
  assert.ok(floor > 1000, `today's widest leg has a real floor (${floor} ms)`);
  const sql = await db();
  await syncPlayer(sql, "ned", snap, "ned-phone");
  const base = await coinsOf(sql, "ned");
  assert.equal((await wardLight(sql, "ned", spot(a), T0)).ok, true);
  // The same instant, a second later, one millisecond short of the floor: all refused, nothing written.
  for (const dt of [0, 1000, floor - 1]) {
    const r = await wardLight(sql, "ned", spot(b), T0 + dt);
    assert.equal(r.ok, false, `+${dt} ms`);
    assert.equal(r.reason, "fast");
    assert.equal(r.award, undefined);
    assert.deepEqual(r.ward![CITY]!.lit, [a.id]);
  }
  assert.deepEqual(await rowsOf(sql, "ned"), [wardLightKey(CITY, DAY, a.id)]);
  // At the floor it lights: an honest arrival is never refused, and the refusals cost nothing.
  assert.equal((await wardLight(sql, "ned", spot(b), T0 + floor)).ok, true);
  assert.equal(await coinsOf(sql, "ned"), base);
  // Teleporting through all four in one second pays nothing: only the first light lands.
  await syncPlayer(sql, "oz", snap, "oz-phone");
  const ob = await coinsOf(sql, "oz");
  const far = ROUTE.filter((l) => l.id !== a.id).every((l) => wardFloorMs(a, l, top) - DAILY_JITTER_MS > 300);
  await wardLight(sql, "oz", spot(a), T0);
  let n = 1;
  for (const l of ROUTE.filter((x) => x.id !== a.id)) if ((await wardLight(sql, "oz", spot(l), T0 + 100 * n++)).ok && far) assert.fail(`${l.id} lit 100 ms later`);
  assert.equal((await wardLight(sql, "oz", spot(b), T0 + 300)).reason, "fast");
  assert.equal(await coinsOf(sql, "oz"), ob);
  assert.ok(!(await rowsOf(sql, "oz")).some((k) => k.startsWith("ward-done:")));
  // Two devices at once: of an impossible pair written in the same instant, only one light stays.
  await syncPlayer(sql, "pat", snap, "pat-phone");
  await Promise.all([wardLight(sql, "pat", spot(a), T0), wardLight(sql, "pat", spot(b), T0)]);
  assert.equal((await rowsOf(sql, "pat")).length, 1);
  // A light row whose write never finished (claimed, no server time) is repaired by the next visit, not stuck.
  await syncPlayer(sql, "quin", snap, "quin-phone");
  await sql`insert into wallet_ledger (user_id, op_key) values (${"quin"}, ${wardLightKey(CITY, DAY, a.id)})`;
  assert.deepEqual(await wardOf(sql, "quin", T0), {}, "a row with no server time is not a light");
  const fixed = await wardLight(sql, "quin", spot(a), T0 + MIN);
  assert.equal(fixed.ok, true);
  assert.deepEqual(fixed.ward![CITY], { day: DAY, lit: [a.id], startedAt: T0 + MIN, done: false });
  // The pure rule. The floor is the Daily Run's spotFloorMs (straight line, less 10%), timed at the fastest the
  // account can honestly move: a walk for wardFloorMs's default, the seated ceiling when it is handed one.
  assert.equal(wardFloorMs(a, b), spotFloorMs(a, b));
  assert.equal(wardFloorMs(a, b, dailyTopSpeed()), spotFloorMs(a, b));
  assert.equal(wardFloorMs(a, b, 1), spotFloorMs(a, b), "never tighter than the walk floor");
  assert.equal(wardFloorMs(a, b, Number.NaN), spotFloorMs(a, b));
  assert.equal(wardFloorMs(a, b, top), Math.floor((spotFloorMs(a, b) * dailyTopSpeed()) / top));
  assert.ok(wardFloorMs(a, b, top) < spotFloorMs(a, b), "a seated player may honestly beat a walk");
  const lit = [{ lamp: a.id, at: T0 }];
  assert.deepEqual(wardCheck(CITY, b.id, b.lat, b.lng, T0 + spotFloorMs(a, b) - DAILY_JITTER_MS - 1, lit, false), { ok: false, reason: "fast" });
  assert.equal(wardCheck(CITY, b.id, b.lat, b.lng, T0 + spotFloorMs(a, b) - DAILY_JITTER_MS, lit, false).ok, true);
  // Every earlier light is checked, not just the last one.
  const c = ROUTE.find((l) => l.id !== a.id && l.id !== b.id)!;
  const two = [{ lamp: a.id, at: T0 }, { lamp: c.id, at: T0 + STEP }];
  assert.equal(wardCheck(CITY, b.id, b.lat, b.lng, T0 + STEP + 3 * MIN, two, false).ok, true);
  assert.deepEqual(wardCheck(CITY, b.id, b.lat, b.lng, T0 + STEP, [{ lamp: c.id, at: T0 }, { lamp: a.id, at: T0 + STEP }], false), { ok: false, reason: "fast" });
  // The server times the floor at the cars the account really owns (ledger rows), never at anything the op says.
  const apply = src("./walletApply.ts");
  assert.match(apply, /const top = before\.length \? sundayCeiling\("drive", await carsOf\(sql, sessionUserId\)\) : 0;/);
});

test("guest refused: no wallet on the server means no light, no pay, nothing written", async () => {
  const api = src("./walletApi.ts");
  assert.match(api, /export const applyWallet = createServerFn\(\{ method: "POST" \}\)\s*\.middleware\(\[authMiddleware\]\)/);
  const client = src("./wardClient.ts");
  assert.match(client, /if \(!w \|\| !walletLive\(\) \|\| now < retryAt\) return;/);
  assert.match(src("./walletClient.ts"), /export async function commitWallet\(op: ClientOp\)[^\n]*\n\s*if \(!live\) return null;/);
  const sql = await db();
  for (let i = 0; i < 4; i++) {
    for (const r of [await wardLight(sql, "guest", at(i), T0 + i * STEP), await applyClientOp(sql, "guest", { kind: "ward", ...at(i) }, { now: T0 + i * STEP })]) {
      assert.equal(r.ok, false);
      assert.equal(r.reason, "sync");
      assert.equal(r.award, undefined);
      assert.equal(r.ward, undefined);
    }
  }
  assert.deepEqual(await allWard(sql), []);
  assert.equal(await coinsOf(sql, "guest"), 0);
});

test("ward-circuit progress cannot be incremented from the client", async () => {
  const sql = await db();
  await syncPlayer(sql, "ivy", snap, "ivy-phone");
  const base = await coinsOf(sql, "ivy");
  const ids = ROUTE.map((l) => l.id);
  // The wire schema is a city, a lamp and a spot. Zod strips anything else, so lit / count / done never reach the op.
  const api = src("./walletApi.ts");
  const fields = api.match(/z\.object\(\{ kind: z\.literal\("ward"\), ([^\n]*)/)?.[1] ?? "count";
  assert.deepEqual(fields.match(/\b\w+(?=: (?:z\.|City))/g), ["city", "lamp", "lat", "lng"]);
  assert.doesNotMatch(fields, /passthrough|strict|catchall|loose/);
  assert.match(api, /\.validator\(\(u: unknown\) => Op\.parse\(u\)\)/);
  assert.match(api, /const Op = z\.discriminatedUnion\("kind", \[/);
  // The same shape through zod itself: the extra keys are gone after the parse.
  const shape = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("ward"), city: z.string(), lamp: z.string().min(1).max(80), lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180) }),
  ]);
  const lie = { kind: "ward", ...at(0), lit: ids, count: 4, done: true, startedAt: T0, at: T0, now: T0, day: DAY, coins: 200 };
  assert.deepEqual(shape.parse(lie), { kind: "ward", ...at(0) });
  // Even handed straight to the apply layer, the extra fields do nothing: one honest light, no finish.
  const r = await applyClientOp(sql, "ivy", lie as unknown as ClientOp, { now: T0 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.ward, { [CITY]: { day: DAY, lit: [ids[0]], startedAt: T0, done: false } });
  assert.equal(await coinsOf(sql, "ivy"), base);
  // Replaying that payload, any number of times, moves nothing: the same lamp twice counts once.
  for (let n = 1; n <= 5; n++) {
    const again = await applyClientOp(sql, "ivy", lie as unknown as ClientOp, { now: T0 + n * MIN });
    assert.equal(again.ok, true);
    assert.equal(again.replay, true);
    assert.equal(again.award, undefined);
    assert.deepEqual(again.ward![CITY]!.lit, [ids[0]]);
    assert.equal(again.ward![CITY]!.startedAt, T0, "a replay does not move the window");
  }
  assert.deepEqual(await rowsOf(sql, "ivy"), [wardLightKey(CITY, DAY, ids[0]!)]);
  await Promise.all([1, 2, 3, 4].map(() => applyClientOp(sql, "ivy", { kind: "ward", ...at(0) }, { now: T0 + 6 * MIN })));
  assert.equal((await wardOf(sql, "ivy", T0 + 6 * MIN))[CITY]!.lit.length, 1);
  // A time inside the op is not the clock: with the server clock past the window the same honest-looking op is refused.
  const timed = { kind: "ward", ...at(1), now: T0, at: T0, startedAt: T0 + 3 * 3_600_000, clock: T0 } as unknown as ClientOp;
  assert.equal((await applyClientOp(sql, "ivy", timed, { now: T0 + WARD_WINDOW_MS + 1 })).reason, "expired");
  // Faked lamp ids and cities are refused.
  const other = CITY_IDS.find((c) => c !== CITY && !wardRouteAt(c, T0).some((l) => ids.includes(l.id)))!;
  for (const lampId of ["all", "*", "4", `${ids[1]},${ids[2]}`, `x:${ids[1]}`, `${DAY}:${ids[1]}`, "%", "_"]) {
    assert.equal((await applyClientOp(sql, "ivy", { kind: "ward", ...at(1), lamp: lampId }, { now: T0 + STEP })).reason, "route");
  }
  assert.equal((await applyClientOp(sql, "ivy", { kind: "ward", ...at(1), city: other }, { now: T0 + STEP })).reason, "route");
  assert.equal((await applyClientOp(sql, "ivy", { kind: "ward", ...at(1), city: "nowhere" as CityId }, { now: T0 + STEP })).reason, "route");
  assert.equal((await applyClientOp(sql, "ivy", { kind: "ward", ...at(1), city: "__proto__" as CityId }, { now: T0 + STEP })).reason, "route");
  // No wallet or save field carries it: a sync that claims lights moves nothing, on this device or a new one.
  const claim = { ...snap, ward: { [CITY]: { day: DAY, lit: ids, startedAt: T0, done: true } }, wardDone: [CITY], circuit: 4 } as unknown as LocalSnap;
  for (const dev of ["ivy-phone", "ivy-tablet"]) {
    const s = await syncPlayer(sql, "ivy", claim, dev);
    assert.equal(s.ward?.[CITY]?.lit.length ?? 1, 1);
    assert.notEqual(s.ward?.[CITY]?.done, true);
  }
  assert.equal(await coinsOf(sql, "ivy"), base);
  // Progress is the account's own ledger rows and nothing else: another player's rows do not count, and rows that
  // are not an exact light of today's route (wrong day, wrong city, off-route lamp, look-alike prefix, a row with
  // no server time) count for nothing.
  await syncPlayer(sql, "jon", snap, "jon-phone");
  for (let i = 0; i < 3; i++) await wardLight(sql, "jon", at(i), T0 + i * STEP);
  assert.equal((await wardOf(sql, "jon", T0 + 3 * STEP))[CITY]!.lit.length, 3);
  assert.equal((await wardOf(sql, "ivy", T0 + 3 * STEP))[CITY]!.lit.length, 1);
  const good = JSON.stringify({ wd: 1, at: T0 });
  const junk = [
    { op_key: `ward:${CITY}:${DAY}:nope`, detail: good },
    { op_key: `ward:${CITY}:2020-01-01:${ids[1]}`, detail: good },
    { op_key: `ward:${other}:${cityDay(other, T0)}:${ids[1]}`, detail: good },
    { op_key: `ward:${CITY}:${DAY}`, detail: good },
    { op_key: `wardx:${CITY}:${DAY}:${ids[1]}`, detail: good },
    { op_key: `ward:${CITY}:${DAY}:${ids[1]}:x`, detail: good },
    { op_key: `ward:${CITY}:${DAY}:${ids[2]}`, detail: "{}" },
    { op_key: `ward:${CITY}:${DAY}:${ids[2]}`, detail: JSON.stringify({ at: T0 }) },
    { op_key: `ward:${CITY}:${DAY}:${ids[3]}`, detail: "not json" },
    { op_key: `ward-done:${CITY}:2020-01-01`, detail: "" },
    { op_key: `ward-done:nowhere:${DAY}`, detail: "" },
    { op_key: `ward-done:${CITY}:${DAY}:x`, detail: "" },
  ];
  assert.deepEqual(wardFromRows(junk, T0), {});
  assert.deepEqual(
    wardFromRows([{ op_key: wardLightKey(CITY, DAY, ids[2]!), detail: JSON.stringify({ wd: 1, at: T0 + 5 }) }, { op_key: wardLightKey(CITY, DAY, ids[0]!), detail: good }, { op_key: wardLightKey(CITY, DAY, ids[0]!), detail: good }, ...junk], T0 + 10),
    { [CITY]: { day: DAY, lit: [ids[0], ids[2]], startedAt: T0, done: false } },
  );
  // A done row alone, with no light of today's, shows nothing; junk rows in the ledger never add up to a finish.
  assert.deepEqual(wardFromRows([{ op_key: wardDoneKey(CITY, DAY), detail: "" }], T0), {});
  for (const j of junk) await sql`insert into wallet_ledger (user_id, op_key, detail) values (${"ivy"}, ${j.op_key}, ${j.detail}) on conflict do nothing`;
  assert.equal((await wardOf(sql, "ivy", T0 + STEP))[CITY]!.lit.length, 1);
  await wardLight(sql, "ivy", at(1), T0 + STEP);
  await wardLight(sql, "ivy", at(2), T0 + 2 * STEP);
  assert.equal(await coinsOf(sql, "ivy"), base, "three real lights and any number of fakes pay 0");
  // One writer for each key, both inside wardLight; the client keeps no count of its own.
  const apply = src("./walletApply.ts");
  const code = apply.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
  assert.equal(code.match(/mutateWallet\(sql, sessionUserId, wardKey, /g)?.length, 1, "one light writer");
  assert.equal(code.match(/wardLightKey\(/g)?.length, 2, "the route's keys to read, and the one written");
  assert.equal(code.match(/wardDoneKey\(/g)?.length, 1, "one finish key");
  assert.doesNotMatch(code, /["'`]ward(-done)?:/, "no hand-written ward key outside the two key helpers");
  assert.match(apply, /if \(op\.kind === "ward"\) return wardLight\(sql, sessionUserId, \{ city: op\.city, lamp: op\.lamp, lat: op\.lat, lng: op\.lng \}, clock\.now \?\? Date\.now\(\)\);/);
  // applyWallet hands the ward op no clock at all, so the server's own Date.now() is the only time there is.
  assert.match(api, /applyClientOp\(await getSql\(\), context\.userId, data as ClientOp, data\.kind === "lights" \? \{ now: await holidayNow\(\) \} : \{\}\)/);
  const client = src("./wardClient.ts");
  assert.match(client, /commitWallet\(\{ kind: "ward", city, lamp, lat, lng \}\)/);
  assert.match(client, /if \(r\.ward\) useGame\.setState\(\{ ward: r\.ward \}\)/);
  assert.doesNotMatch(client, /ward:\s*\{\s*\[|lit:\s*\[|lit\.push|done:\s*true/);
  const store = src("./store.ts");
  assert.equal(store.match(/\bward: null,/g)?.length, 1);
  assert.doesNotMatch(store, /saved\?\.ward\b|ward: s\.ward|ward: get\(\)\.ward/);
  const syncUi = src("../components/keyline/WalletSync.tsx");
  assert.match(syncUi, /useGame\.setState\(\{ ward: null \}\)/);
  assert.match(syncUi, /useGame\.setState\(\{ ward: r\.ward \?\? \{\} \}\)/);
});

test("lines and client wiring: toasts, the HUD line, the lettered map pins on the Daily Run's pin, the Journal line, the guide line", () => {
  assert.equal(wardLightLine(3), "Ward Circuit · lamp 3/4");
  assert.equal(wardLightLine(9), "Ward Circuit · lamp 4/4");
  assert.equal(wardFinishLine(), "Ward Circuit +200 coin");
  assert.equal(wardLeftText(83 * MIN + 59_000), "1h 23m");
  assert.equal(wardLeftText(2 * 60 * MIN), "2h 0m");
  assert.equal(wardLeftText(23 * MIN), "23m");
  assert.equal(wardLeftText(30_000), "under 1m");
  // The HUD's one plain line, from the server's state.
  const ids = ROUTE.map((l) => l.id);
  assert.deepEqual(wardView({}, CITY, T0), { n: 0, phase: "idle", leftMs: WARD_WINDOW_MS });
  assert.equal(wardText(wardView({}, CITY, T0)!), "Ward Circuit 0/4");
  const open = { [CITY]: { day: DAY, lit: ids.slice(0, 2), startedAt: T0, done: false } };
  assert.equal(wardText(wardView(open, CITY, T0 + 37 * MIN)!), "Ward Circuit 2/4 · 1h 23m left");
  assert.equal(wardText(wardView(open, CITY, T0 + WARD_WINDOW_MS)!), "Ward Circuit 2/4 · under 1m left");
  assert.equal(wardText(wardView(open, CITY, T0 + WARD_WINDOW_MS + 1)!), "Ward Circuit 2/4 · lapsed");
  assert.equal(wardText(wardView({ [CITY]: { day: DAY, lit: ids, startedAt: T0, done: true } }, CITY, T0 + STEP)!), "Ward Circuit 4/4 · done");
  // Yesterday's state reads as a fresh day; a city with no circuit has no line at all.
  assert.equal(wardText(wardView({ [CITY]: { day: "2020-01-01", lit: ids, startedAt: 0, done: true } }, CITY, T0)!), "Ward Circuit 0/4");
  assert.equal(wardView(open, "nowhere" as CityId, T0), null);
  // The longest line is short enough for one chip on a 390 px phone (the chip row wraps, never overflows).
  assert.ok("Ward Circuit 3/4 · under 1m left".length <= 32);
  assert.match(wardGoalLine(wardView({}, CITY, T0)!), /^Ward Circuit 0\/4 · reach the four lettered lamps across town, any order, within 2 hours of the first, for 200 coin$/);
  assert.match(wardGoalLine(wardView(open, CITY, T0 + WARD_WINDOW_MS + 1)!), /^Ward Circuit 2\/4 · lapsed · the 2 hours ran out/);
  const hud = src("../components/keyline/Hud.tsx");
  assert.match(hud, /const wardNow = ward \? wardView\(ward, cityId, Date\.now\(\)\) : null;/);
  assert.match(hud, /\{wardNow \? \(\s*<span className="odo-chip tabular-nums" data-testid="hud-ward">\s*\{wardText\(wardNow\)\}/);
  assert.ok(hud.indexOf('data-testid="hud-ward"') > hud.indexOf('data-testid="hud-sunday"') && hud.indexOf('data-testid="hud-ward"') < hud.indexOf('<div className="hud-tool-row">'), "in the Sunday Drive chip row");
  // Map: the Daily Run's existing pin markup and classes, lettered, no route line, not interactive.
  const map = src("../components/keyline/GameMap.tsx");
  const paint = map.slice(map.indexOf("function paintCircuit()"), map.indexOf("function clearMarket()"));
  assert.match(paint, /if \(!L \|\| !map \|\| !st\.ward\) return;/);
  assert.match(paint, /if \(route\.length !== WARD_LAMPS \|\| mine\?\.done\) return;/);
  assert.match(paint, /html: `<div class="daily-pin\$\{mine\?\.lit\.includes\(lamp\.id\) \? " is-lit" : ""\}" data-testid="ward-pin" title="Ward Circuit lamp: \$\{lamp\.name\.replace\(\/"\/g, "&quot;"\)\}"><span>\$\{"ABCD"\[i\]\}<\/span><\/div>`,/);
  assert.match(paint, /iconSize: \[30, 30\],\n\s*iconAnchor: \[15, 44\],/);
  assert.match(paint, /interactive: false,/);
  assert.doesNotMatch(paint, /polyline|daily-route|is-next|<img|<svg|\$\{i \+ 1\}/);
  assert.match(map, /paintCircuit\(\);\n\s*\}, \[circuit, circuitDay, streets, cityId\]\);/);
  // The trigger sits right after Holiday Lights' check and is not gated on being on foot.
  assert.match(map, /checkHoliday\(st\.cityId[\s\S]{0,260}?\}\);\n[^\n]*\n\s*checkWard\(st\.cityId, \{ lat: pos\.current\.lat, lng: pos\.current\.lng \}, /);
  assert.doesNotMatch(src("./wardClient.ts").replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, ""), /seated/);
  // No new pin style: the stylesheet has no circuit rule, and the pin's own rules are the Daily Run's.
  const css = src("../styles.css");
  assert.doesNotMatch(css, /ward-pin|ward-circuit|hud-ward|journal-ward|\.circuit/);
  assert.match(css, /\.daily-pin\.is-lit \{/);
  // Journal and guide.
  const j = src("../components/keyline/WardJournal.tsx");
  assert.match(j, /const v = ward \? wardView\(ward, cityId, now\) : null;\n\s*if \(!v\) return null;/);
  assert.match(j, /data-testid="journal-ward"/);
  assert.match(j, /\{wardGoalLine\(v\)\}/);
  assert.match(src("../components/keyline/HqPanel.tsx"), /<HolidayJournal \/>\n\s*<WardJournal \/>/);
  assert.match(src("../components/keyline/FieldGuide.tsx"), /<li>Ward Circuit: signed in, each city sets \{WARD_LAMPS\} lettered lamps in \{WARD_LAMPS\} different districts every day/);
});

test("version: 0.1.184 / k1184a everywhere, and no migration for the circuit", () => {
  const v = src("../version.ts");
  assert.match(v, /APP_VERSION = "0\.1\.184"/);
  assert.match(v, /PUBLISH_STAMP = "k1184a"/);
  assert.match(v, /\n\/\/ 0\.1\.184: Ward Circuit — [^\n]*\(k1184a\)\.\n$/);
  const pkg = JSON.parse(src("../../package.json")) as { version: string; scripts: { test: string } };
  assert.equal(pkg.version, "0.1.184");
  assert.match(pkg.scripts.test, / src\/game\/wardCircuit0184\.test\.ts /);
  const lock = JSON.parse(src("../../package-lock.json")) as { version: string; packages: Record<string, { version?: string }> };
  assert.equal(lock.version, "0.1.184");
  assert.equal(lock.packages[""]!.version, "0.1.184");
  assert.doesNotMatch(src("./wardCircuit.ts"), /migration 00|create table/);
  assert.doesNotMatch(src("./walletApply.ts").slice(src("./walletApply.ts").indexOf("export async function wardOf("), src("./walletApply.ts").indexOf("/** `clock.now` is the server's own time")), /sunday_drive|radio_hop|create table|alter table/);
});
