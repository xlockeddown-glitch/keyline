import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Friday Nov 6, 2026 weekly evergreen top-up (0.1.131). Grows thin topics (books, geography, music, political, food, arts).
 * No math (over mathCap). No local (already largest). Fact-level dup-checked vs whole deck incl. plus_20261103e.
 * Sources: Wikipedia articles cited above each card (checked Nov 6 2026).
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography";

export const PLUS_20261106: Record<PlusCat, TriviaQ[]> = {
	sports: [
		// https://en.wikipedia.org/wiki/2016_Summer_Olympics
		q("Which country hosted the 2016 Summer Olympics?", ["China", "Brazil", "Japan", "UK"], "Brazil", 1),
		// https://en.wikipedia.org/wiki/Basketball
		q("What is the diameter of a basketball hoop in inches?", ["24", "18", "20", "16"], "18", 2),
		// https://en.wikipedia.org/wiki/Olympic-size_swimming_pool
		q("How long is an Olympic swimming pool in meters?", ["100", "25", "75", "50"], "50", 2),
		// https://en.wikipedia.org/wiki/French_Open
		q("Which Grand Slam tennis tournament is played on clay?", ["French Open", "Australian Open", "US Open", "Wimbledon"], "French Open", 1),
		// https://en.wikipedia.org/wiki/Par_(score)
		q("What is a score of two under par on a hole called in golf?", ["albatross", "bogey", "birdie", "eagle"], "eagle", 2),
		// https://en.wikipedia.org/wiki/Association_football
		q("How many minutes are in a standard soccer match before stoppage?", ["90", "60", "80", "100"], "90", 1),
		// https://en.wikipedia.org/wiki/Maximum_break
		q("What is the maximum break in snooker?", ["120", "100", "147", "155"], "147", 3),
		// https://en.wikipedia.org/wiki/2018_FIFA_World_Cup
		q("Which country won the men's FIFA World Cup in 2018?", ["Germany", "Croatia", "Brazil", "France"], "France", 1),
		// https://en.wikipedia.org/wiki/Karate
		q("Which martial art literally means 'empty hand'?", ["taekwondo", "judo", "kung fu", "karate"], "karate", 2),
		// https://en.wikipedia.org/wiki/Kentucky_Derby
		q("Which horse race is run at Churchill Downs each May?", ["Kentucky Derby", "Breeders' Cup", "Preakness Stakes", "Belmont Stakes"], "Kentucky Derby", 1),
		// https://en.wikipedia.org/wiki/2008_Summer_Olympics
		q("Which city hosted the 2008 Summer Olympics?", ["Sydney", "London", "Beijing", "Athens"], "Beijing", 1),
		// https://en.wikipedia.org/wiki/Six_(cricket)
		q("In cricket, how many runs is a six worth?", ["4", "6", "1", "2"], "6", 1),
		// https://en.wikipedia.org/wiki/Balance_beam
		q("Which gymnastic event uses a 4-inch-wide beam?", ["floor exercise", "vault", "uneven bars", "balance beam"], "balance beam", 1),
		// https://en.wikipedia.org/wiki/100_metres
		q("Who holds the men's 100m world record set in 2009?", ["Usain Bolt", "Carl Lewis", "Justin Gatlin", "Yohan Blake"], "Usain Bolt", 2),
	],
	political: [
		// https://en.wikipedia.org/wiki/Preamble_to_the_United_States_Constitution
		q("What document begins 'We the People'?", ["Articles of Confederation", "Bill of Rights", "U.S. Constitution", "Declaration of Independence"], "U.S. Constitution", 1),
		// https://en.wikipedia.org/wiki/United_States_Electoral_College
		q("Which body elects the president of the United States?", ["Congress sitting jointly", "Supreme Court", "popular vote alone", "Electoral College"], "Electoral College", 1),
		// https://en.wikipedia.org/wiki/Congress_of_the_Union
		q("What is Mexico's national legislature collectively called?", ["National Assembly", "Federal Diet", "General Cortes", "Congress of the Union"], "Congress of the Union", 3),
		// https://en.wikipedia.org/wiki/Article_Three_of_the_United_States_Constitution
		q("Which article of the U.S. Constitution creates the judiciary?", ["Article II", "Article V", "Article III", "Article IV"], "Article III", 2),
		// https://en.wikipedia.org/wiki/Lok_Sabha
		q("What is India's lower house of Parliament called?", ["Sansad", "Vidhan Sabha", "Rajya Sabha", "Lok Sabha"], "Lok Sabha", 2),
		// https://en.wikipedia.org/wiki/Advice_and_consent
		q("Which body confirms U.S. Supreme Court nominees?", ["Senate", "Cabinet", "Electoral College", "House"], "Senate", 1),
		// https://en.wikipedia.org/wiki/Federal_Senate_(Brazil)
		q("What is Brazil's national congress upper house called?", ["National Assembly", "Chamber of Deputies", "Council of State", "Federal Senate"], "Federal Senate", 3),
		// https://en.wikipedia.org/wiki/Separation_of_powers
		q("Which principle divides government into legislative, executive, and judicial branches?", ["federalism", "judicial review", "separation of powers", "popular sovereignty"], "separation of powers", 1),
		// https://en.wikipedia.org/wiki/House_of_Representatives_(Japan)
		q("What is Japan's lower house called?", ["House of Councillors", "House of Representatives", "Privy Council", "National Diet alone"], "House of Representatives", 3),
		// https://en.wikipedia.org/wiki/National_Assembly_(South_Korea)
		q("What is the name of South Korea's national legislature?", ["Congress", "National Assembly", "National Diet", "Duma"], "National Assembly", 3),
		// https://en.wikipedia.org/wiki/United_States_Department_of_State
		q("Which U.S. cabinet department oversees foreign affairs?", ["Defense Department", "Commerce Department", "Interior Department", "State Department"], "State Department", 1),
		// https://en.wikipedia.org/wiki/Federal_Assembly_(Switzerland)
		q("What is the Swiss federal parliament called?", ["National Council alone", "Bundesrat alone", "Council of States alone", "Federal Assembly"], "Federal Assembly", 3),
		// https://en.wikipedia.org/wiki/Full_Faith_and_Credit_Clause
		q("Which clause requires states to respect other states' public acts?", ["Commerce Clause alone", "Elastic Clause alone", "Supremacy Clause alone", "Full Faith and Credit"], "Full Faith and Credit", 3),
	],
	food: [
		// https://en.wikipedia.org/wiki/Vermicelli
		q("What pasta shape's name means 'little worms' in Italian?", ["linguine", "vermicelli", "capellini", "spaghetti"], "vermicelli", 3),
		// https://en.wikipedia.org/wiki/Dashi
		q("What is the Japanese soup stock made from kelp and bonito called?", ["mirin", "miso", "dashi", "sake"], "dashi", 2),
		// https://en.wikipedia.org/wiki/Hollandaise_sauce
		q("Which French sauce is egg yolks whisked with melted butter?", ["hollandaise", "mayonnaise", "béarnaise only", "velouté"], "hollandaise", 2),
		// https://en.wikipedia.org/wiki/Jamón
		q("What is a Spanish cured ham called?", ["jamón", "pancetta", "prosciutto", "speck"], "jamón", 2),
		// https://en.wikipedia.org/wiki/Baked_beans
		q("Which bean is used to make traditional Boston baked beans?", ["pinto bean", "kidney bean", "navy bean", "black bean"], "navy bean", 2),
		// https://en.wikipedia.org/wiki/Tiramisu
		q("What is the Italian dessert of coffee-soaked ladyfingers and mascarpone?", ["tiramisu", "zabaglione", "cannoli", "panna cotta"], "tiramisu", 1),
		// https://en.wikipedia.org/wiki/Saffron
		q("Which spice comes from the dried stigma of a crocus?", ["sumac", "cardamom", "turmeric", "saffron"], "saffron", 1),
		// https://en.wikipedia.org/wiki/Kimchi
		q("What is Korea's fermented cabbage side dish called?", ["sauerkraut", "tsukemono", "kimchi", "pickles"], "kimchi", 1),
		// https://en.wikipedia.org/wiki/Pesto
		q("Which nut flavors traditional pesto Genovese along with basil?", ["pine nut", "walnut", "almond", "cashew"], "pine nut", 2),
		// https://en.wikipedia.org/wiki/Tajine
		q("What is the Moroccan stew cooked in a conical clay pot?", ["couscous", "tagine", "harira", "pastilla"], "tagine", 2),
		// https://en.wikipedia.org/wiki/Fish_and_chips
		q("Which fish is traditionally used in British fish and chips?", ["tuna", "cod", "salmon", "trout"], "cod", 1),
		// https://en.wikipedia.org/wiki/Ghee
		q("What is India's clarified butter called?", ["smen", "schmaltz", "ghee", "niter kibbeh"], "ghee", 2),
		// https://en.wikipedia.org/wiki/Baguette
		q("Which French bread is a long thin loaf?", ["ficelle only", "baguette", "brioche", "boule"], "baguette", 1),
		// https://en.wikipedia.org/wiki/Pancetta
		q("Which Italian cured meat is made from pork belly?", ["bresaola", "pancetta", "coppa", "prosciutto"], "pancetta", 2),
		// https://en.wikipedia.org/wiki/Gyoza
		q("Which Japanese dumpling is typically pan-fried then steamed?", ["shumai", "gyoza", "wonton", "har gow"], "gyoza", 2),
		// https://en.wikipedia.org/wiki/Halo-halo
		q("What is the Filipino dessert of shaved ice and sweet toppings?", ["boba", "raspado", "ais kacang", "halo-halo"], "halo-halo", 3),
		// https://en.wikipedia.org/wiki/Baklava
		q("What is the Turkish layered pastry often filled with nuts?", ["baklava", "kataifi", "simit", "börek"], "baklava", 1),
		// https://en.wikipedia.org/wiki/Wonton
		q("Which Chinese dumpling is typically boiled and served in soup?", ["gyoza", "wonton", "bao", "jiaozi only"], "wonton", 2),
		// https://en.wikipedia.org/wiki/Gravlax
		q("What is Scandinavia's cured salmon often called?", ["kipper", "gravlax", "lox", "smoked whitefish"], "gravlax", 2),
		// https://en.wikipedia.org/wiki/Kofta
		q("What is the Lebanese minced-meat dish grilled on skewers?", ["shawarma", "kofta", "kibbeh", "falafel"], "kofta", 2),
		// https://en.wikipedia.org/wiki/Injera
		q("What is the Ethiopian spongy flatbread used to scoop stews?", ["lavash", "injera", "roti", "pita"], "injera", 2),
		// https://en.wikipedia.org/wiki/Paella
		q("Which Spanish rice dish is traditionally cooked in a wide shallow pan?", ["risotto", "paella", "biryani", "pilaf"], "paella", 1),
		// https://en.wikipedia.org/wiki/Pierogi
		q("What is the Polish dumpling often filled with potato or cheese?", ["varenyky", "pelmeni", "pierogi", "knish"], "pierogi", 2),
		// https://en.wikipedia.org/wiki/Jerk_(cooking)
		q("Which Caribbean seasoning paste flavors Jamaica's grilled chicken?", ["jerk seasoning", "recado rojo", "adobo seasoning", "sofrito"], "jerk seasoning", 2),
		// https://en.wikipedia.org/wiki/Kasha
		q("What is the Russian buckwheat porridge called?", ["grits", "polenta", "kasha", "congee"], "kasha", 3),
	],
	arts: [
		// https://en.wikipedia.org/wiki/David_(Michelangelo)
		q("Who sculpted 'David' in Florence's Accademia?", ["Bernini", "Cellini", "Donatello", "Michelangelo"], "Michelangelo", 1),
		// https://en.wikipedia.org/wiki/Rembrandt
		q("Which Dutch artist painted many self-portraits in the 1600s?", ["Frans Hals", "Jan Steen", "Rembrandt", "Vermeer"], "Rembrandt", 1),
		// https://en.wikipedia.org/wiki/Alexander_Calder
		q("Who created the mobile as a sculpture form?", ["Jean Tinguely", "Isamu Noguchi", "Naum Gabo", "Alexander Calder"], "Alexander Calder", 2),
		// https://en.wikipedia.org/wiki/Migrant_Mother
		q("Who photographed 'Migrant Mother' in 1936?", ["Ansel Adams", "Walker Evans", "Margaret Bourke-White", "Dorothea Lange"], "Dorothea Lange", 2),
		// https://en.wikipedia.org/wiki/Barcelona_chair
		q("Which Bauhaus figure designed the Barcelona Chair with Lilly Reich?", ["Marcel Breuer", "Ludwig Mies van der Rohe", "Ludwig Hilberseimer", "Walter Gropius"], "Ludwig Mies van der Rohe", 3),
		// https://en.wikipedia.org/wiki/Spiral_Jetty
		q("Who created the earthwork 'Spiral Jetty'?", ["Robert Smithson", "Michael Heizer", "Nancy Holt", "Walter De Maria"], "Robert Smithson", 3),
		// https://en.wikipedia.org/wiki/Edgar_Degas
		q("Which Impressionist painted ballet dancers repeatedly?", ["Camille Pissarro", "Pierre-Auguste Renoir", "Edgar Degas", "Claude Monet"], "Edgar Degas", 1),
		// https://en.wikipedia.org/wiki/Seagram_Building
		q("Who designed the Seagram Building with Philip Johnson?", ["Walter Gropius", "Skidmore, Owings & Merrill", "Ludwig Mies van der Rohe", "Le Corbusier"], "Ludwig Mies van der Rohe", 3),
		// https://en.wikipedia.org/wiki/Man_at_the_Crossroads
		q("Which Mexican muralist painted 'Man at the Crossroads'?", ["Rufino Tamayo", "Diego Rivera", "David Alfaro Siqueiros", "José Clemente Orozco"], "Diego Rivera", 3),
		// https://en.wikipedia.org/wiki/Millau_Viaduct
		q("Who designed the Millau Viaduct with Foster?", ["Santiago Calatrava", "Jean Nouvel", "Norman Foster alone", "Michel Virlogeux"], "Michel Virlogeux", 3),
	],
	science: [
		// https://en.wikipedia.org/wiki/Great_Red_Spot
		q("What planet has the Great Red Spot?", ["Mars", "Jupiter", "Neptune", "Saturn"], "Jupiter", 1),
		// https://en.wikipedia.org/wiki/General_relativity
		q("Who proposed the theory of general relativity?", ["Niels Bohr", "Erwin Schrödinger", "Albert Einstein", "Max Planck"], "Albert Einstein", 1),
		// https://en.wikipedia.org/wiki/Alpha_Centauri
		q("What is the nearest star system to the Sun?", ["Alpha Centauri", "Barnard's Star", "Sirius", "Procyon"], "Alpha Centauri", 2),
		// https://en.wikipedia.org/wiki/Hydrogen
		q("What element has atomic number 1?", ["oxygen", "helium", "lithium", "hydrogen"], "hydrogen", 1),
		// https://en.wikipedia.org/wiki/DNA
		q("What is DNA's full name?", ["deoxyribonucleic acid", "dual nucleotide assembly", "deoxy nitrated amine", "dicarboxylic nucleic acid"], "deoxyribonucleic acid", 2),
		// https://en.wikipedia.org/wiki/Spectrometer
		q("What device separates light into a spectrum for study?", ["barometer", "calorimeter", "interferometer", "spectrometer"], "spectrometer", 3),
		// https://en.wikipedia.org/wiki/Proton
		q("What subatomic particle has a positive charge?", ["neutrino", "electron", "neutron", "proton"], "proton", 1),
		// https://en.wikipedia.org/wiki/Chloroplast
		q("What organelle contains chlorophyll in plant cells?", ["mitochondrion", "vacuole", "chloroplast", "nucleus"], "chloroplast", 1),
		// https://en.wikipedia.org/wiki/Strong_interaction
		q("What force binds quarks inside protons and neutrons?", ["strong force", "gravity", "electromagnetism", "weak force"], "strong force", 3),
		// https://en.wikipedia.org/wiki/Venus
		q("Which planet has a day longer than its year?", ["Jupiter", "Venus", "Mars", "Mercury"], "Venus", 2),
		// https://en.wikipedia.org/wiki/Transpiration
		q("What is the process by which plants lose water vapor from leaves?", ["transpiration", "germination", "respiration", "photosynthesis"], "transpiration", 2),
		// https://en.wikipedia.org/wiki/Vitamin_D
		q("Which vitamin is produced in skin from sunlight?", ["vitamin A", "vitamin C", "vitamin K", "vitamin D"], "vitamin D", 1),
		// https://en.wikipedia.org/wiki/Ozone
		q("What is the chemical formula for ozone?", ["NO2", "O3", "CO2", "O2"], "O3", 2),
		// https://en.wikipedia.org/wiki/Radioactivity
		q("Which scientist is credited with discovering radioactivity with Becquerel?", ["James Chadwick", "Ernest Rutherford", "Marie Curie", "Niels Bohr"], "Marie Curie", 2),
		// https://en.wikipedia.org/wiki/Photon
		q("Which particle mediates the electromagnetic force?", ["photon", "W boson", "Z boson", "gluon"], "photon", 2),
	],
	history: [
		// https://en.wikipedia.org/wiki/George_VI
		q("Who was the British monarch during most of World War II after 1936?", ["Elizabeth II", "George VI", "Edward VIII", "Edward VII"], "George VI", 2),
		// https://en.wikipedia.org/wiki/Joseph_Stalin
		q("Who led the Soviet Union during most of World War II?", ["Leon Trotsky", "Nikita Khrushchev", "Vladimir Lenin", "Joseph Stalin"], "Joseph Stalin", 1),
		// https://en.wikipedia.org/wiki/Augustus
		q("Who was the first emperor of Rome?", ["Augustus", "Tiberius", "Nero", "Julius Caesar"], "Augustus", 2),
		// https://en.wikipedia.org/wiki/Hadrian%27s_Wall
		q("Which wall did Hadrian order built in Britain?", ["Hadrian's Wall", "Antonine Wall", "Offa's Dyke", "London Wall"], "Hadrian's Wall", 1),
		// https://en.wikipedia.org/wiki/Potsdam_Conference
		q("Which conference divided postwar Germany into occupation zones in 1945?", ["Yalta Conference", "Munich Conference", "Potsdam Conference", "Tehran Conference"], "Potsdam Conference", 2),
		// https://en.wikipedia.org/wiki/Ninety-five_Theses
		q("Who wrote the 'Ninety-five Theses'?", ["Martin Luther", "Huldrych Zwingli", "Erasmus", "John Calvin"], "Martin Luther", 2),
		// https://en.wikipedia.org/wiki/Marie_Curie
		q("Who was the first woman to win a Nobel Prize?", ["Jane Addams", "Selma Lagerlöf", "Bertha von Suttner", "Marie Curie"], "Marie Curie", 1),
		// https://en.wikipedia.org/wiki/Moctezuma_II
		q("Who was the Aztec emperor at the Spanish conquest of Tenochtitlan?", ["Ahuitzotl", "Itzcoatl", "Moctezuma II", "Cuauhtémoc"], "Moctezuma II", 2),
		// https://en.wikipedia.org/wiki/Black_Death
		q("Which plague devastated Europe in the mid-1300s?", ["Black Death", "Cholera pandemics", "Justinianic Plague", "Spanish flu"], "Black Death", 1),
		// https://en.wikipedia.org/wiki/Narmer
		q("Who united Upper and Lower Egypt in tradition as the first pharaoh?", ["Ramesses II", "Akhenaten", "Narmer", "Khufu"], "Narmer", 3),
		// https://en.wikipedia.org/wiki/Kwame_Nkrumah
		q("Who was the first president of independent Ghana?", ["Kwame Nkrumah", "Julius Nyerere", "Patrice Lumumba", "Jomo Kenyatta"], "Kwame Nkrumah", 2),
		// https://en.wikipedia.org/wiki/Treaty_of_Versailles
		q("Which treaty ended World War I for Germany in 1919?", ["Treaty of Lausanne", "Treaty of Sevres", "Treaty of Trianon", "Treaty of Versailles"], "Treaty of Versailles", 1),
		// https://en.wikipedia.org/wiki/Toussaint_Louverture
		q("Who led the Haitian Revolution to victory?", ["Henri Christophe", "Toussaint Louverture", "Boukman", "Jean-Jacques Dessalines"], "Toussaint Louverture", 2),
		// https://en.wikipedia.org/wiki/Zheng_He
		q("Which Chinese explorer led treasure voyages in the early 1400s?", ["Zheng He", "Marco Polo", "Zhang Qian", "Ibn Battuta"], "Zheng He", 2),
		// https://en.wikipedia.org/wiki/Nicholas_II_of_Russia
		q("Who was the last tsar of Russia?", ["Alexander II", "Nicholas II", "Peter the Great", "Alexander III"], "Nicholas II", 1),
		// https://en.wikipedia.org/wiki/Battle_of_Hastings
		q("Which battle in 1066 made William the Conqueror king of England?", ["Battle of Agincourt", "Battle of Hastings", "Battle of Stamford Bridge", "Battle of Bannockburn"], "Battle of Hastings", 1),
		// https://en.wikipedia.org/wiki/Louisiana_Purchase
		q("Which U.S. purchase doubled the nation's size in 1803?", ["Alaska Purchase", "Louisiana Purchase", "Florida Purchase", "Gadsden Purchase"], "Louisiana Purchase", 1),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Giant_panda
		q("Which bear is native only to China among living species?", ["sun bear", "sloth bear", "giant panda", "spectacled bear"], "giant panda", 1),
		// https://en.wikipedia.org/wiki/Bamboo
		q("What is the tallest grass on Earth often mistaken for a tree?", ["reed", "pampas grass", "bamboo", "sugarcane"], "bamboo", 2),
		// https://en.wikipedia.org/wiki/Dolphin
		q("Which ocean mammal uses echolocation and has a distinctive melon?", ["dugong", "dolphin", "sea otter", "manatee"], "dolphin", 1),
		// https://en.wikipedia.org/wiki/Butterfly
		q("Which insect undergoes complete metamorphosis from caterpillar?", ["butterfly", "dragonfly", "silverfish", "grasshopper"], "butterfly", 1),
		// https://en.wikipedia.org/wiki/Carbon_dioxide
		q("Which gas makes the bubbles in a typical soda?", ["helium", "nitrous oxide", "carbon dioxide", "carbon monoxide"], "carbon dioxide", 1),
		// https://en.wikipedia.org/wiki/Great_Barrier_Reef
		q("What is the world's largest coral reef system?", ["Great Barrier Reef", "Red Sea Reef", "Belize Barrier Reef", "Florida Reef"], "Great Barrier Reef", 1),
		// https://en.wikipedia.org/wiki/Lion
		q("Which big cat has a mane on males?", ["leopard", "lion", "tiger", "jaguar"], "lion", 1),
		// https://en.wikipedia.org/wiki/Emu
		q("Which flightless bird is native to Australia and known for kicking?", ["kiwi", "emu", "rhea", "cassowary"], "emu", 2),
		// https://en.wikipedia.org/wiki/Truffle
		q("Which fungus is prized and hunted with pigs or dogs in Europe?", ["porcini", "chanterelle", "truffle", "morel"], "truffle", 2),
		// https://en.wikipedia.org/wiki/Maple
		q("Which tree's leaves turn bright red in many North American autumns?", ["pine", "cedar", "spruce", "maple"], "maple", 1),
		// https://en.wikipedia.org/wiki/Mycology
		q("What is the study of fungi called?", ["botany", "ecology", "mycology", "zoology"], "mycology", 2),
		// https://en.wikipedia.org/wiki/Bowerbird
		q("Which bird is known for its elaborate courtship bowers?", ["bowerbird", "peacock", "lyrebird", "bird of paradise"], "bowerbird", 3),
		// https://en.wikipedia.org/wiki/Coffee
		q("Which tree produces coffee beans?", ["coffee plant", "cacao tree", "tea bush", "cola tree"], "coffee plant", 1),
		// https://en.wikipedia.org/wiki/Eastern_gorilla
		q("What is the largest living primate?", ["chimpanzee", "Bornean orangutan", "eastern gorilla", "bonobo"], "eastern gorilla", 2),
		// https://en.wikipedia.org/wiki/Crepuscular_animal
		q("What do you call animals active mainly at dawn and dusk?", ["diurnal", "nocturnal", "crepuscular", "cathemeral"], "crepuscular", 3),
		// https://en.wikipedia.org/wiki/Mangrove
		q("Which wetland tree grows on stilts in salt water?", ["birch", "cypress", "mangrove", "willow"], "mangrove", 2),
	],
	games: [
		// https://en.wikipedia.org/wiki/Chess
		q("In chess, which piece starts on a1 for white?", ["knight", "rook", "bishop", "queen"], "rook", 1),
		// https://en.wikipedia.org/wiki/Monopoly_(game)
		q("How many houses come in a standard Monopoly set?", ["28", "32", "36", "40"], "32", 3),
		// https://en.wikipedia.org/wiki/Nintendo_Entertainment_System
		q("Nintendo's Famicom was sold in North America under which name?", ["Nintendo 64", "GameCube", "NES", "Super NES"], "NES", 2),
		// https://en.wikipedia.org/wiki/Tetris
		q("Which puzzle game asks you to clear lines of blocks?", ["Dr. Mario", "Columns", "Tetris", "Puyo Puyo"], "Tetris", 1),
		// https://en.wikipedia.org/wiki/Dice
		q("In Dungeons & Dragons, what polyhedral die is abbreviated d20?", ["eight-sided die", "twelve-sided die", "ten-sided die", "twenty-sided die"], "twenty-sided die", 1),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("Which board game has territories like Irkutsk and Kamchatka?", ["Fort", "Axis & Allies", "Risk", "Diplomacy"], "Risk", 2),
		// https://en.wikipedia.org/wiki/Pac-Man
		q("Which classic arcade game has a pizza-shaped hero eating dots?", ["Pac-Man", "Ms. Pac-Man", "Q*bert", "Dig Dug"], "Pac-Man", 1),
		// https://en.wikipedia.org/wiki/Castling
		q("In chess, castling involves the king and a…", ["queen", "knight", "bishop", "rook"], "rook", 2),
		// https://en.wikipedia.org/wiki/PlayerUnknown%27s_Battlegrounds
		q("What Valve-published battle royale hit launched widely in 2017?", ["PUBG", "Fortnite", "H1Z1", "Minecraft"], "PUBG", 2),
		// https://en.wikipedia.org/wiki/Sudoku
		q("Which puzzle asks you to fill a 9×9 grid with digits 1–9?", ["Kakuro", "KenKen", "Sudoku", "Nurikabe"], "Sudoku", 1),
		// https://en.wikipedia.org/wiki/Go_(game)
		q("In Go, what are the playing pieces called?", ["tiles", "checkers", "stones", "pips"], "stones", 2),
		// https://en.wikipedia.org/wiki/Cloud_Strife
		q("Which role-playing series features Cloud Strife?", ["Kingdom Hearts", "Final Fantasy", "Dragon Quest", "Persona"], "Final Fantasy", 2),
		// https://en.wikipedia.org/wiki/Minecraft
		q("Which Mojang game lets players mine and craft in voxels?", ["Minecraft", "Minetest", "Roblox", "Terraria"], "Minecraft", 1),
		// https://en.wikipedia.org/wiki/Street_Fighter
		q("Which fighting game franchise features Ryu and Chun-Li?", ["Mortal Kombat", "Tekken", "Street Fighter", "Soulcalibur"], "Street Fighter", 1),
		// https://en.wikipedia.org/wiki/Monopoly_(game)
		q("In Monopoly, what color are Boardwalk and Park Place?", ["red", "green", "dark blue", "yellow"], "dark blue", 2),
		// https://en.wikipedia.org/wiki/Role-playing_video_game
		q("What does RPG stand for in gaming?", ["role-playing game", "real physics grid", "rapid pixel graphic", "random player gather"], "role-playing game", 1),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/The_Simpsons
		q("Who created the TV series 'The Simpsons'?", ["Seth MacFarlane", "Mike Judge", "Matt Groening", "Trey Parker"], "Matt Groening", 1),
		// https://en.wikipedia.org/wiki/Mission:_Impossible_(film_series)
		q("Who is the star of the 'Mission: Impossible' film series?", ["Tom Hanks", "Brad Pitt", "Matt Damon", "Tom Cruise"], "Tom Cruise", 1),
		// https://en.wikipedia.org/wiki/The_Tonight_Show_Starring_Jimmy_Fallon
		q("Who took over 'The Tonight Show' from Jay Leno in 2014?", ["Jimmy Kimmel", "Seth Meyers", "Stephen Colbert", "Jimmy Fallon"], "Jimmy Fallon", 2),
		// https://en.wikipedia.org/wiki/I_Love_Lucy
		q("Who created and starred in 'I Love Lucy'?", ["Mary Tyler Moore", "Lucille Ball", "Betty White", "Carol Burnett"], "Lucille Ball", 1),
		// https://en.wikipedia.org/wiki/Erin_Brockovich_(film)
		q("Who starred as the title character in 'Erin Brockovich'?", ["Sandra Bullock", "Nicole Kidman", "Meg Ryan", "Julia Roberts"], "Julia Roberts", 2),
		// https://en.wikipedia.org/wiki/The_Crown_(TV_series)
		q("Who is the British actress known for playing Queen Elizabeth II in 'The Crown' season one?", ["Imelda Staunton", "Helena Bonham Carter", "Olivia Colman", "Claire Foy"], "Claire Foy", 2),
		// https://en.wikipedia.org/wiki/La_La_Land
		q("Who starred as the title role in 'La La Land' opposite Stone?", ["Ryan Reynolds", "Jake Gyllenhaal", "Chris Evans", "Ryan Gosling"], "Ryan Gosling", 1),
		// https://en.wikipedia.org/wiki/Fleabag
		q("Who created the TV series 'Fleabag'?", ["Sharon Horgan", "Daisy May Cooper", "Phoebe Waller-Bridge", "Michaela Coel"], "Phoebe Waller-Bridge", 2),
		// https://en.wikipedia.org/wiki/Bridgerton
		q("Who starred as Queen Charlotte in 'Bridgerton' spinoff fame?", ["Nicola Coughlan", "Phoebe Dynevor", "Golda Rosheuvel", "Adjoa Andoh"], "Golda Rosheuvel", 3),
		// https://en.wikipedia.org/wiki/Tony_Soprano
		q("Who played Tony Soprano?", ["Al Pacino", "Joe Pesci", "Robert De Niro", "James Gandolfini"], "James Gandolfini", 1),
		// https://en.wikipedia.org/wiki/The_Mandalorian
		q("Who created and stars in 'The Mandalorian' as the title bounty hunter's armor wearer?", ["Pedro Pascal", "John Boyega", "Diego Luna", "Oscar Isaac"], "Pedro Pascal", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Abbey_Road
		q("Which band released 'Abbey Road'?", ["The Beatles", "The Kinks", "The Who", "The Rolling Stones"], "The Beatles", 1),
		// https://en.wikipedia.org/wiki/West_Side_Story
		q("Who wrote the musical 'West Side Story' with Bernstein?", ["Oscar Hammerstein II", "Cole Porter", "Alan Jay Lerner", "Stephen Sondheim"], "Stephen Sondheim", 2),
		// https://en.wikipedia.org/wiki/Stop!_In_the_Name_of_Love
		q("Which Motown group sang 'Stop! In the Name of Love'?", ["Martha and the Vandellas", "The Supremes", "The Temptations", "The Four Tops"], "The Supremes", 2),
		// https://en.wikipedia.org/wiki/Johann_Strauss_II
		q("Which composer is nicknamed the 'Waltz King'?", ["Johannes Brahms", "Franz Liszt", "Johann Strauss II", "Franz Schubert"], "Johann Strauss II", 2),
		// https://en.wikipedia.org/wiki/Blue_(Joni_Mitchell_album)
		q("Which singer's album 'Blue' (1971) is a folk landmark?", ["Judy Collins", "Carole King", "Joan Baez", "Joni Mitchell"], "Joni Mitchell", 2),
		// https://en.wikipedia.org/wiki/Symphonie_fantastique
		q("Which composer wrote 'Symphonie fantastique'?", ["Robert Schumann", "Hector Berlioz", "Franz Liszt", "Frédéric Chopin"], "Hector Berlioz", 3),
		// https://en.wikipedia.org/wiki/Jerry_Garcia
		q("Who was the lead guitarist of the Grateful Dead?", ["Bob Weir", "Jerry Garcia", "Mickey Hart", "Phil Lesh"], "Jerry Garcia", 2),
		// https://en.wikipedia.org/wiki/Nessun_dorma
		q("Which opera features the aria 'Nessun dorma'?", ["Aida", "Tosca", "Madama Butterfly", "Turandot"], "Turandot", 2),
		// https://en.wikipedia.org/wiki/Adagio_for_Strings
		q("Who composed 'Adagio for Strings'?", ["Leonard Bernstein", "Aaron Copland", "Charles Ives", "Samuel Barber"], "Samuel Barber", 2),
		// https://en.wikipedia.org/wiki/God_Bless_the_Child_(Billie_Holiday_song)
		q("Who sang 'God Bless the Child'?", ["Ella Fitzgerald", "Dinah Washington", "Sarah Vaughan", "Billie Holiday"], "Billie Holiday", 3),
		// https://en.wikipedia.org/wiki/At_Last
		q("Which singer recorded 'At Last'?", ["Diana Ross", "Aretha Franklin", "Gladys Knight", "Etta James"], "Etta James", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/Nineteen_Eighty-Four
		q("In '1984', what is the name of the all-seeing Party leader?", ["Big Brother", "Uncle Joe", "the Party Chief", "the Overseer"], "Big Brother", 1),
		// https://en.wikipedia.org/wiki/Hercule_Poirot
		q("Who created the detective Hercule Poirot?", ["Ngaio Marsh", "P. D. James", "Dorothy L. Sayers", "Agatha Christie"], "Agatha Christie", 1),
		// https://en.wikipedia.org/wiki/A_Gentleman_in_Moscow
		q("Who wrote 'A Gentleman in Moscow'?", ["Anthony Doerr", "Kristin Hannah", "Fredrik Backman", "Amor Towles"], "Amor Towles", 2),
		// https://en.wikipedia.org/wiki/Housekeeping_(novel)
		q("Who wrote 'Housekeeping'?", ["Alice Munro", "Anne Tyler", "Elizabeth Strout", "Marilynne Robinson"], "Marilynne Robinson", 3),
		// https://en.wikipedia.org/wiki/The_Known_World
		q("Who wrote 'The Known World'?", ["Percival Everett", "James McBride", "Colson Whitehead", "Edward P. Jones"], "Edward P. Jones", 3),
		// https://en.wikipedia.org/wiki/Pachinko_(novel)
		q("Who wrote 'Pachinko'?", ["Lisa See", "Amy Tan", "Celeste Ng", "Min Jin Lee"], "Min Jin Lee", 2),
		// https://en.wikipedia.org/wiki/Normal_People
		q("Who wrote 'Normal People'?", ["Zadie Smith", "Sally Gardner", "Sally Rooney", "Eleanor Catton"], "Sally Rooney", 2),
		// https://en.wikipedia.org/wiki/Circe_(novel)
		q("Who wrote 'Circe'?", ["Natalie Haynes", "Madeline Miller", "Mary Renault", "Pat Barker"], "Madeline Miller", 2),
		// https://en.wikipedia.org/wiki/The_Night_Circus
		q("Who wrote 'The Night Circus'?", ["Erin Morgenstern", "Leigh Bardugo", "V. E. Schwab", "Erin Entrada Kelly"], "Erin Morgenstern", 2),
		// https://en.wikipedia.org/wiki/An_American_Marriage
		q("Who wrote 'An American Marriage'?", ["Jesmyn Ward", "Brit Bennett", "Yaa Gyasi", "Tayari Jones"], "Tayari Jones", 2),
		// https://en.wikipedia.org/wiki/Homegoing_(Gyasi_novel)
		q("Who wrote 'Homegoing'?", ["Chimamanda Ngozi Adichie", "Ama Ata Aidoo", "Yaa Gyasi", "Taiye Selasi"], "Yaa Gyasi", 2),
		// https://en.wikipedia.org/wiki/The_Vanishing_Half
		q("Who wrote 'The Vanishing Half'?", ["Yaa Gyasi", "Tayari Jones", "Jesmyn Ward", "Brit Bennett"], "Brit Bennett", 2),
		// https://en.wikipedia.org/wiki/Hamnet_(novel)
		q("Who wrote 'Hamnet'?", ["Sarah Waters", "Hilary Mantel", "Maggie O'Farrell", "Tracy Chevalier"], "Maggie O'Farrell", 2),
		// https://en.wikipedia.org/wiki/Klara_and_the_Sun
		q("Who wrote 'Klara and the Sun'?", ["Graham Swift", "Ian McEwan", "Kazuo Ishiguro", "Julian Barnes"], "Kazuo Ishiguro", 2),
		// https://en.wikipedia.org/wiki/The_Netanyahus
		q("Who wrote 'The Netanyahus'?", ["Joshua Cohen", "Jonathan Safran Foer", "Michael Chabon", "Nathan Englander"], "Joshua Cohen", 3),
		// https://en.wikipedia.org/wiki/Shuggie_Bain
		q("Who wrote 'Shuggie Bain'?", ["Ali Smith", "James Kelman", "Douglas Stuart", "Irvine Welsh"], "Douglas Stuart", 2),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Sahara
		q("Which desert covers much of northern Africa?", ["Namib", "Kalahari", "Gobi", "Sahara"], "Sahara", 1),
		// https://en.wikipedia.org/wiki/Sicily
		q("What is the largest island in the Mediterranean?", ["Sardinia", "Cyprus", "Crete", "Sicily"], "Sicily", 2),
		// https://en.wikipedia.org/wiki/Netherlands
		q("Which European country is also called Holland informally?", ["Netherlands", "Denmark", "Belgium", "Luxembourg"], "Netherlands", 1),
		// https://en.wikipedia.org/wiki/Nepal
		q("Which landlocked country sits between China and India?", ["only Bangladesh", "only Myanmar", "Bhutan", "Nepal"], "Nepal", 2),
		// https://en.wikipedia.org/wiki/Persian_Gulf
		q("Which gulf lies north of Saudi Arabia and west of Iran?", ["Gulf of Aden", "Gulf of Oman", "Red Sea", "Persian Gulf"], "Persian Gulf", 2),
		// https://en.wikipedia.org/wiki/Ouagadougou
		q("What is the capital of Burkina Faso?", ["Niamey", "Ouagadougou", "Bamako", "N'Djamena"], "Ouagadougou", 3),
		// https://en.wikipedia.org/wiki/Aral_Sea
		q("Which Central Asian lake is also called the Aral…", ["Sea", "Sound", "Basin only", "Gulf"], "Sea", 2),
		// https://en.wikipedia.org/wiki/Aral_Sea
		q("Which sea is actually a lake on the Kazakhstan-Uzbekistan border region historically?", ["Dead Sea", "Caspian Sea", "Black Sea", "Aral Sea"], "Aral Sea", 2),
		// https://en.wikipedia.org/wiki/Kalahari_Desert
		q("Which desert covers much of Botswana?", ["Kalahari", "Namib", "Karoo", "Sahara"], "Kalahari", 2),
		// https://en.wikipedia.org/wiki/Port_Louis
		q("Which island nation has Port Louis as its capital?", ["Seychelles", "Mauritius", "Maldives", "Comoros"], "Mauritius", 3),
		// https://en.wikipedia.org/wiki/Gulf_of_Bothnia
		q("Which gulf separates Sweden from Finland?", ["Gulf of Bothnia", "Skagerrak", "Gulf of Finland", "Gulf of Riga"], "Gulf of Bothnia", 3),
		// https://en.wikipedia.org/wiki/Welland_Canal
		q("Which canal links Lake Ontario to Lake Erie?", ["Erie Canal", "Soo Locks", "Rideau Canal", "Welland Canal"], "Welland Canal", 3),
	],
};
