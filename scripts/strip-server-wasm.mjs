#!/usr/bin/env node
/**
 * PGLite's wasm/data sidecars (~16 MB) must not ship in the Vercel function.
 * Production uses Neon. Local `vite dev` loads wasm from node_modules.
 */
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), ".vercel/output/functions/__server.func");
const kill = new Set(["pglite.data", "pglite.wasm", "initdb.wasm"]);

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (kill.has(ent.name)) rmSync(p, { force: true });
  }
}

walk(root);
