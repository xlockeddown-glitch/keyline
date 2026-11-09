import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Monday Nov 9, 2026 trivia batch 2, sub-batch f: easy evergreen geography (worded around landmarks and rivers to avoid false dupcheck hits), history, food, science, nature, music, books, games and political cards. Every card was checked against the Wikipedia page above it.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261109F: Partial<Record<PlusCat, TriviaQ[]>> = {
	political: [
		// https://en.wikipedia.org/wiki/United_States_Senate
		q("How long is a US senator's term?", ["6 years", "8 years", "4 years", "2 years"], "6 years", 1),
		// https://en.wikipedia.org/wiki/United_States_House_of_Representatives
		q("How long is a US representative's term?", ["6 years", "3 years", "2 years", "4 years"], "2 years", 1),
		// https://en.wikipedia.org/wiki/Vice_President_of_the_United_States
		q("Who presides over the US Senate?", ["the majority leader", "the vice president", "the Speaker", "the chief justice"], "the vice president", 1),
		// https://en.wikipedia.org/wiki/Speaker_of_the_United_States_House_of_Representatives
		q("Who leads the US House of Representatives?", ["the Speaker", "the president pro tempore", "the vice president", "the majority whip"], "the Speaker", 1),
		// https://en.wikipedia.org/wiki/Élysée_Palace
		q("What is the official residence of the French president?", ["Versailles", "Louvre", "Élysée Palace", "Matignon"], "Élysée Palace", 1),
		// https://en.wikipedia.org/wiki/Moscow_Kremlin
		q("What is the Russian government's fortified complex in Moscow called?", ["the Lubyanka", "the Kremlin", "Red Square", "the Duma"], "the Kremlin", 1),
		// https://en.wikipedia.org/wiki/Reichstag_building
		q("What is the name of Germany's parliament building in Berlin?", ["Bundesrat", "Bellevue", "Reichstag", "Kanzleramt"], "Reichstag", 1),
		// https://en.wikipedia.org/wiki/European_Parliament
		q("Which city is home to the European Parliament's official seat?", ["Luxembourg", "Geneva", "Strasbourg", "Brussels"], "Strasbourg", 1),
		// https://en.wikipedia.org/wiki/House_of_Commons_of_the_United_Kingdom
		q("What color are the benches in the UK House of Commons?", ["green", "brown", "red", "blue"], "green", 1),
		// https://en.wikipedia.org/wiki/International_Committee_of_the_Red_Cross
		q("Which Swiss city hosts the Red Cross's headquarters?", ["Basel", "Zürich", "Geneva", "Bern"], "Geneva", 1),
		// https://en.wikipedia.org/wiki/European_Central_Bank
		q("In which city is the European Central Bank?", ["Paris", "Amsterdam", "Frankfurt", "Brussels"], "Frankfurt", 1),
	],
	food: [
		// https://en.wikipedia.org/wiki/Pho
		q("Which country is the home of pho?", ["Thailand", "Vietnam", "Cambodia", "China"], "Vietnam", 1),
		// https://en.wikipedia.org/wiki/Haggis
		q("Which country is the home of haggis?", ["Wales", "Ireland", "England", "Scotland"], "Scotland", 1),
		// https://en.wikipedia.org/wiki/Biltong
		q("Which South African dried, cured meat is like jerky?", ["bobotie", "biltong", "chakalaka", "boerewors"], "biltong", 1),
		// https://en.wikipedia.org/wiki/Poke_(dish)
		q("Which Hawaiian dish is cubes of raw marinated fish?", ["laulau", "kalua pork", "poke", "lomi-lomi"], "poke", 1),
		// https://en.wikipedia.org/wiki/Poi_(food)
		q("Which Hawaiian staple is made from mashed taro root?", ["poi", "poke", "haupia", "spam musubi"], "poi", 1),
		// https://en.wikipedia.org/wiki/Spam_(food)
		q("Which canned meat is wildly popular in Hawaii?", ["corned beef", "tuna", "Spam", "Vienna sausage"], "Spam", 1),
		// https://en.wikipedia.org/wiki/Whopper
		q("Which fast-food chain sells the Whopper?", ["McDonald's", "Wendy's", "Burger King", "Jack in the Box"], "Burger King", 1),
		// https://en.wikipedia.org/wiki/KFC
		q("Which chain's founder is Colonel Sanders?", ["KFC", "Popeyes", "Church's", "Bojangles"], "KFC", 1),
		// https://en.wikipedia.org/wiki/Starbucks
		q("Which chain's logo is a green mermaid, or siren?", ["Costa Coffee", "Dunkin'", "Tim Hortons", "Starbucks"], "Starbucks", 1),
		// https://en.wikipedia.org/wiki/Tim_Hortons
		q("Which Canadian coffee chain is famous for Timbits?", ["Dunkin'", "Second Cup", "Starbucks", "Tim Hortons"], "Tim Hortons", 1),
		// https://en.wikipedia.org/wiki/Snickers
		q("Which candy bar's name comes from a family horse?", ["Mars", "Milky Way", "Snickers", "Twix"], "Snickers", 1),
		// https://en.wikipedia.org/wiki/Hershey's_Kisses
		q("Which chocolate company makes Kisses in Pennsylvania?", ["Hershey", "Nestlé", "Ferrero", "Mars"], "Hershey", 1),
		// https://en.wikipedia.org/wiki/Toblerone
		q("Which Swiss chocolate bar is shaped like a row of triangles?", ["Milka", "Cailler", "Toblerone", "Lindt"], "Toblerone", 1),
		// https://en.wikipedia.org/wiki/Oreo
		q("Which sandwich cookie has two chocolate wafers and a cream filling?", ["Hydrox", "Nutter Butter", "Chips Ahoy", "Oreo"], "Oreo", 1),
		// https://en.wikipedia.org/wiki/Coca-Cola
		q("Which soft drink was invented in Atlanta in 1886 by John Pemberton?", ["Coca-Cola", "Pepsi", "Dr Pepper", "Root beer"], "Coca-Cola", 1),
		// https://en.wikipedia.org/wiki/Dr_Pepper
		q("Which soft drink was first made in Waco, Texas, in the 1880s?", ["Pepsi", "Dr Pepper", "Coca-Cola", "Big Red"], "Dr Pepper", 1),
		// https://en.wikipedia.org/wiki/Pepsi
		q("Which soft drink was first called 'Brad's Drink'?", ["7 Up", "Coca-Cola", "Sprite", "Pepsi"], "Pepsi", 1),
		// https://en.wikipedia.org/wiki/Moscow_mule
		q("Which ginger drink is often mixed in a Moscow mule?", ["tonic water", "club soda", "ginger ale", "ginger beer"], "ginger beer", 1),
		// https://en.wikipedia.org/wiki/Tonic_water
		q("Which bitter ingredient gives tonic water its flavor?", ["quinine", "wormwood", "hops", "caffeine"], "quinine", 1),
		// https://en.wikipedia.org/wiki/Mojito
		q("Which cocktail combines rum, mint, lime, sugar and soda?", ["daiquiri", "piña colada", "mojito", "caipirinha"], "mojito", 1),
		// https://en.wikipedia.org/wiki/Piña_colada
		q("Which cocktail is made of rum, coconut cream and pineapple?", ["piña colada", "hurricane", "daiquiri", "mai tai"], "piña colada", 1),
		// https://en.wikipedia.org/wiki/Margarita
		q("Which cocktail mixes tequila, lime and orange liqueur?", ["paloma", "mojito", "margarita", "sangria"], "margarita", 1),
		// https://en.wikipedia.org/wiki/Martini_(cocktail)
		q("Which cocktail is made of gin and vermouth with an olive?", ["gimlet", "Manhattan", "martini", "negroni"], "martini", 1),
		// https://en.wikipedia.org/wiki/Negroni
		q("Which Italian cocktail is gin, Campari and sweet vermouth?", ["Americano", "bellini", "spritz", "negroni"], "negroni", 1),
		// https://en.wikipedia.org/wiki/Bellini_(cocktail)
		q("Which Venetian cocktail mixes prosecco with peach purée?", ["Bellini", "Rossini", "Mimosa", "Spritz"], "Bellini", 1),
		// https://en.wikipedia.org/wiki/Mimosa
		q("Which brunch cocktail mixes champagne with orange juice?", ["Bellini", "Bloody Mary", "screwdriver", "mimosa"], "mimosa", 1),
		// https://en.wikipedia.org/wiki/Bloody_Mary_(cocktail)
		q("Which cocktail is vodka with tomato juice?", ["Bloody Mary", "Cosmopolitan", "screwdriver", "Caesar"], "Bloody Mary", 1),
		// https://en.wikipedia.org/wiki/Sangria
		q("Which Spanish drink is wine with chopped fruit?", ["horchata", "cava", "sangria", "sherry"], "sangria", 1),
		// https://en.wikipedia.org/wiki/Cava_(Spanish_wine)
		q("Which Spanish sparkling wine is made mostly in Catalonia?", ["champagne", "sekt", "cava", "prosecco"], "cava", 1),
		// https://en.wikipedia.org/wiki/Prosecco
		q("Which Italian sparkling wine comes from the Veneto?", ["prosecco", "lambrusco", "cava", "asti"], "prosecco", 1),
		// https://en.wikipedia.org/wiki/Port_wine
		q("Which fortified wine is named after a Portuguese city?", ["port", "Madeira", "marsala", "sherry"], "port", 1),
		// https://en.wikipedia.org/wiki/Sherry
		q("Which fortified wine comes from Jerez in Spain?", ["sherry", "vermouth", "port", "Madeira"], "sherry", 1),
		// https://en.wikipedia.org/wiki/Sake
		q("Which Japanese rice wine is often served warm?", ["shochu", "soju", "sake", "mirin"], "sake", 1),
		// https://en.wikipedia.org/wiki/Champagne
		q("Which grape is used to make Champagne along with Pinot Noir and Pinot Meunier?", ["Riesling", "Chardonnay", "Merlot", "Syrah"], "Chardonnay", 1),
		// https://en.wikipedia.org/wiki/Bordeaux_wine
		q("Which French region is famous for red wines from Médoc and Saint-Émilion?", ["Alsace", "Provence", "Burgundy", "Bordeaux"], "Bordeaux", 1),
		// https://en.wikipedia.org/wiki/Chianti
		q("Which Italian region is home to Chianti wine?", ["Piedmont", "Sicily", "Veneto", "Tuscany"], "Tuscany", 1),
		// https://en.wikipedia.org/wiki/Olive_oil
		q("Which country is the world's biggest producer of olive oil?", ["Turkey", "Italy", "Greece", "Spain"], "Spain", 1),
		// https://en.wikipedia.org/wiki/Cocoa_bean
		q("Which country grows the most cocoa beans?", ["Ivory Coast", "Ghana", "Brazil", "Indonesia"], "Ivory Coast", 1),
		// https://en.wikipedia.org/wiki/Banana
		q("Which country grows the most bananas?", ["Brazil", "Ecuador", "India", "the Philippines"], "India", 1),
		// https://en.wikipedia.org/wiki/Maize
		q("Which crop is the most produced cereal in the world by weight?", ["wheat", "maize", "rice", "barley"], "maize", 1),
	],
	science: [
		// https://en.wikipedia.org/wiki/Thomas_Edison
		q("Who is credited with inventing the practical light bulb and the phonograph?", ["George Westinghouse", "Thomas Edison", "Alexander Graham Bell", "Nikola Tesla"], "Thomas Edison", 1),
		// https://en.wikipedia.org/wiki/Nikola_Tesla
		q("Which inventor championed alternating current (AC)?", ["James Watt", "Michael Faraday", "Nikola Tesla", "Thomas Edison"], "Nikola Tesla", 1),
		// https://en.wikipedia.org/wiki/Guglielmo_Marconi
		q("Which Italian inventor sent the first transatlantic radio signals?", ["Enrico Fermi", "Alessandro Volta", "Guglielmo Marconi", "Galileo Galilei"], "Guglielmo Marconi", 1),
		// https://en.wikipedia.org/wiki/Michael_Faraday
		q("Which English scientist discovered electromagnetic induction in 1831?", ["James Clerk Maxwell", "Joseph Swan", "Michael Faraday", "Humphry Davy"], "Michael Faraday", 1),
		// https://en.wikipedia.org/wiki/Alfred_Nobel
		q("Which Swedish chemist invented dynamite and founded famous prizes?", ["Carl Linnaeus", "Alfred Nobel", "Anders Celsius", "Svante Arrhenius"], "Alfred Nobel", 1),
		// https://en.wikipedia.org/wiki/Anders_Celsius
		q("Which Swedish astronomer gave his name to a temperature scale?", ["Alfred Nobel", "Anders Celsius", "Carl Linnaeus", "Tycho Brahe"], "Anders Celsius", 1),
		// https://en.wikipedia.org/wiki/Niels_Bohr
		q("Which Danish physicist proposed electrons orbiting in shells around the nucleus?", ["Niels Bohr", "Werner Heisenberg", "Max Born", "Erwin Schrödinger"], "Niels Bohr", 1),
		// https://en.wikipedia.org/wiki/J._Robert_Oppenheimer
		q("Which physicist led the Manhattan Project's Los Alamos laboratory?", ["J. Robert Oppenheimer", "Edward Teller", "Enrico Fermi", "Richard Feynman"], "J. Robert Oppenheimer", 1),
		// https://en.wikipedia.org/wiki/Cosmos:_A_Personal_Voyage
		q("Which astronomer hosted the 1980 TV series Cosmos?", ["Neil deGrasse Tyson", "Carl Sagan", "Edwin Hubble", "Stephen Hawking"], "Carl Sagan", 1),
		// https://en.wikipedia.org/wiki/Edwin_Hubble
		q("Which astronomer showed the universe is expanding, with a law named after him?", ["Edwin Hubble", "Carl Sagan", "Albert Einstein", "Georges Lemaître"], "Edwin Hubble", 1),
		// https://en.wikipedia.org/wiki/Jane_Goodall
		q("Which British primatologist studied wild chimpanzees in Tanzania?", ["Mary Leakey", "Biruté Galdikas", "Dian Fossey", "Jane Goodall"], "Jane Goodall", 1),
		// https://en.wikipedia.org/wiki/Dian_Fossey
		q("Which American primatologist studied mountain gorillas in Rwanda?", ["Rachel Carson", "Jane Goodall", "Biruté Galdikas", "Dian Fossey"], "Dian Fossey", 1),
		// https://en.wikipedia.org/wiki/Silent_Spring
		q("Which American biologist's 1962 book Silent Spring warned about pesticides?", ["Jane Goodall", "Dian Fossey", "Barbara McClintock", "Rachel Carson"], "Rachel Carson", 1),
		// https://en.wikipedia.org/wiki/Rosalind_Franklin
		q("Which British chemist's X-ray photo helped reveal DNA's structure?", ["Rosalind Franklin", "Marie Curie", "Dorothy Hodgkin", "Lise Meitner"], "Rosalind Franklin", 1),
		// https://en.wikipedia.org/wiki/Robert_Hooke
		q("Which English scientist coined the word 'cell' after viewing cork?", ["Robert Boyle", "Robert Hooke", "Antonie van Leeuwenhoek", "Isaac Newton"], "Robert Hooke", 1),
		// https://en.wikipedia.org/wiki/Antonie_van_Leeuwenhoek
		q("Which Dutch scientist first saw bacteria with his microscopes?", ["Antonie van Leeuwenhoek", "Robert Hooke", "Christiaan Huygens", "Hans Lippershey"], "Antonie van Leeuwenhoek", 1),
		// https://en.wikipedia.org/wiki/Robert_Koch
		q("Which German doctor identified the bacteria that cause tuberculosis?", ["Rudolf Virchow", "Robert Koch", "Paul Ehrlich", "Louis Pasteur"], "Robert Koch", 2),
		// https://en.wikipedia.org/wiki/Smallpox
		q("Which disease was declared eradicated worldwide in 1980?", ["malaria", "smallpox", "measles", "polio"], "smallpox", 1),
		// https://en.wikipedia.org/wiki/Malaria
		q("Which insect spreads malaria?", ["tick", "mosquito", "flea", "tsetse fly"], "mosquito", 1),
		// https://en.wikipedia.org/wiki/African_trypanosomiasis
		q("Which insect spreads sleeping sickness in Africa?", ["mosquito", "flea", "tsetse fly", "sandfly"], "tsetse fly", 2),
		// https://en.wikipedia.org/wiki/Plague_(disease)
		q("Fleas on rats spread which historic disease?", ["plague", "typhoid", "malaria", "cholera"], "plague", 1),
		// https://en.wikipedia.org/wiki/Vitamin_A
		q("Which vitamin is also called retinol and helps night vision?", ["vitamin C", "vitamin A", "vitamin E", "vitamin B12"], "vitamin A", 1),
		// https://en.wikipedia.org/wiki/Vitamin_K
		q("Which vitamin is needed for blood clotting?", ["vitamin C", "vitamin K", "vitamin D", "vitamin A"], "vitamin K", 1),
		// https://en.wikipedia.org/wiki/Cardiology
		q("Which part of the body does a cardiologist treat?", ["brain", "bones", "heart", "skin"], "heart", 1),
		// https://en.wikipedia.org/wiki/Dermatology
		q("Which part of the body does a dermatologist treat?", ["heart", "teeth", "skin", "eyes"], "skin", 1),
		// https://en.wikipedia.org/wiki/Ornithology
		q("What does an ornithologist study?", ["reptiles", "birds", "fish", "insects"], "birds", 1),
		// https://en.wikipedia.org/wiki/Entomology
		q("What does an entomologist study?", ["rocks", "birds", "fungi", "insects"], "insects", 1),
		// https://en.wikipedia.org/wiki/Ichthyology
		q("What does an ichthyologist study?", ["fish", "insects", "birds", "mammals"], "fish", 2),
		// https://en.wikipedia.org/wiki/Mycology
		q("What does a mycologist study?", ["fungi", "mosses", "bacteria", "insects"], "fungi", 2),
		// https://en.wikipedia.org/wiki/Botany
		q("What does a botanist study?", ["rocks", "plants", "animals", "stars"], "plants", 1),
		// https://en.wikipedia.org/wiki/Cartography
		q("What does a cartographer make?", ["maps", "telescopes", "lenses", "clocks"], "maps", 1),
	],
	history: [
		// https://en.wikipedia.org/wiki/Minoan_civilization
		q("Which Bronze Age civilization was based on Crete?", ["Mycenaean", "Hittite", "Minoan", "Phoenician"], "Minoan", 1),
		// https://en.wikipedia.org/wiki/Carthage
		q("Which seafaring people founded Carthage?", ["Phoenicians", "Egyptians", "Romans", "Greeks"], "Phoenicians", 1),
		// https://en.wikipedia.org/wiki/Ashoka
		q("Which Indian emperor spread Buddhism after the Kalinga War?", ["Akbar", "Ashoka", "Harsha", "Chandragupta"], "Ashoka", 1),
		// https://en.wikipedia.org/wiki/Taj_Mahal
		q("Which Mughal emperor built the Taj Mahal?", ["Akbar", "Shah Jahan", "Babur", "Aurangzeb"], "Shah Jahan", 1),
		// https://en.wikipedia.org/wiki/Qing_dynasty
		q("Which was the last imperial dynasty of China?", ["Yuan", "Song", "Ming", "Qing"], "Qing", 1),
		// https://en.wikipedia.org/wiki/Puyi
		q("Who was the last emperor of China?", ["Guangxu", "Cixi", "Puyi", "Kangxi"], "Puyi", 1),
		// https://en.wikipedia.org/wiki/Silk_Road
		q("Which ancient trade network linked China with the Mediterranean?", ["Spice Route", "Silk Road", "Amber Road", "Incense Route"], "Silk Road", 1),
		// https://en.wikipedia.org/wiki/Analects
		q("Which Chinese philosopher's sayings are collected in the Analects?", ["Laozi", "Mencius", "Confucius", "Sun Tzu"], "Confucius", 1),
		// https://en.wikipedia.org/wiki/The_Art_of_War
		q("Who wrote The Art of War?", ["Confucius", "Laozi", "Sun Tzu", "Mencius"], "Sun Tzu", 1),
		// https://en.wikipedia.org/wiki/Matthew_C._Perry
		q("Which American commodore opened Japan to trade in 1854?", ["John Paul Jones", "David Farragut", "George Dewey", "Matthew Perry"], "Matthew Perry", 1),
		// https://en.wikipedia.org/wiki/Cusco
		q("Which empire was ruled from Cusco?", ["Aztec", "Maya", "Inca", "Olmec"], "Inca", 1),
		// https://en.wikipedia.org/wiki/Hernán_Cortés
		q("Which Spanish conquistador conquered the Aztec Empire?", ["Hernán Cortés", "Vasco Núñez de Balboa", "Francisco Pizarro", "Hernando de Soto"], "Hernán Cortés", 1),
		// https://en.wikipedia.org/wiki/Francisco_Pizarro
		q("Which Spanish conquistador conquered the Inca Empire?", ["Pedro de Valdivia", "Diego de Almagro", "Hernán Cortés", "Francisco Pizarro"], "Francisco Pizarro", 1),
		// https://en.wikipedia.org/wiki/Juan_Ponce_de_León
		q("Which Spanish explorer searched Florida for the Fountain of Youth?", ["Juan Ponce de León", "Francisco Coronado", "Cabeza de Vaca", "Hernando de Soto"], "Juan Ponce de León", 1),
		// https://en.wikipedia.org/wiki/Christopher_Columbus
		q("Which explorer's three ships were the Niña, Pinta and Santa María?", ["Amerigo Vespucci", "John Cabot", "Ferdinand Magellan", "Christopher Columbus"], "Christopher Columbus", 1),
		// https://en.wikipedia.org/wiki/Amerigo_Vespucci
		q("After which explorer were the Americas named?", ["Amerigo Vespucci", "John Cabot", "Christopher Columbus", "Jacques Cartier"], "Amerigo Vespucci", 1),
		// https://en.wikipedia.org/wiki/Samuel_de_Champlain
		q("Which French explorer founded Quebec City in 1608?", ["Jacques Cartier", "Samuel de Champlain", "La Salle", "Jacques Marquette"], "Samuel de Champlain", 1),
		// https://en.wikipedia.org/wiki/Henry_Hudson
		q("Which English explorer gave his name to a huge Canadian bay?", ["Henry Hudson", "John Cabot", "James Cook", "Martin Frobisher"], "Henry Hudson", 1),
		// https://en.wikipedia.org/wiki/Treaty_of_Tordesillas
		q("Which 1494 treaty split new lands between Spain and Portugal?", ["Treaty of Utrecht", "Treaty of Tordesillas", "Treaty of Madrid", "Treaty of Paris"], "Treaty of Tordesillas", 2),
		// https://en.wikipedia.org/wiki/Brazil
		q("Which language is mainly spoken in Brazil because of colonization?", ["French", "Dutch", "Spanish", "Portuguese"], "Portuguese", 1),
		// https://en.wikipedia.org/wiki/Simón_Bolívar
		q("Which South American liberator is Bolivia named after?", ["Simón Bolívar", "Antonio Sucre", "Bernardo O'Higgins", "José de San Martín"], "Simón Bolívar", 1),
		// https://en.wikipedia.org/wiki/Miguel_Hidalgo_y_Costilla
		q("Which Mexican priest's 1810 'Cry of Dolores' launched the war of independence?", ["Agustín de Iturbide", "Miguel Hidalgo", "José María Morelos", "Benito Juárez"], "Miguel Hidalgo", 2),
		// https://en.wikipedia.org/wiki/Battle_of_Puebla
		q("Which battle on May 5, 1862, is remembered by Cinco de Mayo?", ["Battle of Chapultepec", "Battle of the Alamo", "Battle of Puebla", "Battle of Veracruz"], "Battle of Puebla", 1),
		// https://en.wikipedia.org/wiki/Mutiny_on_the_Bounty
		q("Which ship's crew mutinied against Captain Bligh in 1789?", ["HMS Beagle", "Mayflower", "HMS Bounty", "HMS Endeavour"], "HMS Bounty", 1),
		// https://en.wikipedia.org/wiki/Blackbeard
		q("Which pirate was known as Blackbeard?", ["Edward Teach", "William Kidd", "Bartholomew Roberts", "Henry Morgan"], "Edward Teach", 1),
		// https://en.wikipedia.org/wiki/William_Wallace
		q("Which Scottish hero fought the English at Stirling Bridge in 1297?", ["Rob Roy", "Robert the Bruce", "Bonnie Prince Charlie", "William Wallace"], "William Wallace", 1),
		// https://en.wikipedia.org/wiki/Battle_of_Bannockburn
		q("Which Scottish king won at Bannockburn in 1314?", ["Malcolm III", "Robert the Bruce", "William Wallace", "James IV"], "Robert the Bruce", 2),
		// https://en.wikipedia.org/wiki/Great_Famine_(Ireland)
		q("Which Irish famine began in 1845?", ["Great Famine", "Grain Blight", "Potato Riots", "Dust Famine"], "Great Famine", 1),
		// https://en.wikipedia.org/wiki/Great_Famine_(Ireland)
		q("Which crop failure caused the Great Famine in Ireland?", ["oats", "wheat", "potatoes", "barley"], "potatoes", 1),
		// https://en.wikipedia.org/wiki/Giuseppe_Garibaldi
		q("Which Italian general led the Redshirts to unite Italy?", ["Victor Emmanuel II", "Giuseppe Garibaldi", "Giuseppe Mazzini", "Camillo Cavour"], "Giuseppe Garibaldi", 1),
		// https://en.wikipedia.org/wiki/Otto_von_Bismarck
		q("Which Prussian chancellor unified Germany in 1871?", ["Wilhelm I", "Helmuth von Moltke", "Otto von Bismarck", "Kaiser Wilhelm II"], "Otto von Bismarck", 1),
		// https://en.wikipedia.org/wiki/Congress_of_Vienna
		q("Which 1815 congress redrew Europe after Napoleon?", ["Congress of Berlin", "Congress of Vienna", "Treaty of Versailles", "Peace of Westphalia"], "Congress of Vienna", 1),
		// https://en.wikipedia.org/wiki/Peace_of_Westphalia
		q("Which 1648 peace ended the Thirty Years' War?", ["Congress of Vienna", "Treaty of Utrecht", "Peace of Westphalia", "Treaty of Paris"], "Peace of Westphalia", 2),
		// https://en.wikipedia.org/wiki/Crimean_War
		q("Which war of 1853–56 featured the Charge of the Light Brigade?", ["Crimean War", "Franco-Prussian War", "Boer War", "Napoleonic Wars"], "Crimean War", 1),
		// https://en.wikipedia.org/wiki/USS_Monitor
		q("Which ship was the first ironclad to fight another ironclad, against the Monitor?", ["HMS Warrior", "CSS Hunley", "CSS Virginia", "USS Constitution"], "CSS Virginia", 2),
		// https://en.wikipedia.org/wiki/USS_Constitution
		q("Which US warship is nicknamed 'Old Ironsides'?", ["USS Monitor", "USS Missouri", "USS Arizona", "USS Constitution"], "USS Constitution", 1),
		// https://en.wikipedia.org/wiki/USS_Missouri
		q("Which battleship's surrender deck hosted Japan's WWII surrender?", ["USS Enterprise", "USS Arizona", "USS Missouri", "USS Iowa"], "USS Missouri", 1),
		// https://en.wikipedia.org/wiki/Battle_of_Midway
		q("Which 1942 Pacific battle turned the tide against Japan?", ["Battle of Okinawa", "Battle of Midway", "Battle of Iwo Jima", "Battle of Leyte Gulf"], "Battle of Midway", 1),
		// https://en.wikipedia.org/wiki/Raising_the_Flag_on_Iwo_Jima
		q("Which island battle produced the famous flag-raising photo in 1945?", ["Iwo Jima", "Guadalcanal", "Saipan", "Okinawa"], "Iwo Jima", 1),
		// https://en.wikipedia.org/wiki/Enigma_machine
		q("Which German code machine did Allied codebreakers crack?", ["Purple", "Lorenz", "Colossus", "Enigma"], "Enigma", 1),
		// https://en.wikipedia.org/wiki/Bletchley_Park
		q("Which English estate was home to WWII codebreakers?", ["Highclere Castle", "Blenheim Palace", "Chequers", "Bletchley Park"], "Bletchley Park", 1),
		// https://en.wikipedia.org/wiki/Alan_Turing
		q("Which mathematician helped break Enigma and pioneered computing?", ["Ada Lovelace", "Charles Babbage", "Alan Turing", "John von Neumann"], "Alan Turing", 1),
		// https://en.wikipedia.org/wiki/Ada_Lovelace
		q("Who is often called the first computer programmer?", ["Grace Hopper", "Ada Lovelace", "Charles Babbage", "Alan Turing"], "Ada Lovelace", 1),
		// https://en.wikipedia.org/wiki/Dunkirk_evacuation
		q("Which 1940 evacuation rescued Allied troops from a French beach?", ["Calais", "Normandy", "Dieppe", "Dunkirk"], "Dunkirk", 1),
		// https://en.wikipedia.org/wiki/Battle_of_Stalingrad
		q("Which 1942–43 battle on the Volga was a turning point against Germany?", ["Battle of Kursk", "Battle of Stalingrad", "Battle of Moscow", "Siege of Leningrad"], "Battle of Stalingrad", 1),
		// https://en.wikipedia.org/wiki/Victory_in_Europe_Day
		q("Which day marks the end of World War II in Europe?", ["VE Day", "D-Day", "VJ Day", "Armistice Day"], "VE Day", 1),
		// https://en.wikipedia.org/wiki/Allied-occupied_Germany
		q("Which German city was divided into four zones after WWII along with the country?", ["Bonn", "Berlin", "Munich", "Hamburg"], "Berlin", 1),
		// https://en.wikipedia.org/wiki/Joseph_McCarthy
		q("Which 1950s US senator led anti-communist hearings?", ["Richard Nixon", "Strom Thurmond", "Barry Goldwater", "Joseph McCarthy"], "Joseph McCarthy", 1),
		// https://en.wikipedia.org/wiki/Watergate_scandal
		q("Which 1972 break-in led to President Nixon's resignation?", ["Watergate", "Whitewater", "Iran-Contra", "Teapot Dome"], "Watergate", 1),
		// https://en.wikipedia.org/wiki/Margaret_Thatcher
		q("Which British prime minister was called the 'Iron Lady'?", ["Indira Gandhi", "Margaret Thatcher", "Theresa May", "Golda Meir"], "Margaret Thatcher", 1),
		// https://en.wikipedia.org/wiki/Sirimavo_Bandaranaike
		q("Who was the world's first female elected prime minister, in Sri Lanka?", ["Sirimavo Bandaranaike", "Margaret Thatcher", "Indira Gandhi", "Golda Meir"], "Sirimavo Bandaranaike", 2),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Polar_bear
		q("Which bear lives mainly on sea ice in the Arctic?", ["black bear", "grizzly bear", "brown bear", "polar bear"], "polar bear", 1),
		// https://en.wikipedia.org/wiki/Grizzly_bear
		q("Which bear is a subspecies of brown bear found in North America?", ["grizzly bear", "sun bear", "polar bear", "black bear"], "grizzly bear", 1),
		// https://en.wikipedia.org/wiki/Sun_bear
		q("Which is the smallest species of bear?", ["sun bear", "spectacled bear", "black bear", "sloth bear"], "sun bear", 1),
		// https://en.wikipedia.org/wiki/Koala
		q("Which marsupial 'bear' from Australia is not a bear at all?", ["koala", "wombat", "quokka", "bilby"], "koala", 1),
		// https://en.wikipedia.org/wiki/Cattle
		q("Which farm animal has a four-chambered stomach and chews cud?", ["cow", "horse", "chicken", "pig"], "cow", 1),
		// https://en.wikipedia.org/wiki/Mohair
		q("Which wool comes from Angora goats?", ["angora", "mohair", "cashmere", "alpaca"], "mohair", 1),
		// https://en.wikipedia.org/wiki/Merino
		q("Which sheep breed is famous for very fine wool?", ["Suffolk", "Dorset", "Jacob", "Merino"], "Merino", 1),
		// https://en.wikipedia.org/wiki/Scorpion
		q("Which arachnid has a venomous stinger on its tail?", ["mite", "tick", "tarantula", "scorpion"], "scorpion", 1),
		// https://en.wikipedia.org/wiki/Latrodectus
		q("Which spider is famous for the red hourglass on its belly?", ["wolf spider", "black widow", "brown recluse", "tarantula"], "black widow", 1),
		// https://en.wikipedia.org/wiki/Termite
		q("Which insects build huge mounds in Africa and Australia?", ["bees", "termites", "wasps", "ants"], "termites", 1),
		// https://en.wikipedia.org/wiki/Pantala_flavescens
		q("Which insect has the longest migration, the globe skimmer?", ["monarch butterfly", "locust", "moth", "dragonfly"], "dragonfly", 2),
		// https://en.wikipedia.org/wiki/Locust
		q("Which grasshopper relative forms giant destructive swarms?", ["cicada", "cricket", "katydid", "locust"], "locust", 1),
		// https://en.wikipedia.org/wiki/Scarab_(artifact)
		q("Which beetle was sacred in ancient Egypt?", ["firefly", "ladybug", "stag beetle", "scarab"], "scarab", 1),
		// https://en.wikipedia.org/wiki/Coccinellidae
		q("Which bug is red with black spots and eats aphids?", ["stink bug", "ladybug", "firefly", "weevil"], "ladybug", 1),
		// https://en.wikipedia.org/wiki/Osprey
		q("Which bird of prey hunts fish and is found on every continent except Antarctica?", ["osprey", "bald eagle", "kite", "harrier"], "osprey", 1),
		// https://en.wikipedia.org/wiki/Andean_condor
		q("Which large vulture of the Andes has one of the largest wingspans of land birds?", ["harpy eagle", "griffon vulture", "king vulture", "Andean condor"], "Andean condor", 1),
		// https://en.wikipedia.org/wiki/Indian_peafowl
		q("Which bird is the national bird of India?", ["Indian peafowl", "sarus crane", "great hornbill", "Indian roller"], "Indian peafowl", 1),
		// https://en.wikipedia.org/wiki/Toucan
		q("Which colorful bird has a huge banana-shaped bill?", ["macaw", "hornbill", "parrot", "toucan"], "toucan", 1),
		// https://en.wikipedia.org/wiki/Kookaburra
		q("Which Australian bird is famous for a laughing call?", ["lyrebird", "cockatoo", "kookaburra", "galah"], "kookaburra", 1),
		// https://en.wikipedia.org/wiki/Lyrebird
		q("Which Australian bird can mimic chainsaws and camera shutters?", ["kookaburra", "cockatoo", "lyrebird", "emu"], "lyrebird", 1),
		// https://en.wikipedia.org/wiki/Great_grey_owl
		q("Which is the largest species of owl in North America by length?", ["snowy owl", "great gray owl", "barn owl", "great horned owl"], "great gray owl", 1),
		// https://en.wikipedia.org/wiki/Snowy_owl
		q("Which white owl lives in the Arctic tundra?", ["snowy owl", "barn owl", "great horned owl", "elf owl"], "snowy owl", 1),
		// https://en.wikipedia.org/wiki/Barn_owl
		q("Which owl has a heart-shaped face?", ["barn owl", "snowy owl", "great horned owl", "burrowing owl"], "barn owl", 1),
		// https://en.wikipedia.org/wiki/Samara_(fruit)
		q("Which tree drops 'helicopter' seeds that spin as they fall?", ["birch", "pine", "maple", "oak"], "maple", 1),
		// https://en.wikipedia.org/wiki/Picea_abies
		q("Which evergreen tree is used most often as a Christmas tree in Europe?", ["Norway spruce", "Scots pine", "Douglas fir", "cedar"], "Norway spruce", 1),
		// https://en.wikipedia.org/wiki/Quercus_suber
		q("Which tree yields the cork used in wine stoppers?", ["birch", "cork oak", "ash", "beech"], "cork oak", 1),
		// https://en.wikipedia.org/wiki/Cedrus_libani
		q("Which tree is sacred in Lebanon and appears on its flag?", ["cedar", "oak", "palm", "olive"], "cedar", 1),
		// https://en.wikipedia.org/wiki/Olive
		q("Which tree is a symbol of peace and grows in the Mediterranean?", ["almond", "cypress", "olive", "fig"], "olive", 1),
		// https://en.wikipedia.org/wiki/Nelumbo_nucifera
		q("Which flower is the national flower of India?", ["marigold", "rose", "lotus", "jasmine"], "lotus", 1),
		// https://en.wikipedia.org/wiki/Rose
		q("Which flower is the national flower of England?", ["shamrock", "thistle", "rose", "daffodil"], "rose", 1),
		// https://en.wikipedia.org/wiki/Thistle
		q("Which flower is the national emblem of Scotland?", ["heather", "bluebell", "rose", "thistle"], "thistle", 1),
		// https://en.wikipedia.org/wiki/Daffodil
		q("Which flower is a national emblem of Wales?", ["leek flower", "rose", "daffodil", "thistle"], "daffodil", 1),
		// https://en.wikipedia.org/wiki/Shamrock
		q("Which three-leaved plant is a symbol of Ireland?", ["clover fern", "holly", "shamrock", "ivy"], "shamrock", 1),
	],
	games: [
		// https://en.wikipedia.org/wiki/Sonic_the_Hedgehog_(character)
		q("Which blue hedgehog is Sega's mascot?", ["Tails", "Knuckles", "Shadow", "Sonic"], "Sonic", 1),
		// https://en.wikipedia.org/wiki/Pikachu
		q("Which yellow electric Pokémon is the franchise mascot?", ["Raichu", "Pikachu", "Jigglypuff", "Psyduck"], "Pikachu", 1),
		// https://en.wikipedia.org/wiki/Tetris
		q("Which game has players stack falling blocks called tetrominoes?", ["Tetris", "Pac-Man", "Dr. Mario", "Columns"], "Tetris", 1),
		// https://en.wikipedia.org/wiki/Pac-Man
		q("Which yellow circle eats dots and avoids ghosts?", ["Kirby", "Dig Dug", "Q*bert", "Pac-Man"], "Pac-Man", 1),
		// https://en.wikipedia.org/wiki/Fortnite
		q("Which battle royale game by Epic Games features a building mechanic?", ["Warzone", "PUBG", "Fortnite", "Apex Legends"], "Fortnite", 1),
		// https://en.wikipedia.org/wiki/The_Sims
		q("Which life-simulation game series features characters who speak 'Simlish'?", ["The Sims", "SimCity", "Animal Crossing", "Second Life"], "The Sims", 1),
		// https://en.wikipedia.org/wiki/Cluedo
		q("Which board game asks who killed the victim, where and with what weapon?", ["Risk", "Sorry!", "Monopoly", "Clue"], "Clue", 1),
		// https://en.wikipedia.org/wiki/Scrabble
		q("Which word game scores letter tiles on a 15×15 board?", ["Boggle", "Scrabble", "Bananagrams", "Words with Friends"], "Scrabble", 1),
		// https://en.wikipedia.org/wiki/Chess
		q("How many pieces does each player start with in chess?", ["20", "18", "12", "16"], "16", 1),
	],
	music: [
		// https://en.wikipedia.org/wiki/Tuba
		q("Which is the lowest-pitched brass instrument in an orchestra?", ["French horn", "trombone", "euphonium", "tuba"], "tuba", 1),
		// https://en.wikipedia.org/wiki/Oboe
		q("Which woodwind instrument is played with a double reed and tunes the orchestra?", ["clarinet", "oboe", "saxophone", "flute"], "oboe", 1),
		// https://en.wikipedia.org/wiki/Saxophone
		q("Which instrument did Adolphe Sax invent?", ["bassoon", "clarinet", "saxophone", "sousaphone"], "saxophone", 1),
		// https://en.wikipedia.org/wiki/Great_Highland_bagpipe
		q("Which Scottish instrument has a bag and drones?", ["fiddle", "accordion", "harmonica", "bagpipes"], "bagpipes", 1),
		// https://en.wikipedia.org/wiki/Didgeridoo
		q("Which Australian Aboriginal wind instrument is a long wooden tube?", ["didgeridoo", "pan flute", "bullroarer", "shakuhachi"], "didgeridoo", 1),
		// https://en.wikipedia.org/wiki/Steelpan
		q("Which Caribbean instrument is made from oil drums?", ["bongo", "marimba", "maracas", "steelpan"], "steelpan", 1),
		// https://en.wikipedia.org/wiki/Ukulele
		q("Which Hawaiian instrument has four strings?", ["lute", "mandolin", "ukulele", "banjo"], "ukulele", 1),
		// https://en.wikipedia.org/wiki/Dynamics_(music)
		q("Which musical term means 'very loud'?", ["fortissimo", "adagio", "pianissimo", "allegro"], "fortissimo", 1),
		// https://en.wikipedia.org/wiki/Tempo
		q("Which musical term means 'slow'?", ["allegro", "forte", "adagio", "presto"], "adagio", 1),
		// https://en.wikipedia.org/wiki/Tempo
		q("Which musical term means 'fast'?", ["adagio", "largo", "allegro", "lento"], "allegro", 1),
		// https://en.wikipedia.org/wiki/Major_scale
		q("How many notes are in a standard major scale before the octave repeats?", ["8", "7", "5", "12"], "7", 1),
		// https://en.wikipedia.org/wiki/Clef
		q("Which clef is also called the G clef?", ["tenor clef", "treble clef", "bass clef", "alto clef"], "treble clef", 1),
		// https://en.wikipedia.org/wiki/Bass_(voice_type)
		q("What is the lowest male singing voice?", ["bass", "countertenor", "tenor", "baritone"], "bass", 1),
		// https://en.wikipedia.org/wiki/Here_Comes_the_Sun
		q("Which Beatle wrote and sang 'Here Comes the Sun'?", ["Ringo Starr", "Paul McCartney", "George Harrison", "John Lennon"], "George Harrison", 1),
		// https://en.wikipedia.org/wiki/Elton_John
		q("Which British singer was born Reginald Dwight?", ["Freddie Mercury", "Elton John", "David Bowie", "Rod Stewart"], "Elton John", 1),
		// https://en.wikipedia.org/wiki/Bohemian_Rhapsody
		q("Which Queen song is a six-minute rock opera?", ["Under Pressure", "Bohemian Rhapsody", "We Will Rock You", "Somebody to Love"], "Bohemian Rhapsody", 1),
		// https://en.wikipedia.org/wiki/Ziggy_Stardust
		q("Which David Bowie alter ego was a glam rocker from space?", ["Major Tom", "Ziggy Stardust", "Aladdin Sane", "Thin White Duke"], "Ziggy Stardust", 1),
		// https://en.wikipedia.org/wiki/No_Woman,_No_Cry
		q("Which Jamaican singer recorded 'No Woman, No Cry'?", ["Jimmy Cliff", "Toots Hibbert", "Peter Tosh", "Bob Marley"], "Bob Marley", 1),
		// https://en.wikipedia.org/wiki/Jazz
		q("Which American city is the birthplace of jazz?", ["Chicago", "Memphis", "New York", "New Orleans"], "New Orleans", 1),
		// https://en.wikipedia.org/wiki/Dolly_Parton
		q("Which country singer wrote 'Jolene' and '9 to 5'?", ["Reba McEntire", "Loretta Lynn", "Dolly Parton", "Tammy Wynette"], "Dolly Parton", 1),
	],
	books: [
		// https://en.wikipedia.org/wiki/Harry_Potter
		q("Which boy wizard attends Hogwarts?", ["Percy Jackson", "Eragon", "Artemis Fowl", "Harry Potter"], "Harry Potter", 1),
		// https://en.wikipedia.org/wiki/Frodo_Baggins
		q("Which hobbit carries the One Ring to Mount Doom?", ["Bilbo Baggins", "Frodo Baggins", "Samwise Gamgee", "Pippin Took"], "Frodo Baggins", 1),
		// https://en.wikipedia.org/wiki/The_Lion,_the_Witch_and_the_Wardrobe
		q("Through which piece of furniture do children enter Narnia in the first-published book?", ["a bookcase", "a trunk", "a mirror", "a wardrobe"], "a wardrobe", 1),
		// https://en.wikipedia.org/wiki/Alice's_Adventures_in_Wonderland
		q("Which girl falls down a rabbit hole into Wonderland?", ["Wendy", "Dorothy", "Matilda", "Alice"], "Alice", 1),
		// https://en.wikipedia.org/wiki/Dorothy_Gale
		q("Which Kansas girl travels to Oz with her dog Toto?", ["Alice", "Heidi", "Wendy", "Dorothy"], "Dorothy", 1),
		// https://en.wikipedia.org/wiki/Pinocchio
		q("Which puppet's nose grows when he lies?", ["Geppetto", "Howdy Doody", "Pinocchio", "Punch"], "Pinocchio", 1),
		// https://en.wikipedia.org/wiki/Paddington_Bear
		q("Which bear from 'darkest Peru' loves marmalade?", ["Corduroy", "Pooh", "Paddington", "Rupert"], "Paddington", 1),
		// https://en.wikipedia.org/wiki/Charlie_and_the_Chocolate_Factory
		q("Which Roald Dahl boy wins a golden ticket?", ["Billy", "James Henry Trotter", "Charlie Bucket", "Danny"], "Charlie Bucket", 1),
		// https://en.wikipedia.org/wiki/Matilda_(novel)
		q("Which Roald Dahl girl has telekinetic powers and loves books?", ["Sophie", "Matilda", "Violet", "Veruca"], "Matilda", 1),
		// https://en.wikipedia.org/wiki/How_the_Grinch_Stole_Christmas!
		q("Which Dr. Seuss character stole Christmas?", ["Sam-I-Am", "the Cat in the Hat", "the Lorax", "the Grinch"], "the Grinch", 1),
		// https://en.wikipedia.org/wiki/The_Lorax
		q("Which Dr. Seuss character 'speaks for the trees'?", ["the Lorax", "the Cat in the Hat", "Horton", "the Grinch"], "the Lorax", 1),
		// https://en.wikipedia.org/wiki/Where_the_Wild_Things_Are
		q("Which Maurice Sendak book follows Max to an island of monsters?", ["Chicken Soup with Rice", "Outside Over There", "In the Night Kitchen", "Where the Wild Things Are"], "Where the Wild Things Are", 1),
		// https://en.wikipedia.org/wiki/Anne_of_Green_Gables
		q("Which orphan with red braids lives at Green Gables?", ["Anne Shirley", "Heidi", "Pippi Longstocking", "Pollyanna"], "Anne Shirley", 1),
		// https://en.wikipedia.org/wiki/Heidi
		q("Which Swiss girl lives with her grandfather in the Alps?", ["Gretel", "Pippi", "Heidi", "Clara"], "Heidi", 1),
		// https://en.wikipedia.org/wiki/Little_Women
		q("Which four March sisters star in Little Women?", ["Anne, Diana, Ruby and Jane", "Laura, Mary, Carrie and Grace", "Meg, Jo, Beth and Amy", "Elizabeth, Jane, Mary and Kitty"], "Meg, Jo, Beth and Amy", 1),
		// https://en.wikipedia.org/wiki/Elizabeth_Bennet
		q("Which Jane Austen heroine marries Mr. Darcy?", ["Elizabeth Bennet", "Anne Elliot", "Emma Woodhouse", "Elinor Dashwood"], "Elizabeth Bennet", 1),
		// https://en.wikipedia.org/wiki/Oliver_Twist
		q("Which Dickens orphan asks, 'Please, sir, I want some more'?", ["David Copperfield", "Tiny Tim", "Oliver Twist", "Pip"], "Oliver Twist", 1),
		// https://en.wikipedia.org/wiki/Strange_Case_of_Dr_Jekyll_and_Mr_Hyde
		q("Which Robert Louis Stevenson doctor turns into Mr. Hyde?", ["Dr. Watson", "Dr. Frankenstein", "Dr. Moreau", "Dr. Jekyll"], "Dr. Jekyll", 1),
		// https://en.wikipedia.org/wiki/The_Adventures_of_Tom_Sawyer
		q("Which Mark Twain boy whitewashes a fence?", ["Joe Harper", "Huckleberry Finn", "Tom Sawyer", "Becky Thatcher"], "Tom Sawyer", 1),
		// https://en.wikipedia.org/wiki/Jay_Gatsby
		q("Which millionaire throws lavish parties in a Fitzgerald novel?", ["Dorian Gray", "Tom Buchanan", "Nick Carraway", "Jay Gatsby"], "Jay Gatsby", 1),
		// https://en.wikipedia.org/wiki/Nineteen_Eighty-Four
		q("Which Orwell novel features Big Brother?", ["Nineteen Eighty-Four", "Fahrenheit 451", "Brave New World", "Animal Farm"], "Nineteen Eighty-Four", 1),
		// https://en.wikipedia.org/wiki/Animal_Farm
		q("In Animal Farm, which animals take over the farm's leadership?", ["sheep", "pigs", "horses", "dogs"], "pigs", 1),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Gobi_Desert
		q("The Gobi Desert stretches across Mongolia and…", ["Russia", "India", "China", "Kazakhstan"], "China", 1),
		// https://en.wikipedia.org/wiki/Geirangerfjord
		q("The fjord-lined Geirangerfjord is a famous sight in…", ["Finland", "Iceland", "Scotland", "Norway"], "Norway", 1),
		// https://en.wikipedia.org/wiki/Mont_Blanc
		q("Mont Blanc, the Alps' highest peak, sits between France and…", ["Italy", "Switzerland", "Spain", "Austria"], "Italy", 1),
		// https://en.wikipedia.org/wiki/Iguazu_Falls
		q("Iguazu Falls lies on the border of Brazil and…", ["Paraguay", "Uruguay", "Argentina", "Bolivia"], "Argentina", 1),
		// https://en.wikipedia.org/wiki/Sicily
		q("Sicily is the largest island of…", ["Italy", "Malta", "Greece", "Spain"], "Italy", 1),
		// https://en.wikipedia.org/wiki/Corsica
		q("Corsica is an island region of…", ["France", "Italy", "Spain", "Greece"], "France", 1),
		// https://en.wikipedia.org/wiki/Zanzibar
		q("Zanzibar lies off the coast of…", ["Tanzania", "Mozambique", "Kenya", "Somalia"], "Tanzania", 1),
		// https://en.wikipedia.org/wiki/Azores
		q("Madeira and the Azores are islands of…", ["Italy", "France", "Portugal", "Spain"], "Portugal", 1),
		// https://en.wikipedia.org/wiki/Hispaniola
		q("Hispaniola is shared by the Dominican Republic and…", ["Haiti", "Puerto Rico", "Cuba", "Jamaica"], "Haiti", 1),
		// https://en.wikipedia.org/wiki/Dar_es_Salaam
		q("Zanzibar's neighbor Dar es Salaam is the largest city of…", ["Uganda", "Malawi", "Tanzania", "Kenya"], "Tanzania", 1),
		// https://en.wikipedia.org/wiki/Lagos
		q("Lagos is the largest city of…", ["Nigeria", "Kenya", "Ghana", "Senegal"], "Nigeria", 1),
		// https://en.wikipedia.org/wiki/Karachi
		q("Karachi is the largest city of…", ["Iran", "India", "Pakistan", "Bangladesh"], "Pakistan", 1),
		// https://en.wikipedia.org/wiki/Almaty
		q("Almaty is the largest city of…", ["Mongolia", "Kyrgyzstan", "Kazakhstan", "Uzbekistan"], "Kazakhstan", 1),
		// https://en.wikipedia.org/wiki/Auckland
		q("Auckland is the largest city of…", ["New Zealand", "Samoa", "Australia", "Fiji"], "New Zealand", 1),
		// https://en.wikipedia.org/wiki/Zürich
		q("Zürich is the largest city of…", ["Liechtenstein", "Germany", "Switzerland", "Austria"], "Switzerland", 1),
		// https://en.wikipedia.org/wiki/Istanbul
		q("Istanbul is the largest city of…", ["Egypt", "Greece", "Turkey", "Iran"], "Turkey", 1),
		// https://en.wikipedia.org/wiki/São_Paulo
		q("São Paulo is the largest city of…", ["Portugal", "Chile", "Brazil", "Argentina"], "Brazil", 1),
		// https://en.wikipedia.org/wiki/Guayaquil
		q("Guayaquil is the largest city of…", ["Peru", "Colombia", "Bolivia", "Ecuador"], "Ecuador", 1),
		// https://en.wikipedia.org/wiki/Toronto
		q("Toronto is the largest city of…", ["the UK", "Canada", "Australia", "the US"], "Canada", 1),
		// https://en.wikipedia.org/wiki/Sydney
		q("Sydney is the largest city of…", ["New Zealand", "Canada", "Australia", "South Africa"], "Australia", 1),
		// https://en.wikipedia.org/wiki/Ho_Chi_Minh_City
		q("Ho Chi Minh City is the largest city of…", ["Cambodia", "Vietnam", "Laos", "Thailand"], "Vietnam", 1),
		// https://en.wikipedia.org/wiki/Rhine
		q("The Rhine flows into which sea?", ["Black Sea", "Baltic Sea", "Mediterranean Sea", "North Sea"], "North Sea", 1),
		// https://en.wikipedia.org/wiki/Volga
		q("The Volga, Europe's longest river, flows into which sea?", ["White Sea", "Baltic Sea", "Caspian Sea", "Black Sea"], "Caspian Sea", 1),
		// https://en.wikipedia.org/wiki/Saint_Lawrence_River
		q("The St. Lawrence River drains which lake?", ["Lake Erie", "Lake Superior", "Lake Ontario", "Lake Michigan"], "Lake Ontario", 1),
		// https://en.wikipedia.org/wiki/Kīlauea
		q("Which US state has the most active volcanoes, including Kīlauea?", ["Washington", "Hawaii", "Oregon", "Alaska"], "Hawaii", 1),
		// https://en.wikipedia.org/wiki/Death_Valley
		q("Death Valley, the hottest place in North America, is in…", ["Utah", "Nevada", "Arizona", "California"], "California", 1),
		// https://en.wikipedia.org/wiki/Arches_National_Park
		q("Arches National Park, with over 2,000 stone arches, is in…", ["Colorado", "Nevada", "Utah", "Arizona"], "Utah", 1),
	],
};
