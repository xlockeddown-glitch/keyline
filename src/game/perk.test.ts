import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SCOUTS,
  SCOUT_LIST,
  SUPER_LEGENDARY_ID,
  SUPER_LEGENDARY_LABEL,
  SUPER_LEGENDARY_MULT,
  superLegendaryCost,
  wornPerk,
  walkSpeed,
  WALK_PACE,
  MAX_PACE,
} from "./data.ts";
import { dailyTopSpeed } from "./dailyRun.ts";
import { clampLoot } from "./wallet.ts";
import { WINDOW_MAX_MS } from "./triviaService.ts";
import { canCutBuildings } from "./streets.ts";

describe("0.0.96 scout abilities (data.ts SCOUTS)", () => {
  it("prices: new hires cost the new amounts; Penguin stays the top price", () => {
    assert.equal(SCOUTS.raccoon.coins, 0);
    assert.equal(SCOUTS.cat.coins, 8000);
    assert.equal(SCOUTS.corgi.coins, 12000);
    assert.equal(SCOUTS.owl.coins, 18000);
    assert.equal(SCOUTS.turtle.coins, 24000);
    assert.equal(SCOUTS.sloth.coins, 20000);
    assert.equal(SCOUTS.giraffe.coins, 45000);
    assert.equal(SCOUTS.fox.coins, 90000);
    for (const s of SCOUT_LIST) if (s.id !== "lynx") assert.ok(SCOUTS.lynx.coins > s.coins, s.id);
  });

  it("short punchy shop names", () => {
    const names = { raccoon: "Rummager", cat: "Nine lives", corgi: "Zoomies", owl: "Night eyes", turtle: "Shell", sloth: "Hang time", giraffe: "Long neck", fox: "Clever", lynx: "Belly slide" } as const;
    for (const [id, n] of Object.entries(names)) assert.equal(wornPerk(id as keyof typeof names).label.split(" · ")[0], n, id);
  });

  it("each coat carries its ability", () => {
    assert.equal(wornPerk("raccoon").rummage, 15);
    assert.equal(wornPerk("cat").shield, true);
    assert.equal(wornPerk("cat").vaultMs, 1000);
    assert.equal(wornPerk("corgi").pace, 1.15);
    assert.equal(wornPerk("owl").market, 2.5);
    assert.equal(wornPerk("owl").cacheAnywhere, true);
    assert.equal(wornPerk("turtle").shellBack, 3);
    assert.equal(wornPerk("sloth").vaultMs, 4000);
    assert.equal(wornPerk("sloth").pace, 0.9);
    assert.equal(wornPerk("giraffe").reach, 2);
    assert.equal(wornPerk("giraffe").sight, 1.2);
    assert.equal(wornPerk("fox").loot, 1.1);
    assert.equal(wornPerk("fox").strike, true);
    assert.equal(wornPerk("lynx").pace, 1.2);
    assert.equal(wornPerk("lynx").loot, 1.1);
    assert.equal(walkSpeed("corgi"), WALK_PACE * 1.15);
    assert.equal(walkSpeed("sloth"), WALK_PACE * 0.9);
    assert.equal(walkSpeed("lynx"), WALK_PACE * 1.2);
    assert.equal(walkSpeed("raccoon"), WALK_PACE);
    for (const s of SCOUT_LIST) assert.ok((s.perk.pace ?? 1) <= MAX_PACE, s.id);
  });

  it("server ceilings let every coat through", () => {
    assert.equal(dailyTopSpeed(), WALK_PACE * MAX_PACE);
    assert.equal(clampLoot(1.1), 1.1);
    assert.equal(clampLoot(1.01), 1.01);
    assert.equal(clampLoot(5), 1);
    // Lamp window: base 25 s + scholar 3 s + press pass 5 s + the biggest coat time fits under the server cap.
    const most = Math.max(...SCOUT_LIST.map((s) => s.perk.vaultMs ?? 0));
    assert.ok(25000 + 3000 + 5000 + most <= WINDOW_MAX_MS);
  });

  it("Super Legendary hire is ten times the Fox and can cut", () => {
    assert.equal(SUPER_LEGENDARY_LABEL, "Super Legendary");
    assert.equal(SUPER_LEGENDARY_MULT, 10);
    assert.notEqual(SUPER_LEGENDARY_MULT, 3);
    assert.equal(SUPER_LEGENDARY_ID, "lynx");
    assert.equal(superLegendaryCost(), SCOUTS.fox.coins * 10);
    assert.equal(superLegendaryCost(), 900000);
    assert.notEqual(superLegendaryCost(), SCOUTS.fox.coins * 3);
    assert.equal(SCOUTS.fox.coins, 90000);
    assert.equal(SCOUTS.lynx.coins, superLegendaryCost());
    assert.equal(SCOUTS.lynx.coins, SCOUTS.fox.coins * SUPER_LEGENDARY_MULT);
    assert.ok(SCOUT_LIST.some((s) => s.id === SUPER_LEGENDARY_ID));
    assert.equal(canCutBuildings("fox"), false);
    assert.equal(canCutBuildings("raccoon"), false);
    assert.equal(canCutBuildings(SUPER_LEGENDARY_ID), true);
    assert.equal(canCutBuildings("lynx"), true);
    for (const s of SCOUT_LIST) {
      assert.equal(canCutBuildings(s.id), s.id === SUPER_LEGENDARY_ID, s.id);
    }
  });
});
