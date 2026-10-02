#!/usr/bin/env python3
"""0.0.38: the Turtle walks in the same brown hooded coat it idles in.

Before this the walk sheet showed a bare shell with green arms and belly, while the idle sheet and the
shop icon wore a hooded field coat over the shell. The coat wins: every other scout wears a coat, and
two of the three turtle sheets (plus the icon the shop sells) already had it.

Per walk frame (the source is the 0.0.37 shell sheet, read from git so the script can be rerun):
  * coat: from the neck to the knees, everything except the lantern, the hands and the outline is
    repainted from the idle coat's own palette, matched by brightness rank, with the scute pattern
    softened so it reads as a coat over a shell rather than the shell itself;
  * front opening: the pale belly in the middle of the front view becomes the idle coat's tan lining;
  * hood: the base and back of the head are wrapped in coat colour, like the idle hood;
  * legs, boots, face and lantern stay as drawn, so pose timing and the floor line do not move.
Run scripts/make-side-idle.py afterwards to rebuild turtle-idle-side.png from the new walk sheet."""
from __future__ import annotations

import importlib.util
import io
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SCOUTS = ROOT / "public" / "sprites" / "scouts"
SOURCE_REV = "a16345c"
CELL = 96

_spec = importlib.util.spec_from_file_location("coat", ROOT / "scripts" / "fix-cat-coat.py")
_m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_m)
to_lab, from_lab, hue = _m.to_lab, _m.from_lab, _m.hue
_spec2 = importlib.util.spec_from_file_location("lynx", ROOT / "scripts" / "make-lynx.py")
_l = importlib.util.module_from_spec(_spec2)
_spec2.loader.exec_module(_l)
lantern_box, solid_bbox, in_box = _l.lantern_box, _l.solid_bbox, _l.in_box


def kind(r: int, g: int, b: int) -> str:
    L, A, B = to_lab(r, g, b)
    C = math.hypot(A, B)
    if L < 22:
        return "line"
    if C > 12 and hue(A, B) >= 80:
        return "green"
    return "brown"


def idle_palettes():
    """Coat and lining colours from the front idle frame, each sorted dark to light."""
    idle = Image.open(SCOUTS / "turtle-idle.png").convert("RGBA").crop((0, 0, 128, 128))
    px = idle.load()
    x0, y0, x1, y1 = solid_bbox(idle)
    h = y1 - y0
    coat, lining = [], []
    for y in range(y0 + int(h * 0.30), y0 + int(h * 0.72)):
        for x in range(idle.width):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            L, A, B = to_lab(r, g, b)
            if math.hypot(A, B) < 8 or hue(A, B) >= 80 or L > 74:
                continue
            if L > 56 and math.hypot(A, B) > 22:
                if 55 <= hue(A, B) <= 80:  # tan lining, not the lantern's pink-orange spill
                    lining.append((L, (r, g, b)))
            else:
                coat.append((L, (r, g, b)))
    coat.sort()
    lining.sort()
    return [c for _, c in coat], [c for _, c in lining]


def components(points: set[tuple[int, int]]):
    seen, out = set(), []
    for p in points:
        if p in seen:
            continue
        stack, comp = [p], []
        seen.add(p)
        while stack:
            x, y = stack.pop()
            comp.append((x, y))
            for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if q in points and q not in seen:
                    seen.add(q)
                    stack.append(q)
        out.append(comp)
    return out


def coat_frame(f: Image.Image, view: str, coat, lining) -> Image.Image:
    out = f.copy()
    px, op = f.load(), out.load()
    x0, y0, x1, y1 = solid_bbox(f)
    h = y1 - y0
    neck = y0 + int(h * (0.30 if view != "back" else 0.26))
    hem = y0 + int(h * 0.74)
    lant = lantern_box(f, 6)
    solid = lambda x, y: 0 <= x < CELL and 0 <= y < CELL and px[x, y][3] >= 128

    region = [(x, y) for y in range(neck, hem) for x in range(CELL) if solid(x, y) and not (lant and in_box(x, y, lant))]
    # Hands: small green blobs low in the coat band, or touching the lantern.
    greens = {(x, y) for x, y in region if kind(*px[x, y][:3]) == "green"}
    keep = set()
    lant_near = (lant[0] - 3, lant[1] - 5, lant[2] + 3, lant[3]) if lant else None
    cx = (x0 + x1) / 2
    for comp in components(greens):
        ys = [p[1] for p in comp]
        xs = [p[0] for p in comp]
        mid_x = sum(xs) / len(xs)
        low = sum(ys) / len(ys) > neck + (hem - neck) * 0.45
        if lant_near and any(in_box(x, y, lant_near) for x, y in comp) and len(comp) <= 40:
            keep.update(comp)
        elif len(comp) <= 28 and low and abs(mid_x - cx) > (x1 - x0) * 0.22:
            keep.update(comp)

    # Soft brightness: the shell's scute lines fade into broad coat folds.
    Lmap = Image.new("L", (CELL, CELL), 0)
    lp = Lmap.load()
    for y in range(CELL):
        for x in range(CELL):
            if solid(x, y):
                lp[x, y] = max(0, min(255, int(to_lab(*px[x, y][:3])[0] * 2.55)))
    soft = Lmap.filter(ImageFilter.GaussianBlur(1.6)).load()
    paint = [(x, y) for x, y in region if (x, y) not in keep]
    lining_px, lapel = set(), set()
    if view == "front":
        # The opening runs down the middle of the torso (centre taken without the lantern).
        txs = [x for x, y in region]
        tc = (min(txs) + max(txs)) / 2 if txs else cx
        tc = (tc + cx) / 2
        for x, y in paint:
            if y <= neck + 2 or y >= hem - 1:
                continue
            d = abs(x - tc)
            t = (y - neck) / max(1, hem - neck)
            w = 1.0 + 2.6 * t  # the coat hangs open wider towards the hem
            if d <= w:
                lining_px.add((x, y))
            elif d <= w + 1.2:
                lapel.add((x, y))
    body = [(x, y) for x, y in paint if (x, y) not in lining_px]

    def edge(x, y):
        return any(not solid(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))

    def rank_paint(pts, pal, lo=0.0, hi=1.0):
        if not pts or not pal:
            return
        vals = sorted(pts, key=lambda p: 0.65 * soft[p[0], p[1]] + 0.35 * lp[p[0], p[1]])
        n = len(vals)
        for i, (x, y) in enumerate(vals):
            q = lo + (hi - lo) * (i / max(1, n - 1))
            c = pal[min(len(pal) - 1, int(q * (len(pal) - 1)))]
            op[x, y] = (*c, px[x, y][3])

    rank_paint(body, coat)
    for x, y in sorted(lining_px):
        t = (y - neck) / max(1, hem - neck)
        shade = soft[x, y] / 255 - 0.5  # keep the body's own light and shadow
        q = max(0.0, min(1.0, 0.72 - 0.35 * t + 1.4 * shade))
        c = lining[int(q * (len(lining) - 1))]
        op[x, y] = (*c, px[x, y][3])
    darkest = coat[len(coat) // 14]
    for x, y in body:
        if edge(x, y) or (x, y) in lapel:
            op[x, y] = (*darkest, px[x, y][3])

    # Hood: wrap the base (and for side/back views, the back) of the head.
    hood = []
    head_top = y0
    for y in range(head_top, neck):
        xs = [x for x in range(CELL) if solid(x, y) and not (lant and in_box(x, y, lant))]
        if not xs:
            continue
        l, r = min(xs), max(xs)
        depth = (y - head_top) / max(1, neck - head_top)
        if view == "back":
            if depth > 0.45:
                hood += [(x, y) for x in xs]
        elif view == "front":
            if depth > 0.72:
                hood += [(x, y) for x in xs if x - l < 3 or r - x < 3]
        else:
            back_left = view == "right"  # facing right: the back of the head is on the left
            w = 2 + int(5 * max(0.0, depth - 0.35) / 0.65)
            if depth > 0.35:
                hood += [(x, y) for x in xs if (x - l < w if back_left else r - x < w)]
    rank_paint(hood, coat, 0.25, 0.85)
    for x, y in hood:
        if edge(x, y):
            op[x, y] = (*darkest, px[x, y][3])
    return out


def main() -> None:
    raw = subprocess.run(["git", "show", f"{SOURCE_REV}:public/sprites/scouts/turtle-walk.png"], cwd=ROOT,
                         check=True, capture_output=True).stdout
    walk = Image.open(io.BytesIO(raw)).convert("RGBA")
    coat, lining = idle_palettes()
    sheet = Image.new("RGBA", walk.size, (0, 0, 0, 0))
    views = ["front", "left", "right", "back"]
    for r in range(4):
        for c in range(4):
            f = walk.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))
            sheet.alpha_composite(coat_frame(f, views[r], coat, lining), (c * CELL, r * CELL))
    sheet.save(SCOUTS / "turtle-walk.png", optimize=True)
    print(f"turtle-walk.png: coat {len(coat)} tones, lining {len(lining)} tones")


if __name__ == "__main__":
    main()
