import type { CityId, Tier } from "./types";

/** City and ward stock the press can spend. Brass, ink, vellum, and schematics stay the common pile. */
export type IngredientId =
  | "pecan"
  | "cotton"
  | "newsprint"
  | "fogglass"
  | "soot"
  | "steel"
  | "chrome"
  | "copper"
  | "maple"
  | "film"
  | "brick"
  | "cypress"
  | "granite"
  | "limestone"
  | "creekstone"
  | "ticker"
  | "cable"
  | "salt"
  | "bulb";

export type Ingredient = {
  id: IngredientId;
  name: string;
  blurb: string;
  cityId?: CityId;
};

export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  pecan: { id: "pecan", name: "Pecan", cityId: "austin", blurb: "Austin press stock. Green vaults and up." },
  cotton: { id: "cotton", name: "Cotton", cityId: "temple", blurb: "Temple press stock. Green vaults and up." },
  newsprint: { id: "newsprint", name: "Newsprint", cityId: "nyc", blurb: "New York press stock. Green vaults and up." },
  fogglass: { id: "fogglass", name: "Fog glass", cityId: "sf", blurb: "San Francisco press stock. Green vaults and up." },
  soot: { id: "soot", name: "Soot", cityId: "london", blurb: "London press stock. Green vaults and up." },
  steel: { id: "steel", name: "Steel", cityId: "chicago", blurb: "Chicago press stock. Green vaults and up." },
  chrome: { id: "chrome", name: "Chrome", cityId: "detroit", blurb: "Detroit press stock. Green vaults and up." },
  copper: { id: "copper", name: "Copper", cityId: "tucson", blurb: "Tucson press stock. Green vaults and up." },
  maple: { id: "maple", name: "Maple", cityId: "toronto", blurb: "Toronto press stock. Green vaults and up." },
  film: { id: "film", name: "Film", cityId: "la", blurb: "Los Angeles press stock. Green vaults and up." },
  brick: { id: "brick", name: "Brick", cityId: "boston", blurb: "Boston press stock. Green vaults and up." },
  cypress: { id: "cypress", name: "Cypress", cityId: "nola", blurb: "New Orleans press stock. Green vaults and up." },
  granite: { id: "granite", name: "Pink granite", cityId: "austin", blurb: "Capitol ward. Amber vaults and up." },
  limestone: { id: "limestone", name: "Limestone", cityId: "austin", blurb: "Barton Springs. Amber vaults and up." },
  creekstone: { id: "creekstone", name: "Creek stone", cityId: "temple", blurb: "Miller Springs. Amber vaults and up." },
  ticker: { id: "ticker", name: "Ticker tape", cityId: "nyc", blurb: "The Exchange. Amber vaults and up." },
  cable: { id: "cable", name: "Bridge cable", cityId: "nyc", blurb: "Brooklyn Bridge. Amber vaults and up." },
  salt: { id: "salt", name: "Bay salt", cityId: "sf", blurb: "The Ferry Building. Amber vaults and up." },
  bulb: { id: "bulb", name: "Sign bulb", cityId: "nyc", blurb: "Times Square. Amber vaults and up." },
};

const CITY_STAPLE: Record<CityId, IngredientId> = {
  austin: "pecan",
  temple: "cotton",
  nyc: "newsprint",
  sf: "fogglass",
  london: "soot",
  chicago: "steel",
  detroit: "chrome",
  tucson: "copper",
  toronto: "maple",
  la: "film",
  boston: "brick",
  nola: "cypress",
};

/** Named wards. Only amber, red, and violet vaults drop these. */
const AREA: Record<string, IngredientId> = {
  "tx-capitol": "granite",
  "barton-springs": "limestone",
  "miller-springs": "creekstone",
  nyse: "ticker",
  "brooklyn-br": "cable",
  "times-sq": "bulb",
  "ferry-bldg": "salt",
};

const PRESS_TIERS: Tier[] = ["green", "amber", "red", "violet"];
const AREA_TIERS: Tier[] = ["amber", "red", "violet"];

export function cityStaple(cityId: CityId): IngredientId {
  return CITY_STAPLE[cityId];
}

/** One press ingredient, or null on white and blue (those already pay brass and ink). */
export function rollIngredient(cityId: CityId, poi: { id: string; tier: Tier }): IngredientId | null {
  if (!PRESS_TIERS.includes(poi.tier)) return null;
  const area = AREA[poi.id];
  if (area && AREA_TIERS.includes(poi.tier)) return area;
  return CITY_STAPLE[cityId];
}

export function ingredientName(id: IngredientId): string {
  return INGREDIENTS[id].name;
}

/** City staple first, then a ward cut from the same city. */
export function spendIngredient(cityId: CityId, pantry: Partial<Record<IngredientId, number>>): IngredientId | null {
  const staple = CITY_STAPLE[cityId];
  if ((pantry[staple] ?? 0) > 0) return staple;
  for (const id of Object.keys(AREA) as string[]) {
    const ing = AREA[id]!;
    if (INGREDIENTS[ing].cityId === cityId && (pantry[ing] ?? 0) > 0) return ing;
  }
  return null;
}

export function addIngredient(
  pantry: Partial<Record<IngredientId, number>>,
  id: IngredientId,
): Partial<Record<IngredientId, number>> {
  return { ...pantry, [id]: (pantry[id] ?? 0) + 1 };
}
