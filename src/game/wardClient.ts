import type { CityId } from "./types";
import { useGame } from "./store";
import { commitWallet, walletLive } from "./walletClient";
import { DAILY_REACH_M, canLightDaily } from "./dailyRun";
import { distM } from "./geo";
import { cityDay } from "./vaultStack";
import { wardRoute, wardView } from "./wardCircuit";

// 0.1.184 Ward Circuit: the device only ever says "I am at this circuit lamp, here". The lights, the window, the
// count and the finish pay are the server's ledger rows; `store.ward` is only ever set from a server reply.
const busy = new Set<string>();
/** Lamps the server answered for this session (lit or refused), per city day: never asked again. A lost request,
 *  or a "fast" refusal (arrived sooner than the server's travel floor), is retried while the walker is still there. */
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

async function light(key: string, city: CityId, lamp: string, lat: number, lng: number) {
  busy.add(key);
  try {
    const r = await commitWallet({ kind: "ward", city, lamp, lat, lng });
    if (!r || (!r.ok && r.reason === "fast")) {
      retryAt = Date.now() + RETRY_MS;
      if (r?.ward) useGame.setState({ ward: r.ward });
      return;
    }
    answered.add(key);
    if (r.ward) useGame.setState({ ward: r.ward });
    if (r.ok && r.award?.boosts.length) toasts(r.award.boosts);
  } finally {
    busy.delete(key);
  }
}

/**
 * The map loop's check, next to the Daily Run's and Holiday Lights': while this session is on the server wallet
 * and today's circuit in this city is not finished or lapsed, standing at an unlit circuit lamp (the Daily Run's
 * own at-lamp rule, on foot or seated) sends the op once.
 */
export function checkWard(cityId: CityId, pos: { lat: number; lng: number }, curbOf: (lat: number, lng: number) => { lat: number; lng: number } | null) {
  const w = useGame.getState().ward;
  const now = Date.now();
  if (!w || !walletLive() || now < retryAt) return;
  const v = wardView(w, cityId, now);
  if (!v || v.phase === "done" || v.phase === "lapsed") return;
  const day = cityDay(cityId, now);
  const have = w[cityId]?.day === day ? w[cityId]!.lit : [];
  for (const lamp of wardRoute(cityId, day)) {
    const key = `${cityId}|${day}|${lamp.id}`;
    if (have.includes(lamp.id) || busy.has(key) || answered.has(key)) continue;
    if (distM(pos.lat, pos.lng, lamp.lat, lamp.lng) > DAILY_REACH_M) continue;
    if (!canLightDaily(pos, lamp, curbOf(lamp.lat, lamp.lng))) continue;
    void light(key, cityId, lamp.id, pos.lat, pos.lng);
  }
}
