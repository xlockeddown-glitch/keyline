"""Scale every cut so the vault box is the same width, seat each on its painted ring centre, one shared canvas."""
import json
from PIL import Image
K = 1.0  # measured on the full-size mock
crops = json.load(open('crops.json'))
# hand-measured in the 1932 display of the mock: vault box left/right, ring centre (ground point)
P = {
    'hero':    dict(bl=575, br=1460, gx=1020, gy=1060),
    'open':    dict(bl=145, br=630, gx=383, gy=1852),
    'cooling': dict(bl=785, br=1272, gx=1029, gy=1867),
    'locked':  dict(bl=1415, br=1895, gx=1655, gy=1870),
}
BODY = 320  # px of vault box width in the sprite (40 CSS px at 8x)
boxes = {}
for k in P:
    # cut box inside crop, from matte.py log
    pass
import re, subprocess
log = subprocess.run(['python3', 'matte.py'], capture_output=True, text=True).stdout
for line in log.splitlines():
    m = re.match(r"(\w+) box \((\d+), (\d+), (\d+), (\d+)\)", line)
    if m: boxes[m[1]] = tuple(int(x) for x in m.groups()[1:])
place = {}
for k, p in P.items():
    s = BODY / ((p['br'] - p['bl']) * K)
    cx, cy = crops[k][0] + boxes[k][0], crops[k][1] + boxes[k][1]
    im = Image.open(f'{k}-cut.png')
    w, h = round(im.width * s), round(im.height * s)
    gx, gy = (p['gx'] * K - cx) * s, (p['gy'] * K - cy) * s  # ground point inside scaled cut
    place[k] = (im.resize((w, h), Image.LANCZOS), gx, gy)
L = max(g[1] for g in place.values()); T = max(g[2] for g in place.values())
R = max(i.width - gx for i, gx, gy in place.values()); B = max(i.height - gy for i, gx, gy in place.values())
W, H = int(L + R) + 4, int(T + B) + 4
W += W % 2; H += H % 2
ax, ay = L + 2, T + 2
print('canvas', W, H, 'ground', round(ax, 1), round(ay, 1))
json.dump({'w': W, 'h': H, 'ax': ax, 'ay': ay}, open('canvas.json', 'w'))
for k, (im, gx, gy) in place.items():
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    c.alpha_composite(im, (round(ax - gx), round(ay - gy)))
    c.save(f'{k}-sprite.png')
    c.save(f'{k}.webp', 'WEBP', quality=86, method=6, alpha_quality=100)
    import os; print(k, os.path.getsize(f'{k}.webp'))
