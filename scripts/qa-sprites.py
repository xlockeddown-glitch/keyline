#!/usr/bin/env python3
"""Deterministic scout idle/walk sheet QA: holes, magenta, alpha, identity,
plus per-frame registration (walk drift, floor line per facing, idle jumps,
idle-to-walk floor match, pixels touching a cell edge), and since 0.0.37:
  * distinct silhouettes — two characters whose alpha masks overlap too much fail (a recolour is not a character);
  * one palette — a character's walk and idle coats must be the same colour (the Tabby walked in green, idled in brown);
  * side idles — the stand-still-facing-left/right sheets sit on the walk floor and don't jump;
and since 0.0.38 the coat check is per facing (front, left, right) and covers the shop icon, with a
tighter limit (the Turtle walked in a bare shell at ΔH 3.6–4.1 and slipped under the old 5.5).
Since 0.0.81 every coat variant also keeps its colour off the fur (coat_leak). Since 0.0.45 it also checks every print-shop coat variant (public/sprites/coats/<scout>-<coat>-<kind>.png):
  * same sheet hygiene as the base sheets (size, magenta, specks, corners, leftover background);
  * the alpha channel is the base sheet's, byte for byte — a coat is a recolour, never a new silhouette;
  * every pose shows the coat: idle, walk front/left/right and both side idles each move the torso colour
    off the character's own coat (ΔE) and onto the catalogue hue (scripts/coat-variants.json);
  * one coat per outfit: walk facings and side idles match the idle coat (ΔH), like the base sheets.
Since 0.0.83 scouts on the redrawn v2 sheets (src/game/coatLayer.ts V2_SCOUTS) get v2_check instead: one 8x6 sheet
of 192 px cells (8-frame walks, an 8-frame 3/4 front idle, 4-frame side idles) plus a coat mask — cell hygiene and registration, the mask sits on
the base coat, and every coat and dye changes only masked pixels and lands on the catalogue hue. Since 0.0.89 v2_check
also fails interior alpha holes (scripts/sprite-holes.py: the map showing through gaps between rig parts or keyed-out
paint, in any frame of any view); every v2 scout must have none.
KEYLINE_SPRITE_OVERRIDE="name=path,..." swaps sheets in for the self-tests (v2: <scout>-v2=, <scout>-v2-coat=)."""
from __future__ import annotations

import itertools
import json
import math
import os
import re
import sys
from functools import lru_cache
from hashlib import md5
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "public" / "sprites"
SCOUTS = SPR / "scouts"

# Idle is 2x2 @ 256; walk is 4x4 @ 384. Raccoon uses the player sheets.
SHEETS = {
    "raccoon-idle": (SPR / "player-idle.png", (256, 256)),
    "raccoon-walk": (SPR / "player-walk.png", (384, 384)),
    "cat-idle": (SCOUTS / "cat-idle.png", (256, 256)),
    "cat-walk": (SCOUTS / "cat-walk.png", (384, 384)),
    "corgi-idle": (SCOUTS / "corgi-idle.png", (256, 256)),
    "corgi-walk": (SCOUTS / "corgi-walk.png", (384, 384)),
    "fox-idle": (SCOUTS / "fox-idle.png", (256, 256)),
    "fox-walk": (SCOUTS / "fox-walk.png", (384, 384)),
    "lynx-idle": (SCOUTS / "lynx-idle.png", (256, 256)),
    "lynx-walk": (SCOUTS / "lynx-walk.png", (384, 384)),
    "owl-idle": (SCOUTS / "owl-idle.png", (256, 256)),
    "owl-walk": (SCOUTS / "owl-walk.png", (384, 384)),
    "sloth-idle": (SCOUTS / "sloth-idle.png", (256, 256)),
    "sloth-walk": (SCOUTS / "sloth-walk.png", (384, 384)),
    "turtle-idle": (SCOUTS / "turtle-idle.png", (256, 256)),
    "turtle-walk": (SCOUTS / "turtle-walk.png", (384, 384)),
    "giraffe-idle": (SCOUTS / "giraffe-idle.png", (256, 256)),
    "giraffe-walk": (SCOUTS / "giraffe-walk.png", (384, 384)),
    # Side idles: 2x2 @ 96 — row 0 faces left, row 1 faces right.
    "raccoon-idle-side": (SPR / "player-idle-side.png", (192, 192)),
    "cat-idle-side": (SCOUTS / "cat-idle-side.png", (192, 192)),
    "corgi-idle-side": (SCOUTS / "corgi-idle-side.png", (192, 192)),
    "fox-idle-side": (SCOUTS / "fox-idle-side.png", (192, 192)),
    "lynx-idle-side": (SCOUTS / "lynx-idle-side.png", (192, 192)),
    "owl-idle-side": (SCOUTS / "owl-idle-side.png", (192, 192)),
    "sloth-idle-side": (SCOUTS / "sloth-idle-side.png", (192, 192)),
    "turtle-idle-side": (SCOUTS / "turtle-idle-side.png", (192, 192)),
    "giraffe-idle-side": (SCOUTS / "giraffe-idle-side.png", (192, 192)),
}
# Shop icons (one 96 px idle-style portrait each); checked against the idle coat, not inspected as sheets.
SCOUT_IDS = ["raccoon", "cat", "corgi", "fox", "lynx", "owl", "sloth", "turtle", "giraffe"]  # 0.0.51: + the Giraffe
ICONS = {s: SCOUTS / f"{s}.png" for s in SCOUT_IDS}

# 0.0.83: scouts redrawn on the v2 sheets (src/game/coatLayer.ts V2_SCOUTS) — one 8x6 sheet of 192 px cells plus a
# coat mask, checked by v2_check(). Every other check here covers the legacy 4x4 / 2x2 sheets only.
_v2_src = (ROOT / "src" / "game" / "coatLayer.ts").read_text()
V2_IDS = re.findall(r'"([a-z]+)"', re.search(r"V2_SCOUTS[^=]*=\s*new Set\(\[([^\]]*)\]", _v2_src).group(1))
LEGACY_IDS = [s for s in SCOUT_IDS if s not in V2_IDS]
for _s in V2_IDS:
    for _k in ("idle", "walk", "idle-side"):
        SHEETS.pop(f"{_s}-{_k}", None)
V2_SHEETS = {s: {"base": SCOUTS / f"{s}-v2.png", "mask": SCOUTS / f"{s}-v2-coat.png"} for s in V2_IDS}
KINDS = ["idle", "walk", "idle-side"]

# 0.0.45 print-shop coats, plus 0.0.64 vat dyes: one recoloured walk / idle / side-idle set per character.
_palette = json.loads((ROOT / "scripts" / "coat-variants.json").read_text())
COATS = {**_palette["coats"], **_palette.get("dyes", {})}
COAT_DIR = SPR / "coats"
# 0.0.64: dye sheets are not shipped (the browser mixes them). qa still reads the copies the generator writes.
DYE_DIR = ROOT / "scripts" / "dye-sheets"
VARIANTS = {
    f"{s}-{c}-{k}": ((DYE_DIR if str(c).startswith("dye-") else COAT_DIR) / f"{s}-{c}-{k}.png", SHEETS[f"{s}-{k}"][1])
    for s in LEGACY_IDS
    for c in COATS
    for k in KINDS
}

for _pair in filter(None, os.environ.get("KEYLINE_SPRITE_OVERRIDE", "").split(",")):
    _name, _path = _pair.split("=", 1)
    if _name.endswith("-icon"):
        ICONS[_name[:-5]] = (ROOT / _path).resolve()
    elif _name.endswith("-v2-coat") and _name[:-8] in V2_SHEETS:
        V2_SHEETS[_name[:-8]]["mask"] = (ROOT / _path).resolve()
    elif _name.endswith("-v2") and _name[:-3] in V2_SHEETS:
        V2_SHEETS[_name[:-3]]["base"] = (ROOT / _path).resolve()
    elif _name in VARIANTS:
        VARIANTS[_name] = ((ROOT / _path).resolve(), VARIANTS[_name][1])
    else:
        SHEETS[_name] = ((ROOT / _path).resolve(), SHEETS[_name][1])

MAX_SPECKS = 8
MAX_MAGENTA = 0
MAX_CORNER_A = 16


def speck_count(im: Image.Image) -> int:
    """Transparent pixels (alpha < 16) whose eight neighbours are all solid (alpha ≥ 200): dropout holes."""
    al = np.asarray(im.getchannel("A"), dtype=np.uint8)
    if al.shape[0] < 3 or al.shape[1] < 3:
        return 0
    solid = al >= 200
    h, w = al.shape
    enclosed = np.ones((h - 2, w - 2), dtype=bool)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx or dy:
                enclosed &= solid[1 + dy : h - 1 + dy, 1 + dx : w - 1 + dx]
    return int(((al[1:-1, 1:-1] < 16) & enclosed).sum())


def magenta_count(im: Image.Image) -> int:
    px = np.asarray(im, dtype=np.uint8)
    r, g, b, a = (px[..., i].astype(int) for i in range(4))
    return int(((a > 200) & (r > 200) & (b > 200) & (g < 90)).sum())


def corner_alpha(im: Image.Image) -> int:
    w, h = im.size
    px = im.load()
    pts = (px[1, 1], px[w - 2, 1], px[1, h - 2], px[w - 2, h - 2])
    return max(p[3] for p in pts)


# Frame registration limits (cell pixels). Walk cells are 96 px, idle 128 px.
MAX_WALK_HEAD_DRIFT = 2.5   # head/torso x range inside one facing row
MAX_ROW_FOOT_SPREAD = 2     # floor line wobble inside one row
MAX_CROSS_ROW_FOOT = 3      # floor line difference between facings (turn jump)
MAX_IDLE_HEAD_DRIFT = 3.5   # head x range across idle frames
MAX_IDLE_WALK_FLOOR = 3     # idle floor (scaled to 96) vs walk floor


def cells(im: Image.Image, n: int) -> list[list[Image.Image]]:
    w = im.width // n
    return [[im.crop((c * w, r * w, (c + 1) * w, (r + 1) * w)) for c in range(n)] for r in range(n)]


def solid_bbox(f: Image.Image):
    return f.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()


def head_cx(f: Image.Image) -> float:
    bb = solid_bbox(f)
    px = f.load()
    top, lim = bb[1], bb[1] + int((bb[3] - bb[1]) * 0.45)
    sx = n = 0
    for y in range(top, lim):
        for x in range(f.width):
            if px[x, y][3] >= 128:
                sx += x
                n += 1
    return sx / n if n else 0.0


def edge_touch(f: Image.Image) -> int:
    px = f.load()
    w, h = f.size
    n = 0
    for i in range(w):
        for x, y in ((i, 0), (i, h - 1), (0, i), (w - 1, i)):
            if px[x, y][3] >= 128:
                n += 1
    return n


def registration(scout: str, idle_path: Path, walk_path: Path) -> tuple[dict, list[str]]:
    fails: list[str] = []
    idle = cells(Image.open(idle_path).convert("RGBA"), 2)
    walk = cells(Image.open(walk_path).convert("RGBA"), 4)
    rows = []
    for r, row in enumerate(walk):
        heads = [head_cx(f) for f in row]
        feet = [solid_bbox(f)[3] for f in row]
        edges = sum(edge_touch(f) for f in row)
        drift = max(heads) - min(heads)
        rows.append({"row": r, "headDrift": round(drift, 1), "feet": feet, "edgePx": edges})
        if drift > MAX_WALK_HEAD_DRIFT:
            fails.append(f"{scout}-walk row {r}: body drifts {drift:.1f}px across the cycle")
        if max(feet) - min(feet) > MAX_ROW_FOOT_SPREAD:
            fails.append(f"{scout}-walk row {r}: floor wobbles {feet}")
        if edges:
            fails.append(f"{scout}-walk row {r}: {edges}px touch the cell edge (cut off)")
    row_floor = [sorted(x["feet"])[len(x["feet"]) // 2] for x in rows]
    if max(row_floor) - min(row_floor) > MAX_CROSS_ROW_FOOT:
        fails.append(f"{scout}-walk: facings stand on different floors {row_floor} (turn jump)")
    flat = [f for row in idle for f in row]
    iheads = [head_cx(f) for f in flat]
    ifeet = [solid_bbox(f)[3] for f in flat]
    iedges = sum(edge_touch(f) for f in flat)
    if max(iheads) - min(iheads) > MAX_IDLE_HEAD_DRIFT:
        fails.append(f"{scout}-idle: head jumps {max(iheads) - min(iheads):.1f}px between frames")
    if iedges:
        fails.append(f"{scout}-idle: {iedges}px touch the cell edge (cut off)")
    idle_floor = max(ifeet) * 96 / 128
    walk_floor = sum(row_floor) / len(row_floor)
    if abs(idle_floor - walk_floor) > MAX_IDLE_WALK_FLOOR:
        fails.append(f"{scout}: idle floor {idle_floor:.0f} vs walk floor {walk_floor:.0f} (hop on stop/start)")
    return {"scout": scout, "walkRows": rows, "idleHeadDrift": round(max(iheads) - min(iheads), 1), "idleFloor96": round(idle_floor, 1), "walkFloor": round(walk_floor, 1)}, fails


# ── 0.0.37 checks ────────────────────────────────────────────────────────

# Distinct characters top out around 0.78 overlap (fox/lynx after the lynx rework, cat/corgi 0.73);
# a recolour is 1.0. Fail at this overlap, warn a little below it.
MAX_SHAPE_IOU = 0.85
WARN_SHAPE_IOU = 0.80
# Coat colour shift between the idle torso and each walk facing (front, left, right) and the shop icon,
# as CIE ΔH* (hue difference scaled by chroma). Consistent coats sit at ≤ 2.8 (lynx sides 2.76, turtle 2.1
# after 0.0.38, everyone else ≤ 1.8); the 0.0.37 shell-walking Turtle was 3.6–4.1 and the 0.0.36
# olive Tabby 6.5–7.1. The back view is reported but not gated: tails and hoods fill the torso there.
MAX_COAT_DH = 3.2
# Per-character allowance. The Raccoon's grey coat has so little chroma that its mean hue swings with
# the lighting of each pose (3.9–4.1 on art that matches by eye), so it keeps the pre-0.0.38 limit.
COAT_DH_LIMIT = {"raccoon": 5.5}
MAX_SIDE_FLOOR = 1
MAX_SIDE_HEAD_DRIFT = 1.5


def mask(path: Path) -> list[int]:
    return list(Image.open(path).convert("RGBA").getchannel("A").point(lambda v: 1 if v >= 128 else 0).tobytes())


def iou(a: list[int], b: list[int]) -> float:
    inter = sum(1 for x, y in zip(a, b) if x and y)
    union = sum(1 for x, y in zip(a, b) if x or y)
    return inter / union if union else 1.0


def shape_check() -> tuple[list[dict], list[str], list[str]]:
    rows, fails, warns = [], [], []
    for kind in KINDS:
        masks = {s: mask(SHEETS[f"{s}-{kind}"][0]) for s in LEGACY_IDS if SHEETS[f"{s}-{kind}"][0].exists()}
        for a, b in itertools.combinations(sorted(masks), 2):
            if len(masks[a]) != len(masks[b]):
                continue
            v = iou(masks[a], masks[b])
            rows.append({"kind": kind, "pair": [a, b], "iou": round(v, 3)})
            if v >= MAX_SHAPE_IOU:
                fails.append(f"{a}/{b} {kind}: same silhouette (overlap {v:.2f} ≥ {MAX_SHAPE_IOU}) — a recolour, not its own character")
            elif v >= WARN_SHAPE_IOU:
                warns.append(f"{a}/{b} {kind}: silhouettes close (overlap {v:.2f})")
    return rows, fails, warns


@lru_cache(maxsize=None)
def _lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    def lin(u: int) -> float:
        x = u / 255
        return ((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92
    R, G, B = lin(r), lin(g), lin(b)
    X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047
    Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
    Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(X), f(Y), f(Z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def torso_lab(frames: list[Image.Image]) -> tuple[float, float, float]:
    """Mean Lab of the torso (45–75% down the figure, middle 40% across): that's the coat."""
    acc = [0.0, 0.0, 0.0]
    n = 0
    for f in frames:
        x0, y0, x1, y1 = solid_bbox(f)
        w, h = x1 - x0, y1 - y0
        px = f.load()
        for y in range(int(y0 + h * 0.45), int(y0 + h * 0.75)):
            for x in range(int(x0 + w * 0.3), int(x1 - w * 0.3)):
                r, g, b, a = px[x, y]
                if a < 200:
                    continue
                L, A, B = _lab(r, g, b)
                acc[0] += L
                acc[1] += A
                acc[2] += B
                n += 1
    return (acc[0] / n, acc[1] / n, acc[2] / n) if n else (0.0, 0.0, 0.0)


def delta_h(p: tuple[float, float, float], q: tuple[float, float, float]) -> float:
    c1, c2 = math.hypot(p[1], p[2]), math.hypot(q[1], q[2])
    h1, h2 = math.atan2(p[2], p[1]), math.atan2(q[2], q[1])
    dh = (h2 - h1 + math.pi) % (2 * math.pi) - math.pi
    return abs(2 * math.sqrt(c1 * c2) * math.sin(dh / 2))


def palette_check() -> tuple[list[dict], list[str]]:
    rows, fails = [], []
    for s in LEGACY_IDS:
        ip, wp, sp = (SHEETS[f"{s}-{k}"][0] for k in KINDS)
        if not (ip.exists() and wp.exists()):
            continue
        limit = COAT_DH_LIMIT.get(s, MAX_COAT_DH)
        idle = [f for row in cells(Image.open(ip).convert("RGBA"), 2) for f in row]
        walk = cells(Image.open(wp).convert("RGBA"), 4)
        ref = torso_lab(idle)
        facing = {name: delta_h(ref, torso_lab(walk[r])) for name, r in (("front", 0), ("left", 1), ("right", 2), ("back", 3))}
        rec = {"scout": s, "coatLimit": limit, "coatDeltaH": round(facing["front"], 2),
               "coatDeltaHByFacing": {k: round(v, 2) for k, v in facing.items()}}
        for name in ("front", "left", "right"):
            if facing[name] > limit:
                fails.append(f"{s}: walk and idle coats differ in colour (walking {name}, ΔH {facing[name]:.1f} > {limit}) — one outfit per character")
        icon = ICONS.get(s)
        if icon and icon.exists():
            d = delta_h(ref, torso_lab([Image.open(icon).convert("RGBA")]))
            rec["iconDeltaH"] = round(d, 2)
            if d > limit:
                fails.append(f"{s}: shop icon coat differs from the idle (ΔH {d:.1f} > {limit})")
        if sp.exists():
            side = cells(Image.open(sp).convert("RGBA"), 2)
            dl = delta_h(torso_lab(side[0]), torso_lab(walk[1]))
            dr = delta_h(torso_lab(side[1]), torso_lab(walk[2]))
            rec["sideDeltaH"] = [round(dl, 2), round(dr, 2)]
            for face, d in (("left", dl), ("right", dr)):
                if d > limit:
                    fails.append(f"{s}: side idle ({face}) coat differs from the walk (ΔH {d:.1f})")
        rows.append(rec)
    return rows, fails


def side_idle_check() -> tuple[list[dict], list[str]]:
    rows, fails = [], []
    for s in LEGACY_IDS:
        sp, wp = SHEETS[f"{s}-idle-side"][0], SHEETS[f"{s}-walk"][0]
        if not sp.exists():
            fails.append(f"{s}: no side idle sheet (stopping while walking left/right snaps to the front)")
            continue
        side = cells(Image.open(sp).convert("RGBA"), 2)
        walk = cells(Image.open(wp).convert("RGBA"), 4)
        rec = {"scout": s, "rows": []}
        for r, walk_row, face in ((0, 1, "left"), (1, 2, "right")):
            feet = [solid_bbox(f)[3] for f in side[r]]
            wfeet = sorted(solid_bbox(f)[3] for f in walk[walk_row])
            floor = wfeet[len(wfeet) // 2]
            heads = [head_cx(f) for f in side[r]]
            edges = sum(edge_touch(f) for f in side[r])
            rec["rows"].append({"face": face, "feet": feet, "walkFloor": floor, "headDrift": round(max(heads) - min(heads), 1)})
            if max(abs(f - floor) for f in feet) > MAX_SIDE_FLOOR:
                fails.append(f"{s}-idle-side {face}: floor {feet} vs walk floor {floor} (hop on stop)")
            if max(heads) - min(heads) > MAX_SIDE_HEAD_DRIFT:
                fails.append(f"{s}-idle-side {face}: head jumps {max(heads) - min(heads):.1f}px")
            if edges:
                fails.append(f"{s}-idle-side {face}: {edges}px touch the cell edge (cut off)")
            # It must actually face that way: the walk row's profile, not the front idle.
            hx = sum(head_cx(f) for f in walk[walk_row]) / 4
            if abs(sum(heads) / len(heads) - hx) > MAX_WALK_HEAD_DRIFT + 1:
                fails.append(f"{s}-idle-side {face}: head sits at {sum(heads) / len(heads):.0f}, walk profile at {hx:.0f} — not the {face} profile")
        rows.append(rec)
    return rows, fails


# ── 0.0.45 coat variants ─────────────────────────────────────────────────

# "Coat pixels" in a variant are the pixels whose colour differs from the base sheet (alpha never does).
# Every pose must show the coat: the torso box's colour moves at least this far (CIE ΔE76) off the
# character's own coat, and at least this share of the torso box is repainted coat. (Open-fronted coats
# like the Fox's and Lynx's show a fur chest in the walk front, so neither number can ask for the whole box.)
MIN_COAT_SHIFT = 8.0
MIN_COAT_SHARE = 0.25
# The repainted pixels land on the catalogue hue (scripts/coat-variants.json)…
MAX_TARGET_HUE = 20.0
# …and are one coat across poses: each walk facing against the idle, each side idle against its walk
# facing, as CIE ΔH* of the mean coat colour (variant coats carry 3–10× the chroma of the grey base coats,
# so a variant gets its own limit rather than the base sheets' 3.2).
MAX_VARIANT_DH = 4.0
# 0.0.81: no coat colour on fur. A coat is one cloth in a band of lightness; the repainted pixels of a frame whose
# base colour is far lighter than the frame's median repainted pixel are fur, bib or belly that the recolour
# caught (the plum Corgi idled with a lavender chin, chest, belly and paw: 256 pixels in one frame).
LEAK_DL = 24.0
MAX_LEAK = 4


def _hue_deg(lab: tuple[float, float, float]) -> float:
    return math.degrees(math.atan2(lab[2], lab[1])) % 360


def _hue_gap(a: float, b: float) -> float:
    return abs((a - b + 180) % 360 - 180)


def coat_pixels(var: list[Image.Image], base: list[Image.Image]) -> tuple[tuple[float, float, float], float]:
    """Mean Lab of the repainted pixels across frames, and the repainted share of the torso box."""
    acc, n, box_n, box_hit = [0.0, 0.0, 0.0], 0, 0, 0
    for v, b in zip(var, base):
        vp, bp = np.asarray(v, dtype=np.uint8), np.asarray(b, dtype=np.uint8)
        x0, y0, x1, y1 = solid_bbox(b)
        w, h = x1 - x0, y1 - y0
        solid = vp[..., 3] >= 200
        hit = solid & (vp[..., :3] != bp[..., :3]).any(axis=-1)
        ys, xs = np.mgrid[0 : v.height, 0 : v.width]
        box = (ys >= y0 + h * 0.45) & (ys < y0 + h * 0.75) & (xs >= x0 + w * 0.3) & (xs < x1 - w * 0.3) & solid
        box_n += int(box.sum())
        box_hit += int((box & hit).sum())
        for (r, g, bb), k in zip(*np.unique(vp[hit][:, :3], axis=0, return_counts=True)):
            L, A, B = _lab(int(r), int(g), int(bb))
            acc[0] += L * int(k)
            acc[1] += A * int(k)
            acc[2] += B * int(k)
            n += int(k)
    lab = (acc[0] / n, acc[1] / n, acc[2] / n) if n else (0.0, 0.0, 0.0)
    return lab, (box_hit / box_n if box_n else 0.0)


def coat_leak(var: list[Image.Image], base: list[Image.Image]) -> int:
    """Most repainted pixels in any one frame whose base L* is > LEAK_DL above that frame's median repainted base L*."""
    worst = 0
    for v, b in zip(var, base):
        vp, bp = np.asarray(v, dtype=np.int16), np.asarray(b, dtype=np.int16)
        hit = (vp[..., 3] >= 64) & (vp[..., :3] != bp[..., :3]).any(axis=-1)
        if not hit.any():
            continue
        Ls = np.array([_lab(int(r), int(g), int(bb))[0] for r, g, bb in bp[hit][:, :3]])
        worst = max(worst, int((Ls > float(np.median(Ls)) + LEAK_DL).sum()))
    return worst


def coat_variant_check() -> tuple[list[dict], list[dict], list[str]]:
    reports, rows, fails = [], [], []
    for name, (path, size) in VARIANTS.items():
        rep = inspect(name, path, size)
        reports.append(rep)
        fails.extend(f"{name}: {m}" for m in rep["failures"])
    for s in LEGACY_IDS:
        base = {k: SHEETS[f"{s}-{k}"][0] for k in KINDS}
        if not all(p.exists() for p in base.values()):
            continue
        bgrid = {k: cells(Image.open(base[k]).convert("RGBA"), 4 if k == "walk" else 2) for k in KINDS}
        for c, tgt in COATS.items():
            paths = {k: VARIANTS[f"{s}-{c}-{k}"][0] for k in KINDS}
            if not all(p.exists() for p in paths.values()):
                fails.append(f"{s}-{c}: missing coat sheet(s) {[k for k, p in paths.items() if not p.exists()]}")
                continue
            same_shape = True
            for k in KINDS:
                a = Image.open(paths[k]).convert("RGBA").getchannel("A").tobytes()
                b = Image.open(base[k]).convert("RGBA").getchannel("A").tobytes()
                if a != b:
                    same_shape = False
                    fails.append(f"{s}-{c}-{k}: silhouette differs from the {s}'s own {k} sheet — a coat is a recolour, not a new shape")
            if not same_shape:
                continue
            vgrid = {k: cells(Image.open(paths[k]).convert("RGBA"), 4 if k == "walk" else 2) for k in KINDS}
            poses = {
                "idle": ([f for r in vgrid["idle"] for f in r], [f for r in bgrid["idle"] for f in r]),
                "walk front": (vgrid["walk"][0], bgrid["walk"][0]),
                "walk left": (vgrid["walk"][1], bgrid["walk"][1]),
                "walk right": (vgrid["walk"][2], bgrid["walk"][2]),
                "side left": (vgrid["idle-side"][0], bgrid["idle-side"][0]),
                "side right": (vgrid["idle-side"][1], bgrid["idle-side"][1]),
            }
            coat = {}
            rec = {"scout": s, "coat": c, "shift": {}, "share": {}, "hueGap": {}, "deltaH": {}, "leak": {}}
            for p, (v, bf) in poses.items():
                shift = math.dist(torso_lab(v), torso_lab(bf))
                lab, share = coat_pixels(v, bf)
                coat[p] = lab
                gap = _hue_gap(_hue_deg(lab), tgt["h"])
                rec["shift"][p], rec["share"][p], rec["hueGap"][p] = round(shift, 1), round(share, 2), round(gap, 1)
                if shift < MIN_COAT_SHIFT or share < MIN_COAT_SHARE:
                    fails.append(f"{s}-{c}: {p} doesn't show the coat (torso ΔE {shift:.1f}, {share:.0%} repainted; need {MIN_COAT_SHIFT} and {MIN_COAT_SHARE:.0%})")
                elif gap > MAX_TARGET_HUE:
                    fails.append(f"{s}-{c}: {p} coat hue is {gap:.0f}° off {tgt['name']}")
                leak = coat_leak(v, bf)
                rec["leak"][p] = leak
                if leak > MAX_LEAK:
                    fails.append(f"{s}-{c}: {p} coat colour on fur ({leak} light pixels repainted in one frame > {MAX_LEAK})")
            for p, ref in (("walk front", "idle"), ("walk left", "idle"), ("walk right", "idle"), ("side left", "walk left"), ("side right", "walk right")):
                d = delta_h(coat[ref], coat[p])
                rec["deltaH"][p] = round(d, 2)
                if d > MAX_VARIANT_DH:
                    fails.append(f"{s}-{c}: {p} coat differs from the {ref} (ΔH {d:.1f} > {MAX_VARIANT_DH}) — one coat per outfit")
            rows.append(rec)
    return reports, rows, fails


def silhouette(path: Path) -> str:
    im = Image.open(path).convert("RGBA")
    return md5(im.getchannel("A").point(lambda v: 255 if v >= 128 else 0).tobytes()).hexdigest()


def inspect(name: str, path: Path, size: tuple[int, int]) -> dict:
    failures: list[str] = []
    if not path.exists():
        return {"name": name, "file": str(path), "ok": False, "failures": ["missing"]}
    raw = path.read_bytes()
    im = Image.open(path).convert("RGBA")
    digest = md5(raw).hexdigest()
    if im.size != size:
        failures.append(f"size {im.size} != {size}")
    mag = magenta_count(im)
    if mag > MAX_MAGENTA:
        failures.append(f"magenta {mag}px")
    specks = speck_count(im)
    if specks > MAX_SPECKS:
        failures.append(f"dropout specks {specks}")
    corner = corner_alpha(im)
    if corner > MAX_CORNER_A:
        failures.append(f"opaque corner alpha {corner}")
    w, h = im.size
    opaque = int((np.asarray(im.getchannel("A")) > 200).sum())
    if opaque / (w * h) > 0.88:
        failures.append(f"sheet {opaque / (w * h):.0%} opaque — leftover background?")
    return {
        "name": name,
        "file": str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),
        "md5": digest,
        "size": list(im.size),
        "magenta": mag,
        "specks": specks,
        "cornerA": corner,
        "ok": not failures,
        "failures": failures,
    }



# ── 0.0.83 v2 sheets ─────────────────────────────────────────────────────
V2_CELL, V2_COLS, V2_ROWS = 192, 8, 6
V2_WALK_FRAMES = 8
# idle facing -> (row, first col, frames): the 3/4 front idle is 8 frames; side idles 4. No up idle (stopping
# after walking up shows the front idle).
V2_IDLE_CELLS = {"down": (4, 0, 8), "left": (5, 0, 4), "right": (5, 4, 4)}
MAX_V2_FOOT_SPREAD = 3      # floor line wobble inside one walk row (192 px cells)
MAX_V2_FOOT_SPREAD_FB = 4   # front/back rows: the foot stepping toward the viewer lands ~3 px lower, by design
MAX_V2_CROSS_FOOT = 4       # floor difference between facings, and idle vs walk
MAX_V2_HEAD_DRIFT = 6       # head x range inside one walk row (front sway is ~1 px; the rest is the lean)
MAX_V2_IDLE_HEAD = 3
MIN_V2_COAT_SHARE = 0.12    # every frame shows the coat
MAX_V2_COAT_WOBBLE = 0.25   # coat pixel count vs the row median (a frame that loses the coat layer)
MAX_V2_MASK_HUE = 14.0      # median hue gap between masked base pixels and the default coat
MIN_V2_MASK_FIT = 0.75      # share of masked pixels painted as the default coat (true mask ~0.87; mask over the whole body ~0.49)
MAX_V2_TARGET_HUE = 20.0


def _sprite_rig():
    import importlib.util
    spec = importlib.util.spec_from_file_location("sprite_rig", ROOT / "scripts" / "sprite-rig.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _sprite_holes():
    import importlib.util
    spec = importlib.util.spec_from_file_location("sprite_holes", ROOT / "scripts" / "sprite-holes.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# 0.0.89 interior alpha holes (scripts/sprite-holes.py): see-through gaps inside a frame's silhouette, >= 4 px each,
# in every frame of every view. Every v2 scout must have none (the rig's `underpaint` backs the joints).


def _hue_arr(rgb: np.ndarray, rig) -> tuple[np.ndarray, np.ndarray]:
    lab = rig.to_lab(rgb.astype(np.float64))
    return (np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) + 360) % 360, np.hypot(lab[..., 1], lab[..., 2])


def _gap(h: np.ndarray, t: float) -> np.ndarray:
    return np.abs((h - t + 180) % 360 - 180)


def v2_check() -> tuple[list[dict], list[str]]:
    rows, fails = [], []
    if not V2_IDS:
        return rows, fails
    rig = _sprite_rig()
    holes_mod = _sprite_holes()
    for s in V2_IDS:
        bp, mp = V2_SHEETS[s]["base"], V2_SHEETS[s]["mask"]
        size = (V2_COLS * V2_CELL, V2_ROWS * V2_CELL)
        rep = inspect(f"{s}-v2", bp, size)
        fails.extend(f"{s}-v2: {m}" for m in rep["failures"])
        if not bp.exists() or not mp.exists():
            if not mp.exists():
                fails.append(f"{s}-v2-coat: missing")
            rows.append({"scout": s, "ok": False})
            continue
        base_img = Image.open(bp).convert("RGBA")
        mask_img = Image.open(mp).convert("L")
        if mask_img.size != size:
            fails.append(f"{s}-v2-coat: size {mask_img.size} != {size}")
            rows.append({"scout": s, "ok": False})
            continue
        base = np.asarray(base_img)
        mask = np.asarray(mask_img)
        alpha = base[..., 3]
        default = json.loads((ROOT / "scripts" / "sprite-redraw" / s / "rig.json").read_text())["default_coat"]
        rec: dict = {"scout": s, "base": str(bp.relative_to(ROOT)) if bp.is_relative_to(ROOT) else str(bp)}
        stray = int(((mask > 0) & (alpha == 0)).sum())
        if stray:
            fails.append(f"{s}-v2-coat: {stray}px of coat where the sheet is empty")

        def cell(c: int, r: int) -> tuple[Image.Image, np.ndarray, np.ndarray]:
            box = (c * V2_CELL, r * V2_CELL, (c + 1) * V2_CELL, (r + 1) * V2_CELL)
            return base_img.crop(box), base[box[1]:box[3], box[0]:box[2]], mask[box[1]:box[3], box[0]:box[2]]

        used = set()
        walk_rows = []
        for r in range(4):
            heads, feet, coat_px, edges = [], [], [], 0
            for c in range(V2_WALK_FRAMES):
                used.add((c, r))
                f, px, m = cell(c, r)
                bb = solid_bbox(f)
                if not bb:
                    fails.append(f"{s}-v2 walk row {r} frame {c}: empty")
                    continue
                heads.append(head_cx(f))
                feet.append(bb[3])
                edges += edge_touch(f)
                op = px[..., 3] > 200
                coat_px.append(int(((m > 127) & op).sum()))
                share = coat_px[-1] / max(1, int(op.sum()))
                if share < MIN_V2_COAT_SHARE:
                    fails.append(f"{s}-v2 walk row {r} frame {c}: coat covers {share:.0%} of the body (< {MIN_V2_COAT_SHARE:.0%})")
            if not feet:
                continue
            drift = max(heads) - min(heads)
            med = sorted(coat_px)[len(coat_px) // 2]
            wobble = max(abs(n - med) / max(med, 1) for n in coat_px)
            walk_rows.append({"row": r, "headDrift": round(drift, 1), "feet": feet, "coatWobble": round(wobble, 3), "edgePx": edges})
            if drift > MAX_V2_HEAD_DRIFT:
                fails.append(f"{s}-v2 walk row {r}: body drifts {drift:.1f}px across the stride")
            if max(feet) - min(feet) > (MAX_V2_FOOT_SPREAD_FB if r in (0, 3) else MAX_V2_FOOT_SPREAD):
                fails.append(f"{s}-v2 walk row {r}: floor wobbles {feet}")
            if edges:
                fails.append(f"{s}-v2 walk row {r}: {edges}px touch the cell edge (cut off)")
            if wobble > MAX_V2_COAT_WOBBLE:
                fails.append(f"{s}-v2 walk row {r}: coat area jumps {wobble:.0%} between frames")
        floors = [sorted(x["feet"])[len(x["feet"]) // 2] for x in walk_rows]
        if floors and max(floors) - min(floors) > MAX_V2_CROSS_FOOT:
            fails.append(f"{s}-v2 walk: facings stand on different floors {floors} (turn jump)")
        idle_rows = []
        for face, (r, c0, n) in V2_IDLE_CELLS.items():
            heads, feet = [], []
            for i in range(n):
                used.add((c0 + i, r))
                f, px, m = cell(c0 + i, r)
                bb = solid_bbox(f)
                if not bb:
                    fails.append(f"{s}-v2 idle {face} frame {i}: empty")
                    continue
                heads.append(head_cx(f))
                feet.append(bb[3])
                if edge_touch(f):
                    fails.append(f"{s}-v2 idle {face} frame {i}: touches the cell edge (cut off)")
            if not feet:
                continue
            idle_rows.append({"face": face, "headDrift": round(max(heads) - min(heads), 1), "floor": max(feet)})
            if max(heads) - min(heads) > MAX_V2_IDLE_HEAD:
                fails.append(f"{s}-v2 idle {face}: head jumps {max(heads) - min(heads):.1f}px")
            if floors and abs(max(feet) - sum(floors) / len(floors)) > MAX_V2_CROSS_FOOT:
                fails.append(f"{s}-v2 idle {face}: floor {max(feet)} vs walk {floors} (hop on stop/start)")
        for r in range(V2_ROWS):
            for c in range(V2_COLS):
                if (c, r) not in used and cell(c, r)[1][..., 3].any():
                    fails.append(f"{s}-v2: paint in unused cell col {c} row {r}")
        holes = holes_mod.scout_holes(s, bp)
        n_holes, hole_px = len(holes), sum(h["area"] for h in holes)
        rec["holes"] = {"count": n_holes, "px": hole_px, "list": holes}
        if n_holes:
            worst = sorted(holes, key=lambda h: -h["area"])[:3]
            where = "; ".join(f"{h['view']} frame {h['frame']} {h['area']}px at ({h['x']},{h['y']})" for h in worst)
            fails.append(f"{s}-v2: {n_holes} see-through holes, {hole_px}px: {where}")
        rec["walkRows"] = walk_rows
        rec["idle"] = idle_rows
        # The mask must sit on the coat the base sheet wears (default colour), not on shell, belly or skin.
        full = (mask >= 238) & (alpha > 200)
        hue, chroma = _hue_arr(base[full][:, :3], rig)
        mask_gap = float(np.median(_gap(hue, default["h"]))) if full.any() else 999.0
        # The base coat is painted to a model (default hue, chroma easing off with lightness); shell, belly, skin
        # and boots are not, even where they are brown too. Most masked pixels must fit that model.
        lab = rig.to_lab(base[full][:, :3].astype(np.float64))
        model = default["C"] * np.clip(lab[:, 0] / default["L"], 0.5, 1.2)
        fit = float(((_gap(hue, default["h"]) <= 10) & (np.abs(chroma - model) <= 6)).mean()) if full.any() else 0.0
        rec["maskHueGap"] = round(mask_gap, 2)
        rec["maskFit"] = round(fit, 3)
        if mask_gap > MAX_V2_MASK_HUE or fit < MIN_V2_MASK_FIT:
            fails.append(f"{s}-v2-coat: masked pixels are not the base coat (hue gap {mask_gap:.1f}°, {fit:.0%} painted as the coat < {MIN_V2_MASK_FIT:.0%})")
        # Every print-shop coat and dye: only masked pixels change, the coat lands on the target hue.
        variants = []
        for cid, tgt in COATS.items():
            out = rig.apply_coat(base, mask, tgt, default)
            changed_off = int((np.any(out != base, -1) & (mask == 0)).sum())
            alpha_diff = int((out[..., 3] != base[..., 3]).sum())
            h2, _ = _hue_arr(out[full][:, :3], rig)
            tgt_gap = float(np.median(_gap(h2, tgt["h"]))) if full.any() else 999.0
            variants.append({"coat": cid, "offMask": changed_off, "targetHueGap": round(tgt_gap, 2)})
            if changed_off:
                fails.append(f"{s}-v2 {cid}: coat colour on fur/shell ({changed_off}px outside the coat mask changed)")
            if alpha_diff:
                fails.append(f"{s}-v2 {cid}: recolour changed the silhouette ({alpha_diff}px)")
            if tgt_gap > MAX_V2_TARGET_HUE:
                fails.append(f"{s}-v2 {cid}: coat misses the catalogue hue (median gap {tgt_gap:.1f}° > {MAX_V2_TARGET_HUE})")
        rec["variants"] = variants
        icon = ICONS.get(s)
        if icon and icon.exists():
            ic = np.asarray(Image.open(icon).convert("RGBA"))
            d = delta_h(torso_lab([Image.fromarray(ic)]), torso_lab([cell(V2_IDLE_CELLS["down"][1], V2_IDLE_CELLS["down"][0])[0]]))
            rec["iconDeltaH"] = round(d, 2)
            if d > MAX_COAT_DH:
                fails.append(f"{s}: shop icon coat differs from the v2 idle (ΔH {d:.1f} > {MAX_COAT_DH})")
        rows.append(rec)
    return rows, fails

def main() -> int:
    reports = [inspect(name, path, size) for name, (path, size) in SHEETS.items()]
    failures = []
    for r in reports:
        for msg in r["failures"]:
            failures.append(f"{r['name']}: {msg}")
    by_hash: dict[str, list[str]] = {}
    for r in reports:
        if r.get("md5"):
            by_hash.setdefault(r["md5"], []).append(r["name"])
    for digest, names in by_hash.items():
        if len(names) > 1:
            failures.append(f"duplicate sheet {digest[:8]}: {', '.join(names)}")
    frames = []
    scouts = LEGACY_IDS
    for scout in scouts:
        ip, wp = SHEETS[f"{scout}-idle"][0], SHEETS[f"{scout}-walk"][0]
        if not (ip.exists() and wp.exists()):
            continue
        rep, fails = registration(scout, ip, wp)
        frames.append(rep)
        failures.extend(fails)
    warnings: list[str] = []
    shapes, shape_fails, shape_warns = shape_check()
    failures.extend(shape_fails)
    warnings.extend(shape_warns)
    palettes, palette_fails = palette_check()
    failures.extend(palette_fails)
    sides, side_fails = side_idle_check()
    failures.extend(side_fails)
    coat_sheets, coat_rows, coat_fails = coat_variant_check()
    failures.extend(coat_fails)
    v2_rows, v2_fails = v2_check()
    failures.extend(v2_fails)
    verdict = {
        "ok": not failures,
        "sheets": reports,
        "frames": frames,
        "shapes": sorted(shapes, key=lambda r: -r["iou"])[:6],
        "palettes": palettes,
        "sideIdles": sides,
        "coatSheets": len(coat_sheets),
        "coats": coat_rows,
        "v2": v2_rows,
        "failures": failures,
        "warnings": warnings,
    }
    print(json.dumps(verdict, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
