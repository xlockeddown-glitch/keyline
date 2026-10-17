# Sloth key art prompts (0.0.88)

Generated with the image tool at 16:9 (1280x720). Condensed from the session, not verbatim. References:
`ref-current` = the legacy sloth (idle front, walk down/left/right/up, side idle) upscaled on white; rebuild it from
`git show 8d8601d:public/sprites/scouts/sloth-{idle,walk,idle-side}.png` if you need it again. The legacy sloth
wore a beige coat close to its fur colour and had a ringed raccoon-like tail; both are gone.

## Turnaround (turnaround.jpg), two passes

a) References: ref-current, the corgi's `turnaround.jpg` (layout, scale, rendering, mask-colour coat).

> Redraw the three-toed sloth scout as an unmistakable sloth: chibi proportions, shaggy grey-brown fur, a pale
> cream face mask with a dark brown eye stripe sweeping back from each eye, button nose, sleepy smile, long arms
> ending in three long curved cream claws (curling around the lantern handle), short sturdy legs in chunky brown
> boots, brown satchel across the chest, brass lantern ALWAYS in the RIGHT hand, held low and clear of the body. No
> tail. Hooded duffle coat to mid-thigh in flat cobalt mask colour (toggles dark brown), sleeves end at the wrists so
> forearms and claws show. Front; left and right profiles STANDING with the boots together (not mid-stride);
> back. Flat magenta background, no shadow, no text.

Pass a had the hood up in two views and down in the other two.

b) Reference: pass a. "Keep everything identical, with ONE change: the hood is DOWN in all four views." Used as is.

## Idle (idle-keyart.jpg), one pass

Reference: turnaround b.

> The same sloth in a relaxed three-quarter idle: boots planted slightly apart, head tilted with a contented
> half-lidded smile, lantern low in the RIGHT hand on the viewer's left with the claws hooked through the handle,
> the other hand resting on the satchel with its claws over the flap. The satchel hangs on the viewer's right,
> matching the front walk view. No tail. Flat magenta background, no shadow, no text.

Used as is.

## Rig notes

Standing profiles from the start (the corgi's lesson): the far leg is a copy of the near one (`copy`). `gait` makes
the walk slow and heavy: small slide steps with a low lift, a bigger hip shift and a slight `roll`, and
`V2_CADENCE.sloth = 0.8` slows the animation (walking speed unchanged). The default coat is a deep petrol teal
(L30 C22 h205), well away from the grey-brown fur, so coat and fur read apart in the base sheet.
