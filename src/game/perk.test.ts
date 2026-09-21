import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SCOUTS, SCOUT_LIST, wornPerk } from "./data.ts";

describe("scout perks stay small and scale with the hire", () => {
  it("raccoon is the free coat with no extra", () => {
    const p = wornPerk("raccoon");
    assert.equal(SCOUTS.raccoon.coins, 0);
    assert.equal(p.vaultMs ?? 0, 0);
    assert.equal(p.loot ?? 1, 1);
    assert.equal(p.pace ?? 1, 1);
    assert.equal(p.reach ?? 1, 1);
  });

  it("lamp time never jumps more than a second", () => {
    for (const s of SCOUT_LIST) {
      assert.ok((s.perk.vaultMs ?? 0) <= 750, s.id);
    }
  });

  it("pace and coin extras stay around one percent", () => {
    for (const s of SCOUT_LIST) {
      assert.ok((s.perk.pace ?? 1) <= 1.02, s.id);
      assert.ok((s.perk.loot ?? 1) <= 1.02, s.id);
      assert.ok((s.perk.reach ?? 1) <= 1.06, s.id);
    }
  });

  it("the dearer coats carry the larger habits", () => {
    assert.ok((wornPerk("cat").vaultMs ?? 0) < (wornPerk("turtle").vaultMs ?? 0));
    assert.ok((wornPerk("turtle").vaultMs ?? 0) < (wornPerk("sloth").vaultMs ?? 0));
    assert.equal(wornPerk("corgi").pace, 1.01);
    assert.equal(wornPerk("fox").loot, 1.01);
    assert.ok(SCOUTS.fox.coins > SCOUTS.sloth.coins);
  });
});
