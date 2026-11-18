import { useEffect, useRef, useState } from "react";
import { TIER_LABEL } from "@/game/data";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { wheelAngle, wheelSliceTone } from "@/game/wheel";
import { PUBLISH_STAMP } from "@/version";

const TURNS = 6;
const SPIN_MS = 4600;
export function MysteryWheel() {
  const wheel = useGame((s) => s.wheel);
  const loot = useGame((s) => s.loot);
  const miss = useGame((s) => s.miss);
  const openVault = useGame((s) => s.openVault);
  const claimWheel = useGame((s) => s.claimWheel);
  const dismissWheel = useGame((s) => s.dismissWheel);
  const spinWheel = useGame((s) => s.spinWheel);
  const paid = useGame((s) => s.wheelPaid);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(false);
  const [angle, setAngle] = useState(0);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    setSpinning(false);
    setLanded(false);
    setAngle(0);
    cancelAnimationFrame(raf.current);
    // Keyed on the offer itself, so a fresh offer never opens already "landed".
  }, [wheel]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  if (!wheel || loot || miss || openVault) return null;

  // 0.0.92: Take all and Nothing are half slices; everything else is a whole one.
  // 0.1.97: once the server answers, show its slices (the coin jitter comes from its roll).
  const slices = paid?.slices ?? wheel.slices;
  const units = slices.map((s) => (s.kind === "all" || s.kind === "nothing" ? 0.5 : 1));
  const unit = 360 / units.reduce((a, b) => a + b, 0);
  const starts: number[] = [];
  units.reduce((acc, u) => (starts.push(acc), acc + u * unit), 0);
  const widthOf = (i: number) => units[i]! * unit;
  const midOf = (i: number) => starts[i]! + widthOf(i) / 2;
  const underPointer = (a: number) => {
    const p = (((360 - (a % 360)) % 360) + 360) % 360;
    let k = 0;
    for (let i = 0; i < starts.length; i++) if (p >= starts[i]!) k = i;
    return k;
  };
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 0.0.92: signed in, land on the slice the server rolled and paid; a guest's own roll otherwise.
  const win = paid?.win ?? wheel.win;
  const targetFor = (i: number) => TURNS * 360 + (360 - midOf(i));
  const target = targetFor(win);
  const prize = slices[win]!;

  function tickPointer() {
    sfx.tick();
    const el = pointerRef.current;
    if (!el) return;
    el.classList.remove("is-tick");
    void el.offsetWidth;
    el.classList.add("is-tick");
  }

  function land(to = target) {
    setAngle(to);
    setSpinning(false);
    setLanded(true);
    sfx.pickup();
  }

  async function spin() {
    if (spinning || landed) return;
    sfx.open();
    setSpinning(true);
    const won = await spinWheel();
    if (won == null) return; // the claim failed: the store closed the wheel with a toast (0.0.89).
    const to = targetFor(won);
    if (reduce) {
      land(to);
      return;
    }
    const t0 = performance.now();
    let lastPeg = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / SPIN_MS);
      const a = wheelAngle(t, to);
      // The pointer sits on the slice edges' pegs: a click each time an edge passes under it.
      const peg = underPointer(a);
      if (peg !== lastPeg) {
        lastPeg = peg;
        tickPointer();
      }
      setAngle(a);
      if (t < 1) raf.current = requestAnimationFrame(frame);
      else land(to);
    };
    raf.current = requestAnimationFrame(frame);
  }

  return (
    <div className="wheel-night absolute inset-0 z-[860] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-labelledby="wheel-title">
      <div className="wheel-card relative w-full max-w-sm">
        {/* 0.0.89: always a way out. Closing does not use up the spin. */}
        <button
          type="button"
          className="btn btn-ghost absolute right-2 top-2 px-2 py-1 text-sm"
          aria-label="Close wheel, spin later"
          title="Later"
          onClick={() => dismissWheel()}
        >
          ✕
        </button>
        <p className="kicker" id="wheel-title">
          {TIER_LABEL[wheel.tier]} wheel
        </p>
        <h2 className="font-display mt-1 text-2xl">Twenty-five {TIER_LABEL[wheel.tier].toLowerCase()}.</h2>
        <p className="mt-1 text-sm text-fg-muted">The wheel doesn't say what it will pay.</p>
        <div className={`wheel-stage mt-4${spinning ? " is-spinning" : ""}${landed ? " is-landed" : ""}`}>
          <div ref={pointerRef} className="wheel-pointer" aria-hidden onAnimationEnd={(e) => e.currentTarget.classList.remove("is-tick")} />
          <img className="wheel-disc" data-testid="wheel-disc"
            src={`/sprites/wheel/${wheel.tier}.webp?v=${PUBLISH_STAMP}`}
            srcSet={`/sprites/wheel/${wheel.tier}.webp?v=${PUBLISH_STAMP} 1x, /sprites/wheel/${wheel.tier}@2x.webp?v=${PUBLISH_STAMP} 2x`}
            width={216} height={216} alt="" style={{ transform: `rotate(${angle}deg)` }} />
        </div>
        <ul className="wheel-legend" aria-label="Wheel prizes" aria-live="polite">
          {slices.map((prize, i) => (
            <li key={i} data-testid={`wheel-slice-${i}`} data-tone={wheelSliceTone(prize)}
              className={landed && i === win ? "wheel-won" : undefined}>
              <span>{prize.face}</span><b>{prize.label}</b>
            </li>
          ))}
        </ul>
        {landed ? (
          <div className="mt-4 text-center">
            <p className="kicker">It landed</p>
            <p className="font-display mt-1 text-3xl" data-testid="wheel-prize">
              {prize.label}
            </p>
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => claimWheel()}>
              Take it
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary mt-4 w-full" onClick={spin} disabled={spinning}>
            {spinning ? "Spinning" : "Spin"}
          </button>
        )}
      </div>
    </div>
  );
}
