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
    <div className="title-night is-book">
      <div className="book-stage">
        <button type="button" className="matchbook" disabled>
          {["white", "blue", "green", "amber", "red", "violet"].map((tier) => (
            <span key={tier} className={`matchbook-stick tier-${tier}`} aria-hidden>
              <i />
            </span>
          ))}
          <span className="matchbook-cover">
            <strong>KEYLINE</strong>
            <span className="matchbook-strike">{city.name}</span>
          </span>
        </button>
        <p className="book-lede">Tap to walk {city.name}.</p>
        <div className="book-links">
          <button type="button" className="title-more" disabled>
            All cities
          </button>
          <button type="button" className="title-more" disabled>
            Standings
          </button>
        </div>
        <p className="book-ver">v{APP_VERSION}</p>
      </div>
    </div>
  );
}
