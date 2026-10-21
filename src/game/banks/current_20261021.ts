import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * 0.1.20 current-events batch (researched 2026-10-21; sources in docs/trivia-current-20261021-sources.md).
 * Every prompt names its month/year or event edition so the card never goes stale. No math (over deck cap).
 */

export const CUR_SPORTS_20261021: TriviaQ[] = [
  q("The 2026 World Series, starting Oct 23, matched the Tampa Bay Rays against the…", ["Milwaukee Brewers", "Los Angeles Dodgers", "San Diego Padres", "Atlanta Braves"], "Milwaukee Brewers", 1),
  q("In the 2026 NLCS, the Brewers swept which team 4–0?", ["Los Angeles Dodgers", "San Diego Padres", "Atlanta Braves", "Philadelphia Phillies"], "Los Angeles Dodgers", 1),
  q("The Rays won the 2026 ALCS 4–2 over the…", ["Cleveland Guardians", "New York Yankees", "Chicago White Sox", "Boston Red Sox"], "Cleveland Guardians", 2),
  q("Who won the 2026 US Open men's singles title?", ["Jannik Sinner", "Alexander Zverev", "Carlos Alcaraz", "Ben Shelton"], "Alexander Zverev", 1),
  q("Who beat Aryna Sabalenka in the 2026 US Open women's final?", ["Coco Gauff", "Iga Świątek", "Elena Rybakina", "Amanda Anisimova"], "Elena Rybakina", 1),
  q("Alexander Zverev's opponent in the 2026 US Open men's final was…", ["Taylor Fritz", "Ben Shelton", "Frances Tiafoe", "Tommy Paul"], "Ben Shelton", 2),
  q("Which country topped the medal table at the 2026 Asian Games in Aichi-Nagoya?", ["Japan", "China", "South Korea", "India"], "China", 1),
  q("The 2026 Commonwealth Games, topped by Australia on the medal table, were held in…", ["Birmingham", "Glasgow", "Manchester", "Edinburgh"], "Glasgow", 1),
  q("At the 2026 Presidents Cup (golf) at Medinah, which side won 17–13?", ["the International Team", "the United States", "Team Europe", "it was halved"], "the United States", 1),
  q("Who won the 2026 FedEx Cup at the Tour Championship in Atlanta?", ["Rory McIlroy", "Scottie Scheffler", "Xander Schauffele", "Viktor Hovland"], "Scottie Scheffler", 1),
  q("Who won the Formula 1 Singapore Grand Prix on Oct 11, 2026?", ["Charles Leclerc", "Max Verstappen", "Kimi Antonelli", "George Russell"], "Max Verstappen", 2),
  q("After the Oct 2026 Singapore GP, who led the F1 drivers' standings?", ["George Russell", "Kimi Antonelli", "Lewis Hamilton", "Max Verstappen"], "Kimi Antonelli", 2),
  q("Which golfer clinched the 2026 Presidents Cup with a 1-up win over Min Woo Lee?", ["Jacob Bridgeman", "Patrick Cantlay", "Sam Burns", "Russell Henley"], "Jacob Bridgeman", 3),
];

export const CUR_POLITICAL_20261021: TriviaQ[] = [
  q("Brazil's Oct 25, 2026 presidential runoff pits Lula against…", ["Jair Bolsonaro", "Flávio Bolsonaro", "Tarcísio de Freitas", "Ciro Gomes"], "Flávio Bolsonaro", 1),
  q("Fatima Ezzahra El Mansouri became the first woman to serve as prime minister of which country in Oct 2026?", ["Tunisia", "Morocco", "Algeria", "Jordan"], "Morocco", 1),
  q("Luca Niculescu, sworn in as prime minister in Oct 2026, leads which country?", ["Moldova", "Romania", "Bulgaria", "Hungary"], "Romania", 2),
  q("Who resigned as Sweden's prime minister after the Sept 2026 election?", ["Magdalena Andersson", "Ulf Kristersson", "Stefan Löfven", "Ebba Busch"], "Ulf Kristersson", 2),
  q("In Russia's Sept 2026 State Duma election, which party won 349 of 450 seats?", ["Communist Party", "United Russia", "LDPR", "New People"], "United Russia", 1),
  q("The president of the 81st UN General Assembly (from Sept 2026), Khalilur Rahman, is from…", ["Pakistan", "Bangladesh", "Sri Lanka", "Nepal"], "Bangladesh", 2),
  q("In Berlin's Sept 2026 state election, which party became the largest in the House of Representatives?", ["CDU", "SPD", "Die Linke", "the Greens"], "Die Linke", 3),
  q("Morocco's new PM in Oct 2026 leads the PAM (Authenticity and Modernity Party), which is…", ["Islamist", "centrist", "far-left", "monarchist-nationalist"], "centrist", 2),
  q("In Oct 2026, Sweden's Riksdag voted down which Social Democrat as prime minister?", ["Magdalena Andersson", "Stefan Löfven", "Mikael Damberg", "Morgan Johansson"], "Magdalena Andersson", 2),
  q("Who finished first in Brazil's Oct 4, 2026 presidential first round?", ["Lula", "Flávio Bolsonaro", "Simone Tebet", "Ciro Gomes"], "Flávio Bolsonaro", 2),
  q("Romania's President Nicușor Dan nominated Luca Niculescu (sworn in Oct 2026) after how many failed picks?", ["one", "two", "three", "four"], "three", 3),
];

export const CUR_FOOD_20261021: TriviaQ[] = [
  q("At the Oct 2026 Half Moon Bay pumpkin weigh-off, the winning pumpkin weighed about…", ["1,389 lb", "2,389 lb", "2,749 lb", "1,949 lb"], "2,389 lb", 1),
  q("The 2026 Half Moon Bay pumpkin champion, Travis Gienger, grows in…", ["Wisconsin", "Minnesota", "Ohio", "Oregon"], "Minnesota", 2),
  q("In Oct 2026 a Boise restaurant and the Idaho Potato Commission set a Guinness record for the largest serving of…", ["mashed potatoes", "French fries", "hash browns", "potato salad"], "French fries", 1),
  q("Xin Rong Ji became the first three-Michelin-star restaurant in which Chinese city in Sept 2026?", ["Chongqing", "Chengdu", "Hangzhou", "Xi'an"], "Chengdu", 2),
  q("The 2026 World Food Championships were held in which city?", ["Dallas", "Indianapolis", "Kansas City", "Nashville"], "Indianapolis", 2),
  q("Jordan Davis, the 'Smoking Pastor', won which 2026 World Food Championships title?", ["World Chef", "World Barbecue", "World Burger", "World Dessert"], "World Barbecue", 2),
  q("The record fry pile set in Idaho in Oct 2026 weighed about…", ["268 kg", "668.6 kg", "1,268 kg", "466 kg"], "668.6 kg", 3),
  q("Before Idaho took it in Oct 2026, the largest-serving-of-fries record was held by a team from…", ["Belgium", "India", "Canada", "the Netherlands"], "India", 3),
  q("The winning pumpkin at Half Moon Bay in Oct 2026 was nicknamed…", ["Rocky", "Big Max", "Moose", "Goliath"], "Rocky", 3),
  q("In Oct 2026 Samyang's Buldak set a Guinness record for videos of people eating spicy…", ["instant noodles", "fried chicken", "rice cakes", "dumplings"], "instant noodles", 1),
  q("Xin Rong Ji's third Michelin star came in Sept 2026 in the guide edition labeled…", ["2025", "2026", "2027", "2028"], "2027", 3),
];

export const CUR_ARTS_20261021: TriviaQ[] = [
  q("The Turner Prize 2026 exhibition (Sept 2026–Mar 2027) is being held in…", ["Hull", "Middlesbrough", "Eastbourne", "Liverpool"], "Middlesbrough", 2),
  q("Which artist on the Turner Prize 2026 shortlist was born in France?", ["Simeon Barclay", "Marguerite Humeau", "Kira Freije", "Tanoa Sasraku"], "Marguerite Humeau", 3),
  q("In Sept 2026, sound artist Christine Sun Kim was named a…", ["Turner Prize winner", "MacArthur Fellow", "Pulitzer winner", "Venice Golden Lion winner"], "MacArthur Fellow", 2),
  q("A 2026 MacArthur 'genius grant' is worth how much over five years?", ["$500,000", "$625,000", "$800,000", "$1 million"], "$800,000", 2),
  q("In Sept 2026, Shakespeare's Globe opened a public library holding a 1632…", ["first folio", "second folio", "quarto Hamlet", "Stationers' Register"], "second folio", 2),
  q("The Zaha Hadid Foundation's reopened London HQ (late 2026) is a former…", ["Victorian power station", "Victorian schoolhouse", "Georgian church hall", "railway arch workshop"], "Victorian schoolhouse", 2),
  q("The 2026 Emmy for drama writing went to Vince Gilligan for…", ["Better Call Saul", "Pluribus", "Slow Horses", "The Pitt"], "Pluribus", 1),
  q("The Turner Prize 2026 winner is due to be named on…", ["10 Nov 2026", "10 Dec 2026", "1 Jan 2027", "29 Mar 2027"], "10 Dec 2026", 2),
  q("How many artists are on the Turner Prize 2026 shortlist?", ["three", "four", "five", "six"], "four", 1),
  q("The Zaha Hadid Foundation's London HQ (reopening late 2026) is in which district?", ["Clerkenwell", "Shoreditch", "Bloomsbury", "Southwark"], "Clerkenwell", 3),
];

export const CUR_SCIENCE_20261021: TriviaQ[] = [
  q("Which researcher shared the 2026 medicine Nobel for optogenetics?", ["Ed Boyden", "Karl Deisseroth", "Gero Miesenböck", "Feng Zhang"], "Karl Deisseroth", 2),
  q("Japan's MMX mission, launched Oct 2026, aims to return samples from…", ["Deimos", "Phobos", "Ceres", "Europa"], "Phobos", 1),
  q("Which rocket launched JAXA's MMX (Mars moons) mission in Oct 2026?", ["H-IIA", "H3", "Epsilon S", "Ariane 6"], "H3", 2),
  q("MMX's IDEFIX rover (launched Oct 2026) was built by France and…", ["Italy", "Germany", "Japan", "Canada"], "Germany", 3),
  q("NASA's SpaceX Crew-12 splashed down in Oct 2026 in the…", ["Atlantic Ocean", "Pacific Ocean", "Gulf of Mexico", "Indian Ocean"], "Pacific Ocean", 2),
  q("ESA's FLEX satellite (launched Sept 2026) maps plant…", ["fluorescence", "height", "pollen", "root depth"], "fluorescence", 3),
  q("In Oct 2026, Japan launched the MMX mission to the moons of which planet?", ["Jupiter", "Mars", "Saturn", "Venus"], "Mars", 1),
  q("ESA astronaut Sophie Adenot returned from the ISS in Oct 2026 after about how many days in space?", ["137", "237", "337", "187"], "237", 3),
  q("MMX (launched Oct 2026) is scheduled to reach Mars in…", ["Dec 2026", "Aug 2027", "Aug 2028", "Mar 2029"], "Aug 2027", 2),
  q("Before Japan's MMX (Oct 2026), the first Phobos sample-return attempt was launched by…", ["the U.S.", "Russia", "China", "the ESA"], "Russia", 3),
  q("MMX's Phobos samples (launched Oct 2026) are due to land on Earth in which country in 2031?", ["Japan", "Australia", "the U.S.", "Kazakhstan"], "Australia", 3),
];

export const CUR_HISTORY_20261021: TriviaQ[] = [
  q("In Oct 2026, the world's oldest known shipwreck was announced off the coast of…", ["Greece", "Turkey", "Cyprus", "Egypt"], "Turkey", 1),
  q("The Kekova shipwreck announced in Oct 2026 dates to the…", ["Late Stone Age", "Early Bronze Age", "Early Iron Age", "Late Roman era"], "Early Bronze Age", 2),
  q("Before Kekova (Oct 2026), the oldest known shipwreck lay off which Greek island?", ["Dokos", "Crete", "Rhodes", "Delos"], "Dokos", 3),
  q("In Sept 2026, an intact 600-year-old tomb was found at Chan-Chan, capital of the…", ["Inca", "Chimú", "Moche", "Nazca"], "Chimú", 2),
  q("Chan-Chan (site of a Sept 2026 tomb find) is in which country?", ["Bolivia", "Peru", "Ecuador", "Chile"], "Peru", 1),
  q("In Oct 2026, the U.S. marked the 250th anniversary of the Battle of Valcour Island, fought on…", ["Lake Erie", "Lake Champlain", "Lake George", "Lake Ontario"], "Lake Champlain", 2),
  q("Valcour Island's 1776 American fleet (250th anniversary Oct 2026) was commanded by…", ["John Paul Jones", "Benedict Arnold", "Horatio Gates", "Henry Knox"], "Benedict Arnold", 2),
  q("Sept 11, 2026 marked how many years since the 9/11 attacks?", ["20", "25", "30", "15"], "25", 1),
  q("46,000-year-old Neanderthal bones identified in Oct 2026 came from a cave in…", ["France", "Spain", "Portugal", "Italy"], "Spain", 3),
  q("Mission Dolores in San Francisco marked its 250th anniversary in Oct 2026; it was founded in…", ["1769", "1776", "1781", "1797"], "1776", 2),
];

export const CUR_NATURE_20261021: TriviaQ[] = [
  q("Fat Bear Week 2026 at Katmai was won by bear 89, nicknamed…", ["Otis", "Backpack", "Grazer", "Chunk"], "Backpack", 1),
  q("Fat Bear Week (won by 'Backpack' in Sept 2026) is held at a national park in…", ["Montana", "Alaska", "Wyoming", "British Columbia"], "Alaska", 1),
  q("Hurricane Isaias made landfall in Oct 2026 near which Florida city?", ["Tampa", "Destin", "Naples", "Miami"], "Destin", 2),
  q("Isaias, the strongest 2026 Atlantic hurricane, peaked as a Category…", ["1", "2", "3", "5"], "3", 3),
  q("Victoria colombiana, described by Kew in Oct 2026, is a new species of…", ["giant waterlily", "jungle orchid", "tall tree fern", "air bromeliad"], "giant waterlily", 1),
  q("Kew's waterlily expert first spotted Victoria colombiana (named Oct 2026) on…", ["Google Earth", "Instagram", "a museum sheet", "a stamp"], "Instagram", 2),
  q("Victoria colombiana (named Oct 2026) grows in a headwater of which river system?", ["Amazon", "Orinoco", "Magdalena", "Paraná"], "Orinoco", 3),
  q("In Sept 2026, UBC scientists described two new species of sea spider from the…", ["Gulf of Maine", "Salish Sea", "Bering Sea", "Sea of Cortez"], "Salish Sea", 3),
  q("Sea spiders (two new species named in Sept 2026) belong to the group…", ["true spiders", "pycnogonids", "crabs", "sea stars"], "pycnogonids", 3),
  q("In the Fat Bear Week 2026 final, Backpack (89) beat bear number…", ["480", "910", "747", "128"], "910", 3),
];

export const CUR_GAMES_20261021: TriviaQ[] = [
  q("The new 2D Metroid revealed in Nintendo's Sept 2026 Direct is titled Metroid…", ["Dread II", "Ravenous", "Hunger", "Prime 5"], "Ravenous", 1),
  q("Nintendo's Sept 2026 Direct closed with an open 3D Kirby titled Kirby and the…", ["Forgotten Land 2", "World Beyond", "Star Realm", "Dream Engine"], "World Beyond", 2),
  q("As of Oct 2026, Rockstar's announced launch date for Grand Theft Auto VI was…", ["Nov 19, 2026", "Oct 26, 2026", "Dec 3, 2026", "Mar 5, 2027"], "Nov 19, 2026", 1),
  q("Control Resonant hit 1 million sales in Oct 2026, a record for which studio?", ["Remedy", "Insomniac", "Arkane", "Hello Games"], "Remedy", 2),
  q("Per the Sept 2026 Direct, Monster Hunter Wilds reaches Switch 2 on…", ["Oct 22, 2026", "Dec 4, 2026", "Jan 28, 2027", "Mar 4, 2027"], "Dec 4, 2026", 3),
  q("In the Sept 2026 Direct, Mario Kart World added 10 classic tracks from the…", ["N64", "SNES", "GameCube", "Wii"], "SNES", 2),
  q("Professor Layton and the New World of Steam was dated (Sept 2026 Direct) for…", ["Oct 10, 2026", "Dec 10, 2026", "Feb 10, 2027", "Apr 10, 2027"], "Dec 10, 2026", 3),
  q("Gamescom Opening Night Live 2026 was held in which month?", ["June", "August", "September", "October"], "August", 2),
  q("The new Fire Emblem shown in Nintendo's Sept 2026 Direct is Fire Emblem…", ["Fortune's Weave", "Three Hopes II", "Engage II", "Crimson Crest"], "Fortune's Weave", 2),
  q("Which Witcher game was announced for Switch 2 in Nintendo's Sept 2026 Direct?", ["The Witcher 3 Remastered", "The Witcher 4", "The Witcher 2 Remastered", "Gwent Legends"], "The Witcher 3 Remastered", 2),
  q("Kirby and the World Beyond (shown Sept 2026) is due in…", ["holiday 2026", "spring 2027", "fall 2027", "2028"], "spring 2027", 3),
];

export const CUR_CELEBRITY_20261021: TriviaQ[] = [
  q("Which HBO Max series won the 2026 Emmy for limited or anthology series?", ["The Beast in Me", "DTF St. Louis", "Task", "Remarkably Bright Creatures"], "DTF St. Louis", 3),
  q("Sally Field won a 2026 Emmy (limited series actress) for…", ["Remarkably Bright Creatures", "Lessons in Chemistry", "The Beast in Me", "Big Little Lies"], "Remarkably Bright Creatures", 3),
  q("Who hosted the Sept 2026 Emmy Awards on NBC?", ["Mariska Hargitay", "Nate Bargatze", "Jimmy Kimmel", "Ellen Pompeo"], "Mariska Hargitay", 2),
  q("At the 2026 Emmys, Matthew Rhys won lead actor in a comedy and in a limited series — two awards for…", ["the same role", "two different shows", "his voice work", "one show's sequel"], "two different shows", 3),
  q("Rhea Seehorn won the 2026 Emmy for lead drama actress for…", ["Better Call Saul", "Pluribus", "The Diplomat", "Paradise"], "Pluribus", 2),
  q("Which reality show won the 2026 Emmy for reality competition?", ["The Amazing Race", "The Traitors", "Top Chef", "Survivor"], "The Traitors", 2),
  q("Who hosted the 2026 MTV VMAs in Sept 2026?", ["Megan Thee Stallion", "Snoop Dogg", "LL Cool J", "Nicki Minaj"], "Snoop Dogg", 2),
  q("The 2026 Venice Golden Lion went to 'Woman Unknown', directed by…", ["Susanne Bier", "May el-Toukhy", "Joachim Trier", "Lone Scherfig"], "May el-Toukhy", 3),
  q("Which film won the People's Choice Award at TIFF (Toronto) in Sept 2026?", ["La Bola Negra", "Hamnet", "Woman Unknown", "Sentimental Value"], "La Bola Negra", 3),
  q("TIFF 2026 People's Choice winner La Bola Negra was directed by Javier Calvo and…", ["Javier Ambrossi", "Javier Bardem", "Pedro Almodóvar", "Juan Antonio Bayona"], "Javier Ambrossi", 3),
];

export const CUR_MUSIC_20261021: TriviaQ[] = [
  q("Which Taylor Swift song debuted at No. 1 on the Billboard Hot 100 in Oct 2026?", ["Opalite", "Patient Zero", "The Fate of Ophelia", "I Knew It, I Knew You"], "Patient Zero", 1),
  q("In Sept 2026, which song broke the record for most weeks at No. 1 on the Hot 100?", ["Old Town Road", "Choosin' Texas", "A Bar Song (Tipsy)", "Last Night"], "Choosin' Texas", 2),
  q("'Choosin' Texas', the record-setting 2026 Hot 100 No. 1, is by…", ["Lainey Wilson", "Ella Langley", "Megan Moroney", "Kacey Musgraves"], "Ella Langley", 2),
  q("How many weeks did 'Choosin' Texas' spend at No. 1 on the Hot 100 in 2026?", ["19", "24", "16", "22"], "24", 3),
  q("Which song won Video of the Year at the Sept 2026 VMAs?", ["Patient Zero", "The Fate of Ophelia", "Bring Your Love", "Tears"], "The Fate of Ophelia", 1),
  q("Who won the most awards (seven) at the Sept 2026 VMAs?", ["Taylor Swift", "Madonna", "Sabrina Carpenter", "Ariana Grande"], "Madonna", 2),
  q("Which band received the Video Vanguard Award at the 2026 VMAs?", ["Pearl Jam", "Nirvana", "Foo Fighters", "Green Day"], "Nirvana", 2),
  q("Who won Best New Artist at the Sept 2026 VMAs?", ["Sienna Spiro", "Olivia Dean", "Alex Warren", "Lola Young"], "Sienna Spiro", 3),
  q("At the 2026 VMAs, Taylor Swift became the most-awarded VMA artist, passing…", ["Madonna", "Beyoncé", "Lady Gaga", "Britney Spears"], "Beyoncé", 2),
  q("Which veteran Western swing band kept its tradition of opening ACL Fest in Oct 2026?", ["Asleep at the Wheel", "The Texas Playboys", "Old 97's", "Los Lonely Boys"], "Asleep at the Wheel", 3),
];

export const CUR_BOOKS_20261021: TriviaQ[] = [
  q("Who chaired the judges of the 2026 Booker Prize (fiction)?", ["Mary Beard", "Hilary Mantel", "Zadie Smith", "Margaret Drabble"], "Mary Beard", 2),
  q("Which Pulp frontman was a 2026 Booker Prize judge?", ["Jarvis Cocker", "Damon Albarn", "Brett Anderson", "Richard Ashcroft"], "Jarvis Cocker", 2),
  q("Douglas Stuart's 2026 Booker-shortlisted novel is…", ["Young Mungo", "John of John", "Shuggie Bain", "Mother of Mine"], "John of John", 2),
  q("Which Pulitzer-winning author's 'The Things We Never Say' made the 2026 Booker shortlist?", ["Anne Tyler", "Elizabeth Strout", "Ann Patchett", "Alice McDermott"], "Elizabeth Strout", 3),
  q("Which former Booker winner's 'The Disappearers' made the 2026 shortlist?", ["Marlon James", "Bernardine Evaristo", "Paul Lynch", "Shehan Karunatilaka"], "Marlon James", 3),
  q("The 2026 Booker Prize winner is to be named on…", ["9 Oct 2026", "9 Nov 2026", "9 Dec 2026", "9 Jan 2027"], "9 Nov 2026", 2),
  q("Edwidge Danticat's 2026 National Book Award finalist novel is titled…", ["Dèy", "Krik? Krak!", "Claire of the Sea Light", "Breath, Eyes, Memory"], "Dèy", 3),
  q("Which thriller topped the NYT hardcover fiction list dated Oct 25, 2026?", ["The Housemaid", "The Witch", "The Boyfriend", "The Teacher"], "The Witch", 2),
  q("Novelist Maaza Mengiste was named a 2026…", ["Booker winner", "MacArthur Fellow", "Nobel laureate", "U.S. Poet Laureate"], "MacArthur Fellow", 2),
  q("Valeria Luiselli's 2026 National Book Award finalist novel is…", ["Lost Children Archive", "Beginning Middle End", "Faces in the Crowd", "Paradiso 17"], "Beginning Middle End", 3),
  q("The 2026 National Book Award winners are set to be named on…", ["Oct 18, 2026", "Nov 18, 2026", "Dec 18, 2026", "Jan 18, 2027"], "Nov 18, 2026", 2),
];

export const CUR_LOCAL_20261021: TriviaQ[] = [
  q("Northwestern's new Ryan Field in Evanston hosted its first game in Oct 2026 against…", ["Michigan", "Penn State", "Illinois", "Iowa"], "Penn State", 2),
  q("Northwestern's new Ryan Field (opened Oct 2026) seats about…", ["25,000", "35,000", "47,000", "60,000"], "35,000", 3),
  q("Toronto's Scarborough Busway opened in Sept 2026 running from which subway station?", ["Kennedy", "Warden", "Victoria Park", "Kipling"], "Kennedy", 2),
  q("Seattle's Link light rail added which station at NE 130th Street in Sept 2026?", ["Pinehurst", "Northgate", "Shoreline South", "Roosevelt"], "Pinehurst", 2),
  q("Denver opened its first bus rapid transit lanes on which corridor in Sept 2026?", ["Federal Blvd", "East Colfax", "Broadway", "Speer Blvd"], "East Colfax", 2),
  q("ACL Fest Weekend One in Oct 2026 was memorable at Zilker Park for…", ["record heat", "heavy rain and mud", "a hailstorm", "a power outage"], "heavy rain and mud", 1),
  q("In Oct 2026, Travis County (Austin) set a 20-year high for first-day…", ["early voting", "jury duty", "library sign-ups", "bus ridership"], "early voting", 1),
  q("Shakespeare's Globe opened a new research library in Sept 2026 on which London riverside?", ["Southbank", "Bankside", "Embankment", "Wapping"], "Bankside", 2),
  q("Which San Francisco mission marked its 250th anniversary in Oct 2026?", ["Mission Santa Clara", "Mission Dolores", "Mission San Rafael", "Mission Carmel"], "Mission Dolores", 1),
  q("Chicago's Florence Scala Italian American Museum, opened Oct 2026, is in which neighborhood?", ["Little Italy", "Bridgeport", "Pilsen", "Old Town"], "Little Italy", 1),
];
