import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARRIVAL_BUFFER_MS,
  IDLE,
  LAMP_HIT_MS,
  ROUND_MAX_MS,
  betterOutcome,
  forfeitRound,
  journeyOutcome,
  lampAccuracy,
  lampInFrame,
  lampOutcome,
  lampRoundMs,
  lampSchedule,
  lampVerdict,
  markRound,
  openRound,
  pickRideGame,
  rideGameFor,
  rideReward,
  rideValue,
  type RideOutcome,
} from "./rideGames.ts";
import { BLUE_POCKET, RIDE_WHITE_POCKET, WHITE_POCKET, matchCap, pocketRide, settleRide, transitLoot } from "./ticket.ts";
import type { Journey, Tier } from "./types.ts";

const MIN = 60_000;
const played: RideOutcome = { kind: "played" };
const won = (perf: number): RideOutcome => ({ kind: "won", perf });
const whites = (ms: number, o: RideOutcome) => rideValue(rideReward(ms, o));
const empty = (): Record<Tier, number> => ({ white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 });

test("eight-minute ride: idle 1, played 3, won 5 to 7", () => {
  assert.deepEqual(rideReward(8 * MIN, IDLE), { white: 1, blue: 0 });
  assert.deepEqual(rideReward(8 * MIN, played), { white: 3, blue: 0 });
  assert.deepEqual(rideReward(8 * MIN, won(0)), { white: 5, blue: 0 });
  assert.deepEqual(rideReward(8 * MIN, won(0.5)), { white: 6, blue: 0 });
  assert.equal(whites(8 * MIN, won(1)), 7);
});

test("table across ride lengths", () => {
  // [minutes, idle, played, weakest win, best win] — best win in white-value
  const rows: [number, number, number, number, number][] = [
    [0.8, 1, 1, 1, 2],
    [1, 1, 1, 1, 2],
    [4, 1, 2, 3, 4],
    [8, 1, 3, 5, 7],
    [11, 1, 4, 7, 10],
    [14, 2, 5, 9, 12],
  ];
  for (const [m, idle, play, lo, hi] of rows) {
    assert.equal(whites(m * MIN, IDLE), idle, `${m}m idle`);
    assert.equal(whites(m * MIN, played), play, `${m}m played`);
    assert.equal(whites(m * MIN, won(0)), lo, `${m}m won low`);
    assert.equal(whites(m * MIN, won(1)), hi, `${m}m won high`);
  }
});

test("every tier pays at least one, even on the shortest fare", () => {
  for (const o of [IDLE, played, won(0), won(1)]) {
    const r = rideReward(48_000, o);
    assert.ok(r.white + r.blue >= 1);
    assert.ok(r.white >= 0);
  }
  assert.deepEqual(rideReward(0, IDLE), { white: 1, blue: 0 });
});

test("better play never pays less, at any length", () => {
  for (let ms = 48_000; ms <= 14 * MIN; ms += 6_000) {
    const ladder = [IDLE, played, won(0), won(0.25), won(0.5), won(0.74), won(0.75), won(0.9), won(1)];
    for (let i = 1; i < ladder.length; i++) {
      assert.ok(whites(ms, ladder[i]!) >= whites(ms, ladder[i - 1]!), `${ms}ms step ${i}`);
    }
    assert.ok(whites(ms, won(1)) > whites(ms, played), `${ms}ms top win beats played`);
  }
});

test("strong wins trade three whites for a blue", () => {
  assert.deepEqual(rideReward(8 * MIN, won(1)), { white: 4, blue: 1 });
  assert.deepEqual(rideReward(8 * MIN, won(0.75)), { white: 4, blue: 1 });
  assert.deepEqual(rideReward(8 * MIN, won(0.74)), { white: 6, blue: 0 });
  // Under five whites: no swap.
  assert.deepEqual(rideReward(4 * MIN, won(1)), { white: 4, blue: 0 });
  // Mid-long ride: one blue only.
  assert.deepEqual(rideReward(11 * MIN, won(1)), { white: 7, blue: 1 });
  // Longest rides: two.
  assert.deepEqual(rideReward(14 * MIN, won(1)), { white: 6, blue: 2 });
  assert.deepEqual(rideReward(14 * MIN, won(0.75)), { white: 5, blue: 2 });
  assert.deepEqual(rideReward(14 * MIN, won(0.5)), { white: 11, blue: 0 });
});

test("same inputs, same payout", () => {
  for (let i = 0; i < 5; i++) assert.deepEqual(rideReward(13 * MIN, won(0.8)), rideReward(13 * MIN, won(0.8)));
});

test("idle replaces the old trickle; ten-minute blue and the green are unchanged", () => {
  assert.deepEqual(transitLoot(8 * MIN, 8 * MIN, 8 * MIN), { white: 1, blue: 0, green: 0 });
  assert.deepEqual(transitLoot(14 * MIN, 0, 14 * MIN), { white: 2, blue: 1, green: 0 });
  assert.deepEqual(transitLoot(14 * MIN, 14 * MIN, 14 * MIN), { white: 2, blue: 1, green: 1 });
  assert.deepEqual(transitLoot(5_000, 0, 48_000), { white: 0, blue: 0, green: 0 });
  assert.deepEqual(transitLoot(14 * MIN, 0, 14 * MIN, won(1)), { white: 6, blue: 3, green: 0 });
});

function ride(ms: number): Journey {
  return { from: "austin", to: "temple", departAt: 0, arriveAt: ms, openMs: 0, lastTickAt: 0, grantedWhite: 0, grantedBlue: 0, grantedGreen: 0 };
}

/** Tick a ride every second from `from` to `to`, like the ride screen does. */
function run(j: Journey, keys: Record<Tier, number>, from: number, to: number, watching = true) {
  for (let t = from; t <= to; t += 1_000) ({ journey: j, keys } = settleRide(j, keys, t, watching));
  return { j, keys };
}

test("a won ride pays exactly the win, no matter how many ticks or reloads", () => {
  let { j, keys } = run(ride(8 * MIN), empty(), 0, 60_000);
  assert.equal(keys.white, 1, "seat pays idle early");
  j = markRound(openRound(j, 60_000), won(1));
  ({ j, keys } = run(j, keys, 61_000, 8 * MIN + 5_000));
  assert.deepEqual([keys.white, keys.blue], [4, 1]);
  // Reload: the save comes back and ticks again.
  const again = run(forfeitRound(JSON.parse(JSON.stringify(j)) as Journey), keys, 8 * MIN, 8 * MIN + 30_000);
  assert.deepEqual([again.keys.white, again.keys.blue], [4, 1]);
});

test("a ride pays one outcome: the best round", () => {
  let j = ride(11 * MIN);
  j = markRound(j, won(1));
  j = markRound(j, played);
  j = markRound(j, won(0.2));
  assert.deepEqual(journeyOutcome(j), won(1));
  assert.equal(j.game?.rounds, 3);
  const { keys } = run(j, empty(), 0, 11 * MIN);
  assert.equal(rideValue({ white: keys.white, blue: keys.blue - 1 }), 10, "best win only, plus the ten-minute blue");
  assert.deepEqual(betterOutcome(won(0.3), played), won(0.3));
  assert.deepEqual(betterOutcome(IDLE, played), played);
});

test("tab closed mid-round forfeits the round, idle still pays", () => {
  let { j, keys } = run(ride(4 * MIN), empty(), 0, 30_000);
  j = openRound(j, 30_000);
  const saved = JSON.parse(JSON.stringify(j)) as Journey;
  const loaded = forfeitRound(saved);
  assert.equal(loaded.roundAt, undefined);
  assert.equal(loaded.forfeits, 1);
  assert.deepEqual(journeyOutcome(loaded), IDLE);
  ({ keys } = run(loaded, keys, 31_000, 4 * MIN + 2_000, false));
  assert.equal(keys.white, 1);
  assert.equal(keys.blue, 0);
});

test("forfeit keeps an earlier best", () => {
  const j = openRound(markRound(ride(8 * MIN), played), 90_000);
  assert.deepEqual(journeyOutcome(forfeitRound(j)), played);
  assert.equal(forfeitRound(ride(8 * MIN)).forfeits, undefined, "nothing open, nothing forfeited");
});

test("ride pocket holds a whole 14-minute win; other sources keep the old pocket", () => {
  assert.equal(RIDE_WHITE_POCKET, 15);
  assert.equal(matchCap("white"), WHITE_POCKET);
  const best = rideReward(14 * MIN - 1, won(0.74));
  assert.equal(best.blue, 0);
  const full = { ...empty(), white: WHITE_POCKET };
  const got = pocketRide(full, { white: best.white, blue: 0, green: 0 });
  assert.equal(got.add.white, best.white, "a full street pocket plus the biggest win is not cut");
  assert.ok(got.keys.white <= RIDE_WHITE_POCKET);
  const over = pocketRide({ ...empty(), white: 14 }, { white: 5, blue: 0, green: 0 });
  assert.equal(over.keys.white, RIDE_WHITE_POCKET);
});

test("no room for a blue: it comes as three whites", () => {
  const got = pocketRide({ ...empty(), blue: BLUE_POCKET }, { white: 4, blue: 1, green: 0 });
  assert.deepEqual(got.add, { white: 7, blue: 0, green: 0 });
  const some = pocketRide({ ...empty(), blue: BLUE_POCKET - 1 }, { white: 6, blue: 2, green: 0 });
  assert.deepEqual(some.add, { white: 9, blue: 1, green: 0 });
});

test("selector: Lamplighter under two minutes; Where am I? and Match sorter share two to six; Route puzzle from six on", () => {
  const band = ["where-am-i", "match-sorter"];
  for (const m of [0.8, 1.9]) {
    for (const seed of [0, 1, 99, 1_790_000_000_000]) assert.equal(pickRideGame(m * MIN, undefined, seed), "lamplighter", `${m}m`);
  }
  for (const m of [6, 10, 14, 20]) {
    for (const seed of [0, 1, 99, 1_790_000_000_000]) assert.equal(pickRideGame(m * MIN, undefined, seed), "route-puzzle", `${m}m`);
  }
  for (const m of [2, 3, 4, 5.9]) {
    for (const seed of [0, 1, 99, 1_790_000_000_000]) assert.ok(band.includes(pickRideGame(m * MIN, undefined, seed)), `${m}m`);
  }
  assert.equal(pickRideGame(2 * MIN - 1, undefined, 5), "lamplighter");
  assert.ok(band.includes(pickRideGame(6 * MIN - 1, undefined, 5)));
  // Only built games are dealt: with the sorter held back, the band is all Where am I?.
  for (const seed of [0, 1, 2, 3, 4]) assert.equal(pickRideGame(4 * MIN, ["lamplighter", "where-am-i"], seed), "where-am-i");
  assert.equal(pickRideGame(9 * MIN, ["lamplighter", "route-puzzle"]), "route-puzzle");
  assert.equal(pickRideGame(90_000, ["lamplighter", "route-puzzle"]), "lamplighter");
  assert.equal(pickRideGame(6 * MIN, ["lamplighter", "where-am-i"]), "lamplighter", "six minutes is long");
});

test("selector: the 2–6 min band splits about 50/50 across ride seeds, and a seed always gets the same game", () => {
  let sorter = 0;
  const n = 4000;
  const t0 = 1_790_000_000_000; // departure times in ms, like real rides
  for (let i = 0; i < n; i++) {
    const seed = t0 + i * 1_337;
    const g = pickRideGame(4 * MIN, undefined, seed);
    if (g === "match-sorter") sorter++;
    assert.equal(pickRideGame(4 * MIN, undefined, seed), g, "deterministic");
    assert.equal(rideGameFor({ departAt: seed, arriveAt: seed + 4 * MIN }), g, "journey helper agrees");
  }
  const share = sorter / n;
  assert.ok(share > 0.45 && share < 0.55, `sorter share ${share}`);
  // Consecutive millisecond departures don't alternate in lockstep.
  const run = Array.from({ length: 64 }, (_, i) => pickRideGame(3 * MIN, undefined, t0 + i));
  assert.ok(new Set(run).size === 2);
});

test("rounds fit the ride and end before arrival", () => {
  assert.equal(lampRoundMs(48_000), 48_000 - ARRIVAL_BUFFER_MS);
  assert.equal(lampRoundMs(10 * MIN), ROUND_MAX_MS);
  assert.equal(lampRoundMs(20_000), null);
  for (const left of [24_000, 40_000, 70_000, 5 * MIN]) {
    const ms = lampRoundMs(left)!;
    assert.ok(ms + ARRIVAL_BUFFER_MS <= left);
  }
});

test("lamp schedule is seeded and fits the round", () => {
  const a = lampSchedule(40_000, 7);
  assert.deepEqual(a, lampSchedule(40_000, 7));
  assert.notDeepEqual(a, lampSchedule(40_000, 8));
  assert.ok(a.length >= 25 && a.length <= 45, String(a.length));
  assert.ok(a.every((l) => l.at > 0 && l.at < 40_000));
  for (let i = 1; i < a.length; i++) assert.ok(a[i]!.at - a[i - 1]!.at >= 500);
});

test("tapping lights the lamp in the frame, not a lit one or a far one", () => {
  const lamps = lampSchedule(30_000, 3);
  const first = lamps[0]!;
  assert.equal(lampInFrame(lamps, new Set(), first.at + LAMP_HIT_MS)?.id, first.id);
  assert.equal(lampInFrame(lamps, new Set(), first.at - LAMP_HIT_MS - 1), null);
  assert.equal(lampInFrame(lamps, new Set([first.id]), first.at), null);
});

test("accuracy decides the win; strays count against you", () => {
  assert.deepEqual(lampOutcome({ lamps: 20, hits: 20, strays: 0 }), won(1));
  assert.deepEqual(lampOutcome({ lamps: 20, hits: 12, strays: 0 }), won(0));
  assert.deepEqual(lampOutcome({ lamps: 20, hits: 11, strays: 0 }), played);
  assert.deepEqual(lampOutcome({ lamps: 20, hits: 20, strays: 20 }), played);
  assert.deepEqual(lampOutcome({ lamps: 0, hits: 0, strays: 0 }), played);
  assert.equal(lampAccuracy({ lamps: 18, hits: 18, strays: 2 }), 0.9);
  assert.match(lampVerdict({ lamps: 20, hits: 20, strays: 0 }), /^20 of 20 lit\./);
  assert.match(lampVerdict({ lamps: 20, hits: 0, strays: 0 }), /dark/);
});

// ── 0.0.35: variety across rides ────────────────────────────────────────
import { RIDE_HISTORY_KEEP, RIDE_MAX_RUN, bandGames, dealForRide, dealRideGame, loadRideHistory, pushRideHistory, seededRng, type RideGameId } from "./rideGames.ts";

function simulate(open: readonly RideGameId[], rides: number, seed: number) {
  const rnd = seededRng(seed);
  let history: RideGameId[] = [];
  const counts = new Map<RideGameId, number>();
  let longest = 0;
  let run = 0;
  let prev: RideGameId | undefined;
  for (let i = 0; i < rides; i++) {
    const g = dealRideGame(open, history, rnd);
    history = pushRideHistory(history, g);
    counts.set(g, (counts.get(g) ?? 0) + 1);
    run = g === prev ? run + 1 : 1;
    prev = g;
    longest = Math.max(longest, run);
  }
  return { counts, longest };
}

test("2–6 min rides: never three of the same game in a row over 1000 rides, and both land 40–60%", () => {
  const band = bandGames(4 * MIN);
  assert.deepEqual([...band].sort(), ["match-sorter", "where-am-i"]);
  for (const seed of [1, 7, 42, 2026, 1_790_000_000]) {
    const { counts, longest } = simulate(band, 1000, seed);
    assert.ok(longest <= RIDE_MAX_RUN, `seed ${seed}: run of ${longest}`);
    for (const g of band) {
      const share = (counts.get(g) ?? 0) / 1000;
      assert.ok(share >= 0.4 && share <= 0.6, `seed ${seed}: ${g} ${share}`);
    }
  }
});

test("the deal works for any number of games in a band", () => {
  const three: RideGameId[] = ["where-am-i", "match-sorter", "route-puzzle"];
  const { counts, longest } = simulate(three, 3000, 9);
  assert.ok(longest <= RIDE_MAX_RUN);
  for (const g of three) {
    const share = (counts.get(g) ?? 0) / 3000;
    assert.ok(share > 0.25 && share < 0.42, `${g} ${share}`);
  }
  assert.equal(dealRideGame(["lamplighter"], ["lamplighter", "lamplighter", "lamplighter"]), "lamplighter", "a one-game band has no choice");
  assert.equal(dealRideGame(["where-am-i", "match-sorter"], ["where-am-i", "where-am-i"], () => 0), "match-sorter", "two in a row forces a change");
  // A Lamplighter hop in between doesn't reset the run.
  assert.equal(dealRideGame(["where-am-i", "match-sorter"], ["match-sorter", "lamplighter", "match-sorter"], () => 0), "where-am-i");
  assert.equal(dealForRide(90_000, ["lamplighter", "lamplighter"]), "lamplighter", "short rides stay Lamplighter");
});

test("the dealt game is stored on the ride and survives a reload", () => {
  const departAt = 1_790_000_000_000;
  for (const rideGame of ["where-am-i", "match-sorter"] as const) {
    const j: Journey = { from: "austin", to: "tucson", departAt, arriveAt: departAt + 4 * MIN, rideGame };
    const reloaded = forfeitRound(JSON.parse(JSON.stringify(openRound(j, departAt + 1000))) as Journey);
    assert.equal(rideGameFor(reloaded), rideGame);
    assert.equal(rideGameFor(markRound(reloaded, played)), rideGame);
  }
  // A ride boarded before 0.0.35 has no stored game: it keeps the old seeded pick, stable on every call.
  const old: Journey = { from: "austin", to: "tucson", departAt, arriveAt: departAt + 4 * MIN };
  assert.equal(rideGameFor(old), pickRideGame(4 * MIN, undefined, departAt));
  assert.equal(rideGameFor(JSON.parse(JSON.stringify(old))), rideGameFor(old));
});

test("old saves without ride history load clean", () => {
  assert.deepEqual(loadRideHistory(undefined), []);
  assert.deepEqual(loadRideHistory(null), []);
  assert.deepEqual(loadRideHistory("where-am-i"), []);
  assert.deepEqual(loadRideHistory(["where-am-i", 3, "bogus", "match-sorter"]), ["where-am-i", "match-sorter"]);
  const long = Array.from({ length: 20 }, (_, i) => (i % 2 ? "where-am-i" : "match-sorter"));
  assert.equal(loadRideHistory(long).length, RIDE_HISTORY_KEEP);
  const saved = JSON.parse(JSON.stringify({ version: 2, fares: 1, journey: null })) as { rideHistory?: unknown };
  const g = dealForRide(4 * MIN, loadRideHistory(saved.rideHistory));
  assert.ok(["where-am-i", "match-sorter"].includes(g));
});
