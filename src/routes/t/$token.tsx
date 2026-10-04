import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignInActions } from "@/components/keyline/AuthChip";
import { answerFriendTicket, openFriendTicket, peekFriendTicket } from "@/game/friendApi";
import { CARD_MS, rewardLine } from "@/game/friendTicket";
import type { TriviaDiff } from "@/game/types";

export const Route = createFileRoute("/t/$token")({
  component: FriendTicketPage,
  head: () => ({ meta: [{ title: "KEYLINE · Friend ticket" }, { name: "robots", content: "noindex" }] }),
});

const LETTERS = ["A", "B", "C", "D"] as const;
/** Same words as the lamp card (trivia.ts DIFF_LABEL), kept here so this page doesn't pull in the trivia bank. */
const DIFF_LABEL: Record<TriviaDiff, string> = { 1: "Easy", 2: "Standard", 3: "Hard" };

type Play = { q: string; choices: string[]; diff: TriviaDiff; deadline: number; total: number };
type Result = { correct: boolean; answer: string; choice: string | null; fact: string | null; rewarded: boolean; why: string | null };
type View =
  | { kind: "loading" }
  | { kind: "landing"; from: string; expiresAt: number | null }
  | { kind: "play"; from: string; play: Play }
  | { kind: "result"; from: string; result: Result }
  | { kind: "closed"; title: string; body: string };

const closed = (status: string, from: string | null): View => {
  const who = from ?? "A friend";
  if (status === "self") return { kind: "closed", title: "This one's yours", body: "You sent this ticket. Pass the link to a friend — they answer, you both get a white." };
  if (status === "expired") return { kind: "closed", title: "This ticket expired", body: `Friend tickets are good for 48 hours. Ask ${who} for a fresh one.` };
  if (status === "used" || status === "taken") return { kind: "closed", title: "Already redeemed", body: `Someone else answered ${who}'s card first. One friend per ticket.` };
  if (status === "slow") return { kind: "closed", title: "One moment", body: "Too many tries just now. Wait a minute and reload." };
  return { kind: "closed", title: "No such ticket", body: "This link doesn't match a friend ticket. Check it was copied whole." };
};

function FriendTicketPage() {
  const { token } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [view, setView] = useState<View>({ kind: "loading" });
  const sent = useRef(false);

  useEffect(() => {
    let live = true;
    void peekFriendTicket({ data: { token } })
      .then((p) => {
        if (!live) return;
        if (p.status === "live") setView({ kind: "landing", from: p.from ?? "A friend", expiresAt: p.expiresAt });
        // A used ticket may be this walker's own redemption: let open() say which once signed in.
        else if (p.status === "used") setView({ kind: "landing", from: p.from ?? "A friend", expiresAt: null });
        else setView(closed(p.status, "from" in p ? p.from : null));
      })
      .catch(() => live && setView(closed("missing", null)));
    return () => {
      live = false;
    };
  }, [token]);

  const open = useCallback(async () => {
    try {
      const r = await openFriendTicket({ data: { token } });
      if (r.status === "play") {
        sent.current = false;
        setView({ kind: "play", from: r.from, play: { q: r.q, choices: r.choices, diff: r.diff, deadline: performance.now() + r.msLeft, total: r.msTotal } });
      } else if (r.status === "scored") setView({ kind: "result", from: r.from, result: r });
      else setView(closed(r.status, "from" in r ? r.from : null));
    } catch {
      setView(closed("missing", null));
    }
  }, [token]);

  // A walker coming back to a ticket they already opened goes straight to it (same wick, no restart).
  useEffect(() => {
    if (view.kind === "landing" && view.expiresAt == null && user) void open();
  }, [view, user, open]);

  const answer = useCallback(
    async (choice: string, from: string) => {
      if (sent.current) return;
      sent.current = true;
      try {
        const r = await answerFriendTicket({ data: { token, choice } });
        if (r.status === "scored") setView({ kind: "result", from, result: r });
        else if (r.status === "slow") {
          sent.current = false;
        } else setView(closed(r.reason === "self" ? "self" : "used", from));
      } catch {
        sent.current = false;
      }
    },
    [token],
  );

  return (
    <div className="title-night">
      <div className="title-pave" aria-hidden />
      <main className="title-folio ft-page" data-testid="friend-page">
        <div className="street-blade" aria-label="Keyline">
          <span>Friend ticket</span>
          <strong>KEYLINE</strong>
        </div>
        {view.kind === "loading" || (view.kind === "landing" && isPending) ? <div className="h-40 animate-pulse rounded-xl bg-bg-subtle" aria-hidden /> : null}

        {view.kind === "landing" && !isPending ? (
          <section className="plate p-5" data-testid="friend-landing">
            <p className="kicker inline-flex items-center gap-1.5">
              <Ticket className="size-3.5" strokeWidth={1.75} aria-hidden /> From {view.from}
            </p>
            <h1 className="font-display mt-2 text-2xl leading-tight text-balance">{view.from} sent you a trivia card</h1>
            <p className="mt-2 text-sm text-pretty text-fg-muted">
              One card, {Math.round(CARD_MS / 1000)} seconds on the wick. Get it right and you each get a White match.
            </p>
            <p className="mt-1 text-xs text-pretty text-fg-subtle">A one-card preview: it plays even if its city isn't unlocked in your game yet.</p>
            {user ? (
              <button type="button" className="btn btn-primary title-go mt-4" onClick={() => void open()} data-testid="friend-play">
                Play the card
              </button>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-sm text-fg">Sign in to play — the white goes to your account.</p>
                <SignInActions callbackURL={`/t/${token}`} />
              </div>
            )}
          </section>
        ) : null}

        {view.kind === "play" ? <PlayCard key={view.play.q} play={view.play} onAnswer={(c) => void answer(c, view.from)} /> : null}

        {view.kind === "result" ? <ResultCard from={view.from} result={view.result} /> : null}

        {view.kind === "closed" ? (
          <section className="plate p-5" data-testid="friend-closed">
            <h1 className="font-display text-2xl leading-tight text-balance">{view.title}</h1>
            <p className="mt-2 text-sm text-pretty text-fg-muted">{view.body}</p>
          </section>
        ) : null}

        <Link to="/" className="title-more">
          {view.kind === "result" && view.result.rewarded ? "Walk the street — your white is waiting" : "Back to the street"}
        </Link>
      </main>
    </div>
  );
}

function PlayCard({ play, onAnswer }: { play: Play; onAnswer: (choice: string) => void }) {
  const [now, setNow] = useState(() => performance.now());
  const [picked, setPicked] = useState<string | null>(null);
  const pick = useCallback(
    (c: string) => {
      if (picked) return;
      setPicked(c);
      onAnswer(c);
    },
    [picked, onAnswer],
  );

  useEffect(() => {
    let id = 0;
    const tick = () => {
      setNow(performance.now());
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    const out = window.setTimeout(() => pick("__timeout__"), Math.max(0, play.deadline - performance.now()));
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(out);
    };
  }, [play.deadline, pick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = ["KeyA", "KeyB", "KeyC", "KeyD"].indexOf(e.code);
      const n = idx >= 0 ? idx : ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      const c = n >= 0 ? play.choices[n] : undefined;
      if (!c) return;
      e.preventDefault();
      pick(c);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play.choices, pick]);

  const left = Math.max(0, play.deadline - now);
  const frac = Math.min(1, left / play.total);
  const elapsed = play.total - left;
  const grade = elapsed <= 3000 ? "Perfect" : elapsed <= 10000 ? "Great" : "Good";
  return (
    <section className="plate plate-quiz p-5" data-testid="friend-card">
      <div className={`wick ${left < 5000 ? "is-short" : `is-${grade.toLowerCase()}`}`} aria-hidden>
        <i style={{ width: `${frac * 100}%` }} />
      </div>
      <p className="plate-meta">
        <span>{DIFF_LABEL[play.diff]}</span>
        <span className="tabular-nums">{(left / 1000).toFixed(1)}s</span>
      </p>
      <p className="plate-q">{play.q}</p>
      <div className="plate-choices">
        {play.choices.map((c, i) => (
          <button key={c} type="button" className={`plate-choice${picked === c ? " is-picked" : ""}`} disabled={Boolean(picked)} onClick={() => pick(c)}>
            <span className="plate-letter">{LETTERS[i]}</span>
            <span className="min-w-0 text-pretty">{c}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-fg-subtle">A–D or 1–4</p>
    </section>
  );
}

function ResultCard({ from, result }: { from: string; result: Result }) {
  const why = result.rewarded ? null : (result.why as Parameters<typeof rewardLine>[0]);
  return (
    <section className={`plate p-5 ft-result ${result.correct ? "is-hit" : "is-miss"}`} data-testid="friend-result">
      <p className="kicker">{result.correct ? "Right" : result.choice == null ? "Out of time" : "Miss"}</p>
      <h1 className="font-display mt-1 text-2xl leading-tight text-balance">{rewardLine(why, from)}</h1>
      {result.rewarded ? <p className="mt-2 text-sm text-fg-muted">Yours lands in your pocket when you open the street. {from} sees it next time they look.</p> : null}
      <p className="mt-3 text-sm text-fg-muted">The trivia card read:</p>
      <p className="mt-1 text-base font-medium text-pretty">{result.answer}</p>
      {result.fact ? <p className="mt-2 text-xs text-fg-subtle text-pretty">{result.fact}</p> : null}
    </section>
  );
}
