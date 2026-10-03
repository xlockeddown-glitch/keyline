import { CITIES } from "./data";
import { sealPlate } from "./rarity";
import { everyCard } from "./trivia";
import type { TriviaQ } from "./types";
import type { FriendCard } from "./friendService";

/**
 * Server-side card index for friend tickets (0.0.50): a ticket names a card id and the server copies the
 * card (and its answer) from its own bank, so a client can neither invent a card nor learn an answer.
 */
let index: Map<string, TriviaQ> | null = null;

function build(): Map<string, TriviaQ> {
  const m = new Map<string, TriviaQ>();
  for (const c of everyCard()) if (!m.has(c.id)) m.set(c.id, c);
  for (const city of Object.values(CITIES)) {
    for (const poi of city.pois) {
      for (const seed of [poi.quiz, ...(poi.quizzes ?? [])]) {
        if (!seed) continue;
        const c = sealPlate(seed, { city: true });
        if (!m.has(c.id)) m.set(c.id, c);
      }
    }
  }
  return m;
}

export function cardById(id: string): FriendCard | null {
  index ??= build();
  const c = index.get(id);
  if (!c || c.choices.length !== 4 || !c.choices.includes(c.answer)) return null;
  return { id: c.id, q: c.q, choices: c.choices, answer: c.answer, fact: c.fact, diff: c.diff };
}
