import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Monday Nov 9, 2026 trivia batch 2, sub-batch e: easy evergreen food, nature, history, science and arts cards plus a small math top-up (shapes, Roman numerals, units, terms; math is at 12.1%, under its 20% cap). Every card was checked against the Wikipedia page above it; math answers were also checked by hand.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261109E: Partial<Record<PlusCat, TriviaQ[]>> = {
	food: [
		// https://en.wikipedia.org/wiki/Pistachio
		q("Which green nut is used in traditional baklava and Sicilian desserts?", ["macadamia", "pistachio", "cashew", "pecan"], "pistachio", 1),
		// https://en.wikipedia.org/wiki/Pecan_pie
		q("Which nut is the main ingredient of a classic Southern pie?", ["almond", "walnut", "peanut", "pecan"], "pecan", 1),
		// https://en.wikipedia.org/wiki/Cinnamon
		q("Which spice is made from the bark of a tree?", ["clove", "nutmeg", "allspice", "cinnamon"], "cinnamon", 1),
		// https://en.wikipedia.org/wiki/Nutmeg
		q("Which spice is the dried seed of a tropical evergreen and is often grated over eggnog?", ["clove", "cardamom", "allspice", "nutmeg"], "nutmeg", 1),
		// https://en.wikipedia.org/wiki/Paprika
		q("Which red spice is made from ground dried peppers and is key to Hungarian cooking?", ["cayenne", "chili flakes", "sumac", "paprika"], "paprika", 1),
		// https://en.wikipedia.org/wiki/Coriander
		q("Which herb is also called coriander leaf in many countries?", ["basil", "cilantro", "dill", "parsley"], "cilantro", 1),
		// https://en.wikipedia.org/wiki/Mint_sauce
		q("Which herb is traditionally paired with lamb in British cooking as a sauce?", ["mint", "rosemary", "sage", "thyme"], "mint", 1),
		// https://en.wikipedia.org/wiki/Coleslaw
		q("Which vegetable is the main ingredient of coleslaw?", ["lettuce", "carrot", "cabbage", "celery"], "cabbage", 1),
		// https://en.wikipedia.org/wiki/Caesar_salad
		q("Which leafy vegetable is the main ingredient of a Caesar salad?", ["iceberg lettuce", "romaine lettuce", "spinach", "kale"], "romaine lettuce", 1),
		// https://en.wikipedia.org/wiki/Polenta
		q("What is the main ingredient of polenta?", ["potato", "semolina", "rice", "cornmeal"], "cornmeal", 1),
		// https://en.wikipedia.org/wiki/Meringue
		q("What is the main ingredient of a meringue besides sugar?", ["egg yolks", "egg whites", "cream", "butter"], "egg whites", 1),
		// https://en.wikipedia.org/wiki/Aioli
		q("What is the main ingredient of aioli?", ["lemon", "garlic", "mustard", "onion"], "garlic", 1),
		// https://en.wikipedia.org/wiki/Shakshouka
		q("Which North African dish is eggs poached in a spiced tomato sauce?", ["huevos rancheros", "tortilla", "frittata", "shakshuka"], "shakshuka", 1),
		// https://en.wikipedia.org/wiki/Frittata
		q("Which Italian egg dish is like an open-faced omelette, finished in the oven?", ["soufflé", "quiche", "strata", "frittata"], "frittata", 1),
		// https://en.wikipedia.org/wiki/Quiche
		q("Which savory French tart has an egg custard filling, often with bacon?", ["galette", "quiche", "tarte Tatin", "clafoutis"], "quiche", 1),
		// https://en.wikipedia.org/wiki/Tarte_Tatin
		q("Which upside-down caramelized apple tart is French?", ["galette", "tarte Tatin", "crumble", "clafoutis"], "tarte Tatin", 1),
		// https://en.wikipedia.org/wiki/Clafoutis
		q("Which French baked dessert has cherries in a thick batter?", ["soufflé", "flan", "clafoutis", "crème brûlée"], "clafoutis", 1),
		// https://en.wikipedia.org/wiki/Pastel_de_nata
		q("Which Portuguese custard tart is famous in Lisbon's Belém district?", ["pastel de nata", "bola de Berlim", "queijada", "bolo rei"], "pastel de nata", 1),
		// https://en.wikipedia.org/wiki/Bacalhau
		q("Which Portuguese salted fish is a national staple?", ["anchovies", "tuna", "sardines", "bacalhau"], "bacalhau", 1),
		// https://en.wikipedia.org/wiki/Caviar
		q("Caviar is the salted eggs of which fish?", ["cod", "sturgeon", "salmon", "trout"], "sturgeon", 1),
		// https://en.wikipedia.org/wiki/Lox
		q("Which fish is smoked to make lox?", ["salmon", "trout", "mackerel", "herring"], "salmon", 1),
		// https://en.wikipedia.org/wiki/Sardine
		q("Which small fish are often canned in oil and named after an Italian island?", ["herring", "mackerel", "anchovies", "sardines"], "sardines", 1),
		// https://en.wikipedia.org/wiki/Clam_chowder
		q("Which shellfish is used to make a New England 'chowder' along with potatoes?", ["mussels", "clams", "scallops", "oysters"], "clams", 1),
		// https://en.wikipedia.org/wiki/Lobster_roll
		q("Which crustacean is the star of a Maine roll sandwich?", ["shrimp", "lobster", "crayfish", "crab"], "lobster", 1),
		// https://en.wikipedia.org/wiki/Crayfish
		q("Which crustacean is called a 'crawfish' in Louisiana?", ["shrimp", "lobster", "crayfish", "crab"], "crayfish", 1),
		// https://en.wikipedia.org/wiki/Jambalaya
		q("Which Louisiana dish is rice cooked with meat, vegetables and spices, like a paella?", ["étouffée", "gumbo", "jambalaya", "dirty rice"], "jambalaya", 1),
		// https://en.wikipedia.org/wiki/Gumbo
		q("Which Louisiana stew is thickened with roux or okra?", ["étouffée", "jambalaya", "chili", "gumbo"], "gumbo", 1),
		// https://en.wikipedia.org/wiki/Grits
		q("Which Southern side dish is made of ground corn boiled into porridge?", ["cornbread", "polenta", "hominy", "grits"], "grits", 1),
		// https://en.wikipedia.org/wiki/Chicken_and_waffles
		q("Which Southern dish pairs fried chicken with a breakfast item?", ["chicken and waffles", "chicken and pancakes", "chicken and biscuits", "chicken and grits"], "chicken and waffles", 1),
		// https://en.wikipedia.org/wiki/Doughnut
		q("Which sweet American breakfast pastry is ring-shaped and fried?", ["bagel", "muffin", "doughnut", "croissant"], "doughnut", 1),
		// https://en.wikipedia.org/wiki/Bagel
		q("Which ring-shaped bread is boiled before baking?", ["bagel", "doughnut", "bialy", "pretzel"], "bagel", 1),
		// https://en.wikipedia.org/wiki/Honey
		q("Which sweetener is made by bees from flower nectar?", ["molasses", "honey", "agave nectar", "maple syrup"], "honey", 1),
		// https://en.wikipedia.org/wiki/Molasses
		q("Which sweet syrup is a byproduct of refining sugar?", ["maple syrup", "honey", "molasses", "corn syrup"], "molasses", 1),
		// https://en.wikipedia.org/wiki/Chocolate
		q("What is the main ingredient of traditional chocolate?", ["coffee beans", "carob", "vanilla", "cacao beans"], "cacao beans", 1),
		// https://en.wikipedia.org/wiki/White_chocolate
		q("Which type of chocolate contains no cocoa solids?", ["milk chocolate", "white chocolate", "dark chocolate", "baking chocolate"], "white chocolate", 1),
		// https://en.wikipedia.org/wiki/Ghee
		q("What is the main ingredient of ghee?", ["olive oil", "butter", "lard", "cream"], "butter", 1),
		// https://en.wikipedia.org/wiki/Butter
		q("Which dairy product is made by churning cream?", ["butter", "ghee", "yogurt", "cheese"], "butter", 1),
		// https://en.wikipedia.org/wiki/Camembert
		q("Which mold-ripened French cheese has a white rind and comes from Normandy?", ["Camembert", "Roquefort", "Comté", "Munster"], "Camembert", 1),
		// https://en.wikipedia.org/wiki/Roquefort
		q("Which blue cheese is aged in caves in southern France?", ["Stilton", "Roquefort", "Cabrales", "Gorgonzola"], "Roquefort", 1),
		// https://en.wikipedia.org/wiki/Gorgonzola
		q("Which Italian blue cheese is named after a town near Milan?", ["Asiago", "Gorgonzola", "Taleggio", "Fontina"], "Gorgonzola", 1),
		// https://en.wikipedia.org/wiki/Stilton_cheese
		q("Which English blue cheese is sometimes called the 'king of cheeses'?", ["Cheddar", "Wensleydale", "Stilton", "Cheshire"], "Stilton", 1),
		// https://en.wikipedia.org/wiki/Raclette
		q("Which Swiss dish is melted cheese scraped onto potatoes?", ["raclette", "älplermagronen", "rösti", "fondue"], "raclette", 1),
		// https://en.wikipedia.org/wiki/Rösti
		q("Which Swiss potato dish is like a large hash brown?", ["raclette", "gratin", "rösti", "latke"], "rösti", 1),
		// https://en.wikipedia.org/wiki/Latke
		q("Which Jewish potato pancake is fried for Hanukkah?", ["kugel", "latke", "knish", "blintz"], "latke", 1),
		// https://en.wikipedia.org/wiki/Challah
		q("Which braided bread is eaten on the Jewish Sabbath?", ["rye", "babka", "matzo", "challah"], "challah", 1),
		// https://en.wikipedia.org/wiki/Matzo
		q("Which unleavened bread is eaten during Passover?", ["pita", "naan", "challah", "matzo"], "matzo", 1),
		// https://en.wikipedia.org/wiki/Pita
		q("Which pocket bread is common across the Middle East?", ["pita", "focaccia", "lavash", "naan"], "pita", 1),
		// https://en.wikipedia.org/wiki/Focaccia
		q("Which flat Italian bread is often topped with olive oil and rosemary?", ["focaccia", "piadina", "grissini", "ciabatta"], "focaccia", 1),
		// https://en.wikipedia.org/wiki/Grissini
		q("Which crunchy Italian breadsticks are from Turin?", ["grissini", "crostini", "biscotti", "taralli"], "grissini", 1),
		// https://en.wikipedia.org/wiki/Biscotti
		q("Which twice-baked Italian almond cookies are dipped in coffee or Vin Santo?", ["pizzelle", "biscotti", "amaretti", "cantucci rolls"], "biscotti", 1),
		// https://en.wikipedia.org/wiki/Panna_cotta
		q("Which Italian dessert's name means 'cooked cream'?", ["semifreddo", "zabaglione", "panna cotta", "tiramisu"], "panna cotta", 1),
		// https://en.wikipedia.org/wiki/Gelato
		q("Which Italian frozen dessert is made with less air and fat than ice cream?", ["spumoni", "sorbet", "gelato", "granita"], "gelato", 1),
		// https://en.wikipedia.org/wiki/Granita
		q("Which icy Sicilian dessert is made with flavored crystals of ice?", ["granita", "gelato", "semifreddo", "sorbet"], "granita", 1),
	],
	arts: [
		// https://en.wikipedia.org/wiki/El_Greco
		q("Which Greek-born painter worked in Toledo, Spain, and is known by a nickname?", ["Velázquez", "El Greco", "Zurbarán", "Goya"], "El Greco", 1),
		// https://en.wikipedia.org/wiki/Peter_Paul_Rubens
		q("Which Flemish painter is known for full-figured women in Baroque art?", ["Peter Paul Rubens", "Anthony van Dyck", "Hans Memling", "Jan Brueghel"], "Peter Paul Rubens", 1),
		// https://en.wikipedia.org/wiki/The_Blue_Boy
		q("Which English painter is known for The Blue Boy?", ["William Hogarth", "Joshua Reynolds", "John Constable", "Thomas Gainsborough"], "Thomas Gainsborough", 1),
		// https://en.wikipedia.org/wiki/Portrait_of_Madame_X
		q("Which American portraitist painted the scandalous Madame X?", ["Mary Cassatt", "John Singer Sargent", "James Whistler", "Thomas Eakins"], "John Singer Sargent", 1),
		// https://en.wikipedia.org/wiki/Mary_Cassatt
		q("Which American Impressionist is known for mothers and children?", ["Berthe Morisot", "Georgia O'Keeffe", "Mary Cassatt", "Grandma Moses"], "Mary Cassatt", 1),
		// https://en.wikipedia.org/wiki/Paul_Gauguin
		q("Which French post-Impressionist painted in Tahiti?", ["Paul Gauguin", "Georges Seurat", "Henri Matisse", "Paul Cézanne"], "Paul Gauguin", 1),
		// https://en.wikipedia.org/wiki/Henri_Matisse
		q("Which French painter was a leader of Fauvism, known for bold color and paper cut-outs?", ["André Derain", "Henri Matisse", "Raoul Dufy", "Paul Gauguin"], "Henri Matisse", 1),
		// https://en.wikipedia.org/wiki/Paul_Cézanne
		q("Which French painter is famous for still lifes of apples and Mont Sainte-Victoire?", ["Camille Pissarro", "Pierre Bonnard", "Paul Cézanne", "Claude Monet"], "Paul Cézanne", 1),
		// https://en.wikipedia.org/wiki/Alphonse_Mucha
		q("Which Czech artist is famous for Art Nouveau posters of women?", ["Gustav Klimt", "Egon Schiele", "Toulouse-Lautrec", "Alphonse Mucha"], "Alphonse Mucha", 1),
		// https://en.wikipedia.org/wiki/Art_Nouveau
		q("Which art style uses flowing plant-like lines, popular around 1900?", ["Bauhaus", "Art Nouveau", "Art Deco", "Baroque"], "Art Nouveau", 1),
		// https://en.wikipedia.org/wiki/Bauhaus
		q("Which German design school was founded by Walter Gropius in 1919?", ["Ulm School", "Werkbund", "De Stijl", "Bauhaus"], "Bauhaus", 1),
		// https://en.wikipedia.org/wiki/Gothic_architecture
		q("Which architectural style features pointed arches and flying buttresses?", ["Neoclassical", "Baroque", "Romanesque", "Gothic"], "Gothic", 1),
		// https://en.wikipedia.org/wiki/Dada
		q("Which art movement was born in Zurich during WWI and embraced nonsense?", ["Cubism", "Surrealism", "Futurism", "Dada"], "Dada", 1),
		// https://en.wikipedia.org/wiki/Fountain_(Duchamp)
		q("Which artist put a urinal in a gallery and called it Fountain?", ["Salvador Dalí", "Francis Picabia", "Man Ray", "Marcel Duchamp"], "Marcel Duchamp", 1),
		// https://en.wikipedia.org/wiki/Cloud_Gate
		q("Which artist made a giant stainless-steel 'Bean' in Chicago?", ["Jeff Koons", "Anish Kapoor", "Claes Oldenburg", "Richard Serra"], "Anish Kapoor", 1),
		// https://en.wikipedia.org/wiki/Damien_Hirst
		q("Which British artist preserved a shark in formaldehyde?", ["Antony Gormley", "Banksy", "Damien Hirst", "Tracey Emin"], "Damien Hirst", 1),
		// https://en.wikipedia.org/wiki/Angel_of_the_North
		q("Which sculptor made the Angel of the North?", ["Henry Moore", "Anish Kapoor", "Barbara Hepworth", "Antony Gormley"], "Antony Gormley", 1),
		// https://en.wikipedia.org/wiki/Yayoi_Kusama
		q("Which Japanese artist is famous for polka dots and infinity rooms?", ["Hokusai", "Takashi Murakami", "Yayoi Kusama", "Yoko Ono"], "Yayoi Kusama", 1),
		// https://en.wikipedia.org/wiki/Christo_and_Jeanne-Claude
		q("Which artist duo wrapped the Reichstag in fabric?", ["The Starn Twins", "Bernd and Hilla Becher", "Christo and Jeanne-Claude", "Gilbert and George"], "Christo and Jeanne-Claude", 1),
		// https://en.wikipedia.org/wiki/Keith_Haring
		q("Which artist is known for bold 'radiant baby' figures and subway chalk drawings?", ["Shepard Fairey", "Keith Haring", "Jean-Michel Basquiat", "Banksy"], "Keith Haring", 1),
		// https://en.wikipedia.org/wiki/Barack_Obama_"Hope"_poster
		q("Which artist made the 'Hope' poster of Barack Obama?", ["Kehinde Wiley", "Banksy", "Shepard Fairey", "Keith Haring"], "Shepard Fairey", 1),
		// https://en.wikipedia.org/wiki/Kehinde_Wiley
		q("Which artist painted Barack Obama's official portrait?", ["Kehinde Wiley", "Chuck Close", "Amy Sherald", "Shepard Fairey"], "Kehinde Wiley", 1),
		// https://en.wikipedia.org/wiki/Ansel_Adams
		q("Which photographer is famous for black-and-white Yosemite landscapes?", ["Dorothea Lange", "Ansel Adams", "Annie Leibovitz", "Richard Avedon"], "Ansel Adams", 1),
		// https://en.wikipedia.org/wiki/The_Sleeping_Beauty_(ballet)
		q("Which ballet by Tchaikovsky is about a princess cursed to sleep?", ["Swan Lake", "The Nutcracker", "Giselle", "The Sleeping Beauty"], "The Sleeping Beauty", 1),
		// https://en.wikipedia.org/wiki/Giselle
		q("Which romantic ballet is about a peasant girl who dies of a broken heart?", ["Swan Lake", "Coppélia", "La Sylphide", "Giselle"], "Giselle", 1),
		// https://en.wikipedia.org/wiki/Peter_and_the_Wolf
		q("Which Prokofiev work introduces orchestra instruments as animal characters?", ["Pictures at an Exhibition", "Carnival of the Animals", "Peter and the Wolf", "The Firebird"], "Peter and the Wolf", 1),
		// https://en.wikipedia.org/wiki/The_Carnival_of_the_Animals
		q("Which composer wrote The Carnival of the Animals?", ["Georges Bizet", "Maurice Ravel", "Camille Saint-Saëns", "Claude Debussy"], "Camille Saint-Saëns", 1),
		// https://en.wikipedia.org/wiki/Eine_kleine_Nachtmusik
		q("Which composer wrote Eine kleine Nachtmusik?", ["Joseph Haydn", "Franz Schubert", "Wolfgang Amadeus Mozart", "Ludwig van Beethoven"], "Wolfgang Amadeus Mozart", 1),
		// https://en.wikipedia.org/wiki/1812_Overture
		q("Which composer wrote the 1812 Overture, famous for its cannons?", ["Sergei Rachmaninoff", "Mikhail Glinka", "Pyotr Ilyich Tchaikovsky", "Modest Mussorgsky"], "Pyotr Ilyich Tchaikovsky", 1),
		// https://en.wikipedia.org/wiki/Ride_of_the_Valkyries
		q("Which composer wrote Ride of the Valkyries?", ["Gustav Mahler", "Richard Strauss", "Richard Wagner", "Anton Bruckner"], "Richard Wagner", 1),
		// https://en.wikipedia.org/wiki/Also_sprach_Zarathustra_(Strauss)
		q("Which composer wrote Also sprach Zarathustra, used in 2001: A Space Odyssey?", ["Johann Strauss II", "Richard Wagner", "Gustav Mahler", "Richard Strauss"], "Richard Strauss", 1),
		// https://en.wikipedia.org/wiki/Wedding_March_(Mendelssohn)
		q("Which composer wrote the Wedding March often played at weddings' end?", ["Johann Pachelbel", "Richard Wagner", "Felix Mendelssohn", "Edward Elgar"], "Felix Mendelssohn", 1),
		// https://en.wikipedia.org/wiki/Pachelbel's_Canon
		q("Which composer wrote a famous Canon in D?", ["Antonio Vivaldi", "Johann Pachelbel", "Johann Sebastian Bach", "George Frideric Handel"], "Johann Pachelbel", 1),
		// https://en.wikipedia.org/wiki/Hungarian_Rhapsodies_(Liszt)
		q("Which composer wrote Hungarian Rhapsodies for piano?", ["Johannes Brahms", "Franz Liszt", "Béla Bartók", "Zoltán Kodály"], "Franz Liszt", 1),
		// https://en.wikipedia.org/wiki/Hungarian_Dances_(Brahms)
		q("Which composer wrote the Hungarian Dances?", ["Antonín Dvořák", "Béla Bartók", "Johannes Brahms", "Franz Liszt"], "Johannes Brahms", 1),
		// https://en.wikipedia.org/wiki/The_Entertainer_(rag)
		q("Which ragtime composer wrote The Entertainer?", ["Scott Joplin", "James Scott", "Eubie Blake", "Jelly Roll Morton"], "Scott Joplin", 1),
		// https://en.wikipedia.org/wiki/Food,_Glorious_Food
		q("Which musical features 'Food, Glorious Food'?", ["Matilda", "Les Misérables", "Annie", "Oliver!"], "Oliver!", 1),
		// https://en.wikipedia.org/wiki/Climb_Ev'ry_Mountain
		q("Which musical features 'Climb Ev'ry Mountain'?", ["Oklahoma!", "The Sound of Music", "The King and I", "South Pacific"], "The Sound of Music", 1),
		// https://en.wikipedia.org/wiki/Shall_We_Dance%3F_(The_King_and_I_song)
		q("Which musical features 'Shall We Dance?' sung in Siam?", ["South Pacific", "Anything Goes", "The King and I", "Carousel"], "The King and I", 1),
		// https://en.wikipedia.org/wiki/Oh,_What_a_Beautiful_Mornin'
		q("Which musical features 'Oh, What a Beautiful Mornin''?", ["Show Boat", "Oklahoma!", "Carousel", "Annie Get Your Gun"], "Oklahoma!", 1),
		// https://en.wikipedia.org/wiki/Ol'_Man_River
		q("Which musical features 'Ol' Man River'?", ["Porgy and Bess", "Oklahoma!", "Show Boat", "Carousel"], "Show Boat", 1),
		// https://en.wikipedia.org/wiki/Summertime_(George_Gershwin_song)
		q("Which opera by Gershwin includes 'Summertime'?", ["Show Boat", "Of Thee I Sing", "Porgy and Bess", "Funny Face"], "Porgy and Bess", 1),
		// https://en.wikipedia.org/wiki/A_Raisin_in_the_Sun
		q("Which play by Lorraine Hansberry was the first by a Black woman on Broadway?", ["Fences", "The Piano Lesson", "For Colored Girls", "A Raisin in the Sun"], "A Raisin in the Sun", 1),
		// https://en.wikipedia.org/wiki/Fences_(play)
		q("Which August Wilson play stars garbage collector Troy Maxson?", ["Jitney", "The Piano Lesson", "Fences", "Seven Guitars"], "Fences", 1),
		// https://en.wikipedia.org/wiki/Our_Town
		q("Which Thornton Wilder play is set in Grover's Corners?", ["Picnic", "The Matchmaker", "Our Town", "The Skin of Our Teeth"], "Our Town", 1),
		// https://en.wikipedia.org/wiki/Pygmalion_(play)
		q("Which George Bernard Shaw play inspired My Fair Lady?", ["Man and Superman", "Major Barbara", "Saint Joan", "Pygmalion"], "Pygmalion", 1),
		// https://en.wikipedia.org/wiki/A_Doll's_House
		q("Which Henrik Ibsen play ends with Nora leaving her husband?", ["Peer Gynt", "A Doll's House", "Hedda Gabler", "Ghosts"], "A Doll's House", 1),
		// https://en.wikipedia.org/wiki/The_Cherry_Orchard
		q("Which Chekhov play is set on an estate with an orchard about to be sold?", ["The Cherry Orchard", "Uncle Vanya", "The Seagull", "Three Sisters"], "The Cherry Orchard", 1),
		// https://en.wikipedia.org/wiki/Oedipus_Rex
		q("Which ancient Greek playwright wrote Oedipus Rex?", ["Aeschylus", "Sophocles", "Euripides", "Aristophanes"], "Sophocles", 1),
		// https://en.wikipedia.org/wiki/Aristophanes
		q("Which Greek playwright wrote comedies like The Frogs and Lysistrata?", ["Euripides", "Aristophanes", "Sophocles", "Menander"], "Aristophanes", 1),
		// https://en.wikipedia.org/wiki/Aeneid
		q("Which Roman poet wrote the Aeneid?", ["Virgil", "Horace", "Ovid", "Homer"], "Virgil", 1),
	],
	science: [
		// https://en.wikipedia.org/wiki/Appendix_(anatomy)
		q("Which small organ hangs off the large intestine and may need removal if inflamed?", ["tonsil", "gallbladder", "appendix", "spleen"], "appendix", 1),
		// https://en.wikipedia.org/wiki/Esophagus
		q("Which tube carries food from the mouth to the stomach?", ["larynx", "duodenum", "trachea", "esophagus"], "esophagus", 1),
		// https://en.wikipedia.org/wiki/Trachea
		q("Which tube carries air to the lungs?", ["bronchiole", "esophagus", "trachea", "pharynx"], "trachea", 1),
		// https://en.wikipedia.org/wiki/Thoracic_diaphragm
		q("Which muscle under the lungs helps you breathe?", ["abdominal", "intercostal", "diaphragm", "pectoral"], "diaphragm", 1),
		// https://en.wikipedia.org/wiki/Cerebrum
		q("Which is the largest part of the human brain?", ["cerebellum", "cerebrum", "thalamus", "brainstem"], "cerebrum", 1),
		// https://en.wikipedia.org/wiki/Vein
		q("Which blood vessels carry blood back to the heart?", ["arteries", "capillaries", "arterioles", "veins"], "veins", 1),
		// https://en.wikipedia.org/wiki/Stapes
		q("Which is the smallest bone in the human body?", ["malleus", "stapes", "coccyx", "incus"], "stapes", 1),
		// https://en.wikipedia.org/wiki/Thyroid
		q("Which gland in the neck controls metabolism?", ["pituitary", "thyroid", "thymus", "adrenal"], "thyroid", 1),
		// https://en.wikipedia.org/wiki/Pituitary_gland
		q("Which 'master gland' sits at the base of the brain?", ["adrenal", "pineal", "pituitary", "thyroid"], "pituitary", 1),
		// https://en.wikipedia.org/wiki/Blood_type
		q("What is the most common blood type in the world?", ["B+", "O+", "A+", "AB-"], "O+", 1),
		// https://en.wikipedia.org/wiki/Mitochondrion
		q("Which part of the cell is called the 'powerhouse'?", ["ribosome", "nucleus", "mitochondria", "chloroplast"], "mitochondria", 1),
		// https://en.wikipedia.org/wiki/Chloroplast
		q("Which part of plant cells carries out photosynthesis?", ["vacuole", "chloroplast", "mitochondrion", "nucleus"], "chloroplast", 1),
		// https://en.wikipedia.org/wiki/Osmosis
		q("What is the movement of water through a membrane called?", ["osmosis", "diffusion", "mitosis", "transpiration"], "osmosis", 1),
		// https://en.wikipedia.org/wiki/Condensation
		q("What is it called when water vapor turns into liquid?", ["evaporation", "condensation", "sublimation", "precipitation"], "condensation", 1),
		// https://en.wikipedia.org/wiki/Dry_ice
		q("Which solid form of carbon dioxide sublimates at room temperature?", ["hail", "dry ice", "frost", "snow"], "dry ice", 1),
		// https://en.wikipedia.org/wiki/Sodium_bicarbonate
		q("What is the common name for sodium bicarbonate?", ["baking soda", "table salt", "chalk", "bleach"], "baking soda", 1),
		// https://en.wikipedia.org/wiki/Limestone
		q("What is the common name for calcium carbonate rock formed from shells?", ["slate", "basalt", "limestone", "granite"], "limestone", 1),
		// https://en.wikipedia.org/wiki/Nitrous_oxide
		q("What is the common name for nitrous oxide?", ["marsh gas", "swamp gas", "laughing gas", "tear gas"], "laughing gas", 1),
		// https://en.wikipedia.org/wiki/Methane
		q("Which gas is known as 'marsh gas'?", ["propane", "ethane", "ammonia", "methane"], "methane", 1),
		// https://en.wikipedia.org/wiki/Chlorine
		q("Which yellow-green gas was used in WWI and to disinfect pools?", ["ammonia", "chlorine", "fluorine", "bromine"], "chlorine", 1),
		// https://en.wikipedia.org/wiki/Aluminium
		q("Which metal is the most abundant in Earth's crust?", ["aluminium", "iron", "calcium", "copper"], "aluminium", 1),
		// https://en.wikipedia.org/wiki/Silicon
		q("Which element is the main component of sand and glass?", ["carbon", "silicon", "sodium", "calcium"], "silicon", 1),
		// https://en.wikipedia.org/wiki/Lithium
		q("Which metal is used in batteries for phones and electric cars?", ["lithium", "zinc", "lead", "nickel"], "lithium", 1),
		// https://en.wikipedia.org/wiki/Rust
		q("What is the name for rust's chemical process?", ["reduction", "fusion", "oxidation", "fermentation"], "oxidation", 1),
		// https://en.wikipedia.org/wiki/Hygrometer
		q("Which instrument measures humidity?", ["barometer", "anemometer", "hygrometer", "altimeter"], "hygrometer", 1),
		// https://en.wikipedia.org/wiki/Microscope
		q("Which instrument makes tiny things look bigger?", ["periscope", "telescope", "microscope", "stethoscope"], "microscope", 1),
		// https://en.wikipedia.org/wiki/Stethoscope
		q("Which instrument do doctors use to listen to the heart?", ["otoscope", "endoscope", "sphygmomanometer", "stethoscope"], "stethoscope", 1),
		// https://en.wikipedia.org/wiki/Visible_spectrum
		q("Which color of visible light has the shortest wavelength?", ["violet", "yellow", "red", "orange"], "violet", 1),
		// https://en.wikipedia.org/wiki/Primary_color
		q("What are the three primary colors of light?", ["red, blue, white", "red, green, blue", "red, yellow, blue", "cyan, magenta, yellow"], "red, green, blue", 1),
		// https://en.wikipedia.org/wiki/Sound
		q("Which kind of wave is sound?", ["transverse", "surface", "longitudinal", "electromagnetic"], "longitudinal", 1),
		// https://en.wikipedia.org/wiki/Sound
		q("Can sound travel through a vacuum?", ["only high notes", "no", "only low notes", "yes"], "no", 1),
		// https://en.wikipedia.org/wiki/Decibel
		q("What unit measures loudness?", ["decibel", "hertz", "watt", "lumen"], "decibel", 1),
		// https://en.wikipedia.org/wiki/Friction
		q("What force slows a sliding object?", ["gravity", "inertia", "friction", "buoyancy"], "friction", 1),
		// https://en.wikipedia.org/wiki/Buoyancy
		q("What is the upward force on objects in water called?", ["lift", "buoyancy", "tension", "friction"], "buoyancy", 1),
		// https://en.wikipedia.org/wiki/Inertia
		q("What is an object's resistance to changing its motion called?", ["friction", "gravity", "inertia", "momentum"], "inertia", 1),
		// https://en.wikipedia.org/wiki/Neutron
		q("Which particle has no electric charge and sits in the nucleus?", ["positron", "proton", "electron", "neutron"], "neutron", 1),
		// https://en.wikipedia.org/wiki/Photon
		q("Which particle is a 'packet' of light?", ["electron", "photon", "neutrino", "quark"], "photon", 1),
	],
	history: [
		// https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza
		q("Which Egyptian pharaoh is linked to the Great Pyramid of Giza?", ["Tutankhamun", "Ramesses II", "Khufu", "Djoser"], "Khufu", 1),
		// https://en.wikipedia.org/wiki/Pyramid_of_Djoser
		q("Which pharaoh built the Step Pyramid at Saqqara?", ["Sneferu", "Khufu", "Menkaure", "Djoser"], "Djoser", 1),
		// https://en.wikipedia.org/wiki/Hatshepsut
		q("Which female pharaoh ruled Egypt in the 1400s BC?", ["Cleopatra", "Nefertari", "Nefertiti", "Hatshepsut"], "Hatshepsut", 1),
		// https://en.wikipedia.org/wiki/Mesopotamia
		q("Which two rivers bordered ancient Mesopotamia?", ["Indus and Ganges", "Nile and Jordan", "Tigris and Euphrates", "Danube and Rhine"], "Tigris and Euphrates", 1),
		// https://en.wikipedia.org/wiki/Cuneiform
		q("Which writing system did the Sumerians invent?", ["cuneiform", "hieroglyphs", "Linear B", "runes"], "cuneiform", 1),
		// https://en.wikipedia.org/wiki/Code_of_Hammurabi
		q("Which Babylonian king is famous for an early law code?", ["Cyrus", "Sargon", "Hammurabi", "Nebuchadnezzar II"], "Hammurabi", 1),
		// https://en.wikipedia.org/wiki/Cyrus_the_Great
		q("Which Persian king founded the Achaemenid Empire?", ["Darius I", "Cambyses II", "Cyrus the Great", "Xerxes I"], "Cyrus the Great", 1),
		// https://en.wikipedia.org/wiki/Herodotus
		q("Which Greek historian is called the 'Father of History'?", ["Xenophon", "Plutarch", "Thucydides", "Herodotus"], "Herodotus", 1),
		// https://en.wikipedia.org/wiki/Socrates
		q("Which ancient Greek philosopher was sentenced to drink hemlock?", ["Plato", "Aristotle", "Diogenes", "Socrates"], "Socrates", 1),
		// https://en.wikipedia.org/wiki/Aristotle
		q("Which philosopher tutored Alexander the Great?", ["Plato", "Pythagoras", "Socrates", "Aristotle"], "Aristotle", 1),
		// https://en.wikipedia.org/wiki/Battle_of_Thermopylae
		q("Which battle in 480 BC saw 300 Spartans hold a pass?", ["Salamis", "Plataea", "Thermopylae", "Marathon"], "Thermopylae", 1),
		// https://en.wikipedia.org/wiki/Pythia
		q("Which Greek oracle was the most famous in the ancient world?", ["Dodona", "Siwa", "Delphi", "Olympia"], "Delphi", 1),
		// https://en.wikipedia.org/wiki/Trojan_Horse
		q("Which wooden trick let the Greeks enter Troy?", ["Trojan Horse", "Trojan Ship", "Trojan Bull", "Trojan Gate"], "Trojan Horse", 1),
		// https://en.wikipedia.org/wiki/Assassination_of_Julius_Caesar
		q("Which Roman leader was assassinated on the Ides of March, 44 BC?", ["Julius Caesar", "Augustus", "Mark Antony", "Pompey"], "Julius Caesar", 1),
		// https://en.wikipedia.org/wiki/Colosseum
		q("Which Roman amphitheater hosted gladiator fights in Rome?", ["Forum", "Pantheon", "Circus Maximus", "Colosseum"], "Colosseum", 1),
		// https://en.wikipedia.org/wiki/Pantheon,_Rome
		q("Which Roman temple in Rome has a famous unreinforced concrete dome?", ["Colosseum", "Basilica Julia", "Pantheon", "Temple of Saturn"], "Pantheon", 1),
		// https://en.wikipedia.org/wiki/Constantinople
		q("Which city became the capital of the Eastern Roman Empire?", ["Alexandria", "Athens", "Constantinople", "Antioch"], "Constantinople", 1),
		// https://en.wikipedia.org/wiki/Istanbul
		q("What is Constantinople called today?", ["Izmir", "Istanbul", "Ankara", "Bursa"], "Istanbul", 1),
		// https://en.wikipedia.org/wiki/Mehmed_II
		q("Which Ottoman sultan conquered Constantinople?", ["Suleiman the Magnificent", "Osman I", "Mehmed II", "Selim I"], "Mehmed II", 1),
		// https://en.wikipedia.org/wiki/Attila
		q("Which Hun leader was called the 'Scourge of God'?", ["Alaric", "Odoacer", "Genghis Khan", "Attila"], "Attila", 1),
		// https://en.wikipedia.org/wiki/Charlemagne
		q("Which Frankish king was crowned emperor in 800?", ["Clovis", "Pepin the Short", "Charlemagne", "Charles Martel"], "Charlemagne", 1),
		// https://en.wikipedia.org/wiki/Vikings
		q("Which seafaring raiders from Scandinavia attacked Europe from the late 700s?", ["Normans", "Vikings", "Saxons", "Goths"], "Vikings", 1),
		// https://en.wikipedia.org/wiki/Domesday_Book
		q("Which 1086 survey recorded land and property in England?", ["Domesday Book", "Anglo-Saxon Chronicle", "Book of Kells", "Magna Carta"], "Domesday Book", 1),
		// https://en.wikipedia.org/wiki/Richard_I_of_England
		q("Which English king was called the Lionheart?", ["Richard I", "Henry II", "John", "Edward I"], "Richard I", 1),
		// https://en.wikipedia.org/wiki/Robin_Hood
		q("Which outlaw legend robbed the rich to give to the poor in Sherwood Forest?", ["Ned Kelly", "Robin Hood", "Rob Roy", "Dick Turpin"], "Robin Hood", 1),
		// https://en.wikipedia.org/wiki/Hundred_Years'_War
		q("Which war between England and France lasted from 1337 to 1453?", ["Seven Years' War", "Thirty Years' War", "Hundred Years' War", "Wars of the Roses"], "Hundred Years' War", 1),
		// https://en.wikipedia.org/wiki/Wars_of_the_Roses
		q("Which English civil wars were fought between the houses of Lancaster and York?", ["English Civil War", "Hundred Years' War", "Wars of the Roses", "Glorious Revolution"], "Wars of the Roses", 1),
		// https://en.wikipedia.org/wiki/Oliver_Cromwell
		q("Who led Parliament's forces in the English Civil War and became Lord Protector?", ["Charles I", "John Pym", "Thomas Fairfax", "Oliver Cromwell"], "Oliver Cromwell", 1),
		// https://en.wikipedia.org/wiki/Charles_I_of_England
		q("Which English king was executed in 1649?", ["Charles I", "James II", "James I", "Charles II"], "Charles I", 1),
		// https://en.wikipedia.org/wiki/Gunpowder_Plot
		q("Which 1605 plot tried to blow up the English Parliament?", ["Babington Plot", "Popish Plot", "Gunpowder Plot", "Rye House Plot"], "Gunpowder Plot", 1),
		// https://en.wikipedia.org/wiki/Queen_Victoria
		q("Which queen ruled Britain for most of the 1800s?", ["Mary II", "Victoria", "Elizabeth II", "Anne"], "Victoria", 1),
		// https://en.wikipedia.org/wiki/Great_Exhibition
		q("Which 1851 exhibition was held in London's Crystal Palace?", ["Great Exhibition", "World's Fair", "Festival of Britain", "Expo 51"], "Great Exhibition", 1),
		// https://en.wikipedia.org/wiki/Clara_Barton
		q("Who founded the American Red Cross?", ["Mary Seacole", "Florence Nightingale", "Dorothea Dix", "Clara Barton"], "Clara Barton", 1),
		// https://en.wikipedia.org/wiki/Samuel_Morse
		q("Who invented the code of dots and dashes for the telegraph?", ["Thomas Edison", "Guglielmo Marconi", "Alexander Graham Bell", "Samuel Morse"], "Samuel Morse", 1),
		// https://en.wikipedia.org/wiki/Charles_Lindbergh
		q("Who made the first solo nonstop flight across the Atlantic in 1927?", ["Wiley Post", "Howard Hughes", "Amelia Earhart", "Charles Lindbergh"], "Charles Lindbergh", 1),
		// https://en.wikipedia.org/wiki/Ford_Model_T
		q("Which Ford car, made from 1908, put America on wheels?", ["Model T", "Model A", "Thunderbird", "Mustang"], "Model T", 1),
		// https://en.wikipedia.org/wiki/Prohibition_in_the_United_States
		q("Which 1920s US ban made alcohol illegal?", ["Dry Act", "Temperance Law", "Volstead Act", "Prohibition"], "Prohibition", 1),
		// https://en.wikipedia.org/wiki/Emmeline_Pankhurst
		q("Which British activist led the suffragettes?", ["Emily Davison", "Emmeline Pankhurst", "Virginia Woolf", "Millicent Fawcett"], "Emmeline Pankhurst", 1),
		// https://en.wikipedia.org/wiki/Dust_Bowl
		q("Which 1930s US disaster saw dust storms ravage the Great Plains?", ["Great Flood", "Black Blizzard", "Dust Bowl", "Panic of 1937"], "Dust Bowl", 1),
		// https://en.wikipedia.org/wiki/Little_Boy
		q("Which bomb was dropped on Hiroshima in 1945?", ["Trinity", "Fat Man", "Tsar Bomba", "Little Boy"], "Little Boy", 1),
		// https://en.wikipedia.org/wiki/Marshall_Plan
		q("Which plan helped rebuild Western Europe after World War II?", ["Dawes Plan", "Marshall Plan", "Truman Plan", "Monroe Plan"], "Marshall Plan", 1),
		// https://en.wikipedia.org/wiki/United_Nations
		q("Which organization was founded in 1945 to keep world peace?", ["United Nations", "European Union", "League of Nations", "NATO"], "United Nations", 1),
		// https://en.wikipedia.org/wiki/Korean_War
		q("Which war was fought on a peninsula from 1950 to 1953?", ["Gulf War", "Korean War", "Crimean War", "Vietnam War"], "Korean War", 1),
		// https://en.wikipedia.org/wiki/Fidel_Castro
		q("Which leader of Cuba's revolution ruled from 1959?", ["Raúl Castro", "Fidel Castro", "Che Guevara", "Fulgencio Batista"], "Fidel Castro", 1),
		// https://en.wikipedia.org/wiki/Solidarity_(Polish_trade_union)
		q("Which Polish trade union led by Lech Wałęsa challenged communist rule?", ["Freedom", "Unity", "Workers' Front", "Solidarity"], "Solidarity", 1),
		// https://en.wikipedia.org/wiki/Chernobyl_disaster
		q("Which nuclear plant disaster happened in Ukraine in 1986?", ["Chernobyl", "Three Mile Island", "Fukushima", "Windscale"], "Chernobyl", 1),
		// https://en.wikipedia.org/wiki/Euro
		q("Which currency did the EU launch in 1999?", ["euro", "ecu", "mark", "franc"], "euro", 1),
		// https://en.wikipedia.org/wiki/Transfer_of_sovereignty_over_Hong_Kong
		q("Which British colony returned to China in 1997?", ["Hong Kong", "Macau", "Taiwan", "Singapore"], "Hong Kong", 1),
		// https://en.wikipedia.org/wiki/Transfer_of_sovereignty_over_Macau
		q("Which colony returned from Portugal to China in 1999?", ["Goa", "Hong Kong", "Macau", "Timor"], "Macau", 1),
		// https://en.wikipedia.org/wiki/Panama_Canal
		q("Which canal opened in 1914 to link the Atlantic and Pacific?", ["Erie Canal", "Kiel Canal", "Suez Canal", "Panama Canal"], "Panama Canal", 1),
		// https://en.wikipedia.org/wiki/Pony_Express
		q("Which mail service used relay horse riders across the West in 1860–61?", ["Butterfield Stage", "Overland Mail", "Pony Express", "Wells Fargo"], "Pony Express", 1),
		// https://en.wikipedia.org/wiki/Oregon_Trail
		q("Which trail took settlers from Missouri to the Pacific Northwest?", ["Santa Fe Trail", "Chisholm Trail", "Oregon Trail", "Mormon Trail"], "Oregon Trail", 1),
		// https://en.wikipedia.org/wiki/Sitting_Bull
		q("Which Lakota leader fought at Little Bighorn?", ["Sitting Bull", "Chief Joseph", "Geronimo", "Cochise"], "Sitting Bull", 1),
		// https://en.wikipedia.org/wiki/Geronimo
		q("Which Apache leader resisted US and Mexican forces until 1886?", ["Red Cloud", "Sitting Bull", "Geronimo", "Crazy Horse"], "Geronimo", 1),
		// https://en.wikipedia.org/wiki/George_Armstrong_Custer
		q("Which US general died at the Battle of the Little Bighorn?", ["William Sherman", "Ulysses Grant", "Philip Sheridan", "George Custer"], "George Custer", 1),
		// https://en.wikipedia.org/wiki/Ellis_Island
		q("Which New York island processed millions of immigrants from 1892?", ["Ellis Island", "Staten Island", "Governors Island", "Liberty Island"], "Ellis Island", 1),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Elephant
		q("What is a baby elephant called?", ["cub", "calf", "pup", "foal"], "calf", 1),
		// https://en.wikipedia.org/wiki/Pinniped
		q("What is a baby seal called?", ["kit", "calf", "pup", "cub"], "pup", 1),
		// https://en.wikipedia.org/wiki/Beaver
		q("What is a baby beaver called?", ["cub", "kit", "joey", "pup"], "kit", 1),
		// https://en.wikipedia.org/wiki/Squab_(food)
		q("What is a baby pigeon called?", ["squab", "cygnet", "chick", "fledgling"], "squab", 1),
		// https://en.wikipedia.org/wiki/Filly
		q("What is a young female horse called?", ["filly", "foal", "colt", "mare"], "filly", 1),
		// https://en.wikipedia.org/wiki/Colt_(horse)
		q("What is a young male horse called?", ["filly", "colt", "stallion", "gelding"], "colt", 1),
		// https://en.wikipedia.org/wiki/Pig
		q("What is a male pig called?", ["sow", "hog", "boar", "gilt"], "boar", 1),
		// https://en.wikipedia.org/wiki/Pig
		q("What is a female pig called?", ["sow", "boar", "hog", "gilt"], "sow", 1),
		// https://en.wikipedia.org/wiki/Sheep
		q("What is a male sheep called?", ["buck", "wether", "ram", "ewe"], "ram", 1),
		// https://en.wikipedia.org/wiki/Sheep
		q("What is a female sheep called?", ["doe", "nanny", "ewe", "ram"], "ewe", 1),
		// https://en.wikipedia.org/wiki/Rooster
		q("What is a male chicken called in the US?", ["hen", "capon", "rooster", "pullet"], "rooster", 1),
		// https://en.wikipedia.org/wiki/Wombat
		q("Which Australian marsupial has cube-shaped droppings?", ["wombat", "koala", "wallaby", "kangaroo"], "wombat", 1),
		// https://en.wikipedia.org/wiki/Quokka
		q("Which small Australian marsupial is famous for 'smiling' selfies?", ["bilby", "numbat", "quokka", "wombat"], "quokka", 1),
		// https://en.wikipedia.org/wiki/Zebra
		q("Which striped African animal is a close relative of the horse?", ["gnu", "antelope", "zebra", "okapi"], "zebra", 1),
		// https://en.wikipedia.org/wiki/Okapi
		q("Which forest animal from Congo has zebra-like striped legs but is related to the giraffe?", ["okapi", "bongo", "tapir", "zebra duiker"], "okapi", 1),
		// https://en.wikipedia.org/wiki/Blue_wildebeest
		q("Which large African antelope migrates in huge herds across the Serengeti?", ["kudu", "wildebeest", "gazelle", "impala"], "wildebeest", 1),
		// https://en.wikipedia.org/wiki/Orangutan
		q("Which red-haired great ape lives in Borneo and Sumatra?", ["gibbon", "bonobo", "orangutan", "gorilla"], "orangutan", 1),
		// https://en.wikipedia.org/wiki/Sloth
		q("Which slow-moving mammal hangs upside down in rainforest trees?", ["koala", "lemur", "sloth", "tapir"], "sloth", 1),
		// https://en.wikipedia.org/wiki/Alpaca
		q("Which South American animal is related to the camel and has soft wool?", ["alpaca", "tapir", "capybara", "guinea pig"], "alpaca", 1),
		// https://en.wikipedia.org/wiki/Peafowl
		q("Which bird has a famous colorful tail fan?", ["pheasant", "turkey", "peacock", "parrot"], "peacock", 1),
		// https://en.wikipedia.org/wiki/Peregrine_falcon
		q("Which bird is the fastest animal on Earth in a dive?", ["peregrine falcon", "golden eagle", "osprey", "swift"], "peregrine falcon", 1),
		// https://en.wikipedia.org/wiki/Woodpecker
		q("Which bird pecks holes in tree trunks?", ["woodpecker", "wren", "nuthatch", "kingfisher"], "woodpecker", 1),
		// https://en.wikipedia.org/wiki/White_stork
		q("Which wading bird is often shown delivering babies?", ["stork", "crane", "heron", "pelican"], "stork", 1),
		// https://en.wikipedia.org/wiki/Owl
		q("Which bird is known for its 'hoo-hoo' call at night?", ["dove", "nightjar", "owl", "cuckoo"], "owl", 1),
		// https://en.wikipedia.org/wiki/Goldfish
		q("Which big orange fish is a popular pet in bowls?", ["betta", "goldfish", "guppy", "koi"], "goldfish", 1),
		// https://en.wikipedia.org/wiki/Hammerhead_shark
		q("Which shark has a head shaped like a hammer?", ["tiger shark", "mako", "nurse shark", "hammerhead"], "hammerhead", 1),
		// https://en.wikipedia.org/wiki/Blue_whale
		q("What tiny crustaceans do blue whales mainly eat?", ["shrimp", "krill", "squid", "sand crabs"], "krill", 1),
		// https://en.wikipedia.org/wiki/Galápagos_tortoise
		q("Which reptile can live over 150 years and lives on the Galápagos?", ["crocodile", "giant tortoise", "marine iguana", "leatherback turtle"], "giant tortoise", 1),
		// https://en.wikipedia.org/wiki/Leatherback_sea_turtle
		q("Which turtle is the largest living species?", ["green sea turtle", "leatherback", "hawksbill", "loggerhead"], "leatherback", 1),
		// https://en.wikipedia.org/wiki/Alligator
		q("Which reptile is native to China and the US's southeastern swamps?", ["gharial", "caiman", "alligator", "crocodile"], "alligator", 1),
		// https://en.wikipedia.org/wiki/Gharial
		q("Which crocodilian has a long thin snout and lives in India?", ["mugger", "alligator", "gharial", "caiman"], "gharial", 1),
		// https://en.wikipedia.org/wiki/Axolotl
		q("Which amphibian can regrow its limbs and stays aquatic, from Mexico?", ["newt", "axolotl", "salamander", "toad"], "axolotl", 1),
		// https://en.wikipedia.org/wiki/Maple
		q("Which tree is famous for its fall leaves on Canada's flag?", ["elm", "oak", "birch", "maple"], "maple", 1),
		// https://en.wikipedia.org/wiki/Bodhi_Tree
		q("Which tree is sacred in Buddhism because the Buddha meditated under one?", ["teak", "bodhi tree", "banyan", "lotus tree"], "bodhi tree", 1),
		// https://en.wikipedia.org/wiki/Theobroma_cacao
		q("Which tree gives us chocolate's beans?", ["coffee", "cacao", "kola", "carob"], "cacao", 1),
		// https://en.wikipedia.org/wiki/Morus_alba
		q("Which tree's leaves are the only food of silkworms?", ["mulberry", "fig", "oak", "maple"], "mulberry", 1),
		// https://en.wikipedia.org/wiki/Remembrance_poppy
		q("Which flower is associated with remembering war dead in Britain?", ["poppy", "lily", "daisy", "rose"], "poppy", 1),
		// https://en.wikipedia.org/wiki/Bellis_perennis
		q("Which flower's name means 'eye of the day'?", ["marigold", "daisy", "dandelion", "sunflower"], "daisy", 1),
		// https://en.wikipedia.org/wiki/Taraxacum
		q("Which weed's seeds float away on fluffy 'clocks'?", ["clover", "dandelion", "nettle", "thistle"], "dandelion", 1),
		// https://en.wikipedia.org/wiki/Toxicodendron_radicans
		q("Which plant causes an itchy rash when touched in North America?", ["stinging nettle", "ragweed", "poison ivy", "thistle"], "poison ivy", 1),
		// https://en.wikipedia.org/wiki/Four-leaf_clover
		q("Which plant has four-leaf versions considered lucky?", ["shamrock fern", "clover", "ivy", "oxalis"], "clover", 1),
		// https://en.wikipedia.org/wiki/Amorphophallus_titanum
		q("Which famously large flower smells like rotting meat?", ["lotus", "corpse flower", "bird of paradise", "protea"], "corpse flower", 1),
	],
	math: [
		// https://en.wikipedia.org/wiki/Heptagon
		q("How many sides does a heptagon have?", ["6", "9", "8", "7"], "7", 1),
		// https://en.wikipedia.org/wiki/Regular_dodecahedron
		q("How many faces does a dodecahedron have?", ["8", "10", "12", "20"], "12", 2),
		// https://en.wikipedia.org/wiki/Regular_icosahedron
		q("How many faces does an icosahedron have?", ["24", "16", "20", "12"], "20", 2),
		// https://en.wikipedia.org/wiki/Roman_numerals
		q("What is the Roman numeral for 50?", ["X", "C", "D", "L"], "L", 1),
		// https://en.wikipedia.org/wiki/Roman_numerals
		q("What is the Roman numeral for 100?", ["M", "L", "D", "C"], "C", 1),
		// https://en.wikipedia.org/wiki/Roman_numerals
		q("What is the Roman numeral for 500?", ["C", "L", "D", "M"], "D", 1),
		// https://en.wikipedia.org/wiki/Roman_numerals
		q("What is the Roman numeral for 1,000?", ["D", "C", "M", "K"], "M", 1),
		// https://en.wikipedia.org/wiki/Multiplication_table
		q("What is 7 times 8?", ["64", "56", "48", "54"], "56", 1),
		// https://en.wikipedia.org/wiki/Multiplication_table
		q("What is 9 times 7?", ["63", "56", "81", "72"], "63", 1),
		// https://en.wikipedia.org/wiki/Percentage
		q("What is 3/4 written as a percentage?", ["34%", "43%", "75%", "70%"], "75%", 1),
		// https://en.wikipedia.org/wiki/Fraction
		q("What is 0.2 written as a fraction in lowest terms?", ["2/5", "1/20", "1/5", "1/2"], "1/5", 2),
		// https://en.wikipedia.org/wiki/Fibonacci_sequence
		q("What is the next Fibonacci number after 13 and 21?", ["42", "29", "34", "33"], "34", 2),
		// https://en.wikipedia.org/wiki/Factorial
		q("What is 0 factorial (0!)?", ["0", "10", "1", "undefined"], "1", 2),
		// https://en.wikipedia.org/wiki/Pi
		q("What is the value of pi to two decimal places?", ["3.41", "3.14", "3.12", "3.16"], "3.14", 1),
		// https://en.wikipedia.org/wiki/Equilateral_triangle
		q("What do you call a triangle with all three sides equal?", ["isosceles", "scalene", "equilateral", "right"], "equilateral", 1),
		// https://en.wikipedia.org/wiki/Triangle
		q("What do you call a triangle with no equal sides?", ["acute", "scalene", "equilateral", "isosceles"], "scalene", 1),
		// https://en.wikipedia.org/wiki/Angle
		q("What do you call an angle greater than 90° but less than 180°?", ["obtuse", "right", "reflex", "acute"], "obtuse", 1),
		// https://en.wikipedia.org/wiki/Angle
		q("What do you call an angle smaller than 90°?", ["straight", "obtuse", "acute", "reflex"], "acute", 1),
		// https://en.wikipedia.org/wiki/Diameter
		q("What is the distance across a circle through its center called?", ["diameter", "radius", "chord", "circumference"], "diameter", 1),
		// https://en.wikipedia.org/wiki/Quotient
		q("What is the answer to a division problem called?", ["difference", "sum", "quotient", "product"], "quotient", 1),
		// https://en.wikipedia.org/wiki/Product_(mathematics)
		q("What is the answer to a multiplication problem called?", ["product", "sum", "quotient", "factor"], "product", 1),
		// https://en.wikipedia.org/wiki/Fraction
		q("What is the bottom number of a fraction called?", ["numerator", "divisor", "denominator", "quotient"], "denominator", 1),
		// https://en.wikipedia.org/wiki/Fraction
		q("What is the top number of a fraction called?", ["exponent", "dividend", "numerator", "denominator"], "numerator", 1),
		// https://en.wikipedia.org/wiki/Median
		q("What is the median of 3, 9, 4, 7 and 1?", ["4", "5", "9", "7"], "4", 2),
		// https://en.wikipedia.org/wiki/Litre
		q("How many milliliters are in one liter?", ["100", "1,000", "500", "10"], "1,000", 1),
		// https://en.wikipedia.org/wiki/Mile
		q("How many yards are in a mile?", ["1,500", "5,280", "1,760", "2,000"], "1,760", 2),
		// https://en.wikipedia.org/wiki/Century
		q("How many years are in a century?", ["1,000", "100", "50", "10"], "100", 1),
		// https://en.wikipedia.org/wiki/Millennium
		q("How many years are in a millennium?", ["10,000", "1,000", "500", "100"], "1,000", 1),
		// https://en.wikipedia.org/wiki/Rhombus
		q("How many sides does a rhombus have?", ["4", "5", "3", "6"], "4", 1),
		// https://en.wikipedia.org/wiki/Division_(mathematics)
		q("What is half of 250?", ["150", "115", "120", "125"], "125", 1),
		// https://en.wikipedia.org/wiki/Binary_number
		q("What is the decimal number 7 in binary?", ["1000", "111", "110", "101"], "111", 2),
		// https://en.wikipedia.org/wiki/Hexadecimal
		q("In base 16, which letter stands for 15?", ["D", "E", "F", "G"], "F", 2),
	],
};
