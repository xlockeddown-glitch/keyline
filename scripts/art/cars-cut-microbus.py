#!/usr/bin/env python3
"""0.1.179: cut Ryan's approved VW Microbus mock (teal-and-white v2, side | front | back on cream) into
transparent WebP sprites, same recipe and sizes as scripts/art/cars-cut-painted.py (side 640 px wide, front/back at the
side's pixel density, WebP q75). Source: SRC below (kept outside the repo). No paint variants, factory colour only.
Run with the scipy venv: /workspace/venv-scipy/bin/python scripts/art/cars-cut-microbus.py
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "/workspace/kl-car-mocks/microbus-mock-v2.png")
OUT = ROOT / "public/sprites/cars"
QUALITY = 75

spec = importlib.util.spec_from_file_location("cc", ROOT / "scripts/art/cars-cut-painted.py")
cc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cc)  # type: ignore[union-attr]


def main() -> int:
    im = np.asarray(Image.open(SRC).convert("RGB"))
    views = {name: (crop, mask) for name, crop, mask, _bg in cc.views_of(im)}
    # The mock has no ground shadow, so the flood-keyed silhouette (holes filled) is the car.
    keep = {n: ndimage.binary_fill_holes(m) for n, (c, m) in views.items()}
    # Unlike the Duesenberg there is no open cab: the white roof and white V-panel are paint, and they sit within
    # the sheet-colour distance, so no cream-pocket keying here (it would cut the roof out). Holes stay filled.
    raw = {n: cc.tight_rgba(views[n][0], keep[n]) for n in ("side", "front", "back")}
    scale = cc.SIDE_W / raw["side"].width
    for name in ("side", "front", "back"):
        w = cc.SIDE_W if name == "side" else max(192, round(raw[name].width * scale))
        h = round(raw[name].height * scale)
        out = cc.premult_resize(raw[name], w, h)
        dest = OUT / f"microbus-{name}.webp"
        out.save(dest, format="WEBP", quality=QUALITY, method=6, lossless=False)
        print(f"{dest.relative_to(ROOT)} {w}x{h} {dest.stat().st_size}b")
    return 0


if __name__ == "__main__":
    sys.exit(main())
