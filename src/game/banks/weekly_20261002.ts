import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Friday weekly trivia growth (2026-10-02) — 24 new cards.
 * City focus: underfilled Temple / Austin / Tucson (+ light London).
 * Topic cards: thin political + non-math science/history/nature.
 * Wired via cities.ts (CITY_WEEKLY_20261002) and trivia.ts WEEKLY_*_20261002 merges.
 */
export const CITY_WEEKLY_20261002: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  temple: {
    local: [
      q("Temple's Cultural Activities Center is mainly a…", ["arts and performance campus", "medical research campus", "railroad museum", "community college campus"], "arts and performance campus", 2),
      q("Which private university in neighboring Belton is often tied to Temple's metro life?", ["University of Mary Hardin-Baylor", "Southwestern University", "Texas Christian University", "Southern Methodist University"], "University of Mary Hardin-Baylor", 2),
    ],
    sports: [
      q("University of Mary Hardin-Baylor's teams are the…", ["Crusaders", "Longhorns", "Aggies", "Horned Frogs"], "Crusaders", 2),
    ],
    food: [
      q("A Central Texas plate lunch often features chicken-fried steak with…", ["cream gravy", "marinara", "hollandaise", "soy glaze"], "cream gravy", 1),
      q("In the Temple–Waco corridor, a sausage kolache is typically a…", ["pastry wrapped around a link of sausage", "bowl of gumbo with sausage slices", "corn tortilla rolled around sausage", "biscuit split with sausage gravy"], "pastry wrapped around a link of sausage", 1),
    ],
    political: [
      q("Temple uses which common Texas city government form?", ["council–manager", "strong mayor–council", "city commission", "town meeting"], "council–manager", 2),
    ],
    nature: [
      q("Belton Lake near Temple was built chiefly on which river?", ["the Leon River", "the Lampasas River", "the Brazos River", "the San Gabriel River"], "the Leon River", 2),
    ],
  },
  austin: {
    nature: [
      q("Each summer evening, crowds watch Mexican free-tailed bats emerge from under…", ["the Congress Avenue Bridge", "the Golden Gate Bridge", "Tower Bridge", "the Brooklyn Bridge"], "the Congress Avenue Bridge", 1),
    ],
    political: [
      q("How many members sit in the Texas House of Representatives, which meets in Austin?", ["150", "100", "120", "181"], "150", 2),
    ],
    arts: [
      q("The Long Center for the Performing Arts sits on the south shore of…", ["Lady Bird Lake", "Lake Travis", "Lake Austin", "Lake Walter E. Long"], "Lady Bird Lake", 2),
    ],
    sports: [
      q("Austin FC plays home matches at…", ["Q2 Stadium", "Toyota Stadium", "Shell Energy Stadium", "Children's Mercy Park"], "Q2 Stadium", 2),
    ],
  },
  tucson: {
    political: [
      q("Tucson is the county seat of…", ["Pima County", "Maricopa County", "Cochise County", "Coconino County"], "Pima County", 1),
    ],
    sports: [
      q("Arizona Wildcats basketball plays on campus at…", ["McKale Center", "Desert Financial Arena", "Pauley Pavilion", "Huntsman Center"], "McKale Center", 2),
    ],
    food: [
      q("A Sonoran hot dog is typically served in a…", ["soft bolillo-style bun", "salted pretzel roll", "crisp lettuce wrap", "buttery croissant"], "soft bolillo-style bun", 2),
    ],
    nature: [
      q("Arizona's state tree, common around Tucson, is the…", ["palo verde", "sugar maple", "coast redwood", "white birch"], "palo verde", 2),
    ],
  },
  london: {
    political: [
      q("The Mayor of London (Greater London) is…", ["directly elected by London voters", "chosen by the London Assembly", "appointed by the Prime Minister", "chosen by the City of London Corporation"], "directly elected by London voters", 2),
      q("How many members sit on the London Assembly, which holds the Mayor of London to account?", ["25", "32", "73", "15"], "25", 3),
    ],
  },
};

/** Shared (non-city) weekly topic cards — avoid math. */
export const WEEKLY_POLITICAL_20261002: TriviaQ[] = [
  q("A bicameral legislature has…", ["two chambers", "one chamber", "three chambers", "an appointed council"], "two chambers", 1),
  q("Separation of powers divides government into…", ["legislative, executive, and judicial branches", "federal, state, and local levels", "House, Senate, and Cabinet", "president, Congress, and the states"], "legislative, executive, and judicial branches", 1),
];

export const WEEKLY_SCIENCE_20261002: TriviaQ[] = [
  q("Photosynthesis releases which gas as a byproduct?", ["oxygen", "nitrogen", "carbon dioxide", "hydrogen"], "oxygen", 1),
];

export const WEEKLY_HISTORY_20261002: TriviaQ[] = [
];

export const WEEKLY_NATURE_20261002: TriviaQ[] = [
  q("Migration in birds often means seasonal travel between…", ["breeding and wintering grounds", "day and night roosts", "coastal and inland lakes", "nesting and molting trees"], "breeding and wintering grounds", 1),
];
