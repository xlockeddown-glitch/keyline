import type { TriviaSeed } from "./types";

/**
 * 0.0.53: door quizzes on named lamps (were `poi.quiz` / `poi.quizzes` in data.ts). SERVER-ONLY — data.ts ships
 * to the browser for the map, so the cards and their answers live here and are read only by trivia.ts (lamp deals)
 * and friendCards.ts. Never import this from client code; `npm run qa:no-answers` fails the gate if a card leaks.
 * Keyed by poi id; the first entry is the old `quiz`, the rest the old `quizzes`.
 */
export const DOOR_QUIZZES: Record<string, TriviaSeed[]> = {
  "tx-capitol": [
    {
      q: "The Texas Capitol is clad in which local stone?",
      choices: ["Limestone", "Sunset Red granite", "Marble", "Sandstone"],
      answer: "Sunset Red granite",
    },
  ],
  "ut-tower": [
    {
      q: "How many stories is the UT Tower?",
      choices: ["14", "21", "27", "33"],
      answer: "27",
    },
  ],
  "barton-springs": [
    {
      q: "Barton Springs stays near what temperature year-round?",
      choices: ["55°F", "70°F", "85°F", "It freezes in winter"],
      answer: "70°F",
    },
  ],
  "bat-bridge": [
    {
      q: "Which animals pour out from under this bridge at dusk in summer?",
      choices: ["Chimney swifts", "Mexican free-tailed bats", "Grackles", "Cave swallows"],
      answer: "Mexican free-tailed bats",
    },
  ],
  "lady-bird": [
    {
      q: "What was Lady Bird Lake called before 2007?",
      choices: ["Lake Austin", "Town Lake", "Lake Travis", "Colorado Bend"],
      answer: "Town Lake",
    },
  ],
  franklin: [
    {
      q: "Franklin Barbecue is most famous for which smoked meat?",
      choices: ["Turkey", "Beef brisket", "Sausage", "Pork ribs"],
      answer: "Beef brisket",
    },
  ],
  "sf-depot": [
    {
      q: "Temple, Texas was named for a railroad civil engineer. Who?",
      choices: ["Jay Gould", "Bernard Moore Temple", "Leland Stanford", "Cyrus K. Holliday"],
      answer: "Bernard Moore Temple",
    },
  ],
  "bsw-temple": [
    {
      q: "Scott & White began in Temple in which year?",
      choices: ["1845", "1876", "1897", "1918"],
      answer: "1897",
    },
  ],
  "miller-springs": [
    {
      q: "Temple sits in which Texas county, whose seat is Belton?",
      choices: ["McLennan", "Bell", "Williamson", "Falls"],
      answer: "Bell",
    },
  ],
  esb: [
    {
      q: "How many floors does the Empire State Building have?",
      choices: ["86", "100", "102", "110"],
      answer: "102",
    },
  ],
  "grand-central": [
    {
      q: "Grand Central's main concourse ceiling depicts…",
      choices: ["The Hudson Valley", "A Mediterranean zodiac", "Locomotives", "Manhattan 1903"],
      answer: "A Mediterranean zodiac",
    },
  ],
  "gg-crissy": [
    {
      q: "The Golden Gate Bridge is painted which color?",
      choices: ["Gold", "International Orange", "Navy gray", "Red oxide"],
      answer: "International Orange",
    },
  ],
  "big-ben": [
    {
      q: "What is 'Big Ben' actually the name of?",
      choices: ["The clock face", "The tower", "The Great Bell", "The Houses of Parliament"],
      answer: "The Great Bell",
    },
  ],
  tower: [
    {
      q: "Legend says the kingdom falls if which birds leave the Tower?",
      choices: ["Pigeons", "Ravens", "Swans", "Falcons"],
      answer: "Ravens",
    },
  ],
  bean: [
    {
      q: "Cloud Gate in Millennium Park was designed by whom?",
      choices: ["Frank Gehry", "Anish Kapoor", "Jaume Plensa", "Alexander Calder"],
      answer: "Anish Kapoor",
    },
  ],
  willis: [
    {
      q: "Willis Tower was originally named…",
      choices: ["Hancock Center", "Sears Tower", "Standard Oil Building", "Marina City"],
      answer: "Sears Tower",
    },
  ],
  "campus-martius": [
    {
      q: "Campus Martius sits at the downtown hub of which Detroit avenue?",
      choices: ["Gratiot", "Woodward", "Jefferson only", "8 Mile"],
      answer: "Woodward",
    },
  ],
  "hart-plaza": [
    {
      q: "The giant bronze fist downtown commemorates which boxer?",
      choices: ["Joe Frazier", "Joe Louis", "Sugar Ray Robinson", "Thomas Hearns"],
      answer: "Joe Louis",
    },
  ],
  dia: [
    {
      q: "Diego Rivera's Detroit Industry murals are in which museum?",
      choices: [
        "MoMA",
        "the Detroit Institute of Arts",
        "the Louvre",
        "the Art Institute of Chicago",
      ],
      answer: "the Detroit Institute of Arts",
    },
  ],
  "el-presidio": [
    {
      q: "Tucson's name comes from an O'odham phrase referring to which landform?",
      choices: ["A dry lake", "The black base of a hill", "A copper mine", "A cottonwood bosque"],
      answer: "The black base of a hill",
    },
  ],
  "pima-courthouse": [
    {
      q: "The historic Pima County Courthouse is famous for which color of stucco?",
      choices: ["White", "Pink", "Terra-cotta red", "Sand"],
      answer: "Pink",
    },
  ],
  "hotel-congress": [
    {
      q: "A 1934 fire at Hotel Congress helped capture which outlaw's gang?",
      choices: ["Bonnie and Clyde", "John Dillinger", "Pretty Boy Floyd", "Al Capone"],
      answer: "John Dillinger",
    },
  ],
  "ua-old-main": [
    {
      q: "The University of Arizona was founded in which year?",
      choices: ["1862", "1885", "1912", "1929"],
      answer: "1885",
    },
  ],
  "a-mountain": [
    {
      q: "The white letter on Sentinel Peak in Tucson stands for…",
      choices: ["Arizona", "the University of Arizona", "the Arizona Rangers", "Ajo"],
      answer: "the University of Arizona",
    },
  ],
  "san-xavier": [
    {
      q: "Mission San Xavier del Bac is often called the…",
      choices: [
        "Pink Dome of the Valley",
        "White Dove of the Desert",
        "Copper Bell of the Mines",
        "Red Wall of the Canyon",
      ],
      answer: "White Dove of the Desert",
    },
  ],
  "cn-tower": [
    {
      q: "The CN Tower opened to the public in which year?",
      choices: ["1967", "1976", "1989", "1999"],
      answer: "1976",
    },
  ],
  nps: [
    {
      q: "Toronto City Hall's ceremonial square is named for which mayor?",
      choices: ["Mel Lastman", "Nathan Phillips", "Rob Ford", "David Miller"],
      answer: "Nathan Phillips",
    },
  ],
  rom: [
    {
      q: "The crystal addition on the Royal Ontario Museum was designed by…",
      choices: ["Frank Gehry", "Daniel Libeskind", "Zaha Hadid", "I. M. Pei"],
      answer: "Daniel Libeskind",
    },
  ],
  "queens-park": [
    {
      q: "Queen's Park is the seat of which legislature?",
      choices: [
        "Parliament of Canada",
        "Ontario Legislative Assembly",
        "Toronto City Council only",
        "the Senate",
      ],
      answer: "Ontario Legislative Assembly",
    },
  ],
  "la-city-hall": [
    {
      q: "Los Angeles City Hall opened in which year?",
      choices: ["1913", "1928", "1955", "1971"],
      answer: "1928",
    },
  ],
  "disney-hall": [
    {
      q: "Walt Disney Concert Hall was designed by…",
      choices: ["Frank Lloyd Wright", "Frank Gehry", "I. M. Pei", "Thom Mayne"],
      answer: "Frank Gehry",
    },
  ],
  "dodger-stad": [
    {
      q: "The Dodgers moved from Brooklyn to Los Angeles in…",
      choices: ["1947", "1958", "1962", "1974"],
      answer: "1958",
    },
  ],
  "griffith-obs": [
    {
      q: "Griffith Observatory opened in which year?",
      choices: ["1915", "1935", "1955", "1969"],
      answer: "1935",
    },
  ],
  "boston-common": [
    {
      q: "Boston Common is considered the oldest public park in the U.S. It dates to…",
      choices: ["1492", "1634", "1776", "1893"],
      answer: "1634",
    },
  ],
  "ma-state-house": [
    {
      q: "The Massachusetts State House was designed by…",
      choices: ["H. H. Richardson", "Charles Bulfinch", "I. M. Pei", "Frederick Law Olmsted"],
      answer: "Charles Bulfinch",
    },
  ],
  faneuil: [
    {
      q: "Faneuil Hall is nicknamed the…",
      choices: [
        "Cradle of Liberty",
        "Hub of the Universe",
        "Athens of America only",
        "Old Ironsides",
      ],
      answer: "Cradle of Liberty",
    },
  ],
  "old-north": [
    {
      q: "Two lanterns in Old North Church meant the British were coming…",
      choices: ["by land", "by sea", "from Canada", "at dawn only"],
      answer: "by sea",
    },
  ],
  "uss-constitution": [
    {
      q: "USS Constitution is nicknamed…",
      choices: ["Old Glory", "Old Ironsides", "Old North", "the Hub"],
      answer: "Old Ironsides",
    },
  ],
  fenway: [
    {
      q: "Fenway Park opened in…",
      choices: ["1894", "1912", "1934", "1967"],
      answer: "1912",
    },
  ],
  "nola-jackson": [
    {
      q: "Jackson Square was renamed for the victor of which battle?",
      choices: ["Gettysburg", "the Battle of New Orleans", "Yorktown", "San Jacinto"],
      answer: "the Battle of New Orleans",
    },
  ],
  "nola-cathedral": [
    {
      q: "St. Louis Cathedral faces which New Orleans square?",
      choices: ["Lafayette Square", "Jackson Square", "Congo Square", "Lee Circle"],
      answer: "Jackson Square",
    },
  ],
  "nola-cabildo": [
    {
      q: "The Cabildo is where the United States took possession of…",
      choices: ["Texas", "Louisiana (the Purchase)", "Florida only", "the Oregon Country"],
      answer: "Louisiana (the Purchase)",
    },
  ],
  "nola-hall": [
    {
      q: "Preservation Hall in the French Quarter is devoted to…",
      choices: ["opera", "traditional New Orleans jazz", "ballet", "silent film"],
      answer: "traditional New Orleans jazz",
    },
  ],
  "nola-dome": [
    {
      q: "The New Orleans Saints play football at the…",
      choices: [
        "Smoothie King Center only",
        "Caesars Superdome",
        "Tiger Stadium",
        "the French Market",
      ],
      answer: "Caesars Superdome",
    },
  ],
  "nola-ww2": [
    {
      q: "The National WWII Museum in New Orleans grew from a museum about…",
      choices: ["the Civil War", "D-Day", "the War of 1812", "Vietnam"],
      answer: "D-Day",
    },
  ],
  "sea-needle": [
    {
      q: "The Space Needle was built for a World's Fair in…",
      choices: ["1909", "1962", "1974", "1990"],
      answer: "1962",
    },
  ],
  "sea-pike": [
    {
      q: "Pike Place Market opened in…",
      choices: ["1851", "1907", "1962", "1971"],
      answer: "1907",
    },
  ],
  "sea-pioneer": [
    {
      q: "Pioneer Square was rebuilt in brick and stone after the great fire of…",
      choices: ["1871", "1889", "1906", "1932"],
      answer: "1889",
    },
  ],
  "sea-smith": [
    {
      q: "Smith Tower was built for Lyman Cornelius Smith, a maker of…",
      choices: ["typewriters", "railcars", "timber", "steamships"],
      answer: "typewriters",
    },
  ],
  "sea-mopop": [
    {
      q: "The Museum of Pop Culture building was designed by…",
      choices: ["Frank Gehry", "I. M. Pei", "Zaha Hadid", "Rem Koolhaas"],
      answer: "Frank Gehry",
    },
  ],
  "sea-lumen": [
    {
      q: "Lumen Field is home to the Seattle Seahawks and the…",
      choices: ["Sounders", "Mariners", "Kraken", "Storm"],
      answer: "Sounders",
    },
  ],
  "den-capitol": [
    {
      q: "The Colorado State Capitol's dome is covered in…",
      choices: ["copper sheeting", "gold leaf", "red tile", "white marble"],
      answer: "gold leaf",
    },
  ],
  "den-dam": [
    {
      q: "The Denver Art Museum's angular Hamilton Building was designed by…",
      choices: ["Frank Gehry", "Daniel Libeskind", "Renzo Piano", "Michael Graves"],
      answer: "Daniel Libeskind",
    },
  ],
  "den-mint": [
    {
      q: "Coins struck at the Denver Mint carry which mint mark?",
      choices: ["D", "M", "C", "S"],
      answer: "D",
    },
  ],
  "den-coors": [
    {
      q: "At Coors Field, a row of purple seats marks…",
      choices: [
        "the longest home run",
        "one mile above sea level",
        "the 1995 opening day",
        "the Rockies' retired numbers",
      ],
      answer: "one mile above sea level",
    },
  ],
  "nash-ryman": [
    {
      q: "The Ryman Auditorium was built in 1892 as the…",
      choices: [
        "Union Gospel Tabernacle",
        "Tennessee State Armory",
        "Cumberland Opera House",
        "Nashville Union Depot",
      ],
      answer: "Union Gospel Tabernacle",
    },
  ],
  "nash-capitol": [
    {
      q: "The architect of the Tennessee State Capitol is entombed…",
      choices: [
        "under Fort Nashborough",
        "in its own walls",
        "at the Ryman",
        "in the Hermitage garden",
      ],
      answer: "in its own walls",
    },
  ],
  "nash-cmhof": [
    {
      q: "Which letterpress poster shop operates inside the Country Music Hall of Fame?",
      choices: ["Hatch Show Print", "Globe Poster", "Triangle Poster", "Sun Studio Print"],
      answer: "Hatch Show Print",
    },
  ],
  "nash-nissan": [
    {
      q: "Nissan Stadium, across the river from downtown, is home to the…",
      choices: ["Tennessee Titans", "Memphis Grizzlies", "Nashville Predators", "Atlanta Falcons"],
      answer: "Tennessee Titans",
    },
  ],
  "nash-batman": [
    {
      q: "Nashville's twin-spired AT&T Building is nicknamed the…",
      choices: ["Batman Building", "Tuning Fork", "Guitar Tower", "Rabbit Ears"],
      answer: "Batman Building",
    },
  ],
  "pima-air": [
    {
      q: "Pima Air & Space Museum is in which city?",
      choices: ["Phoenix", "Tucson", "Albuquerque", "El Paso"],
      answer: "Tucson",
      diff: 1,
    },
    {
      q: "The military aircraft storage yard next to Pima Air & Space is…",
      choices: ["AMARG, the boneyard", "JPL", "Cape Canaveral's only hangar", "O'Hare's cargo lot"],
      answer: "AMARG, the boneyard",
      diff: 2,
    },
  ],
  "raytheon-tucson": [
    {
      q: "Raytheon Missiles & Defense's big desert plant is in…",
      choices: ["Tucson", "Flagstaff", "Yuma", "Page"],
      answer: "Tucson",
      diff: 1,
    },
    {
      q: "The Patriot system, long built by Raytheon, is a…",
      choices: [
        "surface-to-air missile system",
        "aircraft carrier class",
        "infantry rifle",
        "weather satellite",
      ],
      answer: "surface-to-air missile system",
      diff: 1,
    },
    {
      q: "RTX, Raytheon's parent, is primarily a…",
      choices: [
        "retail grocer",
        "aerospace and defense company",
        "desert utility",
        "national park service",
      ],
      answer: "aerospace and defense company",
      diff: 2,
    },
  ],
};
