import { ArrowLeft, Printer } from "lucide-react";
import { allCities } from "@/game/store";
import { useGame } from "@/game/store";
import { sfx, startBed, unlockAudio } from "@/game/audio";
import { CITIES, cityShop } from "@/game/data";
import { AudioDock } from "./AudioDock";

export function CitySelect() {
  const pickCity = useGame((s) => s.pickCity);
  const setScreen = useGame((s) => s.setScreen);
  const atlas = useGame((s) => s.atlas);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
        <button
          type="button"
          className="btn btn-quiet size-11 p-0"
          onClick={() => setScreen("title")}
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="kicker">Twelve cities</p>
          <h1 className="font-display text-3xl leading-none">Pick a city</h1>
        </div>
        <AudioDock />
      </header>
      <ul className="mx-auto grid max-w-3xl gap-3 px-5 pb-16 sm:grid-cols-2">
        {allCities().map((c) => {
          const found = c.pois.filter((p) => atlas[p.id]).length;
          return (
            <li key={c.id}>
              <button
                type="button"
                className="panel w-full p-5 text-left transition-colors duration-[var(--motion-fast,250ms)] hover:border-border-strong"
                onClick={() => {
                  unlockAudio();
                  startBed(useGame.getState().scout);
                  sfx.ui();
                  pickCity(c.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl leading-none">{c.name}</h2>
                    <p className="mt-1 kicker">{c.region}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-1 text-xs text-fg-muted tabular-nums">
                    {c.pois.length} lamps
                  </span>
                </div>
                <p className="mt-3 text-sm text-fg-muted">{c.blurb}</p>
                <p className="mt-4 flex items-center gap-2 text-xs text-fg-subtle">
                  <Printer className="size-3.5" strokeWidth={1.75} />
                  {CITIES[c.id].pois.filter((p) => p.printShop).length} print shop
                  {CITIES[c.id].pois.filter((p) => p.printShop).length === 1 ? "" : "s"}
                  {cityShop(c.id) ? ` · ${cityShop(c.id)!.name}` : ""}
                  {found ? ` · ${found} in your atlas` : ""}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
