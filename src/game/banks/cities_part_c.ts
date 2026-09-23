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
      q("The Brooklyn Bridge opened in…", ["1776", "1811", "1883", "1931"], "1883", 2),
      q("The subway's first IRT line opened in…", ["1863", "1904", "1932", "1950"], "1904", 3),
      q("Broadway as a street runs the length of…", ["only the Theater District as a three-block street", "Manhattan (and beyond)", "only Brooklyn", "only Staten Island"], "Manhattan (and beyond)", 2),
      q("Ellis Island is in…", ["the Hudson at Albany", "New York Harbor (shared jurisdiction lore with New Jersey)", "Long Island Sound only", "Jamaica Bay only"], "New York Harbor (shared jurisdiction lore with New Jersey)", 2),
      q("The Apollo Theater is in…", ["Greenwich Village", "Harlem", "DUMBO", "Riverdale"], "Harlem", 1),
      q("Wall Street is in…", ["Midtown only", "Lower Manhattan", "the Bronx", "Queens"], "Lower Manhattan", 1),
      q("Grand Central is in…", ["Downtown Brooklyn", "Midtown", "Harlem", "Staten Island"], "Midtown", 1),
      q("The Cloisters museum is in…", ["Coney Island", "Fort Tryon Park / northern Manhattan", "JFK", "Red Hook"], "Fort Tryon Park / northern Manhattan", 3),
      q("Rockefeller Center is in…", ["Battery Park", "Midtown", "Astoria", "Park Slope"], "Midtown", 1),
    ],
    arts: [
      q("Broadway theatre is concentrated around…", ["Wall Street", "Times Square / Midtown", "Coney Island", "the Cloisters"], "Times Square / Midtown", 1),
      q("MoMA is in…", ["Brooklyn Heights", "Midtown Manhattan", "Staten Island", "the Bronx Zoo grounds"], "Midtown Manhattan", 1),
    ],
    food: [
      q("A New York slice is typically…", ["deep-dish only", "wide, foldable, thin-crust pizza", "Detroit pan only", "a bagel"], "wide, foldable, thin-crust pizza", 1),
      q("A chopped cheese is a sandwich of…", ["only Staten Island diners", "Upper Manhattan / the Bronx bodegas", "only Long Island diners", "only New Jersey diners"], "Upper Manhattan / the Bronx bodegas", 3),
    ],
  },
london: {
    local: [
      q("The Thames is tidal through…", ["Manchester", "London", "Birmingham", "Edinburgh"], "London", 1),
      q("The Tube is London's…", ["bus only", "underground railway", "airport", "river taxi"], "underground railway", 1),
      q("Big Ben is properly the…", ["whole Houses of Parliament", "Great Bell (the Elizabeth Tower holds it)", "Tower Bridge", "a palace at Kew"], "Great Bell (the Elizabeth Tower holds it)", 2),
      q("Tower Bridge is not the same as the…", ["Shard", "Tower of London", "London Eye", "Gherkin"], "Tower of London", 1),
      q("The Tower of London has long housed the…", ["Bank of England gold only", "Crown Jewels (among other uses)", "BBC archives only", "Wimbledon trophies only"], "Crown Jewels (among other uses)", 1),
      q("Westminster Abbey is a…", ["palace of the PM", "church of coronations and burials", "football ground", "market"], "church of coronations and burials", 1),
      q("The London Eye stands on the…", ["in Hyde Park", "South Bank", "at Greenwich", "in the City's square mile as a parish wheel"], "South Bank", 2),
      q("Greenwich is famed for the…", ["Tower ravens", "Prime Meridian and the old Royal Observatory", "Wembley only", "Heathrow only"], "Prime Meridian and the old Royal Observatory", 1),
      q("The City of London, legally, is…", ["all of Greater London as a legal identity of this name", "the historic square mile of finance", "only Westminster", "only Southwark"], "the historic square mile of finance", 2),
      q("Camden Market is in…", ["Greenwich", "north London", "Croydon only", "Heathrow"], "north London", 2),
      q("Notting Hill is famed for a…", ["hogmanay", "Carnival", "Hogwarts fan park", "highland games"], "Carnival", 2),
      q("The Shard is a…", ["bridge", "skyscraper", "market", "palace"], "skyscraper", 1),
    ],
    arts: [
      q("The West End is London's…", ["finance square mile only", "theatre district", "docklands only", "airport"], "theatre district", 1),
      q("Tate Modern is in a former…", ["palace", "power station", "cathedral", "prison only"], "power station", 2),
      q("The British Museum is in…", ["Greenwich", "Bloomsbury", "South Kensington only", "the City's guildhall"], "Bloomsbury", 2),
    ],
    food: [
      q("A full English breakfast often includes…", ["only croissants", "eggs, bacon, sausage, beans, tomato, toast (and more)", "only sushi", "only porridge as a legal definition"], "eggs, bacon, sausage, beans, tomato, toast (and more)", 1),
      q("Pie and mash is a…", ["Scots breakfast", "London working-class plate (eel liquor in the old shops)", "Welsh rarebit", "Irish stew"], "London working-class plate (eel liquor in the old shops)", 3),
    ],
  },
tucson: {
    local: [
      q("Tucson sits in which desert?", ["the Mojave", "the Sonoran", "the Great Basin only", "the Chihuahuan"], "the Sonoran", 1),
      q("Saguaro National Park flanks Tucson on the…", ["only the north as a single unit", "east and west", "only the south as a park of organ pipe", "only the city center"], "east and west", 2),
      q("The University of Arizona is in…", ["Phoenix", "Tucson", "Flagstaff", "Yuma"], "Tucson", 1),
      q("Tucson's historic core includes…", ["only the airport", "the Presidio and downtown", "only Kitt Peak as downtown", "only Nogales"], "the Presidio and downtown", 2),
      q("Fourth Avenue is a…", ["interstate", "district of shops and the street fair", "dry river only", "mine"], "district of shops and the street fair", 2),
      q("The Santa Cruz River through Tucson is often…", ["a year-round barge canal", "dry at the surface", "a Great Lake", "tidal"], "dry at the surface", 2),
      q("Mount Lemmon is in the…", ["Grand Canyon", "Santa Catalinas", "White Mountains of N.H.", "Rockies of Colorado only"], "Santa Catalinas", 2),
      q("Kitt Peak is a…", ["ballpark", "observatory west of town", "capitol", "presidio of Spain still garrisoned"], "observatory west of town", 2),
      q("Tucson is in which county?", ["Maricopa", "Pima", "Coconino", "Yavapai"], "Pima", 2),
      q("The Tohono O'odham Nation borders Tucson to the…", ["only the Utah line", "west and south (among other lands)", "only New Mexico", "only California"], "west and south (among other lands)", 3),
      q("Old Tucson is a…", ["university", "movie-studio / park west of the city", "capitol", "airport"], "movie-studio / park west of the city", 3),
      q("Davis-Monthan is an…", ["naval yard", "Air Force base famed for the boneyard", "Army fort of cavalry only", "civilian only airport of Phoenix"], "Air Force base famed for the boneyard", 2),
      q("The Arizona-Sonora Desert Museum near Tucson interprets Sonoran life including…", ["only Arctic foxes", "desert invertebrates and the region's arachnids among many taxa", "penguins as natives", "gauge-block labs only"], "desert invertebrates and the region's arachnids among many taxa", 3),
      q("Southern Arizona's monsoon storms matter to fossorial tarantulas because…", ["they freeze solid each night as a rule", "seasonal rains cue surface activity and mating marches", "book lungs fill with LOX", "CMMs flood the burrows"], "seasonal rains cue surface activity and mating marches", 3),

    ],
    food: [
      q("Tucson is a UNESCO City of…", ["Music only", "Gastronomy", "Literature only", "Film only"], "Gastronomy", 2),
      q("Sonoran hot dogs are wrapped in…", ["only sauerkraut", "bacon and piled with beans, onion, tomato, mayo, mustard, jalapeño (the local stack)", "only chili of Cincinnati", "only ketchup"], "bacon and piled with beans, onion, tomato, mayo, mustard, jalapeño (the local stack)", 2),
      q("White Sonora wheat and mesquite are part of…", ["New England baking only", "the Borderlands food story", "Pacific Northwest salmon only", "Cajun roux only"], "the Borderlands food story", 3),
    ],
    nature: [
      q("A saguaro is a…", ["tree of the taiga", "tall columnar cactus of the Sonoran Desert", "kelp", "mangrove"], "tall columnar cactus of the Sonoran Desert", 1),
      q("The monsoon in southern Arizona is a…", ["winter only snow", "summer thunderstorm season", "year-round drizzle of Seattle", "hurricane of the Gulf as Tucson's weather"], "summer thunderstorm season", 2),
    ],
  },
nola: {
    local: [
      q("The French Quarter is also called the…", ["Garden District", "Vieux Carré", "Bywater", "Marigny"], "Vieux Carré", 2),
      q("Bourbon Street runs through the…", ["Garden District", "French Quarter", "Audubon Park only", "Metairie cemetery only"], "French Quarter", 1),
      q("Jackson Square faces…", ["only the lake", "the cathedral and the river", "only the airport", "only the Superdome"], "the cathedral and the river", 1),
      q("The Garden District is famed for…", ["the Quarter's balconies only", "antebellum houses and streetcars", "oil platforms", "only warehouses of the Bywater"], "antebellum houses and streetcars", 2),
      q("St. Charles Avenue is a…", ["interstate spur only", "streetcar line under oaks", "levee of the lake only", "runway"], "streetcar line under oaks", 1),
      q("The Mississippi at New Orleans is held by…", ["no banks", "levees", "only dunes", "fjords"], "levees", 1),
      q("Lake Pontchartrain is north of…", ["the Gulf as a lake of the Quarter", "the city", "Baton Rouge", "Houston"], "the city", 1),
      q("The Garden District's neighbor toward downtown includes the…", ["only the Rigolets", "Central Business District / Warehouse District", "only Chalmette as downtown", "only Kenner downtown"], "Central Business District / Warehouse District", 2),
      q("Congo Square is in…", ["the Garden District", "Louis Armstrong Park / Treme", "Metairie", "the West Bank"], "Louis Armstrong Park / Treme", 3),
      q("Treme is a historic…", ["only a suburb of Baton Rouge", "African American neighborhood next to the Quarter", "only the East as a new landfill", "only the river batture of Algiers"], "African American neighborhood next to the Quarter", 2),
      q("The West Bank is…", ["north of the lake only", "across the Mississippi from downtown", "the French Quarter's other name", "Baton Rouge"], "across the Mississippi from downtown", 2),
      q("Mardi Gras Indians are…", ["a tourist krewe from Dallas only", "Black masking traditions of the city", "a Carnival of Mobile", "a jazz funeral's only name"], "Black masking traditions of the city", 3),
      q("A jazz funeral often includes a…", ["ski jump", "second line", "ice palace", "tea ceremony"], "second line", 1),
      q("Above-ground tombs in New Orleans are a response in part to…", ["only fashion of Paris", "a high water table", "permafrost", "bedrock deeper than the Grand Canyon as a must"], "a high water table", 2),
    ],
    food: [
      q("A po' boy is a…", ["Chicago beef", "New Orleans sandwich on French bread", "lobster roll", "cheesesteak"], "New Orleans sandwich on French bread", 1),
      q("A muffuletta is stacked with…", ["only roast beef debris", "Italian meats, cheese, and olive salad", "only fried shrimp", "only white gravy"], "Italian meats, cheese, and olive salad", 2),
      q("Beignets at the Café du Monde are served with…", ["gravy", "powdered sugar", "chili", "syrup of cane"], "powdered sugar", 1),
      q("Gumbo is often thickened with…", ["only cornstarch", "roux, okra, and/or filé", "only gelatin", "only cream"], "roux, okra, and/or filé", 2),
      q("Jambalaya is a…", ["only a pastry", "rice dish of meat and the trinity", "only a cocktail", "only a salad of greens"], "rice dish of meat and the trinity", 1),
    ],
    arts: [
      q("Preservation Hall presents…", ["opera in Latin", "traditional New Orleans jazz", "only brass of marching D.C.", "only country of the Opry"], "traditional New Orleans jazz", 1),
      q("Congo Square is a historic site of…", ["only British musters", "African and Afro-Caribbean music and gathering", "only opera", "only film studios of Hollywood"], "African and Afro-Caribbean music and gathering", 2),
    ],
    sports: [
      q("The Saints play at the…", ["Smoothie King as football only", "Caesars Superdome", "Tad Gormley", "Tulane's old home"], "Caesars Superdome", 1),
    ],
  }
};
