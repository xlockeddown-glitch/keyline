import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Weekly-style city cards (2026-11-09, batch 2 sub-batch f) for the thinner city decks: Tucson, LA, Toronto, Philadelphia, Austin, Denver and Temple. Every card was checked against the source URL above it. Wired via cities.ts (CITY_WEEKLY_20261109F).
 */
export const CITY_WEEKLY_20261109F: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  austin: {
    history: [
      // https://en.wikipedia.org/wiki/Texas_State_Capitol
      q("Which Austin building, completed in 1888, is taller than the US Capitol?", ["Texas State Capitol", "Governor's Mansion", "Driskill Hotel", "UT Tower"], "Texas State Capitol", 2),
    ],
  },
  temple: {
    history: [
      // https://en.wikipedia.org/wiki/Baylor_Scott_%26_White_Health
      q("Which Temple, Texas hospital founded in 1897 grew into a major medical system?", ["Scott & White", "Methodist", "Seton", "St. David's"], "Scott & White", 2),
    ],
  },
  tucson: {
    local: [
      // https://en.wikipedia.org/wiki/Mount_Lemmon
      q("Which mountain north of Tucson has the southernmost ski area in the US?", ["Mount Graham", "Kitt Peak", "Mount Lemmon", "Mount Wrightson"], "Mount Lemmon", 2),
    ],
    food: [
      // https://en.wikipedia.org/wiki/Cheese_crisp
      q("Which Sonoran-style flour tortilla dish, open-faced and baked crisp, is a Tucson favorite?", ["cheese crisp", "chimichanga", "tostada", "quesadilla"], "cheese crisp", 2),
    ],
    nature: [
      // https://en.wikipedia.org/wiki/Saguaro_National_Park
      q("Which national park has two districts flanking Tucson, east and west?", ["Petrified Forest", "Grand Canyon", "Saguaro National Park", "Organ Pipe Cactus"], "Saguaro National Park", 2),
    ],
  },
  toronto: {
    local: [
      // https://en.wikipedia.org/wiki/Nathan_Phillips_Square
      q("Which Toronto square sits in front of the curved towers of City Hall?", ["David Pecaut Square", "Yonge–Dundas Square", "Union Station plaza", "Nathan Phillips Square"], "Nathan Phillips Square", 2),
      // https://en.wikipedia.org/wiki/High_Park
      q("Which Toronto park is the city's largest public park, with a zoo and cherry trees?", ["High Park", "Queen's Park", "Christie Pits", "Trinity Bellwoods"], "High Park", 2),
      // https://en.wikipedia.org/wiki/Canadian_National_Exhibition
      q("Which Toronto event in late summer is Canada's largest annual fair?", ["Taste of the Danforth", "Canadian National Exhibition", "Royal Winter Fair", "Calgary Stampede"], "Canadian National Exhibition", 2),
      // https://en.wikipedia.org/wiki/Billy_Bishop_Toronto_City_Airport
      q("Which Toronto airport sits on the Toronto Islands?", ["Pearson", "Billy Bishop", "Hamilton", "Buttonville"], "Billy Bishop", 2),
    ],
  },
  la: {
    local: [
      // https://en.wikipedia.org/wiki/Santa_Monica_Mountains
      q("Which LA mountain range runs through the city and holds the Hollywood Sign?", ["Santa Monica Mountains", "San Bernardino Mountains", "Verdugo Mountains", "San Gabriel Mountains"], "Santa Monica Mountains", 2),
      // https://en.wikipedia.org/wiki/Four_Level_Interchange
      q("Which LA freeway interchange is famous as a stack of four levels?", ["Four Level Interchange", "Spaghetti Junction", "Malfunction Junction", "Big I"], "Four Level Interchange", 2),
      // https://en.wikipedia.org/wiki/California_Science_Center
      q("Which LA museum holds the space shuttle Endeavour?", ["Petersen Museum", "Getty Center", "California Science Center", "Natural History Museum"], "California Science Center", 2),
      // https://en.wikipedia.org/wiki/The_Broad
      q("Which Los Angeles museum of contemporary art was founded by Eli Broad?", ["MOCA", "The Broad", "LACMA", "Hammer Museum"], "The Broad", 2),
    ],
    sports: [
      // https://en.wikipedia.org/wiki/SoFi_Stadium
      q("Which Inglewood stadium hosted Super Bowl LVI?", ["Dodger Stadium", "SoFi Stadium", "Rose Bowl", "LA Memorial Coliseum"], "SoFi Stadium", 2),
      // https://en.wikipedia.org/wiki/Los_Angeles_Sparks
      q("Which Los Angeles WNBA team has won three titles?", ["Sparks", "Sky", "Mystics", "Mercury"], "Sparks", 2),
    ],
  },
  denver: {
    local: [
      // https://en.wikipedia.org/wiki/Denver_International_Airport
      q("Which Denver airport is known for its white peaked tent-like roof?", ["Centennial", "Rocky Mountain Metropolitan", "Stapleton", "Denver International Airport"], "Denver International Airport", 2),
    ],
    history: [
      // https://en.wikipedia.org/wiki/Pike's_Peak_Gold_Rush
      q("Which 1858 event led to Denver's founding?", ["Klondike Gold Rush", "Pike's Peak Gold Rush", "Black Hills Gold Rush", "California Gold Rush"], "Pike's Peak Gold Rush", 2),
    ],
    sports: [
      // https://en.wikipedia.org/wiki/Coors_Field
      q("Which Denver baseball stadium has a row of purple seats marking one mile high?", ["Coors Field", "Ball Arena", "Mile High Stadium", "Dick's Sporting Goods Park"], "Coors Field", 2),
    ],
  },
  philly: {
    local: [
      // https://en.wikipedia.org/wiki/Penn's_Landing
      q("Which Philadelphia waterfront area along the Delaware hosts concerts and festivals?", ["Fishtown", "Boathouse Row", "Penn's Landing", "Manayunk"], "Penn's Landing", 2),
      // https://en.wikipedia.org/wiki/Temple_University
      q("Which Philadelphia university founded in 1884 has a North Philadelphia campus and an owl mascot?", ["La Salle University", "Drexel University", "Temple University", "Villanova University"], "Temple University", 2),
    ],
  },
};
