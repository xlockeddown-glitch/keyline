import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SCOUTS, SCOUT_LIST, SUPER_LEGENDARY_LABEL, SUPER_LEGENDARY_MULT, superLegendaryCost, wornPerk } from "./data.ts";
import { canCutBuildings } from "./streets.ts";

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

  it("Super Legendary hire is three times the Fox and still cannot cut", () => {
    assert.equal(SUPER_LEGENDARY_LABEL, "Super Legendary");
    assert.equal(SUPER_LEGENDARY_MULT, 3);
    assert.equal(superLegendaryCost(), SCOUTS.fox.coins * 3);
    assert.equal(superLegendaryCost(), 264000);
    assert.ok(!("super-legendary" in SCOUTS));
    assert.equal(canCutBuildings("fox"), false);
    assert.equal(canCutBuildings("super-legendary"), false);
  });
});
