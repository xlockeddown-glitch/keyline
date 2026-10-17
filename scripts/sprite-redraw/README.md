# Sprite redraw pipeline (v2 sheets)

0.0.83 sample: the Turtle. Everyone else stays on the legacy 4x4 walk / 2x2 idle / 2x2 side-idle sheets until
redrawn the same way.

## What a v2 scout ships

| file | what |
| --- | --- |
| `public/sprites/scouts/<scout>-v2.png` | 1536x1152, 8x6 cells of 192 px, 256-colour palette PNG. Rows 0-3: 8-frame walk down / left / right / up (true left and right drawings, not mirrors). Row 4: the 3/4 front idle, 8 frames (one slow breath, head nod, lantern sway, a blink). Row 5: idle left (cols 0-3), idle right (4-7). No up idle: stopping after walking up shows the front idle. Wears the scout's default coat. |
| `public/sprites/scouts/<scout>-v2-coat.png` | Same size, greyscale: coat coverage per pixel (0 = not coat). |
| `public/sprites/scouts/<scout>.png` | 96 px shop icon (first standing frame, half size). |

Coats and dyes are not files: `DyeSync` recolours the base through the mask in the browser
(`applyCoatLayer` in `src/game/coatLayer.ts`, Python twin `apply_coat` in `scripts/sprite-rig.py`). Only masked
pixels change, so a coat can never bleed onto shell, belly, fur, boots or lantern. qa:sprites proves it for
every coat and dye.

Runtime: add the scout to `V2_SCOUTS` and `V2_DEFAULT_COAT` (`src/game/coatLayer.ts`), add its CSS block (copy
the Turtle's in `src/styles.css`, "0.0.83 redrawn scouts"), point `walk`/`idle` in `src/game/data.ts` at the v2
sheet, delete its legacy sheets, coat PNGs (`public/sprites/coats/<scout>-*`) and dye QA sheets
(`scripts/dye-sheets/<scout>-*`), and rerun `python3 scripts/make-coat-variants.py --css`. GameMap, DyeSync,
qa:sprites and make-coat-variants pick the rest up from `V2_SCOUTS`.

## Making the art (per scout, about half a day)

1. **Key art.** Generate one turnaround sheet with the image tool: front, left profile, right profile, back, same
   scale and ground line, on flat magenta (#FF00FF), with the coat painted in flat **cobalt blue** as a mask
   colour. Give it the current sheets (upscaled) and a lineup of all nine scouts as references so it keeps the
   character and the chunky proportions. Iterate 2-3 passes; see `turtle/prompts.md` for the exact prompts.
   Save it as `scripts/sprite-redraw/<scout>/turnaround.jpg`.
   - Ask for the legs apart in the side views (a stride) and arms/lantern clear of the body: separate parts cut
     cleanly.
   - Cobalt works because no scout has blue fur. The Penguin is blue: give it a different mask colour (e.g.
     saturated green) and change `coat_weight()`.
   - **Lantern hand:** every scout carries it in the same hand in every view (the Turtle: its right hand, so
     viewer's left from the front, viewer's right from the back, the near hand facing right and the far hand,
     reaching from behind the chest, facing left). Say so in the prompt; check it before rigging.
   - **Idle key art (second pass):** a characterful 3/4 standing pose (turned toward the viewer, hunched, lantern
     out in the lantern hand), same coat mask, magenta background. Give it the turnaround and the old idle frame
     as references. Save as `idle-keyart.jpg`; it is its own view (`idle_front`) in rig.json with `"source"`,
     `"background"` (the pass's own magenta), `"scale"` (match the turnaround figure's height), `"sole": "auto"`,
     no legs, and `"eyes"` (ellipses for the blink). The script matches its skin tone to the turnaround (per-channel
     gain) and you can add a per-view `"grade"` override if its palette runs hotter.
2. **Rig.** Write `scripts/sprite-redraw/<scout>/rig.json` (copy the Turtle's): per view a crop box, the sole line,
   and polygons + pivots for head (ellipse; in front of or behind the body), lantern hand, lantern, and the near
   and far leg (hip pivot, ankle line, the leg's angle in the art for side views). Run with `--debug` and look at
   `debug-body-<view>.png` to check the cut. A leg keeps only paint joined to its boot and below the coat's hem
   outline (shell rim, tail and hem edge stay on the body), and its hidden ends are smeared only from interior
   columns, so a swinging leg never drags a dark flap. Coordinates are source pixels in the view's crop.
   Options added for the cat (0.0.85), all optional, the Turtle uses none of them:
   - `head.poly` (unioned with the ellipse: pointed ears, muzzle, whiskers) and `head.top: true` (everything above
     the ellipse centre is head, so no ear tip stays behind on the body when the head nods);
   - `tail`: `poly`, `pivot` (its root), `layer` (`"back"`: drawn before the legs, profiles and the idle; `"front"`:
     after the body, e.g. a tail hanging over the legs in the back view, where the legs' hidden paint is filled in),
     `min_red` (drop dark paint that carries on outside the polygon, i.e. boot leather the polygon crosses). It
     sways with the stride (profiles: a bob behind each step; back: with the hips) and slowly in the idles;
   - per leg `ankle` [x, y]: the real ankle the boot counter-rotates about (default: the polygon's mean x on the
     ankle line). For profile art painted mid-stride, give both legs the same hip x and set `art_angle` from the
     hip→ankle line; separate hip x or a wrong ankle makes the second contact frame narrower than the first;
   - per view `erase`: polygons of paint to drop after keying (back-view whiskers key out pink);
   - top-level `motion`: multiplies every pose translation (lift, step, bob, sway) for a scout painted at another
     size than the Turtle (cat: 1.28 = 0.38 / 0.296), so motion reads the same on screen; per view
     `step_reach` if the front/back step comes out over qa's 4 px.
   Options added for the fox (0.0.86), all optional; the Turtle and the Tabby render byte-identical without them:
   - per view `shadow_from` (a row in the crop) and `shadow_chroma` (default 0.26): the painter added a soft floor
     shadow (darkened key colour). From that row down, paint whose chromaticity is within `shadow_chroma` of the
     key colour's is dropped; boot leather sits ~0.34 away, so the soles survive;
   - `tail.rev: 2` switches the tail cut to the fox rules: `min_rb` (fur whose red is that far above its blue stays
     fur however dark, for deep red fox shading), a dark component only counts as foreign (a boot) if it is
     mostly outside the polygon and inside a leg polygon, every piece of tail ≥ 4% of the largest is kept (the
     tail may cross the legs and split), and a `"front"` tail fills the body under it only inside the body's
     closed outline (filling past it left a painted ghost of the tip when the tail swung);
   - top-level `coat_min_island` (px): coat-coloured regions smaller than this are not coat (the fox's nose and
     eye highlights read as cobalt and dyed with the coat);
   - per view `body_open` (iterations): below the top of the leg polygons the body keeps nothing thinner than
     this; outline strands left beside a leg otherwise read as dark sticks when the legs move.
   Option added for the corgi (0.0.87): per view `skip_coat` (px): the sleeve reaches into the hand and lantern
   polygons, so the coat stays on the body (the hand drops coat pixels; the lantern drops the coat grown by this
   many px, i.e. its outline too). Also keep a far leg's polygon off the tail root: a column of tail outline at
   the polygon's top edge is smeared up to the hip and swings as a brown stick.
   Options added for the stubby corgi (0.0.87, second pass), all optional; scouts without them render as before:
   - per view `source` / `background`: a view may come from its own painting (the corgi's profiles come from
     `turnaround-standing.jpg`, painted standing with the legs together, because mid-stride short legs with big
     `art_angle`s wedged the wide thigh out under the hem); it is skin-gain matched to the main source;
   - per leg `copy` (another leg's name), `copy_offset` [dx, dy] and `shade`: the leg is drawn as a shifted,
     darkened copy of that leg (the hidden far leg of a standing profile);
   - top-level `gait` {swing, lift, slide, bob, lift_fb, hip, bob_fb, roll}, defaults 32 / 18 / 0 / 0 / 13 / 6.5 /
     4 / 0: a short-legged waddle uses a small swing, `slide` (the legs translate forward/back rather than rotate,
     so short legs step without wedging), an extra body `bob` at passing and `roll` (degrees; the bottom swings
     out over the planted foot in front/back views, rocking about the neck so the head stays inside qa's drift);
   - top-level `coat_keep_near` [min_px, reach_px]: coat islands of at least min_px within reach_px of the main
     coat (and off the hand/lantern polygons) stay coat even below `coat_min_island` (a thin lining sliver between
     toggles was left blue otherwise);
   - top-level `underpaint` {close, depth, shade} (all six v2 scouts since 0.0.89): after compositing, paint a shadow layer *behind*
     each frame wherever the map would show through: slits up to ~2×`close` canvas px wide between parts the rig
     moves apart (thigh/boot under the hem, the tail joint), semi-transparent paint more than `depth` px inside the
     outline (keyed-out tail rings) and enclosed gaps. It copies the nearest solid pixel's colour (× `shade`) and
     coat-mask value, so dyed coats stay dyed. Openings framed by the hand or lantern (the bail loop) stay open, and
     so do openings painted in the key art wider than the closing disk (the cat's idle legs).
   The Raccoon (0.0.89) is the original scout and its legacy sheets are `public/sprites/player-*.png`. They stay as the
   fallback for a marker without `data-scout`, and `review-shots.py` reads them as the Raccoon's old sheets.
   The Owl (0.0.90) had a 1.28x CSS scale-up for its small legacy figure; the v2 owl fills its cell like the rest, so
   the scale-up is gone. Keep a scout's special CSS scale only if the v2 figure still reads wrong next to the set
   (the Giraffe's 1.46x lookout height is a design choice, not a fill fix).
   Cadence: `V2_CADENCE` in `src/game/coatLayer.ts` (corgi 1.35, sloth 0.8) speeds up the walk *animation* only; walking speed
   and `SCOUTS.gait` stay the same for every coat. `anim-preview.py` reads it too.
3. **Render.** `python3 scripts/sprite-rig.py <scout>`. It keys the background (with despill), measures the coat
   from the cobalt, grades the rest towards the older sheets (`grade` in rig.json), cuts the parts, fills the
   body behind moving parts, and animates them:
   - side walk (contact · down · passing · up, twice): legs swing ±32° about the hip, the swing foot lifts 18 px,
     the leading boot strikes heel-first (toe up) and the trailing boot peels heel-up before it leaves; the body
     height is solved every frame so the planted foot stays on the street (so the body is lowest at contact,
     highest at passing); the coat hem flares with the stride and sways a beat behind it (a per-row warp of the
     body below the hips, `warp_rows`); the lantern hand swings against the lantern-side leg and the lantern lags
     like a pendulum; head bob trails the body by a frame;
   - front/back walk: the swing foot lifts and steps toward the viewer (lower and ~10% bigger; away from the
     viewer in the back view), thighs follow halfway; hips sway over the planted foot while shoulders, head,
     hand and lantern counter-sway (the same per-row warp, shoulders → hips); body rises at passing. The floor
     is fixed per view from the neutral stance, so the stepping foot lands ~3 px (at 192) lower — qa:sprites
     allows 4 px on these rows and the self-test requires at least 2 so it can't slide back to marching in place;
   - side idles: breath (slight vertical swell), head rise, lantern sway;
   - 3/4 idle (`idle_front`, 8 frames): one slow breath, the head settles lower/forward in the collar
     (`head_offset`/`head_tilt`) and nods a beat behind the breath, lantern sways, eyes close on frame 6
     (`blink()`: lids painted from the surrounding skin plus a lash line).
   Pose numbers live in `pose()`; translations are in turnaround pixels and rescaled for views painted at
   another size.
   Everything renders at source resolution and is downscaled once to 192 px.
   The rig also writes `scripts/sprite-redraw/<scout>/parts-v2.png`, a part-id sheet (which part is on top at each
   pixel: body 1, head 2, tail 3, leg 4, hand 5, lantern 6, art gap 7 = an opening already painted in the key art).
   Commit it with the sheet: the holes check reads it.
   Then `default_coat` in rig.json picks the coat colour the base sheet wears (Lab L/C/h; match the old sheets).
4. **Compress.** `/workspace/.venv-png/bin/python scripts/optimize-sprites.py` (lossless oxipng).
5. **Check.** `npm run qa:sprites` (v2 checks: cells, planted feet, no cut-offs, the mask sits on the coat, every coat
   and dye changes only masked pixels and lands on its hue, no see-through holes), `npx tsc --noEmit`, `npm test`.
   Holes (0.0.89, `scripts/sprite-holes.py`; `python3 scripts/sprite-holes.py <scout>` lists them by view and frame):
   per frame, pixels with alpha < 128 fully enclosed by paint, or alpha < 200 at least 2 px inside the filled
   outline, 8-connected, ≥ 4 px each at 192. Not counted: openings framed ≥ 30% by the hand/lantern (the bail loop,
   the gap between the lantern arm and the body), openings ≥ 50% inside a painted art gap, real stride gaps
   between legs (inscribed radius ≥ 3.5 px, legs ≥ 50% of the rim), and soft edges (a semi-transparent patch whose
   alpha never drops below 128: the anti-aliased rim where two parts overlap tints the map, it doesn't show it).
   Every v2 scout must have none; all six use `underpaint`.
6. **Review.** `python3 scripts/sprite-redraw/review-shots.py <scout> /workspace/screenshots/<scout>-redraw- [REV] [PREV_V2_REV]`
   (old vs new, coats, strips, idles), `python3 scripts/sprite-redraw/anim-preview.py <scout> <out.gif>` (every walk and
   idle animated at game speed: 0.055 s per walk frame, 0.34 s per idle frame) and, with a dev server up,
   `node scripts/sprite-redraw/ingame-shots.mjs http://127.0.0.1:<port> /workspace/screenshots/<scout>-redraw-ingame- <scout>`.

## Size

Turtle: base 157 KB + mask 32 KB = 189 KB, against 275 KB for its legacy sheets and 12 coat PNGs. Cat: base
151 KB + mask 24 KB. The full-colour
PNG is 900 KB; the 256-colour palette (Floyd-Steinberg) is what makes 192 px frames fit. All nine scouts on v2
come to about 1.7 MB against 2.9 MB for the legacy sheets and coat PNGs today (135 files), so the static build gets
smaller as they move.
