import type { ScoutId, Tier } from "./types.ts";

/**
 * One-time match gifts from the house (0.0.95). Each is keyed by the recipient's verified user id
 * (found on the public standings, as with the 0.0.54 Halish gift) and paid once on the server
 * under an idempotent ledger key. A full pocket pays the tier's overflow coin instead.
 */
export type MatchGift = { key: string; userId: string; tier: Tier; n: number; note: string };

export const MATCH_GIFTS: readonly MatchGift[] = [
  // "Amanda G." on the public standings (Ryan's wife), the only account with that name there.
  { key: "gift:amanda-red-0095", userId: "j9k4J0Lv4ffeRdJF9577cNY6qZaOcWv6", tier: "red", n: 2, note: "A make-up gift: 2 red matches." },
];

/**
 * 0.0.95: one-time scout restores. The account owns the scout from then on (the gift key is read back as
 * ownership on every sync), and every extra server-recorded purchase of that scout is refunded at `refund` coin.
 */
export type ScoutGift = { key: string; userId: string; scout: ScoutId; refund: number; note: string };

export const SCOUT_GIFTS: readonly ScoutGift[] = [
  // "Beth B." on the public standings, the only account with that name there.
  { key: "gift:bethb-corgi-0095", userId: "b4kKJFQyhu9Muu04I70TirgSafJyY64S", scout: "corgi", refund: 9600, note: "Your Corgi is back." },
];

export function giftsFor(ids: readonly string[], list: readonly MatchGift[] = MATCH_GIFTS): MatchGift[] {
  return list.filter((g) => ids.includes(g.userId));
}
