import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { COAT_TARGETS, V2_DEFAULT_COAT, V2_PALETTE, V2_SCOUTS, applyCoatLayer, v2Cell } from "./coatLayer.ts";
import { DYE_TARGETS } from "./dyeRecolor.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** A strip of the committed v2 sheet (base RGBA, mask as RGBA) and Python's recolour of it (scripts/sprite-rig.py). */
function pythonCoat(scout: string, coat: string, box: [number, number, number, number]) {
  const py = `
import base64, importlib.util, json
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(${JSON.stringify(ROOT)})
spec = importlib.util.spec_from_file_location("rig", ROOT / "scripts" / "sprite-rig.py")
rig = importlib.util.module_from_spec(spec); spec.loader.exec_module(rig)
pal = json.loads((ROOT / "scripts" / "coat-variants.json").read_text())
tgt = {**pal["coats"], **pal["dyes"]}["${coat}"]
default = json.loads((ROOT / "scripts" / "sprite-redraw" / "${scout}" / "rig.json").read_text())["default_coat"]
box = ${JSON.stringify(box)}
base = np.asarray(Image.open(ROOT / "public/sprites/scouts/${scout}-v2.png").convert("RGBA").crop(box))
mask = np.asarray(Image.open(ROOT / "public/sprites/scouts/${scout}-v2-coat.png").convert("L").crop(box))
out = rig.apply_coat(base, mask, tgt, default)
print(base.shape[1], base.shape[0])
print(base64.b64encode(base.tobytes()).decode())
print(base64.b64encode(np.repeat(mask[..., None], 4, -1).tobytes()).decode())
print(base64.b64encode(out.tobytes()).decode())
`;
  const text = execFileSync("python3", ["-c", py], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const [head, b, m, o] = text.trim().split("\n");
  const [w, h] = head!.split(" ").map(Number);
  return { w: w!, h: h!, base: Buffer.from(b!, "base64"), mask: Buffer.from(m!, "base64"), out: Buffer.from(o!, "base64") };
}

test("v2 coat recolour matches the sprite rig, and never touches a pixel outside the coat mask", () => {
  // Walk right frames 0-2 and the first standing frame, for every v2 scout.
  for (const [scout, coat, box] of [
    ["turtle", "plum", [0, 384, 576, 576]],
    ["turtle", "dye-red", [0, 768, 384, 960]],
    ["turtle", "oilskin", [768, 0, 1152, 192]],
    ["cat", "bottle", [0, 384, 576, 576]],
    ["cat", "dye-white", [0, 768, 384, 960]],
    ["fox", "oxblood", [0, 384, 576, 576]],
    ["fox", "dye-amber", [0, 768, 384, 960]],
    ["corgi", "plum", [0, 384, 576, 576]],
    ["corgi", "dye-blue", [0, 768, 384, 960]],
    ["sloth", "oilskin", [0, 384, 576, 576]],
    ["sloth", "dye-violet", [0, 768, 384, 960]],
  ] as const) {
    const { w, h, base, mask, out } = pythonCoat(scout, coat, [...box]);
    const mine = applyCoatLayer(new Uint8ClampedArray(base), new Uint8ClampedArray(mask), V2_PALETTE[coat]!, V2_DEFAULT_COAT[scout]!);
    let worst = 0;
    let off = 0;
    let coatPx = 0;
    for (let i = 0; i < mine.length; i++) {
      worst = Math.max(worst, Math.abs(mine[i]! - out[i]!));
      if (mask[i - (i % 4)] === 0 && mine[i] !== base[i]) off++;
    }
    for (let i = 0; i < mask.length; i += 4) if (mask[i]! > 0 && base[i + 3]! > 0) coatPx++;
    assert.ok(worst <= 1, `${scout} ${coat}: worst byte gap ${worst} (${w}x${h})`);
    assert.equal(off, 0, `${scout} ${coat}: ${off} bytes changed outside the coat mask`);
    assert.ok(coatPx > 1000, `${scout} ${coat}: strip has a coat to recolour`);
  }
});

test("v2 coat targets stay in step with scripts/coat-variants.json and each rig's default coat", () => {
  const pal = JSON.parse(readFileSync(`${ROOT}/scripts/coat-variants.json`, "utf8"));
  for (const [id, t] of Object.entries(pal.coats) as [string, { L: number; C: number; h: number }][]) {
    assert.deepEqual(COAT_TARGETS[id], { L: t.L, C: t.C, h: t.h }, id);
  }
  for (const [id, t] of Object.entries(pal.dyes) as [string, { L: number; C: number; h: number }][]) {
    assert.deepEqual(DYE_TARGETS[id], { L: t.L, C: t.C, h: t.h }, id);
  }
  for (const scout of V2_SCOUTS) {
    const rig = JSON.parse(readFileSync(`${ROOT}/scripts/sprite-redraw/${scout}/rig.json`, "utf8"));
    assert.deepEqual(V2_DEFAULT_COAT[scout], rig.default_coat, scout);
  }
});

test("v2 cells: 8 walk frames per stride on rows 0-3, 4-frame idles, standing after walking up faces front", () => {
  const cols = Array.from({ length: 16 }, (_, k) => v2Cell(true, 2, k * 0.25).col);
  assert.deepEqual(cols, [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]);
  assert.equal(v2Cell(true, 2, 0).row, 2);
  assert.equal(v2Cell(true, 3, 3.9).position, "100% 60%");
  assert.deepEqual([v2Cell(false, 0, 2).row, v2Cell(false, 0, 2).col], [4, 2]);
  assert.deepEqual([v2Cell(false, 0, 6.5).row, v2Cell(false, 0, 6.5).col], [4, 6]); // 8-frame front idle (blink on 5)
  assert.deepEqual([v2Cell(false, 1, 1).row, v2Cell(false, 1, 1).col], [5, 1]);
  assert.deepEqual([v2Cell(false, 1, 5).row, v2Cell(false, 1, 5).col], [5, 1]); // side idles are 4 frames
  assert.deepEqual([v2Cell(false, 2, 3).row, v2Cell(false, 2, 3).col], [5, 7]);
  assert.deepEqual([v2Cell(false, 3, 0).row, v2Cell(false, 3, 0).col], [4, 0]);
  assert.equal(v2Cell(false, 0, 0).position, "0% 80%"); // the CSS default for previews
  assert.equal(v2Cell(true, 0, 4).col, 0); // wraps
});
