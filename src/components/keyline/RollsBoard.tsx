import { useEffect, useState } from "react";
import { LevelChip } from "./Levels";
import { nameColorHex } from "@/game/levels";
import { Trophy, X } from "lucide-react";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { usePlayerId } from "./PlayerLink";
import { CITIES, TIER_LABEL } from "@/game/data";
import { fetchMe, fetchStandings, ROLL_TIERS, type MyPlates } from "@/game/rolls";
import { fetchMyWalk, type MyWalk } from "@/game/walkApi";
import {
  ACCURACY_MIN,
  STANDING_KINDS,
  emptyStandingBoard,
  formatAvg,
  formatDistance,
  formatRate,
  mineFromBoard,
  standingValue,
  type StandingBoard,
  type StandingKind,
  type StandingRow,
  type StandingScope,
} from "@/game/standings";
import { standingName } from "@/game/standingName";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import type { Tier } from "@/game/types";
import { ItemIcon } from "./ItemIcon";
import { SignInActions } from "./AuthChip";

export function RollsOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[800] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Leaderboard</p>
            <h2 className="font-display text-2xl">The board</h2>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <RollsBoard />
        </div>
      </div>
    </div>
  );
}

export function RollsBoard() {
  const user = useCurrentUser();
  const playerId = usePlayerId();
  const { isPending } = useCurrentUserState();
  const local = useGame((s) => s.correctByTier);
  const distanceM = useGame((s) => s.distanceM);
  const cityId = useGame((s) => s.cityId);
  const [tier, setTier] = useState<Tier>("white");
  const [kind, setKind] = useState<StandingKind>("cards");
  const [scope, setScope] = useState<StandingScope>("all");
  const [board, setBoard] = useState<StandingBoard | null>(null);
  const [mineCards, setMineCards] = useState<MyPlates | null>(null);
  const [myWalk, setMyWalk] = useState<MyWalk | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener("keyline-rolls", bump);
    return () => window.removeEventListener("keyline-rolls", bump);
  }, []);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setBoard(null);
    const city = scope === "city" ? cityId : null;
    fetchStandings({ data: { kind, city } })
      .then((next) => {
        if (alive) setBoard(next);
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
          setBoard(emptyStandingBoard(kind, scope, city));
        }
      });
    return () => {
      alive = false;
    };
  }, [tick, kind, scope, cityId]);

  useEffect(() => {
    if (isPending || !user) {
      setMineCards(null);
      return;
    }
    let alive = true;
    fetchMe()
      .then((next) => {
        if (alive) setMineCards(next);
      })
      .catch(() => {
        if (alive) setMineCards(null);
      });
    return () => {
      alive = false;
    };
  }, [user, isPending, tick]);

  useEffect(() => {
    if (kind !== "distance" || isPending || !user) {
      setMyWalk(null);
      return;
    }
    let alive = true;
    const city = scope === "city" ? cityId : null;
    fetchMyWalk({ data: { city } })
      .then((next) => {
        if (alive) setMyWalk(next);
      })
      .catch(() => {
        if (alive) setMyWalk(null);
      });
    return () => {
      alive = false;
    };
  }, [user, isPending, tick, kind, scope, cityId]);

  const rows = kind === "distance" ? (board?.distance ?? []) : (board?.byTier[tier] ?? []);
  // 0.0.54b: linked sign-ins share the primary's row, so "you" is the player id, not this sign-in's id.
  const meId = playerId ?? user?.id;
  const mine = mineFromBoard(board ?? emptyStandingBoard(), meId, tier);
  const myCards = mineCards?.byTier[tier];
  const onBoard = Boolean(user && rows.some((r) => r.userId === meId));
  const kindMeta = STANDING_KINDS.find((k) => k.id === kind)!;
  const cityName = CITIES[cityId]?.name ?? "this city";

  return (
    <div className="rolls-board">
      <div className="rolls-tiers" role="tablist" aria-label="Standing">
        {STANDING_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={kind === k.id}
            className={`rolls-tier ${kind === k.id ? "is-on" : ""}`}
            onClick={() => {
              sfx.ui();
              setKind(k.id);
            }}
          >
            <span>{k.label}</span>
          </button>
        ))}
      </div>

      <div className="rolls-tiers mt-2" role="tablist" aria-label="Cities">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "all"}
          className={`rolls-tier ${scope === "all" ? "is-on" : ""}`}
          onClick={() => {
            sfx.ui();
            setScope("all");
          }}
        >
          All cities
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "city"}
          className={`rolls-tier ${scope === "city" ? "is-on" : ""}`}
          onClick={() => {
            sfx.ui();
            setScope("city");
          }}
        >
          {cityName}
        </button>
      </div>

      <p className="mt-3 text-sm text-pretty text-fg-muted">{kindMeta.blurb}</p>

      {kind === "distance" ? null : (
      <div className="rolls-tiers mt-3" role="tablist" aria-label="Match color">
        {ROLL_TIERS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tier === t}
            className={`rolls-tier ${tier === t ? "is-on" : ""}`}
            onClick={() => {
              sfx.ui();
              setTier(t);
            }}
          >
            <ItemIcon item={t} size={22} />
            <span>{TIER_LABEL[t]}</span>
          </button>
        ))}
      </div>
      )}

      {failed ? (
        <p className="mt-4 text-sm text-fg-muted">The board did not come back. Try again in a moment.</p>
      ) : board === null ? (
        <ul className="mt-4 grid gap-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-md bg-bg-subtle/50" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-pretty text-fg-muted">{emptyCopy(kind, TIER_LABEL[tier])}</p>
      ) : (
        <ol className="mt-4 grid gap-2">
          {rows.map((row) => (
            <RollRow key={row.userId} kind={kind} row={row} mine={meId === row.userId} />
          ))}
        </ol>
      )}

      {user && kind === "cards" && myCards && myCards.correct > 0 && !onBoard ? (
        <p className="mt-4 text-sm text-fg-muted">
          Your {TIER_LABEL[tier].toLowerCase()} trivia cards{" "}
          <span className="tabular-nums text-fg">{myCards.correct.toLocaleString()}</span>
          {myCards.rank ? (
            <>
              {" "}
              · <span className="tabular-nums">#{myCards.rank}</span>
            </>
          ) : null}
        </p>
      ) : null}

      {user && kind === "distance" && myWalk && myWalk.meters > 0 && !onBoard ? (
        <p className="mt-4 text-sm text-fg-muted">
          You · {formatDistance(myWalk.meters)}
          {myWalk.rank ? (
            <>
              {" "}
              · <span className="tabular-nums">#{myWalk.rank}</span>
            </>
          ) : null}
        </p>
      ) : null}

      {user && kind !== "cards" && kind !== "distance" && mine && !onBoard ? (
        <p className="mt-4 text-sm text-fg-muted">
          You · {standingValue(kind, mine)}
          {mine.rank ? (
            <>
              {" "}
              · <span className="tabular-nums">#{mine.rank}</span>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <SignInGate
          fallback={
            <div className="grid gap-3">
              <p className="text-sm text-pretty text-fg-muted">
                {kind === "distance" ? (
                  <>
                    Sign in to post the walk. Guests can still read the board.
                    {distanceM > 0 ? (
                      <>
                        {" "}
                        This lantern has walked{" "}
                        <span className="tabular-nums text-fg">{(distanceM / 1000).toFixed(1)} km</span>.
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    Sign in to post trivia cards. Guests can still read the board.
                    {local[tier] > 0 ? (
                      <>
                        {" "}
                        This lantern holds{" "}
                        <span className="tabular-nums text-fg">{local[tier].toLocaleString()}</span>{" "}
                        {TIER_LABEL[tier].toLowerCase()} so far.
                      </>
                    ) : null}
                  </>
                )}
              </p>
              <SignInActions />
            </div>
          }
        >
          <p className="text-sm text-fg-muted">
            {kind === "distance" ? (
              <>
                The walk posts under <span className="text-fg">{standingName(user?.displayName)}</span>
                {myWalk && myWalk.meters > 0 ? (
                  <>
                    {" "}
                    · <span className="tabular-nums text-fg">{formatDistance(myWalk.meters)}</span>
                    {myWalk.rank ? <span className="tabular-nums"> · #{myWalk.rank}</span> : null}
                  </>
                ) : (
                  <> · nothing posted yet</>
                )}
                {distanceM > (myWalk?.meters ?? 0) + 50 ? (
                  <>
                    . This lantern has{" "}
                    <span className="tabular-nums text-fg">{(distanceM / 1000).toFixed(1)} km</span>, including the
                    walk from before the board watched.
                  </>
                ) : (
                  "."
                )}
              </>
            ) : (
              <>
            Trivia cards post under{" "}
            <span className="text-fg">{standingName(user?.displayName)}</span>
            {kind === "cards" && myCards && myCards.correct > 0 ? (
              <>
                {" "}
                · {TIER_LABEL[tier]}{" "}
                <span className="tabular-nums text-fg">{myCards.correct.toLocaleString()}</span>
              </>
            ) : null}
            {kind === "speed" && mine?.avgMs != null ? (
              <>
                {" "}
                · {formatAvg(mine.avgMs)}
              </>
            ) : null}
            {kind === "accuracy" && mine?.rate != null ? (
              <>
                {" "}
                · {formatRate(mine.rate)}
              </>
            ) : null}
              </>
            )}
          </p>
        </SignInGate>
      </div>
    </div>
  );
}

function emptyCopy(kind: StandingKind, color: string) {
  if (kind === "distance") return "No walks posted yet. Sign in, walk the street, and the kilometers fill in.";
  if (kind === "speed") return `No ${color.toLowerCase()} times yet. Answer ten trivia cards to rank.`;
  if (kind === "accuracy") {
    return `Need ${ACCURACY_MIN} ${color.toLowerCase()} trivia cards answered. Nobody's there yet.`;
  }
  return `The street is dark. Light ${color.toLowerCase()} lamps and the names will fill in.`;
}

function RollRow({ kind, row, mine }: { kind: StandingKind; row: StandingRow; mine: boolean }) {
  return (
    <li className={`rolls-row ${mine ? "is-me" : ""}`}>
      <span className="rolls-rank tabular-nums">{row.rank}</span>
      <span className="min-w-0 truncate font-medium">
        <LevelChip level={row.level} color={row.color} />
        <span style={row.color ? { color: nameColorHex(row.color) ?? undefined } : undefined}>{standingName(row.name)}</span>
        {row.title ? <span className="lvl-title ml-1.5">{row.title}</span> : null}
        {mine ? <span className="kicker ml-2">You</span> : null}
      </span>
      <span className="ml-auto flex items-center gap-1.5 tabular-nums text-fg">
        {mine ? <Trophy className="size-3.5 text-accent" strokeWidth={1.75} /> : null}
        {standingValue(kind, row)}
      </span>
    </li>
  );
}
