/**
 * 0.0.53: how often the "Send as a friend ticket" chip may nudge. Before, it came back after every answered
 * trivia card (15 s on screen, the X only hid it until the next card). Now:
 *  - tapping X (Not now) hides it for 24 hours, kept in localStorage so a reload doesn't bring it back;
 *  - at most one unanswered nudge a session (sessionStorage, so a reload in the same tab is the same session): once
 *    a chip has been shown and the player didn't use it (it timed out or was dismissed), no more chips this session.
 *    A player who taps it and sends a ticket isn't being nudged, so that showing doesn't use up the session.
 * Pure rules + a tiny storage wrapper; FriendTickets.tsx uses them, friendOffer.test.ts checks them.
 */
export const OFFER_SNOOZE_MS = 24 * 60 * 60 * 1000;
export const SNOOZE_KEY = "keyline-friend-offer-v1";
export const SESSION_KEY = "keyline-friend-offer-session-v1";

export type OfferMemory = { dismissedAt: number | null; nudgedThisSession: boolean };

export function offerAllowed(mem: OfferMemory, now: number): boolean {
  if (mem.nudgedThisSession) return false;
  if (mem.dismissedAt != null && now >= mem.dismissedAt && now - mem.dismissedAt < OFFER_SNOOZE_MS) return false;
  return true;
}

type KV = Pick<Storage, "getItem" | "setItem">;

function safe(get: () => KV | undefined): KV | null {
  try {
    return get() ?? null;
  } catch {
    return null;
  }
}

export function readOffer(local: KV | null, session: KV | null): OfferMemory {
  let dismissedAt: number | null = null;
  try {
    const raw = local?.getItem(SNOOZE_KEY);
    const v = raw ? (JSON.parse(raw) as { dismissedAt?: unknown }).dismissedAt : null;
    dismissedAt = typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    dismissedAt = null;
  }
  let nudged = false;
  try {
    nudged = session?.getItem(SESSION_KEY) === "1";
  } catch {
    nudged = false;
  }
  return { dismissedAt, nudgedThisSession: nudged };
}

/** The player tapped X: snooze 24 h (persisted) and count the session's nudge. */
export function noteDismissed(local: KV | null, session: KV | null, now: number) {
  try {
    local?.setItem(SNOOZE_KEY, JSON.stringify({ dismissedAt: now }));
  } catch {
    /* private mode */
  }
  noteIgnored(session);
}

/** The chip timed out unused: no more nudges this session. */
export function noteIgnored(session: KV | null) {
  try {
    session?.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function browserStores(): { local: KV | null; session: KV | null } {
  if (typeof window === "undefined") return { local: null, session: null };
  return { local: safe(() => window.localStorage), session: safe(() => window.sessionStorage) };
}
