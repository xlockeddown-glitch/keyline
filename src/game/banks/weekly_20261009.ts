import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Friday weekly trivia cards (2026-10-09) — 19 new cards, no math (math is over its 20% cap).
 * Gaps: political is the thinnest topic (3.6%), then food and sports; Tucson, Austin and Temple are the
 * thinnest city decks. Settled facts only: the 2026 Chemistry, Literature and Peace Nobels (announced
 * Oct 7–9), the 2026 Stanley Cup, Super Bowl LX's MVP, 2026 James Beard regional winners, and city
 * charters/FAQ pages for council facts. Every card was checked against the source URL above it.
 * City cards are wired via cities.ts (CITY_WEEKLY_20261009); shared cards via trivia.ts WEEKLY_*_20261009 merges.
 */
export const CITY_WEEKLY_20261009: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  tucson: {
    political: [
      // https://www.tucsonaz.gov/Government/City-Information/Frequently-Asked-Questions-FAQ-about-City-Government
      q("Tucson's six City Council members are each nominated by ward, then elected…", ["by voters citywide", "by their ward alone", "by the county board", "by the state senate"], "by voters citywide", 2),
      // https://www.tucsonaz.gov/Government/City-Information/Frequently-Asked-Questions-FAQ-about-City-Government
      q("Tucson's mayor and council members serve terms of how many years?", ["four", "two", "three", "six"], "four", 2),
    ],
    food: [
      // https://www.jamesbeard.org/stories/introducing-the-2018-americas-classics-winners
      q("In 2018, Tucson's El Güero Canelo won a James Beard America's Classics award for its…", ["Sonoran hot dogs", "carne asada tacos", "red chile tamales", "prickly pear pie"], "Sonoran hot dogs", 2),
    ],
  },
  austin: {
    political: [
      // https://www.austintexas.gov/clerk/programs/history-council
      q("Since 2015, Austin's City Council has had a mayor elected citywide plus how many district seats?", ["10", "6", "8", "12"], "10", 2),
    ],
    history: [
      // https://gov.texas.gov/first-lady/governors-mansion
      q("The Texas Governor's Mansion in Austin has housed Texas governors since…", ["1856", "1839", "1888", "1910"], "1856", 2),
    ],
  },
  temple: {
    political: [
      // City of Temple Charter §4.2: https://cms9files.revize.com/templetx25/City%20Attorney/City%20of%20Temple%20Charter%20FINAL_201903271235275467.pdf
      // https://www.templetx.gov/departments/city_council/meet_the_council.php
      q("Counting the mayor, how many members sit on Temple's City Council?", ["five", "seven", "nine", "eleven"], "five", 2),
      // City of Temple Charter §4.2 (three-year staggered terms)
      q("Temple's mayor and city council members are elected to terms of…", ["three years", "two years", "four years", "six years"], "three years", 3),
    ],
  },
  seattle: {
    sports: [
      // https://www.seattletimes.com/sports/seahawks/seahawks-kenneth-walker-iii-named-super-bowl-lx-mvp/
      q("Who was named MVP of Super Bowl LX in February 2026?", ["Kenneth Walker III", "Sam Darnold", "Jaxon Smith-Njigba", "Drake Maye"], "Kenneth Walker III", 2),
      // https://www.seattletimes.com/sports/seahawks/seahawks-kenneth-walker-iii-named-super-bowl-lx-mvp/
      q("Kenneth Walker III was the first running back named Super Bowl MVP since…", ["Terrell Davis", "Emmitt Smith", "Marcus Allen", "John Riggins"], "Terrell Davis", 3),
    ],
  },
  denver: {
    food: [
      // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
      q("Denver's Yuan Wonton won chef Penelope Wong the 2026 James Beard Best Chef award for which region?", ["Mountain", "Southwest", "Midwest", "Northwest"], "Mountain", 2),
    ],
  },
  chicago: {
    food: [
      // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
      q("Which Chicago restaurant won Jacob Potashnick the 2026 James Beard Best Chef: Great Lakes award?", ["Feld", "Alinea", "Smyth", "Oriole"], "Feld", 3),
    ],
  },
  nola: {
    food: [
      // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
      q("Serigne Mbaye won the 2026 James Beard Best Chef: South award for which New Orleans restaurant?", ["Dakar NOLA", "Commander's Palace", "Dooky Chase's", "Saba"], "Dakar NOLA", 2),
    ],
  },
  la: {
    food: [
      // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
      q("Which Los Angeles restaurant won the 2026 James Beard Award for Outstanding Hospitality?", ["Providence", "Bestia", "République", "n/naka"], "Providence", 2),
    ],
  },
  nyc: {
    food: [
      // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
      q("Hooni Kim's Meju, a 2026 James Beard Award winner, is in which New York City borough?", ["Queens", "Brooklyn", "Manhattan", "the Bronx"], "Queens", 2),
    ],
  },
};

/** Shared (non-city) weekly trivia cards — no math. */
export const WEEKLY_SPORTS_20261009: TriviaQ[] = [
  // https://www.nhl.com/news/carolina-hurricanes-vegas-golden-knights-stanley-cup-final-game-6-recap-june-14-2026
  q("Which team won the 2026 Stanley Cup?", ["Carolina Hurricanes", "Vegas Golden Knights", "Florida Panthers", "Edmonton Oilers"], "Carolina Hurricanes", 2),
];

export const WEEKLY_SCIENCE_20261009: TriviaQ[] = [
  // https://www.nobelprize.org/prizes/chemistry/2026/press-release/
  // https://www.kva.se/en/news/the-nobel-prize-in-chemistry-2026/
  q("The 2026 Nobel Prize in Chemistry explained how chemistry can favor one of a molecule's two…", ["mirror images", "heavy isotopes", "melting points", "charge states"], "mirror images", 2),
];

export const WEEKLY_ARTS_20261009: TriviaQ[] = [
  // https://www.nobelprize.org/prizes/literature/2026/press-release/
  // https://www.bbc.com/news/articles/cq4g1j54nepyo
  q("Which Canadian poet won the 2026 Nobel Prize in Literature?", ["Anne Carson", "Margaret Atwood", "Michael Ondaatje", "Dionne Brand"], "Anne Carson", 2),
];

export const WEEKLY_POLITICAL_20261009: TriviaQ[] = [
  // https://www.nobelprize.org/prizes/peace/2026/press-release/
  // https://www.bbc.com/news/articles/cm9wz5kng0x1o
  q("Navi Pillay, winner of the 2026 Nobel Peace Prize, is from which country?", ["South Africa", "Mozambique", "Sri Lanka", "Zimbabwe"], "South Africa", 2),
  // https://www.nobelprize.org/prizes/peace/2026/press-release/
  // https://www.bbc.com/news/articles/cm9wz5kng0x1o
  q("Before her 2026 Nobel Peace Prize, Navi Pillay served as the UN High Commissioner for…", ["Human Rights", "Refugees", "Climate Action", "Disarmament"], "Human Rights", 2),
];
