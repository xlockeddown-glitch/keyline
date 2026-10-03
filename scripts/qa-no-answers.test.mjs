// 0.0.53: the qa:no-answers detector — catches card literals, answer keys, known answers and bank prompts; a clean
// client chunk (prompt-free UI copy, a dealt card's shape without an answer) passes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { KNOWN_ANSWERS, bankPrompts, scanText } from "./qa-no-answers.mjs";

test("a card literal with its answer is caught", () => {
  const hits = scanText('x={q:"Which river runs through Austin, Texas?",choices:["Colorado","Brazos","Pecos","Trinity"],answer:"Colorado"}');
  assert.ok(hits.some((h) => h.kind === "card literal (choices then answer)"));
  assert.ok(hits.some((h) => h.kind === "answer key with a string value"));
});

test("JSON answer keys and correctIndex are caught", () => {
  assert.ok(scanText('{"answer":"27"}').length > 0);
  assert.ok(scanText("const r={correctIndex:2}").length > 0);
  assert.ok(scanText("const r={answerIndex:2}").length > 0);
});

test("known answers and bank prompts are caught", async () => {
  assert.ok(scanText(`f("${KNOWN_ANSWERS[0]}")`).length > 0);
  const prompts = await bankPrompts();
  assert.ok(prompts.length > 1000, "the server bank has its prompts");
  const p = prompts.find((x) => x.length > 40);
  assert.ok(scanText(`q(${JSON.stringify(p)},["a","b","c","d"],"a")`, { prompts: [p] }).some((h) => h.kind === "card prompt"));
});

test("a dealt card's shape and the lamp UI copy pass", () => {
  const ok = 'r={ok:!0,token:t,card:{id:"cAbc",q:e.q,choices:e.choices,diff:2,rarity:"white"}};miss:{answer:n.answer,fact:n.fact};"A–D or 1–4"';
  assert.deepEqual(scanText(ok, { prompts: ["Which river runs through Austin, Texas?"] }), []);
});
