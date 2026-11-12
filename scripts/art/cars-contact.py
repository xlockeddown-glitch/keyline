#!/usr/bin/env python3
"""0.1.161: 4x close-ups and the contact sheet for the painted-car shots (scripts/cars-shots.mjs).
  python3 scripts/art/cars-contact.py /home/box/keyline-art/shots/cars
The crops are 3x device pixels of the running game; a "4x" close-up is 4 screen pixels per CSS pixel of the 56px
pawn box (nearest-neighbour from the 3x capture would invent blocks, so it is a Lanczos resize of the real pixels)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(sys.argv[1] if len(sys.argv) > 1 else "shots/cars")
DPR = 3


def font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def closeup(name, box_css=56, pad_css=10, zoom=4):
    """Centre crop of a cab crop (the pawn box plus a margin), at `zoom` screen px per CSS px."""
    im = Image.open(out / f"{name}.png").convert("RGB")
    half = (box_css / 2 + pad_css) * DPR
    cx, cy = im.width / 2, im.height / 2
    c = im.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half)))
    side = int((box_css + 2 * pad_css) * zoom)
    return c.resize((side, side), Image.LANCZOS)


def loop_closeup(name, zoom=4):
    """The sled from a Loop crop. The 56px box is drawn at scale 3, so 4x of the box is 4/3 of a CSS px here."""
    im = Image.open(out / f"{name}.png").convert("RGB")
    cx = im.width / 2
    w, top, bottom = 200 * DPR, 60 * DPR, im.height  # the sled's box ends 6 CSS px above the crop's floor
    c = im.crop((int(cx - w / 2), top, int(cx + w / 2), bottom))
    return c.resize((int(c.width / DPR * zoom / 3), int(c.height / DPR * zoom / 3)), Image.LANCZOS)


made = []
for n in ["03-drive-side-right", "04-drive-side-left", "05-drive-front", "06-drive-back",
          "07-map-civic", "07-map-f150", "07-map-ioniq5", "07-map-mustang", "07-map-belair57", "07-map-model3", "07-map-roadster", "07-map-roadster2",
          "08-belair-drive-side", "08-belair-drive-front", "08-belair-drive-back",
          "09-paint-civic-sig", "09-paint-mustang-red", "09-paint-mustang-red-front", "09-paint-mustang-red-back", "09-paint-mustang-sig",
          "09-paint-belair57-black", "09-paint-ioniq5-sig", "09-paint-f150-blue", "09-paint-model3-red", "09-paint-roadster-sig"]:
    if (out / f"{n}-crop.png").exists():
        c = closeup(f"{n}-crop")
        c.save(out / f"30-4x-{n[3:]}.png")
        made.append((f"4x {n[3:]}", c))
for n in ["21-loop-civic-start", "21-loop-civic-mid", "21-loop-civic-late", "21-loop-mustang-mid", "21-loop-belair57-mid", "21-loop-f150-mid"]:
    if (out / f"{n}-crop.png").exists():
        c = loop_closeup(f"{n}-crop")
        c.save(out / f"31-4x-{n[3:]}.png")
        made.append((f"4x {n[3:]}", c))

# Contact sheet: full screens on top, then every close-up.
screens = [n for n in ["01-map-cab-default", "02-map-cab-zoom", "03-drive-side-right", "05-drive-front", "06-drive-back", "09-paint-civic-sig", "10-dealer-sign",
                       "11-showroom-phone", "14-title-car", "20-loop-civic-start", "20-loop-civic-mid", "20-loop-civic-late", "20-loop-mustang-mid", "20-loop-belair57-mid"] if (out / f"{n}.png").exists()]
TH = 520
tiles = []
for n in screens:
    im = Image.open(out / f"{n}.png").convert("RGB")
    tiles.append((n, im.resize((int(im.width * TH / im.height), TH), Image.LANCZOS)))
for extra in ["12-showroom-all-8", "13-showroom-paint-variants"]:
    if (out / f"{extra}.png").exists():
        im = Image.open(out / f"{extra}.png").convert("RGB")
        tiles.append((extra, im.resize((int(im.width * (TH * 2 + 24) / im.height), TH * 2 + 24), Image.LANCZOS)))
CW = 200
closes = [(t, c.resize((int(c.width * CW / c.height), CW), Image.LANCZOS)) for t, c in made]

W = 2600
f, fs = font(22), font(13)
rows, x, y, rowh, placed = [], 12, 60, 0, []
for group in (tiles, closes):
    for label, im in group:
        if x + im.width + 12 > W:
            x, y, rowh = 12, y + rowh + 30, 0
        placed.append((label, im, x, y))
        x += im.width + 12
        rowh = max(rowh, im.height)
    x, y, rowh = 12, y + rowh + 40, 0
sheet = Image.new("RGB", (W, y + 10), (14, 16, 20))
d = ImageDraw.Draw(sheet)
d.text((12, 14), "Keyline 0.1.161 · painted cars · 390x844 @3x · seeded guest, local save · close-ups are 4x of the 56px pawn box", fill=(240, 230, 210), font=f)
for label, im, px, py in placed:
    sheet.paste(im, (px, py))
    d.text((px, py + im.height + 4), label[:int(im.width / 7.2)], fill=(203, 165, 108), font=fs)
sheet.save(out / "00-contact-sheet.png")
print(f"{len(made)} close-ups, contact sheet {sheet.size}")
