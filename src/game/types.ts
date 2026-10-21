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
  | "shop"
  | "counter"
  | "board";

export type CityId = "austin" | "temple" | "nyc" | "sf" | "london" | "chicago" | "detroit" | "tucson" | "toronto" | "la" | "boston" | "nola" | "seattle" | "denver" | "nashville";

export type TriviaCat = "sports" | "local" | "political" | "food" | "arts" | "math" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books";

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
  /** 0.0.53: door quizzes moved to doorQuizzes.ts (server-only); a Poi no longer carries cards or answers. */
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
  /** 0.1.7: opens of this lamp today (the city's local day, `openDay` as YYYY-MM-DD); the nth open rests n times as long. */
  opens?: number;
  openDay?: string;
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
  /** 0.0.96 Raccoon: 1 in N lit lamps also drops a blue match (server-rolled). */
  rummage?: number;
  /** 0.0.96 Tabby: the first wrong answer each day does not break the answer streak. */
  shield?: boolean;
  /** 0.0.96 Owl: night-market multiplier on coin (2.5 instead of 2). */
  market?: number;
  /** 0.0.96 Owl: the match cache shows on the map from anywhere. */
  cacheAnywhere?: boolean;
  /** 0.0.96 Plate: 1 in N failed lamps refunds the spent match (server-rolled). */
  shellBack?: number;
  /** 0.0.96 Fox: one wrong option is crossed out on red/violet lamps (server picks it). */
  strike?: boolean;
};

export type LootDrop = {
  points: number;
  grade: "perfect" | "great" | "good";
  diff: TriviaDiff;
  keys: Partial<Record<Tier, number>>;
  /** 0.0.90: perfect lamp gave the spent match back (or overflow coin when the pocket was full). */
  refund?: { tier: Tier; match: number; coin: number; up?: boolean };
  brass: number;
  ink: number;
  vellum: number;
  schematic: boolean;
  ingredient?: { id: string; name: string };
  /** A can, when this clear was one of the ones that dropped paint. */
  paint?: { id: string; name: string };
  /** Prism, when the same clear also dropped the ultra can. */
  extraPaint?: { id: string; name: string };
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
  /** 0.1.2: the booked ride length, set once Hurry up has shortened arriveAt (seat pay stays on this). */
  fullMs?: number;
} & RideGameMark;
