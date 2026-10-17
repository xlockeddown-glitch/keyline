#!/usr/bin/env python3
"""Interior alpha-hole detector for v2 scout sheets.

A "hole" is a patch of transparent or low-alpha pixels inside a frame's
silhouette where the map would show through a moving sprite:

* enclosed  - fully surrounded by solid paint (alpha >= SOLID_A), or
* see-through - semi-transparent (alpha < SEE_A) pixels at least DEPTH px
  inside the filled outline.

Components are 8-connected; only those with area >= MIN_AREA px count.
The rig writes scripts/sprite-redraw/<scout>/parts-v2.png (one part id per
pixel, see PART_IDS in sprite-rig.py), which lets us skip openings that are
part of the design rather than rig defects:

* the lantern / bail loop and the gap between the lantern hand and body
  (ring >= 30% hand/lantern ids),
* openings already present in the painted key art (>= 50% art_gap id),
* a real stride gap between two legs (max inscribed radius >= 3.5 px with
  legs making up >= 50% of the ring) - that is negative space, not a hole.

Usage: python3 scripts/sprite-holes.py [scout ...]   (prints per-frame list)
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
CELL = 192
SOLID_A, SEE_A, DEPTH, MIN_AREA = 128, 200, 2, 4
HAND_IDS, LEG_ID, ART_GAP_ID = (5, 6), 4, 7
STRIDE_RADIUS = 3.5
VIEWS = {0: "walk down", 1: "walk left", 2: "walk right", 3: "walk up", 4: "idle 3/4"}


def view_of(r: int, c: int) -> str:
    return VIEWS.get(r) or ("idle left" if c < 4 else "idle right")


def cell_holes(cell: np.ndarray, lab: np.ndarray | None) -> list[dict]:
    a = cell[..., 3].astype(int)
    solid = a >= SOLID_A
    filled = ndimage.binary_fill_holes(solid)
    enclosed = filled & ~solid
    core = ndimage.binary_erosion(filled, iterations=DEPTH)
    cand = enclosed | (core & (a < SEE_A))
    L, n = ndimage.label(cand, structure=np.ones((3, 3)))
    out = []
    for i in range(1, n + 1):
        m = L == i
        area = int(m.sum())
        if area < MIN_AREA:
            continue
        if lab is not None:
            ring = ndimage.binary_dilation(m, structure=np.ones((3, 3))) & ~m & solid
            ids = lab[ring]
            ids = ids[ids > 0]
            if len(ids) and np.isin(ids, HAND_IDS).mean() >= 0.3:
                continue
            if (lab[m] == ART_GAP_ID).mean() >= 0.5:
                continue
            radius = float(ndimage.distance_transform_edt(m).max())
            if radius >= STRIDE_RADIUS and len(ids) and (ids == LEG_ID).mean() >= 0.5:
                continue
        ys, xs = np.where(m)
        out.append({"area": area, "x": int(xs.mean()), "y": int(ys.mean()), "min_alpha": int(a[m].min())})
    return out


def sheet_holes(sheet: Path, parts: Path | None) -> list[dict]:
    s = np.asarray(Image.open(sheet).convert("RGBA"))
    P = np.asarray(Image.open(parts)) if parts and parts.exists() else None
    rows, cols = s.shape[0] // CELL, s.shape[1] // CELL
    found = []
    for r in range(rows):
        for c in range(cols):
            sl = (slice(r * CELL, (r + 1) * CELL), slice(c * CELL, (c + 1) * CELL))
            for h in cell_holes(s[sl], None if P is None else P[sl]):
                found.append({"view": view_of(r, c), "row": r, "frame": c, **h})
    return found


def scout_holes(scout: str, sheet: Path | None = None) -> list[dict]:
    sheet = sheet or ROOT / "public/sprites/scouts" / f"{scout}-v2.png"
    return sheet_holes(sheet, ROOT / "scripts/sprite-redraw" / scout / "parts-v2.png")


if __name__ == "__main__":
    for sc in sys.argv[1:]:
        hs = scout_holes(sc)
        print(f"{sc}: {len(hs)} holes, {sum(h['area'] for h in hs)} px, "
              f"{len({(h['row'], h['frame']) for h in hs})} frames")
        for h in hs:
            print(f"   {h['view']:<10} f{h['frame']}  area {h['area']:>4}  at ({h['x']},{h['y']})  minA {h['min_alpha']}")
