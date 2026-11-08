#!/usr/bin/env python3
"""Counter and print-shop props.

Painted on a chunky grid in the night-brass palette from src/styles.css, then
nearest-neighbour scaled. The print shop is a tall press (oxblood awning, PRESS
plate, lantern and platen). The street counter is a low stall under a deep
green enamel sign. The sign carries the real white, blue and amber vault keys
(public/sprites/keys), bow and teeth included, not matchsticks.

Docs: docs/ART_DIRECTION.md.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_SHOP = ROOT / "public/sprites/print-shop.png"
OUT_COUNTER = ROOT / "public/sprites/street-counter-v2.png"

# Tokens from src/styles.css @theme and the service-sign colours in the same file.
INK = (14, 16, 20)
WOOD = (42, 34, 24)
WOOD_MID = (74, 56, 38)
WOOD_HI = (112, 84, 56)
WOOD_LO = (26, 20, 16)
BRASS = (201, 163, 94)  # --color-vault-amber / --skin brass
BRASS_HI = (224, 199, 136)
BRASS_LO = (138, 106, 56)
BRASS_DK = (110, 83, 32)
CREAM = (236, 228, 214)
ENAMEL = (28, 46, 36)  # .counter-pin .service-sign
OXBLOOD = (75, 28, 34)  # .board-pin enamel
OX_HI = (122, 52, 58)
IRON = (44, 48, 56)
IRON_HI = (90, 98, 110)
GLASS = (255, 214, 140)
GLASS_HOT = (255, 236, 196)
WHITE = (214, 209, 199)
BLUE = (110, 143, 168)
GREEN = (111, 143, 114)
AMBER = (201, 163, 94)
RED = (184, 90, 76)
VIOLET = (125, 118, 144)

# 3×5 ink glyphs. '#' is ink, '.' is empty.
FONT = {
    "P": ["###", "#.#", "###", "#..", "#.."],
    "R": ["###", "#.#", "###", "#.#", "#.#"],
    "E": ["###", "#..", "##.", "#..", "###"],
    "S": ["###", "#..", "###", "..#", "###"],
}


def new(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def put(im: Image.Image, x: int, y: int, rgb: tuple[int, int, int], a: int = 255) -> None:
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), (*rgb, a))


def rect(im: Image.Image, x: int, y: int, w: int, h: int, rgb: tuple[int, int, int], a: int = 255) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(im, xx, yy, rgb, a)


def shade_rect(im: Image.Image, x: int, y: int, w: int, h: int, lo: tuple[int, int, int], hi: tuple[int, int, int]) -> None:
    """Upper-left light, the same key the brass UI uses."""
    for yy in range(h):
        for xx in range(w):
            t = (xx / max(1, w - 1)) * 0.55 + (1 - yy / max(1, h - 1)) * 0.45
            put(im, x + xx, y + yy, mix(lo, hi, t))


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def bloom(im: Image.Image, cx: int, cy: int, radius: int, hot: tuple[int, int, int]) -> None:
    """Warm the opaque pixels around a lamp. No new transparent paint, so the night field stays the CSS plate."""
    px = im.load()
    for y in range(max(0, cy - radius), min(im.height, cy + radius + 1)):
        for x in range(max(0, cx - radius), min(im.width, cx + radius + 1)):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d > radius:
                continue
            t = (1 - d / radius) ** 2 * 0.55
            px[x, y] = (*mix((r, g, b), hot, t), a)


def text(im: Image.Image, word: str, x: int, y: int, ink: tuple[int, int, int]) -> None:
    cursor = x
    for ch in word:
        glyph = FONT[ch]
        for row, line in enumerate(glyph):
            for col, bit in enumerate(line):
                if bit == "#":
                    put(im, cursor + col, y + row, ink)
        cursor += 4


def scale(im: Image.Image, n: int) -> Image.Image:
    return im.resize((im.width * n, im.height * n), Image.Resampling.NEAREST)


def outline(im: Image.Image, rgb: tuple[int, int, int] = WOOD_LO) -> None:
    """One dark pixel around the silhouette so the prop separates from map tiles."""
    src = im.copy()
    px = src.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < im.width and 0 <= ny < im.height and px[nx, ny][3] > 200:
                    put(im, x, y, rgb)
                    break


def lantern(im: Image.Image, x: int, y: int) -> None:
    """Cap, amber glass, rim. Same parts as a street lamp, small enough for a window."""
    rect(im, x + 2, y, 2, 2, BRASS_LO)  # chain
    rect(im, x, y + 2, 6, 2, BRASS_HI)  # cap
    rect(im, x + 1, y + 4, 4, 6, GLASS)
    rect(im, x + 2, y + 5, 2, 3, GLASS_HOT)
    rect(im, x, y + 10, 6, 2, BRASS_DK)  # rim
    rect(im, x + 2, y + 12, 2, 2, BRASS_LO)


def print_shop() -> Image.Image:
    w, h = 64, 86
    im = new(w, h)
    # Wood carcass. Light from the upper left, plus the window lamp below.
    shade_rect(im, 4, 4, 56, 76, WOOD_LO, WOOD_MID)
    for y in range(8, 78, 4):
        put(im, 6, y, WOOD_HI)
        put(im, 57, y, WOOD_LO)
    rect(im, 4, 4, 56, 2, BRASS_LO)
    rect(im, 4, 4, 2, 76, BRASS_HI)
    rect(im, 58, 4, 2, 76, WOOD_LO)
    # Brass name plate. PRESS is the silhouette cue; the outfitter's plate is blank.
    shade_rect(im, 10, 8, 44, 14, BRASS_LO, BRASS_HI)
    rect(im, 10, 8, 44, 1, BRASS_HI)
    rect(im, 10, 21, 44, 1, BRASS_DK)
    rect(im, 12, 10, 40, 10, mix(BRASS, BRASS_HI, 0.4))
    put(im, 13, 11, BRASS_DK)
    put(im, 50, 11, BRASS_DK)
    text(im, "PRESS", 18, 12, WOOD_LO)
    # Oxblood awning, scalloped, one brass lip. Not the outfitter's candy stripe.
    shade_rect(im, 2, 23, 60, 7, OXBLOOD, OX_HI)
    rect(im, 2, 23, 60, 1, BRASS_HI)
    for x in range(2, 62, 5):
        put(im, x, 29, OXBLOOD)
        put(im, x + 1, 30, OXBLOOD)
        put(im, x + 2, 30, BRASS)
        put(im, x + 3, 29, BRASS_HI)
        put(im, x + 4, 29, BRASS_DK)
    # Window bay.
    rect(im, 8, 33, 32, 38, (16, 12, 10))
    rect(im, 8, 33, 32, 1, BRASS_LO)
    rect(im, 8, 33, 1, 38, BRASS_HI)
    rect(im, 39, 33, 1, 38, BRASS_DK)
    # Platen: iron bed, brass roller, a sheet with two lines of type.
    shade_rect(im, 12, 54, 22, 7, IRON, IRON_HI)
    rect(im, 14, 50, 18, 4, IRON_HI)
    rect(im, 16, 48, 14, 2, BRASS)
    rect(im, 13, 58, 18, 7, CREAM)
    rect(im, 15, 60, 12, 1, mix(INK, BLUE, 0.45))
    rect(im, 15, 62, 8, 1, mix(INK, RED, 0.4))
    # Ink bottle, one, so the window is a press and not a tailor's rack.
    rect(im, 30, 56, 4, 5, BLUE)
    rect(im, 31, 55, 2, 1, BRASS_HI)
    lantern(im, 18, 34)
    bloom(im, 21, 40, 14, GLASS)
    # Door. Four panes, brass knob toward the window.
    shade_rect(im, 42, 33, 16, 38, WOOD_LO, WOOD)
    rect(im, 42, 33, 1, 38, BRASS_LO)
    for py in (37, 48):
        for px in (45, 51):
            rect(im, px, py, 4, 6, mix(GLASS, WOOD_LO, 0.45))
            put(im, px + 1, py + 2, GLASS_HOT)
    rect(im, 43, 58, 2, 2, BRASS_HI)
    # Stoop, darker at the street.
    shade_rect(im, 6, 71, 52, 8, WOOD_LO, WOOD)
    rect(im, 10, 79, 44, 3, (16, 14, 12))
    bloom(im, 21, 40, 18, (255, 190, 100))
    outline(im)
    return scale(im, 4)


def fit_key(name: str, height: int) -> Image.Image:
    """The shipped vault key, nearest-scaled so the bow, shaft and teeth stay the real silhouette."""
    src = Image.open(ROOT / "public/sprites/keys" / f"{name}.png").convert("RGBA")
    box = src.getbbox()
    src = src.crop(box) if box else src
    width = max(1, round(src.width * height / src.height))
    return src.resize((width, height), Image.Resampling.NEAREST)


def street_counter() -> Image.Image:
    """Low stall under a green enamel sign. Three vault keys are the read at the 46×58 map box."""
    w, h = 40, 52
    im = new(w, h)
    # Enamel sign: the old .counter-pin plate. The keys are pasted after the scale, from the real sprites.
    rect(im, 3, 0, 34, 18, CREAM)
    shade_rect(im, 5, 2, 30, 14, ENAMEL, (52, 82, 64))
    # Posts and brass rail. The sign sits on the stall, not on a second building.
    rect(im, 7, 18, 2, 6, BRASS)
    rect(im, 31, 18, 2, 6, BRASS_LO)
    rect(im, 6, 23, 28, 2, BRASS_HI)
    # Wood top with a brass edge, so the counter catches the same light as the press.
    shade_rect(im, 2, 25, 36, 6, WOOD, WOOD_HI)
    rect(im, 2, 25, 36, 1, BRASS_HI)
    # Jar, six tier colours in ladder order. Big enough that two rows survive the pin scale.
    rect(im, 8, 19, 14, 7, (186, 206, 214))
    rect(im, 9, 18, 12, 2, BRASS_LO)
    heads = (WHITE, BLUE, GREEN, AMBER, RED, VIOLET)
    for i, head in enumerate(heads):
        rect(im, 10 + (i % 3) * 4, 20 + (i // 3) * 3, 2, 2, head)
    # Oil lamp. Flame is 3px of hot glass so it is still a light at 46px.
    rect(im, 27, 20, 8, 3, BRASS_DK)
    rect(im, 28, 16, 6, 4, GLASS)
    rect(im, 29, 14, 4, 3, GLASS_HOT)
    put(im, 30, 13, (255, 250, 236))
    bloom(im, 31, 17, 9, GLASS)
    # Drawer, brass pull, two legs.
    shade_rect(im, 5, 31, 30, 14, WOOD_LO, WOOD_MID)
    rect(im, 9, 34, 22, 8, WOOD_LO)
    rect(im, 18, 37, 4, 2, BRASS_HI)
    rect(im, 5, 45, 3, 5, WOOD_LO)
    rect(im, 32, 45, 3, 5, WOOD)
    outline(im)
    scaled = scale(im, 4)
    # White circle, blue square, amber hex — the same bows as public/sprites/keys. Steel shaft, teeth on the blade.
    keys = [fit_key(name, 48) for name in ("white", "blue", "amber")]
    gap = 4
    total = sum(key.width for key in keys) + gap * (len(keys) - 1)
    # Green field is logical x 5–35, y 2–16, times the ×4 scale.
    x = 20 + (120 - total) // 2
    y = 10
    for key in keys:
        scaled.alpha_composite(key, (x, y))
        x += key.width + gap
    return scaled


def main() -> None:
    shop = print_shop()
    counter = street_counter()
    OUT_SHOP.parent.mkdir(parents=True, exist_ok=True)
    shop.save(OUT_SHOP, optimize=True)
    counter.save(OUT_COUNTER, optimize=True)
    print("wrote", shop.size, OUT_SHOP)
    print("wrote", counter.size, OUT_COUNTER)


if __name__ == "__main__":
    main()
