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

---

# Part B: charms (Ryan: "isn't really working either, scrap or change it?")

## B1. What charms are today
Defined in `CHARMS` (`src/game/data.ts` ~l.3761). Each charm is printed once at a print counter (`PrintShop.tsx` `CharmPress`). A print costs stock plus **1 schematic** plus 1 press stock (the city staple). You can **equip only one** (`store.equipped`).

| Charm | Cost (brass/ink/vellum + schematic) | What it does | Who enforces it |
|---|---|---|---|
| Scholar's clip | 8 / 4 / 0 + 1 | +3 s on the lamp timer | device only. The server's answer window (`WINDOW_MAX_MS` 40 s, `triviaService.ts`) already allows the extra 3 s for everyone, so ownership isn't checked |
| Sprinter's strap | 6 / 0 / 8 + 1 | **nothing.** Its own blurb says "Every coat walks the same. The strap doesn't change it." | n/a |
| Wider lantern | 10 / 6 / 0 + 1 | reach 200 m instead of 140 m (`interactRadius`), shown in the HUD | device only |
| Lucky bit | 12 / 8 / 8 + 1 | 15% chance (`LUCKY_MATCH_CHANCE`) a lamp gives back a match of its colour; on a Run/Stack, a blue | **server**: `charmOp` charges stock and sets `meta.lucky`; the server rolls `luckyHit` and pays only if `meta.lucky` is set (`provenBoost`) |

**Where they show:**
- the Satchel → Charms grid, with Equip/Unequip;
- the PrintShop charm press;
- the Journal HQ stock panel (`HqPanel` ~l.244);
- the HUD's equipped-charm icon;
- the city circuit milestone, which needs "a charm".

**Storage:**
- `charms: CharmId[]` and `equipped` live in the device save.
- The server only knows about Lucky: the `charm:lucky` ledger row plus `meta.lucky`.
- On sign-in, `ownedOf` gives back only the charms that have ledger rows.

**Dependencies:**
- the city circuit (`circuitReady` needs `charms > 0`), which Part A deletes anyway;
- schematics: Unbroken was the only steady source besides drops (`items.ts`: "Each charm needs one");
- the HUD reach readout and map reach (`GameMap.tsx`), multiplied by the scout's sight perk;
- lamp timer extras in `store.ts` ~l.1494;
- `vaultPay.ts` help text.

**Name clash:** the "Category charm" boost (`boosts.ts`) has nothing to do with these. It's a free white match for the first right answer in up to 3 topics a day, keyed to the **UTC** day, not the Chicago one.

## B2. Why it "isn't working": bugs and gaps
1. **Sprinter's strap is a dead item.** It costs real stock and a schematic, and does nothing.
2. **Scholar and Lantern don't come back on a new device.** They have no server op, so `ownedOf` never returns them. A player who signs in somewhere else loses charms they paid for.
3. **Scholar isn't really a perk.** The server window lets everyone have the 3 s, so the server never treats it as a special benefit. A guest or a modified client gets it free.
4. **You can only equip one,** so there's no reason to own more than Lucky. Lucky is strictly better: it's the only one that pays, and the only one the server honours.
5. **Unequipping Lucky turns off its pay,** but nothing in the UI says that only the equipped charm counts. The client sends `lucky: equipped === "lucky"`.
6. **The "Category charm" name** makes players think owning a charm affects daily topic matches, when it doesn't.
7. **Paid but not delivered:** the client takes the stock locally for a non-Lucky print and nothing records it on the server. If the save is lost, the stock is gone and so is the charm.

## B3. Options

### (a) Scrap cleanly
- **Delete:**
  - `CHARMS`, `CharmId`, `craft`/`equip`, `charms`/`equipped` in the save;
  - `CharmPress`, the Satchel Charms grid, the HQ charm list and the HUD charm icon;
  - `charmOp` and the `charm` wallet op;
  - `interactRadius(hasLantern)`, fixed at 140 m, or raised for everyone (see below);
  - the Scholar timer extra.
- **Rename** the daily "Category charm" boost to "Topic bonus".
- **Keep:**
  - the server-side Lucky roll, moved to a different source (a coat perk, or a quest reward, as in option c);
  - existing `meta.lucky` owners, who keep Lucky for good as a legacy perk.
- **Compensate owners** with a one-time server op, `legacy:charm:<id>` (so it can only pay once):
  - each charm the server can prove (Lucky): keep the perk, no refund needed;
  - each device-only charm (Scholar/Lantern/Sprinter) reported by a signed-in save at first sync: refund the printing stock **plus the schematic**, capped at 3 refunds per account. Without a server record this is trust-the-device, so the cap stays small and it pays stock, not coin;
  - in place of the Lantern, raise base reach for everyone to 160 m, so nobody feels reach was taken away.
- **Pros:**
  - least code and the fewest surfaces;
  - removes a dead item and a trust gap.
- **Cons:**
  - schematics lose their main use (cloths/Night-glass don't spend them), so the schematic needs a new sink or should be removed too;
  - one less long-term crafting goal.

### (b) Rework into something meaningful
- **Make every charm server-owned:** a `charm:<id>` ledger row, `meta.charms[]`, and `provenBoost` checks for each one.
- **Give each charm one clear, distinct job tied to a verb:**
  - **Scholar:** the server adds +3 s to the dealt window *only if owned*, and the shared window shrinks back.
  - **Lantern:** +60 m reach, and the server checks claim distance against `interactRadius(owned)`. This needs the lamp claim to send a position check; today it's device-only.
  - **Sprinter → "Rider's strap":** +25% coin on ride games.
  - **Lucky:** unchanged.
  - **New "Night owl's charm":** +1 match on a night-market lamp once a day.
- **Allow 2 slots**, the second unlocked at level 20, so owning several makes sense.
- **Pros:** keeps the crafting loop and the schematic sink, and fixes every bug.
- **Cons:**
  - the most work, covering server checks for reach and the timer, the UI and balance;
  - it adds power and pay right when the economy is being re-tuned around quests;
  - reach checks on the server are new ground.

### (c) Fold into quests as rewards
- **Remove printing.** Charms stop being crafted. Each charm becomes a **monthly-quest reward that lasts the month:**
  - a server row `charm:<id>:<period>`;
  - it's active automatically while that period runs, with no equip slot;
  - examples: finish `m-night` → Night owl's charm next month; finish all three monthlies → Lucky next month.
- **Lucky:** permanent owners keep it forever, so `meta.lucky` stays.
- **Scholar/Lantern/Sprinter:** device-only owners get the stock + schematic refund from (a).
- **Server enforcement:** the server pays only charms whose current-period row exists, through the same `provenBoost` check as Lucky.
- **Pros:**
  - gives quests a reason to come back next month beyond coin;
  - removes crafting UI and the dead item;
  - everything is server-owned from day one.
- **Cons:**
  - perks that come and go can feel like being punished;
  - still needs (b)'s server checks for any charm that isn't a payout perk (reach and timer), so keep the timed charms to **payout perks only**: Lucky, Night owl, Rider;
  - schematics still need a new sink.

## B4. Recommendation: **(a) scrap now, with (c)'s good part folded in**
- Scrap printed charms and the equip slot.
- Keep Lucky permanently for current owners.
- Refund device-only charms in stock and schematics (capped).
- Raise base reach to 160 m.
- Rename the "Category charm" boost.
- Then use **one payout-only perk** as the monthly all-three bonus: "Lucky next month", for players who don't own Lucky, or 25,000 coin for those who do. It reuses the existing server-checked Lucky roll, so nothing new needs client trust.
- Don't do (b): it's the most work and adds power when the economy is being reset around quests.
- **Schematics:** stop dropping new ones, and convert what players hold into a new **Night-glass alternative recipe**, schematic + pattern instead of press stock, so held schematics stay worth something.

## B5. Open decisions for Ryan (charms)
1. Scrap with the Lucky legacy perk (recommended), or full rework (b)?
2. Raise base reach to 160 m for everyone, or leave 140 m and just refund Lantern owners?
3. Schematics: give them the Night-glass sink, or retire them and convert held ones to coin (for example, 2,000 each)?

---

## Implementation notes (0.1.22, built)
- **Decisions (Ryan):** one Chicago clock; quests and rewards as listed above, except the monthly all-three bonus is **Lucky for all of next month** (25,000 coin if Lucky is already owned) instead of a violet match. Cloths stay legacy: no new cloth rewards. Charms are scrapped per B4.
- **Period keys:** `W<Monday's date>` (e.g. `W2026-10-19`, which avoids ISO-week year edge cases) and `M2026-11`, in `src/game/questPeriods.ts`.
- **Progress:** `src/game/questServer.ts` recounts from `wallet_ledger`:
  - `grade:` rows now carry `t` (lamp tier), `tp` (category), and `ql:1` (a right answer on a lamp that spent a match). A spark, a blitz card, or a walk-away replay that couldn't re-spend never gets `ql`.
  - Ride rounds come from `ride:<at>:r:<n>`, with the game read from the matching `ride:<at>:d:<n>` row.
  - Grade rows written before 0.1.22 have no `ql`, so they don't count. The first week after release starts from the release time.
- **Payout:** op `{kind:"quest", period, id}` → `quest:<period>:<id>`, once. Reads come from `fetchQuests`.
- **Lucky month:** stored in wallet `meta.luckyMonth` (jsonb). The grade pay honours it through `luckyLive`.
- **Legacy:**
  - op `{kind:"legacy"}`, sent once after a sign-in sync while the save still has `quests.legacy`;
  - keys are `legacy:<milestone>`, `legacy:scarf-<city>`, `legacy:thanks`, `legacy:lucky` and `legacy:charm:<id>`, so each part pays only once.
- **No DB migration.** Everything uses existing tables (ledger rows and the wallet `meta` jsonb).
- **Known gap, found while building:**
  - Server wallet craft stock (`meta.brass`/`press`/…) is never credited by any server write. So the old `charm:lucky` op and the server-side Night-glass/scarf `cloth` ops were always refused as "short" in production, and the server never paid Lucky or those cloth tips.
  - This is why the legacy move grants Lucky to a device that reports a printed Lucky bit (device-trusted, once per account), and grants proven milestone cloths without spending stock.

## Quest banks (0.1.22, built)

Daily goals became server-counted day quests, and every period draws from a bank. `questSet(kind, account, periodKey, {house})`
enumerates every set of SET_SIZE (day 4, week 5, month 4) from the eligible bank, keeps the ones inside FAIR (effort sum and
reward value: coin + TIER_VALUE of the matches), and picks `fnv1a("quests|account|period") % count`. No storage; the server
and device agree; the set is fixed for the period. Effort/value bands: day 6–7 / 550–800, week 8–9 / 7,900–10,000,
month 9–10 / 57,000–69,000. House quests need a `house:%` row; there is no daily night-market quest (markets aren't
always scheduled; m-night and m-hop have a month to happen). Guests see the set for account "guest", house off.
Claims outside your set: `not-yours`. New event sources: `cache:%`, `street:sk:%`, `hook:<city>:<day>`, and the grade `d` district.
Deploy note: the day key moves from the UTC date to the Chicago date, so the legacy dgoal path may pay once more on deploy evening.
