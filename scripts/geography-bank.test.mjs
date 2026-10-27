import test from "node:test";
import assert from "node:assert/strict";
import { loadQuestions } from "./trivia-audit.mjs";

test("0.1.53: Geography bank is about 200 well-formed cards across all three tiers", () => {
  const cards = loadQuestions().filter((c) => c.file.endsWith("banks/geography_20261027.ts"));
  assert.ok(cards.length >= 200, `only ${cards.length}`);
  const prompts = new Set();
  for (const c of cards) {
    assert.equal(c.choices.length, 4, c.q);
    assert.ok(c.choices.includes(c.answer), c.q);
    assert.equal(new Set(c.choices).size, 4, c.q);
    assert.ok(!prompts.has(c.q), `duplicate ${c.q}`);
    prompts.add(c.q);
  }
  for (const d of [1, 2, 3]) assert.ok(cards.filter((c) => c.diff === d).length >= 30, `tier ${d}`);
});
