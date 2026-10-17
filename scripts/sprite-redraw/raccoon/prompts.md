# Raccoon key art prompts (0.0.89)

Generated with the image tool at 16:9 (1280x720). Condensed from the session, not verbatim. References:
`ref-current` = the legacy raccoon (idle front, walk down/left/right/up, side idle) upscaled on white; rebuild it from
`git show 4ef6653:public/sprites/player-{idle,walk,idle-side}.png` (the original scout ships as player-*.png) if you
need it again. The legacy coat was dark slate, close to the grey fur.

## Turnaround (turnaround.jpg), one pass

References: ref-current, the sloth's `turnaround.jpg` (layout, scale, rendering, mask-colour coat).

> Redraw the raccoon scout as an unmistakable raccoon: chibi proportions, soft grey fur, a bold black bandit eye
> mask with white brows and a white muzzle, rounded ears with white rims, small dark nimble hands, chunky brown
> boots, a big bushy tail with bold black and grey rings and a black tip, satchel across the chest, brass lantern
> ALWAYS in the RIGHT hand, held low and clear of the body. Duffle coat to mid-thigh in flat cobalt mask colour,
> hood DOWN in every view. Front (tail peeking out to the right); left and right profiles STANDING with the boots
> together, tail curving out behind clear of the legs; back (tail hanging over the hem). Flat magenta, no shadow.

Used as is.

## Idle (idle-keyart.jpg), one pass

Reference: the turnaround.

> The same raccoon in a three-quarter idle: boots planted, head tilted with a curious, mischievous smile, lantern
> low in the RIGHT hand on the viewer's left, the other hand on the satchel flap, satchel on the viewer's right
> (as in the front walk), ringed tail curling out to the right clear of the boots and the satchel.

Used as is.

## Rig notes

The tail polygons hug the tail, with no `min_red`: the black rings are as dark as the boot leather, so a darkness
cut would eat them. In the profiles the far leg is a copy of the near one, and the leg polygons follow the real boot
outlines (a straight cut through the near toe left a one-pixel drip under the boots). From behind, the tail hangs
in front of the legs and its tip ends 3-5 px below the soles. That's the right perspective (the tail is nearer the
viewer than the feet), and qa's foot spread on that row is 2. Default coat: olive (L34 C26 h100), away from the
grey fur and from every other scout's coat.
