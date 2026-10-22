import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";

// 0.0.90: kept as short as possible. Everything else is found by playing, or in Help.
const STEPS = [
  {
    title: "Move",
    lines: ["Tap the map to walk there.", "Or drag the on-screen stick, or press W A S D."],
  },
  {
    title: "Lamps",
    lines: ["Tap a glowing lamp.", "Answer its question to earn coins. Each lamp uses one match of its color."],
  },
  {
    title: "That's it",
    lines: ["Follow the arrow to the Quest Board to see today's goals.", "Tap Help any time."],
  },
] as const;

export function Tutorial() {
  const step = useGame((s) => s.tutorial);
  const skip = useGame((s) => s.skipTutorial);
  const advance = useGame((s) => s.advanceTutorial);
  const busy = useGame((s) => Boolean(s.openVault || s.hqOpen || s.invOpen || s.shopOpen || s.guideOpen || s.errandOpen));
  if (step >= STEPS.length || busy) return null;
  const card = STEPS[step]!;
  const last = step >= STEPS.length - 1;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-[640] flex justify-center px-4">
      <div className="howto pointer-events-auto">
        <p className="kicker">
          How to play · {step + 1} of {STEPS.length}
        </p>
        <h2 className="font-display mt-1 text-2xl leading-tight">{card.title}</h2>
        <div className="mt-2 grid gap-1.5">
          {card.lines.map((line) => (
            <p key={line} className="text-sm text-pretty text-fg-muted">
              {line}
            </p>
          ))}
        </div>
        <div className="howto-dots" aria-hidden>
          {STEPS.map((_, i) => (
            <i key={i} className={i === step ? "is-on" : ""} />
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => {
              sfx.ui();
              if (last) skip();
              else advance();
            }}
          >
            {last ? "Got it" : "Next"}
          </button>
          {last ? null : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                sfx.ui();
                skip();
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
