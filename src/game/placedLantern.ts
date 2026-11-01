/**
 * 0.1.99 placed lantern, slice 1: the unlock. A perfect clear of The Stack (the green ladder: every card graded
 * "perfect", ≤ 3 s, on the server clock) writes one `plantok` ledger row on the player. Pure rules here; the
 * reads and writes are in walletApply.ts (notePlantUnlock, plantUnlocked).
 */
import { STACK_ID } from "./data.ts";
import { PRIZE_TAG } from "./ladderPrize.ts";

export const PLANT_OK_KEY = "plantok";

type Detail = { g?: string; pi?: string; boosts?: unknown };

function parse(detail: string): Detail | null {
  try {
    const d = JSON.parse(detail) as unknown;
    return d && typeof d === "object" ? (d as Detail) : null;
  } catch {
    return null;
  }
}

/** True when every grade on a finished ladder is perfect (the same test wallet.ts uses for the prize). */
export function perfectStackClear(series: string | null | undefined, step: number, steps: number, grades: readonly string[]): boolean {
  return series === "stack" && step + 1 >= steps && grades.length >= steps && grades.every((g) => g === "perfect");
}

/**
 * Back-fill: find a past perfect Stack in a player's `grade:` rows. One exact signal, nothing guessed: since 0.1.36
 * the last card of a perfect ladder carries the "Perfect ladder: …" boost, and a Stack card's row has
 * `pi: "__stack__"`. Older clears can't be told apart: grade rows don't record the step, so a pv chain of four
 * perfect Stack cards can span two different Stacks (one that failed later), and that is not proof.
 * Returns the op_key of the row that proves it, or null.
 */
export function findPerfectStack(rows: readonly { op_key: string; detail: string }[]): string | null {
  for (const r of rows) {
    if (!r.op_key.startsWith("grade:")) continue;
    const d = parse(r.detail);
    if (!d || d.pi !== STACK_ID || d.g !== "perfect") continue;
    if (Array.isArray(d.boosts) && d.boosts.some((b) => typeof b === "string" && b.startsWith(`${PRIZE_TAG}:`))) return r.op_key;
  }
  return null;
}
