// 0.1.185 Stray lamp (CARD-186): between Comet windows one of the city's own street lamps wakes for 15 minutes every
// 90 minutes. A right answer there pays the usual grade plus floor(0.50 x that color's base ladder coin), once per
// player per window. The window, the lamp and the extra are the server's (its clock, the baked POIs, one
// `stray:<city>:<w>` ledger row, no migration). Nothing here touches the network.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { CITIES, CITY_LIST } from "./data.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { applyClientOp, awardGrade, syncPlayer, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { districtOf } from "./district.ts";
import { COMET_EVERY_MS, COMET_SKEW_MS, cometEnd, cometStart, cometWindow, isComet } from "./eventVault.ts";
import { holidayMarketLamp } from "./holidayLights.ts";
import { hash32 } from "./nightMarket.ts";
import { TIER_ORDER, TIER_VALUE } from "./rewards.ts";
import { sealPlate } from "./rarity.ts";
import { DealIn, dealFor, grade, resetGradeRing, publicCardId, type TriviaDeps } from "./triviaService.ts";
import { GradeIn } from "./triviaSchema.ts";
import type { CityId, Poi, Tier, TriviaQ } from "./types";
import {
  STRAY_BONUS_RATE, STRAY_COMET_PAD_MS, STRAY_CYCLE, STRAY_EVERY_MS, STRAY_GUIDE, STRAY_OPEN_MS, STRAY_PIN_TITLE, STRAY_SKEW_MS,
  strayAt, strayBonus, strayEligible, strayEnd, strayKey, strayLampAt, strayLine, strayOf, strayOffset, strayOfWindow, strayPattern,
  strayPays, strayPick, strayRank, straySkipped, strayStart, strayWindow, type StrayPoolLamp,
} from "./strayLamp.ts";
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
const coinsOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet.coins;
const strayRows = async (sql: Sql, user: string) => {
  const { id } = await canonicalWallet(sql, user);
  return (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${"stray:%"} order by op_key`).map((r) => r.op_key);
};
const gradeDetail = async (sql: Sql, user: string, nonce: string) => {
  const { id } = await canonicalWallet(sql, user);
  return String((await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${"grade:" + nonce}`)[0]?.detail ?? "");
};

const MIN = 60_000;
const CITY_IDS = CITY_LIST.map((c) => c.id) as CityId[];
const CITY: CityId = "austin";
// A fixed moment in the past: the schedule is a function of the clock alone.
const BASE = Date.UTC(2025, 10, 25, 18);
/** The first window at or after `from` that fields a lamp (not skipped). */
function nextOpen(city: CityId, from: number = BASE, after = 0): { w: number; lamp: Poi; s: number; e: number } {
  let w = Math.max(strayWindow(city, from) + 1, after);
  while (!strayOfWindow(city, w)) w++;
  return { w, lamp: strayOfWindow(city, w)!, s: strayStart(city, w), e: strayEnd(city, w) };
}
const WIN = nextOpen(CITY);
const LAMP = WIN.lamp;
/** A baked Austin street lamp that is not the stray lamp of WIN. */
const OTHER = strayEligible(CITY).find((p) => p.id !== LAMP.id)!.poi;

type Pay = Omit<GradePay, "prior"> & { prevNonce: string; now?: number; timedOut?: boolean; struck?: boolean };
/** A right answer on a lit lamp, graded two minutes into WIN, dealt a few seconds earlier. */
function pay(over: Partial<Pay> = {}, lamp: Poi = LAMP): Pay {
  const now = over.now ?? WIN.s + 2 * MIN;
  return {
    correct: true, elapsedMs: 5000, mult: 1, city: CITY, diff: 2, clearTier: lamp.tier, poiTier: lamp.tier, poiId: lamp.id,
    lat: lamp.lat, lng: lamp.lng, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "",
    charmTopics: [], topic: "science", dealtAt: now - 5000, luckyHit: false, perfectBlue: false, prevNonce: "", now, ...over,
  };
}
const hasLine = (r: { award?: { boosts: string[] } }) => (r.award?.boosts ?? []).some((b) => b.startsWith("Stray lamp"));

test("constants: every 90 minutes, open 15, +50% of base, the Comet's 60 s skew, a 60 s Comet pad, four windows a Comet cycle", () => {
  assert.equal(STRAY_EVERY_MS, 90 * MIN);
  assert.equal(STRAY_OPEN_MS, 15 * MIN);
  assert.equal(STRAY_BONUS_RATE, 0.5);
  assert.equal(STRAY_SKEW_MS, COMET_SKEW_MS);
  assert.equal(STRAY_SKEW_MS, 60_000);
  assert.equal(STRAY_COMET_PAD_MS, 60_000);
  assert.equal(STRAY_CYCLE, 4);
  assert.equal(COMET_EVERY_MS, 4 * STRAY_EVERY_MS);
  assert.equal(strayKey("austin", 12), "stray:austin:12");
  assert.equal(strayLine(135), "Stray lamp +135 coin");
  assert.equal(STRAY_PIN_TITLE, "Stray lamp · bonus open");
});

test("halo lamp is open for exactly 15 minutes: start in, end − 1 ms in, end out, every 90 minutes from a stable per-city offset", () => {
  assert.equal(CITY_IDS.length, 16);
  for (const city of CITY_IDS) {
    const off = strayOffset(city);
    assert.equal(off, (hash32(`keyline-stray|${city}`) % 90) * MIN, city);
    assert.ok(off >= 0 && off < STRAY_EVERY_MS && off % MIN === 0, city);
    assert.equal(strayOffset(city), off, "stable");
    const { w, lamp, s, e } = nextOpen(city);
    assert.equal(s, off + w * STRAY_EVERY_MS);
    assert.equal(e - s, 15 * MIN);
    assert.equal(strayStart(city, w + 1) - s, 90 * MIN);
    assert.equal(strayWindow(city, s), w);
    assert.equal(strayWindow(city, s - 1), w - 1);
    assert.equal(strayLampAt(city, s - 1), null, "closed 1 ms before the start");
    assert.deepEqual(strayLampAt(city, s), { w, lamp, startsAt: s, endsAt: e });
    assert.equal(strayLampAt(city, e - 1)?.lamp.id, lamp.id, "open at end − 1 ms");
    assert.equal(strayLampAt(city, e), null, "closed at the end");
    assert.equal(strayLampAt(city, e + 30 * MIN), null, "closed between windows");
    // One lamp for the whole window, and it is one of the city's own baked lamps with its own id and tier.
    for (let t = s; t < e; t += MIN) assert.equal(strayLampAt(city, t)?.lamp, lamp);
    assert.ok(CITIES[city].pois.includes(lamp));
    assert.equal(isComet(lamp.id), false);
    // strayAt: the current window when open, else the next one.
    assert.deepEqual(strayAt(city, s + MIN), { city, w, startsAt: s, endsAt: e, open: true });
    assert.deepEqual(strayAt(city, e), { city, w: w + 1, startsAt: s + STRAY_EVERY_MS, endsAt: e + STRAY_EVERY_MS, open: false });
    // strayOf: the named lamp only, with the grace only when asked for.
    assert.equal(strayOf(city, lamp.id, e, 0), null);
    assert.equal(strayOf(city, lamp.id, e + STRAY_SKEW_MS - 1, STRAY_SKEW_MS)?.w, w);
    assert.equal(strayOf(city, lamp.id, e + STRAY_SKEW_MS, STRAY_SKEW_MS), null);
    assert.equal(strayOf(city, "not-a-lamp", s, 0), null);
  }
  assert.equal(strayLampAt("nowhere" as CityId, BASE), null);
  assert.equal(strayOfWindow(CITY, 1.5), null);
});

test("skipped during Comet: a window touching the Comet open or its 60 s pad on either edge does not happen; 1 ms clear of the pad it does", () => {
  let skips = 0;
  for (const city of CITY_IDS) {
    const pat = strayPattern(city);
    assert.equal(pat.length, 4);
    const n = pat.filter(Boolean).length;
    assert.ok(n <= 2, `${city}: at most 2 of 4 skip`);
    assert.ok(n < 4, `${city}: never all 4`);
    skips += n;
    const w0 = strayWindow(city, BASE);
    for (let w = w0 - 40; w <= w0 + 40; w++) {
      // Brute force against every Comet window near it.
      const s = strayStart(city, w), e = strayEnd(city, w);
      const c0 = cometWindow(city, s);
      let hit = false;
      for (let c = c0 - 3; c <= c0 + 3; c++) if (s < cometEnd(city, c) + 60_000 && e > cometStart(city, c) - 60_000) hit = true;
      assert.equal(straySkipped(city, w), hit, `${city} ${w}`);
      assert.equal(straySkipped(city, w), pat[((w % 4) + 4) % 4], "a function of w mod 4");
      if (hit) {
        assert.equal(strayOfWindow(city, w), null);
        assert.equal(strayRank(city, w), null);
        for (let t = s; t < e; t += MIN) assert.equal(strayLampAt(city, t), null, "no halo in a skipped window");
        assert.equal(strayPays({ city, poiId: strayEligible(city)[0]!.id, dealtAt: s + MIN }, s + 2 * MIN), null);
      }
    }
  }
  assert.ok(skips > 0, "some city really skips");
  // The pad's edges, on the rule itself (the offsets are whole minutes, so the edges are built here): a stray
  // window [s, e) against a Comet open [cs, ce), pad 60 s.
  const meets = (s: number, e: number, cs: number, ce: number) => s < ce + STRAY_COMET_PAD_MS && e > cs - STRAY_COMET_PAD_MS;
  const cs = 1_000 * MIN, ce = cs + 20 * MIN;
  assert.equal(meets(cs - 60_000 - 15 * MIN, cs - 60_000, cs, ce), false, "ends exactly where the leading pad starts");
  assert.equal(meets(cs - 60_000 - 15 * MIN + 1, cs - 60_000 + 1, cs, ce), true, "1 ms into the leading pad");
  assert.equal(meets(ce + 60_000 - 1, ce + 60_000 - 1 + 15 * MIN, cs, ce), true, "starts 1 ms inside the trailing pad");
  assert.equal(meets(ce + 60_000, ce + 60_000 + 15 * MIN, cs, ce), false, "starts exactly where the trailing pad ends");
  // And the same edges through straySkipped's own source line.
  assert.match(src("./strayLamp.ts"), /if \(s < cometEnd\(city, c\) \+ STRAY_COMET_PAD_MS && e > cometStart\(city, c\) - STRAY_COMET_PAD_MS\) return true;/);
  // A real city whose stray sits within a minute of a Comet edge would be caught by the pad: every non-skipped
  // window in every city is at least the pad clear of every Comet open.
  for (const city of CITY_IDS) {
    for (let w = 0; w < 4; w++) {
      if (straySkipped(city, w)) continue;
      const s = strayStart(city, w), e = strayEnd(city, w), c0 = cometWindow(city, s);
      for (let c = c0 - 1; c <= c0 + 1; c++) assert.ok(e <= cometStart(city, c) - 60_000 || s >= cometEnd(city, c) + 60_000, `${city} ${w}`);
    }
  }
});

test("rank: the closed form equals a brute-force count of non-skipped windows, negative windows included", () => {
  for (const city of CITY_IDS) {
    const brute = (w: number) => {
      let n = 0;
      if (w >= 0) for (let i = 0; i < w; i++) n += straySkipped(city, i) ? 0 : 1;
      else for (let i = w; i < 0; i++) n -= straySkipped(city, i) ? 0 : 1;
      return n;
    };
    let last: number | null = null;
    for (let w = -45; w <= 45; w++) {
      const n = strayRank(city, w);
      if (straySkipped(city, w)) {
        assert.equal(n, null);
        continue;
      }
      assert.equal(n, brute(w), `${city} ${w}`);
      if (last != null) assert.equal(n, last + 1, "consecutive non-skipped windows have consecutive ranks");
      last = n;
    }
  }
});

test("next window is another district from the previous non-skipped window, over many windows in all 16 cities", () => {
  for (const city of CITY_IDS) {
    const w0 = strayWindow(city, BASE);
    let prev: Poi | null = null;
    let seen = 0;
    const districts = new Set<string>();
    for (let w = w0 - 60; w <= w0 + 400; w++) {
      const lamp = strayOfWindow(city, w);
      if (!lamp) {
        assert.ok(straySkipped(city, w), `${city} ${w}: only a Comet skip leaves a window empty`);
        continue;
      }
      const d = districtOf(city, lamp.lat, lamp.lng);
      if (prev) assert.notEqual(d, districtOf(city, prev.lat, prev.lng), `${city} ${w}`);
      districts.add(d);
      prev = lamp;
      seen++;
    }
    assert.ok(seen >= 230, city);
    assert.ok(districts.size >= 4, `${city}: the lamp really moves about (${districts.size} districts)`);
  }
});

test("two windows that straddle a Comet skip still land in different districts from each other and from the last non-skipped window", () => {
  let found = 0;
  for (const city of CITY_IDS) {
    const d = (w: number) => {
      const l = strayOfWindow(city, w)!;
      return districtOf(city, l.lat, l.lng);
    };
    const w0 = strayWindow(city, BASE);
    for (let w = w0; w < w0 + 80; w++) {
      if (!straySkipped(city, w)) continue;
      found++;
      // Real skipped window `w`: its neighbours are open (a Comet reaches one window at most).
      assert.ok(!straySkipped(city, w - 2) && !straySkipped(city, w - 1) && !straySkipped(city, w + 1) && !straySkipped(city, w + 2), `${city} ${w}`);
      assert.equal(strayRank(city, w + 1), strayRank(city, w - 1)! + 1, "the skip is not counted as a previous window");
      assert.notEqual(d(w + 1), d(w - 1), `${city} ${w}: across the skip`);
      assert.notEqual(d(w - 1), d(w - 2), `${city} ${w}: before the skip, from the last non-skipped window`);
      assert.notEqual(d(w + 2), d(w + 1), `${city} ${w}: after the skip`);
    }
  }
  assert.ok(found >= 20, "real skipped windows were exercised");
});

test("the selector is pure over its pool: parity groups, no stray lamp with fewer than two districts, never a fallback", () => {
  const lamp = (id: string, district: string): StrayPoolLamp => ({ id, district });
  // One district, however many lamps: nothing.
  const one = [lamp("a", "0:0"), lamp("b", "0:0"), lamp("c", "0:0")];
  for (let n = -6; n <= 6; n++) assert.equal(strayPick(one, "x", n), null);
  assert.equal(strayPick([], "x", 0), null);
  // Lamps with no district do not count as one.
  assert.equal(strayPick([lamp("a", "0:0"), lamp("b", "")], "x", 0), null);
  // Two districts: they alternate, for ever, whatever order the pool comes in.
  const two = [lamp("b2", "1:0"), lamp("a1", "0:0"), lamp("a2", "0:0"), lamp("b1", "1:0")];
  for (let n = -9; n <= 9; n++) {
    const p = strayPick(two, "x", n)!;
    assert.equal(p.district, ((n % 2) + 2) % 2 === 0 ? "0:0" : "1:0", `n=${n}`);
    assert.deepEqual(strayPick([...two].reverse(), "x", n), p, "pool order does not matter");
    assert.notEqual(strayPick(two, "x", n + 1)!.district, p.district);
  }
  // Many districts: sorted keys split by index parity; rank n draws only from group n mod 2, by the two seeds.
  const many = ["3:1", "-1:2", "0:0", "2:-2", "1:1"].flatMap((d, i) => [lamp(`m${i}a`, d), lamp(`m${i}b`, d)]);
  const keys = [...new Set(many.map((p) => p.district))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (let n = -20; n <= 20; n++) {
    const p = strayPick(many, "x", n)!;
    const group = keys.filter((_, i) => i % 2 === ((n % 2) + 2) % 2);
    const dist = group[hash32(`keyline-stray-d|x|${n}`) % group.length]!;
    const lamps = many.filter((q) => q.district === dist).sort((a, b) => (a.id < b.id ? -1 : 1));
    assert.deepEqual(p, lamps[hash32(`keyline-stray-l|x|${n}`) % lamps.length]);
    assert.notEqual(strayPick(many, "x", n + 1)!.district, p.district);
  }
  // The city seed matters.
  assert.ok(Array.from({ length: 40 }, (_, n) => strayPick(many, "x", n)!.id).join() !== Array.from({ length: 40 }, (_, n) => strayPick(many, "y", n)!.id).join());
});

test("the lamp is never in a night-market zone, always passes the Daily Run kind rule, always has a district", () => {
  for (const city of CITY_IDS) {
    const pool = strayEligible(city);
    assert.ok(new Set(pool.map((p) => p.district)).size >= 2, city);
    assert.deepEqual(pool.map((p) => p.id), [...pool.map((p) => p.id)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), "sorted by id");
    for (const p of pool) {
      assert.ok(CITIES[city].pois.includes(p.poi));
      assert.equal(p.district, districtOf(city, p.poi.lat, p.poi.lng));
    }
    // Everything the rule leaves out really is out.
    for (const p of CITIES[city].pois) {
      const out = p.kind === "shop" || p.kind === "station" || p.kind === "counter" || p.kind === "board" || !!p.printShop || holidayMarketLamp(city, p) || districtOf(city, p.lat, p.lng) === "";
      assert.equal(pool.some((q) => q.id === p.id), !out, `${city} ${p.id}`);
    }
    const w0 = strayWindow(city, BASE);
    for (let w = w0; w < w0 + 300; w++) {
      const l = strayOfWindow(city, w);
      if (!l) continue;
      assert.ok(l.kind !== "shop" && l.kind !== "station" && l.kind !== "counter" && l.kind !== "board" && !l.printShop, `${city} ${l.id}`);
      assert.equal(holidayMarketLamp(city, l), false, `${city} ${l.id}: never a possible night-market lamp`);
      assert.notEqual(districtOf(city, l.lat, l.lng), "");
    }
  }
});

test("strayLamp.ts is pure and shared: no client-only module, no clock of its own, no state", () => {
  const code = src("./strayLamp.ts");
  const imports = [...code.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports.sort(), ["./data.ts", "./district.ts", "./eventVault.ts", "./holidayLights.ts", "./nightMarket.ts", "./types"]);
  const bare = code.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(bare, /Date\.now|gameNow|window\.|document\.|localStorage|useGame|walletClient|react|leaflet|Math\.random/);
});

test("stray bonus = floor(0.50 x base) on a right answer, for all six tiers", async () => {
  assert.equal(TIER_ORDER.length, 6);
  // The pure rule, with bases where the floor matters.
  assert.deepEqual([1, 2, 3, 7, 30, 91, 0, -5, Number.NaN].map(strayBonus), [0, 1, 1, 3, 15, 45, 0, 0, 0]);
  const sql = await db();
  for (const tier of TIER_ORDER) {
    const base = TIER_VALUE[tier];
    const want = Math.floor(0.5 * base);
    assert.equal(strayBonus(base), want);
    assert.ok(want > 0);
    // Two accounts with the same history: one answers inside the window, one at the same lamp after it closed.
    const inn = `in-${tier}`, out = `out-${tier}`;
    await syncPlayer(sql, inn, snap, `${inn}-phone`);
    await syncPlayer(sql, out, snap, `${out}-phone`);
    const a = await awardGrade(sql, inn, `g-${tier}`, pay({ clearTier: tier, poiTier: tier }));
    const b = await awardGrade(sql, out, `g-${tier}`, pay({ clearTier: tier, poiTier: tier, now: WIN.e + 30 * MIN }));
    assert.ok(a.ok && b.ok);
    assert.equal(hasLine(b), false);
    assert.deepEqual(a.award!.boosts, [...b.award!.boosts, `Stray lamp +${want} coin`], tier);
    assert.equal(a.award!.coins - b.award!.coins, want, `${tier}: the extra is part of award.coins`);
    assert.deepEqual(a.award!.keys, b.award!.keys, "keys unchanged");
    assert.equal((await coinsOf(sql, inn)) - (await coinsOf(sql, out)), want, "and of the wallet");
    assert.deepEqual(await strayRows(sql, inn), [strayKey(CITY, WIN.w)]);
    assert.deepEqual(await strayRows(sql, out), []);
    assert.match(await gradeDetail(sql, inn, `g-${tier}`), /"sy":1/);
    assert.doesNotMatch(await gradeDetail(sql, out, `g-${tier}`), /"sy"/);
  }
  // The claim row: zero delta, flagged sy, naming the grade.
  const { id } = await canonicalWallet(sql, "in-green");
  const row = (await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${id} and op_key = ${strayKey(CITY, WIN.w)}`)[0]!;
  assert.deepEqual(JSON.parse(row.detail), { sy: 1, g: "g-green", pi: LAMP.id });
});

test("nothing on a wrong answer, nothing on a timeout: no extra, no claim, and the window is still there for a later right answer", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const before = await coinsOf(sql, "ann");
  const wrong = await awardGrade(sql, "ann", "w1", pay({ correct: false, mult: 0 }));
  assert.ok(wrong.ok);
  assert.equal(hasLine(wrong), false);
  assert.equal(wrong.award?.coins ?? 0, 0);
  const late = await awardGrade(sql, "ann", "w2", pay({ correct: false, mult: 0, timedOut: true, now: WIN.s + 3 * MIN }));
  assert.ok(late.ok);
  assert.equal(hasLine(late), false);
  assert.equal(late.award?.coins ?? 0, 0);
  assert.equal(await coinsOf(sql, "ann"), before);
  assert.deepEqual(await strayRows(sql, "ann"), [], "a miss writes no claim");
  assert.match(await gradeDetail(sql, "ann", "w1"), /"g":"miss"/, "it is still a fail for everything else");
  assert.doesNotMatch(await gradeDetail(sql, "ann", "w1"), /"sy"/);
  // A spark (no key spent) and a blitz card are not lit lamps.
  const spark = await awardGrade(sql, "ann", "s1", pay({ clearTier: null, poiTier: "white", now: WIN.s + 4 * MIN }));
  assert.equal(hasLine(spark), false);
  assert.deepEqual(await strayRows(sql, "ann"), []);
  // The miss took no slot: a right answer later in the same window still pays.
  const right = await awardGrade(sql, "ann", "r1", pay({ now: WIN.s + 6 * MIN }));
  assert.equal(hasLine(right), true);
  assert.deepEqual(await strayRows(sql, "ann"), [strayKey(CITY, WIN.w)]);
});

test("nothing on a second clear in the same window; the same nonce replayed pays nothing new; the next window pays again", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  const want = strayBonus(TIER_VALUE[LAMP.tier]);
  const first = await awardGrade(sql, "ann", "a1", pay());
  assert.deepEqual(first.award!.boosts.filter((b) => b.startsWith("Stray")), [strayLine(want)]);
  const after = await coinsOf(sql, "ann");
  // Same nonce again: the stored row, nothing new.
  const replay = await awardGrade(sql, "ann", "a1", pay());
  assert.equal(replay.replay, true);
  assert.deepEqual(replay.award, first.award);
  assert.equal(await coinsOf(sql, "ann"), after);
  // ...even replayed after the window closed.
  const lateReplay = await awardGrade(sql, "ann", "a1", pay({ now: WIN.e + 40 * MIN }));
  assert.equal(lateReplay.replay, true);
  assert.equal(await coinsOf(sql, "ann"), after);
  // A second clear in the same window: the usual grade, no extra.
  const second = await awardGrade(sql, "ann", "a2", pay({ now: WIN.s + 9 * MIN }));
  assert.ok(second.ok);
  assert.equal(hasLine(second), false);
  assert.doesNotMatch(await gradeDetail(sql, "ann", "a2"), /"sy"/);
  assert.deepEqual(await strayRows(sql, "ann"), [strayKey(CITY, WIN.w)]);
  // Two tokens racing in a fresh window: one extra between them.
  const N2 = nextOpen(CITY, BASE, WIN.w + 1);
  const race = await Promise.all(["r1", "r2", "r3"].map((n) => awardGrade(sql, "ann", n, pay({ now: N2.s + MIN }, N2.lamp))));
  assert.equal(race.filter(hasLine).length, 1, "the claim is per window: the next window pays again, once");
  assert.deepEqual(await strayRows(sql, "ann"), [strayKey(CITY, WIN.w), strayKey(CITY, N2.w)].sort());
  // Another player has their own claim in the same window.
  await syncPlayer(sql, "bob", snap, "bob-phone");
  assert.equal(hasLine(await awardGrade(sql, "bob", "b1", pay({ now: WIN.s + 10 * MIN }))), true);
});

test("no bonus when the window is closed: inside the 60 s grace pays, after it nothing; a deal time outside the window pays nothing", async () => {
  const sql = await db();
  const run = async (who: string, over: Partial<Pay>) => {
    await syncPlayer(sql, who, snap, `${who}-phone`);
    const r = await awardGrade(sql, who, "g", pay(over));
    assert.ok(r.ok, who);
    return hasLine(r);
  };
  const dealt = WIN.e - 10_000;
  assert.equal(await run("at-start", { now: WIN.s, dealtAt: WIN.s }), true);
  assert.equal(await run("last-ms", { now: WIN.e - 1, dealtAt: dealt }), true);
  assert.equal(await run("in-grace", { now: WIN.e + STRAY_SKEW_MS - 1, dealtAt: dealt }), true, "graded within the grace after the close");
  assert.equal(await run("past-grace", { now: WIN.e + STRAY_SKEW_MS, dealtAt: dealt }), false, "graded after end + 60 s");
  assert.equal(await run("long-after", { now: WIN.e + 30 * MIN, dealtAt: WIN.e + 30 * MIN - 5000 }), false);
  assert.equal(await run("before", { now: WIN.s - 1, dealtAt: WIN.s - 5000 }), false, "the server clock is not in the window yet");
  // The sealed deal time must sit inside [start − skew, end + skew] too.
  assert.equal(await run("dealt-just-before", { now: WIN.s + 1000, dealtAt: WIN.s - STRAY_SKEW_MS }), true);
  assert.equal(await run("dealt-early", { now: WIN.s + 1000, dealtAt: WIN.s - STRAY_SKEW_MS - 1 }), false, "a card held from before the window");
  assert.equal(await run("dealt-prev-window", { now: WIN.s + 1000, dealtAt: WIN.s - STRAY_EVERY_MS + MIN }), false);
  assert.equal(await run("dealt-future", { now: WIN.e - 1, dealtAt: WIN.e + STRAY_SKEW_MS + 1 }), false);
  assert.equal(strayPays({ city: CITY, poiId: LAMP.id, dealtAt: Number.NaN }, WIN.s + 1000), null, "an unusable deal time is no deal time");
  assert.equal(strayPays({ city: CITY, poiId: LAMP.id, dealtAt: WIN.s }, Number.NaN), null);
  assert.equal(strayPays({ city: CITY, poiId: LAMP.id, dealtAt: WIN.s }, WIN.s + 1000)?.w, WIN.w);
  for (const who of ["past-grace", "long-after", "before", "dealt-early", "dealt-prev-window", "dealt-future"]) assert.deepEqual(await strayRows(sql, who), [], who);
  // A skipped window never pays, whatever lamp is named.
  const city = CITY_IDS.find((c) => strayPattern(c).some(Boolean))!;
  let w = strayWindow(city, BASE);
  while (!straySkipped(city, w)) w++;
  const any = strayEligible(city)[0]!.poi;
  await syncPlayer(sql, "skip", snap, "skip-phone");
  const r = await awardGrade(sql, "skip", "g", pay({ city, now: strayStart(city, w) + MIN }, any));
  assert.equal(hasLine(r), false);
  assert.deepEqual(await strayRows(sql, "skip"), []);
});

test("the extra is base only: the same for a different streak, favorites or boosts, and the lamp's normal pay is unchanged", async () => {
  const sql = await db();
  const want = strayBonus(TIER_VALUE[LAMP.tier]);
  // Pairs of accounts with the same history and the same modifiers: one in the window, one out.
  const setups: [string, Partial<Pay>, number][] = [
    ["plain", {}, 0],
    ["perfect", { elapsedMs: 1500, mult: 2 }, 0],
    ["favs", { favs: ["science"] as never, topic: "science", streak: 12, loot: 2 }, 0],
    ["run", { streak: 4 }, 4],
  ];
  const extras: number[] = [];
  const pays: number[] = [];
  for (const [name, over, warm] of setups) {
    const got: number[] = [];
    for (const side of ["in", "out"] as const) {
      const who = `${name}-${side}`;
      await syncPlayer(sql, who, snap, `${who}-phone`);
      // A server-side streak: `warm` right answers on another lamp first (the fifth right pays the streak key).
      for (let i = 0; i < warm; i++) await awardGrade(sql, who, `warm-${i}`, pay({ now: WIN.s - 60 * MIN + i * MIN }, OTHER));
      const r = await awardGrade(sql, who, "g", pay({ ...over, now: side === "in" ? WIN.s + 2 * MIN : WIN.e + 20 * MIN }));
      assert.ok(r.ok, who);
      assert.equal(hasLine(r), side === "in", who);
      if (side === "in") assert.ok(r.award!.boosts.includes(strayLine(want)), who);
      got.push(r.award!.coins);
    }
    extras.push(got[0]! - got[1]!);
    pays.push(got[1]!);
  }
  assert.deepEqual(extras, setups.map(() => want), "the same extra whatever the modifiers");
  assert.ok(new Set(pays).size > 1, "while the grade under it really does change with them");
});

test("stray bonus cannot be granted from the client", async () => {
  const sql = await db(["0001_auth.sql", "0002_vault_clears.sql", "0004_plate_stats.sql", "0015_paint_finds.sql"]);
  // 1. No op, schema or request field carries a stray lamp, window or bonus.
  const api = src("./walletApi.ts");
  assert.doesNotMatch(api, /stray/i);
  const apply = src("./walletApply.ts");
  const ops = apply.slice(apply.indexOf("export type ClientOp"), apply.indexOf("export async function applyClientOp("));
  assert.doesNotMatch(ops, /stray/i, "no ClientOp names it");
  assert.doesNotMatch(src("./triviaSchema.ts"), /stray/i);
  assert.doesNotMatch(src("./triviaApi.ts"), /stray/i);
  for (const f of ["./store.ts", "./walletClient.ts", "../components/keyline/WalletSync.tsx", "../components/keyline/VaultModal.tsx", "../components/keyline/Hud.tsx"]) assert.doesNotMatch(src(f), /stray/i, f);
  const forged = { stray: 1, sy: 1, w: WIN.w, window: WIN.w, lamp: LAMP.id, strayLamp: LAMP.id, bonus: 9999, now: WIN.s + MIN, dealtAt: WIN.s + MIN };
  assert.deepEqual(Object.keys(GradeIn.parse({ token: "t".repeat(40), choice: "x", clientMs: 900, ...forged })).sort(), ["choice", "clientMs", "token"]);
  const dealPay = { streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: LAMP.lat, lng: LAMP.lng };
  const SAVE = "11111111-2222-3333-4444-555555555555";
  const dealIn = DealIn.parse({ city: CITY, cat: "local", poiId: OTHER.id, windowMs: 25000, seen: [], saveId: SAVE, ...forged, pay: { ...dealPay, ...forged } });
  for (const k of Object.keys(forged)) {
    assert.ok(!(k in dealIn), k);
    assert.ok(!(k in (dealIn.pay ?? {})) || k === "lat" || k === "lng", `pay.${k}`);
  }
  // The server reads the grade clock from its own deps, never from the request.
  const svc = src("./triviaService.ts");
  assert.match(svc, /const now = deps\.now\(\);/);
  assert.match(svc, /struck: x\?\.st === 1,\n[^\n]*\n\s*now,\n\s*canRoll:/);
  assert.match(apply, /const hit = strayPays\(full, pay\.now \?\? Date\.now\(\)\);/);
  // 2. A made-up wallet op does nothing.
  await syncPlayer(sql, "ivy", snap, "ivy-phone");
  const base = await coinsOf(sql, "ivy");
  for (const op of [{ kind: "stray", city: CITY, lamp: LAMP.id, w: WIN.w }, { kind: "ward", city: CITY, lamp: LAMP.id, lat: LAMP.lat, lng: LAMP.lng, stray: 1, w: WIN.w }]) {
    try {
      const r = await applyClientOp(sql, "ivy", op as unknown as ClientOp, { now: WIN.s + MIN });
      assert.ok(!r.award?.boosts.some((b) => b.startsWith("Stray")));
    } catch {
      /* an unknown op may throw: either way nothing is written */
    }
  }
  assert.equal(await coinsOf(sql, "ivy"), base);
  assert.deepEqual(await strayRows(sql, "ivy"), []);
  // 3. Guests and unsynced accounts: no wallet on the server, no extra, no row.
  const ghost = await awardGrade(sql, "ghost", "g", pay());
  assert.equal(hasLine(ghost), false);
  assert.deepEqual(await strayRows(sql, "ghost"), []);
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where op_key like ${"stray:%"}`)[0]?.n), 0);
  // 4. Through the real deal and grade service, with the server clock inside the window.
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
  const clock = { t: WIN.s + MIN };
  let nonce = 0;
  const deps: TriviaDeps = {
    now: () => clock.t,
    secret: "test-secret",
    pick: () => ({ ...BANK[nonce % 2]!, rarity: LAMP.tier }),
    card: (cid) => all.get(cid) ?? null,
    namedPoi: (c, pid) => CITIES[c as CityId]?.pois.find((p) => p.id === pid) ?? null,
    sql: async () => sql,
    rand: () => 0.42,
    nonce: () => `sy-${++nonce}`,
  };
  const rightOf = (c: { choices: string[] }) => c.choices.find((x) => x === "Colorado" || x === "27")!;
  const play = async (who: string, lamp: Poi, extra: Record<string, unknown> = {}) => {
    await syncPlayer(sql, who, snap, `${who}-phone`);
    const d = await dealFor(deps, { userId: who }, DealIn.parse({ city: CITY, cat: "local", poiId: lamp.id, windowMs: 25000, seen: [], saveId: SAVE, pay: { ...dealPay, lat: lamp.lat, lng: lamp.lng }, ...extra }));
    assert.ok(d.ok, `${who}: dealt`);
    if (!d.ok) throw new Error("no deal");
    clock.t += 4000;
    const g = await grade(deps, { userId: who }, { token: d.token, choice: rightOf(d.card), clientMs: 3900, ...extra } as never);
    assert.ok(g.ok && g.correct, `${who}: right`);
    if (!g.ok) throw new Error("no grade");
    return g;
  };
  const want = strayBonus(TIER_VALUE[LAMP.tier]);
  // The honest clear of the stray lamp pays the extra, with nothing stray in the request.
  const honest = await play("amy", LAMP);
  assert.ok(honest.award?.boosts.includes(strayLine(want)));
  assert.deepEqual(await strayRows(sql, "amy"), [strayKey(CITY, WIN.w)]);
  // Naming the stray lamp while clearing another lamp: nothing.
  const liar = await play("lia", OTHER, forged);
  assert.equal(hasLine(liar as never), false);
  assert.deepEqual(await strayRows(sql, "lia"), []);
  // Naming a past window once the server's clock has left it: nothing, on the stray lamp itself.
  clock.t = WIN.e + STRAY_SKEW_MS + 5000;
  const past = await play("pat", LAMP, forged);
  assert.equal(hasLine(past as never), false);
  assert.deepEqual(await strayRows(sql, "pat"), []);
  // A guest never reaches the wallet at all.
  clock.t = nextOpen(CITY, BASE, WIN.w + 1).s + MIN;
  const N2 = nextOpen(CITY, BASE, WIN.w + 1);
  const gd = await dealFor(deps, { userId: null }, DealIn.parse({ city: CITY, cat: "local", poiId: N2.lamp.id, windowMs: 25000, seen: [], saveId: SAVE, pay: { ...dealPay, lat: N2.lamp.lat, lng: N2.lamp.lng } }));
  assert.ok(gd.ok);
  if (gd.ok) {
    const gg = await grade(deps, { userId: null }, { token: gd.token, choice: rightOf(gd.card), clientMs: 900 });
    assert.ok(gg.ok);
    if (gg.ok) assert.equal(gg.award, undefined, "no server award for a guest");
  }
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where op_key like ${"stray:%"}`)[0]?.n), 1, "amy's one row is the only one");
});

test("client wiring: the Comet's painted pin on the lamp's own marker, the pin key, the QA hook, the guide line, nothing new drawn", () => {
  const map = src("../components/keyline/GameMap.tsx");
  // The halo is gated on the server wallet (the gate checkWard uses) and follows the dev clock.
  assert.match(map, /const strayId = walletLive\(\) \? \(strayLampAt\(st\.cityId, gameNow\(\)\)\?\.lamp\.id \?\? ""\) : "";/);
  assert.match(map, /: poi\.id === strayId\n\s*\? cometPinHtml\(\{ cooling, lockout: cooling && v\?\.lockout === true, title: [^\n]*STRAY_PIN_TITLE \}\)/);
  assert.match(map, /const comet = isComet\(poi\.id\) \|\| poi\.id === strayId;/);
  assert.match(map, /const sy = walletLive\(\) \? strayLampAt\(cid, gameNow\(\)\) : null;/);
  assert.match(map, /\|comet:\$\{cs\.open \? cs\.w : "-"\}\|stray:\$\{sy \? sy\.w : "-"\}`;/);
  assert.match(map, /stray: \(\) => strayLampAt\(useGame\.getState\(\)\.cityId, gameNow\(\)\),/);
  // The lamp stays a street lamp: its id is its own, so the comet-only branches never see it.
  for (let w = WIN.w; w < WIN.w + 40; w++) {
    const l = strayOfWindow(CITY, w);
    if (l) assert.equal(isComet(l.id), false);
  }
  // No new art, pin style or overlay: the stylesheet and the pin module know nothing of it.
  assert.doesNotMatch(src("../styles.css"), /stray/i);
  assert.doesNotMatch(src("./pins.ts"), /stray/i);
  // One Field Guide line.
  assert.match(src("../components/keyline/FieldGuide.tsx"), /<li>\{STRAY_GUIDE\}<\/li>/);
  assert.equal(STRAY_GUIDE, "Stray lamp: signed in, one street lamp in each city wakes with a halo for 15 minutes every 90 minutes (never while a Comet is open). A right answer there pays +50% of that vault's base coin, once per waking; the next one wakes in another district.");
});

test("version: 0.1.185 / k1185a everywhere, and no migration for the stray lamp", () => {
  const v = src("../version.ts");
  assert.match(v, /APP_VERSION = "0\.1\.185"/);
  assert.match(v, /PUBLISH_STAMP = "k1185a"/);
  assert.match(v, /\n\/\/ 0\.1\.185: Stray lamp — [^\n]*\(k1185a\)\.\n$/);
  const pkg = JSON.parse(src("../../package.json")) as { version: string; scripts: { test: string } };
  assert.equal(pkg.version, "0.1.185");
  assert.match(pkg.scripts.test, / src\/game\/strayLamp0185\.test\.ts /);
  const lock = JSON.parse(src("../../package-lock.json")) as { version: string; packages: Record<string, { version?: string }> };
  assert.equal(lock.version, "0.1.185");
  assert.equal(lock.packages[""]!.version, "0.1.185");
  assert.doesNotMatch(src("./strayLamp.ts"), /migration 00|create table/);
  // The fade (CARD-189) is not built: the extra only has to be part of the grade's coin, and says so.
  assert.match(src("./walletApply.ts"), /Fade \(CARD-189, not built\): the extra is part of award\.coins/);
});
