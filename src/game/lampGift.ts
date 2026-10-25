import type { Tier } from "./types.ts";
import { TIER_LABEL } from "./data.ts";

/**
 * One-time gift lanterns. Each grant is its own ledger key (paid on a wallet sync, walletApply.grantLampGift); the
 * player picks the lamp later (Journal · Places), which writes `ownfree:<tier>`: independent of a bought `own:<tier>`.
 * Unclaimed gifts never expire. A player holds at most one gifted lantern per color.
 *   0.1.43: white + blue for current players. 0.1.44: green + amber for current players; white for new players.
 */
export type LampGift = { key: string; tier: Tier; who: "current" | "new" };
export const LAMP_GIFTS: readonly LampGift[] = [
  { key: "gift:lamp-0143-white", tier: "white", who: "current" },
  { key: "gift:lamp-0143-blue", tier: "blue", who: "current" },
  { key: "gift:lamp-0144-green", tier: "green", who: "current" },
  { key: "gift:lamp-0144-amber", tier: "amber", who: "current" },
  { key: "gift:lamp-0144-new-white", tier: "white", who: "new" },
];
export const giftKeysFor = (tier: string) => LAMP_GIFTS.filter((g) => g.tier === tier).map((g) => g.key);
export const GIFT_TIERS: readonly Tier[] = [...new Set(LAMP_GIFTS.map((g) => g.tier))];

/** Accounts whose first ledger row is before this are current players; at or after, new players. Move it if the release slips. */
export const LAMP_GIFT_CUTOFF = "2026-10-26T06:00:00Z";
/** Tests move this (older test files turn the current-player gift off with a past cutoff). */
export const lampGiftClock = { cutoff: LAMP_GIFT_CUTOFF };

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** One note for every gift lantern granted on this sync. */
export function lampGiftNote(tiers: readonly Tier[]): string {
  const names = tiers.map((t) => TIER_LABEL[t]);
  const what = names.length === 1 ? `A free ${names[0]} lantern is` : `Free ${list(names)} lanterns are`;
  return `Thanks for playing Keyline! ${what} waiting for you. Open Journal · Places and pick a lamp for ${names.length === 1 ? "it" : "each"}. — Ryan & Grok`;
}

/* ---------------------------------------------------------------- 0.1.44 welcome pack (new players) */

export const WELCOME_KEY = "gift:welcome-0144";
export const WELCOME_COIN = 15_000;
export const WELCOME_HOUSE = "cottage" as const;
export const DOUBLE_MS = 60 * 60_000;
/**
 * Defaults (Ryan's ask, the details are ours): "first hour" = 60 minutes of wall clock from the account's first
 * wallet ledger row. Tests move `cutoff` (a far-future cutoff turns the pack off) and `now`.
 */
export const welcomeClock = { cutoff: LAMP_GIFT_CUTOFF, now: () => Date.now() };
/** Op-key prefixes whose coin gain the first hour doubles (one place: walletSql.mutateWallet). */
export const DOUBLE_PREFIXES = ["grade:", "street:", "ride:", "cache:", "crate:", "quest:", "hook:"] as const;
export const doubles = (opKey: string) => DOUBLE_PREFIXES.some((p) => opKey.startsWith(p));

export function welcomeNote(cityName: string | null): string {
  const parts = [cityName ? `a Lantern Cottage in ${cityName}` : null, `${WELCOME_COIN.toLocaleString("en-US")} coins`, "a free White lantern (pick a lamp in Journal · Places)", "double rewards for your first hour"].filter(Boolean) as string[];
  return `Welcome to Keyline! Here's ${list(parts)}. — Ryan & Grok`;
}
