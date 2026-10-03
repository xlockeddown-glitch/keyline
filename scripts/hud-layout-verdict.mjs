/**
 * Pure checks for the top HUD layout, fed by scripts/qa-hud-mobile.mjs (rects measured in a real browser).
 * 0.0.47: at phone widths the status plate (city, coin, Next/Goals/Train/Daily/Night market) was squeezed to
 * ~30 px by the top button row; these rules keep it readable.
 *
 * rect: { left, top, width, height } in CSS px.
 */
export const MIN_STATUS_WIDTH = 200;

const right = (r) => r.left + r.width;
const bottom = (r) => r.top + r.height;
const overlaps = (a, b) => a.left < right(b) && right(a) > b.left && a.top < bottom(b) && bottom(a) > b.top;

/**
 * @param {{ width: number, height: number, status: object|null, kits: object[], row?: object|null, zoom: object|null, overflowX: boolean }} m
 *   row: the button row's own box (.hud-kits); falls back to the topmost button.
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
  const rowTop = m.row ? m.row.top : Math.min(...m.kits.map((k) => k.top));
  if (opts.desktop && m.kits.length && Math.abs(rowTop - m.status.top) > 1) out.push(`${tag}: desktop plate no longer beside the button row`);
  return out;
}
