/**
 * 0.1.154 scout collars. 12,000 coin for one vat color on a scout you already hired.
 * Ten scouts and the six vault paints (not prism) are each bought once:
 * `collar:<scout>:<color>`. A later wear of a color you own is `collaron:<scout>:<ms>`
 * and does not charge. The coat mask covers the whole coat, so the scarf is a CSS band
 * in that vat color. It does not recolor the coat and does not change pay.
 */
import { VAULT_PAINTS, type VaultPaint } from "./ingredients.ts";
import type { ScoutId } from "./types.ts";

export const COLLAR_PRICE = 12_000;
/** The vat's six vault colors. Prism is not a collar. */
export const COLLAR_COLORS = VAULT_PAINTS;
export type CollarColor = VaultPaint;

export const COLLAR_SCOUTS = ["raccoon", "cat", "turtle", "owl", "corgi", "sloth", "giraffe", "panda", "fox", "lynx"] as const satisfies readonly ScoutId[];

export type CollarBook = {
  /** Paid pairs, "raccoon:amber". */
  owned: string[];
  /** The color on each scout. Absent means no scarf. */
  worn: Partial<Record<ScoutId, CollarColor>>;
};

export function isCollarColor(id: unknown): id is CollarColor {
  return typeof id === "string" && (COLLAR_COLORS as readonly string[]).includes(id);
}

export function isCollarScout(id: string): id is ScoutId {
  return (COLLAR_SCOUTS as readonly string[]).includes(id);
}

export function collarPair(scout: string, color: string): string {
  return `${scout}:${color}`;
}

export function collarKey(scout: string, color: string): string {
  return `collar:${scout}:${color}`;
}

export function emptyCollarBook(): CollarBook {
  return { owned: [], worn: {} };
}

function pairParts(pair: string): { scout: ScoutId; color: CollarColor } | null {
  const i = pair.indexOf(":");
  if (i < 1) return null;
  const scout = pair.slice(0, i);
  const color = pair.slice(i + 1);
  if (!isCollarScout(scout) || !isCollarColor(color)) return null;
  return { scout, color };
}

/** Drop unknown scouts and colors. A worn color that was never paid for does not stay. */
export function cleanCollarBook(raw: unknown): CollarBook {
  const o = raw && typeof raw === "object" ? (raw as { owned?: unknown; worn?: unknown }) : {};
  const owned: string[] = [];
  if (Array.isArray(o.owned)) {
    for (const item of o.owned) {
      if (typeof item !== "string" || !pairParts(item)) continue;
      if (!owned.includes(item)) owned.push(item);
    }
  }
  const worn: CollarBook["worn"] = {};
  if (o.worn && typeof o.worn === "object") {
    for (const [scout, color] of Object.entries(o.worn as Record<string, unknown>)) {
      if (!isCollarScout(scout) || !isCollarColor(color)) continue;
      if (!owned.includes(collarPair(scout, color))) continue;
      worn[scout] = color;
    }
  }
  return { owned, worn };
}

/**
 * Ledger rows in time order. A purchase wears that color. A later `collaron` row
 * wears an owned color without charging.
 */
export function parseCollarRows(rows: readonly { op_key: string; detail?: string | null }[]): CollarBook {
  const book = emptyCollarBook();
  for (const row of rows) {
    const key = row.op_key;
    if (key.startsWith("collaron:")) {
      const scout = key.split(":")[1] ?? "";
      let color = "";
      try {
        color = String((JSON.parse(row.detail || "{}") as { color?: string }).color ?? "");
      } catch {
        color = "";
      }
      if (isCollarScout(scout) && isCollarColor(color) && book.owned.includes(collarPair(scout, color))) book.worn[scout] = color;
      continue;
    }
    if (!key.startsWith("collar:")) continue;
    const parts = key.split(":");
    const scout = parts[1] ?? "";
    const color = parts[2] ?? "";
    if (!isCollarScout(scout) || !isCollarColor(color)) continue;
    const pair = collarPair(scout, color);
    if (!book.owned.includes(pair)) book.owned.push(pair);
    book.worn[scout] = color;
  }
  return book;
}

export function withCollar(book: CollarBook, scout: ScoutId, color: CollarColor): CollarBook {
  const pair = collarPair(scout, color);
  return { owned: book.owned.includes(pair) ? book.owned : [...book.owned, pair], worn: { ...book.worn, [scout]: color } };
}

export function withCollarWorn(book: CollarBook, scout: ScoutId, color: CollarColor): CollarBook {
  if (!book.owned.includes(collarPair(scout, color))) return book;
  return { owned: book.owned, worn: { ...book.worn, [scout]: color } };
}

/** Drop one pair. Other paid colors on that scout stay. */
export function withoutCollar(book: CollarBook, scout: ScoutId, color: CollarColor): CollarBook {
  const worn = { ...book.worn };
  if (worn[scout] === color) delete worn[scout];
  return cleanCollarBook({ owned: book.owned.filter((pair) => pair !== collarPair(scout, color)), worn });
}

/** A refused buy takes the new color off and puts the previous scarf back on. */
export function undoCollarBuy(book: CollarBook, scout: ScoutId, color: CollarColor, prevWorn?: CollarColor): CollarBook {
  const next = withoutCollar(book, scout, color);
  if (prevWorn && next.owned.includes(collarPair(scout, prevWorn))) return withCollarWorn(next, scout, prevWorn);
  return next;
}

/** Pairs this device shows that the account has not charged for yet. */
export function collarOffers(local: CollarBook, server: CollarBook): string[] {
  return local.owned.filter((pair) => !server.owned.includes(pair));
}

/** Guest buys this session. Sign-in offers each one to the account; it is not a free scarf. */
export const guestCollarPaid = new Set<string>();
