import { chromium } from "/workspace/keyline-wk1023/node_modules/playwright/index.mjs";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
mkdirSync("png", { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const p = await b.newPage();
for (const f of readdirSync("svg")) {
  await p.setContent(`<html><body style="margin:0;background:transparent">${readFileSync("svg/" + f, "utf8")}</body></html>`);
  await p.locator("svg").screenshot({ path: "png/" + f.replace(".svg", ".png"), omitBackground: true });
}
await b.close();
