import { useState } from "react";
import { CITY_LIST, CITIES } from "@/game/data";
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
  const scout = useGame((s) => s.scout);
  const journey = useGame((s) => s.journey);
  const tickJourney = useGame((s) => s.tickJourney);
  const [rollsOpen, setRollsOpen] = useState(false);
  const { requestEnter, showPrompt, waiting, continueAsGuest } = useEnterGate();
  const city = CITIES[cityId];
  const stubs = [city, ...CITY_LIST.filter((c) => c.id !== cityId).slice(0, 4)];

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
    <div className="title-night">
      <div className="title-pave" aria-hidden />
      <div className="title-account">
        <AuthChip />
      </div>
      <div className="title-audio">
        <AudioDock />
      </div>

      <div className="title-folio">
        <div className="street-blade" aria-label="Keyline">
          <span>{city.name} St</span>
          <strong>KEYLINE</strong>
        </div>

        <div className="block-map" aria-hidden>
          <i className="block-road is-ns" />
          <i className="block-road is-ew" />
          <i className="block-road is-ew-2" />
          <i className="block-glow" />
          <span className="lantern title-lamp">
            <i className="lantern-cap" />
            <i className="lantern-frame">
              <i className="lantern-glass" />
            </i>
            <i className="lantern-post" />
          </span>
          <span className="match-pin tier-white title-key">
            <i className="match-head" />
            <i className="match-stick" />
          </span>
          <span className="scout-marker is-idle title-scout" data-scout={scout} data-row="0" data-col="0" />
        </div>

        <p className="lede">Walk a real city. Light lamps. Answer trivia.</p>
        <p className="mt-1 text-xs text-fg-subtle tabular-nums tracking-wide">v{APP_VERSION}</p>

        {rideTo ? (
          <button type="button" className="btn btn-primary title-go" onClick={() => enter(cityId)}>
            On the train to {rideTo}
          </button>
        ) : (
          <button type="button" className="btn btn-primary title-go" onClick={() => enter(cityId)}>
            Walk {city.name}
            {points > 0 ? <span className="tabular-nums">{points.toLocaleString()}</span> : null}
          </button>
        )}

        <nav className="city-stubs" aria-label="Cities">
          {stubs.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === cityId ? "is-here" : ""}
              onClick={() => enter(c.id)}
            >
              {c.name}
            </button>
          ))}
        </nav>

        <div className="flex justify-center gap-2">
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
            Standings
          </button>
        </div>
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
