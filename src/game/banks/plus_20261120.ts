import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Trial run 4 batch (job trivia-trial-20261120-run4, Fri Nov 20 2026, America/Chicago).
 * Why: grow the thinnest topics (games, celebrity) and the 12 non-local topics, add medium/hard depth
 * (the last batch had no diff-3), plus settled current events from 20 Oct to 20 Nov 2026
 * (time-anchored in the prompt). Claude Opus candidates written only from public Wikipedia text
 * (fetched 20 Nov 2026). The three-model free cross-check could not run (GROQ / AI_GATEWAY /
 * OPENROUTER keys absent), so every candidate was source-checked with Claude Opus and then re-read
 * against the full article text in a second pass (distractors included). Fact-deduped against all
 * of main. No math (capped).
 * Evidence: /workspace/kl-trivia-20261120-logs/.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261120: Partial<Record<PlusCat, TriviaQ[]>> = {
	sports: [
		// https://en.wikipedia.org/wiki/Badminton
		q("In what year did badminton debut as an official Summer Olympic medal sport?", ["1992", "1988", "1996", "1984"], "1992", 1),
		// https://en.wikipedia.org/wiki/Curling
		q("From what type of rock are curling stones traditionally made?", ["Marble", "Basalt", "Granite", "Slate"], "Granite", 1),
		// https://en.wikipedia.org/wiki/Fencing
		q("In which Swiss city is fencing's governing body, the FIE, headquartered?", ["Geneva", "Lausanne", "Zurich", "Bern"], "Lausanne", 2),
		// https://en.wikipedia.org/wiki/Judo
		q("What is a judo practitioner called?", ["Sensei", "Karateka", "Rikishi", "Judoka"], "Judoka", 1),
		// https://en.wikipedia.org/wiki/Lacrosse
		q("Which continent's indigenous peoples originated the sport of lacrosse?", ["South America", "North America", "Africa", "Australia"], "North America", 1),
		// https://en.wikipedia.org/wiki/Polo
		q("What sport is often called \"The Sport of Kings\" and played on horseback with mallets?", ["Polo", "Jousting", "Croquet", "Dressage"], "Polo", 1),
		// https://en.wikipedia.org/wiki/Triathlon
		q("What three disciplines make up a standard triathlon?", ["Swim, row, run", "Run, cycle, kayak", "Swim, cycle, run", "Swim, ski, run"], "Swim, cycle, run", 1),
		// https://en.wikipedia.org/wiki/Water_polo
		q("Including the goalkeeper, how many players does each water polo team have in the water?", ["Five", "Nine", "Eleven", "Seven"], "Seven", 1),
		// https://en.wikipedia.org/wiki/Badminton
		q("Badminton is named after Badminton House, home of which duke?", ["Duke of Beaufort", "Duke of Norfolk", "Duke of Devonshire", "Duke of Wellington"], "Duke of Beaufort", 2),
		// https://en.wikipedia.org/wiki/Curling
		q("What nickname for curling refers to the sound the stones make on the ice?", ["The roaring game", "The thunder game", "The rumbling game", "The sliding game"], "The roaring game", 2),
		// https://en.wikipedia.org/wiki/Fencing
		q("In individual fencing, how many hits win a direct elimination bout?", ["15", "5", "10", "21"], "15", 2),
		// https://en.wikipedia.org/wiki/Judo
		q("Who created judo in 1882?", ["Morihei Ueshiba", "Kanō Jigorō", "Gichin Funakoshi", "Mas Oyama"], "Kanō Jigorō", 2),
		// https://en.wikipedia.org/wiki/Lacrosse
		q("Which French Jesuit missionary named lacrosse after seeing Wendat tribesmen play in 1637?", ["Jacques Marquette", "Samuel de Champlain", "Jean de Brébeuf", "Paul Le Jeune"], "Jean de Brébeuf", 2),
		// https://en.wikipedia.org/wiki/Polo
		q("What is a period of play in polo called?", ["Inning", "Chukka", "Frame", "Bout"], "Chukka", 2),
		// https://en.wikipedia.org/wiki/Triathlon
		q("In which US state was the first modern swim/bike/run triathlon held in 1974?", ["Hawaii", "Florida", "California", "Arizona"], "California", 2),
		// https://en.wikipedia.org/wiki/Water_polo
		q("Which kick do water polo players mainly use to tread water?", ["Eggbeater kick", "Flutter kick", "Dolphin kick", "Scissor kick"], "Eggbeater kick", 2),
		// https://en.wikipedia.org/wiki/2026_CAF_Women%27s_Champions_League
		q("Which club won the 2026 CAF Women's Champions League in November 2026?", ["Edo Queens", "TP Mazembe", "Lekié FF", "AS FAR"], "AS FAR", 1),
		// https://en.wikipedia.org/wiki/2026_CAF_Women%27s_Champions_League
		q("Which country hosted the 2026 CAF Women's Champions League in November 2026?", ["Morocco", "South Africa", "Ivory Coast", "Egypt"], "Egypt", 2),
		// https://en.wikipedia.org/wiki/2026_FIFA_U-17_Women%27s_World_Cup
		q("Which country won the 2026 FIFA U-17 Women's World Cup in Morocco in November 2026?", ["North Korea", "Brazil", "Spain", "Nigeria"], "Nigeria", 1),
		// https://en.wikipedia.org/wiki/2026_FIFA_U-17_Women%27s_World_Cup
		q("Which team lost the final of the 2026 FIFA U-17 Women's World Cup in November 2026?", ["North Korea", "Brazil", "Japan", "Spain"], "Japan", 1),
		// https://en.wikipedia.org/wiki/2026_Men%27s_Rugby_League_World_Cup
		q("Which team finished runner-up at the 2026 Men's Rugby League World Cup in November 2026?", ["Papua New Guinea", "Tonga", "England", "New Zealand"], "New Zealand", 1),
		// https://en.wikipedia.org/wiki/2026_Men%27s_Rugby_League_World_Cup
		q("In which city was the 2026 Men's Rugby League World Cup final played in November 2026?", ["Sydney", "Auckland", "Brisbane", "Melbourne"], "Brisbane", 2),
		// https://en.wikipedia.org/wiki/2026_World_Weightlifting_Championships
		q("Which Chinese city hosted the 2026 World Weightlifting Championships, which ended in November 2026?", ["Hangzhou", "Xiamen", "Ningbo", "Fuzhou"], "Ningbo", 1),
		// https://en.wikipedia.org/wiki/2026_World_Weightlifting_Championships
		q("Which nation topped the medal table at the 2026 World Weightlifting Championships, held through November 2026?", ["North Korea", "Iran", "Bulgaria", "Uzbekistan"], "North Korea", 2),
		// https://en.wikipedia.org/wiki/Cam_Schlittler
		q("Which New York Yankees pitcher won the 2026 American League Cy Young Award in November 2026?", ["Cam Schlittler", "Gerrit Cole", "Carlos Rodón", "Luis Gil"], "Cam Schlittler", 1),
		// https://en.wikipedia.org/wiki/Jacob_Misiorowski
		q("In November 2026, which award did Brewers pitcher Jacob Misiorowski win unanimously?", ["NL MVP Award", "NL Cy Young Award", "Hank Aaron Award", "Roberto Clemente Award"], "NL Cy Young Award", 1),
		// https://en.wikipedia.org/wiki/Jacob_Misiorowski
		q("Jacob Misiorowski's 2026 Cy Young and World Series-clinching win was a first since which pitcher in 2001?", ["Pedro Martínez", "Greg Maddux", "Randy Johnson", "Roger Clemens"], "Randy Johnson", 2),
		// https://en.wikipedia.org/wiki/Pat_Murphy_%28baseball_manager%29
		q("In November 2026, Pat Murphy won NL Manager of the Year for which consecutive season?", ["Second", "Fourth", "Fifth", "Third"], "Third", 2),
		// https://en.wikipedia.org/wiki/Pete_Crow-Armstrong
		q("In November 2026, what fielding award did Pete Crow-Armstrong win for a second straight year?", ["Silver Slugger Award", "Gold Glove Award", "Edgar Martínez Award", "Roberto Clemente Award"], "Gold Glove Award", 2),
		// https://en.wikipedia.org/wiki/Will_Venable
		q("Will Venable was named 2026 AL Manager of the Year for managing which team?", ["Cleveland Guardians", "Detroit Tigers", "Chicago White Sox", "Kansas City Royals"], "Chicago White Sox", 1),
		// https://en.wikipedia.org/wiki/Yordan_Alvarez
		q("Which Houston Astros slugger unanimously won the American League MVP Award in November 2026?", ["Yordan Alvarez", "Jose Altuve", "Kyle Tucker", "Alex Bregman"], "Yordan Alvarez", 1),
		// https://en.wikipedia.org/wiki/Pete_Crow-Armstrong
		q("Which Chicago Cubs outfielder won the 2026 National League MVP Award in November 2026?", ["Fernando Tatís Jr.", "Ronald Acuña Jr.", "Pete Crow-Armstrong", "Kyle Schwarber"], "Pete Crow-Armstrong", 1),
	],
	political: [
		// https://en.wikipedia.org/wiki/European_Parliament
		q("How often have European Parliament elections been held since 1979?", ["Every four years", "Every six years", "Every two years", "Every five years"], "Every five years", 1),
		// https://en.wikipedia.org/wiki/International_Criminal_Court
		q("Under which multilateral treaty was the International Criminal Court established?", ["Geneva Statute", "Paris Statute", "Rome Statute", "Vienna Statute"], "Rome Statute", 2),
		// https://en.wikipedia.org/wiki/International_Monetary_Fund
		q("In which city is the International Monetary Fund headquartered?", ["Washington, D.C.", "New York City", "Geneva", "London"], "Washington, D.C.", 1),
		// https://en.wikipedia.org/wiki/Parliament_of_Canada
		q("In the Parliament of Canada, who formally appoints senators on the advice of the prime minister?", ["Chief Justice", "Governor general", "House Speaker", "Provincial premiers"], "Governor general", 1),
		// https://en.wikipedia.org/wiki/President_of_France
		q("Which president did Emmanuel Macron succeed as President of France in May 2017?", ["Nicolas Sarkozy", "Jacques Chirac", "François Mitterrand", "François Hollande"], "François Hollande", 1),
		// https://en.wikipedia.org/wiki/United_Nations_Security_Council
		q("How many members make up the United Nations Security Council?", ["12", "15", "10", "20"], "15", 1),
		// https://en.wikipedia.org/wiki/United_States_House_of_Representatives
		q("How long is the fixed term served by members of the US House of Representatives?", ["Four years", "Two years", "Six years", "Three years"], "Two years", 1),
		// https://en.wikipedia.org/wiki/World_Trade_Organization
		q("Which 1948 trade agreement did the World Trade Organization succeed?", ["NAFTA", "OECD", "GATT", "EFTA"], "GATT", 2),
		// https://en.wikipedia.org/wiki/European_Parliament
		q("Which EU institution, not the European Parliament, holds the right to formally initiate legislation?", ["European Council", "Court of Justice", "European Central Bank", "European Commission"], "European Commission", 2),
		// https://en.wikipedia.org/wiki/International_Criminal_Court
		q("Who revived the idea of a permanent international criminal court in 1989 with a drug-trade tribunal proposal?", ["Eric Williams", "Kofi Annan", "A. N. R. Robinson", "Boutros Boutros-Ghali"], "A. N. R. Robinson", 3),
		// https://en.wikipedia.org/wiki/International_Monetary_Fund
		q("At which 1944 conference was the International Monetary Fund established?", ["Bretton Woods Conference", "Yalta Conference", "Potsdam Conference", "Dumbarton Oaks Conference"], "Bretton Woods Conference", 2),
		// https://en.wikipedia.org/wiki/Parliament_of_Canada
		q("In the Parliament of Canada, in which chamber must bills to raise or spend funds originate?", ["House of Commons", "Senate", "Privy Council", "Supreme Court"], "House of Commons", 1),
		// https://en.wikipedia.org/wiki/President_of_France
		q("Who was the first popularly elected President of France, under the Second Republic?", ["Adolphe Thiers", "Patrice de MacMahon", "Louis-Napoléon Bonaparte", "Jules Grévy"], "Louis-Napoléon Bonaparte", 2),
		// https://en.wikipedia.org/wiki/United_Nations_Security_Council
		q("How long is the term of a non-permanent member of the UN Security Council?", ["One year", "Three years", "Two years", "Four years"], "Two years", 1),
		// https://en.wikipedia.org/wiki/United_States_House_of_Representatives
		q("Which 1787 compromise gave the US House population-based representation and the Senate equal representation?", ["Missouri Compromise", "Delaware Compromise", "Connecticut Compromise", "Maryland Compromise"], "Connecticut Compromise", 2),
		// https://en.wikipedia.org/wiki/World_Trade_Organization
		q("Which 1994 agreement, named after a Moroccan city, established the World Trade Organization?", ["Marrakesh Agreement", "Casablanca Agreement", "Rabat Agreement", "Tangier Agreement"], "Marrakesh Agreement", 2),
		// https://en.wikipedia.org/wiki/European_Parliament
		q("The European Parliament began as the Common Assembly of which organization?", ["European Defense Community", "European Atomic Energy Community", "European Free Trade Association", "European Coal and Steel Community"], "European Coal and Steel Community", 2),
		// https://en.wikipedia.org/wiki/International_Criminal_Court
		q("ICC advocate Benjamin B. Ferencz was chief US Army prosecutor at which postwar trial?", ["Einsatzgruppen trial", "Doctors' trial", "Krupp trial", "Ministries trial"], "Einsatzgruppen trial", 3),
		// https://en.wikipedia.org/wiki/2026_Bulgarian_presidential_election
		q("Which former prime minister lost Bulgaria's November 2026 presidential runoff?", ["Rumen Radev", "Kiril Valchev", "Andrey Gurov", "Georgi Dimov"], "Andrey Gurov", 2),
		// https://en.wikipedia.org/wiki/2026_Bulgarian_presidential_election
		q("What first did Iliana Iotova achieve by winning Bulgaria's presidential election in November 2026?", ["First president elected unopposed", "First woman elected president", "Youngest president ever elected", "First-round outright winner"], "First woman elected president", 1),
		// https://en.wikipedia.org/wiki/APEC_China_2026
		q("In which Chinese city was the APEC Economic Leaders' Meeting held in November 2026?", ["Shanghai", "Guangzhou", "Beijing", "Shenzhen"], "Shenzhen", 1),
		// https://en.wikipedia.org/wiki/APEC_China_2026
		q("Which three countries held an unprecedented trilateral summit on the sidelines of APEC in November 2026?", ["China, Japan and U.S.", "China, India and Russia", "China, Russia and Japan", "China, Russia and U.S."], "China, Russia and U.S.", 2),
		// https://en.wikipedia.org/wiki/Gilbert_Houngbo
		q("Gilbert Houngbo was re-elected in November 2026 as Director-General of which UN agency?", ["International Labour Organization", "World Health Organization", "World Trade Organization", "Food and Agriculture Organization"], "International Labour Organization", 2),
		// https://en.wikipedia.org/wiki/Rohingya_genocide_case
		q("In November 2026, the ICJ found which country had committed genocide against the Rohingya?", ["Bangladesh", "Thailand", "Myanmar", "Laos"], "Myanmar", 1),
		// https://en.wikipedia.org/wiki/Rohingya_genocide_case
		q("Which country brought the Rohingya genocide case that the ICJ decided in November 2026?", ["The Gambia", "Senegal", "Malaysia", "Nigeria"], "The Gambia", 2),
		// https://en.wikipedia.org/wiki/Sandagiin_Byambatsogt
		q("Who became acting President of Mongolia on 19 November 2026?", ["Nyam-Osoryn Uchral", "Gombojavyn Zandanshatar", "Luvsannamsrain Oyun-Erdene", "Sandagiin Byambatsogt"], "Sandagiin Byambatsogt", 1),
		// https://en.wikipedia.org/wiki/Ukhnaagiin_Kh%C3%BCrels%C3%BCkh
		q("Ukhnaagiin Khürelsükh resigned as president of which country in November 2026?", ["Kazakhstan", "Kyrgyzstan", "Mongolia", "Uzbekistan"], "Mongolia", 1),
	],
	food: [
		// https://en.wikipedia.org/wiki/Avocado
		q("Which reptile-themed alternative name is the avocado also known by?", ["Alligator pear", "Crocodile pear", "Lizard fig", "Iguana plum"], "Alligator pear", 1),
		// https://en.wikipedia.org/wiki/Black_pepper
		q("What chemical compound gives black pepper its spiciness?", ["Piperine", "Capsaicin", "Allicin", "Gingerol"], "Piperine", 1),
		// https://en.wikipedia.org/wiki/Butter
		q("What is the watery liquid left after churning butter traditionally called?", ["Buttermilk", "Whey", "Skim milk", "Curd"], "Buttermilk", 1),
		// https://en.wikipedia.org/wiki/Cinnamon
		q("Which Roman emperor reportedly burned a year's supply of cinnamon at his wife's funeral?", ["Caligula", "Tiberius", "Nero", "Claudius"], "Nero", 2),
		// https://en.wikipedia.org/wiki/Garlic
		q("What is the scientific name of garlic?", ["Allium cepa", "Allium sativum", "Allium porrum", "Allium ursinum"], "Allium sativum", 1),
		// https://en.wikipedia.org/wiki/Maize
		q("In the Three Sisters polyculture, maize was planted with beans and which other crop?", ["Potatoes", "Squashes", "Peppers", "Tomatoes"], "Squashes", 1),
		// https://en.wikipedia.org/wiki/Soy_sauce
		q("What is soy sauce called in Japan?", ["Shōyu", "Mirin", "Ponzu", "Dashi"], "Shōyu", 2),
		// https://en.wikipedia.org/wiki/Vanilla
		q("By weight, vanilla is the world's second-most expensive spice after which spice?", ["Cardamom", "Nutmeg", "Saffron", "Cinnamon"], "Saffron", 1),
		// https://en.wikipedia.org/wiki/Avocado
		q("Botanically, what type of fruit is the avocado?", ["A berry", "A hesperidium", "A pome", "A legume"], "A berry", 2),
		// https://en.wikipedia.org/wiki/Black_pepper
		q("Black pepper is indigenous to which coast of southwestern India?", ["Coromandel Coast", "Konkan Coast", "Malabar Coast", "Gujarat Coast"], "Malabar Coast", 2),
		// https://en.wikipedia.org/wiki/Butter
		q("What natural food coloring is sometimes added to butter, alongside carotene?", ["Cochineal", "Spirulina", "Annatto", "Beetroot red"], "Annatto", 2),
		// https://en.wikipedia.org/wiki/Cinnamon
		q("Which poet made the first Greek reference to cassia (kasía) in the 7th century BC?", ["Homer", "Hesiod", "Sappho", "Pindar"], "Sappho", 3),
		// https://en.wikipedia.org/wiki/Garlic
		q("Which compound is most responsible for the 'hot' sensation of raw garlic?", ["Allicin", "Capsaicin", "Piperine", "Menthol"], "Allicin", 2),
		// https://en.wikipedia.org/wiki/Maize
		q("Which Italian dish is made from maize?", ["Risotto", "Gnocchi", "Polenta", "Focaccia"], "Polenta", 1),
		// https://en.wikipedia.org/wiki/Soy_sauce
		q("Which company began exporting Japanese shoyu in 1647?", ["British East India Company", "Hudson's Bay Company", "French East India Company", "Dutch East India Company"], "Dutch East India Company", 3),
		// https://en.wikipedia.org/wiki/Vanilla
		q("Which 12-year-old enslaved child on Réunion discovered in 1841 that vanilla could be hand-pollinated?", ["Louis Dumont", "Pierre Lagarde", "Jacques Morel", "Edmond Albius"], "Edmond Albius", 2),
		// https://en.wikipedia.org/wiki/Avocado
		q("The avocado tree belongs to which plant family?", ["Rose family", "Laurel family", "Olive family", "Myrtle family"], "Laurel family", 2),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Auguste_Rodin
		q("Which famous Rodin figure began as part of his composition The Gates of Hell?", ["The Age of Bronze", "Monument to Balzac", "The Burghers of Calais", "The Thinker"], "The Thinker", 1),
		// https://en.wikipedia.org/wiki/Bauhaus
		q("What does the German name 'Bauhaus' mean in English?", ["Art workshop", "Craft school", "Design hall", "Building house"], "Building house", 2),
		// https://en.wikipedia.org/wiki/Fresco
		q("The word fresco comes from an Italian adjective with what meaning?", ["Wall", "Bright", "Fresh", "Painted"], "Fresh", 1),
		// https://en.wikipedia.org/wiki/Girl_with_a_Pearl_Earring
		q("Which museum in The Hague has held Girl with a Pearl Earring since 1902?", ["Rijksmuseum", "Van Gogh Museum", "Stedelijk Museum", "Mauritshuis"], "Mauritshuis", 1),
		// https://en.wikipedia.org/wiki/Guernica_(Picasso)
		q("In which Madrid museum is Picasso's Guernica exhibited?", ["Thyssen-Bornemisza Museum", "Museo Sorolla", "Museo Reina Sofía", "Museo Lázaro Galdiano"], "Museo Reina Sofía", 1),
		// https://en.wikipedia.org/wiki/Johannes_Vermeer
		q("In which Dutch city did the painter Johannes Vermeer spend his life?", ["Haarlem", "Leiden", "Delft", "Utrecht"], "Delft", 1),
		// https://en.wikipedia.org/wiki/Salvador_Dal%C3%AD
		q("What is Salvador Dalí's best-known work, completed in August 1931?", ["The Burning Giraffe", "The Persistence of Memory", "Metamorphosis of Narcissus", "The Temptation of St. Anthony"], "The Persistence of Memory", 1),
		// https://en.wikipedia.org/wiki/The_Scream
		q("What is the Norwegian title of Edvard Munch's painting The Scream?", ["Rop", "Skrik", "Hyl", "Brøl"], "Skrik", 2),
		// https://en.wikipedia.org/wiki/Auguste_Rodin
		q("Which sculptor was Auguste Rodin's student, associate, lover and creative rival?", ["Berthe Morisot", "Camille Claudel", "Suzanne Valadon", "Rosa Bonheur"], "Camille Claudel", 2),
		// https://en.wikipedia.org/wiki/Bauhaus
		q("Which city's 'White City' has the world's highest concentration of Bauhaus-style buildings?", ["Haifa", "Jerusalem", "Chicago", "Tel Aviv"], "Tel Aviv", 3),
		// https://en.wikipedia.org/wiki/Fresco
		q("In buon fresco, what is the thin layer of wet plaster that the pigment is painted onto called?", ["Gesso", "Stucco", "Intonaco", "Scagliola"], "Intonaco", 2),
		// https://en.wikipedia.org/wiki/Girl_with_a_Pearl_Earring
		q("What Dutch term for a 'head' painting not meant as a portrait describes Girl with a Pearl Earring?", ["Vanitas", "Kermis", "Tronie", "Pronkstilleven"], "Tronie", 2),
		// https://en.wikipedia.org/wiki/Guernica_(Picasso)
		q("In what year did Pablo Picasso paint Guernica?", ["1931", "1937", "1939", "1944"], "1937", 1),
		// https://en.wikipedia.org/wiki/Johannes_Vermeer
		q("What nickname did Thoré-Bürger give Johannes Vermeer because so little was known about him?", ["The Owl of Leiden", "The Ghost of Haarlem", "The Lion of Utrecht", "The Sphinx of Delft"], "The Sphinx of Delft", 2),
		// https://en.wikipedia.org/wiki/Salvador_Dal%C3%AD
		q("In which Catalan town was Salvador Dalí born?", ["Figueres", "Girona", "Tarragona", "Reus"], "Figueres", 1),
		// https://en.wikipedia.org/wiki/The_Scream
		q("Which volcano's 1883 eruption has been suggested as the source of The Scream's red sky?", ["Vesuvius", "Tambora", "Etna", "Krakatoa"], "Krakatoa", 2),
		// https://en.wikipedia.org/wiki/Blossoming_Chestnut_Trees
		q("Which artist's painting set his own auction record by selling for US$190.4 million in November 2026?", ["Claude Monet", "Paul Cézanne", "Vincent van Gogh", "Paul Gauguin"], "Vincent van Gogh", 1),
		// https://en.wikipedia.org/wiki/Blossoming_Chestnut_Trees
		q("Which auction house sold Van Gogh's Blossoming Chestnut Trees in New York in November 2026?", ["Christie's", "Phillips", "Bonhams", "Sotheby's"], "Sotheby's", 1),
		// https://en.wikipedia.org/wiki/Blossoming_Chestnut_Trees
		q("Which art dealer placed the winning bid for Van Gogh's Blossoming Chestnut Trees in November 2026?", ["Larry Gagosian", "David Zwirner", "Marc Glimcher", "Bill Acquavella"], "Bill Acquavella", 3),
	],
	science: [
		// https://en.wikipedia.org/wiki/Comet
		q("What is the process called when a comet warms near the Sun and starts releasing gases?", ["Spallation", "Ionization", "Accretion", "Outgassing"], "Outgassing", 1),
		// https://en.wikipedia.org/wiki/Halley%27s_Comet
		q("In what year is Halley's Comet due to next appear in the inner Solar System?", ["2048", "2061", "2076", "2059"], "2061", 1),
		// https://en.wikipedia.org/wiki/Insulin
		q("The word \"insulin\" comes from the Latin word insula, meaning what?", ["Sugar", "Gland", "Sweet", "Island"], "Island", 1),
		// https://en.wikipedia.org/wiki/Laser
		q("Who built the first laser in 1960?", ["Theodore Maiman", "Dennis Gabor", "William Shockley", "Robert Noyce"], "Theodore Maiman", 1),
		// https://en.wikipedia.org/wiki/Microscope
		q("Who published the illustrated book Micrographia in 1665?", ["Isaac Newton", "Robert Boyle", "Robert Hooke", "Christiaan Huygens"], "Robert Hooke", 1),
		// https://en.wikipedia.org/wiki/Saturn
		q("The planet Saturn is named after a Roman god who was the father of which other god?", ["Mars", "Apollo", "Mercury", "Jupiter"], "Jupiter", 1),
		// https://en.wikipedia.org/wiki/Thermometer
		q("What is a thermometer-like device that has no numerical scale called?", ["Hygroscope", "Barometer", "Thermoscope", "Pyrometer"], "Thermoscope", 1),
		// https://en.wikipedia.org/wiki/Venus
		q("The thick cloud layer covering Venus is made of which acid?", ["Sulfuric acid", "Hydrochloric acid", "Nitric acid", "Phosphoric acid"], "Sulfuric acid", 2),
		// https://en.wikipedia.org/wiki/Comet
		q("In which distant cloud of icy bodies are long-period comets thought to originate?", ["Kuiper belt", "Oort cloud", "Asteroid belt", "Van Allen belt"], "Oort cloud", 2),
		// https://en.wikipedia.org/wiki/Halley%27s_Comet
		q("Which ESA mission made a close flyby of Halley's Comet in March 1986?", ["Rosetta", "Ulysses", "Huygens", "Giotto"], "Giotto", 2),
		// https://en.wikipedia.org/wiki/Insulin
		q("From which animal's pancreas did Banting and Best first isolate insulin?", ["Cow", "Sheep", "Rabbit", "Dog"], "Dog", 2),
		// https://en.wikipedia.org/wiki/Laser
		q("What was the microwave-frequency forerunner of the laser called?", ["Radar", "Klystron", "Magnetron", "Maser"], "Maser", 2),
		// https://en.wikipedia.org/wiki/Microscope
		q("What type of microscope is the most common and was the first to be invented?", ["Electron microscope", "Optical microscope", "Fluorescence microscope", "Scanning probe microscope"], "Optical microscope", 1),
		// https://en.wikipedia.org/wiki/Saturn
		q("What gives Saturn its pale yellow hue?", ["Sulfur clouds", "Methane ice", "Iron oxide dust", "Ammonia crystals"], "Ammonia crystals", 2),
		// https://en.wikipedia.org/wiki/Thermometer
		q("Which Roman Greek physician introduced the idea of measuring \"degrees of hot and cold\"?", ["Hippocrates", "Avicenna", "Celsus", "Galen"], "Galen", 2),
		// https://en.wikipedia.org/wiki/Venus
		q("Which spacecraft made the first visit to Venus, flying past it in 1961?", ["Venera 1", "Pioneer 5", "Luna 3", "Sputnik 2"], "Venera 1", 2),
		// https://en.wikipedia.org/wiki/2026_in_science
		q("In November 2026, University of Cambridge researchers used an mRNA therapy to repair which organ in mice?", ["Liver", "Kidney", "Heart", "Brain"], "Heart", 2),
		// https://en.wikipedia.org/wiki/2026_in_science
		q("In November 2026, trial results for the drug daraxonrasib with chemotherapy targeted which cancer?", ["Prostate cancer", "Pancreatic cancer", "Breast cancer", "Brain cancer"], "Pancreatic cancer", 2),
		// https://en.wikipedia.org/wiki/2026_in_science
		q("Possible fossil red blood cells reported in November 2026 came from a dinosaur found in which country?", ["Brazil", "Argentina", "Mongolia", "Morocco"], "Brazil", 2),
		// https://en.wikipedia.org/wiki/Voyager_1
		q("On November 18, 2026, what distance milestone from Earth did NASA's Voyager 1 reach?", ["One light-hour", "One light-week", "One light-day", "One light-year"], "One light-day", 1),
		// https://en.wikipedia.org/wiki/Voyager_1
		q("In November 2026, NASA asked people to flash which Morse call sign skyward to mark Voyager 1's milestone?", ["SOS", "NSA", "JPL", "VGR"], "VGR", 2),
	],
	history: [
		// https://en.wikipedia.org/wiki/Aztecs
		q("What language did many of the Aztec peoples of central Mexico speak?", ["Nahuatl", "Quechua", "Maya", "Zapotec"], "Nahuatl", 1),
		// https://en.wikipedia.org/wiki/Crusades
		q("Which pope proclaimed the First Crusade at the Council of Clermont in 1095?", ["Gregory VII", "Innocent III", "Leo IX", "Urban II"], "Urban II", 1),
		// https://en.wikipedia.org/wiki/Hundred_Years%27_War
		q("Which English king's claim to the French throne triggered the Hundred Years' War?", ["Henry V", "Edward III", "Edward I", "Richard II"], "Edward III", 1),
		// https://en.wikipedia.org/wiki/Inca_Empire
		q("What was the official language of the Inca Empire?", ["Aymara", "Nahuatl", "Guarani", "Quechua"], "Quechua", 2),
		// https://en.wikipedia.org/wiki/Ottoman_Empire
		q("Which Turkoman tribal leader founded the beylik that became the Ottoman Empire?", ["Orhan I", "Selim I", "Osman I", "Bayezid I"], "Osman I", 1),
		// https://en.wikipedia.org/wiki/Pompeii
		q("In which region of Italy is Pompeii located?", ["Campania", "Lazio", "Calabria", "Apulia"], "Campania", 2),
		// https://en.wikipedia.org/wiki/Spanish_Armada
		q("Which Spanish king appointed the commander of the Spanish Armada?", ["Philip II", "Charles V", "Philip III", "Philip IV"], "Philip II", 1),
		// https://en.wikipedia.org/wiki/Stonehenge
		q("Stonehenge is aligned towards the sunrise on which day of the year?", ["Spring equinox", "Summer solstice", "Autumn equinox", "May Day"], "Summer solstice", 2),
		// https://en.wikipedia.org/wiki/Aztecs
		q("Which Mexica city-state was founded on islets in Lake Texcoco?", ["Teotihuacan", "Cholula", "Tenochtitlan", "Tula"], "Tenochtitlan", 2),
		// https://en.wikipedia.org/wiki/Crusades
		q("At which 1187 battle did Saladin destroy the combined armies of the Crusader states?", ["Battle of Arsuf", "Battle of Dorylaeum", "Battle of Hattin", "Battle of Ascalon"], "Battle of Hattin", 2),
		// https://en.wikipedia.org/wiki/Hundred_Years%27_War
		q("The Hundred Years' War emerged from feudal disputes over which duchy?", ["Normandy", "Brittany", "Burgundy", "Aquitaine"], "Aquitaine", 2),
		// https://en.wikipedia.org/wiki/Inca_Empire
		q("What were the knotted strings the Incas used for record keeping called?", ["Quipu", "Ayllu", "Chasqui", "Tumi"], "Quipu", 2),
		// https://en.wikipedia.org/wiki/Ottoman_Empire
		q("In what year did the Young Turk Revolution reestablish Ottoman constitutional monarchy?", ["1876", "1913", "1908", "1922"], "1908", 2),
		// https://en.wikipedia.org/wiki/Pompeii
		q("The graffiti on Pompeii's walls preserve examples of which colloquial language?", ["Etruscan", "Phoenician", "Vulgar Latin", "Old Umbrian"], "Vulgar Latin", 2),
		// https://en.wikipedia.org/wiki/Spanish_Armada
		q("From which city did the Spanish Armada set sail in May 1588?", ["Cádiz", "Seville", "Málaga", "Lisbon"], "Lisbon", 2),
		// https://en.wikipedia.org/wiki/Stonehenge
		q("In what year was Stonehenge added to UNESCO's list of World Heritage Sites?", ["1972", "1986", "1999", "2004"], "1986", 2),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Bamboo
		q("To which plant family does bamboo belong?", ["Grass family", "Palm family", "Orchid family", "Lily family"], "Grass family", 1),
		// https://en.wikipedia.org/wiki/Cactus
		q("What specialized structures, a kind of reduced branch, produce cactus spines?", ["Stipules", "Lenticels", "Areoles", "Nectaries"], "Areoles", 2),
		// https://en.wikipedia.org/wiki/Giraffe
		q("What animal is the giraffe's closest living relative?", ["Okapi", "Zebra", "Camel", "Antelope"], "Okapi", 1),
		// https://en.wikipedia.org/wiki/Great_white_shark
		q("What is the Australian English name for the great white shark?", ["Grey nurse", "Blue pointer", "White pointer", "Bronze whaler"], "White pointer", 2),
		// https://en.wikipedia.org/wiki/Hummingbird
		q("Which hummingbird makes one of the longest bird migrations, between Alaska and Mexico?", ["Rufous hummingbird", "Giant hummingbird", "Bee hummingbird", "Little woodstar"], "Rufous hummingbird", 2),
		// https://en.wikipedia.org/wiki/Kangaroo
		q("Which well-known Australian airline uses a kangaroo as its logo?", ["Qantas", "Ansett", "Jetstar", "Virgin Australia"], "Qantas", 1),
		// https://en.wikipedia.org/wiki/Owl
		q("What species is the smallest owl, weighing as little as 31 g?", ["Barn owl", "Tawny owl", "Snowy owl", "Elf owl"], "Elf owl", 2),
		// https://en.wikipedia.org/wiki/Sea_otter
		q("What objects do sea otters use as tools to open shells?", ["Sticks", "Rocks", "Kelp stalks", "Driftwood"], "Rocks", 1),
		// https://en.wikipedia.org/wiki/Bamboo
		q("The word 'bamboo' most likely reached Dutch or Portuguese from which language?", ["Malay", "Tamil", "Chinese", "Japanese"], "Malay", 2),
		// https://en.wikipedia.org/wiki/Cactus
		q("What does CAM, the photosynthesis mechanism used by most cacti, stand for?", ["Carbon assimilation mechanism", "Cellular acid metabolism", "Crassulacean acid metabolism", "Chlorophyll activation mode"], "Crassulacean acid metabolism", 2),
		// https://en.wikipedia.org/wiki/Giraffe
		q("The archaic giraffe name 'camelopard' combines 'camel' with which other animal?", ["Lion", "Tiger", "Cheetah", "Leopard"], "Leopard", 1),
		// https://en.wikipedia.org/wiki/Great_white_shark
		q("In which genus did Linnaeus originally place the great white shark in 1758?", ["Lamna", "Isurus", "Squalus", "Galeus"], "Squalus", 2),
		// https://en.wikipedia.org/wiki/Hummingbird
		q("Hummingbirds split from which sister group around 42 million years ago?", ["Nightjars and frogmouths", "Kingfishers and bee-eaters", "Swifts and treeswifts", "Sunbirds and spiderhunters"], "Swifts and treeswifts", 3),
		// https://en.wikipedia.org/wiki/Kangaroo
		q("What is the name of the female kangaroo's pouch?", ["Plastron", "Gular sac", "Marsupium", "Cloaca"], "Marsupium", 2),
		// https://en.wikipedia.org/wiki/Owl
		q("How many neck vertebrae do owls have?", ["7", "10", "14", "22"], "14", 2),
		// https://en.wikipedia.org/wiki/Sea_otter
		q("Sea otters are the heaviest members of which animal family?", ["Seal family", "Bear family", "Dog family", "Weasel family"], "Weasel family", 1),
	],
	games: [
		// https://en.wikipedia.org/wiki/Backgammon
		q("Backgammon descended from which 16th-century Anglo-Scottish tables game?", ["Trictrac", "Irish", "Senet", "Ludo"], "Irish", 2),
		// https://en.wikipedia.org/wiki/Battleship_(game)
		q("What was the name of the first commercial version of Battleship, published in 1931?", ["Barrage", "Torpedo", "Salvo", "Volley"], "Salvo", 2),
		// https://en.wikipedia.org/wiki/Game_Boy
		q("What did the Game Boy's development codename DMG stand for?", ["Digital Mobile Gaming", "Dual Mode Graphics", "Dot Matrix Game", "Direct Memory Gear"], "Dot Matrix Game", 2),
		// https://en.wikipedia.org/wiki/Mahjong
		q("In which country was mahjong developed in the 19th century?", ["Japan", "Korea", "China", "Vietnam"], "China", 1),
		// https://en.wikipedia.org/wiki/Pong
		q("Through which retailer was the home version of Pong sold exclusively in 1975?", ["Kmart", "Walmart", "Montgomery Ward", "Sears"], "Sears", 3),
		// https://en.wikipedia.org/wiki/Space_Invaders
		q("Space Invaders was created as a response to which 1976 Atari arcade game?", ["Pong", "Breakout", "Tempest", "Centipede"], "Breakout", 2),
		// https://en.wikipedia.org/wiki/Trivial_Pursuit
		q("In which city was Trivial Pursuit created in 1979?", ["Toronto", "Montreal", "Vancouver", "Ottawa"], "Montreal", 2),
		// https://en.wikipedia.org/wiki/Twister_(game)
		q("Which TV host played Twister with Eva Gabor on The Tonight Show in 1966?", ["Ed Sullivan", "Jack Paar", "Johnny Carson", "Merv Griffin"], "Johnny Carson", 1),
		// https://en.wikipedia.org/wiki/Uno_(card_game)
		q("What does the word \"Uno\" mean in Spanish and Italian?", ["Win", "One", "All", "Two"], "One", 1),
		// https://en.wikipedia.org/wiki/Backgammon
		q("Where was the doubling cube introduced to backgammon?", ["England", "France", "America", "Persia"], "America", 2),
		// https://en.wikipedia.org/wiki/Battleship_(game)
		q("What is Battleship called in Clubhouse Games for the Nintendo DS?", ["Sea Strike", "Fleet Hunt", "Naval Siege", "Grid Attack"], "Grid Attack", 3),
		// https://en.wikipedia.org/wiki/Game_Boy
		q("What was the name of the Japan-exclusive, backlit 1998 redesign of the Game Boy?", ["Game Boy Glow", "Game Boy Neon", "Game Boy Light", "Game Boy Bright"], "Game Boy Light", 2),
		// https://en.wikipedia.org/wiki/Mahjong
		q("Mahjong's original Chinese name, máquè, means which bird?", ["Crane", "Sparrow", "Swallow", "Magpie"], "Sparrow", 2),
		// https://en.wikipedia.org/wiki/Pong
		q("Into how many segments did Allan Alcorn divide Pong's paddle to vary the ball's angle?", ["Eight", "Four", "Six", "Ten"], "Eight", 3),
		// https://en.wikipedia.org/wiki/Space_Invaders
		q("What is the player's laser cannon called in Space Invaders?", ["Star Turret", "Laser Base", "Ion Tank", "Photon Post"], "Laser Base", 3),
		// https://en.wikipedia.org/wiki/Trivial_Pursuit
		q("Trivial Pursuit was first designed in 45 minutes on the back of what?", ["A cigarette carton", "A paper napkin", "A beer coaster", "A pizza box"], "A cigarette carton", 2),
		// https://en.wikipedia.org/wiki/Twister_(game)
		q("What was the game Twister called before Milton Bradley renamed it?", ["Pretzel", "Knots", "Tangle", "Contortion"], "Pretzel", 2),
		// https://en.wikipedia.org/wiki/Uno_(card_game)
		q("What was the profession of Robert Tezak, who bought the rights to Uno from its creator?", ["Funeral parlor owner", "Hardware store owner", "Insurance salesman", "Car dealership owner"], "Funeral parlor owner", 3),
		// https://en.wikipedia.org/wiki/Backgammon
		q("A famous epigram describes a game of tabula played by which Byzantine emperor?", ["Justinian", "Zeno", "Constantine", "Theodosius"], "Zeno", 3),
		// https://en.wikipedia.org/wiki/Battleship_(game)
		q("What was the 1973 spin-off of Battleship with a three-dimensional play area called?", ["Depth Charge", "Sonar Hunt", "Deep Dive", "Sub Search"], "Sub Search", 3),
		// https://en.wikipedia.org/wiki/Game_Boy
		q("Which company made the CPU Nintendo ultimately chose for the Game Boy?", ["Hitachi", "Sharp", "Motorola", "Ricoh"], "Sharp", 3),
		// https://en.wikipedia.org/wiki/Mahjong
		q("In standard mahjong, how many tiles does each player draw for their starting hand?", ["Ten", "Twelve", "Thirteen", "Nine"], "Thirteen", 2),
		// https://en.wikipedia.org/wiki/Space_Invaders
		q("Through which company's partnership was Space Invaders released overseas in 1978?", ["Midway Manufacturing", "Gottlieb", "Williams Electronics", "Exidy"], "Midway Manufacturing", 3),
		// https://en.wikipedia.org/wiki/Trivial_Pursuit
		q("In classic Trivial Pursuit, what color is the Geography category?", ["Green", "Yellow", "Blue", "Orange"], "Blue", 3),
		// https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
		q("In November 2026, Grand Theft Auto VI launched on PlayStation 5 and which other platform?", ["Nintendo Switch 2", "Xbox One", "PlayStation 4", "Xbox Series X/S"], "Xbox Series X/S", 1),
		// https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
		q("Roughly how many digital copies did Grand Theft Auto VI sell before its November 2026 launch?", ["12 million", "40 million", "8 million", "24 million"], "24 million", 2),
		// https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
		q("As of November 2026, what overall Metacritic score did Grand Theft Auto VI hold?", ["96", "94", "99", "97"], "99", 2),
		// https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
		q("Before its November 2026 launch, Grand Theft Auto VI passed which game as the most pre-ordered ever?", ["Starfield", "Elden Ring", "Hogwarts Legacy", "Cyberpunk 2077"], "Cyberpunk 2077", 2),
		// https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
		q("As of November 2026, Grand Theft Auto VI tied which 1998 game as Metacritic's highest-rated video game?", ["Metal Gear Solid", "Half-Life", "StarCraft", "Ocarina of Time"], "Ocarina of Time", 2),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Anthony_Hopkins
		q("For which 1991 film did Anthony Hopkins win Best Actor for playing Hannibal Lecter?", ["The Prince of Tides", "Cape Fear", "Misery", "The Silence of the Lambs"], "The Silence of the Lambs", 1),
		// https://en.wikipedia.org/wiki/Brad_Pitt
		q("In which Ridley Scott road film did Brad Pitt first gain recognition as a cowboy hitchhiker?", ["Black Rain", "White Squall", "Thelma & Louise", "Matchstick Men"], "Thelma & Louise", 2),
		// https://en.wikipedia.org/wiki/Dwayne_Johnson
		q("Which character does Dwayne Johnson voice in Disney's animated film Moana?", ["Tamatoa", "Tui", "Maui", "Pua"], "Maui", 1),
		// https://en.wikipedia.org/wiki/Emma_Watson
		q("Which character did Emma Watson play in the Harry Potter film series?", ["Luna Lovegood", "Hermione Granger", "Ginny Weasley", "Cho Chang"], "Hermione Granger", 1),
		// https://en.wikipedia.org/wiki/Hugh_Jackman
		q("Which character did Hugh Jackman play in the 2012 film Les Misérables?", ["Javert", "Jean Valjean", "Marius Pontmercy", "Thénardier"], "Jean Valjean", 2),
		// https://en.wikipedia.org/wiki/Jennifer_Lawrence
		q("For which 2012 film did Jennifer Lawrence win the Academy Award for Best Actress?", ["Zero Dark Thirty", "Silver Linings Playbook", "Beasts of the Southern Wild", "The Impossible"], "Silver Linings Playbook", 2),
		// https://en.wikipedia.org/wiki/Jodie_Foster
		q("For which 1976 Martin Scorsese film did Jodie Foster earn her first Oscar nomination?", ["Taxi Driver", "Mean Streets", "Raging Bull", "The King of Comedy"], "Taxi Driver", 1),
		// https://en.wikipedia.org/wiki/Lady_Gaga
		q("What was the title of Lady Gaga's 2014 jazz album with Tony Bennett?", ["Cheek to Cheek", "Moon River", "Night and Day", "Blue Skies"], "Cheek to Cheek", 2),
		// https://en.wikipedia.org/wiki/Tom_Cruise
		q("Which fictional agent does Tom Cruise play in the Mission: Impossible film series?", ["Jason Bourne", "Jack Ryan", "Ethan Hunt", "Harry Tasker"], "Ethan Hunt", 1),
		// https://en.wikipedia.org/wiki/Anthony_Hopkins
		q("Which actor invited Anthony Hopkins to join the Royal National Theatre in 1965?", ["John Gielgud", "Ralph Richardson", "Alec Guinness", "Laurence Olivier"], "Laurence Olivier", 2),
		// https://en.wikipedia.org/wiki/Brad_Pitt
		q("What production company did Brad Pitt co-found in 2001?", ["Appian Way", "Plan B Entertainment", "Smokehouse Pictures", "Pearl Street Films"], "Plan B Entertainment", 2),
		// https://en.wikipedia.org/wiki/Dwayne_Johnson
		q("Which Canadian football team briefly signed Dwayne Johnson before cutting him?", ["Toronto Argonauts", "BC Lions", "Edmonton Elks", "Calgary Stampeders"], "Calgary Stampeders", 2),
		// https://en.wikipedia.org/wiki/Emma_Watson
		q("Which character did Emma Watson play in the 2017 live-action Beauty and the Beast?", ["Ariel", "Aurora", "Belle", "Cinderella"], "Belle", 1),
		// https://en.wikipedia.org/wiki/Hugh_Jackman
		q("In which Broadway musical did Hugh Jackman win a 2004 Tony playing Peter Allen?", ["The Boy from Oz", "Jersey Boys", "Billy Elliot", "Spamalot"], "The Boy from Oz", 2),
		// https://en.wikipedia.org/wiki/Jennifer_Lawrence
		q("Which mutant did Jennifer Lawrence portray in the X-Men film series?", ["Rogue", "Storm", "Mystique", "Jean Grey"], "Mystique", 2),
		// https://en.wikipedia.org/wiki/Jodie_Foster
		q("Which Ivy League university did Jodie Foster attend, graduating magna cum laude in 1985?", ["Yale University", "Harvard University", "Princeton University", "Brown University"], "Yale University", 2),
		// https://en.wikipedia.org/wiki/Lady_Gaga
		q("Lady Gaga's screen debut was a background role in the music video for which AC/DC song?", ["\"Thunderstruck\"", "\"Back in Black\"", "\"Highway to Hell\"", "\"Stiff Upper Lip\""], "\"Stiff Upper Lip\"", 3),
		// https://en.wikipedia.org/wiki/Tom_Cruise
		q("Which 1986 Tom Cruise film earned him a reputation as a sex symbol?", ["Cocktail", "Top Gun", "Legend", "Days of Thunder"], "Top Gun", 1),
		// https://en.wikipedia.org/wiki/Anthony_Hopkins
		q("For which David Hare play did Anthony Hopkins win acclaim and an Olivier Award in 1985?", ["Pravda", "Plenty", "Skylight", "Racing Demon"], "Pravda", 3),
		// https://en.wikipedia.org/wiki/Brad_Pitt
		q("At which university did Brad Pitt study journalism before leaving for Los Angeles?", ["University of Oklahoma", "University of Kansas", "University of Arkansas", "University of Missouri"], "University of Missouri", 3),
		// https://en.wikipedia.org/wiki/Dwayne_Johnson
		q("Which character does Dwayne Johnson play in the Fast & Furious films?", ["Deckard Shaw", "Luke Hobbs", "Brian O'Conner", "Roman Pearce"], "Luke Hobbs", 2),
		// https://en.wikipedia.org/wiki/Emma_Watson
		q("From which US university did Emma Watson graduate in English literature in 2014?", ["Yale University", "Columbia University", "Brown University", "Harvard University"], "Brown University", 2),
		// https://en.wikipedia.org/wiki/Hugh_Jackman
		q("Under which immigration scheme did Hugh Jackman's English parents move to Australia in 1967?", ["Fairbridge Farm Scheme", "Big Brother Movement", "Ten Pound Poms", "Populate or Perish"], "Ten Pound Poms", 3),
		// https://en.wikipedia.org/wiki/Jennifer_Lawrence
		q("What production company did Jennifer Lawrence found in 2018?", ["Excellent Cadaver", "Pacific Standard", "Clubhouse Pictures", "Lucky Chap"], "Excellent Cadaver", 3),
		// https://en.wikipedia.org/wiki/Production_of_the_James_Bond_films
		q("In November 2026, which actor was revealed to have also auditioned for James Bond with Robert Pattinson?", ["Tom Holland", "Timothée Chalamet", "Idris Elba", "Nicholas Hoult"], "Nicholas Hoult", 2),
		// https://en.wikipedia.org/wiki/Robert_Pattinson
		q("In November 2026, which actor did Amazon MGM Studios announce as the seventh actor to play James Bond?", ["Robert Pattinson", "Nicholas Hoult", "Aaron Taylor-Johnson", "Callum Turner"], "Robert Pattinson", 1),
	],
	music: [
		// https://en.wikipedia.org/wiki/Ella_Fitzgerald
		q("Which nursery rhyme did Ella Fitzgerald record that helped boost her to national fame?", ["\"Hickory Dickory Dock\"", "\"Pop Goes the Weasel\"", "\"A-Tisket, A-Tasket\"", "\"London Bridge\""], "\"A-Tisket, A-Tasket\"", 1),
		// https://en.wikipedia.org/wiki/Fleetwood_Mac
		q("Who formed Fleetwood Mac in 1967 after leaving John Mayall & the Bluesbreakers?", ["Eric Clapton", "Aynsley Dunbar", "Peter Green", "Jeff Beck"], "Peter Green", 2),
		// https://en.wikipedia.org/wiki/Fr%C3%A9d%C3%A9ric_Chopin
		q("Which French writer had an often troubled relationship with Frédéric Chopin?", ["Colette", "Marguerite Duras", "Madame de Staël", "George Sand"], "George Sand", 2),
		// https://en.wikipedia.org/wiki/Giuseppe_Verdi
		q("Which Giuseppe Verdi opera from 1871 preceded his late masterpieces?", ["Nabucco", "Rigoletto", "Don Carlos", "Aida"], "Aida", 1),
		// https://en.wikipedia.org/wiki/Johnny_Cash
		q("Which 2005 biopic dramatized the life and career of Johnny Cash?", ["Coal Miner's Daughter", "Sweet Dreams", "Walk the Line", "Great Balls of Fire!"], "Walk the Line", 1),
		// https://en.wikipedia.org/wiki/Pink_Floyd
		q("What subject were Pink Floyd's Roger Waters and Nick Mason studying when they met in 1962?", ["Engineering", "Architecture", "Fine art", "Medicine"], "Architecture", 2),
		// https://en.wikipedia.org/wiki/Trumpet
		q("How many valves do modern trumpets generally have?", ["Two", "Three", "Five", "Six"], "Three", 1),
		// https://en.wikipedia.org/wiki/Blues
		q("Which war marked the blues' transition from acoustic to electric?", ["World War I", "The Korean War", "The Vietnam War", "World War II"], "World War II", 1),
		// https://en.wikipedia.org/wiki/Ella_Fitzgerald
		q("At which Harlem theater did Ella Fitzgerald make her debut at an Amateur Night in 1934?", ["Cotton Club", "Carnegie Hall", "Apollo Theater", "Radio City Music Hall"], "Apollo Theater", 1),
		// https://en.wikipedia.org/wiki/Fleetwood_Mac
		q("Which 1968 instrumental gave Fleetwood Mac a UK No. 1 single?", ["\"Apache\"", "\"Albatross\"", "\"Telstar\"", "\"Sleep Walk\""], "\"Albatross\"", 2),
		// https://en.wikipedia.org/wiki/Fr%C3%A9d%C3%A9ric_Chopin
		q("Which island did Frédéric Chopin visit in 1838–1839, during one of his most productive periods?", ["Mallorca", "Sicily", "Corsica", "Malta"], "Mallorca", 2),
		// https://en.wikipedia.org/wiki/Giuseppe_Verdi
		q("The chorus \"Va, pensiero\" comes from which early Verdi opera?", ["Ernani", "Attila", "Luisa Miller", "Nabucco"], "Nabucco", 2),
		// https://en.wikipedia.org/wiki/Johnny_Cash
		q("What was the name of Johnny Cash's backing band, known for its train-like guitar rhythms?", ["The Tennessee Three", "The Nashville Three", "The Memphis Five", "The Delta Four"], "The Tennessee Three", 2),
		// https://en.wikipedia.org/wiki/Pink_Floyd
		q("What was the name of the student sextet that evolved into Pink Floyd?", ["Sigma 6", "Delta 5", "Omega 7", "Alpha 4"], "Sigma 6", 3),
		// https://en.wikipedia.org/wiki/Trumpet
		q("What shape of bore does the cornet have, distinguishing it from the trumpet?", ["Conical", "Cylindrical", "Elliptical", "Hexagonal"], "Conical", 2),
		// https://en.wikipedia.org/wiki/Blues
		q("In what year was blues sheet music first published?", ["1908", "1892", "1921", "1935"], "1908", 2),
		// https://en.wikipedia.org/wiki/Ella_Fitzgerald
		q("Ella Fitzgerald took over which band when its leader died in 1939?", ["Count Basie Orchestra", "Cab Calloway Orchestra", "Benny Goodman Orchestra", "Chick Webb Orchestra"], "Chick Webb Orchestra", 2),
		// https://en.wikipedia.org/wiki/60th_Annual_Country_Music_Association_Awards
		q("Who hosted the 60th Annual CMA Awards in November 2026?", ["Miranda Lambert", "Carrie Underwood", "Kelsea Ballerini", "Lainey Wilson"], "Lainey Wilson", 1),
		// https://en.wikipedia.org/wiki/60th_Annual_Country_Music_Association_Awards
		q("Which artist won the most awards at the November 2026 CMA Awards, setting a record with six?", ["Ella Langley", "Miranda Lambert", "Lainey Wilson", "Kacey Musgraves"], "Ella Langley", 1),
		// https://en.wikipedia.org/wiki/60th_Annual_Country_Music_Association_Awards
		q("At the November 2026 CMA Awards, which duo received the Willie Nelson Lifetime Achievement Award?", ["Montgomery Gentry", "The Judds", "Brooks & Dunn", "Big & Rich"], "Brooks & Dunn", 2),
		// https://en.wikipedia.org/wiki/60th_Annual_Country_Music_Association_Awards
		q("At which Nashville venue were the 60th CMA Awards held in November 2026?", ["Ryman Auditorium", "Nissan Stadium", "Grand Ole Opry House", "Bridgestone Arena"], "Bridgestone Arena", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/Ernest_Hemingway
		q("In which year was Ernest Hemingway awarded the Nobel Prize in Literature?", ["1949", "1958", "1962", "1954"], "1954", 1),
		// https://en.wikipedia.org/wiki/George_Orwell
		q("Which allegorical novella did George Orwell publish in 1945?", ["Brave New World", "Lord of the Flies", "Animal Farm", "The Time Machine"], "Animal Farm", 1),
		// https://en.wikipedia.org/wiki/Gulliver%27s_Travels
		q("In Gulliver's Travels, a dispute over how to crack which food divides Lilliput?", ["A loaf", "A sausage", "A cheese", "An egg"], "An egg", 2),
		// https://en.wikipedia.org/wiki/Leo_Tolstoy
		q("Leo Tolstoy's Sevastopol Sketches were based on his experiences in which war?", ["Russo-Japanese War", "Franco-Prussian War", "Napoleonic Wars", "Crimean War"], "Crimean War", 1),
		// https://en.wikipedia.org/wiki/Mark_Twain
		q("What was Mark Twain's real name?", ["Samuel Lawrence Clements", "Charles Langdon Clemens", "William Langhorne Carter", "Samuel Langhorne Clemens"], "Samuel Langhorne Clemens", 1),
		// https://en.wikipedia.org/wiki/Robinson_Crusoe
		q("In Robinson Crusoe, pirates from which place capture Crusoe's ship and enslave him?", ["Tunis", "Salé", "Algiers", "Tripoli"], "Salé", 3),
		// https://en.wikipedia.org/wiki/The_Chronicles_of_Narnia
		q("Who was the original illustrator of The Chronicles of Narnia?", ["E. H. Shepard", "Pauline Baynes", "Quentin Blake", "Arthur Rackham"], "Pauline Baynes", 2),
		// https://en.wikipedia.org/wiki/The_Count_of_Monte_Cristo
		q("In The Count of Monte Cristo, in which prison is Edmond Dantès held?", ["The Bastille", "Château d'If", "The Conciergerie", "Château de Vincennes"], "Château d'If", 2),
		// https://en.wikipedia.org/wiki/Ernest_Hemingway
		q("What was Ernest Hemingway's debut novel, published in 1926?", ["The Sun Also Rises", "Tender Is the Night", "This Side of Paradise", "Look Homeward, Angel"], "The Sun Also Rises", 2),
		// https://en.wikipedia.org/wiki/George_Orwell
		q("What was the real name of the writer known as George Orwell?", ["Edward James Blake", "Arthur Henry Bell", "Eric John Brown", "Eric Arthur Blair"], "Eric Arthur Blair", 1),
		// https://en.wikipedia.org/wiki/Gulliver%27s_Travels
		q("In Gulliver's Travels, Gulliver steals the naval fleet of which rival nation of Lilliput?", ["Ruritania", "Erewhon", "Freedonia", "Blefuscu"], "Blefuscu", 3),
		// https://en.wikipedia.org/wiki/Leo_Tolstoy
		q("On which family estate was Leo Tolstoy born?", ["Spasskoye-Lutovinovo", "Yasnaya Polyana", "Mikhailovskoye", "Boldino"], "Yasnaya Polyana", 2),
		// https://en.wikipedia.org/wiki/Mark_Twain
		q("Mark Twain predicted his death would coincide with the return of which comet?", ["Hale-Bopp", "Halley's Comet", "Encke's Comet", "Swift–Tuttle"], "Halley's Comet", 1),
		// https://en.wikipedia.org/wiki/The_Chronicles_of_Narnia
		q("For which Narnia book was C. S. Lewis awarded the 1956 Carnegie Medal?", ["Prince Caspian", "The Silver Chair", "The Horse and His Boy", "The Last Battle"], "The Last Battle", 2),
		// https://en.wikipedia.org/wiki/The_Count_of_Monte_Cristo
		q("In The Count of Monte Cristo, which fellow prisoner educates Edmond Dantès?", ["Abbé Sieyès", "Abbé Faria", "Abbé Grégoire", "Abbé Prévost"], "Abbé Faria", 2),
		// https://en.wikipedia.org/wiki/Ernest_Hemingway
		q("Ernest Hemingway was a foreign correspondent in Paris for which newspaper?", ["Chicago Tribune", "Boston Globe", "Toronto Star", "New York Herald"], "Toronto Star", 2),
		// https://en.wikipedia.org/wiki/George_Orwell
		q("George Orwell's Homage to Catalonia recounts his time soldiering in which war?", ["Spanish Civil War", "Russian Civil War", "Greek Civil War", "Irish Civil War"], "Spanish Civil War", 2),
		// https://en.wikipedia.org/wiki/2026_Booker_Prize
		q("Who won the 2026 Booker Prize, announced in November 2026?", ["Douglas Stuart", "Marlon James", "Elizabeth Strout", "M. John Harrison"], "M. John Harrison", 1),
		// https://en.wikipedia.org/wiki/2026_Booker_Prize
		q("Which novel won the 2026 Booker Prize in November 2026?", ["The Things We Never Say", "The End of Everything", "The Disappearers", "John of John"], "The End of Everything", 1),
		// https://en.wikipedia.org/wiki/2026_Booker_Prize
		q("Which independent publisher won its first Booker Prize in November 2026?", ["Fitzcarraldo Editions", "Granta", "Serpent's Tail", "4th Estate"], "Serpent's Tail", 2),
		// https://en.wikipedia.org/wiki/2026_Booker_Prize
		q("The 2026 Booker Prize winner, named in November 2026, was the first winner from which genre?", ["Science fiction", "Crime fiction", "Historical fiction", "Romance"], "Science fiction", 2),
		// https://en.wikipedia.org/wiki/Baillie_Gifford_Prize
		q("Who won the 2026 Baillie Gifford Prize for Non-Fiction?", ["Edmund Richardson", "Nicholas Boggs", "Helen Garner", "Tiffany Jenkins"], "Edmund Richardson", 1),
		// https://en.wikipedia.org/wiki/Baillie_Gifford_Prize
		q("Which book won Edmund Richardson the 2026 Baillie Gifford Prize?", ["Alexander: God, King, Man", "Caesar: Life of a Colossus", "Hannibal: Rome's Greatest Foe", "Cleopatra: Queen, Lover, Legend"], "Alexander: God, King, Man", 2),
		// https://en.wikipedia.org/wiki/Giller_Prize
		q("Who won the 2026 Giller Prize, Canada's top fiction award?", ["Tara Gereaux", "Nicholas Herring", "Ian Williams", "Rupert McNally"], "Nicholas Herring", 1),
		// https://en.wikipedia.org/wiki/Giller_Prize
		q("Which novel won the 2026 Giller Prize in November 2026?", ["Wild People Quiet", "Your Breath in Charcoal", "Pick a Colour", "The Sleeping Car Porter"], "Your Breath in Charcoal", 2),
		// https://en.wikipedia.org/wiki/National_Book_Award_for_Fiction
		q("Who won the 2026 National Book Award for Fiction in November 2026?", ["Edwidge Danticat", "Jesmyn Ward", "Rachel Kushner", "Hannah Lillith Assadi"], "Hannah Lillith Assadi", 1),
		// https://en.wikipedia.org/wiki/Paradiso_17
		q("Which novel won the 2026 National Book Award for Fiction?", ["Sonora", "Paradiso 17", "The Stars Are Not Yet Bells", "Palaver"], "Paradiso 17", 1),
		// https://en.wikipedia.org/wiki/Word_of_the_year
		q("In November 2026, what word did Cambridge Dictionary name as its word of the year?", ["Mogging", "Maxxing", "Parasocial", "Human"], "Human", 1),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Atacama_Desert
		q("Besides the Andes, which mountain chain encloses the Atacama's most arid region?", ["Cordillera Blanca", "Chilean Coast Range", "Sierra Madre", "Serranía de Baudó"], "Chilean Coast Range", 2),
		// https://en.wikipedia.org/wiki/Caspian_Sea
		q("The Caspian Sea's salinity is about what fraction of average seawater's?", ["About a half", "About a tenth", "About a third", "About two-thirds"], "About a third", 2),
		// https://en.wikipedia.org/wiki/Dead_Sea
		q("Which country borders the Dead Sea to the east?", ["Egypt", "Syria", "Lebanon", "Jordan"], "Jordan", 1),
		// https://en.wikipedia.org/wiki/Greenland
		q("What is the capital of Greenland?", ["Nuuk", "Ilulissat", "Sisimiut", "Qaqortoq"], "Nuuk", 1),
		// https://en.wikipedia.org/wiki/Lake_Victoria
		q("Which river is the only outflow of Lake Victoria?", ["Congo", "Zambezi", "Niger", "Nile"], "Nile", 1),
		// https://en.wikipedia.org/wiki/Rocky_Mountains
		q("Which U.S. state contains most of the highest summits of the Rocky Mountains?", ["Montana", "Wyoming", "Utah", "Colorado"], "Colorado", 1),
		// https://en.wikipedia.org/wiki/Strait_of_Gibraltar
		q("Gibraltar's name derives from an Arabic phrase honoring which commander?", ["Tariq ibn Ziyad", "Musa ibn Nusayr", "Abd al-Rahman I", "Uqba ibn Nafi"], "Tariq ibn Ziyad", 2),
		// https://en.wikipedia.org/wiki/Volga
		q("In which hills does the Volga River rise?", ["Valdai Hills", "Smolensk Upland", "Timan Ridge", "Ural Foothills"], "Valdai Hills", 2),
		// https://en.wikipedia.org/wiki/Atacama_Desert
		q("Which abandoned Atacama mining town hosts a University of Antofagasta research station?", ["Humberstone", "Yungay", "Chuquicamata", "Tocopilla"], "Yungay", 3),
		// https://en.wikipedia.org/wiki/Caspian_Sea
		q("What is the Caspian Sea called in Iran?", ["Kerman Sea", "Mazandaran Sea", "Khorasan Sea", "Khuzestan Sea"], "Mazandaran Sea", 2),
		// https://en.wikipedia.org/wiki/Dead_Sea
		q("In Arabic, the Dead Sea is also called the Sea of which biblical figure, Abraham's nephew?", ["Lot", "Noah", "Jonah", "Moses"], "Lot", 2),
		// https://en.wikipedia.org/wiki/Greenland
		q("Which Norse figure named Greenland, hoping the pleasant name would attract settlers?", ["Erik the Red", "Leif Erikson", "Harald Fairhair", "Ingólfr Arnarson"], "Erik the Red", 1),
		// https://en.wikipedia.org/wiki/Lake_Victoria
		q("Which British explorer renamed Lake Victoria after the Queen in 1858?", ["David Livingstone", "John Hanning Speke", "Henry Morton Stanley", "Mungo Park"], "John Hanning Speke", 2),
		// https://en.wikipedia.org/wiki/Rocky_Mountains
		q("What is the highest peak in the Canadian Rockies?", ["Mount Assiniboine", "Mount Robson", "Mount Temple", "Mount Columbia"], "Mount Robson", 2),
		// https://en.wikipedia.org/wiki/Strait_of_Gibraltar
		q("The mountains flanking the Strait of Gibraltar were known in antiquity as the Pillars of whom?", ["Atlas", "Poseidon", "Hercules", "Perseus"], "Hercules", 2),
		// https://en.wikipedia.org/wiki/Volga
		q("What does the Proto-Slavic word behind the name Volga mean?", ["Broad, wide", "Long road", "Wetness, moisture", "Mother, nurse"], "Wetness, moisture", 2),
		// https://en.wikipedia.org/wiki/Caspian_Sea
		q("The traditional Arabic name for the Caspian Sea meant \"sea of\" which people?", ["The Scythians", "The Persians", "The Khazars", "The Medes"], "The Khazars", 3),
	],
};
