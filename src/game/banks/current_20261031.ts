import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * 0.1.93 current-events batch (researched 2026-10-31; sources in docs/trivia-current-20261031-sources.md).
 * Settled events from roughly Sept 29 - Oct 31, 2026, every prompt time-anchored. No math (over deck cap).
 * Drafts were fact-level dup-checked against the whole deck (scripts/trivia-dupcheck.mjs), incl. current_20261021.
 */

export const CUR_BOOKS_20261031: TriviaQ[] = [
	// https://www.nationalbook.org/2026-national-book-award-finalists-announced/
	q("Which Norwegian author's 'The School of Night' was a 2026 National Book Award finalist?", ["Jo Nesbø", "Karl Ove Knausgaard", "Lars Saabye Christensen", "Per Petterson"], "Karl Ove Knausgaard", 2),
	// https://www.nationalbook.org/2026-national-book-award-finalists-announced/
	q("Who will receive the National Book Foundation's 2026 lifetime medal (DCAL), announced in Oct 2026?", ["Salman Rushdie", "Toni Morrison", "Joyce Carol Oates", "Cormac McCarthy"], "Salman Rushdie", 2),
	// https://www.nationalbook.org/2026-national-book-award-finalists-announced/
	q("Which translator rendered Knausgaard's 2026 finalist 'The School of Night' into English?", ["Jo Nesbø", "Martin Aitken", "Lars Saabye Christensen", "Per Petterson"], "Martin Aitken", 3),
];

export const CUR_FOOD_20261031: TriviaQ[] = [
	// https://www.guinnessworldrecords.com/news/commercial/2026/10/guatemalan-chefs-prepare-over-4000-lb-of-meat-and-veggies-for-the-largest-fiambre-salad
	q("In Oct 2026 Guatemalan chefs set a Guinness record for the largest serving of which dish?", ["pepián", "fiambre", "tamales", "kak'ik"], "fiambre", 2),
	// https://www.guinnessworldrecords.com/news/commercial/2026/10/guatemalan-chefs-prepare-over-4000-lb-of-meat-and-veggies-for-the-largest-fiambre-salad
	q("The record fiambre salad made in Guatemala in Oct 2026 weighed about…", ["1,326 lb", "4,326 lb", "6,326 lb", "2,326 lb"], "4,326 lb", 3),
	// https://www.guinnessworldrecords.com/news/commercial/2026/10/guatemalan-chefs-prepare-over-4000-lb-of-meat-and-veggies-for-the-largest-fiambre-salad
	q("Guatemala's fiambre, record-set in Oct 2026, is traditionally eaten around…", ["Easter", "Independence Day", "Christmas", "All Saints Day"], "All Saints Day", 2),
	// https://www.guinnessworldrecords.com/news/commercial/2026/10/not-a-food-truck-a-food-semi-moving-smoker-in-texas-breaks-record-as-largest-ever
	q("In Oct 2026 Guinness named a barbecue rig from Texas the world's largest…", ["tailgate trailer", "pizza oven", "food truck", "smoker grill"], "food truck", 2),
	// https://www.guinnessworldrecords.com/news/commercial/2026/10/not-a-food-truck-a-food-semi-moving-smoker-in-texas-breaks-record-as-largest-ever
	q("The record-setting food truck certified in Oct 2026 measured about how long?", ["96 ft", "76 ft", "56 ft", "46 ft"], "76 ft", 3),
	// https://www.guinnessworldrecords.com/news/commercial/2026/10/guatemalan-chefs-prepare-over-4000-lb-of-meat-and-veggies-for-the-largest-fiambre-salad
	q("Which company organized Guatemala's record fiambre salad in Oct 2026?", ["Toledo Alimentos", "Pollo Campero", "Cervecería Centro Americana", "Grupo Gloria"], "Toledo Alimentos", 3),
	// https://www.guinnessworldrecords.com/news/commercial/2026/10/not-a-food-truck-a-food-semi-moving-smoker-in-texas-breaks-record-as-largest-ever
	q("The Texas food truck certified a Guinness record in Oct 2026 is called the Ultimate…", ["Brisket Wagon", "Smoker & Grill", "BBQ Rig", "Pit & Pantry"], "Smoker & Grill", 2),
];

export const CUR_GAMES_20261031: TriviaQ[] = [
	// https://www.nintendoworldreport.com/review/77645/final-fantasy-resonance-switch-2-review
	q("Final Fantasy Resonance, released Oct 22, 2026, came out on which console?", ["Xbox Series X", "Steam Deck", "PlayStation 5", "Nintendo Switch 2"], "Nintendo Switch 2", 1),
	// https://www.nintendoworldreport.com/review/77645/final-fantasy-resonance-switch-2-review
	q("Final Fantasy Resonance (Oct 2026) uses which visual style also seen in Octopath Traveler?", ["voxel art", "cel-shaded 3D", "HD-2D", "full-motion video"], "HD-2D", 2),
	// https://www.nintendoworldreport.com/review/77645/final-fantasy-resonance-switch-2-review
	q("Final Fantasy Resonance (Oct 2026) grew out of which mobile game?", ["Dissidia Opera Omnia", "Mobius Final Fantasy", "Final Fantasy Brave Exvius", "Final Fantasy Record Keeper"], "Final Fantasy Brave Exvius", 3),
	// https://www.nintendoworldreport.com/review/77645/final-fantasy-resonance-switch-2-review
	q("What is the name of the knight who leads Final Fantasy Resonance (Oct 2026)?", ["Lasswell", "Rain", "Cecil", "Noctis"], "Rain", 3),
	// https://www.nintendoworldreport.com/review/77645/final-fantasy-resonance-switch-2-review
	q("In Final Fantasy Resonance (Oct 2026), hero Rain is a knight of which kingdom?", ["Cornelia", "Alexandria", "Burmecia", "Grandshelt"], "Grandshelt", 3),
	// https://www.nintendoworldreport.com/review/77645/final-fantasy-resonance-switch-2-review
	q("Final Fantasy Resonance (Oct 2026) uses which kind of combat?", ["card-battle", "turn-based", "real-time action", "rhythm-based"], "turn-based", 1),
];

export const CUR_GEOGRAPHY_20261031: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/List_of_earthquakes_in_2026
	q("A magnitude 7.7 earthquake struck which Central American country on Oct 9, 2026?", ["Nicaragua", "Panama", "Costa Rica", "Guatemala"], "Panama", 1),
	// https://en.wikipedia.org/wiki/List_of_earthquakes_in_2026
	q("The Oct 22, 2026 magnitude 7.0 earthquake struck which Chinese region?", ["Xinjiang", "Yunnan", "Tibet", "Sichuan"], "Tibet", 2),
	// https://en.wikipedia.org/wiki/List_of_earthquakes_in_2026
	q("A swarm of strong earthquakes in late Oct 2026 struck offshore of which Pacific nation's Sanma province?", ["Samoa", "Fiji", "Tonga", "Vanuatu"], "Vanuatu", 2),
];

export const CUR_HISTORY_20261031: TriviaQ[] = [
	// https://www.bbc.com/news/articles/c6gr80rk1yyko
	q("Divers in Oct 2026 found the Kekova wreck's cargo of storage jars called…", ["kraters", "pithoi", "amphorae", "urns"], "amphorae", 2),
	// https://www.nationalgeographic.com/history/article/hittites-cuneiform-tablets-discovery
	q("In Oct 2026, 131 cuneiform tablets of which ancient empire were announced from Kayalıpınar?", ["Babylonian", "Persian", "Assyrian", "Hittite"], "Hittite", 2),
	// https://www.nationalgeographic.com/history/article/hittites-cuneiform-tablets-discovery
	q("The Hittite tablets announced in Oct 2026 date to the reign of King…", ["Tudhaliya II", "Muršili II", "Hattusili III", "Suppiluliuma I"], "Tudhaliya II", 3),
	// https://www.nationalgeographic.com/history/article/hittites-cuneiform-tablets-discovery
	q("The Oct 2026 Hittite tablet find describes an epidemic that killed a baby…", ["priest", "prince", "queen", "princess"], "princess", 2),
	// https://www.nationalgeographic.com/history/article/hittites-cuneiform-tablets-discovery
	q("The Hittite city at Kayalıpınar, whose tablets were announced in Oct 2026, was called…", ["Šamuḫa", "Karkemish", "Hattusa", "Kanesh"], "Šamuḫa", 3),
	// https://www.bbc.com/news/articles/c6gr80rk1yyko
	q("The Kekova wreck reported in Oct 2026 lies off which Turkish province?", ["İzmir", "Mersin", "Muğla", "Antalya"], "Antalya", 2),
];

export const CUR_MUSIC_20261031: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/List_of_Billboard_200_number-one_albums_of_2026
	q("Whose album 'Bass Persuades' debuted at No. 1 on the Billboard 200 chart dated Oct 3, 2026?", ["Sabrina Carpenter", "Ariana Grande", "Miley Cyrus", "Dua Lipa"], "Miley Cyrus", 1),
	// https://en.wikipedia.org/wiki/List_of_Billboard_200_number-one_albums_of_2026
	q("Taylor Swift's album that returned to No. 1 in Oct 2026 after an encore reissue is…", ["Folklore", "Midnights", "The Life of a Showgirl", "The Tortured Poets Department"], "The Life of a Showgirl", 2),
	// https://en.wikipedia.org/wiki/List_of_Billboard_200_number-one_albums_of_2026
	q("Whose album 'You Seem Pretty Sad for a Girl So in Love' returned to No. 1 on the Billboard 200 dated Oct 31, 2026?", ["Sabrina Carpenter", "Gracie Abrams", "Billie Eilish", "Olivia Rodrigo"], "Olivia Rodrigo", 2),
	// https://en.wikipedia.org/wiki/List_of_Billboard_200_number-one_albums_of_2026
	q("How many weeks at No. 1 did 'The Life of a Showgirl' reach on the Billboard 200 by mid-Oct 2026?", ["15", "12", "10", "20"], "15", 3),
];

export const CUR_NATURE_20261031: TriviaQ[] = [
	// https://www.ucl.ac.uk/news/2026/oct/new-crocodile-species-discovered-rocks-used-build-great-sphinx
	q("A fossil gavial named Herugavialis, described in Oct 2026, came from the same rock as which monument?", ["Karnak", "the Great Pyramid", "the Great Sphinx", "Abu Simbel"], "the Great Sphinx", 2),
	// https://www.ucl.ac.uk/news/2026/oct/new-crocodile-species-discovered-rocks-used-build-great-sphinx
	q("Herugavialis cairensis, named in Oct 2026, lived about how many million years ago?", ["145", "45", "4.5", "450"], "45", 2),
	// https://www.popsci.com/environment/backpack-fat-bear-week-winner-2026/
	q("Fat Bear Week 2026 champion Backpack is the son of which past champion?", ["747", "32 Chunk", "480 Otis", "435 Holly"], "435 Holly", 2),
	// https://www.ucl.ac.uk/news/2026/oct/new-crocodile-species-discovered-rocks-used-build-great-sphinx
	q("Herugavialis, described in Oct 2026, was named after which Egyptian god?", ["Heru", "Anubis", "Sobek", "Thoth"], "Heru", 2),
	// https://www.ucl.ac.uk/news/2026/oct/new-crocodile-species-discovered-rocks-used-build-great-sphinx
	q("Herugavialis fossils described in Oct 2026 were first misidentified as which living species?", ["Nile crocodile", "saltwater crocodile", "false gharial", "mugger crocodile"], "false gharial", 3),
];

export const CUR_POLITICAL_20261031: TriviaQ[] = [
	// https://www.bbc.com/news/articles/ckm23y3mg1yyo
	q("Who won Brazil's Oct 25, 2026 presidential runoff?", ["Tarcísio de Freitas", "Simone Tebet", "Flávio Bolsonaro", "Lula"], "Lula", 1),
	// https://www.bbc.com/news/articles/ckm23y3mg1yyo
	q("Lula's Oct 2026 runoff win made him the first Brazilian elected president how many times?", ["Three", "Four", "Two", "Five"], "Four", 2),
	// https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/eleicoes-2026-painel-registra-manifestacoes-e-saudacoes-de-mais-de-cem-paises-apos-2o-turno
	q("About what share of valid votes did Lula win in Brazil's Oct 2026 runoff?", ["53.9%", "50.2%", "51.8%", "55.1%"], "51.8%", 2),
	// https://www.bbc.com/news/articles/ckm23y3mg1yyo
	q("Brazilian president Lula's new term, won in Oct 2026, is set to run until…", ["2030", "2029", "2028", "2031"], "2030", 2),
	// https://www.scotusblog.com/2026/10/opening-the-book-on-the-october-term-2026/
	q("The U.S. Supreme Court's October 2026 term opened with a climate case brought by which Colorado county?", ["El Paso County", "Boulder County", "Larimer County", "Denver County"], "Boulder County", 2),
	// https://www.scotusblog.com/2026/10/opening-the-book-on-the-october-term-2026/
	q("Which justice stepped aside from the Oct 2026 Suncor climate case at the Supreme Court?", ["Clarence Thomas", "Neil Gorsuch", "Samuel Alito", "Brett Kavanaugh"], "Samuel Alito", 2),
	// https://www.scotusblog.com/2026/10/opening-the-book-on-the-october-term-2026/
	q("Which energy company was the lead petitioner in the Supreme Court's first argued case of Oct 2026?", ["Suncor", "Shell", "BP", "Chevron"], "Suncor", 2),
	// https://www.bbc.com/news/articles/ckm23y3mg1yyo
	q("Lula's Oct 2026 win made him Brazil's first president since 1985 to win after doing what?", ["losing a recall", "losing round one", "skipping debates", "switching parties"], "losing round one", 2),
	// https://www.bbc.com/news/articles/ckm23y3mg1yyo
	q("Lula's Oct 2026 runoff opponent Flávio Bolsonaro is the son of…", ["Jair Bolsonaro", "Hamilton Mourão", "Fernando Collor", "Michel Temer"], "Jair Bolsonaro", 1),
];

export const CUR_SCIENCE_20261031: TriviaQ[] = [
	// https://www.nasa.gov/blogs/spacestation/2026/10/01/liftoff-nasas-spacex-crew-13-begins-journey-to-international-space-station/
	q("NASA's SpaceX Crew-13 launched to the International Space Station on which date in 2026?", ["Sept 21", "Oct 11", "Oct 21", "Oct 1"], "Oct 1", 1),
	// https://www.nasa.gov/blogs/spacestation/2026/10/01/liftoff-nasas-spacex-crew-13-begins-journey-to-international-space-station/
	q("Which agency's astronaut Joshua Kutryk flew on SpaceX Crew-13 in Oct 2026?", ["UK Space Agency", "European Space Agency", "Canadian Space Agency", "JAXA"], "Canadian Space Agency", 2),
	// https://www.nasa.gov/blogs/spacestation/2026/10/01/liftoff-nasas-spacex-crew-13-begins-journey-to-international-space-station/
	q("SpaceX Crew-13 launched in Oct 2026 from which Florida site?", ["Boca Chica", "Wallops Island", "Cape Canaveral", "Vandenberg"], "Cape Canaveral", 1),
	// https://www.nasa.gov/blogs/spacestation/2026/10/01/liftoff-nasas-spacex-crew-13-begins-journey-to-international-space-station/
	q("Which Roscosmos cosmonaut flew on SpaceX Crew-13 in Oct 2026?", ["Sergey Prokopyev", "Anna Kikina", "Sergey Teteryatnikov", "Oleg Kononenko"], "Sergey Teteryatnikov", 3),
	// https://www.nhc.noaa.gov/archive/2026/al09/al092026.update.10100129.shtml?text=
	q("Hurricane Isaias hit Florida in Oct 2026 with top sustained winds of about…", ["105 mph", "125 mph", "145 mph", "85 mph"], "105 mph", 2),
	// https://www.nasa.gov/blogs/spacestation/2026/10/01/liftoff-nasas-spacex-crew-13-begins-journey-to-international-space-station/
	q("Which two NASA astronauts flew on SpaceX Crew-13 in Oct 2026?", ["Watkins and Delaney", "Moghbeli and Delaney", "Watkins and Hague", "Hague and Moghbeli"], "Watkins and Delaney", 2),
];

export const CUR_SPORTS_20261031: TriviaQ[] = [
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Who won the men's Ballon d'Or at the Oct 2026 ceremony?", ["Kylian Mbappé", "Harry Kane", "Lamine Yamal", "Bukayo Saka"], "Harry Kane", 1),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Who won the women's Ballon d'Or in Oct 2026?", ["Aitana Bonmatí", "Mariona Caldentey", "Alexia Putellas", "Caroline Graham Hansen"], "Alexia Putellas", 1),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("The Oct 2026 Ballon d'Or ceremony was held at which London venue?", ["London Palladium", "Royal Albert Hall", "Wembley Arena", "O2 Arena"], "London Palladium", 2),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("In Oct 2026, Harry Kane won the Ballon d'Or while playing for which club?", ["Arsenal", "Real Madrid", "Tottenham", "Bayern Munich"], "Bayern Munich", 2),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Which club won the men's Club of the Season award at the Oct 2026 Ballon d'Or?", ["Manchester City", "Borussia Dortmund", "Bayern Munich", "Paris Saint-Germain"], "Paris Saint-Germain", 2),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Who won the men's Young Talent (Kopa) award at the Oct 2026 Ballon d'Or?", ["Lamine Yamal", "Désiré Doué", "Pau Cubarsí", "Endrick"], "Lamine Yamal", 2),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Which goalkeeper won the men's Goalkeeper of the Season award in Oct 2026?", ["Thibaut Courtois", "Unai Simón", "Gianluigi Donnarumma", "David Raya"], "Unai Simón", 3),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Who won the Sócrates Award at the Oct 2026 Ballon d'Or?", ["Marcus Rashford", "Bukayo Saka", "Jude Bellingham", "Declan Rice"], "Bukayo Saka", 2),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Which coach won the men's Coach of the Season award at the Oct 2026 Ballon d'Or?", ["Luis Enrique", "Hansi Flick", "Thomas Tuchel", "Luis de la Fuente"], "Luis de la Fuente", 3),
	// https://www.bbc.com/sport/formula1/articles/cm20w8154wn0o
	q("Who won the F1 United States Grand Prix in Austin on Oct 25, 2026?", ["Max Verstappen", "Charles Leclerc", "Kimi Antonelli", "George Russell"], "Kimi Antonelli", 1),
	// https://www.bbc.com/sport/formula1/articles/cm20w8154wn0o
	q("Who finished second at the Oct 2026 F1 United States Grand Prix?", ["Lewis Hamilton", "Charles Leclerc", "Lando Norris", "Max Verstappen"], "Charles Leclerc", 2),
	// https://www.bbc.com/sport/formula1/articles/cm20w8154wn0o
	q("Kimi Antonelli, winner of the Oct 2026 US Grand Prix, drives for…", ["McLaren", "Mercedes", "Ferrari", "Red Bull"], "Mercedes", 2),
	// https://worldathletics.org/news/report/feysa-kipruto-2026-chicago-marathon
	q("Who won the men's race at the Oct 11, 2026 Chicago Marathon?", ["Amos Kipruto", "Tadese Bikila", "Milkesa Mengesha", "Jacob Kiplimo"], "Amos Kipruto", 2),
	// https://worldathletics.org/news/report/feysa-kipruto-2026-chicago-marathon
	q("Who won the women's race at the Oct 2026 Chicago Marathon?", ["Hawi Feysa", "Brigid Kosgei", "Sharon Lokedi", "Joan Kilimo"], "Hawi Feysa", 2),
	// https://worldathletics.org/news/report/feysa-kipruto-2026-chicago-marathon
	q("The Oct 2026 Chicago Marathon was the first marathon where how many women broke 2:15?", ["Four", "Three", "Five", "Two"], "Three", 3),
	// https://worldathletics.org/news/report/feysa-kipruto-2026-chicago-marathon
	q("Amos Kipruto won the Oct 2026 Chicago Marathon in what time?", ["2:03:46", "2:01:09", "2:02:56", "2:00:35"], "2:01:09", 3),
	// https://www.mlb.com/news/jake-bauers-wins-2026-nlcs-mvp
	q("Who was named 2026 NLCS MVP after the Brewers swept the Dodgers?", ["Jake Bauers", "Christian Yelich", "William Contreras", "Jackson Chourio"], "Jake Bauers", 2),
	// https://www.mlb.com/news/freddy-peralta-wins-2026-alcs-mvp
	q("Who was named 2026 ALCS MVP for the Tampa Bay Rays?", ["Junior Caminero", "Freddy Peralta", "Shane McClanahan", "Yandy Díaz"], "Freddy Peralta", 2),
	// https://www.mlb.com/news/brewers-beat-rays-game-5-win-2026-world-series
	q("The Brewers clinched the 2026 World Series in Game 5 at which ballpark?", ["American Family Field", "Dodger Stadium", "Tropicana Field", "Steinbrenner Field"], "Tropicana Field", 2),
	// https://www.mlb.com/news/brewers-win-world-series-2026
	q("Before the 2026 Brewers, Milwaukee's last World Series champion was the 1957…", ["Hawks", "Braves", "Brewers", "Pilots"], "Braves", 2),
	// https://www.mlb.com/news/brewers-win-world-series-2026
	q("Which Brewers rookie set a World Series rookie record with six straight hits in 2026?", ["Jackson Chourio", "David Hamilton", "Cooper Pratt", "Brice Turang"], "Cooper Pratt", 3),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Who won the women's Top Scorer award at the Oct 2026 Ballon d'Or?", ["Charlyn Corral", "Alessia Russo", "Khadija Shaw", "Ewa Pajor"], "Charlyn Corral", 3),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Which club won the women's Club of the Season award at the Oct 2026 Ballon d'Or?", ["Arsenal Women", "OL Lyonnes", "Chelsea Women", "FC Barcelona"], "FC Barcelona", 2),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("Harry Kane also took which Oct 2026 Ballon d'Or prize besides the main award?", ["Top Goalscorer", "Sócrates Award", "Coach of the Season", "Goalkeeper"], "Top Goalscorer", 2),
	// https://ballondor.com/news/posts/alexia-putellas-and-harry-kane-winners-of-the-70th-ballon-dor
	q("The Oct 2026 Ballon d'Or ceremony marked which edition of the award?", ["75th", "60th", "70th", "65th"], "70th", 2),
	// https://worldathletics.org/news/report/feysa-kipruto-2026-chicago-marathon
	q("Which runner set the fastest marathon debut by a U.S. woman at the Oct 2026 Chicago Marathon?", ["Emma Grace Hurley", "Emily Sisson", "Keira D'Amato", "Sara Hall"], "Emma Grace Hurley", 3),
	// https://worldathletics.org/news/report/feysa-kipruto-2026-chicago-marathon
	q("Hawi Feysa, Oct 2026 Chicago Marathon winner, runs for which country?", ["Ethiopia", "Uganda", "Kenya", "Eritrea"], "Ethiopia", 2),
	// https://www.mlb.com/news/brewers-win-world-series-2026
	q("Which Brewers pitcher started their 2026 World Series clincher with 5 2/3 scoreless innings?", ["Brandon Woodruff", "Freddy Peralta", "Trevor Megill", "Jacob Misiorowski"], "Jacob Misiorowski", 2),
];

