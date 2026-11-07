import { useState } from "react";
import { STREAK_MILESTONES, nextMile, perksAt } from "@/game/streakMile";

/**
 * 0.1.133: one line under the coin count. Tap it for the ladder.
 * `auth` is the server's run. A guest's local streak can show the count, and the perks stay off.
 */
export function StreakPlate({
  run,
  auth,
  lord,
  startOpen = false,
}: {
  run: number;
  auth: boolean;
  lord: boolean;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const n = Math.max(0, Math.floor(run) || 0);
  const perks = auth ? perksAt(n) : perksAt(0);
  const next = nextMile(n, lord);
  const kept = lord || (auth && n >= 250);
  if (n < 1 && !kept && !startOpen) return null;
  const chips = [
    perks.turbo ? "Turbo" : "",
    perks.trail ? "Blue trail" : "",
    perks.market ? "Market +0.1" : "",
    perks.pixel ? "Pixel speed" : "",
    perks.triple ? "×3 vault coin" : "",
    kept ? "Streak Lord" : "",
  ].filter(Boolean);
  const nextText = !auth ? "Sign in to turn perks on" : next ? `${next.name} in ${next.at - n}` : "All on";
  return (
    <div className="streak-plate mt-1" data-testid="streak-plate">
      <button type="button" className="streak-line pointer-events-auto" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="kicker">Streak</span>
        <span className="tabular-nums">{n}</span>
        {chips.length ? <span className="streak-chips">{chips.join(" · ")}</span> : null}
        <span className="streak-next">{nextText}</span>
      </button>
      {open ? (
        <ol className="streak-miles">
          {STREAK_MILESTONES.map((m) => {
            const on = m.id === "lord" ? kept : auth && n >= m.at;
            return (
              <li key={m.id} className={on ? "is-on" : ""}>
                <span className="tabular-nums">{m.at}</span>
                <span>
                  <b>{m.name}</b>
                  <span className="streak-blurb">{m.blurb}</span>
                </span>
                <span>{on ? (m.id === "lord" ? "Kept" : "On") : m.at - n}</span>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
