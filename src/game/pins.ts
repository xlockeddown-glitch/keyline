import type { SeriesDef } from "./data";
import type { Poi, Tier } from "./types";

/**
 * Street marker markup. The tier class must come from the same field the store checks for
 * "Need a X match": poi.tier for lamps, series.cost for The Run / The Stack.
 * (v0.0.18: the Run marker was hard-coded tier-amber while it costs a blue match.)
 */
const LANTERN = `<span class="lantern"><i class="lantern-cap"></i><i class="lantern-frame"><i class="lantern-glass"></i></i><i class="lantern-post"></i></span>`;
const STACK_LAMP = `<span class="stack-lamp"><i class="lantern-cap"></i><i class="stack-globe a"><i class="lantern-glass"></i></i><i class="stack-globe b"><i class="lantern-glass"></i></i><i class="lantern-post"></i></span>`;

export function vaultPinHtml(poi: Pick<Poi, "tier">, o: { cooling?: boolean; desk?: boolean; lit?: boolean } = {}) {
  return `<div class="vault-pin tier-${poi.tier}${o.cooling ? " cooling" : ""}${o.desk ? " is-desk" : ""}${o.lit ? " is-fare" : ""}">${LANTERN}${o.desk ? `<i class="fare-stub"></i>` : ""}</div>`;
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
