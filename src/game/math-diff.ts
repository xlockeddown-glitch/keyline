import { sealPlate } from "./rarity.ts";
import type { TriviaDiff, TriviaQ } from "./types";

const NUM = "[-−]?\\d+(?:\\.\\d+)?";
const OP = "[+×÷−]";
const ARITH = new RegExp(
  `^What is\\s+(${NUM})\\s*(${OP})\\s*(${NUM})(?:\\s*(${OP})\\s*(${NUM}))?\\s*\\??$`,
);

function num(raw: string): number {
  return Number(raw.replace("−", "-"));
}

/** How hard a math prompt actually is. Plain two-number add/sub stays easy. */
export function scoreMathPrompt(q: string, fallback: TriviaDiff = 2): TriviaDiff {
  const arith = q.match(ARITH);
  if (arith?.[4]) {
    return /[×÷]/.test(arith[2] + arith[4]) ? 3 : 2;
  }
  if (arith) {
    const a = num(arith[1]);
    const b = num(arith[3]);
    const op = arith[2];
    const A = Math.abs(a);
    const B = Math.abs(b);
    const neg = a < 0 || b < 0;
    if (op === "+" || op === "−") {
      if (neg || A >= 100 || B >= 100) return 2;
      return 1;
    }
    if (op === "×") {
      const hi = Math.max(A, B);
      const lo = Math.min(A, B);
      if (lo <= 1) return 1;
      if (hi <= 10) return 1;
      if (hi <= 12 || lo <= 12) return 2;
      return 3;
    }
    if (op === "÷") {
      if (B > 0 && B <= 12 && A <= 144) return A <= 81 && B <= 9 ? 1 : 2;
      return 3;
    }
  }
  const pow = q.match(/^What is\s+(\d+)\^(\d+)\s*\??$/);
  if (pow) {
    const base = Number(pow[1]);
    const exp = Number(pow[2]);
    if (exp >= 5 || base ** exp >= 200) return 3;
    return 2;
  }
  const pct = q.match(/(\d+)% of/);
  if (pct) {
    const p = Number(pct[1]);
    if (p % 10 === 0 && p >= 10 && p <= 50) return 2;
    return 3;
  }
  if (/area of a|perimeter of a|tip on/i.test(q)) return 2;
  return fallback;
}

export function rescoreMath(item: TriviaQ): TriviaQ {
  const diff = scoreMathPrompt(item.q, item.diff);
  if (diff === item.diff) return item;
  return sealPlate({
    q: item.q,
    choices: item.choices,
    answer: item.answer,
    fact: item.fact,
    diff,
    id: item.id,
  });
}
