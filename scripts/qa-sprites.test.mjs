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
  assert.equal(verdict.sheets.length, 24);
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
  assert.ok(verdict.palettes.filter((p) => p.scout !== "cat").every((p) => p.coatDeltaH <= 5.5));
});

test("qa:sprites fails a character with no side idle", () => {
  const { status, verdict } = runWith("owl-idle-side=scripts/fixtures/does-not-exist.png");
  assert.equal(status, 1);
  assert.ok(verdict.failures.some((f) => /^owl: no side idle sheet/.test(f)));
});
