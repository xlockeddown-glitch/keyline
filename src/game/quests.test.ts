import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  claimCircuit,
  claimErrand,
  claimLong,
  errandDone,
  freshQuests,
  noteAnswer,
  noteClear,
  notePrint,
  clothCoin,
  clothShelf,
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

  it("a red and a named ward arm the city circuit", () => {
    let q = freshQuests("austin");
    q = noteClear(q, { cityId: "austin", poiId: "tx-capitol", tier: "red" });
    q = notePrint(q, "austin");
    assert.equal(claimCircuit(q, "austin", 2, 1), null);
    const paid = claimCircuit(q, "austin", 3, 1);
    assert.equal(paid?.cloth, "scarf-austin");
  });

  it("london treats an amber clear as the ward step", () => {
    let q = freshQuests("london");
    q = noteClear(q, { cityId: "london", poiId: "big-ben", tier: "red" });
    q = noteClear(q, { cityId: "london", poiId: "bridge", tier: "amber" });
    assert.ok(claimCircuit(q, "london", 3, 1));
  });

  it("the red book needs every city", () => {
    let q = freshQuests("austin");
    q = noteClear(q, { cityId: "austin", poiId: "tx-capitol", tier: "red" });
    assert.equal(claimLong(q, "redbook", 0), null);
    for (const id of ["temple", "nyc", "sf", "london", "chicago", "detroit", "tucson", "toronto", "la", "boston", "nola", "seattle", "denver", "nashville"] as const) {
      q = noteClear(q, { cityId: id, poiId: "x", tier: "red" });
    }
    const paid = claimLong(q, "redbook", 0);
    assert.equal(paid?.cloth, "red-book");
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
    assert.deepEqual(shelf, ["road-dust", "scarf-la", "scarf-austin", "red-book", "night-glass"]);
  });

  it("red can scrap and violet can drop a pattern", () => {
    assert.equal(rareExtra("red", 0.11), "scrap");
    assert.equal(rareExtra("red", 0.12), null);
    assert.equal(rareExtra("violet", 0.17), "pattern");
    assert.equal(rareExtra("green", 0), null);
  });

  it("ten perfects in a row pay a schematic once", () => {
    let q = freshQuests("temple");
    for (let i = 0; i < 10; i++) q = noteAnswer(q, true, true);
    const paid = claimLong(q, "unbroken", 0);
    assert.equal(paid?.schematic, true);
    assert.equal(claimLong(paid!.log, "unbroken", 0), null);
  });
});
