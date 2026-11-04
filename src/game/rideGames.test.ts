// 0.1.121: ride payout only (old saves' train rides still land via settleRide); game rules went with the games.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDLE,
  rideReward,
  rideValue,
  type RideOutcome,
} from "./rideGames.ts";
import { BLUE_POCKET, WHITE_POCKET, matchCap, pocketRide, settleRide, transitLoot } from "./ticket.ts";
import type { Journey, Tier } from "./types.ts";

const MIN = 37_500; // 0.1.2: tables kept in old minutes; rides now run 5/8 as long and pay the same per ride
const played: RideOutcome = { kind: "played" };
const won = (perf: number): RideOutcome => ({ kind: "won", perf });
const whites = (ms: number, o: RideOutcome) => rideValue(rideReward(ms, o));
const empty = (): Record<Tier, number> => ({ white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 });

test("six-minute ride (0.0.94 base, was eight): idle 1, played 3, won 5 to 7", () => {
  assert.deepEqual(rideReward(6 * MIN, IDLE), { white: 1, blue: 0 });
  assert.deepEqual(rideReward(6 * MIN, played), { white: 3, blue: 0 });
  assert.deepEqual(rideReward(6 * MIN, won(0)), { white: 5, blue: 0 });
  assert.deepEqual(rideReward(6 * MIN, won(0.5)), { white: 6, blue: 0 });
  assert.equal(whites(6 * MIN, won(1)), 7);
});

test("table across ride lengths (0.0.94: minutes ×0.75 for the six-minute base)", () => {
  // [minutes, idle, played, weakest win, best win] — best win in white-value
  const rows: [number, number, number, number, number][] = [
    [0.6, 1, 1, 1, 2],
    [0.75, 1, 1, 1, 2],
    [3, 1, 2, 3, 4],
    [6, 1, 3, 5, 7],
    [8.25, 1, 4, 7, 10],
    [10.5, 2, 5, 9, 12],
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
  for (let ms = 48_000; ms <= 10.5 * MIN; ms += 6_000) {
    const ladder = [IDLE, played, won(0), won(0.25), won(0.5), won(0.74), won(0.75), won(0.9), won(1)];
    for (let i = 1; i < ladder.length; i++) {
      assert.ok(whites(ms, ladder[i]!) >= whites(ms, ladder[i - 1]!), `${ms}ms step ${i}`);
    }
    assert.ok(whites(ms, won(1)) > whites(ms, played), `${ms}ms top win beats played`);
  }
});

test("strong wins trade three whites for a blue", () => {
  assert.deepEqual(rideReward(6 * MIN, won(1)), { white: 4, blue: 1 });
  assert.deepEqual(rideReward(6 * MIN, won(0.75)), { white: 4, blue: 1 });
  assert.deepEqual(rideReward(6 * MIN, won(0.74)), { white: 6, blue: 0 });
  // Under five whites: no swap.
  assert.deepEqual(rideReward(3 * MIN, won(1)), { white: 4, blue: 0 });
  // Mid-long ride: one blue only.
  assert.deepEqual(rideReward(8.25 * MIN, won(1)), { white: 7, blue: 1 });
  // Longest rides: two.
  assert.deepEqual(rideReward(10.5 * MIN, won(1)), { white: 6, blue: 2 });
  assert.deepEqual(rideReward(10.5 * MIN, won(0.75)), { white: 5, blue: 2 });
  assert.deepEqual(rideReward(10.5 * MIN, won(0.5)), { white: 11, blue: 0 });
});

test("same inputs, same payout", () => {
  for (let i = 0; i < 5; i++) assert.deepEqual(rideReward(9.75 * MIN, won(0.8)), rideReward(9.75 * MIN, won(0.8)));
});

test("idle replaces the old trickle; the long-haul blue (7 min) and the green", () => {
  assert.deepEqual(transitLoot(6 * MIN, 6 * MIN, 6 * MIN), { white: 1, blue: 0, green: 0 });
  assert.deepEqual(transitLoot(10.5 * MIN, 0, 10.5 * MIN), { white: 2, blue: 1, green: 0 });
  assert.deepEqual(transitLoot(10.5 * MIN, 10.5 * MIN, 10.5 * MIN), { white: 2, blue: 1, green: 1 });
  assert.deepEqual(transitLoot(5_000, 0, 48_000), { white: 0, blue: 0, green: 0 });
  assert.deepEqual(transitLoot(10.5 * MIN, 0, 10.5 * MIN, won(1)), { white: 6, blue: 3, green: 0 });
});

function ride(ms: number): Journey {
  return { from: "austin", to: "temple", departAt: 0, arriveAt: ms, openMs: 0, lastTickAt: 0, grantedWhite: 0, grantedBlue: 0, grantedGreen: 0 };
}

/** Tick a ride every second from `from` to `to`, like the ride screen does. */
function run(j: Journey, keys: Record<Tier, number>, from: number, to: number, watching = true) {
  for (let t = from; t <= to; t += 1_000) ({ journey: j, keys } = settleRide(j, keys, t, watching));
  return { j, keys };
}

test("0.1.121: an old save's train ride still lands its best round once, however many ticks", () => {
  const len = 10.5 * MIN;
  const j: Journey = { ...ride(len), game: { kind: "won", perf: 1, rounds: 2 } };
  const want = transitLoot(len, len, len, won(1));
  const a = run(j, empty(), 0, len + 5_000);
  const b = run(a.j, a.keys, len + 5_000, len + 30_000);
  assert.equal(a.keys.white, want.white);
  assert.equal(a.keys.blue, want.blue);
  assert.deepEqual(b.keys, a.keys, "ticks after landing pay nothing more");
  const idle = run(ride(len), empty(), 0, len + 5_000);
  assert.ok(a.keys.white + 3 * a.keys.blue > idle.keys.white + 3 * idle.keys.blue, "a won round beats sitting");
});

test("0.0.97: rides use the same 30 pocket; everything owed lands (overflow merges later)", () => {
  assert.equal(WHITE_POCKET, 30);
  assert.equal(matchCap("white"), WHITE_POCKET);
  const best = rideReward(10.5 * MIN - 1, won(0.74));
  const full = { ...empty(), white: WHITE_POCKET };
  const got = pocketRide(full, { white: best.white, blue: 0, green: 0 });
  assert.equal(got.add.white, best.white, "nothing owed is cut");
});

test("0.0.97: a blue owed is a blue, even into a full pocket (it merges up, never down)", () => {
  const got = pocketRide({ ...empty(), blue: BLUE_POCKET }, { white: 4, blue: 1, green: 0 });
  assert.deepEqual(got.add, { white: 4, blue: 1, green: 0 });
});

