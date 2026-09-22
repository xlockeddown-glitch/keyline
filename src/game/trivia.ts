import { PLACE } from "@/game/banks/place";
import { aboutTopic, pinCats, placeWeights, topicsFor } from "./place";
import { q } from "./quiz";
import {
  allowedRarities,
  emptyBuckets,
  isSeen,
  pickUnseenRarity,
  rarityStats,
  sealPlate,
  stampCityRecord,
} from "./rarity";
import { GENERAL_BANK } from "@/game/banks/general";
import { MATH_BANK } from "@/game/banks/math";
import { MATH_MORE } from "@/game/banks/math_more";
import { SCIENCE_BANK } from "@/game/banks/science";
import { SCIENCE_MORE } from "@/game/banks/science_more";
import { SCIENCE_LIFE } from "@/game/banks/science_life";
import { HISTORY_BANK } from "@/game/banks/history";
import { HISTORY_MORE } from "@/game/banks/history_more";
import { HISTORY_LIFE } from "@/game/banks/history_life";
import { NATURE_BANK } from "@/game/banks/nature";
import { NATURE_MORE } from "@/game/banks/nature_more";
import { NATURE_LIFE } from "@/game/banks/nature_life";
import { CITY_EXTRA } from "@/game/banks/cities";
import {
  WEEKLY_HISTORY,
  WEEKLY_NATURE,
  WEEKLY_POLITICAL,
  WEEKLY_SCIENCE,
} from "@/game/banks/weekly_20260922";
import type { CityId, Poi, Tier, TriviaCat, TriviaDiff, TriviaQ } from "./types";

export const TRIVIA_CATS: { id: TriviaCat; label: string; blurb: string }[] = [
	{ id: "sports", label: "Sports", blurb: "Clubs, stadiums, scores of record." },
	{ id: "local", label: "Local", blurb: "This city and its state — streets, landmarks, the ward." },
	{ id: "political", label: "Political", blurb: "Capitals, councils, who holds the keys." },
	{ id: "food", label: "Food", blurb: "Tables, smoke, the city's appetite." },
	{ id: "arts", label: "Arts", blurb: "Stages, walls, songs that stuck." },
	{ id: "math", label: "Math", blurb: "Numbers. White is arithmetic. Higher lamps bite." },
	{ id: "science", label: "Science", blurb: "Earth, sky, the stuff of the lab." },
	{ id: "history", label: "History", blurb: "Years, wars, who wrote the plate." },
	{ id: "nature", label: "Nature", blurb: "Woods, water, the living street." },
];
export const ALL_CATS: TriviaCat[] = TRIVIA_CATS.map((c) => c.id);
export const DIFF_LABEL = {
	1: "Easy",
	2: "Standard",
	3: "Hard"
};
export const DIFF_MULT = {
	1: 0.7,
	2: 1,
	3: 1.45
};
const CORE_GENERAL: Partial<Record<TriviaCat, TriviaQ[]>> = {
	sports: [
		q("How many players are on the field for one NFL team at a time?", [
			"9",
			"11",
			"15",
			"7"
		], "11"),
		q("A marathon is officially how many miles?", [
			"24.2",
			"25",
			"26.2",
			"30"
		], "26.2"),
		q("The Olympic rings represent what?", [
			"Five continents",
			"Five sports",
			"Five gods",
			"Five years"
		], "Five continents"),
		q("How long is a standard NBA game, not counting overtime?", [
			"40 minutes",
			"48 minutes",
			"60 minutes",
			"90 minutes"
		], "48 minutes"),
		q("In soccer, a match is typically two halves of how many minutes?", [
			"40",
			"45",
			"30",
			"60"
		], "45"),
		q("Wimbledon is played on which surface?", [
			"Clay",
			"Grass",
			"Hard court",
			"Carpet"
		], "Grass"),
		q("The Stanley Cup is awarded in which sport?", [
			"Baseball",
			"Football",
			"Hockey",
			"Lacrosse"
		], "Hockey"),
		q("A cricket Test match is played over up to how many days?", [
			"One",
			"Three",
			"Five",
			"Seven"
		], "Five")
	],
	local: [
		q("A copse is a small…", [
			"Lake",
			"Hill",
			"Wood",
			"Bridge"
		], "Wood"),
		q("A 'riparian' zone is land along a…", [
			"Ridge",
			"River",
			"Fault",
			"Road"
		], "River"),
		q("What does GPS actually measure to find your position?", [
			"Radio time delay from satellites",
			"Earth's magnetic field",
			"Cell tower names",
			"Star angles"
		], "Radio time delay from satellites"),
		q("Which meridian is used as the prime meridian for modern maps?", [
			"Paris",
			"Greenwich",
			"Washington",
			"Rome"
		], "Greenwich"),
		q("How many degrees of longitude make a full trip around Earth?", [
			"90",
			"180",
			"360",
			"24"
		], "360"),
		q("Tides are caused primarily by the gravity of the…", [
			"Sun",
			"Moon",
			"Jupiter",
			"Earth's core"
		], "Moon")
	],
	political: [
		q("How many voting members sit in the U.S. House of Representatives?", [
			"100",
			"435",
			"50",
			"538"
		], "435"),
		q("A U.S. senator's term lasts how many years?", [
			"Two",
			"Four",
			"Six",
			"Eight"
		], "Six"),
		q("The U.S. Capitol's dome is made primarily of…", [
			"Marble",
			"Cast iron",
			"Granite",
			"Copper"
		], "Cast iron"),
		q("A 'borough' is a kind of…", [
			"River",
			"Administrative district",
			"Courthouse",
			"Park"
		], "Administrative district"),
		q("Which branch of the U.S. government writes federal statutes?", [
			"Executive",
			"Judicial",
			"Legislative",
			"Military"
		], "Legislative"),
		q("The Bill of Rights is the first how many amendments to the U.S. Constitution?", [
			"Five",
			"Eight",
			"Ten",
			"Twelve"
		], "Ten"),
		q("A city's 'grid' plan in the US is often credited to which 1811 plan?", [
			"Chicago",
			"Philadelphia",
			"Commissioners' Plan of New York",
			"L'Enfant's D.C."
		], "Commissioners' Plan of New York"),
		q("In the UK, the House of Commons is the…", [
			"Upper house",
			"Elected lower house",
			"Royal court",
			"City council"
		], "Elected lower house", 2),
		q("How many justices sit on the U.S. Supreme Court?", [
			"7",
			"8",
			"9",
			"12"
		], "9", 1)
	],
	food: [
		q("Texas-style barbecue is most associated with which cut?", [
			"Spare ribs",
			"Pork shoulder",
			"Beef brisket",
			"Chicken thigh"
		], "Beef brisket", 1),
		q("Espresso is extracted by forcing water through coffee at high…", [
			"Temperature only",
			"Pressure",
			"Altitude",
			"Spin"
		], "Pressure", 1),
		q("Sourdough rises because of…", [
			"Baking powder",
			"Wild yeast and bacteria",
			"Eggs",
			"Steam"
		], "Wild yeast and bacteria", 2),
		q("Umami was identified as a fifth taste in which country?", [
			"France",
			"China",
			"Japan",
			"Italy"
		], "Japan", 2),
		q("A bagel is traditionally boiled before it is…", [
			"Fried",
			"Baked",
			"Smoked",
			"Pickled"
		], "Baked", 1),
		q("Champagne, in the strict sense, comes from which country?", [
			"Spain",
			"France",
			"Italy",
			"California"
		], "France", 1),
		q("Mole poblano is a sauce most associated with…", [
			"Peru",
			"Mexico",
			"Spain",
			"the Philippines"
		], "Mexico", 2),
		q("Fish and chips in Britain are classically fried in…", [
			"Olive oil only",
			"Beef dripping or oil",
			"Butter",
			"Lard and honey"
		], "Beef dripping or oil", 3),
		q("A 'mother sauce' in French cooking is one of Escoffier's set of…", [
			"Three",
			"Five",
			"Seven",
			"Twelve"
		], "Five", 3),
		q("Whataburger began in which U.S. state?", [
			"California",
			"Texas",
			"Florida",
			"Oklahoma"
		], "Texas", 2)
	],
	arts: [
		q("The Mona Lisa hangs in which museum?", [
			"Prado",
			"Uffizi",
			"Louvre",
			"MoMA"
		], "Louvre", 1),
		q("Who painted the ceiling of the Sistine Chapel?", [
			"Raphael",
			"Michelangelo",
			"Donatello",
			"Leonardo"
		], "Michelangelo", 1),
		q("A 'soliloquy' is when a character…", [
			"Fights",
			"Speaks thoughts aloud",
			"Enters disguised",
			"Dances"
		], "Speaks thoughts aloud", 2),
		q("Which film won the first Academy Award for Best Picture?", [
			"Wings",
			"Metropolis",
			"Sunrise",
			"The Jazz Singer"
		], "Wings", 3),
		q("The director who made 'Citizen Kane' also starred in it. Who?", [
			"Hitchcock",
			"Welles",
			"Ford",
			"Capra"
		], "Welles", 2),
		q("Jazz is widely said to have been born in…", [
			"Chicago",
			"New Orleans",
			"Harlem only",
			"Kansas City only"
		], "New Orleans", 2),
		q("Swan Lake is a…", [
			"Symphony",
			"Ballet",
			"Opera buffa",
			"Tone poem"
		], "Ballet", 1),
		q("The Globe theatre is tied to which playwright?", [
			"Marlowe",
			"Shakespeare",
			"Jonson",
			"Shaw"
		], "Shakespeare", 1),
		q("A 'still life' painting typically depicts…", [
			"Battles",
			"Portraits of nobles",
			"Inanimate objects",
			"Landscapes"
		], "Inanimate objects", 2),
		q("Beethoven's Ninth Symphony is famous for setting which text in the finale?", [
			"Ave Maria",
			"Ode to Joy",
			"Dies Irae",
			"Greensleeves"
		], "Ode to Joy", 2)
	]
};
function mergeCat(a: TriviaQ[], b: TriviaQ[]): TriviaQ[] {
	const seen = new Set(a.map((x) => x.q));
	const out = [...a];
	for (const item of b) if (!seen.has(item.q)) {
		seen.add(item.q);
		out.push(item);
	}
	return out;
}
const GENERAL: Record<TriviaCat, TriviaQ[]> = {
	sports: mergeCat(CORE_GENERAL.sports ?? [], GENERAL_BANK.sports ?? []),
	local: mergeCat(CORE_GENERAL.local ?? [], GENERAL_BANK.local ?? []),
	political: mergeCat(mergeCat(CORE_GENERAL.political ?? [], GENERAL_BANK.political ?? []), WEEKLY_POLITICAL),
	food: mergeCat(CORE_GENERAL.food ?? [], GENERAL_BANK.food ?? []),
	arts: mergeCat(CORE_GENERAL.arts ?? [], GENERAL_BANK.arts ?? []),
	math: mergeCat(MATH_BANK, MATH_MORE),
	science: mergeCat(mergeCat(mergeCat(SCIENCE_BANK, SCIENCE_MORE), SCIENCE_LIFE), WEEKLY_SCIENCE),
	history: mergeCat(mergeCat(mergeCat(HISTORY_BANK, HISTORY_MORE), HISTORY_LIFE), WEEKLY_HISTORY),
	nature: mergeCat(mergeCat(mergeCat(NATURE_BANK, NATURE_MORE), NATURE_LIFE), WEEKLY_NATURE),
};
const TEXAS_LOCAL = [
	q("Texas has how many official state capitol buildings still standing in Austin's grounds story — the current Capitol opened in which decade?", [
		"1860s",
		"1880s",
		"1910s",
		"1930s"
	], "1880s", "The present Texas Capitol opened in 1888."),
	q("The Colorado River in Austin drains toward which body of water?", [
		"Gulf of Mexico",
		"Pacific Ocean",
		"Red River",
		"Rio Grande only"
	], "Gulf of Mexico"),
	q("Central Texas sits mostly in which USDA-ish climate story: summers are…", [
		"Dry and cool",
		"Hot and often humid",
		"Alpine",
		"Marine west-coast"
	], "Hot and often humid"),
	q("I-35 through Temple and Austin runs roughly…", [
		"East–west",
		"North–south",
		"Along the coast only",
		"Around Dallas only"
	], "North–south"),
	q("The Hill Country is best described as…", [
		"A desert basin",
		"Limestone hills west of Austin",
		"A salt flat",
		"The Piney Woods"
	], "Limestone hills west of Austin"),
	q("What is the capital of Texas?", [
		"Houston",
		"Dallas",
		"Austin",
		"San Antonio"
	], "Austin"),
	q("The largest city in Texas by population is…", [
		"Dallas",
		"Austin",
		"Houston",
		"El Paso"
	], "Houston", 1),
	q("The Alamo stands in which Texas city?", [
		"Austin",
		"San Antonio",
		"Goliad",
		"Houston"
	], "San Antonio", 1),
	q("Texas is nicknamed the…", [
		"Silver State",
		"Lone Star State",
		"Sunshine State",
		"Empire State"
	], "Lone Star State", 1),
	q("The Rio Grande forms much of Texas's border with…", [
		"Oklahoma",
		"Mexico",
		"Louisiana",
		"New Mexico only inland"
	], "Mexico", 1),
	q("Texas touches which body of water on the southeast?", [
		"Pacific Ocean",
		"Gulf of Mexico",
		"Great Lakes",
		"Chesapeake Bay"
	], "Gulf of Mexico", 1),
	q("The Texas Panhandle is the state's…", [
		"Southern tip at Brownsville",
		"Northern rectangular extension",
		"Barrier-island chain",
		"Hill Country core"
	], "Northern rectangular extension", 1),
	q("Big Bend National Park sits along the…", [
		"Red River",
		"Rio Grande",
		"Sabine",
		"Trinity"
	], "Rio Grande", 2),
	q("NASA's Johnson Space Center is in which Texas metro?", [
		"Austin",
		"Houston",
		"Dallas",
		"El Paso"
	], "Houston", 1),
	q("The Dallas–Fort Worth area is often called the…", [
		"Bayou City",
		"Metroplex",
		"Magic City",
		"Valley"
	], "Metroplex", 2),
	q("El Paso sits in far west Texas on the…", [
		"Red River",
		"Rio Grande",
		"Neches",
		"Brazos only"
	], "Rio Grande", 2),
	q("The Piney Woods are in which part of Texas?", [
		"Far west desert",
		"East Texas",
		"the Panhandle",
		"the Valley only"
	], "East Texas", 2),
	q("Texas shares a border with which U.S. state to the north of the Metroplex?", [
		"Arkansas only",
		"Oklahoma",
		"Kansas",
		"Colorado"
	], "Oklahoma", 1),
	q("Galveston is a Texas city on…", [
		"a Great Lake",
		"the Gulf of Mexico",
		"the Pacific",
		"the Rio Grande's headwaters"
	], "the Gulf of Mexico", 1),
	q("Six flags over Texas refers to nations that…", [
		"hosted F1",
		"claimed the land",
		"built oil rigs",
		"founded UT"
	], "claimed the land", 2),
	q("Padre Island is a Texas…", [
		"mountain range",
		"barrier island",
		"desert basin",
		"capitol annex"
	], "barrier island", 2),
	q("Waco sits on the Brazos River roughly between Dallas and…", [
		"El Paso",
		"Austin",
		"Amarillo",
		"Beaumont"
	], "Austin", 2),
	q("Pecan is the Texas state…", [
		"flower",
		"tree",
		"bird",
		"motto"
	], "tree", 1)
];
const TEXAS_SPORTS = [
	q("The University of Texas at Austin's football team is nicknamed the…", [
		"Aggies",
		"Longhorns",
		"Bears",
		"Red Raiders"
	], "Longhorns"),
	q("Texas A&M's teams are the…", [
		"Longhorns",
		"Aggies",
		"Mustangs",
		"Horned Frogs"
	], "Aggies"),
	q("The Dallas Cowboys play in which metro?", [
		"Austin",
		"Houston",
		"Dallas–Fort Worth",
		"San Antonio"
	], "Dallas–Fort Worth"),
	q("Austin FC plays which sport?", [
		"NFL football",
		"Major League Soccer",
		"MLB baseball",
		"NHL hockey"
	], "Major League Soccer"),
	q("The Houston Astros play in which league?", [
		"NFL",
		"NBA",
		"American League (MLB)",
		"MLS"
	], "American League (MLB)"),
	q("Formula 1's United States Grand Prix is run at…", [
		"COTA in Austin",
		"Daytona",
		"Indianapolis Motor Speedway only",
		"Texas Motor Speedway in Fort Worth"
	], "COTA in Austin")
];
const TEXAS_POLITICAL = [
	q("Texas has how many seats in the U.S. Senate?", [
		"One",
		"Two",
		"Four",
		"Thirty-six"
	], "Two"),
	q("The Texas Legislature is…", [
		"Unicameral",
		"Bicameral — House and Senate",
		"A city council",
		"Appointed by the governor"
	], "Bicameral — House and Senate"),
	q("Texas does not levy a state tax on…", [
		"Sales",
		"Property",
		"Personal income",
		"Gasoline"
	], "Personal income"),
	q("The Governor of Texas is the state's…", [
		"Chief justice",
		"Chief executive",
		"U.S. senator",
		"Speaker of the House"
	], "Chief executive"),
	q("Travis County's seat is…", [
		"Round Rock",
		"Austin",
		"Bastrop",
		"San Marcos"
	], "Austin"),
	q("Bell County's seat is…", [
		"Temple",
		"Killeen",
		"Belton",
		"Waco"
	], "Belton", 2)
];
const TEXAS_FOOD = [
	q("Texas chili, in the traditional 'bowl of red,' typically contains no…", [
		"Beef",
		"Beans",
		"Chile",
		"Cumin"
	], "Beans", 2),
	q("A kolache in Central Texas is most often a…", [
		"Smoked rib",
		"Yeast pastry, often with sausage",
		"Corn tortilla",
		"Frito pie"
	], "Yeast pastry, often with sausage", 2),
	q("The breakfast taco is a staple of which Texas region?", [
		"Panhandle only",
		"Central and South Texas",
		"East Texas piney woods only",
		"El Paso only"
	], "Central and South Texas", 1),
	q("Pecan is the state tree of Texas and also a famous…", [
		"Pie filling",
		"Barbecue wood only",
		"Beer hop",
		"Chili thickener"
	], "Pie filling", 1)
];
const TEXAS_ARTS = [
	q("Austin City Limits began as a…", [
		"Film festival",
		"PBS music television series",
		"Rodeo",
		"Newspaper"
	], "PBS music television series", 2),
	q("SXSW is a festival based in…", [
		"Dallas",
		"Austin",
		"Houston",
		"San Antonio"
	], "Austin", 1),
	q("Stevie Ray Vaughan is a guitarist most tied to which Texas city?", [
		"Lubbock",
		"Austin",
		"Amarillo",
		"Beaumont"
	], "Austin", 2),
	q("The Texas State Capitol's Goddess of Liberty holds a…", [
		"Sword",
		"Star",
		"Lantern",
		"Book"
	], "Star", 3)
];
const CITY: Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>> = {
	austin: {
		local: [
			q("The Texas Capitol is clad in which local stone?", [
				"Limestone",
				"Sunset Red granite",
				"Marble",
				"Sandstone"
			], "Sunset Red granite"),
			q("How many stories is the UT Tower?", [
				"14",
				"21",
				"27",
				"33"
			], "27"),
			q("Barton Springs stays near what temperature year-round?", [
				"55°F",
				"70°F",
				"85°F",
				"It freezes in winter"
			], "70°F"),
			q("Which animals pour out from under Congress Avenue Bridge at dusk in summer?", [
				"Chimney swifts",
				"Mexican free-tailed bats",
				"Grackles",
				"Cave swallows"
			], "Mexican free-tailed bats"),
			q("What was Lady Bird Lake called before 2007?", [
				"Lake Austin",
				"Town Lake",
				"Lake Travis",
				"Colorado Bend"
			], "Town Lake"),
			q("Franklin Barbecue is most famous for which smoked meat?", [
				"Turkey",
				"Beef brisket",
				"Sausage",
				"Pork ribs"
			], "Beef brisket"),
			q("Whole Foods Market was founded in which city?", [
				"Berkeley",
				"Austin",
				"Portland",
				"Boulder"
			], "Austin"),
			q("Austin styles itself the Live Music Capital of the…", [
				"South",
				"World",
				"West",
				"Sun Belt"
			], "World")
		],
		sports: [
			q("Darrell K Royal–Texas Memorial Stadium is home to which team?", [
				"Texas A&M Aggies",
				"Texas Longhorns football",
				"Austin FC",
				"Dallas Cowboys"
			], "Texas Longhorns football"),
			q("The UT mascot is a longhorn steer named…", [
				"Reveille",
				"Bevo",
				"Hook",
				"Colt"
			], "Bevo"),
			q("Moody Center on campus hosts UT men's basketball and…", [
				"Rodeo finals only",
				"Concerts and other sports",
				"The state legislature",
				"F1 paddock"
			], "Concerts and other sports"),
			q("Austin FC's first MLS season was…", [
				"2016",
				"2019",
				"2021",
				"2024"
			], "2021")
		],
		political: [
			q("The Texas State Capitol houses the…", [
				"U.S. Congress",
				"Texas Legislature and governor's offices",
				"Supreme Court only",
				"City of Austin council"
			], "Texas Legislature and governor's offices"),
			q("The LBJ Presidential Library sits on the campus of…", [
				"Texas A&M",
				"UT Austin",
				"Rice",
				"Baylor"
			], "UT Austin"),
			q("Austin is the county seat of…", [
				"Williamson County",
				"Hays County",
				"Travis County",
				"Bastrop County"
			], "Travis County"),
			q("The Texas Governor's Mansion stands near…", [
				"Zilker Park",
				"The Capitol",
				"The airport",
				"Mount Bonnell"
			], "The Capitol", 2)
		],
		food: [
			q("Franklin Barbecue is most famous for which smoked meat?", [
				"Turkey",
				"Beef brisket",
				"Sausage",
				"Pork ribs"
			], "Beef brisket", 1),
			q("Whole Foods Market was founded in which city?", [
				"Berkeley",
				"Austin",
				"Portland",
				"Boulder"
			], "Austin", 2),
			q("Austin's signature breakfast fold is usually a…", [
				"Kolache",
				"Breakfast taco",
				"Biscuit slather",
				"Cronut"
			], "Breakfast taco", 1),
			q("Barton Springs sits in a park also famous for…", [
				"Ski jumps",
				"Zilker's wide lawn and food events",
				"A Formula 1 paddock",
				"The capitol cafeteria"
			], "Zilker's wide lawn and food events", 2)
		],
		arts: [
			q("ACL Live at the Moody Theater hosts which long-running music series?", [
				"Austin City Limits",
				"Grand Ole Opry",
				"Prairie Home",
				"Soul Train"
			], "Austin City Limits", 2),
			q("The Paramount Theatre on Congress is a…", [
				"Ballpark",
				"Historic movie and stage house",
				"City hall annex",
				"Recording studio only"
			], "Historic movie and stage house", 2),
			q("The Blanton Museum of Art sits on the campus of…", [
				"Texas State",
				"UT Austin",
				"St. Edward's",
				"Huston-Tillotson only"
			], "UT Austin", 2),
			q("Austin calls itself the Live Music Capital of the…", [
				"South",
				"World",
				"West",
				"Sun Belt"
			], "World", 1)
		]
	},
	temple: {
		local: [
			q("Temple, Texas was named for a railroad civil engineer. Who?", [
				"Jay Gould",
				"Bernard Moore Temple",
				"Leland Stanford",
				"Cyrus K. Holliday"
			], "Bernard Moore Temple"),
			q("Temple sits in which Texas county, whose seat is Belton?", [
				"McLennan",
				"Bell",
				"Williamson",
				"Falls"
			], "Bell"),
			q("Scott & White began in Temple in which year?", [
				"1845",
				"1876",
				"1897",
				"1918"
			], "1897"),
			q("Temple grew as a division point on which railroad?", [
				"Southern Pacific only",
				"Gulf, Colorado and Santa Fe",
				"Union Pacific from day one",
				"Katy Limited"
			], "Gulf, Colorado and Santa Fe"),
			q("The Santa Fe Depot in Temple now also houses a…", [
				"Courthouse",
				"Railroad museum",
				"Capitol annex",
				"Ballpark"
			], "Railroad museum"),
			q("Temple lies along which major interstate?", [
				"I-10",
				"I-20",
				"I-35",
				"I-45"
			], "I-35"),
			q("Miller Springs Nature Center sits on land tied to which lake project?", [
				"Lake Travis",
				"Belton Lake",
				"Canyon Lake",
				"Lake Waco"
			], "Belton Lake")
		],
		sports: [
			q("Temple High School's teams are the…", [
				"Tigers",
				"Wildcats",
				"Eagles",
				"Rangers"
			], "Wildcats"),
			q("A long-running high-school rivalry for Temple is with nearby…", [
				"Austin High",
				"Belton",
				"Waco Midway only",
				"Killeen Shoemaker only"
			], "Belton"),
			q("The University of Mary Hardin-Baylor, a few miles from Temple, is in…", [
				"Waco",
				"Belton",
				"Round Rock",
				"Georgetown"
			], "Belton"),
			q("Baker Field in Temple is used for…", [
				"Formula 1",
				"Local school athletics",
				"The Cowboys' practice",
				"UT spring game"
			], "Local school athletics")
		],
		political: [
			q("Temple is a city in which U.S. state?", [
				"Oklahoma",
				"Texas",
				"New Mexico",
				"Louisiana"
			], "Texas"),
			q("Bell County's courthouse and county government sit in…", [
				"Temple",
				"Killeen",
				"Belton",
				"Harker Heights"
			], "Belton"),
			q("Temple's municipal building is the seat of…", [
				"Bell County",
				"The City of Temple",
				"The Texas Senate",
				"UMHB"
			], "The City of Temple"),
			q("Fort Cavazos (formerly Fort Hood), a major employer for the area, is in which county?", [
				"Travis",
				"Bell",
				"McLennan",
				"Williamson"
			], "Bell", 2)
		],
		food: [
			q("Temple sits in a Central Texas belt known for Czech bakeries selling…", [
				"Beignets",
				"Kolaches",
				"Cronuts",
				"Empanadas only"
			], "Kolaches", 2),
			q("A 'meat-and-three' plate in this part of Texas is closest to…", [
				"Sushi omakase",
				"A diner plate with sides",
				"Tapas",
				"Dim sum"
			], "A diner plate with sides", 1),
			q("Scott & White's hometown tables are a short hop from which barbecue belt?", [
				"Lockhart / Central Texas",
				"Memphis only",
				"Kansas City only",
				"The Carolina coast"
			], "Lockhart / Central Texas", 3)
		],
		arts: [
			q("The Santa Fe Depot in Temple also houses a…", [
				"Opera house",
				"Railroad museum",
				"Film studio",
				"Ballet school"
			], "Railroad museum", 1),
			q("Temple College sits in a city named for a…", [
				"Spanish mission",
				"Railroad engineer",
				"Cotton baron",
				"President"
			], "Railroad engineer", 2),
			q("Nearby Belton is home to UMHB, whose campus arts sit in…", [
				"Waco",
				"Bell County",
				"Travis County",
				"Austin"
			], "Bell County", 2)
		]
	},
	nyc: {
		local: [
			q("How many floors does the Empire State Building have?", [
				"86",
				"100",
				"102",
				"110"
			], "102"),
			q("Grand Central's main concourse ceiling depicts…", [
				"The Hudson Valley",
				"A Mediterranean zodiac",
				"Locomotives",
				"Manhattan 1903"
			], "A Mediterranean zodiac"),
			q("New York City is made of how many boroughs?", [
				"Four",
				"Five",
				"Six",
				"Twelve"
			], "Five"),
			q("The Brooklyn Bridge opened in…", [
				"1776",
				"1883",
				"1931",
				"1964"
			], "1883"),
			q("Central Park was designed primarily by which pair?", [
				"Olmsted & Vaux",
				"Wright & Sullivan",
				"Burnham & Root",
				"Moses & Moses"
			], "Olmsted & Vaux"),
			q("One World Trade Center stands in which borough?", [
				"Brooklyn",
				"Manhattan",
				"Queens",
				"The Bronx"
			], "Manhattan")
		],
		sports: [
			q("Madison Square Garden sits above which station?", [
				"Grand Central",
				"Penn Station",
				"Union Square",
				"Fulton Street"
			], "Penn Station"),
			q("The Yankees and Mets both play in which sport?", [
				"Basketball",
				"Baseball",
				"Hockey",
				"Soccer"
			], "Baseball"),
			q("The New York Knicks play at…", [
				"Yankee Stadium",
				"Madison Square Garden",
				"Barclays Center only",
				"Citi Field"
			], "Madison Square Garden"),
			q("The Giants and Jets play their home NFL games in…", [
				"Manhattan",
				"New Jersey",
				"Queens",
				"Staten Island"
			], "New Jersey")
		],
		political: [
			q("New York City's chief executive is the…", [
				"Governor",
				"Mayor",
				"Borough president of Manhattan only",
				"Speaker of the House"
			], "Mayor"),
			q("The Governor of New York works primarily in…", [
				"City Hall",
				"Albany",
				"Buffalo",
				"The UN"
			], "Albany"),
			q("New York's City Hall looks onto…", [
				"Central Park",
				"City Hall Park",
				"Bryant Park",
				"Battery Park City's lawn only"
			], "City Hall Park"),
			q("Each NYC borough is also a…", [
				"U.S. state",
				"County (with a naming quirk for Manhattan/Queens)",
				"Federal district",
				"Parish"
			], "County (with a naming quirk for Manhattan/Queens)", 3)
		],
		food: [
			q("A New York bagel is classically…", [
				"Only baked",
				"Boiled, then baked",
				"Steamed only",
				"Fried like a doughnut"
			], "Boiled, then baked", 2),
			q("New York-style pizza is typically cut in…", [
				"Squares",
				"Wide triangles",
				"Strips",
				"No cut — sold whole only"
			], "Wide triangles", 1),
			q("Cheesecake associated with New York is usually…", [
				"Ricotta-light",
				"Dense cream cheese",
				"Goat cheese",
				"Tofu"
			], "Dense cream cheese", 2),
			q("The hot dog cart is a sidewalk fixture of…", [
				"Only Coney Island",
				"Manhattan and the boroughs",
				"Albany only",
				"Jersey City only"
			], "Manhattan and the boroughs", 1)
		],
		arts: [
			q("Broadway's theatre district clusters around…", [
				"Wall Street",
				"Times Square / 42nd Street",
				"Coney Island",
				"Harlem's river only"
			], "Times Square / 42nd Street", 1),
			q("The Met on Fifth Avenue is a…", [
				"Science lab",
				"Art museum",
				"Ballpark",
				"Courthouse"
			], "Art museum", 1),
			q("MoMA is short for the Museum of…", [
				"Medieval Armor",
				"Modern Art",
				"Maritime Affairs",
				"Municipal Archives"
			], "Modern Art", 1),
			q("The Guggenheim's spiral building was designed by…", [
				"Mies van der Rohe",
				"Frank Lloyd Wright",
				"I. M. Pei",
				"Gehry"
			], "Frank Lloyd Wright", 2)
		]
	},
	sf: {
		local: [
			q("The Golden Gate Bridge is painted which color?", [
				"Gold",
				"International Orange",
				"Navy gray",
				"Red oxide"
			], "International Orange"),
			q("Alcatraz Island sits in which body of water?", [
				"Pacific south of Pacifica",
				"San Francisco Bay",
				"Lake Merced",
				"The Sacramento River"
			], "San Francisco Bay"),
			q("San Francisco's cable cars are a…", [
				"Bus franchise",
				"Moving national historic landmark",
				"BART line",
				"Ferry"
			], "Moving national historic landmark"),
			q("The city's roughly square core is often nicknamed…", [
				"The Loop",
				"The 7x7",
				"The Gridiron",
				"The Mile"
			], "The 7x7"),
			q("Coit Tower stands on which hill?", [
				"Twin Peaks",
				"Telegraph Hill",
				"Nob Hill",
				"Bernal Heights"
			], "Telegraph Hill")
		],
		sports: [
			q("The San Francisco Giants play which sport?", [
				"Football",
				"Baseball",
				"Hockey",
				"Soccer"
			], "Baseball"),
			q("The 49ers are the region's…", [
				"NBA team",
				"NFL team",
				"MLS team",
				"NHL team"
			], "NFL team"),
			q("The Golden State Warriors play basketball in San Francisco at…", [
				"Oracle Park",
				"Chase Center",
				"Levi's Stadium",
				"Kezar"
			], "Chase Center"),
			q("Oracle Park sits along…", [
				"Ocean Beach",
				"McCovey Cove / the Bay",
				"Lake Merritt",
				"the Pacific only"
			], "McCovey Cove / the Bay")
		],
		political: [
			q("San Francisco is both a city and a…", [
				"U.S. state",
				"County",
				"Parish",
				"Borough of Oakland"
			], "County"),
			q("The city's legislative body is the…", [
				"State Assembly",
				"Board of Supervisors",
				"House of Lords",
				"Port Commission only"
			], "Board of Supervisors"),
			q("California's state capital is…", [
				"San Francisco",
				"Los Angeles",
				"Sacramento",
				"San Jose"
			], "Sacramento"),
			q("City Hall in San Francisco is known for its…", [
				"Glass pyramid",
				"Beaux-Arts dome",
				"Brutalist slab",
				"Clock tower only"
			], "Beaux-Arts dome", 2)
		],
		food: [
			q("San Francisco sourdough became famous during the…", [
				"Gold Rush",
				"1906 fire only",
				"WWII",
				"Dot-com boom"
			], "Gold Rush", 2),
			q("Cioppino is a…", [
				"Sourdough starter",
				"Seafood stew from the wharf",
				"Chocolate bar",
				"Burrito style"
			], "Seafood stew from the wharf", 2),
			q("A foil-wrapped stuffed burrito style is named for which San Francisco neighborhood?", [
				"Sea Cliff",
				"the Mission",
				"Pacific Heights",
				"the Marina only"
			], "the Mission", 1),
			q("Fortune cookies in the U.S. are most tied to which city's Chinese restaurants?", [
				"Boston",
				"San Francisco (and Los Angeles lore)",
				"Miami",
				"Atlanta"
			], "San Francisco (and Los Angeles lore)", 3)
		],
		arts: [
			q("The Fillmore is a historic…", [
				"Courthouse",
				"Music ballroom",
				"Ballpark",
				"Ferry terminal"
			], "Music ballroom", 2),
			q("SFMOMA is a museum of…", [
				"Natural history",
				"Modern art",
				"Cable cars only",
				"Ships"
			], "Modern art", 1),
			q("Coit Tower's interior is known for…", [
				"Mosaics of fish",
				"1930s murals",
				"A replica of Big Ben",
				"Dinosaur bones"
			], "1930s murals", 3),
			q("The Castro Theatre is a landmark…", [
				"Sports bar",
				"Movie palace",
				"Synagogue",
				"City hall"
			], "Movie palace", 2)
		]
	},
	london: {
		local: [
			q("What is 'Big Ben' actually the name of?", [
				"The clock face",
				"The tower",
				"The Great Bell",
				"The Houses of Parliament"
			], "The Great Bell"),
			q("Legend says the kingdom falls if which birds leave the Tower?", [
				"Pigeons",
				"Ravens",
				"Swans",
				"Falcons"
			], "Ravens"),
			q("The River Thames flows through London toward the…", [
				"Irish Sea",
				"North Sea",
				"English Channel at Dover only",
				"Atlantic at Bristol"
			], "North Sea"),
			q("The London Underground is nicknamed the…", [
				"Metro",
				"Tube",
				"El",
				"Subway only in law"
			], "Tube"),
			q("Trafalgar Square's column honors…", [
				"Wellington",
				"Nelson",
				"Churchill",
				"Victoria"
			], "Nelson")
		],
		sports: [
			q("Wembley Stadium is primarily associated with which sport?", [
				"Cricket",
				"Football (soccer)",
				"Rugby league only",
				"Formula 1"
			], "Football (soccer)"),
			q("Lord's is a famous ground for…", [
				"Football",
				"Cricket",
				"Tennis",
				"Rowing"
			], "Cricket"),
			q("The London Marathon traditionally finishes near…", [
				"Wembley",
				"The Mall / Buckingham",
				"Greenwich only",
				"Heathrow"
			], "The Mall / Buckingham"),
			q("Arsenal, Chelsea, and Tottenham are clubs in which league system?", [
				"NFL",
				"English football",
				"NBA",
				"NHL"
			], "English football")
		],
		political: [
			q("The UK Parliament sits in which palace?", [
				"Buckingham",
				"Westminster",
				"Kensington",
				"St James's only"
			], "Westminster"),
			q("The Prime Minister is…", [
				"Head of state",
				"Head of government",
				"Lord Mayor of London",
				"Speaker of the Lords only"
			], "Head of government"),
			q("The Mayor of London is…", [
				"The same office",
				"A separately elected city-region executive",
				"Appointed by the Crown only",
				"The monarch"
			], "A separately elected city-region executive"),
			q("The UK Parliament has two houses: Commons and…", [
				"Assembly",
				"Lords",
				"Senate",
				"Diet"
			], "Lords", 1)
		],
		food: [
			q("Fish and chips are classically served with…", [
				"Gravy only",
				"Mushy peas and salt/vinegar",
				"Maple syrup",
				"Ranch"
			], "Mushy peas and salt/vinegar", 1),
			q("Afternoon tea as a meal is associated with…", [
				"Scotland only",
				"Britain",
				"Ireland only",
				"Wales only"
			], "Britain", 1),
			q("A Cornish pasty is a…", [
				"Soup",
				"Filled pastry",
				"Sausage",
				"Cheese wheel"
			], "Filled pastry", 2),
			q("Chicken tikka masala is often called a national favourite in…", [
				"France",
				"Britain",
				"Spain",
				"Greece"
			], "Britain", 2)
		],
		arts: [
			q("The West End is London's…", [
				"Financial core",
				"Theatre district",
				"Ship yard",
				"Hill of palaces only"
			], "Theatre district", 1),
			q("The National Gallery sits on which square?", [
				"Piccadilly Circus",
				"Trafalgar Square",
				"Leicester Square only",
				"Soho Square"
			], "Trafalgar Square", 2),
			q("Tate Modern is housed in a former…", [
				"Palace",
				"Power station",
				"Abbey",
				"Prison"
			], "Power station", 2),
			q("Shakespeare's Globe originally stood on which river?", [
				"Seine",
				"Thames",
				"Hudson",
				"Tiber"
			], "Thames", 1)
		]
	},
	chicago: {
		local: [
			q("Cloud Gate in Millennium Park was designed by whom?", [
				"Frank Gehry",
				"Anish Kapoor",
				"Jaume Plensa",
				"Alexander Calder"
			], "Anish Kapoor"),
			q("Willis Tower was originally named…", [
				"Hancock Center",
				"Sears Tower",
				"Standard Oil Building",
				"Marina City"
			], "Sears Tower"),
			q("Chicago's elevated trains are nicknamed the…", [
				"Tube",
				"L",
				"Metro",
				"PATH"
			], "L"),
			q("The Great Chicago Fire is dated to…", [
				"1812",
				"1871",
				"1906",
				"1929"
			], "1871"),
			q("Which Great Lake does Chicago sit on?", [
				"Superior",
				"Huron",
				"Michigan",
				"Erie"
			], "Michigan")
		],
		sports: [
			q("Wrigley Field is home to which MLB team?", [
				"White Sox",
				"Cubs",
				"Brewers",
				"Cardinals"
			], "Cubs"),
			q("The Chicago Bulls play which sport?", [
				"Hockey",
				"Basketball",
				"Baseball",
				"Football"
			], "Basketball"),
			q("The Bears are Chicago's…", [
				"MLS club",
				"NFL team",
				"NHL team",
				"WNBA team"
			], "NFL team"),
			q("The Blackhawks compete in…", [
				"MLB",
				"the NHL",
				"the NBA",
				"MLS"
			], "the NHL")
		],
		political: [
			q("Chicago's city council is organized into how many wards?", [
				"12",
				"25",
				"50",
				"77"
			], "50"),
			q("The chief executive of Chicago is the…", [
				"Governor of Illinois",
				"Mayor",
				"Cook County judge",
				"Alderman-at-large"
			], "Mayor"),
			q("Illinois's state capital is…", [
				"Chicago",
				"Springfield",
				"Peoria",
				"Evanston"
			], "Springfield"),
			q("Cook County's largest city is…", [
				"Aurora",
				"Chicago",
				"Naperville",
				"Joliet"
			], "Chicago", 1)
		],
		food: [
			q("Chicago-style pizza is typically…", [
				"Thin cracker crust only",
				"Deep-dish",
				"New Haven apizza",
				"Sicilian sheet only"
			], "Deep-dish", 1),
			q("An Italian beef sandwich is a Chicago staple served…", [
				"Dry only",
				"Often dipped in jus",
				"With maple",
				"On a bagel"
			], "Often dipped in jus", 2),
			q("A Chicago hot dog is classically dressed without…", [
				"Mustard",
				"Ketchup",
				"Relish",
				"Sport peppers"
			], "Ketchup", 2),
			q("Garrett and other Chicago shops are famous for mixing…", [
				"Cheese and caramel popcorn",
				"Chili and Fritos only",
				"Ice and salt",
				"Licorice and pretzels"
			], "Cheese and caramel popcorn", 2)
		],
		arts: [
			q("The Art Institute of Chicago sits on…", [
				"Navy Pier",
				"Michigan Avenue / Grant Park",
				"Wrigleyville",
				"the Mag Mile's north end only"
			], "Michigan Avenue / Grant Park", 2),
			q("Cloud Gate (the Bean) is a sculpture in…", [
				"Lincoln Park Zoo",
				"Millennium Park",
				"Garfield Park",
				"Jackson Park only"
			], "Millennium Park", 1),
			q("Second City is a famous Chicago…", [
				"Opera",
				"Improvisational comedy theatre",
				"Symphony hall",
				"Blues label only"
			], "Improvisational comedy theatre", 2),
			q("Chicago is a historic capital of which music?", [
				"Grime",
				"Electric blues and house",
				"Fado",
				"Mariachi only"
			], "Electric blues and house", 2)
		]
	},
	detroit: {
		local: [
			q("Campus Martius sits at the downtown hub of which Detroit avenue?", [
				"Gratiot",
				"Woodward",
				"Jefferson only",
				"8 Mile"
			], "Woodward", 1),
			q("The giant bronze fist downtown commemorates which boxer?", [
				"Joe Frazier",
				"Joe Louis",
				"Sugar Ray Robinson",
				"Thomas Hearns"
			], "Joe Louis", 1),
			q("Michigan Central Station stands in which Detroit neighborhood?", [
				"Indian Village",
				"Corktown",
				"Palmer Woods",
				"Grosse Pointe"
			], "Corktown", 2),
			q("The Ambassador Bridge and a tunnel connect Detroit to which country?", [
				"Canada",
				"Mexico",
				"the UK",
				"France"
			], "Canada", 1),
			q("Hitsville U.S.A. is the house museum of…", [
				"Stax",
				"Motown",
				"Chess Records",
				"Sun Records"
			], "Motown", 1),
			q("The Guardian Building's style is often called…", [
				"Federalist",
				"Mayan Revival / Art Deco",
				"Brutalist",
				"Prairie only"
			], "Mayan Revival / Art Deco", 3)
		],
		sports: [
			q("Comerica Park is home to which MLB team?", [
				"Tigers",
				"Lions",
				"Red Wings",
				"Pistons"
			], "Tigers", 1),
			q("The Detroit Lions play football at…", [
				"The Silverdome",
				"Ford Field",
				"Michigan Stadium",
				"Crisler Center"
			], "Ford Field", 1),
			q("The Red Wings play which sport?", [
				"Basketball",
				"Hockey",
				"Baseball",
				"Soccer"
			], "Hockey", 1),
			q("The Pistons are Detroit's…", [
				"MLB club",
				"NBA team",
				"MLS team",
				"WNBA only"
			], "NBA team", 1),
			q("Little Caesars Arena replaced which famous hockey barn?", [
				"Joe Louis Arena",
				"Olympia only still in use",
				"Maple Leaf Gardens",
				"Chicago Stadium"
			], "Joe Louis Arena", 2)
		],
		political: [
			q("Detroit is in which Michigan county?", [
				"Oakland",
				"Wayne",
				"Macomb",
				"Washtenaw"
			], "Wayne", 2),
			q("Michigan's state capital is…", [
				"Detroit",
				"Lansing",
				"Ann Arbor",
				"Grand Rapids"
			], "Lansing", 1),
			q("Detroit's chief executive is the…", [
				"Governor",
				"Mayor",
				"County executive only",
				"Speaker"
			], "Mayor", 1),
			q("Michigan has how many U.S. senators?", [
				"One",
				"Two",
				"Fourteen",
				"Sixteen"
			], "Two", 1)
		],
		food: [
			q("A Detroit Coney dog is typically dressed with…", [
				"Ketchup only",
				"Chili, mustard, and onions",
				"Celery salt and a pickle",
				"Nacho cheese"
			], "Chili, mustard, and onions", 1),
			q("Detroit-style pizza is known for…", [
				"A thin cracker crust",
				"A square pan, caramelized cheese edges",
				"Deep-dish pie tin",
				"A bagel crust"
			], "A square pan, caramelized cheese edges", 2),
			q("Vernors is a ginger ale born in…", [
				"Cleveland",
				"Detroit",
				"Cincinnati",
				"Milwaukee"
			], "Detroit", 2),
			q("Better Made is a Detroit brand of…", [
				"Cars",
				"Potato chips",
				"Paint",
				"Jazz records"
			], "Potato chips", 2)
		],
		arts: [
			q("Diego Rivera's Detroit Industry murals are in which museum?", [
				"MoMA",
				"the Detroit Institute of Arts",
				"the Louvre",
				"the Art Institute of Chicago"
			], "the Detroit Institute of Arts", 2),
			q("Motown Records was founded by…", [
				"Berry Gordy",
				"Ahmet Ertegun",
				"Phil Spector",
				"Quincy Jones only"
			], "Berry Gordy", 2),
			q("Detroit is widely cited as a birthplace of which electronic music?", [
				"Grime",
				"Techno",
				"Reggaeton",
				"Disco only"
			], "Techno", 2),
			q("The Fox Theatre in Detroit opened as a…", [
				"Courthouse",
				"1920s movie palace",
				"Auto plant",
				"Ballpark"
			], "1920s movie palace", 2)
		]
	},
	tucson: {
		local: [
			q("Tucson's O'odham name Cuk Ṣon refers to…", ["A river fork", "Black base, at the foot of a hill", "White house", "Dry lake"], "Black base, at the foot of a hill", 2),
			q("Sentinel Peak is better known in town as…", ["A Mountain", "B Mountain", "Picacho", "Tumamoc only"], "A Mountain", 1),
			q("Hotel Congress is tied to the 1934 capture of…", ["Billy the Kid", "John Dillinger", "Pretty Boy Floyd", "Machine Gun Kelly"], "John Dillinger", 2),
			q("The University of Arizona's oldest building still in use as a symbol is…", ["Old Main", "Bear Down Gym only", "McKale", "Gammage"], "Old Main", 1),
			q("San Xavier del Bac is a mission south of Tucson called the…", ["White Dove of the Desert", "Red Wall", "Desert Cross", "Saguaro Chapel"], "White Dove of the Desert", 2),
			q("El Presidio was Tucson's…", ["Railroad depot", "Spanish fortified settlement", "Copper mine", "Airfield"], "Spanish fortified settlement", 2),
			q("Fourth Avenue in Tucson is known for…", ["The airport","Independent shops, streetcar, and a mile of local storefronts","The copper smelter","The capitol"], "Independent shops, streetcar, and a mile of local storefronts", 1),
			q("Barrio Viejo is…", ["A north-side mall","Adobe neighborhoods south of downtown","The UA stadium","A mine camp"], "Adobe neighborhoods south of downtown", 2)
		],
		sports: [
			q("Arizona Stadium in Tucson is home to which football team?", ["Arizona State", "Arizona Wildcats", "Phoenix Cardinals", "Northern Arizona"], "Arizona Wildcats", 1),
			q("The Arizona Wildcats' basketball arena is…", ["Footprint Center", "McKale Center", "Desert Diamond Arena", "Gammage"], "McKale Center", 1),
			q("The Arizona Wildcats' slogan, painted on campus, is…", ["Bear Down", "Forks Up", "Fear the Tree", "Go Devils"], "Bear Down", 1),
			q("The Tucson Roadrunners play which sport?", ["Soccer", "Hockey", "Baseball", "Football"], "Hockey", 2)
		],
		political: [
			q("Tucson is the seat of which Arizona county?", ["Maricopa", "Pima", "Pinal", "Santa Cruz"], "Pima", 1),
			q("Arizona's state capital is…", ["Tucson", "Phoenix", "Flagstaff", "Yuma"], "Phoenix", 1),
			q("Tucson's chief executive is the…", ["Governor", "Mayor", "County supervisor only", "Tribal chair"], "Mayor", 1),
			q("Arizona has how many U.S. senators?", ["One", "Two", "Nine", "Fifteen"], "Two", 1)
		],
		food: [
			q("A Sonoran hot dog is typically…", ["Plain with mustard only", "Bacon-wrapped, with beans, onion, and salsa", "Chicago-style with celery salt", "Smothered in chili and cheddar only"], "Bacon-wrapped, with beans, onion, and salsa", 1),
			q("El Charro Café in Tucson claims a long run as a…", ["Steakhouse", "Mexican restaurant", "Pizzeria", "Brewery"], "Mexican restaurant", 2),
			q("Prickly pear in Tucson cooking usually means a…", ["Pine nut", "Cactus fruit", "Chile variety", "Date"], "Cactus fruit", 1),
			q("A Tucson cheese crisp is basically a…", ["Fried dough round", "Open-faced toasted tortilla with melted cheese", "Chimichanga", "Corn cake"], "Open-faced toasted tortilla with melted cheese", 2)
		],
		arts: [
			q("The Tucson Gem and Mineral Show is a winter event famous for…", ["Rodeo stock", "Rocks, gems, and dealers from around the world", "Film premieres", "Hot-air balloons only"], "Rocks, gems, and dealers from around the world", 2),
			q("The Fox Tucson Theatre opened as a…", ["Courthouse", "1920s movie palace", "Mission chapel", "Train depot"], "1920s movie palace", 2),
			q("Mariachi music is a living tradition in which Arizona city?", ["Flagstaff", "Tucson", "Page", "Show Low"], "Tucson", 2),
			q("The Rialto Theatre sits on which downtown Tucson street?", ["Speedway", "Congress", "Broadway only west of I-10", "Oracle"], "Congress", 2)
		]
	},
	toronto: {
		local: [
			q("The CN Tower opened in…", ["1967", "1976", "1989", "1999"], "1976", 1),
			q("Toronto sits on which Great Lake?", ["Superior", "Michigan", "Huron", "Ontario"], "Ontario", 1),
			q("Nathan Phillips Square sits in front of…", ["Union Station", "Toronto City Hall", "Casa Loma", "the ROM"], "Toronto City Hall", 1),
			q("The PATH in downtown Toronto is a…", ["highway to Hamilton", "network of underground walkways", "ferry route", "subway only"], "network of underground walkways", 2),
			q("Casa Loma was built as a house for…", ["the lieutenant governor", "Sir Henry Pellatt", "the Eaton family only", "a railroad hotel"], "Sir Henry Pellatt", 2),
			q("The Distillery District was once…", ["a military fort", "the Gooderham & Worts distillery", "a subway yard", "a grain elevator only"], "the Gooderham & Worts distillery", 2),
			q("Yonge-Dundas Square is Toronto's…", ["city hall lawn", "bright downtown crossing with screens", "island ferry dock", "university quad"], "bright downtown crossing with screens", 1),
			q("Kensington Market is known for…", ["the airport", "independent shops in a tight west-of-Spadina grid", "the legislature", "a ski hill"], "independent shops in a tight west-of-Spadina grid", 1),
			q("The TTC is Toronto's…", ["hockey league", "transit agency", "city council", "university"], "transit agency", 1),
			q("Downtown Toronto still runs…", ["cable cars on hills only", "streetcars in mixed traffic", "monorails on Yonge", "a funicular to Casa Loma"], "streetcars in mixed traffic", 1),
			q("The Toronto Islands are reached from the city by…", ["a tunnel under the lake", "ferry", "the 401", "streetcar only"], "ferry", 1),
			q("The Gardiner Expressway runs along Toronto's…", ["northern farmland", "waterfront", "Scarborough Bluffs only", "Ottawa River"], "waterfront", 1),
			q("The Eaton Centre is a downtown…", ["hockey rink", "shopping mall on Yonge", "city hall", "island ferry dock"], "shopping mall on Yonge", 1),
			q("Toronto's Old City Hall is known for a…", ["glass pyramid", "clock tower on Queen Street", "retractable roof", "gold dome copied from Boston"], "clock tower on Queen Street", 2),
			q("The new Toronto City Hall's curved towers were designed by…", ["Frank Gehry", "Viljo Revell", "Daniel Libeskind", "I. M. Pei"], "Viljo Revell", 2),
			q("Bloor-Yonge is a major Toronto…", ["airport", "subway transfer", "island", "legislature"], "subway transfer", 1),
			q("The Don River in Toronto flows toward…", ["Hudson Bay", "the harbour / Lake Ontario", "the Pacific", "Niagara Falls only"], "the harbour / Lake Ontario", 2),
			q("High Park is a large park on Toronto's…", ["eastern bluffs only", "west side", "island airport runway", "Queen's Park lawn"], "west side", 1),
			q("The Royal Ontario Museum sits on which street?", ["Queen", "Bloor", "King only", "Spadina's south end"], "Bloor", 1),
			q("The Art Gallery of Ontario faces…", ["Bloor", "Dundas", "the Gardiner", "Yonge-Dundas Square only"], "Dundas", 2),
			q("The Hockey Hall of Fame in Toronto displays…", ["the Vince Lombardi Trophy", "the Stanley Cup", "the Claret Jug", "the America's Cup only"], "the Stanley Cup", 1),
			q("Fort York in Toronto dates to fighting in…", ["the American Civil War", "the War of 1812", "World War I", "the Fenian"], "the War of 1812", 2),
			q("Union Station is Toronto's main…", ["subway-only stop", "intercity rail hall", "ferry terminal", "streetcar barn"], "intercity rail hall", 1),
			q("Billy Bishop Airport sits on…", ["the mainland at Pearson", "the Toronto Islands", "Hamilton harbour only", "Lake Simcoe"], "the Toronto Islands", 2),
			q("Toronto Pearson is the region's…", ["island STOL strip only", "main international airport", "union bus garage", "seaplane base downtown"], "main international airport", 1),
			q("\"The 6ix\" is a nickname for…", ["Hamilton", "Toronto", "Ottawa", "Mississauga only"], "Toronto", 1),
			q("First Canadian Place is a downtown Toronto…", ["ballpark", "bank tower", "university college", "market hall"], "bank tower", 2),
			q("The Scarborough Bluffs are…", ["a mountain range", "lakeside cliffs on Lake Ontario", "a PATH concourse", "a subway yard"], "lakeside cliffs on Lake Ontario", 2)
		],
		sports: [
			q("The Toronto Maple Leafs play which sport?", ["Soccer", "Hockey", "Basketball", "Lacrosse only"], "Hockey", 1),
			q("The Toronto Raptors play at…", ["Rogers Centre", "Scotiabank Arena", "BMO Field", "the Gardens still"], "Scotiabank Arena", 1),
			q("The Blue Jays' downtown ballpark is…", ["Olympic Stadium", "Rogers Centre", "Sahlen Field", "Fenway"], "Rogers Centre", 1),
			q("The Raptors won the NBA title in…", ["1995", "2004", "2019", "2023"], "2019", 2)
		],
		political: [
			q("Toronto is the capital of which province?", ["Quebec", "Ontario", "Manitoba", "Alberta"], "Ontario", 1),
			q("Canada's national capital is…", ["Toronto", "Ottawa", "Montreal", "Vancouver"], "Ottawa", 1),
			q("Toronto's chief executive is the…", ["premier only", "mayor", "governor", "lieutenant-governor"], "mayor", 1),
			q("Ontario's legislature sits at…", ["Parliament Hill", "Queen's Park", "Nathan Phillips Square", "Rideau Hall"], "Queen's Park", 2)
		],
		food: [
			q("A peameal bacon sandwich is a Toronto classic associated with…", ["St. Lawrence Market", "the CN Tower restaurant only", "a poutine stand in Quebec City", "Tim Hortons' first store"], "St. Lawrence Market", 2),
			q("A butter tart is a…", ["savory meat pie", "small pastry with a buttery filling", "fried dough ring", "smoked fish"], "small pastry with a buttery filling", 1),
			q("Ketchup chips are a snack more common in…", ["Mexico", "Canada", "Japan only", "Brazil"], "Canada", 1),
			q("A smoked meat sandwich in this part of the country is more Montreal; Toronto's market classic is often…", ["a lobster roll", "peameal bacon on a bun", "a Philly cheesesteak", "a chimichanga"], "peameal bacon on a bun", 2)
		],
		arts: [
			q("TIFF is a Toronto…", ["hockey tournament", "international film festival", "food fair only", "boat race"], "international film festival", 1),
			q("The ROM's crystal addition was designed by…", ["Frank Gehry", "Daniel Libeskind", "Moshe Safdie", "Bjarke Ingels"], "Daniel Libeskind", 2),
			q("The Art Gallery of Ontario's big renovation is associated with…", ["Frank Gehry", "I. M. Pei", "Zaha Hadid", "Renzo Piano"], "Frank Gehry", 2),
			q("Massey Hall is a historic Toronto…", ["courthouse", "concert hall", "hockey rink", "market"], "concert hall", 1)
		]
	},
	la: {
		local: [
			q("Los Angeles City Hall opened in…", ["1901", "1928", "1955", "1971"], "1928", 1),
			q("Walt Disney Concert Hall sits on which downtown street?", ["Sunset", "Grand Avenue", "Venice Boulevard", "Mulholland"], "Grand Avenue", 1),
			q("Olvera Street is part of…", ["the Getty Center", "El Pueblo, the city's historic plaza", "Venice Boardwalk", "UCLA"], "El Pueblo, the city's historic plaza", 2),
			q("Angels Flight is a…", ["helicopter tour", "short funicular on Bunker Hill", "freeway interchange", "ferry"], "short funicular on Bunker Hill", 1),
			q("The Hollywood Sign originally read…", ["HOLLYWOODLAND", "CALIFORNIA", "TCL", "MGM"], "HOLLYWOODLAND", 2),
			q("Griffith Observatory looks out over…", ["the Salton Sea", "the Los Angeles basin", "Lake Tahoe", "Death Valley"], "the Los Angeles basin", 1),
			q("Union Station in Los Angeles opened in…", ["1913", "1939", "1964", "1984"], "1939", 2),
			q("The Bradbury Building is famous for its…", ["glass pyramid", "skylit Victorian court of iron and brick", "steel concert sails", "observatory dome"], "skylit Victorian court of iron and brick", 2),
			q("El Pueblo is Los Angeles's…", ["airport code", "historic founding plaza", "NBA arena", "oil field"], "historic founding plaza", 1),
			q("The Hollywood Sign stands on…", ["Mount Lee", "A Mountain", "Mount Wilson's observatory dome only", "Catalina Island"], "Mount Lee", 2),
			q("Griffith Park is one of L.A.'s…", ["smallest traffic islands", "largest municipal parks", "private studios", "ports"], "largest municipal parks", 1),
			q("The Miracle Mile is a stretch of…", ["Sunset at the beach only", "Wilshire Boulevard", "the 405 carpool lane", "Mulholland"], "Wilshire Boulevard", 2),
			q("Crypto.com Arena was long known as…", ["the Forum only", "Staples Center", "Dodger Stadium", "Pauley Pavilion"], "Staples Center", 1),
			q("Much of the Los Angeles River through the city is a…", ["wild mountain gorge only", "concrete channel", "subway tunnel", "tide pool"], "concrete channel", 1),
			q("Sunset Boulevard is a famous L.A.…", ["north-south freeway", "east-west street", "harbor channel", "subway color"], "east-west street", 1),
			q("Koreatown is a dense neighborhood of…", ["Santa Barbara", "central Los Angeles", "Palm Springs", "Catalina"], "central Los Angeles", 1),
			q("Little Tokyo sits…", ["west of Santa Monica Pier", "east of downtown L.A.", "in Anaheim", "in Burbank's airport"], "east of downtown L.A.", 1),
			q("Bunker Hill downtown was…", ["a port island", "a ridge regraded for towers", "an oil derrick field", "a racetrack"], "a ridge regraded for towers", 2),
			q("The 101 freeway…", ["never enters L.A.", "cuts through downtown Los Angeles", "is only in San Francisco", "is a subway"], "cuts through downtown Los Angeles", 1),
			q("Exposition Park holds the Coliseum and…", ["City Hall", "museums and a rose garden", "LAX terminals", "the Hollywood Sign"], "museums and a rose garden", 1),
			q("The Hollywood Bowl sits in…", ["Chavez Ravine", "the Cahuenga Pass", "Long Beach harbor", "the Arts District"], "the Cahuenga Pass", 2),
			q("The Capitol Records building is meant to look like…", ["a stack of records", "a sail", "City Hall", "a street lamp"], "a stack of records", 1),
			q("L.A. City Hall's 1928 tower long acted as a…", ["port lighthouse", "city height limit", "oil derrick", "subway vent"], "city height limit", 2),
			q("Grand Central Market downtown opened in…", ["1826", "1917", "1964", "2003"], "1917", 2),
			q("The Farmers Market at Third and Fairfax dates to…", ["1884", "1934", "1968", "1994"], "1934", 2),
			q("Dodger Stadium sits in…", ["Inglewood", "Chavez Ravine", "Pasadena's arroyo only", "Long Beach"], "Chavez Ravine", 1),
			q("The Arts District is generally…", ["west of the 405 at the beach", "east of Alameda downtown", "on Catalina", "in the Palisades only"], "east of Alameda downtown", 2),
			q("The Bradbury Building downtown dates to…", ["1798", "1893", "1928", "2003"], "1893", 2)
		],
		sports: [
			q("The Los Angeles Lakers play basketball at…", ["Dodger Stadium", "Crypto.com Arena", "the Coliseum only", "SoFi Stadium"], "Crypto.com Arena", 1),
			q("Dodger Stadium sits in…", ["Pasadena", "Chavez Ravine", "Inglewood", "Long Beach"], "Chavez Ravine", 1),
			q("The Dodgers moved from Brooklyn to Los Angeles in…", ["1947", "1958", "1962", "1978"], "1958", 1),
			q("The Los Angeles Memorial Coliseum has hosted the Olympics how many times so far (through 2028's count of three)?", ["never", "once", "twice already, with a third scheduled", "five times"], "twice already, with a third scheduled", 2)
		],
		political: [
			q("California's state capital is…", ["Los Angeles", "San Francisco", "Sacramento", "San Diego"], "Sacramento", 1),
			q("Downtown L.A. is the seat of…", ["Orange County", "Los Angeles County", "Ventura County", "San Bernardino County"], "Los Angeles County", 1),
			q("The city's chief executive is the…", ["governor", "mayor", "county sheriff", "speaker"], "mayor", 1),
			q("California has two U.S. senators. The state's Pacific border is with the…", ["Gulf of Mexico", "Pacific Ocean", "Atlantic", "Great Lakes"], "Pacific Ocean", 1)
		],
		food: [
			q("A French dip sandwich is claimed (with a fight) by which L.A. counter?", ["In-N-Out", "Philippe the Original", "Pink's", "Canter's only"], "Philippe the Original", 2),
			q("Korean barbecue is a living strip in L.A. along…", ["Western in Koreatown, among other streets", "only the Santa Monica Pier", "Mulholland", "the Hollywood Sign"], "Western in Koreatown, among other streets", 2),
			q("A California burrito typically includes…", ["lobster only", "french fries inside the burrito", "peameal bacon", "deep-dish cheese"], "french fries inside the burrito", 2),
			q("Grand Central Market downtown is a…", ["stock exchange", "food hall of counters under Broadway", "fish pier only", "winery"], "food hall of counters under Broadway", 1)
		],
		arts: [
			q("Walt Disney Concert Hall was designed by…", ["Frank Lloyd Wright", "Frank Gehry", "Thom Mayne", "Richard Meier"], "Frank Gehry", 1),
			q("LACMA's Urban Light is a grid of…", ["neon tubes", "restored street lamps", "oil derricks", "palm trunks"], "restored street lamps", 1),
			q("The TCL Chinese Theatre is known for…", ["a glass pyramid", "celebrity handprints in its forecourt", "a funicular", "an observatory"], "celebrity handprints in its forecourt", 1),
			q("The Broad museum sits next to…", ["Dodger Stadium", "Walt Disney Concert Hall", "LAX", "the Getty Villa"], "Walt Disney Concert Hall", 2)
		]
	},
	boston: {
		local: [
			q("Boston Common dates to…", ["1492", "1634", "1776", "1893"], "1634", 1),
			q("Boston Common is considered the oldest…", ["university in America", "public park in the United States", "subway in the world", "ballpark still in use"], "public park in the United States", 1),
			q("The Freedom Trail is a roughly…", ["half-mile alley", "2.5-mile path marked in red brick", "cross-state highway", "harbor ferry"], "2.5-mile path marked in red brick", 1),
			q("The Massachusetts State House sits on…", ["Bunker Hill", "Beacon Hill", "Copp's Hill only", "Breed's Hill"], "Beacon Hill", 1),
			q("The State House's dome is famous for being…", ["glass", "gilded", "thatched", "iron only"], "gilded", 1),
			q("Charles Bulfinch designed Boston's…", ["Fenway Park", "Massachusetts State House", "TD Garden", "the Big Dig"], "Massachusetts State House", 1),
			q("Paul Revere's company sheathed the State House dome in…", ["gold first", "copper", "slate", "tin"], "copper", 2),
			q("Two lanterns in Old North Church meant the British were coming…", ["by land", "by sea", "from Canada", "at noon"], "by sea", 1),
			q("One lantern in Old North Church meant the British were coming…", ["by sea", "by land", "by river only", "not at all"], "by land", 1),
			q("USS Constitution is nicknamed…", ["Old Glory", "Old Ironsides", "Old North", "the Hub"], "Old Ironsides", 1),
			q("USS Constitution is berthed at…", ["Long Wharf only", "Charlestown Navy Yard", "the Esplanade", "South Station"], "Charlestown Navy Yard", 1),
			q("Faneuil Hall is nicknamed the…", ["Cradle of Liberty", "Hub of the Universe only", "Athens of America only", "Old Ironsides"], "Cradle of Liberty", 1),
			q("The Boston Tea Party took place in…", ["1765", "1773", "1775", "1789"], "1773", 1),
			q("The Battle of Bunker Hill was fought mostly on…", ["Beacon Hill", "Breed's Hill", "the Common", "Bunker Hill's exact peak only"], "Breed's Hill", 2),
			q("Fenway Park opened in…", ["1894", "1912", "1934", "1967"], "1912", 1),
			q("The Green Monster is Fenway's…", ["bullpen cart", "left-field wall", "right-field pole", "press box"], "left-field wall", 1),
			q("The Public Garden is known for…", ["a funicular", "swan boats on a lagoon", "the Green Monster", "Old Ironsides"], "swan boats on a lagoon", 1),
			q("Boston's North End is long known as an…", ["Irish-only dock", "Italian neighborhood", "financial district", "back-bay landfill"], "Italian neighborhood", 1),
			q("Beacon Hill is known for…", ["steel concert halls", "brick federal houses and cobbles", "oil derricks", "a concrete river"], "brick federal houses and cobbles", 1),
			q("Boston's subway and buses are run by the…", ["MTA of New York", "MBTA, called the T", "TTC", "BART"], "MBTA, called the T", 1),
			q("The Charles River separates Boston from…", ["Quincy only", "Cambridge", "Salem", "the Harbor Islands only"], "Cambridge", 1),
			q("Harvard University sits in…", ["downtown Boston", "Cambridge", "Worcester", "Salem"], "Cambridge", 1),
			q("Back Bay is largely…", ["a glacial drumlin only", "nineteenth-century filled land", "a volcanic cone", "an island ferry dock"], "nineteenth-century filled land", 2),
			q("The Boston Massacre took place near the…", ["Fenway bleachers", "Old State House", "MIT dome", "Hatch Shell"], "Old State House", 1),
			q("Granary Burying Ground holds the graves of…", ["only British governors", "Paul Revere, John Hancock, and Samuel Adams among others", "only Red Sox owners", "only Harvard presidents"], "Paul Revere, John Hancock, and Samuel Adams among others", 2),
			q("The Big Dig was a project that…", ["dug the subway's first tunnel in 1897", "put the central artery underground", "filled Back Bay", "moved Fenway"], "put the central artery underground", 2),
			q("The Boston Marathon finishes on…", ["Commonwealth Avenue only", "Boylston Street", "the Esplanade track", "Storrow Drive"], "Boylston Street", 1),
			q("Copley Square is framed by Trinity Church and the…", ["State House", "Boston Public Library", "USS Constitution", "Faneuil Hall"], "Boston Public Library", 1)
		],
		sports: [
			q("The Boston Celtics play basketball at…", ["Fenway Park", "TD Garden", "Harvard Stadium", "Gillette Stadium"], "TD Garden", 1),
			q("The Boston Bruins play which sport?", ["Soccer", "Hockey", "Baseball", "Lacrosse only"], "Hockey", 1),
			q("The Red Sox play at…", ["TD Garden", "Fenway Park", "Gillette Stadium", "the Garden's parquet"], "Fenway Park", 1),
			q("The New England Patriots play in…", ["downtown Boston", "Foxborough", "Cambridge", "Quincy"], "Foxborough", 1),
			q("The Boston Marathon is the world's oldest…", ["indoor mile", "annual marathon", "street hockey game", "row on the Charles"], "annual marathon", 2)
		],
		political: [
			q("Boston is the capital of…", ["Rhode Island", "Massachusetts", "New Hampshire", "Connecticut"], "Massachusetts", 1),
			q("Massachusetts' legislature is called the…", ["General Assembly only", "General Court", "Diet", "Congress of Boston"], "General Court", 2),
			q("Boston's chief executive is the…", ["governor", "mayor", "speaker of the House", "sheriff only"], "mayor", 1),
			q("Massachusetts is officially a…", ["territory", "commonwealth", "federal district", "province"], "commonwealth", 1)
		],
		food: [
			q("New England clam chowder is typically…", ["tomato-red like Manhattan", "cream-based", "clear broth only", "served as a taco"], "cream-based", 1),
			q("Boston cream pie is…", ["a deep-dish pizza", "the official dessert of Massachusetts", "a North End cannoli", "a clam cake"], "the official dessert of Massachusetts", 2),
			q("The North End is famous for…", ["Texas brisket", "Italian pastry, including cannoli", "In-N-Out", "poutine"], "Italian pastry, including cannoli", 1),
			q("A lobster roll is a New England sandwich of…", ["fried dough and syrup", "lobster meat on a bun", "peameal bacon", "Italian beef"], "lobster meat on a bun", 1),
			q("Parker House rolls were created at a…", ["Fenway concession", "Boston hotel kitchen", "Cambridge lab", "Quincy shipyard"], "Boston hotel kitchen", 2),
			q("A roast beef sandwich on the North Shore is a…", ["Texas specialty only", "local Greater Boston classic", "Montreal smoked meat", "Philly cheesesteak under another name"], "local Greater Boston classic", 2)
		],
		arts: [
			q("Boston's Museum of Fine Arts sits on…", ["Beacon Hill", "Huntington Avenue", "the Common", "Long Wharf"], "Huntington Avenue", 1),
			q("The Isabella Stewart Gardner Museum is known for a 1990…", ["roof collapse", "art theft whose empty frames still hang", "subway fire", "marathon bombing"], "art theft whose empty frames still hang", 2),
			q("Symphony Hall is home to the…", ["Boston Symphony Orchestra", "Boston Pops", "Boston Ballet's only stage", "the Bruins' practice rink"], "Boston Symphony Orchestra", 1),
			q("Trinity Church on Copley Square is a masterpiece of…", ["Frank Gehry", "H. H. Richardson", "I. M. Pei", "Charles Bulfinch only"], "H. H. Richardson", 2),
			q("The Hatch Shell on the Esplanade is known for…", ["the Green Monster", "July 4 Boston Pops concerts", "the Tea Party ships", "subway music only"], "July 4 Boston Pops concerts", 1)
		]
	},
	nola: {
		local: [
			q("New Orleans was founded in…", ["1607", "1718", "1803", "1865"], "1718", 1),
			q("Jean-Baptiste Le Moyne de Bienville is credited with founding…", ["Baton Rouge", "New Orleans", "Mobile only", "Natchez only"], "New Orleans", 1),
			q("The French Quarter is also called the…", ["Garden District", "Vieux Carré", "Warehouse District", "Bywater only"], "Vieux Carré", 1),
			q("New Orleans is nicknamed the Crescent City because of…", ["a moon festival", "the bend of the Mississippi", "a cathedral spire", "Lake Pontchartrain's shape only"], "the bend of the Mississippi", 1),
			q("Another common nickname for New Orleans is the…", ["Windy City", "Big Easy", "Hub of the Universe", "Emerald City"], "Big Easy", 1),
			q("Jackson Square was originally called…", ["Congo Square", "Place d'Armes", "Lafayette Square", "Lee Circle"], "Place d'Armes", 2),
			q("The Battle of New Orleans was fought in…", ["1776", "1815", "1862", "1918"], "1815", 1),
			q("The Cabildo is where the U.S. took possession of…", ["Alaska", "Louisiana after the Purchase", "Hawaii", "Puerto Rico"], "Louisiana after the Purchase", 1),
			q("The St. Charles line is famous as the world's oldest continuously operating…", ["ferry", "streetcar line", "subway", "airport shuttle"], "streetcar line", 1),
			q("St. Charles streetcars first ran in…", ["1718", "1835", "1900", "1984"], "1835", 2),
			q("New Orleans cemeteries often use above-ground tombs because of the…", ["mountain rock", "high water table", "desert sand", "permafrost"], "high water table", 1),
			q("In New Orleans, the grassy median of a boulevard is called the…", ["esplanade only", "neutral ground", "common", "plaza mayor"], "neutral ground", 2),
			q("Tremé is often cited as one of the oldest…", ["Chinatowns in America", "African-American neighborhoods in the U.S.", "financial districts", "ski towns"], "African-American neighborhoods in the U.S.", 2),
			q("Congo Square is remembered as a place where…", ["the Super Bowl is played", "enslaved people gathered and made music on Sundays", "the Cabildo signed a treaty", "streetcars are stored"], "enslaved people gathered and made music on Sundays", 2),
			q("Hurricane Katrina struck the Gulf Coast in…", ["1992", "2005", "2012", "2020"], "2005", 1),
			q("The Mississippi River at New Orleans flows generally…", ["north to the Great Lakes", "south toward the Gulf of Mexico", "west to Texas only", "into Lake Superior"], "south toward the Gulf of Mexico", 1),
			q("Algiers Point sits…", ["in Baton Rouge", "across the Mississippi from the French Quarter", "on Lake Pontchartrain's north shore only", "in Mississippi state"], "across the Mississippi from the French Quarter", 2),
			q("The Garden District is known for…", ["skyscrapers", "historic mansions and live oaks", "oil derricks", "the Superdome floor"], "historic mansions and live oaks", 1),
			q("A Streetcar Named Desire took its title from a real…", ["ferry", "New Orleans streetcar line", "jazz club", "cemetery"], "New Orleans streetcar line", 2),
			q("Lake Pontchartrain lies generally…", ["south of the Gulf", "north of New Orleans", "in Arkansas", "west of Houston"], "north of New Orleans", 1),
			q("The National WWII Museum is in…", ["Baton Rouge", "New Orleans", "Shreveport", "Lafayette"], "New Orleans", 1),
			q("Marie Laveau is a historic figure associated with New Orleans…", ["baseball", "Voodoo and the cemeteries", "the Saints' front office", "streetcar engineering"], "Voodoo and the cemeteries", 2)
		],
		sports: [
			q("The New Orleans Saints play which sport?", ["Basketball", "Football", "Hockey", "Soccer only"], "Football", 1),
			q("The Saints' home field is the…", ["Tiger Stadium", "Caesars Superdome", "Fenway Park", "Smoothie King Center only"], "Caesars Superdome", 1),
			q("The New Orleans Pelicans play…", ["football", "NBA basketball", "baseball", "hockey"], "NBA basketball", 1),
			q("The Saints won Super Bowl XLIV after the…", ["1984 World's Fair", "2005 storm years, in the 2009 season", "Louisiana Purchase", "first Mardi Gras"], "2005 storm years, in the 2009 season", 2)
		],
		political: [
			q("New Orleans is in which U.S. state?", ["Mississippi", "Louisiana", "Alabama", "Texas"], "Louisiana", 1),
			q("Louisiana's capital is…", ["New Orleans", "Baton Rouge", "Lafayette", "Shreveport"], "Baton Rouge", 1),
			q("Louisiana uses which local term instead of counties?", ["boroughs", "parishes", "cantons", "hundreds"], "parishes", 1),
			q("New Orleans sits in…", ["East Baton Rouge Parish", "Orleans Parish", "Jefferson Parish only", "St. Bernard as its only parish"], "Orleans Parish", 1)
		],
		food: [
			q("Café du Monde is famous for…", ["deep-dish pizza", "beignets and café au lait", "lobster rolls", "In-N-Out"], "beignets and café au lait", 1),
			q("A po-boy is a New Orleans…", ["cocktail", "sandwich, often on French bread", "beignet topping", "streetcar fare"], "sandwich, often on French bread", 1),
			q("Red beans and rice is a New Orleans tradition especially on…", ["Friday", "Monday", "Sunday only at brunch", "Mardi Gras morning only"], "Monday", 2),
			q("The muffuletta is a sandwich associated with…", ["Central Grocery in the French Quarter", "Café du Monde only", "the Superdome concession", "Baton Rouge cafeterias only"], "Central Grocery in the French Quarter", 2),
			q("Gumbo is a stew closely tied to…", ["New England", "Louisiana cooking", "the Pacific Northwest", "the desert Southwest"], "Louisiana cooking", 1),
			q("The Sazerac is widely treated as New Orleans's…", ["official sandwich", "signature cocktail", "streetcar", "football play"], "signature cocktail", 1)
		],
		arts: [
			q("New Orleans is widely called a birthplace of…", ["grunge", "jazz", "bluegrass only", "disco"], "jazz", 1),
			q("Louis Armstrong was born in…", ["Chicago", "New Orleans", "Memphis", "Kansas City"], "New Orleans", 1),
			q("Preservation Hall exists to present…", ["opera in Latin", "traditional New Orleans jazz", "Broadway tours only", "silent films"], "traditional New Orleans jazz", 1),
			q("A second line in New Orleans is a…", ["subway car", "parading, dancing crowd behind a brass band", "double espresso", "cemetery wall"], "parading, dancing crowd behind a brass band", 2),
			q("Mardi Gras in New Orleans is famous for…", ["a ski jump", "krewes, floats, and parades", "a marathon finish only", "ice palaces"], "krewes, floats, and parades", 1)
		]
	}
};
stampCityRecord(CITY);
const REGION: Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>> = {
	austin: {
		local: TEXAS_LOCAL,
		sports: TEXAS_SPORTS,
		political: TEXAS_POLITICAL,
		food: TEXAS_FOOD,
		arts: TEXAS_ARTS
	},
	temple: {
		local: TEXAS_LOCAL,
		sports: TEXAS_SPORTS,
		political: TEXAS_POLITICAL,
		food: TEXAS_FOOD,
		arts: TEXAS_ARTS
	},
	nyc: {
		local: [
			q("The Hudson River separates Manhattan from…", [
				"Brooklyn",
				"New Jersey (and a bit of Yonkers lore)",
				"Queens only",
				"Staten Island only"
			], "New Jersey (and a bit of Yonkers lore)", 2),
			q("Long Island Sound lies generally…", [
				"South of Staten Island",
				"between Connecticut and the North Shore",
				"In New Jersey",
				"West of the Hudson"
			], "between Connecticut and the North Shore", 2),
			q("What is the capital of New York State?", [
				"New York City",
				"Albany",
				"Buffalo",
				"Syracuse"
			], "Albany", 1),
			q("Niagara Falls sits on the border of New York and…", [
				"Pennsylvania",
				"Canada (Ontario)",
				"Vermont",
				"Ohio"
			], "Canada (Ontario)", 1),
			q("The Erie Canal historically linked the Hudson to…", [
				"the Mississippi",
				"the Great Lakes",
				"the Ohio River only",
				"Chesapeake Bay"
			], "the Great Lakes", 2),
			q("The Adirondacks are a mountain region in…", [
				"southern New Jersey",
				"upstate New York",
				"Long Island",
				"Delaware"
			], "upstate New York", 2),
			q("Long Island lies to New York City's…", [
				"due north",
				"east",
				"far west past Newark only",
				"due south in the Atlantic trenches"
			], "east", 1),
			q("Buffalo sits at the eastern end of which Great Lake?", [
				"Michigan",
				"Erie",
				"Superior",
				"Huron"
			], "Erie", 2),
			q("The Finger Lakes are in which U.S. state?", [
				"Pennsylvania",
				"New York",
				"Ohio",
				"Vermont"
			], "New York", 2),
			q("West Point, the U.S. Military Academy, is on the…", [
				"East River",
				"Hudson River",
				"Niagara River",
				"Delaware only"
			], "Hudson River", 2)
		],
		sports: [q("The Mets play their home games in which borough?", [
			"Manhattan",
			"Queens",
			"The Bronx",
			"Brooklyn"
		], "Queens", 2), q("Yankee Stadium is in…", [
			"Manhattan",
			"The Bronx",
			"Queens",
			"Brooklyn"
		], "The Bronx", 1)],
		political: [q("New York State has how many U.S. senators?", [
			"One",
			"Two",
			"Five",
			"Twenty-seven"
		], "Two", 1), q("The UN headquarters is in…", [
			"Geneva only",
			"Manhattan",
			"Washington",
			"Albany"
		], "Manhattan", 2)],
		food: [q("A slice culture is most associated with which U.S. city?", [
			"Boston",
			"New York",
			"Seattle",
			"Denver"
		], "New York", 1), q("Pastrami on rye is a deli classic of…", [
			"Los Angeles",
			"New York",
			"Miami only",
			"Philadelphia only"
		], "New York", 2)],
		arts: [q("Lincoln Center is a performing-arts campus in…", [
			"Brooklyn",
			"Manhattan",
			"Queens",
			"the Bronx"
		], "Manhattan", 2), q("The Public Theater is tied to which downtown NYC square?", [
			"Times Square",
			"Astor Place / the East Village",
			"Columbus Circle",
			"Union Square only"
		], "Astor Place / the East Village", 3)]
	},
	sf: {
		local: [
			q("The Bay Area's BART is a…", [
				"Ferry only",
				"Regional rail system",
				"Cable-car line",
				"Airport people-mover"
			], "Regional rail system", 2),
			q("Oakland sits across the bay to San Francisco's…", [
				"West",
				"East",
				"Far south at San Jose",
				"Open ocean"
			], "East", 1),
			q("What is the capital of California?", [
				"Los Angeles",
				"San Francisco",
				"Sacramento",
				"San Diego"
			], "Sacramento", 1),
			q("Yosemite National Park is in which U.S. state?", [
				"Nevada",
				"California",
				"Oregon",
				"Arizona"
			], "California", 1),
			q("California's coastline faces which ocean?", [
				"Atlantic",
				"Pacific",
				"Gulf of Mexico",
				"Arctic"
			], "Pacific", 1),
			q("The Gold Rush of 1849 is most tied to which state?", [
				"Nevada first",
				"California",
				"Alaska first",
				"Colorado first"
			], "California", 1),
			q("Los Angeles lies generally which direction from San Francisco?", [
				"North",
				"Southeast",
				"Due east at Reno",
				"Offshore west"
			], "Southeast", 1),
			q("The San Andreas is a famous…", [
				"river",
				"fault",
				"bridge",
				"canal"
			], "fault", 1),
			q("Lake Tahoe sits on the border of California and…", [
				"Oregon",
				"Nevada",
				"Arizona",
				"Utah"
			], "Nevada", 2),
			q("Silicon Valley is primarily in which U.S. state?", [
				"Washington",
				"California",
				"Texas",
				"New York"
			], "California", 1)
		],
		sports: [q("Levi's Stadium, 49ers home, is in…", [
			"San Francisco proper",
			"Santa Clara",
			"Oakland",
			"Sacramento"
		], "Santa Clara", 3), q("The A's historically played in Oakland before relocating. Which sport?", [
			"Football",
			"Baseball",
			"Hockey",
			"Soccer"
		], "Baseball", 2)],
		political: [q("California has how many U.S. senators?", [
			"One",
			"Two",
			"Four",
			"Fifty-two"
		], "Two", 1), q("Silicon Valley is primarily in which region relative to SF?", [
			"North toward wine country only",
			"South along the Peninsula",
			"East of Tahoe",
			"The Sunset District"
		], "South along the Peninsula", 2)],
		food: [q("Napa and Sonoma, north of the city, are famous for…", [
			"Oranges",
			"Wine",
			"Maple",
			"Peanuts"
		], "Wine", 1), q("Dungeness crab is a Bay Area market staple in…", [
			"High summer only",
			"The cooler crab season",
			"Never — it's Atlantic only",
			"Desert winters"
		], "The cooler crab season", 3)],
		arts: [q("The de Young Museum sits in which park?", [
			"Dolores",
			"Golden Gate Park",
			"McLaren",
			"Buena Vista"
		], "Golden Gate Park", 2), q("Berkeley, across the bay, is home to a famous…", [
			"Naval academy",
			"Public university campus",
			"F1 circuit",
			"Mint only"
		], "Public university campus", 2)]
	},
	london: {
		local: [
			q("Greenwich is famous as the home of…", [
				"The Prime Meridian",
				"Stonehenge",
				"Hadrian's Wall",
				"The Lake District"
			], "The Prime Meridian", 1),
			q("The City of London is…", [
				"The same as Greater London",
				"A square-mile historic core with its own corporation",
				"Westminster only",
				"A county in Kent"
			], "A square-mile historic core with its own corporation", 3),
			q("The River Thames flows into the…", [
				"Irish Sea",
				"North Sea",
				"Mediterranean",
				"Baltic"
			], "North Sea", 1),
			q("England's capital is…", [
				"Manchester",
				"London",
				"Edinburgh",
				"Cardiff"
			], "London", 1),
			q("The M25 is a motorway that…", [
				"Crosses Scotland",
				"Rings Greater London",
				"Follows Hadrian's Wall",
				"Ends at Dover"
			], "Rings Greater London", 2),
			q("The White Cliffs of Dover face which body of water?", [
				"the Irish Sea",
				"the English Channel",
				"the North Sea only at Hull",
				"the Bristol Channel"
			], "the English Channel", 1),
			q("The Home Counties are the counties around…", [
				"Manchester",
				"London",
				"Belfast",
				"Cardiff"
			], "London", 2),
			q("Hadrian's Wall was built across…", [
				"Cornwall",
				"northern England",
				"Kent",
				"the Thames"
			], "northern England", 2),
			q("The United Kingdom's largest city is…", [
				"Birmingham",
				"London",
				"Glasgow",
				"Manchester"
			], "London", 1),
			q("Canterbury is a cathedral city in which direction from London, roughly?", [
				"far north near Hadrian's Wall",
				"southeast, in Kent",
				"west in Wales",
				"offshore in Ireland"
			], "southeast, in Kent", 2)
		],
		sports: [q("Twickenham is England's national stadium for…", [
			"Cricket",
			"Rugby union",
			"Football",
			"Tennis"
		], "Rugby union", 2), q("The Boat Race is rowed on the Thames between Oxford and…", [
			"Harvard",
			"Cambridge",
			"Yale",
			"Durham"
		], "Cambridge", 2)],
		political: [q("Downing Street is associated with the…", [
			"Lord Mayor",
			"Prime Minister",
			"King's private chapel",
			"Bank of England vault tour"
		], "Prime Minister", 1), q("Greater London is divided into boroughs plus the…", [
			"Duchy of Cornwall",
			"City of London",
			"Crown Estate only",
			"Home Office campus"
		], "City of London", 2)],
		food: [q("A Sunday roast is a British meal built around…", [
			"Sushi",
			"Roast meat and Yorkshire pudding",
			"Paella",
			"Pho"
		], "Roast meat and Yorkshire pudding", 1), q("Borough Market is a famous London…", [
			"Football ground",
			"Food market",
			"Mint",
			"Shipyard"
		], "Food market", 2)],
		arts: [q("Covent Garden is known for…", [
			"The docks",
			"Opera, market, and street performance",
			"The law courts only",
			"Horse guards"
		], "Opera, market, and street performance", 2), q("The British Museum is in which part of London?", [
			"Greenwich",
			"Bloomsbury",
			"Canary Wharf",
			"Richmond"
		], "Bloomsbury", 3)]
	},
	chicago: {
		local: [
			q("The Loop is named for…", [
				"The Chicago River's oxbow",
				"Elevated tracks looping downtown",
				"A racetrack",
				"Lake Shore Drive's curve"
			], "Elevated tracks looping downtown", 2),
			q("Indiana lies generally to Chicago's…", [
				"North",
				"West",
				"Southeast",
				"Due west only"
			], "Southeast", 2),
			q("What is the capital of Illinois?", [
				"Chicago",
				"Springfield",
				"Peoria",
				"Rockford"
			], "Springfield", 1),
			q("Chicago sits on which Great Lake?", [
				"Superior",
				"Michigan",
				"Erie",
				"Ontario"
			], "Michigan", 1),
			q("Illinois's longest river border to the west is the…", [
				"Ohio",
				"Mississippi",
				"Missouri only in Iowa",
				"Wabash only"
			], "Mississippi", 2),
			q("Abraham Lincoln's adopted hometown, now the state capital, is…", [
				"Chicago",
				"Springfield",
				"Galena",
				"Cairo"
			], "Springfield", 1),
			q("Wisconsin lies generally to Illinois's…", [
				"south",
				"north",
				"far east past Indiana only",
				"due west"
			], "north", 1),
			q("O'Hare is a major airport serving…", [
				"St. Louis",
				"Chicago",
				"Detroit",
				"Milwaukee only"
			], "Chicago", 1),
			q("Lake Shore Drive runs along…", [
				"the Mississippi",
				"Lake Michigan",
				"the Ohio River",
				"Lake Superior"
			], "Lake Michigan", 1),
			q("Cahokia's mounds, a pre-Columbian city, sit across from St. Louis in…", [
				"Wisconsin",
				"Illinois",
				"Indiana",
				"Michigan"
			], "Illinois", 3)
		],
		sports: [q("Guaranteed Rate Field (Comiskey's successor) is home to the…", [
			"Cubs",
			"White Sox",
			"Brewers",
			"Tigers"
		], "White Sox", 2), q("Soldier Field is home to the…", [
			"Bulls",
			"Bears",
			"Blackhawks",
			"Fire only"
		], "Bears", 1)],
		political: [q("Illinois has how many U.S. senators?", [
			"One",
			"Two",
			"Eighteen",
			"Twenty"
		], "Two", 1), q("Chicago is in which county?", [
			"Lake",
			"Cook",
			"DuPage",
			"Will"
		], "Cook", 1)],
		food: [q("A Chicago-style hot dog bun is typically…", [
			"A pretzel roll",
			"A poppy-seed steamed bun",
			"A baguette",
			"A tortilla"
		], "A poppy-seed steamed bun", 3), q("Giordano's and Lou Malnati's compete over…", [
			"Hot dogs",
			"Deep-dish pizza",
			"Italian ice",
			"Ribs only"
		], "Deep-dish pizza", 2)],
		arts: [q("The Chicago Symphony Orchestra is a…", [
			"Marching band",
			"World-famous orchestra",
			"Barbershop chorus",
			"House DJ collective"
		], "World-famous orchestra", 2), q("Grant Park hosts a huge summer music festival named…", [
			"Lollapalooza",
			"Coachella",
			"Bonaroo",
			"Austin City Limits"
		], "Lollapalooza", 2)]
	},
	detroit: {
		local: [
			q("The Detroit River flows into which Great Lake?", [
				"Michigan",
				"Erie",
				"Huron",
				"Superior"
			], "Erie", 2),
			q("8 Mile Road is famous as a…", [
				"River ford",
				"City-suburb boundary line",
				"Bridge to Canada",
				"Freeway downtown"
			], "City-suburb boundary line", 2),
			q("What is the capital of Michigan?", [
				"Detroit",
				"Lansing",
				"Ann Arbor",
				"Grand Rapids"
			], "Lansing", 1),
			q("Michigan is split into a Lower Peninsula and an…", [
				"Island chain only",
				"Upper Peninsula",
				"Ohio Strip",
				"Door Peninsula"
			], "Upper Peninsula", 1),
			q("Mackinac Bridge links Michigan's two peninsulas over the…", [
				"Ohio River",
				"Straits of Mackinac",
				"Lake Superior only",
				"Detroit River"
			], "Straits of Mackinac", 2),
			q("Ann Arbor, home of the University of Michigan, is west of…", [
				"Chicago",
				"Detroit",
				"Cleveland",
				"Toledo"
			], "Detroit", 1),
			q("Henry Ford's company and Dearborn sit next to…", [
				"Chicago",
				"Detroit",
				"Cleveland",
				"Milwaukee"
			], "Detroit", 1),
			q("Grand Rapids is in which U.S. state?", [
				"Wisconsin",
				"Michigan",
				"Ohio",
				"Indiana"
			], "Michigan", 1),
			q("The Great Lakes that wet Michigan include Superior, Michigan, Huron, and…", [
				"Ontario only in New York",
				"Erie",
				"the Dead Sea",
				"Great Salt Lake"
			], "Erie", 1),
			q("Isle Royale is a Michigan national park in…", [
				"Lake Erie",
				"Lake Superior",
				"Lake Ontario",
				"the Detroit River"
			], "Lake Superior", 3)
		],
		sports: [q("Michigan Stadium ('The Big House') is in…", [
			"Detroit",
			"Ann Arbor",
			"East Lansing",
			"Grand Rapids"
		], "Ann Arbor", 2), q("The Detroit Tigers play in which league?", [
			"National League",
			"American League",
			"NBA",
			"NHL"
		], "American League", 2)],
		political: [q("Michigan is divided into two large land masses, the Lower Peninsula and the…", [
			"Thumb only",
			"Upper Peninsula",
			"Keweenaw Republic",
			"Door Peninsula"
		], "Upper Peninsula", 1), q("Dearborn, next to Detroit, is closely tied to which automaker's history?", [
			"Honda",
			"Ford",
			"Volvo",
			"Tesla"
		], "Ford", 1)],
		food: [q("A 'Boston Cooler' in Detroit is typically Vernors and…", [
			"Whiskey",
			"Ice cream",
			"Cherry syrup",
			"Beer"
		], "Ice cream", 3), q("Faygo is a pop brand from…", [
			"Chicago",
			"Detroit",
			"Cleveland",
			"Toledo"
		], "Detroit", 2)],
		arts: [q("Aretha Franklin is closely associated with which city?", [
			"Memphis only",
			"Detroit",
			"New Orleans only",
			"Philadelphia only"
		], "Detroit", 1), q("The Heidelberg Project is a Detroit outdoor…", [
			"Ballpark",
			"Art environment of houses and lots",
			"Auto plant tour",
			"Opera"
		], "Art environment of houses and lots", 3)]
	},
	tucson: {
		local: [
			q("Arizona's nickname is the…", ["Sunshine State", "Grand Canyon State", "Silver State", "Centennial State"], "Grand Canyon State", 1),
			q("The saguaro cactus grows naturally in which desert?", ["Mojave only", "Sonoran", "Great Basin", "Chihuahuan only"], "Sonoran", 1),
			q("Phoenix is Arizona's…", ["second city after Tucson", "capital and largest city", "only university town", "port"], "capital and largest city", 1),
			q("The Colorado River in Arizona is famous for carving…", ["Carlsbad Caverns", "the Grand Canyon", "Monument Valley only", "Lake Tahoe"], "the Grand Canyon", 1),
			q("Tohono O'odham lands neighbor Tucson to the…", ["far north at Page", "west and south", "only the New Mexico line", "the Utah border"], "west and south", 2),
			q("Saguaro National Park is split into districts on which sides of Tucson?", ["North and south only", "East and west", "Only downtown", "Only on the reservation"], "East and west", 2),
			q("Arizona became a U.S. state in…", ["1848", "1863", "1912", "1959"], "1912", 2),
			q("The Arizona-Sonora Desert Museum sits west of Tucson near…", ["Tucson Mountain Park", "the airport only", "Old Main", "Reid Park"], "Tucson Mountain Park", 2),
			q("Picacho Peak is a landmark on the road between Tucson and…", ["Yuma", "Phoenix", "Flagstaff", "Nogales only"], "Phoenix", 2),
			q("Bisbee, southeast of Tucson, is an old…", ["ski town", "copper mining town", "port", "state capital"], "copper mining town", 2),
			q("Nogales sits on Arizona's border with…", ["New Mexico", "Mexico", "California", "Utah"], "Mexico", 1),
			q("The Gila River is a major Arizona tributary of the…", ["Rio Grande", "Colorado River", "Mississippi", "Pecos"], "Colorado River", 2),
			q("Flagstaff sits near which volcano-field mountain?", ["Mount Baldy only", "the San Francisco Peaks", "the Superstitions only", "Mount Graham only"], "the San Francisco Peaks", 2),
			q("Organ Pipe Cactus National Monument is in…", ["southern Arizona", "the Utah strip", "New Mexico", "Nevada"], "southern Arizona", 2),
			q("A monsoon in the Tucson calendar is a…", ["winter snow", "summer thunderstorm season", "spring freeze", "fall hurricane landfall"], "summer thunderstorm season", 1),
			q("The Santa Catalina Mountains rise on which side of Tucson?", ["south", "north", "due west only", "inside Mexico"], "north", 1),
			q("Mount Lemmon is known in summer as a…", ["desert floor spa", "sky-island escape above the heat", "sand dune", "salt flat"], "sky-island escape above the heat", 2),
			q("Arizona's Copper State nickname comes from…", ["pennies minted there only", "historic copper mining", "the Grand Canyon's color", "the flag's star"], "historic copper mining", 2),
			q("The Salt River is associated with which Arizona metro?", ["Tucson only", "Phoenix", "Yuma only", "Page"], "Phoenix", 2),
			q("Kartchner Caverns are a state park of…", ["open desert pavement", "living limestone caves", "a lava tube only", "an old rail tunnel"], "living limestone caves", 2)
		],
		sports: [
			q("Arizona State University's teams are the…", ["Wildcats", "Sun Devils", "Bobcats", "Lumberjacks"], "Sun Devils", 1),
			q("The NFL Cardinals play in which Arizona city area?", ["Tucson", "Glendale / Phoenix", "Flagstaff", "Yuma"], "Glendale / Phoenix", 1),
			q("Spring training baseball in Arizona is called the…", ["Grapefruit League", "Cactus League", "Desert League", "Sun League"], "Cactus League", 2)
		],
		political: [
			q("Arizona's capital is…", ["Tucson", "Phoenix", "Prescott still", "Flagstaff"], "Phoenix", 1),
			q("Arizona shares an international border with…", ["Canada", "Mexico", "both oceans", "Texas only"], "Mexico", 1),
			q("Arizona has how many U.S. House seats that vary by census — the state joined the Union in…", ["1848", "1863 as a state", "1912", "1959"], "1912", 2)
		],
		food: [
			q("A chimichanga is often claimed (with arguments) as a fry-up from…", ["California rolls", "Arizona / border Mexican restaurants", "New England", "the Midwest only"], "Arizona / border Mexican restaurants", 2),
			q("Navajo frybread is associated with…", ["New England clambakes", "Southwest Native cooking", "Cajun kitchens", "Pacific salmon pits"], "Southwest Native cooking", 2),
			q("Prickly pear syrup is made from…", ["agave hearts only", "cactus fruit", "mesquite bark", "pine nuts"], "cactus fruit", 1)
		],
		arts: [
			q("Mariachi in southern Arizona is a living…", ["Norwegian choir style", "Mexican musical tradition", "only a museum exhibit", "German band form"], "Mexican musical tradition", 1),
			q("Western films used Arizona's…", ["pine fjords", "desert and red-rock country as sets", "skyscrapers only", "Great Lakes"], "desert and red-rock country as sets", 2)
		]
	},
	toronto: {
		local: [
			q("Ontario is Canada's…", ["smallest province", "most populous province", "only prairie province", "northern territory"], "most populous province", 1),
			q("Niagara Falls sits on the border of Ontario and…", ["Quebec", "New York", "Michigan", "Vermont"], "New York", 1),
			q("Ottawa is Canada's…", ["largest city", "national capital", "only port", "prairie capital"], "national capital", 1),
			q("Lake Ontario drains toward the sea via the…", ["Mississippi", "St. Lawrence River", "Hudson only", "Mackenzie"], "St. Lawrence River", 2),
			q("The Golden Horseshoe is a populated arc around…", ["Hudson Bay", "western Lake Ontario", "Lake Superior", "the Ottawa River only"], "western Lake Ontario", 2),
			q("Hamilton sits at the western end of…", ["Lake Superior", "Lake Ontario", "Georgian Bay only", "the St. Lawrence Seaway's Atlantic mouth"], "Lake Ontario", 2),
			q("The Canadian Shield is…", ["a glass floor on the CN Tower", "an ancient rock plateau covering much of Ontario and beyond", "Toronto's subway token", "a waterfall"], "an ancient rock plateau covering much of Ontario and beyond", 2),
			q("Stratford, Ontario is famous for a…", ["film studio backlot", "Shakespeare festival", "auto plant only", "ski jump"], "Shakespeare festival", 2),
			q("The Thousand Islands sit in the…", ["Niagara River only", "St. Lawrence River", "Hudson Bay", "Lake Erie"], "St. Lawrence River", 2),
			q("Algonquin Park is a large Ontario…", ["desert", "provincial park of lakes and pine", "urban square", "island ferry"], "provincial park of lakes and pine", 1),
			q("The GTA in local talk means the…", ["Grand Trunk Arena", "Greater Toronto Area", "Georgian Transit Authority", "Guelph Tax Agency"], "Greater Toronto Area", 1),
			q("Mississauga is a large city…", ["in Quebec", "immediately west of Toronto", "on Hudson Bay", "in Manitoba"], "immediately west of Toronto", 1)
		],
		sports: [
			q("The CFL Argonauts play football in…", ["Hamilton only", "Toronto", "Ottawa only", "Winnipeg only"], "Toronto", 1),
			q("Canada's national winter sport is…", ["lacrosse only", "ice hockey", "curling only", "skiing only"], "ice hockey", 1),
			q("The Toronto FC play which sport?", ["Hockey", "Soccer", "Baseball", "Football"], "Soccer", 1)
		],
		political: [
			q("Canada is a…", ["unitary city-state", "constitutional monarchy and federation", "U.S. territory", "absolute monarchy"], "constitutional monarchy and federation", 1),
			q("Ontario's head of government is the…", ["mayor of Toronto", "premier", "president", "governor"], "premier", 1),
			q("Canada shares its long southern land border with…", ["Mexico", "the United States", "Greenland", "France"], "the United States", 1)
		],
		food: [
			q("Poutine is associated first with…", ["British Columbia only", "Quebec, and now everywhere including Toronto", "the Maritimes only", "the Prairies only"], "Quebec, and now everywhere including Toronto", 1),
			q("A butter tart is a staple of…", ["Tex-Mex", "Ontario / Canadian baking", "Cajun kitchens", "Pacific salmon pits"], "Ontario / Canadian baking", 1),
			q("Nanaimo bars are a Canadian…", ["savory meat pie", "no-bake chocolate-and-custard square", "fried dough", "smoked fish"], "no-bake chocolate-and-custard square", 2)
		],
		arts: [
			q("The Group of Seven were Canadian…", ["hockey line", "landscape painters", "a folk band only", "architects of the CN Tower"], "landscape painters", 1),
			q("Margaret Atwood is a writer long associated with…", ["Texas", "Toronto / Canadian letters", "Hollywood screen musicals only", "the Harlem Renaissance"], "Toronto / Canadian letters", 2)
		]
	},
	la: {
		local: [
			q("California's nickname is the…", ["Sunshine State", "Golden State", "Silver State", "Evergreen State"], "Golden State", 1),
			q("The Pacific Ocean lies on which side of Los Angeles?", ["east", "west", "due north only", "the Nevada line"], "west", 1),
			q("The San Andreas is a famous California…", ["river", "fault", "freeway only", "aqueduct plant"], "fault", 1),
			q("Santa Ana winds are…", ["wet ocean breezes", "dry offshore winds", "arctic fronts", "monsoon storms"], "dry offshore winds", 2),
			q("The 405 is a major…", ["subway line", "freeway in the L.A. area", "hiking trail only", "ferry"], "freeway in the L.A. area", 1),
			q("Pasadena sits generally…", ["on the coast at Venice", "northeast of downtown L.A.", "in Orange County's far south", "on Catalina"], "northeast of downtown L.A.", 1),
			q("Long Beach is…", ["a desert town by Palmdale", "a port city south of downtown L.A.", "in the San Fernando Valley only", "in Nevada"], "a port city south of downtown L.A.", 1),
			q("The Getty Center sits in the…", ["Arts District", "Santa Monica Mountains / Brentwood hills", "Chavez Ravine", "the Ports of L.A. only"], "Santa Monica Mountains / Brentwood hills", 2),
			q("Mulholland Drive runs along the…", ["Los Angeles River bed only", "Santa Monica Mountains ridgeline", "beach bike path", "the 10 freeway trench"], "Santa Monica Mountains ridgeline", 2),
			q("Catalina Island lies off the coast of…", ["San Francisco", "Southern California", "Oregon", "Baja's far cape only"], "Southern California", 1),
			q("The Los Angeles Aqueduct famously brought water from the…", ["Colorado's mouth at Mexico", "Owens Valley", "Great Lakes", "Sacramento Delta only"], "Owens Valley", 2),
			q("Burbank is associated with…", ["heavy industry only", "studios and the Valley's east side", "the Port of L.A.", "Joshua Tree"], "studios and the Valley's east side", 2)
		],
		sports: [
			q("The Rams play NFL football in the L.A. area at…", ["Dodger Stadium", "SoFi Stadium", "the Rose Bowl only", "Pauley Pavilion"], "SoFi Stadium", 1),
			q("UCLA's teams are the…", ["Trojans", "Bruins", "Dons", "Anteaters"], "Bruins", 1),
			q("USC's teams are the…", ["Bruins", "Trojans", "Bears", "Sun Devils"], "Trojans", 1)
		],
		political: [
			q("California's capital is…", ["Los Angeles", "Sacramento", "San Diego", "San Jose"], "Sacramento", 1),
			q("California borders Mexico to the…", ["north", "south", "east only at Nevada", "west on the Pacific as a land border"], "south", 1),
			q("Los Angeles County is among the…", ["smallest U.S. counties", "most populous U.S. counties", "only independent cities", "Canadian districts"], "most populous U.S. counties", 1)
		],
		food: [
			q("In-N-Out is a burger chain born in…", ["Texas", "California", "New York", "Florida"], "California", 1),
			q("A Mission-style burrito is more San Francisco; L.A. is famous for…", ["only clam chowder", "tacos, including street and truck service", "deep-dish only", "lobster rolls"], "tacos, including street and truck service", 1),
			q("California rolls were popularized as a…", ["Texas brisket cut", "sushi roll using avocado", "New England chowder", "Chicago dog"], "sushi roll using avocado", 2)
		],
		arts: [
			q("Hollywood is a district of…", ["Burbank only", "Los Angeles", "Santa Barbara", "Las Vegas"], "Los Angeles", 1),
			q("The Oscars are associated with…", ["Sundance, Utah only", "the American film industry centered in Los Angeles", "Broadway theatre awards", "Cannes exclusively"], "the American film industry centered in Los Angeles", 1)
		]
	},
	boston: {
		local: [
			q("Cape Cod is a…", ["Vermont mountain", "Massachusetts peninsula", "Maine island only", "Rhode Island capital"], "Massachusetts peninsula", 1),
			q("Salem, north of Boston, is famous for…", ["a gold rush", "seventeenth-century witch trials", "the first subway", "Fenway Park"], "seventeenth-century witch trials", 1),
			q("The Pilgrims' 1620 colony is associated with…", ["Salem", "Plymouth", "Worcester", "Springfield"], "Plymouth", 1),
			q("The Revolutionary War's opening fights in 1775 were at…", ["Bunker Hill only", "Lexington and Concord", "Valley Forge", "Yorktown"], "Lexington and Concord", 1),
			q("Worcester is a large city…", ["on Cape Cod", "inland in Massachusetts", "in New Hampshire", "on Nantucket"], "inland in Massachusetts", 1),
			q("The Berkshires are in…", ["eastern Massachusetts on the Cape", "western Massachusetts", "downtown Boston", "Rhode Island only"], "western Massachusetts", 1),
			q("Rhode Island lies generally…", ["north of Maine", "south of Massachusetts", "west of New York", "east of the Atlantic"], "south of Massachusetts", 1),
			q("New Hampshire lies generally…", ["south of Rhode Island", "north of Massachusetts", "west of New York", "on Cape Cod"], "north of Massachusetts", 1),
			q("Martha's Vineyard and Nantucket are…", ["Vermont lakes", "islands off Massachusetts", "Boston Harbor's only names", "New Hampshire peaks"], "islands off Massachusetts", 1),
			q("Lowell, Massachusetts grew as a…", ["gold camp", "nineteenth-century mill city", "ski town only", "whaling capital of Nantucket"], "nineteenth-century mill city", 2),
			q("The Massachusetts Turnpike is nicknamed the…", ["T", "Pike", "Gardiner", "405"], "Pike", 1),
			q("Cambridge sits across the Charles River from…", ["Salem", "Boston", "Providence", "Worcester"], "Boston", 1),
			q("The North Shore of Massachusetts is generally…", ["south of the Cape", "the coast north of Boston", "the Berkshire hills", "Rhode Island's bay"], "the coast north of Boston", 1),
			q("The Quabbin Reservoir is a large…", ["Boston Harbor island", "drinking-water reservoir in central Massachusetts", "Fenway pond", "Cape Cod canal lock"], "drinking-water reservoir in central Massachusetts", 2)
		],
		sports: [
			q("The Basketball Hall of Fame is in…", ["Boston", "Springfield, Massachusetts", "Hartford", "Providence"], "Springfield, Massachusetts", 1),
			q("The Head of the Charles is a famous…", ["marathon", "rowing regatta in Cambridge / Boston", "hockey series", "Fenway promotion"], "rowing regatta in Cambridge / Boston", 2)
		],
		political: [
			q("Massachusetts' U.S. nick-name in civic talk is often the…", ["Bay State", "Garden State", "Pine Tree State", "Ocean State"], "Bay State", 1),
			q("Maine was once a district of…", ["Vermont", "Massachusetts", "New York", "Canada"], "Massachusetts", 2)
		],
		food: [
			q("A whoopie pie is a treat associated with…", ["Texas", "New England", "Southern California", "the desert Southwest"], "New England", 1),
			q("New England is known for…", ["Sonoran hot dogs", "clam shacks and lobster", "In-N-Out", "deep-dish only"], "clam shacks and lobster", 1)
		],
		arts: [
			q("Orchard House in Concord was home to…", ["Emily Dickinson only", "Louisa May Alcott", "Herman Melville's whaling years", "the Boston Symphony"], "Louisa May Alcott", 2),
			q("Tanglewood, the BSO's summer home, is in the…", ["North End", "Berkshires", "Seaport", "Cape Cod dunes"], "Berkshires", 2)
		]
	},
	nola: {
		local: [
			q("Louisiana's capital is…", ["New Orleans", "Baton Rouge", "Lafayette", "Lake Charles"], "Baton Rouge", 1),
			q("The Atchafalaya is a major Louisiana…", ["mountain range", "river basin / swamp", "skyscraper", "streetcar line"], "river basin / swamp", 2),
			q("Cajun country in Louisiana is especially associated with…", ["the French Quarter only", "Acadiana, including Lafayette", "the CBD skyscrapers", "the Superdome"], "Acadiana, including Lafayette", 2),
			q("Avery Island, Louisiana, is famous for…", ["the Super Bowl", "Tabasco sauce", "the Cabildo", "streetcars"], "Tabasco sauce", 2),
			q("Lake Pontchartrain's Causeway is a long…", ["tunnel under the Mississippi", "bridge over the lake", "streetcar trestle", "levee walk only"], "bridge over the lake", 1),
			q("Shreveport is a city in…", ["Mississippi", "northern Louisiana", "the French Quarter", "coastal Alabama"], "northern Louisiana", 1),
			q("The Gulf of Mexico lies generally…", ["north of Arkansas", "south of Louisiana", "west of California only", "inside Lake Pontchartrain"], "south of Louisiana", 1),
			q("Mississippi the state lies generally…", ["west of Texas", "east of Louisiana", "north of Canada", "inside Orleans Parish"], "east of Louisiana", 1),
			q("Texas lies generally…", ["east of Alabama", "west of Louisiana", "north of Tennessee", "inside the French Quarter"], "west of Louisiana", 1),
			q("The Mississippi Delta, in common U.S. talk, often means country in…", ["Vermont", "northwest Mississippi (and nearby)", "Oregon", "the French Alps"], "northwest Mississippi (and nearby)", 2),
			q("Huey P. Long was a famous…", ["New Orleans jazz drummer", "Louisiana governor and U.S. senator", "Saints quarterback", "streetcar inventor"], "Louisiana governor and U.S. senator", 2),
			q("Louisiana joined the United States through the…", ["Treaty of Ghent only", "Louisiana Purchase", "Gadsden Purchase", "Alaska purchase"], "Louisiana Purchase", 1)
		],
		sports: [
			q("LSU's main campus and Tiger Stadium are in…", ["New Orleans", "Baton Rouge", "Lafayette", "Shreveport"], "Baton Rouge", 1),
			q("The Sugar Bowl is a college football game long associated with…", ["New Orleans", "Dallas only", "Pasadena only", "Miami"], "New Orleans", 1)
		],
		political: [
			q("Louisiana's U.S. nickname is often the…", ["Bay State", "Pelican State", "Sunshine State", "Empire State"], "Pelican State", 1),
			q("The Louisiana Purchase was completed in…", ["1776", "1803", "1815", "1865"], "1803", 1),
			q("Napoleon sold Louisiana to the…", ["British Crown", "United States", "Spanish Empire", "Republic of Texas"], "United States", 1)
		],
		food: [
			q("Crawfish boils are a spring ritual in…", ["Vermont", "Louisiana", "Alaska", "Arizona"], "Louisiana", 1),
			q("Jambalaya is a rice dish associated with…", ["New England", "Louisiana", "the Pacific Northwest", "Minnesota"], "Louisiana", 1),
			q("King cake is eaten in New Orleans especially during…", ["Lent's end only in July", "Carnival / Mardi Gras season", "Halloween only", "the Super Bowl exclusively"], "Carnival / Mardi Gras season", 1)
		],
		arts: [
			q("Zydeco is a music closely tied to…", ["Louisiana Creole and Cajun communities", "Nashville country radio only", "Seattle grunge", "British invasion bands"], "Louisiana Creole and Cajun communities", 2),
			q("Tennessee Williams set A Streetcar Named Desire in…", ["Chicago", "New Orleans", "Memphis", "Atlanta"], "New Orleans", 1)
		]
	}
};
stampCityRecord(REGION);
function draw(list: TriviaQ[]): TriviaQ | null {
	if (!list.length) return null;
	return list[Math.floor(Math.random() * list.length)];
}
function preferDiff(tier?: Tier): TriviaDiff {
	if (tier === "white" || tier === "blue" || !tier) return 1;
	if (tier === "green" || tier === "amber") return 2;
	return 3;
}
function binWeights(tier?: Tier): [number, number, number] {
	if (tier === "white") return [
		1,
		1,
		12
	];
	if (tier === "blue") return [
		2,
		1,
		9
	];
	if (tier === "green") return [
		4,
		3,
		5
	];
	if (tier === "amber") return [
		4,
		3,
		4
	];
	if (tier === "red" || tier === "violet") return [
		5,
		3,
		2
	];
	return [
		3,
		2,
		6
	];
}
function localWeights(tier?: Tier): [number, number, number] {
	if (tier === "white" || tier === "blue" || !tier) return [
		8,
		5,
		2
	];
	if (tier === "green" || tier === "amber") return [
		6,
		5,
		3
	];
	return [
		5,
		4,
		3
	];
}
function fresh(list: TriviaQ[], avoid: Set<string>): TriviaQ[] {
	const open = list.filter((x) => !isSeen(x, avoid));
	return open.length ? open : list;
}
function drawPrefer(list: TriviaQ[], prefer: TriviaDiff, avoid: Set<string>, strict = false): TriviaQ {
	if (!list.length) {
		return q("How many degrees in a right angle?", ["45", "90", "180", "360"], "90", 1);
	}
	const pool = fresh(list, avoid);
	const exact = pool.filter((x) => (x.diff ?? 2) === prefer);
	if (exact.length) return draw(exact)!;
	const near = pool.filter((x) => Math.abs((x.diff ?? 2) - prefer) <= 1);
	if (near.length && (strict || Math.random() < 0.85)) return draw(near)!;
	return draw(pool)!;
}

type TriviaBin = { w: number; qs: TriviaQ[] };

function pickFromBins(bins: TriviaBin[], prefer: TriviaDiff, seen: Set<string>, strict: boolean): TriviaQ {
	const loaded = bins.filter((b) => b.qs.length);
	const live = loaded
		.map((b) => ({ w: b.w, qs: b.qs.filter((x) => !isSeen(x, seen)) }))
		.filter((b) => b.qs.length);
	const pool = live.length ? live : loaded;
	if (!pool.length) {
		const any = bins.flatMap((b) => b.qs);
		return drawPrefer(any, prefer, seen, strict);
	}
	if (strict) {
		const exact = pool.flatMap((b) => b.qs.filter((x) => (x.diff ?? 2) === prefer));
		if (exact.length) return draw(exact)!;
		const near = pool.flatMap((b) => b.qs.filter((x) => Math.abs((x.diff ?? 2) - prefer) <= 1));
		if (near.length) return draw(near)!;
		const any = pool.flatMap((b) => b.qs);
		if (any.length) return draw(any)!;
	}
	const total = pool.reduce((s, b) => s + b.w, 0) || 1;
	let r = Math.random() * total;
	for (const bin of pool) {
		r -= bin.w;
		if (r <= 0) return drawPrefer(bin.qs, prefer, seen, strict);
	}
	return drawPrefer(pool[0]?.qs ?? [], prefer, seen, strict);
}

export const ASKED_KEEP = 2400;
const HOME: Record<CityId, string[]> = {
	austin: [
		"austin",
		"texas",
		"texan"
	],
	temple: [
		"temple",
		"texas",
		"texan",
		"bell county",
		"belton"
	],
	nyc: [
		"new york",
		"manhattan",
		"brooklyn",
		"queens",
		"the bronx",
		"staten island",
		"nyc",
		"hudson"
	],
	sf: [
		"san francisco",
		"california",
		"bay area",
		"golden gate",
		"alcatraz",
		"oakland"
	],
	london: [
		"london",
		"england",
		"english",
		"britain",
		"british",
		"united kingdom",
		"thames",
		"greenwich"
	],
	chicago: [
		"chicago",
		"illinois",
		"the loop",
		"lake michigan",
		"cook county"
	],
	detroit: [
		"detroit",
		"michigan",
		"motown",
		"dearborn",
		"wayne county"
	],
	tucson: [
		"tucson",
		"arizona",
		"pima",
		"saguaro",
		"sonoran",
		"o'odham",
		"tohono",
		"old pueblo",
		"wildcat"
	],
	toronto: [
		"toronto",
		"ontario",
		"cn tower",
		"maple leaf",
		"raptors",
		"blue jays",
		"yonge",
		"queen's park",
		"path",
		"gta"
	],
	la: [
		"los angeles",
		"l.a.",
		"hollywood",
		"california",
		"dodger",
		"lakers",
		"griffith",
		"wilshire",
		"chavez",
		"bunker hill"
	],
	boston: [
		"boston",
		"massachusetts",
		"fenway",
		"beacon hill",
		"freedom trail",
		"charles river",
		"cambridge",
		"celtics",
		"red sox",
		"old ironsides",
		"mbta"
	],
	nola: [
		"new orleans",
		"louisiana",
		"french quarter",
		"nola",
		"saints",
		"jazz",
		"mardi gras",
		"beignet",
		"mississippi",
		"crescent",
		"vieux"
	]
};
function aboutPlace(item: TriviaQ, cityId: CityId): boolean {
	const hay = `${item.q} ${item.answer} ${item.fact ?? ""}`.toLowerCase();
	return HOME[cityId].some((k) => hay.includes(k));
}

function collectPlaceQs(cityId: CityId, cat: TriviaCat, poi?: Poi): TriviaQ[] {
	if (!poi) return [];
	const topics = topicsFor(poi);
	const fromPlace = topics.flatMap((t) => PLACE[t]?.[cat] ?? []);
	const door = [poi.quiz, ...(poi.quizzes ?? [])].flatMap((x) => (x ? [sealPlate(x, { city: true })] : []));
	const doorUse = cat === "math" ? [] : door;
	const keyedCity = mergeCat(CITY[cityId]?.[cat] ?? [], CITY_EXTRA[cityId]?.[cat] ?? []).filter((x) => aboutTopic(x, poi));
	return mergeCat(mergeCat(doorUse, fromPlace), keyedCity);
}

function filterRarity(list: TriviaQ[], allowed: Set<Tier>) {
	return list.filter((x) => allowed.has(x.rarity));
}

export function pickTrivia(
  cityId: CityId,
  cat: TriviaCat,
  poi?: Poi,
  tier?: Tier,
  avoid: readonly string[] = [],
  want?: TriviaDiff,
): TriviaQ {
	const cityQs = mergeCat(CITY[cityId]?.[cat] ?? [], CITY_EXTRA[cityId]?.[cat] ?? []);
	const regionQs = REGION[cityId]?.[cat] ?? [];
	const color: Tier = tier ?? poi?.tier ?? "white";
	const prefer = want ?? preferDiff(color);
	const strict = want != null;
	const seen = new Set(avoid);
	const placeQs = collectPlaceQs(cityId, cat, poi);
	const cityPool = mergeCat(mergeCat(placeQs, cityQs), regionQs);
	const globalPool =
		cat === "local"
			? (GENERAL.local ?? []).filter((x) => aboutPlace(x, cityId))
			: (GENERAL[cat] ?? []);
	const hit = pickUnseenRarity(color, cityPool, globalPool, seen, want);
	if (hit) return hit.plate;

	rarityStats.fallbacks += 1;
	const allowed = allowedRarities(color);
	const [pw, cw, rw, gw] = placeWeights(color);
	const bins =
		cat === "local"
			? [
					{ w: pw, qs: filterRarity(placeQs, allowed) },
					{ w: cw, qs: filterRarity(cityQs, allowed) },
					{ w: rw, qs: filterRarity(regionQs, allowed) },
					{ w: gw, qs: filterRarity(globalPool, allowed) },
				]
			: [
					{ w: pw, qs: filterRarity(placeQs, allowed) },
					{ w: cw, qs: filterRarity(cityQs, allowed) },
					{ w: rw, qs: filterRarity(regionQs, allowed) },
					{ w: gw, qs: filterRarity(globalPool, allowed) },
				];
	if (bins.some((b) => b.qs.length)) return pickFromBins(bins, prefer, seen, strict);
	return q("How many degrees in a right angle?", ["45", "90", "180", "360"], "90", 1);
}
export function shuffled(quiz: TriviaQ): {
	q: string;
	choices: string[];
	answer: string;
	fact?: string;
	diff: TriviaDiff;
	id: string;
	rarity: Tier;
} {
	const choices = [...quiz.choices];
	for (let i = choices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[choices[i], choices[j]] = [choices[j], choices[i]];
	}
	return {
		q: quiz.q,
		choices,
		answer: quiz.answer,
		fact: quiz.fact,
		diff: quiz.diff ?? 2,
		id: quiz.id,
		rarity: quiz.rarity,
	};
}

export function offerCats(poiId: string, vaultsOpened: number, n = 6, poi?: Poi): TriviaCat[] {
	let h = 2166136261;
	const seed = `${poiId}#${vaultsOpened}`;
	for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
	const arr = [...ALL_CATS];
	for (let i = arr.length - 1; i > 0; i--) {
		h = Math.imul(h ^ (h >>> 15), 2246822519);
		h = Math.imul(h ^ (h >>> 13), 3266489917);
		const j = Math.abs(h) % (i + 1);
		const a = arr[i]!;
		arr[i] = arr[j]!;
		arr[j] = a;
	}
	if (!poi) return arr.slice(0, n);
	const pin = pinCats(poi);
	const rest = arr.filter((c) => !pin.includes(c));
	return [...pin, ...rest].slice(0, n);
}

export function bankSize() {
	const byDiff = { 1: 0, 2: 0, 3: 0 };
	const byRarity = emptyBuckets();
	let total = 0;
	const perCat: Record<string, number> = {};
	for (const cat of ALL_CATS) {
		const all = [
			...(GENERAL[cat] ?? []),
			...Object.values(CITY).flatMap((c) => c[cat] ?? []),
			...Object.values(CITY_EXTRA).flatMap((c) => c[cat] ?? []),
			...Object.values(REGION).flatMap((c) => c[cat] ?? []),
		];
		const unique = new Set(all.map((x) => x.q));
		perCat[cat] = unique.size;
		total += unique.size;
		for (const item of all) {
			if (unique.delete(item.q)) {
				byDiff[(item.diff ?? 2) as 1 | 2 | 3] += 1;
				byRarity[item.rarity] += 1;
			}
		}
	}
	return { total, perCat, byDiff, byRarity };
}

export function rarityCensus() {
	const buckets = emptyBuckets();
	const seen = new Set<string>();
	const add = (list: TriviaQ[]) => {
		for (const x of list) {
			if (seen.has(x.id)) continue;
			seen.add(x.id);
			buckets[x.rarity] += 1;
		}
	};
	for (const cat of ALL_CATS) {
		add(GENERAL[cat] ?? []);
		for (const c of Object.values(CITY)) add(c[cat] ?? []);
		for (const c of Object.values(CITY_EXTRA)) add(c[cat] ?? []);
		for (const c of Object.values(REGION)) add(c[cat] ?? []);
	}
	for (const topic of Object.values(PLACE)) {
		if (!topic) continue;
		for (const list of Object.values(topic)) add(list ?? []);
	}
	return { total: seen.size, buckets, downfills: rarityStats.downfills, fallbacks: rarityStats.fallbacks };
}
