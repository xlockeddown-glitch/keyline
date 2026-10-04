import { Lock, Ticket } from "lucide-react";
import { CITIES } from "@/game/data";
import { PASS_POINTS, lockLine, passProgress, unlockCost } from "@/game/cityPass";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";

/**
 * 0.0.55: progress toward the next city pass, for the city the player is in (Journal Progress and the train
 * station). Each route counts on its own; any one of them pays a pass.
 */
export function PassProgressRow({ compact = false }: { compact?: boolean }) {
  const cities = useGame((s) => s.cities);
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const p = passProgress(cities, cityId, atlas);
  const name = CITIES[cityId].name;
  const next = cities.freePick ? "Your second city is free — pick it at the train station." : p.passes ? `${p.passes} city pass${p.passes === 1 ? "" : "es"} to spend at the train station.` : "City 3 onward costs one city pass each.";
  return (
    <div className={compact ? "min-w-0" : "hq-row min-w-0"} data-testid="pass-progress">
      {compact ? null : <Ticket className="size-5 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />}
      <div className="hq-row-copy">
        <p className={compact ? "kicker" : "hq-row-title"}>
          City passes <span className="tabular-nums text-fg-muted">×{p.passes}</span>
          <span className="tabular-nums text-fg-muted"> · {cities.unlocked.length}/15 cities</span>
        </p>
        <p className="hq-row-sub">{next} Any one of these pays a pass:</p>
        <ul className="hq-row-sub mt-1 grid gap-0.5 tabular-nums">
          <li>
            Lamp points {p.lamps.have}/{PASS_POINTS} · amber 1, red 4, violet 10
          </li>
          <li>{p.goals.paid ? `Every place in ${name} · pass paid` : `Every place in ${name} ${p.goals.have}/${p.goals.need}`}</li>
          <li>{p.runs.paid ? `Lantern Runs in ${name} · pass paid` : `Lantern Runs in ${name} ${p.runs.have}/${p.runs.need}`}</li>
        </ul>
      </div>
    </div>
  );
}

/** Lock badge + what a locked city needs. Empty for an open city. */
export function LockNote({ id }: { id: CityId }) {
  const cities = useGame((s) => s.cities);
  const line = lockLine(cities, id);
  if (!line) return null;
  return (
    <span className="mt-1 flex items-start gap-1.5 text-xs text-fg-subtle" data-testid="city-lock">
      <Lock className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="text-pretty">{line.replace(/^Locked · /, "")}</span>
    </span>
  );
}

export function useUnlockCost(id: CityId) {
  const cities = useGame((s) => s.cities);
  return unlockCost(cities, id);
}
