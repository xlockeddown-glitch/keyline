import type { CityId } from "./types";
import { useGame } from "./store";
import { commitWallet, walletLive } from "./walletClient";
import { DAILY_REACH_M, canLightDaily } from "./dailyRun";
import { gameNow } from "./gameClock";
import { distM } from "./geo";
import { holidayOpen, holidayRoute } from "./holidayLights";

// 0.1.182 Holiday Lights: the device only ever says "I am at this route lamp, here". The stamps, the count and the
// finish pay are the server's ledger rows; `store.holiday` is only ever set from a server reply.
const busy = new Set<string>();
/** Lamps the server answered for this session (stamped or refused): never asked again. Only a lost request is retried. */
const answered = new Set<string>();
const RETRY_MS = 5_000;
let retryAt = 0;

function toasts(lines: readonly string[]) {
  lines.forEach((line, i) => {
    window.setTimeout(() => {
      useGame.setState({ toast: line });
      window.setTimeout(() => {
        if (useGame.getState().toast === line) useGame.setState({ toast: null });
      }, 2200);
    }, i * 2300);
  });
}

async function stamp(city: CityId, lamp: string, lat: number, lng: number) {
  const key = `${city}|${lamp}`;
  busy.add(key);
  try {
    const r = await commitWallet({ kind: "lights", city, lamp, lat, lng });
    if (!r) {
      retryAt = Date.now() + RETRY_MS;
      return;
    }
    answered.add(key);
    if (r.holiday) useGame.setState({ holiday: r.holiday });
    if (r.ok && r.award?.boosts.length) toasts(r.award.boosts);
  } finally {
    busy.delete(key);
  }
}

/**
 * The map loop's check, next to the Daily Run's: while the event is open and this session is on the server wallet,
 * standing at an unstamped route lamp (the Daily Run's own at-lamp rule, on foot or seated) sends the op once.
 */
export function checkHoliday(cityId: CityId, pos: { lat: number; lng: number }, curbOf: (lat: number, lng: number) => { lat: number; lng: number } | null) {
  const h = useGame.getState().holiday;
  if (!h || !walletLive() || !holidayOpen(gameNow()) || Date.now() < retryAt) return;
  const have = h.stamped[cityId] ?? [];
  for (const lamp of holidayRoute(cityId)) {
    const key = `${cityId}|${lamp.id}`;
    if (have.includes(lamp.id) || busy.has(key) || answered.has(key)) continue;
    if (distM(pos.lat, pos.lng, lamp.lat, lamp.lng) > DAILY_REACH_M) continue;
    if (!canLightDaily(pos, lamp, curbOf(lamp.lat, lamp.lng))) continue;
    void stamp(cityId, lamp.id, pos.lat, pos.lng);
  }
}
