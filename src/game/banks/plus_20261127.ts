import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Weekly batch (job trivia-weekly-20261127, Fri Nov 27 2026, America/Chicago).
 * Why: grow the thinnest topics (games, celebrity) and the other non-local topics, with a real share of
 * diff-3 deep cuts (the last batch was 10% diff 3 against the deck's 22%), plus settled current events
 * from 27 Oct to 27 Nov 2026, mostly news since 20 Nov (time-anchored in the prompt). Geography and arts
 * are near saturation and kept small. Quota state at the start: 17,505 cards, flags none; math is capped.
 * Claude Fable 5.2 candidates written only from public Wikipedia text (fetched 27 Nov 2026). The free
 * cross-check cannot run (trial over, no keys), so every candidate was source-checked with Claude and
 * then re-read against the article text in a second pass (distractors and overstatement included).
 * Fact-deduped against all of main. No math (capped).
 * Evidence: /workspace/kl-trivia-20261127-logs/.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261127: Partial<Record<PlusCat, TriviaQ[]>> = {
	sports: [
		// https://en.wikipedia.org/wiki/Biathlon
		q("Biathlon combines cross-country skiing with which other discipline?", ["Ski jumping", "Speed skating", "Archery", "Rifle shooting"], "Rifle shooting", 1),
		// https://en.wikipedia.org/wiki/Bobsleigh
		q("What force alone powers a bobsleigh down the track?", ["Magnetism", "Gravity", "Wind power", "Jet thrust"], "Gravity", 1),
		// https://en.wikipedia.org/wiki/Decathlon
		q("Which combined event do female athletes typically contest instead of the decathlon?", ["Triathlon", "Biathlon", "Octathlon", "Heptathlon"], "Heptathlon", 1),
		// https://en.wikipedia.org/wiki/Pickleball
		q("In which US state was pickleball invented in 1965?", ["Oregon", "California", "Florida", "Washington"], "Washington", 1),
		// https://en.wikipedia.org/wiki/Biathlon
		q("Which Norse god, revered as both ski god and hunting god, is linked to biathlon's roots?", ["Tyr", "Baldr", "Heimdall", "Ullr"], "Ullr", 2),
		// https://en.wikipedia.org/wiki/Bobsleigh
		q("Which French town hosted the first Winter Games in 1924, featuring four-man bobsleigh?", ["Chamonix", "Grenoble", "Albertville", "Megève"], "Chamonix", 2),
		// https://en.wikipedia.org/wiki/Decathlon
		q("Which athlete was called the world's greatest after winning the 1912 Olympic decathlon?", ["Bob Mathias", "Jesse Owens", "Jim Thorpe", "Rafer Johnson"], "Jim Thorpe", 2),
		// https://en.wikipedia.org/wiki/Pickleball
		q("Pickleball is played on a doubles court borrowed from which other racket sport?", ["Squash", "Racquetball", "Badminton", "Padel"], "Badminton", 2),
		// https://en.wikipedia.org/wiki/Pole_vault
		q("In what year did the pole vault become a full Olympic medal event for women?", ["1984", "1992", "2008", "2000"], "2000", 2),
		// https://en.wikipedia.org/wiki/Ski_jumping
		q("In what year was the first women's ski jumping event held at the Olympics?", ["2014", "2002", "2006", "2010"], "2014", 2),
		// https://en.wikipedia.org/wiki/Speed_skating
		q("In what year was speed skating's international federation founded, the first for any winter sport?", ["1875", "1908", "1924", "1892"], "1892", 2),
		// https://en.wikipedia.org/wiki/Biathlon
		q("What is the Norwegian word for biathlon, literally meaning \"ski shooting\"?", ["Langrenn", "Skihopping", "Skiskyting", "Skøyteløp"], "Skiskyting", 3),
		// https://en.wikipedia.org/wiki/Bobsleigh
		q("Which St. Moritz hotelier's wintering English guests gave rise to bobsleigh as a sport?", ["César Ritz", "Caspar Badrutt", "Alexander Seiler", "Franz Josef Bucher"], "Caspar Badrutt", 3),
		// https://en.wikipedia.org/wiki/Decathlon
		q("Which combat sport was one of the five disciplines of the ancient Greek pentathlon?", ["Wrestling", "Boxing", "Pankration", "Fencing"], "Wrestling", 3),
		// https://en.wikipedia.org/wiki/Pickleball
		q("At which future congressman's summer home was pickleball created in 1965?", ["Tom Foley", "Henry Jackson", "Joel Pritchard", "Warren Magnuson"], "Joel Pritchard", 3),
		// https://en.wikipedia.org/wiki/2025_Africa_Cup_of_Nations_final
		q("In November 2026, which nation did CAS reinstate as winners of the 2025 Africa Cup of Nations?", ["Morocco", "Nigeria", "Egypt", "Senegal"], "Senegal", 1),
		// https://en.wikipedia.org/wiki/2025_Africa_Cup_of_Nations_final
		q("In November 2026, CAS based its 2025 Africa Cup of Nations final ruling on which legal doctrine?", ["Field of play", "Strict liability", "Sporting merit", "Force majeure"], "Field of play", 3),
		// https://en.wikipedia.org/wiki/2026_ATP_Finals
		q("Which player lost the singles final of the 2026 ATP Finals in November 2026?", ["Jannik Sinner", "Alexander Zverev", "Daniil Medvedev", "Taylor Fritz"], "Alexander Zverev", 2),
		// https://en.wikipedia.org/wiki/2026_ATP_Finals
		q("Which pair won the doubles title at the 2026 ATP Finals in November 2026?", ["Arévalo / Pavić", "Granollers / Zeballos", "Arribagé / Olivetti", "Heliövaara / Patten"], "Arribagé / Olivetti", 3),
		// https://en.wikipedia.org/wiki/2026_ATP_Finals
		q("Which Italian city hosted the 2026 ATP Finals in November 2026?", ["Milan", "Rome", "Turin", "Bologna"], "Turin", 1),
		// https://en.wikipedia.org/wiki/2026_Copa_Sudamericana_final
		q("In November 2026, which club won the Copa Sudamericana final?", ["Atlético Mineiro", "River Plate", "Lanús", "Boca Juniors"], "Boca Juniors", 1),
		// https://en.wikipedia.org/wiki/2026_Copa_Sudamericana_final
		q("Which city hosted the Copa Sudamericana final in November 2026?", ["Asunción", "Barranquilla", "Montevideo", "Lima"], "Barranquilla", 2),
		// https://en.wikipedia.org/wiki/2026_Las_Vegas_Grand_Prix
		q("At the November 2026 Las Vegas Grand Prix, which driver topped qualifying but lost pole to a grid penalty?", ["George Russell", "Charles Leclerc", "Lando Norris", "Kimi Antonelli"], "Kimi Antonelli", 2),
		// https://en.wikipedia.org/wiki/2026_Las_Vegas_Grand_Prix
		q("At the November 2026 Las Vegas Grand Prix, which driver reached the podium after starting 17th?", ["Lewis Hamilton", "Charles Leclerc", "Oscar Piastri", "George Russell"], "Oscar Piastri", 2),
		// https://en.wikipedia.org/wiki/2026_NWSL_Championship
		q("In November 2026, which team won its first NWSL Championship?", ["Washington Spirit", "Portland Thorns FC", "Gotham FC", "Kansas City Current"], "Kansas City Current", 1),
		// https://en.wikipedia.org/wiki/2026_NWSL_Championship
		q("Who was named Most Valuable Player of the November 2026 NWSL Championship?", ["Temwa Chawinga", "Trinity Rodman", "Vanessa DiBernardo", "Croix Bethune"], "Vanessa DiBernardo", 2),
		// https://en.wikipedia.org/wiki/2026_NWSL_Championship
		q("Which stadium hosted the November 2026 NWSL Championship?", ["Audi Field", "CPKC Stadium", "Providence Park", "Lumen Field"], "Audi Field", 2),
		// https://en.wikipedia.org/wiki/2031_FIFA_Women%27s_World_Cup
		q("In November 2026, FIFA approved which Caribbean nation as a 2031 Women's World Cup co-host?", ["Cuba", "Jamaica", "Haiti", "Barbados"], "Jamaica", 1),
		// https://en.wikipedia.org/wiki/2031_FIFA_Women%27s_World_Cup
		q("In which city did the FIFA Congress award the 2031 Women's World Cup hosting rights in November 2026?", ["Zürich", "Geneva", "Lausanne", "Paris"], "Zürich", 2),
		// https://en.wikipedia.org/wiki/2035_FIFA_Women%27s_World_Cup
		q("As of November 2026, which nation joins England, Scotland and Wales as 2035 Women's World Cup hosts?", ["Republic of Ireland", "Netherlands", "Northern Ireland", "Belgium"], "Northern Ireland", 1),
		// https://en.wikipedia.org/wiki/Marc_M%C3%A1rquez
		q("As of November 2026, how many MotoGP-class world titles had Marc Márquez won?", ["Eight", "Six", "Seven", "Nine"], "Eight", 1),
		// https://en.wikipedia.org/wiki/Marc_M%C3%A1rquez
		q("Marc Márquez won the 2026 MotoGP championship riding for which manufacturer?", ["Honda", "Ducati", "Yamaha", "Aprilia"], "Ducati", 1),
		// https://en.wikipedia.org/wiki/2026_ATP_Finals
		q("In November 2026, Carlos Alcaraz beat Alexander Zverev in the final of which season-ending tennis event?", ["Davis Cup", "Laver Cup", "ATP Finals", "United Cup"], "ATP Finals", 1),
		// https://en.wikipedia.org/wiki/2026_Las_Vegas_Grand_Prix
		q("Max Verstappen won which Formula One race from pole position on November 21, 2026?", ["Mexico City Grand Prix", "São Paulo Grand Prix", "Singapore Grand Prix", "Las Vegas Grand Prix"], "Las Vegas Grand Prix", 2),
	],
	political: [
		// https://en.wikipedia.org/wiki/Brown_v._Board_of_Education
		q("What doctrine of racial segregation did Brown v. Board of Education reject?", ["Clear and present danger", "Popular sovereignty", "Separate but equal", "Manifest destiny"], "Separate but equal", 1),
		// https://en.wikipedia.org/wiki/G7
		q("Which country was expelled from the G8 in 2014, returning the group to the G7?", ["China", "Russia", "India", "Brazil"], "Russia", 1),
		// https://en.wikipedia.org/wiki/Geneva_Conventions
		q("Which war's inhumanities prompted the adoption of the four Geneva Conventions of 1949?", ["World War I", "The Korean War", "The Crimean War", "World War II"], "World War II", 1),
		// https://en.wikipedia.org/wiki/Gerrymandering
		q("In which US state did an 1812 redistricting bill give gerrymandering its name?", ["Virginia", "Pennsylvania", "New York", "Massachusetts"], "Massachusetts", 1),
		// https://en.wikipedia.org/wiki/Impeachment_in_the_United_States
		q("Under the US Constitution, which body holds the sole power to impeach federal officials?", ["The Senate", "The Supreme Court", "The Electoral College", "The House of Representatives"], "The House of Representatives", 1),
		// https://en.wikipedia.org/wiki/Brown_v._Board_of_Education
		q("Which 1896 Supreme Court decision did Brown v. Board of Education partially overrule?", ["Dred Scott v. Sandford", "Lochner v. New York", "Plessy v. Ferguson", "Korematsu v. United States"], "Plessy v. Ferguson", 2),
		// https://en.wikipedia.org/wiki/G7
		q("Which country joined the Group of Five at the 1975 summit to form the Group of Six?", ["Spain", "Belgium", "Italy", "Australia"], "Italy", 2),
		// https://en.wikipedia.org/wiki/Geneva_Conventions
		q("Which Swiss relief activist began the movement that led to the 1864 Geneva Convention?", ["Henry Dunant", "Alfred Escher", "Johann Pestalozzi", "Louis Agassiz"], "Henry Dunant", 2),
		// https://en.wikipedia.org/wiki/Gerrymandering
		q("What national office did Elbridge Gerry, namesake of gerrymandering, hold from 1813?", ["Secretary of State", "Chief Justice", "Speaker of the House", "Vice President"], "Vice President", 2),
		// https://en.wikipedia.org/wiki/Impeachment_in_the_United_States
		q("What share of members present must concur to convict in a US impeachment trial?", ["Three-fifths", "Two-thirds", "Three-quarters", "One-half"], "Two-thirds", 2),
		// https://en.wikipedia.org/wiki/Interpol
		q("In which city was the organization that became Interpol founded in 1923?", ["Geneva", "Vienna", "Brussels", "Prague"], "Vienna", 2),
		// https://en.wikipedia.org/wiki/Marbury_v._Madison
		q("Which Chief Justice wrote the Supreme Court's opinion in Marbury v. Madison?", ["Roger Taney", "Joseph Story", "Oliver Ellsworth", "John Marshall"], "John Marshall", 2),
		// https://en.wikipedia.org/wiki/The_Federalist_Papers
		q("Which author of The Federalist Papers fell ill after writing four early essays?", ["James Madison", "John Jay", "Alexander Hamilton", "Gouverneur Morris"], "John Jay", 2),
		// https://en.wikipedia.org/wiki/Brown_v._Board_of_Education
		q("Which senator created the \"massive resistance\" plan opposing Brown v. Board of Education?", ["Strom Thurmond", "Harry F. Byrd", "James Eastland", "Richard Russell"], "Harry F. Byrd", 3),
		// https://en.wikipedia.org/wiki/G7
		q("What nickname did the G7's four-nation 1973 forerunner earn from its White House meeting room?", ["Cabinet Group", "Library Group", "Garden Group", "Treaty Group"], "Library Group", 3),
		// https://en.wikipedia.org/wiki/Geneva_Conventions
		q("What 1862 book by Henry Dunant detailed the horrors of war he had witnessed in Italy?", ["The Wounded of Magenta", "A Memory of Solferino", "Letters from Lombardy", "A Winter in Crimea"], "A Memory of Solferino", 3),
		// https://en.wikipedia.org/wiki/Gerrymandering
		q("Which artist most likely drew the 1812 cartoon that popularized the word gerrymander?", ["Thomas Nast", "Paul Revere", "James Gillray", "Elkanah Tisdale"], "Elkanah Tisdale", 3),
		// https://en.wikipedia.org/wiki/Impeachment_in_the_United_States
		q("What Senate vote can bar an official convicted on impeachment from future federal office?", ["Two-thirds majority", "Simple majority", "Three-fifths majority", "Unanimous consent"], "Simple majority", 3),
		// https://en.wikipedia.org/wiki/Brown_v._Board_of_Education
		q("Which NAACP chief counsel represented the Browns in Brown v. Board of Education?", ["Medgar Evers", "Roy Wilkins", "Thurgood Marshall", "Ralph Abernathy"], "Thurgood Marshall", 2),
		// https://en.wikipedia.org/wiki/Matthew_Wale
		q("In November 2026, Matthew Wale said Solomon Islands would not renew its security pact with which country?", ["Japan", "India", "China", "Taiwan"], "China", 1),
		// https://en.wikipedia.org/wiki/Matthew_Wale
		q("Which Australian job sectors did the November 2026 Solomon Islands security pact open to Solomon Islanders?", ["Mining and construction", "Farming and fisheries", "Tourism and hospitality", "Childcare and aged care"], "Childcare and aged care", 2),
		// https://en.wikipedia.org/wiki/Matthew_Wale
		q("In November 2026, Solomon Islands prime minister Matthew Wale signed a new security pact with which nation?", ["New Zealand", "Japan", "Fiji", "Australia"], "Australia", 1),
		// https://en.wikipedia.org/wiki/Pablo_Hern%C3%A1ndez_de_Cos
		q("In November 2026, the European Council nominated which Spanish economist to lead the European Central Bank?", ["José Manuel González-Páramo", "Luis de Guindos", "Pablo Hernández de Cos", "José Manuel Campa"], "Pablo Hernández de Cos", 2),
	],
	food: [
		// https://en.wikipedia.org/wiki/Balsamic_vinegar
		q("Balsamic vinegar is made from the must of which fruit?", ["Apple", "Fig", "Grape", "Pomegranate"], "Grape", 1),
		// https://en.wikipedia.org/wiki/Feta
		q("Which animal's milk is the main ingredient of traditional feta?", ["Cow", "Buffalo", "Sheep", "Camel"], "Sheep", 1),
		// https://en.wikipedia.org/wiki/Hamburger
		q("What side dish are hamburgers most commonly served with?", ["Onion rings", "Coleslaw", "Baked beans", "French fries"], "French fries", 1),
		// https://en.wikipedia.org/wiki/Ketchup
		q("Which sour liquid joins tomatoes and sugar as a main ingredient of tomato ketchup?", ["Lemon juice", "Lime juice", "Buttermilk", "Vinegar"], "Vinegar", 1),
		// https://en.wikipedia.org/wiki/Mayonnaise
		q("Mayonnaise is an emulsion of oil, an acid and which part of an egg?", ["Yolk", "White", "Shell", "Membrane"], "Yolk", 1),
		// https://en.wikipedia.org/wiki/Miso
		q("Which beans are fermented with salt and kōji to make miso?", ["Mung beans", "Fava beans", "Soybeans", "Kidney beans"], "Soybeans", 1),
		// https://en.wikipedia.org/wiki/Balsamic_vinegar
		q("The word \"balsamic\" denotes aromatic qualities and what other supposed properties?", ["Preserving", "Healing", "Intoxicating", "Cleansing"], "Healing", 2),
		// https://en.wikipedia.org/wiki/Feta
		q("In what liquid are blocks of feta aged?", ["Olive oil", "Wine", "Brine", "Vinegar"], "Brine", 2),
		// https://en.wikipedia.org/wiki/Hamburger
		q("Which city's 1904 World's Fair brought hamburgers national recognition in the U.S.?", ["Chicago", "Philadelphia", "St. Louis", "Buffalo"], "St. Louis", 2),
		// https://en.wikipedia.org/wiki/Ketchup
		q("From the 1600s, what was the primary ingredient of ketchup in the United Kingdom?", ["Turnips", "Beetroot", "Carrots", "Mushrooms"], "Mushrooms", 2),
		// https://en.wikipedia.org/wiki/Macaron
		q("What body-part name is given to the ruffled circumference of a baked macaron?", ["Lip", "Foot", "Shoulder", "Ear"], "Foot", 2),
		// https://en.wikipedia.org/wiki/Mayonnaise
		q("Mahón, the port most often credited as the birthplace of mayonnaise, is on which Spanish island?", ["Mallorca", "Ibiza", "Menorca", "Tenerife"], "Menorca", 2),
		// https://en.wikipedia.org/wiki/Miso
		q("What color does the name of the miso variety shiromiso refer to?", ["Red", "Black", "Yellow", "White"], "White", 2),
		// https://en.wikipedia.org/wiki/Sourdough
		q("Bakers of which nationality brought sourdough techniques to Northern California in the Gold Rush?", ["French", "German", "Italian", "Polish"], "French", 2),
		// https://en.wikipedia.org/wiki/Tabasco_sauce
		q("Which family company makes Tabasco sauce?", ["Baumer Foods", "Bruce Foods", "McCormick & Company", "McIlhenny Company"], "McIlhenny Company", 2),
		// https://en.wikipedia.org/wiki/Balsamic_vinegar
		q("Which grape variety is pressed and reduced to make true balsamic vinegar?", ["Aglianico", "Nebbiolo", "Trebbiano", "Barbera"], "Trebbiano", 3),
		// https://en.wikipedia.org/wiki/Feta
		q("Besides mainland Greece, which island prefecture may produce cheese under the protected name feta?", ["Crete", "Lesbos", "Rhodes", "Corfu"], "Lesbos", 3),
		// https://en.wikipedia.org/wiki/Hamburger
		q("Who wrote the 1758 cookbook containing a recipe for \"Hamburgh sausage\" on toasted bread?", ["Isabella Beeton", "Eliza Acton", "Hannah Glasse", "Elizabeth Raffald"], "Hannah Glasse", 3),
		// https://en.wikipedia.org/wiki/Ketchup
		q("Who published the first known tomato ketchup recipe in 1812?", ["Jonas Yerkes", "Henry Heinz", "James Mease", "Sylvester Graham"], "James Mease", 3),
		// https://en.wikipedia.org/wiki/Macaron
		q("In which French city did the nuns known as the \"Macaron Sisters\" bake and sell macarons?", ["Reims", "Nancy", "Dijon", "Rouen"], "Nancy", 3),
	],
	arts: [
		// https://en.wikipedia.org/wiki/American_Gothic
		q("What farm tool does the man hold in the painting American Gothic?", ["Scythe", "Shovel", "Pitchfork", "Rake"], "Pitchfork", 1),
		// https://en.wikipedia.org/wiki/Las_Meninas
		q("Which Madrid museum houses Las Meninas?", ["Museo del Prado", "Museo Reina Sofía", "Museo Sorolla", "Museo Thyssen"], "Museo del Prado", 1),
		// https://en.wikipedia.org/wiki/American_Gothic
		q("What was the profession of Byron McKeeby, who modeled for the farmer in American Gothic?", ["Dentist", "Pharmacist", "Banker", "Preacher"], "Dentist", 2),
		// https://en.wikipedia.org/wiki/Las_Meninas
		q("What does the Spanish title Las Meninas mean in English?", ["The Ladies-in-waiting", "The Little Princesses", "The Royal Daughters", "The Court Dwarfs"], "The Ladies-in-waiting", 2),
		// https://en.wikipedia.org/wiki/Nighthawks_(Hopper)
		q("A short story by which author is thought to have inspired the painting Nighthawks?", ["F. Scott Fitzgerald", "Raymond Chandler", "John Steinbeck", "Ernest Hemingway"], "Ernest Hemingway", 2),
		// https://en.wikipedia.org/wiki/The_Night_Watch
		q("What dead animal hangs from the belt of the young girl in The Night Watch?", ["Chicken", "Rabbit", "Pigeon", "Fish"], "Chicken", 2),
		// https://en.wikipedia.org/wiki/American_Gothic
		q("In which Iowa town does the house that inspired American Gothic stand?", ["Pella", "Eldon", "Decorah", "Ames"], "Eldon", 3),
		// https://en.wikipedia.org/wiki/Las_Meninas
		q("Which five-year-old infanta stands at the center of her entourage in Las Meninas?", ["Maria Theresa", "Isabella Clara", "Catherine Michaela", "Margaret Theresa"], "Margaret Theresa", 3),
		// https://en.wikipedia.org/wiki/63rd_Golden_Horse_Awards
		q("Which film won Best Narrative Feature at the Golden Horse Awards in November 2026?", ["We Are Born Good", "Double Happiness", "Arrested Memory", "We Are All Strangers"], "We Are Born Good", 2),
		// https://en.wikipedia.org/wiki/63rd_Golden_Horse_Awards
		q("Who won Best Leading Actor at the 63rd Golden Horse Awards in November 2026?", ["Leon Dai", "Ethan Juan", "Liu Kuan-ting", "Yeung Wai-lun"], "Liu Kuan-ting", 3),
		// https://en.wikipedia.org/wiki/63rd_Golden_Horse_Awards
		q("Which Hong Kong actress won Best Leading Actress at the Golden Horse Awards in November 2026?", ["Jennifer Yu", "Chung Suet Ying", "Kearen Pang", "Angela Yuen"], "Angela Yuen", 3),
		// https://en.wikipedia.org/wiki/63rd_Golden_Horse_Awards
		q("In which city were the 63rd Golden Horse Awards held in November 2026?", ["Taipei", "Kaohsiung", "Hong Kong", "Taichung"], "Taipei", 1),
		// https://en.wikipedia.org/wiki/Macy%27s_Thanksgiving_Day_Parade
		q("In November 2026, what weather hazard led Macy's to postpone its Thanksgiving Day Parade?", ["High winds", "Heavy snow", "Dense fog", "Freezing rain"], "High winds", 1),
		// https://en.wikipedia.org/wiki/Macy%27s_Thanksgiving_Day_Parade
		q("In November 2026, Macy's moved its Thanksgiving Day Parade to which day of the week?", ["Saturday", "Friday", "Sunday", "Monday"], "Saturday", 1),
		// https://en.wikipedia.org/wiki/Macy%27s_Thanksgiving_Day_Parade
		q("On Thanksgiving Day 2026, what aired in place of the postponed Macy's parade?", ["Miracle on 34th Street", "A rerun of the 2025 parade", "A Today show special", "An NFL pregame show"], "A rerun of the 2025 parade", 2),
		// https://en.wikipedia.org/wiki/Macy%27s_Thanksgiving_Day_Parade
		q("The Macy's Thanksgiving Day Parade postponed in November 2026 was which edition of the event?", ["100th", "95th", "98th", "102nd"], "100th", 2),
	],
	science: [
		// https://en.wikipedia.org/wiki/Aspirin
		q("Which German company named Aspirin and was selling it globally by 1899?", ["Bayer", "Merck", "BASF", "Hoechst"], "Bayer", 1),
		// https://en.wikipedia.org/wiki/CRISPR
		q("Which molecule does the Cas9 enzyme recognize and cut open using CRISPR sequences as a guide?", ["Glucose", "Collagen", "Cholesterol", "DNA"], "DNA", 1),
		// https://en.wikipedia.org/wiki/Graphene
		q("Graphene is a form of which chemical element?", ["Silicon", "Boron", "Sulfur", "Carbon"], "Carbon", 1),
		// https://en.wikipedia.org/wiki/International_Space_Station
		q("In what type of orbit does the International Space Station travel?", ["Geostationary orbit", "Lunar orbit", "Solar orbit", "Low Earth orbit"], "Low Earth orbit", 1),
		// https://en.wikipedia.org/wiki/Neutron_star
		q("Among known stellar objects, only which class is smaller and denser than neutron stars?", ["White dwarfs", "Black holes", "Red giants", "Brown dwarfs"], "Black holes", 1),
		// https://en.wikipedia.org/wiki/Penicillin
		q("Penicillin was originally obtained from what kind of organism?", ["Algae", "Bacteria", "Lichen", "Mold"], "Mold", 1),
		// https://en.wikipedia.org/wiki/Aspirin
		q("What is the chemical name for which Aspirin is the genericized trademark?", ["Ascorbic acid", "Mefenamic acid", "Acetylsalicylic acid", "Tranexamic acid"], "Acetylsalicylic acid", 2),
		// https://en.wikipedia.org/wiki/CRISPR
		q("Who shared the 2020 Nobel Prize in Chemistry with Emmanuelle Charpentier for CRISPR-Cas9?", ["Jennifer Doudna", "Frances Arnold", "Carolyn Bertozzi", "Katalin Karikó"], "Jennifer Doudna", 2),
		// https://en.wikipedia.org/wiki/Curiosity_(rover)
		q("Inside which Martian crater did the Curiosity rover land in 2012?", ["Jezero", "Gale", "Gusev", "Eagle"], "Gale", 2),
		// https://en.wikipedia.org/wiki/Graphene
		q("At which university did Geim and Novoselov isolate graphene in 2004?", ["University of Cambridge", "University of Edinburgh", "University of Oxford", "University of Manchester"], "University of Manchester", 2),
		// https://en.wikipedia.org/wiki/Neutron_star
		q("What is the process called when a neutron star pulls in gas from its companion star?", ["Accretion", "Convection", "Sublimation", "Ionization"], "Accretion", 2),
		// https://en.wikipedia.org/wiki/Penicillin
		q("At which university was purified penicillin first isolated by a research team in 1940?", ["University of Cambridge", "University of Edinburgh", "University of Manchester", "University of Oxford"], "University of Oxford", 2),
		// https://en.wikipedia.org/wiki/Richter_scale
		q("Each whole-number step on the Richter scale means what increase in measured wave amplitude?", ["Twofold", "Fivefold", "Tenfold", "Hundredfold"], "Tenfold", 2),
		// https://en.wikipedia.org/wiki/Superconductivity
		q("Which Dutch physicist discovered superconductivity in 1911?", ["Hendrik Lorentz", "Pieter Zeeman", "Heike Kamerlingh Onnes", "Johannes van der Waals"], "Heike Kamerlingh Onnes", 2),
		// https://en.wikipedia.org/wiki/Aspirin
		q("The \"spir\" in Aspirin comes from Spirsäure, a German word tied to which plant?", ["Foxglove", "Chamomile", "Valerian", "Meadowsweet"], "Meadowsweet", 3),
		// https://en.wikipedia.org/wiki/CRISPR
		q("Which Spanish microbiologist studied CRISPR repeats in the archaea Haloferax and Haloarcula?", ["Severo Ochoa", "Francisco Mojica", "Mariano Barbacid", "Margarita Salas"], "Francisco Mojica", 3),
		// https://en.wikipedia.org/wiki/Curiosity_(rover)
		q("Which twelve-year-old student submitted the winning name for the Curiosity rover?", ["Sofi Collis", "Alexander Mather", "Clara Ma", "Valerie Ambroise"], "Clara Ma", 3),
		// https://en.wikipedia.org/wiki/Graphene
		q("Who first theorized the existence of graphene in 1947?", ["Linus Pauling", "Rudolf Peierls", "Philip R. Wallace", "Lev Landau"], "Philip R. Wallace", 3),
		// https://en.wikipedia.org/wiki/International_Space_Station
		q("Which planned US station was combined with the Soviet Mir-2 to form the International Space Station?", ["Space Station Liberty", "Space Station Columbia", "Space Station Freedom", "Space Station Pioneer"], "Space Station Freedom", 3),
		// https://en.wikipedia.org/wiki/BepiColombo
		q("In November 2026, which planet did the BepiColombo spacecraft enter orbit around?", ["Venus", "Mercury", "Mars", "Jupiter"], "Mercury", 1),
		// https://en.wikipedia.org/wiki/BepiColombo
		q("What problem cut short BepiColombo's thruster burn at Mercury in November 2026?", ["A fuel leak", "A software glitch", "A solar array fault", "An antenna failure"], "A software glitch", 2),
		// https://en.wikipedia.org/wiki/BepiColombo
		q("BepiColombo, which reached Mercury orbit in November 2026, is a joint mission of ESA and which agency?", ["NASA", "JAXA", "Roscosmos", "ISRO"], "JAXA", 2),
		// https://en.wikipedia.org/wiki/Muhammad_Zeeshan_Ali
		q("In November 2026, which Chinese mission carried Muhammad Zeeshan Ali to orbit?", ["Shenzhou 24", "Shenzhou 23", "Shenzhou 22", "Shenzhou 21"], "Shenzhou 24", 2),
		// https://en.wikipedia.org/wiki/Shenzhou_24
		q("Shenzhou 24's November 2026 launch carried the first astronaut from which country to reach orbit?", ["Bangladesh", "Indonesia", "Sri Lanka", "Pakistan"], "Pakistan", 1),
		// https://en.wikipedia.org/wiki/Shenzhou_24
		q("Which space station did China's Shenzhou 24 dock with in November 2026?", ["Mir", "Tiangong", "Skylab", "Salyut 7"], "Tiangong", 1),
		// https://en.wikipedia.org/wiki/Shenzhou_24
		q("Who commanded China's Shenzhou 24 mission, launched in November 2026?", ["Tang Hongbo", "Zhu Yangzhu", "Zhang Zhiyuan", "Wu Yi"], "Tang Hongbo", 2),
		// https://en.wikipedia.org/wiki/Shenzhou_24
		q("From which launch center did Shenzhou 24 lift off in November 2026?", ["Jiuquan", "Wenchang", "Xichang", "Taiyuan"], "Jiuquan", 2),
	],
	history: [
		// https://en.wikipedia.org/wiki/Boxer_Rebellion
		q("On which city did Boxer fighters converge in June 1900 during the Boxer Rebellion?", ["Shanghai", "Beijing", "Nanjing", "Guangzhou"], "Beijing", 1),
		// https://en.wikipedia.org/wiki/Christmas_truce
		q("During which war did the Christmas truce take place?", ["First World War", "Second World War", "Crimean War", "Boer War"], "First World War", 1),
		// https://en.wikipedia.org/wiki/Code_talker
		q("Which Native American language is most strongly associated with WWII Marine Corps code talkers?", ["Navajo", "Apache", "Seminole", "Iroquois"], "Navajo", 1),
		// https://en.wikipedia.org/wiki/Hanseatic_League
		q("From which North German city did the Hanseatic League chiefly grow?", ["Lübeck", "Munich", "Dresden", "Nuremberg"], "Lübeck", 1),
		// https://en.wikipedia.org/wiki/Meiji_Restoration
		q("Which shogunate was overthrown in the Meiji Restoration?", ["Ashikaga", "Kamakura", "Tokugawa", "Toyotomi"], "Tokugawa", 1),
		// https://en.wikipedia.org/wiki/Rosetta_Stone
		q("In which museum has the Rosetta Stone been on public display since 1802?", ["Louvre Museum", "Vatican Museums", "British Museum", "Egyptian Museum"], "British Museum", 1),
		// https://en.wikipedia.org/wiki/Boxer_Rebellion
		q("Near the end of which Chinese dynasty did the Boxer Rebellion occur?", ["Qing", "Ming", "Tang", "Song"], "Qing", 2),
		// https://en.wikipedia.org/wiki/Christmas_truce
		q("Which pope begged for an official truce between the warring governments in December 1914?", ["Benedict XV", "Pius X", "Pius XI", "Leo XIII"], "Benedict XV", 2),
		// https://en.wikipedia.org/wiki/Code_talker
		q("Which branch of the US military coined the term \"code talker\"?", ["Army", "Navy", "Marine Corps", "Coast Guard"], "Marine Corps", 2),
		// https://en.wikipedia.org/wiki/Gettysburg_Address
		q("Which elder statesman gave the main oration before Lincoln's Gettysburg Address?", ["Daniel Webster", "Edward Everett", "Charles Sumner", "Horace Greeley"], "Edward Everett", 2),
		// https://en.wikipedia.org/wiki/Hanseatic_League
		q("What was the Hanseatic League's Kontor in London known as?", ["The Coalyard", "The Saltmarket", "The Steelyard", "The Ironworks"], "The Steelyard", 2),
		// https://en.wikipedia.org/wiki/Meiji_Restoration
		q("Which U.S. president ordered the Perry Expedition that helped trigger the Meiji Restoration?", ["James Polk", "Millard Fillmore", "Zachary Taylor", "James Buchanan"], "Millard Fillmore", 2),
		// https://en.wikipedia.org/wiki/Rosetta_Stone
		q("Which scholar announced the transliteration of the Rosetta Stone's Egyptian scripts in 1822?", ["Giovanni Battista Belzoni", "Karl Richard Lepsius", "Heinrich Schliemann", "Jean-François Champollion"], "Jean-François Champollion", 2),
		// https://en.wikipedia.org/wiki/Salt_March
		q("In which coastal village did Gandhi's Salt March end in April 1930?", ["Porbandar", "Dandi", "Bardoli", "Surat"], "Dandi", 2),
		// https://en.wikipedia.org/wiki/Triangle_Shirtwaist_Factory_fire
		q("On which university's campus does the site of the Triangle Shirtwaist Factory fire stand?", ["New York University", "Columbia University", "Fordham University", "Pace University"], "New York University", 2),
		// https://en.wikipedia.org/wiki/Boxer_Rebellion
		q("In which Chinese province did the Righteous and Harmonious Fists of the Boxer Rebellion arise?", ["Sichuan", "Shandong", "Yunnan", "Hunan"], "Shandong", 3),
		// https://en.wikipedia.org/wiki/Christmas_truce
		q("Which battle's indecisive result contributed to the lull in fighting before the Christmas truce?", ["Battle of Verdun", "Battle of the Somme", "Battle of Tannenberg", "First Battle of Ypres"], "First Battle of Ypres", 3),
		// https://en.wikipedia.org/wiki/Code_talker
		q("Which European language did Captain Frank D. Carranza reportedly propose for US military codes in 1942?", ["Welsh", "Basque", "Finnish", "Hungarian"], "Basque", 3),
		// https://en.wikipedia.org/wiki/Gettysburg_Address
		q("What disease was Lincoln diagnosed with shortly after giving the Gettysburg Address?", ["Typhoid fever", "Scarlet fever", "Malaria", "Smallpox"], "Smallpox", 3),
		// https://en.wikipedia.org/wiki/Hanseatic_League
		q("Which duke's 1159 rebuilding of Lübeck is the traditional origin of the Hanseatic League?", ["Henry the Lion", "Albert the Bear", "Otto the Great", "Frederick Barbarossa"], "Henry the Lion", 3),
		// https://en.wikipedia.org/wiki/Pitt_Rivers_Museum
		q("In November 2026, Oxford's Pitt Rivers Museum returned ancestral Naga skulls to which country?", ["India", "Nigeria", "Australia", "Kenya"], "India", 2),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Albatross
		q("How many eggs does an albatross lay in each breeding attempt?", ["One", "Two", "Three", "Four"], "One", 1),
		// https://en.wikipedia.org/wiki/Emperor_penguin
		q("To which continent is the emperor penguin endemic?", ["Antarctica", "Australia", "South America", "Africa"], "Antarctica", 1),
		// https://en.wikipedia.org/wiki/Hippopotamus
		q("What does the name hippopotamus mean in Ancient Greek?", ["Water pig", "Mud bull", "Swamp cow", "River horse"], "River horse", 1),
		// https://en.wikipedia.org/wiki/Mantis_shrimp
		q("What type of diet do mantis shrimp have?", ["Herbivorous", "Filter-feeding", "Carnivorous", "Detritus-eating"], "Carnivorous", 1),
		// https://en.wikipedia.org/wiki/Orca
		q("The orca is the largest member of which animal family?", ["Baleen whales", "True porpoises", "Beaked whales", "Oceanic dolphins"], "Oceanic dolphins", 1),
		// https://en.wikipedia.org/wiki/Albatross
		q("What is the name of the famous Laysan albatross first banded on Midway Island in 1956?", ["Patience", "Wisdom", "Grace", "Hope"], "Wisdom", 2),
		// https://en.wikipedia.org/wiki/Emperor_penguin
		q("Which penguin shares the genus Aptenodytes with the emperor penguin?", ["Adélie penguin", "King penguin", "Gentoo penguin", "Macaroni penguin"], "King penguin", 2),
		// https://en.wikipedia.org/wiki/Hippopotamus
		q("Which group of animals are the closest living relatives of the hippopotamus?", ["Pigs and peccaries", "Rhinos and tapirs", "Elephants and manatees", "Whales and dolphins"], "Whales and dolphins", 2),
		// https://en.wikipedia.org/wiki/Mantis_shrimp
		q("What nickname have mantis shrimp earned because of the painful wounds they can inflict when handled?", ["Toe biters", "Finger snappers", "Thumb splitters", "Hand stingers"], "Thumb splitters", 2),
		// https://en.wikipedia.org/wiki/Orca
		q("Which naturalist described Orcinus orca in the 1758 edition of Systema Naturae?", ["Georges Cuvier", "Carl Linnaeus", "Charles Darwin", "Joseph Banks"], "Carl Linnaeus", 2),
		// https://en.wikipedia.org/wiki/Platypus
		q("Which animals join the platypus as the only living monotremes?", ["Wombats", "Echidnas", "Bandicoots", "Pangolins"], "Echidnas", 2),
		// https://en.wikipedia.org/wiki/Snow_leopard
		q("In which genus was the snow leopard long classified before being moved to Panthera?", ["Neofelis", "Uncia", "Acinonyx", "Puma"], "Uncia", 2),
		// https://en.wikipedia.org/wiki/Tardigrade
		q("What does the name Tardigrada mean?", ["Tiny bears", "Tough skins", "Slow walkers", "Moss dwellers"], "Slow walkers", 2),
		// https://en.wikipedia.org/wiki/Albatross
		q("Which naturalist assigned the name Diomedea to the albatrosses?", ["Linnaeus", "Buffon", "Cuvier", "Audubon"], "Linnaeus", 3),
		// https://en.wikipedia.org/wiki/Emperor_penguin
		q("Which English zoologist described the emperor penguin in 1844?", ["John Gould", "George Robert Gray", "Richard Owen", "Joseph Dalton Hooker"], "George Robert Gray", 3),
		// https://en.wikipedia.org/wiki/Hippopotamus
		q("What collective name covers Pakicetus and the other early whale ancestors on the hippo's sister branch?", ["Archaeoceti", "Mysticeti", "Odontoceti", "Sirenia"], "Archaeoceti", 3),
		// https://en.wikipedia.org/wiki/Mantis_shrimp
		q("What is the light produced by collapsing bubbles from a mantis shrimp strike called?", ["Bioluminescence", "Triboluminescence", "Chemiluminescence", "Sonoluminescence"], "Sonoluminescence", 3),
		// https://en.wikipedia.org/wiki/Orca
		q("Who wrote the first scientific description of an orca, published in 1558?", ["Conrad Gessner", "Pierre Belon", "Guillaume Rondelet", "Ulisse Aldrovandi"], "Conrad Gessner", 3),
		// https://en.wikipedia.org/wiki/2026_United_Nations_Climate_Change_Conference
		q("What issue blocked a climate pact at the COP31 summit in November 2026?", ["Mentioning fossil fuels", "Funding climate finance", "Setting methane targets", "Choosing the next host"], "Mentioning fossil fuels", 1),
	],
	games: [
		// https://en.wikipedia.org/wiki/Atari_2600
		q("What 1972 coin-operated video game was Atari's first major product?", ["Asteroids", "Breakout", "Pong", "Space Invaders"], "Pong", 1),
		// https://en.wikipedia.org/wiki/Blackjack
		q("How many points is a jack, queen or king worth in blackjack?", ["11", "12", "10", "5"], "10", 1),
		// https://en.wikipedia.org/wiki/Darts
		q("In 1908, darts was declared a game of what, allowing it to be played in pubs?", ["Skill", "Chance", "Strength", "Honor"], "Skill", 1),
		// https://en.wikipedia.org/wiki/Doom_(1993_video_game)
		q("Doom (1993) has been termed the \"father\" of which video game genre?", ["Real-time strategy games", "Platform games", "Fighting games", "First-person shooters"], "First-person shooters", 1),
		// https://en.wikipedia.org/wiki/Magic:_The_Gathering
		q("In Magic: The Gathering, what magical energy do land cards produce?", ["Aether", "Mana", "Chi", "Essence"], "Mana", 1),
		// https://en.wikipedia.org/wiki/Myst
		q("What kind of object transports the player to the island in Myst?", ["A book", "A mirror", "A door", "A ship"], "A book", 1),
		// https://en.wikipedia.org/wiki/Pinball
		q("In pinball, what player-controlled devices are used to make shots before the ball is lost?", ["Bumpers", "Mallets", "Flippers", "Cues"], "Flippers", 1),
		// https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go
		q("Which company originally developed the mobile game Pokémon Go?", ["Game Freak", "Niantic", "Supercell", "Zynga"], "Niantic", 1),
		// https://en.wikipedia.org/wiki/Reversi
		q("What size board is Reversi played on?", ["8×8", "6×6", "9×9", "10×10"], "8×8", 1),
		// https://en.wikipedia.org/wiki/Atari_2600
		q("Which 1980 home conversion of a Taito arcade game was the Atari 2600's first killer application?", ["Donkey Kong", "Galaxian", "Space Invaders", "Defender"], "Space Invaders", 2),
		// https://en.wikipedia.org/wiki/Blackjack
		q("Which Spanish author wrote the first known written reference to the game twenty-one?", ["Lope de Vega", "Francisco de Quevedo", "Pedro Calderón", "Miguel de Cervantes"], "Miguel de Cervantes", 2),
		// https://en.wikipedia.org/wiki/Darts
		q("Before World War I, UK pub dartboards were usually made from solid blocks of which wood?", ["Oak", "Pine", "Beech", "Elm"], "Elm", 2),
		// https://en.wikipedia.org/wiki/Doom_(1993_video_game)
		q("Which lead programmer created the new 3D game engine used for Doom (1993)?", ["Tim Sweeney", "Ken Silverman", "John Carmack", "Gabe Newell"], "John Carmack", 2),
		// https://en.wikipedia.org/wiki/Magic:_The_Gathering
		q("Which company released Magic: The Gathering in 1993?", ["Wizards of the Coast", "Fantasy Flight Games", "Steve Jackson Games", "Games Workshop"], "Wizards of the Coast", 2),
		// https://en.wikipedia.org/wiki/Myst
		q("What name does Myst give to the other worlds the player travels to by solving puzzles?", ["Realms", "Shards", "Spheres", "Ages"], "Ages", 2),
		// https://en.wikipedia.org/wiki/Pinball
		q("What name was given to the standardized pin-table game that became a forerunner of pinball?", ["Carrom", "Bagatelle", "Crokinole", "Shove ha'penny"], "Bagatelle", 2),
		// https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go
		q("Which company acquired Pokémon Go in 2025?", ["Tencent", "Scopely", "Zynga", "Supercell"], "Scopely", 2),
		// https://en.wikipedia.org/wiki/Reversi
		q("What color is the Othello board, inspired by the field where the general Othello leads his battle?", ["Blue", "Red", "Brown", "Green"], "Green", 2),
		// https://en.wikipedia.org/wiki/Roulette
		q("Which thinker is believed to have made a primitive roulette while seeking a perpetual motion machine?", ["Blaise Pascal", "René Descartes", "Pierre de Fermat", "Gottfried Leibniz"], "Blaise Pascal", 2),
		// https://en.wikipedia.org/wiki/SimCity
		q("Which company published the first SimCity game in 1989?", ["Maxis", "Sierra", "MicroProse", "Activision"], "Maxis", 2),
		// https://en.wikipedia.org/wiki/Tamagotchi
		q("Which franchise was spawned by Bandai's masculine counterpart to the Tamagotchi?", ["Pokémon", "Yu-Gi-Oh!", "Digimon", "Medabots"], "Digimon", 2),
		// https://en.wikipedia.org/wiki/The_Oregon_Trail_(series)
		q("Which Oregon valley is the settlers' destination in The Oregon Trail?", ["Rogue Valley", "Willamette Valley", "Umpqua Valley", "Hood River Valley"], "Willamette Valley", 2),
		// https://en.wikipedia.org/wiki/Wordle
		q("Which board game inspired Wordle?", ["Scrabble", "Boggle", "Mastermind", "Clue"], "Mastermind", 2),
		// https://en.wikipedia.org/wiki/Atari_2600
		q("Under what codename was the Atari 2600 prototyped by Cyan Engineering?", ["Stella", "Colleen", "Candy", "Sylvia"], "Stella", 3),
		// https://en.wikipedia.org/wiki/Blackjack
		q("Historian Thierry Depaulis traced the name blackjack to prospectors in which gold rush?", ["Klondike Gold Rush", "California Gold Rush", "Victorian Gold Rush", "Black Hills Gold Rush"], "Klondike Gold Rush", 3),
		// https://en.wikipedia.org/wiki/Darts
		q("What older name for a dartboard comes from a French word meaning target or goal?", ["Clout", "Butt", "Mark", "Roundel"], "Butt", 3),
		// https://en.wikipedia.org/wiki/Doom_(1993_video_game)
		q("Which designer wrote a science fiction plot for Doom (1993) before being removed from the project?", ["American McGee", "Tom Hall", "Adrian Carmack", "Kevin Cloud"], "Tom Hall", 3),
		// https://en.wikipedia.org/wiki/Magic:_The_Gathering
		q("What term does Magic: The Gathering use for a player's deck?", ["Library", "Grimoire", "Arsenal", "Vault"], "Library", 3),
		// https://en.wikipedia.org/wiki/Myst
		q("In Myst, who is the father of the trapped brothers Sirrus and Achenar?", ["Atrus", "Gehn", "Saavedro", "Esher"], "Atrus", 3),
		// https://en.wikipedia.org/wiki/Pinball
		q("Which British inventor began making bagatelle tables in Cincinnati in 1869, shaping modern pinball?", ["Raymond Maloney", "Roger Sharpe", "Montague Redgrave", "Steven L. Kent"], "Montague Redgrave", 3),
		// https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go
		q("Which earlier game's portals were Pokémon Go's PokéStop and Gym locations adapted from?", ["Geocaching", "Foursquare", "Munzee", "Ingress"], "Ingress", 3),
		// https://en.wikipedia.org/wiki/Reversi
		q("Who patented the Reversi variant Othello in 1971 while working as a salesman?", ["Gunpei Yokoi", "Goro Hasegawa", "Toru Iwatani", "Shigeru Miyamoto"], "Goro Hasegawa", 3),
		// https://en.wikipedia.org/wiki/Golden_Joystick_Awards
		q("At the November 2026 Golden Joystick Awards, which game won Ultimate Game of the Year?", ["Crimson Desert", "Resident Evil Requiem", "Control Resonant", "Dispatch"], "Resident Evil Requiem", 1),
		// https://en.wikipedia.org/wiki/Golden_Joystick_Awards
		q("At the November 2026 Golden Joystick Awards, which company was named Studio of the Year?", ["Remedy Entertainment", "CD Projekt Red", "Capcom", "Pearl Abyss"], "Capcom", 2),
		// https://en.wikipedia.org/wiki/Golden_Joystick_Awards
		q("At the November 2026 Golden Joystick Awards, which title won PC Game of the Year?", ["Subnautica 2", "Control Resonant", "Valheim", "Crimson Desert"], "Crimson Desert", 2),
		// https://en.wikipedia.org/wiki/Golden_Joystick_Awards
		q("At the November 2026 Golden Joystick Awards, which upcoming title won Most Wanted Game?", ["Marvel's Wolverine", "The Witcher IV", "The Elder Scrolls VI", "Half-Life 3"], "The Witcher IV", 2),
		// https://en.wikipedia.org/wiki/World_Chess_Championship_2026
		q("Which country hosted the World Chess Championship 2026 match that began in November 2026?", ["Singapore", "Switzerland", "Norway", "Uzbekistan"], "Switzerland", 1),
		// https://en.wikipedia.org/wiki/World_Chess_Championship_2026
		q("At the World Chess Championship 2026, which challenger faced Gukesh Dommaraju from November 2026?", ["Nodirbek Abdusattorov", "Fabiano Caruana", "Hikaru Nakamura", "Javokhir Sindarov"], "Javokhir Sindarov", 1),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Arnold_Schwarzenegger
		q("Which US state did Arnold Schwarzenegger serve as governor from 2003 to 2011?", ["California", "Nevada", "Florida", "Texas"], "California", 1),
		// https://en.wikipedia.org/wiki/Betty_White
		q("Which 2009 romantic comedy film sparked Betty White's late career resurgence?", ["The Ugly Truth", "Bride Wars", "27 Dresses", "The Proposal"], "The Proposal", 1),
		// https://en.wikipedia.org/wiki/Cary_Grant
		q("In which English city was Cary Grant born?", ["Liverpool", "Manchester", "Bristol", "Leeds"], "Bristol", 1),
		// https://en.wikipedia.org/wiki/Eddie_Murphy
		q("Which character does Eddie Murphy voice in the Shrek franchise?", ["Donkey", "Pinocchio", "Puss in Boots", "Lord Farquaad"], "Donkey", 1),
		// https://en.wikipedia.org/wiki/Elizabeth_Taylor
		q("Which 1963 film featured Elizabeth Taylor's best-known role?", ["Ben-Hur", "Spartacus", "My Fair Lady", "Cleopatra"], "Cleopatra", 1),
		// https://en.wikipedia.org/wiki/Humphrey_Bogart
		q("For which 1951 adventure film did Humphrey Bogart win the Best Actor Oscar?", ["The Maltese Falcon", "Key Largo", "High Sierra", "The African Queen"], "The African Queen", 1),
		// https://en.wikipedia.org/wiki/Jack_Nicholson
		q("Which 1989 superhero film featured Jack Nicholson?", ["Superman II", "Batman", "Dick Tracy", "The Rocketeer"], "Batman", 1),
		// https://en.wikipedia.org/wiki/James_Dean
		q("In which 1955 film did James Dean play a disillusioned teenager?", ["The Wild One", "Blackboard Jungle", "On the Waterfront", "Rebel Without a Cause"], "Rebel Without a Cause", 1),
		// https://en.wikipedia.org/wiki/Jim_Carrey
		q("Which villain does Jim Carrey play in the Sonic the Hedgehog film series?", ["Doctor Octopus", "Doctor Doom", "Doctor Evil", "Doctor Eggman"], "Doctor Eggman", 1),
		// https://en.wikipedia.org/wiki/Arnold_Schwarzenegger
		q("What was Arnold Schwarzenegger's nickname in his bodybuilding days?", ["Styrian Bull", "Alpine Giant", "Vienna Titan", "Austrian Oak"], "Austrian Oak", 2),
		// https://en.wikipedia.org/wiki/Betty_White
		q("Betty White played Sue Ann Nivens on which CBS sitcom?", ["The Mary Tyler Moore Show", "The Bob Newhart Show", "The Dick Van Dyke Show", "The Andy Griffith Show"], "The Mary Tyler Moore Show", 2),
		// https://en.wikipedia.org/wiki/Cary_Grant
		q("Which actress was the mother of Cary Grant's daughter Jennifer?", ["Sophia Loren", "Deborah Kerr", "Dyan Cannon", "Grace Kelly"], "Dyan Cannon", 2),
		// https://en.wikipedia.org/wiki/Eddie_Murphy
		q("Eddie Murphy voiced the character Mushu in which 1998 Disney film?", ["Hercules", "Mulan", "Tarzan", "Pocahontas"], "Mulan", 2),
		// https://en.wikipedia.org/wiki/Elizabeth_Taylor
		q("Which 1944 film made Elizabeth Taylor a popular teen star?", ["National Velvet", "Meet Me in St. Louis", "Gaslight", "Going My Way"], "National Velvet", 2),
		// https://en.wikipedia.org/wiki/Humphrey_Bogart
		q("Which character did Humphrey Bogart play in The Maltese Falcon?", ["Sam Spade", "Nick Charles", "Mike Hammer", "Lew Archer"], "Sam Spade", 2),
		// https://en.wikipedia.org/wiki/Jack_Nicholson
		q("Which character did Jack Nicholson play in One Flew Over the Cuckoo's Nest?", ["Randle McMurphy", "Travis Bickle", "Frank Serpico", "Sonny Wortzik"], "Randle McMurphy", 2),
		// https://en.wikipedia.org/wiki/James_Dean
		q("Which film earned James Dean the first posthumous Best Actor Oscar nomination?", ["A Place in the Sun", "From Here to Eternity", "East of Eden", "Picnic"], "East of Eden", 2),
		// https://en.wikipedia.org/wiki/Jim_Carrey
		q("Which real-life comedian did Jim Carrey portray in the 1999 film Man on the Moon?", ["Lenny Bruce", "Andy Kaufman", "John Belushi", "Richard Pryor"], "Andy Kaufman", 2),
		// https://en.wikipedia.org/wiki/Johnny_Carson
		q("From which host did Johnny Carson take over the late-night talk show Tonight in 1962?", ["Ed Sullivan", "Jack Paar", "Merv Griffin", "Dick Cavett"], "Jack Paar", 2),
		// https://en.wikipedia.org/wiki/Judi_Dench
		q("In which musical did Judi Dench play Sally Bowles in 1968?", ["Cabaret", "Chicago", "Gypsy", "Oliver!"], "Cabaret", 2),
		// https://en.wikipedia.org/wiki/Kate_Winslet
		q("In which Berkshire town was Kate Winslet born?", ["Reading", "Slough", "Windsor", "Newbury"], "Reading", 2),
		// https://en.wikipedia.org/wiki/Katharine_Hepburn
		q("At which college did Katharine Hepburn begin to act?", ["Vassar College", "Smith College", "Bryn Mawr College", "Wellesley College"], "Bryn Mawr College", 2),
		// https://en.wikipedia.org/wiki/Michelle_Yeoh
		q("In which James Bond film did Michelle Yeoh have a starring role?", ["Die Another Day", "Tomorrow Never Dies", "The World Is Not Enough", "Licence to Kill"], "Tomorrow Never Dies", 2),
		// https://en.wikipedia.org/wiki/Arnold_Schwarzenegger
		q("In which Styrian village was Arnold Schwarzenegger born?", ["Hallstatt", "Thal", "Mayrhofen", "Kitzbühel"], "Thal", 3),
		// https://en.wikipedia.org/wiki/Betty_White
		q("Betty White became the first woman to produce a sitcom with which 1950s show?", ["Our Miss Brooks", "December Bride", "I Married Joan", "Life with Elizabeth"], "Life with Elizabeth", 3),
		// https://en.wikipedia.org/wiki/Cary_Grant
		q("With which stage troupe did a 16-year-old Cary Grant tour the United States?", ["Karno Troupe", "Pender Troupe", "Lupino Troupe", "Hanlon Troupe"], "Pender Troupe", 3),
		// https://en.wikipedia.org/wiki/Eddie_Murphy
		q("Eddie Murphy's habit of playing multiple roles in one film is a tribute to which actor?", ["Alec Guinness", "Jerry Lewis", "Lon Chaney", "Peter Sellers"], "Peter Sellers", 3),
		// https://en.wikipedia.org/wiki/Elizabeth_Taylor
		q("Which United States Senator was Elizabeth Taylor's sixth husband?", ["John Tower", "Gary Hart", "Bob Packwood", "John Warner"], "John Warner", 3),
		// https://en.wikipedia.org/wiki/Humphrey_Bogart
		q("What does the Dutch surname \"Bogaert\", the source of Humphrey Bogart's family name, mean?", ["Meadow", "Windmill", "Harbor", "Orchard"], "Orchard", 3),
		// https://en.wikipedia.org/wiki/Jack_Nicholson
		q("Which playwright did Jack Nicholson portray in the 1981 film Reds?", ["Tennessee Williams", "Eugene O'Neill", "Arthur Miller", "Clifford Odets"], "Eugene O'Neill", 3),
		// https://en.wikipedia.org/wiki/James_Dean
		q("In which town was James Dean raised on his aunt and uncle's farm after his mother died?", ["Kokomo", "Muncie", "Fairmount", "Lafayette"], "Fairmount", 3),
		// https://en.wikipedia.org/wiki/Jim_Carrey
		q("Which film made Jim Carrey the first comic actor to receive an upfront $20 million salary?", ["Liar Liar", "Batman Forever", "The Mask", "The Cable Guy"], "The Cable Guy", 3),
		// https://en.wikipedia.org/wiki/Dancing_with_the_Stars_%28American_TV_series%29_season_35
		q("Which Paralympic athlete was crowned champion of Dancing with the Stars season 35 in November 2026?", ["Hunter Woodhall", "Jackson Olson", "Tyler Cameron", "Ezra Frech"], "Ezra Frech", 1),
		// https://en.wikipedia.org/wiki/Dancing_with_the_Stars_%28American_TV_series%29_season_35
		q("Which professional dancer won Dancing with the Stars season 35 in 2026 as Ezra Frech's partner?", ["Rylee Arnold", "Emma Slater", "Daniella Karagach", "Britt Stewart"], "Daniella Karagach", 2),
		// https://en.wikipedia.org/wiki/Dancing_with_the_Stars_%28American_TV_series%29_season_35
		q("Which Olympic figure skater finished second on Dancing with the Stars season 35 in 2026?", ["Alysa Liu", "Isabeau Levito", "Amber Glenn", "Bradie Tennell"], "Amber Glenn", 2),
		// https://en.wikipedia.org/wiki/Jennifer_Barreto
		q("Jennifer Barreto's November 2026 Miss Universe win made her the first what to take the title?", ["Married woman", "Active-duty soldier", "Woman over age 40", "Licensed physician"], "Married woman", 1),
		// https://en.wikipedia.org/wiki/Jennifer_Barreto
		q("With Jennifer Barreto's November 2026 win, how many Miss Universe titles has Puerto Rico won?", ["Four", "Six", "Five", "Seven"], "Six", 2),
		// https://en.wikipedia.org/wiki/Jennifer_Barreto
		q("Before Jennifer Barreto in November 2026, who was the last Puerto Rican to win Miss Universe?", ["Zuleyka Rivera", "Isis Casalduc", "Barbara Torres", "Zashely Alicea"], "Zuleyka Rivera", 2),
		// https://en.wikipedia.org/wiki/Miss_Universe_2026
		q("Who was crowned Miss Universe in November 2026?", ["Melissa Núñez", "Clara Vegas", "Jennifer Barreto", "Georgia Waddington"], "Jennifer Barreto", 1),
		// https://en.wikipedia.org/wiki/Miss_Universe_2026
		q("Which city hosted the Miss Universe pageant in November 2026?", ["Mexico City", "Bangkok", "Miami", "San Juan"], "San Juan", 1),
		// https://en.wikipedia.org/wiki/Miss_Universe_2026
		q("Which outgoing Miss Universe did Jennifer Barreto succeed in November 2026?", ["Fátima Bosch", "R'Bonney Gabriel", "Denise Quiñones", "Dayanara Torres"], "Fátima Bosch", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Cello
		q("Which composer wrote six famous unaccompanied Suites for the cello?", ["George Frideric Handel", "Georg Philipp Telemann", "Johann Sebastian Bach", "Henry Purcell"], "Johann Sebastian Bach", 1),
		// https://en.wikipedia.org/wiki/Grunge
		q("Grunge was originally known as the \"Sound\" of which American city?", ["Seattle", "Portland", "Detroit", "Boston"], "Seattle", 1),
		// https://en.wikipedia.org/wiki/Messiah_(Handel)
		q("Which famous chorus ends Part II of Handel's Messiah?", ["Anvil Chorus", "Ode to Joy", "Pilgrims' Chorus", "Hallelujah chorus"], "Hallelujah chorus", 1),
		// https://en.wikipedia.org/wiki/Pipe_organ
		q("To which ancient civilization can the origins of the pipe organ be traced?", ["Ancient India", "Ancient Greece", "Ancient Persia", "Ancient China"], "Ancient Greece", 1),
		// https://en.wikipedia.org/wiki/Punk_rock
		q("In which decade did punk rock emerge as a genre?", ["1950s", "1970s", "1960s", "1980s"], "1970s", 1),
		// https://en.wikipedia.org/wiki/Rhapsody_in_Blue
		q("Which instrument plays the famous opening glissando of Rhapsody in Blue?", ["Trumpet", "Saxophone", "Trombone", "Clarinet"], "Clarinet", 1),
		// https://en.wikipedia.org/wiki/Cello
		q("What musical interval separates the neighboring strings of a cello?", ["Fourths", "Thirds", "Sixths", "Fifths"], "Fifths", 2),
		// https://en.wikipedia.org/wiki/Clarinet
		q("Which German instrument maker is generally credited with inventing the clarinet around 1700?", ["Theobald Böhm", "Johann Christoph Denner", "Adolphe Sax", "Heinrich Baermann"], "Johann Christoph Denner", 2),
		// https://en.wikipedia.org/wiki/Grunge
		q("Which independent record label did the early grunge movement revolve around?", ["SST Records", "Matador", "Dischord", "Sub Pop"], "Sub Pop", 2),
		// https://en.wikipedia.org/wiki/Messiah_(Handel)
		q("Which composer's version, Der Messias, began efforts to update the orchestration of Handel's Messiah?", ["Haydn", "Beethoven", "Mozart", "Mendelssohn"], "Mozart", 2),
		// https://en.wikipedia.org/wiki/Pipe_organ
		q("What are the hand-played keyboards of a pipe organ called?", ["Ranks", "Stops", "Registers", "Manuals"], "Manuals", 2),
		// https://en.wikipedia.org/wiki/Punk_rock
		q("Which US city's scene produced the proto-punk bands MC5 and the Stooges?", ["Chicago", "Boston", "Cleveland", "Detroit"], "Detroit", 2),
		// https://en.wikipedia.org/wiki/Rhapsody_in_Blue
		q("Which bandleader commissioned Rhapsody in Blue?", ["Duke Ellington", "Paul Whiteman", "Benny Goodman", "Fletcher Henderson"], "Paul Whiteman", 2),
		// https://en.wikipedia.org/wiki/The_Rite_of_Spring
		q("Who created the original 1913 choreography for The Rite of Spring?", ["Michel Fokine", "George Balanchine", "Marius Petipa", "Vaslav Nijinsky"], "Vaslav Nijinsky", 2),
		// https://en.wikipedia.org/wiki/Cello
		q("What does the Italian word \"violoncello\" literally mean?", ["Little violone", "Bowed bass", "Deep violin", "Low fiddle"], "Little violone", 3),
		// https://en.wikipedia.org/wiki/Clarinet
		q("Who invented the stuffed pad that let clarinets carry more keys?", ["Theobald Böhm", "Hyacinthe Klosé", "Louis Auguste Buffet", "Iwan Müller"], "Iwan Müller", 3),
		// https://en.wikipedia.org/wiki/Disco
		q("Which Manhattan nightclub, opened on New Year's Eve 1960, imported the discothèque to the United States?", ["The Loft", "Paradise Garage", "Studio 54", "Le Club"], "Le Club", 3),
		// https://en.wikipedia.org/wiki/Grunge
		q("Whom did Kurt Cobain credit with coining the term \"grunge\" to describe the music?", ["Jonathan Poneman", "Jack Endino", "Everett True", "Steve Albini"], "Jonathan Poneman", 3),
		// https://en.wikipedia.org/wiki/Messiah_(Handel)
		q("Who compiled the text of Handel's Messiah from the King James Bible and the Coverdale Psalter?", ["Charles Jennens", "Thomas Morell", "Nahum Tate", "Alexander Pope"], "Charles Jennens", 3),
		// https://en.wikipedia.org/wiki/Pipe_organ
		q("Which Greek engineer is credited with inventing the organ in the 3rd century BC?", ["Ctesibius of Alexandria", "Archimedes of Syracuse", "Pythagoras of Samos", "Euclid of Alexandria"], "Ctesibius of Alexandria", 3),
		// https://en.wikipedia.org/wiki/2026_ARIA_Music_Awards
		q("At the 2026 ARIA Music Awards in November 2026, which act won the most awards?", ["Genesis Owusu", "Ninajirachi", "DMA's", "Tame Impala"], "Tame Impala", 1),
		// https://en.wikipedia.org/wiki/2026_ARIA_Music_Awards
		q("Which Sydney venue hosted the 2026 ARIA Music Awards in November 2026?", ["Sydney Opera House", "Hordern Pavilion", "Qudos Bank Arena", "Enmore Theatre"], "Hordern Pavilion", 2),
		// https://en.wikipedia.org/wiki/2026_ARIA_Music_Awards
		q("The ARIA Music Awards held in November 2026 were which annual edition of the ceremony?", ["35th", "38th", "40th", "45th"], "40th", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/Anna_Karenina
		q("Which form of transport is a motif throughout Anna Karenina?", ["Steamships", "Trains", "Sleighs", "Balloons"], "Trains", 1),
		// https://en.wikipedia.org/wiki/Catch-22
		q("During which war is the novel Catch-22 set?", ["World War II", "World War I", "The Korean War", "The Vietnam War"], "World War II", 1),
		// https://en.wikipedia.org/wiki/Crime_and_Punishment
		q("In which region did Dostoevsky spend ten years of exile before writing Crime and Punishment?", ["Crimea", "Caucasus", "Siberia", "Karelia"], "Siberia", 1),
		// https://en.wikipedia.org/wiki/Great_Expectations
		q("By what nickname is the orphan hero of Great Expectations known?", ["Kit", "Tim", "Dodger", "Pip"], "Pip", 1),
		// https://en.wikipedia.org/wiki/Slaughterhouse-Five
		q("The hero of Slaughterhouse-Five survives the Allied firebombing of which German city?", ["Dresden", "Hamburg", "Cologne", "Leipzig"], "Dresden", 1),
		// https://en.wikipedia.org/wiki/Things_Fall_Apart
		q("In which African country is Things Fall Apart set?", ["Nigeria", "Ghana", "Kenya", "Senegal"], "Nigeria", 1),
		// https://en.wikipedia.org/wiki/Anna_Karenina
		q("Which cavalry officer is Anna's lover in Anna Karenina?", ["Count Vronsky", "Konstantin Levin", "Stepan Oblonsky", "Sergei Koznyshev"], "Count Vronsky", 2),
		// https://en.wikipedia.org/wiki/Beloved_(novel)
		q("In which Ohio city is the haunted home in the novel Beloved?", ["Cleveland", "Columbus", "Cincinnati", "Toledo"], "Cincinnati", 2),
		// https://en.wikipedia.org/wiki/Catch-22
		q("Who is the antihero bombardier at the center of Catch-22?", ["Doc Daneeka", "Colonel Cathcart", "John Yossarian", "Hungry Joe"], "John Yossarian", 2),
		// https://en.wikipedia.org/wiki/Crime_and_Punishment
		q("What is the surname of the former law student who plots a murder in Crime and Punishment?", ["Raskolnikov", "Karamazov", "Myshkin", "Stavrogin"], "Raskolnikov", 2),
		// https://en.wikipedia.org/wiki/Great_Expectations
		q("What is Joe Gargery's trade in Great Expectations?", ["Carpenter", "Cobbler", "Miller", "Blacksmith"], "Blacksmith", 2),
		// https://en.wikipedia.org/wiki/Slaughterhouse-Five
		q("Who is the time-traveling protagonist of Slaughterhouse-Five?", ["John Yossarian", "Winston Smith", "Billy Pilgrim", "Guy Montag"], "Billy Pilgrim", 2),
		// https://en.wikipedia.org/wiki/The_Handmaid%27s_Tale
		q("What main color do the Handmaids wear in The Handmaid's Tale?", ["Blue", "Green", "Red", "Brown"], "Red", 2),
		// https://en.wikipedia.org/wiki/Things_Fall_Apart
		q("Who is the wrestling champion and clan leader at the center of Things Fall Apart?", ["Obierika", "Unoka", "Ezeudu", "Okonkwo"], "Okonkwo", 2),
		// https://en.wikipedia.org/wiki/Ulysses_(novel)
		q("What name do fans of the novel Ulysses give to their annual 16 June celebration?", ["Joyceday", "Dedalus Day", "Mollymas", "Bloomsday"], "Bloomsday", 2),
		// https://en.wikipedia.org/wiki/Anna_Karenina
		q("Which periodical serialized most of Anna Karenina from 1875?", ["The Contemporary", "Notes of the Fatherland", "The Northern Bee", "The Russian Messenger"], "The Russian Messenger", 3),
		// https://en.wikipedia.org/wiki/Beloved_(novel)
		q("Whose real life is the narrative of the novel Beloved loosely derived from?", ["Harriet Jacobs", "Sojourner Truth", "Ellen Craft", "Margaret Garner"], "Margaret Garner", 3),
		// https://en.wikipedia.org/wiki/Catch-22
		q("On which Mediterranean island is the squadron in Catch-22 based?", ["Pianosa", "Elba", "Capri", "Lampedusa"], "Pianosa", 3),
		// https://en.wikipedia.org/wiki/Crime_and_Punishment
		q("In which literary journal was Crime and Punishment first published in 1866?", ["The Contemporary", "Notes of the Fatherland", "The Russian Messenger", "The Northern Bee"], "The Russian Messenger", 3),
		// https://en.wikipedia.org/wiki/Great_Expectations
		q("In which weekly periodical run by Charles Dickens was Great Expectations first serialized?", ["Household Words", "Bentley's Miscellany", "All the Year Round", "The Cornhill Magazine"], "All the Year Round", 3),
		// https://en.wikipedia.org/wiki/Slaughterhouse-Five
		q("In Slaughterhouse-Five, which obscure science fiction writer does Billy Pilgrim discover in a hospital?", ["Roland Weary", "Paul Lazzaro", "Bernard O'Hare", "Kilgore Trout"], "Kilgore Trout", 3),
		// https://en.wikipedia.org/wiki/Cristina_Fern%C3%A1ndez_Cubas
		q("In November 2026, Spanish writer Cristina Fernández Cubas was awarded which literary prize?", ["Princess of Asturias Award", "Miguel de Cervantes Prize", "Nobel Prize in Literature", "Premio Planeta de Novela"], "Miguel de Cervantes Prize", 1),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Great_Rift_Valley
		q("Which sea does the Great Rift Valley run through on its way south from Syria?", ["Black Sea", "Caspian Sea", "Aegean Sea", "Red Sea"], "Red Sea", 1),
		// https://en.wikipedia.org/wiki/Ring_of_Fire
		q("Which theory, developed since the early 1960s, explains the Ring of Fire's volcanoes and earthquakes?", ["Expanding Earth", "Plate tectonics", "Catastrophism", "Isostasy"], "Plate tectonics", 1),
		// https://en.wikipedia.org/wiki/Tristan_da_Cunha
		q("In which ocean is the remote island group of Tristan da Cunha located?", ["South Pacific", "South Atlantic", "North Pacific", "Indian Ocean"], "South Atlantic", 1),
		// https://en.wikipedia.org/wiki/Great_Rift_Valley
		q("Which British geologist introduced the term \"Great Rift Valley\" in 1896?", ["Charles Lyell", "Arthur Holmes", "John Walter Gregory", "Roderick Murchison"], "John Walter Gregory", 2),
		// https://en.wikipedia.org/wiki/Ring_of_Fire
		q("What tectonic process at convergent plate boundaries created the Ring of Fire?", ["Subduction", "Seafloor spreading", "Continental rifting", "Hotspot volcanism"], "Subduction", 2),
		// https://en.wikipedia.org/wiki/Tristan_da_Cunha
		q("What was the nationality of the explorer who first sighted Tristan da Cunha in 1506?", ["Spanish", "Italian", "Danish", "Portuguese"], "Portuguese", 2),
		// https://en.wikipedia.org/wiki/Great_Rift_Valley
		q("Which lake in the Great Rift Valley is also known as Lake Kinneret?", ["Dead Sea", "Lake Malawi", "Lake Turkana", "Sea of Galilee"], "Sea of Galilee", 2),
		// https://en.wikipedia.org/wiki/Great_Rift_Valley
		q("Which Austrian geologist first proposed a linked set of rift features from Syria to Mozambique?", ["Alfred Wegener", "Albrecht Penck", "Ferdinand von Richthofen", "Eduard Suess"], "Eduard Suess", 3),
		// https://en.wikipedia.org/wiki/Mariana_Trench
		q("Which nation's exclusive economic zone contains the Challenger Deep?", ["Federated States of Micronesia", "Republic of the Marshall Islands", "Independent State of Samoa", "Republic of Palau"], "Federated States of Micronesia", 3),
	],
};
