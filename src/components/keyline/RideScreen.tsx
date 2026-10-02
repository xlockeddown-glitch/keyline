import { useEffect, useState } from "react";
import { CITIES } from "@/game/data";
import { formatEta } from "@/game/ticket";
import { useGame } from "@/game/store";
import {
  RIDE_GAME_NAME,
  journeyOutcome,
  lampOutcome,
  lampVerdict,
  perfectLine,
  rideGameFor,
  rideReward,
  rideRoundMs,
  type LampTally,
  type RideGameId,
  type RideOutcome,
} from "@/game/rideGames";
import { AudioDock } from "./AudioDock";
import { Lamplighter } from "./Lamplighter";
import { WhereAmI } from "./WhereAmI";
import { MatchSorter } from "./MatchSorter";
import { RoutePuzzle } from "./RoutePuzzle";
import { routeOutcome, routeRound, routeVerdict, type RoutePuzzleMap, type RouteTally } from "@/game/routePuzzle";
import { sortOutcome, sortVerdict, type SortTally } from "@/game/matchSorter";
import { whereOutcome, whereRound, whereVerdict, type WhereClue, type WhereTally } from "@/game/whereAmI";

function lootLine(j: { grantedWhite?: number; grantedBlue?: number; grantedGreen?: number }) {
  const bits: string[] = [];
  if (j.grantedWhite) bits.push(`${j.grantedWhite} white`);
  if (j.grantedBlue) bits.push(j.grantedBlue === 1 ? "blue" : `${j.grantedBlue} blue`);
  if (j.grantedGreen) bits.push("green");
  if (!bits.length) return "";
  return `${bits.join(" · ")} so far`;
}

function matchList(r: { white: number; blue: number; green?: number }) {
  const bits: string[] = [];
  if (r.white) bits.push(`${r.white} white`);
  if (r.blue) bits.push(`${r.blue} blue`);
  if (r.green) bits.push(`${r.green} green`);
  return bits.join(" · ");
}

type Result = { verdict: string; sub?: string; outcome: RideOutcome; add: { white: number; blue: number; green: number } };

/** What the play button promises, per game. */
const GAME_PITCH: Partial<Record<RideGameId, string>> = {
  lamplighter: "light the street lamps as they pass",
  "where-am-i": "name the place from a clue about the city ahead",
  "match-sorter": "sort tumbling matches into their tier boxes",
  "route-puzzle": "plot the shortest trip between real places in the city ahead",
};

export function RideScreen() {
  const journey = useGame((s) => s.journey);
  const tickJourney = useGame((s) => s.tickJourney);
  const startRideRound = useGame((s) => s.startRideRound);
  const finishRideRound = useGame((s) => s.finishRideRound);
  const dropRideRound = useGame((s) => s.dropRideRound);
  const [, beat] = useState(0);
  const [round, setRound] = useState<{ ms: number; seed: number; clues?: WhereClue[]; maps?: RoutePuzzleMap[]; game?: RideGameId } | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    tickJourney();
    const id = window.setInterval(() => {
      tickJourney();
      beat((n) => n + 1);
    }, 250);
    const vis = () => {
      if (!document.hidden) tickJourney();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [tickJourney]);

  if (!journey) return null;
  const to = CITIES[journey.to];
  const from = CITIES[journey.from];
  const left = Math.max(0, journey.arriveAt - Date.now());
  const total = Math.max(1, journey.arriveAt - journey.departAt);
  const gone = 1 - left / total;
  const game = rideGameFor(journey);
  const canPlay = rideRoundMs(game, left) != null;
  const forRide = rideReward(total, journeyOutcome(journey));

  const play = () => {
    const ms = startRideRound();
    if (ms == null) return;
    setResult(null);
    const n = (journey.game?.rounds ?? 0) + (journey.forfeits ?? 0);
    if (game === "where-am-i") {
      const clues = whereRound(to.pois, journey.departAt, n);
      if (!clues.length) return;
      setRound({ ms, seed: journey.departAt, clues });
      return;
    }
    if (game === "route-puzzle") {
      const maps = routeRound(to.pois, journey.departAt, n);
      if (!maps.length) return;
      setRound({ ms, seed: journey.departAt, maps, game });
      return;
    }
    setRound({ ms, seed: journey.departAt + (journey.game?.rounds ?? 0) * 7919 + (journey.forfeits ?? 0), game });
  };
  const settle = (outcome: RideOutcome, verdict: string, sub?: string) => {
    const add = finishRideRound(outcome);
    setRound(null);
    setResult({ verdict, sub, outcome, add });
  };
  const done = (tally: LampTally) =>
    settle(lampOutcome(tally), lampVerdict(tally), tally.streak >= 5 ? `Best run: ${tally.streak} in a row.` : undefined);
  const doneWhere = (tally: WhereTally) => {
    const outcome = whereOutcome(tally);
    settle(outcome, whereVerdict(tally, to.name), perfectLine(outcome));
  };
  const doneSort = (tally: SortTally) => {
    const outcome = sortOutcome(tally);
    const sub = perfectLine(outcome) ?? (tally.streak >= 6 ? `Best run: ${tally.streak} in a row.` : undefined);
    settle(outcome, sortVerdict(tally), sub);
  };
  const doneRoute = (tally: RouteTally) => {
    const outcome = routeOutcome(tally);
    settle(outcome, routeVerdict(tally, to.name), perfectLine(outcome));
  };
  const quit = () => {
    dropRideRound();
    setRound(null);
  };

  return (
    <div className={`ride-night${round ? " is-playing" : ""}`}>
      <div className="title-audio">
        <AudioDock />
      </div>
      <div className="ride-folio">
        <p className="kicker">En route · {from.name}</p>
        <h1 className="title-word">{to.name}</h1>
        {round ? null : (
          <p className="lede">The clock runs while you’re away. Play a round on the way and the car pays better.</p>
        )}
        <p className="ride-clock font-display tabular-nums">{formatEta(left)}</p>
        <div className="ride-rail" aria-hidden>
          <i style={{ width: `${Math.min(100, gone * 100)}%` }} />
        </div>
        {lootLine(journey) ? <p className="ride-loot">{lootLine(journey)}</p> : null}

        {round?.clues ? (
          <WhereAmI city={to.name} clues={round.clues} roundMs={round.ms} onDone={doneWhere} onQuit={quit} />
        ) : round?.maps ? (
          <RoutePuzzle city={to.name} maps={round.maps} roundMs={round.ms} onDone={doneRoute} onQuit={quit} />
        ) : round?.game === "match-sorter" ? (
          <MatchSorter roundMs={round.ms} seed={round.seed} onDone={doneSort} onQuit={quit} />
        ) : round ? (
          <Lamplighter roundMs={round.ms} seed={round.seed} onDone={done} onQuit={quit} />
        ) : result ? (
          <div className="ride-result">
            <p className="kicker">{RIDE_GAME_NAME[game]}</p>
            <p className="ride-result-line">{result.verdict}</p>
            {result.sub ? <p className="ride-result-sub">{result.sub}</p> : null}
            <p className="ride-result-pay">
              This ride pays <strong>{matchList(forRide)}</strong>.
            </p>
            <p className="ride-result-sub">
              {result.add.white || result.add.blue || result.add.green
                ? `${matchList(result.add)} into your pocket now.`
                : (journey.game?.rounds ?? 0) > 1
                  ? "Your best round already counted. Only the best pays."
                  : "Pocket’s full. Spend some at a lamp."}
            </p>
            <div className="ride-result-actions">
              {canPlay ? (
                <button type="button" className="btn btn-primary" onClick={play}>
                  Another round
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>
                Back to the window
              </button>
            </div>
          </div>
        ) : (
          <div className="ride-play">
            {canPlay ? (
              <>
                <button type="button" className="btn btn-primary ride-play-btn" onClick={play}>
                  Play while you ride
                </button>
                <p className="ride-play-sub text-xs text-fg-subtle">
                  {RIDE_GAME_NAME[game]} · {GAME_PITCH[game] ?? "a round on the way"}. Skip it and the seat still pays.
                </p>
              </>
            ) : journey.game ? null : (
              <p className="ride-play-sub text-xs text-fg-subtle">Too close to the platform for a round.</p>
            )}
            {journey.forfeits && !journey.game ? (
              <p className="ride-play-sub text-xs text-fg-subtle">Lost that round when the tab closed. The seat still pays.</p>
            ) : null}
          </div>
        )}

        {round ? null : (
          <p className="ride-hint text-xs text-fg-subtle">
            Ten minutes: a blue. Sit with the tab open the whole haul: a green. Close it and the train still keeps time.
          </p>
        )}
      </div>
    </div>
  );
}
