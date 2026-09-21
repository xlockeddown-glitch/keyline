#!/usr/bin/env python3
"""Deterministic scout idle/walk sheet QA: holes, magenta, alpha, identity."""
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
    verdict = {"ok": not failures, "sheets": reports, "failures": failures}
    print(json.dumps(verdict, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
