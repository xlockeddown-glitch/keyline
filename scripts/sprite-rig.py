#!/usr/bin/env python3
"""0.0.83 sprite redraw: render a scout's v2 sheets from painted key art and a cut-out rig.

    python3 scripts/sprite-rig.py turtle            # writes public/sprites/scouts/turtle-v2.png + turtle-v2-coat.png
    python3 scripts/sprite-rig.py turtle --debug    # also writes scripts/sprite-redraw/turtle/debug-*.png (parts, masks)

Input (scripts/sprite-redraw/<scout>/): turnaround.jpg — four full-body views (front, left, right, back) painted
on flat magenta with the coat in a flat cobalt mask colour — plus idle-keyart.jpg (the 3/4 standing idle, same
style), and rig.json (crop boxes, part polygons, pivots; a view may name its own "source" image).
See scripts/sprite-redraw/README.md for how the art is made and how to rig a new scout.

Output layout (mirrored in src/game/coatLayer.ts v2Cell): 8 x 6 cells of 192 px.
  rows 0-3  walk, 8 frames: down, left, right, up (one full stride per row)
  row 4     idle down: the 3/4 idle pose, 8 frames (one slow breath, lantern sway, a blink)
  row 5     idle left (cols 0-3), idle right (cols 4-7)
  (walking up then stopping shows the down idle, as before.)
The base sheet carries the coat in the scout's default colour. The coat sheet (grey + alpha) holds only the
coat: grey = lightness offset from the coat's mean (128 = mean, 2 grey steps per Lab L unit), alpha = coat
coverage. Coats and dyes recolour that layer and composite it over the base (src/game/coatLayer.ts), so a
recolour can never touch the shell, belly, skin, boots or lantern. Deterministic.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
CELL = 192
COLS, ROWS = 8, 6
WALK_FRAMES = 8
WALK_ROWS = {"front": 0, "left": 1, "right": 2, "back": 3}
# idle view -> (row, first col, frames). "idle_front" is its own key art (the 3/4 pose); the side idles reuse the
# profile views.
IDLE_CELLS = {"idle_front": (4, 0, 8), "left": (5, 0, 4), "right": (5, 4, 4)}
COAT_STEP = 2.0  # grey steps per Lab L unit in the coat layer
COAT_MID = 128


# ---------------------------------------------------------------- colour (same formulas as scripts/fix-cat-coat.py)
def srgb_to_lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(u):
    u = np.clip(u, 0.0, 1.0)
    return np.where(u > 0.0031308, 1.055 * u ** (1 / 2.4) - 0.055, 12.92 * u) * 255.0


def to_lab(rgb):
    R, G, B = (srgb_to_lin(rgb[..., i]) for i in range(3))
    X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047
    Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
    Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    fx, fy, fz = f(X), f(Y), f(Z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)


def from_lab(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200
    inv = lambda t: np.where(t ** 3 > 0.008856, t ** 3, (t - 16 / 116) / 7.787)
    X, Y, Z = inv(fx) * 0.95047, inv(fy), inv(fz) * 1.08883
    R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z
    G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z
    B = 0.0557 * X - 0.2040 * Y + 1.0570 * Z
    return np.stack([lin_to_srgb(R), lin_to_srgb(G), lin_to_srgb(B)], -1)


def coat_colour(offset, tgt, keep=1.0):
    """Coat pixel colour from its lightness offset. Same maths as recolorCoatLayer in src/game/coatLayer.ts."""
    nl = np.clip(tgt["L"] + offset * keep, 4.0, 92.0)
    nc = tgt["C"] * np.clip(nl / tgt["L"], 0.5, 1.2)
    h = math.radians(tgt["h"])
    return from_lab(np.stack([nl, nc * math.cos(h), nc * math.sin(h)], -1))


# ---------------------------------------------------------------- key art -> view layers
def key_views(rig, d: Path):
    views = {}
    for src in sorted({v.get("source", rig["source"]) for v in rig["views"].values()}):
        names = [n for n, v in rig["views"].items() if v.get("source", rig["source"]) == src]
        bg = rig["views"][names[0]].get("background", rig["background"])
        views.update(key_image(rig, d / src, bg, names))
    return views


def key_image(rig, src: Path, bg, names):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
    bg = np.array(bg)
    d = np.sqrt(((im - bg) ** 2).sum(-1))
    a = np.clip((d - 45) / 75, 0, 1)
    col = np.clip((im - (1 - a[..., None]) * bg) / np.maximum(a[..., None], 1e-3), 0, 255)
    # Despill: near the silhouette, pull any leftover magenta (R and B over G) back to neutral.
    edge = ndimage.binary_dilation(a < 0.98, iterations=3)
    m = np.minimum(col[..., 0], col[..., 2]) - col[..., 1]
    fix = edge & (m > 0)
    col[fix, 0] -= m[fix]
    col[fix, 2] -= m[fix]
    # The painter's outline came out maroon (the key colour bled into it): within 4 px of the silhouette, take
    # red-magenta hues down to a neutral dark ink. Boots, shell and lantern (orange-brown hues) are untouched.
    rim = ndimage.binary_dilation(a < 0.5, iterations=4) & (a > 0.02)
    mx, mn = col.max(-1), col.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    hue_red = (col[..., 0] >= col[..., 1]) & (col[..., 2] >= col[..., 1] * 0.9) | ((col[..., 0] > col[..., 1] * 1.6) & (mx < 140))
    ink = rim & hue_red & (sat > 0.25)
    lum = col @ np.array([0.299, 0.587, 0.114])
    col[ink] = lum[ink][:, None] * 0.85 + np.array([6.0, 3.0, 0.0])
    col[a < 0.02] = 0
    views = {}
    for name in names:
        x0, y0, x1, y1 = rig["views"][name]["crop"]
        vc, va = col[y0:y1, x0:x1].copy(), a[y0:y1, x0:x1].copy()
        # "shadow_from": the painter added a soft floor shadow (darkened magenta). From this row down, anything
        # whose chromaticity is the key colour's is shadow, not character: drop it (the game draws its own).
        sf = rig["views"][name].get("shadow_from")
        if sf is not None:
            raw = im[y0:y1, x0:x1]
            chroma = raw / np.maximum(raw.sum(-1, keepdims=True), 1)
            near = np.sqrt(((chroma - bg / bg.sum()) ** 2).sum(-1)) < rig["views"][name].get("shadow_chroma", 0.26)
            near[: int(sf)] = False
            va[near], vc[near] = 0, 0
        # "erase": polygons of paint to drop (hair-thin whiskers seen from behind key out pink and read as specks)
        for poly in rig["views"][name].get("erase", []):
            m = poly_mask(va.shape, poly)
            va[m], vc[m] = 0, 0
        views[name] = (vc, va)
    return views


def coat_weight(col):
    """Cobalt mask colour -> coat coverage 0..1 (B well above R and G)."""
    w = (col[..., 2] - np.maximum(col[..., 0], col[..., 1]) + 4) / 24
    return np.clip(w, 0, 1)


def grade(col, g):
    """Gentle grade so the redraw sits with the older, dustier sheets (no effect on the coat, which is replaced)."""
    lum = col @ np.array([0.299, 0.587, 0.114])
    out = lum[..., None] + (col - lum[..., None]) * g["saturation"]
    out = 255 * (np.clip(out, 0, 255) / 255) ** g["gamma"] * g["gain"]
    out[..., 0] += g["warm"]
    out[..., 2] -= g["warm"]
    return np.clip(out, 0, 255)


def poly_mask(shape, poly):
    img = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(img).polygon([tuple(p) for p in poly], fill=255)
    return np.asarray(img) > 127


def ellipse_mask(shape, e, max_y, poly=None, top=False):
    """Head region: an ellipse cut at the collar, plus an optional polygon (pointed ears, whiskers)."""
    cx, cy, rx, ry = e
    yy, xx = np.mgrid[0 : shape[0], 0 : shape[1]]
    m = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
    if poly:
        m |= poly_mask(shape, poly)
    if top:  # everything above the head's centre is head (ear tips, tufts), whatever the outline
        m |= yy <= cy
    return m & (yy <= max_y)


def layer(col, a, w, mask):
    """5-channel premultiplied part: r, g, b, alpha, coat*alpha."""
    am = a * mask
    return np.dstack([col * am[..., None], am, w * am])


def fill_under(body, holes, reach):
    """Paint the body colour into holes left by parts in front of it (head, hand, lantern), so a part that moves a
    few pixels never opens a gap. Only holes within `reach` px of the body (or inside its closed outline)."""
    solid = body[..., 3] > 0.6
    closed = ndimage.binary_closing(solid, iterations=12)
    near = ndimage.distance_transform_edt(~solid) <= reach
    target = holes & (closed | near) & ~solid
    if not target.any():
        return body
    _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
    src = body[iy, ix]
    a = src[..., 3:4]
    src = src / np.maximum(a, 1e-6)  # unpremultiply nearest solid pixel, then lay it down opaque
    out = body.copy()
    out[target] = src[target]
    out[target, 3] = 1.0
    out[target, :3] *= 1.0
    out[target, 4] = np.clip(src[target, 4], 0, 1)
    return out


def extend(part, direction, until):
    """Smear a cut edge (a leg's top under the hem, a head's bottom under the hood) so the hidden end has paint."""
    out = part.copy()
    alpha = part[..., 3] > 0.5
    H = part.shape[0]
    for x in np.where(alpha.any(0))[0]:
        ys = np.where(alpha[:, x])[0]
        if direction == "up":
            y = ys.min()
            lo = max(0, int(until))
            yi = ys[min(len(ys) - 1, 3)]  # a few px in: the cut edge itself is outline
            if y > lo:
                out[lo:y, x] = part[yi, x] / max(part[yi, x, 3], 1e-6)
        else:
            y = ys.max()
            hi = min(H, int(until))
            if hi > y + 1:
                out[y + 1 : hi, x] = part[y, x] / max(part[y, x, 3], 1e-6)
    return out


def cut_parts(view, col, a, w):
    shape = a.shape
    used = np.zeros(shape, bool)
    parts = {}
    coat = w > 0.35
    hand = poly_mask(shape, view["hand"]["poly"])
    lant = poly_mask(shape, view["lantern"]["poly"]) & ~hand
    if view.get("skip_coat"):
        # "skip_coat": the sleeve reaches into the hand / lantern polygons (corgi): the coat, and for the lantern
        # its outline too (the coat grown by this many px), stays on the body instead of swinging with them
        hand &= ~coat
        lant &= ~ndimage.binary_dilation(coat, iterations=int(view["skip_coat"]))
    parts["hand"] = layer(col, a, w, hand)
    parts["lantern"] = layer(col, a, w, lant)
    used |= hand | lant
    # Tail (optional): its own part, swung about its root. Its polygon must hug the tail where it passes a leg
    # in front of it; where the tail is in front of a leg (back view) the leg's hidden paint is filled in below.
    tail = np.zeros(shape, bool)
    tv = view.get("tail")
    if tv:
        tail = poly_mask(shape, tv["poly"]) & ~used & (w < 0.08)
        if tv.get("min_red"):
            # Fur, not the darker boot leather the polygon crosses: drop dark paint that carries on outside the
            # polygon (the boot); dark stripes and outline wholly inside it stay with the tail.
            if tv.get("rev", 1) < 2:  # rev 1 (cat): any dark component touching outside the polygon goes
                dark, n = ndimage.label((col[..., 0] < tv["min_red"]) & (a > 0.3) & ~used)
                outside = np.unique(dark[(dark > 0) & ~poly_mask(shape, tv["poly"])])
                tail &= ~np.isin(dark, outside[outside > 0])
            else:  # rev 2 (fox)
                # "min_rb": saturated fur shadow (red well above blue) is still fur, however dark
                fur = (col[..., 0] >= tv["min_red"]) | ((col[..., 0] - col[..., 2]) >= tv.get("min_rb", 999))
                dark, n = ndimage.label(~fur & (a > 0.3) & ~used)
                inpoly = poly_mask(shape, tv["poly"])
                if n:
                    n_out = ndimage.sum(~inpoly, dark, range(1, n + 1))
                    n_in = ndimage.sum(inpoly, dark, range(1, n + 1))
                    # mostly outside the polygon = something else (a boot); mostly inside = the tail's own shading
                    foreign = 1 + np.where(n_out > np.maximum(40, 0.5 * n_in))[0]
                    # ... and only where a leg could be (a tail's own grey outline may touch a boot yet lie clear of it)
                    legs_at = np.zeros(shape, bool)
                    for lg in view.get("legs", []):
                        legs_at |= poly_mask(shape, lg["poly"])
                    if not legs_at.any():
                        legs_at[:] = True
                    tail &= ~(np.isin(dark, foreign) & legs_at)
        lab, n = ndimage.label(tail & (a > 0.5))
        if n > 1:  # keep the tail itself (it may be in a few pieces), not slivers of whatever else the polygon grazed
            sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
            big = 1 + (np.where(sizes >= max(0.04 * sizes.max(), 20))[0] if tv.get("rev", 1) >= 2 else np.array([int(np.argmax(sizes))]))
            tail &= ndimage.binary_dilation(np.isin(lab, big), iterations=2)
        parts["tail"] = layer(col, a, w, tail)
        if tv.get("layer", "back") == "back":
            # paint under whatever covered the tail (hem, legs) so a swing never shows a gap at its root
            parts["tail"] = fill_under(parts["tail"], poly_mask(shape, tv["poly"]) & (a > 0.5) & ~tail, 8)
        used |= tail
    tail_front = bool(tv) and tv.get("layer", "back") == "front"
    hv = view["head"]
    head = ellipse_mask(shape, hv["ellipse"], hv["max_y"], hv.get("poly"), hv.get("top", False)) & ~coat & ~used
    parts["head"] = layer(col, a, w, head)
    if hv["layer"] == "back":
        # Paint under the collar so a nod never opens a gap, but only in columns the hood/body covers below the
        # cut (a head wider than the hood would otherwise grow streaks off its cheeks).
        y0 = int(hv["max_y"]) + 1
        below = ((a[y0 : y0 + 14] > 0.5) & ~head[y0 : y0 + 14]).all(0) if y0 + 14 <= shape[0] else np.zeros(shape[1], bool)
        below = ndimage.binary_erosion(below, iterations=3)
        parts["head"] = np.where(below[None, :, None], extend(parts["head"], "down", hv["max_y"] + 14), parts["head"])
    used |= head
    legs = []
    for leg in view["legs"]:
        yy = np.mgrid[0 : shape[0], 0 : shape[1]][0]
        # The leg is what's in the polygon, minus the coat's hem outline (a few px under the coat), minus any
        # island not joined to the boot (shell rim, tail, the other leg's edge) — those stay on the body instead
        # of swinging with the leg.
        m = poly_mask(shape, leg["poly"]) & (w < 0.08) & ~used & ~ndimage.binary_dilation(coat, iterations=4)
        lab, n = ndimage.label(m & (a > 0.5))
        keep = np.unique(lab[(lab > 0) & (yy >= leg["ankle_y"] - 4)])
        m = m & ndimage.binary_dilation(np.isin(lab, keep[keep > 0]), iterations=2)
        used |= m
        top = min(p[1] for p in leg["poly"])
        thigh = layer(col, a, w, m & (yy < leg["ankle_y"]))
        boot = layer(col, a, w, m & (yy >= leg["ankle_y"]))
        # Only columns whose paint reaches the cut line under the hem get the smear (not the boot cuffs).
        tm = thigh[..., 3] > 0.5
        reach = np.zeros(shape, bool)
        for x in np.where(tm.any(0))[0]:
            if np.where(tm[:, x])[0].min() <= top + 6:
                reach[:, x] = True
        # Keep the smear off the leg's outline columns: a smeared outline is a dark stick that pokes out behind
        # the hem when the leg swings back and lifts.
        reach = ndimage.binary_erosion(reach, structure=np.ones((1, 3)), iterations=3)
        thigh = np.where(reach[..., None], extend(thigh, "up", leg["hip"][1] - 6), thigh)
        # Paint under the boot top (boots step and tilt on their own), only in columns where the thigh reaches the
        # ankle cut — smearing an edge column would draw a dark streak.
        tm = thigh[..., 3] > 0.5
        low = np.zeros(shape, bool)
        for x in np.where(tm.any(0))[0]:
            if np.where(tm[:, x])[0].max() >= leg["ankle_y"] - 2:
                low[:, x] = True
        low = ndimage.binary_erosion(low, iterations=3)
        thigh = np.where(low[..., None], extend(thigh, "down", leg["ankle_y"] + 10), thigh)
        # No hair-thin strands (a smeared single column reads as a stick once the leg rotates).
        solid = ndimage.binary_opening(thigh[..., 3] > 0.5, iterations=2)
        thigh = thigh * ndimage.binary_dilation(solid, iterations=1)[..., None]
        if tail_front:
            # the tail hangs in front of this leg: fill the leg's paint under it so a lifted leg has no hole
            hole = poly_mask(shape, leg["poly"]) & tail
            thigh = fill_under(thigh, hole & (yy < leg["ankle_y"]), 24)
            boot = fill_under(boot, hole & (yy >= leg["ankle_y"]), 24)
        bm = boot[..., 3] > 0.5
        cols = np.where(bm.any(0))[0]
        sole_pts = np.array([[x, np.where(bm[:, x])[0].max()] for x in cols], float) if len(cols) else np.array([[0.0, leg["ankle_y"]]])
        legs.append({**leg, "thigh": thigh, "boot": boot, "sole_pts": sole_pts})
    # per leg "copy" (corgi 0.0.87): stubby legs painted standing overlap, so the far leg is mostly hidden behind
    # the near one. Its polygon still claims what shows of it (off the body), but its parts become a copy of the
    # named leg moved by "copy_offset" [dx, dy] and darkened by "shade"; give its hip / ankle moved the same way.
    for lg in legs:
        if lg.get("copy"):
            src = next(o for o in legs if o["name"] == lg["copy"])
            dx, dy = (int(round(v)) for v in lg.get("copy_offset", [0, 0]))
            sh = float(lg.get("shade", 0.8))
            for k in ("thigh", "boot"):
                m = np.zeros_like(src[k])
                H, W = shape
                ys, yd = (slice(0, H - dy), slice(dy, H)) if dy >= 0 else (slice(-dy, H), slice(0, H + dy))
                xs, xd = (slice(0, W - dx), slice(dx, W)) if dx >= 0 else (slice(-dx, W), slice(0, W + dx))
                m[yd, xd] = src[k][ys, xs]
                m[..., :3] *= sh
                lg[k] = m
            lg["sole_pts"] = src["sole_pts"] + np.array([dx, dy], float)
    parts["legs"] = legs
    body = layer(col, a, w, ~used)
    if view.get("body_open") and view["legs"]:
        # Below the hem the body should hold nothing thin: a lone outline strand (a tail root's edge left beside a
        # leg) reads as a dark stick once the legs move. Opening drops strands, keeps the hem's rim.
        top = min(min(p[1] for p in lg["poly"]) for lg in view["legs"])
        solid = body[..., 3] > 0.3
        thin = solid & ~ndimage.binary_opening(solid, iterations=int(view["body_open"]))
        thin[:top] = False
        body[ndimage.binary_dilation(thin, iterations=1) & ~ndimage.binary_opening(solid, iterations=int(view["body_open"]))] = 0
    # Holes the painting itself has (the gap between an idle's planted legs, an arm's crook): carried with the body
    # into the part-id sheet as "art_gap", so the holes check doesn't count them.
    solid_src = a > 0.5
    parts["art_gap"] = (ndimage.binary_fill_holes(solid_src) & ~solid_src).astype(float)
    tail_rev2 = tail_front and view["tail"].get("rev", 1) >= 2
    front_holes = hand | lant | (head if hv["layer"] == "front" else np.zeros(shape, bool)) | (tail if tail_front and not tail_rev2 else np.zeros(shape, bool))
    parts["body"] = fill_under(body, front_holes & (a > 0.5), 10)
    if tail_rev2:
        # under a tail hanging in front: fill only inside the body's closed outline, never out past it (the tip
        # would leave a painted ghost behind when it swings)
        parts["body"] = fill_under(parts["body"], tail & (a > 0.5), 0)
    return parts


# ---------------------------------------------------------------- affine helpers (3x3, column vectors, image coords)
def T(dx, dy):
    return np.array([[1, 0, dx], [0, 1, dy], [0, 0, 1.0]])


def R(deg, px, py):
    r = math.radians(deg)
    c, s = math.cos(r), math.sin(r)
    return T(px, py) @ np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]]) @ T(-px, -py)


def S(sx, sy, px, py):
    return T(px, py) @ np.array([[sx, 0, 0], [0, sy, 0], [0, 0, 1.0]]) @ T(-px, -py)


def apply(M, pt):
    v = M @ np.array([pt[0], pt[1], 1.0])
    return v[0], v[1]


PART_IDS = {"body": 1, "head": 2, "tail": 3, "leg": 4, "hand": 5, "lantern": 6, "art_gap": 7}


def place(canvas, part, M, label=None, pid=0):
    """Composite a premultiplied part onto the canvas through M (part coords -> canvas coords). With `label`, also
    record which part is on top wherever it lands opaque (the part-id sheet qa-sprites uses for the holes check)."""
    inv = np.linalg.inv(M)
    H, W = canvas.shape[:2]
    src = np.zeros_like(canvas)
    mat = np.array([[inv[1, 1], inv[1, 0]], [inv[0, 1], inv[0, 0]]])
    off = np.array([inv[1, 2], inv[0, 2]])
    for ch in range(part.shape[2]):
        src[..., ch] = ndimage.affine_transform(part[..., ch], mat, offset=off, output_shape=(H, W), order=1, mode="constant", cval=0.0)
    a = src[..., 3:4]
    canvas *= 1 - a
    canvas += src
    if label is not None:
        label[a[..., 0] > 0.5] = pid
    return canvas


def warp_rows(part, dx, flare, cx):
    """Per-row horizontal warp of a part: row y moves by dx[y] and widens by flare[y] about cx. Used for the coat
    hem (flares and sways with the stride) and for hip sway vs shoulder counter-sway, without a seam."""
    H, W = part.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    xs = (xx - cx - dx[:, None]) / (1 + flare[:, None]) + cx
    out = np.empty_like(part)
    for ch in range(part.shape[2]):
        out[..., ch] = ndimage.map_coordinates(part[..., ch], [yy, xs], order=1, mode="constant", cval=0.0)
    return out


def ramp(H, y0, y1, power=1.0):
    y = np.arange(H, dtype=np.float64)
    r = np.clip((y - y0) / max(1.0, y1 - y0), 0, 1)
    return r * r * (3 - 2 * r) if power == "smooth" else r ** power


def blink(head, eyes):
    """Close the eyes on a head part: paint each eye with the surrounding skin and draw a lid line."""
    out = head.copy()
    H, W = head.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    a = head[..., 3]
    col = head[..., :3] / np.maximum(a[..., None], 1e-6)
    for cx, cy, rx, ry in eyes:
        e = ((xx - cx) / (rx + 2)) ** 2 + ((yy - cy) / (ry + 2)) ** 2
        inside = e <= 1
        ring = (e > 1.3) & (e <= 2.6) & (a > 0.9)
        lum = col @ np.array([0.299, 0.587, 0.114])
        sk = ring & (col[..., 1] > col[..., 2] + 10) & (lum > np.percentile(lum[ring], 30))
        skin = np.median(col[sk], 0) if sk.any() else np.median(col[ring], 0)
        # soft edge so the lid blends into the painted skin
        soft = np.clip((1.15 - e) / 0.3, 0, 1) * (a > 0.5)
        lid = skin * 0.94
        out[..., :3] = out[..., :3] * (1 - soft[..., None]) + (lid * a[..., None]) * soft[..., None]
        # lash line: a dark arc across the lower half of the eye
        t = np.linspace(-1, 1, 60)
        img = Image.new("L", (W, H), 0)
        ImageDraw.Draw(img).line([(cx + rx * 0.95 * u, cy + ry * 0.25 + ry * 0.28 * (1 - u * u)) for u in t], fill=255, width=max(2, int(round(rx * 0.22))))
        line = ndimage.gaussian_filter(np.asarray(img, np.float64) / 255, 0.7) * inside
        ink = np.array([38.0, 30.0, 18.0])
        out[..., :3] = out[..., :3] * (1 - line[..., None]) + (ink * a[..., None]) * line[..., None]
    return out


# ---------------------------------------------------------------- poses
def leg_len(view, leg):
    return view["sole"] - leg["hip"][1]


def pose(kind, name, i, view, n=WALK_FRAMES, gait=None):
    """Pose parameters for one frame. kind: 'walk' (8 frames, one stride) or 'idle' (n frames, one breath).
    Translations are in turnaround pixels (rig scale); render() rescales them for views painted at another size.

    Side walk: contact (legs widest, front heel strikes toe-up, body lowest) -> passing (swing leg lifted under the
    body, body highest) -> contact on the other foot; the trailing boot peels heel-first. The coat hem flares with
    the stride and sways a beat behind it; the lantern (always the right hand: near hand facing right, far hand
    facing left) swings against the right leg with a pendulum lag.
    Front/back walk: the swing foot steps toward the viewer (down + slightly bigger; away for the back view),
    hips sway over the planted foot, shoulders, head and lantern counter-sway, body rises at passing."""
    side = name in ("left", "right")
    # "gait" (top-level rig option, opt-in; corgi 0.0.87): a short-legged waddle. Keys and defaults (the plain walk):
    # swing 32 / lift 18 (profile leg swing in degrees, foot lift), bob 0 (extra body rise at passing in profile,
    # body only, so the planted foot stays on the street), lift_fb 13, hip 6.5, bob_fb 4 (front/back foot lift,
    # hip sway, body rise), roll 0 (front/back side-to-side body rock in degrees, the waddle).
    # slide 0: stubby legs (corgi) step by sliding forward/back under the hem (px, like a shuffle) instead of
    # swinging about the hip, so the wide fluffy thigh never wedges out from under the coat; swing then only tilts.
    g = {"swing": 32.0, "lift": 18.0, "slide": 0.0, "bob": 0.0, "lift_fb": 13.0, "hip": 6.5, "bob_fb": 4.0, "roll": 0.0, **(gait or {})}
    P = {"body_dx": 0.0, "body_dy": 0.0, "body_rot": 0.0, "breath": 0.0, "head_dy": 0.0, "head_rot": 0.0, "hand_rot": 0.0,
         "hand_dx": 0.0, "hand_dy": 0.0, "lantern_rot": 0.0, "hip": 0.0, "shoulder": 0.0, "flare": 0.0, "hem_dx": 0.0, "blink": 0.0, "tail_rot": 0.0, "legs": []}
    if kind == "walk":
        p = i / WALK_FRAMES
        t0 = 2 * math.pi * p
        if side:
            face = 1 if name == "right" else -1
            A, lift = g["swing"], g["lift"]
            # near leg forward at p=0 (heel strike), far leg back (push-off).
            for l in view["legs"]:
                th = t0 + (0.0 if l["name"] == "near" else math.pi)
                toe = 11.0 * max(0.0, math.cos(th)) ** 4  # heel strike: toe up
                heel = 14.0 * max(0.0, -math.cos(th + 0.25)) ** 4  # push-off at the end of stance: heel peels up
                P["legs"].append({"angle": A * math.cos(th), "lift": lift * max(0.0, -math.sin(th)) ** 0.8, "toe": toe - heel,
                                  "slide": face * g["slide"] * math.cos(th)})
            # right hand holds the lantern: near leg is the right leg facing right, the far leg facing left.
            th_r = t0 + (0.0 if name == "right" else math.pi)
            arm = -math.cos(th_r)  # forward when the right leg is back
            P["hand_dx"] = face * 4.0 * arm
            P["hand_dy"] = -1.2 * arm * arm
            P["hand_rot"] = -face * 3.0 * arm
            P["lantern_rot"] = face * 11.0 * math.sin(th_r - 1.2)
            P["body_rot"] = 1.8 * face + 0.5 * math.sin(2 * t0)  # lean into the walk, small rock per step
            P["flare"] = 0.08 * abs(math.cos(t0))
            P["hem_dx"] = -face * 3.0 * math.cos(2 * t0 - 1.0)
            P["head_rot"] = -0.8 * face * math.sin(2 * t0 - 0.8)
            P["tail_rot"] = face * 5.0 * math.sin(2 * t0 - 1.6)  # bobs a beat behind each step
            P["bob"] = -g["bob"] * math.sin(t0) ** 2  # body up at passing (sin = ±1), down at contact
        else:
            back = name == "back"
            for k, _ in enumerate(view["legs"]):
                th = t0 + k * math.pi
                z = -math.cos(th)  # -1 back .. +1 forward; the swing (sin > 0) brings it forward
                P["legs"].append({"angle": 0.0, "lift": g["lift_fb"] * max(0.0, math.sin(th)), "z": -z if back else z})
            # hips over the planted foot (rig legs are ordered screen-left, screen-right in both views)
            P["hip"] = g["hip"] * math.sin(t0)
            P["shoulder"] = -2.8 * math.sin(t0)
            P["body_dy"] = -g["bob_fb"] * abs(math.sin(t0))
            if g["roll"]:
                # waddle: the bottom swings out over the planted foot, rocking about the neck so the head stays put
                P["roll"] = -g["roll"] * math.sin(t0)
            P["hand_rot"] = -2.0 * math.sin(t0)
            P["lantern_rot"] = 7.0 * math.sin(t0 - 1.1)
            P["head_rot"] = 1.2 * math.sin(t0 - 0.6)
            P["tail_rot"] = 7.0 * math.sin(t0 - 1.4)  # swings with the hips, a beat late
        lag = math.sin(2 * math.pi * (p - 1 / WALK_FRAMES))
        P["head_dy"] = 1.6 * (abs(lag) - abs(math.sin(t0)))
    else:
        q = i / n
        b = 0.5 - 0.5 * math.cos(2 * math.pi * q)
        P["breath"] = b
        P["head_dy"] = -2.4 * b
        P["lantern_rot"] = 2.2 * math.sin(2 * math.pi * q)
        P["hand_dy"] = -0.8 * b
        if name == "idle_front":
            # one slow breath per 8 frames: shoulders lift, head nods back down a beat later, lantern sways,
            # a blink on frame 5.
            P["head_rot"] = 1.4 * math.sin(2 * math.pi * q - 0.9)
            P["lantern_rot"] = 3.5 * math.sin(2 * math.pi * q + 0.6)
            P["blink"] = 1.0 if i == 5 else 0.0
        P["tail_rot"] = 4.0 * math.sin(2 * math.pi * q + 1.8)  # slow lazy swish
        if side:
            P["legs"] = [{"angle": 6.0 if l["name"] == "near" else -5.0, "lift": 0.0} for l in view["legs"]]
        else:
            P["legs"] = [{"angle": 0.0, "lift": 0.0} for _ in view.get("legs", [])]
    return P


def render(view, name, parts, P, rig):
    scale = view.get("scale", rig["scale"])
    # pose translations are in rig-scale pixels; "motion" scales them for a scout painted at another size, so the
    # stride, lift and bob read the same on screen for every scout
    k = rig["scale"] / scale * rig.get("motion", 1.0)
    Hc = int(round(CELL / scale))
    canvas = np.zeros((Hc, Hc, 5))
    label = np.zeros((Hc, Hc), np.uint8)
    side = name in ("left", "right")
    face = 1 if name == "right" else -1
    sole = view["sole"]
    ax = view["anchor_x"]
    to_canvas = T(Hc / 2, rig["foot_y"] / scale) @ T(-ax, -sole)

    # Legs first, with the body at rest; then shift so the lowest boot sole sits exactly on the street.
    # Side views: the hips ride with the body, so the shift is the body height (the planted foot stays put).
    # Front/back: the legs don't ride the body bob, so the shift is one constant per view (from the neutral
    # stance); a foot stepping toward the viewer then lands a touch lower, as it should.
    def leg_mats(dy, legs_pose, hip=0.0):
        mats = []
        for leg, lp in zip(parts["legs"], legs_pose):
            hx, hy = leg["hip"]
            if side:
                rot = -face * (lp["angle"] - leg.get("art_angle", 0.0))
                M = to_canvas @ T(lp.get("slide", 0.0) * k, dy - lp["lift"] * k) @ R(rot, hx, hy)
                # Boot counter-rotates about the ankle so the sole stays near flat, then heel/toe roll.
                ankle = leg.get("ankle") or (sum(p[0] for p in leg["poly"]) / len(leg["poly"]), leg["ankle_y"])
                bM = M @ R(-0.8 * rot - face * lp.get("toe", 0.0), *ankle)
            else:
                z = lp.get("z", 0.0)
                reach = view.get("step_reach", 8.0) * z * k
                sc = 1 + view.get("step_scale", 0.10) * z
                sx = float(leg["sole_pts"][:, 0].mean())
                M = to_canvas @ T(0.5 * hip * k, dy - lp["lift"] * k + 0.5 * reach)
                bM = to_canvas @ T(0, dy - lp["lift"] * k + reach) @ S(sc, sc, sx, sole)
            mats.append((leg, M, bM))
        return mats

    def lowest(mats):
        y = -1e9
        for leg, _, bM in mats:
            pts = np.c_[leg["sole_pts"], np.ones(len(leg["sole_pts"]))]
            y = max(y, float((bM @ pts.T)[1].max()))
        return y

    floor = rig["foot_y"] / scale
    if not parts["legs"]:
        leg_M = []
    elif side:
        P["body_dy"] = (floor - lowest(leg_mats(0.0, P["legs"]))) / k
        leg_M = leg_mats(P["body_dy"] * k, P["legs"])
    else:
        neutral = [{"angle": 0.0, "lift": 0.0, "z": 0.0} for _ in P["legs"]]
        g = floor - lowest(leg_mats(0.0, neutral))
        to_canvas = T(0, g) @ to_canvas
        leg_M = leg_mats(0.0, P["legs"], P["hip"])

    # Body: per-row warp first (hem flare/sway in profile, hips vs shoulders front/back), then the rigid moves.
    body = parts["body"]
    Hb = body.shape[0]
    if side and (P["flare"] or P["hem_dx"]):
        hip_y = min(l["hip"][1] for l in view["legs"])
        r = ramp(Hb, hip_y - 40, view.get("hem_y", hip_y + 40), 1.4)
        body = warp_rows(body, P["hem_dx"] * k * r, P["flare"] * r, ax)
    elif not side and (P["hip"] or P["shoulder"]):
        r = ramp(Hb, view.get("chest_y", 170), view.get("hip_y", 300), "smooth")
        body = warp_rows(body, (P["shoulder"] + (P["hip"] - P["shoulder"]) * r) * k, np.zeros(Hb), ax)
    body_M = to_canvas @ T(P["body_dx"] * k, (P["body_dy"] + P.get("bob", 0.0)) * k) @ R(P["body_rot"], ax, sole) @ R(P.get("roll", 0.0), ax, view["head"]["max_y"]) @ S(1 + 0.006 * P["breath"], 1 + 0.014 * P["breath"], ax, sole)
    order = sorted(leg_M, key=lambda t: 0 if t[0]["name"] == "far" else 1)
    hv = view["head"]
    neck = (hv["ellipse"][0], hv["max_y"])
    head = blink(parts["head"], view["eyes"]) if P["blink"] and view.get("eyes") else parts["head"]
    hox, hoy = view.get("head_offset", [0, 0])  # a settled/hunched head sits lower and forward in its collar
    head_M = body_M @ T((P["shoulder"] + hox) * k, (P["head_dy"] + hoy) * k) @ R(P["head_rot"] + view.get("head_tilt", 0.0), *neck)
    if hv["layer"] == "back":
        place(canvas, head, head_M, label, PART_IDS["head"])
    tv = view.get("tail")
    if tv:
        tail_M = body_M @ T((P["hip"] if not side else P["hem_dx"]) * k, 0) @ R(P["tail_rot"], *tv["pivot"])
        if tv.get("layer", "back") == "back":
            place(canvas, parts["tail"], tail_M, label, PART_IDS["tail"])
    for leg, M, bM in order:
        place(canvas, leg["thigh"], M, label, PART_IDS["leg"])
        place(canvas, leg["boot"], bM, label, PART_IDS["leg"])
    place(canvas, body, body_M, label, PART_IDS["body"])
    if tv and tv.get("layer", "back") == "front":
        place(canvas, parts["tail"], tail_M, label, PART_IDS["tail"])
    if hv["layer"] == "front":
        place(canvas, head, head_M, label, PART_IDS["head"])
    hp = view["hand"]["pivot"]
    sh = P["shoulder"] if not side else 0.0
    hand_M = body_M @ T((P["hand_dx"] + sh) * k, P["hand_dy"] * k) @ R(P["hand_rot"], *hp)
    place(canvas, parts["hand"], hand_M, label, PART_IDS["hand"])
    lp_ = view["lantern"]["pivot"]
    lant_M = hand_M @ R(P["lantern_rot"] - P["hand_rot"] - P["body_rot"], *lp_)
    place(canvas, parts["lantern"], lant_M, label, PART_IDS["lantern"])
    if rig.get("underpaint"):
        underpaint(canvas, label, rig["underpaint"])
    gap = np.zeros((Hc, Hc, 4))
    place(gap, np.repeat(parts["art_gap"][..., None], 4, axis=2), body_M)
    label[(gap[..., 3] > 0.5) & (canvas[..., 3] < 0.5)] = PART_IDS["art_gap"]
    return canvas, label


def underpaint(canvas, label, opt):
    """Paint a shadow layer *behind* a rendered frame wherever the background would show through the figure:
    slits between parts the rig moves apart (thigh/boot under the hem, the tail joint), soft or keyed-out paint
    inside a part (the raccoon's tail rings), and fully enclosed gaps. Opt-in per scout ("underpaint" in rig.json,
    raccoon 0.0.89): {"close": closing radius in canvas px (gaps up to ~2x this wide are filled), "depth": how far
    inside the filled outline semi-transparent paint is backed, "shade": darkening of the copied neighbour colour}.
    Openings framed by the hand or lantern (the bail loop, the gap between the lantern arm and the body) stay open.
    The underpaint copies the nearest solid pixel's colour and coat-mask value, so a dyed coat stays dyed."""
    r = int(opt.get("close", 6))
    a = canvas[..., 3]
    solid = a > 0.5
    disk = np.hypot(*np.mgrid[-r : r + 1, -r : r + 1]) <= r
    pad = r + 2
    closed = ndimage.binary_closing(np.pad(solid, pad), structure=disk)[pad:-pad, pad:-pad]
    filled = ndimage.binary_fill_holes(closed | solid)
    core = ndimage.binary_erosion(ndimage.binary_fill_holes(solid), iterations=int(opt.get("depth", 6)))
    region = ((filled & ~solid) | core) & (a < 0.98)
    L, n = ndimage.label(region, structure=np.ones((3, 3)))
    keep = np.zeros_like(region)
    hand = (label == PART_IDS["hand"]) | (label == PART_IDS["lantern"])
    for i in range(1, n + 1):
        m = L == i
        ring = ndimage.binary_dilation(m, structure=np.ones((3, 3))) & ~m & solid
        if ring.any() and hand[ring].mean() >= 0.3:
            continue
        keep |= m
    if not keep.any():
        return
    _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
    src = canvas[iy, ix]
    sa = np.maximum(src[..., 3:4], 1e-6)
    under = np.concatenate([src[..., :3] / sa * opt.get("shade", 0.75), np.ones_like(sa), src[..., 4:] / sa], axis=2)
    w = keep[..., None] * (1 - canvas[..., 3:4])
    canvas += w * under
    label[keep & (label == 0)] = label[iy, ix][keep & (label == 0)]


def downscale_label(label):
    """Part ids at cell size (nearest: ids are not blendable)."""
    return np.asarray(Image.fromarray(label).resize((CELL, CELL), Image.NEAREST))


def downscale(canvas):
    out = np.zeros((CELL, CELL, canvas.shape[2]))
    for ch in range(canvas.shape[2]):
        img = Image.fromarray(canvas[..., ch].astype(np.float32), mode="F")
        out[..., ch] = np.asarray(img.resize((CELL, CELL), Image.LANCZOS))
    out[..., 3] = np.clip(out[..., 3], 0, 1)
    out[..., 4] = np.clip(out[..., 4], 0, out[..., 3])
    out[..., :3] = np.clip(out[..., :3], 0, out[..., 3:4] * 255)
    out[out[..., 3] < 6 / 255] = 0  # resampling haze (invisible, but it costs bytes and makes islands)
    # Drop specks: tiny islands of paint not attached to the figure (a resampled corner of a moved part).
    lab, n = ndimage.label(out[..., 3] > 0.02)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        out[np.isin(lab, 1 + np.where(sizes < 12)[0])] = 0
    return out


def finish(cell, rig, ref_L, keep):
    """Premultiplied 5-channel cell -> (base RGBA, coat mask L) uint8. The mask is coat coverage per pixel (0-255),
    independent of the pixel's alpha."""
    a = cell[..., 3]
    safe = np.maximum(a, 1e-6)
    col = cell[..., :3] / safe[..., None]
    w = np.clip(cell[..., 4] / safe * 1.6, 0, 1)
    w[a < 1 / 255] = 0
    L = to_lab(col)[..., 0]
    coat_rgb = coat_colour(L - ref_L, rig["default_coat"], keep)
    base = col * (1 - w[..., None]) + coat_rgb * w[..., None]
    base_rgba = np.dstack([base, a * 255])
    base_rgba[a < 1 / 255] = 0
    mask = np.round(w * 255)
    return np.round(np.clip(base_rgba, 0, 255)).astype(np.uint8), mask.astype(np.uint8)


def apply_coat(base, mask, tgt, default):
    """Recolour the coat of a v2 base sheet. Python twin of applyCoatLayer in src/game/coatLayer.ts (keep in step).
    The base coat was painted as default.L + offset, so the new coat is tgt.L + offset: lightness moves by
    tgt.L - default.L, hue and chroma come from the target, and only masked pixels change (by their coverage)."""
    out = base.astype(np.float64).copy()
    m = (mask.astype(np.float64) / 255.0) * (base[..., 3] > 0)
    sel = m > 0
    if not sel.any():
        return base.copy()
    L = to_lab(out[sel][:, :3])[:, 0]
    nl = np.clip(L + (tgt["L"] - default["L"]), 4.0, 92.0)
    nc = tgt["C"] * np.clip(nl / tgt["L"], 0.5, 1.2)
    h = math.radians(tgt["h"])
    rgb = from_lab(np.stack([nl, nc * math.cos(h), nc * math.sin(h)], -1))
    mm = m[sel][:, None]
    out[sel, :3] = out[sel, :3] * (1 - mm) + rgb * mm
    return np.round(np.clip(out, 0, 255)).astype(np.uint8)


def pack(base_sheet, mask_sheet):
    """Ship sizes: the base as a 256-colour palette PNG (Floyd-Steinberg; indistinguishable at play size, ~5x
    smaller), the mask in 16 coverage steps."""
    base = Image.fromarray(base_sheet, "RGBA").quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    m = mask_sheet.astype(np.int32)
    m = np.clip((m + 8) // 17 * 17, 0, 255).astype(np.uint8)
    m[np.asarray(base.convert("RGBA"))[..., 3] == 0] = 0
    return base, Image.fromarray(m, "L")


def head_median(col, a, w, view):
    hv = view["head"]
    m = ellipse_mask(a.shape, hv["ellipse"], hv["max_y"], hv.get("poly"), hv.get("top", False)) & (w < 0.05) & (a > 0.95)
    return np.median(col[m], 0)


def main():
    scout = sys.argv[1] if len(sys.argv) > 1 else "turtle"
    debug = "--debug" in sys.argv
    d = ROOT / "scripts" / "sprite-redraw" / scout
    rig = json.loads((d / "rig.json").read_text())
    views = key_views(rig, d)
    graded = {}
    coatL = {}
    for name, (col, a) in views.items():
        w = coat_weight(col)
        if rig.get("coat_min_island"):
            # bluish specks off the coat (eye shine, a nose highlight) are not coat: keep only big coat regions
            lab, n = ndimage.label(w > 0.05)
            if n:
                sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
                keep_ids = 1 + np.where(sizes >= rig["coat_min_island"])[0]
                near = rig.get("coat_keep_near")
                if near:
                    # [min px, reach px] (corgi): a smaller piece of coat seen between the toggles and the strap is
                    # still coat if it lies within reach of a big coat region and off the hand / lantern
                    big = ndimage.binary_dilation(np.isin(lab, keep_ids), iterations=int(near[1]))
                    v = rig["views"][name]
                    off = poly_mask(w.shape, v["hand"]["poly"]) | poly_mask(w.shape, v["lantern"]["poly"])
                    for i in np.where((sizes >= near[0]) & (sizes < rig["coat_min_island"]))[0]:
                        comp = lab == i + 1
                        if (comp & big).any() and not (comp & off).any():
                            keep_ids = np.append(keep_ids, i + 1)
                w = w * np.isin(lab, keep_ids)
        g = grade(col, {**rig["grade"], **rig["views"][name].get("grade", {})})
        graded[name] = (g, a, w)
        sel = (w > 0.9) & (a > 0.95)
        coatL[name] = to_lab(col[sel])[..., 0]
    # Views painted in a separate pass (the idle key art) get matched to the turnaround: a per-channel gain that
    # brings their skin to the turnaround front's, and their own coat lightness reference.
    ref_skin = head_median(*graded["front"], rig["views"]["front"])
    for name, view in rig["views"].items():
        if view.get("source", rig["source"]) != rig["source"]:
            g, a, w = graded[name]
            gain = np.clip(ref_skin / np.maximum(head_median(g, a, w, view), 1), 0.75, 1.25)
            graded[name] = (np.clip(g * gain, 0, 255), a, w)
            if debug:
                print(name, "skin gain", np.round(gain, 3).tolist())
    turn = [n for n, v in rig["views"].items() if v.get("source", rig["source"]) == rig["source"]]
    allL = np.concatenate([coatL[n] for n in turn])
    ref_L = float(np.median(allL))
    spread = float(np.percentile(allL, 90) - np.percentile(allL, 10))
    keep = rig.get("coat_keep") or min(1.0, 22.0 / max(spread, 1e-3))
    base_sheet = np.zeros((ROWS * CELL, COLS * CELL, 4), np.uint8)
    coat_sheet = np.zeros((ROWS * CELL, COLS * CELL), np.uint8)
    part_sheet = np.zeros((ROWS * CELL, COLS * CELL), np.uint8)

    def put(r, c, rendered, view_ref):
        canvas, label = rendered
        cell = downscale(canvas)
        lab = downscale_label(label)
        part_sheet[r * CELL : (r + 1) * CELL, c * CELL : (c + 1) * CELL] = np.where((cell[..., 3] > 0.02) | (lab == PART_IDS["art_gap"]), lab, 0)
        b, m = finish(cell, rig, view_ref, keep)
        base_sheet[r * CELL : (r + 1) * CELL, c * CELL : (c + 1) * CELL] = b
        coat_sheet[r * CELL : (r + 1) * CELL, c * CELL : (c + 1) * CELL] = m

    for name, view in rig["views"].items():
        col, a, w = graded[name]
        view_ref = ref_L if name in turn else float(np.median(coatL[name]))
        view.setdefault("legs", [])
        if view.get("sole") == "auto":
            view["sole"] = int(np.where((a > 0.5).any(1))[0].max())
        # Coat pixels keep their own (ungraded) colour for the lightness offset; the grade only touches the rest.
        raw = views[name][0]
        mixed = np.where((w > 0)[..., None], raw, col)
        # Cobalt bounce light on skin and boots right next to the coat: pull blue back to the warmer channels.
        spill = w < 0.5
        mixed[..., 2] = np.where(spill, np.minimum(mixed[..., 2], np.maximum(mixed[..., 0], mixed[..., 1]) + 2), mixed[..., 2])
        parts = cut_parts(view, mixed, a, w)
        if "anchor_x" not in view:
            body_a = parts["body"][..., 3] > 0.5
            xs = np.where(body_a.any(0))[0]
            view["anchor_x"] = float((xs.min() + xs.max()) / 2)
        if debug:
            dbg = parts["body"].copy()
            Image.fromarray(np.dstack([np.clip(dbg[..., :3] / np.maximum(dbg[..., 3:4], 1e-6), 0, 255), dbg[..., 3] * 255]).astype(np.uint8)).save(d / f"debug-body-{name}.png")
        if name in WALK_ROWS:
            for i in range(WALK_FRAMES):
                put(WALK_ROWS[name], i, render(view, name, parts, pose("walk", name, i, view, gait=rig.get("gait")), rig), view_ref)
        if name in IDLE_CELLS:
            r, c0, n = IDLE_CELLS[name]
            for i in range(n):
                put(r, c0 + i, render(view, name, parts, pose("idle", name, i, view, n, gait=rig.get("gait")), rig), view_ref)
    out = ROOT / "public" / "sprites" / "scouts"
    base_img, mask_img = pack(base_sheet, coat_sheet)
    base_img.save(out / f"{scout}-v2.png", optimize=True)
    mask_img.save(out / f"{scout}-v2-coat.png", optimize=True)
    # Part ids per pixel (0 none, see PART_IDS), for qa-sprites' interior-holes check: a gap closed off by the
    # lantern or the lantern hand is the lantern hanging against the body, not a hole in it.
    Image.fromarray(part_sheet, "L").save(d / "parts-v2.png", optimize=True)
    # Shop/hire icon: the first standing frame at half size, palette PNG like the other icons.
    r0 = IDLE_CELLS["idle_front"][0]
    icon = base_img.convert("RGBA").crop((0, r0 * CELL, CELL, (r0 + 1) * CELL)).resize((96, 96), Image.LANCZOS)
    icon.quantize(256, method=Image.Quantize.FASTOCTREE).save(out / f"{scout}.png", optimize=True)
    meta = {"ref_L": round(ref_L, 2), "coat_keep": round(keep, 3), "spread": round(spread, 2)}
    print(json.dumps({"scout": scout, **meta}))


if __name__ == "__main__":
    main()
