/** Bump ZZ by 1 on each publish: 0.0.01 → 0.0.02 → … → 0.0.99 → 0.1.00. Keep in sync with package.json "version". */
export const APP_VERSION = "0.0.36";
/** Cache-bust token for hashed /assets JS. */
export const PUBLISH_STAMP = "k36a";
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
// 0.0.22: mystery wheel every 25 of a color; four violet night marks, six-hour dark (k22a).
// 0.0.23: math follows the lamp; more street keys that drift rarer; Video games and Celebrity; Run holds sprint; walks use paths and roads; matchbook matches fill the box (k23a).
// 0.0.24: ride mini-games slice 1 — Play while you ride (Lamplighter), one best-outcome ride payout (idle/played/won), ride white pocket 15; station-sign fare desk; Journal/Places/Supplies/Progress/Leaderboard, Goals, train tickets (k24a). Briefed as "0.0.19 k19a"; main had already shipped 0.0.19–0.0.23.
// 0.0.25: ride games + Lamplighter, train station, Journal renames, trivia QA + anti-repeat, character art fixes (k25a).
// 0.0.25 k25b: Vercel function runtime nodejs20.x → nodejs22.x (Node 20 runtime discontinued; k25a publish failed). Still 0.0.25 — k25a never went live.
// 0.0.26: +358 local trivia cards for Chicago/NYC/SF; easy city cards can be white (k26a).
// 0.0.26 (k26b): upgrade @tanstack/react-start to 1.168.60 (start-server-core 1.169.39) for CVE-2026-102989 / GHSA-qx66-fv34-fjm8.
// 0.0.27: +374 local cards Detroit/London/Austin/Temple/Tucson; +297 local cards Toronto/New Orleans/Boston/LA (k27a).
// 0.0.28: +140 video game and +140 celebrity trivia cards; +141 history cards; Cary Grant fix; duplicate/odd-distractor cleanup (k28a).
// 0.0.29: Where am I? ride game for 2–6 min rides (clues from shipped city lore); history cleanup — 17 duplicate cards dropped (history and general.ts), odd only/as distractors fixed in 164 cards (k29a).
// 0.0.30: Where am I? perfect-round bonus (+1 white flat on 5/5); Temple and Tucson clue pools rebuilt from verified places (28 and 32 clues, real coordinates, unverified marks kept out of clues); 69 weak or dated clues rewritten across cities (k30a).
// 0.0.31: Fix Leaflet appendChild crash (aborted routes no longer draw a stale path on a removed map); Temple map: 7 nonexistent marks retired (3 replaced by real Jones Park and Santa Fe Plaza), Woodson Field fixed; saves migrate retired ids (k31a).
// 0.0.32: Walk pathing — foot-only routing (the car-profile OSRM fallback sent walks down the Lodge Freeway), one walkable-way rule (no motorways, trunks, ramps, foot=no) for the street graph, server fetch and match placement; Detroit street bake redone off the freeways; matches collect from the closest curb (k32a).
// 0.0.33: Match sorter ride game shares the 2–6 min band with Where am I? (picked per ride, ~50/50) — sort tumbling matches into the six tier boxes, colors plus rank pips, tap/drag/keys 1–6, +1 white on 26/26; Tucson: Congress/Granada stop and Five Points moved to their real spots, Sosa Avenue retired for the real Sosa–Carrillo–Frémont House (k33a).
// 0.0.34: Friday weekly trivia audit + 24 new cards (Temple/Austin/Tucson/London gaps + thin political/non-math topics); bank weekly_20261002 (k34a).
// 0.0.35: ride game variety — 2–6 min rides deal Where am I? or Match sorter at random, weighted against this save's recent rides (never 3 in a row); the dealt game is stored on the ride (k35a).
// 0.0.36: Route puzzle ride game for 6 min+ rides (fares cap at 14:00, so that's every long ride) — a little map of real places in the city ahead, tap the stops in the shortest order from S to F, three maps a round, letters/shapes/dashes so colour is never the only cue, tap or keys; 3/3 shortest pays the perfect +1 white (k36a).
