import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyBank, bankDownSpec, bankUpSpec } from "./rewards.ts";
import { cleanKeys, hasMatch, refundMatch, savedKeys, spendMatch } from "./matchSpend.ts";
import type { Tier } from "./types.ts";

const pocket = (p: Partial<Record<Tier, number>> = {}): Record<Tier, number> => ({ white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0, ...p });
const cap = (t: Tier) => (t === "white" ? 6 : t === "blue" ? 4 : t === "green" ? 3 : 99);

test("spendMatch checks and deducts together, never below 0", () => {
  const one = pocket({ blue: 1 });
  const after = spendMatch(one, "blue");
  assert.deepEqual(after, pocket());
  assert.equal(spendMatch(after!, "blue"), null, "the same match can't be spent twice");
  assert.equal(spendMatch(pocket({ amber: 1 }), "amber", 2), null);
  assert.equal(spendMatch(pocket({ red: 0 }), "red"), null);
  assert.equal(one.blue, 1, "the input pocket is not mutated");
});

test("a bad save value reads as no match, never as one", () => {
  for (const bad of [null, undefined, Number.NaN, -1, "1", "x", 0.5, Number.POSITIVE_INFINITY]) {
    const k = { ...pocket(), amber: bad } as unknown as Record<Tier, number>;
    // NaN < 1 is false, so the old `keys[tier] < 1` check let a NaN pocket open any lamp.
    assert.equal(hasMatch(k, "amber"), bad === "1", `amber ${String(bad)}`);
    assert.equal(spendMatch(k, "amber") === null, bad !== "1");
  }
  assert.deepEqual(cleanKeys({ white: 2.7, blue: -3 }), pocket({ white: 2 }));
});

test("double tap / stacked deal: one match opens one lamp", () => {
  let keys: Record<Tier, number> | null = pocket({ green: 1 });
  let opened = 0;
  for (let i = 0; i < 3; i += 1) {
    const next = spendMatch(keys!, "green");
    if (next) {
      keys = next;
      opened += 1;
    }
  }
  assert.equal(opened, 1);
  assert.equal(keys!.green, 0);
});

test("a match held by an open card can't be traded at the bank (3-down / 4-up)", () => {
  // Card dealt: the blue leaves the pocket at once, so the exchange sees 0 and refuses.
  const held = spendMatch(pocket({ blue: 1 }), "blue")!;
  assert.equal(applyBank(held, bankDownSpec("blue")!, cap), null);
  const four = spendMatch(pocket({ white: 4 }), "white")!;
  assert.equal(applyBank(four, bankUpSpec("white")!, cap), null, "4-up needs four in the pocket, not three plus a held one");
  // Walk away before answering: the held match comes back, nothing is lost or created.
  assert.deepEqual(refundMatch(held, "blue"), pocket({ blue: 1 }));
});

test("another tab's save is adopted as the real pocket", () => {
  const raw = JSON.stringify({ version: 2, keys: { blue: 0, white: 3, amber: null } });
  assert.deepEqual(savedKeys(raw), pocket({ white: 3 }));
  assert.equal(savedKeys(null), null);
  assert.equal(savedKeys("{nope"), null);
  assert.equal(savedKeys(JSON.stringify({ version: 9, keys: { blue: 4 } })), null);
});

test("store wiring: lamps spend through the guard", () => {
  const src = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  // No unchecked `keys[x] - 1` left anywhere in the store.
  assert.doesNotMatch(src, /keys\[[\w.]+\]\s*-\s*1/);
  assert.doesNotMatch(src, /keys\[[\w.]+\]\s*<\s*1/);
  const deal = src.slice(src.indexOf("  pickCategory: (cat, "), src.indexOf("  answer: (choice, now)"));
  assert.match(deal, /spendMatch\(get\(\)\.keys, cost\)/, "the deal takes the match atomically");
  assert.match(deal, /hasMatch\(get\(\)\.keys, cost\)/, "and re-checks before asking the server");
  assert.match(deal, /held: cost/);
  const settle = src.slice(src.indexOf("  settleAnswer: (out, "), src.indexOf("  closeVault: () => {"));
  assert.match(settle, /ov\.held \? cleanKeys\(get\(\)\.keys\)/, "settle never takes a second match");
  const close = src.slice(src.indexOf("  closeVault: () => {"), src.indexOf("  closeShop: () => set"));
  assert.match(close, /refundMatch\(get\(\)\.keys, ov\.held\)/, "walking away from a lamp gives the held match back");
  const open = src.slice(src.indexOf("  tryOpen: (poiId, "), src.indexOf("  pickCategory: (cat, "));
  assert.match(open, /if \(get\(\)\.openVault\) get\(\)\.closeVault\(\);/, "a second lamp never stacks over a held match");
  assert.match(src, /addEventListener\("storage"/, "a second tab picks up the spent match");
  assert.match(src, /keys: cleanKeys\(\{ \.\.\.EMPTY_KEYS, \.\.\.saved\?\.keys \}\)/);
});
