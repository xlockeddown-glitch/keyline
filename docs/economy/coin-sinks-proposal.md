# Coin sinks — proposal

Live **0.1.137** (`cb12b87`). Proposal only. No game code in this change.

This follows the print-shop audit in `docs/economy/print-shop-balance-proposal.md`. That slice spends keys. Coin is still earned and then sits.

## What a month is worth

Same assumptions as the print-shop model: standard questions, no category bonus, no cloth, no contract farming, no streak-75 triple, no villa key, no Owl. Heavy is one hour a day. Typical is sixteen 45-minute sessions in the month (about four a week).

| | Vault coin | Calendar (blitz, quests, one welcome on the heavy month) | Month |
| --- | ---: | ---: | ---: |
| Typical | 16 × ~6,400 ≈ 102,000 | ~20,000 if they clear the blitz and the daily set on the days they play | **~120,000** |
| Heavy | 30 × ~20,000 = 600,000 | ~170,000 (blitz 26,400, dailies ~10,000, weeklies ~50,000, monthly ~70,000, welcome 15,000) | **~770,000** |

The cap is **5,000,000** (`COIN_CAP`, `src/game/wallet.ts` line 38). A heavy player who buys nothing reaches it in about seven months. One who buys the hire list through the Fox (252,000) and the market-light ladder (390,000) still has coin left in month two, because those purchases happen once.

What is already for sale, and why it does not hold the pile:

| Shelf | Price | Repeats? | Why it goes quiet |
| --- | --- | --- | --- |
| Scouts | 0 to 90,000, then the Penguin at 900,000 | once each | The list through the Fox is one heavy week. The Penguin is pace and +10% coin (`data.ts` lines 3850–3961, `FOX_COINS` 90,000 × 10). |
| Cars | 30,000 to 600,000, then the Roadster 2.0 at 2,400,000 | once each | A pace ladder (`cars.ts` lines 15–23). Paint is 10% and spends a can (`carPaint.ts` lines 83–85), so it is gated by drops, not by wanting to spend. |
| Houses | 40,000 / 130,000 / 300,000 / 1,200,000 per city | once per city, then the key pays you | Villa key is 25,000 coin a day (`houses.ts` lines 21–25). The door pays for itself in about 48 days. |
| Market lights | 15k + 30k + 60k + 105k + 180k = 390,000 | once, in order | Each rung raises market coin, capped at ×3 (`marketLights.ts` lines 10–20). Rainbow is the end. |
| Map skins | four at 50,000 | once | CSS tints (`skins.ts` lines 13–19). |
| Print shop | keys, not coin | once | 0.1.137. |
| Kiosk keys | 160 / 420 / 5,400 / 24,000 | yes, and nobody should | Face value of the key is lower. See below. |
| Hurry | 25 coin per minute skipped | yes | A five-minute skip is 125 coin (`ticket.ts` lines 117–120). Invisible next to 770,000. |

Contract farming (1,500 coin per three lamps, cap 24 a day) and villa keys are extra faucets. They are left out of the 770,000 on purpose. This proposal does not retune them.

## Rules for anything new

- Cosmetic or convenience. A purchase does not add coin, keys, time on the card, pace, reach, or market multiplier.
- Repeatable, or a collection that keeps opening. A single 50,000 skin does not hold a heavy month.
- Reuse a ledger row and a screen that already exists.
- Owned scouts, cars, houses, lights, and skins stay at the price already paid. This proposal does not raise those stickers.
- Lantern Shops and the ladders stay retired.

## The six

Drain figures use the month above. “Buys it” means the player uses the sink when they are already playing, not that they log in only to pay.

### 1. Close the key desk

**Gets:** nothing new. The counter stops selling Tinder tin (160 for two white), Blue wick (420 for one blue), Amber reprint (5,400), and Night oil (24,000). Fare reprint (1,800), atlas smear (720), and the press pass (1,200) stay.

**Why:** those four sell vault access for coin, and they sell it at a worse rate than walking. Ladder face is white 30, blue 90, amber 810, violet 7,290 (`src/game/rewards.ts` lines 4–11). The desk is 2.7×, 4.7×, 6.7×, and 3.3× face (`src/game/data.ts` lines 3980–4022; debit in `kioskOp`, `src/game/wallet.ts` lines 499–514). Discounting them would be pay-to-win. Deleting them is the fix. Keys already bought are already in the pocket; there is nothing to refund.

**Repeats:** the rows go away.

**Drain / month:** about 0 today, and about 0 after. The win is a dead button that cannot be “fixed” into a power buy.

**Build:** S. Hide the four rows and refuse those `kiosk` ids on the server.

**Reuses:** `WardCounter`, `KIOSK`, `kioskOp`.

### 2. Patron lamp

**Gets:** for one night-market cycle (open 10 minutes, dark 5, `src/game/nightMarket.ts` lines 17–20) the markets on your own map wear a bulb you paid for. Brass, copper, or night-glass. The market’s coin multiplier stays whatever your lights and coat already say. Matches stay ×2. Other players do not see it in the first build.

**Price:** 2,000 / 5,000 / 12,000. One bulb per cycle. You have to be in the city while that cycle is open.

**Repeats:** every cycle, forever.

**Drain / month:**

| | Assumption | Coin |
| --- | --- | ---: |
| Typical | brass on half of 16 sessions | ~16,000 |
| Heavy | the 5,000 bulb once per session, 30 sessions | ~150,000 |
| Heavy, keen | the 5,000 bulb twice an hour | ~300,000 |

A player who bought every cycle in a heavy hour at 12,000 would spend 1,440,000 in a month. That is the ceiling, not the plan. The recommendation prices the middle bulb as the one a regular heavy session buys once.

**Build:** S. A local timer and a CSS tint on market lamps, using the swatches the light ladder already has. No new art and no shared post.

**Reuses:** night-market clock, market-light colors, the market line on the HUD.

### 3. Hearth polish

**Gets:** a hearth you placed keeps a brighter trim for seven days. The owner cut stays 50 coin, the daily cap stays 1,000, and the questions stay the owner’s fields (`src/game/placedLantern.ts` lines 116–117). Polish is a look, including on your own screen when you are not the visitor.

**Price:** 8,000 per hearth per week. One Single, one Double, and one Triple can each be polished. No discount for buying all three.

**Repeats:** weekly, per hearth.

**Drain / month:**

| | Assumption | Coin |
| --- | --- | ---: |
| Typical | one hearth, renewed twice | ~16,000 |
| Heavy | two hearths, every week | ~64,000 |

**Build:** S. One ledger key `hpolish:<placed id>:<week>` next to the existing `placed:` rows. The hearth panel gains one button.

**Reuses:** hearth placement, the Places row, the copper hearth pin.

### 4. Weekly press pull

**Gets:** each Monday the print shop offers one night pull: a coat or vault-case recolor of an item you already own, drawn from dye targets the game already mixes. You keep it. It does not replace the key catalogue from 0.1.137, and it does not change trivia.

**Price:** 25,000 for that week’s pull. Miss the week and that pull is gone. A later week is a different pull.

**Repeats:** one new offer a week. Each offer is bought once.

**Drain / month:**

| | Assumption | Coin |
| --- | --- | ---: |
| Typical | buys one of the four | ~25,000 |
| Heavy | buys all four | ~100,000 |

**Build:** M. A weekly id, a ledger row `pull:<week>`, and the existing dye / vault-CSS path. No new sprite sheets. The offer has to be deterministic from the week so every player sees the same pull.

**Reuses:** print shop counter, `dyeRecolor` targets, wardrobe equip.

### 5. Scout collars

**Gets:** a dyed collar on a scout you have already hired. Six colors, the vat’s colors, no perk, no pace, no coin bonus. The print-shop coat and the collar can both be owned; the collar is a scarf, not a second coat.

**Price:** 12,000 per scout per color. 10 scouts × 6 colors = 720,000 if someone collects the set. The Penguin’s collar still requires the Penguin.

**Repeats:** each pair once. The set is large enough to last a heavy month and then slow down.

**Drain / month:**

| | Assumption | Coin |
| --- | --- | ---: |
| Typical | one collar on a scout they already have | ~12,000 |
| Heavy, month one | two colors on each of eight hired scouts | ~192,000 |
| Heavy, later | a color at a time when a new scout is hired | small |

**Build:** M. Ledger `collar:<scout>:<color>`, a row on the hire tab, reuse the coat-mask dye so the scarf recolors without a new sheet per scout. If the mask cannot isolate a scarf, this becomes L and should wait.

**Reuses:** scout roster, dye targets, the worn-scout sync.

### 6. House dresser

**Gets:** four furnishings on a house you own in that city: a door lamp, a stair rail, a window, a nameplate. Look only. The daily key still pays what the tier pays today.

**Price:** 15,000 / 30,000 / 60,000 / 100,000, bought in any order, once per house. One house, fully dressed, is 205,000. The `items` array on `HouseState` is already reserved for this (`houses.ts` lines 8–9 and 28–29).

**Repeats:** once per city. A second house is another 205,000. It stops when the doors you care about are dressed.

**Drain / month:**

| | Assumption | Coin |
| --- | --- | ---: |
| Typical | the 15,000 lamp on one cottage | ~15,000 |
| Heavy, month one | one house, all four pieces | ~205,000 |
| Heavy, later | nothing, until another city gets a house | 0 |

**Build:** M if the pieces are CSS on the door you already draw. L if each piece is a new painting. The proposal is the CSS version.

**Reuses:** house ledger, the house sheet, `HouseState.items`.

## Rank

Value here means steady coin off a heavy month, divided by build size (S = 1, M = 2). A purchase that stops after one house scores lower than the same coin every month. The dead desk scores on safety, not on drain.

| Rank | Sink | Heavy drain / month | Typical | Repeats | Build | Why this rank |
| --- | --- | ---: | ---: | --- | --- | --- |
| 1 | Patron lamp | ~150,000 (keen ~300,000) | ~16,000 | every market cycle | S | Largest steady drain for the smallest build. No multiplier. |
| 2 | Hearth polish | ~64,000 | ~16,000 | weekly | S | Same kind of job, smaller drain, very much the hearth’s own screen. |
| 3 | Weekly press pull | ~100,000 | ~25,000 | weekly offer | M | Good sink, needs a rotating catalogue and a “you already own the base item” check. |
| 4 | Scout collars | ~192,000 in month one, then less | ~12,000 | finite set | M | Real collection. Stops. Depends on the dye mask isolating a scarf. |
| 5 | House dresser | ~205,000 in month one, then less | ~15,000 | once per house | M | The hook is already in the type. The house key remains a faucet, so the dresser does not balance the door. |
| 6 | Close the key desk | ~0 | ~0 | rows removed | S | Do it inside the first slice. It is a few lines, and it closes the bad version of “let them buy keys.” |

Scout, car, and house **stickers** stay. The cheap scouts and the Civic are bought immediately because they are power, not because the button is broken. Raising them delays perks and pace, needs a grandfather for anyone who already paid, and still does not repeat. The villa sticker is already 1,200,000; the 25,000-a-day key is the part that refills the wallet. That faucet is a separate decision (question 2).

## First slice

Ship **rank 6 and rank 1 together**.

1. Remove Tinder tin, Blue wick, Amber reprint, and Night oil from the counter and reject those ids in `kioskOp`. Fare reprint, smear, and the press pass stay at today’s prices.
2. Add the patron lamp as a local tint: 2,000 / 5,000 / 12,000, one per 15-minute cycle, no change to `marketCoinX` or the ×3 cap.

That is one screen’s worth of counter work and one HUD tint. A heavy player who uses the middle bulb once a day spends about 150,000 of the 770,000. A keen one spends about 300,000. Typical play spends about 16,000, which is a small slice of a 120,000 month and does not gate vaults.

Leave hearth polish for the next small slice if the patron lamp feels right in play. Leave the press pull until the patron lamp has been used for a few weeks; it is the same “pay for a look” idea with a catalogue to operate.

## Out of this proposal

- Lantern Shops and the ladders.
- Coin prices on the 0.1.137 key catalogue.
- Any new market-light rung, or any purchase that moves coin, keys, card time, pace, or reach.
- Sticker changes for scouts, cars, or houses.
- A shared patron lamp that other players render. That is a bigger build (question 1).

## Questions

1. The patron lamp in this slice is only on your map. Should a later slice show it to everyone standing on that market, or keep it personal?
2. A villa’s key pays 25,000 coin a day and earns the 1,200,000 price back in about 48 days. Leave that for its own slice, or fold a cap into the first sink slice?
