import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Red-tier Local fill (Keyline 0.1.100 batch): hard (diff 3) Local cards so every city reaches 30 red Local cards
 * for placed (Hearth) lanterns. Reason: Local was the only field under 30 red in all 15 cities (poolCensus, main 06e8c05).
 * Batch 1 covers the four thinnest cities (Nashville, SF, Seattle, Denver). City cards step up one rarity rung, so a
 * hard city card bands red only ~25% of the time (amber→red), not 60%. No math (math is capped). Each card is sourced from the Wikipedia article on its subject (URL above each card).
 * Merged into CITY_EXTRA by cities.ts (rarity stamped there with the city nudge).
 */
export const CITY_EXTRA_PART_H: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  nashville: {
    local: [
      // https://en.wikipedia.org/wiki/Ryman_Auditorium
      q("Before taking the Ryman name, Nashville's Ryman Auditorium opened in 1892 as the…", ["Union Gospel Tabernacle", "Cumberland Music Hall", "Broadway Revival Hall", "Nashville Opera House"], "Union Gospel Tabernacle", 3),
      // https://en.wikipedia.org/wiki/Ryman_Auditorium
      q("Thomas Ryman built his Nashville tabernacle after being converted at a tent revival by preacher…", ["Samuel Porter Jones", "Dwight L. Moody", "Billy Sunday", "Charles Finney"], "Samuel Porter Jones", 3),
      // https://en.wikipedia.org/wiki/Ryman_Auditorium
      q("Which architect designed Nashville's Ryman Auditorium?", ["Hugh Cathcart Thompson", "William Crawford Smith", "Henry Hobson Richardson", "Bryant Fleming"], "Hugh Cathcart Thompson", 3),
      // https://en.wikipedia.org/wiki/Parthenon_(Nashville)
      q("Which architect designed Nashville's Parthenon replica?", ["William Crawford Smith", "Hugh Cathcart Thompson", "Bryant Fleming", "William Strickland"], "William Crawford Smith", 3),
      // https://en.wikipedia.org/wiki/Parthenon_(Nashville)
      q("Nashville's Parthenon replica stands in which park?", ["Centennial Park", "Shelby Park", "Percy Warner Park", "Riverfront Park"], "Centennial Park", 3),
      // https://en.wikipedia.org/wiki/Fisk_Jubilee_Singers
      q("Which Fisk treasurer and music director organized the first Jubilee Singers?", ["George Leonard White", "Erastus Milo Cravath", "Clinton B. Fisk", "John Wesley Work"], "George Leonard White", 3),
      // https://en.wikipedia.org/wiki/Fisk_Jubilee_Singers
      q("The Fisk Jubilee Singers' first tour stop in 1871 was in which city?", ["Cincinnati", "Louisville", "Pittsburgh", "St. Louis"], "Cincinnati", 3),
      // https://en.wikipedia.org/wiki/Fisk_Jubilee_Singers
      q("On their first tour, Nashville's Fisk Jubilee Singers gave their profit to victims of the…", ["Great Chicago Fire", "Johnstown Flood", "Boston fire", "Memphis yellow fever"], "Great Chicago Fire", 3),
      // https://en.wikipedia.org/wiki/Belle_Meade_Plantation
      q("Which family owned Belle Meade for five generations?", ["Harding-Jackson", "Cheek-Wood", "Overton-Polk", "Donelson-Lea"], "Harding-Jackson", 3),
      // https://en.wikipedia.org/wiki/333_Commerce
      q("On Tennessee driver's licenses, the Batman Building appeared beside Knoxville's…", ["Sunsphere", "Tower Bridge", "Henley Bridge", "Market Square"], "Sunsphere", 3),
      // https://en.wikipedia.org/wiki/Cheekwood_Botanical_Garden_and_Museum_of_Art
      q("Cheekwood's builders, the Cheek family, made their fortune partly from which coffee brand?", ["Maxwell House", "Folgers", "Chock full o'Nuts", "Hills Bros."], "Maxwell House", 3),
      // https://en.wikipedia.org/wiki/Cheekwood_Botanical_Garden_and_Museum_of_Art
      q("Which architect designed Nashville's Cheekwood mansion and gardens?", ["Bryant Fleming", "Stanford White", "Frederick Law Olmsted", "Addison Mizner"], "Bryant Fleming", 3),
      // https://en.wikipedia.org/wiki/Union_Station_(Nashville)
      q("Nashville's Union Station was built mainly for which railroad?", ["Louisville and Nashville", "Illinois Central", "Southern Railway", "Norfolk and Western"], "Louisville and Nashville", 3),
      // https://en.wikipedia.org/wiki/Union_Station_(Nashville)
      q("The last passenger train left Nashville's Union Station in…", ["1978", "1958", "1968", "1988"], "1978", 3),
      // https://en.wikipedia.org/wiki/Fort_Negley
      q("Nashville's Civil War Fort Negley was built atop which hill?", ["St. Cloud Hill", "Capitol Hill", "Kirkpatrick Hill", "Love Hill"], "St. Cloud Hill", 3),
      // https://en.wikipedia.org/wiki/Fort_Negley
      q("Fort Negley was built in which shape?", ["star", "hexagon", "square", "triangle"], "star", 3),
      // https://en.wikipedia.org/wiki/Percy_Priest_Lake
      q("Which Tennessee town was flooded to create Percy Priest Lake?", ["Old Jefferson", "Old Hickory", "Hermitage", "Smyrna"], "Old Jefferson", 3),
      // https://en.wikipedia.org/wiki/Schermerhorn_Symphony_Center
      q("Which flower, Tennessee's state flower, is a motif in Schermerhorn Symphony Center?", ["iris", "magnolia", "dogwood", "rose"], "iris", 3),
      // https://en.wikipedia.org/wiki/Hatch_Show_Print
      q("Hatch Show Print's first handbill advertised a talk by which preacher, Harriet Beecher Stowe's brother?", ["Henry Ward Beecher", "Lyman Beecher", "Edward Beecher", "Charles Beecher"], "Henry Ward Beecher", 3),
      // https://en.wikipedia.org/wiki/Hatch_Show_Print
      q("From 1925 to 1992, Hatch Show Print's shop sat behind the…", ["Ryman Auditorium", "State Capitol", "Union Station", "Maxwell House Hotel"], "Ryman Auditorium", 3),
      // https://en.wikipedia.org/wiki/Adelicia_Acklen
      q("Who built Nashville's Belmont Mansion with her second husband?", ["Adelicia Acklen", "Rachel Jackson", "Sarah Polk", "Mabel Cheek"], "Adelicia Acklen", 3),
      // https://en.wikipedia.org/wiki/Adelicia_Acklen
      q("Adelicia Acklen sold Louisiana plantations that became which state prison?", ["Angola", "Parchman", "Huntsville", "Cummins"], "Angola", 3),
      // https://en.wikipedia.org/wiki/Radnor_Lake_State_Park
      q("Which railroad created Nashville's Radnor Lake in 1914?", ["Louisville and Nashville", "Illinois Central Railroad", "Tennessee Central Railway", "Southern Railway Company"], "Louisville and Nashville", 3),
      // https://en.wikipedia.org/wiki/Radnor_Lake_State_Park
      q("Radnor Lake was first used to supply water for steam locomotives and…", ["livestock pens", "a brewery", "city taps", "a paper mill"], "livestock pens", 3),
      // https://en.wikipedia.org/wiki/Herschel_Greer_Stadium
      q("Herschel Greer Stadium was built on the grounds of which Civil War fort?", ["Fort Negley", "Fort Donelson", "Fort Gillem", "Fort Houston"], "Fort Negley", 3),
      // https://en.wikipedia.org/wiki/Herschel_Greer_Stadium
      q("Herschel Greer Stadium, the Sounds' first home, opened in…", ["1978", "1968", "1985", "1993"], "1978", 3),
      // https://en.wikipedia.org/wiki/Opryland_USA
      q("Which shopping mall replaced Nashville's Opryland USA theme park?", ["Opry Mills", "Opry Commons", "Music Valley Mall", "Cumberland Mall"], "Opry Mills", 3),
      // https://en.wikipedia.org/wiki/Opryland_USA
      q("Opryland USA sat between the Cumberland River and which parkway?", ["Briley Parkway", "Natchez Trace", "Ellington Parkway", "Old Hickory Boulevard"], "Briley Parkway", 3),
      // https://en.wikipedia.org/wiki/Maxwell_House_Hotel
      q("Nashville's Maxwell House Hotel was named for the wife of builder…", ["John Overton Jr.", "Thomas Ryman", "Joel Cheek", "John Harding"], "John Overton Jr.", 3),
      // https://en.wikipedia.org/wiki/Maxwell_House_Hotel
      q("Which architect designed Nashville's Maxwell House Hotel?", ["Isaiah Rogers", "William Strickland", "Henry Richardson", "Hugh Thompson"], "Isaiah Rogers", 3),
      // https://en.wikipedia.org/wiki/Maxwell_House_Hotel
      q("Nashville's Maxwell House Hotel was demolished in…", ["1961", "1931", "1947", "1979"], "1961", 3),
      // https://en.wikipedia.org/wiki/Nashville_International_Airport
      q("Nashville International Airport took its current name in…", ["1988", "1937", "1961", "2001"], "1988", 3),
      // https://en.wikipedia.org/wiki/Nashville_International_Airport
      q("Which Air National Guard base shares Nashville's airport?", ["Joint Base Berry Field", "McGhee Tyson", "Arnold Air Base", "Millington Field"], "Joint Base Berry Field", 3),
      // https://en.wikipedia.org/wiki/Fisk_University
      q("Fisk University is named for Union general and Freedmen's Bureau officer…", ["Clinton B. Fisk", "Oliver O. Howard", "George H. Thomas", "James Negley"], "Clinton B. Fisk", 3),
      // https://en.wikipedia.org/wiki/Fisk_University
      q("In 1930 Fisk became the first historically Black school accredited by…", ["SACS", "the NCAA", "the AAU", "Phi Beta Kappa"], "SACS", 3),
      // https://en.wikipedia.org/wiki/Bridgestone_Arena
      q("Before Bridgestone, the Predators' arena was called the Gaylord Entertainment Center and the…", ["Sommet Center", "Music City Arena", "Nissan Pavilion", "Broadway Center"], "Sommet Center", 3),
      // https://en.wikipedia.org/wiki/Bridgestone_Arena
      q("Bridgestone Arena is set at an angle as a nod to which nearby venue?", ["Ryman Auditorium", "State Capitol", "Union Station", "Schermerhorn"], "Ryman Auditorium", 3),
      // https://en.wikipedia.org/wiki/Music_City_Center
      q("Nashville's Music City Center convention complex opened in…", ["2013", "2006", "2009", "2017"], "2013", 3),
      // https://en.wikipedia.org/wiki/Nashville_Zoo_at_Grassmere
      q("The Nashville Zoo sits on Grassmere, a former farm of which family?", ["Dunn", "Cheek", "Harding", "Overton"], "Dunn", 3),
      // https://en.wikipedia.org/wiki/Lane_Motor_Museum
      q("Nashville's Lane Motor Museum is housed in a former…", ["bread bakery", "tire factory", "rail depot", "post office"], "bread bakery", 3),
      // https://en.wikipedia.org/wiki/Lane_Motor_Museum
      q("The Lane Motor Museum owns 23 cars from which Czech maker?", ["Tatra", "Skoda", "Praga", "Aero"], "Tatra", 3),
      // https://en.wikipedia.org/wiki/Musicians_Hall_of_Fame_and_Museum
      q("Nashville's Musicians Hall of Fame first opened to the public in…", ["2006", "1996", "2001", "2013"], "2006", 3),
      // https://en.wikipedia.org/wiki/Centennial_Park_(Nashville)
      q("Centennial Park was opened as a city park in…", ["1903", "1897", "1913", "1925"], "1903", 3),
      // https://en.wikipedia.org/wiki/Centennial_Park_(Nashville)
      q("Which hospital company built its headquarters beside Centennial Park?", ["Hospital Corporation of America", "Baptist Health Systems Inc", "Ascension Saint Thomas Health", "Community Health Systems"], "Hospital Corporation of America", 3),
      // https://en.wikipedia.org/wiki/Hermitage_Hotel
      q("The Hermitage Hotel became a landmark for its role in ratifying which amendment?", ["19th Amendment", "15th Amendment", "18th Amendment", "21st Amendment"], "19th Amendment", 3),
      // https://en.wikipedia.org/wiki/Tennessee_State_University
      q("Tennessee State University opened in 1912 as an Agricultural & Industrial State…", ["Normal School", "Teachers Academy", "Mechanics Institute", "Freedmen's College"], "Normal School", 3),
      // https://en.wikipedia.org/wiki/Meharry_Medical_College
      q("Meharry began in 1876 as the medical department of which school?", ["Central Tennessee College", "Fisk University", "Roger Williams University", "Vanderbilt University"], "Central Tennessee College", 3),
      // https://en.wikipedia.org/wiki/Meharry_Medical_College
      q("Meharry Medical College is affiliated with which church?", ["United Methodist Church", "Southern Baptist", "Presbyterian Church", "Episcopal Church"], "United Methodist Church", 3),
      // https://en.wikipedia.org/wiki/Opryland_USA
      q("Opryland USA's park was built by WSM, Inc. to go with the new…", ["Grand Ole Opry House", "Ryman Auditorium", "Opryland Hotel", "Music Row studios"], "Grand Ole Opry House", 3),
      // https://en.wikipedia.org/wiki/Travellers_Rest_(Nashville,_Tennessee)
      q("Nashville's Travellers Rest plantation house was built in 1799 by judge…", ["John Overton", "John Harding", "James Robertson", "Felix Grundy"], "John Overton", 3),
      // https://en.wikipedia.org/wiki/Travellers_Rest_(Nashville,_Tennessee)
      q("Nashville's Travellers Rest was also known by which grim name?", ["Golgotha", "Gethsemane", "Calvary", "Tophet"], "Golgotha", 3),
      // https://en.wikipedia.org/wiki/Belmont_University
      q("Nashville's Belmont Women's College was founded in 1890 by Ida Hood and…", ["Susan Heron", "Adelicia Acklen", "Mary Sharp", "Ellen Cheek"], "Susan Heron", 3),
      // https://en.wikipedia.org/wiki/Belmont_University
      q("In 2007 Nashville's Belmont University cut its ties with the Tennessee…", ["Baptist Convention", "Methodist Conference", "Presbyterian Synod", "Churches of Christ"], "Baptist Convention", 3),
      // https://en.wikipedia.org/wiki/Lipscomb_University
      q("Nashville's Lipscomb University is affiliated with the…", ["Churches of Christ", "Southern Baptists", "United Methodists", "Presbyterians"], "Churches of Christ", 3),
      // https://en.wikipedia.org/wiki/Lipscomb_University
      q("Lipscomb University was founded in 1891 by David Lipscomb and…", ["James A. Harding", "John Overton", "Ida Hood", "Philip Fall"], "James A. Harding", 3),
      // https://en.wikipedia.org/wiki/Tennessee_Performing_Arts_Center
      q("Nashville's Tennessee Performing Arts Center sits in which cultural center?", ["James K. Polk", "Andrew Jackson", "Sam Houston", "Davy Crockett"], "James K. Polk", 3),
      // https://en.wikipedia.org/wiki/Stahlman_Building
      q("When Nashville's Stahlman Building opened in 1907, it housed the Fourth…", ["National Bank", "Street Theatre", "Avenue Hotel", "Ward Office"], "National Bank", 3),
      // https://en.wikipedia.org/wiki/Stahlman_Building
      q("Since 1967 the roof of Nashville's Stahlman Building has carried neon call letters for which station?", ["WKDF", "WSM", "WLAC", "WSIX"], "WKDF", 3),
      // https://en.wikipedia.org/wiki/Customs_House_(Nashville,_Tennessee)
      q("Nashville's Customs House was built of limestone from which Kentucky city?", ["Bowling Green", "Louisville", "Lexington", "Paducah"], "Bowling Green", 3),
      // https://en.wikipedia.org/wiki/Downtown_Presbyterian_Church
      q("Nashville's Downtown Presbyterian Church is a landmark for its rare…", ["Egyptian Revival", "Gothic Revival", "Moorish Revival", "Spanish Mission"], "Egyptian Revival", 3),
      // https://en.wikipedia.org/wiki/Downtown_Presbyterian_Church
      q("Before taking the name Downtown, Nashville's Downtown Presbyterian Church was called…", ["First Presbyterian", "Old Stone Presbyterian", "Capitol Presbyterian", "Union Presbyterian"], "First Presbyterian", 3),
      // https://en.wikipedia.org/wiki/Christ_Church_Cathedral_(Nashville,_Tennessee)
      q("Nashville's Christ Church Cathedral serves which church's Diocese of Tennessee?", ["Episcopal", "Catholic", "Methodist", "Lutheran"], "Episcopal", 3),
      // https://en.wikipedia.org/wiki/Nashville_National_Cemetery
      q("Nashville National Cemetery lies in which Nashville neighborhood?", ["Madison", "Antioch", "Bellevue", "Donelson"], "Madison", 3),
      // https://en.wikipedia.org/wiki/Mount_Olivet_Cemetery_(Nashville)
      q("Nashville's Mount Olivet Cemetery was modeled on which Massachusetts cemetery?", ["Mount Auburn", "Forest Hills", "Sleepy Hollow", "Oak Grove"], "Mount Auburn", 3),
      // https://en.wikipedia.org/wiki/Mount_Olivet_Cemetery_(Nashville)
      q("Which Catholic cemetery adjoins Nashville's Mount Olivet?", ["Calvary", "St. Mary's", "Holy Cross", "Resurrection"], "Calvary", 3),
      // https://en.wikipedia.org/wiki/Adventure_Science_Center
      q("Nashville's Adventure Science Center opened in 1945 as the…", ["Children's Museum", "Science Hall", "Discovery Center", "Nature Museum"], "Children's Museum", 3),
      // https://en.wikipedia.org/wiki/Adventure_Science_Center
      q("What is the planetarium at Nashville's Adventure Science Center called?", ["Sudekum", "Frist", "Ingram", "Bridgestone"], "Sudekum", 3),
      // https://en.wikipedia.org/wiki/Fairgrounds_Speedway
      q("Nashville Fairgrounds Speedway held top-level NASCAR Cup races from 1958 to…", ["1984", "1972", "1996", "2001"], "1984", 3),
      // https://en.wikipedia.org/wiki/Sulphur_Dell
      q("Nashville's old Sulphur Dell ballpark stood just north of the…", ["State Capitol", "Ryman", "Union Station", "Cumberland bridge"], "State Capitol", 3),
      // https://en.wikipedia.org/wiki/Sulphur_Dell
      q("Nashville's Sulphur Dell ballpark was demolished in…", ["1969", "1955", "1978", "1984"], "1969", 3),
      // https://en.wikipedia.org/wiki/DeFord_Bailey
      q("Nashville Opry star DeFord Bailey was best known for playing the…", ["harmonica", "banjo", "fiddle", "mandolin"], "harmonica", 3),
      // https://en.wikipedia.org/wiki/Uncle_Dave_Macon
      q("Early Nashville Opry star Uncle Dave Macon was nicknamed The Dixie…", ["Dewdrop", "Songbird", "Dynamo", "Rambler"], "Dewdrop", 3),
      // https://en.wikipedia.org/wiki/Uncle_Dave_Macon
      q("Uncle Dave Macon, the Opry's first star, was best known for playing the…", ["banjo", "fiddle", "harmonica", "guitar"], "banjo", 3),
      // https://en.wikipedia.org/wiki/Tennessee_State_Museum
      q("Nashville's new Tennessee State Museum stands at Rosa Parks Boulevard and…", ["Jefferson Street", "Church Street", "Broadway", "Charlotte Avenue"], "Jefferson Street", 3),
      // https://en.wikipedia.org/wiki/Music_City_Bowl
      q("The first Music City Bowl in Nashville was played in 1998 at…", ["Vanderbilt Stadium", "Nissan Stadium", "Dudley Field", "Hale Stadium"], "Vanderbilt Stadium", 3),
      // https://en.wikipedia.org/wiki/Nashville_Symphony
      q("The Nashville Symphony was founded in…", ["1946", "1920", "1963", "1931"], "1946", 3),
      // https://en.wikipedia.org/wiki/Two_Rivers_(Nashville,_Tennessee)
      q("Nashville's Two Rivers Mansion was built in 1859 for David H.…", ["McGavock", "Harding", "Overton", "Donelson"], "McGavock", 3),
      // https://en.wikipedia.org/wiki/Peabody_College
      q("Nashville's Peabody College merged with Vanderbilt in…", ["1979", "1955", "1991", "1966"], "1979", 3),
      // https://en.wikipedia.org/wiki/American_Baptist_College
      q("Nashville's American Baptist College was earlier called American Baptist Theological…", ["Seminary", "Institute", "Academy", "School"], "Seminary", 3),
      // https://en.wikipedia.org/wiki/Trevecca_Nazarene_University
      q("Nashville's Trevecca Nazarene University takes its name from a college in…", ["Wales", "Scotland", "Ireland", "Cornwall"], "Wales", 3),
      // https://en.wikipedia.org/wiki/Trevecca_Nazarene_University
      q("Which minister founded Nashville's Trevecca in 1901?", ["J. O. McClurkan", "David Lipscomb", "Philip Fall", "James Harding"], "J. O. McClurkan", 3),
      // https://en.wikipedia.org/wiki/Marathon_Motor_Works
      q("From 1909 to 1914, Nashville's Marathon Motor Works built…", ["automobiles", "steam boilers", "bicycles", "tractors"], "automobiles", 3),
      // https://en.wikipedia.org/wiki/Tulip_Grove
      q("Tulip Grove near the Hermitage was built for Andrew Jackson's nephew…", ["Andrew Jackson Donelson", "John Coffee", "Andrew Jackson Jr.", "Samuel Donelson"], "Andrew Jackson Donelson", 3),
      // https://en.wikipedia.org/wiki/Clover_Bottom_Mansion
      q("Nashville's Clover Bottom Mansion is home to the Tennessee…", ["Historical Commission", "State Museum", "Arts Commission", "Preservation Trust"], "Historical Commission", 3),
      // https://en.wikipedia.org/wiki/Rachel_Jackson
      q("Rachel Jackson died at the Hermitage near Nashville in…", ["1828", "1832", "1845", "1819"], "1828", 3),
      // https://en.wikipedia.org/wiki/Rachel_Jackson
      q("Rachel Jackson's niece who served as Andrew Jackson's White House hostess was…", ["Emily Donelson", "Sarah Polk", "Mary Eastin", "Rachel Hays"], "Emily Donelson", 3),
      // https://en.wikipedia.org/wiki/James_Robertson_Parkway
      q("Nashville's downtown bypass James Robertson Parkway is maintained by…", ["TDOT", "Metro Nashville", "the Corps of Engineers", "Davidson County"], "TDOT", 3),
      // https://en.wikipedia.org/wiki/Percy_Priest_Lake
      q("Before it honored a congressman, Nashville's Percy Priest dam project was called the…", ["Stewarts Ferry Reservoir", "Stones River Reservoir", "Old Jefferson Reservoir", "Cumberland Reservoir"], "Stewarts Ferry Reservoir", 3),
      // https://en.wikipedia.org/wiki/Fort_Negley
      q("Nashville's Fort Negley was named for Union general…", ["James S. Negley", "George H. Thomas", "Ulysses S. Grant", "Don Carlos Buell"], "James S. Negley", 3),
      // https://en.wikipedia.org/wiki/Fisk_University
      q("Fisk was founded in Nashville by John Ogden, Edward P. Smith and…", ["Erastus Milo Cravath", "George Leonard White", "Clinton B. Fisk", "Oliver O. Howard"], "Erastus Milo Cravath", 3),
      // https://en.wikipedia.org/wiki/Union_Station_(Nashville)
      q("Which L&N engineer planned Nashville's Union Station?", ["Richard Montfort", "Hugh Thompson", "William Strickland", "Jarvis Hunt"], "Richard Montfort", 3),
      // https://en.wikipedia.org/wiki/Belle_Meade_Plantation
      q("The Belle Meade mansion in Nashville was built in 1853 in which style?", ["Greek Revival", "Gothic Revival", "Italianate", "Queen Anne"], "Greek Revival", 3),
      // https://en.wikipedia.org/wiki/Meharry_Medical_College
      q("Nashville's Meharry Medical College received its own charter in…", ["1915", "1876", "1898", "1932"], "1915", 3),
      // https://en.wikipedia.org/wiki/Hermitage_Hotel
      q("Nashville's Hermitage Hotel was commissioned in 1908 by how many local residents?", ["250", "50", "1,000", "12"], "250", 3),
      // https://en.wikipedia.org/wiki/Schermerhorn_Symphony_Center
      q("Nashville's Schermerhorn Symphony Center is named for longtime conductor…", ["Kenneth Schermerhorn", "Leonard Slatkin", "Giancarlo Guerrero", "Thor Johnson"], "Kenneth Schermerhorn", 3),
    ],
  },
  sf: {
    local: [
      // https://en.wikipedia.org/wiki/San_Francisco_Mint
      q("Coins struck at the San Francisco Mint carry which mint mark?", ["S", "D", "P", "W"], "S", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_Mint
      q("The San Francisco Mint first opened in 1854 to serve the…", ["Gold Rush mines", "Comstock silver", "Pacific fleet", "Hawaiian trade"], "Gold Rush mines", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_Mint
      q("San Francisco's Old Mint building opened in…", ["1874", "1854", "1906", "1937"], "1874", 3),
      // https://en.wikipedia.org/wiki/Cliff_House,_San_Francisco
      q("The terrace of San Francisco's Cliff House holds a room-sized…", ["camera obscura", "brass sundial", "ship's foghorn", "star telescope"], "camera obscura", 3),
      // https://en.wikipedia.org/wiki/Cliff_House,_San_Francisco
      q("San Francisco's Cliff House stands in which neighborhood?", ["Outer Richmond", "Outer Sunset", "Sea Cliff", "Presidio Heights"], "Outer Richmond", 3),
      // https://en.wikipedia.org/wiki/Palace_Hotel,_San_Francisco
      q("While San Francisco's Palace Hotel was rebuilt after 1906, guests used a temporary hotel nicknamed the…", ["Baby Palace", "Little Palace", "Tent Palace", "Palace Annex"], "Baby Palace", 3),
      // https://en.wikipedia.org/wiki/Palace_Hotel,_San_Francisco
      q("San Francisco's rebuilt Palace Hotel opened in…", ["1909", "1906", "1915", "1922"], "1909", 3),
      // https://en.wikipedia.org/wiki/Salesforce_Tower
      q("Which architect designed San Francisco's Salesforce Tower?", ["César Pelli", "William Pereira", "Renzo Piano", "Mario Botta"], "César Pelli", 3),
      // https://en.wikipedia.org/wiki/Salesforce_Tower
      q("Before Salesforce leased it, San Francisco's Salesforce Tower was called…", ["Transbay Tower", "Mission Tower", "Market Tower", "Bayview Tower"], "Transbay Tower", 3),
      // https://en.wikipedia.org/wiki/Twin_Peaks_(San_Francisco)
      q("San Francisco's North and South Twin Peaks are also called Eureka and…", ["Noe", "Sutro", "Dolores", "Castro"], "Noe", 3),
      // https://en.wikipedia.org/wiki/Spreckels_Temple_of_Music
      q("Golden Gate Park's Spreckels Temple of Music was paid for by sugar magnate…", ["Claus Spreckels", "Adolph Spreckels", "James Flood", "Henry Miller"], "Claus Spreckels", 3),
      // https://en.wikipedia.org/wiki/Spreckels_Temple_of_Music
      q("Golden Gate Park's Spreckels bandshell was dedicated on which state holiday in 1900?", ["Admission Day", "Arbor Day", "Flag Day", "Founders Day"], "Admission Day", 3),
      // https://en.wikipedia.org/wiki/Hallidie_Building
      q("San Francisco's Hallidie Building is famous as an early…", ["glass curtain wall", "steel skyscraper", "concrete dome", "cable car barn"], "glass curtain wall", 3),
      // https://en.wikipedia.org/wiki/Hallidie_Building
      q("Which architect designed San Francisco's 1918 Hallidie Building?", ["Willis Polk", "Arthur Brown Jr.", "Julia Morgan", "Bernard Maybeck"], "Willis Polk", 3),
      // https://en.wikipedia.org/wiki/Haas–Lilienthal_House
      q("San Francisco's Haas–Lilienthal House museum stands in which neighborhood?", ["Pacific Heights", "Nob Hill", "Russian Hill", "Cow Hollow"], "Pacific Heights", 3),
      // https://en.wikipedia.org/wiki/Transamerica_Pyramid
      q("San Francisco's Transamerica Pyramid was designed by William Pereira and…", ["Harry D. Som", "César Pelli", "Willis Polk", "Arthur Brown"], "Harry D. Som", 3),
      // https://en.wikipedia.org/wiki/Transamerica_Pyramid
      q("San Francisco's Transamerica Pyramid was completed in…", ["1972", "1964", "1981", "1989"], "1972", 3),
      // https://en.wikipedia.org/wiki/Columbus_Tower_(San_Francisco)
      q("San Francisco's green Sentinel Building is largely occupied by which film studio?", ["American Zoetrope", "Lucasfilm", "Pixar", "Fantasy Films"], "American Zoetrope", 3),
      // https://en.wikipedia.org/wiki/Wave_Organ
      q("San Francisco's Wave Organ sculpture was built in 1986 by which museum?", ["Exploratorium", "de Young", "SFMOMA", "Academy of Sciences"], "Exploratorium", 3),
      // https://en.wikipedia.org/wiki/Wave_Organ
      q("San Francisco's Wave Organ is dedicated to Exploratorium founder…", ["Frank Oppenheimer", "Robert Oppenheimer", "Peter Richards", "Luis Alvarez"], "Frank Oppenheimer", 3),
      // https://en.wikipedia.org/wiki/Fort_Mason
      q("San Francisco's Fort Mason is named for military governor…", ["Richard Barnes Mason", "John C. Frémont", "Stephen Kearny", "Bennet Riley"], "Richard Barnes Mason", 3),
      // https://en.wikipedia.org/wiki/Fort_Mason
      q("During World War II, San Francisco's Fort Mason was the main port for the…", ["Pacific campaign", "Atlantic convoys", "Alaska defense", "Panama Canal"], "Pacific campaign", 3),
      // https://en.wikipedia.org/wiki/Cow_Palace
      q("The Cow Palace on San Francisco's border was first called the California State…", ["Livestock Pavilion", "Fair Arena", "Cattle Exchange", "Rodeo Hall"], "Livestock Pavilion", 3),
      // https://en.wikipedia.org/wiki/Cow_Palace
      q("Which party held its 1956 and 1964 national conventions at the Cow Palace near San Francisco?", ["Republican", "Democratic", "Whig", "Progressive"], "Republican", 3),
      // https://en.wikipedia.org/wiki/Oracle_Park
      q("San Francisco's Oracle Park first opened in 2000 under which name?", ["Pacific Bell Park", "China Basin Park", "Bay Front Field", "Mission Bay Park"], "Pacific Bell Park", 3),
      // https://en.wikipedia.org/wiki/Chase_Center
      q("San Francisco's Chase Center stands in which neighborhood?", ["Mission Bay", "South Beach", "Dogpatch", "Potrero Hill"], "Mission Bay", 3),
      // https://en.wikipedia.org/wiki/Chase_Center
      q("San Francisco's Chase Center opened in…", ["2019", "2016", "2021", "2014"], "2019", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_Museum_of_Modern_Art
      q("Which architect designed SFMOMA's 1995 home in San Francisco's SoMa?", ["Mario Botta", "Renzo Piano", "Frank Gehry", "Daniel Libeskind"], "Mario Botta", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_Museum_of_Modern_Art
      q("SFMOMA was founded in 1935 with galleries in which San Francisco building?", ["Veterans Building", "City Hall", "Palace of Fine Arts", "Ferry Building"], "Veterans Building", 3),
      // https://en.wikipedia.org/wiki/Contemporary_Jewish_Museum
      q("San Francisco's Contemporary Jewish Museum was redesigned by architect…", ["Daniel Libeskind", "Santiago Calatrava", "Zaha Hadid", "Frank Gehry"], "Daniel Libeskind", 3),
      // https://en.wikipedia.org/wiki/Contemporary_Jewish_Museum
      q("San Francisco's Contemporary Jewish Museum moved into a former…", ["power substation", "fire station", "synagogue", "bank vault"], "power substation", 3),
      // https://en.wikipedia.org/wiki/War_Memorial_Opera_House
      q("In 1945 San Francisco's War Memorial Opera House hosted the founding conference of the…", ["United Nations", "League of Nations", "NATO", "World Bank"], "United Nations", 3),
      // https://en.wikipedia.org/wiki/War_Memorial_Opera_House
      q("Which 1951 peace treaty with Japan was signed at San Francisco's opera house?", ["Treaty of San Francisco", "Treaty of Tokyo", "Treaty of Portsmouth", "Treaty of Kanagawa"], "Treaty of San Francisco", 3),
      // https://en.wikipedia.org/wiki/California_Palace_of_the_Legion_of_Honor
      q("Before San Francisco's Legion of Honor was built, its site was the Golden Gate…", ["Cemetery", "Racetrack", "Quarry", "Army fort"], "Cemetery", 3),
      // https://en.wikipedia.org/wiki/California_Palace_of_the_Legion_of_Honor
      q("San Francisco's Legion of Honor museum was a gift of…", ["Alma Spreckels", "Lillie Coit", "Phoebe Hearst", "Jane Stanford"], "Alma Spreckels", 3),
      // https://en.wikipedia.org/wiki/Vaillancourt_Fountain
      q("San Francisco's Vaillancourt Fountain is also nicknamed…", ["Québec libre!", "Bay Waterfall", "Concrete Falls", "Embarcadero Rain"], "Québec libre!", 3),
      // https://en.wikipedia.org/wiki/Emperor_Norton
      q("San Francisco's Emperor Norton declared himself Emperor of the United States in…", ["1859", "1849", "1869", "1879"], "1859", 3),
      // https://en.wikipedia.org/wiki/Emperor_Norton
      q("Besides emperor, San Francisco's Joshua Norton also styled himself Protector of…", ["Mexico", "Canada", "Hawaii", "Panama"], "Mexico", 3),
      // https://en.wikipedia.org/wiki/Barbary_Coast,_San_Francisco
      q("San Francisco's Barbary Coast was centered on which street, now an avenue?", ["Pacific Street", "Kearny Street", "Market Street", "Mission Street"], "Pacific Street", 3),
      // https://en.wikipedia.org/wiki/Anchor_Brewing_Company
      q("San Francisco's Anchor Brewing was saved in 1965 by which washing-machine heir?", ["Fritz Maytag", "Adolph Coors", "August Busch", "Ken Grossman"], "Fritz Maytag", 3),
      // https://en.wikipedia.org/wiki/Anchor_Brewing_Company
      q("San Francisco's Anchor Brewing trademarked which style of beer?", ["steam beer", "cream ale", "porter", "bock"], "steam beer", 3),
      // https://en.wikipedia.org/wiki/Anchor_Brewing_Company
      q("San Francisco's Anchor Brewing stood on which hill?", ["Potrero Hill", "Bernal Heights", "Nob Hill", "Twin Peaks"], "Potrero Hill", 3),
      // https://en.wikipedia.org/wiki/Hunters_Point_Naval_Shipyard
      q("San Francisco's Hunters Point shipyard was bought by the Navy in…", ["1940", "1917", "1898", "1952"], "1940", 3),
      // https://en.wikipedia.org/wiki/Fairmont_San_Francisco
      q("San Francisco's Fairmont Hotel is named for mining magnate and senator…", ["James G. Fair", "James Flood", "Leland Stanford", "George Hearst"], "James G. Fair", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_Zoo
      q("Which famous signing gorilla was born at the San Francisco Zoo?", ["Koko", "Harambe", "Bushman", "Colo"], "Koko", 3),
      // https://en.wikipedia.org/wiki/Lake_Merced
      q("Which public golf course sits beside San Francisco's Lake Merced?", ["TPC Harding Park", "Lincoln Park", "Presidio Golf", "Sharp Park"], "TPC Harding Park", 3),
      // https://en.wikipedia.org/wiki/Golden_Gate_Park
      q("Golden Gate Park was built on sand dunes in an area then called the…", ["Outside Lands", "Western Addition", "Sand Hills", "Far Dunes"], "Outside Lands", 3),
      // https://en.wikipedia.org/wiki/Golden_Gate_Park
      q("Which engineer designed San Francisco's Golden Gate Park?", ["William Hammond Hall", "Frederick Law Olmsted", "John McLaren", "Calvert Vaux"], "William Hammond Hall", 3),
      // https://en.wikipedia.org/wiki/Salesforce_Transit_Center
      q("San Francisco's Salesforce Transit Center replaced the 1939…", ["Transbay Terminal", "Ferry Terminal", "Market Depot", "Third Street Station"], "Transbay Terminal", 3),
      // https://en.wikipedia.org/wiki/Kezar_Stadium
      q("San Francisco's high school championship game at Kezar Stadium is called the…", ["Turkey Bowl", "Bay Bowl", "Fog Bowl", "City Classic"], "Turkey Bowl", 3),
      // https://en.wikipedia.org/wiki/Candlestick_Park
      q("The Beatles played their last full public concert at San Francisco's…", ["Candlestick Park", "Cow Palace", "Kezar Stadium", "Fillmore"], "Candlestick Park", 3),
      // https://en.wikipedia.org/wiki/Candlestick_Park
      q("The last event at San Francisco's Candlestick Park was a 2014 concert by…", ["Paul McCartney", "the Rolling Stones", "Metallica", "Bruce Springsteen"], "Paul McCartney", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_City_Hall
      q("Who was the principal architect of San Francisco City Hall?", ["Arthur Brown Jr.", "Willis Polk", "Daniel Burnham", "Julia Morgan"], "Arthur Brown Jr.", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_City_Hall
      q("San Francisco's current City Hall reopened in…", ["1915", "1906", "1926", "1937"], "1915", 3),
      // https://en.wikipedia.org/wiki/Grace_Cathedral,_San_Francisco
      q("San Francisco's Grace Cathedral belongs to which church?", ["Episcopal", "Catholic", "Methodist", "Lutheran"], "Episcopal", 3),
      // https://en.wikipedia.org/wiki/Coit_Tower
      q("San Francisco's Coit Tower stands in which park?", ["Pioneer Park", "Lincoln Park", "Alta Plaza", "Washington Square"], "Pioneer Park", 3),
      // https://en.wikipedia.org/wiki/Coit_Tower
      q("The murals inside San Francisco's Coit Tower are mostly painted in…", ["fresco", "oil", "tempera", "mosaic"], "fresco", 3),
      // https://en.wikipedia.org/wiki/Sea_Cliff,_San_Francisco
      q("Before San Francisco existed, the Spanish called today's Sea Cliff area…", ["Coyote Gulch", "Wolf Hollow", "Fox Point", "Bear Cove"], "Coyote Gulch", 3),
      // https://en.wikipedia.org/wiki/Sea_Cliff,_San_Francisco
      q("San Francisco's Sea Cliff neighborhood was master-planned by landscape architect…", ["Mark Daniels", "John McLaren", "Lawrence Halprin", "William Hall"], "Mark Daniels", 3),
      // https://en.wikipedia.org/wiki/Mount_Sutro
      q("San Francisco's Mount Sutro was originally named Mount…", ["Parnassus", "Olympus", "Davidson", "Diablo"], "Parnassus", 3),
      // https://en.wikipedia.org/wiki/Mount_Sutro
      q("Most of San Francisco's Mount Sutro is owned by…", ["UCSF", "Stanford", "the Presidio Trust", "the Sutro family"], "UCSF", 3),
      // https://en.wikipedia.org/wiki/Adolph_Sutro
      q("Before becoming San Francisco's mayor, Adolph Sutro made a fortune at the…", ["Comstock Lode", "Klondike", "Mother Lode", "Grass Valley"], "Comstock Lode", 3),
      // https://en.wikipedia.org/wiki/Adolph_Sutro
      q("Adolph Sutro, later San Francisco's mayor, was born in which city?", ["Aachen", "Hamburg", "Berlin", "Munich"], "Aachen", 3),
      // https://en.wikipedia.org/wiki/Bernal_Heights_Summit
      q("The tower atop San Francisco's Bernal Heights Summit is nicknamed…", ["Sutrito", "Little Sutro", "Baby Tower", "Bernalito"], "Sutrito", 3),
      // https://en.wikipedia.org/wiki/Glen_Canyon_Park
      q("Which free-flowing creek runs through San Francisco's Glen Canyon Park?", ["Islais Creek", "Lobos Creek", "Mission Creek", "Yosemite Creek"], "Islais Creek", 3),
      // https://en.wikipedia.org/wiki/Yerba_Buena_Gardens
      q("A pedestrian bridge at San Francisco's Yerba Buena Gardens sits atop part of which convention center?", ["Moscone Center", "Cow Palace", "Fort Mason", "Civic Auditorium"], "Moscone Center", 3),
      // https://en.wikipedia.org/wiki/Yerba_Buena_Gardens
      q("San Francisco's Yerba Buena Gardens' second block is dedicated to…", ["Martin Luther King Jr.", "Harvey Bernard Milk", "Cesar Estrada Chavez", "Robert F. Kennedy"], "Martin Luther King Jr.", 3),
      // https://en.wikipedia.org/wiki/San_Francisco_Botanical_Garden
      q("Before its current name, San Francisco's Botanical Garden in Golden Gate Park was called which arboretum?", ["Strybing Arboretum", "Hagiwara Arboretum", "McLaren Arboretum", "Spreckels Arboretum"], "Strybing Arboretum", 3),
      // https://en.wikipedia.org/wiki/Makoto_Hagiwara
      q("Makoto Hagiwara of San Francisco's Japanese Tea Garden is often credited with inventing the…", ["fortune cookie", "bonsai shop", "tea bag", "sushi roll"], "fortune cookie", 3),
      // https://en.wikipedia.org/wiki/Cathedral_of_Saint_Mary_of_the_Assumption_(San_Francisco)
      q("San Francisco's present St. Mary's Cathedral was completed in…", ["1970", "1962", "1891", "1985"], "1970", 3),
      // https://en.wikipedia.org/wiki/Cathedral_of_Saint_Mary_of_the_Assumption_(San_Francisco)
      q("San Francisco's St. Mary's Cathedral stands in which neighborhood?", ["Cathedral Hill", "Nob Hill", "Western Addition", "Lower Haight"], "Cathedral Hill", 3),
      // https://en.wikipedia.org/wiki/Portsmouth_Square
      q("San Francisco's Portsmouth Square is named for a U.S. Navy…", ["ship", "admiral", "fort", "shipyard"], "ship", 3),
      // https://en.wikipedia.org/wiki/Portsmouth_Square
      q("San Francisco's Portsmouth Square sits in which neighborhood?", ["Chinatown", "North Beach", "Union Square", "Nob Hill"], "Chinatown", 3),
      // https://en.wikipedia.org/wiki/Balclutha_(ship)
      q("San Francisco's tall ship Balclutha was built in 1886 in which city?", ["Glasgow", "Liverpool", "Belfast", "Bristol"], "Glasgow", 3),
      // https://en.wikipedia.org/wiki/USS_Pampanito
      q("The WWII submarine at San Francisco's Fisherman's Wharf is the USS…", ["Pampanito", "Bowfin", "Cod", "Torsk"], "Pampanito", 3),
      // https://en.wikipedia.org/wiki/Musée_Mécanique
      q("San Francisco's Musée Mécanique collects old…", ["penny arcade games", "music boxes", "player pianos", "pinball tables"], "penny arcade games", 3),
      // https://en.wikipedia.org/wiki/Musée_Mécanique
      q("Before Fisherman's Wharf, San Francisco's Musée Mécanique games lived at which amusement park?", ["Playland", "Sutro Baths", "Neptune Beach", "Chutes Park"], "Playland", 3),
      // https://en.wikipedia.org/wiki/Davies_Symphony_Hall
      q("San Francisco's Davies Symphony Hall opened in…", ["1980", "1972", "1987", "1965"], "1980", 3),
      // https://en.wikipedia.org/wiki/Castro_Theatre
      q("San Francisco's Castro Theatre was designed by…", ["Timothy Pflueger", "Willis Polk", "Julia Morgan", "Arthur Brown Jr."], "Timothy Pflueger", 3),
      // https://en.wikipedia.org/wiki/Castro_Theatre
      q("The Castro Theatre's famous marquee was added in 1937 in which style?", ["Art Deco", "Googie", "Beaux-Arts", "Mission"], "Art Deco", 3),
      // https://en.wikipedia.org/wiki/Warfield_Theatre
      q("In 1979 Bob Dylan opened his first gospel tour with 14 shows at San Francisco's…", ["Warfield", "Fillmore", "Curran", "Orpheum"], "Warfield", 3),
      // https://en.wikipedia.org/wiki/Curran_Theatre
      q("San Francisco's Curran Theatre is named for its first owner…", ["Homer Curran", "John Curran", "David Belasco", "Bill Graham"], "Homer Curran", 3),
      // https://en.wikipedia.org/wiki/Zuni_Café
      q("San Francisco's Zuni Café was founded in 1979 by…", ["Billy West", "Judy Rodgers", "Alice Waters", "Jeremiah Tower"], "Billy West", 3),
      // https://en.wikipedia.org/wiki/Tonga_Room
      q("The Fairmont's Tonga Room lagoon in San Francisco was once an indoor…", ["swimming pool", "ice-skating rink", "grand ballroom", "rooftop garden"], "swimming pool", 3),
      // https://en.wikipedia.org/wiki/Winterland_Ballroom
      q("San Francisco's Winterland was first built in 1928 as an…", ["ice rink", "opera house", "armory", "auto garage"], "ice rink", 3),
      // https://en.wikipedia.org/wiki/Winterland_Ballroom
      q("Which promoter turned San Francisco's Winterland into a rock venue?", ["Bill Graham", "Chet Helms", "Tom Donahue", "Herb Caen"], "Bill Graham", 3),
      // https://en.wikipedia.org/wiki/Letterman_Digital_Arts_Center
      q("Which effects company is based at the Presidio's Letterman Digital Arts Center in San Francisco?", ["Industrial Light & Magic", "Pixar Animation Studios", "Weta Digital Effects", "Digital Domain Studios"], "Industrial Light & Magic", 3),
      // https://en.wikipedia.org/wiki/Walt_Disney_Family_Museum
      q("San Francisco's Walt Disney Family Museum stands in the…", ["Presidio", "Marina", "Mission Bay", "Embarcadero"], "Presidio", 3),
      // https://en.wikipedia.org/wiki/Walt_Disney_Family_Museum
      q("San Francisco's Walt Disney Family Museum opened in…", ["2009", "1999", "2015", "2003"], "2009", 3),
      // https://en.wikipedia.org/wiki/Seals_Stadium
      q("Before Candlestick, the Giants' first San Francisco home was…", ["Seals Stadium", "Kezar Stadium", "Recreation Park", "Ewing Field"], "Seals Stadium", 3),
      // https://en.wikipedia.org/wiki/Seals_Stadium
      q("San Francisco's Seals Stadium opened in 1931 in which district?", ["Mission District", "Sunset District", "Marina District", "Excelsior"], "Mission District", 3),
    ],
  },
  seattle: {
    local: [
      // https://en.wikipedia.org/wiki/Chihuly_Garden_and_Glass
      q("Seattle's Chihuly Garden and Glass replaced which defunct amusement park?", ["Fun Forest", "Playland", "Funtasia", "Pacific Park"], "Fun Forest", 3),
      // https://en.wikipedia.org/wiki/Fremont_Troll
      q("The car in the Fremont Troll's hand once held a time capsule with a bust of…", ["Elvis Presley", "Jimi Hendrix", "Kurt Cobain", "Bing Crosby"], "Elvis Presley", 3),
      // https://en.wikipedia.org/wiki/Ballard_Locks
      q("Building Seattle's Ballard Locks lowered Lake Washington by about…", ["8.8 feet", "2 feet", "20 feet", "35 feet"], "8.8 feet", 3),
      // https://en.wikipedia.org/wiki/Ballard_Locks
      q("Seattle's Ballard Locks opened for boat traffic in…", ["1917", "1905", "1929", "1941"], "1917", 3),
      // https://en.wikipedia.org/wiki/Ballard_Locks
      q("To run Seattle's Ballard Locks, which river was rerouted into Lake Washington?", ["Cedar River", "White River", "Duwamish River", "Green River"], "Cedar River", 3),
      // https://en.wikipedia.org/wiki/Gas_Works_Park
      q("Seattle's Gas Works Park was designed by landscape architect…", ["Richard Haag", "Lawrence Halprin", "John Olmsted", "Dan Kiley"], "Richard Haag", 3),
      // https://en.wikipedia.org/wiki/Gas_Works_Park
      q("In which year did Gas Works Park open to the public in Seattle?", ["1975", "1962", "1956", "1989"], "1975", 3),
      // https://en.wikipedia.org/wiki/Discovery_Park_(Seattle)
      q("Which lighthouse stands at the westernmost point of Seattle?", ["West Point Lighthouse", "Alki Point Lighthouse", "Mukilteo Lighthouse", "Point No Point Lighthouse"], "West Point Lighthouse", 3),
      // https://en.wikipedia.org/wiki/Discovery_Park_(Seattle)
      q("Which Native cultural center stands within Seattle's Discovery Park?", ["Daybreak Star", "Duwamish Longhouse", "Chief Seattle Hall", "Salish House"], "Daybreak Star", 3),
      // https://en.wikipedia.org/wiki/Volunteer_Park_(Seattle)
      q("Seattle's Volunteer Park is in which neighborhood?", ["Capitol Hill", "Queen Anne", "Madison Park", "Montlake"], "Capitol Hill", 3),
      // https://en.wikipedia.org/wiki/Seattle_Asian_Art_Museum
      q("Seattle's Volunteer Park museum of Asian works sits in a 1933 structure of which style?", ["Art Deco", "Beaux-Arts", "Brutalist", "Gothic Revival"], "Art Deco", 3),
      // https://en.wikipedia.org/wiki/Woodland_Park_Zoo
      q("Seattle's Woodland Park Zoo began as a menagerie on the estate of lumberman…", ["Guy C. Phinney", "Henry Yesler", "Arthur Denny", "Doc Maynard"], "Guy C. Phinney", 3),
      // https://en.wikipedia.org/wiki/Woodland_Park_Zoo
      q("Seattle's Woodland Park Zoo is in which neighborhood?", ["Phinney Ridge", "Ballard", "Wallingford", "Greenwood Hills"], "Phinney Ridge", 3),
      // https://en.wikipedia.org/wiki/Lake_Union
      q("Which Seattle history museum stands at Lake Union Park?", ["MOHAI", "MOPOP", "Burke Museum", "Nordic Museum"], "MOHAI", 3),
      // https://en.wikipedia.org/wiki/Great_Seattle_Fire
      q("After the 1889 fire, Seattle rebuilt its downtown about how far above the old street level?", ["20 feet", "5 feet", "50 feet", "2 feet"], "20 feet", 3),
      // https://en.wikipedia.org/wiki/Klondike_Gold_Rush_National_Historical_Park
      q("Seattle's unit of Klondike Gold Rush National Historical Park sits in…", ["Pioneer Square", "Ballard", "Belltown", "the U District"], "Pioneer Square", 3),
      // https://en.wikipedia.org/wiki/Paramount_Theatre_(Seattle)
      q("The Paramount at 9th and Pine opened in 1928 under which name?", ["Seattle Theatre", "Pine Street Theatre", "Orpheum", "Rainier Theatre"], "Seattle Theatre", 3),
      // https://en.wikipedia.org/wiki/Benaroya_Hall
      q("Who designed the acoustics of Seattle's Benaroya Hall?", ["Cyril Harris", "Leo Beranek", "Yasuhisa Toyota", "Russell Johnson"], "Cyril Harris", 3),
      // https://en.wikipedia.org/wiki/Climate_Pledge_Arena
      q("Before its 2018–21 rebuild, Seattle's Climate Pledge Arena was called…", ["KeyArena", "Tacoma Dome", "Hec Edmundson", "Mercer Arena"], "KeyArena", 3),
      // https://en.wikipedia.org/wiki/Climate_Pledge_Arena
      q("Seattle's Climate Pledge Arena kept the original roof of the 1962 fair's…", ["Washington State Pavilion", "Space Needle", "Pacific Science Center", "Food Circus"], "Washington State Pavilion", 3),
      // https://en.wikipedia.org/wiki/Lumen_Field
      q("Seattle's Lumen Field was built on the site of the…", ["Kingdome", "Sicks' Stadium", "Husky Stadium", "Memorial Stadium"], "Kingdome", 3),
      // https://en.wikipedia.org/wiki/T-Mobile_Park
      q("The Mariners played their first game at Seattle's T-Mobile Park in…", ["1999", "1995", "2002", "1977"], "1999", 3),
      // https://en.wikipedia.org/wiki/Kingdome
      q("Seattle's Kingdome was officially named…", ["King County Stadium", "Seattle Coliseum", "Elliott Bay Dome", "Puget Sound Stadium"], "King County Stadium", 3),
      // https://en.wikipedia.org/wiki/Bertha_(tunnel_boring_machine)
      q("Bertha, the boring machine that dug Seattle's SR 99 tunnel, was built by…", ["Hitachi Zosen", "Mitsubishi", "Caterpillar", "Herrenknecht"], "Hitachi Zosen", 3),
      // https://en.wikipedia.org/wiki/Alaskan_Way_Viaduct
      q("The first section of Seattle's Alaskan Way Viaduct opened in…", ["1953", "1949", "1962", "1971"], "1953", 3),
      // https://en.wikipedia.org/wiki/Alaskan_Way_Viaduct
      q("Seattle's Alaskan Way Viaduct carried which state route?", ["SR 99", "SR 520", "SR 167", "SR 522"], "SR 99", 3),
      // https://en.wikipedia.org/wiki/Olympic_Sculpture_Park
      q("Seattle's Olympic Sculpture Park sits in which neighborhood?", ["Belltown", "Pioneer Square", "Interbay", "SoDo"], "Belltown", 3),
      // https://en.wikipedia.org/wiki/Museum_of_Flight
      q("The Museum of Flight sits at the south end of which Seattle-area airfield?", ["Boeing Field", "Paine Field", "Sea-Tac", "Renton Field"], "Boeing Field", 3),
      // https://en.wikipedia.org/wiki/Suzzallo_Library
      q("Seattle's Suzzallo Library at the University of Washington is built in which style?", ["Collegiate Gothic", "Art Deco Moderne", "Romanesque Revival", "Brutalist Modern"], "Collegiate Gothic", 3),
      // https://en.wikipedia.org/wiki/Colman_Dock
      q("Seattle's Colman Dock ferry terminal is also known as Pier…", ["52", "39", "57", "70"], "52", 3),
      // https://en.wikipedia.org/wiki/Seattle_Japanese_Garden
      q("The Seattle Japanese Garden lies at the south end of which arboretum?", ["Washington Park", "Kubota Garden", "Bloedel Reserve", "Carl English"], "Washington Park", 3),
      // https://en.wikipedia.org/wiki/Bill_Speidel
      q("Which Seattle Times columnist started the Seattle Underground tours?", ["Bill Speidel", "Emmett Watson", "Murray Morgan", "Jean Godden"], "Bill Speidel", 3),
      // https://en.wikipedia.org/wiki/Bill_Speidel
      q("Bill Speidel wrote a book on Doc Maynard subtitled The Man Who Invented…", ["Seattle", "Ballard", "Puget Sound", "Washington"], "Seattle", 3),
      // https://en.wikipedia.org/wiki/Rainier_Brewing_Company
      q("Rainier beer, first brewed in Seattle, was founded in…", ["1884", "1906", "1933", "1862"], "1884", 3),
      // https://en.wikipedia.org/wiki/Rainier_Brewing_Company
      q("Which company closed Seattle's Rainier brewery in 1999?", ["Pabst", "Stroh's", "Anheuser-Busch", "Olympia"], "Pabst", 3),
      // https://en.wikipedia.org/wiki/Pioneer_Square,_Seattle
      q("Most of the buildings in Seattle's Pioneer Square are in which style?", ["Richardsonian Romanesque", "Streamline Art Deco", "Queen Anne Victorian", "Pacific Craftsman"], "Richardsonian Romanesque", 3),
      // https://en.wikipedia.org/wiki/Washington_State_Ferries
      q("Washington State Ferries, which docks in downtown Seattle, began service in…", ["1951", "1938", "1964", "1972"], "1951", 3),
      // https://en.wikipedia.org/wiki/Volunteer_Park_(Seattle)
      q("Seattle's Volunteer Park was named for volunteers who fought in the…", ["Spanish–American War", "American Civil War", "War of 1812", "Mexican–American War"], "Spanish–American War", 3),
      // https://en.wikipedia.org/wiki/Volunteer_Park_(Seattle)
      q("Seattle bought the land for Volunteer Park in 1876 from J. M.…", ["Colman", "Denny", "Yesler", "Boren"], "Colman", 3),
      // https://en.wikipedia.org/wiki/Woodland_Park_Zoo
      q("Which Seattle mayor vetoed buying Woodland Park in 1899, only to be overruled?", ["W. D. Wood", "Hiram Gill", "Ole Hanson", "George Cotterill"], "W. D. Wood", 3),
      // https://en.wikipedia.org/wiki/Paramount_Theatre_(Seattle)
      q("Besides the Paramount, Seattle Theatre Group runs which 1907 Belltown venue?", ["Moore Theatre", "Neptune Theatre", "Showbox", "Crocodile"], "Moore Theatre", 3),
      // https://en.wikipedia.org/wiki/Benaroya_Hall
      q("The Chihuly glass work in Seattle's Benaroya Hall lobby is titled…", ["Crystal Cascade", "Glass Rain", "Sound Wave", "Emerald Falls"], "Crystal Cascade", 3),
      // https://en.wikipedia.org/wiki/Bertha_(tunnel_boring_machine)
      q("Bertha stalled under Seattle in December 2013 after hitting a steel…", ["pipe", "beam", "anchor", "rail"], "pipe", 3),
      // https://en.wikipedia.org/wiki/Kingdome
      q("Besides the Seahawks and Mariners, which NBA team played at Seattle's Kingdome from 1978 to 1985?", ["SuperSonics", "Trail Blazers", "Clippers", "Kings"], "SuperSonics", 3),
      // https://en.wikipedia.org/wiki/Seattle_Japanese_Garden
      q("The Seattle Japanese Garden sits in which neighborhood?", ["Madison Park", "Capitol Hill", "Montlake", "Mount Baker"], "Madison Park", 3),
      // https://en.wikipedia.org/wiki/Suzzallo_Library
      q("The planned 300-foot bell tower for Seattle's Suzzallo Library was…", ["never built", "torn down", "moved", "burned"], "never built", 3),
      // https://en.wikipedia.org/wiki/Museum_of_Pop_Culture
      q("Seattle MOPOP's annual battle of the bands for ages 21 and under is called…", ["Sound Off!", "Band Clash", "Loud Out!", "Amp Up!"], "Sound Off!", 3),
      // https://en.wikipedia.org/wiki/Gas_Works_Park
      q("Seattle's Gas Works Park keeps the last remaining U.S. plant of which kind?", ["coal gasification", "oil refining", "steel milling", "salmon canning"], "coal gasification", 3),
      // https://en.wikipedia.org/wiki/Lake_Union
      q("Lake Union names three Seattle neighborhoods: Eastlake, Westlake and…", ["South Lake Union", "Lower Queen Anne", "Interbay", "Wallingford"], "South Lake Union", 3),
      // https://en.wikipedia.org/wiki/Climate_Pledge_Arena
      q("Seattle's Climate Pledge Arena stands on the campus of…", ["Seattle Center", "the University of Washington", "SoDo", "Pioneer Square"], "Seattle Center", 3),
      // https://en.wikipedia.org/wiki/Seattle_Central_Library
      q("Which Dutch architect led the design of the Seattle Central Library?", ["Rem Koolhaas", "Renzo Piano", "Rafael Moneo", "Daniel Libeskind"], "Rem Koolhaas", 3),
      // https://en.wikipedia.org/wiki/Pacific_Science_Center
      q("Seattle's Pacific Science Center reused the 1962 fair's United States…", ["Science Pavilion", "Space Pavilion", "Science Hall", "Pavilion of Industry"], "Science Pavilion", 3),
      // https://en.wikipedia.org/wiki/Seattle_Aquarium
      q("The Seattle Aquarium's Ocean Pavilion focuses on which reef region?", ["Coral Triangle", "Great Barrier Reef", "Red Sea", "Caribbean"], "Coral Triangle", 3),
      // https://en.wikipedia.org/wiki/Burke_Museum_of_Natural_History_and_Culture
      q("Seattle's Burke Museum began in 1899 under which name?", ["Washington State Museum", "Puget Sound Academy", "Territorial Science Hall", "Seattle Natural Institute"], "Washington State Museum", 3),
      // https://en.wikipedia.org/wiki/Burke_Museum_of_Natural_History_and_Culture
      q("Seattle's Burke Museum holds the world's largest collection of spread…", ["bird wings", "fern fronds", "moth wings", "fish fins"], "bird wings", 3),
      // https://en.wikipedia.org/wiki/Frye_Art_Museum
      q("Seattle's Frye Art Museum sits in which neighborhood?", ["First Hill", "Capitol Hill", "Belltown", "Queen Anne"], "First Hill", 3),
      // https://en.wikipedia.org/wiki/Henry_Art_Gallery
      q("Seattle's Henry Art Gallery was the first public art museum in…", ["Washington state", "the Pacific Northwest", "King County", "the West"], "Washington state", 3),
      // https://en.wikipedia.org/wiki/Wing_Luke_Museum
      q("Since 2008 Seattle's Wing Luke Museum has occupied the East…", ["Kong Yick Building", "Wah Mee Building", "Panama Hotel", "Bush Hotel"], "Kong Yick Building", 3),
      // https://en.wikipedia.org/wiki/Seattle_Opera
      q("Who founded Seattle Opera in 1963?", ["Glynn Ross", "Speight Jenkins", "Gerard Schwarz", "Kent Stowell"], "Glynn Ross", 3),
      // https://en.wikipedia.org/wiki/Moore_Theatre
      q("Seattle's Moore Theatre was built for real estate developer…", ["James A. Moore", "Arthur Denny", "Henry Yesler", "John Nordstrom"], "James A. Moore", 3),
      // https://en.wikipedia.org/wiki/The_Showbox
      q("Seattle's Showbox music venue was founded in…", ["1939", "1952", "1966", "1927"], "1939", 3),
      // https://en.wikipedia.org/wiki/5th_Avenue_Theatre
      q("Seattle's 5th Avenue Theatre stands inside which building?", ["Skinner Building", "Cobb Building", "Rainier Tower", "Henry Building"], "Skinner Building", 3),
      // https://en.wikipedia.org/wiki/Husky_Stadium
      q("Before 1970, Seattle's Husky Stadium was named…", ["University of Washington Stadium", "Montlake Field", "Lake Washington Stadium", "Washington Memorial Stadium"], "University of Washington Stadium", 3),
      // https://en.wikipedia.org/wiki/Green_Lake_(Seattle)
      q("Seattle's Green Lake basin was dug by which glacier?", ["Vashon", "Puget", "Olympic", "Cordilleran"], "Vashon", 3),
      // https://en.wikipedia.org/wiki/Seward_Park_(Seattle)
      q("Seattle's Seward Park covers all of which peninsula?", ["Bailey Peninsula", "Magnolia Bluff", "Alki Spit", "Mercer Point"], "Bailey Peninsula", 3),
      // https://en.wikipedia.org/wiki/Golden_Gardens_Park
      q("Seattle's Golden Gardens Park is in which neighborhood?", ["Ballard", "Magnolia", "Fremont", "Northgate"], "Ballard", 3),
      // https://en.wikipedia.org/wiki/Lake_View_Cemetery_(Seattle)
      q("Seattle's Lake View Cemetery was founded on land acquired from pioneer…", ["Doc Maynard", "Arthur Denny", "Henry Yesler", "Carson Boren"], "Doc Maynard", 3),
      // https://en.wikipedia.org/wiki/Lake_View_Cemetery_(Seattle)
      q("Which daughter of Chief Seattle is buried in Seattle's Lake View Cemetery?", ["Princess Angeline", "Princess Louisa", "Princess Mary", "Princess Ruby"], "Princess Angeline", 3),
      // https://en.wikipedia.org/wiki/Evergreen_Point_Floating_Bridge
      q("Seattle's 520 floating bridge is officially named for Governor…", ["Albert D. Rosellini", "Arthur B. Langlie", "Clarence D. Martin", "Monrad C. Wallgren"], "Albert D. Rosellini", 3),
      // https://en.wikipedia.org/wiki/Montlake_Bridge
      q("Seattle's Montlake Bridge was built in which style to match the UW campus?", ["Collegiate Gothic", "Streamline Moderne", "Beaux-Arts Classical", "Romanesque Revival"], "Collegiate Gothic", 3),
      // https://en.wikipedia.org/wiki/Fremont_Bridge_(Seattle)
      q("Seattle's Fremont Bridge links Fremont with which neighborhood?", ["Queen Anne", "Wallingford", "Ballard", "Magnolia"], "Queen Anne", 3),
      // https://en.wikipedia.org/wiki/Westlake_Center
      q("Seattle's Westlake Center is the southern end of the…", ["Seattle Center Monorail", "South Lake Union Streetcar", "Link light rail", "Waterfront Streetcar"], "Seattle Center Monorail", 3),
      // https://en.wikipedia.org/wiki/Seattle_Post-Intelligencer
      q("The Seattle Post-Intelligencer began in 1863 as the weekly…", ["Seattle Gazette", "Puget Sound Herald", "Seattle Weekly", "Territorial Times"], "Seattle Gazette", 3),
      // https://en.wikipedia.org/wiki/Uwajimaya
      q("Seattle's Uwajimaya grocery chain emphasizes food from…", ["Japan", "China", "Korea", "the Philippines"], "Japan", 3),
      // https://en.wikipedia.org/wiki/Ship_Canal_Bridge
      q("Seattle's double-deck Ship Canal Bridge carries which freeway?", ["Interstate 5", "Interstate 90", "SR 99", "SR 520"], "Interstate 5", 3),
      // https://en.wikipedia.org/wiki/Ship_Canal_Bridge
      q("Seattle's Ship Canal Bridge opened to traffic in…", ["1962", "1952", "1971", "1940"], "1962", 3),
      // https://en.wikipedia.org/wiki/Columbia_Center
      q("Seattle's Columbia Center was developed by…", ["Martin Selig", "Paul Allen", "Howard Wright", "Bill Boeing"], "Martin Selig", 3),
      // https://en.wikipedia.org/wiki/Columbia_Center
      q("Seattle's Columbia Center was completed in…", ["1985", "1976", "1993", "2001"], "1985", 3),
      // https://en.wikipedia.org/wiki/Smith_Tower
      q("Seattle's Smith Tower is named for its builder, a maker of…", ["firearms", "sewing machines", "bicycles", "cash registers"], "firearms", 3),
      // https://en.wikipedia.org/wiki/International_Fountain
      q("Seattle Center's International Fountain was designed by architects based in…", ["Tokyo", "Osaka", "Kyoto", "Sapporo"], "Tokyo", 3),
      // https://en.wikipedia.org/wiki/International_Fountain
      q("Seattle's International Fountain replaced which earlier playground?", ["Mercer Playground", "Denny Playfield", "Queen Anne Commons", "Harrison Yard"], "Mercer Playground", 3),
      // https://en.wikipedia.org/wiki/Harborview_Medical_Center
      q("Seattle's Harborview Medical Center stands in which neighborhood?", ["First Hill", "Capitol Hill", "Beacon Hill", "Queen Anne"], "First Hill", 3),
      // https://en.wikipedia.org/wiki/Northwest_African_American_Museum
      q("Seattle's Northwest African American Museum is housed in the former…", ["Colman School", "Garfield School", "Washington Hall", "Douglass School"], "Colman School", 3),
      // https://en.wikipedia.org/wiki/Daybreak_Star_Cultural_Center
      q("Which activist led the 1970 occupation that won Seattle's Daybreak Star center?", ["Bernie Whitebear", "Russell Means", "Billy Frank Jr.", "Dennis Banks"], "Bernie Whitebear", 3),
      // https://en.wikipedia.org/wiki/Daybreak_Star_Cultural_Center
      q("Seattle's Daybreak Star center stands on land of the former Fort…", ["Lawton", "Worden", "Casey", "Lewis"], "Lawton", 3),
      // https://en.wikipedia.org/wiki/Panama_Hotel_(Seattle)
      q("Seattle's Panama Hotel holds the last remaining Japanese bathhouse in the U.S., called a…", ["sento", "onsen", "ryokan", "ofuro"], "sento", 3),
      // https://en.wikipedia.org/wiki/Panama_Hotel_(Seattle)
      q("Seattle's Panama Hotel was designed by Sabro Ozasa to resemble a…", ["Buddhist monastery", "Shinto shrine", "samurai castle", "pagoda tower"], "Buddhist monastery", 3),
      // https://en.wikipedia.org/wiki/Kubota_Garden
      q("Seattle's Kubota Garden lies in which neighborhood?", ["Rainier Beach", "Beacon Hill", "Columbia City", "Georgetown"], "Rainier Beach", 3),
      // https://en.wikipedia.org/wiki/Jimi_Hendrix_Park
      q("Seattle's Jimi Hendrix Park adjoins which museum?", ["Northwest African American Museum", "Museum of Pop Culture", "Wing Luke Museum", "Museum of History and Industry"], "Northwest African American Museum", 3),
      // https://en.wikipedia.org/wiki/Blake_Island
      q("Which tourist attraction stood on Blake Island, off Seattle, until 2021?", ["Tillicum Village", "Salish Lodge", "Kiana Lodge", "Suquamish Village"], "Tillicum Village", 3),
      // https://en.wikipedia.org/wiki/Alki_Point_Light
      q("Seattle's Alki Point Light marks the southern entrance to…", ["Elliott Bay", "Shilshole Bay", "Salmon Bay", "Lake Union"], "Elliott Bay", 3),
      // https://en.wikipedia.org/wiki/Freeway_Park
      q("Seattle's Freeway Park sits on top of…", ["Interstate 5", "Interstate 90", "SR 99", "SR 520"], "Interstate 5", 3),
      // https://en.wikipedia.org/wiki/Freeway_Park
      q("Seattle's Freeway Park opened on July 4 of…", ["1976", "1969", "1982", "1962"], "1976", 3),
      // https://en.wikipedia.org/wiki/Lake_Washington_Ship_Canal
      q("Work on Seattle's Lake Washington Ship Canal began in…", ["1911", "1889", "1924", "1901"], "1911", 3),
      // https://en.wikipedia.org/wiki/Jose_Rizal_Bridge
      q("Seattle's 12th Avenue South Bridge was renamed in 1974 for a patriot of…", ["Philippines", "South Korea", "Indonesia", "Cambodia"], "Philippines", 3),
      // https://en.wikipedia.org/wiki/Boeing_Plant_2
      q("Seattle's Boeing Plant 2 built about half of all…", ["B-17 Flying Fortresses", "P-51 Mustang fighters", "B-24 Liberator bombers", "C-47 Skytrain transports"], "B-17 Flying Fortresses", 3),
    ],
  },
  denver: {
    local: [
      // https://en.wikipedia.org/wiki/Colorado_State_Capitol
      q("Which architect designed the Colorado State Capitol in Denver?", ["Elijah E. Myers", "Frank Edbrooke", "Robert Roeschlaub", "Cass Gilbert"], "Elijah E. Myers", 3),
      // https://en.wikipedia.org/wiki/Colorado_State_Capitol
      q("The Colorado State Capitol in Denver was built mainly of Colorado…", ["white granite", "red sandstone", "pink marble", "gray limestone"], "white granite", 3),
      // https://en.wikipedia.org/wiki/Colorado_State_Capitol
      q("Gold leaf was first added to the dome of Denver's Capitol in…", ["1908", "1894", "1876", "1935"], "1908", 3),
      // https://en.wikipedia.org/wiki/Colorado_State_Capitol
      q("Denver's State Capitol opened for use in…", ["1894", "1876", "1908", "1861"], "1894", 3),
      // https://en.wikipedia.org/wiki/Denver_Mint
      q("Before the Denver Mint, gold-rush coins in Denver were struck by the firm Clark, Gruber and…", ["Company", "Sons", "Brothers", "Partners"], "Company", 3),
      // https://en.wikipedia.org/wiki/Cheesman_Park
      q("Which attraction borders Denver's Cheesman Park on the east?", ["Denver Botanic Gardens", "Denver Zoo", "City Park Golf", "Bluebird Theater"], "Denver Botanic Gardens", 3),
      // https://en.wikipedia.org/wiki/Sloan%27s_Lake
      q("Denver's Sloan Lake borders Lakewood, Edgewater and which suburb?", ["Wheat Ridge", "Arvada", "Englewood", "Golden"], "Wheat Ridge", 3),
      // https://en.wikipedia.org/wiki/Cherry_Creek_(Colorado)
      q("Denver's Cherry Creek is named for the black…", ["chokecherry", "cherry tree", "wild plum", "serviceberry"], "chokecherry", 3),
      // https://en.wikipedia.org/wiki/Cherry_Creek_(Colorado)
      q("Cherry Creek joins the South Platte in Denver at…", ["Confluence Park", "Commons Park", "Sloan Lake", "City Park"], "Confluence Park", 3),
      // https://en.wikipedia.org/wiki/Cherry_Creek_(Colorado)
      q("Cherry Creek flows through which state park before reaching Denver?", ["Castlewood Canyon", "Roxborough", "Golden Gate Canyon", "Chatfield"], "Castlewood Canyon", 3),
      // https://en.wikipedia.org/wiki/Riverside_Cemetery_(Denver)
      q("Denver's oldest operating cemetery, founded in 1876, is…", ["Riverside", "Fairmount", "Mount Olivet", "Crown Hill"], "Riverside", 3),
      // https://en.wikipedia.org/wiki/Fairmount_Cemetery_(Denver)
      q("Denver's Fairmount Cemetery copied the garden layout of Cambridge's…", ["Mount Auburn", "Forest Hills", "Sleepy Hollow", "Granary"], "Mount Auburn", 3),
      // https://en.wikipedia.org/wiki/Fairmount_Cemetery_(Denver)
      q("Which German landscape architect designed Denver's Fairmount Cemetery?", ["Reinhard Schuetze", "Saco DeBoer", "George Kessler", "Jens Jensen"], "Reinhard Schuetze", 3),
      // https://en.wikipedia.org/wiki/Buckhorn_Exchange
      q("Denver's Buckhorn Exchange first opened in 1893 as a saloon called the…", ["Rio Grande Exchange", "Platte Exchange", "Mile High Saloon", "Colfax Exchange"], "Rio Grande Exchange", 3),
      // https://en.wikipedia.org/wiki/Buckhorn_Exchange
      q("Buckhorn Exchange founder Henry Zietz was nicknamed…", ["Shorty Scout", "Little Buck", "Denver Hank", "Trail Boss"], "Shorty Scout", 3),
      // https://en.wikipedia.org/wiki/Mile_High_Stadium
      q("Denver's Mile High Stadium was first built for which baseball team?", ["Denver Bears", "Denver Zephyrs", "Colorado Rockies", "Denver Grizzlies"], "Denver Bears", 3),
      // https://en.wikipedia.org/wiki/Denver_International_Airport
      q("Denver's airport is closer to which city than to downtown Denver?", ["Aurora", "Boulder", "Brighton", "Lakewood"], "Aurora", 3),
      // https://en.wikipedia.org/wiki/Stapleton_International_Airport
      q("Denver's old Stapleton airport opened in…", ["1929", "1919", "1941", "1952"], "1929", 3),
      // https://en.wikipedia.org/wiki/Lowry_Air_Force_Base
      q("From 1955 to 1958, Denver's Lowry base was the first home of the…", ["Air Force Academy", "NORAD command", "Strategic Air Command", "Space Command"], "Air Force Academy", 3),
      // https://en.wikipedia.org/wiki/Rocky_Mountain_Arsenal
      q("Much of the Rocky Mountain Arsenal near Denver is now a…", ["wildlife refuge", "state park", "golf course", "airport"], "wildlife refuge", 3),
      // https://en.wikipedia.org/wiki/Rocky_Mountain_Arsenal
      q("The Rocky Mountain Arsenal near Denver was built to make…", ["chemical weapons", "army tanks and trucks", "rifle ammunition", "bomber aircraft"], "chemical weapons", 3),
      // https://en.wikipedia.org/wiki/Denver_Public_Library
      q("Denver's Central Library stands in which district?", ["Golden Triangle", "LoDo", "Capitol Hill", "Uptown"], "Golden Triangle", 3),
      // https://en.wikipedia.org/wiki/Denver_Public_Library
      q("Denver Public Library began in 1859 at an outdoor carpenter's bench under a…", ["tree", "tent", "wagon", "bridge"], "tree", 3),
      // https://en.wikipedia.org/wiki/Ellie_Caulkins_Opera_House
      q("Denver's Ellie Caulkins Opera House was built inside the old…", ["Municipal Auditorium", "Tabor Opera House", "Union Station", "Elitch Theatre"], "Municipal Auditorium", 3),
      // https://en.wikipedia.org/wiki/Ellie_Caulkins_Opera_House
      q("Who was nominated for president at the 1908 convention in Denver's Municipal Auditorium?", ["William Jennings Bryan", "William Howard Taft", "Woodrow Wilson", "Eugene Debs"], "William Jennings Bryan", 3),
      // https://en.wikipedia.org/wiki/Elitch_Theatre
      q("Denver's Elitch Theatre was founded by John Elitch and…", ["Mary Elitch Long", "Margaret Brown", "Emily Griffith", "Baby Doe Tabor"], "Mary Elitch Long", 3),
      // https://en.wikipedia.org/wiki/Elitch_Theatre
      q("Which film director called Denver's Elitch Theatre one of the cradles of American drama?", ["Cecil B. DeMille", "D. W. Griffith", "Orson Welles", "Frank Capra"], "Cecil B. DeMille", 3),
      // https://en.wikipedia.org/wiki/Emily_Griffith
      q("Emily Griffith founded her Denver school in 1916 under which name?", ["Opportunity School", "Second Chance School", "Night School", "Adult Academy"], "Opportunity School", 3),
      // https://en.wikipedia.org/wiki/Wings_Over_the_Rockies_Air_and_Space_Museum
      q("Denver's Wings Over the Rockies museum sits on the former…", ["Lowry Air Force Base", "Stapleton Airport", "Buckley Field", "Fitzsimons Hospital"], "Lowry Air Force Base", 3),
      // https://en.wikipedia.org/wiki/16th_Street_Mall
      q("The granite paving of Denver's 16th Street Mall echoes Navajo weaving and a…", ["rattlesnake", "river", "mountain", "sunflower"], "rattlesnake", 3),
      // https://en.wikipedia.org/wiki/16th_Street_Mall
      q("Denver's 16th Street Mall opened in…", ["1982", "1972", "1990", "1996"], "1982", 3),
      // https://en.wikipedia.org/wiki/Dinosaur_Ridge
      q("The world's first identified Stegosaurus fossils were found near Denver at…", ["Dinosaur Ridge", "Red Rocks", "Garden of the Gods", "Dinosaur Monument"], "Dinosaur Ridge", 3),
      // https://en.wikipedia.org/wiki/Dinosaur_Ridge
      q("Which Yale paleontologist led the 1877 digs at Dinosaur Ridge near Denver?", ["Othniel Charles Marsh", "Edward Drinker Cope", "Barnum Brown", "Earl Douglass"], "Othniel Charles Marsh", 3),
      // https://en.wikipedia.org/wiki/Trinity_United_Methodist_Church_(Denver,_Colorado)
      q("Which architect designed Denver's 1887 Trinity Methodist church?", ["Robert S. Roeschlaub", "Frank Edbrooke", "Elijah Myers", "Jacques Benedict"], "Robert S. Roeschlaub", 3),
      // https://en.wikipedia.org/wiki/University_of_Denver
      q("The University of Denver was founded in 1864 as the Colorado…", ["Seminary", "College", "Academy", "Institute"], "Seminary", 3),
      // https://en.wikipedia.org/wiki/University_of_Denver
      q("Who founded the school that became the University of Denver?", ["John Evans", "William Byers", "William Larimer", "Horace Tabor"], "John Evans", 3),
      // https://en.wikipedia.org/wiki/Mount_Evans
      q("The fourteener west of Denver once called Mount Evans is now…", ["Mount Blue Sky", "Mount Arapaho", "Mount Bierstadt", "Mount Cheyenne"], "Mount Blue Sky", 3),
      // https://en.wikipedia.org/wiki/Denver_Zoo
      q("Denver Zoo began in 1896 with the gift of an orphaned…", ["black bear", "bison calf", "elk", "mountain lion"], "black bear", 3),
      // https://en.wikipedia.org/wiki/Denver_Zoo
      q("Denver Zoo's Bear Mountain made it the first U.S. zoo to use…", ["naturalistic enclosures", "nighttime safari tours", "walk-through glass tanks", "children's petting barns"], "naturalistic enclosures", 3),
      // https://en.wikipedia.org/wiki/Denver_Art_Museum
      q("The Denver Art Museum's Martin Building was formerly called the…", ["North Building", "Ponti Tower", "Civic Wing", "Hamilton Annex"], "North Building", 3),
      // https://en.wikipedia.org/wiki/Denver_Art_Museum
      q("The Denver Art Museum's Western art collection is overseen by which institute?", ["Petrie Institute", "Anschutz Institute", "Kirkland Institute", "Boettcher Institute"], "Petrie Institute", 3),
      // https://en.wikipedia.org/wiki/Larimer_Square
      q("In 1971 Denver's Larimer Square became the city's first…", ["historic district", "pedestrian mall", "arts district", "urban renewal zone"], "historic district", 3),
      // https://en.wikipedia.org/wiki/Tattered_Cover
      q("Denver's Tattered Cover bookstore first opened in 1971 in which district?", ["Cherry Creek", "LoDo", "Capitol Hill", "Highland"], "Cherry Creek", 3),
      // https://en.wikipedia.org/wiki/Paramount_Theatre_(Denver)
      q("Denver's Paramount Theatre opened in 1930 as a…", ["movie theater", "vaudeville hall", "opera house", "radio studio"], "movie theater", 3),
      // https://en.wikipedia.org/wiki/Paramount_Theatre_(Denver)
      q("Denver's Paramount Theatre is on Glenarm Place next to the…", ["16th Street Mall", "State Capitol", "Union Station", "Civic Center"], "16th Street Mall", 3),
      // https://en.wikipedia.org/wiki/Ogden_Theatre
      q("Denver's Ogden Theatre on Colfax was part of which movie theater circuit?", ["Fox", "Paramount", "Loew's", "RKO"], "Fox", 3),
      // https://en.wikipedia.org/wiki/Ball_Arena
      q("Denver's Ball Arena replaced which older arena?", ["McNichols Sports Arena", "Denver Coliseum", "Magness Arena", "Denver Auditorium"], "McNichols Sports Arena", 3),
      // https://en.wikipedia.org/wiki/Ball_Arena
      q("Denver's Ball Arena sits beside which boulevard?", ["Speer Boulevard", "Colfax Avenue", "Federal Boulevard", "Colorado Boulevard"], "Speer Boulevard", 3),
      // https://en.wikipedia.org/wiki/Coors_Field
      q("While Coors Field was built, the Rockies played their first two seasons at…", ["Mile High Stadium", "Denver Coliseum", "Folsom Field", "McNichols Arena"], "Mile High Stadium", 3),
      // https://en.wikipedia.org/wiki/Auraria_Campus
      q("Denver's Auraria Campus hosts CU Denver, MSU Denver and the…", ["Community College of Denver", "University of Denver", "Regis University", "Colorado School of Mines"], "Community College of Denver", 3),
      // https://en.wikipedia.org/wiki/Metropolitan_State_University_of_Denver
      q("Metropolitan State University of Denver was founded in…", ["1965", "1947", "1983", "1912"], "1965", 3),
      // https://en.wikipedia.org/wiki/Cathedral_Basilica_of_the_Immaculate_Conception_(Denver)
      q("Denver's Cathedral Basilica of the Immaculate Conception was dedicated in…", ["1912", "1901", "1893", "1925"], "1912", 3),
      // https://en.wikipedia.org/wiki/Cathedral_Basilica_of_the_Immaculate_Conception_(Denver)
      q("Denver's Catholic cathedral basilica stands at Colfax Avenue and…", ["Logan Street", "Broadway", "Grant Street", "Lincoln Street"], "Logan Street", 3),
      // https://en.wikipedia.org/wiki/Denver_City_Park
      q("Besides Ferril Lake, which lake lies in Denver's City Park?", ["Duck Lake", "Smith Lake", "Grasmere Lake", "Sloan Lake"], "Duck Lake", 3),
      // https://en.wikipedia.org/wiki/Denver_City_Park
      q("Which museum stands in Denver's City Park with the zoo?", ["Museum of Nature and Science", "Denver Art Museum", "History Colorado Center", "Clyfford Still Museum"], "Museum of Nature and Science", 3),
      // https://en.wikipedia.org/wiki/Washington_Park_(Denver,_Colorado)
      q("Denver's Washington Park was first laid out in 1899 by…", ["Reinhard Schuetze", "George Kessler", "Frederick Olmsted Jr.", "Saco DeBoer"], "Reinhard Schuetze", 3),
      // https://en.wikipedia.org/wiki/Red_Rocks_Park
      q("Which named rock stands on the south side of Denver's Red Rocks Amphitheatre?", ["Ship Rock", "Creation Rock", "Stage Rock", "Seat of Pluto"], "Ship Rock", 3),
      // https://en.wikipedia.org/wiki/Red_Rocks_Park
      q("Which mushroom-shaped formation is in Denver's Red Rocks Park?", ["Seat of Pluto", "Throne of Zeus", "Devil's Stool", "Toadstool Rock"], "Seat of Pluto", 3),
      // https://en.wikipedia.org/wiki/Denver_Mountain_Parks
      q("Denver's Mountain Parks system was launched in…", ["1910", "1890", "1935", "1959"], "1910", 3),
      // https://en.wikipedia.org/wiki/Five_Points_(Denver)
      q("Denver's River North Arts District is better known by which nickname?", ["RiNo", "NoDo", "LoHi", "SoBo"], "RiNo", 3),
      // https://en.wikipedia.org/wiki/Highland_(Denver)
      q("Denver's Highland and West Highland are part of the area called the…", ["Northside", "Westside", "Uptown", "Platte Valley"], "Northside", 3),
      // https://en.wikipedia.org/wiki/Denver_Coliseum
      q("Denver Coliseum opened in 1951 with a six-day run of which show?", ["Ice Follies", "Ringling circus", "Holiday on Ice", "Ice Capades"], "Ice Follies", 3),
      // https://en.wikipedia.org/wiki/National_Western_Stock_Show
      q("Denver's National Western Stock Show is held every…", ["January", "June", "September", "November"], "January", 3),
      // https://en.wikipedia.org/wiki/National_Western_Stock_Show
      q("Denver's National Western Stock Show has been held since…", ["1906", "1876", "1924", "1948"], "1906", 3),
      // https://en.wikipedia.org/wiki/Daniels_and_Fisher_Tower
      q("Denver's Daniels & Fisher Tower was built in 1910 as part of a…", ["department store", "bank", "hotel", "railroad depot"], "department store", 3),
      // https://en.wikipedia.org/wiki/Daniels_and_Fisher_Tower
      q("Which architect designed Denver's Daniels & Fisher Tower?", ["Frederick Sterner", "Frank Edbrooke", "Elijah Myers", "Robert Roeschlaub"], "Frederick Sterner", 3),
      // https://en.wikipedia.org/wiki/Bonfils_Memorial_Theatre
      q("Denver's Bonfils Memorial Theatre was later renamed for producer…", ["Henry Lowenstein", "Donald Seawell", "Helen Bonfils", "Frederick Bonfils"], "Henry Lowenstein", 3),
      // https://en.wikipedia.org/wiki/Stapleton,_Denver
      q("Denver's Stapleton neighborhood, on the old airport site, is now called…", ["Central Park", "Lowry", "Green Valley", "Montbello"], "Central Park", 3),
    ],
  },
};
