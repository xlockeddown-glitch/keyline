import { CITIES } from "@/game/data";
import { posterHue, posterRoute } from "@/game/loop";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";

/** 0.1.58: tunnel posters, one per Loop route ridden. */
export function LoopPosters() {
  const posters = useGame((s) => s.posters);
  return (
    <div data-testid="loop-posters">
      <p className="kicker">Loop posters · {posters.length}</p>
      {posters.length ? (
        <ul className="poster-grid mt-2">
          {posters.map((k) => {
            const r = posterRoute(k);
            if (!r) return null;
            return (
              <li key={k} className="loop-poster" style={{ ["--h" as string]: posterHue(k) }}>
                <span className="kicker">The Loop</span>
                <span>
                  {CITIES[r.from as CityId]?.name ?? r.from}
                  <br />→ <b>{CITIES[r.to as CityId]?.name ?? r.to}</b>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-fg-muted">Ride the Loop between cities to collect a poster for each route.</p>
      )}
    </div>
  );
}
