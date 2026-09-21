#!/usr/bin/env node
/**
 * Trivia plate auditor.
 *
 * Validity (always): four unique choices, answer on the plate, unique prompts,
 * difficulty 1–3, no empty text.
 * Math: arithmetic / algebra / named-value plates are computed, not guessed.
 * Facts (changed plates, or --facts): confirm against Wikipedia's summary API
 * (Wikimedia is the automatable reputable source; Britannica/official pages
 * are for the human/agent pass in .grok/skills/trivia-qa).
 *
 *   node scripts/trivia-audit.mjs
 *   node scripts/trivia-audit.mjs --facts
 *   node scripts/trivia-audit.mjs --watch
 *   node scripts/trivia-audit.mjs --json
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, watch, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { projectRoot } from "./with-app-env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = projectRoot();
const BANK_DIR = join(ROOT, "src/game/banks");
const EXTRA_FILES = [join(ROOT, "src/game/trivia.ts")];
const CACHE_PATH = join(ROOT, ".grok/trivia-audit-cache.json");
const REPORT_PATH = join(ROOT, ".grok/trivia-audit-report.json");
const WIKI_UA = "KeylineTriviaAudit/1.0 (game QA; wikipedia.org/api)";

export function hashItem(item) {
  return createHash("sha1").update(`${item.q}\n${item.answer}\n${item.choices.join("|")}`).digest("hex");
}

function isIdentChar(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}

function readString(src, start) {
  const quote = src[start];
  let i = start + 1;
  let out = "";
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const n = src[i + 1];
      if (n === "n") out += "\n";
      else if (n === "t") out += "\t";
      else if (n === "u" && /[0-9a-fA-F]{4}/.test(src.slice(i + 2, i + 6))) {
        out += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16));
        i += 6;
        continue;
      } else out += n ?? "";
      i += 2;
      continue;
    }
    if (c === quote) return { value: out, end: i + 1 };
    out += c;
    i += 1;
  }
  throw new Error("unterminated string");
}

function splitArgs(inner) {
  const args = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === '"' || c === "'") {
      const s = readString(inner, i);
      i = s.end;
      continue;
    }
    if (c === "[") depth += 1;
    else if (c === "]") depth -= 1;
    else if (c === "," && depth === 0) {
      args.push(inner.slice(start, i).trim());
      start = i + 1;
    }
    i += 1;
  }
  const last = inner.slice(start).trim();
  if (last) args.push(last);
  return args;
}

function parseChoiceList(raw) {
  const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  const out = [];
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === '"' || c === "'") {
      const s = readString(inner, i);
      out.push(s.value);
      i = s.end;
      continue;
    }
    i += 1;
  }
  return out;
}

export function extractQuestions(src, file) {
  const items = [];
  let i = 0;
  while (i < src.length) {
    const idx = src.indexOf("q(", i);
    if (idx < 0) break;
    if (idx > 0 && isIdentChar(src[idx - 1])) {
      i = idx + 2;
      continue;
    }
    let depth = 1;
    let j = idx + 2;
    while (j < src.length && depth > 0) {
      const c = src[j];
      if (c === '"' || c === "'") {
        j = readString(src, j).end;
        continue;
      }
      if (c === "(" || c === "[") depth += 1;
      else if (c === ")" || c === "]") depth -= 1;
      j += 1;
    }
    const inner = src.slice(idx + 2, j - 1);
    let args;
    try {
      args = splitArgs(inner);
    } catch {
      i = idx + 2;
      continue;
    }
    if (args.length < 3) {
      i = idx + 2;
      continue;
    }
    let prompt;
    let answer;
    try {
      prompt = args[0][0] === '"' || args[0][0] === "'" ? readString(args[0], 0).value : null;
      answer = args[2][0] === '"' || args[2][0] === "'" ? readString(args[2], 0).value : null;
    } catch {
      i = idx + 2;
      continue;
    }
    if (!prompt || answer == null) {
      i = idx + 2;
      continue;
    }
    const choices = parseChoiceList(args[1]);
    let diff = 2;
    if (args[3] && /^\d+$/.test(args[3].trim())) diff = Number(args[3].trim());
    const line = src.slice(0, idx).split("\n").length;
    items.push({
      q: prompt,
      choices,
      answer,
      diff,
      file: relative(ROOT, file),
      line,
    });
    i = j;
  }
  return items;
}

export function loadBankFiles(root = ROOT) {
  const files = [];
  const dir = join(root, "src/game/banks");
  try {
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".ts")) files.push(join(dir, name));
    }
  } catch {
    /* no banks dir */
  }
  files.push(join(root, "src/game/trivia.ts"));
  return files.filter((f) => {
    try {
      return statSync(f).isFile();
    } catch {
      return false;
    }
  });
}

export function loadQuestions(root = ROOT) {
  const items = [];
  for (const file of loadBankFiles(root)) {
    const src = readFileSync(file, "utf8");
    items.push(...extractQuestions(src, file));
  }
  return items;
}

export function plateText(s) {
  return String(s)
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** True when the answer is already written into the prompt (Buffalo Sabres → Buffalo). */
export function answerInPrompt(prompt, answer) {
  const q = plateText(prompt);
  const a = plateText(answer);
  if (a.length < 4) return false;
  if (q === a) return true;
  return ` ${q} `.includes(` ${a} `);
}

/** True when "Which NFL team calls Green Bay home?" answers "Green Bay Packers". */
export function teamCityGiveaway(prompt, answer) {
  const m = String(prompt).match(/^Which (NFL|NBA|MLB|NHL) team calls (.+) home\??$/i);
  if (!m) return false;
  const city = plateText(m[2]);
  const ans = plateText(answer);
  const words = city.split(" ").filter((w) => w.length >= 4);
  return words.some((w) => ` ${ans} `.includes(` ${w} `));
}

const MATH_START = /^(log|ln|sin|cos|tan|sec|csc|cot|e\b|e,|i[²2]|π|sqrt|det\b|pH\b)/i;
const TYPOS = [
  ["seperate", "separate"],
  ["occured", "occurred"],
  ["definately", "definitely"],
  ["recieve", "receive"],
  ["untill", "until"],
  ["goverment", "government"],
  ["enviroment", "environment"],
  ["occassion", "occasion"],
  ["publically", "publicly"],
  ["arguement", "argument"],
  ["acheive", "achieve"],
  ["neccessary", "necessary"],
  ["tommorrow", "tomorrow"],
  ["beleive", "believe"],
  ["calender", "calendar"],
  ["existance", "existence"],
  ["fourty", "forty"],
  ["independant", "independent"],
  ["maintainance", "maintenance"],
  ["millenium", "millennium"],
  ["noticable", "noticeable"],
  ["succesful", "successful"],
  ["thier", "their"],
  ["truely", "truly"],
  ["back packers", "Packers"],
  ["back packer", "Packers"],
  ["alot of", "a lot of"],
  ["could of", "could have"],
  ["should of", "should have"],
  ["would of", "would have"],
];

function flag(list, kind, item, detail) {
  list.push({ kind, where: `${item.file}:${item.line}`, q: item.q, detail });
}

function countChar(s, ch) {
  let n = 0;
  for (const c of s) if (c === ch) n += 1;
  return n;
}

/** Language, caps, punctuation, structure, and contextual giveaways. */
export function auditCraft(items) {
  const errors = [];
  const warnings = [];
  for (const item of items) {
    const q = String(item.q ?? "");
    const answer = String(item.answer ?? "");
    const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];
    const blob = [q, answer, ...choices].join(" · ");

    if (q !== q.trim() || answer !== answer.trim() || choices.some((c) => c !== c.trim())) {
      flag(errors, "punct", item, "Leading or trailing space.");
    }
    if (/ {2,}/.test(blob)) flag(errors, "punct", item, "Double spaces.");
    if (/ +[,.;:!?)]/.test(blob)) flag(errors, "punct", item, "Space before punctuation.");
    if (/[(\[] /.test(q)) flag(warnings, "punct", item, "Space after an opening bracket.");
    if (/\.{3,}$/.test(q.trim()) || !/[?….:!]$/.test(q.trim())) {
      flag(errors, "punct", item, "Prompt should end with ? or …");
    }
    if (/\.\.\./.test(blob)) flag(warnings, "punct", item, "Use an ellipsis (…) instead of three dots.");
    if (/\?\?|!!/.test(q)) flag(errors, "punct", item, "Stacked punctuation.");
    if (countChar(q, "(") !== countChar(q, ")")) {
      flag(errors, "structure", item, "Unmatched parentheses in the prompt.");
    }

    if (/^[a-z]/.test(q) && !MATH_START.test(q)) {
      flag(errors, "caps", item, "Prompt should start with a capital letter.");
    }

    for (const [bad, good] of TYPOS) {
      const re = new RegExp(`\\b${bad.replace(/ /g, "\\s+")}\\b`, "i");
      if (re.test(blob)) flag(errors, "language", item, `Misspelling ${JSON.stringify(bad)} → ${good}.`);
    }

    const dw = q.match(/\b([A-Z][a-z]{2,})\s+\1\b/);
    if (dw) flag(errors, "language", item, `Repeated word "${dw[1]}".`);

    if (/\bLake Loch\b/i.test(blob)) {
      flag(errors, "language", item, 'Say "Loch Ness", not "Lake Loch Ness".');
    }
    if (/\bthe the\b/i.test(blob)) flag(errors, "language", item, 'Repeated "the".');

    if (/^(Who|What|Where|When|Which|Why|How)\b/i.test(q) && /[?].*[…]|….*\?/.test(q)) {
      flag(warnings, "structure", item, "Prompt mixes a question mark with an ellipsis.");
    }

    if (q.length > 220) flag(warnings, "structure", item, "Prompt is very long for a vault plate.");

    const stripped = choices.map((c) => c.replace(/[.,!?]$/, "").trim().toLowerCase());
    if (new Set(stripped).size !== stripped.length && new Set(choices).size === choices.length) {
      flag(errors, "structure", item, "Two choices match once punctuation is ignored.");
    }

    const sentenceStops = choices.filter((c) => /[a-z)]\.$/.test(c)).length;
    if (sentenceStops >= 1 && sentenceStops <= 3) {
      flag(warnings, "structure", item, "Choices mix ending periods.");
    }

    if (item.answer != null && contentOverlap(q, answer) && !teamCityGiveaway(q, answer) && !answerInPrompt(q, answer)) {
      flag(errors, "leak", item, `Answer words already sit in the prompt (${JSON.stringify(answer)}).`);
    }
  }
  return { errors, warnings };
}

const CRAFT_STOP = new Set(
  "a an the of to in on at for from with and or is are was were be which what where when who whom whose how many much does do did call calls home city play plays their games based nicknamed club team".split(
    " ",
  ),
);

export function contentOverlap(prompt, answer) {
  const parts = String(answer).match(/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*/g) || [];
  const q = ` ${plateText(prompt)} `;
  for (const part of parts) {
    const words = plateText(part).split(" ").filter((w) => w.length >= 4);
    if (words.length < 2) continue;
    if (words.every((w) => q.includes(` ${w} `))) return true;
  }
  return false;
}

const FILLER_RE =
  /\bas this (name|label|plate|sandwich|museum|site|weather)\b|\bas the third of the name\b|\bonly as the name\b/i;

const ALIAS_PAIRS = [
  ["holland", "netherlands"],
  ["bombay", "mumbai"],
  ["peking", "beijing"],
  ["burma", "myanmar"],
  ["siam", "thailand"],
  ["persia", "iran"],
  ["ceylon", "sri lanka"],
];

/** True when a wrong choice is written into the right one (Asia ⊂ Asia / Europe). */
export function namedDistractor(answer, choices) {
  const raw = String(answer);
  const parts = raw
    .split(/[/(),]+/)
    .map((s) => s.replace(/^(not|no)\s+/i, "").trim())
    .filter((s) => s.length >= 4);
  for (const c of choices) {
    if (c === answer) continue;
    const ct = String(c).trim();
    if (ct.length < 4) continue;
    if (parts.some((p) => p.toLowerCase() === ct.toLowerCase())) return c;
    if (/[+\-×÷*/]/.test(ct) || /[+\-×÷*/]/.test(raw)) continue;
    const escaped = ct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
    if (re.test(raw)) return c;
  }
  return null;
}

/**
 * Semantic nuance: partial-truth distractors, alias pairs, WH-type mismatch,
 * leftover generator filler, father/son gotchas on white vaults.
 */
export function auditSemantics(items) {
  const errors = [];
  const warnings = [];
  for (const item of items) {
    const q = String(item.q ?? "");
    const answer = String(item.answer ?? "");
    const choices = Array.isArray(item.choices) ? item.choices.map(String) : [];

    const partial = namedDistractor(answer, choices);
    if (partial) {
      flag(
        errors,
        "nuance",
        item,
        `Distractor ${JSON.stringify(partial)} is also written into the answer — a partial truth.`,
      );
    }

    for (const c of [answer, ...choices]) {
      if (FILLER_RE.test(c)) {
        flag(warnings, "nuance", item, `Filler phrasing ${JSON.stringify(c)}.`);
      }
    }

    const pts = choices.map(plateText);
    for (const [x, y] of ALIAS_PAIRS) {
      const hasX = pts.some((p) => p === x || p.endsWith(` ${x}`) || p.startsWith(`${x} `));
      const hasY = pts.some((p) => p === y || p.endsWith(` ${y}`) || p.startsWith(`${y} `) || p.includes(` ${y} `));
      if (hasX && hasY) {
        flag(errors, "nuance", item, `Choices treat ${x} and ${y} as different answers.`);
      }
    }

    if (/\b(FIFA|World Cup|Premier League|La Liga|Serie A|Bundesliga)\b/i.test(q)) {
      const hasS = choices.some((c) => /\bsoccer\b/i.test(c));
      const hasF = choices.some((c) => /\bfootball\b/i.test(c));
      if (hasS && hasF) {
        flag(errors, "nuance", item, "Soccer and football both sit on a plate about the same sport.");
      }
    }

    if (/\bwhich city\b/i.test(q) && /^\d{3,4}\b/.test(answer.trim())) {
      flag(errors, "nuance", item, "Asked for a city, answer is a year.");
    }
    if (/\bwhich year\b|\bin what year\b/i.test(q) && !/\d{3,4}/.test(answer)) {
      flag(errors, "nuance", item, "Asked for a year, answer has no year.");
    }

    const joined = choices.join(" | ");
    if (item.diff === 1 && /George W\. Bush/.test(joined) && /George H\. W\. Bush/.test(joined)) {
      flag(warnings, "nuance", item, "White vault asks a Bush father/son distinction.");
    }
    if (item.diff === 1 && /\bRoman emperor\b/.test(joined) && /Holy Roman Emperor/.test(joined)) {
      flag(warnings, "nuance", item, "White vault asks Roman vs Holy Roman.");
    }
  }
  return { errors, warnings };
}

export function auditValidity(items) {
  const errors = [];
  const seen = new Map();
  for (const item of items) {
    const where = `${item.file}:${item.line}`;
    if (!item.q || item.q.trim().length < 5) {
      errors.push({ kind: "prompt", where, q: item.q, detail: "Prompt is too short." });
    }
    if (!Array.isArray(item.choices) || item.choices.length !== 4) {
      errors.push({
        kind: "choices",
        where,
        q: item.q,
        detail: `Need four choices, got ${item.choices?.length ?? 0}.`,
      });
    } else {
      if (item.choices.some((c) => !String(c).trim())) {
        errors.push({ kind: "choices", where, q: item.q, detail: "Empty choice." });
      }
      if (new Set(item.choices).size !== item.choices.length) {
        errors.push({ kind: "choices", where, q: item.q, detail: "Duplicate choices." });
      }
      if (!item.choices.includes(item.answer)) {
        errors.push({
          kind: "answer",
          where,
          q: item.q,
          detail: `Answer ${JSON.stringify(item.answer)} is not on the plate.`,
        });
      }
    }
    if (item.q && item.answer != null && answerInPrompt(item.q, item.answer)) {
      errors.push({
        kind: "leak",
        where,
        q: item.q,
        detail: `Answer ${JSON.stringify(item.answer)} is already in the prompt.`,
      });
    }
    if (item.q && item.answer != null && teamCityGiveaway(item.q, item.answer)) {
      errors.push({
        kind: "leak",
        where,
        q: item.q,
        detail: `City in the prompt is already in the team name ${JSON.stringify(item.answer)}.`,
      });
    }
    if (![1, 2, 3].includes(item.diff)) {
      errors.push({ kind: "diff", where, q: item.q, detail: `Bad difficulty ${item.diff}.` });
    }
    const key = item.q.trim().toLowerCase();
    const prev = seen.get(key);
    if (prev) {
      if (prev.answer.toLowerCase() !== item.answer.toLowerCase()) {
        errors.push({
          kind: "conflict",
          where: `${item.file}:${item.line}`,
          q: item.q,
          detail: `Same prompt as ${prev.where} but answer ${JSON.stringify(item.answer)} vs ${JSON.stringify(prev.answer)}.`,
        });
      }
    } else seen.set(key, { where, answer: item.answer });
  }
  return errors;
}

function nstr(s) {
  return String(s)
    .replace(/[$,°]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function sameNum(got, expect) {
  const a = nstr(got);
  const b = nstr(expect);
  if (a === b) return true;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) < 1e-6) return true;
  return false;
}

function fact(n) {
  let x = 1;
  for (let i = 2; i <= n; i++) x *= i;
  return x;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function parseFrac(s) {
  const m = String(s).trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (!m) return null;
  return { n: Number(m[1]), d: Number(m[2]) };
}

/** Compute a known math plate. Return string expected answer, or null if not a compute plate. */
export function computeMath(prompt) {
  const p = prompt
    .replace(/\u2212/g, "-")
    .replace(/\u00d7|\u2715/g, "*")
    .replace(/\u00f7/g, "/")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/⁴/g, "^4")
    .replace(/⁵/g, "^5")
    .replace(/⁸/g, "^8")
    .replace(/¹⁰/g, "^10")
    .replace(/√/g, "sqrt")
    .trim();

  let m;

  m = p.match(/^What is (-?\d+)\s*([+\-*/])\s*(-?\d+)\s*\??$/i);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[3]);
    const op = m[2];
    if (op === "+") return String(a + b);
    if (op === "-") return String(a - b);
    if (op === "*") return String(a * b);
    if (op === "/") return String(a / b);
  }

  m = p.match(/^What is (-?\d+)\s*\^\s*(\d+)/i);
  if (m) return String(Math.pow(Number(m[1]), Number(m[2])));

  m = p.match(/^What is (-?\d+)\s*\*\s*(-?\d+)\s*\*\s*(-?\d+)/i);
  if (m) return String(Number(m[1]) * Number(m[2]) * Number(m[3]));

  m = p.match(/^What is (-?\d+)\s*\+\s*(-?\d+)\s*\+\s*(-?\d+)(?:\s*\+\s*(-?\d+))?\s*\??$/i);
  if (m) {
    const nums = [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number);
    return String(nums.reduce((s, n) => s + n, 0));
  }

  m = p.match(/^What is (-?\d+)\s*-\s*(-?\d+)\s*-\s*(-?\d+)/i);
  if (m) return String(Number(m[1]) - Number(m[2]) - Number(m[3]));

  m = p.match(/^Half of (\d+)/i);
  if (m) return String(Number(m[1]) / 2);

  m = p.match(/^A quarter of (\d+)/i);
  if (m) return String(Number(m[1]) / 4);

  m = p.match(/^(\d+)% of (\d+)/i);
  if (m) return String((Number(m[1]) / 100) * Number(m[2]));

  m = p.match(/^(\d+) is (\d+)% of what number/i);
  if (m) return String(Number(m[1]) / (Number(m[2]) / 100));

  m = p.match(/^If (-?\d+)x\s*\+\s*(-?\d+)\s*=\s*(-?\d+), x is/i);
  if (m) return String((Number(m[3]) - Number(m[2])) / Number(m[1]));

  m = p.match(/^If (-?\d+)x\s*-\s*(-?\d+)\s*=\s*(-?\d+), x is/i);
  if (m) return String((Number(m[3]) + Number(m[2])) / Number(m[1]));

  m = p.match(/^The (?:area) of a (\d+)-by-(\d+) (?:rectangle|square)/i);
  if (m) return String(Number(m[1]) * Number(m[2]));

  m = p.match(/^The perimeter of a (\d+)-by-(\d+) rectangle/i);
  if (m) return String(2 * (Number(m[1]) + Number(m[2])));

  m = p.match(/^The volume of a (\d+)\s*[×x*]\s*(\d+)\s*[×x*]\s*(\d+) box/i);
  if (m) return String(Number(m[1]) * Number(m[2]) * Number(m[3]));

  m = p.match(/^sqrt(\d+)/i);
  if (m) return String(Math.round(Math.sqrt(Number(m[1]))));

  m = p.match(/^Cube root of (\d+)/i);
  if (m) return String(Math.round(Math.cbrt(Number(m[1]))));

  m = p.match(/^What is (\d+)!\s*\(/i) || p.match(/^What is (\d+) factorial/i);
  if (m) return String(fact(Number(m[1])));

  m = p.match(/^(\d+)! \/ (\d+)!/ );
  if (m) return String(fact(Number(m[1])) / fact(Number(m[2])));

  m = p.match(/^(\d+)\/(\d+) as a decimal/i);
  if (m) return String(Number(m[1]) / Number(m[2]));

  m = p.match(/^(\d+)\/(\d+)\s*\+\s*(\d+)\/(\d+)(?:\s*\+\s*(\d+)\/(\d+))? is/i);
  if (m) {
    const n1 = Number(m[1]) / Number(m[2]) + Number(m[3]) / Number(m[4]) + (m[5] ? Number(m[5]) / Number(m[6]) : 0);
    if (Math.abs(n1 - 1) < 1e-9) return "1";
    if (Math.abs(n1 - 0.75) < 1e-9) return "3/4";
    if (Math.abs(n1 - 5 / 6) < 1e-9) return "5/6";
    return String(n1);
  }

  m = p.match(/^(\d+)\/(\d+)\s*\/\s*(\d+)\/(\d+)/);
  if (m) {
    const n = (Number(m[1]) / Number(m[2])) * (Number(m[4]) / Number(m[3]));
    const g = gcd(Number(m[1]) * Number(m[4]), Number(m[2]) * Number(m[3]));
    return `${(Number(m[1]) * Number(m[4])) / g}/${(Number(m[2]) * Number(m[3])) / g}`;
  }

  m = p.match(/^(\d+)\/(\d+) of (\d+)/i);
  if (m) return String((Number(m[1]) / Number(m[2])) * Number(m[3]));

  m = p.match(/^log[_₁₀10]*\(?(\d+)\)?/i) && p.toLowerCase().includes("log");
  m = p.match(/log\s*[_₁₀]?\s*₁₀?\s*\(?\s*(\d+)/i) || p.match(/log10\((\d+)\)/i);
  if (m) return String(Math.log10(Number(m[1])));
  m = p.match(/log₂\((\d+)\)/) || p.match(/log2\((\d+)\)/i);
  if (m) return String(Math.log2(Number(m[1])));

  m = p.match(/^(\d+) choose (\d+)/i) || p.match(/₅C₂/);
  if (p.includes("₅C₂") || p.includes("5 choose 2")) return "10";
  if (m) {
    const n = Number(m[1]);
    const k = Number(m[2]);
    return String(fact(n) / (fact(k) * fact(n - k)));
  }

  m = p.match(/remainder when (\d+) is divided by (\d+)/i);
  if (m) return String(Number(m[1]) % Number(m[2]));

  m = p.match(/^(\d+) mod (\d+)/i);
  if (m) return String(Number(m[1]) % Number(m[2]));

  m = p.match(/GCD of (\d+) and (\d+)/i);
  if (m) return String(gcd(Number(m[1]), Number(m[2])));

  m = p.match(/LCM of (\d+) and (\d+)/i);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return String((a * b) / gcd(a, b));
  }

  m = p.match(/least common multiple of (\d+) and (\d+)/i);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return String((a * b) / gcd(a, b));
  }

  m = p.match(/greatest common factor of (\d+) and (\d+)/i);
  if (m) return String(gcd(Number(m[1]), Number(m[2])));

  m = p.match(/The mean of (\d+), (\d+), and (\d+)/i);
  if (m) return String((Number(m[1]) + Number(m[2]) + Number(m[3])) / 3);

  m = p.match(/A (\d+)% discount on \$(\d+)/i);
  if (m) return `$${Number(m[2]) * (1 - Number(m[1]) / 100)}`;

  m = p.match(/At (\d+) mph for (\d+) hours/i);
  if (m) return `${Number(m[1]) * Number(m[2])} miles`;

  m = p.match(/How many seconds in (\d+) minutes/i);
  if (m) return String(Number(m[1]) * 60);

  m = p.match(/Convert ([\d.]+) hours to minutes/i);
  if (m) return String(Number(m[1]) * 60);

  m = p.match(/slope of the line through \(0,0\) and \((\d+),(\d+)\)/i);
  if (m) return String(Number(m[2]) / Number(m[1]));

  m = p.match(/slope between \((\d+),(\d+)\) and \((\d+),(\d+)\)/i);
  if (m) return String((Number(m[4]) - Number(m[2])) / (Number(m[3]) - Number(m[1])));

  m = p.match(/Absolute value of [−-]?(\d+)/i);
  if (m) return String(Math.abs(Number(m[1])));

  m = p.match(/What is [−-](\d+)\s*\*\s*[−-](\d+)/i);
  if (m) return String(Number(m[1]) * Number(m[2]));

  m = p.match(/What is [−-](\d+)\s*\+\s*(\d+)/i);
  if (m) return String(-Number(m[1]) + Number(m[2]));

  m = p.match(/area of a circle with radius (\d+)/i);
  if (m) return `${Number(m[1]) ** 2}π`;

  m = p.match(/Circumference of a circle with radius (\d+)/i);
  if (m) return `${2 * Number(m[1])}π`;

  m = p.match(/sin\(90/i);
  if (m) return "1";
  m = p.match(/cos\(0/i);
  if (m) return "1";
  m = p.match(/tan\(45/i);
  if (m) return "1";

  m = p.match(/derivative of x\^2/i);
  if (m) return "2x";
  m = p.match(/integral of 2x/i);
  if (m) return "x² + C";
  m = p.match(/i\^2 in complex/i);
  if (m) return "-1";
  m = p.match(/determinant of \[\[2, 0\], \[0, 3\]\]/i);
  if (m) return "6";
  m = p.match(/8th triangular/i);
  if (m) return "36";
  m = p.match(/10th Fibonacci/i);
  if (m) return "55";
  m = p.match(/harmonic mean of 3 and 6/i);
  if (m) return "4";
  m = p.match(/How many diagonals in a hexagon/i);
  if (m) return "9";
  m = p.match(/hexagon can be split into how many equilateral/i);
  if (m) return "6";
  m = p.match(/sum 1 \+ 3 \+ 5 \+ 7 \+ 9/i);
  if (m) return "25";
  m = p.match(/geometric sequence 2, 6, 18/i);
  if (m) return "54";
  m = p.match(/If a = 2b and a \+ b = 18/i);
  if (m) return "6";
  m = p.match(/Convert 3\/7 to a decimal/i);
  if (m) return "0.43";
  m = p.match(/5\/8 as a decimal/i);
  if (m) return "0.625";
  m = p.match(/3\/4 as a decimal/i);
  if (m) return "0.75";
  m = p.match(/2\/5 as a decimal/i);
  if (m) return "0.4";
  m = p.match(/A right triangle with legs 3 and 4/i);
  if (m) return "5";
  m = p.match(/probability of rolling a 6/i);
  if (m) return "1/6";
  m = p.match(/both heads/i);
  if (m) return "1/4";
  m = p.match(/How many degrees in a right angle/i);
  if (m) return "90";
  m = p.match(/How many degrees in a straight line/i);
  if (m) return "180";
  m = p.match(/How many degrees in a full circle/i);
  if (m) return "360";
  m = p.match(/sum of angles in a triangle/i);
  if (m) return "180°";
  m = p.match(/sum of angles in a quadrilateral/i);
  if (m) return "360°";
  m = p.match(/Complementary angles add/i);
  if (m) return "90°";
  m = p.match(/Supplementary angles add/i);
  if (m) return "180°";
  m = p.match(/How many sides does a hexagon/i);
  if (m) return "6";
  m = p.match(/How many sides does an octagon/i);
  if (m) return "8";
  m = p.match(/A triangle has how many sides/i);
  if (m) return "3";
  m = p.match(/A pentagon has how many sides/i);
  if (m) return "5";
  m = p.match(/How many minutes in an hour/i);
  if (m) return "60";
  m = p.match(/How many hours in a day/i);
  if (m) return "24";
  m = p.match(/How many days in a leap year/i);
  if (m) return "366";
  m = p.match(/How many millimeters in a centimeter/i);
  if (m) return "10";
  m = p.match(/How many centimeters in a meter/i);
  if (m) return "100";
  m = p.match(/How many meters in a kilometer/i);
  if (m) return "1000";
  m = p.match(/How many inches in a foot/i);
  if (m) return "12";
  m = p.match(/How many feet in a yard/i);
  if (m) return "3";
  m = p.match(/How many ounces in a pound/i);
  if (m) return "16";
  m = p.match(/A dozen is how many/i);
  if (m) return "12";
  m = p.match(/How many quarters make a dollar/i);
  if (m) return "4";
  m = p.match(/Round ([\d.]+) to the nearest whole/i);
  if (m) return String(Math.round(Number(m[1])));
  m = p.match(/0\.5 as a fraction/i);
  if (m) return "1/2";
  m = p.match(/0\.25 as a fraction/i);
  if (m) return "1/4";
  m = p.match(/π is approximately/i);
  if (m) return "3.14";
  m = p.match(/^e is approximately/i);
  if (m) return "2.72";
  m = p.match(/golden ratio/i);
  if (m) return "1.62";
  m = p.match(/30-60-90 triangle with short side 1 has hypotenuse/i);
  if (m) return "2";
  m = p.match(/If 5x ≡ 1 \(mod 12\)/i);
  if (m) return "5";
  m = p.match(/2\^3 \* 3\^2|2³ \* 3²|2\^3 × 3\^2/i);
  if (p.includes("2^3") && p.includes("3^2")) return "72";
  if (p.includes("2³") && p.includes("3²")) return "72";
  m = p.match(/What is 2\^3 \* 3\^2/i);
  if (m) return "72";
  m = p.match(/The next number in 2, 4, 6, 8/i);
  if (m) return "10";
  m = p.match(/The next number in 5, 10, 15, 20/i);
  if (m) return "25";
  m = p.match(/median of 1, 7, 3/i);
  if (m) return "3";
  m = p.match(/Scientific notation: 3,000/i);
  if (m) return "3 × 10³";
  m = p.match(/Variance of a constant/i);
  if (m) return "0";
  return null;
}

export function auditMath(items) {
  const errors = [];
  for (const item of items) {
    const expect = computeMath(item.q);
    if (expect == null) continue;
    if (!sameNum(item.answer, expect) && nstr(item.answer) !== nstr(expect)) {
      // allow 9π vs 9π, 180° vs 180
      const a = nstr(item.answer).replace("degrees", "").replace("°", "");
      const b = nstr(expect).replace("°", "");
      if (a === b || a.includes(b) || b.includes(a)) continue;
      errors.push({
        kind: "math",
        where: `${item.file}:${item.line}`,
        q: item.q,
        detail: `Computed ${expect}, plate says ${item.answer}.`,
      });
    }
  }
  return errors;
}

export function isLookupPlate(item) {
  const q = item.q.toLowerCase();
  if (computeMath(item.q) != null) return false;
  if (/which of these is (an )?(even|odd|prime|composite)/i.test(item.q)) return false;
  if (/which is larger/i.test(item.q)) return false;
  const keys = [
    "capital",
    "based in",
    "calls ",
    "founded",
    "born",
    "which city",
    "which country",
    "which state",
    "which team",
    "which sport",
    "who was",
    "who painted",
    "who directed",
    "president",
    "amendment",
    "war",
    "year",
    "in which",
    "sits in",
    "home to",
    "museum",
    "planet",
    "element",
    "formula",
  ];
  return keys.some((k) => q.includes(k));
}

function loadCache() {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return { hashes: {} };
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function wikiSearch(query) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "3");
  url.searchParams.set("format", "json");
  url.searchParams.set("utf8", "1");
  const res = await fetch(url, { headers: { "User-Agent": WIKI_UA } });
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1200));
    const retry = await fetch(url, { headers: { "User-Agent": WIKI_UA } });
    if (!retry.ok) throw new Error(`wiki search ${retry.status}`);
    const data = await retry.json();
    const hits = data.query?.search ?? [];
    return {
      titles: hits.map((h) => h.title),
      links: hits.map((h) => `https://en.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`),
    };
  }
  if (!res.ok) throw new Error(`wiki search ${res.status}`);
  const data = await res.json();
  const hits = data.query?.search ?? [];
  return {
    titles: hits.map((h) => h.title),
    links: hits.map((h) => `https://en.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`),
  };
}

async function wikiSummary(title) {
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

function searchQuery(item) {
  const q = item.q.replace(/[…?.]/g, " ").replace(/\s+/g, " ").trim();
  if (/^Which (NFL|NBA|MLB|NHL|MLS|football|baseball|hockey|soccer) team/i.test(q)) return item.answer;
  if (/calls .+ home/i.test(q)) return item.answer;
  let m = q.match(/^(?:The\s+)?(.+?)\s+(?:are|is|was|were)\s+based/i);
  if (m) return m[1];
  m = q.match(/^(?:The\s+)?(.+?)\s+(?:are|is|was|were)\s+/i);
  if (m && m[1].length > 3 && m[1].length < 64) return m[1];
  m = q.match(/capital of (.+)/i);
  if (m) return `${m[1]} capital`;
  m = q.match(/Who (?:painted|directed|wrote|founded|was) (.+)/i);
  if (m) return m[1];
  if (/^[A-Z]/.test(item.answer) && item.answer.length > 4 && /^(Who|Which|What was)/i.test(q)) {
    return item.answer;
  }
  return q
    .replace(/^(what is|which of these|how many|in which)\s+/i, "")
    .split(" ")
    .slice(0, 8)
    .join(" ");
}

function extractHas(text, needle) {
  const hay = text.toLowerCase();
  const n = needle.toLowerCase().replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  if (n.length < 3) return false;
  if (hay.includes(n)) return true;
  const words = n.split(" ").filter((w) => w.length > 3);
  if (words.length >= 2 && words.filter((w) => hay.includes(w)).length >= Math.ceil(words.length * 0.7)) {
    return true;
  }
  return false;
}

export async function auditFacts(items, { all = false, limit = 12, fetchImpl = fetch } = {}) {
  const cache = loadCache();
  const warnings = [];
  const errors = [];
  const pending = [];
  for (const item of items) {
    if (!isLookupPlate(item)) continue;
    const h = hashItem(item);
    const hit = cache.hashes[h];
    if (!all && hit && hit.ok) continue;
    if (!all && hit && hit.checked) continue;
    pending.push(item);
  }
  const slice = pending.slice(0, limit);
  let checked = 0;
  for (const item of slice) {
    const h = hashItem(item);
    try {
      globalThis.fetch = fetchImpl;
      const found = await wikiSearch(searchQuery(item));
      const title = found.titles[0];
      const link = found.links[0] ?? (title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` : null);
      if (!title) {
        cache.hashes[h] = { ok: false, checked: true, at: Date.now(), source: null, note: "no wiki hit" };
        warnings.push({
          kind: "fact",
          where: `${item.file}:${item.line}`,
          q: item.q,
          detail: "No Wikipedia hit — confirm by hand against an encyclopedia or official page.",
        });
        checked += 1;
        continue;
      }
      const sum = await wikiSummary(title);
      const text = `${sum?.extract ?? ""} ${sum?.description ?? ""} ${title}`;
      const source = sum?.content_urls?.desktop?.page ?? link;
      const ansHit = extractHas(text, item.answer);
      const distractorHits = item.choices.filter((c) => c !== item.answer && extractHas(text, c));
      if (ansHit) {
        cache.hashes[h] = { ok: true, checked: true, at: Date.now(), source, title };
      } else if (distractorHits.length && !ansHit) {
        cache.hashes[h] = { ok: false, checked: true, at: Date.now(), source, title };
        errors.push({
          kind: "fact",
          where: `${item.file}:${item.line}`,
          q: item.q,
          detail: `Wikipedia (${title}) mentions ${distractorHits[0]} but not ${item.answer}. ${source}`,
        });
      } else {
        cache.hashes[h] = { ok: false, checked: true, at: Date.now(), source, title, note: "unconfirmed" };
        warnings.push({
          kind: "fact",
          where: `${item.file}:${item.line}`,
          q: item.q,
          detail: `Unconfirmed on Wikipedia: ${title}. Answer ${JSON.stringify(item.answer)}. ${source}`,
        });
      }
      checked += 1;
      await new Promise((r) => setTimeout(r, 280));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) {
        warnings.push({
          kind: "fact",
          where: `${item.file}:${item.line}`,
          q: item.q,
          detail: "Wikipedia asked us to slow down — remaining plates wait for the next pass.",
        });
        break;
      }
      warnings.push({
        kind: "fact",
        where: `${item.file}:${item.line}`,
        q: item.q,
        detail: `Lookup failed (${msg}).`,
      });
      break;
    }
  }
  saveCache(cache);
  return { errors, warnings, checked, pending: pending.length };
}

export async function runAudit({ facts = false, allFacts = false, json = false, root = ROOT } = {}) {
  const items = loadQuestions(root);
  const validity = auditValidity(items);
  const math = auditMath(items);
  const craft = auditCraft(items);
  const semantics = auditSemantics(items);
  let fact = { errors: [], warnings: [], checked: 0, pending: 0 };
  if (facts) {
    fact = await auditFacts(items, { all: allFacts });
  }
  const errors = [...validity, ...math, ...craft.errors, ...semantics.errors, ...fact.errors];
  const warnings = [...craft.warnings, ...semantics.warnings, ...fact.warnings];
  const report = {
    at: new Date().toISOString(),
    total: items.length,
    errors,
    warnings,
    factsChecked: fact.checked,
    factsPending: fact.pending,
  };
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Trivia audit · ${items.length} plates · ${errors.length} errors · ${warnings.length} warnings`);
    for (const e of errors.slice(0, 40)) {
      console.log(`  ERR  ${e.where}  ${e.kind}  ${e.detail}`);
      console.log(`       ${e.q}`);
    }
    if (errors.length > 40) console.log(`  … ${errors.length - 40} more errors`);
    for (const w of warnings.slice(0, 20)) {
      console.log(`  WARN ${w.where}  ${w.detail}`);
    }
    if (facts) console.log(`  facts checked this pass: ${fact.checked} (${fact.pending} lookup plates queued)`);
  }
  return report;
}

function debounce(fn, ms) {
  let t = 0;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

export function watchTrivia(opts = {}) {
  const kick = debounce(() => {
    runAudit({ facts: true, ...opts }).catch((err) => console.error(err));
  }, 700);
  const targets = [BANK_DIR, join(ROOT, "src/game/trivia.ts")];
  for (const t of targets) {
    try {
      watch(t, { recursive: true }, (_ev, name) => {
        if (name && !String(name).endsWith(".ts")) return;
        console.log(`trivia changed · ${name ?? t}`);
        kick();
      });
    } catch (err) {
      console.error(`watch failed on ${t}:`, err);
    }
  }
  console.log("Trivia auditor watching banks. New or changed plates get a Wikipedia pass.");
  kick();
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const entry = process.argv[1] ? join(process.argv[1]) : "";
  return entry.endsWith("trivia-audit.mjs") || import.meta.url === `file://${entry}`;
}

if (isMain()) {
  const args = new Set(process.argv.slice(2));
  const json = args.has("--json");
  const facts = args.has("--facts") || args.has("--watch");
  const allFacts = args.has("--all-facts");
  if (args.has("--watch")) {
    watchTrivia({ json: false, allFacts: false });
  } else {
    runAudit({ facts, allFacts, json }).then((r) => {
      process.exit(r.errors.length ? 1 : 0);
    });
  }
}
