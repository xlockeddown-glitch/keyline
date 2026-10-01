import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import {
  ARRIVAL_BUFFER_MS,
  RIDE_PERFECT_BONUS,
  betterOutcome,
  journeyOutcome,
  lampOutcome,
  markRound,
  perfectLine,
  pickRideGame,
  rideReward,
  rideRoundMs,
  rideValue,
  type RideGameMark,
} from "./rideGames.ts";
import { transitLoot } from "./ticket.ts";
import {
  WHERE_CHOICES,
  WHERE_ROUND_MAX_MS,
  WHERE_ROUND_MIN_MS,
  WHERE_ROUNDS,
  cluePool,
  namesIn,
  whereDeck,
  whereOutcome,
  wherePerfect,
  whereRound,
  whereRoundMs,
  whereVerdict,
  words,
} from "./whereAmI.ts";
import type { Poi } from "./types.ts";

const MIN = 60_000;
const cities = Object.values(CITIES);

test("every city has enough clues for a full round", () => {
  for (const c of cities) {
    const pool = cluePool(c.pois);
    assert.ok(pool.length >= 2 * WHERE_ROUNDS, `${c.id}: ${pool.length} clues`);
    assert.equal(whereRound(c.pois, 1, 0).length, WHERE_ROUNDS, c.id);
  }
});

test("clues are real lore that never names the answer or a decoy", () => {
  for (const c of cities) {
    const byName = new Map(c.pois.map((p) => [p.name, p]));
    for (let r = 0; r < 3; r++) {
      for (const q of whereRound(c.pois, 4242 + r, r)) {
        const p = c.pois.find((x) => x.id === q.id)!;
        assert.equal(q.clue, p.lore.trim(), "clue is the shipped lore");
        assert.equal(q.answer, p.name);
        assert.equal(q.choices.length, WHERE_CHOICES);
        assert.equal(new Set(q.choices).size, WHERE_CHOICES, "no doubled choices");
        assert.ok(q.choices.includes(q.answer));
        for (const ch of q.choices) {
          assert.ok(byName.has(ch), `${ch} is a real place in ${c.id}`);
          assert.notEqual(byName.get(ch)!.kind, "shop", "the scout shop is not a real place");
          assert.ok(!namesIn(q.clue, ch), `${c.id}: "${q.clue}" names ${ch}`);
        }
        assert.doesNotMatch(q.clue, /\b(lamp|blank|plate|stack|lantern|scout)s?\b/i);
      }
    }
  }
});

test("no repeats within a ride until the deck runs out", () => {
  for (const c of cities) {
    for (const seed of [1, 99, 1_700_000_000_000]) {
      const pool = cluePool(c.pois).length;
      const rounds = Math.floor(pool / WHERE_ROUNDS);
      const seen = new Set<string>();
      for (let r = 0; r < rounds; r++) {
        for (const q of whereRound(c.pois, seed, r)) {
          assert.ok(!seen.has(q.id), `${c.id} seed ${seed}: ${q.id} repeated in round ${r}`);
          seen.add(q.id);
        }
      }
      assert.equal(seen.size, rounds * WHERE_ROUNDS);
    }
  }
});

test("same ride deals the same deck; a different ride shuffles", () => {
  const pois = CITIES.austin.pois;
  assert.deepEqual(whereRound(pois, 7, 1), whereRound(pois, 7, 1));
  assert.notDeepEqual(
    whereDeck(pois, 7).map((p) => p.id),
    whereDeck(pois, 8).map((p) => p.id),
  );
});

test("pool drops thin, flavor-only, and self-naming lore", () => {
  const mk = (id: string, name: string, lore: string): Poi => ({ id, name, lore, lat: 0, lng: 0, kind: "park", tier: "white" });
  const pool = cluePool([
    mk("a", "Pease Park", "Shoal Creek's green ribbon, with a festival for a donkey's birthday each spring."),
    mk("b", "Rainey Street", "Bungalows turned into bars."),
    mk("c", "Sixth Street", "The strip of neon between Congress and the interstate, with a blank on a lamp here."),
    mk("d", "Zilker Park", "Zilker is the city's front lawn, with festivals and a trailhead to the greenbelt."),
  ]);
  assert.deepEqual(pool.map((p) => p.id), ["a"]);
  assert.deepEqual(words("Mercado San Agustín"), ["mercado", "san", "agustin"]);
});

test("scoring: four of five wins, five is a strong win, short or incomplete is played", () => {
  assert.deepEqual(whereOutcome({ asked: 5, right: 5, total: 5 }), { kind: "won", perf: 1, perfect: true });
  assert.deepEqual(whereOutcome({ asked: 5, right: 4, total: 5 }), { kind: "won", perf: 0.5 });
  assert.deepEqual(whereOutcome({ asked: 5, right: 3, total: 5 }), { kind: "played" });
  assert.deepEqual(whereOutcome({ asked: 0, right: 0, total: 5 }), { kind: "played" });
  assert.deepEqual(whereOutcome({ asked: 4, right: 4, total: 5 }), { kind: "played" }, "clock ran out");
  assert.match(whereVerdict({ asked: 5, right: 5, total: 5 }, "Austin"), /5 of 5/);
  assert.match(whereVerdict({ asked: 3, right: 2, total: 5 }, "Austin"), /clock/);
});

test("scoring → reward: a clean sheet beats four of five beats played beats idle", () => {
  for (const m of [2, 3, 4, 5.9]) {
    const ms = m * MIN;
    const v = (right: number, asked = 5) => rideValue(rideReward(ms, whereOutcome({ asked, right, total: 5 })));
    const idle = rideValue(rideReward(ms, { kind: "idle" }));
    assert.ok(v(5) > v(3), `${m}m: 5/5 beats 3/5`);
    assert.ok(v(4) >= v(3), `${m}m: 4/5 at least played`);
    assert.ok(v(3) >= idle, `${m}m: played at least idle`);
    assert.ok(v(5) >= 1);
  }
  // Four-minute ride: idle 1, played 2, 4/5 = 3 whites, 5/5 = 4 whites (strong win, no blue under 5) + 1 perfect bonus.
  assert.deepEqual(rideReward(4 * MIN, whereOutcome({ asked: 5, right: 3, total: 5 })), { white: 2, blue: 0 });
  assert.deepEqual(rideReward(4 * MIN, whereOutcome({ asked: 5, right: 4, total: 5 })), { white: 3, blue: 0 });
  assert.deepEqual(rideReward(4 * MIN, whereOutcome({ asked: 5, right: 5, total: 5 })), { white: 5, blue: 0 });
});

test("perfect round: 5/5 pays the base strong win plus one flat white; 4/5 is unchanged", () => {
  for (const m of [1, 2, 3, 4, 5.4, 5.9, 8, 14]) {
    const ms = m * MIN;
    const base5 = rideReward(ms, { kind: "won", perf: 1 });
    const base4 = rideReward(ms, { kind: "won", perf: 0.5 });
    const five = rideReward(ms, whereOutcome({ asked: 5, right: 5, total: 5 }));
    assert.deepEqual(five, { white: base5.white + RIDE_PERFECT_BONUS, blue: base5.blue }, `${m}m: 5/5 = base + 1`);
    assert.deepEqual(rideReward(ms, whereOutcome({ asked: 5, right: 4, total: 5 })), base4, `${m}m: 4/5 unchanged`);
  }
  assert.equal(RIDE_PERFECT_BONUS, 1);
  // A short deck (fewer than five clues) can still win, but isn't a perfect round.
  assert.equal(wherePerfect({ asked: 4, right: 4, total: 4 }), false);
  assert.deepEqual(whereOutcome({ asked: 4, right: 4, total: 4 }), { kind: "won", perf: 1 });
  assert.match(perfectLine(whereOutcome({ asked: 5, right: 5, total: 5 })) ?? "", /Perfect round: \+1 white/);
  assert.equal(perfectLine(whereOutcome({ asked: 5, right: 4, total: 5 })), undefined);
  // Lamplighter never sets the flag, so its pay is untouched.
  assert.equal("perfect" in lampOutcome({ lamps: 20, hits: 20, strays: 0 }), false);
});

test("perfect round is remembered on the journey and survives a worse later round", () => {
  const five = whereOutcome({ asked: 5, right: 5, total: 5 });
  let j: RideGameMark = markRound({}, whereOutcome({ asked: 5, right: 4, total: 5 }));
  assert.equal(j.game?.perfect, undefined);
  j = markRound(j, five);
  assert.equal(j.game?.perfect, true);
  j = markRound(j, whereOutcome({ asked: 5, right: 3, total: 5 }));
  assert.deepEqual(journeyOutcome(j), five);
  assert.equal(j.game?.rounds, 3);
  // Same perf, with and without the flag: the perfect one wins the tie.
  assert.deepEqual(betterOutcome({ kind: "won", perf: 1 }, five), five);
  assert.deepEqual(betterOutcome(five, { kind: "won", perf: 1 }), five);
  // The fare settles with the bonus.
  const ms = 5.4 * MIN;
  assert.equal(transitLoot(ms, ms, ms, five).white, transitLoot(ms, ms, ms, { kind: "won", perf: 1 }).white + 1);
});

test("Where am I? rounds fit 30–75s and end before the platform", () => {
  assert.equal(whereRoundMs(10 * MIN), WHERE_ROUND_MAX_MS);
  assert.equal(whereRoundMs(WHERE_ROUND_MIN_MS + ARRIVAL_BUFFER_MS), WHERE_ROUND_MIN_MS);
  assert.equal(whereRoundMs(WHERE_ROUND_MIN_MS + ARRIVAL_BUFFER_MS - 1), null);
  for (const left of [40_000, 70_000, 3 * MIN]) {
    const ms = whereRoundMs(left)!;
    assert.ok(ms + ARRIVAL_BUFFER_MS <= left);
  }
  assert.equal(rideRoundMs(pickRideGame(4 * MIN), 4 * MIN), WHERE_ROUND_MAX_MS);
  assert.equal(rideRoundMs(pickRideGame(90_000), 90_000), 60_000);
});
