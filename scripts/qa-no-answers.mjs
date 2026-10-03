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
 *   - a handful of known, unique correct answers (door quizzes and bank cards that no UI copy uses).
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
  "Sunset Red granite",
  "Mexican free-tailed bats",
  "AMARG, the boneyard",
  "surface-to-air missile system",
  "aerospace and defense company",
];

const KEY_PATTERNS = [
  { name: "answer key with a string value", re: /["']?\banswer["']?\s*:\s*["'`]/ },
  { name: "card literal (choices then answer)", re: /choices["']?\s*:\s*\[[^\]]{0,600}\]\s*,\s*["']?answer\b/ },
  { name: "correctIndex key", re: /\bcorrect_?[Ii]ndex\b/ },
  { name: "answerIndex key", re: /\banswer_?[Ii]ndex\b/ },
];

const SCAN_EXT = new Set([".js", ".mjs", ".cjs", ".json", ".html", ".map", ".txt", ".webmanifest"]);
export const MIN_PROMPT = 28;

/** Hits for one file's text. `prompts` are card prompts (server bank) to look for verbatim. */
export function scanText(text, { prompts = [], answers = KNOWN_ANSWERS } = {}) {
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

/** Every prompt the server can deal: the banks, city/region/place sets and the door quizzes. */
export async function bankPrompts() {
  register("./ts-resolve-hooks.mjs", import.meta.url);
  const { everyCard } = await import("../src/game/trivia.ts");
  const { DOOR_QUIZZES } = await import("../src/game/doorQuizzes.ts");
  const out = new Set(everyCard().map((c) => c.q));
  for (const seeds of Object.values(DOOR_QUIZZES)) for (const s of seeds) out.add(s.q);
  return [...out];
}

async function main() {
  const root = projectRoot();
  const dir = clientDir(root, process.argv.slice(2));
  if (!dir) {
    console.error("[no-answers] no build output found (.vercel/output/static, dist/, .output/public) — run npm run build first");
    process.exit(2);
  }
  const prompts = (await bankPrompts()).filter((p) => p.length >= MIN_PROMPT);
  // Self-check: the detector must catch a card if one were there, or a clean result means nothing.
  const probe = scanText(`{q:${JSON.stringify(prompts[0])},choices:["a","b","c","d"],answer:"a"}`, { prompts: [prompts[0]] });
  if (probe.length < 2) {
    console.error("[no-answers] self-check failed: the detector missed a planted card");
    process.exit(1);
  }
  const files = walk(dir);
  let bad = 0;
  for (const f of files) {
    const hits = scanText(readFileSync(f, "utf8"), { prompts });
    if (!hits.length) continue;
    bad += 1;
    console.error(`[no-answers] ${relative(root, f)}`);
    for (const h of hits.slice(0, 8)) console.error(`  - ${h.kind}: ${JSON.stringify(h.sample).slice(0, 160)}`);
  }
  if (bad) {
    console.error(`[no-answers] FAIL — ${bad} client file(s) carry trivia answers or cards`);
    process.exit(1);
  }
  console.log(`[no-answers] ok — ${files.length} client files in ${relative(root, dir) || "."}, ${prompts.length} bank prompts and ${KNOWN_ANSWERS.length} known answers absent, no answer keys`);
}

if (isMainModule(import.meta.url)) await main();
