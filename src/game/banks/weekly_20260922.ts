import { q } from "../quiz";
import type { TriviaQ } from "../types";

export const WEEKLY_NATURE: TriviaQ[] = [
  q("A boxfish's body is protected by…", ["only soft skin like a tuna", "a rigid bony carapace of hexagonal plates", "feathers", "book lungs of a tarantula"], "a rigid bony carapace of hexagonal plates", 3),
];

export const WEEKLY_HISTORY: TriviaQ[] = [
  q("King Charles III was crowned in…", ["2020", "2021", "2023", "2025"], "2023", 2),
];

export const WEEKLY_SCIENCE: TriviaQ[] = [
  q("An exoplanet is a…", ["moon of Jupiter only", "planet orbiting a star other than the Sun", "comet in the Oort cloud only", "asteroid of the main belt only"], "planet orbiting a star other than the Sun", 2),
];

export const WEEKLY_POLITICAL: TriviaQ[] = [
  q("Soft power refers to influence through…", ["only tanks and tariffs", "culture, values, and diplomacy (not just force)", "only blockades", "only currency devaluation"], "culture, values, and diplomacy (not just force)", 2),
];
