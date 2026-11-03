/**
 * 0.1.110: placed Hearth vaults as map vaults. The client registry (filled from fetchPlaced) feeds livePois, so a
 * Hearth vault opens, cools and locks out like any lamp. Plays as red. Pure; no store imports.
 */
import type { CityId, Poi } from "./types";
import { PLANT_NAMES, type PlantCat } from "./placedLantern.ts";

export const HEARTH_PREFIX = "placed-";
/** Facet colors by field; position (top-left, top-right, bottom-left, bottom-right, as the card grid reads) is the pick order. */
export const FACET_COLOR: Record<string, string> = {
  local: "#f2d27a", history: "#5ea8ff", science: "#4fd27a", music: "#a87cff", sports: "#ff8a4c", food: "#ff6f91",
  books: "#c9a27a", arts: "#ff5c5c", political: "#9aa7b8", celebrity: "#ffd84d", games: "#3fd6d0", nature: "#8fcf5a",
  geography: "#5fc4ff", math: "#e6e6e6",
};
export const FACET_POS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

/** What anyone sees of a placed vault (no owner id). */
export type HearthView = { id: string; city: string; lat: number; lng: number; name: number; cats: PlantCat[]; by: string; mine?: boolean };

/** Stable public id from the owner id (FNV-1a, base 36). */
export function placedId(owner: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < owner.length; i++) h = Math.imul(h ^ owner.charCodeAt(i), 0x01000193);
  return HEARTH_PREFIX + (h >>> 0).toString(36);
}
export const isHearthId = (id: string) => id.startsWith(HEARTH_PREFIX);

export function hearthPoi(v: HearthView): Poi {
  return { id: v.id, name: PLANT_NAMES[v.name] ?? "Hearth vault", kind: "landmark", tier: "red", lat: v.lat, lng: v.lng, lore: `Placed by ${v.by.replace(/\.$/, "")}.`, noClue: true };
}

// One registry per page even if the module loads under two specifiers (dev imports with and without ".ts").
type Reg = { byCity: Map<string, HearthView[]>; pois: Map<string, Poi[]> };
const g = globalThis as { __keylineHearths?: Reg };
const reg: Reg = (g.__keylineHearths ??= { byCity: new Map(), pois: new Map() });
export function setHearths(city: string, list: HearthView[]) {
  reg.byCity.set(city, list);
  reg.pois.set(city, list.map(hearthPoi));
}
export const hearthPois = (city: CityId | string): Poi[] => reg.pois.get(city) ?? [];
export function hearthOf(id: string): HearthView | null {
  for (const l of reg.byCity.values()) for (const v of l) if (v.id === id) return v;
  return null;
}
