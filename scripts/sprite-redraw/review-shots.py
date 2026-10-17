#!/usr/bin/env python3
"""Review images for a v2 redraw: current (legacy, from git) vs new, base + coats, walk strips, idles.

    python3 scripts/sprite-redraw/review-shots.py turtle /workspace/screenshots/turtle-redraw- [REV] [PREV_V2_REV]

REV is the commit holding the legacy sheets (default origin/main); PREV_V2_REV adds the previous v2 pass for comparison. Writes <prefix>closeup.png, walk-side.png,
walk-front.png, idle.png on a dusk street colour, sheets upscaled 2x (nearest for the old 96/128 px art so its
pixels show honestly; the new 192 px frames 1x -> 2x Lanczos)."""
from __future__ import annotations

import importlib.util
import io
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BG = (38, 42, 48, 255)
LABEL = (232, 222, 204, 255)
try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
except OSError:
    FONT = ImageFont.load_default()


def rig_mod():
    spec = importlib.util.spec_from_file_location("rig", ROOT / "scripts" / "sprite-rig.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def git_png(rev: str, path: str) -> Image.Image | None:
    r = subprocess.run(["git", "show", f"{rev}:{path}"], cwd=ROOT, capture_output=True)
    return Image.open(io.BytesIO(r.stdout)).convert("RGBA") if r.returncode == 0 else None


def cell(im: Image.Image, c: int, r: int, size: int) -> Image.Image:
    return im.crop((c * size, r * size, (c + 1) * size, (r + 1) * size))


def board(rows: list[tuple[str, list[Image.Image]]], tile: int) -> Image.Image:
    lab_h = 30
    cols = max(len(t) for _, t in rows)
    out = Image.new("RGBA", (cols * tile, len(rows) * (tile + lab_h)), BG)
    d = ImageDraw.Draw(out)
    for k, (label, tiles) in enumerate(rows):
        y = k * (tile + lab_h)
        d.text((8, y + 5), label, fill=LABEL, font=FONT)
        for i, t in enumerate(tiles):
            out.alpha_composite(t, (i * tile, y + lab_h))
    return out


def up_old(im: Image.Image, tile: int) -> Image.Image:
    return im.resize((tile, tile), Image.NEAREST)


def up_new(im: Image.Image, tile: int) -> Image.Image:
    return im.resize((tile, tile), Image.LANCZOS)


def main() -> None:
    scout, prefix = sys.argv[1], sys.argv[2]
    rev = sys.argv[3] if len(sys.argv) > 3 else "origin/main"
    rig = rig_mod()
    T = 384  # every tile is one cell shown at 2x of the new 192 px frame
    base = Image.open(ROOT / f"public/sprites/scouts/{scout}-v2.png").convert("RGBA")
    mask = np.asarray(Image.open(ROOT / f"public/sprites/scouts/{scout}-v2-coat.png").convert("L"))
    pal = json.loads((ROOT / "scripts/coat-variants.json").read_text())
    targets = {**pal["coats"], **pal["dyes"]}
    default = json.loads((ROOT / f"scripts/sprite-redraw/{scout}/rig.json").read_text())["default_coat"]
    b = np.asarray(base)
    new = {"base": base}
    for c in ("plum", "dye-green"):
        new[c] = Image.fromarray(rig.apply_coat(b, mask, targets[c], default), "RGBA")
    old = {
        "base": (git_png(rev, f"public/sprites/scouts/{scout}-idle.png"), git_png(rev, f"public/sprites/scouts/{scout}-walk.png")),
        "plum": (git_png(rev, f"public/sprites/coats/{scout}-plum-idle.png"), git_png(rev, f"public/sprites/coats/{scout}-plum-walk.png")),
        "dye-green": (git_png(rev, f"scripts/dye-sheets/{scout}-dye-green-idle.png"), git_png(rev, f"scripts/dye-sheets/{scout}-dye-green-walk.png")),
    }
    names = {"base": "own coat", "plum": "Plum Frock Coat", "dye-green": "Field coat (dye)"}
    # Close-up: per coat, old idle | old walk right | new idle | new walk right.
    rows = []
    for k in ("base", "plum", "dye-green"):
        oi, ow = old[k]
        tiles = [up_old(cell(oi, 0, 0, 128), T), up_old(cell(ow, 0, 2, 96), T), up_new(cell(new[k], 0, 4, 192), T), up_new(cell(new[k], 0, 2, 192), T)]
        rows.append((f"{names[k]}:  current idle · current walk right   |   new idle · new walk right", tiles))
    board(rows, T).save(f"{prefix}closeup.png")
    # Walk strips: current (legacy) 4 frames, the previous v2 pass if given (argv[4], e.g. 191bf2c), the new 8.
    S = 288
    _, ow = old["base"]
    prev = git_png(sys.argv[4], f"public/sprites/scouts/{scout}-v2.png") if len(sys.argv) > 4 else None
    pv = lambda label, r, c0=0, n=8: [(f"{label} (previous v2 pass, {sys.argv[4]})", [up_new(cell(prev, c0 + c, r, 192), S) for c in range(n)])] if prev else []
    side = [
        ("live walk right (4 frames)", [up_old(cell(ow, c, 2, 96), S) for c in range(4)]),
        *pv("walk right", 2),
        ("NEW walk right: contact · down · passing · up, x2 (heel strike, push-off, hem flare, lantern swing)", [up_new(cell(base, c, 2, 192), S) for c in range(8)]),
        *pv("walk left", 1),
        ("NEW walk left (lantern in the far, right hand)", [up_new(cell(base, c, 1, 192), S) for c in range(8)]),
    ]
    board(side, S).save(f"{prefix}walk-side.png")
    front = [
        ("live walk toward camera (4 frames)", [up_old(cell(ow, c, 0, 96), S) for c in range(4)]),
        *pv("walk toward camera", 0),
        ("NEW walk toward camera (foot steps toward the viewer, hip sway, shoulders/lantern counter-sway)", [up_new(cell(base, c, 0, 192), S) for c in range(8)]),
        *pv("walk away", 3),
        ("NEW walk away (foot steps away)", [up_new(cell(base, c, 3, 192), S) for c in range(8)]),
    ]
    board(front, S).save(f"{prefix}walk-front.png")
    oi, _ = old["base"]
    osd = git_png(rev, f"public/sprites/scouts/{scout}-idle-side.png")
    idle = [
        ("live idle front (4) · side idle left (2) · right (2)", [up_old(cell(oi, c % 2, c // 2, 128), S) for c in range(4)] + [up_old(cell(osd, c, 0, 96), S) for c in range(2)] + [up_old(cell(osd, c, 1, 96), S) for c in range(2)]),
        *pv("idle front (4) · left (4)", 4),
        ("NEW 3/4 idle (8 frames at 0.34 s: one slow breath, head nod, lantern sway, blink on frame 6)", [up_new(cell(base, c, 4, 192), S) for c in range(8)]),
        ("NEW idle left (4) · idle right (4)", [up_new(cell(base, c, 5, 192), S) for c in range(8)]),
    ]
    board(idle, S).save(f"{prefix}idle.png")
    print("wrote", ", ".join(f"{prefix}{n}.png" for n in ("closeup", "walk-side", "walk-front", "idle")))


if __name__ == "__main__":
    main()
