#!/usr/bin/env python3
"""Re-register scout walk frames so the body stays put inside each cell.

Five generated walk sheets (cat, corgi, owl, sloth, turtle) drifted 4–10 px
sideways across each 4-frame cycle and snapped back on loop, and each facing
row stood on a different floor line (turning jumped the sprite up/down).
This shifts every walk frame by whole pixels so that, per row, the head/torso
centre holds the row's mean x, and every row's feet sit on the same floor as
the idle sheet (idle foot × 96/128). Pixels are moved, never resampled.

  python3 scripts/align-scout-sprites.py          # rewrite sheets in place
  python3 scripts/align-scout-sprites.py --check  # report only
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public" / "sprites"
WALK_CELL, IDLE_CELL = 96, 128


def sheets(name: str) -> tuple[Path, Path]:
    if name == "raccoon":
        return SPR / "player-idle.png", SPR / "player-walk.png"
    return SPR / "scouts" / f"{name}-idle.png", SPR / "scouts" / f"{name}-walk.png"


def bbox(f: Image.Image):
    return f.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()


def head_cx(f: Image.Image) -> float:
    """Centre x of the top 45% of the figure (head + shoulders) — limbs swing, heads should not."""
    bb = bbox(f)
    px = f.load()
    top, lim = bb[1], bb[1] + int((bb[3] - bb[1]) * 0.45)
    sx = n = 0
    for y in range(top, lim):
        for x in range(f.width):
            if px[x, y][3] >= 128:
                sx += x
                n += 1
    return sx / n


def walk_cells(im: Image.Image):
    return [[im.crop((c * WALK_CELL, r * WALK_CELL, (c + 1) * WALK_CELL, (r + 1) * WALK_CELL)) for c in range(4)] for r in range(4)]


def idle_floor(idle: Image.Image) -> float:
    feet = [bbox(idle.crop((c * IDLE_CELL, r * IDLE_CELL, (c + 1) * IDLE_CELL, (r + 1) * IDLE_CELL)))[3] for r in range(2) for c in range(2)]
    return max(feet) * WALK_CELL / IDLE_CELL  # standing frame; idle bobs only lift


def plan(name: str):
    idle_p, walk_p = sheets(name)
    walk = Image.open(walk_p).convert("RGBA")
    floor = round(idle_floor(Image.open(idle_p).convert("RGBA")))
    cells = walk_cells(walk)
    shifts = []
    for r, row in enumerate(cells):
        cxs = [head_cx(f) for f in row]
        target = sum(cxs) / len(cxs)
        out = []
        for f, cx in zip(row, cxs):
            bb = bbox(f)
            dx = round(target - cx)
            dy = floor - bb[3]
            # never push pixels out of the cell
            dx = max(-bb[0], min(WALK_CELL - bb[2], dx))
            dy = max(-bb[1], min(WALK_CELL - bb[3], dy))
            out.append((dx, dy))
        shifts.append(out)
    return walk_p, walk, cells, shifts, floor


def apply(walk_p: Path, walk: Image.Image, cells, shifts) -> None:
    out = Image.new("RGBA", walk.size, (0, 0, 0, 0))
    for r, row in enumerate(cells):
        for c, f in enumerate(row):
            dx, dy = shifts[r][c]
            out.alpha_composite(f, (c * WALK_CELL + dx, r * WALK_CELL + dy))
    out.save(walk_p, optimize=True)


def align_idle(name: str, check: bool) -> None:
    """Owl idle jumped 9 px sideways and 8 px up between frames; pin head x and floor."""
    idle_p, _ = sheets(name)
    im = Image.open(idle_p).convert("RGBA")
    cells = [im.crop((c * IDLE_CELL, r * IDLE_CELL, (c + 1) * IDLE_CELL, (r + 1) * IDLE_CELL)) for r in range(2) for c in range(2)]
    cxs = [head_cx(f) for f in cells]
    target = sum(cxs) / len(cxs)
    floor = max(bbox(f)[3] for f in cells)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    shifts = []
    for i, (f, cx) in enumerate(zip(cells, cxs)):
        bb = bbox(f)
        dx = max(-bb[0], min(IDLE_CELL - bb[2], round(target - cx)))
        dy = max(-bb[1], min(IDLE_CELL - bb[3], floor - bb[3]))
        shifts.append((dx, dy))
        out.alpha_composite(f, ((i % 2) * IDLE_CELL + dx, (i // 2) * IDLE_CELL + dy))
    print(f"{name} idle: shifts {shifts}{'' if check else ' (applied)'}")
    if not check:
        out.save(idle_p, optimize=True)


def corgi_idle_lantern(check: bool) -> None:
    """Corgi idle frame 1 holds a second lantern that pops in and out; reuse frame 3 (same pose, one lantern)."""
    idle_p, _ = sheets("corgi")
    im = Image.open(idle_p).convert("RGBA")
    f3 = im.crop((IDLE_CELL, IDLE_CELL, 2 * IDLE_CELL, 2 * IDLE_CELL))
    f1 = im.crop((IDLE_CELL, 0, 2 * IDLE_CELL, IDLE_CELL))
    if f1.tobytes() == f3.tobytes():
        print("corgi idle: frame 1 already matches frame 3")
        return
    print(f"corgi idle: frame 1 <- frame 3{'' if check else ' (applied)'}")
    if not check:
        im.paste(Image.new("RGBA", (IDLE_CELL, IDLE_CELL), (0, 0, 0, 0)), (IDLE_CELL, 0))
        im.alpha_composite(f3, (IDLE_CELL, 0))
        im.save(idle_p, optimize=True)


def main() -> int:
    check = "--check" in sys.argv
    names = [a for a in sys.argv[1:] if not a.startswith("--")] or ["cat", "corgi", "owl", "sloth", "turtle"]
    for name in names:
        walk_p, walk, cells, shifts, floor = plan(name)
        moved = sum(abs(dx) + abs(dy) for row in shifts for dx, dy in row)
        print(f"{name}: floor y={floor}, shifts {shifts}{'' if check else ' (applied)' if moved else ' (none)'}")
        if not check and moved:
            apply(walk_p, walk, cells, shifts)
    if "--walk-only" not in sys.argv:
        align_idle("owl", check)
        corgi_idle_lantern(check)
    return 0


if __name__ == "__main__":
    sys.exit(main())
