/**
 * 0.1.70 Airports: far trips (over about 1,000 miles) can fly. Takeoff, a window view with a Geography
 * card, and a souvenir from the destination on landing. Pure helpers shared by the store, the server
 * wallet op (`fly`, like the Loop's `loop`) and the cutscene. Souvenirs are ledger rows `souvenir:<city>`.
 */
import { CITIES } from "./data.ts";
import type { CityId } from "./types.ts";

export const FLIGHT_MIN_MILES = 1000;
/** Cutscene beats (ms). The window view waits for the Geography card, up to WINDOW_MAX_MS. */
export const TAKEOFF_MS = 2600;
export const WINDOW_MAX_MS = 16000;
export const LANDING_MS = 2200;
export const FLIGHT_FADE_MS = 600;

/** Great-circle miles between two cities' spawn points. */
export function milesBetween(from: CityId, to: CityId): number {
  const a = CITIES[from]?.spawn, b = CITIES[to]?.spawn;
  if (!a || !b) return 0;
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function canFly(from: CityId, to: CityId): boolean {
  return from !== to && milesBetween(from, to) > FLIGHT_MIN_MILES;
}

/** One small keepsake per destination city. */
export const SOUVENIRS: Record<CityId, string> = {
  austin: "Bat-bridge postcard",
  temple: "Railroad museum pin",
  nyc: "Yellow-cab keychain",
  sf: "Cable-car bell magnet",
  london: "Red phone-box tin",
  chicago: "Skyline snow globe",
  detroit: "Motor City pennant",
  tucson: "Saguaro postcard",
  toronto: "Streetcar token",
  la: "Palm-tree postcard",
  boston: "Lighthouse pin",
  nola: "Second-line feather",
  seattle: "Ferry ticket stub",
  denver: "Mile-high marker pin",
  nashville: "Guitar-pick keychain",
};

export function souvenirKey(to: CityId): string {
  return `souvenir:${to}`;
}

export function addSouvenir(list: readonly string[], key: string): string[] {
  return list.includes(key) ? [...list] : [...list, key];
}

export function cleanSouvenirs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === "string" && /^souvenir:[a-z0-9_]+$/.test(x) && x.slice(9) in CITIES))];
}

/** Every route that can fly, for docs and tests. */
export function flightRoutes(): { from: CityId; to: CityId; miles: number }[] {
  const ids = Object.keys(CITIES) as CityId[];
  const out: { from: CityId; to: CityId; miles: number }[] = [];
  for (const from of ids) for (const to of ids) if (canFly(from, to)) out.push({ from, to, miles: Math.round(milesBetween(from, to)) });
  return out;
}
