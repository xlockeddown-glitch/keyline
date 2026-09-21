import assert from "node:assert/strict";
import { test } from "node:test";
import { standingName } from "./standingName.ts";

test("first name plus last initial", () => {
  assert.equal(standingName("Ryan Gray"), "Ryan G.");
  assert.equal(standingName("mary ann smith"), "mary S.");
});

test("single-token and missing last name stay first token", () => {
  assert.equal(standingName("Ryan"), "Ryan");
  assert.equal(standingName("Madonna"), "Madonna");
  assert.equal(standingName("  Ada  "), "Ada");
});

test("empty and odd names fall back cleanly", () => {
  assert.equal(standingName(""), "Walker");
  assert.equal(standingName(null), "Walker");
  assert.equal(standingName("Ryan G."), "Ryan G.");
  assert.equal(standingName("Jean-Luc Picard"), "Jean-Luc P.");
});
