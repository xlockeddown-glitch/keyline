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
  // 8 legacy characters × walk / idle / side idle; the Turtle is on the v2 sheets (0.0.83).
  assert.equal(verdict.sheets.length, 24);
  // 8 legacy characters × (4 print-shop coats + 7 vat dyes) × walk / idle / side idle.
  assert.equal(verdict.coatSheets, 264);
  assert.equal(verdict.coats.length, 88);
  assert.deepEqual(verdict.v2.map((r) => r.scout), ["turtle"]);
  assert.deepEqual(verdict.warnings, []);
  assert.equal(verdict.failures.length, 0);
});

function runWith(override) {
  const r = spawnSync("python3", [join(root, "scripts/qa-sprites.py")], {
    encoding: "utf8",
    cwd: root,
    env: { ...process.env, KEYLINE_SPRITE_OVERRIDE: override },
  });
  return { status: r.status, verdict: JSON.parse(r.stdout) };
}

test("qa:sprites fails a recoloured character (the 0.0.36 lynx was the fox's silhouette)", () => {
  const { status, verdict } = runWith(
    "lynx-walk=scripts/fixtures/lynx-walk-recolour-k36.png,lynx-idle=scripts/fixtures/lynx-idle-recolour-k36.png",
  );
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /fox\/lynx walk: same silhouette/.test(f)), verdict.failures.join("\n"));
  assert.ok(verdict.failures.some((f) => /fox\/lynx idle: same silhouette/.test(f)));
});

test("qa:sprites fails a character whose walk and idle coats differ (the 0.0.36 Tabby walked in green)", () => {
  const { status, verdict } = runWith("cat-walk=scripts/fixtures/cat-walk-olive-k36.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^cat: walk and idle coats differ/.test(f)), verdict.failures.join("\n"));
  assert.ok(verdict.palettes.filter((p) => p.scout !== "cat").every((p) => p.coatDeltaH <= p.coatLimit));
});

// ── 0.0.83 v2 sheets (the redrawn Turtle) ──

function v2Fixture(kind) {
  // Writes a broken copy of the committed Turtle v2 sheet or mask to a temp file and returns its path.
  const out = join(mkdtempSync(join(tmpdir(), "qa-v2-")), `${kind}.png`);
  const py = {
    // Coat mask over the whole body: shell, belly, skin and boots would all take the coat colour.
    "mask-everywhere": `from PIL import Image\nim = Image.open("public/sprites/scouts/turtle-v2.png").convert("RGBA")\nImage.eval(im.getchannel("A"), lambda v: 255 if v else 0).save("${out}")`,
    // A walk frame that lost its art (right walk, frame 3).
    "missing-frame": `from PIL import Image\nim = Image.open("public/sprites/scouts/turtle-v2.png").convert("RGBA")\nim.paste((0, 0, 0, 0), (3 * 192, 2 * 192, 4 * 192, 3 * 192))\nim.save("${out}")`,
  }[kind];
  const r = spawnSync("python3", ["-c", py], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return out;
}

test("qa:sprites checks the v2 Turtle: every frame, planted feet, the mask on the coat, every coat and dye exact", () => {
  const { verdict } = runWith("");
  const t = verdict.v2.find((r) => r.scout === "turtle");
  assert.equal(t.walkRows.length, 4);
  for (const row of t.walkRows) {
    assert.equal(row.feet.length, 8);
    const spread = Math.max(...row.feet) - Math.min(...row.feet);
    // Profiles: planted feet hold the floor. Toward/away from camera the stepping foot lands a little lower
    // (it comes toward the viewer) — but it must move at all, or the walk is marching in place again.
    if (row.row === 1 || row.row === 2) assert.ok(spread <= 3, `row ${row.row} feet ${row.feet}`);
    else assert.ok(spread >= 2 && spread <= 4, `row ${row.row} feet ${row.feet}`);
  }
  assert.deepEqual(t.idle.map((r) => r.face), ["down", "left", "right"]);
  assert.ok(t.maskHueGap <= 14, `mask hue gap ${t.maskHueGap}`);
  assert.ok(t.maskFit >= 0.75, `mask fit ${t.maskFit}`);
  assert.equal(t.variants.length, 11);
  for (const v of t.variants) {
    assert.equal(v.offMask, 0, `${v.coat} changed pixels off the coat`);
    assert.ok(v.targetHueGap <= 20, `${v.coat} hue ${v.targetHueGap}`);
  }
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
  const { verdict } = runWith("");
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
  const { status, verdict } = runWith("owl-idle-side=scripts/fixtures/does-not-exist.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^owl: no side idle sheet/.test(f)));
});

// ── 0.0.45 print-shop coats ──

test("qa:sprites checks every coat variant in every pose: repainted, on its catalogue hue, one coat per outfit", () => {
  const { verdict } = runWith("");
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
  const { status, verdict } = runWith("fox-plum-walk=public/sprites/scouts/fox-walk.png");
  assert.equal(status, 1);
  for (const pose of ["walk front", "walk left", "walk right"]) {
    assert.ok(verdict.failures.some((f) => f.startsWith(`fox-plum: ${pose} doesn't show the coat`)), verdict.failures.join("\n"));
  }
  assert.ok(verdict.failures.every((f) => f.startsWith("fox-plum")), verdict.failures.join("\n"));
});

test("qa:sprites fails a coat with a side idle left in the old coat", () => {
  const { status, verdict } = runWith("owl-oxblood-idle-side=public/sprites/scouts/owl-idle-side.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => f.startsWith("owl-oxblood: side left doesn't show the coat")), verdict.failures.join("\n"));
});

test("qa:sprites fails a coat sheet with a different silhouette from the character", () => {
  const { status, verdict } = runWith("cat-oxblood-idle=public/sprites/coats/corgi-oxblood-idle.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^cat-oxblood-idle: silhouette differs/.test(f)), verdict.failures.join("\n"));
});

test("qa:sprites fails an outfit whose walk is a different coat from its idle", () => {
  const { status, verdict } = runWith("cat-oxblood-walk=public/sprites/coats/cat-plum-walk.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^cat-oxblood: walk (front|left|right) coat hue is \d+° off Oxblood Greatcoat/.test(f)), verdict.failures.join("\n"));
});

test("qa:sprites fails coat colour on fur (the 0.0.80 plum Corgi idled with a lavender chin, chest and belly)", () => {
  const { status, verdict } = runWith("corgi-plum-idle=scripts/fixtures/corgi-plum-idle-leak-k80.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^corgi-plum: idle coat colour on fur/.test(f)), verdict.failures.join("\n"));
  const leaks = verdict.failures.filter((f) => /coat colour on fur/.test(f));
  assert.ok(leaks.every((f) => f.startsWith("corgi-plum:")), leaks.join("\n"));
});
