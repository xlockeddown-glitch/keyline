import { test } from "node:test";
import assert from "node:assert/strict";
import { NEAR_ZERO_AT, nearLine, nearScore } from "./nearScore.ts";

test("0.1.158 Closest Number: pay slides from ×1 on the dot to ×0 at 25% relative error", () => {
  const exact = nearScore(16254, 16254);
  assert.equal(exact.correct, true);
  assert.equal(exact.mult, 1);
  assert.equal(exact.grade, "perfect");
  assert.equal(exact.offPct, 0);

  const five = nearScore(950, 1000);
  assert.equal(five.offPct, 0.05);
  assert.equal(five.mult, 0.8);
  assert.equal(five.grade, "great");
  assert.equal(five.correct, true);

  const mid = nearScore(875, 1000);
  assert.equal(mid.offPct, 0.125);
  assert.equal(mid.mult, 0.5);
  assert.equal(mid.grade, "good");

  const edge = nearScore(750, 1000);
  assert.equal(edge.offPct, 0.25);
  assert.equal(edge.mult, 0);
  assert.equal(edge.correct, false);
  assert.equal(edge.grade, null);

  const huge = nearScore(0, 10000);
  assert.equal(huge.correct, false);
  assert.equal(huge.mult, 0);
  assert.equal(huge.offPct, 1);

  assert.equal(NEAR_ZERO_AT, 0.25);
});

test("Closest Number scorer handles zero and negative answers", () => {
  assert.deepEqual(nearScore(0, 0), { offPct: 0, mult: 1, correct: true, grade: "perfect" });
  const missZero = nearScore(5, 0);
  assert.equal(missZero.correct, false);
  assert.equal(missZero.mult, 0);
  assert.equal(missZero.offPct, Infinity);

  const neg = nearScore(-95, -100);
  assert.equal(neg.offPct, 0.05);
  assert.equal(neg.mult, 0.8);
  assert.equal(neg.grade, "great");

  assert.equal(nearScore(Number.NaN, 100).correct, false);
  assert.equal(nearScore(10, Number.POSITIVE_INFINITY).correct, false);
});

test("the reveal line groups numbers and reports the miss as a percent", () => {
  assert.equal(nearLine({ value: 16254, guess: 16000, offPct: 0.016 }), "16,254 · you said 16,000 · 1.6% off.");
  assert.equal(nearLine({ value: 400, guess: 400, offPct: 0 }), "400 · you said 400 · spot on.");
  assert.equal(nearLine({ value: 0, guess: 5, offPct: Infinity }), "0 · you said 5 · way off.");
});
