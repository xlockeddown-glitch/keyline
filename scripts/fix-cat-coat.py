#!/usr/bin/env python3
"""0.0.37: the Tabby walked in an olive-green coat but idled in its brown one (the shop icon is brown too).
Recolour the walk sheet's olive coat into the idle coat's browns: hue moves to the idle coat hue,
chroma and lightness are matched to the idle coat's spread; fur, boots, bag and lantern are untouched."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCOUTS = ROOT / "public" / "sprites" / "scouts"


def srgb_to_lin(u: float) -> float:
    u /= 255
    return ((u + 0.055) / 1.055) ** 2.4 if u > 0.04045 else u / 12.92


def lin_to_srgb(u: float) -> int:
    u = max(0.0, min(1.0, u))
    v = 1.055 * u ** (1 / 2.4) - 0.055 if u > 0.0031308 else 12.92 * u
    return max(0, min(255, round(v * 255)))


def to_lab(r: int, g: int, b: int):
    R, G, B = srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b)
    X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047
    Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
    Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(X), f(Y), f(Z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def from_lab(L: float, a: float, b: float):
    fy = (L + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200
    inv = lambda t: t ** 3 if t ** 3 > 0.008856 else (t - 16 / 116) / 7.787
    X, Y, Z = inv(fx) * 0.95047, inv(fy), inv(fz) * 1.08883
    R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z
    G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z
    B = 0.0557 * X - 0.2040 * Y + 1.0570 * Z
    return lin_to_srgb(R), lin_to_srgb(G), lin_to_srgb(B)


def hue(a: float, b: float) -> float:
    return (math.degrees(math.atan2(b, a)) + 360) % 360


# Olive coat: hue past ~72° in Lab at coat lightness. Ramp in over 8° so edges blend.
OLIVE_FROM, OLIVE_FULL, COAT_MAX_L = 70.0, 78.0, 60.0


def coat_weight(L: float, a: float, b: float) -> float:
    if L > COAT_MAX_L or math.hypot(a, b) < 5:
        return 0.0
    h = hue(a, b)
    if h > 140:
        return 0.0
    return max(0.0, min(1.0, (h - OLIVE_FROM) / (OLIVE_FULL - OLIVE_FROM)))


def stats(vals: list[float]):
    m = sum(vals) / len(vals)
    s = (sum((v - m) ** 2 for v in vals) / len(vals)) ** 0.5
    return m, max(s, 1e-6)


def idle_coat() -> dict:
    """The idle coat: dark-to-mid browns (L < 60) in the idle sheet's torso band."""
    im = Image.open(SCOUTS / "cat-idle.png").convert("RGBA")
    Ls, Cs, Hs = [], [], []
    w = im.width // 2
    for r in range(2):
        for c in range(2):
            f = im.crop((c * w, r * w, (c + 1) * w, (r + 1) * w))
            x0, y0, x1, y1 = f.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()
            px = f.load()
            hh, ww = y1 - y0, x1 - x0
            for y in range(int(y0 + hh * 0.42), int(y0 + hh * 0.8)):
                for x in range(int(x0 + ww * 0.25), int(x1 - ww * 0.25)):
                    R, G, B, A = px[x, y]
                    if A < 200:
                        continue
                    L, a, b = to_lab(R, G, B)
                    if L < COAT_MAX_L and math.hypot(a, b) >= 5:
                        Ls.append(L); Cs.append(math.hypot(a, b)); Hs.append(hue(a, b))
    return {"L": stats(Ls), "C": stats(Cs), "H": sum(Hs) / len(Hs)}


def main() -> None:
    target = idle_coat()
    path = SCOUTS / "cat-walk.png"
    im = Image.open(path).convert("RGBA")
    px = im.load()
    src_L, src_C = [], []
    for y in range(im.height):
        for x in range(im.width):
            R, G, B, A = px[x, y]
            if A < 16:
                continue
            L, a, b = to_lab(R, G, B)
            if coat_weight(L, a, b) >= 1:
                src_L.append(L); src_C.append(math.hypot(a, b))
    sL, sC = stats(src_L), stats(src_C)
    tL, tC, tH = target["L"], target["C"], target["H"]
    changed = 0
    for y in range(im.height):
        for x in range(im.width):
            R, G, B, A = px[x, y]
            if A < 16:
                continue
            L, a, b = to_lab(R, G, B)
            w = coat_weight(L, a, b)
            if w <= 0:
                continue
            C = math.hypot(a, b)
            L2 = tL[0] + (L - sL[0]) * (tL[1] / sL[1])
            C2 = max(0.0, tC[0] + (C - sC[0]) * (tC[1] / sC[1]))
            h2 = math.radians(tH)
            nL = L + (L2 - L) * w
            na = a + (C2 * math.cos(h2) - a) * w
            nb = b + (C2 * math.sin(h2) - b) * w
            px[x, y] = (*from_lab(nL, na, nb), A)
            changed += 1
    im.save(path, optimize=True)
    print(f"cat-walk: recoloured {changed} coat px; target hue {tH:.0f}°, L {tL[0]:.0f}±{tL[1]:.0f}, C {tC[0]:.0f}±{tC[1]:.0f}")


if __name__ == "__main__":
    main()
