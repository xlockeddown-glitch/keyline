import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { cometAt, cometLeft, cometLine } from "@/game/eventVault";
import { gameNow } from "@/game/gameClock";

/**
 * 0.1.159 HUD line for the Comet vault: "Comet vault on Elm St · 14 min left" while it is open, "next comet in 1 h 10"
 * otherwise, and "cleared · next comet in …" once this walker has opened it. Re-reads every second, like the market line.
 */
export function CometHudLine() {
  const cityId = useGame((s) => s.cityId);
  const vaults = useGame((s) => s.vaults);
  const [now, setNow] = useState(() => gameNow());
  useEffect(() => {
    const id = window.setInterval(() => setNow(gameNow()), 1_000);
    return () => window.clearInterval(id);
  }, []);
  const line = cometLine(cityId, now);
  const v = line.poi ? vaults[line.poi.id] : undefined;
  const dark = Boolean(line.open && v && v.state === "cooling" && v.coolUntil > Date.now());
  let text = line.text;
  if (dark && v?.lockout) text = `${line.text} · locked out`;
  else if (dark) text = `Comet vault cleared · next comet in ${cometLeft(cometAt(cityId, cometAt(cityId, now).endsAt).startsAt - now)}`;
  return (
    <span className={`market-chip comet-chip pointer-events-auto mt-1${line.open && !dark ? "" : " is-dark"}`} data-testid="comet-hud" title="Comet vault: a green key, ×1.5 coin and a blue key, once per comet">
      ☄ {text}
    </span>
  );
}
