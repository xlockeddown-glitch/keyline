/**
 * 0.0.67 vault paint. A cleared vault sometimes drops one can of its own colour —
 * white about 1 in 2, then 5, 15, 45, and red and violet much rarer (1 in 150, 1 in 500).
 * Prism is separate: any colour, about 1 in 10,000, and one can dyes a coat.
 * The vat spends a set number of that colour — a coat for the walker, or paint on the
 * street vaults (the metal only; the glass keeps the tier). Mixed once, then worn or taken off.
 */
import type { IngredientId, PaintColor, PaintId } from "./ingredients.ts";
import { paintId } from "./ingredients.ts";

export type PaintJob = "coat" | "vault";

export type PaintUse = {
  name: string;
  /** Cans of this colour to dye a coat. */
  coat: number;
  /** Cans of this colour to paint the street vaults. */
  vault: number;
  swatch: string;
};

export const PAINT_USE: Record<PaintColor, PaintUse> = {
  white: { name: "White paint", coat: 3, vault: 4, swatch: "#efe6d0" },
  blue: { name: "Blue paint", coat: 4, vault: 5, swatch: "#3d6f9a" },
  green: { name: "Green paint", coat: 5, vault: 6, swatch: "#2f6b45" },
  amber: { name: "Amber paint", coat: 6, vault: 8, swatch: "#e39a1a" },
  red: { name: "Red paint", coat: 8, vault: 10, swatch: "#b42324" },
  violet: { name: "Violet paint", coat: 10, vault: 12, swatch: "#6a3498" },
  prism: { name: "Prism paint", coat: 1, vault: 2, swatch: "#5ec8e0" },
};

export type PaintBench = {
  coats: PaintColor[];
  vaults: PaintColor[];
  wornCoat: PaintColor | null;
  wornVault: PaintColor | null;
};

export const EMPTY_PAINT: PaintBench = { coats: [], vaults: [], wornCoat: null, wornVault: null };

const COLORS = new Set<string>(Object.keys(PAINT_USE));

function asColor(v: unknown): PaintColor | null {
  return typeof v === "string" && COLORS.has(v) ? (v as PaintColor) : null;
}

export function cleanPaint(raw: unknown): PaintBench {
  const r = raw && typeof raw === "object" ? (raw as Partial<PaintBench>) : {};
  const coats = [...new Set((r.coats ?? []).map(asColor).filter((c): c is PaintColor => Boolean(c)))];
  const vaults = [...new Set((r.vaults ?? []).map(asColor).filter((c): c is PaintColor => Boolean(c)))];
  const wornCoat = asColor(r.wornCoat);
  const wornVault = asColor(r.wornVault);
  return {
    coats,
    vaults,
    wornCoat: wornCoat && coats.includes(wornCoat) ? wornCoat : null,
    wornVault: wornVault && vaults.includes(wornVault) ? wornVault : null,
  };
}

export function dyeCoatId(color: PaintColor): string {
  return `dye-${color}`;
}

export function vaultPaintAttr(color: PaintColor): string {
  return `paint-${color}`;
}

/** What the walker is actually wearing: a dyed coat covers the print-shop coat until it's taken off. */
export function visibleCoat(worn: PaintColor | null, field: string | null): string | null {
  return worn ? dyeCoatId(worn) : field;
}

/** Painted vaults cover a metal lantern skin until the paint comes off. Glass is not part of this. */
export function visibleLantern(worn: PaintColor | null, metal: string | null): string | null {
  return worn ? vaultPaintAttr(worn) : metal;
}

export function paintCost(color: PaintColor, job: PaintJob): number {
  return PAINT_USE[color][job];
}

export type MixResult = {
  bench: PaintBench;
  pantry: Partial<Record<IngredientId, number>>;
  spent: number;
};

/** Spend the set number and put the job on. Null if it's already mixed or the cans aren't there. */
export function mixPaint(
  bench: PaintBench,
  pantry: Partial<Record<IngredientId, number>>,
  color: PaintColor,
  job: PaintJob,
): MixResult | null {
  const owned = job === "coat" ? bench.coats : bench.vaults;
  if (owned.includes(color)) return null;
  const need = paintCost(color, job);
  const id: PaintId = paintId(color);
  const have = pantry[id] ?? 0;
  if (have < need) return null;
  const nextOwned = [...owned, color];
  const next: PaintBench =
    job === "coat"
      ? { ...bench, coats: nextOwned, wornCoat: color }
      : { ...bench, vaults: nextOwned, wornVault: color };
  return { bench: next, pantry: { ...pantry, [id]: have - need }, spent: need };
}

/** Put a mixed job on, or take it off with null. Null if it isn't mixed or nothing changes. */
export function wearPaint(bench: PaintBench, job: PaintJob, color: PaintColor | null): PaintBench | null {
  if (job === "coat") {
    if (color !== null && !bench.coats.includes(color)) return null;
    if (bench.wornCoat === color) return null;
    return { ...bench, wornCoat: color };
  }
  if (color !== null && !bench.vaults.includes(color)) return null;
  if (bench.wornVault === color) return null;
  return { ...bench, wornVault: color };
}
