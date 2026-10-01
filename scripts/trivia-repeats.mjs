#!/usr/bin/env node
/**
 * Trivia card repeat simulation against the real picker (src/game/trivia.ts).
 *
 *   npm run trivia:repeats            # repeat rate at 200/500/1000/2000 cards answered
 *   npm run trivia:repeats -- --json  # same, as JSON
 *   node scripts/trivia-repeats.mjs --old-store   # closed cards not recorded (pre-fix store)
 *
 * Bundles the game modules with rolldown (ships with vite) into a temp file, then plays
 * seeded sessions: random lamp from the city layout, category from the lamp's six offers,
 * 10% of shown cards closed without an answer. A repeat is a card (or a near-duplicate
 * prompt) the player was already shown.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "./with-app-env.mjs";

const ROOT = projectRoot();
let cached;
export async function loadGame() {
  if (cached) return cached;
  const { build } = await import("rolldown");
  const dir = mkdtempSync(join(tmpdir(), "trivia-repeats-"));
  const entry = join(dir, "entry.ts");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    entry,
    `export * from ${JSON.stringify(resolve(ROOT, "src/game/trivia.ts"))};\nexport { CITIES, allPois } from ${JSON.stringify(resolve(ROOT, "src/game/data.ts"))};\nexport { dupKey } from ${JSON.stringify(resolve(ROOT, "src/game/rarity.ts"))};\n`,
  );
  const file = join(dir, "game.mjs");
  await build({
    input: entry,
    cwd: ROOT,
    resolve: { alias: { "@": resolve(ROOT, "src") } },
    platform: "node",
    logLevel: "silent",
    output: { file, format: "esm" },
  });
  const quiet = console.info;
  console.info = () => {};
  cached = await import(pathToFileURL(file).href);
  console.info = quiet;
  return cached;
}

export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same history bookkeeping as the store: newest at the end, ASKED_KEEP entries each. */
export function remember(h, card, keep) {
  h.asked = [...h.asked.filter((x) => x !== card.q), card.q].slice(-keep);
  h.seenIds = [...h.seenIds.filter((x) => x !== card.id), card.id].slice(-keep);
}

export async function simulate({
  players = 24,
  cards = 2000,
  fav = false,
  travel = false,
  closeRate = 0.1,
  recordClosed = true,
  checks = [200, 500, 1000, 2000],
} = {}) {
  const G = await loadGame();
  const real = Math.random;
  const acc = Object.fromEntries(checks.map((n) => [n, { rep: 0, recent: 0, n: 0 }]));
  const cityIds = Object.keys(G.CITIES);
  try {
    for (let p = 0; p < players; p++) {
      Math.random = seeded(1000 + p * 7919);
      let cityId = travel ? cityIds[p % cityIds.length] : "austin";
      const h = { asked: [], seenIds: [] };
      const last = new Map();
      const favCat = G.ALL_CATS[p % G.ALL_CATS.length];
      let rep = 0;
      let recent = 0;
      for (let i = 1; i <= cards; i++) {
        if (travel && i % 150 === 0)
          cityId = cityIds[(cityIds.indexOf(cityId) + 1) % cityIds.length];
        const pois = G.allPois(G.CITIES[cityId]).filter((x) => x.tier);
        const poi = pois[(Math.random() * pois.length) | 0];
        const offer = G.offerCats(poi.id, i, 6, poi);
        const cat =
          fav && offer.includes(favCat) && Math.random() < 0.6
            ? favCat
            : offer[(Math.random() * offer.length) | 0];
        const card = G.pickTrivia(cityId, cat, poi, poi.tier, [...h.seenIds, ...h.asked]);
        const key = G.dupKey(card.q);
        if (last.has(key)) {
          rep++;
          if (i - last.get(key) <= 100) recent++;
        }
        last.set(key, i);
        // The store records answered cards and, since the repeat fix, closed ones (--old-store: answered only).
        if (Math.random() >= closeRate || recordClosed) remember(h, card, G.ASKED_KEEP);
        if (acc[i]) {
          acc[i].rep += rep;
          acc[i].recent += recent;
          acc[i].n += i;
        }
      }
    }
  } finally {
    Math.random = real;
  }
  const pct = (x, n) => +((100 * x) / Math.max(1, n)).toFixed(1);
  return Object.fromEntries(
    checks.map((n) => [
      n,
      { repeatPct: pct(acc[n].rep, acc[n].n), within100Pct: pct(acc[n].recent, acc[n].n) },
    ]),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const out = {};
  for (const [name, opt] of Object.entries({
    "any category, one city": {},
    "favourite category, one city": { fav: true },
    "favourite category, touring cities": { fav: true, travel: true },
  })) {
    out[name] = await simulate({ ...opt, recordClosed: !process.argv.includes("--old-store") });
    if (!process.argv.includes("--json"))
      console.log(
        name.padEnd(36),
        Object.entries(out[name])
          .map(([n, r]) => `${n}: ${r.repeatPct}% repeats (${r.within100Pct}% within 100)`)
          .join(" | "),
      );
  }
  if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 1));
}
