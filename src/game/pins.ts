import type { SeriesDef } from "./data";
import type { Poi, Tier } from "./types";

/**
 * Street marker markup. The tier class must come from the same field the store checks for
 * "Need a X match": poi.tier for lamps, series.cost for The Run / The Stack.
 * (v0.0.18: the Run marker was hard-coded tier-amber while it costs a blue match.)
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
const VK_NUM: Record<Tier, string> = { white: "I", blue: "II", green: "III", amber: "IV", red: "V", violet: "VI" };
const VK_DEFS = `<defs><linearGradient id="vk-f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d8794"/><stop offset=".5" stop-color="#4c5561"/><stop offset="1" stop-color="#2b3139"/></linearGradient><linearGradient id="vk-s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22272f"/><stop offset="1" stop-color="#3b424c"/></linearGradient><radialGradient id="vk-d" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#9aa4b0"/><stop offset=".6" stop-color="#58616d"/><stop offset="1" stop-color="#30363f"/></radialGradient><linearGradient id="vk-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d38a"/><stop offset=".5" stop-color="#b8913f"/><stop offset="1" stop-color="#6e5320"/></linearGradient></defs>`;
const VK_BOLTS = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4;
  return `<circle cx="${(30 + Math.cos(a) * 14.5).toFixed(1)}" cy="${(30 + Math.sin(a) * 14.5).toFixed(1)}" r="1.5"/>`;
}).join("");

export function vaultSvg(tier: Tier) {
  return `<svg class="vk-vault" viewBox="0 0 60 60" aria-hidden="true">${VK_DEFS}<path d="M9 9 l-5 4 v40 l5 2z" fill="url(#vk-s)" stroke="#1a1410" stroke-width="1"/><rect x="9" y="7" width="47" height="50" rx="4" fill="url(#vk-f)" stroke="#1a1410" stroke-width="1.2"/><rect x="11.5" y="9.5" width="42" height="45" rx="3" fill="none" stroke="url(#vk-b)" stroke-width="1.6"/><rect x="14" y="4" width="37" height="4" rx="1.5" fill="url(#vk-b)" stroke="#1a1410" stroke-width=".7"/><circle class="vk-ring" cx="30" cy="30" r="18" fill="url(#vk-d)" stroke-width="1.8"/><g class="vk-bolts" fill="#8d97a3" stroke="#1a1410" stroke-width=".5">${VK_BOLTS}</g><circle cx="30" cy="29" r="9.5" fill="#120d0c" stroke="url(#vk-b)" stroke-width="2"/><g class="vk-glyph" transform="translate(30 29)" stroke="#1a1410" stroke-width=".8" stroke-linejoin="round">${VK_GLYPH[tier]}</g><text class="vk-num" x="30" y="31.4" text-anchor="middle">${VK_NUM[tier]}</text><rect x="23" y="46" width="14" height="7" rx="1.5" fill="#120d0c" stroke="url(#vk-b)" stroke-width="1"/><rect class="vk-slot" x="27.5" y="48" width="7.5" height="3" rx=".6"/><g class="vk-glyph" transform="translate(25.3 49.5) scale(.22)">${VK_GLYPH[tier]}</g></svg>`;
}

export function vaultPinHtml(poi: Pick<Poi, "tier">, o: { cooling?: boolean } = {}) {
  return `<div class="vault-pin tier-${poi.tier}${o.cooling ? " cooling" : ""}">${vaultSvg(poi.tier)}</div>`;
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

/** 0.0.93: the Quest Board. Gold sign; glows with a "!" when goals are new or ready to collect. */
export function questPinHtml(name: string, alert: boolean) {
  return `<div class="service-pin board-pin quest-pin${alert ? " is-alert" : ""}" data-quest="1" title="${name}"><b class="quest-bang" aria-hidden="true">!</b><span class="service-sign">${NOTICE}</span><i class="service-post"></i></div>`;
}

/** Notice board: enamel sign, ink brown, a posted sheet. Not a lamp. */
export function boardPinHtml(name: string) {
  return `<div class="service-pin board-pin" title="${name}"><span class="service-sign">${NOTICE}</span><i class="service-post"></i></div>`;
}

/**
 * 0.1.103 ladder art (Ryan, Option A): a ladder is a column of small vaults between brass rails, opened bottom to
 * top, one per trivia card, with a PAYS plaque on top (payout glyph + numeral, the word inside the plaque so it never
 * clips). Every rung carries its number and the cost tier's glyph, so colour is never the only cue. States: cleared
 * (lit + check), current (white outline + glow), locked (dim + padlock), perfect (glint + sparkles; static under
 * reduced motion). On the map nothing is in progress, so rungs stay lit in the tier colour with rung 1 current; at
 * low zoom (.map-far) numbers, bolts and locks drop out and the glyphs stay big.
 */
const TIER_NUM: Record<Tier, string> = { white: "I", blue: "II", green: "III", amber: "IV", red: "V", violet: "VI" };
export type LadderView = { cleared?: number; current?: number | null; perfect?: boolean; map?: boolean };

export function ladderColumnSvg(s: Pick<SeriesDef, "kind" | "cost" | "pay" | "steps">, v: LadderView = {}) {
  const n = s.steps;
  const cleared = Math.max(0, Math.min(n, v.cleared ?? 0));
  const current = v.current === undefined ? (cleared < n ? cleared : null) : v.current;
  const RH = 24;
  const top = 26;
  const H = top + n * RH + 8;
  let rungs = "";
  for (let i = 0; i < n; i++) {
    const y = top + (n - 1 - i) * RH;
    const st = i < cleared ? "done" : i === current ? "cur" : v.map ? "ready" : "next";
    rungs += `<g class="lc-rung is-${st}" transform="translate(5 ${y})"><rect class="lc-box" x="0" y="0" width="38" height="${RH - 3}" rx="3"/><rect class="lc-trim" x="1.6" y="1.6" width="34.8" height="${RH - 6.2}" rx="2"/><circle class="lc-dial" cx="12" cy="${(RH - 3) / 2}" r="8"/><g class="lc-glyph" transform="translate(12 ${(RH - 3) / 2}) scale(.95)">${VK_GLYPH[s.cost]}</g>${v.map ? `<g class="lc-glyph lc-far" transform="translate(19 ${(RH - 3) / 2}) scale(1.25)">${VK_GLYPH[s.cost]}</g>` : ""}<text class="lc-num" x="31" y="${(RH - 3) / 2 + 4.6}" text-anchor="middle">${i + 1}</text>${
      st === "done" ? `<path class="lc-check" d="M19.5 10.5 l2.5 2.5 l5 -5.5"/>` : ""
    }${st === "next" ? `<g class="lc-lock"><rect x="19.5" y="9" width="7" height="5.5" rx="1"/><path d="M21 9 v-1.8 a2 2 0 0 1 4 0 v1.8"/></g>` : ""}</g>`;
  }
  const plaque = `<g class="lc-pays" transform="translate(24 12)"><rect x="-21" y="-10" width="42" height="20" rx="4"/><text class="lc-pays-word" x="-9" y="3.6" text-anchor="middle">PAYS</text><g class="lc-pay-glyph" transform="translate(8 0) scale(.62)" style="fill:var(--pay)">${VK_GLYPH[s.pay]}</g><text class="lc-pay-num" x="16.5" y="3.4" text-anchor="middle" style="fill:var(--pay)">${TIER_NUM[s.pay]}</text></g>`;
  const glint = v.perfect
    ? `<g class="lc-perfect"><clipPath id="lc-c${n}"><rect x="0" y="0" width="48" height="${H}" rx="4"/></clipPath><g clip-path="url(#lc-c${n})"><rect class="lc-glint" x="-48" y="0" width="144" height="${H}"/></g>${[[6, 28], [42, 50], [38, H - 18], [8, H - 40]].map(([x, y]) => `<path class="lc-spark" transform="translate(${x} ${y})" d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3z"/>`).join("")}</g>`
    : "";
  return `<svg class="ladder-col rungs-${n}${v.perfect ? " is-perfect" : ""}" viewBox="0 0 48 ${H}" width="48" height="${H}" aria-hidden="true" style="--pay:var(--color-vault-${s.pay})">${VK_DEFS}<defs><linearGradient id="lc-g" x1="0" y1="0" x2="1" y2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect class="lc-rail" x="1" y="20" width="4" height="${H - 21}" rx="1.5"/><rect class="lc-rail" x="43" y="20" width="4" height="${H - 21}" rx="1.5"/>${rungs}${plaque}${glint}</svg>`;
}

/** Kept for any caller that still wants the bare ladder art (map pins use seriesPinHtml). */
export function ladderLampHtml(kind: SeriesDef["kind"]) {
  return ladderColumnSvg(SERIES_SHAPE[kind], { map: true });
}

const SERIES_SHAPE: Record<SeriesDef["kind"], Pick<SeriesDef, "kind" | "cost" | "pay" | "steps">> = {
  climb: { kind: "climb", cost: "white", pay: "blue", steps: 3 },
  run: { kind: "run", cost: "blue", pay: "green", steps: 3 },
  stack: { kind: "stack", cost: "green", pay: "amber", steps: 4 },
};

export function seriesPinHtml(s: Pick<SeriesDef, "kind" | "cost"> & Partial<Pick<SeriesDef, "pay" | "steps">>) {
  const shape = { ...SERIES_SHAPE[s.kind], ...s } as Pick<SeriesDef, "kind" | "cost" | "pay" | "steps">;
  return `<div class="vault-pin is-ladder is-${s.kind} tier-${s.cost}">${ladderColumnSvg(shape, { map: true })}</div>`;
}

/** Tier class on a marker's root element, or null if it has none. */
export function pinTier(html: string): Tier | null {
  const m = /^<div class="[^"]*\btier-(white|blue|green|amber|red|violet)\b/.exec(html);
  return (m?.[1] as Tier | undefined) ?? null;
}
