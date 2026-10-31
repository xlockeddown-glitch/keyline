// Saturday Oct 31, 2026 evergreen trivia top-up (0.1.93 batch, second Oct 31 file). Reason: trivia:balance shows geography (1.8%),
// books (2.1%), music (3.3%), political (3.9%) and food (5.4%) as the thinnest topics; games/celebrity topped up lightly.
// No local, no math (math over mathCap). Every card was fact-level dup-checked (scripts/trivia-dupcheck.mjs) against the
// whole deck and its answer string confirmed in the cited Wikipedia article text.
import { q } from "../quiz";
import type { TriviaQ } from "../types";

type PlusCat = "books" | "celebrity" | "food" | "games" | "geography" | "music" | "political";

export const PLUS_20261031B: Record<PlusCat, TriviaQ[]> = {
	books: [
		// https://en.wikipedia.org/wiki/221B_Baker_Street
		q("Which detective lives at 221B Baker Street?", ["Hercule Poirot", "Philip Marlowe", "Lord Peter Wimsey", "Sherlock Holmes"], "Sherlock Holmes", 1),
		// https://en.wikipedia.org/wiki/Charlotte%27s_Web
		q("In 'Charlotte's Web', what is the pig's name?", ["Napoleon", "Wilbur", "Templeton", "Babe"], "Wilbur", 1),
		// https://en.wikipedia.org/wiki/A_Confederacy_of_Dunces
		q("Who wrote 'A Confederacy of Dunces'?", ["Walker Percy", "Truman Capote", "John Kennedy Toole", "Flannery O'Connor"], "John Kennedy Toole", 3),
		// https://en.wikipedia.org/wiki/Wide_Sargasso_Sea
		q("Who wrote 'Wide Sargasso Sea'?", ["Iris Murdoch", "Muriel Spark", "Jean Rhys", "Doris Lessing"], "Jean Rhys", 3),
		// https://en.wikipedia.org/wiki/Wonder_%28Palacio_novel%29
		q("Who wrote 'Wonder' (2012), about Auggie Pullman?", ["R. J. Palacio", "Kate DiCamillo", "Sharon Creech", "Jerry Spinelli"], "R. J. Palacio", 2),
		// https://en.wikipedia.org/wiki/Because_of_Winn-Dixie
		q("Who wrote 'Because of Winn-Dixie'?", ["Katherine Paterson", "Lois Lowry", "Sharon Creech", "Kate DiCamillo"], "Kate DiCamillo", 2),
		// https://en.wikipedia.org/wiki/Northern_Lights_%28Pullman_novel%29
		q("Who wrote 'The Golden Compass'?", ["Neil Gaiman", "Diana Wynne Jones", "C. S. Lewis", "Philip Pullman"], "Philip Pullman", 2),
		// https://en.wikipedia.org/wiki/A_Series_of_Unfortunate_Events
		q("Which pen name did Daniel Handler use for 'A Series of Unfortunate Events'?", ["Robert Galbraith", "Lewis Carroll", "Lemony Snicket", "Richard Bachman"], "Lemony Snicket", 1),
		// https://en.wikipedia.org/wiki/The_Westing_Game
		q("Who wrote 'The Westing Game'?", ["Lois Lowry", "E. L. Konigsburg", "Norton Juster", "Ellen Raskin"], "Ellen Raskin", 3),
		// https://en.wikipedia.org/wiki/Tuck_Everlasting
		q("Who wrote 'Tuck Everlasting'?", ["Lois Lowry", "Madeleine L'Engle", "Katherine Paterson", "Natalie Babbitt"], "Natalie Babbitt", 2),
		// https://en.wikipedia.org/wiki/The_Firm_%28novel%29
		q("Who wrote 'The Firm' (1991)?", ["David Baldacci", "Scott Turow", "John Grisham", "Michael Connelly"], "John Grisham", 1),
		// https://en.wikipedia.org/wiki/The_Nightingale_%28Hannah_novel%29
		q("Who wrote 'The Nightingale' (2015)?", ["Anthony Doerr", "Delia Owens", "Kate Quinn", "Kristin Hannah"], "Kristin Hannah", 2),
		// https://en.wikipedia.org/wiki/All_the_Light_We_Cannot_See
		q("Who wrote 'All the Light We Cannot See'?", ["Richard Powers", "Anthony Doerr", "Colson Whitehead", "Kristin Hannah"], "Anthony Doerr", 2),
		// https://en.wikipedia.org/wiki/The_Underground_Railroad_%28novel%29
		q("Who wrote 'The Underground Railroad' (2016)?", ["Colson Whitehead", "Ta-Nehisi Coates", "Jesmyn Ward", "James McBride"], "Colson Whitehead", 2),
		// https://en.wikipedia.org/wiki/Lincoln_in_the_Bardo
		q("Who wrote 'Lincoln in the Bardo'?", ["Jonathan Franzen", "George Saunders", "Michael Chabon", "Colson Whitehead"], "George Saunders", 3),
		// https://en.wikipedia.org/wiki/Demon_Copperhead
		q("Who wrote 'Demon Copperhead'?", ["Barbara Kingsolver", "Elizabeth Strout", "Ann Patchett", "Richard Powers"], "Barbara Kingsolver", 2),
		// https://en.wikipedia.org/wiki/Olive_Kitteridge
		q("Who wrote 'Olive Kitteridge'?", ["Anne Tyler", "Ann Patchett", "Alice McDermott", "Elizabeth Strout"], "Elizabeth Strout", 3),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Sheldon_Cooper
		q("Who played Sheldon Cooper on 'The Big Bang Theory'?", ["Jim Parsons", "Kunal Nayyar", "Simon Helberg", "Johnny Galecki"], "Jim Parsons", 1),
	],
	food: [
		// https://en.wikipedia.org/wiki/Pesto
		q("Pesto alla genovese comes from which Italian city?", ["Milan", "Naples", "Genoa", "Turin"], "Genoa", 1),
		// https://en.wikipedia.org/wiki/Paella
		q("Which spice gives paella its yellow color?", ["Annatto", "Turmeric", "Saffron", "Paprika"], "Saffron", 2),
		// https://en.wikipedia.org/wiki/Greek_salad
		q("Which cheese is traditionally used in a Greek salad?", ["Kasseri", "Manouri", "Feta", "Halloumi"], "Feta", 1),
		// https://en.wikipedia.org/wiki/Tortellini
		q("Which Italian city is the home of tortellini, by tradition?", ["Florence", "Venice", "Rome", "Bologna"], "Bologna", 2),
		// https://en.wikipedia.org/wiki/Tiramisu
		q("Tiramisu is flavored with which drink?", ["Rum", "Tea", "Coffee", "Cocoa"], "Coffee", 1),
		// https://en.wikipedia.org/wiki/Pad_thai
		q("Pad thai is a stir-fried dish of…", ["Rice noodles", "Glass noodles", "Udon", "Egg noodles"], "Rice noodles", 2),
		// https://en.wikipedia.org/wiki/Mole_%28sauce%29
		q("Mole poblano comes from which Mexican state?", ["Puebla", "Yucatán", "Jalisco", "Oaxaca"], "Puebla", 2),
		// https://en.wikipedia.org/wiki/Chipotle
		q("Which pepper is dried and smoked to make chipotle?", ["Habanero", "Poblano", "Jalapeño", "Serrano"], "Jalapeño", 2),
		// https://en.wikipedia.org/wiki/Naan
		q("Which Indian bread is baked in a tandoor?", ["Naan", "Paratha", "Puri", "Chapati"], "Naan", 1),
		// https://en.wikipedia.org/wiki/Wine
		q("Which drink is made from fermented grapes?", ["Sake", "Wine", "Cider", "Beer"], "Wine", 1),
		// https://en.wikipedia.org/wiki/Tabbouleh
		q("Which herb is the main green in tabbouleh?", ["Mint", "Parsley", "Basil", "Cilantro"], "Parsley", 2),
		// https://en.wikipedia.org/wiki/Taco
		q("Which country is the origin of the taco?", ["Peru", "Spain", "Mexico", "Cuba"], "Mexico", 1),
		// https://en.wikipedia.org/wiki/Pizza
		q("Which country is the origin of pizza?", ["Greece", "Italy", "Spain", "France"], "Italy", 1),
		// https://en.wikipedia.org/wiki/Poutine
		q("Which country is the origin of the dish poutine?", ["France", "Canada", "United States", "Belgium"], "Canada", 1),
		// https://en.wikipedia.org/wiki/Bratwurst
		q("Bratwurst is a sausage from which country?", ["Poland", "Austria", "Hungary", "Germany"], "Germany", 1),
		// https://en.wikipedia.org/wiki/Sachertorte
		q("Which country is the origin of the Sacher torte?", ["Austria", "Hungary", "Germany", "Switzerland"], "Austria", 2),
		// https://en.wikipedia.org/wiki/Manchego
		q("Which Spanish cheese is made from Manchega sheep's milk?", ["Idiazabal", "Cabrales", "Mahón", "Manchego"], "Manchego", 2),
	],
	games: [
		// https://en.wikipedia.org/wiki/Mario
		q("Which company created Super Mario?", ["Sony", "Sega", "Atari", "Nintendo"], "Nintendo", 1),
		// https://en.wikipedia.org/wiki/Pac-Man
		q("In Pac-Man, what does Pac-Man eat to chase the ghosts?", ["Super stars", "Power pellets", "Golden keys", "Bonus fruits"], "Power pellets", 1),
		// https://en.wikipedia.org/wiki/Monopoly_%28game%29
		q("In Monopoly, what color are the cheapest properties?", ["Light blue", "Orange", "Pink", "Brown"], "Brown", 2),
		// https://en.wikipedia.org/wiki/Creeper_%28Minecraft%29
		q("Which game features creatures called Creepers?", ["Roblox", "Minecraft", "Fortnite", "Terraria"], "Minecraft", 1),
		// https://en.wikipedia.org/wiki/Tetris
		q("Which puzzle game was created by Alexey Pajitnov?", ["Dr. Mario", "Columns", "Tetris", "Lemmings"], "Tetris", 1),
		// https://en.wikipedia.org/wiki/List_of_poker_hands
		q("In poker, what beats a straight?", ["High card", "Flush", "Two pair", "Three of a kind"], "Flush", 2),
		// https://en.wikipedia.org/wiki/Checkmate
		q("Which game is played with 'checkmate'?", ["Chess", "Backgammon", "Go", "Checkers"], "Chess", 1),
		// https://en.wikipedia.org/wiki/Donkey_Kong_%28character%29
		q("Donkey Kong first appeared in a 1981 arcade game by…", ["Nintendo", "Atari", "Sega", "Namco"], "Nintendo", 1),
		// https://en.wikipedia.org/wiki/Backgammon
		q("Which board game uses the terms 'gammon' and 'doubling cube'?", ["Backgammon", "Parcheesi", "Mahjong", "Go"], "Backgammon", 2),
		// https://en.wikipedia.org/wiki/Cluedo
		q("In Clue, how many suspects are in the classic game?", ["Seven", "Eight", "Five", "Six"], "Six", 2),
		// https://en.wikipedia.org/wiki/Go_%28game%29
		q("Which game has the pieces 'stones' on a 19x19 board?", ["Othello", "Xiangqi", "Go", "Shogi"], "Go", 2),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Strait_of_Gibraltar
		q("The Strait of Gibraltar separates Spain from…", ["Morocco", "Portugal", "Algeria", "Tunisia"], "Morocco", 1),
		// https://en.wikipedia.org/wiki/Danube
		q("The Danube empties into which sea?", ["Black Sea", "Adriatic Sea", "Baltic Sea", "Aegean Sea"], "Black Sea", 2),
		// https://en.wikipedia.org/wiki/Pyrenees
		q("The Pyrenees separate France from…", ["Spain", "Italy", "Portugal", "Switzerland"], "Spain", 1),
		// https://en.wikipedia.org/wiki/Lake_Tana
		q("Which lake is the source of the Blue Nile?", ["Lake Turkana", "Lake Tana", "Lake Victoria", "Lake Albert"], "Lake Tana", 3),
		// https://en.wikipedia.org/wiki/Victoria_Falls
		q("Victoria Falls lies on which river?", ["Zambezi", "Limpopo", "Orange", "Congo"], "Zambezi", 2),
		// https://en.wikipedia.org/wiki/Lake_Baikal
		q("Lake Baikal is in which region of Russia?", ["Siberia", "the Caucasus", "the Urals", "Karelia"], "Siberia", 1),
		// https://en.wikipedia.org/wiki/Bosporus
		q("The Bosporus strait runs through which city?", ["Odesa", "Athens", "Istanbul", "Izmir"], "Istanbul", 1),
		// https://en.wikipedia.org/wiki/Congo_River
		q("Which African river crosses the equator twice?", ["Niger River", "Congo River", "Zambezi", "Nile"], "Congo River", 2),
		// https://en.wikipedia.org/wiki/Rio_de_Janeiro
		q("The city of Rio de Janeiro is in which country?", ["Argentina", "Portugal", "Brazil", "Colombia"], "Brazil", 1),
		// https://en.wikipedia.org/wiki/Anchorage%2C_Alaska
		q("Which US state has the city of Anchorage?", ["Alaska", "Washington", "Maine", "Montana"], "Alaska", 1),
		// https://en.wikipedia.org/wiki/Mumbai
		q("Which country has the city of Mumbai?", ["Pakistan", "Bangladesh", "Sri Lanka", "India"], "India", 1),
		// https://en.wikipedia.org/wiki/Seville
		q("Which country has the city of Seville?", ["Italy", "Mexico", "Portugal", "Spain"], "Spain", 1),
		// https://en.wikipedia.org/wiki/Dnieper
		q("Which river flows through Kyiv?", ["Dnieper", "Don", "Volga", "Dniester"], "Dnieper", 2),
		// https://en.wikipedia.org/wiki/River_Liffey
		q("Which river flows through Dublin?", ["River Shannon", "River Lee", "River Boyne", "River Liffey"], "River Liffey", 2),
		// https://en.wikipedia.org/wiki/Isle_of_Skye
		q("The Isle of Skye belongs to which country?", ["Scotland", "Norway", "Ireland", "Wales"], "Scotland", 1),
		// https://en.wikipedia.org/wiki/Crete
		q("Crete is the largest island of which country?", ["Cyprus", "Turkey", "Italy", "Greece"], "Greece", 1),
		// https://en.wikipedia.org/wiki/Zanzibar
		q("Zanzibar is part of which country?", ["Mozambique", "Kenya", "Tanzania", "Madagascar"], "Tanzania", 2),
		// https://en.wikipedia.org/wiki/Black_Forest
		q("The Black Forest is a mountain range in which country?", ["Switzerland", "Austria", "Germany", "Czech Republic"], "Germany", 1),
		// https://en.wikipedia.org/wiki/Dinaric_Alps
		q("The Dinaric Alps run mostly along which sea's coast?", ["Adriatic", "Aegean", "Ionian", "Black"], "Adriatic", 3),
		// https://en.wikipedia.org/wiki/Gulf_of_Bothnia
		q("The Gulf of Bothnia lies between Sweden and…", ["Denmark", "Finland", "Estonia", "Norway"], "Finland", 2),
		// https://en.wikipedia.org/wiki/Yucat%C3%A1n_Peninsula
		q("The Yucatán Peninsula is mostly in which country?", ["Mexico", "Honduras", "Guatemala", "Belize"], "Mexico", 1),
	],
	music: [
		// https://en.wikipedia.org/wiki/Michael_Jackson
		q("Who is known as the 'King of Pop'?", ["Elvis Presley", "Prince", "Stevie Wonder", "Michael Jackson"], "Michael Jackson", 1),
		// https://en.wikipedia.org/wiki/Piano
		q("Which instrument has 88 keys in its standard form?", ["Organ", "Piano", "Harpsichord", "Accordion"], "Piano", 1),
		// https://en.wikipedia.org/wiki/Abbey_Road
		q("Which Beatles album features 'Here Comes the Sun'?", ["Help!", "Abbey Road", "Let It Be", "Revolver"], "Abbey Road", 2),
		// https://en.wikipedia.org/wiki/Blue_Monday_%28New_Order_song%29
		q("Which band recorded 'Blue Monday' (1983)?", ["The Cure", "New Order", "Depeche Mode", "Joy Division"], "New Order", 2),
		// https://en.wikipedia.org/wiki/Bruce_Springsteen
		q("Which singer is nicknamed 'the Boss'?", ["Bruce Springsteen", "Bob Seger", "Jon Bon Jovi", "John Mellencamp"], "Bruce Springsteen", 1),
		// https://en.wikipedia.org/wiki/Lemonade_%28album%29
		q("Which singer released the album 'Lemonade' (2016)?", ["Beyoncé", "Solange", "Adele", "Rihanna"], "Beyoncé", 1),
		// https://en.wikipedia.org/wiki/Eminem
		q("Which rapper's real name is Marshall Mathers?", ["Ice Cube", "Eminem", "Nas", "Dr. Dre"], "Eminem", 1),
		// https://en.wikipedia.org/wiki/Charlie_Parker
		q("Which instrument did jazz great Charlie Parker play?", ["Bass clarinet", "Alto saxophone", "Muted trumpet", "Valve trombone"], "Alto saxophone", 2),
		// https://en.wikipedia.org/wiki/John_Lennon
		q("Which band was John Lennon in?", ["The Kinks", "The Beatles", "The Rolling Stones", "The Who"], "The Beatles", 1),
		// https://en.wikipedia.org/wiki/Hi-hat
		q("Which instrument does a drummer's hi-hat belong to?", ["Cello", "Drum kit", "Xylophone", "Harp"], "Drum kit", 1),
		// https://en.wikipedia.org/wiki/Jolene
		q("Who sang 'Jolene' (1973)?", ["Loretta Lynn", "Patsy Cline", "Dolly Parton", "Tammy Wynette"], "Dolly Parton", 1),
		// https://en.wikipedia.org/wiki/Ring_of_Fire_%28song%29
		q("Who sang 'Ring of Fire' (1963)?", ["Merle Haggard", "Johnny Cash", "Hank Williams", "Willie Nelson"], "Johnny Cash", 1),
		// https://en.wikipedia.org/wiki/To_Pimp_a_Butterfly
		q("Which rapper released 'To Pimp a Butterfly'?", ["Drake", "Kendrick Lamar", "Kanye West", "J. Cole"], "Kendrick Lamar", 2),
	],
	political: [
		// https://en.wikipedia.org/wiki/President_of_the_United_States
		q("How long is a U.S. president's term?", ["Five years", "Four years", "Two years", "Six years"], "Four years", 1),
		// https://en.wikipedia.org/wiki/United_States_Senate
		q("How long is a U.S. senator's term?", ["Two years", "Four years", "Eight years", "Six years"], "Six years", 2),
		// https://en.wikipedia.org/wiki/United_States_House_of_Representatives
		q("What is the lower house of the U.S. Congress?", ["the Senate", "the Assembly", "the Cabinet", "the House"], "the House", 1),
		// https://en.wikipedia.org/wiki/Sejm
		q("Poland's lower house of parliament is the…", ["Seimas", "Duma", "Sejm", "Storting"], "Sejm", 2),
		// https://en.wikipedia.org/wiki/Storting
		q("Norway's parliament is called the…", ["Storting", "Riksdag", "Folketing", "Althing"], "Storting", 2),
		// https://en.wikipedia.org/wiki/Sixteenth_Amendment_to_the_United_States_Constitution
		q("Which amendment created the federal income tax?", ["18th", "16th", "14th", "17th"], "16th", 2),
		// https://en.wikipedia.org/wiki/Thirteenth_Amendment_to_the_United_States_Constitution
		q("Which amendment abolished slavery in the U.S.?", ["14th", "13th", "12th", "15th"], "13th", 1),
		// https://en.wikipedia.org/wiki/Air_Force_One
		q("What is the name of the U.S. president's official airplane when he is aboard?", ["Marine One", "Eagle One", "Air Force Two", "Air Force One"], "Air Force One", 1),
		// https://en.wikipedia.org/wiki/D%C3%A1il_%C3%89ireann
		q("Ireland's lower house of parliament is the…", ["Seanad Éireann", "Dáil Éireann", "Stormont", "Tynwald"], "Dáil Éireann", 3),
		// https://en.wikipedia.org/wiki/Cortes_Generales
		q("Spain's parliament is called the…", ["Assemblée nationale", "Cortes Generales", "Bundesrat", "Sejm"], "Cortes Generales", 2),
		// https://en.wikipedia.org/wiki/European_Parliament
		q("Which body's members are called MEPs?", ["European Parliament", "Council of Europe", "UN General Assembly", "NATO Council"], "European Parliament", 1),
		// https://en.wikipedia.org/wiki/NATO
		q("NATO's headquarters is in which city?", ["Geneva", "Brussels", "Vienna", "The Hague"], "Brussels", 2),
		// https://en.wikipedia.org/wiki/United_States_Capitol
		q("The U.S. Capitol stands in which city?", ["New York City", "Philadelphia", "Washington, D.C.", "Baltimore"], "Washington, D.C.", 1),
		// https://en.wikipedia.org/wiki/Reichstag_building
		q("Which country's parliament meets in the Reichstag building?", ["Austria", "Germany", "Netherlands", "Switzerland"], "Germany", 1),
		// https://en.wikipedia.org/wiki/Oireachtas
		q("Which country's legislature is the Oireachtas?", ["Scotland", "Wales", "Ireland", "Iceland"], "Ireland", 3),
		// https://en.wikipedia.org/wiki/Riksdag
		q("Which country's parliament is the Riksdag?", ["Denmark", "Sweden", "Norway", "Finland"], "Sweden", 2),
		// https://en.wikipedia.org/wiki/Folketing
		q("Which country's parliament is the Folketing?", ["Denmark", "Iceland", "Norway", "Sweden"], "Denmark", 3),
		// https://en.wikipedia.org/wiki/Parliament_of_Finland
		q("Which country's parliament is the Eduskunta?", ["Sweden", "Finland", "Estonia", "Latvia"], "Finland", 3),
		// https://en.wikipedia.org/wiki/Lok_Sabha
		q("Which country's lower house is the Lok Sabha?", ["Pakistan", "India", "Bangladesh", "Nepal"], "India", 2),
		// https://en.wikipedia.org/wiki/State_Duma
		q("The State Duma is the lower house of which country's parliament?", ["Russia", "Belarus", "Kazakhstan", "Ukraine"], "Russia", 1),
		// https://en.wikipedia.org/wiki/Sandra_Day_O%27Connor
		q("Who was the first woman to serve on the U.S. Supreme Court?", ["Ruth Bader Ginsburg", "Elena Kagan", "Sonia Sotomayor", "Sandra Day O'Connor"], "Sandra Day O'Connor", 2),
		// https://en.wikipedia.org/wiki/Thurgood_Marshall
		q("Who was the first Black justice on the U.S. Supreme Court?", ["Hugo Black", "Clarence Thomas", "Thurgood Marshall", "Earl Warren"], "Thurgood Marshall", 2),
		// https://en.wikipedia.org/wiki/Sirimavo_Bandaranaike
		q("Who was the world's first female elected head of government, in Ceylon (1960)?", ["Sirimavo Bandaranaike", "Indira Gandhi", "Chandrika Kumaratunga", "Golda Meir"], "Sirimavo Bandaranaike", 3),
	],
};
