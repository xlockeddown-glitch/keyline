import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { fetchMyRideRanks, fetchRideBoards } from "@/game/rolls";
import { ownLine, type RideBoardRow } from "@/game/standings";
import { usePlayerId } from "./PlayerLink";

export function Board(props: { title: string; testid: string; rows: RideBoardRow[]; me: string | null; mine?: { value: number; rank: number | null }; fmt: (n: number) => string }) {
  const own = ownLine(props.rows, props.me, props.mine);
  return (
    <section className="ride-board" data-testid={props.testid}>
      <p className="kicker">{props.title}</p>
      {props.rows.length ? (
        <ol>
          {props.rows.map((r) => (
            <li key={r.userId} className={r.userId === props.me ? "is-me" : ""}>
              <span className="ride-board-rank tabular-nums">{r.rank}</span>
              <span className="ride-board-name">{r.name}</span>
              <span className="ride-board-val tabular-nums">{props.fmt(r.value)}</span>
            </li>
          ))}
          {own ? (
            <li className="is-me is-own" data-testid={`${props.testid}-own`}>
              <span className="ride-board-rank tabular-nums">{own.rank}</span>
              <span className="ride-board-name">You</span>
              <span className="ride-board-val tabular-nums">{props.fmt(own.value)}</span>
            </li>
          ) : null}
        </ol>
      ) : (
        <p className="text-xs text-fg-subtle">No one on the board yet.</p>
      )}
    </section>
  );
}

/** 0.0.99: Journal · Leaderboard: the Longest streak top 5 (server-computed from answer records). */
export function StreakBoardSection() {
  const user = useCurrentUser();
  const playerId = usePlayerId();
  const [rows, setRows] = useState<RideBoardRow[]>([]);
  const [mine, setMine] = useState<{ value: number; rank: number | null } | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void fetchRideBoards()
      .then((b) => live && setRows(b.streak ?? []))
      .catch(() => {});
    if (user)
      void fetchMyRideRanks()
        .then((m) => live && setMine(m.streak))
        .catch(() => {});
    return () => {
      live = false;
    };
  }, [user]);
  return (
    <div className="mt-5 border-t border-border pt-4 journal-streak">
      <Board title="Longest streak" testid="journal-board-streak" rows={rows} me={playerId ?? user?.id ?? null} mine={mine} fmt={(n) => `${n} in a row`} />
    </div>
  );
}
