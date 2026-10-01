import { CITIES, CITY_LIST } from "./data.ts";
import { distM } from "./geo.ts";
import { IDLE, journeyOutcome, rideReward, type RideOutcome } from "./rideGames.ts";
import type { City, CityId, Journey, Poi, Tier } from "./types";

export const VAULTS_PER_FARE = 3;
export const FARES_CAP = 2;
export const WHITE_POCKET = 4;
export const BLUE_POCKET = 4;
export const GREEN_POCKET = 1;
/**
 * Ride grants alone may fill whites this far, so a 14-minute win lands whole.
 * Every other source still stops at WHITE_POCKET.
 */
export const RIDE_WHITE_POCKET = 15;
export const SPARK_DAY = 6;
/** A violet lamp stays dark for six hours after it pays. */
export const VIOLET_COOL_MS = 6 * 60 * 60_000;

export function lampCoolMs(tier: import("./types").Tier) {
  if (tier === "white") return 90_000;
  if (tier === "blue") return 140_000;
  if (tier === "green") return 220_000;
  if (tier === "violet") return VIOLET_COOL_MS;
  return 400_000;
}

export function formatCool(ms: number) {
  const m = Math.ceil(Math.max(0, ms) / 60_000);
  if (m <= 1) return "a minute";
  if (m < 90) return `${m} min`;
  const h = Math.max(1, Math.round(m / 60));
  return h === 1 ? "1 hr" : `${h} hr`;
}

export function sparkState(day: string, n: number, lamps: string[], today: string) {
  if (day === today) return { sparkDay: day, sparkN: n, sparkLamps: lamps };
  return { sparkDay: today, sparkN: 0, sparkLamps: [] as string[] };
}

export function matchCap(tier: import("./types").Tier) {
  if (tier === "white") return WHITE_POCKET;
  if (tier === "blue") return BLUE_POCKET;
  if (tier === "green") return GREEN_POCKET;
  return 99;
}

export function fareDesk(city: City): Poi {
  return city.pois.find((p) => p.kind === "station") ?? city.pois.find((p) => p.printShop) ?? city.pois[0]!;
}

export function isFareDesk(p: { kind: string; printShop?: boolean }) {
  return p.kind === "station" || Boolean(p.printShop);
}

export function fareMs(from: CityId, to: CityId) {
  const a = CITIES[from].spawn;
  const b = CITIES[to].spawn;
  const km = distM(a.lat, a.lng, b.lat, b.lng) / 1000;
  return Math.round(Math.min(14 * 60_000, Math.max(48_000, 40_000 + km * 240)));
}

export function formatEta(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

export function otherWards(from: CityId) {
  return CITY_LIST.filter((c) => c.id !== from);
}

/**
 * What the carriage owes so far. Whites are the ride's one payout (idle, played or won — the best
 * finished round), due once the train has run 12s; strong wins may carry swapped blues.
 * 10+ min is a blue; sitting the whole 10+ min haul with the tab open is a green.
 */
export function transitLoot(wallMs: number, openMs: number, rideMs = wallMs, outcome: RideOutcome = IDLE) {
  const pay = rideReward(rideMs, outcome);
  const started = wallMs >= 12_000 || outcome.kind !== "idle";
  const ten = 10 * 60_000;
  const blue = wallMs >= ten ? 1 : 0;
  const sat = wallMs >= ten && openMs >= ten && openMs >= wallMs * 0.85;
  return {
    white: started ? pay.white : 0,
    blue: blue + (started ? pay.blue : 0),
    green: sat ? 1 : 0,
  };
}

/**
 * Put ride matches in the pocket. Whites may stack to RIDE_WHITE_POCKET; a blue with no room
 * comes as three whites instead; anything still over is dropped.
 */
export function pocketRide(keys: Record<Tier, number>, owe: { white: number; blue: number; green: number }) {
  const want = { white: Math.max(0, owe.white), blue: Math.max(0, owe.blue), green: Math.max(0, owe.green) };
  const blue = Math.min(want.blue, Math.max(0, BLUE_POCKET - (keys.blue ?? 0)));
  const spill = (want.blue - blue) * 3;
  const white = Math.min(want.white + spill, Math.max(0, RIDE_WHITE_POCKET - (keys.white ?? 0)));
  const green = Math.min(want.green, Math.max(0, GREEN_POCKET - (keys.green ?? 0)));
  return {
    keys: { ...keys, white: (keys.white ?? 0) + white, blue: (keys.blue ?? 0) + blue, green: (keys.green ?? 0) + green },
    add: { white, blue, green },
  };
}

/**
 * One carriage tick: advance the journey clock and pay whatever is newly owed.
 * Granted counts what the ride has settled, pocketed or not, so nothing pays twice.
 */
export function settleRide(j: Journey, keys: Record<Tier, number>, now: number, watching: boolean) {
  const last = j.lastTickAt ?? j.departAt;
  const clipped = Math.min(now, j.arriveAt);
  const dt = Math.max(0, clipped - last);
  const openMs = (j.openMs ?? 0) + (watching ? dt : 0);
  const wallMs = Math.max(0, clipped - j.departAt);
  const rideMs = Math.max(0, j.arriveAt - j.departAt);
  const due = transitLoot(wallMs, openMs, rideMs, journeyOutcome(j));
  const have = { white: j.grantedWhite ?? 0, blue: j.grantedBlue ?? 0, green: j.grantedGreen ?? 0 };
  const owe = {
    white: Math.max(0, due.white - have.white),
    blue: Math.max(0, due.blue - have.blue),
    green: Math.max(0, due.green - have.green),
  };
  const paid = pocketRide(keys, owe);
  const journey: Journey = {
    ...j,
    openMs,
    lastTickAt: clipped,
    grantedWhite: have.white + owe.white,
    grantedBlue: have.blue + owe.blue,
    grantedGreen: have.green + owe.green,
  };
  return { journey, keys: paid.keys, add: paid.add, arrived: now >= j.arriveAt };
}
