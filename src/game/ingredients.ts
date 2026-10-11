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
  | "cedar"
  | "silver"
  | "string"
  | "granite"
  | "limestone"
  | "creekstone"
  | "ticker"
  | "cable"
  | "salt"
  | "bulb"
  | PaintId;

export type Ingredient = {
  id: IngredientId;
  name: string;
  blurb: string;
  cityId?: CityId;
};

/** Vault paint. Six colours drop only from a vault of that colour. Prism can drop from any colour. */
export const VAULT_PAINTS = ["white", "blue", "green", "amber", "red", "violet"] as const;
export type VaultPaint = (typeof VAULT_PAINTS)[number];
/** One can, from any vault, about 1 in 10,000 clears. */
export const ULTRA_PAINT = "prism" as const;
export const ULTRA_DROP_IN = 10_000;
export const PAINT_COLORS = [...VAULT_PAINTS, ULTRA_PAINT] as const;
export type PaintColor = (typeof PAINT_COLORS)[number];
export type PaintId = `paint-${PaintColor}`;

/**
 * How many vaults of this colour it takes, on average, to drop one can.
 * White is commonplace. Each step after it is much rarer than the one before,
 * and red and violet are the cans you almost never see.
 * Prism is not in this table — any colour can drop it, at ULTRA_DROP_IN.
 */
export const PAINT_DROP_IN: Record<VaultPaint, number> = {
  white: 2,
  blue: 5,
  green: 15,
  amber: 45,
  red: 150,
  violet: 500,
};

export function paintId(color: PaintColor): PaintId {
  return `paint-${color}`;
}

export function isPaintId(id: string): id is PaintId {
  return id.startsWith("paint-") && (PAINT_COLORS as readonly string[]).includes(id.slice(6));
}

const PAINT_NAME: Record<PaintColor, string> = {
  white: "White paint",
  blue: "Blue paint",
  green: "Green paint",
  amber: "Amber paint",
  red: "Red paint",
  violet: "Violet paint",
  prism: "Prism paint",
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
  cedar: { id: "cedar", name: "Cedar", cityId: "seattle", blurb: "Seattle press stock. Green vaults and up." },
  silver: { id: "silver", name: "Silver", cityId: "denver", blurb: "Denver press stock. Green vaults and up." },
  string: { id: "string", name: "Fiddle string", cityId: "nashville", blurb: "Nashville press stock. Green vaults and up." },
  granite: { id: "granite", name: "Pink granite", cityId: "austin", blurb: "Capitol ward. Amber vaults and up." },
  limestone: { id: "limestone", name: "Limestone", cityId: "austin", blurb: "Barton Springs. Amber vaults and up." },
  creekstone: { id: "creekstone", name: "Creek stone", cityId: "temple", blurb: "Miller Springs. Amber vaults and up." },
  ticker: { id: "ticker", name: "Ticker tape", cityId: "nyc", blurb: "The Exchange. Amber vaults and up." },
  cable: { id: "cable", name: "Bridge cable", cityId: "nyc", blurb: "Brooklyn Bridge. Amber vaults and up." },
  salt: { id: "salt", name: "Bay salt", cityId: "sf", blurb: "The Ferry Building. Amber vaults and up." },
  bulb: { id: "bulb", name: "Sign bulb", cityId: "nyc", blurb: "Times Square. Amber vaults and up." },
  "paint-white": { id: "paint-white", name: PAINT_NAME.white, blurb: `About 1 in ${PAINT_DROP_IN.white} white vaults.` },
  "paint-blue": { id: "paint-blue", name: PAINT_NAME.blue, blurb: `About 1 in ${PAINT_DROP_IN.blue} blue vaults.` },
  "paint-green": { id: "paint-green", name: PAINT_NAME.green, blurb: `About 1 in ${PAINT_DROP_IN.green} green vaults.` },
  "paint-amber": { id: "paint-amber", name: PAINT_NAME.amber, blurb: `About 1 in ${PAINT_DROP_IN.amber} amber vaults.` },
  "paint-red": { id: "paint-red", name: PAINT_NAME.red, blurb: `About 1 in ${PAINT_DROP_IN.red} red vaults.` },
  "paint-violet": { id: "paint-violet", name: PAINT_NAME.violet, blurb: `About 1 in ${PAINT_DROP_IN.violet} violet vaults.` },
  "paint-prism": { id: "paint-prism", name: PAINT_NAME.prism, blurb: `About 1 in ${ULTRA_DROP_IN.toLocaleString()} vaults, any colour.` },
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
  seattle: "cedar",
  denver: "silver",
  nashville: "string",
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

export function isNamedWard(poiId: string): boolean {
  return poiId in AREA;
}

export function cityHasWard(cityId: CityId): boolean {
  return Object.values(AREA).some((id) => INGREDIENTS[id].cityId === cityId);
}

/** A can of the vault's own colour, or nothing. `roll` is 0–1; below 1/N hits. */
export function rollPaint(tier: Tier, roll = Math.random()): PaintId | null {
  const n = PAINT_DROP_IN[tier];
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1 / n) return null;
  return paintId(tier);
}

/** Prism. Any vault, about 1 in 10,000. Independent of the colour can. */
export function rollUltraPaint(roll = Math.random()): PaintId | null {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1 / ULTRA_DROP_IN) return null;
  return paintId(ULTRA_PAINT);
}

/**
 * What this clear dropped. The colour can and prism are separate rolls,
 * so a vault can drop both — the colour of the lamp, and the ultra can.
 */
export function rollVaultPaints(tier: Tier, colorRoll = Math.random(), ultraRoll = Math.random()): PaintId[] {
  const hits: PaintId[] = [];
  const color = rollPaint(tier, colorRoll);
  const ultra = rollUltraPaint(ultraRoll);
  if (color) hits.push(color);
  if (ultra) hits.push(ultra);
  return hits;
}

/** Toast line. Red and violet say Rare. Prism says Ultra rare. */
export function paintFoundLine(id: PaintId): string {
  const color = id.slice(6) as PaintColor;
  const name = INGREDIENTS[id].name;
  if (color === "prism") return `${name}. Ultra rare.`;
  return color === "red" || color === "violet" ? `${name}. Rare.` : `${name}.`;
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
