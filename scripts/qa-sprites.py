#!/usr/bin/env python3
"""Deterministic scout idle/walk sheet QA: holes, magenta, alpha, identity,
plus per-frame registration (walk drift, floor line per facing, idle jumps,
idle-to-walk floor match, pixels touching a cell edge), and since 0.0.37:
  * distinct silhouettes — two characters whose alpha masks overlap too much fail (a recolour is not a character);
  * one palette — a character's walk and idle coats must be the same colour (the Tabby walked in green, idled in brown);
  * side idles — the stand-still-facing-left/right sheets sit on the walk floor and don't jump;
and since 0.0.38 the coat check is per facing (front, left, right) and covers the shop icon, with a
tighter limit (the Turtle walked in a bare shell at ΔH 3.6–4.1 and slipped under the old 5.5).
Since 0.0.45 it also checks every print-shop coat variant (public/sprites/coats/<scout>-<coat>-<kind>.png):
  * same sheet hygiene as the base sheets (size, magenta, specks, corners, leftover background);
  * the alpha channel is the base sheet's, byte for byte — a coat is a recolour, never a new silhouette;
  * every pose shows the coat: idle, walk front/left/right and both side idles each move the torso colour
    off the character's own coat (ΔE) and onto the catalogue hue (scripts/coat-variants.json);
  * one coat per outfit: walk facings and side idles match the idle coat (ΔH), like the base sheets.
KEYLINE_SPRITE_OVERRIDE="name=path,..." swaps sheets in for the self-tests."""
from __future__ import annotations

import itertools
import json
import math
import os
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
    # Side idles: 2x2 @ 96 — row 0 faces left, row 1 faces right.
    "raccoon-idle-side": (SPR / "player-idle-side.png", (192, 192)),
    "cat-idle-side": (SCOUTS / "cat-idle-side.png", (192, 192)),
    "corgi-idle-side": (SCOUTS / "corgi-idle-side.png", (192, 192)),
    "fox-idle-side": (SCOUTS / "fox-idle-side.png", (192, 192)),
    "lynx-idle-side": (SCOUTS / "lynx-idle-side.png", (192, 192)),
    "owl-idle-side": (SCOUTS / "owl-idle-side.png", (192, 192)),
    "sloth-idle-side": (SCOUTS / "sloth-idle-side.png", (192, 192)),
    "turtle-idle-side": (SCOUTS / "turtle-idle-side.png", (192, 192)),
}
# Shop icons (one 96 px idle-style portrait each); checked against the idle coat, not inspected as sheets.
ICONS = {s: SCOUTS / f"{s}.png" for s in ["raccoon", "cat", "corgi", "fox", "lynx", "owl", "sloth", "turtle"]}
SCOUT_IDS = ["raccoon", "cat", "corgi", "fox", "lynx", "owl", "sloth", "turtle"]
KINDS = ["idle", "walk", "idle-side"]

# 0.0.45 print-shop coats: one recoloured walk / idle / side-idle set per character per coat.
COATS = json.loads((ROOT / "scripts" / "coat-variants.json").read_text())["coats"]
COAT_DIR = SPR / "coats"
VARIANTS = {
    f"{s}-{c}-{k}": (COAT_DIR / f"{s}-{c}-{k}.png", SHEETS[f"{s}-{k}"][1]) for s in SCOUT_IDS for c in COATS for k in KINDS
}

for _pair in filter(None, os.environ.get("KEYLINE_SPRITE_OVERRIDE", "").split(",")):
    _name, _path = _pair.split("=", 1)
    if _name.endswith("-icon"):
        ICONS[_name[:-5]] = (ROOT / _path).resolve()
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
        masks = {s: mask(SHEETS[f"{s}-{kind}"][0]) for s in SCOUT_IDS if SHEETS[f"{s}-{kind}"][0].exists()}
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
    for s in SCOUT_IDS:
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
    for s in SCOUT_IDS:
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


def coat_variant_check() -> tuple[list[dict], list[dict], list[str]]:
    reports, rows, fails = [], [], []
    for name, (path, size) in VARIANTS.items():
        rep = inspect(name, path, size)
        reports.append(rep)
        fails.extend(f"{name}: {m}" for m in rep["failures"])
    for s in SCOUT_IDS:
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
            rec = {"scout": s, "coat": c, "shift": {}, "share": {}, "hueGap": {}, "deltaH": {}}
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
    scouts = SCOUT_IDS
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
    verdict = {
        "ok": not failures,
        "sheets": reports,
        "frames": frames,
        "shapes": sorted(shapes, key=lambda r: -r["iou"])[:6],
        "palettes": palettes,
        "sideIdles": sides,
        "coatSheets": len(coat_sheets),
        "coats": coat_rows,
        "failures": failures,
        "warnings": warnings,
    }
    print(json.dumps(verdict, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
