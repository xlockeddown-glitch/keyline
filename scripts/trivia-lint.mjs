#!/usr/bin/env node
/**
 * Trivia card linter — second-pass heuristics on top of trivia-audit.mjs.
 *
 * Errors (exit 1):
 *   region-overlap   two choices name overlapping places (Brazil + Amazonian South America)
 *   numeric-twin     two choices are the same number written two ways (1/2 and 0.5)
 *   cross-conflict   a card's answer sits as a wrong choice on a card with the same prompt
 *   answer-missing   the answer is not one of the four choices
 *   specialist-easy  a tarantula-hobby card (genus name or keeper jargon in the prompt) below difficulty 3
 *   number-leak      a numeric answer is written in a non-arithmetic prompt ("current 14-team format")
 * Warnings (review list, exit 0):
 *   near-duplicate   prompts match once case/punctuation/ellipsis are ignored
 *   length-giveaway  the answer is clearly the longest choice: over 40% longer than every wrong choice
 *                    (and at least 4 characters longer), or more than 12 characters longer
 *   absolute-tells   every wrong choice says only/always/never and the answer does not
 *   above-choice     "all/none of the above" style choices
 *
 *   node scripts/trivia-lint.mjs            # summary + errors
 *   node scripts/trivia-lint.mjs --warn     # also list warnings
 *   node scripts/trivia-lint.mjs --json     # machine-readable
 *   node scripts/trivia-lint.mjs --length   # length-giveaway cards + how often the answer is the longest choice
 */
import { fileURLToPath } from "node:url";
import { loadQuestions } from "./trivia-audit.mjs";

/** Groups of place names that overlap; two choices from one group are both defensible. */
export const REGION_OVERLAPS = [
  ["Brazil", "Amazonian South America", "northern South America", "South America", "the Amazon", "The Amazon"],
  ["Venezuela", "northern South America", "northwestern South America", "South America"],
  ["Colombia", "northern South America", "northwestern South America", "South America"],
  ["Amazonian South America", "northern South America", "northwestern South America", "the Amazon", "The Amazon", "only the Amazon"],
  ["Costa Rica", "Central America"],
  ["South Africa", "southern Africa", "Africa"],
  ["Tanzania / East Africa", "East Africa", "Africa"],
  ["West Africa", "Africa"],
  ["the U.S. Southwest", "the south-central United States"],
  ["India", "Indian subcontinent"],
  ["Socotra", "Yemen"],
];

const NUM_RE = /^\s*[−-]?\s*(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?\s*(%)?\s*$/;

/** Numeric value of a plain number / fraction / percent choice, else null. */
export function choiceValue(raw) {
  const s = String(raw).replace(/,/g, "");
  const m = NUM_RE.exec(s);
  if (!m) return null;
  let v = Number(m[1]);
  if (m[2]) v /= Number(m[2]);
  if (m[3]) v /= 100;
  if (/^\s*[−-]/.test(s)) v = -v;
  return Number.isFinite(v) ? v : null;
}

export function normPrompt(q) {
  return String(q)
    .toLowerCase()
    .replace(/…|\.{3}/g, " ")
    .replace(/[?!.:,;'"’‘“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Overlapping places where one of them is the answer (two wrong overlapping choices are harmless). */
export function regionOverlap(choices, answer) {
  for (const group of REGION_OVERLAPS) {
    if (!group.includes(String(answer).trim())) continue;
    const hit = choices.filter((c) => group.includes(String(c).trim()));
    if (hit.length >= 2) return hit;
  }
  return null;
}

const TOKEN_STOP = new Set("a an the of to in on at for from with and or is are was were be by its it this that which what who".split(" "));
export function promptTokens(q) {
  return new Set(normPrompt(q).split(" ").filter((w) => w && !TOKEN_STOP.has(w)));
}

export function jaccard(a, b) {
  let n = 0;
  for (const w of a) if (b.has(w)) n += 1;
  const u = a.size + b.size - n;
  return u ? n / u : 0;
}

export function numericTwin(choices) {
  const vals = choices.map(choiceValue);
  for (let i = 0; i < vals.length; i += 1) {
    for (let j = i + 1; j < vals.length; j += 1) {
      if (vals[i] != null && vals[j] != null && Math.abs(vals[i] - vals[j]) < 1e-9) {
        return [choices[i], choices[j]];
      }
    }
  }
  return null;
}

const ARITH_RE = /[0-9][^a-z]*[+−\-×÷*/^=√²³⁴⁵][^a-z]*[0-9]|[²³⁴⁵⁶⁷⁸⁹¹⁰]|[√%]|\b(sum|product|half|double|twice|percent|times|minus|plus|divided|squared|cubed|root|average|mean|median|digits?|remainder|factorial|prime|multiple|ratio|fraction|area|perimeter|angles?|sides?|degrees|rounded|round|nearest|next|sequence|pattern|year|years|century|lap)\b/i;
/** Numeric answer sitting in a prompt that is not arithmetic. */
export function numberLeak(item) {
  const ans = String(item.answer).trim();
  if (!/^\d+$/.test(ans)) return false;
  const q = String(item.q);
  if (/(^|\/)math[^/]*\.ts$/.test(String(item.file ?? "")) || ARITH_RE.test(q)) return false;
  // "Falcon 9", "Apollo 11": a number inside a proper name is not a leak.
  return new RegExp(`(^|[^0-9.,/A-Za-z ]|(?<![A-Z][a-z]+) )${ans}([^0-9.,/:]|$)`).test(q);
}

/** Tarantula genera and keeper shorthand that only hobbyists know. */
export const SPECIALIST_RE =
  /\b(Theraphosa|Brachypelma|Tliltocatl|Grammostola|Aphonopelma|Poecilotheria|Psalmopoeus|Avicularia|Caribena|Pterinochilus|Ceratogyrus|Heteroscodra|Monocentropus|Lasiodora|Chromatopelma|Cyriopagopus|Haplopelma|Acanthoscurria|Nhandu|Megaphobema|Sericopelma|Eupalaestrus|Harpactira|Pelinobius|Stromatopelma|Encyocratella|Omothymus|Pterinopelma|Davus|Phormictopus|Hapalopus|Xenesthis|Ephebopus|Theraphosidae|Theraphosinae|GBB|OBT|DLS|sling|slings|instar|exuvium|urticating|fossorial|spermathecae?|pedipalps?|chelicerae|book lungs?|hobby|keepers?|enclosure|substrate)\b/i;
export function specialistEasy(item) {
  return item.diff < 3 && SPECIALIST_RE.test(String(item.q)) && /tarantula|spider|\bsling|hobby|urticating|instar|exuvium|Theraphos|fossorial|pinktoe|baboon/i.test(`${item.q} ${item.choices.join(" ")}`);
}

/** Length tell: answer over 40% longer than the longest wrong choice (by 4+ characters), or 12+ characters longer. */
export const LENGTH_RATIO = 1.4;
export const LENGTH_MIN_GAP = 4;
export const LENGTH_MAX_GAP = 12;
export function lengthGiveaway(item) {
  const a = String(item.answer).length;
  const others = item.choices.filter((c) => c !== item.answer).map((c) => String(c).length);
  if (!others.length) return false;
  const m = Math.max(...others);
  return a - m > LENGTH_MAX_GAP || (a > m * LENGTH_RATIO && a - m >= LENGTH_MIN_GAP);
}

/**
 * How often the answer is the longest choice. Only cards with one strictly longest choice count
 * (ties carry no signal); with 4 choices, chance is 25%.
 */
export function longestAnswerRate(items) {
  let cards = 0;
  let answerLongest = 0;
  for (const it of items) {
    const lens = it.choices.map((c) => String(c).length);
    const top = Math.max(...lens);
    if (lens.filter((n) => n === top).length !== 1) continue;
    cards += 1;
    if (String(it.answer).length === top) answerLongest += 1;
  }
  return { cards, answerLongest, rate: cards ? answerLongest / cards : 0 };
}

const ABS_RE = /\b(only|always|never)\b/i;
export function absoluteTells(item) {
  const wrong = item.choices.filter((c) => c !== item.answer);
  return wrong.length === 3 && wrong.every((c) => ABS_RE.test(c)) && !ABS_RE.test(item.answer);
}

export function lintTrivia(items) {
  const errors = [];
  const warnings = [];
  const at = (it) => `${it.file}:${it.line}`;
  const push = (list, kind, it, detail) => list.push({ kind, where: at(it), q: it.q, detail });

  const groups = new Map();
  for (const it of items) {
    const choices = Array.isArray(it.choices) ? it.choices : [];
    if (!choices.includes(it.answer)) push(errors, "answer-missing", it, `Answer ${JSON.stringify(it.answer)} is not a choice.`);
    const ro = regionOverlap(choices, it.answer);
    if (ro) push(errors, "region-overlap", it, `Overlapping places ${ro.map((c) => JSON.stringify(c)).join(" + ")} — more than one defensible answer.`);
    const nt = numericTwin(choices);
    if (nt) push(errors, "numeric-twin", it, `Choices ${JSON.stringify(nt[0])} and ${JSON.stringify(nt[1])} are the same value.`);
    if (specialistEasy(it)) push(errors, "specialist-easy", it, `Hobbyist tarantula card at difficulty ${it.diff}; raise to 3 or rewrite for a general audience.`);
    if (numberLeak(it)) push(errors, "number-leak", it, `Answer ${JSON.stringify(it.answer)} is already written in the prompt.`);
    if (lengthGiveaway(it)) push(warnings, "length-giveaway", it, `Answer is clearly the longest choice — lengthen the wrong choices or trim the answer.`);
    if (absoluteTells(it)) push(warnings, "absolute-tells", it, `Every wrong choice says only/always/never.`);
    if (choices.some((c) => /\b(all|none) of the above\b/i.test(c))) push(warnings, "above-choice", it, `"of the above" choice breaks under shuffling.`);
    const k = normPrompt(it.q);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }

  for (const list of groups.values()) {
    if (list.length < 2) continue;
    for (const a of list) {
      for (const b of list) {
        if (a === b) continue;
        const sameAns = String(a.answer).toLowerCase() === String(b.answer).toLowerCase();
        if (!sameAns && b.choices.some((c) => c !== b.answer && String(c).toLowerCase() === String(a.answer).toLowerCase())) {
          push(errors, "cross-conflict", a, `Answer ${JSON.stringify(a.answer)} is a wrong choice on ${at(b)} (same prompt).`);
        }
      }
    }
    const exact = new Set(list.map((it) => it.q));
    if (exact.size > 1) {
      push(warnings, "near-duplicate", list[0], `Same prompt modulo case/punctuation at ${list.slice(1).map(at).join(", ")}.`);
    }
  }
  // Fuzzy near-duplicates: same answer, prompts share most words (word problems and arithmetic excluded).
  const byAnswer = new Map();
  for (const it of items) {
    if (/[0-9][^a-z]*[+−\-×÷*/^=][^a-z]*[0-9]/i.test(it.q)) continue;
    const k = String(it.answer).toLowerCase();
    if (!byAnswer.has(k)) byAnswer.set(k, []);
    byAnswer.get(k).push({ it, tok: promptTokens(it.q) });
  }
  for (const list of byAnswer.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (a.it.q === b.it.q) {
          if (a.it.file !== b.it.file) push(warnings, "exact-duplicate", a.it, `Same card at ${at(b.it)}.`);
          continue;
        }
        if (Math.min(a.tok.size, b.tok.size) >= 3 && jaccard(a.tok, b.tok) >= 0.75) {
          push(warnings, "near-duplicate", a.it, `Near-duplicate of ${at(b.it)}: ${JSON.stringify(b.it.q)}.`);
        }
      }
    }
  }
  return { errors, warnings };
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}

if (isMain()) {
  const args = new Set(process.argv.slice(2));
  const items = loadQuestions();
  const { errors, warnings } = lintTrivia(items);
  if (args.has("--length")) {
    const flagged = warnings.filter((w) => w.kind === "length-giveaway");
    const r = longestAnswerRate(items);
    console.log(`Length giveaways: ${flagged.length} · answer is the longest choice on ${(r.rate * 100).toFixed(1)}% of ${r.cards} cards with one longest choice (chance 25%)`);
    for (const w of flagged) console.log(`  ${w.where}  ${w.q}`);
    process.exit(0);
  }
  if (args.has("--json")) {
    console.log(JSON.stringify({ cards: items.length, errors, warnings }, null, 2));
  } else {
    const byKind = (list) => Object.entries(list.reduce((m, f) => ((m[f.kind] = (m[f.kind] ?? 0) + 1), m), {}));
    console.log(`Trivia lint · ${items.length} trivia cards · ${errors.length} errors · ${warnings.length} warnings`);
    for (const [k, n] of byKind(warnings)) console.log(`  warn ${k}: ${n}`);
    for (const e of errors) console.log(`  ERROR ${e.where}  [${e.kind}] ${e.q} — ${e.detail}`);
    if (args.has("--warn")) for (const w of warnings) console.log(`  WARN ${w.where}  [${w.kind}] ${w.q} — ${w.detail}`);
  }
  process.exit(errors.length ? 1 : 0);
}
