// 0.1.193: deploy-guard keeps requiring the current build's hashed stylesheet; the rerun flag is the only way past it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const GUARD = fileURLToPath(new URL("./deploy-guard.mjs", import.meta.url));
const CSS = "a{color:red}".repeat(200);

function fixture({ hashed }) {
  const root = mkdtempSync(join(tmpdir(), "guard-"));
  const out = join(root, ".vercel/output");
  const func = join(out, "functions/__server.func");
  mkdirSync(func, { recursive: true });
  mkdirSync(join(out, "static/assets"), { recursive: true });
  mkdirSync(join(root, "public"), { recursive: true });
  writeFileSync(join(func, ".vc-config.json"), JSON.stringify({ runtime: "nodejs22.x", handler: "index.mjs", launcherType: "Nodejs" }));
  writeFileSync(join(func, "index.mjs"), "const nodeHandler = () => {};\nexport { nodeHandler as default };\n");
  // The stable sheet is always present in the output (public/ ships it), whatever this build produced.
  writeFileSync(join(out, "static/sheet-k07d.css"), CSS);
  if (hashed) writeFileSync(join(out, "static/assets/styles-abc123.css"), CSS);
  writeFileSync(join(out, "config.json"), JSON.stringify({ version: 3, routes: [{ handle: "filesystem" }] }));
  return root;
}

function run(root, env = {}) {
  return spawnSync(process.execPath, [GUARD], { cwd: root, env: { ...process.env, DEPLOY_GUARD_RERUN: "", ...env }, encoding: "utf8" });
}

test("first pass with no hashed stylesheet fails even though /sheet-k07d.css is already there", () => {
  const r = run(fixture({ hashed: false }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing hashed stylesheet/);
});

test("explicit same-build rerun accepts the stable sheet", () => {
  const r = run(fixture({ hashed: false }), { DEPLOY_GUARD_RERUN: "1" });
  assert.equal(r.status, 0, r.stderr + r.stdout);
});

test("the hashed stylesheet is copied to the stable sheet and then removed from assets; misses stay no-store 404", () => {
  const root = fixture({ hashed: true });
  const r = run(root);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(existsSync(join(root, ".vercel/output/static/assets/styles-abc123.css")), false);
  assert.equal(readFileSync(join(root, ".vercel/output/static/sheet-k07d.css"), "utf8"), CSS);
  const cfg = JSON.parse(readFileSync(join(root, ".vercel/output/config.json"), "utf8"));
  assert.ok(cfg.routes.some((x) => x.src === "/assets/(.*)" && x.status === 404 && x.headers["cache-control"] === "no-store"));
});
