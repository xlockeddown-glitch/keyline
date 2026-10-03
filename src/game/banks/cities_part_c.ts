import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

export const CITY_EXTRA_PART_C: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
nyc: {
    local: [
      q("New York City has how many boroughs?", ["4", "5", "6", "12"], "5", 1),
      q("The Staten Island Ferry is famous for being…", ["a toll tunnel only", "free", "a subway line under the harbor as its name", "a helipad"], "free", 1),
      q("The High Line is a…", ["subway line", "park on an old rail viaduct", "bridge to New Jersey", "airport"], "park on an old rail viaduct", 1),
      q("One World Trade Center's height in feet nods to…", ["1492", "1776", "1865", "2001"], "1776", 2),
      q("Central Park was designed by…", ["L'Enfant", "Olmsted and Vaux", "Burnham only", "Moses"], "Olmsted and Vaux", 2),
      q("The subway's first IRT line opened in…", ["1863", "1904", "1932", "1950"], "1904", 3),
      q("Broadway as a street runs the length of…", ["a three-block Theater District strip", "Manhattan (and beyond)", "Brooklyn", "Staten Island"], "Manhattan (and beyond)", 2),
      q("Ellis Island is in…", ["the Hudson at Albany", "New York Harbor", "Long Island Sound", "Jamaica Bay"], "New York Harbor", 2),
      q("The Apollo Theater is in…", ["Greenwich Village", "Harlem", "DUMBO", "Riverdale"], "Harlem", 1),
      q("Wall Street is in…", ["Midtown only", "Lower Manhattan", "the Bronx", "Queens"], "Lower Manhattan", 1),
      q("Grand Central is in…", ["Downtown Brooklyn", "Midtown", "Harlem", "Staten Island"], "Midtown", 1),
      q("The Cloisters museum is in…", ["Coney Island, south Brooklyn", "Fort Tryon Park, northern Manhattan", "Flushing Meadows, Queens", "Red Hook, on the Brooklyn waterfront"], "Fort Tryon Park, northern Manhattan", 3),
      q("Rockefeller Center is in…", ["Battery Park", "Midtown", "Astoria", "Park Slope"], "Midtown", 1),
    ],
    arts: [
      q("Broadway theatre is concentrated around…", ["Wall Street / Lower Manhattan", "Times Square / Midtown", "Coney Island / south Brooklyn", "Harlem / upper Manhattan"], "Times Square / Midtown", 1),
      q("MoMA is in…", ["Brooklyn Heights", "Midtown Manhattan", "Staten Island", "the Bronx Zoo grounds"], "Midtown Manhattan", 1),
    ],
    food: [
      q("A New York slice is typically…", ["deep-dish pizza baked like a pie", "wide, foldable, thin-crust pizza", "square pan pizza with crispy edges", "bagel topped with sauce and cheese"], "wide, foldable, thin-crust pizza", 1),
      q("A chopped cheese is a sandwich of…", ["Staten Island Italian delis", "Upper Manhattan / the Bronx bodegas", "Long Island roadside diners", "New Jersey Turnpike diners"], "Upper Manhattan / the Bronx bodegas", 3),
    ],
  },
london: {
    local: [
      q("The Thames is tidal through…", ["Manchester", "London", "Birmingham", "Edinburgh"], "London", 1),
      q("The Tube is London's…", ["double-decker bus", "underground railway", "airport rail shuttle", "Thames river taxi"], "underground railway", 1),
      q("Big Ben is properly the…", ["whole Palace of Westminster", "Great Bell in the Elizabeth Tower", "bascule span of Tower Bridge", "clock of the Royal Exchange"], "Great Bell in the Elizabeth Tower", 2),
      q("Tower Bridge is not the same as the…", ["Shard skyscraper", "Tower of London", "London Eye wheel", "Gherkin"], "Tower of London", 1),
      q("The Tower of London has long housed the…", ["Bank of England gold", "Crown Jewels", "BBC archives", "Wimbledon trophies"], "Crown Jewels", 1),
      q("Westminster Abbey is a…", ["official residence of the PM", "church of coronations and burials", "football ground in west London", "covered market by the river"], "church of coronations and burials", 1),
      q("The London Eye stands on the…", ["in Hyde Park", "South Bank", "at Greenwich", "in the City's square mile as a parish wheel"], "South Bank", 2),
      q("Greenwich is famed for the…", ["ravens of the Tower of London", "Prime Meridian and Royal Observatory", "Wembley Stadium and its arch", "Heathrow's original terminals"], "Prime Meridian and Royal Observatory", 1),
      q("The City of London, legally, is…", ["all of Greater London as a legal identity of this name", "the historic square mile of finance", "only Westminster", "only Southwark"], "the historic square mile of finance", 2),
      q("Camden Market is in…", ["Greenwich", "north London", "Croydon only", "Heathrow"], "north London", 2),
      q("Notting Hill is famed for a…", ["hogmanay", "Carnival", "Hogwarts fan park", "highland games"], "Carnival", 2),
      q("The Shard is a…", ["suspension bridge", "skyscraper", "covered market", "royal palace"], "skyscraper", 1),
    ],
    arts: [
      q("The West End is London's…", ["Square Mile finance hub", "theatre district", "Docklands port area", "airport zone"], "theatre district", 1),
      q("The British Museum is in…", ["Greenwich", "Bloomsbury", "South Kensington only", "the City's guildhall"], "Bloomsbury", 2),
    ],
    food: [
      q("A full English breakfast often includes…", ["croissants, jam, and café au lait", "eggs, bacon, sausage, and beans", "rice, miso soup, and grilled fish", "porridge, honey, and stewed fruit"], "eggs, bacon, sausage, and beans", 1),
      q("Pie and mash is a…", ["Scottish breakfast plate", "London working-class plate", "Welsh cheese-on-toast supper", "Irish lamb stew from Dublin"], "London working-class plate", 3),
    ],
  },
tucson: {
    local: [
      q("Tucson sits in which desert?", ["the Mojave", "the Sonoran", "the Great Basin only", "the Chihuahuan"], "the Sonoran", 1),
      q("Saguaro National Park flanks Tucson on the…", ["north side, as one unit", "east and west", "south side, by Organ Pipe", "city center"], "east and west", 2),
      q("The University of Arizona is in…", ["Phoenix", "Tucson", "Flagstaff", "Yuma"], "Tucson", 1),
      q("Tucson's historic core includes…", ["Tucson International Airport", "the Presidio and downtown", "the Kitt Peak observatories", "the Nogales border crossing"], "the Presidio and downtown", 2),
      q("Fourth Avenue is a…", ["interstate frontage road", "district of shops and the street fair", "dry riverbed with a bike path", "historic copper mine site"], "district of shops and the street fair", 2),
      q("The Santa Cruz River through Tucson is often…", ["a year-round barge canal", "dry at the surface", "a Great Lake", "tidal"], "dry at the surface", 2),
      q("Mount Lemmon is in the…", ["Grand Canyon", "Santa Catalinas", "White Mountains of N.H.", "Rockies of Colorado only"], "Santa Catalinas", 2),
      q("Kitt Peak is a…", ["ballpark", "observatory west of town", "capitol", "presidio of Spain still garrisoned"], "observatory west of town", 2),
      q("Tucson is in which county?", ["Maricopa", "Pima", "Coconino", "Yavapai"], "Pima", 2),
      q("The Tohono O'odham Nation borders Tucson to the…", ["north and northeast", "west and south", "east, toward the Rincons", "east and southeast"], "west and south", 3),
      q("Old Tucson is a…", ["university research campus", "movie studio and park west of town", "territorial capitol building", "military airfield and boneyard"], "movie studio and park west of town", 3),
      q("Davis-Monthan is an…", ["naval yard", "Air Force base famed for the boneyard", "Army fort of cavalry only", "civilian only airport of Phoenix"], "Air Force base famed for the boneyard", 2),
      q("The Arizona-Sonora Desert Museum near Tucson interprets Sonoran life including…", ["Arctic foxes and snowy owls", "desert invertebrates and arachnids", "penguins and other seabirds", "rainforest frogs of the Amazon"], "desert invertebrates and arachnids", 3),
      q("Southern Arizona's monsoon storms matter to fossorial tarantulas because…", ["flooded burrows force them to migrate to new valleys", "seasonal rains cue surface activity and mating", "lightning strikes cue them to molt", "humidity lets them breathe underwater"], "seasonal rains cue surface activity and mating", 3),

    ],
    food: [
      q("Tucson is a UNESCO City of…", ["Music", "Gastronomy", "Literature", "Film"], "Gastronomy", 2),
      q("Sonoran hot dogs are wrapped in…", ["sauerkraut and spicy brown mustard", "bacon, then piled with beans and toppings", "Cincinnati chili and shredded cheese", "a flour tortilla with green chile"], "bacon, then piled with beans and toppings", 2),
      q("White Sonora wheat and mesquite are part of…", ["New England baking", "the Borderlands food story", "Pacific Northwest salmon", "Cajun roux"], "the Borderlands food story", 3),
    ],
    nature: [
      q("A saguaro is a…", ["conifer tree of the northern taiga", "tall columnar cactus of the Sonoran Desert", "giant kelp of the Pacific coast", "mangrove of the Gulf of California"], "tall columnar cactus of the Sonoran Desert", 1),
      q("The monsoon in southern Arizona is a…", ["winter only snow", "summer thunderstorm season", "year-round drizzle of Seattle", "hurricane of the Gulf as Tucson's weather"], "summer thunderstorm season", 2),
    ],
  },
nola: {
    local: [
      q("The French Quarter is also called the…", ["Garden District", "Vieux Carré", "Bywater", "Marigny"], "Vieux Carré", 2),
      q("Bourbon Street runs through the…", ["Garden District", "French Quarter", "Audubon Park only", "Metairie cemetery only"], "French Quarter", 1),
      q("Jackson Square faces…", ["Lake Pontchartrain's seawall", "the cathedral and the river", "the airport and the bayou", "the Superdome and the arena"], "the cathedral and the river", 1),
      q("The Garden District is famed for…", ["the Quarter's balconies only", "antebellum houses and streetcars", "oil platforms", "only warehouses of the Bywater"], "antebellum houses and streetcars", 2),
      q("St. Charles Avenue is a…", ["interstate spur only", "streetcar line under oaks", "levee of the lake only", "runway"], "streetcar line under oaks", 1),
      q("The Mississippi at New Orleans is held by…", ["no banks", "levees", "only dunes", "fjords"], "levees", 1),
      q("Lake Pontchartrain is north of…", ["the Gulf as a lake of the Quarter", "the city", "Baton Rouge", "Houston"], "the city", 1),
      q("The Garden District's neighbor toward downtown includes the…", ["the Rigolets and the lake passes", "CBD and Warehouse District", "Chalmette and St. Bernard Parish", "Kenner and the airport district"], "CBD and Warehouse District", 2),
      q("Congo Square is in…", ["the Garden District", "Louis Armstrong Park / Treme", "Lafreniere Park / Metairie", "Algiers Point / the West Bank"], "Louis Armstrong Park / Treme", 3),
      q("Treme is a historic…", ["suburb of Baton Rouge on the river", "African American neighborhood next to the Quarter", "landfill district in New Orleans East", "riverside batture across the river in Algiers"], "African American neighborhood next to the Quarter", 2),
      q("The West Bank is…", ["north of the lake only", "across the Mississippi from downtown", "the French Quarter's other name", "Baton Rouge"], "across the Mississippi from downtown", 2),
      q("Mardi Gras Indians are…", ["a tourist krewe from Dallas only", "Black masking traditions of the city", "a Carnival of Mobile", "a jazz funeral's only name"], "Black masking traditions of the city", 3),
      q("A jazz funeral often includes a…", ["ski jump", "second line", "ice palace", "tea ceremony"], "second line", 1),
      q("Above-ground tombs in New Orleans are a response in part to…", ["only fashion of Paris", "a high water table", "permafrost", "bedrock deeper than the Grand Canyon as a must"], "a high water table", 2),
    ],
    food: [
      q("A po' boy is a…", ["Chicago sandwich of dipped Italian beef", "New Orleans sandwich on French bread", "Maine lobster roll in a split-top bun", "Philadelphia cheesesteak on a hoagie"], "New Orleans sandwich on French bread", 1),
      q("A muffuletta is stacked with…", ["roast beef debris and brown gravy", "Italian meats, cheese, and olive salad", "fried shrimp, lettuce, and tomato", "biscuits and white sausage gravy"], "Italian meats, cheese, and olive salad", 2),
      q("Beignets at the Café du Monde are served with…", ["gravy", "powdered sugar", "chili", "syrup of cane"], "powdered sugar", 1),
      q("Gumbo is often thickened with…", ["cornstarch and egg yolks", "roux, okra, and/or filé", "gelatin and bone broth", "heavy cream and butter"], "roux, okra, and/or filé", 2),
      q("Jambalaya is a…", ["flaky pastry filled with crawfish", "rice dish of meat and the trinity", "rum cocktail served in a hurricane glass", "salad of bitter greens and pecans"], "rice dish of meat and the trinity", 1),
    ],
    arts: [
      q("Preservation Hall presents…", ["opera in Latin", "traditional New Orleans jazz", "only brass of marching D.C.", "only country of the Opry"], "traditional New Orleans jazz", 1),
      q("Congo Square is a historic site of…", ["British militia musters and drills", "African and Afro-Caribbean music and dance", "grand opera premieres in French", "early silent-film studios and sets"], "African and Afro-Caribbean music and dance", 2),
    ],
    sports: [
      q("The Saints play at the…", ["Smoothie King as football only", "Caesars Superdome", "Tad Gormley", "Tulane's old home"], "Caesars Superdome", 1),
    ],
  }
};
