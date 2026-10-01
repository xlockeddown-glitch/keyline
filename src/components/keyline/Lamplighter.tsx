import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sfx, unlockAudio } from "@/game/audio";
import { LAMP_HIT_MS, LAMP_TRAVEL_MS, lampInFrame, lampSchedule, type LampTally } from "@/game/rideGames";

/**
 * Lamps slide past the carriage window. Tap (or Space) as one meets the frame to light it.
 * Pure rules live in game/rideGames.ts; this is the window, the clock and the input.
 */
export function Lamplighter({
  roundMs,
  seed,
  onDone,
  onQuit,
}: {
  roundMs: number;
  seed: number;
  onDone: (t: LampTally) => void;
  onQuit: () => void;
}) {
  const lamps = useMemo(() => lampSchedule(roundMs, seed), [roundMs, seed]);
  const start = useRef(0);
  const lit = useRef(new Set<number>());
  const missed = useRef(new Set<number>());
  const tally = useRef({ hits: 0, strays: 0, streak: 0, best: 0 });
  const done = useRef(false);
  const [now, setNow] = useState(0);
  const [flash, setFlash] = useState<"hit" | "stray" | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const finish = useRef(onDone);
  finish.current = onDone;

  useEffect(() => {
    start.current = performance.now();
    let raf = 0;
    const frame = () => {
      const t = performance.now() - start.current;
      for (const l of lamps) {
        if (!lit.current.has(l.id) && !missed.current.has(l.id) && t > l.at + LAMP_HIT_MS) {
          missed.current.add(l.id);
          tally.current.streak = 0;
        }
      }
      if (t >= roundMs) {
        if (!done.current) {
          done.current = true;
          const { hits, strays, best } = tally.current;
          finish.current({ lamps: lamps.length, hits, strays, streak: best });
        }
        return;
      }
      setNow(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [lamps, roundMs]);

  const strike = useCallback(() => {
    if (done.current) return;
    unlockAudio();
    const t = performance.now() - start.current;
    const hit = lampInFrame(lamps, lit.current, t);
    const k = tally.current;
    if (hit) {
      lit.current.add(hit.id);
      k.hits += 1;
      k.streak += 1;
      k.best = Math.max(k.best, k.streak);
      sfx.pickup();
    } else {
      k.strays += 1;
      k.streak = 0;
      sfx.wrong();
    }
    setFlash(hit ? "hit" : "stray");
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 180);
  }, [lamps]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!e.repeat) strike();
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      window.clearTimeout(flashTimer.current);
    };
  }, [strike]);

  const left = Math.max(0, Math.ceil((roundMs - now) / 1000));
  const span = LAMP_TRAVEL_MS / 2 + 200;
  const k = tally.current;

  return (
    <div className="ll-game">
      <div className="ll-bar">
        <p className="kicker">Lamplighter</p>
        <p className="ll-stats tabular-nums">
          <span>{k.hits} lit</span>
          {k.streak >= 3 ? <span className="ll-streak">{k.streak} in a row</span> : null}
          <span className="ll-left">{left}s</span>
        </p>
      </div>
      <div
        className={`ll-window${flash ? ` is-${flash}` : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Light the lamp in the frame"
        onPointerDown={(e) => {
          e.preventDefault();
          strike();
        }}
      >
        <div className="ll-skyline" style={{ backgroundPositionX: `${-now * 0.02}px` }} aria-hidden />
        <div className="ll-street" aria-hidden>
          {lamps.map((l) => {
            const d = l.at - now;
            if (Math.abs(d) > span) return null;
            const x = 50 + (d / LAMP_TRAVEL_MS) * 100;
            const state = lit.current.has(l.id) ? " is-lit" : missed.current.has(l.id) ? " is-missed" : "";
            return (
              <span key={l.id} className={`ll-lamp tier-${l.tier}${state}`} style={{ left: `${x}%` }}>
                <i className="ll-head" />
                <i className="ll-post" />
              </span>
            );
          })}
        </div>
        <div className="ll-frame" aria-hidden>
          <i />
        </div>
        <div className="ll-glass" aria-hidden />
      </div>
      <div className="ll-foot">
        <p className="text-xs text-fg-subtle">Tap when a lamp meets the brass. Space works too.</p>
        <button type="button" className="btn btn-quiet ll-quit" onClick={onQuit}>
          Stop
        </button>
      </div>
    </div>
  );
}
