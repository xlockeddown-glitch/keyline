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
  assert.equal(spun.slices.length, 10);
});

test("0.0.97: a wheel match always lands in its colour (the pocket rule merges overflow)", () => {
  const prize = { kind: "key", tier: "white", n: 1, face: "Match", label: "A white match" } as const;
  const paid = grantWheelPrize(prize, { keys: { white: 30, blue: 0, green: 0, amber: 0, red: 0, violet: 0 }, points: 10, pantry: {} });
  assert.deepEqual([paid.keys.white, paid.points], [31, 10]);
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
    else if (s.prize.kind === "coins") assert.equal(tone, "brass");
    else if (s.prize.kind === "ingredient") assert.equal(tone, "ink");
  }
});

test("0.0.92 wheel prizes: a pair lands whole (0.0.97 pocket rule merges any overflow)", async () => {
  const { wheelSlices } = await import("./wheel.ts");
  const { matchCap } = await import("./ticket.ts");
  const pair = wheelSlices("white", "austin").find((s) => s.prize.face === "Pair")!.prize;
  assert.equal(pair.kind, "key");
  const keys = { white: matchCap("white") - 1, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const paid = grantWheelPrize(pair, { keys, points: 0, pantry: {} });
  assert.equal(paid.keys.white, matchCap("white") + 1);
  assert.equal(paid.points, 0);
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

test("0.0.92 signed-in wheel lands on the server's slice: Spin claims first, the disc animates to the reply's index", () => {
  const ui = readFileSync(new URL("../components/keyline/MysteryWheel.tsx", import.meta.url), "utf8");
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(ui, /const won = await spinWheel\(\);/);
  assert.match(ui, /const win = paid\?\.win \?\? wheel\.win;/);
  assert.match(store, /wheelPaid: \{ win: r\.wheelWin, line, slices \}/);
  assert.match(store, /if \(!walletLive\(\)\) return offer\.win;/, "guests keep their own roll");
});

test("0.0.92 Take all / Nothing: half of the old Cut weight each; Take all pays every other prize; Nothing pays nothing", async () => {
  const { wheelSlices, wheelSliceTone, WHEEL_NOTHING_LINE } = await import("./wheel.ts");
  for (const tier of ["white", "blue", "green", "amber", "red", "violet"] as const) {
    const s = wheelSlices(tier, "austin");
    const r = ["white", "blue", "green", "amber", "red", "violet"].indexOf(tier);
    const all = s.find((x) => x.prize.kind === "all")!;
    const none = s.find((x) => x.prize.kind === "nothing")!;
    assert.equal(all.w, (5 + r * 2) / 2);
    assert.equal(none.w, (5 + r * 2) / 2);
    assert.ok(!s.some((x) => x.prize.face === "Cut"));
    assert.equal(wheelSliceTone(all.prize), "jackpot");
    assert.equal(wheelSliceTone(none.prize), "blank");
    if (all.prize.kind === "all") {
      assert.equal(all.prize.parts.length, s.length - 2, "every other prize, not itself or the blank");
      if (tier !== "violet") assert.ok(!all.prize.parts.some((p) => p.kind === "key" && p.tier === "violet"), `${tier}: no violet`);
    }
  }
  const empty = { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  const w = wheelSlices("white", "austin");
  const nothing = grantWheelPrize(w.find((x) => x.prize.kind === "nothing")!.prize, { keys: empty, points: 7, pantry: {} });
  assert.deepEqual(nothing.keys, empty);
  assert.equal(nothing.points, 7);
  assert.equal(nothing.line, WHEEL_NOTHING_LINE);
  const take = grantWheelPrize(w.find((x) => x.prize.kind === "all")!.prize, { keys: empty, points: 0, pantry: {} });
  // 0.1.97: white base coin 85 + 190 + 335 + 420 (Purse) + 590 = 1,620, white ×1 + white ×2 (Pair) + blue ×1 (Rare).
  assert.equal(take.points, 1620);
  assert.equal(take.keys.white, 3);
  assert.equal(take.keys.blue, 1);
  assert.equal(Object.values(take.pantry).reduce((a, b) => a + (b ?? 0), 0), 0);
  console.log("white take-all:", take.line);
});

test("0.1.82: the Stock slice is a coin Purse at the same weight; no wheel pays an ingredient", async () => {
  const { wheelSlices, STOCK_COIN } = await import("./wheel.ts");
  for (const [r, tier] of (["white", "blue", "green", "amber", "red", "violet"] as const).entries()) {
    const s = wheelSlices(tier, "chicago");
    assert.ok(!s.some((x) => x.prize.kind === "ingredient"), tier);
    const purse = s.find((x) => x.prize.face === "Purse")!;
    assert.equal(purse.w, 14);
    // 0.1.97: the Purse grows with the tier (100 x step, x4.2); STOCK_COIN stays the satchel rate.
    assert.equal(purse.prize.kind === "coins" ? purse.prize.n : -1, Math.round((100 * (r + 1) * 4.2) / 5) * 5);
  }
  assert.equal(STOCK_COIN, 100);
});

const TIERS6 = ["white", "blue", "green", "amber", "red", "violet"] as const;
const OLD = (step: number) => ({ Coin: 20 * step, Pile: 45 * step, Heap: 80 * step, Purse: 100 * step, Jackpot: 140 * step });

test("0.1.97: base coin slices are 4.2x the old table; weights and non-coin slices unchanged", async () => {
  const { wheelSlices, WHEEL_COIN_MULT } = await import("./wheel.ts");
  assert.equal(WHEEL_COIN_MULT, 4.2);
  for (const [r, tier] of TIERS6.entries()) {
    const old = OLD(r + 1);
    const coinSlices = wheelSlices(tier, "nyc").filter((s) => s.prize.kind === "coins");
    assert.equal(coinSlices.length, 5);
    for (const s of coinSlices) {
      const want = Math.round((old[s.prize.face as keyof typeof old] * 4.2) / 5) * 5;
      assert.equal(s.prize.kind === "coins" && s.prize.n, want, `${tier} ${s.prize.face}`);
    }
    assert.deepEqual(
      wheelSlices(tier, "nyc").map((s) => s.w),
      [Math.max(8, 28 - r * 3), 6 + r * 3, 16, 7, 8 + r, 14, 3 + r, 3 + r * 2, (5 + r * 2) / 2, (5 + r * 2) / 2],
    );
  }
});

test("0.1.97: coin jitter stays within ±10% (to the nearest 5), is deterministic, and spreads", async () => {
  const { wheelSlices, buildWheel } = await import("./wheel.ts");
  for (const tier of TIERS6) {
    const base = wheelSlices(tier, "nyc");
    const seen = new Set<number>();
    for (let k = 0; k < 400; k++) {
      const roll = (k * 0.6180339887) % 1;
      const a = buildWheel(tier, "nyc", roll);
      assert.deepEqual(a, buildWheel(tier, "nyc", roll), "same roll, same wheel");
      a.slices.forEach((p, i) => {
        const b = base[i]!.prize;
        if (p.kind === "coins" && b.kind === "coins") {
          assert.ok(p.n % 5 === 0);
          assert.ok(p.n >= Math.round((b.n * 0.9) / 5) * 5 && p.n <= Math.round((b.n * 1.1) / 5) * 5, `${tier} ${p.face} ${p.n}`);
          if (p.face === "Jackpot") seen.add(p.n);
        } else if (p.kind !== "all") assert.deepEqual(p, b);
      });
      const all = a.slices.find((p) => p.kind === "all")!;
      if (all.kind === "all") assert.deepEqual(all.parts, a.slices.slice(0, 8));
    }
    assert.ok(seen.size > 3, `${tier} jitter varies`);
  }
});

test("0.1.97: the client rebuild from the server's roll matches the server's slices exactly", async () => {
  const { buildWheel } = await import("./wheel.ts");
  // Server: buildWheel(tier, city, roll) then sends { wheelWin, wheelRoll }. Client: buildWheel(tier, city, wheelRoll).
  for (const roll of [0, 0.123, 0.5, 0.987654, 0.999999]) {
    const server = buildWheel("amber", "austin", roll);
    const client = buildWheel("amber", "austin", JSON.parse(JSON.stringify({ roll })).roll);
    assert.deepEqual(client.slices, server.slices);
    assert.equal(client.win, server.win);
  }
});
