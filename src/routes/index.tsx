import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CITIES } from "@/game/data";
import { APP_VERSION } from "@/version";

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
  return (
    <div className="title-night is-blade">
      <div className="blade-stage">
        <div className="blade-mast">
          <i className="blade-pole" aria-hidden />
          <button type="button" className="city-blade" disabled>
            <i className="blade-hole" aria-hidden />
            <span className="blade-name">{city.name}</span>
            <i className="blade-hole" aria-hidden />
          </button>
          <p className="blade-mark">KEYLINE</p>
        </div>
        <div className="book-links">
          <button type="button" className="title-more" disabled>
            All cities
          </button>
          <button type="button" className="title-more" disabled>
            Leaderboard
          </button>
        </div>
        <p className="book-ver">v{APP_VERSION}</p>
      </div>
    </div>
  );
}
