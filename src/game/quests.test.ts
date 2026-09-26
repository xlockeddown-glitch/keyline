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
    for (const id of ["temple", "nyc", "sf", "london", "chicago", "detroit", "tucson", "toronto", "la", "boston", "nola"] as const) {
      q = noteClear(q, { cityId: id, poiId: "x", tier: "red" });
    }
    const paid = claimLong(q, "redbook", 0);
    assert.equal(paid?.cloth, "red-book");
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
