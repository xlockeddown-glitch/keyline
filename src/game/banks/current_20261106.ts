import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * 0.1.131 current-events batch (researched 2026-11-06; sources in docs/trivia-current-20261106-sources.md).
 * Settled events from roughly Oct 6 – Nov 6, 2026, every prompt time-anchored. No math (over deck cap).
 * Drafts fact-level dup-checked against the whole deck (scripts/trivia-dupcheck.mjs), incl. current_20261031 and plus_20261103e.
 */

export const CUR_SPORTS_20261106: TriviaQ[] = [
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("In Oct 2026, Lionel Messi received which Spanish honor for sports?", ["Ballon d'Or", "Laureus World Sports Award", "Princess of Asturias Award", "Golden Foot Award"], "Princess of Asturias Award", 2),
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Lionel Messi's 2026 Princess of Asturias Award for Sports was presented in which Spanish city?", ["Seville", "Madrid", "Barcelona", "Oviedo"], "Oviedo", 3),
];

export const CUR_POLITICAL_20261106: TriviaQ[] = [
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("In the Nov 2026 midterms, who was elected Georgia's governor?", ["Stacey Abrams", "Rick Jackson", "Raphael Warnock", "Keisha Lance Bottoms"], "Keisha Lance Bottoms", 1),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("In Nov 2026, Keisha Lance Bottoms became the first Black woman elected…", ["U.S. vice president", "Speaker of the House", "U.S. senator", "U.S. governor"], "U.S. governor", 1),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("Which Republican won Florida's governorship in the Nov 2026 midterms?", ["Ron DeSantis", "Rick Scott", "David Jolly", "Byron Donalds"], "Byron Donalds", 2),
	// https://www.npr.org/2026/11/04/nx-s1-6028546/governor-candidates-history-election-2026
	q("In Nov 2026, Deb Haaland was elected governor of which state?", ["Montana", "Oklahoma", "Arizona", "New Mexico"], "New Mexico", 1),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("In Nov 2026, Democrat David Crowley won the governorship of…", ["Iowa", "Wisconsin", "Minnesota", "Michigan"], "Wisconsin", 2),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("Aaron Ford won which state's governorship in the Nov 2026 midterms?", ["Utah", "Colorado", "Nevada", "Arizona"], "Nevada", 2),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("In Nov 2026, Wes Moore won reelection as governor of…", ["Maryland", "Delaware", "Pennsylvania", "Virginia"], "Maryland", 2),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("In Nov 2026 midterms coverage, Byron Donalds became Florida's first Black…", ["senator", "governor", "attorney general", "chief justice"], "governor", 2),
	// https://www.usatoday.com/story/news/politics/elections/2026/11/03/keisha-lance-bottoms-byron-donalds-historic-election-day/92599430007/
	q("In Nov 2026 midterm reporting, Hakeem Jeffries was widely discussed as likely to become the first Black…", ["Supreme Court justice", "Senate majority leader", "Speaker of the House", "Attorney General"], "Speaker of the House", 2),
	// https://www.usatoday.com/story/news/politics/elections/2026/11/03/keisha-lance-bottoms-byron-donalds-historic-election-day/92599430007/
	q("Peggy Flanagan made history in the Nov 2026 midterms as the first Native American woman elected…", ["U.S. governor", "U.S. representative only", "U.S. senator", "cabinet secretary"], "U.S. senator", 2),
	// https://www.usatoday.com/story/news/politics/elections/2026/11/03/keisha-lance-bottoms-byron-donalds-historic-election-day/92599430007/
	q("Chris Pappas won a U.S. Senate seat in the Nov 2026 midterms and was noted as the first openly gay man elected…", ["Speaker of the House", "U.S. senator", "U.S. governor", "Supreme Court justice"], "U.S. senator", 2),
	// https://apnews.com/article/georgia-governor-lance-bottom-jackson-midterm-election-67c22a38b9a6e4cad5584aa44acf106f
	q("In Nov 2026, Keisha Lance Bottoms defeated which Republican billionaire for Georgia governor?", ["Herschel Walker", "Brian Kemp", "Rick Jackson", "David Perdue"], "Rick Jackson", 2),
	// https://www.npr.org/2026/11/04/nx-s1-6028546/governor-candidates-history-election-2026
	q("Deb Haaland, elected New Mexico governor in Nov 2026, previously served as U.S. secretary of the…", ["Interior", "Agriculture", "State", "Energy"], "Interior", 2),
	// https://www.usatoday.com/story/news/politics/elections/2026/11/03/keisha-lance-bottoms-byron-donalds-historic-election-day/92599430007/
	q("In the Nov 2026 midterms, Illinois was noted for electing Julianna Stratton alongside Tammy Duckworth, giving the state two…", ["women of color in the Senate", "Asian American governors", "Native American senators", "Black House Speakers"], "women of color in the Senate", 3),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("After the Nov 2026 midterms, reporting cited a record-high number of women governors nationwide at about…", ["12", "17", "20", "9"], "17", 3),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("Byron Donalds, elected Florida governor in Nov 2026, is a…", ["Democrat", "Green", "Independent", "Republican"], "Republican", 1),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("David Crowley, elected Wisconsin governor in Nov 2026, is a…", ["Libertarian", "Democrat", "Independent", "Republican"], "Democrat", 2),
	// https://www.cbsnews.com/news/2026-midterm-elections-governors-races-bottoms-donalds-crowley-moore-ford/
	q("In Nov 2026 coverage, Wes Moore reflected that before the midterms he had been the only…", ["Black U.S. governor", "woman governor", "Asian American governor", "Latino U.S. governor"], "Black U.S. governor", 2),	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In the Nov 2026 midterms, who was elected Ohio's governor?", ["Mike DeWine", "Jim Jordan", "Vivek Ramaswamy", "Amy Acton"], "Amy Acton", 1),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In Nov 2026, Amy Acton defeated which Republican for Ohio governor?", ["J.D. Vance", "Mike DeWine", "Vivek Ramaswamy", "Jim Jordan"], "Vivek Ramaswamy", 1),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026, Amy Acton became the first woman elected governor of…", ["Indiana", "Ohio", "Michigan", "Pennsylvania"], "Ohio", 1),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In the Nov 2026 midterms, who was elected Texas governor?", ["Greg Abbott", "Ken Paxton", "Beto O'Rourke", "Gina Hinojosa"], "Gina Hinojosa", 1),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In Nov 2026, Gina Hinojosa defeated which three-term Texas governor?", ["Rick Perry", "Greg Abbott", "George W. Bush", "Dan Patrick"], "Greg Abbott", 1),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("Gina Hinojosa's Nov 2026 win made her Texas's first…", ["woman governor", "Hispanic governor", "Republican governor", "independent governor"], "Hispanic governor", 2),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("As of Nov 2026 reporting, Gina Hinojosa was the first Democrat elected Texas governor since…", ["2002", "2014", "1990", "1982"], "1990", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In the Nov 2026 midterms, who won a U.S. Senate seat in Texas?", ["Ted Cruz", "Ken Paxton", "Beto O'Rourke", "James Talarico"], "James Talarico", 1),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026, James Talarico defeated which Texas attorney general for the U.S. Senate?", ["Greg Abbott", "Dan Patrick", "Ken Paxton", "John Cornyn"], "Ken Paxton", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In Nov 2026, Annie Andrews was elected U.S. senator from…", ["North Carolina", "Georgia", "South Carolina", "Virginia"], "South Carolina", 1),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("Annie Andrews's Nov 2026 win made her South Carolina's first woman…", ["governor", "U.S. senator", "attorney general", "House Speaker"], "U.S. senator", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In Nov 2026, Annie Andrews defeated which South Carolina Republican for the U.S. Senate?", ["Tim Scott", "Ralph Norman", "Darline Graham", "Nancy Mace"], "Darline Graham", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("As of Nov 2026 reporting, Annie Andrews was the first Democrat elected to South Carolina's U.S. Senate seat since…", ["2004", "2010", "1998", "1986"], "1998", 3),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026, Marsha Blackburn was elected governor of…", ["Kentucky", "Alabama", "Tennessee", "Mississippi"], "Tennessee", 2),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026, Amy Klobuchar was elected governor of…", ["Wisconsin", "Iowa", "Minnesota", "Michigan"], "Minnesota", 1),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("Deb Haaland's Nov 2026 New Mexico win made her the first Native American woman…", ["U.S. senator", "U.S. governor", "House Speaker", "Supreme Court justice"], "U.S. governor", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("After the Nov 2026 midterms, Arizona, New Mexico, and Texas were all set to be governed by…", ["Republican men", "Democratic women", "independent governors", "term-limited mayors"], "Democratic women", 2),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In the Nov 2026 midterms, which party won control of the U.S. House?", ["Republicans", "the Greens", "Independents", "Democrats"], "Democrats", 1),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("Besides the House, which other chamber of Congress did Democrats win in the Nov 2026 midterms?", ["the Cabinet", "the Supreme Court", "the Senate", "state legislatures alone"], "the Senate", 1),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("As of early Nov 2026 reporting, Democrats were projected to hold about how many U.S. Senate seats?", ["48", "51", "54", "60"], "54", 2),
	// https://www.reuters.com/graphics/US-ELECTIONS/GRAPHICS-BLOG/akpelkldzvr/
	q("As of early Nov 2026 reporting, Democrats were projected to hold about how many U.S. House seats?", ["218", "230", "250", "280"], "250", 2),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026 midterm coverage, Democrats were reported to have flipped more than how many House seats?", ["10", "20", "40", "70"], "40", 2),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026, Nithya Raman was elected mayor of…", ["San Francisco", "San Diego", "Los Angeles", "Sacramento"], "Los Angeles", 2),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026, Nithya Raman defeated which incumbent Los Angeles mayor?", ["Eric Garcetti", "Antonio Villaraigosa", "Karen Bass", "Rick Caruso"], "Karen Bass", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In Nov 2026, Troy Jackson defeated longtime GOP Sen. Susan Collins in…", ["New Hampshire", "Vermont", "Maine", "Rhode Island"], "Maine", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In the Nov 2026 midterms, which longtime Maine Republican senator lost her seat?", ["Olympia Snowe", "Susan Collins", "Lisa Murkowski", "Kelly Ayotte"], "Susan Collins", 2),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026, Melat Kiros won a U.S. House seat representing…", ["Utah", "Colorado", "Nevada", "Arizona"], "Colorado", 3),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("Melat Kiros's Nov 2026 House win was noted for making her the first Gen-Z woman elected to…", ["a state legislature", "Congress", "a governorship", "the Senate"], "Congress", 3),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026, Denise Powell became Nebraska's first Hispanic member of…", ["the state Senate", "Congress", "the state Supreme Court", "a cabinet"], "Congress", 3),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026 midterm coverage, Claire Valdez was noted as New York's first Native American…", ["governor", "U.S. senator", "congresswoman", "attorney general"], "congresswoman", 3),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026, Democrat Cait Conley defeated GOP Rep. Mike Lawler in…", ["New Jersey", "Connecticut", "New York", "Pennsylvania"], "New York", 3),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026, Democrat Richard Ojeda defeated House GOP campaign chair Richard Hudson in…", ["West Virginia", "Virginia", "North Carolina", "South Carolina"], "North Carolina", 3),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026, Democrat Kristina Knickerbocker defeated longtime GOP Rep. Mike Turner in…", ["Indiana", "Ohio", "Michigan", "Kentucky"], "Ohio", 3),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("After the Nov 2026 midterms, Democrats were set to take control of Congress in…", ["November 2026", "January 2027", "March 2027", "January 2028"], "January 2027", 2),
	// https://fortune.com/2026/11/04/women-democrats-blue-wave-midterms-gina-hinojosa-keisha-lance-bottoms-amy-acton/
	q("In Nov 2026, Gina Hinojosa was noted as following in the footsteps of which former Texas Democratic governor?", ["Miriam Ferguson", "Ann Richards", "Ma Ferguson alone", "Barbara Jordan"], "Ann Richards", 3),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026 midterm ballot measures, Missouri voters rejected a state ban on…", ["cannabis", "abortion", "sports betting", "open carry"], "abortion", 2),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026, Virginia voters approved a constitutional amendment on…", ["ranked-choice voting", "reproductive freedom", "term limits", "gun rights"], "reproductive freedom", 2),
	// https://www.glamour.com/story/how-women-made-history-during-the-2026-midterm-elections
	q("In Nov 2026, Nevada voters approved a constitutional amendment protecting abortion up to…", ["six weeks of pregnancy", "the point of viability", "birth with no limit", "twelve weeks only"], "the point of viability", 3),
	// https://www.cbsnews.com/live-updates/midterm-election-results-2026-democrats-house-senate-trump/
	q("In Nov 2026, Democrat Marie Gluesenkamp Perez won reelection in which state's 3rd Congressional District?", ["Oregon", "Washington", "Idaho", "Montana"], "Washington", 3),

];

export const CUR_ARTS_20261106: TriviaQ[] = [
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Julian Barnes received a 2026 Princess of Asturias Award for…", ["Arts", "Literature", "Sports", "Concord"], "Literature", 3),
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Patti Smith won the 2026 Princess of Asturias Award for Arts; she is best known as a…", ["ballerina", "architect", "singer-songwriter", "film director"], "singer-songwriter", 2),	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Patti Smith received the 2026 Princess of Asturias Award for…", ["Literature", "Arts", "Sports", "Concord"], "Arts", 2),

];

export const CUR_SCIENCE_20261106: TriviaQ[] = [
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("In Nov 2026, NASA confirmed that which space telescope burned up on reentry?", ["Chandra", "Spitzer", "Hubble", "Swift"], "Swift", 1),
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("NASA's Swift Observatory reentered Earth's atmosphere in Nov 2026 over which country?", ["Japan", "Australia", "Chile", "Indonesia"], "Indonesia", 2),
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("In Nov 2026, Swift burned up nearly how many years after launch?", ["32", "42", "12", "22"], "22", 2),
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("NASA's Swift reentry in Nov 2026 occurred over which Indonesian region?", ["West Java", "North Sumatra", "South Sulawesi", "East Kalimantan"], "North Sumatra", 3),
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("The full name of the Swift mission that reentered in Nov 2026 is the Neil Gehrels Swift…", ["Array", "Telescope", "Observatory", "Probe"], "Observatory", 2),
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("NASA's Swift Observatory reentered on Nov 4, 2026, at about 7:39 a.m.…", ["EST", "PST", "GMT", "CST"], "EST", 3),
	// https://www.livescience.com/space/astronomy/swift-has-fallen-nasas-22-year-old-space-telescope-burns-up-over-sumatra
	q("Before reentry in Nov 2026, Swift was especially known for studying…", ["exoplanets", "cosmic microwave background", "dark matter", "gamma-ray bursts"], "gamma-ray bursts", 2),
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Christina Koch was named among 2026 Princess of Asturias winners in which category?", ["Literature", "Arts", "Concord", "Sports"], "Concord", 3),
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("NASA said most of Swift burned up during its Nov 2026 reentry, though some…", ["solar panels were reused", "crew returned safely", "components may have survived", "fuel tanks were recovered intact"], "components may have survived", 3),	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("NASA's Swift Observatory, which reentered in Nov 2026, had launched in…", ["1999", "2004", "2010", "2015"], "2004", 2),
	// https://science.nasa.gov/blogs/swift/2026/11/02/nasas-swift-observatory-to-re-enter-atmosphere/
	q("NASA's Swift Observatory reentered Earth's atmosphere in which month of 2026?", ["September", "October", "November", "December"], "November", 1),

];

export const CUR_HISTORY_20261106: TriviaQ[] = [
	// https://apnews.com/article/georgia-governor-lance-bottom-jackson-midterm-election-67c22a38b9a6e4cad5584aa44acf106f
	q("As of Nov 2026 reporting, Keisha Lance Bottoms was the first Democrat to win Georgia's governorship since…", ["2010", "2018", "2002", "1998"], "1998", 3),
];

export const CUR_NATURE_20261106: TriviaQ[] = [
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Svalbard Global Seed Vault received a 2026 Princess of Asturias Award for…", ["Literature and letters", "Arts and culture", "Sports and athletics", "International Cooperation"], "International Cooperation", 3),
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("In Oct 2026 Princess of Asturias honors, which Arctic seed bank was recognized for International Cooperation?", ["Millennium Seed Bank (UK)", "Svalbard Global Seed Vault", "NordGen seed archive", "Doomsday Vault of the USA"], "Svalbard Global Seed Vault", 2),
];

export const CUR_GAMES_20261106: TriviaQ[] = [
	// https://www.nintendo.com/us/whatsnew/its-time-experience-the-legend-of-zelda-ocarina-of-time-reborn-exclusively-for-nintendo-switch-2/
	q("In Nov 2026, Nintendo released a remake of which Zelda classic on Switch 2?", ["Ocarina of Time", "Twilight Princess", "Wind Waker", "Majora's Mask"], "Ocarina of Time", 1),
	// https://www.nintendo.com/us/whatsnew/its-time-experience-the-legend-of-zelda-ocarina-of-time-reborn-exclusively-for-nintendo-switch-2/
	q("The Nov 2026 Ocarina of Time remake launched exclusively on which console?", ["Xbox Series X", "PlayStation 5", "Nintendo Switch 2", "Steam Deck"], "Nintendo Switch 2", 1),
	// https://www.nintendo.com/us/whatsnew/its-time-experience-the-legend-of-zelda-ocarina-of-time-reborn-exclusively-for-nintendo-switch-2/
	q("As of Nov 2026 Nintendo news, Ocarina of Time for Switch 2 was described as…", ["now available", "Switch 1 exclusive", "coming in 2027", "mobile only"], "now available", 1),
];

export const CUR_CELEBRITY_20261106: TriviaQ[] = [
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("In Oct 2026, which footballer received the Princess of Asturias Award for Sports?", ["Kylian Mbappé", "Cristiano Ronaldo", "Lionel Messi", "Harry Kane"], "Lionel Messi", 1),
	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Timothy Garton Ash received a 2026 Princess of Asturias Award for…", ["Arts", "Communication and Humanities", "Social Sciences", "Literature"], "Social Sciences", 3),	// https://blackbook.co.in/current-affairs/october-2026/awards-honours
	q("Princess Leonor presented Lionel Messi's 2026 Princess of Asturias Award in which country?", ["Portugal", "Argentina", "Spain", "Italy"], "Spain", 1),

];

export const CUR_BOOKS_20261106: TriviaQ[] = [
	// https://thebookerprizes.com/the-booker-library/prize-years/2026
	q("Which author's 'The End of Everything' made the 2026 Booker shortlist?", ["M. John Harrison", "Rebecca Perry", "Luke Kennard", "Douglas Stuart"], "M. John Harrison", 3),
	// https://thebookerprizes.com/the-booker-library/prize-years/2026
	q("The 2026 Booker shortlist includes Rebecca Perry's novel…", ["The End of Everything", "May We Feed the King", "John of John", "Black Bag"], "May We Feed the King", 3),
	// https://thebookerprizes.com/the-booker-library/prize-years/2026
	q("Luke Kennard's 2026 Booker-shortlisted novel is titled…", ["Black Bag", "The Disappearers", "May We Feed the King", "John of John"], "Black Bag", 3),
	// https://thebookerprizes.com/the-booker-library/prize-years/2026
	q("The 2026 Booker Prize ceremony was set for Old Billingsgate in…", ["Edinburgh", "New York", "London", "Dublin"], "London", 2),
	// https://thebookerprizes.com/the-booker-library/prize-years/2026
	q("Patricia Lockwood was a 2026 Booker Prize…", ["judge", "sponsor", "winner", "longlistee only"], "judge", 3),
];
