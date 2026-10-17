/**
 * 0.0.64 vat dyes. A dyed coat is a recolour of the scout's own sheets (same pixels as
 * scripts/make-coat-variants.py). The sheets are mixed here rather than shipped: a full
 * set of dye PNGs does not fit the publish cap. Print-shop coats stay as real files.
 */
export type DyeTarget = { L: number; C: number; h: number };
export type SheetKind = "idle" | "walk" | "idle-side";

/** Lab targets. Keep in step with the `dyes` block of scripts/coat-variants.json. */
export const DYE_TARGETS: Record<string, DyeTarget> = {
  "dye-white": { L: 74, C: 26, h: 82 },
  "dye-blue": { L: 64, C: 34, h: 240 },
  "dye-green": { L: 46, C: 46, h: 148 },
  "dye-amber": { L: 66, C: 64, h: 70 },
  "dye-red": { L: 41, C: 72, h: 14 },
  "dye-violet": { L: 46, C: 74, h: 290 },
  "dye-prism": { L: 62, C: 52, h: 192 },
};

const HEAD: Record<string, number> = {
  raccoon: 0.3,
  cat: 0.33,
  corgi: 0.33,
  fox: 0.33,
  lynx: 0.33,
  owl: 0.36,
  sloth: 0.3,
  turtle: 0.3,
  giraffe: 0.4,
};
const FOOT = 0.08;
const AB_RADIUS = 9;
const AB_RADIUS_BY: Record<string, number> = { turtle: 14 };
const L_KEEP: Record<string, number> = { turtle: 0.7 };
const GRID: Record<SheetKind, number> = { idle: 2, walk: 4, "idle-side": 2 };
const LANTERN_PAD: Record<string, number> = { lynx: 2, giraffe: 2, corgi: 3 };
/** 0.0.81 clean-up; keep in step with L_WIN, FILL_* in scripts/make-coat-variants.py. */
const L_WIN: [number, number] = [16, 16];
const L_WIN_BY: Record<string, [number, number]> = { corgi: [16, 10], owl: [16, 10] };
const FILL_PASSES = 3;
const FILL_NEIGHBOURS = 5;
const FILL_AB = 2.2;
const FILL_L = 4;
const HOLE_MAX = 40;
const FILL_L_BY: Record<string, number> = { turtle: 6 };

type Lab = [number, number, number];
type Ref = { L: number; a: number; b: number; lo: number; hi: number };

/** Python 3 round(): halves go to the even integer. Colour math depends on it. */
function pyRound(n: number): number {
  const sign = n < 0 ? -1 : 1;
  const a = Math.abs(n);
  const f = Math.floor(a);
  const d = a - f;
  if (d > 0.5) return sign * (f + 1);
  if (d < 0.5) return sign * f;
  return sign * (f % 2 === 0 ? f : f + 1);
}

function srgbToLin(u: number): number {
  u /= 255;
  return u > 0.04045 ? ((u + 0.055) / 1.055) ** 2.4 : u / 12.92;
}

function linToSrgb(u: number): number {
  u = Math.max(0, Math.min(1, u));
  const v = u > 0.0031308 ? 1.055 * u ** (1 / 2.4) - 0.055 : 12.92 * u;
  return Math.max(0, Math.min(255, pyRound(v * 255)));
}

function toLab(r: number, g: number, b: number): Lab {
  const R = srgbToLin(r);
  const G = srgbToLin(g);
  const B = srgbToLin(b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function fromLab(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t: number) => {
    const c = t ** 3;
    return c > 0.008856 ? c : (t - 16 / 116) / 7.787;
  };
  const X = inv(fx) * 0.95047;
  const Y = inv(fy);
  const Z = inv(fz) * 1.08883;
  const R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const B = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  return [linToSrgb(R), linToSrgb(G), linToSrgb(B)];
}

function at(data: Uint8ClampedArray, w: number, x: number, y: number): number {
  return (y * w + x) * 4;
}

function solidBbox(data: Uint8ClampedArray, w: number, h: number): [number, number, number, number] | null {
  let x0 = w;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  let any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[at(data, w, x, y) + 3]! < 128) continue;
      any = true;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x + 1 > x1) x1 = x + 1;
      if (y + 1 > y1) y1 = y + 1;
    }
  }
  return any ? [x0, y0, x1, y1] : null;
}

function lanternBox(data: Uint8ClampedArray, w: number, h: number, pad: number): [number, number, number, number] | null {
  const bb = solidBbox(data, w, h);
  if (!bb) return null;
  const top = bb[1];
  const bottom = bb[3];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = top + Math.trunc((bottom - top) * 0.45); y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = at(data, w, x, y);
      if (data[i + 3]! < 128) continue;
      const [L, A, B] = toLab(data[i]!, data[i + 1]!, data[i + 2]!);
      const hue = (Math.atan2(B, A) * 180) / Math.PI;
      const hh = (hue + 360) % 360;
      if (L > 74 && Math.hypot(A, B) > 45 && hh >= 70 && hh <= 105) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  if (xs.length < 3) return null;
  const sx = xs.slice().sort((a, b) => a - b);
  const sy = ys.slice().sort((a, b) => a - b);
  const mx = sx[Math.floor(xs.length / 2)]!;
  const my = sy[Math.floor(ys.length / 2)]!;
  const pts = xs.map((x, i) => [x, ys[i]!] as const).filter(([x, y]) => Math.abs(x - mx) <= 8 && Math.abs(y - my) <= 10);
  if (!pts.length) return null;
  const pxs = pts.map((p) => p[0]);
  const pys = pts.map((p) => p[1]);
  const sc = pad / 6;
  return [
    Math.min(...pxs) - pyRound(7 * sc),
    Math.min(...pys) - pyRound(12 * sc),
    Math.max(...pxs) + pyRound(7 * sc),
    Math.max(...pys) + pyRound(9 * sc),
  ];
}

function inBox(x: number, y: number, box: [number, number, number, number] | null): boolean {
  return !!box && box[0] <= x && x <= box[2] && box[1] <= y && y <= box[3];
}

function coatRef(frames: Uint8ClampedArray[], w: number, radius: number): Ref {
  const pts: Lab[] = [];
  for (const f of frames) {
    const bb = solidBbox(f, w, w);
    if (!bb) continue;
    const [x0, y0, x1, y1] = bb;
    const fw = x1 - x0;
    const fh = y1 - y0;
    for (let y = Math.trunc(y0 + fh * 0.42); y < Math.trunc(y0 + fh * 0.78); y++) {
      for (let x = Math.trunc(x0 + fw * 0.28); x < Math.trunc(x1 - fw * 0.28); x++) {
        const i = at(f, w, x, y);
        if (f[i + 3]! < 200) continue;
        const lab = toLab(f[i]!, f[i + 1]!, f[i + 2]!);
        if (lab[0] > 10 && lab[0] < 70) pts.push(lab);
      }
    }
  }
  const bins = new Map<string, { n: number; a: number; b: number }>();
  for (const p of pts) {
    const a = pyRound(p[1] / 4);
    const b = pyRound(p[2] / 4);
    const k = `${a},${b}`;
    const cur = bins.get(k);
    if (cur) cur.n++;
    else bins.set(k, { n: 1, a, b });
  }
  let best = { n: -1, a: 0, b: 0 };
  for (const v of bins.values()) if (v.n > best.n) best = v;
  const near = pts.filter((p) => Math.hypot(p[1] - best.a * 4, p[2] - best.b * 4) <= radius);
  const n = near.length || 1;
  const Ls = near.map((p) => p[0]).sort((a, b) => a - b);
  const use = near.length ? near : pts;
  const nn = use.length || 1;
  return {
    L: use.reduce((s, p) => s + p[0], 0) / nn,
    a: use.reduce((s, p) => s + p[1], 0) / nn,
    b: use.reduce((s, p) => s + p[2], 0) / nn,
    lo: (Ls[Math.trunc(n * 0.02)] ?? 0) - 6,
    hi: (Ls[Math.trunc(n * 0.98)] ?? 0) + 6,
  };
}

function coatMask(scout: string, f: Uint8ClampedArray, w: number, ref: Ref): Set<number> {
  const bb = solidBbox(f, w, w);
  const coat = new Set<number>();
  if (!bb) return coat;
  const [x0, y0, x1, y1] = bb;
  const fw = x1 - x0;
  const fh = y1 - y0;
  const lb = lanternBox(f, w, w, LANTERN_PAD[scout] ?? 6);
  const rad = AB_RADIUS_BY[scout] ?? AB_RADIUS;
  const [down, up] = L_WIN_BY[scout] ?? L_WIN;
  const lo = Math.max(ref.lo, ref.L - down);
  const hi = Math.min(ref.hi, ref.L + up);
  const yStart = Math.trunc(y0 + fh * (HEAD[scout] ?? 0.33));
  const yEnd = Math.trunc(y1 - fh * FOOT);
  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < w; x++) {
      const i = at(f, w, x, y);
      if (f[i + 3]! < 64 || inBox(x, y, lb)) continue;
      const [L, A, B] = toLab(f[i]!, f[i + 1]!, f[i + 2]!);
      if (lo <= L && L <= hi && Math.hypot(A - ref.a, B - ref.b) <= rad) coat.add(y * w + x);
    }
  }
  const seeds: number[] = [];
  for (const p of coat) {
    const x = p % w;
    const y = (p - x) / w;
    if (y >= y0 + fh * 0.45 && y <= y0 + fh * 0.75 && x >= x0 + fw * 0.3 && x <= x1 - fw * 0.3) seeds.push(p);
  }
  const seen = new Set(seeds);
  const dq = seeds.slice();
  while (dq.length) {
    const p = dq.pop()!;
    const x = p % w;
    const y = (p - x) / w;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const q = (y + dy) * w + (x + dx);
        if (coat.has(q) && !seen.has(q)) {
          seen.add(q);
          dq.push(q);
        }
      }
    }
  }
  const fl = FILL_L_BY[scout] ?? FILL_L;
  return cleanMask(f, w, seen, ref, lo - fl, hi + fl, rad, lb);
}

/** Hole fill, enclosed holes and speck removal (make-coat-variants.clean_mask). Frames are square, w x w. */
function cleanMask(
  f: Uint8ClampedArray,
  w: number,
  seed: Set<number>,
  ref: Ref,
  lo: number,
  hi: number,
  rad: number,
  lb: [number, number, number, number] | null,
): Set<number> {
  if (!seed.size) return seed;
  const m = new Set(seed);
  const fits = (x: number, y: number) => {
    const i = at(f, w, x, y);
    if (f[i + 3]! < 64 || inBox(x, y, lb)) return false;
    const [L, A, B] = toLab(f[i]!, f[i + 1]!, f[i + 2]!);
    return Math.hypot(A - ref.a, B - ref.b) <= rad * FILL_AB && lo <= L && L <= hi;
  };
  const inside = (x: number, y: number) => x >= 0 && x < w && y >= 0 && y < w;
  const neighbours = (x: number, y: number) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && inside(x + dx, y + dy) && m.has((y + dy) * w + x + dx)) n++;
    return n;
  };
  for (let pass = 0; pass < FILL_PASSES; pass++) {
    const cand = new Set<number>();
    for (const p of m) {
      const x = p % w;
      const y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const qx = x + dx;
          const qy = y + dy;
          if ((dx || dy) && inside(qx, qy) && !m.has(qy * w + qx)) cand.add(qy * w + qx);
        }
    }
    const add: number[] = [];
    for (const q of cand) {
      const x = q % w;
      const y = (q - x) / w;
      if (neighbours(x, y) >= FILL_NEIGHBOURS && fits(x, y)) add.push(q);
    }
    if (!add.length) break;
    for (const q of add) m.add(q);
  }
  const outside = new Uint8Array(w * w);
  const dq: number[] = [];
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if ((x === 0 || y === 0 || x === w - 1 || y === w - 1 || f[p * 4 + 3]! < 64) && !m.has(p)) {
        outside[p] = 1;
        dq.push(p);
      }
    }
  while (dq.length) {
    const p = dq.pop()!;
    const x = p % w;
    const y = (p - x) / w;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const qx = x + dx;
      const qy = y + dy;
      const q = qy * w + qx;
      if (inside(qx, qy) && !m.has(q) && !outside[q]) {
        outside[q] = 1;
        dq.push(q);
      }
    }
  }
  // Only small enclosed patches (folds, highlights, specks); a big one is a part of its own (plastron, satchel).
  const done = new Uint8Array(w * w);
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const p0 = y * w + x;
      if (m.has(p0) || outside[p0] || done[p0]) continue;
      const comp = [p0];
      done[p0] = 1;
      for (let k = 0; k < comp.length; k++) {
        const p = comp[k]!;
        const cx = p % w;
        const cy = (p - cx) / w;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const qx = cx + dx;
          const qy = cy + dy;
          const q = qy * w + qx;
          if (inside(qx, qy) && !m.has(q) && !outside[q] && !done[q]) {
            done[q] = 1;
            comp.push(q);
          }
        }
      }
      if (comp.length <= HOLE_MAX) {
        const add = comp.filter((p) => fits(p % w, Math.floor(p / w)));
        for (const p of add) m.add(p);
      }
    }
  const out = new Set<number>();
  for (const p of m) {
    const x = p % w;
    if (neighbours(x, (p - x) / w) > 1) out.add(p);
  }
  return out;
}

function recolour(f: Uint8ClampedArray, w: number, mask: Set<number>, ref: Ref, tgt: DyeTarget, keep: number) {
  const th = (tgt.h * Math.PI) / 180;
  const refC = Math.hypot(ref.a, ref.b);
  const refH = Math.atan2(ref.b, ref.a);
  for (const p of mask) {
    const x = p % w;
    const y = (p - x) / w;
    const i = at(f, w, x, y);
    const [L, A, B] = toLab(f[i]!, f[i + 1]!, f[i + 2]!);
    const nl = Math.max(4, Math.min(92, tgt.L + (L - ref.L) * keep));
    const nc = tgt.C * Math.max(0.5, Math.min(1.2, nl / tgt.L));
    let hh = th;
    if (refC > 10 && Math.hypot(A, B) > 6) {
      const raw = Math.atan2(B, A) - refH + Math.PI;
      const d = raw - Math.floor(raw / (2 * Math.PI)) * (2 * Math.PI) - Math.PI;
      hh = th + d * 0.25;
    }
    const [nr, ng, nb] = fromLab(nl, nc * Math.cos(hh), nc * Math.sin(hh));
    f[i] = nr;
    f[i + 1] = ng;
    f[i + 2] = nb;
  }
}

function extract(src: Uint8ClampedArray, sw: number, cw: number, c: number, r: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(cw * cw * 4);
  for (let y = 0; y < cw; y++) {
    const s = ((r * cw + y) * sw + c * cw) * 4;
    out.set(src.subarray(s, s + cw * 4), y * cw * 4);
  }
  return out;
}

function blit(dst: Uint8ClampedArray, sw: number, cell: Uint8ClampedArray, cw: number, c: number, r: number) {
  for (let y = 0; y < cw; y++) {
    const s = ((r * cw + y) * sw + c * cw) * 4;
    dst.set(cell.subarray(y * cw * 4, (y + 1) * cw * 4), s);
  }
}

/** Recolour one walk / idle / side-idle sheet. `src` is not modified. */
export function recolorSheet(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  scout: string,
  kind: SheetKind,
  tgt: DyeTarget,
): Uint8ClampedArray {
  const n = GRID[kind];
  const cw = width / n;
  const out = new Uint8ClampedArray(src);
  const rad = scout in AB_RADIUS_BY ? AB_RADIUS_BY[scout]! : Math.min(8, AB_RADIUS);
  const keep = L_KEEP[scout] ?? 1;
  const rows: Uint8ClampedArray[][] = [];
  for (let r = 0; r < n; r++) {
    const row: Uint8ClampedArray[] = [];
    for (let c = 0; c < n; c++) row.push(extract(src, width, cw, c, r));
    rows.push(row);
  }
  const flat = rows.flat();
  const refs = kind === "idle" ? rows.map(() => coatRef(flat, cw, rad)) : rows.map((row) => coatRef(row, cw, rad));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const f = rows[r]![c]!;
      recolour(f, cw, coatMask(scout, f, cw, refs[r]!), refs[r]!, tgt, keep);
      blit(out, width, f, cw, c, r);
    }
  }
  return out;
}
