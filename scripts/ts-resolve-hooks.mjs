/**
 * Test-only resolve hook: lets node --test load the app's TypeScript banks, which import
 * extensionless ("./rarity") and "@/" paths the way Vite does.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith("@/")) spec = pathToFileURL(join(SRC, spec.slice(2))).href;
  const relative = spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("file:");
  if (relative && !/\.[cm]?[jt]sx?$/.test(spec) && context.parentURL) {
    const base = new URL(spec, context.parentURL);
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const cand = new URL(base.href + ext);
      if (existsSync(fileURLToPath(cand))) return next(cand.href, context);
    }
  }
  return next(spec, context);
}
