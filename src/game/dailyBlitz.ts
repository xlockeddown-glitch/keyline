import type { Tier, TriviaCat } from "./types";

/**
 * Daily Blitz (0.0.59): the login coin, played. Six lanterns, white through violet.
 * Each one pays more than the last. A miss, a timeout or a walk-away ends the run
 * and keeps the coin already earned. One run per UTC day, in place of City Pulse.
 */
export const BLITZ_STEPS: { tier: Tier; pay: number; cat: TriviaCat }[] = [
  { tier: "white", pay: 20, cat: "history" },
  { tier: "blue", pay: 30, cat: "science" },
  { tier: "green", pay: 50, cat: "local" },
  { tier: "amber", pay: 80, cat: "food" },
  { tier: "red", pay: 130, cat: "nature" },
  { tier: "violet", pay: 200, cat: "arts" },
];

export const BLITZ_FULL = BLITZ_STEPS.reduce((n, s) => n + s.pay, 0);

export const BLITZ_WINDOW_MS = 20_000;

export function blitzDue(lastDay: string, today: string) {
  return lastDay !== today;
}

/** Blank-lamp id for a step. The server has no named lamp by this id, so the deal sends a blank of that tier. */
export function blitzPoiId(step: number) {
  return `blitz-${step}`;
}

/** Coin from the first `cleared` right answers. */
export function blitzBank(cleared: number) {
  const n = Math.max(0, Math.min(BLITZ_STEPS.length, Math.floor(cleared)));
  let sum = 0;
  for (let i = 0; i < n; i++) sum += BLITZ_STEPS[i]!.pay;
  return sum;
}
