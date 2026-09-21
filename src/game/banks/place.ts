import { q } from "../quiz";
import type { PlaceTopic, TriviaCat, TriviaQ } from "../types";

/** Topic plates — encyclopedia-level public facts, drawn when the vault sits on matching ground. */
export const PLACE: Partial<Record<PlaceTopic, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  defense: {
    science: [
      q("Radar is an acronym involving which pair of words?", ["Radio and ranging", "Rail and drone", "Rocket and radius", "Random and array"], "Radio and ranging", 1, "RAdio Detection And Ranging."),
      q("A surface-to-air missile is designed to hit…", ["submarines only", "aircraft or incoming missiles", "tanks in a city block", "satellites as its only job"], "aircraft or incoming missiles", 1),
      q("The U.S. Patriot is primarily a…", ["naval gun", "surface-to-air missile system", "infantry rifle", "space telescope"], "surface-to-air missile system", 1, "Raytheon (now RTX) has long built Patriot."),
      q("AMRAAM, used by U.S. fighters, is a…", ["torpedo", "air-to-air missile", "howitzer shell", "sonar buoy"], "air-to-air missile", 2, "AIM-120. Hughes/Raytheon lineage."),
      q("The AIM-9 Sidewinder is a famous…", ["ballistic ICBM", "heat-seeking air-to-air missile", "depth charge", "anti-ship ram"], "heat-seeking air-to-air missile", 2),
      q("A Tomahawk is a…", ["short-range grenade", "cruise missile", "pistol round", "weather balloon"], "cruise missile", 2),
      q("Mach 1 is…", ["escape velocity", "the speed of sound", "the speed of light", "orbital speed"], "the speed of sound", 1),
      q("An ICBM is built to travel…", ["across a football field", "between continents", "only underwater", "only in the ionosphere as a plane"], "between continents", 2),
    ],
    political: [
      q("The U.S. Department of Defense is headquartered at…", ["Fort Knox", "the Pentagon", "Camp David", "the Capitol dome"], "the Pentagon", 1),
      q("The Pentagon sits in which state?", ["Maryland", "Virginia", "Pennsylvania", "Delaware"], "Virginia", 2, "Arlington County, Virginia."),
      q("DARPA is an agency of…", ["the Department of Education", "the Department of Defense", "the Postal Service", "the Park Service"], "the Department of Defense", 2),
      q("The Secretary of Defense is a member of the…", ["Supreme Court", "U.S. Cabinet", "Federal Reserve board only", "UN General Assembly staff"], "U.S. Cabinet", 1),
    ],
    history: [
      q("Raytheon began in the 1920s as a…", ["desert copper mine", "electronics firm in Massachusetts", "Texas cattle brand", "British shipyard"], "electronics firm in Massachusetts", 2, "Cambridge, Massachusetts, 1922."),
      q("The Cold War arms race pushed the U.S. to build…", ["only sailing ships", "long-range missiles and radar nets", "more canals", "a second Capitol"], "long-range missiles and radar nets", 1),
      q("RTX is the company that includes the old…", ["Raytheon", "Kodak only", "Pan Am", "Woolworth"], "Raytheon", 2),
    ],
    local: [
      q("Raytheon (RTX) Missiles & Defense is a major employer in…", ["Tucson", "Flagstaff only", "Yuma's port", "Page"], "Tucson", 1),
      q("Davis-Monthan Air Force Base sits on which side of Tucson?", ["the northwest mountains only", "the city's southeast", "inside Mexico", "the Grand Canyon rim"], "the city's southeast", 2),
      q("AMARG, the 'boneyard' of stored military aircraft, is at…", ["Davis-Monthan AFB, Tucson", "LAX", "O'Hare", "Heathrow"], "Davis-Monthan AFB, Tucson", 2),
    ],
    math: [
      q("A missile at 400 m/s for 5 seconds covers…", ["80 m", "400 m", "2,000 m", "20,000 m"], "2,000 m", 1),
      q("Mach 2 is how many times the speed of sound?", ["½", "1", "2", "10"], "2", 1),
    ],
  },
  aerospace: {
    science: [
      q("A planetarium is built to show…", ["fish", "the night sky", "ore samples only", "live aircraft"], "the night sky", 1),
      q("Lift on a wing comes mainly from…", ["the landing gear", "air moving over the wing's shape", "the tail number", "cabin pressure alone"], "air moving over the wing's shape", 2),
      q("The first powered airplane flight is credited to the…", ["Wright brothers", "Lindbergh as the builder", "NASA in 1969", "the RAF in 1914"], "Wright brothers", 1),
      q("Low Earth orbit is…", ["on the Moon", "a band of space just above the atmosphere", "inside a hangar", "the Marianas Trench"], "a band of space just above the atmosphere", 2),
    ],
    history: [
      q("The U.S. Air Force became a separate service in…", ["1776", "1918", "1947", "1969"], "1947", 2),
      q("Sputnik, the first artificial satellite, launched in…", ["1945", "1957", "1969", "1981"], "1957", 1),
    ],
    local: [
      q("Pima Air & Space Museum is a large aircraft museum in…", ["Tucson", "Phoenix only", "Albuquerque", "El Paso"], "Tucson", 1),
      q("The aircraft 'boneyard' next to Tucson is officially…", ["AMARG", "NORAD Cave", "Area 51's only hangar", "JPL"], "AMARG", 2),
    ],
  },
  art: {
    arts: [
      q("Impressionism is most tied to 19th-century…", ["Japan's Edo navy", "France", "the Inca court", "Chicago's steel mills"], "France", 1),
      q("Vincent van Gogh's The Starry Night hangs at…", ["the Louvre only", "the Museum of Modern Art, New York", "the British Library", "the Alamo"], "the Museum of Modern Art, New York", 2),
      q("Pablo Picasso is a central figure of…", ["Cubism", "Gregorian chant", "Baroque opera only", "photoreal airline posters"], "Cubism", 1),
      q("A fresco is paint applied to…", ["wet plaster", "polished steel", "ice", "newsprint"], "wet plaster", 2),
      q("The Thinker is a sculpture by…", ["Rodin", "Warhol", "O'Keeffe", "Calder only as a mobile"], "Rodin", 1),
      q("Primary colors in paint are typically…", ["green, orange, purple", "red, blue, yellow", "black, white, grey", "gold, silver, bronze"], "red, blue, yellow", 1),
      q("The Guggenheim Museum in New York was designed by…", ["I. M. Pei only", "Frank Lloyd Wright", "Gaudi", "Christopher Wren"], "Frank Lloyd Wright", 2),
      q("Tate Modern in London occupies a former…", ["royal palace", "power station", "dry dock only", "grain silo in Chicago"], "power station", 2),
      q("American Gothic hangs at the…", ["Tate Britain", "Art Institute of Chicago", "MoMA lobby", "Prado"], "Art Institute of Chicago", 2),
      q("The Metropolitan Museum of Art sits on…", ["Fifth Avenue along Central Park", "Coney Island boardwalk", "the Brooklyn Navy Yard", "Staten Island ferry terminal"], "Fifth Avenue along Central Park", 1),
    ],
    history: [
      q("The Renaissance in painting is associated first with…", ["medieval England only", "Italy", "colonial Virginia", "Meiji Japan"], "Italy", 1),
      q("Leonardo da Vinci painted the Mona Lisa, now in the…", ["Louvre, Paris", "Prado as its only home", "Vatican gift shop", "Uffizi as the Mona"], "Louvre, Paris", 1),
    ],
    local: [
      q("The Blanton Museum of Art belongs to…", ["Rice University", "the University of Texas at Austin", "Texas A&M", "SMU only"], "the University of Texas at Austin", 2),
      q("The Tucson Museum of Art sits in downtown Tucson near…", ["Old Town Artisans / El Presidio", "Mount Lemmon's ski lodge", "the Grand Canyon rim", "Phoenix City Hall"], "Old Town Artisans / El Presidio", 2),
    ],
  },
  sports: {
    sports: [
      q("American football is played with how many downs to gain ten yards?", ["two", "four", "six", "eight"], "four", 1),
      q("A basketball hoop's rim is how many feet above the floor?", ["8", "10", "12", "15"], "10", 1),
    ],
    local: [],
  },
  football: {
    sports: [
      q("NCAA football is played in…", ["four quarters", "nine innings", "two halves of tennis", "three periods of hockey only"], "four quarters", 1),
      q("The Heisman Trophy is awarded in…", ["pro boxing", "college football", "F1", "the NBA draft"], "college football", 1),
    ],
  },
  baseball: {
    sports: [
      q("A regulation baseball game has how many innings (if not extra)?", ["6", "7", "9", "12"], "9", 1),
      q("Wrigley Field is home to the…", ["White Sox", "Chicago Cubs", "Tigers", "Cardinals"], "Chicago Cubs", 1),
    ],
  },
  basketball: {
    sports: [
      q("A made shot from beyond the arc is worth…", ["two points", "three points", "one point", "five points"], "three points", 1),
    ],
  },
  food: {
    food: [
      q("A chimichanga is typically a fried…", ["donut", "burrito", "bagel", "pretzel"], "burrito", 1),
      q("Sonoran-style hot dogs wrap the frank in…", ["kale", "bacon", "nori", "puff pastry only"], "bacon", 2),
    ],
  },
  bbq: {
    food: [
      q("Central Texas barbecue is famous for…", ["boiled lobster", "brisket from a post-oak pit", "raw oysters only", "fondue"], "brisket from a post-oak pit", 1),
      q("Franklin Barbecue is a pit house in…", ["Dallas", "Austin", "Houston", "El Paso"], "Austin", 1),
    ],
  },
  campus: {
    local: [
      q("A 'quad' on a campus is typically…", ["a parking garage only", "a rectangular lawn among buildings", "the football locker", "a dining hall tray"], "a rectangular lawn among buildings", 1),
    ],
    history: [
      q("Land-grant universities in the U.S. trace to the…", ["Morrill Act", "Stamp Act", "Marshall Plan", "NATO charter"], "Morrill Act", 3),
    ],
  },
  library: {
    arts: [
      q("The Dewey Decimal System is used to…", ["score baseball", "classify library books", "tune pianos", "grade beef"], "classify library books", 1),
    ],
    history: [
      q("The Library of Congress is in…", ["Boston", "Washington, D.C.", "Philadelphia only", "New York's City Hall"], "Washington, D.C.", 1),
    ],
  },
  civic: {
    political: [
      q("A city council typically…", ["commands a carrier group", "passes local ordinances", "prints dollars", "appoints Supreme Court justices"], "passes local ordinances", 1),
      q("A courthouse is where a community keeps its…", ["navy", "trials and records", "outfield wall", "orchestra pit only"], "trials and records", 1),
    ],
  },
  capitol: {
    political: [
      q("A state capitol building is the seat of…", ["the city zoo", "the state legislature", "a county sheriff only", "the Federal Reserve"], "the state legislature", 1),
    ],
    history: [
      q("A capitol dome in the U.S. often echoes…", ["a grain silo", "the U.S. Capitol in Washington", "a pagoda", "a minaret only"], "the U.S. Capitol in Washington", 1),
    ],
  },
  church: {
    history: [
      q("A Spanish colonial mission in the Southwest was typically…", ["a ski lodge", "a church and community founded by missionaries", "a gold mint", "a radio tower"], "a church and community founded by missionaries", 1),
      q("San Xavier del Bac is a mission church of the…", ["Gold Rush of 1849", "late 1700s Spanish frontier", "World War I", "the Interstate era"], "late 1700s Spanish frontier", 2, "The present church was finished in 1797."),
    ],
    arts: [
      q("A cathedral's nave is…", ["the bell", "the long central hall", "the gift shop", "the parking crypt only"], "the long central hall", 2),
    ],
  },
  theatre: {
    arts: [
      q("Shakespeare's Globe is a reconstruction of an Elizabethan playhouse in…", ["Paris", "London", "Boston", "Dublin only"], "London", 1),
      q("A proscenium arch frames…", ["the stage opening", "the box office", "the fly tower's roof only", "the alley door"], "the stage opening", 2),
    ],
  },
  music: {
    arts: [
      q("A symphony orchestra is led by a…", ["referee", "conductor", "quarterback", "mayor"], "conductor", 1),
      q("Motown Records is famously tied to…", ["Detroit", "Nashville only", "Liverpool", "Austin's first pit"], "Detroit", 1),
    ],
  },
  park: {
    local: [
      q("A civic park is typically set aside for…", ["open public green", "a private runway", "mineral patents", "a sealed vault only"], "open public green", 1),
    ],
    science: [
      q("Urban trees help a city by…", ["raising the heat island", "shade and cooling", "blocking all rain forever", "replacing water mains"], "shade and cooling", 1),
    ],
  },
  nature: {
    science: [
      q("A saguaro is a giant cactus of the…", ["Sonoran Desert", "Arctic tundra", "Amazon canopy", "Scottish moor"], "Sonoran Desert", 1),
      q("A sky island is a…", ["floating airport", "mountain range rising from desert, with its own climate", "coral atoll only", "subway platform"], "mountain range rising from desert, with its own climate", 2),
    ],
  },
  water: {
    science: [
      q("An ephemeral desert river often…", ["never exists on maps", "runs after storms and sits dry between them", "is a glacier year-round", "is saltwater only"], "runs after storms and sits dry between them", 2),
    ],
  },
  zoo: {
    science: [
      q("A modern zoo's job, besides visitors, is often…", ["oil drilling", "conservation and education", "minting coins", "air-traffic control"], "conservation and education", 1),
    ],
  },
  rail: {
    history: [
      q("Grand Central Terminal is a famous station in…", ["Boston", "New York City", "Philadelphia's navy yard", "Baltimore's harbor only"], "New York City", 1),
      q("The Atchison, Topeka and Santa Fe was a…", ["railroad", "steamboat line only", "stagecoach inn brand", "airline"], "railroad", 2),
    ],
  },
  science: {
    science: [
      q("A meteorite is a space rock that…", ["stayed in orbit", "reached the ground", "is always ice", "is a man-made satellite"], "reached the ground", 1),
    ],
  },
  "natural-history": {
    science: [
      q("Dinosaurs (non-bird) went extinct about…", ["1,000 years ago", "66 million years ago", "in 1492", "last Tuesday"], "66 million years ago", 1),
    ],
    history: [
      q("Natural history museums grew from…", ["only sports halls", "cabinets of curiosity and scientific collecting", "stock exchanges", "missile silos"], "cabinets of curiosity and scientific collecting", 2),
    ],
  },
  history: {
    history: [
      q("Primary sources are…", ["later textbooks only", "documents or objects from the time studied", "always paintings of the event", "Wikipedia talk pages"], "documents or objects from the time studied", 2),
    ],
  },
  memorial: {
    history: [
      q("The National September 11 Memorial sits at…", ["the old World Trade Center site", "Pearl Harbor only", "Gettysburg", "the Arizona Capitol"], "the old World Trade Center site", 1),
    ],
  },
  finance: {
    political: [
      q("The New York Stock Exchange is on…", ["Wall Street", "the National Mall", "Lombard Street", "the Riverwalk"], "Wall Street", 1),
    ],
  },
  hotel: {
    local: [
      q("A historic downtown hotel often sat next to…", ["the rail depot or main street", "an ICBM field", "a glacier", "an oil derrick only"], "the rail depot or main street", 1),
    ],
  },
  bridge: {
    science: [
      q("A suspension bridge hangs the deck from…", ["cables", "a single brick arch only", "balloons", "the riverbed as a pier of ice"], "cables", 1),
    ],
  },
  market: {
    food: [
      q("A public market hall is built for…", ["stalls of food and goods", "only ticketed concerts", "aircraft repair", "a legislature"], "stalls of food and goods", 1),
    ],
  },
  medicine: {
    science: [
      q("A hospital's emergency department is for…", ["scheduled landscaping", "acute care", "lending books", "issuing passports"], "acute care", 1),
    ],
  },
  airport: {
    science: [
      q("A runway heading of 27 points roughly…", ["due east", "due west", "due north", "straight up"], "due west", 2, "Runway numbers are heading ÷ 10. 27 → 270°."),
    ],
  },
};
