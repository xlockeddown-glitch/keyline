#!/usr/bin/env node
/**
 * Fail the build if the Vercel output would 413 or 500 the way last publish did:
 * WASM sidecars, `+`/`[...]` chunk names, wrong Node entry, oversized function.
 * Also require the hashed stylesheet and copy it to /keyline.css so a poisoned
 * CDN 404 on /assets/styles-*.css cannot unstyle the live document.
 */
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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
    const dest = join(staticDir, "keyline.css");
    copyFileSync(src, dest);
    console.log(`[deploy-guard] css ${cssFiles[0]} (${statSync(src).size}B) copied to keyline.css`);
  }
} else {
  errors.push("missing .vercel/output/static");
}

if (errors.length) {
  for (const e of errors) console.error(`[deploy-guard] ${e}`);
  process.exit(1);
}
console.log("[deploy-guard] ok");
