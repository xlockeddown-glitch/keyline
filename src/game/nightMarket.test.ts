import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITIES } from "./data.ts";
import { distM } from "./geo.ts";
import { isFreeway, isWalkableWay } from "./walkable.ts";
import { TIER_VALUE, bankDownSpec, bankUpSpec } from "./rewards.ts";
import { DAILY_REWARD, payDaily } from "./dailyRun.ts";
import { COATS, LANTERN_SKINS } from "./cosmetics.ts";
import { MARKET_STREETS } from "./marketStreets.ts";
import {
  FREEWAY_NAME,
  MARKET_CLASSES,
  MARKET_CURB_M,
  MARKET_DOUBLES,
  MARKET_HOUR_MS,
  MARKET_LAMP_M,
  MARKET_MULT,
  MARKET_RADIUS_M,
  MARKET_TAG,
  distToStreet,
  doubleKeys,
  eligibleStreets,
  hash32,
  hourLabel,
  marketAt,
  marketIndex,
  marketMatches,
  marketMult,
  marketOverflowCoin,
  marketPay,
  marketSeed,
  marketStreets,
  nextMarket,
  onMarket,
  spawnComponent,
  utcHour,
  wayReachable,
  type MarketStreet,
  type OsmWay,
} from "./nightMarket.ts";
import type { CityId, Poi, Tier } from "./types";

const ALL = Object.keys(CITIES) as CityId[];
const H0 = utcHour(Date.parse("2026-10-03T00:00:00Z"));
const at = (h: number, min = 0) => h * MARKET_HOUR_MS + min * 60_000;

// ───────── seed determinism ─────────

test("seed: city + UTC hour, nothing else — every walker in a city sees the same market all hour", () => {
  assert.equal(hourLabel(H0 + 10), "2026-10-03T10");
  // Pinned so a refactor can't silently reshuffle everyone's market.
  assert.equal(hash32("keyline-night-market|detroit|2026-10-03T10"), marketSeed("detroit", H0 + 10));
  assert.equal(marketSeed("detroit", H0 + 10), 4213043524);
  for (const city of ALL) {
    for (let h = H0; h < H0 + 72; h++) {
      const a = marketAt(city, at(h, 0))!;
      const b = marketAt(city, at(h, 59) + 59_999)!;
      assert.equal(a.street.name, b.street.name, `${city} ${hourLabel(h)} same street all hour`);
      assert.equal(a.startsAt, at(h));
      assert.equal(a.endsAt, at(h + 1));
      assert.deepEqual(marketAt(city, at(h, 30)), marketAt(city, at(h, 30)));
    }
  }
  // Two "players" in different zones at the same instant: same hour, same street (the seed is UTC).
  const instant = Date.parse("2026-10-03T15:20:00-05:00");
  assert.equal(marketAt("chicago", instant)!.street.name, marketAt("chicago", Date.parse("2026-10-03T20:20:00Z"))!.street.name);
  assert.notEqual(marketSeed("detroit", H0), marketSeed("austin", H0));
  assert.notEqual(marketSeed("detroit", H0), marketSeed("detroit", H0 + 1));
});

test("seed: over a week every city's market moves around many streets", () => {
  for (const city of ALL) {
    const seen = new Set<string>();
    for (let h = H0; h < H0 + 168; h++) seen.add(marketAt(city, at(h))!.street.name);
    assert.ok(seen.size >= Math.min(8, marketStreets(city).length), `${city}: only ${seen.size} streets in a week`);
  }
});

test("next market is the following hour's draw", () => {
  for (const city of ALL) {
    const n = nextMarket(city, at(H0 + 5, 42))!;
    assert.equal(n.hour, H0 + 6);
    assert.equal(n.street.name, marketAt(city, at(H0 + 6))!.street.name);
  }
});

// ───────── no repeat back-to-back ─────────

test("never the same street two hours running (every city, 60 days of hours)", () => {
  for (const city of ALL) {
    const n = marketStreets(city).length;
    let prev = marketIndex(city, H0 - 1, n);
    for (let h = H0; h < H0 + 24 * 60; h++) {
      const i = marketIndex(city, h, n);
      assert.notEqual(i, prev, `${city} repeats at ${hourLabel(h)}`);
      prev = i;
    }
  }
});

test("no repeat holds for small lists too (2 and 3 streets) and across the UTC day line", () => {
  for (const n of [2, 3, 4, 5]) {
    for (const city of ALL) {
      for (let h = H0 - 30; h < H0 + 500; h++) {
        assert.notEqual(marketIndex(city, h, n), marketIndex(city, h + 1, n), `n=${n} ${city} ${h}`);
        assert.ok(marketIndex(city, h, n) >= 0 && marketIndex(city, h, n) < n);
      }
    }
  }
  assert.equal(marketIndex("detroit", H0, 1), 0);
});

// ───────── street eligibility ─────────

/** Packed line from metre offsets east/north of a point. */
function line(o: { lat: number; lng: number }, pts: [number, number][]) {
  const out: number[] = [];
  for (const [e, n] of pts) out.push(Number((o.lat + n / 111_320).toFixed(6)), Number((o.lng + e / (111_320 * Math.cos((o.lat * Math.PI) / 180))).toFixed(6)));
  return out;
}

function lamp(id: string, o: { lat: number; lng: number }, e: number, n: number): Poi {
  return { id, name: id, lat: o.lat + n / 111_320, lng: o.lng + e / (111_320 * Math.cos((o.lat * Math.PI) / 180)), kind: "landmark", tier: "white", lore: "" };
}

test("eligibility: walkable, reachable from spawn, never a freeway, with a lamp", () => {
  const o = { lat: 42.33, lng: -83.05 };
  const ways: OsmWay[] = [
    { tags: { highway: "residential", name: "Main Street" }, line: line(o, [[0, 0], [200, 0], [400, 0]]) },
    { tags: { highway: "residential", name: "Quiet Lane" }, line: line(o, [[400, 0], [400, 300]]) }, // reachable, no lamp
    { tags: { highway: "residential", name: "Island Way" }, line: line(o, [[0, 600], [300, 600]]) }, // lamp, but no walk to it
    { tags: { highway: "motorway", name: "Lodge Freeway" }, line: line(o, [[0, 0], [0, -400]]) }, // lamp, freeway
    { tags: { highway: "primary", name: "Lodge Freeway" }, line: line(o, [[0, -400], [0, -600]]) }, // surface stretch of a freeway name
    { tags: { highway: "unclassified", name: "Fisher Freeway Service Drive" }, line: line(o, [[200, 0], [200, -300]]) },
    { tags: { highway: "trunk", name: "Jefferson Trunk" }, line: line(o, [[400, 0], [700, 0]]) },
    { tags: { highway: "tertiary", name: "No Foot Road", foot: "no" }, line: line(o, [[0, 0], [-300, 0]]) },
    { tags: { highway: "residential", name: "Tunnel Street", tunnel: "yes" }, line: line(o, [[200, 0], [200, 250]]) },
    { tags: { highway: "footway" }, line: line(o, [[400, 300], [500, 300]]) },
  ];
  const pois = [
    lamp("on-main", o, 100, 20),
    lamp("island", o, 150, 610),
    lamp("freeway", o, 10, -300),
    lamp("fisher", o, 210, -150),
    lamp("trunk", o, 550, 10),
    lamp("nofoot", o, -150, 10),
    lamp("tunnel", o, 205, 125),
    { ...lamp("shop", o, 405, 150), kind: "shop" as const },
  ];
  const { streets, why } = eligibleStreets(ways, o, pois, { minLenM: 100 });
  assert.deepEqual(
    streets.map((s) => s.name),
    ["Main Street"],
  );
  assert.deepEqual(streets[0]!.lamps, ["on-main"]);
  assert.equal(why.get("Quiet Lane"), "no-lamps"); // the outfitter isn't a lamp
  assert.equal(why.get("Island Way"), "unreachable");
  assert.equal(why.get("Lodge Freeway"), "freeway");
  assert.equal(why.get("Fisher Freeway Service Drive"), "freeway");
  assert.equal(why.get("Jefferson Trunk"), "freeway");
  assert.equal(why.get("No Foot Road"), "unwalkable");
  assert.equal(why.get("Tunnel Street"), "underground");
});

test("eligibility: a spawn on an island footway still finds the street network around it", () => {
  const o = { lat: 43.65, lng: -79.38 };
  const ways: OsmWay[] = [
    { tags: { highway: "footway" }, line: line(o, [[0, 0], [5, 5]]) }, // tiny plaza island right at spawn
    { tags: { highway: "residential", name: "Queen Street" }, line: line(o, [[-200, 30], [0, 30], [200, 30], [400, 30]]) },
  ];
  const { root, comp } = spawnComponent(ways, o);
  assert.ok(wayReachable(ways[1]!, comp, root));
  const { streets } = eligibleStreets(ways, o, [lamp("hall", o, 50, 40)], { minLenM: 100 });
  assert.deepEqual(streets.map((s) => s.name), ["Queen Street"]);
});

test("eligibility on real OSM (Detroit downtown snapshot): no freeway, every pick walkable and reachable", () => {
  const fx = JSON.parse(readFileSync(new URL("./fixtures/paths-daily-detroit.json", import.meta.url), "utf8")) as { ways: OsmWay[] };
  const city = CITIES.detroit;
  const { streets, why } = eligibleStreets(fx.ways, city.spawn, city.pois);
  assert.ok(streets.length >= 5, `only ${streets.length} streets`);
  const { comp, root } = spawnComponent(fx.ways, city.spawn);
  for (const s of streets) {
    const named = fx.ways.filter((w) => w.tags.name === s.name);
    assert.ok(named.every((w) => !isFreeway(w.tags)), `${s.name} has a freeway stretch`);
    assert.ok(!FREEWAY_NAME.test(s.name), s.name);
    assert.ok(named.some((w) => isWalkableWay(w.tags) && wayReachable(w, comp, root)), `${s.name} not reachable`);
  }
  for (const name of ["John C. Lodge Freeway", "Fisher Freeway", "Chrysler Freeway", "Walter P. Chrysler Freeway"]) {
    if (why.has(name)) assert.equal(why.get(name), "freeway", name);
    assert.ok(!streets.some((s) => s.name === name), name);
  }
});

test("baked market streets: every city has a list, every street walkable, never a freeway, near spawn, with real lamps", () => {
  for (const city of ALL) {
    const list = MARKET_STREETS[city] ?? [];
    assert.ok(list.length >= 3, `${city}: ${list.length} streets`);
    const c = CITIES[city];
    const names = new Set<string>();
    for (const s of list) {
      assert.ok(!names.has(s.name), `${city}: ${s.name} twice`);
      names.add(s.name);
      assert.ok(!FREEWAY_NAME.test(s.name), `${city}: ${s.name}`);
      for (const hw of s.hw) {
        assert.ok(MARKET_CLASSES.has(hw), `${city} ${s.name}: ${hw}`);
        assert.ok(isWalkableWay({ highway: hw }) && !isFreeway({ highway: hw }), `${city} ${s.name}: ${hw}`);
      }
      assert.ok(s.lamps.length >= 1, `${city} ${s.name}: no lamps`);
      for (const id of s.lamps) {
        const p = c.pois.find((x) => x.id === id);
        assert.ok(p && p.kind !== "shop", `${city} ${s.name}: lamp ${id}`);
        assert.ok(distToStreet(p.lat, p.lng, s) <= MARKET_LAMP_M + 6, `${city} ${s.name}: ${id} ${Math.round(distToStreet(p.lat, p.lng, s))} m off`);
      }
      for (const l of s.lines) {
        for (let i = 0; i + 1 < l.length; i += 2) assert.ok(distM(c.spawn.lat, c.spawn.lng, l[i]!, l[i + 1]!) <= MARKET_RADIUS_M + 5, `${city} ${s.name} leaves the radius`);
      }
    }
  }
});

test("baked market streets agree with the offline OSM snapshots (reachable on foot from spawn)", () => {
  for (const [city, file] of [["detroit", "paths-daily-detroit"], ["austin", "paths-daily-austin"], ["nyc", "paths-daily-nyc"]] as [CityId, string][]) {
    const fx = JSON.parse(readFileSync(new URL(`./fixtures/${file}.json`, import.meta.url), "utf8")) as { ways: OsmWay[] };
    const { comp, root } = spawnComponent(fx.ways, CITIES[city].spawn);
    let checked = 0;
    for (const s of MARKET_STREETS[city] ?? []) {
      const named = fx.ways.filter((w) => w.tags.name === s.name);
      if (!named.length) continue; // snapshot radius is a little different
      checked++;
      assert.ok(named.every((w) => !isFreeway(w.tags)), `${city} ${s.name}: freeway stretch`);
      assert.ok(named.some((w) => isWalkableWay(w.tags) && wayReachable(w, comp, root)), `${city} ${s.name}: unreachable in snapshot`);
    }
    assert.ok(checked >= 5, `${city}: only ${checked} streets checked`);
  }
});

// ───────── doubling scope ─────────

test("doubling: trivia-card coin and bonus matches on the market street pay ×2; off it, ×1", () => {
  assert.equal(MARKET_MULT, 2);
  assert.equal(MARKET_TAG, "Night market ×2");
  const pay = marketPay(243, { blue: 1, white: 1 }, 2);
  assert.deepEqual(pay, { coin: 486, keys: { blue: 2, white: 2 }, extraCoin: 243, extraMatches: 2 });
  assert.deepEqual(marketPay(243, { blue: 1 }, 1), { coin: 243, keys: { blue: 1 }, extraCoin: 0, extraMatches: 0 });
  assert.deepEqual(doubleKeys({}, 2), {});
  // Sparks and street matches: two, but never past the pocket cap, and never fewer than one.
  assert.equal(marketMatches(0, 15, 2), 2);
  assert.equal(marketMatches(14, 15, 2), 1);
  assert.equal(marketMatches(3, 15, 1), 1);
  // …and a market match the pocket can't hold pays its ladder value in coin.
  assert.equal(marketOverflowCoin("white", 2, 1), 30);
  assert.equal(marketOverflowCoin("blue", 2, 2), 0);
  assert.equal(marketOverflowCoin("green", 1, 1), 0);
});

test("doubling: on-street test — baked lamps, measured blanks/series/matches, and only during that hour", () => {
  for (const city of ALL) {
    const m = marketAt(city, at(H0 + 3))!;
    const s: MarketStreet = m.street;
    const poi = CITIES[city].pois.find((p) => p.id === s.lamps[0])!;
    assert.ok(onMarket(m, { kind: "lamp", poiId: poi.id, lat: poi.lat, lng: poi.lng }));
    assert.equal(marketMult(city, at(H0 + 3, 10), { kind: "lamp", poiId: poi.id, lat: poi.lat, lng: poi.lng }), 2);
    const on = { lat: s.lines[0]![0]!, lng: s.lines[0]![1]! };
    assert.ok(onMarket(m, { kind: "match", ...on }));
    assert.ok(onMarket(m, { kind: "series", ...on }));
    // 200 m north of every point of the street is off it.
    const off = { lat: on.lat + 0.01, lng: on.lng };
    if (distToStreet(off.lat, off.lng, s) > MARKET_CURB_M) assert.ok(!onMarket(m, { kind: "match", ...off }));
    // A lamp that isn't on this hour's street pays ×1 (unless it also stands on it).
    const other = CITIES[city].pois.find((p) => p.kind !== "shop" && !s.lamps.includes(p.id) && distToStreet(p.lat, p.lng, s) > MARKET_LAMP_M)!;
    assert.equal(marketMult(city, at(H0 + 3, 10), { kind: "lamp", poiId: other.id, lat: other.lat, lng: other.lng }), 1);
    assert.ok(!onMarket(null, { kind: "lamp", poiId: poi.id, lat: poi.lat, lng: poi.lng }));
  }
});

test("doubling scope: Daily Lantern Run, print shop prices, the bank and the locked ladder are untouched", () => {
  assert.equal(MARKET_DOUBLES.lampCoin, true);
  assert.equal(MARKET_DOUBLES.lampMatches, true);
  assert.equal(MARKET_DOUBLES.spark, true);
  assert.equal(MARKET_DOUBLES.streetMatch, true);
  assert.equal(MARKET_DOUBLES.seriesCoin, true);
  for (const k of ["dailyRun", "printShop", "bank", "ride", "boosts", "materials", "clears"] as const) assert.equal(MARKET_DOUBLES[k], false, k);
  assert.deepEqual(TIER_VALUE, { white: 30, blue: 90, green: 270, amber: 810, red: 2430, violet: 7290 });
  assert.deepEqual(DAILY_REWARD, { white: 2, blue: 1 });
  const keys: Record<Tier, number> = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  assert.deepEqual(payDaily(keys, 0).added, { white: 2, blue: 1 });
  assert.deepEqual(bankUpSpec("white"), { pay: "white", payN: 4, get: "blue", getN: 1 });
  assert.deepEqual(bankDownSpec("blue"), { pay: "blue", payN: 1, get: "white", getN: 3 });
  // Print shop prices stay the 0.0.45 catalogue.
  assert.deepEqual(
    Object.fromEntries([...Object.entries(COATS), ...Object.entries(LANTERN_SKINS)].map(([id, c]) => [id, c.price])),
    {
      oilskin: { white: 15, blue: 0 },
      bottle: { white: 10, blue: 4 },
      oxblood: { white: 8, blue: 6 },
      plum: { white: 4, blue: 10 },
      copper: { white: 10, blue: 0 },
      iron: { white: 8, blue: 2 },
      verdigris: { white: 6, blue: 4 },
      nickel: { white: 0, blue: 8 },
    },
  );
  // The store only reaches for the market inside the lamp / spark / series / street-match paths.
  const src = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  for (const fn of ["payDailyRun", "bankUp", "bankDown", "payCosmetic", "craft", "buyScout", "buyKiosk", "finishRideRound", "claimWheel", "claimCrate", "claimPulse"]) {
    const start = src.search(new RegExp(`\\n  ${fn}: \\([\\w, ]*\\) => \\{\\n`));
    assert.ok(start > 0, fn);
    const end = src.indexOf("\n  },\n", start);
    const body = src.slice(start, end);
    assert.ok(!/market/i.test(body), `${fn} must not read the night market`);
  }
  // The store's lamp clocks are performance.now(); the market must read the wall clock (UTC hour).
  assert.ok(!/market\w*\([^)]*startedAt/.test(src), "market timed off performance.now()");
  assert.ok(/marketAt\(city\.id, ov\.dealtAt \?\? Date\.now\(\)\)/.test(src));
  // Leaderboard clears: one postClear per trivia card, market or not.
  const from = src.indexOf("const lampMarket");
  const lampBody = src.slice(from, src.indexOf("closeVault: () => {", from));
  assert.equal((lampBody.match(/postClear\(/g) ?? []).length, 1);
});
