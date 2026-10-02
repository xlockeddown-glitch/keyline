#!/usr/bin/env python3
"""0.0.37: the Lynx gets its own body instead of a recoloured fox.

Built from the fox sheets so it keeps the house style, pose timing and floor line, then reshaped:
  * ear tufts: a dark tuft rises from each ear tip;
  * bobbed tail: the brush is cut to a short stub with a black tip (back view: legs show under it);
  * facial ruff: pale cheek fur flares out at the jaw, with a dark bar through it;
  * stockier: the body below the neck is widened about 14%;
  * spotted tawny fur: fox orange becomes a sandy tawny with dark spots that stay put frame to frame.
Writes lynx-idle.png, lynx-walk.png and the lynx.png icon; run scripts/make-side-idle.py after it for lynx-idle-side.png."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCOUTS = ROOT / "public" / "sprites" / "scouts"

import importlib.util

_spec = importlib.util.spec_from_file_location("labfns", ROOT / "scripts" / "fix-cat-coat.py")
_lab = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lab)  # type: ignore[union-attr]
to_lab, from_lab, hue = _lab.to_lab, _lab.from_lab, _lab.hue

TUFT = (28, 20, 16, 255)
TUFT_HI = (70, 54, 40, 255)
TIP = (24, 18, 14, 255)
SPOT = (92, 62, 36, 255)
SPOT_HEAD = (128, 92, 58, 255)
RUFF = (226, 212, 184, 255)
RUFF_SH = (196, 178, 150, 255)
RUFF_BAR = (60, 44, 32, 255)


def is_fur(r: int, g: int, b: int, a: int) -> str | None:
    """'orange' fox fur, 'cream' pale fur, else None."""
    if a < 128:
        return None
    L, A, B = to_lab(r, g, b)
    C = math.hypot(A, B)
    h = hue(A, B)
    if C > 20 and 28 <= h <= 70 and 22 <= L <= 72:
        return "orange"
    if L > 64 and C < 26 and 40 <= h <= 110:
        return "cream"
    return None


def solid_bbox(f: Image.Image):
    return f.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()


def lantern_box(f: Image.Image, pad: int):
    """Box around the lantern glow (very bright warm pixels), padded to cover the brass."""
    px = f.load()
    _, top, _, bottom = solid_bbox(f)
    xs, ys = [], []
    for y in range(top + int((bottom - top) * 0.45), f.height):
        for x in range(f.width):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            L, A, B = to_lab(r, g, b)
            if L > 74 and math.hypot(A, B) > 45 and 70 <= hue(A, B) <= 105:
                xs.append(x)
                ys.append(y)
    if len(xs) < 3:
        return None
    # The glow is one tight cluster; keep the points near its median.
    mx, my = sorted(xs)[len(xs) // 2], sorted(ys)[len(ys) // 2]
    pts = [(x, y) for x, y in zip(xs, ys) if abs(x - mx) <= 8 and abs(y - my) <= 10]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    sc = pad / 6
    return (min(xs) - round(7 * sc), min(ys) - round(12 * sc), max(xs) + round(7 * sc), max(ys) + round(9 * sc))


def in_box(x: int, y: int, box) -> bool:
    return bool(box) and box[0] <= x <= box[2] and box[1] <= y <= box[3]


# View geometry, as fractions of the cell (registered sheets keep these within a pixel or two).
# tail: region the brush lives in; keep: how much of it stays as the bob (stub side), cut direction.
VIEWS = {
    # name: (tail box x0,y0,x1,y1 in cell fractions, stub keep (fraction of cell) measured from the body side, side)
    "front": ((0.60, 0.58, 0.99, 0.86), 0.06, "right"),
    "left": ((0.64, 0.52, 0.99, 0.88), 0.07, "right"),
    "right": ((0.01, 0.52, 0.36, 0.88), 0.07, "left"),
    "back": ((0.33, 0.58, 0.62, 0.92), 0.0, "down"),
}


def shade(c, k: float):
    r, g, b, a = c
    return (max(0, min(255, round(r * k))), max(0, min(255, round(g * k))), max(0, min(255, round(b * k))), 255)


def draw_stub(px, W: int, cx: float, cy: float, rw: float, rh: float, fur, tip_dir: tuple[float, float]) -> None:
    """A short bobbed tail: a small furry oval in the tail's own colour, dark outline, black tip away from the body."""
    tx, ty = tip_dir
    for y in range(int(cy - rh - 1), int(cy + rh + 2)):
        for x in range(int(cx - rw - 1), int(cx + rw + 2)):
            if not (1 <= x < W - 1 and 1 <= y < W - 1):
                continue
            u, v = (x - cx) / rw, (y - cy) / rh
            d = u * u + v * v
            if d > 1.0:
                continue
            along = u * tx + v * ty  # -1 body side … +1 tip side
            if along > 0.38:
                col = TIP
            elif d > 0.72:
                col = shade(fur, 0.62)
            else:
                col = shade(fur, 1.12 - 0.25 * (v + 1) / 2)
            px[x, y] = col


def bob_tail(f: Image.Image, view: str, legs: Image.Image | None, lamp) -> None:
    W = f.width
    sc = W / 96
    px = f.load()
    (fx0, fy0, fx1, fy1), keep, side = VIEWS[view]
    x0, y0, x1, y1 = int(fx0 * W), int(fy0 * W), int(fx1 * W), int(fy1 * W)
    pts = [(x, y) for y in range(y0, y1) for x in range(x0, x1) if is_fur(*px[x, y]) and not in_box(x, y, lamp)]
    if not pts:
        return
    oranges = sorted((px[x, y] for x, y in pts if is_fur(*px[x, y]) == "orange"), key=lambda c: sum(c[:3]))
    fur = oranges[len(oranges) // 2] if oranges else (190, 90, 40, 255)
    if side == "down":
        top = min(y for _, y in pts)
        cols = [x for x, y in pts if y <= top + 4]
        cx = (min(cols) + max(cols)) / 2
        cut = top + round(4 * sc)
        lp = legs.load() if legs else None
        hem = int(0.70 * W)
        llamp = lantern_box(legs, 6 * sc) if legs else None
        for x in range(x0, x1):
            for y in range(cut, y1):
                r, g, b, a = px[x, y]
                coat = a >= 128 and to_lab(r, g, b)[0] < 30 and math.hypot(*to_lab(r, g, b)[1:]) < 12
                if not coat:
                    ok = lp is not None and y >= hem and lp[x, y][3] > 0 and not in_box(x, y, llamp)
                    px[x, y] = lp[x, y] if ok else (0, 0, 0, 0)
        draw_stub(px, W, cx, top + 3.0 * sc, 3.6 * sc, 3.4 * sc, fur, (0.0, 1.0))
        return
    xs = [x for x, _ in pts]
    if side == "right":
        base = min(xs)
        near = [y for x, y in pts if x <= base + 3]
        for y in range(y0, y1):
            for x in range(base + 1, x1):
                if not in_box(x, y, lamp):
                    px[x, y] = (0, 0, 0, 0)
        cy = sum(near) / len(near)
        draw_stub(px, W, base + 2.6 * sc, cy - 2.0 * sc, 3.2 * sc, 3.8 * sc, fur, (0.55, -0.83))
    else:
        base = max(xs)
        near = [y for x, y in pts if x >= base - 3]
        for y in range(y0, y1):
            for x in range(x0, base):
                if not in_box(x, y, lamp):
                    px[x, y] = (0, 0, 0, 0)
        cy = sum(near) / len(near)
        draw_stub(px, W, base - 2.6 * sc, cy - 2.0 * sc, 3.2 * sc, 3.8 * sc, fur, (-0.55, -0.83))


def head_band(f: Image.Image, view: str):
    """Top of the head and the neck line (where the coat starts)."""
    x0, top, x1, bottom = solid_bbox(f)
    frac = {"front": 0.40, "left": 0.40, "right": 0.40, "back": 0.30}[view]
    return top, top + int((bottom - top) * frac)


def widen_body(f: Image.Image, neck: int, lamp, factor: float) -> Image.Image:
    """Stretch everything below the neck sideways about the body's centre (lantern kept as is, just moved with its hand)."""
    W = f.width
    x0, _, x1, _ = solid_bbox(f.crop((0, neck, W, W)))
    cx = (x0 + x1) / 2
    out = f.copy()
    src = f.load()
    dst = out.load()
    for y in range(neck, W):
        # ease in over 6 rows so the shoulders don't step
        k = 1 + (factor - 1) * min(1.0, (y - neck) / 6)
        row = [(0, 0, 0, 0)] * W
        for x in range(W):
            sx = cx + (x - cx) / k
            ix = int(round(sx))
            if 0 <= ix < W:
                row[x] = src[ix, y]
        for x in range(W):
            dst[x, y] = row[x]
    if lamp:
        # Put the lantern back un-stretched, shifted to where its centre went.
        lx0, ly0, lx1, ly1 = (max(0, lamp[0]), max(0, lamp[1]), min(W, lamp[2] + 1), min(W, lamp[3] + 1))
        if ly0 >= neck:
            mid = (lx0 + lx1) / 2
            shift = int(round((mid - cx) * (factor - 1)))
            for y in range(ly0, ly1):
                for x in range(lx0 - abs(shift) - 2, lx1 + abs(shift) + 2):
                    if 0 <= x < W and in_box(x, y, (lx0 + shift, ly0, lx1 - 1 + shift, ly1 - 1)):
                        dst[x, y] = (0, 0, 0, 0)
            for y in range(ly0, ly1):
                for x in range(lx0, lx1):
                    p = src[x, y]
                    nx = x + shift
                    if p[3] > 0 and 0 <= nx < W:
                        dst[nx, y] = p
    return out


def ear_tips(f: Image.Image, top: int, neck: int, view: str):
    """Topmost solid pixel on each side of the head: the ear tips."""
    px = f.load()
    W = f.width
    cols = []
    for x in range(W):
        for y in range(top, neck):
            if px[x, y][3] >= 128:
                cols.append((x, y))
                break
    if not cols:
        return []
    xs = [x for x, _ in cols]
    mid = (min(xs) + max(xs)) / 2
    left = min((c for c in cols if c[0] < mid), key=lambda c: c[1], default=None)
    right = min((c for c in cols if c[0] >= mid), key=lambda c: c[1], default=None)
    tips = [t for t in (left, right) if t]
    if len(tips) == 2 and abs(tips[0][1] - tips[1][1]) > 6:
        tips = [min(tips, key=lambda c: c[1])]
    return tips


def add_tufts(f: Image.Image, tips, scale: float) -> None:
    px = f.load()
    n = max(4, round(5 * scale))
    for x, y in tips:
        cx = f.width / 2
        lean = 1 if x > cx else -1
        for i in range(1, n + 1):
            yy = y - i
            xx = x + (lean if i > n * 0.6 else 0)
            if yy < 2:
                break
            px[xx, yy] = TUFT
            if i <= n // 2:
                px[xx - lean, yy] = TUFT_HI if i > 1 else TUFT
        px[x, y] = TUFT


def add_ruff(f: Image.Image, top: int, neck: int, view: str, scale: float) -> None:
    """Pale cheek fur flaring past the head's outline at the jaw, a dark bar through the middle."""
    px = f.load()
    W = f.width
    h = neck - top
    y0, y1 = top + int(h * 0.62), top + int(h * 0.98)
    sides = {"front": ("l", "r"), "back": ("l", "r"), "left": ("r",), "right": ("l",)}[view]
    reach = max(3, round(3.5 * scale))
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        out = int(round(reach * math.sin(math.pi * min(1.0, t * 1.15)) + 0.4))
        if out <= 0:
            continue
        solid = [x for x in range(W) if px[x, y][3] >= 128]
        if not solid:
            continue
        for s in sides:
            edge = min(solid) if s == "l" else max(solid)
            d = -1 if s == "l" else 1
            # only flare from fur, not from a sleeve or the lantern
            if not is_fur(*px[edge, y]) and not is_fur(*px[edge - d, y]):
                continue
            for i in range(1, out + 1):
                x = edge + d * i
                if 1 <= x < W - 1:
                    jag = (y + i) % 3 == 0 and i == out
                    px[x, y] = RUFF_SH if (i == out or jag) else RUFF
            mid = y0 + int((y1 - y0) * 0.5)
            if y == mid:
                for i in range(0, out):
                    x = edge + d * i
                    if 1 <= x < W - 1:
                        px[x, y] = RUFF_BAR


def tawny(px, x: int, y: int) -> None:
    r, g, b, a = px[x, y]
    kind = is_fur(r, g, b, a)
    if kind == "orange":
        L, A, B = to_lab(r, g, b)
        C = math.hypot(A, B)
        h2 = math.radians(72)
        C2 = C * 0.55
        L2 = min(82, L * 1.08 + 8)
        px[x, y] = (*from_lab(L2, C2 * math.cos(h2), C2 * math.sin(h2)), a)
    elif kind == "cream":
        L, A, B = to_lab(r, g, b)
        px[x, y] = (*from_lab(L, A * 0.6, B * 0.8 + 3), a)


def spots(f: Image.Image, top: int, neck: int, lamp, scale: float, seed: int) -> None:
    """Dark spots on the tawny fur, on a jittered grid pinned to the head, so they hold still frame to frame."""
    px = f.load()
    W = f.width
    x0, _, x1, _ = solid_bbox(f)
    cx = (x0 + x1) // 2
    step = max(5, round(5 * scale))
    face = (cx - int((x1 - x0) * 0.22), top + int((neck - top) * 0.45), cx + int((x1 - x0) * 0.22), neck)
    for gy in range(-2, W // step + 2):
        for gx in range(-W // step, W // step + 1):
            hsh = (gx * 73856093) ^ (gy * 19349663) ^ seed
            jx = (hsh >> 3) % step
            jy = (hsh >> 7) % step
            if (hsh >> 11) % 3 == 0:
                continue
            x = cx + gx * step + jx - step // 2
            y = top + gy * step + jy
            if not (1 <= x < W - 2 and 1 <= y < W - 2) or in_box(x, y, face) or in_box(x, y, lamp):
                continue
            on_head = y < neck
            if on_head and (hsh >> 17) % 3:
                continue
            big = (hsh >> 13) % 2 == 0 and scale > 1.1 and not on_head
            cells_ = [(x, y)] if on_head else [(x, y), (x + 1, y)] + ([(x, y + 1), (x + 1, y + 1)] if big else [])
            if all(is_tawny(px[c[0], c[1]]) for c in cells_):
                for c in cells_:
                    px[c[0], c[1]] = SPOT_HEAD if on_head else SPOT


def is_tawny(p) -> bool:
    r, g, b, a = p
    if a < 200:
        return False
    L, A, B = to_lab(r, g, b)
    h = hue(A, B)
    return 55 <= h <= 90 and 10 <= math.hypot(A, B) <= 40 and 40 <= L <= 86


def make_frame(f: Image.Image, view: str, legs: Image.Image | None, scale: float, seed: int) -> Image.Image:
    f = f.copy()
    lamp = lantern_box(f, 6 * scale)
    bob_tail(f, view, legs, lamp)
    top, neck = head_band(f, view)
    f = widen_body(f, neck, lamp, 1.14)
    lamp = lantern_box(f, 6 * scale)
    add_ruff(f, top, neck, view, scale)
    add_tufts(f, ear_tips(f, top, neck, view), scale)
    px = f.load()
    for y in range(f.height):
        for x in range(f.width):
            if not in_box(x, y, lamp):
                tawny(px, x, y)
    spots(f, top, neck, lamp, scale, seed)
    # Keep a clear margin: nothing may touch the cell edge.
    for i in range(f.width):
        for x, y in ((i, 0), (i, f.height - 1), (0, i), (f.width - 1, i)):
            px[x, y] = (0, 0, 0, 0)
    return f


def main() -> None:
    fox_walk = Image.open(SCOUTS / "fox-walk.png").convert("RGBA")
    fox_idle = Image.open(SCOUTS / "fox-idle.png").convert("RGBA")
    walk = Image.new("RGBA", fox_walk.size, (0, 0, 0, 0))
    C = 96
    views = ["front", "left", "right", "back"]
    for r, view in enumerate(views):
        for c in range(4):
            cell = fox_walk.crop((c * C, r * C, (c + 1) * C, (r + 1) * C))
            legs = fox_walk.crop((c * C, 0, (c + 1) * C, C)) if view == "back" else None
            if legs is not None:
                legs = make_legs(legs)
            walk.alpha_composite(make_frame(cell, view, legs, 1.0, 0x5EED + r), (c * C, r * C))
    walk.save(SCOUTS / "lynx-walk.png", optimize=True)
    idle = Image.new("RGBA", fox_idle.size, (0, 0, 0, 0))
    I = 128
    for r in range(2):
        for c in range(2):
            cell = fox_idle.crop((c * I, r * I, (c + 1) * I, (r + 1) * I))
            idle.alpha_composite(make_frame(cell, "front", None, I / C, 0x5EED + 9), (c * I, r * I))
    idle.save(SCOUTS / "lynx-idle.png", optimize=True)
    # Shop/ledger icon: the first idle frame at 96, like the other scouts' icons.
    idle.crop((0, 0, I, I)).resize((C, C), Image.BOX).save(SCOUTS / "lynx.png", optimize=True)
    print("lynx-walk.png, lynx-idle.png, lynx.png written")


def make_legs(front: Image.Image) -> Image.Image:
    """Back-view legs: the front view's legs, which read the same from behind once the tail is short."""
    return front


if __name__ == "__main__":
    main()
