import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DYE_TARGETS, recolorSheet, type SheetKind } from "./dyeRecolor.ts";

function pythonSheet(scout: string, kind: SheetKind, dye: string): { w: number; h: number; src: Buffer; out: Buffer } {
  const py = `
import base64, importlib.util
from pathlib import Path
from PIL import Image
ROOT = Path(${JSON.stringify(fileURLToPath(new URL("../..", import.meta.url)))})
def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
qa = load("qa", "qa-sprites.py")
mc = load("mc", "make-coat-variants.py")
scout, kind, dye = "${scout}", "${kind}", "${dye}"
src = Image.open(qa.SHEETS[f"{scout}-{kind}"][0]).convert("RGBA")
out = mc.variant(scout, kind, dye)
assert out.size == src.size
print(src.size[0], src.size[1])
print(base64.b64encode(src.tobytes()).decode())
print(base64.b64encode(out.tobytes()).decode())
`;
  const text = execFileSync("python3", ["-c", py], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const [head, a, b] = text.trim().split("\n");
  const [w, h] = head!.split(" ").map(Number);
  return { w: w!, h: h!, src: Buffer.from(a!, "base64"), out: Buffer.from(b!, "base64") };
}

function check(scout: string, kind: SheetKind, dye: string) {
  const { w, h, src, out } = pythonSheet(scout, kind, dye);
  const painted = recolorSheet(new Uint8ClampedArray(src), w, h, scout, kind, DYE_TARGETS[dye]!);
  let diff = 0;
  let worst = 0;
  for (let i = 0; i < painted.length; i++) {
    const d = Math.abs(painted[i]! - out[i]!);
    if (d) {
      diff++;
      if (d > worst) worst = d;
    }
  }
  assert.equal(worst, 0, `${scout} ${kind} ${dye}: ${diff} bytes differ, worst ${worst}`);
}

test("dyed coat matches the sprite mixer", () => {
  check("giraffe", "idle", "dye-blue"); // 0.0.91: was the Lynx slot's Penguin (v2 now, coatLayer.test.ts)
  check("giraffe", "walk", "dye-blue"); // 0.0.87: the Corgi moved to the v2 sheets (coatLayer.test.ts)
  check("giraffe", "idle-side", "dye-violet"); // 0.0.86/0.0.90: was the Fox, then the Owl (both v2 now, coatLayer.test.ts)
});

test("0.0.81 clean-up (lightness window, hole fill, enclosed holes) matches the sprite mixer", () => {
  check("giraffe", "idle", "dye-red"); // 0.0.87/0.0.90/0.0.91: was the Corgi, the Owl, then the Penguin (all v2 now)
  check("giraffe", "walk", "dye-amber"); // 0.0.83-0.0.91: was the Turtle, the Sloth, the Raccoon, then the Penguin (all v2 now, coatLayer.test.ts)
  check("giraffe", "idle-side", "dye-green"); // 0.0.85/0.0.91: was the Tabby, then the Penguin (both v2 now, coatLayer.test.ts)
  check("giraffe", "walk", "dye-prism");
});
