import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Philadelphia's first Local deck (Keyline 0.1.128, the 16th city). Mostly hard (diff 3) cards so lamps there have red
 * depth from day one; city cards step up one rarity rung, so a hard city card bands red about 25% of the time. No math.
 * Each card is sourced from the Wikipedia article on its subject (URL above each card), checked Nov 4 2026.
 * Merged into CITY_EXTRA by cities.ts (rarity stamped there with the city nudge).
 */
export const CITY_EXTRA_PART_K: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  philly: {
    local: [
      // https://en.wikipedia.org/wiki/Liberty_Bell
      q("Which foundry first cast the Liberty Bell, a firm later renamed Whitechapel?", ["Lester and Pack", "Pass and Stow", "Mears and Stainbank", "Taylor and Sons"], "Lester and Pack", 3),
      // https://en.wikipedia.org/wiki/Liberty_Bell
      q("Whose surnames, the Philadelphia men who recast it twice, appear on the Liberty Bell?", ["Pass and Stow", "Lester and Pack", "Rush and Peale", "Wells and Elfreth"], "Pass and Stow", 3),
      // https://en.wikipedia.org/wiki/Liberty_Bell
      q("In what year did the Pennsylvania Provincial Assembly commission its State House bell?", ["1752", "1732", "1776", "1701"], "1752", 3),
      // https://en.wikipedia.org/wiki/Liberty_Bell
      q("Which movement first called the State House bell the Liberty Bell?", ["Abolitionists", "Suffragists", "Loyalists", "Temperance leagues"], "Abolitionists", 2),
      // https://en.wikipedia.org/wiki/Independence_Hall
      q("Independence Hall was designed by Andrew Hamilton and which builder?", ["Edmund Woolley", "Robert Smith", "John Haviland", "William Strickland"], "Edmund Woolley", 3),
      // https://en.wikipedia.org/wiki/Independence_Hall
      q("Before it took its famous name, Independence Hall was the Pennsylvania…", ["State House", "Court House", "Assembly Inn", "Customs House"], "State House", 2),
      // https://en.wikipedia.org/wiki/Philadelphia_City_Hall
      q("Which Scottish-born architect designed Philadelphia City Hall?", ["John McArthur Jr.", "Frank Furness", "Thomas U. Walter", "John Notman"], "John McArthur Jr.", 3),
      // https://en.wikipedia.org/wiki/Philadelphia_City_Hall
      q("Which sculptor made the William Penn statue atop Philadelphia City Hall?", ["Alexander Milne Calder", "Augustus Saint-Gaudens", "Daniel Chester French", "Alexander Stirling Calder"], "Alexander Milne Calder", 3),
      // https://en.wikipedia.org/wiki/Philadelphia_City_Hall
      q("Philadelphia City Hall is built in which architectural style?", ["Second Empire", "Greek Revival", "Art Deco", "Gothic Revival"], "Second Empire", 3),
      // https://en.wikipedia.org/wiki/Philadelphia_City_Hall
      q("On completion in 1894, Philadelphia City Hall was the world's tallest…", ["habitable building", "stone bridge", "clock tower", "church steeple"], "habitable building", 3),
      // https://en.wikipedia.org/wiki/Rocky_Steps
      q("How many stone steps lead up to the Philadelphia Museum of Art's east entrance?", ["72", "56", "88", "104"], "72", 3),
      // https://en.wikipedia.org/wiki/Philadelphia_Museum_of_Art
      q("Which architect drew the detail work for the Philadelphia Museum of Art in Trumbauer's firm?", ["Julian Abele", "Paul Cret", "Louis Kahn", "Frank Furness"], "Julian Abele", 3),
      // https://en.wikipedia.org/wiki/Philadelphia_Museum_of_Art
      q("Which Marcel Duchamp work is a final piece held by the Philadelphia Museum of Art?", ["Étant donnés", "Fountain", "Nude Descending", "Bicycle Wheel"], "Étant donnés", 3),
      // https://en.wikipedia.org/wiki/Reading_Terminal_Market
      q("Philadelphia's 12th and Arch market hall opened in what year under a railroad train shed?", ["1893", "1859", "1926", "1876"], "1893", 3),
      // https://en.wikipedia.org/wiki/Eastern_State_Penitentiary
      q("Who designed Eastern State Penitentiary?", ["John Haviland", "John Notman", "Robert Mills", "Benjamin Latrobe"], "John Haviland", 3),
      // https://en.wikipedia.org/wiki/Eastern_State_Penitentiary
      q("In which year did Eastern State Penitentiary close?", ["1971", "1953", "1929", "1989"], "1971", 3),
      // https://en.wikipedia.org/wiki/Eastern_State_Penitentiary
      q("Which famous bank robber was held at Eastern State Penitentiary?", ["Willie Sutton", "John Dillinger", "Baby Face Nelson", "Clyde Barrow"], "Willie Sutton", 3),
      // https://en.wikipedia.org/wiki/Eastern_State_Penitentiary
      q("Pep, a legendary Eastern State inmate, was what kind of animal?", ["Dog", "Cat", "Parrot", "Horse"], "Dog", 2),
      // https://en.wikipedia.org/wiki/Elfreth%27s_Alley
      q("Elfreth's Alley takes its name from Jeremiah Elfreth, who worked as a…", ["blacksmith", "cooper", "printer", "silversmith"], "blacksmith", 3),
      // https://en.wikipedia.org/wiki/Elfreth%27s_Alley
      q("How many houses line Elfreth's Alley?", ["32", "18", "46", "60"], "32", 3),
      // https://en.wikipedia.org/wiki/Boathouse_Row
      q("Boathouse Row's rowing clubs belong to a group known as the Schuylkill…", ["Navy", "Fleet", "League", "Guild"], "Navy", 3),
      // https://en.wikipedia.org/wiki/Boathouse_Row
      q("In what year were Boathouse Row's outline lights first put up?", ["1979", "1959", "1999", "1926"], "1979", 3),
      // https://en.wikipedia.org/wiki/Barnes_Foundation
      q("Albert C. Barnes made his fortune co-developing which antiseptic?", ["Argyrol", "Listerine", "Mercurochrome", "Iodoform"], "Argyrol", 3),
      // https://en.wikipedia.org/wiki/Barnes_Foundation
      q("Before 2012, the Barnes collection hung in which Philadelphia suburb?", ["Merion", "Bryn Mawr", "Ardmore", "Wayne"], "Merion", 3),
      // https://en.wikipedia.org/wiki/Christ_Church,_Philadelphia
      q("When Christ Church's steeple went up in 1754, it was the tallest building in the future United States at…", ["196 feet", "148 feet", "232 feet", "120 feet"], "196 feet", 3),
      // https://en.wikipedia.org/wiki/Fairmount_Water_Works
      q("Who designed the Fairmount Water Works?", ["Frederick Graff", "Benjamin Latrobe", "John Haviland", "Robert Mills"], "Frederick Graff", 3),
      // https://en.wikipedia.org/wiki/Rittenhouse_Square
      q("Before 1825, Rittenhouse Square was called…", ["Southwest Square", "Penn Square", "Center Square", "West Common"], "Southwest Square", 3),
      // https://en.wikipedia.org/wiki/Rittenhouse_Square
      q("Which French architect redesigned parts of Rittenhouse Square in 1913?", ["Paul Philippe Cret", "Jacques Gréber", "Charles Garnier", "Henri Labrouste"], "Paul Philippe Cret", 3),
      // https://en.wikipedia.org/wiki/Love_Park
      q("LOVE Park's official name is John F. Kennedy…", ["Plaza", "Square", "Commons", "Green"], "Plaza", 2),
      // https://en.wikipedia.org/wiki/Love_Park
      q("Which city planner, with Vincent Kling, designed LOVE Park?", ["Edmund Bacon", "Robert Moses", "Daniel Burnham", "Jane Jacobs"], "Edmund Bacon", 3),
      // https://en.wikipedia.org/wiki/Academy_of_Music_(Philadelphia)
      q("Philadelphia's Academy of Music is nicknamed the Grand Old Lady of which street?", ["Locust Street", "Walnut Street", "Spruce Street", "Chestnut Street"], "Locust Street", 3),
      // https://en.wikipedia.org/wiki/Academy_of_Music_(Philadelphia)
      q("Napoleon LeBrun and which partner won the Academy of Music design contest?", ["Gustavus Runge", "Frank Furness", "John Notman", "Thomas Walter"], "Gustavus Runge", 3),
      // https://en.wikipedia.org/wiki/Carpenters%27_Hall
      q("Which body met at Carpenters' Hall in 1774?", ["First Continental Congress", "Constitutional Convention", "Second Continental Congress", "Pennsylvania Assembly"], "First Continental Congress", 2),
      // https://en.wikipedia.org/wiki/Philadelphia%27s_Magic_Gardens
      q("Which mosaic artist made Philadelphia's Magic Gardens?", ["Isaiah Zagar", "Lily Yeh", "Keith Haring", "Howard Finster"], "Isaiah Zagar", 2),
      // https://en.wikipedia.org/wiki/Pat%27s_King_of_Steaks
      q("Pat's King of Steaks began in 1930 as a stall selling…", ["hot dogs", "hoagies", "soft pretzels", "water ice"], "hot dogs", 3),
      // https://en.wikipedia.org/wiki/Pat%27s_King_of_Steaks
      q("Which cheesesteak rival stands across the street from Pat's?", ["Geno's Steaks", "Jim's Steaks", "Dalessandro's", "Tony Luke's"], "Geno's Steaks", 1),
      // https://en.wikipedia.org/wiki/Italian_Market,_Philadelphia
      q("The Italian Market's formal name is the South Ninth Street…", ["Curb Market", "Farm Market", "Open Bazaar", "Street Fair"], "Curb Market", 3),
      // https://en.wikipedia.org/wiki/30th_Street_Station
      q("30th Street Station was designed by the firm that succeeded…", ["D. H. Burnham & Co.", "McKim, Mead & White", "Carrère and Hastings", "Warren and Wetmore"], "D. H. Burnham & Co.", 3),
      // https://en.wikipedia.org/wiki/30th_Street_Station
      q("30th Street Station is officially named for which congressman?", ["William H. Gray III", "Robert Brady", "Chaka Fattah", "Thomas Foglietta"], "William H. Gray III", 3),
      // https://en.wikipedia.org/wiki/M%C3%BCtter_Museum
      q("Part of which scientist's brain is shown at the Mütter Museum?", ["Albert Einstein", "Thomas Edison", "Nikola Tesla", "Isaac Newton"], "Albert Einstein", 2),
      // https://en.wikipedia.org/wiki/Benjamin_Franklin_Bridge
      q("Before taking Benjamin Franklin's name, the Camden span was the…", ["Delaware River Bridge", "Camden Gateway Bridge", "Penn Memorial Bridge", "Sesquicentennial Bridge"], "Delaware River Bridge", 3),
      // https://en.wikipedia.org/wiki/Benjamin_Franklin_Bridge
      q("From 1926 to 1929, the Ben Franklin Bridge held which world record?", ["Longest suspension span", "Tallest bridge towers", "Widest bridge deck", "Longest steel arch"], "Longest suspension span", 3),
      // https://en.wikipedia.org/wiki/Mummers_Parade
      q("Philadelphia's Mummers Parade is held every year on…", ["New Year's Day", "Independence Day", "Thanksgiving", "Easter Sunday"], "New Year's Day", 1),
      // https://en.wikipedia.org/wiki/The_Franklin_Institute
      q("Samuel Vaughan Merrick co-founded the Franklin Institute in which year?", ["1824", "1790", "1876", "1851"], "1824", 3),
      // https://en.wikipedia.org/wiki/Swann_Memorial_Fountain
      q("Who sculpted Logan Square's Swann Memorial Fountain?", ["Alexander Stirling Calder", "Alexander Milne Calder", "Alexander Calder", "Augustus Saint-Gaudens"], "Alexander Stirling Calder", 3),
      // https://en.wikipedia.org/wiki/National_Constitution_Center
      q("Which firm designed the National Constitution Center?", ["Pei Cobb Freed & Partners", "Venturi Scott Brown", "Kohn Pedersen Fox", "Skidmore, Owings & Merrill"], "Pei Cobb Freed & Partners", 3),
      // https://en.wikipedia.org/wiki/Museum_of_the_American_Revolution
      q("Philadelphia's Museum of the American Revolution opened on the anniversary of…", ["Lexington and Concord", "the Boston Tea Party", "the Battle of Trenton", "Yorktown's surrender"], "Lexington and Concord", 3),
    ],
  },
};
