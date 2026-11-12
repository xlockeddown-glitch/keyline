"""Contact sheet of the 0.1.162 shop and sign QA shots (scripts/shops-shots.mjs): phone shots at 390x844 @3x,
the 4x pin and front crops, and the cutout close-ups.  python3 scripts/art/shops/contact.py shots/shops"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

d = sys.argv[1]
CLOSE = sys.argv[2] if len(sys.argv) > 2 else f"{d}/closeups"
PHONE = [
    [("00-title-version", "title · v0.1.162"), ("01-map-shop-default", "outfitter · default zoom"), ("02-map-shop-zoom", "outfitter · zoomed"), ("01-map-counter-default", "counter · default zoom"), ("02-map-counter-zoom", "counter · zoomed"), ("01-map-board-default", "notice · default zoom"), ("02-map-board-zoom", "notice · zoomed")],
    [("01-map-station-default", "station · default zoom"), ("02-map-station-zoom", "station · zoomed"), ("03-map-station-nofare", "station · no fare"), ("03-map-station-fare", "station · fare held"), ("03-map-station-cooling", "station · cooling"), ("04-lineup-default", "line-up + comet · default"), ("04-lineup-zoom18", "line-up + comet · zoom 18")],
    [("06-lineup-shadow-check", "seating (shadow tinted)"), ("05-sheet-outfitter-hire", "outfitter sheet · Hire"), ("05-sheet-print-shop", "outfitter sheet · Print shop"), ("05-sheet-street-counter", "street counter sheet")],
]
CROPS = [
    [("pin-shop-zoom", "outfitter 4x"), ("pin-counter-zoom", "counter 4x"), ("pin-board-zoom", "notice 4x"), ("pin-station-nofare", "station 4x"), ("pin-station-fare", "station + fare 4x"), ("pin-station-cooling", "station cooling 4x")],
    [("lineup-default", "line-up at the default zoom, 4x"), ("lineup-shadow-check", "seating at zoom 18, 4x")],
    [("front-outfitter-hire", "outfitter front 4x"), ("front-print-shop", "print shop front 4x"), ("front-street-counter", "counter front 4x")],
]
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
except Exception:
    font = ImageFont.load_default()
INK, TXT, GAP, LAB = (18, 20, 24), (236, 228, 214), 14, 34


def load(path, w=None, h=None):
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert("RGB")
    if w:
        return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if h and im.height != h:
        return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    return im


rows = []
for row in PHONE:  # each phone shot at a third of its 1170x2532 pixels (390x844)
    rows.append([(load(f"{d}/{n}.png", w=390), label) for n, label in row])
for row, h in zip(CROPS, (430, 430, 430)):
    rows.append([(load(f"{d}/crops4x/{n}.png", h=h), label) for n, label in row])
cut = []
for n in ["print-shop", "street-counter", "outfitter", "station-sign", "notice-sign"]:
    for part in ["foot-wide", "left"]:
        cut.append((load(f"{CLOSE}/{n}-{part}.png", h=300), f"cutout {n} · {part}"))
rows.append(cut[:5])
rows.append(cut[5:])
rows = [[t for t in r if t[0] is not None] for r in rows]
rows = [r for r in rows if r]
CELL = lambda im: max(im.width, 340)  # room for the label under a narrow close-up
W = max(sum(CELL(im) + GAP for im, _ in r) for r in rows) + GAP
H = 50 + sum(max(im.height for im, _ in r) + LAB + GAP for r in rows)
sheet = Image.new("RGB", (W, H), INK)
dr = ImageDraw.Draw(sheet)
dr.text((GAP, 12), "Keyline 0.1.162 · painted shop and sign pins · running dev game, 390x844 @3x · seeded guest, local save", fill=TXT, font=font)
y = 50
for r in rows:
    x = GAP
    for im, label in r:
        sheet.paste(im, (x, y))
        dr.text((x, y + im.height + 5), label, fill=TXT, font=font)
        x += CELL(im) + GAP
    y += max(im.height for im, _ in r) + LAB + GAP
sheet.save(f"{d}/10-contact-sheet.png")
print("ok", sheet.size)
