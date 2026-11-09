import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Vault-tier round (Nov 9 2026): long-tail diff-3 cards aimed at amber/red/violet rarity. Sources: English Wikipedia.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography" | "math";

export const PLUS_20261109G: Partial<Record<PlusCat, TriviaQ[]>> = {
	sports: [
		// https://en.wikipedia.org/wiki/Abebe_Bikila
		q("Which Ethiopian won the 1960 Olympic marathon barefoot?", ["Abebe Bikila", "Mamo Wolde", "Miruts Yifter", "Haile Gebrselassie"], "Abebe Bikila", 3),
		// https://en.wikipedia.org/wiki/Emil_Zátopek
		q("Which Czech runner won the 5000 m, 10,000 m and marathon in 1952?", ["Vladimir Kuts", "Lasse Virén", "Paavo Nurmi", "Emil Zátopek"], "Emil Zátopek", 3),
		// https://en.wikipedia.org/wiki/Paavo_Nurmi
		q("Which Finnish runner won nine Olympic golds in the 1920s?", ["Hannes Kolehmainen", "Ville Ritola", "Paavo Nurmi", "Lasse Virén"], "Paavo Nurmi", 3),
		// https://en.wikipedia.org/wiki/Fanny_Blankers-Koen
		q("Which Dutch athlete won four golds at the 1948 London Olympics?", ["Ellen van Langen", "Wilma Rudolph", "Fanny Blankers-Koen", "Betty Cuthbert"], "Fanny Blankers-Koen", 3),
		// https://en.wikipedia.org/wiki/Nadia_Comăneci
		q("Which Romanian gymnast scored the first perfect 10 in 1976?", ["Nadia Comăneci", "Olga Korbut", "Ecaterina Szabo", "Teodora Ungureanu"], "Nadia Comăneci", 3),
		// https://en.wikipedia.org/wiki/Larisa_Latynina
		q("Which Soviet gymnast won 18 Olympic medals between 1956 and 1964?", ["Polina Astakhova", "Olga Korbut", "Věra Čáslavská", "Larisa Latynina"], "Larisa Latynina", 3),
		// https://en.wikipedia.org/wiki/Věra_Čáslavská
		q("Which Czechoslovak gymnast won seven Olympic golds in the 1960s?", ["Nadia Comăneci", "Ludmilla Tourischeva", "Larisa Latynina", "Věra Čáslavská"], "Věra Čáslavská", 3),
		// https://en.wikipedia.org/wiki/Bjørn_Dæhlie
		q("Which Norwegian cross-country skier won eight Olympic golds?", ["Vegard Ulvang", "Bjørn Dæhlie", "Marit Bjørgen", "Thomas Alsgaard"], "Bjørn Dæhlie", 3),
		// https://en.wikipedia.org/wiki/Pirmin_Zurbriggen
		q("Which Swiss skier won the 1988 Olympic downhill in Calgary?", ["Peter Müller", "Pirmin Zurbriggen", "Didier Cuche", "Franz Heinzer"], "Pirmin Zurbriggen", 3),
		// https://en.wikipedia.org/wiki/Toni_Sailer
		q("Which Austrian won all three 1956 Olympic alpine skiing golds?", ["Karl Schranz", "Franz Klammer", "Toni Sailer", "Hermann Maier"], "Toni Sailer", 3),
	],
	political: [
		// https://en.wikipedia.org/wiki/Treaty_of_Zaragoza
		q("Which 1529 treaty set the Spanish–Portuguese line in Asia?", ["Treaty of Tordesillas", "Treaty of Cambrai", "Treaty of Zaragoza", "Treaty of Lisbon"], "Treaty of Zaragoza", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Nanking
		q("Which 1842 treaty ended the First Opium War?", ["Treaty of Nanking", "Treaty of Tientsin", "Treaty of Shimonoseki", "Treaty of Whampoa"], "Treaty of Nanking", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Shimonoseki
		q("Which 1895 treaty ended the First Sino-Japanese War?", ["Treaty of Nanking", "Treaty of Portsmouth", "Treaty of Kanagawa", "Treaty of Shimonoseki"], "Treaty of Shimonoseki", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Portsmouth
		q("Which 1905 treaty, signed in New Hampshire, ended the Russo-Japanese War?", ["Treaty of Kanagawa", "Treaty of Portsmouth", "Treaty of Shimonoseki", "Treaty of Paris"], "Treaty of Portsmouth", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Brest-Litovsk
		q("Which 1918 treaty took Russia out of World War I?", ["Treaty of Brest-Litovsk", "Treaty of Bucharest", "Treaty of Rapallo", "Treaty of Riga"], "Treaty of Brest-Litovsk", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Trianon
		q("Which 1920 treaty dealt with Hungary after World War I?", ["Treaty of Trianon", "Treaty of Saint-Germain", "Treaty of Sèvres", "Treaty of Neuilly"], "Treaty of Trianon", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Lausanne
		q("Which 1923 treaty replaced Sèvres and recognized modern Turkey?", ["Treaty of Trianon", "Treaty of Kars", "Treaty of Ankara", "Treaty of Lausanne"], "Treaty of Lausanne", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Rapallo_(1922)
		q("Which 1922 treaty normalized relations between Germany and Soviet Russia?", ["Treaty of Berlin", "Treaty of Locarno", "Treaty of Riga", "Treaty of Rapallo"], "Treaty of Rapallo", 3),
		// https://en.wikipedia.org/wiki/Peace_of_Utrecht
		q("Which 1713 treaties ended the War of the Spanish Succession?", ["Peace of Utrecht", "Treaty of Ryswick", "Treaty of Aix-la-Chapelle", "Treaty of Nijmegen"], "Peace of Utrecht", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Aix-la-Chapelle_(1748)
		q("Which 1748 treaty ended the War of the Austrian Succession?", ["Treaty of Paris", "Treaty of Hubertusburg", "Treaty of Aix-la-Chapelle", "Treaty of Utrecht"], "Treaty of Aix-la-Chapelle", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Hubertusburg
		q("Which 1763 treaty ended the Seven Years' War between Prussia and Austria?", ["Treaty of Hubertusburg", "Treaty of Paris", "Treaty of Teschen", "Treaty of Aix-la-Chapelle"], "Treaty of Hubertusburg", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Paris_(1856)
		q("Which 1856 treaty ended the Crimean War?", ["Treaty of Paris", "Treaty of Berlin", "Treaty of San Stefano", "Treaty of Adrianople"], "Treaty of Paris", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_San_Stefano
		q("Which 1878 treaty, later revised at Berlin, ended a Russo-Turkish war?", ["Treaty of Adrianople", "Treaty of Bucharest", "Treaty of Kuchuk Kainarji", "Treaty of San Stefano"], "Treaty of San Stefano", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Küçük_Kaynarca
		q("Which 1774 treaty ended a Russo-Turkish war and gave Russia Black Sea access?", ["Treaty of Karlowitz", "Treaty of Küçük Kaynarca", "Treaty of Jassy", "Treaty of Belgrade"], "Treaty of Küçük Kaynarca", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Karlowitz
		q("Which 1699 treaty saw the Ottomans cede most of Hungary to Austria?", ["Treaty of Belgrade", "Treaty of Passarowitz", "Treaty of Karlowitz", "Treaty of Zsitvatorok"], "Treaty of Karlowitz", 3),
		// https://en.wikipedia.org/wiki/Locarno_Treaties
		q("Which 1925 treaties guaranteed Western European borders after World War I?", ["Stresa Front", "Rapallo Treaties", "Locarno Treaties", "Kellogg–Briand Pact"], "Locarno Treaties", 3),
		// https://en.wikipedia.org/wiki/Kellogg–Briand_Pact
		q("Which 1928 pact sought to renounce war as national policy?", ["Locarno Treaties", "Stimson Doctrine", "Kellogg–Briand Pact", "Washington Treaty"], "Kellogg–Briand Pact", 3),
		// https://en.wikipedia.org/wiki/Treaty_of_Lisbon
		q("Which 2007 treaty reformed the EU and created its permanent Council president?", ["Treaty of Nice", "Maastricht Treaty", "Treaty of Lisbon", "Treaty of Amsterdam"], "Treaty of Lisbon", 3),
		// https://en.wikipedia.org/wiki/Warsaw_Pact
		q("Which 1955 alliance was the Soviet bloc's answer to NATO?", ["Cominform", "Comecon", "Molotov Plan", "Warsaw Pact"], "Warsaw Pact", 3),
		// https://en.wikipedia.org/wiki/Comecon
		q("Which 1949 Soviet-led body coordinated Eastern bloc economies?", ["Comecon", "Warsaw Pact", "Comintern", "Cominform"], "Comecon", 3),
		// https://en.wikipedia.org/wiki/Communist_International
		q("Which 1919 organization coordinated communist parties worldwide until 1943?", ["Profintern", "Cominform", "Comecon", "Comintern"], "Comintern", 3),
		// https://en.wikipedia.org/wiki/Asian–African_Conference
		q("Which 1955 Indonesian conference was a forerunner of the Non-Aligned Movement?", ["Bandung Conference", "Cairo Conference", "Colombo Conference", "Belgrade Conference"], "Bandung Conference", 3),
	],
	food: [
		// https://en.wikipedia.org/wiki/Tokaji
		q("Which Hungarian dessert wine comes from grapes hit by noble rot?", ["Bikavér", "Tokaji", "Pálinka", "Unicum"], "Tokaji", 3),
		// https://en.wikipedia.org/wiki/Madeira_wine
		q("Which Portuguese fortified wine comes from an Atlantic island?", ["Port", "Madeira", "Moscatel", "Marsala"], "Madeira", 3),
		// https://en.wikipedia.org/wiki/Marsala_wine
		q("Which Sicilian fortified wine shares its name with a western port town?", ["Marsala", "Sherry", "Madeira", "Vin Santo"], "Marsala", 3),
		// https://en.wikipedia.org/wiki/Barolo
		q("Which grape is used in the red wines of Barolo?", ["Barbera", "Sangiovese", "Dolcetto", "Nebbiolo"], "Nebbiolo", 3),
		// https://en.wikipedia.org/wiki/Chianti
		q("Which grape is the chief variety of Chianti?", ["Sangiovese", "Aglianico", "Montepulciano", "Nebbiolo"], "Sangiovese", 3),
		// https://en.wikipedia.org/wiki/Rioja_(wine)
		q("Which Spanish grape is the main variety of Rioja?", ["Tempranillo", "Monastrell", "Garnacha", "Mencía"], "Tempranillo", 3),
		// https://en.wikipedia.org/wiki/Vouvray_AOC
		q("Which white grape is used for Vouvray in the Loire?", ["Chenin blanc", "Sauvignon blanc", "Chardonnay", "Melon de Bourgogne"], "Chenin blanc", 3),
		// https://en.wikipedia.org/wiki/Muscadet
		q("Which Loire wine is made from Melon de Bourgogne grapes?", ["Sancerre", "Vouvray", "Muscadet", "Chinon"], "Muscadet", 3),
		// https://en.wikipedia.org/wiki/Primitivo
		q("Which grape, Zinfandel's twin, comes from Puglia?", ["Primitivo", "Nero d'Avola", "Negroamaro", "Aglianico"], "Primitivo", 3),
		// https://en.wikipedia.org/wiki/Yuzu
		q("Which Japanese citrus is prized for its aromatic rind?", ["Dekopon", "Kabosu", "Sudachi", "Yuzu"], "Yuzu", 3),
		// https://en.wikipedia.org/wiki/Nattō
		q("Which Japanese fermented soybean dish is known for its sticky strings?", ["Miso", "Doenjang", "Tempeh", "Nattō"], "Nattō", 3),
		// https://en.wikipedia.org/wiki/Tempeh
		q("Which Indonesian food is made from fermented soybean cakes?", ["Tofu", "Oncom", "Nattō", "Tempeh"], "Tempeh", 3),
		// https://en.wikipedia.org/wiki/Doenjang
		q("Which Korean fermented soybean paste is used in jjigae stews?", ["Ssamjang", "Doenjang", "Gochujang", "Miso"], "Doenjang", 3),
		// https://en.wikipedia.org/wiki/Berbere
		q("Which Ethiopian spice blend is based on chili peppers?", ["Berbere", "Ras el hanout", "Mitmita", "Baharat"], "Berbere", 3),
		// https://en.wikipedia.org/wiki/Dukkah
		q("Which Egyptian condiment is a mix of nuts, seeds and spices?", ["Sumac", "Baharat", "Dukkah", "Za'atar"], "Dukkah", 3),
		// https://en.wikipedia.org/wiki/Khinkali
		q("Which Georgian dumplings are twisted into a knob on top?", ["Varenyky", "Manti", "Pelmeni", "Khinkali"], "Khinkali", 3),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Florence_Cathedral
		q("Which Renaissance architect designed the dome of Florence Cathedral?", ["Leon Battista Alberti", "Donato Bramante", "Filippo Brunelleschi", "Michelozzo"], "Filippo Brunelleschi", 3),
		// https://en.wikipedia.org/wiki/Gates_of_Paradise_(Ghiberti)
		q("Which sculptor made the bronze doors called the 'Gates of Paradise' in Florence?", ["Lorenzo Ghiberti", "Andrea Pisano", "Brunelleschi", "Donatello"], "Lorenzo Ghiberti", 3),
		// https://en.wikipedia.org/wiki/St._Peter's_Square
		q("Which Baroque sculptor designed the colonnade of St. Peter's Square?", ["Carlo Maderno", "Francesco Borromini", "Gian Lorenzo Bernini", "Pietro da Cortona"], "Gian Lorenzo Bernini", 3),
		// https://en.wikipedia.org/wiki/Isenheim_Altarpiece
		q("Which painter made the Isenheim Altarpiece?", ["Lucas Cranach", "Hans Holbein", "Albrecht Dürer", "Matthias Grünewald"], "Matthias Grünewald", 3),
		// https://en.wikipedia.org/wiki/Melencolia_I
		q("Which German artist made the engraving Melencolia I in 1514?", ["Lucas Cranach", "Albrecht Dürer", "Martin Schongauer", "Hans Holbein the Younger"], "Albrecht Dürer", 3),
		// https://en.wikipedia.org/wiki/Tintoretto
		q("Which Venetian painter made the huge Paradise canvas in the Doge's Palace?", ["Veronese", "Bellini", "Titian", "Tintoretto"], "Tintoretto", 3),
		// https://en.wikipedia.org/wiki/Artemisia_Gentileschi
		q("Which Italian woman painted Judith Slaying Holofernes around 1620?", ["Artemisia Gentileschi", "Sofonisba Anguissola", "Elisabetta Sirani", "Lavinia Fontana"], "Artemisia Gentileschi", 3),
		// https://en.wikipedia.org/wiki/A_Burial_at_Ornans
		q("Which Realist painter made A Burial at Ornans?", ["Honoré Daumier", "Jean-François Millet", "Camille Corot", "Gustave Courbet"], "Gustave Courbet", 3),
		// https://en.wikipedia.org/wiki/The_Gleaners
		q("Which painter made The Gleaners in 1857?", ["Camille Corot", "Gustave Courbet", "Jean-François Millet", "Jules Breton"], "Jean-François Millet", 3),
		// https://en.wikipedia.org/wiki/Wanderer_above_the_Sea_of_Fog
		q("Which German Romantic painted Wanderer above the Sea of Fog?", ["Karl Friedrich Schinkel", "Carl Spitzweg", "Philipp Otto Runge", "Caspar David Friedrich"], "Caspar David Friedrich", 3),
		// https://en.wikipedia.org/wiki/Alberto_Giacometti
		q("Which Swiss sculptor is known for tall, thin bronze figures like Walking Man I?", ["Constantin Brâncuși", "Henry Moore", "Jean Arp", "Alberto Giacometti"], "Alberto Giacometti", 3),
		// https://en.wikipedia.org/wiki/Black_Square_(painting)
		q("Which Russian painted Black Square in 1915?", ["Kazimir Malevich", "El Lissitzky", "Wassily Kandinsky", "Alexander Rodchenko"], "Kazimir Malevich", 3),
		// https://en.wikipedia.org/wiki/Futurism
		q("Which Italian movement, launched in 1909, celebrated speed and machines?", ["Futurism", "Rayonism", "Vorticism", "Constructivism"], "Futurism", 3),
		// https://en.wikipedia.org/wiki/Filippo_Tommaso_Marinetti
		q("Which Italian poet wrote the 1909 Futurist Manifesto?", ["Giacomo Balla", "Filippo Tommaso Marinetti", "Gabriele D'Annunzio", "Umberto Boccioni"], "Filippo Tommaso Marinetti", 3),
		// https://en.wikipedia.org/wiki/Villa_Savoye
		q("Which architect designed the Villa Savoye near Paris?", ["Le Corbusier", "Robert Mallet-Stevens", "Mies van der Rohe", "Auguste Perret"], "Le Corbusier", 3),
		// https://en.wikipedia.org/wiki/Paimio_Sanatorium
		q("Which Finnish architect designed the Paimio Sanatorium?", ["Eliel Saarinen", "Eero Saarinen", "Lars Sonck", "Alvar Aalto"], "Alvar Aalto", 3),
	],
	science: [
		// https://en.wikipedia.org/wiki/Technetium
		q("Which element was the first to be made artificially, in 1937?", ["plutonium", "technetium", "promethium", "neptunium"], "technetium", 3),
		// https://en.wikipedia.org/wiki/Tungsten
		q("Which element has the highest melting point of all metals?", ["tantalum", "rhenium", "tungsten", "osmium"], "tungsten", 3),
		// https://en.wikipedia.org/wiki/Osmium
		q("Which element is the densest naturally occurring?", ["iridium", "osmium", "platinum", "gold"], "osmium", 3),
		// https://en.wikipedia.org/wiki/Paul_Dirac
		q("Which physicist predicted the positron in 1928 with his relativistic equation?", ["Wolfgang Pauli", "Carl Anderson", "Paul Dirac", "Enrico Fermi"], "Paul Dirac", 3),
		// https://en.wikipedia.org/wiki/Neutrino
		q("Which physicist first proposed the neutrino in 1930?", ["Paul Dirac", "Enrico Fermi", "Niels Bohr", "Wolfgang Pauli"], "Wolfgang Pauli", 3),
		// https://en.wikipedia.org/wiki/Nuclear_fission
		q("Which chemists discovered nuclear fission in 1938?", ["Otto Hahn and Fritz Strassmann", "Lise Meitner and Niels Bohr", "Irène and Frédéric Joliot-Curie", "Enrico Fermi and Leo Szilard"], "Otto Hahn and Fritz Strassmann", 3),
		// https://en.wikipedia.org/wiki/C._V._Raman
		q("Which Indian physicist discovered the scattering of light named after him in 1928?", ["C. V. Raman", "Meghnad Saha", "Homi Bhabha", "Satyendra Nath Bose"], "C. V. Raman", 3),
		// https://en.wikipedia.org/wiki/Boson
		q("Which type of particle is named after Indian physicist Satyendra Nath Bose?", ["hadron", "fermion", "lepton", "boson"], "boson", 3),
		// https://en.wikipedia.org/wiki/Ceres_(dwarf_planet)
		q("Which dwarf planet in the asteroid belt was discovered by Giuseppe Piazzi in 1801?", ["Vesta", "Juno", "Ceres", "Pallas"], "Ceres", 3),
		// https://en.wikipedia.org/wiki/Annie_Jump_Cannon
		q("Which Harvard astronomer devised the star classification scheme O, B, A, F, G, K, M?", ["Williamina Fleming", "Cecilia Payne-Gaposchkin", "Annie Jump Cannon", "Henrietta Swan Leavitt"], "Annie Jump Cannon", 3),
		// https://en.wikipedia.org/wiki/Henrietta_Swan_Leavitt
		q("Which astronomer found the period–luminosity relation of Cepheid variables?", ["Harlow Shapley", "Annie Jump Cannon", "Edwin Hubble", "Henrietta Swan Leavitt"], "Henrietta Swan Leavitt", 3),
		// https://en.wikipedia.org/wiki/Vera_Rubin
		q("Which astronomer's galaxy rotation curves gave key evidence for dark matter in the 1970s?", ["Margaret Burbidge", "Jan Oort", "Vera Rubin", "Fritz Zwicky"], "Vera Rubin", 3),
		// https://en.wikipedia.org/wiki/Alexandre_Yersin
		q("Which bacteriologist discovered the bacterium that causes plague in 1894?", ["Paul-Louis Simond", "Alexandre Yersin", "Kitasato Shibasaburō", "Robert Koch"], "Alexandre Yersin", 3),
		// https://en.wikipedia.org/wiki/Ignaz_Semmelweis
		q("Which Hungarian doctor pushed handwashing to stop childbed fever in the 1840s?", ["Joseph Lister", "Ignaz Semmelweis", "John Snow", "Rudolf Virchow"], "Ignaz Semmelweis", 3),
		// https://en.wikipedia.org/wiki/Frederick_Banting
		q("Which Canadian scientists isolated insulin in 1921 with Charles Best?", ["William Osler", "John Macleod", "Frederick Banting", "James Collip"], "Frederick Banting", 3),
		// https://en.wikipedia.org/wiki/HeLa
		q("Which scientist's cell line, taken in 1951, is called HeLa?", ["Henrietta Lacks", "Rosalind Franklin", "Barbara McClintock", "Gertrude Elion"], "Henrietta Lacks", 3),
		// https://en.wikipedia.org/wiki/Barbara_McClintock
		q("Which geneticist discovered 'jumping genes' in maize?", ["Barbara McClintock", "Thomas Hunt Morgan", "Nettie Stevens", "Rosalind Franklin"], "Barbara McClintock", 3),
		// https://en.wikipedia.org/wiki/Thomas_Hunt_Morgan
		q("Which geneticist used fruit flies to show genes sit on chromosomes?", ["Gregor Mendel", "Thomas Hunt Morgan", "Hermann Muller", "Barbara McClintock"], "Thomas Hunt Morgan", 3),
		// https://en.wikipedia.org/wiki/Mohorovičić_discontinuity
		q("Which boundary between Earth's crust and mantle is named after a Croatian seismologist?", ["Mohorovičić discontinuity", "Conrad discontinuity", "Lehmann discontinuity", "Gutenberg discontinuity"], "Mohorovičić discontinuity", 3),
		// https://en.wikipedia.org/wiki/Inge_Lehmann
		q("Which Danish seismologist discovered Earth's solid inner core in 1936?", ["Inge Lehmann", "Andrija Mohorovičić", "Richard Oldham", "Beno Gutenberg"], "Inge Lehmann", 3),
	],
	history: [
		// https://en.wikipedia.org/wiki/Peace_of_Münster
		q("Which 1648 treaty, part of the Westphalia settlement, ended Spain's Eighty Years' War with the Dutch Republic?", ["Treaty of the Pyrenees", "Peace of Münster", "Twelve Years' Truce", "Treaty of Nijmegen"], "Peace of Münster", 3),
		// https://en.wikipedia.org/wiki/Battle_of_the_Golden_Spurs
		q("Which 1302 battle saw Flemish militia defeat French knights at Kortrijk?", ["Battle of Courtrai Gate", "Battle of Bouvines", "Battle of the Golden Spurs", "Battle of Crécy"], "Battle of the Golden Spurs", 3),
		// https://en.wikipedia.org/wiki/Battle_of_Adwa
		q("Which Ethiopian emperor defeated an Italian army at Adwa in 1896?", ["Tewodros II", "Menelik II", "Haile Selassie", "Yohannes IV"], "Menelik II", 3),
		// https://en.wikipedia.org/wiki/Battle_of_Isandlwana
		q("Which Zulu victory in 1879 inflicted a heavy defeat on British forces?", ["Battle of Blood River", "Battle of Ulundi", "Battle of Rorke's Drift", "Battle of Isandlwana"], "Battle of Isandlwana", 3),
		// https://en.wikipedia.org/wiki/Mansa_Musa
		q("Which Mali emperor made a famously lavish pilgrimage to Mecca in 1324?", ["Askia Muhammad", "Mansa Musa", "Sundiata Keita", "Sonni Ali"], "Mansa Musa", 3),
		// https://en.wikipedia.org/wiki/Angkor_Wat
		q("Which Khmer king began building Angkor Wat in the 12th century?", ["Indravarman I", "Suryavarman II", "Jayavarman II", "Jayavarman VII"], "Suryavarman II", 3),
		// https://en.wikipedia.org/wiki/Indian_Rebellion_of_1857
		q("Which 1857 uprising in India began among sepoys at Meerut?", ["Anglo-Sikh War", "Indian Rebellion of 1857", "Quit India Movement", "Vellore Mutiny"], "Indian Rebellion of 1857", 3),
		// https://en.wikipedia.org/wiki/Taiping_Rebellion
		q("Which Chinese uprising of 1850–1864 was led by Hong Xiuquan?", ["Nian Rebellion", "Dungan Revolt", "Taiping Rebellion", "Boxer Rebellion"], "Taiping Rebellion", 3),
		// https://en.wikipedia.org/wiki/Battle_of_Tsushima
		q("Which 1905 naval battle saw Japan destroy Russia's Baltic Fleet?", ["Battle of Tsushima", "Battle of Chemulpo", "Battle of the Yellow Sea", "Battle of Port Arthur"], "Battle of Tsushima", 3),
		// https://en.wikipedia.org/wiki/Battle_of_Vienna
		q("Which 1683 battle ended the Ottoman siege of Vienna?", ["Battle of Lepanto", "Battle of Mohács", "Battle of Zenta", "Battle of Vienna"], "Battle of Vienna", 3),
		// https://en.wikipedia.org/wiki/John_III_Sobieski
		q("Which Polish king led the relief force at the 1683 Battle of Vienna?", ["Stephen Báthory", "Władysław IV", "John III Sobieski", "Sigismund III Vasa"], "John III Sobieski", 3),
		// https://en.wikipedia.org/wiki/Battle_of_Lepanto
		q("Which 1571 naval battle saw the Holy League defeat the Ottoman fleet?", ["Siege of Malta", "Battle of Preveza", "Battle of Djerba", "Battle of Lepanto"], "Battle of Lepanto", 3),
		// https://en.wikipedia.org/wiki/Moctezuma_II
		q("Which Aztec emperor ruled when Hernán Cortés arrived in 1519?", ["Moctezuma II", "Itzcoatl", "Cuauhtémoc", "Ahuitzotl"], "Moctezuma II", 3),
		// https://en.wikipedia.org/wiki/Atahualpa
		q("Which last Inca emperor was executed by the Spanish in 1533?", ["Atahualpa", "Manco Inca", "Huáscar", "Túpac Amaru"], "Atahualpa", 3),
		// https://en.wikipedia.org/wiki/Battle_of_Bosworth_Field
		q("Which English king was killed at the Battle of Bosworth Field in 1485?", ["Henry VI", "Edward IV", "Richard III", "Edward V"], "Richard III", 3),
		// https://en.wikipedia.org/wiki/Road_to_Canossa
		q("Which Holy Roman Emperor was humbled at Canossa in 1077?", ["Otto I", "Frederick Barbarossa", "Henry IV", "Charles V"], "Henry IV", 3),
		// https://en.wikipedia.org/wiki/Peasants'_Revolt
		q("Which 1381 English revolt was led by Wat Tyler?", ["Kett's Rebellion", "Jack Cade's Rebellion", "Pilgrimage of Grace", "Peasants' Revolt"], "Peasants' Revolt", 3),
		// https://en.wikipedia.org/wiki/Lübeck
		q("Which Hanseatic city was the League's leading member, called the 'Queen of the Hanse'?", ["Lübeck", "Hamburg", "Bremen", "Danzig"], "Lübeck", 3),
		// https://en.wikipedia.org/wiki/Enrico_Dandolo
		q("Which Venetian doge led the Fourth Crusade's sack of Constantinople in 1204?", ["Pietro Orseolo", "Enrico Dandolo", "Andrea Gritti", "Francesco Foscari"], "Enrico Dandolo", 3),
		// https://en.wikipedia.org/wiki/Jallianwala_Bagh_massacre
		q("Which 1919 massacre in Amritsar was ordered by General Reginald Dyer?", ["Bloody Sunday", "Jallianwala Bagh massacre", "Sharpeville massacre", "Peterloo Massacre"], "Jallianwala Bagh massacre", 3),
		// https://en.wikipedia.org/wiki/Easter_Rising
		q("Which 1916 Irish uprising was centered on Dublin's General Post Office?", ["Fenian Rising", "Irish Rebellion of 1798", "Young Irelander Rebellion", "Easter Rising"], "Easter Rising", 3),
		// https://en.wikipedia.org/wiki/New_Economic_Policy
		q("Which Soviet leader introduced the New Economic Policy in 1921?", ["Nikita Khrushchev", "Vladimir Lenin", "Leon Trotsky", "Joseph Stalin"], "Vladimir Lenin", 3),
		// https://en.wikipedia.org/wiki/Suez_Crisis
		q("Which 1956 crisis saw Britain, France and Israel invade Egypt?", ["Hungarian Revolution", "Yom Kippur War", "Suez Crisis", "Six-Day War"], "Suez Crisis", 3),
		// https://en.wikipedia.org/wiki/Prague_Spring
		q("Which 1968 Czechoslovak reform period was crushed by a Warsaw Pact invasion?", ["Solidarity", "Hungarian Revolution", "Velvet Revolution", "Prague Spring"], "Prague Spring", 3),
		// https://en.wikipedia.org/wiki/Alexander_Dubček
		q("Which Czechoslovak leader led the 1968 Prague Spring reforms?", ["Ludvík Svoboda", "Václav Havel", "Gustáv Husák", "Alexander Dubček"], "Alexander Dubček", 3),
		// https://en.wikipedia.org/wiki/Carnation_Revolution
		q("Which 1974 Portuguese coup ended the Estado Novo dictatorship?", ["Revolution of 1910", "Velvet Revolution", "Carnation Revolution", "Rose Revolution"], "Carnation Revolution", 3),
	],
	nature: [
		// https://en.wikipedia.org/wiki/Wollemia
		q("Which conifer genus, known from fossils, was found alive near Sydney in 1994?", ["Podocarpus", "Araucaria", "Agathis", "Wollemia"], "Wollemia", 3),
		// https://en.wikipedia.org/wiki/Rafflesia_arnoldii
		q("Which plant has the largest single flower in the world?", ["Amorphophallus titanum", "Victoria amazonica", "Rafflesia arnoldii", "Nelumbo nucifera"], "Rafflesia arnoldii", 3),
		// https://en.wikipedia.org/wiki/Welwitschia
		q("Which Namib Desert plant grows only two leaves throughout its life?", ["Aloe dichotoma", "Hoodia", "Welwitschia", "Lithops"], "Welwitschia", 3),
		// https://en.wikipedia.org/wiki/Coelacanth
		q("Which fish, thought extinct, was rediscovered off South Africa in 1938?", ["Lungfish", "Bichir", "Arapaima", "Coelacanth"], "Coelacanth", 3),
		// https://en.wikipedia.org/wiki/Saola
		q("Which Vietnamese bovine was discovered by science only in 1992?", ["Saola", "Kouprey", "Tamaraw", "Anoa"], "Saola", 3),
		// https://en.wikipedia.org/wiki/Tamaraw
		q("Which Philippine dwarf buffalo lives only on Mindoro?", ["Anoa", "Kouprey", "Tamaraw", "Saola"], "Tamaraw", 3),
		// https://en.wikipedia.org/wiki/Okapi
		q("Which giraffe relative was known to Europeans only from 1901?", ["Bongo", "Sitatunga", "Okapi", "Duiker"], "Okapi", 3),
		// https://en.wikipedia.org/wiki/Aye-aye
		q("Which Madagascar lemur has a thin, elongated middle finger for tapping wood?", ["Sifaka", "Ring-tailed lemur", "Indri", "Aye-aye"], "Aye-aye", 3),
		// https://en.wikipedia.org/wiki/Indri
		q("Which is the largest living lemur?", ["Ruffed lemur", "Sifaka", "Indri", "Aye-aye"], "Indri", 3),
		// https://en.wikipedia.org/wiki/Fossa_(animal)
		q("Which Madagascar predator is related to the mongoose?", ["Fossa", "Binturong", "Genet", "Civet"], "Fossa", 3),
		// https://en.wikipedia.org/wiki/Kākāpō
		q("Which New Zealand parrot is flightless and nocturnal?", ["Kākā", "Kākāpō", "Kererū", "Kea"], "Kākāpō", 3),
		// https://en.wikipedia.org/wiki/Kea
		q("Which New Zealand alpine parrot is known for its curiosity?", ["Kea", "Kākā", "Kākāpō", "Kākāriki"], "Kea", 3),
		// https://en.wikipedia.org/wiki/Tuatara
		q("Which New Zealand reptile is the sole survivor of the order Rhynchocephalia?", ["Green gecko", "Moko skink", "Komodo dragon", "Tuatara"], "Tuatara", 3),
		// https://en.wikipedia.org/wiki/South_China_giant_salamander
		q("Which Asian salamander is the largest amphibian in the world?", ["Olm", "Hellbender", "Japanese giant salamander", "South China giant salamander"], "South China giant salamander", 3),
		// https://en.wikipedia.org/wiki/Olm
		q("Which blind cave salamander lives in the Dinaric Alps?", ["Olm", "Mudpuppy", "Axolotl", "Hellbender"], "Olm", 3),
		// https://en.wikipedia.org/wiki/Axolotl
		q("Which Mexican salamander stays in its larval form as an adult?", ["Axolotl", "Siren", "Olm", "Mudpuppy"], "Axolotl", 3),
		// https://en.wikipedia.org/wiki/Passenger_pigeon
		q("Which pigeon, once in billions, went extinct in 1914?", ["Dodo", "Great auk", "Carolina parakeet", "Passenger pigeon"], "Passenger pigeon", 3),
		// https://en.wikipedia.org/wiki/Great_auk
		q("Which flightless seabird of the North Atlantic was killed off by 1844?", ["Dodo", "Labrador duck", "Great auk", "Spectacled cormorant"], "Great auk", 3),
		// https://en.wikipedia.org/wiki/Steller's_sea_cow
		q("Which marine mammal, discovered by Steller in 1741, was extinct by 1768?", ["Dugong", "Caribbean monk seal", "Steller's sea cow", "Japanese sea lion"], "Steller's sea cow", 3),
		// https://en.wikipedia.org/wiki/Javan_tiger
		q("Which tiger subspecies from the island of Java is now extinct?", ["Bali tiger", "Sumatran tiger", "Caspian tiger", "Javan tiger"], "Javan tiger", 3),
		// https://en.wikipedia.org/wiki/Quagga
		q("Which striped zebra relative was extinct by 1883?", ["Onager", "Kiang", "Tarpan", "Quagga"], "Quagga", 3),
	],
	games: [
		// https://en.wikipedia.org/wiki/Go_(game)
		q("Which board game, called weiqi in China, is known as baduk in Korea?", ["Janggi", "Go", "Xiangqi", "Shogi"], "Go", 3),
		// https://en.wikipedia.org/wiki/Makruk
		q("Which Thai board game is a relative of chess?", ["Makruk", "Janggi", "Sittuyin", "Shatar"], "Makruk", 3),
		// https://en.wikipedia.org/wiki/Chaturanga
		q("Which ancient Indian game is the ancestor of chess?", ["Shatranj", "Chaturanga", "Pachisi", "Moksha Patam"], "Chaturanga", 3),
		// https://en.wikipedia.org/wiki/Shatranj
		q("Which Persian game came between chaturanga and modern chess?", ["Shatranj", "Nard", "Xiangqi", "Pachisi"], "Shatranj", 3),
		// https://en.wikipedia.org/wiki/Senet
		q("Which ancient Egyptian board game was played around 3100 BCE?", ["Hounds and Jackals", "Mancala", "Mehen", "Senet"], "Senet", 3),
		// https://en.wikipedia.org/wiki/Tafl_games
		q("Which Norse board game pits a king against attackers?", ["Fox and geese", "Hnefatafl", "Halatafl", "Nine men's morris"], "Hnefatafl", 3),
		// https://en.wikipedia.org/wiki/Sicilian_Defence
		q("Which chess opening begins 1.e4 c5?", ["French Defence", "Pirc Defence", "Sicilian Defence", "Caro–Kann Defence"], "Sicilian Defence", 3),
		// https://en.wikipedia.org/wiki/French_Defence
		q("Which chess opening begins 1.e4 e6?", ["Sicilian Defence", "Alekhine's Defence", "Caro–Kann Defence", "French Defence"], "French Defence", 3),
		// https://en.wikipedia.org/wiki/Caro–Kann_Defence
		q("Which chess opening begins 1.e4 c6?", ["French Defence", "Sicilian Defence", "Modern Defence", "Caro–Kann Defence"], "Caro–Kann Defence", 3),
		// https://en.wikipedia.org/wiki/Emanuel_Lasker
		q("Which world chess champion held the title from 1894 to 1921?", ["Emanuel Lasker", "Wilhelm Steinitz", "José Raúl Capablanca", "Alexander Alekhine"], "Emanuel Lasker", 3),
		// https://en.wikipedia.org/wiki/José_Raúl_Capablanca
		q("Which Cuban was world chess champion from 1921 to 1927?", ["José Raúl Capablanca", "Emanuel Lasker", "Alexander Alekhine", "Max Euwe"], "José Raúl Capablanca", 3),
		// https://en.wikipedia.org/wiki/Max_Euwe
		q("Which Dutch player was world chess champion from 1935 to 1937?", ["Alexander Alekhine", "Mikhail Botvinnik", "Max Euwe", "Emanuel Lasker"], "Max Euwe", 3),
		// https://en.wikipedia.org/wiki/Mikhail_Tal
		q("Which Latvian won the world chess title in 1960?", ["Boris Spassky", "Mikhail Tal", "Tigran Petrosian", "Vasily Smyslov"], "Mikhail Tal", 3),
		// https://en.wikipedia.org/wiki/Tigran_Petrosian
		q("Which Armenian-Soviet player was world chess champion from 1963 to 1969?", ["Tigran Petrosian", "Mikhail Tal", "Boris Spassky", "Mikhail Botvinnik"], "Tigran Petrosian", 3),
	],
	music: [
		// https://en.wikipedia.org/wiki/Boris_Godunov_(opera)
		q("Which composer wrote the opera Boris Godunov?", ["Mikhail Glinka", "Alexander Borodin", "Modest Mussorgsky", "Nikolai Rimsky-Korsakov"], "Modest Mussorgsky", 3),
		// https://en.wikipedia.org/wiki/Prince_Igor
		q("Which composer wrote the opera Prince Igor?", ["Alexander Borodin", "César Cui", "Modest Mussorgsky", "Mily Balakirev"], "Alexander Borodin", 3),
		// https://en.wikipedia.org/wiki/Scheherazade_(Rimsky-Korsakov)
		q("Which composer wrote Scheherazade in 1888?", ["Alexander Borodin", "Pyotr Tchaikovsky", "Nikolai Rimsky-Korsakov", "Anatoly Lyadov"], "Nikolai Rimsky-Korsakov", 3),
		// https://en.wikipedia.org/wiki/The_Five_(composers)
		q("Which group of five Russian composers included Balakirev and Cui?", ["Les Six", "The Belyayev Circle", "The Mighty Seven", "The Five"], "The Five", 3),
		// https://en.wikipedia.org/wiki/Les_Six
		q("Which group of French composers included Poulenc, Milhaud and Honegger?", ["La Jeune France", "The Five", "Les Apaches", "Les Six"], "Les Six", 3),
		// https://en.wikipedia.org/wiki/Wozzeck
		q("Which composer wrote the opera Wozzeck?", ["Paul Hindemith", "Anton Webern", "Arnold Schoenberg", "Alban Berg"], "Alban Berg", 3),
		// https://en.wikipedia.org/wiki/4′33″
		q("Which composer wrote the silent piece 4′33″ in 1952?", ["La Monte Young", "Steve Reich", "John Cage", "Morton Feldman"], "John Cage", 3),
		// https://en.wikipedia.org/wiki/Music_for_18_Musicians
		q("Which minimalist composer wrote Music for 18 Musicians?", ["Terry Riley", "Philip Glass", "John Adams", "Steve Reich"], "Steve Reich", 3),
		// https://en.wikipedia.org/wiki/Einstein_on_the_Beach
		q("Which composer wrote the opera Einstein on the Beach?", ["Meredith Monk", "Philip Glass", "Steve Reich", "John Adams"], "Philip Glass", 3),
		// https://en.wikipedia.org/wiki/Arvo_Pärt
		q("Which Estonian composer created the 'tintinnabuli' style?", ["Veljo Tormis", "Erkki-Sven Tüür", "Eduard Tubin", "Arvo Pärt"], "Arvo Pärt", 3),
		// https://en.wikipedia.org/wiki/Dido_and_Aeneas
		q("Which Baroque composer wrote the opera Dido and Aeneas?", ["John Blow", "Thomas Arne", "George Frideric Handel", "Henry Purcell"], "Henry Purcell", 3),
		// https://en.wikipedia.org/wiki/Spem_in_alium
		q("Which English composer wrote the 40-voice motet Spem in alium?", ["Thomas Tallis", "William Byrd", "Orlando Gibbons", "John Taverner"], "Thomas Tallis", 3),
		// https://en.wikipedia.org/wiki/Ordo_Virtutum
		q("Which medieval abbess composed the Ordo Virtutum?", ["Hildegard of Bingen", "Kassia", "Beatriz de Dia", "Herrad of Landsberg"], "Hildegard of Bingen", 3),
	],
	books: [
		// https://en.wikipedia.org/wiki/Halldór_Laxness
		q("Which Icelandic author won the 1955 Nobel Prize in Literature?", ["Gunnar Gunnarsson", "Snorri Hjartarson", "Thor Vilhjálmsson", "Halldór Laxness"], "Halldór Laxness", 3),
		// https://en.wikipedia.org/wiki/Independent_People
		q("Which Laxness novel follows the stubborn sheep farmer Bjartur?", ["Iceland's Bell", "The Fish Can Sing", "Salka Valka", "Independent People"], "Independent People", 3),
		// https://en.wikipedia.org/wiki/Hunger_(Hamsun_novel)
		q("Which Norwegian author wrote the 1890 novel Hunger?", ["Knut Hamsun", "Bjørnstjerne Bjørnson", "Henrik Ibsen", "Sigrid Undset"], "Knut Hamsun", 3),
		// https://en.wikipedia.org/wiki/Kristin_Lavransdatter
		q("Which Norwegian author wrote the trilogy Kristin Lavransdatter?", ["Amalie Skram", "Sigrid Undset", "Knut Hamsun", "Cora Sandel"], "Sigrid Undset", 3),
		// https://en.wikipedia.org/wiki/Gösta_Berling's_Saga
		q("Which Swedish author wrote The Saga of Gösta Berling?", ["Selma Lagerlöf", "Hjalmar Söderberg", "Verner von Heidenstam", "August Strindberg"], "Selma Lagerlöf", 3),
		// https://en.wikipedia.org/wiki/Blindness_(novel)
		q("Which Portuguese author wrote Blindness?", ["José Saramago", "Fernando Pessoa", "Eça de Queirós", "António Lobo Antunes"], "José Saramago", 3),
		// https://en.wikipedia.org/wiki/Fernando_Pessoa
		q("Which Portuguese poet wrote under heteronyms like Alberto Caeiro?", ["Luís de Camões", "Florbela Espanca", "Fernando Pessoa", "Mário de Sá-Carneiro"], "Fernando Pessoa", 3),
		// https://en.wikipedia.org/wiki/Os_Lusíadas
		q("Which Portuguese epic poem of 1572 celebrates Vasco da Gama's voyage?", ["Mensagem", "Peregrinação", "Os Lusíadas", "Os Maias"], "Os Lusíadas", 3),
		// https://en.wikipedia.org/wiki/The_Posthumous_Memoirs_of_Brás_Cubas
		q("Which Brazilian author wrote The Posthumous Memoirs of Brás Cubas?", ["Machado de Assis", "Jorge Amado", "Graciliano Ramos", "José de Alencar"], "Machado de Assis", 3),
		// https://en.wikipedia.org/wiki/The_Hour_of_the_Star
		q("Which Brazilian author wrote The Hour of the Star?", ["Cecília Meireles", "Lygia Fagundes Telles", "Clarice Lispector", "Rachel de Queiroz"], "Clarice Lispector", 3),
		// https://en.wikipedia.org/wiki/Pedro_Páramo
		q("Which Mexican author wrote the 1955 novel Pedro Páramo?", ["Carlos Fuentes", "Elena Poniatowska", "Octavio Paz", "Juan Rulfo"], "Juan Rulfo", 3),
		// https://en.wikipedia.org/wiki/Hopscotch_(Cortázar_novel)
		q("Which Argentine author wrote the novel Hopscotch (Rayuela)?", ["Julio Cortázar", "Jorge Luis Borges", "Ernesto Sabato", "Adolfo Bioy Casares"], "Julio Cortázar", 3),
		// https://en.wikipedia.org/wiki/The_Invention_of_Morel
		q("Which Argentine author wrote The Invention of Morel?", ["Roberto Arlt", "Julio Cortázar", "Adolfo Bioy Casares", "Ricardo Piglia"], "Adolfo Bioy Casares", 3),
		// https://en.wikipedia.org/wiki/The_Time_of_the_Hero
		q("Which Peruvian author wrote The Time of the Hero?", ["Mario Vargas Llosa", "José María Arguedas", "Ciro Alegría", "Alfredo Bryce Echenique"], "Mario Vargas Llosa", 3),
		// https://en.wikipedia.org/wiki/2666
		q("Which Chilean author wrote the novel 2666?", ["Isabel Allende", "José Donoso", "Alejandro Zambra", "Roberto Bolaño"], "Roberto Bolaño", 3),
		// https://en.wikipedia.org/wiki/The_Cairo_Trilogy
		q("Which Egyptian author wrote the Cairo Trilogy?", ["Yusuf Idris", "Tawfiq al-Hakim", "Taha Hussein", "Naguib Mahfouz"], "Naguib Mahfouz", 3),
		// https://en.wikipedia.org/wiki/Season_of_Migration_to_the_North
		q("Which Sudanese author wrote Season of Migration to the North?", ["Ahmadou Kourouma", "Nuruddin Farah", "Tayeb Salih", "Ngũgĩ wa Thiong'o"], "Tayeb Salih", 3),
		// https://en.wikipedia.org/wiki/A_Grain_of_Wheat
		q("Which Kenyan author wrote A Grain of Wheat?", ["Meja Mwangi", "Ngũgĩ wa Thiong'o", "Wole Soyinka", "Chinua Achebe"], "Ngũgĩ wa Thiong'o", 3),
		// https://en.wikipedia.org/wiki/So_Long_a_Letter
		q("Which Senegalese author wrote the epistolary novel So Long a Letter?", ["Ousmane Sembène", "Aminata Sow Fall", "Ken Bugul", "Mariama Bâ"], "Mariama Bâ", 3),
		// https://en.wikipedia.org/wiki/Memed,_My_Hawk
		q("Which Turkish author wrote Memed, My Hawk?", ["Sabahattin Ali", "Orhan Pamuk", "Orhan Kemal", "Yaşar Kemal"], "Yaşar Kemal", 3),
		// https://en.wikipedia.org/wiki/Snow_Country
		q("Which Japanese author wrote Snow Country?", ["Jun'ichirō Tanizaki", "Yasunari Kawabata", "Yukio Mishima", "Kōbō Abe"], "Yasunari Kawabata", 3),
		// https://en.wikipedia.org/wiki/The_Woman_in_the_Dunes
		q("Which Japanese author wrote The Woman in the Dunes?", ["Kenzaburō Ōe", "Yasunari Kawabata", "Kōbō Abe", "Shūsaku Endō"], "Kōbō Abe", 3),
		// https://en.wikipedia.org/wiki/Silence_(Endō_novel)
		q("Which Japanese author wrote the novel Silence about hidden Christians?", ["Yukio Mishima", "Ryūnosuke Akutagawa", "Shūsaku Endō", "Kōbō Abe"], "Shūsaku Endō", 3),
		// https://en.wikipedia.org/wiki/The_True_Story_of_Ah_Q
		q("Which Chinese author wrote The True Story of Ah Q?", ["Shen Congwen", "Lu Xun", "Ba Jin", "Lao She"], "Lu Xun", 3),
		// https://en.wikipedia.org/wiki/Rickshaw_Boy
		q("Which Chinese author wrote Rickshaw Boy?", ["Lu Xun", "Mao Dun", "Ba Jin", "Lao She"], "Lao She", 3),
		// https://en.wikipedia.org/wiki/Mo_Yan
		q("Which Chinese author won the 2012 Nobel Prize in Literature?", ["Su Tong", "Mo Yan", "Yu Hua", "Gao Xingjian"], "Mo Yan", 3),
		// https://en.wikipedia.org/wiki/Fatelessness
		q("Which Hungarian Nobel laureate wrote Fatelessness?", ["László Krasznahorkai", "Imre Kertész", "Péter Esterházy", "Sándor Márai"], "Imre Kertész", 3),
		// https://en.wikipedia.org/wiki/Quo_Vadis_(novel)
		q("Which Polish author wrote Quo Vadis?", ["Bolesław Prus", "Stefan Żeromski", "Władysław Reymont", "Henryk Sienkiewicz"], "Henryk Sienkiewicz", 3),
		// https://en.wikipedia.org/wiki/The_Peasants
		q("Which Polish author wrote the novel The Peasants?", ["Bolesław Prus", "Władysław Reymont", "Eliza Orzeszkowa", "Henryk Sienkiewicz"], "Władysław Reymont", 3),
		// https://en.wikipedia.org/wiki/Solaris_(novel)
		q("Which Polish author wrote Solaris?", ["Sławomir Mrożek", "Stanisław Lem", "Witold Gombrowicz", "Bruno Schulz"], "Stanisław Lem", 3),
		// https://en.wikipedia.org/wiki/Too_Loud_a_Solitude
		q("Which Czech author wrote Too Loud a Solitude?", ["Milan Kundera", "Ivan Klíma", "Josef Škvorecký", "Bohumil Hrabal"], "Bohumil Hrabal", 3),
		// https://en.wikipedia.org/wiki/The_Bridge_on_the_Drina
		q("Which Serbian-Yugoslav author wrote The Bridge on the Drina?", ["Miloš Crnjanski", "Danilo Kiš", "Ivo Andrić", "Meša Selimović"], "Ivo Andrić", 3),
		// https://en.wikipedia.org/wiki/The_General_of_the_Dead_Army
		q("Which Albanian author wrote The General of the Dead Army?", ["Migjeni", "Dritëro Agolli", "Fatos Kongoli", "Ismail Kadare"], "Ismail Kadare", 3),
		// https://en.wikipedia.org/wiki/Zorba_the_Greek
		q("Which Greek author wrote Zorba the Greek?", ["Stratis Myrivilis", "Nikos Kazantzakis", "Odysseas Elytis", "Giorgos Seferis"], "Nikos Kazantzakis", 3),
		// https://en.wikipedia.org/wiki/Zeno's_Conscience
		q("Which Italian author wrote Zeno's Conscience?", ["Giovanni Verga", "Luigi Pirandello", "Alberto Moravia", "Italo Svevo"], "Italo Svevo", 3),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Paraguay
		q("Which is the only landlocked country in South America besides Bolivia?", ["Paraguay", "Guyana", "Suriname", "Uruguay"], "Paraguay", 3),
		// https://en.wikipedia.org/wiki/Usumacinta_River
		q("Which river forms much of the border between Mexico and Guatemala?", ["Lempa", "Motagua", "Grijalva", "Usumacinta"], "Usumacinta", 3),
		// https://en.wikipedia.org/wiki/Sunda_Strait
		q("Which strait separates Java from Sumatra?", ["Lombok Strait", "Sunda Strait", "Strait of Malacca", "Bali Strait"], "Sunda Strait", 3),
		// https://en.wikipedia.org/wiki/Bab-el-Mandeb
		q("Which strait links the Red Sea to the Gulf of Aden?", ["Strait of Tiran", "Strait of Hormuz", "Bab-el-Mandeb", "Strait of Gibraltar"], "Bab-el-Mandeb", 3),
		// https://en.wikipedia.org/wiki/Mount_Kenya
		q("Which is the highest mountain in Africa outside Tanzania's Kilimanjaro, located in Kenya?", ["Mount Kenya", "Mount Stanley", "Mount Elgon", "Ras Dashen"], "Mount Kenya", 3),
		// https://en.wikipedia.org/wiki/Monte_Rosa
		q("Which is the highest peak in the Alps outside Mont Blanc's massif, on the Swiss–Italian border?", ["Dom", "Matterhorn", "Weisshorn", "Monte Rosa"], "Monte Rosa", 3),
		// https://en.wikipedia.org/wiki/Puncak_Jaya
		q("Which is the highest mountain in Oceania's island of New Guinea?", ["Mount Cook", "Mount Wilhelm", "Puncak Jaya", "Mount Kosciuszko"], "Puncak Jaya", 3),
		// https://en.wikipedia.org/wiki/Mount_Erebus
		q("Which active volcano is the southernmost in the world, on Ross Island?", ["Mount Melbourne", "Deception Island", "Mount Erebus", "Mount Terror"], "Mount Erebus", 3),
		// https://en.wikipedia.org/wiki/Negev
		q("Which desert covers much of southern Israel?", ["Judean", "Sinai", "Negev", "Arabah"], "Negev", 3),
		// https://en.wikipedia.org/wiki/Vanuatu
		q("Which island country lies between Australia and Fiji, with Port Vila as capital?", ["Solomon Islands", "Vanuatu", "Tonga", "Samoa"], "Vanuatu", 3),
		// https://en.wikipedia.org/wiki/Paramaribo
		q("Which country's capital is Paramaribo?", ["Belize", "French Guiana", "Guyana", "Suriname"], "Suriname", 3),
		// https://en.wikipedia.org/wiki/Nouakchott
		q("Which country's capital is Nouakchott?", ["Senegal", "Western Sahara", "Mali", "Mauritania"], "Mauritania", 3),
	],
};
