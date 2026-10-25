import type { Tier } from "./types.ts";

/**
 * 0.1.43: one-time thank-you gift: a free white and a free blue owned lantern for every account that existed at
 * release. The grant is `gift:lamp-0143-<tier>` (paid on the next wallet sync, walletApply.grantLampGift); the
 * player picks the lamp later (Journal · Places), which writes `ownfree:<tier>`: independent of a bought `own:<tier>`.
 * Unclaimed gifts never expire.
 */
export const LAMP_GIFT_TIERS = ["white", "blue"] as const satisfies readonly Tier[];
export type LampGiftTier = (typeof LAMP_GIFT_TIERS)[number];
export const lampGiftKey = (t: LampGiftTier) => `gift:lamp-0143-${t}`;
/** Accounts whose first ledger row is at or after this instant are new players and get nothing. Move it if 0.1.43 ships later. */
export const LAMP_GIFT_CUTOFF = "2026-10-26T06:00:00Z";
/** Tests move this (wallet.test.ts turns the gift off). */
export const lampGiftClock = { cutoff: LAMP_GIFT_CUTOFF };
export const LAMP_GIFT_NOTE = "Thanks for playing Keyline! A free White lantern and a free Blue lantern are waiting for you. Open Journal · Places and pick a lamp for each. — Ryan & Grok";
export const isLampGiftTier = (t: string): t is LampGiftTier => (LAMP_GIFT_TIERS as readonly string[]).includes(t);
