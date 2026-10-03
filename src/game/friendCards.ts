import { cardAny } from "./triviaBank";
import type { FriendCard } from "./friendService";

/**
 * Server-side card index for friend tickets (0.0.50): a ticket names a card id and the server copies the
 * card (and its answer) from its own bank, so a client can neither invent a card nor learn an answer.
 * 0.0.53: the browser holds public card ids (triviaService.publicCardId); old raw ids still resolve.
 */
export function cardById(id: string): FriendCard | null {
  const c = cardAny(id);
  if (!c || c.choices.length !== 4 || !c.choices.includes(c.answer)) return null;
  return { id: c.id, q: c.q, choices: c.choices, answer: c.answer, fact: c.fact, diff: c.diff };
}
