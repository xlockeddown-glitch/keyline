import type { Poi, Tier } from "./types";
import { TRIVIA_CATS } from "./triviaMeta.ts";

/**
 * Street marker markup. The tier class must come from the same field the store checks for
 * "Need a X match": poi.tier.
 */

/**
 * 0.1.102 Vault Keys: the street marker is a layered-SVG vault (steel box, brass trim, bolt-ringed dial), one drawing
 * recoloured per tier through --glow. The dial carries the tier glyph and numeral and the card slot repeats the glyph,
 * so a tier reads by shape and numeral as well as colour (I circle, II square, III triangle, IV hexagon, V diamond,
 * VI star). The gradients are the same in every copy, so the shared ids are harmless. The ground shadow is the
 * world-obj CSS ellipse.
 */
const VK_GLYPH: Record<Tier, string> = {
  white: '<circle cx="0" cy="0" r="6"/>',
  blue: '<rect x="-5.4" y="-5.4" width="10.8" height="10.8" rx="1.4"/>',
  green: '<polygon points="0,-7.2 6.3,3.8 -6.3,3.8"/>',
  amber: '<polygon points="6.4,0 3.2,5.5 -3.2,5.5 -6.4,0 -3.2,-5.5 3.2,-5.5"/>',
  red: '<polygon points="0,-7.4 6.2,0 0,7.4 -6.2,0"/>',
  violet: '<polygon points="0,-7.6 1.9,-2.4 7.2,-2.4 2.9,0.9 4.5,6.1 0,3 -4.5,6.1 -2.9,0.9 -7.2,-2.4 -1.9,-2.4"/>',
};
export const VK_NUM: Record<Tier, string> = { white: "I", blue: "II", green: "III", amber: "IV", red: "V", violet: "VI" };
const VK_DEFS = `<defs><linearGradient id="vk-f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d8794"/><stop offset=".5" stop-color="#4c5561"/><stop offset="1" stop-color="#2b3139"/></linearGradient><linearGradient id="vk-s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22272f"/><stop offset="1" stop-color="#3b424c"/></linearGradient><radialGradient id="vk-d" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#9aa4b0"/><stop offset=".6" stop-color="#58616d"/><stop offset="1" stop-color="#30363f"/></radialGradient><linearGradient id="vk-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d38a"/><stop offset=".5" stop-color="#b8913f"/><stop offset="1" stop-color="#6e5320"/></linearGradient></defs>`;
const VK_BOLTS = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4;
  return `<circle cx="${(30 + Math.cos(a) * 14.5).toFixed(1)}" cy="${(30 + Math.sin(a) * 14.5).toFixed(1)}" r="1.5"/>`;
}).join("");

/**
 * Case parts a print-shop skin may recolour (wardrobe.css). The glyph, numeral and slot are not in
 * this string as skinnable classes: they stay on the tier colour. Defaults are the steel-and-brass gradients.
 */
const VK_CASE = `<path class="vk-side" d="M9 9 l-5 4 v40 l5 2z" fill="url(#vk-s)" stroke="#1a1410" stroke-width="1"/><rect class="vk-face" x="9" y="7" width="47" height="50" rx="4" fill="url(#vk-f)" stroke="#1a1410" stroke-width="1.2"/><rect class="vk-trim" x="11.5" y="9.5" width="42" height="45" rx="3" fill="none" stroke="url(#vk-b)" stroke-width="1.6"/><rect class="vk-bar" x="14" y="4" width="37" height="4" rx="1.5" fill="url(#vk-b)" stroke="#1a1410" stroke-width=".7"/>`;
const VK_DIAL = `<g class="vk-bolts" fill="#8d97a3" stroke="#1a1410" stroke-width=".5">${VK_BOLTS}</g>`;
const VK_HUB = (tier: Tier) =>
  `<circle class="vk-hub" cx="30" cy="30" r="9.5" fill="#120d0c" stroke="url(#vk-b)" stroke-width="2"/><g class="vk-glyph" transform="translate(30 30)" stroke="#1a1410" stroke-width=".8" stroke-linejoin="round">${VK_GLYPH[tier]}</g><text class="vk-num" x="30" y="30" text-anchor="middle" dominant-baseline="central">${VK_NUM[tier]}</text>`;
const VK_SLOT = (tier: Tier) =>
  `<rect class="vk-plate" x="23" y="46" width="14" height="7" rx="1.5" fill="#120d0c" stroke="url(#vk-b)" stroke-width="1"/><rect class="vk-slot" x="27.5" y="48" width="7.5" height="3" rx=".6"/><g class="vk-glyph" transform="translate(25.3 49.5) scale(.22)">${VK_GLYPH[tier]}</g>`;

/** Face center is (32.5, 32). The ring is drawn at (30, 30); this shift sits the dial on the face. */
const VAULT_DIAL_OPEN = `<g transform="translate(2.5 2)"><circle class="vk-ring" cx="30" cy="30" r="18" fill="url(#vk-d)" stroke-width="1.8"/>`;

export function vaultSvg(tier: Tier) {
  return `<svg class="vk-vault" viewBox="0 0 60 60" aria-hidden="true">${VK_DEFS}${VK_CASE}${VAULT_DIAL_OPEN}${VK_DIAL}${VK_HUB(tier)}${VK_SLOT(tier)}</g></svg>`;
}

/**
 * 0.1.160 painted street vaults: Ryan's approved Gemini plate, cut to one transparent webp per tier
 * (public/sprites/vaults). The painting is finished art, so a painted pin is the wrapper and one <img>: no SVG, no
 * lockbar, no ring and no extra shadow. Cooling and lock-out are a CSS filter on the whole image (styles.css) and
 * the lock-out says so in the title. CSS box, map icon size and the anchor on the shared ground shadow:
 */
export const VAULT_SPRITE = { w: 48, h: 50, anchor: [24, 45] } as const;
/** The code-drawn SVG vault's map box (0.1.102), still used when a print-shop skin or vault paint is worn. */
export const VAULT_SVG_BOX = { w: 40, h: 44, anchor: [20, 40] } as const;

/**
 * A print-shop metal skin or vault paint recolours the code-drawn case (wardrobe.css --vk-*), so a walker wearing
 * one keeps the SVG vault. Stock brass (null, or the shop's "brass" swatch id) shows the paintings.
 * Pass visibleLantern(wornVault, wardrobe.lantern).
 */
export function vaultSkinned(lantern: string | null | undefined): boolean {
  return Boolean(lantern) && lantern !== "brass";
}

export type VaultPinOpts = {
  cooling?: boolean;
  lockout?: boolean;
  /** The worn lantern skin / vault paint id. Any skin but stock brass keeps the skinnable SVG vault. */
  skin?: string | null;
  /** Force the code-drawn SVG vault (the print shop's skin swatches, stock brass included). */
  svg?: boolean;
};

export function vaultPinHtml(poi: Pick<Poi, "tier">, o: VaultPinOpts = {}) {
  if (o.svg || vaultSkinned(o.skin)) {
    // 0.1.107: lock-out is a red rim, red reader and a striped LOCKED bar (text + stripes, not colour alone).
    const lock = o.lockout ? `<span class="vk-lockbar" aria-label="Locked out">LOCKED</span>` : "";
    return `<div class="vault-pin tier-${poi.tier}${o.lockout ? " locked-out" : o.cooling ? " cooling" : ""}"${o.lockout ? ' title="Locked out after a wrong answer"' : ""}>${vaultSvg(poi.tier)}${lock}</div>`;
  }
  const state = o.lockout ? "locked" : o.cooling ? "cooling" : "open";
  const title = `${VK_NUM[poi.tier]} vault${o.lockout ? " · Locked out after a wrong answer" : o.cooling ? " · cooling" : ""}`;
  return `<div class="vault-pin painted-vault-pin tier-${poi.tier} is-${state}${o.lockout ? " locked-out" : o.cooling ? " cooling" : ""}" title="${title}"><img class="vault-sprite" src="/sprites/vaults/${poi.tier}.webp" width="${VAULT_SPRITE.w}" height="${VAULT_SPRITE.h}" alt="" draggable="false" /></div>`;
}

/**
 * 0.1.159 Comet vault: Ryan's approved painted Gemini mock, cut to three transparent sprites (open, cooling,
 * locked). The painting is finished art: nothing is drawn over it (no ring, glyph, lockbar or extra shadow). The
 * root keeps `tier-green` so pinTier and the tier checks read it as a III vault. A wrong-answer lock-out switches to
 * the locked painting and says so in the title; a cleared comet shows the cooling painting until its window ends.
 */
export type CometPinState = "open" | "cooling" | "locked";
export function cometPinState(o: { cooling?: boolean; lockout?: boolean } = {}): CometPinState {
  return o.lockout ? "locked" : o.cooling ? "cooling" : "open";
}
export function cometPinHtml(o: { cooling?: boolean; lockout?: boolean; title?: string } = {}) {
  const state = cometPinState(o);
  const title = (o.title ?? (state === "locked" ? "Comet vault · locked out after a wrong answer" : state === "cooling" ? "Comet vault · cleared, dark until the comet passes" : "Comet vault · open now")).replace(/[<>&"]/g, "");
  return `<div class="vault-pin comet-pin tier-green is-${state}${o.lockout ? " locked-out" : o.cooling ? " cooling" : ""}" title="${title}"><img class="comet-sprite" src="/sprites/comet/${state}.webp" width="48" height="58" alt="" draggable="false" /></div>`;
}

/**
 * 0.1.162 painted shop and sign pins: Ryan's approved Gemini paintings, cut to transparent webps. Each pin is a
 * wrapper plus one <img>, like the Comet pin: nothing is drawn over the painting (no SVG, enamel plate, CSS post,
 * ring or extra shadow). The CSS boxes below are the map sizes; GameMap anchors each foot on the shared shadow.
 */
export const PAINTED_PIN = {
  shop: { src: "/sprites/outfitter.webp", w: 60, h: 56 },
  counter: { src: "/sprites/street-counter.webp", w: 48, h: 60 },
  station: { src: "/sprites/station-sign.webp", w: 44, h: 60 },
  board: { src: "/sprites/notice-sign.webp", w: 44, h: 60 },
} as const;
/** Place names go into a title attribute: drop the characters that could close it. */
const esc = (s: string) => s.replace(/[<>"]/g, "");
const sprite = (k: keyof typeof PAINTED_PIN) =>
  `<img class="${k}-sprite" src="${PAINTED_PIN[k].src}" width="${PAINTED_PIN[k].w}" height="${PAINTED_PIN[k].h}" alt="" draggable="false" />`;

/**
 * Fare desk marker: a station sign, never a lamp. No lantern parts and no tier class, so it
 * can't be mistaken for any tier at a glance. Holding a fare adds `has-fare` and a small "Fare" label under the
 * post, beside the painting, never on it. Cooling dims the whole image (CSS).
 */
export function stationPinHtml(o: { cooling?: boolean; fare?: boolean } = {}) {
  const title = o.fare ? "Station · you hold a fare" : o.cooling ? "Station · the desk is resting" : "Station";
  return `<div class="station-pin painted-station-pin${o.fare ? " has-fare" : ""}${o.cooling ? " cooling" : ""}" title="${title}">${sprite("station")}${o.fare ? `<b class="station-fare">Fare</b>` : ""}</div>`;
}

/** Outfitter: the painted shop front (suit in the window, red and cream awning). */
export function shopPinHtml(name: string) {
  return `<div class="shop-pin painted-shop-pin" title="${esc(name)}">${sprite("shop")}</div>`;
}

/** Street counter: the painted stall with three vault keys on its green sign. Not a lamp. */
export function counterPinHtml(name: string) {
  return `<div class="service-pin counter-pin painted-counter-pin" title="${esc(name)}">${sprite("counter")}</div>`;
}

/** Notice board: the painted oxblood sign with a cream "!". Not a lamp. Unread and errand details stay in the card. */
export function boardPinHtml(name: string) {
  return `<div class="service-pin board-pin painted-board-pin" title="${esc(name)}">${sprite("board")}</div>`;
}

/** Tier class on a marker's root element, or null if it has none. */
export function pinTier(html: string): Tier | null {
  const m = /^<div class="[^"]*\btier-(white|blue|green|amber|red|violet)\b/.exec(html);
  return (m?.[1] as Tier | undefined) ?? null;
}

/**
 * 0.1.110: a placed Hearth vault. 0.1.160: the pin is the approved Hearth painting (hearth.webp), one <img> with
 * nothing drawn over it. The owner's 4 fields moved off the vault into a label under it: the name plate, then the
 * four field names in pick order, each with its field colour dot (name and order mark them, not colour alone).
 * The gems painted on the door are decoration, not the fields. Cooling / lock-out are a filter on the image.
 * Hearth pins are never skinned.
 */
export const HEARTH_SPRITE = { w: 56, h: 61 } as const;
/** Map box: the painting, the name plate and two rows of fields. The anchor is the vault's foot, not the label's. */
export const HEARTH_BOX = { w: 104, h: 104, anchor: [52, 55] } as const;
const hearthImg = `<img class="vault-sprite hearth-sprite" src="/sprites/vaults/hearth.webp" width="${HEARTH_SPRITE.w}" height="${HEARTH_SPRITE.h}" alt="" draggable="false" />`;
const fieldLabel = (c: string) => (TRIVIA_CATS.find((t) => t.id === c)?.label ?? c).replace(/[<>&"]/g, "");

export function hearthPinHtml(name: string, cats: readonly string[], colors: Record<string, string>, o: { cooling?: boolean; lockout?: boolean; polished?: boolean } = {}) {
  const four = cats.slice(0, 4);
  const names = four.map(fieldLabel);
  const fields = four.map((c, i) => `<span class="hp-field" data-field="${c.replace(/[^\w-]/g, "")}"><i class="hp-dot" style="--hf:${colors[c] ?? "#ccc"}"></i>${names[i]}</span>`).join("");
  const safe = name.replace(/[<>&"]/g, "");
  const look = o.lockout ? " locked-out" : `${o.cooling ? " cooling" : ""}${o.polished ? " is-polished" : ""}`;
  const state = o.lockout ? " · Locked out after a wrong answer" : o.cooling ? " · cooling" : "";
  const title = `${safe} · Hearth vault${names.length ? ` · ${names.join(", ")}` : ""}${state}`;
  return `<div class="vault-pin painted-vault-pin tier-red hearth-pin${look}" title="${title}">${hearthImg}<span class="hp-label"><span class="hp-plate">${safe}</span>${fields ? `<span class="hp-fields" aria-label="Fields: ${names.join(", ")}">${fields}</span>` : ""}</span></div>`;
}

/** 0.1.160: the placement preview's vault: the same Hearth painting, no fields yet. */
export function hearthGhostVaultHtml() {
  return `<div class="vault-pin painted-vault-pin tier-red hearth-ghost-vault">${hearthImg}</div>`;
}

/**
 * 0.1.111: the same vault, framed on the face so a square CSS box centers the dial.
 * The viewBox is symmetric around the face center (32.5, 32). Map pins use vaultSvg.
 */
export function vaultSvgCentered(tier: Tier) {
  return `<svg class="vk-vault" viewBox="4.5 4 56 56" aria-hidden="true">${VK_DEFS}${VK_CASE}${VAULT_DIAL_OPEN}${VK_DIAL}${VK_HUB(tier)}${VK_SLOT(tier)}</g></svg>`;
}
