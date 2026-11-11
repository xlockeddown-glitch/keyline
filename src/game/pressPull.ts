/**
 * 0.1.153 weekly press pull. One recolor a week, the same offer for every player,
 * 25,000 coin, bought once. It is a coat dye or a vault-case paint the vat already mixes.
 * Missing the week drops that offer. It does not change pay, keys, or trivia.
 *
 * The week starts Monday 00:00 UTC. The offer is the week number walking the existing
 * paint colours, coat then vault, so it never needs a new sprite.
 */
import { PAINT_COLORS, type PaintColor } from "./ingredients.ts";
import { isCoat, isLanternSkin } from "./cosmetics.ts";
import type { PaintJob } from "./paint.ts";

export const PRESS_PULL_PRICE = 25_000;
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const JOBS: PaintJob[] = ["coat", "vault"];

export type PressPull = { week: number; job: PaintJob; color: PaintColor };

/** Monday 00:00 UTC of the week that contains `at`. */
export function pressMonday(at: number): number {
  const utc = Date.UTC(new Date(at).getUTCFullYear(), new Date(at).getUTCMonth(), new Date(at).getUTCDate());
  const sinceMon = (new Date(utc).getUTCDay() + 6) % 7;
  return utc - sinceMon * DAY;
}

export function pressWeek(at: number): number {
  return Math.floor(pressMonday(at) / WEEK);
}

export function pressKey(week: number): string {
  return `pull:${week}`;
}

/** The one pull on sale during the week that contains `at`. */
export function pressOffer(at: number): PressPull {
  const week = pressWeek(at);
  const n = PAINT_COLORS.length * JOBS.length;
  const i = ((week % n) + n) % n;
  return { week, job: JOBS[i % JOBS.length]!, color: PAINT_COLORS[Math.floor(i / JOBS.length)]! };
}

/** A coat pull needs a print-shop coat. A vault pull needs a vault skin. Stock steel is not one. */
export function pullBaseOwned(owned: readonly string[], job: PaintJob): boolean {
  return owned.some((id) => (job === "coat" ? isCoat(id) : isLanternSkin(id)));
}
