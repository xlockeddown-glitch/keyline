import { useEffect, useRef, useState } from "react";
import { TIER_LABEL } from "@/game/data";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { wheelAngle, wheelSliceTone, type WheelPrize } from "@/game/wheel";

const TURNS = 6;
const SPIN_MS = 4600;
const R = 100;
const RIM_LIGHTS = 18;

const FILL: Record<string, [string, string]> = {
  white: ["#f4f0e6", "#2a241c"],
  blue: ["#5f9ad0", "#0f1c2a"],
  green: ["#5fb36a", "#0f2412"],
  amber: ["#f0b445", "#2a1c06"],
  red: ["#e2604c", "#2a0c08"],
  violet: ["#9c84d8", "#160f2a"],
  brass: ["#7a5a2c", "#fbe7bf"],
  ink: ["#2f3a4a", "#e6eef8"],
};

function point(deg: number, r: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [R + r * Math.cos(a), R + r * Math.sin(a)] as const;
}

function slicePath(i: number, n: number) {
  const s = 360 / n;
  const [x1, y1] = point(i * s, R - 6);
  const [x2, y2] = point((i + 1) * s, R - 6);
  return `M${R},${R} L${x1.toFixed(2)},${y1.toFixed(2)} A${R - 6},${R - 6} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

function Icon({ prize, color }: { prize: WheelPrize; color: string }) {
  if (prize.kind === "key") {
    // A match: stick and flame.
    return (
      <g>
        <rect x={-1.6} y={-2} width={3.2} height={13} rx={1.2} fill={color} />
        <path d="M0,-11 C4,-7 3.5,-3 0,-2 C-3.5,-3 -4,-7 0,-11 Z" fill="#ffb347" stroke={color} strokeWidth={0.8} />
      </g>
    );
  }
  if (prize.kind === "coins") {
    return (
      <g>
        <circle r={7.5} fill="#f2c45a" stroke={color} strokeWidth={1.2} />
        <circle r={4.5} fill="none" stroke="#9a6f1f" strokeWidth={1} />
      </g>
    );
  }
  // An ingredient: a little jar.
  return (
    <g>
      <rect x={-5} y={-4} width={10} height={11} rx={2.5} fill="#cfe3d2" stroke={color} strokeWidth={1.1} />
      <rect x={-6} y={-7} width={12} height={3.5} rx={1} fill={color} />
    </g>
  );
}

export function MysteryWheel() {
  const wheel = useGame((s) => s.wheel);
  const loot = useGame((s) => s.loot);
  const miss = useGame((s) => s.miss);
  const openVault = useGame((s) => s.openVault);
  const claimWheel = useGame((s) => s.claimWheel);
  const dismissWheel = useGame((s) => s.dismissWheel);
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

  const n = wheel.slices.length;
  const slice = 360 / n;
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = TURNS * 360 + (360 - (wheel.win * slice + slice / 2));
  const prize = wheel.slices[wheel.win]!;

  function tickPointer() {
    sfx.tick();
    const el = pointerRef.current;
    if (!el) return;
    el.classList.remove("is-tick");
    void el.offsetWidth;
    el.classList.add("is-tick");
  }

  function land() {
    setAngle(target);
    setSpinning(false);
    setLanded(true);
    sfx.pickup();
  }

  function spin() {
    if (spinning || landed) return;
    sfx.open();
    if (reduce) {
      land();
      return;
    }
    setSpinning(true);
    const t0 = performance.now();
    let lastPeg = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / SPIN_MS);
      const a = wheelAngle(t, target);
      // The pointer sits on the slice edges' pegs: a click each time an edge passes under it.
      const peg = Math.floor((a + slice / 2) / slice);
      if (peg !== lastPeg) {
        lastPeg = peg;
        tickPointer();
      }
      setAngle(a);
      if (t < 1) raf.current = requestAnimationFrame(frame);
      else land();
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
          <div className="wheel-rim" aria-hidden>
            {Array.from({ length: RIM_LIGHTS }, (_, i) => (
              <span key={i} className={`wheel-bulb${i % 2 ? " is-odd" : ""}`} style={{ transform: `rotate(${(i * 360) / RIM_LIGHTS}deg) translateY(-112px)` }} />
            ))}
          </div>
          <svg className="wheel-disc" data-testid="wheel-disc" viewBox={`0 0 ${2 * R} ${2 * R}`} style={{ transform: `rotate(${angle}deg)` }} aria-hidden>
            <circle cx={R} cy={R} r={R - 1} fill="#1a140e" />
            {wheel.slices.map((s, i) => {
              const tone = wheelSliceTone(s);
              const [fill, ink] = FILL[tone]!;
              const mid = i * slice + slice / 2;
              const [ix, iy] = point(mid, R * 0.66);
              const [tx, ty] = point(mid, R * 0.4);
              const won = landed && i === wheel.win;
              return (
                <g key={i} data-testid={`wheel-slice-${i}`} data-tone={tone} className={won ? "wheel-won" : undefined}>
                  <path d={slicePath(i, n)} fill={fill} stroke="#fff8e8" strokeWidth={1.6} />
                  <g transform={`translate(${ix.toFixed(2)},${iy.toFixed(2)}) rotate(${mid})`}>
                    <Icon prize={s} color={ink} />
                  </g>
                  <text
                    x={tx}
                    y={ty}
                    fill={ink}
                    fontSize={8.5}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    letterSpacing="0.06em"
                    transform={`rotate(${mid} ${tx.toFixed(2)} ${ty.toFixed(2)})`}
                  >
                    {s.face.toUpperCase()}
                  </text>
                </g>
              );
            })}
            <circle cx={R} cy={R} r={13} fill="#2a1f14" stroke="#e9c27a" strokeWidth={2.5} />
            <circle cx={R} cy={R} r={4} fill="#e9c27a" />
          </svg>
          {landed && !reduce ? <div className="wheel-burst" data-testid="wheel-burst" aria-hidden /> : null}
        </div>
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
