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

**Standings** list first name and last initial only — Ryan G., not the whole name.

## For people who open the repo

TypeScript and Vite. The live game is [keyline.grok.me](https://keyline.grok.me/). The version is on the title screen, under the tagline. Source: [github.com/xlockeddown-glitch/keyline](https://github.com/xlockeddown-glitch/keyline).

Trivia cards: `npm run trivia:balance` inventories mix by topic/bank/city/rarity. `npm run trivia:quotas` fails if that mix breaks the caps in `scripts/trivia-quotas.json` (new bulk stays general/city-shared; deep cuts mainly red/violet). `--warn` reports without failing.

**v0.0.05**
