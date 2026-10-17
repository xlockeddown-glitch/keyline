# Owl key art prompts (0.0.90)

Generated with the image tool at 16:9 (1280x720). Condensed from the session, not verbatim. References:
`ref-current` = the legacy owl (idle front, walk down/left/right/up, side idle) upscaled on white; rebuild it from
`git show 861fab6:public/sprites/scouts/owl-{idle,walk,idle-side}.png` if you need it again. The legacy owl was a
small brown owl in a brown coat (hence its old 1.28x CSS scale-up), close to its own feathers.

## Turnaround (turnaround.jpg), two passes

Pass 1. References: the raccoon's `turnaround.jpg` (layout, scale, rendering, mask-colour coat), ref-current.

> Turnaround of a chibi OWL scout, unmistakably an owl: a tawny great-horned owl with tall feathery ear tufts, a big
> round pale facial disc with a dark rim, huge round amber eyes, a small hooked beak, barred brown-and-cream chest
> feathers at the collar; wings work as arms with feather-tip "fingers" out of the sleeves. Knee-length duffle coat,
> toggles, hood DOWN, in flat saturated cobalt mask colour; satchel across the chest; chunky brown lace-up boots; a
> short fan of barred tail feathers below the back hem. Brass lantern ALWAYS in the owl's RIGHT wing-hand (viewer's
> left from the front, viewer's right from the back), low and clear of the body. Profiles STANDING, boots together.
> Front, left, right, back; flat magenta, no shadow, no text.

The profiles' lantern hung in front of the boots (it would have cut the boots), so pass 2 (reference: pass 1 and the
raccoon turnaround) repainted only that: the lantern held forward of the coat front at hip height, clear of the boots.

## Idle (idle-keyart.jpg), one pass

References: the turnaround, the raccoon's `idle-keyart.jpg`.

> The same owl in a three-quarter idle turned toward the viewer: boots planted, head tilted, big amber eyes on the
> viewer, a wise, gentle, slightly sleepy look, ear tufts up, lantern low in the RIGHT wing-hand on the viewer's left
> clear of the body and boots, the other wing-hand on the satchel flap, satchel on the viewer's right.

Used as is.

## Rig notes

Same rig shape as the raccoon (profiles standing, far leg a copy of the near one, the satchel and free wing-hand on
the body). No tail part from the front (none is painted); the barred tail fan is a `rev: 2` tail behind the boots in
the profiles and the idle, over the legs from behind. `underpaint` from the start: 0 see-through holes. Scale 0.28
(the figure, ear tufts included, stands ~147 px in the cell like the raccoon, fox and sloth), `motion` 1.36
(0.38 / 0.28). Default coat: midnight blue (L26 C22 h268), "Night eyes", away from the brown feathers, from the fox's
grey-slate (C9) and from every catalogue coat. The old 1.28x scale-up is dropped: the new owl fills its cell.
