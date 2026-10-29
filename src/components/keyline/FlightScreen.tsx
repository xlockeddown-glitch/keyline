import { useEffect, useRef, useState } from "react";
import { sfx } from "@/game/audio";
import { CITIES } from "@/game/data";
import { FLIGHT_FADE_MS, LANDING_MS, SOUVENIRS, TAKEOFF_MS, WINDOW_MAX_MS, milesBetween } from "@/game/flight";
import { useGame } from "@/game/store";
import { dealTrivia, gradeTrivia } from "@/game/triviaApi";
import { SEEN_MAX, type PublicCard } from "@/game/triviaSchema";

const SEEN_ID = /^[A-Za-z0-9_:.~-]{1,80}$/;
type Phase = "takeoff" | "window" | "landing";
type Reveal = { correct: boolean; answer: string };

/**
 * 0.1.63 Airports: a far trip by air. Takeoff on a runway, a window seat with clouds and a Geography
 * card (dealt and graded on the server, like every card), then landing. Vector/CSS art only; transforms
 * only, a handful of elements, nothing per-frame in JS.
 */
export function FlightScreen() {
  const flight = useGame((s) => s.flight);
  const finish = useGame((s) => s.finishFlight);
  const [phase, setPhase] = useState<Phase>("takeoff");
  const [card, setCard] = useState<PublicCard | null>(null);
  const [token, setToken] = useState("");
  const [shownAt, setShownAt] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const done = useRef(false);
  const grading = useRef(false);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const land = () => {
    if (done.current) return;
    setPhase("landing");
    window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      finish();
    }, reduce ? FLIGHT_FADE_MS : LANDING_MS);
  };

  useEffect(() => {
    done.current = false;
    if (!reduce) sfx.loopWhoosh();
    const t = window.setTimeout(() => setPhase("window"), reduce ? FLIGHT_FADE_MS : TAKEOFF_MS);
    return () => window.clearTimeout(t);
  }, [reduce]);

  // The window view deals one Geography card, and lands on its own if nobody answers.
  useEffect(() => {
    if (phase !== "window" || !flight) return;
    let live = true;
    const st = useGame.getState();
    void dealTrivia({
      data: {
        city: flight.to,
        cat: "geography",
        poiId: `flight-${flight.from}-${flight.to}`,
        blank: { name: "Window seat", kind: "landmark", tier: "white" },
        spark: true,
        windowMs: WINDOW_MAX_MS - 1000,
        seen: (st.seenIds ?? []).filter((x) => SEEN_ID.test(x)).slice(-SEEN_MAX),
        saveId: st.saveId,
      },
    })
      .then((r) => {
        if (!live || !r.ok) return;
        useGame.getState().rememberCard(r.card.id);
        setCard(r.card);
        setToken(r.token);
        setShownAt(performance.now());
      })
      .catch(() => {});
    const t = window.setTimeout(() => {
      if (live && !grading.current) land();
    }, WINDOW_MAX_MS);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
    // land closes over refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, flight]);

  async function pick(choice: string) {
    if (grading.current || !token) return;
    grading.current = true;
    sfx.ui();
    try {
      const r = await gradeTrivia({ data: { token, choice, clientMs: Math.max(0, performance.now() - shownAt) } });
      if (r.ok) {
        const ok = r.correct && !r.timedOut;
        if (ok) sfx.correct();
        else sfx.wrong();
        setReveal({ correct: ok, answer: r.answer });
      }
    } catch {
      /* offline: just land */
    }
    window.setTimeout(land, 1800);
  }

  if (!flight) return null;
  const from = CITIES[flight.from]?.name ?? flight.from;
  const to = CITIES[flight.to]?.name ?? flight.to;
  const miles = Math.round(milesBetween(flight.from, flight.to) / 10) * 10;

  return (
    <div className={`flight-screen is-${phase}${reduce ? " is-reduced" : ""}`} data-testid="flight-screen" data-phase={phase}>
      {phase === "window" ? (
        <div className="flight-cabin" aria-hidden="true">
          <div className="flight-window">
            <div className="flight-sky">
              <i className="flight-cloud c1" />
              <i className="flight-cloud c2" />
              <i className="flight-cloud c3" />
              <svg className="flight-wing" viewBox="0 0 200 80" preserveAspectRatio="none">
                <path d="M0 62 L200 30 L200 44 L0 80 Z" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="flight-runway" aria-hidden="true">
          <i className="flight-strip" />
          <svg className="flight-plane" viewBox="0 0 120 40">
            <path d="M6 22 Q10 16 22 16 L92 16 Q112 16 116 22 Q112 27 92 27 L22 27 Q10 27 6 22 Z" />
            <path d="M44 18 L70 2 L78 2 L62 18 Z M44 25 L70 40 L78 40 L62 25 Z M10 18 L4 6 L12 6 L20 17 Z" />
          </svg>
        </div>
      )}
      <p className="flight-route">
        <span className="kicker">{phase === "takeoff" ? "Takeoff" : phase === "landing" ? `Landing · ${SOUVENIRS[flight.to]}` : `Window seat · ${miles.toLocaleString()} mi`}</span>
        <span className="font-display text-2xl">
          {from} → {to}
        </span>
      </p>
      {phase === "window" && card ? (
        <div className="flight-card panel" data-testid="flight-card">
          <p className="kicker">Geography</p>
          <p className="mt-1 text-base leading-snug">{card.q}</p>
          <div className="mt-3 grid gap-2">
            {card.choices.map((c) => (
              <button
                key={c}
                type="button"
                className={`btn ${reveal && c === reveal.answer ? "btn-primary" : "btn-quiet"} justify-start text-left text-sm`}
                disabled={grading.current}
                onClick={() => void pick(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {reveal ? <p className="mt-2 text-sm text-fg-muted">{reveal.correct ? "Right." : `It was ${reveal.answer}.`}</p> : null}
        </div>
      ) : null}
      <button
        type="button"
        className="btn btn-quiet flight-skip"
        data-testid="flight-skip"
        onClick={() => {
          if (done.current) return;
          done.current = true;
          finish();
        }}
      >
        Skip
      </button>
    </div>
  );
}
