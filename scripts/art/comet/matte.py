"""Comet pins: cream Gemini backdrop -> RGBA.
- Body core: rembg mask, eroded, only clearly painted pixels (pale trail/glow paint never enters the core).
- Everything else: colour-to-alpha against the locally sampled backdrop (4-level dead zone), boosted x1.5 for light and
  chromatic paint (trail, sparks, glow, ring) and exact (x1) for darker edge mixes, then the cream is un-mixed
  out of the colour, so outline edges carry no cream rim.
- The painted grey cast shadow is dropped (neutral, darker than the backdrop, ground band only); the map has its
  own shared contact-shadow ellipse."""
import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi

BG = np.array([240., 235., 225.])
# comet head + trail, measured on the full-size mock (x0, y0, x1, y1): pale paint here is light, not plate
ZONE = {'hero': (960, 85, 1565, 480), 'open': (275, 1250, 675, 1565), 'cooling': (925, 1285, 1220, 1555)}  # locked's comet is a solid dull stone: no light zone
import json as _j
CROPS = _j.load(open('crops.json'))

def run(k, dead=5.0, gain=1.5):
    C = np.asarray(Image.open(f'{k}-src.png').convert('RGB')).astype(np.float32)
    M = np.asarray(Image.open(f'{k}-mask.png')).astype(np.float32) / 255
    H, W, _ = C.shape
    d0 = np.sqrt(((C - BG) ** 2).sum(-1))
    samp = (M < 0.03) & (d0 < 14)
    s = 4; Cs = C[::s, ::s]; ws = samp[::s, ::s].astype(np.float32)
    num = np.stack([ndi.gaussian_filter(Cs[..., c] * ws, 20) for c in range(3)], -1)
    den = ndi.gaussian_filter(ws, 20)[..., None]
    Bs = np.where(den > 0.02, num / np.maximum(den, 1e-6), BG)
    B = np.stack([np.asarray(Image.fromarray(Bs[..., c].astype(np.float32)).resize((W, H), Image.BICUBIC)) for c in range(3)], -1)
    D = C - B
    d = np.sqrt((D ** 2).sum(-1))
    lum = C.mean(-1); lB = B.mean(-1); sat = C.max(-1) - C.min(-1)
    green = (C[..., 1] - np.maximum(C[..., 0], C[..., 2])) > 8

    Dz = np.sign(D) * np.maximum(np.abs(D) - dead, 0)
    c2a = np.where(Dz > 0, Dz / np.maximum(255 - B, 8), -Dz / np.maximum(B, 8)).max(-1)
    g = np.where(lum >= lB - 10, gain, 1.0)
    a_fx = np.clip(c2a * g, 0, 1)

    ox, oy = CROPS[k][0], CROPS[k][1]
    zone = np.zeros((H, W), bool)
    if k in ZONE:
        zx0, zy0, zx1, zy1 = ZONE[k]; zone[max(zy0 - oy, 0):zy1 - oy, max(zx0 - ox, 0):zx1 - ox] = True
    zone = ndi.gaussian_filter(zone.astype(np.float32), 6) > 0.5
    pale = (lum > 185) & (sat < 90) & zone
    solid = ndi.binary_erosion(M > 0.5, iterations=2) & (d > 30) & ~pale
    solid = ndi.binary_closing(solid, structure=np.ones((5, 5)))
    solid = ndi.binary_opening(solid, structure=np.ones((3, 3)))
    lab, n = ndi.label(solid); sz = ndi.sum(solid, lab, range(1, n + 1))
    solid = np.isin(lab, 1 + np.flatnonzero(sz > 400))
    core = ndi.binary_erosion(solid, iterations=2)
    a = np.maximum(a_fx, core.astype(np.float32))

    # painted cast shadow, ground band only
    ys, xs = np.nonzero(solid)
    rows = np.arange(H)[:, None] >= ys.min() + 0.55 * (ys.max() - ys.min())
    kk = np.clip(lum / np.maximum(lB, 1), 0, 1)
    resid = np.sqrt(((C - kk[..., None] * B) ** 2).sum(-1))
    near = ndi.binary_dilation(solid, iterations=3)
    shade = rows & (~near) & (lum < lB - 3) & (kk > 0.45) & (sat < 45) & ~green
    shade |= rows & (~solid) & (lum < lB - 3) & (resid < 16) & (kk > 0.5)
    a = np.where(shade, 0, a)
    # comet zone: pale trail / dust / head glow keeps the painted colour on a soft distance ramp
    # the vault's own silhouette: the core opened wide (drops the hook and the thin ring), convex hull
    from scipy.spatial import ConvexHull
    from matplotlib.path import Path
    big = ndi.binary_opening(core, structure=np.ones((31, 31)))
    lab2, n2 = ndi.label(big); sz2 = ndi.sum(big, lab2, range(1, n2 + 1)); big = lab2 == 1 + int(np.argmax(sz2))
    py, px = np.nonzero(big); pts = np.c_[px, py]
    hull = Path(pts[ConvexHull(pts).vertices])
    gy, gx = np.mgrid[0:H, 0:W]
    inside = hull.contains_points(np.c_[gx.ravel(), gy.ravel()]).reshape(H, W)
    inside = ndi.binary_erosion(inside, iterations=3)
    np.save(f'{k}-hull.npy', inside)
    light = zone & ~core & ~inside
    off = {'hero': 6, 'open': 6, 'cooling': 16, 'locked': 12}[k]
    ramp = np.clip((d - off) / 30, 0, 1); ramp = ramp * ramp * (3 - 2 * ramp)

    lab, n = ndi.label(a > 0.06); sz = ndi.sum(a > 0.06, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.flatnonzero(sz >= 6))
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    keep &= ~np.isin(lab, np.intersect1d(edge[edge > 0], 1 + np.flatnonzero(sz < 5000)))
    a = a * ndi.binary_dilation(keep, iterations=2)
    a[a < 0.02] = 0
    ae = np.maximum(a, 1e-3)[..., None]
    F = np.where(a[..., None] > 0.97, C, np.clip(B + D / ae, 0, 255))
    cap = np.where(sat < 40, {'cooling': 0.6, 'locked': 0.85}.get(k, 1.0), 1.0)
    a = np.where(light, ramp * cap * (a > 0), a)
    F = np.where(light[..., None], C, F)
    roof = zone & inside & (d > 14)
    a = np.where(roof, 1.0, a); F = np.where(roof[..., None], C, F)
    # defringe: partial-alpha edge pixels outside the comet zone whose colour is still plate cream
    Fl = F.mean(-1); Fs = F.max(-1) - F.min(-1)
    creamy = (np.sqrt(((F - B) ** 2).sum(-1)) < 45) | ((Fl > 175) & (Fs < 55))
    fr = (~core) & (~light) & (~roof) & (a < 0.9) & (creamy | (Fl > 200))
    a = np.where(fr, 0, a)
    stray = (~zone) & (a < 0.5) & ~ndi.binary_dilation(a > 0.9, iterations=2)
    a = np.where(stray, 0, a)
    a[a < 0.02] = 0
    F = np.where(a[..., None] == 0, 0, F)
    rgba = np.dstack([F, a * 255]).round().clip(0, 255).astype(np.uint8)
    ys, xs = np.nonzero(a > 0.03); m = 6
    box = (int(max(xs.min() - m, 0)), int(max(ys.min() - m, 0)), int(min(xs.max() + m, W)), int(min(ys.max() + m, H)))
    Image.fromarray(rgba, 'RGBA').crop(box).save(f'{k}-cut.png')
    print(k, 'box', box)

for k in (sys.argv[1:] or ['hero', 'open', 'cooling', 'locked']): run(k)
