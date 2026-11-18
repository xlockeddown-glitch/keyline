import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Trial run 3 batch (job trivia-trial-20261117-run3, Tue Nov 17 2026, America/Chicago).
 * Why: grow the thinnest topics (games 1.9%, celebrity 1.7%) and the 12 non-local topics,
 * plus settled current events from 18 Oct to 17 Nov 2026 (time-anchored in the prompt).
 * Claude Opus candidates written only from public Wikipedia text (fetched 17 Nov 2026).
 * The three-model free cross-check could not run (GROQ / AI_GATEWAY / OPENROUTER keys absent),
 * so every candidate was source-checked with Claude Opus and every reject/edit re-verified
 * against the full article text. Fact-deduped against all of main. No math (capped).
 * Evidence: /workspace/kl-trivia-20261117-logs/.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261117: Partial<Record<PlusCat, TriviaQ[]>> = {
	sports: [
		// https://en.wikipedia.org/wiki/Formula_One
		q("At which circuit was the first Formula One world championship race held in 1950?", ["Silverstone Circuit", "Monza Circuit", "Circuit de Monaco", "Spa-Francorchamps"], "Silverstone Circuit", 1),
		// https://en.wikipedia.org/wiki/Golf
		q("In which country was golf first played in the 15th century?", ["England", "Ireland", "Scotland", "France"], "Scotland", 1),
		// https://en.wikipedia.org/wiki/Marathon
		q("What is the official distance of a marathon in kilometers?", ["40.000 km", "41.295 km", "42.195 km", "43.195 km"], "42.195 km", 1),
		// https://en.wikipedia.org/wiki/Rowing_(sport)
		q("What is rowing often called in the United States?", ["Sculling", "Paddling", "Boating", "Crew"], "Crew", 1),
		// https://en.wikipedia.org/wiki/Table_tennis
		q("Since what year has table tennis been an Olympic sport?", ["1972", "1980", "1988", "1996"], "1988", 1),
		// https://en.wikipedia.org/wiki/Volleyball
		q("What was volleyball's original name, derived from badminton?", ["Mintonette", "Netball", "Batonette", "Pallone"], "Mintonette", 1),
		// https://en.wikipedia.org/wiki/Formula_One
		q("Which Alfa Romeo driver won the first Formula One Drivers' World Championship?", ["Alberto Ascari", "Jack Brabham", "Mike Hawthorn", "Giuseppe Farina"], "Giuseppe Farina", 1),
		// https://en.wikipedia.org/wiki/Golf
		q("What is golf's oldest tournament, first played in 1860 at Prestwick Golf Club?", ["The Masters", "The U.S. Open", "The Open Championship", "The PGA Championship"], "The Open Championship", 1),
		// https://en.wikipedia.org/wiki/Marathon
		q("Which Greek messenger's legendary run inspired the name of the marathon?", ["Leonidas", "Pheidippides", "Themistocles", "Miltiades"], "Pheidippides", 1),
		// https://en.wikipedia.org/wiki/Rowing_(sport)
		q("At which college was the first American college rowing club formed in 1843?", ["Harvard College", "Princeton College", "Columbia College", "Yale College"], "Yale College", 2),
		// https://en.wikipedia.org/wiki/Table_tennis
		q("In which country did table tennis originate as an after-dinner parlor game?", ["China", "Japan", "England", "France"], "England", 1),
		// https://en.wikipedia.org/wiki/Volleyball
		q("In which Massachusetts city was volleyball invented?", ["Worcester", "Holyoke", "Lowell", "Boston"], "Holyoke", 2),
		// https://en.wikipedia.org/wiki/Formula_One
		q("Which company acquired the commercial rights to Formula One in 2017?", ["Comcast Corporation", "Liberty Media Corporation", "Discovery Communications", "The Walt Disney Company"], "Liberty Media Corporation", 2),
		// https://en.wikipedia.org/wiki/Golf
		q("At which Scottish course was the standard 18-hole golf round created in 1764?", ["St Andrews", "Carnoustie", "Royal Troon", "Muirfield"], "St Andrews", 2),
		// https://en.wikipedia.org/wiki/113th_Grey_Cup
		q("Which team won the 113th Grey Cup on November 15, 2026?", ["Montreal Alouettes", "Calgary Stampeders", "Toronto Argonauts", "Edmonton Elks"], "Edmonton Elks", 1),
		// https://en.wikipedia.org/wiki/113th_Grey_Cup
		q("Who was named Most Valuable Player of the 113th Grey Cup in November 2026?", ["Justin Rankin", "Tyson Philpot", "Cody Fajardo", "Vincent Blanchard"], "Cody Fajardo", 1),
		// https://en.wikipedia.org/wiki/113th_Grey_Cup
		q("Who sang the national anthem at the 113th Grey Cup in November 2026?", ["Shania Twain", "Sarah McLachlan", "Céline Dion", "Alanis Morissette"], "Sarah McLachlan", 1),
		// https://en.wikipedia.org/wiki/2026_Canadian_Championship_final
		q("Which club won the 2026 Canadian Championship final on October 21, 2026?", ["CF Montréal", "Vancouver Whitecaps FC", "Forge FC", "Toronto FC"], "Forge FC", 1),
		// https://en.wikipedia.org/wiki/2026_Canadian_Championship_final
		q("Which stadium hosted the 2026 Canadian Championship final on October 21, 2026?", ["BMO Field", "BC Place", "Saputo Stadium", "Tim Hortons Field"], "Saputo Stadium", 1),
		// https://en.wikipedia.org/wiki/2026_Mamor%C3%A9-Uberl%C3%A2ndia_football_match_incident
		q("How many people got red cards in the Uberlândia v Mamoré under-20 match on 1 November 2026?", ["36", "27", "53", "44"], "53", 1),
		// https://en.wikipedia.org/wiki/2026_Rolex_Paris_Masters
		q("Who won the singles title at the 2026 Rolex Paris Masters in November 2026?", ["Jannik Sinner", "Alexander Zverev", "Carlos Alcaraz", "Novak Djokovic"], "Carlos Alcaraz", 1),
		// https://en.wikipedia.org/wiki/2026_Rolex_Paris_Masters
		q("Who lost the singles final of the 2026 Rolex Paris Masters in November 2026?", ["Taylor Fritz", "Ben Shelton", "Tommy Paul", "Daniil Medvedev"], "Ben Shelton", 1),
		// https://en.wikipedia.org/wiki/2026_U.S._Open_Cup_final
		q("Which club won the 2026 U.S. Open Cup final on penalties on October 21, 2026?", ["Columbus Crew", "St. Louis City SC", "Nashville SC", "Orlando City SC"], "St. Louis City SC", 1),
		// https://en.wikipedia.org/wiki/2026_WTA_Finals
		q("Who lost the singles final of the 2026 WTA Finals in November 2026?", ["Jasmine Paolini", "Elina Svitolina", "Jessica Pegula", "Elena Rybakina"], "Elina Svitolina", 1),
		// https://en.wikipedia.org/wiki/2026_WTA_Finals
		q("In which city were the 2026 WTA Finals played in November 2026?", ["Shenzhen", "Fort Worth", "Cancún", "Indian Wells"], "Indian Wells", 1),
		// https://en.wikipedia.org/wiki/2026_WTA_Finals
		q("Which pair won the doubles title at the 2026 WTA Finals in November 2026?", ["Sara Errani / Jasmine Paolini", "Elise Mertens / Veronika Kudermetova", "Gabriela Dabrowski / Erin Routliffe", "Kateřina Siniaková / Taylor Townsend"], "Kateřina Siniaková / Taylor Townsend", 1),
		// https://en.wikipedia.org/wiki/2026_Women%27s_Rugby_League_World_Cup
		q("Which nation won the 2026 Women's Rugby League World Cup, claiming its 4th title?", ["Australia", "England", "Papua New Guinea", "Samoa"], "Australia", 1),
		// https://en.wikipedia.org/wiki/2026_Women%27s_Rugby_League_World_Cup
		q("Who was the top try scorer at the 2026 Women's Rugby League World Cup, with 13 tries?", ["Jesse Southwell", "Tamika Upton", "Isabelle Kelly", "Jaime Chapman"], "Jaime Chapman", 1),
		// https://en.wikipedia.org/wiki/2026%E2%80%9327_UEFA_Nations_League_A
		q("As of 16 November 2026, who was the top scorer in the 2026–27 UEFA Nations League A, with 8 goals?", ["Kylian Mbappé", "Erling Haaland", "Lamine Yamal", "Harry Kane"], "Harry Kane", 1),
		// https://en.wikipedia.org/wiki/2026%E2%80%9327_UEFA_Nations_League_A
		q("Which team topped Group 1 of the 2026–27 UEFA Nations League A league phase with 13 points?", ["Portugal", "Germany", "France", "Spain"], "France", 1),
		// https://en.wikipedia.org/wiki/2027_Dakar_Rally
		q("After the October 2026 relocation, in which European country was the 2027 Dakar Rally set to start?", ["Spain", "France", "Portugal", "Italy"], "Portugal", 1),
		// https://en.wikipedia.org/wiki/2027_Dakar_Rally
		q("The 2027 Dakar Rally, relocated in October 2026, was set to return to Africa for the first time since which year?", ["2007", "2009", "2001", "2012"], "2007", 1),
		// https://en.wikipedia.org/wiki/Edmonton_Elks
		q("With their 2026 Grey Cup win, how many Grey Cup titles have the Edmonton Elks won in total?", ["12", "15", "14", "17"], "15", 1),
		// https://en.wikipedia.org/wiki/Mirra_Andreeva
		q("What was Mirra Andreeva's WTA singles ranking on 16 November 2026?", ["No. 1", "No. 3", "No. 5", "No. 2"], "No. 2", 1),
		// https://en.wikipedia.org/wiki/2026_NFL_season
		q("In Week 8 of the 2026 NFL season, which team won a game without completing a single pass?", ["Tampa Bay Buccaneers", "Atlanta Falcons", "Chicago Bears", "Pittsburgh Steelers"], "Tampa Bay Buccaneers", 2),
		// https://en.wikipedia.org/wiki/2026_WTA_Finals
		q("Who beat Elina Svitolina in the final to take the 2026 WTA Finals crown in November 2026?", ["Aryna Sabalenka", "Mirra Andreeva", "Coco Gauff", "Iga Świątek"], "Mirra Andreeva", 1),
		// https://en.wikipedia.org/wiki/2026_YellaWood_500
		q("Which Hendrick Motorsports driver won at Talladega Superspeedway on October 25, 2026?", ["Chase Elliott", "William Byron", "Alex Bowman", "Kyle Larson"], "Kyle Larson", 1),
	],
	political: [
		// https://en.wikipedia.org/wiki/Bundestag
		q("Who is the only official able to dissolve Germany's Bundestag, under certain conditions?", ["Chancellor of Germany", "President of Germany", "President of the Bundesrat", "President of the Bundestag"], "President of Germany", 2),
		// https://en.wikipedia.org/wiki/Constitution_of_the_United_States
		q("Which earlier document did the US Constitution supersede in 1789?", ["Declaration of Independence", "Mayflower Compact", "Treaty of Paris", "Articles of Confederation"], "Articles of Confederation", 2),
		// https://en.wikipedia.org/wiki/House_of_Lords
		q("In which London building does the House of Lords meet?", ["Buckingham Palace", "St James's Palace", "Lambeth Palace", "Palace of Westminster"], "Palace of Westminster", 1),
		// https://en.wikipedia.org/wiki/International_Court_of_Justice
		q("How many judges make up the panel of the International Court of Justice?", ["9", "12", "21", "15"], "15", 1),
		// https://en.wikipedia.org/wiki/United_States_Senate
		q("Which official serves as ex officio president of the United States Senate?", ["Vice president", "Speaker of the House", "Chief Justice", "Secretary of State"], "Vice president", 1),
		// https://en.wikipedia.org/wiki/World_Health_Organization
		q("Which disease's eradication is the World Health Organization's most notable achievement?", ["Polio", "Measles", "Malaria", "Smallpox"], "Smallpox", 1),
		// https://en.wikipedia.org/wiki/House_of_Lords
		q("What name is given to the Church of England bishops who sit in the UK's upper house?", ["Lords Temporal", "Law Lords", "Lords Spiritual", "Lords Ordinary"], "Lords Spiritual", 1),
		// https://en.wikipedia.org/wiki/International_Court_of_Justice
		q("How long is the term served by judges of the International Court of Justice?", ["Five years", "Seven years", "Nine years", "Twelve years"], "Nine years", 2),
		// https://en.wikipedia.org/wiki/United_States_Senate
		q("What 1787 deal gave each US state two senators regardless of population?", ["Missouri Compromise", "Three-Fifths Compromise", "Connecticut Compromise", "Virginia Plan"], "Connecticut Compromise", 2),
		// https://en.wikipedia.org/wiki/World_Health_Organization
		q("On what date was the World Health Organization established?", ["24 October 1945", "7 April 1948", "1 September 1946", "10 December 1948"], "7 April 1948", 2),
		// https://en.wikipedia.org/wiki/House_of_Lords
		q("What body replaced the House of Lords as the UK's final court of appeal in 2009?", ["Privy Council", "Court of Appeal", "Supreme Court", "High Court"], "Supreme Court", 2),
		// https://en.wikipedia.org/wiki/International_Court_of_Justice
		q("Which Russian tsar initiated the 1899 Hague Peace Conference, a forerunner of the ICJ?", ["Alexander II", "Alexander III", "Nicholas II", "Nicholas I"], "Nicholas II", 2),
		// https://en.wikipedia.org/wiki/World_Health_Organization
		q("Which disease was the main concern of the first International Sanitary Conference, a WHO forerunner?", ["Yellow fever", "Bubonic plague", "Cholera", "Typhoid"], "Cholera", 2),
		// https://en.wikipedia.org/wiki/2026_Alberta_independence_referendum
		q("Which option won Alberta's independence referendum question on October 19, 2026?", ["Remain in Canada", "Hold a referendum", "Separate from Canada", "Join the United States"], "Remain in Canada", 1),
		// https://en.wikipedia.org/wiki/2026_Alberta_independence_referendum
		q("What share of valid votes did 'Remain' win in Alberta's October 19, 2026 independence vote?", ["51.20%", "62.40%", "74.95%", "88.10%"], "74.95%", 1),
		// https://en.wikipedia.org/wiki/2026_Cape_Verdean_presidential_election
		q("Who won Cape Verde's presidential election held on 15 November 2026?", ["Ulisses Correia e Silva", "Francisco Carvalho", "Pedro Pires", "José Maria Neves"], "José Maria Neves", 1),
		// https://en.wikipedia.org/wiki/2026_Cape_Verdean_presidential_election
		q("About what share of the vote did José Maria Neves win in Cape Verde's 15 November 2026 election?", ["About 51%", "About 45%", "About 75%", "About 64%"], "About 64%", 1),
		// https://en.wikipedia.org/wiki/2026_Israeli_legislative_election
		q("Which party won the most Knesset seats in Israel's 27 October 2026 election?", ["Likud", "Yashar", "Yesh Atid", "Shas"], "Likud", 1),
		// https://en.wikipedia.org/wiki/2026_Israeli_legislative_election
		q("Who led the new Yashar party in Israel's October 2026 legislative election?", ["Gadi Eisenkot", "Benny Gantz", "Yair Lapid", "Gideon Sa'ar"], "Gadi Eisenkot", 1),
		// https://en.wikipedia.org/wiki/2026_Israeli_legislative_election
		q("What was the name of Naftali Bennett's new party in Israel's October 2026 election?", ["New Hope", "Yamina", "Together", "National Unity"], "Together", 1),
		// https://en.wikipedia.org/wiki/2026_Texas_gubernatorial_election
		q("Which incumbent governor lost the November 2026 Texas gubernatorial election?", ["Rick Perry", "Dan Patrick", "Ken Paxton", "Greg Abbott"], "Greg Abbott", 1),
		// https://en.wikipedia.org/wiki/2026_Texas_gubernatorial_election
		q("About what share of the vote did Gina Hinojosa win in Texas's November 2026 governor's race?", ["About 46%", "About 53%", "About 60%", "About 49%"], "About 53%", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Kansas
		q("Who won the U.S. Senate election in Kansas on November 3, 2026?", ["Laura Kelly", "Sharice Davids", "Adam Hamilton", "Jerry Moran"], "Adam Hamilton", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Kansas
		q("Adam Hamilton's November 2026 win made him Kansas's first Democratic senator-elect since what year?", ["1960", "1978", "1912", "1932"], "1932", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Kansas
		q("What was Adam Hamilton's profession when he won Kansas's Senate race in November 2026?", ["Farmer", "Pastor", "Surgeon", "Football coach"], "Pastor", 1),
		// https://en.wikipedia.org/wiki/James_Talarico
		q("James Talarico's 2026 win made him Texas's first Democrat to win a U.S. Senate race since what year?", ["1976", "1994", "1964", "1988"], "1988", 1),
		// https://en.wikipedia.org/wiki/Novaya_Gazeta
		q("Which independent Russian newspaper ceased publication on 9 November 2026?", ["Kommersant", "Izvestia", "Novaya Gazeta", "Vedomosti"], "Novaya Gazeta", 1),
		// https://en.wikipedia.org/wiki/Novaya_Gazeta
		q("When Novaya Gazeta closed in November 2026, what reason did it give?", ["Bankruptcy and unpaid debts", "Sale to a state company", "Retirement of its editor", "Repression by Russian authorities"], "Repression by Russian authorities", 1),
		// https://en.wikipedia.org/wiki/Pedro_Alliana
		q("Who became President of Paraguay on 6 November 2026?", ["Pedro Alliana", "Horacio Cartes", "Mario Abdo Benítez", "Efraín Alegre"], "Pedro Alliana", 1),
		// https://en.wikipedia.org/wiki/Pedro_Alliana
		q("Which impeached Paraguayan president did Pedro Alliana replace in November 2026?", ["Santiago Peña", "Mario Abdo Benítez", "Horacio Cartes", "Fernando Lugo"], "Santiago Peña", 1),
		// https://en.wikipedia.org/wiki/Pedro_Alliana
		q("Which bank's failure caused the crisis behind Pedro Alliana becoming Paraguay's president in November 2026?", ["Banco Itaú", "Banco Continental", "Ueno Bank", "Banco Basa"], "Ueno Bank", 1),
		// https://en.wikipedia.org/wiki/Christine_Lagarde
		q("In October 2026, Christine Lagarde confirmed she would leave which post eight months early?", ["Managing Director of the IMF", "Governor of the Banque de France", "President of the Eurogroup", "President of the European Central Bank"], "President of the European Central Bank", 2),
	],
	food: [
		// https://en.wikipedia.org/wiki/Banana
		q("Where were banana plants probably first domesticated?", ["Madagascar", "Sri Lanka", "Borneo", "New Guinea"], "New Guinea", 1),
		// https://en.wikipedia.org/wiki/Maple_syrup
		q("Who first made maple syrup?", ["Viking explorers", "French settlers", "Dutch colonists", "Indigenous peoples"], "Indigenous peoples", 1),
		// https://en.wikipedia.org/wiki/Potato
		q("Which people first introduced potatoes to Europe, in the 16th century?", ["The Portuguese", "The English", "The Spanish", "The Dutch"], "The Spanish", 1),
		// https://en.wikipedia.org/wiki/Salt
		q("Salt is composed primarily of which chemical compound?", ["Potassium chloride", "Calcium carbonate", "Sodium bicarbonate", "Sodium chloride"], "Sodium chloride", 1),
		// https://en.wikipedia.org/wiki/Tofu
		q("In which country did tofu originate?", ["Japan", "Korea", "China", "Vietnam"], "China", 1),
		// https://en.wikipedia.org/wiki/Yogurt
		q("Yogurt is produced by the bacterial fermentation of what?", ["Milk", "Soybeans", "Grain", "Fruit juice"], "Milk", 1),
		// https://en.wikipedia.org/wiki/Banana
		q("In some countries, what are cooking bananas called to distinguish them from dessert bananas?", ["Breadfruits", "Cassavas", "Taros", "Plantains"], "Plantains", 1),
		// https://en.wikipedia.org/wiki/Maple_syrup
		q("What is the most prevalent sugar in maple syrup?", ["Fructose", "Glucose", "Sucrose", "Lactose"], "Sucrose", 1),
		// https://en.wikipedia.org/wiki/Potato
		q("The potato plant belongs to which plant family?", ["Rose family", "Mustard family", "Nightshade family", "Grass family"], "Nightshade family", 1),
		// https://en.wikipedia.org/wiki/Salt
		q("As a natural crystalline mineral, rock salt is also known by what name?", ["Halite", "Calcite", "Gypsum", "Quartz"], "Halite", 1),
		// https://en.wikipedia.org/wiki/Tofu
		q("Chinese legend credits which Han dynasty prince with inventing tofu?", ["Liu Bang", "Liu An", "Cao Cao", "Sun Quan"], "Liu An", 2),
		// https://en.wikipedia.org/wiki/Yogurt
		q("Which acid do bacteria produce that gives yogurt its tart flavor?", ["Citric acid", "Lactic acid", "Acetic acid", "Malic acid"], "Lactic acid", 2),
		// https://en.wikipedia.org/wiki/Banana
		q("Which serious banana disease is caused by a Fusarium fungus?", ["Panama disease", "Dutch elm disease", "Late blight", "Black rot"], "Panama disease", 2),
		// https://en.wikipedia.org/wiki/Maple_syrup
		q("In Canada, what minimum sugar content must maple syrup have?", ["50 percent", "58 percent", "66 percent", "75 percent"], "66 percent", 2),
		// https://en.wikipedia.org/wiki/Instacart
		q("Which company announced plans in October 2026 to acquire Instacart?", ["Uber", "Amazon", "Walmart", "DoorDash"], "DoorDash", 1),
		// https://en.wikipedia.org/wiki/Instacart
		q("In October 2026, roughly how much was DoorDash's announced deal to acquire Instacart worth?", ["$9 billion", "$25 billion", "$39 billion", "$17 billion"], "$17 billion", 1),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Art_Deco
		q("Which US city has the world's largest concentration of Art Deco architecture?", ["Chicago", "Miami Beach", "Los Angeles", "Boston"], "Miami Beach", 1),
		// https://en.wikipedia.org/wiki/Claude_Monet
		q("In which French village did Claude Monet create his famous water-lily pond?", ["Argenteuil", "Barbizon", "Honfleur", "Giverny"], "Giverny", 1),
		// https://en.wikipedia.org/wiki/Frida_Kahlo
		q("What is the name of Frida Kahlo's family home in Coyoacán?", ["La Casa Roja", "Casa Luis Barragán", "La Casa Azul", "La Casa Verde"], "La Casa Azul", 1),
		// https://en.wikipedia.org/wiki/Opera
		q("What is the literal English translation of the Italian word \"opera\"?", ["Song", "Work", "Stage", "Story"], "Work", 1),
		// https://en.wikipedia.org/wiki/Rembrandt
		q("In which Dutch city was Rembrandt born?", ["Leiden", "Delft", "Haarlem", "Utrecht"], "Leiden", 1),
		// https://en.wikipedia.org/wiki/The_Starry_Night
		q("Which planet appears in the sky of Van Gogh's The Starry Night?", ["Mars", "Venus", "Jupiter", "Saturn"], "Venus", 2),
		// https://en.wikipedia.org/wiki/Art_Deco
		q("Which historian published the first major academic book on Art Deco in 1968?", ["Bevis Hillier", "Nikolaus Pevsner", "Kenneth Clark", "Ernst Gombrich"], "Bevis Hillier", 2),
		// https://en.wikipedia.org/wiki/Claude_Monet
		q("Which artist introduced the young Claude Monet to plein air painting?", ["Édouard Manet", "Eugène Boudin", "Camille Pissarro", "Gustave Courbet"], "Eugène Boudin", 2),
		// https://en.wikipedia.org/wiki/Frida_Kahlo
		q("Which Frida Kahlo painting did the Louvre purchase after her 1939 Paris exhibition?", ["The Two Fridas", "The Broken Column", "Self-Portrait with Monkey", "The Frame"], "The Frame", 2),
		// https://en.wikipedia.org/wiki/Opera
		q("What term, meaning \"small book\", refers to the words of an opera?", ["Aria", "Overture", "Recitative", "Libretto"], "Libretto", 1),
		// https://en.wikipedia.org/wiki/Rembrandt
		q("What was the occupation of Rembrandt's father?", ["Miller", "Baker", "Merchant", "Lawyer"], "Miller", 1),
		// https://en.wikipedia.org/wiki/Claude_Monet
		q("Which French cathedral did Claude Monet paint in a series from 1892 to 1894?", ["Chartres Cathedral", "Reims Cathedral", "Rouen Cathedral", "Amiens Cathedral"], "Rouen Cathedral", 2),
		// https://en.wikipedia.org/wiki/Frida_Kahlo
		q("Which surrealist arranged Frida Kahlo's first solo exhibition in New York in 1938?", ["Salvador Dalí", "Max Ernst", "André Breton", "Man Ray"], "André Breton", 2),
		// https://en.wikipedia.org/wiki/Opera
		q("Which composer wrote the early opera L'Orfeo?", ["Henry Purcell", "Jean-Baptiste Lully", "Antonio Vivaldi", "Claudio Monteverdi"], "Claudio Monteverdi", 2),
	],
	science: [
		// https://en.wikipedia.org/wiki/Atom
		q("What does the ancient Greek word atomos, the root of the word atom, mean?", ["Invisible", "Eternal", "Smallest", "Uncuttable"], "Uncuttable", 1),
		// https://en.wikipedia.org/wiki/Electricity
		q("The word electricity comes from the Greek word elektron, meaning what material?", ["Copper", "Lightning", "Iron", "Amber"], "Amber", 1),
		// https://en.wikipedia.org/wiki/Mars
		q("What is the name of the tallest extinct volcano on Mars?", ["Mauna Kea", "Olympus Mons", "Elysium Planitia", "Hellas Basin"], "Olympus Mons", 2),
		// https://en.wikipedia.org/wiki/Moon
		q("Which mission first put humans on the Moon's surface in July 1969?", ["Apollo 8", "Apollo 11", "Apollo 13", "Gemini 4"], "Apollo 11", 1),
		// https://en.wikipedia.org/wiki/Speed_of_light
		q("What famous mass–energy equivalence equation includes the speed of light?", ["F = ma", "E = mc²", "E = hf", "V = IR"], "E = mc²", 1),
		// https://en.wikipedia.org/wiki/X-ray
		q("What common medical check is X-ray radiography widely used for?", ["Checking for broken bones", "Measuring blood pressure", "Testing hearing", "Checking eyesight"], "Checking for broken bones", 1),
		// https://en.wikipedia.org/wiki/Atom
		q("What is an atom with an overall electric charge called?", ["An isotope", "A molecule", "A nucleon", "An ion"], "An ion", 1),
		// https://en.wikipedia.org/wiki/Electricity
		q("Which English scientist wrote De Magnete in 1600?", ["Robert Boyle", "Isaac Newton", "William Gilbert", "Stephen Gray"], "William Gilbert", 2),
		// https://en.wikipedia.org/wiki/Mars
		q("What is the name of the huge 4,000 km canyon on Mars?", ["Olympus Mons", "Tharsis Rise", "Utopia Planitia", "Valles Marineris"], "Valles Marineris", 2),
		// https://en.wikipedia.org/wiki/Moon
		q("Roughly what fraction of Earth's surface gravity does the Moon have?", ["One-third", "One-sixth", "One-half", "One-tenth"], "One-sixth", 1),
		// https://en.wikipedia.org/wiki/Speed_of_light
		q("Ole Rømer showed light is not instantaneous by studying which moon of Jupiter?", ["Europa", "Io", "Ganymede", "Callisto"], "Io", 2),
		// https://en.wikipedia.org/wiki/X-ray
		q("Who is thought to be the earliest experimenter to have unknowingly produced X-rays, in 1785?", ["Joseph Priestley", "Henry Cavendish", "William Morgan", "Alessandro Volta"], "William Morgan", 2),
		// https://en.wikipedia.org/wiki/Atom
		q("Which Greek philosopher was the pupil of Leucippus and helped develop the idea of atoms?", ["Aristotle", "Democritus", "Empedocles", "Pythagoras"], "Democritus", 2),
		// https://en.wikipedia.org/wiki/Moon
		q("What are the Moon's dark plains of basalt called?", ["Regolith", "Rilles", "Highlands", "Maria"], "Maria", 2),
		// https://en.wikipedia.org/wiki/Starship_flight_15
		q("On November 14, 2026, which Starship upper stage did the launch tower catch on Flight 15?", ["Ship 42", "Ship 41", "Ship 39", "Ship 44"], "Ship 42", 1),
		// https://en.wikipedia.org/wiki/Starship_flight_15
		q("What words were inscribed on the ship flown on Starship Flight 15 in November 2026?", ["Ad Astra", "Occupy Mars", "Godspeed", "Don't Panic"], "Don't Panic", 1),
	],
	history: [
		// https://en.wikipedia.org/wiki/Black_Death
		q("What bacterium caused the Black Death?", ["Vibrio cholerae", "Bacillus anthracis", "Yersinia pestis", "Salmonella typhi"], "Yersinia pestis", 1),
		// https://en.wikipedia.org/wiki/Byzantine_Empire
		q("Which empire captured Constantinople in 1453, ending the Byzantine Empire?", ["Ottoman Empire", "Mongol Empire", "Persian Empire", "Holy Roman Empire"], "Ottoman Empire", 1),
		// https://en.wikipedia.org/wiki/Great_Wall_of_China
		q("In what year was the Great Wall of China voted one of the New 7 Wonders of the World?", ["2000", "2007", "2005", "2010"], "2007", 1),
		// https://en.wikipedia.org/wiki/Mongol_Empire
		q("What Latin name describes the enforced peace across the Mongol Empire that enabled trade?", ["Pax Romana", "Pax Britannica", "Pax Sinica", "Pax Mongolica"], "Pax Mongolica", 1),
		// https://en.wikipedia.org/wiki/Napoleon
		q("What territory did Napoleon sell to the United States in 1803?", ["Florida", "Texas", "Alaska", "Louisiana"], "Louisiana", 2),
		// https://en.wikipedia.org/wiki/Printing_press
		q("What was the trade of Johannes Gutenberg, inventor of the printing press?", ["Blacksmith", "Papermaker", "Bookbinder", "Goldsmith"], "Goldsmith", 1),
		// https://en.wikipedia.org/wiki/Black_Death
		q("How was the bacterium behind the Black Death primarily spread?", ["Mosquito bites", "Tick bites", "Contaminated water", "Flea bites"], "Flea bites", 1),
		// https://en.wikipedia.org/wiki/Byzantine_Empire
		q("Under which emperor did the Byzantine Empire reach its greatest extent?", ["Leo III", "Justinian I", "Heraclius", "Michael VIII"], "Justinian I", 2),
		// https://en.wikipedia.org/wiki/Great_Wall_of_China
		q("In which dynasty were the early walls of the Great Wall of China first joined together?", ["Han dynasty", "Zhou dynasty", "Qin dynasty", "Song dynasty"], "Qin dynasty", 2),
		// https://en.wikipedia.org/wiki/Mongol_Empire
		q("What dynastic name did Kublai Khan give his empire by edict in 1271?", ["Great Ming", "Great Qing", "Great Jin", "Great Yuan"], "Great Yuan", 2),
		// https://en.wikipedia.org/wiki/Napoleon
		q("On which remote South Atlantic island did Napoleon die in exile?", ["Ascension Island", "Saint Helena", "Madeira", "Tristan da Cunha"], "Saint Helena", 2),
		// https://en.wikipedia.org/wiki/Printing_press
		q("Which Chinese artisan invented the first movable type in the 11th century?", ["Bi Sheng", "Wang Zhen", "Cai Lun", "Shen Kuo"], "Bi Sheng", 2),
		// https://en.wikipedia.org/wiki/Black_Death
		q("What 1315–1317 disaster struck Europe before the Black Death?", ["The Great Famine", "The Great Flood", "The Great Earthquake", "The Great Fire"], "The Great Famine", 2),
		// https://en.wikipedia.org/wiki/Byzantine_Empire
		q("During which crusade was Constantinople sacked in 1204?", ["First Crusade", "Fourth Crusade", "Second Crusade", "Third Crusade"], "Fourth Crusade", 2),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Bat
		q("What ability makes bats unique among all mammals?", ["Night vision", "True sustained flight", "Venom production", "Electric sensing"], "True sustained flight", 1),
		// https://en.wikipedia.org/wiki/Elephant
		q("What is the leader of a female elephant group, usually the oldest cow, called?", ["Matriarch", "Alpha", "Dowager", "Herdmistress"], "Matriarch", 1),
		// https://en.wikipedia.org/wiki/Monarch_butterfly
		q("Which smaller butterfly is a Müllerian mimic of the monarch butterfly?", ["Painted lady", "Viceroy", "Red admiral", "Swallowtail"], "Viceroy", 1),
		// https://en.wikipedia.org/wiki/Octopus
		q("Which octopuses are the only ones known to be deadly to humans?", ["Giant Pacific", "Seven-arm", "Common mimic", "Blue-ringed"], "Blue-ringed", 1),
		// https://en.wikipedia.org/wiki/Sequoia_sempervirens
		q("Besides the southwestern corner of Oregon, coast redwoods grow naturally along the coast of which US state?", ["California", "Washington", "Alaska", "Maine"], "California", 1),
		// https://en.wikipedia.org/wiki/Wolf
		q("What is the scientific name of the gray wolf?", ["Canis lupus", "Canis latrans", "Canis aureus", "Vulpes vulpes"], "Canis lupus", 1),
		// https://en.wikipedia.org/wiki/Bat
		q("What is bat dung mined from caves and used as fertilizer called?", ["Guano", "Marl", "Humus", "Peat"], "Guano", 1),
		// https://en.wikipedia.org/wiki/Elephant
		q("Elephant tusks are derived from which type of teeth?", ["Canines", "Molars", "Premolars", "Incisors"], "Incisors", 1),
		// https://en.wikipedia.org/wiki/Monarch_butterfly
		q("Which entomologist suggested in 1874 that the butterfly Danaus plexippus be named \"The Monarch\"?", ["Samuel Hubbard Scudder", "Philip Henry Gosse", "Jan Krzysztof Kluk", "Charles Darwin"], "Samuel Hubbard Scudder", 2),
		// https://en.wikipedia.org/wiki/Octopus
		q("Which Victor Hugo book features a battle with an octopus?", ["Toilers of the Sea", "Les Misérables", "Ninety-Three", "Notre-Dame de Paris"], "Toilers of the Sea", 1),
		// https://en.wikipedia.org/wiki/Sequoia_sempervirens
		q("To which plant family does Sequoia sempervirens belong?", ["Cypress family", "Pine family", "Yew family", "Beech family"], "Cypress family", 1),
		// https://en.wikipedia.org/wiki/Wolf
		q("Most recorded wolf attacks on people involve wolves suffering from which disease?", ["Distemper", "Mange", "Lyme disease", "Rabies"], "Rabies", 1),
		// https://en.wikipedia.org/wiki/Bat
		q("The bat order name Chiroptera comes from Ancient Greek words meaning what?", ["Night flyer", "Leather wing", "Hand wing", "Dark mouse"], "Hand wing", 2),
		// https://en.wikipedia.org/wiki/Elephant
		q("What is the state of increased testosterone and aggression in bull elephants called?", ["Rut", "Estrus", "Musth", "Torpor"], "Musth", 2),
		// https://en.wikipedia.org/wiki/2026_United_Nations_Climate_Change_Conference
		q("In which Turkish city did the COP31 climate conference open in November 2026?", ["Antalya", "Istanbul", "Ankara", "Izmir"], "Antalya", 1),
		// https://en.wikipedia.org/wiki/2026_United_Nations_Climate_Change_Conference
		q("Which Turkish minister was COP President at COP31, held in Antalya in November 2026?", ["Hakan Fidan", "Murat Kurum", "Mehmet Şimşek", "Fatih Dönmez"], "Murat Kurum", 1),
		// https://en.wikipedia.org/wiki/Earthshot_Prize
		q("Which Indian city hosted the sixth Earthshot Prize awards ceremony on 17 November 2026?", ["New Delhi", "Bengaluru", "Mumbai", "Kolkata"], "Mumbai", 1),
	],
	games: [
		// https://en.wikipedia.org/wiki/Checkers
		q("In checkers, what does a man become when it reaches the farthest row forward?", ["A queen", "A king", "A knight", "A bishop"], "A king", 1),
		// https://en.wikipedia.org/wiki/Cluedo
		q("Which company first manufactured Cluedo in the United Kingdom in 1949?", ["Parker Brothers", "Waddingtons", "Milton Bradley", "Spear's Games"], "Waddingtons", 2),
		// https://en.wikipedia.org/wiki/Jenga
		q("At which event did Leslie Scott launch Jenga in January 1983?", ["Nuremberg Toy Fair", "London Toy Fair", "New York Toy Fair", "Essen Game Fair"], "London Toy Fair", 2),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("In the board game Risk, what determines the results of attacks on territories?", ["Dice rolls", "Card draws", "A spinner", "Secret bids"], "Dice rolls", 1),
		// https://en.wikipedia.org/wiki/Rubik%27s_Cube
		q("What nationality was Ernő Rubik, inventor of the Rubik's Cube?", ["Czech", "Polish", "Austrian", "Hungarian"], "Hungarian", 1),
		// https://en.wikipedia.org/wiki/Sonic_the_Hedgehog
		q("Which mad scientist is Sonic the Hedgehog's main enemy?", ["Doctor Eggman", "Doctor Wily", "Doctor Neo Cortex", "Professor Hojo"], "Doctor Eggman", 1),
		// https://en.wikipedia.org/wiki/Checkers
		q("Which older board game was checkers developed from?", ["Alquerque", "Mancala", "Senet", "Nine men's morris"], "Alquerque", 2),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("In which country was the board game Risk originally released in 1957?", ["Germany", "France", "United States", "Italy"], "France", 1),
		// https://en.wikipedia.org/wiki/Rubik%27s_Cube
		q("In what year did Ernő Rubik invent the Rubik's Cube?", ["1974", "1968", "1980", "1985"], "1974", 1),
		// https://en.wikipedia.org/wiki/Sonic_the_Hedgehog
		q("What animal was the Sonic the Hedgehog protagonist initially going to be?", ["A fox", "A rabbit", "A penguin", "A squirrel"], "A rabbit", 2),
		// https://en.wikipedia.org/wiki/Checkers
		q("Who led the team that weakly solved American checkers in 2007?", ["Garry Kasparov", "Claude Shannon", "Jonathan Schaeffer", "Alan Turing"], "Jonathan Schaeffer", 2),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("Which company bought Risk and released it in 1959 as Risk: The Continental Game?", ["Parker Brothers", "Milton Bradley", "Waddingtons", "Avalon Hill"], "Parker Brothers", 2),
		// https://en.wikipedia.org/wiki/2026_League_of_Legends_World_Championship
		q("Which team won the League of Legends World Championship final on 14 November 2026?", ["Bilibili Gaming", "Gen.G", "T1", "Top Esports"], "Bilibili Gaming", 1),
		// https://en.wikipedia.org/wiki/2026_League_of_Legends_World_Championship
		q("Which LCK team lost the 2026 League of Legends World Championship final in November 2026?", ["T1", "Hanwha Life Esports", "Dplus KIA", "Gen.G"], "Gen.G", 1),
		// https://en.wikipedia.org/wiki/2026_League_of_Legends_World_Championship
		q("Which player was named MVP of the 2026 League of Legends World Championship final in November 2026?", ["Lee \"Faker\" Sang-hyeok", "Jeong \"Chovy\" Ji-hoon", "Zhuo \"Knight\" Ding", "Kurtis \"Toyz\" Lau"], "Zhuo \"Knight\" Ding", 1),
		// https://en.wikipedia.org/wiki/The_Game_Awards_2026
		q("Which game received the most nominations when The Game Awards 2026 nominees were announced in November 2026?", ["Grand Theft Auto VI", "Resident Evil Requiem", "Control Resonant", "Phantom Blade Zero"], "Grand Theft Auto VI", 1),
		// https://en.wikipedia.org/wiki/The_Game_Awards_2026
		q("How many nominations did Grand Theft Auto VI get for The Game Awards 2026, announced in November 2026?", ["5", "8", "6", "11"], "8", 1),
		// https://en.wikipedia.org/wiki/National_Toy_Hall_of_Fame
		q("Which game was inducted into the National Toy Hall of Fame on November 5, 2026?", ["Bingo", "Mahjong", "Yahtzee", "Sorry!"], "Bingo", 2),
		// https://en.wikipedia.org/wiki/National_Toy_Hall_of_Fame
		q("Which toy line was inducted into the National Toy Hall of Fame in November 2026?", ["Polly Pocket", "Care Bears", "Monster High", "Tickle Me Elmo"], "Care Bears", 2),
		// https://en.wikipedia.org/wiki/2026_League_of_Legends_World_Championship
		q("Where was the League of Legends World Championship final played on 14 November 2026?", ["Los Angeles", "New York City", "Allen, Texas", "Chicago"], "New York City", 1),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Dolly_Parton
		q("In which TV series did Dolly Parton play the role of Aunt Dolly?", ["Lizzie McGuire", "Hannah Montana", "iCarly", "Wizards of Waverly Place"], "Hannah Montana", 1),
		// https://en.wikipedia.org/wiki/Julia_Roberts
		q("For which film did Julia Roberts win the Academy Award for Best Actress?", ["Pretty Woman", "Erin Brockovich", "Notting Hill", "Steel Magnolias"], "Erin Brockovich", 1),
		// https://en.wikipedia.org/wiki/Leonardo_DiCaprio
		q("Which 1997 film, the highest-grossing film in the world at the time, starred Leonardo DiCaprio?", ["Titanic", "Jurassic Park", "Armageddon", "Independence Day"], "Titanic", 1),
		// https://en.wikipedia.org/wiki/Robert_De_Niro
		q("Which film festival did Robert De Niro co-found with Jane Rosenthal in 2002?", ["Sundance Film Festival", "Telluride Film Festival", "Tribeca Film Festival", "SXSW Film Festival"], "Tribeca Film Festival", 1),
		// https://en.wikipedia.org/wiki/Samuel_L._Jackson
		q("Which Jedi did Samuel L. Jackson play in the Star Wars prequel trilogy?", ["Qui-Gon Jinn", "Plo Koon", "Ki-Adi-Mundi", "Mace Windu"], "Mace Windu", 1),
		// https://en.wikipedia.org/wiki/Viola_Davis
		q("For which 2016 film did Viola Davis win the Academy Award for Best Supporting Actress?", ["The Help", "Fences", "Doubt", "Widows"], "Fences", 1),
		// https://en.wikipedia.org/wiki/Dolly_Parton
		q("Which Dolly Parton duet with Kenny Rogers reached No. 1 on the Billboard Hot 100?", ["The Gambler", "Lady", "Islands in the Stream", "Coward of the County"], "Islands in the Stream", 2),
		// https://en.wikipedia.org/wiki/Julia_Roberts
		q("What did Julia Roberts want to be as a child?", ["A veterinarian", "An astronaut", "A teacher", "A lawyer"], "A veterinarian", 1),
		// https://en.wikipedia.org/wiki/Leonardo_DiCaprio
		q("In which museum did Leonardo DiCaprio's pregnant mother first feel him kick, inspiring his name?", ["The Louvre", "The Prado", "The Vatican Museums", "The Uffizi"], "The Uffizi", 2),
		// https://en.wikipedia.org/wiki/Robert_De_Niro
		q("Which real-life figure did Robert De Niro portray in Raging Bull?", ["Rocky Marciano", "Jake LaMotta", "Rocky Graziano", "Sugar Ray Robinson"], "Jake LaMotta", 2),
		// https://en.wikipedia.org/wiki/Samuel_L._Jackson
		q("Which character has Samuel L. Jackson played in Marvel Cinematic Universe films, starting with Iron Man?", ["James Rhodes", "Phil Coulson", "Sam Wilson", "Nick Fury"], "Nick Fury", 1),
		// https://en.wikipedia.org/wiki/Viola_Davis
		q("Which DC character did Viola Davis play starting with Suicide Squad?", ["Harley Quinn", "Lois Lane", "Amanda Waller", "Selina Kyle"], "Amanda Waller", 2),
		// https://en.wikipedia.org/wiki/Julia_Roberts
		q("In which US city was Julia Roberts born?", ["Nashville", "Atlanta", "Charlotte", "Birmingham"], "Atlanta", 2),
		// https://en.wikipedia.org/wiki/Leonardo_DiCaprio
		q("Which film marked Leonardo DiCaprio's first collaboration with director Martin Scorsese?", ["The Departed", "Gangs of New York", "Shutter Island", "The Aviator"], "Gangs of New York", 2),
		// https://en.wikipedia.org/wiki/Robert_De_Niro
		q("What childhood nickname did Robert De Niro get because of his pale complexion?", ["Bobby Chalk", "Bobby Ghost", "Bobby Milk", "Bobby Snow"], "Bobby Milk", 2),
		// https://en.wikipedia.org/wiki/Samuel_L._Jackson
		q("Which superhero did Samuel L. Jackson voice in Pixar's The Incredibles?", ["Syndrome", "Gazerbeam", "Mr. Incredible", "Frozone"], "Frozone", 2),
		// https://en.wikipedia.org/wiki/Viola_Davis
		q("What is the title of Viola Davis's 2022 memoir, whose audiobook won a Grammy?", ["Becoming", "Unbreakable", "Just Me", "Finding Me"], "Finding Me", 2),
		// https://en.wikipedia.org/wiki/Julia_Roberts
		q("What is the name of Julia Roberts' production company?", ["Plan B Entertainment", "Red Om Films", "Hello Sunshine", "Pacific Standard"], "Red Om Films", 2),
		// https://en.wikipedia.org/wiki/Samuel_L._Jackson
		q("Samuel L. Jackson became a naturalized citizen of which African country in 2019?", ["Gabon", "Ghana", "Senegal", "Cameroon"], "Gabon", 2),
		// https://en.wikipedia.org/wiki/Jensen_Huang
		q("In November 2026, who became Nvidia's interim CEO after Jensen Huang resigned?", ["Lisa Su", "Chris Malachowsky", "Curtis Priem", "Colette Kress"], "Colette Kress", 1),
		// https://en.wikipedia.org/wiki/Jensen_Huang
		q("In November 2026, Jensen Huang resigned as president and CEO of which tech company?", ["Nvidia", "AMD", "Intel", "Qualcomm"], "Nvidia", 1),
		// https://en.wikipedia.org/wiki/People_(magazine)
		q("Who did People magazine name its Sexiest Man Alive for 2026?", ["Noah Wyle", "Jonathan Bailey", "Glen Powell", "Pedro Pascal"], "Noah Wyle", 1),
	],
	music: [
		// https://en.wikipedia.org/wiki/ABBA
		q("What 1999 stage musical was adapted from ABBA's music?", ["Chess", "Jersey Boys", "We Will Rock You", "Mamma Mia!"], "Mamma Mia!", 1),
		// https://en.wikipedia.org/wiki/David_Bowie
		q("Which 1969 single gave David Bowie his first success?", ["Starman", "Life on Mars?", "Changes", "Space Oddity"], "Space Oddity", 1),
		// https://en.wikipedia.org/wiki/Johann_Sebastian_Bach
		q("In which musical period did composer Johann Sebastian Bach work?", ["Classical", "Romantic", "Renaissance", "Baroque"], "Baroque", 1),
		// https://en.wikipedia.org/wiki/Louis_Armstrong
		q("Which mentor did Louis Armstrong follow to Chicago around 1922?", ["Joe \"King\" Oliver", "Jelly Roll Morton", "Sidney Bechet", "Kid Ory"], "Joe \"King\" Oliver", 2),
		// https://en.wikipedia.org/wiki/Saxophone
		q("What metal is the saxophone usually made of?", ["Silver", "Brass", "Copper", "Steel"], "Brass", 1),
		// https://en.wikipedia.org/wiki/Stevie_Wonder
		q("As a teenager at Motown, Stevie Wonder was known for his excited playing of which instrument?", ["Trumpet", "Saxophone", "Violin", "Harmonica"], "Harmonica", 1),
		// https://en.wikipedia.org/wiki/ABBA
		q("In which city was the Swedish pop group ABBA formed in 1972?", ["Gothenburg", "Stockholm", "Malmö", "Uppsala"], "Stockholm", 2),
		// https://en.wikipedia.org/wiki/David_Bowie
		q("Which character brought David Bowie his major commercial breakthrough in 1972?", ["Major Tom", "Aladdin Sane", "Halloween Jack", "Ziggy Stardust"], "Ziggy Stardust", 1),
		// https://en.wikipedia.org/wiki/Johann_Sebastian_Bach
		q("In which city was Johann Sebastian Bach hired as Thomaskantor by 1723?", ["Dresden", "Berlin", "Hamburg", "Leipzig"], "Leipzig", 1),
		// https://en.wikipedia.org/wiki/Louis_Armstrong
		q("Which song won Louis Armstrong the 1965 Grammy for Best Male Vocal Performance?", ["What a Wonderful World", "Hello, Dolly!", "La Vie en rose", "Mack the Knife"], "Hello, Dolly!", 2),
		// https://en.wikipedia.org/wiki/Saxophone
		q("What kind of reed setup does the saxophone use?", ["Double reed", "Free reed", "No reed", "Single reed"], "Single reed", 2),
		// https://en.wikipedia.org/wiki/Stevie_Wonder
		q("In 1980, Stevie Wonder campaigned to make whose birthday a US federal holiday?", ["Malcolm X", "Rosa Parks", "Martin Luther King Jr.", "Frederick Douglass"], "Martin Luther King Jr.", 1),
		// https://en.wikipedia.org/wiki/David_Bowie
		q("Which hard rock band did David Bowie front from 1988 to 1992?", ["The Spiders", "Tin Machine", "Iron Butterfly", "Steel Pulse"], "Tin Machine", 2),
		// https://en.wikipedia.org/wiki/Johann_Sebastian_Bach
		q("In which town was Johann Sebastian Bach born?", ["Weimar", "Arnstadt", "Eisenach", "Lüneburg"], "Eisenach", 2),
		// https://en.wikipedia.org/wiki/Stevie_Wonder
		q("Which Motown label signed Stevie Wonder at the age of 11?", ["Tamla", "Gordy", "Soul", "Mowest"], "Tamla", 2),
		// https://en.wikipedia.org/wiki/David_Bowie
		q("What was David Bowie's final studio album, released two days before his death?", ["The Next Day", "Outside", "Heathen", "Blackstar"], "Blackstar", 2),
		// https://en.wikipedia.org/wiki/27th_Annual_Latin_Grammy_Awards
		q("Which Puerto Rican actress hosted the 27th Annual Latin Grammy Awards in November 2026?", ["Jennifer Lopez", "Eva Longoria", "Sofía Vergara", "Roselyn Sánchez"], "Roselyn Sánchez", 1),
		// https://en.wikipedia.org/wiki/27th_Annual_Latin_Grammy_Awards
		q("Who was the Latin Recording Academy Person of the Year at the 2026 Latin Grammy Awards?", ["Daddy Yankee", "Bad Bunny", "Ricky Martin", "Marc Anthony"], "Daddy Yankee", 1),
		// https://en.wikipedia.org/wiki/27th_Annual_Latin_Grammy_Awards
		q("Which artist won the most awards at the 27th Annual Latin Grammy Awards in November 2026?", ["Karol G", "Jorge Drexler", "Mon Laferte", "Rosalía"], "Rosalía", 1),
		// https://en.wikipedia.org/wiki/69th_Annual_Grammy_Awards
		q("Which artist led the 69th Annual Grammy Awards nominations announced in November 2026?", ["Taylor Swift", "Olivia Rodrigo", "Raye", "Bruno Mars"], "Raye", 1),
		// https://en.wikipedia.org/wiki/69th_Annual_Grammy_Awards
		q("How many nominations did Raye receive for the 69th Annual Grammy Awards in November 2026?", ["8", "9", "11", "13"], "11", 1),
		// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_Asia
		q("Which country won the inaugural Eurovision Song Contest Asia on 14 November 2026?", ["Thailand", "Vietnam", "South Korea", "Philippines"], "Philippines", 1),
		// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_Asia
		q("Which singer performed the winning entry at Eurovision Song Contest Asia in November 2026?", ["Carmelle", "Sarah Geronimo", "Moira Dela Torre", "Regine Velasquez"], "Carmelle", 1),
		// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_Asia
		q("In which city was the inaugural Eurovision Song Contest Asia held on 14 November 2026?", ["Manila", "Bangkok", "Seoul", "Kuala Lumpur"], "Bangkok", 1),
	],
	books: [
		// https://en.wikipedia.org/wiki/Agatha_Christie
		q("Under what pseudonym did Agatha Christie write six novels?", ["Martha Ellingham", "Anne Weatherby", "Margaret Halsworth", "Mary Westmacott"], "Mary Westmacott", 2),
		// https://en.wikipedia.org/wiki/Alice%27s_Adventures_in_Wonderland
		q("What sequel to Alice's Adventures in Wonderland did its author publish in 1871?", ["Through the Looking-Glass", "The Hunting of the Snark", "Sylvie and Bruno", "Alice Under the Hill"], "Through the Looking-Glass", 1),
		// https://en.wikipedia.org/wiki/Charles_Dickens
		q("In which English city was Charles Dickens born?", ["Portsmouth", "Bristol", "Canterbury", "Southampton"], "Portsmouth", 1),
		// https://en.wikipedia.org/wiki/Jane_Austen
		q("Which Jane Austen novel was published in 1813?", ["Pride and Prejudice", "Persuasion", "Northanger Abbey", "Mansfield Park"], "Pride and Prejudice", 1),
		// https://en.wikipedia.org/wiki/Les_Mis%C3%A9rables
		q("What is the name of the ex-convict protagonist of Les Misérables?", ["Javert", "Marius Pontmercy", "Jean Valjean", "Edmond Dantès"], "Jean Valjean", 1),
		// https://en.wikipedia.org/wiki/The_Lord_of_the_Rings
		q("What is the second volume of The Lord of the Rings called?", ["The Silmarillion", "The Return of the King", "The Two Towers", "The Fellowship of the Ring"], "The Two Towers", 2),
		// https://en.wikipedia.org/wiki/Agatha_Christie
		q("In which Devon town was Agatha Christie born?", ["Torquay", "Exeter", "Plymouth", "Paignton"], "Torquay", 2),
		// https://en.wikipedia.org/wiki/Alice%27s_Adventures_in_Wonderland
		q("What was the original title of the manuscript that became Alice's Adventures in Wonderland?", ["Alice's Adventures Under Ground", "Alice's Golden Afternoon", "Alice Down the Rabbit Hole", "Alice in Dreamland"], "Alice's Adventures Under Ground", 2),
		// https://en.wikipedia.org/wiki/Charles_Dickens
		q("Which Charles Dickens novella was published in 1843?", ["A Christmas Carol", "The Chimes", "Hard Times", "The Cricket on the Hearth"], "A Christmas Carol", 1),
		// https://en.wikipedia.org/wiki/Jane_Austen
		q("How many major novels is Jane Austen primarily known for?", ["Four", "Eight", "Six", "Ten"], "Six", 1),
		// https://en.wikipedia.org/wiki/Les_Mis%C3%A9rables
		q("Which 1832 uprising in Paris is the climax of Les Misérables?", ["July Revolution", "June Rebellion", "Paris Commune", "February Revolution"], "June Rebellion", 2),
		// https://en.wikipedia.org/wiki/The_Lord_of_the_Rings
		q("Which 1937 children's book was The Lord of the Rings first written as a sequel to?", ["Farmer Giles of Ham", "The Hobbit", "Roverandom", "The Silmarillion"], "The Hobbit", 2),
		// https://en.wikipedia.org/wiki/Charles_Dickens
		q("Which 1836 serial launched Charles Dickens's literary success?", ["Oliver Twist", "The Pickwick Papers", "Martin Chuzzlewit", "Nicholas Nickleby"], "The Pickwick Papers", 2),
		// https://en.wikipedia.org/wiki/Jane_Austen
		q("Which Jane Austen novel was left unfinished on her death?", ["Emma", "Persuasion", "Lady Susan", "Sanditon"], "Sanditon", 2),
		// https://en.wikipedia.org/wiki/Les_Mis%C3%A9rables
		q("Which ex-convict loosely inspired Victor Hugo's character Valjean in Les Misérables?", ["Eugène François Vidocq", "Pierre François Lacenaire", "Louis Dominique Cartouche", "Henri Charrière"], "Eugène François Vidocq", 2),
		// https://en.wikipedia.org/wiki/Archive_of_Our_Own
		q("On what date did Archive of Our Own come back online after its 2026 security incident?", ["1 November 2026", "8 November 2026", "22 November 2026", "15 November 2026"], "15 November 2026", 1),
		// https://en.wikipedia.org/wiki/Prix_Goncourt
		q("Which author won France's 2026 Prix Goncourt?", ["Laurent Mauvignier", "Philippe Jaenada", "Kamel Daoud", "Jean-Baptiste Andrea"], "Philippe Jaenada", 2),
		// https://en.wikipedia.org/wiki/Word_of_the_year
		q("In November 2026, which word did Collins English Dictionary name its word of the year?", ["Carspreading", "Friendslop", "Mogging", "Firewave"], "Mogging", 2),
		// https://en.wikipedia.org/wiki/Word_of_the_year
		q("Which word did Dictionary.com name its Word of the Year for 2026?", ["Demure", "Brainrot", "Delulu", "Maxxing"], "Maxxing", 2),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Danube
		q("In which country does the Danube river originate?", ["Austria", "Switzerland", "Hungary", "Germany"], "Germany", 1),
		// https://en.wikipedia.org/wiki/Gobi_Desert
		q("What does the Mongolian word that gave the Gobi Desert its name mean?", ["Dryland", "Sand sea", "Cold plain", "Stone field"], "Dryland", 2),
		// https://en.wikipedia.org/wiki/Great_Lakes
		q("Which waterway joins Lake Michigan and Lake Huron?", ["Straits of Mackinac", "Strait of Belle Isle", "Strait of Juan de Fuca", "Strait of Georgia"], "Straits of Mackinac", 2),
		// https://en.wikipedia.org/wiki/Himalayas
		q("What is the highest peak in the Himalayas?", ["K2", "Mount Everest", "Kangchenjunga", "Annapurna"], "Mount Everest", 1),
		// https://en.wikipedia.org/wiki/Lake_Baikal
		q("What type of lake is Lake Baikal, formed where Earth's crust pulls apart?", ["Crater lake", "Rift lake", "Oxbow lake", "Lagoon"], "Rift lake", 1),
		// https://en.wikipedia.org/wiki/Madagascar
		q("In which ocean does the island country of Madagascar lie?", ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Southern Ocean"], "Indian Ocean", 1),
		// https://en.wikipedia.org/wiki/Danube
		q("The Danube was once a frontier of which ancient empire?", ["Persian Empire", "Roman Empire", "Ottoman Empire", "Mongol Empire"], "Roman Empire", 2),
		// https://en.wikipedia.org/wiki/Gobi_Desert
		q("In what year were the first dinosaur eggs uncovered in the Gobi Desert?", ["1898", "1946", "1923", "1965"], "1923", 2),
		// https://en.wikipedia.org/wiki/Great_Lakes
		q("Which waterway connects the Great Lakes to the Mississippi River basin?", ["Illinois Waterway", "Erie Canal", "Welland Canal", "Rideau Canal"], "Illinois Waterway", 2),
		// https://en.wikipedia.org/wiki/Himalayas
		q("What does the Sanskrit name Himālaya mean?", ["Roof of the world", "Abode of snow", "Land of gods", "Mountain of light"], "Abode of snow", 2),
		// https://en.wikipedia.org/wiki/Lake_Baikal
		q("In what year did UNESCO declare Lake Baikal a World Heritage Site?", ["1979", "1988", "1996", "2004"], "1996", 2),
		// https://en.wikipedia.org/wiki/Madagascar
		q("Which European country annexed Madagascar in 1897?", ["France", "Britain", "Portugal", "Belgium"], "France", 2),
		// https://en.wikipedia.org/wiki/Danube
		q("What name did the ancient Greeks use for the Danube?", ["Rhodanus", "Istros", "Borysthenes", "Padus"], "Istros", 2),
		// https://en.wikipedia.org/wiki/Himalayas
		q("Which peak forms the western anchor of the Himalayan range?", ["Nanga Parbat", "Namcha Barwa", "Makalu", "Dhaulagiri"], "Nanga Parbat", 2),
		// https://en.wikipedia.org/wiki/Lake_Baikal
		q("Which river is the single outlet draining Lake Baikal?", ["Selenga", "Lena", "Angara", "Barguzin"], "Angara", 2),
	],
};
