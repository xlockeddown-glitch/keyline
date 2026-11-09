/**
 * 0.1.138 patron lamp. One cosmetic bulb per night-market cycle (15 min: open 10, dark 5).
 * It tints the market string lights on this player's map only. It does not change coin,
 * keys, pace, or the market multiplier.
 */
import { MARKET_HOUR_MS, MARKET_OPEN_MS, utcHour } from "./nightMarket.ts";

export const PATRON_BULBS = [
  { id: "brass", label: "Brass", price: 2_000, swatch: "#e0c788" },
  { id: "copper", label: "Copper", price: 5_000, swatch: "#d08a52" },
  { id: "night", label: "Night glass", price: 12_000, swatch: "#d9d3e6" },
] as const;

export type PatronBulb = (typeof PATRON_BULBS)[number]["id"];
export type PatronHold = { bulb: PatronBulb; cycle: number; until: number };

export function patronBulb(id: string): (typeof PATRON_BULBS)[number] | null {
  return PATRON_BULBS.find((b) => b.id === id) ?? null;
}

export function patronCycle(at: number): number {
  return utcHour(at);
}

/** When this cycle's market goes dark. The tint ends here. */
export function patronUntil(cycle: number): number {
  return cycle * MARKET_HOUR_MS + MARKET_OPEN_MS;
}

/** True during the 10 open minutes, false during the 5 dark minutes. */
export function patronOpen(at: number): boolean {
  const cycle = patronCycle(at);
  return at >= cycle * MARKET_HOUR_MS && at < patronUntil(cycle);
}

export function patronLive(hold: PatronHold | null | undefined, at: number): boolean {
  if (!hold || !patronBulb(hold.bulb)) return false;
  return hold.cycle === patronCycle(at) && at < hold.until && patronOpen(at);
}

export function patronKey(cycle: number): string {
  return `patron:${cycle}`;
}

/** A stored hold, or null when it is missing, unknown, or the cycle has ended. */
export function cleanPatron(raw: unknown, at: number): PatronHold | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<PatronHold>;
  if (typeof r.bulb !== "string" || !patronBulb(r.bulb)) return null;
  const cycle = Math.floor(Number(r.cycle));
  const until = Math.floor(Number(r.until));
  if (!Number.isFinite(cycle) || !Number.isFinite(until)) return null;
  const hold: PatronHold = { bulb: r.bulb as PatronBulb, cycle, until };
  return patronLive(hold, at) ? hold : null;
}
