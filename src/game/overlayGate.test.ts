import test from "node:test";
import assert from "node:assert/strict";
import { overlayBusy, type OverlayState } from "./overlayGate.ts";

const clear: OverlayState = { tutorial: 4, openVault: null, hqOpen: false, invOpen: false, shopOpen: false, guideOpen: false, errandOpen: null, blitzOpen: false, cratePop: null, blitzOffer: false };

test("pops wait for the How to Play card, any modal, and the daily card", () => {
  assert.equal(overlayBusy(clear), false);
  assert.equal(overlayBusy({ ...clear, tutorial: 0 }), true);
  assert.equal(overlayBusy({ ...clear, tutorial: 3 }), true);
  for (const k of ["hqOpen", "invOpen", "shopOpen", "guideOpen", "blitzOpen", "blitzOffer"] as const) assert.equal(overlayBusy({ ...clear, [k]: true }), true, k);
  assert.equal(overlayBusy({ ...clear, openVault: { poiId: "x" } }), true);
  assert.equal(overlayBusy({ ...clear, errandOpen: "board" }), true);
  assert.equal(overlayBusy({ ...clear, cratePop: { day: 1, line: "" } }), true);
});
