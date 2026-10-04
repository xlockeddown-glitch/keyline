import { useEffect, useRef, useState } from "react";
import { Check, Copy, Share2, Ticket, X } from "lucide-react";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { useGame } from "@/game/store";
import { ackFriendNews, fetchFriendNews, sendFriendTicket } from "@/game/friendApi";
import { DAILY_TICKETS } from "@/game/friendTicket";
import { browserStores, noteDismissed, noteIgnored, offerAllowed, readOffer } from "@/game/friendOffer";
import { SignInActions } from "./AuthChip";

/** How long the "Send as a friend ticket" chip stays up after a trivia card is answered. */
const OFFER_MS = 15_000;
const POLL_MS = 45_000;

type Offer = { id: string; q: string; at: number };

/**
 * 0.0.50 friend tickets, street side: after a trivia card is answered (and the lamp closes), offer to send that
 * card to a friend as a link; and, for a signed-in walker, collect friend-ticket whites the server has confirmed
 * (as sender or as friend) on load and every 45 s, with a small toast naming the friend (First L.).
 */
export function FriendTickets() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [sheet, setSheet] = useState<Offer | null>(null);

  useEffect(
    () =>
      useGame.subscribe((s, p) => {
        const card = p.openVault?.question;
        // A card was answered (asked grows on every answer, never on Leave lamp) and the lamp closed.
        // 0.0.53: not after a "Not now" in the last 24 h, and at most one unused nudge a session (friendOffer.ts).
        if (card && !s.openVault && s.asked !== p.asked) {
          const { local, session } = browserStores();
          if (offerAllowed(readOffer(local, session), Date.now())) setOffer({ id: card.id, q: card.q, at: Date.now() });
        }
        else if (s.openVault && !p.openVault)
          setOffer((o) => {
            // Walked on to the next lamp with the chip still up: that was this session's nudge.
            if (o) noteIgnored(browserStores().session);
            return null;
          });
      }),
    [],
  );

  useEffect(() => {
    if (!offer) return;
    const id = window.setTimeout(() => {
      setOffer((o) => {
        if (o !== offer) return o;
        noteIgnored(browserStores().session);
        return null;
      });
    }, OFFER_MS);
    return () => window.clearTimeout(id);
  }, [offer]);

  return (
    <>
      <FriendNews />
      {offer && !sheet ? (
        <div className="ft-offer-wrap">
          <div className="ft-offer" data-testid="friend-offer">
            <button
              type="button"
              className="ft-offer-go"
              onClick={() => {
                setSheet(offer);
                setOffer(null);
              }}
            >
              <Ticket className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>Send as a friend ticket</span>
            </button>
            <button
              type="button"
              className="ft-offer-x"
              aria-label="Not now"
              data-testid="friend-offer-dismiss"
              onClick={() => {
                const { local, session } = browserStores();
                noteDismissed(local, session, Date.now());
                setOffer(null);
              }}
            >
              <X className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
      {sheet ? <FriendSheet card={sheet} onClose={() => setSheet(null)} /> : null}
    </>
  );
}

type SheetState =
  | { kind: "making" }
  | { kind: "ready"; url: string; left: number }
  | { kind: "guest" }
  | { kind: "error"; text: string };

function FriendSheet({ card, onClose }: { card: Offer; onClose: () => void }) {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const [state, setState] = useState<SheetState>({ kind: "making" });
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setState({ kind: "guest" });
      return;
    }
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const r = await sendFriendTicket({ data: { cardId: card.id } });
        if ("status" in r) return setState({ kind: "error", text: "Easy there. Try again in a minute." });
        if (r.ok) return setState({ kind: "ready", url: `${window.location.origin}/t/${r.token}`, left: r.left });
        if (r.reason === "daily-cap") return setState({ kind: "error", text: `That's all ${DAILY_TICKETS} friend tickets for today. More at midnight UTC.` });
        if (r.reason === "guest") return setState({ kind: "guest" });
        setState({ kind: "error", text: "This trivia card can't travel. Try the next one." });
      } catch (e) {
        if (e instanceof Error && e.message === "Unauthorized") setState({ kind: "guest" });
        else setState({ kind: "error", text: "The ticket office is shut. Try again in a moment." });
      }
    })();
  }, [isPending, user, card.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const el = document.getElementById("ft-link") as HTMLInputElement | null;
      el?.select();
    }
  };

  const share = async (url: string) => {
    try {
      await navigator.share({ title: "Keyline friend ticket", text: "One trivia card, 25 seconds. Get it right and we both get a white match.", url });
    } catch (e) {
      // Cancelled is fine; anything else falls back to the clipboard.
      if (!(e instanceof DOMException && e.name === "AbortError")) void copy(url);
    }
  };

  return (
    <div className="ft-veil" onClick={onClose}>
      <div className="plate ft-sheet" role="dialog" aria-modal="true" aria-labelledby="ft-title" data-testid="friend-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">Friend ticket</p>
            <h2 id="ft-title" className="font-display mt-1 text-2xl leading-tight text-balance">
              Send this trivia card
            </h2>
          </div>
          <button type="button" className="ft-close" aria-label="Close" onClick={onClose}>
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <p className="ft-q">{card.q}</p>
        <p className="mt-3 text-sm text-pretty text-fg-muted">
          Your friend gets this exact card with the same 25-second wick. Get it right and you each get a White match.
        </p>

        {state.kind === "making" ? <div className="mt-4 h-11 animate-pulse rounded-md bg-bg-subtle" aria-label="Making your ticket" /> : null}

        {state.kind === "ready" ? (
          <div className="mt-4 flex flex-col gap-2">
            <label className="sr-only" htmlFor="ft-link">
              Ticket link
            </label>
            <input id="ft-link" className="ft-link" readOnly value={state.url} onFocus={(e) => e.currentTarget.select()} data-testid="friend-link" />
            <div className={`grid gap-2 ${canShare ? "grid-cols-2" : "grid-cols-1"}`}>
              {canShare ? (
                <button type="button" className="btn btn-primary w-full" onClick={() => void share(state.url)}>
                  <Share2 className="size-4" strokeWidth={1.75} aria-hidden /> Share
                </button>
              ) : null}
              <button type="button" className={`btn w-full ${canShare ? "btn-ghost" : "btn-primary"}`} onClick={() => void copy(state.url)}>
                {copied ? <Check className="size-4" strokeWidth={1.75} aria-hidden /> : <Copy className="size-4" strokeWidth={1.75} aria-hidden />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <p className="text-xs text-fg-subtle">
              One friend per ticket · good for 48 h · {state.left} of {DAILY_TICKETS} left today
            </p>
          </div>
        ) : null}

        {state.kind === "guest" ? (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm text-fg">Friend tickets need an account, so the white knows where to go.</p>
            <SignInActions />
          </div>
        ) : null}

        {state.kind === "error" ? <p className="mt-4 text-sm text-fg" role="status">{state.text}</p> : null}
      </div>
    </div>
  );
}

/** Lands confirmed friend-ticket whites in the save and says who they came from. */
function FriendNews() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user ? user.id : null;
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    let busy = false;
    const poll = async () => {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const items = await fetchFriendNews();
        if (!live || !items.length) return;
        const paid = useGame.getState().payFriendTickets(items.map((i) => i.id));
        // Ack everything listed: ids this save already paid are done too.
        await ackFriendNews({ data: { ids: items.map((i) => i.id) } });
        const fresh = items.filter((i) => paid.fresh.includes(i.id));
        if (!fresh.length || !live) return;
        setNote(newsLine(fresh, paid.added, paid.coins));
      } catch {
        /* offline or signed out mid-flight: the server keeps them until acked */
      } finally {
        busy = false;
      }
    };
    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      live = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId]);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 6500);
    return () => window.clearTimeout(id);
  }, [note]);

  if (!note) return null;
  return (
    <div className="ft-toast-wrap" role="status" aria-live="polite">
      <button type="button" className="panel ft-toast" data-testid="friend-toast" onClick={() => setNote(null)}>
        <Ticket className="size-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
        <span>{note}</span>
      </button>
    </div>
  );
}

function newsLine(items: { role: "sender" | "friend"; name: string }[], added: number, coins: number): string {
  const n = items.length;
  const tail = added && coins ? ` · +${added} White, +${coins} coin (pocket full)` : coins ? ` · +${coins} coin (pocket full)` : ` · +${n} White match${n === 1 ? "" : "es"}`;
  if (n === 1) {
    const it = items[0]!;
    return it.role === "sender" ? `${it.name} got your friend ticket right${tail}` : `Friend ticket from ${it.name}${tail}`;
  }
  const names = [...new Set(items.map((i) => i.name))];
  return `${names.slice(0, 2).join(" and ")}${names.length > 2 ? " and more" : ""}: friend tickets${tail}`;
}
