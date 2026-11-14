import { useEffect, useRef, useState } from "react";
import { sfx } from "@/game/audio";
import { CITIES } from "@/game/data";
import { factoryColor } from "@/game/carPaint";
import { LOOP_FADE_MS, LOOP_MS, WHERE_REVEAL_MS, WHERE_WINDOW_MS, wherePoiId } from "@/game/loop";
import { useGame } from "@/game/store";
import { dealTrivia, gradeTrivia } from "@/game/triviaApi";
import { SEEN_MAX, type PublicCard } from "@/game/triviaSchema";

const SEEN_ID = /^[A-Za-z0-9_:.~-]{1,80}$/;
type Where = { card: PublicCard; token: string; shownAt: number; reveal?: { correct: boolean; answer: string } };

/**
 * 0.1.58: the Loop tunnel ride, your car on a sled. 0.1.157: the tube is Ryan's painted tunnel, one copy zooming into the vanishing point over the ride; the sled sits on the near rails.
 * 0.1.168: an optional Where am I? card. Tapping it holds the ride on its last frame; the server deals one clue
 * (a real place in the destination city) and grades it like the flight's Geography card (a white spark). Skip still lands.
 */
export function LoopScreen() {
  const loop = useGame((s) => s.loop);
  const carOn = useGame((s) => s.carOn);
  const paint = useGame((s) => (s.carOn ? s.carPaint[s.carOn] : undefined));
  const finish = useGame((s) => s.finishLoop);
  const done = useRef(false);
  const endTimer = useRef(0);
  const grading = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [where, setWhere] = useState<Where | null>(null);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const end = () => {
    if (done.current) return;
    done.current = true;
    window.clearTimeout(endTimer.current);
    finish();
  };

  useEffect(() => {
    done.current = false;
    const land = () => {
      if (done.current) return;
      done.current = true;
      finish();
    };
    if (reduce) {
      endTimer.current = window.setTimeout(land, LOOP_FADE_MS);
      return () => window.clearTimeout(endTimer.current);
    }
    sfx.loopWhoosh();
    const swoop = window.setTimeout(() => sfx.loopWhoosh(), LOOP_MS - 1400);
    endTimer.current = window.setTimeout(land, LOOP_MS);
    return () => {
      window.clearTimeout(swoop);
      window.clearTimeout(endTimer.current);
    };
  }, [finish, reduce]);

  function play() {
    if (!loop || playing || done.current) return;
    sfx.ui();
    setPlaying(true);
    // Hold the ride: the card's own clock lands it if nobody answers.
    window.clearTimeout(endTimer.current);
    endTimer.current = window.setTimeout(() => {
      if (!grading.current) end();
    }, WHERE_WINDOW_MS);
    const st = useGame.getState();
    void dealTrivia({
      data: {
        city: loop.to,
        cat: "geography",
        poiId: wherePoiId(loop.from, loop.to),
        blank: { name: "Where am I?", kind: "landmark", tier: "white" },
        spark: true,
        windowMs: WHERE_WINDOW_MS - 1000,
        seen: (st.seenIds ?? []).filter((x) => SEEN_ID.test(x)).slice(-SEEN_MAX),
        saveId: st.saveId,
      },
    })
      .then((r) => {
        if (done.current) return;
        if (!r.ok) return end();
        useGame.getState().rememberCard(r.card.id);
        setWhere({ card: r.card, token: r.token, shownAt: performance.now() });
      })
      .catch(() => end());
  }

  async function pick(choice: string) {
    if (grading.current || !where) return;
    grading.current = true;
    sfx.ui();
    try {
      const r = await gradeTrivia({ data: { token: where.token, choice, clientMs: Math.max(0, performance.now() - where.shownAt) } });
      if (r.ok) {
        const ok = r.correct && !r.timedOut;
        if (ok) sfx.correct();
        else sfx.wrong();
        setWhere({ ...where, reveal: { correct: ok, answer: r.answer } });
      }
    } catch {
      /* offline: just land */
    }
    window.clearTimeout(endTimer.current);
    endTimer.current = window.setTimeout(end, WHERE_REVEAL_MS);
  }

  if (!loop) return null;
  const from = CITIES[loop.from]?.name ?? loop.from;
  const to = CITIES[loop.to]?.name ?? loop.to;
  const tint = carOn && paint && paint !== factoryColor(carOn) ? paint : "";

  return (
    <div className={`loop-screen${reduce ? " is-reduced" : ""}${playing ? " is-playing" : ""}`} style={{ ["--loop-ms" as string]: `${LOOP_MS}ms` }} data-testid="loop-screen">
      <div className="loop-tube" aria-hidden="true">
        <i className="loop-paint" />
        <div className="loop-sled">
          <div className="cab-sprite" data-face="right" data-car={carOn ?? ""} data-paint={tint} />
          <i className="loop-skid" />
        </div>
      </div>
      <p className="loop-route">
        <span className="kicker">The Loop</span>
        <span className="font-display text-2xl">
          {from} → {to}
        </span>
      </p>
      {where ? (
        <div className="loop-card panel" data-testid="loop-card">
          <p className="kicker">Where am I? · {to}</p>
          <p className="mt-1 text-base leading-snug">{where.card.q}</p>
          <div className="mt-3 grid gap-2">
            {where.card.choices.map((c) => (
              <button
                key={c}
                type="button"
                className={`btn ${where.reveal && c === where.reveal.answer ? "btn-primary" : "btn-quiet"} justify-start text-left text-sm`}
                disabled={grading.current}
                onClick={() => void pick(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {where.reveal ? <p className="mt-2 text-sm text-fg-muted">{where.reveal.correct ? "Right." : `It was ${where.reveal.answer}.`}</p> : null}
        </div>
      ) : null}
      {!reduce && !playing ? (
        <button type="button" className="btn btn-primary loop-where" data-testid="loop-where" onClick={play}>
          Where am I?
        </button>
      ) : null}
      <button type="button" className="btn btn-quiet loop-skip" data-testid="loop-skip" onClick={end}>
        Skip
      </button>
    </div>
  );
}
