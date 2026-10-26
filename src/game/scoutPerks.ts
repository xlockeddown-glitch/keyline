// 0.0.96: scout abilities. Pure rules the server (grade/deal) and the guest store share. The worn coat travels in
// the deal's pay context (like loot always has); every chance below is rolled by the server, never the client.
import { SCOUTS } from "./data.ts";
import { TIER_VALUE } from "./rewards.ts";
import { MARKET_LIGHTS, marketCoinX, type MarketLight } from "./marketLights.ts";
import type { ScoutId, Tier } from "./types";

export function scoutOf(id: unknown): ScoutId | null {
  return typeof id === "string" && id in SCOUTS ? (id as ScoutId) : null;
}

function perkOf(id: ScoutId | null) {
  return id ? SCOUTS[id].perk : null;
}

/** Raccoon: does this lit lamp also drop a blue match? `roll` is the server's Math.random(). */
export function rummageHit(id: ScoutId | null, roll: number): boolean {
  const n = perkOf(id)?.rummage;
  return Boolean(n && roll < 1 / n);
}

/** Plate: does this failed lamp refund its match? */
export function shellBackHit(id: ScoutId | null, roll: number): boolean {
  const n = perkOf(id)?.shellBack;
  return Boolean(n && roll < 1 / n);
}

/** Night-market coin multiplier for this coat and market light (0.1.00: light ×2.0-2.5, Owl +0.5, cap ×3). */
export function marketCoinMult(id: ScoutId | null, mult: number, light: MarketLight = MARKET_LIGHTS[0]!): number {
  if (mult <= 1) return mult;
  return marketCoinX(true, light, perkOf(id)?.market);
}

/** Coin the market adds on top of the ordinary ×2 (Owl and the market light); `baseCoin` is pre-market. */
export function owlExtraCoin(id: ScoutId | null, mult: number, baseCoin: number, light?: MarketLight): number {
  const m = marketCoinMult(id, mult, light);
  return m > mult ? Math.round(baseCoin * (m - mult)) : 0;
}

/** The extra above ×2 on a spark/street market match, in coin: (m − 2) × the match's ladder value. */
export function owlMatchCoin(id: ScoutId | null, mult: number, tier: Tier, light?: MarketLight): number {
  const m = marketCoinMult(id, mult, light);
  return m > mult ? Math.round((m - mult) * TIER_VALUE[tier]) : 0;
}

/** Fox: strike one wrong option on a red/violet lamp. The server picks it from the wrong ones only. */
export function strikeOption(id: ScoutId | null, rarity: Tier, choices: readonly string[], answer: string, roll: number): string | null {
  if (!perkOf(id)?.strike) return null;
  if (rarity !== "red" && rarity !== "violet") return null;
  const wrong = choices.filter((c) => c !== answer);
  if (!wrong.length) return null;
  return wrong[Math.min(wrong.length - 1, Math.floor(roll * wrong.length))]!;
}

/** Tabby: answer streak run from the server's grade rows (newest first). The first miss of each day is forgiven. */
export function streakRun(rows: ReadonlyArray<{ miss: boolean; day: string }>, shield: boolean): number {
  let run = 0;
  const missDays = new Map<string, number>();
  if (shield) for (const r of rows) if (r.miss) missDays.set(r.day, (missDays.get(r.day) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const r of rows) {
    if (r.miss) {
      if (!shield) break;
      // Rows are newest first: the day's first miss is the last one we meet for that day.
      const k = (seen.get(r.day) ?? 0) + 1;
      seen.set(r.day, k);
      if (k < (missDays.get(r.day) ?? 0)) break;
      continue;
    }
    run++;
  }
  return run;
}

export function hasShield(id: ScoutId | null): boolean {
  return Boolean(perkOf(id)?.shield);
}

export function cacheAnywhere(id: ScoutId | null): boolean {
  return Boolean(perkOf(id)?.cacheAnywhere);
}

export const BAMBOO_TAG = "Bamboo luck";

/** 0.1.47 Panda (Bamboo luck): does this right lamp pay its lamp coin twice? `roll` is the server's Math.random(). */
export function doubleUpHit(id: ScoutId | null, roll: number): boolean {
  const n = perkOf(id)?.doubleUp;
  return Boolean(n && roll < 1 / n);
}

/** Lamp-and-match reach multiplier (Giraffe 2×). */
export function reachMult(id: ScoutId | null): number {
  return perkOf(id)?.reach ?? 1;
}
