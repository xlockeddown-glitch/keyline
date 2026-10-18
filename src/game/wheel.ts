import { payMatchesOf } from "./goals.ts";
import { TIER_LABEL } from "./data.ts";
import { cityStaple, ingredientName, INGREDIENTS, type IngredientId } from "./ingredients.ts";
import type { CityId, Tier } from "./types.ts";

export const WHEEL_EVERY = 25;

const TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

const RANK: Record<Tier, number> = {
  white: 0,
  blue: 1,
  green: 2,
  amber: 3,
  red: 4,
  violet: 5,
};

export type WheelPrize =
  | { kind: "coins"; n: number; face: string; label: string }
  | { kind: "key"; tier: Tier; n: number; face: string; label: string }
  | { kind: "ingredient"; id: IngredientId; n: number; face: string; label: string }
  /** 0.0.92: every other prize on this wheel at once. */
  | { kind: "all"; parts: WheelPrize[]; face: string; label: string }
  /** 0.0.92: a blank. */
  | { kind: "nothing"; face: string; label: string };

export const WHEEL_NOTHING_LINE = "Nothing this time";

export type WheelOffer = {
  tier: Tier;
  slices: WheelPrize[];
  win: number;
};

export function emptyWheelClaims(): Record<Tier, number> {
  return { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
}

/** Saves from before the wheel are caught up, so old clears do not dump a stack of spins. */
export function caughtUpClaims(correct: Record<Tier, number>): Record<Tier, number> {
  const out = emptyWheelClaims();
  for (const tier of TIERS) out[tier] = Math.floor((correct[tier] ?? 0) / WHEEL_EVERY);
  return out;
}

export function owedTier(correct: Record<Tier, number>, claimed: Record<Tier, number>): Tier | null {
  for (const tier of TIERS) {
    const due = Math.floor((correct[tier] ?? 0) / WHEEL_EVERY);
    if (due > (claimed[tier] ?? 0)) return tier;
  }
  return null;
}


function coins(n: number, face: string): WheelPrize {
  return { kind: "coins", n, face, label: `${n.toLocaleString()} coin` };
}

function keyPrize(tier: Tier, n: number): WheelPrize {
  const name = `${TIER_LABEL[tier]} match`;
  return { kind: "key", tier, n, face: "Match", label: n > 1 ? `${n} ${name}es` : `A ${name.toLowerCase()}` };
}

function stock(id: IngredientId, n: number, face: string): WheelPrize {
  const name = ingredientName(id);
  return { kind: "ingredient", id, n, face, label: n > 1 ? `${n} ${name}` : name };
}

/**
 * 0.0.90: the tier one above the wheel's, for the rare match slice. Never violet unless the wheel is violet
 * (violet matches only come off a violet wheel, as before).
 */
export function wheelUpTier(tier: Tier): Tier {
  if (tier === "violet") return "violet";
  const up = TIERS[RANK[tier] + 1]!;
  return up === "violet" ? tier : up;
}

export function wheelSlices(tier: Tier, cityId: CityId): { prize: WheelPrize; w: number }[] {
  const r = RANK[tier];
  const step = r + 1;
  const staple = cityStaple(cityId);
  const lesser = TIERS[Math.max(0, r - 1)]!;
  const base: { prize: WheelPrize; w: number }[] = [
    { prize: coins(20 * step, "Coin"), w: Math.max(8, 28 - r * 3) },
    { prize: keyPrize(tier, 1), w: 6 + r * 3 },
    { prize: coins(45 * step, "Pile"), w: 16 },
    // 0.0.90: a pair of matches (the wheel's tier from amber up, one below it under that; white stays white).
    { prize: { ...keyPrize(r >= 3 ? tier : lesser, 2), face: "Pair" }, w: 7 },
    { prize: coins(80 * step, "Heap"), w: 8 + r },
    { prize: stock(staple, r >= 3 ? 2 : 1, "Stock"), w: 14 },
    // 0.0.90: the rare one: a match one tier up (white wheel → blue).
    { prize: { ...keyPrize(wheelUpTier(tier), 1), face: "Rare" }, w: 3 + r },
    { prize: coins(140 * step, "Jackpot"), w: 3 + r * 2 },
  ];
  // 0.0.92 (Ryan): the old "Cut" slice (weight 5 + 2r) split in two half slices: Take all, and Nothing.
  const half = (5 + r * 2) / 2;
  const all: WheelPrize = { kind: "all", parts: base.map((s) => s.prize), face: "Take all", label: "Take all: everything on the wheel" };
  const nothing: WheelPrize = { kind: "nothing", face: "Nothing", label: WHEEL_NOTHING_LINE };
  return [...base, { prize: all, w: half }, { prize: nothing, w: half }];
}

/** 0.0.90: slice colour. A match slice wears its tier; coin is brass, an ingredient is ink. */
export function wheelSliceTone(p: WheelPrize): Tier | "brass" | "ink" | "jackpot" | "blank" {
  if (p.kind === "key") return p.tier;
  if (p.kind === "all") return "jackpot";
  if (p.kind === "nothing") return "blank";
  return p.kind === "coins" ? "brass" : "ink";
}

export function buildWheel(tier: Tier, cityId: CityId, roll: number): WheelOffer {
  const slices = wheelSlices(tier, cityId);
  const total = slices.reduce((n, s) => n + s.w, 0);
  let cursor = Math.max(0, Math.min(0.999999, roll)) * total;
  let win = slices.length - 1;
  for (let i = 0; i < slices.length; i++) {
    cursor -= slices[i]!.w;
    if (cursor <= 0) {
      win = i;
      break;
    }
  }
  return { tier, slices: slices.map((s) => s.prize), win };
}

export function grantWheelPrize(
  prize: WheelPrize,
  bag: { keys: Record<Tier, number>; points: number; pantry: Partial<Record<IngredientId, number>> },
): { keys: Record<Tier, number>; points: number; pantry: Partial<Record<IngredientId, number>>; line: string } {
  if (prize.kind === "nothing") return { ...bag, line: WHEEL_NOTHING_LINE };
  if (prize.kind === "all") {
    let cur = { ...bag, line: "" };
    const lines: string[] = [];
    for (const part of prize.parts) {
      cur = grantWheelPrize(part, cur);
      lines.push(cur.line);
    }
    return { keys: cur.keys, points: cur.points, pantry: cur.pantry, line: `Take all! ${lines.join(" · ")}` };
  }
  if (prize.kind === "coins") {
    return { ...bag, points: bag.points + prize.n, line: prize.label };
  }
  if (prize.kind === "ingredient") {
    const pantry = { ...bag.pantry, [prize.id]: (bag.pantry[prize.id] ?? 0) + prize.n };
    return { ...bag, pantry, line: prize.label };
  }
  // 0.0.96: the shared pocket rule: a full tier steps the match up (match ↑); coin only when every tier above is full.
  const paid = payMatchesOf(bag.keys as Record<Tier, number>, prize.tier, prize.n);
  const keys = paid.keys;
  const ups = (Object.entries(paid.add) as [Tier, number][]).filter(([t]) => t !== prize.tier);
  const upLine = ups.length ? ` Match ↑ ${ups.map(([t, n]) => `${n} ${t}`).join(", ")}.` : "";
  if (paid.coin) return { keys, points: bag.points + paid.coin, pantry: bag.pantry, line: `${prize.label}.${upLine} Every pocket is full: +${paid.coin} coin.` };
  return { keys, points: bag.points, pantry: bag.pantry, line: `${prize.label}.${upLine}`.replace(/\.\.$/, ".") };
}

/** True when this color has a spin earned locally that has not been claimed yet. */
export function wheelDue(correct: number, claimed: number): boolean {
  return correct > 0 && Math.floor(correct / WHEEL_EVERY) > claimed;
}

export const WHEEL_RETRY_LINE = "Wheel will be back in a moment";
export const WHEEL_NO_SPIN_LINE = "No spin due on your account yet";

/**
 * 0.0.89: what to do when a signed-in wheel claim fails. The wheel always closes; it is never re-shown
 * in place (that trapped players on "Take it"). An authoritative "no-spin" means the server counts fewer
 * graded answers than this device (answers before sign-in, another device), so this color is marked
 * caught up locally and the wheel waits for the next 25. Anything else (network, busy) keeps the claim
 * count, so the spin is offered again on the next correct answer of that color.
 */
export function wheelClaimFailed(
  r: { ok?: boolean; reason?: string; authoritative?: boolean } | null | undefined,
  tier: Tier,
  correct: Record<Tier, number>,
  claimed: Record<Tier, number>,
): { wheelClaimed: Record<Tier, number>; toast: string } {
  if (r && r.reason === "no-spin") {
    const caught = Math.max(claimed[tier] ?? 0, Math.floor((correct[tier] ?? 0) / WHEEL_EVERY));
    return { wheelClaimed: { ...claimed, [tier]: caught }, toast: WHEEL_NO_SPIN_LINE };
  }
  return { wheelClaimed: claimed, toast: WHEEL_RETRY_LINE };
}

/** 0.0.92: how far the wheel sails past the winning slice before it settles back, and the share of time settling. */
export const WHEEL_OVERSHOOT_DEG = 7;
const SETTLE = 0.14;

/** Where the disc is (degrees) at t in [0, 1]: a long ease-out past the target, then a short settle back onto it. */
export function wheelAngle(t: number, target: number): number {
  const main = 1 - SETTLE;
  if (t <= main) {
    const u = Math.max(0, t) / main;
    return (target + WHEEL_OVERSHOOT_DEG) * (1 - Math.pow(1 - u, 3));
  }
  const v = Math.min(1, (t - main) / SETTLE);
  const smooth = v * v * (3 - 2 * v);
  return target + WHEEL_OVERSHOOT_DEG - WHEEL_OVERSHOOT_DEG * smooth;
}
