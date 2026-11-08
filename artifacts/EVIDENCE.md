# Print shop vault skins — evidence

Review only. Not shipped. Ryan needs to approve the look, the kept names, and the kept prices before this goes anywhere.

## Baseline

| | |
| --- | --- |
| Base | `e9f85d74986b3a898241a319bb4c9a5aa795014c` |
| Base version | 0.1.135 / k1135a |
| `origin/main` at fetch | same SHA. Nothing newer to rebase onto. |
| This slice | `5185fe889c03db47a561adf6ba73f72e6fc03fa4` |
| Version | 0.1.136 / k1136a |
| Branch | `cursor/print-shop-vault-skins-56e7` |

## What this is

The print shop already sells four metal skins and the vat already paints street vaults. After Vault Keys, those skins still recoloured the old lamp drawing. The vault on the map and on the vault card is the layered SVG, so a bought skin did not show.

This slice points the same skins at that SVG. It does not add a second catalogue, a new equip slot, a migration, or a new price.

Stock is no skin attribute: the existing steel face and brass trim. "Back to brass" clears the worn metal skin. Vault paint, including prism, still covers a metal skin when it is worn (`visibleLantern`). Hearth pins are left on the copper case.

The glyph, the numeral, and the key slot are not in the skin rules. They stay on the tier colour. A white vault keeps the light circle, the dark numeral, and the light slot on every skin that was measured.

No new motion. Reduced motion already stops the slot pulse; the skins do not animate.

## Tentative names and prices — please confirm

These are the existing print-shop rows. Ids and prices were not changed. The section in the shop now says "Vault skins". The item names still say Lamp. Say if you want them renamed.

| Name (unchanged) | Id | Price | Ladder value, not charged |
| --- | --- | --- | --- |
| Steel and brass (stock) | none | free | — |
| Copper Lamp | `copper` | 10 white | 300 |
| Wrought Iron | `iron` | 8 white + 2 blue | 420 |
| Verdigris | `verdigris` | 6 white + 4 blue | 540 |
| Nickel Plate | `nickel` | 8 blue | 720 |

Vault paint is unchanged: coat 3/4/5/6/8/10 cans, street vaults 4/5/6/8/10/12, prism 1 coat or 2 vaults. White is about 1 in 2 through violet about 1 in 80. Prism stays about 1 in 10,000.

## What was reused

- Catalogue, instalments, `payIn`, `wear`, `cleanWardrobe`, `mergeWardrobe`.
- Guest save `keyline-save-v1` (`wardrobe`, `paints`, `pantry`).
- Signed-in path is the existing `print` wallet op and wardrobe upsert (`owned` jsonb, `coat`, `lantern`). No new column. No migration.
- Vat mix/wear for prism. Guest `pushOp` returns without a server call when there is no signed-in wallet.

A legacy save shape still loads. Browser check: an owned Oilskin and a 2-of-8 white instalment on Wrought Iron were still there after buying Copper and reloading.

## Browser, seeded guest only

Dev server. Detroit, Woodward Coat, Campus Martius (white vault). Every shot has a "SEEDED GUEST · test only" label. No signed-in account. No Buy/Pay against a real wallet. The vault sheet was closed with Leave vault before a field was chosen, so no card was dealt and no key was graded.

Pocket proof (local save):

- Start 12 white, 0 blue. Oilskin already owned. Iron already paid 2 white.
- Buy Copper: keys 12 → 2. Owned `oilskin`, `copper`. Lantern `copper`. Iron instalment still `{white:2, blue:0}`.
- Take off: lantern `null`. Keys stay 2. Stock row says Wearing.
- Reload: lantern `null`, both items still owned, iron instalment still 2/8, keys still 2.
- Wear again: keys stay 2. Not a second charge.
- Nickel on a phone with 8 blue: bought, wearing, toast "Nickel Plate printed. Wearing it."
- Prism: pantry seeded with 2 cans (not a found drop). Vat "Vaults" spent them to 0, `wornVault: "prism"`.

Computed fills on the Campus Martius pin (white tier):

| Skin | Face | Glyph | Numeral | Slot |
| --- | --- | --- | --- | --- |
| Stock | `url("#vk-f")` (steel gradient) | rgb(238, 242, 247) | rgb(38, 24, 15) | rgb(238, 242, 247) |
| Copper | rgb(200, 117, 78) | same light glyph | same dark numeral | same light slot |
| Nickel | rgb(183, 190, 198) | same | same | same |
| Prism | rgb(58, 109, 255) | same | same | same |

Prism on the vault card hero matched the map face and the same glyph, numeral, and slot.

Hearth exclusion, measured in the page: with copper on the document, a cloned `.hearth-pin` face stayed `url("#vk-f")` while the street pin face was rgb(200, 117, 78).

Reduced motion (`prefers-reduced-motion: reduce` on a 390×844 phone): `matchMedia` true. Slot animation name `none`. Face animation name `none`. Copper still wearing in the shop.

Insufficient funds: 0 white and 0 blue. Copper, iron, and verdigris each say "none in the pocket." The row drawings still preview the metal.

0.1.135 shop shots were taken by loading that commit's pin, wardrobe CSS, and print-shop chrome on the same dev server, then restoring this slice. Those shots still say "Lantern skins" and "Brass", and the row drawings do not change metal. Catalogue blurbs in that pass were already this slice's copy, because `cosmetics.ts` was not reverted for those two frames.

## Screenshots

All under the review attachments. Seeded guest.

- `before-shop-135-desktop.png`, `before-shop-135-phone.png` — 0.1.135 shop chrome.
- `before-shop-desktop.png`, `before-shop-phone.png` — this slice, stock wearing, previews, insufficient funds.
- `before-map-desktop.png`, `before-map-phone.png` — stock map.
- `after-shop-copper-desktop.png` — Copper wearing, toast, Take off, Back to brass.
- `after-shop-restored-desktop.png` — after reload: stock wearing, Copper owned, Wear, iron 2/8 kept, 2 white left.
- `after-map-copper-desktop.png`, `after-sheet-copper-desktop.png`
- `after-shop-nickel-phone.png`, `after-map-nickel-phone.png`, `after-sheet-nickel-phone.png` — nickel sheet opened as a spark because that pocket had blue keys and no white key. Copy: no key spent. Leave vault on screen.
- `after-shop-prism-desktop.png`, `after-map-prism-desktop.png`, `after-sheet-prism-desktop.png` — seeded cans, not a drop.
- `after-shop-copper-phone-reduced.png`, `after-map-copper-phone-reduced.png`
- `crop-stock.png`, `crop-copper.png`, `crop-iron.png`, `crop-verdigris.png`, `crop-nickel.png`, `crop-paint-prism.png` — same white vault, skin attribute swapped so the case can be compared. The walker is standing on that vault in the crops.

## Checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0. 30 warnings, 0 errors. None in the files this slice edits. Pre-existing: `scripts/trivia-audit.mjs`, `scripts/trivia-audit.test.mjs`, `scripts/trivia-balance.mjs`, `FirstLogin.tsx`, `FriendTickets.tsx`, `GameMap.tsx`, `Sky.tsx`, `email-accounts.test.ts`, `use-current-user.ts`. |
| `npm test` | exit 0. First process 286 pass / 0 fail. Second process 801 pass / 0 fail. 1087 pass, 0 fail. About 531s on the second process. |
| Earlier `npm test` before Pillow and scipy were installed | 286 tests, 18 fail, all `scripts/qa-sprites.test.mjs` (`No module named 'PIL'`, then `scipy`). Environment, not this diff. Re-run after `pip install pillow scipy` is the green 1087. |
| Production build | `node scripts/with-app-env.mjs vite build`, `strip-server-wasm`, `sanitize-server-chunks`, `deploy-guard`. Exit 0. **`db:migrate` was not run.** deploy-guard: function 4.29MB, static 16.83MB, ok. The build rewrote `public/sheet-k07d.css`; that file was reverted and is not in the commit. |
| Trivia banks | not edited. |

Wallet tests log `[wallet] love gift skipped relation "user" does not exist` and still pass. That line was already there.

## Not verified

- Signed-in wardrobe sync and the server `print` op (replay, double-buy, short pocket). The pure `payIn` tests still cover a second pay of an owned item, and the guest rewear did not charge. No Postgres session was opened.
- Server dye ledger for the prism mix. The guest mix never calls the server.
- A production-preview click-through. The production build completed; the screenshots are the dev server.
- A graded trivia card. The sheet was left before a field was chosen.

## Out of scope on purpose

No stat, reward, or economy change. No new ids. No migration. Philly, the press, and the counter sign were not touched. Trivia was not touched.
