#!/usr/bin/env python3
"""0.0.37: side-facing idle sheets, so a scout that stops while walking left or right keeps facing that way.
Built from each scout's own walk sheet (same 96 px cells, same palette, same floor): the stride frame with
the feet closest together is the stance, and a second frame lifts nothing but lowers the head and torso
one pixel for a breath. Layout 2x2 @ 96: row 0 faces left (walk row 1), row 1 faces right (walk row 2).
Run after any walk-sheet change: python3 scripts/make-side-idle.py"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public" / "sprites"
SCOUTS = SPR / "scouts"
CELL = 96

WALKS = {
    "raccoon": (SPR / "player-walk.png", SPR / "player-idle-side.png"),
    **{s: (SCOUTS / f"{s}-walk.png", SCOUTS / f"{s}-idle-side.png") for s in ["cat", "corgi", "fox", "lynx", "owl", "sloth", "turtle", "giraffe"]},
}


def cell(im: Image.Image, r: int, c: int) -> Image.Image:
    return im.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))


def mask_bbox(f: Image.Image):
    return f.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()


def stance_score(f: Image.Image) -> float:
    """Width of the bottom fifth of the figure: feet together is narrowest."""
    x0, y0, x1, y1 = mask_bbox(f)
    band = f.crop((0, y1 - max(4, (y1 - y0) // 5), CELL, y1))
    bb = mask_bbox(band)
    return (bb[2] - bb[0]) if bb else 0


def breathe(f: Image.Image) -> Image.Image:
    """Head and torso settle one pixel; legs and the floor line stay put."""
    x0, y0, x1, y1 = mask_bbox(f)
    split = y0 + int((y1 - y0) * 0.62)
    out = f.copy()
    top = f.crop((0, 0, CELL, split))
    out.paste((0, 0, 0, 0), (0, 0, CELL, split))
    out.alpha_composite(top, (0, 1))
    # The row at the seam is the old seam row again, so nothing tears.
    seam = f.crop((0, split - 1, CELL, split))
    out.alpha_composite(seam, (0, split))
    return out


def build(walk_path: Path, out_path: Path) -> list[int]:
    walk = Image.open(walk_path).convert("RGBA")
    sheet = Image.new("RGBA", (CELL * 2, CELL * 2), (0, 0, 0, 0))
    picks = []
    for out_row, walk_row in ((0, 1), (1, 2)):
        frames = [cell(walk, walk_row, c) for c in range(4)]
        k = min(range(4), key=lambda i: stance_score(frames[i]))
        picks.append(k)
        sheet.alpha_composite(frames[k], (0, out_row * CELL))
        sheet.alpha_composite(breathe(frames[k]), (CELL, out_row * CELL))
    sheet.save(out_path, optimize=True)
    return picks


def main() -> None:
    for scout, (walk, out) in WALKS.items():
        picks = build(walk, out)
        print(f"{scout}: stance frames left {picks[0]}, right {picks[1]} -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
