import { X } from "lucide-react";
import { CARS, carBoost, dealerOf } from "@/game/cars";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";

/** 0.1.8 car lot: five cars, bought once with coin (the server checks the price), and which one you drive. */
export function Showroom() {
  const open = useGame((s) => s.dealerOpen);
  const close = useGame((s) => s.setDealerOpen);
  const cityId = useGame((s) => s.cityId);
  const points = useGame((s) => s.points);
  const owned = useGame((s) => s.carsOwned);
  const carOn = useGame((s) => s.carOn);
  const buyCar = useGame((s) => s.buyCar);
  const driveCar = useGame((s) => s.driveCar);
  useSheetOpen(open);
  if (!open) return null;
  const lot = dealerOf(cityId);

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6" data-testid="showroom">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Car lot · Showroom</p>
            <h2 className="font-display text-2xl">{lot.name}</h2>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Your car is your own cab. It waits at the curb when you tap Car, and it drives a little faster than the city cab. You still open lamps on foot.
            </p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => close(false)} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3">
            {CARS.map((c) => {
              const mine = owned.includes(c.id);
              const driving = carOn === c.id;
              const short = points < c.price;
              return (
                <div key={c.id} className={`car-card${c.star ? " is-star" : ""}`} data-testid={`car-${c.id}`}>
                  <img className="car-art" src={`/sprites/cars/${c.id}-side.png`} alt="" width={192} height={64} />
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      {c.star ? <p className="kicker car-star">The one to want</p> : null}
                      <p className="font-display text-lg leading-tight">{c.name}</p>
                      <p className="text-sm text-fg-muted">
                        {c.year} · {c.blurb}
                      </p>
                      <p className="car-boost text-sm">{carBoost(c)} faster than the cab</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {mine ? (
                        <button
                          type="button"
                          className={`btn ${driving ? "btn-primary" : "btn-ghost"} px-3 text-xs`}
                          onClick={() => {
                            sfx.ui();
                            driveCar(driving ? null : c.id);
                          }}
                        >
                          {driving ? "Driving" : "Drive this"}
                        </button>
                      ) : (
                        <>
                          <p className="flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums">
                            <ItemIcon item="coin" size={16} />
                            {c.price.toLocaleString()}
                          </p>
                          <button
                            type="button"
                            className={`btn ${short ? "btn-quiet" : "btn-primary"} mt-1 px-3 text-xs`}
                            disabled={short}
                            onClick={() => buyCar(c.id)}
                          >
                            {short ? `Need ${(c.price - points).toLocaleString()} more` : "Buy"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-fg-subtle">You pay once and the car stays on your account in every city. Tap Driving to go back to the city cab.</p>
        </div>
      </div>
    </div>
  );
}
