/** 0.1.69: Journal · Leaderboard · Ladders: one category at a time, single-line rows in the Progress style. */
import { useEffect, useState } from "react";
import { CAT_LABEL } from "@/game/carPerks";
import { fetchLadder, fetchMyLadder } from "@/game/ladderApi";
import type { LadderBoard } from "@/game/ladderBoard";
import { CAT_LADDERS } from "@/game/levels";
import type { TriviaCat } from "@/game/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { usePlayerId } from "./PlayerLink";

const CATS = Object.keys(CAT_LADDERS) as TriviaCat[];

export function LadderBoardSection() {
  const user = useCurrentUser();
  const playerId = usePlayerId();
  const [cat, setCat] = useState<TriviaCat>("sports");
  const [board, setBoard] = useState<LadderBoard | null>(null);
  const [failed, setFailed] = useState(false);
  const uid = user?.id ?? null;
  useEffect(() => {
    let live = true;
    setBoard(null);
    setFailed(false);
    const get = uid ? fetchMyLadder({ data: { cat } }) : fetchLadder({ data: { cat } });
    void get
      .then((b) => live && setBoard(b))
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [cat, uid]);
  const me = playerId ?? user?.id ?? null;
  const mine = board?.mine;
  const inTop = Boolean(me && board?.top.some((r) => r.userId === me));
  return (
    <section className="mt-5 border-t border-border pt-4" data-testid="journal-board-ladders">
      <div className="flex items-center justify-between gap-3">
        <p className="kicker">Ladders</p>
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          <span className="sr-only">Category</span>
          <select className="ladder-pick min-h-11 rounded border border-border px-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value as TriviaCat)} data-testid="ladder-cat">
            {CATS.map((c) => (
              <option key={c} value={c}>
                {CAT_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-1 text-xs text-fg-muted">Right answers in {CAT_LABEL[cat]}. Titles at 250, 1,000 and 2,000.</p>
      {failed ? (
        <p className="mt-2 text-xs text-fg-subtle">Couldn't load the board. Try again in a minute.</p>
      ) : !board ? (
        <p className="mt-2 text-xs text-fg-subtle">Loading…</p>
      ) : board.top.length === 0 ? (
        <p className="mt-2 text-xs text-fg-subtle">No one on the board yet.</p>
      ) : (
        <ol className="jr-list mt-1">
          {board.top.map((r) => (
            <li key={r.userId} className={`jr-row${r.userId === me ? " is-me" : ""}`}>
              <span className="jr-val tabular-nums w-5">{r.rank}</span>
              <span className="jr-main">
                <span className="jr-title">{r.name}</span>
                {r.rung ? <span className="jr-sub">{r.rung}</span> : null}
              </span>
              <span className="jr-val tabular-nums">{r.value.toLocaleString("en-US")}</span>
            </li>
          ))}
          {mine?.rank && !inTop ? (
            <li className="jr-row is-me" data-testid="ladder-own">
              <span className="jr-val tabular-nums w-5">{mine.rank}</span>
              <span className="jr-main">
                <span className="jr-title">You</span>
                {mine.rung ? <span className="jr-sub">{mine.rung}</span> : null}
              </span>
              <span className="jr-val tabular-nums">{mine.value.toLocaleString("en-US")}</span>
            </li>
          ) : null}
        </ol>
      )}
      {mine?.rival ? (
        <p className="mt-2 text-xs text-fg-muted" data-testid="ladder-rival">
          {mine.rival.gap === 0 ? `Tied with ${mine.rival.name}` : `${mine.rival.gap.toLocaleString("en-US")} behind ${mine.rival.name}`}
        </p>
      ) : null}
    </section>
  );
}
