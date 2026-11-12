#!/usr/bin/env python3
"""0.1.161: cut Ryan's approved Gemini car sheets into transparent sprites and factory paint variants.

Sources: /home/box/keyline-art/car-<id>-v1.jpeg (2752x1536, one row: side | front | back on cream).
Writes public/sprites/cars/<id>-{side,front,back}.webp and paint/<id>-<color>-{side,front,back}.webp
at 2x+ display size (sides 640 px wide, other views at the same pixel density, webp q75 so the 20 MB static cap still clears with headroom).

The map already draws its own drop-shadow, so the painted ground oval is dropped.
Background is keyed by flooding from the border (white body paint stays; it is not reachable).
The car is the ink-outline fill (lum <= 40); leftover is the shadow oval.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
ART = Path("/home/box/keyline-art")
OUT = ROOT / "public/sprites/cars"
PAINT = OUT / "paint"
QA = Path("/tmp/car-mattes")
CARS = ["civic", "belair57", "f150", "ioniq5", "model3", "mustang", "roadster", "roadster2"]
VIEWS = ["side", "front", "back"]
SIDE_W = 640
WEBP_QUALITY = 75  # was 88; 20 MB static cap needs ~0.6MB+ back
INK_T = 40
INK_CLOSE = 3
BG_TOL = 16
EDGE_PAD = 2


def flood_bg(im: np.ndarray, tol: float = BG_TOL) -> tuple[np.ndarray, np.ndarray]:
    h, w, _ = im.shape
    corners = np.concatenate(
        [im[:20, :20], im[:20, -20:], im[-20:, :20], im[-20:, -20:]]
    ).reshape(-1, 3)
    bg = np.median(corners, 0)
    d = np.sqrt(((im.astype(float) - bg) ** 2).sum(-1))
    similar = d <= tol
    seed = np.zeros((h, w), dtype=bool)
    seed[0] = similar[0]
    seed[-1] = similar[-1]
    seed[:, 0] = similar[:, 0]
    seed[:, -1] = similar[:, -1]
    return ndimage.binary_propagation(seed, mask=similar), bg


def views_of(im: np.ndarray):
    bgmask, bg = flood_bg(im)
    obj = ndimage.binary_closing(~bgmask, iterations=2)
    lab, n = ndimage.label(obj)
    sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    main = np.isin(lab, 1 + np.argsort(-sz)[:3])
    labs, _ = ndimage.label(main)
    boxes = sorted((s[1].start, s) for s in ndimage.find_objects(labs))
    out = []
    for name, (_, sl) in zip(VIEWS, boxes):
        out.append((name, im[sl], main[sl], bg))
    return out


def ink_fill(crop: np.ndarray, mask: np.ndarray) -> np.ndarray:
    lum = crop.astype(float).mean(-1)
    ink = ndimage.binary_closing(mask & (lum <= INK_T), iterations=INK_CLOSE)
    filled = ndimage.binary_fill_holes(ink)
    frac = filled.sum() / max(mask.sum(), 1)
    if frac < 0.78:
        # outline didn't close; try a slightly looser ink
        ink = ndimage.binary_closing(mask & (lum <= 46), iterations=4)
        filled = ndimage.binary_fill_holes(ink)
        frac = filled.sum() / max(mask.sum(), 1)
    if frac < 0.78 or frac > 0.96:
        raise RuntimeError(f"ink fill frac {frac:.3f} looks wrong")
    return filled


def tight_rgba(crop: np.ndarray, keep: np.ndarray) -> Image.Image:
    ys, xs = np.where(keep)
    y0, y1 = max(0, ys.min() - EDGE_PAD), min(keep.shape[0], ys.max() + 1 + EDGE_PAD)
    x0, x1 = max(0, xs.min() - EDGE_PAD), min(keep.shape[1], xs.max() + 1 + EDGE_PAD)
    alpha = np.where(keep[y0:y1, x0:x1], 255, 0).astype(np.uint8)
    rgb = crop[y0:y1, x0:x1].copy()
    # choke near-bg fringe on the rim: if an opaque edge pixel is almost the cream bg,
    # drop it so a dark map tile never shows a halo.
    return defringe(rgb, alpha)


def defringe(rgb: np.ndarray, alpha: np.ndarray) -> Image.Image:
    h, w = alpha.shape
    a = alpha.astype(bool)
    # 4-neighbour edge
    up = np.zeros_like(a); up[1:] = a[:-1]
    dn = np.zeros_like(a); dn[:-1] = a[1:]
    lf = np.zeros_like(a); lf[:, 1:] = a[:, :-1]
    rt = np.zeros_like(a); rt[:, :-1] = a[:, 1:]
    edge = a & ~(up & dn & lf & rt)
    if not edge.any():
        return Image.fromarray(np.dstack([rgb, alpha]))
    # inward (non-edge, opaque) mean of 8-neighbourhood, for pixels whose colour still
    # looks like the cream sheet (warm light, close to 240,234,221).
    rgb_f = rgb.astype(float)
    cream = np.array([241.0, 234.0, 221.0])
    d = np.sqrt(((rgb_f - cream) ** 2).sum(-1))
    # drop thin cream rims entirely
    drop = edge & (d < 22)
    alpha = alpha.copy()
    alpha[drop] = 0
    a = alpha > 0
    edge = a & ~(
        np.pad(a[:-1], ((1, 0), (0, 0)), constant_values=False)
        & np.pad(a[1:], ((0, 1), (0, 0)), constant_values=False)
        & np.pad(a[:, :-1], ((0, 0), (1, 0)), constant_values=False)
        & np.pad(a[:, 1:], ((0, 0), (0, 1)), constant_values=False)
    )
    # remaining edge: pull colour toward inward neighbours so residual bg mix is gone
    inner = a & ~edge
    if inner.any() and edge.any():
        yy, xx = np.where(edge)
        out = rgb_f.copy()
        for y, x in zip(yy, xx):
            y0, y1 = max(0, y - 2), min(h, y + 3)
            x0, x1 = max(0, x - 2), min(w, x + 3)
            patch = inner[y0:y1, x0:x1]
            if patch.any():
                out[y, x] = rgb_f[y0:y1, x0:x1][patch].mean(0)
        rgb = np.clip(out, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, alpha]))


def premult_resize(im: Image.Image, w: int, h: int) -> Image.Image:
    """Resize in premultiplied space so cream/transparent edges don't fringe."""
    a = np.asarray(im).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3:4] / 255.0
    # rgb is 0-255, al is 0-1: premul RGB stays 0-255, alpha stored as 0-255
    prem = np.concatenate([rgb * al, al * 255.0], -1)
    prem_im = Image.fromarray(np.clip(prem, 0, 255).astype(np.uint8), "RGBA")
    r = prem_im.resize((w, h), Image.Resampling.LANCZOS)
    b = np.asarray(r).astype(np.float32)
    al2 = b[..., 3:4] / 255.0
    rgb2 = np.divide(b[..., :3], al2, out=np.zeros_like(b[..., :3]), where=al2 > 0.02)
    rgb2 = np.clip(rgb2, 0, 255)
    # snap nearly empty pixels to 0, nearly solid to 255
    alpha = b[..., 3]
    alpha = np.where(alpha < 8, 0, np.where(alpha > 248, 255, alpha))
    return Image.fromarray(np.dstack([rgb2, alpha]).astype(np.uint8))


def load_colors() -> dict[str, list[tuple[str, str]]]:
    src = (ROOT / "src/game/carPaint.ts").read_text()
    cols: dict[str, list[tuple[str, str]]] = {}
    for car, body in re.findall(r"\n  (\w+): \[\n(.*?)\n  \],", src, re.S):
        cols[car] = re.findall(r'id: "(\w+)", name: "[^"]+", hex: "#(\w{6})"', body)
    return cols


def paint_mask(a: np.ndarray, car: str) -> np.ndarray:
    """Body-paint pixels only: glass, tires, chrome, lights, stripes stay."""
    rgb = a[..., :3].astype(float)
    al = a[..., 3]
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    lum = rgb.mean(-1)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h, w = lum.shape
    if car == "belair57":
        # turquoise body, including slightly paler deck/cowl blends and hub rings;
        # ivory roof sweep, white side spear and chrome stay
        m = (al > 200) & (sat > 0.12) & (g > r + 8) & (b > r + 2) & (g > 55) & (lum > 45) & (g >= b - 25)
        m = m & ~((lum > 190) & (sat < 0.22))
    elif car == "mustang":
        # silver body includes the darker lower door; racing stripes stay grey
        body = (al > 200) & (sat < 0.20) & (lum > 95)
        if body.any():
            ys = np.where(al > 200)[0]
            y0, y1 = int(ys.min()), int(ys.max())
            upper = np.arange(h)[:, None] < y0 + 0.50 * (y1 - y0)
            med = np.median(lum[body])
            stripe = body & upper & (lum < med - 25) & (lum > 60)
            stripe = ndimage.binary_opening(ndimage.binary_closing(stripe, iterations=1), iterations=1)
            m = body & ~stripe
            # black side-skirt / rocker is darker than the lower door; don't leak paint into it
            lower = np.arange(h)[:, None] > y0 + 0.80 * (y1 - y0)
            m = m & ~(lower & (lum < 112))
        else:
            m = body
    elif car == "ioniq5":
        # dark lower cladding and aero lines stay; light door triangle is body paint
        core = (al > 200) & (sat < 0.22) & (lum > 140)
        light = (al > 200) & (sat < 0.24) & (lum > 130)
        # add light islands in the central door (not the wheel columns, not the bottom cladding)
        xs = np.arange(w)[None, :]
        ys = np.arange(h)[:, None]
        central = (xs > w * 0.18) & (xs < w * 0.82) & (ys < h * 0.88)
        extra = light & central
        m = core | extra
        m = m & (lum > 125)  # still drop dark cladding / rubber
    elif car == "civic":
        m = (al > 200) & (sat < 0.28) & (mx > 115) & (lum > 110)
    else:
        # factory body is a light, fairly neutral paint (white / silver)
        m = (al > 200) & (sat < 0.22) & (mx > 115) & (lum > 100)
    m = ndimage.binary_closing(m, iterations=2)
    lab, n = ndimage.label(m)
    if not n:
        return m
    sz = ndimage.sum(m, lab, range(1, n + 1))
    keep = 1 + np.where(sz >= sz.max() * 0.06)[0]
    return np.isin(lab, keep)


def recolor(a: np.ndarray, mask: np.ndarray, hex_color: str) -> np.ndarray:
    t = np.array([int(hex_color[i : i + 2], 16) for i in (0, 2, 4)], dtype=float)
    L = a[..., :3].mean(-1)
    Lm = np.median(L[mask]) if mask.any() else 128
    s = (L[mask] / max(Lm, 1e-3))[:, None]
    hi = np.clip((s - 1) / max(255 / max(Lm, 1) - 1, 1e-3), 0, 1) * 0.55
    new = np.where(s <= 1, t * s, t + (255 - t) * hi)
    if t.max() < 60:
        # blacks keep a soft sheen
        new = t + (L[mask][:, None] - Lm) * 0.32
    out = a.copy()
    out[..., :3][mask] = np.clip(new, 0, 255)
    return out


def save_webp(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="WEBP", quality=WEBP_QUALITY, method=6, lossless=False)
    print(f"  {path.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {path.stat().st_size}b")


def cut_all() -> dict[str, dict[str, Image.Image]]:
    sprites: dict[str, dict[str, Image.Image]] = {}
    for cid in CARS:
        src = ART / f"car-{cid}-v1.jpeg"
        im = np.asarray(Image.open(src).convert("RGB"))
        sprites[cid] = {}
        print(f"== {cid} ==")
        for name, crop, mask, bg in views_of(im):
            keep = ink_fill(crop, mask)
            raw = tight_rgba(crop, keep)
            if name == "side":
                w, h = SIDE_W, round(raw.height * SIDE_W / raw.width)
                scale = SIDE_W / raw.width
            else:
                # same pixel density as this car's side
                w = max(192, round(raw.width * (SIDE_W / sprites[cid]["side"].info.get("_src_w", raw.width) if False else 0)))
                # compute from side's scale once we know it — process side first (VIEWS order)
                side = sprites[cid]["side"]
                scale = side.size[0] / side.info["_src_w"]
                w = max(192, round(raw.width * scale))
                h = round(raw.height * scale)
            # stash source width on first (side) before resize
            if name == "side":
                scaled = premult_resize(raw, SIDE_W, round(raw.height * SIDE_W / raw.width))
                scaled.info["_src_w"] = raw.width
            else:
                scaled = premult_resize(raw, w, h)
            sprites[cid][name] = scaled
            if name == "side":
                sprites[cid][name].info["_src_w"] = raw.width
            dest = OUT / f"{cid}-{name}.webp"
            save_webp(scaled, dest)
            # also keep a full-res cut for QA / paint (paint at export size, not source)
        # sanity
        for name in VIEWS:
            if name not in sprites[cid]:
                raise RuntimeError(f"missing {cid} {name}")
    return sprites


def cut_all_fixed() -> dict[str, dict[str, Image.Image]]:
    """Cut with side first so scale is well defined (same as cut_all, clearer)."""
    sprites: dict[str, dict[str, Image.Image]] = {}
    for cid in CARS:
        src = ART / f"car-{cid}-v1.jpeg"
        im = np.asarray(Image.open(src).convert("RGB"))
        views = {name: (crop, mask, bg) for name, crop, mask, bg in views_of(im)}
        sprites[cid] = {}
        print(f"== {cid} ==")
        # side first
        crop, mask, bg = views["side"]
        raw_side = tight_rgba(crop, ink_fill(crop, mask))
        scale = SIDE_W / raw_side.width
        side = premult_resize(raw_side, SIDE_W, round(raw_side.height * scale))
        sprites[cid]["side"] = side
        save_webp(side, OUT / f"{cid}-side.webp")
        for name in ("front", "back"):
            crop, mask, bg = views[name]
            raw = tight_rgba(crop, ink_fill(crop, mask))
            w = max(192, round(raw.width * scale))
            h = round(raw.height * scale)
            im2 = premult_resize(raw, w, h)
            sprites[cid][name] = im2
            save_webp(im2, OUT / f"{cid}-{name}.webp")
    return sprites


def paint_all(sprites: dict[str, dict[str, Image.Image]]) -> dict[str, list[str]]:
    cols = load_colors()
    trouble: dict[str, list[str]] = {}
    PAINT.mkdir(parents=True, exist_ok=True)
    # remove leftover old png variants so we don't ship mixed art
    for old in list(PAINT.glob("*.png")) + list(OUT.glob("*.png")):
        # only car sprites we own, not other files
        old.unlink()
        print("removed", old.relative_to(ROOT))
    for cid, cl in cols.items():
        if cid not in sprites:
            raise RuntimeError(f"no sprites for {cid}")
        for view in VIEWS:
            base = np.asarray(sprites[cid][view].convert("RGBA")).astype(float)
            m = paint_mask(base, cid)
            coverage = m.mean()
            if coverage < 0.08 or coverage > 0.72:
                trouble.setdefault(cid, []).append(f"{view} mask coverage {coverage:.3f}")
            # visual mask
            vis = base.copy()
            vis[..., 0][m] = np.clip(vis[..., 0][m] * 0.4 + 200, 0, 255)
            QA.mkdir(parents=True, exist_ok=True)
            Image.fromarray(vis.astype(np.uint8)).save(QA / f"mask-{cid}-{view}.png")
            # skip factory colour (first entry) — that's the base sprite
            for color_id, hx in cl[1:]:
                rec = recolor(base, m, hx)
                im = Image.fromarray(rec.astype(np.uint8))
                save_webp(im, PAINT / f"{cid}-{color_id}-{view}.webp")
        print(f"  painted {cid}: {[c for c,_ in cl[1:]]}  mask~{paint_mask(np.asarray(sprites[cid]['side'].convert('RGBA')), cid).mean():.3f}")
    return trouble


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    PAINT.mkdir(parents=True, exist_ok=True)
    sprites = cut_all_fixed()
    trouble = paint_all(sprites)
    if trouble:
        print("MASK WARNINGS:", trouble)
    else:
        print("paint masks within range")
    return 0


if __name__ == "__main__":
    sys.exit(main())
