# Penguin key art prompts (0.0.91, scout id `lynx`)

Generated with the image tool at 16:9 (1280x720). Condensed from the session, not verbatim. References:
`ref-current` = the legacy Penguin (idle front, walk down/left/right/up, side idle) upscaled on white; rebuild it from
`git show f626ece:public/sprites/scouts/lynx-{idle,walk,idle-side}.png` if you need it again. The Penguin is the
Super Legendary and sits in the lynx slot, so its files keep the `lynx` id.

## Turnaround (turnaround.jpg)

References: the owl's and raccoon's `turnaround.jpg` (layout, scale, rendering, mask-colour coat), ref-current.

> Turnaround of a chibi PENGUIN scout, unmistakably an emperor penguin: glossy blue-black head and back, white
> face patches and belly, golden-yellow ear patches, a long slim dark beak with an orange stripe, flippers as arms,
> orange webbed feet with dark claws, a short stiff black tail. A special, regal look (it is the rarest scout): a
> knee-length coat with gold toggles and gold piping, painted in flat saturated GREEN mask colour (not cobalt: the
> feathers are blue-black), open over the white belly; a red knitted scarf with fringed ends. Brass lantern ALWAYS in
> the penguin's RIGHT flipper (viewer's left from the front, viewer's right from the back), low and clear of the
> body. Profiles STANDING, feet together. Front, back, left, right; flat magenta, no shadow, no text.

## Idle (idle-keyart.jpg)

References: the turnaround, the owl's `idle-keyart.jpg`.

> The same penguin in a three-quarter idle turned toward the viewer: feet planted, a proud, cheerful look, head
> slightly raised, lantern low in the RIGHT flipper on the viewer's left clear of the body and feet, the other flipper
> relaxed at the coat, scarf ends blowing to the viewer's right.

Used as is.

## Rig notes

`mask_key: "green"` (see the README). `rim_keep_red`: the scarf sits on the silhouette and the maroon-outline fix
would ink its fringe dark. Legs are the feet only, far foot a copy of the near one in the profiles; a waddle gait
(small swing, a slide under the belly, body roll). The stiff tail is a `rev: 2` part. `underpaint` from the start:
0 see-through holes. Scale 0.304 (the figure stands ~140 px in the cell, a little under the owl's ~147 like a real penguin),
`motion` 1.25 (0.38 / 0.304). The claws at the toe tips are separate dark marks in the key art and stay so.
Default coat: royal purple (L25 C44 h316), "Royal", set off by the gold trim and red scarf: away from the owl's
midnight blue (h268 C22), deeper and more saturated than catalogue plum (L30 C30 h330) and darker than the violet dye.
No special CSS scale.
