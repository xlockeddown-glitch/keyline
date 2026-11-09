import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Nov 9, 2026 bulk add, sub-batch 2 (0.1.138): evergreen long-tail (Wikidata-curated novels, albums, games, paintings, directors) plus music/food.
 * No math, no local. Every card has a Wikipedia source comment; fact-level dup-checked vs whole deck.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography";

export const PLUS_20261109B: Partial<Record<PlusCat, TriviaQ[]>> = {
	food: [
		// https://en.wikipedia.org/wiki/Moussaka
		q("Which country is the home of the dish moussaka, a layered eggplant bake?", ["Italy", "Spain", "Greece", "Morocco"], "Greece", 2),
		// https://en.wikipedia.org/wiki/Bolognese_sauce
		q("Which Italian city gave its name to Bolognese sauce?", ["Modena", "Parma", "Bologna", "Florence"], "Bologna", 1),
		// https://en.wikipedia.org/wiki/Hummus
		q("What is the main ingredient of hummus?", ["lentils", "white beans", "fava beans", "chickpeas"], "chickpeas", 1),
		// https://en.wikipedia.org/wiki/Mojito
		q("Which spirit is the base of a mojito?", ["gin", "rum", "vodka", "tequila"], "rum", 2),
		// https://en.wikipedia.org/wiki/Margarita
		q("Which spirit is the base of a margarita?", ["vodka", "rum", "tequila", "gin"], "tequila", 2),
		// https://en.wikipedia.org/wiki/Martini_(cocktail)
		q("Which spirit is used in a classic martini?", ["vodka", "rum", "gin", "whiskey"], "gin", 2),
		// https://en.wikipedia.org/wiki/Croissant
		q("Which country invented the croissant's ancestor, the kipferl?", ["Austria", "Hungary", "Germany", "France"], "Austria", 2),
		// https://en.wikipedia.org/wiki/Wagyu
		q("What kind of food is a Wagyu?", ["beef", "pork", "tuna", "chicken"], "beef", 1),
		// https://en.wikipedia.org/wiki/Borscht
		q("Which vegetable is the main ingredient of borscht?", ["beetroot", "carrot", "potato", "cabbage"], "beetroot", 2),
		// https://en.wikipedia.org/wiki/Cointreau
		q("Which fruit is used to make the French liqueur Cointreau?", ["lemon", "cherry", "orange", "pear"], "orange", 2),
		// https://en.wikipedia.org/wiki/Sashimi
		q("What is the Japanese word for raw sliced fish served without rice?", ["tempura", "sashimi", "maki", "nigiri"], "sashimi", 1),
		// https://en.wikipedia.org/wiki/Mole_(sauce)
		q("Which Mexican sauce is made with chili peppers and chocolate?", ["adobo", "salsa verde", "pico de gallo", "mole"], "mole", 2),
		// https://en.wikipedia.org/wiki/Chartreuse_(liqueur)
		q("What color is the liqueur Chartreuse in its classic version?", ["green", "purple", "blue", "red"], "green", 2),
	],
	arts: [
		// https://en.wikipedia.org/wiki/The_Potato_Eaters
		q("Who painted 'The Potato Eaters' (1885)?", ["Camille Pissarro", "Gustave Courbet", "Jean-François Millet", "Vincent van Gogh"], "Vincent van Gogh", 1),
		// https://en.wikipedia.org/wiki/The_Death_of_Socrates
		q("Who painted 'The Death of Socrates' (1787)?", ["Jean-Honoré Fragonard", "Jacques-Louis David", "Nicolas Poussin", "Eugène Delacroix"], "Jacques-Louis David", 2),
		// https://en.wikipedia.org/wiki/Reply_of_the_Zaporozhian_Cossacks
		q("Which Russian artist painted 'Reply of the Zaporozhian Cossacks'?", ["Ilya Repin", "Wassily Kandinsky", "Karl Bryullov", "Ivan Aivazovsky"], "Ilya Repin", 3),
		// https://en.wikipedia.org/wiki/The_Anatomy_Lesson_of_Dr._Nicolaes_Tulp
		q("Who painted 'The Anatomy Lesson of Dr. Nicolaes Tulp' (1632)?", ["Frans Hals", "Johannes Vermeer", "Peter Paul Rubens", "Rembrandt"], "Rembrandt", 2),
		// https://en.wikipedia.org/wiki/Venus_of_Urbino
		q("Who painted 'Venus of Urbino'?", ["Botticelli", "Titian", "Raphael", "Giorgione"], "Titian", 2),
		// https://en.wikipedia.org/wiki/Sistine_Madonna
		q("Who painted the 'Sistine Madonna'?", ["Michelangelo", "Titian", "Raphael", "Correggio"], "Raphael", 2),
		// https://en.wikipedia.org/wiki/Portrait_of_Adele_Bloch-Bauer_I
		q("Who painted 'Portrait of Adele Bloch-Bauer I,' known as the Woman in Gold?", ["Edvard Munch", "Egon Schiele", "Gustav Klimt", "Alphonse Mucha"], "Gustav Klimt", 2),
		// https://en.wikipedia.org/wiki/Where_Do_We_Come_From?_What_Are_We?_Where_Are_We_Going?
		q("Who painted 'Where Do We Come From? What Are We? Where Are We Going?' (1897)?", ["Georges Seurat", "Henri Rousseau", "Paul Gauguin", "Paul Cézanne"], "Paul Gauguin", 2),
		// https://en.wikipedia.org/wiki/The_Calling_of_Saint_Matthew
		q("Which artist painted 'The Calling of Saint Matthew'?", ["Titian", "Caravaggio", "Tintoretto", "Annibale Carracci"], "Caravaggio", 2),
		// https://en.wikipedia.org/wiki/Rokeby_Venus
		q("Which artist painted the 'Rokeby Venus'?", ["Diego Velázquez", "Titian", "Francisco Goya", "Peter Paul Rubens"], "Diego Velázquez", 2),
		// https://en.wikipedia.org/wiki/The_Wounded_Angel
		q("Which Finnish artist painted 'The Wounded Angel' (1903)?", ["Akseli Gallen-Kallela", "Albert Edelfelt", "Hugo Simberg", "Helene Schjerfbeck"], "Hugo Simberg", 3),
		// https://en.wikipedia.org/wiki/Charles_IV_of_Spain_and_His_Family
		q("Who painted 'Charles IV of Spain and His Family' (1800)?", ["El Greco", "Diego Velázquez", "Bartolomé Murillo", "Francisco Goya"], "Francisco Goya", 2),
		// https://en.wikipedia.org/wiki/A_Philosopher_Lecturing_on_the_Orrery
		q("Who painted 'A Philosopher Lecturing on the Orrery'?", ["Thomas Gainsborough", "William Hogarth", "Joshua Reynolds", "Joseph Wright of Derby"], "Joseph Wright of Derby", 3),
		// https://en.wikipedia.org/wiki/The_Massacre_at_Chios
		q("Which artist painted 'The Massacre at Chios' (1824)?", ["Jacques-Louis David", "Antoine-Jean Gros", "Théodore Géricault", "Eugène Delacroix"], "Eugène Delacroix", 2),
		// https://en.wikipedia.org/wiki/The_Burial_of_the_Count_of_Orgaz
		q("Which artist painted 'The Burial of the Count of Orgaz'?", ["Titian", "Diego Velázquez", "Francisco de Zurbarán", "El Greco"], "El Greco", 2),
		// https://en.wikipedia.org/wiki/The_Three_Philosophers
		q("Which Venetian artist painted 'The Three Philosophers'?", ["Giorgione", "Titian", "Tintoretto", "Giovanni Bellini"], "Giorgione", 3),
		// https://en.wikipedia.org/wiki/The_Last_Day_of_Pompeii
		q("Who painted 'The Last Day of Pompeii' (1833)?", ["Ivan Aivazovsky", "Ilya Repin", "Vasily Surikov", "Karl Bryullov"], "Karl Bryullov", 3),
		// https://en.wikipedia.org/wiki/The_Balcony_(Manet)
		q("Who painted 'The Balcony' (1868), now in the Musée d'Orsay?", ["Claude Monet", "Édouard Manet", "Gustave Caillebotte", "Edgar Degas"], "Édouard Manet", 2),
		// https://en.wikipedia.org/wiki/Woman_with_a_Parasol_–_Madame_Monet_and_Her_Son
		q("Who painted 'Woman with a Parasol – Madame Monet and Her Son'?", ["Claude Monet", "Berthe Morisot", "Mary Cassatt", "Pierre-Auguste Renoir"], "Claude Monet", 2),
	],
	games: [
		// https://en.wikipedia.org/wiki/Second_Life
		q("Which company developed the online virtual world 'Second Life'?", ["Jagex", "Mojang", "Blizzard", "Linden Lab"], "Linden Lab", 2),
		// https://en.wikipedia.org/wiki/The_Sims_2
		q("Which studio developed 'The Sims 2' (2004)?", ["Westwood", "BioWare", "Maxis", "Firaxis"], "Maxis", 2),
		// https://en.wikipedia.org/wiki/Clash_Royale
		q("Which Finnish company developed 'Clash Royale'?", ["Remedy", "Rovio", "Supercell", "King"], "Supercell", 2),
		// https://en.wikipedia.org/wiki/Valorant
		q("Which company developed the shooter 'Valorant' (2020)?", ["Bungie", "Riot Games", "Blizzard", "Valve"], "Riot Games", 2),
		// https://en.wikipedia.org/wiki/Euro_Truck_Simulator_2
		q("Which Czech studio developed 'Euro Truck Simulator 2'?", ["SCS Software", "Pterodon", "Warhorse Studios", "Bohemia Interactive"], "SCS Software", 3),
		// https://en.wikipedia.org/wiki/Fallout_3
		q("Which studio developed 'Fallout 3' (2008)?", ["BioWare", "Obsidian Entertainment", "Interplay", "Bethesda Game Studios"], "Bethesda Game Studios", 2),
		// https://en.wikipedia.org/wiki/Call_of_Duty:_Black_Ops
		q("Which studio developed 'Call of Duty: Black Ops' (2010)?", ["Raven Software", "Sledgehammer", "Infinity Ward", "Treyarch"], "Treyarch", 2),
		// https://en.wikipedia.org/wiki/S.T.A.L.K.E.R.:_Shadow_of_Chernobyl
		q("Which Ukrainian studio developed 'S.T.A.L.K.E.R.: Shadow of Chernobyl'?", ["Frogwares", "Vostok Games", "4A Games", "GSC Game World"], "GSC Game World", 3),
		// https://en.wikipedia.org/wiki/RuneScape
		q("Which British company developed the online game 'RuneScape'?", ["Jagex", "Codemasters", "Frontier", "Rare"], "Jagex", 2),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/A_Beautiful_Mind_(film)
		q("Who directed the film 'A Beautiful Mind' (2001)?", ["Sam Mendes", "Barry Levinson", "Ron Howard", "Rob Reiner"], "Ron Howard", 2),
		// https://en.wikipedia.org/wiki/300_(film)
		q("Who directed the film '300' (2006)?", ["Ridley Scott", "Wolfgang Petersen", "Zack Snyder", "Oliver Stone"], "Zack Snyder", 2),
		// https://en.wikipedia.org/wiki/Skyfall
		q("Who directed the James Bond film 'Skyfall' (2012)?", ["Martin Campbell", "Cary Joji Fukunaga", "Sam Mendes", "Marc Forster"], "Sam Mendes", 2),
		// https://en.wikipedia.org/wiki/Joker_(2019_film)
		q("Who directed the film 'Joker' (2019)?", ["Christopher Nolan", "Zack Snyder", "Matt Reeves", "Todd Phillips"], "Todd Phillips", 2),
		// https://en.wikipedia.org/wiki/Spider-Man:_Homecoming
		q("Who directed 'Spider-Man: Homecoming' (2017)?", ["Jon Watts", "Sam Raimi", "Taika Waititi", "Marc Webb"], "Jon Watts", 2),
		// https://en.wikipedia.org/wiki/Iron_Man_2
		q("Who directed the film 'Iron Man 2' (2010)?", ["Jon Favreau", "Louis Leterrier", "Joss Whedon", "Shane Black"], "Jon Favreau", 1),
		// https://en.wikipedia.org/wiki/Léon:_The_Professional
		q("Who directed 'Léon: The Professional' (1994)?", ["Michael Mann", "Luc Besson", "John Woo", "Jean-Pierre Jeunet"], "Luc Besson", 2),
		// https://en.wikipedia.org/wiki/Rocky
		q("Who directed the original 'Rocky' (1976)?", ["John G. Avildsen", "Martin Scorsese", "Sylvester Stallone", "Hal Ashby"], "John G. Avildsen", 2),
		// https://en.wikipedia.org/wiki/Green_Book_(film)
		q("Who directed the film 'Green Book' (2018)?", ["Tom McCarthy", "Peter Farrelly", "Adam McKay", "Bobby Farrelly"], "Peter Farrelly", 2),
		// https://en.wikipedia.org/wiki/Spider-Man_2
		q("Who directed the film 'Spider-Man 2' (2004)?", ["Marc Webb", "Bryan Singer", "Sam Raimi", "Jon Watts"], "Sam Raimi", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Kill_'Em_All
		q("'Kill 'Em All' (1983) was the debut album of which band?", ["Slayer", "Anthrax", "Megadeth", "Metallica"], "Metallica", 2),
		// https://en.wikipedia.org/wiki/Hard_Candy_(Madonna_album)
		q("'Hard Candy' (2008) is an album by which singer?", ["Britney Spears", "Madonna", "Kylie Minogue", "Gwen Stefani"], "Madonna", 2),
		// https://en.wikipedia.org/wiki/Femme_Fatale_(Britney_Spears_album)
		q("'Femme Fatale' (2011) is an album by which singer?", ["Lady Gaga", "Britney Spears", "Kesha", "Christina Aguilera"], "Britney Spears", 2),
		// https://en.wikipedia.org/wiki/A_Thousand_Suns
		q("'A Thousand Suns' (2010) is an album by which band?", ["Thirty Seconds to Mars", "Evanescence", "Muse", "Linkin Park"], "Linkin Park", 2),
		// https://en.wikipedia.org/wiki/The_Piper_at_the_Gates_of_Dawn
		q("'The Piper at the Gates of Dawn' (1967) was the debut album of which band?", ["The Moody Blues", "Procol Harum", "Pink Floyd", "The Zombies"], "Pink Floyd", 2),
		// https://en.wikipedia.org/wiki/Teenage_Dream_(Katy_Perry_album)
		q("'Teenage Dream' (2010) is an album by which singer?", ["Taylor Swift", "Selena Gomez", "Kesha", "Katy Perry"], "Katy Perry", 1),
		// https://en.wikipedia.org/wiki/Strange_Days_(The_Doors_album)
		q("'Strange Days' (1967) is the second album by which band?", ["Love", "Jefferson Airplane", "The Doors", "The Byrds"], "The Doors", 2),
		// https://en.wikipedia.org/wiki/Physical_Graffiti
		q("'Physical Graffiti' (1975) is a double album by which band?", ["Led Zeppelin", "Black Sabbath", "The Who", "Deep Purple"], "Led Zeppelin", 2),
		// https://en.wikipedia.org/wiki/21st_Century_Breakdown
		q("'21st Century Breakdown' (2009) is an album by which band?", ["Green Day", "Fall Out Boy", "Blink-182", "The Offspring"], "Green Day", 2),
		// https://en.wikipedia.org/wiki/Californication_(album)
		q("'Californication' (1999) is an album by which band?", ["Pearl Jam", "Stone Temple Pilots", "Foo Fighters", "Red Hot Chili Peppers"], "Red Hot Chili Peppers", 1),
		// https://en.wikipedia.org/wiki/Fever_(Kylie_Minogue_album)
		q("'Fever' (2001), featuring 'Can't Get You Out of My Head,' is an album by which singer?", ["Nelly Furtado", "Sophie Ellis-Bextor", "Dido", "Kylie Minogue"], "Kylie Minogue", 2),
		// https://en.wikipedia.org/wiki/Goodbye_Lullaby
		q("'Goodbye Lullaby' (2011) is an album by which singer?", ["Kelly Clarkson", "Pink", "Hilary Duff", "Avril Lavigne"], "Avril Lavigne", 2),
		// https://en.wikipedia.org/wiki/Loud_(Rihanna_album)
		q("'Loud' (2010) is an album by which singer?", ["Beyoncé", "Ciara", "Nicki Minaj", "Rihanna"], "Rihanna", 1),
		// https://en.wikipedia.org/wiki/The_Number_of_the_Beast_(album)
		q("'The Number of the Beast' (1982) is an album by which band?", ["Iron Maiden", "Saxon", "Black Sabbath", "Judas Priest"], "Iron Maiden", 2),
		// https://en.wikipedia.org/wiki/X&Y
		q("'X&Y' (2005) is an album by which band?", ["Travis", "Coldplay", "Keane", "Snow Patrol"], "Coldplay", 1),
		// https://en.wikipedia.org/wiki/Herzeleid
		q("'Herzeleid' (1995) was the debut album of which German band?", ["Rammstein", "Kraftwerk", "Scorpions", "Tokio Hotel"], "Rammstein", 2),
		// https://en.wikipedia.org/wiki/Up_All_Night_(One_Direction_album)
		q("'Up All Night' (2011) was the debut album of which boy band?", ["The Wanted", "5 Seconds of Summer", "One Direction", "Jonas Brothers"], "One Direction", 1),
		// https://en.wikipedia.org/wiki/Boy_(album)
		q("'Boy' (1980) was the debut album of which band?", ["U2", "Simple Minds", "Echo & the Bunnymen", "The Cure"], "U2", 2),
		// https://en.wikipedia.org/wiki/Relapse_(album)
		q("'Relapse' (2009) is an album by which rapper?", ["Lil Wayne", "Eminem", "Kanye West", "50 Cent"], "Eminem", 1),
		// https://en.wikipedia.org/wiki/Sweetener_(album)
		q("'Sweetener' (2018) is an album by which singer?", ["Camila Cabello", "Halsey", "Dua Lipa", "Ariana Grande"], "Ariana Grande", 1),
		// https://en.wikipedia.org/wiki/Yo-Yo_Ma
		q("Which instrument is Yo-Yo Ma famous for playing?", ["viola", "cello", "violin", "double bass"], "cello", 1),
		// https://en.wikipedia.org/wiki/Ringo_Starr
		q("Ringo Starr was the drummer for which band?", ["The Beatles", "The Kinks", "The Rolling Stones", "The Who"], "The Beatles", 1),
		// https://en.wikipedia.org/wiki/Keith_Moon
		q("Which band's drummer was Keith Moon?", ["Led Zeppelin", "Cream", "The Who", "The Kinks"], "The Who", 2),
		// https://en.wikipedia.org/wiki/John_Bonham
		q("Which band's drummer was John Bonham?", ["Deep Purple", "Led Zeppelin", "Black Sabbath", "The Who"], "Led Zeppelin", 1),
		// https://en.wikipedia.org/wiki/Freddie_Mercury
		q("Who was the lead singer of Queen?", ["Brian May", "Freddie Mercury", "Roger Taylor", "John Deacon"], "Freddie Mercury", 1),
		// https://en.wikipedia.org/wiki/Kurt_Cobain
		q("Who was the lead singer of Nirvana?", ["Eddie Vedder", "Chris Cornell", "Dave Grohl", "Kurt Cobain"], "Kurt Cobain", 1),
		// https://en.wikipedia.org/wiki/Bono
		q("Who is the lead singer of U2?", ["Larry Mullen Jr.", "Bono", "The Edge", "Adam Clayton"], "Bono", 1),
		// https://en.wikipedia.org/wiki/Chris_Martin
		q("Who is the lead singer of Coldplay?", ["Chris Martin", "Brandon Flowers", "Gary Lightbody", "Thom Yorke"], "Chris Martin", 1),
		// https://en.wikipedia.org/wiki/Jim_Morrison
		q("Who was the lead singer of the Doors?", ["Robby Krieger", "Ray Manzarek", "John Densmore", "Jim Morrison"], "Jim Morrison", 2),
		// https://en.wikipedia.org/wiki/Steven_Tyler
		q("Who is the lead singer of Aerosmith?", ["David Lee Roth", "Joe Perry", "Axl Rose", "Steven Tyler"], "Steven Tyler", 1),
		// https://en.wikipedia.org/wiki/Axl_Rose
		q("Who is the lead singer of Guns N' Roses?", ["Axl Rose", "Duff McKagan", "Slash", "Izzy Stradlin"], "Axl Rose", 2),
		// https://en.wikipedia.org/wiki/Eddie_Vedder
		q("Who is the lead singer of Pearl Jam?", ["Eddie Vedder", "Layne Staley", "Chris Cornell", "Scott Weiland"], "Eddie Vedder", 2),
		// https://en.wikipedia.org/wiki/Thom_Yorke
		q("Who is the lead singer of Radiohead?", ["Thom Yorke", "Matt Bellamy", "Chris Martin", "Jonny Greenwood"], "Thom Yorke", 2),
		// https://en.wikipedia.org/wiki/Matt_Bellamy
		q("Who is the lead singer of Muse?", ["Matt Bellamy", "Thom Yorke", "Chris Martin", "Brandon Flowers"], "Matt Bellamy", 2),
		// https://en.wikipedia.org/wiki/Brandon_Flowers
		q("Who is the lead singer of the Killers?", ["Brandon Flowers", "Alex Turner", "Julian Casablancas", "Matt Bellamy"], "Brandon Flowers", 2),
		// https://en.wikipedia.org/wiki/Alex_Turner
		q("Who is the lead singer of Arctic Monkeys?", ["Matt Helders", "Alex Turner", "Liam Gallagher", "Julian Casablancas"], "Alex Turner", 2),
		// https://en.wikipedia.org/wiki/Oasis_(band)
		q("Which brothers led the band Oasis?", ["Ray and Dave Davies", "Chris and Rich Robinson", "Angus and Malcolm Young", "Liam and Noel Gallagher"], "Liam and Noel Gallagher", 1),
		// https://en.wikipedia.org/wiki/AC/DC
		q("Which brothers founded AC/DC?", ["Ray and Dave Davies", "Eddie and Alex Van Halen", "Liam and Noel Gallagher", "Malcolm and Angus Young"], "Malcolm and Angus Young", 2),
		// https://en.wikipedia.org/wiki/The_Police
		q("Who was the lead singer of the Police?", ["Sting", "Andy Summers", "Bono", "Stewart Copeland"], "Sting", 1),
		// https://en.wikipedia.org/wiki/Sting_(musician)
		q("What is Sting's real name?", ["Gordon Sumner", "Reginald Dwight", "David Evans", "Paul Hewson"], "Gordon Sumner", 2),
		// https://en.wikipedia.org/wiki/Bono
		q("What is Bono's real name?", ["Adam Clayton", "Paul Hewson", "David Evans", "Gordon Sumner"], "Paul Hewson", 2),
		// https://en.wikipedia.org/wiki/David_Bowie
		q("What was David Bowie's birth name?", ["Gordon Sumner", "David Jones", "Reginald Dwight", "David Bowman"], "David Jones", 2),
		// https://en.wikipedia.org/wiki/Bruno_Mars
		q("What is Bruno Mars's birth name?", ["Peter Gene Mars", "Peter Hernandez", "Bruno Hernandez", "Brian Martinez"], "Peter Hernandez", 2),
		// https://en.wikipedia.org/wiki/Rihanna
		q("What is Rihanna's surname?", ["Fenty", "Carey", "Germanotta", "Knowles"], "Fenty", 2),
		// https://en.wikipedia.org/wiki/Frank_Sinatra
		q("Which singer was known as 'Ol' Blue Eyes'?", ["Dean Martin", "Frank Sinatra", "Tony Bennett", "Bing Crosby"], "Frank Sinatra", 2),
		// https://en.wikipedia.org/wiki/Billie_Holiday
		q("Which singer was nicknamed 'Lady Day'?", ["Sarah Vaughan", "Billie Holiday", "Nina Simone", "Ella Fitzgerald"], "Billie Holiday", 2),
		// https://en.wikipedia.org/wiki/Pet_Sounds
		q("Which Beach Boys album includes 'God Only Knows'?", ["Smiley Smile", "Pet Sounds", "Sunflower", "Surfin' Safari"], "Pet Sounds", 2),
		// https://en.wikipedia.org/wiki/Für_Elise
		q("Which composer wrote 'Für Elise'?", ["Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Franz Schubert", "Robert Schumann"], "Ludwig van Beethoven", 1),
		// https://en.wikipedia.org/wiki/Pomp_and_Circumstance_Marches
		q("Which composer wrote 'Pomp and Circumstance Marches'?", ["Edward Elgar", "Gustav Holst", "Arthur Sullivan", "Henry Purcell"], "Edward Elgar", 2),
		// https://en.wikipedia.org/wiki/Ludwig_van_Beethoven
		q("How many symphonies did Beethoven complete?", ["five", "nine", "seven", "eleven"], "nine", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/Kalevala
		q("Who compiled Finland's national epic 'Kalevala'?", ["Johan Runeberg", "Aleksis Kivi", "Elias Lönnrot", "Jean Sibelius"], "Elias Lönnrot", 3),
		// https://en.wikipedia.org/wiki/The_Diary_of_a_Young_Girl
		q("Who wrote 'The Diary of a Young Girl,' published in 1947?", ["Elie Wiesel", "Corrie ten Boom", "Anne Frank", "Etty Hillesum"], "Anne Frank", 2),
		// https://en.wikipedia.org/wiki/Journey_to_the_West
		q("Which author is traditionally credited with the Chinese classic 'Journey to the West'?", ["Luo Guanzhong", "Wu Cheng'en", "Shi Nai'an", "Cao Xueqin"], "Wu Cheng'en", 3),
		// https://en.wikipedia.org/wiki/Eugene_Onegin
		q("Who wrote the verse novel 'Eugene Onegin'?", ["Mikhail Lermontov", "Nikolai Gogol", "Ivan Turgenev", "Alexander Pushkin"], "Alexander Pushkin", 2),
		// https://en.wikipedia.org/wiki/Journey_to_the_Centre_of_the_Earth
		q("Which author wrote 'Journey to the Centre of the Earth'?", ["Jules Verne", "Edgar Rice Burroughs", "H. G. Wells", "Arthur Conan Doyle"], "Jules Verne", 2),
		// https://en.wikipedia.org/wiki/Angels_&_Demons
		q("'Angels & Demons' (2000) is a book by which author?", ["Michael Crichton", "James Patterson", "John Grisham", "Dan Brown"], "Dan Brown", 1),
		// https://en.wikipedia.org/wiki/The_Hound_of_the_Baskervilles
		q("'The Hound of the Baskervilles' is a book by which author?", ["G. K. Chesterton", "Arthur Conan Doyle", "Wilkie Collins", "Agatha Christie"], "Arthur Conan Doyle", 1),
		// https://en.wikipedia.org/wiki/Through_the_Looking-Glass
		q("Which author wrote 'Through the Looking-Glass'?", ["J. M. Barrie", "Lewis Carroll", "Edward Lear", "George MacDonald"], "Lewis Carroll", 1),
		// https://en.wikipedia.org/wiki/Siddhartha_(novel)
		q("Which author wrote 'Siddhartha' (1922)?", ["Thomas Mann", "Franz Kafka", "Hermann Hesse", "Stefan Zweig"], "Hermann Hesse", 2),
		// https://en.wikipedia.org/wiki/A_Brief_History_of_Time
		q("'A Brief History of Time' (1988) is a book by which scientist?", ["Brian Greene", "Carl Sagan", "Richard Dawkins", "Stephen Hawking"], "Stephen Hawking", 1),
		// https://en.wikipedia.org/wiki/The_Two_Towers
		q("'The Two Towers' is the second volume of which author's trilogy?", ["C. S. Lewis", "J. R. R. Tolkien", "Terry Brooks", "George R. R. Martin"], "J. R. R. Tolkien", 1),
		// https://en.wikipedia.org/wiki/The_Good_Soldier_Švejk
		q("Which author wrote 'The Good Soldier Švejk'?", ["Franz Kafka", "Jaroslav Hašek", "Karel Čapek", "Milan Kundera"], "Jaroslav Hašek", 3),
		// https://en.wikipedia.org/wiki/Love_in_the_Time_of_Cholera
		q("Which author wrote 'Love in the Time of Cholera'?", ["Jorge Luis Borges", "Isabel Allende", "Gabriel García Márquez", "Mario Vargas Llosa"], "Gabriel García Márquez", 2),
		// https://en.wikipedia.org/wiki/And_Then_There_Were_None
		q("Which author wrote 'And Then There Were None' (1939)?", ["Dorothy L. Sayers", "Ngaio Marsh", "Daphne du Maurier", "Agatha Christie"], "Agatha Christie", 1),
		// https://en.wikipedia.org/wiki/Sophie's_World
		q("Which author wrote 'Sophie's World' (1991)?", ["Jostein Gaarder", "Jostein Moe", "Knut Hamsun", "Henrik Ibsen"], "Jostein Gaarder", 2),
		// https://en.wikipedia.org/wiki/A_Clockwork_Orange_(novel)
		q("'A Clockwork Orange' (1962) is a book by which author?", ["Evelyn Waugh", "Kingsley Amis", "Anthony Burgess", "Aldous Huxley"], "Anthony Burgess", 2),
		// https://en.wikipedia.org/wiki/The_Red_and_the_Black
		q("Which French author wrote 'The Red and the Black' (1830)?", ["Honoré de Balzac", "Gustave Flaubert", "Stendhal", "Émile Zola"], "Stendhal", 2),
		// https://en.wikipedia.org/wiki/Les_Fleurs_du_mal
		q("Which poet wrote the collection 'Les Fleurs du mal' (1857)?", ["Victor Hugo", "Charles Baudelaire", "Arthur Rimbaud", "Paul Verlaine"], "Charles Baudelaire", 2),
		// https://en.wikipedia.org/wiki/Ivanhoe
		q("Which author wrote 'Ivanhoe' (1819)?", ["Charles Dickens", "Robert Louis Stevenson", "Walter Scott", "Thomas Hardy"], "Walter Scott", 2),
		// https://en.wikipedia.org/wiki/New_Moon_(novel)
		q("'New Moon' (2006) is the second book in which author's vampire saga?", ["Stephenie Meyer", "Charlaine Harris", "Richelle Mead", "Anne Rice"], "Stephenie Meyer", 1),
		// https://en.wikipedia.org/wiki/Bluebeard
		q("Which French author first published 'Bluebeard' in 1697?", ["Jean de La Fontaine", "Charles Perrault", "Madame d'Aulnoy", "Brothers Grimm"], "Charles Perrault", 2),
		// https://en.wikipedia.org/wiki/Martin_Eden
		q("Which author wrote 'Martin Eden' (1909)?", ["Theodore Dreiser", "Frank Norris", "Jack London", "Upton Sinclair"], "Jack London", 2),
		// https://en.wikipedia.org/wiki/Buddenbrooks
		q("Which author wrote 'Buddenbrooks' (1901)?", ["Hermann Hesse", "Thomas Mann", "Theodor Fontane", "Günter Grass"], "Thomas Mann", 2),
		// https://en.wikipedia.org/wiki/The_Government_Inspector
		q("Which author wrote the play 'The Government Inspector'?", ["Anton Chekhov", "Nikolai Gogol", "Leo Tolstoy", "Ivan Turgenev"], "Nikolai Gogol", 2),
		// https://en.wikipedia.org/wiki/Atlas_Shrugged
		q("'Atlas Shrugged' (1957) is a book by which author?", ["Pearl S. Buck", "Mary McCarthy", "Ayn Rand", "Harper Lee"], "Ayn Rand", 2),
		// https://en.wikipedia.org/wiki/The_Lady_of_the_Camellias
		q("Which author wrote 'The Lady of the Camellias' (1848)?", ["Prosper Mérimée", "Victor Hugo", "George Sand", "Alexandre Dumas fils"], "Alexandre Dumas fils", 3),
		// https://en.wikipedia.org/wiki/Norwegian_Wood_(novel)
		q("Which author wrote 'Norwegian Wood' (1987)?", ["Kazuo Ishiguro", "Yukio Mishima", "Haruki Murakami", "Banana Yoshimoto"], "Haruki Murakami", 2),
		// https://en.wikipedia.org/wiki/The_Pilgrim's_Progress
		q("Which author wrote 'The Pilgrim's Progress' (1678)?", ["John Milton", "Daniel Defoe", "Jonathan Swift", "John Bunyan"], "John Bunyan", 2),
		// https://en.wikipedia.org/wiki/Jonathan_Livingston_Seagull
		q("'Jonathan Livingston Seagull' (1970) is a book by which author?", ["Paulo Coelho", "Richard Adams", "Kahlil Gibran", "Richard Bach"], "Richard Bach", 2),
		// https://en.wikipedia.org/wiki/A_Thousand_Splendid_Suns
		q("Which author wrote 'A Thousand Splendid Suns' (2007)?", ["Salman Rushdie", "Mohsin Hamid", "Khaled Hosseini", "Rohinton Mistry"], "Khaled Hosseini", 2),
		// https://en.wikipedia.org/wiki/A_Clash_of_Kings
		q("'A Clash of Kings' (1998) is the second book in which author's fantasy series?", ["Patrick Rothfuss", "George R. R. Martin", "Brandon Sanderson", "Robert Jordan"], "George R. R. Martin", 1),
		// https://en.wikipedia.org/wiki/I,_Robot
		q("'I, Robot' (1950) is a story collection by which author?", ["Robert A. Heinlein", "Ray Bradbury", "Isaac Asimov", "Arthur C. Clarke"], "Isaac Asimov", 2),
		// https://en.wikipedia.org/wiki/We_(novel)
		q("Which Russian author wrote the dystopian novel 'We' (1924)?", ["Yevgeny Zamyatin", "Mikhail Bulgakov", "Boris Pasternak", "Maxim Gorky"], "Yevgeny Zamyatin", 3),
		// https://en.wikipedia.org/wiki/Heart_of_a_Dog
		q("Which author wrote 'Heart of a Dog'?", ["Isaac Babel", "Anton Chekhov", "Mikhail Bulgakov", "Yevgeny Zamyatin"], "Mikhail Bulgakov", 3),
		// https://en.wikipedia.org/wiki/The_Invisible_Man
		q("'The Invisible Man' (1897) is a novel by which author?", ["H. G. Wells", "Bram Stoker", "Arthur Conan Doyle", "Jules Verne"], "H. G. Wells", 2),
		// https://en.wikipedia.org/wiki/Catching_Fire
		q("'Catching Fire' (2009) is the second book in which author's trilogy?", ["Veronica Roth", "James Dashner", "Lois Lowry", "Suzanne Collins"], "Suzanne Collins", 1),
		// https://en.wikipedia.org/wiki/The_Prince_and_the_Pauper
		q("'The Prince and the Pauper' (1881) is a novel by which author?", ["Robert Louis Stevenson", "Bret Harte", "Charles Dickens", "Mark Twain"], "Mark Twain", 1),
		// https://en.wikipedia.org/wiki/And_Quiet_Flows_the_Don
		q("Which author wrote 'And Quiet Flows the Don'?", ["Mikhail Sholokhov", "Boris Pasternak", "Maxim Gorky", "Vasily Grossman"], "Mikhail Sholokhov", 3),
		// https://en.wikipedia.org/wiki/The_Lightning_Thief
		q("'The Lightning Thief' (2005) is the first book in which author's series?", ["Jonathan Stroud", "Rick Riordan", "Christopher Paolini", "Eoin Colfer"], "Rick Riordan", 1),
		// https://en.wikipedia.org/wiki/The_Pickwick_Papers
		q("Which author wrote 'The Pickwick Papers' (1836)?", ["Wilkie Collins", "Anthony Trollope", "Charles Dickens", "William Makepeace Thackeray"], "Charles Dickens", 2),
		// https://en.wikipedia.org/wiki/My_Name_Is_Red
		q("Which Turkish author wrote 'My Name Is Red' (1998)?", ["Nazım Hikmet", "Elif Shafak", "Yaşar Kemal", "Orhan Pamuk"], "Orhan Pamuk", 2),
		// https://en.wikipedia.org/wiki/Flowers_for_Algernon
		q("'Flowers for Algernon' (1959) is a story by which author?", ["Kurt Vonnegut", "Daniel Keyes", "Walter M. Miller Jr.", "Ray Bradbury"], "Daniel Keyes", 2),
		// https://en.wikipedia.org/wiki/King_Solomon's_Mines
		q("'King Solomon's Mines' (1885) is a novel by which author?", ["H. Rider Haggard", "Robert Louis Stevenson", "Rudyard Kipling", "Arthur Conan Doyle"], "H. Rider Haggard", 2),
		// https://en.wikipedia.org/wiki/The_Death_of_Ivan_Ilyich
		q("Which author wrote 'The Death of Ivan Ilyich' (1886)?", ["Anton Chekhov", "Leo Tolstoy", "Ivan Turgenev", "Fyodor Dostoevsky"], "Leo Tolstoy", 2),
		// https://en.wikipedia.org/wiki/Homage_to_Catalonia
		q("'Homage to Catalonia' (1938) is a memoir by which author?", ["Ernest Hemingway", "Arthur Koestler", "John Dos Passos", "George Orwell"], "George Orwell", 2),
		// https://en.wikipedia.org/wiki/Lord_Jim
		q("Which author wrote 'Lord Jim' (1900)?", ["E. M. Forster", "Robert Louis Stevenson", "Joseph Conrad", "Rudyard Kipling"], "Joseph Conrad", 2),
		// https://en.wikipedia.org/wiki/Ronja,_the_Robber's_Daughter
		q("Which author wrote 'Ronia, the Robber's Daughter'?", ["Astrid Lindgren", "Tove Jansson", "Maria Gripe", "Selma Lagerlöf"], "Astrid Lindgren", 2),
		// https://en.wikipedia.org/wiki/Starship_Troopers
		q("'Starship Troopers' (1959) is a novel by which author?", ["Joe Haldeman", "Frank Herbert", "Robert A. Heinlein", "Isaac Asimov"], "Robert A. Heinlein", 2),
		// https://en.wikipedia.org/wiki/Cat_on_a_Hot_Tin_Roof
		q("'Cat on a Hot Tin Roof' (1955) is a play by which author?", ["Eugene O'Neill", "William Inge", "Tennessee Williams", "Arthur Miller"], "Tennessee Williams", 2),
		// https://en.wikipedia.org/wiki/The_Rime_of_the_Ancient_Mariner
		q("Which poet wrote 'The Rime of the Ancient Mariner'?", ["Percy Bysshe Shelley", "Lord Byron", "Samuel Taylor Coleridge", "William Wordsworth"], "Samuel Taylor Coleridge", 2),
		// https://en.wikipedia.org/wiki/Les_Liaisons_dangereuses
		q("'Les Liaisons dangereuses' (1782) is a novel by which author?", ["Pierre Choderlos de Laclos", "Denis Diderot", "Jean-Jacques Rousseau", "Marquis de Sade"], "Pierre Choderlos de Laclos", 3),
		// https://en.wikipedia.org/wiki/The_Prophet_(book)
		q("Which author wrote 'The Prophet' (1923)?", ["Khalil Mutran", "Rumi", "Rabindranath Tagore", "Kahlil Gibran"], "Kahlil Gibran", 2),
		// https://en.wikipedia.org/wiki/Planet_of_the_Apes_(novel)
		q("'Planet of the Apes' (1963) is a novel by which author?", ["Jules Verne", "Michael Crichton", "René Barjavel", "Pierre Boulle"], "Pierre Boulle", 2),
		// https://en.wikipedia.org/wiki/Go,_Dog._Go!
		q("'Go, Dog. Go!' (1961) is a book by which author?", ["P. D. Eastman", "Richard Scarry", "Dr. Seuss", "Syd Hoff"], "P. D. Eastman", 2),
		// https://en.wikipedia.org/wiki/Der_Struwwelpeter
		q("'Struwwelpeter' (1845) is a book by which German author?", ["Brothers Grimm", "Erich Kästner", "Heinrich Hoffmann", "Wilhelm Busch"], "Heinrich Hoffmann", 3),
		// https://en.wikipedia.org/wiki/Ben-Hur:_A_Tale_of_the_Christ
		q("'Ben-Hur: A Tale of the Christ' (1880) is a novel by which author?", ["Lew Wallace", "Lloyd C. Douglas", "Henryk Sienkiewicz", "Upton Sinclair"], "Lew Wallace", 2),
		// https://en.wikipedia.org/wiki/Goldilocks_and_the_Three_Bears
		q("Which poet first published 'The Story of the Three Bears' in 1837?", ["William Wordsworth", "John Keats", "Robert Southey", "Samuel Taylor Coleridge"], "Robert Southey", 3),
		// https://en.wikipedia.org/wiki/Pan_Tadeusz
		q("Which Polish poet wrote the epic 'Pan Tadeusz'?", ["Czesław Miłosz", "Henryk Sienkiewicz", "Juliusz Słowacki", "Adam Mickiewicz"], "Adam Mickiewicz", 3),
		// https://en.wikipedia.org/wiki/Mother_Courage_and_Her_Children
		q("'Mother Courage and Her Children' is a play by which author?", ["Max Frisch", "Henrik Ibsen", "Friedrich Dürrenmatt", "Bertolt Brecht"], "Bertolt Brecht", 2),
		// https://en.wikipedia.org/wiki/American_Psycho
		q("'American Psycho' (1991) is a novel by which author?", ["Jay McInerney", "Don DeLillo", "Bret Easton Ellis", "Chuck Palahniuk"], "Bret Easton Ellis", 2),
		// https://en.wikipedia.org/wiki/Flatland
		q("'Flatland' (1884) is a novella by which author?", ["Charles Hinton", "Edwin Abbott Abbott", "Lewis Carroll", "H. G. Wells"], "Edwin Abbott Abbott", 3),
		// https://en.wikipedia.org/wiki/Oblomov
		q("Which author wrote 'Oblomov' (1859)?", ["Leo Tolstoy", "Ivan Turgenev", "Nikolai Gogol", "Ivan Goncharov"], "Ivan Goncharov", 3),
		// https://en.wikipedia.org/wiki/Rip_Van_Winkle
		q("'Rip Van Winkle' (1819) is a short story by which author?", ["Nathaniel Hawthorne", "Edgar Allan Poe", "James Fenimore Cooper", "Washington Irving"], "Washington Irving", 2),
		// https://en.wikipedia.org/wiki/The_History_of_Tom_Jones,_a_Foundling
		q("Which author wrote 'The History of Tom Jones, a Foundling'?", ["Tobias Smollett", "Henry Fielding", "Samuel Richardson", "Laurence Sterne"], "Henry Fielding", 3),
		// https://en.wikipedia.org/wiki/The_Thorn_Birds
		q("'The Thorn Birds' (1977) is a novel by which author?", ["Barbara Taylor Bradford", "Colleen McCullough", "Maeve Binchy", "Rosamunde Pilcher"], "Colleen McCullough", 2),
		// https://en.wikipedia.org/wiki/The_Three-Body_Problem_(novel)
		q("Which author wrote 'The Three-Body Problem'?", ["Ken Liu", "Liu Cixin", "Yu Hua", "Mo Yan"], "Liu Cixin", 2),
		// https://en.wikipedia.org/wiki/I_Am_Legend_(novel)
		q("'I Am Legend' (1954) is a novel by which author?", ["Ray Bradbury", "Richard Matheson", "Stephen King", "Robert Bloch"], "Richard Matheson", 2),
		// https://en.wikipedia.org/wiki/Salammbô
		q("Which author wrote 'Salammbô,' set in ancient Carthage?", ["Émile Zola", "Victor Hugo", "Anatole France", "Gustave Flaubert"], "Gustave Flaubert", 2),
	],
};
