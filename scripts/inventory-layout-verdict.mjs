/**
 * Inventory-screen layout verdict (0.0.57). `measureOpenPanel` runs in the page (pass it to page.evaluate) and
 * describes the open sheet — Satchel, Journal, Outfitter / print shop, lamp card; `inventoryProblems` turns that
 * into problem strings: horizontal page scroll, a sheet wider/taller than the screen, controls off the side,
 * buttons below the fold with no scroll to reach them, overlapping buttons, clipped button text, and
 * squashed tap targets.
 */

/** Runs in the browser. `sel` picks the sheet (defaults to the top-most open one). */
export function measureOpenPanel(sel) {
  const W = innerWidth;
  const H = innerHeight;
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  };
  const roots = [...document.querySelectorAll(sel || ".vault-night, .panel")].filter(vis);
  const root = roots[roots.length - 1];
  if (!root) return { W, H, missing: true };
  const rect = (el) => {
    const b = el.getBoundingClientRect();
    return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) };
  };
  const scroller = (el, axis) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const o = axis === "x" ? cs.overflowX : cs.overflowY;
      if ((o === "auto" || o === "scroll") && (axis === "x" ? p.scrollWidth > p.clientWidth + 1 : p.scrollHeight > p.clientHeight + 1)) return p;
    }
    return null;
  };
  // What of an element is actually on screen: its box cut by every clipping ancestor (scrolled-away rows don't count).
  const shown = (el) => {
    const b = el.getBoundingClientRect();
    let l = b.left, t = b.top, r = b.right, bt = b.bottom;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const c = p.getBoundingClientRect();
      l = Math.max(l, c.left); t = Math.max(t, c.top); r = Math.min(r, c.right); bt = Math.min(bt, c.bottom);
    }
    return r - l > 1 && bt - t > 1 ? { left: l, top: t, right: r, bottom: bt } : null;
  };
  const name = (el) => (el.getAttribute("aria-label") || el.textContent || el.className?.toString() || el.tagName).replace(/\s+/g, " ").trim().slice(0, 40);
  const all = [...root.querySelectorAll("button, a[href], input, select, [role=tab]")].filter(vis);
  const controls = all.filter((el) => shown(el));
  const offX = [];
  const below = [];
  const clipped = [];
  const tiny = [];
  for (const el of all) {
    const b = rect(el);
    if ((b.l < -1 || b.r > W + 1) && !scroller(el, "x")) offX.push(`${name(el)} [${b.l}..${b.r}]`);
    if ((b.b > H + 1 || b.t < -1) && !scroller(el, "y")) below.push(`${name(el)} [${b.t}..${b.b}]`);
    if (!shown(el)) continue;
    const cs = getComputedStyle(el);
    if (el.tagName === "BUTTON" && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== "ellipsis" && cs.overflowX !== "visible") clipped.push(name(el));
    if (b.w < 28 || b.h < 24) tiny.push(`${name(el)} ${b.w}x${b.h}`);
  }
  const overlaps = [];
  for (let i = 0; i < controls.length; i += 1) {
    for (let j = i + 1; j < controls.length; j += 1) {
      const a = shown(controls[i]);
      const c = shown(controls[j]);
      if (controls[i].contains(controls[j]) || controls[j].contains(controls[i])) continue;
      const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      if (ix > 3 && iy > 3) overlaps.push(`${name(controls[i])} × ${name(controls[j])}`);
    }
  }
  // Text pushed out of its box sideways (long words in narrow grid cells).
  const textOut = [];
  for (const el of root.querySelectorAll("p, h2, h3, li, span")) {
    if (!vis(el) || el.children.length > 3) continue;
    const b = el.getBoundingClientRect();
    if ((b.right > W + 1 || b.left < -1) && !scroller(el, "x")) textOut.push(`${name(el)} [${Math.round(b.left)}..${Math.round(b.right)}]`);
  }
  // Something from outside the sheet drawn over it (the map's zoom buttons were). Map attribution may sit on top.
  const covered = new Set();
  const pb = root.getBoundingClientRect();
  for (const x of [pb.left + 10, pb.left + pb.width / 2, pb.right - 10]) {
    for (const y of [pb.top + 10, pb.top + 40, pb.top + pb.height / 2, pb.bottom - 10]) {
      if (x < 0 || y < 0 || x > W || y > H) continue;
      const el = document.elementFromPoint(x, y);
      if (!el || root.contains(el) || el.contains(root) || el.closest(".leaflet-control-attribution, .toast, [role=status]")) continue;
      covered.add(`${(el.closest("[class]")?.className?.toString() || el.tagName).slice(0, 40)} at ${Math.round(x)},${Math.round(y)}`);
    }
  }
  const tabsScroll = [...root.querySelectorAll("[role=tablist]")].filter((t) => vis(t) && t.scrollWidth > t.clientWidth + 1).map((t) => `${t.getAttribute("aria-label") || "tabs"} ${t.scrollWidth}>${t.clientWidth}`);
  return {
    tabsScroll,
    covered: [...covered].slice(0, 4),
    W,
    H,
    panel: rect(root),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    offX: offX.slice(0, 6),
    below: below.slice(0, 6),
    clipped: clipped.slice(0, 6),
    tiny: tiny.slice(0, 6),
    overlaps: overlaps.slice(0, 6),
    textOut: textOut.slice(0, 6),
  };
}

export function inventoryProblems(label, m) {
  if (m.missing) return [`${label}: sheet did not open`];
  const out = [];
  if (m.overflowX) out.push(`${label}: page scrolls sideways`);
  if (m.panel.l < -1 || m.panel.r > m.W + 1) out.push(`${label}: sheet is wider than the screen (${m.panel.l}..${m.panel.r} of ${m.W})`);
  if (m.panel.t < -1 || m.panel.b > m.H + 1) out.push(`${label}: sheet runs off the screen (${m.panel.t}..${m.panel.b} of ${m.H})`);
  for (const x of m.offX) out.push(`${label}: control off the side: ${x}`);
  for (const x of m.below) out.push(`${label}: control off screen with no scroll: ${x}`);
  for (const x of m.overlaps) out.push(`${label}: buttons overlap: ${x}`);
  for (const x of m.clipped) out.push(`${label}: button text clipped: ${x}`);
  for (const x of m.tiny) out.push(`${label}: squashed tap target: ${x}`);
  for (const x of m.tabsScroll ?? []) out.push(`${label}: tab row runs off the sheet: ${x}`);
  for (const x of m.covered ?? []) out.push(`${label}: sheet covered by ${x}`);
  for (const x of m.textOut) out.push(`${label}: text off the side: ${x}`);
  return out;
}
