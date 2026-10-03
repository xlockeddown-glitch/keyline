#!/usr/bin/env python3
"""0.0.49 pass 2: the Lynx's head, painted from scratch per facing (front, left, right, back).

Used by scripts/draw-lynx.py; not run on its own. Shapes are laid out in head units (U = half the crown's
width) around the eye line, filled at 6x on an indexed canvas and reduced by majority vote per pixel (flat
pixel-art colours, no blur), then the fine line work (tufts, forehead stripes, lip line, ruff bar, spots)
is drawn at the sprite's own resolution so it stays one or two pixels wide. Silhouette: a wide head that is
wider at the jaw than the crown (white-tipped cheek ruffs), tall triangular ears set wide, long black tufts."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

SS = 6
PAL = {
    1: (204, 150, 74),   # fur (golden tawny)
    2: (230, 188, 112),  # fur light
    3: (168, 114, 52),   # fur shade
    4: (126, 82, 38),    # fur deep shade
    5: (246, 242, 232),  # white
    6: (210, 200, 184),  # white shade
    7: (24, 18, 14),     # black
    8: (70, 44, 24),     # stripe / spot
    9: (234, 204, 186),  # inner ear
    10: (192, 102, 98),  # nose
    11: (226, 178, 56),  # eye
    12: (34, 24, 16),    # eye dark
    13: (255, 252, 240), # highlight
    14: (62, 40, 22),    # outline
}
FUR, FUR_LT, FUR_SH, FUR_DK, WHITE, WHITE_SH, BLACK, STRIPE, EAR_IN, NOSE, EYE, EYE_DK, HI, OUTLINE = range(1, 15)


def _mirror(pts):
    return [(-x, y) for x, y in pts]


class Painter:
    def __init__(self, W: int, hx: float, hy: float, U: float, flip: bool = False):
        self.W, self.hx, self.hy, self.U, self.flip = W, hx, hy, U, flip
        self.hi = Image.new("L", (W * SS, W * SS), 0)
        self.d = ImageDraw.Draw(self.hi)

    def P(self, x, y, k=SS):
        if self.flip:
            x = -x
        return ((self.hx + x * self.U) * k, (self.hy + y * self.U) * k)

    def poly(self, pts, c):
        self.d.polygon([self.P(x, y) for x, y in pts], fill=c)

    def ell(self, cx, cy, rx, ry, c):
        x0, y0 = self.P(cx - rx if not self.flip else cx + rx, cy - ry)
        x1, y1 = self.P(cx + rx if not self.flip else cx - rx, cy + ry)
        self.d.ellipse([min(x0, x1), y0, max(x0, x1), y1], fill=c)

    def shaded_ell(self, cx, cy, rx, ry, light=True):
        self.ell(cx, cy, rx, ry, FUR_SH)
        self.ell(cx - 0.05 * rx, cy - 0.08 * ry, rx * 0.9, ry * 0.86, FUR)
        if light:
            self.ell(cx - 0.25 * rx, cy - 0.45 * ry, rx * 0.42, ry * 0.3, FUR_LT)

    def reduce(self) -> np.ndarray:
        a = np.asarray(self.hi).reshape(self.W, SS, self.W, SS).transpose(0, 2, 1, 3).reshape(self.W, self.W, SS * SS)
        out = np.zeros((self.W, self.W), dtype=np.uint8)
        cover = (a > 0).sum(-1)
        ys, xs = np.nonzero(cover >= SS * SS * 0.45)
        for y, x in zip(ys, xs):
            v = a[y, x]
            v = v[v > 0]
            out[y, x] = np.bincount(v).argmax()
        self.lo = Image.fromarray(out, "L")
        self.ld = ImageDraw.Draw(self.lo)
        return out

    # line work at sprite resolution
    def line(self, pts, c, w=1):
        self.ld.line([self.P(x, y, 1) for x, y in pts], fill=c, width=w)

    def dot(self, x, y, c, big=False):
        px, py = self.P(x, y, 1)
        px, py = int(round(px)), int(round(py))
        cells = [(px, py)] + ([(px + 1, py), (px, py + 1), (px + 1, py + 1)] if big else [])
        a = np.asarray(self.lo)
        for qx, qy in cells:
            if 0 <= qx < self.W and 0 <= qy < self.W and a[qy, qx] in (FUR, FUR_LT, FUR_SH, FUR_DK):
                self.lo.putpixel((qx, qy), c)

    def tuft(self, tip, top, wide: float):
        """A long tapered black tuft: two pixels wide for the lower part, one at the top."""
        (tx, ty), (ux, uy) = tip, top
        mid = (tx + (ux - tx) * wide, ty + (uy - ty) * wide)
        self.line([tip, mid], BLACK, 2)
        self.line([mid, top], BLACK, 1)


RUFF_FRONT = [(0.80, -0.04), (1.30, 0.26), (1.80, 0.70), (1.48, 0.76), (1.76, 1.04), (1.30, 1.04), (1.36, 1.32),
              (0.88, 1.18), (0.66, 1.44), (0.30, 1.26), (0.0, 1.38)]


def _ruff_poly(pts):
    return pts + _mirror(pts[::-1])


def _shrink(pts, cx, cy, k):
    return [(cx + (x - cx) * k, cy + (y - cy) * k) for x, y in pts]


def paint_front(p: Painter, back: bool = False):
    ruff = _ruff_poly(RUFF_FRONT)
    # ears (behind the head)
    for m in (1, -1):
        e = [(0.30 * m, -0.60), (1.04 * m, -0.28), (0.88 * m, -1.62)]
        p.poly(e, BLACK)
        if back:
            p.poly(_shrink(e, 0.70 * m, -0.78, 0.34), WHITE_SH)  # pale spot on the black ear back
        else:
            p.poly(_shrink(e, 0.74 * m, -0.72, 0.78), FUR)
            p.poly(_shrink(e, 0.74 * m, -0.66, 0.52), EAR_IN)
    p.poly(ruff, WHITE)
    p.poly(_shrink(ruff, 0, 0.50, 0.84), FUR_SH)
    p.poly(_shrink(ruff, 0, 0.45, 0.70), FUR)
    p.shaded_ell(0, 0.42, 1.02, 0.62, light=False)
    p.shaded_ell(0, -0.02, 1.0, 0.90)
    if not back:
        for m in (1, -1):
            p.ell(0.42 * m, 0.15, 0.24, 0.09, WHITE)
        p.ell(0, 0.56, 0.48, 0.34, WHITE_SH)
        p.ell(0, 0.52, 0.46, 0.31, WHITE)
        p.ell(0, 0.88, 0.32, 0.24, WHITE)
        for m in (1, -1):
            p.ell(0.40 * m, -0.06, 0.27, 0.20, EYE_DK)
            p.ell(0.40 * m, -0.06, 0.20, 0.14, EYE)
            p.ell(0.38 * m, -0.06, 0.06, 0.13, EYE_DK)
        p.poly([(-0.16, 0.28), (0.16, 0.28), (0, 0.45)], NOSE)
    p.reduce()
    # line work
    for m in (1, -1):
        p.tuft((0.88 * m, -1.60), (1.00 * m, -2.20), 0.85)
        p.line([(1.00 * m, 0.56), (1.58 * m, 0.86)], BLACK, 2 if p.U >= 9 else 1)  # the ruff bar
    stripes = [[(0, -0.86), (0, -0.40)], [(0.22, -0.84), (0.15, -0.34)], [(-0.22, -0.84), (-0.15, -0.34)],
               [(0.50, -0.70), (0.38, -0.30)], [(-0.50, -0.70), (-0.38, -0.30)]]
    if back:
        stripes = [[(0, -0.86), (0, 0.50)], [(0.30, -0.80), (0.28, 0.40)], [(-0.30, -0.80), (-0.28, 0.40)],
                   [(0.62, -0.55), (0.62, 0.20)], [(-0.62, -0.55), (-0.62, 0.20)]]
    for s in stripes:
        p.line(s, STRIPE)
    if not back:
        for m in (1, -1):
            p.line([(0.66 * m, 0.16), (0.98 * m, 0.34)], STRIPE)  # cheek line
            p.lo.putpixel(tuple(int(round(v)) for v in p.P(0.36 * m, -0.10, 1)), HI)
        p.line([(0, 0.45), (0, 0.56)], BLACK)  # the lynx mouth line
        p.line([(0, 0.58), (0.26, 0.66)], BLACK)
        p.line([(0, 0.58), (-0.26, 0.66)], BLACK)
        for m in (1, -1):
            p.dot(0.20 * m, 0.48, STRIPE)
    for x, y in ((0.72, -0.42), (-0.72, -0.42), (0.84, -0.08), (-0.84, -0.08), (0.80, 0.44), (-0.80, 0.44), (0.32, -0.60), (-0.32, -0.60)):
        p.dot(x, y, STRIPE, big=p.U >= 18)


RUFF_SIDE = [(0.20, 0.10), (0.95, 0.20), (1.56, 0.62), (1.26, 0.72), (1.52, 1.00), (1.04, 0.98), (1.10, 1.30), (0.58, 1.12),
             (0.36, 1.38), (0.0, 1.14), (-0.46, 1.04), (-0.66, 0.60)]


def paint_side(p: Painter):
    """Facing left (p.flip mirrors it to face right)."""
    far = [(0.44, -0.60), (1.00, -0.40), (0.82, -1.52)]
    p.poly(far, BLACK)
    p.poly(_shrink(far, 0.75, -0.80, 0.7), FUR_SH)
    p.poly(RUFF_SIDE, WHITE)
    p.poly(_shrink(RUFF_SIDE, 0.25, 0.60, 0.84), FUR_SH)
    p.poly(_shrink(RUFF_SIDE, 0.25, 0.55, 0.70), FUR)
    p.shaded_ell(0.05, 0.44, 0.80, 0.56, light=False)
    p.shaded_ell(0.10, -0.02, 0.92, 0.88)
    p.ell(-0.60, 0.20, 0.48, 0.32, FUR)
    p.ell(-0.58, 0.46, 0.44, 0.24, WHITE)
    p.ell(-0.30, 0.76, 0.36, 0.24, WHITE)
    near = [(-0.22, -0.64), (0.44, -0.60), (0.06, -1.64)]
    p.poly(near, BLACK)
    p.poly(_shrink(near, 0.10, -0.86, 0.72), FUR)
    p.poly([(-0.12, -0.64), (0.10, -0.64), (0.02, -1.18)], EAR_IN)
    p.ell(-0.40, 0.13, 0.22, 0.08, WHITE)
    p.ell(-0.42, -0.07, 0.22, 0.18, EYE_DK)
    p.ell(-0.45, -0.07, 0.15, 0.13, EYE)
    p.ell(-0.52, -0.07, 0.05, 0.12, EYE_DK)
    p.poly([(-1.16, 0.08), (-0.98, 0.04), (-1.02, 0.26)], NOSE)
    p.reduce()
    p.tuft((0.06, -1.62), (-0.04, -2.20), 0.85)
    p.tuft((0.82, -1.50), (0.94, -2.08), 0.8)
    p.line([(0.60, 0.56), (1.34, 0.86)], BLACK, 2 if p.U >= 9 else 1)
    for s in ([(-0.06, -0.86), (-0.30, -0.36)], [(0.24, -0.86), (0.02, -0.34)], [(0.52, -0.74), (0.36, -0.30)]):
        p.line(s, STRIPE)
    p.line([(-0.16, 0.22), (0.44, 0.40)], STRIPE)
    p.line([(-1.02, 0.28), (-0.96, 0.40), (-0.62, 0.48)], BLACK)
    p.lo.putpixel(tuple(int(round(v)) for v in p.P(-0.48, -0.12, 1)), HI)
    for x, y in ((0.40, -0.44), (0.70, -0.10), (0.30, 0.10), (0.62, 0.30)):
        p.dot(x, y, STRIPE, big=p.U >= 18)


def head_layer(W: int, view: str, hx: float, hy: float, U: float) -> tuple[Image.Image, np.ndarray]:
    """RGBA head layer and its index mask (0 = not head)."""
    if view in ("left", "right"):
        p = Painter(W, hx, hy, U, flip=view == "right")
        paint_side(p)
    else:
        p = Painter(W, hx, hy, U)
        paint_front(p, back=view == "back")
    idx = np.asarray(p.lo).copy()
    # soft outline: head pixels touching transparency darken (fur to the outline brown, white to its shade)
    solid = idx > 0
    edge = solid & ~(
        np.pad(solid, 1)[:-2, 1:-1] & np.pad(solid, 1)[2:, 1:-1] & np.pad(solid, 1)[1:-1, :-2] & np.pad(solid, 1)[1:-1, 2:]
    )
    rgba = np.zeros((W, W, 4), dtype=np.uint8)
    for k, c in PAL.items():
        rgba[idx == k, :3] = c
    rgba[solid, 3] = 254
    return Image.fromarray(rgba, "RGBA"), idx, edge
