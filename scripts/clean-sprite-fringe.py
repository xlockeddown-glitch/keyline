#!/usr/bin/env python3
"""0.0.81 art polish: clean the warm-red matte fringe off every scout sheet (the walk, idle and side-idle sheets
qa:sprites lists). The generated art came off a background with a red cast: the outermost ring of fur on the
Corgi's ears, the Tabby's cheeks and the Fox's tail reads as a pinkish-red rim on the map (worse once the sheet
is scaled up), and a few soft half-transparent pixels carry the same cast.

A pixel is fringe when it touches the transparent background (4-neighbour, alpha < 64), it is red (hue 0–42° or
330–360°, chroma > 22), and the solid pixels just inside it (alpha >= 200, not themselves on the edge, within 2 px)
average a hue at least 12° away from it. Uniformly red parts (the Penguin's scarf, the lantern glow) have red
insides and stay. A fringe pixel and every half-transparent edge pixel (alpha < 200) take the inside colour,
darkened to an ink edge (L* x 0.62, chroma x 0.85), keeping their own alpha, so silhouettes and every coat
sheet's alpha stay byte-identical. Idempotent: a cleaned pixel has its inside's hue. Rerun make-coat-variants.py
afterwards (coat sheets copy the base RGB outside the coat).

  python3 scripts/clean-sprite-fringe.py [--check]   # --check: report counts, write nothing"""
from __future__ import annotations

import importlib.util
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


qa = _load("qa_sprites", "qa-sprites.py")
mcv = _load("mcv", "make-coat-variants.py")
to_lab, from_lab = mcv.to_lab, mcv.from_lab
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))


def hue(A: float, B: float) -> float:
    return math.degrees(math.atan2(B, A)) % 360


def hue_gap(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return min(d, 360 - d)


def is_red(L: float, A: float, B: float) -> bool:
    h = hue(A, B)
    return math.hypot(A, B) > 22 and (h <= 42 or h >= 330)


def clean(im: Image.Image) -> tuple[Image.Image, int]:
    im = im.convert("RGBA")
    W, H = im.size
    src = im.load()
    out = im.copy()
    px = out.load()

    def alpha(x: int, y: int) -> int:
        return src[x, y][3] if 0 <= x < W and 0 <= y < H else 0

    def on_edge(x: int, y: int) -> bool:
        return any(alpha(x + dx, y + dy) < 64 for dx, dy in N4)

    changed = 0
    for y in range(H):
        for x in range(W):
            r, g, b, a = src[x, y]
            if a < 64 or not on_edge(x, y):
                continue
            L, A, B = to_lab(r, g, b)
            soft = a < 200
            if not soft and not is_red(L, A, B):
                continue
            inside = []
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    qx, qy = x + dx, y + dy
                    if (dx or dy) and 0 <= qx < W and 0 <= qy < H and src[qx, qy][3] >= 200 and not on_edge(qx, qy):
                        inside.append(to_lab(*src[qx, qy][:3]))
            if not inside:
                continue
            iL = sum(p[0] for p in inside) / len(inside)
            iA = sum(p[1] for p in inside) / len(inside)
            iB = sum(p[2] for p in inside) / len(inside)
            if not soft and (math.hypot(iA, iB) < 6 or hue_gap(hue(A, B), hue(iA, iB)) < 12):
                continue
            nr, ng, nb = from_lab(iL * 0.62, iA * 0.85, iB * 0.85)
            if (nr, ng, nb) != (r, g, b):
                px[x, y] = (nr, ng, nb, a)
                changed += 1
    return out, changed


def main() -> int:
    check = "--check" in sys.argv
    total = 0
    for name, (path, _size) in qa.SHEETS.items():
        before = Image.open(path).convert("RGBA")
        after, n = clean(before)
        assert after.getchannel("A").tobytes() == before.getchannel("A").tobytes()
        total += n
        if n:
            print(f"{name}: {n} fringe pixels{' (would clean)' if check else ''}")
            if not check:
                mcv.save_exact(after, path)
    print(f"{total} pixels {'to clean' if check else 'cleaned'}")
    return 1 if check and total else 0


if __name__ == "__main__":
    sys.exit(main())
