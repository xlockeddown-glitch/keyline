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
    requestEnter(id);
  }

  const rideTo = journey ? CITIES[journey.to].name : null;

  return (
    <div className="title-night is-book">
      <div className="title-account">
        <AuthChip />
      </div>
      <div className="title-audio">
        <AudioDock />
      </div>

      <div className="book-stage">
        <button type="button" className="matchbook" onClick={() => enter(cityId)}>
          {["white", "blue", "green", "amber", "red", "violet"].map((tier) => (
            <span key={tier} className={`matchbook-stick tier-${tier}`} aria-hidden>
              <i />
            </span>
          ))}
          <span className="matchbook-cover">
            <strong>KEYLINE</strong>
            <span className="matchbook-strike">{rideTo ? `Train · ${rideTo}` : city.name}</span>
          </span>
        </button>
        <p className="book-lede">{rideTo ? `On the train to ${rideTo}.` : `Tap to walk ${city.name}.`}</p>
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
