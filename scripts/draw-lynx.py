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
head = _load("lynxhead", "lynx-head.py")
to_lab, from_lab, hue = _lab.to_lab, _lab.from_lab, _lab.hue
lantern_box, in_box = _old.lantern_box, _old.in_box

# Palette (sRGB). Fur targets are Lab so the painted shading survives.
FUR_H, FUR_C_K, FUR_L_K = 64.0, 0.80, 0.80  # golden tawny hue, chroma kept, lightness contrast kept
FUR_L_SHIFT = -3.0
# Own coat: a tan trench (pass 2, after Ryan's reference) — far lighter and cooler than the Tabby's brown.
COAT_L, COAT_C, COAT_H, COAT_L_K = 63.0, 26.0, 74.0, 0.9
HEAD_U = 12.0  # head unit at the 96 px walk cell (half the crown width); idle scales by 128/96
TUFT = (26, 20, 17, 255)
TUFT_HI = (64, 52, 44, 255)
EAR_RIM = (48, 38, 32, 255)
EAR_IN = (232, 222, 204, 255)
SPOT = (74, 46, 24, 255)
SPOT_DK = (52, 32, 18, 255)
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
                    nl = max(8.0, min(84.0, COAT_L + (L - self.ref["L"]) * COAT_L_K))
                    t = math.radians(COAT_H)
                    self.px[x, y] = (*from_lab(nl, COAT_C * math.cos(t), COAT_C * math.sin(t)), p[3])
                    continue
                k = kind(p)
                if k in ("fur", "cream", None) and self.neck < y < self.boot and (
                    self.coat_around(x, y) >= 5 or (self.coat_around(x, y) >= 3 and L < 45 and k != "cream")
                ):
                    nl = max(8.0, min(84.0, COAT_L + (L - self.ref["L"]) * COAT_L_K * 0.8))
                    t = math.radians(COAT_H)
                    self.px[x, y] = (*from_lab(nl, COAT_C * math.cos(t), COAT_C * math.sin(t)), p[3])
                    continue
                if k == "fur":
                    on_head = y < self.neck
                    kk = 0.85 if on_head else FUR_L_K
                    nl = max(18.0, min(86.0, Lm + (L - Lm) * kk + FUR_L_SHIFT))
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

    # ── 3. the head: lifted off and repainted per facing (scripts/lynx-head.py) ──
    def old_head(self):
        """Top, chin and centre of the tabby's head in this frame (what gets replaced)."""
        pts = [(x, y) for y in range(self.chin + 1) for x in range(self.W)
               if self.px[x, y][3] >= 128 and (x, y) not in self.coat and not in_box(x, y, self.lamp)]
        xs = [p[0] for p in pts]
        return min(p[1] for p in pts), self.chin, sum(xs) / len(xs), pts

    def paint_head(self, hx: float, hy: float, U: float):
        _, _, _, pts = self.old_head()
        for p in pts:
            self.px[p] = (0, 0, 0, 0)
        layer, idx, _ = head.head_layer(self.W, self.view, hx, hy, U)
        self.f.alpha_composite(layer)
        self.px = self.f.load()
        # soft outline where the new head meets the street (not where it overlaps the coat)
        W = self.W
        for y in range(1, W - 1):
            for x in range(1, W - 1):
                k = idx[y, x]
                if not k:
                    continue
                if any(self.px[x + i, y + j][3] < 64 for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    if k in (head.FUR, head.FUR_LT, head.FUR_SH, head.FUR_DK):
                        self.px[x, y] = head.PAL[head.OUTLINE] + (254,)
                    elif k == head.WHITE:
                        self.px[x, y] = head.PAL[head.WHITE_SH] + (254,)

    # ── 5. bobbed tail ──────────────────────────────────────────────────
    def stub(self):
        """A short spotted bobtail with a black tip. Side and three-quarter poses: at the hip where the tabby's
        tail left, tucked behind the body. Back view: centred on the rump, over the coat hem."""
        s = self.s
        if self.view == "back":
            xs = [x for x, y in self.coat]
            if not xs:
                return
            cx = (min(xs) + max(xs)) / 2
            mid = [y for x, y in self.coat if abs(x - cx) < 3 * s]
            cy = max(mid) - 4.0 * s
            rw, rh, d, tip, behind = 3.8 * s, 4.2 * s, 1, (0.0, 1.0), False
        elif self.tail_at:
            sd, edge, ay = self.tail_at
            d = -1 if sd == "l" else 1
            cx, cy = edge + d * 2.6 * s, ay - 3.0 * s
            rw, rh, tip, behind = 4.6 * s, 3.6 * s, (d * 0.72, -0.70), True
        else:
            return
        base = from_lab(60, 44 * math.cos(math.radians(FUR_H)), 44 * math.sin(math.radians(FUR_H)))
        fur = (*base, 255)
        for y in range(int(cy - rh - 1), int(cy + rh + 2)):
            for x in range(int(cx - rw - 1), int(cx + rw + 2)):
                if not (1 <= x < self.W - 1 and 1 <= y < self.W - 1) or in_box(x, y, self.lamp):
                    continue
                u, v = (x - cx) / rw, (y - cy) / rh
                dd = u * u + v * v
                if dd > 1.0:
                    continue
                if behind and self.px[x, y][3] >= 128 and (u * d) < 0.2:
                    continue  # tucked behind the body on its root side
                along = u * tip[0] + v * tip[1]
                if along > 0.48:
                    col = TIP
                elif dd > 0.70:
                    col = shade(fur, 0.62)
                elif v < -0.3:
                    col = shade(fur, 1.12)
                else:
                    col = fur
                self.px[x, y] = col
        for (u, v) in ((-0.35, 0.10), (0.15, -0.20), (0.05, 0.35), (-0.10, -0.45)):
            x, y = int(round(cx + u * rw * d)), int(round(cy + v * rh))
            if 1 <= x < self.W - 1 and self.px[x, y][:3] not in (TIP[:3],) and self.px[x, y][3] >= 128:
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
        return abs(hue(A, B) - FUR_H) < 22 and 18 <= math.hypot(A, B) <= 60 and 34 <= L <= 78

    def clear_border(self):
        for i in range(self.W):
            for x, y in ((i, 0), (i, self.W - 1), (0, i), (self.W - 1, i)):
                self.px[x, y] = (0, 0, 0, 0)


# A lynx is a bigger, rangier cat: the figure is scaled about its feet (floor line and centre stay put),
# broader than it is taller, before anything is painted on. Colours are snapped back to the cat sheet's
# own palette afterwards, so the resample doesn't blur the painted pixels.
SCALE_X, SCALE_Y = 1.14, 1.03


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


def prepare(f: Image.Image, ref, view: str, seed: int) -> Frame:
    g, coat = grow(f, ref, view)
    fr = Frame(g, ref, view, coat)
    fr.drop_tail()
    fr.recolour()
    fr.paws()
    fr.boots()
    fr.spots(seed)
    return fr


def finish(frames: list[Frame], view: str) -> list[Image.Image]:
    """Repaint the head on one facing's frames. Size is fixed per sheet; the eye line follows each frame's
    own head bob (old head top) so the walk keeps its timing, and never lets a tuft leave the cell."""
    s = frames[0].s
    U = HEAD_U * s
    olds = [fr.old_head() for fr in frames]
    tops = sorted(o[0] for o in olds)
    chins = sorted(o[1] for o in olds)
    top_m, chin_m = tops[len(tops) // 2], chins[len(chins) // 2]
    out = []
    for fr, (top, chin, cx, _) in zip(frames, olds):
        hy = top + (chin_m - top_m) * 0.5 + 0.2 * U
        hy = max(hy, 2.5 + 2.22 * U)
        fr.paint_head(cx, hy, U)
        fr.stub()
        fr.clear_border()
        out.append(fr.f)
    return out


def main() -> None:
    cat_walk = Image.open(SCOUTS / "cat-walk.png").convert("RGBA")
    cat_idle = Image.open(SCOUTS / "cat-idle.png").convert("RGBA")
    wg, ig = cv.qa.cells(cat_walk, 4), cv.qa.cells(cat_idle, 2)
    walk = Image.new("RGBA", cat_walk.size, (0, 0, 0, 0))
    C = 96
    for r, view in enumerate(["front", "left", "right", "back"]):
        ref = cv.coat_ref(wg[r], 8.0)
        frames = finish([prepare(wg[r][c], ref, view, 0x1F9A + r) for c in range(4)], view)
        for c, f in enumerate(frames):
            walk.alpha_composite(f, (c * C, r * C))
    walk.save(SCOUTS / "lynx-walk.png", optimize=True)
    I = 128
    ref = cv.coat_ref([f for row in ig for f in row], 8.0)
    idle = Image.new("RGBA", cat_idle.size, (0, 0, 0, 0))
    frames = finish([prepare(ig[r][c], ref, "front", 0x1F9A + 9) for r in range(2) for c in range(2)], "front")
    for i, f in enumerate(frames):
        idle.alpha_composite(f, ((i % 2) * I, (i // 2) * I))
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
