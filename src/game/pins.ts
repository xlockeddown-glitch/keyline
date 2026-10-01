import type { SeriesDef } from "./data";
import type { Poi, Tier } from "./types";

/**
 * Street marker markup. The tier class must come from the same field the store checks for
 * "Need a X match": poi.tier for lamps, series.cost for The Run / The Stack.
 * (v0.0.18: the Run marker was hard-coded tier-amber while it costs a blue match.)
 */
const LANTERN = `<span class="lantern"><i class="lantern-cap"></i><i class="lantern-frame"><i class="lantern-glass"></i></i><i class="lantern-post"></i></span>`;
const STACK_LAMP = `<span class="stack-lamp"><i class="lantern-cap"></i><i class="stack-globe a"><i class="lantern-glass"></i></i><i class="stack-globe b"><i class="lantern-glass"></i></i><i class="lantern-post"></i></span>`;

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
