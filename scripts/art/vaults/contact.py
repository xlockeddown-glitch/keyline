"""Contact sheet of the 0.1.160 painted-vault QA shots (scripts/vault-shots.mjs): phone shots at 390x844 @3x,
pin crops, and the in-game 4x close-ups.   python3 scripts/art/vaults/contact.py shots/vaults"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

d = sys.argv[1]
screens = [
    [("01-map-default-zoom", "map · default zoom (16)"), ("02-map-zoom17", "map · zoom 17"), ("03-map-zoom18", "map · zoom 18"), ("04-map-comet-and-vaults-z17", "beside the comet · z17"), ("05-map-cooling-and-locked-z17", "cooling + locked · z17"), ("06-map-hearths-z18", "Hearths + field labels · z18")],
    [("20-modal-amber", "vault card · amber"), ("21-modal-hearth-fields", "Hearth card · four fields"), ("22-hearth-owner-card", "Your Hearth"), ("23-hearth-placement-ghost", "placement preview"), ("30-map-skinned-copper-z18", "copper skin worn · SVG pins"), ("34-modal-skinned-copper", "copper skin · card")],
]
tiers = ["white", "blue", "green", "amber", "red", "violet"]
pins = [(f"10-pin-{t}", t) for t in tiers] + [("14-pin-hearth-open", "hearth"), ("14-pin-hearth-polished", "hearth polished"), ("14-pin-hearth-locked", "hearth locked"), ("11-pin-comet-for-scale", "comet (scale)")]
states = sorted(f[:-4] for f in os.listdir(d) if f[:3] in ("12-", "13-", "31-", "32-") and f.endswith(".png"))
close = sorted(f[:-4] for f in os.listdir(f"{d}/closeups") if f.startswith("ingame-4x-") and f.endswith(".png"))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
except Exception:
    font = ImageFont.load_default()
W, PAD, LAB = 300, 10, 24
FG = (220, 210, 190)


def load(name, w=None, h=None, sub=""):
    im = Image.open(f"{d}/{sub}{name}.png").convert("RGB")
    if w:
        return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)


rows = []
for r in screens:
    rows.append([(load(n, w=W), label) for n, label in r if os.path.exists(f"{d}/{n}.png")])
rows.append([(load(n, h=230), label) for n, label in pins if os.path.exists(f"{d}/{n}.png")])
rows.append([(load(n, h=230), n.split("-", 1)[1].replace("pin-", "").replace("-", " ")) for n in states])
rows.append([(load(n, h=240, sub="closeups/"), n.replace("ingame-4x-", "4x · ").replace("-", " ")) for n in close])
width = max(sum(im.width + PAD for im, _ in r) for r in rows) + PAD
height = 40 + sum(max(im.height for im, _ in r) + LAB + PAD for r in rows)
sheet = Image.new("RGB", (width, height), (18, 20, 24))
dr = ImageDraw.Draw(sheet)
dr.text((PAD, 10), "Keyline 0.1.160 · painted street vaults + Hearth · 390x844 @3x · running dev game · seeded guest, local save", fill=(240, 230, 210), font=font)
y = 40
for r in rows:
    x = PAD
    for im, label in r:
        sheet.paste(im, (x, y))
        dr.text((x, y + im.height + 4), label, fill=FG, font=font)
        x += im.width + PAD
    y += max(im.height for im, _ in r) + LAB + PAD
sheet.save(f"{d}/40-contact-sheet.png")
print("ok", sheet.size)
