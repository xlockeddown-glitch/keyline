# Turtle key art prompts (0.0.83)

Generated with the image tool at 16:9 (1280x720), three passes; `turnaround.jpg` is pass C.

References: `ref-current` = the current turtle (idle front, walk left, walk back) upscaled 4x on white;
`ref-lineup` = the first idle frame of all nine scouts. Rebuild them from the legacy sheets in git
(`git show d1c6a00:public/sprites/scouts/turtle-idle.png`, etc.) if you need them again.

**Pass A** (refs: ref-current) — too tall and slim, shell too thin. Rejected.

**Pass B** (refs: ref-current, ref-lineup):
> Character turnaround sprite sheet for a cozy painted city-exploration game. Redraw the exact turtle character
> from the first reference (the hunched little tortoise in a brown hooded coat holding a lantern), keeping its
> chunky chibi proportions so it matches the other animal scouts in the second reference: big head about one third
> of the body height, olive-green scaly head with large dark eyes and a small smile, short stubby legs in chunky dark
> brown boots, a LARGE round brown domed shell on its back with hexagonal scutes that bulges out well behind the
> body in side view, pale tan segmented belly plate showing down the open front of the coat, slightly hunched
> forward posture, small brass oil lantern with a glowing orange flame in its right hand. The hooded coat reaches
> mid-thigh and is coloured a flat saturated cobalt blue as a mask colour (no blue anywhere else, coat toggles and
> buttons dark brown). Four full-body views in one row, same scale, same ground line, evenly spaced with generous
> gaps: 1) front view facing the viewer, 2) left side profile walking direction left, 3) right side profile facing
> right with the lantern in the near hand, 4) back view showing the big shell. Neutral standing pose, feet slightly
> apart, arms slightly away from the body, lantern hanging below the hand. Soft painted shading, warm light, thin
> dark outline, same rendering style as the references. Flat solid pure magenta #FF00FF background, no floor
> shadow, no text.

Good proportions, but the hood was up (the turtle wears it down) and the back view had no lantern.

**Pass C** (refs: ref-current, ref-lineup, pass B) — used:
> Same turnaround sheet as the third reference image (same turtle, same four views, same layout, same poses, same
> scale), with these changes only: the hood is DOWN, lying folded behind the neck like in the first reference, so
> the whole round olive-green head is visible in every view; the back view also holds the brass lantern in the
> right hand (on the viewer's right); the palette is a little darker and more muted to match the first two
> references (dusky olive skin, deep chestnut-brown shell, warm tan belly plate, dark brown boots), still lit
> warmly by the lantern. The coat stays a flat saturated cobalt blue mask colour (no blue anywhere else, toggles
> dark brown). Painted storybook game-sprite style with soft shading and a thin dark outline. Flat solid pure
> magenta #FF00FF background, no floor shadow, no text.

## 0.0.83 idle pass (idle-keyart.jpg)

Two passes with the image tool. Pass 1 (references: turnaround.jpg, the old idle frame 0 upscaled 4x on white):

> Two full-body views of the exact same turtle character as the first reference image (same painted storybook
> game-sprite style, same olive-green round head with big dark eyes and small smile, chestnut hexagon-scute shell,
> tan segmented belly plate, dark brown laced boots, brass oil lantern with glowing orange flame, duffle coat with
> dark brown toggles painted in a flat saturated cobalt blue mask colour, hood down folded behind the neck), side
> by side at the same scale and on the same ground line, with a wide gap between them. LEFT VIEW: a characterful
> three-quarter idle pose copied from the second reference: body turned three-quarters toward the viewer and
> slightly to the viewer's left, hunched forward with rounded shoulders, big shell bulging behind, head pushed
> forward and slightly tilted, holding the lantern out low in its right hand on the viewer's left, the other hand
> resting relaxed at its side, feet planted a little apart. RIGHT VIEW: strict left side profile, standing,
> holding the lantern in its RIGHT hand which is the FAR arm [...]. Flat solid pure magenta #FF00FF background,
> no floor shadow, no text.

Pass 2 (references: turnaround.jpg, old idle, pass 1) asked for the same layout with the turnaround's darker,
muted palette and a more hunched idle. Used: pass 2, left figure only (crop [100,40,560,680]). The right figure
(left profile, lantern in the far hand) agreed with the turnaround's left view, so the turnaround stayed.
