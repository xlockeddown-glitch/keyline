/**
 * 0.1.8 car dealerships. A car is your own cab: same CAB button, same drive graph, same "park at the curb, the door
 * is on foot" rule — so lamps, walk routes, vault rests, the market and train fares are untouched. Owning one:
 *  - it waits at the nearest curb when you tap CAB (no cab driving over to fetch you), and
 *  - it drives a little faster than the city cab (pace below multiplies cabSpeed while you sit in it).
 * Bought once with coin at a dealership (one real car lot per city); the server keeps ownership in its ledger
 * (car:<id>) and checks the price, like market lights. No new table.
 */
import { distM } from "./geo.ts";
import type { CityId } from "./types";

export type CarId = "civic" | "f150" | "ioniq5" | "mustang" | "belair57" | "model3" | "roadster" | "roadster2";

export type Car = { id: CarId; name: string; year: string; blurb: string; price: number; pace: number; star?: boolean };

export const CARS: readonly Car[] = [
  { id: "civic", name: "Used Honda Civic Hatchback", year: "2017", blurb: "Dented, reliable, always starts.", price: 30_000, pace: 1.05 },
  { id: "f150", name: "Ford F-150", year: "2026", blurb: "A pickup with room for the crates.", price: 50_000, pace: 1.08 },
  { id: "ioniq5", name: "Hyundai Ioniq 5", year: "2025", blurb: "Pixel lights, and it powers the lamps.", price: 90_000, pace: 1.1 },
  { id: "mustang", name: "Shelby GT500", year: "2020", blurb: "760 hp, silver, striped.", price: 150_000, pace: 1.15 },
  { id: "belair57", name: "Chevrolet Bel Air Convertible", year: "1957", blurb: "Top down, tank full, nowhere to be.", price: 200_000, pace: 1.17 },
  { id: "model3", name: "Tesla Model 3", year: "Highland", blurb: "No grille, one screen, Autopilot.", price: 350_000, pace: 1.2 },
  { id: "roadster", name: "Tesla Roadster", year: "2008", blurb: "The original electric roadster.", price: 600_000, pace: 1.22 },
  { id: "roadster2", name: "Tesla Roadster 2.0", year: "Next-gen", blurb: "The fastest thing in Keyline.", price: 2_400_000, pace: 1.3, star: true },
];

export function carOf(id: string | null | undefined): Car | null {
  return CARS.find((c) => c.id === id) ?? null;
}

/** How much faster than the city cab this car drives (1 with no car). */
export function carPace(id: string | null | undefined): number {
  return carOf(id)?.pace ?? 1;
}

/**
 * 0.1.31: the car you drive. A bought car is yours in every city and session: with no car picked (a new device, a
 * cleared save, or another tab writing back an old save) you drive the fastest one you own, unless you chose the cab.
 */
export function driveOf(owned: CarId[], on: CarId | null, cab: boolean): CarId | null {
  if (on && owned.includes(on)) return on;
  if (cab || !owned.length) return null;
  return [...owned].sort((a, b) => carPace(b) - carPace(a))[0];
}

/** "+15%" for the showroom. */
export function carBoost(c: Car): string {
  return `+${Math.round((c.pace - 1) * 100)}%`;
}

export function isCarId(x: unknown): x is CarId {
  return typeof x === "string" && CARS.some((c) => c.id === x);
}

export type Dealer = { city: CityId; name: string; lat: number; lng: number };

/**
 * One real car lot per city (OpenStreetMap shop=car, the nearest to the city start that sells cars). Downtowns
 * rarely have one inside 1 km, so a few sit 1.5–3 km out — a cab ride, which is the point. GameMap snaps the
 * door onto the walk and loads streets out to it; qa:stands checks the walk reaches each one.
 */
export const DEALERS: Record<CityId, Dealer> = {
  austin: { city: "austin", name: "Rivian Austin", lat: 30.259719, lng: -97.74619 },
  temple: { city: "temple", name: "Temple Auto Depot", lat: 31.090735, lng: -97.370238 },
  nyc: { city: "nyc", name: "Audi Manhattan", lat: 40.755224, lng: -73.97568 },
  sf: { city: "sf", name: "Mini of San Francisco", lat: 37.780226, lng: -122.409087 },
  london: { city: "london", name: "MG Motor UK", lat: 51.508723, lng: -0.138438 },
  chicago: { city: "chicago", name: "Porsche Downtown Chicago", lat: 41.880719, lng: -87.642324 },
  detroit: { city: "detroit", name: "Bob Maxey Ford", lat: 42.334804, lng: -83.029577 },
  tucson: { city: "tucson", name: "Wanslee Auto", lat: 32.212659, lng: -110.968165 },
  toronto: { city: "toronto", name: "Volkswagen Downtown Toronto", lat: 43.653306, lng: -79.364594 },
  la: { city: "la", name: "Honda of Downtown LA", lat: 34.03768, lng: -118.26948 },
  boston: { city: "boston", name: "Tesla Boston", lat: 42.348255, lng: -71.082864 },
  nola: { city: "nola", name: "Del Cid Auto Sales", lat: 29.970598, lng: -90.08223 },
  seattle: { city: "seattle", name: "Ferrari and Maserati of Seattle", lat: 47.613157, lng: -122.317074 },
  denver: { city: "denver", name: "Worldwide Autosport", lat: 39.731943, lng: -104.99931 },
  nashville: { city: "nashville", name: "Rivian Nashville", lat: 36.151863, lng: -86.781321 },
};

/** Close enough, on foot, to walk into the showroom. */
export const DEALER_REACH_M = 40;
/** 0.1.12: what a tap on the lot sign does — open the showroom at the door, else walk there (in a cab: get out first). */
export function dealerTap(distanceM: number, seated: boolean): "open" | "walk" | "seated" {
  if (seated) return "seated";
  return distanceM <= DEALER_REACH_M ? "open" : "walk";
}

export function dealerOf(city: CityId): Dealer {
  return DEALERS[city];
}

export function atDealer(city: CityId, lat: number, lng: number, door?: { lat: number; lng: number } | null): boolean {
  const d = door ?? DEALERS[city];
  return distM(lat, lng, d.lat, d.lng) <= DEALER_REACH_M;
}
