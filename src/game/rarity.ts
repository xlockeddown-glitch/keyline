import type { TriviaDiff, TriviaQ, TriviaSeed, Tier } from "./types";

export const RARITY_LADDER: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

/** Locked bootstrap shares from TriviaDiff. */
export const BOOTSTRAP: Record<TriviaDiff, readonly (readonly [Tier, number])[]> = {
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

export const rarityStats = { downfills: 0, fallbacks: 0 };

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function plateId(q: string, answer = ""): string {
  return `p${fnv1a(`${q}\0${answer}`).toString(16).padStart(8, "0")}`;
}

/** 0–99 from plate id. Stable across boots. */
export function hashUnit(id: string): number {
  return fnv1a(id) % 100;
}

export function bootstrapRarity(diff: TriviaDiff, id: string): Tier {
  const roll = hashUnit(id);
  const shares = BOOTSTRAP[diff] ?? BOOTSTRAP[2];
  let acc = 0;
  for (const [tier, pct] of shares) {
    acc += pct;
    if (roll < acc) return tier;
  }
  return shares[shares.length - 1]![0];
}

const DATE_RE =
  /\b(?:c\.?\s*)?(?:1[0-9]{3}|20[0-2][0-9])\b|\b\d{1,4}\s*(?:BCE|CE|B\.C\.E?\.?|A\.D\.)\b/i;
const NICK_RE = /\bnickname[ds]?|\bnicknamed\b|\balso called\b|\bknown as the\b|\bclub is nicknamed\b/i;
const MULTI_RE = /\band then\b|\bfirst\b.+\bthen\b|\bfollowed by\b|\bboth\b.+\band\b/i;
const POP_RE =
  /\b(?:oscar|emmy|grammy|marvel|disney|netflix|tiktok|billboard|sitcom|blockbuster|pop star|rapper|hollywood film|\bmtv\b|super bowl halftime)\b/i;
const LANDMARK_RE =
  /\beiffel|\bstatue of liberty\b|\bbig ben\b|\bgrand canyon\b|\bmount rushmore\b|\bwhite house\b|\bgolden gate\b|\bwhat is the capital of\b/i;

export function tagNudge(item: TriviaSeed, city = false): -1 | 0 | 1 {
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

export function assignRarity(item: TriviaSeed, hint: { city?: boolean } = {}): Tier {
  const diff = (item.diff ?? 2) as TriviaDiff;
  const id = item.id ?? plateId(item.q, item.answer);
  const base = bootstrapRarity(diff, id);
  const idx = RARITY_LADDER.indexOf(base);
  const next = Math.max(0, Math.min(RARITY_LADDER.length - 1, idx + tagNudge(item, hint.city)));
  return RARITY_LADDER[next]!;
}

export function sealPlate(item: TriviaSeed, hint: { city?: boolean } = {}): TriviaQ {
  const diff = (item.diff ?? 2) as TriviaDiff;
  const id = item.id ?? plateId(item.q, item.answer);
  const rarity = assignRarity({ ...item, id, diff }, hint);
  return {
    q: item.q,
    choices: item.choices,
    answer: item.answer,
    fact: item.fact,
    diff,
    id,
    rarity,
  };
}

export function stampCityRecord(bank: Partial<Record<string, Partial<Record<string, TriviaQ[]>>>>) {
  for (const city of Object.values(bank)) {
    if (!city) continue;
    for (const cat of Object.keys(city)) {
      const list = city[cat as keyof typeof city];
      if (!Array.isArray(list)) continue;
      (city as Record<string, TriviaQ[]>)[cat] = list.map((p) => sealPlate(p, { city: true }));
    }
  }
}

export function downStep(tier: Tier): Tier | null {
  const i = RARITY_LADDER.indexOf(tier);
  if (i <= 0) return null;
  return RARITY_LADDER[i - 1]!;
}

export function upStep(tier: Tier): Tier | null {
  const i = RARITY_LADDER.indexOf(tier);
  if (i < 0 || i >= RARITY_LADDER.length - 1) return null;
  return RARITY_LADDER[i + 1]!;
}

/** Weekly retune overlay. Assigner is unchanged; pick uses this. */
let retuneMap: Record<string, Tier> = {};
let quarantined = new Set<string>();

export function setRetune(map: Record<string, Tier> | null | undefined) {
  retuneMap = map ?? {};
}

export function getRetune() {
  return retuneMap;
}

export function setQuarantine(ids: Iterable<string> | null | undefined) {
  quarantined = new Set(ids ?? []);
}

export function getQuarantine() {
  return quarantined;
}

export function effectiveRarity(item: { id: string; rarity: Tier }): Tier {
  return retuneMap[item.id] ?? item.rarity;
}

export function isSeen(item: TriviaQ, seen: Set<string>) {
  return seen.has(item.id) || seen.has(item.q);
}

function ofRarity(list: TriviaQ[], rarity: Tier, seen: Set<string>) {
  return list.filter((x) => effectiveRarity(x) === rarity && !isSeen(x, seen) && !quarantined.has(x.id));
}

function draw<T>(list: T[]): T {
  return list[(Math.random() * list.length) | 0]!;
}

function drawSoft(list: TriviaQ[], wantDiff?: TriviaDiff) {
  if (wantDiff != null) {
    const exact = list.filter((x) => x.diff === wantDiff);
    if (exact.length) return draw(exact);
  }
  return draw(list);
}

export function pickUnseenRarity(
  want: Tier,
  city: TriviaQ[],
  global: TriviaQ[],
  seen: Set<string>,
  wantDiff?: TriviaDiff,
): { plate: TriviaQ; downfill: boolean } | null {
  let pool = ofRarity(city, want, seen);
  if (pool.length) return { plate: drawSoft(pool, wantDiff), downfill: false };
  pool = ofRarity(global, want, seen);
  if (pool.length) return { plate: drawSoft(pool, wantDiff), downfill: false };
  const down = downStep(want);
  if (!down) return null;
  pool = ofRarity(city, down, seen);
  if (!pool.length) pool = ofRarity(global, down, seen);
  if (!pool.length) return null;
  rarityStats.downfills += 1;
  console.info(`[trivia] down-fill ${want} → ${down} (${rarityStats.downfills})`);
  return { plate: drawSoft(pool, wantDiff), downfill: true };
}

export function allowedRarities(want: Tier): Set<Tier> {
  const i = RARITY_LADDER.indexOf(want);
  return new Set(RARITY_LADDER.slice(0, Math.max(0, i) + 1));
}

export function emptyBuckets(): Record<Tier, number> {
  return { white: 0, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
}

export function countRarity(items: TriviaQ[]): Record<Tier, number> {
  const out = emptyBuckets();
  const seen = new Set<string>();
  for (const x of items) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out[x.rarity] += 1;
  }
  return out;
}
