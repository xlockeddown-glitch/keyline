import { test } from "node:test";
import assert from "node:assert/strict";
import { ARRIVAL_BUFFER_MS, RIDE_PERFECT_BONUS, perfectLine, rideReward, rideRoundMs, rideValue } from "./rideGames.ts";
import {
  SORT_RANK,
  SORT_ROUND_MS,
  SORT_TIERS,
  SORT_TOTAL,
  SORT_WAVES,
  SORT_WIN,
  fallProgress,
  inAir,
  sortOutcome,
  sortPerfect,
  sortVerdict,
  sorterRoundMs,
  sorterSchedule,
} from "./matchSorter.ts";

const MIN = 60_000;
const tally = (right: number, wrong = 0, missed = SORT_TOTAL - right - wrong) => ({ total: SORT_TOTAL, right, wrong, missed });

test("waves are deterministic per seed, differ across seeds, and use every tier box", () => {
  const a = sorterSchedule(1_790_000_000_123);
  assert.deepEqual(sorterSchedule(1_790_000_000_123), a);
  assert.notDeepEqual(sorterSchedule(1_790_000_000_124).map((m) => m.tier), a.map((m) => m.tier));
  assert.equal(a.length, SORT_TOTAL);
  for (const seed of [0, 1, 7, 42, 1_790_000_000_000]) {
    const s = sorterSchedule(seed);
    SORT_WAVES.forEach((w, i) => {
      const wave = s.filter((m) => m.wave === i);
      assert.equal(wave.length, w.count);
      // Five-match wave: five distinct tiers; six or more: all six boxes get a match.
      assert.equal(new Set(wave.map((m) => m.tier)).size, Math.min(6, w.count), `seed ${seed} wave ${i}`);
    });
    // Timing never depends on the seed, so the round always fits the same window.
    assert.deepEqual(s.map((m) => [m.at, m.fallMs]), sorterSchedule(0).map((m) => [m.at, m.fallMs]));
    assert.ok(s.every((m) => m.at + m.fallMs <= SORT_ROUND_MS));
    assert.ok(s.every((m, i) => i === 0 || m.at > s[i - 1]!.at), "drops in order");
  }
  assert.deepEqual(Object.values(SORT_RANK), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...SORT_TIERS], ["white", "blue", "green", "amber", "red", "violet"]);
});

test("waves speed up and the round is a ~30–40s window that ends before the platform", () => {
  for (let i = 1; i < SORT_WAVES.length; i++) {
    assert.ok(SORT_WAVES[i]!.fallMs < SORT_WAVES[i - 1]!.fallMs);
    assert.ok(SORT_WAVES[i]!.gapMs < SORT_WAVES[i - 1]!.gapMs);
  }
  assert.ok(SORT_ROUND_MS >= 30_000 && SORT_ROUND_MS <= 40_000, `${SORT_ROUND_MS}`);
  assert.equal(sorterRoundMs(SORT_ROUND_MS + ARRIVAL_BUFFER_MS), SORT_ROUND_MS);
  assert.equal(sorterRoundMs(SORT_ROUND_MS + ARRIVAL_BUFFER_MS - 1), null);
  assert.equal(rideRoundMs("match-sorter", 4 * MIN), SORT_ROUND_MS);
});

test("matches in the air: dropped, not landed, not sorted, lowest first", () => {
  const s = sorterSchedule(9);
  const t = s[2]!.at + 10;
  const air = inAir(s, new Set([1]), t);
  assert.deepEqual(air.map((m) => m.id), [0, 2]);
  assert.ok(fallProgress(air[0]!, t) > fallProgress(air[1]!, t));
  assert.deepEqual(inAir(s, new Set(), s[0]!.at + s[0]!.fallMs).map((m) => m.id).includes(0), false, "landed");
});

test("scoring → outcome: 70% wins, a clean sheet is perfect, misses and wrong boxes both count", () => {
  const need = Math.ceil(SORT_TOTAL * SORT_WIN);
  assert.deepEqual(sortOutcome(tally(need - 1)), { kind: "played" });
  const line = sortOutcome(tally(need));
  assert.equal(line.kind, "won");
  assert.ok(line.kind === "won" && line.perf < 0.15 && !line.perfect);
  assert.deepEqual(sortOutcome(tally(SORT_TOTAL)), { kind: "won", perf: 1, perfect: true });
  assert.equal(sortPerfect(tally(SORT_TOTAL)), true);
  assert.equal(sortPerfect(tally(SORT_TOTAL - 1, 1, 0)), false);
  assert.deepEqual(sortOutcome({ total: 0, right: 0, wrong: 0, missed: 0 }), { kind: "played" });
  assert.deepEqual(sortOutcome(tally(0)), { kind: "played" });
  // Better sorting never pays less, and a perfect run adds the flat bonus.
  for (const m of [2, 3, 4, 5.9]) {
    const v = (r: number) => rideValue(rideReward(m * MIN, sortOutcome(tally(r))));
    for (let r = 1; r < SORT_TOTAL; r++) assert.ok(v(r + 1) >= v(r), `${m}m ${r}`);
    const base = rideReward(m * MIN, { kind: "won", perf: 1 });
    assert.deepEqual(rideReward(m * MIN, sortOutcome(tally(SORT_TOTAL))), { white: base.white + RIDE_PERFECT_BONUS, blue: base.blue });
  }
  assert.match(perfectLine(sortOutcome(tally(SORT_TOTAL))) ?? "", /Perfect round/);
  assert.match(sortVerdict(tally(SORT_TOTAL)), /Not one in the wrong box/);
  assert.match(sortVerdict(tally(need)), /in order/);
  assert.match(sortVerdict(tally(5, 2)), /floor/);
  assert.match(sortVerdict(tally(5, 15, 6)), /wrong box/);
});
