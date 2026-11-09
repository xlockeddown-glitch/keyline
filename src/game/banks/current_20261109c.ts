import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Nov 9, 2026 bulk add, sub-batch 3 (0.1.138): time-anchored 2025-2026 events (elections, world events, sports, games, TV, awards, space).
 * Every prompt is time-anchored. No math. Sources in docs/trivia-current-20261109c-sources.md.
 * Fact-level dup-checked vs whole deck incl. weekly_ and current_ banks.
 */

export const CUR_SPORTS_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2025_World_Snooker_Championship
	q("Who became the first Asian world snooker champion in May 2025?", ["Thepchaiya Un-Nooh", "Wu Yize", "Zhao Xintong", "Ding Junhui"], "Zhao Xintong", 2),
	// https://en.wikipedia.org/wiki/2025_World_Snooker_Championship
	q("Whom did Zhao Xintong beat in the May 2025 World Snooker final?", ["Ronnie O'Sullivan", "Mark Williams", "Judd Trump", "Kyren Wilson"], "Mark Williams", 3),
	// https://en.wikipedia.org/wiki/2026_World_Snooker_Championship
	q("Who beat Shaun Murphy 18–17 in the May 2026 World Snooker final?", ["Ding Junhui", "Si Jiahui", "Wu Yize", "Zhao Xintong"], "Wu Yize", 3),
	// https://en.wikipedia.org/wiki/2025_PDC_World_Darts_Championship
	q("Who became the youngest darts world champion in Jan 2025?", ["Luke Littler", "Luke Humphries", "Josh Rock", "Gian van Veen"], "Luke Littler", 1),
	// https://en.wikipedia.org/wiki/2026_PDC_World_Darts_Championship
	q("Which Dutch player lost the Jan 2026 PDC world darts final to Luke Littler?", ["Michael van Gerwen", "Dirk van Duijvenbode", "Gian van Veen", "Danny Noppert"], "Gian van Veen", 3),
	// https://en.wikipedia.org/wiki/2025_Grand_National
	q("Which horse won the Grand National in April 2025?", ["I Am Maximus", "Noble Yeats", "Nick Rockett", "Corach Rambler"], "Nick Rockett", 2),
	// https://en.wikipedia.org/wiki/2026_Grand_National
	q("Which horse won the Grand National for a second time in April 2026?", ["Corach Rambler", "Tiger Roll", "I Am Maximus", "Nick Rockett"], "I Am Maximus", 2),
	// https://en.wikipedia.org/wiki/2025_Melbourne_Cup
	q("Which horse won the Melbourne Cup in Nov 2025?", ["Knight's Choice", "Half Yours", "Gold Trip", "Without a Fight"], "Half Yours", 3),
	// https://en.wikipedia.org/wiki/2026_Melbourne_Cup
	q("Which horse won the Melbourne Cup on Nov 3, 2026?", ["Half Yours", "Point Of Law", "Knight's Choice", "Vauban"], "Point Of Law", 3),
	// https://en.wikipedia.org/wiki/2025_MotoGP_World_Championship
	q("Who won the 2025 MotoGP title, his first since 2019?", ["Francesco Bagnaia", "Marc Márquez", "Álex Márquez", "Jorge Martín"], "Marc Márquez", 2),
	// https://en.wikipedia.org/wiki/2025_Daytona_500
	q("Who won his second straight Daytona 500 in Feb 2025?", ["Chase Elliott", "Denny Hamlin", "William Byron", "Tyler Reddick"], "William Byron", 2),
	// https://en.wikipedia.org/wiki/2026_Daytona_500
	q("Who won the Daytona 500 in Feb 2026?", ["Chase Elliott", "Denny Hamlin", "William Byron", "Tyler Reddick"], "Tyler Reddick", 2),
	// https://en.wikipedia.org/wiki/2025_NASCAR_Cup_Series
	q("Who won the 2025 NASCAR Cup Series championship?", ["Denny Hamlin", "William Byron", "Joey Logano", "Kyle Larson"], "Kyle Larson", 2),
	// https://en.wikipedia.org/wiki/2025_Indian_Premier_League
	q("Which team won its first IPL title in June 2025?", ["Punjab Kings", "Delhi Capitals", "Royal Challengers Bengaluru", "Lucknow Super Giants"], "Royal Challengers Bengaluru", 2),
	// https://en.wikipedia.org/wiki/2025_Six_Nations_Championship
	q("Which team won the Six Nations in March 2025?", ["Scotland", "France", "Ireland", "England"], "France", 2),
	// https://en.wikipedia.org/wiki/2026_Six_Nations_Championship
	q("Whose last-kick penalty beat England 48–46 to win France the 2026 Six Nations?", ["Romain Ntamack", "Antoine Dupont", "Thomas Ramos", "Damian Penaud"], "Thomas Ramos", 2),
	// https://en.wikipedia.org/wiki/2025_British_&_Irish_Lions_tour_to_Australia
	q("By what score did the Lions win their 2025 test series in Australia?", ["3–1", "2–1", "2–0", "3–0"], "2–1", 2),
	// https://en.wikipedia.org/wiki/2025_World_Athletics_Championships
	q("Which city hosted the World Athletics Championships in Sept 2025?", ["Doha", "Eugene", "Tokyo", "Budapest"], "Tokyo", 1),
	// https://en.wikipedia.org/wiki/2025_CONCACAF_Gold_Cup
	q("Which country won the CONCACAF Gold Cup in July 2025?", ["Mexico", "Canada", "Panama", "United States"], "Mexico", 2),
	// https://en.wikipedia.org/wiki/2025_WNBA_Finals
	q("Which team swept the Phoenix Mercury in the Oct 2025 WNBA Finals?", ["Indiana Fever", "Minnesota Lynx", "Las Vegas Aces", "New York Liberty"], "Las Vegas Aces", 2),
	// https://en.wikipedia.org/wiki/2025_World_Series
	q("Which team lost a seven-game World Series to the Dodgers in Nov 2025?", ["New York Yankees", "Toronto Blue Jays", "Cleveland Guardians", "Seattle Mariners"], "Toronto Blue Jays", 2),
	// https://en.wikipedia.org/wiki/2026_Winter_Olympics_medal_table
	q("Which three NOCs made their Winter Olympic debut at Milano Cortina 2026?", ["Kenya, Ghana and Qatar", "Haiti, Fiji and Bahrain", "Benin, Guinea-Bissau and UAE", "Nigeria, Togo and Oman"], "Benin, Guinea-Bissau and UAE", 3),
	// https://en.wikipedia.org/wiki/2026_Winter_Olympics_opening_ceremony
	q("Which stadium hosted most of the Feb 2026 Winter Olympics opening ceremony?", ["Arena di Verona", "San Siro", "Allianz Stadium", "Stadio Olimpico"], "San Siro", 2),
	// https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
	q("How many host countries did the 2026 men's World Cup have?", ["one", "three", "two", "four"], "three", 2),
	// https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
	q("Who won the Golden Boot at the 2026 men's World Cup with 10 goals?", ["Kylian Mbappé", "Harry Kane", "Lionel Messi", "Lamine Yamal"], "Kylian Mbappé", 2),
	// https://en.wikipedia.org/wiki/2025–26_UEFA_Champions_League
	q("In which city was the May 2026 Champions League final played?", ["Istanbul", "Munich", "London", "Budapest"], "Budapest", 2),
	// https://en.wikipedia.org/wiki/2025–26_UEFA_Champions_League
	q("How did PSG beat Arsenal in the May 2026 Champions League final?", ["in extra time", "on penalties", "on away goals", "by 2–0 in regulation"], "on penalties", 2),
	// https://en.wikipedia.org/wiki/2026_Preakness_Stakes
	q("Which horse won the Preakness Stakes in May 2026?", ["Sovereignty", "Journalism", "Napoleon Solo", "Golden Tempo"], "Napoleon Solo", 2),
	// https://en.wikipedia.org/wiki/2026_Preakness_Stakes
	q("Where was the May 2026 Preakness Stakes run, a first for the race?", ["Laurel Park", "Saratoga", "Belmont Park", "Pimlico"], "Laurel Park", 3),
	// https://en.wikipedia.org/wiki/2026_Tour_de_France_Femmes
	q("Who won the Tour de France Femmes in Aug 2026, her second title?", ["Lorena Wiebes", "Katarzyna Niewiadoma", "Demi Vollering", "Elisa Longo Borghini"], "Demi Vollering", 2),
	// https://en.wikipedia.org/wiki/2026_Tour_de_France_Femmes
	q("Which climb hosted stage 7 of the Aug 2026 Tour de France Femmes?", ["Col du Tourmalet", "Puy de Dôme", "Alpe d'Huez", "Mont Ventoux"], "Mont Ventoux", 3),
	// https://en.wikipedia.org/wiki/2025_World_Aquatics_Championships
	q("Which city hosted the World Aquatics Championships in July 2025?", ["Singapore", "Fukuoka", "Kazan", "Budapest"], "Singapore", 2),
	// https://en.wikipedia.org/wiki/2026_Asian_Games
	q("Which Japanese prefecture hosted the Sept 2026 Asian Games?", ["Aichi", "Osaka", "Fukuoka", "Hokkaido"], "Aichi", 2),
	// https://en.wikipedia.org/wiki/Armand_Duplantis
	q("Which pole vaulter won the inaugural World Ultimate Championship title in 2026?", ["Armand Duplantis", "Sam Kendricks", "Renaud Lavillenie", "EJ Obiena"], "Armand Duplantis", 2),
	// https://en.wikipedia.org/wiki/Faith_Kipyegon
	q("Which Kenyan won the 1500 m at the Sept 2025 World Championships?", ["Faith Kipyegon", "Hellen Obiri", "Beatrice Chebet", "Mary Moraa"], "Faith Kipyegon", 2),
	// https://en.wikipedia.org/wiki/Lamine_Yamal
	q("Which Barcelona winger won the Kopa Trophy in 2024, 2025 and 2026?", ["Gavi", "Lamine Yamal", "Pedri", "Fermín López"], "Lamine Yamal", 2),
	// https://en.wikipedia.org/wiki/2025_NBA_season
	q("Which team won the NBA Cup in Dec 2024, its season's in-season tournament?", ["Los Angeles Lakers", "Oklahoma City Thunder", "Milwaukee Bucks", "Indiana Pacers"], "Milwaukee Bucks", 2),
	// https://en.wikipedia.org/wiki/2025_NBA_season
	q("Which team did the Thunder beat in seven games in the June 2025 NBA Finals?", ["Cleveland Cavaliers", "Boston Celtics", "Indiana Pacers", "New York Knicks"], "Indiana Pacers", 2),
	// https://en.wikipedia.org/wiki/2025_Major_League_Baseball_season
	q("In which city did the Athletics start playing in 2025 after leaving Oakland?", ["San Jose", "Las Vegas", "Salt Lake City", "West Sacramento"], "West Sacramento", 2),
	// https://en.wikipedia.org/wiki/2025_Major_League_Baseball_season
	q("How was the July 2025 MLB All-Star Game decided after a 6–6 tie?", ["a skills contest", "a home run swing-off", "a coin toss", "extra innings"], "a home run swing-off", 3),
	// https://en.wikipedia.org/wiki/2024–25_NHL_season
	q("What did Utah's NHL team name itself at the end of its first season in 2025?", ["Utah Outlaws", "Utah Yeti", "Utah Blizzard", "Utah Mammoth"], "Utah Mammoth", 2),
];

export const CUR_POLITICAL_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2025_Chilean_presidential_election
	q("Who won Chile's Dec 2025 presidential runoff?", ["Evelyn Matthei", "Jeannette Jara", "Johannes Kaiser", "José Antonio Kast"], "José Antonio Kast", 2),
	// https://en.wikipedia.org/wiki/2025_Chilean_presidential_election
	q("Which Communist Party candidate lost Chile's Dec 2025 presidential runoff?", ["Jeannette Jara", "Michelle Bachelet", "Evelyn Matthei", "Camila Vallejo"], "Jeannette Jara", 2),
	// https://en.wikipedia.org/wiki/2025_Bolivian_general_election
	q("Who won Bolivia's Oct 2025 presidential runoff?", ["Luis Arce", "Jorge Quiroga", "Evo Morales", "Rodrigo Paz"], "Rodrigo Paz", 2),
	// https://en.wikipedia.org/wiki/2025_Ecuadorian_general_election
	q("Who was re-elected president of Ecuador in April 2025?", ["Daniel Noboa", "Rafael Correa", "Guillermo Lasso", "Luisa González"], "Daniel Noboa", 2),
	// https://en.wikipedia.org/wiki/2025_Romanian_presidential_election
	q("Who won Romania's May 2025 presidential runoff?", ["George Simion", "Călin Georgescu", "Nicușor Dan", "Klaus Iohannis"], "Nicușor Dan", 2),
	// https://en.wikipedia.org/wiki/2025_Romanian_presidential_election
	q("Romania re-ran its presidential vote in 2025 after annulling the 2024 win of which candidate?", ["George Simion", "Elena Lasconi", "Călin Georgescu", "Nicușor Dan"], "Călin Georgescu", 3),
	// https://en.wikipedia.org/wiki/2025_Czech_parliamentary_election
	q("Which ex-prime minister's ANO party won Czechia's Oct 2025 election?", ["Tomio Okamura", "Bohuslav Sobotka", "Petr Fiala", "Andrej Babiš"], "Andrej Babiš", 2),
	// https://en.wikipedia.org/wiki/2025_Norwegian_parliamentary_election
	q("Whose Labour Party won the most seats in Norway's Sept 2025 election?", ["Jens Stoltenberg", "Jonas Gahr Støre", "Erna Solberg", "Sylvi Listhaug"], "Jonas Gahr Støre", 2),
	// https://en.wikipedia.org/wiki/2025_Irish_presidential_election
	q("Who won Ireland's Oct 2025 presidential election in a landslide?", ["Mary Lou McDonald", "Heather Humphreys", "Catherine Connolly", "Jim Gavin"], "Catherine Connolly", 2),
	// https://en.wikipedia.org/wiki/2025_Dutch_general_election
	q("Which party tied PVV for the most seats in the Oct 2025 Dutch election?", ["GroenLinks–PvdA", "CDA", "VVD", "D66"], "D66", 3),
	// https://en.wikipedia.org/wiki/2025_Honduran_general_election
	q("Who was declared winner of Honduras's Nov 2025 presidential election?", ["Rixi Moncada", "Nasry Asfura", "Salvador Nasralla", "Xiomara Castro"], "Nasry Asfura", 3),
	// https://en.wikipedia.org/wiki/2025_Liberal_Democratic_Party_(Japan)_presidential_election
	q("Which Japanese prime minister announced his resignation in Sept 2025?", ["Yoshihide Suga", "Taro Kono", "Shigeru Ishiba", "Fumio Kishida"], "Shigeru Ishiba", 2),
	// https://en.wikipedia.org/wiki/2026_Swedish_general_election
	q("Whose Social Democrats led Sweden's opposition to a narrow win in Sept 2026?", ["Ulf Kristersson", "Stefan Löfven", "Jimmie Åkesson", "Magdalena Andersson"], "Magdalena Andersson", 2),
	// https://en.wikipedia.org/wiki/2026_United_States_elections
	q("Which party won majorities in both houses of the US Congress in Nov 2026?", ["Libertarian Party", "Green Party", "Democratic Party", "Republican Party"], "Democratic Party", 2),
	// https://en.wikipedia.org/wiki/2026_Danish_general_election
	q("Which party's 2026 Danish vote share was its lowest since 1903, though it won the most seats?", ["Moderates", "Social Democrats", "Green Left", "Danish People's Party"], "Social Democrats", 3),
	// https://en.wikipedia.org/wiki/2026_Slovenian_parliamentary_election
	q("Who became Slovenia's prime minister for a fourth time in 2026?", ["Janez Janša", "Marjan Šarec", "Robert Golob", "Borut Pahor"], "Janez Janša", 2),
	// https://en.wikipedia.org/wiki/2026_Nepalese_general_election
	q("Youth protests in Sept 2025 forced out which Nepali prime minister?", ["Sher Bahadur Deuba", "Pushpa Kamal Dahal", "Baburam Bhattarai", "K. P. Sharma Oli"], "K. P. Sharma Oli", 2),
	// https://en.wikipedia.org/wiki/2026_Nepalese_general_election
	q("Which party won a landslide in Nepal's March 2026 election?", ["Janata Samajbadi Party", "Rastriya Swatantra Party", "Nepali Congress", "CPN (UML)"], "Rastriya Swatantra Party", 3),
	// https://en.wikipedia.org/wiki/2026_Thai_general_election
	q("Who was re-elected Thailand's prime minister in March 2026?", ["Srettha Thavisin", "Anutin Charnvirakul", "Paetongtarn Shinawatra", "Pita Limjaroenrat"], "Anutin Charnvirakul", 2),
	// https://en.wikipedia.org/wiki/2026_Ugandan_general_election
	q("Who was declared winner of Uganda's Jan 2026 presidential election?", ["Yoweri Museveni", "Bobi Wine", "Robert Kyagulanyi", "Kizza Besigye"], "Yoweri Museveni", 2),
	// https://en.wikipedia.org/wiki/2026_Armenian_parliamentary_election
	q("Whose Civil Contract party won Armenia's June 2026 election?", ["Robert Kocharyan", "Serzh Sargsyan", "Nikol Pashinyan", "Samvel Karapetyan"], "Nikol Pashinyan", 2),
	// https://en.wikipedia.org/wiki/2026_Bulgarian_parliamentary_election
	q("Which Bulgarian president resigned in Jan 2026 to lead a party into parliament?", ["Kiril Petkov", "Rumen Radev", "Boyko Borisov", "Rosen Zhelyazkov"], "Rumen Radev", 2),
	// https://en.wikipedia.org/wiki/2026_Quebec_general_election
	q("Which party lost all 79 of its seats in Quebec's Oct 2026 election?", ["Quebec Liberal Party", "Québec solidaire", "Parti Québécois", "Coalition Avenir Québec"], "Coalition Avenir Québec", 2),
	// https://en.wikipedia.org/wiki/2026_Quebec_general_election
	q("Which party won the most seats in Quebec's Oct 2026 election?", ["Quebec Liberal Party", "Québec solidaire", "Coalition Avenir Québec", "Parti Québécois"], "Parti Québécois", 2),
	// https://en.wikipedia.org/wiki/2025_Malawian_general_election
	q("Who was re-elected Malawi's president in Sept 2025, returning to office?", ["Bakili Muluzi", "Lazarus Chakwera", "Joyce Banda", "Peter Mutharika"], "Peter Mutharika", 2),
	// https://en.wikipedia.org/wiki/2025_Cameroonian_presidential_election
	q("Which long-serving president was declared winner of Cameroon's Oct 2025 election?", ["Cabral Libii", "Paul Biya", "Maurice Kamto", "Issa Tchiroma"], "Paul Biya", 2),
	// https://en.wikipedia.org/wiki/2025_Ivorian_presidential_election
	q("Who was re-elected president of Ivory Coast in Oct 2025?", ["Laurent Gbagbo", "Alassane Ouattara", "Jean-Louis Billon", "Simone Gbagbo"], "Alassane Ouattara", 2),
	// https://en.wikipedia.org/wiki/2025_Tanzanian_general_election
	q("Who was Tanzania's president seeking a second term in Oct 2025?", ["Jakaya Kikwete", "John Magufuli", "Samia Suluhu Hassan", "Tundu Lissu"], "Samia Suluhu Hassan", 2),
	// https://en.wikipedia.org/wiki/2025_Madagascar_coup_d'état
	q("Which Madagascar president was overthrown in an Oct 2025 coup?", ["Andry Rajoelina", "Marc Ravalomanana", "Hery Rajaonarimampianina", "Didier Ratsiraka"], "Andry Rajoelina", 2),
	// https://en.wikipedia.org/wiki/2025_Madagascar_coup_d'état
	q("Which colonel was sworn in as Madagascar's interim president in Oct 2025?", ["Richard Ravalomanana", "Christian Ntsay", "Andry Rajoelina", "Michael Randrianirina"], "Michael Randrianirina", 3),
	// https://en.wikipedia.org/wiki/2025_United_States_federal_government_shutdown
	q("When did the record-long US government shutdown that began Oct 1, 2025 end?", ["November 12, 2025", "October 31, 2025", "January 20, 2026", "December 1, 2025"], "November 12, 2025", 2),
	// https://en.wikipedia.org/wiki/2025_Nepalese_Gen_Z_protests
	q("Nepal's Sept 2025 Gen Z protests began alongside a ban on what?", ["foreign films", "cryptocurrency", "social media", "motorcycles"], "social media", 2),
];

export const CUR_ARTS_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Sinners_(2025_film)
	q("In which US region is the 2025 film 'Sinners' set?", ["Louisiana bayou", "Mississippi Delta", "Appalachia", "Texas Hill Country"], "Mississippi Delta", 2),
	// https://en.wikipedia.org/wiki/Avatar:_Fire_and_Ash
	q("What is the third Avatar film, released in Dec 2025, called?", ["The Seed Bearer", "The Tulkun Rider", "Fire and Ash", "The Way of Water"], "Fire and Ash", 2),
	// https://en.wikipedia.org/wiki/Wicked:_For_Good
	q("Who directed 'Wicked: For Good' (2025)?", ["Rob Marshall", "Tom Hooper", "Bill Condon", "Jon M. Chu"], "Jon M. Chu", 2),
	// https://en.wikipedia.org/wiki/79th_Tony_Awards
	q("At which venue were the Tony Awards held in June 2026?", ["Carnegie Hall", "Beacon Theatre", "Lincoln Center Theater", "Radio City Music Hall"], "Radio City Music Hall", 2),
	// https://en.wikipedia.org/wiki/2025_Met_Gala
	q("What was the theme of the 2025 Met Gala exhibition?", ["Camp: Notes on Fashion", "Sleeping Beauties: Reawakening Fashion", "Heavenly Bodies", "Superfine: Tailoring Black Style"], "Superfine: Tailoring Black Style", 3),
	// https://en.wikipedia.org/wiki/78th_British_Academy_Film_Awards
	q("Which film won Best Film at the Feb 2025 BAFTAs?", ["Anora", "Conclave", "The Brutalist", "Emilia Pérez"], "Conclave", 2),
	// https://en.wikipedia.org/wiki/78th_Tony_Awards
	q("Which musical won Best Musical at the June 2025 Tony Awards?", ["Just in Time", "Death Becomes Her", "Maybe Happy Ending", "Buena Vista Social Club"], "Maybe Happy Ending", 2),
];

export const CUR_SCIENCE_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/3I/ATLAS
	q("3I/ATLAS, discovered in July 2025, was the third known object of what kind?", ["interstellar", "near-Earth", "sungrazing", "trans-Neptunian"], "interstellar", 2),
	// https://en.wikipedia.org/wiki/3I/ATLAS
	q("Which interstellar object was the first ever confirmed, before 2025's 3I/ATLAS?", ["2I/Borisov", "ʻOumuamua", "Arrokoth", "Sedna"], "ʻOumuamua", 2),
	// https://en.wikipedia.org/wiki/Vera_C._Rubin_Observatory
	q("The Vera C. Rubin Observatory, which released first images in 2025, is in which country?", ["Argentina", "Chile", "Peru", "South Africa"], "Chile", 2),
	// https://en.wikipedia.org/wiki/Blue_Ghost_Mission_1
	q("Which company's Blue Ghost lander touched down on the Moon in March 2025?", ["ispace", "Intuitive Machines", "Astrobotic", "Firefly Aerospace"], "Firefly Aerospace", 2),
	// https://en.wikipedia.org/wiki/Olo_(color)
	q("Olo, a color announced in 2025, can only be seen by stimulating which cone cells alone?", ["L cones", "S cones", "rod cells", "M cones"], "M cones", 3),
	// https://en.wikipedia.org/wiki/Tianwen-2
	q("China's Tianwen-2, launched in May 2025, is a sample-return mission to what?", ["the Moon", "a comet", "an asteroid", "Mars"], "an asteroid", 2),
	// https://en.wikipedia.org/wiki/Tianwen-2
	q("Tianwen-2 reached which near-Earth asteroid in July 2026?", ["Dimorphos", "Bennu", "Kamoʻoalewa", "Ryugu"], "Kamoʻoalewa", 3),
	// https://en.wikipedia.org/wiki/2026_total_solar_eclipse
	q("Which European country's north saw a total solar eclipse on Aug 12, 2026?", ["France", "Italy", "Greece", "Spain"], "Spain", 2),
	// https://en.wikipedia.org/wiki/2026_total_solar_eclipse
	q("Which island nation saw totality in the Aug 2026 solar eclipse?", ["Cyprus", "Malta", "Iceland", "Ireland"], "Iceland", 2),
	// https://en.wikipedia.org/wiki/Fram2
	q("Fram2, launched in 2025, was the first human spaceflight into what kind of orbit?", ["lunar orbit", "polar orbit", "Molniya orbit", "geostationary orbit"], "polar orbit", 2),
	// https://en.wikipedia.org/wiki/Fram2
	q("Which entrepreneur funded and flew on the 2025 Fram2 mission?", ["Yusaku Maezawa", "Jared Isaacman", "Chun Wang", "Dennis Tito"], "Chun Wang", 3),
	// https://en.wikipedia.org/wiki/Shubhanshu_Shukla
	q("Shubhanshu Shukla became the first Indian to visit which station in 2025?", ["Tiangong space station", "Mir space station", "International Space Station", "Skylab orbital lab"], "International Space Station", 2),
	// https://en.wikipedia.org/wiki/Shubhanshu_Shukla
	q("Before Shubhanshu Shukla in 2025, who was the only Indian to go to space?", ["Ravish Malhotra", "Rakesh Sharma", "Kalpana Chawla", "Sunita Williams"], "Rakesh Sharma", 2),
	// https://en.wikipedia.org/wiki/Crew-11
	q("Which NASA astronaut's medical issue ended Crew-11 early in Jan 2026?", ["Zena Cardman", "Michael Fincke", "Butch Wilmore", "Sunita Williams"], "Michael Fincke", 3),
	// https://en.wikipedia.org/wiki/SPHEREx
	q("NASA's SPHEREx telescope, launched in March 2025, surveys the sky in which light?", ["near-infrared", "X-ray", "radio", "ultraviolet"], "near-infrared", 2),
	// https://en.wikipedia.org/wiki/DeepSeek
	q("In which city is the AI company DeepSeek, which released its R1 model in Jan 2025, based?", ["Beijing", "Hangzhou", "Shenzhen", "Shanghai"], "Hangzhou", 2),
	// https://en.wikipedia.org/wiki/DeepSeek
	q("Who founded the AI company DeepSeek?", ["Liang Wenfeng", "Robin Li", "Jack Ma", "Zhang Yiming"], "Liang Wenfeng", 3),
	// https://en.wikipedia.org/wiki/Lunar_Trailblazer
	q("NASA's Lunar Trailblazer, launched in Feb 2025, was meant to map what on the Moon?", ["lava tubes", "iron ore", "helium-3", "water"], "water", 2),
];

export const CUR_HISTORY_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Twelve-Day_War
	q("The Twelve-Day War of June 2025 was fought between Israel and which country?", ["Iraq", "Lebanon", "Iran", "Syria"], "Iran", 1),
	// https://en.wikipedia.org/wiki/Operation_Sindoor
	q("What was India's May 2025 military operation against Pakistan codenamed?", ["Operation Vijay", "Operation Meghdoot", "Operation Sindoor", "Operation Shakti"], "Operation Sindoor", 2),
	// https://en.wikipedia.org/wiki/Air_India_Flight_171
	q("From which Indian city did Air India Flight 171 take off before crashing in June 2025?", ["Bengaluru", "Mumbai", "Delhi", "Ahmedabad"], "Ahmedabad", 2),
	// https://en.wikipedia.org/wiki/Air_India_Flight_171
	q("Which aircraft model was Air India Flight 171, lost in June 2025?", ["Boeing 787", "Boeing 777", "Airbus A350", "Airbus A330"], "Boeing 787", 2),
	// https://en.wikipedia.org/wiki/2025_Potomac_River_mid-air_collision
	q("Over which river did an airliner and Army helicopter collide in Jan 2025?", ["Anacostia River", "Hudson River", "Potomac River", "Delaware River"], "Potomac River", 2),
	// https://en.wikipedia.org/wiki/2025_Iberian_Peninsula_blackout
	q("Which two countries lost power in the April 2025 Iberian blackout?", ["Portugal and Morocco", "Spain and France", "Spain and Portugal", "France and Andorra"], "Spain and Portugal", 1),
	// https://en.wikipedia.org/wiki/Death_and_funeral_of_Pope_Francis
	q("On which holiday did Pope Francis die in April 2025?", ["Ash Wednesday", "Good Friday", "Palm Sunday", "Easter Monday"], "Easter Monday", 2),
	// https://en.wikipedia.org/wiki/2025_papal_conclave
	q("On which ballot did the May 2025 conclave elect Pope Leo XIV?", ["tenth", "second", "seventh", "fourth"], "fourth", 2),
	// https://en.wikipedia.org/wiki/2025_Cambodia–Thailand_border_conflict
	q("Which two countries fought a border conflict starting in July 2025?", ["Cambodia and Thailand", "Myanmar and Thailand", "Laos and Thailand", "Vietnam and Cambodia"], "Cambodia and Thailand", 2),
];

export const CUR_NATURE_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2025_Myanmar_earthquake
	q("A magnitude 7.7 earthquake struck near which city in Myanmar in March 2025?", ["Naypyidaw", "Yangon", "Bago", "Mandalay"], "Mandalay", 2),
	// https://en.wikipedia.org/wiki/2025_Kamchatka_earthquake
	q("A magnitude 8.8 quake struck off which Russian peninsula in July 2025?", ["Yamal", "Kamchatka", "Chukotka", "Taymyr"], "Kamchatka", 2),
	// https://en.wikipedia.org/wiki/Hurricane_Melissa
	q("Hurricane Melissa made a catastrophic landfall on which island in Oct 2025?", ["Jamaica", "Hispaniola", "Cuba", "Puerto Rico"], "Jamaica", 1),
	// https://en.wikipedia.org/wiki/Hurricane_Melissa
	q("Hurricane Melissa (2025) tied which storm as the strongest Atlantic hurricane by wind speed?", ["Hurricane Allen", "Hurricane Andrew", "Hurricane Katrina", "Hurricane Wilma"], "Hurricane Allen", 2),
	// https://en.wikipedia.org/wiki/January_2025_Southern_California_wildfires
	q("The Eaton Fire of Jan 2025 burned through which Los Angeles-area community?", ["Pasadena", "Altadena", "Santa Monica", "Malibu"], "Altadena", 2),
	// https://en.wikipedia.org/wiki/January_2025_Southern_California_wildfires
	q("Which winds drove the Los Angeles wildfires of Jan 2025?", ["Santa Ana winds", "Chinook winds", "Mistral winds", "Sirocco winds"], "Santa Ana winds", 2),
	// https://en.wikipedia.org/wiki/July_2025_Central_Texas_floods
	q("Which Texas river rose 26 feet in 45 minutes during the July 2025 floods?", ["Brazos River", "Colorado River", "Rio Grande", "Guadalupe River"], "Guadalupe River", 2),
];

export const CUR_GAMES_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Nintendo_Switch_2
	q("Nintendo's Switch 2 console was released in June of which year?", ["2025", "2026", "2024", "2023"], "2025", 1),
	// https://en.wikipedia.org/wiki/Nintendo_Switch_2
	q("What can the Switch 2's Joy-Con 2 controllers also act as, new for 2025?", ["a webcam", "a steering wheel", "a stylus", "a computer mouse"], "a computer mouse", 2),
	// https://en.wikipedia.org/wiki/Mario_Kart_World
	q("How many racers can compete in a race in 2025's 'Mario Kart World'?", ["32", "16", "24", "12"], "24", 2),
	// https://en.wikipedia.org/wiki/Donkey_Kong_Bananza
	q("Which teenage character joins Donkey Kong in 2025's 'Donkey Kong Bananza'?", ["Cranky Kong", "Diddy Kong", "Dixie Kong", "Pauline"], "Pauline", 2),
	// https://en.wikipedia.org/wiki/Hollow_Knight:_Silksong
	q("Who is the playable heroine of 2025's 'Hollow Knight: Silksong'?", ["Hornet", "Myla", "Cornifer", "Quirrel"], "Hornet", 2),
	// https://en.wikipedia.org/wiki/Battlefield_6
	q("What is the free battle royale mode of 2025's 'Battlefield 6' called?", ["Hazard Zone", "Warzone", "Firestorm", "RedSec"], "RedSec", 3),
	// https://en.wikipedia.org/wiki/Pokémon_Legends:_Z-A
	q("In which city is 2025's 'Pokémon Legends: Z-A' set entirely?", ["Jubilife City", "Lumiose City", "Castelia City", "Saffron City"], "Lumiose City", 2),
	// https://en.wikipedia.org/wiki/Ghost_of_Yōtei
	q("'Ghost of Yōtei' (2025) is a sequel to which game?", ["Nioh", "Rise of the Ronin", "Ghost of Tsushima", "Sekiro"], "Ghost of Tsushima", 1),
	// https://en.wikipedia.org/wiki/Ghost_of_Yōtei
	q("What is the name of the heroine of 2025's 'Ghost of Yōtei'?", ["Naoe", "Tomoe", "Yuna", "Atsu"], "Atsu", 2),
	// https://en.wikipedia.org/wiki/Death_Stranding_2:_On_the_Beach
	q("Who directed 2025's 'Death Stranding 2: On the Beach'?", ["Shinji Mikami", "Yoko Taro", "Hideo Kojima", "Hidetaka Miyazaki"], "Hideo Kojima", 1),
	// https://en.wikipedia.org/wiki/Elden_Ring_Nightreign
	q("Which studio made 2025's roguelike spin-off 'Elden Ring Nightreign'?", ["Team Ninja", "FromSoftware", "Bandai Namco Studios", "Capcom"], "FromSoftware", 2),
	// https://en.wikipedia.org/wiki/Split_Fiction
	q("Which studio made the 2025 co-op-only game 'Split Fiction'?", ["Remedy Entertainment", "Supermassive Games", "Insomniac Games", "Hazelight Studios"], "Hazelight Studios", 2),
	// https://en.wikipedia.org/wiki/Kingdom_Come:_Deliverance_II
	q("Which Czech studio made 2025's 'Kingdom Come: Deliverance II'?", ["CD Projekt Red", "Bohemia Interactive", "SCS Software", "Warhorse Studios"], "Warhorse Studios", 3),
	// https://en.wikipedia.org/wiki/Resident_Evil_Requiem
	q("Which FBI analyst is a new playable character in 2026's 'Resident Evil Requiem'?", ["Ada Wong", "Claire Redfield", "Grace Ashcroft", "Jill Valentine"], "Grace Ashcroft", 2),
	// https://en.wikipedia.org/wiki/007_First_Light
	q("Which studio made the James Bond game '007 First Light' (2026)?", ["Activision", "Ubisoft", "Eidos Montréal", "IO Interactive"], "IO Interactive", 2),
	// https://en.wikipedia.org/wiki/Marvel's_Wolverine
	q("Which studio made 'Marvel's Wolverine' (2026)?", ["Insomniac Games", "Sucker Punch", "Naughty Dog", "Santa Monica Studio"], "Insomniac Games", 2),
	// https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
	q("Who are the two lead criminals in 'Grand Theft Auto VI'?", ["Franklin and Lamar", "Jason and Lucia", "Tommy and Lance", "Niko and Roman"], "Jason and Lucia", 3),
	// https://en.wikipedia.org/wiki/Clair_Obscur:_Expedition_33
	q("Which French studio made 2025's 'Clair Obscur: Expedition 33'?", ["Don't Nod", "Sandfall Interactive", "Ubisoft Montpellier", "Quantic Dream"], "Sandfall Interactive", 2),
	// https://en.wikipedia.org/wiki/Clair_Obscur:_Expedition_33
	q("In 'Clair Obscur: Expedition 33,' who erases people each year in the Gommage?", ["the Paintress", "the Curator", "the Nevron", "the Gestral"], "the Paintress", 3),
	// https://en.wikipedia.org/wiki/Blue_Prince
	q("The 2025 puzzle game 'Blue Prince' is set in a mansion with how many rooms in its blueprint?", ["64", "45", "100", "30"], "45", 3),
	// https://en.wikipedia.org/wiki/Hades_II
	q("Who is the heroine of 2025's 'Hades II'?", ["Persephone", "Nyx", "Melinoë", "Zagreus"], "Melinoë", 2),
	// https://en.wikipedia.org/wiki/Kirby_Air_Riders
	q("Who directed 2025's 'Kirby Air Riders,' the first Kirby game he directed in years?", ["Masahiro Sakurai", "Satoru Iwata", "Shigeru Miyamoto", "Eiji Aonuma"], "Masahiro Sakurai", 2),
	// https://en.wikipedia.org/wiki/Metroid_Prime_4:_Beyond
	q("Which studio made 2025's 'Metroid Prime 4: Beyond'?", ["Intelligent Systems", "Retro Studios", "Next Level Games", "Monolith Soft"], "Retro Studios", 2),
	// https://en.wikipedia.org/wiki/Metroid_Prime_4:_Beyond
	q("Which rival bounty hunter confronts Samus in 'Metroid Prime 4: Beyond' (2025)?", ["Sylux", "Rundas", "Ridley", "Dark Samus"], "Sylux", 3),
	// https://en.wikipedia.org/wiki/Dispatch_(video_game)
	q("Which studio made the 2025 superhero workplace comedy game 'Dispatch'?", ["AdHoc Studio", "Supermassive Games", "Telltale Games", "Dontnod"], "AdHoc Studio", 2),
	// https://en.wikipedia.org/wiki/Dispatch_(video_game)
	q("Which actor voices Robert Robertson in the 2025 game 'Dispatch'?", ["Aaron Paul", "Nolan North", "Troy Baker", "Bryan Cranston"], "Aaron Paul", 2),
	// https://en.wikipedia.org/wiki/Peak_(video_game)
	q("What do players do in the 2025 co-op hit 'Peak'?", ["sail a ship", "climb a mountain", "dig a mine", "build a city"], "climb a mountain", 2),
	// https://en.wikipedia.org/wiki/R.E.P.O.
	q("Which Swedish studio made the 2025 co-op horror game 'R.E.P.O.'?", ["Semiwork", "Coffee Stain", "Hazelight", "Landfall"], "Semiwork", 3),
	// https://en.wikipedia.org/wiki/Pokémon_Champions
	q("On which date in 2026 did 'Pokémon Champions' launch on Switch?", ["April 8", "March 3", "June 17", "February 27"], "April 8", 3),
];

export const CUR_CELEBRITY_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/KPop_Demon_Hunters
	q("Which 2025 Netflix film follows the K-pop girl group Huntrix?", ["K-Pop Slayers", "Idol Hunters", "KPop Demon Hunters", "Seoul Spirits"], "KPop Demon Hunters", 2),
	// https://en.wikipedia.org/wiki/Sinners_(2025_film)
	q("Who played twin brothers in Ryan Coogler's 2025 film 'Sinners'?", ["John Boyega", "Daniel Kaluuya", "Michael B. Jordan", "Jonathan Majors"], "Michael B. Jordan", 2),
	// https://en.wikipedia.org/wiki/Hamnet_(film)
	q("Who played William Shakespeare in the 2025 film 'Hamnet'?", ["Josh O'Connor", "Andrew Scott", "Joe Alwyn", "Paul Mescal"], "Paul Mescal", 2),
	// https://en.wikipedia.org/wiki/Minecraft_Movie
	q("Who played Steve in 2025's 'A Minecraft Movie'?", ["Danielle Brooks", "Jason Momoa", "Jennifer Coolidge", "Jack Black"], "Jack Black", 2),
	// https://en.wikipedia.org/wiki/Lilo_&_Stitch_(2025_film)
	q("Which young actress made her debut as Lilo in the 2025 'Lilo & Stitch' remake?", ["Sydney Agudong", "Auliʻi Cravalho", "Maia Kealoha", "Jacobi Jupe"], "Maia Kealoha", 3),
	// https://en.wikipedia.org/wiki/Zootopia_2
	q("Which singer voices Gazelle in 'Zootopia 2' (2025)?", ["Lady Gaga", "Shakira", "Rihanna", "Beyoncé"], "Shakira", 2),
	// https://en.wikipedia.org/wiki/Zootopia_2
	q("What is the name of the pit viper villain in 'Zootopia 2' (2025)?", ["Sid Slither", "Gary De'Snake", "Viktor Viper", "Hiss McFang"], "Gary De'Snake", 2),
	// https://en.wikipedia.org/wiki/98th_Academy_Awards
	q("Who hosted the Oscars in March 2026 for the second straight year?", ["Conan O'Brien", "Chris Rock", "Billy Crystal", "Jimmy Kimmel"], "Conan O'Brien", 2),
	// https://en.wikipedia.org/wiki/82nd_Golden_Globe_Awards
	q("Who became the first solo female host of the Golden Globes in Jan 2025?", ["Tina Fey", "Nikki Glaser", "Amy Poehler", "Ali Wong"], "Nikki Glaser", 2),
	// https://en.wikipedia.org/wiki/78th_Tony_Awards
	q("Who hosted the Tony Awards in June 2025?", ["Cynthia Erivo", "Ariana DeBose", "Hugh Jackman", "Lin-Manuel Miranda"], "Cynthia Erivo", 2),
	// https://en.wikipedia.org/wiki/78th_Tony_Awards
	q("Which 'Glee' alum won a 2025 Tony for 'Maybe Happy Ending'?", ["Jonathan Groff", "Lea Michele", "Darren Criss", "Matthew Morrison"], "Darren Criss", 2),
	// https://en.wikipedia.org/wiki/78th_Tony_Awards
	q("Which Pussycat Dolls singer won Best Actress in a Musical at the 2025 Tonys?", ["Nicole Scherzinger", "Ashley Roberts", "Melody Thornton", "Kimberly Wyatt"], "Nicole Scherzinger", 2),
	// https://en.wikipedia.org/wiki/78th_Tony_Awards
	q("Which 'Succession' actress won Best Actress in a Play at the June 2025 Tonys?", ["Sarah Paulson", "Kieran Culkin", "Cate Blanchett", "Sarah Snook"], "Sarah Snook", 2),
	// https://en.wikipedia.org/wiki/Owen_Cooper
	q("Which teen actor won a 2025 Emmy for the Netflix series 'Adolescence'?", ["Owen Cooper", "Jacobi Jupe", "Louis Ashbourne Serkis", "Noah Jupe"], "Owen Cooper", 2),
	// https://en.wikipedia.org/wiki/Adolescence_(TV_series)
	q("How was every episode of 2025's 'Adolescence' filmed?", ["in one continuous take", "on smartphones", "with no dialogue", "in black and white"], "in one continuous take", 2),
	// https://en.wikipedia.org/wiki/Adolescence_(TV_series)
	q("Who co-created and stars in the 2025 Netflix series 'Adolescence'?", ["Paddy Considine", "Stephen Graham", "Tom Hardy", "Jack Thorne"], "Stephen Graham", 2),
	// https://en.wikipedia.org/wiki/The_Pitt
	q("In which city is the 2025 medical drama 'The Pitt' set?", ["Chicago", "Baltimore", "Pittsburgh", "Philadelphia"], "Pittsburgh", 1),
	// https://en.wikipedia.org/wiki/The_Pitt
	q("Which 'ER' star leads the 2025 medical drama 'The Pitt'?", ["Anthony Edwards", "Eriq La Salle", "George Clooney", "Noah Wyle"], "Noah Wyle", 2),
	// https://en.wikipedia.org/wiki/Severance_(TV_series)
	q("What is the sinister company in 'Severance'?", ["Hooli", "Initech", "Cyberdyne Systems", "Lumon Industries"], "Lumon Industries", 2),
	// https://en.wikipedia.org/wiki/Squid_Game_season_3
	q("Who created 'Squid Game,' whose final season came out in June 2025?", ["Hwang Dong-hyuk", "Kim Ji-woon", "Bong Joon-ho", "Park Chan-wook"], "Hwang Dong-hyuk", 2),
	// https://en.wikipedia.org/wiki/Stranger_Things_season_5
	q("On which date did the 'Stranger Things' series finale debut?", ["Jan 1, 2026", "Nov 26, 2025", "Dec 25, 2025", "Dec 31, 2025"], "Dec 31, 2025", 2),
	// https://en.wikipedia.org/wiki/The_White_Lotus_season_3
	q("In which country is the third season of 'The White Lotus' (2025) set?", ["Vietnam", "Japan", "Thailand", "Indonesia"], "Thailand", 1),
	// https://en.wikipedia.org/wiki/The_White_Lotus_season_3
	q("Which BLACKPINK member acted in 'The White Lotus' season 3 (2025)?", ["Rosé", "Lalisa Manobal", "Jisoo Kim", "Jennie Kim"], "Lalisa Manobal", 3),
];

export const CUR_MUSIC_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Super_Bowl_LIX_halftime_show
	q("Who headlined the Super Bowl LIX halftime show in Feb 2025?", ["Kendrick Lamar", "Usher", "Drake", "Travis Scott"], "Kendrick Lamar", 1),
	// https://en.wikipedia.org/wiki/Super_Bowl_LX_halftime_show
	q("Who headlined the Super Bowl LX halftime show in Feb 2026?", ["Bad Bunny", "Shakira", "J Balvin", "Karol G"], "Bad Bunny", 1),
	// https://en.wikipedia.org/wiki/Super_Bowl_LX_halftime_show
	q("Which singer guested at Bad Bunny's Super Bowl LX halftime show in Feb 2026?", ["Jennifer Lopez", "Selena Gomez", "Lady Gaga", "Rihanna"], "Lady Gaga", 2),
	// https://en.wikipedia.org/wiki/Oasis_Live_'25_Tour
	q("In which city did Oasis open their 2025 reunion tour?", ["Manchester", "Dublin", "London", "Cardiff"], "Cardiff", 2),
	// https://en.wikipedia.org/wiki/Back_to_the_Beginning
	q("Which band played its final concert at Villa Park in July 2025?", ["Judas Priest", "Iron Maiden", "Black Sabbath", "Deep Purple"], "Black Sabbath", 1),
	// https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl
	q("In which country did Taylor Swift record 'The Life of a Showgirl'?", ["Sweden", "Ireland", "Japan", "Germany"], "Sweden", 2),
	// https://en.wikipedia.org/wiki/Sam_Fender
	q("Which Sam Fender album won the 2025 Mercury Prize?", ["Spit of You", "Seventeen Going Under", "Hypersonic Missiles", "People Watching"], "People Watching", 2),
	// https://en.wikipedia.org/wiki/Brit_Awards_2026
	q("In which city were the Brit Awards held in Feb 2026, the first time outside London?", ["Glasgow", "Liverpool", "Birmingham", "Manchester"], "Manchester", 2),
	// https://en.wikipedia.org/wiki/Brit_Awards_2026
	q("Who hosted the Brit Awards for the sixth time in Feb 2026?", ["James Corden", "Mo Gilligan", "Romesh Ranganathan", "Jack Whitehall"], "Jack Whitehall", 2),
	// https://en.wikipedia.org/wiki/Glastonbury_Festival_2025
	q("Which 1970s rocker played Glastonbury's Sunday Legends slot in June 2025?", ["Elton John", "Rod Stewart", "Paul McCartney", "Cat Stevens"], "Rod Stewart", 2),
	// https://en.wikipedia.org/wiki/Glastonbury_Festival_2025
	q("Which young American singer headlined Glastonbury in June 2025?", ["Billie Eilish", "Sabrina Carpenter", "Olivia Rodrigo", "Taylor Swift"], "Olivia Rodrigo", 2),
	// https://en.wikipedia.org/wiki/2025_MTV_Video_Music_Awards
	q("Who hosted the MTV Video Music Awards in Sept 2025?", ["Nicki Minaj", "LL Cool J", "Snoop Dogg", "Sabrina Carpenter"], "LL Cool J", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("Who hosted the Grammys in Feb 2026 for a sixth straight time?", ["Kevin Hart", "Jimmy Kimmel", "Queen Latifah", "Trevor Noah"], "Trevor Noah", 2),
	// https://en.wikipedia.org/wiki/Coachella_2026
	q("Which singer headlined Coachella in April 2026 along with Justin Bieber and Karol G?", ["Billie Eilish", "Charli XCX", "Lady Gaga", "Sabrina Carpenter"], "Sabrina Carpenter", 2),
	// https://en.wikipedia.org/wiki/67th_Annual_Grammy_Awards
	q("Which Kendrick Lamar song swept all five of its Grammy nominations in Feb 2025?", ["HUMBLE.", "Luther", "Squabble Up", "Not Like Us"], "Not Like Us", 2),
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2025
	q("In which Swiss city was Eurovision 2025 held?", ["Basel", "Geneva", "Bern", "Zurich"], "Basel", 2),
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2025
	q("Which singer won Eurovision 2024 for Switzerland, bringing the 2025 contest to Basel?", ["Gjon's Tears", "Céline Dion", "Nemo", "Luca Hänni"], "Nemo", 3),
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2026
	q("In which city was Eurovision 2026 held?", ["Salzburg", "Graz", "Linz", "Vienna"], "Vienna", 2),
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2026
	q("How many countries took part in Eurovision 2026, the fewest since 2003?", ["37", "40", "42", "35"], "35", 3),
];

export const CUR_BOOKS_20261109C: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/One_Battle_After_Another
	q("'One Battle After Another' (2025) was inspired by which Thomas Pynchon novel?", ["Vineland", "Mason & Dixon", "Inherent Vice", "Gravity's Rainbow"], "Vineland", 2),
	// https://en.wikipedia.org/wiki/International_Booker_Prize
	q("Which novel by Yáng Shuāng-zǐ won the International Booker in May 2026?", ["Taiwan Travelogue", "Heart Lamp", "Kairos", "On the Calculation of Volume"], "Taiwan Travelogue", 3),
	// https://en.wikipedia.org/wiki/Banu_Mushtaq
	q("Banu Mushtaq's 'Heart Lamp,' winner of the 2025 International Booker, was translated from which language?", ["Tamil", "Hindi", "Malayalam", "Kannada"], "Kannada", 2),
	// https://en.wikipedia.org/wiki/The_Safekeep
	q("Which Yael van der Wouden novel won the 2025 Women's Prize for Fiction?", ["Held", "The Safekeep", "Intermezzo", "Orbital"], "The Safekeep", 2),
];
