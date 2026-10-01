import { useCallback, useEffect, useRef, useState } from "react";
import { sfx, unlockAudio } from "@/game/audio";
import { WHERE_REVEAL_MS, type WhereClue, type WhereTally } from "@/game/whereAmI";

/**
 * A clue from a real place in the city ahead, four names to choose from.
 * Pure rules live in game/whereAmI.ts; this is the card, the clock and the input.
 */
export function WhereAmI({
  city,
  clues,
  roundMs,
  onDone,
  onQuit,
}: {
  city: string;
  clues: WhereClue[];
  roundMs: number;
  onDone: (t: WhereTally) => void;
  onQuit: () => void;
}) {
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [left, setLeft] = useState(Math.ceil(roundMs / 1000));
  const tally = useRef<WhereTally>({ asked: 0, right: 0, total: clues.length });
  const done = useRef(false);
  const start = useRef(0);
  const next = useRef<number | undefined>(undefined);
  const finish = useRef(onDone);
  finish.current = onDone;

  const end = useCallback(() => {
    if (done.current) return;
    done.current = true;
    window.clearTimeout(next.current);
    finish.current({ ...tally.current });
  }, []);

  useEffect(() => {
    start.current = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now() - start.current;
      setLeft(Math.max(0, Math.ceil((roundMs - t) / 1000)));
      if (t >= roundMs) end();
    }, 200);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(next.current);
    };
  }, [roundMs, end]);

  const clue = clues[at];

  const pick = useCallback(
    (name: string) => {
      if (done.current || picked || !clue) return;
      unlockAudio();
      const right = name === clue.answer;
      tally.current.asked += 1;
      if (right) {
        tally.current.right += 1;
        sfx.pickup();
      } else {
        sfx.wrong();
      }
      setPicked(name);
      next.current = window.setTimeout(() => {
        if (at + 1 >= clues.length) {
          end();
          return;
        }
        setPicked(null);
        setAt(at + 1);
      }, WHERE_REVEAL_MS);
    },
    [at, clue, clues.length, end, picked],
  );

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!clue || e.repeat) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= clue.choices.length) {
        e.preventDefault();
        pick(clue.choices[n - 1]!);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [clue, pick]);

  if (!clue) return null;
  const k = tally.current;

  return (
    <div className="ll-game wh-game">
      <div className="ll-bar">
        <p className="kicker">Where am I?</p>
        <p className="ll-stats tabular-nums">
          <span>
            Clue {Math.min(at + 1, clues.length)} of {clues.length}
          </span>
          <span>{k.right} right</span>
          <span className="ll-left">{left}s</span>
        </p>
      </div>
      <div className={`wh-card${picked ? (picked === clue.answer ? " is-hit" : " is-stray") : ""}`}>
        <p className="wh-where">Somewhere in {city}…</p>
        <p className="wh-clue font-display" aria-live="polite">
          {clue.clue}
        </p>
        <div className="ll-glass" aria-hidden />
      </div>
      <div className="wh-choices" role="group" aria-label="Which place is it?">
        {clue.choices.map((c, i) => {
          const state = !picked ? "" : c === clue.answer ? " is-answer" : c === picked ? " is-wrong" : " is-dim";
          return (
            <button
              key={c}
              type="button"
              className={`wh-choice${state}`}
              disabled={!!picked}
              onClick={() => pick(c)}
            >
              <span className="wh-key tabular-nums" aria-hidden>
                {i + 1}
              </span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      <div className="ll-foot">
        <p className="text-xs text-fg-subtle">
          {picked ? (picked === clue.answer ? "That's the one." : `It was ${clue.answer}.`) : "Tap the place the clue describes. Keys 1–4 work too."}
        </p>
        <button type="button" className="btn btn-quiet ll-quit" onClick={onQuit}>
          Stop
        </button>
      </div>
    </div>
  );
}
