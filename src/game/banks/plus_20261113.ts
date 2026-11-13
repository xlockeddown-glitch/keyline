import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Trial run 2 batch (job trivia-trial-20261113-run2, Fri Nov 13 2026, America/Chicago):
 * Claude Opus candidates from Switchboard (claude-safe --model opus; public Wikipedia only).
 * The three-model cross-check and DX pass did not run (GROQ / AI_GATEWAY / OPENROUTER keys
 * were absent). Trivia Master source-checked all 300 shipping candidates with Claude Opus
 * (`claude -p`) against Wikipedia extracts fetched 13 Nov 2026, then independently verified
 * rejects and edits against the full article text. Off-window and wrapped older facts were
 * dropped; redundant sports and midterm cards were trimmed for balance. Amber/red kept only
 * because every card is Claude-generated (not free-model). No math.
 * Evidence: /workspace/kl-trivia-trial2-logs/ and /workspace/free-si/trivia-trial/run2/.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261113: Partial<Record<PlusCat, TriviaQ[]>> = {
	sports: [
		// https://en.wikipedia.org/wiki/Baseball
		q("In baseball, how many players does each team have on the field at one time?", ["Eleven", "Ten", "Nine", "Seven"], "Nine", 1),
		// https://en.wikipedia.org/wiki/Baseball
		q("What series of playoff games decides the Major League Baseball champion?", ["World Series", "Super Bowl", "Stanley Cup", "Grand Final"], "World Series", 1),
		// https://en.wikipedia.org/wiki/Association_football
		q("How long is each of the two halves in a traditional association football match?", ["40 minutes", "45 minutes", "30 minutes", "50 minutes"], "45 minutes", 1),
		// https://en.wikipedia.org/wiki/Association_football
		q("Which organization governs association football internationally?", ["IOC", "FIBA", "ICC", "FIFA"], "FIFA", 1),
		// https://en.wikipedia.org/wiki/Cricket
		q("How long, in yards, is the pitch at the center of a cricket field?", ["18 yards", "25 yards", "22 yards", "30 yards"], "22 yards", 1),
		// https://en.wikipedia.org/wiki/Cricket
		q("How many fair deliveries make up one over in cricket?", ["Six", "Four", "Eight", "Ten"], "Six", 1),
		// https://en.wikipedia.org/wiki/Boxing
		q("Which set of boxing rules was introduced in 1867?", ["Marquess of Queensberry Rules", "Earl of Sandwich Rules", "Duke of Norfolk Rules", "Lord Byron Rules"], "Marquess of Queensberry Rules", 1),
		// https://en.wikipedia.org/wiki/Sport_of_athletics
		q("Organized athletics can be traced back to the ancient Olympic Games starting in which year?", ["490 BC", "1200 BC", "312 AD", "776 BC"], "776 BC", 1),
		// https://en.wikipedia.org/wiki/Sport_of_athletics
		q("What term is mainly used in the United States and Canada for athletics competitions?", ["Field sports", "Track and field", "Road racing", "Running sports"], "Track and field", 1),
		// https://en.wikipedia.org/wiki/Competitive_swimming
		q("Who was the first man to swim the English Channel, in 1875?", ["Matthew Webb", "Johnny Weissmuller", "Duke Kahanamoku", "Richmond Cavill"], "Matthew Webb", 1),
		// https://en.wikipedia.org/wiki/Competitive_swimming
		q("In swimming, what is the practice of reducing exercise just before an important competition called?", ["Tapering", "Cooling", "Detraining", "Pacing"], "Tapering", 1),
		// https://en.wikipedia.org/wiki/Ice_hockey
		q("In which city was the first indoor ice hockey game played, in 1875?", ["Toronto", "Montreal", "Ottawa", "Quebec City"], "Montreal", 1),
		// https://en.wikipedia.org/wiki/Ice_hockey
		q("How many periods make up a standard game of ice hockey?", ["Two", "Four", "Five", "Three"], "Three", 1),
		// https://en.wikipedia.org/wiki/Rugby_union
		q("In what year was the first Rugby World Cup held?", ["1983", "1991", "1995", "1987"], "1987", 1),
		// https://en.wikipedia.org/wiki/Kimi_Antonelli
		q("As of November 2026, how many Grands Prix had Kimi Antonelli won in his title-winning Formula One season?", ["Six", "Twelve", "Nine", "Fifteen"], "Nine", 1),
		// https://en.wikipedia.org/wiki/2026_Mexico_City_Grand_Prix
		q("Which driver took pole position at the 2026 Mexico City Grand Prix?", ["Charles Leclerc", "Max Verstappen", "Kimi Antonelli", "Lewis Hamilton"], "Lewis Hamilton", 1),
		// https://en.wikipedia.org/wiki/2026_Mexico_City_Grand_Prix
		q("In what position did Kimi Antonelli finish the 2026 Mexico City Grand Prix to clinch the title?", ["First", "Second", "Fifth", "Third"], "Third", 1),
		// https://en.wikipedia.org/wiki/Andreas_Almgren
		q("What was Andreas Almgren's winning time at the 2026 New York City Marathon?", ["2:04:47", "2:06:01", "2:08:12", "2:09:30"], "2:06:01", 1),
		// https://en.wikipedia.org/wiki/Andreas_Almgren
		q("Andreas Almgren's win at the 2026 New York City Marathon was which of his career marathons?", ["His second", "His first", "His third", "His fifth"], "His first", 1),
		// https://en.wikipedia.org/wiki/2026_New_York_City_Marathon
		q("Who won the women's race at the 2026 New York City Marathon on November 1, 2026?", ["Hellen Obiri", "Sheila Chepkirui", "Edna Kiplagat", "Mercy Chelangat"], "Sheila Chepkirui", 1),
		// https://en.wikipedia.org/wiki/2026_New_York_City_Marathon
		q("Who won the men's wheelchair race at the 2026 New York City Marathon?", ["Daniel Romanchuk", "David Weir", "Aaron Pike", "Marcel Hug"], "Marcel Hug", 1),
		// https://en.wikipedia.org/wiki/2026_World_Series
		q("How many games did the October 2026 World Series between Milwaukee and Tampa Bay last?", ["Four", "Five", "Six", "Seven"], "Five", 1),
		// https://en.wikipedia.org/wiki/Milwaukee_Brewers
		q("How long a World Series drought did the Milwaukee Brewers end by winning the 2026 title?", ["44 years", "51 years", "57 years", "63 years"], "57 years", 1),
		// https://en.wikipedia.org/wiki/Milwaukee_Brewers
		q("Who managed the Milwaukee Brewers to their 2026 World Series title?", ["Craig Counsell", "Pat Murphy", "Kevin Cash", "Ron Roenicke"], "Pat Murphy", 1),
		// https://en.wikipedia.org/wiki/2026_Japan_Series
		q("Which team swept the Yokohama DeNA BayStars to win the 2026 Japan Series in October 2026?", ["Fukuoka SoftBank Hawks", "Hanshin Tigers", "Yomiuri Giants", "Hokkaido Nippon-Ham Fighters"], "Fukuoka SoftBank Hawks", 1),
		// https://en.wikipedia.org/wiki/2026_Japan_Series
		q("Who was named MVP of the 2026 Japan Series, played in October 2026?", ["Katsuki Azuma", "Liván Moinelo", "Hiroki Kokubo", "Tomoya Masaki"], "Tomoya Masaki", 1),
		// https://en.wikipedia.org/wiki/Ballon_d%27Or
		q("On what date was the 70th Ballon d'Or ceremony held?", ["September 30, 2026", "November 9, 2026", "October 26, 2026", "October 12, 2026"], "October 26, 2026", 1),
		// https://en.wikipedia.org/wiki/Harry_Kane
		q("Besides the Ballon d'Or, which award did Harry Kane win for a second time in 2026?", ["Kopa Trophy", "Yashin Trophy", "Gerd Müller Trophy", "Golden Boy Award"], "Gerd Müller Trophy", 1),
		// https://en.wikipedia.org/wiki/Alexia_Putellas
		q("Which award did Alexia Putellas win in October 2026 after captaining Barcelona to a quadruple in 2025–26?", ["Ballon d'Or Féminin", "Yashin Trophy", "Kopa Trophy", "Golden Girl Award"], "Ballon d'Or Féminin", 1),
		// https://en.wikipedia.org/wiki/Mao_Shimada
		q("Which event did figure skater Mao Shimada win on her senior Grand Prix debut in 2026?", ["NHK Trophy", "Skate Canada International", "Skate America", "Grand Prix de France"], "Skate Canada International", 1),
		// https://en.wikipedia.org/wiki/2026_S%C3%A3o_Paulo_Grand_Prix
		q("Who won the 2026 São Paulo Grand Prix on 8 November 2026?", ["Lando Norris", "Max Verstappen", "Kimi Antonelli", "Isack Hadjar"], "Lando Norris", 1),
		// https://en.wikipedia.org/wiki/Kyle_Larson
		q("After the 2026 season, how many NASCAR Cup Series championships had Kyle Larson won?", ["Two", "Four", "Three", "Five"], "Three", 1),
		// https://en.wikipedia.org/wiki/Kyle_Larson
		q("Which track hosted the 2026 NASCAR Cup Series season finale, where Kyle Larson won the title?", ["Homestead-Miami Speedway", "Phoenix Raceway", "Martinsville Speedway", "Las Vegas Motor Speedway"], "Homestead-Miami Speedway", 1),
		// https://en.wikipedia.org/wiki/Blades_Brown
		q("What was golfer Blades Brown's highest world ranking as of November 8, 2026?", ["62", "45", "78", "101"], "62", 1),
		// https://en.wikipedia.org/wiki/Lionel_Messi
		q("As of 8 November 2026, how many league goals had Lionel Messi scored for Inter Miami?", ["62", "68", "90", "76"], "76", 1),
		// https://en.wikipedia.org/wiki/MLS_Golden_Boot
		q("Who won the 2026 MLS Golden Boot?", ["Denis Bouanga", "Christian Benteke", "Lionel Messi", "Hany Mukhtar"], "Lionel Messi", 1),
		// https://en.wikipedia.org/wiki/LIV_Golf
		q("In which month of 2026 did the LIV Golf tour fold?", ["November", "August", "October", "December"], "November", 1),
		// https://en.wikipedia.org/wiki/LIV_Golf
		q("In November 2026, which firm's plan to keep funding LIV Golf was withdrawn?", ["BC Partners", "Blackstone", "KKR", "Apollo Global"], "BC Partners", 1),
		// https://en.wikipedia.org/wiki/Yuri_Yoshida
		q("Which tournament did Japan's Yuri Yoshida win on 25 October 2026 for her first LPGA Tour title?", ["Toto Japan Classic", "Maybank Championship", "Buick LPGA Shanghai", "BMW Ladies Championship"], "BMW Ladies Championship", 1),
		// https://en.wikipedia.org/wiki/2026_Melbourne_Cup
		q("Which jockey rode the winner of the 2026 Melbourne Cup?", ["James McDonald", "Ethan Brown", "Mark Zahra", "Damian Lane"], "Ethan Brown", 1),
		// https://en.wikipedia.org/wiki/2026_Melbourne_Cup
		q("Who trained Point Of Law, winner of the 2026 Melbourne Cup?", ["Chris Waller", "Joseph O’Brien", "Ciaron Maher", "Gai Waterhouse"], "Ciaron Maher", 1),
		// https://en.wikipedia.org/wiki/Route_du_Rhum
		q("Which skipper won the 2026 Route du Rhum in record time?", ["Charles Caudrelier", "Tom Laperche", "François Gabart", "Armel Le Cléac'h"], "Tom Laperche", 1),
		// https://en.wikipedia.org/wiki/Route_du_Rhum
		q("Whose 2022 race record was broken by over six hours in the November 2026 Route du Rhum?", ["Francis Joyon", "Charles Caudrelier", "Loïck Peyron", "Franck Cammas"], "Charles Caudrelier", 1),
		// https://en.wikipedia.org/wiki/College_Football_Playoff
		q("In November 2026, ESPN extended its rights to cover a College Football Playoff expanding to how many teams?", ["16", "20", "24", "32"], "24", 1),
		// https://en.wikipedia.org/wiki/College_Football_Playoff
		q("In November 2026, ESPN extended its College Football Playoff media rights through which season?", ["2029–30", "2031–32", "2030–31", "2035–36"], "2031–32", 1),
	],
	political: [
		// https://en.wikipedia.org/wiki/Parliament_of_the_United_Kingdom
		q("Where does the Parliament of the United Kingdom meet?", ["Buckingham Palace", "Tower of London", "St James's Palace", "Palace of Westminster"], "Palace of Westminster", 1),
		// https://en.wikipedia.org/wiki/African_Union
		q("Which organization, founded in 1963, was the African Union created to replace?", ["Arab League", "Organisation of African Unity", "Economic Community of West African States", "Southern African Development Community"], "Organisation of African Unity", 1),
		// https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence
		q("Who wrote the original draft of the US Declaration of Independence?", ["John Adams", "Benjamin Franklin", "George Washington", "Thomas Jefferson"], "Thomas Jefferson", 1),
		// https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence
		q("Which British king proclaimed the American colonies to be in rebellion in August 1775?", ["George II", "William IV", "George IV", "George III"], "George III", 1),
		// https://en.wikipedia.org/wiki/Commonwealth_of_Nations
		q("Which country did the 1949 London Declaration allow to stay in the Commonwealth as a republic?", ["Ireland", "South Africa", "Pakistan", "India"], "India", 1),
		// https://en.wikipedia.org/wiki/United_States_Bill_of_Rights
		q("Which Representative's efforts led Congress to approve the amendments forming the US Bill of Rights?", ["Alexander Hamilton", "John Jay", "James Madison", "Thomas Jefferson"], "James Madison", 1),
		// https://en.wikipedia.org/wiki/European_Commission
		q("What was the European Commission called when it began in 1951 in the European Coal and Steel Community?", ["Common Assembly", "Special Council", "High Authority", "Executive Board"], "High Authority", 1),
		// https://en.wikipedia.org/wiki/United_States_Congress
		q("Which chamber is the upper body of the United States Congress?", ["The House of Representatives", "The Supreme Court", "The Cabinet", "The Senate"], "The Senate", 1),
		// https://en.wikipedia.org/wiki/Supreme_Court_of_the_United_States
		q("In what year did the US Supreme Court assert the power of judicial review?", ["1789", "1812", "1857", "1803"], "1803", 2),
		// https://en.wikipedia.org/wiki/Supreme_Court_of_the_United_States
		q("Which act of the 1st Congress established the US Supreme Court's composition?", ["Judiciary Act of 1801", "Judiciary Act of 1789", "Federal Courts Act of 1795", "Bill of Rights"], "Judiciary Act of 1789", 2),
		// https://en.wikipedia.org/wiki/Parliament_of_the_United_Kingdom
		q("In what year was the present Parliament of the United Kingdom created?", ["1801", "1707", "1688", "1832"], "1801", 2),
		// https://en.wikipedia.org/wiki/Parliament_of_the_United_Kingdom
		q("In what year did the House of Lords' judicial functions pass to a new UK Supreme Court?", ["1999", "2005", "2009", "2014"], "2009", 2),
		// https://en.wikipedia.org/wiki/African_Union
		q("In which country was the 1999 Sirte Declaration, announcing the African Union, made?", ["Egypt", "Algeria", "Libya", "Tunisia"], "Libya", 2),
		// https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence
		q("Which 1863 Lincoln speech made the US Declaration of Independence its centerpiece?", ["Cooper Union Address", "House Divided Speech", "Second Inaugural Address", "Gettysburg Address"], "Gettysburg Address", 2),
		// https://en.wikipedia.org/wiki/Commonwealth_of_Nations
		q("Which 1931 statute formalized the British Commonwealth of Nations?", ["Act of Settlement", "Statute of Rhuddlan", "Statute of Westminster", "Act of Union"], "Statute of Westminster", 2),
		// https://en.wikipedia.org/wiki/Commonwealth_of_Nations
		q("Who coined the term \"the British Commonwealth of Nations\" in 1917?", ["Lord Rosebery", "Arthur Balfour", "Jan Smuts", "Cecil Rhodes"], "Jan Smuts", 2),
		// https://en.wikipedia.org/wiki/2026_United_States_elections
		q("On what date in November 2026 were the U.S. midterm elections held?", ["November 4", "November 3", "November 5", "November 10"], "November 3", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_elections
		q("How many governorships did Democrats flip in the November 2026 U.S. elections?", ["Six", "Two", "Four", "Nine"], "Six", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_elections
		q("Who led the Senate Democrats to a majority in the November 2026 elections?", ["Chuck Schumer", "Dick Durbin", "Cory Booker", "Amy Klobuchar"], "Chuck Schumer", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_elections
		q("Which former senator won Ohio's November 2026 U.S. Senate special election?", ["Sherrod Brown", "Jon Husted", "Tim Ryan", "Rob Portman"], "Sherrod Brown", 1),
		// https://en.wikipedia.org/wiki/Keisha_Lance_Bottoms
		q("On what date is Keisha Lance Bottoms, elected in November 2026, set to take office as Georgia governor?", ["January 11, 2027", "January 20, 2027", "January 3, 2027", "January 1, 2027"], "January 11, 2027", 1),
		// https://en.wikipedia.org/wiki/Keisha_Lance_Bottoms
		q("As of November 2026, who is lieutenant governor-elect alongside Georgia's governor-elect Keisha Lance Bottoms?", ["Burt Jones", "Josh McLaurin", "Jason Esteves", "Jon Ossoff"], "Josh McLaurin", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Michigan
		q("Who won Michigan's U.S. Senate race on November 3, 2026?", ["Haley Stevens", "Mallory McMorrow", "Abdul El-Sayed", "Mike Rogers"], "Abdul El-Sayed", 1),
		// https://en.wikipedia.org/wiki/Abdul_El-Sayed
		q("By winning a 2026 Senate seat, Abdul El-Sayed became the first U.S. senator-elect of which faith?", ["Hindu", "Sikh", "Muslim", "Buddhist"], "Muslim", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Texas
		q("Whose Texas U.S. Senate seat did James Talarico win in the November 3, 2026 election?", ["Ted Cruz", "Kay Bailey Hutchison", "Phil Gramm", "John Cornyn"], "John Cornyn", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Texas
		q("What share of the vote did James Talarico win in Texas's November 3, 2026 Senate election?", ["55.06%", "51.12%", "48.97%", "58.40%"], "55.06%", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Mississippi
		q("Who unseated Cindy Hyde-Smith in Mississippi's November 3, 2026 U.S. Senate election?", ["Scott Colom", "Brandon Presley", "Mike Espy", "Bennie Thompson"], "Scott Colom", 1),
		// https://en.wikipedia.org/wiki/2026_United_States_Senate_election_in_Mississippi
		q("With his November 2026 win, Scott Colom became Mississippi's first Democratic senator elected since what year?", ["1976", "1982", "1988", "1994"], "1982", 1),
		// https://en.wikipedia.org/wiki/2026_Brazilian_general_election
		q("Lula's October 2026 runoff win re-elected him to which term as Brazil's president?", ["Second", "Third", "Fourth", "Fifth"], "Fourth", 1),
		// https://en.wikipedia.org/wiki/2026_Brazilian_general_election
		q("Who was Lula's running mate in Brazil's October 2026 presidential election?", ["Fernando Haddad", "Simone Tebet", "Geraldo Alckmin", "Alfredo Gaspar"], "Geraldo Alckmin", 1),
		// https://en.wikipedia.org/wiki/2026_Bulgarian_presidential_election
		q("Who won Bulgaria's presidential runoff held on 1 November 2026?", ["Iliana Iotova", "Andrey Gurov", "Kostadin Kostadinov", "Rumen Radev"], "Iliana Iotova", 1),
		// https://en.wikipedia.org/wiki/2026_Bulgarian_presidential_election
		q("What share of the vote did Iliana Iotova win in Bulgaria's November 2026 presidential runoff?", ["51.2%", "57.6%", "63.4%", "48.9%"], "57.6%", 1),
		// https://en.wikipedia.org/wiki/Iliana_Iotova
		q("After the November 2026 Bulgarian election, who is Iliana Iotova's vice president-elect?", ["Kiril Valchev", "Georgi Kandev", "Petar Volgin", "Margarita Popova"], "Kiril Valchev", 1),
		// https://en.wikipedia.org/wiki/Paul_St-Pierre_Plamondon
		q("In October 2026, Paul St-Pierre Plamondon became which numbered premier of Quebec?", ["31st", "32nd", "34th", "33rd"], "34th", 1),
		// https://en.wikipedia.org/wiki/Paul_St-Pierre_Plamondon
		q("Who became deputy premier of Quebec under Paul St-Pierre Plamondon after he took office in October 2026?", ["Catherine Gentilcore", "Manon Jeannotte", "Ruba Ghazal", "Alexandra Tremblay"], "Catherine Gentilcore", 1),
		// https://en.wikipedia.org/wiki/2026_Grenadian_general_election
		q("At Grenada's 5 November 2026 general election, how many of the 15 seats did the NDC win?", ["9", "11", "14", "12"], "14", 1),
		// https://en.wikipedia.org/wiki/2026_Grenadian_general_election
		q("In Grenada's November 2026 election, who defeated NNP leader Emmalin Pierre in her seat?", ["David Andrew", "Adrian Joseph", "Peter David", "Oliver Joseph"], "David Andrew", 1),
	],
	food: [
		// https://en.wikipedia.org/wiki/Bread
		q("Which grain is most commonly used to make bread?", ["Wheat", "Rye", "Barley", "Oats"], "Wheat", 1),
		// https://en.wikipedia.org/wiki/Olive_oil
		q("Along with wheat and olives, what is the third core food plant of Mediterranean cuisine?", ["Grapes", "Barley", "Lemons", "Figs"], "Grapes", 1),
		// https://en.wikipedia.org/wiki/Olive_oil
		q("What does the abbreviation EVOO stand for?", ["Extra vintage olive oil", "Extra virgin olive oil", "Essential virgin olive oil", "Extra valued olive oil"], "Extra virgin olive oil", 1),
		// https://en.wikipedia.org/wiki/Rice
		q("In which present-day country was Asian rice first domesticated?", ["India", "China", "Japan", "Thailand"], "China", 1),
		// https://en.wikipedia.org/wiki/Wine
		q("Monks in medieval Europe made wine for which Christian rite?", ["Baptism", "Confirmation", "Eucharist", "Ordination"], "Eucharist", 1),
		// https://en.wikipedia.org/wiki/Apple
		q("In which region did the apple tree originate?", ["Western Europe", "North America", "East Africa", "Central Asia"], "Central Asia", 1),
		// https://en.wikipedia.org/wiki/Apple
		q("Who introduced domestic apples to the Americas?", ["Chinese traders", "Arab merchants", "Polynesian sailors", "European colonists"], "European colonists", 1),
		// https://en.wikipedia.org/wiki/Honey
		q("What material do honey bees use to build honeycomb?", ["Beeswax", "Propolis", "Pollen", "Royal jelly"], "Beeswax", 1),
		// https://en.wikipedia.org/wiki/Honey
		q("What shape are the cells of a honeycomb?", ["Hexagonal", "Square", "Circular", "Octagonal"], "Hexagonal", 1),
		// https://en.wikipedia.org/wiki/Ice_cream
		q("What Italian word for ice cream is often used in English?", ["Sorbetto", "Granita", "Gelato", "Semifreddo"], "Gelato", 1),
		// https://en.wikipedia.org/wiki/Ice_cream
		q("What is the popular short nickname for frozen yogurt?", ["Yogice", "Frozo", "Froyo", "Yofreeze"], "Froyo", 1),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Vincent_van_Gogh
		q("What nationality was the painter Vincent van Gogh?", ["Belgian", "French", "Dutch", "German"], "Dutch", 1),
		// https://en.wikipedia.org/wiki/Vincent_van_Gogh
		q("What was the name of Vincent van Gogh's younger brother, who supported him financially?", ["Pieter", "Theo", "Anton", "Hendrik"], "Theo", 1),
		// https://en.wikipedia.org/wiki/Leonardo_da_Vinci
		q("Which Leonardo da Vinci painting is regarded as the world's most famous painting?", ["The Last Supper", "Lady with an Ermine", "Salvator Mundi", "Mona Lisa"], "Mona Lisa", 1),
		// https://en.wikipedia.org/wiki/Leonardo_da_Vinci
		q("Which painter and sculptor taught Leonardo da Vinci in Florence?", ["Andrea del Verrocchio", "Sandro Botticelli", "Donatello", "Filippo Lippi"], "Andrea del Verrocchio", 1),
		// https://en.wikipedia.org/wiki/Symphony
		q("Which Beethoven symphony is cited as an example of a symphony containing vocal parts?", ["Fifth Symphony", "Third Symphony", "Ninth Symphony", "Seventh Symphony"], "Ninth Symphony", 1),
		// https://en.wikipedia.org/wiki/Symphony
		q("In what musical form is the first movement of a symphony typically written?", ["Rondo form", "Fugue", "Theme and variations", "Sonata form"], "Sonata form", 1),
		// https://en.wikipedia.org/wiki/Ballet
		q("Ballet originated during the Renaissance in which country's courts?", ["France", "Russia", "Italy", "Spain"], "Italy", 1),
		// https://en.wikipedia.org/wiki/Ballet
		q("Under which king did French court ballet reach its height?", ["Louis XVI", "Louis XIV", "Henry IV", "Francis I"], "Louis XIV", 1),
		// https://en.wikipedia.org/wiki/David_(Michelangelo)
		q("Which artist created the statue David between 1501 and 1504?", ["Donatello", "Bernini", "Benvenuto Cellini", "Michelangelo"], "Michelangelo", 1),
		// https://en.wikipedia.org/wiki/David_(Michelangelo)
		q("What material is Michelangelo's statue David made of?", ["Bronze", "Granite", "Limestone", "Marble"], "Marble", 1),
		// https://en.wikipedia.org/wiki/Photography
		q("What do the Greek roots of the word photography together mean?", ["Capturing the moment", "Writing with shadows", "Picture in a box", "Drawing with light"], "Drawing with light", 1),
		// https://en.wikipedia.org/wiki/Photography
		q("What does the Latin term camera obscura mean?", ["Light box", "Hidden eye", "Small window", "Dark chamber"], "Dark chamber", 1),
		// https://en.wikipedia.org/wiki/Orchestra
		q("What is the short wooden rod used by an orchestra's conductor called?", ["Baton", "Mallet", "Bow", "Wand"], "Baton", 1),
		// https://en.wikipedia.org/wiki/Sistine_Chapel
		q("Which pope gave the Sistine Chapel its name?", ["Julius II", "Leo X", "Paul III", "Sixtus IV"], "Sixtus IV", 1),
	],
	science: [
		// https://en.wikipedia.org/wiki/Jupiter
		q("What giant storm on Jupiter has been recorded since 1831?", ["Great Dark Spot", "Great Red Spot", "Great White Oval", "Little Blue Spot"], "Great Red Spot", 1),
		// https://en.wikipedia.org/wiki/Dinosaur
		q("What does the word \"dinosaur\" mean?", ["Terrible lizard", "Ancient reptile", "Giant beast", "Thunder lizard"], "Terrible lizard", 1),
		// https://en.wikipedia.org/wiki/Dinosaur
		q("Which group of living animals are the sole surviving dinosaurs?", ["Crocodiles", "Lizards", "Turtles", "Birds"], "Birds", 1),
		// https://en.wikipedia.org/wiki/Black_hole
		q("Which scientist's name is given to the radiation that black hole event horizons are predicted to emit?", ["Hawking", "Einstein", "Penrose", "Schwarzschild"], "Hawking", 1),
		// https://en.wikipedia.org/wiki/Evolution
		q("Which Darwin book first set out the theory of evolution by natural selection in detail?", ["On the Origin of Species", "The Descent of Man", "The Voyage of the Beagle", "The Expression of the Emotions"], "On the Origin of Species", 1),
		// https://en.wikipedia.org/wiki/Evolution
		q("In evolution, what is the complete set of an organism's observable traits called?", ["Phenotype", "Genotype", "Genome", "Karyotype"], "Phenotype", 1),
		// https://en.wikipedia.org/wiki/Telescope
		q("Who built the first practical reflecting telescope in 1668?", ["Isaac Newton", "Galileo Galilei", "Johannes Kepler", "Robert Hooke"], "Isaac Newton", 1),
		// https://en.wikipedia.org/wiki/Gravity
		q("What object is the most extreme example of spacetime curvature, where not even light can escape?", ["A neutron star", "A black hole", "A white dwarf", "A quasar"], "A black hole", 1),
		// https://en.wikipedia.org/wiki/Plate_tectonics
		q("Which earlier concept, developed in the early 20th century, does the plate tectonics model build on?", ["Uniformitarianism", "Continental drift", "Catastrophism", "Expanding Earth"], "Continental drift", 1),
		// https://en.wikipedia.org/wiki/Plate_tectonics
		q("In plate tectonics, what process carries the edge of one plate down under another into the mantle?", ["Rifting", "Subduction", "Obduction", "Accretion"], "Subduction", 1),
	],
	history: [
		// https://en.wikipedia.org/wiki/American_Revolution
		q("Who was appointed commander-in-chief of the Continental Army in 1775?", ["John Adams", "Benjamin Franklin", "Thomas Jefferson", "George Washington"], "George Washington", 1),
		// https://en.wikipedia.org/wiki/American_Revolution
		q("Which 1783 treaty saw Britain recognize the sovereign independence of the United States?", ["Treaty of Ghent", "Treaty of Utrecht", "Treaty of Paris", "Treaty of Versailles"], "Treaty of Paris", 1),
		// https://en.wikipedia.org/wiki/Industrial_Revolution
		q("Which industry was the first to use modern production methods in the Industrial Revolution?", ["Shipbuilding", "Pottery", "Brewing", "Textiles"], "Textiles", 1),
		// https://en.wikipedia.org/wiki/Joan_of_Arc
		q("For her role in the siege of which city is Joan of Arc honored as a defender of France?", ["Rouen", "Orléans", "Calais", "Bordeaux"], "Orléans", 1),
		// https://en.wikipedia.org/wiki/Berlin_Wall
		q("On what date in 1989 did East Germany announce its citizens could visit West Berlin?", ["October 3", "August 13", "November 9", "December 22"], "November 9", 1),
		// https://en.wikipedia.org/wiki/Silk_Road
		q("The expansion of which Chinese dynasty into Central Asia began the Silk Road network?", ["Ming dynasty", "Qing dynasty", "Song dynasty", "Han dynasty"], "Han dynasty", 1),
		// https://en.wikipedia.org/wiki/Viking_Age
		q("Where in North America did the Vikings briefly settle during the Viking Age?", ["Nova Scotia", "Labrador", "Maine", "Newfoundland"], "Newfoundland", 1),
		// https://en.wikipedia.org/wiki/Renaissance
		q("What does the word \"Renaissance\" mean?", ["Awakening", "Enlightenment", "Revolution", "Rebirth"], "Rebirth", 1),
		// https://en.wikipedia.org/wiki/Renaissance
		q("In which Italian republic was the Renaissance first centered?", ["Republic of Venice", "Republic of Genoa", "Republic of Florence", "Republic of Pisa"], "Republic of Florence", 1),
		// https://en.wikipedia.org/wiki/Christopher_Columbus
		q("Which Spanish queen agreed to sponsor Christopher Columbus's journey west?", ["Joanna of Castile", "Isabella I", "Catherine of Aragon", "Mary I"], "Isabella I", 1),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Coral_reef
		q("What nickname is sometimes given to shallow coral reefs?", ["Gardens of the deep", "Jewels of the ocean", "Rainforests of the sea", "Cities of the sea"], "Rainforests of the sea", 1),
		// https://en.wikipedia.org/wiki/Coral_reef
		q("During the voyage of which ship did Charles Darwin conceive his theory of coral atoll formation?", ["The Beagle", "The Endeavour", "The Bounty", "The Challenger"], "The Beagle", 1),
		// https://en.wikipedia.org/wiki/Oak
		q("What is the nut produced by an oak tree called?", ["Acorn", "Chestnut", "Hazelnut", "Beechnut"], "Acorn", 1),
		// https://en.wikipedia.org/wiki/Dolphin
		q("Which apex predator is the largest species of dolphin?", ["Beluga", "Narwhal", "Orca", "Sperm whale"], "Orca", 1),
		// https://en.wikipedia.org/wiki/Tiger
		q("How long do tiger cubs usually stay with their mother?", ["About six months", "About two years", "About five years", "About ten years"], "About two years", 1),
		// https://en.wikipedia.org/wiki/Volcano
		q("The word volcano ultimately refers to which Roman god of fire?", ["Mars", "Neptune", "Mercury", "Vulcan"], "Vulcan", 1),
		// https://en.wikipedia.org/wiki/Volcano
		q("What Pacific volcanic zone is caused by converging tectonic plates?", ["Arc of Flame", "Ring of Fire", "Circle of Ash", "Belt of Smoke"], "Ring of Fire", 1),
		// https://en.wikipedia.org/wiki/Bird_migration
		q("What mainly controls the timing of bird migration?", ["Changes in rainfall", "Phases of the Moon", "Changes in day length", "Ocean tides"], "Changes in day length", 1),
		// https://en.wikipedia.org/wiki/Bird_migration
		q("Which ancient Greek thinker suggested that swallows hibernated?", ["Plato", "Herodotus", "Aristotle", "Pythagoras"], "Aristotle", 1),
		// https://en.wikipedia.org/wiki/Water_cycle
		q("What is condensation of water vapor close to ground level called?", ["Fog", "Smog", "Hail", "Sleet"], "Fog", 1),
		// https://en.wikipedia.org/wiki/Water_cycle
		q("What provides the energy that powers the water cycle?", ["The Sun", "The Moon", "Earth's core", "The wind"], "The Sun", 1),
	],
	games: [
		// https://en.wikipedia.org/wiki/Minecraft
		q("Which company bought Mojang and the Minecraft intellectual property in 2014?", ["Microsoft", "Sony", "Nintendo", "Electronic Arts"], "Microsoft", 1),
		// https://en.wikipedia.org/wiki/Scrabble
		q("What size grid of squares is a Scrabble board?", ["12×12", "19×19", "15×15", "21×21"], "15×15", 1),
		// https://en.wikipedia.org/wiki/Scrabble
		q("What was the profession of Scrabble inventor Alfred Mosher Butts?", ["Accountant", "Architect", "Schoolteacher", "Journalist"], "Architect", 1),
		// https://en.wikipedia.org/wiki/Pac-Man
		q("What was Pac-Man originally titled in Japan?", ["Puck Man", "Paku Man", "Pocket Man", "Pick Man"], "Puck Man", 1),
		// https://en.wikipedia.org/wiki/Super_Mario
		q("Which Japanese game designer created the Super Mario series?", ["Satoru Iwata", "Shigeru Miyamoto", "Hideo Kojima", "Masahiro Sakurai"], "Shigeru Miyamoto", 1),
		// https://en.wikipedia.org/wiki/Super_Mario
		q("Who is the primary antagonist in the Super Mario games?", ["Bowser", "Wario", "Waluigi", "King Boo"], "Bowser", 1),
		// https://en.wikipedia.org/wiki/Fortnite
		q("In what year was Fortnite released?", ["2014", "2015", "2017", "2019"], "2017", 1),
		// https://en.wikipedia.org/wiki/Monopoly_(game)
		q("Monopoly is derived from which game created by Lizzie Magie in 1903?", ["The Banker's Game", "The Landlord's Game", "The Tenant's Game", "The Property Game"], "The Landlord's Game", 2),
		// https://en.wikipedia.org/wiki/Monopoly_(game)
		q("Lizzie Magie's The Landlord's Game was meant to promote whose economic theories on taxation?", ["Adam Smith", "Henry George", "Karl Marx", "John Maynard Keynes"], "Henry George", 2),
		// https://en.wikipedia.org/wiki/Minecraft
		q("In which programming language was Minecraft originally created?", ["C++", "Python", "Lua", "Java"], "Java", 2),
		// https://en.wikipedia.org/wiki/Minecraft
		q("How long does one full day and night cycle last in Minecraft?", ["10 real-time minutes", "30 real-time minutes", "60 real-time minutes", "20 real-time minutes"], "20 real-time minutes", 2),
		// https://en.wikipedia.org/wiki/Tetris
		q("In which programming language did Alexey Pajitnov first program Tetris?", ["Pascal", "BASIC", "Fortran", "COBOL"], "Pascal", 2),
		// https://en.wikipedia.org/wiki/Scrabble
		q("What did Alfred Mosher Butts call his game before it was renamed Scrabble?", ["Word Grid", "Letter Squares", "Criss-Crosswords", "Tile-Words"], "Criss-Crosswords", 2),
		// https://en.wikipedia.org/wiki/Scrabble
		q("Who bought the rights to Criss-Crosswords in 1948 and renamed it Scrabble?", ["Charles Darrow", "James Brunot", "George Parker", "John Waddington"], "James Brunot", 2),
		// https://en.wikipedia.org/wiki/Dungeons_%26_Dragons
		q("Which 1971 wargame served as the initial rule system for Dungeons & Dragons?", ["Warhammer", "Diplomacy", "Chainmail", "Squad Leader"], "Chainmail", 2),
		// https://en.wikipedia.org/wiki/Pac-Man
		q("What color is the ghost Clyde in Pac-Man?", ["Red", "Orange", "Pink", "Cyan"], "Orange", 2),
		// https://en.wikipedia.org/wiki/Super_Mario
		q("Which Super Mario game introduced the overworld map of nonlinear levels?", ["Super Mario World", "Super Mario Bros. 3", "Super Mario 64", "Super Mario Bros. 2"], "Super Mario Bros. 3", 2),
		// https://en.wikipedia.org/wiki/Fortnite
		q("From what vehicle do players airdrop in Fortnite Battle Royale?", ["Drop Ship", "Battle Bus", "Sky Train", "War Blimp"], "Battle Bus", 2),
		// https://en.wikipedia.org/wiki/Fortnite
		q("What type of game is Fortnite Festival?", ["A racing game", "A puzzle game", "A rhythm game", "A survival game"], "A rhythm game", 2),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Meryl_Streep
		q("In which 2006 film did Meryl Streep play a formidable antagonist?", ["Mean Girls", "The Holiday", "The Devil Wears Prada", "Marie Antoinette"], "The Devil Wears Prada", 1),
		// https://en.wikipedia.org/wiki/Meryl_Streep
		q("Meryl Streep played a singing lead in which 2008 musical film?", ["Hairspray", "Chicago", "Les Misérables", "Mamma Mia!"], "Mamma Mia!", 1),
		// https://en.wikipedia.org/wiki/Audrey_Hepburn
		q("Audrey Hepburn rose to stardom alongside Gregory Peck in which 1953 romantic comedy?", ["Roman Holiday", "Gigi", "Pillow Talk", "An American in Paris"], "Roman Holiday", 1),
		// https://en.wikipedia.org/wiki/Oprah_Winfrey
		q("Which 2008 presidential candidate did Oprah Winfrey endorse?", ["Barack Obama", "Hillary Clinton", "John Edwards", "John McCain"], "Barack Obama", 1),
		// https://en.wikipedia.org/wiki/Jackie_Chan
		q("Which character did Jackie Chan play in the 1998 film Rush Hour?", ["Detective Carter", "Inspector Chang", "Chief Inspector Lee", "Captain Wong"], "Chief Inspector Lee", 1),
		// https://en.wikipedia.org/wiki/Jackie_Chan
		q("Which martial arts mentor did Jackie Chan play in the 2010 remake The Karate Kid?", ["Mr. Miyagi", "Master Shifu", "Mr. Wu", "Mr. Han"], "Mr. Han", 1),
		// https://en.wikipedia.org/wiki/Keanu_Reeves
		q("Which character did Keanu Reeves play in The Matrix (1999)?", ["Morpheus", "Agent Smith", "Trinity", "Neo"], "Neo", 1),
		// https://en.wikipedia.org/wiki/Cate_Blanchett
		q("Which Hollywood star did Cate Blanchett portray in The Aviator (2004)?", ["Katharine Hepburn", "Bette Davis", "Greta Garbo", "Joan Crawford"], "Katharine Hepburn", 1),
		// https://en.wikipedia.org/wiki/Cate_Blanchett
		q("For which 2013 film did Cate Blanchett win the Academy Award for Best Actress?", ["Blue Jasmine", "Philomena", "Gravity", "August: Osage County"], "Blue Jasmine", 1),
		// https://en.wikipedia.org/wiki/Meryl_Streep
		q("Which 2011 film earned Meryl Streep her third Academy Award?", ["Julie & Julia", "The Iron Lady", "The Post", "Silkwood"], "The Iron Lady", 2),
		// https://en.wikipedia.org/wiki/Audrey_Hepburn
		q("In which city was Audrey Hepburn born?", ["Amsterdam", "London", "Paris", "Brussels"], "Brussels", 2),
		// https://en.wikipedia.org/wiki/Audrey_Hepburn
		q("Who co-starred with Audrey Hepburn in the 1957 musical Funny Face?", ["Gene Kelly", "Bing Crosby", "Fred Astaire", "Frank Sinatra"], "Fred Astaire", 2),
		// https://en.wikipedia.org/wiki/Harrison_Ford
		q("Which character did Harrison Ford play in the Blade Runner franchise?", ["Roy Batty", "Eldon Tyrell", "Dave Holden", "Rick Deckard"], "Rick Deckard", 2),
		// https://en.wikipedia.org/wiki/Oprah_Winfrey
		q("In which city did Oprah Winfrey's father, Vernon, work as a barber?", ["Memphis", "Atlanta", "Louisville", "Nashville"], "Nashville", 2),
		// https://en.wikipedia.org/wiki/Jackie_Chan
		q("In the 1980s, Jackie Chan, Sammo Hung and Yuen Biao were known by what group name?", ["Three Tigers", "Three Dragons", "Five Venoms", "Three Swordsmen"], "Three Dragons", 2),
		// https://en.wikipedia.org/wiki/Keanu_Reeves
		q("Which character did Keanu Reeves voice in Toy Story 4 (2019)?", ["Forky", "Gabby Gabby", "Bo Peep", "Duke Caboom"], "Duke Caboom", 2),
		// https://en.wikipedia.org/wiki/Keanu_Reeves
		q("What is the name of the band Keanu Reeves plays in?", ["Dogstar", "Moonchild", "Starsailor", "Dogwood"], "Dogstar", 2),
		// https://en.wikipedia.org/wiki/Cate_Blanchett
		q("Which company did Cate Blanchett and Andrew Upton run as artistic directors from 2008 to 2013?", ["Sydney Theatre Company", "Melbourne Theatre Company", "Bell Shakespeare", "Belvoir St Theatre"], "Sydney Theatre Company", 2),
		// https://en.wikipedia.org/wiki/Cate_Blanchett
		q("Cate Blanchett graduated from which Australian drama school?", ["National Institute of Dramatic Art", "Victorian College of the Arts", "Western Australian Academy of Performing Arts", "Australian Film, Television and Radio School"], "National Institute of Dramatic Art", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart
		q("What was the name of Wolfgang Amadeus Mozart's father?", ["Leopold", "Johann", "Franz", "Joseph"], "Leopold", 1),
		// https://en.wikipedia.org/wiki/Queen_(band)
		q("Which Queen member suggested the band's name when he joined in 1970?", ["Brian May", "Roger Taylor", "John Deacon", "Freddie Mercury"], "Freddie Mercury", 1),
		// https://en.wikipedia.org/wiki/Queen_(band)
		q("At which 1985 concert did Queen give a performance ranked among the greatest in rock history?", ["Woodstock", "Glastonbury", "Live Aid", "Live 8"], "Live Aid", 1),
		// https://en.wikipedia.org/wiki/Michael_Jackson
		q("What royal nickname was Michael Jackson dubbed?", ["King of Funk", "Prince of Disco", "King of Jazz", "King of Pop"], "King of Pop", 1),
		// https://en.wikipedia.org/wiki/Michael_Jackson
		q("Michael Jackson made his public debut at age six as lead singer of which group?", ["The Temptations", "The Commodores", "The Jackson 5", "The Isley Brothers"], "The Jackson 5", 1),
		// https://en.wikipedia.org/wiki/Miles_Davis
		q("Which New York music school did Miles Davis leave home to study at?", ["Berklee College", "Juilliard School", "Manhattan School", "Eastman School"], "Juilliard School", 1),
		// https://en.wikipedia.org/wiki/Guitar
		q("How many strings does a guitar typically have?", ["Six or twelve", "Four or eight", "Five or ten", "Seven or fourteen"], "Six or twelve", 1),
		// https://en.wikipedia.org/wiki/Guitar
		q("The Spanish guitar is another name for which main type of guitar?", ["Archtop guitar", "Lap steel guitar", "Classical guitar", "Electric guitar"], "Classical guitar", 1),
		// https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart
		q("What nickname is given to Mozart's last symphony?", ["Eroica", "Pastoral", "Jupiter", "Surprise"], "Jupiter", 2),
		// https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart
		q("What was the nickname of Mozart's elder sister Maria Anna?", ["Annerl", "Marierl", "Liesl", "Nannerl"], "Nannerl", 2),
		// https://en.wikipedia.org/wiki/Queen_(band)
		q("In which band did Brian May and Roger Taylor play together before forming Queen?", ["Wreckage", "Ibex", "Sour Milk Sea", "Smile"], "Smile", 2),
		// https://en.wikipedia.org/wiki/Queen_(band)
		q("Which 1977 Queen album contained \"We Will Rock You\" and \"We Are the Champions\"?", ["News of the World", "A Night at the Opera", "The Game", "Jazz"], "News of the World", 2),
		// https://en.wikipedia.org/wiki/Michael_Jackson
		q("In which Indiana city was Michael Jackson born?", ["Indianapolis", "Fort Wayne", "Gary", "South Bend"], "Gary", 2),
		// https://en.wikipedia.org/wiki/Michael_Jackson
		q("Which 1987 Michael Jackson album was the first to produce five Billboard Hot 100 number-one singles?", ["Thriller", "Dangerous", "Off the Wall", "Bad"], "Bad", 2),
		// https://en.wikipedia.org/wiki/Bob_Dylan
		q("Bob Dylan's \"Knockin' on Heaven's Door\" came from the soundtrack of which 1973 film he acted in?", ["Pat Garrett and Billy the Kid", "Butch Cassidy and the Sundance Kid", "The Wild Bunch", "Easy Rider"], "Pat Garrett and Billy the Kid", 2),
		// https://en.wikipedia.org/wiki/Beyonc%C3%A9
		q("In which 2008 biopic did Beyoncé portray Etta James?", ["Dreamgirls", "Ray", "Cadillac Records", "Walk the Line"], "Cadillac Records", 2),
		// https://en.wikipedia.org/wiki/Beyonc%C3%A9
		q("What was the title of Beyoncé's 2003 debut solo album?", ["Dangerously in Love", "B'Day", "I Am… Sasha Fierce", "Lemonade"], "Dangerously in Love", 2),
		// https://en.wikipedia.org/wiki/Miles_Davis
		q("Whose bebop quintet was Miles Davis a member of from 1944 to 1948?", ["Dizzy Gillespie", "Charlie Parker", "Thelonious Monk", "Coleman Hawkins"], "Charlie Parker", 2),
		// https://en.wikipedia.org/wiki/Miles_Davis
		q("Which million-selling 1970 Miles Davis record helped spark a jazz fusion resurgence?", ["Kind of Blue", "Bitches Brew", "Sketches of Spain", "Tutu"], "Bitches Brew", 2),
		// https://en.wikipedia.org/wiki/Guitar
		q("What class of instrument, producing sound from a string stretched between two points, is the guitar?", ["Idiophone", "Chordophone", "Aerophone", "Membranophone"], "Chordophone", 2),
		// https://en.wikipedia.org/wiki/Guitar
		q("Historically, guitar strings were made of what material?", ["Catgut", "Hemp", "Horsehair", "Linen"], "Catgut", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/Frankenstein
		q("What is the first name of the scientist Frankenstein in Mary Shelley's novel?", ["Henry", "Victor", "William", "Robert"], "Victor", 1),
		// https://en.wikipedia.org/wiki/The_Catcher_in_the_Rye
		q("Who is the main character of The Catcher in the Rye?", ["Dean Moriarty", "Holden Caulfield", "Jay Gatsby", "Atticus Finch"], "Holden Caulfield", 1),
		// https://en.wikipedia.org/wiki/Little_Women
		q("What is the family surname of Meg, Jo, Beth and Amy in Little Women?", ["March", "Bennet", "Dashwood", "Bertram"], "March", 1),
		// https://en.wikipedia.org/wiki/War_and_Peace
		q("During which wars is Tolstoy's War and Peace set?", ["Crimean War", "Napoleonic Wars", "Seven Years' War", "Great Northern War"], "Napoleonic Wars", 1),
		// https://en.wikipedia.org/wiki/Iliad
		q("Which Trojan prince does Achilles kill in the Iliad?", ["Paris", "Aeneas", "Priam", "Hector"], "Hector", 1),
		// https://en.wikipedia.org/wiki/Don_Quixote
		q("What is the real name of the woman Don Quixote renames Dulcinea del Toboso?", ["Aldonza Lorenzo", "Marcela Ruiz", "Inés Morales", "Leonor Castillo"], "Aldonza Lorenzo", 2),
		// https://en.wikipedia.org/wiki/Frankenstein
		q("At whose suggestion did Mary Shelley agree in 1816 to write the ghost story that became Frankenstein?", ["John Keats", "William Wordsworth", "Lord Byron", "Samuel Taylor Coleridge"], "Lord Byron", 2),
		// https://en.wikipedia.org/wiki/Frankenstein
		q("Which university does Victor attend in Mary Shelley's Frankenstein?", ["University of Heidelberg", "University of Leipzig", "University of Ingolstadt", "University of Göttingen"], "University of Ingolstadt", 2),
		// https://en.wikipedia.org/wiki/The_Catcher_in_the_Rye
		q("From which boarding school is Holden expelled in The Catcher in the Rye?", ["Pencey Preparatory Academy", "Phillips Exeter Academy", "Choate Rosemary Hall", "Welton Academy"], "Pencey Preparatory Academy", 2),
		// https://en.wikipedia.org/wiki/The_Catcher_in_the_Rye
		q("What is the name of Holden's younger sister in The Catcher in the Rye?", ["Franny", "Phoebe", "Esther", "Mattie"], "Phoebe", 2),
		// https://en.wikipedia.org/wiki/The_Hobbit
		q("In The Hobbit, what animal's form can the character Beorn assume?", ["Bear", "Wolf", "Eagle", "Boar"], "Bear", 2),
		// https://en.wikipedia.org/wiki/Little_Women
		q("Which sequel to Little Women did Louisa May Alcott publish in 1886?", ["Meg's Children", "Jo's Boys", "Amy's Daughters", "The March Boys"], "Jo's Boys", 2),
		// https://en.wikipedia.org/wiki/War_and_Peace
		q("Under what title was an earlier version of War and Peace serialized?", ["The Year 1812", "Moscow Burning", "The Year 1805", "The Decembrists"], "The Year 1805", 2),
		// https://en.wikipedia.org/wiki/War_and_Peace
		q("Which philosopher did Tolstoy name as a main inspiration while writing War and Peace?", ["Schopenhauer", "Nietzsche", "Hegel", "Kant"], "Schopenhauer", 2),
		// https://en.wikipedia.org/wiki/Iliad
		q("In the Iliad, what is the name of Achilles's mother, a sea nymph?", ["Athena", "Hera", "Calypso", "Thetis"], "Thetis", 2),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Sahara
		q("From which language is the name of the Sahara derived?", ["Berber", "Arabic", "Latin", "Greek"], "Arabic", 1),
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("In which mountain range does Mount Everest lie?", ["Andes", "Himalayas", "Alps", "Karakoram"], "Himalayas", 1),
		// https://en.wikipedia.org/wiki/Pacific_Ocean
		q("Which explorer coined the name of the Pacific Ocean in 1520?", ["Christopher Columbus", "Vasco da Gama", "James Cook", "Ferdinand Magellan"], "Ferdinand Magellan", 1),
		// https://en.wikipedia.org/wiki/Pacific_Ocean
		q("What does Magellan's name for the Pacific Ocean, Mar Pacífico, mean?", ["Peaceful sea", "Southern sea", "Great sea", "Blue sea"], "Peaceful sea", 1),
		// https://en.wikipedia.org/wiki/Iceland
		q("In what year did Iceland vote to become a republic?", ["1944", "1918", "1950", "1905"], "1944", 1),
		// https://en.wikipedia.org/wiki/Mississippi_River
		q("Which American author is best known for writing about the Mississippi River?", ["Herman Melville", "Jack London", "John Steinbeck", "Mark Twain"], "Mark Twain", 1),
		// https://en.wikipedia.org/wiki/Sahara
		q("What is the highest peak in the Sahara?", ["Mount Kenya", "Jebel Toubkal", "Emi Koussi", "Mount Cameroon"], "Emi Koussi", 2),
		// https://en.wikipedia.org/wiki/Amazon_River
		q("Whose 16th-century expedition was attacked by women-led warriors, inspiring the name Rio Amazonas?", ["Francisco Pizarro", "Hernán Cortés", "Pedro Álvares Cabral", "Francisco de Orellana"], "Francisco de Orellana", 2),
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("Who joined George Mallory on the final 1924 summit attempt on Mount Everest?", ["Edward Norton", "Howard Somervell", "Noel Odell", "Andrew Irvine"], "Andrew Irvine", 2),
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("What is the closest sea to Mount Everest's summit?", ["Arabian Sea", "Bay of Bengal", "South China Sea", "Andaman Sea"], "Bay of Bengal", 2),
		// https://en.wikipedia.org/wiki/Grand_Canyon
		q("Which gorge in Nepal is much deeper than the Grand Canyon?", ["Kali Gandaki Gorge", "Yarlung Tsangpo Gorge", "Cotahuasi Canyon", "Tiger Leaping Gorge"], "Kali Gandaki Gorge", 2),
		// https://en.wikipedia.org/wiki/Pacific_Ocean
		q("Which Spanish explorer crossed the Isthmus of Panama in 1513 and sighted the Pacific Ocean?", ["Vasco Núñez de Balboa", "Hernán Cortés", "Juan Ponce de León", "Francisco Pizarro"], "Vasco Núñez de Balboa", 2),
		// https://en.wikipedia.org/wiki/Pacific_Ocean
		q("In which trench of the Pacific Ocean is the Challenger Deep located?", ["Tonga Trench", "Kuril Trench", "Java Trench", "Mariana Trench"], "Mariana Trench", 2),
		// https://en.wikipedia.org/wiki/Iceland
		q("Which Norwegian chieftain became Iceland's first permanent settler in 874 AD?", ["Erik the Red", "Ingólfr Arnarson", "Leif Erikson", "Harald Fairhair"], "Ingólfr Arnarson", 2),
		// https://en.wikipedia.org/wiki/Mount_Kilimanjaro
		q("Who reached Mount Kilimanjaro's highest summit in 1889?", ["Joseph Thomson", "Hans Meyer", "Johann Ludwig Krapf", "Johannes Rebmann"], "Hans Meyer", 2),
		// https://en.wikipedia.org/wiki/Mississippi_River
		q("Which Minnesota lake is the traditional source of the Mississippi River?", ["Lake Itasca", "Lake Superior", "Lake of the Woods", "Mille Lacs Lake"], "Lake Itasca", 2),
		// https://en.wikipedia.org/wiki/Mississippi_River
		q("What does Misi-ziibi, the Anishinaabe name behind the word Mississippi, mean?", ["Muddy River", "Long River", "Great River", "Winding River"], "Great River", 2),
	],
};

