/**
 * 0.1.117 Double and Triple Hearth vaults (Ryan). A Hearth comes in three versions, chosen once when it's placed
 * (`v` on the placed row; a row without one is 1, Single):
 *   Single  one question, red (V), as before.
 *   Double  green, then amber from the 3 fields left. The 2nd question's coin +25%.
 *   Triple  green, amber, then red from the 2 fields left. 2nd +25%, 3rd +50%.
 * Each right answer pays its own tier's lamp coin (boosted); the tier key comes back (the prize) only on the last
 * question. One key of the first tier is spent, on the first deal. A miss ends the run and locks the vault out.
 * The server chains the steps through its own sealed tokens (step, used fields); client claims are ignored.
 * Pure; no store, no sql.
 */
import type { Tier } from "./types";

export type HearthVersion = 1 | 2 | 3;
export const HEARTH_VERSIONS: readonly HearthVersion[] = [1, 2, 3];
export const HEARTH_VERSION_NAME: Record<HearthVersion, string> = { 1: "Single", 2: "Double", 3: "Triple" };
export const HEARTH_TIERS: Record<HearthVersion, readonly Tier[]> = { 1: ["red"], 2: ["green", "amber"], 3: ["green", "amber", "red"] };
/** Coin multiplier per question (coins only, on top of the tier pay). */
export const HEARTH_BOOST: Record<HearthVersion, readonly number[]> = { 1: [1], 2: [1, 1.25], 3: [1, 1.25, 1.5] };

/** A stored or sent version; anything else (missing, old rows) is Single. */
export function hearthVersion(v: unknown): HearthVersion {
  return v === 2 || v === 3 ? v : 1;
}
export const hearthSteps = (v: HearthVersion) => HEARTH_TIERS[v].length;
export function hearthTierAt(v: HearthVersion, step: number): Tier {
  const t = HEARTH_TIERS[v];
  return t[Math.min(Math.max(0, step), t.length - 1)]!;
}
/** The key a visitor spends to start: the first question's tier. */
export const hearthCost = (v: HearthVersion): Tier => hearthTierAt(v, 0);
export function hearthBoost(v: HearthVersion, step: number): number {
  return HEARTH_BOOST[v][step] ?? 1;
}
export const hearthLast = (v: HearthVersion, step: number) => step + 1 >= hearthSteps(v);

/** Boost line on the reward ("Double Hearth, 2nd question +25%"), or null when there's none. */
export function hearthBoostLabel(v: HearthVersion, step: number): string | null {
  const b = hearthBoost(v, step);
  if (b <= 1) return null;
  return `${HEARTH_VERSION_NAME[v]} Hearth, ${step === 1 ? "2nd" : "3rd"} question +${Math.round((b - 1) * 100)}%`;
}

/** What the previous sealed token says about the run. */
export type HearthLink = { pi: string; hv: number; hs: number; cat: string; hu: readonly string[] };
export type HearthNext = { step: number; used: string[] } | { refused: "chain" | "done" | "used" };

/**
 * The next step of a run from the previous question's token: the same vault and version, a step still to play, and
 * a field not used yet this run. (The caller checks that the previous answer was right, and that `cat` is one of
 * the vault's fields.)
 */
export function hearthNext(prev: HearthLink, poiId: string, v: HearthVersion, cat: string, cats: readonly string[]): HearthNext {
  if (prev.pi !== poiId || hearthVersion(prev.hv) !== v || !Number.isInteger(prev.hs) || prev.hs < 0) return { refused: "chain" };
  const step = prev.hs + 1;
  if (step >= hearthSteps(v)) return { refused: "done" };
  const used = [...prev.hu, prev.cat];
  if (slotUsed(cats, used, cat)) return { refused: "used" };
  return { step, used };
}

/** The vault's slot a field plays in: its own, or Math's when it stands in for Math (hearthOffer). */
export const slotOf = (cats: readonly string[], cat: string) => (cats.includes(cat) ? cat : "math");
/** Is this field's slot already used this run? (A Math stand-in and Math share one slot.) */
export function slotUsed(cats: readonly string[], used: readonly string[], cat: string): boolean {
  const s = slotOf(cats, cat);
  return used.some((u) => slotOf(cats, u) === s);
}

/** The placement picker's line under the version chips. */
export function versionLine(v: HearthVersion): string {
  if (v === 1) return "One field, one question at V. Spends a V key.";
  return `${v === 2 ? "Two" : "Three"} questions, a new field each time (${v === 2 ? "3" : "3, then 2"} left to pick from). Spends a III key; the prize is the last tier's key.`;
}
