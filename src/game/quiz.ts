import type { TriviaDiff, TriviaQ } from "./types";

export function q(
  prompt: string,
  choices: [string, string, string, string],
  answer: string,
  diff: TriviaDiff | string = 2,
  fact?: string,
): TriviaQ {
  if (typeof diff === "string") {
    fact = diff;
    diff = 2;
  }
  return { q: prompt, choices, answer, fact, diff };
}
