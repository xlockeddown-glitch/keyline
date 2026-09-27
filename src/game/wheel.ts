import { TIER_LABEL } from "./data.ts";
import { cityStaple, ingredientName, INGREDIENTS, type IngredientId } from "./ingredients.ts";
import { matchCap } from "./ticket.ts";
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
  | { kind: "ingredient"; id: IngredientId; n: number; face: string; label: string };

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

function cityCut(cityId: CityId): IngredientId | null {
  const staple = cityStaple(cityId);
  for (const ing of Object.values(INGREDIENTS)) {
    if (ing.cityId === cityId && ing.id !== staple) return ing.id;
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

export function wheelSlices(tier: Tier, cityId: CityId): { prize: WheelPrize; w: number }[] {
  const r = RANK[tier];
  const step = r + 1;
  const staple = cityStaple(cityId);
  const cut = cityCut(cityId);
  const lesser = TIERS[Math.max(0, r - 1)]!;
  return [
    { prize: coins(20 * step, "Coin"), w: Math.max(8, 28 - r * 3) },
    { prize: coins(45 * step, "Pile"), w: 18 },
    { prize: coins(80 * step, "Heap"), w: 8 + r },
    { prize: coins(140 * step, "Jackpot"), w: 3 + r * 2 },
    { prize: keyPrize(tier, 1), w: 6 + r * 3 },
    { prize: keyPrize(r >= 3 ? tier : lesser, r >= 4 ? 1 : 1), w: 7 },
    { prize: stock(staple, r >= 3 ? 2 : 1, "Stock"), w: 16 },
    { prize: cut && r >= 2 ? stock(cut, 1, "Cut") : coins(55 * step, "Cut"), w: 5 + r * 2 },
  ];
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
  if (prize.kind === "coins") {
    return { ...bag, points: bag.points + prize.n, line: prize.label };
  }
  if (prize.kind === "ingredient") {
    const pantry = { ...bag.pantry, [prize.id]: (bag.pantry[prize.id] ?? 0) + prize.n };
    return { ...bag, pantry, line: prize.label };
  }
  const have = bag.keys[prize.tier] ?? 0;
  const room = Math.max(0, matchCap(prize.tier) - have);
  const give = Math.min(prize.n, room);
  if (give <= 0) {
    const coin = 30 * (RANK[prize.tier] + 1);
    return { ...bag, points: bag.points + coin, line: `Pocket full. ${coin} coin instead.` };
  }
  const keys = { ...bag.keys, [prize.tier]: have + give };
  if (give < prize.n) {
    const coin = 30 * (RANK[prize.tier] + 1);
    return { keys, points: bag.points + coin, pantry: bag.pantry, line: `${prize.label}. Pocket full, so ${coin} coin too.` };
  }
  return { keys, points: bag.points, pantry: bag.pantry, line: prize.label };
}
