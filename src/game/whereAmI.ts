/**
 * Where am I? — a ride game for 2–6 minute trips. A clue from a real place in the
 * destination city (the lore the game already ships for that place) and four names
 * from the same city. Pick the one the clue describes.
 * Pure — no store, no DOM — so node tests can run it straight.
 */
import type { Poi } from "./types";
import { seededRng, type RideOutcome } from "./rideGames.ts";
export { WHERE_ROUND_MAX_MS, WHERE_ROUND_MIN_MS, whereRoundMs } from "./rideGames.ts";

/** Clues per round. */
export const WHERE_ROUNDS = 5;
/** Right answers needed to win the round. */
export const WHERE_WIN = 4;
export const WHERE_CHOICES = 4;
/** How long the right answer stays up before the next clue. */
export const WHERE_REVEAL_MS = 1_400;
/** Lore shorter than this is too thin to be a clue. */
export const WHERE_MIN_CLUE = 50;

/** Lowercase words of three letters or more, accents folded. */
export function words(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && w !== "the" && w !== "and");
}

/** True when any word of the place's name shows up in the text. */
export function namesIn(text: string, name: string): boolean {
  const t = new Set(words(text));
  return words(name).some((w) => t.has(w));
}

/** Game words in lore that say nothing about the real place. */
const FLAVOR = /\b(lamp|blank|plate|stack|lantern|scout)s?\b/i;

/** Places whose lore works as a clue: long enough, real-world, and doesn't name the place. */
export function cluePool(pois: readonly Poi[]): Poi[] {
  const seen = new Set<string>();
  return pois.filter((p) => {
    if (seen.has(p.id) || p.kind === "shop" || p.noClue) return false;
    seen.add(p.id);
    const lore = p.lore?.trim() ?? "";
    if (lore.length < WHERE_MIN_CLUE || FLAVOR.test(lore)) return false;
    return !namesIn(lore, p.name);
  });
}

export type WhereClue = { id: string; clue: string; answer: string; choices: string[] };

function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Wrong names for a clue: same city, not named in the clue, and not sharing a word with the answer. */
function decoys(target: Poi, pois: readonly Poi[], rnd: () => number): string[] {
  const own = new Set(words(target.name));
  const names = new Set<string>([target.name]);
  const out: string[] = [];
  const real = pois.filter((p) => p.kind !== "shop" && !p.noClue);
  const sameKind = real.filter((p) => p.kind === target.kind);
  const rest = real.filter((p) => p.kind !== target.kind);
  for (const p of [...shuffle(sameKind, rnd), ...shuffle(rest, rnd)]) {
    if (out.length >= WHERE_CHOICES - 1) break;
    if (names.has(p.name)) continue;
    if (namesIn(target.lore, p.name)) continue;
    if (words(p.name).some((w) => own.has(w))) continue;
    names.add(p.name);
    out.push(p.name);
  }
  return out;
}

/**
 * The ride's clue order. Seeded by the ride, so a reload deals the same deck.
 * Every clue in the pool comes up once before any comes back.
 */
export function whereDeck(pois: readonly Poi[], rideSeed: number): Poi[] {
  return shuffle(cluePool(pois), seededRng(rideSeed));
}

/** Clues for round `round` (0-based) of a ride. Walks the deck in order, so rounds don't repeat. */
export function whereRound(pois: readonly Poi[], rideSeed: number, round: number): WhereClue[] {
  const deck = whereDeck(pois, rideSeed);
  if (deck.length < WHERE_CHOICES) return [];
  const rnd = seededRng(rideSeed * 31 + round * 7919 + 1);
  const out: WhereClue[] = [];
  const start = Math.max(0, round) * WHERE_ROUNDS;
  for (let i = 0; i < WHERE_ROUNDS; i++) {
    const p = deck[(start + i) % deck.length]!;
    const wrong = decoys(p, pois, rnd);
    if (wrong.length < WHERE_CHOICES - 1) continue;
    out.push({ id: p.id, clue: p.lore.trim(), answer: p.name, choices: shuffle([p.name, ...wrong], rnd) });
  }
  return out;
}

export type WhereTally = { asked: number; right: number; total: number };

/** Right answers needed to win a round of `total` clues: four of five. */
export function whereWinAt(total: number) {
  return Math.max(1, Math.ceil(total * (WHERE_WIN / WHERE_ROUNDS)));
}

/** A full five-clue round with every answer right. Earns the flat perfect-round bonus. */
export function wherePerfect(t: WhereTally) {
  return t.total >= WHERE_ROUNDS && t.asked >= t.total && t.right >= t.total;
}

/** Win: answered every clue and got at least four of five. Perf 0.5 at the line, 1 for a clean sheet. */
export function whereOutcome(t: WhereTally): RideOutcome {
  const need = whereWinAt(t.total);
  if (t.total >= WHERE_WIN && t.asked >= t.total && t.right >= need) {
    const perf = Math.min(1, (t.right - need + 1) / (t.total - need + 1));
    return wherePerfect(t) ? { kind: "won", perf, perfect: true } : { kind: "won", perf };
  }
  return { kind: "played" };
}

/** End-of-round line, in the conductor's voice. */
export function whereVerdict(t: WhereTally, city: string) {
  const of = `${t.right} of ${t.total}.`;
  if (t.total > 0 && t.right >= t.total) return `${of} You know ${city} like a cabbie.`;
  if (whereOutcome(t).kind === "won") return `${of} Good enough to get paid.`;
  if (t.asked < t.total) return `${of} The clock beat you. The seat still pays.`;
  if (t.right === 0) return `${of} Lost in ${city}. You still get the carriage rate.`;
  return `${of} Close. You still get the carriage rate.`;
}
