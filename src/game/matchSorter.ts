/**
 * Match sorter: matches of the six tiers tumble down the carriage window in waves; sort each
 * into its tier box before it hits the floor. Pure — no store, no DOM — so node tests run it.
 * Colour is never the only cue: every match and box carries its tier rank as 1–6 pips.
 */
import { SORT_FIRST_MS, SORT_TOTAL, SORT_WAVE_PAUSE_MS, SORT_WAVES, seededRng, type RideOutcome } from "./rideGames.ts";

export { SORT_ROUND_MS, SORT_TOTAL, SORT_WAVES, sorterRoundMs } from "./rideGames.ts";
import type { Tier } from "./types.ts";

export const SORT_TIERS: readonly Tier[] = ["white", "blue", "green", "amber", "red", "violet"];
/** Tier rank, 1 white … 6 violet. Same count as the vault rank pips. */
export const SORT_RANK: Record<Tier, number> = { white: 1, blue: 2, green: 3, amber: 4, red: 5, violet: 6 };

/** Sort at least this share of all matches into the right box to win. */
export const SORT_WIN = 0.7;

export type SortMatch = { id: number; tier: Tier; wave: number; at: number; fallMs: number; lane: number };
/** Columns matches fall in. */
export const SORT_LANES = 5;

/** Every match in the round, in drop order. Timing is fixed; only the tiers follow the seed. */
export function sorterSchedule(seed: number): SortMatch[] {
  const rnd = seededRng(seed * 13 + 7);
  const out: SortMatch[] = [];
  let at = SORT_FIRST_MS;
  let id = 0;
  SORT_WAVES.forEach((w, wave) => {
    // Each wave deals from a shuffled set of the six tiers so every box gets used; waves over six add random repeats.
    const shuffle = (xs: Tier[]) => {
      for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [xs[i], xs[j]] = [xs[j]!, xs[i]!];
      }
      return xs;
    };
    const bag = shuffle([...SORT_TIERS]).slice(0, Math.min(SORT_TIERS.length, w.count));
    while (bag.length < w.count) bag.push(SORT_TIERS[Math.floor(rnd() * SORT_TIERS.length)]!);
    shuffle(bag);
    for (let i = 0; i < w.count; i++) {
      out.push({ id: id++, tier: bag[i]!, wave, at: Math.round(at), fallMs: w.fallMs, lane: Math.floor(rnd() * SORT_LANES) });
      if (i < w.count - 1) at += w.gapMs;
    }
    at += SORT_WAVE_PAUSE_MS;
  });
  return out;
}

/** 0 at the drop, 1 at the floor. */
export function fallProgress(m: SortMatch, t: number) {
  return (t - m.at) / m.fallMs;
}

/** Matches in the air at time t (dropped, not on the floor, not yet sorted), lowest first. */
export function inAir(ms: readonly SortMatch[], done: ReadonlySet<number>, t: number): SortMatch[] {
  return ms
    .filter((m) => !done.has(m.id) && t >= m.at && fallProgress(m, t) < 1)
    .sort((a, b) => fallProgress(b, t) - fallProgress(a, t));
}

export type SortTally = { total: number; right: number; wrong: number; missed: number; streak: number };

export function sortAccuracy(t: Pick<SortTally, "total" | "right">) {
  return t.total > 0 ? Math.min(1, t.right / t.total) : 0;
}

/** A full round with every match in the right box. */
export function sortPerfect(t: Pick<SortTally, "total" | "right" | "wrong" | "missed">) {
  return t.total >= SORT_TOTAL && t.right >= t.total && t.wrong === 0 && t.missed === 0;
}

/** Win at 70% sorted right; perf runs 0 → 1 from there to a clean sheet, which is also perfect. */
export function sortOutcome(t: Pick<SortTally, "total" | "right" | "wrong" | "missed">): RideOutcome {
  const acc = sortAccuracy(t);
  if (t.total > 0 && acc >= SORT_WIN) {
    const perf = Math.min(1, Math.max(0, (acc - SORT_WIN) / (1 - SORT_WIN)));
    return sortPerfect(t) ? { kind: "won", perf, perfect: true } : { kind: "won", perf };
  }
  return { kind: "played" };
}

/** End-of-round line, in the conductor's voice. */
export function sortVerdict(t: Pick<SortTally, "total" | "right" | "wrong" | "missed">) {
  const of = `${t.right} of ${t.total} sorted.`;
  if (sortPerfect(t)) return `${of} Not one in the wrong box.`;
  const acc = sortAccuracy(t);
  if (acc >= SORT_WIN) return `${of} The matchbook's in order.`;
  if (t.missed > t.wrong) return `${of} Too many hit the floor.`;
  return `${of} A few landed in the wrong box.`;
}
