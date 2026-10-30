import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Friday weekly trivia cards (2026-10-30) — 15 new trivia cards, no math (math is under its 20% cap at
 * 15.4%, but other topics are thinner). Gaps: Tucson, Austin and Temple are the three thinnest city decks
 * (132, 146, 150), and geography (1.8%), books (2.1%) and music (3.3%) are the thinnest topics.
 * 13 city cards (wired via cities.ts, CITY_WEEKLY_20261030) plus 2 shared sports cards on the finished
 * 2026 World Series (wired via trivia.ts, WEEKLY_SHARED_20261030.sports). Settled facts only; every card was
 * checked against the source URL above it.
 */
export const CITY_WEEKLY_20261030: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  tucson: {
    music: [
      // https://en.wikipedia.org/wiki/Calexico_(band)
      q("The desert-noir band Calexico, led by Joey Burns and John Convertino, is based in…", ["Tucson", "El Paso", "Albuquerque", "San Diego"], "Tucson", 2),
      // https://en.wikipedia.org/wiki/Calexico_(band)
      q("Tucson's band Calexico takes its name from a border town in…", ["California", "Arizona", "Texas", "New Mexico"], "California", 3),
    ],
    history: [
      // https://en.wikipedia.org/wiki/Mission_San_Xavier_del_Bac
      q("Mission San Xavier del Bac's present church, south of Tucson, was built between 1783 and…", ["1797", "1821", "1853", "1769"], "1797", 3),
      // https://www.nps.gov/sagu/learn/historyculture/index.htm
      q("Which president created Saguaro National Monument, near Tucson, in 1933?", ["Herbert Hoover", "Franklin D. Roosevelt", "Calvin Coolidge", "Theodore Roosevelt"], "Herbert Hoover", 3),
    ],
    nature: [
      // https://www.nps.gov/sagu/learn/historyculture/index.htm
      q("Saguaro National Monument, outside Tucson, was made a national park by Congress in…", ["1994", "1961", "1980", "2006"], "1994", 2),
    ],
    science: [
      // https://noirlab.edu/public/news/noao9809/
      // https://noirlab.edu/public/images/noao-01081/
      q("Kitt Peak National Observatory, west of Tucson, sits on land leased from…", ["the Tohono O'odham Nation", "the University of Arizona", "the U.S. Air Force", "Pima County"], "the Tohono O'odham Nation", 2),
    ],
    books: [
      // https://en.wikipedia.org/wiki/The_Bean_Trees
      // https://www.sparknotes.com/lit/beantrees/summary/
      q("In Barbara Kingsolver's 'The Bean Trees', Taylor Greer drives west from Kentucky and ends up in…", ["Tucson", "Phoenix", "Santa Fe", "Las Vegas"], "Tucson", 2),
    ],
  },
  austin: {
    history: [
      // https://en.wikipedia.org/wiki/Huston%E2%80%93Tillotson_University
      // https://atlas.thc.texas.gov/Details/5453012248
      q("Huston–Tillotson, Austin's oldest college and a historically Black university, traces its start to…", ["1875", "1839", "1883", "1910"], "1875", 3),
    ],
    books: [
      // https://www.hrc.utexas.edu/press/releases/2014/gabriel-garcia-marquez-archive.html
      q("In 2014, UT Austin's Harry Ransom Center acquired the archive of which Nobel-winning novelist?", ["Gabriel García Márquez", "Mario Vargas Llosa", "Octavio Paz", "Pablo Neruda"], "Gabriel García Márquez", 2),
    ],
    music: [
      // https://en.wikipedia.org/wiki/Double_Trouble_(band)
      // https://www.srvofficial.com/biography/
      q("Stevie Ray Vaughan's Austin blues-rock band was called…", ["Double Trouble", "the Fabulous Thunderbirds", "the Texas Tornados", "Storyville"], "Double Trouble", 2),
    ],
    nature: [
      // https://www.fws.gov/refuge/balcones-canyonlands
      q("Balcones Canyonlands refuge, northwest of Austin, was set up in 1992 for the golden-cheeked warbler and the…", ["black-capped vireo", "whooping crane", "painted bunting", "roadrunner"], "black-capped vireo", 3),
    ],
  },
  temple: {
    history: [
      // https://www.tshaonline.org/handbook/entries/temple-tx
      // https://www.hmdb.org/m.asp?m=89965
      q("Temple was founded with a Santa Fe railroad town-lot sale in which year?", ["1881", "1866", "1897", "1904"], "1881", 2),
    ],
    geography: [
      // https://www.tshaonline.org/handbook/entries/little-river
      // https://www.tshaonline.org/handbook/entries/lampasas-river
      q("Near Temple and Belton, the Leon and Lampasas rivers join to form the…", ["Little River", "Brazos River", "San Gabriel River", "Colorado River"], "Little River", 3),
    ],
  },
};

/** Shared trivia cards (not city-tagged), merged in trivia.ts. */
export const WEEKLY_SHARED_20261030: Partial<Record<TriviaCat, TriviaQ[]>> = {
  sports: [
    // https://www.baseball-reference.com/postseason/2026_WS.shtml
    // https://www.mlb.com/news/brewers-beat-rays-game-5-win-2026-world-series
    q("The Milwaukee Brewers won their first World Series in 2026, beating which team four games to one?", ["Tampa Bay Rays", "Cleveland Guardians", "New York Yankees", "Seattle Mariners"], "Tampa Bay Rays", 1),
    // https://www.baseball-reference.com/postseason/2026_WS.shtml
    q("Who was named MVP of the 2026 World Series?", ["William Contreras", "Christian Yelich", "Jackson Chourio", "Jacob Misiorowski"], "William Contreras", 2),
  ],
};
