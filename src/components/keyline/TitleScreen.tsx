import { useState } from "react";
import { CITIES } from "@/game/data";
import { unlockAudio, sfx, startBed } from "@/game/audio";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";
import { AudioDock } from "./AudioDock";
import { AuthChip } from "./AuthChip";
import { FirstLoginOverlay, useEnterGate } from "./FirstLogin";
import { RollsOverlay } from "./RollsBoard";
import { APP_VERSION } from "@/version";

export function TitleScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const points = useGame((s) => s.points);
  const cityId = useGame((s) => s.cityId);
  const journey = useGame((s) => s.journey);
  const tickJourney = useGame((s) => s.tickJourney);
  // 0.0.56: a brand-new player picks a starting city first.
  const needsStart = useGame((s) => !s.cities.start);
  const [rollsOpen, setRollsOpen] = useState(false);
  const { requestEnter, showPrompt, waiting, continueAsGuest } = useEnterGate();
  const city = CITIES[cityId];

  function enter(id: CityId) {
    unlockAudio();
    startBed(useGame.getState().scout);
    sfx.ui();
    const g = useGame.getState();
    if (g.journey) {
      tickJourney();
      if (useGame.getState().journey) return;
    }
    if (!g.cities.start) {
      setScreen("cities");
      return;
    }
    requestEnter(id);
  }

  const rideTo = journey ? CITIES[journey.to].name : null;
  const blade = rideTo ?? (needsStart ? "Pick a city" : city.name);

  return (
    <div className="title-night is-blade">
      <div className="title-account">
        <AuthChip />
      </div>
      <div className="title-audio">
        <AudioDock />
      </div>

      <div className="blade-stage">
        <div className="blade-mast">
          <i className="blade-pole" aria-hidden />
          <button type="button" className="city-blade" onClick={() => enter(cityId)} aria-label={rideTo ? `On the train to ${rideTo}` : needsStart ? "Pick a city" : `Walk ${city.name}`}>
            <i className="blade-hole" aria-hidden />
            <span className={blade.length >= 12 ? "blade-name is-long" : "blade-name"}>{blade}</span>
            <i className="blade-hole" aria-hidden />
          </button>
          <p className="blade-mark">KEYLINE</p>
        </div>
        {rideTo ? <p className="blade-note">On the train</p> : null}
        {points > 0 ? <p className="book-coin tabular-nums">{points.toLocaleString()}</p> : null}
        <div className="book-links">
          <button type="button" className="title-more" onClick={() => setScreen("cities")}>
            All cities
          </button>
          <button
            type="button"
            className="title-more"
            onClick={() => {
              sfx.ui();
              setRollsOpen(true);
            }}
          >
            Leaderboard
          </button>
        </div>
        <p className="book-ver">v{APP_VERSION}</p>
      </div>
      {rollsOpen ? (
        <RollsOverlay
          onClose={() => {
            sfx.ui();
            setRollsOpen(false);
          }}
        />
      ) : null}
      {showPrompt || waiting ? (
        <FirstLoginOverlay waiting={waiting} onGuest={continueAsGuest} />
      ) : null}
    </div>
  );
}
