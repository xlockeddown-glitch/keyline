/**
 * 0.1.00 market lights: string-light colours for the night market, bought with coin in order, each a small
 * bump on the market's COIN multiplier (matches stay ×2, so the pocket economy is unchanged). The server reads
 * ownership from its own ledger (light:<id>) and never trusts a client multiplier.
 */
export type LightId = "amber" | "jade" | "rose" | "violet" | "ice" | "rainbow";

export type MarketLight = { id: LightId; label: string; mult: number; price: number; color: string };

export const MARKET_LIGHTS: readonly MarketLight[] = [
  { id: "amber", label: "Amber", mult: 2.0, price: 0, color: "#ffb347" },
  { id: "jade", label: "Jade", mult: 2.1, price: 2_500, color: "#3fd6a0" },
  { id: "rose", label: "Rose", mult: 2.2, price: 5_000, color: "#ff6f9c" },
  { id: "violet", label: "Violet", mult: 2.3, price: 9_000, color: "#a77bff" },
  { id: "ice", label: "Ice", mult: 2.4, price: 15_000, color: "#9be8ff" },
  { id: "rainbow", label: "Rainbow", mult: 2.5, price: 25_000, color: "linear-gradient(90deg,#ff5f5f,#ffb347,#ffe066,#3fd6a0,#5fb0ff,#a77bff)" },
];

/** Combined market coin multiplier never passes this (rainbow ×2.5 + Owl's +0.5 = ×3.0). */
export const MARKET_COIN_CAP = 3.0;

export function lightOf(id: string | null | undefined): MarketLight {
  return MARKET_LIGHTS.find((l) => l.id === id) ?? MARKET_LIGHTS[0]!;
}

/** Highest light owned (ownership is a prefix of the ladder). */
export function bestLight(owned: readonly string[]): MarketLight {
  let best = MARKET_LIGHTS[0]!;
  for (const l of MARKET_LIGHTS) if (owned.includes(l.id)) best = l;
  return best;
}

/** The next light to buy, or null at rainbow. Buying skips nothing: only the next rung is for sale. */
export function nextLight(owned: readonly string[]): MarketLight | null {
  const i = MARKET_LIGHTS.indexOf(bestLight(owned));
  return MARKET_LIGHTS[i + 1] ?? null;
}

/** Market coin multiplier: the light's ×, plus a coat's bonus above ×2 (Owl +0.5), capped. 1 off the market. */
export function marketCoinX(onMarket: boolean, light: MarketLight, coatMarket: number | undefined): number {
  if (!onMarket) return 1;
  const owl = Math.max(0, (coatMarket ?? 2) - 2);
  return Math.min(MARKET_COIN_CAP, Math.round((light.mult + owl) * 100) / 100);
}
