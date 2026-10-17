#!/usr/bin/env python3
"""wip/art-proto: re-mix one print-shop coat with a cleaned coat mask (no brown speckles left inside the
recoloured coat). Same recolour maths as make-coat-variants.py; only the mask changes:
  * hole fill: an opaque pixel the hard Lab threshold missed, with >= 5 of its 8 neighbours already coat and
    a colour within 2.2x the coat radius (so the satchel, buttons and lantern stay out), joins the coat;
  * speck removal: a coat pixel with <= 1 coat neighbour is dropped;
  * lightness window capped at the coat's mean L +/- 16, so same-hue fur (the Corgi's cream bib) stays fur.
Usage: python3 scripts/proto-coat-cleanup.py corgi plum"""
import importlib.util
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("mcv", ROOT / "scripts" / "make-coat-variants.py")
mcv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mcv)
_hard = mcv.coat_mask
N8 = [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]


def clean_mask(scout, f, ref):
    # The Corgi's coat and fur share a hue and differ only in lightness, and the idle sheet's coat reference came
    # out with hi = 73 (ref L 36): the cream chin, bib, belly and paw all fell inside it and dyed lavender. Cap the
    # window at ref L +/- 16, which is what the walk rows already measure (L 22, hi 35).
    ref = {**ref, "lo": max(ref["lo"], ref["L"] - 16), "hi": min(ref["hi"], ref["L"] + 16)}
    m = set(_hard(scout, f, ref))
    if not m:
        return m
    px = f.load()
    lb = mcv._lynx.lantern_box(f, mcv.LANTERN_PAD.get(scout, 6))
    rad = mcv.AB_RADIUS_BY.get(scout, mcv.AB_RADIUS) * 2.2
    for _ in range(3):
        add = set()
        cand = {(x + dx, y + dy) for x, y in m for dx, dy in N8} - m
        for x, y in cand:
            if not (0 <= x < f.width and 0 <= y < f.height):
                continue
            r, g, b, a = px[x, y]
            if a < 64 or (lb and mcv._lynx.in_box(x, y, lb)):
                continue
            if sum((x + dx, y + dy) in m for dx, dy in N8) < 5:
                continue
            L, A, B = mcv.to_lab(r, g, b)
            if math.hypot(A - ref["a"], B - ref["b"]) <= rad and ref["lo"] - 4 <= L <= ref["hi"] + 4:
                add.add((x, y))
        if not add:
            break
        m |= add
    return {p for p in m if sum((p[0] + dx, p[1] + dy) in m for dx, dy in N8) > 1}


if __name__ == "__main__":
    scout, coat = sys.argv[1], sys.argv[2]
    mcv.coat_mask = clean_mask
    # The Corgi's chin shadow sits at ~0.38 of the body height, under the old 0.33 head line. The collar starts at 0.40.
    mcv.HEAD = {**mcv.HEAD, "corgi": 0.40}
    for kind in mcv.GRID:
        out = ROOT / "public" / "sprites" / "coats" / f"{scout}-{coat}-{kind}.png"
        mcv.save_exact(mcv.variant(scout, kind, coat), out)
        print("wrote", out.relative_to(ROOT))
