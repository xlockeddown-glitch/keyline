import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

export const CITY_EXTRA_PART_B: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
temple: {
    local: [
      q("Temple, Texas, sits in which county?", ["Travis", "Bell", "McLennan", "Williamson"], "Bell", 1),
      q("Temple grew as a…", ["port", "railroad town", "mining camp of silver", "whaling station"], "railroad town", 1),
      q("Temple is named for a…", ["Spanish missionary only", "railroad engineer, Bernard Moore Temple", "U.S. president", "Comanche chief"], "railroad engineer, Bernard Moore Temple", 2),
      q("Scott & White began as a…", ["fort", "railroad hospital", "university of music", "cotton gin only"], "railroad hospital", 2),
      q("Temple lies along which interstate between Austin and Waco?", ["I-10", "I-35", "I-45", "I-20"], "I-35", 1),
      q("Belton is Temple's…", ["port on the Gulf", "county-seat neighbor", "mountain suburb in the Rockies", "border crossing"], "county-seat neighbor", 2),
      q("Stillhouse Hollow and Belton Lake are…", ["Gulf bays", "reservoirs near Temple", "Great Lakes", "oxbows of the Mississippi only"], "reservoirs near Temple", 2),
      q("Temple College is a…", ["Ivy League university", "community college in town", "service academy", "conservatory in New York"], "community college in town", 1),
      q("The Santa Fe depot in Temple is a…", ["airport tower", "rail landmark downtown", "capitol", "lighthouse"], "rail landmark downtown", 1),
      q("Killeen and Fort Cavazos (Fort Hood) sit…", ["on the Gulf", "west of Temple in the same region", "in the Panhandle only", "in the Big Bend"], "west of Temple in the same region", 2),
    ],
    food: [
      q("Central Texas towns like Temple sit in the…", ["cioppino belt", "barbecue and kolache belt", "lobster-roll belt", "gumbo-only belt"], "barbecue and kolache belt", 1),
    ],
    sports: [
      q("Temple's high-school teams are the…", ["Longhorns", "Wildcats", "Bears of Baylor", "Aggies"], "Wildcats", 2),
    ],
  },
sf: {
    local: [
      q("The Golden Gate Bridge's color is officially…", ["gold leaf", "international orange", "navy blue", "forest green"], "international orange", 2),
      q("Alcatraz is in…", ["the Pacific a mile west of the Farallones", "San Francisco Bay", "Tahoe", "the Delta only"], "San Francisco Bay", 1),
      q("Lombard Street's crooked block is on…", ["Twin Peaks only", "Russian Hill", "Bayview only", "the Sunset only"], "Russian Hill", 2),
      q("The Castro is a historic…", ["financial district only", "LGBTQ+ neighborhood", "naval yard", "airport"], "LGBTQ+ neighborhood", 1),
      q("Mission District murals are concentrated on…", ["the Golden Gate's towers", "Balmy and Clarion alleys (among others)", "Alcatraz's rec yard only", "the Presidio golf greens only"], "Balmy and Clarion alleys (among others)", 3),
      q("The Presidio is a…", ["baseball park only", "former Army post, now a park", "university only", "subway yard"], "former Army post, now a park", 2),
      q("Coit Tower stands on…", ["Twin Peaks", "Telegraph Hill", "Mount Davidson", "Bernal Heights"], "Telegraph Hill", 2),
      q("The Embarcadero faces…", ["the ocean beach only", "the Bay", "the Santa Cruz mountains only", "Tahoe"], "the Bay", 1),
      q("Ocean Beach faces the…", ["Bay Bridge anchorage only", "Pacific", "Delta", "Carquinez"], "Pacific", 1),
      q("BART is the region's…", ["only cable-car company", "rapid-transit rail", "ferry-only system", "airport code"], "rapid-transit rail", 1),
      q("A San Francisco cable car is a…", ["subway", "moving-cable street railway", "monorail", "maglev"], "moving-cable street railway", 1),
      q("The Painted Ladies of Postcard Row face…", ["Oracle Park", "Alamo Square", "Fort Point", "Lands End only"], "Alamo Square", 2),
    ],
    food: [
      q("A Mission burrito is associated with…", ["the Castro", "San Francisco's Mission District", "North Beach", "Fisherman's Wharf"], "San Francisco's Mission District", 1),
      q("Cioppino on the wharf is a…", ["Mission burrito", "San Francisco seafood stew", "sourdough starter only", "Irish coffee only"], "San Francisco seafood stew", 2),
      q("Sourdough in San Francisco is famed for its…", ["absence of yeast of any kind as a legal definition", "wild starter and tang", "use of only baking powder", "corn masa"], "wild starter and tang", 1),
    ],
    arts: [
      q("City Lights Bookstore is in…", ["the Sunset", "North Beach", "Bayview", "Hunter's Point shipyard"], "North Beach", 2),
      q("The Fillmore is a…", ["baseball park", "historic music hall", "courthouse", "ferry"], "historic music hall", 2),
    ],
  },
detroit: {
    local: [
      q("Windsor, Ontario faces Detroit across the…", ["the Rouge only", "the Detroit River", "the St. Clair", "the Hudson"], "the Detroit River", 1),
      q("Motown Records was founded in…", ["Chicago", "Detroit", "Cleveland", "Memphis"], "Detroit", 1),
      q("The Renaissance Center is a…", ["auto plant only in Dearborn", "riverfront tower cluster long tied to GM (HQ moved to Hudson's in 2026)", "baseball park", "airport"], "riverfront tower cluster long tied to GM (HQ moved to Hudson's in 2026)", 2),
      q("Belle Isle is a…", ["suburb in Ohio", "park island in the Detroit River", "factory in Flint", "lake in Michigan's U.P. only"], "park island in the Detroit River", 2),
      q("The Guardian Building is a…", ["auto plant", "Art Deco skyscraper downtown", "stadium", "bridge to Canada only"], "Art Deco skyscraper downtown", 3),
      q("Campus Martius is a…", ["Ford's Rouge plant", "downtown park / square", "airport", "cemetery of the auto barons only"], "downtown park / square", 2),
      q("The Ambassador Bridge links Detroit to…", ["Toledo", "Windsor, Ontario", "Cleveland", "Chicago"], "Windsor, Ontario", 1),
      q("A tunnel also links Detroit to…", ["Toronto", "Windsor", "Buffalo", "Montreal"], "Windsor", 2),
      q("Dearborn is home to…", ["GM's only plant", "Ford's historic Rouge and The Henry Ford", "Motown's Hitsville", "the Lions' original Tiger Stadium"], "Ford's historic Rouge and The Henry Ford", 2),
      q("Hitsville U.S.A. is the…", ["Renaissance Center", "original Motown house on West Grand", "Tiger Stadium", "the Guardian Building"], "original Motown house on West Grand", 2),
      q("The QLine is a…", ["people-mover in the suburbs only", "streetcar on Woodward", "ferry to Belle Isle", "highway"], "streetcar on Woodward", 3),
      q("Woodward Avenue is Detroit's famous…", ["international border crossing to Ohio", "north-south corridor toward the suburbs", "only airport runway", "only a freeway with no street name"], "north-south corridor toward the suburbs", 2),
      q("Metrology on a Detroit-area auto line often leans on…", ["only tarot cards", "CMMs and gauge studies to hold body and powertrain tolerances", "Kessler debris maps", "urticating hair counts"], "CMMs and gauge studies to hold body and powertrain tolerances", 3),

    ],
    food: [
      q("Detroit-style pizza is…", ["a New York fold", "square, airy, and baked in a pan", "Chicago deep-dish", "a cone"], "square, airy, and baked in a pan", 1),
      q("A Coney dog in Detroit is a…", ["lobster roll", "chili dog in the local Greek-diner tradition", "Italian beef", "hot chicken"], "chili dog in the local Greek-diner tradition", 1),
    ],
    arts: [
      q("The Motown sound is built on…", ["only techno as Hitsville", "pop, soul, and a house band (the Funk Brothers)", "only punk of the Grande", "only gospel of the South"], "pop, soul, and a house band (the Funk Brothers)", 2),
      q("Detroit techno's early geography is…", ["only Berlin", "the city and its Black electronic musicians of the 1980s", "only Chicago house", "only Kraftwerk's studio in Düsseldorf as Detroit"], "the city and its Black electronic musicians of the 1980s", 3),
    ],
    sports: [
      q("The Lions play downtown at…", ["Comerica as football", "Ford Field", "Little Caesars as football only", "the old Silverdome still"], "Ford Field", 1),
      q("The Tigers play at…", ["Ford Field", "Comerica Park", "Joe Louis Arena still", "the Palace of Auburn Hills still"], "Comerica Park", 1),
    ],
  },
la: {
    local: [
      q("Los Angeles is in which county of the same name, plus it sprawls into…", ["the Bay Area as its county", "a basin and valleys of Southern California", "the Central Valley", "the Mojave as downtown"], "a basin and valleys of Southern California", 1),
      q("Hollywood is a…", ["separate city of Orange County", "district of Los Angeles", "neighborhood of Burbank", "part of Santa Monica only"], "district of Los Angeles", 1),
      q("The Hollywood Sign is mounted on…", ["Palos Verdes", "Mount Lee / the Hollywood Hills", "Catalina", "downtown's Bunker Hill only"], "Mount Lee / the Hollywood Hills", 2),
      q("Griffith Observatory looks over…", ["only Catalina as its view", "the basin and the Hollywood Sign", "only Palm Springs", "only San Diego"], "the basin and the Hollywood Sign", 1),
      q("Wilshire Boulevard runs…", ["only along the 405 as a loop", "from downtown toward the sea (the Miracle Mile among stretches)", "only in Orange County", "only in the Valley as a north–south"], "from downtown toward the sea (the Miracle Mile among stretches)", 2),
      q("Sunset Boulevard runs…", ["only in Long Beach", "from downtown through Hollywood toward the coast", "only in Pasadena as a freeway", "only to Palm Springs"], "from downtown through Hollywood toward the coast", 2),
      q("The 405 is a…", ["subway", "freeway through the Westside and Valley approaches", "river", "runway"], "freeway through the Westside and Valley approaches", 1),
      q("Union Station is in…", ["Santa Monica", "downtown L.A.", "LAX's terminals", "Pasadena only"], "downtown L.A.", 1),
      q("LAX is Los Angeles's…", ["only port", "main airport", "city hall", "subway yard"], "main airport", 1),
      q("The Port of Los Angeles is at…", ["Santa Monica Pier", "San Pedro / Wilmington", "Malibu", "Burbank"], "San Pedro / Wilmington", 2),
      q("Venice Beach is known for a…", ["container port", "boardwalk and muscle beach", "observatory", "studio backlot only"], "boardwalk and muscle beach", 1),
      q("Angels Flight downtown is a…", ["airport tram of LAX", "tiny funicular on Bunker Hill", "subway to Long Beach", "ferry to Catalina"], "tiny funicular on Bunker Hill", 3),
      q("Bunker Hill downtown was reshaped by…", ["only oil derricks still", "redevelopment towers and cultural buildings", "only a mission", "only a harbor"], "redevelopment towers and cultural buildings", 3),
      q("The L.A. River is a…", ["year-round barge canal to the Midwest", "mostly channelized watercourse through the basin", "Great Lake", "tidal fjord"], "mostly channelized watercourse through the basin", 2),
      q("Aerospace-ops culture around LA/Long Beach includes…", ["only surf contests", "spacecraft GSE, fairing work, and cleanroom flows for West Coast launch/assembly", "Detroit auto plants relocated as L.A.'s main industry", "tarantula ranches on the 405"], "spacecraft GSE, fairing work, and cleanroom flows for West Coast launch/assembly", 3),

    ],
    food: [
      q("The French Dip's origin story is fought over by…", ["two stands in Austin", "Philippe's and Cole's in L.A.", "two shacks in New Orleans", "two carts in Portland"], "Philippe's and Cole's in L.A.", 3),
      q("A California burrito often includes…", ["only rice as a Mission clone", "fries", "only spaghetti", "only cole slaw"], "fries", 2),
      q("In-N-Out Burger was born in…", ["San Francisco", "the Los Angeles area (Baldwin Park)", "San Diego", "Sacramento"], "the Los Angeles area (Baldwin Park)", 2),
    ],
    arts: [
      q("The Getty Center campus sits in the…", ["downtown's river channel", "Santa Monica Mountains foothills / Brentwood side", "Long Beach port", "LAX"], "Santa Monica Mountains foothills / Brentwood side", 2),
      q("LACMA is on…", ["the Venice boardwalk", "Wilshire's Miracle Mile", "Catalina", "Pasadena's Rose Bowl"], "Wilshire's Miracle Mile", 2),
    ],
    sports: [
      q("Dodger Stadium sits in…", ["Inglewood", "Chavez Ravine", "Pasadena", "Long Beach"], "Chavez Ravine", 2),
      q("SoFi Stadium is in…", ["downtown L.A.", "Inglewood", "Pasadena", "Anaheim"], "Inglewood", 2),
    ],
  }
};
