import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

export const CITY_EXTRA_PART_B: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
temple: {
    local: [
      q("Temple, Texas, sits in which county?", ["Travis", "Bell", "McLennan", "Williamson"], "Bell", 1),
      q("Temple grew as a…", ["port", "railroad town", "mining camp of silver", "whaling station"], "railroad town", 1),
      q("Temple is named for a…", ["Spanish mission founder of the 1700s", "railroad engineer, Bernard Moore Temple", "Texas Ranger captain of the 1840s", "Comanche chief who signed a treaty"], "railroad engineer, Bernard Moore Temple", 2),
      q("Scott & White began as a…", ["fort", "railroad hospital", "university of music", "cotton gin only"], "railroad hospital", 2),
      q("Temple lies along which interstate between Austin and Waco?", ["I-10", "I-35", "I-45", "I-20"], "I-35", 1),
      q("Belton is Temple's…", ["port on the Gulf", "county-seat neighbor", "mountain suburb in the Rockies", "border crossing"], "county-seat neighbor", 2),
      q("Stillhouse Hollow and Belton Lake are…", ["Gulf bays", "reservoirs near Temple", "Great Lakes", "oxbows of the Mississippi only"], "reservoirs near Temple", 2),
      q("Temple College is a…", ["Ivy League university", "community college in town", "service academy", "conservatory in New York"], "community college in town", 1),
      q("The Santa Fe depot in Temple is a…", ["airport control tower", "rail landmark downtown", "old county courthouse", "water tower landmark"], "rail landmark downtown", 1),
      q("Killeen and Fort Cavazos (Fort Hood) sit…", ["on the Gulf near Corpus Christi", "west of Temple in the same region", "in the Panhandle near Amarillo", "in the Big Bend near the border"], "west of Temple in the same region", 2),
    ],
    food: [
      q("Central Texas towns like Temple sit in the…", ["cioppino and sourdough belt", "barbecue and kolache belt", "lobster-roll and chowder belt", "gumbo and crawfish belt"], "barbecue and kolache belt", 1),
    ],
    sports: [
      q("Temple's high-school teams are the…", ["Longhorns", "Wildcats", "Bears of Baylor", "Aggies"], "Wildcats", 2),
    ],
  },
sf: {
    local: [
      q("The Golden Gate Bridge's color is officially…", ["Golden State gold", "international orange", "battleship gray", "redwood forest green"], "international orange", 2),
      q("Alcatraz is in…", ["the Pacific a mile west of the Farallones", "San Francisco Bay", "Tahoe", "the Delta only"], "San Francisco Bay", 1),
      q("Lombard Street's crooked block is on…", ["Twin Peaks", "Russian Hill", "Bayview", "the Sunset"], "Russian Hill", 2),
      q("The Castro is a historic…", ["financial district only", "LGBTQ+ neighborhood", "naval yard", "airport"], "LGBTQ+ neighborhood", 1),
      q("Mission District murals are concentrated on…", ["the Golden Gate's towers", "Balmy and Clarion alleys (among others)", "Alcatraz's rec yard only", "the Presidio golf greens only"], "Balmy and Clarion alleys (among others)", 3),
      q("The Presidio is a…", ["baseball park by the bay", "former Army post, now a park", "university campus and dorms", "cable-car barn and yard"], "former Army post, now a park", 2),
      q("The Embarcadero faces…", ["the ocean beach only", "the Bay", "the Santa Cruz mountains only", "Tahoe"], "the Bay", 1),
      q("Ocean Beach faces the…", ["Bay Bridge anchorage only", "Pacific", "Delta", "Carquinez"], "Pacific", 1),
      q("BART is the region's…", ["only cable-car company", "rapid-transit rail", "ferry-only system", "airport code"], "rapid-transit rail", 1),
      q("A San Francisco cable car is a…", ["subway under Market Street", "moving-cable street railway", "elevated downtown monorail", "electric overhead-wire trolley"], "moving-cable street railway", 1),
      q("The Painted Ladies of Postcard Row face…", ["Oracle Park", "Alamo Square", "Fort Point", "Lands End only"], "Alamo Square", 2),
    ],
    food: [
      q("A Mission burrito is associated with…", ["San Francisco's Castro District", "San Francisco's Mission District", "San Francisco's North Beach", "Fisherman's Wharf"], "San Francisco's Mission District", 1),
      q("Cioppino on the wharf is a…", ["Mission burrito", "San Francisco seafood stew", "sourdough starter only", "Irish coffee only"], "San Francisco seafood stew", 2),
      q("Sourdough in San Francisco is famed for its…", ["absence of yeast of any kind as a legal definition", "wild starter and tang", "use of only baking powder", "corn masa"], "wild starter and tang", 1),
    ],
    arts: [
      q("City Lights Bookstore is in…", ["the Sunset", "North Beach", "Bayview", "Hunter's Point shipyard"], "North Beach", 2),
      q("The Fillmore is a…", ["minor-league baseball park", "historic music hall", "federal courthouse", "ferry terminal"], "historic music hall", 2),
    ],
  },
detroit: {
    local: [
      q("Windsor, Ontario faces Detroit across the…", ["the Rouge only", "the Detroit River", "the St. Clair", "the Hudson"], "the Detroit River", 1),
      q("Motown Records was founded in…", ["Chicago", "Detroit", "Cleveland", "Memphis"], "Detroit", 1),
      q("The Renaissance Center is a…", ["Ford assembly plant in Dearborn", "riverfront tower cluster long tied to GM", "downtown baseball park for the Tigers", "airport terminal in Romulus"], "riverfront tower cluster long tied to GM", 2),
      q("Belle Isle is a…", ["suburb in Ohio", "park island in the Detroit River", "factory in Flint", "lake in Michigan's U.P. only"], "park island in the Detroit River", 2),
      q("The Guardian Building is a…", ["auto plant", "Art Deco skyscraper downtown", "stadium", "bridge to Canada only"], "Art Deco skyscraper downtown", 3),
      q("Campus Martius is a…", ["Ford's Rouge plant", "downtown park / square", "airport", "cemetery of the auto barons only"], "downtown park / square", 2),
      q("The Ambassador Bridge links Detroit to…", ["Toledo, Ohio", "Windsor, Ontario", "Cleveland, Ohio", "Sarnia, Ontario"], "Windsor, Ontario", 1),
      q("A tunnel also links Detroit to…", ["Toronto", "Windsor", "Buffalo", "Montreal"], "Windsor", 2),
      q("Dearborn is home to…", ["GM's only plant", "Ford's historic Rouge and The Henry Ford", "Motown's Hitsville", "the Lions' original Tiger Stadium"], "Ford's historic Rouge and The Henry Ford", 2),
      q("Hitsville U.S.A. is the…", ["Renaissance Center's main tower", "original Motown house on West Grand", "old Tiger Stadium at the Corner", "Art Deco Guardian Building"], "original Motown house on West Grand", 2),
      q("The QLine is a…", ["people-mover in the suburbs only", "streetcar on Woodward", "ferry to Belle Isle", "highway"], "streetcar on Woodward", 3),
      q("Woodward Avenue is Detroit's famous…", ["international border crossing to Ohio", "north-south corridor toward the suburbs", "only airport runway", "only a freeway with no street name"], "north-south corridor toward the suburbs", 2),
      q("Metrology on a Detroit-area auto line often leans on…", ["sonar depth soundings", "CMMs and gauge studies", "carbon-dating labs", "weather balloon logs"], "CMMs and gauge studies", 3),

    ],
    food: [
      q("Detroit-style pizza is…", ["thin, wide, and folded by the slice", "square, airy, and baked in a pan", "round, deep, and filled like a pie", "rolled into a cone and baked"], "square, airy, and baked in a pan", 1),
      q("A Coney dog in Detroit is a…", ["lobster roll in a buttered bun", "chili dog of the Greek-run Coney diners", "Italian beef dipped in its own jus", "Nashville hot chicken sandwich"], "chili dog of the Greek-run Coney diners", 1),
    ],
    arts: [
      q("The Motown sound is built on…", ["techno, synths, and drum machines", "pop, soul, and a house band (the Funk Brothers)", "punk and garage rock from the Grande Ballroom", "Delta blues and slide guitar"], "pop, soul, and a house band (the Funk Brothers)", 2),
      q("Detroit techno's early geography is…", ["Berlin's post-Wall club scene", "Detroit's Black electronic musicians", "Chicago's house-music DJs", "Kraftwerk's studio in Düsseldorf"], "Detroit's Black electronic musicians", 3),
    ],
    sports: [
      q("The Lions play downtown at…", ["Comerica as football", "Ford Field", "Little Caesars as football only", "the old Silverdome still"], "Ford Field", 1),
      q("The Tigers play at…", ["Ford Field", "Comerica Park", "Joe Louis Arena still", "the Palace of Auburn Hills still"], "Comerica Park", 1),
    ],
  },
la: {
    local: [
      q("Los Angeles is in which county of the same name, plus it sprawls into…", ["the Bay Area's peninsula counties", "a basin and valleys of Southern California", "the farm towns of the Central Valley", "the high desert around Death Valley"], "a basin and valleys of Southern California", 1),
      q("Hollywood is a…", ["separate city of Orange County", "district of Los Angeles", "neighborhood of Burbank", "part of Santa Monica only"], "district of Los Angeles", 1),
      q("The Hollywood Sign is mounted on…", ["Palos Verdes", "Mount Lee / the Hollywood Hills", "Catalina", "downtown's Bunker Hill only"], "Mount Lee / the Hollywood Hills", 2),
      q("Griffith Observatory looks over…", ["Catalina Island and the harbor", "the basin and the Hollywood Sign", "Palm Springs and the desert", "San Diego Bay and the Navy yards"], "the basin and the Hollywood Sign", 1),
      q("Wilshire Boulevard runs…", ["in a loop around the 405 freeway", "from downtown west to Santa Monica", "south through Orange County", "north–south across the Valley"], "from downtown west to Santa Monica", 2),
      q("Sunset Boulevard runs…", ["the length of Long Beach's shoreline", "from downtown through Hollywood to the coast", "as a freeway through Pasadena", "east from Hollywood to Palm Springs"], "from downtown through Hollywood to the coast", 2),
      q("The 405 is a…", ["subway line under Wilshire", "freeway through the Westside", "concrete-lined river channel", "main east–west LAX runway"], "freeway through the Westside", 1),
      q("Union Station is in…", ["Santa Monica", "downtown L.A.", "LAX's terminals", "Pasadena only"], "downtown L.A.", 1),
      q("LAX is Los Angeles's…", ["only port", "main airport", "city hall", "subway yard"], "main airport", 1),
      q("The Port of Los Angeles is at…", ["Santa Monica Pier", "San Pedro / Wilmington", "Malibu", "Burbank"], "San Pedro / Wilmington", 2),
      q("Venice Beach is known for a…", ["container port", "boardwalk and muscle beach", "observatory", "studio backlot only"], "boardwalk and muscle beach", 1),
      q("Angels Flight downtown is a…", ["people-mover tram at LAX", "tiny funicular on Bunker Hill", "light-rail line to Long Beach", "ferry from San Pedro to Catalina"], "tiny funicular on Bunker Hill", 3),
      q("Bunker Hill downtown was reshaped by…", ["oil derricks that still pump today", "office towers and cultural buildings", "a Spanish mission and its orchards", "a harbor dredged for cargo ships"], "office towers and cultural buildings", 3),
      q("The L.A. River is a…", ["year-round barge canal to the Midwest", "mostly channelized watercourse through the basin", "Great Lake", "tidal fjord"], "mostly channelized watercourse through the basin", 2),
      q("Aerospace-ops culture around LA/Long Beach includes…", ["surfboard shaping and surf contests", "spacecraft assembly and cleanroom work", "auto plants relocated from Detroit", "tarantula ranches along the 405"], "spacecraft assembly and cleanroom work", 3),

    ],
    food: [
      q("The French Dip's origin story is fought over by…", ["two stands in Austin", "Philippe's and Cole's in L.A.", "two shacks in New Orleans", "two carts in Portland"], "Philippe's and Cole's in L.A.", 3),
      q("A California burrito often includes…", ["kimchi", "fries", "spaghetti", "cole slaw"], "fries", 2),
      q("In-N-Out Burger was born in…", ["Fresno, in the Central Valley", "Baldwin Park, near Los Angeles", "San Diego, near the border", "Sacramento, the state capital"], "Baldwin Park, near Los Angeles", 2),
    ],
    arts: [
      q("The Getty Center campus sits in the…", ["river channel east of downtown", "foothills above Brentwood", "port district of Long Beach", "airport flats by LAX"], "foothills above Brentwood", 2),
      q("LACMA is on…", ["the Venice boardwalk", "Wilshire's Miracle Mile", "Catalina", "Pasadena's Rose Bowl"], "Wilshire's Miracle Mile", 2),
    ],
    sports: [
      q("SoFi Stadium is in…", ["downtown L.A.", "Inglewood", "Pasadena", "Anaheim"], "Inglewood", 2),
    ],
  }
};
