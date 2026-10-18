/**
 * 0.0.83 redrawn ("v2") sprite sheets: one sheet per scout with every walk and idle frame, plus a coat mask.
 *
 * Layout (scripts/sprite-rig.py writes it): 8 x 6 cells of 192 px.
 *   rows 0-3  walk, 8 frames per stride: down, left, right, up
 *   row 4     idle down: the 3/4 standing idle, 8 frames
 *   row 5     idle left (cols 0-3), idle right (cols 4-7); stopping after walking up shows the down idle
 * The base sheet wears the scout's default coat. `<scout>-v2-coat.png` is a grey mask of coat coverage, so a
 * print-shop coat or vat dye recolours exactly the coat (never shell, belly, fur, boots or lantern).
 */
import { DYE_TARGETS, fromLab, pyRound, toLab, type DyeTarget } from "./dyeRecolor.ts";

/** Scouts drawn on the v2 sheets. Everyone else keeps the 4x4 / 2x2 sheets. */
export const V2_SCOUTS: ReadonlySet<string> = new Set(["turtle", "cat", "fox", "corgi", "sloth", "raccoon", "owl", "lynx", "giraffe"]);

/**
 * Walk cadence per v2 scout (frames per second multiplier while walking; walking speed is unchanged, see
 * perk.test "every coat walks the same"). 0.0.87: the Corgi's short legs take quicker, smaller steps. 0.0.88: the
 * Sloth takes slower, heavier ones over the same ground. 0.0.91: the Penguin (lynx) waddles in short, quick steps.
 */
export const V2_CADENCE: Readonly<Record<string, number>> = { corgi: 1.35, sloth: 0.8, lynx: 1.25 };

export const V2_COLS = 8;
export const V2_ROWS = 6;
export const V2_WALK_FRAMES = 8;
/** Idle frames: the 3/4 front idle (row 4) has 8 (breath, lantern sway, blink); each side idle (row 5) has 4. */
export const V2_IDLE_FRAMES = 8;
export const V2_SIDE_IDLE_FRAMES = 4;

/** Cache stamp for the v2 sheets (styles.css uses the same one). */
export const V2_STAMP = "k95a";

/** Coat each v2 base sheet is painted in (scripts/sprite-redraw/<scout>/rig.json `default_coat`). */
export const V2_DEFAULT_COAT: Record<string, DyeTarget> = {
  turtle: { L: 30, C: 26, h: 70 },
  cat: { L: 28, C: 24, h: 64 },
  fox: { L: 24, C: 9, h: 260 },
  corgi: { L: 26, C: 20, h: 58 },
  sloth: { L: 30, C: 22, h: 205 },
  raccoon: { L: 34, C: 26, h: 100 },
  owl: { L: 26, C: 22, h: 268 },
  lynx: { L: 25, C: 44, h: 316 },
  giraffe: { L: 30, C: 46, h: 8 },
};

/** Print-shop coat targets. Keep in step with the `coats` block of scripts/coat-variants.json. */
export const COAT_TARGETS: Record<string, DyeTarget> = {
  oilskin: { L: 54, C: 46, h: 84 },
  bottle: { L: 34, C: 30, h: 152 },
  oxblood: { L: 30, C: 36, h: 30 },
  plum: { L: 30, C: 30, h: 330 },
};

/** Every coat id a v2 scout can wear, print-shop and dye alike. */
export const V2_PALETTE: Record<string, DyeTarget> = { ...COAT_TARGETS, ...DYE_TARGETS };

export function v2SheetUrl(scout: string): string {
  return `/sprites/scouts/${scout}-v2.png?v=${V2_STAMP}`;
}

export function v2MaskUrl(scout: string): string {
  return `/sprites/scouts/${scout}-v2-coat.png?v=${V2_STAMP}`;
}

/**
 * Recolour the coat of a v2 base sheet (RGBA) through its mask (RGBA from a canvas; the red channel is read).
 * The base coat is `def.L + offset`; the new coat is `tgt.L + offset` with the target's hue and a chroma that
 * eases off in the shadows. Unmasked pixels are returned untouched. Twin of apply_coat in scripts/sprite-rig.py.
 */
export function applyCoatLayer(base: Uint8ClampedArray, mask: Uint8ClampedArray, tgt: DyeTarget, def: DyeTarget): Uint8ClampedArray {
  const out = new Uint8ClampedArray(base);
  const shift = tgt.L - def.L;
  const h = (tgt.h * Math.PI) / 180;
  const cos = Math.cos(h);
  const sin = Math.sin(h);
  for (let i = 0; i < base.length; i += 4) {
    const m = mask[i]! / 255;
    if (m <= 0 || base[i + 3] === 0) continue;
    const [L] = toLab(base[i]!, base[i + 1]!, base[i + 2]!);
    const nl = Math.max(4, Math.min(92, L + shift));
    const nc = tgt.C * Math.max(0.5, Math.min(1.2, nl / tgt.L));
    const [r, g, b] = fromLab(nl, nc * cos, nc * sin);
    out[i] = pyRound(base[i]! * (1 - m) + r * m);
    out[i + 1] = pyRound(base[i + 1]! * (1 - m) + g * m);
    out[i + 2] = pyRound(base[i + 2]! * (1 - m) + b * m);
  }
  return out;
}

/**
 * Which cell a v2 scout shows. `tick` is the animation clock in legacy frames (GameMap's 0-7 loop counter plus
 * the fraction of the current frame), so a stride takes the same time as on the 4-frame sheets but shows 8 frames,
 * and the 8-frame front idle runs one slow breath per 8 idle frames (2.7 s).
 * Layout: rows 0-3 walk (down, left, right, up); row 4 the 3/4 front idle; row 5 idle left (cols 0-3), idle right
 * (cols 4-7). Standing after walking up shows the front idle, as on the old sheets.
 */
export function v2Cell(moving: boolean, row: 0 | 1 | 2 | 3, tick: number): { col: number; row: number; position: string } {
  let col: number;
  let r: number;
  if (moving) {
    col = ((Math.floor(tick * 2) % V2_WALK_FRAMES) + V2_WALK_FRAMES) % V2_WALK_FRAMES;
    r = row;
  } else {
    const n = row === 1 || row === 2 ? V2_SIDE_IDLE_FRAMES : V2_IDLE_FRAMES;
    const f = ((Math.floor(tick) % n) + n) % n;
    if (row === 1) [r, col] = [5, f];
    else if (row === 2) [r, col] = [5, V2_SIDE_IDLE_FRAMES + f];
    else [r, col] = [4, f];
  }
  const x = (col / (V2_COLS - 1)) * 100;
  const y = (r / (V2_ROWS - 1)) * 100;
  return { col, row: r, position: `${+x.toFixed(4)}% ${+y.toFixed(4)}%` };
}
