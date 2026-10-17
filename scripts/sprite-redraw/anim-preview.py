#!/usr/bin/env python3
"""Animated preview of a v2 scout at game speed (GIF): side walk (left + right), front walk, back walk, idle.

    python3 scripts/sprite-redraw/anim-preview.py turtle /workspace/screenshots/turtle-redraw-anim.gif

Timing matches GameMap: walking advances 8 frames per 0.44 s stride (0.055 s/frame), idle 0.34 s/frame.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
CELL, WALK_DT, IDLE_DT = 192, 0.44 / 8, 0.34
scout = sys.argv[1] if len(sys.argv) > 1 else "turtle"
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(f"/workspace/screenshots/{scout}-redraw-anim.gif")
FOOT = json.loads((ROOT / "scripts" / "sprite-redraw" / scout / "rig.json").read_text())["foot_y"]
sheet = Image.open(ROOT / "public" / "sprites" / "scouts" / f"{scout}-v2.png").convert("RGBA")


def cell(r, c):
    return sheet.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))


# (label, function t -> (row, col), x-travel px/s so the walk reads against the ground)
panels = [
    ("walk left", lambda t: (1, int(t / WALK_DT) % 8)),
    ("walk right", lambda t: (2, int(t / WALK_DT) % 8)),
    ("walk down", lambda t: (0, int(t / WALK_DT) % 8)),
    ("walk up", lambda t: (3, int(t / WALK_DT) % 8)),
    ("idle (3/4)", lambda t: (4, int(t / IDLE_DT) % 8)),
    ("idle left", lambda t: (5, int(t / IDLE_DT) % 4)),
    ("idle right", lambda t: (5, 4 + int(t / IDLE_DT) % 4)),
]
W, H = CELL * 4, (CELL + 22) * 2
STEP = 0.02  # GIF delay 20 ms
LOOP = 8 * IDLE_DT  # one full idle cycle (2.72 s)
frames = []
t = 0.0
while t < LOOP - 1e-9:
    im = Image.new("RGB", (W, H), (214, 208, 190))
    d = ImageDraw.Draw(im)
    for k, (label, f) in enumerate(panels):
        x, y = (k % 4) * CELL, (k // 4) * (CELL + 22)
        d.rectangle([x + 2, y + 2, x + CELL - 3, y + CELL - 3], fill=(226, 221, 204))
        d.line([x + 20, y + FOOT, x + CELL - 20, y + FOOT], fill=(190, 182, 160), width=1)  # rig floor line
        r, c = f(t)
        im.paste(cell(r, c), (x, y), cell(r, c))
        d.text((x + 8, y + CELL + 4), label, fill=(60, 50, 40))
    frames.append(im)
    t += STEP
frames[0].save(out, save_all=True, append_images=frames[1:], duration=int(STEP * 1000), loop=0, optimize=True)
print(out, len(frames), "frames")
