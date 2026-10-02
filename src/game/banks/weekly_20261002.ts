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
      q("Temple's Cultural Activities Center is mainly a…", ["municipal recycling campus", "arts and performance campus", "naval training campus", "MLB spring-training complex"], "arts and performance campus", 2),
      q("Which private university in neighboring Belton is often tied to Temple's metro life?", ["University of Mary Hardin-Baylor", "Southwestern University", "Texas Christian University", "Southern Methodist University"], "University of Mary Hardin-Baylor", 2),
    ],
    sports: [
      q("University of Mary Hardin-Baylor's teams are the…", ["Crusaders", "Longhorns", "Aggies", "Horned Frogs"], "Crusaders", 2),
    ],
    food: [
      q("A Central Texas plate lunch often features chicken-fried steak with…", ["cream gravy", "marinara only", "hollandaise only", "soy glaze only"], "cream gravy", 1),
      q("In the Temple–Waco corridor, a sausage kolache is typically a…", ["pastry wrapped around a link of sausage", "bowl of gumbo with sausage slices", "corn tortilla rolled around sausage", "biscuit split with sausage gravy"], "pastry wrapped around a link of sausage", 1),
    ],
    political: [
      q("Temple uses which common Texas city government form?", ["council–manager", "parliamentary monarchy", "county-only rule with no city hall", "federal territory governor"], "council–manager", 2),
    ],
    nature: [
      q("Belton Lake near Temple was built chiefly on which river?", ["the Leon River", "the Rio Grande", "the Mississippi", "the Colorado of California"], "the Leon River", 2),
      q("Live oaks and pecan trees are common shade trees of…", ["Central Texas towns like Temple", "only Arctic tundra settlements", "only the Olympic rainforest as natives of Temple", "only Hawaiian lava fields"], "Central Texas towns like Temple", 1),
    ],
  },
  austin: {
    nature: [
      q("Each summer evening, crowds watch Mexican free-tailed bats emerge from under…", ["the Congress Avenue Bridge", "the Golden Gate Bridge", "Tower Bridge", "the Brooklyn Bridge"], "the Congress Avenue Bridge", 1),
    ],
    political: [
      q("Austin is the county seat of…", ["Travis County", "Harris County", "Dallas County", "Bexar County"], "Travis County", 1),
      q("The Texas Legislature that meets in Austin is…", ["bicameral (House and Senate)", "a single chamber only", "the U.S. Congress relocated", "a city council of 150"], "bicameral (House and Senate)", 2),
    ],
    arts: [
      q("The Long Center for the Performing Arts sits near…", ["Lady Bird Lake downtown", "Lake Travis's dam face only", "Bergstrom's runways as a stage", "Mount Bonnell's summit theater"], "Lady Bird Lake downtown", 2),
    ],
    sports: [
      q("Austin FC plays home matches at…", ["Q2 Stadium", "AT&T Stadium in Arlington only", "Fenway Park", "Wembley Stadium"], "Q2 Stadium", 2),
    ],
  },
  tucson: {
    political: [
      q("Tucson is the county seat of…", ["Pima County", "Maricopa County", "Cochise County", "Coconino County"], "Pima County", 1),
    ],
    sports: [
      q("Arizona Wildcats basketball plays on campus at…", ["McKale Center", "Madison Square Garden", "Cameron Indoor only", "The Forum in Inglewood"], "McKale Center", 2),
    ],
    food: [
      q("A Sonoran hot dog is typically served in a…", ["soft bolillo-style bun", "pretzel only", "lettuce wrap only", "croissant only"], "soft bolillo-style bun", 2),
    ],
    nature: [
      q("Arizona's state tree, common around Tucson, is the…", ["palo verde", "sugar maple", "coast redwood", "white birch"], "palo verde", 2),
    ],
  },
  london: {
    political: [
      q("The Mayor of London (Greater London) is…", ["directly elected by London voters", "appointed by the U.S. President", "the hereditary Duke of York only", "chosen by the UN Security Council"], "directly elected by London voters", 2),
      q("The Greater London Authority's assembly works with the…", ["Mayor of London", "Governor of Texas", "Mayor of Chicago only", "King of Spain as London's executive"], "Mayor of London", 1),
    ],
  },
};

/** Shared (non-city) weekly topic cards — avoid math. */
export const WEEKLY_POLITICAL_20261002: TriviaQ[] = [
  q("A bicameral legislature has…", ["two chambers", "one chamber only", "no elected members", "only a king"], "two chambers", 1),
  q("Separation of powers divides government into…", ["legislative, executive, and judicial branches", "army, navy, and air force branches", "federal, state, and county offices", "eastern, central, and western zones"], "legislative, executive, and judicial branches", 1),
];

export const WEEKLY_SCIENCE_20261002: TriviaQ[] = [
  q("Photosynthesis releases which gas as a byproduct?", ["oxygen", "nitrogen only", "helium", "argon"], "oxygen", 1),
];

export const WEEKLY_HISTORY_20261002: TriviaQ[] = [
  q("The United Nations was founded in…", ["1945", "1918", "1865", "2001"], "1945", 1),
];

export const WEEKLY_NATURE_20261002: TriviaQ[] = [
  q("Migration in birds often means seasonal travel between…", ["breeding and wintering grounds", "only different floors of one nest", "only aquarium tanks", "only city subway lines"], "breeding and wintering grounds", 1),
];
