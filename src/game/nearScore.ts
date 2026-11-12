import type { NearReveal } from "./types";

/**
 * 0.1.158 Closest Number scoring (Ryan's sliding scale). Client-safe: no answers here, just the maths the server
 * grades with and the reveal line the pops show.
 *
 * Pay slides from ×1 on the dot to ×0 at 25% relative error. The grade word comes from that multiplier
 * (exact: perfect, within 7.5%: great, otherwise good); the multiplier itself is never snapped to a band.
 */
export const NEAR_ZERO_AT = 0.25;
/** Extra answer time on a Closest Number card, for typing. */
export const NEAR_EXTRA_MS = 8000;

export type NearGrade = { offPct: number; mult: number; correct: boolean; grade: "perfect" | "great" | "good" | null };

export function nearScore(guess: number, value: number): NearGrade {
  if (!Number.isFinite(guess) || !Number.isFinite(value)) return { offPct: Infinity, mult: 0, correct: false, grade: null };
  const offPct = value === 0 ? (guess === 0 ? 0 : Infinity) : Math.abs(guess - value) / Math.abs(value);
  const mult = Math.max(0, 1 - offPct / NEAR_ZERO_AT);
  if (!(mult > 0)) return { offPct, mult: 0, correct: false, grade: null };
  const grade = guess === value || offPct === 0 ? "perfect" : mult >= 0.7 ? "great" : "good";
  return { offPct, mult: grade === "perfect" ? 1 : mult, correct: true, grade };
}

const group = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** "16,254 · you said 16,000 · 1.6% off." */
export function nearLine(n: NearReveal): string {
  const off = !Number.isFinite(n.offPct) ? "way off" : n.offPct === 0 ? "spot on" : `${(n.offPct * 100).toFixed(1)}% off`;
  return `${group(n.value)} · you said ${group(n.guess)} · ${off}.`;
}
