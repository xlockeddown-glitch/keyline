import assert from "node:assert/strict";
import { test } from "node:test";
import { rescoreMath, scoreMathPrompt } from "./math-diff.ts";
import type { TriviaQ } from "./types.ts";

function plate(q: string, answer: string, diff: TriviaQ["diff"]): TriviaQ {
  return rescoreMath({
    q,
    choices: ["1", "2", "3", "4"],
    answer,
    diff,
    id: "probe",
    rarity: "amber",
  });
}

test("two-digit subtraction is easy, not an amber card", () => {
  assert.equal(scoreMathPrompt("What is 54 − 14?", 2), 1);
  const hit = plate("What is 54 − 14?", "40", 2);
  assert.equal(hit.diff, 1);
  assert.ok(hit.rarity === "white" || hit.rarity === "blue", hit.rarity);
});

test("products and powers climb with the work", () => {
  assert.equal(scoreMathPrompt("What is 7 × 12?", 1), 2);
  assert.equal(scoreMathPrompt("What is 15 × 15?", 2), 3);
  assert.equal(scoreMathPrompt("What is 2^8?", 2), 3);
  assert.equal(scoreMathPrompt("20% of 50 is…", 1), 2);
  assert.equal(scoreMathPrompt("12% of 50 is…", 2), 3);
  assert.equal(scoreMathPrompt("What is 20 − 8 − 3?", 1), 2);
  assert.equal(scoreMathPrompt("What is −8 + 3?", 1), 2);
});
