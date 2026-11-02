"""0.1.102 Vault Keys: cut the six painted keys (scripts/art/keys/keys-turn.jpg, one row on flat magenta, made like
the car turnarounds) into public/sprites/keys/<tier>.png.
Steps: key out magenta (cars-process style, interior purples kept by filling holes), split the six keys left to right,
square off the blade and cut exactly N notches on its right edge (I = 1 ... VI = 6, a colorblind cue with the head
silhouette and numeral), then 160 px tall 256-colour palette PNGs.
  python3 scripts/art/keys-process.py"""
import os, numpy as np
from PIL import Image
from scipy import ndimage
R = os.path.dirname(os.path.abspath(__file__)) + '/../..'
TIERS = ["white", "blue", "green", "amber", "red", "violet"]
INK = np.array([38, 24, 16, 255])

def cut(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r > g + 60) & (b > g + 60)
    m = ndimage.binary_fill_holes(~mag)
    edge = ndimage.binary_dilation(~m, iterations=2) & m
    a[edge & (r > g + 20) & (b > g + 20)] = INK[:3]
    return np.dstack([a, np.where(m, 255, 0)]).astype('uint8'), m

def notch(a, n):
    a = a.astype(int); H = a.shape[0]; op = a[..., 3] > 128
    rows = range(int(H * .60), int(H * .88))
    lr = [(np.where(op[y])[0].min(), np.where(op[y])[0].max()) for y in rows if op[y].any()]
    L0 = min(l for l, _ in lr); R0 = max(r for _, r in lr)
    for y in rows:
        xs = np.where(op[y])[0]
        if not len(xs): continue
        l, r = xs.min(), xs.max()
        if l > L0: a[y, L0 + 2:l + 3] = a[y, l + 4]; a[y, L0:L0 + 2] = INK
        if r < R0: a[y, r - 2:R0 - 1] = a[y, r - 4]; a[y, R0 - 1:R0 + 1] = INK
    y0, y1 = int(H * .62), int(H * .86); seg = (y1 - y0) / (2 * n + 1); depth = int((R0 - L0) * .32)
    for k in range(n):
        ya = int(y0 + seg * (2 * k + 1)); yb = int(ya + seg * .9)
        a[ya:yb, R0 - depth + 1:R0 + 1] = 0
        a[ya:yb, R0 - depth - 1:R0 - depth + 1] = INK
        a[ya - 2:ya, R0 - depth:R0 + 1] = INK; a[yb:yb + 2, R0 - depth:R0 + 1] = INK
    return a.astype('uint8')

rgba, m = cut(f'{R}/scripts/art/keys/keys-turn.jpg')
lab, n = ndimage.label(ndimage.binary_closing(m, iterations=4))
objs = ndimage.find_objects(lab); sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
big = sorted([objs[i] for i in np.argsort(-sz)[:6]], key=lambda o: o[1].start)
os.makedirs(f'{R}/public/sprites/keys', exist_ok=True)
for i, (t, o) in enumerate(zip(TIERS, big)):
    k = notch(rgba[o] * (lab[o] > 0)[..., None], i + 1)
    im = Image.fromarray(k); im = im.crop(im.getbbox())
    im = im.resize((round(im.width * 160 / im.height), 160), Image.LANCZOS)
    im.quantize(colors=255, method=Image.Quantize.FASTOCTREE).save(f'{R}/public/sprites/keys/{t}.png', optimize=True)
    print(t, im.size)
