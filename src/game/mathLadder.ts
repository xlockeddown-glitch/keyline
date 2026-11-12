/**
 * 0.0.99 math ladder: a math card's lamp colour follows how hard the sum really is (a blue vault used to deal 16 − 5).
 *   white  add/subtract within 20
 *   blue   two-digit add/subtract, sometimes a small 3rd number (47 + 28 − 9)
 *   green  times tables to 12 × 12 (and their divisions), or 3-number add/subtract
 *   amber  two-digit × one-digit, mixed steps (14 × 6 − 23), division with a whole answer
 *   red    two-digit × two-digit, clean percents (15% of 240), longer mixed chains
 *   violet multi-step with brackets / order of operations, or squares and small powers
 * Everything stays doable in your head: whole numbers only, except clean percents. A sum that fits nowhere is trimmed.
 * Prompts that aren't a bare sum (word problems, facts, geometry) keep their normal tier.
 */
import type { FormatQ, Tier, TriviaDiff, TriviaQ } from "./types";

export const MATH_LADDER: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];
export const MATH_DIFF: Record<Tier, TriviaDiff> = { white: 1, blue: 1, green: 2, amber: 2, red: 3, violet: 3 };

type Tok = { n: number } | { op: string };
export type Shape = {
  nums: number[];
  ops: string[]; // binary ops in order: + − × ÷
  parens: boolean;
  pow: number[]; // exponents used
  pct?: { p: number; of: number };
  value: number;
};

const OPS: Record<string, string> = { "+": "+", "−": "−", "-": "−", "×": "×", x: "×", "*": "×", "÷": "÷", "/": "÷" };

function lex(s: string): Tok[] | null {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (c === " ") { i++; continue; }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (m) { out.push({ n: Number(m[0]) }); i += m[0].length; continue; }
    if (c === "²") { out.push({ op: "^" }, { n: 2 }); i++; continue; }
    if (c === "³") { out.push({ op: "^" }, { n: 3 }); i++; continue; }
    if (c === "^" || c === "(" || c === ")") { out.push({ op: c }); i++; continue; }
    if (OPS[c]) { out.push({ op: OPS[c]! }); i++; continue; }
    return null;
  }
  return out;
}

/** Parse "What is <sum>?" or "<p>% of <n> is…" into its shape; null when it isn't a bare sum. */
export function mathShape(q: string): Shape | null {
  const pct = /^(\d+)% of (\d+) is…$/.exec(q.trim());
  if (pct) {
    const p = Number(pct[1]), of = Number(pct[2]);
    return { nums: [p, of], ops: [], parens: false, pow: [], pct: { p, of }, value: (p * of) / 100 };
  }
  const m = /^What is\s+(.+?)\s*\?$/.exec(q.trim());
  if (!m) return null;
  const toks: Tok[] | null = lex(m[1]!);
  if (!toks || !toks.length) return null;
  const tk: Tok[] = toks;
  const shape: Shape = { nums: [], ops: [], parens: false, pow: [], value: 0 };
  let i = 0;
  const peek = () => tk[i];
  const isOp = (t: Tok | undefined, o: string) => !!t && "op" in t && t.op === o;
  function atom(): number | null {
    const t = tk[i++];
    if (!t) return null;
    if ("n" in t) { shape.nums.push(t.n); return t.n; }
    if (t.op === "(") { shape.parens = true; const v = sum(); if (!isOp(tk[i++], ")")) return null; return v; }
    return null;
  }
  function power(): number | null {
    const b = atom();
    if (b == null) return null;
    if (isOp(peek(), "^")) {
      i++;
      const e = tk[i++];
      if (!e || !("n" in e)) return null;
      shape.pow.push(e.n);
      return b ** e.n;
    }
    return b;
  }
  function product(): number | null {
    let v = power();
    while (v != null && (isOp(peek(), "×") || isOp(peek(), "÷"))) {
      const o = (tk[i++] as { op: string }).op;
      shape.ops.push(o);
      const r = power();
      if (r == null) return null;
      v = o === "×" ? v * r : v / r;
    }
    return v;
  }
  function sum(): number | null {
    let v = product();
    while (v != null && (isOp(peek(), "+") || isOp(peek(), "−"))) {
      const o = (tk[i++] as { op: string }).op;
      shape.ops.push(o);
      const r = product();
      if (r == null) return null;
      v = o === "+" ? v + r : v - r;
    }
    return v;
  }
  const v = sum();
  if (v == null || i !== tk.length) return null;
  shape.value = v;
  return shape;
}

const whole = (x: number) => Number.isInteger(x);
const CLEAN_PCT = new Set([5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]);

/** The one lamp colour this sum belongs on, or "trim" when it isn't head-math. */
export function mathTier(s: Shape): Tier | "trim" {
  if (s.nums.some((n) => !whole(n))) return "trim";
  if (s.pct) return CLEAN_PCT.has(s.pct.p) && whole(s.value) && s.pct.of <= 1000 ? "red" : "trim";
  if (!whole(s.value) || s.value < 0 || s.value > 2000) return "trim";
  const n = s.nums.length;
  const addSub = s.ops.every((o) => o === "+" || o === "−");
  const big = Math.max(...s.nums);
  // A bare square is a times-table fact: up to 10² green, 11²-15² red, 16²-25² violet (only with work to do is a square violet otherwise).
  if (n === 1 && s.ops.length === 0 && s.pow.length === 1 && s.pow[0] === 2 && !s.parens) {
    const b = s.nums[0]!;
    return b <= 10 ? "green" : b <= 15 ? "red" : b <= 25 ? "violet" : "trim";
  }
  if (s.parens || s.pow.length) {
    if (s.pow.some((e) => e > 3) && !(s.nums[0] === 2 && s.pow.every((e) => e <= 10))) return "trim";
    if (s.pow.includes(2) && s.nums.some((x, k) => s.pow.length && x > 25 && k === 0)) return "trim";
    return n <= 5 && big <= 100 ? "violet" : "trim";
  }
  if (addSub) {
    if (big > 99 && !(n === 2 && big <= 999 && s.nums.every((x) => x % 5 === 0))) return n <= 5 ? "red" : "trim";
    if (n === 2) return big <= 20 && s.value <= 20 ? "white" : "blue";
    if (n === 3) return s.nums[2]! <= 20 && s.nums[1]! <= 99 && s.nums[0]! <= 99 && Math.min(...s.nums) <= 20 ? "blue" : "green";
    if (n === 4) return "green";
    return n <= 6 ? "red" : "trim";
  }
  // Has × or ÷.
  if (n === 2) {
    const [a, b] = s.nums as [number, number];
    if (s.ops[0] === "×") {
      const hi = Math.max(a, b), lo = Math.min(a, b);
      if (lo <= 1) return s.value <= 20 && hi <= 20 ? "white" : hi <= 99 ? "blue" : "trim";
      if (hi <= 12) return "green";
      if (lo <= 9 && hi <= 99) return "amber";
      if (lo <= 99 && hi <= 99) return "red";
      return "trim";
    }
    if (b === 0 || !whole(a / b)) return "trim";
    if (b <= 12 && a / b <= 12) return "green";
    if (b <= 12 && a <= 999) return "amber";
    return b <= 99 && a <= 9999 && a / b <= 99 ? "red" : "trim";
  }
  // Mixed chains without brackets: order of operations already matters, so these sit amber/red/violet.
  const mulOk = s.nums.every((x) => x <= 99);
  if (!mulOk) return "trim";
  if (n === 3) return s.ops.every((o) => o === "×") && big <= 12 && s.value <= 144 ? "green" : "amber";
  if (n <= 5) return "red";
  return "trim";
}

/** Near misses for a whole-number answer: the slips people actually make. */
/**
 * 0.1.118 `hard` (generated green, amber and violet cards; red stays as it was): a ×/÷/% card also gets the "one row off" slips (answer ± an
 * operand), and at most one of the three wrong options is a ±1/±2/±3 neighbour, so "pick the middle of the
 * cluster" or "match the last digit" no longer gives the answer away.
 */
export function nearMisses(ans: number, s: Shape | null, rnd: () => number, hard = false): number[] {
  const c = new Set<number>();
  const add = (x: number) => { if (whole(x) && x >= 0 && x !== ans) c.add(x); };
  [1, -1, 2, -2, 3, -3, 10, -10].forEach((d) => add(ans + d));
  const nums = s?.nums ?? [];
  for (const x of nums) if (x > 1 && x <= 12) { add(ans + x); add(ans - x); }
  if (hard && (s?.pct || s?.ops.some((o) => o === "×" || o === "÷"))) for (const x of nums) if (x > 12 && x <= 99) { add(ans + x); add(ans - x); }
  if (hard) { add(ans + 20); add(ans - 20); }
  const str = String(ans);
  if (str.length >= 2) add(Number(str.slice(0, -2) + str.at(-1) + str.at(-2)));
  const pool = [...c];
  for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [pool[k], pool[j]] = [pool[j]!, pool[k]!]; }
  // Random near misses (not always ±1 around it, so the answer isn't simply the middle one).
  const near = pool.filter((x) => Math.abs(x - ans) <= 12 || String(x).length === str.length);
  if (!hard) return near.slice(0, 3);
  const tiny = near.filter((x) => Math.abs(x - ans) <= 3);
  const rest = near.filter((x) => Math.abs(x - ans) > 3);
  return [...rest.slice(0, 2), ...tiny.slice(0, 1), ...rest.slice(2)].slice(0, 3);
}

/** Seeded PRNG (mulberry32), so the generated cards are the same on every server and build. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

/** One generated prompt for a tier (always lands on that tier: generateFor checks it). */
export function genPrompt(tier: Tier, r: () => number): string {
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]!;
  switch (tier) {
    case "white": {
      const a = int(r, 3, 19);
      return r() < 0.5 ? `What is ${a} + ${int(r, 1, 20 - a)}?` : `What is ${a} − ${int(r, 1, a)}?`;
    }
    case "blue": {
      const a = int(r, 21, 89), b = int(r, 11, 49);
      if (r() < 0.35) return `What is ${a} + ${b} − ${int(r, 3, 19)}?`;
      return r() < 0.5 ? `What is ${a} + ${b}?` : `What is ${Math.max(a, b)} − ${Math.min(a, b)}?`;
    }
    case "green": {
      if (r() < 0.6) {
        // 0.1.118: no ×3 / ×10 freebies; the tables people actually slip on (6-12).
        const a = pick([4, 6, 7, 8, 9, 11, 12]), b = pick([6, 7, 8, 9, 11, 12]);
        return r() < 0.7 ? `What is ${a} × ${b}?` : `What is ${a * b} ÷ ${a}?`;
      }
      const a = int(r, 30, 90), b = int(r, 21, 60), c = int(r, 21, 49);
      return pick([`What is ${a} + ${b} − ${c}?`, `What is ${a} − ${c} + ${b}?`]);
    }
    case "amber": {
      const k = r();
      // 0.1.118: bigger two-digit factors (23-89 × 4-9), 13-29 × 4-9 in the chain, division by up to 12 with 13-49 answers.
      if (k < 0.4) return `What is ${int(r, 23, 89)} × ${int(r, 4, 9)}?`;
      if (k < 0.7) { const a = int(r, 13, 29), b = int(r, 4, 9); return `What is ${a} × ${b} − ${int(r, 17, Math.min(89, a * b - 1))}?`; }
      const d = int(r, 4, 12);
      return `What is ${d * int(r, 13, 49)} ÷ ${d}?`;
    }
    case "red": {
      const k = r();
      if (k < 0.4) return `What is ${int(r, 12, 35)} × ${int(r, 11, 19)}?`;
      if (k < 0.7) { const p = pick([10, 15, 20, 25, 30, 40, 75]); const of = pick([40, 60, 80, 120, 160, 200, 240, 300, 360, 400]); return `${p}% of ${of} is…`; }
      const a = int(r, 6, 12), b = int(r, 4, 9);
      return `What is ${a} × ${b} + ${int(r, 12, 40)} − ${int(r, 5, 20)}?`;
    }
    default: {
      const k = r();
      // 0.1.118 (biggest bump): fewer bare squares (35% → 25%), a new sum of two squares, a four-number bracket card
      // with bigger numbers (× up to 12), and 11-19 squared in the square-minus-product card.
      if (k < 0.25) return `What is ${int(r, 16, 25)}²?`;
      if (k < 0.45) return `What is ${int(r, 11, 19)}² + ${int(r, 6, 15)}²?`;
      if (k < 0.8) return `What is (${int(r, 19, 45)} + ${int(r, 8, 29)}) × ${int(r, 6, 12)} − ${int(r, 21, 60)}?`;
      return `What is ${int(r, 11, 19)}² − ${int(r, 4, 12)} × ${int(r, 6, 12)}?`;
    }
  }
}

/** n generated cards for a tier (seeded; ids start "gm" so audits can tell them apart). */
export function generateFor(tier: Tier, n: number, seed = 990): TriviaQ[] {
  const r = seeded(seed + MATH_LADDER.indexOf(tier) * 7919);
  const out: TriviaQ[] = [];
  const seen = new Set<string>();
  for (let guard = 0; out.length < n && guard < n * 40; guard++) {
    const q = genPrompt(tier, r);
    if (seen.has(q)) continue;
    const s = mathShape(q);
    if (!s || mathTier(s) !== tier) continue;
    seen.add(q);
    const answer = String(s.value);
    const miss = nearMisses(s.value, s, r, tier === "green" || tier === "amber" || tier === "violet");
    if (miss.length < 3) continue;
    const choices = [answer, ...miss.map(String)].sort((a, b) => Number(a) - Number(b)) as TriviaQ["choices"];
    out.push({ q, choices, answer, diff: MATH_DIFF[tier], id: `gm${tier[0]}${out.length.toString(36)}-${s.value}`, rarity: tier });
  }
  return out;
}

/** Put a static math card on its ladder colour; null when the sum isn't head-math (trimmed). Non-sums pass through. */
export function ladderCard(item: TriviaQ): TriviaQ | null {
  const s = mathShape(item.q);
  if (!s) return item;
  const t = mathTier(s);
  if (t === "trim") return null;
  const ans = Number(item.answer);
  // Far-off wrong options (a give-away) are swapped for near misses; the card id stays the same.
  const far = whole(ans) && item.choices.some((c) => c !== item.answer && !(Math.abs(Number(c) - ans) <= Math.max(12, ans * 0.25)));
  const miss = far ? nearMisses(ans, s, seeded(ans * 31 + item.q.length)) : [];
  const choices = miss.length === 3 ? ([item.answer, ...miss.map(String)].sort((a, b) => Number(a) - Number(b)) as TriviaQ["choices"]) : item.choices;
  return { ...item, choices, rarity: t, diff: MATH_DIFF[t] };
}

/** Generated cards per tier: the static bank is thin above green. */
export const GEN_PER_TIER: Record<Tier, number> = { white: 0, blue: 0, green: 60, amber: 160, red: 160, violet: 160 };
export function generatedMath(): TriviaQ[] {
  return MATH_LADDER.flatMap((t) => generateFor(t, GEN_PER_TIER[t]));
}

/**
 * 0.1.158 Closest Number: one estimation sum for an amber/red/violet lamp, in mathShape's own form so the value
 * comes from the same parser. Amber 3-digit × 2-digit, red 4-digit ÷ 2-digit, violet a percent of a 4-5 digit number.
 */
export function genEstimate(tier: Tier, r: () => number): string {
  if (tier === "amber") return `What is ${int(r, 120, 989)} × ${int(r, 13, 98)}?`;
  if (tier === "red") return `What is ${int(r, 2100, 9890)} ÷ ${int(r, 13, 97)}?`;
  return `${int(r, 11, 89)}% of ${int(r, 1200, 98000)} is…`;
}

const grouped = (n: number) => n.toLocaleString("en-US");

/** n Closest Number cards for a tier (seeded; ids start "gn"). Whole-number answers, never under 200. */
export function generateNear(tier: Tier, n: number, seed = 1158): Extract<FormatQ, { kind: "near" }>[] {
  const r = seeded(seed + MATH_LADDER.indexOf(tier) * 7919);
  const out: Extract<FormatQ, { kind: "near" }>[] = [];
  const seen = new Set<string>();
  for (let guard = 0; out.length < n && guard < n * 40; guard++) {
    const sum = genEstimate(tier, r);
    if (seen.has(sum)) continue;
    const s = mathShape(sum);
    if (!s) continue;
    const value = Math.round(s.value);
    if (!(value >= 200)) continue;
    seen.add(sum);
    const shown = s.pct
      ? `${s.pct.p}% of ${grouped(s.pct.of)}`
      : `${grouped(s.nums[0]!)} ${s.ops[0]} ${grouped(s.nums[1]!)}${s.ops[0] === "÷" ? " (to the nearest whole number)" : ""}`;
    out.push({ kind: "near", q: `About how much is ${shown}?`, value, diff: MATH_DIFF[tier], id: `gn${tier[0]}${out.length.toString(36)}-${value}`, rarity: tier });
  }
  return out;
}
