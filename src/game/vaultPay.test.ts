import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PAINT_DROP_IN, ULTRA_DROP_IN } from "./ingredients.ts";
import { TIER_ORDER, TIER_VALUE, rewardPoints } from "./rewards.ts";
import { formatCool, lampCoolMs } from "./ticket.ts";
import {
  LUCKY_MATCH_CHANCE,
  PAY_NOTES,
  PERFECT_BLUE_CHANCE,
  SCHEMATIC_CHANCE,
  VELLUM_CHANCE,
  lampBrass,
  lampCoinBand,
  lampExtra,
  lampPayRows,
  lampSchematicHits,
  lampStock,
  paintFromClears,
  paintOddsLine,
  perfectIsFace,
} from "./vaultPay.ts";

test("a perfect ordinary clear is the face value; a slow one is 40%", () => {
  for (const tier of TIER_ORDER) {
    assert.equal(perfectIsFace(tier), true);
    assert.equal(lampCoinBand(tier).slow, rewardPoints(tier, { mult: 0.4, bonus: 1, diffMult: 1 }));
    assert.equal(lampCoinBand(tier).perfect, TIER_VALUE[tier]);
  }
  assert.deepEqual(
    TIER_ORDER.map((t) => lampCoinBand(t).slow),
    [12, 36, 108, 324, 972, 2916],
  );
});

test("paint odds are the drop table, and prism is not a colour row", () => {
  assert.equal(paintOddsLine("white"), "1 in 2");
  assert.equal(paintOddsLine("violet"), "1 in 80");
  assert.equal(PAINT_DROP_IN.red, 40);
  assert.ok(PAY_NOTES.some((n) => n.includes(`1 in ${ULTRA_DROP_IN.toLocaleString()}`)));
  assert.equal(lampPayRows().find((r) => r.tier === "amber")!.paintIn, 20);
});

test("brass, schematic, and stock match the lamp", () => {
  assert.equal(lampBrass("white", 2), 1);
  assert.equal(lampBrass("white", 3), 3);
  assert.equal(lampBrass("green", 2), 3);
  assert.equal(lampBrass("amber", 3), 5);
  assert.equal(lampBrass("red", 2), 5);
  assert.equal(lampBrass("red", 3), 7);
  assert.equal(lampBrass("violet", 2), 1);
  assert.equal(lampSchematicHits("white", 0), false);
  assert.equal(lampSchematicHits("blue", SCHEMATIC_CHANCE - 0.0001), true);
  assert.equal(lampSchematicHits("green", SCHEMATIC_CHANCE), false);
  assert.equal(lampSchematicHits("violet", 0.99), true);
  assert.equal(lampStock("blue"), "none");
  assert.equal(lampStock("green"), "city");
  assert.equal(lampStock("amber"), "ward");
  assert.match(lampExtra("red"), /Brass 5–7/);
  // 0.1.22: schematics no longer drop, so the lamp guide no longer lists them.
  assert.doesNotMatch(lampExtra("red"), /schematic/);
  assert.doesNotMatch(lampExtra("blue"), /schematic/);
  assert.equal(SCHEMATIC_CHANCE, 0.08);
});

test("the coin bars climb, and white starts at the left", () => {
  const rows = lampPayRows();
  assert.equal(rows[0]!.barStart, 0);
  assert.ok(rows[0]!.barStart < rows[5]!.barStart);
  assert.ok(rows[5]!.barStart + rows[5]!.barWidth > 99);
  assert.equal(rows[0]!.recast, formatCool(lampCoolMs("white")));
  assert.equal(rows[5]!.recast, "6 hr");
});

test("the ordinary band is a standard question, and the notes match easy and hard", () => {
  const meta = readFileSync(new URL("./triviaMeta.ts", import.meta.url), "utf8");
  const block = meta.slice(meta.indexOf("export const DIFF_MULT"), meta.indexOf("export const ASKED_KEEP"));
  assert.match(block, /1:\s*0\.7/);
  assert.match(block, /2:\s*1\b/);
  assert.match(block, /3:\s*1\.45/);
  assert.ok(PAY_NOTES.some((n) => n.includes("70%")));
  assert.ok(PAY_NOTES.some((n) => n.includes("45%")));
});

test("a player's clears turn into an honest paint expectation", () => {
  assert.equal(paintFromClears(0, 2), null);
  assert.equal(paintFromClears(298, 2), "You've lit 298 · that's about 149 cans of paint");
  assert.equal(paintFromClears(68, 15), "You've lit 68 · that's about 4.5 cans of paint");
  assert.equal(paintFromClears(16, 45), "You've lit 16 · so far, about a 1 in 3 chance of a can");
  assert.equal(paintFromClears(4, 150), "You've lit 4 · so far, about a 1 in 38 chance of a can");
  assert.equal(paintFromClears(1, 500), "You've lit 1 · so far, about a 1 in 500 chance of a can");
});

test("match and vellum notes stay tied to the roll", () => {
  assert.equal(PERFECT_BLUE_CHANCE, 0.1);
  assert.ok(Math.abs(1 / LUCKY_MATCH_CHANCE - 6.67) < 0.1);
  assert.equal(VELLUM_CHANCE, 0.4);
  assert.ok(PAY_NOTES.some((n) => n.includes("1 in 10")));
  assert.ok(PAY_NOTES.some((n) => n.includes("about 1 in 7")));
  assert.ok(PAY_NOTES.some((n) => n.includes("2 in 5")));
});
