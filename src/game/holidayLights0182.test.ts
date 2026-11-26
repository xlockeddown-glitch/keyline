// 0.1.182 Holiday Lights (CARD-188): a cross-town loop, [2026-12-12 00:00, 2027-01-03 00:00) America/Chicago. One
// route per city for the whole event; reaching a route lamp stamps a Journal ornament (0 coin), all five of a city
// pays 200 coin once. The device only says "I am at this lamp, here"; the clock, the stamps and the pay are the
// server's (`lights:` / `lights-done:` ledger rows, no migration). Nothing here touches the network.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { CITIES, CITY_LIST } from "./data.ts";
import { COIN_CAP, type LocalSnap } from "./wallet.ts";
import { applyClientOp, holidayOf, holidayStamp, syncPlayer, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { DAILY_MIN_SEP_M, DAILY_REACH_M } from "./dailyRun.ts";
import { DISTRICT_M, districtOf, districtsInDetails } from "./district.ts";
import { distM } from "./geo.ts";
import { marketAt, onMarket } from "./nightMarket.ts";
import { DEV_CLOCK_COOKIE } from "./gameClock.ts";
import type { CityId } from "./types";
import {
  HOLIDAY_END_MS, HOLIDAY_FINISH_COIN, HOLIDAY_LAMPS, HOLIDAY_RADIUS_M, HOLIDAY_START_MS, HOLIDAY_YEAR,
  holidayCheck, holidayClock, holidayDoneKey, holidayEligible, holidayFinishLine, holidayFromKeys, holidayMarketLamp, holidayOpen, holidayOrnament,
  holidayOrnaments, holidayOwned, holidayProgressLine, holidayRoute, holidaySeed, holidayStampKey, holidayStampLine,
} from "./holidayLights.ts";
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
const coinsOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet.coins;
const rowsOf = async (sql: Sql, user: string) =>
  (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${(await canonicalWallet(sql, user)).id} order by op_key`).map((r) => r.op_key).filter((k) => k.startsWith("lights"));
const allLights = async (sql: Sql) => (await sql<{ op_key: string }>`select op_key from wallet_ledger order by op_key`).map((r) => r.op_key).filter((k) => k.startsWith("lights"));

// America/Chicago is CST (UTC-6) for the whole window.
const ct = (y: number, mo: number, d: number, h = 0, m = 0, s = 0) => Date.UTC(y, mo - 1, d, h + 6, m, s);
const OPEN = ct(2026, 12, 13, 12);
const CITY: CityId = "austin";
const ROUTE = holidayRoute(CITY);
const at = (i: number, city: CityId = CITY) => {
  const l = holidayRoute(city)[i]!;
  return { city, lamp: l.id, lat: l.lat, lng: l.lng };
};
const CITY_IDS = CITY_LIST.map((c) => c.id);
const ROUTED = CITY_IDS.filter((c) => holidayRoute(c).length > 0);

test("window: [2026-12-12 00:00, 2027-01-03 00:00) America/Chicago, end exclusive", () => {
  assert.equal(HOLIDAY_START_MS, Date.parse("2026-12-12T06:00:00Z"));
  assert.equal(HOLIDAY_END_MS, Date.parse("2027-01-03T06:00:00Z"));
  assert.equal(ct(2026, 12, 12), HOLIDAY_START_MS);
  assert.equal(ct(2027, 1, 3), HOLIDAY_END_MS);
  // The wall clock in Chicago really is midnight at both ends.
  const wall = (ms: number) => new Date(ms).toLocaleString("sv-SE", { timeZone: "America/Chicago" });
  assert.equal(wall(HOLIDAY_START_MS), "2026-12-12 00:00:00");
  assert.equal(wall(HOLIDAY_END_MS), "2027-01-03 00:00:00");
  assert.equal(holidayOpen(ct(2026, 12, 11, 23, 59, 59)), false, "2026-12-11 23:59:59 America/Chicago is out");
  assert.equal(holidayOpen(ct(2026, 12, 12, 0, 0, 0)), true, "2026-12-12 00:00:00 America/Chicago is in");
  assert.equal(holidayOpen(HOLIDAY_START_MS - 1), false);
  assert.equal(holidayOpen(OPEN), true);
  assert.equal(holidayOpen(Number.NaN), false);
  assert.equal(holidayOpen(Date.parse("2026-11-25T12:00:00Z")), false);
});

test("2027-01-02 23:59:59 America/Chicago is in", () => {
  assert.equal(holidayOpen(ct(2027, 1, 2, 23, 59, 59)), true);
  assert.equal(holidayOpen(HOLIDAY_END_MS - 1), true);
});

test("2027-01-03 00:00:00 America/Chicago is out", () => {
  assert.equal(holidayOpen(ct(2027, 1, 3, 0, 0, 0)), false);
  assert.equal(holidayOpen(HOLIDAY_END_MS), false);
  assert.equal(holidayOpen(ct(2027, 12, 13, 12)), false, "it does not come back next December");
});

test("route: every city with a route has 5 distinct lamps in 5 distinct districts, none of the excluded kinds, the same all event", () => {
  assert.equal(HOLIDAY_LAMPS, 5);
  assert.equal(DISTRICT_M, 800);
  assert.ok(ROUTED.length > 0);
  // Today every bundled city fields a route; a city that could not would have none at all (never a short one).
  assert.deepEqual(ROUTED, CITY_IDS);
  for (const c of CITY_IDS) {
    const r = holidayRoute(c);
    assert.ok(r.length === 0 || r.length === HOLIDAY_LAMPS, `${c}: five or none`);
    if (!r.length) continue;
    const city = CITIES[c];
    assert.equal(new Set(r.map((l) => l.id)).size, 5, `${c}: distinct lamps`);
    const squares = r.map((l) => districtOf(c, l.lat, l.lng));
    assert.ok(squares.every((d) => /^-?\d+:-?\d+$/.test(d)), `${c}: real squares`);
    assert.equal(new Set(squares).size, 5, `${c}: five different 800 m districts`);
    for (const l of r) {
      // An existing named street lamp of that city: never the Comet, a Hearth, a placed lantern or any other pin.
      const poi = city.pois.find((p) => p.id === l.id);
      assert.ok(poi, `${c}/${l.id}: a baked city lamp`);
      assert.ok(!["shop", "station", "counter", "board"].includes(poi.kind) && !poi.printShop, `${c}/${l.id}: ${poi.kind}`);
      assert.doesNotMatch(l.id, /^(comet|hearth|placed|own|market)/i);
      assert.deepEqual([poi.lat, poi.lng, poi.name], [l.lat, l.lng, l.name]);
      // Reachability bound: within 6,000 m of spawn.
      assert.ok(distM(city.spawn.lat, city.spawn.lng, l.lat, l.lng) <= HOLIDAY_RADIUS_M, `${c}/${l.id}: in reach of spawn`);
      // Never a lamp a night market can stand on, at any time.
      assert.equal(holidayMarketLamp(c, l), false, `${c}/${l.id}: never a market lamp`);
    }
    for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) assert.ok(distM(r[i]!.lat, r[i]!.lng, r[j]!.lat, r[j]!.lng) >= DAILY_MIN_SEP_M, `${c}: lamps apart`);
    // Nearest-next from spawn.
    assert.equal(r[0]!.id, [...r].sort((a, b) => distM(city.spawn.lat, city.spawn.lng, a.lat, a.lng) - distM(city.spawn.lat, city.spawn.lng, b.lat, b.lng) || a.id.localeCompare(b.id))[0]!.id);
    // Ornament numbers follow the route order.
    assert.deepEqual(r.map((l) => holidayOrnament(c, l.id)), [1, 2, 3, 4, 5]);
    // The pool is sorted by id and holds only allowed lamps.
    const pool = holidayEligible(c);
    assert.deepEqual(pool.map((p) => p.id), [...pool.map((p) => p.id)].sort((a, b) => a.localeCompare(b)));
    assert.ok(r.every((l) => pool.some((p) => p.id === l.id)));
  }
  assert.equal(HOLIDAY_RADIUS_M, 6000);
  assert.equal(holidayOrnament(CITY, "not-a-lamp"), 0);
  assert.deepEqual(holidayRoute("nowhere" as CityId), []);
});

test("route: identical on Dec 12 and Jan 2 (no day input), deterministic, and clear of the market on every cycle sampled", () => {
  // The route takes a city and nothing else: there is no day (or clock) to vary it.
  assert.equal(holidayRoute.length, 1);
  assert.equal(holidaySeed.length, 1);
  const code = src("./holidayLights.ts").replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
  const body = code.slice(code.indexOf("export function holidaySeed"), code.indexOf("export function holidayOrnament("));
  assert.doesNotMatch(body, /Date\.|utcDay|chicagoDay|nowMs|gameNow|Math\.random/);
  assert.match(body, /hash32\(`keyline-holiday-lights\|\$\{HOLIDAY_YEAR\}\|\$\{city\}`\)/);
  assert.equal(HOLIDAY_YEAR, 2026);
  for (const c of ROUTED) {
    const a = JSON.stringify(holidayRoute(c));
    assert.equal(JSON.stringify(holidayRoute(c)), a);
    // What the server accepts on the first and the last day is the same five lamps.
    for (const l of holidayRoute(c)) {
      assert.equal(holidayCheck(c, l.id, l.lat, l.lng, ct(2026, 12, 12, 0, 0, 1)).ok, true);
      assert.equal(holidayCheck(c, l.id, l.lat, l.lng, ct(2027, 1, 2, 23, 59, 58)).ok, true);
    }
    // Sampled market cycles across the window (every 15 minutes for the first two days, then one a day).
    const times: number[] = [];
    for (let t = HOLIDAY_START_MS; t < HOLIDAY_START_MS + 48 * 3600_000; t += 15 * 60_000) times.push(t + 60_000);
    for (let t = HOLIDAY_START_MS; t < HOLIDAY_END_MS; t += 24 * 3600_000 + 15 * 60_000) times.push(t + 60_000);
    for (const t of times) {
      const m = marketAt(c, t);
      for (const l of holidayRoute(c)) assert.equal(onMarket(m, { kind: "lamp", poiId: l.id, lat: l.lat, lng: l.lng }), false, `${c}/${l.id} at ${new Date(t).toISOString()}`);
    }
  }
  // Different cities, different seeds.
  assert.notEqual(holidaySeed("austin"), holidaySeed("chicago"));
});

test("5 stamps + 200 coin on a finish", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const base = await coinsOf(sql, "ann");
  for (let i = 0; i < 5; i++) {
    const r = await holidayStamp(sql, "ann", at(i), OPEN + i * 60_000);
    assert.equal(r.ok, true, `lamp ${i + 1}`);
    assert.equal(r.replay, false);
    assert.deepEqual(r.holiday!.stamped[CITY], ROUTE.slice(0, i + 1).map((l) => l.id));
    if (i < 4) {
      assert.equal(r.award?.coins, 0, "a stamp is cosmetic: 0 coin");
      assert.deepEqual(r.award?.boosts, [`Holiday Lights · ornament ${i + 1}/5`]);
      assert.deepEqual(r.holiday!.done, []);
      assert.equal(await coinsOf(sql, "ann"), base);
    } else {
      assert.equal(r.award?.coins, 200);
      assert.deepEqual(r.award?.boosts, ["Holiday Lights · ornament 5/5", "Holiday Lights +200 coin"]);
      assert.deepEqual(r.holiday!.done, [CITY]);
      assert.equal(r.view.coins, base + 200, "the reply carries the paid wallet");
    }
  }
  assert.equal(HOLIDAY_FINISH_COIN, 200);
  assert.equal(await coinsOf(sql, "ann"), base + 200);
  assert.deepEqual(await rowsOf(sql, "ann"), [`lights-done:${CITY}:2026`, ...ROUTE.map((l) => `lights:${CITY}:${l.id}`).sort()].sort());
  // Each stamp row is a zero delta; the finish row is exactly 200 (the first hour's double rewards never touch it).
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${"ann"} and op_key like ${"lights%"}`;
  for (const r of rows) {
    const d = JSON.parse(r.detail || "{}") as { _d?: { c?: number }; coins?: number };
    if (r.op_key.startsWith("lights-done:")) assert.equal(d.coins, 200);
    else assert.equal(d._d, undefined, "no coin, no keys moved");
  }
  // A second city is its own finish: once per city for the event.
  const other = ROUTED.find((c) => c !== CITY)!;
  for (let i = 0; i < 5; i++) await holidayStamp(sql, "ann", at(i, other), OPEN + 600_000 + i * 60_000);
  assert.equal(await coinsOf(sql, "ann"), base + 400);
  assert.deepEqual((await holidayOf(sql, "ann")).done, [CITY, other].sort());
  // COIN_CAP as usual.
  await syncPlayer(sql, "max", snap, "max-phone");
  await sql`update player_wallets set coins = ${COIN_CAP - 10} where user_id = ${"max"}`;
  for (let i = 0; i < 5; i++) await holidayStamp(sql, "max", at(i), OPEN + i * 1000);
  assert.equal(await coinsOf(sql, "max"), COIN_CAP);
  // A linked sign-in is the same player: same stamps, one finish.
  await syncPlayer(sql, "kim", snap, "kim-phone");
  const kb = await coinsOf(sql, "kim");
  await sql`insert into player_links (alias_id, primary_id, how) values (${"kim-x"}, ${"kim"}, ${"test"})`;
  for (let i = 0; i < 5; i++) await holidayStamp(sql, i % 2 ? "kim-x" : "kim", at(i), OPEN + i * 1000);
  assert.equal(await coinsOf(sql, "kim"), kb + 200);
  assert.deepEqual(await holidayOf(sql, "kim-x"), await holidayOf(sql, "kim"));
  assert.equal((await holidayStamp(sql, "kim-x", at(2), OPEN + 9000)).award, undefined);
  assert.equal(await coinsOf(sql, "kim"), kb + 200);
});

test("nothing on a fourth lamp", async () => {
  const sql = await db();
  await syncPlayer(sql, "bea", snap, "bea-phone");
  const base = await coinsOf(sql, "bea");
  for (let i = 0; i < 4; i++) await holidayStamp(sql, "bea", at(i), OPEN + i * 1000);
  const h = await holidayOf(sql, "bea");
  assert.equal(h.stamped[CITY]!.length, 4);
  assert.deepEqual(h.done, []);
  assert.equal(await coinsOf(sql, "bea"), base, "4 stamps pay 0");
  assert.equal((await rowsOf(sql, "bea")).filter((k) => k.startsWith("lights-done:")).length, 0);
  // Re-stamping the same four, in any order, any number of times, is still four.
  for (let n = 0; n < 3; n++) for (let i = 3; i >= 0; i--) await holidayStamp(sql, "bea", at(i), OPEN + 60_000 + n * 1000);
  assert.equal(await coinsOf(sql, "bea"), base);
  // Four here and one in another city is not five.
  const other = ROUTED.find((c) => c !== CITY)!;
  await holidayStamp(sql, "bea", at(0, other), OPEN + 120_000);
  assert.equal(await coinsOf(sql, "bea"), base);
  assert.deepEqual((await holidayOf(sql, "bea")).done, []);
});

test("nothing a second time", async () => {
  const sql = await db();
  await syncPlayer(sql, "cal", snap, "cal-phone");
  const base = await coinsOf(sql, "cal");
  const first = await holidayStamp(sql, "cal", at(0), OPEN);
  assert.equal(first.replay, false);
  // A re-stamp is a replay of the stored row: no new row, no toast line, no coin.
  const again = await holidayStamp(sql, "cal", at(0), OPEN + 1000);
  assert.equal(again.ok, true);
  assert.equal(again.replay, true);
  assert.equal(again.award, undefined);
  assert.equal((await rowsOf(sql, "cal")).length, 1);
  for (let i = 1; i < 5; i++) await holidayStamp(sql, "cal", at(i), OPEN + 2000 + i);
  assert.equal(await coinsOf(sql, "cal"), base + 200);
  // Re-finish: every lamp again, twice over, and a race of five at once. 200 was paid once.
  for (let n = 0; n < 2; n++) {
    for (let i = 0; i < 5; i++) {
      const r = await holidayStamp(sql, "cal", at(i), OPEN + 10_000 + n * 100 + i);
      assert.equal(r.replay, true);
      assert.equal(r.award, undefined);
      assert.deepEqual(r.holiday!.done, [CITY]);
    }
  }
  await Promise.all([0, 1, 2, 3, 4].map((i) => holidayStamp(sql, "cal", at(i), OPEN + 20_000)));
  assert.equal(await coinsOf(sql, "cal"), base + 200);
  assert.equal((await rowsOf(sql, "cal")).length, 6);
  // A race on the last lamp itself: two requests, one finish.
  await syncPlayer(sql, "dee", snap, "dee-phone");
  const db0 = await coinsOf(sql, "dee");
  for (let i = 0; i < 4; i++) await holidayStamp(sql, "dee", at(i), OPEN + i);
  await Promise.all([holidayStamp(sql, "dee", at(4), OPEN + 100), holidayStamp(sql, "dee", at(4), OPEN + 100)]);
  assert.equal(await coinsOf(sql, "dee"), db0 + 200);
});

test("nothing outside the window", async () => {
  const sql = await db();
  await syncPlayer(sql, "eve", snap, "eve-phone");
  const base = await coinsOf(sql, "eve");
  const outs = [ct(2026, 12, 11, 23, 59, 59), ct(2027, 1, 3, 0, 0, 0), ct(2027, 1, 3, 0, 0, 1), Date.parse("2026-11-25T18:00:00Z"), ct(2027, 12, 13, 12)];
  for (const now of outs) {
    for (let i = 0; i < 5; i++) {
      const r = await holidayStamp(sql, "eve", at(i), now);
      assert.equal(r.ok, false);
      assert.equal(r.reason, "closed");
      assert.equal(r.award, undefined);
    }
  }
  assert.deepEqual(await rowsOf(sql, "eve"), [], "no stamp row");
  assert.equal(await coinsOf(sql, "eve"), base, "no pay");
  // Four stamped in the window, the fifth tried at 2027-01-03 00:00 CT: no stamp, no 200.
  for (let i = 0; i < 4; i++) await holidayStamp(sql, "eve", at(i), ct(2027, 1, 2, 23, 59, 50 + i));
  const late = await holidayStamp(sql, "eve", at(4), ct(2027, 1, 3, 0, 0, 0));
  assert.equal(late.reason, "closed");
  assert.equal((await rowsOf(sql, "eve")).length, 4);
  assert.equal(await coinsOf(sql, "eve"), base);
  // All five stamped but the finish row lost (a crash): after the window a replay does not pay it either.
  await syncPlayer(sql, "fay", snap, "fay-phone");
  const fb = await coinsOf(sql, "fay");
  for (const l of ROUTE) await sql`insert into wallet_ledger (user_id, op_key, detail) values (${"fay"}, ${holidayStampKey(CITY, l.id)}, ${"{}"})`;
  assert.equal((await holidayStamp(sql, "fay", at(0), HOLIDAY_END_MS)).reason, "closed");
  assert.equal(await coinsOf(sql, "fay"), fb);
  // ...and inside the window the same replay does pay it, once.
  assert.equal((await holidayStamp(sql, "fay", at(0), HOLIDAY_END_MS - 1)).award?.coins, 200);
  assert.equal(await coinsOf(sql, "fay"), fb + 200);
  // The op itself, on the real server clock (today is outside the window), is refused.
  const real = await applyClientOp(sql, "eve", { kind: "lights", ...at(4) });
  assert.equal(real.reason, holidayOpen(Date.now()) ? undefined : "closed");
});

test("stamps are reach-only", async () => {
  const sql = await db();
  await syncPlayer(sql, "gus", snap, "gus-phone");
  // The op is a city, a lamp and a spot: no vault answer, no grade, no token goes in, and none is looked up.
  const api = src("./walletApi.ts");
  const fields = api.match(/z\.object\(\{ kind: z\.literal\("lights"\), ([^\n]*)/)?.[1] ?? "";
  assert.deepEqual(fields.match(/\b\w+(?=: (?:z\.|City))/g), ["city", "lamp", "lat", "lng"]);
  const apply = src("./walletApply.ts");
  const fn = apply.slice(apply.indexOf("export async function holidayStamp"), apply.indexOf("* 0.1.181 Sunday Drive for the HUD"));
  assert.doesNotMatch(fn, /token|nonce|grade|answer|trivia|market|district/i);
  // At the lamp, and anywhere within the Daily Run's server reach of it: stamped.
  const l0 = ROUTE[0]!;
  const dLat = (m: number) => m / 111_320;
  assert.equal(DAILY_REACH_M, 170);
  const near = await holidayStamp(sql, "gus", { city: CITY, lamp: l0.id, lat: l0.lat + dLat(160), lng: l0.lng }, OPEN);
  assert.equal(near.ok, true);
  // Farther than DAILY_REACH_M: refused, nothing written.
  const l1 = ROUTE[1]!;
  for (const m of [180, 400, 5000]) {
    const far = await holidayStamp(sql, "gus", { city: CITY, lamp: l1.id, lat: l1.lat + dLat(m), lng: l1.lng }, OPEN);
    assert.equal(far.ok, false);
    assert.equal(far.reason, "far");
  }
  // Standing at one route lamp does not stamp another, and a junk spot stamps nothing.
  assert.equal((await holidayStamp(sql, "gus", { city: CITY, lamp: l1.id, lat: l0.lat, lng: l0.lng }, OPEN)).reason, "far");
  assert.equal((await holidayStamp(sql, "gus", { city: CITY, lamp: l1.id, lat: Number.NaN, lng: l1.lng }, OPEN)).reason, "far");
  assert.deepEqual(await rowsOf(sql, "gus"), [`lights:${CITY}:${l0.id}`]);
  // Pure rule, same story.
  assert.deepEqual(holidayCheck(CITY, l1.id, l1.lat, l1.lng, OPEN), { ok: true, lamp: l1 });
  assert.deepEqual(holidayCheck(CITY, l1.id, l1.lat + dLat(171), l1.lng, OPEN), { ok: false, reason: "far" });
});

test("a lamp off the route does not stamp", async () => {
  const sql = await db();
  await syncPlayer(sql, "hal", snap, "hal-phone");
  const base = await coinsOf(sql, "hal");
  const onRoute = new Set(ROUTE.map((l) => l.id));
  const off = CITIES[CITY].pois.filter((p) => !onRoute.has(p.id));
  assert.ok(off.length > 5);
  for (const p of off) {
    const r = await holidayStamp(sql, "hal", { city: CITY, lamp: p.id, lat: p.lat, lng: p.lng }, OPEN);
    assert.equal(r.ok, false, p.id);
    assert.equal(r.reason, "route");
  }
  // Another city's route lamp under this city's name, a made-up id, the Comet, a Hearth, a placed lantern: all off.
  const other = ROUTED.find((c) => c !== CITY)!;
  const far = holidayRoute(other)[0]!;
  for (const lamp of [far.id, "nope", "comet", `comet:${CITY}`, "hearth-1", "placed-abc123", "", `${ROUTE[0]!.id} `, `${ROUTE[0]!.id}%`, "%", "_"]) {
    const r = await holidayStamp(sql, "hal", { city: CITY, lamp, lat: ROUTE[0]!.lat, lng: ROUTE[0]!.lng }, OPEN);
    assert.equal(r.reason, "route", JSON.stringify(lamp));
  }
  assert.equal((await holidayStamp(sql, "hal", { city: "nowhere" as CityId, lamp: ROUTE[0]!.id, lat: ROUTE[0]!.lat, lng: ROUTE[0]!.lng }, OPEN)).reason, "route");
  assert.deepEqual(await rowsOf(sql, "hal"), []);
  assert.equal(await coinsOf(sql, "hal"), base);
});

test("guest refused: no wallet on the server means no stamp, no pay, nothing written", async () => {
  // Signed out: the only way in is applyWallet / syncWallet, both behind authMiddleware, and the device sends
  // nothing while there is no live server wallet (store.holiday is null for a guest).
  const api = src("./walletApi.ts");
  assert.match(api, /export const applyWallet = createServerFn\(\{ method: "POST" \}\)\s*\.middleware\(\[authMiddleware\]\)/);
  const client = src("./holidayClient.ts");
  assert.match(client, /if \(!h \|\| !walletLive\(\) \|\| !holidayOpen\(gameNow\(\)\) \|\| Date\.now\(\) < retryAt\) return;/);
  assert.match(src("./walletClient.ts"), /export async function commitWallet\(op: ClientOp\)[^\n]*\n\s*if \(!live\) return null;/);
  const sql = await db();
  for (let i = 0; i < 5; i++) {
    for (const r of [await holidayStamp(sql, "guest", at(i), OPEN), await applyClientOp(sql, "guest", { kind: "lights", ...at(i) }, { now: OPEN })]) {
      assert.equal(r.ok, false);
      assert.equal(r.reason, "sync");
      assert.equal(r.award, undefined);
      assert.equal(r.holiday, undefined);
    }
  }
  assert.deepEqual(await allLights(sql), []);
  assert.equal(await coinsOf(sql, "guest"), 0);
});

test("holiday-lights progress cannot be incremented from the client", async () => {
  const sql = await db();
  await syncPlayer(sql, "ivy", snap, "ivy-phone");
  const base = await coinsOf(sql, "ivy");
  // The wire schema is a city, a lamp and a spot. Zod strips anything else, so a count never reaches the op.
  const api = src("./walletApi.ts");
  const fields = api.match(/z\.object\(\{ kind: z\.literal\("lights"\), ([^\n]*)/)?.[1] ?? "count";
  assert.deepEqual(fields.match(/\b\w+(?=: (?:z\.|City))/g), ["city", "lamp", "lat", "lng"]);
  assert.doesNotMatch(fields, /passthrough|strict|catchall/);
  assert.match(api, /\.validator\(\(u: unknown\) => Op\.parse\(u\)\)/);
  // Even handed straight to the apply layer, extra fields do nothing: one honest stamp, no finish.
  const forged = { kind: "lights", ...at(0), count: 5, n: 5, stamped: ROUTE.map((l) => l.id), done: true, finish: true, coins: 200, ornament: 5, lamps: ROUTE.map((l) => l.id), now: OPEN, day: "2026-12-13" } as unknown as ClientOp;
  const r = await applyClientOp(sql, "ivy", forged, { now: OPEN });
  assert.equal(r.ok, true);
  assert.deepEqual(r.holiday, { stamped: { [CITY]: [ROUTE[0]!.id] }, done: [] });
  assert.equal(await coinsOf(sql, "ivy"), base);
  // A `now` inside the op is not the clock: with the server clock outside the window the same op is refused.
  const timed = { kind: "lights", ...at(1), now: OPEN, at: OPEN, clock: OPEN } as unknown as ClientOp;
  assert.equal((await applyClientOp(sql, "ivy", timed, { now: HOLIDAY_END_MS })).reason, "closed");
  assert.equal((await applyClientOp(sql, "ivy", timed, { now: HOLIDAY_START_MS - 1 })).reason, "closed");
  // Faked lamp ids and cities are refused.
  for (const lamp of ["all", "*", "5", `${ROUTE[1]!.id},${ROUTE[2]!.id}`, `x:${ROUTE[1]!.id}`]) {
    assert.equal((await applyClientOp(sql, "ivy", { kind: "lights", ...at(1), lamp }, { now: OPEN })).reason, "route");
  }
  const other = ROUTED.find((c) => c !== CITY)!;
  assert.equal((await applyClientOp(sql, "ivy", { kind: "lights", ...at(1), city: other }, { now: OPEN })).reason, "route");
  // No wallet or save field carries it: a sync that claims stamps moves nothing, on this device or a new one.
  const lie = { ...snap, holiday: { stamped: { [CITY]: ROUTE.map((l) => l.id) }, done: [CITY] }, holidayDone: [CITY], lights: 5 } as unknown as LocalSnap;
  assert.deepEqual((await syncPlayer(sql, "ivy", lie, "ivy-phone")).holiday, { stamped: { [CITY]: [ROUTE[0]!.id] }, done: [] });
  assert.deepEqual((await syncPlayer(sql, "ivy", lie, "ivy-tablet")).holiday, { stamped: { [CITY]: [ROUTE[0]!.id] }, done: [] });
  assert.equal(await coinsOf(sql, "ivy"), base);
  // Progress is the account's own ledger rows and nothing else: another player's rows do not count, and rows that
  // are not an exact route stamp (wrong city, off-route lamp, a look-alike prefix) count for nothing.
  await syncPlayer(sql, "jon", snap, "jon-phone");
  for (let i = 0; i < 3; i++) await holidayStamp(sql, "jon", at(i), OPEN);
  assert.equal((await holidayOf(sql, "jon")).stamped[CITY]!.length, 3);
  assert.equal((await holidayOf(sql, "ivy")).stamped[CITY]!.length, 1);
  const junk = [`lights:${CITY}:nope`, `lights:${other}:${ROUTE[1]!.id}`, `lights:${CITY}`, `lightsx:${CITY}:${ROUTE[1]!.id}`, `lights:${CITY}:${ROUTE[1]!.id}:x`, `lights-done:${CITY}:2025`, `lights-done:nowhere:2026`, `light:${ROUTE[1]!.id}`];
  assert.deepEqual(holidayFromKeys(junk), { stamped: {}, done: [] });
  assert.deepEqual(holidayFromKeys([holidayStampKey(CITY, ROUTE[2]!.id), holidayStampKey(CITY, ROUTE[0]!.id), holidayStampKey(CITY, ROUTE[0]!.id), holidayDoneKey(CITY), ...junk]), { stamped: { [CITY]: [ROUTE[0]!.id, ROUTE[2]!.id] }, done: [CITY] });
  // Junk stamp rows in the ledger never add up to a finish.
  for (const k of junk) await sql`insert into wallet_ledger (user_id, op_key, detail) values (${"ivy"}, ${k}, ${"{}"}) on conflict do nothing`;
  for (let i = 1; i < 4; i++) await holidayStamp(sql, "ivy", at(i), OPEN);
  assert.equal((await holidayOf(sql, "ivy")).stamped[CITY]!.length, 4);
  assert.equal(await coinsOf(sql, "ivy"), base, "four real stamps and any number of fakes pay 0");
  // One writer for each key, both inside holidayStamp; the client keeps no count of its own.
  const apply = src("./walletApply.ts");
  assert.equal(apply.match(/holidayStampKey\(/g)?.length, 1, "one stamp writer");
  assert.equal(apply.match(/holidayDoneKey\(/g)?.length, 1, "one finish writer");
  assert.doesNotMatch(apply.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, ""), /["'`]lights(-done)?:/, "no hand-written holiday key outside the two key helpers");
  const client = src("./holidayClient.ts");
  assert.match(client, /commitWallet\(\{ kind: "lights", city, lamp, lat, lng \}\)/);
  assert.match(client, /if \(r\.holiday\) useGame\.setState\(\{ holiday: r\.holiday \}\)/);
  assert.doesNotMatch(client, /holiday:\s*\{\s*stamped/);
  const store = src("./store.ts");
  assert.equal(store.match(/\bholiday: null,/g)?.length, 1);
  assert.doesNotMatch(store, /saved\?\.holiday|holiday: s\.holiday|holiday: get\(\)\.holiday/);
  assert.match(src("../components/keyline/WalletSync.tsx"), /useGame\.setState\(\{ holiday: null \}\)/);
  // The dev clock cookie is ignored when DEV is false: a build always judges the window on the real clock.
  const shift = String(OPEN - Date.now());
  assert.equal(DEV_CLOCK_COOKIE, "kl_dev_clock");
  assert.equal(holidayClock(1000, false, shift), 1000);
  assert.equal(holidayClock(1000, false, "999999999"), 1000);
  assert.equal(holidayClock(1000, true, "5000"), 6000, "only the dev server honours it");
  assert.equal(holidayClock(1000, true, "junk"), 1000);
  assert.equal(holidayClock(1000, true, null), 1000);
  assert.match(api, /async function holidayNow\(\): Promise<number> \{\n\s*if \(!import\.meta\.env\?\.DEV\) return Date\.now\(\);/);
  assert.equal(api.match(/DEV_CLOCK_COOKIE/g)?.length, 2, "read in one place, behind the DEV check");
  assert.match(api, /applyClientOp\(await getSql\(\), context\.userId, data as ClientOp, data\.kind === "lights" \? \{ now: await holidayNow\(\) \} : \{\}\)/);
  // The client's clock is the game clock, whose shift is dev-only too.
  assert.match(src("./gameClock.ts"), /export function setDevClockShift\(ms: number\): void \{\n\s*if \(!import\.meta\.env\?\.DEV\) return;/);
});

test("a stamp writes no grade row and no district detail (district and Fading Block counts untouched)", async () => {
  const sql = await db();
  await syncPlayer(sql, "kay", snap, "kay-phone");
  const before = (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${"kay"}`).map((r) => r.op_key);
  for (let i = 0; i < 5; i++) await holidayStamp(sql, "kay", at(i), OPEN);
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${"kay"}`;
  const added = rows.filter((r) => !before.includes(r.op_key));
  assert.equal(added.length, 6);
  assert.ok(added.every((r) => r.op_key.startsWith("lights:") || r.op_key.startsWith("lights-done:")));
  // Every district / fresh-district / right-lamp count on the server reads `grade:` rows only.
  assert.equal(rows.filter((r) => r.op_key.startsWith("grade:")).length, 0);
  for (const r of added) {
    assert.doesNotMatch(r.detail, /"d":"|"c":"|"g":|"pi":|"mk":/, r.op_key);
    assert.deepEqual(districtsInDetails([r.detail]), []);
  }
  // Nor does any other reader's prefix match a holiday key (`light:` is the market light shelf).
  for (const p of ["grade:", "light:", "street:", "goal:", "daily:", "quest:", "sd:", "cache:", "ride:", "house:", "gift:"]) {
    assert.ok(added.every((r) => !r.op_key.startsWith(p)), p);
  }
  // No table but the wallet and its ledger is written.
  assert.doesNotMatch(src("./walletApply.ts").slice(src("./walletApply.ts").indexOf("export async function holidayStamp"), src("./walletApply.ts").indexOf("* 0.1.181 Sunday Drive for the HUD")), /insert into|update |delete from/);
});

test("ornaments are still returned by holidayOf after the window, and by a sync", async () => {
  const sql = await db();
  await syncPlayer(sql, "lou", snap, "lou-phone");
  for (let i = 0; i < 3; i++) await holidayStamp(sql, "lou", at(i), OPEN);
  const want = { stamped: { [CITY]: ROUTE.slice(0, 3).map((l) => l.id) }, done: [] };
  // holidayOf takes no clock at all: it is the ledger, whenever it is read.
  assert.equal(holidayOf.length, 2);
  assert.deepEqual(await holidayOf(sql, "lou"), want);
  assert.deepEqual((await syncPlayer(sql, "lou", snap, "lou-phone")).holiday, want);
  // After the window a stamp is refused, and the reply still carries the kept ornaments.
  const late = await holidayStamp(sql, "lou", at(3), ct(2027, 2, 1, 12));
  assert.equal(late.reason, "closed");
  assert.deepEqual(late.holiday, want);
  assert.deepEqual(holidayOrnaments(want, CITY), [1, 2, 3]);
  assert.equal(holidayOwned(want), true);
  assert.equal(holidayOwned({ stamped: {}, done: [] }), false);
  assert.equal(holidayOwned(null), false);
  assert.deepEqual(holidayOrnaments(null, CITY), []);
  // A never-stamped account has nothing, in or out of the window.
  await syncPlayer(sql, "moe", snap, "moe-phone");
  assert.deepEqual(await holidayOf(sql, "moe"), { stamped: {}, done: [] });
});

test("lines and client wiring: toasts, the painted map lamp, the Journal section, the guide line", () => {
  assert.equal(holidayStampLine(3), "Holiday Lights · ornament 3/5");
  assert.equal(holidayFinishLine(), "Holiday Lights +200 coin");
  assert.equal(holidayProgressLine(0), "Holiday Lights 0/5 · find the five dressed lamps across town");
  assert.equal(holidayProgressLine(2), "Holiday Lights 2/5");
  const map = src("../components/keyline/GameMap.tsx");
  const paint = map.slice(map.indexOf("function paintHoliday()"), map.indexOf("/** Daily Lantern Run: the five lamps, numbered"));
  // Only the painted image: no shadow ellipse (worldObj(..., false)), no span, svg, ring or number; not interactive.
  assert.match(paint, /if \(!L \|\| !map \|\| !st\.holiday \|\| !holidayOpen\(gameNow\(\)\)\) return;/);
  assert.match(paint, /<div class="holiday-lamp\$\{have\.includes\(lamp\.id\) \? " is-stamped" : ""\}" data-testid="holiday-lamp"><img src="\/sprites\/holiday\/lamp\.webp" width="17" height="52" alt="" draggable="false"><\/div>`, 42, 51, false\)/);
  assert.match(paint, /interactive: false,/);
  assert.doesNotMatch(paint, /<span|<svg|<i\b|\$\{i \+ 1\}/);
  assert.match(paint, /for \(const m of holidayPins\.current\) m\.remove\(\);\n\s*holidayPins\.current = \[\];/);
  assert.match(map, /paintHoliday\(\);\n[^\n]*\n\s*\}, \[holiday, holidayOn, streets, cityId\]\);/);
  // The trigger sits next to the Daily Run's check and is not gated on being on foot.
  assert.match(map, /useDaily\.getState\(\)\.check\([\s\S]{0,260}?\}\);\n[^\n]*\n\s*checkHoliday\(st\.cityId, \{ lat: pos\.current\.lat, lng: pos\.current\.lng \}, /);
  assert.doesNotMatch(src("./holidayClient.ts").replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, ""), /seated/);
  // CSS: whole-image dimming only; no drop-shadow, no pseudo-element pieces, no animation.
  const css = src("../styles.css");
  const block = css.slice(css.indexOf("/* 0.1.182 Holiday Lights"), css.indexOf(".holiday-orns img")) + (css.match(/\.holiday-orns img\{[^}]*\}/)?.[0] ?? "");
  assert.match(block, /\.holiday-lamp\.is-stamped img\{ filter:grayscale\(\.85\) brightness\(\.7\); opacity:\.8 \}/);
  assert.match(block, /\.holiday-orns img\{ height:28px; width:auto \}/);
  assert.doesNotMatch(block.replace(/\/\*[\s\S]*?\*\//g, ""), /drop-shadow|box-shadow|::before|::after|animation|border|background/);
  assert.equal(css.match(/holiday-/g)?.length, block.match(/holiday-/g)?.length, "no other holiday rule");
  // Journal: shown while open or once an ornament is owned; bare ornament images with their test ids.
  const j = src("../components/keyline/HolidayJournal.tsx");
  assert.match(j, /if \(!holiday \|\| !\(open \|\| holidayOwned\(holiday\)\)\) return null;/);
  assert.match(j, /data-testid="journal-holiday"/);
  assert.match(j, /<img key=\{n\} src=\{`\/sprites\/holiday\/orn-\$\{n\}\.webp`\} alt=\{`Ornament \$\{n\}`\} data-testid=\{`holiday-orn-\$\{n\}`\} draggable=\{false\} \/>/);
  assert.match(src("../components/keyline/HqPanel.tsx"), /<HolidayJournal \/>/);
  assert.match(src("../components/keyline/FieldGuide.tsx"), /<li>Holiday Lights \(Dec 12 to Jan 2, Central\)/);
});

test("art budget: every file in public/sprites/holiday is at most 2,048 B and the folder at most 20 KiB", () => {
  const dir = new URL("../../public/sprites/holiday/", import.meta.url);
  const files = readdirSync(dir).sort();
  assert.deepEqual(files, ["lamp.webp", "orn-1.webp", "orn-2.webp", "orn-3.webp", "orn-4.webp", "orn-5.webp"]);
  let total = 0;
  for (const f of files) {
    const st = statSync(new URL(f, dir));
    assert.ok(st.isFile(), f);
    assert.ok(st.size > 0 && st.size <= 2048, `${f}: ${st.size} B (cap 2,048 B)`);
    total += st.size;
  }
  assert.ok(total <= 20 * 1024, `folder: ${total} B (cap 20,480 B)`);
});

test("0.1.188: version 0.1.188 / k1188a everywhere, and the 5th ornament is the brass recut (the rest unchanged)", async () => {
  const v = src("../version.ts");
  assert.match(v, /APP_VERSION = "0\.1\.188"/);
  assert.match(v, /PUBLISH_STAMP = "k1188a"/);
  assert.match(v, /\n\/\/ 0\.1\.188: Holiday Lights art rework — [^\n]*\(k1188a\)\.\n$/);
  const pkg = JSON.parse(src("../../package.json")) as { version: string };
  assert.equal(pkg.version, "0.1.188");
  const lock = JSON.parse(src("../../package-lock.json")) as { version: string; packages: Record<string, { version?: string }> };
  assert.equal(lock.version, "0.1.188");
  assert.equal(lock.packages[""]!.version, "0.1.188");
  const { createHash } = await import("node:crypto");
  const sha = (f: string) => createHash("sha256").update(readFileSync(new URL(`../../public/sprites/holiday/${f}`, import.meta.url))).digest("hex");
  assert.equal(sha("orn-5.webp"), "bc5b8b625a9b4153db4f2ca30bc414b2e550b908785b774c19f2f87b83ad4a7f");
  assert.match(src("../../scripts/art/holiday/cut.py"), /if k=='orn-5': m=brass\(m\)/);
});
