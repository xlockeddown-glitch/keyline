import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Free-model comparison batch (job trivia-free-20261109i, Nov 9 2026): 4 free generator models on a shared, randomly split pool of public Wikipedia intros; 3 free checker models; full reviewer source check against Wikipedia. Evidence: /workspace/free-si/trivia-pilot/run-20261109i/.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261109I: Partial<Record<PlusCat, TriviaQ[]>> = {
	political: [
		// https://en.wikipedia.org/wiki/Storting
		q("In what year was Norway's Storting established?", ["1814", "1820", "1800", "1900"], "1814", 2),
		// https://en.wikipedia.org/wiki/National_Diet
		q("In which year did the Imperial Diet become the National Diet under the post‑war constitution?", ["1936", "1947", "1890", "1912"], "1947", 1),
		// https://en.wikipedia.org/wiki/National_Diet
		q("What voting system is used to elect members of both houses of Japan's Diet?", ["single transferable vote", "mixed‑member proportional", "first‑past‑the‑post", "parallel voting system"], "parallel voting system", 2),
		// https://en.wikipedia.org/wiki/Senate_of_Canada
		q("Since what year have Canadian senators been required to retire at age 75?", ["1905", "1992", "1979", "1965"], "1965", 2),
		// https://en.wikipedia.org/wiki/Senate_of_Canada
		q("The Canadian Senate was modeled after which foreign legislative body?", ["U.S. Senate", "French Senate", "British House of Lords", "German Bundesrat"], "British House of Lords", 2),
		// https://en.wikipedia.org/wiki/Senate_of_Canada
		q("What term did Sir John A. Macdonald use to describe the Senate's function?", ["final arbiter", "upper chamber", "legislative watchdog", "sober second thought"], "sober second thought", 2),
		// https://en.wikipedia.org/wiki/Lok_Sabha
		q("What is the common name for the Lok Sabha?", ["House of Commons", "House of Lords", "House of Representatives", "House of the People"], "House of the People", 1),
		// https://en.wikipedia.org/wiki/Lok_Sabha
		q("In which city does the Lok Sabha meet?", ["Chennai", "Mumbai", "New Delhi", "Kolkata"], "New Delhi", 1),
		// https://en.wikipedia.org/wiki/Lok_Sabha
		q("How long do Lok Sabha members hold their seats?", ["Four years", "Six years", "Five years", "Three years"], "Five years", 2),
		// https://en.wikipedia.org/wiki/Lok_Sabha
		q("Which constitutional amendment abolished Anglo-Indian seats?", ["105th amendment", "103rd amendment", "104th amendment", "102nd amendment"], "104th amendment", 2),
		// https://en.wikipedia.org/wiki/Lok_Sabha
		q("What is the quorum for the Lok Sabha?", ["10% of total membership", "5% of total membership", "25% of total membership", "50% of total membership"], "10% of total membership", 2),
		// https://en.wikipedia.org/wiki/Parliament_of_Australia
		q("How many members are in the Australian Senate?", ["76", "100", "120", "150"], "76", 1),
		// https://en.wikipedia.org/wiki/Parliament_of_Australia
		q("What voting system is used to elect Australian Senators?", ["First past the post", "Full preferential voting", "Single transferable vote", "Party-list voting"], "Single transferable vote", 2),
		// https://en.wikipedia.org/wiki/Parliament_of_Australia
		q("What is the maximum term for the House of Representatives?", ["Three years", "Two years", "Four years", "Five years"], "Three years", 2),
		// https://en.wikipedia.org/wiki/Cortes_Generales
		q("What term length do members of the Cortes Generales serve?", ["six-year terms", "four-year terms", "three-year terms", "five-year terms"], "four-year terms", 2),
		// https://en.wikipedia.org/wiki/Cortes_Generales
		q("Which constitution created the modern Cortes Generales?", ["1978 Constitution of Spain", "1982 Constitution of Spain", "1975 Constitution of Spain", "1931 Constitution of Spain"], "1978 Constitution of Spain", 2),
		// https://en.wikipedia.org/wiki/Riksdag
		q("In what year did the Riksdag become unicameral?", ["1968", "1974", "1971", "1994"], "1971", 2),
		// https://en.wikipedia.org/wiki/Riksdag
		q("When did the feudal Riksdag of the Estates first assemble?", ["1435", "1523", "1436", "1809"], "1435", 2),
	],
	games: [
		// https://en.wikipedia.org/wiki/Stratego
		q("What size is the grid on a Stratego board?", ["8×8", "5×5", "10×10", "12×12"], "10×10", 1),
		// https://en.wikipedia.org/wiki/Stratego
		q("Which era of military insignia do Stratego pieces carry?", ["Greek", "Egyptian", "Roman", "Napoleonic"], "Napoleonic", 2),
		// https://en.wikipedia.org/wiki/Stratego
		q("Stratego is a modified copy of which early 20th-century French game?", ["L'Attaque", "Le Jeu", "Stratagem", "La Guerre"], "L'Attaque", 2),
		// https://en.wikipedia.org/wiki/Carcassonne_(board_game)
		q("Who designed Carcassonne?", ["Klaus-Jürgen Wrede", "Uwe Rosenberg", "Reiner Knizia", "Klaus Teuber"], "Klaus-Jürgen Wrede", 1),
		// https://en.wikipedia.org/wiki/Carcassonne_(board_game)
		q("In what year was the board game Carcassonne first published?", ["2002", "2000", "1999", "2001"], "2000", 1),
		// https://en.wikipedia.org/wiki/Connect_Four
		q("Who created Connect Four?", ["Sid Sackson", "Alex Randolph", "Howard Wexler", "Klaus-Jürgen Wrede"], "Howard Wexler", 1),
		// https://en.wikipedia.org/wiki/Connect_Four
		q("In what year did Milton Bradley first sell Connect Four?", ["1972", "1970", "1974", "1975"], "1974", 1),
		// https://en.wikipedia.org/wiki/Connect_Four
		q("What is Connect Four also known as?", ["Three in a Row", "Four in a Row", "Five in a Row", "Six in a Row"], "Four in a Row", 2),
		// https://en.wikipedia.org/wiki/Super_Mario_Bros.
		q("Who directed and produced Super Mario Bros.?", ["Takashi Tezuka", "Koji Kondo", "Shigeru Miyamoto", "Hiroshi Yamauchi"], "Shigeru Miyamoto", 2),
		// https://en.wikipedia.org/wiki/Super_Mario_Bros.
		q("What is the name of the kingdom Mario traverses in Super Mario Bros.?", ["Mushroom Kingdom", "Star Kingdom", "Koopa Kingdom", "Yoshi Island"], "Mushroom Kingdom", 2),
		// https://en.wikipedia.org/wiki/Donkey_Kong_(1981_video_game)
		q("In what year was Donkey Kong released?", ["1982", "1981", "1983", "1980"], "1981", 1),
		// https://en.wikipedia.org/wiki/Donkey_Kong_(1981_video_game)
		q("Which Nintendo president assigned the Donkey Kong project?", ["Tatsumi Kimishima", "Hiroshi Yamauchi", "Satoru Iwata", "Shigeru Miyamoto"], "Hiroshi Yamauchi", 2),
		// https://en.wikipedia.org/wiki/Donkey_Kong_(1981_video_game)
		q("What is the name of the damsel Mario rescues in Donkey Kong?", ["Toadette", "Peach", "Daisy", "Pauline"], "Pauline", 2),
		// https://en.wikipedia.org/wiki/Donkey_Kong_(1981_video_game)
		q("Which chief engineer co-designed Donkey Kong with Miyamoto?", ["Toshihiko Nakago", "Gunpei Yokoi", "Koji Kondo", "Shigesato Itoi"], "Gunpei Yokoi", 2),
		// https://en.wikipedia.org/wiki/Microsoft_Minesweeper
		q("In which Windows version was Minesweeper first included by default?", ["Windows 98", "Windows XP", "Windows 95", "Windows 3.1"], "Windows 3.1", 1),
		// https://en.wikipedia.org/wiki/Microsoft_Minesweeper
		q("Which company provided the updated Minesweeper version for Windows Vista?", ["Oberon Media", "Arkadium", "Electronic Arts", "Valve"], "Oberon Media", 2),
		// https://en.wikipedia.org/wiki/Microsoft_Minesweeper
		q("What game did Minesweeper replace in Windows 3.0?", ["Reversi", "Solitaire", "Chess", "FreeCell"], "Reversi", 2),
		// https://en.wikipedia.org/wiki/Microsoft_Minesweeper
		q("Which developer released the Microsoft Store version of Minesweeper for Windows 8 and later?", ["Microsoft Studios", "Valve", "Oberon Media", "Arkadium"], "Arkadium", 2),
		// https://en.wikipedia.org/wiki/Ticket_to_Ride_(board_game)
		q("In what year was the first Ticket to Ride released?", ["2006", "2002", "2008", "2004"], "2004", 1),
		// https://en.wikipedia.org/wiki/Ticket_to_Ride_(board_game)
		q("Which company released digital versions of Ticket to Ride?", ["Hasbro", "Rio Grande Games", "Days of Wonder", "Asmodee"], "Days of Wonder", 2),
		// https://en.wikipedia.org/wiki/Battleship_(game)
		q("Which company released the plastic board game version of Battleship in 1967?", ["Milton Bradley", "Parker Brothers", "Hasbro", "Mattel"], "Milton Bradley", 1),
		// https://en.wikipedia.org/wiki/Battleship_(game)
		q("From which war does the pencil-and-paper game Battleship date?", ["The Vietnam War", "World War II", "The Civil War", "World War I"], "World War I", 2),
		// https://en.wikipedia.org/wiki/Battleship_(game)
		q("In which decade was Battleship published as a pad-and-pencil game?", ["1930s", "1940s", "1920s", "1950s"], "1930s", 2),
		// https://en.wikipedia.org/wiki/Yahtzee
		q("Who first marketed the dice game Yahtzee in 1956?", ["Edwin S. Lowe", "Hasbro", "Anthony E. Pratt", "Milton Bradley"], "Edwin S. Lowe", 1),
		// https://en.wikipedia.org/wiki/Yahtzee
		q("How many dice are used in a game of Yahtzee?", ["Five", "Four", "Six", "Three"], "Five", 1),
		// https://en.wikipedia.org/wiki/Yahtzee
		q("How many points does a Yahtzee combination score?", ["25", "10", "100", "50"], "50", 2),
		// https://en.wikipedia.org/wiki/Yahtzee
		q("Which company acquired the rights to Yahtzee in 1973?", ["Winning Moves", "E.S. Lowe Company", "Hasbro", "Milton Bradley"], "Milton Bradley", 2),
		// https://en.wikipedia.org/wiki/Cluedo
		q("Who devised the game Cluedo in 1943?", ["Anthony E. Pratt", "Milton Bradley", "Edwin S. Lowe", "Waddingtons"], "Anthony E. Pratt", 1),
		// https://en.wikipedia.org/wiki/Cluedo
		q("Which company first manufactured Cluedo in the UK in 1949?", ["Milton Bradley", "Parker Brothers", "Waddingtons", "Hasbro"], "Waddingtons", 2),
		// https://en.wikipedia.org/wiki/Cluedo
		q("How many players can play Cluedo?", ["Two to four", "One to three", "Three to six", "Four to eight"], "Three to six", 2),
		// https://en.wikipedia.org/wiki/Cluedo
		q("What is the name of the 2008 modern spin-off of Cluedo?", ["Mansion Mystery", "The Classic Mystery", "Detective Edition", "Discover the Secrets"], "Discover the Secrets", 2),
		// https://en.wikipedia.org/wiki/Trivial_Pursuit
		q("In which country was the board game Trivial Pursuit originally developed?", ["United Kingdom", "Australia", "Canada", "United States"], "Canada", 1),
		// https://en.wikipedia.org/wiki/Trivial_Pursuit
		q("How many wedges must a player collect to win the game?", ["Ten", "Eight", "Six", "Four"], "Six", 2),
		// https://en.wikipedia.org/wiki/Pong
		q("In what year was the arcade game Pong released?", ["1976", "1974", "1970", "1972"], "1972", 1),
		// https://en.wikipedia.org/wiki/Pong
		q("Who created Pong as a training exercise for Atari?", ["Steve Jobs", "Ted Dabney", "Nolan Bushnell", "Allan Alcorn"], "Allan Alcorn", 2),
		// https://en.wikipedia.org/wiki/Pong
		q("Which home console's ping-pong game inspired Pong's concept?", ["Atari 2600", "Magnavox Odyssey", "Intellivision", "ColecoVision"], "Magnavox Odyssey", 2),
		// https://en.wikipedia.org/wiki/Pong
		q("Through which retailer was the home version of Pong sold exclusively in 1975?", ["Montgomery Ward", "Sears", "Macy's", "JCPenney"], "Sears", 2),
		// https://en.wikipedia.org/wiki/Pictionary
		q("Who invented the game Pictionary?", ["Gary Everson", "Alan Turoff", "Robert Abbott", "Robert Angel"], "Robert Angel", 1),
		// https://en.wikipedia.org/wiki/Pictionary
		q("In what year was Pictionary first published?", ["1989", "1985", "1983", "1987"], "1985", 1),
		// https://en.wikipedia.org/wiki/Pictionary
		q("Who created the graphic design for Pictionary?", ["Mel Torme", "Gary Everson", "Jeff Breslow", "Robert Angel"], "Gary Everson", 2),
		// https://en.wikipedia.org/wiki/Pictionary
		q("Which company purchased the rights to Pictionary in 1994?", ["Parker Brothers", "Mattel", "Milton Bradley", "Hasbro"], "Hasbro", 2),
		// https://en.wikipedia.org/wiki/Twister_(game)
		q("How many rows of colored circles are on the Twister mat?", ["five", "four", "three", "six"], "four", 2),
		// https://en.wikipedia.org/wiki/Twister_(game)
		q("What are the four colors of circles on the Twister mat?", ["green, blue, pink, white", "red, yellow, green and blue", "yellow, red, black, white", "red, blue, orange, purple"], "red, yellow, green and blue", 2),
		// https://en.wikipedia.org/wiki/Twister_(game)
		q("What device tells players where to place their hand or foot?", ["A timer", "A spinner", "A die", "A deck of cards"], "A spinner", 2),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("Who invented Risk?", ["Alex Randolph", "Reiner Knizia", "Albert Lamorisse", "Sid Sackson"], "Albert Lamorisse", 1),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("In what year was Risk invented?", ["1957", "1955", "1962", "1959"], "1957", 1),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("How many territories are on the standard Risk board?", ["36", "48", "54", "42"], "42", 2),
		// https://en.wikipedia.org/wiki/Risk_(game)
		q("How many continents are Risk's territories grouped into?", ["four", "five", "seven", "six"], "six", 2),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Keanu_Reeves
		q("In which city was Keanu Reeves born?", ["Beirut", "New York", "Los Angeles", "Toronto"], "Beirut", 1),
		// https://en.wikipedia.org/wiki/Keanu_Reeves
		q("What was Keanu Reeves's feature-film debut?", ["Speed", "The Matrix", "Youngblood", "Point Break"], "Youngblood", 2),
		// https://en.wikipedia.org/wiki/Keanu_Reeves
		q("Which custom motorcycle maker did Keanu Reeves co-found?", ["ARCH Motorcycle", "Honda", "Yamaha", "Harley Davidson"], "ARCH Motorcycle", 2),
		// https://en.wikipedia.org/wiki/Walt_Disney
		q("Which character was Walt Disney's first highly popular success?", ["Mickey Mouse", "Goofy", "Donald Duck", "Pluto"], "Mickey Mouse", 2),
		// https://en.wikipedia.org/wiki/Walt_Disney
		q("What illness caused Walt Disney's death in 1966?", ["Lung cancer", "Stroke", "Heart attack", "Accident"], "Lung cancer", 2),
		// https://en.wikipedia.org/wiki/Rowan_Atkinson
		q("In what year was Rowan Atkinson born?", ["1960", "1980", "1970", "1955"], "1955", 1),
		// https://en.wikipedia.org/wiki/Shah_Rukh_Khan
		q("When was Shah Rukh Khan born?", ["15 August 1965", "2 November 1965", "1 October 1964", "26 January 1966"], "2 November 1965", 2),
		// https://en.wikipedia.org/wiki/Shah_Rukh_Khan
		q("What was Shah Rukh Khan's Hindi film debut in 1992?", ["Baazigar", "Karan Arjun", "Dilwale", "Deewana"], "Deewana", 2),
		// https://en.wikipedia.org/wiki/Shah_Rukh_Khan
		q("Which Indian civilian honour was awarded to Shah Rukh Khan by the Government of India?", ["Bharat Ratna", "Padma Shri", "Arjuna Award", "Padma Bhushan"], "Padma Shri", 2),
		// https://en.wikipedia.org/wiki/Shah_Rukh_Khan
		q("Which Indian Premier League team does Shah Rukh Khan co‑own?", ["Royal Challengers Bangalore", "Kolkata Knight Riders", "Mumbai Indians", "Chennai Super Kings"], "Kolkata Knight Riders", 2),
		// https://en.wikipedia.org/wiki/Jacques_Cousteau
		q("When was Jacques Cousteau born?", ["11 June 1910", "12 July 1912", "15 August 1911", "10 May 1909"], "11 June 1910", 2),
		// https://en.wikipedia.org/wiki/Jacques_Cousteau
		q("What underwater breathing apparatus did Jacques Cousteau co‑invent?", ["Bathysphere", "Aqua-Lung", "Rebreather", "Diving bell"], "Aqua-Lung", 1),
		// https://en.wikipedia.org/wiki/Jacques_Cousteau
		q("What is the title of Jacques Cousteau's first book?", ["Marine Mysteries", "Underwater Adventures", "The Ocean Depths", "The Silent World"], "The Silent World", 2),
		// https://en.wikipedia.org/wiki/Jacques_Cousteau
		q("In which year did Jacques Cousteau's film win the Palme d'Or?", ["1954", "1956", "1960", "1958"], "1956", 2),
		// https://en.wikipedia.org/wiki/Gordon_Ramsay
		q("When was Gordon Ramsay born?", ["1 January 1970", "7 November 1965", "8 November 1966", "9 December 1967"], "8 November 1966", 2),
		// https://en.wikipedia.org/wiki/Gordon_Ramsay
		q("In what year was Gordon Ramsay Restaurants founded?", ["1997", "2001", "1995", "1999"], "1997", 2),
		// https://en.wikipedia.org/wiki/Gordon_Ramsay
		q("Which TV series earned Ramsay a BAFTA in 2005 and 2008?", ["The F Word", "MasterChef", "Kitchen Nightmares", "Hell's Kitchen"], "Kitchen Nightmares", 2),
		// https://en.wikipedia.org/wiki/Dwayne_Johnson
		q("In which year was Dwayne Johnson born?", ["1974", "1972", "1969", "1970"], "1972", 1),
		// https://en.wikipedia.org/wiki/Dwayne_Johnson
		q("Which university football team did Dwayne Johnson play for?", ["Ohio State University", "University of Miami", "University of Florida", "University of Texas"], "University of Miami", 2),
		// https://en.wikipedia.org/wiki/Dwayne_Johnson
		q("What was Dwayne Johnson's first leading film role?", ["The Scorpion King", "The Game Plan", "The Mummy Returns", "Jumanji: Welcome to the Jungle"], "The Scorpion King", 2),
		// https://en.wikipedia.org/wiki/Grace_Kelly
		q("In what year did Grace Kelly marry Prince Rainier III?", ["1965", "1956", "1960", "1950"], "1956", 1),
		// https://en.wikipedia.org/wiki/Grace_Kelly
		q("What was the title of Grace Kelly's film debut?", ["To Catch a Thief", "Fourteen Hours", "High Noon", "Dial M for Murder"], "Fourteen Hours", 2),
		// https://en.wikipedia.org/wiki/Oprah_Winfrey
		q("In which city was The Oprah Winfrey Show broadcast from?", ["New York", "Nashville", "Chicago", "Los Angeles"], "Chicago", 1),
		// https://en.wikipedia.org/wiki/Oprah_Winfrey
		q("What is Oprah Winfrey's birth name?", ["Orpha Gail Jones", "Orpah Gail Winfrey", "Oprah Gail Davis", "Oprah Gail Smith"], "Orpah Gail Winfrey", 1),
		// https://en.wikipedia.org/wiki/Oprah_Winfrey
		q("Which award did Oprah Winfrey receive from President Obama in 2013?", ["National Medal of Arts", "Congressional Gold Medal", "Presidential Medal of Freedom", "Kennedy Center Honors"], "Presidential Medal of Freedom", 2),
		// https://en.wikipedia.org/wiki/Oprah_Winfrey
		q("How many years did The Oprah Winfrey Show run in national syndication?", ["25 years", "30 years", "15 years", "20 years"], "25 years", 2),
		// https://en.wikipedia.org/wiki/Harry_Houdini
		q("In which country was Harry Houdini born?", ["Austria", "Czech Republic", "Hungary", "Poland"], "Hungary", 1),
		// https://en.wikipedia.org/wiki/Harry_Houdini
		q("Which newspaper commissioned special handcuffs for Houdini in 1904?", ["Evening Standard", "Daily Mail", "Daily Mirror", "The Times"], "Daily Mirror", 2),
		// https://en.wikipedia.org/wiki/Harry_Houdini
		q("What organization did Houdini serve as president of?", ["Society of American Magicians", "National Society of Magicians", "Society of British Magicians", "American Society of Illusionists"], "Society of American Magicians", 2),
		// https://en.wikipedia.org/wiki/Bob_Ross
		q("What military rank did Bob Ross achieve?", ["Captain", "Staff sergeant", "Lieutenant colonel", "Master sergeant"], "Master sergeant", 2),
		// https://en.wikipedia.org/wiki/Bob_Ross
		q("Who discovered Bob Ross and helped start his company?", ["Bill Alexander", "Annette Kowalski", "Jimmie Cox", "PBS Executive"], "Annette Kowalski", 2),
		// https://en.wikipedia.org/wiki/Bob_Ross
		q("Which painting technique did Bob Ross teach on his show?", ["Impasto", "Encaustic", "Dry brush", "Wet-on-wet"], "Wet-on-wet", 2),
		// https://en.wikipedia.org/wiki/Jim_Henson
		q("When was Jim Henson born?", ["December 19, 1938", "November 3, 1937", "October 12, 1935", "September 24, 1936"], "September 24, 1936", 2),
		// https://en.wikipedia.org/wiki/Jim_Henson
		q("Where was Jim Henson born?", ["New York City", "University Park, Maryland", "Greenville, Mississippi", "Leland, Mississippi"], "Greenville, Mississippi", 1),
		// https://en.wikipedia.org/wiki/Jim_Henson
		q("Which television series did Jim Henson create that aired from 1983 to 1987?", ["Fraggle Rock", "Sesame Street", "The Muppet Show", "The Dark Crystal"], "Fraggle Rock", 2),
		// https://en.wikipedia.org/wiki/Jim_Henson
		q("Which fantasy film did Jim Henson direct in 1982?", ["Labyrinth", "The Muppet Movie", "The Dark Crystal", "The Great Muppet Caper"], "The Dark Crystal", 2),
		// https://en.wikipedia.org/wiki/Steve_Irwin
		q("Who co-hosted The Crocodile Hunter with Steve Irwin?", ["Robert Irwin", "Bindi Irwin", "Terri Irwin", "Bob Irwin"], "Terri Irwin", 2),
		// https://en.wikipedia.org/wiki/Steve_Irwin
		q("Which zoo did Steve Irwin co-own and operate with his wife?", ["Australia Zoo", "Melbourne Zoo", "Taronga Zoo", "Perth Zoo"], "Australia Zoo", 2),
		// https://en.wikipedia.org/wiki/Steve_Irwin
		q("What caused Steve Irwin's death in 2006?", ["shark attack", "heart attack", "crocodile bite", "stingray injury"], "stingray injury", 2),
		// https://en.wikipedia.org/wiki/Lucille_Ball
		q("What year was Lucille Ball born?", ["1909", "1911", "1913", "1915"], "1911", 1),
		// https://en.wikipedia.org/wiki/Lucille_Ball
		q("What was Lucille Ball's stage name when she performed on Broadway?", ["Diane Belmont", "Diane Vance", "Diane Arnaz", "Diane Morton"], "Diane Belmont", 2),
		// https://en.wikipedia.org/wiki/Lucille_Ball
		q("Which television studio did Lucille Ball become the first woman to run in 1962?", ["Warner Bros.", "RKO Radio Pictures", "Desilu Productions", "Paramount Pictures"], "Desilu Productions", 2),
		// https://en.wikipedia.org/wiki/Jane_Goodall
		q("In what year was Jane Goodall born?", ["1934", "1936", "1932", "1938"], "1934", 1),
		// https://en.wikipedia.org/wiki/Jane_Goodall
		q("Which university awarded Jane Goodall her PhD in ethology?", ["University of Cambridge", "University of Oxford", "Yale University", "Harvard University"], "University of Cambridge", 2),
		// https://en.wikipedia.org/wiki/Jane_Goodall
		q("What was the title of Jane Goodall's first book-length study?", ["In the Shadow of Man", "Through a Window", "The Chimpanzees of Gombe", "Reason for Hope"], "In the Shadow of Man", 2),
		// https://en.wikipedia.org/wiki/Jane_Goodall
		q("In which year was Jane Goodall appointed a United Nations Messenger of Peace?", ["2004", "2000", "2002", "2006"], "2002", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Reggae
		q("Where did reggae originate?", ["Jamaica", "Barbados", "Cuba", "Trinidad"], "Jamaica", 1),
		// https://en.wikipedia.org/wiki/Eurovision_Song_Contest
		q("In what year was the first Eurovision Song Contest held?", ["1956", "1950", "1960", "1970"], "1956", 1),
		// https://en.wikipedia.org/wiki/Eurovision_Song_Contest
		q("Which Italian festival inspired the Eurovision Song Contest?", ["Sanremo Music Festival", "Umbria Jazz", "Venice Biennale", "Spoleto Festival"], "Sanremo Music Festival", 2),
		// https://en.wikipedia.org/wiki/Reggae
		q("In which period did reggae emerge in Jamaica?", ["Late 1990s", "Mid 1980s", "Early 1970s", "Late 1960s"], "Late 1960s", 1),
		// https://en.wikipedia.org/wiki/Fender_Telecaster
		q("In what year was the Telecaster first introduced as the Broadcaster?", ["1952", "1950", "1955", "1948"], "1950", 1),
		// https://en.wikipedia.org/wiki/Fender_Telecaster
		q("Which rival company's drum kit caused the Telecaster's name change?", ["Gibson", "Rickenbacker", "Gretsch", "Epiphone"], "Gretsch", 2),
		// https://en.wikipedia.org/wiki/Fender_Telecaster
		q("What unofficial name was given to the early nameless Telecasters?", ["Zerocasters", "Blankcasters", "Ghostcasters", "Nocasters"], "Nocasters", 2),
		// https://en.wikipedia.org/wiki/Fender_Telecaster
		q("Which model followed the Telecaster with three pickups in 1954?", ["Jaguar", "Stratocaster", "Telecaster Deluxe", "Esquire"], "Stratocaster", 2),
		// https://en.wikipedia.org/wiki/Theremin
		q("Who invented the theremin?", ["Robert Moog", "Leon Theremin", "Thomas Edison", "Maurice Martenot"], "Leon Theremin", 1),
		// https://en.wikipedia.org/wiki/Theremin
		q("In what year was the theremin patented?", ["1928", "1919", "1935", "1942"], "1928", 1),
		// https://en.wikipedia.org/wiki/Bagpipes
		q("What type of instrument are bagpipes classified as?", ["percussion", "brass", "string", "woodwind"], "woodwind", 1),
		// https://en.wikipedia.org/wiki/Bagpipes
		q("Which Scottish bagpipe is the most well known?", ["Uilleann pipes", "Great Highland bagpipe", "Scottish smallpipes", "Northumbrian smallpipes"], "Great Highland bagpipe", 1),
		// https://en.wikipedia.org/wiki/Harmonica
		q("What is another common name for the harmonica?", ["French harp", "German flute", "Italian pipe", "Spanish reed"], "French harp", 1),
		// https://en.wikipedia.org/wiki/Harmonica
		q("Which musical genre is the harmonica notably used in?", ["Opera", "Reggae", "Blues", "Disco"], "Blues", 1),
		// https://en.wikipedia.org/wiki/Harmonica
		q("What is the most common type of harmonica called?", ["Blues harp", "Jazz harp", "Rock harp", "Folk harp"], "Blues harp", 2),
		// https://en.wikipedia.org/wiki/Harmonica
		q("How many reeds does the most common harmonica have?", ["Twenty", "Twenty-five", "Fifteen", "Ten"], "Twenty", 2),
		// https://en.wikipedia.org/wiki/Harmonica
		q("What material is a harmonica reed typically made of?", ["Brass", "Wood", "Plastic", "Rubber"], "Brass", 2),
		// https://en.wikipedia.org/wiki/Glastonbury_Festival
		q("In which English county is the Glastonbury Festival held?", ["Dorset", "Somerset", "Devon", "Wiltshire"], "Somerset", 1),
		// https://en.wikipedia.org/wiki/Glastonbury_Festival
		q("Who hosted the first Glastonbury Festival?", ["David Bowie", "Roger Daltrey", "Pete Townshend", "Michael Eavis"], "Michael Eavis", 1),
		// https://en.wikipedia.org/wiki/Glastonbury_Festival
		q("What was the original name of the first Glastonbury Festival?", ["Bath Festival", "Pilton Festival", "Wessex Gathering", "Somerset Fair"], "Pilton Festival", 2),
		// https://en.wikipedia.org/wiki/Glastonbury_Festival
		q("Which band headlined the 1994 Glastonbury Festival?", ["The Levellers", "Oasis", "The Smiths", "Radiohead"], "The Levellers", 2),
		// https://en.wikipedia.org/wiki/Bossa_nova
		q("Bossa nova is described as a relaxed style of which genre?", ["samba", "blues", "jazz", "rock"], "samba", 1),
		// https://en.wikipedia.org/wiki/Bossa_nova
		q("Which musician is credited with extracting the bossa beat from traditional samba?", ["Roberto Menescal", "Gilberto Mendes", "Baden Powell", "João Gilberto"], "João Gilberto", 2),
		// https://en.wikipedia.org/wiki/Grand_Ole_Opry
		q("In what year did the Grand Ole Opry move to the Ryman Auditorium?", ["1939", "1945", "1943", "1941"], "1943", 2),
		// https://en.wikipedia.org/wiki/Grand_Ole_Opry
		q("Since what year has the Grand Ole Opry been broadcast from the Grand Ole Opry House?", ["1974", "1970", "1978", "1980"], "1974", 2),
		// https://en.wikipedia.org/wiki/Gibson_Les_Paul
		q("In what year was the Gibson Les Paul first sold?", ["1954", "1956", "1952", "1950"], "1952", 1),
		// https://en.wikipedia.org/wiki/Gibson_Les_Paul
		q("In which year were humbucking pickups added to the Gibson Les Paul?", ["1955", "1957", "1958", "1960"], "1957", 2),
		// https://en.wikipedia.org/wiki/Gibson_Les_Paul
		q("What year was the Gibson Les Paul redesigned into the Gibson SG?", ["1961", "1963", "1959", "1965"], "1961", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/The_Jungle_Book
		q("What is the name of the boy raised by wolves in The Jungle Book?", ["Rikki-Tikki-Tavi", "The White Seal", "Shere Khan", "Mowgli"], "Mowgli", 2),
		// https://en.wikipedia.org/wiki/The_Jungle_Book
		q("In what year was Rudyard Kipling's The Jungle Book published?", ["1914", "1894", "1904", "1884"], "1894", 2),
		// https://en.wikipedia.org/wiki/Black_Beauty
		q("From which animal's point of view is the novel Black Beauty told?", ["Cat", "Human", "Dog", "Horse"], "Horse", 2),
		// https://en.wikipedia.org/wiki/Black_Beauty
		q("In what year was the novel Black Beauty published?", ["1877", "1880", "1870", "1890"], "1877", 1),
		// https://en.wikipedia.org/wiki/The_Adventures_of_Pinocchio
		q("In what month and year was Pinocchio first issued as a book?", ["March 1883", "February 1883", "December 1882", "January 1883"], "February 1883", 2),
		// https://en.wikipedia.org/wiki/The_Adventures_of_Pinocchio
		q("What was the original serial title of Pinocchio?", ["The Chronicle of a Marionette", "The Tale of a Woodman", "The Story of a Puppet", "The Adventures of a Toy"], "The Story of a Puppet", 2),
		// https://en.wikipedia.org/wiki/The_Adventures_of_Pinocchio
		q("Who illustrated the first book edition of Pinocchio?", ["Luigi Bazzani", "Giovanni Battista", "Antonio Canova", "Enrico Mazzanti"], "Enrico Mazzanti", 2),
		// https://en.wikipedia.org/wiki/The_Adventures_of_Pinocchio
		q("Which philosopher considered Pinocchio one of the greatest works of Italian literature?", ["Benedetto Croce", "Antonio Gramsci", "Umberto Eco", "Gianni Vattimo"], "Benedetto Croce", 2),
		// https://en.wikipedia.org/wiki/Heidi
		q("Between which years was Heidi published?", ["1882 and 1883", "1890 and 1891", "1880 and 1881", "1875 and 1876"], "1880 and 1881", 1),
		// https://en.wikipedia.org/wiki/Little_Women
		q("In what year was Little Women originally published?", ["1875", "1890", "1868", "1850"], "1868", 1),
		// https://en.wikipedia.org/wiki/Little_Women
		q("What is the title of the second volume of Little Women?", ["Jo's Boys", "Little Men", "Good Wives", "The March Sisters"], "Good Wives", 2),
		// https://en.wikipedia.org/wiki/Little_Women
		q("Which sequel to Little Women was published in 1871?", ["Good Wives", "Little Men", "The March Sisters", "Jo's Boys"], "Little Men", 2),
		// https://en.wikipedia.org/wiki/The_Wind_in_the_Willows
		q("Which animal characters try to help Mr. Toad in the novel?", ["Mouse, Frog and Newt", "Rabbit, Squirrel and Fox", "Mole, Ratty and Badger", "Hedgehog, Otter and Vole"], "Mole, Ratty and Badger", 2),
		// https://en.wikipedia.org/wiki/The_Wind_in_the_Willows
		q("The Wind in the Willows grew from bedtime stories Kenneth Grahame told to whom?", ["Christopher Robin", "Alastair", "Wendy Darling", "Alice Liddell"], "Alastair", 2),
		// https://en.wikipedia.org/wiki/Peter_Pan
		q("What was the nationality of Peter Pan's creator?", ["Irish", "English", "Welsh", "Scottish"], "Scottish", 1),
		// https://en.wikipedia.org/wiki/Peter_Pan
		q("In what year was the play that first popularised Peter Pan produced?", ["1902", "1904", "1908", "1911"], "1904", 2),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Bay_of_Fundy
		q("What causes the Bay of Fundy's extreme tidal range?", ["Wind patterns", "Earthquakes", "Tidal resonance", "Volcanic activity"], "Tidal resonance", 2),
		// https://en.wikipedia.org/wiki/Bay_of_Fundy
		q("The Bay of Fundy is an arm of which gulf?", ["Gulf of California", "Gulf of Maine", "Gulf of Alaska", "Gulf of Mexico"], "Gulf of Maine", 2),
		// https://en.wikipedia.org/wiki/Uluru
		q("What is the alternative name for Uluru?", ["The Pinnacles", "Kata Tjuta", "Ayers Rock", "Mount Kosciuszko"], "Ayers Rock", 1),
		// https://en.wikipedia.org/wiki/Uluru
		q("What type of rock composes Uluru?", ["granite", "basalt", "limestone", "sandstone"], "sandstone", 2),
		// https://en.wikipedia.org/wiki/Mount_Fuji
		q("What type of volcano is Mount Fuji?", ["Shield volcano", "Stratovolcano", "Caldera", "Lava dome"], "Stratovolcano", 1),
		// https://en.wikipedia.org/wiki/Mount_Fuji
		q("In what year was Mount Fuji added to the World Heritage List?", ["2015", "2013", "2011", "2017"], "2013", 2),
		// https://en.wikipedia.org/wiki/Mount_Fuji
		q("Which Shinto shrine is located within the Mount Fuji locality?", ["Fushimi Inari Taisha", "Ise Grand Shrine", "Fujisan Hongū Sengen Taisha", "Meiji Shrine"], "Fujisan Hongū Sengen Taisha", 2),
		// https://en.wikipedia.org/wiki/Cliffs_of_Moher
		q("In which country are the Cliffs of Moher located?", ["France", "Ireland", "Wales", "Scotland"], "Ireland", 1),
		// https://en.wikipedia.org/wiki/Cliffs_of_Moher
		q("Who built O'Brien's Tower near the Cliffs of Moher?", ["Sir John O'Brien", "Sir William O'Brien", "Sir Thomas O'Brien", "Sir Cornelius O'Brien"], "Sir Cornelius O'Brien", 2),
		// https://en.wikipedia.org/wiki/Galápagos_Islands
		q("Who accidentally discovered the Galápagos Islands in 1535?", ["Francis Drake", "Bishop Tomás de Berlanga", "Christopher Columbus", "Ferdinand Magellan"], "Bishop Tomás de Berlanga", 2),
		// https://en.wikipedia.org/wiki/Galápagos_Islands
		q("Which naturalist studied the Galápagos' endemic species in the 1830s?", ["Thomas Huxley", "Alfred Russel Wallace", "Charles Darwin", "Jean-Baptiste Lamarck"], "Charles Darwin", 2),
		// https://en.wikipedia.org/wiki/Lake_Titicaca
		q("What is Lake Titicaca often called?", ["most saline lake", "largest freshwater lake", "highest navigable lake", "deepest lake in South America"], "highest navigable lake", 1),
	],
};
