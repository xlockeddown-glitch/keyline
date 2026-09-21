#!/usr/bin/env node
/**
 * Trivia card topic-balance report and quota checks.
 *
 *   npm run trivia:balance
 *   npm run trivia:balance -- --json
 *   npm run trivia:quotas          # CI: exit 1 on error-level flags
 *   npm run trivia:quotas -- --warn
 *
 * Uses the same bank loader as trivia-audit.mjs. Rarity matches src/game/rarity.ts
 * bootstrap shares (keep in sync). User-facing copy says "trivia cards", never plates.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, parse as parsePath } from "node:path";
import { fileURLToPath } from "node:url";
import { extractQuestions, loadBankFiles } from "./trivia-audit.mjs";
import { projectRoot } from "./with-app-env.mjs";

const ROOT = projectRoot();
const REPORT_PATH = join(ROOT, ".grok/trivia-balance-report.json");

const RARITY_LADDER = ["white", "blue", "green", "amber", "red", "violet"];
const BOOTSTRAP = {
  1: [
    ["white", 70],
    ["blue", 30],
  ],
  2: [
    ["blue", 25],
    ["green", 50],
    ["amber", 25],
  ],
  3: [
    ["amber", 25],
    ["red", 60],
    ["violet", 15],
  ],
};

const DATE_RE =
  /\b(?:c\.?\s*)?(?:1[0-9]{3}|20[0-2][0-9])\b|\b\d{1,4}\s*(?:BCE|CE|B\.C\.E?\.?|A\.D\.)\b/i;
const NICK_RE = /\bnickname[ds]?|\bnicknamed\b|\balso called\b|\bknown as the\b|\bclub is nicknamed\b/i;
const MULTI_RE = /\band then\b|\bfirst\b.+\bthen\b|\bfollowed by\b|\bboth\b.+\band\b/i;
const POP_RE =
  /\b(?:oscar|emmy|grammy|marvel|disney|netflix|tiktok|billboard|sitcom|blockbuster|pop star|rapper|hollywood film|\bmtv\b|super bowl halftime)\b/i;
const LANDMARK_RE =
  /\beiffel|\bstatue of liberty\b|\bbig ben\b|\bgrand canyon\b|\bmount rushmore\b|\bwhite house\b|\bgolden gate\b|\bwhat is the capital of\b/i;

export function loadQuotas(root = ROOT) {
  return JSON.parse(readFileSync(join(root, "scripts/trivia-quotas.json"), "utf8"));
}

export function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function cardId(q, answer = "") {
  return `p${fnv1a(`${q}\0${answer}`).toString(16).padStart(8, "0")}`;
}

function bootstrapRarity(diff, id) {
  const roll = fnv1a(id) % 100;
  const shares = BOOTSTRAP[diff] ?? BOOTSTRAP[2];
  let acc = 0;
  for (const [tier, pct] of shares) {
    acc += pct;
    if (roll < acc) return tier;
  }
  return shares[shares.length - 1][0];
}

export function tagNudge(item, city = false) {
  const blob = `${item.q} ${item.answer} ${item.fact ?? ""}`;
  let plus = 0;
  let minus = 0;
  if (city) plus = 1;
  if (DATE_RE.test(blob)) plus = 1;
  if (MULTI_RE.test(blob)) plus = 1;
  if (NICK_RE.test(blob)) plus = 1;
  if (POP_RE.test(blob)) minus = 1;
  if ((item.diff ?? 2) === 1 && LANDMARK_RE.test(blob)) minus = 1;
  const net = plus - minus;
  if (net > 0) return 1;
  if (net < 0) return -1;
  return 0;
}

export function assignRarity(item, hint = {}) {
  const diff = item.diff ?? 2;
  const id = item.id ?? cardId(item.q, item.answer);
  const base = bootstrapRarity(diff, id);
  const idx = RARITY_LADDER.indexOf(base);
  const next = Math.max(0, Math.min(RARITY_LADDER.length - 1, idx + tagNudge(item, hint.city)));
  return RARITY_LADDER[next];
}

function stripLineCommentsAndStrings(line) {
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === "/" && line[i + 1] === "/") break;
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      i += 1;
      while (i < line.length && line[i] !== q) {
        if (line[i] === "\\") i += 1;
        i += 1;
      }
      i += 1;
      continue;
    }
    out += line[i];
    i += 1;
  }
  return out;
}

/** Key path at each 1-based line that contains q(. */
export function keyPathByLine(src) {
  const lines = src.split("\n");
  const stack = [];
  let depth = 0;
  const at = new Map();
  for (let li = 0; li < lines.length; li++) {
    const line = stripLineCommentsAndStrings(lines[li]);
    const exportConst = /export\s+const\s+([A-Za-z0-9_]+)/.exec(line);
    const keyOpen = /^\s*([A-Za-z0-9_]+)\s*:/.exec(line);
    const opens = (line.match(/[{\[]/g) || []).length;
    const closes = (line.match(/[}\]]/g) || []).length;
    if (opens) {
      const key = exportConst?.[1] ?? (keyOpen ? keyOpen[1] : "");
      if (key) stack.push({ key, depth });
    }
    if (/\bq\s*\(/.test(line)) {
      at.set(li + 1, stack.map((s) => s.key));
    }
    depth += opens - closes;
    while (stack.length && depth <= stack[stack.length - 1].depth) stack.pop();
  }
  return at;
}

export function compileNichePatterns(quotas) {
  const out = [];
  for (const [id, spec] of Object.entries(quotas.niches ?? {})) {
    out.push({ id, topic: spec.topic, re: new RegExp(spec.pattern, "i") });
  }
  return out;
}

export function matchNiche(text, niches) {
  for (const n of niches) {
    if (n.re.test(text)) return n.id;
  }
  return null;
}

export function bankName(file) {
  return parsePath(file).name;
}

export function classifyItem(item, path, quotas, niches) {
  const bank = bankName(item.file);
  const keys = (path ?? []).filter(Boolean);
  const city = keys.find((k) => quotas.cityIds.includes(k)) ?? null;
  const cat = keys.find((k) => quotas.cats.includes(k)) ?? null;
  const place = bank === "place" ? (keys.find((k) => quotas.placeTopics.includes(k)) ?? null) : null;
  const blob = `${item.q} ${item.answer}`;
  const niche = matchNiche(blob, niches);
  const deepBank = quotas.deepCutBanks.includes(bank);
  const specialty = deepBank || ["tarantula", "metrology", "aerospace-ops"].includes(niche);
  let topic = cat && quotas.topics.includes(cat) ? cat : null;
  if (!topic && place) {
    if (place === "natural-history") topic = "nature";
    else if (["football", "baseball", "basketball"].includes(place)) topic = "sports";
    else if (place === "bbq") topic = "food";
    else if (["theatre", "music", "art"].includes(place)) topic = "arts";
    else if (quotas.topics.includes(place)) topic = place;
    else topic = "local";
  }
  const hint = `${bank} ${keys.join(" ")}`;
  if (!topic) {
    if (/math/i.test(hint)) topic = "math";
    else if (/science/i.test(hint)) topic = "science";
    else if (/history/i.test(hint)) topic = "history";
    else if (/nature/i.test(hint)) topic = "nature";
    else if (city) topic = "local";
    else topic = "local";
  }
  const scope = city ? "city" : bank === "place" ? "place" : specialty ? "specialty" : "general";
  const rarity = assignRarity(item, { city: Boolean(city) });
  const nudge = tagNudge(item, Boolean(city));
  const tags = [];
  if (city) tags.push("city-specific");
  if (nudge === 1) tags.push("rarity-plus");
  if (nudge === -1) tags.push("rarity-minus");
  if (niche) tags.push(niche);
  if (specialty) tags.push("specialty");
  if (POP_RE.test(blob)) tags.push("pop-culture");
  return {
    q: item.q,
    answer: item.answer,
    diff: item.diff ?? 2,
    file: item.file,
    line: item.line,
    bank,
    city,
    cat,
    place,
    topic,
    niche,
    specialty,
    scope,
    rarity,
    tags,
    id: cardId(item.q, item.answer),
  };
}

export function catalogFromSource(src, file, quotas = loadQuotas()) {
  const items = extractQuestions(src, file);
  const paths = keyPathByLine(src);
  const niches = compileNichePatterns(quotas);
  return items.map((item) => classifyItem(item, paths.get(item.line) ?? [], quotas, niches));
}

export function loadCatalog(root = ROOT, quotas = loadQuotas(root)) {
  const niches = compileNichePatterns(quotas);
  const catalog = [];
  for (const file of loadBankFiles(root)) {
    const src = readFileSync(file, "utf8");
    const items = extractQuestions(src, file);
    const paths = keyPathByLine(src);
    for (const item of items) {
      catalog.push(classifyItem(item, paths.get(item.line) ?? [], quotas, niches));
    }
  }
  return catalog;
}

function tally(list, keyFn) {
  const counts = {};
  for (const row of list) {
    const k = keyFn(row);
    if (k == null || k === "") continue;
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

function shares(counts, total) {
  return Object.fromEntries(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k, n]) => [k, { count: n, share: total ? n / total : 0 }]),
  );
}

export function flagInventory(catalog, quotas) {
  const total = catalog.length;
  const t = quotas.thresholds;
  const flags = [];
  const byTopic = tally(catalog, (r) => r.topic);
  const byNiche = tally(catalog, (r) => r.niche);
  const byBank = tally(catalog, (r) => r.bank);
  for (const [topic, n] of Object.entries(byTopic)) {
    const share = n / total;
    if (share > t.maxTopicShare) {
      flags.push({
        level: "error",
        kind: "over-topic",
        key: topic,
        share,
        limit: t.maxTopicShare,
        detail: `topic ${topic} is ${(share * 100).toFixed(1)}% of trivia cards (max ${(t.maxTopicShare * 100).toFixed(0)}%)`,
      });
    }
  }
  for (const [niche, n] of Object.entries(byNiche)) {
    const share = n / total;
    if (share > t.maxNicheShare) {
      flags.push({
        level: "error",
        kind: "over-niche",
        key: niche,
        share,
        limit: t.maxNicheShare,
        detail: `niche ${niche} is ${(share * 100).toFixed(1)}% of trivia cards (max ${(t.maxNicheShare * 100).toFixed(0)}%)`,
      });
    }
  }
  for (const [bank, n] of Object.entries(byBank)) {
    const share = n / total;
    if (share > t.maxBankShare) {
      flags.push({
        level: "warn",
        kind: "over-bank",
        key: bank,
        share,
        limit: t.maxBankShare,
        detail: `bank ${bank} is ${(share * 100).toFixed(1)}% of trivia cards (max ${(t.maxBankShare * 100).toFixed(0)}%)`,
      });
    }
  }
  const specialty = catalog.filter((r) => r.specialty);
  if (specialty.length >= 20) {
    const easy = specialty.filter((r) => quotas.easyRarities.includes(r.rarity)).length / specialty.length;
    const deep = specialty.filter((r) => quotas.deepRarities.includes(r.rarity)).length / specialty.length;
    if (easy > t.specialtyMaxEasyShare) {
      flags.push({
        level: "error",
        kind: "specialty-easy",
        share: easy,
        limit: t.specialtyMaxEasyShare,
        detail: `specialty trivia cards are ${(easy * 100).toFixed(1)}% white/blue (max ${(t.specialtyMaxEasyShare * 100).toFixed(0)}%) — deep cuts should sit on red/violet`,
      });
    }
    if (deep < t.specialtyMinDeepRarityShare) {
      flags.push({
        level: "warn",
        kind: "specialty-shallow",
        share: deep,
        limit: t.specialtyMinDeepRarityShare,
        detail: `specialty trivia cards are only ${(deep * 100).toFixed(1)}% red/violet (want ≥ ${(t.specialtyMinDeepRarityShare * 100).toFixed(0)}%)`,
      });
    }
  }
  return flags;
}

export function checkGeneratorBatch(rows, quotas, { bank = "general" } = {}) {
  const flags = [];
  const g = quotas.generator;
  const niches = compileNichePatterns(quotas);
  const total = rows.length;
  if (!total) return flags;
  let specialty = 0;
  const topicCount = {};
  let deepEasy = 0;
  let deepN = 0;
  for (const row of rows) {
    const q = row.q ?? row[0];
    const answer = row.answer ?? row[2];
    const diff = row.diff ?? row[3] ?? 2;
    const cat = row.cat ?? row.topic ?? "local";
    const text = `${q} ${answer}`;
    const niche = matchNiche(text, niches);
    const isSpec = quotas.deepCutBanks.includes(bank) || ["tarantula", "metrology", "aerospace-ops"].includes(niche);
    if (isSpec) {
      specialty += 1;
      deepN += 1;
      if (diff < g.deepCutMinDiff) deepEasy += 1;
    }
    const topic = quotas.topics.includes(cat) ? cat : "local";
    topicCount[topic] = (topicCount[topic] ?? 0) + 1;
  }
  const specShare = specialty / total;
  if (!quotas.deepCutBanks.includes(bank) && specShare > g.bulkMaxSpecialtyShare) {
    flags.push({
      level: "error",
      kind: "gen-specialty",
      share: specShare,
      limit: g.bulkMaxSpecialtyShare,
      detail: `bulk ${bank} specialty share ${(specShare * 100).toFixed(1)}% > ${(g.bulkMaxSpecialtyShare * 100).toFixed(0)}% — keep new bulk general/city-shared`,
    });
  }
  for (const [topic, n] of Object.entries(topicCount)) {
    const share = n / total;
    if (share > g.bulkMaxTopicShare) {
      flags.push({
        level: "error",
        kind: "gen-topic",
        key: topic,
        share,
        limit: g.bulkMaxTopicShare,
        detail: `bulk ${bank} topic ${topic} is ${(share * 100).toFixed(1)}% (max ${(g.bulkMaxTopicShare * 100).toFixed(0)}%)`,
      });
    }
  }
  if (deepN >= 8) {
    const easyShare = deepEasy / deepN;
    if (easyShare > g.deepCutMaxEasyShare) {
      flags.push({
        level: "error",
        kind: "gen-deep-easy",
        share: easyShare,
        limit: g.deepCutMaxEasyShare,
        detail: `deep-cut trivia cards are ${(easyShare * 100).toFixed(1)}% below diff ${g.deepCutMinDiff} (max ${(g.deepCutMaxEasyShare * 100).toFixed(0)}%) — keep deep cuts mainly red/violet`,
      });
    }
  }
  return flags;
}

export function buildReport(catalog, quotas) {
  const total = catalog.length;
  const flags = flagInventory(catalog, quotas);
  return {
    at: new Date().toISOString(),
    total,
    byTopic: shares(tally(catalog, (r) => r.topic), total),
    byNiche: shares(tally(catalog, (r) => r.niche), total),
    byBank: shares(tally(catalog, (r) => r.bank), total),
    byCity: shares(tally(catalog, (r) => r.city ?? "(shared)"), total),
    byRarity: shares(tally(catalog, (r) => r.rarity), total),
    byDiff: shares(tally(catalog, (r) => String(r.diff)), total),
    byScope: shares(tally(catalog, (r) => r.scope), total),
    specialty: catalog.filter((r) => r.specialty).length,
    flags,
  };
}

function pct(share) {
  return `${(share * 100).toFixed(1)}%`;
}

export function formatReport(report) {
  const lines = [];
  lines.push(`Trivia card topic balance · ${report.total} cards`);
  const dump = (title, bag, n = 12) => {
    lines.push("");
    lines.push(title);
    const rows = Object.entries(bag).slice(0, n);
    for (const [k, v] of rows) {
      lines.push(`  ${k.padEnd(22)} ${String(v.count).padStart(5)}  ${pct(v.share)}`);
    }
  };
  dump("By topic", report.byTopic);
  dump("By niche", report.byNiche);
  dump("By bank", report.byBank);
  dump("By city", report.byCity);
  dump("By rarity", report.byRarity);
  dump("By difficulty", report.byDiff);
  dump("By scope", report.byScope);
  lines.push("");
  lines.push(`Specialty trivia cards: ${report.specialty}`);
  if (!report.flags.length) {
    lines.push("Flags: none");
  } else {
    lines.push("Flags:");
    for (const f of report.flags) {
      lines.push(`  ${f.level.toUpperCase()}  ${f.detail}`);
    }
  }
  return lines.join("\n");
}

export function runBalance({ root = ROOT, json = false, warn = false, check = false } = {}) {
  const quotas = loadQuotas(root);
  const catalog = loadCatalog(root, quotas);
  const report = buildReport(catalog, quotas);
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  if (json) console.log(JSON.stringify(report, null, 2));
  else console.log(formatReport(report));
  const errors = report.flags.filter((f) => f.level === "error");
  const fail = check && !warn && errors.length > 0;
  return { report, fail, quotas };
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const entry = process.argv[1] ? join(process.argv[1]) : "";
  return entry.endsWith("trivia-balance.mjs") || import.meta.url === `file://${entry}`;
}

if (isMain()) {
  const args = new Set(process.argv.slice(2));
  const { fail } = runBalance({
    json: args.has("--json"),
    warn: args.has("--warn"),
    check: args.has("--check") || args.has("--quotas"),
  });
  process.exit(fail ? 1 : 0);
}
