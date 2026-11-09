import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Weekly-style city cards (2026-11-09, batch 2 sub-batch e) for the thinnest city decks: Philadelphia (177), Toronto (195), Tucson (198), LA (219), Temple (222), Austin (224) and Denver (227). Mostly history, food, nature, arts, music and sports inside each city to spare the near-cap local topic. Every card was checked against the source URL above it. Wired via cities.ts (CITY_WEEKLY_20261109E).
 */
export const CITY_WEEKLY_20261109E: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  austin: {
    local: [
      // https://en.wikipedia.org/wiki/Ann_W._Richards_Congress_Avenue_Bridge
      q("Which Austin bridge is home to a huge urban bat colony?", ["Lamar Bridge", "Congress Avenue Bridge", "Montopolis Bridge", "Pennybacker Bridge"], "Congress Avenue Bridge", 2),
      // https://en.wikipedia.org/wiki/Barton_Springs_Pool
      q("Which spring-fed pool in Zilker Park stays about 68°F all year?", ["Jacob's Well", "Barton Springs Pool", "Hamilton Pool", "Deep Eddy Pool"], "Barton Springs Pool", 2),
      // https://en.wikipedia.org/wiki/South_by_Southwest
      q("Which Austin festival combines music, film and tech every March?", ["Austin City Limits", "Levitation", "Fun Fun Fun Fest", "South by Southwest"], "South by Southwest", 2),
    ],
    history: [
      // https://en.wikipedia.org/wiki/History_of_Austin,_Texas
      q("What was Austin's original name when founded in 1839?", ["Travis", "Lamar", "Bastrop", "Waterloo"], "Waterloo", 2),
    ],
    sports: [
      // https://en.wikipedia.org/wiki/Austin_FC
      q("Which Austin MLS team began play in 2021?", ["Austin FC", "Houston Dynamo", "San Antonio FC", "FC Dallas"], "Austin FC", 2),
    ],
  },
  temple: {
    local: [
      // https://en.wikipedia.org/wiki/Baylor_Scott_%26_White_Health
      q("Which large medical center is headquartered in Temple?", ["Baylor Scott & White", "Seton", "Texas Medical Center", "Methodist Hospital"], "Baylor Scott & White", 2),
      // https://en.wikipedia.org/wiki/Belton_Lake
      q("Which Texas lake lies just west of Temple?", ["Lake Travis", "Lake Waco", "Belton Lake", "Lake Georgetown"], "Belton Lake", 2),
      // https://en.wikipedia.org/wiki/Temple,_Texas
      q("Which interstate runs through Temple, Texas?", ["I-35", "I-10", "I-45", "I-20"], "I-35", 2),
      // https://en.wikipedia.org/wiki/Fort_Hood
      q("Which nearby Army post is one of the largest in the world by area, west of Temple?", ["Fort Sam Houston", "Fort Bliss", "Fort Hood", "Fort Sill"], "Fort Hood", 2),
    ],
  },
  tucson: {
    local: [
      // https://en.wikipedia.org/wiki/University_of_Arizona
      q("Which large university is based in Tucson?", ["Arizona State", "Grand Canyon University", "Northern Arizona", "University of Arizona"], "University of Arizona", 2),
      // https://en.wikipedia.org/wiki/Kartchner_Caverns_State_Park
      q("Which Tucson cave became a state park after it was found in 1974?", ["Carlsbad Caverns", "Kartchner Caverns", "Lehman Caves", "Colossal Cave"], "Kartchner Caverns", 2),
    ],
    history: [
      // https://en.wikipedia.org/wiki/Mission_San_Xavier_del_Bac
      q("Which Spanish mission south of Tucson is called the 'White Dove of the Desert'?", ["Mission Dolores", "Mission Tumacácori", "San Xavier del Bac", "Mission San José"], "San Xavier del Bac", 2),
      // https://en.wikipedia.org/wiki/Gadsden_Purchase
      q("Which country controlled Tucson before the 1854 Gadsden Purchase?", ["the Confederacy", "Mexico", "France", "Spain"], "Mexico", 2),
      // https://en.wikipedia.org/wiki/Presidio_San_Agustín_del_Tucsón
      q("What was the name of the Spanish fort founded at Tucson in 1775?", ["Presidio San Agustín del Tucsón", "Fort Huachuca", "Fort Lowell", "Presidio of San Francisco"], "Presidio San Agustín del Tucsón", 2),
    ],
    food: [
      // https://en.wikipedia.org/wiki/Sonoran_hot_dog
      q("Which hot dog, wrapped in bacon and topped with beans, is a Tucson specialty?", ["Michigan hot dog", "Sonoran hot dog", "Coney dog", "Chicago dog"], "Sonoran hot dog", 2),
    ],
    sports: [
      // https://en.wikipedia.org/wiki/Arizona_Wildcats
      q("What is the nickname of the University of Arizona's teams in Tucson?", ["Sun Devils", "Lobos", "Wildcats", "Aggies"], "Wildcats", 2),
    ],
    science: [
      // https://en.wikipedia.org/wiki/Kitt_Peak_National_Observatory
      q("Which observatory on Kitt Peak near Tucson hosts many telescopes?", ["Mount Wilson Observatory", "Lowell Observatory", "Kitt Peak National Observatory", "Palomar Observatory"], "Kitt Peak National Observatory", 2),
      // https://en.wikipedia.org/wiki/Biosphere_2
      q("Which glass-enclosed ecosystem experiment near Tucson is run by the University of Arizona?", ["Biosphere 1", "Biosphere 2", "Masdar City", "Eden Project"], "Biosphere 2", 2),
    ],
    nature: [
      // https://en.wikipedia.org/wiki/Saguaro_National_Park
      q("Which giant cactus gives a national park outside Tucson its name?", ["cholla", "organ pipe", "prickly pear", "saguaro"], "saguaro", 1),
      // https://en.wikipedia.org/wiki/Santa_Catalina_Mountains
      q("Which mountain range rises north of Tucson, topped by Mount Lemmon?", ["Rincon Mountains", "Santa Rita Mountains", "Santa Catalina Mountains", "Tucson Mountains"], "Santa Catalina Mountains", 2),
      // https://en.wikipedia.org/wiki/Arizona-Sonora_Desert_Museum
      q("Which Tucson museum is a zoo, botanical garden and museum in one?", ["Arizona-Sonora Desert Museum", "Reid Park Zoo", "Pima Air & Space Museum", "Tohono Chul"], "Arizona-Sonora Desert Museum", 2),
      // https://en.wikipedia.org/wiki/Tucson,_Arizona
      q("Which desert surrounds Tucson?", ["Sonoran Desert", "Chihuahuan Desert", "Great Basin Desert", "Mojave Desert"], "Sonoran Desert", 2),
      // https://en.wikipedia.org/wiki/Sabino_Canyon
      q("Which Tucson canyon has a tram ride into the Santa Catalina foothills?", ["Bear Canyon", "Ventana Canyon", "Madera Canyon", "Sabino Canyon"], "Sabino Canyon", 2),
      // https://en.wikipedia.org/wiki/Catalina_Highway
      q("Which Tucson mountain road climbs to Mount Lemmon's ski area?", ["Speedway Boulevard", "Kinney Road", "Gates Pass Road", "Catalina Highway"], "Catalina Highway", 2),
    ],
  },
  toronto: {
    local: [
      // https://en.wikipedia.org/wiki/Casa_Loma
      q("Which Toronto castle was built by financier Sir Henry Pellatt?", ["Spadina House", "Craigieburn", "Casa Loma", "Château Laurier"], "Casa Loma", 2),
      // https://en.wikipedia.org/wiki/St._Lawrence_Market
      q("Which Toronto market was named the world's best food market by National Geographic in 2012?", ["Granville Island", "Jean-Talon Market", "Kensington Market", "St. Lawrence Market"], "St. Lawrence Market", 2),
      // https://en.wikipedia.org/wiki/CN_Tower
      q("Which Toronto building has a glass floor 342 m up, once the world's tallest free-standing structure?", ["First Canadian Place", "Royal York", "CN Tower", "Scotia Plaza"], "CN Tower", 2),
      // https://en.wikipedia.org/wiki/Toronto_Caribbean_Carnival
      q("What is the name of Toronto's annual summer festival celebrating Caribbean culture?", ["Toronto Caribbean Carnival", "Taste of the Danforth", "Toronto Pride Festival", "Toronto Jazz Festival"], "Toronto Caribbean Carnival", 2),
      // https://en.wikipedia.org/wiki/Toronto_Transit_Commission
      q("What is the name of Toronto's public transit agency?", ["STM", "TransLink", "TTC", "OC Transpo"], "TTC", 2),
      // https://en.wikipedia.org/wiki/Yonge_Street
      q("Which Toronto street is often cited as one of the world's longest?", ["Spadina Avenue", "Queen Street", "Yonge Street", "Bloor Street"], "Yonge Street", 2),
      // https://en.wikipedia.org/wiki/PATH_(Toronto)
      q("What is Toronto's underground pedestrian network called?", ["RÉSO", "PATH", "Metro Walk", "The Underground"], "PATH", 2),
      // https://en.wikipedia.org/wiki/Kensington_Market
      q("Which Toronto neighborhood is famous for its market and vintage shops?", ["Leslieville", "Distillery District", "Kensington Market", "The Annex"], "Kensington Market", 2),
      // https://en.wikipedia.org/wiki/Massey_Hall
      q("Which Toronto hall, opened in 1894, is a famous concert venue?", ["Roy Thomson Hall", "Massey Hall", "Koerner Hall", "Meridian Hall"], "Massey Hall", 2),
    ],
    history: [
      // https://en.wikipedia.org/wiki/Maple_Leaf_Gardens
      q("Which Toronto arena hosted the Maple Leafs from 1931 to 1999?", ["Massey Hall", "Scotiabank Arena", "Maple Leaf Gardens", "Varsity Arena"], "Maple Leaf Gardens", 2),
      // https://en.wikipedia.org/wiki/Fort_York
      q("Which Toronto fort was built in the 1790s and fought in the War of 1812?", ["Fort York", "Fort Henry", "Fort Erie", "Fort George"], "Fort York", 2),
    ],
    food: [
      // https://en.wikipedia.org/wiki/Peameal_bacon
      q("Which Toronto-born sandwich features cornmeal-crusted pork loin?", ["peameal bacon sandwich", "Montreal bagel", "smoked meat sandwich", "poutine wrap"], "peameal bacon sandwich", 2),
    ],
    sports: [
      // https://en.wikipedia.org/wiki/Rogers_Centre
      q("Which Toronto stadium was the first with a fully retractable motorized roof?", ["BMO Field", "Scotiabank Arena", "Rogers Centre", "Maple Leaf Gardens"], "Rogers Centre", 2),
      // https://en.wikipedia.org/wiki/Toronto_Argonauts
      q("Toronto's CFL team is called the…", ["Alouettes", "Tiger-Cats", "Argonauts", "Roughriders"], "Argonauts", 2),
      // https://en.wikipedia.org/wiki/Toronto_FC
      q("Which Toronto MLS soccer team plays at BMO Field?", ["Vancouver Whitecaps", "Toronto FC", "Forge FC", "CF Montréal"], "Toronto FC", 2),
      // https://en.wikipedia.org/wiki/Hockey_Hall_of_Fame
      q("Which Toronto building houses the Hockey Hall of Fame?", ["Royal York", "Brookfield Place", "Maple Leaf Gardens", "Union Station"], "Brookfield Place", 2),
    ],
    arts: [
      // https://en.wikipedia.org/wiki/Toronto_International_Film_Festival
      q("Which major film festival is held in Toronto each September?", ["Tribeca", "TIFF", "Telluride", "Sundance"], "TIFF", 2),
      // https://en.wikipedia.org/wiki/Royal_Ontario_Museum
      q("Which Toronto museum's Michael Lee-Chin Crystal is a jagged glass addition?", ["Bata Shoe Museum", "Gardiner Museum", "Royal Ontario Museum", "Art Gallery of Ontario"], "Royal Ontario Museum", 2),
      // https://en.wikipedia.org/wiki/Bata_Shoe_Museum
      q("Which Toronto museum is devoted to footwear?", ["Gardiner Museum", "Aga Khan Museum", "Bata Shoe Museum", "Textile Museum"], "Bata Shoe Museum", 2),
    ],
    music: [
      // https://en.wikipedia.org/wiki/Views_(album)
      q("Which Toronto rapper named his album 'Views' after the city's skyline?", ["Drake", "PartyNextDoor", "Tory Lanez", "The Weeknd"], "Drake", 2),
    ],
    nature: [
      // https://en.wikipedia.org/wiki/Don_River_(Ontario)
      q("Which forested ravine system cuts through Toronto from north to south?", ["Don Valley", "Bluffs", "Humber Bay", "Rouge Valley"], "Don Valley", 2),
      // https://en.wikipedia.org/wiki/Scarborough_Bluffs
      q("Which white cliffs line Toronto's eastern lakeshore?", ["Rattlesnake Point", "Niagara Escarpment", "Cheltenham Badlands", "Scarborough Bluffs"], "Scarborough Bluffs", 2),
    ],
  },
  la: {
    local: [
      // https://en.wikipedia.org/wiki/Hollywood_Walk_of_Fame
      q("Which Los Angeles walkway honors celebrities with stars on the sidewalk?", ["Rodeo Drive", "Santa Monica Pier", "Venice Boardwalk", "Hollywood Walk of Fame"], "Hollywood Walk of Fame", 1),
      // https://en.wikipedia.org/wiki/TCL_Chinese_Theatre
      q("Which LA theater hosts handprints of stars in its forecourt?", ["Pantages Theatre", "El Capitan Theatre", "TCL Chinese Theatre", "Dolby Theatre"], "TCL Chinese Theatre", 2),
      // https://en.wikipedia.org/wiki/Walt_Disney_Concert_Hall
      q("Which LA hall, designed by Frank Gehry, is home to the LA Philharmonic?", ["Hollywood Bowl", "Walt Disney Concert Hall", "Dorothy Chandler Pavilion", "The Broad"], "Walt Disney Concert Hall", 2),
      // https://en.wikipedia.org/wiki/La_Brea_Tar_Pits
      q("Which LA tar pits have yielded many Ice Age fossils?", ["La Brea Tar Pits", "Rancho Tar Pits", "McKittrick Tar Pits", "Carpinteria Tar Pits"], "La Brea Tar Pits", 2),
      // https://en.wikipedia.org/wiki/Getty_Center
      q("Which Los Angeles hilltop art museum is reached by tram?", ["LACMA", "The Broad", "Getty Center", "Hammer Museum"], "Getty Center", 2),
      // https://en.wikipedia.org/wiki/Dolby_Theatre
      q("Which LA venue hosts the Academy Awards?", ["Shrine Auditorium", "Dolby Theatre", "Hollywood Bowl", "Microsoft Theater"], "Dolby Theatre", 2),
      // https://en.wikipedia.org/wiki/Santa_Monica_Pier
      q("Which LA pier has an amusement park with a Ferris wheel over the beach?", ["Hermosa Pier", "Manhattan Beach Pier", "Venice Pier", "Santa Monica Pier"], "Santa Monica Pier", 2),
      // https://en.wikipedia.org/wiki/Urban_Light
      q("Which LA art museum has Chris Burden's Urban Light lamp posts?", ["Getty Center", "LACMA", "The Broad", "Hammer Museum"], "LACMA", 2),
      // https://en.wikipedia.org/wiki/Hollywood_Bowl
      q("Which outdoor LA amphitheater has a famous band shell?", ["Hollywood Bowl", "Pantages", "Greek Theatre", "Ford Theatre"], "Hollywood Bowl", 2),
      // https://en.wikipedia.org/wiki/Venice,_Los_Angeles
      q("Which LA beach neighborhood is famous for canals and a boardwalk?", ["Santa Monica", "Redondo Beach", "Malibu", "Venice"], "Venice", 2),
      // https://en.wikipedia.org/wiki/Rodeo_Drive
      q("Which Beverly Hills street is famous for luxury shopping?", ["Melrose Avenue", "Sunset Boulevard", "Rodeo Drive", "Abbot Kinney"], "Rodeo Drive", 2),
    ],
    history: [
      // https://en.wikipedia.org/wiki/1932_Summer_Olympics
      q("In which year did Los Angeles host its first Summer Olympics?", ["1920", "1948", "1984", "1932"], "1932", 2),
      // https://en.wikipedia.org/wiki/Olvera_Street
      q("Which LA street is the oldest part of the city, with a Mexican marketplace?", ["Rodeo Drive", "Sunset Boulevard", "Melrose Avenue", "Olvera Street"], "Olvera Street", 2),
    ],
    food: [
      // https://en.wikipedia.org/wiki/In-N-Out_Burger
      q("Which LA-area chain, founded in Baldwin Park in 1948, serves the Double-Double?", ["Original Tommy's", "In-N-Out Burger", "The Habit Burger Grill", "Fatburger"], "In-N-Out Burger", 2),
      // https://en.wikipedia.org/wiki/French_dip
      q("Which LA restaurant claims to have invented the French dip sandwich?", ["Philippe's", "Canter's", "Langer's", "Cole's"], "Philippe's", 2),
      // https://en.wikipedia.org/wiki/Grand_Central_Market
      q("Which LA market downtown has operated since 1917?", ["Grand Central Market", "Smorgasburg", "Original Farmers Market", "Farmers Market"], "Grand Central Market", 2),
    ],
    sports: [
      // https://en.wikipedia.org/wiki/Dodger_Stadium
      q("Which LA baseball team plays at Chavez Ravine?", ["Dodgers", "Angels", "Giants", "Padres"], "Dodgers", 1),
      // https://en.wikipedia.org/wiki/Los_Angeles_Memorial_Coliseum
      q("Which Los Angeles stadium hosted two Olympic Games and will host a third in 2028?", ["Inglewood SoFi Stadium", "Dodger Stadium", "Pasadena Rose Bowl", "LA Memorial Coliseum"], "LA Memorial Coliseum", 2),
      // https://en.wikipedia.org/wiki/Crypto.com_Arena
      q("Which LA arena, home of the Lakers, was renamed in 2021?", ["Intuit Dome", "Staples Center", "Kia Forum", "Crypto.com Arena"], "Crypto.com Arena", 2),
      // https://en.wikipedia.org/wiki/2020_NBA_Finals
      q("Which LA team won the NBA title in 2020 inside the 'bubble'?", ["Kings", "Sparks", "Clippers", "Lakers"], "Lakers", 2),
      // https://en.wikipedia.org/wiki/Los_Angeles_Kings
      q("Which LA NHL team won the Stanley Cup in 2012 and 2014?", ["Ducks", "Lakers", "Galaxy", "Kings"], "Kings", 2),
    ],
    nature: [
      // https://en.wikipedia.org/wiki/Griffith_Park
      q("Which LA park is one of the largest urban parks in North America?", ["Griffith Park", "Elysian Park", "Echo Park", "MacArthur Park"], "Griffith Park", 2),
      // https://en.wikipedia.org/wiki/Santa_Ana_winds
      q("Which hot dry winds blow toward LA from the deserts in fall?", ["sirocco", "chinook winds", "mistral", "Santa Ana winds"], "Santa Ana winds", 2),
    ],
  },
  denver: {
    local: [
      // https://en.wikipedia.org/wiki/Red_Rocks_Amphitheatre
      q("Which open-air amphitheater near Denver is carved into red sandstone?", ["Gorge Amphitheatre", "Fiddler's Green", "Hollywood Bowl", "Red Rocks Amphitheatre"], "Red Rocks Amphitheatre", 2),
    ],
    food: [
      // https://en.wikipedia.org/wiki/Western_omelette
      q("Which Denver-born omelette is filled with ham, onions and peppers?", ["Spanish omelette", "Colorado scramble", "Denver omelette", "Western frittata"], "Denver omelette", 2),
    ],
  },
  philly: {
    local: [
      // https://en.wikipedia.org/wiki/Boathouse_Row
      q("Which row of lit-up rowing clubhouses lines the Schuylkill River?", ["Elfreth's Alley", "Boathouse Row", "Rittenhouse Row", "Penn's Landing"], "Boathouse Row", 2),
      // https://en.wikipedia.org/wiki/SEPTA
      q("What is the name of Philadelphia's public transit authority?", ["MARTA", "WMATA", "MBTA", "SEPTA"], "SEPTA", 2),
      // https://en.wikipedia.org/wiki/Mummers_Parade
      q("Which famous Philadelphia New Year's Day parade features elaborate costumes?", ["Bud Billiken Parade", "Mummers Parade", "Rose Parade", "Thanksgiving Parade"], "Mummers Parade", 2),
      // https://en.wikipedia.org/wiki/Franklin_Institute
      q("Which science museum in Philadelphia is named for a Founding Father and has a giant walk-through heart?", ["Exploratorium", "Liberty Science Center", "Franklin Institute", "Smithsonian"], "Franklin Institute", 2),
      // https://en.wikipedia.org/wiki/30th_Street_Station
      q("What is Philadelphia's main train station called?", ["Suburban Station", "30th Street Station", "Union Station", "South Station"], "30th Street Station", 2),
    ],
    history: [
      // https://en.wikipedia.org/wiki/Independence_Hall
      q("In which Philadelphia building were the Declaration of Independence and the Constitution debated and signed?", ["Betsy Ross House", "Carpenters' Hall", "Independence Hall", "City Hall"], "Independence Hall", 1),
      // https://en.wikipedia.org/wiki/Philadelphia
      q("Philadelphia served as the US capital during which decade, before Washington, D.C.?", ["the 1770s", "the 1810s", "the 1790s", "the 1830s"], "the 1790s", 2),
      // https://en.wikipedia.org/wiki/Centennial_Exposition
      q("Which world's fair did Philadelphia host in 1876?", ["Pan-American Exposition", "World's Columbian Exposition", "Panama–Pacific Exposition", "Centennial Exposition"], "Centennial Exposition", 2),
      // https://en.wikipedia.org/wiki/Carpenters'_Hall
      q("Which Philadelphia building hosted the First Continental Congress in 1774?", ["Christ Church", "Carpenters' Hall", "Independence Hall", "Congress Hall"], "Carpenters' Hall", 2),
      // https://en.wikipedia.org/wiki/Eastern_State_Penitentiary
      q("Which Philadelphia prison, opened in 1829, is now a museum known for its ruined cellblocks?", ["Walnut Street City Jail", "Holmesburg County Prison", "Eastern State Penitentiary", "Moyamensing County Prison"], "Eastern State Penitentiary", 2),
      // https://en.wikipedia.org/wiki/Elfreth's_Alley
      q("Which Philadelphia street is often called the oldest continuously inhabited residential street in the US?", ["Spruce Street", "Elfreth's Alley", "Market Street", "Dock Street"], "Elfreth's Alley", 2),
      // https://en.wikipedia.org/wiki/Philadelphia_City_Hall
      q("Whose statue stands atop Philadelphia City Hall?", ["Benjamin Franklin", "George Washington", "John Adams", "William Penn"], "William Penn", 1),
      // https://en.wikipedia.org/wiki/Liberty_Bell
      q("Which cracked symbol of freedom is displayed in Philadelphia?", ["Liberty Bell", "Union Bell", "Independence Bell", "Freedom Bell"], "Liberty Bell", 1),
      // https://en.wikipedia.org/wiki/Betsy_Ross
      q("Which Philadelphia seamstress is credited by legend with sewing the first American flag?", ["Martha Washington", "Dolley Madison", "Betsy Ross", "Abigail Adams"], "Betsy Ross", 2),
      // https://en.wikipedia.org/wiki/Benjamin_Franklin_Bridge
      q("Which bridge across the Delaware River links Philadelphia to Camden, NJ, opened in 1926?", ["Walt Whitman Bridge", "Tacony–Palmyra Bridge", "Benjamin Franklin Bridge", "Betsy Ross Bridge"], "Benjamin Franklin Bridge", 2),
    ],
    food: [
      // https://en.wikipedia.org/wiki/Cheesesteak
      q("Which Philadelphia sandwich is made of thin-sliced steak and melted cheese on a roll?", ["Italian hoagie", "cheesesteak", "roast pork", "pork roll"], "cheesesteak", 1),
      // https://en.wikipedia.org/wiki/Reading_Terminal_Market
      q("Which Philadelphia market opened in 1893 under a train shed?", ["Ninth Street Italian Market", "Headhouse Square Market", "Lancaster Central Market", "Reading Terminal Market"], "Reading Terminal Market", 2),
      // https://en.wikipedia.org/wiki/Hoagie
      q("What is Philadelphia's name for a long sandwich called a sub elsewhere?", ["grinder", "hero", "hoagie", "po' boy"], "hoagie", 1),
      // https://en.wikipedia.org/wiki/Tastykake
      q("Which Philadelphia-born snack cake brand makes Butterscotch Krimpets?", ["Drake's", "Hostess", "Tastykake", "Little Debbie"], "Tastykake", 2),
      // https://en.wikipedia.org/wiki/Italian_ice
      q("Philadelphia 'water ice' is most like which frozen treat?", ["frozen custard", "gelato", "soft serve", "Italian ice"], "Italian ice", 2),
    ],
    sports: [
      // https://en.wikipedia.org/wiki/Gritty_(mascot)
      q("What is the name of the Philadelphia Flyers' orange mascot introduced in 2018?", ["Gritty", "Hip Hop", "Swoop", "Phillie Phanatic"], "Gritty", 1),
      // https://en.wikipedia.org/wiki/Penn_Relays
      q("Which Philadelphia race, held every April, is the oldest and largest US track relay meet?", ["Philadelphia Marathon", "Penn Relays", "Dad Vail Regatta", "Broad Street Run"], "Penn Relays", 2),
      // https://en.wikipedia.org/wiki/Super_Bowl_LII
      q("In which year did the Philadelphia Eagles win their first Super Bowl?", ["2023", "2005", "2018", "2009"], "2018", 2),
      // https://en.wikipedia.org/wiki/Wilt_Chamberlain's_100-point_game
      q("Which Philadelphia NBA star scored 100 points in one game in 1962?", ["Wilt Chamberlain", "Allen Iverson", "Julius Erving", "Moses Malone"], "Wilt Chamberlain", 2),
    ],
    arts: [
      // https://en.wikipedia.org/wiki/Rocky_Steps
      q("Which movie boxer ran up the Philadelphia Museum of Art's steps?", ["Apollo Creed", "Jake LaMotta", "Adonis Creed", "Rocky Balboa"], "Rocky Balboa", 1),
      // https://en.wikipedia.org/wiki/Mütter_Museum
      q("Which Philadelphia museum displays medical oddities and specimens?", ["Mütter Museum", "Franklin Institute", "Rodin Museum", "Barnes Foundation"], "Mütter Museum", 2),
      // https://en.wikipedia.org/wiki/Love_Park
      q("Which pop art sculpture spelling a four-letter word gave Philadelphia's JFK Plaza its nickname?", ["JOY", "PEACE", "LOVE", "HOPE"], "LOVE", 2),
      // https://en.wikipedia.org/wiki/Barnes_Foundation
      q("Which Philadelphia museum holds Albert Barnes's collection of Renoirs and Cézannes?", ["Rodin Museum", "Mütter Museum", "Rosenbach", "Barnes Foundation"], "Barnes Foundation", 2),
    ],
    music: [
      // https://en.wikipedia.org/wiki/Philadelphia_soul
      q("Which 1970s Philadelphia sound was shaped by Gamble and Huff?", ["Detroit Motown sound", "Philadelphia soul", "Memphis soul", "Chicago soul"], "Philadelphia soul", 2),
    ],
    nature: [
      // https://en.wikipedia.org/wiki/Fairmount_Park
      q("Which large urban park system runs along the Schuylkill River and Wissahickon Creek?", ["Rittenhouse Square", "Penn Treaty Park", "Pennypack Park", "Fairmount Park"], "Fairmount Park", 2),
      // https://en.wikipedia.org/wiki/Philadelphia
      q("Which two rivers meet in Philadelphia?", ["Potomac and Anacostia", "Hudson and East", "Delaware and Schuylkill", "Ohio and Allegheny"], "Delaware and Schuylkill", 1),
    ],
  },
};
