import { z } from "zod";
import type { CityUnlocks } from "./cityPass";
import type { Tier, TriviaDiff } from "./types";

/**
 * 0.0.53 — client-safe shapes for the trivia deal/grade server functions (zod + types only; no bank, no crypto).
 * The server half is triviaService.ts.
 */
export const SEEN_MAX = 2400;
const TIERS = ["white", "blue", "green", "amber", "red", "violet"] as const;
const CITY_IDS = ["austin", "temple", "nyc", "sf", "london", "chicago", "detroit", "tucson", "toronto", "la", "boston", "nola", "seattle", "denver", "nashville", "philly"] as const;
const CATS = ["sports", "local", "political", "food", "arts", "math", "science", "history", "nature", "games", "celebrity", "music", "books", "geography"] as const;
const KINDS = ["landmark", "museum", "park", "library", "theatre", "stadium", "food", "civic", "station", "campus", "water", "shop"] as const;
const IdIn = z.string().min(1).max(80).regex(/^[A-Za-z0-9_:.~-]+$/);

export const DealIn = z.object({
  city: z.enum(CITY_IDS),
  /** 0.1.116: "random" lets the server pick the field (+10% coin; never at a Hearth vault). */
  cat: z.enum([...CATS, "random"]),
  poiId: IdIn,
  /** Street blanks are made by the client's walk; named lamps are looked up on the server. */
  blank: z
    .object({ name: z.string().min(1).max(120), kind: z.enum(KINDS), tier: z.enum(TIERS) })
    .optional(),
  step: z.number().int().min(0).max(5).optional(),
  /** 0.1.117: a Double/Triple Hearth's next question: the previous question's token (the server reads the step from it). */
  hearthPrev: z.string().min(10).max(2000).optional(),
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
      /** 0.0.96: the worn coat; its abilities are rolled by the server at grade time. */
      scout: z.string().max(20).optional(),
      /** 0.1.45: the owned car the player sits in; the server checks ownership before it counts. */
      car: z.string().max(20).optional(),
    })
    .optional(),
  /** 0.1.158: the card formats this client can show (street lamps only). Absent: four-choice cards only. */
  formats: z.array(z.enum(["tf", "near"])).max(2).optional(),
});
export type DealInput = z.infer<typeof DealIn>;

export const GradeIn = z.object({
  token: z.string().min(10).max(2000),
  /** The chosen choice text; null when the wick ran out. */
  choice: z.string().max(400).nullable(),
  /** The client's own stopwatch, from the card showing to the tap. */
  clientMs: z.number().finite().min(0).max(600000),
  /** 0.1.158 Closest Number: the typed guess (only read on a Closest Number card). */
  guess: z.number().finite().min(-1e12).max(1e12).optional(),
});
export type GradeInput = z.infer<typeof GradeIn>;

/** What the browser gets for a dealt card — the prompt and shuffled choices, never the answer. */
export type PublicCard = {
  id: string;
  q: string;
  choices: string[];
  diff: TriviaDiff;
  rarity: Tier;
  /** 0.0.96 Fox: a wrong option the server crossed out. */
  struck?: string;
  /** 0.1.158: "tf" (choices are True, False) or "near" (no choices: type a number). Absent: four choices. */
  kind?: "tf" | "near";
  /** 0.1.158 Closest Number: a unit to show after the input, if any. */
  unit?: string;
};
/** Signed-in wallet after a migrated deal spend or grade. Absent for guests and before the first sync. */
export type ServerWallet = {
  coins: number;
  keys: Record<Tier, number>;
  cities: CityUnlocks;
  credit?: Partial<Record<Tier, number>>;
  /** 0.1.133: server answer streak after this sync or grade. Absent on older replies. */
  streakRun?: number;
  streakLord?: boolean;
};
export type ServerAward = { coins: number; keys: Partial<Record<Tier, number>>; boosts: string[] };
export type DealResult =
  | { ok: true; token: string; card: PublicCard; windowMs: number; wallet?: ServerWallet }
  | { ok: false; reason: "unknown-lamp" | "slow" | "no-match" }
  /** 0.1.159: this walker already cleared this Comet vault window (server ledger `ev:<id>`). */
  | { ok: false; reason: "comet-done" }
  /** 0.1.107: this vault is locked out after a wrong answer (server ledger); `leftMs` until it opens. */
  | { ok: false; reason: "locked-out"; leftMs: number };

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
      /** Base coin multiplier for a lamp card from the grade (1 / 0.7 / 0.4; Closest Number slides); 0 when wrong. */
      mult: number;
      /** The tier this right answer cleared on the rolls (server-written for a signed-in walker). */
      clearTier: Tier | null;
      /** True when the server recorded this card for a signed-in walker (plate event, and the clear if right). */
      credited: boolean;
      /** 0.1.9: a paint can this right answer turned up (amber / red vault, server-rolled). */
      can?: { car: string; color: string };
      /** True when this token had already been graded: the first result stands and nothing is credited. */
      replay: boolean;
      /** 0.1.107: a wrong answer at a keyed vault locks it this long (ms). Absent when nothing locks. */
      lockoutMs?: number;
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
      /** 0.1.158 Closest Number: the exact answer, the guess and the raw relative miss (0.016 = 1.6%). */
      near?: { value: number; guess: number; offPct: number };
    }
  | { ok: false; reason: "bad-token" | "not-yours" | "unknown-card" | "slow" };

