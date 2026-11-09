# Print shop balance — proposal

Live **0.1.136** (`APP_VERSION` in `src/version.ts`), main `5185fe8`. Analysis only. No game code in this change.

The print shop is the outfitter’s Print tab (`src/components/keyline/ScoutShop.tsx` → `PrintShop.tsx`). It sells four coats and four vault skins for **white and blue keys**, in instalments, and it mixes vault paint. It does not charge coins. Ladder coin (`white` 30, `blue` 90, …) is used to order the catalogue and to explain it (`src/game/cosmetics.ts` lines 9 and 31–32). Paying the shop never moves `coins`.

A yes on the table below is a retune of those key prices and of white/blue dye cans, plus one guard so a wardrobe sync cannot grant the new prices for free. Coin faucets stay as they are. Repeatable coin sinks stay in the later coin-sinks slice.

## 1. Inventory

### 1.1 Print shop — coats and vault skins

Prices are keys. “Ladder” is `price.white * 30 + price.blue * 90` (`priceCoin`, `src/game/cosmetics.ts` line 124). The catalogue test locks the sum at **4,890** and calls the whole shop a long sink (`src/game/cosmetics.test.ts` lines 44–52). Two day-1 crates (5 white each) cover Copper (`crateLoot(1)` is 5 white + 1 blue, `src/game/crate.ts` lines 31–39).

| Item | Id | Keys | Ladder |
| --- | --- | ---: | ---: |
| Copper Lamp | `copper` | 10 white | 300 |
| Wrought Iron | `iron` | 8 white + 2 blue | 420 |
| Verdigris | `verdigris` | 6 white + 4 blue | 540 |
| Nickel Plate | `nickel` | 8 blue | 720 |
| Oilskin Slicker | `oilskin` | 15 white | 450 |
| Bottle-Green Duster | `bottle` | 10 white + 4 blue | 660 |
| Oxblood Greatcoat | `oxblood` | 8 white + 6 blue | 780 |
| Plum Frock Coat | `plum` | 4 white + 10 blue | 1,020 |
| **Catalogue** | | **61 white + 34 blue** | **4,890** |

Sources: `src/game/cosmetics.ts` lines 40, 48, 56, 64, 75, 83, 91, 99.

Other shop rules:

- Instalments. The counter keeps `paid` per item. One tap pays whatever the pocket can (`owing` / `payable` / `payIn`, lines 140–181). Finishing the price owns it and puts it on.
- Wear / take off is free (`wear`, lines 184–196). Journal wardrobe can wear owned pieces; only the outfitter counter takes payment (`PrintShop.tsx` lines 51–53 and 120–141).
- Buying again is refused (`payIn` returns null once owned, line 162). The server `print` op spends the account’s keys (`printOp`, `src/game/wallet.ts` lines 517–522; `src/game/walletApply.ts` lines 1404–1414).
- Night market does not change shop prices (`printShop: false` in `MARKET_DOUBLES`, `src/game/nightMarket.ts` lines 585–596).
- A dyed coat or painted vault covers the paid look until the dye comes off (`visibleCoat` / `visibleLantern`, `src/game/paint.ts` lines 69–76).

### 1.2 Vault paint (the vat on the same screen)

`PaintVat` is rendered inside the print shop (`PrintShop.tsx` line 176). Cans drop from clears. Mixing spends cans, never coins. Wearing a mix is free (`wearPaint`, `src/game/paint.ts` lines 110–119). A color already mixed cannot be mixed again (line 97).

Drop rate is “1 can per N clears of that color” (`PAINT_DROP_IN`, `src/game/ingredients.ts` lines 53–60). Prism is 1 in 10,000 on any vault (`ULTRA_DROP_IN`, lines 41–42) and can land with the color can.

| Color | Drop | Coat cans | Vault cans | Expected clears, coat | Expected clears, vault |
| --- | ---: | ---: | ---: | ---: | ---: |
| White | 1 in 2 | 3 | 4 | 6 | 8 |
| Blue | 1 in 5 | 4 | 5 | 20 | 25 |
| Green | 1 in 10 | 5 | 6 | 50 | 60 |
| Amber | 1 in 20 | 6 | 8 | 120 | 160 |
| Red | 1 in 40 | 8 | 10 | 320 | 400 |
| Violet | 1 in 80 | 10 | 12 | 800 | 960 |
| Prism | 1 in 10,000 | 1 | 2 | 10,000 | 20,000 |

Can counts: `PAINT_USE`, `src/game/paint.ts` lines 22–29. The server checks the same `paintCost` before it writes `dye:<job>:<color>` (`src/game/walletApply.ts` lines 1600–1604).

### 1.3 Night glass (the press on the same screen)

One violet pattern prints Night glass. No coin, no keys (`PrintShop.tsx` lines 182–201; spend in `src/game/wallet.ts` lines 629–639). Worn, it adds 150 coin on a violet clear (`clothCoin`, `src/game/quests.ts` lines 124–126). Pattern drops are violet-clear rewards, not a shop price.

### 1.4 City prints

Sixteen prints, one per city, all on the first goal. `PRINT_GOAL_SECOND` (300 km) and `PRINT_GOAL_THIRD` (500 km) have no items.

| Goal | Right answers in that city | Metres walked there |
| --- | ---: | ---: |
| First (every shipped print) | 500 | 150,000 |
| Second (unused) | 500 | 300,000 |
| Third (unused) | 500 | 500,000 |

`src/game/cityPrints.ts` lines 36–41. Progress is server records only. “Prints are cosmetic: nothing here touches the wallet” (`src/game/printsServer.ts` lines 1–4). Wearing one is a free `wear` op (`src/game/walletApply.ts` lines 1608–1616).

### 1.5 Rewear and replay

| Action | Price |
| --- | --- |
| Wear or remove an owned coat or vault skin | 0 |
| Wear or remove a mixed dye | 0 |
| Wear a city print, cloth, car, or market light | 0 |
| Buy a coat or skin you already own | refused, 0 |
| Mix a dye you already mixed | refused, 0 |
| Replay a server `print` for an owned id | `payIn` returns null, no key debit |

### 1.6 Outfitter and counter (same building, not the print tab)

Listed so the yes/no can leave them alone.

**Hire tab** (`SCOUTS` in `src/game/data.ts`):

| Scout | Coins | Line |
| --- | ---: | ---: |
| Raccoon | 0 | 3850 |
| Tabby | 8,000 | 3862 |
| Corgi | 12,000 | 3898 |
| Owl | 18,000 | 3886 |
| Sloth | 20,000 | 3910 |
| Turtle | 24,000 | 3874 |
| Panda | 35,000 | 3936 |
| Giraffe | 45,000 | 3922 |
| Fox | 90,000 | 3949 (`FOX_COINS` line 3826) |
| Penguin | 900,000 | 3961 (`FOX_COINS * 10`, lines 3824–3828) |

Sum of the hire list: **1,152,000**.

**Street counter** (`KIOSK`, `src/game/data.ts` lines 3980–4022; sold in `WardCounter.tsx`). These are the only “reprints” in the game. They are coin, and the key ones are worse than the ladder:

| Item | Coins | What you get | Ladder value | Coin / ladder |
| --- | ---: | --- | ---: | ---: |
| Tinder tin | 160 | 2 white keys | 60 | 2.7× |
| Blue wick | 420 | 1 blue key | 90 | 4.7× |
| Smear the atlas | 720 | name one vault | — | — |
| Press pass | 1,200 | +5 s on the next door | — | — |
| Reprint a train ticket | 1,800 | a ticket without three vaults | — | — |
| Amber reprint | 5,400 | 1 amber key | 810 | 6.7× |
| Night oil | 24,000 | 1 violet key | 7,290 | 3.3× |

`kioskOp` (`src/game/wallet.ts` lines 499–514) is the debit. Nobody feeds the print shop by buying these. A player who is short a blue key is better off walking.

`src/game/pass2.ts` (spark kit 280, ribbon 90, ward pin 220, news pack 480, and a white key every 40 s of focused tab) is not mounted by any screen. Dead catalogue. Leave it.

### 1.7 Coin sources that sit next to the shop

The shop does not spend these. They are why a bought-out wardrobe still leaves a pile of coins. Ladder face values (`TIER_VALUE`, `src/game/rewards.ts` lines 4–11):

| Tier | Face | Slow (×0.4) | Great (×0.7) | Perfect (×1) |
| --- | ---: | ---: | ---: | ---: |
| White | 30 | 12 | 21 | 30 |
| Blue | 90 | 36 | 63 | 90 |
| Green | 270 | 108 | 189 | 270 |
| Amber | 810 | 324 | 567 | 810 |
| Red | 2,430 | 972 | 1,701 | 2,430 |
| Violet | 7,290 | 2,916 | 5,103 | 7,290 |

Slow / great / perfect are `rewardPoints` at mult 0.4 / 0.7 / 1, standard difficulty, bonus 1, loot 1. Bands match `lampCoinBand` (`src/game/vaultPay.ts` lines 20–28). Grade cutoffs: perfect ≤ 3 s, great ≤ 10 s, otherwise ×0.4 (`src/game/triviaService.ts` lines 49–50 and 180–183).

**One right vault answer** (`gradeGrant`, `src/game/wallet.ts` lines 753–828):

```
lampCoin = round(face * gradeMult * streakBonus * diffMult * loot * catBoost * hearthBoost)
pay      = lampCoin * (streak >= 75 ? 3 : 1) * (on market ? marketMult : 1)
         + owl extra + streak market rung + cloth tip + fresh district + panda double
         + 5 if the answer was under 3 s
```

| Knob | Value | Where |
| --- | --- | --- |
| Streak bonus | `1 + min(0.40, streakAfter * 0.05)`, so +40% from 8 right in a row | `wallet.ts` line 757 |
| Difficulty | easy 0.70, standard 1, hard 1.45 | `src/game/triviaMeta.ts` lines 35–39 |
| Fox / Penguin loot | ×1.10 | `data.ts` lines 3955 and 3967 |
| Category | +15% one favorite, +25% coat and car, +25% category of the day, +10% Random, cap +40% | `src/game/carPerks.ts` lines 58–66 |
| Hearth | question 2 ×1.25, question 3 ×1.50, on that question’s tier coin | `src/game/hearthMulti.ts` line 19 |
| Streak 75 | ×3 on vault-answer coin only | `TRIPLE_COIN` / `TRIPLE_AT`, `src/game/streakMile.ts` lines 22 and 32; applied `wallet.ts` line 788 |
| Night market | ×2 coin and ×2 bonus keys; matches stay ×2 even when lights raise coin | `MARKET_MULT`, `src/game/nightMarket.ts` line 22; `marketPay` lines 628–632 |
| Market lights | coin ×2.0 / 2.1 / 2.2 / 2.3 / 2.4 / 2.5, prices 0 / 15k / 30k / 60k / 105k / 180k | `src/game/marketLights.ts` lines 10–16 |
| Owl on a market | adds up to +0.5, cap ×3.0 with Rainbow | `MARKET_COIN_CAP` line 20; Owl `market: 2.5` at `data.ts` line 3892 |
| Streak 40 on a market | +0.1 coin rung, same ×3 cap | `STREAK_MARKET_STEP` line 34 |
| Market rest | 4× the normal dark time | `MARKET_REST` line 40 |
| Cloth tip | road dust +20; city scarf +45 in its city; red book +80 on red; night glass +150 on violet | `quests.ts` lines 131–136 |
| New district | +25% of `lampCoin`, up to 6 squares a day per city, off the market | `src/game/district.ts` lines 10–12 and 33–34 |
| Panda | 1 in 15 right vaults pay `lampCoin` again | `data.ts` line 3943 |
| Perfect timing | +5 coin, not multiplied | `PERFECT_COINS`, `src/game/boosts.ts` lines 6–7 and 48–50 |
| Key back | a right answer returns the key, except violet | `src/game/perfectRefund.ts` lines 6–16; call at `store.ts` line 1875 |

Vault supply (`tier:` on places in `src/game/data.ts`): **255 white, 191 blue, 99 green, 56 amber, 32 red, 8 violet** (641). Dark times: white 90 s, blue 140 s, green 220 s, amber and red 400 s, violet 6 h (`lampCoolMs`, `src/game/ticket.ts` lines 21–26). A miss locks the vault 3 min (white–green) or 5 min (amber–violet) and keeps the key spent (`src/game/lockout.ts` lines 11–15).

**Keys that are not the refund** (this is what the shop can actually sink):

| Source | Keys | Where |
| --- | --- | --- |
| Street, opening deal | 12 white + 6 blue, fixed | `SEED`, `src/game/streetSpots.ts` lines 16–20 |
| Street, after that | every `max(14 s, 39 s − playMin × 0.45)`, cap **80 claims per city per UTC day**, map holds 16 (10 if the pocket already has 15+) | `store.ts` lines 570–572 and 1401–1407; `STREET_DAY_CAP` line 12 of `streetSpots.ts` |
| Street tier weights | at 0 min: white 0.78, blue 0.18, green 0.04. Violet never. Red only after 50 min of `playMin` | `streetKeyTier`, `store.ts` lines 575–591 |
| Streak spark | +1 white every 3rd right answer | `STREAK_SPARK_N`, `boosts.ts` line 4 |
| Streak prize | +1 white when the run hits 5, 15, 25…; +1 blue at 10, 20, 30… | `streakPrize`, `src/game/goals.ts` lines 11–16 |
| Topic bonus | +1 white, first 3 categories each UTC day | `CHARM_TOPICS_PER_DAY`, `boosts.ts` line 10 |
| Perfect blue | 10% of sub-3 s right answers | `PERFECT_BLUE_CHANCE`, `vaultPay.ts` line 14 |
| Raccoon | 1 in 15 right vaults, a blue key | `data.ts` line 3856 |
| Morning crate | day 1–4: 5 white + 1 blue. Day 5–9: 4 white + 2 blue. Day 10–14 adds a green. Day 30: 1 violet + 2 white + 1 blue | `crate.ts` lines 31–39 |
| Daily Lantern Run | 2 white + 1 blue per city per UTC day (ladder 150). Market does not double it | `DAILY_REWARD`, `dailyRun.ts` lines 295–301; `MARKET_DOUBLES.dailyRun` |
| Daily Blitz | 20+30+50+80+200+500 = **880** coin and one key of each tier on a clear. Once per UTC day | `dailyBlitz.ts` lines 9–18 |
| Friend ticket | both sides get the ladder rung’s key (white→blue→green→amber→red). Caps: 5 sent, 3 rewarded, one pair reward per UTC day | `friendTicket.ts` lines 16–17 and 39 |
| Mystery wheel | one spin per 25 right answers of that tier. Coin slices are ×4.2, then ±10% | `WHEEL_EVERY` line 7, `WHEEL_COIN_MULT` line 81, slices lines 116–133 of `wheel.ts` |
| Ioniq 5, seated | +1 white per vault opened, 20 a day | `V2L_DAY_CAP`, `carPerks.ts` lines 19–26 |
| House key | 2 keys of the house’s color plus `keyCoin`, once per city per local day, after 3 right vaults there | `KEY_MATCHES` and `HOUSES`, `src/game/houses.ts` lines 19–25 |

House key coin: cottage 1,000, row 3,000, town 8,000, villa 25,000. Buy prices: 40,000 / 130,000 / 300,000 / 1,200,000, step-up pays the difference (lines 21–25 and 43–46).

**Calendar coin (not keys):**

| Source | Coin | Where |
| --- | --- | --- |
| Daily quest set | value band 550–800 including key face; a typical set is about **320 coin** plus a green key for finishing all four | `FAIR.day`, `src/game/questBoard.ts` lines 188–193; sample rewards lines 57–68; full-day bonus is a green key, lines 156–158 |
| Weekly set (from 26 Oct 2026) | value band 8,000–10,500 plus a challenge of 5,000 coin and a red key | `FAIR_V2.week` lines 196–198; challenges lines 119–123 |
| Monthly set (from Nov 2026) | value band 50,000–62,000 plus a challenge of 40,000 coin and two red keys. Full month is Lucky, or **25,000 coin** if Lucky is already owned | `FAIR_V2.month`; `LUCKY_OWNED_COIN` line 51; challenges lines 142–146 |
| Contract | **1,500** coin and 1 amber key per three proved lamps, cap **24 a day** (36,000 coin) | `wallet.ts` lines 563–567; `CONTRACT_LAMPS` is 3 |
| Welcome | 15,000 coin and double rewards for the first hour | `WELCOME_COIN`, `DOUBLE_MS`, `src/game/lampGift.ts` lines 37–40. Doubled prefixes include `grade:`, `street:`, `quest:` (line 47) |
| One-off gifts | Love note 200,000. Thanks car stand-in 50,000 if the F-150 is already owned. Thanks house stand-in 300,000 if a townhouse or better is already owned | `LOVE_COIN` line 61; `thanksGift.ts` lines 17–18 |
| Hearth owner cut | 50 coin per visitor per hearth per Chicago day, cap 1,000 a day, 1 in 10 also a red key. Own opens pay 0 | `HEARTH_CUT` / `HEARTH_CUT_CAP`, `src/game/placedLantern.ts` lines 116–117 |
| Wheel coin, expected, before the ±10% wobble | white ~220, blue ~470, green ~750, amber ~1,050, red ~1,370, violet ~1,710 per spin | weights in `wheelSlices` |

**Retired, so not in the rates:** train ride payouts (`ride` op refused, `walletApply.ts` line 1803; the old table is still in `rideGames.ts` lines 12–23). Lantern Shop till (`SHOP_PAY` 2,000 every 4 h, buy-back only, `src/game/shop.ts` lines 11–14). The old three shared daily goals (`GOAL_COIN` 60, `goals.ts` line 193) still have a server op and no screen calls `claimGoal`.

Pocket rule, once the shop is done buying: each color holds **30** (`POCKET`, `goals.ts` line 44). It was 6 white / 6 blue before 0.0.97 (`ticket.ts` lines 8–9). Overflow merges **3 → 1** of the next color at full ladder value. A full violet pocket pays **7,290** per overflow violet (`goals.ts` lines 35–42 and 85–86). The bank’s 4-for-1 up-trade is a worse deal than letting the pocket merge (`BANK_UP` is 4, `rewards.ts` line 15).

Coin cap is **5,000,000** (`COIN_CAP`, `wallet.ts` line 38). A device’s first sync still clamps at 250,000 (`FIRST_SYNC_COIN_CAP`, line 41).

## 2. Earning rates

### Assumptions

These are steady play, standard-difficulty cards, no category bonus, no cloth, no house, no contract, no friend tickets, no streak-75 triple, no Owl, no Panda, no Ioniq. Market share is “share of answers standing on an open market.” Grade mix is perfect / great / slow.

| | Casual | Typical | Heavy |
| --- | --- | --- | --- |
| Who | first scout, learning the ward | knows the city, mixes tiers as they walk | Fox (+10% loot), drives between vaults, prefers the higher lamps on the block |
| Session | 20 min | 45 min | 60 min |
| Attempts per hour | 18 | 28 | 40 |
| Right | 70% | 85% | 95% |
| Grade mix | 20 / 50 / 30 | 45 / 40 / 15 | 70 / 25 / 5 |
| Streak bonus | ×1.10 | ×1.25 | ×1.40 (the +40% cap) |
| Tier mix | 75% white, 25% blue | the map: 40 / 30 / 15 / 9 / 5 / 1 white→violet | same map mix |
| Market | none | 12% of answers, ×2 | 20% of answers, ×2.2 (Jade, no Owl) |
| Cities that day | 1, and they may not pick up every key | 1, they walk the ward | 1 in the coin rate; street keys noted for a second city |

Attempts per hour are walk-limited. Walk pace is 105.8 m/min (`WALK_PACE`, `data.ts` line 3809). A car is faster than the cab by its `pace` (`cars.ts`). Forty an hour is a driver with a route, not a teleport.

`playMin` for street spawns is session minutes plus 0.35 per vault opened (`store.ts` line 1402). Yields below are the mean of 40 seeded walks of `streetKeyTier`. The opening 18 keys are included. The 80-claim cap binds on the 45-minute and 60-minute walks.

### Coins per active hour

| | Casual | Typical | Heavy |
| --- | ---: | ---: | ---: |
| Grade multiplier (expected) | 0.67 | 0.79 | 0.90 |
| Vault coin per right answer | 33 | ~360 | ~620 |
| Right answers per hour | 12.6 | 23.8 | 38 |
| Vault coin per hour | ~420 | ~8,500 | ~20,000 |
| Of which the flat +5 on fast answers | ~15 | ~55 | ~130 |
| One session | ~140 | ~6,400 | ~20,000 |

Heavy without the eight violets (a city that has none, or the 6 h dark already used) is about **18,000** an hour. Heavy with a held 75-streak is about **three times** the vault portion, near 55,000–70,000 an hour, for as long as the streak lives. That spike is the streak milestone, not a shop bug.

Reading the typical column: red is 5% of the lamps and about a third of the coin. Violet is 1% of the lamps and about a quarter of the coin when one is actually open. A player who stays on white and blue earns a few hundred an hour, which is the casual column.

### Keys per session (what the shop can sink)

Street only, mean of 40 walks:

| | White | Blue | Green | Amber |
| --- | ---: | ---: | ---: | ---: |
| Casual, 20 min, circulating | 38 | 13 | 2 | 0 |
| Typical, 45 min (hits the 80 cap) | 55 | 20 | 5 | ~0 |
| Heavy, 60 min, one city (same cap) | 54 | 20 | 5 | ~1 |
| Heavy, second city the same day | another ~54 | another ~20 | | |

Add, once a day, if they take them: crate (5 white + 1 blue early, or 4 + 2 later), Lantern Run (2 + 1 per city), Blitz (one of each on a clear), three topic whites. A typical day that does all of that is about **65 white and 24 blue** before misses. Misses spend a key with no refund: about 2 on a casual session, about 3 on a typical one, about 2 on a heavy hour. They do not change the conclusion.

A second city is the heavy player’s real key button. The cap is per city, not per account.

### Time to afford — current prices

| Item | Keys | Casual (≈13 blue and ≈38 white a session) | Typical (≈24 blue and ≈65 white a day) | Heavy (two cities) |
| --- | --- | --- | --- | --- |
| Copper Lamp | 10 white | opening deal, or two morning crates with no walking | same | same |
| Oilskin | 15 white | the opening 12 white plus one short walk | same day | same day |
| Wrought Iron | 8w+2b | same session | same day | same day |
| Verdigris, Bottle-Green | 4 blue each | session 1 | day 1 | day 1 |
| Nickel, Oxblood, Plum | 8 / 6 / 10 blue | sessions 2–3 | day 2 | day 1 |
| **Whole catalogue** | **61w+34b** | **about 3 sessions** | **2 play days** | **1 play day** |

After that the shop has nothing left to sell them. Wear stays free. Further white and blue keys sit in the 30-pocket and then merge 3-for-1 into coin at face value. A capped city-day of street keys is about 55×30 + 20×90 ≈ **3,500 coin** of face once the pockets are full, on top of the vault coin, every city they walk.

### What a heavy player is holding

One heavy hour a day for 30 days, the base rate above (no triple streak, one city, contracts not farmed):

| | Coin |
| --- | ---: |
| Vault answers, 30 × ~20,000 | ~600,000 |
| Blitz clears, 30 × 880 | 26,400 |
| Daily quests, 30 × ~320 | ~10,000 |
| Four weekly sets plus challenges | ~50,000 |
| One monthly set plus a challenge | ~70,000 |
| Welcome | 15,000 |
| **Rough total** | **~770,000** |

Print shop spend out of that: **0**. The catalogue was gone on day 1 or 2, paid in keys.

770,000 buys the hire list up through the Fox (252,000) and a couple of cars, or the Fox and the light ladder (390,000). It does not buy the Penguin (900,000) on this pace. It does not buy the Roadster 2.0 (2,400,000) or a villa in every city (16 × 1,200,000). The 5,000,000 cap is not what they hit in a month of one-hour days. They do hit “the print shop is empty and the coin number still goes up.”

A heavy player who also clears contracts adds 1,500 per three lamps, up to 36,000 a day. A heavy player who owns villas and turns the key adds 25,000 per city per day. Neither is required for the shop to be bought out. Both belong in the coin-sink slice.

A casual month (about 12 sessions) is a few thousand coin and a bought-out wardrobe. Their first coin wall is the Tabby at 8,000, on the hire tab.

### Wheel, for scale

A typical hour is ~24 right answers, so a white wheel about once an hour and a higher wheel much less often. A few hundred coin a spin. Real money next to Copper (ladder 300). Not real money next to an amber clear (face 810) or a red clear (face 2,430).

## 3. Problems

1. **The catalogue is a same-week purchase, and the test still calls it a long sink.** 4,890 ladder-coin is less than one perfect violet (7,290) and about six perfect ambers. Prices were written when a white pocket held 6, so instalments mattered (`cosmetics.ts` lines 9–11). The pocket is 30 now. Every item fits in one pocket. Plum’s blurb says “the dearest vat” and it costs 10 blue, which is half of one typical day’s street blue.

2. **Nothing in the shop spends coins.** A heavy month of ~770,000 coin is untouched by buying every coat and skin. After buyout, leftover keys become coin through the 3-for-1 merge. The shop is a one-time key sponge of 61 white and 34 blue, then it stops.

3. **White dye makes the paid coats optional on day one.** A white coat dye is about 6 white clears. A white vault paint is about 8. Both cover the thing the shop just sold (`paint.ts` lines 69–76). Green and up are already slow. Prism is already a trophy. White and blue are the dead-cheap end.

4. **The ladder inside the shop is flat.** Dearest / cheapest is 1,020 / 300 = 3.4×. There is no price cliff. There is also no item too expensive to matter. The cliff is next door: kiosk keys cost 2.7× to 6.7× face, so those rows are dead as a way to finish a print. Do not “fix” them by making the shop depend on them.

5. **Wardrobe sync grants ownership the `print` op did not pay for.** `syncWardrobe` merges the device copy with “ownership only grows” and says the server cannot re-check a payment (`src/game/wardrobeApi.ts` lines 9–15 and 46–60; `mergeWardrobe`, `cosmetics.ts` lines 219–239). That comment is from 0.0.45, before keys lived on the server wallet. The `print` op does spend server keys, and then the sync pushes `owned` anyway. A posted wardrobe with all eight ids owned sticks, with no key debit. Guests can edit a local save; that is the guest save. Signed-in sync is the hole. Raising prices without closing it prices the honest client only.

6. **Unused print goals.** Second and third city-print goals have no prints. That is missing content, not a number to retune here.

Not exploits, just spikes to leave alone in this slice: streak-75 ×3, the first-hour welcome double, contract cap 24, villa keys. They are large, and they are working as written.

## 4. Proposal

Smallest retune that makes the shop a few days of play again. Copper stays the two-crate starter, so that sentence of `cosmetics.test.ts` can stay. The blue end becomes the dear end, which matches the copy. White and blue dyes stop winning on the first block. Green, amber, red, violet, and prism cans stay put.

### 4.1 Price table

| Item | Current | Proposed | Ladder now → proposed | Why |
| --- | --- | --- | --- | --- |
| Copper Lamp | 10 white | **10 white** | 300 → 300 | Starter. Two day-1 crates, or the opening deal. |
| Wrought Iron | 8w + 2b | **12 white + 6 blue** | 420 → 900 | First blue skin costs a short day’s blue, not two street keys. |
| Verdigris | 6w + 4b | **8 white + 12 blue** | 540 → 1,320 | Middle of the lamp set. |
| Nickel Plate | 8 blue | **20 blue** | 720 → 1,800 | About one typical city-day of blue. Still under the pocket of 30. |
| Oilskin Slicker | 15 white | **20 white** | 450 → 600 | The opening 12 white no longer finish it. |
| Bottle-Green Duster | 10w + 4b | **12 white + 10 blue** | 660 → 1,260 | |
| Oxblood Greatcoat | 8w + 6b | **8 white + 16 blue** | 780 → 1,680 | |
| Plum Frock Coat | 4w + 10b | **24 blue** | 1,020 → 2,160 | The dear vat. A bit over one typical day of blue. One pocket, so a player who also keeps a play stack pays it in two visits. The instalment bar matters again. |
| **Catalogue** | **61w + 34b** | **70 white + 88 blue** | **4,890 → 10,020** | White stays a day. Blue becomes the clock. |

| Dye | Current cans (coat / vault) | Proposed | Expected clears, coat |
| --- | --- | --- | --- |
| White | 3 / 4 | **12 / 16** | 6 → 24 |
| Blue | 4 / 5 | **8 / 10** | 20 → 40 |
| Green, amber, red, violet, prism | unchanged | unchanged | already a long find |

### 4.2 How long that takes

Street blue is the limit. About 13 blue on a casual 20-minute walk, about 24 on a typical day with the crate and the run, about 40 if the heavy player walks two cities.

| | Casual | Typical | Heavy, two cities |
| --- | --- | --- | --- |
| Copper, Oilskin | session 1 | day 1 | day 1 |
| Iron through Bottle-Green | sessions 2–3 | days 1–2 | day 1 |
| Nickel, Oxblood, Plum | sessions 4–7 | days 3–4 | day 2 |
| Whole catalogue | **about 2–3 weeks** at 3 sessions a week | **about 4 play days** | **about 2 play days** |

White dye at 24 expected clears is a few casual sessions or a couple of typical days, in the same band as Oilskin, not ahead of it. Blue dye at 40 expected blue clears is a similar band to the upper coats.

A heavy month still ends near ~770,000 coin with the wardrobe already complete. This table does not try to spend that coin.

### 4.3 Saves and owned items

- **Owned coats and skins stay owned.** `payIn` already returns null when `owned` contains the id. No second charge, no clawback.
- **In-progress instalments finish at the old price.** If `paid` for that id is already non-zero when the new prices ship, `owing` should use the old price. Otherwise a player who paid 8 of 8 white toward Iron would suddenly owe 4 more white and 6 blue. Recommended rule, and it needs a few lines: look at `paid` before applying the new `price`. Untouched items (no `paid`, not owned) use the new price. No migration. The wardrobe row already stores `paid`.
- **Mixed dyes stay mixed.** The server already refuses a second mix. New can counts apply only to a color that is not in `coats` / `vaults` yet. Cans already in the pantry still count toward the new number.
- **Wear, city prints, and Night glass stay free / earned / one pattern.**

`cosmetics.test.ts` asserts the catalogue sums to 4,890 and sits between 4,000 and 6,000. That test is updated in the same change as the prices, or the build fails. The “two crates cover Copper” assertion can stay.

### 4.4 Guard that has to ship with the prices

`syncWardrobe` may update what is worn (`coat`, `lantern`, `at`). It must not add an `owned` id, and it must not raise a `paid` count, beyond the wardrobe row the `print` op wrote. The `print` op is already the payment. Without this, the table above is optional for any client that can post a wardrobe.

Guests keep a local wardrobe. That is the guest save, same as guest coins.

### 4.5 Leave for the coin-sinks slice

Do not do these in the print-shop change:

- Pricing any coat, skin, dye, or city print in coins. The shop’s rule is keys only. Switching currencies is a different save question (everyone who already paid in keys).
- A repeatable fee: re-dye, re-print, second coat slot, tribute, upkeep.
- Retuning kiosk reprints, scout prices, cars, houses, map skins, or market lights.
- Spending the contract cap, villa keys, streak-75, or the welcome double.
- Shipping second and third city prints. The goals can wait for art.
- Deleting the dead `pass2.ts` catalogue. Harmless, and not a balance change.

Those are the sinks that would touch the ~770,000. This slice only stops the wardrobe from being a lunch-break purchase and stops white dye from replacing it before lunch.

## 5. Open questions

1. **Instalments already started.** Recommended: finish them at the old price. The alternative is they owe the new remainder. Which one?
2. **Length.** Recommended Plum is 24 blue, about four typical days for the whole shop. If the dear vat should be a two-week item, Plum and Nickel go to about 40 and 36 blue and the rest of the table stays.
