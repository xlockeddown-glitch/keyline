# Houses

Design only, for the version after 0.1.9. Branch `wip/houses-design`, cut from `39e6a6a` (package `0.1.9`, car paint). Nothing here changes the game, the wallet, or `APP_VERSION`.

> **As built in 0.1.12 (supersedes the purse sections below).** Prices doubled (cottage 40,000 · row 130,000 · townhouse 300,000 · villa 1,200,000; a step-up is still the difference — the hours table below predates this and is at the old prices). Ryan dropped the daily coin purse: turning the key pays **no coin**. It hangs the tier’s match (white / blue / green / amber), once per city per that city’s local day, after any three correct lamps in that city today (market lanterns count). Sign-in required; guests can’t buy. `COIN_CAP` is now 5,000,000 (a first sync still carries at most 250,000). The house is drawn on the map at its lot at building scale and opens the sheet when tapped. Ledger keys: `house:<city>:<tier>` and `hook:<city>:<local day>`; there is no `home:` row.

Mockups (phone 390×844, plus one desktop) are rendered from the game’s tokens, type, and real sprites. The four exteriors are new paintings in the same brush as the v2 scouts and the v3 cars.

| Screen | File |
| --- | --- |
| Map, house marker | [houses/map-phone.png](houses/map-phone.png) |
| Buy sheet, four tiers | [houses/buy-phone.png](houses/buy-phone.png) |
| Owned door | [houses/owned-phone.png](houses/owned-phone.png) |
| Buy sheet on a wide map | [houses/buy-desktop.png](houses/buy-desktop.png) |
| Source of those frames | [houses/mockup.html](houses/mockup.html) |
| Cottage, row, townhouse, villa | [houses/art/](houses/art/) |

## 1. What a house is

A house is **one door in one city**. Cars are global (buy once, drive in every city). A house is the local counterpart: it exists on a fixed lot in that city, and it only matters while you are there.

The smallest version that is actually fun:

**Homecoming.** Once each UTC day, after you have lit three lamps in that city today, walk to your door and turn the key.

- ~~A purse of coin~~ — dropped in 0.1.12; the key pays no coin.
- **One match on the hook**, once per city per that city’s local day. The colour depends on the tier. It uses the pocket you already have (30, then the usual overflow). It is an ordinary match.
- **The car you are driving sits in the drive**, in the paint it already wears. Cosmetic. CAB is unchanged. No car, empty drive.

Then you leave. The porch lamp stays lit until the city’s local midnight so you can see you already came home. Standing there pays nothing more. The house does not shorten a lamp rest, does not touch night-market rest, and does not change walk speed or cab speed.

That is the whole verb. No rooms, no storage grid, no rent, no roommates, no place-it-yourself lot.

### Why a player wants one

- A reason to finish a short walk and come back to a spot you chose, instead of another sink that only lives in a menu.
- The match is useful when you arrive in a city with a thin pocket. Correct lamps already refund their match, so this is a spare, not a new economy.
- The drive is where the car and the paint from 0.1.8 and 0.1.9 show up on the real map.
- Upgrading the door you actually use is the spend. A second city is a souvenir door, not a second salary.

### Why this does not bring camping back

0.1.6 made market lamps rest four times as long so a market was one pass, not an evening parked in the circle (`MARKET_REST` in `src/game/nightMarket.ts`). A house must not undo that.

- The purse is a flat claim, not a rate. An hour on the porch earns 0.
- It is once per account per day, so a tour of every city’s door does not stack coin.
- The three-lamp gate means you played the city first. Touching the lot off the train and leaving does not pay.
- Market lamps, stacked rests (`stackedCoolMs`), and cab pace are left alone. Cars already own “go faster.”

What this is not, on purpose: passive coin while you are away, a rest aura, a bigger pocket, a fifth tier at Roadster 2.0 money. Any of those either reprints the night-market problem or needs a wallet that can hold more than it can today (below).

## 2. Buying and using one

### Where it is

One fixed lot per city, same idea as `DEALERS` in `src/game/cars.ts`: a real place, door snapped onto the walk, `qa:stands` checks you can reach it. Reach is **40 m**, the same as `DEALER_REACH_M`.

Dealerships sit 1.5–3 km out because the trip is the point of a car. A house should feel like coming home, so the lot is the estate agent or house **nearest spawn inside 800 m**. The mock pins a lot on West Avenue, a short walk south of the Austin start. Coordinates for all 15 cities are an open question, not baked here.

Before you own it, the marker is the cottage painting with a **For sale** chip (the dealer pin’s brass treatment). After you own it, the marker swaps to the tier you bought and the chip says **Home**.

### Ownership

- At most **one house per city**. The tier is that one building, not four houses on one block.
- You may **buy any tier first** at its full price (same as cars: any order). You are not forced up a ladder the way market lights are.
- A later **step-up** costs the difference, and you cannot step down.
- A house in Austin does nothing in London. Each city is its own door, at that city’s full price. No multi-city discount in v1.
- Bought once, kept on the account. Guests do not buy. Same sign-in check as `buyCar` (`walletLive()`).

### Flow

1. Walk to the lot. Within 40 m, on foot, a pill appears in the same place as the car-lot pill: `House · West Avenue` while it is for sale, `Your door · Townhouse` once you own it.
2. The sheet opens. For sale: four tiers, prices, what the key pays. Owned: the painting, the car in the drive, the key, and the step-up if there is a higher tier.
3. **Buy** spends coin and swaps the marker. The server checks the price.
4. Later, after three correct lamps in that city today, **Turn the key**. You get the city’s match if you have not taken that today. Toast, porch stays lit, sheet can close.
5. CAB, lamps, the market, and the train are unchanged. You walk away.

The buy mock shows a wallet of 184,420: cottage, row house, and townhouse are affordable; the villa says what is still missing. The owned mock is the moment after buying the townhouse (34,420 left), Civic in Rallye Red in the drive, key ready.

## 3. Price ladder

Four tiers. Full price if it is your first house in that city. Step-up is the difference.

| Tier | Price | Step-up from the one below | Match on the hook |
| --- | ---: | ---: | --- |
| Lamp cottage | 40,000 | — | white |
| Row house | 130,000 | 90,000 | blue |
| Townhouse | 300,000 | 170,000 | green |
| Villa | 1,200,000 | 900,000 | amber |

The house pays no coin back. You buy it because you want the door, not because it prints coin.

### What a typical hour actually pays

Coin comes from lamp clears. Face values are `TIER_VALUE` in `src/game/rewards.ts`: white 30, blue 90, green 270, amber 810, red 2,430, violet 7,290. A clear multiplies that by timing, streak, and difficulty (`rewardPoints` in the same file, `gradeGrant` in `src/game/wallet.ts`).

Timing, from `src/game/store.ts`: over 10 s is ×0.4, 10 s or under is ×0.7, under 3 s is ×1. Difficulty is ×0.7 / ×1 / ×1.45 (`DIFF_MULT`). Streak adds 5% per correct answer in a row, capped at +40%. Fox and Penguin add ×1.1 loot. A night-market lamp doubles the coin and then rests four times as long, so staying there is a worse hour, not a better one.

**Typical hour used for the table:** a player who knows the city, answers in the “great” band (×0.7), on a standard question (×1), with a streak around four (×1.2). No Fox, no market double. That is 25 / 76 / 227 / 680 / 2,041 coin for white through red.

Clears in that hour follow the lamps you can actually repeat. A city has about 36 lamps, about 23 of them within 1.6 km of spawn. Whites rest 90 s, blues 140 s, greens 220 s, ambers and reds 400 s, violet six hours (`lampCoolMs`). The mix used here is the walk you settle into: **50% white, 30% blue, 12% green, 6% amber, 2% red**, about **50 clears** in the hour (the walk is the game’s 105.8 m/s, so the clock is the question, not the block). Blended coin per clear is 144. **50 × 144 = 7,200 coin per active hour.**

Daily goals are 60 coin × 3 and the city pulse is 80. Together that is about 4% of the hour, so they are not in the rate.

Two edges, same mix:

- Quiet hour: slow answers (×0.4), no streak, 30 clears → about **2,100** coin.
- Hot hour: perfect, hard cards, streak cap, Fox, 60 clears, still not camping the market → about **23,000** coin.

A “day” below is one typical hour. A short day is half of that.

### Hours and days, next to the cars

| Buy | Coin | Typical hours | Days at 1 hour | Days at 30 min |
| --- | ---: | ---: | ---: | ---: |
| Lamp cottage | 20,000 | 2.8 | 3 | 6 |
| Owl (scout) | 18,000 | 2.5 | 3 | 5 |
| Civic | 30,000 | 4.2 | 4 | 8 |
| Giraffe | 45,000 | 6.3 | 6 | 13 |
| Row house | 65,000 | 9.0 | 9 | 18 |
| F-150 | 50,000 | 6.9 | 7 | 14 |
| Fox | 90,000 | 12.5 | 13 | 25 |
| Townhouse | 150,000 | 20.8 | 21 | 42 |
| Shelby GT500 | 150,000 | 20.8 | 21 | 42 |
| Rainbow market light | 180,000 | 25.0 | 25 | 50 |
| Wallet cap | 250,000 | 34.7 | 35 | 69 |
| Villa | 600,000 | 83 | 83 | 167 |
| Roadster | 600,000 | 83 | 83 | 167 |
| Penguin (10× Fox) | 900,000 | 125 | 125 | 250 |
| Roadster 2.0 | 2,400,000 | 333 | 333 | 667 |

The cottage sits with the Owl, a bit under the Civic. The row house sits between the F-150 and the Fox. The townhouse is the same bill as the GT500, a bit under the rainbow light. The villa is the same bill as the Roadster. There is no house at Roadster 2.0 money. That sink stays the car.

Purse size against the same 7,200/hour: cottage 3 minutes, row house 6, townhouse 10, villa 20. Only the villa’s daily coin is larger than the three lamps you lit to unlock it (three typical clears are about 430 coin). It is still once a day, and it stops.

### The cap is the real constraint

`COIN_CAP` is **250,000**. `applyDelta` and `clampWallet` in `src/game/wallet.ts` never let a balance sit above it. So today a signed-in player cannot hold the price of the villa, the Roadster, the Roadster 2.0, or the Penguin. The cottage, the row house, and the townhouse all fit under the cap with room to have spent on the way. The villa is listed at the Roadster’s price so the ladder is honest, and it stays unbuyable until that cap moves. See the questions.

## 4. Art

The map stays the OSM tiles (`visual-direction.md`). The house is an object on the tile, the way a lantern and a dealer sign are. Not a painted basemap.

The paintings match the v2 scouts and the v3 cars: soft brush, dusk light, soot and warm wick, gentle edges. Not flat vector, not a cute chibi, not a photo. Each plate is a three-quarter exterior at eye level. The map pin is a crop of that same plate inside the dealer pin’s brass frame, not a separate sprite sheet. v1 does not need the front/side/back set cars have.

- **Lamp cottage.** One storey of worn red brick, a red door, one brass lantern, a short chimney, a little green at the windows. The cheap door. It is also the “for sale” picture, so every unsold lot looks like this.
- **Row house.** Two bays of cream plaster gone sooty, a dark roof, an iron stoop, a lamp hung over the door, wick-light in the tall windows. A city terrace, not a suburb.
- **Townhouse.** Three floors of pale limestone, sash windows, ivy on one corner, the same brass lantern. Taller than the row, clearly the next step up.
- **Villa.** Low and wide, sand stucco, one tall chimney, a gravel drive, one dark tree, amber in the glass. Set back. The star card uses the same gold edge as the Roadster 2.0’s showroom card. Not a palace and not a cartoon mansion.

The owned sheet puts the real car sprite in a “drive” row under the painting (the mock uses the Rallye Red Civic). The painting itself has no car in it, so any owned car can sit there later without a new picture per car.

## 5. Data sketch

No new table. Same ledger habit as `car:<id>`, `can:<source>`, and `paint:<key>`.

```ts
type HouseTier = "cottage" | "row" | "town" | "villa";

type HouseDef = {
  id: HouseTier;
  name: string;
  blurb: string;
  price: number;   // full price
  match: Tier;     // one match, once per city per local day
};

// One lot per city. Nearest real estate agent or house within 800 m of spawn.
type Lot = { city: CityId; name: string; lat: number; lng: number };
const HOUSE_REACH_M = 40;

// Guest save is irrelevant: buying requires sign-in, same as cars.
// Server ledger (newest row per key wins; a repeat of the same key is a free replay):
//   house:<city>:<tier>     buy or step-up. detail { city, tier, from: HouseTier | null }
//   hook:<city>:<localDay>  the match. detail { tier, match }
```

Ops on the existing wallet pipe (`pushOp` → `walletApply`), not new HTTP routes:

- `{ kind: "house", city, tier }` — refuse if the tier is unknown, if you already own that tier or a higher one, or if `coins < price - ownedPrice`. Write `house:<city>:<tier>`.
- `{ kind: "home", city }` — own a house there; at least three correct `grade:` rows today whose poi is in that city (`poiCity`); no `hook:<city>:<local day>` yet. Hang the tier’s match; no coin. The three-lamp count should ignore misses.
- `{ kind: "hook", city }` — own a house there; same three-lamp proof; no `hook:<city>:<localDay>` yet (`cityDay` from `vaultStack.ts`, the same midnight as lamp rests). Grant one match through `payMatch` / the pocket rule.

Client state to mirror the ledger, the way `carsOwned` mirrors `car:` rows: `houses: Partial<Record<CityId, HouseTier>>`, plus today’s claim flags so the button can read “Already home” without a round trip. The server stays the authority.

Grade rows today store `pi` (poi id) but not the city. `poiCity()` covers named lamps. Market lanterns and anything with an empty `pi` will not count unless new grade rows also store `c: city`. Old rows can keep working through `pi`.

### Open questions for Ryan

1. **The 250,000 cap.** Villa at 600,000 is unbuyable for the same reason the Roadster, the Roadster 2.0, and the Penguin are. Ship the villa as a listed price that waits, or hold it out of v1 until `COIN_CAP` moves?
2. **Lots.** This pass did not bake 15 OSM doors. Confirm the rule: nearest `shop=estate_agent` or a house, inside 800 m of spawn, door on the walk, `qa:stands`. What should a city do when nothing qualifies?
3. **Whose midnight.** The purse is once per UTC day so two cities cannot both pay. The match follows the city’s local midnight, like lamp rests. Should the purse follow the city too, with an explicit “one purse per account per UTC day” still on top?
4. **Skipping tiers.** You can buy the townhouse first at 300,000, or buy the cottage and pay 90,000 then 170,000. Confirm skip-ahead is allowed, rather than a forced ladder like market lights.
5. **Second cities.** Full price again, and no stacked purses. Is one purse a day too stingy once someone owns three doors, or is that the point of the anti-tour rule?
6. **The three lamps.** Named pois via `poiCity`, or any correct grade while the server’s city is that city (needs `c` on the grade detail)? Do the three market lanterns count?
7. **The drive.** The picture is whatever `carOn` is, in its paint. Confirm there is not a separately parked car. Empty drive when you are on the city cab.
8. **Guests.** Cars require sign-in. Houses the same?
