import test from "node:test";
import assert from "node:assert/strict";
import { overlayBusy, type OverlayState } from "./overlayGate.ts";

const clear: OverlayState = { tutorial: 4, openVault: null, hqOpen: false, invOpen: false, shopOpen: false, guideOpen: false, errandOpen: null, blitzOpen: false, cratePop: null, blitzOffer: false };

test("pops wait for the How to Play card, any modal, and the daily card", () => {
  assert.equal(overlayBusy(clear), false);
  assert.equal(overlayBusy({ ...clear, tutorial: 0 }), true);
  assert.equal(overlayBusy({ ...clear, tutorial: 2 }), true);
  assert.equal(overlayBusy({ ...clear, tutorial: 3 }), false, "0.0.99: Next on the last card leaves 3 = done");
  for (const k of ["hqOpen", "invOpen", "shopOpen", "guideOpen", "blitzOpen", "blitzOffer"] as const) assert.equal(overlayBusy({ ...clear, [k]: true }), true, k);
  assert.equal(overlayBusy({ ...clear, openVault: { poiId: "x" } }), true);
  assert.equal(overlayBusy({ ...clear, errandOpen: "board" }), true);
  assert.equal(overlayBusy({ ...clear, cratePop: { day: 1, line: "" } }), true);
});

test("0.0.99: the daily card blocks only while it is really shown (it hides behind pending loot)", () => {
  assert.equal(overlayBusy({ ...clear, blitzOffer: true, loot: { points: 5 } }), false, "loot first, then the card");
  assert.equal(overlayBusy({ ...clear, blitzOffer: true }), true, "card on screen: a match pop waits");
  assert.equal(overlayBusy({ ...clear, cratePop: { day: 1, line: "" }, journey: { to: "x" } }), false, "riding: the card is hidden");
});
