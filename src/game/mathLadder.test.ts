import { test } from "node:test";
import assert from "node:assert/strict";
import { MATH_LADDER, generateFor, ladderCard, mathShape, mathTier, type Shape } from "./mathLadder.ts";
import type { Tier } from "./types";

const bareSq = (s: Shape) => s.nums.length === 1 && s.ops.length === 0 && s.pow.length === 1 && s.pow[0] === 2;

/** Independent bounds per tier: the operands and operations each colour may use. */
function fits(t: Tier, s: Shape): boolean {
  const n = s.nums, ops = s.ops, big = Math.max(...n);
  const addSub = ops.every((o) => o === "+" || o === "−");
  if (!Number.isInteger(s.value) || s.value < 0) return false;
  switch (t) {
    case "white": return addSub && n.length === 2 && big <= 20 && s.value <= 20 && !s.pct || (ops[0] === "×" && Math.min(...n) <= 1 && s.value <= 20);
    case "blue": return !s.pct && !s.parens && !s.pow.length && ((addSub && n.length <= 3 && big <= 999) || (ops[0] === "×" && Math.min(...n) <= 1));
    case "green": return !s.pct && !s.parens && ((bareSq(s) && n[0]! <= 10) || (ops.length === 1 && ops[0] === "×" && big <= 12) || (ops.length === 1 && ops[0] === "÷" && n[1]! <= 12 && s.value <= 12) || (addSub && n.length <= 4 && big <= 99) || (ops.every((o) => o === "×") && big <= 12));
    case "amber": return !s.pct && !s.parens && !s.pow.length && n.length <= 3 && big <= 999 && (ops.includes("×") || ops.includes("÷")) && (ops[0] !== "×" || n.length > 2 || Math.min(...n) <= 9);
    case "red": return (bareSq(s) && n[0]! >= 11 && n[0]! <= 15) || !s.parens && !s.pow.length && (!!s.pct || n.length <= 6) && (s.pct ? [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90].includes(s.pct.p) : big <= 999);
    case "violet": return bareSq(s) ? n[0]! >= 16 && n[0]! <= 25 : (s.parens || s.pow.length > 0) && n.length <= 5 && big <= 100;
  }
}

test("0.0.99 math ladder: 200 generated cards per tier sit inside that tier's operand and operation bounds", () => {
  for (const t of MATH_LADDER) {
    const cards = generateFor(t, 200, 4242);
    assert.ok(cards.length >= 150, `${t}: only ${cards.length} distinct cards`);
    for (const c of cards) {
      const s = mathShape(c.q)!;
      assert.ok(s, c.q);
      assert.equal(c.rarity, t);
      assert.equal(mathTier(s), t, c.q);
      assert.ok(fits(t, s), `${t} out of bounds: ${c.q}`);
      assert.equal(String(s.value), c.answer, c.q);
      assert.ok(!c.answer.includes("."), "whole answers only");
      assert.equal(new Set(c.choices).size, 4, c.q);
      for (const w of c.choices.filter((x) => x !== c.answer)) {
        const d = Math.abs(Number(w) - s.value);
        assert.ok(d <= 12 || w.length === c.answer.length, `near miss: ${c.q} ${w}`);
      }
    }
  }
});

test("examples land where Ryan set them", () => {
  const tier = (q: string) => mathTier(mathShape(q)!);
  assert.equal(tier("What is 16 − 5?"), "white", "his blue-vault card is a white sum");
  assert.equal(tier("What is 47 + 28 − 9?"), "blue");
  assert.equal(tier("What is 7 × 12?"), "green");
  assert.equal(tier("What is 14 × 6 − 23?"), "amber");
  assert.equal(tier("What is 96 ÷ 8?"), "green");
  assert.equal(tier("What is 112 ÷ 7?"), "amber");
  assert.equal(tier("What is 23 × 17?"), "red");
  assert.equal(tier("15% of 240 is…"), "red");
  assert.equal(tier("What is (6 + 14) × 3?"), "violet");
  assert.equal(tier("What is 18²?"), "violet");
  for (let b = 2; b <= 10; b++) {
    assert.equal(tier(`What is ${b}²?`), "green", `${b}² is times-table level`);
    assert.equal(fits("violet", mathShape(`What is ${b}²?`)!), false, `a bare ${b}² on violet must fail`);
  }
  for (let b = 11; b <= 15; b++) assert.equal(tier(`What is ${b}²?`), "red");
  assert.equal(tier("What is 8² − 9 × 5?"), "violet", "multi-step with a square stays violet");
  assert.equal(tier("What is 2.5 × 4?"), "trim", "no decimals");
  assert.equal(tier("12% of 50 is…"), "trim", "only clean percents");
  assert.equal(tier("What is 3^5?"), "trim");
});

test("static cards: re-tiered, far-off options become near misses, word problems untouched", () => {
  const c = ladderCard({ q: "What is 16 − 5?", choices: ["11", "50", "2", "100"], answer: "11", diff: 1, id: "x", rarity: "blue" })!;
  assert.equal(c.rarity, "white");
  assert.equal(c.id, "x");
  assert.ok(c.choices.includes("11") && c.choices.every((w) => Math.abs(Number(w) - 11) <= 12));
  const word = { q: "How many sides does a hexagon have?", choices: ["5", "6", "7", "8"] as [string, string, string, string], answer: "6", diff: 1 as const, id: "y", rarity: "white" as Tier };
  assert.equal(ladderCard(word), word);
  assert.equal(ladderCard({ ...word, q: "What is 3^5?", answer: "243" }), null);
});
