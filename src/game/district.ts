/**
 * 0.1.14: "New district" bonus. The city is cut into 800 m squares around its spawn. The first right lamp in a
 * square you have not lit today (city-local day) pays +25% of that lamp's base coin, for up to 6 squares a day
 * per city. Not on a night-market lamp (the market already pays double, and this must never reward camping
 * there). The server decides it from its own grade rows; the client only shows the label.
 */
import { CITIES } from "./data.ts";
import type { CityId } from "./types.ts";

export const DISTRICT_M = 800;
export const FRESH_DISTRICT_BONUS = 0.25;
export const FRESH_DISTRICT_DAY_CAP = 6;
export const FRESH_DISTRICT_TAG = "New district";

const M_PER_DEG_LAT = 111_320;

/** Square id like "2:-1" (north, east) from the city spawn. "" when the point is unusable. */
export function districtOf(city: CityId, lat: number, lng: number): string {
  const c = CITIES[city];
  if (!c || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return "";
  const n = (lat - c.spawn.lat) * M_PER_DEG_LAT;
  const e = (lng - c.spawn.lng) * M_PER_DEG_LAT * Math.cos((c.spawn.lat * Math.PI) / 180);
  return `${Math.floor(n / DISTRICT_M + 0.5)}:${Math.floor(e / DISTRICT_M + 0.5)}`;
}

/** Fresh = a real square, not lit yet today, and today's fresh count still under the cap. */
export function isFreshDistrict(d: string, litToday: Iterable<string>): boolean {
  if (!d) return false;
  const seen = new Set(litToday);
  return !seen.has(d) && seen.size < FRESH_DISTRICT_DAY_CAP;
}

export function freshDistrictCoin(lampCoin: number): number {
  return Math.max(1, Math.round(lampCoin * FRESH_DISTRICT_BONUS));
}

/** District ids of today's right lamps, read from grade ledger details (`"d":"x:y"`, written from 0.1.14). */
export function districtsInDetails(details: string[]): string[] {
  const out: string[] = [];
  for (const raw of details) {
    if (raw.includes('"g":"miss"')) continue;
    const m = /"d":"(-?\d+:-?\d+)"/.exec(raw);
    if (m) out.push(m[1]!);
  }
  return out;
}
