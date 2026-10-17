# Fox key art prompts (0.0.86)

Generated with the image tool at 16:9 (1280x720). The prompts below are condensed from the session, not verbatim.
References: `ref-current` = the current fox (idle front, walk down, walk left/right, walk up, side idle) upscaled
on white. Rebuild it from the legacy sheets in git (`git show f2efcb5:public/sprites/scouts/fox-idle.png`,
`fox-walk.png`, `fox-idle-side.png`) if you need it again.

## Turnaround (turnaround.jpg), one pass

References: ref-current, the turtle's and the cat's `turnaround.jpg` (layout, scale, the mask-colour coat).

> Character turnaround sprite sheet for a cozy painted city-exploration game, same layout and rendering style as
> the turnaround references. Redraw the red fox scout from the first reference: chibi proportions (big head about
> a third of the body height), deep orange-red fur, white muzzle, cheeks and chest ruff, black-tipped tall ears,
> amber eyes, small smile, a big bushy tail with a white tip, chunky brown laced boots, a brass oil lantern with a
> glowing orange flame ALWAYS in the fox's RIGHT hand. The hooded duffle coat with toggles reaches mid-thigh and
> is a flat saturated cobalt blue (it is a recolour mask). Four views left to right: front, left profile, right
> profile, back, all standing on one floor line, mid-stride in the profiles. Solid flat magenta background
> (#F506A9), no floor, no shadow, no text.

Known quirks of the accepted image: a faint floor shadow is painted under the feet (keyed with `shadow_from`),
the back-view tail hangs over the left leg (`layer: "front"`), the profile tails almost touch between views.

## Idle key art (idle-keyart.jpg), one pass

References: turnaround.jpg.

> The same fox, same style and coat, a single 3/4 standing idle pose facing the viewer, lantern in the right
> hand held low, tail curled out behind to the side, feet together. Solid flat magenta background (#F0039F),
> no floor, no shadow, no text.
