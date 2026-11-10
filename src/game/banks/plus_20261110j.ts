import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Free-model head-to-head batch (job trivia-free-20261110j, Nov 9 2026): 4 free generator models each wrote cards from the same 48 public Wikipedia intros (seed 20261110); 3 free checker models plus a free quality judge; reviewer read every card, source-checked flagged/disputed/missing-evidence cards and a 40-50% sample of clean ones against Wikipedia. Only cards sealing white/green/blue are kept (free-model rule). Evidence: /workspace/free-si/trivia-pilot/run-20261110j/.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261110J: Partial<Record<PlusCat, TriviaQ[]>> = {
	political: [
		// https://en.wikipedia.org/wiki/United_States_Senate
		q("Which amendment established the popular election of senators?", ["Twenty-second Amendment", "Nineteenth Amendment", "Seventeenth Amendment", "Twenty-fifth Amendment"], "Seventeenth Amendment", 2),
		// https://en.wikipedia.org/wiki/United_States_Senate
		q("Which body has the exclusive power to confirm U.S. presidential appointments?", ["The President", "The Senate", "The House of Representatives", "The Supreme Court"], "The Senate", 2),
		// https://en.wikipedia.org/wiki/Sejm
		q("How many deputies compose the Sejm?", ["350", "500", "400", "460"], "460", 2),
		// https://en.wikipedia.org/wiki/Sejm
		q("During the Polish People's Republic, the Sejm was widely considered a what?", ["legislative committee", "rubber stamp legislature", "supreme court", "executive council"], "rubber stamp legislature", 2),
		// https://en.wikipedia.org/wiki/Sejm
		q("What is the Sejm in Poland's parliament?", ["Judicial branch", "Upper house", "Lower house", "Executive branch"], "Lower house", 1),
		// https://en.wikipedia.org/wiki/Folketing
		q("Where does the Folketing hold its sessions?", ["Frederiksborg Castle", "Rosenborg Castle", "Amalienborg Palace", "Christiansborg Palace"], "Christiansborg Palace", 2),
		// https://en.wikipedia.org/wiki/Althing
		q("In what year was the Althing established?", ["930", "1000", "1262", "1845"], "930", 1),
		// https://en.wikipedia.org/wiki/Folketing
		q("In which building does the Folketing meet?", ["Christiansborg Palace", "Amalienborg Palace", "Frederiksberg Palace", "Rosenborg Castle"], "Christiansborg Palace", 1),
		// https://en.wikipedia.org/wiki/Dáil_Éireann
		q("In which city does the Dáil Éireann meet?", ["Dublin", "Limerick", "Cork", "Galway"], "Dublin", 1),
		// https://en.wikipedia.org/wiki/Dáil_Éireann
		q("What is the title given to members of Dáil Éireann?", ["MP", "Senator", "Teachta Dála", "Councillor"], "Teachta Dála", 1),
		// https://en.wikipedia.org/wiki/Althing
		q("At which historic site was the original Althing held?", ["Þingvellir", "Reykjavík", "Akureyri", "Hvolsvöllur"], "Þingvellir", 2),
		// https://en.wikipedia.org/wiki/Sejm
		q("What is the official title of the Sejm's presiding officer?", ["Marshal of the Sejm", "Speaker of the Senate", "President of Poland", "Prime Minister"], "Marshal of the Sejm", 2),
		// https://en.wikipedia.org/wiki/Sejm
		q("What is the Sejm in the Polish government?", ["Upper house", "Lower house", "Supreme court", "Executive branch"], "Lower house", 1),
		// https://en.wikipedia.org/wiki/Folketing
		q("How many members are in the Folketing?", ["179", "175", "180", "170"], "179", 2),
		// https://en.wikipedia.org/wiki/Dáil_Éireann
		q("How many members make up the Dáil Éireann?", ["174", "150", "180", "200"], "174", 2),
		// https://en.wikipedia.org/wiki/Althing
		q("How many members sit in the Icelandic Althing?", ["70", "80", "63", "50"], "63", 2),
		// https://en.wikipedia.org/wiki/Dáil_Éireann
		q("In which Dublin building does Dáil Éireann meet?", ["Leinster House", "Áras an Uachtaráin", "Custom House", "Government Buildings"], "Leinster House", 2),
		// https://en.wikipedia.org/wiki/Sejm
		q("Which party's decisions did the Sejm rubber-stamp during the Polish People's Republic?", ["Democratic Party", "Polish United Workers' Party", "Solidarity", "Polish People's Party"], "Polish United Workers' Party", 2),
		// https://en.wikipedia.org/wiki/United_States_Senate
		q("Since what year have U.S. senators been elected by popular vote?", ["1913", "1789", "1900", "1920"], "1913", 2),
	],
	games: [
		// https://en.wikipedia.org/wiki/Candy_Land
		q("Who created the board game Candy Land?", ["Milton Bradley", "Eleanor Abbott", "Charles Doud", "Reuben Garfinkel"], "Eleanor Abbott", 2),
		// https://en.wikipedia.org/wiki/Tic-tac-toe
		q("What is the Canadian English name for tic-tac-toe?", ["Xs and Os", "Crosses and Noughts", "Lines and Dots", "Squares and Circles"], "Xs and Os", 2),
		// https://en.wikipedia.org/wiki/Dominoes
		q("How many tiles are in a traditional European domino set?", ["24", "28", "21", "32"], "28", 1),
		// https://en.wikipedia.org/wiki/Mouse_Trap_(board_game)
		q("In what year was the board game Mouse Trap first published?", ["1963", "1959", "1980", "1972"], "1963", 1),
		// https://en.wikipedia.org/wiki/Candy_Land
		q("In what year was the board game Candy Land first published?", ["1962", "1955", "1938", "1949"], "1949", 1),
		// https://en.wikipedia.org/wiki/Snakes_and_ladders
		q("In the original Indian version, what did ladders symbolize?", ["Virtues", "Wealth", "Education", "Power"], "Virtues", 2),
		// https://en.wikipedia.org/wiki/Tic-tac-toe
		q("What is the alternative name for tic-tac-toe in Commonwealth English?", ["lines and squares", "dots and boxes", "crosses and circles", "noughts and crosses"], "noughts and crosses", 1),
		// https://en.wikipedia.org/wiki/Mouse_Trap_(board_game)
		q("Which company originally published Mouse Trap?", ["Ideal", "Hasbro", "Mattel", "Milton Bradley"], "Ideal", 2),
		// https://en.wikipedia.org/wiki/Crossword
		q("Which newspaper popularized the modern form of crosswords in the 1910s?", ["The Washington Post", "The Chicago Tribune", "The Times", "New York World"], "New York World", 2),
		// https://en.wikipedia.org/wiki/Hungry_Hungry_Hippos
		q("Who invented the idea for Hungry Hungry Hippos?", ["John H. Kroll", "Ellen Kullman", "Fred Kroll", "Ralph H. Baer"], "Fred Kroll", 2),
		// https://en.wikipedia.org/wiki/Snakes_and_ladders
		q("What moral concept do the ladders represent in the historic version of the game?", ["Virtues", "Vices", "Sins", "Rewards"], "Virtues", 2),
		// https://en.wikipedia.org/wiki/Candy_Land
		q("What type of board game is Candy Land?", ["Strategy", "Racing", "Role-playing", "Puzzle"], "Racing", 2),
		// https://en.wikipedia.org/wiki/Dominoes
		q("What is the likely origin of the name 'domino'?", ["Latin for two", "carnival costume", "French noble", "dice"], "carnival costume", 2),
		// https://en.wikipedia.org/wiki/Mouse_Trap_(board_game)
		q("In the board game Mouse Trap, the trap is built in the style of what?", ["a Rube Goldberg machine", "a pulley system", "a hydraulic press", "a simple lever"], "a Rube Goldberg machine", 2),
		// https://en.wikipedia.org/wiki/Operation_(game)
		q("Which company initially produced Operation in 1965?", ["Mattel", "Hasbro", "Parker Brothers", "Milton Bradley"], "Milton Bradley", 1),
		// https://en.wikipedia.org/wiki/Snakes_and_ladders
		q("What is the original Indian name for the game Snakes and ladders?", ["Chutes Patam", "Vice Patam", "Ludo Patam", "Moksha Patam"], "Moksha Patam", 1),
		// https://en.wikipedia.org/wiki/Tic-tac-toe
		q("What is the theoretical outcome of tic-tac-toe with perfect play?", ["Random outcome", "Forced draw", "Second-player win", "First-player win"], "Forced draw", 2),
		// https://en.wikipedia.org/wiki/Draughts
		q("How many squares are on the board for international draughts?", ["144", "81", "100", "64"], "100", 1),
		// https://en.wikipedia.org/wiki/Snakes_and_ladders
		q("In which ancient country did the game Snakes and ladders originate?", ["India", "China", "Greece", "Egypt"], "India", 1),
		// https://en.wikipedia.org/wiki/Hungry_Hungry_Hippos
		q("Which company produces the game Hungry Hungry Hippos?", ["Parker Brothers", "Hasbro", "Ravensburger", "Mattel"], "Hasbro", 1),
		// https://en.wikipedia.org/wiki/Crossword
		q("What is a person who constructs or solves crosswords called?", ["puzzler", "lexicographer", "cruciverbalist", "crosswordist"], "cruciverbalist", 2),
		// https://en.wikipedia.org/wiki/Draughts
		q("What is the North American English name for draughts?", ["Backgammon", "Chess", "Checkers", "Go"], "Checkers", 1),
		// https://en.wikipedia.org/wiki/Snakes_and_ladders
		q("What is the alternate name for Snakes and Ladders sold by Milton Bradley?", ["Snakes and Chutes", "Moksha Patam", "Chutes and Ladders", "Ladders and Slides"], "Chutes and Ladders", 1),
		// https://en.wikipedia.org/wiki/Hungry_Hungry_Hippos
		q("In what year was Hungry Hungry Hippos introduced?", ["1978", "1980", "1972", "1975"], "1978", 1),
		// https://en.wikipedia.org/wiki/Candy_Land
		q("Which company published Candy Land in 1949?", ["Mattel", "Milton Bradley", "Parker Brothers", "Hasbro"], "Milton Bradley", 1),
		// https://en.wikipedia.org/wiki/Mancala
		q("In which ancient civilization is there evidence of Mancala?", ["Ancient Egypt", "Ancient Rome", "Ancient Greece", "Ancient China"], "Ancient Egypt", 1),
		// https://en.wikipedia.org/wiki/Dominoes
		q("Which domino game is the most popular league and pub game in Britain?", ["Domino Whist", "Fives and Threes", "Chicken Foot", "Mexican Train"], "Fives and Threes", 2),
		// https://en.wikipedia.org/wiki/Dominoes
		q("The name 'domino' likely comes from a costume worn at which festival?", ["Oktoberfest", "Mardi Gras", "Carnival of Brazil", "Venetian Carnival"], "Venetian Carnival", 1),
		// https://en.wikipedia.org/wiki/Dominoes
		q("In which country did modern dominoes first appear in the mid-18th century?", ["Italy", "Germany", "France", "England"], "France", 2),
		// https://en.wikipedia.org/wiki/Mancala
		q("How many players does a typical Mancala game involve?", ["five", "four", "three", "two"], "two", 2),
		// https://en.wikipedia.org/wiki/Operation_(game)
		q("How much did John Spinello sell his rights to Marvin Glass for?", ["$500", "$100", "$5,000", "$50"], "$500", 2),
		// https://en.wikipedia.org/wiki/Crossword
		q("What type of symmetry is usually present in a crossword grid?", ["radially symmetric", "rotationally symmetric", "bilaterally symmetric", "asymmetric"], "rotationally symmetric", 2),
		// https://en.wikipedia.org/wiki/Draughts
		q("What is another name for American checkers?", ["Turkish draughts", "Russian draughts", "Armenian draughts", "English draughts"], "English draughts", 1),
		// https://en.wikipedia.org/wiki/Sudoku
		q("What was Sudoku originally called?", ["Number Grid", "Su Doku", "Digit Single", "Number Place"], "Number Place", 2),
		// https://en.wikipedia.org/wiki/Candy_Land
		q("What skill is not required to play Candy Land?", ["Counting", "Memory", "Strategic planning", "Reading"], "Reading", 2),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Elvis_Presley
		q("What was Elvis Presley's first RCA Victor single?", ["Heartbreak Hotel", "Blue Suede Shoes", "Hound Dog", "Jailhouse Rock"], "Heartbreak Hotel", 2),
		// https://en.wikipedia.org/wiki/Martha_Stewart
		q("How many months did Martha Stewart serve in federal prison?", ["twelve months", "three months", "five months", "six months"], "five months", 2),
		// https://en.wikipedia.org/wiki/Diana,_Princess_of_Wales
		q("What was Diana's maiden surname?", ["Mountbatten", "Spencer", "Bourbon", "Windsor"], "Spencer", 1),
		// https://en.wikipedia.org/wiki/Harrison_Ford
		q("For which film did Harrison Ford receive his only Academy Award nomination for Best Actor?", ["Air Force One", "Patriot Games", "The Fugitive", "Witness"], "Witness", 2),
		// https://en.wikipedia.org/wiki/Jacqueline_Kennedy_Onassis
		q("In which year did Jacqueline Kennedy marry John F. Kennedy?", ["1951", "1953", "1960", "1955"], "1953", 1),
		// https://en.wikipedia.org/wiki/Elvis_Presley
		q("In what year did Elvis Presley make his film debut?", ["1956", "1957", "1958", "1955"], "1956", 2),
		// https://en.wikipedia.org/wiki/Harrison_Ford
		q("Who is Harrison Ford married to?", ["Carrie Fisher", "Julia Roberts", "Meryl Streep", "Calista Flockhart"], "Calista Flockhart", 2),
		// https://en.wikipedia.org/wiki/Jacqueline_Kennedy_Onassis
		q("After the death of her second husband, what career did Jacqueline Kennedy pursue?", ["Politician", "Fashion designer", "Journalist", "Book editor"], "Book editor", 2),
		// https://en.wikipedia.org/wiki/Anthony_Bourdain
		q("Which network aired Bourdain's first television show, A Cook's Tour?", ["PBS", "Food Network", "CNN", "Travel Channel"], "Food Network", 2),
		// https://en.wikipedia.org/wiki/Meryl_Streep
		q("Which film earned Meryl Streep her first Academy Award?", ["Sophie's Choice", "The Deer Hunter", "Julia", "Kramer vs. Kramer"], "Kramer vs. Kramer", 1),
		// https://en.wikipedia.org/wiki/Diana,_Princess_of_Wales
		q("Which organization did Diana work with to promote landmine removal?", ["World Health Organization", "UNICEF", "International Red Cross", "Doctors Without Borders"], "International Red Cross", 2),
		// https://en.wikipedia.org/wiki/Jacqueline_Kennedy_Onassis
		q("What was the name of Jacqueline Kennedy's personal style?", ["New York Style", "First Lady Chic", "Jackie Look", "Cold War Fashion"], "Jackie Look", 1),
		// https://en.wikipedia.org/wiki/Harrison_Ford
		q("Which character did Ford portray in the original Star Wars film?", ["Obi‑Wan Kenobi", "Darth Vader", "Han Solo", "Luke Skywalker"], "Han Solo", 1),
		// https://en.wikipedia.org/wiki/Bill_Nye
		q("In which city was Bill Nye born?", ["New York City", "Washington, D.C.", "Seattle, Washington", "Los Angeles, California"], "Washington, D.C.", 1),
		// https://en.wikipedia.org/wiki/Diana,_Princess_of_Wales
		q("What verdict was returned at Diana's inquest?", ["Accidental death", "Suicide", "Natural causes", "Unlawful killing"], "Unlawful killing", 2),
		// https://en.wikipedia.org/wiki/Anthony_Bourdain
		q("Which culinary institute did Anthony Bourdain graduate from in 1978?", ["Johnson & Wales University", "Institute of Culinary Education", "Le Cordon Bleu", "Culinary Institute of America"], "Culinary Institute of America", 2),
		// https://en.wikipedia.org/wiki/Clint_Eastwood
		q("Which city did Clint Eastwood serve as mayor?", ["Carmel-by-the-Sea", "Santa Monica", "Los Angeles", "San Francisco"], "Carmel-by-the-Sea", 2),
		// https://en.wikipedia.org/wiki/Clint_Eastwood
		q("What television series gave Clint Eastwood early success?", ["Rawhide", "Gunsmoke", "Bonanza", "The Rifleman"], "Rawhide", 1),
		// https://en.wikipedia.org/wiki/Marilyn_Monroe
		q("In which city was Marilyn Monroe born?", ["Chicago", "San Francisco", "New York", "Los Angeles"], "Los Angeles", 1),
		// https://en.wikipedia.org/wiki/Tom_Hanks
		q("In which 1994 film did Tom Hanks play the title character?", ["Big", "Forrest Gump", "Sleepless in Seattle", "Philadelphia"], "Forrest Gump", 1),
		// https://en.wikipedia.org/wiki/Tom_Hanks
		q("How many Academy Awards has Tom Hanks won?", ["Three", "Four", "Two", "One"], "Two", 1),
		// https://en.wikipedia.org/wiki/Clint_Eastwood
		q("What is the nickname of Clint Eastwood's character in Sergio Leone's Dollars Trilogy?", ["Man with No Name", "The Lone Rider", "The Drifter", "The Stranger"], "Man with No Name", 1),
		// https://en.wikipedia.org/wiki/Anthony_Bourdain
		q("At which Manhattan restaurant did Bourdain serve as executive chef?", ["Per Se", "Gramercy Tavern", "Le Bernardin", "Brasserie Les Halles"], "Brasserie Les Halles", 2),
		// https://en.wikipedia.org/wiki/Ellen_DeGeneres
		q("Which Ellen DeGeneres television episode made her the first openly gay lead character on American network TV?", ["The Gay Episode", "The Reveal Episode", "The Coming Out Episode", "The Puppy Episode"], "The Puppy Episode", 2),
		// https://en.wikipedia.org/wiki/Tom_Hanks
		q("What was Tom Hanks' breakthrough television role in a sitcom?", ["From the Earth to the Moon", "Saturday Night Live", "Olive Kitteridge", "Bosom Buddies"], "Bosom Buddies", 2),
		// https://en.wikipedia.org/wiki/Jacqueline_Kennedy_Onassis
		q("What was Jacqueline Kennedy's maiden name?", ["Williams", "Bouvier", "Johnson", "Smith"], "Bouvier", 1),
		// https://en.wikipedia.org/wiki/Meryl_Streep
		q("How many Academy Awards has Meryl Streep won?", ["one", "two", "three", "four"], "three", 2),
		// https://en.wikipedia.org/wiki/Meryl_Streep
		q("Which drama school did Meryl Streep attend?", ["Yale School of Drama", "Royal Academy of Dramatic Art", "Juilliard School", "Carnegie Mellon University"], "Yale School of Drama", 1),
		// https://en.wikipedia.org/wiki/Clint_Eastwood
		q("For which two films did Eastwood win Academy Awards for Best Director and Best Picture?", ["Dirty Harry and Hang 'Em High", "Mystic River and Letters from Iwo Jima", "Unforgiven and Million Dollar Baby", "Gran Torino and The Mule"], "Unforgiven and Million Dollar Baby", 2),
		// https://en.wikipedia.org/wiki/Anthony_Bourdain
		q("Which magazine published the 1990s essay that started Bourdain's writing career?", ["GQ Magazine", "Esquire", "Vanity Fair", "The New Yorker"], "The New Yorker", 2),
		// https://en.wikipedia.org/wiki/Elvis_Presley
		q("What was the title of Elvis Presley's first film?", ["Blue Hawaii", "Viva Las Vegas", "Love Me Tender", "Jailhouse Rock"], "Love Me Tender", 2),
		// https://en.wikipedia.org/wiki/Diana,_Princess_of_Wales
		q("Which humanitarian cause did Diana champion involving explosive devices?", ["Landmines", "Biological weapons", "Nuclear weapons", "Chemical weapons"], "Landmines", 2),
		// https://en.wikipedia.org/wiki/Tom_Hanks
		q("Which character does Tom Hanks voice in the Toy Story franchise?", ["Mr. Potato Head", "Buzz Lightyear", "Rex", "Sheriff Woody"], "Sheriff Woody", 2),
		// https://en.wikipedia.org/wiki/Marilyn_Monroe
		q("Which acting teacher did Monroe study method acting with?", ["Sanford Meisner", "Uta Hagen", "Lee Strasberg", "Stella Adler"], "Lee Strasberg", 2),
		// https://en.wikipedia.org/wiki/Jacqueline_Kennedy_Onassis
		q("Who did Jacqueline Kennedy marry in September 1953?", ["Aristotle Onassis", "Richard Nixon", "Lyndon B. Johnson", "John F. Kennedy"], "John F. Kennedy", 1),
		// https://en.wikipedia.org/wiki/Tom_Hanks
		q("Which director has Tom Hanks collaborated with on five films?", ["Nora Ephron", "Steven Spielberg", "Robert Zemeckis", "Ron Howard"], "Steven Spielberg", 1),
		// https://en.wikipedia.org/wiki/Harrison_Ford
		q("For which Apple TV+ comedy series did Ford receive Primetime Emmy nominations?", ["Ted Lasso", "Shrinking", "The Crown", "1923"], "Shrinking", 2),
		// https://en.wikipedia.org/wiki/Meryl_Streep
		q("From which university did Meryl Streep earn a Master of Fine Arts?", ["Yale School of Drama", "Juilliard School", "London Academy of Music", "Tisch School of the Arts"], "Yale School of Drama", 2),
		// https://en.wikipedia.org/wiki/Diana,_Princess_of_Wales
		q("In which year did Diana marry Prince Charles?", ["1982", "1980", "1981", "1983"], "1981", 1),
		// https://en.wikipedia.org/wiki/Ellen_DeGeneres
		q("Which character did Ellen DeGeneres voice in Finding Nemo?", ["Marlin", "Bruce", "Dory", "Nemo"], "Dory", 2),
		// https://en.wikipedia.org/wiki/Jacqueline_Kennedy_Onassis
		q("During which years did Jacqueline Kennedy serve as First Lady of the United States?", ["1960 to 1964", "1961 to 1963", "1959 to 1963", "1962 to 1965"], "1961 to 1963", 1),
		// https://en.wikipedia.org/wiki/Tom_Hanks
		q("Which production company did Tom Hanks launch?", ["Playtone", "Amblin Entertainment", "New Regency", "Bad Robot"], "Playtone", 2),
		// https://en.wikipedia.org/wiki/Diana,_Princess_of_Wales
		q("Where did Diana and Charles hold their wedding ceremony?", ["St George's Chapel", "St Paul's Cathedral", "Buckingham Palace", "Westminster Abbey"], "St Paul's Cathedral", 1),
		// https://en.wikipedia.org/wiki/Harrison_Ford
		q("What qualification does Harrison Ford hold outside of acting?", ["professional chef", "commercial driver", "certified scuba diver", "licensed pilot"], "licensed pilot", 2),
		// https://en.wikipedia.org/wiki/Harrison_Ford
		q("In which film franchise did Ford play the titular character?", ["Die Hard", "James Bond", "Indiana Jones", "Mission: Impossible"], "Indiana Jones", 1),
		// https://en.wikipedia.org/wiki/Martha_Stewart
		q("What media company did Martha Stewart found?", ["Martha Stewart Living Omnimedia", "Martha Stewart Enterprises", "Martha Stewart Publishing", "Martha Stewart Media Group"], "Martha Stewart Living Omnimedia", 1),
		// https://en.wikipedia.org/wiki/Martha_Stewart
		q("Which company's stock trading case led to Martha Stewart's felony conviction?", ["WorldCom", "Tyco", "ImClone", "Enron"], "ImClone", 2),
		// https://en.wikipedia.org/wiki/Marilyn_Monroe
		q("Which film earned Marilyn Monroe a Golden Globe award?", ["Gentlemen Prefer Blondes", "Bus Stop", "Some Like It Hot", "The Misfits"], "Some Like It Hot", 2),
		// https://en.wikipedia.org/wiki/Clint_Eastwood
		q("Which character did Eastwood portray in the Dirty Harry films?", ["Harry Callahan", "John McClane", "Martin Riggs", "Frank Castle"], "Harry Callahan", 1),
		// https://en.wikipedia.org/wiki/Anthony_Bourdain
		q("What was the title of Bourdain's 2000 best-selling book?", ["Midnight in the Kitchen", "The Omnivore's Dilemma", "Appetite for Life", "Kitchen Confidential"], "Kitchen Confidential", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Xylophone
		q("What family of instruments does the xylophone belong to?", ["string family", "percussion family", "wind family", "brass family"], "percussion family", 1),
		// https://en.wikipedia.org/wiki/Harp
		q("How are harp strings played?", ["plucked with the fingers", "bowed with a bow", "struck with a mallet", "blown through a mouthpiece"], "plucked with the fingers", 1),
		// https://en.wikipedia.org/wiki/Banjo
		q("Which instrument is commonly paired with the banjo in American old‑time music?", ["mandolin", "harmonica", "accordion", "fiddle"], "fiddle", 1),
		// https://en.wikipedia.org/wiki/Bluegrass_music
		q("What term describes fast‑tempo instrumental pieces in bluegrass?", ["Jig", "Breakdown", "Ballad", "Hymn"], "Breakdown", 2),
		// https://en.wikipedia.org/wiki/Saxophone
		q("In what year was the saxophone patented?", ["1842", "1850", "1840", "1846"], "1846", 2),
		// https://en.wikipedia.org/wiki/Xylophone
		q("In an orchestra the xylophone has a higher pitch range than which instrument?", ["marimba", "flute", "viola", "timpani"], "marimba", 2),
		// https://en.wikipedia.org/wiki/Bluegrass_music
		q("Which 5-string banjo player helped Bill Monroe develop bluegrass?", ["Charlie Parker", "Benny Goodman", "Earl Scruggs", "John Hartford"], "Earl Scruggs", 2),
		// https://en.wikipedia.org/wiki/Harp
		q("What material are harps most commonly made of?", ["Wood", "Plastic", "Glass", "Metal"], "Wood", 1),
		// https://en.wikipedia.org/wiki/Bluegrass_music
		q("In which decade did bluegrass music develop?", ["1960s", "1950s", "1940s", "1970s"], "1940s", 1),
		// https://en.wikipedia.org/wiki/Banjo
		q("By the mid-20th century, the banjo had become strongly associated with which music genre?", ["bluegrass", "rock", "hip hop", "classical"], "bluegrass", 2),
		// https://en.wikipedia.org/wiki/Kazoo
		q("What is the name of the smaller version of the kazoo?", ["tiny kazoo", "humazoo", "mini kaz", "micro buzz"], "humazoo", 2),
		// https://en.wikipedia.org/wiki/Accordion
		q("To which instrument family does the accordion belong?", ["string instrument", "brass instrument", "percussion instrument", "free-reed aerophone"], "free-reed aerophone", 2),
		// https://en.wikipedia.org/wiki/Banjo
		q("During which century did minstrel shows popularize the banjo in the United Kingdom and United States?", ["19th century", "18th century", "21st century", "20th century"], "19th century", 2),
		// https://en.wikipedia.org/wiki/Kazoo
		q("What instrument adds a buzzing timbral quality to a player's voice?", ["violin", "flute", "trumpet", "kazoo"], "kazoo", 1),
		// https://en.wikipedia.org/wiki/Harp
		q("What shape are most harps?", ["circular", "triangular", "rectangular", "square"], "triangular", 1),
		// https://en.wikipedia.org/wiki/Kazoo
		q("What material is used for the vibrating membrane of a kazoo?", ["rubber membrane", "goldbeater's skin", "metal foil", "plastic film"], "goldbeater's skin", 2),
		// https://en.wikipedia.org/wiki/Harp
		q("In which ancient civilization were early harp depictions recorded?", ["Rome", "Mesopotamia", "Mesoamerica", "Greece"], "Mesopotamia", 2),
		// https://en.wikipedia.org/wiki/Xylophone
		q("What material are the bars of a traditional xylophone made of?", ["Metal", "Plastic", "Glass", "Wood"], "Wood", 1),
		// https://en.wikipedia.org/wiki/Calypso_music
		q("Which language did calypso migrate into as it developed?", ["English", "French", "Spanish", "Dutch"], "English", 1),
		// https://en.wikipedia.org/wiki/Xylophone
		q("From which ancient language does the word xylophone derive?", ["Latin", "Egyptian", "Greek", "Sanskrit"], "Greek", 2),
		// https://en.wikipedia.org/wiki/Harp
		q("The harp is a national symbol of which country?", ["England", "Scotland", "Ireland", "Wales"], "Ireland", 2),
		// https://en.wikipedia.org/wiki/Banjo
		q("Which traveling shows piqued interest in the banjo in the 19th century?", ["Blackface minstrel shows", "Vaudeville circuits", "Opera tours", "Circus performances"], "Blackface minstrel shows", 2),
		// https://en.wikipedia.org/wiki/Xylophone
		q("Which instrument has a higher pitch range and drier timbre than the marimba?", ["xylophone", "celesta", "glockenspiel", "vibraphone"], "xylophone", 2),
		// https://en.wikipedia.org/wiki/Bluegrass_music
		q("What type of instruments are traditionally used in bluegrass?", ["Electric instruments", "Acoustic instruments", "Digital synthesizers", "Percussion only"], "Acoustic instruments", 2),
		// https://en.wikipedia.org/wiki/Accordion
		q("In which country is the accordion used in norteño music?", ["Colombia", "Mexico", "Brazil", "Argentina"], "Mexico", 2),
		// https://en.wikipedia.org/wiki/Calypso_music
		q("What language was calypso historically sung in?", ["English", "French creole", "Spanish", "Portuguese"], "French creole", 1),
		// https://en.wikipedia.org/wiki/Banjo
		q("Which group fashioned early forms of the banjo?", ["Native Americans", "Asian immigrants", "African diaspora", "European settlers"], "African diaspora", 2),
		// https://en.wikipedia.org/wiki/Bluegrass_music
		q("Which instrument is NOT traditionally used in bluegrass?", ["Banjo", "Mandolin", "Piano", "Fiddle"], "Piano", 1),
	],
	books: [
		// https://en.wikipedia.org/wiki/The_Call_of_the_Wild
		q("In what year was The Call of the Wild first published?", ["1905", "1910", "1901", "1903"], "1903", 1),
		// https://en.wikipedia.org/wiki/Robinson_Crusoe
		q("How many years did Robinson Crusoe spend on his island in Defoe's novel?", ["5 years", "28 years", "40 years", "12 years"], "28 years", 2),
		// https://en.wikipedia.org/wiki/Robinson_Crusoe
		q("When was Robinson Crusoe first published?", ["12 March 1718", "5 May 1720", "25 April 1719", "1 January 1721"], "25 April 1719", 1),
		// https://en.wikipedia.org/wiki/Gulliver's_Travels
		q("In Gulliver's Travels, in whose land does Gulliver meet rational horses?", ["Lilliput", "Brobdingnag", "Laputa", "Houyhnhnms"], "Houyhnhnms", 2),
		// https://en.wikipedia.org/wiki/Gulliver's_Travels
		q("In what year was Gulliver's Travels first published?", ["1730", "1742", "1715", "1726"], "1726", 1),
		// https://en.wikipedia.org/wiki/The_Secret_Garden
		q("In which country is The Secret Garden set?", ["Wales", "Scotland", "England", "Ireland"], "England", 1),
		// https://en.wikipedia.org/wiki/Gulliver's_Travels
		q("Which fictional island did Gulliver's Travels popularise?", ["Lilliput", "Houyhnhnms", "Laputa", "Brobdingnag"], "Lilliput", 1),
		// https://en.wikipedia.org/wiki/Alice's_Adventures_in_Wonderland
		q("Who illustrated the original edition of Alice's Adventures in Wonderland?", ["John Tenniel", "Edmund Dulac", "Beatrix Potter", "Arthur Rackham"], "John Tenniel", 2),
		// https://en.wikipedia.org/wiki/Robinson_Crusoe
		q("Near the coasts of which two countries does the island in Robinson Crusoe lie?", ["Colombia and Guyana", "Brazil and Suriname", "Venezuela and Trinidad", "Ecuador and Panama"], "Venezuela and Trinidad", 2),
		// https://en.wikipedia.org/wiki/Alice's_Adventures_in_Wonderland
		q("In what year was Alice's Adventures in Wonderland published?", ["1871", "1850", "1890", "1865"], "1865", 1),
		// https://en.wikipedia.org/wiki/Robinson_Crusoe
		q("Which real-life castaway inspired the story of Robinson Crusoe?", ["Alexander Selkirk", "William Bligh", "Pedro Serrano", "James Cook"], "Alexander Selkirk", 2),
		// https://en.wikipedia.org/wiki/The_Secret_Garden
		q("In what year was The Secret Garden first published in book form?", ["1905", "1911", "1915", "1920"], "1911", 1),
		// https://en.wikipedia.org/wiki/Gulliver's_Travels
		q("What did Jonathan Swift say was his purpose for writing Gulliver's Travels?", ["to promote travel", "to vex the world", "to criticize monarchy", "to entertain children"], "to vex the world", 2),
		// https://en.wikipedia.org/wiki/Alice's_Adventures_in_Wonderland
		q("In what year was the sequel Through the Looking‑Glass published?", ["1885", "1871", "1892", "1868"], "1871", 2),
		// https://en.wikipedia.org/wiki/Robinson_Crusoe
		q("What is the birth name of the title character in Robinson Crusoe?", ["Robert Kreutz", "John Robinson", "Robinson Crusoe", "Robinson Kreutznaer"], "Robinson Kreutznaer", 2),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Amazon_River
		q("Which river is the Amazon's length disputed with?", ["Mississippi", "Yangtze", "Nile", "Danube"], "Nile", 1),
		// https://en.wikipedia.org/wiki/Sahara
		q("Which desert is larger than the Sahara overall?", ["Kalahari", "Mojave", "Antarctica", "Gobi"], "Antarctica", 2),
		// https://en.wikipedia.org/wiki/Grand_Canyon
		q("Who was the first European known to view the Grand Canyon?", ["Francisco Vázquez de Coronado", "Juan de Oñate", "García López de Cárdenas", "Hernán Cortés"], "García López de Cárdenas", 2),
		// https://en.wikipedia.org/wiki/Amazon_River
		q("What percentage of global riverine discharge into oceans does the Amazon represent?", ["20%", "10%", "15%", "30%"], "20%", 2),
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("What is the name of the notorious icefall on Mount Everest's standard climbing route?", ["Khumbu Icefall", "Mahalangur Himal", "Southeast Ridge", "North Col"], "Khumbu Icefall", 2),
		// https://en.wikipedia.org/wiki/Amazon_River
		q("Which river is the largest by discharge volume?", ["Nile River", "Mississippi River", "Amazon River", "Yangtze River"], "Amazon River", 1),
		// https://en.wikipedia.org/wiki/Sahara
		q("Which semi‑arid belt bounds the Sahara to the south?", ["Sahel", "Steppe", "Pampas", "Savanna"], "Sahel", 2),
		// https://en.wikipedia.org/wiki/Niagara_Falls
		q("Which waterfall is also called the Canadian Falls?", ["Goat Falls", "Bridal Veil Falls", "American Falls", "Horseshoe Falls"], "Horseshoe Falls", 2),
		// https://en.wikipedia.org/wiki/Grand_Canyon
		q("How long is the Grand Canyon in miles?", ["150", "320", "400", "277"], "277", 2),
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("What is the Nepali name for Mount Everest?", ["K2", "Chomolungma", "Sagarmāthā", "Annapurna"], "Sagarmāthā", 1),
		// https://en.wikipedia.org/wiki/Amazon_River
		q("What is the name of the phenomenon where the Amazon's dark and light waters meet near Manaus?", ["Joining of Flows", "Meeting of Waters", "Meeting of Streams", "Confluence of Waters"], "Meeting of Waters", 1),
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("Which two countries share the summit of Mount Everest?", ["India and Bhutan", "China and Nepal", "Pakistan and Afghanistan", "Tibet and India"], "China and Nepal", 1),
		// https://en.wikipedia.org/wiki/Niagara_Falls
		q("Which two countries does Niagara Falls span?", ["Canada and the U.S.", "Canada and France", "Canada and Mexico", "U.S. and Mexico"], "Canada and the U.S.", 1),
		// https://en.wikipedia.org/wiki/Amazon_River
		q("Which city is the largest on the Amazon River?", ["Manaus", "Iquitos", "Belém", "Santarem"], "Manaus", 1),
		// https://en.wikipedia.org/wiki/Niagara_Falls
		q("What is the largest of the three waterfalls at Niagara Falls called?", ["Horseshoe Falls", "American Falls", "Bridal Veil Falls", "Thunder Bay Falls"], "Horseshoe Falls", 1),
		// https://en.wikipedia.org/wiki/Niagara_Falls
		q("Which island separates Bridal Veil Falls from Horseshoe Falls?", ["Ellis Island", "Luna Island", "Goat Island", "Alcatraz Island"], "Goat Island", 2),
		// https://en.wikipedia.org/wiki/Amazon_River
		q("What is the name of the Amazon section above its confluence with the Rio Negro?", ["Negro River", "Ucayali River", "Marañón River", "Solimões River"], "Solimões River", 2),
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("Who made the first documented ascent of Mount Everest in 1953?", ["George Mallory and Andrew Irvine", "Tim Macartney-Snape and team", "Wang Fuzhou and Gonpo", "Tenzing Norgay and Edmund Hillary"], "Tenzing Norgay and Edmund Hillary", 1),
		// https://en.wikipedia.org/wiki/Niagara_Falls
		q("How many waterfalls make up Niagara Falls?", ["Three", "Five", "Two", "Four"], "Three", 1),
		// https://en.wikipedia.org/wiki/Niagara_Falls
		q("Which waterfall is the most powerful in North America by flow rate?", ["Bridal Veil Falls", "American Falls", "Horseshoe Falls", "Niagara Falls"], "Horseshoe Falls", 2),
		// https://en.wikipedia.org/wiki/Sahara
		q("The Sahara is the world's largest what?", ["cold desert", "hot desert", "grassland", "tropical forest"], "hot desert", 1),
		// https://en.wikipedia.org/wiki/Sahara
		q("Which ocean is to the west of the Sahara?", ["Arctic Ocean", "Atlantic Ocean", "Pacific Ocean", "Indian Ocean"], "Atlantic Ocean", 1),
		// https://en.wikipedia.org/wiki/Sahara
		q("What type of desert is the Sahara classified as?", ["coastal desert", "cold desert", "rainforest", "hot desert"], "hot desert", 1),
	],
};
