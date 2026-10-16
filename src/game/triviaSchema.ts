import { z } from "zod";
import type { CityUnlocks } from "./cityPass";
import type { Tier, TriviaDiff } from "./types";

/**
 * 0.0.53 — client-safe shapes for the trivia deal/grade server functions (zod + types only; no bank, no crypto).
 * The server half is triviaService.ts.
 */
export const SEEN_MAX = 2400;
const TIERS = ["white", "blue", "green", "amber", "red", "violet"] as const;
const CITY_IDS = ["austin", "temple", "nyc", "sf", "london", "chicago", "detroit", "tucson", "toronto", "la", "boston", "nola", "seattle", "denver", "nashville"] as const;
const CATS = ["sports", "local", "political", "food", "arts", "math", "science", "history", "nature", "games", "celebrity"] as const;
const KINDS = ["landmark", "museum", "park", "library", "theatre", "stadium", "food", "civic", "station", "campus", "water", "shop"] as const;
const IdIn = z.string().min(1).max(80).regex(/^[A-Za-z0-9_:.~-]+$/);

export const DealIn = z.object({
  city: z.enum(CITY_IDS),
  cat: z.enum(CATS),
  poiId: IdIn,
  /** Street blanks are made by the client's walk; named lamps and the Run/Stack are looked up on the server. */
  blank: z
    .object({ name: z.string().min(1).max(120), kind: z.enum(KINDS), tier: z.enum(TIERS) })
    .optional(),
  step: z.number().int().min(0).max(5).optional(),
  spark: z.boolean().optional(),
  windowMs: z.number().int().min(0).max(120000),
  seen: z.array(IdIn).max(SEEN_MAX),
  saveId: z.string().min(1).max(80).regex(/^[A-Za-z0-9_:.-]+$/),
  /**
   * Pay context sealed into the token at deal time. The grade uses this, clamped, plus the server's own rolls.
   * Optional: a deal without it pays with the defaults (a spark, a blitz, an older client).
   */
  pay: z
    .object({
      streak: z.number().int().min(0).max(80),
      loot: z.number().finite(),
      lucky: z.boolean(),
      cloth: z.string().max(40).nullable(),
      charmDay: z.string().max(10),
      charmTopics: z.array(z.enum(CATS)).max(3),
      lat: z.number().finite().min(-90).max(90),
      lng: z.number().finite().min(-180).max(180),
      prevToken: z.string().min(10).max(2000).optional(),
    })
    .optional(),
});
export type DealInput = z.infer<typeof DealIn>;

export const GradeIn = z.object({
  token: z.string().min(10).max(2000),
  /** The chosen choice text; null when the wick ran out. */
  choice: z.string().max(400).nullable(),
  /** The client's own stopwatch, from the card showing to the tap. */
  clientMs: z.number().finite().min(0).max(600000),
});
export type GradeInput = z.infer<typeof GradeIn>;

/** What the browser gets for a dealt card — the prompt and shuffled choices, never the answer. */
export type PublicCard = { id: string; q: string; choices: string[]; diff: TriviaDiff; rarity: Tier };
/** Signed-in wallet after a migrated deal spend or grade. Absent for guests and before the first sync. */
export type ServerWallet = { coins: number; keys: Record<Tier, number>; cities: CityUnlocks };
export type ServerAward = { coins: number; keys: Partial<Record<Tier, number>>; boosts: string[] };
export type DealResult =
  | { ok: true; token: string; card: PublicCard; windowMs: number; wallet?: ServerWallet }
  | { ok: false; reason: "unknown-lamp" | "slow" | "no-match" };

export type Grade = "perfect" | "great" | "good";
export type GradeResult =
  | {
      ok: true;
      correct: boolean;
      timedOut: boolean;
      /** Revealed only now, after the answer is in. */
      answer: string;
      fact?: string;
      /** Server-bounded answer time (ms) — what grade, perfect timing and the streak spark use. */
      elapsedMs: number;
      grade: Grade | null;
      /** Base coin multiplier for a lamp card from the grade (1 / 0.7 / 0.4); 0 when wrong. */
      mult: number;
      /** The tier this right answer cleared on the rolls (server-written for a signed-in walker). */
      clearTier: Tier | null;
      /** True when the server recorded this card for a signed-in walker (plate event, and the clear if right). */
      credited: boolean;
      /** True when this token had already been graded: the first result stands and nothing is credited. */
      replay: boolean;
      /**
       * Present only when the server rolled this clear's paint. An empty list means it rolled and
       * nothing dropped. Absent means the browser rolls at the posted rate (a guest, a spark, or a
       * Run/Stack card that isn't the last). The shadow, if any, is already in the roll — the list
       * is just the cans.
       */
      paints?: string[];
      /** Present once this walker's wallet lives on the server. The client copies it over the local pocket. */
      wallet?: ServerWallet;
      /** Coins and matches this grade added. Present with `wallet` on a right answer. */
      award?: ServerAward;
    }
  | { ok: false; reason: "bad-token" | "not-yours" | "unknown-card" | "slow" };

