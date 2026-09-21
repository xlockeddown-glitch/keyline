import assert from "node:assert/strict";
import { test } from "node:test";
import { PULSE_POINTS, pulseDue } from "./pulse.ts";

test("City Pulse is due until claimed today", () => {
  assert.equal(pulseDue("", "2026-09-21"), true);
  assert.equal(pulseDue("2026-09-20", "2026-09-21"), true);
  assert.equal(pulseDue("2026-09-21", "2026-09-21"), false);
});

test("a new calendar day resets the pulse", () => {
  assert.equal(pulseDue("2026-09-21", "2026-09-22"), true);
});

test("pulse pays coin, not crate matches", () => {
  assert.equal(PULSE_POINTS, 80);
});
