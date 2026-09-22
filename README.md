# Keyline

Walk a real city. Light lamps. Answer trivia. Collect matches. The street is thin on purpose.

Keyline is a walking trivia game on real maps. You pick a ward, wander it, and spend matches to light lamps. Right answers pay. Wrong ones still cost a match. That's the deal.

## A session

Title → pick a city → walk the map → lamps, matches, vaults → trivia cards → HQ when you need a desk.

Tap a distant match and you'll walk there. Walk over one and it's yours. Lamps want a match of their color. Vaults want more trivia cards and pay better.

## Matches

White, blue, green, amber, red, violet.

Rarer colors are harder trivia cards and nicer loot. Spend them or they stop showing up. Surplus is a planning problem, not a feature.

## HQ

Open **HQ** from the kit.

- **Ledger** — daily crate streak. One missed day is forgiven. Caps at 30.
- **Quests** — **City Pulse**, a separate daily check-in at the desk. Coin, once a day. Not the crate. Don't mix them up.
- **Bank** — four lower matches buy one higher (tax). One higher breaks into three lower (no tax). Walks stay on the street; lamps are a step off the curb, not a shortcut through the block.
- **Trivia boosts** — three correct in a row: a white match (Streak spark). Correct under 3 seconds: +5 coin (Perfect timing). First correct of a topic each UTC day: a white, up to three topics (Category charm).
- **Coin catalog** — prices and sinks for spending matches.
- **Cafe** — white-match drip only while that tab is focused.
- **News kiosk** — city-tagged trivia packs.
- **Satchel** — named lamps listed; unnamed ones collapse to one count line (no "Undiscovered lamp" spam).
- **Super Legendary** — the last coat at the outfitter, ten times the Fox. Hireable. That coat may cut the block. Default coats keep the curb.

**Standings** list first name and last initial only — Ryan G., not the whole name.

## For people who open the repo

TypeScript and Vite. The live game is [keyline.grok.me](https://keyline.grok.me/). The version is on the title screen, under the tagline. Source: [github.com/xlockeddown-glitch/keyline](https://github.com/xlockeddown-glitch/keyline).

Trivia cards: `npm run trivia:audit` checks structure (and `--facts` for volatile lookups). `npm run trivia:balance` inventories mix by topic/bank/city/rarity. `npm run trivia:quotas` fails if that mix breaks the caps in `scripts/trivia-quotas.json` (new bulk stays general/city-shared; deep cuts mainly red/violet). `--warn` reports without failing. `npm run trivia:retune` promotes/demotes from play signals.

A Friday morning job grows the pool: accuracy pass on existing cards, then 5–25 new city-tagged cards from quota gaps, then publish from the live app only.

Visual direction: [`docs/visual-direction.md`](docs/visual-direction.md) — hybrid. Keep the map tiles; lanterns and facades are the next art pass.

Scout idle/walk sheets: `npm run qa:sprites` fails on magenta, leftover opaque corners, 1px dropout holes, wrong frame size, or two scouts sharing one sheet.

## Before you publish

Do not publish until this list is green:

1. `npm run typecheck`
2. `npm test`
3. `npm run trivia:quotas` — required when trivia cards change; skip only if cards did not move
4. `npm run trivia:audit` — when cards or generators moved
5. `npm run qa:sprites`
6. Smoke the running app **and** the production build. The smoke must report `/sheet-k07d.css` HTTP 200 `text/css` (not an HTML 404).
   - `node scripts/browser-smoke.mjs http://127.0.0.1:8080/ /workspace/screenshots/app-builder-preview.png`
   - `npm run build && npm run preview:restart`
   - `node scripts/browser-smoke.mjs http://127.0.0.1:8081/ /workspace/screenshots/app-builder-built.png --baseline /workspace/screenshots/app-builder-preview.json`
7. Publish in Grok from the **existing** live app, then push the same commit to GitHub.

### Where to publish (live app)

Library → Apps → Earlier → Coin Hunt (`keyline.grok.me`) → Chats → Coin Hunt → select **Build** model → Files.

App id: `01a0aca9-a3e5-7de0-beb2-c543f9134594`.

Do **not** publish from a project-hub New Chat sandbox. Those create a Not Published temp slug and leave live stuck. Reload Preview until the title shows the new version, then Publish Changes immediately to the existing `keyline.grok.me` slug.

**v0.0.11**
