import { useEffect, useState } from "react";
import { CITIES } from "@/game/data";
import { formatEta } from "@/game/ticket";
import { useGame } from "@/game/store";
import { Boxes, Check, Lamp, MapPin, Route, type LucideIcon } from "lucide-react";
import {
  RIDE_GAME_NAME,
  RIDE_GAME_PITCH,
  journeyOutcome,
  lampOutcome,
  lampVerdict,
  perfectLine,
  pickerDefault,
  rideGameFits,
  rideGameFor,
  rideGameLength,
  ridePickerGames,
  rideReward,
  suggestedRideGame,
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

/** Each game's icon. Shapes differ, so the picker never leans on colour alone. */
const GAME_ICON: Record<RideGameId, LucideIcon> = {
  lamplighter: Lamp,
  "where-am-i": MapPin,
  "match-sorter": Boxes,
  "route-puzzle": Route,
};

/**
 * Pick the ride's game (0.0.41). Native radios: tap a card, or Tab in and use the arrow keys;
 * Enter or the button plays. The suggestion starts selected, so one tap on Play still works.
 * Selection reads by a check mark, a heavier outline and the radio dot, never by colour alone.
 */
function GamePicker(props: {
  games: RideGameId[];
  selected: RideGameId;
  suggested: RideGameId;
  left: number;
  again?: boolean;
  onSelect: (g: RideGameId) => void;
  onPlay: (g: RideGameId) => void;
}) {
  const { games, selected, suggested, left, again, onSelect, onPlay } = props;
  return (
    <form
      className="ride-pick"
      data-testid="ride-picker"
      onSubmit={(e) => {
        e.preventDefault();
        onPlay(selected);
      }}
    >
      <fieldset>
        <legend className="kicker">{again ? "Another round? Pick a game" : "Pick a game for the ride"}</legend>
        <div className="ride-pick-list">
          {games.map((g) => {
            const Icon = GAME_ICON[g];
            const on = g === selected;
            return (
              <label key={g} className={`ride-pick-opt${on ? " is-on" : ""}`} data-game={g}>
                <input
                  type="radio"
                  name="ride-game"
                  value={g}
                  checked={on}
                  onChange={() => onSelect(g)}
                  className="ride-pick-radio"
                  aria-describedby={`ride-pick-desc-${g}`}
                />
                <span className="ride-pick-icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="ride-pick-text">
                  <span className="ride-pick-name">
                    {RIDE_GAME_NAME[g]}
                    {g === suggested ? <span className="ride-pick-tag">Suggested</span> : null}
                  </span>
                  <span className="ride-pick-desc" id={`ride-pick-desc-${g}`}>
                    {RIDE_GAME_PITCH[g]} <span className="ride-pick-len">· {rideGameLength(g, left)}</span>
                  </span>
                </span>
                <span className="ride-pick-mark" aria-hidden>
                  {on ? <Check size={18} strokeWidth={2.5} /> : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <button type="submit" className="btn btn-primary ride-play-btn">
        Play {RIDE_GAME_NAME[selected]}
      </button>
      <p className="ride-play-sub text-xs text-fg-subtle">
        Every game pays the same table. The ride pays its best round. Skip it and the seat still pays.
      </p>
    </form>
  );
}

export function RideScreen() {
  const journey = useGame((s) => s.journey);
  const tickJourney = useGame((s) => s.tickJourney);
  const startRideRound = useGame((s) => s.startRideRound);
  const chooseGame = useGame((s) => s.chooseRideGame);
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
  const suggested = suggestedRideGame(journey);
  const games = ridePickerGames(left);
  const selected = pickerDefault(journey, left);
  const canPlay = rideGameFits(game, left);
  const forRide = rideReward(total, journeyOutcome(journey));

  const play = (pick: RideGameId = game) => {
    const n = (journey.game?.rounds ?? 0) + (journey.forfeits ?? 0);
    // Deal the round's content before opening it, so a city with nothing to deal never strands an open round.
    const clues = pick === "where-am-i" ? whereRound(to.pois, journey.departAt, n) : undefined;
    const maps = pick === "route-puzzle" ? routeRound(to.pois, journey.departAt, n) : undefined;
    if ((clues && !clues.length) || (maps && !maps.length)) return;
    const ms = startRideRound(pick);
    if (ms == null) return;
    setResult(null);
    if (clues) setRound({ ms, seed: journey.departAt, clues, game: pick });
    else if (maps) setRound({ ms, seed: journey.departAt, maps, game: pick });
    else setRound({ ms, seed: journey.departAt + (journey.game?.rounds ?? 0) * 7919 + (journey.forfeits ?? 0), game: pick });
  };
  const settle = (outcome: RideOutcome, verdict: string, sub?: string) => {
    const add = finishRideRound(outcome);
    setRound(null);
    setResult({ verdict, sub, outcome, add });
  };
  const done = (tally: LampTally) => {
    const outcome = lampOutcome(tally);
    settle(outcome, lampVerdict(tally), perfectLine(outcome) ?? (tally.streak >= 5 ? `Best run: ${tally.streak} in a row.` : undefined));
  };
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
                <button type="button" className="btn btn-primary" onClick={() => play(game)}>
                  Another round of {RIDE_GAME_NAME[game]}
                </button>
              ) : null}
              {games.some((g) => g !== game) ? (
                <button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>
                  Pick a different game
                </button>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>
                  Back to the window
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="ride-play">
            {selected ? (
              <GamePicker
                games={games}
                selected={selected}
                suggested={suggested}
                left={left}
                again={Boolean(journey.game)}
                onSelect={chooseGame}
                onPlay={play}
              />
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
