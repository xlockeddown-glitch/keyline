import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import {
  ARRIVAL_BUFFER_MS,
  RIDE_PERFECT_BONUS,
  bandGames,
  dealForRide,
  journeyOutcome,
  loadRideHistory,
  markRound,
  perfectLine,
  pickRideGame,
  rideGameFor,
  rideReward,
  rideRoundMs,
  rideValue,
} from "./rideGames.ts";
import {
  ROUTE_CLOSE,
  ROUTE_MARGIN,
  ROUTE_MIN_GAP,
  ROUTE_PUZZLES,
  ROUTE_ROUND_MAX_MS,
  ROUTE_ROUND_MIN_MS,
  ROUTE_SIZES,
  gradeRoute,
  orderSpan,
  routeOutcome,
  routePerfect,
  routePool,
  routeRound,
  routeRoundMs,
  routeVerdict,
  type RoutePuzzleMap,
  type RouteTally,
} from "./routePuzzle.ts";
import type { CityId, Journey } from "./types.ts";

const MIN = 60_000;
const T0 = 1_790_000_000_000;

function perms<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));
}

/** Solve a map from scratch and check it has exactly one shortest order, which the grader accepts. */
function assertSolvable(m: RoutePuzzleMap, city: string) {
  const ids = m.stops.map((s) => s.id);
  const all = perms(ids).map((o) => ({ o, d: orderSpan(m, o) })).sort((a, b) => a.d - b.d);
  assert.deepEqual(all[0]!.o, m.best, `${city}: best order is the true shortest`);
  assert.ok(all[1]!.d >= all[0]!.d * (ROUTE_MARGIN - 1e-6), `${city}: one clear answer`);
  assert.equal(gradeRoute(m, m.best).grade, "shortest");
  for (const { o } of all.slice(1)) assert.notEqual(gradeRoute(m, o).grade, "shortest", `${city}: only one order wins`);
  assert.notDeepEqual(ids, m.best, `${city}: letter order never gives it away`);
  const pts = [m.start, m.finish, ...m.stops];
  assert.equal(new Set(pts.map((p) => p.id)).size, pts.length, `${city}: no place twice`);
  for (const p of pts) assert.ok(p.x >= -1e-9 && p.x <= 1 + 1e-9 && p.y >= -1e-9 && p.y <= 1 + 1e-9, `${city}: on the map`);
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      assert.ok(Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y) >= ROUTE_MIN_GAP - 1e-9, `${city}: dots far enough apart to tap`);
  assert.ok(m.bestM > 0 && m.nextM >= m.bestM);
}

test("every city, Temple and Tucson included, deals full rounds of real places, and every map is solvable", () => {
  for (const id of Object.keys(CITIES) as CityId[]) {
    const pois = CITIES[id].pois;
    const real = new Set(routePool(pois).map((p) => p.id));
    for (let r = 0; r < 30; r++) {
      const maps = routeRound(pois, T0 + r * 4_211, r % 4);
      assert.equal(maps.length, ROUTE_PUZZLES, `${id} round ${r}`);
      maps.forEach((m, i) => {
        assert.equal(m.stops.length, ROUTE_SIZES[i], `${id}: map ${i} size`);
        for (const p of [m.start, m.finish, ...m.stops]) assert.ok(real.has(p.id), `${id}: ${p.id} is a real, live place`);
        assertSolvable(m, id);
      });
      // Maps in one round don't reuse places when the city has enough of them.
      const used = maps.flatMap((m) => [m.start.id, m.finish.id, ...m.stops.map((s) => s.id)]);
      assert.equal(new Set(used).size, used.length, `${id}: round ${r} reuses a place`);
    }
  }
});

test("thin cities: no shops, no game-made marks", () => {
  for (const id of ["temple", "tucson"] as CityId[]) {
    const pois = CITIES[id].pois;
    const pool = routePool(pois);
    assert.ok(pool.length >= 20, `${id} pool ${pool.length}`);
    assert.ok(pool.every((p) => p.kind !== "shop" && !p.noClue));
  }
});

test("a ride deals the same maps on reload; the next round deals new ones", () => {
  const pois = CITIES.chicago.pois;
  assert.deepEqual(routeRound(pois, T0, 0), routeRound(pois, T0, 0));
  assert.notDeepEqual(routeRound(pois, T0, 1), routeRound(pois, T0, 0));
});

test("grading: shortest, close and long", () => {
  const m = routeRound(CITIES.london.pois, T0, 0)[1]!;
  const ids = m.stops.map((s) => s.id);
  const others = perms(ids).filter((o) => o.join() !== m.best.join()).map((o) => gradeRoute(m, o));
  assert.ok(others.every((g) => g.ratio < 1 / (ROUTE_MARGIN - 1e-6) + 1e-9 && g.metres > m.bestM));
  assert.ok(others.every((g) => g.grade === (g.ratio >= ROUTE_CLOSE ? "close" : "long")));
  assert.equal(gradeRoute(m, ids.slice(0, -1)).grade, "long", "an unfinished route doesn't count");
  assert.equal(gradeRoute(m, [ids[0]!, ids[0]!, ...ids.slice(2)]).grade, "long");
});

const T = (shortest: number, close = 0, done = ROUTE_PUZZLES): RouteTally => ({ total: ROUTE_PUZZLES, done, shortest, close });

test("outcome: win at 2 points of 3 (shortest 1, close ½); 3 of 3 is perfect", () => {
  assert.deepEqual(routeOutcome(T(0)), { kind: "played" });
  assert.deepEqual(routeOutcome(T(1, 1)), { kind: "played" });
  assert.deepEqual(routeOutcome(T(1, 2)), { kind: "won", perf: 0 });
  assert.deepEqual(routeOutcome(T(2)), { kind: "won", perf: 0 });
  assert.deepEqual(routeOutcome(T(2, 1)), { kind: "won", perf: 0.5 });
  assert.deepEqual(routeOutcome(T(3)), { kind: "won", perf: 1, perfect: true });
  assert.equal(routePerfect(T(3, 0, 2)), false);
  assert.deepEqual(routeOutcome(T(1, 0, 1)), { kind: "played" }, "out of time after one map");
  assert.match(routeVerdict(T(3), "Chicago"), /3 of 3/);
  assert.match(routeVerdict(T(1, 0, 2), "Chicago"), /clock beat you/);
  assert.match(perfectLine(routeOutcome(T(3))) ?? "", /Perfect round: \+1 white/);
  assert.equal(perfectLine(routeOutcome(T(2, 1))), undefined);
});

test("pay: the standard ride table, scaled, with the perfect +1 white", () => {
  // Eight minutes is the table itself: idle 1, played 3, win 5 → 7.
  assert.deepEqual(rideReward(8 * MIN, { kind: "idle" }), { white: 1, blue: 0 });
  assert.deepEqual(rideReward(8 * MIN, routeOutcome(T(1))), { white: 3, blue: 0 });
  assert.deepEqual(rideReward(8 * MIN, routeOutcome(T(2))), { white: 5, blue: 0 });
  assert.deepEqual(rideReward(8 * MIN, routeOutcome(T(2, 1))), { white: 6, blue: 0 });
  // A clean sheet is a strong win (7 → 4 white + 1 blue) plus the flat perfect white.
  assert.deepEqual(rideReward(8 * MIN, routeOutcome(T(3))), { white: 4 + RIDE_PERFECT_BONUS, blue: 1 });
  for (const m of [6, 7, 10, 12, 14]) {
    const v = (t: RouteTally) => rideValue(rideReward(m * MIN, routeOutcome(t)));
    assert.ok(v(T(0)) > rideValue(rideReward(m * MIN, { kind: "idle" })), `${m}m played > idle`);
    assert.ok(v(T(2)) >= v(T(0)) && v(T(2, 1)) >= v(T(2)) && v(T(3)) > v(T(2, 1)), `${m}m pay climbs`);
    const base = rideReward(m * MIN, { kind: "won", perf: 1 });
    assert.deepEqual(rideReward(m * MIN, routeOutcome(T(3))), { white: base.white + RIDE_PERFECT_BONUS, blue: base.blue });
  }
  // The ride keeps its best round: a perfect round after a played one pays perfect.
  const j = markRound(markRound({} as Journey, routeOutcome(T(1))), routeOutcome(T(3)));
  assert.deepEqual(journeyOutcome(j), { kind: "won", perf: 1, perfect: true });
});

test("round length: up to two minutes, none under one, and it ends before the platform", () => {
  assert.equal(routeRoundMs(10 * MIN), ROUTE_ROUND_MAX_MS);
  assert.equal(routeRoundMs(ROUTE_ROUND_MIN_MS + ARRIVAL_BUFFER_MS), ROUTE_ROUND_MIN_MS);
  assert.equal(routeRoundMs(ROUTE_ROUND_MIN_MS + ARRIVAL_BUFFER_MS - 1), null);
  assert.equal(rideRoundMs("route-puzzle", 90_000), 90_000 - ARRIVAL_BUFFER_MS);
});

test("bands: Route puzzle owns six minutes and up, fares cap at 14:00 so capped rides get it too", () => {
  for (const m of [6, 6.5, 9, 13.99, 14, 20]) {
    assert.deepEqual(bandGames(m * MIN), ["route-puzzle"], `${m}m`);
    assert.equal(dealForRide(m * MIN, ["route-puzzle", "route-puzzle", "route-puzzle"]), "route-puzzle", "one-game band: no run rule");
  }
  assert.deepEqual([...bandGames(5.99 * MIN)].sort(), ["match-sorter", "where-am-i"]);
  assert.deepEqual(bandGames(1.99 * MIN), ["lamplighter"]);
  assert.equal(pickRideGame(9 * MIN, undefined, T0), "route-puzzle");
});

test("old saves: rides already under way keep their game, histories with any game load", () => {
  // Boarded on 0.0.35, a nine-minute ride was dealt Lamplighter and stored it: it stays Lamplighter.
  const k35: Journey = { from: "austin", to: "chicago", departAt: T0, arriveAt: T0 + 9 * MIN, rideGame: "lamplighter" };
  assert.equal(rideGameFor(JSON.parse(JSON.stringify(k35))), "lamplighter");
  // Boarded before 0.0.35, no stored game: the old pick, which was Lamplighter past six minutes.
  const k34: Journey = { from: "austin", to: "chicago", departAt: T0, arriveAt: T0 + 9 * MIN };
  assert.equal(rideGameFor(k34), "lamplighter");
  assert.ok(["where-am-i", "match-sorter"].includes(rideGameFor({ ...k34, arriveAt: T0 + 4 * MIN })));
  // A ride boarded now stores Route puzzle.
  assert.equal(rideGameFor({ ...k34, rideGame: dealForRide(9 * MIN, loadRideHistory(undefined)) }), "route-puzzle");
  assert.deepEqual(loadRideHistory(["lamplighter", "route-puzzle", "where-am-i"]), ["lamplighter", "route-puzzle", "where-am-i"]);
});
