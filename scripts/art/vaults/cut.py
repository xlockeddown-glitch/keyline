#!/usr/bin/env python3
"""Cut the six street-vault tiers and the Hearth from the approved Gemini mocks.

Source:
  /home/box/keyline-art/vault-tiers-arv-v2.jpeg  (2048x2048, 3x3)
    row1 + row2: amber, red, violet (duplicates; pick the cleaner of each)
    row3: white, blue, green
  /home/box/keyline-art/hearth-v1.jpeg

Method mirrors the 0.1.159 comet matte:
  rembg isnet-general-use core + colour-to-alpha against a locally sampled cream plate,
  un-mix the cream out of partial-alpha edges, drop the painted ground shadow
  (the map keeps its own shared contact-shadow ellipse).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
from scipy import ndimage as ndi

SRC_TIERS = Path("/home/box/keyline-art/vault-tiers-arv-v2.jpeg")
SRC_HEARTH = Path("/home/box/keyline-art/hearth-v1.jpeg")
WORK = Path("/home/box/keyline-art/work/vaults")
SHOTS = Path("/home/box/keyline-art/shots/vaults")
OUT = Path("/workspace/keyline-vaults/public/sprites/vaults")
WORK.mkdir(parents=True, exist_ok=True)
SHOTS.joinpath("closeups").mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

# Mid-gutter splits from density projections of the 2048 plate.
XS = [0, 751, 1387, 2048]
YS = [0, 717, 1337, 2048]
GRID = {
    "amber1": (0, 0),
    "red1": (0, 1),
    "violet1": (0, 2),
    "amber2": (1, 0),
    "red2": (1, 1),
    "violet2": (1, 2),
    "white": (2, 0),
    "blue": (2, 1),
    "green": (2, 2),
}

# Plate cream, measured from the corners of both mocks.
BG = np.array([239.0, 233.0, 222.0])


def save(im: Image.Image, path: Path, **kw) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, **kw)
    print("wrote", path, im.size, im.mode)


def crop_cell(sheet: np.ndarray, r: int, c: int, pad: int = 8) -> tuple[np.ndarray, tuple[int, int, int, int]]:
    y0, y1 = YS[r], YS[r + 1]
    x0, x1 = XS[c], XS[c + 1]
    y0 = max(0, y0 - pad)
    x0 = max(0, x0 - pad)
    y1 = min(sheet.shape[0], y1 + pad)
    x1 = min(sheet.shape[1], x1 + pad)
    return sheet[y0:y1, x0:x1].copy(), (x0, y0, x1, y1)


def rembg_mask(rgb: Image.Image, name: str, session) -> np.ndarray:
    from rembg import remove

    path = WORK / f"{name}-mask.png"
    if path.exists():
        return np.asarray(Image.open(path)).astype(np.float32) / 255.0
    m = remove(rgb, session=session, only_mask=True)
    if m.mode != "L":
        m = m.convert("L")
    m.save(path)
    print("mask", name, flush=True)
    return np.asarray(m).astype(np.float32) / 255.0


def matte(name: str, rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Return an RGBA uint8 cut of this vault, tightly boxed, shadow dropped."""
    C = rgb.astype(np.float32)
    M = mask
    if M.ndim == 3:
        M = M[..., 0]
    H, W, _ = C.shape
    d0 = np.sqrt(((C - BG) ** 2).sum(-1))
    # Local plate sample from near-bg pixels clearly outside the rembg mask.
    samp = (M < 0.04) & (d0 < 16)
    s = 4
    Cs = C[::s, ::s]
    ws = samp[::s, ::s].astype(np.float32)
    num = np.stack([ndi.gaussian_filter(Cs[..., c] * ws, 18) for c in range(3)], -1)
    den = ndi.gaussian_filter(ws, 18)[..., None]
    Bs = np.where(den > 0.02, num / np.maximum(den, 1e-6), BG)
    B = np.stack(
        [np.asarray(Image.fromarray(Bs[..., c].astype(np.float32)).resize((W, H), Image.BICUBIC)) for c in range(3)],
        -1,
    )
    D = C - B
    d = np.sqrt((D ** 2).sum(-1))
    lum = C.mean(-1)
    lB = B.mean(-1)
    sat = C.max(-1) - C.min(-1)

    dead = 5.0
    Dz = np.sign(D) * np.maximum(np.abs(D) - dead, 0)
    c2a = np.where(Dz > 0, Dz / np.maximum(255 - B, 8), -Dz / np.maximum(B, 8)).max(-1)
    # White wood is close to the plate: do not boost pale pixels; trust the rembg core.
    a_fx = np.clip(c2a, 0, 1)

    # Solid body: rembg core, eroded a little, far from the plate. Keep the hanging ring
    # as a second component (small, above the body) by being gentle with size filters.
    solid = ndi.binary_erosion(M > 0.55, iterations=2) & (d > 18)
    # For the very pale white vault, colour distance is small on the lit face — fall back to rembg.
    pale_face = (lum > 200) & (sat < 45) & (M > 0.7)
    solid = solid | ndi.binary_erosion(pale_face, iterations=1)
    solid = ndi.binary_closing(solid, structure=np.ones((5, 5)))
    solid = ndi.binary_opening(solid, structure=np.ones((3, 3)))
    lab, n = ndi.label(solid)
    if n:
        sz = ndi.sum(solid, lab, range(1, n + 1))
        # Keep the big body and any reasonably sized blob (the ring + stem).
        keep_ids = 1 + np.flatnonzero(np.array(sz) >= 40)
        solid = np.isin(lab, keep_ids)
    core = ndi.binary_erosion(solid, iterations=1)
    a = np.maximum(a_fx, core.astype(np.float32))
    # Inside a slightly dilated rembg mask, prefer the mask where colour-to-alpha is shaky.
    a = np.maximum(a, (M > 0.85).astype(np.float32))

    # Painted cast shadow: darker, low-sat, in the lower/right ground band, not on the body.
    ys, xs = np.nonzero(solid)
    if len(ys):
        y_lo, y_hi = ys.min(), ys.max()
        x_lo, x_hi = xs.min(), xs.max()
        rows = np.arange(H)[:, None] >= y_lo + 0.52 * (y_hi - y_lo)
        cols = np.arange(W)[None, :] >= x_lo + 0.45 * (x_hi - x_lo)
        kk = np.clip(lum / np.maximum(lB, 1), 0, 1)
        resid = np.sqrt(((C - kk[..., None] * B) ** 2).sum(-1))
        near = ndi.binary_dilation(solid, iterations=2)
        shade = rows & cols & (~near) & (lum < lB - 4) & (sat < 40) & (kk > 0.45)
        shade |= rows & (~solid) & (lum < lB - 4) & (resid < 18) & (kk > 0.5) & (sat < 45)
        # Also drop soft shadow still inside a weak rembg fringe.
        shade |= rows & cols & (M < 0.6) & (lum < lB - 3) & (sat < 35) & (~ndi.binary_erosion(solid, iterations=0) | True)
        shade &= ~core
        a = np.where(shade, 0, a)

    # Drop crumbs and plate-touching slivers.
    lab, n = ndi.label(a > 0.06)
    if n:
        sz = ndi.sum(a > 0.06, lab, range(1, n + 1))
        keep = np.isin(lab, 1 + np.flatnonzero(np.array(sz) >= 30))
        a = a * ndi.binary_dilation(keep, iterations=1)
    a[a < 0.02] = 0

    # Un-mix the cream from partial-alpha edge pixels.
    ae = np.maximum(a, 1e-3)[..., None]
    F = np.where(a[..., None] > 0.97, C, np.clip(B + D / ae, 0, 255))

    # Defringe: partial-alpha pixels whose colour is still plate cream.
    Fl = F.mean(-1)
    Fs = F.max(-1) - F.min(-1)
    creamy = (np.sqrt(((F - B) ** 2).sum(-1)) < 40) | ((Fl > 180) & (Fs < 50))
    fr = (~core) & (a < 0.88) & (creamy | (Fl > 205))
    # Don't eat the white vault's pale wood: if rembg says it's solid, keep it.
    fr &= ~((M > 0.8) & (name.startswith("white") or "white" in name))
    if "white" in name:
        fr &= ~(M > 0.75)
    a = np.where(fr, 0, a)
    a[a < 0.02] = 0
    F = np.where(a[..., None] == 0, 0, F)
    rgba = np.dstack([F, a * 255]).round().clip(0, 255).astype(np.uint8)

    ys, xs = np.nonzero(a > 0.05)
    if len(xs) == 0:
        raise SystemExit(f"{name}: empty matte")
    m = 8
    box = (
        int(max(xs.min() - m, 0)),
        int(max(ys.min() - m, 0)),
        int(min(xs.max() + m + 1, W)),
        int(min(ys.max() + m + 1, H)),
    )
    cut = Image.fromarray(rgba, "RGBA").crop(box)
    save(cut, WORK / f"{name}-cut.png")
    # also stash the full RGBA for debugging
    Image.fromarray(rgba, "RGBA").save(WORK / f"{name}-rgba.png")
    return np.asarray(cut)


def quality_score(rgba: np.ndarray, name: str) -> dict:
    """Higher is cleaner: tight alpha, little cream fringe, sharp interior."""
    a = rgba[..., 3].astype(np.float32) / 255.0
    rgb = rgba[..., :3].astype(np.float32)
    H, W = a.shape
    edge = (a > 0.08) & (a < 0.9)
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    cream = edge & (np.sqrt(((rgb - BG) ** 2).sum(-1)) < 45)
    # Sharpness on the opaque core
    core = a > 0.95
    if core.any():
        gy = np.abs(np.diff(lum, axis=0, prepend=lum[:1]))
        gx = np.abs(np.diff(lum, axis=1, prepend=lum[:, :1]))
        sharp = float((gy + gx)[core].mean())
    else:
        sharp = 0.0
    # leftover halo: mid-alpha creamy ring
    halo = float(cream.mean())
    # leftover soft shadow: dark low-sat mid-alpha in the lower right
    ys, xs = np.nonzero(a > 0.05)
    shadow = 0.0
    if len(ys):
        lowright = (np.arange(H)[:, None] > ys.min() + 0.6 * (ys.max() - ys.min())) & (
            np.arange(W)[None, :] > xs.min() + 0.55 * (xs.max() - xs.min())
        )
        sh = lowright & (a > 0.05) & (a < 0.7) & (lum < 180) & (sat < 30)
        shadow = float(sh.mean())
    score = sharp * 2.0 - halo * 200 - shadow * 150
    stats = {
        "name": name,
        "size": [int(W), int(H)],
        "sharp": round(sharp, 3),
        "halo": round(halo, 5),
        "shadow": round(shadow, 5),
        "score": round(score, 3),
        "alpha_mean": round(float(a.mean()), 4),
    }
    print("score", stats)
    return stats


def composite_preview(cut: Image.Image, name: str, dest: Path) -> None:
    """Dark / map-green / checker previews, plus a 4x close-up of the edge."""
    w, h = cut.size
    # backgrounds
    dark = Image.new("RGBA", (w + 40, h + 40), (18, 20, 24, 255))
    green = Image.new("RGBA", (w + 40, h + 40), (36, 72, 48, 255))
    chk = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    tile = 12
    px = chk.load()
    for y in range(chk.size[1]):
        for x in range(chk.size[0]):
            on = ((x // tile) + (y // tile)) % 2 == 0
            px[x, y] = (70, 70, 76, 255) if on else (28, 28, 32, 255)
    for bg, tag in ((dark, "dark"), (green, "green"), (chk, "checker")):
        canvas = bg.copy()
        canvas.alpha_composite(cut, (20, 20))
        canvas.convert("RGB").save(dest / f"{name}-{tag}.png")
    # 4x close-ups: top ring, left edge, right edge, foot
    rgba = np.asarray(cut)
    a = rgba[..., 3]
    ys, xs = np.nonzero(a > 20)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    cx = (x0 + x1) // 2
    patches = {
        "ring": (cx - 40, y0 - 8, cx + 40, y0 + 72),
        "left": (x0 - 8, (y0 + y1) // 2 - 40, x0 + 72, (y0 + y1) // 2 + 40),
        "right": (x1 - 72, (y0 + y1) // 2 - 40, x1 + 8, (y0 + y1) // 2 + 40),
        "foot": (cx - 50, y1 - 72, cx + 50, y1 + 8),
    }
    base = Image.new("RGBA", cut.size, (18, 20, 24, 255))
    base.alpha_composite(cut)
    for tag, box in patches.items():
        box = (
            max(0, box[0]),
            max(0, box[1]),
            min(cut.size[0], box[2]),
            min(cut.size[1], box[3]),
        )
        crop = base.crop(box).resize((box[2] - box[0]) * 4, (box[3] - box[1]) * 4, Image.NEAREST)
        crop.convert("RGB").save(SHOTS / "closeups" / f"{name}-{tag}.png")


def place_on_shared_canvas(cuts: dict[str, Image.Image], keys: list[str]) -> dict[str, Image.Image]:
    """Align feet and horizontal centers so the six street pins sit the same."""
    feet = {}
    centers = {}
    widths = []
    heights_above_foot = []
    heights_below_top = []
    for k in keys:
        a = np.asarray(cuts[k])[..., 3]
        ys, xs = np.nonzero(a > 20)
        # foot: bottom of the main body (95th percentile of ys, then max of a dense row)
        foot = int(np.percentile(ys, 99.5))
        # walk down to last row with a decent run of pixels
        for y in range(a.shape[0] - 1, -1, -1):
            if (a[y] > 20).sum() >= 8:
                foot = y
                break
        # horizontal center of the upper half (the ring / body, not a stray foot pixel)
        mid_band = (ys >= ys.min()) & (ys <= ys.min() + 0.35 * (ys.max() - ys.min()))
        cx = int(np.median(xs[mid_band])) if mid_band.any() else int(np.median(xs))
        feet[k] = foot
        centers[k] = cx
        widths.append(max(cx - xs.min(), xs.max() - cx))
        heights_above_foot.append(foot - ys.min())
        heights_below_top.append(a.shape[0] - foot)
        print(k, "bbox", xs.min(), ys.min(), xs.max(), ys.max(), "foot", foot, "cx", cx, "size", cuts[k].size)

    pad = 8
    half_w = max(widths) + pad
    above = max(heights_above_foot) + pad
    below = 6  # small pad under the foot; no painted shadow
    cw, ch = half_w * 2 + 1, above + below + 1
    print("shared canvas", cw, ch, "half_w", half_w, "above", above)
    placed = {}
    for k in keys:
        canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        x = half_w - centers[k]
        y = above - feet[k]
        canvas.alpha_composite(cuts[k], (x, y))
        placed[k] = canvas
    return placed


def to_webp(im: Image.Image, dest: Path, long_edge: int = 288) -> None:
    w, h = im.size
    scale = long_edge / max(w, h)
    # never upscale a lot; source crops are ~500px so this downscales
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    # snap to even
    nw, nh = nw + nw % 2, nh + nh % 2
    out = im.resize((nw, nh), Image.Resampling.LANCZOS)
    # WebP q=90 method 6, like the comet pins' weight class
    out.save(dest, format="WEBP", lossless=False, quality=90, method=6)
    print("webp", dest.name, out.size, dest.stat().st_size, "bytes")


def main() -> None:
    os.environ.setdefault("U2NET_HOME", "/home/box/.rembg/models/isnet-general-use")
    from rembg import new_session

    session = new_session("isnet-general-use")
    sheet = np.asarray(Image.open(SRC_TIERS).convert("RGB"))
    cuts_raw: dict[str, Image.Image] = {}
    scores = []
    for name, (r, c) in GRID.items():
        cell, box = crop_cell(sheet, r, c)
        Image.fromarray(cell).save(WORK / f"{name}-src.png")
        rgb = Image.fromarray(cell)
        mask = rembg_mask(rgb, name, session)
        rgba = matte(name, cell, mask)
        cuts_raw[name] = Image.fromarray(rgba, "RGBA")
        scores.append(quality_score(rgba, name))

    # Pick cleaner of row1 / row2 for amber, red, violet.
    picks = {"white": "white", "blue": "blue", "green": "green"}
    by = {s["name"]: s for s in scores}
    for tier in ("amber", "red", "violet"):
        a, b = by[f"{tier}1"], by[f"{tier}2"]
        pick = f"{tier}1" if a["score"] >= b["score"] else f"{tier}2"
        # Prefer the one with less halo if scores are close.
        if abs(a["score"] - b["score"]) < 0.4 and a["halo"] != b["halo"]:
            pick = f"{tier}1" if a["halo"] < b["halo"] else f"{tier}2"
        picks[tier] = pick
        print(f"PICK {tier}: {pick}  ({tier}1={a['score']}/{a['halo']}  {tier}2={b['score']}/{b['halo']})")

    street_keys = ["white", "blue", "green", "amber", "red", "violet"]
    chosen = {t: cuts_raw[picks[t]] for t in street_keys}
    placed = place_on_shared_canvas(chosen, street_keys)

    # Hearth
    hearth_rgb = Image.open(SRC_HEARTH).convert("RGB")
    hearth_rgb.save(WORK / "hearth-src.png")
    hmask = rembg_mask(hearth_rgb, "hearth", session)
    hrgba = matte("hearth", np.asarray(hearth_rgb), hmask)
    hearth = Image.fromarray(hrgba, "RGBA")
    # Tight box already; add a consistent pad by placing on its own canvas aligned to foot.
    placed_h = place_on_shared_canvas({"hearth": hearth}, ["hearth"])["hearth"]

    # Previews + close-ups of the chosen set (and both rows, for the record).
    for t in street_keys:
        composite_preview(placed[t], t, WORK)
        to_webp(placed[t], OUT / f"{t}.webp", long_edge=288)
    composite_preview(placed_h, "hearth", WORK)
    # Hearth is a bigger pin; keep a slightly larger source so it stays sharp at ~56-64 CSS px.
    to_webp(placed_h, OUT / "hearth.webp", long_edge=384)

    # Also dump the unpicked row for inspection.
    for t in ("amber", "red", "violet"):
        other = f"{t}1" if picks[t].endswith("2") else f"{t}2"
        composite_preview(cuts_raw[other], f"{other}-unpicked", WORK)

    (WORK / "picks.json").write_text(json.dumps({"picks": picks, "scores": scores}, indent=2))
    print("DONE", {k: (OUT / f"{k}.webp").stat().st_size for k in street_keys + ["hearth"]})


if __name__ == "__main__":
    main()
