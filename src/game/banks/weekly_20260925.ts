import { q } from "../quiz";
import type { TriviaQ } from "../types";

/** Friday 2026-09-25 weekly trivia growth (non-math; under-quota topics). */
export const WEEKLY25_POLITICAL: TriviaQ[] = [
  q("How many justices normally sit on the U.S. Supreme Court?", ["7", "9", "11", "13"], "9", 1),
  q("The Bill of Rights is the first…", ["ten amendments to the U.S. Constitution", "ten articles of confederation only", "ten Supreme Court opinions", "ten federal statutes of 1789 only"], "ten amendments to the U.S. Constitution", 1),
  q("A filibuster is a tactic mainly used to…", ["speed a bill to a vote with no debate", "delay or block legislative action through prolonged debate or procedure", "appoint cabinet secretaries", "redraw state borders"], "delay or block legislative action through prolonged debate or procedure", 2),
];

export const WEEKLY25_FOOD: TriviaQ[] = [
  q("A sourdough starter is chiefly…", ["instant yeast packets only", "a living fermented culture of flour and water", "baking powder dissolved in milk", "food coloring for crust"], "a living fermented culture of flour and water", 2),
  q("Umami is the taste quality often described as…", ["only sour", "savory", "only bitter", "only sweet"], "savory", 1),
];

export const WEEKLY25_HISTORY: TriviaQ[] = [
  q("Magna Carta was sealed in England in…", ["1066", "1215", "1492", "1776"], "1215", 2),
  q("The Apollo 11 Moon landing took place in…", ["1965", "1969", "1972", "1981"], "1969", 1),
];

export const WEEKLY25_ARTS: TriviaQ[] = [
  q("The Mona Lisa hangs in the…", ["British Museum", "Louvre", "Uffizi only as its permanent home", "Met's armor hall"], "Louvre", 1),
  q("A traditional English sonnet has how many lines?", ["8", "12", "14", "20"], "14", 2),
];

export const WEEKLY25_SPORTS: TriviaQ[] = [
  q("A hat-trick usually means a player scored…", ["one goal and two assists", "three goals in one match", "a perfect game in baseball only", "four tries in rugby only"], "three goals in one match", 1),
];

export const WEEKLY25_NATURE: TriviaQ[] = [
  q("Photosynthesis in green plants mainly happens in the…", ["mitochondria", "chloroplasts", "ribosomes", "vacuoles only"], "chloroplasts", 1),
  q("A biome is best described as…", ["a single tree species", "a large-scale ecological community shaped by climate", "a virus particle", "a tectonic plate"], "a large-scale ecological community shaped by climate", 2),
];

export const WEEKLY25_SCIENCE: TriviaQ[] = [
  q("In DNA, adenine pairs with…", ["guanine", "thymine", "cytosine", "uracil in DNA's usual pairing"], "thymine", 1),
  q("Water's chemical formula is…", ["CO2", "H2O", "O2", "NaCl"], "H2O", 1),
  q("CRISPR-Cas systems were first characterized as…", ["a rocket fairing latch", "adaptive immune systems in bacteria and archaea", "a SI base unit of luminous intensity", "a tarantula silk gland"], "adaptive immune systems in bacteria and archaea", 3),
];
