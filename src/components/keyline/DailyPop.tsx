import { sfx } from "@/game/audio";
import { playerFree } from "@/game/dailyPop";
import { useGame } from "@/game/store";

/**
 * 0.0.90: the morning crate's pop-up (it claimed itself on the day's first answer), then the once-a-day
 * Daily Blitz offer. Both wait until the player is free: no open lamp, loot, panel, sheet or train ride.
 */
export function DailyPop() {
  const pop = useGame((s) => s.cratePop);
  const offer = useGame((s) => s.blitzOffer);
  const free = useGame((s) => playerFree(s));
  const tutorial = useGame((s) => s.tutorial);
  if (!free || tutorial < 3 || (!pop && !offer)) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-[640] flex justify-center px-4">
      <div className="howto pointer-events-auto" role="dialog" aria-live="polite" data-testid={pop ? "crate-pop" : "blitz-offer"}>
        {pop ? (
          <>
            <p className="kicker">Morning crate · day {pop.day}</p>
            <h2 className="font-display mt-1 text-2xl leading-tight">Your crate opened</h2>
            <p className="mt-2 text-sm text-pretty text-fg-muted">{pop.line}.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => {
                  sfx.ui();
                  useGame.getState().dismissCratePop();
                }}
              >
                Nice
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="kicker">Notice board</p>
            <h2 className="font-display mt-1 text-2xl leading-tight">Daily Blitz is ready</h2>
            <p className="mt-2 text-sm text-pretty text-fg-muted">Six quick lamps for today's pay.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => {
                  sfx.ui();
                  useGame.getState().answerBlitzOffer(true);
                }}
              >
                Play now
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  sfx.ui();
                  useGame.getState().answerBlitzOffer(false);
                }}
              >
                Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
