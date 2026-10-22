import { QuestBoard } from "./QuestBoard";
import { useGame } from "@/game/store";

/**
 * 0.1.22: today's quests, a per-player set of four from the daily bank, counted by the server
 * (Chicago midnight to midnight). At the Quest Board you collect; in the journal you also get a walk button.
 */
export function DailyGoals({ act }: { act: boolean }) {
  const walkToQuest = useGame((s) => s.walkToQuest);
  return (
    <div className="goals-card" data-testid={act ? "goals-board" : "goals-journal"}>
      <QuestBoard kinds={["day"]} heading={false} />
      {!act ? (
        <button type="button" className="btn btn-ghost mt-3 w-full" data-testid="goals-walk" onClick={() => walkToQuest()}>
          Walk to the Quest Board
        </button>
      ) : null}
    </div>
  );
}
