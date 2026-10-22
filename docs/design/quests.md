# Weekly and monthly quests to replace milestones (design only)

Status: draft for Ryan, 2026-10-21, against origin/main 2c10d6d (0.1.20). No code has changed.

## 1. What exists today

### The milestones
Code: `src/game/quests.ts` (`LongId`, `longProgress`, `claimLong`, `LONG_COPY`, plus the per-city `Circuit`).

| Milestone | Goal | Reward |
|---|---|---|
| City circuit (one per city, 15) | light a red lamp, light a lamp in a named area, hold 3 of the city's press stock, make a charm | that city's scarf cloth (+45 coin per clear when worn in that city); claiming spends the 3 stock |
| Clean hundred | 100 perfect answers | title "Clean hundred" |
| Unbroken | 10 perfect answers in a row | 1 schematic |
| The long walk | walk 10 km | Road-dust cloth (+20 coin per clear) and title "Walker" |
| Night mark | light one violet lamp | 1 coat pattern (pattern + press stock makes the Night-glass cloth, +150 per violet clear) |
| The Red Book | light a red lamp in every city (15) | Red-book cloth (+80 per red clear) |

They pay no coin or matches directly. They pay cloths, titles, a schematic and a pattern, all one-time.

### Where they show
- Journal → Progress tab → `QuestDesk` (`src/components/keyline/HqPanel.tsx`), under the "Milestones" heading. The Cloth closet below it lists what's owned and worn.
- You can only claim at a notice board (`act`). Anywhere else the row just says "Ready at the notice board."
- Toasts in `store.ts` `claimCircuit` / `claimLong`.

### How progress is stored
- **On the device.** `QuestLog` (`perfects`, `perfectRow`, `bestRow`, `reds`, `sawViolet`, `circuit`, `claimed`, `cloths`, `worn`, `title`, `patterns`) lives in the local save and is updated by `noteAnswer` / `noteClear` / `notePrint` in `store.ts`.
- **On the server, only the rewards.** A claim pushes a `cloth` op, and `wallet.ts clothOp` checks some proof:
  - scarf: the city must be unlocked, and 3 press stock are spent;
  - road-dust: the server's walk metres must be ≥ 10 km;
  - red-book: a red vault visited in every city;
  - night-glass: a pattern and a press stock are spent.
- **Not verified on the server:**
  - the circuit's red/area/charm checks;
  - the Clean hundred and Unbroken counts (the schematic is added locally);
  - Night mark's pattern grant;
  - titles, which sit in `meta.title`, capped at 40 characters.
- The server already has what quests need:
  - the `wallet_ledger` rows: `grade:*` with the grade and a market flag `mk`, plus `goal:*`, `ride:*`, `street:*` and others;
  - `plate_events_by_player`: tier (`rarity`), city, plate id (which gives the category), and correct or not;
  - `walk_distance_by_player`.

### What depends on them
- **Wallet:** `clothCoin` (`quests.ts`) pays cloth tips on every clear (`wallet.ts` ~l.899). `CLOTH_CAP`, `realCloth` and `clothOp` live in `wallet.ts`. **Keep all of these.**
- **City passes:** `cityPass.ts migrateUnlocks` reads old `save.quests.circuit` to unlock cities for pre-0.0.56 saves. It only reads, so keep that read.
- **Levels/XP:** they don't use milestones. `levels.ts xpOf` comes from server counts (correct answers by tier, km, `goal:` rows, `ride:` rows), and the ladder titles come from `levelsServer.ts`, so they're separate from the "Clean hundred" and "Walker" titles.
- **Goals:** the daily goals (`goals.ts`, `dgoal` op) are a separate system. They stay.
- **Tests:** `src/game/quests.test.ts` (circuit and long-milestone cases) and `cityPass.test.ts` (reads `quests.circuit`).
- **Errand / notice-board contract** (`Errand` in the same file): not a milestone. It stays.

## 2. Replacement: weekly and monthly quests

### Reset time — recommended: one global clock, America/Chicago
- **Weekly:** Monday 00:00 America/Chicago.
- **Monthly:** the 1st, 00:00 America/Chicago.
- **Why:** the server already keys daily goals, spark caps and street pickups to the Chicago day (`walletApply.ts chicagoDay`). One clock means one period key everyone shares (`W2026-44`, `M2026-11`), the same quests for all, and nobody gains by switching city to reset early.
- Player-city time would mean one period per city and lets travelling players reset early.
- Fix to do alongside this: the `dgoal` proof query uses `day + "T00:00:00Z"` (UTC midnight). Quest windows must use the Chicago boundary.

### Counting rules (all quests)
- **What counts:** only **graded, correct, paid lamp clears** (`grade:` ledger rows with `g` ≠ miss). This includes Runs and Stacks.
- **Sparks never count.** That's any answer with no match spent, violet or not, which is the 0.1.19 spark lesson: no free progress.
- **Progress is computed on the server** from the ledger rows in the period window. The device only displays it.

### Weekly quests (4, the same for everyone)
| id | Quest | Proof (server) | Reward |
|---|---|---|---|
| `w-lamps` | Light 25 lamps green or higher | `grade:` rows, poi tier ≥ green, correct | 2,000 coin + 1 green match |
| `w-ladder` | One right lamp in each of white, blue, green, amber, red | distinct tiers in `plate_events_by_player` | 1,500 coin + 1 amber match |
| `w-streak` | Reach a 15 right-in-a-row streak | longest correct run in the period's grade sequence | 1,000 coin + 1 blue + 1 green match |
| `w-out` | Finish 3 different ride games | distinct `ride:` ids in the window | 1,200 coin + 1 blue match |
| bonus | All four done | the four `quest:` rows exist | 1 red match |

Total for a full week: about 5,700 coin plus about 3,900 coin's worth of matches (`TIER_VALUE`: green 270, amber 810, red 2,430). That's roughly two to three evenings of play, and it doesn't outpace daily goals (60 coin per goal, a green for all three).

### Monthly quests (3)
| id | Quest | Proof (server) | Reward |
|---|---|---|---|
| `m-tour` | Right lamps in 4 different cities | distinct `city` on correct events | 15,000 coin + 1 red match |
| `m-night` | 12 right night-market lamps | `grade:` rows with `"mk":1` | 20,000 coin + 1 amber match |
| `m-shelf` | 60 right answers across 4+ categories, at least 10 each (Books counts) | category from `plate_id` | 12,000 coin + 1 red match |
| bonus | All three | the three `quest:` rows | 1 violet match, or 25,000 coin if the violet pocket is full |

About 47k coin a month: a Lamp cottage (40k) in a month, a Row house (130k) in about a quarter, the Villa (1.2M) stays a long goal. Everything still sits under the 5,000,000 coin cap, and match pockets use the existing `payMatch` pocket rules.

### Signed-in vs guest
- **Signed in:** progress is computed and paid by the server, and claimed with one op per quest, idempotent through the op key.
- **Guest:** sees the quest list and a local progress estimate, labelled "Sign in to collect". Nothing pays on the device. Guest play from the current period doesn't carry over at sign-in, which keeps migration simple and abuse-proof. This matches "Guests never call this" in `wallet.ts`.

### Server enforcement
- **New wallet op:** `{ kind: "quest", period: "W2026-44" | "M2026-11", id }`.
- **The server:**
  1. checks that the period is the current one (or the previous one, for 24 h of grace after a reset, so a late claim isn't lost);
  2. recomputes progress with SQL over `wallet_ledger` / `plate_events_by_player` / `walk_distance_by_player` inside the period's Chicago window;
  3. refuses with `unproven` if progress falls short;
  4. pays with `mutateWallet(…, "quest:<period>:<id>", …)`, so the op key makes double-pay impossible.
- **The client never sends counts.** The same pure progress function, `questProgress(rows, period)`, is shared by client and server (like `goals.ts`), so the display matches what's paid.
- **New read:** a quest-status endpoint returns `{ period, quests: [{ id, have, need, paid }] }` for the Journal.

### UI
- The Journal → Progress "Milestones" section becomes "This week" and "This month": four plus three rows with have/need, the reward icon, and the time left until reset.
- You can claim anywhere, not just at the notice board, because the server checks the claim. Notice-board-only claiming only made sense for device-checked claims.
- The Cloth closet stays as it is.

## 3. Migration (keep what players earned)
1. **Everything already earned stays:**
   - cloths (`meta.cloths`, server) and the cloth worn;
   - titles ("Clean hundred", "Walker");
   - schematics and patterns.
   Cloth tips keep paying.
2. **Milestones that are done but not claimed** get paid once, at the first sync after the release. The server verifies each before paying:
   - long walk: server km ≥ 10;
   - Red Book: the visited-red check;
   - Clean hundred: ledger perfects ≥ 100;
   - Unbroken: a 10-perfect run in the grade sequence;
   - Night mark: any correct violet event;
   - a circuit with all four checks ticked: the scarf, using the existing `clothOp` (still spends 3 stock; if short, it's held as "claim at the board once you have 3 stock").
   This uses op key `legacy:<id>`, so it pays once.
3. **Unfinished progress toward a milestone** is dropped. It has no server-side truth for the device-only counters. Players get a one-time 1,000-coin "thanks" (op `legacy:thanks`) if they had any unclaimed milestone.
4. **Getting cloths afterwards:** the Road-dust, Red-book and scarf cloths could later be earned as monthly rewards (open decision 2). Night-glass keeps its pattern + press recipe, and patterns still drop from red/violet clears (`rareExtra`).

## 4. What gets deleted
- `quests.ts`: `LongId`, `LONG_COPY`, `longProgress`, `claimLong`, `Circuit`, `circuitReady`, `claimCircuit`. Also the `QuestLog` fields `perfects`, `perfectRow`, `bestRow`, `sawViolet`, `reds`, `circuit` and `claimed`. Keep the type tolerant when it reads old saves.
- `store.ts`: `claimCircuit` and `claimLong` actions, their toasts, and the `noteAnswer` / `noteClear` milestone counters (keep the errand and scrap/pattern parts).
- `HqPanel.tsx`: the Milestones block of `QuestDesk`.
- `quests.test.ts`: the circuit and long cases, replaced by `questProgress` / period / op tests.
- **Kept:** `clothCoin`, `clothOp`, cloth names and perks, the closet, the errand, `rareExtra`, and `printPattern`.

## 5. Tests to add, when this is built
- **Period keys:** the Monday 00:00 and 1st 00:00 boundaries in America/Chicago, including the DST change on Nov 1 2026, so Chicago midnight shifts from 05:00 to 06:00 UTC. Year-end ISO weeks are covered too.
- **What counts:** progress counts only correct, paid grades; sparks (including violet sparks) don't count; a miss doesn't count.
- **Claim op:** refuses short progress, an old period after the grace window, or a repeat claim (idempotent op key); pays within the coin cap and pocket rules.
- **Guests:** never pay.
- **Legacy pass:** pays each earned-but-unclaimed milestone once, and never re-pays an owned cloth.

## 6. Open decisions for Ryan
1. **Reset clock:** a single Chicago clock (recommended), or each player's city time?
2. **Cloths:** do the scarves, Road-dust and Red-book cloths come back as rare monthly rewards (for example, a city scarf for `m-tour` in that city), or are they frozen as legacy items for current owners only?
3. **Reward size:** about 5.7k coin a week and 47k a month plus matches, with a violet for a full month. Keep it, halve it, or make the bonus a car or house discount instead?
