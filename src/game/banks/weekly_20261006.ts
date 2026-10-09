import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Weekly trivia for Tuesday, 2026-10-06. Non-math only.
 * Current hooks are settled facts (World Cup, Super Bowl LX, 2026 NBA Finals,
 * Nobels announced Oct 5–6, Emmys, Oscars, James Beard, games that shipped).
 * Chemistry, literature, peace, and economics Nobels were not yet announced.
 * Wired from trivia.ts via WEEKLY_*_20261006 merges.
 * 2026-10-09 accuracy pass: all 50 trivia cards re-checked against public sources; none had a wrong
 * answer. Rewritten: ACL weekend-two card (was present tense, "runs"), Gears of War: E-Day studio card
 * (People Can Fly co-developed; now asks which Xbox studio led it), and the second tilcayo card (its range
 * is still uncertain, so "known from Bolivia" with Peru as a wrong choice could turn out wrong). Missing
 * source comments added.
 */

export const WEEKLY_SPORTS_20261006: TriviaQ[] = [
  // https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/final-tournament-standings
  // https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
  q("Which national team won the 2026 FIFA World Cup?", ["Spain", "Argentina", "France", "England"], "Spain", 1),
  // https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/final-tournament-standings
  q("The 2026 FIFA World Cup was co-hosted by the United States, Mexico, and…", ["Canada", "Brazil", "Japan", "Germany"], "Canada", 2),
  // https://en.wikipedia.org/wiki/Super_Bowl_LX
  // https://www.seahawks.com/super-bowl-lx/
  q("Which NFL team won Super Bowl LX in February 2026?", ["Seattle Seahawks", "New England Patriots", "Kansas City Chiefs", "San Francisco 49ers"], "Seattle Seahawks", 1),
  // https://www.nba.com/news/history-nba-champions
  // https://en.wikipedia.org/wiki/2026_NBA_Finals
  q("Which team won the 2026 NBA Finals?", ["New York Knicks", "San Antonio Spurs", "Oklahoma City Thunder", "Boston Celtics"], "New York Knicks", 2),
  // https://www.sportingnews.com/us/nba/new-york-knicks/news/who-won-finals-mvp-2026-voting-results-stats/fdb3218b78b68278eb0d6be4
  q("Who was named MVP of the 2026 NBA Finals?", ["Jalen Brunson", "Victor Wembanyama", "Karl-Anthony Towns", "Shai Gilgeous-Alexander"], "Jalen Brunson", 2),
  // https://www.pro-football-reference.com/boxscores/202602080nwe.htm
  q("Which team lost Super Bowl LX to the Seattle Seahawks?", ["New England Patriots", "Kansas City Chiefs", "Buffalo Bills", "Detroit Lions"], "New England Patriots", 2),
];

export const WEEKLY_LOCAL_20261006: TriviaQ[] = [
  // https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
  q("The 2026 FIFA World Cup final, in the New York area, was played at…", ["MetLife Stadium", "Yankee Stadium", "Citi Field", "Madison Square Garden"], "MetLife Stadium", 2),
  // https://en.wikipedia.org/wiki/Super_Bowl_LX
  q("Super Bowl LX, in the San Francisco Bay Area in February 2026, was played at…", ["Levi's Stadium", "Oracle Park", "Chase Center", "Oakland Coliseum"], "Levi's Stadium", 2),
  // https://www.austintexas.gov/emergency-management/news/fall-festival-season-returns-austin
  q("The 2026 Austin City Limits Music Festival at Zilker Park was which edition?", ["the 25th", "the 10th", "the 40th", "the 50th"], "the 25th", 2),
  // https://www.austintexas.gov/emergency-management/news/fall-festival-season-returns-austin
  // https://www.aclfestival.com/25years (OCT 2-4 & Oct 9-11, 2026)
  q("ACL Festival 2026's second weekend at Zilker Park was set for…", ["October 9-11", "October 16-18", "November 6-8", "September 18-20"], "October 9-11", 2),
  // MetLife Stadium is in East Rutherford; the 2026 final was played there.
  // https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
  q("MetLife Stadium, site of the 2026 World Cup final, stands in…", ["East Rutherford", "Hoboken", "Jersey City", "Newark"], "East Rutherford", 2),
];

export const WEEKLY_POLITICAL_20261006: TriviaQ[] = [
  // https://ballotpedia.org/J.D._Vance
  q("Who was vice president of the United States in October 2026?", ["J.D. Vance", "Mike Pence", "Tim Walz", "Kamala Harris"], "J.D. Vance", 1),
  // https://ballotpedia.org/List_of_current_members_of_the_U.S._Congress
  // https://www.washingtonexaminer.com/news/campaigns/congressional/4754825/who-will-survive-high-2026-stakes-for-top-leaders-congress/
  q("Who was Speaker of the U.S. House in October 2026?", ["Mike Johnson", "Hakeem Jeffries", "Kevin McCarthy", "Nancy Pelosi"], "Mike Johnson", 2),
  // https://ballotpedia.org/List_of_current_members_of_the_U.S._Congress
  q("Who was U.S. Senate majority leader in October 2026?", ["John Thune", "Chuck Schumer", "Mitch McConnell", "John Barrasso"], "John Thune", 2),
  // https://www.bbc.com/news/articles/c6wyz223j19po
  q("U.S. Election Day for the 2026 midterms falls on…", ["November 3", "November 4", "October 7", "December 8"], "November 3", 1),
  // All 435 House seats; 35 of 100 Senate seats. https://www.bbc.com/news/articles/c6wyz223j19po
  q("The 2026 U.S. midterms put every voting seat on the ballot in…", ["the House", "the Senate", "the Cabinet", "the courts"], "the House", 2),
];

export const WEEKLY_FOOD_20261006: TriviaQ[] = [
  // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
  q("The 2026 James Beard Award for Outstanding Chef went to the chef of which San Francisco restaurant?", ["Quince", "Benu", "Lazy Bear", "Saison"], "Quince", 2),
  // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
  q("Which Philadelphia restaurant won the 2026 James Beard Award for Outstanding Restaurant?", ["Kalaya", "Zahav", "Vetri", "Suraya"], "Kalaya", 2),
  // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
  q("The 2026 James Beard Award for Best New Restaurant went to Lei in which city?", ["New York", "Chicago", "Los Angeles", "New Orleans"], "New York", 2),
  // https://www.jamesbeard.org/stories/james-beard-award-winners-2026
  q("The 2026 James Beard Award for Outstanding Bakery went to a shop in…", ["Bozeman", "Portland", "Chicago", "Austin"], "Bozeman", 2),
  // https://www.jamesbeard.org/stories/james-beard-award-winners-2026 (Adrian Torres, Maximo, West University Place, TX)
  q("The 2026 James Beard Emerging Chef award went to the chef of…", ["Maximo", "Quince", "Kalaya", "Providence"], "Maximo", 3),
];

export const WEEKLY_ARTS_20261006: TriviaQ[] = [
  // https://www.oscars.org/oscars/ceremonies/2026
  q("Which actor earned a 2026 lead-actor Oscar nomination for the Best Picture winner?", ["Leonardo DiCaprio", "Michael B. Jordan", "Timothée Chalamet", "Wagner Moura"], "Leonardo DiCaprio", 2),
  // https://www.nytimes.com/2026/09/14/arts/television/emmy-winners-list.html
  // https://www.cnn.com/2026/09/14/entertainment/emmys-2026-winners-list
  q("Which series won the 2026 Emmy for outstanding drama series?", ["The Pitt", "The Diplomat", "Slow Horses", "Pluribus"], "The Pitt", 1),
  // https://www.nytimes.com/2026/09/14/arts/television/emmy-winners-list.html
  q("Which series won the 2026 Emmy for outstanding comedy series?", ["Widow's Bay", "Abbott Elementary", "The Bear", "Hacks"], "Widow's Bay", 2),
  // https://www.criterion.com/current/posts/9089-one-battle-after-another-and-sinners-win-top-oscars
  q("Who won the 2026 Oscar for best actor?", ["Michael B. Jordan", "Leonardo DiCaprio", "Timothée Chalamet", "Wagner Moura"], "Michael B. Jordan", 2),
  // https://www.npr.org/2026/09/14/nx-s1-5957565/emmys-2026-winners
  q("Allison Janney won the 2026 Emmy for drama supporting actress for which series?", ["The Diplomat", "The Pitt", "Pluribus", "Slow Horses"], "The Diplomat", 2),
];

export const WEEKLY_SCIENCE_20261006: TriviaQ[] = [
  // https://www.nobelprize.org/prizes/physics/2026/press-release/
  q("The 2026 Nobel Prize in Physics honored Francis Halzen's work on which observatory?", ["IceCube", "Super-Kamiokande", "ANTARES", "Daya Bay"], "IceCube", 2),
  // https://www.nobelprize.org/prizes/physics/2026/press-release/
  q("IceCube, cited in the 2026 physics Nobel, detects neutrinos in ice at…", ["the South Pole", "the Swiss Alps", "the Atacama Desert", "the Greenland ice"], "the South Pole", 2),
  // https://www.nobelprize.org/prizes/medicine/2026/press-release/
  q("The 2026 Nobel in Physiology or Medicine honored ion channels gated by…", ["visible light", "radio waves", "ultrasound", "infrared heat"], "visible light", 2),
  // https://www.nobelprize.org/prizes/medicine/2026/press-release/
  q("The 2026 Nobel in medicine honored a technique called…", ["optogenetics", "CRISPR editing", "radiotherapy", "chemotherapy"], "optogenetics", 3),
  // https://www.nobelprize.org/prizes/physics/2026/press-release/
  q("The 2026 physics Nobel, for IceCube, recognized work on high-energy…", ["neutrinos", "gravitons", "photons", "muons"], "neutrinos", 2),
];

export const WEEKLY_HISTORY_20261006: TriviaQ[] = [
  // https://www.whitehouse.gov/presidential-actions/2026/07/250th-anniversary-of-the-adoption-of-the-declaration-of-independence/
  // https://www.archives.gov/freedom250
  q("On July 4, 2026, the United States marked how long since the Declaration of Independence?", ["250 years", "200 years", "150 years", "100 years"], "250 years", 1),
  // https://en.wikipedia.org/wiki/United_States_Semiquincentennial
  q("A 250th anniversary, such as the U.S. independence mark in 2026, is called a…", ["semiquincentennial", "sesquicentennial", "bicentennial", "quincentennial"], "semiquincentennial", 3),
  // https://en.wikipedia.org/wiki/United_States_Semiquincentennial
  q("The U.S. Bicentennial, the independence anniversary before 2026, was held in…", ["1976", "1876", "1926", "1826"], "1976", 2),
  // https://www.commerce.gov/freedom-250
  // https://www.whitehouse.gov/freedom250/
  q("The White House's 2026 campaign for the 250th birthday is called…", ["Freedom 250", "Project 250", "Liberty Bell 250", "Star-Spangled 250"], "Freedom 250", 2),
  // https://www.archives.gov/founding-docs/declaration-history
  q("In 1776 the Second Continental Congress adopted the Declaration in which city?", ["Philadelphia", "Boston", "New York", "Williamsburg"], "Philadelphia", 2),
];

export const WEEKLY_NATURE_20261006: TriviaQ[] = [
  // https://indianexpress.com/article/cities/ahmedabad/kutch-afro-asian-sand-snake-sighting-gujarat-wildlife-10899757/
  // https://www.bbc.com/hindi/articles/ckpdgq322061o
  q("In September 2026, forest staff in India's Kutch district recorded which snake last confirmed there in 1872?", ["Afro-Asian sand snake", "Indian rock python", "common sand boa", "spectacled cobra"], "Afro-Asian sand snake", 3),
  // No second settled nature headline this week (the early-October Atlantic storm was still a forecast).
  // Evergreen river-landform gap instead: https://www.britannica.com/science/oxbow-lake
  q("An oxbow lake forms when a river…", ["cuts off a bend", "deepens a canyon", "fills a crater", "dams a glacier"], "cuts off a bend", 2),
  // Current Biology, 17 Sep 2026. https://www.dvm360.com/view/new-species-discovered-in-bolivia-is-first-cat-described-in-more-than-100-years
  // https://www.bbc.com/news/articles/c6x2zgv9rr4ro
  q("In 2026, scientists described a new Bolivian wild cat called the…", ["tilcayo", "oncilla", "kodkod", "jaguarundi"], "tilcayo", 3),
  // dvm360 (above): first new living cat species formally described in more than 100 years (pampas cat, 1923).
  q("The tilcayo, described in 2026, is the first new wild cat species formally named in more than…", ["100 years", "10 years", "25 years", "50 years"], "100 years", 2),
];

export const WEEKLY_GAMES_20261006: TriviaQ[] = [
  // https://www.xbox.com/en-US/games/gears-of-war-eday
  // https://news.xbox.com/en-us/2026/10/06/gears-of-war-e-day-global-launch-tips-guide/ (worldwide launch Oct 6; origin story 14 years before Gears of War)
  q("Gears of War: E-Day, released on October 6, 2026, is a prequel about…", ["Emergence Day", "Judgment Day", "Victory Day", "Armistice Day"], "Emergence Day", 2),
  // https://www.xbox.com/en-US/games/gears-of-war-eday
  // https://peoplecanfly.com/partnership-announcement/ (People Can Fly co-developed with The Coalition)
  q("Which Xbox studio led development of Gears of War: E-Day, released in October 2026?", ["The Coalition", "Halo Studios", "Rare", "Turn 10"], "The Coalition", 3),
  // https://www.bandainamcoent.com/news/ace-combat-8-wings-of-theve-takes-flight-today
  q("Ace Combat 8: Wings of Theve had its full worldwide launch in 2026 on…", ["October 2", "October 6", "October 23", "November 19"], "October 2", 2),
  // https://starwarsgalacticracer.com/news/star-wars-galactic-racer-is-out-now/
  q("Star Wars: Galactic Racer, out on October 6, 2026, was developed by…", ["Fuse Games", "The Coalition", "EA Motive", "Ubisoft"], "Fuse Games", 2),
  // https://starwarsgalacticracer.com/news/star-wars-galactic-racer-is-out-now/
  q("Star Wars: Galactic Racer, released in October 2026, was published by…", ["Secret Mode", "Xbox Game Studios", "Electronic Arts", "Bandai Namco"], "Secret Mode", 3),
];

export const WEEKLY_CELEBRITY_20261006: TriviaQ[] = [
  // https://www.nytimes.com/2026/09/14/arts/television/emmy-winners-list.html
  // https://www.latimes.com/entertainment-arts/awards/story/2026-09-14/emmys-2026-complete-list-winners
  q("Noah Wyle won the 2026 Emmy for lead actor in a drama for which series?", ["The Pitt", "The Diplomat", "Slow Horses", "Paradise"], "The Pitt", 2),
  // https://www.cnn.com/2026/09/14/entertainment/emmys-2026-winners-list
  // https://www.latimes.com/entertainment-arts/awards/story/2026-09-14/emmys-2026-complete-list-winners
  q("Jean Smart won the 2026 Emmy for lead actress in a comedy for which series?", ["Hacks", "The Bear", "Shrinking", "Abbott Elementary"], "Hacks", 2),
  // https://www.oscars.org/oscars/ceremonies/2026
  q("Who won the 2026 Academy Award for best director?", ["Paul Thomas Anderson", "Guillermo del Toro", "Yorgos Lanthimos", "Joachim Trier"], "Paul Thomas Anderson", 2),
  // https://www.criterion.com/current/posts/9089-one-battle-after-another-and-sinners-win-top-oscars
  q("Who won the 2026 Oscar for best supporting actor?", ["Sean Penn", "Benicio Del Toro", "Jacob Elordi", "Delroy Lindo"], "Sean Penn", 2),
  // https://www.npr.org/2026/09/14/nx-s1-5957565/emmys-2026-winners
  q("Stephen Root won the 2026 Emmy for comedy supporting actor for which series?", ["Widow's Bay", "Hacks", "Shrinking", "Abbott Elementary"], "Widow's Bay", 2),
];
