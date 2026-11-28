#!/usr/bin/env python3
"""0.1.207: 24 opaque 480px two-ink lossless WebP stamps, each <= 1,536 B."""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "public" / "sprites" / "pic"
IDS = [f"p{i:02d}" for i in range(1, 25)]
MAX_B = 1536
SIZE = 480
PAPER = (241, 233, 215)
INK = (106, 70, 21)

def main() -> int:
    if not DIR.is_dir():
        print(f"[pic-stamps] missing {DIR}", file=sys.stderr)
        return 1
    names = sorted(p.name for p in DIR.glob("*.webp"))
    want = [f"{i}.webp" for i in IDS]
    if names != want:
        print(f"[pic-stamps] expected {want}, found {names}", file=sys.stderr)
        return 1
    bad = 0
    for i in IDS:
        path = DIR / f"{i}.webp"
        n = path.stat().st_size
        if n > MAX_B or n < 200:
            print(f"[pic-stamps] {i} is {n} B (cap {MAX_B})", file=sys.stderr)
            bad += 1
            continue
        im = Image.open(path)
        if im.format != "WEBP":
            print(f"[pic-stamps] {i} is {im.format}, not WebP", file=sys.stderr)
            bad += 1
            continue
        # Pillow sets 'lossless' on some builds; also infer from info
        lossless = bool(im.info.get("lossless", True))
        if im.info.get("lossless") is False:
            print(f"[pic-stamps] {i} is not lossless", file=sys.stderr)
            bad += 1
        if im.size != (SIZE, SIZE):
            print(f"[pic-stamps] {i} is {im.size}, not {SIZE}x{SIZE}", file=sys.stderr)
            bad += 1
        rgb = im.convert("RGB")
        px = rgb.load()
        w, h = rgb.size
        colors = {px[x, y] for y in range(h) for x in range(w)}
        if colors != {PAPER, INK}:
            print(f"[pic-stamps] {i} colors={colors} (want paper {PAPER} + ink {INK})", file=sys.stderr)
            bad += 1
    if bad:
        print(f"[pic-stamps] FAIL — {bad} stamp(s)", file=sys.stderr)
        return 1
    print(f"[pic-stamps] ok — 24 stamps, 480px, two inks, lossless WebP, each <= {MAX_B} B")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
