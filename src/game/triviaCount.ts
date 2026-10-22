// 0.1.30: total trivia cards, baked in at build time by vite.config.ts (scripts/trivia-count.mjs).
declare const __TRIVIA_COUNT__: number | undefined;

export const TRIVIA_COUNT: number = typeof __TRIVIA_COUNT__ === "number" ? __TRIVIA_COUNT__ : 0;

export function triviaCountLabel(n: number): string {
  return `${n.toLocaleString("en-US")} trivia ${n === 1 ? "card" : "cards"}`;
}
