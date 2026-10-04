/**
 * 0.0.54 gifts — the pure rules, shared by the server (giftService.ts) and the client (GiftNote.tsx).
 *
 * A gift row hands one scout to one walker for free, with a note. It matches the signed-in walker by verified
 * user id, or failing that by first name (the account name's first word, case-insensitive). The server's claim
 * row says the note was seen (on any device); the save's `giftsSeen` says the same for this browser.
 * Ownership is granted whenever a matching gift comes back, claimed or not, so a second device gets the
 * scout too — the note just doesn't show again.
 */
export type GiftRow = {
  id: string;
  scout: string;
  user_id: string | null;
  first_name: string | null;
  message: string;
};

/** What the server hands the signed-in walker: only gifts that are theirs. */
export type Gift = { id: string; scout: string; message: string; claimed: boolean };

export type GiftUser = { id: string; name: string | null | undefined };

/** Lower-case first word of an account name ("Halish", "halish k" → "halish"); "" when there is none. */
export function firstName(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return first.toLowerCase();
}

export function giftMatches(row: Pick<GiftRow, "user_id" | "first_name">, user: GiftUser): boolean {
  if (!user.id) return false;
  if (row.user_id && row.user_id === user.id) return true;
  const want = (row.first_name ?? "").trim().toLowerCase();
  return Boolean(want) && firstName(user.name) === want;
}

/** The gifts in `rows` that belong to `user`, with the server claim flag from `claimedIds`. */
export function giftsFor(rows: GiftRow[], user: GiftUser, claimedIds: Iterable<string>): Gift[] {
  const claimed = new Set(claimedIds);
  return rows
    .filter((r) => giftMatches(r, user))
    .map((r) => ({ id: r.id, scout: r.scout, message: r.message, claimed: claimed.has(r.id) }));
}

export type GiftPlan = {
  /** Add the scout to the save (it wasn't owned). */
  grant: boolean;
  /** They already had it (bought or an earlier device) — the note still shows if unseen. */
  alreadyOwned: boolean;
  /** Show the note now: not claimed on the server and not seen in this save. */
  show: boolean;
};

export function planGift(gift: Gift, save: { scouts: readonly string[]; giftsSeen: readonly string[] }, known: (scout: string) => boolean): GiftPlan {
  if (!known(gift.scout)) return { grant: false, alreadyOwned: false, show: false };
  const alreadyOwned = save.scouts.includes(gift.scout);
  return { grant: !alreadyOwned, alreadyOwned, show: !gift.claimed && !save.giftsSeen.includes(gift.id) };
}

/** The line under the note: what landed. */
export function giftLine(scoutName: string, alreadyOwned: boolean): string {
  return alreadyOwned ? `${scoutName} is yours — a gift, on the house.` : `You got ${scoutName} for free.`;
}
