import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWheel, caughtUpClaims, grantWheelPrize, owedTier, wheelSlices } from "./wheel.ts";

const EMPTY = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };

test("a color owes a spin on every 25th correct, and old saves do not back-pay", () => {
  assert.equal(owedTier({ ...EMPTY, white: 24 }, EMPTY), null);
  assert.equal(owedTier({ ...EMPTY, white: 25 }, EMPTY), "white");
  assert.equal(owedTier({ ...EMPTY, white: 50 }, { ...EMPTY, white: 1 }), "white");
  assert.equal(owedTier({ ...EMPTY, red: 25, white: 25 }, { ...EMPTY, white: 1 }), "red");
  assert.equal(caughtUpClaims({ ...EMPTY, violet: 40, blue: 25 }).violet, 1);
  assert.equal(caughtUpClaims({ ...EMPTY, violet: 40, blue: 25 }).blue, 1);
});

test("rarer vaults pay more coin and lean toward matches", () => {
  const white = wheelSlices("white", "nyc");
  const violet = wheelSlices("violet", "nyc");
  const whiteCoin = white.find((s) => s.prize.kind === "coins")!.prize;
  const violetCoin = violet.find((s) => s.prize.kind === "coins")!.prize;
  assert.equal(whiteCoin.kind, "coins");
  assert.equal(violetCoin.kind, "coins");
  if (whiteCoin.kind === "coins" && violetCoin.kind === "coins") {
    assert.ok(violetCoin.n > whiteCoin.n);
  }
  const whiteKey = white.find((s) => s.prize.kind === "key")!.w;
  const violetKey = violet.find((s) => s.prize.kind === "key")!.w;
  assert.ok(violetKey > whiteKey);
  const spun = buildWheel("amber", "austin", 0);
  assert.equal(spun.win, 0);
  assert.equal(spun.slices.length, 8);
});

test("a full match pocket pays coin instead of a wasted key", () => {
  const keys = { white: 4, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const paid = grantWheelPrize(
    { kind: "key", tier: "white", n: 1, face: "Match", label: "A white match" },
    { keys, points: 10, pantry: {} },
  );
  assert.equal(paid.keys.white, 4);
  assert.ok(paid.points > 10);
  assert.match(paid.line, /coin/i);
});
