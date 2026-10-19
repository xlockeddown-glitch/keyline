/**
 * What an ordinary lamp pays, in one place, so the field guide and the clear use the same numbers.
 * Coin is a slow answer (over 10 s) through a perfect one (under 3 s), on a standard question.
 * No streak, no night market, no cloth tip, no scout bonus — those sit on top.
 */
import { PAINT_DROP_IN, ULTRA_DROP_IN, type VaultPaint } from "./ingredients.ts";
import { TIER_ORDER, TIER_VALUE, rewardPoints } from "./rewards.ts";
import { formatCool, lampCoolMs } from "./ticket.ts";
import type { Tier, TriviaDiff } from "./types.ts";

/** Blue and green. Amber, red, and violet always drop one. White never does. */
export const SCHEMATIC_CHANCE = 0.08;
/** A perfect answer. */
export const PERFECT_BLUE_CHANCE = 0.1;
/** Lucky charm, a match of the lamp's own colour. */
export const LUCKY_MATCH_CHANCE = 0.15;
/** Vellum when the lamp is not a park or a campus (those pay 2). */
export const VELLUM_CHANCE = 0.4;

const SLOW = 0.4;
const PERFECT = 1;
/** Standard question. triviaMeta DIFF_MULT[2] is 1; easy is 0.7 and hard is 1.45, noted in PAY_NOTES. */
const ORDINARY = 1;

export function lampCoinBand(tier: Tier): { slow: number; perfect: number } {
  return {
    slow: rewardPoints(tier, { mult: SLOW, bonus: 1, diffMult: ORDINARY }),
    perfect: rewardPoints(tier, { mult: PERFECT, bonus: 1, diffMult: ORDINARY }),
  };
}

/** Brass on a clear. A hard question adds 2. Violet pays the white rate — that is the lamp, not the guide. */
export function lampBrass(tier: Tier, diff: TriviaDiff): number {
  return (
    1 +
    (tier === "green" || tier === "amber" ? 2 : 0) +
    (tier === "red" ? 4 : 0) +
    (diff === 3 ? 2 : 0)
  );
}

export function lampSchematicHits(tier: Tier, roll: number): boolean {
  if (tier === "amber" || tier === "red" || tier === "violet") return true;
  if (tier === "white") return false;
  if (!Number.isFinite(roll) || roll < 0) return false;
  return roll < SCHEMATIC_CHANCE;
}

export type LampStock = "none" | "city" | "ward";

/** Green drops the city's press stock. Amber and up drop that, or the named ward's cut. */
export function lampStock(tier: Tier): LampStock {
  if (tier === "white" || tier === "blue") return "none";
  if (tier === "green") return "city";
  return "ward";
}

export type LampPayRow = {
  tier: Tier;
  slow: number;
  perfect: number;
  /** Log-scaled position of the coin band, 0–100, so violet can sit on the same track as white. */
  barStart: number;
  barWidth: number;
  paintIn: number;
  brass: string;
  extra: string;
  recast: string;
};

function oddsLine(n: number): string {
  return `1 in ${n.toLocaleString()}`;
}

export function lampExtra(tier: Tier): string {
  const lo = lampBrass(tier, 2);
  const hi = lampBrass(tier, 3);
  const bits = [`Brass ${lo}–${hi}`];
  const stock = lampStock(tier);
  if (stock === "city") bits.push("city stock");
  if (stock === "ward") bits.push("city stock, or the ward's cut");
  if (tier === "amber" || tier === "red" || tier === "violet") bits.push("schematic");
  else if (tier !== "white") bits.push("schematic about 1 in 12");
  return bits.join(" · ");
}

export function lampPayRows(): LampPayRow[] {
  const bands = TIER_ORDER.map((tier) => ({ tier, ...lampCoinBand(tier) }));
  const floor = Math.log10(bands[0]!.slow);
  const ceil = Math.log10(bands[bands.length - 1]!.perfect);
  const span = ceil - floor;
  return bands.map((b) => {
    const start = ((Math.log10(b.slow) - floor) / span) * 100;
    const end = ((Math.log10(b.perfect) - floor) / span) * 100;
    return {
      tier: b.tier,
      slow: b.slow,
      perfect: b.perfect,
      barStart: start,
      barWidth: Math.max(end - start, 1.5),
      paintIn: PAINT_DROP_IN[b.tier as VaultPaint],
      brass: `${lampBrass(b.tier, 2)}–${lampBrass(b.tier, 3)}`,
      extra: lampExtra(b.tier),
      recast: formatCool(lampCoolMs(b.tier)),
    };
  });
}

export function paintOddsLine(tier: Tier): string {
  return oddsLine(PAINT_DROP_IN[tier as VaultPaint]);
}

/** What this many clears of one colour are worth in paint. Null when they haven't lit any. */
export function paintFromClears(clears: number, paintIn: number): string | null {
  if (!Number.isFinite(clears) || clears < 1 || !Number.isFinite(paintIn) || paintIn < 1) return null;
  const n = Math.floor(clears);
  const expected = n / paintIn;
  const lit = `You've lit ${n.toLocaleString()}`;
  if (expected >= 10) return `${lit} · that's about ${Math.round(expected).toLocaleString()} cans of paint`;
  if (expected >= 1) return `${lit} · that's about ${expected.toFixed(1)} cans of paint`;
  const per = Math.max(2, Math.round(paintIn / n));
  return `${lit} · so far, about a 1 in ${per.toLocaleString()} chance of a can`;
}

export const PAY_NOTES = [
  "These coin amounts are for a normal question. Easy questions pay about 70% of that. Hard questions pay about 45% more. Answering several right in a row adds up to 40% more.",
  "Opening a lamp uses one match of its colour. A very fast right answer has a 1 in 10 chance of a free blue match. With the Lucky charm on, about 1 in 7 lamps also give back a match of their colour.",
  `Paint is that lamp's colour. Prism is separate: any lamp, about 1 in ${ULTRA_DROP_IN.toLocaleString()}, and it can land with the colour can.`,
  "Green and up drop this city's press stock every time. Amber and up, at a named ward, drop that ward's cut instead.",
  "Ink is 1, or 2 at a museum, library, or theatre. A park or a campus drops 2 vellum. Other lamps drop 1 vellum about 2 in 5 times. Brass shows two numbers: what a normal question gives, then what a hard one gives.",
  "The Run and The Stack give a match and extra brass. Lamps inside a night market pay double coin and double bonus matches (not paint, brass, ink or stock).",
] as const;

/** Ladder check used by the guide test: a perfect ordinary clear is the tier's coin value. */
export function perfectIsFace(tier: Tier): boolean {
  return lampCoinBand(tier).perfect === TIER_VALUE[tier];
}
