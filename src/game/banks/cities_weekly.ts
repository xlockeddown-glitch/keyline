import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/** Weekly city trivia growth (merged into CITY_EXTRA). Includes 2026-09-22 + 2026-09-25. */
export const CITY_WEEKLY: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  austin: {
    local: [
      q("The Texas State Cemetery sits roughly…", ["on Mount Bonnell", "about a mile east of the Capitol", "in Bee Cave", "at Bergstrom's terminals"], "about a mile east of the Capitol", 2),
      q("Lady Bird Lake was formerly called…", ["Lake Travis", "Town Lake", "Stillhouse Hollow", "Lake Buchanan"], "Town Lake", 1),
    ],
    food: [
      q("Migas on an Austin breakfast plate usually means…", ["a prune kolache with sweet glaze", "eggs scrambled with tortilla strips", "ceviche of lime-cured shrimp", "Scottish oatmeal with brown sugar"], "eggs scrambled with tortilla strips", 2),
      q("Umami is the taste quality often described as…", ["sour", "savory", "bitter", "sweet"], "savory", 1),
    ],
    nature: [
      q("Barton Springs' cold clear water comes mainly from…", ["desalination plants on the Gulf", "the Edwards Aquifer", "Lake Michigan diversion", "the Red River only"], "the Edwards Aquifer", 2),
      q("Longhorn Dam on the Colorado River helps form…", ["Lake Travis alone", "Lady Bird Lake", "the Gulf of Mexico", "Lake Michigan"], "Lady Bird Lake", 2),
    ],
    political: [
      q("Austin City Hall sits beside…", ["Lake Travis's dam face", "Lady Bird Lake downtown", "the Gulf Intracoastal", "Stillhouse Hollow"], "Lady Bird Lake downtown", 2),
    ],
  },
  temple: {
    local: [
      q("The Central Texas State Fair is staged mainly in…", ["Dallas Fair Park", "Belton (near Temple)", "the Houston Astrodome", "El Paso"], "Belton (near Temple)", 2),
      q("Baylor Scott & White Medical Center–Temple is a…", ["naval shipyard on the Gulf coast", "major teaching hospital of Central Texas", "minor-league ballpark for the region", "state capitol annex for Bell County"], "major teaching hospital of Central Texas", 2),
      q("Temple, Texas began as a…", ["Spanish mission of 1690", "Gulf, Colorado and Santa Fe Railway town", "oil boom camp of Spindletop only", "Republic of Texas capital"], "Gulf, Colorado and Santa Fe Railway town", 2),
      q("Temple is named for Bernard Moore Temple, a…", ["Texas governor of the 1850s", "chief engineer of the Santa Fe railroad", "defender of the Alamo in 1836", "cotton baron and Galveston banker"], "chief engineer of the Santa Fe railroad", 3),
    ],
    political: [
      q("Temple belongs to which U.S. state?", ["Oklahoma", "Texas", "Louisiana", "New Mexico"], "Texas", 1),
      q("The county seat of Bell County, Texas is…", ["Temple", "Belton", "Killeen", "Waco"], "Belton", 2),
    ],
  },
  detroit: {
    local: [
      q("As of early 2026, GM's global headquarters is at…", ["the Renaissance Center", "Hudson's Detroit on Woodward", "Dearborn's Rouge plant offices", "Flint's Buick City"], "Hudson's Detroit on Woodward", 2),
      q("The Detroit River separates Detroit from…", ["Chicago", "Windsor, Ontario", "Toledo's downtown as a border", "Cleveland"], "Windsor, Ontario", 1),
    ],
  },
  london: {
    local: [
      q("The Thames Barrier was built chiefly to protect London from…", ["avalanches of the Alps", "tidal / storm surges up the Thames", "volcanic ash of Iceland only", "desert sandstorms"], "tidal / storm surges up the Thames", 2),
      q("Big Ben is the nickname commonly used for the Great Bell (and clock tower) at…", ["Edinburgh Castle", "the Palace of Westminster", "Tower Bridge's only bascule", "Buckingham Palace's kitchens"], "the Palace of Westminster", 1),
    ],
    arts: [
      q("A traditional English sonnet has how many lines?", ["8", "12", "14", "20"], "14", 2),
    ],
  },
  sf: {
    political: [
      q("San Francisco City Hall's dome is a landmark of the…", ["Sunset dunes", "Civic Center", "Alcatraz yard", "Twin Peaks summit"], "Civic Center", 2),
    ],
    local: [
      q("Alcatraz Island sits in…", ["Lake Tahoe", "San Francisco Bay", "the Sacramento River delta only", "Monterey Canyon as an island"], "San Francisco Bay", 1),
    ],
    food: [
      q("A sourdough starter is chiefly…", ["dried instant yeast and warm water", "a living fermented culture of flour and water", "baking powder and soda dissolved in milk", "malt syrup brushed on for a darker crust"], "a living fermented culture of flour and water", 2),
    ],
  },
  nyc: {
    political: [
      q("New York City's five boroughs are each…", ["independent cities with mayors", "counties of New York State", "Canadian provinces", "ZIP code areas with no government"], "counties of New York State", 3),
    ],
    local: [
      q("The Hudson River forms much of Manhattan's…", ["eastern shore", "western edge", "Central Park lake", "Brooklyn's oceanfront"], "western edge", 1),
    ],
    arts: [
    ],
  },
  chicago: {
    local: [
      q("O'Hare International Airport's familiar code ORD comes from the old…", ["Ohio River Depot", "Orchard Field name", "only Midway's code reused", "Union Station telegraph"], "Orchard Field name", 3),
    ],
  },
};
