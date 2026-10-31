/**
 * 0.1.82: the satchel cut. Brass, ink, vellum, schematics and press stock no longer drop or show, so what an account
 * held is traded for coin once (Ryan's rates). Signed-in players are paid from the server wallet's own counts, which
 * the client can't raise (mergeFirstSync keeps the server's stock), under one ledger key; guests get the same sum
 * added locally once. Either way each count is held to the wallet cap, so the most one account can get is
 * STOCK_COIN_MAX.
 */
import { BRASS_CAP, INK_CAP, PRESS_CAP, SCHEMATIC_CAP, VELLUM_CAP } from "./wallet.ts";

export const STOCK_COIN_KEY = "gift:stock-0182";
export const STOCK_RATES = { press: 100, brass: 200, ink: 200, vellum: 200, schematic: 500 } as const;
export const STOCK_CAPS = { press: PRESS_CAP, brass: BRASS_CAP, ink: INK_CAP, vellum: VELLUM_CAP, schematic: SCHEMATIC_CAP } as const;
export type StockKind = keyof typeof STOCK_RATES;
export type StockCounts = Partial<Record<StockKind, number>>;

const KINDS = Object.keys(STOCK_RATES) as StockKind[];

/** Each count clamped to 0..cap (whole numbers), times its rate. */
export function stockCoin(c: StockCounts): number {
  let coin = 0;
  for (const k of KINDS) {
    const n = Number(c[k]);
    const held = Number.isFinite(n) ? Math.min(STOCK_CAPS[k], Math.max(0, Math.floor(n))) : 0;
    coin += held * STOCK_RATES[k];
  }
  return coin;
}

export const STOCK_COIN_MAX = stockCoin(STOCK_CAPS);

export function stockNote(coin: number): string {
  return `Brass, ink, vellum, schematics and press stock are retired. What you carried was traded for ${coin.toLocaleString("en-US")} coin.`;
}
