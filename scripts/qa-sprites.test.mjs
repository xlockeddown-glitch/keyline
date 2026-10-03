import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
  assert.equal(verdict.sheets.length, 27);
  // 0.0.45: every character × 4 print-shop coats × walk / idle / side idle (9 characters since the 0.0.51 Giraffe).
  assert.equal(verdict.coatSheets, 108);
  assert.equal(verdict.coats.length, 36);
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

test("qa:sprites fails the 0.0.37 Turtle, which walked in a bare shell but idled in a hooded coat", () => {
  const { status, verdict } = runWith(
    "turtle-walk=scripts/fixtures/turtle-walk-shell-k37.png,turtle-idle-side=scripts/fixtures/does-not-exist.png",
  );
  assert.equal(status, 1);
  for (const facing of ["front", "left", "right"]) {
    assert.ok(
      verdict.failures.some((f) => f.startsWith(`turtle: walk and idle coats differ in colour (walking ${facing},`)),
      verdict.failures.join("\n"),
    );
  }
  // Only the turtle trips the coat check; the other seven stay inside their limits.
  const coatFails = verdict.failures.filter((f) => /coats? differ/.test(f));
  assert.ok(coatFails.every((f) => f.startsWith("turtle:")), coatFails.join("\n"));
  const turtle = verdict.palettes.find((p) => p.scout === "turtle");
  assert.ok(turtle.coatDeltaH > 3.2 && turtle.coatDeltaH < 5.5, `scored ${turtle.coatDeltaH}: under the old 5.5 limit, over the new one`);
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
  assert.deepEqual([...coats].sort(), ["bottle", "oilskin", "oxblood", "plum"]);
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
