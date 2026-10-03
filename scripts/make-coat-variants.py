#!/usr/bin/env python3
"""0.0.45: print-shop coats — palette variants of every character's own field coat.

For each character and each coat in scripts/coat-variants.json this writes walk, idle and side-idle sheets
to public/sprites/coats/<scout>-<coat>-{walk,idle,idle-side}.png. Nothing is redrawn: the alpha channel
is copied untouched (same silhouette, same frame registration, same floor line), and only pixels that
belong to the coat are recoloured.

Which pixels are the coat, per pose (idle sheet, each walk facing, each side-idle facing):
  * reference: the densest (a*, b*) colour in the torso box (the same box qa:sprites reads the coat from);
  * candidates: below the head line and above the boots, outside the lantern glow box, within 9 Lab units
    of that colour in a*/b* and within the pose's own coat lightness range;
  * kept: only candidates connected to the torso, so fur, tails, bags and boots of a similar shade stay put.
Recolour: each coat pixel keeps its lightness offset from the pose's coat (folds, seams and shading survive),
moved onto the target lightness, with the target hue and a chroma that eases off in the shadows.
Deterministic; rerun after any base sheet changes, then `npm run qa:sprites`."""
from __future__ import annotations

import importlib.util
import json
import math
import warnings
from collections import Counter, deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "sprites" / "coats"
warnings.filterwarnings("ignore", category=DeprecationWarning)  # Image.getdata (Pillow 12)
PALETTE = json.loads((ROOT / "scripts" / "coat-variants.json").read_text())["coats"]


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


qa = _load("qa_sprites", "qa-sprites.py")
_coat = _load("coat_lab", "fix-cat-coat.py")
_lynx = _load("lynx", "make-lynx.py")
to_lab, from_lab = _coat.to_lab, _coat.from_lab

# Head line per character (fraction of the figure height); the coat starts below it.
HEAD = {"raccoon": 0.30, "cat": 0.33, "corgi": 0.33, "fox": 0.33, "lynx": 0.33, "owl": 0.36, "sloth": 0.30, "turtle": 0.30}
FOOT = 0.08
AB_RADIUS = 9.0
# The Turtle's coat over the shell keeps the scute pattern in warmer and cooler browns; it needs a wider net.
AB_RADIUS_BY = {"turtle": 14.0}
# How much of each pixel's lightness offset from the coat survives (folds and seams). The Turtle's scutes are
# softened a little so the new colour reads as one coat over the shell, not camouflage.
L_KEEP = {"turtle": 0.7}
GRID = {"idle": 2, "walk": 4, "idle-side": 2}
# Padding of the lantern box the coat stays out of (make-lynx.lantern_box). The 0.0.49 Penguin holds its lantern
# right at the sleeve tip, so the default box would swallow the sleeve and the front of the coat; its lantern has
# no coat-coloured pixels to protect, so a tight box (just the glow) is enough.
LANTERN_PAD = {"lynx": 2}


def coat_ref(frames: list[Image.Image], radius: float = 8.0):
    pts = []
    for f in frames:
        x0, y0, x1, y1 = qa.solid_bbox(f)
        w, h = x1 - x0, y1 - y0
        px = f.load()
        for y in range(int(y0 + h * 0.42), int(y0 + h * 0.78)):
            for x in range(int(x0 + w * 0.28), int(x1 - w * 0.28)):
                r, g, b, a = px[x, y]
                if a >= 200:
                    L, A, B = to_lab(r, g, b)
                    if 10 < L < 70:
                        pts.append((L, A, B))
    (ba, bb), _ = Counter((round(p[1] / 4), round(p[2] / 4)) for p in pts).most_common(1)[0]
    near = [p for p in pts if math.hypot(p[1] - ba * 4, p[2] - bb * 4) <= radius]
    n = len(near)
    Ls = sorted(p[0] for p in near)
    return {
        "L": sum(p[0] for p in near) / n,
        "a": sum(p[1] for p in near) / n,
        "b": sum(p[2] for p in near) / n,
        "lo": Ls[int(n * 0.02)] - 6,
        "hi": Ls[int(n * 0.98)] + 6,
    }


def coat_mask(scout: str, f: Image.Image, ref) -> set[tuple[int, int]]:
    bb = qa.solid_bbox(f)
    if not bb:
        return set()
    x0, y0, x1, y1 = bb
    w, h = x1 - x0, y1 - y0
    lb = _lynx.lantern_box(f, LANTERN_PAD.get(scout, 6))
    px = f.load()
    coat: set[tuple[int, int]] = set()
    for y in range(int(y0 + h * HEAD[scout]), int(y1 - h * FOOT)):
        for x in range(f.width):
            r, g, b, a = px[x, y]
            if a < 64 or (lb and _lynx.in_box(x, y, lb)):
                continue
            L, A, B = to_lab(r, g, b)
            if ref["lo"] <= L <= ref["hi"] and math.hypot(A - ref["a"], B - ref["b"]) <= AB_RADIUS_BY.get(scout, AB_RADIUS):
                coat.add((x, y))
    seeds = [p for p in coat if y0 + h * 0.45 <= p[1] <= y0 + h * 0.75 and x0 + w * 0.3 <= p[0] <= x1 - w * 0.3]
    seen, dq = set(seeds), deque(seeds)
    while dq:
        x, y = dq.popleft()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                p = (x + dx, y + dy)
                if p in coat and p not in seen:
                    seen.add(p)
                    dq.append(p)
    return seen


def recolour(f: Image.Image, mask: set[tuple[int, int]], ref, tgt, keep: float = 1.0) -> Image.Image:
    out = f.copy()
    px = out.load()
    th = math.radians(tgt["h"])
    ref_c = math.hypot(ref["a"], ref["b"])
    ref_h = math.atan2(ref["b"], ref["a"])
    for x, y in mask:
        r, g, b, a = px[x, y]
        L, A, B = to_lab(r, g, b)
        nl = max(4.0, min(92.0, tgt["L"] + (L - ref["L"]) * keep))
        nc = tgt["C"] * max(0.5, min(1.2, nl / tgt["L"]))
        hh = th
        if ref_c > 10 and math.hypot(A, B) > 6:
            d = (math.atan2(B, A) - ref_h + math.pi) % (2 * math.pi) - math.pi
            hh = th + d * 0.25
        nr, ng, nb = from_lab(nl, nc * math.cos(hh), nc * math.sin(hh))
        px[x, y] = (nr, ng, nb, a)
    return out


def variant(scout: str, kind: str, coat: str) -> Image.Image:
    path = qa.SHEETS[f"{scout}-{kind}"][0]
    sheet = Image.open(path).convert("RGBA")
    n = GRID[kind]
    grid = qa.cells(sheet, n)
    tgt = PALETTE[coat]
    out = sheet.copy()
    cw = sheet.width // n
    # One reference per pose: the whole idle sheet, each walk facing row, each side-idle facing row.
    rad = min(8.0, AB_RADIUS) if scout not in AB_RADIUS_BY else AB_RADIUS_BY[scout]
    refs = [coat_ref([f for row in grid for f in row], rad)] * n if kind == "idle" else [coat_ref(row, rad) for row in grid]
    for r, row in enumerate(grid):
        for c, f in enumerate(row):
            m = coat_mask(scout, f, refs[r])
            out.paste(recolour(f, m, refs[r], tgt, L_KEEP.get(scout, 1.0)), (c * cw, r * cw))
    assert out.getchannel("A").tobytes() == sheet.getchannel("A").tobytes()
    return out


def save_exact(im: Image.Image, path: Path) -> None:
    """Lossless: an indexed PNG (palette + per-index alpha) when the sheet has ≤256 RGBA colours, which every
    variant does (each base sheet has ~170); RGBA otherwise. Reloading gives back the same pixels either way."""
    colours = sorted(set(im.getdata()))
    if len(colours) > 256:
        im.save(path, optimize=True)
        return
    index = {c: i for i, c in enumerate(colours)}
    p = Image.new("P", im.size)
    p.putdata([index[c] for c in im.getdata()])
    p.putpalette([v for c in colours for v in c[:3]])
    p.info["transparency"] = bytes(c[3] for c in colours)
    p.save(path, optimize=True, transparency=bytes(c[3] for c in colours))
    assert Image.open(path).convert("RGBA").tobytes() == im.tobytes(), path


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for scout in qa.SCOUT_IDS:
        for coat in PALETTE:
            for kind in GRID:
                save_exact(variant(scout, kind, coat), OUT / f"{scout}-{coat}-{kind}.png")
    write_css()
    print(f"wrote {len(qa.SCOUT_IDS) * len(PALETTE) * len(GRID)} sheets to {OUT.relative_to(ROOT)} and public/coats.css")


# Sheet URLs carry the stamp the art last changed in, like the base sheets in styles.css.
ART_STAMP = "k45a"
# Characters whose base art changed since: their coat sheets carry the newer stamp (0.0.49: the Lynx slot is the Penguin).
ART_STAMP_BY = {"lynx": "k49p"}


def write_css() -> None:
    lines = [
        "/* Print-shop coats (v0.0.45 / k45a) — GENERATED by scripts/make-coat-variants.py; do not edit by hand.",
        "   data-coat on a .scout-marker swaps each sheet for the same character's recoloured sheet. Sizes and",
        "   frame positions come from the base rules in styles.css (one more attribute = higher specificity). */",
    ]
    for scout in qa.SCOUT_IDS:
        for coat in PALETTE:
            base = f'.scout-marker[data-scout="{scout}"][data-coat="{coat}"]'
            url = lambda kind: f'url("/sprites/coats/{scout}-{coat}-{kind}.png?v={ART_STAMP_BY.get(scout, ART_STAMP)}")'
            lines.append(f"{base}{{background-image:{url('walk')}}}")
            lines.append(f"{base}.is-idle{{background-image:{url('idle')};background-size:200% 200%}}")
            lines.append(f"{base}.is-idle.is-side{{background-image:{url('idle-side')};background-size:200% 200%}}")
    (ROOT / "public" / "coats.css").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    import sys

    if "--css" in sys.argv:
        write_css()
    else:
        main()
