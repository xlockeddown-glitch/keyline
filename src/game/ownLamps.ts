/**
 * 0.1.42: player-owned lanterns, release 1. A player buys one existing lamp POI per color (one owner per lamp).
 * Pure rules here; the ledger reads and writes are in walletApply.ts (ownLampOp, payOwner).
 */
import { TIER_VALUE } from "./rewards.ts";
import type { Tier } from "./types.ts";

export const OWN_PRICE: Record<Tier, number> = { white: 100_000, blue: 250_000, green: 500_000, amber: 1_000_000, red: 2_000_000, violet: 4_000_000 };

/** Paid misses per owned lamp per Chicago day. */
export const OWN_DAILY_CAP = 20;

/** Ledger user id for the global one-owner-per-lamp claim rows (`ownpoi:<poi>`). Not a real player. */
export const OWN_CLAIM_USER = "~own-lamps";

export type OwnedLamp = { poi: string; tier: Tier; city: string; name: string };

/**
 * UNCONFIRMED reading of "owner payout is 50% matches and 50% coins" (Ryan, Oct 2026), pending his confirmation:
 * every paid miss gives the owner half the tier's value in coins (15/45/135/405/1215/3645), plus a 50% chance of
 * one match of that tier. The coin flip is a hash of the grade nonce, so a replay of the same miss pays the same.
 */
export function ownPayFor(tier: Tier, nonce: string): { coins: number; match: boolean } {
  return { coins: Math.floor(TIER_VALUE[tier] / 2), match: (hash(`ownpay:${nonce}`) & 1) === 1 };
}

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
