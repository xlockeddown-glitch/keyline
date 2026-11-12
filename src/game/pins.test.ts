import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITY_LIST } from "./data.ts";
import { RARITY_LADDER as TIERS } from "./rarity.ts";
import { cometPinHtml, cometPinState, pinTier, stationPinHtml, vaultPinHtml } from "./pins.ts";
import { isFareDesk } from "./ticket.ts";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

test("street marker tier === required match tier, all six tiers", () => {
  assert.equal(TIERS.length, 6);
  for (const tier of TIERS) {
    assert.equal(pinTier(vaultPinHtml({ tier })), tier, `lamp ${tier}`);
    assert.equal(pinTier(vaultPinHtml({ tier }, { cooling: true })), tier, `cooling ${tier}`);
  }
});

test("every city lamp marker matches its poi tier", () => {
  for (const c of CITY_LIST) {
    for (const p of c.pois) {
      if (p.kind === "shop" || p.kind === "counter" || p.kind === "board" || isFareDesk(p)) continue;
      assert.equal(pinTier(vaultPinHtml(p)), p.tier, `${c.id}/${p.id}`);
    }
  }
});

test("GameMap builds vault markers only through pins.ts (no hard-coded tier)", () => {
  const src = read("../components/keyline/GameMap.tsx");
  assert.doesNotMatch(src, /vault-pin[^"`]*\btier-(white|blue|green|amber|red|violet|yellow|gold)\b/);
  // 0.1.119: the ladders are gone; no ladder pin is drawn.
  assert.doesNotMatch(src, /seriesPinHtml|SERIES\./);
  assert.match(src, /vaultPinHtml\(poi,/);
});

test("lantern-art.css styles every tier name the game uses", () => {
  const css = read("../../public/lantern-art.css");
  for (const tier of TIERS) assert.match(css, new RegExp(`\\.vault-pin\\.tier-${tier}\\b`), tier);
  assert.doesNotMatch(css, /tier-(yellow|gold)\b/);
});

const LAMP_CLASS = /\b(vault-pin|lantern[\w-]*|stack-lamp|stack-globe|tier-[\w-]+|is-run|is-stack)\b/;

test("fare desk markers are station signs, never lamps or tiers", () => {
  for (const o of [{}, { fare: true }, { cooling: true }, { fare: true, cooling: true }]) {
    const html = stationPinHtml(o);
    const classes = [...html.matchAll(/class="([^"]*)"/g)].map((m) => m[1]).join(" ");
    assert.doesNotMatch(classes, LAMP_CLASS, JSON.stringify(o));
    assert.equal(pinTier(html), null);
    assert.match(html, /^<div class="station-pin\b/);
    assert.match(html, /station-train/);
  }
  assert.match(stationPinHtml({ fare: true }), /has-fare/);
  assert.doesNotMatch(stationPinHtml({}), /has-fare/);
});

test("GameMap draws every fare desk with the station marker", () => {
  const src = read("../components/keyline/GameMap.tsx");
  assert.match(src, /desk\s*\?\s*stationPinHtml\(/);
  assert.doesNotMatch(src, /vaultPinHtml\([^)]*desk/);
});

test("no amber fare call-out left on lamps", () => {
  const css = read("../../public/lantern-art.css") + read("../styles.css");
  assert.doesNotMatch(css, /\.vault-pin\.is-(fare|desk)\b/);
  assert.match(read("../styles.css"), /\.station-pin\.has-fare\b/);
});

test("0.1.134 the street counter and the print shop keep their own drawings", () => {
  const props = read("../../public/prop-art.css");
  assert.match(props, /street-counter-v2\.png\?v=k1135a/);
  assert.match(props, /\.counter-front\{[^}]*height:132px/);
  assert.match(props, /image-rendering:\s*pixelated/);
  assert.match(read("../components/keyline/WardCounter.tsx"), /street-counter-v2\.png\?v=\$\{PUBLISH_STAMP\}/);
  assert.match(read("../components/keyline/PrintShop.tsx"), /print-shop\.png\?v=\$\{PUBLISH_STAMP\}/);
  assert.match(read("../components/keyline/WardCounter.tsx"), /claimCrate\(\)/);
  assert.match(read("../components/keyline/PrintShop.tsx"), /payCosmetic\(c\.id\)/);
});

test("0.1.119 the ladder art is retired (no ladder pin markup or CSS left)", async () => {
  const pins = await import("./pins.ts");
  for (const k of ["ladderColumnSvg", "ladderLampHtml", "seriesPinHtml"]) assert.equal(k in pins, false, k);
  assert.doesNotMatch(read("../styles.css"), /\.is-ladder\b|\.ladder-col\b/);
});

test("0.1.159 the painted Comet pin reads tier-green in every state, with nothing drawn over the painting", () => {
  const states = [
    ["open", cometPinHtml()],
    ["cooling", cometPinHtml({ cooling: true })],
    ["locked", cometPinHtml({ cooling: true, lockout: true })],
  ] as const;
  for (const [state, html] of states) {
    assert.equal(pinTier(html), "green", state);
    assert.match(html, new RegExp(`src="/sprites/comet/${state}\\.webp"`));
    // Only the wrapper and the painted sprite: no SVG, lockbar, ring or extra markup over the image.
    assert.doesNotMatch(html, /<svg|vk-lockbar|<span|<i /);
    assert.equal((html.match(/<img /g) ?? []).length, 1);
  }
  assert.equal(cometPinState({ cooling: true, lockout: true }), "locked");
  assert.equal(cometPinState({ cooling: true }), "cooling");
  assert.equal(cometPinState(), "open");
});

test("0.1.159 the comet sprites ship as RGBA webp, sized for 3x screens", () => {
  for (const s of ["open", "cooling", "locked"]) {
    const buf = readFileSync(new URL(`../../public/sprites/comet/${s}.webp`, import.meta.url));
    assert.equal(buf.toString("ascii", 0, 4), "RIFF");
    assert.equal(buf.toString("ascii", 8, 12), "WEBP");
    assert.equal(buf.toString("ascii", 12, 16), "VP8X", `${s}: extended webp (alpha)`);
    assert.ok(buf[20]! & 0x10, `${s}: alpha flag`);
    const w = 1 + buf.readUIntLE(24, 3), h = 1 + buf.readUIntLE(27, 3);
    assert.ok(w >= 48 * 3 && h >= 58 * 3, `${s}: ${w}x${h}`);
    assert.ok(buf.length < 60_000, `${s}: ${buf.length} bytes`);
  }
});
