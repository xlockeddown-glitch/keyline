import { matchCap } from "./ticket.ts";
import type { CityId, Tier, TriviaCat, TriviaQ } from "./types";

export const CAFE_MS = 40_000;
export const PACK_SIZE = 5;
export const PACK_COST = 480;
export const SPARK_KIT_COST = 280;
export const RIBBON_COST = 90;
export const PIN_COST = 220;

export type CatalogId = "sparkKit" | "ribbon" | "pin" | "pack";

export const CATALOG: Record<
  CatalogId,
  { id: CatalogId; cost: number; name: string; blurb: string }
> = {
  sparkKit: {
    id: "sparkKit",
    cost: SPARK_KIT_COST,
    name: "Spark kit",
    blurb: "Three extra wick sparks today. The desk sells the strike.",
  },
  ribbon: {
    id: "ribbon",
    cost: RIBBON_COST,
    name: "Scout ribbon",
    blurb: "A cheap collar ribbon. Looks only. Wear it on the coat you have.",
  },
  pin: {
    id: "pin",
    cost: PIN_COST,
    name: "Ward pin",
    blurb: "A pin for this ward. It stays in the satchel.",
  },
  pack: {
    id: "pack",
    cost: PACK_COST,
    name: "News pack",
    blurb: "Five trivia cards tagged to the selected city.",
  },
};

export function cafeActive(visible: boolean, focused: boolean) {
  return visible && focused;
}

/** One white drop every CAFE_MS while the tab is visible and focused. */
export function cafeTick(acc: number, dt: number, visible: boolean, focused: boolean) {
  if (!cafeActive(visible, focused) || dt <= 0) return { acc, drop: 0, running: false };
  const next = acc + dt;
  if (next >= CAFE_MS) return { acc: next % CAFE_MS, drop: Math.floor(next / CAFE_MS), running: true };
  return { acc: next, drop: 0, running: true };
}

export function creditCafeWhite(keys: Record<Tier, number>, n: number) {
  const room = Math.max(0, matchCap("white") - (keys.white ?? 0));
  const added = Math.min(Math.max(0, n), room);
  if (!added) return { keys, added: 0 };
  return { keys: { ...keys, white: (keys.white ?? 0) + added }, added };
}

export type CityCardBank = Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>>;

export function cityTaggedCards(cityId: CityId, bank: CityCardBank): TriviaQ[] {
  const extra = bank[cityId] ?? {};
  const out: TriviaQ[] = [];
  const seen = new Set<string>();
  for (const cards of Object.values(extra)) {
    for (const card of cards ?? []) {
      if (!card.id || seen.has(card.id)) continue;
      seen.add(card.id);
      out.push(card);
    }
  }
  return out;
}

export function drawCityPack(cityId: CityId, heldIds: string[], bank: CityCardBank, size = PACK_SIZE): TriviaQ[] {
  return cityTaggedCards(cityId, bank).filter((c) => !heldIds.includes(c.id)).slice(0, size);
}

export type HeldCard = { id: string; city: CityId; q: string };

export function mergeHeld(held: HeldCard[], cityId: CityId, cards: TriviaQ[]): HeldCard[] {
  const have = new Set(held.map((h) => h.id));
  const extra = cards
    .filter((c) => c.id && !have.has(c.id))
    .map((c) => ({ id: c.id, city: cityId, q: c.q }));
  return [...held, ...extra];
}
