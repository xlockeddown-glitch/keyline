import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

export const CITY_EXTRA_PART_A: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
austin: {
    local: [
      q("Sixth Street is Austin's famous…", ["river dam", "entertainment strip", "airport runway", "capitol lawn"], "entertainment strip", 1),
      q("The Drag in Austin is along…", ["Congress Avenue downtown", "Guadalupe Street by UT", "South Lamar near Zilker", "Burnet Road up north"], "Guadalupe Street by UT", 2),
      q("Rainey Street is a…", ["museum and arts campus", "bungalow-bar district", "rail freight yard", "historic state cemetery"], "bungalow-bar district", 2),
      q("Zilker Park hosts…", ["South by Southwest's main indoor halls", "the Austin City Limits Music Festival", "the State Fair of Texas each autumn", "the Houston Livestock Show and Rodeo"], "the Austin City Limits Music Festival", 2),
      q("Mount Bonnell looks over…", ["the Gulf coast near Corpus Christi", "Lake Austin and the western hills", "the Red River on the Oklahoma line", "Caddo Lake in East Texas"], "Lake Austin and the western hills", 1),
      q("The University of Texas tower is a…", ["capitol dome", "main-building landmark on campus", "church steeple of a parish", "lighthouse"], "main-building landmark on campus", 1),
      q("I-35 through Austin roughly splits…", ["north from the river only", "east and west", "the lakes from the hills as a beltway", "the airport from the capitol as a river"], "east and west", 2),
      q("Barton Creek feeds…", ["Lady Bird Lake from the east only", "Barton Springs", "Lake Travis as a dam", "the Pedernales only"], "Barton Springs", 2),
      q("The Pennybacker is a…", ["restored rail depot downtown", "through-arch bridge on Loop 360", "granite gate at the Capitol", "flood-control dam on the Colorado"], "through-arch bridge on Loop 360", 2),
      q("Mueller is a…", ["nature preserve in the western canyons", "redeveloped airport site on the east side", "student housing district by UT's campus", "historic state cemetery on the east side"], "redeveloped airport site on the east side", 3),
      q("East Austin's historic core includes…", ["the hills of Westlake and Rollingwood", "the 11th and 12th Street corridors", "Lakeway's lakeside subdivisions", "the Bee Cave shopping corridor"], "the 11th and 12th Street corridors", 3),
      q("The Violet Crown is a nickname tied to Austin's…", ["capitol granite", "evening sky", "bat species", "football team"], "evening sky", 3),
    ],
    food: [
      q("Franklin Barbecue's line is famous for…", ["kolaches only", "brisket", "sushi", "cioppino"], "brisket", 1),
      q("A breakfast taco in Austin is often on a…", ["bagel only", "flour tortilla", "baguette", "lettuce wrap only"], "flour tortilla", 1),
      q("Torchy's is a local chain of…", ["brisket pits only", "taco shops", "donut shops only", "crawfish stands"], "taco shops", 2),
    ],
    arts: [
      q("ACL Live is a…", ["football stadium on the UT campus", "studio and theater on Willie Nelson Boulevard", "central public library by Shoal Creek", "county courthouse on Guadalupe Street"], "studio and theater on Willie Nelson Boulevard", 2),
      q("Willie Nelson is closely tied to which Texas city as a home base?", ["Amarillo", "Austin", "El Paso", "Beaumont"], "Austin", 1),
    ],
  },
chicago: {
    local: [
      q("The Loop is Chicago's…", ["lakefront beach only", "downtown core, named for the 'L'", "airport", "stockyard still operating"], "downtown core, named for the 'L'", 1),
      q("The 'L' is Chicago's…", ["commuter ferry on Lake Michigan", "elevated (and subway) rapid transit", "elevated highway around the Loop", "riverwalk of shops and cafés"], "elevated (and subway) rapid transit", 1),
      q("Lake Michigan is to Chicago's…", ["west", "east", "only south", "only north as a river"], "east", 1),
      q("The Chicago River was famously reversed to flow…", ["into Lake Superior via Wisconsin", "away from Lake Michigan", "into the Ohio River at Cairo", "east into Lake Erie"], "away from Lake Michigan", 2),
      q("Millennium Park's Cloud Gate is nicknamed…", ["the Spike", "the Bean", "the Arch", "the Onion"], "the Bean", 1),
      q("The Willis Tower was long called the…", ["Hancock only", "Sears Tower", "Tribune Tower only", "Marina City"], "Sears Tower", 1),
      q("Wrigley Field is in…", ["the Loop only", "the North Side", "Hyde Park only", "Midway"], "the North Side", 1),
      q("Guaranteed Rate / Sox Park is on the…", ["North Side", "South Side", "in Evanston", "in Gary"], "South Side", 2),
      q("Navy Pier juts into…", ["the Chicago River", "Lake Michigan", "the Sanitary Canal only", "Lake Superior"], "Lake Michigan", 1),
      q("The Magnificent Mile is along…", ["State Street only", "Michigan Avenue", "Lake Shore Drive's whole length as a shopping mall", "Halsted only"], "Michigan Avenue", 2),
      q("Hyde Park is home to the…", ["O'Hare airport terminals", "University of Chicago", "Wrigley Field ballpark", "Northwestern University campus"], "University of Chicago", 2),
      q("The Art Institute sits on…", ["the far South Side only", "Michigan Avenue downtown", "O'Hare", "Navy Pier"], "Michigan Avenue downtown", 1),
    ],
    food: [
      q("Chicago deep-dish is a…", ["thin New York slice", "tall, buttery-crust pizza", "Detroit pan", "a hot dog"], "tall, buttery-crust pizza", 1),
      q("A Chicago hot dog is not to be…", ["served on a poppy-seed bun", "topped with ketchup", "topped with sport peppers", "topped with a pickle spear"], "topped with ketchup", 2),
      q("Italian beef is a Chicago…", ["sausage topping for deep-dish pizza", "thin-sliced roast-beef sandwich, often dipped", "hot dog dragged through the garden", "smoked rib-tip platter from the South Side"], "thin-sliced roast-beef sandwich, often dipped", 1),
    ],
    arts: [
      q("Second City is a…", ["opera house on Wacker Drive", "comedy theater / school", "football club in the suburbs", "tabloid daily newspaper"], "comedy theater / school", 2),
      q("The Chicago Symphony plays in…", ["Wrigley", "Orchestra Hall", "the Bean as a hall", "O'Hare Terminal 5"], "Orchestra Hall", 2),
    ],
  },
toronto: {
    local: [
      q("The CN Tower was built as a…", ["domed stadium for the Blue Jays", "communications and observation tower", "shopping mall and office tower", "home for Ontario's parliament"], "communications and observation tower", 1),
      q("The PATH is Toronto's…", ["downtown subway loop", "downtown underground walkway", "airport rail link to Pearson", "ferry service to Niagara"], "downtown underground walkway", 2),
      q("Yonge Street is a…", ["subway maintenance yard", "long north–south main street", "lakeshore drive in Muskoka", "east–west highway in Ottawa"], "long north–south main street", 2),
      q("Queen's Park is the site of…", ["Parliament in Ottawa", "Ontario's legislature", "the CN Tower", "Casa Loma only"], "Ontario's legislature", 2),
      q("Casa Loma is a…", ["subway station only", "hilltop mansion / castle folly", "ballpark", "island airport terminal"], "hilltop mansion / castle folly", 2),
      q("The Distillery District is a…", ["financial district of glass bank towers", "Victorian distillery turned arts quarter", "university campus in Waterloo", "working port on Hamilton harbour"], "Victorian distillery turned arts quarter", 2),
      q("Toronto Islands lie in…", ["Lake Superior near Thunder Bay", "Lake Ontario, south of downtown", "Georgian Bay, off Lake Huron", "the Ottawa River, by Parliament"], "Lake Ontario, south of downtown", 1),
      q("Billy Bishop is an…", ["only Pearson", "island airport downtown", "union station", "ferry to Rochester"], "island airport downtown", 2),
      q("Pearson is Toronto's…", ["island downtown strip", "main international airport", "union station", "CN Tower elevator"], "main international airport", 1),
      q("Union Station is the…", ["city hall and civic square", "main intercity and GO rail hub downtown", "convention centre by the CN Tower", "aquarium beside the CN Tower"], "main intercity and GO rail hub downtown", 1),
      q("St. Lawrence Market is a…", ["domed stadium on the waterfront", "historic market downtown", "university campus downtown", "island park in the harbour"], "historic market downtown", 2),
    ],
    food: [
      q("A peameal bacon sandwich is a…", ["Montreal smoked meat", "Toronto St. Lawrence classic", "poutine of Quebec", "beaver tail"], "Toronto St. Lawrence classic", 2),
      q("Toronto's Chinatown and Kensington are…", ["Mississauga suburban districts", "adjacent downtown market districts", "Ottawa's market neighbourhoods", "Niagara Falls tourist strips"], "adjacent downtown market districts", 2),
    ],
    sports: [
      q("The Maple Leafs play hockey at…", ["Rogers Centre as hockey only", "Scotiabank Arena", "BMO Field", "the Gardens still"], "Scotiabank Arena", 1),
      q("The Blue Jays play at…", ["Scotiabank Arena", "Rogers Centre", "BMO Field", "Tim Hortons Field in Hamilton"], "Rogers Centre", 1),
    ],
    arts: [
      q("TIFF is a…", ["fashion week only", "film festival", "food fair only", "marathon"], "film festival", 1),
    ],
  },
boston: {
    local: [
      q("The Freedom Trail is a…", ["subway only", "walking line of Revolutionary sites", "highway to New York", "ferry to Provincetown only"], "walking line of Revolutionary sites", 1),
      q("Beacon Hill is known especially for…", ["the airport", "brick rows and the State House", "Fenway", "the harbor islands only"], "brick rows and the State House", 1),
      q("The Charles River in Boston faces…", ["Salem", "Cambridge (and others)", "Providence", "Worcester downtown"], "Cambridge (and others)", 1),
      q("The T is Boston's…", ["minor-league baseball team", "transit system (MBTA)", "university in the Fenway", "daily newspaper (the Globe)"], "transit system (MBTA)", 1),
      q("The Green Monster is a…", ["subway line", "left-field wall at Fenway", "harbor fort", "hill in Brookline only"], "left-field wall at Fenway", 1),
      q("Faneuil Hall is a…", ["ballpark near Kenmore Square", "meeting hall and market landmark", "university chapel in Cambridge", "airport terminal in East Boston"], "meeting hall and market landmark", 1),
      q("The North End is Boston's historic…", ["Chinatown", "Italian neighborhood", "waterfront tech district", "Victorian brownstone district"], "Italian neighborhood", 2),
      q("Back Bay's streets are…", ["numbered avenues like Manhattan's grid", "alphabetical (Arlington, Berkeley, Clarendon…)", "named for U.S. presidents in order", "old cow paths with no plan at all"], "alphabetical (Arlington, Berkeley, Clarendon…)", 3),
      q("The Public Garden is next to the…", ["Fenway Park as a garden", "Boston Common", "Logan terminals", "Harvard Yard as a Boston park of this name"], "Boston Common", 1),
      q("Logan Airport sits in…", ["Cambridge", "East Boston", "Brookline", "Somerville"], "East Boston", 2),
      q("The Ted Williams Tunnel is part of the…", ["Green Monster", "Big Dig", "Freedom Trail as a tunnel", "T's Red Line"], "Big Dig", 2),
      q("Harvard is in…", ["Boston proper", "Cambridge", "Somerville", "Brookline"], "Cambridge", 1),
      q("MIT is in…", ["Boston's Back Bay", "Cambridge", "Quincy", "Salem"], "Cambridge", 1),
      q("The State House's dome is famously…", ["granite raw", "gilded", "glass", "thatch"], "gilded", 2),
    ],
    food: [
      q("Boston cream pie is a…", ["deep-dish apple pie with a lattice", "custard cake with chocolate glaze", "whoopie pie with marshmallow filling", "ricotta-filled cannoli"], "custard cake with chocolate glaze", 1),
      q("A lobster roll in New England is often…", ["a deep-dish pizza", "warm butter or mayo on a split-top bun", "a Coney dog", "a po' boy of roast beef only"], "warm butter or mayo on a split-top bun", 1),
      q("Clam chowder in Boston is typically…", ["red Manhattan", "cream-based (New England)", "clear Rhode Island", "tomato only"], "cream-based (New England)", 1),
    ],
    arts: [
      q("The Boston Symphony plays in…", ["Fenway", "Symphony Hall", "Faneuil as a concert hall of this name", "the State House"], "Symphony Hall", 1),
      q("The MFA is the…", ["Isabella Stewart Gardner", "Museum of Fine Arts, Boston", "Harvard's Fogg", "the ICA"], "Museum of Fine Arts, Boston", 2),
    ],
    sports: [
      q("The Celtics play at…", ["Fenway", "TD Garden", "Gillette", "Harvard Stadium"], "TD Garden", 1),
      q("The Bruins play at…", ["Fenway", "TD Garden", "Gillette", "Agganis Arena"], "TD Garden", 1),
    ],
  }
};
