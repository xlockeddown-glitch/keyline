import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Monday Nov 9, 2026 trivia batch 2, sub-batch d: easy evergreen food, nature, history, science and arts cards
 * to lift the deck's easy share and thin topics. Every card was checked against the Wikipedia page above it.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography";

export const PLUS_20261109D: Partial<Record<PlusCat, TriviaQ[]>> = {
	food: [
		// https://en.wikipedia.org/wiki/Prune
		q("Which fruit is dried to make a prune?", ["grape", "plum", "fig", "apricot"], "plum", 1),
		// https://en.wikipedia.org/wiki/Raisin
		q("Which fruit is dried to make a raisin?", ["cherry", "cranberry", "plum", "grape"], "grape", 1),
		// https://en.wikipedia.org/wiki/Pickled_cucumber
		q("Which vegetable is pickled to make a classic dill pickle?", ["zucchini", "okra", "green bean", "cucumber"], "cucumber", 1),
		// https://en.wikipedia.org/wiki/Popcorn
		q("Which grain is popcorn made from?", ["barley", "wheat", "rice", "maize"], "maize", 1),
		// https://en.wikipedia.org/wiki/Peanut_butter_and_jelly_sandwich
		q("Which nut is used to make the spread in a PB&J sandwich?", ["peanut", "almond", "cashew", "walnut"], "peanut", 1),
		// https://en.wikipedia.org/wiki/Venison
		q("Which animal does venison come from?", ["rabbit", "deer", "sheep", "goat"], "deer", 1),
		// https://en.wikipedia.org/wiki/Veal
		q("Which animal does veal come from?", ["kid goat", "lamb", "piglet", "calf"], "calf", 1),
		// https://en.wikipedia.org/wiki/Lamb_and_mutton
		q("Mutton is meat from an adult what?", ["goat", "pig", "cow", "sheep"], "sheep", 1),
		// https://en.wikipedia.org/wiki/Cider
		q("Which drink is made by fermenting apple juice?", ["wine", "perry", "mead", "cider"], "cider", 1),
		// https://en.wikipedia.org/wiki/Perry
		q("Perry is an alcoholic drink made from which fruit?", ["pear", "apple", "cherry", "plum"], "pear", 2),
		// https://en.wikipedia.org/wiki/Beer
		q("Which grain is the base of most beer?", ["corn", "barley", "rice", "oats"], "barley", 1),
		// https://en.wikipedia.org/wiki/Tequila
		q("Which spirit is distilled from the agave plant?", ["vodka", "tequila", "gin", "rum"], "tequila", 1),
		// https://en.wikipedia.org/wiki/Gin
		q("Which spirit is flavored mainly with juniper berries?", ["rum", "gin", "vodka", "brandy"], "gin", 1),
		// https://en.wikipedia.org/wiki/Rum
		q("Which spirit is made from sugarcane or molasses?", ["tequila", "whisky", "rum", "gin"], "rum", 1),
		// https://en.wikipedia.org/wiki/Brandy
		q("Brandy is distilled from which drink?", ["beer", "cider", "sake", "wine"], "wine", 1),
		// https://en.wikipedia.org/wiki/Guacamole
		q("What gives guacamole its green color?", ["green chili", "cilantro", "lime", "avocado"], "avocado", 1),
		// https://en.wikipedia.org/wiki/Lasagna
		q("Which Italian dish is made of layered pasta sheets, sauce and cheese?", ["gnocchi", "ravioli", "lasagna", "risotto"], "lasagna", 1),
		// https://en.wikipedia.org/wiki/Gnocchi
		q("Which Italian dumplings are usually made from potato?", ["ravioli", "tortellini", "gnocchi", "orzo"], "gnocchi", 1),
		// https://en.wikipedia.org/wiki/Risotto
		q("Which Italian rice dish is stirred slowly with broth?", ["risotto", "paella", "pilaf", "arancini"], "risotto", 1),
		// https://en.wikipedia.org/wiki/Tempura
		q("Which Japanese dish is battered and deep-fried seafood or vegetables?", ["ramen", "udon", "tempura", "sushi"], "tempura", 1),
		// https://en.wikipedia.org/wiki/Udon
		q("Which thick Japanese noodles are made from wheat flour?", ["ramen", "udon", "soba", "glass noodles"], "udon", 1),
		// https://en.wikipedia.org/wiki/Quesadilla
		q("Which Mexican dish is a folded tortilla filled with cheese and grilled?", ["tostada", "quesadilla", "enchilada", "tamale"], "quesadilla", 1),
		// https://en.wikipedia.org/wiki/Tamale
		q("Tamales are cooked wrapped in what?", ["corn husks", "banana leaves", "grape leaves", "rice paper"], "corn husks", 1),
		// https://en.wikipedia.org/wiki/Dolma
		q("Which Greek dish wraps rice in grape leaves?", ["moussaka", "dolma", "souvlaki", "spanakopita"], "dolma", 1),
		// https://en.wikipedia.org/wiki/Spanakopita
		q("Spanakopita is a Greek pie filled with spinach and which cheese?", ["ricotta", "mozzarella", "feta", "halloumi"], "feta", 1),
		// https://en.wikipedia.org/wiki/Halloumi
		q("Which cheese is traditionally grilled or fried in Cyprus?", ["halloumi", "gouda", "feta", "brie"], "halloumi", 1),
		// https://en.wikipedia.org/wiki/Biryani
		q("Which Indian dish is made of spiced rice layered with meat?", ["dal", "biryani", "samosa", "korma"], "biryani", 1),
		// https://en.wikipedia.org/wiki/Dal
		q("Dal is an Indian dish made mainly from what?", ["potatoes", "lentils", "chickpea flour", "rice"], "lentils", 1),
		// https://en.wikipedia.org/wiki/Samosa
		q("Which fried pastry from India is usually triangle-shaped and stuffed with potatoes?", ["bhaji", "samosa", "dosa", "pakora"], "samosa", 1),
		// https://en.wikipedia.org/wiki/Peking_duck
		q("Which Chinese dish is a thin pancake wrapped around roast duck?", ["kung pao chicken", "Peking duck", "chow mein", "dim sum"], "Peking duck", 1),
		// https://en.wikipedia.org/wiki/Mooncake
		q("Mooncakes are traditionally eaten at which Chinese festival?", ["Lunar New Year", "Dragon Boat Festival", "Mid-Autumn Festival", "Qingming"], "Mid-Autumn Festival", 1),
		// https://en.wikipedia.org/wiki/Zongzi
		q("Zongzi, sticky rice wrapped in leaves, are eaten at which festival?", ["Dragon Boat Festival", "Mid-Autumn Festival", "Lunar New Year", "Lantern Festival"], "Dragon Boat Festival", 1),
		// https://en.wikipedia.org/wiki/Liège_waffle
		q("Which country is the origin of the waffle variety known as the Liège waffle?", ["Netherlands", "Belgium", "France", "Luxembourg"], "Belgium", 2),
		// https://en.wikipedia.org/wiki/Stroopwafel
		q("Which Dutch thin syrup waffle cookie comes from Gouda?", ["stroopwafel", "poffertjes", "oliebol", "speculaas"], "stroopwafel", 1),
		// https://en.wikipedia.org/wiki/Cinnamon_roll
		q("Which country is the origin of the cinnamon roll called kanelbulle?", ["Denmark", "Sweden", "Finland", "Norway"], "Sweden", 2),
		// https://en.wikipedia.org/wiki/Gazpacho
		q("What is the main ingredient of the Spanish cold soup gazpacho?", ["peppers", "onions", "cucumbers", "tomatoes"], "tomatoes", 1),
		// https://en.wikipedia.org/wiki/Spanish_omelette
		q("Which Spanish dish is a potato omelette?", ["patatas bravas", "paella", "gazpacho", "tortilla española"], "tortilla española", 1),
		// https://en.wikipedia.org/wiki/Churro
		q("Which fried dough snack from Spain is often dipped in chocolate?", ["buñuelos", "churros", "donuts", "beignets"], "churros", 1),
		// https://en.wikipedia.org/wiki/Beignet
		q("Which deep-fried dough pastry is famous in New Orleans, served with powdered sugar?", ["churro", "zeppole", "beignet", "cruller"], "beignet", 1),
		// https://en.wikipedia.org/wiki/Reuben_sandwich
		q("Which sandwich is made with corned beef, Swiss cheese and sauerkraut on rye?", ["club sandwich", "Reuben", "Cuban", "po' boy"], "Reuben", 1),
		// https://en.wikipedia.org/wiki/Po'_boy
		q("Which Louisiana sandwich is served on French bread with fried seafood?", ["Reuben", "muffuletta", "hoagie", "po' boy"], "po' boy", 1),
		// https://en.wikipedia.org/wiki/Waldorf_salad
		q("Which salad is named after a hotel in New York and has apples and walnuts?", ["Caesar salad", "Waldorf salad", "Cobb salad", "chef salad"], "Waldorf salad", 1),
		// https://en.wikipedia.org/wiki/Granny_Smith
		q("What type of food is a Granny Smith?", ["grape", "apple", "plum", "pear"], "apple", 1),
		// https://en.wikipedia.org/wiki/Russet_Burbank
		q("What type of food is a Russet Burbank?", ["onion", "potato", "apple", "tomato"], "potato", 1),
		// https://en.wikipedia.org/wiki/Cavendish_banana
		q("What type of fruit is a Cavendish?", ["mango", "banana", "apple", "orange"], "banana", 1),
		// https://en.wikipedia.org/wiki/Valencia_orange
		q("What type of fruit is a Valencia?", ["grape", "apple", "orange", "lemon"], "orange", 1),
		// https://en.wikipedia.org/wiki/Bing_cherry
		q("What type of fruit is a Bing?", ["grape", "cherry", "plum", "apple"], "cherry", 1),
		// https://en.wikipedia.org/wiki/Vidalia_onion
		q("What type of food is a Vidalia?", ["pepper", "onion", "tomato", "potato"], "onion", 1),
		// https://en.wikipedia.org/wiki/Medjool
		q("What type of fruit is a Medjool?", ["fig", "olive", "plum", "date"], "date", 2),
		// https://en.wikipedia.org/wiki/Hass_avocado
		q("What type of fruit is a Hass?", ["pear", "avocado", "apple", "mango"], "avocado", 1),
		// https://en.wikipedia.org/wiki/Kalamata_olive
		q("What type of food is a Kalamata?", ["olive", "fig", "date", "grape"], "olive", 1),
		// https://en.wikipedia.org/wiki/Goulash
		q("What is the national dish of Hungary, a paprika-spiced stew?", ["pierogi", "schnitzel", "borscht", "goulash"], "goulash", 1),
		// https://en.wikipedia.org/wiki/Apfelstrudel
		q("Which Austrian pastry is filled with apples and rolled in thin dough?", ["Sachertorte", "apple strudel", "Linzer torte", "kipferl"], "apple strudel", 1),
		// https://en.wikipedia.org/wiki/Sachertorte
		q("Which Viennese chocolate cake has apricot jam inside?", ["Sachertorte", "Dobos torte", "Black Forest cake", "Linzer torte"], "Sachertorte", 2),
		// https://en.wikipedia.org/wiki/Black_Forest_gateau
		q("Black Forest cake is flavored with cherries and which spirit?", ["rum", "schnapps", "kirsch", "brandy"], "kirsch", 1),
		// https://en.wikipedia.org/wiki/Pavlova_(dessert)
		q("Which dessert is a meringue topped with fruit, named after a ballerina?", ["Eton mess", "tiramisu", "pavlova", "trifle"], "pavlova", 1),
		// https://en.wikipedia.org/wiki/Cannoli
		q("Which Sicilian pastry is a fried shell filled with ricotta?", ["cannolo", "zeppola", "bombolone", "sfogliatella"], "cannolo", 1),
		// https://en.wikipedia.org/wiki/Crème_brûlée
		q("Which French dessert has a hard caramelized sugar top?", ["profiterole", "mousse", "clafoutis", "crème brûlée"], "crème brûlée", 1),
		// https://en.wikipedia.org/wiki/Éclair
		q("Which French pastry is a cream-filled choux bun topped with chocolate?", ["éclair", "croissant", "madeleine", "macaron"], "éclair", 1),
		// https://en.wikipedia.org/wiki/Madeleine_(cake)
		q("Which small French cake is shaped like a shell?", ["financier", "canelé", "madeleine", "macaron"], "madeleine", 1),
		// https://en.wikipedia.org/wiki/Trifle
		q("Which British dessert layers sponge, custard, fruit and cream?", ["scone", "crumble", "trifle", "pudding"], "trifle", 1),
		// https://en.wikipedia.org/wiki/Cream_tea
		q("What is clotted cream traditionally served with in a cream tea?", ["scones", "crumpets", "muffins", "biscuits"], "scones", 1),
		// https://en.wikipedia.org/wiki/Shortbread
		q("Which Scottish biscuit is made mainly of butter, sugar and flour?", ["flapjack", "shortbread", "bannock", "oatcake"], "shortbread", 1),
		// https://en.wikipedia.org/wiki/Marmite
		q("Which British spread is made from yeast extract?", ["lemon curd", "treacle", "Marmite", "Nutella"], "Marmite", 1),
		// https://en.wikipedia.org/wiki/Vegemite
		q("Which Australian spread is made from yeast extract?", ["Milo", "Promite", "Vegemite", "Marmite"], "Vegemite", 1),
		// https://en.wikipedia.org/wiki/Crêpe
		q("What are crêpes?", ["thin pancakes", "flat breads", "fried dumplings", "egg custards"], "thin pancakes", 1),
		// https://en.wikipedia.org/wiki/Baba_ghanoush
		q("What is the main ingredient of baba ghanoush?", ["chickpeas", "zucchini", "eggplant", "yogurt"], "eggplant", 1),
		// https://en.wikipedia.org/wiki/Tabbouleh
		q("Which Middle Eastern salad is made mostly of parsley and bulgur?", ["couscous", "tabbouleh", "fattoush", "baba ghanoush"], "tabbouleh", 1),
		// https://en.wikipedia.org/wiki/Couscous
		q("Couscous is a staple food of which region?", ["South America", "East Asia", "Scandinavia", "North Africa"], "North Africa", 1),
		// https://en.wikipedia.org/wiki/Tagine
		q("A tagine is a dish and clay pot from which country?", ["Morocco", "Greece", "Turkey", "Egypt"], "Morocco", 1),
		// https://en.wikipedia.org/wiki/Durian
		q("Which tropical fruit is known as the 'king of fruits' and is famously smelly?", ["mango", "jackfruit", "durian", "lychee"], "durian", 1),
		// https://en.wikipedia.org/wiki/Jackfruit
		q("Which is the largest tree-borne fruit in the world?", ["jackfruit", "coconut", "watermelon", "durian"], "jackfruit", 1),
		// https://en.wikipedia.org/wiki/Kiwifruit
		q("Which fruit is also called a Chinese gooseberry?", ["gooseberry", "star fruit", "lychee", "kiwifruit"], "kiwifruit", 1),
		// https://en.wikipedia.org/wiki/Carambola
		q("Which fruit is shaped like a star when sliced?", ["dragon fruit", "kiwifruit", "carambola", "papaya"], "carambola", 1),
		// https://en.wikipedia.org/wiki/Nori
		q("Which seaweed is used to wrap sushi rolls?", ["kombu", "dulse", "nori", "wakame"], "nori", 1),
		// https://en.wikipedia.org/wiki/Bibimbap
		q("Which Korean dish is mixed rice topped with vegetables and an egg?", ["bibimbap", "kimchi", "bulgogi", "japchae"], "bibimbap", 1),
		// https://en.wikipedia.org/wiki/Bulgogi
		q("Bulgogi is a Korean dish of grilled marinated what?", ["beef", "chicken", "tofu", "pork"], "beef", 1),
		// https://en.wikipedia.org/wiki/Bánh_mì
		q("Which Vietnamese sandwich is served on a baguette?", ["bún chả", "gỏi cuốn", "phở", "bánh mì"], "bánh mì", 1),
		// https://en.wikipedia.org/wiki/Tom_yum
		q("Which Thai soup is hot and sour with shrimp?", ["laksa", "pho", "tom yum", "tom kha"], "tom yum", 1),
		// https://en.wikipedia.org/wiki/Satay
		q("Satay is meat grilled on what?", ["skewers", "clay pots", "cedar planks", "stones"], "skewers", 1),
		// https://en.wikipedia.org/wiki/Nasi_goreng
		q("Which Indonesian dish is fried rice?", ["nasi goreng", "rendang", "mie goreng", "gado-gado"], "nasi goreng", 1),
		// https://en.wikipedia.org/wiki/Philippine_adobo
		q("Which Filipino dish is meat cooked in vinegar and soy sauce?", ["kare-kare", "lechon", "adobo", "sinigang"], "adobo", 1),
		// https://en.wikipedia.org/wiki/Ceviche
		q("Which Peruvian dish is raw fish cured in lime juice?", ["causa", "anticucho", "empanada", "ceviche"], "ceviche", 1),
		// https://en.wikipedia.org/wiki/Empanada
		q("Which Argentine pastry is filled with meat and baked or fried?", ["empanada", "pupusa", "arepa", "tamale"], "empanada", 1),
		// https://en.wikipedia.org/wiki/Arepa
		q("Which corn cake is a staple of Venezuela and Colombia?", ["tortilla", "pupusa", "tamale", "arepa"], "arepa", 1),
		// https://en.wikipedia.org/wiki/Pupusa
		q("Pupusas are the national dish of which country?", ["Nicaragua", "Honduras", "El Salvador", "Guatemala"], "El Salvador", 2),
		// https://en.wikipedia.org/wiki/Caipirinha
		q("Which Brazilian cocktail is made with cachaça and lime?", ["mojito", "caipirinha", "pisco sour", "daiquiri"], "caipirinha", 1),
		// https://en.wikipedia.org/wiki/Pisco_sour
		q("Pisco sour is a cocktail claimed by Peru and which other country?", ["Argentina", "Chile", "Ecuador", "Bolivia"], "Chile", 2),
		// https://en.wikipedia.org/wiki/Camellia_sinensis
		q("Which drink is made from the leaves of Camellia sinensis?", ["cocoa", "mate", "coffee", "tea"], "tea", 1),
		// https://en.wikipedia.org/wiki/Cappuccino
		q("Which coffee drink is espresso topped with steamed milk foam?", ["affogato", "americano", "cappuccino", "ristretto"], "cappuccino", 1),
		// https://en.wikipedia.org/wiki/Caffè_americano
		q("Which coffee drink is espresso diluted with hot water?", ["americano", "macchiato", "cortado", "latte"], "americano", 1),
		// https://en.wikipedia.org/wiki/Affogato
		q("Which Italian dessert is gelato or ice cream 'drowned' in espresso?", ["tiramisu", "semifreddo", "granita", "affogato"], "affogato", 1),
		// https://en.wikipedia.org/wiki/Matcha
		q("What color is matcha powder?", ["green", "white", "red", "brown"], "green", 1),
		// https://en.wikipedia.org/wiki/Horchata
		q("What is the main ingredient of the Mexican drink horchata?", ["coconut", "cocoa", "rice", "corn"], "rice", 1),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Edgar_Degas
		q("Which French artist is famous for paintings of ballet dancers?", ["Henri Matisse", "Edgar Degas", "Paul Cézanne", "Claude Monet"], "Edgar Degas", 1),
		// https://en.wikipedia.org/wiki/Roy_Lichtenstein
		q("Which artist is famous for comic-book-style paintings with Ben-Day dots?", ["Jean-Michel Basquiat", "Roy Lichtenstein", "Keith Haring", "Andy Warhol"], "Roy Lichtenstein", 1),
		// https://en.wikipedia.org/wiki/Diego_Rivera
		q("Which Mexican muralist was married to Frida Kahlo?", ["José Clemente Orozco", "Rufino Tamayo", "David Alfaro Siqueiros", "Diego Rivera"], "Diego Rivera", 1),
		// https://en.wikipedia.org/wiki/Norman_Rockwell
		q("Which illustrator painted many Saturday Evening Post covers?", ["Norman Rockwell", "Edward Hopper", "N. C. Wyeth", "Andrew Wyeth"], "Norman Rockwell", 1),
		// https://en.wikipedia.org/wiki/Venus_de_Milo
		q("Which ancient Greek statue of a goddess is missing both arms?", ["Winged Victory", "Venus de Milo", "Aphrodite of Knidos", "Athena Parthenos"], "Venus de Milo", 1),
		// https://en.wikipedia.org/wiki/Frédéric_Chopin
		q("Which Polish composer is famous for piano nocturnes and mazurkas?", ["Franz Liszt", "Felix Mendelssohn", "Robert Schumann", "Frédéric Chopin"], "Frédéric Chopin", 1),
		// https://en.wikipedia.org/wiki/Rodgers_and_Hammerstein
		q("Which duo wrote the musicals Oklahoma! and The Sound of Music?", ["Lerner and Loewe", "Kander and Ebb", "Gilbert and Sullivan", "Rodgers and Hammerstein"], "Rodgers and Hammerstein", 1),
		// https://en.wikipedia.org/wiki/My_Fair_Lady
		q("Which duo wrote the musical My Fair Lady?", ["Lerner and Loewe", "Gilbert and Sullivan", "Rodgers and Hammerstein", "Kander and Ebb"], "Lerner and Loewe", 1),
		// https://en.wikipedia.org/wiki/Rent_(musical)
		q("Which musical is set among bohemian artists in New York's East Village?", ["Company", "Rent", "Hair", "Cabaret"], "Rent", 1),
		// https://en.wikipedia.org/wiki/Evita_(musical)
		q("Which musical tells the story of Eva Perón?", ["Chicago", "Cabaret", "Evita", "Gypsy"], "Evita", 1),
		// https://en.wikipedia.org/wiki/Wicked_(musical)
		q("Which musical tells the backstory of the witches of Oz?", ["Wicked", "Into the Woods", "Matilda", "The Wiz"], "Wicked", 1),
		// https://en.wikipedia.org/wiki/Pointe_technique
		q("Which ballet position has the dancer balancing on the tips of the toes?", ["en pointe", "pirouette", "plié", "arabesque"], "en pointe", 1),
		// https://en.wikipedia.org/wiki/Plié
		q("What is a bend of the knees called in ballet?", ["relevé", "jeté", "pirouette", "plié"], "plié", 1),
		// https://en.wikipedia.org/wiki/Origami
		q("Which Japanese art involves folding paper?", ["bonsai", "origami", "ikebana", "kirigami"], "origami", 1),
		// https://en.wikipedia.org/wiki/Ikebana
		q("Which Japanese art involves arranging flowers?", ["origami", "ikebana", "haiku", "bonsai"], "ikebana", 1),
		// https://en.wikipedia.org/wiki/Bonsai
		q("Which Japanese art involves growing miniature trees?", ["ikebana", "origami", "kintsugi", "bonsai"], "bonsai", 1),
		// https://en.wikipedia.org/wiki/Kintsugi
		q("Which Japanese art repairs broken pottery with gold?", ["raku", "kintsugi", "bonsai", "ikebana"], "kintsugi", 1),
		// https://en.wikipedia.org/wiki/Limerick_(poetry)
		q("Which humorous five-line poem has an AABBA rhyme?", ["haiku", "limerick", "villanelle", "sonnet"], "limerick", 1),
		// https://en.wikipedia.org/wiki/The_Great_Wave_off_Kanagawa
		q("Which Japanese woodblock print shows a huge wave with Mount Fuji behind?", ["The Great Wave off Kanagawa", "Red Fuji", "Plum Park in Kameido", "Fine Wind, Clear Morning"], "The Great Wave off Kanagawa", 1),
		// https://en.wikipedia.org/wiki/Bayeux_Tapestry
		q("Which medieval embroidery tells the story of the Norman Conquest?", ["Lady and the Unicorn", "Apocalypse Tapestry", "Bayeux Tapestry", "Unicorn Tapestries"], "Bayeux Tapestry", 1),
		// https://en.wikipedia.org/wiki/Salvador_Dalí
		q("Which art movement is Salvador Dalí linked to?", ["Impressionism", "Cubism", "Fauvism", "Surrealism"], "Surrealism", 1),
		// https://en.wikipedia.org/wiki/Pointillism
		q("Which art technique uses small dots of color to form an image?", ["sfumato", "impasto", "chiaroscuro", "pointillism"], "pointillism", 1),
		// https://en.wikipedia.org/wiki/Tempera
		q("Which paint type uses egg yolk as a binder?", ["tempera", "acrylic", "oil paint", "gouache"], "tempera", 2),
		// https://en.wikipedia.org/wiki/Wassily_Kandinsky
		q("Which Russian painter is a pioneer of abstract art?", ["Kazimir Malevich", "Ilya Repin", "Wassily Kandinsky", "Marc Chagall"], "Wassily Kandinsky", 1),
		// https://en.wikipedia.org/wiki/To_be,_or_not_to_be
		q("Which play features the line 'To be, or not to be'?", ["King Lear", "Macbeth", "Hamlet", "Othello"], "Hamlet", 1),
		// https://en.wikipedia.org/wiki/Macbeth
		q("In which Shakespeare play do three witches predict a Scottish lord will be king?", ["Macbeth", "The Tempest", "Hamlet", "King Lear"], "Macbeth", 1),
		// https://en.wikipedia.org/wiki/Waiting_for_Godot
		q("Which Samuel Beckett play has two men waiting for someone who never comes?", ["Endgame", "Krapp's Last Tape", "Happy Days", "Waiting for Godot"], "Waiting for Godot", 1),
		// https://en.wikipedia.org/wiki/Death_of_a_Salesman
		q("Which Arthur Miller play is about salesman Willy Loman?", ["Death of a Salesman", "All My Sons", "The Crucible", "A View from the Bridge"], "Death of a Salesman", 1),
		// https://en.wikipedia.org/wiki/A_Streetcar_Named_Desire
		q("Which Tennessee Williams play features Blanche DuBois?", ["A Streetcar Named Desire", "Cat on a Hot Tin Roof", "Sweet Bird of Youth", "The Glass Menagerie"], "A Streetcar Named Desire", 1),
	],
	science: [
		// https://en.wikipedia.org/wiki/Kidney
		q("Which organ filters blood to make urine?", ["bladder", "spleen", "kidneys", "liver"], "kidneys", 1),
		// https://en.wikipedia.org/wiki/Femur
		q("Which bone is the longest in the human body?", ["humerus", "spine", "tibia", "femur"], "femur", 1),
		// https://en.wikipedia.org/wiki/Skull
		q("Which bone protects the brain?", ["clavicle", "pelvis", "skull", "sternum"], "skull", 1),
		// https://en.wikipedia.org/wiki/Clavicle
		q("What is the common name for the clavicle?", ["shinbone", "collarbone", "kneecap", "breastbone"], "collarbone", 1),
		// https://en.wikipedia.org/wiki/Sternum
		q("What is the common name for the sternum?", ["collarbone", "breastbone", "tailbone", "shoulder blade"], "breastbone", 1),
		// https://en.wikipedia.org/wiki/Scapula
		q("What is the common name for the scapula?", ["shoulder blade", "kneecap", "collarbone", "hip bone"], "shoulder blade", 1),
		// https://en.wikipedia.org/wiki/Platelet
		q("Which blood components help clotting?", ["plasma", "platelets", "white blood cells", "red blood cells"], "platelets", 1),
		// https://en.wikipedia.org/wiki/Calcium
		q("Which mineral is needed for strong bones and teeth?", ["sodium", "zinc", "calcium", "iron"], "calcium", 1),
		// https://en.wikipedia.org/wiki/Iron-deficiency_anemia
		q("Lack of which mineral is the most common cause of anemia?", ["potassium", "iron", "calcium", "zinc"], "iron", 1),
		// https://en.wikipedia.org/wiki/Retina
		q("Which part of the eye contains rods and cones?", ["retina", "pupil", "iris", "cornea"], "retina", 1),
		// https://en.wikipedia.org/wiki/Tooth_enamel
		q("What is the hardest substance in the human body?", ["bone", "tooth enamel", "cartilage", "keratin"], "tooth enamel", 1),
		// https://en.wikipedia.org/wiki/Keratin
		q("What protein makes up human hair and nails?", ["keratin", "collagen", "actin", "elastin"], "keratin", 1),
		// https://en.wikipedia.org/wiki/Human_tooth
		q("How many teeth does a typical adult human have?", ["36", "28", "30", "32"], "32", 1),
		// https://en.wikipedia.org/wiki/Chlorophyll
		q("Which green pigment lets plants capture sunlight?", ["carotene", "hemoglobin", "chlorophyll", "melanin"], "chlorophyll", 1),
		// https://en.wikipedia.org/wiki/Silver
		q("What is the chemical symbol for silver?", ["Sv", "Au", "Ag", "Si"], "Ag", 1),
		// https://en.wikipedia.org/wiki/Lead
		q("What is the chemical symbol for lead?", ["L", "Pb", "Ld", "Le"], "Pb", 1),
		// https://en.wikipedia.org/wiki/Copper
		q("What is the chemical symbol for copper?", ["Cp", "C", "Co", "Cu"], "Cu", 1),
		// https://en.wikipedia.org/wiki/Tin
		q("What is the chemical symbol for tin?", ["Ti", "Tn", "T", "Sn"], "Sn", 1),
		// https://en.wikipedia.org/wiki/Mercury_(element)
		q("What is the chemical symbol for mercury?", ["Me", "Mr", "Hy", "Hg"], "Hg", 1),
		// https://en.wikipedia.org/wiki/Sodium_chloride
		q("What is the chemical formula for table salt?", ["NaCl", "CaCl2", "KCl", "NaOH"], "NaCl", 1),
		// https://en.wikipedia.org/wiki/Carbon_dioxide
		q("What is the chemical formula for carbon dioxide?", ["O2C2", "C2O", "CO2", "CO"], "CO2", 1),
		// https://en.wikipedia.org/wiki/Carbon
		q("Which element has atomic number 6?", ["carbon", "boron", "nitrogen", "oxygen"], "carbon", 1),
		// https://en.wikipedia.org/wiki/Oxygen
		q("Which element has atomic number 8?", ["fluorine", "oxygen", "nitrogen", "carbon"], "oxygen", 1),
		// https://en.wikipedia.org/wiki/Helium
		q("Which light gas makes party balloons float?", ["hydrogen", "nitrogen", "helium", "neon"], "helium", 1),
		// https://en.wikipedia.org/wiki/Boiling_point
		q("At what temperature in Celsius does water boil at sea level?", ["100", "80", "212", "90"], "100", 1),
		// https://en.wikipedia.org/wiki/Fahrenheit
		q("At what temperature in Fahrenheit does water freeze?", ["40", "0", "32", "10"], "32", 1),
		// https://en.wikipedia.org/wiki/Louis_Pasteur
		q("Which French scientist gave his name to a milk-heating process?", ["Pierre Curie", "Marie Curie", "Antoine Lavoisier", "Louis Pasteur"], "Louis Pasteur", 1),
		// https://en.wikipedia.org/wiki/Dmitri_Mendeleev
		q("Which Russian chemist created the periodic table?", ["Ivan Pavlov", "Andrei Sakharov", "Mikhail Lomonosov", "Dmitri Mendeleev"], "Dmitri Mendeleev", 1),
		// https://en.wikipedia.org/wiki/Ivan_Pavlov
		q("Which Russian scientist trained dogs to salivate at a bell?", ["Lev Landau", "Ivan Pavlov", "Konstantin Tsiolkovsky", "Dmitri Mendeleev"], "Ivan Pavlov", 1),
		// https://en.wikipedia.org/wiki/Titan_(moon)
		q("What is the largest moon of Saturn?", ["Ganymede", "Titan", "Rhea", "Enceladus"], "Titan", 1),
		// https://en.wikipedia.org/wiki/Io_(moon)
		q("Which moon of Jupiter is the most volcanically active body known?", ["Io", "Callisto", "Ganymede", "Europa"], "Io", 2),
		// https://en.wikipedia.org/wiki/Moons_of_Mars
		q("What are Mars's two moons?", ["Triton and Nereid", "Io and Europa", "Phobos and Deimos", "Titan and Rhea"], "Phobos and Deimos", 1),
		// https://en.wikipedia.org/wiki/Andromeda_Galaxy
		q("Which is the nearest large galaxy to the Milky Way?", ["Triangulum", "Andromeda", "Sombrero", "Whirlpool"], "Andromeda", 1),
		// https://en.wikipedia.org/wiki/Polaris
		q("What is the common name for Polaris?", ["Morning Star", "North Star", "Evening Star", "Dog Star"], "North Star", 1),
		// https://en.wikipedia.org/wiki/Ursa_Major
		q("Which constellation contains the Big Dipper?", ["Cassiopeia", "Ursa Minor", "Ursa Major", "Orion"], "Ursa Major", 1),
		// https://en.wikipedia.org/wiki/Halley's_Comet
		q("Which comet returns about every 76 years?", ["Shoemaker–Levy 9", "Comet Encke", "Hale–Bopp", "Halley's Comet"], "Halley's Comet", 1),
		// https://en.wikipedia.org/wiki/James_Webb_Space_Telescope
		q("Which telescope launched in 2021 sees in infrared from far beyond the Moon?", ["James Webb", "Spitzer", "Hubble", "Kepler"], "James Webb", 1),
		// https://en.wikipedia.org/wiki/Hubble_Space_Telescope
		q("Which space telescope was launched by Space Shuttle Discovery in 1990?", ["Chandra", "James Webb", "Spitzer", "Hubble"], "Hubble", 1),
		// https://en.wikipedia.org/wiki/Event_horizon
		q("What is the boundary around a black hole beyond which nothing escapes?", ["event horizon", "photon sphere", "singularity", "accretion disk"], "event horizon", 1),
		// https://en.wikipedia.org/wiki/Igneous_rock
		q("What type of rock forms from cooled magma or lava?", ["sedimentary", "fossil", "igneous", "metamorphic"], "igneous", 1),
		// https://en.wikipedia.org/wiki/Metamorphic_rock
		q("What type of rock is formed by heat and pressure changing other rock?", ["igneous", "sedimentary", "metamorphic", "volcanic"], "metamorphic", 1),
		// https://en.wikipedia.org/wiki/Mohs_scale
		q("Which mineral is the softest on the Mohs scale?", ["quartz", "talc", "calcite", "gypsum"], "talc", 2),
		// https://en.wikipedia.org/wiki/Diamond
		q("Diamonds are made of which element?", ["carbon", "silicon", "nitrogen", "boron"], "carbon", 1),
		// https://en.wikipedia.org/wiki/Seismology
		q("What are scientists who study earthquakes called?", ["seismologists", "volcanologists", "geologists", "meteorologists"], "seismologists", 1),
		// https://en.wikipedia.org/wiki/Paleontology
		q("What do paleontologists study?", ["weather", "fossils", "stars", "volcanoes"], "fossils", 1),
		// https://en.wikipedia.org/wiki/Meteorology
		q("What does a meteorologist study?", ["oceans", "meteors", "rocks", "weather"], "weather", 1),
	],
	history: [
		// https://en.wikipedia.org/wiki/Colossus_of_Rhodes
		q("Which ancient wonder stood in the harbor of Rhodes?", ["Hanging Gardens", "Colossus", "Lighthouse", "Mausoleum"], "Colossus", 1),
		// https://en.wikipedia.org/wiki/Tenochtitlan
		q("Which modern city stands on the site of Tenochtitlan?", ["Guadalajara", "Lima", "Mexico City", "Cancún"], "Mexico City", 1),
		// https://en.wikipedia.org/wiki/Chichen_Itza
		q("Which Mayan city in Mexico is home to the pyramid El Castillo?", ["Chichen Itza", "Teotihuacan", "Palenque", "Tikal"], "Chichen Itza", 1),
		// https://en.wikipedia.org/wiki/Petra
		q("Which ancient city in Jordan is carved into rose-red cliffs?", ["Babylon", "Jerash", "Petra", "Palmyra"], "Petra", 1),
		// https://en.wikipedia.org/wiki/Latin
		q("Which language was spoken by the ancient Romans?", ["Aramaic", "Greek", "Latin", "Etruscan"], "Latin", 1),
		// https://en.wikipedia.org/wiki/Great_Fire_of_Rome
		q("Which Roman emperor is said to have 'fiddled while Rome burned'?", ["Caligula", "Trajan", "Hadrian", "Nero"], "Nero", 1),
		// https://en.wikipedia.org/wiki/Hannibal
		q("Which Carthaginian general crossed the Alps with elephants?", ["Hamilcar", "Scipio", "Spartacus", "Hannibal"], "Hannibal", 1),
		// https://en.wikipedia.org/wiki/Spartacus
		q("Which gladiator led a major slave revolt against Rome?", ["Hannibal", "Commodus", "Vercingetorix", "Spartacus"], "Spartacus", 1),
		// https://en.wikipedia.org/wiki/Sparta
		q("Which Greek city-state was famous for its warrior culture?", ["Corinth", "Athens", "Sparta", "Thebes"], "Sparta", 1),
		// https://en.wikipedia.org/wiki/Alexander_the_Great
		q("Which Macedonian king created a vast empire by age 30?", ["Philip II", "Darius I", "Alexander the Great", "Cyrus the Great"], "Alexander the Great", 1),
		// https://en.wikipedia.org/wiki/Marco_Polo
		q("Which Venetian traveler wrote about his journeys to Kublai Khan's court?", ["Zheng He", "Ibn Battuta", "Vasco da Gama", "Marco Polo"], "Marco Polo", 1),
		// https://en.wikipedia.org/wiki/Ibn_Battuta
		q("Which Moroccan scholar traveled across the Islamic world in the 1300s?", ["Ibn Battuta", "Marco Polo", "Ibn Khaldun", "Avicenna"], "Ibn Battuta", 1),
		// https://en.wikipedia.org/wiki/Vasco_da_Gama
		q("Which Portuguese explorer first sailed from Europe to India by sea?", ["Vasco da Gama", "Bartolomeu Dias", "Pedro Cabral", "Ferdinand Magellan"], "Vasco da Gama", 1),
		// https://en.wikipedia.org/wiki/Magellan_expedition
		q("Whose expedition was the first to sail around the world?", ["Francis Drake", "James Cook", "Ferdinand Magellan", "Vasco da Gama"], "Ferdinand Magellan", 1),
		// https://en.wikipedia.org/wiki/James_Cook
		q("Which English captain mapped much of the Pacific and reached Australia's east coast in 1770?", ["Walter Raleigh", "Abel Tasman", "James Cook", "Francis Drake"], "James Cook", 1),
		// https://en.wikipedia.org/wiki/Leif_Erikson
		q("Which Norse explorer reached North America around the year 1000?", ["Leif Erikson", "Ragnar Lodbrok", "Erik the Red", "Harald Hardrada"], "Leif Erikson", 1),
		// https://en.wikipedia.org/wiki/Jamestown,_Virginia
		q("What was the first permanent English settlement in North America?", ["Roanoke", "St. Augustine", "Plymouth", "Jamestown"], "Jamestown", 1),
		// https://en.wikipedia.org/wiki/Pocahontas
		q("Which Powhatan woman is linked with the Jamestown colony?", ["Sacagawea", "Pocahontas", "Malinche", "Squanto"], "Pocahontas", 1),
		// https://en.wikipedia.org/wiki/Louisiana_Purchase
		q("From which country did the US buy Louisiana in 1803?", ["Mexico", "Spain", "Britain", "France"], "France", 1),
		// https://en.wikipedia.org/wiki/California_gold_rush
		q("Which 1849 event drew huge crowds to California?", ["Land Run", "Dust Bowl", "Gold Rush", "Oregon Trail"], "Gold Rush", 1),
		// https://en.wikipedia.org/wiki/Battle_of_the_Alamo
		q("Which 1836 battle in Texas saw defenders fall to Mexican troops?", ["Battle of San Jacinto", "Battle of the Alamo", "Battle of Goliad", "Battle of Gonzales"], "Battle of the Alamo", 1),
		// https://en.wikipedia.org/wiki/Boston_Tea_Party
		q("Which protest saw colonists dump tea into Boston Harbor in 1773?", ["Stamp Act Riot", "Whiskey Rebellion", "Boston Tea Party", "Boston Massacre"], "Boston Tea Party", 1),
		// https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence
		q("Which document did the American colonies sign in 1776?", ["Constitution", "Bill of Rights", "Declaration of Independence", "Articles of Confederation"], "Declaration of Independence", 1),
		// https://en.wikipedia.org/wiki/Siege_of_Yorktown
		q("Which battle ended the American Revolutionary War's major fighting in 1781?", ["Battle of Bunker Hill", "Battle of Saratoga", "Siege of Yorktown", "Battle of Trenton"], "Siege of Yorktown", 1),
		// https://en.wikipedia.org/wiki/Robert_E._Lee
		q("Who led the Confederate army in the US Civil War?", ["Ulysses S. Grant", "Robert E. Lee", "Jefferson Davis", "Stonewall Jackson"], "Robert E. Lee", 1),
		// https://en.wikipedia.org/wiki/Jefferson_Davis
		q("Who was president of the Confederacy?", ["Robert E. Lee", "John C. Calhoun", "Stonewall Jackson", "Jefferson Davis"], "Jefferson Davis", 1),
		// https://en.wikipedia.org/wiki/Frederick_Douglass
		q("Which former slave became a famous abolitionist writer and speaker?", ["Booker T. Washington", "Nat Turner", "W. E. B. Du Bois", "Frederick Douglass"], "Frederick Douglass", 1),
		// https://en.wikipedia.org/wiki/Rosa_Parks
		q("Whose refusal to give up her bus seat sparked the Montgomery bus boycott?", ["Harriet Tubman", "Coretta Scott King", "Rosa Parks", "Ruby Bridges"], "Rosa Parks", 1),
		// https://en.wikipedia.org/wiki/I_Have_a_Dream
		q("Where did Martin Luther King Jr. give his 'I Have a Dream' speech?", ["White House", "Lincoln Memorial", "Capitol steps", "Washington Monument"], "Lincoln Memorial", 1),
		// https://en.wikipedia.org/wiki/Hindenburg_disaster
		q("Which German airship burst into flames in New Jersey in 1937?", ["Hindenburg", "Macon", "Graf Zeppelin", "Akron"], "Hindenburg", 1),
		// https://en.wikipedia.org/wiki/Operation_Overlord
		q("What was the code name for the Allied invasion of Normandy?", ["Operation Torch", "Operation Barbarossa", "Operation Market Garden", "Operation Overlord"], "Operation Overlord", 1),
		// https://en.wikipedia.org/wiki/Anne_Frank
		q("Which Dutch girl's diary of hiding from the Nazis became famous?", ["Sophie Scholl", "Corrie ten Boom", "Anne Frank", "Hannah Senesh"], "Anne Frank", 1),
		// https://en.wikipedia.org/wiki/Berlin_Wall
		q("Which city was divided by a wall from 1961 to 1989?", ["Berlin", "Vienna", "Warsaw", "Prague"], "Berlin", 1),
		// https://en.wikipedia.org/wiki/Cuban_Missile_Crisis
		q("Which 1962 standoff brought the US and USSR close to nuclear war?", ["Bay of Pigs", "Cuban Missile Crisis", "Berlin Blockade", "Suez Crisis"], "Cuban Missile Crisis", 1),
		// https://en.wikipedia.org/wiki/Nelson_Mandela
		q("Which South African leader spent 27 years in prison before becoming president?", ["Desmond Tutu", "Steve Biko", "Nelson Mandela", "Thabo Mbeki"], "Nelson Mandela", 1),
		// https://en.wikipedia.org/wiki/Mahatma_Gandhi
		q("Who led India's nonviolent independence movement?", ["B. R. Ambedkar", "Subhas Chandra Bose", "Mahatma Gandhi", "Jawaharlal Nehru"], "Mahatma Gandhi", 1),
		// https://en.wikipedia.org/wiki/Jawaharlal_Nehru
		q("Who was India's first prime minister?", ["Jawaharlal Nehru", "Mahatma Gandhi", "Indira Gandhi", "Sardar Patel"], "Jawaharlal Nehru", 1),
		// https://en.wikipedia.org/wiki/Let_them_eat_cake
		q("Which French queen is linked to the phrase 'Let them eat cake'?", ["Eleanor of Aquitaine", "Marie Antoinette", "Catherine de' Medici", "Josephine"], "Marie Antoinette", 1),
		// https://en.wikipedia.org/wiki/Storming_of_the_Bastille
		q("Which Paris prison was stormed on July 14, 1789?", ["Châtelet", "Bastille", "Conciergerie", "Temple"], "Bastille", 1),
		// https://en.wikipedia.org/wiki/Battle_of_Waterloo
		q("Where did Napoleon suffer his final defeat in 1815?", ["Leipzig", "Waterloo", "Trafalgar", "Austerlitz"], "Waterloo", 1),
		// https://en.wikipedia.org/wiki/Horatio_Nelson
		q("Which English admiral died winning the Battle of Trafalgar?", ["Francis Drake", "John Jervis", "Horatio Nelson", "Walter Raleigh"], "Horatio Nelson", 1),
		// https://en.wikipedia.org/wiki/Henry_VIII
		q("Which English king had six wives?", ["Henry VIII", "Edward VI", "Richard III", "Henry VII"], "Henry VIII", 1),
		// https://en.wikipedia.org/wiki/Magna_Carta
		q("Which 1215 charter limited the power of England's King John?", ["Bill of Rights", "Magna Carta", "Domesday Book", "Act of Union"], "Magna Carta", 1),
		// https://en.wikipedia.org/wiki/Joan_of_Arc
		q("Which French heroine was burned at the stake in 1431?", ["Eleanor of Aquitaine", "Joan of Arc", "Catherine of Siena", "Marie Curie"], "Joan of Arc", 1),
		// https://en.wikipedia.org/wiki/Martin_Luther
		q("Which German monk started the Protestant Reformation in 1517?", ["Jan Hus", "John Calvin", "Ulrich Zwingli", "Martin Luther"], "Martin Luther", 1),
		// https://en.wikipedia.org/wiki/Peter_the_Great
		q("Which Russian ruler founded St. Petersburg?", ["Nicholas II", "Ivan the Terrible", "Peter the Great", "Catherine the Great"], "Peter the Great", 1),
		// https://en.wikipedia.org/wiki/October_Revolution
		q("Which 1917 revolution brought Lenin's Bolsheviks to power?", ["Decembrist revolt", "February Revolution", "October Revolution", "1905 Revolution"], "October Revolution", 1),
		// https://en.wikipedia.org/wiki/Mao_Zedong
		q("Who founded the People's Republic of China in 1949?", ["Chiang Kai-shek", "Sun Yat-sen", "Deng Xiaoping", "Mao Zedong"], "Mao Zedong", 1),
		// https://en.wikipedia.org/wiki/Samurai
		q("Which Japanese warrior class followed the code of bushido?", ["ronin", "samurai", "ninja", "shogun"], "samurai", 1),
		// https://en.wikipedia.org/wiki/Endurance_(1912_ship)
		q("Which explorer's ship Endurance was crushed by Antarctic ice in 1915?", ["Roald Amundsen", "Ernest Shackleton", "Douglas Mawson", "Robert Falcon Scott"], "Ernest Shackleton", 1),
		// https://en.wikipedia.org/wiki/Roald_Amundsen
		q("Which Norwegian led the first expedition to reach the South Pole?", ["Roald Amundsen", "Ernest Shackleton", "Robert Scott", "Fridtjof Nansen"], "Roald Amundsen", 1),
		// https://en.wikipedia.org/wiki/1953_British_Mount_Everest_expedition
		q("Who were the first two people confirmed to reach the summit of Everest?", ["Hillary and Tenzing", "Bonington and Haston", "Messner and Habeler", "Mallory and Irvine"], "Hillary and Tenzing", 1),
		// https://en.wikipedia.org/wiki/Apollo_11
		q("In which year did humans first land on the Moon?", ["1971", "1967", "1969", "1965"], "1969", 1),
		// https://en.wikipedia.org/wiki/Valentina_Tereshkova
		q("Who was the first woman in space?", ["Valentina Tereshkova", "Mae Jemison", "Sally Ride", "Svetlana Savitskaya"], "Valentina Tereshkova", 1),
		// https://en.wikipedia.org/wiki/Sally_Ride
		q("Who was the first American woman in space?", ["Christa McAuliffe", "Sally Ride", "Mae Jemison", "Eileen Collins"], "Sally Ride", 1),
		// https://en.wikipedia.org/wiki/Sputnik_1
		q("What was the name of the first artificial satellite, launched in 1957?", ["Vanguard 1", "Luna 1", "Sputnik 1", "Explorer 1"], "Sputnik 1", 1),
		// https://en.wikipedia.org/wiki/Laika
		q("Which dog was the first animal to orbit Earth?", ["Ham", "Laika", "Belka", "Strelka"], "Laika", 1),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Red_deer
		q("What is a male deer called?", ["ram", "stag", "boar", "bull"], "stag", 1),
		// https://en.wikipedia.org/wiki/Goose
		q("What is a male goose called?", ["tom", "gander", "drake", "cob"], "gander", 1),
		// https://en.wikipedia.org/wiki/Skunk
		q("Which mammal is known for spraying a foul-smelling liquid when threatened?", ["skunk", "badger", "opossum", "raccoon"], "skunk", 1),
		// https://en.wikipedia.org/wiki/Virginia_opossum
		q("Which North American marsupial often 'plays dead'?", ["armadillo", "opossum", "skunk", "raccoon"], "opossum", 1),
		// https://en.wikipedia.org/wiki/Armadillo
		q("Which animal has armor-like bony plates and lives in the Americas?", ["pangolin", "hedgehog", "armadillo", "tortoise"], "armadillo", 1),
		// https://en.wikipedia.org/wiki/Pangolin
		q("Which scaly mammal is the most trafficked mammal in the world?", ["armadillo", "pangolin", "aardvark", "anteater"], "pangolin", 1),
		// https://en.wikipedia.org/wiki/Kiwi_(bird)
		q("Which flightless bird is the national bird of New Zealand?", ["emu", "penguin", "kakapo", "kiwi"], "kiwi", 1),
		// https://en.wikipedia.org/wiki/Common_cuckoo
		q("Which bird lays its eggs in other birds' nests?", ["magpie", "sparrow", "cuckoo", "robin"], "cuckoo", 1),
		// https://en.wikipedia.org/wiki/Parrot
		q("Which bird is famous for mimicking human speech?", ["pigeon", "parrot", "crow", "owl"], "parrot", 1),
		// https://en.wikipedia.org/wiki/Flamingo
		q("Which pink bird gets its color from its diet?", ["ibis", "pelican", "flamingo", "roseate spoonbill"], "flamingo", 1),
		// https://en.wikipedia.org/wiki/Pelican
		q("Which bird has a large throat pouch for scooping fish?", ["stork", "cormorant", "heron", "pelican"], "pelican", 1),
		// https://en.wikipedia.org/wiki/Atlantic_puffin
		q("Which seabird is known for its colorful beak and nests in burrows?", ["tern", "puffin", "albatross", "gannet"], "puffin", 1),
		// https://en.wikipedia.org/wiki/Jaguar
		q("Which big cat is native to the Americas?", ["jaguar", "leopard", "lion", "tiger"], "jaguar", 1),
		// https://en.wikipedia.org/wiki/Lynx
		q("Which wild cat has tufted ears and a short tail?", ["caracal", "cougar", "lynx", "ocelot"], "lynx", 1),
		// https://en.wikipedia.org/wiki/Capybara
		q("Which animal is the largest living rodent?", ["capybara", "porcupine", "groundhog", "beaver"], "capybara", 1),
		// https://en.wikipedia.org/wiki/African_elephant
		q("Which animal is the heaviest land mammal?", ["white rhinoceros", "giraffe", "hippopotamus", "African elephant"], "African elephant", 1),
		// https://en.wikipedia.org/wiki/Moose
		q("Which animal is the largest member of the deer family?", ["red deer", "caribou", "moose", "elk"], "moose", 1),
		// https://en.wikipedia.org/wiki/Reindeer
		q("Which deer species are both males and females antlered?", ["moose", "elk", "white-tailed deer", "reindeer"], "reindeer", 1),
		// https://en.wikipedia.org/wiki/Dromedary
		q("How many humps does a dromedary camel have?", ["1", "0", "2", "3"], "1", 1),
		// https://en.wikipedia.org/wiki/Bactrian_camel
		q("How many humps does a Bactrian camel have?", ["3", "0", "1", "2"], "2", 1),
		// https://en.wikipedia.org/wiki/Sea_otter
		q("Which marine mammal uses tools like rocks to crack open shellfish?", ["sea otter", "seal", "manatee", "walrus"], "sea otter", 1),
		// https://en.wikipedia.org/wiki/Manatee
		q("Which marine mammal is sometimes called a 'sea cow'?", ["walrus", "sea lion", "beluga", "manatee"], "manatee", 1),
		// https://en.wikipedia.org/wiki/Walrus
		q("Which tusked marine mammal lives in the Arctic and has whiskers?", ["narwhal", "beluga", "elephant seal", "walrus"], "walrus", 1),
		// https://en.wikipedia.org/wiki/Narwhal
		q("Which whale is known for its single long spiral tusk?", ["sperm whale", "beluga", "narwhal", "orca"], "narwhal", 1),
		// https://en.wikipedia.org/wiki/Beluga_whale
		q("Which white whale is known as the 'sea canary'?", ["beluga", "humpback", "narwhal", "orca"], "beluga", 1),
		// https://en.wikipedia.org/wiki/Humpback_whale
		q("Which whale is famous for its long, complex songs?", ["blue whale", "humpback whale", "orca", "sperm whale"], "humpback whale", 1),
		// https://en.wikipedia.org/wiki/Sperm_whale
		q("Which whale has the largest brain of any animal?", ["blue whale", "humpback whale", "sperm whale", "orca"], "sperm whale", 2),
		// https://en.wikipedia.org/wiki/Salmon
		q("Which fish is famous for swimming upstream to spawn?", ["cod", "trout", "tuna", "salmon"], "salmon", 1),
		// https://en.wikipedia.org/wiki/Swordfish
		q("Which fish has a long sword-like bill?", ["marlin", "sailfish", "swordfish", "barracuda"], "swordfish", 1),
		// https://en.wikipedia.org/wiki/Tetraodontidae
		q("Which fish can inflate itself into a ball?", ["clownfish", "pufferfish", "stingray", "flounder"], "pufferfish", 1),
		// https://en.wikipedia.org/wiki/Amphiprioninae
		q("Which fish lives among the tentacles of sea anemones?", ["tang", "angelfish", "goby", "clownfish"], "clownfish", 1),
		// https://en.wikipedia.org/wiki/Octopus
		q("Which sea creature has eight arms?", ["squid", "jellyfish", "octopus", "starfish"], "octopus", 1),
		// https://en.wikipedia.org/wiki/Starfish
		q("Which sea creature can regrow a lost arm and often has five arms?", ["crab", "octopus", "starfish", "sea urchin"], "starfish", 1),
		// https://en.wikipedia.org/wiki/Hermit_crab
		q("Which crab lives in a borrowed snail shell?", ["hermit crab", "king crab", "fiddler crab", "blue crab"], "hermit crab", 1),
		// https://en.wikipedia.org/wiki/Chameleon
		q("Which reptile can change color and has a long sticky tongue?", ["chameleon", "monitor lizard", "gecko", "iguana"], "chameleon", 1),
		// https://en.wikipedia.org/wiki/Gila_monster
		q("Which venomous lizard is native to the southwestern US?", ["iguana", "horned lizard", "Komodo dragon", "Gila monster"], "Gila monster", 1),
		// https://en.wikipedia.org/wiki/Green_anaconda
		q("Which snake is the heaviest in the world?", ["king cobra", "boa constrictor", "reticulated python", "green anaconda"], "green anaconda", 1),
		// https://en.wikipedia.org/wiki/Rattlesnake
		q("Which snake has a rattle on the end of its tail?", ["rattlesnake", "copperhead", "cottonmouth", "coral snake"], "rattlesnake", 1),
		// https://en.wikipedia.org/wiki/Firefly
		q("Which insect glows in the dark?", ["beetle", "firefly", "moth", "cricket"], "firefly", 1),
		// https://en.wikipedia.org/wiki/Monarch_butterfly
		q("Which butterfly migrates thousands of miles to Mexico each year?", ["morpho", "swallowtail", "painted lady", "monarch"], "monarch", 1),
		// https://en.wikipedia.org/wiki/Monarch_butterfly
		q("What plant do monarch caterpillars feed on?", ["dandelion", "milkweed", "clover", "thistle"], "milkweed", 1),
		// https://en.wikipedia.org/wiki/Cricket_(insect)
		q("Which insect makes a chirping sound by rubbing its wings?", ["ant", "fly", "cricket", "beetle"], "cricket", 1),
		// https://en.wikipedia.org/wiki/Betula_papyrifera
		q("Which tree has white, papery bark?", ["pine", "oak", "birch", "ash"], "birch", 1),
		// https://en.wikipedia.org/wiki/Sequoiadendron_giganteum
		q("Which tree species is the most massive by volume?", ["baobab", "coast redwood", "kauri", "giant sequoia"], "giant sequoia", 2),
		// https://en.wikipedia.org/wiki/Adansonia
		q("Which African tree is famous for its huge, swollen trunk?", ["ebony", "baobab", "mahogany", "acacia"], "baobab", 1),
		// https://en.wikipedia.org/wiki/Venus_flytrap
		q("Which plant traps and eats insects with snapping leaves?", ["Venus flytrap", "pitcher plant", "sundew", "bladderwort"], "Venus flytrap", 1),
		// https://en.wikipedia.org/wiki/Cactus
		q("Which desert plant stores water in thick stems and has spines?", ["cactus", "agave", "yucca", "aloe"], "cactus", 1),
		// https://en.wikipedia.org/wiki/Saguaro
		q("Which giant cactus is found in the Sonoran Desert?", ["prickly pear", "saguaro", "barrel cactus", "cholla"], "saguaro", 1),
		// https://en.wikipedia.org/wiki/Common_sunflower
		q("Which flower follows the sun as it grows?", ["sunflower", "daisy", "daffodil", "marigold"], "sunflower", 1),
		// https://en.wikipedia.org/wiki/Nelumbo_nucifera
		q("Which aquatic flower is sacred in Hinduism and Buddhism?", ["iris", "lotus", "orchid", "water lily"], "lotus", 1),
		// https://en.wikipedia.org/wiki/Angel_Falls
		q("What is the tallest waterfall in the world?", ["Angel Falls", "Iguazu Falls", "Victoria Falls", "Niagara Falls"], "Angel Falls", 1),
		// https://en.wikipedia.org/wiki/Volcanic_crater
		q("What is a volcano's opening at the top called?", ["cone", "caldera", "crater", "vent"], "crater", 1),
		// https://en.wikipedia.org/wiki/Aurora
		q("Which natural light display is seen near the North Pole?", ["zodiacal light", "aurora borealis", "aurora australis", "airglow"], "aurora borealis", 1),
		// https://en.wikipedia.org/wiki/Glacier
		q("What is the name of a frozen river of ice that moves slowly?", ["ice shelf", "iceberg", "permafrost", "glacier"], "glacier", 1),
		// https://en.wikipedia.org/wiki/Iceberg
		q("What do we call a large floating chunk of ice broken off a glacier?", ["ice floe", "iceberg", "snowpack", "ice shelf"], "iceberg", 1),
		// https://en.wikipedia.org/wiki/Tornado
		q("What is the name of a violent rotating column of air touching the ground?", ["tornado", "hurricane", "monsoon", "cyclone"], "tornado", 1),
		// https://en.wikipedia.org/wiki/Enhanced_Fujita_scale
		q("What scale measures tornado strength in the US?", ["Saffir–Simpson scale", "Richter scale", "Enhanced Fujita scale", "Beaufort scale"], "Enhanced Fujita scale", 1),
	],
};
