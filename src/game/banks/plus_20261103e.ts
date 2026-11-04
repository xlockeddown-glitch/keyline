// Tuesday Nov 3, 2026 easy trivia top-up (ported in 0.1.112, file e). Reason: Ryan asked for a small batch of easy cards, a
// little for each category. Mostly diff 1. No local, no math (math over mathCap). Every card was fact-level dup-checked
// (scripts/trivia-dupcheck.mjs) against the whole deck and its answer confirmed in the cited Wikipedia article text.
import { q } from "../quiz";
import type { TriviaQ } from "../types";

type PlusCat = "arts" | "books" | "celebrity" | "food" | "games" | "geography" | "history" | "music" | "nature" | "political" | "science" | "sports";

export const PLUS_20261103E: Record<PlusCat, TriviaQ[]> = {
	sports: [
		// https://en.wikipedia.org/wiki/Rugby_ball
		q("What shape is a rugby ball?", ["round", "square", "triangular", "oval"], "oval", 1),
		// https://en.wikipedia.org/wiki/Hat-trick
		q("What is it called when one player scores three goals in a game?", ["grand slam", "triple play", "hole in one", "hat-trick"], "hat-trick", 1),
		// https://en.wikipedia.org/wiki/Par_(score)
		q("In golf, what is a score of one stroke under par called?", ["eagle", "bogey", "albatross", "birdie"], "birdie", 1),
		// https://en.wikipedia.org/wiki/Pommel_horse
		q("Which sport uses a pommel horse?", ["equestrian", "gymnastics", "polo", "fencing"], "gymnastics", 1),
		// https://en.wikipedia.org/wiki/Super_Bowl
		q("Which sport's championship game is the Super Bowl?", ["Canadian football", "American football", "Australian rules", "rugby league"], "American football", 1),
	],
	political: [
		// https://en.wikipedia.org/wiki/Republican_Party_(United_States)
		q("What animal symbolizes the U.S. Republican Party?", ["elephant", "donkey", "eagle", "bear"], "elephant", 1),
		// https://en.wikipedia.org/wiki/Vice_President_of_the_United_States
		q("Who becomes U.S. president if the president dies in office?", ["Speaker of the House", "vice president", "chief justice", "secretary of state"], "vice president", 1),
		// https://en.wikipedia.org/wiki/Flag_of_the_United_States
		q("How many stars are on the U.S. flag?", ["48", "50", "51", "52"], "50", 1),
	],
	food: [
		// https://en.wikipedia.org/wiki/Guacamole
		q("What fruit is the main ingredient in guacamole?", ["lime", "tomato", "mango", "avocado"], "avocado", 1),
		// https://en.wikipedia.org/wiki/Omelette
		q("What is the main ingredient of an omelet?", ["milk", "cheese", "flour", "eggs"], "eggs", 1),
		// https://en.wikipedia.org/wiki/Falafel
		q("What legume is falafel often made from?", ["lentils", "rice", "chickpeas", "potatoes"], "chickpeas", 1),
		// https://en.wikipedia.org/wiki/Raisin
		q("What is a dried grape called?", ["prune", "raisin", "date", "fig"], "raisin", 1),
		// https://en.wikipedia.org/wiki/Brie
		q("What kind of food is brie?", ["bread", "sausage", "cheese", "pastry"], "cheese", 1),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Pablo_Picasso
		q("Which Spanish artist co-founded Cubism?", ["Salvador Dalí", "Pablo Picasso", "Joan Miró", "Francisco Goya"], "Pablo Picasso", 1),
		// https://en.wikipedia.org/wiki/Portrait
		q("What is a painting or photo of a person's face called?", ["landscape", "still life", "seascape", "portrait"], "portrait", 1),
	],
	science: [
		// https://en.wikipedia.org/wiki/Gravity
		q("What force pulls objects toward Earth?", ["magnetism", "friction", "inertia", "gravity"], "gravity", 1),
		// https://en.wikipedia.org/wiki/Leaf
		q("In which plant part does most photosynthesis happen?", ["roots", "leaves", "stems", "flowers"], "leaves", 1),
		// https://en.wikipedia.org/wiki/Thermometer
		q("What instrument measures temperature?", ["thermometer", "barometer", "speedometer", "odometer"], "thermometer", 1),
		// https://en.wikipedia.org/wiki/Oxygen
		q("What is the chemical symbol for oxygen?", ["Ox", "Og", "O", "Os"], "O", 1),
		// https://en.wikipedia.org/wiki/Seismometer
		q("What does a seismometer detect?", ["tornadoes", "lightning", "rainfall", "earthquakes"], "earthquakes", 1),
		// https://en.wikipedia.org/wiki/Red_blood_cell
		q("Which blood cells carry oxygen around the body?", ["white blood cells", "platelets", "plasma cells", "red blood cells"], "red blood cells", 1),
	],
	history: [
		// https://en.wikipedia.org/wiki/Titanic
		q("Which ship sank in 1912 after hitting an iceberg?", ["Titanic", "Lusitania", "Britannic", "Olympic"], "Titanic", 1),
		// https://en.wikipedia.org/wiki/Giza_pyramid_complex
		q("Which ancient people built the pyramids of Giza?", ["Romans", "Greeks", "Persians", "Egyptians"], "Egyptians", 1),
		// https://en.wikipedia.org/wiki/Napoleon
		q("Which French emperor was exiled to the island of Elba?", ["Napoleon", "Louis XVI", "Charlemagne", "Robespierre"], "Napoleon", 1),
		// https://en.wikipedia.org/wiki/Queen_Victoria
		q("Which British queen gave her name to the 1800s era?", ["Elizabeth I", "Victoria", "Anne", "Mary I"], "Victoria", 1),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Chameleon
		q("Which lizard is famous for changing its skin color?", ["iguana", "gecko", "Komodo dragon", "chameleon"], "chameleon", 1),
		// https://en.wikipedia.org/wiki/Zebra
		q("Which African animal has black and white stripes?", ["zebra", "okapi", "giraffe", "hyena"], "zebra", 1),
		// https://en.wikipedia.org/wiki/Honey_bee
		q("Which insect lives in hive colonies with a queen and turns flower nectar into a sweet food?", ["wasp", "honey bee", "hornet", "ant"], "honey bee", 1),
	],
	games: [
		// https://en.wikipedia.org/wiki/Mario
		q("What is the name of Nintendo's famous mustached plumber?", ["Mario", "Wario", "Sonic", "Link"], "Mario", 1),
		// https://en.wikipedia.org/wiki/Cluedo
		q("Which board game features Colonel Mustard and Professor Plum?", ["Monopoly", "Clue", "Sorry!", "Risk"], "Clue", 1),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Harpo_Productions
		q("Which talk show host founded Harpo Productions?", ["Ellen DeGeneres", "Tyra Banks", "Oprah Winfrey", "Rosie O'Donnell"], "Oprah Winfrey", 1),
		// https://en.wikipedia.org/wiki/Pretty_Woman
		q("Which actress starred in 'Pretty Woman' (1990)?", ["Meg Ryan", "Sandra Bullock", "Julia Roberts", "Demi Moore"], "Julia Roberts", 1),
		// https://en.wikipedia.org/wiki/William_Shatner
		q("Who played Captain Kirk in the original 'Star Trek'?", ["Leonard Nimoy", "William Shatner", "DeForest Kelley", "James Doohan"], "William Shatner", 1),
		// https://en.wikipedia.org/wiki/Edward_Scissorhands
		q("Who played the title role in 'Edward Scissorhands'?", ["Tom Cruise", "Johnny Depp", "Nicolas Cage", "Jim Carrey"], "Johnny Depp", 1),
	],
	music: [
		// https://en.wikipedia.org/wiki/Like_a_Prayer_(song)
		q("Who sang 'Like a Prayer' (1989)?", ["Cher", "Cyndi Lauper", "Madonna", "Whitney Houston"], "Madonna", 1),
		// https://en.wikipedia.org/wiki/Western_concert_flute
		q("Which woodwind instrument is held sideways to play?", ["clarinet", "flute", "oboe", "bassoon"], "flute", 1),
		// https://en.wikipedia.org/wiki/Yellow_Submarine_(song)
		q("Which band sang 'Yellow Submarine'?", ["The Monkees", "The Beach Boys", "The Byrds", "The Beatles"], "The Beatles", 1),
	],
	books: [
		// https://en.wikipedia.org/wiki/The_Hobbit
		q("Which hobbit is the hero of 'The Hobbit'?", ["Bilbo Baggins", "Frodo Baggins", "Samwise Gamgee", "Peregrin Took"], "Bilbo Baggins", 1),
		// https://en.wikipedia.org/wiki/Toto_(Oz)
		q("In 'The Wonderful Wizard of Oz', what is Dorothy's dog called?", ["Rex", "Toto", "Spot", "Fido"], "Toto", 1),
		// https://en.wikipedia.org/wiki/Alice%27s_Adventures_in_Wonderland
		q("What does Alice fall down to reach Wonderland?", ["a well", "a chimney", "a mineshaft", "a rabbit hole"], "a rabbit hole", 1),
		// https://en.wikipedia.org/wiki/Peter_Pan
		q("Which boy who never grows up did J. M. Barrie create?", ["Peter Pan", "Pinocchio", "Oliver Twist", "Tom Thumb"], "Peter Pan", 1),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Mount_Everest
		q("What is the highest mountain above sea level?", ["K2", "Kangchenjunga", "Mount Everest", "Denali"], "Mount Everest", 1),
		// https://en.wikipedia.org/wiki/Atlantic_Ocean
		q("Which ocean lies between Europe and North America?", ["Pacific", "Indian", "Arctic", "Atlantic"], "Atlantic", 1),
		// https://en.wikipedia.org/wiki/Eiffel_Tower
		q("In which country is the Eiffel Tower?", ["Belgium", "Italy", "France", "Spain"], "France", 1),
	],
};
