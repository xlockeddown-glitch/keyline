/**
 * 0.0.53: how often the "Send as a friend ticket" chip may nudge. Before, it came back after every answered
 * trivia card (15 s on screen, the X only hid it until the next card). Now:
 *  - tapping X (Not now) hides it for 24 hours, kept in localStorage so a reload doesn't bring it back;
 *  - at most one unanswered nudge a session (sessionStorage, so a reload in the same tab is the same session): once
 *    a chip has been shown and the player didn't use it (it timed out or was dismissed), no more chips this session.
 *    A player who taps it and sends a ticket isn't being nudged, so that showing doesn't use up the session.
 *  - the chip is only a nudge, never the only door: the last few answered cards are kept (localStorage) and the
 *    Journal's "Send a friend ticket" row offers them any time, ignoring the chip's snooze and session cap. The
 *    server still enforces the daily send cap (DAILY_TICKETS) on every send.
 * Pure rules + a tiny storage wrapper; FriendTickets.tsx uses them, friendOffer.test.ts checks them.
 */
export const OFFER_SNOOZE_MS = 24 * 60 * 60 * 1000;
export const SNOOZE_KEY = "keyline-friend-offer-v1";
export const SESSION_KEY = "keyline-friend-offer-session-v1";
export const RECENT_KEY = "keyline-friend-recent-v1";
/** How many recently answered cards the Journal keeps on offer. */
export const RECENT_KEEP = 3;

export type RecentCard = { id: string; q: string; at: number };

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

/** A trivia card was answered: keep it (newest first, no repeats) for the Journal's send row. Never gated by the snooze. */
export function noteAnswered(local: KV | null, card: RecentCard): RecentCard[] {
  const next = [card, ...readRecent(local).filter((c) => c.id !== card.id)].slice(0, RECENT_KEEP);
  try {
    local?.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function readRecent(local: KV | null): RecentCard[] {
  try {
    const raw = local?.getItem(RECENT_KEY);
    const v: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (c): c is RecentCard =>
          !!c && typeof c.id === "string" && c.id.length > 0 && c.id.length <= 200 && typeof c.q === "string" && typeof c.at === "number",
      )
      .slice(0, RECENT_KEEP);
  } catch {
    return [];
  }
}

export function browserStores(): { local: KV | null; session: KV | null } {
  if (typeof window === "undefined") return { local: null, session: null };
  return { local: safe(() => window.localStorage), session: safe(() => window.sessionStorage) };
}
