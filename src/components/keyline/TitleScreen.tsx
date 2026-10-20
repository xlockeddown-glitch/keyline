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
import { carSprite } from "@/game/carPaint";
import { SkyLayer, useSky } from "./Sky";

/** 0.1.10: cities with their own painted skyline on the title street; the rest get the generic one. */
const SKYLINES: Partial<Record<CityId, string>> = { chicago: "chicago", nyc: "nyc", sf: "sf" };

/** 0.1.10 title: a painted night street (skyline of the last-played city), a glowing vault down the road, lit lanterns,
 * the cast by the signpost and your car at the curb. Motion is CSS only and stops under prefers-reduced-motion. */
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
        <i className="ts-vault" />
        <i className="ts-lamp" style={{ left: "20%", top: "23%" }} />
        <i className="ts-lamp" style={{ left: "90.6%", top: "19.5%", animationDelay: "-1.3s" }} />
        <i className="ts-lamp is-far" style={{ left: "35.2%", top: "42.5%", animationDelay: "-0.6s" }} />
        <i className="ts-lamp is-far" style={{ left: "66.2%", top: "42%", animationDelay: "-2.1s" }} />
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
        <img className="ts-car" src={carSprite(car, "side", carOn ? paint[car] : null)} alt="" width={192} height={64} />
        <img className="ts-scout" src="/title/scout-corgi.png" alt="" width={86} height={146} />
        <img className="ts-scout is-penguin" src="/title/scout-lynx.png" alt="" width={90} height={143} />
        <img className="ts-scout" src="/title/scout-fox.png" alt="" width={87} height={151} />
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
