import { useEffect, useRef } from "react";
import { sfx } from "@/game/audio";
import { CITIES } from "@/game/data";
import { factoryColor } from "@/game/carPaint";
import { LOOP_FADE_MS, LOOP_MS } from "@/game/loop";
import { useGame } from "@/game/store";

/** 0.1.58: the Loop tunnel ride. CSS only: a dark tube, lights rushing past, your car on a sled. */
export function LoopScreen() {
  const loop = useGame((s) => s.loop);
  const carOn = useGame((s) => s.carOn);
  const paint = useGame((s) => (s.carOn ? s.carPaint[s.carOn] : undefined));
  const finish = useGame((s) => s.finishLoop);
  const done = useRef(false);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    done.current = false;
    const end = () => {
      if (done.current) return;
      done.current = true;
      finish();
    };
    if (reduce) {
      const t = window.setTimeout(end, LOOP_FADE_MS);
      return () => window.clearTimeout(t);
    }
    sfx.loopWhoosh();
    const swoop = window.setTimeout(() => sfx.loopWhoosh(), LOOP_MS - 1400);
    const t = window.setTimeout(end, LOOP_MS);
    return () => {
      window.clearTimeout(swoop);
      window.clearTimeout(t);
    };
  }, [finish, reduce]);

  if (!loop) return null;
  const from = CITIES[loop.from]?.name ?? loop.from;
  const to = CITIES[loop.to]?.name ?? loop.to;
  const tint = carOn && paint && paint !== factoryColor(carOn) ? paint : "";

  return (
    <div className={`loop-screen${reduce ? " is-reduced" : ""}`} style={{ ["--loop-ms" as string]: `${LOOP_MS}ms` }} data-testid="loop-screen">
      <div className="loop-tube" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} className="loop-ring" style={{ animationDelay: `${(-i * 0.9) / 8}s` }} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <i key={`l${i}`} className="loop-light" style={{ animationDelay: `${(-i * 0.9) / 6}s` }} />
        ))}
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
      <button
        type="button"
        className="btn btn-quiet loop-skip"
        data-testid="loop-skip"
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
