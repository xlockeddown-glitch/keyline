#!/usr/bin/env node
/**
 * 0.0.53 gate: the built browser bundle carries no trivia answers.
 *
 * Trivia is dealt and graded on the server (src/game/triviaApi.ts); the client gets a prompt and four shuffled
 * choices per card and nothing else. This scans every file the browser can download from the build output
 * (`.vercel/output/static`, or `dist/` / `.output/public`, or `--dir <path>`) and fails on:
 *   - any card prompt from the server bank (prompts of 28+ characters; a prompt in the bundle means the bank shipped),
 *   - answer-shaped keys: `answer:"…"` / `"answer":"…"`, `correctIndex`, `correct_index`, `answerIndex`,
 *     `choices:[…],answer` (a card literal),
 *   - a handful of known, unique correct answers (door quizzes and bank cards that no UI copy uses),
 *   - 0.1.173 Put in order: an item with its sort key (`label:"…",key:1947`, or the bank's `["…",1947]` seed pair next
 *     to a bank label), and every authored order label or fact of 16+ characters (the server-only bank shipped).
 *
 *   npm run qa:no-answers            # after npm run build
 *   node scripts/qa-no-answers.mjs --dir path/to/client
 * Exit 0 clean, 1 leaks found, 2 no build output to scan.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { register } from "node:module";
import { isMainModule, projectRoot } from "./with-app-env.mjs";

/** Unique correct answers (each was checked to appear nowhere in UI copy, lore or the map data). */
export const KNOWN_ANSWERS = [
  "Mexican free-tailed bats",
  "AMARG, the boneyard",
  "surface-to-air missile system",
  "aerospace and defense company",
  "Mrs. O'Leary's cow",
  "workplace safety laws",
  "collapse of Lehman Brothers",
  "LEO broadband satellite network",
];

export const KNOWN_ORDER_LABELS = [
  "First transistor demonstrated",
  "Magellan expedition returns",
  "Stockton–Darlington Railway",
  "Nitrogen (boiling)",
];

/** Order labels and facts shorter than this are too generic to probe verbatim ("Mount Fuji", "Helium"). */
export const MIN_ORDER_PROBE = 16;

/** Order labels that the public map copy (place lore in the data chunk) also uses, so finding them proves nothing. */
export const ORDER_PUBLIC_COPY = ["Declaration of Independence", "Louisiana Purchase"];

/** Every authored order label and fact long enough to probe (the bank is server-only, so none may be in the bundle). */
export function orderProbes(cards) {
  return [...new Set(cards.flatMap((c) => [...c.items.map((x) => x.label), c.fact]))].filter(
    (s) => typeof s === "string" && s.length >= MIN_ORDER_PROBE && !ORDER_PUBLIC_COPY.includes(s),
  );
}

const KEY_PATTERNS = [
  { name: "order answer key", re: /\b(?:sortKey|correctOrder|sortedIndex)\b/ },
  // The shape order.ts really builds: an item's label next to its numeric sort key, quoted or minified, either order.
  { name: "order item with its sort key", re: /["']?\blabel["']?\s*:\s*(?:"[^"\n]{1,120}"|'[^'\n]{1,120}'|`[^`\n]{1,120}`)\s*,\s*["']?key["']?\s*:\s*-?\.?\d/ },
  { name: "order item with its sort key", re: /["']?\bkey["']?\s*:\s*-?\.?\d[\d.e+-]*\s*,\s*["']?label["']?\s*:\s*["'`]/ },
  { name: "answer key with a string value", re: /["']?\banswer["']?\s*:\s*["'`]/ },
  { name: "card literal (choices then answer)", re: /choices["']?\s*:\s*\[[^\]]{0,600}\]\s*,\s*["']?answer\b/ },
  { name: "correctIndex key", re: /\bcorrect_?[Ii]ndex\b/ },
  { name: "answerIndex key", re: /\banswer_?[Ii]ndex\b/ },
];

const SCAN_EXT = new Set([".js", ".mjs", ".cjs", ".json", ".html", ".map", ".txt", ".webmanifest"]);
export const MIN_PROMPT = 28;

/** Hits for one file's text. `prompts` are card prompts (server bank) to look for verbatim. */
export function scanText(text, { prompts = [], answers = [...KNOWN_ANSWERS, ...KNOWN_ORDER_LABELS] } = {}) {
  const hits = [];
  for (const k of KEY_PATTERNS) {
    const m = text.match(k.re);
    if (m) hits.push({ kind: k.name, sample: text.slice(Math.max(0, m.index - 40), m.index + 80) });
  }
  for (const a of answers) if (text.includes(a)) hits.push({ kind: "known answer", sample: a });
  let promptHits = 0;
  for (const p of prompts) {
    if (p.length < MIN_PROMPT || !text.includes(p)) continue;
    promptHits += 1;
    if (promptHits <= 5) hits.push({ kind: "card prompt", sample: p });
  }
  if (promptHits > 5) hits.push({ kind: "card prompt", sample: `…and ${promptHits - 5} more prompts` });
  return hits;
}

function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (SCAN_EXT.has(extname(ent.name)) && statSync(p).size < 40 * 1024 * 1024) out.push(p);
  }
  return out;
}

export function clientDir(root, argv = []) {
  const at = argv.indexOf("--dir");
  if (at >= 0 && argv[at + 1]) return join(root, argv[at + 1]);
  for (const rel of [".vercel/output/static", "dist/client", "dist", ".output/public"]) {
    const p = join(root, rel);
    if (existsSync(p)) return p;
  }
  return null;
}

/** Every card the server can deal: the banks, city/region/place sets and the door quizzes. */
export async function bankCards() {
  register("./ts-resolve-hooks.mjs", import.meta.url);
  const { everyCard } = await import("../src/game/trivia.ts");
  const { DOOR_QUIZZES } = await import("../src/game/doorQuizzes.ts");
  return [...everyCard(), ...Object.values(DOOR_QUIZZES).flat()];
}

export async function bankPrompts() {
  return [...new Set((await bankCards()).map((c) => c.q))];
}

async function main() {
  const root = projectRoot();
  const dir = clientDir(root, process.argv.slice(2));
  if (!dir) {
    console.error("[no-answers] no build output found (.vercel/output/static, dist/, .output/public) — run npm run build first");
    process.exit(2);
  }
  const cards = await bankCards();
  const prompts = [...new Set(cards.map((c) => c.q))].filter((p) => p.length >= MIN_PROMPT);
  const answers = new Set(cards.map((c) => c.answer));
  const stale = KNOWN_ANSWERS.filter((a) => !answers.has(a));
  if (stale.length) {
    console.error(`[no-answers] KNOWN_ANSWERS no longer in the bank (pick new ones): ${stale.join(", ")}`);
    process.exit(1);
  }
  // Self-check: the detector must catch a card if one were there, or a clean result means nothing.
  const probe = scanText(`{q:${JSON.stringify(prompts[0])},choices:["a","b","c","d"],answer:"a"}`, { prompts: [prompts[0]] });
  if (probe.length < 2) {
    console.error("[no-answers] self-check failed: the detector missed a planted card");
    process.exit(1);
  }
  const { ORDER_CARDS } = await import("../src/game/banks/order.ts");
  if (KNOWN_ORDER_LABELS.some((label) => !ORDER_CARDS.some((c) => c.items.some((x) => x.label === label)))) {
    console.error("[no-answers] KNOWN_ORDER_LABELS no longer match the authored order bank (pick new ones)");
    process.exit(1);
  }
  const orderAnswers = [...new Set([...KNOWN_ORDER_LABELS, ...orderProbes(ORDER_CARDS)])];
  // Authored order stems are dealt like prompts, never bundled.
  for (const c of ORDER_CARDS) if (c.q.length >= MIN_PROMPT && !prompts.includes(c.q)) prompts.push(c.q);
  // Self-check on the real shape: one authored item with its key must trip the detector.
  const item = ORDER_CARDS[0].items[0];
  if (!scanText(`items:[{label:${JSON.stringify(item.label)},key:${item.key}}]`, { answers: [] }).some((h) => h.kind === "order item with its sort key")) {
    console.error("[no-answers] self-check failed: the detector missed a planted order item");
    process.exit(1);
  }
  const { PIC_CARDS } = await import("../src/game/banks/pic.ts");
  const PIC_UNIQUE = ["Antananarivo", "Christ the Redeemer", "Leaning Tower of Pisa", "Great Pyramid of Giza", "Sydney Opera House"];
  if (PIC_UNIQUE.some((a) => !PIC_CARDS.some((c) => c.answer === a))) {
    console.error("[no-answers] PIC_UNIQUE no longer match the picture-clue bank (pick new ones)");
    process.exit(1);
  }
  const plantedAlt = `jsx("img",{alt:${JSON.stringify(PIC_UNIQUE[0])}})`;
  if (!new RegExp("(?:alt|aria-label)[\"']?\\s*[:=]\\s*[\"'][^\"']*" + PIC_UNIQUE[0].replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") + "[^\"']*[\"']", "i").test(plantedAlt)) {
    console.error("[no-answers] self-check failed: the detector missed a planted JSX alt");
    process.exit(1);
  }
  for (const c of PIC_CARDS) {
    if (c.q.length >= MIN_PROMPT && !prompts.includes(c.q)) prompts.push(c.q);
    if (c.fact.length >= MIN_PROMPT && !prompts.includes(c.fact)) prompts.push(c.fact);
  }
  const files = walk(dir);
  let bad = 0;
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    const hits = scanText(text, { prompts, answers: [...KNOWN_ANSWERS, ...orderAnswers, ...PIC_UNIQUE] });
    for (const a of [...new Set(PIC_CARDS.map((c) => c.answer))]) {
      const esc = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp("(?:alt|aria-label)[\"']?\\s*[:=]\\s*[\"'][^\"']*" + esc + "[^\"']*[\"']", "i").test(text)) {
        hits.push({ kind: "picture clue alt/aria leak", sample: a });
      }
    }
    if (!hits.length) continue;
    bad += 1;
    console.error(`[no-answers] ${relative(root, f)}`);
    for (const h of hits.slice(0, 8)) console.error(`  - ${h.kind}: ${JSON.stringify(h.sample).slice(0, 160)}`);
  }
  if (bad) {
    console.error(`[no-answers] FAIL — ${bad} client file(s) carry trivia answers or cards`);
    process.exit(1);
  }
  console.log(`[no-answers] ok — ${files.length} client files in ${relative(root, dir) || "."}, ${prompts.length} bank prompts, ${KNOWN_ANSWERS.length} known answers and ${orderAnswers.length} order labels/facts absent, ${PIC_CARDS.length} picture clues, no answer keys or leaky alt/aria`);
}

if (isMainModule(import.meta.url)) await main();
