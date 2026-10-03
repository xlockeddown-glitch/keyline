import { z } from "zod";
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
export type DealResult = { ok: true; token: string; card: PublicCard; windowMs: number } | { ok: false; reason: "unknown-lamp" | "slow" };

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
    }
  | { ok: false; reason: "bad-token" | "not-yours" | "unknown-card" | "slow" };

