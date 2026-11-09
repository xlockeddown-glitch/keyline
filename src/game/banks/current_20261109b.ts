import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Nov 9, 2026 bulk add, sub-batch 2 (0.1.138): time-anchored 2025-2026 events (elections, sports, awards, space, culture).
 * Every prompt is time-anchored. No math. Sources in docs/trivia-current-20261109b-sources.md.
 * Fact-level dup-checked vs whole deck incl. weekly_ and current_ banks.
 */

export const CUR_SPORTS_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship
	q("Which driver clinched the 2026 Formula One world title at the Mexico City Grand Prix?", ["Lando Norris", "Max Verstappen", "George Russell", "Kimi Antonelli"], "Kimi Antonelli", 1),
	// https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship
	q("In 2026, Kimi Antonelli became the first champion from which country since Alberto Ascari in 1953?", ["Italy", "Spain", "Argentina", "Brazil"], "Italy", 2),
	// https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship
	q("Which team won the 2026 F1 constructors' title, its ninth?", ["McLaren", "Red Bull Racing", "Mercedes", "Ferrari"], "Mercedes", 2),
	// https://en.wikipedia.org/wiki/2026_NCAA_Division_I_men's_basketball_tournament
	q("Which school won the NCAA men's basketball title in April 2026?", ["Michigan", "Duke", "Michigan State", "Houston"], "Michigan", 1),
	// https://en.wikipedia.org/wiki/2026_NCAA_Division_I_men's_basketball_tournament
	q("Who coached Michigan to the NCAA men's basketball title in April 2026?", ["Juwan Howard", "John Beilein", "Dusty May", "Tom Izzo"], "Dusty May", 2),
	// https://en.wikipedia.org/wiki/2026_NCAA_Division_I_women's_basketball_tournament
	q("Which school won the NCAA women's basketball title in April 2026?", ["UCLA", "Texas", "UConn", "South Carolina"], "UCLA", 1),
	// https://en.wikipedia.org/wiki/2026_NCAA_Division_I_women's_basketball_tournament
	q("Which team did UCLA beat in the April 2026 NCAA women's basketball final?", ["UConn Huskies", "Notre Dame", "South Carolina", "LSU Tigers"], "South Carolina", 2),
	// https://en.wikipedia.org/wiki/2026_WNBA_Finals
	q("Which team won its first WNBA title in Oct 2026?", ["New York Liberty", "Golden State Valkyries", "Atlanta Dream", "Las Vegas Aces"], "Golden State Valkyries", 1),
	// https://en.wikipedia.org/wiki/2026_WNBA_Finals
	q("Who was named MVP of the WNBA Finals in Oct 2026?", ["Kayla Thornton", "Allisha Gray", "Gabby Williams", "Rhyne Howard"], "Gabby Williams", 2),
	// https://en.wikipedia.org/wiki/2026_WNBA_Finals
	q("The Oct 2026 WNBA Finals were the first in league history to reach…", ["a tiebreaker", "overtime twice", "a Game 7", "a sweep"], "a Game 7", 2),
	// https://en.wikipedia.org/wiki/2026_NFL_draft
	q("Which city hosted the April 2026 NFL draft, a record for attendance?", ["Pittsburgh", "Kansas City", "Green Bay", "Detroit"], "Pittsburgh", 3),
	// https://en.wikipedia.org/wiki/2026_MLB_All-Star_Game
	q("Which team's ballpark hosted the July 2026 MLB All-Star Game?", ["Pittsburgh Pirates", "Baltimore Orioles", "Washington Nationals", "Philadelphia Phillies"], "Philadelphia Phillies", 2),
	// https://en.wikipedia.org/wiki/2026_MLB_All-Star_Game
	q("Who was named MVP of the July 2026 MLB All-Star Game?", ["Aaron Judge", "Ben Rice", "Cody Bellinger", "Yordan Alvarez"], "Cody Bellinger", 2),
	// https://en.wikipedia.org/wiki/Super_Bowl_LIX
	q("Which team won Super Bowl LIX in Feb 2025?", ["Kansas City Chiefs", "Detroit Lions", "Philadelphia Eagles", "Buffalo Bills"], "Philadelphia Eagles", 1),
	// https://en.wikipedia.org/wiki/Super_Bowl_LIX
	q("Who was named MVP of Super Bowl LIX in Feb 2025?", ["Jalen Hurts", "Saquon Barkley", "Patrick Mahomes", "A. J. Brown"], "Jalen Hurts", 1),
	// https://en.wikipedia.org/wiki/2025_NBA_Finals
	q("Which team won the NBA championship in June 2025?", ["Cleveland Cavaliers", "Minnesota Timberwolves", "Oklahoma City Thunder", "Indiana Pacers"], "Oklahoma City Thunder", 1),
	// https://en.wikipedia.org/wiki/2025_NBA_Finals
	q("Who was named MVP of the June 2025 NBA Finals?", ["Tyrese Haliburton", "Pascal Siakam", "Jalen Williams", "Shai Gilgeous-Alexander"], "Shai Gilgeous-Alexander", 2),
	// https://en.wikipedia.org/wiki/2025_Stanley_Cup_Final
	q("Which team won the Stanley Cup in June 2025?", ["Florida Panthers", "Carolina Hurricanes", "Dallas Stars", "Edmonton Oilers"], "Florida Panthers", 2),
	// https://en.wikipedia.org/wiki/2025_World_Series
	q("Which team won the World Series in Nov 2025?", ["Milwaukee Brewers", "Los Angeles Dodgers", "Seattle Mariners", "Toronto Blue Jays"], "Los Angeles Dodgers", 2),
	// https://en.wikipedia.org/wiki/2025_Masters_Tournament
	q("In April 2025, Rory McIlroy completed the career Grand Slam by winning which tournament?", ["the Open Championship", "the U.S. Open", "the Masters", "the PGA Championship"], "the Masters", 2),
	// https://en.wikipedia.org/wiki/2025_Wimbledon_Championships
	q("Which player beat Carlos Alcaraz in the July 2025 Wimbledon men's final?", ["Taylor Fritz", "Alexander Zverev", "Jannik Sinner", "Novak Djokovic"], "Jannik Sinner", 2),
	// https://en.wikipedia.org/wiki/2025_Wimbledon_Championships
	q("Who won the women's singles title at Wimbledon in July 2025?", ["Coco Gauff", "Amanda Anisimova", "Iga Świątek", "Aryna Sabalenka"], "Iga Świątek", 2),
	// https://en.wikipedia.org/wiki/2025_French_Open
	q("Who won the women's singles title at the 2025 French Open?", ["Coco Gauff", "Lois Boisson", "Iga Świątek", "Aryna Sabalenka"], "Coco Gauff", 2),
	// https://en.wikipedia.org/wiki/2025_Australian_Open
	q("Who won the women's singles title at the 2025 Australian Open?", ["Paula Badosa", "Madison Keys", "Iga Świątek", "Aryna Sabalenka"], "Madison Keys", 2),
	// https://en.wikipedia.org/wiki/2025_Kentucky_Derby
	q("Which horse won the Kentucky Derby in May 2025?", ["Journalism", "Rich Strike", "Sovereignty", "Mystik Dan"], "Sovereignty", 2),
	// https://en.wikipedia.org/wiki/2025_Indianapolis_500
	q("Who won the Indianapolis 500 in May 2025?", ["Scott Dixon", "Josef Newgarden", "Álex Palou", "Marcus Ericsson"], "Álex Palou", 2),
	// https://en.wikipedia.org/wiki/2025_FIFA_Club_World_Cup
	q("Which club won the first 32-team FIFA Club World Cup in July 2025?", ["Real Madrid", "Paris Saint-Germain", "Manchester City", "Chelsea"], "Chelsea", 2),
	// https://en.wikipedia.org/wiki/2025_UEFA_Champions_League_final
	q("Which club did PSG beat 5–0 in the May 2025 Champions League final?", ["Bayern Munich", "Barcelona", "Inter Milan", "Arsenal"], "Inter Milan", 2),
	// https://en.wikipedia.org/wiki/2025_Tour_de_France
	q("In which French city did the 2025 Tour de France start?", ["Nice", "Rouen", "Brest", "Lille"], "Lille", 3),
	// https://en.wikipedia.org/wiki/2025_Giro_d'Italia
	q("Which British rider won the 2025 Giro d'Italia?", ["Geraint Thomas", "Adam Yates", "Tom Pidcock", "Simon Yates"], "Simon Yates", 2),
	// https://en.wikipedia.org/wiki/2025_Giro_d'Italia
	q("The 2025 Giro d'Italia started in which country?", ["Hungary", "Albania", "Croatia", "Slovenia"], "Albania", 3),
	// https://en.wikipedia.org/wiki/2025_Vuelta_a_España
	q("Who won the 2025 Vuelta a España, his first Vuelta title?", ["Primož Roglič", "Jonas Vingegaard", "Tadej Pogačar", "João Almeida"], "Jonas Vingegaard", 2),
	// https://en.wikipedia.org/wiki/2025_Vuelta_a_España
	q("The 2025 Vuelta a España started in which Italian city?", ["Florence", "Milan", "Turin", "Genoa"], "Turin", 2),
	// https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship
	q("Who won his first Formula One drivers' title in 2025?", ["George Russell", "Max Verstappen", "Lando Norris", "Oscar Piastri"], "Lando Norris", 1),
	// https://en.wikipedia.org/wiki/2025_US_Open_(tennis)
	q("Who beat Jannik Sinner in the men's final of the Sept 2025 US Open?", ["Taylor Fritz", "Novak Djokovic", "Carlos Alcaraz", "Alexander Zverev"], "Carlos Alcaraz", 2),
	// https://en.wikipedia.org/wiki/2025_US_Open_(tennis)
	q("Who defended her women's singles title at the Sept 2025 US Open?", ["Iga Świątek", "Coco Gauff", "Aryna Sabalenka", "Amanda Anisimova"], "Aryna Sabalenka", 2),
	// https://en.wikipedia.org/wiki/2025_U.S._Open_(golf)
	q("Who won the June 2025 U.S. Open at Oakmont, his first major?", ["J. J. Spaun", "Robert MacIntyre", "Sam Burns", "Bryson DeChambeau"], "J. J. Spaun", 2),
	// https://en.wikipedia.org/wiki/2025_Open_Championship
	q("Who won the July 2025 Open Championship at Royal Portrush?", ["Harris English", "Scottie Scheffler", "Rory McIlroy", "Xander Schauffele"], "Scottie Scheffler", 2),
	// https://en.wikipedia.org/wiki/2025_PGA_Championship
	q("The 2025 PGA Championship was played at which club in Charlotte?", ["Valhalla", "Quail Hollow", "Kiawah Island", "Oak Hill"], "Quail Hollow", 3),
	// https://en.wikipedia.org/wiki/2026_U.S._Open_(golf)
	q("Who won the June 2026 U.S. Open at Shinnecock Hills, his second U.S. Open?", ["Bryson DeChambeau", "Wyndham Clark", "Scottie Scheffler", "J. J. Spaun"], "Wyndham Clark", 2),
	// https://en.wikipedia.org/wiki/UEFA_Women's_Euro_2025
	q("Which team won UEFA Women's Euro 2025 in a penalty shootout?", ["Germany", "France", "England", "Spain"], "England", 2),
	// https://en.wikipedia.org/wiki/UEFA_Women's_Euro_2025
	q("Which country hosted UEFA Women's Euro 2025?", ["Austria", "Belgium", "Switzerland", "Netherlands"], "Switzerland", 2),
	// https://en.wikipedia.org/wiki/2025_Women's_Rugby_World_Cup
	q("Which team did England beat in the Sept 2025 Women's Rugby World Cup final?", ["Canada", "New Zealand", "Ireland", "France"], "Canada", 3),
	// https://en.wikipedia.org/wiki/2025_ICC_Champions_Trophy
	q("Which team won cricket's ICC Champions Trophy in March 2025?", ["India", "New Zealand", "Pakistan", "Australia"], "India", 2),
	// https://en.wikipedia.org/wiki/2025_ICC_World_Test_Championship_final
	q("Which team won cricket's World Test Championship final at Lord's in June 2025?", ["South Africa", "India", "New Zealand", "Australia"], "South Africa", 2),
	// https://en.wikipedia.org/wiki/2026_ICC_Men's_T20_World_Cup
	q("Which European country played its first men's T20 World Cup in 2026?", ["Germany", "Italy", "Spain", "Denmark"], "Italy", 3),
	// https://en.wikipedia.org/wiki/2026_Commonwealth_Games
	q("Which Australian state pulled out of hosting the 2026 Commonwealth Games?", ["Queensland", "Tasmania", "New South Wales", "Victoria"], "Victoria", 3),
	// https://en.wikipedia.org/wiki/2026_NBA_Finals
	q("Which team did the Knicks beat in the June 2026 NBA Finals?", ["Minnesota Timberwolves", "Denver Nuggets", "Oklahoma City Thunder", "San Antonio Spurs"], "San Antonio Spurs", 2),
	// https://en.wikipedia.org/wiki/2026_Boston_Marathon
	q("Who set the Boston Marathon course record in April 2026?", ["Benson Kipruto", "John Korir", "Evans Chebet", "Eliud Kipchoge"], "John Korir", 3),
	// https://en.wikipedia.org/wiki/2025_Africa_Cup_of_Nations
	q("Which country hosted the 2025 Africa Cup of Nations?", ["Senegal", "Egypt", "Morocco", "Ivory Coast"], "Morocco", 1),
	// https://en.wikipedia.org/wiki/2025_Africa_Cup_of_Nations
	q("Which team walked off the pitch for 17 minutes in the Jan 2026 AFCON final?", ["Egypt", "Morocco", "Senegal", "Nigeria"], "Senegal", 3),
	// https://en.wikipedia.org/wiki/2025_NBA_draft
	q("Who was the first pick in the June 2025 NBA draft?", ["Dylan Harper", "Cooper Flagg", "Ace Bailey", "VJ Edgecombe"], "Cooper Flagg", 1),
	// https://en.wikipedia.org/wiki/2025_NBA_draft
	q("Which team drafted Cooper Flagg first overall in June 2025?", ["Chicago Bulls", "San Antonio Spurs", "Dallas Mavericks", "Washington Wizards"], "Dallas Mavericks", 2),
	// https://en.wikipedia.org/wiki/2026_NBA_draft
	q("Who was the first pick in the June 2026 NBA draft?", ["Caleb Wilson", "Darryn Peterson", "Cameron Boozer", "AJ Dybantsa"], "AJ Dybantsa", 2),
	// https://en.wikipedia.org/wiki/2026_Giro_d'Italia
	q("Who won the May 2026 Giro d'Italia to complete all three Grand Tours?", ["Felix Gall", "Tadej Pogačar", "Jai Hindley", "Jonas Vingegaard"], "Jonas Vingegaard", 2),
	// https://en.wikipedia.org/wiki/2026_Giro_d'Italia
	q("In which country did the 2026 Giro d'Italia start?", ["Hungary", "Albania", "Greece", "Bulgaria"], "Bulgaria", 3),
];

export const CUR_POLITICAL_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_Hungarian_parliamentary_election
	q("Which party ended Viktor Orbán's 16-year rule in Hungary's 2026 election?", ["Jobbik", "Fidesz–KDNP", "Momentum", "Tisza Party"], "Tisza Party", 2),
	// https://en.wikipedia.org/wiki/2026_Hungarian_parliamentary_election
	q("Who led the Tisza Party to a landslide win in Hungary's 2026 election?", ["Péter Márki-Zay", "Péter Magyar", "Ferenc Gyurcsány", "Gergely Karácsony"], "Péter Magyar", 2),
	// https://en.wikipedia.org/wiki/2026_Colombian_presidential_election
	q("Who narrowly won Colombia's June 2026 presidential runoff?", ["Sergio Fajardo Valderrama", "María Fernanda Cabal", "Iván Cepeda Castro", "Abelardo de la Espriella"], "Abelardo de la Espriella", 3),
	// https://en.wikipedia.org/wiki/2026_Scottish_Parliament_election
	q("Which party won a fifth straight Scottish Parliament election in May 2026?", ["Reform UK Scotland", "Scottish Labour Party", "Scottish Green Party", "Scottish National Party"], "Scottish National Party", 2),
	// https://en.wikipedia.org/wiki/2026_Welsh_Senedd_election
	q("Which party became the largest in the Welsh Senedd for the first time in 2026?", ["Reform UK", "Welsh Labour", "Plaid Cymru", "Welsh Conservatives"], "Plaid Cymru", 2),
	// https://en.wikipedia.org/wiki/2026_Welsh_Senedd_election
	q("The Welsh Senedd grew to how many members at its 2026 election?", ["80", "120", "96", "72"], "96", 3),
	// https://en.wikipedia.org/wiki/2026_Welsh_Senedd_election
	q("Which Welsh first minister lost her own seat in the 2026 Senedd election?", ["Leanne Wood", "Eluned Morgan", "Jane Hutt", "Kirsty Williams"], "Eluned Morgan", 3),
	// https://en.wikipedia.org/wiki/2026_Peruvian_general_election
	q("Who won Peru's June 2026 presidential runoff?", ["Keiko Fujimori", "Rafael López Aliaga", "Dina Boluarte", "Roberto Sánchez"], "Keiko Fujimori", 2),
	// https://en.wikipedia.org/wiki/2026_Peruvian_general_election
	q("Peru's Congress went back to two chambers in 2026, restoring which body?", ["the Senate", "the Federal Council", "the Council of State", "the House of Lords"], "the Senate", 3),
	// https://en.wikipedia.org/wiki/2026_Costa_Rican_general_election
	q("Laura Fernández, elected in 2026, became the second woman to lead which country?", ["Costa Rica", "Honduras", "Panama", "Chile"], "Costa Rica", 2),
	// https://en.wikipedia.org/wiki/2026_Portuguese_presidential_election
	q("Who won Portugal's presidential runoff in Feb 2026?", ["António José Seguro", "Henrique Gouveia e Melo", "André Ventura", "Luís Marques Mendes"], "António José Seguro", 2),
	// https://en.wikipedia.org/wiki/2026_Japanese_general_election
	q("Which party won a record 316 seats in Japan's 2026 general election?", ["Constitutional Democratic Party", "Democratic Party for the People", "Liberal Democratic Party", "Japan Innovation Party"], "Liberal Democratic Party", 2),
	// https://en.wikipedia.org/wiki/2026_Japanese_general_election
	q("Who was Japan's prime minister when her party won a record landslide in 2026?", ["Seiko Noda", "Renhō Murata", "Yuriko Koike", "Sanae Takaichi"], "Sanae Takaichi", 2),
	// https://en.wikipedia.org/wiki/2026_Bangladeshi_general_election
	q("Which party won a landslide in Bangladesh's 2026 general election?", ["Jatiya Party (Ershad)", "Bangladesh Jamaat-e-Islami", "Bangladesh Nationalist Party", "Bangladesh Awami League"], "Bangladesh Nationalist Party", 2),
	// https://en.wikipedia.org/wiki/2026_Bangladeshi_general_election
	q("Who led the BNP to victory in Bangladesh's 2026 election?", ["Tarique Rahman", "Muhammad Yunus", "Sheikh Hasina", "Khaleda Zia"], "Tarique Rahman", 2),
	// https://en.wikipedia.org/wiki/2025_Canadian_federal_election
	q("Whose Liberal Party won Canada's federal election in April 2025?", ["Mark Carney", "Pierre Poilievre", "Chrystia Freeland", "Justin Trudeau"], "Mark Carney", 1),
	// https://en.wikipedia.org/wiki/2025_German_federal_election
	q("Who became German chancellor after the Feb 2025 federal election?", ["Olaf Scholz", "Boris Pistorius", "Friedrich Merz", "Markus Söder"], "Friedrich Merz", 2),
	// https://en.wikipedia.org/wiki/2025_Australian_federal_election
	q("Whose Labor Party won Australia's federal election in May 2025?", ["Anthony Albanese", "Scott Morrison", "Peter Dutton", "Jim Chalmers"], "Anthony Albanese", 2),
	// https://en.wikipedia.org/wiki/2025_South_Korean_presidential_election
	q("Who won South Korea's snap presidential election in June 2025?", ["Han Duck-soo", "Kim Moon-soo", "Yoon Suk Yeol", "Lee Jae-myung"], "Lee Jae-myung", 2),
	// https://en.wikipedia.org/wiki/2025_Polish_presidential_election
	q("Who won Poland's presidential election in 2025?", ["Szymon Hołownia", "Andrzej Duda", "Rafał Trzaskowski", "Karol Nawrocki"], "Karol Nawrocki", 2),
	// https://en.wikipedia.org/wiki/2025_New_York_City_mayoral_election
	q("Who won New York City's mayoral election in Nov 2025?", ["Andrew Cuomo", "Curtis Sliwa", "Zohran Mamdani", "Eric Adams"], "Zohran Mamdani", 1),
	// https://en.wikipedia.org/wiki/2025_Nobel_Peace_Prize
	q("Which Venezuelan opposition leader won the 2025 Nobel Peace Prize?", ["Edmundo González", "María Corina Machado", "Leopoldo López", "Juan Guaidó"], "María Corina Machado", 2),
	// https://en.wikipedia.org/wiki/Joel_Mokyr
	q("Economist Joel Mokyr won a 2025 Nobel for explaining growth through what?", ["central banking", "free trade", "technological progress", "population growth"], "technological progress", 3),
	// https://en.wikipedia.org/wiki/2026_Nobel_Peace_Prize
	q("Which South African jurist was named the 2026 Nobel Peace Prize laureate?", ["Richard Goldstone", "Albie Sachs", "Thuli Madonsela", "Navi Pillay"], "Navi Pillay", 2),
];

export const CUR_ARTS_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_Cannes_Film_Festival
	q("Which Romanian director won his second Palme d'Or at Cannes in May 2026?", ["Cristian Mungiu", "Radu Jude", "Cristi Puiu", "Corneliu Porumboiu"], "Cristian Mungiu", 2),
	// https://en.wikipedia.org/wiki/2026_Cannes_Film_Festival
	q("Which film won the Palme d'Or at the May 2026 Cannes Film Festival?", ["Triangle", "Anora", "Fjord", "The Square"], "Fjord", 3),
	// https://en.wikipedia.org/wiki/2025_Louvre_robbery
	q("Which Paris museum was robbed of French crown jewels in Oct 2025?", ["the Centre Pompidou", "the Musée Rodin", "the Musée d'Orsay", "the Louvre"], "the Louvre", 1),
	// https://en.wikipedia.org/wiki/82nd_Venice_International_Film_Festival
	q("Which director won the Golden Lion at Venice in Sept 2025?", ["Jim Jarmusch", "Guillermo del Toro", "Yorgos Lanthimos", "Paolo Sorrentino"], "Jim Jarmusch", 2),
	// https://en.wikipedia.org/wiki/82nd_Venice_International_Film_Festival
	q("Jim Jarmusch's 2025 Golden Lion winner was titled…", ["Father Mother Sister Brother", "Coffee and Cigarettes", "Paterson", "Broken Flowers"], "Father Mother Sister Brother", 3),
	// https://en.wikipedia.org/wiki/83rd_Venice_International_Film_Festival
	q("Which film won the Golden Lion at Venice in Sept 2026?", ["Yellow Letters", "Fjord", "Salvation", "Woman Unknown"], "Woman Unknown", 3),
	// https://en.wikipedia.org/wiki/83rd_Venice_International_Film_Festival
	q("Who was jury president at the Sept 2026 Venice Film Festival?", ["Greta Gerwig", "Alexander Payne", "Maggie Gyllenhaal", "Juliette Binoche"], "Maggie Gyllenhaal", 2),
	// https://en.wikipedia.org/wiki/2025_Cannes_Film_Festival
	q("Which Iranian director won the Palme d'Or at Cannes in May 2025?", ["Asghar Farhadi", "Mohammad Rasoulof", "Jafar Panahi", "Abbas Kiarostami"], "Jafar Panahi", 2),
	// https://en.wikipedia.org/wiki/2025_Cannes_Film_Festival
	q("Jafar Panahi's 2025 Palme d'Or winner was titled…", ["Taxi Tehran", "It Was Just an Accident", "A Separation", "The White Balloon"], "It Was Just an Accident", 2),
	// https://en.wikipedia.org/wiki/2025_Cannes_Film_Festival
	q("Who was jury president at Cannes in May 2025?", ["Greta Gerwig", "Cate Blanchett", "Isabelle Huppert", "Juliette Binoche"], "Juliette Binoche", 2),
	// https://en.wikipedia.org/wiki/75th_Berlin_International_Film_Festival
	q("Which film won the Golden Bear at the Feb 2025 Berlinale?", ["Dreams (Sex Love)", "The Blue Trail", "The Light", "Yellow Letters"], "Dreams (Sex Love)", 3),
	// https://en.wikipedia.org/wiki/76th_Berlin_International_Film_Festival
	q("Which İlker Çatak film won the Golden Bear in Feb 2026?", ["Yellow Letters", "Salvation", "The Teachers' Lounge", "Rose"], "Yellow Letters", 3),
	// https://en.wikipedia.org/wiki/76th_Berlin_International_Film_Festival
	q("Who was jury president at the Feb 2026 Berlinale?", ["Todd Haynes", "Tom Tykwer", "Werner Herzog", "Wim Wenders"], "Wim Wenders", 2),
	// https://en.wikipedia.org/wiki/2026_Cannes_Film_Festival
	q("Which South Korean filmmaker was jury president at Cannes in May 2026?", ["Lee Chang-dong", "Hong Sang-soo", "Park Chan-wook", "Bong Joon-ho"], "Park Chan-wook", 2),
];

export const CUR_SCIENCE_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Artemis_II
	q("What did the Artemis II crew name their Orion spacecraft in April 2026?", ["Integrity", "Freedom", "Resilience", "Endeavour"], "Integrity", 2),
	// https://en.wikipedia.org/wiki/Artemis_II
	q("Which Canadian astronaut flew around the Moon on Artemis II in April 2026?", ["Jeremy Hansen", "David Saint-Jacques", "Joshua Kutryk", "Jenni Gibbons"], "Jeremy Hansen", 2),
	// https://en.wikipedia.org/wiki/Artemis_II
	q("On Artemis II in April 2026, which astronaut became the oldest person to fly around the Moon?", ["Victor Glover", "Christina Koch", "Jeremy Hansen", "Reid Wiseman"], "Reid Wiseman", 3),
	// https://en.wikipedia.org/wiki/Artemis_II
	q("In April 2026, Artemis II broke which mission's record for the farthest humans from Earth?", ["Apollo 13", "Apollo 17", "Apollo 8", "Apollo 11"], "Apollo 13", 2),
	// https://en.wikipedia.org/wiki/Artemis_II
	q("Artemis II, flown in April 2026, was the first crewed flight of which rocket?", ["Saturn V rocket", "New Glenn", "Space Launch System", "Falcon Heavy"], "Space Launch System", 2),
	// https://en.wikipedia.org/wiki/2026_in_spaceflight
	q("Which air-launched rocket flew its final mission in July 2026?", ["Electron", "Pegasus XL", "Minotaur IV", "LauncherOne"], "Pegasus XL", 3),
	// https://en.wikipedia.org/wiki/2026_in_spaceflight
	q("Which two agencies launched the SMILE space-weather mission in May 2026?", ["ESA and NASA", "ISRO and CNES", "NASA and JAXA", "ESA and CAS"], "ESA and CAS", 3),
	// https://en.wikipedia.org/wiki/2026_in_spaceflight
	q("NASA's small Pandora telescope, launched in Jan 2026, studies…", ["exoplanet atmospheres", "dark matter maps", "solar flares", "asteroid orbits"], "exoplanet atmospheres", 3),
	// https://en.wikipedia.org/wiki/2026_in_science
	q("In March 2026, astronomers reported super-Earth GJ 887 d orbiting what kind of star?", ["a yellow dwarf", "a red dwarf", "a blue giant", "a white dwarf"], "a red dwarf", 3),
	// https://en.wikipedia.org/wiki/Omar_M._Yaghi
	q("Omar Yaghi shared the 2025 Nobel Prize in Chemistry for work on which materials?", ["metal-organic frameworks", "high-temperature superconductors", "carbon nanotubes", "lithium-ion cathodes"], "metal-organic frameworks", 3),
	// https://en.wikipedia.org/wiki/John_Clarke_(physicist)
	q("John Clarke's 2025 Nobel Prize in Physics involved which effect?", ["Josephson effect", "Casimir effect", "Doppler effect", "Hall effect"], "Josephson effect", 3),
];

export const CUR_HISTORY_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_in_archaeology
	q("In 2026, archaeologists found a hidden sacred lake at which Egyptian temple complex?", ["Karnak", "Edfu", "Abu Simbel", "Philae"], "Karnak", 2),
	// https://en.wikipedia.org/wiki/2026_in_archaeology
	q("In 2026, a Roman basilica was unearthed beneath a square in which Italian city?", ["Ancona", "Fano", "Pesaro", "Rimini"], "Fano", 3),
	// https://en.wikipedia.org/wiki/2026_in_archaeology
	q("A 5,000-year-old skull showing ancient skull surgery was reported in 2026 from which country?", ["Egypt", "Greece", "Iran", "Turkey"], "Turkey", 3),
];

export const CUR_NATURE_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_Atlantic_hurricane_season
	q("What was the first named Atlantic storm of 2026, forming on June 17?", ["Bertha", "Ana", "Cristobal", "Arthur"], "Arthur", 3),
];

export const CUR_GAMES_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/The_Game_Awards_2025
	q("Which game won Game of the Year at The Game Awards in Dec 2025?", ["Clair Obscur: Expedition 33", "Death Stranding 2", "Hades II", "Kingdom Come: Deliverance II"], "Clair Obscur: Expedition 33", 2),
	// https://en.wikipedia.org/wiki/The_Game_Awards_2025
	q("How many awards did 'Clair Obscur: Expedition 33' win at The Game Awards in Dec 2025, a record?", ["nine", "seven", "five", "eleven"], "nine", 3),
];

export const CUR_CELEBRITY_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Pope_Leo_XIV
	q("What was Pope Leo XIV's name before he was elected in 2025?", ["Pietro Parolin", "Robert Francis Prevost", "Luis Antonio Tagle", "Blase Joseph Cupich"], "Robert Francis Prevost", 2),
	// https://en.wikipedia.org/wiki/Pope_Leo_XIV
	q("In which US city was Pope Leo XIV, elected in May 2025, born?", ["New York", "Boston", "Philadelphia", "Chicago"], "Chicago", 1),
	// https://en.wikipedia.org/wiki/Pope_Leo_XIV
	q("Besides the US, Pope Leo XIV (elected 2025) is a citizen of which country?", ["Chile", "Italy", "Peru", "Mexico"], "Peru", 2),
	// https://en.wikipedia.org/wiki/97th_Academy_Awards
	q("Which film won Best Picture at the March 2025 Oscars?", ["Conclave", "Emilia Pérez", "The Brutalist", "Anora"], "Anora", 2),
	// https://en.wikipedia.org/wiki/97th_Academy_Awards
	q("Who won Best Actor at the March 2025 Oscars for 'The Brutalist'?", ["Ralph Fiennes", "Colman Domingo", "Timothée Chalamet", "Adrien Brody"], "Adrien Brody", 2),
	// https://en.wikipedia.org/wiki/97th_Academy_Awards
	q("Who won four Oscars in one night in March 2025, for 'Anora'?", ["Sean Baker", "Edward Berger", "Jacques Audiard", "Brady Corbet"], "Sean Baker", 2),
	// https://en.wikipedia.org/wiki/77th_Primetime_Emmy_Awards
	q("Which show won Outstanding Comedy Series at the Sept 2025 Emmys?", ["Hacks", "Abbott Elementary", "The Bear", "The Studio"], "The Studio", 2),
	// https://en.wikipedia.org/wiki/77th_Primetime_Emmy_Awards
	q("Who hosted the Sept 2025 Primetime Emmy Awards?", ["Jimmy Kimmel", "Conan O'Brien", "Nikki Glaser", "Nate Bargatze"], "Nate Bargatze", 2),
	// https://en.wikipedia.org/wiki/78th_Primetime_Emmy_Awards
	q("Which show led the Sept 2026 Emmys with 25 nominations?", ["The Studio", "The Pitt", "Hacks", "Severance"], "The Pitt", 3),
	// https://en.wikipedia.org/wiki/76th_Berlin_International_Film_Festival
	q("Which actress won a Silver Bear at the Feb 2026 Berlinale for 'Rose'?", ["Paula Beer", "Sandra Hüller", "Rose Byrne", "Nina Hoss"], "Sandra Hüller", 3),
];

export const CUR_MUSIC_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2025
	q("Which country won the Eurovision Song Contest in May 2025?", ["Austria", "Israel", "Sweden", "Estonia"], "Austria", 2),
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2025
	q("What was the title of the song that won Eurovision 2025?", ["New Day Will Rise", "Espresso Macchiato", "Wasted Love", "Bara bada bastu"], "Wasted Love", 3),
	// https://en.wikipedia.org/wiki/67th_Annual_Grammy_Awards
	q("Which album won Album of the Year at the Feb 2025 Grammys?", ["Brat", "The Tortured Poets Department", "Short n' Sweet", "Cowboy Carter"], "Cowboy Carter", 2),
];

export const CUR_BOOKS_20261109B: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2025_Nobel_Prize_in_Literature
	q("László Krasznahorkai, 2025 Nobel laureate, debuted with which novel?", ["Satantango", "Fatelessness", "War and War", "Embers"], "Satantango", 3),
	// https://en.wikipedia.org/wiki/David_Szalay
	q("Which David Szalay novel won the 2025 Booker Prize?", ["London and the South-East", "All That Man Is", "Flesh", "Turbulence"], "Flesh", 2),
	// https://en.wikipedia.org/wiki/Laurent_Mauvignier
	q("Laurent Mauvignier won the 2025 Prix Goncourt for which novel?", ["L'Anomalie", "Chanson douce", "La Maison vide", "Leurs enfants après eux"], "La Maison vide", 3),
	// https://en.wikipedia.org/wiki/James_(novel)
	q("Which Percival Everett novel, a retelling of Huckleberry Finn, won the 2025 Pulitzer for Fiction?", ["James", "Telephone", "The Trees", "Erasure"], "James", 2),
];
