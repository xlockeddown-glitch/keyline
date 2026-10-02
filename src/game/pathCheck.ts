/** QA geometry: does a walk ride along a freeway (not merely cross it on an overpass)? */
type Pt = { lat: number; lng: number };
type Line = Pt[];

const M_LAT = 111_320;
const mLng = (lat: number) => M_LAT * Math.cos((lat * Math.PI) / 180);

function toXY(p: Pt, o: Pt) {
  return { x: (p.lng - o.lng) * mLng(o.lat), y: (p.lat - o.lat) * M_LAT };
}

/**
 * Longest stretch (meters) where the path runs within `tol` m of a freeway centerline and heads the
 * same way (within `angDeg`). A street crossing a freeway on a bridge meets it near-perpendicular and
 * scores ~0; walking down the trench scores the length of the trench.
 */
export function freewayRun(
  path: Pt[],
  freeways: Line[],
  tol = 6,
  angDeg = 25,
  /** Walkable ways (streets under an elevated freeway, service drives where a ramp lands): on these, it's not a freeway ride. */
  walkable: Line[] = [],
  walkTol = 3,
): { run: number; at: Pt | null } {
  if (path.length < 2 || !freeways.length) return { run: 0, at: null };
  const o = path[0]!;
  const segs: { ax: number; ay: number; bx: number; by: number; ux: number; uy: number; len: number }[] = [];
  for (const line of freeways) {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = toXY(line[i]!, o);
      const b = toXY(line[i + 1]!, o);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 0.5) continue;
      segs.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, ux: (b.x - a.x) / len, uy: (b.y - a.y) / len, len });
    }
  }
  const walkSegs = walkable.flatMap((line) => {
    const out: { ax: number; ay: number; bx: number; by: number }[] = [];
    for (let i = 0; i + 1 < line.length; i++) {
      const a = toXY(line[i]!, o);
      const b = toXY(line[i + 1]!, o);
      out.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y });
    }
    return out;
  });
  const onWalk = (px: number, py: number) =>
    walkSegs.some((w) => {
      const dx = w.bx - w.ax;
      const dy = w.by - w.ay;
      const L2 = dx * dx + dy * dy;
      const t = L2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((px - w.ax) * dx + (py - w.ay) * dy) / L2));
      return Math.hypot(px - (w.ax + dx * t), py - (w.ay + dy * t)) <= walkTol;
    });
  const cosMax = Math.cos((angDeg * Math.PI) / 180);
  let best = 0;
  let bestAt: Pt | null = null;
  let cur = 0;
  const STEP = 4;
  for (let i = 0; i + 1 < path.length; i++) {
    const a = toXY(path[i]!, o);
    const b = toXY(path[i + 1]!, o);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 0.01) continue;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const n = Math.max(1, Math.ceil(len / STEP));
    for (let s = 0; s < n; s++) {
      const t = (s + 0.5) / n;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      let on = false;
      for (const g of segs) {
        if (Math.abs(ux * g.ux + uy * g.uy) < cosMax) continue;
        const k = Math.max(0, Math.min(g.len, (px - g.ax) * g.ux + (py - g.ay) * g.uy));
        const d = Math.hypot(px - (g.ax + g.ux * k), py - (g.ay + g.uy * k));
        if (d <= tol) {
          on = true;
          break;
        }
      }
      if (on && walkSegs.length && onWalk(px, py)) on = false;
      if (on) {
        cur += len / n;
        if (cur > best) {
          best = cur;
          bestAt = { lat: path[i]!.lat + (path[i + 1]!.lat - path[i]!.lat) * t, lng: path[i]!.lng + (path[i + 1]!.lng - path[i]!.lng) * t };
        }
      } else cur = 0;
    }
  }
  return { run: best, at: bestAt };
}

/** Distance (m) from a point to the nearest freeway centerline. */
export function freewayGap(p: Pt, freeways: Line[]): number {
  let best = Infinity;
  for (const line of freeways) {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = toXY(line[i]!, p);
      const b = toXY(line[i + 1]!, p);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const L2 = dx * dx + dy * dy;
      const t = L2 < 1e-9 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / L2));
      best = Math.min(best, Math.hypot(a.x + dx * t, a.y + dy * t));
    }
  }
  return best;
}
