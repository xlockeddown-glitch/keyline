import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Nov 9, 2026 bulk add, sub-batch 1 (0.1.138): time-anchored 2026 events (Winter Olympics, majors, awards).
 * Every prompt is time-anchored. No math. Sources in docs/trivia-current-20261109a-sources.md.
 * Fact-level dup-checked vs whole deck incl. current_20261021/1031/1106.
 */

export const CUR_SPORTS_20261109A: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_Winter_Olympics
	q("Which two places co-hosted the Feb 2026 Winter Olympics?", ["Trento and Madonna di Campiglio", "Turin and Sestriere in Piedmont", "Milan and Cortina d'Ampezzo", "Bolzano and Merano in South Tyrol"], "Milan and Cortina d'Ampezzo", 2),
	// https://en.wikipedia.org/wiki/2026_Winter_Olympics
	q("Which sport made its Winter Olympic debut at Milano Cortina in Feb 2026?", ["snowshoe racing", "freeride skiing", "ski mountaineering", "bandy"], "ski mountaineering", 2),
	// https://en.wikipedia.org/wiki/2026_Winter_Olympics
	q("Which country topped the medal table at the Feb 2026 Winter Olympics?", ["Germany", "Norway", "United States", "Italy"], "Norway", 1),
	// https://en.wikipedia.org/wiki/2026_Winter_Olympics
	q("Who was IOC president during the Feb 2026 Winter Olympics?", ["Sebastian Coe", "Kirsty Coventry", "Thomas Bach", "David Lappartient"], "Kirsty Coventry", 2),
	// https://en.wikipedia.org/wiki/2026_Winter_Olympics
	q("How many gold medals did Norway win at the Feb 2026 Winter Olympics, a record?", ["16", "14", "20", "18"], "18", 3),
	// https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
	q("Which team did Spain beat in the July 2026 men's World Cup final?", ["Brazil", "France", "Argentina", "England"], "Argentina", 1),
	// https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
	q("How many teams took part in the 2026 men's FIFA World Cup?", ["48", "32", "64", "40"], "48", 2),
	// https://en.wikipedia.org/wiki/2026_Wimbledon_Championships
	q("Who won the men's singles title at Wimbledon in July 2026?", ["Alexander Zverev", "Jannik Sinner", "Carlos Alcaraz", "Novak Djokovic"], "Jannik Sinner", 1),
	// https://en.wikipedia.org/wiki/2026_Wimbledon_Championships
	q("For the first time in Wimbledon history, July 2026 matches had…", ["night sessions", "video reviews", "shot clocks", "blue courts"], "video reviews", 2),
	// https://en.wikipedia.org/wiki/2026_French_Open
	q("In June 2026, who beat Flavio Cobolli in the French Open final for his first major title?", ["Casper Ruud", "Daniil Medvedev", "Jannik Sinner", "Alexander Zverev"], "Alexander Zverev", 2),
	// https://en.wikipedia.org/wiki/2026_French_Open
	q("Who won the women's singles title at the June 2026 French Open?", ["Aryna Sabalenka", "Coco Gauff", "Mirra Andreeva", "Iga Świątek"], "Mirra Andreeva", 2),
	// https://en.wikipedia.org/wiki/2026_Australian_Open
	q("Who won the men's singles at the Australian Open in Feb 2026?", ["Jannik Sinner", "Novak Djokovic", "Carlos Alcaraz", "Alexander Zverev"], "Carlos Alcaraz", 1),
	// https://en.wikipedia.org/wiki/2026_Australian_Open
	q("Who won the women's singles at the Australian Open in Feb 2026?", ["Iga Świątek", "Madison Keys", "Aryna Sabalenka", "Elena Rybakina"], "Elena Rybakina", 2),
	// https://en.wikipedia.org/wiki/2026_Australian_Open
	q("At the Jan 2026 Australian Open, Venus Williams became the oldest player in the women's draw at what age?", ["47", "41", "43", "45"], "45", 3),
	// https://en.wikipedia.org/wiki/2026_Masters_Tournament
	q("Who won the Masters in April 2026 for his second straight green jacket?", ["Jon Rahm", "Rory McIlroy", "Xander Schauffele", "Scottie Scheffler"], "Rory McIlroy", 1),
	// https://en.wikipedia.org/wiki/2026_Indianapolis_500
	q("Who won the May 2026 Indianapolis 500 in the closest finish in race history?", ["Felix Rosenqvist", "Álex Palou", "Scott Dixon", "David Malukas"], "Felix Rosenqvist", 2),
	// https://en.wikipedia.org/wiki/2026_Indianapolis_500
	q("Felix Rosenqvist won the May 2026 Indy 500 driving for which team?", ["Andretti Global", "Meyer Shank Racing", "Team Penske", "Chip Ganassi Racing"], "Meyer Shank Racing", 3),
	// https://en.wikipedia.org/wiki/2026_Kentucky_Derby
	q("Which horse won the Kentucky Derby in May 2026?", ["Journalism", "Golden Tempo", "Sovereignty", "Mystik Dan"], "Golden Tempo", 2),
	// https://en.wikipedia.org/wiki/2026_Kentucky_Derby
	q("Golden Tempo's May 2026 Kentucky Derby win made Cherie DeVaux the first woman to win it as a…", ["track announcer", "race steward", "jockey", "trainer"], "trainer", 2),
	// https://en.wikipedia.org/wiki/2026_Tour_de_France
	q("In which city did the July 2026 Tour de France begin?", ["Florence", "Copenhagen", "Barcelona", "Bilbao"], "Barcelona", 2),
	// https://en.wikipedia.org/wiki/2026_Tour_de_France
	q("Who won the July 2026 Tour de France, his fifth title?", ["Jonas Vingegaard", "Primož Roglič", "Remco Evenepoel", "Tadej Pogačar"], "Tadej Pogačar", 1),
	// https://en.wikipedia.org/wiki/2026_Tour_de_France
	q("Who finished second overall at the July 2026 Tour de France?", ["Remco Evenepoel", "Jonas Vingegaard", "Primož Roglič", "Isaac del Toro"], "Remco Evenepoel", 2),
	// https://en.wikipedia.org/wiki/2026_UEFA_Champions_League_final
	q("Which club did Paris Saint-Germain beat in the May 2026 Champions League final?", ["Real Madrid", "Inter Milan", "Arsenal", "Bayern Munich"], "Arsenal", 2),
	// https://en.wikipedia.org/wiki/2026_UEFA_Champions_League_final
	q("Which English club won the Europa League final in May 2026?", ["Chelsea", "Tottenham Hotspur", "Aston Villa", "Manchester United"], "Aston Villa", 2),
	// https://en.wikipedia.org/wiki/2025–26_Premier_League
	q("Which club were crowned 2025–26 Premier League champions?", ["Arsenal", "Liverpool", "Manchester City", "Chelsea"], "Arsenal", 1),
	// https://en.wikipedia.org/wiki/2025–26_Premier_League
	q("Which club was the first relegated from the Premier League in April 2026?", ["Nottingham Forest", "Sunderland AFC", "Wolverhampton Wanderers", "West Ham United"], "Wolverhampton Wanderers", 2),
	// https://en.wikipedia.org/wiki/2025–26_Premier_League
	q("Which London club won the Conference League final in May 2026?", ["Crystal Palace", "Brentford", "Chelsea FC", "Fulham FC"], "Crystal Palace", 3),
	// https://en.wikipedia.org/wiki/2026_PGA_Championship
	q("Who won the PGA Championship in May 2026 for his first major title?", ["Jon Rahm", "Alex Smalley", "Scottie Scheffler", "Aaron Rai"], "Aaron Rai", 2),
	// https://en.wikipedia.org/wiki/2026_PGA_Championship
	q("The May 2026 PGA Championship was played at which club near Philadelphia?", ["Aronimink", "Oakmont", "Valhalla", "Merion"], "Aronimink", 3),
	// https://en.wikipedia.org/wiki/2026_Open_Championship
	q("Who won the Open Championship at Royal Birkdale in July 2026?", ["Cameron Young", "Shane Lowry", "Rory McIlroy", "Ryan Fox"], "Ryan Fox", 2),
	// https://en.wikipedia.org/wiki/2026_Open_Championship
	q("Ryan Fox, who won the July 2026 Open Championship, is from which country?", ["Ireland", "South Africa", "New Zealand", "Australia"], "New Zealand", 2),
];

export const CUR_CELEBRITY_20261109A: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/98th_Academy_Awards
	q("Which film set a record with 16 nominations for the March 2026 Oscars?", ["Sinners", "Hamnet", "Frankenstein", "Marty Supreme"], "Sinners", 2),
	// https://en.wikipedia.org/wiki/98th_Academy_Awards
	q("In March 2026, who became the first woman to win the Oscar for Best Cinematography?", ["Mandy Walker", "Rachel Morrison", "Autumn Durald Arkapaw", "Ari Wegner"], "Autumn Durald Arkapaw", 3),
	// https://en.wikipedia.org/wiki/98th_Academy_Awards
	q("Which new Oscar category was handed out for the first time in March 2026?", ["Best Ensemble", "Best Voice Acting", "Best Stunts", "Best Casting"], "Best Casting", 2),
	// https://en.wikipedia.org/wiki/98th_Academy_Awards
	q("Which animated film won two Oscars in March 2026?", ["Little Amélie", "Zootopia 2", "KPop Demon Hunters", "The Bad Guys 2"], "KPop Demon Hunters", 2),
	// https://en.wikipedia.org/wiki/83rd_Golden_Globe_Awards
	q("Which film won Best Motion Picture – Drama at the Jan 2026 Golden Globes?", ["Frankenstein", "Sinners", "Sentimental Value", "Hamnet"], "Hamnet", 2),
	// https://en.wikipedia.org/wiki/83rd_Golden_Globe_Awards
	q("Who hosted the Golden Globes in Jan 2026 for the second year in a row?", ["Nikki Glaser", "Amy Poehler", "Jo Koy", "Ali Wong"], "Nikki Glaser", 2),
	// https://en.wikipedia.org/wiki/83rd_Golden_Globe_Awards
	q("Which show won the first-ever Golden Globe for podcasts in Jan 2026?", ["The Joe Rogan Experience", "Call Her Daddy", "SmartLess", "Good Hang with Amy Poehler"], "Good Hang with Amy Poehler", 2),
	// https://en.wikipedia.org/wiki/83rd_Golden_Globe_Awards
	q("Which series won Best TV Comedy at the Jan 2026 Golden Globes?", ["The Bear", "Hacks", "Abbott Elementary", "The Studio"], "The Studio", 2),
	// https://en.wikipedia.org/wiki/79th_British_Academy_Film_Awards
	q("Who hosted the BAFTA Film Awards for the first time in Feb 2026?", ["David Tennant", "Alan Cumming", "Graham Norton", "Richard Ayoade"], "Alan Cumming", 2),
	// https://en.wikipedia.org/wiki/79th_British_Academy_Film_Awards
	q("Which film tied a BAFTA record in Feb 2026 by losing all 11 of its nominations?", ["Wicked: For Good", "Bugonia", "Hamnet", "Marty Supreme"], "Marty Supreme", 3),
];

export const CUR_MUSIC_20261109A: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2026
	q("Which country won the Eurovision Song Contest in May 2026?", ["Israel", "Sweden", "Bulgaria", "Austria"], "Bulgaria", 1),
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2026
	q("What was the title of the winning song at Eurovision 2026?", ["Wasted Love", "Bangaranga", "Euphoria", "Tattoo"], "Bangaranga", 2),
	// https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2026
	q("Which singer performed Eurovision 2026's winning song for Bulgaria?", ["Nemo", "Joost", "Loreen", "Dara"], "Dara", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("At the Feb 2026 Grammys, whose album became the first Spanish-language Album of the Year?", ["Shakira", "Bad Bunny", "Rosalía", "Karol G"], "Bad Bunny", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("Which Kendrick Lamar song won Record of the Year at the Feb 2026 Grammys?", ["Luther", "TV Off", "Not Like Us", "Squabble Up"], "Luther", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("Which Billie Eilish song won Song of the Year at the Feb 2026 Grammys?", ["Chihiro", "Wildflower", "Birds of a Feather", "Lunch"], "Wildflower", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("In Feb 2026, which director became the 22nd EGOT winner by winning a Grammy?", ["Martin Scorsese", "Ron Howard", "George Lucas", "Steven Spielberg"], "Steven Spielberg", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("Who became the most-awarded hip-hop artist in Grammy history in Feb 2026?", ["Jay-Z", "Kendrick Lamar", "Drake", "Kanye West"], "Kendrick Lamar", 2),
];
