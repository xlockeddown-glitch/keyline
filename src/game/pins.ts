import type { SeriesDef } from "./data";
import type { Poi, Tier } from "./types";

/**
 * Street marker markup. The tier class must come from the same field the store checks for
 * "Need a X match": poi.tier for lamps, series.cost for The Run / The Stack.
 * (v0.0.18: the Run marker was hard-coded tier-amber while it costs a blue match.)
 */
const LANTERN = `<span class="lantern"><i class="lantern-cap"></i><i class="lantern-frame"><i class="lantern-glass"><i class="lantern-flick"></i></i></i><i class="lantern-post"></i></span>`;
const STACK_LAMP = `<span class="stack-lamp"><i class="lantern-cap"></i><i class="stack-globe a"><i class="lantern-glass"><i class="lantern-flick"></i></i></i><i class="stack-globe b"><i class="lantern-glass"><i class="lantern-flick"></i></i></i><i class="lantern-post"></i></span>`;

export function vaultPinHtml(poi: Pick<Poi, "tier">, o: { cooling?: boolean } = {}) {
  return `<div class="vault-pin tier-${poi.tier}${o.cooling ? " cooling" : ""}">${LANTERN}</div>`;
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

export function seriesPinHtml(s: Pick<SeriesDef, "kind" | "cost">) {
  return s.kind === "stack"
    ? `<div class="vault-pin is-stack tier-${s.cost}">${STACK_LAMP}</div>`
    : `<div class="vault-pin is-run tier-${s.cost}">${LANTERN}</div>`;
}

/** Tier class on a marker's root element, or null if it has none. */
export function pinTier(html: string): Tier | null {
  const m = /^<div class="[^"]*\btier-(white|blue|green|amber|red|violet)\b/.exec(html);
  return (m?.[1] as Tier | undefined) ?? null;
}
