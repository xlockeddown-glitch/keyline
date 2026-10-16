import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Friday weekly trivia cards (2026-10-16) — 18 new cards, no math (math is over its 20% cap).
 * Gaps: political is still the thinnest topic (3.7%), and Tucson, Austin, Temple and Denver are the
 * thinnest city decks. Settled facts only: city charters and clerk pages for council facts, the 2026
 * economics Nobel (announced Oct 12) and A'ja Wilson's 2026 WNBA MVP (announced Oct 8). Every card was
 * checked against the source URL above it.
 * City cards are wired via cities.ts (CITY_WEEKLY_20261016); shared cards via trivia.ts WEEKLY_*_20261016 merges.
 */
export const CITY_WEEKLY_20261016: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  tucson: {
    political: [
      // https://www.tucsonaz.gov/Departments/Clerks/Elections/About-City-of-Tucson-Elections
      // https://www.azcourts.gov/Portals/0/45/11Summaries/December62011CV110150PR.pdf
      q("Tucson is the only Arizona city whose city elections are…", ["partisan", "nonpartisan", "ranked-choice", "runoff-only"], "partisan", 2),
      // https://www.tucsonaz.gov/Departments/Clerks/Elections/About-City-of-Tucson-Elections
      q("Tucson holds its city primary and general elections in…", ["every odd-numbered year", "every even-numbered year", "every four years", "every third year"], "every odd-numbered year", 3),
      // https://www.tucsonaz.gov/Departments/Clerks/Elections/About-City-of-Tucson-Elections
      q("How many terms in a row may Tucson's mayor serve?", ["no limit", "two", "three", "one"], "no limit", 3),
      // https://www.pima.gov/2317/Board-of-Supervisors
      q("How many members sit on the Pima County Board of Supervisors, which meets in Tucson?", ["five", "three", "seven", "nine"], "five", 2),
    ],
    food: [
      // https://www.kgun9.com/news/local-news/tucsons-best-23-miles-of-mexican-food
      // https://tucsonfoodie.com/news/americas-best-mexican-food-2
      q("Tucson bills its stretch of family-owned Mexican restaurants as the best how many miles of Mexican food?", ["23", "10", "15", "50"], "23", 2),
    ],
  },
  austin: {
    political: [
      // https://www.austintexas.gov/clerk/programs/history-council
      q("Austin voters approved the 10-1 council plan, ten districts plus a citywide mayor, in…", ["2012", "2006", "2016", "2020"], "2012", 3),
      // https://www.austintexas.gov/clerk/programs/history-council
      q("Before switching to a council–manager government in 1924, Austin was run by a…", ["commission", "strong mayor", "town meeting", "county judge"], "commission", 3),
      // Austin City Charter Art. II §5: https://services.austintexas.gov/edims/document.cfm?id=207978
      q("An Austin council member can run for a third term in a row only with…", ["a voter petition", "a council vote", "the mayor's approval", "a court order"], "a voter petition", 3),
      // https://www.austintexas.gov/clerk/programs/history-council
      q("From 1953 to 1969, Austin's mayor was chosen…", ["by the council members", "by a citywide vote", "by the district voters", "by the city manager"], "by the council members", 3),
    ],
  },
  temple: {
    political: [
      // City of Temple Charter: https://cms9files.revize.com/templetx25/City%20Council/City%20of%20Temple%20Charter.pdf
      // https://www.templetx.gov/departments/city_council/index.php
      q("Besides the mayor, Temple's four council members are elected…", ["from single-member districts", "citywide at large", "by Bell County commissioners", "by the council itself"], "from single-member districts", 2),
      // https://www.templetx.gov/departments/administration/city_secretary/elections/index.php
      q("Temple holds its regular city council elections in which month?", ["May", "November", "March", "August"], "May", 2),
    ],
  },
  denver: {
    political: [
      // https://www.denvergov.org/Government/Legislation-and-Transparency/How-City-Government-Works
      q("Denver's City Council has 11 district seats plus how many at-large seats?", ["two", "one", "three", "four"], "two", 2),
      // Denver 2022 disclosure statement (City Charter term limits): https://www.denvergov.org/files/assets/public/v/1/finance/documents/cash-investment-and-capital-funding/2022-annual-disclosure-statement-vfinal.pdf
      q("Denver's mayor and council members are limited to how many terms in a row?", ["three", "two", "four", "no limit"], "three", 3),
      // Same disclosure statement: the mayor's veto may be overridden by nine council members.
      q("How many of Denver's 13 council members does it take to override a mayor's veto?", ["nine", "seven", "eight", "eleven"], "nine", 3),
    ],
  },
};

/** Shared (non-city) weekly trivia cards — no math. */
export const WEEKLY_POLITICAL_20261016: TriviaQ[] = [
  // https://www.nobelprize.org/prizes/economic-sciences/2026/press-release/
  q("Robert E. Hall and Michael Woodford won the 2026 economics Nobel for work on…", ["stabilization policy", "auction design", "poverty experiments", "job-search frictions"], "stabilization policy", 2),
  // https://www.nobelprize.org/prizes/economic-sciences/2026/popular-information/
  q("2026 economics Nobel winner Michael Woodford is a professor at…", ["Columbia University", "New York University", "Cornell University", "Fordham University"], "Columbia University", 3),
];

export const WEEKLY_SPORTS_20261016: TriviaQ[] = [
  // https://www.wnba.com/news/wilson-named-2026-most-valuable-player
  // https://apnews.com/article/aces-wilson-mvp-ab0569024af48fbb9683162c44e781d3
  q("In 2026, A'ja Wilson won a record how many WNBA MVP awards in her career?", ["five", "four", "six", "three"], "five", 2),
  // https://apnews.com/article/aces-wilson-mvp-ab0569024af48fbb9683162c44e781d3
  q("A'ja Wilson's 2026 MVP made her the first WNBA player to win it how many seasons in a row?", ["three", "two", "four", "five"], "three", 2),
];
