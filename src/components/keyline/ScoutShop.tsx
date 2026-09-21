import { X } from "lucide-react";
import { SCOUT_LIST, SUPER_LEGENDARY_LABEL, cityShop, superLegendaryCost } from "@/game/data";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";

export function ScoutRoster({ hire }: { hire: boolean }) {
  const points = useGame((s) => s.points);
  const scouts = useGame((s) => s.scouts);
  const scout = useGame((s) => s.scout);
  const buyScout = useGame((s) => s.buyScout);
  const wearScout = useGame((s) => s.wearScout);
  const cityId = useGame((s) => s.cityId);
  const shop = cityShop(cityId);
  const superCost = superLegendaryCost();

  return (
    <div className="grid gap-3">
      {SCOUT_LIST.map((s) => {
        const owned = scouts.includes(s.id);
        const wearing = scout === s.id;
        return (
          <div key={s.id} className="flex items-start gap-3 rounded-md border border-border bg-bg-subtle/50 p-4">
            <div className="scout-hire" aria-hidden>
              <span className="scout-marker is-idle" data-scout={s.id} data-row="0" data-col="0" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg leading-tight">{s.name}</p>
                  <p className="text-sm text-pretty text-fg-muted">{s.blurb}</p>
                  <p className="mt-1 kicker">{s.perk.label}</p>
                  {s.coins >= 50000 ? <p className="mt-1 kicker">Legendary hire</p> : null}
                  {wearing ? <p className="mt-1 kicker">{s.bed}</p> : null}
                </div>
                {owned ? (
                  <button
                    type="button"
                    className={`btn ${wearing ? "btn-primary" : "btn-ghost"} px-3 text-xs`}
                    onClick={() => wearScout(s.id)}
                  >
                    {wearing ? "Walking" : "Walk"}
                  </button>
                ) : hire ? (
                  <button
                    type="button"
                    className={`btn ${points >= s.coins ? "btn-primary" : "btn-quiet"} shrink-0 px-3 text-xs`}
                    onClick={() => buyScout(s.id)}
                  >
                    Hire · {s.coins.toLocaleString()}
                  </button>
                ) : (
                  <p className="shrink-0 self-center text-xs text-fg-subtle">
                    {shop ? `Hire at ${shop.name}` : "Hire on the street"}
                  </p>
                )}
              </div>
              {owned || !hire ? null : (
                <p className="mt-2 flex items-center gap-1.5 text-sm tabular-nums text-fg-muted">
                  <ItemIcon item="coin" size={18} />
                  {s.coins.toLocaleString()}
                  {points < s.coins ? <span className="text-xs text-fg-subtle">· short</span> : null}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div className="flex items-start gap-3 rounded-md border border-border bg-bg-subtle/50 p-4">
        <div className="scout-hire" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg leading-tight">The last coat</p>
              <p className="text-sm text-pretty text-fg-muted">
                Three times the Fox. Not on the rack. Walks still keep the curb.
              </p>
              <p className="mt-1 kicker">{SUPER_LEGENDARY_LABEL}</p>
            </div>
            {hire ? (
              <button type="button" className="btn btn-quiet shrink-0 px-3 text-xs" disabled>
                Not yet · {superCost.toLocaleString()}
              </button>
            ) : (
              <p className="shrink-0 self-center text-xs text-fg-subtle tabular-nums">
                Not yet · {superCost.toLocaleString()}
              </p>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm tabular-nums text-fg-muted">
            <ItemIcon item="coin" size={18} />
            {superCost.toLocaleString()}
            <span className="text-xs text-fg-subtle">· {SUPER_LEGENDARY_LABEL}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ScoutShop() {
  const shopOpen = useGame((s) => s.shopOpen);
  const closeShop = useGame((s) => s.closeShop);
  const cityId = useGame((s) => s.cityId);
  const shop = cityShop(cityId);
  if (!shopOpen || !shop) return null;

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Outfitter</p>
            <h2 className="font-display text-2xl">{shop.name}</h2>
            <p className="mt-1 text-sm text-pretty text-fg-muted">{shop.lore}</p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => closeShop()} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ScoutRoster hire />
        </div>
      </div>
    </div>
  );
}
