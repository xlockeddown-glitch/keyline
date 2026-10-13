import { X } from "lucide-react";
import { CITIES, KIOSK, TIER_LABEL, cityCounter } from "@/game/data";
import { crateLoot, CRATE_MAX, nextCrateStreak } from "@/game/crate";
import { TIERS } from "@/game/items";
import { BANK_DOWN, BANK_UP, TIER_ORDER, TIER_VALUE, bankDownSpec, bankUpSpec } from "@/game/rewards";
import { matchCap } from "@/game/ticket";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";

/** The street counter: buy from the tray, pick up the morning crate, exchange matches. */
export function WardCounter() {
  const open = useGame((s) => s.errandOpen === "counter");
  const close = useGame((s) => s.closeErrand);
  const cityId = useGame((s) => s.cityId);
  const errandId = useGame((s) => s.errandId);
  const place = CITIES[cityId].pois.find((p) => p.id === errandId && p.kind === "counter") ?? cityCounter(cityId);
  const points = useGame((s) => s.points);
  const keys = useGame((s) => s.keys);
  const fares = useGame((s) => s.fares);
  const pressPass = useGame((s) => s.pressPass);
  const buyKiosk = useGame((s) => s.buyKiosk);
  const claimCrate = useGame((s) => s.claimCrate);
  const bankUp = useGame((s) => s.bankUp);
  const bankDown = useGame((s) => s.bankDown);
  const lastCrateDay = useGame((s) => s.lastCrateDay);
  const crateStreak = useGame((s) => s.crateStreak);
  const today = new Date().toISOString().slice(0, 10);
  const claimed = lastCrateDay === today;
  const crateDay = claimed ? Math.max(1, crateStreak) : nextCrateStreak(lastCrateDay, crateStreak, today);
  const loot = crateLoot(crateDay);
  const city = CITIES[cityId];

  useSheetOpen(open);
  if (!open || !place) return null;

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Counter · {city.name}</p>
            <h2 className="font-display text-2xl">{place.name}</h2>
            <p className="mt-1 text-sm text-pretty text-fg-muted">{place.lore}</p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => close()} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3">
            <button type="button" className="hq-row w-full text-left disabled:opacity-70" disabled={claimed} onClick={claimCrate}>
              <ItemIcon item="crate" size={40} />
              <div className="hq-row-copy">
                <p className="hq-row-title">{claimed ? `Day ${crateDay} claimed` : `Claim day ${crateDay} crate`}</p>
                <p className="hq-row-sub">
                  Login streak {crateDay}/{CRATE_MAX}. One missed day is forgiven.
                  {crateDay >= 30 ? " A violet is in the box." : ""}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                  {TIERS.filter((t) => loot[t] > 0).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1">
                      <ItemIcon item={t} size={22} />
                      {loot[t]} {TIER_LABEL[t]}
                    </span>
                  ))}
                </p>
              </div>
            </button>
            <p className="kicker mt-2">Desk tray</p>
            {(Object.values(KIOSK) as (typeof KIOSK)[keyof typeof KIOSK][]).map((item) => {
              const extra =
                item.id === "pass" && pressPass > 0
                  ? `${pressPass} waiting`
                  : item.id === "fare"
                    ? `${fares} in the pocket`
                    : item.id === "tinder"
                      ? `${keys.white} white`
                      : item.id === "wick"
                        ? `${keys.blue} blue`
                        : item.id === "amber" && keys.amber > 0
                          ? `${keys.amber} amber`
                          : item.id === "oil" && keys.violet > 0
                            ? `${keys.violet} violet`
                            : null;
              return (
                <div key={item.id} className="hq-row">
                  <ItemIcon item="coin" size={36} />
                  <div className="hq-row-copy">
                    <p className="hq-row-title">{item.name}</p>
                    <p className="hq-row-sub">{item.blurb}</p>
                    {extra ? <p className="hq-row-sub">{extra}</p> : null}
                    <div className="hq-row-actions">
                      <button
                        type="button"
                        className={`btn shrink-0 px-3 text-xs ${points >= item.cost ? "btn-primary" : "btn-quiet"}`}
                        onClick={() => buyKiosk(item.id)}
                      >
                        <ItemIcon item="coin" size={18} />
                        {item.cost.toLocaleString()}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="kicker mt-2">Exchange</p>
            <p className="text-xs text-fg-muted">
              Craft {BANK_UP} lower → 1 higher, tax. Break 1 higher → {BANK_DOWN} lower, none. White {TIER_VALUE.white} coin.
            </p>
            <ul className="grid gap-2">
              {TIER_ORDER.map((tier) => {
                const up = bankUpSpec(tier);
                const down = bankDownSpec(tier);
                if (!up && !down) return null;
                const have = keys[tier] ?? 0;
                return (
                  <li key={tier} className="hq-row">
                    <ItemIcon item={tier} size={36} />
                    <div className="hq-row-copy">
                      <p className="hq-row-title">
                        {TIER_LABEL[tier]} <span className="tabular-nums text-fg-muted">×{have}</span>
                      </p>
                      <div className="hq-row-actions">
                        {up ? (
                          <button
                            type="button"
                            className="btn btn-quiet px-3 text-xs"
                            disabled={have < up.payN || (keys[up.get] ?? 0) + up.getN > matchCap(up.get)}
                            onClick={() => {
                              sfx.ui();
                              bankUp(tier);
                            }}
                          >
                            {up.payN} {TIER_LABEL[tier]} → 1 {TIER_LABEL[up.get]}
                          </button>
                        ) : null}
                        {down ? (
                          <button
                            type="button"
                            className="btn btn-quiet px-3 text-xs"
                            disabled={have < down.payN || (keys[down.get] ?? 0) + down.getN > matchCap(down.get)}
                            onClick={() => {
                              sfx.ui();
                              bankDown(tier);
                            }}
                          >
                            1 {TIER_LABEL[tier]} → {down.getN} {TIER_LABEL[down.get]}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
