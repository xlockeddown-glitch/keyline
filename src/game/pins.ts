import type { Poi, Tier } from "./types";

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

export function vaultPinHtml(poi: Pick<Poi, "tier">, o: { cooling?: boolean; lockout?: boolean } = {}) {
  // 0.1.107: lock-out is a red rim, red reader and a striped LOCKED bar (text + stripes, not colour alone).
  const lock = o.lockout ? `<span class="vk-lockbar" aria-label="Locked out">LOCKED</span>` : "";
  return `<div class="vault-pin tier-${poi.tier}${o.lockout ? " locked-out" : o.cooling ? " cooling" : ""}"${o.lockout ? ' title="Locked out after a wrong answer"' : ""}>${vaultSvg(poi.tier)}${lock}</div>`;
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

/** Front of a carriage on rails: lamps, windscreen, buffers. Reads as "train" at 20px. */
const TRAIN = `<svg class="station-train" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="15" rx="3.5"/><rect class="pane" x="7.4" y="5" width="9.2" height="5.2" rx="1"/><circle class="eye" cx="8.6" cy="13.6" r="1.25"/><circle class="eye" cx="15.4" cy="13.6" r="1.25"/><path class="rails" d="M8 17.5 5.5 21.5M16 17.5l2.5 4M4 21.5h16"/></svg>`;

/**
 * Fare desk marker: a station sign, never a lamp. No lantern parts and no tier class, so it
 * can't be mistaken for any tier at a glance. `fare` lights it when the player holds a fare.
 */
export function stationPinHtml(o: { cooling?: boolean; fare?: boolean } = {}) {
  return `<div class="station-pin${o.fare ? " has-fare" : ""}${o.cooling ? " cooling" : ""}"><span class="station-sign">${TRAIN}</span><i class="station-post"></i></div>`;
}

/** 0.1.27: the board is an enamel sign built like the station's, with a bold "!" instead of the train. */
const NOTICE = `<svg class="service-glyph board-bang" viewBox="0 0 24 24" aria-hidden="true"><rect x="9.4" y="3" width="5.2" height="12.4" rx="2.6"/><circle cx="12" cy="19.4" r="2.7"/></svg>`;
/** Three matches. The counter sells them, so the sign is a fan of matches, not a stall. */
const CUP = `<svg class="service-glyph" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#ece4d6" stroke-width="1.7" stroke-linecap="round"><path d="M8.2 19 7 8.6M12 19.6V8.2M15.8 19 17 8.6"/></g><circle cx="6.8" cy="6.6" r="2.05" fill="#efe8dc"/><circle cx="12" cy="6.1" r="2.05" fill="#6e8fa8"/><circle cx="17.2" cy="6.6" r="2.05" fill="#cba56c"/></svg>`;

/** Street counter: enamel sign, deep green, a match in a cup. Not a lamp. */
export function counterPinHtml(name: string) {
  return `<div class="service-pin counter-pin" title="${name}"><span class="service-sign">${CUP}</span><i class="service-post"></i></div>`;
}

/** Notice board: enamel sign, ink brown, a posted sheet. Not a lamp. */
export function boardPinHtml(name: string) {
  return `<div class="service-pin board-pin" title="${name}"><span class="service-sign">${NOTICE}</span><i class="service-post"></i></div>`;
}

/** Tier class on a marker's root element, or null if it has none. */
export function pinTier(html: string): Tier | null {
  const m = /^<div class="[^"]*\btier-(white|blue|green|amber|red|violet)\b/.exec(html);
  return (m?.[1] as Tier | undefined) ?? null;
}

/**
 * 0.1.110: a placed Hearth vault: the red (V) vault in copper, the owner's 4 fields as side facets (top-left, top-right,
 * bottom-left, bottom-right in pick order, so position marks them as well as color) and a name plate.
 */
export function hearthPinHtml(name: string, cats: readonly string[], colors: Record<string, string>, o: { cooling?: boolean; lockout?: boolean; polished?: boolean } = {}) {
  const pos = ["tl", "tr", "bl", "br"];
  const facets = cats
    .slice(0, 4)
    .map((c, i) => `<i class="hf hf-${pos[i]}" style="--hf:${colors[c] ?? "#ccc"}" title="${c}"></i>`)
    .join("");
  const lock = o.lockout ? `<span class="vk-lockbar" aria-label="Locked out">LOCKED</span>` : "";
  const safe = name.replace(/[<>&"]/g, "");
  const look = o.lockout ? " locked-out" : `${o.cooling ? " cooling" : ""}${o.polished ? " is-polished" : ""}`;
  return `<div class="vault-pin tier-red hearth-pin${look}" title="${safe} · Hearth vault">${facets}${vaultSvg("red")}${lock}<span class="hp-plate">${safe}</span></div>`;
}

/**
 * 0.1.111: the same vault, framed on the face so a square CSS box centers the dial.
 * The viewBox is symmetric around the face center (32.5, 32). Map pins use vaultSvg.
 */
export function vaultSvgCentered(tier: Tier) {
  return `<svg class="vk-vault" viewBox="4.5 4 56 56" aria-hidden="true">${VK_DEFS}${VK_CASE}${VAULT_DIAL_OPEN}${VK_DIAL}${VK_HUB(tier)}${VK_SLOT(tier)}</g></svg>`;
}
