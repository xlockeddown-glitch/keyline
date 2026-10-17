import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * 0.0.81 math level-out (2026-10-16) — 12 political cards, no math. Political is still the thinnest topic,
 * and London, Los Angeles and Toronto are among the thinnest city decks. Settled facts only; every card was
 * checked against the source URL above it.
 * City cards are wired via cities.ts (CITY_LEVEL_20261016); shared cards via trivia.ts LEVEL_POLITICAL_20261016.
 */
export const CITY_LEVEL_20261016: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  la: {
    political: [
      // https://en.wikipedia.org/wiki/Los_Angeles_City_Council
      q("How many members sit on the Los Angeles City Council?", ["15", "9", "21", "51"], "15", 2),
      // https://en.wikipedia.org/wiki/Mayor_of_Los_Angeles
      q("A Los Angeles mayor may serve at most how many four-year terms in a row?", ["two", "three", "one", "four"], "two", 3),
    ],
  },
  toronto: {
    political: [
      // https://en.wikipedia.org/wiki/Toronto_City_Council
      q("Since 2018, Toronto City Council has how many ward councillors besides the mayor?", ["25", "44", "47", "35"], "25", 3),
      // https://en.wikipedia.org/wiki/Amalgamation_of_Toronto
      q("Metropolitan Toronto and its six member municipalities were merged into one city in…", ["1998", "1954", "1967", "1988"], "1998", 2),
      // https://en.wikipedia.org/wiki/Metropolitan_Toronto
      q("Metropolitan Toronto, the regional government above the old city, took effect in…", ["1954", "1967", "1934", "1975"], "1954", 3),
    ],
  },
  london: {
    political: [
      // https://en.wikipedia.org/wiki/Greater_London_Authority
      q("The Greater London Authority, home of the Mayor of London, was set up in…", ["2000", "1986", "1997", "2008"], "2000", 2),
      // https://en.wikipedia.org/wiki/Greater_London_Council
      q("The Greater London Council, London's government before the GLA, was abolished in…", ["1986", "1979", "1997", "1965"], "1986", 3),
    ],
  },
};

/** Shared political cards — no math. */
export const LEVEL_POLITICAL_20261016: TriviaQ[] = [
  // https://en.wikipedia.org/wiki/Supreme_Court_of_Canada
  q("How many justices sit on the Supreme Court of Canada?", ["nine", "seven", "eleven", "twelve"], "nine", 2),
  // https://en.wikipedia.org/wiki/Senate_of_Canada
  q("Canada's Senate has how many seats in total?", ["105", "100", "96", "120"], "105", 3),
  // https://en.wikipedia.org/wiki/House_of_Commons_of_Canada
  q("Since the 2025 federal election, Canada's House of Commons has how many seats?", ["343", "338", "308", "350"], "343", 3),
  // https://en.wikipedia.org/wiki/European_Parliament
  q("After the 2024 elections, the European Parliament has how many members?", ["720", "705", "751", "650"], "720", 3),
  // https://en.wikipedia.org/wiki/Article_Five_of_the_United_States_Constitution
  q("A proposed U.S. constitutional amendment takes effect once it is ratified by…", ["three-fourths of the states", "two-thirds of the states", "a majority of the states", "three-fifths of the states"], "three-fourths of the states", 2),
];
