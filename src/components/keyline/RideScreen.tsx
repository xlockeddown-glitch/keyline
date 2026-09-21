import { useEffect, useState } from "react";
import { CITIES } from "@/game/data";
import { formatEta } from "@/game/ticket";
import { useGame } from "@/game/store";
import { AudioDock } from "./AudioDock";

function lootLine(j: { grantedWhite?: number; grantedBlue?: number; grantedGreen?: number }) {
  const bits: string[] = [];
  if (j.grantedWhite) bits.push(`${j.grantedWhite} white`);
  if (j.grantedBlue) bits.push("blue");
  if (j.grantedGreen) bits.push("green");
  if (!bits.length) return "";
  return `${bits.join(" · ")} so far`;
}

export function RideScreen() {
  const journey = useGame((s) => s.journey);
  const tickJourney = useGame((s) => s.tickJourney);
  const [, beat] = useState(0);

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

  return (
    <div className="ride-night">
      <div className="title-audio">
        <AudioDock />
      </div>
      <div className="ride-folio">
        <p className="kicker">En route · {from.name}</p>
        <h1 className="title-word">{to.name}</h1>
        <p className="lede">The clock runs while you’re away. Longer waits find more matches.</p>
        <p className="ride-clock font-display tabular-nums">{formatEta(left)}</p>
        <div className="ride-rail" aria-hidden>
          <i style={{ width: `${Math.min(100, gone * 100)}%` }} />
        </div>
        {lootLine(journey) ? <p className="ride-loot">{lootLine(journey)}</p> : null}
        <p className="ride-hint text-xs text-fg-subtle">
          Ten minutes: a blue. Sit with the tab open the whole haul: a green. Close it and the train still keeps time.
        </p>
      </div>
    </div>
  );
}
