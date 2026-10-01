import assert from "node:assert/strict";
import { test } from "node:test";
import { loadQuestions } from "./trivia-audit.mjs";
import { choiceValue, lintTrivia, numberLeak, numericTwin, regionOverlap } from "./trivia-lint.mjs";

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
