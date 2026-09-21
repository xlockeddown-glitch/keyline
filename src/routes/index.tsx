import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CITY_LIST, CITIES } from "@/game/data";

export const Route = createFileRoute("/")({ component: Home });

const gameImport = import.meta.env.SSR ? Promise.resolve(null) : import("@/components/keyline/App");

function Home() {
  const [App, setApp] = useState<ComponentType | null>(null);
  useEffect(() => {
    let live = true;
    void gameImport.then((mod) => {
      if (live && mod) setApp(() => mod.KeylineApp);
    });
    return () => {
      live = false;
    };
  }, []);
  return App ? <App /> : <TitleShell />;
}

function TitleShell() {
  const city = CITIES.austin;
  const stubs = [city, ...CITY_LIST.filter((c) => c.id !== city.id).slice(0, 4)];
  return (
    <div className="title-night">
      <div className="title-pave" aria-hidden />
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
          <span className="scout-marker is-idle title-scout" data-scout="raccoon" data-row="0" data-col="0" />
        </div>
        <p className="lede">Walk a real city. Light lamps. Answer trivia.</p>
        <button type="button" className="btn btn-primary title-go" disabled>
          Walk {city.name}
        </button>
        <nav className="city-stubs" aria-label="Cities">
          {stubs.map((c) => (
            <button key={c.id} type="button" className={c.id === city.id ? "is-here" : ""} disabled>
              {c.name}
            </button>
          ))}
        </nav>
        <div className="flex justify-center gap-2">
          <button type="button" className="title-more" disabled>
            All cities
          </button>
          <button type="button" className="title-more" disabled>
            Standings
          </button>
        </div>
      </div>
    </div>
  );
}
