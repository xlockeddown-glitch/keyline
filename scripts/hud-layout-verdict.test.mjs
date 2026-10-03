import { test } from "node:test";
import assert from "node:assert/strict";
import { hudLayoutProblems, MIN_SIGHT_WIDTH, MIN_STATUS_WIDTH, sightProblems } from "./hud-layout-verdict.mjs";

const kitsRow = (left, top, n = 6, size = 40, gap = 6) =>
  Array.from({ length: n }, (_, i) => ({ left: left + i * (size + gap), top, width: size, height: size }));

test("0.0.46 phone layout fails: plate squeezed to 30 px beside the button row", () => {
  const m = { width: 390, height: 844, status: { left: 60, top: 12, width: 30, height: 192 }, kits: kitsRow(98, 12, 6, 44, 8), zoom: { left: 12, top: 12, width: 34, height: 66 }, overflowX: false };
  const p = hudLayoutProblems(m);
  assert.ok(p.some((s) => s.includes("30 px wide")), p.join("\n"));
});

test("0.0.47 phone layout passes: buttons on top, plate stacked at full width", () => {
  const m = { width: 390, height: 844, status: { left: 60, top: 60, width: 318, height: 145 }, kits: kitsRow(102, 12), zoom: { left: 12, top: 12, width: 34, height: 66 }, overflowX: false };
  assert.deepEqual(hudLayoutProblems(m), []);
});

test("buttons covering the plate, off-screen buttons and sideways scroll are caught", () => {
  const m = { width: 360, height: 800, status: { left: 60, top: 12, width: 288, height: 145 }, kits: kitsRow(330, 12, 2), zoom: null, overflowX: true };
  const p = hudLayoutProblems(m);
  assert.ok(p.some((s) => s.includes("covers the status plate")));
  assert.ok(p.some((s) => s.includes("off screen")));
  assert.ok(p.some((s) => s.includes("sideways")));
});

test("desktop keeps the plate beside the button row", () => {
  const status = { left: 64, top: 16, width: 330, height: 149 };
  const side = { width: 1280, height: 800, status, kits: kitsRow(800, 16), zoom: null, overflowX: false };
  assert.deepEqual(hudLayoutProblems(side, { desktop: true }), []);
  const centred = { ...side, row: { left: 800, top: 16, width: 300, height: 50 }, kits: kitsRow(800, 19) };
  assert.deepEqual(hudLayoutProblems(centred, { desktop: true }), []);
  const stacked = { ...side, kits: kitsRow(800, 16), status: { ...status, top: 64 } };
  assert.ok(hudLayoutProblems(stacked, { desktop: true }).some((s) => s.includes("beside")));
});

test("a missing plate is a problem; the floor is 200 px", () => {
  assert.equal(MIN_STATUS_WIDTH, 200);
  assert.ok(hudLayoutProblems({ width: 390, height: 844, status: null, kits: [], zoom: null, overflowX: false })[0].includes("no HUD"));
});

const phone = { width: 390, height: 844, status: { left: 60, top: 60, width: 318, height: 145 }, kits: kitsRow(102, 12), zoom: { left: 12, top: 12, width: 34, height: 66 }, overflowX: false };

test("0.0.47 lamp card fails at 390x844: 'Campus Martius Park' card runs off the right edge, E button pushed off", () => {
  // Measured on k47a: belt column 152 px, card grew to its one-line name width.
  const m = { ...phone, sight: { left: 184, top: 744, width: 268, height: 88 }, sightName: { left: 194, top: 770, width: 248, height: 25 }, act: { left: 460, top: 780, width: 52, height: 52 } };
  const p = hudLayoutProblems(m);
  assert.ok(p.some((s) => s.includes("lamp card runs off the right edge")), p.join("\n"));
  assert.ok(p.some((s) => s.includes("E button is off screen")), p.join("\n"));
});

test("0.0.48 lamp card passes: shrinks between the belt and the E button, name wraps inside", () => {
  const m = { ...phone, sight: { left: 184, top: 744, width: 134, height: 88 }, sightName: { left: 194, top: 762, width: 114, height: 44 }, act: { left: 326, top: 780, width: 52, height: 52 } };
  assert.deepEqual(hudLayoutProblems(m), []);
});

test("lamp card checks: missing card, squeezed card, name spilling out, unmeasured skips", () => {
  assert.deepEqual(sightProblems({ width: 390, height: 844, sight: null }), ["390x844: no lamp card"]);
  const thin = sightProblems({ width: 360, height: 800, sight: { left: 200, top: 700, width: MIN_SIGHT_WIDTH - 20, height: 80 }, sightName: { left: 210, top: 710, width: 160, height: 20 } });
  assert.ok(thin.some((s) => s.includes("squeezed")));
  assert.ok(thin.some((s) => s.includes("spills out")));
  assert.deepEqual(sightProblems({ width: 390, height: 844 }), []);
});
