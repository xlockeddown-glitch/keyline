import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Nov 9, 2026 bulk add, sub-batch 1 of 4 (0.1.138): evergreen cards for thin topics (books, games, geography).
 * No math (over mathCap). No local/city cards (local is the largest topic at 33.6%).
 * Fact-level dup-checked vs whole deck (scripts/trivia-dupcheck.mjs) incl. plus_20261106 and current_20261106.
 * Sources: Wikipedia article above each card; answer string confirmed in the fetched article text (checked Nov 9 2026).
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography";

export const PLUS_20261109A: Partial<Record<PlusCat, TriviaQ[]>> = {
	games: [
		// https://en.wikipedia.org/wiki/Samus_Aran
		q("Which bounty hunter stars in the 'Metroid' series?", ["Fox McCloud", "Samus Aran", "Captain Falcon", "Kirby"], "Samus Aran", 1),
		// https://en.wikipedia.org/wiki/Ridley_(Metroid)
		q("What is the name of Samus Aran's winged space pirate nemesis?", ["Ridley", "Ganon", "Mother Brain", "Kraid"], "Ridley", 2),
		// https://en.wikipedia.org/wiki/King_Dedede
		q("Who is Kirby's penguin rival who calls himself king?", ["Bowser", "Meta Knight", "Waddle Dee", "King Dedede"], "King Dedede", 2),
		// https://en.wikipedia.org/wiki/Doctor_Eggman
		q("What is the name of the mad scientist villain in 'Sonic the Hedgehog'?", ["Dr. Wily", "Dr. Light", "Dr. Neo Cortex", "Dr. Eggman"], "Dr. Eggman", 1),
		// https://en.wikipedia.org/wiki/Mega_Man_(character)
		q("Who is Mega Man's creator in the games, a kindly scientist?", ["Dr. Light", "Dr. Eggman", "Dr. Cossack", "Dr. Wily"], "Dr. Light", 2),
		// https://en.wikipedia.org/wiki/Crash_Bandicoot_(character)
		q("Which bandicoot is the hero of a 1996 PlayStation platformer?", ["Jak", "Ratchet", "Spyro", "Crash"], "Crash", 2),
		// https://en.wikipedia.org/wiki/Spyro_(character)
		q("What color is the dragon Spyro?", ["purple", "blue", "green", "red"], "purple", 1),
		// https://en.wikipedia.org/wiki/Atari,_Inc.
		q("Which game company was co-founded by Nolan Bushnell and Ted Dabney?", ["Namco", "Atari", "Sega", "Activision"], "Atari", 2),
		// https://en.wikipedia.org/wiki/Shigeru_Miyamoto
		q("Which designer is credited with creating Mario and Donkey Kong?", ["Satoru Iwata", "Hideo Kojima", "Shigeru Miyamoto", "Gunpei Yokoi"], "Shigeru Miyamoto", 1),
		// https://en.wikipedia.org/wiki/Master_Chief_(Halo)
		q("What is the name of the hero of the 'Halo' series?", ["Master Chief", "Commander Shepard", "Marcus Fenix", "Gordon Freeman"], "Master Chief", 1),
		// https://en.wikipedia.org/wiki/Kratos_(God_of_War)
		q("What is the name of the hero in the 'God of War' series?", ["Kratos", "Atreus", "Baldur", "Ares"], "Kratos", 1),
		// https://en.wikipedia.org/wiki/Atreus_(God_of_War)
		q("What is the name of Kratos's son in 2018's 'God of War'?", ["Magni", "Modi", "Atreus", "Baldur"], "Atreus", 2),
		// https://en.wikipedia.org/wiki/Ellie_(The_Last_of_Us)
		q("In 'The Last of Us,' what is the name of the teenage girl Joel protects?", ["Dina", "Tess", "Abby", "Ellie"], "Ellie", 1),
		// https://en.wikipedia.org/wiki/Red_Dead_Redemption_2
		q("In 'Red Dead Redemption 2,' what is the name of the main character?", ["Arthur Morgan", "John Marston", "Dutch van der Linde", "Micah Bell"], "Arthur Morgan", 2),
		// https://en.wikipedia.org/wiki/Grand_Theft_Auto_V
		q("In which fictional state is 'Grand Theft Auto V' set?", ["Sunshine", "San Andreas", "Liberty State", "Vice City"], "San Andreas", 2),
		// https://en.wikipedia.org/wiki/Among_Us
		q("In 'Among Us,' what are the saboteur players called?", ["Crewmates", "Traitors", "Impostors", "Mafia"], "Impostors", 1),
		// https://en.wikipedia.org/wiki/Tom_Nook
		q("In 'Animal Crossing,' what kind of animal is Tom Nook?", ["tanuki", "badger", "beaver", "fox"], "tanuki", 2),
		// https://en.wikipedia.org/wiki/Isabelle_(Animal_Crossing)
		q("In 'Animal Crossing: New Horizons,' who is the dog assistant at Resident Services?", ["Isabelle", "Digby", "Blathers", "K.K. Slider"], "Isabelle", 2),
		// https://en.wikipedia.org/wiki/Giovanni_(Pokémon)
		q("Who is the leader of Team Rocket in the original Pokémon games?", ["Cyrus", "Giovanni", "Jessie", "Archie"], "Giovanni", 2),
		// https://en.wikipedia.org/wiki/Ryu_(Street_Fighter)
		q("In 'Street Fighter,' which character is famous for the 'Hadouken' with Ken?", ["Blanka", "Ryu", "Guile", "Chun-Li"], "Ryu", 2),
		// https://en.wikipedia.org/wiki/Scorpion_(Mortal_Kombat)
		q("In 'Mortal Kombat,' which ninja says 'Get over here!'?", ["Smoke", "Reptile", "Scorpion", "Sub-Zero"], "Scorpion", 2),
		// https://en.wikipedia.org/wiki/Sephiroth_(Final_Fantasy)
		q("Who is the silver-haired villain of 'Final Fantasy VII'?", ["Sephiroth", "Seifer", "Kefka", "Vincent"], "Sephiroth", 2),
		// https://en.wikipedia.org/wiki/Chocobo
		q("What yellow bird is the riding mount of the 'Final Fantasy' series?", ["Tonberry", "Cactuar", "Chocobo", "Moogle"], "Chocobo", 2),
		// https://en.wikipedia.org/wiki/Tracer_(Overwatch)
		q("In 'Overwatch,' which character is the time-jumping British pilot?", ["Mercy", "Widowmaker", "Pharah", "Tracer"], "Tracer", 2),
		// https://en.wikipedia.org/wiki/Sora_(Kingdom_Hearts)
		q("In 'Kingdom Hearts,' who is the keyblade-wielding hero?", ["Ventus", "Roxas", "Sora", "Riku"], "Sora", 2),
		// https://en.wikipedia.org/wiki/King_K._Rool
		q("Who is the villain of 'Donkey Kong Country,' a crocodile king?", ["King Dedede", "King Boo", "King K. Rool", "Kaptain Kroc"], "King K. Rool", 2),
		// https://en.wikipedia.org/wiki/Waluigi
		q("What is the name of Luigi's evil counterpart in 'Mario' games?", ["Waluigi", "Bowser Jr.", "Dry Bones", "Wario"], "Waluigi", 1),
		// https://en.wikipedia.org/wiki/Luigi's_Mansion
		q("What is the name of the ghost-hunting game starring Luigi?", ["Boo Mansion", "Ghost Hunt Luigi", "Luigi's Mansion", "Luigi's Castle"], "Luigi's Mansion", 1),
		// https://en.wikipedia.org/wiki/Game_Boy
		q("Which Nintendo handheld was released in 1989 with 'Tetris' bundled?", ["Nintendo DS", "Game Boy", "Virtual Boy", "Game Gear"], "Game Boy", 1),
		// https://en.wikipedia.org/wiki/Scrabble_letter_distributions
		q("What is the highest-scoring tile value in English Scrabble?", ["10", "15", "8", "12"], "10", 2),
		// https://en.wikipedia.org/wiki/Scrabble
		q("In Scrabble, how many tiles does each player hold on their rack?", ["seven", "nine", "six", "eight"], "seven", 2),
		// https://en.wikipedia.org/wiki/Cluedo
		q("In 'Clue,' what is the name of the murder victim in the US version?", ["Mr. Green", "Colonel Mustard", "Mr. Boddy", "Dr. Black"], "Mr. Boddy", 2),
		// https://en.wikipedia.org/wiki/Ticket_to_Ride_(board_game)
		q("What is the name of the board game where you build railway routes across a map?", ["Pandemic", "Carcassonne", "Catan", "Ticket to Ride"], "Ticket to Ride", 2),
		// https://en.wikipedia.org/wiki/Sorry!_(game)
		q("In the board game 'Sorry!,' how many pawns does each player have?", ["five", "three", "four", "six"], "four", 2),
		// https://en.wikipedia.org/wiki/Battleship_(game)
		q("In 'Battleship,' what is the largest ship in the classic game?", ["cruiser", "battleship", "carrier", "destroyer"], "carrier", 1),
		// https://en.wikipedia.org/wiki/Connect_Four
		q("In 'Connect Four,' how many columns does the grid have?", ["five", "eight", "six", "seven"], "seven", 2),
		// https://en.wikipedia.org/wiki/Guess_Who?
		q("Which game has players trying to guess a mystery person by asking yes-or-no questions?", ["Guess Who?", "Taboo", "Clue", "Pictionary"], "Guess Who?", 1),
		// https://en.wikipedia.org/wiki/Taboo_(game)
		q("Which word game has players avoid saying forbidden words on a card?", ["Pictionary", "Taboo", "Scattergories", "Boggle"], "Taboo", 2),
		// https://en.wikipedia.org/wiki/Boggle
		q("Which game uses a 4x4 grid of letter dice shaken in a covered tray?", ["Upwords", "Boggle", "Scrabble", "Bananagrams"], "Boggle", 2),
		// https://en.wikipedia.org/wiki/Shogi
		q("What is the Japanese form of chess called?", ["janggi", "makruk", "xiangqi", "shogi"], "shogi", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/Charlotte's_Web
		q("What kind of animal is Templeton in 'Charlotte's Web'?", ["mouse", "rat", "goose", "sheep"], "rat", 1),
		// https://en.wikipedia.org/wiki/Hercule_Poirot
		q("What nationality is Agatha Christie's detective Hercule Poirot?", ["Swiss", "Dutch", "Belgian", "French"], "Belgian", 1),
		// https://en.wikipedia.org/wiki/Miss_Marple
		q("In which village does Agatha Christie's Miss Marple live?", ["St. Mary Mead", "Kings Abbot", "Midsomer", "Chipping Cleghorn"], "St. Mary Mead", 2),
		// https://en.wikipedia.org/wiki/Where_the_Wild_Things_Are
		q("What is the name of the boy who sails to where the wild things are?", ["Jack", "Leo", "Sam", "Max"], "Max", 2),
		// https://en.wikipedia.org/wiki/Frog_and_Toad
		q("Who wrote the 'Frog and Toad' books?", ["Arnold Lobel", "James Marshall", "Eric Carle", "Mo Willems"], "Arnold Lobel", 2),
		// https://en.wikipedia.org/wiki/Dr._Seuss
		q("What was Dr. Seuss's real first and last name?", ["Theodore Seuss", "Thomas Geller", "Edward Geisel", "Theodor Geisel"], "Theodor Geisel", 2),
		// https://en.wikipedia.org/wiki/Matilda_(novel)
		q("Who wrote 'Matilda,' about a girl with telekinetic powers?", ["Roald Dahl", "E. L. Konigsburg", "Beverly Cleary", "Judy Blume"], "Roald Dahl", 1),
		// https://en.wikipedia.org/wiki/James_and_the_Giant_Peach
		q("Who wrote 'James and the Giant Peach'?", ["Roald Dahl", "E. B. White", "Kenneth Grahame", "Lewis Carroll"], "Roald Dahl", 1),
		// https://en.wikipedia.org/wiki/Paddington_Bear
		q("Who created Paddington Bear?", ["Michael Bond", "Roald Dahl", "Beatrix Potter", "A. A. Milne"], "Michael Bond", 2),
		// https://en.wikipedia.org/wiki/The_Tale_of_Peter_Rabbit
		q("In 'The Tale of Peter Rabbit,' whose garden does Peter raid?", ["Mr. Tod", "Mr. Jeremy", "Mr. Brown", "Mr. McGregor"], "Mr. McGregor", 1),
		// https://en.wikipedia.org/wiki/Percy_Jackson
		q("Who is Percy Jackson's father in Rick Riordan's series?", ["Poseidon", "Zeus", "Hades", "Apollo"], "Poseidon", 1),
		// https://en.wikipedia.org/wiki/Eragon
		q("What is the name of Eragon's dragon?", ["Temeraire", "Saphira", "Glaurung", "Drogon"], "Saphira", 2),
		// https://en.wikipedia.org/wiki/Because_of_Winn-Dixie
		q("In 'Because of Winn-Dixie,' what is Winn-Dixie?", ["a dog", "a horse", "a cat", "a parrot"], "a dog", 2),
		// https://en.wikipedia.org/wiki/Where_the_Red_Fern_Grows
		q("Who wrote 'Where the Red Fern Grows'?", ["Fred Gipson", "Gary Paulsen", "Wilson Rawls", "Jack London"], "Wilson Rawls", 2),
		// https://en.wikipedia.org/wiki/Old_Yeller_(novel)
		q("Who wrote 'Old Yeller'?", ["Wilson Rawls", "Fred Gipson", "Marjorie Rawlings", "Jack London"], "Fred Gipson", 2),
		// https://en.wikipedia.org/wiki/The_Outsiders_(novel)
		q("Who wrote 'The Outsiders' while still a teenager?", ["Paul Zindel", "Robert Cormier", "S. E. Hinton", "Judy Blume"], "S. E. Hinton", 2),
		// https://en.wikipedia.org/wiki/The_Outsiders_(novel)
		q("In 'The Outsiders,' which gang does Ponyboy belong to?", ["Jets", "Socs", "Sharks", "Greasers"], "Greasers", 2),
		// https://en.wikipedia.org/wiki/From_the_Mixed-Up_Files_of_Mrs._Basil_E._Frankweiler
		q("Who wrote 'From the Mixed-Up Files of Mrs. Basil E. Frankweiler'?", ["Ellen Raskin", "Natalie Babbitt", "E. L. Konigsburg", "Lois Lowry"], "E. L. Konigsburg", 3),
		// https://en.wikipedia.org/wiki/From_the_Mixed-Up_Files_of_Mrs._Basil_E._Frankweiler
		q("In 'From the Mixed-Up Files of Mrs. Basil E. Frankweiler,' where do the runaways hide?", ["Metropolitan Museum of Art", "American Museum of Natural History", "Museum of Modern Art", "Smithsonian Castle"], "Metropolitan Museum of Art", 3),
		// https://en.wikipedia.org/wiki/Harriet_the_Spy
		q("Who wrote 'Harriet the Spy'?", ["Beverly Cleary", "Judy Blume", "Louise Fitzhugh", "E. L. Konigsburg"], "Louise Fitzhugh", 2),
		// https://en.wikipedia.org/wiki/Junie_B._Jones
		q("Who created the character Junie B. Jones?", ["Beverly Cleary", "Barbara Park", "Judy Blume", "Megan McDonald"], "Barbara Park", 2),
		// https://en.wikipedia.org/wiki/Are_You_There_God?_It's_Me,_Margaret.
		q("Who wrote 'Are You There God? It's Me, Margaret.'?", ["Judy Blume", "Beverly Cleary", "Lois Lowry", "Paula Danziger"], "Judy Blume", 2),
		// https://en.wikipedia.org/wiki/The_Phantom_Tollbooth
		q("In 'The Phantom Tollbooth,' what is the name of the watchdog?", ["Spot", "Milo", "Tick", "Tock"], "Tock", 2),
		// https://en.wikipedia.org/wiki/Stuart_Little
		q("Who wrote 'Stuart Little'?", ["Roald Dahl", "Beverly Cleary", "E. B. White", "George Selden"], "E. B. White", 2),
		// https://en.wikipedia.org/wiki/The_Cricket_in_Times_Square
		q("Who wrote 'The Cricket in Times Square'?", ["George Selden", "Beverly Cleary", "E. B. White", "Robert Lawson"], "George Selden", 2),
		// https://en.wikipedia.org/wiki/Mrs._Frisby_and_the_Rats_of_NIMH
		q("Who wrote 'Mrs. Frisby and the Rats of NIMH'?", ["E. B. White", "Robert C. O'Brien", "Brian Jacques", "Richard Adams"], "Robert C. O'Brien", 2),
		// https://en.wikipedia.org/wiki/Watership_Down
		q("What kind of animals are the heroes of 'Watership Down'?", ["badgers", "rabbits", "foxes", "mice"], "rabbits", 1),
		// https://en.wikipedia.org/wiki/Redwall
		q("Who wrote the 'Redwall' series?", ["Philip Pullman", "Richard Adams", "Terry Pratchett", "Brian Jacques"], "Brian Jacques", 2),
		// https://en.wikipedia.org/wiki/His_Dark_Materials
		q("In 'His Dark Materials,' what are the animal companions of humans called?", ["totems", "familiars", "dæmons", "patronuses"], "dæmons", 3),
		// https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey_(novel)
		q("Who wrote '2001: A Space Odyssey' as a novel alongside Kubrick's film?", ["Ray Bradbury", "Philip K. Dick", "Isaac Asimov", "Arthur C. Clarke"], "Arthur C. Clarke", 2),
		// https://en.wikipedia.org/wiki/Do_Androids_Dream_of_Electric_Sheep?
		q("Who wrote 'Do Androids Dream of Electric Sheep?'?", ["Isaac Asimov", "William Gibson", "Philip K. Dick", "Ray Bradbury"], "Philip K. Dick", 2),
		// https://en.wikipedia.org/wiki/Neuromancer
		q("Which novel by William Gibson popularized the word 'cyberspace'?", ["Count Zero", "Neuromancer", "Snow Crash", "Idoru"], "Neuromancer", 3),
		// https://en.wikipedia.org/wiki/Snow_Crash
		q("Who wrote 'Snow Crash'?", ["William Gibson", "Neal Stephenson", "Cory Doctorow", "Bruce Sterling"], "Neal Stephenson", 2),
		// https://en.wikipedia.org/wiki/I_Know_Why_the_Caged_Bird_Sings
		q("Who wrote 'I Know Why the Caged Bird Sings'?", ["Toni Morrison", "Alice Walker", "Zora Neale Hurston", "Maya Angelou"], "Maya Angelou", 2),
		// https://en.wikipedia.org/wiki/The_House_on_Mango_Street
		q("Who wrote 'The House on Mango Street'?", ["Julia Alvarez", "Sandra Cisneros", "Ana Castillo", "Isabel Allende"], "Sandra Cisneros", 2),
		// https://en.wikipedia.org/wiki/One_Hundred_Years_of_Solitude
		q("In 'One Hundred Years of Solitude,' what is the fictional town called?", ["Santa Teresa", "Macondo", "Comala", "Aracataca"], "Macondo", 3),
		// https://en.wikipedia.org/wiki/The_House_of_the_Spirits
		q("Who wrote 'The House of the Spirits'?", ["Julia Alvarez", "Laura Esquivel", "Isabel Allende", "Gabriel García Márquez"], "Isabel Allende", 2),
		// https://en.wikipedia.org/wiki/Like_Water_for_Chocolate_(novel)
		q("Who wrote 'Like Water for Chocolate'?", ["Isabel Allende", "Julia Alvarez", "Elena Poniatowska", "Laura Esquivel"], "Laura Esquivel", 2),
		// https://en.wikipedia.org/wiki/The_Alchemist_(novel)
		q("Who wrote 'The Alchemist,' about a shepherd named Santiago?", ["Mario Vargas Llosa", "Jorge Amado", "Paulo Coelho", "Gabriel García Márquez"], "Paulo Coelho", 2),
		// https://en.wikipedia.org/wiki/Atonement_(novel)
		q("Who wrote 'Atonement'?", ["Julian Barnes", "Zadie Smith", "Kazuo Ishiguro", "Ian McEwan"], "Ian McEwan", 2),
		// https://en.wikipedia.org/wiki/Interpreter_of_Maladies
		q("Who wrote 'Interpreter of Maladies'?", ["Chitra Divakaruni", "Jhumpa Lahiri", "Arundhati Roy", "Kiran Desai"], "Jhumpa Lahiri", 2),
		// https://en.wikipedia.org/wiki/The_Goldfinch_(novel)
		q("Who wrote 'The Goldfinch'?", ["Ann Patchett", "Donna Tartt", "Jonathan Franzen", "Jennifer Egan"], "Donna Tartt", 2),
		// https://en.wikipedia.org/wiki/The_Corrections
		q("Who wrote 'The Corrections'?", ["Jonathan Franzen", "David Foster Wallace", "Jeffrey Eugenides", "Don DeLillo"], "Jonathan Franzen", 2),
		// https://en.wikipedia.org/wiki/Infinite_Jest
		q("Who wrote 'Infinite Jest'?", ["David Foster Wallace", "Thomas Pynchon", "Don DeLillo", "Jonathan Franzen"], "David Foster Wallace", 2),
		// https://en.wikipedia.org/wiki/Middlesex_(novel)
		q("Who wrote 'Middlesex,' a Pulitzer winner narrated by Cal Stephanides?", ["Michael Chabon", "Jonathan Franzen", "Richard Russo", "Jeffrey Eugenides"], "Jeffrey Eugenides", 2),
		// https://en.wikipedia.org/wiki/The_Amazing_Adventures_of_Kavalier_%26_Clay
		q("Who wrote 'The Amazing Adventures of Kavalier & Clay'?", ["Jonathan Lethem", "Jeffrey Eugenides", "Michael Chabon", "Richard Russo"], "Michael Chabon", 2),
		// https://en.wikipedia.org/wiki/The_Book_Thief
		q("Who wrote 'The Book Thief,' narrated by Death?", ["Kristin Hannah", "Markus Zusak", "Anthony Doerr", "John Boyne"], "Markus Zusak", 2),
		// https://en.wikipedia.org/wiki/The_Boy_in_the_Striped_Pyjamas
		q("Who wrote 'The Boy in the Striped Pajamas'?", ["Morris Gleitzman", "John Boyne", "Michael Morpurgo", "Markus Zusak"], "John Boyne", 2),
		// https://en.wikipedia.org/wiki/War_Horse_(novel)
		q("Who wrote 'War Horse,' the 1982 children's novel?", ["Dick King-Smith", "Michael Morpurgo", "Anna Sewell", "John Boyne"], "Michael Morpurgo", 2),
		// https://en.wikipedia.org/wiki/Black_Beauty
		q("Who wrote 'Black Beauty'?", ["Anna Sewell", "Louisa May Alcott", "Mary Shelley", "Frances Hodgson Burnett"], "Anna Sewell", 2),
		// https://en.wikipedia.org/wiki/Heidi
		q("Who wrote 'Heidi'?", ["Johanna Spyri", "Astrid Lindgren", "Frances Hodgson Burnett", "Selma Lagerlöf"], "Johanna Spyri", 2),
		// https://en.wikipedia.org/wiki/Pippi_Longstocking
		q("Who created Pippi Longstocking?", ["Astrid Lindgren", "Selma Lagerlöf", "Johanna Spyri", "Tove Jansson"], "Astrid Lindgren", 2),
		// https://en.wikipedia.org/wiki/Moomins
		q("Who created the Moomins?", ["Selma Lagerlöf", "Tove Jansson", "Hans Christian Andersen", "Astrid Lindgren"], "Tove Jansson", 2),
		// https://en.wikipedia.org/wiki/Fantastic_Mr_Fox
		q("In Roald Dahl's 'Fantastic Mr Fox,' how many farmers try to catch the fox?", ["four", "three", "two", "five"], "three", 2),
		// https://en.wikipedia.org/wiki/The_Twits
		q("Which Roald Dahl book features a married couple who play nasty tricks on each other?", ["The Twits", "Esio Trot", "George's Marvellous Medicine", "The Witches"], "The Twits", 2),
		// https://en.wikipedia.org/wiki/The_BFG
		q("What is the name of the orphan girl befriended by the BFG?", ["Lucy", "Sophie", "Matilda", "Violet"], "Sophie", 2),
		// https://en.wikipedia.org/wiki/Charlie_and_the_Chocolate_Factory
		q("In 'Charlie and the Chocolate Factory,' which child gets sucked up a chocolate pipe?", ["Veruca Salt", "Mike Teavee", "Violet Beauregarde", "Augustus Gloop"], "Augustus Gloop", 2),
		// https://en.wikipedia.org/wiki/Charlie_and_the_Chocolate_Factory
		q("In 'Charlie and the Chocolate Factory,' which child turns into a giant blueberry?", ["Veruca Salt", "Mike Teavee", "Augustus Gloop", "Violet Beauregarde"], "Violet Beauregarde", 1),
		// https://en.wikipedia.org/wiki/Sauron
		q("What is the name of the Dark Lord in 'The Lord of the Rings'?", ["Morgoth", "Saruman", "Smaug", "Sauron"], "Sauron", 1),
		// https://en.wikipedia.org/wiki/Legolas
		q("In 'The Lord of the Rings,' what is the name of the elf in the Fellowship?", ["Gimli", "Elrond", "Legolas", "Haldir"], "Legolas", 1),
		// https://en.wikipedia.org/wiki/The_Lion,_the_Witch_and_the_Wardrobe
		q("What is the name of the faun Lucy meets in Narnia?", ["Reepicheep", "Mr. Tumnus", "Puddleglum", "Mr. Beaver"], "Mr. Tumnus", 2),
		// https://en.wikipedia.org/wiki/Albus_Dumbledore
		q("Who is the headmaster of Hogwarts for most of the Harry Potter series?", ["Horace Slughorn", "Minerva McGonagall", "Albus Dumbledore", "Severus Snape"], "Albus Dumbledore", 1),
		// https://en.wikipedia.org/wiki/Harry_Potter_(character)
		q("Which Hogwarts house does Harry Potter belong to?", ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"], "Gryffindor", 1),
		// https://en.wikipedia.org/wiki/Professor_Moriarty
		q("Who is Sherlock Holmes's archenemy, called the 'Napoleon of crime'?", ["Professor Moriarty", "Colonel Moran", "Mycroft Holmes", "Irene Adler"], "Professor Moriarty", 2),
		// https://en.wikipedia.org/wiki/Mycroft_Holmes
		q("What is the name of Sherlock Holmes's older brother?", ["Lestrade", "Moriarty", "Mycroft", "Sherrinford"], "Mycroft", 2),
		// https://en.wikipedia.org/wiki/Abraham_Van_Helsing
		q("Who is the vampire hunter professor in Bram Stoker's 'Dracula'?", ["John Seward", "Abraham Van Helsing", "Jonathan Harker", "Quincey Morris"], "Abraham Van Helsing", 3),
		// https://en.wikipedia.org/wiki/The_Great_Gatsby
		q("In 'The Great Gatsby,' what color is the light at the end of Daisy's dock?", ["white", "red", "blue", "green"], "green", 1),
		// https://en.wikipedia.org/wiki/Adventures_of_Huckleberry_Finn
		q("What is the name of the escaped enslaved man who travels with Huckleberry Finn?", ["Sam", "Joe", "Jim", "Tom"], "Jim", 2),
		// https://en.wikipedia.org/wiki/Little_Women
		q("What are the names of the four March sisters in 'Little Women'?", ["Meg, Jo, Lily, Amy", "Meg, Jo, Beth, Amy", "Meg, Kate, Beth, Amy", "Ann, Jo, Beth, May"], "Meg, Jo, Beth, Amy", 1),
		// https://en.wikipedia.org/wiki/Rebecca_(novel)
		q("In 'Rebecca,' what is the name of the Cornish estate?", ["Netherfield", "Pemberley", "Manderley", "Thornfield"], "Manderley", 2),
		// https://en.wikipedia.org/wiki/Pride_and_Prejudice
		q("How many daughters do Mr. and Mrs. Bennet have in 'Pride and Prejudice'?", ["three", "four", "six", "five"], "five", 2),
		// https://en.wikipedia.org/wiki/A_Christmas_Carol
		q("In 'A Christmas Carol,' what is the name of Bob Cratchit's sickly son?", ["Tiny Tim", "Little Ned", "Peter", "Small Sam"], "Tiny Tim", 1),
		// https://en.wikipedia.org/wiki/Javert
		q("Which police inspector relentlessly pursues Jean Valjean in 'Les Misérables'?", ["Enjolras", "Marius", "Javert", "Thénardier"], "Javert", 3),
		// https://en.wikipedia.org/wiki/Rocinante
		q("What is the name of Don Quixote's horse?", ["Babieca", "Rocinante", "Marengo", "Bucephalus"], "Rocinante", 2),
		// https://en.wikipedia.org/wiki/Big_Brother_(Nineteen_Eighty-Four)
		q("In 'Nineteen Eighty-Four,' what is the name of the leader whose face is everywhere?", ["Napoleon", "Emmanuel Goldstein", "Big Brother", "O'Brien"], "Big Brother", 1),
		// https://en.wikipedia.org/wiki/Animal_Farm
		q("In 'Animal Farm,' which loyal workhorse is sent to the knacker?", ["Mollie", "Clover", "Benjamin", "Boxer"], "Boxer", 2),
		// https://en.wikipedia.org/wiki/Lord_of_the_Flies
		q("In 'Lord of the Flies,' what object is used to call meetings?", ["a bell", "a conch", "a whistle", "a drum"], "a conch", 1),
		// https://en.wikipedia.org/wiki/Lord_of_the_Flies
		q("Who leads the hunters in 'Lord of the Flies'?", ["Jack", "Simon", "Piggy", "Ralph"], "Jack", 2),
		// https://en.wikipedia.org/wiki/To_Kill_a_Mockingbird
		q("In 'To Kill a Mockingbird,' what is Scout's real first name?", ["Jean Louise", "Mary Ann", "Anna Lee", "Sarah Jane"], "Jean Louise", 2),
		// https://en.wikipedia.org/wiki/To_Kill_a_Mockingbird
		q("In 'To Kill a Mockingbird,' what is the name of the reclusive neighbor?", ["Tom Robinson", "Boo Radley", "Dill Harris", "Bob Ewell"], "Boo Radley", 1),
		// https://en.wikipedia.org/wiki/The_Grapes_of_Wrath
		q("In 'The Grapes of Wrath,' which family travels from Oklahoma to California?", ["the Trasks", "the Hamiltons", "the Joads", "the Wilsons"], "the Joads", 2),
		// https://en.wikipedia.org/wiki/East_of_Eden_(novel)
		q("In 'East of Eden,' in which California valley is the story set?", ["Central Valley", "Imperial Valley", "Napa Valley", "Salinas Valley"], "Salinas Valley", 2),
		// https://en.wikipedia.org/wiki/Gone_with_the_Wind_(novel)
		q("In 'Gone with the Wind,' what is the name of the O'Hara family plantation?", ["Tara", "Belle Reve", "Oakhurst", "Twelve Oaks"], "Tara", 2),
		// https://en.wikipedia.org/wiki/It_(novel)
		q("In Stephen King's 'It,' what form does the creature usually take?", ["a ghost", "a spider", "a dog", "a clown"], "a clown", 1),
		// https://en.wikipedia.org/wiki/Misery_(novel)
		q("In Stephen King's 'Misery,' what is the name of the obsessed fan nurse?", ["Margaret White", "Annie Wilkes", "Carrie White", "Wendy Torrance"], "Annie Wilkes", 2),
		// https://en.wikipedia.org/wiki/The_Shining_(novel)
		q("In Stephen King's 'The Shining,' what is the name of the hotel?", ["the Overlook", "the Bates", "the Stanley", "the Dolphin"], "the Overlook", 1),
		// https://en.wikipedia.org/wiki/Robert_Langdon
		q("In 'The Da Vinci Code,' what is the name of the symbologist hero?", ["Robert Langdon", "Sophie Neveu", "Jacques Saunière", "Leigh Teabing"], "Robert Langdon", 1),
		// https://en.wikipedia.org/wiki/Twilight_(Meyer_novel)
		q("Which 'Twilight' vampire does Bella Swan fall in love with?", ["Carlisle Cullen", "Jasper Hale", "Jacob Black", "Edward Cullen"], "Edward Cullen", 1),
		// https://en.wikipedia.org/wiki/Twilight_(Meyer_novel)
		q("In which Washington town is 'Twilight' set?", ["Olympia", "Port Angeles", "Forks", "Tacoma"], "Forks", 2),
		// https://en.wikipedia.org/wiki/The_Maze_Runner
		q("Who wrote 'The Maze Runner'?", ["Patrick Ness", "Rick Yancey", "James Dashner", "Neal Shusterman"], "James Dashner", 2),
		// https://en.wikipedia.org/wiki/The_Maze_Runner
		q("What is the name of the glade boy who wakes up in the lift in 'The Maze Runner'?", ["Minho", "Alby", "Thomas", "Newt"], "Thomas", 2),
		// https://en.wikipedia.org/wiki/The_Baby-Sitters_Club
		q("Who wrote 'The Baby-Sitters Club' series?", ["Ann M. Martin", "Judy Blume", "R. L. Stine", "Paula Danziger"], "Ann M. Martin", 2),
		// https://en.wikipedia.org/wiki/Magic_Tree_House
		q("Who created the 'Magic Tree House' series?", ["Mary Pope Osborne", "Megan McDonald", "Barbara Park", "Ann M. Martin"], "Mary Pope Osborne", 2),
		// https://en.wikipedia.org/wiki/Magic_Tree_House
		q("What are the names of the siblings in the 'Magic Tree House' books?", ["Dick and Jane", "Sam and Ellie", "Peter and Wendy", "Jack and Annie"], "Jack and Annie", 2),
		// https://en.wikipedia.org/wiki/Encyclopedia_Brown
		q("Who created the boy detective Encyclopedia Brown?", ["Ellen Raskin", "Carolyn Keene", "Franklin W. Dixon", "Donald J. Sobol"], "Donald J. Sobol", 2),
		// https://en.wikipedia.org/wiki/Hardy_Boys
		q("Which pen name appears as author on the Hardy Boys books?", ["Franklin W. Dixon", "Laura Lee Hope", "Carolyn Keene", "Victor Appleton"], "Franklin W. Dixon", 2),
		// https://en.wikipedia.org/wiki/Nancy_Drew
		q("Which pen name appears as author on the Nancy Drew books?", ["Laura Lee Hope", "Franklin W. Dixon", "Victor Appleton", "Carolyn Keene"], "Carolyn Keene", 2),
		// https://en.wikipedia.org/wiki/Amelia_Bedelia
		q("Who wrote the 'Amelia Bedelia' books, about a maid who takes everything literally?", ["Arnold Lobel", "Barbara Park", "Peggy Parish", "Syd Hoff"], "Peggy Parish", 2),
		// https://en.wikipedia.org/wiki/Corduroy_(book)
		q("Who wrote 'Corduroy,' about a teddy bear missing a button?", ["Robert McCloskey", "Don Freeman", "Margret Rey", "Arnold Lobel"], "Don Freeman", 2),
		// https://en.wikipedia.org/wiki/The_Gruffalo
		q("Who wrote 'The Gruffalo'?", ["Mo Willems", "Jon Klassen", "Julia Donaldson", "Eric Carle"], "Julia Donaldson", 1),
		// https://en.wikipedia.org/wiki/The_Gruffalo
		q("In 'The Gruffalo,' which small animal outwits the predators?", ["a frog", "a squirrel", "a rabbit", "a mouse"], "a mouse", 1),
		// https://en.wikipedia.org/wiki/Elephant_and_Piggie
		q("Who created the 'Elephant & Piggie' books?", ["Kevin Henkes", "Mo Willems", "Dav Pilkey", "Jon Klassen"], "Mo Willems", 2),
		// https://en.wikipedia.org/wiki/If_You_Give_a_Mouse_a_Cookie
		q("Who wrote 'If You Give a Mouse a Cookie'?", ["Judith Viorst", "Laura Numeroff", "Mo Willems", "Anna Dewdney"], "Laura Numeroff", 2),
		// https://en.wikipedia.org/wiki/Alexander_and_the_Terrible,_Horrible,_No_Good,_Very_Bad_Day
		q("Who wrote 'Alexander and the Terrible, Horrible, No Good, Very Bad Day'?", ["Laura Numeroff", "Judith Viorst", "Beverly Cleary", "Judy Blume"], "Judith Viorst", 2),
		// https://en.wikipedia.org/wiki/Wings_of_Fire_(novel_series)
		q("Who wrote the 'Wings of Fire' dragon series?", ["Kathryn Lasky", "Brandon Mull", "Erin Hunter", "Tui T. Sutherland"], "Tui T. Sutherland", 2),
		// https://en.wikipedia.org/wiki/Warriors_(novel_series)
		q("Which pen name is used for the 'Warriors' cat novels?", ["Rachel Hunt", "Tui Sutherland", "Kathryn Lasky", "Erin Hunter"], "Erin Hunter", 2),
		// https://en.wikipedia.org/wiki/Artemis_Fowl
		q("Who wrote the 'Artemis Fowl' series?", ["Eoin Colfer", "Anthony Horowitz", "Derek Landy", "Darren Shan"], "Eoin Colfer", 2),
		// https://en.wikipedia.org/wiki/Alex_Rider
		q("Who wrote the 'Alex Rider' spy novels?", ["Anthony Horowitz", "Charlie Higson", "Eoin Colfer", "Robert Muchamore"], "Anthony Horowitz", 2),
		// https://en.wikipedia.org/wiki/Inkheart
		q("Who wrote 'Inkheart'?", ["Jonathan Stroud", "Cornelia Funke", "Philip Pullman", "Michael Ende"], "Cornelia Funke", 2),
		// https://en.wikipedia.org/wiki/The_Neverending_Story
		q("Who wrote 'The NeverEnding Story'?", ["Otfried Preußler", "Michael Ende", "Cornelia Funke", "Erich Kästner"], "Michael Ende", 2),
		// https://en.wikipedia.org/wiki/The_Little_Prince
		q("In 'The Little Prince,' the prince lives on an asteroid known by which code?", ["B-612", "A-113", "K-9", "X-1"], "B-612", 2),
		// https://en.wikipedia.org/wiki/The_Adventures_of_Pinocchio
		q("Who wrote 'The Adventures of Pinocchio'?", ["Italo Calvino", "Gianni Rodari", "Carlo Collodi", "Umberto Eco"], "Carlo Collodi", 2),
		// https://en.wikipedia.org/wiki/Hatter_(Alice's_Adventures_in_Wonderland)
		q("In 'Alice's Adventures in Wonderland,' who hosts the tea party with the March Hare?", ["the White Rabbit", "the Mad Hatter", "the Dormouse", "the Caterpillar"], "the Mad Hatter", 1),
		// https://en.wikipedia.org/wiki/Cheshire_Cat
		q("Which character in 'Alice in Wonderland' can vanish leaving only its grin?", ["the Cheshire Cat", "the Mock Turtle", "the March Hare", "the Dormouse"], "the Cheshire Cat", 1),
		// https://en.wikipedia.org/wiki/Gulliver's_Travels
		q("In 'Gulliver's Travels,' what are the tiny people of Lilliput called?", ["Brobdingnagians", "Yahoos", "Houyhnhnms", "Lilliputians"], "Lilliputians", 2),
		// https://en.wikipedia.org/wiki/Robinson_Crusoe
		q("In 'Robinson Crusoe,' what does Crusoe name the man he rescues?", ["Friday", "Monday", "Tuesday", "Sunday"], "Friday", 1),
		// https://en.wikipedia.org/wiki/Treasure_Island
		q("In 'Treasure Island,' what is the name of the young narrator?", ["Billy Bones", "Tom Morgan", "Jim Hawkins", "Ben Gunn"], "Jim Hawkins", 2),
		// https://en.wikipedia.org/wiki/Edmond_Dantès
		q("In 'The Count of Monte Cristo,' what is the hero's real name?", ["Albert de Morcerf", "Edmond Dantès", "Gérard de Villefort", "Fernand Mondego"], "Edmond Dantès", 2),
		// https://en.wikipedia.org/wiki/Captain_Nemo
		q("Who is the captain of the submarine Nautilus in Jules Verne's novels?", ["Captain Hook", "Captain Ahab", "Captain Flint", "Captain Nemo"], "Captain Nemo", 1),
		// https://en.wikipedia.org/wiki/Bagheera
		q("In 'The Jungle Book,' what kind of animal is Bagheera?", ["a tiger", "a brown bear", "a wolf", "a black panther"], "a black panther", 1),
		// https://en.wikipedia.org/wiki/Baloo
		q("What is the name of the bear who teaches Mowgli the law of the jungle?", ["Hathi", "Akela", "Baloo", "Kaa"], "Baloo", 1),
		// https://en.wikipedia.org/wiki/Shere_Khan
		q("What is the name of the tiger who hunts Mowgli in 'The Jungle Book'?", ["Tabaqui", "Shere Khan", "Rajah", "Bagheera"], "Shere Khan", 1),
		// https://en.wikipedia.org/wiki/White_Fang
		q("Who wrote 'White Fang'?", ["Farley Mowat", "James Oliver Curwood", "Jack London", "Gary Paulsen"], "Jack London", 2),
		// https://en.wikipedia.org/wiki/The_Call_of_the_Wild
		q("In 'The Call of the Wild,' what is the name of the dog stolen from California?", ["Yeller", "Bolt", "White Fang", "Buck"], "Buck", 2),
		// https://en.wikipedia.org/wiki/The_Old_Man_and_the_Sea
		q("In 'The Old Man and the Sea,' what is the old fisherman's name?", ["Manolin", "Santiago", "Pedro", "Ernesto"], "Santiago", 2),
		// https://en.wikipedia.org/wiki/Because_I_could_not_stop_for_Death
		q("Which poet wrote 'Because I could not stop for Death'?", ["Emily Dickinson", "Christina Rossetti", "Sylvia Plath", "Elizabeth Bishop"], "Emily Dickinson", 2),
		// https://en.wikipedia.org/wiki/Stopping_by_Woods_on_a_Snowy_Evening
		q("Which poet wrote 'Stopping by Woods on a Snowy Evening'?", ["Emily Dickinson", "Wallace Stevens", "E. E. Cummings", "Robert Frost"], "Robert Frost", 2),
		// https://en.wikipedia.org/wiki/The_Raven
		q("What one word does the bird repeat in Poe's 'The Raven'?", ["Forevermore", "Nevermore", "Lenore", "Evermore"], "Nevermore", 1),
		// https://en.wikipedia.org/wiki/Do_not_go_gentle_into_that_good_night
		q("Which poet wrote 'Do not go gentle into that good night'?", ["W. B. Yeats", "T. S. Eliot", "W. H. Auden", "Dylan Thomas"], "Dylan Thomas", 2),
		// https://en.wikipedia.org/wiki/King_Lear
		q("In 'King Lear,' how many daughters does Lear have?", ["five", "four", "three", "two"], "three", 2),
		// https://en.wikipedia.org/wiki/Macbeth
		q("Which Shakespeare play features the line 'Out, damned spot'?", ["Macbeth", "Hamlet", "Othello", "King Lear"], "Macbeth", 1),
		// https://en.wikipedia.org/wiki/A_Midsummer_Night's_Dream
		q("In 'A Midsummer Night's Dream,' whose head is turned into a donkey's?", ["Lysander", "Oberon", "Bottom", "Puck"], "Bottom", 2),
		// https://en.wikipedia.org/wiki/The_Tempest
		q("In 'The Tempest,' what is the name of the exiled magician?", ["Prospero", "Ferdinand", "Ariel", "Caliban"], "Prospero", 2),
		// https://en.wikipedia.org/wiki/Hamlet
		q("In 'Hamlet,' what is the name of the king who murdered Hamlet's father?", ["Claudius", "Laertes", "Horatio", "Polonius"], "Claudius", 2),
		// https://en.wikipedia.org/wiki/Romeo_and_Juliet
		q("In 'Romeo and Juliet,' what is Juliet's family name?", ["Capulet", "Tybalt", "Benvolio", "Montague"], "Capulet", 1),
		// https://en.wikipedia.org/wiki/Penelope
		q("In Homer's 'Odyssey,' what is the name of Odysseus's faithful wife?", ["Penelope", "Andromache", "Helen", "Circe"], "Penelope", 2),
		// https://en.wikipedia.org/wiki/Polyphemus
		q("In the 'Odyssey,' which one-eyed giant does Odysseus blind?", ["Antaeus", "Polyphemus", "Talos", "Cyclops Argus"], "Polyphemus", 2),
		// https://en.wikipedia.org/wiki/Beowulf
		q("Which monster's mother does Beowulf fight after killing the monster?", ["the dragon", "Grendel", "Hrothgar", "Wiglaf"], "Grendel", 2),
		// https://en.wikipedia.org/wiki/The_Faerie_Queene
		q("Which Edmund Spenser epic honors Queen Elizabeth I as Gloriana?", ["Idylls of the King", "The Faerie Queene", "The Prelude", "Paradise Lost"], "The Faerie Queene", 3),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Seoul
		q("Which river flows through Seoul?", ["Taedong River", "Yalu River", "Han River", "Nakdong River"], "Han River", 2),
		// https://en.wikipedia.org/wiki/Pyongyang
		q("Which river flows through Pyongyang?", ["Tumen", "Taedong", "Yalu", "Han"], "Taedong", 3),
		// https://en.wikipedia.org/wiki/Victoria_Falls
		q("Victoria Falls lies on the border of Zambia and which country?", ["Malawi", "Mozambique", "Zimbabwe", "Botswana"], "Zimbabwe", 2),
		// https://en.wikipedia.org/wiki/Gobi_Desert
		q("Which desert covers much of Mongolia and northern China?", ["Gobi", "Taklamakan", "Kalahari", "Thar"], "Gobi", 1),
		// https://en.wikipedia.org/wiki/Atacama_Desert
		q("Which coastal desert in Chile is among the driest places on Earth?", ["Atacama", "Sonoran", "Namib", "Patagonian"], "Atacama", 2),
		// https://en.wikipedia.org/wiki/Thar_Desert
		q("Which desert straddles the border of India and Pakistan?", ["Kalahari", "Karakum", "Thar", "Gobi"], "Thar", 2),
		// https://en.wikipedia.org/wiki/Bosporus
		q("Which strait divides Istanbul between Europe and Asia?", ["Dardanelles", "Hormuz", "Bosporus", "Gibraltar"], "Bosporus", 2),
		// https://en.wikipedia.org/wiki/Strait_of_Messina
		q("Which strait separates Italy's mainland from Sicily?", ["Strait of Otranto", "Strait of Sicily", "Bonifacio Strait", "Strait of Messina"], "Strait of Messina", 2),
		// https://en.wikipedia.org/wiki/Kiel_Canal
		q("Which canal links the North Sea and the Baltic Sea across Germany?", ["Rhine Canal", "Corinth Canal", "Suez Canal", "Kiel Canal"], "Kiel Canal", 3),
		// https://en.wikipedia.org/wiki/Mount_Elbrus
		q("Mount Elbrus, Europe's highest peak, is in which country?", ["Russia", "Armenia", "Turkey", "Georgia"], "Russia", 2),
		// https://en.wikipedia.org/wiki/Borneo
		q("Which island is shared by Indonesia, Malaysia and Brunei?", ["Sumatra", "Java", "New Guinea", "Borneo"], "Borneo", 2),
		// https://en.wikipedia.org/wiki/Timor
		q("The island of Timor is shared by Indonesia and which country?", ["East Timor", "Malaysia", "Brunei", "Papua New Guinea"], "East Timor", 2),
		// https://en.wikipedia.org/wiki/Philippines
		q("Which country is made up of more than 7,000 islands including Luzon and Mindanao?", ["Japan", "Indonesia", "Malaysia", "Philippines"], "Philippines", 1),
		// https://en.wikipedia.org/wiki/Liechtenstein
		q("Which country lies between Austria and Switzerland?", ["Luxembourg", "Liechtenstein", "Monaco", "Andorra"], "Liechtenstein", 1),
		// https://en.wikipedia.org/wiki/Andorra
		q("Andorra lies between Spain and which country?", ["Portugal", "Italy", "Monaco", "France"], "France", 2),
		// https://en.wikipedia.org/wiki/Canada
		q("Which country has the most natural lakes, with hundreds of thousands?", ["Sweden", "Finland", "Russia", "Canada"], "Canada", 2),
		// https://en.wikipedia.org/wiki/Great_Barrier_Reef
		q("The Great Barrier Reef lies off the coast of which Australian state?", ["Victoria", "New South Wales", "Western Australia", "Queensland"], "Queensland", 2),
		// https://en.wikipedia.org/wiki/Sugarloaf_Mountain
		q("Sugarloaf Mountain overlooks which city?", ["Salvador", "Rio de Janeiro", "Buenos Aires", "São Paulo"], "Rio de Janeiro", 1),
		// https://en.wikipedia.org/wiki/Bishkek
		q("Which country's capital is Bishkek?", ["Uzbekistan", "Tajikistan", "Kazakhstan", "Kyrgyzstan"], "Kyrgyzstan", 2),
		// https://en.wikipedia.org/wiki/Dushanbe
		q("Which country's capital is Dushanbe?", ["Uzbekistan", "Tajikistan", "Turkmenistan", "Kyrgyzstan"], "Tajikistan", 3),
		// https://en.wikipedia.org/wiki/Ashgabat
		q("Which country's capital is Ashgabat?", ["Uzbekistan", "Azerbaijan", "Turkmenistan", "Tajikistan"], "Turkmenistan", 3),
		// https://en.wikipedia.org/wiki/Chișinău
		q("Which country's capital is Chisinau?", ["Belarus", "Romania", "Ukraine", "Moldova"], "Moldova", 2),
		// https://en.wikipedia.org/wiki/Podgorica
		q("Which country's capital is Podgorica?", ["North Macedonia", "Montenegro", "Kosovo", "Albania"], "Montenegro", 3),
		// https://en.wikipedia.org/wiki/Tirana
		q("Which country's capital is Tirana?", ["Albania", "Bulgaria", "Montenegro", "Kosovo"], "Albania", 2),
		// https://en.wikipedia.org/wiki/Thimphu
		q("Which country's capital is Thimphu?", ["Bhutan", "Laos", "Myanmar", "Nepal"], "Bhutan", 3),
		// https://en.wikipedia.org/wiki/Lilongwe
		q("Which country's capital is Lilongwe?", ["Zambia", "Malawi", "Mozambique", "Zimbabwe"], "Malawi", 3),
		// https://en.wikipedia.org/wiki/Nassau,_Bahamas
		q("Which country's capital is Nassau?", ["Barbados", "Jamaica", "Bahamas", "Cuba"], "Bahamas", 2),
	],
};
