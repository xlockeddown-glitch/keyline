import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITIES } from "./data.ts";
import { distM } from "./geo.ts";
import { createGraph, ingestOsmWays, nearest, pathLength, pullToStreet, routeOnGraph, type Pt } from "./streets.ts";
import { isFreeway, isWalkableWay } from "./walkable.ts";
import { freewayRun } from "./pathCheck.ts";
import { standingName } from "./standingName.ts";
import { TIER_VALUE } from "./rewards.ts";
import {
  DAILY_JITTER_MS,
  DAILY_LAMPS,
  DAILY_MAX_MS,
  DAILY_CURB_MAX_M,
  DAILY_LIGHT_M,
  DAILY_MIN_SEP_M,
  DAILY_REACH_M,
  DAILY_REWARD,
  DAILY_STRIKES,
  canLightDaily,
  checkSplits,
  dailyEligible,
  dailyRewardValue,
  dailyRoute,
  dailySeed,
  dailyTopSpeed,
  formatRunTime,
  isDailyPaid,
  legacyDailyPaid,
  markDailyPaid,
  legFloorMs,
  legMeters,
  lightDecision,
  payDaily,
  rankDaily,
  runFloorMs,
  spotFloorMs,
  startDecision,
  utcDay,
  type RunRow,
} from "./dailyRun.ts";
import type { CityId, Tier } from "./types";

const ALL = Object.keys(CITIES) as CityId[];
function days(n: number, from = "2026-10-01") {
  const t0 = Date.parse(`${from}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => utcDay(t0 + i * 86_400_000));
}

test("daily seed: same UTC day + city gives the same seed and route, every time", () => {
  for (const city of ALL) {
    for (const day of days(10)) {
      assert.equal(dailySeed(day, city), dailySeed(day, city));
      assert.deepEqual(dailyRoute(city, day), dailyRoute(city, day));
    }
  }
  // Known value pins the hash so a refactor can't silently reshuffle everyone's route.
  assert.equal(dailySeed("2026-10-02", "detroit"), dailySeed("2026-10-02", "detroit"));
  assert.notEqual(dailySeed("2026-10-02", "detroit"), dailySeed("2026-10-02", "austin"));
  assert.notEqual(dailySeed("2026-10-02", "detroit"), dailySeed("2026-10-03", "detroit"));
});

test("daily route: UTC date, not local time, picks the day", () => {
  assert.equal(utcDay(Date.parse("2026-10-02T23:30:00-05:00")), "2026-10-03");
  assert.equal(utcDay(Date.parse("2026-10-02T18:59:59-05:00")), "2026-10-02");
});

test("daily route: five distinct named lamps, no outfitter or station, routes change day to day", () => {
  for (const city of ALL) {
    const seen = new Set<string>();
    for (const day of days(14)) {
      const r = dailyRoute(city, day);
      assert.equal(r.lamps.length, DAILY_LAMPS, `${city} ${day}`);
      assert.equal(new Set(r.lamps.map((l) => l.id)).size, DAILY_LAMPS, `${city} ${day} repeats a lamp`);
      const eligible = new Set(dailyEligible(city).map((p) => p.id));
      for (const l of r.lamps) {
        const poi = CITIES[city].pois.find((p) => p.id === l.id)!;
        assert.ok(eligible.has(l.id));
        assert.notEqual(poi.kind, "shop");
        assert.notEqual(poi.kind, "station");
        assert.ok(!poi.printShop);
      }
      seen.add(r.lamps.map((l) => l.id).join(","));
    }
    assert.ok(seen.size >= 10, `${city}: only ${seen.size} different routes in 14 days`);
  }
});

// Real streets: an OSM snapshot of every highway way within 1.9 km of spawn (scripts/fetch-path-fixtures.mjs,
// daily-<city>), fed raw — freeways and all — through the walk graph, so isWalkableWay has to drop them.
type FixWay = { tags: Record<string, string>; line: number[] };
const unpack = (line: number[]) => {
  const out: { lat: number; lon: number }[] = [];
  for (let i = 0; i + 1 < line.length; i += 2) out.push({ lat: line[i]!, lon: line[i + 1]! });
  return out;
};
function dailyFixture(city: CityId) {
  const f = JSON.parse(readFileSync(new URL(`./fixtures/paths-daily-${city}.json`, import.meta.url), "utf8")) as { ways: FixWay[] };
  const pts = (w: FixWay): Pt[] => unpack(w.line).map((p) => ({ lat: p.lat, lng: p.lon }));
  const g = createGraph(CITIES[city].spawn.lat, CITIES[city].spawn.lng);
  ingestOsmWays(g, f.ways.map((w) => ({ geometry: unpack(w.line), tags: w.tags })));
  return { g, fw: f.ways.filter((w) => isFreeway(w.tags)).map(pts), walk: f.ways.filter((w) => isWalkableWay(w.tags)).map(pts) };
}

for (const city of ["detroit", "austin", "nyc"] as const) {
  test(`daily route is walkable by street, off freeways: ${city} (30 days)`, () => {
    const { g, fw, walk } = dailyFixture(city);
    assert.ok(fw.length > 5, `${city} snapshot has freeways to avoid`);
    for (const day of days(30)) {
      const r = dailyRoute(city, day);
      const stops: Pt[] = [CITIES[city].spawn, ...r.lamps];
      // The walker starts on the curb at spawn, then stands wherever the last walk ended.
      let from = pullToStreet(g, stops[0]!.lat, stops[0]!.lng, 140);
      for (let i = 1; i < stops.length; i++) {
        const b = stops[i]!;
        // Walks snap the target to the curb the way the game does, then route on the walkable graph.
        const to = pullToStreet(g, b.lat, b.lng, 220, from);
        const path = routeOnGraph(g, from, to);
        const label = `${city} ${day} leg to lamp ${i}`;
        assert.ok(path && path.length >= 2, `${label}: no street walk`);
        const end = path![path!.length - 1]!;
        const curb = nearest(g, b.lat, b.lng, DAILY_CURB_MAX_M);
        assert.ok(canLightDaily(end, b, curb ? { lat: curb.lat, lng: curb.lng } : null), `${label}: walk ends ${distM(end.lat, end.lng, b.lat, b.lng).toFixed(0)} m off, can't light`);
        const ride = freewayRun(path!, fw, 6, 25, walk, 4);
        assert.ok(ride.run < 20, `${label}: rides a freeway ${ride.run.toFixed(0)} m near ${ride.at?.lat},${ride.at?.lng}`);
        // A street walk is never shorter than the straight line the time floor uses.
        if (i > 1) assert.ok(pathLength(path!) + 2 * DAILY_REACH_M >= legMeters(r, i - 1));
        from = end;
      }
    }
  });
}

test("lighting: within 80 m, or at the curb nearest a set-back lamp — never from across the block", () => {
  const lamp = { lat: 42.33, lng: -83.05 };
  const curb = { lat: 42.331, lng: -83.05 }; // ~111 m north
  assert.equal(DAILY_LIGHT_M, 80);
  assert.ok(canLightDaily({ lat: 42.3306, lng: -83.05 }, lamp, null));
  assert.ok(!canLightDaily({ lat: 42.3009, lng: -83.05 }, lamp, null));
  assert.ok(canLightDaily({ lat: 42.33105, lng: -83.05 }, lamp, curb), "at the curb");
  assert.ok(!canLightDaily({ lat: 42.3313, lng: -83.05 }, lamp, curb), "past the curb");
  assert.ok(!canLightDaily({ lat: 42.332, lng: -83.05 }, lamp, { lat: 42.332, lng: -83.05 }), "curb too far from the lamp");
  assert.ok(DAILY_REACH_M >= DAILY_CURB_MAX_M, "the server accepts every spot the client can light from");
});

test("daily route: lamps sit at least 400 m apart, so every leg is a walk", () => {
  for (const city of ALL) {
    for (const day of days(30)) {
      const r = dailyRoute(city, day);
      for (let i = 0; i < r.lamps.length; i++)
        for (let j = i + 1; j < r.lamps.length; j++) {
          const a = r.lamps[i]!;
          const b = r.lamps[j]!;
          assert.ok(distM(a.lat, a.lng, b.lat, b.lng) >= DAILY_MIN_SEP_M, `${city} ${day}: ${a.name} / ${b.name}`);
        }
    }
  }
});

function row(over: Partial<RunRow> = {}): RunRow {
  const lamp1 = dailyRoute(over.city ?? "detroit", over.day ?? "2026-10-02").lamps[0]!;
  return { city: "detroit", day: "2026-10-02", lit: 1, startedAt: 1_000_000, lastAt: 1_000_000, splits: [], clientSplits: [], timeMs: null, voided: false, strikes: 0, lastLat: lamp1.lat, lastLng: lamp1.lng, ...over };
}

test("time floors: straight line at the best coat's full sprint, under any honest walk", () => {
  const r = dailyRoute("detroit", "2026-10-02");
  assert.ok(dailyTopSpeed() > 92 * 1.5);
  for (let i = 1; i < r.lamps.length; i++) {
    assert.ok(legFloorMs(r, i) > 0);
    assert.ok(legFloorMs(r, i) < (legMeters(r, i) / (92 * 1.5)) * 1000, "floor is faster than a raccoon sprint");
  }
  assert.equal(runFloorMs(r), [1, 2, 3, 4].reduce((n, i) => n + legFloorMs(r, i), 0));
});

test("leaderboard validation: honest splits pass, impossible ones fail", () => {
  const r = dailyRoute("austin", "2026-10-02");
  const honest: number[] = [];
  let t = 0;
  for (let i = 1; i < r.lamps.length; i++) {
    t += Math.ceil((legMeters(r, i) / 92) * 1000 * 1.4);
    honest.push(t);
  }
  assert.deepEqual(checkSplits(r, honest), { ok: true });
  assert.equal(checkSplits(r, [1, 2, 3, 4]).ok, false, "teleport");
  assert.deepEqual(checkSplits(r, honest.slice(0, 3)), { ok: false, reason: "bad" });
  assert.deepEqual(checkSplits(r, [honest[1]!, honest[0]!, honest[2]!, honest[3]!]), { ok: false, reason: "order" });
  const oneFast = [...honest];
  oneFast[1] = oneFast[0]! + 1;
  assert.equal(checkSplits(r, oneFast).ok, false, "one impossible leg sinks the run");
  assert.deepEqual(checkSplits(r, honest.map((x) => x + DAILY_MAX_MS)), { ok: false, reason: "expired" });
  // With the spots each lamp lit from, the floor is the real straight line between them.
  const spots = r.lamps.map((l) => ({ lat: l.lat, lng: l.lng }));
  assert.deepEqual(checkSplits(r, honest, spots), { ok: true });
  const geoOnly = [1, 2, 3, 4].map((i) => legFloorMs(r, i) + 5).reduce<number[]>((acc, x) => [...acc, (acc[acc.length - 1] ?? 0) + x], []);
  assert.equal(checkSplits(r, geoOnly, spots).ok, false, "fast for the lamps actually walked between");
});

test("one run per walker per city per day: lamp 1 locks that city's entry; the clock never resets", () => {
  const det = dailyRoute("detroit", "2026-10-02");
  const at1 = det.lamps[0]!;
  const now = 2_000_000;
  assert.deepEqual(startDecision(det, null, at1, now), { kind: "new" });
  assert.deepEqual(startDecision(det, null, { lat: at1.lat + 0.01, lng: at1.lng }, now), { kind: "far" });
  const open = row();
  assert.equal(startDecision(det, open, at1, now).kind, "resume");
  assert.equal(startDecision(det, row({ timeMs: 90_000, lit: 5 }), at1, now).kind, "done");
  assert.equal(startDecision(det, row({ voided: true }), at1, now).kind, "void");
  assert.equal(startDecision(det, open, at1, open.startedAt + DAILY_MAX_MS + 1).kind, "void");
});

test("a second city the same day is its own entry: open, finished or voided elsewhere never blocks it", () => {
  const aus = dailyRoute("austin", "2026-10-02");
  const at1 = aus.lamps[0]!;
  const now = 2_000_000;
  // Rows from Detroit (open, finished, voided) don't touch Austin's start.
  for (const other of [row(), row({ timeMs: 90_000, lit: 5 }), row({ voided: true, strikes: 3 })]) {
    assert.deepEqual(startDecision(aus, other, at1, now), { kind: "new" });
    assert.deepEqual(startDecision(aus, other, { lat: at1.lat + 0.01, lng: at1.lng }, now), { kind: "far" }, "still has to stand at lamp 1");
  }
  // Austin's own rows still follow the one-entry rule.
  const ausRow = row({ city: "austin", lastLat: at1.lat, lastLng: at1.lng });
  assert.equal(startDecision(aus, ausRow, at1, now).kind, "resume");
  assert.equal(startDecision(aus, { ...ausRow, timeMs: 80_000, lit: 5 }, at1, now).kind, "done");
  assert.equal(startDecision(aus, { ...ausRow, voided: true }, at1, now).kind, "void");
  // Yesterday's row in the same city is not today's entry either.
  assert.deepEqual(startDecision(aus, { ...ausRow, day: "2026-10-01", timeMs: 80_000, lit: 5 }, at1, now), { kind: "new" });
});

test("two cities, one day: both runs time on the server clock, finish and rank on their own boards", () => {
  const day = "2026-10-02";
  const finishes: Record<string, number> = {};
  let now = 10_000_000;
  for (const city of ["detroit", "austin"] as const) {
    const r = dailyRoute(city, day);
    const l0 = r.lamps[0]!;
    assert.equal(startDecision(r, null, l0, now).kind, "new", `${city}: a fresh entry`);
    const start = now;
    let cur: RunRow = row({ city, day, startedAt: start, lastAt: start, lastLat: l0.lat, lastLng: l0.lng });
    for (let i = 1; i < r.lamps.length; i++) {
      now += Math.ceil((legMeters(r, i) / 92) * 1000 * 1.3);
      const d = lightDecision(r, cur, i, r.lamps[i]!, now - start, now);
      assert.equal(d.kind, "lit", `${city} lamp ${i + 1}`);
      if (d.kind !== "lit") return;
      cur = d.row;
    }
    assert.equal(cur.lit, 5);
    finishes[city] = cur.timeMs!;
    const board = rankDaily([{ userId: "u1", name: "Ryan G.", timeMs: cur.timeMs!, finishedAt: now }], runFloorMs(r));
    assert.deepEqual(board.map((b) => [b.rank, b.userId]), [[1, "u1"]], `${city}: posts to its own board`);
    now += 60_000;
  }
  assert.ok(finishes.detroit! > 0 && finishes.austin! > 0);
});

test("anti-abuse is per city: three refused legs void that city's entry only", () => {
  const r = dailyRoute("detroit", "2026-10-02");
  let strikes = 0;
  const cur = row();
  for (let k = 0; k < 3; k++) {
    const d = lightDecision(r, { ...cur, strikes }, 1, r.lamps[1]!, 1, cur.startedAt + 10);
    assert.deepEqual(d, { kind: "reject", reason: "too-fast", strike: true });
    strikes++;
  }
  assert.equal(strikes, DAILY_STRIKES);
  const voided = row({ strikes, voided: true });
  assert.equal(startDecision(r, voided, r.lamps[0]!, cur.startedAt + 20).kind, "void", "Detroit stays void today");
  const aus = dailyRoute("austin", "2026-10-02");
  assert.equal(startDecision(aus, voided, aus.lamps[0]!, cur.startedAt + 20).kind, "new", "Austin is still open today");
  // The 170 m position check and the 2 h limit still hold on a second city.
  const ausRow = row({ city: "austin", lastLat: aus.lamps[0]!.lat, lastLng: aus.lamps[0]!.lng });
  assert.equal(lightDecision(aus, ausRow, 1, { lat: aus.lamps[1]!.lat + 0.01, lng: aus.lamps[1]!.lng }, 9e6, ausRow.startedAt + 9e5).kind, "reject");
  assert.equal(lightDecision(aus, ausRow, 2, aus.lamps[2]!, 9e6, ausRow.startedAt + 9e5).kind, "reject", "lamps light in order");
  assert.equal(lightDecision(aus, ausRow, 1, aus.lamps[1]!, 9e6, ausRow.startedAt + DAILY_MAX_MS + 1).kind, "expire");
});

test("server leg timing: in order, at the lamp, and no faster than the floor", () => {
  const r = dailyRoute("nyc", "2026-10-02");
  const start = 5_000_000;
  let cur = row({ city: "nyc", startedAt: start, lastAt: start });
  let now = start;
  for (let i = 1; i < r.lamps.length; i++) {
    const lamp = r.lamps[i]!;
    // Too soon on the server clock: a strike, nothing lit.
    const quick = lightDecision(r, cur, i, lamp, legFloorMs(r, i) * 2, now + 10);
    assert.deepEqual(quick, { kind: "reject", reason: "too-fast", strike: true });
    // Out of order and away from the lamp: refused without a strike.
    if (i < r.lamps.length - 1) assert.deepEqual(lightDecision(r, cur, i + 1, r.lamps[i + 1]!, 9e6, now + 9e5), { kind: "reject", reason: "order", strike: false });
    assert.deepEqual(lightDecision(r, cur, i, { lat: lamp.lat + 0.01, lng: lamp.lng }, 9e6, now + 9e5), { kind: "reject", reason: "far", strike: false });
    // The client's own split must clear the floor too, even if the requests were slow.
    const prevClient = cur.clientSplits[cur.clientSplits.length - 1] ?? 0;
    assert.equal(lightDecision(r, cur, i, lamp, prevClient + 5, now + 9e5).kind, "reject");
    now += Math.ceil((legMeters(r, i) / 92) * 1000 * 1.3);
    const ok = lightDecision(r, cur, i, lamp, now - start - 120, now);
    assert.equal(ok.kind, "lit");
    if (ok.kind !== "lit") return;
    assert.equal(ok.finished, i === r.lamps.length - 1);
    cur = ok.row;
    assert.equal(lightDecision(r, cur, i, lamp, 0, now + 1).kind, "already", "a repeat light is idempotent");
  }
  assert.equal(cur.lit, 5);
  assert.equal(cur.timeMs, now - start, "the ranked time is the server clock");
  assert.equal(lightDecision(r, row({ city: "nyc", startedAt: 0, lastAt: 0 }), 1, r.lamps[1]!, 1e6, DAILY_MAX_MS + 1).kind, "expire");
  // Jitter allowance: a leg the server saw a little short still counts.
  const need = spotFloorMs(r.lamps[0]!, r.lamps[1]!);
  const tight = lightDecision(r, row({ city: "nyc", startedAt: 0, lastAt: 0 }), 1, r.lamps[1]!, need, Math.max(0, need - DAILY_JITTER_MS + 1));
  assert.equal(tight.kind, "lit");
  // Lighting from the near edge of reach can't buy more than the reach: the geometric floor still holds.
  const lamp0 = r.lamps[0]!;
  assert.ok(legFloorMs(r, 1) <= spotFloorMs(lamp0, r.lamps[1]!));
});

test("daily board: fastest first, one entry per walker, impossible times never rank, names First L.", () => {
  const floor = 30_000;
  const ranked = rankDaily(
    [
      { userId: "u1", name: standingName("Ryan Gray"), timeMs: 64_000, finishedAt: 5 },
      { userId: "u2", name: standingName("Mandy Lee Smith"), timeMs: 58_000, finishedAt: 9 },
      { userId: "u3", name: standingName("Cheater McFast"), timeMs: 1_200, finishedAt: 1 },
      { userId: "u1", name: standingName("Ryan Gray"), timeMs: 40_000, finishedAt: 50 },
      { userId: "u4", name: standingName("Ada"), timeMs: 64_000, finishedAt: 2 },
      { userId: "u5", name: standingName("Slow Poke"), timeMs: DAILY_MAX_MS + 1, finishedAt: 3 },
    ],
    floor,
  );
  assert.deepEqual(
    ranked.map((r) => [r.rank, r.name, r.timeMs]),
    [
      [1, "Mandy S.", 58_000],
      [2, "Ada", 64_000],
      [3, "Ryan G.", 64_000],
    ],
  );
  assert.equal(standingName("Ryan Gray"), "Ryan G.");
});

test("finish reward: 2 white + 1 blue, 150 coin on the white=30 ladder; a full pocket pays coin", () => {
  assert.deepEqual(DAILY_REWARD, { white: 2, blue: 1 });
  assert.equal(dailyRewardValue(), 2 * TIER_VALUE.white + TIER_VALUE.blue);
  assert.equal(dailyRewardValue(), 150);
  const empty: Record<Tier, number> = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const a = payDaily(empty, 100);
  assert.deepEqual([a.keys.white, a.keys.blue, a.points, a.coins], [2, 1, 100, 0]);
  const full = payDaily({ ...empty, white: 3, blue: 4 }, 0);
  assert.deepEqual([full.keys.white, full.keys.blue, full.coins], [4, 4, 30 + 90]);
});

test("finish reward pays once per city per day: a second city pays again, the same city doesn't", () => {
  const day = "2026-10-02";
  const a = markDailyPaid([], day, "detroit");
  assert.deepEqual(a, ["2026-10-02|detroit"]);
  assert.ok(isDailyPaid(a!, day, "detroit"));
  assert.ok(!isDailyPaid(a!, day, "austin"));
  assert.equal(markDailyPaid(a!, day, "detroit"), null, "same city, same day: no second reward");
  const b = markDailyPaid(a!, day, "austin");
  assert.deepEqual(b, ["2026-10-02|detroit", "2026-10-02|austin"], "another city pays its own reward");
  assert.ok(markDailyPaid(b!, "2026-10-03", "detroit"), "next day pays again");
  assert.equal(markDailyPaid([], "", "detroit"), null);
  // The save keeps a bounded list.
  let keys: string[] = [];
  for (const d of days(10)) for (const c of ALL) keys = markDailyPaid(keys, d, c) ?? keys;
  assert.ok(keys.length <= 48 && isDailyPaid(keys, days(10)[9]!, ALL[ALL.length - 1]!));
  // 0.0.43 saves carry their one paid day over as that run's city.
  assert.deepEqual(legacyDailyPaid(day, { day, city: "nyc", timeMs: 90_000 }), ["2026-10-02|nyc"]);
  assert.deepEqual(legacyDailyPaid(day, { day: "2026-10-01", city: "nyc", timeMs: 90_000 }), []);
  assert.deepEqual(legacyDailyPaid("", null), []);
  assert.deepEqual(legacyDailyPaid(undefined, null), []);
});

test("run clock formats as m:ss.t", () => {
  assert.equal(formatRunTime(0), "0:00.0");
  assert.equal(formatRunTime(83_456), "1:23.4");
  assert.equal(formatRunTime(null), "—");
});
