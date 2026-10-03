/**
 * Pure checks for the top HUD layout, fed by scripts/qa-hud-mobile.mjs (rects measured in a real browser).
 * 0.0.47: at phone widths the status plate (city, coin, Next/Goals/Train/Daily/Night market) was squeezed to
 * ~30 px by the top button row; these rules keep it readable.
 *
 * rect: { left, top, width, height } in CSS px.
 */
export const MIN_STATUS_WIDTH = 200;
/** 0.0.48: the bottom-right lamp card ("Campus Martius Park / At the lamp · E or tap") keeps at least this much width. */
export const MIN_SIGHT_WIDTH = 120;

const right = (r) => r.left + r.width;
const bottom = (r) => r.top + r.height;
const overlaps = (a, b) => a.left < right(b) && right(a) > b.left && a.top < bottom(b) && bottom(a) > b.top;

/**
 * @param {{ width: number, height: number, status: object|null, kits: object[], row?: object|null, zoom: object|null, overflowX: boolean,
 *   sight?: object|null, sightName?: object|null, act?: object|null }} m
 *   row: the button row's own box (.hud-kits); falls back to the topmost button.
 *   sight / sightName / act (0.0.48): the bottom lamp card, its lamp-name line and the E button. Checked when measured
 *   (undefined = not measured); null means the card was expected and is missing.
 * @param {{ desktop?: boolean }} [opts] desktop: the plate and button row share one line (the pre-0.0.47 layout).
 * @returns {string[]} problems (empty = pass)
 */
export function hudLayoutProblems(m, opts = {}) {
  const tag = `${m.width}x${m.height}`;
  const out = [];
  if (!m.status) return [`${tag}: no HUD status plate`];
  if (m.status.width < MIN_STATUS_WIDTH) out.push(`${tag}: HUD status plate ${Math.round(m.status.width)} px wide (< ${MIN_STATUS_WIDTH})`);
  if (right(m.status) > m.width + 0.5) out.push(`${tag}: HUD status plate runs off the right edge`);
  if (m.overflowX) out.push(`${tag}: page scrolls sideways`);
  m.kits.forEach((k, i) => {
    if (overlaps(k, m.status)) out.push(`${tag}: top button ${i + 1} covers the status plate`);
    if (k.left < -0.5 || right(k) > m.width + 0.5) out.push(`${tag}: top button ${i + 1} is off screen`);
    if (k.width < 36) out.push(`${tag}: top button ${i + 1} squeezed to ${Math.round(k.width)} px`);
    if (m.zoom && overlaps(k, m.zoom)) out.push(`${tag}: top button ${i + 1} covers the map zoom`);
  });
  if (m.zoom && overlaps(m.status, m.zoom)) out.push(`${tag}: status plate covers the map zoom`);
  out.push(...sightProblems(m));
  const rowTop = m.row ? m.row.top : Math.min(...m.kits.map((k) => k.top));
  if (opts.desktop && m.kits.length && Math.abs(rowTop - m.status.top) > 1) out.push(`${tag}: desktop plate no longer beside the button row`);
  return out;
}

/** 0.0.48: at 390x844 the lamp card ran off the right edge (its long name refused to shrink) and pushed the E button off screen. */
export function sightProblems(m) {
  const tag = `${m.width}x${m.height}`;
  if (m.sight === undefined) return [];
  if (!m.sight) return [`${tag}: no lamp card`];
  const out = [];
  const s = m.sight;
  if (s.left < -0.5) out.push(`${tag}: lamp card runs off the left edge`);
  if (right(s) > m.width + 0.5) out.push(`${tag}: lamp card runs off the right edge (${Math.round(right(s) - m.width)} px past)`);
  if (bottom(s) > m.height + 0.5) out.push(`${tag}: lamp card runs off the bottom edge`);
  if (s.width < MIN_SIGHT_WIDTH) out.push(`${tag}: lamp card squeezed to ${Math.round(s.width)} px (< ${MIN_SIGHT_WIDTH})`);
  const n = m.sightName;
  if (n && (n.left < s.left - 0.5 || right(n) > right(s) + 0.5)) out.push(`${tag}: lamp name spills out of the lamp card`);
  if (m.act === null) out.push(`${tag}: no E button`);
  else if (m.act) {
    if (m.act.left < -0.5 || right(m.act) > m.width + 0.5 || bottom(m.act) > m.height + 0.5) out.push(`${tag}: E button is off screen`);
    if (overlaps(m.act, s)) out.push(`${tag}: E button covers the lamp card`);
  }
  return out;
}
