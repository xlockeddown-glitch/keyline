import type { RideGameMark } from "./rideGames.ts";

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

export type CityId = "austin" | "temple" | "nyc" | "sf" | "london" | "chicago" | "detroit" | "tucson" | "toronto" | "la" | "boston" | "nola" | "seattle" | "denver" | "nashville";

export type TriviaCat = "sports" | "local" | "political" | "food" | "arts" | "math" | "science" | "history" | "nature" | "games" | "celebrity";

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
  /** Keep out of Where am I? (clue and decoy): unverified or game-made marks. */
  noClue?: boolean;
};

export type City = {
  id: CityId;
  name: string;
  region: string;
  blurb: string;
  spawn: { lat: number; lng: number };
  /** 0.0.52: where a new walk starts when it isn't the spawn anchor (spawn still seeds the Daily Lantern Run, night-market and street bakes). */
  start?: { lat: number; lng: number };
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

/** `lynx` is the Super Legendary slot. Since 0.0.49 it is drawn and named as the Penguin; the id stays so owned
 *  hires, worn scouts and print-shop coats in existing saves carry over unchanged. */
export type ScoutId = "raccoon" | "cat" | "turtle" | "owl" | "corgi" | "sloth" | "fox" | "lynx" | "giraffe";

export type ScoutPerk = {
  label: string;
  vaultMs?: number;
  loot?: number;
  reach?: number;
  stamina?: number;
  pace?: number;
  /** 0.0.51 Giraffe: multiplies the radius at which walking past a place names it in the atlas ("Visited ·").
   *  Client-side naming only — it never widens the open/fare/vault reach and nothing on the server reads it. */
  sight?: number;
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
  ingredient?: { id: string; name: string };
  boosts?: string[];
  /** Night market (0.0.46): this reward was earned on the market street and paid ×mult; `coin` is what the market added. */
  market?: { street: string; mult: number; coin: number; matches: number };
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
} & RideGameMark;
