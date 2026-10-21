/**
 * 0.1.12 houses (design: docs/design/houses.md). A house is one door in one city: four tiers, bought in any order,
 * a step-up costs the difference. After three lamps lit in that city today, turning the key hangs the tier's match on
 * the hook, once per city per local day. It pays no coin.
 * Server ledger only, like cars — no new table:
 *   house:<city>:<tier>     a buy or step-up (detail { city, tier, from })
 *   hook:<city>:<local day> the city's match (detail { city, match })
 * Later (not v1): interiors decorated with trivia items. A house is `HouseState` so items can ride along without a
 * change of shape; they would be their own ledger rows (e.g. decor:<city>:<item>).
 */
import { distM } from "./geo.ts";
import type { CityId, Tier } from "./types";

export type HouseTier = "cottage" | "row" | "town" | "villa";

export type HouseDef = { id: HouseTier; name: string; blurb: string; price: number; match: Tier; star?: boolean };

export const HOUSES: readonly HouseDef[] = [
  { id: "cottage", name: "Lamp cottage", blurb: "Old brick, a green door, one brass lantern.", price: 40_000, match: "white" },
  { id: "row", name: "Row house", blurb: "A sooty terrace with an iron stoop.", price: 130_000, match: "blue" },
  { id: "town", name: "Townhouse", blurb: "Three floors of limestone and ivy.", price: 300_000, match: "green" },
  { id: "villa", name: "Villa", blurb: "Sand stucco, a gravel drive, amber in the glass.", price: 1_200_000, match: "amber", star: true },
];

/** What the account holds in one city. `items` is room for later (interior decor); v1 never sets it. */
export type HouseState = { tier: HouseTier; items?: string[] };

export function houseOf(id: unknown): HouseDef | null {
  return HOUSES.find((h) => h.id === id) ?? null;
}

export function isHouseTier(x: unknown): x is HouseTier {
  return houseOf(x) !== null;
}

export function houseRank(t: HouseTier | null | undefined): number {
  return t ? HOUSES.findIndex((h) => h.id === t) : -1;
}

/** Coin to go from `owned` (null = none) to `tier`; null when that is not a step up. */
export function houseCost(owned: HouseTier | null | undefined, tier: HouseTier): number | null {
  if (houseRank(tier) <= houseRank(owned)) return null;
  return houseOf(tier)!.price - (owned ? houseOf(owned)!.price : 0);
}

/** Correct lamps (any lamp in the city, market lanterns too) needed today before the key turns. */
export const HOME_LAMPS = 3;
export const HOUSE_REACH_M = 40;

export type HouseLot = { city: CityId; name: string; lat: number; lng: number };

/**
 * One lot per city: the nearest estate agent (OSM office/shop=estate_agent) within about 800 m of spawn. Where none
 * qualified, a fixed point near spawn; either way the client snaps the door onto the walk.
 */
// Fixed fallback lots ~165 m north of spawn (Overpass unreachable at build time);
// street names reverse-geocoded from OSM Nominatim. Chicago, Boston and Seattle sit on the
// nearest normal street to spawn (their north points landed on pedestrian-only ways).
export const HOUSE_LOTS: Record<CityId, HouseLot> = {
  austin: { city: "austin", name: "West 3rd Street", lat: 30.2668, lng: -97.7487 },
  temple: { city: "temple", name: "South 7th Street", lat: 31.0972, lng: -97.3452 },
  nyc: { city: "nyc", name: "West 47th Street", lat: 40.7595, lng: -73.9855 },
  sf: { city: "sf", name: "Gold Street", lat: 37.7967, lng: -122.4028 },
  london: { city: "london", name: "Charing Cross Road", lat: 51.5095, lng: -0.1281 },
  chicago: { city: "chicago", name: "North Michigan Avenue", lat: 41.8827, lng: -87.6245 },
  detroit: { city: "detroit", name: "Farmer Street", lat: 42.3329, lng: -83.0466 },
  tucson: { city: "tucson", name: "East Pennington Street", lat: 32.2234, lng: -110.969 },
  toronto: { city: "toronto", name: "Bay Street", lat: 43.6547, lng: -79.3832 },
  la: { city: "la", name: "West Temple Street", lat: 34.0551, lng: -118.2427 },
  boston: { city: "boston", name: "Tremont Street", lat: 42.3545, lng: -71.0637 },
  nola: { city: "nola", name: "Dumaine Street", lat: 29.9591, lng: -90.063 },
  seattle: { city: "seattle", name: "3rd Avenue", lat: 47.6096, lng: -122.3377 },
  denver: { city: "denver", name: "17th Street", lat: 39.7491, lng: -104.9946 },
  nashville: { city: "nashville", name: "4th Avenue North", lat: 36.1622, lng: -86.7779 },
};

export function lotOf(city: CityId): HouseLot {
  return HOUSE_LOTS[city];
}

export function atLot(city: CityId, lat: number, lng: number, door?: { lat: number; lng: number } | null): boolean {
  const d = door ?? HOUSE_LOTS[city];
  return distM(lat, lng, d.lat, d.lng) <= HOUSE_REACH_M;
}

export const houseArt = (t: HouseTier) => `/houses/${t}.webp`;
export const housePin = (t: HouseTier) => `/houses/${t}-pin.webp`;
/** The map cutout (transparent) and its rough frontage in metres, so the house draws at building scale. */
export const houseMapArt = (t: HouseTier) => `/houses/${t}-map.webp`;
export const HOUSE_METERS: Record<HouseTier, number> = { cottage: 11, row: 8, town: 12, villa: 26 };
