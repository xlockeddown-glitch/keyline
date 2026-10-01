#!/usr/bin/env python3
"""Deterministic scout idle/walk sheet QA: holes, magenta, alpha, identity,
plus per-frame registration (walk drift, floor line per facing, idle jumps,
idle-to-walk floor match, pixels touching a cell edge)."""
from __future__ import annotations

import json
import sys
from hashlib import md5
from pathlib import Path

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
}

MAX_SPECKS = 8
MAX_MAGENTA = 0
MAX_CORNER_A = 16


def speck_count(im: Image.Image) -> int:
    w, h = im.size
    px = im.load()
    n = 0
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if px[x, y][3] >= 16:
                continue
            enclosed = True
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    if px[x + dx, y + dy][3] < 200:
                        enclosed = False
                        break
                if not enclosed:
                    break
            if enclosed:
                n += 1
    return n


def magenta_count(im: Image.Image) -> int:
    w, h = im.size
    px = im.load()
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200 and r > 200 and b > 200 and g < 90:
                n += 1
    return n


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


def silhouette(path: Path) -> str:
    im = Image.open(path).convert("RGBA")
    return md5(im.getchannel("A").point(lambda v: 255 if v >= 128 else 0).tobytes()).hexdigest()


def inspect(name: str, path: Path, size: tuple[int, int]) -> dict:
    failures: list[str] = []
    if not path.exists():
        return {"name": name, "file": str(path.relative_to(ROOT)), "ok": False, "failures": ["missing"]}
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
    opaque = 0
    w, h = im.size
    px = im.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 200:
                opaque += 1
    if opaque / (w * h) > 0.88:
        failures.append(f"sheet {opaque / (w * h):.0%} opaque — leftover background?")
    return {
        "name": name,
        "file": str(path.relative_to(ROOT)),
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
    scouts = sorted({n.rsplit("-", 1)[0] for n in SHEETS})
    for scout in scouts:
        ip, wp = SHEETS[f"{scout}-idle"][0], SHEETS[f"{scout}-walk"][0]
        if not (ip.exists() and wp.exists()):
            continue
        rep, fails = registration(scout, ip, wp)
        frames.append(rep)
        failures.extend(fails)
    # Same alpha mask on two scouts = a recolour, not a distinct character (warning only).
    warnings = []
    by_shape: dict[str, list[str]] = {}
    for name, (path, _) in SHEETS.items():
        if path.exists():
            by_shape.setdefault(silhouette(path), []).append(name)
    for names in by_shape.values():
        if len(names) > 1:
            warnings.append(f"same silhouette (recolour): {', '.join(names)}")
    verdict = {"ok": not failures, "sheets": reports, "frames": frames, "failures": failures, "warnings": warnings}
    print(json.dumps(verdict, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
