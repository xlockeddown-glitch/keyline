import assert from "node:assert/strict";
import { test } from "node:test";
import { PAINT_COLORS, PAINT_DROP_IN, ULTRA_DROP_IN, VAULT_PAINTS, isPaintId, paintFoundLine, rollPaint, rollUltraPaint, rollVaultPaints } from "./ingredients.ts";
import { EMPTY_PAINT, PAINT_USE, cleanPaint, mixPaint, visibleCoat, visibleLantern, wearPaint } from "./paint.ts";

test("rarer paint drops much less often, and a miss drops nothing", () => {
  assert.deepEqual(
    VAULT_PAINTS.map((c) => PAINT_DROP_IN[c]),
    [2, 5, 15, 45, 150, 500],
  );
  for (const color of VAULT_PAINTS) {
    assert.equal(rollPaint(color, 0), `paint-${color}`);
    assert.equal(rollPaint(color, 1 / PAINT_DROP_IN[color]), null);
    assert.equal(rollPaint(color, 0.999), null);
  }
  assert.equal(paintFoundLine("paint-white"), "White paint.");
  assert.equal(paintFoundLine("paint-amber"), "Amber paint.");
  assert.equal(paintFoundLine("paint-red"), "Red paint. Rare.");
  assert.equal(paintFoundLine("paint-violet"), "Violet paint. Rare.");
  assert.equal(isPaintId("paint-red"), true);
  assert.equal(isPaintId("paint-prism"), true);
  assert.equal(isPaintId("pecan"), false);
  const samples = 4000;
  const rate = (color: (typeof VAULT_PAINTS)[number]) => {
    let hit = 0;
    for (let i = 0; i < samples; i++) if (rollPaint(color, i / samples)) hit++;
    return hit / samples;
  };
  const rates = VAULT_PAINTS.map(rate);
  for (let i = 1; i < rates.length; i++) assert.ok(rates[i]! < rates[i - 1]! / 1.5, `${VAULT_PAINTS[i]} should be much rarer than ${VAULT_PAINTS[i - 1]}`);
  assert.ok(Math.abs(rates[0]! - 0.5) < 0.02);
  assert.ok(rates[3]! <= 1 / 40, "amber is a real find");
  assert.ok(rates[4]! <= 1 / 120, "red is much rarer than amber");
  assert.ok(rates[5]! <= 1 / 400, "violet is much rarer than red");
});

test("prism can drop from any colour, and almost never does", () => {
  assert.equal(ULTRA_DROP_IN, 10_000);
  assert.ok(ULTRA_DROP_IN > PAINT_DROP_IN.violet * 10, "prism is much rarer than a violet can");
  assert.equal(rollUltraPaint(0), "paint-prism");
  assert.equal(rollUltraPaint(1 / ULTRA_DROP_IN), null);
  assert.equal(rollUltraPaint(0.5), null);
  assert.deepEqual(rollVaultPaints("white", 0, 0), ["paint-white", "paint-prism"]);
  assert.deepEqual(rollVaultPaints("violet", 0.999, 0), ["paint-prism"]);
  assert.deepEqual(rollVaultPaints("blue", 0, 0.5), ["paint-blue"]);
  assert.deepEqual(rollVaultPaints("red", 0.999, 0.5), []);
  assert.equal(paintFoundLine("paint-prism"), "Prism paint. Ultra rare.");
  assert.ok(PAINT_COLORS.includes("prism"));
  const samples = ULTRA_DROP_IN * 2;
  let hit = 0;
  for (let i = 0; i < samples; i++) if (rollUltraPaint(i / samples)) hit++;
  assert.equal(hit, 2);
});

test("each colour takes its own number, and a short can doesn't mix", () => {
  assert.deepEqual(
    (Object.keys(PAINT_USE) as (keyof typeof PAINT_USE)[]).map((c) => [c, PAINT_USE[c].coat, PAINT_USE[c].vault]),
    [
      ["white", 3, 4],
      ["blue", 4, 5],
      ["green", 5, 6],
      ["amber", 6, 8],
      ["red", 8, 10],
      ["violet", 10, 12],
      ["prism", 1, 2],
    ],
  );
  assert.equal(mixPaint(EMPTY_PAINT, { "paint-red": 7 }, "red", "coat"), null);
  const mixed = mixPaint(EMPTY_PAINT, { "paint-red": 8, pecan: 2 }, "red", "coat");
  assert.ok(mixed);
  assert.equal(mixed!.spent, 8);
  assert.equal(mixed!.pantry["paint-red"], 0);
  assert.equal(mixed!.pantry.pecan, 2);
  assert.deepEqual(mixed!.bench.coats, ["red"]);
  assert.equal(mixed!.bench.wornCoat, "red");
  assert.equal(mixPaint(mixed!.bench, mixed!.pantry, "red", "coat"), null, "already mixed");
});

test("vault paint is a separate job, and wearing it doesn't spend again", () => {
  const mixed = mixPaint(EMPTY_PAINT, { "paint-amber": 8 }, "amber", "vault")!;
  assert.deepEqual(mixed.bench.vaults, ["amber"]);
  assert.equal(mixed.bench.wornVault, "amber");
  assert.equal(mixed.pantry["paint-amber"], 0);
  const off = wearPaint(mixed.bench, "vault", null);
  assert.equal(off!.wornVault, null);
  const on = wearPaint(off!, "vault", "amber");
  assert.equal(on!.wornVault, "amber");
  assert.equal(wearPaint(on!, "vault", "red"), null, "red vaults were never mixed");
  assert.equal(visibleLantern("amber", "copper"), "paint-amber");
  assert.equal(visibleLantern(null, "copper"), "copper");
  assert.equal(visibleCoat("red", "oilskin"), "dye-red");
  assert.equal(visibleCoat(null, "oilskin"), "oilskin");
  const prism = mixPaint(EMPTY_PAINT, { "paint-prism": 1 }, "prism", "coat");
  assert.equal(prism!.spent, 1);
  assert.equal(prism!.pantry["paint-prism"], 0);
  assert.equal(prism!.bench.wornCoat, "prism");
  assert.equal(visibleCoat("prism", "oilskin"), "dye-prism");
  assert.equal(mixPaint(EMPTY_PAINT, { "paint-prism": 1 }, "prism", "vault"), null, "street paint takes two");
  const street = mixPaint(EMPTY_PAINT, { "paint-prism": 2 }, "prism", "vault")!;
  assert.equal(street.bench.wornVault, "prism");
  assert.equal(visibleLantern("prism", "iron"), "paint-prism");
});

test("a bad save can't wear paint that was never mixed", () => {
  const bench = cleanPaint({ coats: ["red", "nope"], vaults: [], wornCoat: "blue", wornVault: "violet" });
  assert.deepEqual(bench.coats, ["red"]);
  assert.equal(bench.wornCoat, null);
  assert.equal(bench.wornVault, null);
});
