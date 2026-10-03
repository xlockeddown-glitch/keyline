import { useEffect, useState } from "react";
import { CITIES } from "@/game/data";
import { useGame } from "@/game/store";
import { MARKET_TAG, marketAt, marketLeft, nextMarket, type NightMarket } from "@/game/nightMarket";
import type { CityId } from "@/game/types";

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
  const { market, now } = useMarket(cityId);
  if (!market) return null;
  return (
    <button type="button" className="market-hud pointer-events-auto mt-1" onClick={onWalk} aria-label={`Night market on ${market.street.name}, ${marketLeft(market, now)}. Walk there.`} data-testid="market-hud">
      <span className="market-dot" aria-hidden />
      <span className="kicker mr-1.5">Night market</span>
      <span className="text-fg">{market.street.name}</span>
      <span className="tabular-nums text-fg-subtle"> · {marketLeft(market, now)} · ×2</span>
    </button>
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
          Lamps, trivia cards and matches on this street pay double for the hour
          {named.length ? ` — ${named.join(", ")}.` : "."} Every walker in {city.name} shares the same market.
          {next ? ` Next hour: ${next.street.name}.` : ""}
        </p>
      </div>
    </li>
  );
}
