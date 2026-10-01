/**
 * Map marks taken out of the game (they turned out not to exist). Saves still name them, so:
 * - `replacedBy` moves a save's progress to the real place that took the slot;
 * - every retired id keeps its city and kind, so survey counts players already earned don't drop.
 * Pure: no store, no DOM.
 */
import type { CityId, PoiKind } from "./types.ts";

export type RetiredPoi = { cityId: CityId; kind: PoiKind; name: string; replacedBy?: string };

/** 0.0.31: unverifiable Temple marks. Real equivalents replace three; the rest are gone. */
export const RETIRED_POIS: Record<string, RetiredPoi> = {
  "cannon-pk": { cityId: "temple", kind: "park", name: "Cannon Park", replacedBy: "jones-pk-t" },
  "ave-a-depot": { cityId: "temple", kind: "landmark", name: "Avenue A Plaza", replacedBy: "santa-fe-plaza" },
  "railroad-park-t": { cityId: "temple", kind: "park", name: "Railroad Park", replacedBy: "santa-fe-plaza" },
  "midtown-temple": { cityId: "temple", kind: "landmark", name: "Midtown Crossing" },
  "south-1st-green": { cityId: "temple", kind: "park", name: "South 1st Green" },
  "keefer-pk": { cityId: "temple", kind: "park", name: "Keefer Park" },
  "veterans-pk-t": { cityId: "temple", kind: "park", name: "Veterans Park — Temple" },
};

/** The live id a saved id now means: its replacement, itself, or null if the mark is gone. */
export function livePoiId(id: string): string | null {
  const r = RETIRED_POIS[id];
  if (!r) return id;
  return r.replacedBy ?? null;
}

type IdBits = {
  atlas?: Record<string, true>;
  vaults?: Record<string, unknown>;
  contract?: { ids: string[]; done: string[] } | null;
  sparkLamps?: string[];
};

const uniq = (xs: string[]) => [...new Set(xs)];

/**
 * Rewrite retired POI ids in a loaded save. Atlas keeps retired entries (they still count as
 * visited) and gains the replacement; vault cooldowns and sparks follow the replacement; a contract
 * drops gone marks, and is cleared (reseeded later) if nothing is left of it.
 */
export function migratePoiIds<S extends IdBits>(save: S): S {
  const out: S = { ...save };
  if (save.atlas) {
    const atlas = { ...save.atlas };
    for (const id of Object.keys(save.atlas)) {
      const live = livePoiId(id);
      if (live && live !== id) atlas[live] = true;
    }
    out.atlas = atlas;
  }
  if (save.vaults) {
    const vaults: Record<string, unknown> = {};
    for (const [id, v] of Object.entries(save.vaults)) {
      const live = livePoiId(id);
      if (live && !(live in vaults && live !== id)) vaults[live] = v;
    }
    out.vaults = vaults as S["vaults"];
  }
  if (Array.isArray(save.sparkLamps)) {
    out.sparkLamps = uniq(save.sparkLamps.map(livePoiId).filter((x): x is string => Boolean(x)));
  }
  if (save.contract) {
    const map = (xs: string[]) => uniq((xs ?? []).map(livePoiId).filter((x): x is string => Boolean(x)));
    const ids = map(save.contract.ids);
    const done = map(save.contract.done).filter((d) => ids.includes(d));
    out.contract = ids.length && done.length < ids.length ? { ids, done } : null;
  }
  return out;
}
