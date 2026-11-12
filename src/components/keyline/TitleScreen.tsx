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
import { TRIVIA_COUNT, triviaCountLabel } from "@/game/triviaCount";
import { carSprite } from "@/game/carPaint";
import { SkyLayer, useSky } from "./Sky";

/** 0.1.10: cities with their own painted skyline on the title street; the rest get the generic one. */
const SKYLINES: Partial<Record<CityId, string>> = { chicago: "chicago", nyc: "nyc", sf: "sf" };

/** 0.1.148 title: a warm night avenue. Lit storefronts, a brass vault, the last city's skyline.
 * 0.1.163: lamp and vault glows are painted into the street webps, so nothing CSS or SVG is laid over the painting.
 * Passing headlights and clear-night fireflies stay as optional motion and stop under prefers-reduced-motion. The cast stands on the road. */
function TitleStreet({ cityId, known }: { cityId: CityId; known: boolean }) {
  const sky = useSky();
  const carOn = useGame((s) => s.carOn);
  const paint = useGame((s) => s.carPaint);
  const car = carOn ?? "civic";
  const skyline = (known && SKYLINES[cityId]) || "generic";
  const wet = sky.weather === "rain" || sky.weather === "storm";
  return (
    <div className={`ts-scene${wet ? " is-wet" : ""}`} data-testid="title-street" data-skyline={skyline} data-weather={sky.weather} aria-hidden>
      <div className="ts-frame">
        <img className="ts-back" src={`/title/street-${skyline}.webp`} alt="" decoding="async" fetchPriority="high" />
        <i className="ts-headlights" />
        {sky.weather === "clear" ? (
          <div className="ts-flies">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ left: `${8 + ((i * 37) % 84)}%`, top: `${48 + ((i * 23) % 40)}%`, animationDelay: `${-i * 1.7}s` }} />
            ))}
          </div>
        ) : null}
      </div>
      <SkyLayer />
      <div className="ts-cast">
        <img className="ts-car" src={carSprite(car, "side", carOn ? paint[car] : null)} alt="" width={640} height={240} />
        <img className="ts-scout" src="/title/scout-corgi.webp" alt="" width={86} height={146} />
        <img className="ts-scout is-penguin" src="/title/scout-lynx.webp" alt="" width={90} height={143} />
        <img className="ts-scout" src="/title/scout-fox.webp" alt="" width={87} height={151} />
      </div>
    </div>
  );
}

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
    <div className="title-night is-blade is-street">
      <TitleStreet cityId={cityId} known={!needsStart} />
      <div className="title-account">
        <AuthChip />
      </div>
      <div className="title-audio">
        <AudioDock />
      </div>

      <div className="blade-stage">
        <h1 className="ts-marquee" aria-label="Keyline">
          {"KEYLINE".split("").map((ch, i) => (
            <span key={i} aria-hidden>
              {ch}
            </span>
          ))}
        </h1>
        <div className="blade-mast">
          <i className="blade-pole" aria-hidden />
          <button type="button" className="city-blade" onClick={() => enter(cityId)} aria-label={rideTo ? `On the train to ${rideTo}` : needsStart ? "Pick a city" : `Walk ${city.name}`}>
            <i className="blade-hole" aria-hidden />
            <span className={blade.length >= 12 ? "blade-name is-long" : "blade-name"}>{blade}</span>
            <i className="blade-hole" aria-hidden />
          </button>
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
      {TRIVIA_COUNT > 0 ? <p className="title-trivia-count tabular-nums">{triviaCountLabel(TRIVIA_COUNT)}</p> : null}
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
