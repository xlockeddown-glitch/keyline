# Corgi key art prompts (0.0.87)

Generated with the image tool at 16:9 (1280x720). The prompts below are condensed from the session, not verbatim.
References: `ref-current` = the current corgi (idle front, walk down, walk left/right, walk up, side idle) upscaled
on white. Rebuild it from the legacy sheets in git (`git show 83c42a3:public/sprites/scouts/corgi-idle.png`,
`corgi-walk.png`, `corgi-idle-side.png`) if you need it again.

## Turnaround (turnaround.jpg), one pass

References: ref-current, the fox's `turnaround.jpg` (layout, scale, rendering, the mask-colour coat).

> Character turnaround sprite sheet for a cozy painted city-exploration game, same layout, scale and rendering
> style as the second reference. Redraw the Pembroke Welsh corgi scout from the first reference: chibi proportions
> (big head about a third of the body height), orange-tan and cream fur, white muzzle and chest blaze, big upright
> pointed ears with cream insides, dark friendly eyes, small smile, a short fluffy tan tail, short sturdy legs in
> chunky brown laced boots, a brown leather satchel on a strap across the chest, a brass oil lantern with a glowing
> orange flame ALWAYS in the corgi's RIGHT hand. The hooded duffle coat reaches mid-thigh and is a flat saturated
> cobalt blue mask colour (no blue anywhere else; toggles dark brown). Four full-body views in one row, same scale,
> same ground line, generous gaps: 1) front, lantern on the viewer's left; 2) left profile walking left, lantern
> forward in the far hand; 3) right profile walking right, lantern in the near hand; 4) back view, lantern on the
> viewer's right. Tail clear of the legs. Soft painted shading, thin dark outline. Flat solid pure magenta
> #FF00FF background, no floor shadow, no ground, no text.

Used as is (no floor shadow this time). Quirks the rig works around: the profile views are mid-stride
(`art_angle`, `ankle`); the sleeves reach into the hand and lantern polygons (`skip_coat`); the satchel sits
against the lantern in the front view and over the tail root in the profiles (the tail's `min_red` / `min_rb` are
raised to 160 / 115 so satchel leather is not fur); the back-view tail hangs over the left leg (`layer: "front"`).
The tail is hidden from the front.

## Idle (idle-keyart.jpg), one pass

References: turnaround.jpg, ref-current.

> One full-body view of the exact same corgi as the first reference (same painted style, fur, boots, satchel,
> brass lantern, flat cobalt-blue mask-colour duffle coat with dark brown toggles, hood down). A characterful
> three-quarter idle pose: body turned three-quarters toward the viewer, both boots planted slightly apart, head
> tilted with a happy curious look, lantern held low in its RIGHT hand on the viewer's left, the other paw resting
> on the satchel, short fluffy tail poking out to the viewer's right behind the hem, clear of the boots. Flat solid
> pure magenta #FF00FF background, no floor shadow, no ground, no text.

Used as is. As with the Tabby, the idle carries the satchel on the corgi's left hip while the turnaround's front
view has it on the right, so stopping after a walk down moves the satchel across the body. Known limit.

## Second pass (0.0.87, "make it stubbier and more corgi")

Ryan's review of the first corgi: next to the fox it read as a fox (long legs, slim upright build). Prompts below
are condensed from the passes, not verbatim.

- turnaround b/c (`turnaround.jpg`, front and back views used): the same corgi redrawn as an unmistakable Pembroke:
  very short stubby legs with the boots right under the coat hem, a long low barrel-chested body, a broad fluffy
  white chest bib and white muzzle blaze, big upright rounded-tip ears, a shorter broader face, a fluffy
  cotton-ball rump instead of a tail; same coat (cobalt mask colour, dark toggles), satchel and brass lantern; same
  four views and magenta background as before.
- turnaround d (`turnaround-standing.jpg`, both profiles used): the same character, profiles only, standing with the
  boots together (not mid-stride), lantern held clear of the body. Rigged with the far leg as a copy of the near one.
- idle c (`idle-keyart.jpg`): the stubby corgi in the three-quarter idle, satchel on the viewer's left to match the
  front walk view (this resolves the first pass's satchel-swap limit), cotton-ball rump showing to the right.
