import type { CityId } from "./types.ts";

/**
 * 0.1.39: one-time thank-you gift for every account that existed at release: a Ford F-150 and an Ivy Townhouse in
 * the player's starting city, or the coin equivalent for a half they already own. Paid on the next wallet sync
 * (walletApply.grantThanksGift) under fixed ledger keys, so a replay or a linked sign-in pays nothing more.
 */
export const THANKS_GIFT_KEY = "gift:thanks-0139";
export const THANKS_CAR_KEY = "gift:thanks-0139-car";
export const THANKS_HOUSE_KEY = "gift:thanks-0139-house";
/** Accounts whose first ledger row is at or after this instant are new players and get nothing. */
export const THANKS_GIFT_CUTOFF = "2026-10-25T06:00:00Z";
/** Tests move this (wallet.test.ts turns the gift off; thanksGift.test.ts sets it either side of its accounts). */
export const thanksClock = { cutoff: THANKS_GIFT_CUTOFF };
export const THANKS_CAR = "f150" as const;
export const THANKS_HOUSE = "town" as const;
export const THANKS_CAR_COIN = 50_000;
export const THANKS_HOUSE_COIN = 300_000;

export type ThanksCar = "given" | "coin";
export type ThanksHouse = "given" | "upgraded" | "coin";

const fmt = (n: number) => n.toLocaleString("en-US");

export function thanksNote(o: { car: ThanksCar | null; house: ThanksHouse | null; cityName: string | null; lost: number; cap: number }): string {
  const city = o.cityName ? ` in ${o.cityName}` : "";
  const parts = ["Thanks for playing Keyline!"];
  const gifts: string[] = [];
  if (o.car === "given") gifts.push("a Ford F-150");
  if (o.house === "given") gifts.push(`an Ivy Townhouse${city}`);
  if (gifts.length) parts.push(`Here's ${gifts.join(" and ")}, on us.`);
  if (o.house === "upgraded") parts.push(`Your house${city} got a free upgrade to an Ivy Townhouse.`);
  if (o.car === "coin") parts.push(`You already had the F-150, so here's +${fmt(THANKS_CAR_COIN)} coin instead.`);
  if (o.house === "coin") parts.push(`You already had an Ivy Townhouse or better${city}, so here's +${fmt(THANKS_HOUSE_COIN)} coin instead.`);
  if (o.lost > 0) parts.push(`Part of the coins (${fmt(o.lost)}) went over the ${fmt(o.cap)} limit.`);
  parts.push("— Ryan & Grok");
  return parts.join(" ");
}

/** Starting city: the wallet's chosen start, else its first unlocked city, else the device's save. */
export function thanksCity(server: { start: CityId | null; unlocked: readonly CityId[] }, local: CityId | null): CityId | null {
  return server.start ?? server.unlocked[0] ?? local;
}
