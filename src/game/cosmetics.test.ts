import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CATALOGUE,
  COATS,
  EMPTY_WARDROBE,
  LANTERN_SKINS,
  cleanWardrobe,
  mergeWardrobe,
  owing,
  payIn,
  priceCoin,
  wear,
  type Wardrobe,
} from "./cosmetics.ts";
import { TIER_VALUE } from "./rewards.ts";
import { crateLoot } from "./crate.ts";
import type { Tier } from "./types";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const pocket = (white: number, blue: number): Record<Tier, number> => ({ white, blue, green: 0, amber: 0, red: 0, violet: 0 });
const W = (over: Partial<Wardrobe> = {}): Wardrobe => ({ ...EMPTY_WARDROBE, paid: {}, ...over });

test("catalogue: four coats, four lantern skins, priced in white and blue only, on the locked ladder", () => {
  assert.equal(Object.keys(COATS).length, 4);
  assert.equal(Object.keys(LANTERN_SKINS).length, 4);
  assert.equal(TIER_VALUE.white, 30);
  assert.equal(TIER_VALUE.blue, 90);
  for (const c of CATALOGUE) {
    assert.deepEqual(Object.keys(c.price).sort(), ["blue", "white"]);
    assert.ok(c.price.white + c.price.blue > 0, c.id);
    assert.equal(priceCoin(c.price), c.price.white * TIER_VALUE.white + c.price.blue * TIER_VALUE.blue);
  }
  // Each slot climbs: cheapest first, and coats (a whole figure) cost more than the matching lantern skin.
  const lamps = CATALOGUE.filter((c) => c.slot === "lantern").map((c) => priceCoin(c.price));
  const coats = CATALOGUE.filter((c) => c.slot === "coat").map((c) => priceCoin(c.price));
  assert.deepEqual(lamps, [...lamps].sort((a, b) => a - b));
  assert.deepEqual(coats, [...coats].sort((a, b) => a - b));
  lamps.forEach((v, i) => assert.ok(coats[i]! > v, `coat ${i} dearer than lamp ${i}`));
});

test("pricing: the first item is a couple of daily crates away; the whole catalogue is a long sink", () => {
  const cheapest = CATALOGUE.reduce((a, b) => (priceCoin(a.price) <= priceCoin(b.price) ? a : b));
  assert.equal(cheapest.id, "copper");
  // Two day-1..4 crates alone (5 white + 1 blue each) cover it, before any street match.
  const twoCrates = crateLoot(1).white * 2;
  assert.ok(twoCrates >= cheapest.price.white && cheapest.price.blue === 0, `${twoCrates} white from two crates`);
  const total = CATALOGUE.reduce((n, c) => n + priceCoin(c.price), 0);
  assert.equal(total, 4890);
  assert.ok(total >= 4000 && total <= 6000);
});

test("payIn: pays what the pocket holds toward the item, keeps the instalment, finishes into owned + worn", () => {
  let w = W();
  let keys = pocket(4, 1);
  const a = payIn(w, keys, "copper", 1000)!;
  assert.deepEqual(a.took, { white: 4, blue: 0 }, "copper takes no blue");
  assert.deepEqual(a.keys, pocket(0, 1));
  assert.equal(a.done, false);
  assert.deepEqual(a.wardrobe.paid.copper, { white: 4, blue: 0 });
  assert.deepEqual(a.left, { white: 6, blue: 0 });
  w = a.wardrobe;
  keys = a.keys;
  assert.equal(payIn(w, keys, "copper", 1001), null, "nothing to pay with");
  const b = payIn(w, pocket(9, 0), "copper", 2000)!;
  assert.deepEqual(b.took, { white: 6, blue: 0 }, "never over-pays");
  assert.deepEqual(b.keys, pocket(3, 0));
  assert.equal(b.done, true);
  assert.deepEqual(b.wardrobe.owned, ["copper"]);
  assert.equal(b.wardrobe.paid.copper, undefined);
  assert.equal(b.wardrobe.lantern, "copper");
  assert.equal(b.wardrobe.at, 2000);
  assert.equal(payIn(b.wardrobe, pocket(9, 9), "copper", 3000), null, "already owned");
  assert.deepEqual(owing(b.wardrobe, "copper"), { white: 0, blue: 0 });
});

test("payIn: a mixed price takes both colours; a bought coat goes on without touching the lamp", () => {
  const w = W({ owned: ["iron"], lantern: "iron" });
  const r = payIn(w, pocket(20, 20), "oxblood", 5)!;
  assert.deepEqual(r.took, COATS.oxblood.price);
  assert.equal(r.wardrobe.coat, "oxblood");
  assert.equal(r.wardrobe.lantern, "iron");
});

test("wear: only owned items, only in their own slot; null takes the slot off", () => {
  const w = W({ owned: ["copper", "plum"] });
  assert.equal(wear(w, "coat", "oilskin", 1), null, "not owned");
  assert.equal(wear(w, "coat", "copper", 1), null, "wrong slot");
  const on = wear(w, "coat", "plum", 7)!;
  assert.equal(on.coat, "plum");
  assert.equal(on.at, 7);
  assert.equal(wear(on, "coat", "plum", 8), null, "no change");
  const off = wear(on, "coat", null, 9)!;
  assert.equal(off.coat, null);
  assert.equal(wear(off, "lantern", "copper", 10)!.lantern, "copper");
});

test("cleanWardrobe: unknown ids dropped, paid capped at the price, worn items must be owned", () => {
  const w = cleanWardrobe({
    owned: ["copper", "copper", "gold", 7],
    paid: { nickel: { white: 50, blue: 3 }, copper: { white: 2 }, mystery: { white: 1, blue: 1 }, iron: { white: -4, blue: 0 } },
    coat: "plum",
    lantern: "copper",
    at: 12.7,
  });
  assert.deepEqual(w.owned, ["copper"]);
  assert.deepEqual(w.paid, { nickel: { white: 0, blue: 3 } });
  assert.equal(w.coat, null);
  assert.equal(w.lantern, "copper");
  assert.equal(w.at, 12);
  assert.deepEqual(cleanWardrobe(undefined), W());
  assert.deepEqual(cleanWardrobe("junk"), W());
});

test("mergeWardrobe: ownership unions, instalments keep the larger payment, newer equip wins, order-independent", () => {
  const device = W({ owned: ["copper"], paid: { plum: { white: 4, blue: 2 } }, lantern: "copper", at: 200 });
  const server = W({ owned: ["oilskin"], paid: { plum: { white: 1, blue: 5 }, iron: { white: 3, blue: 0 } }, coat: "oilskin", at: 100 });
  const m = mergeWardrobe(device, server);
  assert.deepEqual(m.owned.sort(), ["copper", "oilskin"]);
  assert.deepEqual(m.paid, { iron: { white: 3, blue: 0 }, plum: { white: 4, blue: 5 } });
  assert.equal(m.lantern, "copper");
  assert.equal(m.coat, null, "device changed its look last and wears no coat");
  assert.equal(m.at, 200);
  assert.deepEqual(mergeWardrobe(server, device), m);
  // An item finished on one side drops its instalment from the other.
  const done = mergeWardrobe(W({ owned: ["plum"], coat: "plum", at: 300 }), device);
  assert.equal(done.paid.plum, undefined);
  assert.equal(done.coat, "plum");
  // Ties break on the look itself, so both orders agree.
  const a = W({ owned: ["plum", "bottle"], coat: "plum", at: 5 });
  const b = W({ owned: ["plum", "bottle"], coat: "bottle", at: 5 });
  assert.deepEqual(mergeWardrobe(a, b), mergeWardrobe(b, a));
  assert.deepEqual(mergeWardrobe(m, m), m, "idempotent");
});

test("art wiring: the coat palette, the generated coat CSS and the lantern-skin CSS cover the whole catalogue", () => {
  const palette = JSON.parse(read("../../scripts/coat-variants.json")).coats as Record<string, { name: string }>;
  assert.deepEqual(Object.keys(palette).sort(), Object.keys(COATS).sort());
  for (const [id, c] of Object.entries(COATS)) assert.equal(palette[id]!.name, c.name);
  const coatsCss = read("../../public/coats.css");
  for (const scout of ["raccoon", "cat", "corgi", "fox", "lynx", "owl", "sloth", "turtle", "giraffe"]) {
    for (const coat of Object.keys(COATS)) {
      for (const [sel, kind] of [["", "walk"], [".is-idle", "idle"], [".is-idle.is-side", "idle-side"]] as const) {
        const rule = `.scout-marker[data-scout="${scout}"][data-coat="${coat}"]${sel}{background-image:url("/sprites/coats/${scout}-${coat}-${kind}.png`;
        assert.ok(coatsCss.includes(rule), rule);
      }
    }
  }
  const skins = read("../../public/wardrobe.css");
  for (const id of [...Object.keys(LANTERN_SKINS), "brass"]) {
    assert.match(skins, new RegExp(`\\[data-lantern="${id}"\\]\\{[^}]*--skin-cap-hi:`), id);
  }
  // Skins never touch the tier-coloured parts of a lamp.
  assert.doesNotMatch(skins, /\.lantern-glass|--glow|::before\s*\{[^}]*--glow/);
  const root = read("../routes/__root.tsx");
  assert.ok(root.indexOf("/lantern-art.css") < root.indexOf("/wardrobe.css"), "skins load after the lantern art");
  assert.ok(root.includes("/coats.css"));
});
