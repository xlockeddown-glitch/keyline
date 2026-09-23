import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

export const CITY_EXTRA_PART_A: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
austin: {
    local: [
      q("Sixth Street is Austin's famous…", ["river dam", "entertainment strip", "airport runway", "capitol lawn"], "entertainment strip", 1),
      q("The Drag in Austin is along…", ["Congress Avenue only", "Guadalupe Street by UT", "MoPac only", "Burnet Road only"], "Guadalupe Street by UT", 2),
      q("Rainey Street is a…", ["museum campus", "bungalow-bar district", "airport", "cemetery"], "bungalow-bar district", 2),
      q("Zilker Park hosts…", ["SXSW's only indoor halls", "the Austin City Limits Music Festival (among other things)", "the Texas State Fair as its main home", "the Houston Rodeo"], "the Austin City Limits Music Festival (among other things)", 2),
      q("Mount Bonnell looks over…", ["the Gulf", "Lake Austin / the western hills", "the Red River", "Caddo Lake"], "Lake Austin / the western hills", 1),
      q("The University of Texas tower is a…", ["capitol dome", "main-building landmark on campus", "church steeple of a parish", "lighthouse"], "main-building landmark on campus", 1),
      q("I-35 through Austin roughly splits…", ["north from the river only", "east and west", "the lakes from the hills as a beltway", "the airport from the capitol as a river"], "east and west", 2),
      q("Barton Creek feeds…", ["Lady Bird Lake from the east only", "Barton Springs", "Lake Travis as a dam", "the Pedernales only"], "Barton Springs", 2),
      q("The Pennybacker is a…", ["rail depot", "through-arch bridge on Loop 360", "capitol gate", "dam"], "through-arch bridge on Loop 360", 2),
      q("Mueller is a…", ["west-lake canyon", "redeveloped airport site on the east side", "UT dorm only", "state cemetery"], "redeveloped airport site on the east side", 3),
      q("East Austin's historic core includes…", ["Westlake hills only", "the 11th and 12th Street corridors", "Lakeway", "Bee Cave"], "the 11th and 12th Street corridors", 3),
      q("The Violet Crown is a nickname tied to Austin's…", ["capitol granite", "evening sky", "bat species", "football team"], "evening sky", 3),
    ],
    food: [
      q("Franklin Barbecue's line is famous for…", ["kolaches only", "brisket", "sushi", "cioppino"], "brisket", 1),
      q("A breakfast taco in Austin is often on a…", ["bagel only", "flour tortilla", "baguette", "lettuce wrap only"], "flour tortilla", 1),
      q("Torchy's is a local chain of…", ["brisket pits only", "taco shops", "donut shops only", "crawfish stands"], "taco shops", 2),
    ],
    arts: [
      q("ACL Live is a…", ["football stadium", "studio and theater on Willie Nelson Boulevard", "library", "courthouse"], "studio and theater on Willie Nelson Boulevard", 2),
      q("Willie Nelson is closely tied to which Texas city as a home base?", ["Amarillo", "Austin", "El Paso", "Beaumont"], "Austin", 1),
    ],
  },
chicago: {
    local: [
      q("The Loop is Chicago's…", ["lakefront beach only", "downtown core, named for the 'L'", "airport", "stockyard still operating"], "downtown core, named for the 'L'", 1),
      q("The 'L' is Chicago's…", ["commuter ferry", "elevated (and subway) rapid transit", "highway only", "riverwalk only"], "elevated (and subway) rapid transit", 1),
      q("Lake Michigan is to Chicago's…", ["west", "east", "only south", "only north as a river"], "east", 1),
      q("The Chicago River was famously reversed to flow…", ["into Lake Superior", "away from the lake (toward the Mississippi system)", "into the Ohio", "into the Gulf at Chicago"], "away from the lake (toward the Mississippi system)", 2),
      q("Millennium Park's Cloud Gate is nicknamed…", ["the Spike", "the Bean", "the Arch", "the Onion"], "the Bean", 1),
      q("The Willis Tower was long called the…", ["Hancock only", "Sears Tower", "Tribune Tower only", "Marina City"], "Sears Tower", 1),
      q("Wrigley Field is in…", ["the Loop only", "the North Side", "Hyde Park only", "Midway"], "the North Side", 1),
      q("Guaranteed Rate / Sox Park is on the…", ["North Side", "South Side", "in Evanston", "in Gary"], "South Side", 2),
      q("Navy Pier juts into…", ["the Chicago River", "Lake Michigan", "the Sanitary Canal only", "Lake Superior"], "Lake Michigan", 1),
      q("The Magnificent Mile is along…", ["State Street only", "Michigan Avenue", "Lake Shore Drive's whole length as a shopping mall", "Halsted only"], "Michigan Avenue", 2),
      q("Hyde Park is home to the…", ["only O'Hare", "University of Chicago (and the Museum of Science and Industry nearby)", "only Wrigley", "only Midway's terminals"], "University of Chicago (and the Museum of Science and Industry nearby)", 2),
      q("The Art Institute sits on…", ["the far South Side only", "Michigan Avenue downtown", "O'Hare", "Navy Pier"], "Michigan Avenue downtown", 1),
    ],
    food: [
      q("Chicago deep-dish is a…", ["thin New York slice", "tall, buttery-crust pizza", "Detroit pan", "a hot dog"], "tall, buttery-crust pizza", 1),
      q("A Chicago hot dog is not to be…", ["put in a bun", "ketchup'd (in the local commandment)", "given sport peppers", "given pickle"], "ketchup'd (in the local commandment)", 2),
      q("Italian beef is a Chicago…", ["deep-dish topping only", "thin-sliced roast-beef sandwich, often dipped", "hot dog", "rib tip only"], "thin-sliced roast-beef sandwich, often dipped", 1),
    ],
    arts: [
      q("Second City is a…", ["opera house only", "comedy theater / school", "football club", "newspaper only"], "comedy theater / school", 2),
      q("The Chicago Symphony plays in…", ["Wrigley", "Orchestra Hall", "the Bean as a hall", "O'Hare Terminal 5"], "Orchestra Hall", 2),
    ],
  },
toronto: {
    local: [
      q("The CN Tower was built as a…", ["only a stadium", "communications and observation tower", "only a mall", "parliament"], "communications and observation tower", 1),
      q("Toronto sits on which Great Lake?", ["Superior", "Michigan", "Huron", "Ontario"], "Ontario", 1),
      q("The PATH is Toronto's…", ["subway", "downtown underground walkway", "airport code", "ferry to Niagara"], "downtown underground walkway", 2),
      q("Yonge Street is a…", ["only a subway yard", "long north–south artery (and a historic length boast)", "only a lake shore of Muskoka", "only a highway in Ottawa"], "long north–south artery (and a historic length boast)", 2),
      q("Queen's Park is the site of…", ["Parliament in Ottawa", "Ontario's legislature", "the CN Tower", "Casa Loma only"], "Ontario's legislature", 2),
      q("Casa Loma is a…", ["subway station only", "hilltop mansion / castle folly", "ballpark", "island airport terminal"], "hilltop mansion / castle folly", 2),
      q("The Distillery District is a…", ["financial tower cluster only", "Victorian industrial precinct turned arts and shops", "university campus of Waterloo", "port of Hamilton"], "Victorian industrial precinct turned arts and shops", 2),
      q("Toronto Islands lie in…", ["Lake Superior", "Lake Ontario, south of downtown", "Georgian Bay only", "the Ottawa River"], "Lake Ontario, south of downtown", 1),
      q("Billy Bishop is an…", ["only Pearson", "island airport downtown", "union station", "ferry to Rochester"], "island airport downtown", 2),
      q("Pearson is Toronto's…", ["island downtown strip", "main international airport", "union station", "CN Tower elevator"], "main international airport", 1),
      q("Union Station is the…", ["city hall", "main intercity and GO rail hub downtown", "CN Tower", "aquarium only"], "main intercity and GO rail hub downtown", 1),
      q("St. Lawrence Market is a…", ["stadium", "historic market downtown", "university", "island"], "historic market downtown", 2),
    ],
    food: [
      q("A peameal bacon sandwich is a…", ["Montreal smoked meat", "Toronto St. Lawrence classic", "poutine of Quebec", "beaver tail"], "Toronto St. Lawrence classic", 2),
      q("Toronto's Chinatown and Kensington are…", ["only suburbs of Mississauga as these names", "adjacent downtown food and shop districts", "only Ottawa", "only Niagara"], "adjacent downtown food and shop districts", 2),
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
      q("The T is Boston's…", ["baseball team", "transit system (MBTA)", "university", "newspaper"], "transit system (MBTA)", 1),
      q("The Green Monster is a…", ["subway line", "left-field wall at Fenway", "harbor fort", "hill in Brookline only"], "left-field wall at Fenway", 1),
      q("Faneuil Hall is a…", ["ballpark", "meeting hall and market landmark", "university chapel only", "airport"], "meeting hall and market landmark", 1),
      q("The North End is Boston's historic…", ["Chinatown", "Italian district (among older layers)", "only the Seaport", "only Back Bay"], "Italian district (among older layers)", 2),
      q("Back Bay's streets are…", ["numbered like Manhattan only", "alphabetical from the Public Garden out (Arlington, Berkeley…)", "only alleys of the North End", "a cow-path with no plan"], "alphabetical from the Public Garden out (Arlington, Berkeley…)", 3),
      q("The Public Garden is next to the…", ["Fenway Park as a garden", "Boston Common", "Logan terminals", "Harvard Yard as a Boston park of this name"], "Boston Common", 1),
      q("Logan Airport sits in…", ["Cambridge", "East Boston", "Brookline", "Somerville"], "East Boston", 2),
      q("The Ted Williams Tunnel is part of the…", ["Green Monster", "Big Dig", "Freedom Trail as a tunnel", "T's Red Line"], "Big Dig", 2),
      q("Harvard is in…", ["Boston proper", "Cambridge", "Somerville", "Brookline"], "Cambridge", 1),
      q("MIT is in…", ["Boston's Back Bay", "Cambridge", "Quincy", "Salem"], "Cambridge", 1),
      q("The State House's dome is famously…", ["granite raw", "gilded", "glass", "thatch"], "gilded", 2),
    ],
    food: [
      q("Boston cream pie is a…", ["apple pie", "custard cake with chocolate glaze", "whoopie pie", "cannoli"], "custard cake with chocolate glaze", 1),
      q("A lobster roll in New England is often…", ["a deep-dish pizza", "warm butter or mayo on a split-top bun", "a Coney dog", "a po' boy of roast beef only"], "warm butter or mayo on a split-top bun", 1),
      q("Clam chowder in Boston is typically…", ["red Manhattan", "cream-based (New England)", "clear Rhode Island", "tomato only"], "cream-based (New England)", 1),
    ],
    arts: [
      q("The Boston Symphony plays in…", ["Fenway", "Symphony Hall", "Faneuil as a concert hall of this name", "the State House"], "Symphony Hall", 1),
      q("The MFA is the…", ["only Isabella Stewart Gardner", "Museum of Fine Arts, Boston", "only Harvard's Fogg", "only the ICA"], "Museum of Fine Arts, Boston", 2),
    ],
    sports: [
      q("The Celtics play at…", ["Fenway", "TD Garden", "Gillette", "Harvard Stadium"], "TD Garden", 1),
      q("The Bruins play at…", ["Fenway", "TD Garden", "Gillette", "Agganis Arena"], "TD Garden", 1),
    ],
  }
};
