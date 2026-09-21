#!/usr/bin/env node
/**
 * Production uniformity agent.
 *
 * Walks the built (or live) app and checks surfaces that should share one
 * visual language: scout hire plates, overlay chrome, token backgrounds.
 * Writes screenshots under /workspace/screenshots/uniformity/ and a JSON
 * verdict. Exit 0 only when the measured plates match.
 *
 *   node scripts/uniformity-qa.mjs
 *   node scripts/uniformity-qa.mjs http://127.0.0.1:8081/
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] || "http://127.0.0.1:8080/");
const outDir = checkedOutputPath("/workspace/screenshots/uniformity", ["/workspace"], "uniformity dir");
mkdirSync(outDir, { recursive: true });
const pixelScript = join(fileURLToPath(new URL(".", import.meta.url)), "uniformity-pixels.py");

const timeout = Number(process.env.UNIFORMITY_TIMEOUT_MS || 45000);

function fail(failures, extra = {}) {
  const verdict = { ok: false, url, failures, outDir, ...extra };
  writeFileSync(join(outDir, "verdict.json"), JSON.stringify(verdict, null, 2));
  console.error(JSON.stringify(verdict, null, 2));
  process.exit(1);
}

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(timeout);

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Walk Austin/i }).waitFor({ timeout });
  await page.screenshot({ path: join(outDir, "title.png") });

  await page.getByRole("button", { name: /Walk Austin/i }).click();
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.isVisible().catch(() => false)) await skip.click();

  await page.getByRole("button", { name: "Open HQ" }).click();
  await page.getByRole("button", { name: "Print" }).click();
  await page.locator(".scout-hire").first().waitFor({ timeout: 15000 });
  await page.screenshot({ path: join(outDir, "hq-print.png") });

  const hires = page.locator(".scout-hire");
  const n = await hires.count();
  const hirePaths = [];
  for (let i = 0; i < n; i += 1) {
    const dest = join(outDir, `hire-${i}.png`);
    await hires.nth(i).screenshot({ path: dest });
    hirePaths.push(dest);
  }

  const plates = await hires.evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      const marker = node.querySelector(".scout-marker");
      return {
        tag: node.tagName,
        scout: marker?.getAttribute("data-scout") || "",
        width: style.width,
        height: style.height,
        radius: style.borderRadius,
        background: style.backgroundColor,
        border: style.borderTopColor,
      };
    }),
  );

  const failures = [];
  if (plates.length !== 7) failures.push(`expected 7 scout plates, got ${plates.length}`);

  const keyOf = (p) => `${p.width}|${p.height}|${p.radius}|${p.background}`;
  const keys = new Set(plates.map(keyOf));
  if (keys.size > 1) {
    failures.push(`scout plates do not share one chrome: ${[...keys].join(" || ")}`);
  }

  let pixels = null;
  if (hirePaths.length) {
    const raw = execFileSync("python3", [pixelScript, ...hirePaths], { encoding: "utf8" });
    pixels = JSON.parse(raw);
    for (const msg of pixels.failures ?? []) failures.push(msg);
  }

  const verdict = { ok: failures.length === 0, url, plates, pixels, failures, outDir };
  writeFileSync(join(outDir, "verdict.json"), JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict, null, 2));
  if (failures.length) process.exit(1);
} catch (err) {
  fail([String(err?.message || err)]);
} finally {
  await browser.close();
}
