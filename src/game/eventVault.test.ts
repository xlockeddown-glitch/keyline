// 0.1.159 Comet vault: a pure, shared schedule (6 h cadence, 20 min open, per-city offsets) and a baked spot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import { distM } from "./geo.ts";
import { MARKET_STREETS } from "./marketStreets.ts";
import { anyPois, livePois, marketStreets, zoneOf } from "./nightMarket.ts";
import {
  COMET_EVERY_MS,
  COMET_GAP_M,
  COMET_LATE_MS,
  COMET_MULT,
  COMET_BONUS,
  COMET_OPEN_MS,
  COMET_TIER,
  cometAt,
  cometById,
  cometCandidates,
  cometEnd,
  cometId,
  cometLine,
  cometOfWindow,
  cometOffset,
  cometStart,
  cometVault,
  cometWindow,
  cometWindowEnd,
  isComet,
} from "./eventVault.ts";
import type { CityId } from "./types";

const CITY_IDS = Object.keys(CITIES) as CityId[];
const T0 = Date.UTC(2026, 10, 11, 0, 0, 0);
/** A moment `ms` into window `w` of `city`. */
const into = (city: CityId, w: number, ms: number) => cometStart(city, w) + ms;

test("Ryan's cadence: every 6 hours, open 20 minutes, ×1.5 green with a blue key", () => {
  assert.equal(COMET_EVERY_MS, 6 * 3600_000, "6 hours, not the plan's 3");
  assert.notEqual(COMET_EVERY_MS, 3 * 3600_000);
  assert.equal(COMET_OPEN_MS, 20 * 60_000);
  assert.equal(COMET_MULT, 1.5);
  assert.deepEqual(COMET_BONUS, { blue: 1 });
  assert.equal(COMET_TIER, "green");
});

test("same inputs, same schedule and spot (refresh-safe, server and device agree)", () => {
  for (const city of CITY_IDS) {
    const a = cometAt(city, T0 + 12_345);
    const b = cometAt(city, T0 + 12_345);
    assert.deepEqual(a, b);
    const w = cometWindow(city, T0);
    const p = cometOfWindow(city, w);
    assert.ok(p, `${city} has a comet spot`);
    assert.deepEqual(cometOfWindow(city, w), p);
  }
});

test("window edges: open at the start, closed at start + 20 min, gone at the next start - 1 ms", () => {
  const city: CityId = "austin";
  const w = cometWindow(city, T0) + 3;
  const s = cometStart(city, w);
  assert.equal(cometVault(city, s - 1), null, "1 ms before");
  assert.equal(cometVault(city, s)?.id, cometId(city, w), "at the start");
  assert.equal(cometVault(city, s + COMET_OPEN_MS - 1)?.id, cometId(city, w), "last ms");
  assert.equal(cometVault(city, s + COMET_OPEN_MS), null, "closed at 20 min");
  assert.equal(cometVault(city, s + COMET_EVERY_MS - 1), null);
  assert.equal(cometVault(city, s + COMET_EVERY_MS)?.id, cometId(city, w + 1), "next comet 6 h later");
  assert.equal(cometEnd(city, w), s + COMET_OPEN_MS);
  assert.equal(cometWindowEnd(cometId(city, w)), s + COMET_OPEN_MS);
  const st = cometAt(city, s + COMET_OPEN_MS);
  assert.equal(st.open, false);
  assert.equal(st.startsAt, s + COMET_EVERY_MS, "between windows, cometAt points at the next one");
});

test("at most 4 windows (80 open minutes) in any 24 hours, per city", () => {
  for (const city of CITY_IDS) {
    for (let start = T0; start < T0 + 2 * 86_400_000; start += 37 * 60_000) {
      const seen = new Set<number>();
      let openMin = 0;
      for (let t = start; t < start + 86_400_000; t += 60_000) {
        const v = cometVault(city, t);
        if (v) {
          seen.add(Number(/-(\d+)$/.exec(v.id)![1]));
          openMin += 1;
        }
      }
      assert.ok(seen.size <= 5 && seen.size >= 4, `${city}: ${seen.size} windows touched`);
      assert.ok(openMin <= 4 * 20 + 1, `${city}: ${openMin} open minutes`);
      // Fully inside a day: never more than 4 whole windows.
      const whole = [...seen].filter((w) => cometStart(city, w) >= start && cometEnd(city, w) <= start + 86_400_000);
      assert.ok(whole.length <= 4, `${city}: ${whole.length} whole windows`);
    }
  }
});

test("per-city offsets: cities don't all pop at once", () => {
  const offs = CITY_IDS.map(cometOffset);
  for (const o of offs) assert.ok(o >= 0 && o < COMET_EVERY_MS && o % 60_000 === 0);
  assert.ok(new Set(offs).size >= CITY_IDS.length - 3, "offsets are spread");
  // At no minute are more than a few cities open together.
  let worst = 0;
  for (let t = T0; t < T0 + COMET_EVERY_MS; t += 60_000) worst = Math.max(worst, CITY_IDS.filter((c) => cometVault(c, t)).length);
  assert.ok(worst < CITY_IDS.length / 2, `at most ${worst} cities open at once`);
});

test("the spot is on the baked streets, outside every market zone, and clear of the lamps", () => {
  for (const city of CITY_IDS) {
    const zones = marketStreets(city).map((s) => zoneOf(city, s));
    const lamps = CITIES[city].pois;
    const anyFar = cometCandidates(city).some((c) => c.gap >= COMET_GAP_M);
    for (let w = 0; w < 12; w++) {
      const p = cometOfWindow(city, cometWindow(city, T0) + w)!;
      for (const z of zones) assert.ok(distM(z.lat, z.lng, p.lat, p.lng) > z.r, `${city}/${p.id} sits outside the ${z.plaza ?? "market"} zone`);
      const gap = Math.min(...lamps.map((q) => distM(p.lat, p.lng, q.lat, q.lng)));
      if (anyFar) assert.ok(gap >= COMET_GAP_M - 1, `${city}/${p.id} is ${Math.round(gap)} m from a lamp`);
      const street = (p as { street?: string }).street;
      if (street) assert.ok((MARKET_STREETS[city] ?? []).some((s) => s.name === street), `${city}: ${street} is a baked street`);
      assert.equal(p.tier, "green");
    }
  }
});

test("ids round-trip; cometById is null once the window is closed (and for other cities / forged ids)", () => {
  const city: CityId = "chicago";
  const w = cometWindow(city, T0) + 1;
  const id = cometId(city, w);
  assert.ok(isComet(id));
  assert.ok(!isComet("mkt-chicago-1-green") && !isComet("placed-x") && !isComet("comet-chicago-x"));
  const open = into(city, w, 5 * 60_000);
  assert.equal(cometById(city, id, open)?.id, id);
  assert.equal(cometById(city, id, cometEnd(city, w)), null, "closed");
  assert.equal(cometById(city, id, cometStart(city, w) - 1), null, "not yet open");
  assert.equal(cometById(city, id, cometEnd(city, w) + 30_000, 60_000)?.id, id, "inside an explicit grace");
  assert.equal(cometById("austin", id, open), null, "another city's id");
  assert.equal(cometById(city, cometId(city, w + 1), open), null, "a future window's id");
});

test("livePois carries the open comet; anyPois keeps it for the 10-minute late grace", () => {
  const city: CityId = "nyc";
  const w = cometWindow(city, T0) + 2;
  const id = cometId(city, w);
  const c = CITIES[city];
  assert.ok(livePois(c, [], into(city, w, 60_000)).some((p) => p.id === id));
  assert.ok(!livePois(c, [], cometEnd(city, w) + 1).some((p) => p.id === id));
  assert.ok(anyPois(c, [], cometEnd(city, w) + COMET_LATE_MS - 1000).some((p) => p.id === id), "late grace");
  assert.ok(!anyPois(c, [], cometEnd(city, w) + COMET_LATE_MS + 1000).some((p) => p.id === id));
});

test("HUD line: open with street and minutes, else the wait for the next comet", () => {
  const city: CityId = "austin";
  const w = cometWindow(city, T0) + 1;
  const open = cometLine(city, into(city, w, 6 * 60_000));
  assert.ok(open.open);
  assert.match(open.text, /^Comet vault( on .+)? · 14 min left$/);
  const wait = cometLine(city, cometEnd(city, w) + 60_000);
  assert.equal(wait.open, false);
  assert.match(wait.text, /^next comet in 5 h 39$/);
  assert.match(cometLine(city, cometStart(city, w + 1) - 70 * 60_000).text, /^next comet in 1 h 10$/);
});
