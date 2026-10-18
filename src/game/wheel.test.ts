import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  buildWheel,
  caughtUpClaims,
  grantWheelPrize,
  owedTier,
  WHEEL_NO_SPIN_LINE,
  WHEEL_RETRY_LINE,
  wheelClaimFailed,
  wheelDue,
  wheelSlices,
} from "./wheel.ts";

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
  assert.equal(spun.slices.length, 9);
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

test("0.0.89: a server no-spin closes the wheel for good and marks the color caught up", () => {
  // Device counts 27 white (some answered before sign-in); the server graded fewer and refuses.
  const correct = { ...EMPTY, white: 27 };
  const out = wheelClaimFailed({ ok: false, reason: "no-spin", authoritative: true }, "white", correct, EMPTY);
  assert.equal(out.wheelClaimed.white, 1);
  assert.equal(out.toast, WHEEL_NO_SPIN_LINE);
  // Nothing owed any more, and the next white answer does not re-trap.
  assert.equal(owedTier(correct, out.wheelClaimed), null);
  assert.equal(wheelDue(28, out.wheelClaimed.white), false);
  // The next 25 still earns a spin.
  assert.equal(wheelDue(50, out.wheelClaimed.white), true);
  // Never lowers a claim count.
  assert.equal(wheelClaimFailed({ ok: false, reason: "no-spin" }, "white", correct, { ...EMPTY, white: 3 }).wheelClaimed.white, 3);
});

test("0.0.89: a network or busy failure keeps the spin owed for later", () => {
  const correct = { ...EMPTY, white: 25 };
  for (const r of [null, { ok: false, reason: "busy" }]) {
    const out = wheelClaimFailed(r, "white", correct, EMPTY);
    assert.equal(out.wheelClaimed.white, 0);
    assert.equal(out.toast, WHEEL_RETRY_LINE);
    assert.equal(owedTier(correct, out.wheelClaimed), "white");
    // Comes back on the next white answer, not only on the exact 25th.
    assert.equal(wheelDue(26, out.wheelClaimed.white), true);
  }
  assert.equal(wheelDue(0, 0), false);
  assert.equal(wheelDue(24, 0), false);
});

test("0.0.89: the wheel never re-shows a failed offer and always has a close button", () => {
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.ok(!store.includes("set({ wheel: offer })"), "failed claim must not re-show the same offer");
  assert.match(store, /dismissWheel: \(\) => \{/);
  const ui = readFileSync(new URL("../components/keyline/MysteryWheel.tsx", import.meta.url), "utf8");
  assert.match(ui, /aria-label="Close wheel, spin later"/);
  assert.match(ui, /onClick=\{\(\) => dismissWheel\(\)\}/);
  // A fresh offer resets the spin state instead of opening already landed.
  assert.match(ui, /\}, \[wheel\]\);/);
});

// 0.0.92: match prizes on every wheel, tier-sensible, colour-coded.
test("0.0.92 wheel prizes: white wheel pays white and blue matches; red never violet; violet wheel can", async () => {
  const { wheelSlices, wheelSliceTone, wheelUpTier } = await import("./wheel.ts");
  const tiersOf = (t: Parameters<typeof wheelSlices>[0]) =>
    new Set(wheelSlices(t, "austin").flatMap((s) => (s.prize.kind === "key" ? [s.prize.tier] : [])));
  assert.deepEqual([...tiersOf("white")].sort(), ["blue", "white"]);
  assert.ok(tiersOf("green").has("amber") && tiersOf("green").has("green"));
  assert.ok(!tiersOf("red").has("violet"), "a red wheel never pays violet");
  assert.ok(tiersOf("violet").has("violet"));
  assert.equal(wheelUpTier("red"), "red");
  assert.equal(wheelUpTier("white"), "blue");
  for (const s of wheelSlices("blue", "austin")) {
    const tone = wheelSliceTone(s.prize);
    if (s.prize.kind === "key") assert.equal(tone, s.prize.tier);
    else assert.equal(tone, s.prize.kind === "coins" ? "brass" : "ink");
  }
});

test("0.0.92 wheel prizes: a pair into a nearly full pocket pays what fits plus overflow coin", async () => {
  const { wheelSlices } = await import("./wheel.ts");
  const { matchCap } = await import("./ticket.ts");
  const pair = wheelSlices("white", "austin").find((s) => s.prize.face === "Pair")!.prize;
  assert.equal(pair.kind, "key");
  const keys = { white: matchCap("white") - 1, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const paid = grantWheelPrize(pair, { keys, points: 0, pantry: {} });
  assert.equal(paid.keys.white, matchCap("white"));
  assert.ok(paid.points > 0, "the one that didn't fit came back as coin");
});

test("0.0.92 wheel spin: eases out past the winner, settles back exactly on it, never runs backwards early", async () => {
  const { wheelAngle, WHEEL_OVERSHOOT_DEG } = await import("./wheel.ts");
  const target = 6 * 360 + 120;
  assert.equal(wheelAngle(0, target), 0);
  assert.equal(wheelAngle(1, target), target);
  let peak = 0;
  let prev = 0;
  for (let i = 1; i <= 860; i++) {
    const a = wheelAngle(i / 1000, target);
    assert.ok(a >= prev - 1e-9, `backwards at ${i}`);
    prev = a;
    peak = Math.max(peak, a);
  }
  assert.ok(Math.abs(peak - (target + WHEEL_OVERSHOOT_DEG)) < 1e-6, "overshoots by the set amount");
});
