import { randomBytes } from "node:crypto";
import { CITIES } from "./data";
import { marketLanternById } from "./nightMarket";
import { DOOR_QUIZZES } from "./doorQuizzes";
import { sealPlate } from "./rarity";
import { everyCard, everyCardCat, pickTrivia } from "./trivia";
import { publicCardId, publicFormatId, type TriviaDeps } from "./triviaService";
import { formatCards } from "./banks/formats";
import type { CityId, FormatQ, Poi, Tier, TriviaCat, TriviaQ } from "./types";

/**
 * 0.0.53 — SERVER-ONLY card index (the whole bank plus door quizzes), by raw id and by public id. Imported only
 * from server-function handlers (triviaApi.ts, friendApi.ts) through a dynamic import, so it never reaches the
 * browser bundle (`npm run qa:no-answers` checks).
 */
let byId: Map<string, TriviaQ> | null = null;

function build(): Map<string, TriviaQ> {
  const m = new Map<string, TriviaQ>();
  const add = (c: TriviaQ) => {
    if (!m.has(c.id)) m.set(c.id, c);
    const pub = publicCardId(c);
    if (!m.has(pub)) m.set(pub, c);
  };
  for (const c of everyCard()) add(c);
  for (const seeds of Object.values(DOOR_QUIZZES)) for (const s of seeds) add(sealPlate(s, { city: true }));
  return m;
}

/** A card by public id (what the browser holds) or raw id (old saves, the server's own records). */
export function cardAny(id: string): TriviaQ | null {
  byId ??= build();
  return byId.get(id) ?? null;
}

let fmtById: Map<string, FormatQ> | null = null;
let fmtAll: FormatQ[] | null = null;

/**
 * 0.1.158: a True/False or Closest Number card by public id (`f…`) or raw id. A separate index: cardAny and
 * everyCard never see these, so a friend ticket can't be made from one.
 */
export function formatAny(id: string): FormatQ | null {
  if (!fmtById) {
    fmtAll = formatCards();
    const m = new Map<string, FormatQ>();
    for (const c of fmtAll) {
      if (!m.has(c.id)) m.set(c.id, c);
      m.set(publicFormatId(c), c);
    }
    fmtById = m;
  }
  return fmtById.get(id) ?? null;
}

/**
 * 0.1.158: a format card for this lamp. TF: a statement in the chosen field (same colour first, then any TF colour).
 * Closest Number: a sum for the lamp's colour. Unseen cards only; null when none is left (the lamp deals four choices).
 */
export function pickFormatCard(kind: "tf" | "near", cat: TriviaCat, tier: Tier, avoid: readonly string[], roll: number): FormatQ | null {
  formatAny("");
  const seen = new Set(avoid);
  const fresh = fmtAll!.filter((c) => c.kind === kind && !seen.has(c.id) && !seen.has(c.q) && (c.kind === "near" ? c.rarity === tier : c.cat === cat));
  const pool = kind === "tf" ? (fresh.some((c) => c.rarity === tier) ? fresh.filter((c) => c.rarity === tier) : fresh) : fresh;
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))]!;
}

let catById: Map<string, TriviaCat> | null = null;

/** 0.0.98: a card's trivia category by raw or public id (door quizzes count as local). Server-only. */
export function cardCat(id: string): TriviaCat | null {
  if (!catById) {
    const m = new Map<string, TriviaCat>();
    for (const [c, cat] of everyCardCat()) {
      if (!m.has(c.id)) m.set(c.id, cat);
      const pub = publicCardId(c);
      if (!m.has(pub)) m.set(pub, cat);
    }
    for (const seeds of Object.values(DOOR_QUIZZES)) for (const s of seeds) {
      const c = sealPlate(s, { city: true });
      if (!m.has(c.id)) m.set(c.id, "local");
    }
    catById = m;
  }
  return catById.get(id) ?? null;
}

function namedPoi(city: CityId, poiId: string): Poi | null {
  // 0.1.7: the open market's three lanterns are real lamps while it is open (rebuilt from the baked street).
  return CITIES[city]?.pois.find((p) => p.id === poiId) ?? marketLanternById(city, poiId, Date.now());
}

const RETUNE_MS = 10 * 60 * 1000;
let retuneAt = 0;
/** The weekly rarity retune (overrides + quarantine) the picker uses, refreshed from Postgres every 10 minutes. */
async function freshRetune() {
  if (Date.now() - retuneAt < RETUNE_MS) return;
  retuneAt = Date.now();
  try {
    const { getSql } = await import("@/lib/db");
    const { loadOverrides, loadQuarantine } = await import("./retuneRun");
    const { setQuarantine, setRetune } = await import("./rarity");
    const sql = await getSql();
    setRetune(await loadOverrides(sql));
    setQuarantine(await loadQuarantine(sql));
  } catch {
    /* no database (or it's down): the bank's own rarities stand */
  }
}

const globalRef = globalThis as { __keylineTriviaSecret__?: string };
function secret(): string {
  const env = (k: string) => process.env[k]?.trim() || undefined;
  const s = env("TRIVIA_TOKEN_SECRET") ?? env("BETTER_AUTH_SECRET");
  if (s) return `trivia:${s}`;
  // Preview without a configured secret: process-stable random key (tokens only live for one card).
  globalRef.__keylineTriviaSecret__ ??= `trivia:preview:${randomBytes(32).toString("hex")}`;
  return globalRef.__keylineTriviaSecret__;
}

export async function triviaDeps(): Promise<TriviaDeps> {
  await freshRetune();
  return {
    now: () => Date.now(),
    secret: secret(),
    pick: pickTrivia,
    card: cardAny,
    fmt: formatAny,
    pickFormat: pickFormatCard,
    namedPoi,
    sql: async () => (await import("@/lib/db")).getSql(),
  };
}
