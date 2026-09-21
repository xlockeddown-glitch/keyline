#!/usr/bin/env python3
"""Measure hire-plate PNGs for shared background chrome and chroma leaks."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


def plate(path: Path) -> dict:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    inset = 4
    corners = [
        px[inset, inset],
        px[w - 1 - inset, inset],
        px[inset, h - 1 - inset],
        px[w - 1 - inset, h - 1 - inset],
    ]
    magenta = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200 and r > 200 and b > 200 and g < 90:
                magenta += 1
    mean = [sum(c[i] for c in corners) / 4 for i in range(3)]
    return {
        "file": path.name,
        "w": w,
        "h": h,
        "corners": [list(c) for c in corners],
        "cornerMean": [round(v, 1) for v in mean],
        "magenta": magenta,
        "pixels": w * h,
    }


def main() -> int:
    paths = [Path(p) for p in sys.argv[1:]]
    if not paths:
        print(json.dumps({"ok": False, "failures": ["no plates"]}))
        return 1
    plates = [plate(p) for p in paths]
    failures: list[str] = []
    sizes = {(p["w"], p["h"]) for p in plates}
    if len(sizes) > 1:
        failures.append(f"hire tiles are not one size: {sorted(sizes)}")
    for p in plates:
        if p["pixels"] and p["magenta"] / p["pixels"] > 0.004:
            failures.append(f"{p['file']} still has chroma magenta ({p['magenta']} px)")
    means = [p["cornerMean"] for p in plates]
    global_mean = [sum(m[i] for m in means) / len(means) for i in range(3)]
    for p in plates:
        dist = max(abs(p["cornerMean"][i] - global_mean[i]) for i in range(3))
        if dist > 28:
            failures.append(
                f"{p['file']} background {p['cornerMean']} drifts from set { [round(v,1) for v in global_mean] }"
            )
    print(json.dumps({"ok": not failures, "plates": plates, "failures": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
