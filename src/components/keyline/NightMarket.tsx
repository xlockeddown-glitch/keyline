import { useEffect, useState } from "react";
import { CITIES } from "@/game/data";
import { useGame } from "@/game/store";
import { MARKET_TAG, marketAt, marketLeft, nextMarket, type NightMarket } from "@/game/nightMarket";
import type { CityId } from "@/game/types";
import { MARKET_COIN_CAP, MARKET_LIGHTS, bestLight, nextLight } from "@/game/marketLights";

/** The market open in this city right now; re-reads every 5 s (same beat as the map sign) so the clock and the hour flip stay live. */
export function useMarket(cityId: CityId): { market: NightMarket | null; now: number } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(id);
  }, []);
  return { market: marketAt(cityId, now), now };
}

/** HUD line: street, time left, ×2. Tap to walk to the nearest stretch of it. */
export function MarketHudLine({ onWalk }: { onWalk: () => void }) {
  const cityId = useGame((s) => s.cityId);
  const light = useGame((s) => s.lightsOwned);
  const { market, now } = useMarket(cityId);
  const [open, setOpen] = useState(true);
  const hour = market?.hour;
  // 0.1.00: the full line shows for a few seconds per market, then folds to a 🏮 ×N chip; tap to unfold.
  useEffect(() => {
    setOpen(true);
    const t = window.setTimeout(() => setOpen(false), 5000);
    return () => window.clearTimeout(t);
  }, [hour]);
  if (!market) return null;
  const x = bestLight(light).mult.toFixed(1).replace(/\.0$/, "");
  if (!open) {
    return (
      <button type="button" className="market-chip pointer-events-auto mt-1" onClick={() => setOpen(true)} aria-label={`Night market ×${x}. Show details.`} data-testid="market-chip">
        🏮 ×{x}
      </button>
    );
  }
  return (
    <button type="button" className="market-hud pointer-events-auto mt-1" onClick={onWalk} aria-label={`Night market on ${market.street.name}, ${marketLeft(market, now)}. Walk there.`} data-testid="market-hud">
      <span className="market-dot" aria-hidden />
      <span className="kicker mr-1.5">Night market</span>
      <span className="text-fg">{market.zone.plaza ?? market.street.name}</span>
      <span className="tabular-nums text-fg-subtle"> · {marketLeft(market, now)} · ×{x}</span>
    </button>
  );
}

/** 0.1.00: Journal · market lights: buy the next colour with coin, pick which colour the string lights show. */
export function MarketLightsPanel() {
  const owned = useGame((s) => s.lightsOwned);
  const shown = useGame((s) => s.marketLight);
  const coins = useGame((s) => s.points);
  const next = nextLight(owned);
  return (
    <div data-testid="market-lights">
      <p className="kicker">Market lights</p>
      <p className="mt-1 text-xs text-fg-muted">Brighter lights draw a bigger crowd: night-market coin pays more. Matches stay ×2. Owl stacks; combined cap ×{MARKET_COIN_CAP}.</p>
      <ul className="mt-1">
        {MARKET_LIGHTS.map((l) => {
          const have = owned.includes(l.id);
          return (
            <li key={l.id} className="light-row">
              <span className="light-dot" style={{ background: l.color, color: l.id === "rainbow" ? "#ffe066" : l.color }} aria-hidden />
              <span className="flex-1 text-sm">
                {l.label} <span className="text-fg-subtle">· coin ×{l.mult.toFixed(1)}</span>
              </span>
              {have ? (
                <button type="button" className="lvl-btn" disabled={shown === l.id} onClick={() => useGame.setState({ marketLight: l.id })}>
                  {shown === l.id ? "Shown" : "Show"}
                </button>
              ) : next?.id === l.id ? (
                <button type="button" className="lvl-btn" disabled={coins < l.price} onClick={() => useGame.getState().buyLight(l.id)}>
                  {l.price.toLocaleString("en-US")} coin
                </button>
              ) : (
                <span className="text-xs text-fg-subtle">{l.price.toLocaleString("en-US")}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Journal · Places: what the market is, where, until when, which lamps stand on it, and the next hour's street. */
export function MarketJournalRow() {
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const { market, now } = useMarket(cityId);
  if (!market) return null;
  const city = CITIES[cityId];
  const lamps = market.street.lamps.map((id) => city.pois.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const named = lamps.map((p) => (atlas[p.id] ? p.name : "an undiscovered lamp"));
  const next = nextMarket(cityId, now);
  const until = new Date(market.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <li className="hq-row market-row" data-testid="market-journal">
      <span className="market-lantern" aria-hidden />
      <div className="hq-row-copy">
        <p className="kicker">
          {MARKET_TAG} · until {until} · {marketLeft(market, now)}
        </p>
        <p className="hq-row-title">{market.street.name}</p>
        <p className="hq-row-sub">
          Lamps, trivia cards and matches in the market zone pay double for the hour
          {named.length ? ` — ${named.join(", ")}.` : "."} Every walker in {city.name} shares the same market.
          {next ? ` Next hour: ${next.street.name}.` : ""}
        </p>
      </div>
    </li>
  );
}
