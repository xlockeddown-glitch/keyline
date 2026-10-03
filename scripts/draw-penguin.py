#!/usr/bin/env python3
"""0.0.49: the Lynx slot becomes a penguin — drawn from scratch, not filtered from another character.

Two lynx redraws (a recoloured tabby, then a flat graphic head) were rejected, so this one is painted
procedurally: every body part is a soft volume (an ellipsoid or a rounded shape) lit from the upper left,
shaded through a three-tone ramp per material in a handful of bands, supersampled 4x4 and reduced to hard
pixel edges, then given the house treatment of a dark selective outline on the silhouette and a softer line
where a part overlaps one behind it. The design lives in one 96-unit space (floor at y=88, centred on x=48,
the old Lynx's floor and anchors); the idle sheet is the same drawing at 128/96.

The character: a round little penguin — black cap and back, white heart-shaped face, small dark eyes with
one catchlight (no sclera, nothing staring), rosy cheeks, an orange beak and orange feet — in a cornflower-blue
pea coat worn open over the white belly, with brass toggles, a red knitted scarf, and the lantern in the
right flipper like the rest of the cast. Walk is a waddle: the body rocks about the neck (the head tilts
with it) while the planted foot stays on the floor line and the other lifts.

Writes lynx-walk.png, lynx-idle.png, lynx.png, lynx-idle-side.png (make-side-idle.build); `--coats` also
writes the four print-shop coats (make-coat-variants). The internal id stays `lynx` so saves keep working.
Deterministic. Then `npm run qa:sprites`."""
from __future__ import annotations

import importlib.util
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCOUTS = ROOT / "public" / "sprites" / "scouts"
SS = 4  # supersampling per output pixel


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


# ── palette: (shadow, base, highlight) ───────────────────────────────────
MAT = {
    "black": ((22, 22, 34), (44, 48, 66), (96, 108, 138)),
    "white": ((166, 170, 188), (234, 232, 226), (255, 253, 246)),
    "coat": ((38, 54, 106), (72, 98, 162), (126, 152, 204)),
    "coatin": ((30, 44, 92), (52, 72, 132), (80, 104, 168)),
    "scarf": ((120, 28, 42), (200, 56, 56), (244, 116, 92)),
    "scarfdk": ((96, 22, 36), (160, 42, 48), (200, 72, 66)),
    "orange": ((190, 82, 30), (240, 138, 42), (255, 172, 92)),
    "eye": ((20, 14, 20), (34, 24, 30), (60, 46, 52)),
    "spark": ((255, 255, 255), (255, 255, 255), (255, 255, 255)),
    "blush": ((240, 140, 146), (246, 160, 160), (250, 184, 180)),
    "toggle": ((150, 102, 46), (214, 168, 92), (246, 214, 150)),
    "iron": ((30, 24, 24), (62, 48, 40), (104, 86, 66)),
    "brass": ((120, 78, 34), (182, 130, 58), (236, 196, 110)),
    "glass": ((236, 150, 52), (255, 198, 86), (255, 236, 158)),
    "glow": ((255, 232, 150), (255, 244, 196), (255, 252, 230)),
}
OUTLINE = np.array((30, 22, 30), dtype=np.float32)
LIGHT = np.array((-0.45, -0.65, 0.62))
LIGHT = LIGHT / np.linalg.norm(LIGHT)
BANDS = 7


# ── shapes ───────────────────────────────────────────────────────────────
class Ell:
    def __init__(self, cx, cy, rx, ry, rot=0.0):
        self.cx, self.cy, self.rx, self.ry, self.rot = cx, cy, rx, ry, math.radians(rot)

    def eval(self, X, Y):
        c, s = math.cos(self.rot), math.sin(self.rot)
        dx, dy = X - self.cx, Y - self.cy
        u = (dx * c + dy * s) / self.rx
        v = (-dx * s + dy * c) / self.ry
        r2 = u * u + v * v
        m = r2 <= 1.0
        nz = np.sqrt(np.clip(1.0 - r2, 0, 1))
        # normal back in world orientation
        nx = u * c - v * s
        ny = u * s + v * c
        return m, (nx, ny, nz)


class Poly:
    def __init__(self, pts, dome=None):
        self.pts = pts
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        self.dome = dome or Ell((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(1, (max(xs) - min(xs)) / 2 + 0.5), max(1, (max(ys) - min(ys)) / 2 + 0.5))

    def eval(self, X, Y):
        inside = np.zeros(X.shape, dtype=bool)
        n = len(self.pts)
        for i in range(n):
            x1, y1 = self.pts[i]
            x2, y2 = self.pts[(i + 1) % n]
            cond = (y1 > Y) != (y2 > Y)
            with np.errstate(divide="ignore", invalid="ignore"):
                xi = (x2 - x1) * (Y - y1) / ((y2 - y1) if y2 != y1 else 1e-9) + x1
            inside ^= cond & (X < xi)
        _, nrm = self.dome.eval(X, Y)
        return inside, nrm


class HalfPlane:
    """Keeps a*x + b*y <= c."""

    def __init__(self, a, b, c):
        self.a, self.b, self.c = a, b, c

    def eval(self, X, Y):
        return (self.a * X + self.b * Y <= self.c), None


class Part:
    def __init__(self, name, shape, mat, z, *, xf=None, clip=(), cut=(), decal=False, alpha=1.0, flat=0.0, edge=1.0, ao=0.0, hue=None):
        self.name, self.shape, self.mat, self.z = name, shape, mat, z
        self.xf = xf  # world -> local
        self.clip, self.cut = clip, cut
        self.decal, self.alpha, self.flat, self.edge, self.ao = decal, alpha, flat, edge, ao


def rot_xf(px, py, deg, dx=0.0, dy=0.0):
    """world -> local for a group rotated by deg about (px,py) then moved by (dx,dy)."""
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)

    def f(X, Y):
        X = X - dx - px
        Y = Y - dy - py
        return X * c + Y * s + px, -X * s + Y * c + py

    def fwd(x, y):
        x, y = x - px, y - py
        return x * c - y * s + px + dx, x * s + y * c + py + dy

    f.fwd = fwd  # type: ignore[attr-defined]
    return f


def ident():
    f = lambda X, Y: (X, Y)
    f.fwd = lambda x, y: (x, y)  # type: ignore[attr-defined]
    return f


def noise(h, w, seed):
    rng = np.random.default_rng(seed)
    small = rng.random((h // 8 + 2, w // 8 + 2))
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(img).astype(np.float32) / 255 - 0.5


def ramp(mat, s):
    sh, ba, hi = (np.array(c, dtype=np.float32) for c in MAT[mat])
    s = s[..., None]
    lo = sh + (ba - sh) * np.clip(s / 0.55, 0, 1)
    up = ba + (hi - ba) * np.clip((s - 0.55) / 0.45, 0, 1)
    return np.where(s < 0.55, lo, up)


def render(parts: list[Part], cell: int, scale: float, seed: int = 7) -> Image.Image:
    N = cell * SS
    ys, xs = np.mgrid[0:N, 0:N].astype(np.float32)
    X = (xs + 0.5) / SS / scale
    Y = (ys + 0.5) / SS / scale
    col = np.zeros((N, N, 3), dtype=np.float32)
    pid = np.full((N, N), -1, dtype=np.int32)
    tex = noise(N, N, seed)
    parts = sorted(parts, key=lambda p: p.z)
    for i, p in enumerate(parts):
        lx, ly = (p.xf or ident())(X, Y)
        m, nrm = p.shape.eval(lx, ly)
        for c in p.clip:
            cm, _ = c.eval(lx, ly)
            m = m & cm
        for c in p.cut:
            cm, _ = c.eval(lx, ly)
            m = m & ~cm
        if not m.any():
            continue
        nx, ny, nz = nrm
        lam = np.clip(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2], 0, 1)
        s = 0.12 + 0.95 * lam
        s = s * (1 - p.flat) + 0.62 * p.flat
        if p.ao:
            s = s - p.ao * np.clip(ny, 0, 1) ** 2
        s = s + tex * (0.15 if p.mat in ("coat", "black") else 0.10)
        s = np.round(np.clip(s, 0, 1) * (BANDS - 1)) / (BANDS - 1)
        c = ramp(p.mat, s)
        if p.alpha < 1.0:
            col[m] = col[m] * (1 - p.alpha) + c[m] * p.alpha
        else:
            col[m] = c[m]
            pid[m] = i
    # reduce
    cov = (pid >= 0).reshape(cell, SS, cell, SS).mean(axis=(1, 3))
    w = (pid >= 0).astype(np.float32)
    acc = (col * w[..., None]).reshape(cell, SS, cell, SS, 3).sum(axis=(1, 3))
    cnt = w.reshape(cell, SS, cell, SS).sum(axis=(1, 3))
    rgb = acc / np.maximum(cnt, 1)[..., None]
    # majority part id per pixel
    pr = pid.reshape(cell, SS, cell, SS).transpose(0, 2, 1, 3).reshape(cell, cell, SS * SS)
    maj = np.full((cell, cell), -1, dtype=np.int32)
    for yy in range(cell):
        for xx in range(cell):
            v = pr[yy, xx]
            v = v[v >= 0]
            if len(v):
                vals, cts = np.unique(v, return_counts=True)
                maj[yy, xx] = vals[cts.argmax()]
    solid = cov >= 0.5
    maj[~solid] = -1
    out = rgb.copy()
    zs = np.array([p.z for p in parts])
    for yy in range(1, cell - 1):
        for xx in range(1, cell - 1):
            k = maj[yy, xx]
            if k < 0:
                continue
            p = parts[k]
            nb = [maj[yy + dy, xx + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if any(n < 0 for n in nb):
                out[yy, xx] = rgb[yy, xx] * 0.30 + OUTLINE * 0.70
            elif not p.decal and p.edge > 0 and any(n >= 0 and zs[n] < p.z and not parts[n].decal and parts[n].mat != p.mat for n in nb):
                out[yy, xx] = rgb[yy, xx] * (1 - 0.42 * p.edge)
    # pinholes (a transparent pixel boxed in on all eight sides, e.g. between the lantern ring and the sleeve)
    # are filled with the darkest neighbour, so they read as line work rather than dropouts
    for yy in range(1, cell - 1):
        for xx in range(1, cell - 1):
            if not solid[yy, xx] and solid[yy - 1 : yy + 2, xx - 1 : xx + 2].sum() == 8:
                nb = [out[yy + dy, xx + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]
                out[yy, xx] = min(nb, key=lambda c: float(c.sum())) * 0.9
                solid[yy, xx] = True
    a = np.where(solid, 255, 0).astype(np.uint8)
    img = np.dstack([np.clip(np.round(out), 0, 255).astype(np.uint8), a])
    img[~solid] = 0
    return Image.fromarray(img, "RGBA")


# ── the penguin ──────────────────────────────────────────────────────────
FLOOR = 88.0
CX = 48.0


LS = 1.3  # lantern scale (the cast carry lanterns about 9x15 px)


def lantern(anchor, swing, z, name="lantern"):
    """A little iron-and-brass lantern hanging from anchor (the flipper tip). Drawn in a 1.0 frame and scaled
    by LS about the anchor through the group transform."""
    ax, ay = anchor
    base_xf = rot_xf(ax, ay, swing)

    def xf(X, Y):
        lx, ly = base_xf(X, Y)
        return ax + (lx - ax) / LS, ay + (ly - ay) / LS
    top = ay + 3.0
    P = []
    P.append(Part(name + "-ring", Ell(ax, ay + 1.4, 1.9, 1.9), "iron", z, xf=xf, edge=0.0))
    P.append(Part(name + "-cap", Poly([(ax - 3.2, top + 2.2), (ax - 1.6, top), (ax + 1.6, top), (ax + 3.2, top + 2.2)]), "iron", z + 0.1, xf=xf))
    P.append(Part(name + "-glass", Ell(ax, top + 6.0, 3.3, 4.2), "glass", z + 0.2, xf=xf, clip=(HalfPlane(0, 1, top + 9.4), HalfPlane(0, -1, -(top + 2.0))), flat=0.25))
    P.append(Part(name + "-flame", Ell(ax, top + 6.2, 1.3, 2.0), "glow", z + 0.3, xf=xf, decal=True, flat=0.6))
    P.append(Part(name + "-bar", Poly([(ax - 0.5, top + 2.0), (ax + 0.5, top + 2.0), (ax + 0.5, top + 9.6), (ax - 0.5, top + 9.6)]), "brass", z + 0.35, xf=xf, decal=True, alpha=0.55))
    P.append(Part(name + "-base", Poly([(ax - 3.6, top + 9.4), (ax + 3.6, top + 9.4), (ax + 3.0, top + 11.4), (ax - 3.0, top + 11.4)]), "brass", z + 0.4, xf=xf))
    return P


def front(phase: int, blink: bool = False, breath: float = 0.0, idle: bool = False) -> list[Part]:
    tilt = (0.0 if idle else [5.0, 0.0, -5.0, 0.0][phase])
    bob = (breath if idle else [0.0, -1.0, 0.0, -1.0][phase])
    B = rot_xf(CX, 47.0, tilt, 0.0, bob)
    H = rot_xf(CX, 47.0, tilt * 0.6, 0.0, bob)  # the head tilts a little less than the body
    P: list[Part] = []
    # feet: the planted foot stays on the floor, the other lifts
    lift = (0, 0) if idle else [(0, 1.6), (0, 0.8), (1.6, 0), (0.8, 0)][phase]
    for i, (fx, l) in enumerate(((41.5, lift[0]), (54.5, lift[1]))):
        P.append(Part(f"foot{i}", Ell(fx, FLOOR - 2.6 - l, 5.6, 2.6), "orange", 3, ao=0.0))
        for t in (-2.6, 0.0, 2.6):  # toes
            P.append(Part(f"toe{i}{t}", Ell(fx + t, FLOOR - 1.4 - l, 1.6, 1.4), "orange", 3.1, decal=True, flat=0.2))
    body = Ell(CX, 65.0, 16.0, 21.0)
    P.append(Part("body", body, "black", 10, xf=B))
    P.append(Part("belly", Ell(CX, 67.0, 12.5, 18.5), "white", 10.5, xf=B, clip=(body,), decal=True))
    coat = Ell(CX, 65.0, 17.6, 20.2)
    vcut = Poly([(CX - 1.5, 50.0), (CX + 1.5, 50.0), (CX + 8.5, 86.0), (CX - 8.5, 86.0)])
    hem = HalfPlane(0, 1, 83.2)
    P.append(Part("coat", coat, "coat", 20, xf=B, clip=(hem,), cut=(vcut,), ao=0.18))
    # lapels: a darker turned-back facing along the opening
    for sgn in (-1, 1):
        lap = Poly([(CX + sgn * 1.5, 50.0), (CX + sgn * 6.5, 51.0), (CX + sgn * 8.0, 60.0), (CX + sgn * 4.0, 62.0)])
        P.append(Part(f"lapel{sgn}", lap, "coatin", 20.5, xf=B, clip=(coat,), cut=(vcut,), edge=0.6))
        for k, ty in enumerate((63.0, 70.0, 77.0)):
            tx = CX + sgn * (2.0 + (ty - 50.0) * 0.194 + 2.4)
            P.append(Part(f"toggle{sgn}{k}", Ell(tx, ty, 1.5, 1.1), "toggle", 21, xf=B, decal=True))
    # flippers in coat sleeves; the right flipper (viewer's left) carries the lantern
    swing = 0.0 if idle else [-4.0, 0.0, 4.0, 0.0][phase]
    sl = Ell(31.6, 60.0, 4.2, 10.0, 22.0)
    sr = Ell(64.4, 60.0, 4.2, 10.0, -22.0)
    P.append(Part("sleeveL", sl, "coat", 22, xf=B))
    P.append(Part("sleeveR", sr, "coat", 22, xf=B))
    P.append(Part("tipL", Ell(28.4, 68.0, 2.6, 2.6), "black", 22.5, xf=B, clip=(sl,)))
    P.append(Part("tipR", Ell(67.6, 68.0, 2.6, 2.6), "black", 22.5, xf=B, clip=(sr,)))
    P.append(Part("cuffL", Poly([(25.0, 64.0), (33.0, 66.8), (32.6, 67.8), (24.6, 65.0)]), "coatin", 22.6, xf=B, clip=(sl,), decal=True))
    P.append(Part("cuffR", Poly([(71.0, 64.0), (63.0, 66.8), (63.4, 67.8), (71.4, 65.0)]), "coatin", 22.6, xf=B, clip=(sr,), decal=True))
    anchor = B.fwd(28.0, 66.0)
    P += lantern(anchor, swing, 40)
    # head
    head = Ell(CX, 35.0, 15.2, 14.2)
    P.append(Part("head", head, "black", 30, xf=H))
    mask_shapes = [Ell(CX - 4.6, 37.0, 7.0, 7.4), Ell(CX + 4.6, 37.0, 7.0, 7.4), Ell(CX, 42.0, 9.6, 6.4)]
    for k, ms in enumerate(mask_shapes):
        P.append(Part(f"face{k}", ms, "white", 30.5 + k * 0.01, xf=H, clip=(head,), decal=True))
    if blink:
        for sgn in (-1, 1):
            P.append(Part(f"lid{sgn}", Ell(CX + sgn * 4.6, 37.6, 2.0, 0.7), "eye", 31, xf=H, decal=True, flat=1.0))
    else:
        for sgn in (-1, 1):
            P.append(Part(f"eye{sgn}", Ell(CX + sgn * 4.6, 37.2, 1.7, 2.2), "eye", 31, xf=H, decal=True))
            P.append(Part(f"spark{sgn}", Ell(CX + sgn * 4.6 - 0.6, 36.4, 0.62, 0.62), "spark", 31.2, xf=H, decal=True, flat=1.0))
    for sgn in (-1, 1):
        P.append(Part(f"blush{sgn}", Ell(CX + sgn * 8.6, 41.6, 2.4, 1.4), "blush", 31.3, xf=H, decal=True, alpha=0.75, flat=1.0))
    P.append(Part("beak", Ell(CX, 42.0, 3.3, 2.1), "orange", 32, xf=H, edge=0.0))
    P.append(Part("beaklo", Ell(CX, 43.6, 2.0, 1.1), "orange", 32.1, xf=H, decal=True, flat=0.0))
    # scarf
    P.append(Part("scarf", Ell(CX, 48.4, 12.6, 3.5), "scarf", 35, xf=B))
    for k in range(-3, 4):
        P.append(Part(f"knit{k}", Ell(CX + k * 3.4, 48.8, 0.6, 2.2), "scarfdk", 35.1, xf=B, decal=True, alpha=0.5, clip=(Ell(CX, 48.4, 12.6, 3.5),)))
    tail = Poly([(55.6, 50.4), (60.0, 50.4), (61.8, 60.4), (57.4, 61.0)])
    P.append(Part("scarftail", tail, "scarf", 36, xf=B))
    for k in range(3):
        fx = 57.8 + k * 1.4
        P.append(Part(f"fringe{k}", Poly([(fx - 0.5, 60.4), (fx + 0.5, 60.4), (fx + 0.6, 62.6), (fx - 0.4, 62.6)]), "scarfdk", 36.1, xf=B))
    return P


def side(phase: int, blink: bool = False, breath: float = 0.0, idle: bool = False) -> list[Part]:
    """Facing left (the right-facing row is this mirrored)."""
    tilt = 0.0 if idle else [-3.0, 0.0, 3.0, 0.0][phase]
    bob = breath if idle else [0.0, -1.0, 0.0, -1.0][phase]
    B = rot_xf(49.0, 50.0, tilt, 0.0, bob)
    H = rot_xf(49.0, 50.0, tilt * 0.6, 0.0, bob)
    P: list[Part] = []
    feet = [((43.0, 0.0), (55.0, 1.4)), ((46.0, 0.0), (51.0, 1.2)), ((55.0, 0.0), (43.0, 1.4)), ((51.0, 0.0), (46.0, 1.2))][phase] if not idle else ((44.0, 0.0), (52.0, 0.0))
    for i, (fx, l) in enumerate(feet):
        z = 4 if i == 0 else 2
        P.append(Part(f"foot{i}", Poly([(fx - 7.0, FLOOR - 0.0 - l), (fx + 3.0, FLOOR - l), (fx + 3.0, FLOOR - 3.6 - l), (fx - 3.0, FLOOR - 4.2 - l), (fx - 6.8, FLOOR - 2.2 - l)], Ell(fx - 2, FLOOR - 2 - l, 5.2, 2.6)), "orange", z))
    body = Ell(49.0, 65.0, 14.2, 21.0)
    P.append(Part("tail", Poly([(58.0, 79.0), (63.6, 85.0), (58.6, 85.4)]), "black", 5, xf=B))
    P.append(Part("body", body, "black", 10, xf=B))
    P.append(Part("belly", Ell(42.0, 67.0, 9.5, 18.5), "white", 10.5, xf=B, clip=(body,), decal=True))
    coat = Ell(50.0, 65.0, 15.4, 20.2)
    front_cut = Poly([(30.0, 50.0), (40.6, 50.0), (43.4, 86.0), (30.0, 86.0)])
    P.append(Part("coat", coat, "coat", 20, xf=B, clip=(HalfPlane(0, 1, 83.2),), cut=(front_cut,), ao=0.18))
    P.append(Part("lapel", Poly([(40.6, 50.0), (45.5, 51.0), (45.0, 60.0), (41.4, 61.0)]), "coatin", 20.5, xf=B, clip=(coat,), cut=(front_cut,), edge=0.6))
    for k, ty in enumerate((64.0, 71.0, 78.0)):
        P.append(Part(f"toggle{k}", Ell(43.0 + (ty - 50) * 0.078, ty, 1.3, 1.1), "toggle", 21, xf=B, decal=True))
    P.append(Part("pocket", Poly([(50.0, 72.0), (57.0, 72.0), (57.0, 73.2), (50.0, 73.2)]), "coatin", 21, xf=B, decal=True))
    # near flipper reaches forward with the lantern
    swing = 0.0 if idle else [3.0, 0.0, -3.0, 0.0][phase]
    sl = Ell(42.0, 60.0, 4.4, 10.4, 55.0)
    P.append(Part("sleeve", sl, "coat", 24, xf=B))
    P.append(Part("tip", Ell(33.4, 65.8, 2.7, 2.7), "black", 24.5, xf=B, clip=(sl,)))
    P.append(Part("cuff", Ell(35.8, 64.3, 4.6, 0.7, 55.0), "coatin", 24.6, xf=B, clip=(sl,), decal=True))
    anchor = B.fwd(32.2, 66.4)
    P += lantern(anchor, swing, 40)
    head = Ell(46.0, 35.5, 14.0, 14.2)
    P.append(Part("head", head, "black", 30, xf=H))
    P.append(Part("face", Ell(39.6, 38.0, 8.6, 8.4), "white", 30.5, xf=H, clip=(head,), decal=True))
    P.append(Part("face2", Ell(44.0, 43.0, 8.0, 5.0), "white", 30.51, xf=H, clip=(head,), decal=True))
    if blink:
        P.append(Part("lid", Ell(38.4, 37.6, 2.0, 0.7), "eye", 31, xf=H, decal=True, flat=1.0))
    else:
        P.append(Part("eye", Ell(38.4, 37.2, 1.6, 2.2), "eye", 31, xf=H, decal=True))
        P.append(Part("spark", Ell(37.9, 36.4, 0.62, 0.62), "spark", 31.2, xf=H, decal=True, flat=1.0))
    P.append(Part("blush", Ell(41.4, 41.8, 2.2, 1.3), "blush", 31.3, xf=H, decal=True, alpha=0.75, flat=1.0))
    P.append(Part("beak", Poly([(34.0, 39.2), (28.2, 41.4), (34.0, 43.8)], Ell(31.0, 41.4, 3.0, 2.2)), "orange", 32, xf=H, edge=0.0))
    P.append(Part("beak2", Ell(33.4, 41.5, 2.2, 2.2), "orange", 32.05, xf=H, decal=True))
    P.append(Part("scarf", Ell(47.0, 48.8, 11.4, 3.4), "scarf", 35, xf=B))
    for k in range(-3, 4):
        P.append(Part(f"knit{k}", Ell(47.0 + k * 3.2, 49.2, 0.6, 2.1), "scarfdk", 35.1, xf=B, decal=True, alpha=0.5, clip=(Ell(47.0, 48.8, 11.4, 3.4),)))
    flap = [1.0, 0.0, -1.0, 0.0][phase] if not idle else 0.0
    P.append(Part("scarftail", Poly([(55.0, 48.6), (58.0, 49.0), (63.0 + flap, 55.4), (60.0 + flap, 57.0)]), "scarf", 34, xf=B))
    for k in range(3):
        fx, fy = 60.2 + flap + k * 1.1, 55.6 + k * 0.6
        P.append(Part(f"fringe{k}", Poly([(fx - 0.5, fy), (fx + 0.5, fy - 0.3), (fx + 1.0, fy + 1.8), (fx + 0.0, fy + 2.1)]), "scarfdk", 34.1, xf=B))
    return P


def back(phase: int) -> list[Part]:
    tilt = [-5.0, 0.0, 5.0, 0.0][phase]
    bob = [0.0, -1.0, 0.0, -1.0][phase]
    B = rot_xf(CX, 47.0, tilt, 0.0, bob)
    H = rot_xf(CX, 47.0, tilt * 0.6, 0.0, bob)
    P: list[Part] = []
    lift = [(1.6, 0), (0.8, 0), (0, 1.6), (0, 0.8)][phase]
    for i, (fx, l) in enumerate(((41.5, lift[0]), (54.5, lift[1]))):
        P.append(Part(f"foot{i}", Ell(fx, FLOOR - 2.4 - l, 5.0, 2.4), "orange", 3))
    P.append(Part("tail", Poly([(44.0, 80.0), (52.0, 80.0), (48.0, 86.6)]), "black", 25, xf=B))
    body = Ell(CX, 65.0, 16.0, 21.0)
    P.append(Part("body", body, "black", 10, xf=B))
    coat = Ell(CX, 65.0, 17.6, 20.2)
    P.append(Part("coat", coat, "coat", 20, xf=B, clip=(HalfPlane(0, 1, 83.2),), ao=0.18))
    P.append(Part("vent", Poly([(CX - 0.45, 70.0), (CX + 0.45, 70.0), (CX + 0.45, 83.2), (CX - 0.45, 83.2)]), "coatin", 20.4, xf=B, decal=True))
    P.append(Part("belt", Poly([(CX - 8.0, 66.0), (CX + 8.0, 66.0), (CX + 8.0, 69.0), (CX - 8.0, 69.0)]), "coatin", 20.5, xf=B, clip=(coat,)))
    for sgn in (-1, 1):
        P.append(Part(f"btn{sgn}", Ell(CX + sgn * 5.6, 67.5, 1.2, 1.1), "toggle", 20.6, xf=B, decal=True))
    swing = [4.0, 0.0, -4.0, 0.0][phase]
    sl = Ell(31.6, 60.0, 4.2, 10.0, 22.0)
    sr = Ell(64.4, 60.0, 4.2, 10.0, -22.0)
    P.append(Part("sleeveL", sl, "coat", 22, xf=B))
    P.append(Part("sleeveR", sr, "coat", 22, xf=B))
    P.append(Part("tipL", Ell(28.4, 68.0, 2.6, 2.6), "black", 22.5, xf=B, clip=(sl,)))
    P.append(Part("tipR", Ell(67.6, 68.0, 2.6, 2.6), "black", 22.5, xf=B, clip=(sr,)))
    anchor = B.fwd(68.0, 66.0)
    P += lantern(anchor, swing, 40)
    head = Ell(CX, 35.0, 15.2, 14.2)
    P.append(Part("head", head, "black", 30, xf=H))
    P.append(Part("scarf", Ell(CX, 48.4, 12.6, 3.5), "scarf", 35, xf=B))
    for k in range(-3, 4):
        P.append(Part(f"knit{k}", Ell(CX + k * 3.4, 48.8, 0.6, 2.2), "scarfdk", 35.1, xf=B, decal=True, alpha=0.5, clip=(Ell(CX, 48.4, 12.6, 3.5),)))
    P.append(Part("scarftail", Poly([(43.0, 50.5), (47.0, 50.5), (45.6, 61.0), (41.4, 60.4)]), "scarf", 36, xf=B))
    for k in range(3):
        fx = 42.4 + k * 1.4
        P.append(Part(f"fringe{k}", Poly([(fx - 0.5, 60.4), (fx + 0.5, 60.6), (fx + 0.5, 62.8), (fx - 0.5, 62.6)]), "scarfdk", 36.1, xf=B))
    return P


def main() -> None:
    C, I = 96, 128
    walk = Image.new("RGBA", (C * 4, C * 4), (0, 0, 0, 0))
    for c in range(4):
        walk.alpha_composite(render(front(c), C, 1.0, seed=11 + c), (c * C, 0))
        left = render(side(c), C, 1.0, seed=21 + c)
        walk.alpha_composite(left, (c * C, C))
        walk.alpha_composite(left.transpose(Image.FLIP_LEFT_RIGHT), (c * C, 2 * C))
        walk.alpha_composite(render(back(c), C, 1.0, seed=31 + c), (c * C, 3 * C))
    walk.save(SCOUTS / "lynx-walk.png", optimize=True)
    k = I / C
    idle = Image.new("RGBA", (I * 2, I * 2), (0, 0, 0, 0))
    poses = [dict(breath=0.0), dict(breath=0.5), dict(breath=0.0, blink=True), dict(breath=0.5)]
    for i, kw in enumerate(poses):
        idle.alpha_composite(render(front(0, idle=True, **kw), I, k, seed=41), ((i % 2) * I, (i // 2) * I))
    idle.save(SCOUTS / "lynx-idle.png", optimize=True)
    idle.crop((0, 0, I, I)).resize((C, C), Image.BOX).save(SCOUTS / "lynx.png", optimize=True)
    _load("sideidle", "make-side-idle.py").build(SCOUTS / "lynx-walk.png", SCOUTS / "lynx-idle-side.png")
    print("lynx-walk.png, lynx-idle.png, lynx.png, lynx-idle-side.png written (penguin)")


if __name__ == "__main__":
    import sys

    main()
    if "--coats" in sys.argv:
        cv = _load("coatvars", "make-coat-variants.py")
        for coat in cv.PALETTE:
            for kk in cv.GRID:
                cv.save_exact(cv.variant("lynx", kk, coat), cv.OUT / f"lynx-{coat}-{kk}.png")
        print("penguin coats written")
