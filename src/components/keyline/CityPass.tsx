import { Lock, Ticket } from "lucide-react";
import { CITIES } from "@/game/data";
import { PASS_POINTS, lockLine, lockShort, passProgress, unlockCost } from "@/game/cityPass";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";

/**
 * 0.0.56: progress toward the next city pass, for the city the player is in (Journal Progress and the train
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

function Bar({ have, need, done }: { have: number; need: number; done?: boolean }) {
  const pct = done ? 100 : Math.max(0, Math.min(100, (have / Math.max(1, need)) * 100));
  return (
    <span className="pass-bar" aria-hidden>
      <i style={{ width: `${pct}%` }} className={done ? "is-done" : ""} />
    </span>
  );
}

/**
 * 0.0.95: the plain "How to get a city pass" card at the station when a city is locked: how many passes you
 * hold, what one does, and the three ways to earn one with live progress bars.
 */
export function PassHelpCard() {
  const cities = useGame((s) => s.cities);
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const p = passProgress(cities, cityId, atlas);
  const name = CITIES[cityId].name;
  return (
    <div className="pass-help" data-testid="pass-help">
      <p className="font-display text-lg leading-tight">How to get a city pass</p>
      <p className="mt-1 text-sm text-pretty">
        You have <b className="tabular-nums">{p.passes}</b> pass{p.passes === 1 ? "" : "es"}. <b>1 pass unlocks a new city.</b>
        {p.passes ? " Tap “Use pass” next to the city you want." : " Earn one any of these ways:"}
      </p>
      <ul className="mt-2 grid gap-2 text-sm">
        <li>
          <span className="flex justify-between gap-2"><span>Light amber, red or violet lamps</span><span className="tabular-nums text-fg-muted">{p.lamps.have}/{PASS_POINTS} pts</span></span>
          <span className="block text-xs text-fg-muted">Amber 1 point, red 4, violet 10. 10 points = 1 pass.</span>
          <Bar have={p.lamps.have} need={p.lamps.need} />
        </li>
        <li>
          <span className="flex justify-between gap-2"><span>Finish “All of {name}”</span><span className="tabular-nums text-fg-muted">{p.goals.paid ? "done" : `${p.goals.have}/${p.goals.need}`}</span></span>
          <span className="block text-xs text-fg-muted">Visit every place in this city.</span>
          <Bar have={p.goals.have} need={p.goals.need} done={p.goals.paid} />
        </li>
        <li>
          <span className="flex justify-between gap-2"><span>3 Lantern Runs in {name}</span><span className="tabular-nums text-fg-muted">{p.runs.paid ? "done" : `${p.runs.have}/${p.runs.need}`}</span></span>
          <span className="block text-xs text-fg-muted">The daily Lantern Run, finished three times in one city.</span>
          <Bar have={p.runs.have} need={p.runs.need} done={p.runs.paid} />
        </li>
      </ul>
    </div>
  );
}

/** Lock badge + what a locked city needs. Empty for an open city. */
export function LockNote({ id, short = false }: { id: CityId; short?: boolean }) {
  const cities = useGame((s) => s.cities);
  const line = short ? lockShort(cities, id) : lockLine(cities, id);
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
