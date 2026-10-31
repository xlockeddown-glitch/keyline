import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * 0.1.90 trivia batch (2026-10-31): thinnest topics grown (geography, books, music, food, arts); no math (deck cap).
 * Evergreen facts only. Each card cites the Wikipedia article it was checked against; the answer was
 * confirmed present in that article text before the card was kept.
 */
export const PLUS_20261031: Record<"geography" | "books" | "music" | "food" | "arts", TriviaQ[]> = {
	geography: [
		// https://en.wikipedia.org/wiki/Iberian_Peninsula
		q("Spain and Portugal share which peninsula?", ["Balkan Peninsula", "Italian Peninsula", "Iberian Peninsula", "Jutland"], "Iberian Peninsula", 1),
		// https://en.wikipedia.org/wiki/Jutland
		q("The Jutland peninsula is mostly part of which country?", ["Norway", "Denmark", "Sweden", "Netherlands"], "Denmark", 1),
		// https://en.wikipedia.org/wiki/Scandinavian_Peninsula
		q("Norway and Sweden share which peninsula?", ["Scandinavian Peninsula", "Kola Peninsula", "Jutland", "Iberian Peninsula"], "Scandinavian Peninsula", 2),
		// https://en.wikipedia.org/wiki/Yucat%C3%A1n_Peninsula
		q("Cancún sits on which peninsula?", ["Yucatán", "Baja California", "Florida", "Osa"], "Yucatán", 2),
		// https://en.wikipedia.org/wiki/Baja_California_peninsula
		q("The Gulf of California separates mainland Mexico from which peninsula?", ["Baja California", "Yucatán Peninsula", "Florida Peninsula", "Olympic Peninsula"], "Baja California", 2),
		// https://en.wikipedia.org/wiki/Kamchatka_Peninsula
		q("The volcanic Kamchatka Peninsula belongs to which country?", ["Russia", "Japan", "China", "Canada"], "Russia", 2),
		// https://en.wikipedia.org/wiki/Sinai_Peninsula
		q("The Sinai Peninsula belongs to which country?", ["Egypt", "Israel", "Jordan", "Saudi Arabia"], "Egypt", 1),
		// https://en.wikipedia.org/wiki/Arabian_Peninsula
		q("Which is the largest peninsula in the world?", ["Indian subcontinent", "Scandinavian Peninsula", "Iberian Peninsula", "Arabian Peninsula"], "Arabian Peninsula", 2),
		// https://en.wikipedia.org/wiki/Upper_Peninsula_of_Michigan
		q("Michigan's Upper Peninsula is joined to the Lower by which bridge?", ["Ambassador Bridge", "Blue Water Bridge", "Mackinac Bridge", "Zilwaukee Bridge"], "Mackinac Bridge", 2),
		// https://en.wikipedia.org/wiki/Red_Sea
		q("Which sea separates Africa from the Arabian Peninsula?", ["Red Sea", "Black Sea", "Arabian Sea", "Caspian Sea"], "Red Sea", 1),
		// https://en.wikipedia.org/wiki/Black_Sea
		q("Which sea lies north of Turkey?", ["Red Sea", "Aegean Sea", "Black Sea", "Ionian Sea"], "Black Sea", 1),
		// https://en.wikipedia.org/wiki/Aegean_Sea
		q("Which sea lies between Greece and Turkey?", ["Tyrrhenian Sea", "Ligurian Sea", "Aegean Sea", "Baltic Sea"], "Aegean Sea", 2),
		// https://en.wikipedia.org/wiki/Baltic_Sea
		q("Which sea borders Estonia, Latvia and Lithuania?", ["Baltic Sea", "North Sea", "Norwegian Sea", "Barents Sea"], "Baltic Sea", 2),
		// https://en.wikipedia.org/wiki/Tyrrhenian_Sea
		q("Which sea lies off Italy's west coast, by Naples?", ["Tyrrhenian Sea", "Adriatic Sea", "Ionian Sea", "Aegean Sea"], "Tyrrhenian Sea", 2),
		// https://en.wikipedia.org/wiki/Dead_Sea
		q("The Dead Sea lies between Jordan and…", ["Israel", "Egypt", "Syria", "Lebanon"], "Israel", 1),
		// https://en.wikipedia.org/wiki/Dead_Sea
		q("Which body of water's shore is the lowest land point on Earth?", ["Caspian Sea", "Lake Assal", "Salton Sea", "Dead Sea"], "Dead Sea", 2),
		// https://en.wikipedia.org/wiki/Hudson_Bay
		q("Which large bay cuts into northern Canada?", ["Baffin Bay", "James Bay", "Ungava Bay", "Hudson Bay"], "Hudson Bay", 2),
		// https://en.wikipedia.org/wiki/Bay_of_Fundy
		q("Which bay between New Brunswick and Nova Scotia has some of the world's highest tides?", ["Chesapeake Bay", "Hudson Bay", "Bay of Fundy", "Cape Cod Bay"], "Bay of Fundy", 3),
		// https://en.wikipedia.org/wiki/Chesapeake_Bay
		q("Which is the largest estuary in the United States?", ["Puget Sound", "Chesapeake Bay", "San Francisco Bay", "Tampa Bay"], "Chesapeake Bay", 2),
		// https://en.wikipedia.org/wiki/Puget_Sound
		q("Seattle sits on which inlet?", ["Chesapeake Bay", "Cook Inlet", "Puget Sound", "Monterey Bay"], "Puget Sound", 2),
		// https://en.wikipedia.org/wiki/Strait_of_Hormuz
		q("The Musandam Peninsula, on the Strait of Hormuz, belongs to which country?", ["Iran", "Qatar", "Kuwait", "Oman"], "Oman", 3),
		// https://en.wikipedia.org/wiki/Bass_Strait
		q("Which strait separates Tasmania from mainland Australia?", ["Torres Strait", "Cook Strait", "Bass Strait", "Strait of Malacca"], "Bass Strait", 2),
		// https://en.wikipedia.org/wiki/Cook_Strait
		q("Which strait separates New Zealand's North and South islands?", ["Bass Strait", "Cook Strait", "Foveaux Strait", "Tasman Strait"], "Cook Strait", 2),
		// https://en.wikipedia.org/wiki/Strait_of_Malacca
		q("Which strait runs between the Malay Peninsula and Sumatra?", ["Sunda Strait", "Lombok Strait", "Strait of Malacca", "Taiwan Strait"], "Strait of Malacca", 3),
		// https://en.wikipedia.org/wiki/Dardanelles
		q("The Dardanelles strait is in which country?", ["Greece", "Egypt", "Cyprus", "Turkey"], "Turkey", 2),
		// https://en.wikipedia.org/wiki/Mount_Kilimanjaro
		q("Mount Kilimanjaro is in which country?", ["Kenya", "Tanzania", "Uganda", "Ethiopia"], "Tanzania", 1),
		// https://en.wikipedia.org/wiki/Mount_Elbrus
		q("Which is the highest mountain in Europe, in the Caucasus?", ["Mont Blanc", "Matterhorn", "Mount Olympus", "Mount Elbrus"], "Mount Elbrus", 2),
		// https://en.wikipedia.org/wiki/Aconcagua
		q("Aconcagua, the highest peak outside Asia, is in which country?", ["Argentina", "Chile", "Peru", "Bolivia"], "Argentina", 2),
		// https://en.wikipedia.org/wiki/Vinson_Massif
		q("What is the highest mountain in Antarctica?", ["Mount Erebus", "Vinson Massif", "Mount Kirkpatrick", "Mount Terror"], "Vinson Massif", 3),
		// https://en.wikipedia.org/wiki/K2
		q("The world's second-highest mountain is…", ["Kangchenjunga", "Lhotse", "K2", "Makalu"], "K2", 1),
		// https://en.wikipedia.org/wiki/Mount_Olympus
		q("Mount Olympus, home of the gods in myth, is in…", ["Italy", "Turkey", "Cyprus", "Greece"], "Greece", 2),
		// https://en.wikipedia.org/wiki/Mount_Etna
		q("Mount Etna is an active volcano on which island?", ["Sardinia", "Sicily", "Corsica", "Crete"], "Sicily", 1),
		// https://en.wikipedia.org/wiki/Mount_Vesuvius
		q("Which volcano buried Pompeii in AD 79?", ["Mount Etna", "Mount Vesuvius", "Stromboli", "Mount Olympus"], "Mount Vesuvius", 1),
		// https://en.wikipedia.org/wiki/Mount_St._Helens
		q("Mount St. Helens, which erupted in 1980, is in which state?", ["Washington", "Oregon", "California", "Idaho"], "Washington", 2),
		// https://en.wikipedia.org/wiki/Atlas_Mountains
		q("The Atlas Mountains run across Morocco, Algeria and…", ["Tunisia", "Egypt", "Libya", "Mali"], "Tunisia", 2),
		// https://en.wikipedia.org/wiki/Ural_Mountains
		q("Which mountain range runs north to south through western Russia?", ["Carpathians", "Caucasus", "Altai", "Urals"], "Urals", 2),
		// https://en.wikipedia.org/wiki/Carpathian_Mountains
		q("Transylvania is ringed by which mountain range?", ["Alps", "Balkans", "Carpathians", "Dinaric Alps"], "Carpathians", 3),
		// https://en.wikipedia.org/wiki/Rhine
		q("Cologne sits on which river?", ["Elbe", "Main", "Rhine", "Danube"], "Rhine", 2),
		// https://en.wikipedia.org/wiki/Elbe
		q("Hamburg sits on which river?", ["Rhine", "Weser", "Elbe", "Oder"], "Elbe", 3),
		// https://en.wikipedia.org/wiki/Yangtze
		q("Which is the longest river in Asia?", ["Yangtze", "Yellow River", "Mekong", "Ganges"], "Yangtze", 2),
		// https://en.wikipedia.org/wiki/Mississippi_River
		q("Which river flows past Memphis and New Orleans?", ["Ohio", "Missouri", "Mississippi", "Tennessee"], "Mississippi", 1),
		// https://en.wikipedia.org/wiki/St._Lawrence_River
		q("Which river drains the Great Lakes into the Atlantic?", ["Hudson River", "Niagara River", "Ottawa River", "St. Lawrence"], "St. Lawrence", 2),
		// https://en.wikipedia.org/wiki/Hudson_River
		q("Which river flows along Manhattan's west side?", ["East River", "Hudson", "Harlem", "Delaware"], "Hudson", 1),
		// https://en.wikipedia.org/wiki/Potomac_River
		q("Washington, D.C. sits on which river?", ["Delaware", "Potomac", "James", "Susquehanna"], "Potomac", 2),
		// https://en.wikipedia.org/wiki/Indus_River
		q("Which river runs the length of Pakistan?", ["Ganges", "Brahmaputra", "Indus", "Jhelum"], "Indus", 3),
		// https://en.wikipedia.org/wiki/Niger_River
		q("Which river flows past Timbuktu and Niamey?", ["Congo", "Niger", "Senegal", "Volta"], "Niger", 3),
		// https://en.wikipedia.org/wiki/Lake_Baikal
		q("Lake Baikal is in which country?", ["Russia", "Mongolia", "China", "Kazakhstan"], "Russia", 1),
		// https://en.wikipedia.org/wiki/Lake_Tanganyika
		q("Which is the longest freshwater lake in the world?", ["Lake Tanganyika", "Lake Baikal", "Lake Malawi", "Lake Superior"], "Lake Tanganyika", 3),
		// https://en.wikipedia.org/wiki/Lake_Okeechobee
		q("Which is the largest freshwater lake wholly in Florida?", ["Lake George", "Lake Tohopekaliga", "Lake Okeechobee", "Lake Apopka"], "Lake Okeechobee", 2),
		// https://en.wikipedia.org/wiki/Borneo
		q("Borneo is shared by Indonesia, Brunei and…", ["Malaysia", "Thailand", "Philippines", "Papua New Guinea"], "Malaysia", 2),
		// https://en.wikipedia.org/wiki/Ireland
		q("Northern Ireland is part of which country?", ["United Kingdom", "Ireland", "Scotland", "Isle of Man"], "United Kingdom", 1),
		// https://en.wikipedia.org/wiki/Crete
		q("Which is the largest Greek island?", ["Crete", "Rhodes", "Corfu", "Euboea"], "Crete", 1),
		// https://en.wikipedia.org/wiki/Hokkaido
		q("Sapporo is the largest city on which Japanese island?", ["Honshu", "Kyushu", "Hokkaido", "Shikoku"], "Hokkaido", 2),
		// https://en.wikipedia.org/wiki/Gobi_Desert
		q("Which desert is famous for early finds of dinosaur eggs in the 1920s?", ["Sahara", "Gobi", "Atacama", "Mojave"], "Gobi", 3),
		// https://en.wikipedia.org/wiki/Great_Victoria_Desert
		q("Which is the largest desert in Australia?", ["Great Victoria Desert", "Great Sandy Desert", "Great Gibson Desert", "Great Tanami Desert"], "Great Victoria Desert", 3),
		// https://en.wikipedia.org/wiki/Patagonia
		q("Patagonia is shared by Argentina and…", ["Chile", "Uruguay", "Brazil", "Paraguay"], "Chile", 2),
		// https://en.wikipedia.org/wiki/Andorra
		q("Andorra lies between France and…", ["Italy", "Switzerland", "Spain", "Portugal"], "Spain", 1),
		// https://en.wikipedia.org/wiki/Liechtenstein
		q("Liechtenstein lies between Switzerland and…", ["Germany", "Italy", "Austria", "France"], "Austria", 2),
		// https://en.wikipedia.org/wiki/San_Marino
		q("San Marino is surrounded entirely by…", ["France", "Spain", "Italy", "Switzerland"], "Italy", 2),
		// https://en.wikipedia.org/wiki/Monaco
		q("Monaco sits on the coast of which sea?", ["Adriatic Sea", "Tyrrhenian Sea", "Mediterranean", "Ionian Sea"], "Mediterranean", 1),
		// https://en.wikipedia.org/wiki/Mongolia
		q("Mongolia lies between China and…", ["Kazakhstan", "India", "North Korea", "Russia"], "Russia", 1),
		// https://en.wikipedia.org/wiki/Portugal
		q("Which is the only country that borders Portugal?", ["Spain", "France", "Morocco", "Andorra"], "Spain", 1),
		// https://en.wikipedia.org/wiki/Haiti
		q("Haiti shares its island with…", ["Dominican Republic", "Puerto Rico", "Saint Kitts and Nevis", "Antigua and Barbuda"], "Dominican Republic", 1),
		// https://en.wikipedia.org/wiki/Ecuador
		q("Which country is named for the line that crosses it?", ["Colombia", "Peru", "Ecuador", "Gabon"], "Ecuador", 1),
		// https://en.wikipedia.org/wiki/Bolivia
		q("Which South American country besides Paraguay has no coastline?", ["Peru", "Ecuador", "Bolivia", "Uruguay"], "Bolivia", 2),
		// https://en.wikipedia.org/wiki/Chile
		q("Which country is a long, thin strip down South America's west coast?", ["Peru", "Argentina", "Ecuador", "Chile"], "Chile", 1),
		// https://en.wikipedia.org/wiki/Antarctica
		q("The South Pole is on which continent?", ["Australia", "South America", "Asia", "Antarctica"], "Antarctica", 1),
		// https://en.wikipedia.org/wiki/Mammoth_Cave_National_Park
		q("Mammoth Cave, the world's longest known cave system, is in…", ["Kentucky", "Tennessee", "Missouri", "Virginia"], "Kentucky", 2),
		// https://en.wikipedia.org/wiki/Lake_Nicaragua
		q("Which is the largest lake in Central America?", ["Lake Atitlán", "Lake Nicaragua", "Lake Managua", "Lake Gatún"], "Lake Nicaragua", 2),
		// https://en.wikipedia.org/wiki/Gatun_Lake
		q("Which artificial lake forms a large part of the Panama Canal's route?", ["Lake Nicaragua", "Lake Alajuela", "Lake Yojoa", "Gatun Lake"], "Gatun Lake", 3),
		// https://en.wikipedia.org/wiki/Lake_Atitl%C3%A1n
		q("Lake Atitlán, ringed by volcanoes, is in which country?", ["Honduras", "El Salvador", "Guatemala", "Nicaragua"], "Guatemala", 3),
		// https://en.wikipedia.org/wiki/Belize
		q("Which Central American country has English as its official language?", ["Belize", "Honduras", "Costa Rica", "Panama"], "Belize", 1),
		// https://en.wikipedia.org/wiki/Suriname
		q("Which South American country has Dutch as its official language?", ["Guyana", "French Guiana", "Venezuela", "Suriname"], "Suriname", 3),
		// https://en.wikipedia.org/wiki/Guyana
		q("Which South American country has English as its official language?", ["Suriname", "Belize", "Guyana", "Uruguay"], "Guyana", 2),
		// https://en.wikipedia.org/wiki/French_Guiana
		q("Which part of South America is an overseas region of France?", ["Suriname", "Guyana", "French Guiana", "Falkland Islands"], "French Guiana", 3),
		// https://en.wikipedia.org/wiki/Falkland_Islands
		q("The Falkland Islands are a territory of…", ["Argentina", "Chile", "France", "the UK"], "the UK", 1),
		// https://en.wikipedia.org/wiki/Easter_Island
		q("Easter Island, home of the moai statues, belongs to…", ["Peru", "Ecuador", "Chile", "France"], "Chile", 2),
		// https://en.wikipedia.org/wiki/Tierra_del_Fuego
		q("The archipelago at South America's tip, split by Chile and Argentina, is…", ["Chiloé", "the Falklands", "South Georgia", "Tierra del Fuego"], "Tierra del Fuego", 3),
		// https://en.wikipedia.org/wiki/Ushuaia
		q("Which Argentine city is often called the southernmost city in the world?", ["Punta Arenas", "Ushuaia", "Río Gallegos", "Puerto Williams"], "Ushuaia", 3),
		// https://en.wikipedia.org/wiki/Lake_Maracaibo
		q("Lake Maracaibo is in which country?", ["Colombia", "Venezuela", "Ecuador", "Peru"], "Venezuela", 1),
		// https://en.wikipedia.org/wiki/Orinoco
		q("Which river flows through Venezuela to the Atlantic?", ["Magdalena", "Paraná", "Orinoco", "Essequibo"], "Orinoco", 3),
		// https://en.wikipedia.org/wiki/Paran%C3%A1_River
		q("Which river joins the Uruguay River to form the Río de la Plata?", ["Paraguay", "Pilcomayo", "Iguazu", "Paraná"], "Paraná", 3),
		// https://en.wikipedia.org/wiki/R%C3%ADo_de_la_Plata
		q("Buenos Aires and Montevideo both sit on the…", ["Amazon", "Río de la Plata", "Orinoco", "Paraná delta"], "Río de la Plata", 3),
		// https://en.wikipedia.org/wiki/Salar_de_Uyuni
		q("The Salar de Uyuni, the world's largest salt flat, is in…", ["Bolivia", "Chile", "Peru", "Argentina"], "Bolivia", 1),
		// https://en.wikipedia.org/wiki/Svalbard
		q("The Arctic archipelago of Svalbard belongs to…", ["Denmark", "Norway", "Russia", "Iceland"], "Norway", 2),
		// https://en.wikipedia.org/wiki/%C3%85land
		q("The Åland Islands, in the Baltic Sea, are an autonomous region of…", ["Sweden", "Finland", "Estonia", "Denmark"], "Finland", 3),
		// https://en.wikipedia.org/wiki/Gotland
		q("Gotland, the largest island in the Baltic Sea, belongs to…", ["Finland", "Denmark", "Estonia", "Sweden"], "Sweden", 2),
		// https://en.wikipedia.org/wiki/Isle_of_Man
		q("The Isle of Man lies in which sea?", ["North Sea", "Celtic Sea", "Hebrides Sea", "Irish Sea"], "Irish Sea", 3),
		// https://en.wikipedia.org/wiki/Channel_Islands
		q("Jersey and Guernsey are known as the…", ["Channel Islands", "Scilly Isles", "Hebrides", "Orkney Islands"], "Channel Islands", 2),
		// https://en.wikipedia.org/wiki/Orkney
		q("Skara Brae, a Stone Age village, is on which Scottish islands?", ["Shetland", "Hebrides", "Orkney", "Arran"], "Orkney", 3),
		// https://en.wikipedia.org/wiki/Ben_Nevis
		q("What is the highest mountain in the British Isles?", ["Snowdon", "Ben Nevis", "Scafell Pike", "Carrauntoohil"], "Ben Nevis", 1),
		// https://en.wikipedia.org/wiki/Snowdon
		q("What is the highest mountain in Wales?", ["Snowdon", "Ben Nevis", "Cadair Idris", "Pen y Fan"], "Snowdon", 2),
		// https://en.wikipedia.org/wiki/Loch_Ness
		q("Loch Ness is in which country?", ["Ireland", "Wales", "England", "Scotland"], "Scotland", 1),
		// https://en.wikipedia.org/wiki/River_Shannon
		q("Which is the longest river in Ireland?", ["Shannon", "Liffey", "Boyne", "Lee"], "Shannon", 2),
		// https://en.wikipedia.org/wiki/River_Severn
		q("Which is the longest river in Great Britain?", ["Thames", "Trent", "Severn", "Wye"], "Severn", 3),
		// https://en.wikipedia.org/wiki/Lake_District
		q("Lake Windermere is in which English national park?", ["Peak District", "Dartmoor", "Snowdonia", "Lake District"], "Lake District", 1),
		// https://en.wikipedia.org/wiki/Giant%27s_Causeway
		q("The Giant's Causeway's basalt columns are in…", ["Northern Ireland", "northern Scotland", "western Wales", "southern Iceland"], "Northern Ireland", 2),
		// https://en.wikipedia.org/wiki/Cliffs_of_Moher
		q("The Cliffs of Moher are in which Irish county?", ["Clare", "Kerry", "Galway", "Cork"], "Clare", 3),
		// https://en.wikipedia.org/wiki/Dolomites
		q("The Dolomites are a mountain range in northeastern…", ["Italy", "Austria", "Slovenia", "France"], "Italy", 2),
		// https://en.wikipedia.org/wiki/Lake_Como
		q("Lake Como is in which Italian region?", ["Piedmont", "Veneto", "Lombardy", "Tuscany"], "Lombardy", 2),
		// https://en.wikipedia.org/wiki/Amalfi_Coast
		q("The Amalfi Coast is on which Italian gulf?", ["Gulf of Genoa", "Gulf of Taranto", "Gulf of Venice", "Gulf of Salerno"], "Gulf of Salerno", 2),
		// https://en.wikipedia.org/wiki/Cinque_Terre
		q("Cinque Terre's five villages lie in which Italian region?", ["Tuscany", "Campania", "Sicily", "Liguria"], "Liguria", 3),
		// https://en.wikipedia.org/wiki/Po_(river)
		q("Which is the longest river in Italy?", ["Po", "Tiber", "Arno", "Adige"], "Po", 1),
		// https://en.wikipedia.org/wiki/Loire
		q("Which is the longest river entirely in France?", ["Seine", "Loire", "Rhône", "Garonne"], "Loire", 2),
		// https://en.wikipedia.org/wiki/Massif_Central
		q("The Massif Central is a highland region in…", ["Spain", "France", "Germany", "Switzerland"], "France", 2),
		// https://en.wikipedia.org/wiki/Mont-Saint-Michel
		q("Mont Saint-Michel, a tidal island abbey, is in which French region?", ["Normandy", "Brittany", "Provence", "Burgundy"], "Normandy", 3),
		// https://en.wikipedia.org/wiki/Camargue
		q("The Camargue, known for white horses and flamingos, is the delta of the…", ["Loire", "Rhône", "Garonne", "Seine"], "Rhône", 3),
		// https://en.wikipedia.org/wiki/Black_Forest
		q("The Black Forest is in which German state?", ["Rhineland-Palatinate", "North Rhine-Westphalia", "Baden-Württemberg", "Mecklenburg-Vorpommern"], "Baden-Württemberg", 3),
		// https://en.wikipedia.org/wiki/Zugspitze
		q("Germany's highest peak is the…", ["Watzmann", "Brocken", "Zugspitze", "Feldberg"], "Zugspitze", 2),
		// https://en.wikipedia.org/wiki/Lake_Constance
		q("Lake Constance is shared by Germany, Austria and…", ["Switzerland", "Liechtenstein", "France", "Italy"], "Switzerland", 3),
		// https://en.wikipedia.org/wiki/Grossglockner
		q("Austria's highest mountain is the…", ["Wildspitze", "Dachstein", "Grossglockner", "Zugspitze"], "Grossglockner", 3),
		// https://en.wikipedia.org/wiki/Lake_Balaton
		q("Lake Balaton is the largest lake in…", ["Austria", "Hungary", "Slovakia", "Croatia"], "Hungary", 2),
		// https://en.wikipedia.org/wiki/Plitvice_Lakes_National_Park
		q("Plitvice Lakes National Park is in…", ["Slovenia", "Croatia", "Bosnia and Herzegovina", "Montenegro"], "Croatia", 2),
		// https://en.wikipedia.org/wiki/Lake_Bled
		q("Lake Bled, with its island church, is in…", ["Croatia", "Austria", "Slovakia", "Slovenia"], "Slovenia", 3),
		// https://en.wikipedia.org/wiki/Bay_of_Kotor
		q("The Bay of Kotor is in which country?", ["Croatia", "Montenegro", "Albania", "Greece"], "Montenegro", 3),
		// https://en.wikipedia.org/wiki/Meteora
		q("Meteora's monasteries sit on rock pillars in which country?", ["Greece", "Bulgaria", "Turkey", "Serbia"], "Greece", 2),
		// https://en.wikipedia.org/wiki/Santorini
		q("Santorini belongs to which Greek island group?", ["Dodecanese", "Ionian Islands", "Sporades", "Cyclades"], "Cyclades", 1),
		// https://en.wikipedia.org/wiki/Corfu
		q("Corfu lies in which sea?", ["Aegean Sea", "Adriatic Sea", "Ionian Sea", "Libyan Sea"], "Ionian Sea", 3),
		// https://en.wikipedia.org/wiki/Cappadocia
		q("Cappadocia, famed for fairy chimneys and balloon rides, is in…", ["Greece", "Turkey", "Iran", "Armenia"], "Turkey", 2),
		// https://en.wikipedia.org/wiki/Mount_Ararat
		q("Mount Ararat is in which country?", ["Armenia", "Iran", "Georgia", "Turkey"], "Turkey", 2),
		// https://en.wikipedia.org/wiki/Pamukkale
		q("Pamukkale's white travertine terraces are in…", ["Turkey", "Greece", "Iran", "Jordan"], "Turkey", 3),
		// https://en.wikipedia.org/wiki/Wadi_Rum
		q("The desert valley Wadi Rum is in…", ["Jordan", "Egypt", "Saudi Arabia", "Israel"], "Jordan", 3),
		// https://en.wikipedia.org/wiki/Mount_Sinai
		q("Saint Catherine's Monastery sits at the foot of which mountain?", ["Mount Nebo", "Mount Hermon", "Mount Tabor", "Mount Sinai"], "Mount Sinai", 3),
		// https://en.wikipedia.org/wiki/Socotra
		q("Socotra, with its dragon's blood trees, belongs to…", ["Oman", "Yemen", "Somalia", "Djibouti"], "Yemen", 3),
		// https://en.wikipedia.org/wiki/Rub%27_al_Khali
		q("The Rub' al Khali, the 'Empty Quarter', is a desert on which peninsula?", ["Sinai", "Anatolian", "Indian", "Arabian"], "Arabian", 3),
		// https://en.wikipedia.org/wiki/Zagros_Mountains
		q("The Zagros Mountains are mainly in…", ["Afghanistan", "Pakistan", "Turkmenistan", "Iran"], "Iran", 3),
		// https://en.wikipedia.org/wiki/Hindu_Kush
		q("The Hindu Kush range runs mainly through Afghanistan and…", ["Iran", "Pakistan", "India", "Tajikistan"], "Pakistan", 3),
		// https://en.wikipedia.org/wiki/Khyber_Pass
		q("The Khyber Pass links Pakistan with…", ["Turkmenistan", "Kazakhstan", "Afghanistan", "Uzbekistan"], "Afghanistan", 3),
		// https://en.wikipedia.org/wiki/Aral_Sea
		q("The shrinking Aral Sea is shared by Kazakhstan and…", ["Uzbekistan", "Turkmenistan", "Russia", "Kyrgyzstan"], "Uzbekistan", 3),
		// https://en.wikipedia.org/wiki/Issyk-Kul
		q("Lake Issyk-Kul is in which country?", ["Kazakhstan", "Kyrgyzstan", "Tajikistan", "Uzbekistan"], "Kyrgyzstan", 3),
		// https://en.wikipedia.org/wiki/Tibetan_Plateau
		q("Which plateau is called 'the Roof of the World'?", ["Tibetan Plateau", "Deccan Plateau", "Pamir Plateau", "Iranian Plateau"], "Tibetan Plateau", 2),
		// https://en.wikipedia.org/wiki/Deccan_Plateau
		q("The Deccan Plateau covers much of which country?", ["Pakistan", "India", "Bangladesh", "Sri Lanka"], "India", 2),
		// https://en.wikipedia.org/wiki/Thar_Desert
		q("The Thar Desert straddles India and…", ["Afghanistan", "Nepal", "Pakistan", "Bangladesh"], "Pakistan", 3),
		// https://en.wikipedia.org/wiki/Brahmaputra_River
		q("Which river joins the Ganges to form a vast delta in Bangladesh?", ["Brahmaputra", "Indus", "Yamuna", "Godavari"], "Brahmaputra", 3),
		// https://en.wikipedia.org/wiki/Sundarbans
		q("The Sundarbans mangrove forest is shared by India and…", ["Myanmar", "Bangladesh", "Sri Lanka", "Nepal"], "Bangladesh", 3),
		// https://en.wikipedia.org/wiki/H%E1%BA%A1_Long_Bay
		q("Ha Long Bay, with thousands of limestone islands, is in…", ["Thailand", "Philippines", "Vietnam", "Malaysia"], "Vietnam", 1),
		// https://en.wikipedia.org/wiki/Tonle_Sap
		q("Tonlé Sap, the largest lake in Southeast Asia, is in…", ["Laos", "Cambodia", "Vietnam", "Thailand"], "Cambodia", 3),
		// https://en.wikipedia.org/wiki/Irrawaddy_River
		q("Which river runs north to south through Myanmar?", ["Mekong", "Irrawaddy", "Salween", "Chao Phraya"], "Irrawaddy", 3),
		// https://en.wikipedia.org/wiki/Chao_Phraya_River
		q("Bangkok sits on which river?", ["Mekong River", "Chao Phraya", "Salween River", "Irrawaddy"], "Chao Phraya", 2),
		// https://en.wikipedia.org/wiki/Mount_Kinabalu
		q("Mount Kinabalu is on which island?", ["Sumatra", "Java", "Borneo", "Sulawesi"], "Borneo", 2),
		// https://en.wikipedia.org/wiki/Komodo_National_Park
		q("Komodo National Park is in which country?", ["Philippines", "Indonesia", "Malaysia", "Papua New Guinea"], "Indonesia", 1),
		// https://en.wikipedia.org/wiki/Krakatoa
		q("The volcano Krakatoa lies in which strait?", ["Sunda Strait", "Strait of Malacca", "Lombok Strait", "Makassar Strait"], "Sunda Strait", 3),
		// https://en.wikipedia.org/wiki/Luzon
		q("Manila is on which island?", ["Luzon", "Mindanao", "Cebu", "Palawan"], "Luzon", 2),
		// https://en.wikipedia.org/wiki/Jeju_Island
		q("Jeju Island belongs to…", ["North Korea", "the Philippines", "South Korea", "Japan"], "South Korea", 1),
		// https://en.wikipedia.org/wiki/Okinawa_Island
		q("Okinawa is part of which island chain?", ["Ryukyu Islands", "Kuril Islands", "Bonin Islands", "Izu Islands"], "Ryukyu Islands", 3),
		// https://en.wikipedia.org/wiki/Kuril_Islands
		q("The Kuril Islands stretch between Hokkaido and which Russian peninsula?", ["Kamchatka", "Chukotka", "Kola", "Taymyr"], "Kamchatka", 3),
		// https://en.wikipedia.org/wiki/Sakhalin
		q("Sakhalin island belongs to…", ["Japan", "China", "Russia", "South Korea"], "Russia", 1),
		// https://en.wikipedia.org/wiki/Yellow_River
		q("Which Chinese river is called 'China's Sorrow' for its floods?", ["Yangtze", "Pearl River", "Huai River", "Yellow River"], "Yellow River", 3),
		// https://en.wikipedia.org/wiki/Three_Gorges_Dam
		q("The Three Gorges Dam is on which river?", ["Yellow River", "Pearl River", "Mekong", "Yangtze"], "Yangtze", 2),
		// https://en.wikipedia.org/wiki/Taklamakan_Desert
		q("The Taklamakan Desert is in which Chinese region?", ["Tibet", "Xinjiang", "Inner Mongolia", "Gansu"], "Xinjiang", 3),
		// https://en.wikipedia.org/wiki/Great_Dividing_Range
		q("Which mountain range runs down Australia's east coast?", ["Flinders Ranges", "Great Dividing Range", "MacDonnell Ranges", "Snowy Mountains"], "Great Dividing Range", 3),
		// https://en.wikipedia.org/wiki/Murray_River
		q("Which is the longest river in Australia?", ["Darling", "Murrumbidgee", "Lachlan", "Murray"], "Murray", 2),
		// https://en.wikipedia.org/wiki/Mount_Kosciuszko
		q("Mainland Australia's highest mountain is…", ["Mount Townsend", "Mount Bogong", "Mount Ossa", "Mount Kosciuszko"], "Mount Kosciuszko", 2),
		// https://en.wikipedia.org/wiki/Aoraki_/_Mount_Cook
		q("New Zealand's highest mountain is…", ["Mount Ruapehu", "Aoraki / Mount Cook", "Mount Taranaki", "Mount Tasman"], "Aoraki / Mount Cook", 3),
		// https://en.wikipedia.org/wiki/Milford_Sound
		q("Milford Sound is a fiord on which New Zealand island?", ["North Island", "Stewart Island", "Chatham Island", "South Island"], "South Island", 3),
		// https://en.wikipedia.org/wiki/Lake_Taup%C5%8D
		q("Which is the largest lake in New Zealand?", ["Lake Taupō", "Lake Wakatipu", "Lake Te Anau", "Lake Rotorua"], "Lake Taupō", 2),
		// https://en.wikipedia.org/wiki/R%C3%A9union
		q("Réunion, a French island, lies in which ocean?", ["Pacific", "Atlantic", "Indian", "Southern"], "Indian", 3),
		// https://en.wikipedia.org/wiki/Zanzibar
		q("The Zanzibar archipelago belongs to…", ["Kenya", "Mozambique", "Tanzania", "Comoros"], "Tanzania", 2),
		// https://en.wikipedia.org/wiki/Lake_Malawi
		q("Lake Malawi borders Malawi, Mozambique and…", ["Zambia", "Kenya", "Tanzania", "Uganda"], "Tanzania", 3),
		// https://en.wikipedia.org/wiki/Okavango_Delta
		q("The Okavango Delta is in…", ["Namibia", "Botswana", "Zambia", "Angola"], "Botswana", 3),
		// https://en.wikipedia.org/wiki/Ngorongoro_Conservation_Area
		q("The Ngorongoro Crater is in…", ["Tanzania", "Kenya", "Uganda", "Rwanda"], "Tanzania", 2),
		// https://en.wikipedia.org/wiki/Rwenzori_Mountains
		q("The 'Mountains of the Moon' sit on the border of Uganda and…", ["Kenya", "Rwanda", "South Sudan", "DR Congo"], "DR Congo", 3),
		// https://en.wikipedia.org/wiki/Lake_Volta
		q("Lake Volta, one of the largest reservoirs by area, is in…", ["Nigeria", "Ghana", "Ivory Coast", "Burkina Faso"], "Ghana", 3),
		// https://en.wikipedia.org/wiki/Blue_Nile
		q("The Blue Nile begins at Lake Tana in…", ["Sudan", "Uganda", "Eritrea", "Ethiopia"], "Ethiopia", 3),
		// https://en.wikipedia.org/wiki/Khartoum
		q("The White Nile and Blue Nile meet at which city?", ["Cairo", "Juba", "Khartoum", "Aswan"], "Khartoum", 2),
		// https://en.wikipedia.org/wiki/Lake_Nasser
		q("Lake Nasser was formed by which dam?", ["Kariba Dam", "Merowe Dam", "Grand Ethiopian Renaissance Dam", "Aswan High Dam"], "Aswan High Dam", 2),
		// https://en.wikipedia.org/wiki/Lake_Kariba
		q("Lake Kariba is shared by Zambia and…", ["Mozambique", "Botswana", "Malawi", "Zimbabwe"], "Zimbabwe", 3),
		// https://en.wikipedia.org/wiki/Skeleton_Coast
		q("The Skeleton Coast is in…", ["Angola", "South Africa", "Mozambique", "Namibia"], "Namibia", 3),
		// https://en.wikipedia.org/wiki/Lake_Chad
		q("Lake Chad borders Chad, Cameroon, Niger and…", ["Nigeria", "Sudan", "Mali", "Libya"], "Nigeria", 3),
		// https://en.wikipedia.org/wiki/Aruba
		q("Aruba is a country within…", ["the Netherlands", "France", "the United Kingdom", "Venezuela"], "the Netherlands", 2),
		// https://en.wikipedia.org/wiki/Pitons_(Saint_Lucia)
		q("The twin volcanic spires called the Pitons are on…", ["Grenada", "Dominica", "Saint Lucia", "Martinique"], "Saint Lucia", 3),
		// https://en.wikipedia.org/wiki/Lake_Champlain
		q("Lake Champlain lies between New York and…", ["New Hampshire", "Massachusetts", "Vermont", "Maine"], "Vermont", 2),
		// https://en.wikipedia.org/wiki/Lake_of_the_Woods
		q("The Northwest Angle, the northernmost bit of the lower 48, juts into…", ["Lake Superior", "Red Lake", "Lake of the Woods", "Rainy Lake"], "Lake of the Woods", 3),
		// https://en.wikipedia.org/wiki/Mount_Mitchell
		q("The highest peak east of the Mississippi is…", ["Mount Washington", "Clingmans Dome", "Mount Mitchell", "Mount Marcy"], "Mount Mitchell", 2),
		// https://en.wikipedia.org/wiki/Mount_Washington
		q("Mount Washington, known for extreme winds, is in…", ["Massachusetts", "Connecticut", "New Hampshire", "Rhode Island"], "New Hampshire", 2),
		// https://en.wikipedia.org/wiki/Adirondack_Mountains
		q("Lake Placid sits in which mountains?", ["Catskills", "Green Mountains", "Adirondacks", "Poconos"], "Adirondacks", 2),
		// https://en.wikipedia.org/wiki/Ozarks
		q("The Ozark Mountains lie mainly in Missouri and…", ["Oklahoma", "Arkansas", "Kansas", "Tennessee"], "Arkansas", 2),
		// https://en.wikipedia.org/wiki/Black_Hills
		q("The Black Hills rise in South Dakota and…", ["Montana", "Nebraska", "North Dakota", "Wyoming"], "Wyoming", 3),
		// https://en.wikipedia.org/wiki/Great_Basin
		q("Most of Nevada lies in which region where rivers never reach the sea?", ["Colorado Plateau", "Columbia Plateau", "Great Basin", "Great Plains"], "Great Basin", 3),
		// https://en.wikipedia.org/wiki/Colorado_River
		q("Lake Mead was formed by Hoover Dam on which river?", ["Colorado", "Snake", "Columbia", "Rio Grande"], "Colorado", 2),
		// https://en.wikipedia.org/wiki/Lake_Powell
		q("Lake Powell, behind Glen Canyon Dam, straddles Utah and…", ["Arizona", "Nevada", "Colorado", "New Mexico"], "Arizona", 3),
		// https://en.wikipedia.org/wiki/Snake_River
		q("Hells Canyon was carved by which river?", ["Colorado", "Snake", "Columbia", "Salmon"], "Snake", 3),
		// https://en.wikipedia.org/wiki/Columbia_River_Gorge
		q("The Columbia River Gorge separates Washington from…", ["Idaho", "British Columbia", "Oregon", "Montana"], "Oregon", 2),
		// https://en.wikipedia.org/wiki/Mount_Whitney
		q("The highest peak in the contiguous U.S. is in which range?", ["Rockies", "Cascades", "Brooks Range", "Sierra Nevada"], "Sierra Nevada", 3),
		// https://en.wikipedia.org/wiki/Brooks_Range
		q("Which mountain range stretches across northern Alaska?", ["Brooks Range", "Alaska Range", "Chugach Mountains", "Wrangell Mountains"], "Brooks Range", 3),
		// https://en.wikipedia.org/wiki/Yukon_River
		q("Which long river flows across Alaska to the Bering Sea?", ["Mackenzie", "Yukon", "Kuskokwim", "Copper"], "Yukon", 3),
		// https://en.wikipedia.org/wiki/Mackenzie_River
		q("Canada's longest river is the…", ["St. Lawrence", "Yukon", "Mackenzie", "Fraser"], "Mackenzie", 2),
		// https://en.wikipedia.org/wiki/Great_Bear_Lake
		q("The largest lake entirely in Canada is…", ["Great Slave Lake", "Lake Winnipeg", "Great Bear Lake", "Lake Athabasca"], "Great Bear Lake", 3),
		// https://en.wikipedia.org/wiki/Baffin_Island
		q("Canada's largest island is…", ["Victoria Island", "Ellesmere Island", "Newfoundland", "Baffin Island"], "Baffin Island", 2),
		// https://en.wikipedia.org/wiki/Banff_National_Park
		q("Lake Louise is in which national park?", ["Jasper", "Yoho", "Kootenay", "Banff"], "Banff", 2),
		// https://en.wikipedia.org/wiki/Bay_of_Campeche
		q("The Bay of Campeche is the southern arm of the…", ["Caribbean Sea", "Gulf of California", "Gulf of Mexico", "Pacific"], "Gulf of Mexico", 3),
		// https://en.wikipedia.org/wiki/Copper_Canyon
		q("Copper Canyon, a canyon system deeper than the Grand Canyon in places, is in…", ["Mexico", "Peru", "Chile", "the United States"], "Mexico", 3),
		// https://en.wikipedia.org/wiki/Cotopaxi
		q("The volcano Cotopaxi is in…", ["Peru", "Colombia", "Bolivia", "Ecuador"], "Ecuador", 2),
		// https://en.wikipedia.org/wiki/Chimborazo
		q("Which mountain's summit is the point farthest from Earth's center?", ["Mount Everest", "Chimborazo", "Aconcagua", "Kilimanjaro"], "Chimborazo", 3),
	],
	books: [
		// https://en.wikipedia.org/wiki/Middlemarch
		q("Who wrote 'Middlemarch'?", ["Thomas Hardy", "Anthony Trollope", "George Eliot", "Elizabeth Gaskell"], "George Eliot", 2),
		// https://en.wikipedia.org/wiki/Tess_of_the_d%27Urbervilles
		q("Who wrote 'Tess of the d'Urbervilles'?", ["Thomas Hardy", "Charles Dickens", "George Eliot", "Henry James"], "Thomas Hardy", 2),
		// https://en.wikipedia.org/wiki/Fahrenheit_451
		q("Who wrote 'Fahrenheit 451'?", ["Isaac Asimov", "Ray Bradbury", "Philip K. Dick", "Arthur C. Clarke"], "Ray Bradbury", 1),
		// https://en.wikipedia.org/wiki/The_Lion,_the_Witch_and_the_Wardrobe
		q("Who wrote 'The Lion, the Witch and the Wardrobe'?", ["J. R. R. Tolkien", "Roald Dahl", "C. S. Lewis", "Lewis Carroll"], "C. S. Lewis", 1),
		// https://en.wikipedia.org/wiki/Peter_Pan
		q("Who created Peter Pan?", ["Lewis Carroll", "Kenneth Grahame", "Rudyard Kipling", "J. M. Barrie"], "J. M. Barrie", 1),
		// https://en.wikipedia.org/wiki/The_Count_of_Monte_Cristo
		q("Who wrote 'The Count of Monte Cristo'?", ["Victor Hugo", "Jules Verne", "Gustave Flaubert", "Alexandre Dumas"], "Alexandre Dumas", 2),
		// https://en.wikipedia.org/wiki/Madame_Bovary
		q("Who wrote 'Madame Bovary'?", ["Émile Zola", "Gustave Flaubert", "Stendhal", "Guy de Maupassant"], "Gustave Flaubert", 2),
		// https://en.wikipedia.org/wiki/Twenty_Thousand_Leagues_Under_the_Seas
		q("Who wrote 'Twenty Thousand Leagues Under the Seas'?", ["Jules Verne", "H. G. Wells", "Victor Hugo", "Arthur Conan Doyle"], "Jules Verne", 2),
		// https://en.wikipedia.org/wiki/In_Search_of_Lost_Time
		q("Who wrote 'In Search of Lost Time'?", ["Marcel Proust", "André Gide", "Gustave Flaubert", "Stendhal"], "Marcel Proust", 3),
		// https://en.wikipedia.org/wiki/Holes_(novel)
		q("Who wrote 'Holes', set at Camp Green Lake?", ["Gary Paulsen", "Jerry Spinelli", "Lois Lowry", "Louis Sachar"], "Louis Sachar", 2),
		// https://en.wikipedia.org/wiki/Hatchet_(novel)
		q("Who wrote 'Hatchet', about a boy stranded in the Canadian wilderness?", ["Jack London", "Louis Sachar", "Jean Craighead George", "Gary Paulsen"], "Gary Paulsen", 2),
		// https://en.wikipedia.org/wiki/The_Last_of_the_Mohicans
		q("Who wrote 'The Last of the Mohicans'?", ["Washington Irving", "James Fenimore Cooper", "Nathaniel Hawthorne", "Herman Melville"], "James Fenimore Cooper", 2),
		// https://en.wikipedia.org/wiki/The_Legend_of_Sleepy_Hollow
		q("Who wrote 'The Legend of Sleepy Hollow'?", ["Edgar Allan Poe", "Nathaniel Hawthorne", "Washington Irving", "James Fenimore Cooper"], "Washington Irving", 2),
		// https://en.wikipedia.org/wiki/The_Age_of_Innocence
		q("Who wrote 'The Age of Innocence'?", ["Edith Wharton", "Henry James", "Willa Cather", "Kate Chopin"], "Edith Wharton", 2),
		// https://en.wikipedia.org/wiki/My_%C3%81ntonia
		q("Who wrote 'My Ántonia', set on the Nebraska prairie?", ["Willa Cather", "Edith Wharton", "Laura Ingalls Wilder", "Sarah Orne Jewett"], "Willa Cather", 3),
		// https://en.wikipedia.org/wiki/Macbeth
		q("In 'Macbeth', who persuades Macbeth to kill King Duncan?", ["Banquo", "the porter", "Macduff", "Lady Macbeth"], "Lady Macbeth", 1),
		// https://en.wikipedia.org/wiki/Othello
		q("In 'Othello', who is the scheming ensign?", ["Cassio", "Iago", "Roderigo", "Brabantio"], "Iago", 2),
		// https://en.wikipedia.org/wiki/Divine_Comedy
		q("Who guides Dante through Hell in 'The Divine Comedy'?", ["Homer", "Beatrice", "Virgil", "Ovid"], "Virgil", 2),
		// https://en.wikipedia.org/wiki/Moby-Dick
		q("What is the name of the captain in 'Moby-Dick'?", ["Queequeg", "Starbuck", "Stubb", "Ahab"], "Ahab", 1),
		// https://en.wikipedia.org/wiki/Twenty_Thousand_Leagues_Under_the_Seas
		q("Captain Nemo commands which submarine?", ["Pequod", "Argo", "Nautilus", "Hispaniola"], "Nautilus", 2),
		// https://en.wikipedia.org/wiki/Treasure_Island
		q("Which one-legged pirate sails in 'Treasure Island'?", ["Billy Bones", "Captain Flint", "Ben Gunn", "Long John Silver"], "Long John Silver", 1),
		// https://en.wikipedia.org/wiki/To_Kill_a_Mockingbird
		q("In 'To Kill a Mockingbird', Scout's father is…", ["Boo Radley", "Tom Robinson", "Atticus Finch", "Bob Ewell"], "Atticus Finch", 1),
		// https://en.wikipedia.org/wiki/Of_Mice_and_Men
		q("In 'Of Mice and Men', George travels with…", ["Curley", "Lennie", "Slim", "Candy"], "Lennie", 2),
		// https://en.wikipedia.org/wiki/Lord_of_the_Flies
		q("In 'Lord of the Flies', the boys call meetings with a…", ["brass bell", "tin whistle", "signal fire", "conch shell"], "conch shell", 2),
		// https://en.wikipedia.org/wiki/The_Lord_of_the_Rings
		q("In 'The Lord of the Rings', the One Ring must be destroyed in…", ["Rivendell", "Minas Tirith", "the Shire", "Mount Doom"], "Mount Doom", 1),
		// https://en.wikipedia.org/wiki/Alice%27s_Adventures_in_Wonderland
		q("Who wrote 'Alice's Adventures in Wonderland'?", ["Edward Lear", "J. M. Barrie", "Lewis Carroll", "George MacDonald"], "Lewis Carroll", 1),
		// https://en.wikipedia.org/wiki/Wolf_Hall
		q("Who wrote 'Wolf Hall', about Thomas Cromwell?", ["Hilary Mantel", "A. S. Byatt", "Zadie Smith", "Sarah Waters"], "Hilary Mantel", 3),
		// https://en.wikipedia.org/wiki/One_Flew_Over_the_Cuckoo%27s_Nest_(novel)
		q("Who wrote 'One Flew Over the Cuckoo's Nest'?", ["Ken Kesey", "Jack Kerouac", "Tom Wolfe", "Hunter S. Thompson"], "Ken Kesey", 3),
		// https://en.wikipedia.org/wiki/The_Good_Earth
		q("Who wrote 'The Good Earth', set in rural China?", ["Amy Tan", "Maxine Hong Kingston", "Pearl S. Buck", "Edna Ferber"], "Pearl S. Buck", 3),
		// https://en.wikipedia.org/wiki/The_Very_Hungry_Caterpillar
		q("Who wrote 'The Very Hungry Caterpillar'?", ["Maurice Sendak", "Dr. Seuss", "Eric Carle", "Mo Willems"], "Eric Carle", 1),
		// https://en.wikipedia.org/wiki/Fahrenheit_451
		q("In 'Fahrenheit 451', what is Guy Montag's job?", ["fireman", "librarian", "teacher", "soldier"], "fireman", 2),
		// https://en.wikipedia.org/wiki/Fahrenheit_451
		q("The title 'Fahrenheit 451' refers to the temperature at which…", ["water boils", "steel melts", "paper burns", "wood rots"], "paper burns", 2),
		// https://en.wikipedia.org/wiki/Nineteen_Eighty-Four
		q("In 'Nineteen Eighty-Four', Winston Smith works at the Ministry of…", ["Love", "Truth", "Peace", "Plenty"], "Truth", 1),
		// https://en.wikipedia.org/wiki/Brave_New_World
		q("In 'Brave New World', citizens take which happiness drug?", ["soma", "nepenthe", "melange", "ambrosia"], "soma", 2),
		// https://en.wikipedia.org/wiki/Dune_(novel)
		q("In 'Dune', the desert planet is called…", ["Caladan", "Arrakis", "Giedi Prime", "Kaitain"], "Arrakis", 1),
		// https://en.wikipedia.org/wiki/Dune_(novel)
		q("The precious substance at the heart of 'Dune' is called…", ["dilithium", "spice", "unobtainium", "kyber"], "spice", 1),
		// https://en.wikipedia.org/wiki/Discworld
		q("Who wrote the 'Discworld' novels?", ["Douglas Adams", "Terry Pratchett", "Neil Gaiman", "Piers Anthony"], "Terry Pratchett", 2),
		// https://en.wikipedia.org/wiki/The_Shining_(novel)
		q("The Overlook Hotel appears in which Stephen King novel?", ["Misery", "Pet Sematary", "The Shining", "'Salem's Lot"], "The Shining", 1),
		// https://en.wikipedia.org/wiki/It_(novel)
		q("Pennywise the clown terrorizes the town of Derry in which Stephen King novel?", ["The Shining", "Carrie", "Cujo", "It"], "It", 1),
		// https://en.wikipedia.org/wiki/A_Game_of_Thrones
		q("Who wrote 'A Game of Thrones'?", ["Robert Jordan", "Brandon Sanderson", "George R. R. Martin", "Patrick Rothfuss"], "George R. R. Martin", 1),
		// https://en.wikipedia.org/wiki/The_Wheel_of_Time
		q("Who began the 'Wheel of Time' series?", ["Terry Brooks", "Robert Jordan", "George R. R. Martin", "David Eddings"], "Robert Jordan", 2),
		// https://en.wikipedia.org/wiki/Kindred_(novel)
		q("Who wrote 'Kindred', a time-travel novel about slavery?", ["Toni Morrison", "N. K. Jemisin", "Octavia E. Butler", "Alice Walker"], "Octavia E. Butler", 2),
		// https://en.wikipedia.org/wiki/The_Fifth_Season_(novel)
		q("Who wrote 'The Fifth Season', first of the Broken Earth trilogy?", ["N. K. Jemisin", "Octavia E. Butler", "Nnedi Okorafor", "Ann Leckie"], "N. K. Jemisin", 3),
		// https://en.wikipedia.org/wiki/Ready_Player_One
		q("Who wrote 'Ready Player One'?", ["Ernest Cline", "Andy Weir", "Blake Crouch", "John Scalzi"], "Ernest Cline", 2),
		// https://en.wikipedia.org/wiki/The_Martian_(Weir_novel)
		q("Who wrote 'The Martian', about an astronaut stranded on Mars?", ["Ernest Cline", "Andy Weir", "Kim Stanley Robinson", "Ben Bova"], "Andy Weir", 2),
		// https://en.wikipedia.org/wiki/The_Hunt_for_Red_October
		q("Who wrote 'The Hunt for Red October'?", ["Michael Crichton", "Tom Clancy", "Robert Ludlum", "Clive Cussler"], "Tom Clancy", 2),
		// https://en.wikipedia.org/wiki/The_Bourne_Identity_(novel)
		q("Who created the spy Jason Bourne?", ["Robert Ludlum", "Tom Clancy", "John le Carré", "Ian Fleming"], "Robert Ludlum", 2),
		// https://en.wikipedia.org/wiki/Tinker_Tailor_Soldier_Spy
		q("Who wrote 'Tinker Tailor Soldier Spy'?", ["Ian Fleming", "Graham Greene", "Len Deighton", "John le Carré"], "John le Carré", 2),
		// https://en.wikipedia.org/wiki/The_Girl_with_the_Dragon_Tattoo
		q("Who wrote 'The Girl with the Dragon Tattoo'?", ["Stieg Larsson", "Jo Nesbø", "Henning Mankell", "Camilla Läckberg"], "Stieg Larsson", 2),
		// https://en.wikipedia.org/wiki/Jack_Reacher
		q("Who created the drifter hero Jack Reacher?", ["David Baldacci", "Michael Connelly", "Harlan Coben", "Lee Child"], "Lee Child", 2),
		// https://en.wikipedia.org/wiki/Harry_Bosch
		q("Detective Harry Bosch was created by…", ["Lee Child", "James Patterson", "Dennis Lehane", "Michael Connelly"], "Michael Connelly", 2),
		// https://en.wikipedia.org/wiki/Raymond_Chandler
		q("Private eye Philip Marlowe was created by…", ["Dashiell Hammett", "Ross Macdonald", "Mickey Spillane", "Raymond Chandler"], "Raymond Chandler", 2),
		// https://en.wikipedia.org/wiki/Anne_of_Green_Gables
		q("Who wrote 'Anne of Green Gables'?", ["L. M. Montgomery", "Margaret Laurence", "Alice Munro", "Marian Engel"], "L. M. Montgomery", 2),
		// https://en.wikipedia.org/wiki/Diary_of_a_Wimpy_Kid
		q("Who writes the 'Diary of a Wimpy Kid' series?", ["Dav Pilkey", "Lemony Snicket", "R. L. Stine", "Jeff Kinney"], "Jeff Kinney", 1),
		// https://en.wikipedia.org/wiki/Captain_Underpants
		q("Who created 'Captain Underpants' and 'Dog Man'?", ["Dav Pilkey", "Jeff Kinney", "Mo Willems", "Jon Scieszka"], "Dav Pilkey", 2),
		// https://en.wikipedia.org/wiki/Goosebumps
		q("Who wrote the 'Goosebumps' series?", ["Christopher Pike", "R. L. Stine", "Ann M. Martin", "Lemony Snicket"], "R. L. Stine", 1),
		// https://en.wikipedia.org/wiki/A_Series_of_Unfortunate_Events
		q("'A Series of Unfortunate Events' follows which orphaned siblings?", ["the Pevensies", "the Quimbys", "the Baudelaires", "the Penderwicks"], "the Baudelaires", 2),
		// https://en.wikipedia.org/wiki/The_Chronicles_of_Narnia
		q("In Narnia, the great lion is named…", ["Simba", "Elsa", "Aslan", "Leo"], "Aslan", 1),
		// https://en.wikipedia.org/wiki/Watership_Down
		q("Who wrote 'Watership Down'?", ["Brian Jacques", "Kenneth Grahame", "Richard Adams", "Beatrix Potter"], "Richard Adams", 2),
		// https://en.wikipedia.org/wiki/The_Outsiders_(novel)
		q("Who wrote 'The Outsiders', about the Greasers and the Socs?", ["Judy Blume", "Robert Cormier", "Paul Zindel", "S. E. Hinton"], "S. E. Hinton", 2),
		// https://en.wikipedia.org/wiki/Pulitzer_Prize_for_Fiction
		q("The Pulitzer Prizes are administered by which university?", ["Harvard", "Yale", "Princeton", "Columbia"], "Columbia", 3),
		// https://en.wikipedia.org/wiki/Booker_Prize
		q("The Booker Prize is awarded for fiction published in…", ["the United States", "the UK and Ireland", "Canada", "Australia"], "the UK and Ireland", 3),
		// https://en.wikipedia.org/wiki/Caldecott_Medal
		q("The Caldecott Medal honors the best American…", ["young adult novel", "picture book illustration", "poetry collection", "children's biography"], "picture book illustration", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Sgt._Pepper%27s_Lonely_Hearts_Club_Band
		q("Which Beatles album came out in 1967 with a crowded collage cover?", ["Sgt. Pepper", "Revolver", "Rubber Soul", "Abbey Road"], "Sgt. Pepper", 2),
		// https://en.wikipedia.org/wiki/Ringo_Starr
		q("Who was the Beatles' drummer on their hit records?", ["Pete Best", "Ringo Starr", "Charlie Watts", "Keith Moon"], "Ringo Starr", 1),
		// https://en.wikipedia.org/wiki/The_Rolling_Stones
		q("Who is the longtime lead singer of the Rolling Stones?", ["Keith Richards", "Roger Daltrey", "Robert Plant", "Mick Jagger"], "Mick Jagger", 1),
		// https://en.wikipedia.org/wiki/Bohemian_Rhapsody
		q("'Bohemian Rhapsody' was written by…", ["Freddie Mercury", "Brian May", "Roger Taylor", "John Deacon"], "Freddie Mercury", 1),
		// https://en.wikipedia.org/wiki/Nirvana_(band)
		q("'Smells Like Teen Spirit' is by…", ["Nirvana", "Pearl Jam", "Soundgarden", "Alice in Chains"], "Nirvana", 1),
		// https://en.wikipedia.org/wiki/Nirvana_(band)
		q("Nirvana formed in which U.S. state?", ["Washington", "Oregon", "California", "Minnesota"], "Washington", 1),
		// https://en.wikipedia.org/wiki/Johnny_Cash
		q("Which singer was nicknamed 'the Man in Black'?", ["Johnny Cash", "Willie Nelson", "Merle Haggard", "Waylon Jennings"], "Johnny Cash", 1),
		// https://en.wikipedia.org/wiki/Michael_Jackson
		q("Which Michael Jackson album is the best-selling album of all time?", ["Bad", "Off the Wall", "Thriller", "Dangerous"], "Thriller", 1),
		// https://en.wikipedia.org/wiki/Madonna
		q("Which singer is called the 'Queen of Pop'?", ["Madonna", "Cher", "Whitney Houston", "Janet Jackson"], "Madonna", 1),
		// https://en.wikipedia.org/wiki/Aretha_Franklin
		q("Which singer is called the 'Queen of Soul'?", ["Diana Ross", "Aretha Franklin", "Gladys Knight", "Tina Turner"], "Aretha Franklin", 1),
		// https://en.wikipedia.org/wiki/James_Brown
		q("Which singer was called 'the Godfather of Soul'?", ["Ray Charles", "James Brown", "Otis Redding", "Sam Cooke"], "James Brown", 1),
		// https://en.wikipedia.org/wiki/Louis_Armstrong
		q("Which jazz trumpeter was nicknamed 'Satchmo'?", ["Louis Armstrong", "Miles Davis", "Dizzy Gillespie", "Chet Baker"], "Louis Armstrong", 1),
		// https://en.wikipedia.org/wiki/Charlie_Parker
		q("Which saxophonist was nicknamed 'Bird'?", ["John Coltrane", "Lester Young", "Charlie Parker", "Sonny Rollins"], "Charlie Parker", 2),
		// https://en.wikipedia.org/wiki/Duke_Ellington
		q("Who led a famous jazz orchestra at Harlem's Cotton Club?", ["Duke Ellington", "Glenn Miller", "Benny Goodman", "Count Basie"], "Duke Ellington", 2),
		// https://en.wikipedia.org/wiki/Benny_Goodman
		q("Which clarinetist was called the 'King of Swing'?", ["Artie Shaw", "Glenn Miller", "Woody Herman", "Benny Goodman"], "Benny Goodman", 2),
		// https://en.wikipedia.org/wiki/Ella_Fitzgerald
		q("Which jazz singer was called the 'First Lady of Song'?", ["Billie Holiday", "Sarah Vaughan", "Ella Fitzgerald", "Nina Simone"], "Ella Fitzgerald", 2),
		// https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart
		q("Mozart was born in which city?", ["Vienna", "Prague", "Salzburg", "Munich"], "Salzburg", 1),
		// https://en.wikipedia.org/wiki/Messiah_(Handel)
		q("The 'Hallelujah' chorus comes from which oratorio?", ["The Creation", "Messiah", "Elijah", "Judas Maccabaeus"], "Messiah", 2),
		// https://en.wikipedia.org/wiki/The_Phantom_of_the_Opera_(1986_musical)
		q("Who composed 'The Phantom of the Opera' musical?", ["Stephen Sondheim", "Andrew Lloyd Webber", "Claude-Michel Schönberg", "Tim Rice"], "Andrew Lloyd Webber", 2),
		// https://en.wikipedia.org/wiki/Saxophone
		q("The saxophone was invented by…", ["Theobald Boehm", "Adolphe Sax", "Hector Berlioz", "Antoine Courtois"], "Adolphe Sax", 2),
		// https://en.wikipedia.org/wiki/Bagpipes
		q("Which instrument is most linked to Scotland?", ["accordion", "harp", "bagpipes", "fiddle"], "bagpipes", 1),
		// https://en.wikipedia.org/wiki/Didgeridoo
		q("The didgeridoo comes from which country's Indigenous peoples?", ["Australia", "New Zealand", "Papua New Guinea", "Fiji"], "Australia", 1),
		// https://en.wikipedia.org/wiki/Tempo
		q("In music, 'tempo' refers to…", ["loudness", "pitch", "speed", "key"], "speed", 1),
		// https://en.wikipedia.org/wiki/Clef
		q("The treble clef is also called the…", ["F clef", "G clef", "C clef", "alto clef"], "G clef", 2),
		// https://en.wikipedia.org/wiki/Clef
		q("The bass clef is also called the…", ["F clef", "G clef", "C clef", "tenor clef"], "F clef", 2),
		// https://en.wikipedia.org/wiki/Jimi_Hendrix
		q("Which guitarist played 'The Star-Spangled Banner' at Woodstock?", ["Carlos Santana", "Pete Townshend", "Jerry Garcia", "Jimi Hendrix"], "Jimi Hendrix", 1),
		// https://en.wikipedia.org/wiki/Elton_John
		q("Which singer's longtime lyricist is Bernie Taupin?", ["Rod Stewart", "Billy Joel", "Elton John", "Phil Collins"], "Elton John", 2),
		// https://en.wikipedia.org/wiki/Taylor_Swift
		q("Taylor Swift's record-setting 2023–2024 tour was called…", ["Reputation Stadium Tour", "The 1989 World Tour", "The Eras Tour", "Speak Now World Tour"], "The Eras Tour", 1),
		// https://en.wikipedia.org/wiki/Billie_Eilish
		q("Billie Eilish writes and records with her brother…", ["Finneas", "Jack Antonoff", "Max Martin", "Mark Ronson"], "Finneas", 2),
		// https://en.wikipedia.org/wiki/Beastie_Boys
		q("'(You Gotta) Fight for Your Right (To Party!)' is by…", ["Run-DMC", "Beastie Boys", "Public Enemy", "LL Cool J"], "Beastie Boys", 2),
		// https://en.wikipedia.org/wiki/Fela_Kuti
		q("Fela Kuti pioneered which genre?", ["highlife", "juju", "soukous", "Afrobeat"], "Afrobeat", 3),
		// https://en.wikipedia.org/wiki/Flamenco
		q("Flamenco is most associated with which Spanish region?", ["Catalonia", "Galicia", "Basque Country", "Andalusia"], "Andalusia", 2),
		// https://en.wikipedia.org/wiki/Polka
		q("The polka dance began in…", ["Bohemia", "Poland", "Hungary", "Bavaria"], "Bohemia", 2),
		// https://en.wikipedia.org/wiki/Hank_Williams
		q("Which country star sang 'Your Cheatin' Heart' and died at 29?", ["Patsy Cline", "Buddy Holly", "Jim Reeves", "Hank Williams"], "Hank Williams", 3),
		// https://en.wikipedia.org/wiki/Buddy_Holly
		q("Buddy Holly's backing band was…", ["the Comets", "the Blue Caps", "the Crickets", "the Teen Kings"], "the Crickets", 2),
		// https://en.wikipedia.org/wiki/The_Day_the_Music_Died
		q("'The Day the Music Died' plane crash in 1959 killed Buddy Holly, the Big Bopper and…", ["Ritchie Valens", "Eddie Cochran", "Gene Vincent", "Roy Orbison"], "Ritchie Valens", 2),
		// https://en.wikipedia.org/wiki/Chuck_Berry
		q("'Johnny B. Goode' was written and recorded by…", ["Chuck Berry", "Little Richard", "Bo Diddley", "Jerry Lee Lewis"], "Chuck Berry", 1),
		// https://en.wikipedia.org/wiki/Jerry_Lee_Lewis
		q("'Great Balls of Fire' was a hit for…", ["Elvis Presley", "Carl Perkins", "Little Richard", "Jerry Lee Lewis"], "Jerry Lee Lewis", 2),
		// https://en.wikipedia.org/wiki/Sun_Records
		q("Elvis, Johnny Cash and Jerry Lee Lewis all recorded early on at which Memphis label?", ["Stax", "Sun Records", "Chess", "Atlantic"], "Sun Records", 2),
		// https://en.wikipedia.org/wiki/Stax_Records
		q("Otis Redding and Booker T. & the M.G.'s recorded for which Memphis label?", ["Sun", "Motown", "Chess", "Stax"], "Stax", 3),
		// https://en.wikipedia.org/wiki/Chess_Records
		q("Muddy Waters recorded for which Chicago label?", ["Vee-Jay", "Chess", "Stax", "Sun"], "Chess", 3),
		// https://en.wikipedia.org/wiki/Muddy_Waters
		q("Which bluesman recorded 'Hoochie Coochie Man'?", ["Muddy Waters", "B.B. King", "Howlin' Wolf", "John Lee Hooker"], "Muddy Waters", 2),
		// https://en.wikipedia.org/wiki/The_Beach_Boys
		q("'Pet Sounds' is an album by…", ["the Byrds", "the Mamas & the Papas", "the Monkees", "the Beach Boys"], "the Beach Boys", 1),
		// https://en.wikipedia.org/wiki/Fleetwood_Mac
		q("'Rumours' (1977) is an album by…", ["the Eagles", "Steely Dan", "Fleetwood Mac", "Heart"], "Fleetwood Mac", 2),
		// https://en.wikipedia.org/wiki/Lynyrd_Skynyrd
		q("'Sweet Home Alabama' is by…", ["the Allman Brothers Band", "ZZ Top", "Creedence Clearwater Revival", "Lynyrd Skynyrd"], "Lynyrd Skynyrd", 2),
		// https://en.wikipedia.org/wiki/Creedence_Clearwater_Revival
		q("'Proud Mary' was first a hit for…", ["Ike & Tina Turner", "the Allman Brothers Band", "Creedence Clearwater Revival", "Three Dog Night"], "Creedence Clearwater Revival", 2),
		// https://en.wikipedia.org/wiki/The_Who
		q("'Tommy' is a rock opera by…", ["the Who", "the Kinks", "Pink Floyd", "Genesis"], "the Who", 2),
		// https://en.wikipedia.org/wiki/Metallica
		q("'Master of Puppets' is an album by…", ["Megadeth", "Slayer", "Anthrax", "Metallica"], "Metallica", 2),
		// https://en.wikipedia.org/wiki/Guns_N%27_Roses
		q("'Appetite for Destruction' is an album by…", ["Mötley Crüe", "Bon Jovi", "Guns N' Roses", "Def Leppard"], "Guns N' Roses", 2),
		// https://en.wikipedia.org/wiki/R.E.M.
		q("R.E.M. formed in which Georgia city?", ["Atlanta", "Athens", "Macon", "Savannah"], "Athens", 2),
		// https://en.wikipedia.org/wiki/Radiohead
		q("'OK Computer' is an album by…", ["Oasis", "Radiohead", "Blur", "Coldplay"], "Radiohead", 2),
		// https://en.wikipedia.org/wiki/Dire_Straits
		q("'Money for Nothing' and 'Sultans of Swing' are by…", ["the Police", "Genesis", "Toto", "Dire Straits"], "Dire Straits", 2),
		// https://en.wikipedia.org/wiki/The_Notorious_B.I.G.
		q("'Ready to Die' (1994) was the debut album of…", ["Tupac Shakur", "Busta Rhymes", "the Wu-Tang Clan", "the Notorious B.I.G."], "the Notorious B.I.G.", 2),
		// https://en.wikipedia.org/wiki/Kendrick_Lamar
		q("Which rapper won a 2018 Pulitzer Prize for Music for 'DAMN.'?", ["Drake", "J. Cole", "Kanye West", "Kendrick Lamar"], "Kendrick Lamar", 2),
		// https://en.wikipedia.org/wiki/Lauryn_Hill
		q("'The Miseducation of Lauryn Hill' singer first rose with…", ["TLC", "the Fugees", "Salt-N-Pepa", "En Vogue"], "the Fugees", 2),
		// https://en.wikipedia.org/wiki/Johann_Strauss_II
		q("'The Blue Danube' waltz was composed by…", ["Johann Strauss I", "Johann Strauss II", "Franz Lehár", "Josef Lanner"], "Johann Strauss II", 2),
		// https://en.wikipedia.org/wiki/Edvard_Grieg
		q("'In the Hall of the Mountain King' was composed by…", ["Jean Sibelius", "Edvard Grieg", "Carl Nielsen", "Antonín Dvořák"], "Edvard Grieg", 3),
		// https://en.wikipedia.org/wiki/Finlandia
		q("'Finlandia' was composed by…", ["Edvard Grieg", "Carl Nielsen", "Gustav Mahler", "Jean Sibelius"], "Jean Sibelius", 3),
		// https://en.wikipedia.org/wiki/Pomp_and_Circumstance_Marches
		q("The graduation march 'Pomp and Circumstance' was composed by…", ["Edward Elgar", "Gustav Holst", "Henry Purcell", "George Frideric Handel"], "Edward Elgar", 3),
		// https://en.wikipedia.org/wiki/Peter_and_the_Wolf
		q("'Peter and the Wolf' was composed by…", ["Sergei Prokofiev", "Dmitri Shostakovich", "Igor Stravinsky", "Modest Mussorgsky"], "Sergei Prokofiev", 3),
		// https://en.wikipedia.org/wiki/Fr%C3%A9d%C3%A9ric_Chopin
		q("Which composer wrote mainly for solo piano and was born in Poland?", ["Franz Liszt", "Robert Schumann", "Felix Mendelssohn", "Frédéric Chopin"], "Frédéric Chopin", 3),
		// https://en.wikipedia.org/wiki/John_Williams
		q("Who composed the scores for 'Star Wars' and 'Jaws'?", ["John Williams", "Hans Zimmer", "Danny Elfman", "Howard Shore"], "John Williams", 2),
		// https://en.wikipedia.org/wiki/Ennio_Morricone
		q("Who scored 'The Good, the Bad and the Ugly'?", ["Nino Rota", "Ennio Morricone", "John Barry", "Jerry Goldsmith"], "Ennio Morricone", 2),
	],
	food: [
		// https://en.wikipedia.org/wiki/Pesto
		q("Classic Genoese pesto is made with basil, garlic, olive oil, Parmesan and…", ["walnuts", "almonds", "pistachios", "pine nuts"], "pine nuts", 2),
		// https://en.wikipedia.org/wiki/Paella
		q("Paella comes from which Spanish region?", ["Andalusia", "Valencia", "Catalonia", "Galicia"], "Valencia", 2),
		// https://en.wikipedia.org/wiki/Parmesan
		q("Parmigiano-Reggiano comes from which country?", ["France", "Spain", "Italy", "Switzerland"], "Italy", 1),
		// https://en.wikipedia.org/wiki/Gazpacho
		q("Gazpacho is a cold soup from…", ["Spain", "Mexico", "Greece", "Portugal"], "Spain", 1),
		// https://en.wikipedia.org/wiki/Ramen
		q("Ramen became a signature dish of which country?", ["China", "Korea", "Taiwan", "Japan"], "Japan", 1),
		// https://en.wikipedia.org/wiki/Croissant
		q("The crescent-shaped croissant is most tied to which country's bakeries?", ["Belgium", "Italy", "France", "Germany"], "France", 1),
		// https://en.wikipedia.org/wiki/Baklava
		q("Baklava is layered pastry with nuts soaked in…", ["syrup", "cream", "chocolate", "jam"], "syrup", 2),
		// https://en.wikipedia.org/wiki/Churro
		q("Churros are fried dough most tied to…", ["Italy", "Spain", "Greece", "France"], "Spain", 1),
		// https://en.wikipedia.org/wiki/Poutine
		q("Poutine is fries topped with cheese curds and…", ["chili", "ketchup", "gravy", "maple syrup"], "gravy", 1),
		// https://en.wikipedia.org/wiki/Caff%C3%A8_americano
		q("An Americano is espresso diluted with…", ["steamed milk", "cream", "ice", "hot water"], "hot water", 2),
		// https://en.wikipedia.org/wiki/Chai
		q("Masala chai is spiced tea from…", ["China", "Turkey", "Morocco", "India"], "India", 1),
		// https://en.wikipedia.org/wiki/Cinnamon
		q("Cinnamon comes from the bark of…", ["trees", "roots", "flowers", "seed pods"], "trees", 2),
		// https://en.wikipedia.org/wiki/Capsaicin
		q("The compound that makes chili peppers hot is…", ["piperine", "capsaicin", "menthol", "gingerol"], "capsaicin", 2),
		// https://en.wikipedia.org/wiki/Injera
		q("Injera, a spongy flatbread, is made from…", ["teff", "millet", "cassava", "sorghum"], "teff", 3),
		// https://en.wikipedia.org/wiki/Bobotie
		q("Bobotie, a baked spiced-mince dish, is from…", ["South Africa", "Mozambique", "Zimbabwe", "Madagascar"], "South Africa", 3),
		// https://en.wikipedia.org/wiki/Tagine
		q("A tagine is a slow-cooked stew named for its…", ["clay pot", "spice blend", "bread", "grill"], "clay pot", 2),
		// https://en.wikipedia.org/wiki/Moussaka
		q("Greek moussaka is layered with…", ["zucchini", "potato only", "pasta", "eggplant"], "eggplant", 2),
		// https://en.wikipedia.org/wiki/Ceviche
		q("Ceviche is raw fish cured in…", ["vinegar", "salt brine", "soy sauce", "citrus juice"], "citrus juice", 2),
		// https://en.wikipedia.org/wiki/Arepa
		q("Arepas are cornmeal cakes from Venezuela and…", ["Mexico", "Peru", "Colombia", "Chile"], "Colombia", 3),
		// https://en.wikipedia.org/wiki/Feijoada
		q("Feijoada, a black bean stew, is the national dish of…", ["Portugal", "Cuba", "Argentina", "Brazil"], "Brazil", 2),
		// https://en.wikipedia.org/wiki/Pupusa
		q("Pupusas are stuffed corn cakes from…", ["Venezuela", "Argentina", "El Salvador", "Ecuador"], "El Salvador", 2),
		// https://en.wikipedia.org/wiki/Tempura
		q("Tempura is a style of…", ["grilling", "frying", "steaming", "pickling"], "frying", 2),
		// https://en.wikipedia.org/wiki/Rendang
		q("Beef rendang, slow-cooked in coconut milk, comes from…", ["Thailand", "India", "Philippines", "Indonesia"], "Indonesia", 3),
		// https://en.wikipedia.org/wiki/Adobo
		q("Adobo is a national dish of…", ["Indonesia", "the Philippines", "East Timor", "the Maldives"], "the Philippines", 2),
		// https://en.wikipedia.org/wiki/Laksa
		q("Laksa is a spicy noodle soup from…", ["Japan", "Malaysia", "Korea", "India"], "Malaysia", 3),
		// https://en.wikipedia.org/wiki/Dim_sum
		q("Dim sum is most tied to which cuisine?", ["Cantonese", "Sichuan", "Hunan", "Shandong"], "Cantonese", 2),
		// https://en.wikipedia.org/wiki/Sichuan_pepper
		q("Sichuan pepper is known for causing a…", ["sweet aftertaste", "cooling sensation", "tingling numbness", "bitter burn"], "tingling numbness", 3),
		// https://en.wikipedia.org/wiki/Biryani
		q("Biryani is a layered dish of spiced…", ["rice", "lentils", "bread", "noodles"], "rice", 2),
		// https://en.wikipedia.org/wiki/Tandoor
		q("A tandoor is a kind of…", ["frying pan", "clay oven", "spice mix", "flatbread"], "clay oven", 1),
		// https://en.wikipedia.org/wiki/Yorkshire_pudding
		q("Yorkshire pudding is usually served with…", ["fish", "roast beef", "curry", "ice cream"], "roast beef", 1),
		// https://en.wikipedia.org/wiki/Sm%C3%B8rrebr%C3%B8d
		q("Smørrebrød is an open-faced sandwich from…", ["Denmark", "Sweden", "Norway", "Netherlands"], "Denmark", 3),
		// https://en.wikipedia.org/wiki/Gravlax
		q("Gravlax is salmon cured with salt, sugar and…", ["basil", "rosemary", "cilantro", "dill"], "dill", 3),
		// https://en.wikipedia.org/wiki/Bouillabaisse
		q("Bouillabaisse is a fish stew from which French city?", ["Lyon", "Nice", "Bordeaux", "Marseille"], "Marseille", 2),
		// https://en.wikipedia.org/wiki/Ratatouille
		q("Ratatouille is a vegetable stew from…", ["Normandy", "Alsace", "Provence", "Brittany"], "Provence", 2),
		// https://en.wikipedia.org/wiki/Risotto
		q("Risotto is traditionally made with which rice?", ["basmati", "jasmine", "wild rice", "Arborio"], "Arborio", 2),
		// https://en.wikipedia.org/wiki/Carbonara
		q("Classic Roman carbonara uses egg, cheese, black pepper and…", ["bacon bits", "chicken", "guanciale", "cream"], "guanciale", 3),
		// https://en.wikipedia.org/wiki/Gumbo
		q("Gumbo's thickener can be roux, filé powder or…", ["potato", "okra", "rice flour", "cornstarch"], "okra", 2),
		// https://en.wikipedia.org/wiki/Hoppin%27_John
		q("Hoppin' John is a Southern dish of rice and…", ["butter beans", "pinto beans", "collard greens", "black-eyed peas"], "black-eyed peas", 3),
	],
	arts: [
		// https://en.wikipedia.org/wiki/The_Last_Supper_(Leonardo)
		q("Leonardo's 'The Last Supper' is in which city?", ["Florence", "Rome", "Venice", "Milan"], "Milan", 1),
		// https://en.wikipedia.org/wiki/David_(Michelangelo)
		q("Michelangelo's statue 'David' is in which city?", ["Florence", "Rome", "Venice", "Milan"], "Florence", 1),
		// https://en.wikipedia.org/wiki/Impression,_Sunrise
		q("Which painting gave Impressionism its name?", ["Water Lilies", "Luncheon on the Grass", "Impression, Sunrise", "The Bathers"], "Impression, Sunrise", 2),
		// https://en.wikipedia.org/wiki/Frida_Kahlo
		q("Which Mexican painter is known for self-portraits and the Blue House?", ["Diego Rivera", "Rufino Tamayo", "Frida Kahlo", "Leonora Carrington"], "Frida Kahlo", 1),
		// https://en.wikipedia.org/wiki/Jackson_Pollock
		q("Which painter was famous for drip paintings?", ["Mark Rothko", "Willem de Kooning", "Jackson Pollock", "Franz Kline"], "Jackson Pollock", 1),
		// https://en.wikipedia.org/wiki/Guggenheim_Museum_Bilbao
		q("Frank Gehry's titanium-clad Guggenheim museum is in which Spanish city?", ["Madrid", "Valencia", "Seville", "Bilbao"], "Bilbao", 2),
		// https://en.wikipedia.org/wiki/Sagrada_Fam%C3%ADlia
		q("Which architect designed Barcelona's Sagrada Família?", ["Santiago Calatrava", "Rafael Moneo", "Josep Lluís Sert", "Antoni Gaudí"], "Antoni Gaudí", 1),
		// https://en.wikipedia.org/wiki/Fresco
		q("Painting on wet plaster is called…", ["tempera", "gouache", "encaustic", "fresco"], "fresco", 1),
		// https://en.wikipedia.org/wiki/The_Raft_of_the_Medusa
		q("'The Raft of the Medusa' was painted by…", ["Eugène Delacroix", "Jacques-Louis David", "J. M. W. Turner", "Théodore Géricault"], "Théodore Géricault", 3),
		// https://en.wikipedia.org/wiki/Whistler%27s_Mother
		q("The painting known as 'Whistler's Mother' is by…", ["James McNeill Whistler", "John Singer Sargent", "Winslow Homer", "Mary Cassatt"], "James McNeill Whistler", 3),
		// https://en.wikipedia.org/wiki/Balloon_Dog
		q("The mirror-steel 'Balloon Dog' sculptures are by…", ["Jeff Koons", "Damien Hirst", "Takashi Murakami", "Anish Kapoor"], "Jeff Koons", 2),
		// https://en.wikipedia.org/wiki/Banksy
		q("Which anonymous street artist shredded 'Girl with Balloon' at auction in 2018?", ["Banksy", "Shepard Fairey", "Invader", "JR"], "Banksy", 2),
		// https://en.wikipedia.org/wiki/Barack_Obama_%22Hope%22_poster
		q("Shepard Fairey's 2008 'Hope' poster depicted…", ["Hillary Clinton", "John McCain", "Barack Obama", "Joe Biden"], "Barack Obama", 2),
		// https://en.wikipedia.org/wiki/Georgia_O%27Keeffe
		q("Which painter is famous for large flowers and New Mexico landscapes?", ["Frida Kahlo", "Agnes Martin", "Helen Frankenthaler", "Georgia O'Keeffe"], "Georgia O'Keeffe", 2),
		// https://en.wikipedia.org/wiki/Mark_Rothko
		q("Which painter is known for large soft-edged color fields?", ["Jackson Pollock", "Franz Kline", "Mark Rothko", "Robert Motherwell"], "Mark Rothko", 2),
		// https://en.wikipedia.org/wiki/Black_Square
		q("Kazimir Malevich's famous 1915 painting is…", ["White on White", "Black Square", "Red Square", "Suprematist Composition"], "Black Square", 3),
		// https://en.wikipedia.org/wiki/Wassily_Kandinsky
		q("Which painter is often credited with some of the first abstract paintings?", ["Paul Klee", "Franz Marc", "Chagall", "Kandinsky"], "Kandinsky", 3),
		// https://en.wikipedia.org/wiki/Bauhaus
		q("The Bauhaus art school was founded in 1919 in…", ["Berlin", "Munich", "Vienna", "Weimar"], "Weimar", 3),
		// https://en.wikipedia.org/wiki/Walter_Gropius
		q("Who founded the Bauhaus?", ["Ludwig Mies van der Rohe", "Le Corbusier", "Marcel Breuer", "Walter Gropius"], "Walter Gropius", 3),
		// https://en.wikipedia.org/wiki/Art_Nouveau
		q("Alphonse Mucha's poster style is called…", ["Art Deco", "Pop Art", "Bauhaus", "Art Nouveau"], "Art Nouveau", 2),
		// https://en.wikipedia.org/wiki/Pop_art
		q("Roy Lichtenstein's comic-strip paintings belong to which movement?", ["Op art", "Dada", "Pop art", "Minimalism"], "Pop art", 2),
		// https://en.wikipedia.org/wiki/Dada
		q("Marcel Duchamp's urinal 'Fountain' is linked to which movement?", ["Cubism", "Futurism", "Fauvism", "Dada"], "Dada", 2),
		// https://en.wikipedia.org/wiki/Chiaroscuro
		q("The strong contrast of light and dark in painting is called…", ["chiaroscuro", "sfumato", "impasto", "grisaille"], "chiaroscuro", 3),
		// https://en.wikipedia.org/wiki/Sfumato
		q("Leonardo's soft, smoky blending of tones is called…", ["sfumato", "chiaroscuro", "tenebrism", "scumbling"], "sfumato", 3),
		// https://en.wikipedia.org/wiki/Caravaggio
		q("Which Baroque painter is famous for dramatic tenebrism?", ["Caravaggio", "Raphael", "Titian", "Botticelli"], "Caravaggio", 3),
	],
};
