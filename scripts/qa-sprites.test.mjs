import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("qa:sprites exits 0 on the committed scout sheets", () => {
  const r = spawnSync("python3", [join(root, "scripts/qa-sprites.py")], {
    encoding: "utf8",
    cwd: root,
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const verdict = JSON.parse(r.stdout);
  assert.equal(verdict.ok, true);
  // No legacy characters left: the Turtle (0.0.83), the Tabby (0.0.85), the Fox (0.0.86), the Corgi (0.0.87), the
  // Sloth (0.0.88), the Raccoon (0.0.89), the Owl (0.0.90), the Penguin (lynx, 0.0.91) and the Giraffe (0.0.92) are
  // all on the v2 sheets, and no legacy sheet, coat sheet or dye sheet is committed outside the fixtures.
  assert.equal(verdict.sheets.length, 0);
  assert.equal(verdict.coatSheets, 0);
  assert.equal(verdict.coats.length, 0);
  assert.deepEqual(verdict.v2.map((r) => r.scout), ["turtle", "cat", "fox", "corgi", "sloth", "raccoon", "owl", "lynx", "giraffe", "panda"]);
  assert.deepEqual(verdict.warnings, []);
  assert.equal(verdict.failures.length, 0);
});

function runWith(override, legacy = "") {
  const r = spawnSync("python3", [join(root, "scripts/qa-sprites.py")], {
    encoding: "utf8",
    cwd: root,
    env: { ...process.env, KEYLINE_SPRITE_OVERRIDE: override, KEYLINE_QA_LEGACY: legacy },
  });
  return { status: r.status, verdict: JSON.parse(r.stdout) };
}

// 0.0.92: every scout is on the v2 sheets. The legacy checks (4x4 / 2x2 sheets, print-shop coat and dye sheets,
// silhouettes, palettes, side idles) still guard a legacy sheet that comes back, so they run on the Giraffe's last
// legacy sheets, kept with its coats, dyes and shop icon in scripts/fixtures/legacy/ (KEYLINE_QA_LEGACY=giraffe).
const L = "scripts/fixtures/legacy";
const runLegacy = (override) => runWith(override, "giraffe");

test("qa:sprites legacy checks pass on the fixture legacy Giraffe (sheets, coats, dyes, icon)", () => {
  const { status, verdict } = runLegacy("");
  assert.equal(status, 0, verdict.failures.join("\n"));
  // 1 legacy character × walk / idle / side idle, × (4 print-shop coats + 7 vat dyes); the other 9 stay v2.
  assert.equal(verdict.sheets.length, 3);
  assert.equal(verdict.coatSheets, 33);
  assert.equal(verdict.coats.length, 11);
  assert.equal(verdict.palettes.length, 1);
  assert.deepEqual(verdict.v2.map((r) => r.scout), ["turtle", "cat", "fox", "corgi", "sloth", "raccoon", "owl", "lynx", "panda"]);
  assert.deepEqual(verdict.warnings, []);
});

test("qa:sprites fails a recoloured character (the 0.0.36 lynx was the fox's silhouette)", () => {
  // 0.0.86: the Fox is on the v2 sheets now, so the recolour was the Sloth wearing the Lynx's sheets; 0.0.88: the
  // Sloth is v2 too, so it was the Owl; 0.0.90: the Owl is v2 too, so it's the Giraffe. 0.0.91: the Penguin is v2
  // too and the Giraffe is the last legacy character, so the Penguin's legacy sheets (kept as fixtures) come back
  // into the silhouette check through the override, with the Giraffe wearing them.
  const walk = "scripts/fixtures/lynx-walk-legacy-k90.png";
  const idle = "scripts/fixtures/lynx-idle-legacy-k90.png";
  const { status, verdict } = runLegacy(`giraffe-walk=${walk},giraffe-idle=${idle},lynx-walk=${walk},lynx-idle=${idle}`);
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /giraffe\/lynx walk: same silhouette/.test(f)), verdict.failures.join("\n"));
  assert.ok(verdict.failures.some((f) => /giraffe\/lynx idle: same silhouette/.test(f)));
});

test("qa:sprites fails a character whose walk and idle coats differ (the 0.0.36 Tabby walked in green)", () => {
  // 0.0.85: the Tabby is on the v2 sheets now (one coat mask for every frame), so the regression used the Corgi
  // walking in its green-dye sheet against its own brown idle; 0.0.87: the Corgi is v2 too, so it was the Sloth;
  // 0.0.88: the Sloth is v2 too, so it was the Owl; 0.0.90: the Owl is v2 too, so it's the Giraffe in its red dye
  // (0.0.92: its fixture legacy sheets).
  const { status, verdict } = runLegacy(`giraffe-walk=${L}/giraffe-dye-red-walk.png`);
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^giraffe: walk and idle coats differ/.test(f)), verdict.failures.join("\n"));
  assert.ok(verdict.palettes.filter((p) => p.scout !== "giraffe").every((p) => p.coatDeltaH <= p.coatLimit));
});

// ── 0.0.83 v2 sheets (the redrawn Turtle) ──

function v2Fixture(kind) {
  // Writes a broken copy of a committed v2 sheet or mask (Turtle; Raccoon for the hole) to a temp file and returns its path.
  const out = join(mkdtempSync(join(tmpdir(), "qa-v2-")), `${kind}.png`);
  const py = {
    // Coat mask over the whole body: shell, belly, skin and boots would all take the coat colour.
    "mask-everywhere": `from PIL import Image\nim = Image.open("public/sprites/scouts/turtle-v2.png").convert("RGBA")\nImage.eval(im.getchannel("A"), lambda v: 255 if v else 0).save("${out}")`,
    // A walk frame that lost its art (right walk, frame 3).
    // 0.0.89: a see-through hole in the Raccoon's coat (left walk, frame 3): the map would show through the body.
    "punched-hole": `from PIL import Image\nim = Image.open("public/sprites/scouts/raccoon-v2.png").convert("RGBA")\nim.paste((0, 0, 0, 0), (3 * 192 + 88, 192 + 95, 3 * 192 + 92, 192 + 98))\nim.save("${out}")`,
    // The same kind of hole in the Turtle (left walk, frame 3, mid-body): every scout is held to zero.
    "punched-hole-turtle": `from PIL import Image\nimport numpy as np\nim = Image.open("public/sprites/scouts/turtle-v2.png").convert("RGBA")\na = np.asarray(im)[192:384, 576:768, 3]\nys, xs = np.where(a == a.max())\ny, x = int(np.median(ys)), int(np.median(xs))\nim.paste((0, 0, 0, 0), (576 + x - 3, 192 + y - 3, 576 + x + 3, 192 + y + 3))\nim.save("${out}")`,
    "missing-frame": `from PIL import Image\nim = Image.open("public/sprites/scouts/turtle-v2.png").convert("RGBA")\nim.paste((0, 0, 0, 0), (3 * 192, 2 * 192, 4 * 192, 3 * 192))\nim.save("${out}")`,
  }[kind];
  const r = spawnSync("python3", ["-c", py], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return out;
}

test("qa:sprites checks the v2 scouts: every frame, planted feet, the mask on the coat, every coat and dye exact", () => {
  const { verdict } = runWith("");
  for (const t of verdict.v2) {
    assert.equal(t.walkRows.length, 4);
    for (const row of t.walkRows) {
      assert.equal(row.feet.length, 8);
      const spread = Math.max(...row.feet) - Math.min(...row.feet);
      // Profiles: planted feet hold the floor. Toward/away from camera the stepping foot lands a little lower
      // (it comes toward the viewer) — but it must move at all, or the walk is marching in place again.
      if (row.row === 1 || row.row === 2) assert.ok(spread <= 3, `${t.scout} row ${row.row} feet ${row.feet}`);
      else assert.ok(spread >= 2 && spread <= 4, `${t.scout} row ${row.row} feet ${row.feet}`);
    }
    assert.deepEqual(t.idle.map((r) => r.face), ["down", "left", "right"]);
    assert.ok(t.maskHueGap <= 14, `mask hue gap ${t.maskHueGap}`);
    assert.ok(t.maskFit >= 0.75, `mask fit ${t.maskFit}`);
    assert.equal(t.variants.length, 11);
    for (const v of t.variants) {
      assert.equal(v.offMask, 0, `${t.scout} ${v.coat} changed pixels off the coat`);
      assert.ok(v.targetHueGap <= 20, `${t.scout} ${v.coat} hue ${v.targetHueGap}`);
    }
  }
});

test("qa:sprites checks every v2 frame for see-through holes: none on any scout", () => {
  const { verdict } = runWith("");
  for (const t of verdict.v2) {
    assert.equal(t.holes.count, 0, `${t.scout}: ${JSON.stringify(t.holes.list)}`);
    assert.equal(t.holes.px, 0);
    assert.deepEqual(t.holes.list, []);
  }
});

test("qa:sprites fails a see-through hole in a v2 frame (the 0.0.89 Raccoon showed the map between his legs)", () => {
  const { status, verdict } = runWith(`raccoon-v2=${v2Fixture("punched-hole")}`);
  assert.equal(status, 1);
  assert.ok(
    verdict.failures.some((f) => /^raccoon-v2: 1 see-through holes, 12px: walk left frame 3 12px/.test(f)),
    verdict.failures.join("\n"),
  );
  const t = runWith(`turtle-v2=${v2Fixture("punched-hole-turtle")}`);
  assert.equal(t.status, 1);
  assert.ok(t.verdict.failures.some((f) => /^turtle-v2: \d+ see-through holes/.test(f)), t.verdict.failures.join("\n"));
});

test("qa:sprites fails a v2 coat mask that covers the shell and belly", () => {
  const { status, verdict } = runWith(`turtle-v2-coat=${v2Fixture("mask-everywhere")}`);
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^turtle-v2-coat: masked pixels are not the base coat/.test(f)), verdict.failures.join("\n"));
});

test("qa:sprites fails a v2 sheet with a missing walk frame", () => {
  const { status, verdict } = runWith(`turtle-v2=${v2Fixture("missing-frame")}`);
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => f === "turtle-v2 walk row 2 frame 3: empty"), verdict.failures.join("\n"));
});

test("qa:sprites checks every facing and the shop icon against the idle coat, per-character limits", () => {
  const { verdict } = runLegacy("");
  assert.ok(verdict.palettes.length > 0);
  for (const p of verdict.palettes) {
    for (const facing of ["front", "left", "right"]) assert.ok(p.coatDeltaHByFacing[facing] <= p.coatLimit, `${p.scout} ${facing}`);
    assert.ok(p.iconDeltaH <= p.coatLimit, `${p.scout} icon`);
    assert.equal(p.coatLimit, p.scout === "raccoon" ? 5.5 : 3.2);
  }
});

test("qa:sprites fails a shop icon in a different coat from the idle", () => {
  const { status, verdict } = runWith("cat-icon=scripts/fixtures/cat-icon-olive-k36.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^cat: shop icon coat differs/.test(f)), verdict.failures.join("\n"));
});

test("qa:sprites fails a character with no side idle", () => {
  const { status, verdict } = runLegacy("giraffe-idle-side=scripts/fixtures/does-not-exist.png"); // 0.0.90: was the Owl (v2 now)
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^giraffe: no side idle sheet/.test(f)));
});

// ── 0.0.45 print-shop coats ──

test("qa:sprites checks every coat variant in every pose: repainted, on its catalogue hue, one coat per outfit", () => {
  const { verdict } = runLegacy("");
  const coats = new Set(verdict.coats.map((r) => r.coat));
  assert.deepEqual(
    [...coats].sort(),
    ["bottle", "dye-amber", "dye-blue", "dye-green", "dye-prism", "dye-red", "dye-violet", "dye-white", "oilskin", "oxblood", "plum"],
  );
  for (const r of verdict.coats) {
    for (const pose of ["idle", "walk front", "walk left", "walk right", "side left", "side right"]) {
      assert.ok(r.shift[pose] >= 8, `${r.scout}-${r.coat} ${pose} shift ${r.shift[pose]}`);
      assert.ok(r.share[pose] >= 0.25, `${r.scout}-${r.coat} ${pose} share ${r.share[pose]}`);
      assert.ok(r.hueGap[pose] <= 20, `${r.scout}-${r.coat} ${pose} hue`);
    }
  }
});

test("qa:sprites fails a coat whose walk sheet is still the character's own coat (the coat must show in every pose)", () => {
  const { status, verdict } = runLegacy(`giraffe-plum-walk=${L}/giraffe-walk.png`) // 0.0.86/0.0.88/0.0.90: was the Fox, the Sloth, then the Owl (all v2 now);
  assert.equal(status, 1);
  for (const pose of ["walk front", "walk left", "walk right"]) {
    assert.ok(verdict.failures.some((f) => f.startsWith(`giraffe-plum: ${pose} doesn't show the coat`)), verdict.failures.join("\n"));
  }
  assert.ok(verdict.failures.every((f) => f.startsWith("giraffe-plum")), verdict.failures.join("\n"));
});

test("qa:sprites fails a coat with a side idle left in the old coat", () => {
  const { status, verdict } = runLegacy(`giraffe-oxblood-idle-side=${L}/giraffe-idle-side.png`); // 0.0.90: was the Owl (v2 now)
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => f.startsWith("giraffe-oxblood: side left doesn't show the coat")), verdict.failures.join("\n"));
});

test("qa:sprites fails a coat sheet with a different silhouette from the character", () => {
  const { status, verdict } = runLegacy("giraffe-oxblood-idle=scripts/fixtures/lynx-idle-legacy-k90.png"); // 0.0.85-0.0.91: was the Tabby, the Fox, the Corgi's coat, the Sloth, the Owl, then the Penguin's oxblood coat (all v2 now); now the Penguin's legacy idle
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^giraffe-oxblood-idle: silhouette differs/.test(f)), verdict.failures.join("\n"));
});

test("qa:sprites fails an outfit whose walk is a different coat from its idle", () => {
  const { status, verdict } = runLegacy(`giraffe-oxblood-walk=${L}/giraffe-plum-walk.png`); // 0.0.85-0.0.90: was the Tabby, the Fox, the Sloth, then the Owl (all v2 now)
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^giraffe-oxblood: walk (front|left|right) coat hue is \d+° off Oxblood Greatcoat/.test(f)), verdict.failures.join("\n"));
});

test("qa:sprites fails coat colour on fur (the 0.0.80 plum Corgi idled with a lavender chin, chest and belly)", () => {
  // 0.0.87: the Corgi is on the v2 sheets, so the fixture was the plum Lynx idle with the same leak painted onto its
  // pale chest fur; 0.0.91: the Penguin is v2 too, so it's the plum Giraffe idle with lavender on its pale patches
  // (scripts/fixtures/giraffe-plum-idle-leak-k91.png).
  const { status, verdict } = runLegacy("giraffe-plum-idle=scripts/fixtures/giraffe-plum-idle-leak-k91.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^giraffe-plum: idle coat colour on fur/.test(f)), verdict.failures.join("\n"));
  const leaks = verdict.failures.filter((f) => /coat colour on fur/.test(f));
  assert.ok(leaks.every((f) => f.startsWith("giraffe-plum:")), leaks.join("\n"));
});
