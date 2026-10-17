# Giraffe key art prompts (0.0.92)

Generated with the image tool at 16:9 (1280x720). Condensed from the session, not verbatim. References:
`ref-current` = the legacy Giraffe (walk down/left/right/up, idle front, side idle) upscaled on white; rebuild it from
`scripts/fixtures/legacy/giraffe-{walk,idle,idle-side}.png` (moved there in 0.0.92) if you need it again. The legacy
Giraffe is the approved 0.0.51 "v2" drawing (bd6ef5e): a bigger, rounder head and a shorter side-view snout so it
reads less llama-like, a neck rising out of a teal coat's collar, honey fur with caramel patches.

## Turnaround (turnaround.jpg), three passes

Pass 1. References: the owl's `turnaround.jpg` (layout, scale, rendering, mask-colour coat), ref-current.

> Turnaround of a chibi GIRAFFE scout, four views (front, left profile, right profile, back) on flat magenta, no
> shadow, no text. Unmistakably a giraffe, keeping the legacy giraffe's character: a BIG round head, a SHORT rounded
> snout in the side views (not llama-like), cream muzzle, small dark friendly eyes, rosy cheeks, two short ossicones
> with dark fuzzy tips, leaf-shaped ears; honey-gold fur with caramel patches; a giraffe neck rising out of the coat
> collar. Knee-length duffle coat with a stand-up collar and toggles in FLAT SATURATED COBALT BLUE (mask colour);
> chunky dark brown boots; a thin tail with a dark tuft below the back hem. Brass lantern ALWAYS in the RIGHT hand
> (viewer's left from the front, viewer's right from the back), low and clear. Profiles STANDING, feet together.

Pass 2 (reference: pass 1) made only the neck longer and clearly visible above the collar, about as tall as the head.
Pass 3 (reference: pass 2) repainted only the profiles: the lantern arm bent forward, the lantern hanging in front of
the coat at hem height, clear of the boots (it hung over the boots, which would have cut the legs).

## Idle (idle-keyart.jpg), one pass

References: the turnaround (pass 3), the owl's `idle-keyart.jpg`.

> The same giraffe in a three-quarter idle turned toward the viewer: boots planted, head tilted, a curious gentle
> look, the neck curving a little, lantern low in the RIGHT hand on the viewer's left clear of body and boots, the
> other hand in the coat pocket, tail tuft to the viewer's right behind the near boot.

Used as is.

## Rig notes

Head part = head + neck down into the collar (`layer: back`, `pivot` at the neck root), animated by the top-level
`neck` option (walk 3°, sway 2°, idle 1.5°). `rim_keep_warm`: keep the dark caramel fur edges out of the maroon-outline
ink. Profiles standing, far leg a copy of the near one (the owl's gait); the tufted tail is a `rev: 2` tail behind the
boots in the profiles and the idle, over the legs from behind. `underpaint` from the start: 0 see-through holes.
Scale 0.258 (the figure, ossicones included, stands ~158 px in the cell, 3-9 px of headroom), `motion` 1.47
(0.38 / 0.258). CSS scale-up 1.25 (was 1.46), see the README. Default coat: ruby (L30 C46 h8): away from every other
scout's default (nearest the Corgi's brown at ΔE ~37, the Penguin's purple ~40) and the only red among them. Of the
catalogue, the oxblood print-shop coat is nearest (ΔE ~18: a browner, duller brick at h30), then the vat red (~29: a
lighter, louder red) and plum (~29, a dusty h330).
