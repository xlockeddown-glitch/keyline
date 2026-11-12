#!/usr/bin/env node
/**
 * 0.1.158: capture True/False and Closest Number vault cards + result pops.
 * Uses the shipped sheet so the shots look like the game. Does not start the app.
 *
 *   node scripts/shot-trivia-formats.mjs
 *
 * Writes PNGs to /home/box/keyline-art/shots/trivia-formats/.
 */
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = "/home/box/keyline-art/shots/trivia-formats";
const SHEET = "/sheet-k07d.css";

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="${SHEET}" />
  <style>
    html, body { margin: 0; background: #14110e; color: var(--color-fg, #f3e9d7); min-height: 100%; }
    /* A still night street behind the card, so the overlay reads like the game. */
    body { background:
      radial-gradient(800px 400px at 50% 120%, rgba(212, 160, 70, 0.16), transparent 60%),
      linear-gradient(#1a1612, #0e0c0a);
      font-family: var(--font-body, "Source Serif 4", Georgia, serif);
    }
    .shot { min-height: 100vh; position: relative; }
    /* Playwright's animations:disabled would freeze result-out at opacity 0. */
    .result-pop { animation: none !important; opacity: 1 !important; transform: none !important; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
  </style>
</head>
<body>
<!-- SCENE: tf-question -->
<div class="shot" data-scene="tf-question">
  <div class="vault-night tier-white absolute inset-0 z-[800] flex items-end justify-center p-3 sm:items-center">
    <div class="plate lamp-card w-full max-w-lg">
      <div class="lamp-card-body px-5 pt-5 sm:px-6 sm:pt-6">
        <div class="flex items-start gap-4">
          <div class="min-w-0">
            <p class="kicker">I vault · Landmark · Science</p>
            <h2 class="font-display mt-1 text-2xl leading-tight text-balance">Congress Avenue Bridge</h2>
          </div>
        </div>
        <div class="plate-quiz mt-4">
          <div class="wick is-perfect" aria-hidden><i style="width:78%"></i></div>
          <p class="plate-meta">
            <span>Easy</span>
            <span class="grade is-perfect">Perfect</span>
            <span class="tabular-nums">19.4s</span>
            <span class="text-fg-subtle">×0.7</span>
          </p>
          <p class="plate-q">At sea level, pure water boils at about 100 °C.</p>
          <div class="plate-choices">
            <button type="button" class="plate-choice"><span class="plate-letter">T</span><span>True</span></button>
            <button type="button" class="plate-choice"><span class="plate-letter">F</span><span>False</span></button>
          </div>
          <p class="mt-2 text-xs text-fg-subtle">T/F or 1/2</p>
        </div>
      </div>
      <div class="lamp-card-foot px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        <button type="button" class="btn btn-ghost w-full">Leave vault</button>
      </div>
    </div>
  </div>
</div>

<!-- SCENE: tf-result -->
<div class="shot" data-scene="tf-result" hidden>
  <div class="pointer-events-none absolute inset-0 z-[850] flex items-center justify-center px-4 pb-32">
    <button type="button" class="result-pop pointer-events-auto is-hit" style="--hold: 30s">
      <div class="emb-wrap is-perfect">
        <p class="emb-rating font-display" data-testid="loot-rating">Perfect</p>
        <p class="mt-3 text-sm text-fg-muted text-pretty">At standard sea-level pressure water boils at about 100 °C (212 °F); higher up it boils cooler.</p>
      </div>
    </button>
  </div>
</div>

<!-- SCENE: near-input -->
<div class="shot" data-scene="near-input" hidden>
  <div class="vault-night tier-amber absolute inset-0 z-[800] flex items-end justify-center p-3 sm:items-center">
    <div class="plate lamp-card w-full max-w-lg">
      <div class="lamp-card-body px-5 pt-5 sm:px-6 sm:pt-6">
        <div class="flex items-start gap-4">
          <div class="min-w-0">
            <p class="kicker">IV vault · Campus · Math</p>
            <h2 class="font-display mt-1 text-2xl leading-tight text-balance">UT Tower</h2>
          </div>
        </div>
        <div class="plate-quiz mt-4">
          <div class="wick is-good" aria-hidden><i style="width:64%"></i></div>
          <p class="plate-meta">
            <span>Medium</span>
            <span class="grade">Estimate</span>
            <span class="tabular-nums">21.2s</span>
            <span class="text-fg-subtle">×1</span>
          </p>
          <p class="plate-q">About how much is 387 × 42?</p>
          <form class="mt-3 flex flex-col gap-2" data-testid="near-form" onsubmit="return false">
            <label class="sr-only" for="near-guess">Your estimate</label>
            <input id="near-guess" class="acct-input tabular-nums" value="16,000" readonly data-testid="near-guess" />
            <button type="button" class="btn btn-primary w-full" data-testid="near-lock">Lock in</button>
          </form>
          <p class="mt-2 text-xs text-fg-subtle">Type a number, then Lock in or press Enter</p>
        </div>
      </div>
      <div class="lamp-card-foot px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        <button type="button" class="btn btn-ghost w-full">Leave vault</button>
      </div>
    </div>
  </div>
</div>

<!-- SCENE: near-close-result -->
<div class="shot" data-scene="near-close-result" hidden>
  <div class="pointer-events-none absolute inset-0 z-[850] flex items-center justify-center px-4 pb-32">
    <button type="button" class="result-pop pointer-events-auto is-hit" style="--hold: 30s">
      <div class="emb-wrap is-great">
        <p class="emb-rating font-display" data-testid="loot-rating">Great</p>
        <p class="mt-2 text-sm text-fg-muted text-pretty" data-testid="near-line">16,254 · you said 16,000 · 1.6% off.</p>
      </div>
    </button>
  </div>
</div>

<!-- SCENE: near-far-result -->
<div class="shot" data-scene="near-far-result" hidden>
  <div class="pointer-events-none absolute inset-0 z-[850] flex items-center justify-center px-4 pb-32">
    <button type="button" class="result-pop pointer-events-auto is-miss" style="--hold: 30s">
      <p class="kicker">Wrong answer</p>
      <p class="font-display mt-1 text-3xl leading-none">Not quite</p>
      <p class="mt-3 text-sm text-fg-muted">Not this time (the key is used up). The right answer was:</p>
      <p class="mt-1 text-base font-medium text-pretty" data-testid="near-line">16,254 · you said 4,000 · 75.4% off.</p>
    </button>
  </div>
</div>
</body>
</html>
`;

const MIME = { ".css": "text/css", ".html": "text/html", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".png": "image/png", ".svg": "image/svg+xml" };

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (url.pathname === "/" || url.pathname === "/shot.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }
  const file = join(ROOT, "public", url.pathname);
  try {
    const data = readFileSync(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const origin = `http://127.0.0.1:${port}`;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
const scenes = ["tf-question", "tf-result", "near-input", "near-close-result", "near-far-result"];
const views = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

try {
  for (const view of views) {
    const page = await browser.newPage({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 2 });
    await page.goto(origin, { waitUntil: "networkidle" });
    for (const scene of scenes) {
      await page.evaluate((id) => {
        for (const el of document.querySelectorAll("[data-scene]")) el.hidden = el.dataset.scene !== id;
      }, scene);
      await page.waitForTimeout(80);
      const path = join(OUT, `${scene}-${view.name}.png`);
      await page.screenshot({ path, fullPage: true, animations: "disabled" });
      console.log("wrote", path);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
