export type Tier = "white" | "blue" | "green" | "amber" | "red" | "violet";

export type PoiKind =
  | "landmark"
  | "museum"
  | "park"
  | "library"
  | "theatre"
  | "stadium"
  | "food"
  | "civic"
  | "station"
  | "campus"
  | "water"
  | "shop";

export type CityId = "austin" | "temple" | "nyc" | "sf" | "london" | "chicago" | "detroit" | "tucson" | "toronto" | "la" | "boston" | "nola";

export type TriviaCat = "sports" | "local" | "political" | "food" | "arts" | "math" | "science" | "history" | "nature";

export type TriviaDiff = 1 | 2 | 3;

/** Draft plate (POI door quizzes). `q()` / `sealPlate` fill id, diff, rarity. */
export type TriviaSeed = {
  q: string;
  choices: [string, string, string, string];
  answer: string;
  fact?: string;
  diff?: TriviaDiff;
  id?: string;
  rarity?: Tier;
};

export type TriviaQ = {
  q: string;
  choices: [string, string, string, string];
  answer: string;
  fact?: string;
  diff: TriviaDiff;
  id: string;
  rarity: Tier;
};

export type PlaceTopic =
  | "defense"
  | "aerospace"
  | "art"
  | "history"
  | "natural-history"
  | "science"
  | "library"
  | "campus"
  | "medicine"
  | "food"
  | "bbq"
  | "sports"
  | "football"
  | "baseball"
  | "basketball"
  | "theatre"
  | "music"
  | "civic"
  | "capitol"
  | "park"
  | "nature"
  | "water"
  | "zoo"
  | "rail"
  | "airport"
  | "finance"
  | "memorial"
  | "church"
  | "hotel"
  | "bridge"
  | "market";

export type Poi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: PoiKind;
  tier: Tier;
  lore: string;
  quiz?: TriviaSeed;
  quizzes?: TriviaSeed[];
  printShop?: boolean;
};

export type City = {
  id: CityId;
  name: string;
  region: string;
  blurb: string;
  spawn: { lat: number; lng: number };
  pois: Poi[];
};

export type VaultRuntime = {
  state: "locked" | "cooling";
  coolUntil: number;
};

export type MapKey = {
  id: string;
  lat: number;
  lng: number;
  tier: Tier;
};

export type CharmId = "scholar" | "sprinter" | "lantern" | "lucky";

export type ScoutId = "raccoon" | "cat" | "turtle" | "owl" | "corgi" | "sloth" | "fox" | "lynx";

export type ScoutPerk = {
  label: string;
  vaultMs?: number;
  loot?: number;
  reach?: number;
  stamina?: number;
  pace?: number;
};

export type LootDrop = {
  points: number;
  grade: "perfect" | "great" | "good";
  diff: TriviaDiff;
  keys: Partial<Record<Tier, number>>;
  brass: number;
  ink: number;
  vellum: number;
  schematic: boolean;
};

export type MissFlash = {
  answer: string;
  fact?: string;
};

export type StreetRun = {
  lat: number;
  lng: number;
  readyAt: number;
};

export type Screen = "title" | "cities" | "play" | "ride";

export type Journey = {
  from: CityId;
  to: CityId;
  departAt: number;
  arriveAt: number;
  /** Time the ride screen was actually visible. */
  openMs?: number;
  lastTickAt?: number;
  grantedWhite?: number;
  grantedBlue?: number;
  grantedGreen?: number;
};
