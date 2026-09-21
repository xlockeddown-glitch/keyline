#!/usr/bin/env python3
"""One-shot repair: fill 1px dropout specks and mint a distinct lynx from the fox sheets."""
from __future__ import annotations

import colorsys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public" / "sprites"
SCOUTS = SPR / "scouts"

SHEETS = [
    SCOUTS / "cat-idle.png",
    SCOUTS / "cat-walk.png",
    SCOUTS / "corgi-idle.png",
    SCOUTS / "corgi-walk.png",
    SCOUTS / "fox-idle.png",
    SCOUTS / "fox-walk.png",
    SCOUTS / "owl-idle.png",
    SCOUTS / "owl-walk.png",
    SCOUTS / "sloth-idle.png",
    SCOUTS / "sloth-walk.png",
    SCOUTS / "turtle-idle.png",
    SCOUTS / "turtle-walk.png",
    SPR / "player-idle.png",
    SPR / "player-walk.png",
]


def specks(im: Image.Image) -> list[tuple[int, int]]:
    w, h = im.size
    px = im.load()
    hits: list[tuple[int, int]] = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if px[x, y][3] >= 16:
                continue
            ok = True
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    if px[x + dx, y + dy][3] < 200:
                        ok = False
                        break
                if not ok:
                    break
            if ok:
                hits.append((x, y))
    return hits


def fill_specks(im: Image.Image) -> int:
    px = im.load()
    n = 0
    for _ in range(4):
        holes = specks(im)
        if not holes:
            break
        for x, y in holes:
            rs = gs = bs = a = c = 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    r, g, b, aa = px[x + dx, y + dy]
                    if aa < 200:
                        continue
                    rs += r
                    gs += g
                    bs += b
                    a += aa
                    c += 1
            if not c:
                continue
            px[x, y] = (rs // c, gs // c, bs // c, min(255, a // c))
            n += 1
    return n


def is_lantern(r: int, g: int, b: int) -> bool:
    return r > 140 and g > 85 and b < 110 and r >= g - 10 and (r - b) > 50


def to_lynx(im: Image.Image) -> Image.Image:
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            mx = max(r, g, b)
            if mx < 42:
                continue
            if is_lantern(r, g, b):
                continue
            hsv = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            hue, sat, val = hsv
            # Fox coat is warm orange/brown; keep lanterns, cool the fur.
            if sat < 0.08 and val > 0.55:
                continue
            hue = 0.58
            sat = min(0.22, sat * 0.32)
            val = min(1.0, val * 1.04 + 0.02)
            nr, ng, nb = colorsys.hsv_to_rgb(hue, sat, val)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return out


def save(im: Image.Image, path: Path) -> None:
    im.save(path, format="PNG", optimize=True)


def main() -> None:
    filled = {}
    for path in SHEETS:
        im = Image.open(path).convert("RGBA")
        n = fill_specks(im)
        save(im, path)
        filled[path.name] = n
        print(f"fill {path.name}: {n}")

    for src_name, dest_name in (
        ("fox-idle.png", "lynx-idle.png"),
        ("fox-walk.png", "lynx-walk.png"),
        ("fox.png", "lynx.png"),
    ):
        src = SCOUTS / src_name
        dest = SCOUTS / dest_name
        im = Image.open(src).convert("RGBA")
        fill_specks(im)
        lynx = to_lynx(im)
        fill_specks(lynx)
        save(lynx, dest)
        print(f"lynx {dest_name} from {src_name} bytes={dest.stat().st_size}")

    print("filled", filled)


if __name__ == "__main__":
    main()
