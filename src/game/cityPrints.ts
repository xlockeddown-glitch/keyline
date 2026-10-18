/**
 * 0.0.97 city prints: exclusive coat patterns, earned per city (never bought). A print is purely visual and
 * wearable on any scout. Each city has a LIST of prints: major cities 2-3, smaller 1-2, every city at least
 * one. Each print carries its own goal; later prints in a city can ask for more.
 *
 * Rendering: the scout's coat mask (coatLayer.ts) is filled with a repeating pixel tile. Each tile pixel is
 * a Lab target; the base coat's light/shade offset is kept (softened) so folds and seams still read.
 * Coordinates are taken inside each 192 px sprite cell, so the print sits still on the body while walking.
 */
import type { DyeTarget } from "./dyeRecolor.ts";
import { fromLab, pyRound, toLab } from "./dyeRecolor.ts";
import type { CityId } from "./types.ts";

export type PrintGoal = {
  /** Correct lantern answers in this city. */
  correct: number;
  /** Metres walked in this city (server walk_distance). */
  meters: number;
};

export type CityPrint = {
  id: `print-${string}`;
  city: CityId;
  name: string;
  blurb: string;
  goal: PrintGoal;
  /** Rows of equal length; each char keys `palette`. */
  tile: readonly string[];
  palette: Readonly<Record<string, DyeTarget>>;
  /** Source px per tile px (sprite cells are 192 px, drawn ~48-56 px on the map). */
  scale: number;
  /** Swatch for chips. */
  swatch: string;
};

/** DRAFT targets: pending Ryan's lock (see report). First print in a city; later prints step up. */
export const PRINT_GOAL_FIRST: PrintGoal = { correct: 500, meters: 150_000 };

const AUSTIN_BLUEBONNET: CityPrint = {
  id: "print-austin-bluebonnet",
  city: "austin",
  name: "Bluebonnet Field",
  blurb: "Hill Country in April: bluebonnet spikes with white tips on a cream field.",
  goal: PRINT_GOAL_FIRST,
  scale: 3,
  swatch: "#3d5fb8",
  palette: {
    ".": { L: 86, C: 12, h: 90 }, // cream field
    b: { L: 42, C: 52, h: 285 }, // bluebonnet
    d: { L: 30, C: 46, h: 285 }, // deep petal
    w: { L: 95, C: 4, h: 90 }, // white tip
    g: { L: 50, C: 40, h: 135 }, // stem
  },
  tile: [
    "......w.........",
    ".....bwb........",
    "....bdbdb.......",
    ".....bdb........",
    "....bdbdb.......",
    ".....bdb........",
    "......g.........",
    "......g.........",
    "..............w.",
    ".............bwb",
    "............bdbd",
    ".............bdb",
    "............bdbd",
    ".............bdb",
    "..............g.",
    "..............g.",
  ],
};

const CHICAGO_L: CityPrint = {
  id: "print-chicago-l",
  city: "chicago",
  name: "'L' Trestle",
  blurb: "Riveted Loop girders over a steel-grey coat, a red line running through.",
  goal: PRINT_GOAL_FIRST,
  scale: 3,
  swatch: "#4a4f57",
  palette: {
    ".": { L: 34, C: 5, h: 250 }, // steel grey
    r: { L: 62, C: 12, h: 70 }, // rail / girder
    x: { L: 50, C: 14, h: 60 }, // lattice
    o: { L: 80, C: 10, h: 80 }, // rivet
    R: { L: 46, C: 62, h: 30 }, // red line
  },
  tile: [
    "rrrrrrrrrrrrrrrr",
    "o.....o.......o.",
    "x............x..",
    ".x..........x...",
    "..x........x....",
    "...x......x.....",
    "....x....x......",
    ".....x..x.......",
    "......xx........",
    ".....x..x.......",
    "....x....x......",
    "...x......x.....",
    "..x........x....",
    "rrrrrrrrrrrrrrrr",
    "RRRRRRRRRRRRRRRR",
    "................",
  ],
};

const DETROIT_PLAID: CityPrint = {
  id: "print-detroit-plaid",
  city: "detroit",
  name: "Motor City Plaid",
  blurb: "Assembly-line tartan: Detroit red, Motor navy and a chrome stripe.",
  goal: PRINT_GOAL_FIRST,
  scale: 3,
  swatch: "#a8323a",
  palette: {
    R: { L: 40, C: 56, h: 28 }, // red
    N: { L: 24, C: 26, h: 270 }, // navy
    M: { L: 30, C: 40, h: 330 }, // red × navy crossing
    c: { L: 85, C: 3, h: 250 }, // chrome stripe
    k: { L: 14, C: 6, h: 270 }, // black thread
  },
  tile: [
    "RRRRNNNNRRRcRRRR",
    "RRRRNNNNRRRcRRRR",
    "RRRRNNNNRRRcRRRR",
    "RRRRNNNNRRRcRRRR",
    "NNNNkkkkNNNcNNNN",
    "NNNNkkkkNNNcNNNN",
    "NNNNkkkkNNNcNNNN",
    "NNNNkkkkNNNcNNNN",
    "RRRRNNNNRRRcRRRR",
    "RRRRNNNNRRRcRRRR",
    "RRRRNNNNRRRcRRRR",
    "cccccccccccccccc",
    "RRRRNNNNRRRcRRRR",
    "RRRRNNNNRRRcRRRR",
    "MMMMNNNNMMMcMMMM",
    "RRRRNNNNRRRcRRRR",
  ],
};

/** Every city's prints, in earn order. */
export const CITY_PRINTS: Readonly<Partial<Record<CityId, readonly CityPrint[]>>> = {
  austin: [AUSTIN_BLUEBONNET],
  chicago: [CHICAGO_L],
  detroit: [DETROIT_PLAID],
};

/**
 * Cities whose first print is still being drawn (3-5 a day after 0.0.97). cityPrints.test.ts fails if a
 * city has no print and is not listed here, and if a listed city already has one: new cities cannot ship
 * without a print, and this list can only shrink.
 */
export const PRINTS_PENDING: readonly CityId[] = [
  "temple", "nyc", "sf", "london", "tucson", "toronto", "la", "boston", "nola", "seattle", "denver", "nashville",
];

export const ALL_PRINTS: readonly CityPrint[] = Object.values(CITY_PRINTS).flatMap((l) => l ?? []);

export function printById(id: string): CityPrint | undefined {
  return ALL_PRINTS.find((p) => p.id === id);
}

export type PrintProgress = { correct: number; meters: number };

/** Progress toward one print: 0-1 per leg and overall (both legs must finish). */
export function printProgress(p: CityPrint, got: PrintProgress) {
  const c = Math.min(1, Math.max(0, got.correct) / p.goal.correct);
  const m = Math.min(1, Math.max(0, got.meters) / p.goal.meters);
  return { correct: c, meters: m, done: c >= 1 && m >= 1 };
}

const CELL = 192;

/**
 * Fill the coat mask of a v2 sheet with a print. `def` is the scout's default coat target (its light/shade
 * offsets are kept at 60% so the pattern still shows folds). Unmasked pixels are untouched.
 */
export function applyPrintLayer(base: Uint8ClampedArray, mask: Uint8ClampedArray, w: number, p: CityPrint, def: DyeTarget): Uint8ClampedArray {
  const out = new Uint8ClampedArray(base);
  const th = p.tile.length;
  const tw = p.tile[0]!.length;
  const cache = new Map<string, { L: number; a: number; b: number }>();
  for (const [k, t] of Object.entries(p.palette)) {
    const h = (t.h * Math.PI) / 180;
    cache.set(k, { L: t.L, a: t.C * Math.cos(h), b: t.C * Math.sin(h) });
  }
  for (let i = 0; i < base.length; i += 4) {
    const m = mask[i]! / 255;
    if (m <= 0 || base[i + 3] === 0) continue;
    const px = (i / 4) % w;
    const py = Math.floor(i / 4 / w);
    const tx = Math.floor((px % CELL) / p.scale) % tw;
    const ty = Math.floor((py % CELL) / p.scale) % th;
    const t = cache.get(p.tile[ty]![tx]!) ?? cache.values().next().value!;
    const [L] = toLab(base[i]!, base[i + 1]!, base[i + 2]!);
    const nl = Math.max(4, Math.min(96, t.L + (L - def.L) * 0.6));
    const [r, g, b] = fromLab(nl, t.a, t.b);
    out[i] = pyRound(base[i]! * (1 - m) + r * m);
    out[i + 1] = pyRound(base[i + 1]! * (1 - m) + g * m);
    out[i + 2] = pyRound(base[i + 2]! * (1 - m) + b * m);
  }
  return out;
}
