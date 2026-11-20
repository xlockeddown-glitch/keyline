# Coin sinks — 0.1.175 pass

Ships in **0.1.175** (k1175a). One faucet retune: the daily house key coin. No new systems, no new fees, no price changes.

Rates below reuse the 0.1.136 measurement in [`print-shop-balance-proposal.md`](print-shop-balance-proposal.md) ("Coins per active hour"). Prices are read from the code at 0.1.174.

## Sources vs sinks

### Repeatable coin in

| Source | Coin | Where |
| --- | ---: | --- |
| Vault answers, one play hour | ~20,000 (the heavy column of the 0.1.136 table; its typical column is ~8,500) | `print-shop-balance-proposal.md` |
| House key, per owned house, per city, per local day | `keyCoin` (table below) plus 2 keys of the house color | `HOUSES`, `src/game/houses.ts` |
| Contracts | 1,500 per three proved lamps, cap 36,000 a day | `print-shop-balance-proposal.md` |
| Daily Blitz clear | 880 a day | same |
| Quest sets | ~320 a day; 8,000–10,500 a week; 50,000–62,000 a month, plus challenges | same |

### One-time coin out

| Sink | Coin | Verdict |
| --- | ---: | --- |
| Cars, whole lot | 3.87M | large enough, left alone |
| Scouts, whole hire list | 1.15M | large enough, left alone |
| One Grand Villa | 1.2M (per city) | large enough, left alone |
| Market lights, jade → rainbow | 390,000 | large enough, left alone |
| Skins | 200,000 | large enough, left alone |

### Repeatable coin out

| Sink | Coin | Note |
| --- | ---: | --- |
| Patron bulbs | 2,000 / 5,000 / 12,000 | optional cosmetic |
| Train hurry | 25 per minute | small |
| Kiosk | small | small |
| Hearth polish | 8,000 per hearth per week | optional cosmetic |
| Press pull | 25,000 per week | optional cosmetic |

Nothing in the repeatable list is mandatory.

## The leftover

After the one-time sinks are bought, the leftover late-game coin is the house key stacking per city. Before this pass a villa paid 25,000 a day for lighting 3 lamps, more than a ~20,000 play hour, and N villas paid N × 25,000 a day with no mandatory repeatable sink against it.

## What changed

`keyCoin` in `HOUSES` (`src/game/houses.ts`):

| Tier | Before | After | Why |
| --- | ---: | ---: | --- |
| Lantern Cottage | 1,000 | 1,000 | unchanged; the early hook |
| Gaslight Row House | 3,000 | 2,000 | modest; stays above the cottage |
| Ivy Townhouse | 8,000 | 5,000 | still a clear step up |
| Grand Villa | 25,000 | 10,000 | one villa must not out-earn a play hour; still 2× the townhouse |

| Villas owned | Before, per day | After, per day |
| ---: | ---: | ---: |
| 1 | 25,000 | 10,000 |
| 4 | 100,000 | 40,000 |
| 16 (every city) | 400,000 | 160,000 |

The 2 keys of the house color (`KEY_MATCHES`) are unchanged. Buy prices are unchanged (40,000 / 130,000 / 300,000 / 1,200,000). Coin already collected is not clawed back. House sheet, Journal · Places and the Field Guide read `keyCoin`, so their copy follows.

## Left alone, and why

| Item | Why |
| --- | --- |
| Car, scout, market light, skin, house buy and patron bulb prices | the one-time sinks are already large enough; no cars added |
| A new fee (tribute, upkeep, re-dye) | it would be ignorable, or a faucet cut with extra UX; cutting the faucet directly is simpler |
| Train hurry (`HURRY_COIN_PER_MIN` 25) | the Signal Box is a later slice |
| Retired kiosk key rows | stay shelved |
| Print-shop key prices and dye cans | settled by the 0.1.136 proposal; they sink keys, not coin |
| Vault ladder, streak-75, welcome, market light buy-in, shop payout, 3-item order-card half pay | not the source of the leftover |
