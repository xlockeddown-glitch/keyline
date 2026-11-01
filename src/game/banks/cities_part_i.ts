import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Red-tier Local fill (Keyline 0.1.101 batch 2; ~25% of hard city cards derive red): hard (diff 3) Local cards so every city reaches 30 red Local cards
 * for placed (Hearth) lanterns. Reason: Local was the only field under 30 red in all 15 cities (poolCensus, main 06e8c05).
 * No math (math is capped). Each card is sourced from the Wikipedia article on its subject (URL above each card).
 * Merged into CITY_EXTRA by cities.ts (rarity stamped there with the city nudge).
 */
export const CITY_EXTRA_PART_I: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  detroit: {
    local: [
      // https://en.wikipedia.org/wiki/Elmwood_Cemetery_(Detroit)
      q("Detroit's Elmwood Cemetery was dedicated in what year?", ["1846", "1872", "1821", "1859"], "1846", 3),
      // https://en.wikipedia.org/wiki/Woodlawn_Cemetery_(Detroit)
      q("Detroit's Woodlawn Cemetery was established in what year?", ["1895", "1846", "1921", "1868"], "1895", 3),
      // https://en.wikipedia.org/wiki/Woodlawn_Cemetery_(Detroit)
      q("Which 'People's Poet' is buried in Detroit's Woodlawn Cemetery?", ["Edgar Albert Guest", "Carl Sandburg Jr.", "James Whitcomb Riley", "Joyce Kilmer Hart"], "Edgar Albert Guest", 3),
      // https://en.wikipedia.org/wiki/Woodlawn_Cemetery_(Detroit)
      q("Detroit's Woodlawn Cemetery lies on which avenue?", ["Woodward Avenue", "Gratiot Avenue", "Jefferson Avenue", "Michigan Avenue"], "Woodward Avenue", 3),
      // https://en.wikipedia.org/wiki/Mount_Elliott_Cemetery
      q("Detroit's Mount Elliott Cemetery, est. 1841, is affiliated with which faith?", ["Catholic", "Lutheran", "Jewish", "Methodist"], "Catholic", 3),
      // https://en.wikipedia.org/wiki/Mount_Elliott_Cemetery
      q("Detroit's Lafayette Street Cemetery, est. 1850, served which faith?", ["Jewish", "Catholic", "Quaker", "Baptist"], "Jewish", 3),
      // https://en.wikipedia.org/wiki/Fort_Wayne_(Detroit)
      q("Detroit's Fort Wayne stands in which neighborhood?", ["Delray", "Corktown", "Brightmoor", "Poletown"], "Delray", 3),
      // https://en.wikipedia.org/wiki/Fort_Wayne_(Detroit)
      q("Detroit's Fort Wayne sits at the foot of which avenue?", ["Livernois Avenue", "Gratiot Avenue", "Van Dyke Avenue", "Conner Avenue"], "Livernois Avenue", 3),
      // https://en.wikipedia.org/wiki/Fort_Wayne_(Detroit)
      q("The original star fort at Detroit's Fort Wayne dates from…", ["1845", "1812", "1871", "1798"], "1845", 3),
      // https://en.wikipedia.org/wiki/Fisher_Building
      q("Detroit's Fisher Building was funded by the sale of Fisher Body to…", ["General Motors", "Ford Motor Company", "Chrysler Corporation", "Packard Motor Car"], "General Motors", 3),
      // https://en.wikipedia.org/wiki/Fisher_Building
      q("Detroit's Fisher Building sits on which boulevard?", ["West Grand Boulevard", "East Jefferson Boulevard", "Washington Boulevard", "Outer Drive Boulevard"], "West Grand Boulevard", 3),
      // https://en.wikipedia.org/wiki/Fisher_Building
      q("Detroit's Fisher Building stands in which district?", ["New Center", "Corktown", "Midtown", "Eastern Market"], "New Center", 3),
      // https://en.wikipedia.org/wiki/Penobscot_Building
      q("How many stories does Detroit's Greater Penobscot Building have?", ["45", "38", "52", "31"], "45", 3),
      // https://en.wikipedia.org/wiki/Penobscot_Building
      q("Detroit's Penobscot Building was the state's tallest until 1977, topped by…", ["the Renaissance Center", "the Guardian Building", "the Book Tower", "One Detroit Center"], "the Renaissance Center", 3),
      // https://en.wikipedia.org/wiki/Buhl_Building
      q("Who designed Detroit's 29-story Buhl Building?", ["Wirt C. Rowland", "Albert Kahn", "Louis Kamper", "C. Howard Crane"], "Wirt C. Rowland", 3),
      // https://en.wikipedia.org/wiki/Buhl_Building
      q("Detroit's Buhl Building stands atop a buried creek named…", ["Savoyard Creek", "Conner Creek", "Parent Creek", "May Creek"], "Savoyard Creek", 3),
      // https://en.wikipedia.org/wiki/Book_Tower
      q("Who designed Detroit's Book Tower?", ["Louis Kamper", "Albert Kahn", "Wirt C. Rowland", "Minoru Yamasaki"], "Louis Kamper", 3),
      // https://en.wikipedia.org/wiki/Book_Tower
      q("Detroit's Book Tower is designed in which style?", ["Italian Renaissance", "Romanesque Revival", "Chicago School style", "Beaux-Arts Classical"], "Italian Renaissance", 3),
      // https://en.wikipedia.org/wiki/David_Whitney_Building
      q("David Whitney Jr., namesake of a Detroit tower, made his fortune in…", ["lumber", "railroads", "copper", "tobacco"], "lumber", 3),
      // https://en.wikipedia.org/wiki/David_Whitney_Building
      q("Construction on Detroit's David Whitney Building began in…", ["1914", "1928", "1901", "1922"], "1914", 3),
      // https://en.wikipedia.org/wiki/Orchestra_Hall_(Detroit)
      q("Which conductor demanded Detroit's orchestra build Orchestra Hall?", ["Ossip Gabrilowitsch", "Leopold Stokowski", "Sergei Koussevitzky", "Walter J. Damrosch"], "Ossip Gabrilowitsch", 3),
      // https://en.wikipedia.org/wiki/Music_Hall_Center_for_the_Performing_Arts
      q("Detroit's Music Hall opened in 1928 under what name?", ["Wilson Theatre", "Dodge Theatre", "Madison Theatre", "Crane Theatre"], "Wilson Theatre", 3),
      // https://en.wikipedia.org/wiki/Music_Hall_Center_for_the_Performing_Arts
      q("Which widow built Detroit's Music Hall, then called Wilson Theatre?", ["Matilda Dodge Wilson", "Clara Bryant Ford", "Eleanor Clay Ford", "Anna Thomson Dodge"], "Matilda Dodge Wilson", 3),
      // https://en.wikipedia.org/wiki/Detroit_Opera_House
      q("Detroit Opera House opened in what year?", ["1922", "1908", "1935", "1896"], "1922", 3),
      // https://en.wikipedia.org/wiki/Detroit_Opera_House
      q("Which architect originally designed the Detroit Opera House?", ["C. Howard Crane", "Louis Kamper", "Albert Kahn", "Wirt C. Rowland"], "C. Howard Crane", 3),
      // https://en.wikipedia.org/wiki/Michigan_Central_Station
      q("Michigan Central Station in Detroit was formally dedicated in…", ["1914", "1922", "1906", "1929"], "1914", 3),
      // https://en.wikipedia.org/wiki/Michigan_Central_Station
      q("Amtrak left Detroit's Michigan Central Station in what year?", ["1988", "1975", "1996", "1981"], "1988", 3),
      // https://en.wikipedia.org/wiki/Dossin_Great_Lakes_Museum
      q("Detroit's Dossin museum displays the bow anchor of which wreck?", ["SS Edmund Fitzgerald", "SS Carl D. Bradley", "SS Daniel J. Morrell", "SS Cedarville Ore"], "SS Edmund Fitzgerald", 3),
      // https://en.wikipedia.org/wiki/Dossin_Great_Lakes_Museum
      q("The Dossin Great Lakes Museum sits on which Detroit island?", ["Belle Isle", "Grosse Ile", "Fighting Island", "Peche Island"], "Belle Isle", 3),
      // https://en.wikipedia.org/wiki/Belle_Isle_Aquarium
      q("Detroit's Belle Isle Aquarium first opened in what year?", ["1904", "1923", "1889", "1912"], "1904", 3),
      // https://en.wikipedia.org/wiki/Belle_Isle_Aquarium
      q("Detroit's Belle Isle Aquarium reopened in 2012 after closing in…", ["2005", "1998", "2009", "2001"], "2005", 3),
      // https://en.wikipedia.org/wiki/Anna_Scripps_Whitcomb_Conservatory
      q("Detroit's Belle Isle Conservatory is officially named for…", ["Anna Scripps Whitcomb", "Clara Bryant Ford", "Matilda Dodge Wilson", "Eleanor Clay Ford"], "Anna Scripps Whitcomb", 3),
      // https://en.wikipedia.org/wiki/William_Livingstone_Memorial_Light
      q("Detroit's Livingstone lighthouse is the only US lighthouse made of…", ["marble", "granite", "cast iron", "limestone"], "marble", 3),
      // https://en.wikipedia.org/wiki/William_Livingstone_Memorial_Light
      q("Who designed Detroit's Livingstone Memorial Light on Belle Isle?", ["Géza Maróti", "Carl Milles", "Corrado Parducci", "Lee Lawrie"], "Géza Maróti", 3),
      // https://en.wikipedia.org/wiki/William_Livingstone_Memorial_Light
      q("Detroit's Livingstone Memorial Light faces which lake?", ["Lake St. Clair", "Lake Erie", "Lake Huron", "Lake Ontario"], "Lake St. Clair", 3),
      // https://en.wikipedia.org/wiki/Heidelberg_Project
      q("Which artist created Detroit's Heidelberg Project?", ["Tyree Guyton", "Kehinde Wiley", "Charles McGee", "Mario Moore"], "Tyree Guyton", 3),
      // https://en.wikipedia.org/wiki/Heidelberg_Project
      q("Detroit's Heidelberg Project was begun in what year?", ["1986", "1974", "1993", "1969"], "1986", 3),
      // https://en.wikipedia.org/wiki/Ford_Piquette_Avenue_Plant
      q("Which car was first produced at Detroit's Piquette Avenue Plant?", ["Model T", "Model A", "Model K", "Model N"], "Model T", 3),
      // https://en.wikipedia.org/wiki/Ford_Piquette_Avenue_Plant
      q("The Ford Piquette Avenue Plant sits in which Detroit area?", ["Milwaukee Junction", "Lafayette Park area", "Brush Park district", "Woodbridge area"], "Milwaukee Junction", 3),
      // https://en.wikipedia.org/wiki/Highland_Park_Ford_Plant
      q("Which firm designed Ford's Highland Park Plant near Detroit?", ["Albert Kahn Associates", "Smith, Hinchman & Grylls", "Graham, Burnham & Company", "Donaldson and Meier"], "Albert Kahn Associates", 3),
      // https://en.wikipedia.org/wiki/Packard_Automotive_Plant
      q("Detroit's Packard plant later built cars for which merged firm?", ["Studebaker-Packard", "Nash-Packard", "Hudson-Packard", "American Motors"], "Studebaker-Packard", 3),
      // https://en.wikipedia.org/wiki/Indian_Village,_Detroit
      q("Which street is NOT one of Detroit's Indian Village streets?", ["Cherokee", "Burns", "Iroquois", "Seminole"], "Cherokee", 3),
      // https://en.wikipedia.org/wiki/Palmer_Park_(Detroit)
      q("Senator Thomas Palmer donated Detroit's Palmer Park land in…", ["1893", "1871", "1907", "1885"], "1893", 3),
      // https://en.wikipedia.org/wiki/Huntington_Place
      q("Detroit's Huntington Place was first named for which mayor?", ["Albert Cobo", "Coleman Young", "Frank Murphy", "Hazen Pingree"], "Albert Cobo", 3),
      // https://en.wikipedia.org/wiki/Huntington_Place
      q("Since 1965 Detroit's Cobo/Huntington center has hosted which show?", ["the auto show", "the boat show", "the home show", "the flower show"], "the auto show", 3),
      // https://en.wikipedia.org/wiki/Joe_Louis_Arena
      q("Detroit's Joe Louis Arena replaced which older arena?", ["Olympia Stadium", "Cobo Arena", "Tiger Stadium", "The Palace"], "Olympia Stadium", 3),
      // https://en.wikipedia.org/wiki/Joe_Louis_Arena
      q("Detroit's Joe Louis Arena was completed in what year?", ["1979", "1967", "1986", "1972"], "1979", 3),
      // https://en.wikipedia.org/wiki/Olympia_Stadium
      q("What was the nickname of Detroit's Olympia Stadium?", ["The Old Red Barn", "The Big Brick Box", "The Ice Palace", "The Old Gray Lady"], "The Old Red Barn", 3),
      // https://en.wikipedia.org/wiki/Olympia_Stadium
      q("Detroit's Olympia Stadium stood at Grand River Ave and which street?", ["McGraw Street", "Trumbull Street", "Dexter Street", "Linwood Street"], "McGraw Street", 3),
      // https://en.wikipedia.org/wiki/Mariners%27_Church
      q("Detroit's Mariners' Church was founded in what year?", ["1842", "1861", "1825", "1879"], "1842", 3),
      // https://en.wikipedia.org/wiki/Mariners%27_Church
      q("Detroit's Mariners' Church stands on which avenue?", ["East Jefferson Avenue", "Woodward Avenue", "Gratiot Avenue", "Michigan Avenue"], "East Jefferson Avenue", 3),
      // https://en.wikipedia.org/wiki/Cathedral_of_the_Most_Blessed_Sacrament_(Detroit)
      q("Detroit's Most Blessed Sacrament cathedral was dedicated in…", ["1930", "1905", "1915", "1948"], "1930", 3),
      // https://en.wikipedia.org/wiki/Second_Baptist_Church_(Detroit)
      q("Detroit's Second Baptist Church was organized in 1836 by how many ex-slaves?", ["13", "7", "21", "40"], "13", 3),
      // https://en.wikipedia.org/wiki/Second_Baptist_Church_(Detroit)
      q("Detroit's Second Baptist Church stands on which street?", ["Monroe Street", "Fort Street", "Brush Street", "Beaubien Street"], "Monroe Street", 3),
      // https://en.wikipedia.org/wiki/Fox_Theatre_(Detroit)
      q("The area around Detroit's Fox Theatre is nicknamed…", ["Foxtown", "Crane Row", "Woodward Rows", "Theatreland"], "Foxtown", 3),
      // https://en.wikipedia.org/wiki/Detroit_Free_Press
      q("The Detroit Free Press motto begins 'On Guard for…'?", ["195 Years", "100 Years", "All Time", "Detroit Always"], "195 Years", 3),
      // https://en.wikipedia.org/wiki/Detroit_Free_Press
      q("The Detroit Free Press was co-founded by John R. Williams and…", ["Joseph Campau", "Lewis Cass", "Antoine Cadillac", "Gabriel Richard"], "Joseph Campau", 3),
      // https://en.wikipedia.org/wiki/Vernors
      q("Detroit's Vernors is a ginger ale flavored notably with…", ["vanilla", "cherry", "lemon", "cinnamon"], "vanilla", 3),
      // https://en.wikipedia.org/wiki/Vernors
      q("Vernors was first served by Detroit pharmacist James Vernor in…", ["1866", "1891", "1903", "1879"], "1866", 3),
      // https://en.wikipedia.org/wiki/Faygo
      q("Detroit's Faygo was founded in 1907 by which brothers?", ["Ben and Perry Feigenson", "Joe and Sam Stroh", "Cross and Peter Moceri", "Will and Jim Vernor"], "Ben and Perry Feigenson", 3),
      // https://en.wikipedia.org/wiki/Better_Made
      q("Detroit's Better Made chip plant stands on which avenue?", ["Gratiot Avenue", "Woodward Avenue", "Michigan Avenue", "Grand River Avenue"], "Gratiot Avenue", 3),
      // https://en.wikipedia.org/wiki/Better_Made
      q("Detroit's Better Made chips were founded in what year?", ["1930", "1946", "1919", "1955"], "1930", 3),
      // https://en.wikipedia.org/wiki/Hudson%27s
      q("Detroit's Hudson's flagship store was demolished in…", ["1998", "1983", "2004", "1991"], "1998", 3),
      // https://en.wikipedia.org/wiki/Hudson%27s
      q("What was the middle name of Detroit store founder J. L. Hudson?", ["Lowthian", "Lane", "Larned", "Lowell"], "Lowthian", 3),
      // https://en.wikipedia.org/wiki/Greektown_Historic_District
      q("Detroit's Greektown runs along which avenue?", ["Monroe Avenue", "Gratiot Avenue", "Jefferson Avenue", "Woodward Avenue"], "Monroe Avenue", 3),
      // https://en.wikipedia.org/wiki/Eastern_Market,_Detroit
      q("Detroit's Eastern Market is bordered by I-75, also called the…", ["Chrysler Freeway", "Lodge Freeway", "Ford Freeway", "Fisher Freeway"], "Chrysler Freeway", 3),
      // https://en.wikipedia.org/wiki/Grand_Circus_Park
      q("Detroit's Grand Circus Park came from whose post-1805 city plan?", ["Augustus Woodward", "Lewis Cass", "Antoine Cadillac", "William Hull"], "Augustus Woodward", 3),
      // https://en.wikipedia.org/wiki/Campus_Martius_Park
      q("Detroit's Campus Martius was named after a square in which city?", ["Marietta, Ohio", "Vincennes, Indiana", "Albany, New York", "Lancaster, Ohio"], "Marietta, Ohio", 3),
      // https://en.wikipedia.org/wiki/Campus_Martius_Park
      q("Detroit's 'Campus Martius' is Latin for…", ["Field of Mars", "Square of Peace", "Camp of Soldiers", "Court of Law"], "Field of Mars", 3),
      // https://en.wikipedia.org/wiki/University_of_Detroit_Mercy
      q("Detroit Mercy began in 1877 under which Jesuit leader?", ["John Baptist Miège", "Gabriel Richard", "Pierre-Jean De Smet", "Jacques Marquette"], "John Baptist Miège", 3),
      // https://en.wikipedia.org/wiki/Stroh_Brewery_Company
      q("Besides beer, Detroit's Stroh company also made…", ["ice cream", "potato chips", "ginger ale", "pretzels"], "ice cream", 3),
    ],
  },
  austin: {
    local: [
      // https://en.wikipedia.org/wiki/Oakwood_Cemetery_(Austin,_Texas)
      q("Austin's Oakwood Cemetery was originally called…", ["City Cemetery", "Hill Cemetery", "Capitol Cemetery", "Republic Cemetery"], "City Cemetery", 3),
      // https://en.wikipedia.org/wiki/Oakwood_Cemetery_(Austin,_Texas)
      q("Austin's Oakwood Cemetery was established in what year?", ["1839", "1866", "1851", "1874"], "1839", 3),
      // https://en.wikipedia.org/wiki/Oakwood_Cemetery_(Austin,_Texas)
      q("Austin's Oakwood Cemetery sits just south of which ballpark?", ["Disch-Falk Field", "Dell Diamond", "Nelson Field", "House Park"], "Disch-Falk Field", 3),
      // https://en.wikipedia.org/wiki/Texas_State_Cemetery
      q("Austin's Texas State Cemetery began as whose burial place?", ["Edward Burleson", "Sam Houston", "Mirabeau Lamar", "Anson Jones"], "Edward Burleson", 3),
      // https://en.wikipedia.org/wiki/Treaty_Oak_(Austin,_Texas)
      q("Austin's Treaty Oak was formerly known as…", ["Raymond's Oak", "Council Oak", "Burleson's Oak", "Lamar's Oak"], "Raymond's Oak", 3),
      // https://en.wikipedia.org/wiki/Treaty_Oak_(Austin,_Texas)
      q("Austin's Treaty Oak was poisoned by a vandal in what year?", ["1989", "1977", "1996", "1983"], "1989", 3),
      // https://en.wikipedia.org/wiki/Treaty_Oak_(Austin,_Texas)
      q("Austin's Treaty Oak stands on which street?", ["Baylor Street", "Guadalupe Street", "Lavaca Street", "Rio Grande Street"], "Baylor Street", 3),
      // https://en.wikipedia.org/wiki/French_Legation
      q("Austin's French Legation was built in what year?", ["1841", "1856", "1836", "1849"], "1841", 3),
      // https://en.wikipedia.org/wiki/Neill–Cochran_House
      q("Who designed and built Austin's Neill–Cochran House in 1855?", ["Abner Cook", "Napoleon Le Brun", "Elijah Myers", "Alfred Giles"], "Abner Cook", 3),
      // https://en.wikipedia.org/wiki/Neill–Cochran_House
      q("Abner Cook's signature Austin balusters are called a sheaf of…", ["wheat", "barley", "cotton", "arrows"], "wheat", 3),
      // https://en.wikipedia.org/wiki/Elisabet_Ney_Museum
      q("Sculptor Elisabet Ney called her Austin studio…", ["Formosa", "Liendo", "Bellevue", "Arcadia"], "Formosa", 3),
      // https://en.wikipedia.org/wiki/Elisabet_Ney_Museum
      q("Elisabet Ney's Austin studio was completed in what year?", ["1893", "1871", "1907", "1884"], "1893", 3),
      // https://en.wikipedia.org/wiki/Umlauf_Sculpture_Garden
      q("Austin's Umlauf Sculpture Garden is next to which park?", ["Zilker Park", "Pease Park", "Mueller Park", "Shoal Creek Park"], "Zilker Park", 3),
      // https://en.wikipedia.org/wiki/Umlauf_Sculpture_Garden
      q("In 1985 Charles Umlauf gave Austin how many sculptures?", ["168", "92", "245", "310"], "168", 3),
      // https://en.wikipedia.org/wiki/Laguna_Gloria
      q("Austin's Laguna Gloria villa was the home of which woman?", ["Clara Driscoll", "Elisabet Ney", "Ima Hogg", "Miriam Ferguson"], "Clara Driscoll", 3),
      // https://en.wikipedia.org/wiki/Mexic-Arte_Museum
      q("Austin's Mexic-Arte Museum was founded in what year?", ["1983", "1971", "1995", "1966"], "1983", 3),
      // https://en.wikipedia.org/wiki/Mexic-Arte_Museum
      q("Mexic-Arte Museum co-founder with Sylvia Orozco was…", ["Sam Coronado", "Luis Jiménez", "Carmen Lomas", "Amado Peña"], "Sam Coronado", 3),
      // https://en.wikipedia.org/wiki/George_Washington_Carver_Museum_and_Cultural_Center
      q("Austin's Carver Museum is housed in a former…", ["library branch", "fire station", "train depot", "school gym"], "library branch", 3),
      // https://en.wikipedia.org/wiki/Driskill_Hotel
      q("Austin's Driskill Hotel was completed in what year?", ["1886", "1901", "1872", "1912"], "1886", 3),
      // https://en.wikipedia.org/wiki/Driskill_Hotel
      q("Col. Jesse Driskill made his fortune as a…", ["cattleman", "banker", "railroad man", "oil wildcatter"], "cattleman", 3),
      // https://en.wikipedia.org/wiki/Driskill_Hotel
      q("Austin's Driskill Hotel was built in what architectural style?", ["Romanesque", "Art Deco", "Greek Revival", "Beaux-Arts"], "Romanesque", 3),
      // https://en.wikipedia.org/wiki/Paramount_Theatre_(Austin,_Texas)
      q("Austin's Paramount Theatre was built in what year?", ["1915", "1928", "1903", "1937"], "1915", 3),
      // https://en.wikipedia.org/wiki/Paramount_Theatre_(Austin,_Texas)
      q("Austin's Paramount hosted the 1966 world premiere of which film?", ["Batman", "Giant", "Hud", "The Alamo"], "Batman", 3),
      // https://en.wikipedia.org/wiki/Scholz_Garten
      q("Austin's Scholz Garten was founded in 1866 by…", ["August Scholz", "Otto Scholz", "Fritz Scholz", "Karl Scholz"], "August Scholz", 3),
      // https://en.wikipedia.org/wiki/Armadillo_World_Headquarters
      q("Austin's Armadillo World Headquarters occupied an old…", ["National Guard Armory", "county cotton warehouse", "municipal ice factory", "railroad freight depot"], "National Guard Armory", 3),
      // https://en.wikipedia.org/wiki/Armadillo_World_Headquarters
      q("Austin's Armadillo World Headquarters stood on which road?", ["Barton Springs Road", "Riverside Drive", "South Lamar Road", "Oltorf Street Road"], "Barton Springs Road", 3),
      // https://en.wikipedia.org/wiki/Armadillo_World_Headquarters
      q("Which venue preceded the Armadillo as Austin's flagship rock hall?", ["Vulcan Gas Company", "Soap Creek Saloon", "Liberty Lunch", "Raul's Club"], "Vulcan Gas Company", 3),
      // https://en.wikipedia.org/wiki/Hamilton_Pool_Preserve
      q("Austin-area Hamilton Pool formed when an underground river's … collapsed?", ["dome", "dam", "bridge", "spring"], "dome", 3),
      // https://en.wikipedia.org/wiki/McKinney_Falls_State_Park
      q("Austin's McKinney Falls lie on which creek?", ["Onion Creek", "Shoal Creek", "Bull Creek", "Walnut Creek"], "Onion Creek", 3),
      // https://en.wikipedia.org/wiki/McKinney_Falls_State_Park
      q("Austin's McKinney Falls State Park opened in what year?", ["1976", "1962", "1988", "1954"], "1976", 3),
      // https://en.wikipedia.org/wiki/Emma_Long_Metropolitan_Park
      q("Austin's Emma Long park was originally called…", ["City Park", "Lake Park", "Bull Creek Park", "Long Park"], "City Park", 3),
      // https://en.wikipedia.org/wiki/Emma_Long_Metropolitan_Park
      q("Which CCC company developed Austin's Emma Long park in 1939?", ["Company 1805", "Company 1811", "Company 872", "Company 2402"], "Company 1805", 3),
      // https://en.wikipedia.org/wiki/Deep_Eddy_Pool
      q("Austin's Deep Eddy Pool began as a swimming hole in which river?", ["Colorado River", "San Marcos River", "Pedernales River", "Guadalupe River"], "Colorado River", 3),
      // https://en.wikipedia.org/wiki/Deep_Eddy_Pool
      q("Deep Eddy's Depression-era bathhouse in Austin was built by the…", ["Works Progress Administration", "Civilian Conservation Corps", "Tennessee Valley Authority", "Public Works Office Corps"], "Works Progress Administration", 3),
      // https://en.wikipedia.org/wiki/Mansfield_Dam
      q("Which Interior Secretary attended the dedication of Mansfield Dam near Austin?", ["Harold L. Ickes", "Julius Krug", "Oscar Chapman", "Stewart Udall"], "Harold L. Ickes", 3),
      // https://en.wikipedia.org/wiki/Lake_Travis
      q("Lake Travis near Austin is named for which Alamo figure?", ["William B. Travis", "James Bowie", "Davy Crockett", "James Bonham"], "William B. Travis", 3),
      // https://en.wikipedia.org/wiki/Harry_Ransom_Center
      q("Austin's Harry Ransom Center was called what until 1983?", ["Humanities Research Center", "Texas Literary Archive", "Rare Books Library", "Fine Arts Archive"], "Humanities Research Center", 3),
      // https://en.wikipedia.org/wiki/Blanton_Museum_of_Art
      q("The Blanton museum in Austin is formally named for…", ["Jack S. Blanton", "James Blanton", "John S. Blanton", "Joseph Blanton"], "Jack S. Blanton", 3),
      // https://en.wikipedia.org/wiki/Texas_Memorial_Museum
      q("Who designed Austin's Texas Memorial Museum building?", ["John F. Staub", "Cass Gilbert", "Robert Leon White", "Hal Thomson"], "John F. Staub", 3),
      // https://en.wikipedia.org/wiki/Texas_Memorial_Museum
      q("Austin's Texas Memorial Museum was readied for the Texas Centennial of…", ["1936", "1946", "1924", "1915"], "1936", 3),
      // https://en.wikipedia.org/wiki/Frank_Erwin_Center
      q("Austin's Frank Erwin Center was nicknamed…", ["The Drum", "The Bowl", "The Barn", "The Hat"], "The Drum", 3),
      // https://en.wikipedia.org/wiki/Frank_Erwin_Center
      q("Austin's Frank Erwin Center was originally called the…", ["Special Events Center", "Longhorn Arena", "Memorial Coliseum", "University Pavilion"], "Special Events Center", 3),
      // https://en.wikipedia.org/wiki/Moody_Center
      q("Austin's Moody Center replaced which arena?", ["Frank Erwin Center", "Gregory Gym", "Palmer Events Center", "Austin Coliseum"], "Frank Erwin Center", 3),
      // https://en.wikipedia.org/wiki/Darrell_K_Royal–Texas_Memorial_Stadium
      q("The Longhorns have played at Austin's Royal–Memorial Stadium since…", ["1924", "1938", "1912", "1946"], "1924", 3),
      // https://en.wikipedia.org/wiki/Texas_School_for_the_Deaf
      q("Austin's Texas School for the Deaf opened in what year?", ["1857", "1872", "1845", "1866"], "1857", 3),
      // https://en.wikipedia.org/wiki/Texas_Governor%27s_Mansion
      q("Who designed the Texas Governor's Mansion in Austin?", ["Abner Cook", "Elijah Myers", "Nicholas Clayton", "Alfred Giles"], "Abner Cook", 3),
      // https://en.wikipedia.org/wiki/Texas_Governor%27s_Mansion
      q("The Texas Governor's Mansion in Austin was damaged by arson in…", ["2008", "1997", "2013", "2002"], "2008", 3),
      // https://en.wikipedia.org/wiki/Austin_State_Hospital
      q("Until 1925, Austin State Hospital was called the Texas State…", ["Lunatic Asylum", "Charity Infirmary", "Sanitarium Home", "Insane Retreat"], "Lunatic Asylum", 3),
      // https://en.wikipedia.org/wiki/Hyde_Park,_Austin,_Texas
      q("Austin's Hyde Park, its first suburb, dates back to…", ["1891", "1872", "1909", "1884"], "1891", 3),
      // https://en.wikipedia.org/wiki/Hyde_Park,_Austin,_Texas
      q("Austin's Hyde Park is bounded on the west by which street?", ["Guadalupe Street", "Lamar Boulevard", "Duval Street", "Red River Street"], "Guadalupe Street", 3),
      // https://en.wikipedia.org/wiki/Robert_Mueller_Municipal_Airport
      q("Austin's Mueller airport opened in what year?", ["1930", "1942", "1924", "1951"], "1930", 3),
      // https://en.wikipedia.org/wiki/Robert_Mueller_Municipal_Airport
      q("Robert Mueller, namesake of Austin's old airport, was a…", ["city councilor", "WWI pilot", "state senator", "UT professor"], "city councilor", 3),
      // https://en.wikipedia.org/wiki/Bergstrom_Air_Force_Base
      q("Austin's Bergstrom AFB was first activated in 1942 as … Army Air Base?", ["Del Valle", "Travis", "Montopolis", "Bastrop"], "Del Valle", 3),
      // https://en.wikipedia.org/wiki/Bergstrom_Air_Force_Base
      q("Bergstrom AFB near Austin later hosted which recon jet fleet?", ["RF-4C Phantom", "RF-101 Voodoo", "SR-71 Blackbird", "U-2 Dragon Lady"], "RF-4C Phantom", 3),
      // https://en.wikipedia.org/wiki/Austin_Chronicle
      q("The Austin Chronicle is published every…", ["Thursday", "Monday", "Wednesday", "Friday"], "Thursday", 3),
      // https://en.wikipedia.org/wiki/Austin_American-Statesman
      q("Which company owns the Austin American-Statesman?", ["Hearst Communications", "Gannett Media", "Lee Enterprises", "McClatchy Company"], "Hearst Communications", 3),
      // https://en.wikipedia.org/wiki/Whole_Foods_Market
      q("Which co-founder of Austin's Whole Foods sold it to Amazon?", ["John Mackey", "Craig Weller", "Mark Skiles", "Renee Lawson"], "John Mackey", 3),
      // https://en.wikipedia.org/wiki/Texas_State_Cemetery
      q("Austin's Texas State Cemetery was expanded during the Civil War as a … cemetery?", ["Confederate", "Union", "military", "pauper"], "Confederate", 3),
      // https://en.wikipedia.org/wiki/Clarksville,_Austin,_Texas
      q("Austin's Clarksville lies near which lake?", ["Lady Bird Lake", "Lake Travis", "Lake Austin", "Decker Lake"], "Lady Bird Lake", 3),
      // https://en.wikipedia.org/wiki/Congress_Avenue_Bridge
      q("Austin's Congress Avenue Bridge was renamed in 2006 for…", ["Ann W. Richards", "Barbara Jordan", "Lady Bird Johnson", "Molly Ivins"], "Ann W. Richards", 3),
      // https://en.wikipedia.org/wiki/Congress_Avenue_Bridge
      q("The first Colorado River bridge at Austin's Congress Ave was a…", ["pontoon toll bridge", "wooden trestle", "iron truss", "suspension span"], "pontoon toll bridge", 3),
      // https://en.wikipedia.org/wiki/Congress_Avenue_Bridge
      q("The bat colony under Austin's Congress Ave bridge is a … colony?", ["maternity", "bachelor", "winter", "migrant"], "maternity", 3),
      // https://en.wikipedia.org/wiki/Tom_Miller_Dam
      q("Austin's Tom Miller Dam began operating in what year?", ["1940", "1951", "1932", "1963"], "1940", 3),
      // https://en.wikipedia.org/wiki/Tom_Miller_Dam
      q("Austin's two earlier dams at the Tom Miller site were both called…", ["Austin Dam", "Colorado Dam", "Capitol Dam", "Mount Bonnell Dam"], "Austin Dam", 3),
      // https://en.wikipedia.org/wiki/Pease_Park
      q("Austin's Pease Park hosts which hippie-era birthday party?", ["Eeyore's", "Pooh's", "Piglet's", "Tigger's"], "Eeyore's", 3),
      // https://en.wikipedia.org/wiki/Pease_Park
      q("Gov. Elisha Pease donated Austin's Pease Park land in…", ["1875", "1861", "1889", "1852"], "1875", 3),
      // https://en.wikipedia.org/wiki/Mansfield_Dam
      q("Mansfield Dam near Austin was originally called…", ["Marshall Ford Dam", "Travis Point Dam", "Hurst Creek Dam", "Pace Bend Dam"], "Marshall Ford Dam", 3),
      // https://en.wikipedia.org/wiki/Mansfield_Dam
      q("Which firm was prime contractor on Mansfield Dam near Austin?", ["Brown and Root", "Bechtel", "Morrison-Knudsen", "Kiewit Sons"], "Brown and Root", 3),
      // https://en.wikipedia.org/wiki/Lyndon_Baines_Johnson_Library_and_Museum
      q("UT Austin paid $15M of the LBJ Library's total cost of…", ["$18 million", "$25 million", "$40 million", "$12 million"], "$18 million", 3),
      // https://en.wikipedia.org/wiki/Austin_Aqua_Festival
      q("Who headlined the first Austin Aqua Festival in 1962?", ["Art Linkletter", "Bob Hope", "Arthur Godfrey", "Ed Sullivan"], "Art Linkletter", 3),
      // https://en.wikipedia.org/wiki/Austin_Aqua_Festival
      q("Austin Aqua Fest's first discount tickets were called Skipper…", ["Script", "Pass", "Coin", "Card"], "Script", 3),
      // https://en.wikipedia.org/wiki/Harry_Ransom_Center
      q("Harry Ransom founded his Austin research center in what year?", ["1957", "1946", "1966", "1971"], "1957", 3),
      // https://en.wikipedia.org/wiki/Elisabet_Ney_Museum
      q("Who bought Elisabet Ney's Austin studio after she died in 1907?", ["Ella and Joseph B. Dibrell", "Clara and Robert Driscoll", "Ima and Will Hogg", "Anna and John Pease"], "Ella and Joseph B. Dibrell", 3),
      // https://en.wikipedia.org/wiki/Neill–Cochran_House
      q("Austin's Neill–Cochran House was built for Washington and Mary…", ["Hill", "Pease", "Cook", "Neill"], "Hill", 3),
    ],
  },
  temple: {
    local: [
      // https://en.wikipedia.org/wiki/Joe_Greene
      q("Temple native Joe Greene was a defensive tackle for which NFL team?", ["Pittsburgh Steelers", "Dallas Cowboys", "Houston Oilers", "Oakland Raiders"], "Pittsburgh Steelers", 3),
      // https://en.wikipedia.org/wiki/Sammy_Baugh
      q("Temple-born QB Sammy Baugh played college ball for which team?", ["TCU Horned Frogs", "Baylor Bears", "SMU Mustangs", "Rice Owls"], "TCU Horned Frogs", 3),
      // https://en.wikipedia.org/wiki/Sammy_Baugh
      q("Temple-born Sammy Baugh's father worked on which railroad?", ["Santa Fe Railroad", "Katy Railroad", "Cotton Belt Railroad", "Southern Pacific Line"], "Santa Fe Railroad", 3),
      // https://en.wikipedia.org/wiki/Sammy_Baugh
      q("Temple-born Sammy Baugh played 16 seasons for which NFL team?", ["Washington", "Chicago Cardinals", "Green Bay Packers", "New York Giants"], "Washington", 3),
      // https://en.wikipedia.org/wiki/Rip_Torn
      q("Temple-born Rip Torn got an Oscar nod for which 1983 film?", ["Cross Creek", "Tender Mercies", "Silkwood", "Terms of Endearment"], "Cross Creek", 3),
      // https://en.wikipedia.org/wiki/Blind_Willie_Johnson
      q("Blues singer Blind Willie Johnson was born in which town near Temple?", ["Pendleton", "Rogers", "Troy", "Holland"], "Pendleton", 3),
      // https://en.wikipedia.org/wiki/Blind_Willie_Johnson
      q("Blind Willie Johnson, born near Temple, recorded how many songs?", ["thirty", "twelve", "forty-four", "sixty"], "thirty", 3),
      // https://en.wikipedia.org/wiki/Temple_College
      q("Temple College classes were held in the high school basement until…", ["1957", "1938", "1966", "1946"], "1957", 3),
      // https://en.wikipedia.org/wiki/Temple_College
      q("Temple Junior College took the name Temple College in…", ["1996", "1971", "1984", "2005"], "1996", 3),
      // https://en.wikipedia.org/wiki/Temple_Daily_Telegram
      q("The Temple Daily Telegram has served Central Texas since…", ["1907", "1881", "1923", "1895"], "1907", 3),
      // https://en.wikipedia.org/wiki/Temple_Daily_Telegram
      q("Which family firm owns the Temple Daily Telegram?", ["Frank Mayborn Enterprises", "Belo Corporation", "Hearst Texas Media", "Cox Media Group"], "Frank Mayborn Enterprises", 3),
      // https://en.wikipedia.org/wiki/Draughon–Miller_Central_Texas_Regional_Airport
      q("Temple's airport began in 1942 as Temple … Field?", ["Army Air", "Naval Air", "Marine Air", "Municipal Air"], "Army Air", 3),
      // https://en.wikipedia.org/wiki/Draughon–Miller_Central_Texas_Regional_Airport
      q("Temple AAF in WWII was a sub-base of which airfield?", ["Waco Army Airfield", "Randolph Field", "Kelly Field", "Bergstrom Field"], "Waco Army Airfield", 3),
      // https://en.wikipedia.org/wiki/Draughon–Miller_Central_Texas_Regional_Airport
      q("Temple's regional airport has which three-letter code?", ["TPL", "TMX", "BLT", "TXT"], "TPL", 3),
      // https://en.wikipedia.org/wiki/Wilsonart
      q("Temple's Wilsonart was founded by Ralph Wilson Sr. in…", ["1956", "1946", "1965", "1938"], "1956", 3),
      // https://en.wikipedia.org/wiki/Wilsonart
      q("Wilsonart's first Temple plant stood across from which customer?", ["American Desk", "Texas Furniture", "Formica", "Steelcase"], "American Desk", 3),
      // https://en.wikipedia.org/wiki/Wilsonart
      q("Temple-based Wilsonart is best known for making…", ["high pressure laminates", "industrial ceramics", "vinyl flooring", "steel desks"], "high pressure laminates", 3),
      // https://en.wikipedia.org/wiki/Bernard_A._Harris_Jr.
      q("Temple-born astronaut Bernard Harris made a historic spacewalk in…", ["1995", "1989", "2001", "1992"], "1995", 3),
      // https://en.wikipedia.org/wiki/Claudia_Potter
      q("Claudia Potter, at Temple's sanitarium, introduced what to Texas?", ["gas anesthesia", "X-ray imaging", "insulin therapy", "blood banking"], "gas anesthesia", 3),
      // https://en.wikipedia.org/wiki/Belton_Lake
      q("Belton Lake near Temple was impounded in what year?", ["1954", "1968", "1941", "1972"], "1954", 3),
      // https://en.wikipedia.org/wiki/Stillhouse_Hollow_Lake
      q("Stillhouse Hollow Lake near Temple was impounded in…", ["1968", "1954", "1979", "1961"], "1968", 3),
      // https://en.wikipedia.org/wiki/Stillhouse_Hollow_Lake
      q("Stillhouse Hollow Lake near Temple sits on which river?", ["Lampasas River", "Leon River", "Nolan River", "Brazos River"], "Lampasas River", 3),
      // https://en.wikipedia.org/wiki/Little_River_(Texas)
      q("The Little River near Temple empties into which river?", ["Brazos River", "Colorado River", "Trinity River", "Navasota River"], "Brazos River", 3),
      // https://en.wikipedia.org/wiki/Little_River_(Texas)
      q("The Little River near Temple ends at a site called Port…", ["Sullivan", "Hearne", "Lavaca", "Milam"], "Sullivan", 3),
      // https://en.wikipedia.org/wiki/Salado,_Texas
      q("Salado, south of Temple, first incorporated in 1867 to build a…", ["bridge", "school", "church", "mill"], "bridge", 3),
      // https://en.wikipedia.org/wiki/Troy,_Texas
      q("Troy lies how many miles north of Temple?", ["8", "15", "3", "22"], "8", 3),
      // https://en.wikipedia.org/wiki/Rogers,_Texas
      q("Which U.S. route links Temple to the town of Rogers?", ["U.S. Route 190", "U.S. Route 77", "U.S. Route 81", "U.S. Route 84"], "U.S. Route 190", 3),
      // https://en.wikipedia.org/wiki/Mother_Neff_State_Park
      q("Mother Neff State Park near Temple opened to the public in…", ["1937", "1921", "1946", "1916"], "1937", 3),
      // https://en.wikipedia.org/wiki/Mother_Neff_State_Park
      q("Mother Neff park near Temple was named for the mother of Gov…", ["Pat Morris Neff", "Dan Moody", "Ross Sterling", "James Allred"], "Pat Morris Neff", 3),
      // https://en.wikipedia.org/wiki/University_of_Mary_Hardin–Baylor
      q("UMHB near Temple was chartered in 1845 as Baylor … College?", ["Female", "Normal", "Baptist", "Belton"], "Female", 3),
      // https://en.wikipedia.org/wiki/Westphalia,_Texas
      q("Westphalia's Church of the Visitation, near Temple, is famed for being…", ["wooden", "stone", "adobe", "brick"], "wooden", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Before its 1881 naming, Temple began as a construction camp called…", ["Temple Junction", "Bell Junction", "Santa Fe Camp", "Moore Crossing"], "Temple Junction", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Temple's annual Stag Party grew from a celebration of which holiday?", ["Thanksgiving", "Christmas", "Juneteenth", "Independence Day"], "Thanksgiving", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Temple's annual Stag Party ran from 1893 until…", ["1923", "1907", "1941", "1916"], "1923", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Temple's Santa Fe Hospital merged with Scott and White in…", ["1983", "1969", "1995", "1974"], "1983", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Temple's Railroad and Heritage Museum sits at 315 West Avenue…", ["B", "D", "H", "M"], "B", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Temple sits along which geologic fault?", ["Balcones Fault", "Ouachita Fault", "Meers Fault", "Luling Fault"], "Balcones Fault", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("East of Temple lies which rich farming region?", ["Blackland Prairie", "Cross Timbers", "Post Oak Savanna", "Coastal Bend"], "Blackland Prairie", 3),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Temple Bottling Company makes Dr Pepper with which sugar?", ["Imperial Cane", "Domino Beet", "C&H Pure Cane", "Holly Beet"], "Imperial Cane", 3),
      // https://en.wikipedia.org/wiki/Gulf,_Colorado_and_Santa_Fe_Railway
      q("The railroad that founded Temple was fully absorbed into the ATSF in…", ["1965", "1948", "1886", "1972"], "1965", 3),
      // https://en.wikipedia.org/wiki/Gulf,_Colorado_and_Santa_Fe_Railway
      q("Temple's founding railroad survives today as part of which system?", ["BNSF Railway", "Union Pacific", "Kansas City Southern", "Texas Central"], "BNSF Railway", 3),
      // https://en.wikipedia.org/wiki/Stagecoach_Inn_(Salado,_Texas)
      q("Salado's Stagecoach Inn near Temple was built starting in…", ["1852", "1867", "1838", "1874"], "1852", 3),
      // https://en.wikipedia.org/wiki/Stagecoach_Inn_(Salado,_Texas)
      q("Salado's Stagecoach Inn near Temple was a stop on which trail?", ["Chisholm Trail", "Goodnight-Loving Trail", "Shawnee Trail", "Western Trail"], "Chisholm Trail", 3),
      // https://en.wikipedia.org/wiki/Holland,_Texas
      q("Holland, near Temple, is home to Texas's center of…", ["population", "geography", "agriculture", "commerce"], "population", 3),
      // https://en.wikipedia.org/wiki/Holland,_Texas
      q("Holland, near Temple, was earlier a community called…", ["Mountain Home", "Gotcher Springs", "Prairie Rest", "Little Elm"], "Mountain Home", 3),
      // https://en.wikipedia.org/wiki/Harker_Heights,_Texas
      q("Harker Heights near Temple takes its name from which founder?", ["Harley Kern", "Harold Parker", "Harker Cox", "Henry Barker"], "Harley Kern", 3),
      // https://en.wikipedia.org/wiki/Harker_Heights,_Texas
      q("Harker Heights near Temple was incorporated in what year?", ["1960", "1948", "1972", "1955"], "1960", 3),
      // https://en.wikipedia.org/wiki/Harker_Heights,_Texas
      q("Harker Heights founders Pinckney Cox and Harley Kern were both…", ["hog farmers", "cattle barons", "oil drillers", "cotton ginners"], "hog farmers", 3),
      // https://en.wikipedia.org/wiki/Killeen,_Texas
      q("Killeen, near Temple, was named for railroad manager…", ["Frank P. Killeen", "John H. Killeen", "Peter M. Killeen", "Thomas Killeen"], "Frank P. Killeen", 3),
      // https://en.wikipedia.org/wiki/Killeen,_Texas
      q("Killeen, west of Temple, grew near an older farm community called…", ["Palo Alto", "Mesquite Flat", "Live Oak", "Sugar Loaf"], "Palo Alto", 3),
      // https://en.wikipedia.org/wiki/Morgan%27s_Point_Resort,_Texas
      q("Morgan's Point Resort, bordering Temple, lies on the east side of…", ["Belton Lake", "Stillhouse Hollow Lake", "Lake Waco", "Lake Georgetown"], "Belton Lake", 3),
      // https://en.wikipedia.org/wiki/Morgan%27s_Point_Resort,_Texas
      q("Morgan's Point Resort near Temple was incorporated in…", ["1970", "1958", "1984", "1963"], "1970", 3),
      // https://en.wikipedia.org/wiki/Peter_Hansborough_Bell
      q("Peter H. Bell, namesake of Temple's county, was Texas governor number…", ["third", "fifth", "first", "seventh"], "third", 3),
      // https://en.wikipedia.org/wiki/Cowhouse_Creek
      q("Cowhouse Creek flows into which lake near Temple?", ["Belton Lake", "Stillhouse Hollow Lake", "Lake Travis", "Proctor Lake"], "Belton Lake", 3),
      // https://en.wikipedia.org/wiki/Leon_River
      q("The Leon River near Temple forms from forks meeting near…", ["Eastland", "Comanche", "Gatesville", "Hamilton"], "Eastland", 3),
      // https://en.wikipedia.org/wiki/Little_River-Academy,_Texas
      q("Little River-Academy, near Temple, merged how many settlements?", ["two", "three", "four", "five"], "two", 3),
      // https://en.wikipedia.org/wiki/Bell_County_Expo_Center
      q("The Bell County Expo arena near Temple opened in what year?", ["1987", "1974", "1999", "1968"], "1987", 3),
      // https://en.wikipedia.org/wiki/Nolanville,_Texas
      q("Early phone lines in Nolanville, near Temple, used which wire?", ["barbed wire", "copper wire", "baling wire", "telegraph wire"], "barbed wire", 3),
      // https://en.wikipedia.org/wiki/Temple_College
      q("Temple College's main campus covers about how many acres?", ["108", "64", "215", "152"], "108", 3),
      // https://en.wikipedia.org/wiki/Draughon–Miller_Central_Texas_Regional_Airport
      q("Temple's old 1937 municipal airport was built by the…", ["Works Progress Administration", "Civilian Conservation Corps", "Army Corps of Engineers", "Public Works Office"], "Works Progress Administration", 3),
      // https://en.wikipedia.org/wiki/Wilsonart
      q("Wilsonart's 'Temple North' adhesive plant opened in…", ["1986", "1972", "1994", "1979"], "1986", 3),
      // https://en.wikipedia.org/wiki/Blind_Willie_Johnson
      q("Blind Willie Johnson, born near Temple, was the son of a…", ["sharecropper", "preacher", "blacksmith", "railroad man"], "sharecropper", 3),
      // https://en.wikipedia.org/wiki/Draughon–Miller_Central_Texas_Regional_Airport
      q("Temple Army Air Field was built in 1942 with how many concrete runways?", ["three", "two", "four", "six"], "three", 3),
      // https://en.wikipedia.org/wiki/Holland,_Texas
      q("James R. Holland reached Belton, near Temple, in 1874 with how much cash?", ["six dollars", "ten dollars", "forty dollars", "two dollars"], "six dollars", 3),
      // https://en.wikipedia.org/wiki/Lampasas_River
      q("The Lampasas River, which joins the Leon near Temple, rises near…", ["Hamilton", "Lampasas", "Burnet", "San Saba"], "Hamilton", 3),
      // https://en.wikipedia.org/wiki/Little_River_(Texas)
      q("The Little River near Temple flows how far to the Brazos?", ["75 miles", "40 miles", "120 miles", "18 miles"], "75 miles", 3),
      // https://en.wikipedia.org/wiki/Leon_River
      q("Besides Belton Lake, which reservoir sits on the Leon River above Temple?", ["Proctor Lake", "Lake Whitney", "Lake Brownwood", "Possum Kingdom"], "Proctor Lake", 3),
      // https://en.wikipedia.org/wiki/Salado,_Texas
      q("Salado, south of Temple, voted to reincorporate in what year?", ["2000", "1986", "2012", "1974"], "2000", 3),
      // https://en.wikipedia.org/wiki/Stagecoach_Inn_(Salado,_Texas)
      q("Salado's Stagecoach Inn near Temple joined the National Register in…", ["1983", "1971", "1995", "1966"], "1983", 3),
      // https://en.wikipedia.org/wiki/Gulf,_Colorado_and_Santa_Fe_Railway
      q("The railroad that founded Temple was aiming for which city's name?", ["Santa Fe, New Mexico", "Santa Fe, Texas", "Colorado Springs", "Pueblo, Colorado"], "Santa Fe, New Mexico", 3),
    ],
  },
  nola: {
    local: [
      // https://en.wikipedia.org/wiki/Lafayette_Cemetery_No._1
      q("New Orleans' Lafayette Cemetery No. 1 was founded in what year?", ["1833", "1852", "1817", "1866"], "1833", 3),
      // https://en.wikipedia.org/wiki/Lafayette_Cemetery_No._1
      q("The City of Lafayette was annexed by New Orleans in…", ["1852", "1833", "1870", "1845"], "1852", 3),
      // https://en.wikipedia.org/wiki/Metairie_Cemetery
      q("New Orleans' Metairie Cemetery was founded in what year?", ["1872", "1833", "1895", "1856"], "1872", 3),
      // https://en.wikipedia.org/wiki/Metairie_Cemetery
      q("New Orleans' Metairie Cemetery was built on the site of a former…", ["racetrack", "plantation", "fort", "brickyard"], "racetrack", 3),
      // https://en.wikipedia.org/wiki/Holt_Cemetery
      q("New Orleans' Holt Cemetery is what kind of burial ground?", ["potter's field", "military cemetery", "family plot", "church yard"], "potter's field", 3),
      // https://en.wikipedia.org/wiki/Holt_Cemetery
      q("New Orleans' Holt Cemetery sits next to which college?", ["Delgado Community College", "Loyola University", "Dillard University", "Xavier University"], "Delgado Community College", 3),
      // https://en.wikipedia.org/wiki/Gallier_House
      q("New Orleans' Gallier House was home to architect…", ["James Gallier Jr.", "Henry Howard", "Benjamin Latrobe", "Thomas Sully"], "James Gallier Jr.", 3),
      // https://en.wikipedia.org/wiki/Gallier_House
      q("New Orleans' Gallier House stands on which French Quarter street?", ["Royal Street", "Chartres Street", "Dauphine Street", "Burgundy Street"], "Royal Street", 3),
      // https://en.wikipedia.org/wiki/Beauregard-Keyes_House
      q("New Orleans' Beauregard-Keyes House stands on which street?", ["Chartres Street", "Royal Street", "Bourbon Street", "Decatur Street"], "Chartres Street", 3),
      // https://en.wikipedia.org/wiki/Pitot_House
      q("New Orleans' Pitot House stands on which street?", ["Moss Street", "Esplanade Avenue", "Carrollton Avenue", "Orleans Avenue"], "Moss Street", 3),
      // https://en.wikipedia.org/wiki/Pontalba_Buildings
      q("Which noblewoman built the red-brick rows flanking New Orleans' Jackson Square?", ["Baroness Micaela Pontalba", "Marquise Anne Pontalba", "Countess Marie Pontalba", "Duchess Louise Pontalba"], "Baroness Micaela Pontalba", 3),
      // https://en.wikipedia.org/wiki/Pontalba_Buildings
      q("The Pontalba Buildings line two sides of which New Orleans square?", ["Jackson Square", "Congo Square", "Lafayette Square", "Washington Square"], "Jackson Square", 3),
      // https://en.wikipedia.org/wiki/Backstreet_Cultural_Museum
      q("Who founded New Orleans' Backstreet Cultural Museum?", ["Sylvester Hawkins", "Tootie Montana", "Allison Joseph", "Sidney Bechet"], "Sylvester Hawkins", 3),
      // https://en.wikipedia.org/wiki/Ogden_Museum_of_Southern_Art
      q("New Orleans' Ogden Museum of Southern Art was established in…", ["1999", "1985", "2007", "1976"], "1999", 3),
      // https://en.wikipedia.org/wiki/Ogden_Museum_of_Southern_Art
      q("New Orleans' Ogden Museum sits on which street?", ["Camp Street", "Magazine Street", "Tchoupitoulas Street", "Poydras Street"], "Camp Street", 3),
      // https://en.wikipedia.org/wiki/Longue_Vue_House_and_Gardens
      q("New Orleans' Longue Vue was home to Edgar Stern and Edith…", ["Rosenwald Stern", "Guggenheim Stern", "Lehman Stern", "Warburg Stern"], "Rosenwald Stern", 3),
      // https://en.wikipedia.org/wiki/Longue_Vue_House_and_Gardens
      q("New Orleans' Longue Vue sits in which neighborhood?", ["Lakewood", "Gentilly", "Carrollton", "Broadmoor"], "Lakewood", 3),
      // https://en.wikipedia.org/wiki/Saenger_Theatre_(New_Orleans)
      q("New Orleans' Saenger Theatre opened in what year?", ["1927", "1914", "1936", "1921"], "1927", 3),
      // https://en.wikipedia.org/wiki/Saenger_Theatre_(New_Orleans)
      q("New Orleans' Saenger is what type of movie palace?", ["atmospheric", "Art Deco", "Moorish Revival", "Egyptian Revival"], "atmospheric", 3),
      // https://en.wikipedia.org/wiki/Orpheum_Theater_(New_Orleans)
      q("Who designed New Orleans' Orpheum Theater?", ["G. Albert Lansburgh", "C. Howard Crane", "Thomas W. Lamb", "John Eberson"], "G. Albert Lansburgh", 3),
      // https://en.wikipedia.org/wiki/Orpheum_Theater_(New_Orleans)
      q("New Orleans' Orpheum Theater opened for vaudeville in…", ["1921", "1909", "1932", "1915"], "1921", 3),
      // https://en.wikipedia.org/wiki/Joy_Theater
      q("New Orleans' Joy Theater is named after owner…", ["Joy Houck", "Joy Saenger", "Joy Lansburgh", "Joy Aschaffenburg"], "Joy Houck", 3),
      // https://en.wikipedia.org/wiki/Joy_Theater
      q("New Orleans' Joy Theater was built in what year?", ["1947", "1929", "1958", "1936"], "1947", 3),
      // https://en.wikipedia.org/wiki/Preservation_Hall
      q("New Orleans' Preservation Hall stands on which street?", ["St Peter Street", "St Ann Street", "St Philip Street", "St Louis Street"], "St Peter Street", 3),
      // https://en.wikipedia.org/wiki/Preservation_Hall
      q("Art dealer Larry Borenstein, early manager of Preservation Hall, came from…", ["Milwaukee", "Memphis", "St. Louis", "Cincinnati"], "Milwaukee", 3),
      // https://en.wikipedia.org/wiki/Tipitina%27s
      q("Tipitina's in New Orleans opened in what year?", ["1977", "1968", "1985", "1972"], "1977", 3),
      // https://en.wikipedia.org/wiki/Tipitina%27s
      q("Tipitina's in New Orleans takes its name from a song by…", ["Professor Longhair", "Dr. John Rebennack", "Allen Toussaint", "Fats Domino"], "Professor Longhair", 3),
      // https://en.wikipedia.org/wiki/Maple_Leaf_Bar
      q("New Orleans' Maple Leaf Bar is on which street?", ["Oak Street", "Magazine Street", "Frenchmen Street", "Freret Street"], "Oak Street", 3),
      // https://en.wikipedia.org/wiki/Maple_Leaf_Bar
      q("New Orleans' Maple Leaf Bar opened in what year?", ["1974", "1962", "1981", "1955"], "1974", 3),
      // https://en.wikipedia.org/wiki/Galatoire%27s
      q("Jean Galatoire came from a village near which French town?", ["Pau", "Lyon", "Nantes", "Dijon"], "Pau", 3),
      // https://en.wikipedia.org/wiki/Galatoire%27s
      q("Galatoire's in New Orleans took over which restaurant in 1905?", ["Victor's Restaurant", "Antoine's Café", "Begué's Kitchen", "Moreau's Tavern"], "Victor's Restaurant", 3),
      // https://en.wikipedia.org/wiki/Commander%27s_Palace
      q("New Orleans' Commander's Palace was founded by Emile Commander in…", ["1893", "1880", "1905", "1871"], "1893", 3),
      // https://en.wikipedia.org/wiki/Arnaud%27s
      q("New Orleans' Arnaud's restaurant was founded in what year?", ["1918", "1898", "1932", "1905"], "1918", 3),
      // https://en.wikipedia.org/wiki/Arnaud%27s
      q("Arnaud Cazenave, founder of a New Orleans restaurant, was a…", ["wine salesman", "ship captain", "cotton broker", "pharmacist"], "wine salesman", 3),
      // https://en.wikipedia.org/wiki/Arnaud%27s
      q("Arnaud's in New Orleans also houses a museum of…", ["Mardi Gras", "jazz", "voodoo", "Creole cooking"], "Mardi Gras", 3),
      // https://en.wikipedia.org/wiki/Central_Grocery
      q("Who founded New Orleans' Central Grocery in 1906?", ["Salvatore Lupo", "Frank Tusa", "Angelo Brocato", "Vincent Taormina"], "Salvatore Lupo", 3),
      // https://en.wikipedia.org/wiki/Hubig%27s_Pies
      q("Hubig's Pies in New Orleans returned in 2022 after a fire in…", ["2012", "2005", "2016", "2009"], "2012", 3),
      // https://en.wikipedia.org/wiki/Hubig%27s_Pies
      q("Simon Hubig, of New Orleans pie fame, was born in…", ["Newport, KY", "Covington, KY", "Dayton, OH", "Evansville, IN"], "Newport, KY", 3),
      // https://en.wikipedia.org/wiki/Sazerac
      q("The New Orleans Sazerac takes its name from a brand of…", ["cognac", "absinthe", "bitters", "rye"], "cognac", 3),
      // https://en.wikipedia.org/wiki/Peychaud%27s_Bitters
      q("Antoine Peychaud, of New Orleans bitters fame, came from…", ["Saint-Domingue", "Martinique", "Guadeloupe", "Cuba"], "Saint-Domingue", 3),
      // https://en.wikipedia.org/wiki/Peychaud%27s_Bitters
      q("New Orleans' Peychaud's Bitters is based on which root?", ["gentian", "licorice", "angelica", "burdock"], "gentian", 3),
      // https://en.wikipedia.org/wiki/Hurricane_(cocktail)
      q("The New Orleans Hurricane is made with rum, lemon juice and…", ["passion fruit syrup", "pineapple juice", "orgeat syrup", "cherry brandy"], "passion fruit syrup", 3),
      // https://en.wikipedia.org/wiki/Pat_O%27Brien%27s_Bar
      q("During Prohibition, New Orleans' Pat O'Brien's was Mr. O'Brien's Club…", ["Tipperary", "Shamrock", "Killarney", "Galway"], "Tipperary", 3),
      // https://en.wikipedia.org/wiki/Pat_O%27Brien%27s_Bar
      q("What password got you into Pat O'Brien's in New Orleans during Prohibition?", ["storm's brewin'", "rain's comin'", "winds blowin'", "tide's risin'"], "storm's brewin'", 3),
      // https://en.wikipedia.org/wiki/Lafitte%27s_Blacksmith_Shop
      q("New Orleans' Lafitte's Blacksmith Shop sits on Bourbon and which street?", ["St. Philip Street", "St. Ann Street", "Dumaine Street", "Toulouse Street"], "St. Philip Street", 3),
      // https://en.wikipedia.org/wiki/Napoleon_House
      q("New Orleans' Napoleon House is also called the Mayor … House?", ["Girod", "Mazureau", "Roffignac", "Macarty"], "Girod", 3),
      // https://en.wikipedia.org/wiki/Napoleon_House
      q("New Orleans' Napoleon House was built in what year?", ["1794", "1814", "1771", "1832"], "1794", 3),
      // https://en.wikipedia.org/wiki/Hotel_Monteleone
      q("New Orleans' Hotel Monteleone is known for which rotating bar?", ["Carousel Piano Bar", "Merry-Go-Round Bar", "Spinning Wheel Bar", "Turntable Lounge"], "Carousel Piano Bar", 3),
      // https://en.wikipedia.org/wiki/Hotel_Monteleone
      q("New Orleans' Hotel Monteleone was built in what year?", ["1886", "1907", "1872", "1924"], "1886", 3),
      // https://en.wikipedia.org/wiki/St._Augustine_Church_(New_Orleans)
      q("New Orleans' St. Augustine Church parish was established in…", ["1841", "1824", "1866", "1853"], "1841", 3),
      // https://en.wikipedia.org/wiki/Crescent_City_Connection
      q("New Orleans' Crescent City Connection was formerly called the…", ["Greater New Orleans Bridge", "Mississippi River Bridge", "Algiers Point Bridge", "Westbank Expressway Bridge"], "Greater New Orleans Bridge", 3),
      // https://en.wikipedia.org/wiki/Crescent_City_Connection
      q("New Orleans' Crescent City Connection is what kind of bridge?", ["cantilever", "suspension", "cable-stayed", "arch"], "cantilever", 3),
      // https://en.wikipedia.org/wiki/Lake_Pontchartrain_Causeway
      q("The southern end of the Causeway near New Orleans is in…", ["Metairie", "Kenner", "Slidell", "Harahan"], "Metairie", 3),
      // https://en.wikipedia.org/wiki/Industrial_Canal
      q("The proper name of New Orleans' Industrial Canal is the Inner Harbor … Canal?", ["Navigation", "Shipping", "Drainage", "Commerce"], "Navigation", 3),
      // https://en.wikipedia.org/wiki/Audubon_Park_(New_Orleans)
      q("New Orleans' Audubon Park was historically the Plantation de…", ["Boré", "Pontalba", "Marigny", "Macarty"], "Boré", 3),
      // https://en.wikipedia.org/wiki/Audubon_Park_(New_Orleans)
      q("New Orleans bought the land for Audubon Park in…", ["1871", "1884", "1856", "1898"], "1871", 3),
      // https://en.wikipedia.org/wiki/Loyola_University_New_Orleans
      q("Loyola New Orleans began as Loyola College in…", ["1904", "1889", "1921", "1912"], "1904", 3),
      // https://en.wikipedia.org/wiki/Dillard_University
      q("New Orleans' Dillard University was founded in what year?", ["1930", "1915", "1947", "1869"], "1930", 3),
      // https://en.wikipedia.org/wiki/Xavier_University_of_Louisiana
      q("Which saint founded New Orleans' Xavier University?", ["Katharine Drexel", "Frances Cabrini", "Elizabeth Seton", "Rose Duchesne"], "Katharine Drexel", 3),
      // https://en.wikipedia.org/wiki/Zulu_Social_Aid_%26_Pleasure_Club
      q("New Orleans' Zulu club was founded in what year?", ["1916", "1901", "1932", "1909"], "1916", 3),
      // https://en.wikipedia.org/wiki/Zulu_Social_Aid_%26_Pleasure_Club
      q("Zulu riders in New Orleans famously throw hand-painted…", ["coconuts", "shoes", "beads", "cups"], "coconuts", 3),
      // https://en.wikipedia.org/wiki/Metairie_Cemetery
      q("The 1854 'Great States' horse race in New Orleans pitted Lexington against…", ["Lecomte", "Sir Archy", "Fashion", "Peytona"], "Lecomte", 3),
      // https://en.wikipedia.org/wiki/Metairie_Cemetery
      q("Which spurned man vowed to turn the New Orleans Metairie track into a cemetery?", ["Charles T. Howard", "Pierre Soulé", "John Slidell", "Judah Benjamin"], "Charles T. Howard", 3),
      // https://en.wikipedia.org/wiki/City_Park_(New_Orleans)
      q("New Orleans' City Park once had two famous dueling…", ["oaks", "pines", "magnolias", "cypresses"], "oaks", 3),
      // https://en.wikipedia.org/wiki/City_Park_(New_Orleans)
      q("One of New Orleans' two dueling oaks was lost to a hurricane in…", ["1949", "1915", "1965", "1893"], "1949", 3),
      // https://en.wikipedia.org/wiki/Commander%27s_Palace
      q("Which family bought New Orleans' Commander's Palace in 1969?", ["Brennan", "Galatoire", "Alciatore", "Cazenave"], "Brennan", 3),
      // https://en.wikipedia.org/wiki/Antoine%27s
      q("Which dish was NOT invented at New Orleans' Antoine's?", ["beignets", "oysters Rockefeller", "eggs Sardou", "pompano en papillote"], "beignets", 3),
      // https://en.wikipedia.org/wiki/Antoine%27s
      q("Antoine Alciatore founded his New Orleans restaurant in…", ["1840", "1862", "1828", "1855"], "1840", 3),
      // https://en.wikipedia.org/wiki/Congo_Square
      q("New Orleans' Congo Square is named after enslaved people of which group?", ["Bakongo", "Yoruba", "Fon", "Wolof"], "Bakongo", 3),
      // https://en.wikipedia.org/wiki/Bayou_St._John
      q("New Orleans' Bayou St. John drains toward which lake?", ["Lake Pontchartrain", "Lake Borgne", "Lake Maurepas", "Lake Salvador"], "Lake Pontchartrain", 3),
      // https://en.wikipedia.org/wiki/Lake_Pontchartrain_Causeway
      q("How long is the longer span of the Causeway north of New Orleans?", ["23.83 miles", "17.54 miles", "29.12 miles", "12.6 miles"], "23.83 miles", 3),
      // https://en.wikipedia.org/wiki/Industrial_Canal
      q("How long is New Orleans' Industrial Canal?", ["5.5 miles", "2.1 miles", "9.8 miles", "14 miles"], "5.5 miles", 3),
      // https://en.wikipedia.org/wiki/Ogden_Museum_of_Southern_Art
      q("New Orleans' Ogden Museum is in which hall at 925 Camp Street?", ["Stephen Goldring Hall", "Roger Ogden Hall", "Patrick Taylor Hall", "Lupin Memorial Hall"], "Stephen Goldring Hall", 3),
      // https://en.wikipedia.org/wiki/Pat_O%27Brien%27s_Bar
      q("Pat O'Brien's in New Orleans opened legally on which date?", ["December 3, 1933", "April 7, 1933", "March 1, 1934", "July 4, 1932"], "December 3, 1933", 3),
      // https://en.wikipedia.org/wiki/Hubig%27s_Pies
      q("New Orleans' Hubig's makes which kind of pies?", ["fried pies", "moon pies", "cream pies", "meat pies"], "fried pies", 3),
      // https://en.wikipedia.org/wiki/Lafitte%27s_Blacksmith_Shop
      q("New Orleans' Lafitte's Blacksmith Shop was likely built in the 1770s under which rule?", ["Spanish", "French", "British", "American"], "Spanish", 3),
    ],
  },
  chicago: {
    local: [
      // https://en.wikipedia.org/wiki/Graceland_Cemetery
      q("Chicago's Graceland Cemetery was established in what year?", ["1860", "1837", "1871", "1885"], "1860", 3),
      // https://en.wikipedia.org/wiki/Graceland_Cemetery
      q("Graceland's main entrance is at Clark Street and which Chicago road?", ["Irving Park Road", "Montrose Avenue Road", "Lawrence Avenue Road", "Foster Avenue Road"], "Irving Park Road", 3),
      // https://en.wikipedia.org/wiki/Rosehill_Cemetery
      q("Who designed the castle-like gate of Chicago's Rosehill Cemetery?", ["William W. Boyington", "William Le Baron Jenney", "John Mills Van Osdel", "Solon Spencer Beman"], "William W. Boyington", 3),
      // https://en.wikipedia.org/wiki/Rosehill_Cemetery
      q("Chicago's Rosehill Cemetery was founded in what year?", ["1859", "1871", "1846", "1883"], "1859", 3),
      // https://en.wikipedia.org/wiki/Oak_Woods_Cemetery
      q("Chicago's Oak Woods Cemetery lies on which street?", ["67th Street", "87th Street", "47th Street", "55th Street"], "67th Street", 3),
      // https://en.wikipedia.org/wiki/Oak_Woods_Cemetery
      q("Chicago's Oak Woods Cemetery is in which South Side area?", ["Greater Grand Crossing", "Washington Heights", "Auburn Gresham", "West Englewood area"], "Greater Grand Crossing", 3),
      // https://en.wikipedia.org/wiki/Robie_House
      q("Chicago's Robie House was completed in what year?", ["1910", "1902", "1917", "1895"], "1910", 3),
      // https://en.wikipedia.org/wiki/Robie_House
      q("Frederick C. Robie, of Chicago's Robie House, was a…", ["manufacturing executive", "meatpacking company heir", "railroad trial lawyer", "downtown bank president"], "manufacturing executive", 3),
      // https://en.wikipedia.org/wiki/Driehaus_Museum
      q("Chicago's Driehaus Museum occupies the former house of banker…", ["Samuel M. Nickerson", "Potter Palmer", "Marshall Field", "Philip Armour"], "Samuel M. Nickerson", 3),
      // https://en.wikipedia.org/wiki/Driehaus_Museum
      q("Chicago's Driehaus Museum stands on which street?", ["East Erie Street", "East Ohio Street", "East Huron Street", "East Delaware Place"], "East Erie Street", 3),
      // https://en.wikipedia.org/wiki/Rookery_Building
      q("Chicago's Rookery Building stands on which street?", ["South LaSalle Street", "South Dearborn Street", "West Adams Street", "South Clark Street"], "South LaSalle Street", 3),
      // https://en.wikipedia.org/wiki/Rookery_Building
      q("Chicago's Rookery Building was completed in what year?", ["1888", "1895", "1879", "1902"], "1888", 3),
      // https://en.wikipedia.org/wiki/Monadnock_Building
      q("Chicago's Monadnock Building stands on which boulevard?", ["West Jackson Boulevard", "South Michigan Boulevard", "West Wacker Boulevard", "West Congress Boulevard"], "West Jackson Boulevard", 3),
      // https://en.wikipedia.org/wiki/Monadnock_Building
      q("How many stories is Chicago's Monadnock Building?", ["16", "12", "22", "9"], "16", 3),
      // https://en.wikipedia.org/wiki/Marquette_Building_(Chicago)
      q("Which firm designed Chicago's Marquette Building?", ["Holabird & Roche", "Burnham & Root", "Adler & Sullivan", "Jenney & Mundie"], "Holabird & Roche", 3),
      // https://en.wikipedia.org/wiki/Marquette_Building_(Chicago)
      q("Which foundation owns Chicago's Marquette Building?", ["MacArthur Foundation", "Field Foundation", "Joyce Foundation", "Pritzker Foundation"], "MacArthur Foundation", 3),
      // https://en.wikipedia.org/wiki/Reliance_Building
      q("Who completed Chicago's Reliance Building in 1895?", ["Charles B. Atwood", "William Holabird", "Dankmar Adler", "Henry Ives Cobb"], "Charles B. Atwood", 3),
      // https://en.wikipedia.org/wiki/Carbide_%26_Carbon_Building
      q("Chicago's Carbide & Carbon Building was built in what year?", ["1929", "1921", "1936", "1915"], "1929", 3),
      // https://en.wikipedia.org/wiki/Carbide_%26_Carbon_Building
      q("Chicago's Carbide & Carbon Building is clad in which stone?", ["black granite", "white marble", "pink limestone", "gray slate"], "black granite", 3),
      // https://en.wikipedia.org/wiki/Wrigley_Building
      q("Chicago's Wrigley Building was built between 1920 and…", ["1924", "1928", "1922", "1931"], "1924", 3),
      // https://en.wikipedia.org/wiki/Tribune_Tower
      q("For which owner was Chicago's Tribune Tower built?", ["Robert R. McCormick", "Joseph Medill", "Marshall Field III", "William Randolph Hearst"], "Robert R. McCormick", 3),
      // https://en.wikipedia.org/wiki/Tribune_Tower
      q("How tall is Chicago's Tribune Tower?", ["463 feet", "612 feet", "378 feet", "520 feet"], "463 feet", 3),
      // https://en.wikipedia.org/wiki/Chicago_Cultural_Center
      q("The Chicago Cultural Center opened in what year?", ["1897", "1910", "1885", "1923"], "1897", 3),
      // https://en.wikipedia.org/wiki/Fine_Arts_Building_(Chicago)
      q("Chicago's Fine Arts Building was formerly the … Building?", ["Studebaker", "Pullman", "Packard", "McCormick"], "Studebaker", 3),
      // https://en.wikipedia.org/wiki/Fine_Arts_Building_(Chicago)
      q("Who built Chicago's Fine Arts Building in 1884–1885?", ["Solon Spencer Beman", "William Le Baron Jenney", "Daniel Burnham", "Louis Sullivan"], "Solon Spencer Beman", 3),
      // https://en.wikipedia.org/wiki/Garfield_Park_Conservatory
      q("Chicago's Garfield Park Conservatory is billed as landscape art under…", ["glass", "sky", "steel", "roof"], "glass", 3),
      // https://en.wikipedia.org/wiki/Lincoln_Park_Conservatory
      q("Chicago's Lincoln Park Conservatory is on which drive?", ["North Stockton Drive", "North Cannon Drive", "Lake Shore Drive", "North Lincoln Drive"], "North Stockton Drive", 3),
      // https://en.wikipedia.org/wiki/Osaka_Garden
      q("Chicago's Osaka Garden lies in which park?", ["Jackson Park", "Washington Park", "Lincoln Park", "Grant Park"], "Jackson Park", 3),
      // https://en.wikipedia.org/wiki/Buckingham_Fountain
      q("Who donated Chicago's Buckingham Fountain?", ["Kate S. Buckingham", "Bertha Palmer", "Edith Rockefeller", "Ellen Gates Starr"], "Kate S. Buckingham", 3),
      // https://en.wikipedia.org/wiki/Buckingham_Fountain
      q("Chicago's Buckingham Fountain was dedicated in what year?", ["1927", "1915", "1934", "1906"], "1927", 3),
      // https://en.wikipedia.org/wiki/Buckingham_Fountain
      q("Chicago's Buckingham Fountain was inspired by which French fountain?", ["Latona Fountain", "Medici Fountain", "Fountain of Mars", "Neptune Fountain"], "Latona Fountain", 3),
      // https://en.wikipedia.org/wiki/Chicago_Water_Tower
      q("How tall is the Chicago Water Tower?", ["182.5 feet", "154 feet", "211 feet", "138 feet"], "182.5 feet", 3),
      // https://en.wikipedia.org/wiki/Biograph_Theater
      q("Chicago's Biograph Theater stands on which avenue?", ["Lincoln Avenue", "Clark Avenue", "Halsted Avenue", "Broadway Avenue"], "Lincoln Avenue", 3),
      // https://en.wikipedia.org/wiki/Green_Mill_Cocktail_Lounge
      q("Chicago's Green Mill sits on which street in Uptown?", ["Broadway", "Sheridan Road", "Clark Street", "Lawrence Avenue"], "Broadway", 3),
      // https://en.wikipedia.org/wiki/Chicago_Theatre
      q("The Chicago Theatre was the flagship of which theater chain?", ["Balaban and Katz", "Loew's Incorporated", "Paramount Publix", "RKO Keith-Orpheum"], "Balaban and Katz", 3),
      // https://en.wikipedia.org/wiki/Chicago_Theatre
      q("The Chicago Theatre was built in what year?", ["1921", "1929", "1913", "1935"], "1921", 3),
      // https://en.wikipedia.org/wiki/Music_Box_Theatre_(Chicago)
      q("Chicago's Music Box Theatre opened in what year?", ["1929", "1921", "1938", "1914"], "1929", 3),
      // https://en.wikipedia.org/wiki/Music_Box_Theatre_(Chicago)
      q("Chicago's Music Box Theatre is on which avenue?", ["North Southport Avenue", "North Clark Avenue", "North Lincoln Avenue", "North Halsted Avenue"], "North Southport Avenue", 3),
      // https://en.wikipedia.org/wiki/Holy_Name_Cathedral_(Chicago)
      q("Chicago's Holy Name Cathedral was dedicated in what year?", ["1875", "1891", "1868", "1903"], "1875", 3),
      // https://en.wikipedia.org/wiki/Holy_Name_Cathedral_(Chicago)
      q("How many people does Chicago's Holy Name Cathedral seat?", ["1,100", "2,400", "800", "3,000"], "1,100", 3),
      // https://en.wikipedia.org/wiki/Unity_Temple
      q("Frank Lloyd Wright's Unity Temple near Chicago stands on which street?", ["Lake Street", "Chicago Avenue", "Forest Avenue", "Oak Park Avenue"], "Lake Street", 3),
      // https://en.wikipedia.org/wiki/Baháʼí_House_of_Worship_(Wilmette,_Illinois)
      q("Who designed the Bahá'í temple north of Chicago?", ["Louis Bourgeois", "Louis Sullivan", "Eero Saarinen", "Bertram Goodhue"], "Louis Bourgeois", 3),
      // https://en.wikipedia.org/wiki/National_Museum_of_Mexican_Art
      q("Who founded Chicago's National Museum of Mexican Art in 1982?", ["Carlos Tortolero", "Rudy Lozano", "Mario Castillo", "Jose Gamaliel"], "Carlos Tortolero", 3),
      // https://en.wikipedia.org/wiki/Peggy_Notebaert_Nature_Museum
      q("Chicago's Notebaert Nature Museum is run by the Chicago Academy of…", ["Sciences", "Natural History", "Nature", "Ecology"], "Sciences", 3),
      // https://en.wikipedia.org/wiki/International_Museum_of_Surgical_Science
      q("Chicago's surgical science museum is in which neighborhood?", ["Gold Coast", "Streeterville", "Old Town", "River North"], "Gold Coast", 3),
      // https://en.wikipedia.org/wiki/International_Museum_of_Surgical_Science
      q("Who founded the International College of Surgeons in Chicago?", ["Max Thorek", "Charles Mayo", "Daniel Hale Williams", "Nicholas Senn"], "Max Thorek", 3),
      // https://en.wikipedia.org/wiki/Leather_Archives_%26_Museum
      q("Chicago's Leather Archives & Museum is in which neighborhood?", ["Rogers Park", "Lakeview", "Edgewater", "Uptown"], "Rogers Park", 3),
      // https://en.wikipedia.org/wiki/Billy_Goat_Tavern
      q("Chicago's Billy Goat Tavern was founded in 1934 by…", ["Billy Sianis", "Billy Royko", "Billy Kaplan", "Billy Nikitas"], "Billy Sianis", 3),
      // https://en.wikipedia.org/wiki/Billy_Goat_Tavern
      q("Which columnist made Chicago's Billy Goat Tavern famous?", ["Mike Royko", "Studs Terkel", "Irv Kupcinet", "Bob Greene"], "Mike Royko", 3),
      // https://en.wikipedia.org/wiki/Superdawg
      q("Chicago's Superdawg is in which neighborhood?", ["Norwood Park", "Jefferson Park", "Edison Park", "Portage Park"], "Norwood Park", 3),
      // https://en.wikipedia.org/wiki/Old_Town_School_of_Folk_Music
      q("Chicago's Old Town School of Folk Music opened in what year?", ["1957", "1946", "1966", "1971"], "1957", 3),
      // https://en.wikipedia.org/wiki/Old_Town_School_of_Folk_Music
      q("Which co-founder of Chicago's Old Town School was a folk singer?", ["Win Stracke", "Pete Seeger", "Bob Gibson", "Steve Goodman"], "Win Stracke", 3),
      // https://en.wikipedia.org/wiki/Chess_Records
      q("Chicago's Chess Records succeeded which earlier label?", ["Aristocrat Records", "Vee-Jay Records", "Cobra Records", "Parrot Records"], "Aristocrat Records", 3),
      // https://en.wikipedia.org/wiki/Chess_Records
      q("Chicago's Chess Records was established in what year?", ["1950", "1944", "1957", "1962"], "1950", 3),
      // https://en.wikipedia.org/wiki/Navy_Pier
      q("How long is Chicago's Navy Pier?", ["3,300 feet", "2,100 feet", "4,800 feet", "1,500 feet"], "3,300 feet", 3),
      // https://en.wikipedia.org/wiki/Navy_Pier
      q("Chicago's Navy Pier is in which neighborhood?", ["Streeterville", "River North", "Gold Coast", "Near South"], "Streeterville", 3),
      // https://en.wikipedia.org/wiki/Chicago_Harbor_Light
      q("The Chicago Harbor Light was first built for which event?", ["World's Columbian Exposition", "Century of Progress Fair", "Great Lakes Exposition", "Railroad Fair of 1948"], "World's Columbian Exposition", 3),
      // https://en.wikipedia.org/wiki/Promontory_Point_(Chicago)
      q("Chicago's Promontory Point is a manmade peninsula in which park?", ["Burnham Park", "Jackson Park", "Grant Park", "Lincoln Park"], "Burnham Park", 3),
      // https://en.wikipedia.org/wiki/Maxwell_Street
      q("Chicago's Maxwell Street meets which street near Roosevelt Road?", ["Halsted Street", "Ashland Avenue", "Canal Street", "Racine Avenue"], "Halsted Street", 3),
      // https://en.wikipedia.org/wiki/Pullman_National_Historical_Park
      q("Chicago's Pullman was the first planned … community in the US?", ["industrial", "lakefront", "suburban", "religious"], "industrial", 3),
      // https://en.wikipedia.org/wiki/Pullman_National_Historical_Park
      q("Chicago's Pullman district hotel is named after George Pullman's daughter…", ["Florence", "Harriet", "Emily", "Louise"], "Florence", 3),
      // https://en.wikipedia.org/wiki/Pullman_National_Historical_Park
      q("The porter museum in Chicago's Pullman district honors which labor leader?", ["A. Philip Randolph", "Eugene V. Debs", "Samuel Gompers", "Bayard Rustin"], "A. Philip Randolph", 3),
      // https://en.wikipedia.org/wiki/Garfield_Park_Conservatory
      q("Which landscape architect created Chicago's Garfield Park Conservatory?", ["Jens Jensen", "Alfred Caldwell", "Frederick Olmsted", "Ossian Simonds"], "Jens Jensen", 3),
      // https://en.wikipedia.org/wiki/Chicago_Water_Tower
      q("Who designed the Chicago Water Tower in 1869?", ["William W. Boyington", "John Van Osdel", "William Le Baron Jenney", "Peter B. Wight"], "William W. Boyington", 3),
      // https://en.wikipedia.org/wiki/Chicago_Water_Tower
      q("The Chicago Water Tower stands in which small plaza?", ["Jane M. Byrne Plaza", "Daley Center Plaza", "Pioneer Court Plaza", "Washington Square"], "Jane M. Byrne Plaza", 3),
      // https://en.wikipedia.org/wiki/Wrigley_Building
      q("Which firm designed Chicago's Wrigley Building?", ["Graham, Anderson, Probst & White", "Holabird & Roche", "Burnham & Root", "Shepley, Rutan & Coolidge"], "Graham, Anderson, Probst & White", 3),
      // https://en.wikipedia.org/wiki/Calumet_River
      q("The name of Chicago's Calumet River refers to a ceremonial…", ["pipe", "drum", "canoe", "blanket"], "pipe", 3),
      // https://en.wikipedia.org/wiki/Calumet_River
      q("Which lock and dam restricts flow on Chicago's Calumet River?", ["T.J. O'Brien Lock", "Lockport Lock", "Brandon Road Lock", "Dresden Island Lock"], "T.J. O'Brien Lock", 3),
      // https://en.wikipedia.org/wiki/Superdawg
      q("Chicago's Superdawg opened in what year?", ["1948", "1939", "1956", "1962"], "1948", 3),
      // https://en.wikipedia.org/wiki/Superdawg
      q("The hot dog figures atop Chicago's Superdawg are named Maurie and…", ["Flaurie", "Laurie", "Marie", "Fanny"], "Flaurie", 3),
      // https://en.wikipedia.org/wiki/Biograph_Theater
      q("Who designed Chicago's Biograph Theater in 1914?", ["Samuel N. Crowen", "John Eberson", "C. W. Rapp", "Henry Ericsson"], "Samuel N. Crowen", 3),
      // https://en.wikipedia.org/wiki/Biograph_Theater
      q("Anna Sage, at Chicago's Biograph with Dillinger, was called The Woman in…", ["Red", "Black", "White", "Blue"], "Red", 3),
      // https://en.wikipedia.org/wiki/Green_Mill_Cocktail_Lounge
      q("Chicago's Green Mill traces its roots to whose roadhouse?", ["Pop Morse's", "Ma Barker's", "Doc Kelly's", "Big Jim's"], "Pop Morse's", 3),
      // https://en.wikipedia.org/wiki/Green_Mill_Cocktail_Lounge
      q("Chicago's current Green Mill venue opened in what year?", ["1935", "1921", "1947", "1907"], "1935", 3),
      // https://en.wikipedia.org/wiki/Peggy_Notebaert_Nature_Museum
      q("Chicago's Notebaert Nature Museum opened its current building in…", ["1999", "1986", "2006", "1993"], "1999", 3),
      // https://en.wikipedia.org/wiki/Peggy_Notebaert_Nature_Museum
      q("Chicago's Academy of Sciences long occupied which Lincoln Park building?", ["Matthew Laflin Memorial", "Elks National Memorial", "Couch Mausoleum", "Field Building"], "Matthew Laflin Memorial", 3),
      // https://en.wikipedia.org/wiki/Promontory_Point_(Chicago)
      q("Chicago's Promontory Point opened to the public in what year?", ["1937", "1924", "1948", "1955"], "1937", 3),
      // https://en.wikipedia.org/wiki/Promontory_Point_(Chicago)
      q("Alfred Caldwell's stone circles at Chicago's Promontory Point are called…", ["council rings", "fire circles", "prairie rings", "stone hearths"], "council rings", 3),
    ],
  },
};
