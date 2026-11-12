"""Contact sheet of the comet QA shots (phone shots at 390x844, HUD strips, pin crops, 4x close-up wholes)."""
import sys, os
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]
rows = [
    [("01-map-open-default", "open · default zoom"), ("02-map-open-zoom", "open · zoomed in"), ("03-map-cooling", "cooling (cleared)"), ("04-map-locked", "locked (wrong answer)"), ("06-clear-quiz", "clear · quiz"), ("07-clear-reward", "clear · reward"), ("08-after-clear-cooling", "after the clear"), ("09b-map-closed", "window closed")],
]
strips = [("05-hud-open", "HUD open"), ("08b-hud-cleared", "HUD cleared"), ("04c-hud-locked", "HUD locked"), ("09-hud-next-comet", "HUD next comet")]
pins = [("02b-pin-open-crop", "open pin"), ("03b-pin-cooling-crop", "cooling pin"), ("04b-pin-locked-crop", "locked pin")]
W = 300
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
except Exception:
    font = ImageFont.load_default()
tiles = []
for name, label in rows[0]:
    p = f"{d}/{name}.png"
    if os.path.exists(p):
        im = Image.open(p).convert("RGB"); im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS); tiles.append((im, label))
row1_h = max(t[0].height for t in tiles) + 26
strip_ims = []
for name, label in strips:
    im = Image.open(f"{d}/{name}.png").convert("RGB"); im = im.resize((W * 2, int(im.height * W * 2 / im.width)), Image.LANCZOS); strip_ims.append((im, label))
pin_ims = []
for name, label in pins:
    im = Image.open(f"{d}/{name}.png").convert("RGB"); im = im.resize((int(im.width * 260 / im.height), 260), Image.LANCZOS); pin_ims.append((im, label))
cu = []
for st in ["open", "cooling", "locked"]:
    im = Image.open(f"{d}/closeups/{st}-whole.png").convert("RGB"); im = im.resize((int(im.width * 220 / im.height), 220), Image.LANCZOS); cu.append((im, f"cutout {st} (dark / green / checker)"))
cols = 4
sw = W * 2 + 10
strip_h = sum(s[0].height + 26 for s in strip_ims[:2])
total_w = max(len(tiles) * (W + 10), 2 * sw + 400)
H = 40 + row1_h + 10 + 2 * 300 + 10 + 300 + 10 + 280
sheet = Image.new("RGB", (total_w + 20, H), (18, 20, 24)); dr = ImageDraw.Draw(sheet)
dr.text((10, 10), "Keyline 0.1.159 · Comet vault · 390x844 @3x · seeded guest, local save, dev clock forced", fill=(240, 230, 210), font=font)
x, y = 10, 40
for im, label in tiles:
    sheet.paste(im, (x, y)); dr.text((x, y + im.height + 4), label, fill=(220, 210, 190), font=font); x += W + 10
y += row1_h + 10
x = 10
for i, (im, label) in enumerate(strip_ims):
    cx = 10 + (i % 2) * (sw + 10); cy = y + (i // 2) * (strip_ims[0][0].height + 40)
    sheet.paste(im, (cx, cy)); dr.text((cx, cy + im.height + 4), label, fill=(220, 210, 190), font=font)
y += 2 * (strip_ims[0][0].height + 40) + 10
x = 10
for im, label in pin_ims:
    sheet.paste(im, (x, y)); dr.text((x, y + im.height + 4), label, fill=(220, 210, 190), font=font); x += im.width + 10
y += 300
x = 10
for im, label in cu:
    sheet.paste(im, (x, y)); dr.text((x, y + im.height + 4), label, fill=(220, 210, 190), font=font); x += im.width + 10
bbox = (0, 0, sheet.width, min(sheet.height, y + 250))
sheet.crop(bbox).save(f"{d}/10-contact-sheet.png")
print("ok", sheet.size)
