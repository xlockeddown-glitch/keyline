import test from "node:test";
import assert from "node:assert/strict";
import { CLIMB_ID, SERIES, seriesOf } from "./data.ts";
import { PRIZE_COIN, PRIZE_ODDS, prizeTier, prizeValue } from "./ladderPrize.ts";
import { TIER_ORDER, TIER_VALUE } from "./rewards.ts";
import { emptyWallet, gradeGrant, type GradePay } from "./wallet.ts";
import { seriesPinHtml, pinTier } from "./pins.ts";

const KINDS = ["climb", "run", "stack"] as const;

test("0.1.36: prize odds sum to 100, reach every tier, and climb with the ladder", () => {
  for (const k of KINDS) {
    assert.equal(PRIZE_ODDS[k].reduce((a, b) => a + b, 0), 100, k);
    assert.equal(PRIZE_ODDS[k].length, TIER_ORDER.length);
    assert.ok(PRIZE_ODDS[k].every((p) => p > 0), `${k} can land any tier`);
  }
  assert.ok(prizeValue("climb") < prizeValue("run") && prizeValue("run") < prizeValue("stack"));
  assert.ok(PRIZE_COIN.climb < PRIZE_COIN.run && PRIZE_COIN.run < PRIZE_COIN.stack);
  // EV stays near the old fixed bonus (Run → amber, Stack → red).
  assert.ok(Math.abs(prizeValue("run") - TIER_VALUE.amber) / TIER_VALUE.amber < 0.1);
  assert.ok(Math.abs(prizeValue("stack") - TIER_VALUE.red) / TIER_VALUE.red < 0.15);
});

test("0.1.36: prizeTier maps rolls onto the odds table, clamping bad rolls", () => {
  assert.equal(prizeTier("run", 0), "white");
  assert.equal(prizeTier("run", 0.0999), "white");
  assert.equal(prizeTier("run", 0.1), "blue");
  assert.equal(prizeTier("run", 0.999), "violet");
  assert.equal(prizeTier("stack", 1), "violet");
  assert.equal(prizeTier("climb", -5), "white");
  assert.equal(prizeTier("climb", Number.NaN), "white");
  const n = 20000;
  const seen: Record<string, number> = {};
  for (let i = 0; i < n; i++) { const t = prizeTier("stack", (i + 0.5) / n); seen[t] = (seen[t] ?? 0) + 1; }
  TIER_ORDER.forEach((t, i) => assert.equal(Math.round((seen[t]! / n) * 100), PRIZE_ODDS.stack[i]));
});

test("0.1.36: The Climb is the white ladder", () => {
  const c = SERIES.climb;
  assert.equal(seriesOf(CLIMB_ID), c);
  assert.equal(c.cost, "white");
  assert.equal(c.pay, "blue");
  assert.equal(c.diffs.length, c.steps);
  assert.ok(c.coolMs < SERIES.run.coolMs);
  assert.equal(pinTier(seriesPinHtml(c)), "white");
  for (const k of KINDS) {
    const html = seriesPinHtml(SERIES[k]);
    assert.match(html, /is-ladder/);
    assert.equal((html.match(/lantern-frame/g) ?? []).length, 2, `${k} has two lanterns`);
    assert.match(html, /ladder-rail/);
  }
});

function last(kind: (typeof KINDS)[number], over: Partial<GradePay>): GradePay {
  const def = SERIES[kind];
  return {
    correct: true, elapsedMs: 2000, mult: 1, city: "austin", diff: 3, clearTier: def.cost, poiTier: def.cost, poiId: def.id,
    lat: 0, lng: 0, series: kind, step: def.steps - 1, steps: def.steps, prior: Array(def.steps - 1).fill("perfect"),
    streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], topic: null, dealtAt: Date.UTC(2026, 9, 24, 15),
    luckyHit: false, perfectBlue: false, ...over,
  };
}

test("0.1.36: a perfect ladder pays the server-rolled prize match and coin; a non-perfect one pays as before", () => {
  for (const k of KINDS) {
    const def = SERIES[k];
    const lo = gradeGrant(emptyWallet(), last(k, { prizeRoll: 0 }));
    const hi = gradeGrant(emptyWallet(), last(k, { prizeRoll: 0.9999 }));
    assert.equal(hi.award?.keys.violet, 1, `${k} top roll is violet`);
    assert.equal((hi.award!.coins) - (lo.award!.coins), 0, "coin bonus is flat, not tier-dependent");
    const plain = gradeGrant(emptyWallet(), last(k, { prior: Array(def.steps - 1).fill("great"), elapsedMs: 9000, prizeRoll: 0.9999 }));
    assert.equal(plain.award?.keys.violet ?? 0, 0, "non-perfect: no prize");
    assert.ok(!plain.award!.boosts.some((b) => b.startsWith("Perfect ladder")));
    assert.ok(hi.award!.boosts.some((b) => b === `Perfect ladder: violet match +${PRIZE_COIN[k]}`));
    // Non-perfect keeps the old shape: pay match (+ cost refund), nothing else.
    const keys = Object.entries(plain.award!.keys).filter(([, n]) => n);
    const want: Record<string, number> = { [def.pay]: 1 };
    want[def.cost] = (want[def.cost] ?? 0) + 1;
    assert.deepEqual(Object.fromEntries(keys), want);
  }
});
