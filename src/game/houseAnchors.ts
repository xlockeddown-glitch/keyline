/**
 * Where each house's door, window, and steps actually are, measured from that
 * sprite (480×360, percentages of the painting). The curtain, plate, and rail
 * are placed from these boxes only. The door lamp is not in this table.
 *
 * Sheet aspect is 4:3, which the handrail angle depends on.
 */
export type AnchorBox = { x: number; y: number; w: number; h: number };
export type StepPoint = { x: number; y: number };

export type HouseAnchor = {
  /** Inner glass. The curtain fills this and nothing outside it. */
  window: AnchorBox;
  /** The door slab. The plate sits on the wall beside it, at hand height. */
  door: AnchorBox;
  /** Beveled plate on the wall, beside the door, clear of ivy and the window. */
  plate: AnchorBox;
  /** Tread points the rail posts stand on, in handrail order. */
  steps: [StepPoint, StepPoint, StepPoint];
  /** How far the handrail sits above the tread, in percent of the sprite height. */
  railHeight: number;
};

export const HOUSE_ANCHORS: Record<string, HouseAnchor> = {
  cottage: {
    window: { x: 54, y: 50, w: 9.6, h: 16 },
    door: { x: 26.5, y: 52, w: 11.5, h: 31 },
    plate: { x: 38.4, y: 66.2, w: 7.6, h: 4.2 },
    steps: [
      { x: 30.2, y: 87.6 },
      { x: 33.6, y: 87.8 },
      { x: 37, y: 92.2 },
    ],
    railHeight: 7.2,
  },
  row: {
    window: { x: 54.8, y: 56.2, w: 5.8, h: 12.8 },
    door: { x: 38.8, y: 54.5, w: 8.8, h: 20.5 },
    plate: { x: 47.2, y: 64.2, w: 4, h: 3.4 },
    steps: [
      { x: 37.8, y: 93.2 },
      { x: 40.4, y: 86.8 },
      { x: 43, y: 80.2 },
    ],
    railHeight: 6.2,
  },
  town: {
    window: { x: 40.6, y: 62.4, w: 8.6, h: 11.2 },
    door: { x: 51.6, y: 65.5, w: 4.2, h: 15.5 },
    plate: { x: 56.2, y: 68.6, w: 3.2, h: 3.8 },
    steps: [
      { x: 49.6, y: 84.2 },
      { x: 52.2, y: 87.4 },
      { x: 54.8, y: 90.6 },
    ],
    railHeight: 6,
  },
  villa: {
    window: { x: 61.4, y: 54.2, w: 5.2, h: 6.8 },
    door: { x: 47.6, y: 51, w: 6.2, h: 15 },
    plate: { x: 53.9, y: 57.4, w: 4.6, h: 3.2 },
    steps: [
      { x: 48.4, y: 65.2 },
      { x: 50, y: 65.6 },
      { x: 51.6, y: 66 },
    ],
    railHeight: 3.4,
  },
};

const SHEET_ASPECT = 4 / 3;

export type RailLayout = {
  posts: [{ x: number; top: number; foot: number }, { x: number; top: number; foot: number }, { x: number; top: number; foot: number }];
  x: number;
  y: number;
  len: number;
  angle: number;
};

/** Straight brass rail through the post tops. Feet stay on the measured treads. */
export function railLayout(anchor: HouseAnchor, aspect = SHEET_ASPECT): RailLayout {
  const [a, b, c] = anchor.steps;
  const topA = a.y - anchor.railHeight;
  const topC = c.y - anchor.railHeight;
  const span = c.x - a.x || 1;
  const topAt = (x: number) => topA + ((x - a.x) / span) * (topC - topA);
  const posts = [a, b, c].map((step) => ({
    x: step.x,
    top: round1(topAt(step.x)),
    foot: step.y,
  })) as RailLayout["posts"];
  const dx = c.x - a.x;
  const dy = topC - topA;
  const angle = (Math.atan2(dy / aspect, dx) * 180) / Math.PI;
  const len = Math.abs(dx / Math.cos((angle * Math.PI) / 180));
  return { posts, x: round1(a.x), y: round1(topA), len: round1(len), angle: round1(angle) };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function pct(n: number) {
  return `${round1(n)}%`;
}

/** CSS variables for the curtain, plate, and rail. The lamp is left to the stylesheet. */
export function dressAnchorVars(tier: string): Record<string, string> {
  const anchor = HOUSE_ANCHORS[tier] ?? HOUSE_ANCHORS.cottage;
  const rail = railLayout(anchor);
  const [p0, p1, p2] = rail.posts;
  const { window: win, plate } = anchor;
  return {
    "--win-x": pct(win.x),
    "--win-y": pct(win.y),
    "--win-w": pct(win.w),
    "--win-h": pct(win.h),
    "--plate-x": pct(plate.x),
    "--plate-y": pct(plate.y),
    "--plate-w": pct(plate.w),
    "--plate-h": pct(plate.h),
    "--ax": pct(p0.x),
    "--at": pct(p0.top),
    "--af": pct(p0.foot),
    "--bx": pct(p1.x),
    "--bt": pct(p1.top),
    "--bf": pct(p1.foot),
    "--cx": pct(p2.x),
    "--ct": pct(p2.top),
    "--cf": pct(p2.foot),
    "--rx1": pct(rail.x),
    "--ry1": pct(rail.y),
    "--rail-len": pct(rail.len),
    "--rail-angle": `${rail.angle}deg`,
  };
}
