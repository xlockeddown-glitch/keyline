import type { Tier, TriviaCat } from "./types";

/**
 * Daily Blitz (0.0.59): the login coin, played. Six lanterns, white through violet.
 * Each one pays more than the last, and a right answer also drops a match of that
 * color. A full pocket pays the match's coin instead. A miss, a timeout or a
 * walk-away ends the run and keeps what was already earned. One run per UTC day.
 */
export const BLITZ_STEPS: { tier: Tier; pay: number; cat: TriviaCat }[] = [
  { tier: "white", pay: 20, cat: "history" },
  { tier: "blue", pay: 30, cat: "science" },
  { tier: "green", pay: 50, cat: "local" },
  { tier: "amber", pay: 80, cat: "food" },
  { tier: "red", pay: 200, cat: "nature" },
  { tier: "violet", pay: 500, cat: "arts" },
];

export const BLITZ_FULL = BLITZ_STEPS.reduce((n, s) => n + s.pay, 0);

/** Guest contracts are three lamps. The server pays the amber only for that many graded cards. */
export const CONTRACT_LAMPS = 3;

export const BLITZ_WINDOW_MS = 20_000;

const TIER_LABEL: Record<Tier, string> = {
  white: "White",
  blue: "Blue",
  green: "Green",
  amber: "Amber",
  red: "Red",
  violet: "Violet",
};

export function blitzDue(lastDay: string, today: string) {
  return lastDay !== today;
}

/** Blank-lamp id for a step. The server has no named lamp by this id, so the deal sends a blank of that tier. */
export function blitzPoiId(step: number) {
  return `blitz-${step}`;
}

/** Coin from the first `cleared` right answers. Does not include a full-pocket substitute. */
export function blitzBank(cleared: number) {
  const n = Math.max(0, Math.min(BLITZ_STEPS.length, Math.floor(cleared)));
  let sum = 0;
  for (let i = 0; i < n; i++) sum += BLITZ_STEPS[i]!.pay;
  return sum;
}

/** One match of the lantern's color, or its coin value when that pocket is full. */
export function blitzMatch(_tier: Tier, _have: number, _cap: number): { match: boolean; overflow: number } {
  // 0.0.97: the match always lands; a full pocket turns it into a merge credit (goals.ts settlePocket).
  return { match: true, overflow: 0 };
}

export function cleanBlitzMatches(raw: unknown): Tier[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is Tier => typeof t === "string" && t in TIER_LABEL).slice(0, BLITZ_STEPS.length);
}

/** "a White match" / "White and Blue matches" / "White, Blue and Green matches". */
export function blitzMatchLine(tiers: readonly Tier[]): string {
  if (tiers.length === 0) return "";
  const names = tiers.map((t) => TIER_LABEL[t]);
  if (names.length === 1) return `a ${names[0]} match`;
  if (names.length === 2) return `${names[0]} and ${names[1]} matches`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} matches`;
}

export function blitzTakeLine(coin: number, tiers: readonly Tier[]): string {
  const m = blitzMatchLine(tiers);
  return m ? `${coin} coin and ${m}` : `${coin} coin`;
}