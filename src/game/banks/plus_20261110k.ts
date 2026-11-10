import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Trial run 1 batch (job trivia-trial-20261110-run1, Tue Nov 10 2026, America/Chicago):
 * free-model candidates from Switchboard (qwen3.8-27b and gpt-oss-120b on Groq; public Wikipedia only).
 * Trivia Master source-checked every flagged, disagreed, missing-verdict or missing-evidence card,
 * the seeded 50% sample of unanimously clean cards (seed 20261110), all 223 distractor-check-pending
 * cards, and all current-event cards, against freshly fetched Wikipedia extracts and wikitext.
 * Only white/green/blue cards. Current-event share is below the 40% trial target. No math.
 * Evidence: /workspace/kl-trivia-trial1-logs/ and /workspace/free-si/trivia-trial/run1/.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261110K: Partial<Record<PlusCat, TriviaQ[]>> = {
	sports: [
		// https://en.wikipedia.org/wiki/Basketball
		q("How many players from each team are on a basketball court at once?", ["Six", "Four", "Seven", "Five"], "Five", 1),
		// https://en.wikipedia.org/wiki/Super_Bowl
		q("In which year was the term \"Super Bowl\" adopted?", ["1969", "1966", "1970", "1972"], "1969", 1),
		// https://en.wikipedia.org/wiki/Olympic_Games
		q("Since which year have the Summer and Winter Games been held in different years?", ["1992", "1996", "1998", "1994"], "1994", 2),
		// https://en.wikipedia.org/wiki/Super_Bowl
		q("As of 2026, which two franchises are the only ones to be undefeated in multiple Super Bowls?", ["Steelers and Patriots", "Ravens and Buccaneers", "Cowboys and 49ers", "Dolphins and Raiders"], "Ravens and Buccaneers", 2),
		// https://en.wikipedia.org/wiki/Wimbledon_Championships
		q("What color must competitors wear at Wimbledon?", ["blue", "white", "black", "red"], "white", 1),
		// https://en.wikipedia.org/wiki/Tennis
		q("What type of sport is tennis?", ["team sport", "combat sport", "track sport", "racket sport"], "racket sport", 1),
		// https://en.wikipedia.org/wiki/Tennis
		q("In which English city did modern lawn tennis originate in the late 19th century?", ["Birmingham", "London", "Manchester", "Leeds"], "Birmingham", 2),
		// https://en.wikipedia.org/wiki/Tour_de_France
		q("In what year was the first Tour de France organized?", ["1895", "1903", "1910", "1920"], "1903", 1),
		// https://en.wikipedia.org/wiki/Super_Bowl
		q("What trophy is awarded to the Super Bowl winning team?", ["Heisman Trophy", "Stanley Cup", "Larry O'Brien Trophy", "Vince Lombardi Trophy"], "Vince Lombardi Trophy", 1),
		// https://en.wikipedia.org/wiki/2026_Breeders'_Cup
		q("Where was the 2026 Breeders' Cup held?", ["Churchill Downs", "Keeneland", "Santa Anita", "Del Mar"], "Keeneland", 1),
		// https://en.wikipedia.org/wiki/2026_Breeders'_Cup
		q("How many races were in the 2026 Breeders' Cup?", ["12", "14", "16", "10"], "14", 1),
		// https://en.wikipedia.org/wiki/2026_Breeders'_Cup
		q("Who won the 2026 Breeders' Cup Juvenile Fillies Turf?", ["Emphatic", "Sun Goddess", "Libertango", "Hughes"], "Sun Goddess", 1),
		// https://en.wikipedia.org/wiki/2026_Breeders'_Cup
		q("Who won the 2026 Breeders' Cup Juvenile Turf Sprint?", ["Libertango", "Haffner", "Bacio", "Ways and Means"], "Libertango", 1),
		// https://en.wikipedia.org/wiki/Daiki_Hashimoto
		q("In which city did Daiki Hashimoto win the World Championship all-around title in 2026?", ["Jakarta", "Rotterdam", "Liverpool", "Antwerp"], "Rotterdam", 1),
		// https://en.wikipedia.org/wiki/2026_Summer_Youth_Olympics
		q("In which city did the 2026 Summer Youth Olympics open on 31 October 2026?", ["Buenos Aires", "Gangwon", "Dakar", "Dolomiti"], "Dakar", 1),
		// https://en.wikipedia.org/wiki/2026_Summer_Youth_Olympics
		q("Which country hosted the 2026 Summer Youth Olympics?", ["France", "Senegal", "Brazil", "South Korea"], "Senegal", 1),
		// https://en.wikipedia.org/wiki/2026_Summer_Youth_Olympics
		q("Who opened the 2026 Summer Youth Olympics in Dakar?", ["Kirsty Coventry", "Abdourahmane Marième Sy", "Aïcha Diop", "Bassirou Diomaye Faye"], "Bassirou Diomaye Faye", 1),
		// https://en.wikipedia.org/wiki/Golden_State_Valkyries
		q("Who is the head coach of the Golden State Valkyries as of 2026?", ["Jess Smith", "Natalie Nakase", "Ohemaa Nyanin", "Kasib Powell"], "Natalie Nakase", 1),
		// https://en.wikipedia.org/wiki/2026_Skate_Canada_International
		q("Who won the men's singles at the 2026 Skate Canada International?", ["Shoma Uno", "Ilia Malinin", "Kévin Aymoz", "Adam Siao Him Fa"], "Kévin Aymoz", 1),
		// https://en.wikipedia.org/wiki/Alejandro_Davidovich_Fokina
		q("What was Davidovich Fokina's career-high ATP singles ranking as of October 2026?", ["No. 10", "No. 15", "No. 20", "No. 13"], "No. 13", 1),
		// https://en.wikipedia.org/wiki/Gabby_Williams
		q("Which country's team did Gabby Williams captain at the 2026 FIBA Women's World Cup?", ["United States", "France", "Spain", "Germany"], "France", 1),
		// https://en.wikipedia.org/wiki/Gabby_Williams
		q("How many WNBA championships did the Golden State Valkyries win in 2026?", ["One", "Two", "Three", "Four"], "One", 1),
		// https://en.wikipedia.org/wiki/Maja_Chwalińska
		q("Which WTA 1000 event did Maja Chwalińska win in 2026?", ["Madrid Open", "Rome Open", "Indian Wells", "Wuhan Open"], "Wuhan Open", 1),
		// https://en.wikipedia.org/wiki/Maja_Chwalińska
		q("What was Maja Chwalińska's career-high singles ranking in October 2026?", ["No. 5", "No. 15", "No. 20", "No. 11"], "No. 11", 1),
		// https://en.wikipedia.org/wiki/Per_Strand_Hagenes
		q("Which team did Per Strand Hagenes ride for in 2026?", ["Jumbo–Visma", "Ineos Grenadiers", "Visma–Lease a Bike", "Bora–Hansgrohe"], "Visma–Lease a Bike", 1),
		// https://en.wikipedia.org/wiki/2026_Wuhan_Open
		q("Who won the singles title at the 2026 Wuhan Open?", ["Sonay Kartal", "Gabriela Dabrowski", "Maja Chwalińska", "Luisa Stefani"], "Maja Chwalińska", 1),
		// https://en.wikipedia.org/wiki/2026_Il_Lombardia
		q("Which team did Paul Seixas ride for in the 2026 Il Lombardia?", ["Movistar Team", "Decathlon CMA CGM", "Lidl–Trek", "Red Bull–Bora–Hansgrohe"], "Decathlon CMA CGM", 1),
		// https://en.wikipedia.org/wiki/2026_Il_Lombardia
		q("What was the total distance of the 2026 Il Lombardia race?", ["219 km", "239 km", "259 km", "209 km"], "239 km", 1),
		// https://en.wikipedia.org/wiki/2026_Il_Lombardia
		q("Who finished second in the 2026 Il Lombardia?", ["Giulio Ciccone", "Brandon McNulty", "Enric Mas", "Thomas Pidcock"], "Enric Mas", 1),
		// https://en.wikipedia.org/wiki/Paul_Seixas
		q("In October 2026, which classic race did Paul Seixas win?", ["Paris–Roubaix", "Tour of Flanders", "Giro di Lombardia", "Milan–San Remo"], "Giro di Lombardia", 1),
		// https://en.wikipedia.org/wiki/Sovereignty_(horse)
		q("In October 2026, which major race did Sovereignty win?", ["Breeders' Cup Classic", "Dubai World Cup", "Santa Anita Derby", "Metropolitan Handicap"], "Breeders' Cup Classic", 1),
		// https://en.wikipedia.org/wiki/2026_World_Artistic_Gymnastics_Championships
		q("What role did the 2026 World Artistic Gymnastics Championships serve for the 2028 Los Angeles Olympics?", ["finals venue", "training camp", "qualification event", "sponsorship showcase"], "qualification event", 1),
		// https://en.wikipedia.org/wiki/2026_UCI_Track_Cycling_World_Championships
		q("In which city were the 2026 UCI Track Cycling World Championships held?", ["Beijing", "Guangzhou", "Shenzhen", "Shanghai"], "Shanghai", 1),
		// https://en.wikipedia.org/wiki/2026_UCI_Track_Cycling_World_Championships
		q("How many nations participated in the 2026 UCI Track Cycling World Championships?", ["45", "38", "52", "60"], "45", 1),
		// https://en.wikipedia.org/wiki/2026_UCI_Track_Cycling_World_Championships
		q("How many events were contested at the 2026 UCI Track Cycling World Championships?", ["22", "18", "24", "20"], "22", 1),
		// https://en.wikipedia.org/wiki/2026_Rolex_Shanghai_Masters
		q("As of October 2026, on what type of court was the Shanghai Masters played?", ["Clay", "Grass", "Carpet", "Hard"], "Hard", 1),
		// https://en.wikipedia.org/wiki/2026_Paris–Tours
		q("In October 2026, which rider won the Paris–Tours classic?", ["Per Strand Hagenes", "Jasper Stuyven", "Christophe Laporte", "Lewis Askey"], "Per Strand Hagenes", 1),
		// https://en.wikipedia.org/wiki/2026_Paris–Tours
		q("In October 2026, who finished second in the Paris–Tours race?", ["Per Strand Hagenes", "Christophe Laporte", "Jasper Stuyven", "Matys Grisel"], "Jasper Stuyven", 1),
		// https://en.wikipedia.org/wiki/2026_WNBA_Finals
		q("In the 2026 WNBA playoffs, which team did the Golden State Valkyries defeat in the semifinals?", ["Las Vegas Aces", "Atlanta Dream", "New York Liberty", "Washington Mystics"], "Las Vegas Aces", 1),
		// https://en.wikipedia.org/wiki/2026_Summer_Youth_Olympics
		q("How many sports were featured at the 2026 Summer Youth Olympics?", ["151", "25", "205", "14"], "25", 1),
		// https://en.wikipedia.org/wiki/2026_Skate_Canada_International
		q("Who won the women's singles at the 2026 Skate Canada International?", ["Kaori Sakamoto", "Mao Shimada", "Alexa Knierim", "Loena Hendrickx"], "Mao Shimada", 1),
		// https://en.wikipedia.org/wiki/2026_Skate_Canada_International
		q("Which venue hosted the 2026 Skate Canada International in Kelowna?", ["Rogers Arena", "Prospera Place", "Scotiabank Saddledome", "Bell Centre"], "Prospera Place", 1),
		// https://en.wikipedia.org/wiki/Alejandro_Davidovich_Fokina
		q("In October 2026, at which tournament did Davidovich Fokina win his first Masters 1000 title?", ["Paris Masters", "Madrid Open", "Shanghai Masters", "Rome Masters"], "Shanghai Masters", 1),
		// https://en.wikipedia.org/wiki/Gabby_Williams
		q("What honor was Gabby Williams named after Golden State won the 2026 championship?", ["WNBA Most Valuable Player", "WNBA Defensive Player of the Year", "WNBA All-Star Game MVP", "WNBA Finals MVP"], "WNBA Finals MVP", 1),
		// https://en.wikipedia.org/wiki/Maja_Chwalińska
		q("What was Maja Chwalińska's best Grand Slam result in 2026?", ["Wimbledon finalist", "US Open finalist", "French Open finalist", "Australian Open finalist"], "French Open finalist", 1),
		// https://en.wikipedia.org/wiki/2026_Wuhan_Open
		q("What was the surface of the 2026 Wuhan Open tennis tournament?", ["Clay", "Grass", "Carpet", "Hard"], "Hard", 1),
		// https://en.wikipedia.org/wiki/Paul_Seixas
		q("In 2026, Paul Seixas claimed victory in which stage race?", ["Tour de Suisse", "Critérium du Dauphiné", "Tour of the Basque Country", "Tour de Romandie"], "Tour of the Basque Country", 1),
		// https://en.wikipedia.org/wiki/Harrie_Lavreysen
		q("As of October 2026, how many World Championship gold medals has Lavreysen earned?", ["19", "21", "23", "25"], "23", 1),
		// https://en.wikipedia.org/wiki/2026_World_Artistic_Gymnastics_Championships
		q("In which venue were the 2026 World Artistic Gymnastics Championships held?", ["Amsterdam Arena", "Eindhoven Expo", "Rotterdam Ahoy", "The Hague Convention Center"], "Rotterdam Ahoy", 1),
		// https://en.wikipedia.org/wiki/Tour_de_France
		q("Which jersey is awarded to the leader of the mountains classification?", ["Green", "White", "Polka-dot", "Yellow"], "Polka-dot", 2),
		// https://en.wikipedia.org/wiki/Wimbledon_Championships
		q("In what year was the first Wimbledon Championships held?", ["1877", "1888", "1902", "1914"], "1877", 1),
		// https://en.wikipedia.org/wiki/FIFA_World_Cup
		q("How often is the FIFA World Cup held?", ["every two years", "every five years", "every six years", "every four years"], "every four years", 1),
		// https://en.wikipedia.org/wiki/FIFA_World_Cup
		q("Which country has appeared in every World Cup tournament?", ["Germany", "Italy", "Argentina", "Brazil"], "Brazil", 2),
	],
	political: [
		// https://en.wikipedia.org/wiki/United_Nations
		q("Which two entities are observer states of the United Nations?", ["Vatican City and Israel", "Switzerland and Liechtenstein", "Andorra and Monaco", "Holy See and State of Palestine"], "Holy See and State of Palestine", 2),
		// https://en.wikipedia.org/wiki/European_Union
		q("What prize did the European Union receive in 2012?", ["Nobel Literature Prize", "Nobel Economic Sciences Prize", "Nobel Chemistry Prize", "Nobel Peace Prize"], "Nobel Peace Prize", 1),
		// https://en.wikipedia.org/wiki/Prime_Minister_of_the_United_Kingdom
		q("Who was the first prime minister of the United Kingdom?", ["William Pitt", "Robert Walpole", "Lord Liverpool", "Benjamin Disraeli"], "Robert Walpole", 1),
		// https://en.wikipedia.org/wiki/United_States_Electoral_College
		q("Which amendment granted D.C. three electors?", ["Twenty-second Amendment", "Twenty-third Amendment", "Twenty-fourth Amendment", "Twenty-fifth Amendment"], "Twenty-third Amendment", 2),
		// https://en.wikipedia.org/wiki/United_States_Electoral_College
		q("Which states allocate electors by congressional district?", ["Maine and Nebraska", "Texas and Florida", "New York and California", "Ohio and Pennsylvania"], "Maine and Nebraska", 2),
		// https://en.wikipedia.org/wiki/NATO
		q("When was Article 5 first invoked by the United States?", ["after the September 11 attacks", "during the Kosovo War", "in the Bosnian War", "after the 2003 Iraq invasion"], "after the September 11 attacks", 2),
		// https://en.wikipedia.org/wiki/Sakharov_Prize
		q("Who received the Sakharov Prize in October 2026?", ["European Parliament", "International Criminal Court", "Amnesty International", "Human Rights Watch"], "International Criminal Court", 1),
		// https://en.wikipedia.org/wiki/2026_Czech_Senate_election
		q("Which party won the most contested seats in the October 2026 Czech Senate election?", ["Civic Democratic Party", "ANO 2011", "TOP 09", "Mayors and Independents"], "Mayors and Independents", 1),
		// https://en.wikipedia.org/wiki/2026_Czech_Senate_election
		q("What was the voter turnout in the first round of the October 2026 Czech Senate election?", ["43.31%", "21.12%", "50.00%", "35.50%"], "43.31%", 1),
		// https://en.wikipedia.org/wiki/2026_British_Columbia_general_election
		q("Who became premier-designate after the 2026 British Columbia election?", ["David Eby", "John Rustad", "Lorne Doerkson", "Emily Lowan"], "Lorne Doerkson", 1),
		// https://en.wikipedia.org/wiki/2026_British_Columbia_general_election
		q("What was the voter turnout percentage in the 2026 British Columbia election?", ["52.0%", "48.5%", "55.2%", "60.1%"], "52.0%", 1),
		// https://en.wikipedia.org/wiki/2026_Serbian_parliamentary_election
		q("Which electoral list won an absolute majority in the 2026 Serbian election?", ["Serbian Progressive Party", "Student List", "Socialist Party of Serbia", "Democratic Party"], "Student List", 1),
		// https://en.wikipedia.org/wiki/2026_Serbian_parliamentary_election
		q("What percentage of the vote did the Student List receive in the 2026 Serbian parliamentary election?", ["48.12%", "39.48%", "61.05%", "53.69%"], "53.69%", 1),
		// https://en.wikipedia.org/wiki/Ülle_Madise
		q("On what date did Ülle Madise assume office as President of Estonia in 2026?", ["2 September 2026", "11 December 2026", "12 October 2026", "31 March 2026"], "12 October 2026", 1),
		// https://en.wikipedia.org/wiki/Ülle_Madise
		q("Who was the Prime Minister of Estonia when Ülle Madise became President in 2026?", ["Kristen Michal", "Kaja Kallas", "Jüri Ratas", "Taavi Rõivas"], "Kristen Michal", 1),
		// https://en.wikipedia.org/wiki/2026_Czech_Senate_election
		q("Which party expanded its total Senate seats to 20 after the October 2026 election?", ["Civic Democratic Party", "Mayors and Independents", "TOP 09", "KDU-ČSL"], "Civic Democratic Party", 1),
		// https://en.wikipedia.org/wiki/2026_Serbian_parliamentary_election
		q("On what date were Serbia's 2026 parliamentary elections held?", ["23 October 2026", "25 October 2026", "1 November 2026", "9 September 2026"], "25 October 2026", 1),
		// https://en.wikipedia.org/wiki/2026_Serbian_parliamentary_election
		q("What was the voter turnout in Serbia's 2026 parliamentary election?", ["68.89%", "55.23%", "72.10%", "61.45%"], "68.89%", 1),
		// https://en.wikipedia.org/wiki/European_Union
		q("As of 2026, how many member states are in the European Union?", ["28", "27", "26", "30"], "27", 1),
		// https://en.wikipedia.org/wiki/United_States_Electoral_College
		q("How many total electors are in the Electoral College?", ["538", "535", "540", "550"], "538", 1),
		// https://en.wikipedia.org/wiki/NATO
		q("As of 2026, how many member states does NATO have?", ["28", "30", "32", "34"], "32", 1),
		// https://en.wikipedia.org/wiki/Magna_Carta
		q("Which monarch reissued the Magna Carta in 1225 for new taxes?", ["Henry III", "Edward I", "John", "Richard I"], "Henry III", 2),
	],
	food: [
		// https://en.wikipedia.org/wiki/Cheese
		q("Which hard cheese is mentioned as lasting longer than soft varieties?", ["Brie", "Mozzarella", "Cheddar", "Ricotta"], "Cheddar", 1),
		// https://en.wikipedia.org/wiki/Tea
		q("In which region did tea originate?", ["South America", "West Africa", "East Asia", "Northern Europe"], "East Asia", 1),
		// https://en.wikipedia.org/wiki/Pasta
		q("What type of flour is traditionally used to make pasta?", ["Corn flour", "Rice flour", "Wheat flour", "Oat flour"], "Wheat flour", 1),
		// https://en.wikipedia.org/wiki/Pasta
		q("In which country's cuisine is pasta a staple food?", ["France", "Spain", "Italy", "Greece"], "Italy", 1),
		// https://en.wikipedia.org/wiki/Coffee
		q("What plant part is used to make coffee beans?", ["Coffee leaves", "Coffee roots", "Coffee stems", "Coffee cherries"], "Coffee cherries", 1),
		// https://en.wikipedia.org/wiki/Sushi
		q("What is the defining component of modern sushi?", ["Vinegared rice", "Raw fish", "Soy sauce", "Wasabi paste"], "Vinegared rice", 1),
		// https://en.wikipedia.org/wiki/Cheese
		q("Which fungus is used to produce vegetarian rennet?", ["Penicillium roqueforti", "Mucor miehei", "Saccharomyces cerevisiae", "Aspergillus niger"], "Mucor miehei", 2),
		// https://en.wikipedia.org/wiki/Cheese
		q("What plant source is mentioned for extracting vegetarian rennet?", ["Soybeans", "Nopales", "Cynara thistles", "Cactus pads"], "Cynara thistles", 2),
		// https://en.wikipedia.org/wiki/Chocolate
		q("In which country was the cacao tree first used as a food source?", ["Mexico", "Ecuador", "Brazil", "Peru"], "Ecuador", 2),
		// https://en.wikipedia.org/wiki/Pasta
		q("Through which Italian region was pasta introduced to Italy?", ["Tuscany", "Veneto", "Lombardy", "Sicily"], "Sicily", 2),
		// https://en.wikipedia.org/wiki/Sushi
		q("Who is credited with inventing nigiri-zushi?", ["Katsuya Ichizo", "Yoshinobu Nakamura", "Hanaya Yohei", "Tetsuya Wakuda"], "Hanaya Yohei", 2),
		// https://en.wikipedia.org/wiki/Pizza
		q("In which Italian town was the term pizza first recorded?", ["Gaeta", "Naples", "Rome", "Milan"], "Gaeta", 1),
		// https://en.wikipedia.org/wiki/Cheese
		q("What protein coagulates when rennet is added to milk?", ["Whey", "Lactose", "Collagen", "Casein"], "Casein", 1),
		// https://en.wikipedia.org/wiki/Tea
		q("What plant species is used to make tea?", ["Coffea arabica", "Camellia sinensis", "Mentha spicata", "Rosmarinus officinalis"], "Camellia sinensis", 1),
		// https://en.wikipedia.org/wiki/Chocolate
		q("Which two West African countries contribute about 60% of the world's cocoa supply?", ["Nigeria and Kenya", "Ivory Coast and Ghana", "Cameroon and Nigeria", "Ghana and Senegal"], "Ivory Coast and Ghana", 2),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Impressionism
		q("What is the title of the Claude Monet work that inspired the name Impressionism?", ["Water Lilies", "Impression, Sunrise", "The Starry Night", "Sunset at Sea"], "Impression, Sunrise", 1),
		// https://en.wikipedia.org/wiki/Impressionism
		q("In which Parisian newspaper was the first Impressionist Exhibition reviewed?", ["Le Charivari", "Le Figaro", "La Marseillaise", "Le Monde"], "Le Charivari", 2),
		// https://en.wikipedia.org/wiki/Michelangelo
		q("Who succeeded Antonio da Sangallo as architect of St. Peter's Basilica?", ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"], "Michelangelo", 2),
		// https://en.wikipedia.org/wiki/William_Shakespeare
		q("How many sonnets are attributed to William Shakespeare?", ["151", "157", "154", "160"], "154", 1),
		// https://en.wikipedia.org/wiki/Pablo_Picasso
		q("What artistic movement did Picasso co-found?", ["Futurist movement", "Impressionist movement", "Surrealist movement", "Cubist movement"], "Cubist movement", 1),
		// https://en.wikipedia.org/wiki/William_Shakespeare
		q("In which year did William Shakespeare die?", ["1616", "1614", "1620", "1605"], "1616", 2),
		// https://en.wikipedia.org/wiki/Pablo_Picasso
		q("Which artistic period did Picasso enter after his Blue Period?", ["African-influenced Period", "Analytic Cubism", "Rose Period", "Synthetic Cubism"], "Rose Period", 2),
		// https://en.wikipedia.org/wiki/Louvre
		q("Which famous painting is housed in the Louvre?", ["Starry Night", "Guernica", "Mona Lisa", "The Scream"], "Mona Lisa", 1),
		// https://en.wikipedia.org/wiki/Luis_Antonio_Tagle
		q("On what date in 2026 was Luis Antonio Tagle appointed Dean of the College of Cardinals?", ["October 1, 2026", "September 15, 2026", "November 1, 2026", "October 9, 2026"], "October 9, 2026", 1),
		// https://en.wikipedia.org/wiki/Luis_Antonio_Tagle
		q("Who was the predecessor of Luis Antonio Tagle as Dean of the College of Cardinals in 2026?", ["Pope Francis", "Giovanni Battista Re", "Pope Benedict XVI", "Cardinal Angelo Sodano"], "Giovanni Battista Re", 1),
		// https://en.wikipedia.org/wiki/Pablo_Picasso
		q("What nationality was Pablo Picasso?", ["French", "Spanish", "Italian", "German"], "Spanish", 1),
	],
	science: [
		// https://en.wikipedia.org/wiki/Albert_Einstein
		q("Which theory is Albert Einstein best known for developing?", ["Quantum mechanics", "General evolution", "Theory of relativity", "String theory"], "Theory of relativity", 1),
		// https://en.wikipedia.org/wiki/Periodic_table
		q("What property determines the order of elements in the periodic table?", ["Atomic masses", "Atomic numbers", "Chemical reactivity", "Molecular weight"], "Atomic numbers", 1),
		// https://en.wikipedia.org/wiki/Photosynthesis
		q("In which cellular organelle are chlorophylls held in plants?", ["Chloroplasts", "Mitochondria", "Nucleus", "Ribosomes"], "Chloroplasts", 1),
		// https://en.wikipedia.org/wiki/Hubble_Space_Telescope
		q("What optical defect compromised Hubble's capabilities after launch?", ["Chromatic aberration", "Spherical aberration", "Diffraction spikes", "Mirror coating failure"], "Spherical aberration", 2),
		// https://en.wikipedia.org/wiki/Vaccine
		q("Who proposed extending the terms vaccine and vaccination in 1881?", ["Louis Pasteur", "Edward Jenner", "Lady Mary Wortley Montagu", "Joseph Lister"], "Louis Pasteur", 2),
		// https://en.wikipedia.org/wiki/Isaac_Newton
		q("What position did Newton hold at the Royal Mint from 1699 to 1727?", ["Warden", "Master", "Director", "Secretary"], "Master", 2),
		// https://en.wikipedia.org/wiki/Albert_Einstein
		q("In which year did Einstein receive the Nobel Prize in Physics?", ["1905", "1921", "1915", "1933"], "1921", 1),
		// https://en.wikipedia.org/wiki/Hubble_Space_Telescope
		q("Which astronomer is the Hubble Space Telescope named after?", ["Galileo Galilei", "Edwin Hubble", "Isaac Newton", "Carl Sagan"], "Edwin Hubble", 1),
		// https://en.wikipedia.org/wiki/Isaac_Newton
		q("In which year was Newton's Principia first published?", ["1704", "1687", "1643", "1727"], "1687", 1),
		// https://en.wikipedia.org/wiki/Marie_Curie
		q("What term did Marie Curie coin for the study of radioactive phenomena?", ["Radioactivity", "Nuclear fission", "Ionization", "Transmutation"], "Radioactivity", 2),
		// https://en.wikipedia.org/wiki/Photosynthesis
		q("What is the name of the light-independent reaction cycle in plants?", ["Krebs cycle", "Embden-Meyerhof pathway", "Calvin cycle", "Urea cycle"], "Calvin cycle", 2),
		// https://en.wikipedia.org/wiki/DNA
		q("What sugar is found in DNA nucleotides?", ["Deoxyribose", "Ribose", "Glucose", "Fructose"], "Deoxyribose", 2),
		// https://en.wikipedia.org/wiki/Coordinated_Universal_Time
		q("The October 2026 CGPM vote to abolish future leap seconds takes effect on which date?", ["January 1, 2027", "December 31, 2026", "May 20, 2027", "July 4, 2027"], "May 20, 2027", 1),
	],
	history: [
		// https://en.wikipedia.org/wiki/Apollo_11
		q("What was the name of the Lunar Module that landed on the Moon?", ["Eagle", "Columbia", "Saturn", "Tranquility"], "Eagle", 1),
		// https://en.wikipedia.org/wiki/World_War_II
		q("Which two countries declared war on Germany after the invasion of Poland?", ["United States and Canada", "United Kingdom and France", "Soviet Union and China", "Italy and Spain"], "United Kingdom and France", 1),
		// https://en.wikipedia.org/wiki/Apollo_11
		q("Which rocket launched the Apollo 11 spacecraft?", ["Titan II", "Delta IV", "Atlas V", "Saturn V"], "Saturn V", 2),
		// https://en.wikipedia.org/wiki/Abraham_Lincoln
		q("Who shot Abraham Lincoln at Ford's Theatre?", ["John Wilkes Booth", "Lewis Powell", "George Atzerodt", "David Herold"], "John Wilkes Booth", 2),
		// https://en.wikipedia.org/wiki/Abraham_Lincoln
		q("Which act angered Lincoln and led him to lead the Republican Party?", ["Missouri Compromise", "Compromise of 1850", "Fugitive Slave Act", "Kansas–Nebraska Act"], "Kansas–Nebraska Act", 2),
		// https://en.wikipedia.org/wiki/Cleopatra
		q("Which battle did Octavian win against Antony and Cleopatra in 31 BC?", ["Battle of Pharsalus", "Battle of Zama", "Battle of Gaugamela", "Battle of Actium"], "Battle of Actium", 2),
		// https://en.wikipedia.org/wiki/Ancient_Egypt
		q("Which empire did Egypt sign the earliest known peace treaty with?", ["Assyrian Empire", "Persian Empire", "Hittite Empire", "Roman Empire"], "Hittite Empire", 2),
		// https://en.wikipedia.org/wiki/Ancient_Egypt
		q("When did the Roman conquest end the Ptolemaic Kingdom?", ["30 BC", "332 BC", "642 AD", "3150 BC"], "30 BC", 2),
		// https://en.wikipedia.org/wiki/Titanic
		q("Which company operated the RMS Titanic?", ["White Star Line", "Cunard Line", "Royal Mail Line", "P&O Line"], "White Star Line", 1),
		// https://en.wikipedia.org/wiki/French_Revolution
		q("In what year did the coup of 18 Brumaire occur?", ["1795", "1799", "1797", "1801"], "1799", 1),
		// https://en.wikipedia.org/wiki/Titanic
		q("How many lifeboats were equipped on the Titanic?", ["Eighteen", "Twenty‑two", "Sixteen", "Twenty"], "Twenty", 2),
		// https://en.wikipedia.org/wiki/Titanic
		q("Which shipbuilding company constructed the Titanic in Belfast?", ["Harland and Wolff", "Cammell Laird", "John Brown & Company", "Vickers Shipbuilding"], "Harland and Wolff", 2),
		// https://en.wikipedia.org/wiki/Cleopatra
		q("In which city was Cleopatra born?", ["Rome", "Athens", "Memphis", "Alexandria"], "Alexandria", 1),
		// https://en.wikipedia.org/wiki/Roman_Empire
		q("What year did the Western Roman Empire collapse?", ["1453 AD", "476 AD", "27 BC", "31 BC"], "476 AD", 1),
		// https://en.wikipedia.org/wiki/World_War_II
		q("Which country did Nazi Germany invade on 1 September 1939 to start World War II?", ["France", "Belgium", "Norway", "Poland"], "Poland", 1),
		// https://en.wikipedia.org/wiki/Ancient_Egypt
		q("Which river was central to the location of Ancient Egypt?", ["Tigris River", "Euphrates River", "Jordan River", "Nile River"], "Nile River", 1),
		// https://en.wikipedia.org/wiki/Ancient_Egypt
		q("Who is credited with uniting Upper and Lower Egypt?", ["Ramesses II", "Tutankhamun", "Cleopatra", "Menes"], "Menes", 1),
		// https://en.wikipedia.org/wiki/Apollo_11
		q("Where did the Apollo 11 crew splash down after returning to Earth?", ["Atlantic Ocean", "Indian Ocean", "Mediterranean Sea", "Pacific Ocean"], "Pacific Ocean", 2),
		// https://en.wikipedia.org/wiki/World_War_II
		q("What pact led to the partition of Poland between Germany and the Soviet Union?", ["Treaty of Versailles", "Atlantic Charter", "Yalta Agreement", "Molotov–Ribbentrop Pact"], "Molotov–Ribbentrop Pact", 2),
		// https://en.wikipedia.org/wiki/French_Revolution
		q("Which king attempted to flee to Varennes in June 1791?", ["Louis XV", "Charles X", "Napoleon Bonaparte", "Louis XVI"], "Louis XVI", 2),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Penguin
		q("In which hemisphere do penguins live almost exclusively?", ["Northern Hemisphere", "Southern Hemisphere", "Western Hemisphere", "Eastern Hemisphere"], "Southern Hemisphere", 1),
		// https://en.wikipedia.org/wiki/Blue_whale
		q("In which year did the International Whaling Commission ban all blue whale hunting?", ["1950", "1966", "1975", "1982"], "1966", 1),
		// https://en.wikipedia.org/wiki/Cheetah
		q("What is the scientific genus of the cheetah?", ["Panthera", "Felis", "Acinonyx", "Lynx"], "Acinonyx", 1),
		// https://en.wikipedia.org/wiki/Polar_bear
		q("What is the scientific name of the polar bear?", ["Ursus arctos", "Ursus americanus", "Ursus thibetanus", "Ursus maritimus"], "Ursus maritimus", 1),
		// https://en.wikipedia.org/wiki/Polar_bear
		q("Which seal species is the primary prey of the polar bear?", ["Harbor seals", "Gray seals", "Ringed seals", "Bearded seals"], "Ringed seals", 1),
		// https://en.wikipedia.org/wiki/Penguin
		q("What is the scientific name of the little blue penguin?", ["Aptenodytes forsteri", "Pygoscelis adeliae", "Eudyptula minor", "Spheniscus demersus"], "Eudyptula minor", 2),
		// https://en.wikipedia.org/wiki/Penguin
		q("Which penguin species lives at and slightly north of the equator?", ["Magellanic penguin", "Humboldt penguin", "African penguin", "Galapagos penguin"], "Galapagos penguin", 2),
		// https://en.wikipedia.org/wiki/Komodo_dragon
		q("What is the maximum weight of a male Komodo dragon?", ["150 kg", "100 kg", "200 kg", "120 kg"], "150 kg", 2),
		// https://en.wikipedia.org/wiki/Komodo_dragon
		q("When did Western scientists first record Komodo dragons?", ["1900", "1920", "1950", "1910"], "1910", 2),
		// https://en.wikipedia.org/wiki/Blue_whale
		q("What is the scientific name of the pygmy blue whale subspecies?", ["B. m. intermedia", "B. m. brevicauda", "B. m. indica", "B. m. musculus"], "B. m. brevicauda", 2),
		// https://en.wikipedia.org/wiki/Blue_whale
		q("What is the maximum confirmed length range of a blue whale in meters?", ["25.0–26.0 m", "31.0–32.0 m", "20.0–21.0 m", "29.9–30.5 m"], "29.9–30.5 m", 2),
		// https://en.wikipedia.org/wiki/Cheetah
		q("In which century was the cheetah first scientifically described?", ["17th century", "18th century", "19th century", "20th century"], "18th century", 2),
		// https://en.wikipedia.org/wiki/Cheetah
		q("Which specific body part does a cheetah use to strike prey during a chase?", ["Tail", "Elbow", "Dewclaw", "Forehead"], "Dewclaw", 2),
		// https://en.wikipedia.org/wiki/Honey_bee
		q("What is the genus of the western honey bee?", ["Melipona", "Tetragonula", "Bombus", "Apis"], "Apis", 1),
		// https://en.wikipedia.org/wiki/Bald_eagle
		q("At what age does a bald eagle reach sexual maturity?", ["one to two years", "two to three years", "four to five years", "six to seven years"], "four to five years", 1),
		// https://en.wikipedia.org/wiki/Giant_panda
		q("In which country is the giant panda endemic?", ["Japan", "China", "India", "Thailand"], "China", 1),
		// https://en.wikipedia.org/wiki/Komodo_dragon
		q("What is the scientific name of the Komodo dragon?", ["Varanus giganteus", "Varanus salvator", "Varanus komodoensis", "Varanus albigularis"], "Varanus komodoensis", 1),
		// https://en.wikipedia.org/wiki/Blue_whale
		q("What is the primary food source of the blue whale?", ["Krill", "Small fish", "Squid", "Seaweed"], "Krill", 1),
		// https://en.wikipedia.org/wiki/Honey_bee
		q("Which animal is known to target honey bee hives for honey?", ["eagles", "foxes", "deer", "bears"], "bears", 1),
		// https://en.wikipedia.org/wiki/Bald_eagle
		q("Which pesticide's ban helped the bald eagle population recover?", ["PCBs", "Chlorpyrifos", "DDT", "Atrazine"], "DDT", 2),
	],
	games: [
		// https://en.wikipedia.org/wiki/The_Game_of_Life
		q("In what year was the modern version of The Game of Life published?", ["1860", "1960", "1950", "1970"], "1960", 1),
		// https://en.wikipedia.org/wiki/Contract_bridge
		q("How many players are in a standard game of contract bridge?", ["Two", "Four", "Six", "Eight"], "Four", 1),
		// https://en.wikipedia.org/wiki/The_Game_of_Life
		q("Which public figure heartily endorsed the modern version of The Game of Life?", ["Walt Disney", "Ed Sullivan", "Art Linkletter", "Jack Benny"], "Art Linkletter", 2),
		// https://en.wikipedia.org/wiki/Contract_bridge
		q("What is the most popular variation of bridge for casual play?", ["Duplicate bridge", "Tournament bridge", "Club bridge", "Rubber bridge"], "Rubber bridge", 2),
		// https://en.wikipedia.org/wiki/The_Legend_of_Zelda
		q("What is the name of the sacred relic that can grant any wish in The Legend of Zelda?", ["Master Sword", "Ocarina", "Triforce", "Heart Container"], "Triforce", 2),
		// https://en.wikipedia.org/wiki/Mario_Kart
		q("In what year was the Mario Kart series launched?", ["1990", "1992", "1994", "1996"], "1992", 1),
		// https://en.wikipedia.org/wiki/Mario_Kart
		q("How many games are in the Mario Kart series?", ["seventeen", "fifteen", "eighteen", "twenty"], "seventeen", 1),
		// https://en.wikipedia.org/wiki/Pok%C3%A9mon
		q("What is the primary target age range for the Pokémon franchise?", ["5 to 12", "3 to 8", "13 to 18", "all ages"], "5 to 12", 1),
		// https://en.wikipedia.org/wiki/Go_(game)
		q("In which country was the board game Go invented?", ["Japan", "China", "Korea", "India"], "China", 1),
		// https://en.wikipedia.org/wiki/The_Game_of_Life
		q("Who originally created The Checkered Game of Life in 1860?", ["Charles Doud", "Art Linkletter", "Milton Bradley", "Reuben Klamer"], "Milton Bradley", 1),
		// https://en.wikipedia.org/wiki/Contract_bridge
		q("What type of card game is contract bridge?", ["Matching", "Building", "Discarding", "Trick-taking"], "Trick-taking", 1),
		// https://en.wikipedia.org/wiki/The_Legend_of_Zelda
		q("Which company primarily develops and publishes The Legend of Zelda?", ["Sony", "Sega", "Nintendo", "Microsoft"], "Nintendo", 1),
		// https://en.wikipedia.org/wiki/Go_(game)
		q("How many points are on a standard 19x19 Go board?", ["324", "380", "361", "400"], "361", 2),
		// https://en.wikipedia.org/wiki/Go_(game)
		q("Which historical annal contains the earliest written reference to Go?", ["Zuo Zhuan", "I Ching", "Book of Songs", "Records of the Grand Historian"], "Zuo Zhuan", 2),
		// https://en.wikipedia.org/wiki/Contract_bridge
		q("In duplicate bridge, what is played by multiple sets of players?", ["Different decks", "New cards", "Random hands", "The same deal"], "The same deal", 2),
		// https://en.wikipedia.org/wiki/Candy_Crush_Saga
		q("In what year was Candy Crush Saga released?", ["2012", "2010", "2014", "2016"], "2012", 1),
		// https://en.wikipedia.org/wiki/Candy_Crush_Saga
		q("On which platform did Candy Crush Saga first launch?", ["iOS", "Android", "Facebook", "Windows Phone"], "Facebook", 1),
		// https://en.wikipedia.org/wiki/Poker
		q("What is the term for the final reveal of hands in poker?", ["draw", "showdown", "reveal", "finale"], "showdown", 2),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Sandra_Bullock
		q("In which 1994 action thriller did Sandra Bullock make her breakthrough?", ["Die Hard", "Speed", "Lethal Weapon", "The Fugitive"], "Speed", 1),
		// https://en.wikipedia.org/wiki/Idris_Elba
		q("In which Marvel Cinematic Universe film did Idris Elba first portray Heimdall?", ["Thor", "Iron Man", "Captain America", "Black Panther"], "Thor", 1),
		// https://en.wikipedia.org/wiki/Cher
		q("Which duo did Cher rise to fame with in 1965?", ["The Mamas & the Papas", "Sonny & Cher", "Simon & Garfunkel", "The Everly Brothers"], "Sonny & Cher", 1),
		// https://en.wikipedia.org/wiki/Morgan_Freeman
		q("In which city was Morgan Freeman born?", ["Memphis", "Atlanta", "Chicago", "New Orleans"], "Memphis", 1),
		// https://en.wikipedia.org/wiki/Denzel_Washington
		q("In which 1989 war drama did Denzel Washington win his first Academy Award?", ["Glory", "Schindler's List", "Platoon", "The Deer Hunter"], "Glory", 1),
		// https://en.wikipedia.org/wiki/Denzel_Washington
		q("Which NBC medical drama series first brought Denzel Washington to prominence?", ["ER", "Grey's Anatomy", "St. Elsewhere", "House"], "St. Elsewhere", 1),
		// https://en.wikipedia.org/wiki/Whitney_Houston
		q("What nickname was Whitney Houston commonly referred to as?", ["the Voice", "the Queen", "the Diva", "the Star"], "the Voice", 1),
		// https://en.wikipedia.org/wiki/Whitney_Houston
		q("Which record label did Whitney Houston sign with at age 19?", ["Sony Music", "Warner Bros", "Arista Records", "Universal Music"], "Arista Records", 1),
		// https://en.wikipedia.org/wiki/Sandra_Bullock
		q("What is the name of the production company founded by Sandra Bullock?", ["Fortis Films", "DreamWorks", "Paramount Pictures", "Sony Pictures"], "Fortis Films", 2),
		// https://en.wikipedia.org/wiki/Robin_Williams
		q("For which 1997 film did Robin Williams win the Academy Award for Best Supporting Actor?", ["Good Will Hunting", "The Fisher King", "Dead Poets Society", "Mrs. Doubtfire"], "Good Will Hunting", 2),
		// https://en.wikipedia.org/wiki/Cher
		q("For which film did Cher win the Best Actress Academy Award?", ["Silkwood", "Mask", "Burlesque", "Moonstruck"], "Moonstruck", 2),
		// https://en.wikipedia.org/wiki/Whitney_Houston
		q("Whitney Houston was the first black artist to score how many RIAA diamond-certified albums?", ["two", "four", "five", "three"], "three", 2),
		// https://en.wikipedia.org/wiki/Julie_Andrews
		q("Which character did Julie Andrews play in her film debut?", ["Cinderella", "Mary Poppins", "Eliza Doolittle", "Maria von Trapp"], "Mary Poppins", 1),
		// https://en.wikipedia.org/wiki/Julie_Andrews
		q("In what year did Julie Andrews receive the Kennedy Center Honors?", ["2001", "1999", "2005", "2010"], "2001", 1),
		// https://en.wikipedia.org/wiki/Aretha_Franklin
		q("How many Grammy Awards did Aretha Franklin win during her career?", ["12", "18", "22", "15"], "18", 1),
		// https://en.wikipedia.org/wiki/Nicole_Kidman
		q("For which film did Nicole Kidman win the Academy Award for Best Actress?", ["Moulin Rouge!", "Rabbit Hole", "Lion", "The Hours"], "The Hours", 1),
		// https://en.wikipedia.org/wiki/Whoopi_Goldberg
		q("Which hyena character did Whoopi Goldberg voice in The Lion King?", ["Banzai", "Shenzi", "Ed", "Kamari"], "Shenzi", 1),
		// https://en.wikipedia.org/wiki/Prince_(musician)
		q("What name did fans use for the unpronounceable symbol Prince adopted in 1993?", ["Love Symbol", "Star Symbol", "Peace Symbol", "Infinity Symbol"], "Love Symbol", 2),
		// https://en.wikipedia.org/wiki/Aretha_Franklin
		q("Which artist performed the duet with Aretha Franklin on \"I Knew You Were Waiting (For Me)\"?", ["Elton John", "Stevie Wonder", "George Michael", "Lionel Richie"], "George Michael", 2),
		// https://en.wikipedia.org/wiki/Nicole_Kidman
		q("Since what year has Nicole Kidman been a UNICEF goodwill ambassador?", ["1992", "1996", "1994", "1998"], "1994", 2),
		// https://en.wikipedia.org/wiki/Sandra_Bullock
		q("For which biographical drama did Sandra Bullock win the Academy Award for Best Actress?", ["Gravity", "Crash", "The Blind Side", "Hope Floats"], "The Blind Side", 1),
		// https://en.wikipedia.org/wiki/Robin_Williams
		q("Which ABC sitcom featured Robin Williams as the alien Mork?", ["Happy Days", "Laverne & Shirley", "The Wonder Years", "Mork & Mindy"], "Mork & Mindy", 1),
		// https://en.wikipedia.org/wiki/Idris_Elba
		q("Which character did Idris Elba play in the HBO series The Wire?", ["Omar Little", "Bunk Moreland", "Stringer Bell", "McNulty"], "Stringer Bell", 1),
		// https://en.wikipedia.org/wiki/Morgan_Freeman
		q("Which children's TV series helped Morgan Freeman rise to fame in the 1970s?", ["Sesame Street", "The Electric Company", "Mister Rogers' Neighborhood", "The Muppet Show"], "The Electric Company", 1),
		// https://en.wikipedia.org/wiki/Sandra_Bullock
		q("Which magazine named Sandra Bullock the Most Beautiful Woman in 2015?", ["Time", "Vogue", "Glamour", "People"], "People", 2),
		// https://en.wikipedia.org/wiki/Morgan_Freeman
		q("For which film did Morgan Freeman win the Academy Award for Best Supporting Actor?", ["The Shawshank Redemption", "Million Dollar Baby", "Driving Miss Daisy", "Invictus"], "Million Dollar Baby", 2),
		// https://en.wikipedia.org/wiki/Prince_(musician)
		q("What was the title of Prince's debut album released two years after signing with Warner Bros.?", ["Purple Rain", "Sign o' the Times", "For You", "1999"], "For You", 1),
		// https://en.wikipedia.org/wiki/Prince_(musician)
		q("In what year was Prince inducted into the Rock and Roll Hall of Fame?", ["2000", "2004", "1999", "2005"], "2004", 1),
		// https://en.wikipedia.org/wiki/Whoopi_Goldberg
		q("As of 2026, Whoopi Goldberg is one of how many entertainers to achieve the EGOT?", ["27", "30", "32", "28"], "28", 1),
	],
	music: [
		// https://en.wikipedia.org/wiki/Hip-hop
		q("What decade did hip-hop music emerge?", ["1960s", "1970s", "1980s", "1990s"], "1970s", 1),
		// https://en.wikipedia.org/wiki/Violin
		q("In which country was the violin first created?", ["France", "Italy", "Germany", "Spain"], "Italy", 1),
		// https://en.wikipedia.org/wiki/Madonna
		q("What nickname is Madonna known by?", ["Queen of Rock", "Queen of Pop", "Queen of Disco", "Queen of Soul"], "Queen of Pop", 1),
		// https://en.wikipedia.org/wiki/Ludwig_van_Beethoven
		q("Who was Beethoven's composition teacher in Vienna?", ["Joseph Haydn", "Wolfgang Amadeus Mozart", "Franz Schubert", "Johann Sebastian Bach"], "Joseph Haydn", 1),
		// https://en.wikipedia.org/wiki/Taylor_Swift
		q("As of 2026, how many times has Taylor Swift won the Grammy Award for Album of the Year?", ["Two", "Three", "Five", "Four"], "Four", 2),
		// https://en.wikipedia.org/wiki/Violin
		q("What is the term for a person who makes or repairs violins?", ["Archetier", "Violinist", "Luthier", "Composer"], "Luthier", 2),
		// https://en.wikipedia.org/wiki/Madonna
		q("What is the name of the academic subfield about Madonna?", ["Pop culture studies", "Madonna studies", "Music history", "Feminist theory"], "Madonna studies", 2),
		// https://en.wikipedia.org/wiki/Ludwig_van_Beethoven
		q("To whom was the Moonlight Sonata dedicated?", ["Helene von Breuning", "Prince Lichnowsky", "Julie Guicciardi", "Christian Gottlob Neefe"], "Julie Guicciardi", 2),
		// https://en.wikipedia.org/wiki/Piano
		q("What is a musician who specializes in piano called?", ["Pianist", "Organist", "Violinist", "Guitarist"], "Pianist", 1),
		// https://en.wikipedia.org/wiki/Country_music
		q("In which country did country music originate?", ["Canada", "United Kingdom", "Mexico", "United States"], "United States", 1),
		// https://en.wikipedia.org/wiki/Country_music
		q("What was the old name for country music?", ["Bluegrass music", "Hillbilly music", "Jazz music", "Rockabilly music"], "Hillbilly music", 1),
		// https://en.wikipedia.org/wiki/The_Rolling_Stones
		q("In what year was The Rolling Stones formed?", ["1965", "1962", "1968", "1970"], "1962", 1),
		// https://en.wikipedia.org/wiki/Taylor_Swift
		q("Which record label did Taylor Swift sign with in 2005?", ["Big Machine Records", "Republic Records", "Interscope Records", "Columbia Records"], "Big Machine Records", 1),
		// https://en.wikipedia.org/wiki/Taylor_Swift
		q("What is the name of Taylor Swift's global fanbase?", ["Beliebers", "Ari Army", "Swifties", "Beyhive"], "Swifties", 1),
		// https://en.wikipedia.org/wiki/Violin
		q("What is another common name for the violin?", ["Cello", "Fiddle", "Mandolin", "Harp"], "Fiddle", 1),
		// https://en.wikipedia.org/wiki/Ludwig_van_Beethoven
		q("In which city was Ludwig van Beethoven born?", ["Vienna", "Munich", "Bonn", "Berlin"], "Bonn", 1),
		// https://en.wikipedia.org/wiki/Hip-hop
		q("What term describes the period between the mid-1980s and mid-1990s in hip-hop?", ["Bling era", "Blog era", "Golden age", "Old-school era"], "Golden age", 2),
		// https://en.wikipedia.org/wiki/Violin
		q("Which Italian city is famous for historical violin makers like Stradivari?", ["Rome", "Venice", "Cremona", "Milan"], "Cremona", 2),
		// https://en.wikipedia.org/wiki/Madonna
		q("Which film earned Madonna a Golden Globe for Best Actress?", ["Dick Tracy", "Evita", "Desperately Seeking Susan", "A League of Their Own"], "Evita", 2),
		// https://en.wikipedia.org/wiki/Jazz
		q("What style of jazz emphasized musette waltzes?", ["Cool jazz", "Hard bop", "Gypsy jazz", "Smooth jazz"], "Gypsy jazz", 2),
		// https://en.wikipedia.org/wiki/Mercury_Prize
		q("Which venue hosted the Mercury Prize awards in 2026?", ["Eventim Apollo", "Abbey Road Studios", "O2 Arena", "Utilita Arena Newcastle"], "Utilita Arena Newcastle", 1),
		// https://en.wikipedia.org/wiki/Raye
		q("In 2026, what is the title of Raye's second studio album?", ["This Music May Contain Hope", "My 21st Century Blues", "Euphoric Sad Songs", "Escapism"], "This Music May Contain Hope", 1),
		// https://en.wikipedia.org/wiki/Mercury_Prize
		q("Who won the 2026 Mercury Prize for the album This Music May Contain Hope?", ["Arctic Monkeys", "Radiohead", "PJ Harvey", "Raye"], "Raye", 1),
		// https://en.wikipedia.org/wiki/The_Beatles
		q("What was the nickname given to The Beatles during Beatlemania?", ["the Fab Four", "the Fab Five", "the Fab Trio", "the Fab Six"], "the Fab Four", 2),
		// https://en.wikipedia.org/wiki/Piano
		q("What material coats the piano hammers?", ["Leather", "Rubber", "Felt", "Plastic"], "Felt", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/To_Kill_a_Mockingbird
		q("What major literary prize did To Kill a Mockingbird win?", ["Pulitzer Prize", "Nobel Prize", "Booker Prize", "Hugo Award"], "Pulitzer Prize", 1),
		// https://en.wikipedia.org/wiki/Odyssey
		q("Who is the hero of the epic poem The Odyssey?", ["Achilles", "Hector", "Odysseus", "Agamemnon"], "Odysseus", 1),
		// https://en.wikipedia.org/wiki/Odyssey
		q("How many books is The Odyssey divided into?", ["24", "12", "36", "48"], "24", 1),
		// https://en.wikipedia.org/wiki/Jane_Eyre
		q("Under what pen name was Jane Eyre published?", ["George Eliot", "Currer Bell", "Mary Ann Evans", "Acton Bell"], "Currer Bell", 1),
		// https://en.wikipedia.org/wiki/The_Great_Gatsby
		q("In which year was The Great Gatsby published?", ["1920", "1922", "1930", "1925"], "1925", 1),
		// https://en.wikipedia.org/wiki/Dracula
		q("In which year was the novel Dracula published?", ["1859", "1901", "1897", "1888"], "1897", 1),
		// https://en.wikipedia.org/wiki/To_Kill_a_Mockingbird
		q("Which director made the 1962 film adaptation of To Kill a Mockingbird?", ["Stanley Kubrick", "Martin Scorsese", "Francis Ford Coppola", "Robert Mulligan"], "Robert Mulligan", 2),
		// https://en.wikipedia.org/wiki/The_Great_Gatsby
		q("Who was the editor that persuaded Fitzgerald to revise The Great Gatsby?", ["Ginevra King", "Francis Cugat", "Nick Carraway", "Maxwell Perkins"], "Maxwell Perkins", 2),
		// https://en.wikipedia.org/wiki/Pride_and_Prejudice
		q("In what year was Pride and Prejudice first published?", ["1805", "1813", "1820", "1799"], "1813", 1),
		// https://en.wikipedia.org/wiki/Sherlock_Holmes
		q("How many novels feature Sherlock Holmes?", ["four", "three", "five", "seven"], "four", 1),
		// https://en.wikipedia.org/wiki/Pride_and_Prejudice
		q("Who is the protagonist of Pride and Prejudice?", ["Jane Bennet", "Elizabeth Bennet", "Mary Bennet", "Catherine Morland"], "Elizabeth Bennet", 2),
		// https://en.wikipedia.org/wiki/Sherlock_Holmes
		q("According to Guinness World Records, Sherlock Holmes holds what distinction?", ["most portrayed human literary character", "oldest fictional detective", "first detective in literature", "most translated literary work"], "most portrayed human literary character", 2),
		// https://en.wikipedia.org/wiki/Nineteen_Eighty-Four
		q("Which publishing house first released Nineteen Eighty-Four in 1949?", ["Penguin Books", "Secker & Warburg", "Harvill Secker", "Random House"], "Secker & Warburg", 2),
		// https://en.wikipedia.org/wiki/Sherlock_Holmes
		q("In what year did Sherlock Holmes first appear in print?", ["1885", "1891", "1900", "1887"], "1887", 1),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Antarctica
		q("Which explorer first reached the geographic South Pole in 1911?", ["Roald Amundsen", "Douglas Mawson", "Fabian Gottlieb von Bellingshausen", "Mikhail Lazarev"], "Roald Amundsen", 1),
		// https://en.wikipedia.org/wiki/Great_Barrier_Reef
		q("Which coral is described as the dominant coral on the Great Barrier Reef?", ["Staghorn", "Brain", "Acropora", "Elkhorn"], "Acropora", 2),
		// https://en.wikipedia.org/wiki/Andes
		q("How many South American countries does the Andes range extend through?", ["Five", "Six", "Eight", "Seven"], "Seven", 2),
		// https://en.wikipedia.org/wiki/River_Thames
		q("What is the alternative name for the River Thames when it flows through Oxford?", ["River Avon", "River Ouse", "River Wye", "River Isis"], "River Isis", 2),
		// https://en.wikipedia.org/wiki/River_Thames
		q("What is the name of the lower tidal reaches of the River Thames?", ["Estuary", "Delta", "Tideway", "Basin"], "Tideway", 2),
		// https://en.wikipedia.org/wiki/Yellowstone_National_Park
		q("Which U.S. agency took over administration of Yellowstone in 1917?", ["Forest Service", "Fish and Wildlife Service", "Bureau of Land Management", "National Park Service"], "National Park Service", 2),
		// https://en.wikipedia.org/wiki/Mediterranean_Sea
		q("Approximately how many marginal seas are included within the Mediterranean Sea?", ["Twelve", "Eighteen", "Fifteen", "Twenty"], "Fifteen", 2),
		// https://en.wikipedia.org/wiki/Nile
		q("Which tributary contributes over twice the water volume of the White Nile?", ["Atbara River", "Blue Nile", "Kagera River", "Limpopo River"], "Blue Nile", 2),
		// https://en.wikipedia.org/wiki/Nile
		q("How many countries are included in the Nile drainage basin?", ["Nine", "Twelve", "Eleven", "Fourteen"], "Eleven", 2),
		// https://en.wikipedia.org/wiki/Andes
		q("What is the name of the highest peak in the Andes?", ["Chimborazo", "Ojos del Salado", "Aconcagua", "Huascarán"], "Aconcagua", 1),
		// https://en.wikipedia.org/wiki/River_Thames
		q("In which English county does the River Thames rise at Thames Head?", ["Kent", "Essex", "Gloucestershire", "Oxfordshire"], "Gloucestershire", 1),
		// https://en.wikipedia.org/wiki/River_Thames
		q("Which river is longer than the River Thames in the United Kingdom?", ["River Trent", "River Severn", "River Clyde", "River Tyne"], "River Severn", 1),
		// https://en.wikipedia.org/wiki/Antarctica
		q("What is the name of the ocean surrounding Antarctica?", ["Southern Ocean", "Arctic Ocean", "Indian Ocean", "Atlantic Ocean"], "Southern Ocean", 1),
		// https://en.wikipedia.org/wiki/Yellowstone_National_Park
		q("Which geyser is one of the most popular features in Yellowstone?", ["Old Faithful", "Grand Prismatic", "Steamboat Geyser", "Riverside Geyser"], "Old Faithful", 1),
		// https://en.wikipedia.org/wiki/New_Yalu_River_Bridge
		q("On what date in October 2026 did the New Yalu River Bridge open to vehicle traffic?", ["15 October 2026", "1 October 2026", "24 October 2026", "31 October 2026"], "15 October 2026", 1),
		// https://en.wikipedia.org/wiki/Western_Sydney_Airport
		q("In October 2026, when did passenger operations begin at Western Sydney Airport?", ["27 July 2026", "2 October 2024", "19 October 2015", "25 October 2026"], "25 October 2026", 1),
		// https://en.wikipedia.org/wiki/Mediterranean_Sea
		q("Which strait connects the Mediterranean Sea to the Atlantic Ocean?", ["Bosporus Strait", "Strait of Gibraltar", "Suez Canal", "Dardanelles"], "Strait of Gibraltar", 1),
		// https://en.wikipedia.org/wiki/Alps
		q("How many Alpine peaks are higher than 4,000 meters?", ["75", "90", "100", "82"], "82", 1),
		// https://en.wikipedia.org/wiki/Mediterranean_Sea
		q("What is the deepest recorded point in the Mediterranean Sea?", ["Mariana Trench", "Calypso Deep", "Puerto Rico Trench", "Java Trench"], "Calypso Deep", 2),
	],
};
