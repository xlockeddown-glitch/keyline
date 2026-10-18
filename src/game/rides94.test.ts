// 0.0.94: shorter rides, ramping rounds with a midway bonus, whole-game ride boards.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_LIST } from "./data.ts";
import { FARE_MAX_MS, HAUL_MS, fareMs, settleRide, transitLoot } from "./ticket.ts";
import { RIDE_BONUS_WHITE, bonusDue, lampSchedule, markRound, openRound, rideRamp, rideRoundMs, forfeitRound } from "./rideGames.ts";
import { sorterSchedule } from "./matchSorter.ts";
import { emptyWallet, rideOp } from "./wallet.ts";
import { ownLine, rankLanterns } from "./standings.ts";
import type { Journey, Tier } from "./types.ts";

const MIN = 60_000;

test("every ride is 8 min or less, and most land between 4 and 8", () => {
  assert.equal(FARE_MAX_MS, 8 * MIN);
  const v: number[] = [];
  for (const a of CITY_LIST) for (const b of CITY_LIST) if (a.id !== b.id) v.push(fareMs(a.id, b.id));
  v.sort((x, y) => x - y);
  assert.ok(v[v.length - 1]! <= 8 * MIN);
  assert.ok(v[0]! >= 48_000);
  const med = v[Math.floor(v.length / 2)]!;
  assert.ok(med >= 6 * MIN && med <= 8 * MIN, `median ${med}`);
  assert.equal(transitLoot(HAUL_MS, 0, HAUL_MS).blue, 1, "the long-haul blue is reachable");
});

test("each round runs a little hotter, capped; the bonus round hotter again", () => {
  assert.equal(rideRamp(0), 1);
  assert.equal(rideRamp(1), 1.06);
  assert.equal(rideRamp(5), 1.3);
  assert.equal(rideRamp(40), 1.3);
  assert.equal(rideRamp(2, true), 1.22);
  const slow = lampSchedule(60_000, 7, 1).length;
  const fast = lampSchedule(60_000, 7, 1.3).length;
  assert.ok(fast > slow, `${fast} > ${slow} lamps`);
  const s1 = sorterSchedule(9, 1);
  const s2 = sorterSchedule(9, 1.3);
  assert.deepEqual(s1.map((m) => m.tier), s2.map((m) => m.tier), "same tiers, just faster");
  assert.ok(s2.at(-1)!.at < s1.at(-1)!.at && s2[0]!.fallMs < s1[0]!.fallMs);
  assert.ok(rideRoundMs("match-sorter", 5 * MIN, 1.3)! < rideRoundMs("match-sorter", 5 * MIN)!);
  assert.ok(rideRoundMs("where-am-i", 5 * MIN, 1.3)! >= 30_000);
});

test("the bonus round is the first one dealt past halfway, once", () => {
  assert.equal(bonusDue(0, 100, 49, -1), false);
  assert.equal(bonusDue(0, 100, 50, -1), true);
  assert.equal(bonusDue(0, 100, 70, 2), false, "already dealt");
  assert.equal(bonusDue(0, 100, 100, -1), false, "arrived");
});

test("guest: winning the bonus round adds RIDE_BONUS_WHITE once; losing or forfeiting adds nothing", () => {
  const empty = (): Record<Tier, number> => ({ white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 });
  const base: Journey = { from: "austin", to: "temple", departAt: 0, arriveAt: 6 * MIN, openMs: 0, lastTickAt: 0, grantedWhite: 0, grantedBlue: 0, grantedGreen: 0 };
  const plain = settleRide(markRound(base, { kind: "played" }), empty(), 6 * MIN, false).keys.white;
  const lost = settleRide(markRound(openRound(base, 4 * MIN, true), { kind: "played" }), empty(), 6 * MIN, false).keys.white;
  assert.equal(lost, plain);
  const winJ = markRound(openRound(base, 4 * MIN, true), { kind: "won", perf: 0.5 });
  const winPlain = settleRide(markRound(base, { kind: "won", perf: 0.5 }), empty(), 6 * MIN, false).keys.white;
  assert.equal(settleRide(winJ, empty(), 6 * MIN, false).keys.white, winPlain + RIDE_BONUS_WHITE);
  const cut = forfeitRound(openRound(base, 4 * MIN, true));
  assert.equal(cut.roundBonus, undefined);
  assert.equal(cut.bonusDealt, true, "a forfeited bonus is still the ride's one bonus");
});

test("server: the midway deal is the bonus, ramped, and a won bonus pays once", () => {
  const at = 1_700_000_000_000;
  const len = 6 * MIN;
  let w = emptyWallet();
  const d0 = rideOp(w, { departAt: at, arriveAt: at + len, now: at + 30_000, deal: { game: "lamplighter", n: 0, seed: 5 } });
  assert.ok(d0.ok);
  if (!d0.ok) return;
  assert.deepEqual(JSON.parse(d0.detail!).bonus, false);
  w = d0.wallet;
  const d1 = rideOp(w, { departAt: at, arriveAt: at + len, now: at + 3.2 * MIN, deal: { game: "lamplighter", n: 1, seed: 5 } });
  assert.ok(d1.ok);
  if (!d1.ok) return;
  const det = JSON.parse(d1.detail!);
  assert.equal(det.bonus, true);
  assert.equal(det.ramp, rideRamp(1, true));
  assert.equal(d1.wallet.meta.rideBonusN, 1);
  const before = rideOp(d1.wallet, { departAt: at, arriveAt: at + len, now: at + 3.5 * MIN, touch: true, outcome: { kind: "played" } });
  const won = rideOp(d1.wallet, { departAt: at, arriveAt: at + len, now: at + 3.5 * MIN, touch: true, outcome: { kind: "won", perf: 0.4 } });
  assert.ok(before.ok && won.ok);
  if (!before.ok || !won.ok) return;
  assert.equal(won.wallet.meta.rideBonusWon, true);
  assert.equal(before.wallet.meta.rideBonusWon, false);
  const d2 = rideOp(won.wallet, { departAt: at, arriveAt: at + len, now: at + 4 * MIN, deal: { game: "lamplighter", n: 2, seed: 5 } });
  assert.ok(d2.ok);
  if (!d2.ok) return;
  assert.equal(JSON.parse(d2.detail!).bonus, false, "only one bonus per ride");
});

test("ride boards: top 5 lanterns, and your own line only when you're off the top 5", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({ userId: `u${i}`, name: `P${i}`, correct: 100 - i * 10, updatedAt: i }));
  const top = rankLanterns(rows);
  assert.equal(top.length, 5);
  assert.deepEqual(top.map((r) => r.value), [100, 90, 80, 70, 60]);
  assert.equal(ownLine(top, "u1", { value: 90, rank: 2 }), null, "already on the board");
  assert.deepEqual(ownLine(top, "u7", { value: 30, rank: 8 }), { rank: 8, value: 30 });
  assert.equal(ownLine(top, null, { value: 30, rank: 8 }), null);
  assert.equal(ownLine(top, "u9", { value: 0, rank: null }), null);
});
