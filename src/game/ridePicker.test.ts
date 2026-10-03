import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARRIVAL_BUFFER_MS,
  RIDE_GAME_MIN_MS,
  RIDE_GAME_NAME,
  RIDE_GAME_ORDER,
  RIDE_GAME_PITCH,
  ROUTE_ROUND_MAX_MS,
  SORT_ROUND_MS,
  chooseRideGame,
  dealForRide,
  forfeitRound,
  journeyOutcome,
  lampOutcome,
  markRound,
  openRound,
  pickRideGame,
  pickerDefault,
  rideGameFits,
  rideGameFor,
  ridePickerGames,
  rideReward,
  rideRoundMs,
  suggestedRideGame,
  type RideGameId,
  type RideOutcome,
} from "./rideGames.ts";
import { settleRide } from "./ticket.ts";
import { whereOutcome } from "./whereAmI.ts";
import { sortOutcome, SORT_TOTAL } from "./matchSorter.ts";
import { routeOutcome } from "./routePuzzle.ts";
import type { Journey, Tier } from "./types.ts";

const MIN = 60_000;
const SEC = 1_000;
const T0 = 1_790_000_000_000;
const ALL: RideGameId[] = ["lamplighter", "where-am-i", "match-sorter", "route-puzzle"];
const empty = (): Record<Tier, number> => ({ white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 });
const reload = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

function boarded(rideMs: number, history: RideGameId[] = [], rnd = () => 0.3): Journey {
  const rideGame = dealForRide(rideMs, history, rnd);
  return { from: "austin", to: "temple", departAt: T0, arriveAt: T0 + rideMs, openMs: 0, lastTickAt: T0, grantedWhite: 0, grantedBlue: 0, grantedGreen: 0, rideGame };
}

test("minimum rounds: Lamplighter 15 s, Where am I? and Match sorter about 34 s, Route puzzle 2 min", () => {
  assert.equal(RIDE_GAME_MIN_MS.lamplighter, 15 * SEC);
  assert.equal(RIDE_GAME_MIN_MS["where-am-i"], 34 * SEC);
  assert.equal(RIDE_GAME_MIN_MS["match-sorter"], SORT_ROUND_MS);
  assert.ok(Math.abs(SORT_ROUND_MS - 34 * SEC) < 1_000, `sorter round ${SORT_ROUND_MS}`);
  assert.equal(RIDE_GAME_MIN_MS["route-puzzle"], ROUTE_ROUND_MAX_MS);
  assert.equal(ROUTE_ROUND_MAX_MS, 2 * MIN);
  for (const g of ALL) {
    assert.ok(RIDE_GAME_NAME[g] && RIDE_GAME_PITCH[g], `${g} has a name and a one-liner`);
    assert.ok(!RIDE_GAME_PITCH[g].includes("\n") && RIDE_GAME_PITCH[g].length <= 60, `${g} pitch is one short line`);
  }
});

test("picker lists exactly the games that fit the time left", () => {
  const B = ARRIVAL_BUFFER_MS;
  const rows: [number, RideGameId[]][] = [
    [0, []],
    [B + 15 * SEC - 1, []],
    [B + 15 * SEC, ["lamplighter"]],
    [B + SORT_ROUND_MS - 1, ["lamplighter"]],
    [B + SORT_ROUND_MS, ["lamplighter", "match-sorter"]],
    [B + 34 * SEC, ["lamplighter", "where-am-i", "match-sorter"]],
    [90 * SEC, ["lamplighter", "where-am-i", "match-sorter"]],
    [B + 2 * MIN - 1, ["lamplighter", "where-am-i", "match-sorter"]],
    [B + 2 * MIN, ALL],
    [4 * MIN, ALL],
    [6 * MIN, ALL],
    [14 * MIN, ALL],
  ];
  for (const [left, want] of rows) assert.deepEqual(ridePickerGames(left), want, `${left} ms left`);
  // Exactly the fitting ones, at every second of a long ride, and every listed game can really start a round.
  for (let left = 0; left <= 14 * MIN; left += SEC) {
    const listed = ridePickerGames(left);
    assert.deepEqual(listed, RIDE_GAME_ORDER.filter((g) => left - B >= RIDE_GAME_MIN_MS[g]), `${left}`);
    for (const g of listed) {
      const ms = rideRoundMs(g, left);
      assert.ok(ms != null && ms >= RIDE_GAME_MIN_MS[g] && ms + B <= left, `${g} at ${left}`);
      assert.ok(rideGameFits(g, left));
    }
  }
  assert.equal(rideGameFits("bogus" as RideGameId, 10 * MIN), false);
});

test("the default selection is the suggested pick", () => {
  // The 0.0.35 varied deal still picks the suggestion, and the picker starts on it.
  for (const rideMs of [90 * SEC, 3 * MIN, 5 * MIN, 8 * MIN, 14 * MIN]) {
    for (const rnd of [() => 0, () => 0.49, () => 0.51, () => 0.99]) {
      const j = boarded(rideMs, [], rnd);
      assert.equal(suggestedRideGame(j), j.rideGame);
      assert.equal(pickerDefault(j, rideMs), j.rideGame, `${rideMs} ms`);
      assert.equal(rideGameFor(j), j.rideGame, "no pick yet: the ride's game is the suggestion");
      assert.ok(ridePickerGames(rideMs).includes(j.rideGame!));
    }
  }
  // Bands are unchanged: short Lamplighter, 2–6 Where am I?/Match sorter, 6+ Route puzzle.
  assert.equal(boarded(90 * SEC).rideGame, "lamplighter");
  assert.ok(["where-am-i", "match-sorter"].includes(boarded(4 * MIN).rideGame!));
  assert.equal(boarded(8 * MIN).rideGame, "route-puzzle");
  // A pick, once made, is what the picker shows next.
  const j = chooseRideGame(boarded(8 * MIN), "match-sorter");
  assert.equal(pickerDefault(j, 8 * MIN), "match-sorter");
  // Late in the ride the suggestion can stop fitting: the picker falls back to the first game that does.
  assert.equal(pickerDefault(boarded(8 * MIN), 60 * SEC), "lamplighter");
  assert.equal(pickerDefault(boarded(8 * MIN), 10 * SEC), null, "nothing fits: no picker, idle pay");
});

test("the chosen game persists across a reload", () => {
  for (const g of ALL) {
    let j = chooseRideGame(boarded(8 * MIN), g);
    assert.equal(rideGameFor(reload(j)), g, `${g} picked, not played`);
    // Reload mid-round: the round is forfeited, the pick stays.
    j = forfeitRound(reload(openRound(j, T0 + 30 * SEC)));
    assert.equal(rideGameFor(j), g);
    assert.equal(pickerDefault(j, 7 * MIN), g);
    j = markRound(j, { kind: "played" });
    assert.equal(rideGameFor(reload(j)), g, `${g} after a finished round`);
    assert.equal(suggestedRideGame(j), "route-puzzle", "the suggestion is kept apart from the pick");
  }
  // A junk pick on the save is ignored, never crashes.
  const junk = { ...boarded(4 * MIN), chosenGame: "pinball" as RideGameId };
  assert.equal(rideGameFor(junk), junk.rideGame);
  assert.equal(chooseRideGame(boarded(4 * MIN), "pinball" as RideGameId).chosenGame, undefined);
});

/** Each game's best possible round, under its own win rules. */
const TOP: Record<RideGameId, RideOutcome> = {
  lamplighter: lampOutcome({ lamps: 30, hits: 30, strays: 0 }),
  "where-am-i": whereOutcome({ asked: 5, right: 5, total: 5 }),
  "match-sorter": sortOutcome({ total: SORT_TOTAL, right: SORT_TOTAL, wrong: 0, missed: 0 }),
  "route-puzzle": routeOutcome({ total: 3, done: 3, shortest: 3, close: 0 }),
};

test("pay is the same whichever game is chosen", () => {
  for (const g of ALL) assert.deepEqual(TOP[g], { kind: "won", perf: 1, perfect: true }, `${g} clean sheet`);
  const tiers: RideOutcome[] = [{ kind: "idle" }, { kind: "played" }, { kind: "won", perf: 0 }, { kind: "won", perf: 0.8 }, { kind: "won", perf: 1, perfect: true }];
  for (const rideMs of [90 * SEC, 4 * MIN, 8 * MIN, 14 * MIN]) {
    for (const o of tiers) {
      const paid = ALL.map((g) => {
        let j = chooseRideGame(boarded(rideMs), g);
        if (o.kind !== "idle") j = markRound(openRound(j, T0 + 5 * SEC), o);
        let keys = empty();
        for (let t = T0; t <= j.arriveAt + 5 * SEC; t += 5 * SEC) ({ journey: j, keys } = settleRide(j, keys, t, true));
        return { white: keys.white, blue: keys.blue, green: keys.green };
      });
      for (const p of paid) assert.deepEqual(p, paid[0], `${rideMs} ms ${JSON.stringify(o)}`);
      assert.deepEqual(rideReward(rideMs, o), rideReward(rideMs, journeyOutcome(markRound(chooseRideGame(boarded(rideMs), "lamplighter"), o))));
    }
  }
});

test("best round pays across games on one ride", () => {
  let j = boarded(8 * MIN);
  j = markRound(openRound(chooseRideGame(j, "route-puzzle"), T0), { kind: "won", perf: 0.4 });
  j = markRound(openRound(chooseRideGame(j, "lamplighter"), T0 + 3 * MIN), TOP.lamplighter);
  j = markRound(openRound(chooseRideGame(j, "where-am-i"), T0 + 5 * MIN), { kind: "played" });
  assert.deepEqual(journeyOutcome(j), { kind: "won", perf: 1, perfect: true });
  assert.equal(j.game?.rounds, 3);
  assert.equal(rideGameFor(j), "where-am-i");
});

test("old saves load", () => {
  // 0.0.34: no dealt game, no pick, no history.
  const v34: Journey = reload({ from: "austin", to: "tucson", departAt: T0, arriveAt: T0 + 4 * MIN, openMs: 0, lastTickAt: T0 });
  const g34 = pickRideGame(4 * MIN, ["lamplighter", "where-am-i", "match-sorter"], T0);
  assert.equal(suggestedRideGame(v34), g34);
  assert.equal(rideGameFor(v34), g34);
  assert.equal(pickerDefault(v34, 3 * MIN), g34);
  assert.deepEqual(ridePickerGames(3 * MIN), ALL);
  // 0.0.40: a ride under way mid-round, with a dealt game and an earlier best.
  const v40 = reload(openRound(markRound({ from: "austin", to: "temple", departAt: T0, arriveAt: T0 + 9 * MIN, rideGame: "route-puzzle" } as Journey, { kind: "played" }), T0 + 2 * MIN));
  const loaded = forfeitRound(v40);
  assert.equal(loaded.roundAt, undefined);
  assert.equal(loaded.chosenGame, undefined);
  assert.equal(rideGameFor(loaded), "route-puzzle");
  assert.equal(pickerDefault(loaded, 6 * MIN), "route-puzzle");
  assert.deepEqual(journeyOutcome(loaded), { kind: "played" }, "earlier best stands");
  let keys = empty();
  let j = loaded;
  for (let t = T0 + 2 * MIN; t <= j.arriveAt + 5 * SEC; t += 5 * SEC) ({ journey: j, keys } = settleRide(j, keys, t, false));
  assert.equal(keys.white, rideReward(9 * MIN, { kind: "played" }).white);
  // Playing on an old ride stores the pick from then on.
  assert.equal(rideGameFor(chooseRideGame(loaded, "lamplighter")), "lamplighter");
});
