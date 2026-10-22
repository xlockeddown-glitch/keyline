// 0.1.30: the title page's trivia tracker. Counted at build time from the same bank files trivia:quotas
// reads (src/game/banks/*.ts + trivia.ts), so only the number reaches the browser, never a card or answer.
import { loadQuestions } from "./trivia-audit.mjs";

/** Total trivia cards in the game (same total trivia:quotas reports). */
export function triviaCardCount(root) {
  return loadQuestions(root).length;
}
