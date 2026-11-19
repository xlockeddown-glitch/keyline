// 0.0.53: the qa:no-answers detector — catches card literals, answer keys, known answers and bank prompts; a clean
// client chunk (prompt-free UI copy, a dealt card's shape without an answer) passes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { KNOWN_ORDER_LABELS, KNOWN_ANSWERS, MIN_ORDER_PROBE, ORDER_PUBLIC_COPY, bankPrompts, orderProbes, scanText } from "./qa-no-answers.mjs";

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


test("order bank labels and answer mappings are caught; opaque deal rows pass", async () => {
  for (const label of KNOWN_ORDER_LABELS) assert.ok(scanText(JSON.stringify({ label, key: 1947 })).some((h) => h.kind === "known answer"));
  for (const key of ["sortKey", "correctOrder", "sortedIndex"]) assert.ok(scanText(`${key}:123`).some((h) => h.kind === "order answer key"));
  assert.deepEqual(scanText('items:[{token:t,label:l}];"Exact order";"One swap off — half coin"'), []);

  // The shape the bank really has: {label, key:<number>}. Planted from the real cards, with no label probes at all,
  // so only the shape pattern can catch it: JSON, minified, negative, fractional and key-first.
  const { ORDER_CARDS, generateOrder } = await import("../src/game/banks/order.ts");
  const shape = (text) => scanText(text, { answers: [] }).some((h) => h.kind === "order item with its sort key");
  for (const c of [...ORDER_CARDS, ...generateOrder("red", 5)]) {
    for (const x of c.items) {
      assert.ok(shape(JSON.stringify(x)), `JSON item ${x.label}`);
      assert.ok(shape(`{label:${JSON.stringify(x.label)},key:${String(x.key).replace(/^(-?)0\./, "$1.")}}`), `minified item ${x.label}`);
      assert.ok(shape(`{key:${x.key},label:\`${x.label}\`}`), `key-first item ${x.label}`);
    }
  }
  assert.ok(shape("{label:'Lithium',key:.534}"));
  // UI rows that carry a label and a React/string key, or a token, are not order items.
  for (const ok of ['{label:"Coins",key:"coins"}', "{label:l,key:k}", '{key:"a",label:"Walk"}', "items.map(x=>({token:x.token,label:x.label}))"]) assert.equal(shape(ok), false, ok);

  // Every authored label and fact of 16+ characters is probed, so a shipped bank is caught whatever its shape
  // (the source keeps `["label", key]` pairs).
  const probes = orderProbes(ORDER_CARDS);
  assert.ok(probes.length >= 60);
  assert.ok(probes.every((p) => p.length >= MIN_ORDER_PROBE));
  for (const c of ORDER_CARDS) {
    assert.ok(probes.includes(c.fact), c.id);
    for (const x of c.items) if (x.label.length >= MIN_ORDER_PROBE && !ORDER_PUBLIC_COPY.includes(x.label)) assert.ok(scanText(`[[${JSON.stringify(x.label)},${x.key}]]`, { answers: probes }).some((h) => h.kind === "known answer" && h.sample === x.label));
  }
  for (const label of KNOWN_ORDER_LABELS) assert.ok(probes.includes(label), label);
});
