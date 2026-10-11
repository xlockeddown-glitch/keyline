#!/usr/bin/env python3
"""Painted lanterns, matches and the print shop, in the scout style.

The raw plates are Imagine outputs on a darkened magenta field. This keys that
field from the edges (the same idea as the scout sheets), punches the lantern's
cyan pane so the tier glass still shows through, fills any leftover enclosed
specks, and recolors only the brass into the print-shop metals. Deterministic.
"""
from __future__ import annotations

import colorsys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = {
    "lantern": ROOT / "artifacts/imagine_images/85506b46-109b-444f-9ac8-4aa38d7c0439.jpg",
    "match": ROOT / "artifacts/imagine_images/82a8bd8c-32b2-4ebd-baab-dcc6085d08b2.jpg",
    "shop": ROOT / "artifacts/imagine_images/c2e39992-3872-4257-a633-3d2387998bdc.jpg",
}
OUT_L = ROOT / "public/sprites/lanterns"
OUT_M = ROOT / "public/sprites/matches"
OUT_S = ROOT / "public/sprites/print-shop.png"

# Print-shop metals. Hue is the target; sat_mul pulls the brass chroma toward it; val_mul keeps the folds.
SKINS = {
    "brass": None,
    "copper": (0.04, 1.05, 0.92),
    "iron": (0.62, 0.12, 0.72),
    "verdigris": (0.43, 0.72, 0.86),
    "nickel": (0.58, 0.06, 1.05),
}
HEADS = {
    "white": (0.58, 0.08),
    "blue": (0.58, 0.82),
    "green": (0.40, 0.78),
    "amber": (0.10, 0.92),
    "red": (0.01, 0.88),
    "violet": (0.76, 0.62),
}


def is_bg(r: int, g: int, b: int) -> bool:
    return g < 100 and r > 80 and b > 40 and r > g + 30 and b > g + 15 and r < 245


def key(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    seen: set[tuple[int, int]] = set()
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or (x, y) in seen:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a == 0 or is_bg(r, g, b):
            px[x, y] = (0, 0, 0, 0)
            q.append((x + 1, y))
            q.append((x - 1, y))
            q.append((x, y + 1))
            q.append((x, y - 1))
    return im.crop(im.getbbox())


def is_cyan(r: int, g: int, b: int, a: int) -> bool:
    return a >= 200 and b > 120 and g > 100 and r < 190 and (b + g) > r * 2.1


def punch_glass(im: Image.Image) -> tuple[float, float, float, float]:
    """Clear the cyan pane, including its pale highlights, and return its box as fractions."""
    px = im.load()
    w, h = im.size
    q: deque[tuple[int, int]] = deque()
    seen = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_cyan(r, g, b, a):
                seen[y][x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            nx, ny = x + dx, y + dy
            if nx < 0 or ny < 0 or nx >= w or ny >= h or seen[ny][nx]:
                continue
            r, g, b, a = px[nx, ny]
            if a < 200:
                continue
            if max(r, g, b) > 150 and (b > r - 10 or g > r) and r > 80:
                seen[ny][nx] = True
                q.append((nx, ny))
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            if seen[y][x]:
                px[x, y] = (0, 0, 0, 0)
                xs.append(x)
                ys.append(y)
    return (min(xs) / w, min(ys) / h, (max(xs) + 1) / w, (max(ys) + 1) / h)


def fill_specks(im: Image.Image, glass: tuple[float, float, float, float] | None, limit: int) -> int:
    """Fill enclosed transparent specks. The lantern pane is the one big hole and stays open."""
    px = im.load()
    w, h = im.size
    seen = [[False] * w for _ in range(h)]
    filled = 0
    gx0, gy0, gx1, gy1 = glass or (0, 0, 0, 0)
    for y in range(h):
        for x in range(w):
            if seen[y][x] or px[x, y][3] != 0:
                continue
            q: deque[tuple[int, int]] = deque([(x, y)])
            seen[y][x] = True
            cells: list[tuple[int, int]] = []
            touch = False
            while q:
                cx, cy = q.popleft()
                cells.append((cx, cy))
                if cx == 0 or cy == 0 or cx == w - 1 or cy == h - 1:
                    touch = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or seen[ny][nx]:
                        continue
                    if px[nx, ny][3] == 0:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            if touch or len(cells) > limit:
                continue
            # Skip anything sitting inside the punched pane.
            if glass and any(gx0 * w <= cx <= gx1 * w and gy0 * h <= cy <= gy1 * h for cx, cy in cells[:8]):
                continue
            for cx, cy in cells:
                acc = [0, 0, 0, 0]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] > 200:
                        acc[0] += px[nx, ny][0]
                        acc[1] += px[nx, ny][1]
                        acc[2] += px[nx, ny][2]
                        acc[3] += 1
                if acc[3]:
                    px[cx, cy] = (acc[0] // acc[3], acc[1] // acc[3], acc[2] // acc[3], 255)
                    filled += 1
    return filled


def is_brass(r: int, g: int, b: int, a: int) -> bool:
    if a < 220:
        return False
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return v > 0.28 and s > 0.18 and 0.02 < h < 0.16


def recolor(im: Image.Image, hue: float, sat_mul: float, val_mul: float) -> Image.Image:
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not is_brass(r, g, b, a):
                continue
            _h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            rr, gg, bb = colorsys.hsv_to_rgb(hue, min(1, s * sat_mul), min(1, v * val_mul))
            px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return out


def recolor_head(im: Image.Image, hue: float, sat: float) -> Image.Image:
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(int(h * 0.62)):
        for x in range(w):
            r, g, b, a = px[x, y]
            # The bulb's shadow is a darker red (r can sit under 140). The wood below is not.
            if a < 200 or not (r > 100 and g < 80 and r > g + 20 and r > b):
                continue
            _h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            rr, gg, bb = colorsys.hsv_to_rgb(hue, sat, v)
            px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return out


def fit(im: Image.Image, height: int) -> Image.Image:
    w = max(1, round(im.width * height / im.height))
    return im.resize((w, height), Image.Resampling.LANCZOS)


def main() -> None:
    OUT_L.mkdir(parents=True, exist_ok=True)
    OUT_M.mkdir(parents=True, exist_ok=True)
    lantern = key(RAW["lantern"])
    glass = punch_glass(lantern)
    print("glass", tuple(round(v, 4) for v in glass), "specks", fill_specks(lantern, glass, 8000))
    lantern = fit(lantern, 320)
    for name, spec in SKINS.items():
        img = lantern if spec is None else recolor(lantern, *spec)
        img.save(OUT_L / f"{name}.png", optimize=True)
    match = key(RAW["match"])
    print("match specks", fill_specks(match, None, 4000))
    match = fit(match, 256)
    for name, (hue, sat) in HEADS.items():
        recolor_head(match, hue, sat).save(OUT_M / f"{name}.png", optimize=True)
    shop = key(RAW["shop"])
    print("shop specks", fill_specks(shop, None, 8000))
    fit(shop, 420).save(OUT_S, optimize=True)
    print("wrote", OUT_L, OUT_M, OUT_S)


if __name__ == "__main__":
    main()
