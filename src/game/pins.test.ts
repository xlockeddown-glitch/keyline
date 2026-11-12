import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITY_LIST } from "./data.ts";
import { RARITY_LADDER as TIERS } from "./rarity.ts";
import { HEARTH_BOX, HEARTH_SPRITE, PAINTED_PIN, VAULT_SPRITE, VAULT_SVG_BOX, boardPinHtml, cometPinHtml, cometPinState, counterPinHtml, hearthGhostVaultHtml, hearthPinHtml, pinTier, shopPinHtml, stationPinHtml, vaultPinHtml, vaultSkinned, vaultSvg } from "./pins.ts";
import { visibleLantern } from "./paint.ts";
import { FACET_COLOR } from "./hearthVaults.ts";
import { isFareDesk } from "./ticket.ts";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

test("street marker tier === required match tier, all six tiers", () => {
  assert.equal(TIERS.length, 6);
  for (const tier of TIERS) {
    assert.equal(pinTier(vaultPinHtml({ tier })), tier, `lamp ${tier}`);
    assert.equal(pinTier(vaultPinHtml({ tier }, { cooling: true })), tier, `cooling ${tier}`);
    assert.equal(pinTier(vaultPinHtml({ tier }, { cooling: true, lockout: true })), tier, `lockout ${tier}`);
    // The skinned SVG path reads the same tier in every state.
    for (const o of [{}, { cooling: true }, { cooling: true, lockout: true }]) assert.equal(pinTier(vaultPinHtml({ tier }, { ...o, skin: "copper" })), tier, `skinned ${tier}`);
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
    // 0.1.162: one painted sign, nothing drawn over it (no inline SVG, enamel plate, post or ring element).
    assert.equal((html.match(/<img /g) ?? []).length, 1, JSON.stringify(o));
    assert.match(html, /<img class="station-sprite" src="\/sprites\/station-sign\.webp"/);
    assert.doesNotMatch(html, /<svg|station-train|station-sign"|station-post|ring/);
  }
  assert.match(stationPinHtml({ fare: true }), /has-fare/);
  assert.doesNotMatch(stationPinHtml({}), /has-fare/);
  assert.doesNotMatch(stationPinHtml({ cooling: true }), /has-fare|station-fare/);
  // The fare label is a sibling after the <img> (a void element, so it can't be a child), and only with a fare.
  assert.match(stationPinHtml({ fare: true }), /<img [^>]*\/><b class="station-fare">Fare<\/b><\/div>$/);
  assert.doesNotMatch(stationPinHtml({}), /station-fare|<b/);
  assert.match(stationPinHtml({}), /<img [^>]*\/><\/div>$/);
});

test("0.1.162 the fare and cooling states stay off the station painting", () => {
  const css = read("../styles.css");
  // The calling ring and the colour flip are gone; the label carries the fare, a whole-image filter the cooling.
  assert.doesNotMatch(css, /\.station-sign|\.station-train|\.station-post/);
  assert.doesNotMatch(css, /\.station-pin\.has-fare[^{]*::(before|after)/);
  assert.match(css, /\.station-pin\.painted-station-pin::before, \.station-pin\.painted-station-pin::after\{ display:none \}/);
  assert.match(css, /\.station-pin\.cooling \.station-sprite\{[^}]*opacity:\.55/);
  assert.match(css, /\.station-fare\{[^}]*top:62px/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.station-fare\{\s*animation:none/);
  assert.doesNotMatch(css + read("../../public/prop-art.css"), /(station|shop|counter|board)-sprite\{[^}]*(invert|drop-shadow|box-shadow)/);
});

test("GameMap draws every fare desk with the station marker", () => {
  const src = read("../components/keyline/GameMap.tsx");
  assert.match(src, /desk\s*\?\s*stationPinHtml\(/);
  assert.doesNotMatch(src, /vaultPinHtml\([^)]*desk/);
});

test("0.1.162 GameMap draws the outfitter, counter and board through pins.ts, with no markup of its own", () => {
  const src = read("../components/keyline/GameMap.tsx");
  assert.match(src, /shop\s*\?\s*shopPinHtml\(poi\.name\)/);
  assert.match(src, /counter\s*\?\s*counterPinHtml\(poi\.name\)/);
  assert.match(src, /board\s*\?\s*boardPinHtml\(poi\.name\)/);
  assert.doesNotMatch(src, /shop-awning|shop-body|shop-window|shop-door|service-sign|service-post|station-sign|station-train|class="shop-pin/);
  // Sizes follow the painted boxes; the station box adds 14 px for the fare label under the post.
  const { shop, counter, board, station } = PAINTED_PIN;
  assert.ok(src.includes(`shop ? [${shop.w}, ${shop.h}] : counter ? [${counter.w}, ${counter.h}] : board ? [${board.w}, ${board.h}] : desk ? [${station.w}, ${station.h + 14}]`));
  assert.match(src, /comet \? \[48, 58\]/);
  assert.match(src, /comet \? \[24, 51\]/);
});

test("0.1.162 painted shop, counter, board and station pins are a wrapper and one <img>", () => {
  const pins = [
    ["shop", shopPinHtml("Thread & Tack"), /^<div class="shop-pin painted-shop-pin" title="Thread & Tack">/],
    ["counter", counterPinHtml("Ward counter"), /^<div class="service-pin counter-pin painted-counter-pin" title="Ward counter">/],
    ["board", boardPinHtml("Notice board"), /^<div class="service-pin board-pin painted-board-pin" title="Notice board">/],
    ["station", stationPinHtml(), /^<div class="station-pin painted-station-pin" title="Station">/],
  ] as const;
  for (const [k, html, root] of pins) {
    const p = PAINTED_PIN[k];
    assert.match(html, root, k);
    assert.equal((html.match(/<img /g) ?? []).length, 1, k);
    assert.ok(html.includes(`<img class="${k}-sprite" src="${p.src}" width="${p.w}" height="${p.h}" alt="" draggable="false" /></div>`), k);
    assert.equal((html.match(/<(?!img |\/?div)/g) ?? []).length, 0, `${k}: only the wrapper and the image`);
    assert.doesNotMatch(html, /<svg|station-sign"|station-train|service-sign|service-post|service-glyph|station-post|shop-awning|shop-body|<span|<i /, k);
    assert.equal(pinTier(html), null, k);
  }
  assert.deepEqual(
    Object.values(PAINTED_PIN).map((p) => p.src),
    ["/sprites/outfitter.webp", "/sprites/street-counter.webp", "/sprites/station-sign.webp", "/sprites/notice-sign.webp"],
  );
  // A place name can't break out of the title attribute.
  assert.match(counterPinHtml('x"><svg onload=1>'), /title="xsvg onload=1"><img /);
});

test("0.1.162 nothing is drawn over or behind the painted pins but the shared shadow", () => {
  const css = read("../styles.css");
  const props = read("../../public/prop-art.css");
  const lamps = read("../../public/lantern-art.css");
  for (const k of ["shop", "counter", "board", "station"]) {
    const root = k === "shop" ? ".shop-pin" : k === "station" ? ".station-pin" : ".service-pin";
    assert.ok(css.includes(`${root}.painted-${k}-pin::before`) && css.includes(`${root}.painted-${k}-pin::after`), `${k}: pseudo-elements off`);
    assert.match(css, new RegExp(`\\.${k}-sprite\\{[^}]*object-fit:contain`), k);
    assert.match(props, new RegExp(`\\.${k}-sprite[,{][^}]*object-fit:contain`), k);
  }
  // The old enamel plates, posts, CSS awning and hanging lamp are gone from every sheet.
  assert.doesNotMatch(css + props + lamps, /\.service-sign|\.service-post|\.service-glyph|\.shop-awning|\.shop-body|\.shop-window|\.shop-door|\.board-bang/);
  assert.doesNotMatch(lamps, /\.shop-pin/);
  // No sprite background, drop-shadow or pixel scaling on the pin boxes; the paintings sample smoothly.
  for (const sel of [".shop-pin", ".counter-pin", ".board-pin", ".station-pin"]) {
    const rule = props.match(new RegExp(`\\${sel}\\{([^}]*)\\}`))?.[1] ?? "";
    assert.match(rule, /filter:none/, sel);
    assert.doesNotMatch(rule, /url\(|drop-shadow|pixelated/, sel);
  }
  assert.match(css, /\.world-obj\.has-shadow::before/);
});

test("no amber fare call-out left on lamps", () => {
  const css = read("../../public/lantern-art.css") + read("../styles.css");
  assert.doesNotMatch(css, /\.vault-pin\.is-(fare|desk)\b/);
  assert.match(read("../styles.css"), /\.station-pin\.has-fare\b/);
});

test("0.1.134 the street counter, the print shop and the outfitter keep their own drawings (0.1.162: painted webps)", () => {
  const props = read("../../public/prop-art.css");
  const counter = read("../components/keyline/WardCounter.tsx");
  const press = read("../components/keyline/PrintShop.tsx");
  const outfitter = read("../components/keyline/ScoutShop.tsx");
  // Three fronts, three different files, each cache-busted by the publish stamp on the <img> itself.
  assert.match(counter, /<figure className="print-front counter-front">\s*<img src=\{`\/sprites\/street-counter\.webp\?v=\$\{PUBLISH_STAMP\}`\}/);
  assert.match(press, /<figure className="print-front">\s*<img src=\{`\/sprites\/print-shop\.webp\?v=\$\{PUBLISH_STAMP\}`\}/);
  assert.match(outfitter, /<figure className="print-front shop-front">\s*<img src=\{`\/sprites\/outfitter\.webp\?v=\$\{PUBLISH_STAMP\}`\}/);
  const files = ["print-shop", "street-counter", "outfitter"].map((n) => readFileSync(new URL(`../../public/sprites/${n}.webp`, import.meta.url)));
  assert.equal(new Set(files.map((b) => b.toString("base64"))).size, 3);
  // The counter sheet shows the map drawing; the outfitter sheet shows the outfitter pin's.
  assert.equal(PAINTED_PIN.counter.src, "/sprites/street-counter.webp");
  assert.equal(PAINTED_PIN.shop.src, "/sprites/outfitter.webp");
  assert.match(props, /\.print-front\{[^}]*height:156px/);
  assert.match(props, /\.print-front img\{[^}]*height:148px/);
  assert.match(props, /\.counter-front\{[^}]*height:132px/);
  assert.match(props, /\.counter-front img\{[^}]*height:124px/);
  assert.match(props, /\.shop-front img\{[^}]*height:148px/);
  // The paintings sample smoothly: no pixel scaling and no pixel PNG left on these rules or screens.
  assert.doesNotMatch(props, /pixelated/);
  assert.match(props, /\.print-front img\{[^}]*image-rendering:auto/);
  assert.doesNotMatch(props + counter + press + outfitter + read("./pins.ts") + read("../components/keyline/GameMap.tsx"), /print-shop\.png|street-counter(-v2)?\.png|outfitter-front\.png|notice-board\.png/);
  assert.match(counter, /claimCrate\(\)/);
  assert.match(press, /payCosmetic\(c\.id\)/);
});

test("0.1.162 the five shop and sign paintings ship as RGBA webp, sized for 2-3x screens", () => {
  // [file, real size, CSS box it is shown in, minimum scale]. Pins need 3x their box; the sheet fronts need 2x of
  // the 148 px (print shop, outfitter) or 124 px (counter) figure height.
  const sprites = [
    ["print-shop", 512, 460, 49074, [[0, 148, 2]]],
    ["street-counter", 408, 512, 50582, [[PAINTED_PIN.counter.w, PAINTED_PIN.counter.h, 3], [0, 124, 2]]],
    ["outfitter", 512, 478, 56136, [[PAINTED_PIN.shop.w, PAINTED_PIN.shop.h, 3], [0, 148, 2]]],
    ["station-sign", 232, 320, 19290, [[PAINTED_PIN.station.w, PAINTED_PIN.station.h, 3]]],
    ["notice-sign", 232, 320, 17298, [[PAINTED_PIN.board.w, PAINTED_PIN.board.h, 3]]],
  ] as const;
  for (const [name, W, H, bytes, boxes] of sprites) {
    const buf = readFileSync(new URL(`../../public/sprites/${name}.webp`, import.meta.url));
    assert.equal(buf.toString("ascii", 0, 4), "RIFF");
    assert.equal(buf.toString("ascii", 8, 12), "WEBP");
    assert.equal(buf.toString("ascii", 12, 16), "VP8X", `${name}: extended webp (alpha)`);
    assert.ok(buf[20]! & 0x10, `${name}: alpha flag`);
    const w = 1 + buf.readUIntLE(24, 3), h = 1 + buf.readUIntLE(27, 3);
    assert.deepEqual([w, h, buf.length], [W, H, bytes], name);
    assert.ok(buf.length < 80_000, `${name}: ${buf.length} bytes`);
    for (const [bw, bh, k] of boxes) {
      // object-fit: contain, so the drawn size is the box scaled to the sprite's aspect.
      const drawnH = bw ? Math.min(bh, (bw * h) / w) : bh;
      assert.ok(h >= drawnH * k - 1, `${name}: ${w}x${h} for a ${bw || "auto"}x${bh} box at ${k}x`);
      assert.ok(Math.max(w, h) >= 296, name);
    }
    // The CSS box keeps the painting's aspect within a pixel, so contain never letterboxes it off its foot.
    for (const [bw, bh] of boxes) if (bw) assert.ok(Math.abs(bw - (bh * w) / h) <= 1.5, `${name}: ${bw}x${bh} box vs ${w}x${h}`);
  }
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

const webp = (rel: string) => {
  const buf = readFileSync(new URL(rel, import.meta.url));
  assert.equal(buf.toString("ascii", 0, 4), "RIFF", rel);
  assert.equal(buf.toString("ascii", 8, 12), "WEBP", rel);
  assert.equal(buf.toString("ascii", 12, 16), "VP8X", `${rel}: extended webp (alpha)`);
  assert.ok(buf[20]! & 0x10, `${rel}: alpha flag`);
  return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), bytes: buf.length };
};

test("0.1.160 a painted street vault is a wrapper and one <img>, in every tier and state", () => {
  for (const tier of TIERS) {
    const states = [
      ["open", vaultPinHtml({ tier })],
      ["cooling", vaultPinHtml({ tier }, { cooling: true })],
      ["locked", vaultPinHtml({ tier }, { cooling: true, lockout: true })],
      // Stock brass and "no lantern" are the paintings too.
      ["open", vaultPinHtml({ tier }, { skin: null })],
      ["open", vaultPinHtml({ tier }, { skin: "brass" })],
    ] as const;
    for (const [state, html] of states) {
      assert.equal(pinTier(html), tier, `${tier} ${state}`);
      assert.match(html, new RegExp(`^<div class="vault-pin painted-vault-pin tier-${tier} is-${state}\\b`));
      assert.match(html, new RegExp(`src="/sprites/vaults/${tier}\\.webp"`));
      assert.equal((html.match(/<img /g) ?? []).length, 1, `${tier} ${state}: one image`);
      // Nothing over the painting: no SVG, lockbar, facet or any other element.
      assert.doesNotMatch(html, /<svg|vk-vault|vk-lockbar|<i class="hf|<span|<i /, `${tier} ${state}`);
      assert.match(html, /^<div [^>]*><img [^>]*\/><\/div>$/, `${tier} ${state}: wrapper + img only`);
      assert.match(html, new RegExp(`width="${VAULT_SPRITE.w}" height="${VAULT_SPRITE.h}"`));
    }
    assert.match(vaultPinHtml({ tier }, { cooling: true }), /class="[^"]* cooling"/);
    const locked = vaultPinHtml({ tier }, { cooling: true, lockout: true });
    assert.match(locked, /class="[^"]* locked-out"/);
    assert.doesNotMatch(locked, /class="[^"]* cooling"/);
    assert.match(locked, /title="[^"]*Locked out after a wrong answer"/);
  }
});

test("0.1.160 a worn print-shop skin or vault paint keeps the skinnable SVG vault", () => {
  assert.equal(vaultSkinned(null), false);
  assert.equal(vaultSkinned(undefined), false);
  assert.equal(vaultSkinned("brass"), false);
  for (const id of ["copper", "iron", "verdigris", "nickel", "paint-amber", "paint-prism"]) assert.equal(vaultSkinned(id), true, id);
  assert.equal(vaultSkinned(visibleLantern(null, null)), false);
  assert.equal(vaultSkinned(visibleLantern(null, "copper")), true);
  assert.equal(vaultSkinned(visibleLantern("amber", null)), true);
  for (const tier of TIERS) {
    for (const o of [{ skin: "copper" }, { skin: "paint-red" }, { svg: true }, { svg: true, skin: "brass" }]) {
      const html = vaultPinHtml({ tier }, o);
      assert.ok(html.includes(vaultSvg(tier)), `${tier} ${JSON.stringify(o)}: the SVG case`);
      assert.match(html, /class="vk-vault"/);
      assert.match(html, new RegExp(`^<div class="vault-pin tier-${tier}"`));
      assert.doesNotMatch(html, /<img|painted-vault-pin|sprites\/vaults/);
    }
    // The SVG keeps its 0.1.107 lockbar and cooling class, unchanged.
    assert.match(vaultPinHtml({ tier }, { skin: "iron", cooling: true, lockout: true }), /locked-out" title="Locked out after a wrong answer">.*<span class="vk-lockbar"/);
    assert.match(vaultPinHtml({ tier }, { skin: "iron", cooling: true }), new RegExp(`^<div class="vault-pin tier-${tier} cooling">`));
  }
  // The shop swatches force the SVG; the map passes the worn skin and rebuilds its pins when it changes.
  assert.match(read("../components/keyline/PrintShop.tsx"), /vaultPinHtml\(\{ tier: "amber" \}, \{ svg: true \}\)/);
  const map = read("../components/keyline/GameMap.tsx");
  assert.match(map, /const skin = visibleLantern\(st\.paints\.wornVault, st\.wardrobe\.lantern\)/);
  assert.match(map, /vaultPinHtml\(poi, \{[^}]*\bskin\b[^}]*\}\)/);
  assert.match(map, /visibleLantern\(st\.paints\.wornVault, st\.wardrobe\.lantern\) === visibleLantern\(prev\.paints\.wornVault, prev\.wardrobe\.lantern\)\) return;[\s\S]{0,160}rebuildPins\(L, map\)/);
  assert.match(map, /svgVault \? VAULT_SVG_BOX : VAULT_SPRITE/);
  // Hearth and comet pins take no skin.
  assert.doesNotMatch(map, /hearthPinHtml\([^\n]*skin/);
  assert.doesNotMatch(map, /cometPinHtml\([^\n]*skin/);
});

test("0.1.160 the Hearth pin is the painting, with its four fields in a label under it", () => {
  const cats = ["history", "science", "music", "games"];
  const names = ["History", "Science", "Music", "Video games"];
  for (const o of [{}, { cooling: true }, { cooling: true, lockout: true }, { polished: true }]) {
    const html = hearthPinHtml("The Ember", cats, FACET_COLOR, o);
    assert.equal(pinTier(html), "red");
    assert.match(html, /^<div class="vault-pin painted-vault-pin tier-red hearth-pin\b/);
    assert.match(html, /src="\/sprites\/vaults\/hearth\.webp"/);
    assert.equal((html.match(/<img /g) ?? []).length, 1);
    assert.doesNotMatch(html, /<svg|vk-vault|vk-lockbar|<i class="hf|class="hf\b|hf-(tl|tr|bl|br)/);
    // The image comes first and closes before the label starts: the label is under the pin, not on it.
    assert.match(html, /^<div [^>]*><img [^>]*\/><span class="hp-label"><span class="hp-plate">The Ember<\/span><span class="hp-fields"/);
    const fields = [...html.matchAll(/<span class="hp-field" data-field="([\w-]+)"><i class="hp-dot" style="--hf:(#[0-9a-f]+)"><\/i>([^<]+)<\/span>/g)];
    assert.deepEqual(fields.map((m) => m[1]), cats);
    assert.deepEqual(fields.map((m) => m[3]), names);
    assert.deepEqual(fields.map((m) => m[2]), cats.map((c) => FACET_COLOR[c]));
    assert.match(html, /title="The Ember · Hearth vault · History, Science, Music, Video games[^"]*"/);
  }
  assert.match(hearthPinHtml("X", cats, FACET_COLOR, { cooling: true, lockout: true }), /locked-out" title="[^"]*Locked out after a wrong answer"/);
  assert.match(hearthPinHtml("X", cats, FACET_COLOR, { cooling: true }), /hearth-pin cooling"/);
  assert.match(hearthPinHtml("X", cats, FACET_COLOR, { polished: true }), /is-polished/);
  assert.doesNotMatch(hearthPinHtml('<b>"x"</b>', cats, FACET_COLOR), /<b>|"x"/);
  // The placement preview is the same painting, with no fields and nothing over it.
  const ghost = hearthGhostVaultHtml();
  assert.match(ghost, /^<div [^>]*><img [^>]*hearth\.webp[^>]*\/><\/div>$/);
  const map = read("../components/keyline/GameMap.tsx");
  assert.match(map, /class="hearth-ghost">[^`]*\$\{hearthGhostVaultHtml\(\)\}/);
  // The cards use the painting too.
  assert.match(read("../components/keyline/HearthOwner.tsx"), /src="\/sprites\/vaults\/hearth\.webp"/);
  assert.doesNotMatch(read("../components/keyline/HearthOwner.tsx"), /vaultSvg/);
  const modal = read("../components/keyline/VaultModal.tsx");
  assert.match(modal, /src="\/sprites\/vaults\/hearth\.webp"/);
  assert.match(modal, /src=\{`\/sprites\/vaults\/\$\{poi\.tier\}\.webp`\}/);
  assert.match(modal, /!skinned \?/);
  assert.match(modal, /vaultSvgCentered\(poi\.tier\)/);
});

test("0.1.160 painted pins get no bloom, overlay or extra shadow in CSS; states are a filter on the image", () => {
  const css = read("../styles.css");
  assert.match(css, /\.vault-pin\.painted-vault-pin::before, \.vault-pin\.painted-vault-pin::after\{ display:none \}/);
  assert.match(css, /\.painted-vault-pin\.cooling \.vault-sprite\{ filter:grayscale\([^}]*brightness\([^}]*\}/);
  assert.match(css, /\.painted-vault-pin\.locked-out \.vault-sprite\{ filter:grayscale\([^}]*brightness\([^}]*\}/);
  assert.match(css, new RegExp(`\\.vault-sprite\\{[^}]*width:${VAULT_SPRITE.w}px; height:${VAULT_SPRITE.h}px`));
  assert.match(css, new RegExp(`\\.hearth-sprite\\{ width:${HEARTH_SPRITE.w}px; height:${HEARTH_SPRITE.h}px`));
  assert.match(css, new RegExp(`\\.vault-pin\\.hearth-pin\\{[^}]*width:${HEARTH_BOX.w}px; height:${HEARTH_BOX.h}px`));
  for (const rule of css.match(/[^{}]*(?:vault-sprite|hearth-sprite)[^{}]*\{[^}]*\}/g) ?? []) assert.doesNotMatch(rule, /drop-shadow|box-shadow|background|outline/, rule);
  // The old facet squares and the bevel behind the pin are gone.
  assert.doesNotMatch(css, /\.hearth-pin[^{]*\.hf\b|\.hf-(tl|tr|bl|br)\b/);
  assert.doesNotMatch(css, /\.hearth-pin\.is-polished::before/);
});

test("0.1.160 pin boxes: a street vault reads at least as large as the comet, anchored at its foot", () => {
  // Comet: 48×58, anchored [24, 51].
  assert.ok(Math.max(VAULT_SPRITE.w, VAULT_SPRITE.h) >= 48);
  assert.equal(VAULT_SPRITE.anchor[0], VAULT_SPRITE.w / 2);
  assert.ok(VAULT_SPRITE.anchor[1] > VAULT_SPRITE.h * 0.8 && VAULT_SPRITE.anchor[1] < VAULT_SPRITE.h);
  assert.deepEqual([VAULT_SVG_BOX.w, VAULT_SVG_BOX.h, ...VAULT_SVG_BOX.anchor], [40, 44, 20, 40]);
  assert.ok(HEARTH_SPRITE.w >= VAULT_SPRITE.w && HEARTH_SPRITE.h >= VAULT_SPRITE.h);
  assert.equal(HEARTH_BOX.anchor[0], HEARTH_BOX.w / 2);
  // The Hearth anchor is the vault's foot (inside the painting), above the label.
  assert.ok(HEARTH_BOX.anchor[1] > HEARTH_SPRITE.h * 0.8 && HEARTH_BOX.anchor[1] < HEARTH_SPRITE.h);
  assert.ok(HEARTH_BOX.h > HEARTH_SPRITE.h + 30, "the box holds the plate and two field rows");
});

test("0.1.160 the vault sprites ship as RGBA webp, sized for 3x screens", () => {
  for (const tier of TIERS) {
    const { w, h, bytes } = webp(`../../public/sprites/vaults/${tier}.webp`);
    assert.ok(w >= VAULT_SPRITE.w * 3 && h >= VAULT_SPRITE.h * 3 && Math.max(w, h) >= 48 * 3, `${tier}: ${w}x${h}`);
    assert.ok(Math.abs(w / h - VAULT_SPRITE.w / VAULT_SPRITE.h) < 0.02, `${tier}: aspect ${w}x${h}`);
    assert.ok(bytes < 60_000, `${tier}: ${bytes} bytes`);
  }
  const { w, h, bytes } = webp("../../public/sprites/vaults/hearth.webp");
  assert.ok(w >= HEARTH_SPRITE.w * 3 && h >= HEARTH_SPRITE.h * 3, `hearth: ${w}x${h}`);
  assert.ok(Math.abs(w / h - HEARTH_SPRITE.w / HEARTH_SPRITE.h) < 0.02, `hearth: aspect ${w}x${h}`);
  assert.ok(bytes < 80_000, `hearth: ${bytes} bytes`);
});
