import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { fetchMyRideRanks, fetchRideBoards } from "@/game/rolls";
import { EMPTY_RIDE_BOARDS, formatDistance, ownLine, type MyRideRanks, type RideBoardRow, type RideBoards } from "@/game/standings";
import { usePlayerId } from "./PlayerLink";

/** How often the side boards refresh while the ride runs. */
const REFRESH_MS = 30_000;

function Board(props: { title: string; testid: string; rows: RideBoardRow[]; me: string | null; mine?: { value: number; rank: number | null }; fmt: (n: number) => string }) {
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

/** 0.0.94: desktop ride side panel: whole-game top 5 by lanterns lit right and by distance walked, plus your own rank. */
export function RideBoardsPanel() {
  const user = useCurrentUser();
  const playerId = usePlayerId();
  const [boards, setBoards] = useState<RideBoards>(EMPTY_RIDE_BOARDS);
  const [mine, setMine] = useState<MyRideRanks | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => {
      void fetchRideBoards()
        .then((b) => live && setBoards(b))
        .catch(() => {});
      if (user)
        void fetchMyRideRanks()
          .then((m) => live && setMine(m))
          .catch(() => {});
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [user]);
  const me = playerId ?? user?.id ?? null;
  return (
    <aside className="ride-boards" aria-label="Leaderboards" data-testid="ride-boards">
      <Board title="Lanterns lit right" testid="ride-board-lanterns" rows={boards.lanterns} me={me} mine={mine?.lanterns} fmt={(n) => n.toLocaleString()} />
      <Board title="Distance walked" testid="ride-board-distance" rows={boards.distance} me={me} mine={mine?.distance} fmt={(n) => formatDistance(n)} />
    </aside>
  );
}
