import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Philadelphia Local slice 2 (Keyline 0.1.129): hard (diff 3) Local cards so Philly's red Local pool climbs past 30
 * for placed (Hearth) lanterns. City cards step up one rarity rung, so a hard city card bands red ~25% of the time.
 * No math. Each card sourced from the Wikipedia article on its subject (URL above each card), checked Nov 5 2026.
 * Spot-checked ≥25 cards against Wikipedia; Pennsylvania Hospital "nation's first" claim corrected (it was the second
 * public hospital after Bellevue). Merged into CITY_EXTRA by cities.ts.
 */
export const CITY_EXTRA_PART_L: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  philly: {
    local: [
		// https://en.wikipedia.org/wiki/Gloria_Dei_(Old_Swedes%27)_Church
		q("Gloria Dei (Old Swedes') Church is the oldest church in Pennsylvania still standing from which year?", ["1700", "1680", "1725", "1750"], "1700", 3),
		// https://en.wikipedia.org/wiki/Physick_House
		q("Which surgeon's home is the Physick House in Society Hill?", ["Caspar Wistar MD", "John Morgan MD", "Philip Syng Physick", "Benjamin Rush MD"], "Philip Syng Physick", 3),
		// https://en.wikipedia.org/wiki/Powel_House
		q("Which colonial mayor's home is the Powel House?", ["Edward Shippen", "Thomas Willing", "Samuel Powel", "James Hamilton"], "Samuel Powel", 3),
		// https://en.wikipedia.org/wiki/Cliveden_(Philadelphia)
		q("Cliveden in Germantown was the country seat of which family?", ["Logan", "Norris", "Chew", "Wistar"], "Chew", 3),
		// https://en.wikipedia.org/wiki/Stenton_(mansion)
		q("Who built Stenton mansion in Germantown?", ["James Logan", "William Penn", "John Dickinson", "Isaac Norris"], "James Logan", 3),
		// https://en.wikipedia.org/wiki/Deshler-Morris_House
		q("The Deshler-Morris House is also called the Germantown…", ["White House", "Summer House", "Manor House", "Brick House"], "White House", 3),
		// https://en.wikipedia.org/wiki/Laurel_Hill_Cemetery
		q("Who designed Laurel Hill Cemetery?", ["John Notman", "William Strickland", "Thomas U. Walter", "John Haviland"], "John Notman", 3),
		// https://en.wikipedia.org/wiki/Woodlands_Cemetery
		q("The Woodlands sits on the former estate of which botanist and lawyer?", ["Benjamin Rush", "Caspar Wistar", "John Bartram", "William Hamilton"], "William Hamilton", 3),
		// https://en.wikipedia.org/wiki/Fort_Mifflin
		q("Fort Mifflin sits on Mud Island in which river?", ["Susquehanna", "Hudson", "Delaware", "Schuylkill"], "Delaware", 3),
		// https://en.wikipedia.org/wiki/Bartram%27s_Garden
		q("Who founded Bartram's Garden, the oldest surviving botanical garden in North America?", ["Humphry Marshall", "John Bartram", "William Bartram", "André Michaux"], "John Bartram", 3),
		// https://en.wikipedia.org/wiki/Pennsylvania_Hospital
		q("Which two men founded Pennsylvania Hospital in 1751?", ["Benjamin Franklin and Thomas Bond", "William Penn and James Logan", "Benjamin Rush and John Morgan", "John Bartram and Caspar Wistar"], "Benjamin Franklin and Thomas Bond", 3),
		// https://en.wikipedia.org/wiki/Rodin_Museum
		q("Which collector gave Philadelphia its Rodin Museum?", ["Samuel Fleisher", "Joseph Widener", "Albert Barnes", "Jules Mastbaum"], "Jules Mastbaum", 3),
		// https://en.wikipedia.org/wiki/Pennsylvania_Academy_of_the_Fine_Arts
		q("Which architect designed the Pennsylvania Academy of the Fine Arts Furness building?", ["John Notman", "Thomas U. Walter", "Frank Furness", "William Strickland"], "Frank Furness", 3),
		// https://en.wikipedia.org/wiki/Curtis_Institute_of_Music
		q("Who founded the Curtis Institute of Music?", ["Samuel Curtis", "Mary Louise Curtis Bok", "Leopold Stokowski", "Eugene Ormandy"], "Mary Louise Curtis Bok", 3),
		// https://en.wikipedia.org/wiki/PSFS_Building
		q("The PSFS Building's rooftop letters stood for Philadelphia…", ["Steel Fabrication Shop", "Saving Fund Society", "Stock Floor System", "State Finance Service"], "Saving Fund Society", 3),
		// https://en.wikipedia.org/wiki/Comcast_Center
		q("Before the Comcast Technology Center, Comcast Center was Philadelphia's tallest at how many feet?", ["850", "1,121", "700", "975"], "975", 3),
		// https://en.wikipedia.org/wiki/Chinatown,_Philadelphia
		q("Philadelphia's Chinatown Friendship Gate spans which street?", ["Arch Street", "10th Street", "Vine Street", "Race Street"], "10th Street", 3),
		// https://en.wikipedia.org/wiki/Mother_Bethel_A.M.E._Church
		q("Who founded Mother Bethel A.M.E. Church?", ["Absalom Jones", "Richard Allen", "Daniel Coker", "Jarena Lee"], "Richard Allen", 3),
		// https://en.wikipedia.org/wiki/Edgar_Allan_Poe_National_Historic_Site
		q("While living in Philadelphia, Edgar Allan Poe published which detective story?", ["The Fall of the House of Usher", "Annabel Lee", "The Cask of Amontillado", "The Murders in the Rue Morgue"], "The Murders in the Rue Morgue", 3),
		// https://en.wikipedia.org/wiki/Academy_of_Natural_Sciences_of_Drexel_University
		q("The Academy of Natural Sciences is the oldest natural science research institution in the Americas, founded in…", ["1812", "1824", "1850", "1790"], "1812", 3),
		// https://en.wikipedia.org/wiki/Wagner_Free_Institute_of_Science
		q("Who founded the Wagner Free Institute of Science?", ["William Wagner", "Edward Drinker Cope", "Spencer Baird", "Joseph Leidy"], "William Wagner", 3),
		// https://en.wikipedia.org/wiki/Girard_College
		q("Who endowed Girard College for poor white orphan boys?", ["Nicholas Biddle", "Stephen Girard", "John Wanamaker", "Joshua Francis Fisher"], "Stephen Girard", 3),
		// https://en.wikipedia.org/wiki/First_Bank_of_the_United_States
		q("Who was the first president of the First Bank of the United States?", ["Alexander Hamilton", "Nicholas Biddle", "Thomas Willing", "Robert Morris"], "Thomas Willing", 3),
		// https://en.wikipedia.org/wiki/Second_Bank_of_the_United_States
		q("Which Greek Revival architect designed the Second Bank of the United States?", ["Benjamin Latrobe", "Robert Mills", "John Haviland", "William Strickland"], "William Strickland", 3),
		// https://en.wikipedia.org/wiki/Philadelphia_Mint
		q("The first U.S. Mint opened in Philadelphia in which year?", ["1792", "1800", "1789", "1776"], "1792", 3),
		// https://en.wikipedia.org/wiki/USS_Olympia_(C-6)
		q("The cruiser Olympia, preserved at Penn's Landing, was Dewey's flagship at which battle?", ["Manila Bay", "Santiago de Cuba", "Tsushima", "Jutland"], "Manila Bay", 3),
		// https://en.wikipedia.org/wiki/SS_United_States
		q("The SS United States, long laid up in Philadelphia, was designed by which naval architect?", ["William Cramp Jr.", "Donald McKay", "John Ericsson", "William Francis Gibbs"], "William Francis Gibbs", 3),
		// https://en.wikipedia.org/wiki/Franklin_Field
		q("Franklin Field is home to which Ivy League football team?", ["Princeton Tigers", "Penn Quakers", "Columbia Lions", "Cornell Big Red"], "Penn Quakers", 3),
		// https://en.wikipedia.org/wiki/Connie_Mack_Stadium
		q("Before Connie Mack Stadium, the Phillies' North Philadelphia ballpark was called…", ["Columbia Park", "Shibe Park", "Baker Bowl", "Veterans Stadium"], "Shibe Park", 3),
		// https://en.wikipedia.org/wiki/Baker_Bowl
		q("Baker Bowl, an early Phillies park, stood at Broad Street and…", ["Erie Avenue", "Lehigh Avenue", "Huntingdon Street", "Girard Avenue"], "Huntingdon Street", 3),
		// https://en.wikipedia.org/wiki/Veterans_Stadium
		q("Veterans Stadium opened in which year?", ["1955", "1981", "1964", "1971"], "1971", 3),
		// https://en.wikipedia.org/wiki/Citizens_Bank_Park
		q("Citizens Bank Park opened as the Phillies' home in which year?", ["1998", "2001", "2008", "2004"], "2004", 3),
		// https://en.wikipedia.org/wiki/Lincoln_Financial_Field
		q("Lincoln Financial Field opened for the Eagles in which year?", ["1998", "2003", "2001", "2006"], "2003", 3),
		// https://en.wikipedia.org/wiki/Broad_Street_Bullies
		q("The Broad Street Bullies nickname belonged to which 1970s hockey team?", ["Philadelphia Firebirds", "Philadelphia Flyers", "Philadelphia Blazers", "Philadelphia Quakers"], "Philadelphia Flyers", 3),
		// https://en.wikipedia.org/wiki/Wissahickon_Creek
		q("Forbidden Drive runs along which creek in Fairmount Park?", ["Tacony", "Wissahickon", "Pennypack", "Cobbs"], "Wissahickon", 3),
		// https://en.wikipedia.org/wiki/Benjamin_Franklin_Parkway
		q("The Benjamin Franklin Parkway was modeled partly on which Paris avenue?", ["Champs-Élysées", "Boulevard Haussmann", "Rue de Rivoli", "Avenue Foch"], "Champs-Élysées", 3),
		// https://en.wikipedia.org/wiki/Clothespin_(Oldenburg)
		q("Which sculptor's Clothespin stands at Centre Square near City Hall?", ["Isamu Noguchi", "Claes Oldenburg", "Alexander Calder", "Richard Serra"], "Claes Oldenburg", 3),
		// https://en.wikipedia.org/wiki/Kimmel_Center_for_the_Performing_Arts
		q("Who designed the Kimmel Center for the Performing Arts?", ["Louis Kahn", "Frank Gehry", "I. M. Pei", "Rafael Viñoly"], "Rafael Viñoly", 3),
		// https://en.wikipedia.org/wiki/Free_Library_of_Philadelphia
		q("The Free Library's Parkway Central building opened in which year?", ["1891", "1927", "1910", "1955"], "1927", 3),
		// https://en.wikipedia.org/wiki/Masonic_Temple_(Philadelphia)
		q("The Masonic Temple across from City Hall was designed by…", ["Frank Furness", "Thomas U. Walter", "John McArthur Jr.", "James H. Windrim"], "James H. Windrim", 3),
		// https://en.wikipedia.org/wiki/Betsy_Ross_House
		q("The Betsy Ross House stands on which Old City street?", ["Front Street", "Arch Street", "Race Street", "Elfreth's Alley"], "Arch Street", 3),
		// https://en.wikipedia.org/wiki/Washington_Square_(Philadelphia)
		q("Washington Square was originally one of Penn's five…", ["squares", "wards", "commons", "markets"], "squares", 3),
		// https://en.wikipedia.org/wiki/Penn%27s_Landing
		q("Penn's Landing stretches along which waterfront?", ["Cooper River", "Schuylkill River", "Delaware River", "Pennypack Creek"], "Delaware River", 3),
		// https://en.wikipedia.org/wiki/Please_Touch_Museum
		q("The Please Touch Museum now occupies which Centennial Exposition building?", ["Machinery Hall", "Main Exhibition Building", "Horticultural Hall", "Memorial Hall"], "Memorial Hall", 3),
		// https://en.wikipedia.org/wiki/Memorial_Hall_(Philadelphia)
		q("Memorial Hall was built for which 1876 event?", ["World's Fair of 1926", "Bicentennial", "Sesquicentennial", "Centennial Exposition"], "Centennial Exposition", 3),
		// https://en.wikipedia.org/wiki/Smith_Memorial_Arch
		q("Smith Memorial Arch stands at the entrance to which parkway approach?", ["West Fairmount Park", "Roosevelt Boulevard", "Kelly Drive", "Benjamin Franklin Parkway"], "West Fairmount Park", 3),
		// https://en.wikipedia.org/wiki/Lemon_Hill
		q("Lemon Hill mansion in Fairmount Park was built by…", ["William Hamilton", "John Penn", "Henry Pratt", "Robert Morris"], "Henry Pratt", 3),
		// https://en.wikipedia.org/wiki/Belmont_Mansion_(Philadelphia)
		q("Belmont Mansion in Fairmount Park was a country seat of which family?", ["Chew", "Logan", "Powel", "Peters"], "Peters", 3),
		// https://en.wikipedia.org/wiki/John_Coltrane_House
		q("John Coltrane's Philadelphia house is a National Historic Landmark in which neighborhood?", ["Germantown", "North Philadelphia", "West Oak Lane", "Strawberry Mansion"], "Strawberry Mansion", 3),
		// https://en.wikipedia.org/wiki/MOVE_(Philadelphia_organization)
		q("The 1985 MOVE bombing destroyed homes on which West Philadelphia street?", ["Osage Avenue", "Girard Avenue", "Pine Street", "Lancaster Avenue"], "Osage Avenue", 3),
		// https://en.wikipedia.org/wiki/Yellow_Fever_Epidemic_of_1793
		q("The 1793 yellow fever epidemic killed roughly how many Philadelphians?", ["1,000", "5,000", "15,000", "500"], "5,000", 3),
		// https://en.wikipedia.org/wiki/Centennial_Exposition
		q("The 1876 Centennial Exposition was held in which park?", ["Franklin Square", "League Island Park", "Penn's Landing", "Fairmount Park"], "Fairmount Park", 3),
		// https://en.wikipedia.org/wiki/Sesquicentennial_Exposition
		q("Philadelphia's Sesquicentennial Exposition took place in which year?", ["1876", "1926", "1915", "1976"], "1926", 3),
		// https://en.wikipedia.org/wiki/Society_Hill,_Philadelphia
		q("Society Hill is named for the 18th-century Free…", ["Society of Artists", "Society of Traders", "Society of Friends", "Society of Surgeons"], "Society of Traders", 3),
		// https://en.wikipedia.org/wiki/Independence_Seaport_Museum
		q("The Independence Seaport Museum stands at…", ["Boathouse Row", "Bartram's Garden", "Navy Yard", "Penn's Landing"], "Penn's Landing", 3),
		// https://en.wikipedia.org/wiki/Rosenbach_Museum_%26_Library
		q("The Rosenbach Museum holds a manuscript of which Joyce novel?", ["Ulysses", "Dubliners", "Finnegans Wake", "A Portrait"], "Ulysses", 3),
		// https://en.wikipedia.org/wiki/Athenaeum_of_Philadelphia
		q("The Athenaeum of Philadelphia is a member library on which square?", ["Rittenhouse Square", "Logan Square", "Washington Square", "Franklin Square"], "Washington Square", 3),
		// https://en.wikipedia.org/wiki/Library_Company_of_Philadelphia
		q("Who founded the Library Company of Philadelphia?", ["James Logan", "William Penn", "Benjamin Franklin", "David Rittenhouse"], "Benjamin Franklin", 3),
		// https://en.wikipedia.org/wiki/American_Philosophical_Society
		q("Who founded the American Philosophical Society?", ["Thomas Jefferson", "John Adams", "Benjamin Franklin", "Joseph Priestley"], "Benjamin Franklin", 3),
		// https://en.wikipedia.org/wiki/Old_St._Joseph%27s_Church
		q("Old St. Joseph's, founded in 1733, was Philadelphia's first…", ["Roman Catholic church", "Quaker meeting house", "Episcopal parish church", "Lutheran church"], "Roman Catholic church", 3),
		// https://en.wikipedia.org/wiki/Philadelphia_Navy_Yard
		q("The Philadelphia Navy Yard is also known as the…", ["Hog Island Yard", "Cramp Dry Dock", "League Island Arsenal", "Philadelphia Naval Shipyard"], "Philadelphia Naval Shipyard", 3),
		// https://en.wikipedia.org/wiki/Hog_Island,_Philadelphia
		q("Hog Island was a World War I shipyard that helped give rise to the word…", ["water ice", "jawn", "hoagie", "scrapple"], "hoagie", 3),
		// https://en.wikipedia.org/wiki/Temple_University
		q("Who founded Philadelphia's Temple University?", ["Russell Conwell", "William Temple", "John Wanamaker", "Stephen Girard"], "Russell Conwell", 3),
		// https://en.wikipedia.org/wiki/Drexel_University
		q("Drexel University was founded by financier…", ["Nicholas Biddle", "Anthony J. Drexel", "Joseph Wharton", "Jay Cooke"], "Anthony J. Drexel", 3),
		// https://en.wikipedia.org/wiki/Wills_Eye_Hospital
		q("Wills Eye Hospital is renowned for which medical specialty?", ["orthopedics", "ophthalmology", "neurology", "cardiology"], "ophthalmology", 3),
		// https://en.wikipedia.org/wiki/Jefferson_Hospital
		q("Thomas Jefferson University's hospital roots go back to…", ["Pennsylvania Hospital", "Hahnemann Hospital", "Jefferson Medical College", "Wills Eye"], "Jefferson Medical College", 3),
		// https://en.wikipedia.org/wiki/Route_15_(SEPTA)
		q("SEPTA Route 15 is a restored…", ["subway", "busway", "regional rail", "trolley"], "trolley", 3),
		// https://en.wikipedia.org/wiki/Pennsylvania_Convention_Center
		q("The Pennsylvania Convention Center opened in which year?", ["1985", "2001", "1993", "1976"], "1993", 3),
		// https://en.wikipedia.org/wiki/Dilworth_Park
		q("Dilworth Park sits on the west side of…", ["30th Street Station", "Philadelphia City Hall", "Love Park", "Independence Hall"], "Philadelphia City Hall", 3),
		// https://en.wikipedia.org/wiki/Avenue_of_the_Arts
		q("Philadelphia's Avenue of the Arts runs mainly along…", ["Chestnut Street", "Broad Street", "Market Street", "Walnut Street"], "Broad Street", 3),
		// https://en.wikipedia.org/wiki/Forrest_Theatre
		q("The Forrest Theatre is named for which 19th-century actor?", ["Edwin Forrest", "Edwin Booth", "Junius Brutus Booth", "Joseph Jefferson"], "Edwin Forrest", 3),
		// https://en.wikipedia.org/wiki/Suzanne_Roberts_Theatre
		q("The Suzanne Roberts Theatre houses which company?", ["Philadelphia Theatre Company", "Arden Theatre Company", "Lantern Theater Company", "Wilma Theater Company"], "Philadelphia Theatre Company", 3),
		// https://en.wikipedia.org/wiki/Philadelphia_High_School_for_the_Creative_and_Performing_Arts
		q("CAPA's full name is the Philadelphia High School for the Creative and…", ["Practical Arts", "Progressive Arts", "Public Arts", "Performing Arts"], "Performing Arts", 3),
		// https://en.wikipedia.org/wiki/Stephen_Girard
		q("Stephen Girard bequeathed his fortune largely to…", ["Pennsylvania Hospital", "the Free Library", "Girard College", "the University of Pennsylvania"], "Girard College", 3),
		// https://en.wikipedia.org/wiki/Caspar_Wistar_(physician)
		q("Caspar Wistar's name lives on in which Philadelphia scientific institution?", ["Wistar Museum", "Wistar Observatory", "Wistar College", "Wistar Institute"], "Wistar Institute", 3),
		// https://en.wikipedia.org/wiki/Wistar_Institute
		q("The Wistar Institute is a biomedical research center affiliated historically with…", ["Jefferson University of Phila.", "Temple University of Phila.", "the University of Pennsylvania", "Drexel University of Phila."], "the University of Pennsylvania", 3),
		// https://en.wikipedia.org/wiki/Thomas_Eakins
		q("Thomas Eakins painted 'The Gross Clinic' about a surgeon at…", ["Wills Eye", "Jefferson Medical College", "Pennsylvania Hospital", "Hahnemann"], "Jefferson Medical College", 3),
		// https://en.wikipedia.org/wiki/The_Agnew_Clinic
		q("Thomas Eakins's 'The Agnew Clinic' hangs at which university?", ["Princeton University", "Drexel University", "University of Pennsylvania", "Temple University"], "University of Pennsylvania", 3),
		// https://en.wikipedia.org/wiki/Alexander_Calder
		q("Alexander Calder, of the mobile fame, came from a Philadelphia family of…", ["bankers", "shipbuilders", "sculptors", "physicians"], "sculptors", 3),
		// https://en.wikipedia.org/wiki/Edgar_Allan_Poe
		q("While living in Philadelphia, Poe edited which magazine?", ["Graham's Magazine", "The Saturday Evening Post", "Godey's Lady's Book", "The Atlantic"], "Graham's Magazine", 3),
		// https://en.wikipedia.org/wiki/Geno%27s_Steaks
		q("Geno's stands at the corner of 9th Street and…", ["Passyunk Avenue", "South Street", "Washington Avenue", "Christian Street"], "Passyunk Avenue", 3),
		// https://en.wikipedia.org/wiki/Morris_Arboretum
		q("Morris Arboretum is the official arboretum of…", ["the University of Pennsylvania", "Temple University", "Drexel University", "the city parks dept alone"], "the University of Pennsylvania", 3),
		// https://en.wikipedia.org/wiki/Cobbs_Creek
		q("Cobbs Creek Park follows a creek that forms part of the border with…", ["Bucks County", "Delaware County", "Montgomery only", "New Jersey"], "Delaware County", 3),
		// https://en.wikipedia.org/wiki/Pennypack_Park
		q("Pennypack Park stretches through which section of the city?", ["South Philadelphia", "Northeast Philadelphia", "Northwest Philadelphia", "Southwest Philadelphia"], "Northeast Philadelphia", 3),
		// https://en.wikipedia.org/wiki/FDR_Park
		q("FDR Park in South Philadelphia was formerly…", ["League Island Navy Yard", "Passyunk Park", "Hog Island Park", "League Island Park"], "League Island Park", 3),
		// https://en.wikipedia.org/wiki/John_Heinz_National_Wildlife_Refuge_at_Tinicum
		q("The Heinz wildlife refuge at Tinicum protects…", ["tidal marsh", "mountain forest", "desert scrub", "prairie"], "tidal marsh", 3),
		// https://en.wikipedia.org/wiki/Alexander_Milne_Calder
		q("Alexander Milne Calder's son and grandson were also…", ["architects", "painters only", "mayors", "sculptors"], "sculptors", 3),
		// https://en.wikipedia.org/wiki/Carpenters%27_Hall
		q("Carpenters' Hall was built by the Carpenters'…", ["Union", "Guild", "Company", "Society of Joiners"], "Company", 3),
		// https://en.wikipedia.org/wiki/Philosophical_Hall
		q("Philosophical Hall is home to the…", ["Library Company of Phila.", "Athenaeum of Phila.", "Wistar Institute", "American Philosophical Society"], "American Philosophical Society", 3),
		// https://en.wikipedia.org/wiki/Ebenezer_Maxwell_Mansion
		q("The Ebenezer Maxwell Mansion is a Victorian house museum in…", ["Queen Village", "Society Hill", "Chestnut Hill", "Germantown"], "Germantown", 3),
		// https://en.wikipedia.org/wiki/Germantown_White_House
		q("The Germantown White House is another name for the…", ["Wyck House museum", "Cliveden mansion", "Deshler-Morris House", "Stenton mansion"], "Deshler-Morris House", 3),
		// https://en.wikipedia.org/wiki/Battle_of_Germantown
		q("The Battle of Germantown was fought in which year?", ["1781", "1777", "1778", "1776"], "1777", 3),
		// https://en.wikipedia.org/wiki/Philadelphia_campaign
		q("The British occupied Philadelphia after winning which battle?", ["Brandywine", "Trenton", "Princeton", "Saratoga"], "Brandywine", 3),
		// https://en.wikipedia.org/wiki/Richard_Allen_(bishop)
		q("Richard Allen founded which denomination?", ["Church of God in Christ", "African Methodist Episcopal Church", "National Baptist Convention", "AME Zion only"], "African Methodist Episcopal Church", 3),
		// https://en.wikipedia.org/wiki/Philadelphia_Female_Anti-Slavery_Society
		q("The Philadelphia Female Anti-Slavery Society was founded with help from…", ["Susan B. Anthony", "Elizabeth Cady Stanton", "Lucretia Mott", "Sojourner Truth"], "Lucretia Mott", 3),
		// https://en.wikipedia.org/wiki/Lucretia_Mott
		q("Lucretia Mott was a Philadelphia…", ["Catholic nun", "Methodist preacher", "Unitarian minister only", "Quaker abolitionist"], "Quaker abolitionist", 3),
		// https://en.wikipedia.org/wiki/William_Still
		q("William Still was called the Father of the…", ["Reading Railroad", "Union League", "Underground Railroad", "Pennsylvania Railroad"], "Underground Railroad", 3),
		// https://en.wikipedia.org/wiki/Cliveden_(Philadelphia)
		q("Which Revolutionary War battle was fought around Cliveden?", ["Battle of White Marsh", "Battle of Brandywine", "Battle of Germantown", "Battle of Paoli"], "Battle of Germantown", 3),
		// https://en.wikipedia.org/wiki/Wanamaker_Organ
		q("How many pipes does the Wanamaker Organ have in its current configuration?", ["1,003", "28,762", "12,000", "5,416"], "28,762", 3),
		// https://en.wikipedia.org/wiki/Spectrum_(arena)
		q("From 1967 to 1996, the Spectrum was home arena for the Flyers and the…", ["Philadelphia 76ers", "Philadelphia Wings", "Philadelphia Phillies", "Philadelphia Eagles"], "Philadelphia 76ers", 3),
		// https://en.wikipedia.org/wiki/Congress_Hall
		q("While Congress met in Congress Hall, Philadelphia served as the…", ["Pennsylvania state capital only", "British headquarters", "capital of the United States", "Navy Department seat"], "capital of the United States", 3),
		// https://en.wikipedia.org/wiki/Old_City_Hall_(Philadelphia)
		q("Old City Hall next to Independence Hall housed the…", ["First Bank board of Phila.", "U.S. Mint building of Phila.", "Supreme Court of the United States", "Continental Army HQ of Phila."], "Supreme Court of the United States", 3),
		// https://en.wikipedia.org/wiki/Octavius_Catto
		q("Octavius Catto was shot and killed in Philadelphia on…", ["July Fourth", "Memorial Day", "New Year's Day", "election-day"], "election-day", 3),
		// https://en.wikipedia.org/wiki/Absalom_Jones
		q("In 1802 Absalom Jones became the first African American ordained as a priest in the…", ["Baptist Church", "Episcopal Church", "Methodist Church", "Catholic Church"], "Episcopal Church", 3),
		// https://en.wikipedia.org/wiki/Union_League_of_Philadelphia
		q("The Union League of Philadelphia was founded in 1862 as a patriotic society to support…", ["James Buchanan", "Abraham Lincoln", "Andrew Johnson", "Jefferson Davis"], "Abraham Lincoln", 3),
		// https://en.wikipedia.org/wiki/Wyck_House
		q("Documentary records at the Wyck House span how many generations of one family?", ["nine", "three", "five", "twelve"], "nine", 3),
		// https://en.wikipedia.org/wiki/Swann_Memorial_Fountain
		q("Calder's Native American figures at the Swann Fountain symbolize the Delaware, Schuylkill, and…", ["Tacony", "Cobbs Creek", "Wissahickon", "Pennypack"], "Wissahickon", 3),
		// https://en.wikipedia.org/wiki/Moore_College_of_Art_and_Design
		q("Moore College of Art & Design began in 1848 as the Philadelphia School of Design for…", ["Sailors", "Children", "Men", "Women"], "Women", 3),
		// https://en.wikipedia.org/wiki/The_Gross_Clinic
		q("Thomas Eakins's 'The Gross Clinic' is jointly held by the Philadelphia Museum of Art and the…", ["Barnes Foundation museum", "Whitney Museum of Art", "Pennsylvania Academy of Fine Arts", "Rodin Museum collection"], "Pennsylvania Academy of Fine Arts", 3),
		// https://en.wikipedia.org/wiki/David_Rittenhouse
		q("David Rittenhouse was a Philadelphia astronomer and…", ["novelist", "shipbuilder", "clockmaker", "painter"], "clockmaker", 3),
		// https://en.wikipedia.org/wiki/Germantown,_Philadelphia
		q("Germantown was founded in 1683 by settlers led by…", ["William Penn", "Franz Pastorius", "David Rittenhouse", "James Logan"], "Franz Pastorius", 3),
		// https://en.wikipedia.org/wiki/Thaddeus_Kosciuszko_National_Memorial
		q("Thaddeus Kosciuszko National Memorial is America's smallest unit of the…", ["National Historic Landmark list", "National Wildlife Refuge System", "National Park System", "National Forest System"], "National Park System", 3),
		// https://en.wikipedia.org/wiki/South_Street_(Philadelphia)
		q("In William Penn's grid, South Street was originally named…", ["Pine Street", "Cypress Street", "Spruce Street", "Cedar Street"], "Cedar Street", 3),
		// https://en.wikipedia.org/wiki/Schuylkill_River
		q("The Schuylkill's name comes from Dutch words meaning to hide and…", ["bridge", "mountain", "stream", "valley"], "stream", 3),
		// https://en.wikipedia.org/wiki/Arch_Street_Friends_Meeting_House
		q("The Arch Street Meeting House was built for the Religious Society of…", ["Methodists", "Friends", "Brethren", "Moravians"], "Friends", 3),
		// https://en.wikipedia.org/wiki/Strawberry_Mansion
		q("Strawberry Mansion stands in which park?", ["Pennypack Park", "Fairmount Park", "Cobbs Creek Park", "FDR Park"], "Fairmount Park", 3),
		// https://en.wikipedia.org/wiki/Congregation_Mikveh_Israel
		q("Congregation Mikveh Israel is described as the longest-running synagogue in the…", ["Western Hemisphere", "United States", "Commonwealth", "British Isles"], "United States", 3),
		// https://en.wikipedia.org/wiki/Gloria_Dei_(Old_Swedes%27)_Church
		q("Gloria Dei Church is also known by which Swedish nickname?", ["New Swedes'", "Old Swedes'", "River Chapel", "North Church"], "Old Swedes'", 3),
		// https://en.wikipedia.org/wiki/Physick_House
		q("The Physick House stands on which Society Hill street?", ["Pine Street", "Cypress Street", "Fourth Street", "Second Street"], "Fourth Street", 3),
		// https://en.wikipedia.org/wiki/Stenton_(mansion)
		q("Stenton was the country home of Penn's secretary…", ["James Logan", "David Lloyd", "Isaac Norris", "Andrew Hamilton"], "James Logan", 3),
		// https://en.wikipedia.org/wiki/Deshler-Morris_House
		q("The Deshler-Morris House is part of which NPS park?", ["Independence National Historical Park", "Gettysburg National Park of Phila.", "Hopewell Furnace site of Phila.", "Valley Forge National Park of Phila."], "Independence National Historical Park", 3),
		// https://en.wikipedia.org/wiki/Laurel_Hill_Cemetery
		q("Laurel Hill Cemetery overlooks which river?", ["Delaware", "Schuylkill", "Pennypack", "Wissahickon"], "Schuylkill", 3),
		// https://en.wikipedia.org/wiki/Fort_Mifflin
		q("During the Revolution, Fort Mifflin was also called Fort…", ["Island", "Penn", "Union", "Mud"], "Island", 3),
		// https://en.wikipedia.org/wiki/Bartram%27s_Garden
		q("Bartram's Garden lies along which river in Southwest Philadelphia?", ["Wissahickon", "Schuylkill", "Cobbs Creek", "Delaware"], "Schuylkill", 3),
		// https://en.wikipedia.org/wiki/Pennsylvania_Hospital
		q("In what year did Pennsylvania Hospital receive its charter?", ["1740", "1751", "1765", "1776"], "1751", 3),
		// https://en.wikipedia.org/wiki/Laurel_Hill_Cemetery
		q("In what year was Laurel Hill Cemetery founded?", ["1836", "1855", "1790", "1810"], "1836", 3),
		// https://en.wikipedia.org/wiki/Pennsylvania_Academy_of_the_Fine_Arts
		q("In what year was the Pennsylvania Academy of the Fine Arts founded?", ["1805", "1856", "1824", "1791"], "1805", 3),
		// https://en.wikipedia.org/wiki/PSFS_Building
		q("Which modernist firm designed the PSFS Building?", ["Kahn and Jacobs", "Pei Cobb Freed", "Howe and Lescaze", "Venturi Scott Brown"], "Howe and Lescaze", 3),
		// https://en.wikipedia.org/wiki/Mother_Bethel_A.M.E._Church
		q("Mother Bethel sits on the oldest parcel of land continuously owned by African Americans in the United States, bought in…", ["1794", "1816", "1808", "1776"], "1794", 3),
		// https://en.wikipedia.org/wiki/Philadelphia_Zoo
		q("In what year did the Philadelphia Zoo open to the public?", ["1893", "1859", "1874", "1824"], "1874", 3),
    ],
  },
};
