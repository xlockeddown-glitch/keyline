/** Bump ZZ by 1 on each publish: 0.0.01 → 0.0.02 → … → 0.0.99 → 0.1.00. Keep in sync with package.json "version". */
export const APP_VERSION = "0.0.21";
/** Cache-bust token for hashed /assets JS. */
export const PUBLISH_STAMP = "k21a";
/** Stylesheet outside /assets — that prefix caches 404s for a year. Smoke asserts this path 200. */
export const SHEET_HREF = "/sheet-k07d.css";

// Weekly trivia ship 2026-09-22: cities_weekly + weekly_20260922 wired; Detroit RenCen HQ fix.

// 0.0.12: HQ tab labels (Atlas/Print/Ledger/Standings) high-contrast chips — were invisible on elevated panel.
// 0.0.13: Lantern glass art pass — soot rim, warm wick, short bloom; street + vault hero share layered glass (brass/soot).
// 0.0.13 facade: shop brass awning + CSS hanging lamp; HQ panel brass edge + wick (still k13a, no bump).
// 0.0.13 title folio: white-tier lamp (cap/frame/glass/post) on map block (still k13a, no bump).
// 0.0.14: trivia quota rebalance — trim excess math; deepen specialty red/violet (k14a).
// 0.0.15: Friday weekly trivia audit + growth (k15a).
// 0.0.16: trivia quota fix — cut 37 exact-duplicate math cards (math.ts copies of math_more prompts); +193 deep-cut specialty cards in science/nature/history_life_part_a (wired via weekly_20260922); science_life_part_a placeholder filled (k16a).
// 0.0.17: vault tier contrast — lantern glass/wick/bloom carry the tier hue at full strength (lit palette), brass stays shared; rank pips 1–6 + bloom ramp for colorblind; white vs amber split (k17a).
// 0.0.18: street marker tier fix — The Run marker was hard-coded tier-amber but costs a blue match (map showed amber, toast said "Need a Blue match"); Run/Stack/lamp markup now built in game/pins.ts from series.cost / poi.tier; Run halo ring follows tier; pre-hydration title lamp gets tier-white (k18a).
// 0.0.19: vault ingredients — green+ drops the city's press stock; amber+ at a named ward drops that cut; Print spends one (k19a).
// 0.0.20: ledger quests, lantern cloth, red scrap and violet pattern (k20a).
// 0.0.21: New York walks stay on the curb; map zoom no longer stacks street names (k21a).
