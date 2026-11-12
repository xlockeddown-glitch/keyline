import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CATALOGUE,
  COATS,
  EMPTY_WARDROBE,
  LANTERN_SKINS,
  applyWardrobeSync,
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
import { V2_PALETTE, V2_SCOUTS } from "./coatLayer.ts";
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
  const white = CATALOGUE.reduce((n, c) => n + c.price.white, 0);
  const blue = CATALOGUE.reduce((n, c) => n + c.price.blue, 0);
  // 0.1.137: 70 white + 88 blue on the locked ladder (30 / 90).
  assert.equal(white, 70);
  assert.equal(blue, 88);
  assert.equal(total, 10_020);
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
  assert.deepEqual(w.paid, { nickel: { white: 0, blue: 3, legacy: true } });
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
  assert.deepEqual(m.paid, { iron: { white: 3, blue: 0, legacy: true }, plum: { white: 4, blue: 5, legacy: true } });
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

test("0.1.137: an instalment already started finishes at the old price; a new one pays the new price", () => {
  const plum = W({ paid: { plum: { white: 4, blue: 2 } } });
  assert.deepEqual(owing(plum, "plum"), { white: 0, blue: 8 }, "old plum was 4 white + 10 blue");
  const finish = payIn(plum, pocket(30, 30), "plum", 4)!;
  assert.deepEqual(finish.took, { white: 0, blue: 8 });
  assert.equal(finish.done, true);
  assert.ok(finish.wardrobe.owned.includes("plum"));
  assert.equal(finish.wardrobe.paid.plum, undefined);

  const iron = W({ paid: { iron: { white: 8, blue: 0 } } });
  assert.deepEqual(owing(iron, "iron"), { white: 0, blue: 2 }, "old iron was 8 white + 2 blue");
  const ironDone = payIn(iron, pocket(20, 20), "iron", 5)!;
  assert.deepEqual(ironDone.took, { white: 0, blue: 2 });
  assert.equal(ironDone.done, true);

  const fresh = payIn(W(), pocket(30, 30), "plum", 6)!;
  assert.deepEqual(fresh.took, { white: 0, blue: 24 });
  assert.equal(fresh.done, true);
  const started = payIn(W(), pocket(0, 5), "plum", 7)!;
  assert.equal(started.done, false);
  assert.deepEqual(owing(started.wardrobe, "plum"), { white: 0, blue: 19 });
  assert.equal(started.wardrobe.paid.plum?.legacy, false);
});

test("0.1.137: owned items stay owned and are not charged again", () => {
  const w = W({ owned: ["oilskin", "copper"], coat: "oilskin", lantern: "copper", at: 3 });
  assert.equal(payIn(w, pocket(40, 40), "oilskin", 8), null);
  assert.equal(payIn(w, pocket(40, 40), "copper", 8), null);
  assert.deepEqual(owing(w, "oilskin"), { white: 0, blue: 0 });
  assert.deepEqual(owing(w, "copper"), { white: 0, blue: 0 });
  const kept = applyWardrobeSync(w, W({ owned: [], coat: null, lantern: null, at: 1 }));
  assert.deepEqual([...kept.owned].sort(), ["copper", "oilskin"]);
});

test("0.1.137: a wardrobe sync can change what is worn and cannot grant items or raise an instalment", () => {
  const recorded = W({
    owned: ["oilskin", "copper"],
    paid: { plum: { white: 1, blue: 0, legacy: true } },
    coat: "oilskin",
    lantern: null,
    at: 10,
  });
  const posted = W({
    owned: ["oilskin", "copper", "nickel", "plum"],
    paid: { plum: { white: 4, blue: 10 }, iron: { white: 12, blue: 6 } },
    coat: "plum",
    lantern: "nickel",
    at: 40,
  });
  const next = applyWardrobeSync(recorded, posted);
  assert.deepEqual([...next.owned].sort(), ["copper", "oilskin"]);
  assert.deepEqual(next.paid, { plum: { white: 1, blue: 0, legacy: true } });
  assert.equal(next.coat, "oilskin", "plum is not owned, so the coat stays");
  assert.equal(next.lantern, null, "nickel is not owned");
  const worn = applyWardrobeSync(recorded, W({ owned: [], coat: null, lantern: "copper", at: 4 }));
  assert.equal(worn.coat, null);
  assert.equal(worn.lantern, "copper");
  assert.ok(worn.at >= 11);
  assert.deepEqual([...worn.owned].sort(), ["copper", "oilskin"]);
  const src = read("./wardrobeApi.ts");
  assert.match(src, /applyWardrobeSync\(recorded,/);
  assert.doesNotMatch(src, /mergeWardrobe/);
});

test("art wiring: the coat palette, the generated coat CSS and the lantern-skin CSS cover the whole catalogue", () => {
  const palette = JSON.parse(read("../../scripts/coat-variants.json")).coats as Record<string, { name: string }>;
  assert.deepEqual(Object.keys(palette).sort(), Object.keys(COATS).sort());
  for (const [id, c] of Object.entries(COATS)) assert.equal(palette[id]!.name, c.name);
  const coatsCss = read("../../public/coats.css");
  const all = ["raccoon", "cat", "corgi", "fox", "lynx", "owl", "sloth", "turtle", "giraffe", "panda"];
  // 0.0.83: v2 scouts (redrawn sheets) have no coat PNGs; the browser recolours their coat mask from V2_PALETTE.
  for (const scout of all.filter((s) => V2_SCOUTS.has(s))) {
    assert.ok(!coatsCss.includes(`[data-scout="${scout}"]`), `${scout} is v2: no coat sheets in coats.css`);
    for (const coat of Object.keys(COATS)) assert.ok(V2_PALETTE[coat], `${scout} ${coat}: no v2 coat target`);
  }
  for (const scout of all.filter((s) => !V2_SCOUTS.has(s))) {
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
  // 0.0.99: the lamp art must actually read the skin (it was hard-coded brass, so no skin ever showed).
  const art = read("../../public/lantern-art.css");
  for (const v of ["--skin-cap-hi", "--skin-cap-mid", "--skin-cap-lo", "--skin-rim", "--skin-post-dk", "--skin-post-lt", "--skin-foot"]) assert.ok(art.includes(`var(${v},`), v);
  // 0.1.1: shop previews must out-rank the worn skin on <html> (all previews showed the worn one).
  const props = read("../../public/prop-art.css");
  for (const id of [...Object.keys(LANTERN_SKINS), "brass"]) assert.ok(props.includes(`.skin-swatch[data-lantern="${id}"] .lantern{`), id);
  const root = read("../routes/__root.tsx");
  assert.ok(root.indexOf("/lantern-art.css") < root.indexOf("/wardrobe.css"), "skins load after the lantern art");
  assert.ok(root.includes("/coats.css"));
});

test("0.1.163 lantern skins are finished paintings: no CSS bloom, glass, wick or tier glow over them", () => {
  const props = read("../../public/prop-art.css").replace(/\/\*[\s\S]*?\*\//g, "");
  /** Every declaration block whose selector list names `sel` exactly. */
  const blocks = (sel: string) =>
    [...props.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter((m) => m[1].split(",").some((s) => s.trim() === sel)).map((m) => m[2]);
  for (const sel of [".lantern::before", ".lantern-hero::before", ".lantern-glass", ".lantern-glass::before", ".lantern-glass::after"]) {
    assert.ok(blocks(sel).some((b) => /display:\s*none/.test(b)), `${sel} is off`);
  }
  // No tier-coloured shadow on the lamp; only the dark foot shadow may stay.
  for (const sel of [".lantern", ".lantern-hero", ".skin-swatch .lantern", ':root[data-sky-phase="night"] .vault-pin .lantern']) {
    const filters = blocks(sel).flatMap((b) => b.match(/filter:[^;}]*/g) ?? []);
    assert.ok(filters.length > 0, `${sel} sets its own filter`);
    for (const f of filters) {
      assert.doesNotMatch(f, /--glow/, `${sel}: ${f}`);
      assert.match(f, /^filter:\s*drop-shadow\(0 [12]px 1px #0000008c\)\s*$/, `${sel}: ${f}`);
    }
  }
  // Nothing in the lantern rules of this sheet reads the tier colour at all.
  for (const m of props.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (/\.lantern\b/.test(m[1])) assert.doesNotMatch(m[2], /--glow/, m[1].trim());
  }
  assert.match(props, /\.lantern\{[^}]*width:18px;[^}]*height:46px;[^}]*100% 100%/);
  assert.match(props, /\.lantern-hero\{[^}]*width:42px;[^}]*height:108px/);

  for (const id of ["brass", "copper", "iron", "nickel", "verdigris"]) {
    const b = readFileSync(new URL(`../../public/sprites/lanterns/${id}.webp`, import.meta.url));
    assert.equal(b.toString("ascii", 0, 4), "RIFF", id);
    assert.equal(b.toString("ascii", 8, 12), "WEBP", id);
    const kind = b.toString("ascii", 12, 16);
    let w: number, h: number, alpha: boolean;
    if (kind === "VP8L") {
      assert.equal(b[20], 0x2f, `${id}: VP8L signature`);
      const bits = b.readUInt32LE(21);
      [w, h, alpha] = [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff), ((bits >>> 28) & 1) === 1];
    } else {
      // Lossy VP8 alone has no alpha, so anything else must be the extended container.
      assert.equal(kind, "VP8X", `${id}: ${kind} cannot carry alpha`);
      [w, h, alpha] = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3), (b[20] & 0x10) !== 0];
    }
    assert.deepEqual([w, h], [125, 320], `${id}.webp is ${w}x${h}`);
    assert.equal(alpha, true, `${id}.webp has an alpha channel`);
    assert.ok(b.length < 40_000, `${id}.webp is ${b.length} bytes`);
  }
});

test("0.1.136 vault skins recolour the case and leave the tier dial", () => {
  const skins = read("../../public/wardrobe.css");
  const pins = read("./pins.ts");
  const metals = [...Object.keys(LANTERN_SKINS), "paint-white", "paint-blue", "paint-green", "paint-amber", "paint-red", "paint-violet", "paint-prism"];
  for (const id of metals) {
    assert.match(skins, new RegExp(`\\[data-lantern="${id}"\\]\\{[^}]*--vk-face:`), id);
    assert.match(skins, new RegExp(`\\[data-lantern="${id}"\\]\\{[^}]*--vk-trim:`), id);
    assert.match(skins, new RegExp(`\\[data-lantern="${id}"\\]\\{[^}]*--vk-bar:`), id);
  }
  assert.match(skins, /\.vk-face\{[^}]*fill:var\(--vk-face/);
  assert.match(skins, /\.skin-swatch\[data-lantern="brass"\]/);
  assert.doesNotMatch(skins, /\.vk-glyph|\.vk-num|\.vk-slot/);
  assert.doesNotMatch(skins, /@keyframes[^}]*vk-|animation:[^;]*vk-/);
  for (const cls of ["vk-face", "vk-side", "vk-trim", "vk-bar", "vk-bolts", "vk-ring", "vk-hub", "vk-plate", "vk-glyph", "vk-num", "vk-slot"]) {
    assert.match(pins, new RegExp(`class="${cls}"`), cls);
  }
  for (const fn of ["export function vaultSvg", "export function vaultSvgCentered"]) {
    const body = pins.slice(pins.indexOf(fn), pins.indexOf(fn) + 400);
    assert.match(body, /VK_CASE/, fn);
    assert.match(body, /VK_HUB/, fn);
    assert.match(body, /VK_SLOT/, fn);
  }
});
