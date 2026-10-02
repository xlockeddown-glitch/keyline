import assert from "node:assert/strict";
import { test } from "node:test";
import { loadQuestions } from "./trivia-audit.mjs";
import { choiceValue, lengthGiveaway, lintTrivia, longestAnswerRate, numberLeak, numericTwin, regionOverlap } from "./trivia-lint.mjs";

test("region overlap flags only when the answer overlaps another choice", () => {
  assert.deepEqual(regionOverlap(["Trinidad", "Brazil", "Amazonian South America", "India"], "Brazil"), [
    "Brazil",
    "Amazonian South America",
  ]);
  assert.equal(regionOverlap(["Socotra", "Brazil", "Amazonian South America", "India"], "Socotra"), null);
});

test("numeric twins catch the same value written two ways", () => {
  assert.equal(choiceValue("2/4"), 0.5);
  assert.equal(choiceValue("50%"), 0.5);
  assert.deepEqual(numericTwin(["1/4", "1/2", "2/4", "1"]), ["1/2", "2/4"]);
  assert.equal(numericTwin(["1/4", "1/2", "5/4", "1"]), null);
});

test("number leak catches a numeric answer written in a lookup prompt", () => {
  const card = (q, answer) => ({ q, answer, choices: [answer, "1", "2", "3"], file: "src/game/banks/general.ts" });
  assert.equal(numberLeak(card("How many teams make the NFL playoffs under the current 14-team format?", "14")), true);
  assert.equal(numberLeak(card("How many Merlin engines power a Falcon 9 first stage?", "9")), false);
  assert.equal(numberLeak({ ...card("What is 3 + 4?", "7"), file: "src/game/banks/math.ts" }), false);
});

test("cross-conflict: same prompt, one card's answer is the other's wrong choice", () => {
  const a = { q: "X is…", choices: ["A", "B", "C", "D"], answer: "A", file: "a.ts", line: 1 };
  const b = { q: "X is…", choices: ["A", "B", "C", "D"], answer: "B", file: "b.ts", line: 1 };
  assert.ok(lintTrivia([a, b]).errors.some((e) => e.kind === "cross-conflict"));
});

test("shipped trivia cards pass the lint with no errors", () => {
  const { errors } = lintTrivia(loadQuestions());
  assert.deepEqual(errors.map((e) => `${e.where} ${e.kind}: ${e.detail}`), []);
});

test("length giveaway: flags an answer clearly longer than every wrong choice", () => {
  const card = (answer, ...wrong) => ({ q: "Q?", answer, choices: [answer, ...wrong] });
  // more than 12 characters longer than the longest wrong choice
  assert.equal(lengthGiveaway(card("a".repeat(43), "b".repeat(32), "c", "d")), false);
  assert.equal(lengthGiveaway(card("a".repeat(45), "b".repeat(32), "c", "d")), true);
  // more than 40% longer, by at least 4 characters
  assert.equal(lengthGiveaway(card("a".repeat(15), "b".repeat(10), "c", "d")), true);
  assert.equal(lengthGiveaway(card("a".repeat(14), "b".repeat(10), "c", "d")), false);
  assert.equal(lengthGiveaway(card("abcde", "abc", "x", "y")), false);
  // one long-enough wrong choice clears the card; a shorter answer never flags
  assert.equal(lengthGiveaway(card("a".repeat(40), "b".repeat(36), "c", "d")), false);
  assert.equal(lengthGiveaway(card("short", "b".repeat(30), "c", "d")), false);
});

test("longest-answer rate counts only cards with one strictly longest choice", () => {
  const items = [
    { answer: "longest", choices: ["longest", "a", "b", "c"] },
    { answer: "a", choices: ["a", "longest", "b", "c"] },
    { answer: "tie1", choices: ["tie1", "tie2", "b", "c"] },
  ];
  assert.deepEqual(longestAnswerRate(items), { cards: 2, answerLongest: 1, rate: 0.5 });
});

test("shipped trivia cards have no answer-length giveaways", () => {
  const flagged = loadQuestions().filter(lengthGiveaway);
  assert.deepEqual(flagged.map((it) => `${it.file}:${it.line} ${it.q}`), []);
});

test("the correct answer is the longest choice at close to chance rate (4 choices: at most 35%)", () => {
  const four = loadQuestions().filter((it) => it.choices.length === 4);
  const { cards, answerLongest, rate } = longestAnswerRate(four);
  assert.ok(cards > 1000, `expected a real sample, got ${cards}`);
  assert.ok(rate <= 0.35, `answer is the longest choice on ${(rate * 100).toFixed(1)}% (${answerLongest}/${cards}) of 4-choice cards; chance is 25%`);
});
