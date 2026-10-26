import assert from "node:assert/strict";
import { it } from "node:test";
import { cacheAnywhere, doubleUpHit, marketCoinMult, owlExtraCoin, reachMult, rummageHit, scoutOf, shellBackHit, strikeOption, streakRun } from "./scoutPerks.ts";
import { canGrabMatch, MATCH_GRAB_M } from "./streets.ts";

it("Raccoon: 1 in 15 lamps (server roll), nobody else", () => {
  assert.equal(rummageHit("raccoon", 0.06), true);
  assert.equal(rummageHit("raccoon", 0.07), false);
  assert.equal(rummageHit("fox", 0.0), false);
  assert.equal(rummageHit(null, 0.0), false);
});

it("Plate: 1 in 3 failed lamps refund", () => {
  assert.equal(shellBackHit("turtle", 0.33), true);
  assert.equal(shellBackHit("turtle", 0.34), false);
  assert.equal(shellBackHit("cat", 0), false);
});

it("Owl: market coin ×2.5 instead of ×2; off-market unchanged", () => {
  assert.equal(marketCoinMult("owl", 2), 2.5);
  assert.equal(marketCoinMult("owl", 1), 1);
  assert.equal(marketCoinMult("raccoon", 2), 2);
  assert.equal(owlExtraCoin("owl", 2, 100), 50);
  assert.equal(owlExtraCoin("fox", 2, 100), 0);
  assert.equal(cacheAnywhere("owl"), true);
  assert.equal(cacheAnywhere("raccoon"), false);
});

it("Fox: strikes a wrong option on red/violet only, never the answer", () => {
  const ch = ["a", "b", "c", "d"];
  for (let r = 0; r < 1; r += 0.05) {
    const s = strikeOption("fox", "red", ch, "c", r);
    assert.ok(s && s !== "c" && ch.includes(s));
  }
  assert.ok(strikeOption("fox", "violet", ch, "a", 0.99));
  assert.equal(strikeOption("fox", "amber", ch, "a", 0.5), null);
  assert.equal(strikeOption("lynx", "red", ch, "a", 0.5), null);
});

it("Tabby: the first miss of a day is forgiven, a second breaks", () => {
  const rows = [
    { miss: false, day: "d2" },
    { miss: true, day: "d2" },
    { miss: false, day: "d2" },
    { miss: false, day: "d1" },
    { miss: true, day: "d1" },
    { miss: true, day: "d1" },
  ];
  assert.equal(streakRun(rows, false), 1);
  // d2's only miss is forgiven; d1's newer miss is its second of the day, so it breaks.
  assert.equal(streakRun(rows, true), 3);
});

it("Giraffe: twice the reach for matches", () => {
  assert.equal(reachMult("giraffe"), 2);
  assert.equal(reachMult("raccoon"), 1);
  const w = { lat: 30.26, lng: -97.74 };
  const far = { lat: 30.26 + (MATCH_GRAB_M * 1.6) / 111_320, lng: -97.74 };
  assert.equal(canGrabMatch(null, w, far, 1), false);
  assert.equal(canGrabMatch(null, w, far, reachMult("giraffe")), true);
});

it("scoutOf rejects junk", () => {
  assert.equal(scoutOf("owl"), "owl");
  assert.equal(scoutOf("dragon"), null);
  assert.equal(scoutOf(3), null);
});

it("Panda: 1 in 15 right lamps pay double coin (server roll), nobody else", () => {
  assert.equal(doubleUpHit("panda", 0.06), true);
  assert.equal(doubleUpHit("panda", 0.07), false);
  assert.equal(doubleUpHit("raccoon", 0), false);
  assert.equal(doubleUpHit(null, 0), false);
});
