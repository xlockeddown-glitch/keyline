#!/usr/bin/env node
/**
 * Fact-level duplicate check for trivia drafts (trivia:repeats only simulates dealing).
 *
 * Usage:
 *   node scripts/trivia-dupcheck.mjs drafts.json            # before sourcing: drafts vs whole deck
 *   node scripts/trivia-dupcheck.mjs src/game/banks/x.ts    # after writing: that file vs rest of deck
 *   options: --json (machine output), --subjects (also print loose subject-grep hits), --survivors out.json
 *
 * Drafts file: JSON array of {prompt|q, choices, answer, cat?} (or a .ts/.js bank, parsed like trivia-audit).
 * A draft is a DUPLICATE when its answer equals or is contained in an existing answer (either way, word-bounded)
 * AND the prompts share >= half the draft's content words; or when its normalized prompt matches exactly.
 * Drafts duplicating each other are flagged too. --subjects lists existing cards that mention the draft's
 * answer or its rarest prompt words (a looser report to eyeball, not a drop list). Exit code 1 if any duplicate.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { loadQuestions, extractQuestions } from "./trivia-audit.mjs";

const STOP = new Set(
  "a an the of to in on at for from with and or is are was were be by its it this that which what who whom whose how many much did does do has have had as into than then also known called name named first famous one two".split(" "),
);
export const norm = (s) => String(s).toLowerCase().replace(/[’']/g, "'").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
export const words = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w)));
export function answerMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [s, l] = x.length <= y.length ? [x, y] : [y, x];
  return s.length >= 4 && ` ${l} `.includes(` ${s} `);
}
export function overlap(draftPrompt, otherPrompt) {
  const a = words(draftPrompt), b = words(otherPrompt);
  if (!a.size) return 0;
  let n = 0;
  for (const w of a) if (b.has(w)) n += 1;
  return n / Math.min(a.size, Math.max(b.size, 1));
}
export function findDuplicates(drafts, deck, { threshold = 0.5 } = {}) {
  const byPrompt = new Map(deck.map((d) => [norm(d.q), d]));
  const out = [];
  const pool = [...deck];
  for (const d of drafts) {
    const hits = [];
    const exact = byPrompt.get(norm(d.q));
    if (exact) hits.push({ ...exact, why: "same prompt", score: 1 });
    for (const e of pool) {
      if (e === exact || e === d) continue;
      if (!answerMatch(d.answer, e.answer)) continue;
      const score = overlap(d.q, e.q);
      if (score >= threshold) hits.push({ ...e, why: "answer + prompt overlap", score });
    }
    out.push({ draft: d, hits });
    pool.push(d);
    byPrompt.set(norm(d.q), d);
  }
  return out;
}
function loadDrafts(path) {
  const src = readFileSync(path, "utf8");
  if (/\.json$/i.test(path)) {
    return JSON.parse(src).map((d) => ({ ...d, q: d.prompt ?? d.q, choices: d.choices ?? [], answer: String(d.answer), file: "draft" }));
  }
  return extractQuestions(src, resolve(path));
}
function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--survivors");
  if (!file) {
    console.error("usage: node scripts/trivia-dupcheck.mjs <drafts.json|bank.ts> [--json] [--subjects] [--survivors out.json]");
    process.exit(2);
  }
  const drafts = loadDrafts(file);
  const rel = relative(process.cwd(), resolve(file));
  const deck = loadQuestions().filter((x) => x.file !== rel && !resolve(x.file).endsWith(rel));
  const res = findDuplicates(drafts, deck);
  const dups = res.filter((r) => r.hits.length);
  if (args.includes("--json")) {
    console.log(JSON.stringify(res, null, 1));
  } else {
    for (const r of dups) {
      console.log(`DUP  ${r.draft.q}  →  ${r.draft.answer}`);
      for (const h of r.hits.slice(0, 3)) console.log(`     ~ ${h.file}:${h.line ?? "?"} [${h.why} ${h.score.toFixed(2)}] ${h.q} → ${h.answer}`);
    }
    if (args.includes("--subjects")) {
      for (const r of res.filter((x) => !x.hits.length)) {
        const a = norm(r.draft.answer);
        const related = a.length >= 4 ? deck.filter((e) => ` ${norm(e.q)} ${norm(e.answer)} `.includes(` ${a} `)) : [];
        if (related.length) console.log(`SUBJ ${r.draft.q} → ${r.draft.answer}  (${related.length}: ${related.slice(0, 2).map((e) => e.q).join(" | ")})`);
      }
    }
    console.log(`${drafts.length} drafts, ${dups.length} duplicates, ${drafts.length - dups.length} survivors`);
  }
  const si = args.indexOf("--survivors");
  if (si >= 0) writeFileSync(args[si + 1], JSON.stringify(res.filter((r) => !r.hits.length).map((r) => ({ ...r.draft, prompt: r.draft.q })), null, 1));
  process.exit(dups.length ? 1 : 0);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
