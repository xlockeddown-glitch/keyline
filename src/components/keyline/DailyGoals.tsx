import { GOAL_COIN, dailyGoals, goalDone } from "@/game/goals";
import { useGame } from "@/game/store";

/**
 * 0.0.93: today's three goals. `act` at the Quest Board (collect buttons); in the journal it is the shortcut:
 * progress, and a button that walks you to the board.
 */
export function DailyGoals({ act }: { act: boolean }) {
  const raw = useGame((s) => s.goals);
  const claimGoal = useGame((s) => s.claimGoal);
  const walkToQuest = useGame((s) => s.walkToQuest);
  const day = new Date().toISOString().slice(0, 10);
  const g = raw.day === day ? raw : { day, n: [0, 0, 0] as const, paid: [false, false, false] as const, all: false, seen: false };
  const defs = dailyGoals(day);
  const done = defs.filter((_, i) => goalDone(g as typeof raw, i)).length;
  const allReady = g.paid.every(Boolean) && !g.all;
  return (
    <div className="goals-card" data-testid={act ? "goals-board" : "goals-journal"}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="kicker">Today's goals</p>
        <p className="text-xs text-fg-muted">
          {done}/3 · all three: a green match{g.all ? " (claimed)" : ""}
        </p>
      </div>
      <div className="mt-2 grid gap-2">
        {defs.map((d, i) => {
          const n = Math.min(d.need, g.n[i] ?? 0);
          const ready = goalDone(g as typeof raw, i);
          const paid = g.paid[i];
          const shown = d.kind === "walk" ? `${Math.round(n)}/${d.need} m` : `${n}/${d.need}`;
          return (
            <div key={d.kind} className={`goal-row${ready && !paid ? " is-ready" : ""}${paid ? " is-paid" : ""}`}>
              <div className="goal-bar" style={{ width: `${(100 * n) / d.need}%` }} aria-hidden />
              <div className="goal-copy">
                <p className="goal-title">{d.title}</p>
                <p className="goal-sub">
                  {shown} · {paid ? "collected" : `+${GOAL_COIN} coin`}
                </p>
              </div>
              {act && ready && !paid ? (
                <button type="button" className="btn btn-primary px-3 text-xs" onClick={() => claimGoal(i)}>
                  Collect
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {act && allReady ? (
        <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => claimGoal(3)}>
          All three done: take the green match
        </button>
      ) : null}
      {!act ? (
        <button type="button" className="btn btn-ghost mt-3 w-full" data-testid="goals-walk" onClick={() => walkToQuest()}>
          {done > 0 && !g.all ? "Collect at the Quest Board: walk there" : "Walk to the Quest Board"}
        </button>
      ) : null}
    </div>
  );
}
