import { CITIES, CITY_LIST } from "./data.ts";
import { distM } from "./geo.ts";
import { IDLE, journeyOutcome, RIDE_BONUS_WHITE, rideReward, type RideOutcome } from "./rideGames.ts";
import type { City, CityId, Journey, Poi, Tier } from "./types";

export const VAULTS_PER_FARE = 3;
export const FARES_CAP = 2;
/** 0.0.97: every pocket holds 30 (0.0.96 was white 6, blue 6, green 2, amber/red/violet 150). Overflow merges 3→1 up (goals.ts settlePocket). */
export const WHITE_POCKET = 30;
export const BLUE_POCKET = 30;
export const GREEN_POCKET = 30;
/**
 * Ride grants alone may fill whites this far, so a 14-minute win lands whole.
 * Every other source still stops at WHITE_POCKET.
 */
/** 0.0.97: no ride special case; rides use the same 30 pocket (and overflow merges like everything else). */
export const RIDE_WHITE_POCKET = WHITE_POCKET;
export const SPARK_DAY = 6;
/** Longest train. Coast-to-coast and overseas sit on this; nearer wards stay on the distance line.
 *  0.0.94: 8 min (was 11) and a gentler distance line, so most rides land around 6-8 min. */
export const FARE_MAX_MS = 5 * 60_000; // 0.1.2: 5 min (was 8)
/** 0.0.94: the long-haul blue (and the sat-it-out green) now come at 7 min (was 10, unreachable once rides cap at 8). */
export const HAUL_MS = 7 * 37_500; // 0.1.2: 7 old minutes × 5/8 (4 min 22.5 s), scaled with the 5-min cap
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

/**
 * 0.1.19: the server's own spark gate. A spark (a lamp answered with no match of its colour) pays that colour, so
 * the six-a-day / once-per-lamp rule can't live only in the device save. `details` are today's spark grade rows
 * (ledger detail JSON carrying "sp":1 and "pi"). False = this spark pays nothing.
 */
/** 0.1.19 (Ryan): violet lamps never spark, on the device or the server. */
export function sparkTier(tier: string): boolean {
  return tier !== "violet";
}

export function sparkAllowed(details: readonly string[], poiId: string): boolean {
  let n = 0;
  for (const d of details) {
    if (!d.includes('"sp":1')) continue;
    n++;
    if (d.includes(`"pi":${JSON.stringify(poiId)}`)) return false;
  }
  return n < SPARK_DAY;
}

export const HIGH_POCKET = 30;

export function matchCap(tier: import("./types").Tier) {
  if (tier === "white") return WHITE_POCKET;
  if (tier === "blue") return BLUE_POCKET;
  if (tier === "green") return GREEN_POCKET;
  return HIGH_POCKET;
}

/** How many more lamps this city wants before it prints a train ticket. */
export function lampsToTicket(cityVaults: number) {
  return Math.max(1, VAULTS_PER_FARE - Math.max(0, cityVaults));
}

/** "Light 2 more lamps to earn a train ticket" — the empty-pocket hint. */
export function ticketHint(cityVaults: number) {
  const n = lampsToTicket(cityVaults);
  return `Light ${n} more lamp${n === 1 ? "" : "s"} to earn a train ticket`;
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
  // 0.1.2: the 0.0.94 line scaled by 5/8 (min 30 s), so near wards stay short and only far ones hit the cap.
  return Math.round(Math.min(FARE_MAX_MS, Math.max(HURRY_MIN_RIDE_MS, 25_000 + km * 106)));
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
 * 7+ min (HAUL_MS) is a blue; sitting the whole haul with the tab open is a green.
 */
/** 0.1.2 Hurry up: a ride never lasts less than this in total. */
export const HURRY_MIN_RIDE_MS = 30_000;
/** Coin per minute skipped (a started minute counts whole). */
export const HURRY_COIN_PER_MIN = 25;
export function hurryCost(skipMs: number): number {
  return Math.max(0, Math.ceil(Math.max(0, skipMs) / 60_000)) * HURRY_COIN_PER_MIN;
}
/** New arrival after skipping `min` minutes: never under the 30 s floor, never before now. Null when nothing is left to skip. */
export function hurryTarget(departAt: number, arriveAt: number, now: number, min: number): number | null {
  const want = arriveAt - Math.max(1, Math.floor(min)) * 60_000;
  const t = Math.max(want, departAt + HURRY_MIN_RIDE_MS, now + 1_000);
  return t < arriveAt - 1_000 ? t : null;
}

/**
 * 0.1.2: pay for a hurried ride. Seat pay (idle whites, the long-haul blue, the sat-it-out green) is worked out on the
 * full booked ride; the ride-game part on top only counts the ride actually sat, so skipping forfeits the game bonus
 * for the skipped stretch. Unhurried rides (fullMs <= rideMs) pay exactly as transitLoot.
 */
export function hurriedLoot(wallMs: number, openMs: number, rideMs: number, fullMs: number, outcome: RideOutcome = IDLE) {
  if (!(fullMs > rideMs)) return transitLoot(wallMs, openMs, rideMs, outcome);
  const arrived = wallMs >= rideMs;
  const k = fullMs / Math.max(1, rideMs);
  const seat = transitLoot(arrived ? fullMs : wallMs, Math.min(fullMs, openMs * k), fullMs, IDLE);
  const real = transitLoot(wallMs, openMs, rideMs, outcome);
  const realIdle = transitLoot(wallMs, openMs, rideMs, IDLE);
  return {
    white: seat.white + Math.max(0, real.white - realIdle.white),
    blue: seat.blue + Math.max(0, real.blue - realIdle.blue),
    green: seat.green,
  };
}

export function transitLoot(wallMs: number, openMs: number, rideMs = wallMs, outcome: RideOutcome = IDLE) {
  const pay = rideReward(rideMs, outcome);
  const started = wallMs >= 12_000 || outcome.kind !== "idle";
  const ten = HAUL_MS;
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
  // 0.0.97: everything owed lands; overflow becomes credits in settlePocket (no ride special pocket).
  const add = { white: Math.max(0, owe.white), blue: Math.max(0, owe.blue), green: Math.max(0, owe.green) };
  return {
    keys: { ...keys, white: (keys.white ?? 0) + add.white, blue: (keys.blue ?? 0) + add.blue, green: (keys.green ?? 0) + add.green },
    add,
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
  const due0 = hurriedLoot(wallMs, openMs, rideMs, j.fullMs ?? rideMs, journeyOutcome(j));
  const due = { ...due0, white: due0.white + (j.bonusWon ? RIDE_BONUS_WHITE : 0) };
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
