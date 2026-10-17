# Cat (Tabby) key art prompts (0.0.85)

Generated with the image tool at 16:9 (1280x720). The prompts below are condensed from the session, not verbatim. References: `ref-current` = the current cat (idle front, walk
down, walk left/right, walk up, side idle) upscaled on white. Rebuild it from the legacy sheets in git
(`git show 53b00b9:public/sprites/scouts/cat-idle.png`, `cat-walk.png`, `cat-idle-side.png`) if you need it again.

## Turnaround (turnaround.jpg), one pass

References: ref-current, the turtle's `turnaround.jpg` (for layout, scale and the mask-colour coat).

> Character turnaround sprite sheet for a cozy painted city-exploration game, same layout and rendering style as
> the second reference. Redraw the ginger tabby cat scout from the first reference: chibi proportions (big head
> about a third of the body height), orange striped fur, big green eyes, pink inner ears, small smile, whiskers,
> a long striped tail, chunky brown laced boots, a brown leather satchel on a strap across the chest, a brass oil
> lantern with a glowing orange flame ALWAYS in the cat's RIGHT hand. The hooded duffle coat reaches mid-thigh and
> is a flat saturated cobalt blue mask colour (no blue anywhere else; toggles dark brown). Four full-body views in
> one row, same scale, same ground line, generous gaps: 1) front, lantern on the viewer's left; 2) left profile
> walking left, lantern held forward in the far hand; 3) right profile walking right, lantern in the near hand;
> 4) back view, lantern on the viewer's right. Tail clear of the legs where possible. Soft painted shading, thin
> dark outline. Flat solid pure magenta #FF00FF background, no floor shadow, no text.

Used as is. Quirks the rig works around: the profile views are mid-stride (rig.json `art_angle`, `ankle`), the
profile tails nearly touch between the views (crops stop short of them), the back-view tail hangs in front of the
left leg (tail `layer: "front"`; the leg's hidden paint is filled), and the back-view whiskers key out pink
(`erase`).

## Idle (idle-keyart.jpg)

References: turnaround.jpg, ref-current.

> One full-body view of the exact same tabby cat as the first reference (same style, fur, eyes, boots, satchel,
> brass lantern, cobalt-blue mask-colour duffle coat with dark brown toggles, hood down). A characterful
> three-quarter idle pose: body turned three-quarters toward the viewer, weight on one foot, head tilted with a
> curious friendly look, lantern held low in its RIGHT hand on the viewer's left, the other paw resting on the
> satchel, tail curling out to the viewer's right behind the boots. Flat solid pure magenta #FF00FF background, no
> floor shadow, no text.

Pass A used (crop [420,30,850,690]). A second pass asking for the satchel on the viewer's left (as in the
turnaround front view) came back unchanged, so the idle keeps the satchel on the cat's left hip: stopping after a
walk down moves the satchel across the body. Known limit.
