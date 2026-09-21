#!/usr/bin/env node
/**
 * Fail the build if the Vercel output would 413 or 500 the way last publish did:
 * WASM sidecars, `+`/`[...]` chunk names, wrong Node entry, oversized function.
 * Copy the hashed stylesheet to /sheet-k07d.css (outside /assets, whose 404s
 * are CDN-cached for a year) and stop missing /assets/* from inheriting
 * immutable cache via the SSR HTML fallback.
 */
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SHEET_NAME = "sheet-k07d.css";
const output = join(process.cwd(), ".vercel/output");
const func = join(output, "functions/__server.func");
const staticDir = join(output, "static");
const errors = [];

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function dirBytes(dir) {
  return walk(dir).reduce((n, p) => n + statSync(p).size, 0);
}

if (!existsSync(func)) errors.push("missing .vercel/output/functions/__server.func");
else {
  const files = walk(func);
  const wasm = files.filter((p) => /(?:^|\/)(?:pglite\.data|pglite\.wasm|initdb\.wasm)$/.test(p));
  if (wasm.length) errors.push(`wasm sidecars still in function: ${wasm.join(", ")}`);

  const ugly = files.filter((p) => /[+[\]%]/.test(p.split("/").pop() ?? ""));
  if (ugly.length) errors.push(`unsafe chunk names: ${ugly.map((p) => p.split("/").pop()).join(", ")}`);

  const vcPath = join(func, ".vc-config.json");
  if (!existsSync(vcPath)) errors.push("missing .vc-config.json");
  else {
    const vc = JSON.parse(readFileSync(vcPath, "utf8"));
    if (vc.runtime !== "nodejs20.x") errors.push(`runtime is ${vc.runtime}, need nodejs20.x`);
    if (vc.handler !== "index.mjs") errors.push(`handler is ${vc.handler}, need index.mjs`);
    if (vc.launcherType !== "Nodejs") errors.push(`launcherType is ${vc.launcherType}, need Nodejs`);
  }

  const indexPath = join(func, "index.mjs");
  if (!existsSync(indexPath)) errors.push("missing index.mjs");
  else {
    const index = readFileSync(indexPath, "utf8");
    if (!/export\s*\{\s*nodeHandler\s+as\s+default\s*\}/.test(index)) {
      errors.push("index.mjs does not export nodeHandler as default");
    }
  }

  const funcSize = dirBytes(func);
  if (funcSize > 5.5 * 1024 * 1024) {
    errors.push(`function ${ (funcSize / 1024 / 1024).toFixed(2) }MB exceeds 5.5MB cap`);
  }
  console.log(`[deploy-guard] function ${(funcSize / 1024 / 1024).toFixed(2)}MB`);
}

if (existsSync(staticDir)) {
  const staticSize = dirBytes(staticDir);
  if (staticSize > 8 * 1024 * 1024) {
    errors.push(`static ${ (staticSize / 1024 / 1024).toFixed(2) }MB exceeds 8MB cap`);
  }
  console.log(`[deploy-guard] static ${(staticSize / 1024 / 1024).toFixed(2)}MB`);

  const assetsDir = join(staticDir, "assets");
  const cssFiles = existsSync(assetsDir)
    ? readdirSync(assetsDir).filter((f) => /^styles-.*\.css$/.test(f))
    : [];
  if (!cssFiles.length) {
    errors.push("missing hashed stylesheet in .vercel/output/static/assets");
  } else {
    const src = join(assetsDir, cssFiles[0]);
    const dest = join(staticDir, SHEET_NAME);
    copyFileSync(src, dest);
    const publicDest = join(process.cwd(), "public", SHEET_NAME);
    copyFileSync(src, publicDest);
    if (!existsSync(dest) || statSync(dest).size < 1000) {
      errors.push(`${SHEET_NAME} missing or empty after copy`);
    }
    console.log(`[deploy-guard] css ${cssFiles[0]} (${statSync(src).size}B) copied to /${SHEET_NAME}`);
  }
} else {
  errors.push("missing .vercel/output/static");
}

const configPath = join(output, "config.json");
if (existsSync(configPath)) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  let routes = Array.isArray(config.routes) ? config.routes : [];
  // Drop the blanket immutable header on /assets/* — it was applied to
  // HTML 404 fallbacks and Cloudflare cached those 404s for a year.
  routes = routes.filter(
    (r) =>
      !(
        r &&
        r.src === "/assets/(.*)" &&
        r.headers &&
        r.status == null &&
        r.dest == null &&
        r.handle == null
      ),
  );
  const already = routes.some((r) => r && r.src === "/assets/(.*)" && r.status === 404);
  if (!already) {
    const fsIdx = routes.findIndex((r) => r && r.handle === "filesystem");
    const miss = {
      src: "/assets/(.*)",
      status: 404,
      headers: { "cache-control": "no-store" },
    };
    if (fsIdx >= 0) routes.splice(fsIdx + 1, 0, miss);
    else routes.push(miss);
  }
  config.routes = routes;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[deploy-guard] /assets miss → 404 no-store; no immutable header on misses");
}

if (errors.length) {
  for (const e of errors) console.error(`[deploy-guard] ${e}`);
  process.exit(1);
}
console.log("[deploy-guard] ok");
