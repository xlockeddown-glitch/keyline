import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BANK_DOWN,
  BANK_UP,
  TIER_ORDER,
  TIER_VALUE,
  applyBank,
  bankDownSpec,
  bankUpSpec,
  rewardPoints,
} from "./rewards.ts";
import { matchCap } from "./ticket.ts";

test("locked ladder A is 3× from white 30", () => {
  assert.deepEqual(TIER_VALUE, {
    white: 30,
    blue: 90,
    green: 270,
    amber: 810,
    red: 2430,
    violet: 7290,
  });
  for (let i = 1; i < TIER_ORDER.length; i++) {
    const low = TIER_VALUE[TIER_ORDER[i - 1]!];
    const high = TIER_VALUE[TIER_ORDER[i]!];
    assert.equal(high, low * 3);
  }
});

test("rewardPoints uses only TIER_VALUE", () => {
  assert.equal(rewardPoints("white", { mult: 1, bonus: 1 }), 30);
  assert.equal(rewardPoints("violet", { mult: 1, bonus: 1 }), 7290);
  assert.equal(rewardPoints("blue", { mult: 0.4, bonus: 1, diffMult: 1 }), Math.round(90 * 0.4));
  assert.equal(rewardPoints("amber", { mult: 1, bonus: 1.2, diffMult: 1.45, loot: 1.01, series: true }), Math.round(810 * 1 * 1.2 * 1.45 * 1.01 * 1.15));
});

test("Bank 4-up taxes; 3-down is exact", () => {
  const up = bankUpSpec("white")!;
  assert.equal(up.payN, BANK_UP);
  assert.equal(up.get, "blue");
  assert.equal(TIER_VALUE.white * BANK_UP, 120);
  assert.equal(TIER_VALUE.blue, 90);
  const down = bankDownSpec("blue")!;
  assert.equal(down.getN, BANK_DOWN);
  assert.equal(TIER_VALUE.blue, TIER_VALUE.white * BANK_DOWN);
  for (let i = 0; i < TIER_ORDER.length - 1; i++) {
    const from = TIER_ORDER[i]!;
    const to = TIER_ORDER[i + 1]!;
    const craft = bankUpSpec(from)!;
    const brk = bankDownSpec(to)!;
    assert.equal(craft.payN, 4);
    assert.equal(craft.getN, 1);
    assert.equal(craft.get, to);
    assert.equal(brk.payN, 1);
    assert.equal(brk.getN, 3);
    assert.equal(brk.get, from);
  }
  assert.equal(bankUpSpec("violet"), null);
  assert.equal(bankDownSpec("white"), null);
});

test("applyBank refuses a short pocket or a cap overflow", () => {
  const keys = { white: 4, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const next = applyBank(keys, bankUpSpec("white")!, matchCap);
  assert.deepEqual(next, { white: 0, blue: 1, green: 0, amber: 0, red: 0, violet: 0 });
  assert.equal(applyBank({ ...keys, white: 3 }, bankUpSpec("white")!, matchCap), null);
  const fat = { white: 2, blue: 1, green: 0, amber: 0, red: 0, violet: 0 };
  assert.equal(applyBank(fat, bankDownSpec("blue")!, matchCap), null);
});

test("applyBank 1 higher → 3 lower with no tax when the pocket fits", () => {
  const keys = { white: 1, blue: 1, green: 0, amber: 0, red: 0, violet: 0 };
  const next = applyBank(keys, bankDownSpec("blue")!, matchCap);
  assert.deepEqual(next, { white: 4, blue: 0, green: 0, amber: 0, red: 0, violet: 0 });
  assert.equal(TIER_VALUE.blue, TIER_VALUE.white * BANK_DOWN);
});
