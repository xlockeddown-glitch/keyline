/** Bump ZZ by 1 on each publish: 0.0.01 → 0.0.02 → … → 0.0.99 → 0.1.00. Keep in sync with package.json "version". */
export const APP_VERSION = "0.0.41";
/** Cache-bust token for hashed /assets JS. */
export const PUBLISH_STAMP = "k41a";
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
// 0.0.37: character art — the Lynx is its own animal (ear tufts, bobbed black-tipped tail, cheek ruff, stockier build, spotted tawny fur) instead of a recoloured fox; the Tabby's walk coat was olive green while it idled in brown, now brown throughout; every character keeps facing left/right when it stops (side idle sheets); qa:sprites fails shared silhouettes, walk/idle coat mismatches and missing side idles (k37a).
// 0.0.38: the Turtle walks in the brown hooded coat it idles in (it walked as a bare green shell); qa:sprites checks the coat on every walk facing and the shop icon at a tighter 3.2 limit (raccoon 5.5), so a shell-vs-coat mismatch fails (k38a).
// 0.0.39: trivia answers no longer give themselves away by length — 1302 cards where the correct answer was clearly the longest choice (40%+ or 12+ characters longer than every wrong choice) got parallel, plausible wrong choices or a trimmed answer; trivia:lint flags any new one and a test keeps the answer-is-longest rate near chance (42.5% → 32.3%, cap 35%) (k39a).
// 0.0.40: trivia duplicates cleared — 3 unwired copy banks (133 cards) removed, the remaining duplicate groups kept-best or rewritten into new verified cards; 129 absolute-tell cards (every wrong choice said only/always/never) given plain distractors; +55 verified Temple cards (Santa Fe depot and Harvey House, Scott & White, Belton Lake, McLane, local sports and notables) across history/sports/arts/nature/science, Temple 90 → 145; trivia:lint 324 → 0 warnings (k40a).
// 0.0.41: ride game picker — on a train ride the player picks the mini-game: every game whose minimum round fits the time left (Lamplighter 15 s, Where am I? and Match sorter ~34 s, Route puzzle 2 min) is listed with an icon and a one-liner, the varied 0.0.35 deal is pre-selected as Suggested, the pick is stored on the ride, and after a round the player can go again or switch games (the ride pays its best round; pay never depends on the game; Lamplighter's all-lit no-stray round now earns the same +1 perfect bonus as the others). Reverses the 0.0.35 'no swap button' call. City-local card check: no Austin cards in Detroit's block; a test guards cards naming another city (k41a).
