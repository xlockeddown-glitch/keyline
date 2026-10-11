import { useEffect, useRef, useState } from "react";
import { TIER_LABEL } from "@/game/data";
import { BLITZ_FULL, BLITZ_STEPS, BLITZ_WINDOW_MS, blitzDue, blitzPoiId, blitzTakeLine } from "@/game/dailyBlitz";
import { choiceButtons, dropStaleFocus } from "@/game/choiceMarkup";
import { DIFF_LABEL, TRIVIA_CATS } from "@/game/triviaMeta";
import { dealTrivia, gradeTrivia } from "@/game/triviaApi";
import { SEEN_MAX } from "@/game/triviaSchema";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { PublicCard } from "@/game/triviaSchema";

const SEEN_ID = /^[A-Za-z0-9_:.~-]{1,80}$/;

type Phase = "intro" | "dealing" | "card" | "grading" | "reveal" | "result";
type Ending = "clear" | "miss" | "left" | "office";

/**
 * Daily Blitz: six lanterns, posted on the city's notice board. It no longer opens itself when you walk into town.
 */
export function DailyBlitz() {
  const open = useGame((s) => s.blitzOpen);
  const lastBlitzDay = useGame((s) => s.lastBlitzDay);
  const blitzTake = useGame((s) => s.blitzTake);
  const blitzMatches = useGame((s) => s.blitzMatches);
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [card, setCard] = useState<PublicCard | null>(null);
  const [token, setToken] = useState("");
  const [shownAt, setShownAt] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [ending, setEnding] = useState<Ending>("left");
  const [reveal, setReveal] = useState<{ correct: boolean; answer: string; fact?: string; match?: boolean; overflow?: number } | null>(null);
  const gen = useRef(0);
  const grading = useRef(false);

  useEffect(() => {
    if (!open) {
      gen.current += 1;
      setPhase("intro");
      setStep(0);
      setCard(null);
      setToken("");
      setReveal(null);
    }
  }, [open]);

  async function deal(i: number, ticket: number) {
    const st = useGame.getState();
    const rung = BLITZ_STEPS[i];
    if (!rung) return;
    setPhase("dealing");
    setCard(null);
    setReveal(null);
    try {
      const r = await dealTrivia({
        data: {
          city: st.cityId,
          cat: rung.cat,
          poiId: blitzPoiId(i),
          blank: { name: "Daily Blitz", kind: "landmark", tier: rung.tier },
          spark: true,
          windowMs: BLITZ_WINDOW_MS,
          seen: (st.seenIds ?? []).filter((x) => SEEN_ID.test(x)).slice(-SEEN_MAX),
          saveId: st.saveId,
        },
      });
      if (ticket !== gen.current || !useGame.getState().blitzOpen) return;
      if (!r.ok) {
        setEnding("office");
        setPhase("result");
        return;
      }
      useGame.getState().lockBlitz();
      useGame.getState().rememberCard(r.card.id);
      const t = performance.now();
      setStep(i);
      setCard(r.card);
      setToken(r.token);
      setShownAt(t);
      setDeadline(t + r.windowMs);
      setNow(t);
      setPhase("card");
      dropStaleFocus(document);
      grading.current = false;
    } catch {
      if (ticket !== gen.current) return;
      setEnding("office");
      setPhase("result");
    }
  }

  async function grade(choice: string | null) {
    if (grading.current || phase !== "card" || !card) return;
    grading.current = true;
    const ticket = gen.current;
    const rung = BLITZ_STEPS[step]!;
    setPhase("grading");
    const clientMs = Math.max(0, performance.now() - shownAt);
    let correct = false;
    let answer = "";
    let fact: string | undefined;
    try {
      const r = await gradeTrivia({ data: { token, choice, clientMs } });
      if (ticket !== gen.current) return;
      if (!r.ok) {
        setEnding("office");
        setPhase("result");
        return;
      }
      correct = r.correct && !r.timedOut;
      answer = r.answer;
      fact = r.fact;
    } catch {
      if (ticket !== gen.current) return;
      setEnding("office");
      setPhase("result");
      return;
    }
    if (correct) {
      sfx.correct();
      const grant = useGame.getState().bankBlitz(rung.pay, rung.tier);
      setReveal({ correct: true, answer, fact, match: grant.match, overflow: grant.overflow });
      if (step + 1 >= BLITZ_STEPS.length) {
        setEnding("clear");
        setPhase("reveal");
        return;
      }
      setPhase("reveal");
      window.setTimeout(() => {
        if (ticket !== gen.current) return;
        void deal(step + 1, ticket);
      }, 700);
      return;
    }
    sfx.wrong();
    setReveal({ correct: false, answer, fact });
    setEnding("miss");
    setPhase("reveal");
  }

  useEffect(() => {
    if (!open || phase !== "card") return;
    const id = window.setInterval(() => {
      const t = performance.now();
      setNow(t);
      if (t >= deadline) {
        window.clearInterval(id);
        void grade(null);
      }
    }, 100);
    return () => window.clearInterval(id);
    // grade closes over the card that owns this deadline
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, deadline]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        if (phase === "intro") useGame.getState().dismissBlitz();
        else if (phase === "card") stop();
        else if (phase === "reveal" || phase === "result") useGame.getState().dismissBlitz();
        return;
      }
      if (phase !== "card" || !card) return;
      const n = ["Digit1", "Digit2", "Digit3", "Digit4", "Numpad1", "Numpad2", "Numpad3", "Numpad4"].indexOf(e.code);
      const slot = n === -1 ? -1 : n % 4;
      const text = slot >= 0 ? card.choices[slot] : undefined;
      if (!text) return;
      e.preventDefault();
      sfx.ui();
      void grade(text);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function stop() {
    gen.current += 1;
    grading.current = false;
    setEnding("left");
    setPhase("result");
  }

  if (!open) return null;

  const rung = BLITZ_STEPS[step] ?? BLITZ_STEPS[0]!;
  const cat = TRIVIA_CATS.find((c) => c.id === rung.cat);
  const left = phase === "card" ? Math.max(0, deadline - now) : 0;
  const frac = phase === "card" ? Math.min(1, left / Math.max(1, deadline - shownAt)) : 0;
  const take = blitzTake;
  const haul = blitzTakeLine(take, blitzMatches);

  return (
    <div className={`vault-night tier-${rung.tier} absolute inset-0 z-[860] flex items-end justify-center p-3 sm:items-center`}>
      <div
        className="plate lamp-card w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blitz-title"
        data-testid="daily-blitz"
      >
        <div className="lamp-card-body px-5 pt-5 sm:px-6 sm:pt-6">
          <p className="kicker">Daily Blitz</p>
          <h2 id="blitz-title" className="font-display mt-1 text-3xl leading-none">
            {phase === "result" ? (ending === "clear" ? "All six lit" : "That's the run") : "Light the ladder"}
          </h2>
          {phase === "intro" ? (
            <p className="mt-2 text-sm tabular-nums">Full clear · {BLITZ_FULL} coin</p>
          ) : null}

          {phase === "intro" ? (
            <div className="mt-4">
              <p className="text-sm text-pretty text-fg-muted">
                Six lanterns, white through violet. Each one pays coin and a match of that color. A miss ends it, and you keep what you lit.
              </p>
              <ol className="mt-4 grid gap-1.5">
                {BLITZ_STEPS.map((s, i) => (
                  <li key={s.tier} className="flex items-center justify-between text-sm">
                    <span>
                      {i + 1}. {TIER_LABEL[s.tier]}
                    </span>
                    <span className="tabular-nums text-fg-muted">+{s.pay} · match</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {phase === "dealing" ? <p className="mt-4 text-sm text-fg-muted">Striking the {TIER_LABEL[rung.tier].toLowerCase()} lantern…</p> : null}

          {card && (phase === "card" || phase === "grading") ? (
            <div className="plate-quiz mt-4">
              <div className={`wick ${left < 5000 ? "is-short" : ""}`} aria-hidden>
                <i style={{ width: `${frac * 100}%` }} />
              </div>
              <p className="plate-meta">
                <span>
                  {step + 1} of {BLITZ_STEPS.length} · {TIER_LABEL[rung.tier]}
                </span>
                <span>{cat?.label}</span>
                <span>{DIFF_LABEL[card.diff]}</span>
                <span className="tabular-nums">{(left / 1000).toFixed(1)}s</span>
                <span className="tabular-nums">
                  {take > 0 ? `${take} in · ` : ""}+{rung.pay} · match
                </span>
              </p>
              <div className="mt-2 flex gap-1.5" aria-hidden>
                {BLITZ_STEPS.map((s, i) => (
                  <span key={s.tier} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-bg-subtle"}`} />
                ))}
              </div>
              <p className="plate-q">{card.q}</p>
              <div className="plate-choices">
                {choiceButtons(card.id, card.choices).map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    className={b.className}
                    disabled={phase === "grading"}
                    onClick={() => {
                      sfx.ui();
                      void grade(b.text);
                    }}
                  >
                    <span className="plate-letter">{b.letter}</span>
                    <span className="min-w-0 text-pretty">{b.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {phase === "reveal" && reveal ? (
            <div className="mt-4">
              <p className="text-sm">
                {reveal.correct
                  ? reveal.match
                    ? `Right. +${rung.pay} coin and a ${TIER_LABEL[rung.tier]} match.`
                    : `Right. +${rung.pay} coin. The ${TIER_LABEL[rung.tier].toLowerCase()} pocket is full, so ${reveal.overflow} coin instead.`
                  : "Miss. The run stops here."}
              </p>
              <p className="plate-q mt-3">{reveal.answer}</p>
              {reveal.fact ? <p className="mt-2 text-sm text-pretty text-fg-muted">{reveal.fact}</p> : null}
              <p className="mt-3 text-sm tabular-nums">{haul} banked</p>
            </div>
          ) : null}

          {phase === "result" ? (
            <div className="mt-4">
              <p className="text-sm text-pretty text-fg-muted">
                {ending === "clear"
                  ? `Every lantern held. ${haul}.`
                  : ending === "office"
                    ? blitzDue(lastBlitzDay, new Date().toISOString().slice(0, 10))
                      ? "The card office didn't answer. Nothing was spent."
                      : "The card office didn't answer. What you already lit stays; the rest waits until tomorrow."
                    : ending === "left"
                      ? `You stopped. ${haul} stays in the pocket.`
                      : `The ${TIER_LABEL[rung.tier].toLowerCase()} lantern went out. ${haul} stays.`}
              </p>
              {reveal && !reveal.correct ? (
                <p className="mt-3 text-sm text-pretty">
                  {reveal.answer}
                  {reveal.fact ? <span className="mt-1 block text-fg-muted">{reveal.fact}</span> : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="lamp-card-foot px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
          {phase === "intro" ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => {
                  sfx.ui();
                  void deal(0, gen.current);
                }}
              >
                Strike the first
              </button>
              <button type="button" className="btn btn-ghost w-full" onClick={() => useGame.getState().dismissBlitz()}>
                Not now
              </button>
            </div>
          ) : null}
          {phase === "card" || phase === "dealing" ? (
            <button type="button" className="btn btn-ghost w-full" onClick={stop} disabled={phase === "dealing" && step === 0 && !card}>
              {take > 0 ? `Keep ${haul} and stop` : "Stop"}
            </button>
          ) : null}
          {phase === "reveal" && !reveal?.correct ? (
            <button type="button" className="btn btn-primary w-full" onClick={() => setPhase("result")}>
              Take it
            </button>
          ) : null}
          {phase === "reveal" && reveal?.correct && ending === "clear" ? (
            <button type="button" className="btn btn-primary w-full" onClick={() => setPhase("result")}>
              Take it
            </button>
          ) : null}
          {phase === "result" ? (
            blitzDue(lastBlitzDay, new Date().toISOString().slice(0, 10)) ? (
              <button type="button" className="btn btn-primary w-full" onClick={() => setPhase("intro")}>
                Try again
              </button>
            ) : (
              <button type="button" className="btn btn-primary w-full" onClick={() => useGame.getState().dismissBlitz()}>
                Close
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
