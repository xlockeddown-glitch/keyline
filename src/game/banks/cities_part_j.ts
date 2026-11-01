import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Red-tier Local fill (Keyline 0.1.101 batch 3; ~25% of hard city cards derive red): hard (diff 3) Local cards so every city reaches 30 red Local cards
 * for placed (Hearth) lanterns. Reason: Local was the only field under 30 red in all 15 cities (poolCensus, main b12a0e8).
 * No math (math is capped). Each card is sourced from the Wikipedia article on its subject (URL above each card).
 * Merged into CITY_EXTRA by cities.ts (rarity stamped there with the city nudge).
 */
export const CITY_EXTRA_PART_J: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  nyc: {
    local: [
      // https://en.wikipedia.org/wiki/Green-Wood_Cemetery
      q("NYC's Green-Wood Cemetery was founded in what year?", ["1838", "1863", "1821", "1852"], "1838", 3),
      // https://en.wikipedia.org/wiki/Green-Wood_Cemetery
      q("Who drew the landscape design for NYC's Green-Wood Cemetery?", ["David Bates Douglass", "Frederick Law Olmsted", "Calvert Vaux Jr.", "Andrew Jackson Downing"], "David Bates Douglass", 3),
      // https://en.wikipedia.org/wiki/Green-Wood_Cemetery
      q("NYC's Green-Wood Cemetery sits on which glacial moraine?", ["Harbor Hill Moraine", "Ronkonkoma Moraine", "Brooklyn Heights Ridge", "Fort Hamilton Moraine"], "Harbor Hill Moraine", 3),
      // https://en.wikipedia.org/wiki/Woodlawn_Cemetery_(Bronx)
      q("NYC's Woodlawn Cemetery in the Bronx opened in what year?", ["1863", "1838", "1881", "1849"], "1863", 3),
      // https://en.wikipedia.org/wiki/Woodlawn_Cemetery_(Bronx)
      q("When it opened, NYC's Woodlawn Cemetery lay in which town?", ["Yonkers", "Mount Vernon", "New Rochelle", "White Plains"], "Yonkers", 3),
      // https://en.wikipedia.org/wiki/Trinity_Church_Cemetery
      q("Trinity Churchyard in Lower Manhattan lies at 74 Trinity…", ["Place", "Street", "Lane", "Square"], "Place", 3),
      // https://en.wikipedia.org/wiki/African_Burial_Ground_National_Monument
      q("Manhattan's African Burial Ground stands at Duane Street and which street?", ["Elk Street", "Reade Street", "Centre Street", "Pearl Street"], "Elk Street", 3),
      // https://en.wikipedia.org/wiki/Morris–Jumel_Mansion
      q("Manhattan's oldest house, the Morris–Jumel Mansion, was built in…", ["1765", "1783", "1748", "1799"], "1765", 3),
      // https://en.wikipedia.org/wiki/Morris–Jumel_Mansion
      q("Who built Manhattan's Morris–Jumel Mansion?", ["Roger Morris", "Lewis Morris", "Gouverneur Morris", "Robert Morris"], "Roger Morris", 3),
      // https://en.wikipedia.org/wiki/Morris–Jumel_Mansion
      q("Manhattan's Morris–Jumel Mansion stands in which neighborhood?", ["Washington Heights", "Inwood", "Hamilton Heights", "Morningside Heights"], "Washington Heights", 3),
      // https://en.wikipedia.org/wiki/Merchant%27s_House_Museum
      q("Manhattan's Merchant's House Museum was built by which hatter?", ["Joseph Brewster", "Seabury Tredwell", "John Jacob Astor", "Peter Cooper"], "Joseph Brewster", 3),
      // https://en.wikipedia.org/wiki/Merchant%27s_House_Museum
      q("Manhattan's Merchant's House Museum is in which neighborhood?", ["NoHo", "SoHo", "Nolita", "Tribeca"], "NoHo", 3),
      // https://en.wikipedia.org/wiki/Gracie_Mansion
      q("NYC's Gracie Mansion was built in what year?", ["1799", "1812", "1783", "1827"], "1799", 3),
      // https://en.wikipedia.org/wiki/Gracie_Mansion
      q("NYC's Gracie Mansion sits in which park?", ["Carl Schurz Park", "John Jay Park", "Riverside Park", "Marcus Garvey Park"], "Carl Schurz Park", 3),
      // https://en.wikipedia.org/wiki/Gracie_Mansion
      q("NYC's Gracie Mansion overlooks which East River strait?", ["Hell Gate", "Spuyten Duyvil", "Buttermilk Channel", "The Narrows"], "Hell Gate", 3),
      // https://en.wikipedia.org/wiki/Wyckoff_House
      q("NYC's Wyckoff House stands in which Brooklyn neighborhood?", ["East Flatbush", "Bedford-Stuyvesant", "Sheepshead Bay", "Prospect Heights"], "East Flatbush", 3),
      // https://en.wikipedia.org/wiki/Wyckoff_House
      q("Which New Netherland director bought the Wyckoff House land in NYC?", ["Wouter van Twiller", "Peter Stuyvesant", "Willem Kieft", "Peter Minuit"], "Wouter van Twiller", 3),
      // https://en.wikipedia.org/wiki/Lefferts_Historic_House
      q("NYC's Lefferts Historic House stands inside which park?", ["Prospect Park", "Fort Greene Park", "Marine Park", "McCarren Park"], "Prospect Park", 3),
      // https://en.wikipedia.org/wiki/Alice_Austen_House
      q("Photographer Alice Austen's NYC home is also known as…", ["Clear Comfort", "Fair Haven", "Calm Harbor", "Still Water"], "Clear Comfort", 3),
      // https://en.wikipedia.org/wiki/Little_Red_Lighthouse
      q("Manhattan's Little Red Lighthouse is officially named…", ["Jeffrey's Hook Light", "Fort Washington Light", "Spuyten Duyvil Light", "Inwood Point Light"], "Jeffrey's Hook Light", 3),
      // https://en.wikipedia.org/wiki/Little_Red_Lighthouse
      q("Who wrote the 1942 book about Manhattan's Little Red Lighthouse?", ["Hildegarde Swift", "Margaret Wise Brown", "Virginia Lee Burton", "Lynd Ward Jr."], "Hildegarde Swift", 3),
      // https://en.wikipedia.org/wiki/Fraunces_Tavern
      q("Manhattan's Fraunces Tavern stands at the corner of Pearl and…", ["Broad Streets", "Water Streets", "Wall Streets", "Stone Streets"], "Broad Streets", 3),
      // https://en.wikipedia.org/wiki/Neue_Galerie_New_York
      q("Manhattan's Neue Galerie is housed in which mansion?", ["William Starr Miller House", "Henry Clay Frick House", "James B. Duke House", "Andrew Carnegie House"], "William Starr Miller House", 3),
      // https://en.wikipedia.org/wiki/Neue_Galerie_New_York
      q("Manhattan's Neue Galerie was established in what year?", ["2001", "1989", "2011", "1995"], "2001", 3),
      // https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum
      q("Manhattan's Morgan Library was completed in what year?", ["1906", "1924", "1898", "1913"], "1906", 3),
      // https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum
      q("Manhattan's Morgan Library is in which neighborhood?", ["Murray Hill", "Kips Bay", "Gramercy Park", "Turtle Bay"], "Murray Hill", 3),
      // https://en.wikipedia.org/wiki/Frick_Collection
      q("Manhattan's Frick Collection was established in what year?", ["1935", "1919", "1948", "1927"], "1935", 3),
      // https://en.wikipedia.org/wiki/Noguchi_Museum
      q("NYC's Noguchi Museum is in which Queens neighborhood?", ["Long Island City", "Astoria", "Sunnyside", "Jackson Heights"], "Long Island City", 3),
      // https://en.wikipedia.org/wiki/Noguchi_Museum
      q("NYC's Noguchi Museum stands on which boulevard?", ["Vernon Boulevard", "Queens Boulevard", "Northern Boulevard", "Woodhaven Boulevard"], "Vernon Boulevard", 3),
      // https://en.wikipedia.org/wiki/Museum_of_the_Moving_Image
      q("NYC's Museum of the Moving Image occupies part of which studio lot?", ["Kaufman Astoria Studios", "Silvercup Studios", "Steiner Studios", "Biograph Studios"], "Kaufman Astoria Studios", 3),
      // https://en.wikipedia.org/wiki/Museum_of_the_Moving_Image
      q("NYC's Museum of the Moving Image first opened in what year?", ["1988", "1976", "1996", "1981"], "1988", 3),
      // https://en.wikipedia.org/wiki/New_York_Transit_Museum
      q("NYC's Transit Museum sits in which decommissioned subway station?", ["Court Street", "Myrtle Avenue", "City Hall Loop", "Worth Street"], "Court Street", 3),
      // https://en.wikipedia.org/wiki/Woolworth_Building
      q("Who designed Manhattan's Woolworth Building?", ["Cass Gilbert", "Ernest Flagg", "Daniel Burnham", "Cyrus Eidlitz"], "Cass Gilbert", 3),
      // https://en.wikipedia.org/wiki/Woolworth_Building
      q("Manhattan's Woolworth Building stands at which Broadway address?", ["233 Broadway", "120 Broadway", "195 Broadway", "285 Broadway"], "233 Broadway", 3),
      // https://en.wikipedia.org/wiki/Flatiron_Building
      q("Manhattan's Flatiron Building was originally named the … Building?", ["Fuller", "Gilsey", "Tower", "Wedge"], "Fuller", 3),
      // https://en.wikipedia.org/wiki/Flatiron_Building
      q("Daniel Burnham's co-designer on Manhattan's Flatiron Building was…", ["Frederick P. Dinkelberg", "Charles B. Atwood", "Pierce Anderson", "Ernest R. Graham"], "Frederick P. Dinkelberg", 3),
      // https://en.wikipedia.org/wiki/Bayard–Condict_Building
      q("Manhattan's Bayard–Condict Building stands on which street?", ["Bleecker Street", "Bond Street", "Houston Street", "Lafayette Street"], "Bleecker Street", 3),
      // https://en.wikipedia.org/wiki/Bayard–Condict_Building
      q("The only NYC building by Louis Sullivan is the…", ["Bayard–Condict Building", "Puck Building on Lafayette", "Gilsey House Hotel", "Potter Building on Park"], "Bayard–Condict Building", 3),
      // https://en.wikipedia.org/wiki/High_Bridge_(New_York_City)
      q("NYC's High Bridge spans which river?", ["Harlem River", "East River", "Bronx River", "Hudson River"], "Harlem River", 3),
      // https://en.wikipedia.org/wiki/High_Bridge_(New_York_City)
      q("NYC's High Bridge opened in what year?", ["1848", "1867", "1883", "1832"], "1848", 3),
      // https://en.wikipedia.org/wiki/High_Bridge_(New_York_City)
      q("NYC's High Bridge was originally called the … Bridge?", ["Aqueduct", "Croton", "Harlem", "Highbridge"], "Aqueduct", 3),
      // https://en.wikipedia.org/wiki/Hell_Gate_Bridge
      q("NYC's Hell Gate Bridge was originally the New York … Railroad Bridge?", ["Connecting", "Central", "Harbor", "Bay Ridge"], "Connecting", 3),
      // https://en.wikipedia.org/wiki/Bayonne_Bridge
      q("NYC's Bayonne Bridge spans which strait?", ["Kill Van Kull", "Arthur Kill", "The Narrows", "Raritan Bay"], "Kill Van Kull", 3),
      // https://en.wikipedia.org/wiki/Croton_Aqueduct
      q("NYC's Old Croton Aqueduct carried water how many miles by gravity?", ["41 miles", "23 miles", "68 miles", "12 miles"], "41 miles", 3),
      // https://en.wikipedia.org/wiki/Castle_Williams
      q("Castle Williams in NYC harbor is built of which stone?", ["red sandstone", "gray granite", "brownstone slab", "white marble"], "red sandstone", 3),
      // https://en.wikipedia.org/wiki/Castle_Clinton
      q("Manhattan's Castle Clinton was built from 1808 to…", ["1811", "1815", "1820", "1809"], "1811", 3),
      // https://en.wikipedia.org/wiki/Castle_Clinton
      q("Manhattan's Castle Clinton was also known as Castle…", ["Garden", "Battery", "Harbor", "Point"], "Garden", 3),
      // https://en.wikipedia.org/wiki/Governors_Island
      q("Which channel separates NYC's Governors Island from Brooklyn?", ["Buttermilk Channel", "Gowanus Channel", "Red Hook Channel", "Ambrose Channel"], "Buttermilk Channel", 3),
      // https://en.wikipedia.org/wiki/Wave_Hill
      q("NYC's Wave Hill estate is in which Bronx section?", ["Riverdale", "Fieldston", "Kingsbridge", "Spuyten Duyvil"], "Riverdale", 3),
      // https://en.wikipedia.org/wiki/Conservatory_Garden
      q("Central Park's Conservatory Garden lies opposite which streets in NYC?", ["104th to 106th", "96th to 98th", "110th to 112th", "86th to 88th"], "104th to 106th", 3),
      // https://en.wikipedia.org/wiki/Strawberry_Fields_(memorial)
      q("Who designed NYC's Strawberry Fields memorial?", ["Bruce Kelly", "Calvert Vaux", "Lynden Miller", "Michael Van Valkenburgh"], "Bruce Kelly", 3),
      // https://en.wikipedia.org/wiki/Bethesda_Terrace_and_Fountain
      q("The statue on NYC's Bethesda Fountain is called the Angel of the…", ["Waters", "Lake", "Park", "Fountain"], "Waters", 3),
      // https://en.wikipedia.org/wiki/Belvedere_Castle
      q("Since 1919 Belvedere Castle in NYC has housed Central Park's…", ["weather station", "police precinct", "nature center", "bird sanctuary"], "weather station", 3),
      // https://en.wikipedia.org/wiki/Belvedere_Castle
      q("Calvert Vaux's partner on NYC's Belvedere Castle was…", ["Jacob Wrey Mould", "Frederick Olmsted", "Ignaz Pilat", "Andrew Green"], "Jacob Wrey Mould", 3),
      // https://en.wikipedia.org/wiki/Katz%27s_Delicatessen
      q("Katz's Delicatessen in Manhattan was founded in what year?", ["1888", "1905", "1872", "1921"], "1888", 3),
      // https://en.wikipedia.org/wiki/Russ_%26_Daughters
      q("Joel Russ, founder of a Manhattan appetizing shop, came from…", ["Strzyżów, Poland", "Białystok, Poland", "Vilnius, Lithuania", "Lviv, Ukraine"], "Strzyżów, Poland", 3),
      // https://en.wikipedia.org/wiki/Russ_%26_Daughters
      q("Russ & Daughters in Manhattan opened in what year?", ["1914", "1898", "1926", "1907"], "1914", 3),
      // https://en.wikipedia.org/wiki/Peter_Luger_Steak_House
      q("NYC's Peter Luger Steak House is in which Brooklyn section?", ["Williamsburg", "Greenpoint", "Bushwick", "Red Hook"], "Williamsburg", 3),
      // https://en.wikipedia.org/wiki/Nathan%27s_Famous
      q("The original Nathan's in NYC is at Surf and which avenue?", ["Stillwell", "Mermaid", "Neptune", "Ocean"], "Stillwell", 3),
      // https://en.wikipedia.org/wiki/McSorley%27s_Old_Ale_House
      q("Manhattan's McSorley's was legally forced to admit women in…", ["1970", "1964", "1977", "1958"], "1970", 3),
      // https://en.wikipedia.org/wiki/Village_Vanguard
      q("Who opened Manhattan's Village Vanguard in 1935?", ["Max Gordon", "Barney Josephson", "Art D'Lugoff", "Joe Termini"], "Max Gordon", 3),
      // https://en.wikipedia.org/wiki/Village_Vanguard
      q("Manhattan's Village Vanguard became mainly a jazz club in…", ["1957", "1945", "1966", "1938"], "1957", 3),
      // https://en.wikipedia.org/wiki/Apollo_Theater
      q("Manhattan's Apollo Theater was formerly Hurtig & Seamon's…", ["New Theatre", "Music Hall", "Burlesque", "Opera House"], "New Theatre", 3),
      // https://en.wikipedia.org/wiki/Cotton_Club
      q("Manhattan's Cotton Club first stood at 142nd Street and which avenue?", ["Lenox Avenue", "Seventh Avenue", "Lexington Avenue", "Amsterdam Avenue"], "Lenox Avenue", 3),
      // https://en.wikipedia.org/wiki/Stonewall_Inn
      q("Manhattan's Stonewall Inn stands on which street?", ["Christopher Street", "Bleecker Street", "Grove Street", "Barrow Street"], "Christopher Street", 3),
    ],
  },
  london: {
    local: [
      // https://en.wikipedia.org/wiki/Highgate_Cemetery
      q("Which architect designed London's Highgate Cemetery?", ["Stephen Geary", "John Nash", "Decimus Burton", "Charles Barry"], "Stephen Geary", 3),
      // https://en.wikipedia.org/wiki/Kensal_Green_Cemetery
      q("London's Kensal Green Cemetery was inspired by which Paris cemetery?", ["Père Lachaise", "Montparnasse", "Montmartre", "Passy"], "Père Lachaise", 3),
      // https://en.wikipedia.org/wiki/Kensal_Green_Cemetery
      q("Which barrister founded London's Kensal Green Cemetery?", ["George Frederick Carden", "Edwin Chadwick", "John Claudius Loudon", "Thomas Willson"], "George Frederick Carden", 3),
      // https://en.wikipedia.org/wiki/Kensal_Green_Cemetery
      q("London's Kensal Green Cemetery opened in what year?", ["1833", "1852", "1819", "1847"], "1833", 3),
      // https://en.wikipedia.org/wiki/Brompton_Cemetery
      q("Brompton Cemetery was originally the West of London and … Cemetery?", ["Westminster", "Chelsea", "Fulham", "Kensington"], "Westminster", 3),
      // https://en.wikipedia.org/wiki/Nunhead_Cemetery
      q("London's Nunhead Cemetery was originally known as … Cemetery?", ["All Saints'", "St Mary's", "Holy Trinity", "St Giles'"], "All Saints'", 3),
      // https://en.wikipedia.org/wiki/Nunhead_Cemetery
      q("London's Nunhead Cemetery was consecrated in what year?", ["1840", "1832", "1856", "1868"], "1840", 3),
      // https://en.wikipedia.org/wiki/Abney_Park_Cemetery
      q("Which hymn writer helped lay out London's Abney Park?", ["Isaac Watts", "Charles Wesley", "John Newton", "William Cowper"], "Isaac Watts", 3),
      // https://en.wikipedia.org/wiki/Abney_Park_Cemetery
      q("London's Abney Park Cemetery lies in which district?", ["Stoke Newington", "Dalston", "Hackney Wick", "Clapton"], "Stoke Newington", 3),
      // https://en.wikipedia.org/wiki/West_Norwood_Cemetery
      q("London's West Norwood Cemetery was also called the South … Cemetery?", ["Metropolitan", "Southwark", "Camberwell", "Lambeth"], "Metropolitan", 3),
      // https://en.wikipedia.org/wiki/Sir_John_Soane%27s_Museum
      q("London's Soane museum sits beside which square?", ["Lincoln's Inn Fields", "Red Lion Square", "Bedford Square", "Russell Square"], "Lincoln's Inn Fields", 3),
      // https://en.wikipedia.org/wiki/Dennis_Severs%27_House
      q("London's Dennis Severs' House stands on which street?", ["Folgate Street", "Fournier Street", "Princelet Street", "Elder Street"], "Folgate Street", 3),
      // https://en.wikipedia.org/wiki/Dennis_Severs%27_House
      q("London's Dennis Severs' House imagines life for a family of…", ["Huguenot silk weavers", "Jewish tailors", "Irish dockers", "Dutch merchants"], "Huguenot silk weavers", 3),
      // https://en.wikipedia.org/wiki/Strawberry_Hill_House
      q("Who built London's Strawberry Hill House?", ["Horace Walpole", "William Beckford", "Robert Adam", "James Wyatt"], "Horace Walpole", 3),
      // https://en.wikipedia.org/wiki/Strawberry_Hill_House
      q("London's Strawberry Hill House stands in which district?", ["Twickenham", "Richmond", "Teddington", "Isleworth"], "Twickenham", 3),
      // https://en.wikipedia.org/wiki/Eltham_Palace
      q("London's Eltham Palace has a medieval great hall plus a 1930s … extension?", ["Art Deco", "Tudor Revival", "Brutalist", "Arts and Crafts"], "Art Deco", 3),
      // https://en.wikipedia.org/wiki/Chiswick_House
      q("Which earl designed London's Chiswick House?", ["Earl of Burlington", "Earl of Pembroke", "Earl of Chesterfield", "Earl of Mansfield"], "Earl of Burlington", 3),
      // https://en.wikipedia.org/wiki/Chiswick_House
      q("London's Chiswick House was completed in what year?", ["1729", "1748", "1712", "1765"], "1729", 3),
      // https://en.wikipedia.org/wiki/Kenwood_House
      q("London's Kenwood House is also known as the … Bequest?", ["Iveagh", "Guinness", "Mansfield", "Hampstead"], "Iveagh", 3),
      // https://en.wikipedia.org/wiki/Kenwood_House
      q("Which Scottish architect remodelled London's Kenwood House?", ["Robert Adam", "William Chambers", "James Gibbs", "Colen Campbell"], "Robert Adam", 3),
      // https://en.wikipedia.org/wiki/Dulwich_Picture_Gallery
      q("London's Dulwich Picture Gallery opened in what year?", ["1817", "1838", "1799", "1824"], "1817", 3),
      // https://en.wikipedia.org/wiki/Dulwich_Picture_Gallery
      q("Who designed London's Dulwich Picture Gallery?", ["Sir John Soane", "John Nash", "Robert Smirke", "William Wilkins"], "Sir John Soane", 3),
      // https://en.wikipedia.org/wiki/Horniman_Museum
      q("London's Horniman Museum is in which district?", ["Forest Hill", "Sydenham", "Catford", "Brockley"], "Forest Hill", 3),
      // https://en.wikipedia.org/wiki/Horniman_Museum
      q("Who designed London's Horniman Museum?", ["Charles Harrison Townsend", "Edwin Landseer Lutyens", "Alfred Waterhouse Jr.", "Thomas Edward Collcutt"], "Charles Harrison Townsend", 3),
      // https://en.wikipedia.org/wiki/Hunterian_Museum,_London
      q("London's Hunterian Museum sits in the building of the Royal College of…", ["Surgeons", "Physicians", "Anatomists", "Medicine"], "Surgeons", 3),
      // https://en.wikipedia.org/wiki/Old_Operating_Theatre_Museum_and_Herb_Garret
      q("London's Old Operating Theatre is in the garret of which church?", ["St Thomas's Church", "St Saviour's Church", "St George's Church", "St Olave's Church"], "St Thomas's Church", 3),
      // https://en.wikipedia.org/wiki/Wellcome_Collection
      q("London's Wellcome Collection stands on which road?", ["Euston Road", "Gower Street", "Tottenham Court Road", "Marylebone Road"], "Euston Road", 3),
      // https://en.wikipedia.org/wiki/Wellcome_Collection
      q("London's Wellcome Collection was founded in what year?", ["2007", "1996", "2014", "2001"], "2007", 3),
      // https://en.wikipedia.org/wiki/Museum_of_the_Home
      q("London's Museum of the Home was formerly the … Museum?", ["Geffrye", "Hoxton", "Horniman", "Bethnal"], "Geffrye", 3),
      // https://en.wikipedia.org/wiki/Museum_of_the_Home
      q("London's Museum of the Home stands on which road?", ["Kingsland Road", "Old Street Road", "Hackney Road", "Mare Street Road"], "Kingsland Road", 3),
      // https://en.wikipedia.org/wiki/Wallace_Collection
      q("London's Wallace Collection occupies which house?", ["Hertford House", "Spencer House", "Apsley House", "Lancaster House"], "Hertford House", 3),
      // https://en.wikipedia.org/wiki/Wallace_Collection
      q("London's Wallace Collection stands on which square?", ["Manchester Square", "Portman Square", "Cavendish Square", "Grosvenor Square"], "Manchester Square", 3),
      // https://en.wikipedia.org/wiki/Fan_Museum
      q("London's Fan Museum opened in what year?", ["1991", "1979", "2003", "1985"], "1991", 3),
      // https://en.wikipedia.org/wiki/Fan_Museum
      q("London's Fan Museum stands on which Greenwich hill?", ["Croom's Hill", "Maze Hill", "Blackheath Hill", "Point Hill"], "Croom's Hill", 3),
      // https://en.wikipedia.org/wiki/Brunel_Museum
      q("London's Brunel Museum is in the engine house in which district?", ["Rotherhithe", "Wapping", "Bermondsey", "Deptford"], "Rotherhithe", 3),
      // https://en.wikipedia.org/wiki/Brunel_Museum
      q("The Thames Tunnel by London's Brunel Museum opened in what year?", ["1843", "1825", "1859", "1836"], "1843", 3),
      // https://en.wikipedia.org/wiki/Leadenhall_Market
      q("London's Leadenhall Market lies on which street?", ["Gracechurch Street", "Cornhill Street", "Bishopsgate Street", "Fenchurch Street"], "Gracechurch Street", 3),
      // https://en.wikipedia.org/wiki/Old_Spitalfields_Market
      q("In 1991 Old Spitalfields gave its name to a new market in which London district?", ["Leyton", "Stratford", "Walthamstow", "Bow"], "Leyton", 3),
      // https://en.wikipedia.org/wiki/Neal%27s_Yard
      q("London's Neal's Yard is named after which developer?", ["Thomas Neale", "John Neal", "William Neale", "Richard Neale"], "Thomas Neale", 3),
      // https://en.wikipedia.org/wiki/Neal%27s_Yard
      q("Which Python bought offices in London's Neal's Yard in 1976 with Terry Gilliam?", ["Michael Palin", "John Cleese", "Eric Idle", "Graham Chapman"], "Michael Palin", 3),
      // https://en.wikipedia.org/wiki/Lloyd%27s_building
      q("London's Lloyd's building is nicknamed the … Building?", ["Inside-Out", "Upside-Down", "Back-to-Front", "Glass-Coffee"], "Inside-Out", 3),
      // https://en.wikipedia.org/wiki/Lloyd%27s_building
      q("London's Lloyd's building stands on the former site of…", ["East India House", "Baltic Exchange", "Crosby Hall", "Gresham House"], "East India House", 3),
      // https://en.wikipedia.org/wiki/Battersea_Power_Station
      q("London's Battersea Power Station stands in which area?", ["Nine Elms", "Vauxhall", "Pimlico", "Stockwell"], "Nine Elms", 3),
      // https://en.wikipedia.org/wiki/Alexandra_Palace
      q("London's Alexandra Palace opened in what year?", ["1873", "1851", "1889", "1862"], "1873", 3),
      // https://en.wikipedia.org/wiki/Alexandra_Palace
      q("London's Alexandra Palace was built on the site of Tottenham Wood…", ["Farm", "Hall", "Manor", "Common"], "Farm", 3),
      // https://en.wikipedia.org/wiki/Crystal_Palace_Dinosaurs
      q("London's Crystal Palace Dinosaurs were unveiled in what year?", ["1854", "1862", "1871", "1849"], "1854", 3),
      // https://en.wikipedia.org/wiki/Kew_Palace
      q("The main surviving part of London's Kew Palace is called the … House?", ["Dutch", "Queen's", "White", "Garden"], "Dutch", 3),
      // https://en.wikipedia.org/wiki/Kew_Palace
      q("London's Kew Palace dates to what year?", ["1631", "1689", "1702", "1578"], "1631", 3),
      // https://en.wikipedia.org/wiki/Cutty_Sark
      q("London's Cutty Sark was built on which Scottish river?", ["River Leven", "River Clyde", "River Tay", "River Forth"], "River Leven", 3),
      // https://en.wikipedia.org/wiki/Cutty_Sark
      q("London's Cutty Sark was built in what year?", ["1869", "1854", "1881", "1847"], "1869", 3),
      // https://en.wikipedia.org/wiki/Thames_Barrier
      q("London's Thames Barrier has been operational since…", ["1982", "1974", "1990", "1968"], "1982", 3),
      // https://en.wikipedia.org/wiki/Tower_Subway
      q("London's Tower Subway tunnel was dug in what year?", ["1869", "1843", "1890", "1857"], "1869", 3),
      // https://en.wikipedia.org/wiki/Greenwich_foot_tunnel
      q("London's Greenwich Foot Tunnel's north end is at which park?", ["Island Gardens", "Mudchute Park", "Millwall Park", "Victoria Park"], "Island Gardens", 3),
      // https://en.wikipedia.org/wiki/Kingsway_tramway_subway
      q("Which body built London's Kingsway tramway subway?", ["London County Council", "Metropolitan Board", "Underground Electric", "City Corporation"], "London County Council", 3),
      // https://en.wikipedia.org/wiki/Postman%27s_Park
      q("London's Postman's Park lies just north of which cathedral?", ["St Paul's Cathedral", "Southwark Cathedral", "Westminster Cathedral", "St George's Cathedral"], "St Paul's Cathedral", 3),
      // https://en.wikipedia.org/wiki/St_Dunstan-in-the-East
      q("London's St Dunstan-in-the-East church ruins are now a…", ["public garden", "museum cafe", "concert venue", "car park"], "public garden", 3),
      // https://en.wikipedia.org/wiki/St_Bartholomew-the-Great
      q("London's St Bartholomew the Great was founded as which kind of priory?", ["Augustinian", "Benedictine", "Cistercian", "Carthusian"], "Augustinian", 3),
      // https://en.wikipedia.org/wiki/St_Bartholomew-the-Great
      q("London's St Bartholomew the Great was founded in what year?", ["1123", "1066", "1189", "1215"], "1123", 3),
      // https://en.wikipedia.org/wiki/Wilton%27s_Music_Hall
      q("London's Wilton's Music Hall sits in Graces Alley, off which street?", ["Cable Street", "Commercial Road", "The Highway", "Wapping Lane"], "Cable Street", 3),
      // https://en.wikipedia.org/wiki/Ye_Olde_Cheshire_Cheese
      q("London's Ye Olde Cheshire Cheese pub is on which street?", ["Fleet Street", "The Strand", "Ludgate Hill", "Chancery Lane"], "Fleet Street", 3),
      // https://en.wikipedia.org/wiki/The_George_Inn,_Southwark
      q("Which body owns London's George Inn in Southwark?", ["National Trust", "English Heritage", "Crown Estate", "City Corporation"], "National Trust", 3),
      // https://en.wikipedia.org/wiki/Prospect_of_Whitby
      q("London's Prospect of Whitby pub was formerly called The…", ["Pelican", "Swan", "Anchor", "Mermaid"], "Pelican", 3),
      // https://en.wikipedia.org/wiki/Prospect_of_Whitby
      q("London's Prospect of Whitby pub stands in which district?", ["Wapping", "Limehouse", "Rotherhithe", "Shadwell"], "Wapping", 3),
      // https://en.wikipedia.org/wiki/Rules_(restaurant)
      q("London's Rules restaurant was founded in what year?", ["1798", "1825", "1762", "1841"], "1798", 3),
      // https://en.wikipedia.org/wiki/Rules_(restaurant)
      q("London's Rules restaurant stands on which lane?", ["Maiden Lane", "Drury Lane", "Long Acre Lane", "Floral Lane"], "Maiden Lane", 3),
      // https://en.wikipedia.org/wiki/Fortnum_%26_Mason
      q("London's Fortnum & Mason was established in what year?", ["1707", "1760", "1688", "1735"], "1707", 3),
      // https://en.wikipedia.org/wiki/Liberty_(department_store)
      q("London's Liberty store stands on which street?", ["Great Marlborough Street", "Lower Regent Street", "Old Bond Street", "Great Portland Street"], "Great Marlborough Street", 3),
      // https://en.wikipedia.org/wiki/Hatchards
      q("London's Hatchards bookshop was founded in what year?", ["1797", "1825", "1768", "1810"], "1797", 3),
      // https://en.wikipedia.org/wiki/James_Lock_%26_Co.
      q("London's Lock & Co. Hatters was founded in what year?", ["1676", "1721", "1654", "1698"], "1676", 3),
      // https://en.wikipedia.org/wiki/James_Lock_%26_Co.
      q("London's Lock & Co. Hatters stands on which street?", ["St James's Street", "Jermyn Street", "Pall Mall", "Savile Row"], "St James's Street", 3),
    ],
  },
  tucson: {
    local: [
      // https://en.wikipedia.org/wiki/Mission_San_Xavier_del_Bac
      q("Who founded Mission San Xavier del Bac near Tucson in 1692?", ["Eusebio Kino", "Junípero Serra", "Francisco Garcés", "Marcos de Niza"], "Eusebio Kino", 3),
      // https://en.wikipedia.org/wiki/Mission_San_Xavier_del_Bac
      q("The first church at Tucson's San Xavier mission was destroyed by an Apache raid in…", ["1770", "1751", "1786", "1802"], "1770", 3),
      // https://en.wikipedia.org/wiki/Presidio_San_Agustín_del_Tucsón
      q("Which Irish officer chose the site of Tucson's presidio in 1775?", ["Hugh O'Conor", "Juan de Anza", "Pedro Allande", "José de Zúñiga"], "Hugh O'Conor", 3),
      // https://en.wikipedia.org/wiki/Presidio_San_Agustín_del_Tucsón
      q("The last section of Tucson's presidio wall was torn down in…", ["1918", "1891", "1856", "1934"], "1918", 3),
      // https://en.wikipedia.org/wiki/Presidio_San_Agustín_del_Tucsón
      q("A reconstruction of a corner of Tucson's presidio was completed in…", ["2007", "1996", "2015", "1988"], "2007", 3),
      // https://en.wikipedia.org/wiki/El_Tiradito
      q("Tucson's El Tiradito shrine stands on which avenue?", ["South Main Avenue", "South Meyer Avenue", "South Stone Avenue", "South Sixth Avenue"], "South Main Avenue", 3),
      // https://en.wikipedia.org/wiki/Hotel_Congress
      q("Tucson's Hotel Congress was built in what year?", ["1918", "1929", "1906", "1935"], "1918", 3),
      // https://en.wikipedia.org/wiki/Hotel_Congress
      q("The name of Tucson's Hotel Congress was chosen by a contest run by the…", ["Arizona Daily Star", "Tucson Citizen Daily", "Arizona Republic", "Southern Pacific"], "Arizona Daily Star", 3),
      // https://en.wikipedia.org/wiki/Rialto_Theatre_(Tucson,_Arizona)
      q("Tucson's Rialto Theatre opened in what year?", ["1920", "1912", "1931", "1926"], "1920", 3),
      // https://en.wikipedia.org/wiki/Rialto_Theatre_(Tucson,_Arizona)
      q("What was the first feature film shown at Tucson's Rialto?", ["The Toll Gate", "The Covered Wagon", "The Iron Horse", "The Spoilers"], "The Toll Gate", 3),
      // https://en.wikipedia.org/wiki/Pima_County_Courthouse
      q("Who designed Tucson's 1928 Pima County Courthouse?", ["Roy Place", "Henry Jaastad", "Josias Joesler", "Merritt Starkweather"], "Roy Place", 3),
      // https://en.wikipedia.org/wiki/Arizona_Inn
      q("Who built Tucson's Arizona Inn in 1930–31?", ["Isabella Greenway", "Sharlot Hall", "Lorna Lockwood", "Frances Willard Munds"], "Isabella Greenway", 3),
      // https://en.wikipedia.org/wiki/Arizona_Inn
      q("Which architect designed the main building of Tucson's Arizona Inn?", ["Merritt Starkweather", "Josias Thomas Joesler", "Henry Charles Trost", "Annie Graham Rockfellow"], "Merritt Starkweather", 3),
      // https://en.wikipedia.org/wiki/Arizona_Inn
      q("Who designed the gardens of Tucson's Arizona Inn?", ["James Oliphant", "Fred Olmsted Jr.", "Ralph Cornell", "Lockwood de Forest"], "James Oliphant", 3),
      // https://en.wikipedia.org/wiki/El_Charro_Café
      q("Who founded Tucson's El Charro Café in 1922?", ["Monica Flin", "Carlotta Flores", "Maria Ronstadt", "Teresa Urrea"], "Monica Flin", 3),
      // https://en.wikipedia.org/wiki/El_Charro_Café
      q("Monica Flin's father helped build which Tucson cathedral?", ["Saint Augustine", "San Xavier", "Saint Joseph", "Santa Cruz"], "Saint Augustine", 3),
      // https://en.wikipedia.org/wiki/Armory_Park_Historic_Residential_District
      q("Tucson's Armory Park was first built as housing for workers of which railroad?", ["Southern Pacific", "Santa Fe", "Union Pacific", "Rock Island"], "Southern Pacific", 3),
      // https://en.wikipedia.org/wiki/Davis–Monthan_Air_Force_Base
      q("Tucson's Davis–Monthan base was established in what year?", ["1925", "1941", "1918", "1933"], "1925", 3),
      // https://en.wikipedia.org/wiki/Davis–Monthan_Air_Force_Base
      q("Which wing is the host unit at Tucson's Davis–Monthan AFB?", ["355th Wing", "23rd Wing", "55th Wing", "12th Wing"], "355th Wing", 3),
      // https://en.wikipedia.org/wiki/Pima_Air_%26_Space_Museum
      q("Tucson's Pima Air & Space Museum opened in what year?", ["1976", "1968", "1984", "1959"], "1976", 3),
      // https://en.wikipedia.org/wiki/Pima_Air_%26_Space_Museum
      q("Since 1991 Tucson's Pima Air museum has hosted the Arizona Aviation…", ["Hall of Fame", "Heritage Trust", "History Center", "Pioneers Club"], "Hall of Fame", 3),
      // https://en.wikipedia.org/wiki/309th_Aerospace_Maintenance_and_Regeneration_Group
      q("Tucson's 309th AMARG aircraft storage site is nicknamed the…", ["Boneyard", "Graveyard Flats", "Desert Hangar", "Iron Field"], "Boneyard", 3),
      // https://en.wikipedia.org/wiki/309th_Aerospace_Maintenance_and_Regeneration_Group
      q("Tucson's 309th AMARG falls under which air logistics complex?", ["Ogden", "Oklahoma City", "Warner Robins", "Sacramento"], "Ogden", 3),
      // https://en.wikipedia.org/wiki/Titan_Missile_Museum
      q("The Titan Missile Museum near Tucson is also known as Titan II Site…", ["571-7", "570-1", "573-4", "571-3"], "571-7", 3),
      // https://en.wikipedia.org/wiki/Titan_Missile_Museum
      q("The Titan site near Tucson was deactivated in what year?", ["1984", "1977", "1991", "1969"], "1984", 3),
      // https://en.wikipedia.org/wiki/Arizona-Sonora_Desert_Museum
      q("The Arizona-Sonora Desert Museum near Tucson was founded in…", ["1952", "1966", "1939", "1974"], "1952", 3),
      // https://en.wikipedia.org/wiki/Tohono_Chul_Park
      q("The name of Tucson-area Tohono Chul translates as…", ["desert corner", "cactus garden", "sun place", "dry spring"], "desert corner", 3),
      // https://en.wikipedia.org/wiki/Tohono_Chul_Park
      q("Tohono Chul lies in which Tucson suburb?", ["Casas Adobes", "Catalina Foothills", "Oro Valley", "Marana"], "Casas Adobes", 3),
      // https://en.wikipedia.org/wiki/Sabino_Canyon
      q("Sabino Canyon near Tucson lies in which mountain range?", ["Santa Catalina", "Rincon", "Santa Rita", "Tortolita"], "Santa Catalina", 3),
      // https://en.wikipedia.org/wiki/Sabino_Canyon
      q("Which earthquake dislodged huge boulders in Tucson's Sabino Canyon?", ["1887 Sonora earthquake", "1906 Arizona quake", "1852 Yuma earthquake", "1935 Gila quake"], "1887 Sonora earthquake", 3),
      // https://en.wikipedia.org/wiki/Mount_Lemmon
      q("Tucson's Mount Lemmon is named for which botanist?", ["Sara Plummer Lemmon", "Mary Lemmon Ward", "Agnes Lemmon Chase", "Kate Lemmon Brandegee"], "Sara Plummer Lemmon", 3),
      // https://en.wikipedia.org/wiki/Mount_Lemmon
      q("The Tohono O'odham call Tucson's Mount Lemmon Babad Do'ag, or…", ["Frog Mountain", "Bear Mountain", "Snow Mountain", "Eagle Mountain"], "Frog Mountain", 3),
      // https://en.wikipedia.org/wiki/Mount_Lemmon
      q("What is the small town near the top of Tucson's Mount Lemmon?", ["Summerhaven", "Coolidge", "Pine Top", "Loma Linda"], "Summerhaven", 3),
      // https://en.wikipedia.org/wiki/Kitt_Peak_National_Observatory
      q("Kitt Peak, west of Tucson, lies in which mountains?", ["Quinlan Mountains", "Baboquivari Range", "Tucson Mountains", "Sierrita Mountains"], "Quinlan Mountains", 3),
      // https://en.wikipedia.org/wiki/Steward_Observatory
      q("Tucson's Steward Observatory was established in what year?", ["1916", "1923", "1907", "1931"], "1916", 3),
      // https://en.wikipedia.org/wiki/Flandrau_Science_Center_and_Planetarium
      q("Tucson's Flandrau planetarium is named for which author?", ["Grace Flandrau", "Charles Flandrau", "Edith Flandrau", "Rose Flandrau"], "Grace Flandrau", 3),
      // https://en.wikipedia.org/wiki/Arizona_State_Museum
      q("The Arizona State Museum in Tucson was founded in what year?", ["1893", "1912", "1879", "1904"], "1893", 3),
      // https://en.wikipedia.org/wiki/Center_for_Creative_Photography
      q("Tucson's Center for Creative Photography was established in…", ["1975", "1962", "1988", "1981"], "1975", 3),
      // https://en.wikipedia.org/wiki/Tucson_Museum_of_Art
      q("Which 1848 house is part of the Tucson Museum of Art's historic block?", ["Cordova House", "Fremont House", "Sosa-Carrillo House", "Stevens House"], "Cordova House", 3),
      // https://en.wikipedia.org/wiki/Old_Tucson_Studios
      q("The western studio near Tucson was built in 1939 for which film?", ["Arizona", "Stagecoach", "Red River", "Rio Bravo"], "Arizona", 3),
      // https://en.wikipedia.org/wiki/Old_Tucson_Studios
      q("The western studio near Tucson opened as a theme park in…", ["1960", "1947", "1972", "1955"], "1960", 3),
      // https://en.wikipedia.org/wiki/Tumamoc_Hill
      q("Tucson's Tumamoc Hill's O'odham name means … mountain?", ["horned lizard", "black base", "rattlesnake", "coyote"], "horned lizard", 3),
      // https://en.wikipedia.org/wiki/Tumamoc_Hill
      q("Which institution established Tucson's Tumamoc Hill reserve in 1903?", ["Carnegie Institution", "Smithsonian Institution", "Rockefeller Foundation", "Field Museum"], "Carnegie Institution", 3),
      // https://en.wikipedia.org/wiki/Sentinel_Peak_(Arizona)
      q("Students built Tucson's 'A' on Sentinel Peak from local…", ["basalt", "granite", "sandstone", "limestone"], "basalt", 3),
      // https://en.wikipedia.org/wiki/Sentinel_Peak_(Arizona)
      q("How tall is the block 'A' on Tucson's Sentinel Peak?", ["160 ft", "85 ft", "240 ft", "120 ft"], "160 ft", 3),
      // https://en.wikipedia.org/wiki/Santa_Cruz_River_(Arizona)
      q("The Santa Cruz River through Tucson is a tributary of which river?", ["Gila River", "Salt River", "Colorado River", "San Pedro River"], "Gila River", 3),
      // https://en.wikipedia.org/wiki/Santa_Cruz_River_(Arizona)
      q("The Santa Cruz River at Tucson rises in which valley?", ["San Rafael Valley", "Sulphur Springs Valley", "Altar Valley", "Avra Valley"], "San Rafael Valley", 3),
      // https://en.wikipedia.org/wiki/Rillito_River
      q("Tucson's Rillito begins at Tanque Verde Creek and which wash?", ["Pantano Wash", "Sabino Wash", "Arroyo Chico Wash", "Agua Caliente Wash"], "Pantano Wash", 3),
      // https://en.wikipedia.org/wiki/Biosphere_2
      q("Biosphere 2, north of Tucson, is in which town?", ["Oracle", "Catalina", "Mammoth", "San Manuel"], "Oracle", 3),
      // https://en.wikipedia.org/wiki/Saguaro_National_Park
      q("Saguaro National Park's east district near Tucson is named for which mountains?", ["Rincon", "Santa Rita", "Whetstone", "Galiuro"], "Rincon", 3),
      // https://en.wikipedia.org/wiki/Tucson_Citizen
      q("The Tucson Citizen ceased publication in what year?", ["2009", "1998", "2014", "2003"], "2009", 3),
      // https://en.wikipedia.org/wiki/Tucson_Citizen
      q("Who published the first Arizona Citizen in Tucson in 1870?", ["Richard C. McCormick", "John Wasson Jr.", "Allan B. Jaynes", "Frank Hitchcock"], "Richard C. McCormick", 3),
      // https://en.wikipedia.org/wiki/Arizona_Daily_Star
      q("Tucson's Arizona Daily Star began in 1877 as The Daily…", ["Bulletin", "Herald", "Courier", "Sentinel"], "Bulletin", 3),
      // https://en.wikipedia.org/wiki/Arizona_Daily_Star
      q("Which future territorial governor co-founded Tucson's Daily Star?", ["L. C. Hughes", "A. P. K. Safford", "John C. Frémont", "N. O. Murphy"], "L. C. Hughes", 3),
      // https://en.wikipedia.org/wiki/Hi_Corbett_Field
      q("Tucson's Hi Corbett Field was originally called Randolph Municipal…", ["Baseball Park", "Sports Stadium", "Athletic Field", "Ball Diamond"], "Baseball Park", 3),
      // https://en.wikipedia.org/wiki/Hi_Corbett_Field
      q("Which owner brought the Cleveland Indians to Tucson in 1947?", ["Bill Veeck", "Hank Greenberg", "Larry MacPhail", "Walter Briggs"], "Bill Veeck", 3),
      // https://en.wikipedia.org/wiki/McKale_Center
      q("Before McKale Center, Tucson's Wildcats played in which gym?", ["Bear Down Gymnasium", "Wildcat Fieldhouse", "Old Main Gym", "Varsity Gym"], "Bear Down Gymnasium", 3),
      // https://en.wikipedia.org/wiki/McKale_Center
      q("Tucson's McKale Center officially opened in what year?", ["1973", "1966", "1981", "1959"], "1973", 3),
      // https://en.wikipedia.org/wiki/Tucson_International_Airport
      q("Tucson International Airport lies how far south of downtown?", ["8 miles", "3 miles", "15 miles", "22 miles"], "8 miles", 3),
    ],
  },
  boston: {
    local: [
      // https://en.wikipedia.org/wiki/Granary_Burying_Ground
      q("Boston's Granary Burying Ground was founded in what year?", ["1660", "1630", "1688", "1704"], "1660", 3),
      // https://en.wikipedia.org/wiki/King%27s_Chapel_Burying_Ground
      q("Boston's King's Chapel Burying Ground was established in…", ["1630", "1660", "1688", "1712"], "1630", 3),
      // https://en.wikipedia.org/wiki/King%27s_Chapel_Burying_Ground
      q("Boston's King's Chapel Burying Ground sits near Tremont and which street?", ["School Street", "Court Street", "Park Street", "Beacon Street"], "School Street", 3),
      // https://en.wikipedia.org/wiki/Copp%27s_Hill_Burying_Ground
      q("Boston's Copp's Hill Burying Ground was originally called the…", ["North Burying Ground", "Hill Burial Field", "Charter Street Yard", "Old North Yard"], "North Burying Ground", 3),
      // https://en.wikipedia.org/wiki/Copp%27s_Hill_Burying_Ground
      q("Boston's Copp's Hill Burying Ground was established in…", ["1659", "1630", "1688", "1702"], "1659", 3),
      // https://en.wikipedia.org/wiki/Forest_Hills_Cemetery
      q("Boston's Forest Hills Cemetery was founded as a public cemetery for which town?", ["Roxbury", "Dorchester", "Brookline", "West Roxbury"], "Roxbury", 3),
      // https://en.wikipedia.org/wiki/Forest_Hills_Cemetery
      q("Boston's Forest Hills Cemetery was established in what year?", ["1848", "1831", "1867", "1825"], "1848", 3),
      // https://en.wikipedia.org/wiki/Mount_Auburn_Cemetery
      q("Mount Auburn Cemetery near Boston was dedicated in what year?", ["1831", "1848", "1819", "1856"], "1831", 3),
      // https://en.wikipedia.org/wiki/Mount_Auburn_Cemetery
      q("Mount Auburn Cemetery near Boston lies in Cambridge and which town?", ["Watertown", "Belmont", "Arlington", "Somerville"], "Watertown", 3),
      // https://en.wikipedia.org/wiki/Nichols_House_Museum
      q("Boston's Nichols House Museum was designed by which architect?", ["Charles Bulfinch", "Asher Benjamin", "Alexander Parris", "Peter Banner"], "Charles Bulfinch", 3),
      // https://en.wikipedia.org/wiki/Gibson_House_Museum
      q("Boston's Gibson House Museum preserves a Victorian rowhouse from…", ["1860", "1878", "1842", "1891"], "1860", 3),
      // https://en.wikipedia.org/wiki/Gibson_House_Museum
      q("Boston's Gibson House Museum stands on which street?", ["Beacon Street", "Marlborough Street", "Commonwealth Avenue", "Newbury Street"], "Beacon Street", 3),
      // https://en.wikipedia.org/wiki/Paul_Revere_House
      q("Boston's Paul Revere House stands on which square?", ["North Square", "Post Office Square", "Dock Square", "Haymarket Square"], "North Square", 3),
      // https://en.wikipedia.org/wiki/Shirley–Eustis_House
      q("Which royal governor built Boston's Shirley–Eustis House?", ["William Shirley", "Thomas Hutchinson", "Francis Bernard", "Thomas Pownall"], "William Shirley", 3),
      // https://en.wikipedia.org/wiki/Shirley–Eustis_House
      q("Boston's Shirley–Eustis House was built between 1747 and…", ["1751", "1760", "1749", "1772"], "1751", 3),
      // https://en.wikipedia.org/wiki/Mapparium
      q("Boston's Mapparium globe is made of…", ["stained glass", "painted copper", "carved wood", "molded plaster"], "stained glass", 3),
      // https://en.wikipedia.org/wiki/Mapparium
      q("Boston's Mapparium was built in what year?", ["1935", "1922", "1948", "1911"], "1935", 3),
      // https://en.wikipedia.org/wiki/Mapparium
      q("Boston's Mapparium was based on political maps by…", ["Rand McNally", "National Geographic", "Hammond Maps", "George Philip"], "Rand McNally", 3),
      // https://en.wikipedia.org/wiki/African_Meeting_House
      q("Boston's African Meeting House was built in what year?", ["1806", "1789", "1824", "1841"], "1806", 3),
      // https://en.wikipedia.org/wiki/African_Meeting_House
      q("Which reverend led the congregation that built Boston's African Meeting House?", ["Thomas Paul", "Leonard Grimes", "Prince Hall", "Peter Randolph"], "Thomas Paul", 3),
      // https://en.wikipedia.org/wiki/Old_State_House_(Boston)
      q("Boston's Old State House was completed in what year?", ["1713", "1688", "1740", "1695"], "1713", 3),
      // https://en.wikipedia.org/wiki/Old_State_House_(Boston)
      q("Boston's Old State House stands at 206 … Street?", ["Washington", "State", "Court", "Devonshire"], "Washington", 3),
      // https://en.wikipedia.org/wiki/Old_South_Meeting_House
      q("Boston's Old South Meeting House was built in what year?", ["1729", "1713", "1752", "1698"], "1729", 3),
      // https://en.wikipedia.org/wiki/Old_South_Meeting_House
      q("Boston's Old South Meeting House stands at Washington and which street?", ["Milk Street", "Water Street", "School Street", "Summer Street"], "Milk Street", 3),
      // https://en.wikipedia.org/wiki/Old_North_Church
      q("Boston's Old North Church is officially named…", ["Christ Church", "Trinity Church", "King's Church", "St. Paul's Church"], "Christ Church", 3),
      // https://en.wikipedia.org/wiki/Old_North_Church
      q("Boston's Old North Church stands on which street?", ["Salem Street", "Hanover Street", "Charter Street", "Prince Street"], "Salem Street", 3),
      // https://en.wikipedia.org/wiki/Park_Street_Church
      q("Boston's Park Street Church was founded in what year?", ["1809", "1789", "1826", "1771"], "1809", 3),
      // https://en.wikipedia.org/wiki/Trinity_Church_(Boston)
      q("The congregation of Boston's Trinity Church was founded in…", ["1733", "1772", "1704", "1755"], "1733", 3),
      // https://en.wikipedia.org/wiki/Arlington_Street_Church
      q("Boston's Arlington Street Church belongs to which denomination?", ["Unitarian Universalist", "Congregationalist", "Episcopal", "Methodist"], "Unitarian Universalist", 3),
      // https://en.wikipedia.org/wiki/Arlington_Street_Church
      q("Boston's Arlington Street Church was completed in what year?", ["1861", "1848", "1875", "1836"], "1861", 3),
      // https://en.wikipedia.org/wiki/Custom_House_Tower
      q("Who designed the original Custom House in Boston?", ["Ammi Burnham Young", "Charles Bulfinch", "Alexander Parris", "Isaiah Rogers"], "Ammi Burnham Young", 3),
      // https://en.wikipedia.org/wiki/Custom_House_Tower
      q("Which firm added the tower to Boston's Custom House?", ["Peabody and Stearns", "Cram and Ferguson", "Shepley, Rutan", "McKim, Mead"], "Peabody and Stearns", 3),
      // https://en.wikipedia.org/wiki/Custom_House_Tower
      q("Boston's Custom House Tower stands in which square?", ["McKinley Square", "Post Office Square", "Dewey Square", "Adams Square"], "McKinley Square", 3),
      // https://en.wikipedia.org/wiki/Ames_Building
      q("Boston's Ames Building was completed in what year?", ["1889", "1875", "1902", "1868"], "1889", 3),
      // https://en.wikipedia.org/wiki/Steinert_Hall
      q("Boston's Steinert Hall sat how many stories underground?", ["four", "two", "six", "three"], "four", 3),
      // https://en.wikipedia.org/wiki/Steinert_Hall
      q("Boston's underground Steinert Hall lies beneath which district?", ["Piano Row", "Ladder District", "Leather District", "Theater Row"], "Piano Row", 3),
      // https://en.wikipedia.org/wiki/Boston_Athenæum
      q("Which club founded the Boston Athenæum in 1807?", ["Anthology Club", "Saturday Club", "Tavern Club", "Thursday Club"], "Anthology Club", 3),
      // https://en.wikipedia.org/wiki/Colonial_Theatre_(Boston)
      q("Boston's Colonial Theatre opened in what year?", ["1900", "1912", "1889", "1925"], "1900", 3),
      // https://en.wikipedia.org/wiki/Wang_Theatre
      q("Boston's Wang Theatre opened in 1925 as the … Theatre?", ["Metropolitan", "Paramount", "Keith Memorial", "Majestic"], "Metropolitan", 3),
      // https://en.wikipedia.org/wiki/Wang_Theatre
      q("Who designed Boston's Wang Theatre?", ["Clarence Blackall", "Thomas Lamb", "John Eberson", "Rapp and Rapp"], "Clarence Blackall", 3),
      // https://en.wikipedia.org/wiki/Shubert_Theatre_(Boston)
      q("Who designed Boston's Shubert Theatre?", ["Thomas M. James", "Clarence Blackall", "Thomas W. Lamb", "Charles Bulfinch"], "Thomas M. James", 3),
      // https://en.wikipedia.org/wiki/Orpheum_Theatre_(Boston)
      q("Boston's Orpheum Theatre was originally the Music Hall built in…", ["1852", "1871", "1838", "1890"], "1852", 3),
      // https://en.wikipedia.org/wiki/Orpheum_Theatre_(Boston)
      q("Which conservatory was founded at Boston's Orpheum in 1867?", ["New England Conservatory", "Berklee College of Music", "Longy School of Music", "Boston Conservatory of Music"], "New England Conservatory", 3),
      // https://en.wikipedia.org/wiki/Union_Oyster_House
      q("Boston's Union Oyster House has served diners since…", ["1826", "1795", "1848", "1867"], "1826", 3),
      // https://en.wikipedia.org/wiki/Union_Oyster_House
      q("Boston's Union Oyster House is part of which historic block?", ["Blackstone Block", "Faneuil Block", "Haymarket Block", "Marshall Block"], "Blackstone Block", 3),
      // https://en.wikipedia.org/wiki/Durgin-Park
      q("Boston's Durgin-Park restaurant closed in what year?", ["2019", "2012", "2022", "2008"], "2019", 3),
      // https://en.wikipedia.org/wiki/Warren_Tavern
      q("The Warren Tavern near Boston was founded in what year?", ["1780", "1755", "1802", "1820"], "1780", 3),
      // https://en.wikipedia.org/wiki/Jacob_Wirth_Restaurant
      q("Boston's Jacob Wirth restaurant was founded in what year?", ["1868", "1844", "1891", "1879"], "1868", 3),
      // https://en.wikipedia.org/wiki/Jacob_Wirth_Restaurant
      q("Boston's Jacob Wirth restaurant stood on which street?", ["Stuart Street", "Boylston Street", "Tremont Street", "Essex Street"], "Stuart Street", 3),
      // https://en.wikipedia.org/wiki/Castle_Island_(Massachusetts)
      q("Boston's Castle Island was joined to the mainland in what year?", ["1928", "1891", "1955", "1912"], "1928", 3),
      // https://en.wikipedia.org/wiki/Fort_Independence_(Massachusetts)
      q("The first fort on Boston's Castle Island, 'The Castle', was built in…", ["1634", "1660", "1701", "1776"], "1634", 3),
      // https://en.wikipedia.org/wiki/Boston_Light
      q("Boston Light stands on which island?", ["Little Brewster", "Great Brewster", "Georges Island", "Long Island"], "Little Brewster", 3),
      // https://en.wikipedia.org/wiki/Boston_Light
      q("The first lighthouse at Boston Light dates to what year?", ["1716", "1783", "1690", "1749"], "1716", 3),
      // https://en.wikipedia.org/wiki/Long_Wharf_(Boston)
      q("Boston's Long Wharf was built between 1710 and…", ["1721", "1735", "1712", "1748"], "1721", 3),
      // https://en.wikipedia.org/wiki/Bunker_Hill_Monument
      q("The Bunker Hill Monument actually stands on which hill?", ["Breed's Hill", "Copp's Hill", "Beacon Hill", "Moulton's Hill"], "Breed's Hill", 3),
      // https://en.wikipedia.org/wiki/Bunker_Hill_Monument
      q("How tall is the Bunker Hill Monument near Boston?", ["221 feet", "185 feet", "264 feet", "150 feet"], "221 feet", 3),
      // https://en.wikipedia.org/wiki/Arnold_Arboretum
      q("Boston's Arnold Arboretum was established in what year?", ["1872", "1891", "1858", "1880"], "1872", 3),
      // https://en.wikipedia.org/wiki/Arnold_Arboretum
      q("Who co-designed Boston's Arnold Arboretum with Olmsted?", ["Charles Sprague Sargent", "Calvert Bowyer Vaux", "Charles William Eliot", "Ernest Henry Wilson"], "Charles Sprague Sargent", 3),
      // https://en.wikipedia.org/wiki/Back_Bay_Fens
      q("Boston's Back Bay Fens was established in what year?", ["1879", "1892", "1866", "1901"], "1879", 3),
      // https://en.wikipedia.org/wiki/Jamaica_Pond
      q("Boston's Jamaica Pond is the source of which river?", ["Muddy River", "Neponset River", "Mystic River", "Stony Brook"], "Muddy River", 3),
      // https://en.wikipedia.org/wiki/Make_Way_for_Ducklings
      q("Who wrote Make Way for Ducklings, set in Boston's Public Garden?", ["Robert McCloskey", "Ezra Jack Keats", "H. A. Rey", "Marjorie Flack"], "Robert McCloskey", 3),
      // https://en.wikipedia.org/wiki/Louisburg_Square
      q("Boston's Louisburg Square lies between Mount Vernon Street and…", ["Pinckney Street", "Chestnut Street", "Joy Street", "Revere Street"], "Pinckney Street", 3),
      // https://en.wikipedia.org/wiki/Charles_River_Esplanade
      q("Boston's Esplanade was dedicated in 1910 as the Boston…", ["Embankment", "Riverwalk", "Promenade", "Parkway"], "Embankment", 3),
      // https://en.wikipedia.org/wiki/Hatch_Memorial_Shell
      q("Boston's Hatch Shell was built in what years?", ["1939–1940", "1927–1928", "1948–1949", "1934–1935"], "1939–1940", 3),
      // https://en.wikipedia.org/wiki/Granary_Burying_Ground
      q("Who designed the Egyptian revival gate of Boston's Granary Burying Ground?", ["Isaiah Rogers", "Charles Bulfinch", "Solomon Willard", "Alexander Parris"], "Isaiah Rogers", 3),
      // https://en.wikipedia.org/wiki/Granary_Burying_Ground
      q("About how many grave markers stand in Boston's Granary Burying Ground?", ["2,345", "1,120", "4,800", "3,600"], "2,345", 3),
      // https://en.wikipedia.org/wiki/Isabella_Stewart_Gardner_Museum
      q("Who designed the 2012 wing of Boston's Gardner Museum?", ["Renzo Piano", "Rafael Moneo", "Norman Foster", "Moshe Safdie"], "Renzo Piano", 3),
      // https://en.wikipedia.org/wiki/Isabella_Stewart_Gardner_Museum
      q("Boston's Gardner Museum opened to the public in what year?", ["1903", "1891", "1912", "1924"], "1903", 3),
      // https://en.wikipedia.org/wiki/Mapparium
      q("Which architect conceived Boston's Mapparium globe?", ["Chester Lindsay Churchill", "Ralph Adams Cram Jr.", "William Welles Bosworth", "Charles Donagh Maginnis"], "Chester Lindsay Churchill", 3),
      // https://en.wikipedia.org/wiki/Park_Street_Church
      q("Who was the architect of Boston's Park Street Church?", ["Peter Banner", "Charles Bulfinch", "Asher Benjamin", "Solomon Willard"], "Peter Banner", 3),
      // https://en.wikipedia.org/wiki/Trinity_Church_(Boston)
      q("Who designed the building of Boston's Trinity Church?", ["Henry Hobson Richardson", "Ralph Adams Cram Jr.", "Charles Follen McKim", "Richard Michell Upjohn"], "Henry Hobson Richardson", 3),
      // https://en.wikipedia.org/wiki/Ames_Building
      q("Which firm designed Boston's Ames Building?", ["Shepley, Rutan and Coolidge", "Peabody and Stearns", "Cram and Ferguson", "Winslow and Wetherell"], "Shepley, Rutan and Coolidge", 3),
      // https://en.wikipedia.org/wiki/Ames_Building
      q("Which university turned Boston's Ames Building into a dorm in 2020?", ["Suffolk University", "Emerson College", "Northeastern", "Simmons University"], "Suffolk University", 3),
      // https://en.wikipedia.org/wiki/Steinert_Hall
      q("Morris Steinert, of Boston's Steinert Hall, came from which region?", ["Bavaria", "Saxony", "Bohemia", "Prussia"], "Bavaria", 3),
      // https://en.wikipedia.org/wiki/Colonial_Theatre_(Boston)
      q("Boston's Colonial Theatre opened in 1900 with which play?", ["Ben-Hur", "Quo Vadis", "Uncle Tom's Cabin", "The Merry Widow"], "Ben-Hur", 3),
      // https://en.wikipedia.org/wiki/Colonial_Theatre_(Boston)
      q("Which Shaw play premiered at Boston's Colonial Theatre in 1932?", ["Too True To Be Good", "The Apple Cart", "Heartbreak House", "Saint Joan"], "Too True To Be Good", 3),
      // https://en.wikipedia.org/wiki/Union_Oyster_House
      q("The original building of Boston's Union Oyster House dates to about…", ["1716", "1742", "1690", "1770"], "1716", 3),
      // https://en.wikipedia.org/wiki/Fort_Independence_(Massachusetts)
      q("Boston's Castle William was renamed Fort Adams and then Fort…", ["Independence", "Washington", "Lafayette", "Winthrop"], "Independence", 3),
      // https://en.wikipedia.org/wiki/Fort_Independence_(Massachusetts)
      q("Boston's granite Fort Independence was built between 1833 and…", ["1851", "1840", "1865", "1837"], "1851", 3),
      // https://en.wikipedia.org/wiki/Boston_Light
      q("After a 1776 blast, the tower of Boston Light was rebuilt in…", ["1783", "1790", "1777", "1801"], "1783", 3),
      // https://en.wikipedia.org/wiki/Boston_Light
      q("Boston Light was raised to its present height of 98 feet in…", ["1856", "1832", "1871", "1899"], "1856", 3),
      // https://en.wikipedia.org/wiki/Long_Wharf_(Boston)
      q("Who built Boston's Long Wharf?", ["Captain Oliver Noyes", "Captain John Mason", "Captain Thomas Hancock", "Captain Peter Faneuil"], "Captain Oliver Noyes", 3),
      // https://en.wikipedia.org/wiki/Jamaica_Pond
      q("How deep is Boston's Jamaica Pond at its center?", ["51 feet", "23 feet", "88 feet", "36 feet"], "51 feet", 3),
      // https://en.wikipedia.org/wiki/Franklin_Park_(Boston)
      q("Boston's Franklin Park was previously called … Park?", ["West Roxbury", "Dorchester", "Blue Hill", "Forest Hills"], "West Roxbury", 3),
      // https://en.wikipedia.org/wiki/Hatch_Memorial_Shell
      q("A memorial near Boston's Hatch Shell honors which Pops conductor?", ["Arthur Fiedler", "John Williams", "Keith Lockhart", "Harry Ellis Dickson"], "Arthur Fiedler", 3),
      // https://en.wikipedia.org/wiki/Charles_River_Esplanade
      q("Which parkway forms the southern edge of Boston's Esplanade?", ["Storrow Drive", "Memorial Drive", "Soldiers Field Road", "Fenway Parkway"], "Storrow Drive", 3),
    ],
  },
  la: {
    local: [
      // https://en.wikipedia.org/wiki/Hollywood_Forever_Cemetery
      q("L.A.'s Hollywood Forever Cemetery stands on which boulevard?", ["Santa Monica Boulevard", "Sunset Boulevard", "Melrose Boulevard", "Wilshire Boulevard"], "Santa Monica Boulevard", 3),
      // https://en.wikipedia.org/wiki/Evergreen_Cemetery_(Los_Angeles)
      q("L.A.'s Evergreen Cemetery lies in which neighborhood?", ["Boyle Heights", "Lincoln Heights", "El Sereno", "Highland Park"], "Boyle Heights", 3),
      // https://en.wikipedia.org/wiki/Angelus-Rosedale_Cemetery
      q("L.A.'s Angelus-Rosedale Cemetery was founded as Rosedale in…", ["1884", "1869", "1902", "1891"], "1884", 3),
      // https://en.wikipedia.org/wiki/Angelus-Rosedale_Cemetery
      q("L.A.'s Angelus-Rosedale Cemetery lies in which neighborhood?", ["West Adams", "Mid-City", "Exposition Park", "Jefferson Park"], "West Adams", 3),
      // https://en.wikipedia.org/wiki/Bradbury_Building
      q("Downtown L.A.'s Bradbury Building is famed for its skylit…", ["atrium", "ballroom", "rooftop", "chapel"], "atrium", 3),
      // https://en.wikipedia.org/wiki/Eastern_Columbia_Building
      q("Who designed L.A.'s Eastern Columbia Building?", ["Claud Beelman", "John Parkinson", "Morgan Walls", "Albert C. Martin"], "Claud Beelman", 3),
      // https://en.wikipedia.org/wiki/Eastern_Columbia_Building
      q("L.A.'s Eastern Columbia Building opened in what year?", ["1930", "1924", "1937", "1919"], "1930", 3),
      // https://en.wikipedia.org/wiki/Million_Dollar_Theatre
      q("L.A.'s Million Dollar Theatre opened in 1917 with which film?", ["The Silent Man", "The Covered Wagon", "Hell's Hinges", "The Narrow Trail"], "The Silent Man", 3),
      // https://en.wikipedia.org/wiki/Million_Dollar_Theatre
      q("L.A.'s Million Dollar Theatre stands across from which building?", ["Bradbury Building", "Eastern Columbia", "Oviatt Building", "Pico House"], "Bradbury Building", 3),
      // https://en.wikipedia.org/wiki/Los_Angeles_Theatre
      q("Which independent film man commissioned the Los Angeles Theatre?", ["H.L. Gumbiner", "Sid Grauman", "Alexander Pantages", "Marcus Loew"], "H.L. Gumbiner", 3),
      // https://en.wikipedia.org/wiki/Orpheum_Theatre_(Los_Angeles)
      q("L.A.'s Orpheum Theatre on Broadway opened in what year?", ["1926", "1918", "1931", "1911"], "1926", 3),
      // https://en.wikipedia.org/wiki/El_Capitan_Theatre
      q("L.A.'s El Capitan Theatre is owned by which company?", ["Walt Disney Company", "Warner Bros.", "Paramount Pictures", "Universal Studios"], "Walt Disney Company", 3),
      // https://en.wikipedia.org/wiki/Avalon_Hollywood
      q("L.A.'s Avalon nightclub stands on which street?", ["Vine Street", "Gower Street", "Cahuenga Boulevard", "Highland Avenue"], "Vine Street", 3),
      // https://en.wikipedia.org/wiki/Formosa_Cafe
      q("Who founded the Formosa Cafe near L.A. in 1925?", ["Jimmy Bernstein", "Jack Dempsey", "Mickey Cohen", "Joe Musso"], "Jimmy Bernstein", 3),
      // https://en.wikipedia.org/wiki/Formosa_Cafe
      q("The Formosa Cafe near L.A. first operated inside a…", ["Red Car trolley", "railroad caboose", "circus wagon", "Army barracks"], "Red Car trolley", 3),
      // https://en.wikipedia.org/wiki/Musso_%26_Frank_Grill
      q("L.A.'s Musso & Frank Grill opened in what year?", ["1919", "1927", "1908", "1934"], "1919", 3),
      // https://en.wikipedia.org/wiki/Pink%27s_Hot_Dogs
      q("L.A.'s Pink's Hot Dogs began in 1939 as a…", ["pushcart", "food truck", "lunch counter", "diner car"], "pushcart", 3),
      // https://en.wikipedia.org/wiki/Pink%27s_Hot_Dogs
      q("L.A.'s Pink's Hot Dogs stands on which avenue?", ["North La Brea Avenue", "North Fairfax Avenue", "North Highland Avenue", "North Vermont Avenue"], "North La Brea Avenue", 3),
      // https://en.wikipedia.org/wiki/Randy%27s_Donuts
      q("The original Randy's Donuts near L.A. is in which city?", ["Inglewood", "Hawthorne", "Culver City", "El Segundo"], "Inglewood", 3),
      // https://en.wikipedia.org/wiki/Original_Pantry_Cafe
      q("L.A.'s Original Pantry Cafe stands at 9th and which street?", ["Figueroa", "Flower", "Hope", "Grand"], "Figueroa", 3),
      // https://en.wikipedia.org/wiki/Clifton%27s_Cafeteria
      q("Who founded L.A.'s Clifton's Cafeteria in 1931?", ["Clifford Clinton", "Clifton Webb", "Clinton Clifford", "Cliff Henderson"], "Clifford Clinton", 3),
      // https://en.wikipedia.org/wiki/Grand_Central_Market
      q("L.A.'s Grand Central Market is housed in which building?", ["Homer Laughlin Building", "Bradbury Building", "Million Dollar Building", "Broadway Arcade"], "Homer Laughlin Building", 3),
      // https://en.wikipedia.org/wiki/Olvera_Street
      q("L.A.'s Olvera Street lies off the oldest plaza in…", ["California", "the West", "Mexico", "the city"], "California", 3),
      // https://en.wikipedia.org/wiki/Pico_House
      q("L.A.'s Pico House was built by which businessman?", ["Pío Pico", "Andrés Pico", "Abel Stearns", "Antonio Coronel"], "Pío Pico", 3),
      // https://en.wikipedia.org/wiki/Pico_House
      q("L.A.'s Pico House stands on which street?", ["North Main Street", "North Spring Street", "Alameda Street", "Los Ángeles Street"], "North Main Street", 3),
      // https://en.wikipedia.org/wiki/Angels_Flight
      q("The two cars of L.A.'s Angels Flight are named Olivet and…", ["Sinai", "Zion", "Carmel", "Tabor"], "Sinai", 3),
      // https://en.wikipedia.org/wiki/Watts_Towers
      q("L.A.'s Watts Towers are also called Nuestro…", ["Pueblo", "Mundo", "Barrio", "Sueño"], "Pueblo", 3),
      // https://en.wikipedia.org/wiki/Watts_Towers
      q("How many interconnected towers make up L.A.'s Watts Towers?", ["17", "9", "24", "12"], "17", 3),
      // https://en.wikipedia.org/wiki/Bob_Baker_Marionette_Theater
      q("L.A.'s Bob Baker Marionette Theater was founded in what year?", ["1963", "1951", "1972", "1948"], "1963", 3),
      // https://en.wikipedia.org/wiki/Bob_Baker_Marionette_Theater
      q("In 2019 L.A.'s Bob Baker Marionette Theater moved to which boulevard?", ["York Boulevard", "Figueroa Boulevard", "Eagle Rock Boulevard", "Colorado Boulevard"], "York Boulevard", 3),
      // https://en.wikipedia.org/wiki/Museum_of_Jurassic_Technology
      q("L.A.'s Museum of Jurassic Technology stands on which boulevard?", ["Venice Boulevard", "Pico Boulevard", "Washington Boulevard", "Olympic Boulevard"], "Venice Boulevard", 3),
      // https://en.wikipedia.org/wiki/Museum_of_Jurassic_Technology
      q("L.A.'s Museum of Jurassic Technology was founded in what year?", ["1988", "1976", "1997", "1969"], "1988", 3),
      // https://en.wikipedia.org/wiki/Lummis_House
      q("L.A.'s Lummis House is also known as El…", ["Alisal", "Retiro", "Encino", "Molino"], "Alisal", 3),
      // https://en.wikipedia.org/wiki/Lummis_House
      q("The name of L.A.'s Lummis House, El Alisal, means…", ["alder grove", "stone house", "oak shelter", "river bend"], "alder grove", 3),
      // https://en.wikipedia.org/wiki/Heritage_Square_Museum
      q("L.A.'s Heritage Square Museum lies beside which parkway?", ["Arroyo Seco Parkway", "Glendale Parkway", "Golden State Parkway", "Pasadena Parkway"], "Arroyo Seco Parkway", 3),
      // https://en.wikipedia.org/wiki/Hollyhock_House
      q("For which heiress did Wright design L.A.'s Hollyhock House?", ["Aline Barnsdall", "Arabella Huntington", "Estelle Doheny", "Harriet Ennis"], "Aline Barnsdall", 3),
      // https://en.wikipedia.org/wiki/Ennis_House
      q("L.A.'s Ennis House was designed in which revival style?", ["Mayan Revival", "Egyptian Revival", "Spanish Revival", "Tudor Revival"], "Mayan Revival", 3),
      // https://en.wikipedia.org/wiki/Ennis_House
      q("L.A.'s Ennis House stands on which avenue?", ["Glendower Avenue", "Vermont Avenue", "Los Feliz Avenue", "Hillhurst Avenue"], "Glendower Avenue", 3),
      // https://en.wikipedia.org/wiki/Lovell_House
      q("Who designed L.A.'s Lovell Health House?", ["Richard Neutra", "Rudolph Schindler", "Gregory Ain", "Raphael Soriano"], "Richard Neutra", 3),
      // https://en.wikipedia.org/wiki/Lovell_House
      q("Philip Lovell, of L.A.'s Lovell House, was a physician and…", ["naturopath", "architect", "film producer", "oil broker"], "naturopath", 3),
      // https://en.wikipedia.org/wiki/Gamble_House_(Pasadena,_California)
      q("Which firm designed the Gamble House near L.A.?", ["Greene and Greene", "Irving John Gill", "Myron Hubbard Hunt", "Wallace Neff and Sons"], "Greene and Greene", 3),
      // https://en.wikipedia.org/wiki/Greystone_Mansion
      q("L.A. oil tycoon Edward Doheny built Greystone Mansion for his…", ["son", "wife", "daughter", "brother"], "son", 3),
      // https://en.wikipedia.org/wiki/Greystone_Mansion
      q("Which city bought Greystone Mansion near L.A. in 1965?", ["Beverly Hills", "Santa Monica", "West Hollywood", "Culver City"], "Beverly Hills", 3),
      // https://en.wikipedia.org/wiki/Adamson_House
      q("The Adamson House near L.A. is nicknamed the Taj Mahal of…", ["Tile", "Malibu", "Stucco", "Mosaic"], "Tile", 3),
      // https://en.wikipedia.org/wiki/Leonis_Adobe
      q("L.A. County's Leonis Adobe was built in what year?", ["1844", "1862", "1828", "1871"], "1844", 3),
      // https://en.wikipedia.org/wiki/Leonis_Adobe
      q("L.A. County's Leonis Adobe stands in which city?", ["Calabasas", "Agoura Hills", "Woodland Hills", "Hidden Hills"], "Calabasas", 3),
      // https://en.wikipedia.org/wiki/Southwest_Museum_of_the_American_Indian
      q("L.A.'s Southwest Museum was absorbed by which museum?", ["Autry Museum", "Natural History Museum", "Huntington Library", "Getty Museum"], "Autry Museum", 3),
      // https://en.wikipedia.org/wiki/Petersen_Automotive_Museum
      q("L.A.'s Petersen Automotive Museum is in which neighborhood?", ["Miracle Mile", "Hancock Park", "Mid-Wilshire", "Fairfax"], "Miracle Mile", 3),
      // https://en.wikipedia.org/wiki/Mount_Wilson_Observatory
      q("How tall is Mount Wilson, home of the observatory near L.A.?", ["5,710 feet", "4,350 feet", "7,120 feet", "6,480 feet"], "5,710 feet", 3),
      // https://en.wikipedia.org/wiki/Point_Fermin_Light
      q("L.A.'s Point Fermin Light was built in what year?", ["1874", "1891", "1868", "1903"], "1874", 3),
      // https://en.wikipedia.org/wiki/Point_Fermin_Light
      q("Who designed L.A.'s Point Fermin Light?", ["Paul J. Pelz", "Phineas Marston", "Ammi Young", "George Ballantyne"], "Paul J. Pelz", 3),
      // https://en.wikipedia.org/wiki/Point_Fermin_Light
      q("L.A.'s Point Fermin Light was built with lumber from…", ["redwoods", "Douglas firs", "sugar pines", "cedars"], "redwoods", 3),
      // https://en.wikipedia.org/wiki/Sixth_Street_Viaduct
      q("L.A.'s Sixth Street Viaduct links the Arts District to which neighborhood?", ["Boyle Heights", "Lincoln Heights", "East L.A.", "El Sereno"], "Boyle Heights", 3),
      // https://en.wikipedia.org/wiki/Los_Angeles_River
      q("The Tongva name for the L.A. River, Paayme Paxaayt, means…", ["West River", "Big River", "Dry River", "Sun River"], "West River", 3),
      // https://en.wikipedia.org/wiki/Los_Angeles_River
      q("The L.A. River's headwaters lie in which hills?", ["Simi Hills", "Verdugo Hills", "Puente Hills", "Baldwin Hills"], "Simi Hills", 3),
      // https://en.wikipedia.org/wiki/Ballona_Wetlands
      q("L.A.'s Ballona Wetlands lie just south of…", ["Marina del Rey", "Playa Vista Bay", "Venice Beach", "El Segundo"], "Marina del Rey", 3),
      // https://en.wikipedia.org/wiki/Mulholland_Dam
      q("L.A.'s Mulholland Dam forms which reservoir?", ["Hollywood Reservoir", "Silver Lake", "Stone Canyon", "Encino Reservoir"], "Hollywood Reservoir", 3),
      // https://en.wikipedia.org/wiki/Echo_Park_Lake
      q("L.A.'s Echo Park Lake was first built in the 1860s as a…", ["drinking water reservoir", "public boating lake", "irrigation rice paddy", "winter ice skating pond"], "drinking water reservoir", 3),
      // https://en.wikipedia.org/wiki/MacArthur_Park
      q("L.A.'s MacArthur Park was originally named…", ["Westlake Park", "Eastlake Park", "Sixth Street Park", "Wilshire Park"], "Westlake Park", 3),
      // https://en.wikipedia.org/wiki/Hollywood_Sign
      q("L.A.'s Hollywood Sign was first put up in what year?", ["1923", "1931", "1915", "1940"], "1923", 3),
    ],
  },
  toronto: {
    local: [
      // https://en.wikipedia.org/wiki/Mount_Pleasant_Cemetery,_Toronto
      q("Toronto's Mount Pleasant Cemetery opened in what year?", ["1876", "1891", "1858", "1904"], "1876", 3),
      // https://en.wikipedia.org/wiki/Mount_Pleasant_Cemetery,_Toronto
      q("Toronto's Mount Pleasant Cemetery lies north of which neighbourhood?", ["Moore Park", "Rosedale", "Forest Hill", "Leaside"], "Moore Park", 3),
      // https://en.wikipedia.org/wiki/Casa_Loma
      q("Which architect designed Toronto's Casa Loma?", ["E. J. Lennox", "John Lyle", "Frank Darling", "George Gouinlock"], "E. J. Lennox", 3),
      // https://en.wikipedia.org/wiki/Spadina_House
      q("Toronto's Spadina Museum stands at 285 Spadina…", ["Road", "Avenue", "Crescent", "Boulevard"], "Road", 3),
      // https://en.wikipedia.org/wiki/Campbell_House_(Toronto)
      q("Toronto's Campbell House was built in what year?", ["1822", "1845", "1809", "1837"], "1822", 3),
      // https://en.wikipedia.org/wiki/Campbell_House_(Toronto)
      q("Toronto's Campbell House was built for which chief justice?", ["Sir William Campbell", "Sir John Robinson", "William Osgoode", "Thomas Scott"], "Sir William Campbell", 3),
      // https://en.wikipedia.org/wiki/Mackenzie_House
      q("Toronto's Mackenzie House stands on which street?", ["Bond Street", "Church Street", "Jarvis Street", "Sherbourne Street"], "Bond Street", 3),
      // https://en.wikipedia.org/wiki/Mackenzie_House
      q("William Lyon Mackenzie, of Toronto's Mackenzie House, led a rebellion in…", ["1837", "1812", "1849", "1866"], "1837", 3),
      // https://en.wikipedia.org/wiki/The_Grange_(Toronto)
      q("Toronto's The Grange manor was built in what year?", ["1817", "1834", "1802", "1829"], "1817", 3),
      // https://en.wikipedia.org/wiki/The_Grange_(Toronto)
      q("Toronto's The Grange manor was built for which man?", ["D'Arcy Boulton", "Henry John Boulton", "William Henry Boulton", "George Strange Boulton"], "D'Arcy Boulton", 3),
      // https://en.wikipedia.org/wiki/Colborne_Lodge
      q("Who built Toronto's Colborne Lodge in High Park?", ["John George Howard", "John Howard Payne", "George Allan Howard", "William Howard Jr."], "John George Howard", 3),
      // https://en.wikipedia.org/wiki/Montgomery%27s_Inn
      q("Toronto's Montgomery's Inn stands in which area?", ["Etobicoke", "Scarborough", "North York", "East York"], "Etobicoke", 3),
      // https://en.wikipedia.org/wiki/Gibraltar_Point_Lighthouse
      q("Toronto's Gibraltar Point Lighthouse stands on which point?", ["Hanlan's Point", "Ward's Point", "Centre Point", "Algonquin Point"], "Hanlan's Point", 3),
      // https://en.wikipedia.org/wiki/Bata_Shoe_Museum
      q("Which firm designed Toronto's Bata Shoe Museum building?", ["Moriyama & Teshima", "Diamond and Schmitt", "KPMB Architects", "Zeidler Partnership"], "Moriyama & Teshima", 3),
      // https://en.wikipedia.org/wiki/Gardiner_Museum
      q("Toronto's Gardiner Museum is devoted to which art?", ["ceramics", "textiles", "footwear", "glassware"], "ceramics", 3),
      // https://en.wikipedia.org/wiki/Textile_Museum_of_Canada
      q("Toronto's Textile Museum of Canada was founded in what year?", ["1975", "1962", "1988", "1981"], "1975", 3),
      // https://en.wikipedia.org/wiki/Textile_Museum_of_Canada
      q("Toronto's Textile Museum was first called the Canadian Museum of…", ["Carpets and Textiles", "Weaving and Lace", "Cloth and Fibre", "Rugs and Quilts"], "Carpets and Textiles", 3),
      // https://en.wikipedia.org/wiki/Aga_Khan_Museum
      q("Toronto's Aga Khan Museum is in which district?", ["North York", "Scarborough", "Etobicoke", "East York"], "North York", 3),
      // https://en.wikipedia.org/wiki/Elgin_and_Winter_Garden_Theatres
      q("Toronto's Winter Garden Theatre sits how many storeys above the Elgin?", ["six", "three", "eight", "four"], "six", 3),
      // https://en.wikipedia.org/wiki/Royal_Alexandra_Theatre
      q("Toronto's Royal Alexandra Theatre stands on which street?", ["King Street West", "Queen Street West", "Front Street West", "Adelaide Street West"], "King Street West", 3),
      // https://en.wikipedia.org/wiki/Massey_Hall
      q("Toronto's Massey Hall opened in what year?", ["1894", "1907", "1881", "1913"], "1894", 3),
      // https://en.wikipedia.org/wiki/Old_City_Hall_(Toronto)
      q("Toronto's Old City Hall stands at Queen and which street?", ["Bay Street", "Yonge Street", "Church Street", "University Avenue"], "Bay Street", 3),
      // https://en.wikipedia.org/wiki/Old_City_Hall_(Toronto)
      q("Toronto City Council met in Old City Hall from 1899 until…", ["1966", "1958", "1975", "1949"], "1966", 3),
      // https://en.wikipedia.org/wiki/St._Lawrence_Hall
      q("Toronto's St. Lawrence Hall stands at King Street East and which street?", ["Jarvis Street", "Church Street", "Sherbourne Street", "Parliament Street"], "Jarvis Street", 3),
      // https://en.wikipedia.org/wiki/Allan_Gardens
      q("How many greenhouses does Toronto's Allan Gardens conservatory have?", ["six", "three", "nine", "twelve"], "six", 3),
      // https://en.wikipedia.org/wiki/Scarborough_Bluffs
      q("Which is the only park with a beach along Toronto's Scarborough Bluffs?", ["Bluffer's Park", "Cathedral Bluffs", "Sylvan Park", "Rosetta McClain"], "Bluffer's Park", 3),
      // https://en.wikipedia.org/wiki/Distillery_District
      q("Toronto's Distillery District was the former … Distillery?", ["Gooderham and Worts", "Hiram Walker", "Seagram and Sons", "Corby and Wiser"], "Gooderham and Worts", 3),
      // https://en.wikipedia.org/wiki/Prince_Edward_Viaduct
      q("Toronto's Prince Edward Viaduct links Bloor Street East with…", ["Danforth Avenue", "Pottery Road", "Broadview Avenue", "Mount Pleasant Road"], "Danforth Avenue", 3),
      // https://en.wikipedia.org/wiki/R._C._Harris_Water_Treatment_Plant
      q("Who was the architect of Toronto's R. C. Harris plant?", ["Thomas Canfield Pomphrey", "Edward James Lennox", "John MacIntosh Lyle", "Henry Sproatt and Rolph"], "Thomas Canfield Pomphrey", 3),
      // https://en.wikipedia.org/wiki/Honest_Ed%27s
      q("Toronto's Honest Ed's closed for good on December 31 of…", ["2016", "2007", "2019", "2012"], "2016", 3),
      // https://en.wikipedia.org/wiki/Horseshoe_Tavern
      q("Toronto's Horseshoe Tavern sits at Queen and which street?", ["Spadina", "Bathurst", "Ossington", "Dufferin"], "Spadina", 3),
      // https://en.wikipedia.org/wiki/El_Mocambo
      q("Which band played a surprise 1977 show at Toronto's El Mocambo?", ["The Rolling Stones", "The Grateful Dead", "Led Zeppelin", "The Allman Brothers"], "The Rolling Stones", 3),
      // https://en.wikipedia.org/wiki/Peameal_bacon
      q("Which Toronto pork packer is credited with peameal bacon?", ["William Davies", "Joseph Flavelle", "Timothy Eaton", "John Ross"], "William Davies", 3),
      // https://en.wikipedia.org/wiki/Toronto_Islands
      q("How many small islands make up the Toronto Islands?", ["15", "7", "23", "11"], "15", 3),
      // https://en.wikipedia.org/wiki/Leslie_Street_Spit
      q("Toronto's Leslie Street Spit is officially the Outer Harbour…", ["East Headland", "Breakwater", "Landfill", "Point"], "East Headland", 3),
    ],
  },
};
