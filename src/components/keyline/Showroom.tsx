import { useState } from "react";
import { X } from "lucide-react";
import { CAR_COLORS, carSprite, factoryColor, paintPrice } from "@/game/carPaint";
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
  const cans = useGame((s) => s.carCans);
  const paint = useGame((s) => s.carPaint);
  const paintCar = useGame((s) => s.paintCar);
  const [painting, setPainting] = useState<string | null>(null);
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
              Your car is your own cab. It waits at the curb when you tap Car, and it drives a little faster than the city cab. Lamps, vaults and matches answer from your car; the city cab parks you first.
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
                  <img className="car-art" src={carSprite(c.id, "side", mine ? paint[c.id] : null)} alt="" width={192} height={64} />
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
                        <div className="flex flex-col items-end gap-1">
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
                        <button
                          type="button"
                          className="btn btn-quiet px-3 text-xs"
                          data-testid={`paint-${c.id}`}
                          onClick={() => {
                            sfx.ui();
                            setPainting(painting === c.id ? null : c.id);
                          }}
                        >
                          Paint{cans.some((x) => x.startsWith(`${c.id}:`)) ? " ·  can ready" : ""}
                        </button>
                        </div>
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
                  {mine && painting === c.id ? (
                    <div className="paint-shop mt-3 border-t border-border pt-3" data-testid={`paint-dialog-${c.id}`}>
                      <p className="kicker mb-1">Paint shop · {paintPrice(c.id).toLocaleString()} coin and one can</p>
                      <ul className="grid gap-1.5">
                        {CAR_COLORS[c.id].map((p) => {
                          const n = cans.filter((x) => x === `${c.id}:${p.id}`).length;
                          const on = (paint[c.id] ?? factoryColor(c.id)) === p.id;
                          const short = points < paintPrice(c.id);
                          return (
                            <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex items-center gap-2">
                                <i className="paint-chip" style={{ background: p.hex }} />
                                {p.name}
                                {p.id === factoryColor(c.id) ? <span className="text-xs text-fg-subtle">factory</span> : null}
                              </span>
                              {on ? (
                                <span className="text-xs text-fg-muted">On the car</span>
                              ) : n ? (
                                <button type="button" className={`btn ${short ? "btn-quiet" : "btn-primary"} px-3 text-xs`} disabled={short} onClick={() => paintCar(c.id, p.id)}>
                                  {short ? "Need more coin" : `Paint (${n} can${n > 1 ? "s" : ""})`}
                                </button>
                              ) : (
                                <span className="text-xs text-fg-subtle">No can</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-2 text-xs text-fg-subtle">Paint cans turn up in amber and red vaults and in the daily match cache.</p>
                    </div>
                  ) : null}
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
