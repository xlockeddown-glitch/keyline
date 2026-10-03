#!/usr/bin/env python3
"""0.0.51: The Giraffe — a new character, painted from scratch with the Penguin's renderer (draw-penguin.py).

Same method as the 0.0.49 Penguin: every part is a soft volume lit from the upper left, shaded through a
three-tone ramp per material in a few bands, supersampled 4x4, reduced to hard pixel edges and given the
house outline. One 96-unit design space (floor y=88, centred on x=48); the idle sheet is the same drawing at
128/96.

The character: a cute chibi giraffe — honey fur with soft caramel patches, a cream muzzle, small dark dot eyes
with one catchlight (nothing staring), rosy cheeks, two short ossicones with cocoa knobs, little leaf ears, a
cocoa mane — in a soft teal duffle coat with wooden toggles and a rounded collar the neck rises out of. The
neck is deliberately short (a chibi neck: about a head's height) so the head stays well inside the cell. The
lantern hangs from the right hand like the rest of the cast. Walk is a gentle lope: long, easy strides, a soft
bob, the neck swaying a little less than the body.

Writes giraffe-walk.png, giraffe-idle.png, giraffe.png, giraffe-idle-side.png; `--coats` also writes the four
print-shop coats. Deterministic. Then `npm run qa:sprites`."""
from __future__ import annotations

import importlib.util
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCOUTS = ROOT / "public" / "sprites" / "scouts"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


pg = _load("penguin", "draw-penguin.py")
Ell, Poly, HalfPlane, Part, rot_xf, render, lantern = pg.Ell, pg.Poly, pg.HalfPlane, pg.Part, pg.rot_xf, pg.render, pg.lantern

pg.MAT.update({
    "fur": ((196, 142, 74), (234, 190, 114), (250, 224, 166)),
    "cream": ((206, 186, 152), (244, 232, 206), (255, 249, 234)),
    "spot": ((146, 84, 42), (184, 114, 60), (210, 146, 88)),
    "cocoa": ((54, 34, 28), (88, 58, 42), (128, 90, 64)),
    "coat": ((28, 70, 78), (48, 110, 114), (94, 154, 150)),
    "coatin": ((22, 56, 64), (36, 86, 92), (58, 114, 116)),
    "earin": ((214, 136, 128), (236, 166, 156), (248, 194, 182)),
})

FLOOR = 88.0
CX = 48.0


def limb(x0, y0, x1, y1, r, mat, z, name, xf=None, **kw):
    """A soft capsule from (x0,y0) to (x1,y1)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ln = math.hypot(x1 - x0, y1 - y0) / 2 + r * 0.6
    ang = math.degrees(math.atan2(-(x1 - x0), y1 - y0))
    return Part(name, Ell(cx, cy, r, ln, ang), mat, z, xf=xf, **kw)


def spots(P, items, mat, z, xf, clip):
    for k, (x, y, rx, ry, rot) in enumerate(items):
        P.append(Part(f"spot{z}{k}", Ell(x, y, rx, ry, rot), mat, z + k * 0.001, xf=xf, clip=(clip,), decal=True, flat=0.15))


def face_front(P, H, blink):
    head = Ell(CX, 22.4, 11.8, 10.4)
    # ears (behind the head), ossicones
    for sgn in (-1, 1):
        ear = Ell(CX + sgn * 13.6, 18.6, 4.8, 2.2, sgn * 24.0)
        P.append(Part(f"ear{sgn}", ear, "fur", 29, xf=H))
        P.append(Part(f"earin{sgn}", Ell(CX + sgn * 14.0, 18.8, 3.0, 1.0, sgn * 24.0), "earin", 29.1, xf=H, clip=(ear,), decal=True, flat=0.4))
        bx, tx = CX + sgn * 3.6, CX + sgn * 4.6
        P.append(Part(f"oss{sgn}", Poly([(bx - 1.3, 16.0), (bx + 1.3, 16.0), (tx + 1.0, 11.0), (tx - 1.0, 11.0)], Ell((bx + tx) / 2, 13.5, 1.4, 3.0)), "fur", 28.5, xf=H))
        P.append(Part(f"knob{sgn}", Ell(tx, 10.6, 2.0, 1.8), "cocoa", 28.6, xf=H))
    P.append(Part("head", head, "fur", 30, xf=H))
    spots(P, [(CX - 7.2, 16.8, 1.8, 1.4, 20), (CX + 7.6, 17.6, 1.6, 1.3, -15), (CX + 0.4, 14.2, 1.7, 1.1, 0)], "spot", 30.2, H, head)
    P.append(Part("muzzle", Ell(CX, 28.0, 8.2, 5.4), "cream", 31, xf=H, edge=0.0))
    for sgn in (-1, 1):
        P.append(Part(f"nostril{sgn}", Ell(CX + sgn * 2.6, 27.2, 0.8, 0.6), "cocoa", 31.5, xf=H, decal=True, flat=1.0))
        if blink:
            P.append(Part(f"lid{sgn}", Ell(CX + sgn * 5.2, 21.4, 2.0, 0.7), "eye", 31.2, xf=H, decal=True, flat=1.0))
        else:
            P.append(Part(f"eye{sgn}", Ell(CX + sgn * 5.2, 21.0, 1.7, 2.1), "eye", 31.2, xf=H, decal=True))
            P.append(Part(f"spark{sgn}", Ell(CX + sgn * 5.2 - 0.6, 20.2, 0.62, 0.62), "spark", 31.3, xf=H, decal=True, flat=1.0))
        P.append(Part(f"blush{sgn}", Ell(CX + sgn * 8.6, 25.0, 2.3, 1.3), "blush", 31.4, xf=H, decal=True, alpha=0.75, flat=1.0))
    P.append(Part("smile", Poly([(CX - 1.4, 30.4), (CX + 1.4, 30.4), (CX + 0.8, 31.1), (CX - 0.8, 31.1)]), "cocoa", 31.5, xf=H, decal=True, flat=1.0, alpha=0.7))


def neck_front(P, N, back=False):
    neck = Poly([(CX - 5.4, 47.0), (CX + 5.4, 47.0), (CX + 4.4, 29.0), (CX - 4.4, 29.0)], Ell(CX, 38.0, 5.8, 11.0))
    P.append(Part("neck", neck, "fur", 26, xf=N))
    if back:
        spots(P, [(CX + 1.8, 42.0, 2.3, 1.9, -15), (CX - 2.2, 37.0, 2.0, 1.7, 10), (CX + 1.6, 32.4, 1.5, 1.3, 0)], "spot", 26.2, N, neck)
    else:
        spots(P, [(CX - 2.0, 41.6, 2.3, 1.9, 15), (CX + 2.4, 36.4, 2.0, 1.7, -10), (CX - 1.8, 32.4, 1.5, 1.3, 0)], "spot", 26.2, N, neck)


def legs_front(P, lift, back=False):
    for i, (lx, l) in enumerate(((CX - 5.6, lift[0]), (CX + 5.6, lift[1]))):
        leg = Poly([(lx - 3.0, 74.0), (lx + 3.0, 74.0), (lx + 2.6, 85.0 - l), (lx - 2.6, 85.0 - l)], Ell(lx, 80.0, 3.2, 7.0))
        P.append(Part(f"leg{i}", leg, "fur", 4))
        spots(P, [(lx + (0.6 if i else -0.6), 81.0 - l, 1.3, 1.1, 0)], "spot", 4.2 + i, None, leg)
        P.append(Part(f"hoof{i}", Ell(lx, FLOOR - 2.2 - l, 3.4, 2.2), "cocoa", 5))


def coat_front(P, B, back=False):
    body = Ell(CX, 63.0, 11.6, 14.6)
    P.append(Part("body", body, "fur", 10, xf=B))
    coat = Ell(CX, 63.0, 13.2, 16.4)
    hem = HalfPlane(0, 1, 79.0)
    P.append(Part("coat", coat, "coat", 20, xf=B, clip=(hem,), ao=0.16))
    if back:
        P.append(Part("vent", Poly([(CX - 0.45, 69.0), (CX + 0.45, 69.0), (CX + 0.45, 79.0), (CX - 0.45, 79.0)]), "coatin", 20.4, xf=B, decal=True))
        P.append(Part("belt", Poly([(CX - 7.0, 64.0), (CX + 7.0, 64.0), (CX + 7.0, 66.6), (CX - 7.0, 66.6)]), "coatin", 20.5, xf=B, clip=(coat,)))
        for sgn in (-1, 1):
            P.append(Part(f"btn{sgn}", Ell(CX + sgn * 5.0, 65.3, 1.1, 1.0), "toggle", 20.6, xf=B, decal=True))
        P.append(Part("hood", Ell(CX, 52.0, 8.6, 4.6), "coatin", 20.7, xf=B, clip=(coat,), edge=0.6))
    else:
        P.append(Part("placket", Poly([(CX - 0.5, 50.0), (CX + 0.5, 50.0), (CX + 0.5, 79.0), (CX - 0.5, 79.0)]), "coatin", 20.4, xf=B, decal=True, alpha=0.8))
        for k, ty in enumerate((55.5, 62.0, 68.5)):
            P.append(Part(f"toggle{k}", Ell(CX + 0.3, ty, 2.0, 0.9), "toggle", 21, xf=B, decal=True))
        for sgn in (-1, 1):
            P.append(Part(f"pocket{sgn}", Poly([(CX + sgn * 4.0, 71.0), (CX + sgn * 10.0, 71.0), (CX + sgn * 10.0, 72.3), (CX + sgn * 4.0, 72.3)]), "coatin", 21, xf=B, decal=True))
    # rounded collar the neck rises out of
    P.append(Part("collar", Ell(CX, 47.2, 9.4, 3.6), "coatin", 27, xf=B, edge=0.7))


def front(phase: int, blink: bool = False, breath: float = 0.0, idle: bool = False) -> list[Part]:
    tilt = 0.0 if idle else [3.0, 0.0, -3.0, 0.0][phase]
    bob = breath if idle else [0.0, -1.2, 0.0, -1.2][phase]
    B = rot_xf(CX, 50.0, tilt, 0.0, bob)
    N = rot_xf(CX, 50.0, tilt * 0.55, 0.0, bob)
    H = rot_xf(CX, 50.0, tilt * 0.4, 0.0, bob)
    P: list[Part] = []
    lift = (0, 0) if idle else [(0, 1.8), (0, 0.8), (1.8, 0), (0.8, 0)][phase]
    legs_front(P, lift)
    coat_front(P, B)
    swing = 0.0 if idle else [-4.0, 0.0, 4.0, 0.0][phase]
    sl = Ell(CX - 14.0, 58.6, 3.7, 9.0, 14.0)
    sr = Ell(CX + 14.0, 58.6, 3.7, 9.0, -14.0)
    P.append(Part("sleeveL", sl, "coat", 22, xf=B))
    P.append(Part("sleeveR", sr, "coat", 22, xf=B))
    P.append(Part("handL", Ell(CX - 16.4, 67.0, 2.5, 2.4), "fur", 21.5, xf=B))
    P.append(Part("handR", Ell(CX + 16.4, 67.0, 2.5, 2.4), "fur", 21.5, xf=B))
    P.append(Part("cuffL", Poly([(CX - 19.6, 64.0), (CX - 12.0, 65.6), (CX - 12.2, 66.6), (CX - 19.8, 65.0)]), "coatin", 22.6, xf=B, clip=(sl,), decal=True))
    P.append(Part("cuffR", Poly([(CX + 19.6, 64.0), (CX + 12.0, 65.6), (CX + 12.2, 66.6), (CX + 19.8, 65.0)]), "coatin", 22.6, xf=B, clip=(sr,), decal=True))
    P += lantern(B.fwd(CX - 16.6, 67.4), swing, 40)
    neck_front(P, N)
    face_front(P, H, blink)
    return P


def side(phase: int, blink: bool = False, breath: float = 0.0, idle: bool = False) -> list[Part]:
    """Facing left (the right-facing row is this mirrored)."""
    tilt = 0.0 if idle else [-2.0, 0.0, 2.0, 0.0][phase]
    bob = breath if idle else [0.0, -1.2, 0.0, -1.2][phase]
    B = rot_xf(50.0, 52.0, tilt, 0.0, bob)
    N = rot_xf(50.0, 52.0, tilt * 0.55, 0.0, bob)
    H = rot_xf(50.0, 52.0, tilt * 0.4, 0.0, bob)
    P: list[Part] = []
    # long easy strides: (near hoof x, lift), (far hoof x, lift)
    strides = [((43.0, 0.0), (57.0, 1.4)), ((47.0, 0.0), (53.0, 1.8)), ((57.0, 0.0), (43.0, 1.4)), ((53.0, 0.0), (47.0, 1.8))]
    feet = ((46.5, 0.0), (52.5, 0.0)) if idle else strides[phase]
    for i, (fx, l) in enumerate(feet):
        hx = 47.6 if i == 0 else 52.4
        z = 6 if i == 0 else 2
        mat = "fur"
        P.append(limb(hx, 73.0, fx, 84.5 - l, 2.9, mat, z, f"leg{i}"))
        P.append(Part(f"hoof{i}", Poly([(fx - 3.4, FLOOR - l), (fx + 2.8, FLOOR - l), (fx + 2.6, FLOOR - 3.8 - l), (fx - 3.0, FLOOR - 3.8 - l)], Ell(fx - 0.3, FLOOR - 2 - l, 3.2, 2.2)), "cocoa", z + 0.5))
    # tail with a cocoa tuft
    sway = 0.0 if idle else [0.8, 0.0, -0.8, 0.0][phase]
    P.append(limb(61.0, 64.0, 64.6 + sway, 75.0, 0.9, "fur", 8, "tail", xf=B))
    P.append(Part("tuft", Ell(65.0 + sway, 76.6, 1.7, 2.6), "cocoa", 8.2, xf=B))
    body = Ell(51.0, 63.0, 10.8, 14.6)
    P.append(Part("body", body, "fur", 10, xf=B))
    coat = Ell(51.0, 63.0, 12.2, 16.4)
    P.append(Part("coat", coat, "coat", 20, xf=B, clip=(HalfPlane(0, 1, 79.0),), ao=0.16))
    P.append(Part("placket", Poly([(40.6, 52.0), (41.6, 52.0), (40.2, 79.0), (39.2, 79.0)]), "coatin", 20.4, xf=B, clip=(coat,), decal=True, alpha=0.8))
    for k, ty in enumerate((56.0, 62.5, 69.0)):
        P.append(Part(f"toggle{k}", Ell(41.4 - (ty - 56) * 0.04, ty, 1.6, 0.9), "toggle", 21, xf=B, decal=True))
    P.append(Part("pocket", Poly([(49.0, 71.0), (56.0, 71.0), (56.0, 72.3), (49.0, 72.3)]), "coatin", 21, xf=B, decal=True))
    # the near arm reaches forward with the lantern
    swing = 0.0 if idle else [3.0, 0.0, -3.0, 0.0][phase]
    sl = Ell(44.0, 59.6, 3.9, 9.6, 48.0)
    P.append(Part("sleeve", sl, "coat", 24, xf=B))
    P.append(Part("hand", Ell(36.2, 66.0, 2.4, 2.4), "fur", 23.5, xf=B))
    P.append(Part("cuff", Ell(38.4, 64.4, 4.4, 0.7, 48.0), "coatin", 24.6, xf=B, clip=(sl,), decal=True))
    P += lantern(B.fwd(35.8, 66.4), swing, 40)
    # neck, leaning a touch forward, with the mane down the back
    neck = Poly([(43.4, 49.0), (54.0, 49.0), (49.0, 27.0), (40.6, 28.0)], Ell(47.2, 38.0, 6.4, 12.0))
    P.append(Part("mane", Poly([(52.2, 49.0), (55.0, 48.0), (49.4, 25.0), (46.6, 25.6)], Ell(51.0, 37.0, 2.4, 12.0)), "cocoa", 25.5, xf=N))
    P.append(Part("neck", neck, "fur", 26, xf=N))
    spots(P, [(45.0, 42.4, 2.2, 1.8, 20), (48.6, 36.6, 1.9, 1.6, -10), (44.0, 33.6, 1.5, 1.3, 0), (49.0, 44.6, 1.4, 1.2, 0)], "spot", 26.2, N, neck)
    # head in profile, muzzle forward
    head = Ell(42.4, 21.0, 10.8, 9.8)
    P.append(Part("ossfar", Poly([(45.4, 14.0), (47.8, 14.0), (49.2, 10.0), (47.2, 10.0)], Ell(47.4, 12.0, 1.4, 2.6)), "spot", 28.4, xf=H))
    P.append(Part("knobfar", Ell(48.4, 9.8, 1.8, 1.6), "cocoa", 28.45, xf=H))
    P.append(Part("ear", Ell(53.0, 16.6, 4.8, 2.1, -26.0), "fur", 28.5, xf=H))
    P.append(Part("earin", Ell(53.4, 16.4, 3.0, 0.9, -26.0), "earin", 28.6, xf=H, clip=(Ell(53.0, 16.6, 4.8, 2.1, -26.0),), decal=True, flat=0.4))
    P.append(Part("head", head, "fur", 30, xf=H))
    P.append(Part("oss", Poly([(41.2, 14.0), (43.8, 14.0), (44.2, 9.8), (42.0, 9.8)], Ell(42.8, 12.0, 1.4, 2.6)), "fur", 30.1, xf=H))
    P.append(Part("knob", Ell(43.1, 9.4, 2.0, 1.8), "cocoa", 30.15, xf=H))
    spots(P, [(47.6, 18.0, 1.8, 1.4, 20), (45.0, 14.6, 1.4, 1.0, 0), (49.6, 23.4, 1.4, 1.1, 0)], "spot", 30.2, H, head)
    P.append(Part("muzzle", Ell(33.4, 25.4, 7.2, 5.2, -8.0), "cream", 31, xf=H, edge=0.0))
    P.append(Part("nostril", Ell(29.0, 24.0, 0.8, 0.6), "cocoa", 31.5, xf=H, decal=True, flat=1.0))
    P.append(Part("smile", Poly([(29.8, 27.8), (32.6, 28.3), (32.4, 29.0), (29.6, 28.5)]), "cocoa", 31.5, xf=H, decal=True, flat=1.0, alpha=0.7))
    if blink:
        P.append(Part("lid", Ell(39.6, 19.8, 2.0, 0.7), "eye", 31.2, xf=H, decal=True, flat=1.0))
    else:
        P.append(Part("eye", Ell(39.6, 19.4, 1.6, 2.1), "eye", 31.2, xf=H, decal=True))
        P.append(Part("spark", Ell(39.1, 18.6, 0.62, 0.62), "spark", 31.3, xf=H, decal=True, flat=1.0))
    P.append(Part("blush", Ell(41.6, 24.2, 2.2, 1.3), "blush", 31.4, xf=H, decal=True, alpha=0.75, flat=1.0))
    P.append(Part("collar", Ell(48.6, 47.6, 8.8, 3.5), "coatin", 27, xf=B, edge=0.7))
    return P


def back(phase: int) -> list[Part]:
    tilt = [-3.0, 0.0, 3.0, 0.0][phase]
    bob = [0.0, -1.2, 0.0, -1.2][phase]
    B = rot_xf(CX, 50.0, tilt, 0.0, bob)
    N = rot_xf(CX, 50.0, tilt * 0.55, 0.0, bob)
    H = rot_xf(CX, 50.0, tilt * 0.4, 0.0, bob)
    P: list[Part] = []
    lift = [(1.8, 0), (0.8, 0), (0, 1.8), (0, 0.8)][phase]
    legs_front(P, lift, back=True)
    coat_front(P, B, back=True)
    P.append(limb(CX, 70.0, CX + [0.8, 0, -0.8, 0][phase], 79.0, 0.9, "fur", 23, "tail", xf=B))
    P.append(Part("tuft", Ell(CX + [0.8, 0, -0.8, 0][phase], 80.6, 1.7, 2.6), "cocoa", 23.2, xf=B))
    swing = [4.0, 0.0, -4.0, 0.0][phase]
    sl = Ell(CX - 14.0, 58.6, 3.7, 9.0, 14.0)
    sr = Ell(CX + 14.0, 58.6, 3.7, 9.0, -14.0)
    P.append(Part("sleeveL", sl, "coat", 22, xf=B))
    P.append(Part("sleeveR", sr, "coat", 22, xf=B))
    P.append(Part("handL", Ell(CX - 16.4, 67.0, 2.5, 2.4), "fur", 21.5, xf=B))
    P.append(Part("handR", Ell(CX + 16.4, 67.0, 2.5, 2.4), "fur", 21.5, xf=B))
    P += lantern(B.fwd(CX + 16.6, 67.4), swing, 40)
    neck_front(P, N, back=True)
    head = Ell(CX, 22.4, 11.8, 10.4)
    for sgn in (-1, 1):
        P.append(Part(f"ear{sgn}", Ell(CX + sgn * 13.6, 18.6, 4.8, 2.2, sgn * 24.0), "fur", 29, xf=H))
        bx, tx = CX + sgn * 3.6, CX + sgn * 4.6
        P.append(Part(f"oss{sgn}", Poly([(bx - 1.3, 16.0), (bx + 1.3, 16.0), (tx + 1.0, 11.0), (tx - 1.0, 11.0)], Ell((bx + tx) / 2, 13.5, 1.4, 3.0)), "fur", 30.5, xf=H))
        P.append(Part(f"knob{sgn}", Ell(tx, 10.6, 2.0, 1.8), "cocoa", 30.6, xf=H))
    P.append(Part("head", head, "fur", 30, xf=H))
    spots(P, [(CX - 5.2, 19.6, 2.2, 1.7, 20), (CX + 4.6, 25.4, 2.0, 1.5, -15), (CX + 6.4, 16.8, 1.5, 1.2, 0), (CX - 2.2, 27.8, 1.6, 1.3, 0)], "spot", 30.2, H, head)
    return P


def main() -> None:
    C, I = 96, 128
    walk = Image.new("RGBA", (C * 4, C * 4), (0, 0, 0, 0))
    for c in range(4):
        walk.alpha_composite(render(front(c), C, 1.0, seed=51 + c), (c * C, 0))
        left = render(side(c), C, 1.0, seed=61 + c)
        walk.alpha_composite(left, (c * C, C))
        walk.alpha_composite(left.transpose(Image.FLIP_LEFT_RIGHT), (c * C, 2 * C))
        walk.alpha_composite(render(back(c), C, 1.0, seed=71 + c), (c * C, 3 * C))
    walk.save(SCOUTS / "giraffe-walk.png", optimize=True)
    k = I / C
    idle = Image.new("RGBA", (I * 2, I * 2), (0, 0, 0, 0))
    poses = [dict(breath=0.0), dict(breath=0.5), dict(breath=0.0, blink=True), dict(breath=0.5)]
    for i, kw in enumerate(poses):
        idle.alpha_composite(render(front(0, idle=True, **kw), I, k, seed=81), ((i % 2) * I, (i // 2) * I))
    idle.save(SCOUTS / "giraffe-idle.png", optimize=True)
    idle.crop((0, 0, I, I)).resize((C, C), Image.BOX).save(SCOUTS / "giraffe.png", optimize=True)
    _load("sideidle", "make-side-idle.py").build(SCOUTS / "giraffe-walk.png", SCOUTS / "giraffe-idle-side.png")
    print("giraffe-walk.png, giraffe-idle.png, giraffe.png, giraffe-idle-side.png written")


if __name__ == "__main__":
    main()
    if "--coats" in sys.argv:
        cv = _load("coatvars", "make-coat-variants.py")
        for coat in cv.PALETTE:
            for kk in cv.GRID:
                cv.save_exact(cv.variant("giraffe", kk, coat), cv.OUT / f"giraffe-{coat}-{kk}.png")
        print("giraffe coats written")
