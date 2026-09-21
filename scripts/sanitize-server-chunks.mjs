#!/usr/bin/env node
/**
 * Nitro names concatenated chunks like `core+[...].mjs` and `h3+rou3+srvx.mjs`.
 * Local filesystems accept that; Vercel/S3 treats `+` as space and the
 * function 404s its own imports. Rename to safe tokens and rewrite specifiers.
 */
import { readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), ".vercel/output/functions/__server.func");

function walk(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function safeName(name) {
  return name.replaceAll("[...]", "-chunk").replaceAll("+", "-");
}

const files = walk(root);
const renamed = [];
for (const p of files) {
  const base = p.split("/").pop() ?? p;
  const next = safeName(base);
  if (next === base) continue;
  const dest = join(p.slice(0, p.length - base.length), next);
  renameSync(p, dest);
  renamed.push({ from: base, to: next });
}

if (!renamed.length) {
  process.exit(0);
}

const all = walk(root).filter((p) => p.endsWith(".mjs") || p.endsWith(".js"));
for (const p of all) {
  let text = readFileSync(p, "utf8");
  const before = text;
  for (const { from, to } of renamed) {
    text = text.split(from).join(to);
  }
  if (text !== before) writeFileSync(p, text);
}

console.log(
  `[sanitize] ${renamed.length} chunk name(s): ${renamed.map((r) => r.to).join(", ")}`,
);
