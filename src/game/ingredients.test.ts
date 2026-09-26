import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cityStaple, rollIngredient, spendIngredient } from "./ingredients.ts";

describe("vault ingredients", () => {
  it("white and blue pay no press stock", () => {
    assert.equal(rollIngredient("austin", { id: "tx-capitol", tier: "white" }), null);
    assert.equal(rollIngredient("austin", { id: "tx-capitol", tier: "blue" }), null);
  });

  it("green vaults drop the city staple", () => {
    assert.equal(rollIngredient("nyc", { id: "nyse", tier: "green" }), "newsprint");
    assert.equal(rollIngredient("temple", { id: "miller-springs", tier: "green" }), "cotton");
  });

  it("amber and up at a named ward drop that ward's cut", () => {
    assert.equal(rollIngredient("austin", { id: "tx-capitol", tier: "amber" }), "granite");
    assert.equal(rollIngredient("austin", { id: "tx-capitol", tier: "violet" }), "granite");
    assert.equal(rollIngredient("sf", { id: "ferry-bldg", tier: "red" }), "salt");
  });

  it("a plain green-or-higher lamp stays on the city staple", () => {
    assert.equal(rollIngredient("london", { id: "somewhere", tier: "red" }), cityStaple("london"));
  });

  it("print spends the city staple, then a ward cut", () => {
    assert.equal(spendIngredient("austin", {}), null);
    assert.equal(spendIngredient("austin", { pecan: 1, granite: 2 }), "pecan");
    assert.equal(spendIngredient("austin", { granite: 1 }), "granite");
    assert.equal(spendIngredient("nyc", { granite: 4 }), null);
  });
});
