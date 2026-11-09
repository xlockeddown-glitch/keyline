import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Monday Nov 9, 2026 trivia batch 2, sub-batch e: time-anchored 2025–26 cards (Tonys, Grammys, Oscars, eclipse, WBC, Asian Games, Paralympics, Champions League, spelling bee). Sources in docs/trivia-current-20261109e-sources.md.
 */

export const CUR_SPORTS_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
	q("Which country became the first to host the men's World Cup three times in 2026?", ["Brazil", "Mexico", "Italy", "United States"], "Mexico", 2),
	// https://en.wikipedia.org/wiki/2026_World_Baseball_Classic
	q("Which country won the World Baseball Classic for the first time in 2026?", ["Venezuela", "Mexico", "Puerto Rico", "Dominican Republic"], "Venezuela", 2),
	// https://en.wikipedia.org/wiki/2026_World_Baseball_Classic
	q("Who was named MVP of the 2026 World Baseball Classic?", ["Eugenio Suárez", "Maikel García", "Shohei Ohtani", "Juan Soto"], "Maikel García", 3),
	// https://en.wikipedia.org/wiki/2026_Asian_Games
	q("Which Japanese city hosted the 2026 Asian Games?", ["Osaka", "Nagoya", "Tokyo", "Fukuoka"], "Nagoya", 2),
	// https://en.wikipedia.org/wiki/2026_Asian_Games
	q("Athletes at the 2026 Asian Games were partly housed on what?", ["an aircraft carrier", "a cruise ship", "a ferry terminal", "a university campus"], "a cruise ship", 3),
	// https://en.wikipedia.org/wiki/2026_Winter_Paralympics
	q("Which South American country won its first-ever Winter Paralympic medal in 2026?", ["Colombia", "Brazil", "Chile", "Argentina"], "Brazil", 2),
	// https://en.wikipedia.org/wiki/2026_World_Series
	q("Which team won the 2026 World Series, its first-ever title?", ["Tampa Bay Rays", "Seattle Mariners", "San Diego Padres", "Milwaukee Brewers"], "Milwaukee Brewers", 1),
	// https://en.wikipedia.org/wiki/2026_U.S._Open_(golf)
	q("Which club hosted the 2026 U.S. Open golf championship?", ["Shinnecock Hills", "Oakmont", "Pinehurst", "Pebble Beach"], "Shinnecock Hills", 2),
	// https://en.wikipedia.org/wiki/2026_Men's_T20_World_Cup
	q("Which two countries co-hosted the 2026 Men's T20 World Cup?", ["England and Ireland", "India and Sri Lanka", "Pakistan and UAE", "Australia and New Zealand"], "India and Sri Lanka", 2),
	// https://en.wikipedia.org/wiki/2026_Little_League_World_Series
	q("Which team won the 2026 Little League World Series?", ["Taiwan", "Japan", "Curaçao", "Henderson, Nevada"], "Curaçao", 2),
];

export const CUR_FOOD_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Nathan's_Hot_Dog_Eating_Contest
	q("Who won the men's Nathan's Hot Dog Eating Contest in 2026 with 66 hot dogs?", ["Joey Chestnut", "Geoffrey Esper", "Takeru Kobayashi", "Patrick Bertoletti"], "Joey Chestnut", 2),
	// https://en.wikipedia.org/wiki/Nathan's_Hot_Dog_Eating_Contest
	q("Who won the women's Nathan's Hot Dog Eating Contest in 2026?", ["Michelle Lesco", "Juliet Lee", "Miki Sudo", "Sonya Thomas"], "Miki Sudo", 2),
	// https://en.wikipedia.org/wiki/Nathan's_Hot_Dog_Eating_Contest
	q("How long do competitors have to eat hot dogs at Nathan's contest?", ["10 minutes", "5 minutes", "30 minutes", "15 minutes"], "10 minutes", 1),
	// https://en.wikipedia.org/wiki/Bocuse_d'Or
	q("In which French city is the Bocuse d'Or cooking contest held?", ["Lyon", "Paris", "Marseille", "Bordeaux"], "Lyon", 2),
];

export const CUR_ARTS_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/79th_Tony_Awards
	q("Which TV-series adaptation won Best Musical at the June 2026 Tony Awards?", ["Schmigadoon!", "Maybe Happy Ending", "Dead Outlaw", "Hell's Kitchen"], "Schmigadoon!", 2),
	// https://en.wikipedia.org/wiki/79th_Tony_Awards
	q("Which Arthur Miller revival won the most awards (six) at the 2026 Tony Awards?", ["The Crucible", "All My Sons", "Death of a Salesman", "A View from the Bridge"], "Death of a Salesman", 2),
	// https://en.wikipedia.org/wiki/79th_Tony_Awards
	q("Which play won Best Play at the 2026 Tony Awards?", ["Job", "Stereophonic", "Liberation", "Purpose"], "Liberation", 2),
];

export const CUR_SCIENCE_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Solar_eclipse_of_August_12,_2026
	q("On which date in 2026 did a total solar eclipse cross Greenland, Iceland and Spain?", ["April 8", "March 20", "October 2", "August 12"], "August 12", 2),
	// https://en.wikipedia.org/wiki/3I/ATLAS
	q("What number interstellar object confirmed was 3I/ATLAS?", ["third", "first", "fifth", "second"], "third", 2),
];

export const CUR_HISTORY_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/United_States_Semiquincentennial
	q("Which US anniversary was celebrated on July 4, 2026?", ["300th", "225th", "200th", "250th"], "250th", 2),
	// https://en.wikipedia.org/wiki/United_States_Semiquincentennial
	q("What is the US's 250th-anniversary program commonly called?", ["Liberty 2026", "Freedom250", "USA Forever", "America250"], "America250", 2),
];

export const CUR_GAMES_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
	q("In which year was Grand Theft Auto VI's second trailer released?", ["2024", "2025", "2023", "2026"], "2025", 2),
];

export const CUR_MUSIC_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("Who won Record of the Year at the 2026 Grammys with 'Luther'?", ["Sabrina Carpenter", "Lady Gaga", "Kendrick Lamar", "Bad Bunny"], "Kendrick Lamar", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("Which sibling duo won Song of the Year at the 2026 Grammys for 'Wildflower'?", ["The Jonas Brothers", "Haim", "Billie Eilish and Finneas", "Chloe x Halle"], "Billie Eilish and Finneas", 2),
	// https://en.wikipedia.org/wiki/68th_Annual_Grammy_Awards
	q("Which network will air the Grammys starting in 2027 after decades on CBS?", ["Netflix", "NBC", "ABC", "Fox"], "ABC", 3),
];

export const CUR_BOOKS_20261109E: TriviaQ[] = [
	// https://en.wikipedia.org/wiki/2026_Scripps_National_Spelling_Bee
	q("In which Washington, D.C. venue was the 2026 Scripps National Spelling Bee held for the first time?", ["Kennedy Center", "Warner Theatre", "Lincoln Theatre", "DAR Constitution Hall"], "DAR Constitution Hall", 2),
];
