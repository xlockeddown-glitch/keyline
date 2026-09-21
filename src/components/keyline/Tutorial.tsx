import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";

const STEPS = [
  {
    title: "Walk",
    lines: [
      "You're on a real map of a real city.",
      "Press W A S D to move. W is up the screen (north).",
      "You can also use the stick, or tap the map to walk there.",
    ],
  },
  {
    title: "Lamps",
    lines: [
      "The glowing lamps ask trivia.",
      "Walk up to one and press E, or tap it.",
      "You'll get a question. Pick A, B, C, or D.",
      "A right answer gives you coins. You still spend a match if you're wrong.",
      "Start with a white lamp. You already have those matches.",
    ],
  },
  {
    title: "More",
    lines: [
      "Matches on the ground: walk over them. The street stays thin — spend them or they stop appearing.",
      "F calls a cab. Park and get out before you light a lamp.",
      "Light 3 lamps and you get a ticket.",
      "Two green globes stacked: four questions. The bright amber ring: three.",
      "The station lamp has a small ticket on it. Walk there and press T to go to another city.",
      "The brass awning is a coat shop. Walk up and press E to hire a scout. Each coat has a small habit — a hair more time, a hair more pace. Nothing loud.",
    ],
  },
] as const;

export function Tutorial() {
  const step = useGame((s) => s.tutorial);
  const skip = useGame((s) => s.skipTutorial);
  const advance = useGame((s) => s.advanceTutorial);
  const busy = useGame((s) => Boolean(s.openVault || s.hqOpen || s.invOpen || s.shopOpen));
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
