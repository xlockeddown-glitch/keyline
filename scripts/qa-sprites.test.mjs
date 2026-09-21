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
  assert.equal(verdict.sheets.length, 16);
  assert.equal(verdict.failures.length, 0);
});
