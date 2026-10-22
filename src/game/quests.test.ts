import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  claimErrand,
  errandDone,
  freshQuests,
  hydrateQuests,
  legacyOf,
  noteAnswer,
  noteClear,
  clothCoin,
  clothShelf,
  printPattern,
  rareExtra,
} from "./quests.ts";

describe("quests", () => {
  it("three clears in a row finish the errand; a miss resets it", () => {
    let q = freshQuests("austin");
    q = noteClear(noteAnswer(q, true, false), { cityId: "austin", poiId: "zilker", tier: "white" });
    q = noteClear(noteAnswer(q, true, false), { cityId: "austin", poiId: "zilker", tier: "blue" });
    assert.equal(errandDone(q.errand), false);
    q = noteAnswer(q, false, false);
    assert.equal(q.errand.kind === "row" && q.errand.n, 0);
    q = noteClear(noteAnswer(q, true, true), { cityId: "austin", poiId: "a", tier: "green" });
    q = noteClear(noteAnswer(q, true, false), { cityId: "austin", poiId: "b", tier: "green" });
    q = noteClear(noteAnswer(q, true, false), { cityId: "austin", poiId: "c", tier: "green" });
    const paid = claimErrand(q, "austin");
    assert.ok(paid);
    assert.equal(paid!.ingredient, "pecan");
    assert.equal(paid!.log.errand.kind, "ladder");
  });

  it("worn cloth pays only when it applies", () => {
    assert.equal(clothCoin("road-dust", "la", "white"), 20);
    assert.equal(clothCoin("red-book", "la", "red"), 80);
    assert.equal(clothCoin("red-book", "la", "blue"), 0);
    assert.equal(clothCoin("night-glass", "nyc", "violet"), 150);
    assert.equal(clothCoin("scarf-austin", "austin", "green"), 45);
    assert.equal(clothCoin("scarf-austin", "la", "green"), 0);
    assert.equal(clothCoin(null, "la", "red"), 0);
    const shelf = clothShelf({ ...freshQuests("la"), cloths: ["scarf-austin"] }, "la");
    // 0.1.22: scarves and the red book are legacy; the shelf lists them only when owned.
    assert.deepEqual(shelf, ["road-dust", "night-glass", "scarf-austin"]);
  });

  it("red can scrap and violet can drop a pattern", () => {
    assert.equal(rareExtra("red", 0.11), "scrap");
    assert.equal(rareExtra("red", 0.12), null);
    assert.equal(rareExtra("violet", 0.17), "pattern");
    assert.equal(rareExtra("green", 0), null);
  });

  it("an old save's milestones become a one-time legacy note (0.1.22)", () => {
    const raw = {
      errand: { kind: "row" as const, n: 1 },
      circuit: { austin: { red: true, ward: true, printed: false, claimed: false }, nyc: { red: true, ward: false }, la: { red: true, ward: true, claimed: true } },
      perfects: 40,
      bestRow: 3,
      reds: { austin: true as const },
      claimed: { walk: true as const },
      cloths: ["road-dust" as const],
      worn: "road-dust" as const,
      title: "Walker",
      patterns: 0,
    };
    const q = hydrateQuests(raw, "austin", ["lantern", "lucky"]);
    assert.deepEqual(q.legacy, { claimed: ["walk"], circuits: ["austin"], unfinished: true, charms: ["lantern", "lucky"] });
    assert.deepEqual(q.cloths, ["road-dust"]);
    assert.equal(q.title, "Walker");
    assert.equal("circuit" in q, false);
    // A save that already moved keeps legacy null.
    assert.equal(hydrateQuests({ ...q, legacy: null }, "austin", ["lantern"]).legacy, null);
    assert.equal(hydrateQuests(null, "austin").legacy, null);
    assert.equal(legacyOf({ circuit: {}, claimed: {}, perfects: 0 })?.unfinished, false);
  });

  it("night glass prints from a pattern plus press stock, or plus a schematic", () => {
    const q = { ...freshQuests("austin"), patterns: 1 };
    assert.equal(printPattern(q, { press: true, schematics: 0 })?.spend, "press");
    assert.equal(printPattern(q, { press: false, schematics: 1 })?.spend, "schematic");
    assert.equal(printPattern(q, { press: false, schematics: 0 }), null);
    assert.equal(printPattern(freshQuests("austin"), { press: true, schematics: 1 }), null);
  });
});
