#!/usr/bin/env python3
"""0.0.49 (art WIP, awaiting approval): the Lynx redrawn on the Tabby's hand-painted body.

The 0.0.37 lynx was the fox run through filters (stretched columns, a fox muzzle, speckle). This one starts
from the cat sheets (a feline face, the same painterly shading, timing and floor line as the house art) and
paints the lynx on top, pose by pose:
  * tall black ear tufts, black-rimmed ears with pale insides;
  * a facial ruff: pale cheek fringe flaring past the jaw in pointed locks, with the dark lynx bar through it;
  * a short bobbed tail with a black tip (the long tabby tail is lifted off; front walk shows none);
  * bigger paws: hands one pixel fuller, boots a pixel broader (the floor line never moves);
  * a spotted tawny coat of fur: tabby orange becomes a grey-buff, stripes soften and dark spots sit on top;
  * amber eyes; and the Lynx's own charcoal field coat (the cat's brown coat recoloured, folds kept).
Writes lynx-walk.png, lynx-idle.png, lynx.png, then lynx-idle-side.png (make-side-idle.build) and the
lynx print-shop coats (make-coat-variants). Deterministic. Then `npm run qa:sprites`."""
from __future__ import annotations

import importlib.util
import math
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCOUTS = ROOT / "public" / "sprites" / "scouts"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


_lab = _load("labfns", "fix-cat-coat.py")
_old = _load("lynx37", "make-lynx.py")
cv = _load("coatvars", "make-coat-variants.py")
side = _load("sideidle", "make-side-idle.py")
to_lab, from_lab, hue = _lab.to_lab, _lab.from_lab, _lab.hue
lantern_box, in_box = _old.lantern_box, _old.in_box

# Palette (sRGB). Fur targets are Lab so the painted shading survives.
FUR_H, FUR_C_K, FUR_L_K = 70.0, 0.48, 0.72  # tawny buff hue, chroma kept, lightness contrast kept
COAT_L, COAT_C, COAT_H, COAT_L_K = 22.0, 2.0, 250.0, 0.95  # charcoal field coat (the old Lynx's colour)
TUFT = (26, 20, 17, 255)
TUFT_HI = (64, 52, 44, 255)
EAR_RIM = (48, 38, 32, 255)
EAR_IN = (232, 222, 204, 255)
SPOT = (88, 66, 46, 255)
SPOT_DK = (60, 44, 32, 255)
RUFF = (236, 228, 212, 255)
RUFF_MID = (214, 204, 186, 255)
RUFF_SH = (176, 164, 146, 255)
RUFF_BAR = (58, 44, 34, 255)
TIP = (28, 22, 18, 255)


def lab_of(p):
    return to_lab(p[0], p[1], p[2])


def kind(p) -> str | None:
    r, g, b, a = p
    if a < 64:
        return None
    L, A, B = to_lab(r, g, b)
    C, h = math.hypot(A, B), hue(A, B)
    if 100 <= h <= 180 and C > 12 and L < 75:
        return "eye"
    if h < 40 and L > 55 and 12 < C < 45:
        return "pink"
    if 15 <= h <= 82 and ((C >= 34 and L >= 36) or (C >= 40 and L >= 28)):
        return "fur"
    if L >= 66 and C < 34 and 30 <= h <= 110:
        return "cream"
    return None


def solid_bbox(f):
    return f.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()


def comps(points: set[tuple[int, int]]):
    seen, out = set(), []
    for p in points:
        if p in seen:
            continue
        q, cur = deque([p]), []
        seen.add(p)
        while q:
            x, y = q.popleft()
            cur.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (x + dx, y + dy)
                    if n in points and n not in seen:
                        seen.add(n)
                        q.append(n)
        out.append(cur)
    return out


def shade(c, k: float):
    return tuple(max(0, min(255, round(v * k))) for v in c[:3]) + (255,)


class Frame:
    def __init__(self, f: Image.Image, ref, view: str, coat: set | None = None):
        self.f = f.copy()
        self.W = f.width
        self.s = self.W / 96
        self.view = view
        self.px = self.f.load()
        self.lamp = lantern_box(self.f, 6 * self.s)
        self.ref = ref
        if coat is None:
            self.coat = cv.coat_mask("cat", self.f, ref)
            self._grow_coat()
        else:
            self.coat = set(coat)
        x0, y0, x1, y1 = solid_bbox(self.f)
        self.bb = (x0, y0, x1, y1)
        cx = (x0 + x1) / 2
        mid = [y for x, y in self.coat if abs(x - cx) < (x1 - x0) * 0.25]
        self.neck = min(mid) if mid else y0 + int((y1 - y0) * 0.38)
        self.boot = y1 - int((y1 - y0) * 0.12)
        # the chin: the lowest point where the head meets the coat across the middle of the figure
        tops = [min((y for x2, y in self.coat if x2 == x), default=self.neck) for x in range(int(cx - (x1 - x0) * 0.12), int(cx + (x1 - x0) * 0.12) + 1)]
        self.chin = max(tops) if tops else self.neck
        self.tail_at = None

    def _grow_coat(self):
        """The cat's brown seams and fold lines sit just outside the coat colour range; take the ones that are
        mostly surrounded by coat (a seam, not the boot top or the fur) so the charcoal has no brown stitching."""
        for _ in range(2):
            add = set()
            for x, y in list(self.coat):
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        n = (x + dx, y + dy)
                        if n in self.coat or n in add or not (0 <= n[0] < self.W and 0 <= n[1] < self.W):
                            continue
                        p = self.px[n]
                        if p[3] < 200 or in_box(n[0], n[1], self.lamp):
                            continue
                        L, A, B = to_lab(*p[:3])
                        if not (8 <= L <= self.ref["lo"] + 6 and math.hypot(A, B) <= 32 and 25 <= hue(A, B) <= 85):
                            continue
                        around = sum((n[0] + i, n[1] + j) in self.coat for i in (-1, 0, 1) for j in (-1, 0, 1) if i or j)
                        if around >= 4:
                            add.add(n)
            self.coat |= add

    def solid(self, x, y):
        return 0 <= x < self.W and 0 <= y < self.W and self.px[x, y][3] >= 128

    # ── 1. lift off the tabby tail ──────────────────────────────────────
    def drop_tail(self):
        x0, y0, x1, y1 = self.bb
        h = y1 - y0
        band = (self.neck + int(h * 0.12), self.boot)
        cxs = [x for x, y in self.coat if band[0] <= y < band[1]]
        if not cxs:
            return
        L, R = min(cxs), max(cxs)
        best = None
        for sd, edge in (("l", L), ("r", R)):
            pts = set()
            for y in range(band[0], band[1]):
                for x in range(self.W):
                    beyond = x < edge - 1 if sd == "l" else x > edge + 1
                    if beyond and self.px[x, y][3] > 0 and not in_box(x, y, self.lamp):
                        pts.add((x, y))
            for c in comps(pts):
                fur = sum(1 for p in c if kind(self.px[p]) in ("fur", "cream"))
                span = max(p[0] for p in c) - min(p[0] for p in c)
                if fur >= 18 * self.s * self.s and span >= 5 * self.s:
                    if best is None or len(c) > len(best[2]):
                        best = (sd, edge, c)
        if not best:
            return
        sd, edge, c = best
        cs = set(c)
        # Tail roots that overlap the coat edge: fur touching the lifted part, up to 3 px inside.
        grow = deque(c)
        while grow:
            x, y = grow.popleft()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (x + dx, y + dy)
                    inside = (edge - 1 <= n[0] <= edge + 3) if sd == "l" else (edge - 3 <= n[0] <= edge + 1)
                    if n not in cs and inside and band[0] <= n[1] < band[1] and kind(self.px[n]) in ("fur", "cream") and n not in self.coat:
                        cs.add(n)
                        grow.append(n)
        for p in cs:
            self.px[p] = (0, 0, 0, 0)
        # crumbs the lift leaves behind (outline pixels of the old brush) go too
        body = {(x, y) for y in range(self.W) for x in range(self.W) if self.px[x, y][3] > 0}
        parts = sorted(comps(body), key=len)
        for c in parts[:-1]:
            if len(c) < 14 * self.s * self.s and not any(in_box(x, y, self.lamp) for x, y in c):
                for p in c:
                    self.px[p] = (0, 0, 0, 0)
                cs |= set(c)
        # the root: lifted pixels that touched what is left of the body
        root = [p for p in cs if any(self.px[p[0] + i, p[1] + j][3] >= 128 and (p[0] + i, p[1] + j) not in cs
                                     for i in (-1, 0, 1) for j in (-1, 0, 1) if 0 <= p[0] + i < self.W and 0 <= p[1] + j < self.W)
                and not in_box(p[0], p[1], self.lamp)]
        if not root:
            root = sorted(cs, key=lambda p: abs(p[0] - edge))[:4]
        rx = (min if sd == "l" else max)(p[0] for p in root)
        rx = sum(p[0] for p in root) / len(root)
        ry = sum(p[1] for p in root) / len(root)
        self.tail_at = (sd, rx, ry)

    # ── 2. recolour fur, ears, eyes, coat ───────────────────────────────
    def recolour(self):
        x0, y0, x1, y1 = self.bb
        head_h = self.neck - y0
        furL = [lab_of(self.px[x, y])[0] for y in range(self.W) for x in range(self.W) if kind(self.px[x, y]) == "fur" and not in_box(x, y, self.lamp)]
        Lm = sum(furL) / len(furL) if furL else 60
        for y in range(self.W):
            for x in range(self.W):
                p = self.px[x, y]
                if p[3] < 64 or in_box(x, y, self.lamp):
                    continue
                L, A, B = lab_of(p)
                if (x, y) in self.coat:
                    nl = max(5.0, min(70.0, COAT_L + (L - self.ref["L"]) * COAT_L_K))
                    t = math.radians(COAT_H)
                    self.px[x, y] = (*from_lab(nl, COAT_C * math.cos(t), COAT_C * math.sin(t)), p[3])
                    continue
                k = kind(p)
                if k in ("fur", "cream", None) and self.neck < y < self.boot and (
                    self.coat_around(x, y) >= 5 or (self.coat_around(x, y) >= 3 and L < 45 and k != "cream")
                ):
                    nl = max(5.0, min(70.0, COAT_L + (L - self.ref["L"]) * COAT_L_K * 0.8))
                    t = math.radians(COAT_H)
                    self.px[x, y] = (*from_lab(nl, COAT_C * math.cos(t), COAT_C * math.sin(t)), p[3])
                    continue
                if k == "fur":
                    on_head = y < self.neck
                    kk = 0.85 if on_head else FUR_L_K
                    nl = max(18.0, min(86.0, Lm + (L - Lm) * kk + 5))
                    C = math.hypot(A, B) * FUR_C_K
                    t = math.radians(FUR_H + (hue(A, B) - 55) * 0.2)
                    self.px[x, y] = (*from_lab(nl, C * math.cos(t), C * math.sin(t)), p[3])
                elif k == "cream":
                    self.px[x, y] = (*from_lab(min(94, L + 2), A * 0.5, B * 0.55 + 2), p[3])
                elif k == "eye":
                    C = max(28.0, math.hypot(A, B))
                    t = math.radians(82)
                    self.px[x, y] = (*from_lab(L + 6, C * math.cos(t), C * math.sin(t)), p[3])
                elif k == "pink" and y < y0 + head_h * 0.42:
                    self.px[x, y] = EAR_IN[:3] + (p[3],) if L > 62 else shade(EAR_IN, 0.85)[:3] + (p[3],)
                elif (10 <= hue(A, B) <= 82 and math.hypot(A, B) > 18 and L >= 22 and y < self.neck) or (
                    5 <= hue(A, B) <= 48 and math.hypot(A, B) > 30 and L >= 18 and y < self.boot
                ):
                    # the tabby's dark orange line work on the head: same treatment as fur
                    C = math.hypot(A, B) * FUR_C_K
                    t = math.radians(FUR_H)
                    self.px[x, y] = (*from_lab(max(16.0, L * 0.92), C * math.cos(t), C * math.sin(t)), p[3])

    def coat_around(self, x, y) -> int:
        return sum((x + i, y + j) in self.coat for i in (-1, 0, 1) for j in (-1, 0, 1) if i or j)

    # ── 3. ears: black rims and tufts ───────────────────────────────────
    def ear_tips(self):
        x0, y0, x1, y1 = self.bb
        cols = []
        for x in range(self.W):
            for y in range(y0, self.neck):
                if self.solid(x, y):
                    cols.append((x, y))
                    break
        if not cols:
            return []
        xs = [x for x, _ in cols]
        mid = (min(xs) + max(xs)) / 2
        l = min((c for c in cols if c[0] < mid), key=lambda c: (c[1], -c[0]), default=None)
        r = min((c for c in cols if c[0] >= mid), key=lambda c: (c[1], c[0]), default=None)
        tips = [t for t in (l, r) if t]
        if len(tips) == 2 and abs(tips[0][1] - tips[1][1]) > 5 * self.s:
            tips = [min(tips, key=lambda c: c[1])]
        return tips

    def ears(self):
        tips = self.ear_tips()
        x0, _, x1, _ = self.bb
        cx = (x0 + x1) / 2
        rim = max(2, round(2.5 * self.s))
        for tx, ty in tips:
            # black-rim the top of the ear: the first `rim` solid pixels down each column near the tip
            for x in range(tx - round(3 * self.s), tx + round(3 * self.s) + 1):
                n = 0
                for y in range(ty, ty + round(7 * self.s)):
                    if self.solid(x, y) and not in_box(x, y, self.lamp):
                        depth = y - ty
                        if depth <= rim + abs(x - tx) * 0.2 and n < rim:
                            self.px[x, y] = EAR_RIM if n else TUFT
                            n += 1
                    elif n:
                        break
            lean = 1 if tx > cx else -1
            if self.view in ("left", "right") and len(tips) == 1:
                lean = 1 if self.view == "left" else -1
            # a tapered tuft: two pixels wide at the ear tip, one at the top, flicking outwards
            n = max(4, round(5 * self.s))
            for i in range(1, n + 1):
                yy = ty - i
                if yy < 2:
                    break
                xx = tx + (lean if i > n * 0.6 else 0)
                if 1 <= xx < self.W - 1:
                    self.px[xx, yy] = TUFT
                    if i <= n * 0.5 and 1 <= xx + lean < self.W - 1:
                        self.px[xx + lean, yy] = TUFT_HI if i == 1 else TUFT
                    if self.s > 1.2 and i <= n * 0.3 and 1 <= xx - lean < self.W - 1:
                        self.px[xx - lean, yy] = TUFT_HI

    # ── 4. facial ruff ──────────────────────────────────────────────────
    def ruff(self):
        x0, y0, x1, y1 = self.bb
        top, neck = y0, self.neck
        h = neck - top
        ya, yb = top + int(h * 0.56), neck + max(1, round(1.5 * self.s))
        sides = {"front": "lr", "back": "lr", "left": "r", "right": "l"}[self.view]
        reach = 3.6 * self.s
        span = max(1, yb - ya)
        for sd in sides:
            d = -1 if sd == "l" else 1
            for y in range(ya, yb + 1):
                t = (y - ya) / span
                row = [x for x in range(self.W) if self.solid(x, y) and not in_box(x, y, self.lamp)
                       and (y < neck or (x, y) not in self.coat or True)]
                if not row:
                    continue
                # edge of the head on this side (rows at/below the neck use the head edge of the row above)
                hx = [x for x in row if abs(x - (x0 + x1) / 2) < (x1 - x0) * 0.5]
                if not hx:
                    continue
                edge = min(hx) if sd == "l" else max(hx)
                if y >= neck:
                    edge = self._ruff_edge.get(sd, edge)
                else:
                    self._ruff_edge = getattr(self, "_ruff_edge", {})
                    self._ruff_edge[sd] = edge
                # profile: grows down the cheek, then pointed locks hang at the jaw
                out = reach * (0.35 + 0.9 * t) if t < 0.72 else reach * (1.0 - (t - 0.72) * 2.2)
                lock = ((y - ya) // max(2, round(2 * self.s))) % 2
                out = int(round(out + (0.8 * self.s if lock else -0.2)))
                start = -max(1, round(1.5 * self.s))  # paint back over the cheek edge too
                for i in range(start, out + 1):
                    x = edge + d * i
                    if not (1 <= x < self.W - 1):
                        continue
                    if i <= 0 and kind(self.px[x, y]) not in ("fur", "cream"):
                        continue
                    if i > 0 and self.solid(x, y) and (x, y) not in self.coat and kind(self.px[x, y]) is None:
                        continue  # don't paint over sleeves, bag, boots
                    col = RUFF if i < out - 1 else (RUFF_MID if i < out else RUFF_SH)
                    self.px[x, y] = col
                # the bar: a dark stroke slanting down-out through the middle of the ruff
                by = ya + int(span * 0.42)
                if by <= y <= by + max(1, round(self.s)):
                    for i in range(-1, max(1, out - 1)):
                        if (i + (y - by)) % 1 == 0 and 0 <= i <= out * 0.75:
                            x = edge + d * (i + (y - by))
                            if 1 <= x < self.W - 1 and self.solid(x, y):
                                self.px[x, y] = RUFF_BAR
        if self.view == "front":
            # a pale bib under the chin
            pass

    # ── 5. bobbed tail ──────────────────────────────────────────────────
    def stub(self):
        if not self.tail_at:
            return
        sd, edge, ay = self.tail_at
        d = -1 if sd == "l" else 1
        s = self.s
        cx, cy = edge + d * 1.4 * s, ay - 1.6 * s
        rw, rh = 3.6 * s, 3.2 * s
        tip = (d * 0.75, -0.66)
        base = from_lab(66, 22 * math.cos(math.radians(FUR_H)), 22 * math.sin(math.radians(FUR_H)))
        fur = (*base, 255)
        for y in range(int(cy - rh - 1), int(cy + rh + 2)):
            for x in range(int(cx - rw - 1), int(cx + rw + 2)):
                if not (1 <= x < self.W - 1 and 1 <= y < self.W - 1) or in_box(x, y, self.lamp):
                    continue
                u, v = (x - cx) / rw, (y - cy) / rh
                dd = u * u + v * v
                if dd > 1.0:
                    continue
                if self.px[x, y][3] >= 128 and (u * d) < 0.15:
                    continue  # tucked behind the body on its root side
                along = u * tip[0] + v * tip[1]
                if along > 0.5:
                    col = TIP
                elif dd > 0.68:
                    col = shade(fur, 0.66)
                elif v > 0.35:
                    col = shade(fur, 0.86)
                else:
                    col = shade(fur, 1.06)
                self.px[x, y] = col
        # two spots on the bob
        for (u, v) in ((-0.15, 0.25), (0.25, 0.05)):
            x, y = int(round(cx + u * rw * d)), int(round(cy + v * rh))
            if 1 <= x < self.W - 1 and self.px[x, y][:3] != TIP[:3]:
                self.px[x, y] = SPOT

    # ── 6. bigger paws ──────────────────────────────────────────────────
    def paws(self):
        x0, y0, x1, y1 = self.bb
        h = y1 - y0
        pts = {(x, y) for y in range(self.neck + int(h * 0.1), self.boot - int(h * 0.05)) for x in range(self.W)
               if kind(self.px[x, y]) == "fur" and not in_box(x, y, self.lamp)}
        for c in comps(pts):
            if not (4 * self.s * self.s <= len(c) <= 40 * self.s * self.s):
                continue
            cs = set(c)
            col = sorted((self.px[p] for p in c), key=lambda q: sum(q[:3]))[len(c) // 2]
            ring = set()
            for x, y in c:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = (x + dx, y + dy)
                    if n in cs or not (1 <= n[0] < self.W - 1) or in_box(n[0], n[1], self.lamp):
                        continue
                    if n[1] >= self.boot:
                        continue
                    ring.add(n)
            for n in ring:
                self.px[n] = shade(col, 0.78)
            # toe line: a dark notch along the bottom of the paw
            by = max(p[1] for p in c)
            for x, y in c:
                if y == by and x % 2 == 0:
                    self.px[x, y] = shade(col, 0.6)

    def boots(self):
        """Broader feet: each boot row in the bottom band grows a pixel outwards on both sides."""
        x0, y0, x1, y1 = self.bb
        for y in range(self.boot, y1):
            runs, run = [], []
            for x in range(self.W):
                if self.solid(x, y) and not in_box(x, y, self.lamp):
                    run.append(x)
                elif run:
                    runs.append(run)
                    run = []
            if run:
                runs.append(run)
            for r in runs:
                if len(r) < 3:
                    continue
                for x, src in ((r[0] - 1, r[0]), (r[-1] + 1, r[-1])):
                    if 1 <= x < self.W - 1 and not self.solid(x, y):
                        self.px[x, y] = shade(self.px[src, y], 0.9)

    # ── 7. spots ────────────────────────────────────────────────────────
    def spots(self, seed: int):
        x0, y0, x1, y1 = self.bb
        cx = (x0 + x1) // 2
        step = max(4, round(4.5 * self.s))
        face = (cx - int((x1 - x0) * 0.2), y0 + int((self.neck - y0) * 0.42), cx + int((x1 - x0) * 0.2), self.neck)
        for gy in range(-2, self.W // step + 2):
            for gx in range(-self.W // step, self.W // step + 1):
                hh = ((gx * 73856093) ^ (gy * 19349663) ^ seed) & 0xFFFFFFFF
                if (hh >> 11) % 5 == 0:
                    continue
                x = cx + gx * step + (hh >> 3) % step - step // 2
                y = y0 + gy * step + (hh >> 7) % step
                if not (2 <= x < self.W - 3 and 2 <= y < self.W - 3) or in_box(x, y, self.face_box(face)) or in_box(x, y, self.lamp):
                    continue
                on_head = y <= self.chin + 1
                if on_head:
                    continue  # the head keeps the painted forehead lines; dots there read as dirt
                big = self.s > 1.1 and not on_head
                cells = [(x, y), (x + 1, y)] if not on_head else [(x, y)]
                if big:
                    cells += [(x, y + 1), (x + 1, y + 1)]
                if all(self.is_tawny(c) for c in cells):
                    for c in cells:
                        self.px[c] = SPOT_DK if lab_of(self.px[c])[0] < 50 else SPOT

    def face_box(self, face):
        return face

    def is_tawny(self, c) -> bool:
        p = self.px[c]
        if p[3] < 200 or c in self.coat:
            return False
        L, A, B = lab_of(p)
        return abs(hue(A, B) - FUR_H) < 22 and 14 <= math.hypot(A, B) <= 34 and 38 <= L <= 76

    def clear_border(self):
        for i in range(self.W):
            for x, y in ((i, 0), (i, self.W - 1), (0, i), (self.W - 1, i)):
                self.px[x, y] = (0, 0, 0, 0)


# A lynx is a bigger, rangier cat: the figure is scaled about its feet (floor line and centre stay put),
# broader than it is taller, before anything is painted on. Colours are snapped back to the cat sheet's
# own palette afterwards, so the resample doesn't blur the painted pixels.
SCALE_X, SCALE_Y = 1.14, 1.08


def grow(f: Image.Image, ref, view: str):
    """Scale one cat frame about its feet. Colours are resampled, then snapped back onto the cat's own palette
    *within each part* (coat, lantern, everything else), whose outlines are scaled nearest-neighbour, so a
    resampled edge never invents an in-between colour (no tan specks on the coat). Returns the frame and the
    coat pixels for the recolour."""
    src = Frame(f, ref, view)
    W = f.width
    lab_img = np.zeros((W, W), dtype=np.uint8)
    a = np.asarray(f).astype(np.int32)
    for y in range(W):
        for x in range(W):
            if a[y, x, 3] >= 64:
                lab_img[y, x] = 1 if (x, y) in src.coat else (2 if in_box(x, y, src.lamp) else 3)
    x0, y0, x1, y1 = solid_bbox(f)
    ax, ay = (x0 + x1) / 2, y1 - 0.5
    m = (1 / SCALE_X, 0, ax - ax / SCALE_X, 0, 1 / SCALE_Y, ay - ay / SCALE_Y)
    big = np.asarray(f.convert("RGBa").transform(f.size, Image.AFFINE, m, resample=Image.BICUBIC).convert("RGBA")).astype(np.int32)
    lab_big = np.asarray(Image.fromarray(lab_img, "L").transform(f.size, Image.AFFINE, m, resample=Image.NEAREST))
    out = np.zeros_like(big)
    for k in (1, 2, 3):
        pal = a[..., :3][(lab_img == k) & (a[..., 3] >= 200)]
        if not len(pal):
            continue
        pal = np.unique(pal, axis=0)
        sel = lab_big == k
        rgb = big[..., :3][sel]
        d = ((rgb[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
        out[..., :3][sel] = pal[d.argmin(1)]
        out[..., 3][sel] = 254
    img = Image.fromarray(out.astype(np.uint8), "RGBA")
    coat = {(int(x), int(y)) for y, x in zip(*np.nonzero(lab_big == 1))}
    return img, coat


def make_frame(f: Image.Image, ref, view: str, seed: int) -> Image.Image:
    g, coat = grow(f, ref, view)
    fr = Frame(g, ref, view, coat)
    fr.drop_tail()
    fr.recolour()
    fr.paws()
    fr.boots()
    fr.spots(seed)
    fr.ruff()
    fr.ears()
    fr.stub()
    fr.clear_border()
    return fr.f


def main() -> None:
    cat_walk = Image.open(SCOUTS / "cat-walk.png").convert("RGBA")
    cat_idle = Image.open(SCOUTS / "cat-idle.png").convert("RGBA")
    wg, ig = cv.qa.cells(cat_walk, 4), cv.qa.cells(cat_idle, 2)
    walk = Image.new("RGBA", cat_walk.size, (0, 0, 0, 0))
    C = 96
    for r, view in enumerate(["front", "left", "right", "back"]):
        ref = cv.coat_ref(wg[r], 8.0)
        for c in range(4):
            walk.alpha_composite(make_frame(wg[r][c], ref, view, 0x1F9A + r), (c * C, r * C))
    walk.save(SCOUTS / "lynx-walk.png", optimize=True)
    I = 128
    ref = cv.coat_ref([f for row in ig for f in row], 8.0)
    idle = Image.new("RGBA", cat_idle.size, (0, 0, 0, 0))
    for r in range(2):
        for c in range(2):
            idle.alpha_composite(make_frame(ig[r][c], ref, "front", 0x1F9A + 9), (c * I, r * I))
    idle.save(SCOUTS / "lynx-idle.png", optimize=True)
    idle.crop((0, 0, I, I)).resize((C, C), Image.BOX).save(SCOUTS / "lynx.png", optimize=True)
    side.build(SCOUTS / "lynx-walk.png", SCOUTS / "lynx-idle-side.png")
    print("lynx-walk.png, lynx-idle.png, lynx.png, lynx-idle-side.png written")


if __name__ == "__main__":
    import sys

    main()
    if "--coats" in sys.argv:
        for coat in cv.PALETTE:
            for k in cv.GRID:
                cv.save_exact(cv.variant("lynx", k, coat), cv.OUT / f"lynx-{coat}-{k}.png")
        print("lynx coats written")
