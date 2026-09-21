---
name: visual-uniformity
description: >
  Production-build visual uniformity agent. Verifies scout hire plates, overlay
  chrome, token tiles, and chroma leaks share one language. Triggers on
  "uniformity", "shop backgrounds", "character portraits", "hire plates",
  "production build QA", "visual QA", "magenta", "matching backgrounds".
metadata:
  short-description: "Production visual uniformity — hire plates, chrome, chroma"
user-invocable: true
---

# Visual uniformity (production)

This agent **verifies**. It does not redesign. Run it against the **built**
app, not only live HMR — the published copy is what players see.

## When

Every time scout portraits, shop/HQ chrome, item tiles, or overlay panels
change, and before claiming a production build is clean.

## Automatic (do not skip)

Serve the current production build, then:

```
npm run preview:restart
node scripts/uniformity-qa.mjs http://127.0.0.1:8081/
npm run preview:stop
```

Exit 0 is required. Verdict + plate crops live at
`screenshots/uniformity/verdict.json` and `hire-0.png` … `hire-6.png`.

The script already:

1. **Chrome** — every `.scout-hire` tile is the same width, height, radius, and CSS background.
2. **Pixels** — corners of those tiles agree (no cream vs soot vs magenta mix).
3. **Chroma** — magenta leftover from sprite processing is an error.

Then **look at the hire PNGs yourself**. The JSON cannot catch a fox that is
twice as big as the raccoon, or a portrait still sitting on a painted square
when the others are transparent on the tile.

## Across the board

Same pass for anything that is a repeated token:

- Hire plates in the street outfitter and HQ Print (same `ScoutRoster`)
- Item icons in the satchel / kiosk
- Overlay headers (shop, HQ, satchel, vault) — same panel radius and kicker
- Map scout vs shop scout — idle sprite, not a one-off portrait with a unique ground

One mismatch = fail the build, then the parent agent fixes art or CSS.

## Fail closed

Do not report "looks fine" if `uniformity-qa.mjs` exited 1, or if you did not
open the hire crops. Do not skip production (`:8081`) and only check live HMR.
