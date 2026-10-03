import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Local trivia cards, batch 3 (v0.0.40): Temple, Texas — the thinnest city.
 * Every fact was checked by web search; sources per card are listed in
 * docs/trivia-sources-temple-0.0.40.md (keys S1–S31). Easy cards are difficulty 1 so they band white.
 * Merged into CITY_EXTRA by cities.ts (rarity stamped there with the city nudge).
 */
export const CITY_EXTRA_PART_F: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  temple: {
    local: [
      q("Temple's 1911 depot was built for which railroad?", ["Santa Fe", "Union Pacific", "Amtrak", "Southern Pacific"], "Santa Fe", 1),
      q("Temple's railroad museum sits beside an active rail yard used by BNSF and…", ["Amtrak", "Greyhound", "Megabus", "Southwest Airlines"], "Amtrak", 1),
      q("Bloomin' Temple was a long-running downtown festival held each…", ["spring", "winter", "fall", "summer"], "spring", 1),
      q("At the 2020 census, Temple's population was closest to…", ["32,000", "52,000", "82,000", "132,000"], "82,000", 2),
      q("Temple's railroad museum first opened in a 1907 wooden depot moved from which nearby town?", ["Moody", "Belton", "Rogers", "Troy"], "Moody", 3),
      q("Dr. Arthur Carroll Scott came to Temple in 1892 to be chief surgeon of the…", ["Santa Fe railroad hospital", "Fort Hood post hospital", "Baylor medical school", "Texas state asylum"], "Santa Fe railroad hospital", 2),
      q("Before moving to Temple, Dr. Arthur Carroll Scott practiced in which North Texas town?", ["Gainesville", "Denton", "Sherman", "Wichita Falls"], "Gainesville", 3),
      q("Temple Sanitarium took the name Scott and White Hospital in…", ["1897", "1922", "1949", "1983"], "1922", 3),
      q("In 2013, Temple's Scott & White merged with which Dallas-based system?", ["Baylor Health Care System", "Methodist Health System", "Texas Health Resources", "Parkland Health"], "Baylor Health Care System", 1),
      q("McLane Company was founded in 1894 as a grocery business in which town before moving to Temple?", ["Cameron", "Waco", "Killeen", "Taylor"], "Cameron", 3),
      q("McLane Company moved its headquarters to Temple in…", ["1894", "1931", "1966", "2003"], "1966", 3),
      q("Since 2003, Temple-based McLane Company has been owned by…", ["Walmart Stores", "Berkshire Hathaway", "Sysco Corporation", "Kroger Company"], "Berkshire Hathaway", 2),
      q("Wilsonart began in Temple in 1956 under which name?", ["Ralph Wilson Plastics", "Temple Laminate Works", "Formica Texas", "Central Texas Surfaces"], "Ralph Wilson Plastics", 3),
      q("Temple Bottling Company is known for Dr Pepper sweetened with…", ["cane sugar", "corn syrup", "honey", "stevia"], "cane sugar", 1),
      q("Temple's civic and convention center is named for newspaper publisher…", ["Frank W. Mayborn", "Drayton McLane", "Arthur Scott", "Olin Teague"], "Frank W. Mayborn", 2),
      q("Forrest Fenn's hidden treasure chest was finally found in 2020 in which state?", ["Wyoming", "New Mexico", "Colorado", "Montana"], "Wyoming", 2),
      q("The Czech fraternal society SPJST moved its home office to Temple in…", ["1897", "1922", "1952", "1980"], "1952", 3),
      q("SPJST, headquartered in Temple, was founded in the 1890s in which Czech Texas town?", ["La Grange", "West", "Schulenburg", "Praha"], "La Grange", 3),
    ],
    history: [
      q("Temple's Santa Fe depot served the Santa Fe railroad until…", ["1955", "1971", "1989", "2005"], "1989", 3),
      q("Temple's Harvey House restaurant beside the depot opened in…", ["1881", "1899", "1925", "1946"], "1899", 3),
      q("The waitresses who worked at Temple's Harvey House were known as…", ["Harvey Girls", "Santa Fe Sisters", "Depot Belles", "Pullman Maids"], "Harvey Girls", 1),
      q("Temple's Harvey House closed during which hard era?", ["the Civil War", "the Great Depression", "World War I", "the 1970s oil boom"], "the Great Depression", 2),
      q("In 1911 the Santa Fe and Fred Harvey opened which farm near Temple to supply their dining service?", ["Peach Tree Dairy Farm", "Blackland Orchard", "Leon River Ranch", "Harvey Pecan Grove"], "Peach Tree Dairy Farm", 3),
      q("Redwood beams for Temple's Santa Fe depot were shipped in from the…", ["Pacific Northwest", "Piney Woods of East Texas", "Ozark Mountains", "Great Lakes"], "Pacific Northwest", 3),
      q("Jarvis Hunt's Temple depot blends Beaux Arts and Spanish revival with which Midwestern style?", ["Prairie style", "Art Deco", "Brutalism", "Queen Anne"], "Prairie style", 3),
      q("After buying the line that founded Temple, the Atchison, Topeka & Santa Fe made Temple its…", ["southern division headquarters", "national headquarters", "main locomotive factory", "westernmost terminal"], "southern division headquarters", 2),
      q("The Gulf, Colorado and Santa Fe, the railroad that founded Temple, was based in which port city?", ["Galveston", "Corpus Christi", "Houston", "Beaumont"], "Galveston", 2),
      q("The Gulf, Colorado and Santa Fe was bought in 1886 by the…", ["Atchison, Topeka and Santa Fe", "Southern Pacific Railroad", "Texas and Pacific Railway", "Missouri Pacific Railroad"], "Atchison, Topeka and Santa Fe", 2),
      q("Bernard Moore Temple first worked on the Gulf, Colorado and Santa Fe as assistant to which former Confederate general?", ["Braxton Bragg", "James Longstreet", "John Bell Hood", "Jubal Early"], "Braxton Bragg", 3),
      q("From 1905 to 1923, Temple and Belton were linked by an…", ["interurban rail line", "aerial tramway", "canal barge route", "stagecoach turnpike"], "interurban rail line", 2),
      q("Temple's VA center began in 1942 as which World War II Army hospital?", ["McCloskey General Hospital", "Brooke Army Hospital", "Walter Reed Annex", "Fort Hood Station Hospital"], "McCloskey General Hospital", 3),
      q("Steam locomotive No. 3423 at Temple's railroad museum is which wheel type?", ["4-4-0 American", "4-6-2 Pacific", "2-8-2 Mikado", "4-8-4 Northern"], "4-6-2 Pacific", 3),
      q("Temple's No. 3423 steam engine was built by which locomotive works?", ["Baldwin", "Lima", "ALCO", "Pullman"], "Baldwin", 2),
      q("Temple's railroad museum displays No. 2301, the oldest surviving diesel of which railroad?", ["Santa Fe", "Union Pacific", "Southern Pacific", "Katy"], "Santa Fe", 2),
    ],
    sports: [
      q("Temple High School's Wildcats won Texas football state titles in 1979 and…", ["1985", "1992", "2001", "2014"], "1992", 2),
      q("Which coach led Temple's Wildcats to both of their state football titles?", ["Bob McQueen", "Gordon Wood", "G.A. Moore", "Art Briles"], "Bob McQueen", 3),
      q("'Mean' Joe Greene played high-school football at Temple's…", ["Dunbar High School", "Killeen High School", "Waco High School", "Belton High School"], "Dunbar High School", 3),
      q("'Mean' Joe Greene of Temple played college football for…", ["North Texas", "Oklahoma State", "Arkansas", "Houston"], "North Texas", 2),
      q("Joe Greene's college team at North Texas is nicknamed the Mean…", ["Green", "Machine", "Streak", "Team"], "Green", 1),
      q("Temple-born quarterback Sammy Baugh was nicknamed…", ["Slingin' Sammy", "Sweet Sam", "Sammy the Arm", "Slammin' Sammy"], "Slingin' Sammy", 2),
      q("Temple-born Sammy Baugh played his college football at…", ["TCU", "SMU", "Baylor", "Texas"], "TCU", 3),
    ],
    arts: [
      q("Blind Willie Johnson, born near Temple, recorded 'Dark Was the Night, Cold Was the Ground,' which later flew into space aboard…", ["the Voyager Golden Record", "the Apollo 11 lander", "the Hubble telescope", "the Space Shuttle Columbia"], "the Voyager Golden Record", 2),
      q("Temple native Brian Floca won the 2014 Caldecott Medal for which picture book?", ["Locomotive", "Moonshot", "The Polar Express", "Hello Lighthouse"], "Locomotive", 3),
    ],
    celebrity: [
      q("Temple-born actor Rip Torn played Agent Zed in which film?", ["Men in Black", "Ghostbusters", "Galaxy Quest", "Independence Day"], "Men in Black", 1),
      q("Rip Torn of Temple won his Emmy playing producer Artie on…", ["The Larry Sanders Show", "Murphy Brown", "Everybody Loves Raymond", "The Drew Carey Show"], "The Larry Sanders Show", 3),
    ],
    nature: [
      q("Temple Lake Park, run by the City of Temple, sits on the shore of…", ["Belton Lake", "Lake Waco", "Lake Travis", "Lake Georgetown"], "Belton Lake", 1),
      q("Belton Dam, which holds back Belton Lake near Temple, is operated by the…", ["U.S. Army Corps of Engineers", "Lower Colorado River Authority", "Texas Parks and Wildlife", "City of Temple"], "U.S. Army Corps of Engineers", 2),
      q("Belton Dam's main structure was completed in…", ["1913", "1937", "1954", "1971"], "1954", 3),
      q("Belton Lake lies in the drainage basin of which big Texas river?", ["Brazos", "Colorado", "Trinity", "Red"], "Brazos", 2),
      q("Floods in 1991–92 poured over Belton Dam's spillway and carved new canyons at…", ["Miller Springs Nature Center", "Temple Lake Park beach", "Mother Neff State Park", "Stillhouse Hollow marina"], "Miller Springs Nature Center", 3),
    ],
    science: [
      q("Dr. Claudia Potter of Temple's Scott and White is remembered as a pioneer of…", ["anesthesiology", "heart surgery", "radiology", "pediatrics"], "anesthesiology", 2),
      q("Dr. Claudia Potter went to Johns Hopkins in 1908 to learn anesthesia with which gas?", ["nitrous oxide", "ether vapor", "chloroform", "xenon"], "nitrous oxide", 3),
      q("The SWAT watershed model, used worldwide, was developed by USDA scientists in…", ["Temple", "Ames", "Davis", "Beltsville"], "Temple", 3),
      q("Temple-born geneticist Mark Skolnick founded which company tied to the BRCA1 breast-cancer gene?", ["Myriad Genetics", "Genomic Health", "Applied Biosystems", "Illumina"], "Myriad Genetics", 3),
    ],
    political: [
      q("The Texas State Soil and Water Conservation Board has its headquarters in…", ["Temple", "Austin", "College Station", "Waco"], "Temple", 2),
    ],
  },
};
