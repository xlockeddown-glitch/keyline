/**
 * 0.1.168 Where am I? — the Loop's optional ride card. The clue is the lore the game already ships for a real
 * place in the destination city; the four choices are that place and three others from the same city.
 * SERVER-ONLY: built into the card index in triviaBank.ts and dealt/graded like any card (triviaService.ts),
 * so the answer is only revealed by the grade. One fixed card per place, so its public id is stable.
 */
import { CITIES } from "./data.ts";
import type { CityId, Poi, TriviaQ } from "./types.ts";

export const WHERE_CHOICES = 4;
/** Lore shorter than this is too thin to be a clue. */
export const WHERE_MIN_CLUE = 50;
/** Game words in lore that say nothing about the real place. */
const FLAVOR = /\b(lamp|blank|plate|stack|lantern|scout|vault|key|match)(e?s)?\b/i;

/** Lowercase words of three letters or more, accents folded. */
export function words(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && w !== "the" && w !== "and");
}

/** True when any word of the name shows up in the text. */
export function namesIn(text: string, name: string): boolean {
  const t = new Set(words(text));
  return words(name).some((w) => t.has(w));
}

/** Real places only: not the outfitter, ward counter or notice board, and not a game-made mark. */
function real(p: Poi): boolean {
  const kind: string = p.kind;
  return kind !== "shop" && kind !== "counter" && kind !== "board" && !p.noClue;
}

/** Places whose lore works as a clue: long enough, real-world, and never naming the place. */
export function cluePool(pois: readonly Poi[]): Poi[] {
  const seen = new Set<string>();
  return pois.filter((p) => {
    if (seen.has(p.id) || !real(p)) return false;
    seen.add(p.id);
    const lore = p.lore?.trim() ?? "";
    return lore.length >= WHERE_MIN_CLUE && !FLAVOR.test(lore) && !namesIn(lore, p.name);
  });
}

/** Small seeded generator, so a place always gets the same decoys (and the same public card id). */
function rng(seed: string) {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One card for a place, or null when the city has too few safe decoys. */
export function whereCard(target: Poi, pois: readonly Poi[]): TriviaQ | null {
  const rnd = rng(target.id);
  const own = new Set(words(target.name));
  const names = new Set([target.name]);
  const wrong: string[] = [];
  const pool = pois.filter(real).map((p) => ({ p, r: rnd() })).sort((a, b) => a.r - b.r);
  for (const { p } of pool) {
    if (wrong.length >= WHERE_CHOICES - 1) break;
    if (names.has(p.name) || namesIn(target.lore, p.name) || words(p.name).some((w) => own.has(w))) continue;
    names.add(p.name);
    wrong.push(p.name);
  }
  if (wrong.length < WHERE_CHOICES - 1) return null;
  return {
    id: `where-${target.id}`,
    q: target.lore.trim(),
    choices: [target.name, wrong[0]!, wrong[1]!, wrong[2]!],
    answer: target.name,
    diff: 2,
    rarity: "white",
  };
}

let all: Map<CityId, TriviaQ[]> | null = null;

/** Every Where am I? card, by city. */
export function whereCards(): Map<CityId, TriviaQ[]> {
  if (all) return all;
  all = new Map();
  for (const city of Object.values(CITIES)) {
    const cards = cluePool(city.pois)
      .map((p) => whereCard(p, city.pois))
      .filter((c): c is TriviaQ => c != null);
    all.set(city.id, cards);
  }
  return all;
}

/** A card for this city the walker hasn't seen (raw ids or prompts in `avoid`); any card once all are seen. */
export function pickWhere(city: CityId, avoid: readonly string[], rand: () => number = Math.random): TriviaQ | null {
  const cards = whereCards().get(city) ?? [];
  if (!cards.length) return null;
  const seen = new Set(avoid);
  const fresh = cards.filter((c) => !seen.has(c.id) && !seen.has(c.q));
  const from = fresh.length ? fresh : cards;
  return from[Math.min(from.length - 1, Math.floor(rand() * from.length))]!;
}

/** The Loop's deal id: `where-<from>-<to>`. A spark allows one per id a day, so one paid clue per route a day. */
export function isWherePoi(poiId: string): boolean {
  return poiId.startsWith("where-");
}
