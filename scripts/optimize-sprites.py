#!/usr/bin/env python3
"""0.0.81: lossless recompression of the shipped scout sheets (public/sprites/scouts/*-*.png, player-*.png and
every print-shop coat in public/sprites/coats/). Main sat 1.3 KB under deploy-guard's 8 MB static cap; PIL's
optimize=True leaves a lot on the table, and oxipng -o6 took these 135 sheets from 4.76 MB to 2.93 MB.

Pixels are checked byte for byte (RGBA) before a file is replaced, transparent pixels keep their RGB
(optimize_alpha off), so qa:sprites and the coat/dye mixers see exactly the same sheets. Run it after
make-coat-variants.py or any sheet edit. Needs pyoxipng (not in the base Python here):
  python3 -m venv /tmp/png && /tmp/png/bin/pip install pyoxipng pillow
  /tmp/png/bin/python scripts/optimize-sprites.py"""
from __future__ import annotations

import glob
import os
import shutil
import tempfile
from pathlib import Path

import oxipng
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = ["public/sprites/coats/*.png", "public/sprites/scouts/*-*.png", "public/sprites/player-*.png"]


def main() -> None:
    files = sorted(p for pat in PATTERNS for p in glob.glob(str(ROOT / pat)))
    before = after = 0
    with tempfile.TemporaryDirectory() as tmp:
        for f in files:
            out = os.path.join(tmp, os.path.basename(f))
            oxipng.optimize(f, out, level=6, strip=oxipng.StripChunks.safe(), optimize_alpha=False)
            b, a = os.path.getsize(f), os.path.getsize(out)
            before += b
            if a < b and Image.open(f).convert("RGBA").tobytes() == Image.open(out).convert("RGBA").tobytes():
                shutil.copyfile(out, f)
                after += a
            else:
                after += b
    print(f"{len(files)} sheets: {before} -> {after} bytes ({before - after} saved)")


if __name__ == "__main__":
    main()
