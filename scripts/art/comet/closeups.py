"""4x inspection close-ups of the shipped webps: whole sprite on dark map, mid grey and checker, then 4x crops."""
import sys, os
from PIL import Image, ImageDraw
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
def checker(w, h, s=12):
    c = Image.new('RGBA', (w, h), (200, 200, 200, 255)); d = ImageDraw.Draw(c)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2: d.rectangle([x, y, x + s - 1, y + s - 1], fill=(150, 150, 150, 255))
    return c
regions = {  # fractions of the canvas
    'trail': (0.45, 0.0, 0.95, 0.35), 'head': (0.35, 0.12, 0.70, 0.40), 'left-edge': (0.0, 0.25, 0.30, 0.70),
    'ring-bottom': (0.0, 0.72, 0.55, 1.0), 'ring-right': (0.55, 0.65, 1.0, 1.0), 'right-edge': (0.70, 0.25, 1.0, 0.70),
}
for st in sys.argv[2:]:
    im = Image.open(f'{st}.webp').convert('RGBA'); W, H = im.size
    bgs = [Image.new('RGBA', (W, H), (27, 31, 36, 255)), Image.new('RGBA', (W, H), (92, 110, 96, 255)), checker(W, H)]
    sheet = Image.new('RGBA', (W * 3, H), 0)
    for i, b in enumerate(bgs): b.alpha_composite(im); sheet.paste(b, (i * W, 0))
    sheet.convert('RGB').save(f'{out}/{st}-whole.png')
    tiles = []
    for name, (x0, y0, x1, y1) in regions.items():
        box = (int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))
        for b in (Image.new('RGBA', (W, H), (27, 31, 36, 255)), checker(W, H, 3)):
            b.alpha_composite(im); c = b.crop(box); tiles.append((name, c.resize((c.width * 4, c.height * 4), Image.NEAREST)))
    for i in range(0, len(tiles), 2):
        name = tiles[i][0]; a, b = tiles[i][1], tiles[i + 1][1]
        s = Image.new('RGB', (a.width * 2 + 8, a.height), (255, 0, 255)); s.paste(a, (0, 0)); s.paste(b, (a.width + 8, 0))
        s.save(f'{out}/{st}-4x-{name}.png')
    print(st, 'ok')
