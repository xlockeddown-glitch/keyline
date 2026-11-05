import { QuestBoard } from "./QuestBoard";
import { DailyRunRow } from "./DailyRun";

/**
 * 0.1.22: today's quests, a per-player set of four from the daily bank, counted by the server
 * (Chicago midnight to midnight). Collect from the Journal or any notice board (0.1.127: the Quest Board is gone).
 */
export function DailyGoals({ act }: { act: boolean }) {
  return (
    <div className="goals-card" data-testid={act ? "goals-board" : "goals-journal"}>
      <DailyRunRow />
      <QuestBoard kinds={["day"]} heading={false} />
    </div>
  );
}
