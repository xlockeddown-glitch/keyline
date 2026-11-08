# Keyline art direction

**Status: direction approved with 0.1.134.** Use it for new and changed art so later passes match. A slice changes the surfaces it names. 0.1.135: the counter sign carries three vault keys, not matches.

The older note [`visual-direction.md`](visual-direction.md) still holds on one point: the basemap stays real OSM tiles. This file is the contract for everything drawn on top.

0.1.134 demonstrates the proposed rules on two surfaces only: the street counter and the print shop. The outfitter pin, notice board, vaults, scouts, cars and houses were left as they are.

## What the words mean in this repo

| Word | What it is | What it is not |
| --- | --- | --- |
| Street counter | A `kind: "counter"` place. Map pin `.counter-pin` (`public/prop-art.css`, `counterPinHtml` in `src/game/pins.ts`). Sheet: `src/components/keyline/WardCounter.tsx`. Sells the desk tray, the morning crate, and the key forge. | A food counter, a numeric wallet counter, or a new building. |
| Print shop | The **Print shop** tab inside the outfitter (`src/components/keyline/ScoutShop.tsx` → `PrintShop.tsx` with `counter`). Facade: `public/sprites/print-shop.png` in `.print-front`. | The outfitter's Hire tab, the map shop pin, or a new place. The outfitter pin is `public/sprites/outfitter-front.png` on `.shop-pin`. |
| Outfitter | `kind: "shop"`. Hire tab plus the print shop. | Do not redraw it in a counter/print slice. |

`public/sprites/street-counter.png` is the older stall. The live pin is `street-counter-v2.png`. Do not wire the old file back in.

## Layers (what the game actually is)

Keyline is mixed media. Do not force one treatment onto every layer.

| Layer | Treatment now | Examples | Proposed |
| --- | --- | --- | --- |
| City | Real OSM tiles, darkened by the app. Never paint over the basemap. | Leaflet `atlas-tiles` in `GameMap.tsx` | Unchanged. |
| Vaults | Layered SVG. Tier colour lives on the glass, glyph and numeral. Brass trim is shared. | `vaultSvg` in `src/game/pins.ts` | Unchanged. Do not replace with a bitmap. |
| Service signs | Enamel plate, cream border `#ece4d6`, post. Station `#1c2b3a` + train. Board `#4b1c22` + `!`. Counter **was** `#1c2e24` in `src/styles.css`, then a painted PNG covered it. | `.station-pin`, `.board-pin`, `.counter-pin` | Painted props may replace the plate, but they keep that place's enamel colour so the pin still matches its sign. |
| Small props | Chunky pixel PNG, transparent ground. | `print-shop.png`, `street-counter-v2.png`, `outfitter-front.png`, `public/sprites/key.png` | Pixel grid, nearest-neighbour scale, `image-rendering: pixelated`, one dark outline. Checked at the CSS box, not at source size. |
| Scouts | Painted chibi sheets, 192px cells. A coat is a mask recolour, not a new body. | `public/sprites/scouts/*-v2.png`, `src/game/coatLayer.ts` | Stay smooth. Do not pixelate. Do not redraw a scout inside a prop slice. |
| Cars | Smooth painted side / front / back, including paint variants. | `public/sprites/cars/` | Stay smooth. Separate from pixel stalls. |
| Houses | Soft night paintings. | `public/houses/cottage-pin.webp` | Stay painted. A porch lamp may use the lantern amber. |
| UI chrome | Cool ink panels, brass hairline, Fraunces titles, Figtree body. | `@theme` in `src/styles.css`, `.errand-lit` | Do not invent a second panel style. Sheets for the outfitter, counter and board already share `.errand-lit`. |

## Palette

Use these tokens. Do not introduce a new accent.

From `src/styles.css` `@theme`:

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0e1014` | Page, night field behind a facade |
| `--color-bg-elevated` | `#161a20` | Panels |
| `--color-bg-subtle` | `#1e242c` | Quiet buttons, slots |
| `--color-fg` | `#e6e8ec` | Body text |
| `--color-fg-muted` | `#9aa3ae` | Secondary text |
| `--color-fg-subtle` | `#6d7682` | Kickers at rest, hints |
| `--color-accent` | `#cba56c` | Brass UI: kickers on `.errand-lit`, primary fill |
| `--color-accent-fg` | `#121418` | Text on brass fills |
| `--color-danger` | `#b85a4c` | Errors. Same family as vault red |
| `--color-ok` | `#7d9a78` | Quiet confirmation. Do not use as a stall awning |
| `--color-vault-white` | `#d6d1c7` | Tier I |
| `--color-vault-blue` | `#6e8fa8` | Tier II |
| `--color-vault-green` | `#6f8f72` | Tier III |
| `--color-vault-amber` | `#c9a35e` | Tier IV, and the brass metal |
| `--color-vault-red` | `#b85a4c` | Tier V |
| `--color-vault-violet` | `#7d7690` | Tier VI |

Materials used by the existing props and signs, and by the 0.1.134 drawings (`scripts/draw-counter-press.py`):

| Material | Value | Where it already appears |
| --- | --- | --- |
| Brass highlight | `#e0c788` | `public/lantern-art.css` `--skin-cap-hi` fallback |
| Brass mid | `#c9a35e` | `--color-vault-amber`, lantern caps |
| Brass shadow | `#6e5320` / `#8a6a38` | `vaultSvg` brass gradient, lantern-art `--skin-cap-lo` |
| Wood shadow | `#1a1410` / `#2a2218` | Vault stroke, lantern-art shop body |
| Cream enamel | `#ece4d6` | `.service-sign` border, station train, board `!` |
| Counter enamel | `#1c2e24` | `.counter-pin .service-sign` in `src/styles.css` |
| Board enamel | `#4b1c22` | `.board-pin .service-sign` |
| Station enamel | `#1c2b3a` | `.station-sign` |
| Lantern glass | `#ffd68c` family, hot core near `#ffecC4` | Street lamps and the 0.1.134 window lamp |
| Magenta | chroma key only | Scout sheets and `keyline-chroma` in `src/routes/__root.tsx`. Never a paint colour. `outfitter-front.png` still has a magenta fringe; that is a leak, not a style. Do not copy it. |

Tier colours on a prop are the vault list above, in ladder order. Key stock uses those six, not a rainbow of saturated candy colours. A counter sign shows vault keys (bow, shaft, teeth), the same silhouettes as `public/sprites/keys/`.

## Light

- Key light is upper left. Brass and wood take a light edge on the top and left, a dark edge on the bottom and right. The UI already does this (`shade` in the prop script; brass gradients in `vaultSvg` and `lantern-art.css`).
- A lamp is a local warm light: amber glass, a hotter core, a short falloff on nearby wood. It is not a flat yellow circle and not a magenta glow.
- Glass keeps the tier hue. Metal skins recolour cap, rim and post only (`public/wardrobe.css`, tested in `src/game/cosmetics.test.ts`). A print-shop lantern in a window is amber because the room is lit, not because the tier changed.
- Map contact shadow is the shared ellipse `.world-obj.has-shadow::before` in `src/styles.css`. Do not paint a second large blob under a pin.
- Sheet heroes sit on the night gradient already in `.print-front` (`#10141a` to `#24303c`).

## Silhouettes

At map size the player has about 46×58 CSS pixels for the counter (`public/prop-art.css`) and 46×70 for the outfitter. One cue has to survive that box.

| Place | Cue that must survive | Do not reuse |
| --- | --- | --- |
| Street counter | Low stall, deep green enamel, three vault keys (white circle, blue square, amber hex) | A building, a blank sign, matchsticks, a red/cream awning |
| Print shop | Tall press, the word PRESS, oxblood awning, platen and hanging lantern | The outfitter's candy-stripe awning and blank plate |
| Outfitter (unchanged) | Suit in the window, red/cream awning | — |
| Vault | Dial, glyph, numeral | A shop front |
| Station | Cream train on a navy plate | A lamp |

**Now:** `print-shop.png` and `outfitter-front.png` are the same storefront (blank brass plate, red/cream awning, lantern window). That is an accident of one generator pass, not an identity. **Proposed:** each service place keeps one silhouette. 0.1.134 changes the print shop and the counter. The outfitter pin stays until its own slice.

The counter sheet and the counter pin are the same file (`street-counter-v2.png`). The print shop sheet is `print-shop.png`. Do not draw a second, prettier version that only appears in a mock.

## Pixel props

`scripts/draw-counter-press.py` is the reference for a small prop:

1. Draw on a coarse grid (counter 40×52, press 64×86).
2. Scale with nearest-neighbour (×4). No bilinear upscale.
3. One dark pixel of outline around the silhouette so tiles do not eat the edge.
4. CSS: `image-rendering: pixelated` and `contain` inside the existing pin box. Do not change `iconSize` / `iconAnchor` in `GameMap.tsx` unless the silhouette no longer sits on the shadow.
5. Before shipping, look at the art at the CSS size (counter 46×58, print-shop figure height 148px) and on a phone width of 390. If a detail vanishes there, delete it or make it bigger. Do not add detail that only exists at source size.
6. No magenta pixels. `qa:sprites` already fails magenta on scout sheets; props should not need that net.

Cars, houses and scout sheets do not get `image-rendering: pixelated`.

## Type and chrome

- Titles: Fraunces (`--font-display`). Body and buttons: Figtree (`--font-sans`).
- A kicker is uppercase, tracked `.16em`, `.6875rem`. On `.errand-lit` it is brass.
- Buttons stay `.btn` with `min-height: 44px`. The sheet close control is `size-11` (44px). Do not shrink them to make room for art.
- An art change does not rename buttons, move their hit targets, or change `onClick` handlers, prices, item ids, or save fields.
- Words painted into a sprite (the PRESS plate) are short, dark ink `#1a1410` on brass, and must be readable at the figure's CSS height. Do not paint a sentence. Map pins do not carry words. The counter's mark is three vault keys, bow and teeth included, not match heads.

## Motion

- New motion is CSS, and it stops under `@media (prefers-reduced-motion: reduce)`. The lantern flicker, streak trail and lock bar already do this (`src/styles.css`, `public/lantern-art.css`, `GameMap.tsx`).
- A prop that only reads because it animates is a failed prop. The 0.1.134 counter and press do not animate.
- Do not add a flicker on these pins. The static warm drop-shadow on `.counter-pin` is enough.

## Phone and contrast

- Sheets are `max-h: 92dvh` and scroll inside the body. Art goes in the scroll region (`.print-front`), not in the header, so the close button stays on screen.
- Figures use `max-width: 100%` and `overflow: hidden` on `.print-front`. A facade must not widen the sheet past the viewport.
- Check 390×844. The 0.1.134 counter figure is 132px tall inside the scroller; the header and the first actions stay put.
- Cream `#ece4d6` on counter enamel `#1c2e24`, and ink `#1a1410` on brass `#c9a35e`, are the text pairs used in the new drawings. Do not put muted grey `#6d7682` on a mid brass fill.
- Colour is never the only cue on a tier. Vaults already add a glyph and a numeral. Matches on the counter use head colour plus position (three heads on the sign, six in the jar in ladder order).

## Do and don't

**Do**

- Recolour or redraw the asset the screen already shows.
- Share the night field, the brass, the wood and the lantern glass.
- Keep one drawing per place, used at pin size and in the sheet.
- Leave `.errand-lit` alone unless the slice is the sheet chrome itself. Journal rows must not pick up counter styling.

**Don't**

- Don't give the print shop the outfitter's red/cream awning. That pairing is the bug 0.1.134 is showing how to stop.
- Don't paint a new product, price, or button into the art.
- Don't pixelate a car, a house, or a scout to "match" a stall.
- Don't replace a vault SVG with a PNG in a prop slice.
- Don't use magenta, pure `#ffff00`, or a saturated rainbow.
- Don't claim this document is approved. Say proposed until Ryan says otherwise.

## Screenshot review

For a visual slice, capture the running game, not a standalone render of the PNG.

1. Guest or a local seeded save only. Put a visible "seeded guest" label in the shot. No production account. Do not press Buy, Pay, Claim, Forge, or Print while shooting, unless the task is to prove that control and you are on the seeded save.
2. Desktop (~1280×800) and phone (390×844), before and after when the art replaced an existing image.
3. Show the real state: the counter pin on the map, the counter sheet open, the Print shop tab open. The Hire tab and the outfitter pin are out of scope unless the slice names them.
4. Reject the shot if the close control or a 44px button is clipped, if type in the painting cannot be read at that size, if the pin is the wrong place (a vault, the station, the outfitter), or if the console logged an uncaught error.
5. Repeat one phone shot with `prefers-reduced-motion: reduce` when the slice adds motion. A still prop does not need a motion shot beyond a check that nothing new animates.

## 0.1.134, so the next pass can see the line

Changed:

- `public/sprites/print-shop.png` — press, PRESS plate, oxblood awning, lantern, platen.
- `public/sprites/street-counter-v2.png` — green enamel, three vault keys (the real white, blue and amber sprites), jar in tier order, brass lamp, wood stall. 0.1.135 replaced the matchsticks on the sign.
- `.counter-pin` and `.print-front` / `.counter-front` in `public/prop-art.css` — pixelated scaling, counter sheet uses the pin drawing.
- No change to costs, ids, `payCosmetic`, `claimCrate`, `buyKiosk`, `bankUp`, or `bankDown`.

Left on purpose:

- `outfitter-front.png` and its candy-stripe awning, including the magenta fringe.
- Notice board, vaults, scouts, cars, houses, journal, prices.
