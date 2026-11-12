#!/usr/bin/env python3
"""Cut the five painted shop/sign assets from Ryan's approved Gemini mocks.

Sources (2048x2048, flat cream plate):
  /home/box/keyline-art/printshop-v1.jpeg
  /home/box/keyline-art/street-counter-v1.jpeg
  /home/box/keyline-art/outfitter-v1.jpeg
  /home/box/keyline-art/station-sign-v1.jpeg
  /home/box/keyline-art/notice-sign-v1.jpeg

Method mirrors the 0.1.159 comet / 0.1.160 vault matte:
  rembg isnet-general-use core + colour-to-alpha against a locally sampled cream plate,
  un-mix the cream out of partial-alpha edges, drop the painted ground shadow
  (the map keeps its own shared contact-shadow ellipse).
  Keep stoops, posts, lanterns, and painted facade details (including cream awning
  stripes and enamel glyphs). Open stall bays become transparent.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ART = Path("/home/box/keyline-art")
WORK = ART / "work/shops"
SHOTS = ART / "shots/shops"
OUT = Path("/workspace/keyline-shops/public/sprites")
WORK.mkdir(parents=True, exist_ok=True)
SHOTS.joinpath("closeups").mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

# Plate cream, measured from the corners of all five mocks (~239, 233, 220).
BG = np.array([239.0, 233.0, 220.0])

ASSETS = {
    "print-shop": {
        "src": ART / "printshop-v1.jpeg",
        "webp": "print-shop.webp",
        # Sheet figure is 148 CSS px tall; 3x ~= 444. Long edge a little above that.
        "long_edge": 512,
    },
    "street-counter": {
        "src": ART / "street-counter-v1.jpeg",
        "webp": "street-counter.webp",
        # Sheet figure is 124 CSS px tall; pin is 46x58. Size for the sheet.
        "long_edge": 512,
    },
    "outfitter": {
        "src": ART / "outfitter-v1.jpeg",
        "webp": "outfitter.webp",
        "long_edge": 512,
    },
    "station-sign": {
        "src": ART / "station-sign-v1.jpeg",
        "webp": "station-sign.webp",
        # Pin only, comparable to the comet (48x58 at 3x = 144x174). Keep extra for the post+lamp.
        "long_edge": 320,
    },
    "notice-sign": {
        "src": ART / "notice-sign-v1.jpeg",
        "webp": "notice-sign.webp",
        "long_edge": 320,
    },
}


def save(im: Image.Image, path: Path, **kw) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, **kw)
    print("wrote", path, im.size, im.mode, flush=True)


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
    """Return an RGBA uint8 cut, tightly boxed, painted ground shadow dropped."""
    C = rgb.astype(np.float32)
    M = mask
    if M.ndim == 3:
        M = M[..., 0]
    H, W, _ = C.shape
    d0 = np.sqrt(((C - BG) ** 2).sum(-1))
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
    a_fx = np.clip(c2a, 0, 1)

    # Solid body: rembg core, a little eroded, far from the plate.
    solid = ndi.binary_erosion(M > 0.55, iterations=2) & (d > 14)
    # Cream/white painted details (awning stripes, enamel glyphs, sign borders)
    # sit close to the plate colour — trust a strong rembg core for those.
    pale_paint = (M > 0.75) & ((d > 8) | (sat > 18) | ((lum < lB - 6)))
    # Very light interior paint that rembg is sure about (white key, cream border).
    sure_pale = (M > 0.88) & ndi.binary_erosion(M > 0.6, iterations=1)
    solid = solid | ndi.binary_erosion(pale_paint, iterations=1) | sure_pale
    solid = ndi.binary_closing(solid, structure=np.ones((5, 5)))
    solid = ndi.binary_opening(solid, structure=np.ones((3, 3)))
    lab, n = ndi.label(solid)
    if n:
        sz = ndi.sum(solid, lab, range(1, n + 1))
        keep_ids = 1 + np.flatnonzero(np.array(sz) >= 40)
        solid = np.isin(lab, keep_ids)
    core = ndi.binary_erosion(solid, iterations=1)
    a = np.maximum(a_fx, core.astype(np.float32))
    a = np.maximum(a, (M > 0.85).astype(np.float32))

    # Open stall / sky holes: cream that matches the plate and is either outside
    # the rembg body or a hole rembg filled weakly. Flood from the corners.
    plate = (d < 14) & (sat < 28) & (np.abs(lum - lB) < 10)
    flood_seed = np.zeros((H, W), dtype=bool)
    flood_seed[:4, :] = True
    flood_seed[-4:, :] = True
    flood_seed[:, :4] = True
    flood_seed[:, -4:] = True
    flood_seed &= plate | (M < 0.08)
    # Dilate plate a tad so the flood can squeeze through anti-aliased gaps.
    walk = ndi.binary_dilation(plate | (M < 0.15), iterations=1)
    reached = ndi.binary_propagation(flood_seed, mask=walk)
    a = np.where(reached & (~core), 0, a)
    # Enclosed cream holes (open stall bays that rembg may have filled).
    hole = plate & (M < 0.65) & (~core) & (d < 12)
    a = np.where(hole, 0, a)

    # Painted cast shadow: darker, low-sat, in the lower ground band, not on the body.
    ys, xs = np.nonzero(solid)
    if len(ys):
        y_lo, y_hi = int(ys.min()), int(ys.max())
        x_lo, x_hi = int(xs.min()), int(xs.max())
        rows = np.arange(H)[:, None] >= y_lo + 0.62 * (y_hi - y_lo)
        kk = np.clip(lum / np.maximum(lB, 1), 0, 1)
        resid = np.sqrt(((C - kk[..., None] * B) ** 2).sum(-1))
        near = ndi.binary_dilation(solid, iterations=2)
        shade = rows & (~near) & (lum < lB - 4) & (sat < 45) & (kk > 0.45)
        shade |= rows & (~solid) & (lum < lB - 4) & (resid < 18) & (kk > 0.5) & (sat < 50)
        # Soft shadow still inside a weak rembg fringe under the stoop/post.
        shade |= rows & (M < 0.55) & (lum < lB - 3) & (sat < 40) & (~core)
        # Loose grass tufts sitting only on the ground, not against the stoop/post.
        grass = rows & (~ndi.binary_dilation(core, iterations=3)) & (M < 0.7) & (sat > 18) & (lum < lB - 2)
        # Only treat as grass if it's greenish (G high vs R/B) or olive-brown ground weed.
        g = C[..., 1]
        r = C[..., 0]
        bch = C[..., 2]
        grass &= (g > r - 4) & (g > bch)
        shade |= grass
        shade &= ~core
        a = np.where(shade, 0, a)

    # Drop crumbs and plate-touching slivers.
    lab, n = ndi.label(a > 0.06)
    if n:
        sz = ndi.sum(a > 0.06, lab, range(1, n + 1))
        keep = np.isin(lab, 1 + np.flatnonzero(np.array(sz) >= 40))
        a = a * ndi.binary_dilation(keep, iterations=1)
    a[a < 0.02] = 0

    # Un-mix the cream from partial-alpha edge pixels.
    ae = np.maximum(a, 1e-3)[..., None]
    F = np.where(a[..., None] > 0.97, C, np.clip(B + D / ae, 0, 255))

    # Defringe: partial-alpha pixels whose colour is still plate cream.
    # Do not eat cream/white paint that rembg is sure is part of the subject.
    Fl = F.mean(-1)
    Fs = F.max(-1) - F.min(-1)
    creamy = (np.sqrt(((F - B) ** 2).sum(-1)) < 40) | ((Fl > 180) & (Fs < 50))
    fr = (~core) & (a < 0.88) & (creamy | (Fl > 205))
    fr &= ~(M > 0.8)
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
    Image.fromarray(rgba, "RGBA").save(WORK / f"{name}-rgba.png")
    return np.asarray(cut)


def quality_score(rgba: np.ndarray, name: str) -> dict:
    a = rgba[..., 3].astype(np.float32) / 255.0
    rgb = rgba[..., :3].astype(np.float32)
    H, W = a.shape
    edge = (a > 0.08) & (a < 0.9)
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    cream = edge & (np.sqrt(((rgb - BG) ** 2).sum(-1)) < 45)
    core = a > 0.95
    if core.any():
        gy = np.abs(np.diff(lum, axis=0, prepend=lum[:1]))
        gx = np.abs(np.diff(lum, axis=1, prepend=lum[:, :1]))
        sharp = float((gy + gx)[core].mean())
    else:
        sharp = 0.0
    halo = float(cream.mean())
    ys, xs = np.nonzero(a > 0.05)
    shadow = 0.0
    if len(ys):
        low = np.arange(H)[:, None] > ys.min() + 0.7 * (ys.max() - ys.min())
        sh = low & (a > 0.05) & (a < 0.7) & (lum < 180) & (sat < 30)
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
    print("score", stats, flush=True)
    return stats


def composite_preview(cut: Image.Image, name: str) -> None:
    w, h = cut.size
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
        canvas.convert("RGB").save(WORK / f"{name}-{tag}.png")
    # 4x close-ups: roof/top, left, right, foot — plus a mid-facade patch.
    rgba = np.asarray(cut)
    a = rgba[..., 3]
    ys, xs = np.nonzero(a > 20)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    cx = (x0 + x1) // 2
    cy = (y0 + y1) // 2
    patches = {
        "top": (cx - 50, y0 - 8, cx + 50, y0 + 80),
        "left": (x0 - 8, cy - 50, x0 + 80, cy + 50),
        "right": (x1 - 80, cy - 50, x1 + 8, cy + 50),
        "foot": (cx - 60, y1 - 80, cx + 60, y1 + 8),
        "mid": (cx - 50, cy - 50, cx + 50, cy + 50),
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
        if box[2] <= box[0] or box[3] <= box[1]:
            continue
        crop = base.crop(box).resize(((box[2] - box[0]) * 4, (box[3] - box[1]) * 4), Image.Resampling.NEAREST)
        crop.convert("RGB").save(SHOTS / "closeups" / f"{name}-{tag}.png")


def place_on_canvas(cut: Image.Image, name: str) -> Image.Image:
    """Pad so the foot sits a few px above the bottom, horizontally centered."""
    a = np.asarray(cut)[..., 3]
    ys, xs = np.nonzero(a > 20)
    foot = int(ys.max())
    for y in range(a.shape[0] - 1, -1, -1):
        if (a[y] > 20).sum() >= 6:
            foot = y
            break
    cx = int(np.median(xs[(ys >= ys.min()) & (ys <= ys.min() + 0.4 * (ys.max() - ys.min()))]))
    pad = 8
    below = 6
    half_w = max(cx - int(xs.min()), int(xs.max()) - cx) + pad
    above = foot - int(ys.min()) + pad
    cw, ch = half_w * 2 + 1, above + below + 1
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = half_w - cx
    y = above - foot
    canvas.alpha_composite(cut, (x, y))
    print(name, "bbox", int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()),
          "foot", foot, "cx", cx, "canvas", canvas.size, flush=True)
    save(canvas, WORK / f"{name}-placed.png")
    return canvas


def to_webp(im: Image.Image, dest: Path, long_edge: int) -> Image.Image:
    w, h = im.size
    scale = long_edge / max(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    nw, nh = nw + nw % 2, nh + nh % 2
    out = im.resize((nw, nh), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, format="WEBP", lossless=False, quality=90, method=6)
    print("webp", dest, out.size, dest.stat().st_size, "bytes", flush=True)
    return out


def main() -> None:
    os.environ.setdefault("U2NET_HOME", "/home/box/.rembg/models")
    from rembg import new_session

    session = new_session("isnet-general-use")
    scores = []
    webps = {}
    for name, spec in ASSETS.items():
        rgb = Image.open(spec["src"]).convert("RGB")
        rgb.save(WORK / f"{name}-src.png")
        mask = rembg_mask(rgb, name, session)
        rgba = matte(name, np.asarray(rgb), mask)
        cut = Image.fromarray(rgba, "RGBA")
        scores.append(quality_score(rgba, name))
        placed = place_on_canvas(cut, name)
        composite_preview(placed, name)
        webp = to_webp(placed, OUT / spec["webp"], spec["long_edge"])
        # Also stash the exported webp as png for inspection.
        webp.save(WORK / f"{name}-export.png")
        webps[name] = {"size": list(webp.size), "bytes": (OUT / spec["webp"]).stat().st_size}
    (WORK / "report.json").write_text(json.dumps({"scores": scores, "webps": webps}, indent=2))
    print("DONE", webps, flush=True)


if __name__ == "__main__":
    main()
