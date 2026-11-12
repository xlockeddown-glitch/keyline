import { test } from "node:test";
import assert from "node:assert/strict";
import { TF_CARDS, formatCards, generatedNear } from "./banks/formats.ts";
import { publicFormatId } from "./triviaService.ts";

test("0.1.158 TF seed: 24 cards, 4 in each of 6 fields, white/blue/green, always difficulty 1, each with a fact", () => {
  assert.equal(TF_CARDS.length, 24);
  const ids = new Set(TF_CARDS.map((c) => c.id));
  assert.equal(ids.size, 24, "unique ids");
  const cats = new Map<string, number>();
  for (const c of TF_CARDS) {
    assert.equal(c.kind, "tf");
    assert.equal(c.diff, 1);
    assert.ok(c.rarity === "white" || c.rarity === "blue" || c.rarity === "green", c.id);
    assert.ok(c.answer === "True" || c.answer === "False", c.id);
    assert.ok(c.fact && c.fact.length > 20, c.id);
    assert.ok(c.q.endsWith(".") || c.q.endsWith("?"), c.id);
    assert.ok(c.cat, c.id);
    cats.set(c.cat!, (cats.get(c.cat!) ?? 0) + 1);
  }
  assert.equal(cats.size, 6);
  for (const [cat, n] of cats) assert.equal(n, 4, cat);
});

test("publicFormatId is stable, prefixed f, and hashes only kind + prompt", () => {
  const c = TF_CARDS[0]!;
  const pub = publicFormatId(c);
  assert.match(pub, /^f[A-Za-z0-9_-]+$/);
  assert.equal(publicFormatId({ kind: "tf", q: c.q }), pub);
  assert.notEqual(publicFormatId({ kind: "tf", q: c.q + "!" }), pub);
  assert.notEqual(publicFormatId({ kind: "near", q: c.q }), pub);
});

test("generatedNear fills 40 cards per amber/red/violet and is included in formatCards", () => {
  const near = generatedNear();
  assert.equal(near.length, 120);
  const one = near[0]!;
  assert.equal(one.kind, "near");
  assert.match(publicFormatId(one), /^f/);
  assert.equal(formatCards().length, TF_CARDS.length + near.length);
});
