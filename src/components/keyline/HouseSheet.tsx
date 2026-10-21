import { X } from "lucide-react";
import { sfx } from "@/game/audio";
import { carOf } from "@/game/cars";
import { carSprite } from "@/game/carPaint";
import { TIER_LABEL } from "@/game/data";
import { HOUSES, HOME_LAMPS, houseArt, houseCost, houseOf, lotOf } from "@/game/houses";
import { useGame } from "@/game/store";
import { cityDay } from "@/game/vaultStack";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";

/** 0.1.12 house sheet: four tiers for sale, or your door (painting, the car in the drive, the key, the step-up). */
export function HouseSheet() {
  const open = useGame((s) => s.houseOpen);
  const close = useGame((s) => s.setHouseOpen);
  const cityId = useGame((s) => s.cityId);
  const points = useGame((s) => s.points);
  const house = useGame((s) => s.houses[s.cityId]);
  const claims = useGame((s) => s.homeClaims);
  const carOn = useGame((s) => s.carOn);
  const paint = useGame((s) => s.carPaint);
  const buyHouse = useGame((s) => s.buyHouse);
  const turnKey = useGame((s) => s.turnKey);
  useSheetOpen(open);
  if (!open) return null;
  const lot = lotOf(cityId);
  const owned = house ? houseOf(house.tier) : null;
  const day = cityDay(cityId, Date.now());
  const purseTaken = claims.includes(`home:${day}`);
  const hookTaken = claims.includes(`hook:${cityId}:${day}`);
  const car = carOf(carOn);

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6" data-testid="house-sheet">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">{owned ? "Your door" : "House for sale"} · {lot.name}</p>
            <h2 className="font-display text-2xl">{owned ? owned.name : "A door in this city"}</h2>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Light {HOME_LAMPS} lamps in this city today, then turn the key: a purse of coin (once a day, any city) and one match on the hook (once a day here).
            </p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => close(false)} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {owned ? (
            <div className="house-owned" data-testid="house-owned">
              <img className="house-art" src={houseArt(owned.id)} alt="" width={480} height={360} />
              <div className="house-drive" data-testid="house-drive">
                <span className="kicker">Drive</span>
                {car ? (
                  <img src={carSprite(car.id, "side", paint[car.id])} alt={car.name} width={192} height={64} />
                ) : (
                  <span className="text-sm text-fg-subtle">Empty — you're on the city cab.</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-fg-muted">
                  Purse {owned.purse.toLocaleString()} coin{purseTaken ? " (taken today)" : ""} · {TIER_LABEL[owned.match]} match{hookTaken ? " (taken today)" : ""}
                </p>
                <button
                  type="button"
                  className={`btn ${purseTaken && hookTaken ? "btn-quiet" : "btn-primary"} shrink-0 px-4 text-sm`}
                  data-testid="turn-key"
                  disabled={purseTaken && hookTaken}
                  onClick={() => {
                    sfx.ui();
                    turnKey(cityId);
                  }}
                >
                  {purseTaken && hookTaken ? "Already home" : "Turn the key"}
                </button>
              </div>
            </div>
          ) : null}
          <div className={`grid gap-3${owned ? " mt-5" : ""}`}>
            {owned ? <p className="kicker">Step up</p> : null}
            {HOUSES.map((h) => {
              const cost = houseCost(owned?.id, h.id);
              if (owned && cost === null) return null;
              const short = cost !== null && points < cost;
              return (
                <div key={h.id} className={`car-card${h.star ? " is-star" : ""}`} data-testid={`house-${h.id}`}>
                  <img className="house-thumb" src={houseArt(h.id)} alt="" width={160} height={120} loading="lazy" />
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight">{h.name}</p>
                      <p className="text-sm text-fg-muted">{h.blurb}</p>
                      <p className="car-boost text-sm">
                        Key pays {h.purse.toLocaleString()} coin + a {TIER_LABEL[h.match]} match
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums">
                        <ItemIcon item="coin" size={16} />
                        {(cost ?? h.price).toLocaleString()}
                      </p>
                      <button type="button" className={`btn ${short ? "btn-quiet" : "btn-primary"} mt-1 px-3 text-xs`} disabled={short} onClick={() => buyHouse(cityId, h.id)}>
                        {short ? `Need ${((cost ?? 0) - points).toLocaleString()} more` : owned ? "Step up" : "Buy"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-fg-subtle">One door per city, kept on your account. A step-up costs the difference. Sign-in required.</p>
        </div>
      </div>
    </div>
  );
}
