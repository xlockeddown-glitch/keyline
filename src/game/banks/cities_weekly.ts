import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/** One-off 2026-09-22 weekly trivia growth + accuracy fixes (merged into CITY_EXTRA). */
export const CITY_WEEKLY: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  austin: {
    local: [
      q("The Texas State Cemetery sits roughly…", ["on Mount Bonnell", "about a mile east of the Capitol", "in Bee Cave", "at Bergstrom's terminals"], "about a mile east of the Capitol", 2),
    ],
    food: [
      q("Migas on an Austin breakfast plate usually means…", ["only a kolache of prune", "eggs scrambled with tortilla strips (and toppings)", "only ceviche", "only oatmeal of Scotland"], "eggs scrambled with tortilla strips (and toppings)", 2),
    ],
    nature: [
      q("Barton Springs' cold clear water comes mainly from…", ["desalination plants on the Gulf", "the Edwards Aquifer", "Lake Michigan diversion", "the Red River only"], "the Edwards Aquifer", 2),
    ],
    political: [
      q("Austin City Hall sits beside…", ["Lake Travis's dam face", "Lady Bird Lake downtown", "the Gulf Intracoastal", "Stillhouse Hollow"], "Lady Bird Lake downtown", 2),
    ],
  },
  temple: {
    local: [
      q("The Central Texas State Fair is staged mainly in…", ["Dallas Fair Park", "Belton (near Temple)", "the Houston Astrodome", "El Paso"], "Belton (near Temple)", 2),
      q("Baylor Scott & White Medical Center–Temple is a…", ["naval shipyard", "major teaching hospital of Central Texas", "MLB ballpark", "state capitol annex"], "major teaching hospital of Central Texas", 2),
    ],
    political: [
      q("Temple belongs to which U.S. state?", ["Oklahoma", "Texas", "Louisiana", "New Mexico"], "Texas", 1),
    ],
  },
  detroit: {
    local: [
      q("As of early 2026, GM's global headquarters is at…", ["the Renaissance Center", "Hudson's Detroit on Woodward", "Dearborn's Rouge plant offices", "Flint's Buick City"], "Hudson's Detroit on Woodward", 2),
    ],
  },
  london: {
    local: [
      q("The Thames Barrier was built chiefly to protect London from…", ["avalanches of the Alps", "tidal / storm surges up the Thames", "volcanic ash of Iceland only", "desert sandstorms"], "tidal / storm surges up the Thames", 2),
    ],
  },
  sf: {
    political: [
      q("San Francisco City Hall's dome is a landmark of the…", ["only Sunset dunes", "Civic Center", "only Alcatraz yard", "only Twin Peaks summit as City Hall"], "Civic Center", 2),
    ],
  },
  nyc: {
    political: [
      q("New York City's five boroughs are each…", ["independent U.S. states", "counties (with quirks) inside the city", "Canadian provinces", "only ZIP codes with no law"], "counties (with quirks) inside the city", 3),
    ],
  },
};
