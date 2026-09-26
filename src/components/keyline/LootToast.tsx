import { useEffect } from "react";
import { useGame } from "@/game/store";
import type { Tier } from "@/game/types";
import { DIFF_LABEL } from "@/game/trivia";
import { ItemIcon, QtyChip } from "./ItemIcon";

export function LootToast() {
  const loot = useGame((s) => s.loot);
  const miss = useGame((s) => s.miss);
  const toast = useGame((s) => s.toast);
  const dismissLoot = useGame((s) => s.dismissLoot);

  const hold = loot ? (loot.grade === "perfect" ? 3600 : loot.grade === "great" ? 3200 : 2800) : 2600;

  useEffect(() => {
    if (!loot && !miss) return;
    const id = window.setTimeout(() => dismissLoot(), hold);
    return () => window.clearTimeout(id);
  }, [loot, miss, hold, dismissLoot]);

  if (!loot && !miss && !toast) return null;

  const nCoins = loot ? (loot.grade === "perfect" ? 5 : loot.grade === "great" ? 3 : 2) : 0;

  return (
    <>
      {loot || miss ? (
        <div className="pointer-events-none absolute inset-0 z-[850] flex items-center justify-center px-4 pb-32">
          <button
            type="button"
            className={`result-pop pointer-events-auto ${miss ? "is-miss" : "is-hit"}`}
            onClick={() => dismissLoot()}
            style={{ "--hold": `${hold}ms` } as React.CSSProperties}
          >
            {loot ? (
              <>
                <p className="kicker">
                  {loot.grade} · {DIFF_LABEL[loot.diff]}
                </p>
                <div className="loot-coins mt-2" aria-hidden>
                  {Array.from({ length: nCoins }, (_, i) => (
                    <span key={i} className="loot-coin" style={{ animationDelay: `${i * 55}ms` }}>
                      <ItemIcon item="coin" size={i === 0 ? 56 : 36} />
                    </span>
                  ))}
                </div>
                <p className="font-display mt-1 text-3xl tabular-nums">+{loot.points.toLocaleString()}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <QtyChip item="brass" n={loot.brass} />
                  <QtyChip item="ink" n={loot.ink} />
                  <QtyChip item="vellum" n={loot.vellum} />
                  {loot.schematic ? <QtyChip item="schematic" n={1} /> : null}
                  {loot.ingredient ? <span className="kicker">{loot.ingredient.name}</span> : null}
                  {(Object.entries(loot.keys) as [Tier, number][]).map(([t, n]) =>
                    n ? <QtyChip key={t} item={t} n={n} /> : null,
                  )}
                </div>
                {toast ? <p className="mt-2 text-xs text-fg-muted">{toast}</p> : null}
                {loot.boosts?.length ? (
                  <p className="mt-1 text-xs text-fg-muted">{loot.boosts.join(" · ")}</p>
                ) : null}
              </>
            ) : (
              <>
                <p className="kicker">Spent</p>
                <p className="font-display mt-1 text-3xl leading-none">Miss</p>
                <p className="mt-3 text-sm text-fg-muted">The match is spent. The trivia card read:</p>
                <p className="mt-1 text-base font-medium text-pretty">{miss!.answer}</p>
                {miss!.fact ? <p className="mt-2 text-xs text-fg-subtle text-pretty">{miss!.fact}</p> : null}
              </>
            )}
          </button>
        </div>
      ) : toast ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[850] flex justify-center px-3">
          <div className="panel px-4 py-2 text-sm">{toast}</div>
        </div>
      ) : null}
    </>
  );
}