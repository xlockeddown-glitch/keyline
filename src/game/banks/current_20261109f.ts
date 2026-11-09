import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Monday Nov 9, 2026 trivia batch 2, sub-batch f: time-anchored 2025–26 space and science cards (Blue Ghost, Rubin Observatory, Tianwen-2, Pandora, Colossal). Sources in docs/trivia-current-20261109f-sources.md.
 */

export const CUR_SCIENCE_20261109F: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Blue_Ghost_Mission_1
	q("Which company made the first fully successful commercial Moon landing in March 2025?", ["ispace", "Intuitive Machines", "Astrobotic", "Firefly Aerospace"], "Firefly Aerospace", 2),
	// https://en.wikipedia.org/wiki/Blue_Ghost_Mission_1
	q("What was the name of Firefly's lander that touched down on the Moon in March 2025?", ["Peregrine", "Blue Ghost", "Resilience", "Odysseus"], "Blue Ghost", 2),
	// https://en.wikipedia.org/wiki/Vera_C._Rubin_Observatory
	q("Which observatory in Chile, named for an astronomer who studied dark matter, released its first images in 2025?", ["Paranal Observatory", "ALMA", "Giant Magellan Telescope", "Vera C. Rubin Observatory"], "Vera C. Rubin Observatory", 2),
	// https://en.wikipedia.org/wiki/Tianwen-2
	q("Which Chinese mission reached the asteroid Kamoʻoalewa in July 2026?", ["Chang'e 7", "Tianwen-2", "Hayabusa3", "Tianwen-1"], "Tianwen-2", 2),
	// https://en.wikipedia.org/wiki/Pandora_(spacecraft)
	q("Which NASA small telescope launched in January 2026 to study exoplanet atmospheres?", ["Pandora", "Psyche", "Roman", "Lucy"], "Pandora", 2),
];

export const CUR_NATURE_20261109F: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Colossal_Biosciences
	q("Which extinct canine did Colossal Biosciences claim to bring back in 2025?", ["dire wolf", "dodo", "woolly mammoth", "thylacine"], "dire wolf", 2),
];
