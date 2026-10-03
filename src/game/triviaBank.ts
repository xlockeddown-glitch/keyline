import { randomBytes } from "node:crypto";
import { CITIES, seriesOf, seriesPoi } from "./data";
import { DOOR_QUIZZES } from "./doorQuizzes";
import { sealPlate } from "./rarity";
import { everyCard, pickTrivia } from "./trivia";
import { publicCardId, type TriviaDeps } from "./triviaService";
import type { CityId, Poi, TriviaQ } from "./types";

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

function namedPoi(city: CityId, poiId: string): Poi | null {
  return CITIES[city]?.pois.find((p) => p.id === poiId) ?? null;
}

function series(poiId: string) {
  const s = seriesOf(poiId);
  return s ? { poi: seriesPoi(s), cost: s.cost, diffs: s.diffs } : null;
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
    namedPoi,
    series,
    sql: async () => (await import("@/lib/db")).getSql(),
  };
}
