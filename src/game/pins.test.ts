import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITY_LIST, SERIES, TIER_LABEL, seriesPoi, type SeriesDef } from "./data.ts";
import { RARITY_LADDER as TIERS } from "./rarity.ts";
import { pinTier, seriesPinHtml, vaultPinHtml } from "./pins.ts";
import { isFareDesk } from "./ticket.ts";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

test("street marker tier === required match tier, all six tiers", () => {
  assert.equal(TIERS.length, 6);
  for (const tier of TIERS) {
    assert.equal(pinTier(vaultPinHtml({ tier })), tier, `lamp ${tier}`);
    assert.equal(pinTier(vaultPinHtml({ tier }, { cooling: true, desk: true })), tier, `desk ${tier}`);
    for (const kind of ["run", "stack"] as const) {
      const s: SeriesDef = { ...SERIES[kind], cost: tier };
      // store: keys[series.cost] check + VaultModal hero uses seriesPoi(series).tier
      assert.equal(pinTier(seriesPinHtml(s)), s.cost, `${kind} ${tier}`);
      assert.equal(seriesPoi(s).tier, s.cost);
    }
  }
});

test("The Run / The Stack markers carry their match cost", () => {
  assert.equal(pinTier(seriesPinHtml(SERIES.run)), SERIES.run.cost);
  assert.equal(TIER_LABEL[pinTier(seriesPinHtml(SERIES.run))!], "Blue");
  assert.match(seriesPinHtml(SERIES.run), /is-run/);
  assert.equal(pinTier(seriesPinHtml(SERIES.stack)), SERIES.stack.cost);
  assert.match(seriesPinHtml(SERIES.stack), /is-stack/);
});

test("every city lamp marker matches its poi tier", () => {
  for (const c of CITY_LIST) {
    for (const p of c.pois) {
      if (p.kind === "shop") continue;
      assert.equal(pinTier(vaultPinHtml(p, { desk: isFareDesk(p) })), p.tier, `${c.id}/${p.id}`);
    }
  }
});

test("GameMap builds vault markers only through pins.ts (no hard-coded tier)", () => {
  const src = read("../components/keyline/GameMap.tsx");
  assert.doesNotMatch(src, /vault-pin[^"`]*\btier-(white|blue|green|amber|red|violet|yellow|gold)\b/);
  assert.match(src, /seriesPinHtml\(SERIES\.run\)/);
  assert.match(src, /seriesPinHtml\(SERIES\.stack\)/);
  assert.match(src, /vaultPinHtml\(poi,/);
});

test("lantern-art.css styles every tier name the game uses", () => {
  const css = read("../../public/lantern-art.css");
  for (const tier of TIERS) assert.match(css, new RegExp(`\\.vault-pin\\.tier-${tier}\\b`), tier);
  assert.doesNotMatch(css, /tier-(yellow|gold)\b/);
});
