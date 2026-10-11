import { TIER_LABEL } from "./data.ts";
import type { Poi, Tier, VaultRuntime } from "./types.ts";

/** Places that are not street vaults: the outfitter, and the train station. */
function isVault(p: Poi) {
  return p.kind !== "shop" && p.kind !== "station" && p.kind !== "counter" && p.kind !== "board";
}

/**
 * Field-bag copy for one match colour. Counts this city's vaults of that colour
 * the walker has been to — not a list of their names.
 */
export function vaultColorNote(
  pois: readonly Poi[],
  tier: Tier,
  cityName: string,
  atlas: Record<string, unknown>,
  vaults: Record<string, Pick<VaultRuntime, "coolUntil"> | undefined>,
  now: number,
): string {
  const color = TIER_LABEL[tier].toLowerCase();
  const ofColor = pois.filter((p) => p.tier === tier && isVault(p));
  const total = ofColor.length;
  const word = total === 1 ? "vault" : "vaults";
  if (total === 0) return `No ${color} vaults in ${cityName}.`;
  const been = ofColor.filter((p) => Boolean(atlas[p.id]) || Boolean(vaults[p.id]));
  if (been.length === 0) {
    return `${total} ${color} ${word} in ${cityName}. You haven't been to one.`;
  }
  const lit = been.filter((p) => vaults[p.id]);
  const recasting = lit.filter((p) => (vaults[p.id]?.coolUntil ?? 0) > now);
  const head = `Been to ${been.length} of ${total} ${color} ${word} in ${cityName}.`;
  if (lit.length === 0) return `${head} None lit.`;
  if (recasting.length === 0) return `${head} ${lit.length} lit.`;
  if (recasting.length === lit.length) {
    return lit.length === 1 ? `${head} 1 lit, still recasting.` : `${head} ${lit.length} lit, all recasting.`;
  }
  return `${head} ${lit.length} lit, ${recasting.length} recasting.`;
}
