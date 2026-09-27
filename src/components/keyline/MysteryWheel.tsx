import { useEffect, useState } from "react";
import { TIER_LABEL } from "@/game/data";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";

const TURNS = 6;

export function MysteryWheel() {
  const wheel = useGame((s) => s.wheel);
  const loot = useGame((s) => s.loot);
  const miss = useGame((s) => s.miss);
  const openVault = useGame((s) => s.openVault);
  const claimWheel = useGame((s) => s.claimWheel);
  const [spinning, setSpinning] = useState(false);
  const [armed, setArmed] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    setSpinning(false);
    setArmed(false);
    setLanded(false);
  }, [wheel?.tier, wheel?.win]);

  if (!wheel || loot || miss || openVault) return null;

  const n = wheel.slices.length;
  const slice = 360 / n;
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const turn = TURNS * 360 + (360 - (wheel.win * slice + slice / 2));
  const prize = wheel.slices[wheel.win]!;
  const stops = wheel.slices.map((s, i) => `${tone(i, n)} ${i * slice}deg ${(i + 1) * slice}deg`).join(", ");

  function spin() {
    if (spinning || landed) return;
    sfx.open();
    if (reduce) {
      setLanded(true);
      sfx.pickup();
      return;
    }
    setSpinning(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setArmed(true)));
  }

  return (
    <div className="wheel-night absolute inset-0 z-[860] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-labelledby="wheel-title">
      <div className="wheel-card w-full max-w-sm">
        <p className="kicker" id="wheel-title">
          {TIER_LABEL[wheel.tier]} wheel
        </p>
        <h2 className="font-display mt-1 text-2xl">Twenty-five {TIER_LABEL[wheel.tier].toLowerCase()}.</h2>
        <p className="mt-1 text-sm text-fg-muted">The wheel doesn't say what it will pay.</p>
        <div className="wheel-stage mt-4">
          <div className="wheel-pointer" aria-hidden />
          <div
            className="wheel-disc"
            style={{
              background: `conic-gradient(${stops})`,
              transform: armed || landed ? `rotate(${turn}deg)` : "rotate(0deg)",
              transition: armed && !landed ? "transform 4.2s cubic-bezier(0.12, 0.7, 0.08, 1)" : "none",
            }}
            onTransitionEnd={(e) => {
              if (e.propertyName !== "transform" || !armed) return;
              setLanded(true);
              sfx.pickup();
            }}
          >
            {wheel.slices.map((s, i) => (
              <span key={i} className="wheel-face" style={{ transform: `rotate(${i * slice + slice / 2}deg)` }}>
                {s.face}
              </span>
            ))}
          </div>
        </div>
        {landed ? (
          <div className="mt-4 text-center">
            <p className="kicker">It landed</p>
            <p className="font-display mt-1 text-3xl">{prize.label}</p>
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

function tone(i: number, n: number) {
  const ink = ["#2a241c", "#3a2e22", "#4a3424", "#5c4030", "#2e3338", "#3d3428", "#243028", "#3a2a24"];
  return ink[i % n] ?? ink[0];
}
