import { q } from "../quiz";
import type { TriviaQ } from "../types";

/**
 * Nov 9, 2026 bulk add, sub-batch 3 (0.1.138): evergreen geography (lakes, peaks, islands, rivers, volcanoes, parks), political, celebrity voice roles, science.
 * No math, no local. Every card has a Wikipedia source comment; fact-level dup-checked vs whole deck.
 */

type PlusCat = "sports" | "political" | "food" | "arts" | "science" | "history" | "nature" | "games" | "celebrity" | "music" | "books" | "geography";

export const PLUS_20261109C: Partial<Record<PlusCat, TriviaQ[]>> = {
	sports: [
		// https://en.wikipedia.org/wiki/Franz_Beckenbauer
		q("In which city was footballer Franz Beckenbauer born?", ["Berlin", "Dortmund", "Hamburg", "Munich"], "Munich", 2),
	],
	political: [
		// https://en.wikipedia.org/wiki/Folketing
		q("What is the name of Denmark's parliament?", ["Folketing", "Althing", "Storting", "Riksdag"], "Folketing", 2),
		// https://en.wikipedia.org/wiki/Riksdag
		q("What is the name of Sweden's parliament?", ["Storting", "Eduskunta", "Folketing", "Riksdag"], "Riksdag", 2),
		// https://en.wikipedia.org/wiki/Parliament_of_Finland
		q("What is the name of Finland's parliament?", ["Seimas", "Eduskunta", "Saeima", "Riksdag"], "Eduskunta", 2),
		// https://en.wikipedia.org/wiki/Saeima
		q("What is the name of Latvia's parliament?", ["Saeima", "Sejm", "Seimas", "Riigikogu"], "Saeima", 2),
		// https://en.wikipedia.org/wiki/Riigikogu
		q("What is the name of Estonia's parliament?", ["Riigikogu", "Eduskunta", "Saeima", "Seimas"], "Riigikogu", 2),
		// https://en.wikipedia.org/wiki/Seimas
		q("What is the name of Lithuania's parliament?", ["Sejm", "Riigikogu", "Saeima", "Seimas"], "Seimas", 2),
		// https://en.wikipedia.org/wiki/Tánaiste
		q("What is Ireland's deputy prime minister called?", ["Seanadóir", "Teachta Dála", "Tánaiste", "Taoiseach"], "Tánaiste", 2),
		// https://en.wikipedia.org/wiki/Rajya_Sabha
		q("What is the upper house of India's parliament called?", ["Vidhan Parishad", "Lok Sabha", "Rajya Sabha", "Majlis"], "Rajya Sabha", 2),
		// https://en.wikipedia.org/wiki/Federation_Council_(Russia)
		q("What is the upper house of Russia's parliament called?", ["Federation Council", "Supreme Soviet", "State Duma", "Security Council"], "Federation Council", 2),
		// https://en.wikipedia.org/wiki/Assembly_of_the_Republic_(Portugal)
		q("What is the name of Portugal's parliament?", ["National Council", "Cortes Generales", "Chamber of Deputies", "Assembly of the Republic"], "Assembly of the Republic", 2),
		// https://en.wikipedia.org/wiki/National_Council_(Austria)
		q("What is the name of the Austrian parliament's lower house?", ["National Council", "Landtag", "Federal Council", "Bundestag"], "National Council", 2),
		// https://en.wikipedia.org/wiki/Bundesrat_of_Germany
		q("What is the name of Germany's upper legislative chamber representing the states?", ["Bundesrat", "Bundestag", "Landtag", "Reichstag"], "Bundesrat", 2),
		// https://en.wikipedia.org/wiki/Islamic_Consultative_Assembly
		q("What is the name of Iran's parliament?", ["Shura Council", "Knesset", "Loya Jirga", "Majlis"], "Majlis", 2),
		// https://en.wikipedia.org/wiki/Loya_jirga
		q("What is Afghanistan's traditional grand assembly called?", ["Majlis", "Shura Council", "Diwan", "Loya Jirga"], "Loya Jirga", 2),
		// https://en.wikipedia.org/wiki/Verkhovna_Rada
		q("What is the name of Ukraine's parliament?", ["Seimas", "Sejm", "State Duma", "Verkhovna Rada"], "Verkhovna Rada", 2),
		// https://en.wikipedia.org/wiki/State_Great_Khural
		q("What is the name of Mongolia's parliament?", ["Majlis", "State Great Khural", "Supreme Assembly", "Loya Jirga"], "State Great Khural", 2),
		// https://en.wikipedia.org/wiki/Supreme_People's_Assembly
		q("What is the name of North Korea's legislature?", ["Central Committee", "Supreme People's Assembly", "National Assembly", "National People's Congress"], "Supreme People's Assembly", 2),
		// https://en.wikipedia.org/wiki/National_People's_Congress
		q("What is the name of China's national legislature?", ["State Council", "Politburo", "Supreme People's Assembly", "National People's Congress"], "National People's Congress", 2),
		// https://en.wikipedia.org/wiki/Tynwald
		q("What is the Isle of Man's parliament called?", ["Tynwald", "Stormont", "States of Jersey", "Althing"], "Tynwald", 2),
		// https://en.wikipedia.org/wiki/Golda_Meir
		q("Who was Israel's first female prime minister?", ["Shulamit Aloni", "Golda Meir", "Tzipi Livni", "Ayelet Shaked"], "Golda Meir", 2),
		// https://en.wikipedia.org/wiki/Benazir_Bhutto
		q("Who was Pakistan's first female prime minister?", ["Hina Rabbani Khar", "Maryam Nawaz", "Benazir Bhutto", "Fatima Jinnah"], "Benazir Bhutto", 2),
		// https://en.wikipedia.org/wiki/Indira_Gandhi
		q("Who was India's first female prime minister?", ["Pratibha Patil", "Indira Gandhi", "Sonia Gandhi", "Sarojini Naidu"], "Indira Gandhi", 1),
		// https://en.wikipedia.org/wiki/Julia_Gillard
		q("Who was Australia's first female prime minister?", ["Julia Gillard", "Penny Wong", "Tanya Plibersek", "Julie Bishop"], "Julia Gillard", 1),
		// https://en.wikipedia.org/wiki/Jenny_Shipley
		q("Who was New Zealand's first female prime minister?", ["Helen Clark", "Judith Collins", "Jacinda Ardern", "Jenny Shipley"], "Jenny Shipley", 2),
		// https://en.wikipedia.org/wiki/Kim_Campbell
		q("Who was Canada's first female prime minister?", ["Rachel Notley", "Kim Campbell", "Audrey McLaughlin", "Chrystia Freeland"], "Kim Campbell", 2),
		// https://en.wikipedia.org/wiki/Angela_Merkel
		q("Who was Germany's first female chancellor?", ["Renate Künast", "Annegret Kramp-Karrenbauer", "Ursula von der Leyen", "Angela Merkel"], "Angela Merkel", 1),
		// https://en.wikipedia.org/wiki/Ellen_Johnson_Sirleaf
		q("Who was the first woman elected president of Liberia, and of any African country?", ["Sahle-Work Zewde", "Leymah Gbowee", "Joyce Banda", "Ellen Johnson Sirleaf"], "Ellen Johnson Sirleaf", 2),
		// https://en.wikipedia.org/wiki/Vigdís_Finnbogadóttir
		q("Who was the first woman elected president of Iceland, in 1980?", ["Halla Tómasdóttir", "Katrín Jakobsdóttir", "Vigdís Finnbogadóttir", "Jóhanna Sigurðardóttir"], "Vigdís Finnbogadóttir", 2),
		// https://en.wikipedia.org/wiki/Claudia_Sheinbaum
		q("Who was the first female president of Mexico, elected in 2024?", ["Claudia Sheinbaum", "Josefina Vázquez Mota", "Xóchitl Gálvez", "Beatriz Paredes"], "Claudia Sheinbaum", 1),
		// https://en.wikipedia.org/wiki/Trygve_Lie
		q("Who was the first UN Secretary-General?", ["Trygve Lie", "Kurt Waldheim", "U Thant", "Dag Hammarskjöld"], "Trygve Lie", 2),
		// https://en.wikipedia.org/wiki/Dag_Hammarskjöld
		q("Which Swedish UN Secretary-General died in a 1961 plane crash?", ["Trygve Lie", "Olof Palme", "Folke Bernadotte", "Dag Hammarskjöld"], "Dag Hammarskjöld", 2),
		// https://en.wikipedia.org/wiki/U_Thant
		q("Which UN Secretary-General came from Burma?", ["Ban Ki-moon", "U Thant", "Javier Pérez de Cuéllar", "Kofi Annan"], "U Thant", 2),
		// https://en.wikipedia.org/wiki/Javier_Pérez_de_Cuéllar
		q("Which UN Secretary-General came from Peru?", ["Kurt Waldheim", "Boutros Boutros-Ghali", "Javier Pérez de Cuéllar", "U Thant"], "Javier Pérez de Cuéllar", 2),
		// https://en.wikipedia.org/wiki/Boutros_Boutros-Ghali
		q("Which UN Secretary-General came from Egypt?", ["Javier Pérez de Cuéllar", "Kurt Waldheim", "Kofi Annan", "Boutros Boutros-Ghali"], "Boutros Boutros-Ghali", 2),
		// https://en.wikipedia.org/wiki/Kurt_Waldheim
		q("Which UN Secretary-General came from Austria?", ["Ban Ki-moon", "Kurt Waldheim", "Dag Hammarskjöld", "Trygve Lie"], "Kurt Waldheim", 2),
		// https://en.wikipedia.org/wiki/António_Guterres
		q("Which UN Secretary-General came from Portugal?", ["Javier Pérez de Cuéllar", "Kurt Waldheim", "António Guterres", "José Manuel Barroso"], "António Guterres", 2),
		// https://en.wikipedia.org/wiki/Kofi_Annan
		q("Which UN Secretary-General came from Ghana?", ["Ban Ki-moon", "U Thant", "Kofi Annan", "Boutros Boutros-Ghali"], "Kofi Annan", 1),
		// https://en.wikipedia.org/wiki/Walter_Hallstein
		q("Who was the first President of the European Commission?", ["Jacques Delors", "Jean Monnet", "Walter Hallstein", "Roy Jenkins"], "Walter Hallstein", 2),
		// https://en.wikipedia.org/wiki/Roy_Jenkins
		q("Which British politician was President of the European Commission from 1977 to 1981?", ["Roy Jenkins", "Leon Brittan", "Chris Patten", "Neil Kinnock"], "Roy Jenkins", 2),
		// https://en.wikipedia.org/wiki/Hastings_Ismay,_1st_Baron_Ismay
		q("Who was the first Secretary General of NATO?", ["Manlio Brosio", "Joseph Luns", "Lord Ismay", "Paul-Henri Spaak"], "Lord Ismay", 2),
		// https://en.wikipedia.org/wiki/John_Marshall
		q("Who was the longest-serving Chief Justice of the United States?", ["Roger Taney", "Earl Warren", "William Rehnquist", "John Marshall"], "John Marshall", 2),
		// https://en.wikipedia.org/wiki/William_Howard_Taft
		q("Which former US president later served as Chief Justice?", ["William Howard Taft", "Grover Cleveland", "John Quincy Adams", "Woodrow Wilson"], "William Howard Taft", 2),
		// https://en.wikipedia.org/wiki/Sonia_Sotomayor
		q("Who was the first Hispanic justice of the US Supreme Court?", ["Ketanji Brown Jackson", "Sonia Sotomayor", "Elena Kagan", "Alberto Gonzales"], "Sonia Sotomayor", 2),
		// https://en.wikipedia.org/wiki/Hannibal_Hamlin
		q("Which vice president served under Abraham Lincoln in his first term?", ["John C. Breckinridge", "Schuyler Colfax", "Andrew Johnson", "Hannibal Hamlin"], "Hannibal Hamlin", 2),
		// https://en.wikipedia.org/wiki/Maastricht_Treaty
		q("Which treaty created the European Union in 1992?", ["Treaty of Rome", "Lisbon Treaty", "Treaty of Nice", "Maastricht Treaty"], "Maastricht Treaty", 2),
		// https://en.wikipedia.org/wiki/Treaty_of_Rome
		q("Which 1957 treaty created the European Economic Community?", ["Maastricht Treaty", "Lisbon Treaty", "Treaty of Rome", "Treaty of Paris"], "Treaty of Rome", 2),
		// https://en.wikipedia.org/wiki/European_Court_of_Human_Rights
		q("In which city is the European Court of Human Rights based?", ["Brussels", "The Hague", "Luxembourg", "Strasbourg"], "Strasbourg", 2),
		// https://en.wikipedia.org/wiki/Court_of_Justice_of_the_European_Union
		q("In which city is the Court of Justice of the European Union based?", ["The Hague", "Brussels", "Luxembourg", "Strasbourg"], "Luxembourg", 2),
		// https://en.wikipedia.org/wiki/OPEC
		q("In which city is OPEC headquartered?", ["Riyadh", "Geneva", "Doha", "Vienna"], "Vienna", 2),
		// https://en.wikipedia.org/wiki/World_Trade_Organization
		q("In which city is the World Trade Organization headquartered?", ["Washington, D.C.", "New York City", "Geneva", "Brussels"], "Geneva", 2),
		// https://en.wikipedia.org/wiki/African_Union
		q("In which city is the African Union headquartered?", ["Nairobi", "Addis Ababa", "Abuja", "Johannesburg"], "Addis Ababa", 2),
		// https://en.wikipedia.org/wiki/ASEAN
		q("In which city is ASEAN's secretariat based?", ["Manila", "Jakarta", "Singapore", "Bangkok"], "Jakarta", 2),
	],
	arts: [
		// https://en.wikipedia.org/wiki/Sergei_Eisenstein
		q("In which city was film director Sergei Eisenstein born?", ["Saint Petersburg", "Riga", "Moscow", "Kyiv"], "Riga", 2),
	],
	science: [
		// https://en.wikipedia.org/wiki/Polonium
		q("Which element did Marie and Pierre Curie name after Marie's homeland?", ["radium", "polonium", "curium", "francium"], "polonium", 2),
		// https://en.wikipedia.org/wiki/Xenon
		q("Which element is named after the Greek word for 'stranger' or 'foreign'?", ["krypton", "xenon", "argon", "neon"], "xenon", 2),
		// https://en.wikipedia.org/wiki/Krypton
		q("Which element's name comes from the Greek for 'hidden'?", ["argon", "krypton", "xenon", "radon"], "krypton", 2),
		// https://en.wikipedia.org/wiki/Argon
		q("Which element's name comes from the Greek for 'lazy' or 'idle'?", ["neon", "argon", "xenon", "helium"], "argon", 2),
		// https://en.wikipedia.org/wiki/Helium
		q("Which element was first detected in the Sun's spectrum before being found on Earth?", ["hydrogen", "neon", "helium", "lithium"], "helium", 2),
		// https://en.wikipedia.org/wiki/Selenium
		q("Which element is named after the Moon (Greek 'selene')?", ["tellurium", "selenium", "palladium", "cerium"], "selenium", 2),
		// https://en.wikipedia.org/wiki/Tellurium
		q("Which element is named after the Earth (Latin 'tellus')?", ["thorium", "terbium", "tellurium", "selenium"], "tellurium", 2),
		// https://en.wikipedia.org/wiki/Thorium
		q("Which element is named after the Norse god of thunder?", ["titanium", "tantalum", "vanadium", "thorium"], "thorium", 2),
		// https://en.wikipedia.org/wiki/Vanadium
		q("Which element is named after a Scandinavian goddess, Vanadís?", ["vanadium", "tantalum", "thorium", "niobium"], "vanadium", 2),
		// https://en.wikipedia.org/wiki/Titanium
		q("Which element is named after the Titans of Greek myth?", ["titanium", "thorium", "tantalum", "promethium"], "titanium", 2),
		// https://en.wikipedia.org/wiki/Niobium
		q("Which element is named after Niobe, daughter of Tantalus?", ["nobelium", "niobium", "neodymium", "tantalum"], "niobium", 3),
		// https://en.wikipedia.org/wiki/Ytterby
		q("Which Swedish village gave its name to four chemical elements?", ["Ytterby", "Uppsala", "Kiruna", "Falun"], "Ytterby", 2),
		// https://en.wikipedia.org/wiki/Californium
		q("Which element was named after the University of California's home state?", ["berkelium", "americium", "californium", "lawrencium"], "californium", 2),
		// https://en.wikipedia.org/wiki/Mendelevium
		q("Which element is named after Dmitri Mendeleev?", ["fermium", "nobelium", "mendelevium", "lawrencium"], "mendelevium", 2),
		// https://en.wikipedia.org/wiki/Tungsten
		q("Which element's symbol is W, from its German name wolfram?", ["tungsten", "vanadium", "tin", "titanium"], "tungsten", 2),
		// https://en.wikipedia.org/wiki/Antimony
		q("Which element has the chemical symbol Sb?", ["antimony", "samarium", "strontium", "tin"], "antimony", 2),
		// https://en.wikipedia.org/wiki/Ohm
		q("The SI unit of electrical resistance is named after which German physicist?", ["Georg Ohm", "Alessandro Volta", "Heinrich Hertz", "Gustav Kirchhoff"], "Georg Ohm", 2),
		// https://en.wikipedia.org/wiki/Tesla_(unit)
		q("The SI unit of magnetic flux density is named after which inventor?", ["Michael Faraday", "Wilhelm Weber", "Nikola Tesla", "André-Marie Ampère"], "Nikola Tesla", 2),
		// https://en.wikipedia.org/wiki/Farad
		q("The SI unit of capacitance is named after which scientist?", ["Joseph Henry", "Michael Faraday", "André-Marie Ampère", "Charles-Augustin de Coulomb"], "Michael Faraday", 2),
		// https://en.wikipedia.org/wiki/Henry_(unit)
		q("The SI unit of inductance is named after which American scientist?", ["Benjamin Franklin", "Joseph Henry", "Thomas Edison", "Michael Faraday"], "Joseph Henry", 2),
		// https://en.wikipedia.org/wiki/Gray_(unit)
		q("The SI unit of absorbed radiation dose is named after which physicist?", ["Rolf Sievert", "Henri Becquerel", "Louis Harold Gray", "Ernest Rutherford"], "Louis Harold Gray", 2),
		// https://en.wikipedia.org/wiki/Becquerel
		q("The SI unit of radioactivity is named after which French physicist?", ["André-Marie Ampère", "Antoine Lavoisier", "Henri Becquerel", "Pierre Curie"], "Henri Becquerel", 2),
		// https://en.wikipedia.org/wiki/Ernest_Rutherford
		q("Who discovered the atomic nucleus in 1911?", ["J. J. Thomson", "Max Planck", "Niels Bohr", "Ernest Rutherford"], "Ernest Rutherford", 2),
		// https://en.wikipedia.org/wiki/William_Herschel
		q("Which astronomer discovered Uranus in 1781?", ["Edmond Halley", "Clyde Tombaugh", "Johann Galle", "William Herschel"], "William Herschel", 2),
		// https://en.wikipedia.org/wiki/Clyde_Tombaugh
		q("Who discovered Pluto in 1930?", ["Clyde Tombaugh", "William Herschel", "Edwin Hubble", "Percival Lowell"], "Clyde Tombaugh", 2),
		// https://en.wikipedia.org/wiki/Johann_Gottfried_Galle
		q("Which astronomer first observed Neptune in 1846?", ["Giuseppe Piazzi", "Urbain Le Verrier", "Johann Galle", "William Herschel"], "Johann Galle", 2),
		// https://en.wikipedia.org/wiki/Giuseppe_Piazzi
		q("Who discovered Ceres, the first known asteroid, in 1801?", ["Heinrich Olbers", "Giuseppe Piazzi", "William Herschel", "Johann Bode"], "Giuseppe Piazzi", 2),
		// https://en.wikipedia.org/wiki/Galilean_moons
		q("Who discovered Jupiter's four largest moons in 1610?", ["Johannes Kepler", "Galileo Galilei", "Christiaan Huygens", "Simon Marius"], "Galileo Galilei", 1),
		// https://en.wikipedia.org/wiki/Christiaan_Huygens
		q("Who discovered Saturn's largest moon, Titan, in 1655?", ["Giovanni Cassini", "William Herschel", "Galileo Galilei", "Christiaan Huygens"], "Christiaan Huygens", 2),
		// https://en.wikipedia.org/wiki/James_Hutton
		q("Who is known as the father of modern geology?", ["James Hutton", "Alfred Wegener", "William Smith", "Charles Lyell"], "James Hutton", 2),
		// https://en.wikipedia.org/wiki/Friedrich_Mohs
		q("Who devised the scale used to measure mineral hardness?", ["Friedrich Mohs", "Anders Celsius", "Giuseppe Mercalli", "Charles Richter"], "Friedrich Mohs", 2),
		// https://en.wikipedia.org/wiki/Carl_Linnaeus
		q("Who created the binomial naming system for species?", ["Georges Cuvier", "Gregor Mendel", "Charles Darwin", "Carl Linnaeus"], "Carl Linnaeus", 2),
		// https://en.wikipedia.org/wiki/Gregor_Mendel
		q("Which monk is called the father of genetics?", ["Carl Linnaeus", "Thomas Hunt Morgan", "Hugo de Vries", "Gregor Mendel"], "Gregor Mendel", 2),
		// https://en.wikipedia.org/wiki/Jonas_Salk
		q("Who developed the first successful polio vaccine?", ["Jonas Salk", "Edward Jenner", "Albert Sabin", "Louis Pasteur"], "Jonas Salk", 1),
		// https://en.wikipedia.org/wiki/Edward_Jenner
		q("Who developed the first smallpox vaccine in 1796?", ["Edward Jenner", "Jonas Salk", "Louis Pasteur", "Robert Koch"], "Edward Jenner", 1),
		// https://en.wikipedia.org/wiki/Robert_Koch
		q("Who identified the bacterium that causes tuberculosis in 1882?", ["Joseph Lister", "Louis Pasteur", "Paul Ehrlich", "Robert Koch"], "Robert Koch", 2),
		// https://en.wikipedia.org/wiki/Joseph_Lister
		q("Which surgeon pioneered antiseptic surgery in the 1860s?", ["Joseph Lister", "Ignaz Semmelweis", "Robert Koch", "John Snow"], "Joseph Lister", 2),
		// https://en.wikipedia.org/wiki/John_Snow
		q("Which doctor traced an 1854 London cholera outbreak to a water pump?", ["William Harvey", "John Snow", "Joseph Lister", "Edward Jenner"], "John Snow", 2),
		// https://en.wikipedia.org/wiki/William_Harvey
		q("Who first described the circulation of blood in 1628?", ["William Harvey", "Galen", "Andreas Vesalius", "Hippocrates"], "William Harvey", 2),
		// https://en.wikipedia.org/wiki/Christiaan_Barnard
		q("Who performed the first human heart transplant in 1967?", ["Norman Shumway", "Christiaan Barnard", "Denton Cooley", "Michael DeBakey"], "Christiaan Barnard", 2),
	],
	history: [
		// https://en.wikipedia.org/wiki/Mother_Teresa
		q("Mother Teresa was born in which present-day capital?", ["Skopje", "Tirana", "Pristina", "Sofia"], "Skopje", 2),
		// https://en.wikipedia.org/wiki/Mother_Teresa
		q("What was Mother Teresa's birth name?", ["Ana Gonxhe Kola", "Anjezë Gonxhe Bojaxhiu", "Teresa Ana Bojović", "Agnes Maria Kowalska"], "Anjezë Gonxhe Bojaxhiu", 2),
		// https://en.wikipedia.org/wiki/Nero
		q("What was Roman emperor Nero's birth name?", ["Lucius Domitius Ahenobarbus", "Tiberius Claudius Drusus", "Marcus Annius Verus", "Gaius Julius Caesar"], "Lucius Domitius Ahenobarbus", 2),
		// https://en.wikipedia.org/wiki/Helmut_Schmidt
		q("In which city was chancellor Helmut Schmidt born?", ["Hamburg", "Cologne", "Berlin", "Bremen"], "Hamburg", 2),
		// https://en.wikipedia.org/wiki/Albert_Schweitzer
		q("In which Alsatian town was Albert Schweitzer born?", ["Colmar", "Kaysersberg", "Mulhouse", "Strasbourg"], "Kaysersberg", 3),
	],
	celebrity: [
		// https://en.wikipedia.org/wiki/Moana_(2016_film)
		q("Who voices Maui in Disney's 'Moana'?", ["Temuera Morrison", "Jason Momoa", "Vin Diesel", "Dwayne Johnson"], "Dwayne Johnson", 2),
		// https://en.wikipedia.org/wiki/Finding_Nemo
		q("Who voiced Marlin in 'Finding Nemo'?", ["Billy Crystal", "Albert Brooks", "Ray Romano", "Tim Allen"], "Albert Brooks", 2),
		// https://en.wikipedia.org/wiki/Monsters,_Inc.
		q("Who voices Mike Wazowski in 'Monsters, Inc.'?", ["Steve Buscemi", "John Goodman", "Robin Williams", "Billy Crystal"], "Billy Crystal", 1),
		// https://en.wikipedia.org/wiki/Monsters,_Inc.
		q("Who voices Sulley in 'Monsters, Inc.'?", ["Ed Asner", "Billy Crystal", "James Earl Jones", "John Goodman"], "John Goodman", 1),
		// https://en.wikipedia.org/wiki/Cars_(film)
		q("Who voiced Lightning McQueen in 'Cars'?", ["Owen Wilson", "Larry the Cable Guy", "Paul Newman", "Luke Wilson"], "Owen Wilson", 1),
		// https://en.wikipedia.org/wiki/The_Lion_King
		q("Who voiced Mufasa in the 1994 'The Lion King'?", ["Matthew Broderick", "Morgan Freeman", "Jeremy Irons", "James Earl Jones"], "James Earl Jones", 1),
		// https://en.wikipedia.org/wiki/The_Lion_King
		q("Who voiced Scar in the 1994 'The Lion King'?", ["James Earl Jones", "Tim Curry", "Alan Rickman", "Jeremy Irons"], "Jeremy Irons", 2),
		// https://en.wikipedia.org/wiki/The_Incredibles
		q("Who voiced Mr. Incredible in 'The Incredibles'?", ["Tim Allen", "Craig T. Nelson", "Jason Lee", "Samuel L. Jackson"], "Craig T. Nelson", 2),
		// https://en.wikipedia.org/wiki/The_Incredibles
		q("Who voiced Frozone in 'The Incredibles'?", ["Samuel L. Jackson", "Jamie Foxx", "Craig T. Nelson", "Laurence Fishburne"], "Samuel L. Jackson", 2),
		// https://en.wikipedia.org/wiki/The_Incredibles
		q("Who voiced Edna Mode in 'The Incredibles'?", ["Brad Bird", "Holly Hunter", "Wallace Shawn", "Jason Lee"], "Brad Bird", 2),
		// https://en.wikipedia.org/wiki/Up_(2009_film)
		q("Who voiced Carl in Pixar's 'Up'?", ["Christopher Plummer", "Ed Asner", "Jordan Nagai", "John Ratzenberger"], "Ed Asner", 2),
		// https://en.wikipedia.org/wiki/Despicable_Me
		q("Who voices Gru in 'Despicable Me'?", ["Russell Brand", "Steve Carell", "Will Arnett", "Jason Segel"], "Steve Carell", 1),
		// https://en.wikipedia.org/wiki/Ice_Age_(2002_film)
		q("Who voices Manny in 'Ice Age'?", ["Seann William Scott", "Ray Romano", "Denis Leary", "John Leguizamo"], "Ray Romano", 2),
		// https://en.wikipedia.org/wiki/Ice_Age_(2002_film)
		q("Who voices Sid in 'Ice Age'?", ["Ray Romano", "John Leguizamo", "Denis Leary", "Queen Latifah"], "John Leguizamo", 2),
		// https://en.wikipedia.org/wiki/Tangled
		q("Who voiced Rapunzel in Disney's 'Tangled'?", ["Mandy Moore", "Hilary Duff", "Kristen Bell", "Anne Hathaway"], "Mandy Moore", 2),
		// https://en.wikipedia.org/wiki/Zootopia
		q("Who voiced Judy Hopps in 'Zootopia'?", ["Anna Faris", "Emma Stone", "Ginnifer Goodwin", "Kristen Bell"], "Ginnifer Goodwin", 2),
		// https://en.wikipedia.org/wiki/Zootopia
		q("Who voiced Nick Wilde in 'Zootopia'?", ["Idris Elba", "Ryan Reynolds", "Jason Bateman", "Justin Long"], "Jason Bateman", 2),
		// https://en.wikipedia.org/wiki/Inside_Out_(2015_film)
		q("Who voiced Joy in Pixar's 'Inside Out'?", ["Amy Poehler", "Tina Fey", "Phyllis Smith", "Mindy Kaling"], "Amy Poehler", 2),
		// https://en.wikipedia.org/wiki/Wreck-It_Ralph
		q("Who voiced Wreck-It Ralph?", ["John C. Reilly", "Will Ferrell", "Seth Rogen", "Jack Black"], "John C. Reilly", 2),
		// https://en.wikipedia.org/wiki/Wreck-It_Ralph
		q("Who voiced Vanellope von Schweetz in 'Wreck-It Ralph'?", ["Kristen Bell", "Mindy Kaling", "Jane Lynch", "Sarah Silverman"], "Sarah Silverman", 2),
		// https://en.wikipedia.org/wiki/The_Lego_Movie
		q("Who voices Emmet in 'The Lego Movie'?", ["Chris Pratt", "Will Arnett", "Will Ferrell", "Jonah Hill"], "Chris Pratt", 1),
		// https://en.wikipedia.org/wiki/The_Lego_Movie
		q("Who voices Batman in 'The Lego Movie'?", ["Chris Pratt", "Will Arnett", "Michael Keaton", "Jason Bateman"], "Will Arnett", 2),
		// https://en.wikipedia.org/wiki/Fantastic_Mr._Fox_(film)
		q("Who voiced Mr. Fox in 'Fantastic Mr. Fox' (2009)?", ["Owen Wilson", "Jason Schwartzman", "Bill Murray", "George Clooney"], "George Clooney", 2),
		// https://en.wikipedia.org/wiki/Shrek
		q("Who voiced Princess Fiona in 'Shrek'?", ["Julia Roberts", "Drew Barrymore", "Reese Witherspoon", "Cameron Diaz"], "Cameron Diaz", 1),
		// https://en.wikipedia.org/wiki/Puss_in_Boots_(Shrek)
		q("Who voiced Puss in Boots in the 'Shrek' films?", ["Gael García Bernal", "Javier Bardem", "Antonio Banderas", "Andy García"], "Antonio Banderas", 1),
		// https://en.wikipedia.org/wiki/Toy_Story_2
		q("Who voiced Jessie in 'Toy Story 2'?", ["Jodi Benson", "Annie Potts", "Laurie Metcalf", "Joan Cusack"], "Joan Cusack", 2),
		// https://en.wikipedia.org/wiki/Spider-Man:_Into_the_Spider-Verse
		q("Who voices Miles Morales in 'Spider-Man: Into the Spider-Verse'?", ["Hailee Steinfeld", "Donald Glover", "Jake Johnson", "Shameik Moore"], "Shameik Moore", 2),
		// https://en.wikipedia.org/wiki/Megamind
		q("Who voiced Megamind in the 2010 film?", ["Steve Carell", "Will Ferrell", "Jack Black", "Brad Pitt"], "Will Ferrell", 2),
		// https://en.wikipedia.org/wiki/How_to_Train_Your_Dragon_(2010_film)
		q("Who voiced Hiccup in 'How to Train Your Dragon' (2010)?", ["Jay Baruchel", "Christopher Mintz-Plasse", "T. J. Miller", "Jonah Hill"], "Jay Baruchel", 2),
		// https://en.wikipedia.org/wiki/Coco_(2017_film)
		q("Who voices Hector in Pixar's 'Coco'?", ["Gael García Bernal", "Edward James Olmos", "Anthony Gonzalez", "Benjamin Bratt"], "Gael García Bernal", 2),
	],
	music: [
		// https://en.wikipedia.org/wiki/Avicii
		q("What was DJ Avicii's real name?", ["Martin Garrix", "Axel Hedfors", "Tim Bergling", "Robin Carlsson"], "Tim Bergling", 2),
	],
	books: [
		// https://en.wikipedia.org/wiki/Molière
		q("What was the birth name of the playwright Molière?", ["Jean-Baptiste Racine", "François-Marie Arouet", "Pierre Corneille", "Jean-Baptiste Poquelin"], "Jean-Baptiste Poquelin", 2),
		// https://en.wikipedia.org/wiki/Thomas_Mann
		q("In which city was author Thomas Mann born?", ["Bremen", "Hamburg", "Munich", "Lübeck"], "Lübeck", 2),
		// https://en.wikipedia.org/wiki/Stefan_Zweig
		q("In which city was author Stefan Zweig born?", ["Prague", "Budapest", "Salzburg", "Vienna"], "Vienna", 2),
	],
	geography: [
		// https://en.wikipedia.org/wiki/Lake_Balkhash
		q("In which country is Lake Balkhash?", ["Uzbekistan", "Kazakhstan", "Mongolia", "Kyrgyzstan"], "Kazakhstan", 2),
		// https://en.wikipedia.org/wiki/Lake_Garda
		q("Lake Garda is in which country?", ["France", "Austria", "Switzerland", "Italy"], "Italy", 2),
		// https://en.wikipedia.org/wiki/Vänern
		q("Vänern, a huge lake, is in which country?", ["Norway", "Sweden", "Denmark", "Finland"], "Sweden", 2),
		// https://en.wikipedia.org/wiki/Saimaa
		q("The lake Saimaa is in which country?", ["Russia", "Sweden", "Estonia", "Finland"], "Finland", 2),
		// https://en.wikipedia.org/wiki/Lake_Sevan
		q("In which country is Lake Sevan?", ["Turkey", "Azerbaijan", "Armenia", "Georgia"], "Armenia", 2),
		// https://en.wikipedia.org/wiki/Lake_Zurich
		q("In which country is Lake Zurich?", ["Germany", "Liechtenstein", "Austria", "Switzerland"], "Switzerland", 2),
		// https://en.wikipedia.org/wiki/Chiemsee
		q("In which country is the lake Chiemsee?", ["Germany", "Czech Republic", "Switzerland", "Austria"], "Germany", 3),
		// https://en.wikipedia.org/wiki/Loch_Lomond
		q("Loch Lomond is in which part of the UK?", ["Scotland", "Northern Ireland", "England", "Wales"], "Scotland", 2),
		// https://en.wikipedia.org/wiki/Lake_Poopó
		q("Lake Poopó is in which country?", ["Bolivia", "Chile", "Ecuador", "Peru"], "Bolivia", 3),
		// https://en.wikipedia.org/wiki/Lake_Nyos
		q("Lake Nyos, site of a deadly 1986 gas eruption, is in which country?", ["Chad", "Nigeria", "Gabon", "Cameroon"], "Cameroon", 3),
		// https://en.wikipedia.org/wiki/Mývatn
		q("In which country is the lake Mývatn?", ["Norway", "Greenland", "Faroe Islands", "Iceland"], "Iceland", 2),
		// https://en.wikipedia.org/wiki/Lake_Bangweulu
		q("Lake Bangweulu is in which country?", ["Tanzania", "Zambia", "Malawi", "Mozambique"], "Zambia", 3),
		// https://en.wikipedia.org/wiki/Mjøsa
		q("In which country is Mjøsa, its largest lake?", ["Finland", "Sweden", "Norway", "Denmark"], "Norway", 2),
		// https://en.wikipedia.org/wiki/Lake_Chilwa
		q("In which country is Lake Chilwa?", ["Botswana", "Malawi", "Zimbabwe", "Zambia"], "Malawi", 3),
		// https://en.wikipedia.org/wiki/Karakul_(Tajikistan)
		q("The lake Karakul in the Pamirs is in which country?", ["Tajikistan", "Uzbekistan", "Afghanistan", "Kyrgyzstan"], "Tajikistan", 3),
		// https://en.wikipedia.org/wiki/Lake_Bohinj
		q("Lake Bohinj is in which country?", ["Slovenia", "Croatia", "Austria", "Slovakia"], "Slovenia", 3),
		// https://en.wikipedia.org/wiki/Lake_Texcoco
		q("The drained Lake Texcoco lay in which country?", ["Guatemala", "Colombia", "Peru", "Mexico"], "Mexico", 3),
		// https://en.wikipedia.org/wiki/Dhaulagiri
		q("In which country is the peak Dhaulagiri?", ["Bhutan", "Pakistan", "Nepal", "India"], "Nepal", 2),
		// https://en.wikipedia.org/wiki/Mount_Athos
		q("Mount Athos, home to monasteries, is in which country?", ["Cyprus", "Bulgaria", "Greece", "Albania"], "Greece", 2),
		// https://en.wikipedia.org/wiki/Mount_Damavand
		q("Mount Damavand, a volcano, is in which country?", ["Iraq", "Turkmenistan", "Iran", "Afghanistan"], "Iran", 2),
		// https://en.wikipedia.org/wiki/Puncak_Jaya
		q("In which country is Puncak Jaya?", ["Papua New Guinea", "Philippines", "Malaysia", "Indonesia"], "Indonesia", 2),
		// https://en.wikipedia.org/wiki/Mount_Pinatubo
		q("Mount Pinatubo, which erupted in 1991, is in which country?", ["Philippines", "Indonesia", "Japan", "Papua New Guinea"], "Philippines", 2),
		// https://en.wikipedia.org/wiki/Triglav
		q("Triglav, a national symbol, is the highest peak of which country?", ["Slovenia", "Slovakia", "Austria", "Croatia"], "Slovenia", 2),
		// https://en.wikipedia.org/wiki/Pico_de_Orizaba
		q("Pico de Orizaba is the highest peak of which country?", ["Colombia", "Guatemala", "Peru", "Mexico"], "Mexico", 2),
		// https://en.wikipedia.org/wiki/Gangkhar_Puensum
		q("Gangkhar Puensum, an unclimbed peak, is in which country?", ["India", "Nepal", "Bhutan", "Tibet"], "Bhutan", 2),
		// https://en.wikipedia.org/wiki/Nanda_Devi
		q("In which country is the peak Nanda Devi?", ["Pakistan", "Nepal", "India", "Bhutan"], "India", 2),
		// https://en.wikipedia.org/wiki/Hoverla
		q("Hoverla is the highest mountain of which country?", ["Romania", "Poland", "Ukraine", "Moldova"], "Ukraine", 3),
		// https://en.wikipedia.org/wiki/Gerlachovský_štít
		q("Gerlachovský štít is the highest peak of which country?", ["Poland", "Slovakia", "Hungary", "Czech Republic"], "Slovakia", 3),
		// https://en.wikipedia.org/wiki/Kebnekaise
		q("Kebnekaise is the highest mountain of which country?", ["Iceland", "Finland", "Norway", "Sweden"], "Sweden", 2),
		// https://en.wikipedia.org/wiki/Ismoil_Somoni_Peak
		q("Ismoil Somoni Peak is in which country?", ["Afghanistan", "Tajikistan", "Kyrgyzstan", "Kazakhstan"], "Tajikistan", 3),
		// https://en.wikipedia.org/wiki/Musala
		q("Musala is the highest peak of which country?", ["Bulgaria", "Romania", "Serbia", "North Macedonia"], "Bulgaria", 3),
		// https://en.wikipedia.org/wiki/Adam's_Peak
		q("Adam's Peak, a pilgrimage mountain, is in which country?", ["Bangladesh", "Sri Lanka", "Myanmar", "India"], "Sri Lanka", 2),
		// https://en.wikipedia.org/wiki/Monte_Titano
		q("Monte Titano is the highest point of which country?", ["Andorra", "Monaco", "Liechtenstein", "San Marino"], "San Marino", 2),
		// https://en.wikipedia.org/wiki/Toubkal
		q("Toubkal is the highest peak of which country?", ["Morocco", "Tunisia", "Libya", "Algeria"], "Morocco", 2),
		// https://en.wikipedia.org/wiki/Galdhøpiggen
		q("Galdhøpiggen is the highest mountain of which country?", ["Iceland", "Norway", "Finland", "Sweden"], "Norway", 2),
		// https://en.wikipedia.org/wiki/Aneto
		q("Aneto is the highest peak of the Pyrenees, in which country?", ["France", "Portugal", "Spain", "Andorra"], "Spain", 2),
		// https://en.wikipedia.org/wiki/Guam
		q("To which country does the island of Guam belong?", ["United States", "Australia", "Japan", "Philippines"], "United States", 1),
		// https://en.wikipedia.org/wiki/Tahiti
		q("Tahiti is part of which country's overseas territory?", ["Chile", "France", "United Kingdom", "New Zealand"], "France", 2),
		// https://en.wikipedia.org/wiki/Saba_(island)
		q("The Caribbean island Saba belongs to which country?", ["Netherlands", "United Kingdom", "Venezuela", "France"], "Netherlands", 2),
		// https://en.wikipedia.org/wiki/Elba
		q("Napoleon's first exile was on which Italian island?", ["Capri", "Ischia", "Sardinia", "Elba"], "Elba", 1),
		// https://en.wikipedia.org/wiki/Bornholm
		q("The Baltic island Bornholm belongs to which country?", ["Germany", "Poland", "Sweden", "Denmark"], "Denmark", 2),
		// https://en.wikipedia.org/wiki/Rügen
		q("Rügen, Germany's largest island, lies in which sea?", ["Norwegian Sea", "North Sea", "Baltic Sea", "Wadden Sea"], "Baltic Sea", 2),
		// https://en.wikipedia.org/wiki/Saaremaa
		q("Saaremaa is the largest island of which country?", ["Latvia", "Lithuania", "Finland", "Estonia"], "Estonia", 2),
		// https://en.wikipedia.org/wiki/Gozo
		q("Gozo is the second-largest island of which country?", ["Cyprus", "Greece", "Italy", "Malta"], "Malta", 2),
		// https://en.wikipedia.org/wiki/Wrangel_Island
		q("To which country does Wrangel Island belong?", ["Norway", "Russia", "Canada", "United States"], "Russia", 2),
		// https://en.wikipedia.org/wiki/Phú_Quốc
		q("Phú Quốc is the largest island of which country?", ["Thailand", "Cambodia", "Vietnam", "Malaysia"], "Vietnam", 2),
		// https://en.wikipedia.org/wiki/Banks_Island
		q("Banks Island in the Arctic belongs to which country?", ["Denmark", "Russia", "Canada", "United States"], "Canada", 3),
		// https://en.wikipedia.org/wiki/Djerba
		q("The island of Djerba belongs to which country?", ["Libya", "Algeria", "Morocco", "Tunisia"], "Tunisia", 2),
		// https://en.wikipedia.org/wiki/Marajó
		q("Marajó, a huge river island, is in which country?", ["Brazil", "Venezuela", "Colombia", "Peru"], "Brazil", 3),
		// https://en.wikipedia.org/wiki/Kiritimati
		q("Kiritimati (Christmas Island) in the Pacific belongs to which country?", ["Fiji", "Kiribati", "Tuvalu", "Tonga"], "Kiribati", 3),
		// https://en.wikipedia.org/wiki/Ko_Samui
		q("The resort island Ko Samui belongs to which country?", ["Cambodia", "Vietnam", "Malaysia", "Thailand"], "Thailand", 1),
		// https://en.wikipedia.org/wiki/North_Sentinel_Island
		q("North Sentinel Island belongs to which country?", ["India", "Sri Lanka", "Myanmar", "Bangladesh"], "India", 3),
		// https://en.wikipedia.org/wiki/Isla_de_la_Juventud
		q("Isla de la Juventud belongs to which country?", ["Cuba", "Honduras", "Mexico", "Dominican Republic"], "Cuba", 2),
		// https://en.wikipedia.org/wiki/Guadalcanal
		q("Guadalcanal is part of which country?", ["Vanuatu", "Solomon Islands", "Fiji", "Papua New Guinea"], "Solomon Islands", 2),
		// https://en.wikipedia.org/wiki/Lena_(river)
		q("The Lena River empties into which sea?", ["Bering Sea", "Kara Sea", "Barents Sea", "Laptev Sea"], "Laptev Sea", 2),
		// https://en.wikipedia.org/wiki/Ural_(river)
		q("The Ural River empties into which body of water?", ["Aral Sea", "Sea of Azov", "Caspian Sea", "Black Sea"], "Caspian Sea", 2),
		// https://en.wikipedia.org/wiki/Don_(river)
		q("The Don River empties into which sea?", ["Sea of Azov", "Black Sea", "Baltic Sea", "Caspian Sea"], "Sea of Azov", 2),
		// https://en.wikipedia.org/wiki/Po_(river)
		q("Italy's Po River empties into which sea?", ["Ionian Sea", "Ligurian Sea", "Adriatic Sea", "Tyrrhenian Sea"], "Adriatic Sea", 2),
		// https://en.wikipedia.org/wiki/Tiber
		q("Rome's Tiber River empties into which sea?", ["Ionian Sea", "Ligurian Sea", "Adriatic Sea", "Tyrrhenian Sea"], "Tyrrhenian Sea", 2),
		// https://en.wikipedia.org/wiki/Irtysh
		q("The Irtysh River is a tributary of which river?", ["Ob", "Volga", "Yenisei", "Lena"], "Ob", 2),
		// https://en.wikipedia.org/wiki/Daugava
		q("The Daugava River empties into which gulf?", ["Gulf of Gdańsk", "Gulf of Finland", "Gulf of Riga", "Gulf of Bothnia"], "Gulf of Riga", 2),
		// https://en.wikipedia.org/wiki/Limpopo_River
		q("The Limpopo River empties into which ocean?", ["Atlantic Ocean", "Pacific Ocean", "Indian Ocean", "Southern Ocean"], "Indian Ocean", 2),
		// https://en.wikipedia.org/wiki/Main_(river)
		q("Frankfurt's Main River is a tributary of which river?", ["Danube", "Elbe", "Rhine", "Weser"], "Rhine", 2),
		// https://en.wikipedia.org/wiki/Tisza
		q("Hungary's Tisza River is a tributary of which river?", ["Drava", "Sava", "Danube", "Vistula"], "Danube", 2),
		// https://en.wikipedia.org/wiki/Irrawaddy_River
		q("Myanmar's Irrawaddy River empties into which sea?", ["Andaman Sea", "Java Sea", "South China Sea", "Arabian Sea"], "Andaman Sea", 2),
		// https://en.wikipedia.org/wiki/Kama_(river)
		q("The Kama River is the main tributary of which river?", ["Volga", "Ural", "Don", "Dnieper"], "Volga", 2),
		// https://en.wikipedia.org/wiki/Rio_Negro_(Amazon)
		q("The Rio Negro is a tributary of which river?", ["Magdalena", "Paraná", "Amazon", "Orinoco"], "Amazon", 2),
		// https://en.wikipedia.org/wiki/Paraguay_River
		q("The Paraguay River is a tributary of which river?", ["Uruguay", "Paraná", "Orinoco", "Amazon"], "Paraná", 2),
		// https://en.wikipedia.org/wiki/Neman
		q("The Neman River empties into which sea?", ["White Sea", "North Sea", "Baltic Sea", "Black Sea"], "Baltic Sea", 2),
		// https://en.wikipedia.org/wiki/Magdalena_River
		q("Colombia's Magdalena River empties into which sea?", ["Sargasso Sea", "Pacific Ocean", "Caribbean Sea", "Gulf of Mexico"], "Caribbean Sea", 2),
		// https://en.wikipedia.org/wiki/Kolyma_(river)
		q("The Kolyma River empties into which sea?", ["East Siberian Sea", "Laptev Sea", "Sea of Okhotsk", "Kara Sea"], "East Siberian Sea", 3),
		// https://en.wikipedia.org/wiki/Shatt_al-Arab
		q("The Shatt al-Arab empties into which gulf?", ["Gulf of Oman", "Persian Gulf", "Red Sea", "Gulf of Aden"], "Persian Gulf", 2),
		// https://en.wikipedia.org/wiki/Volta_River
		q("Ghana's Volta River empties into which gulf?", ["Gulf of Guinea", "Gulf of Sidra", "Gulf of Aden", "Bight of Benin"], "Gulf of Guinea", 2),
		// https://en.wikipedia.org/wiki/Ubangi_River
		q("The Ubangi River is a tributary of which river?", ["Zambezi", "Niger", "Nile", "Congo"], "Congo", 2),
		// https://en.wikipedia.org/wiki/Spree_(river)
		q("Berlin's Spree River is a tributary of which river?", ["Havel", "Oder", "Elbe", "Rhine"], "Havel", 3),
		// https://en.wikipedia.org/wiki/Mount_Merapi
		q("Mount Merapi, an active volcano, is in which country?", ["Philippines", "Japan", "Indonesia", "Malaysia"], "Indonesia", 2),
		// https://en.wikipedia.org/wiki/Popocatépetl
		q("The volcano Popocatépetl is in which country?", ["Mexico", "Costa Rica", "Ecuador", "Guatemala"], "Mexico", 2),
		// https://en.wikipedia.org/wiki/Mayon
		q("Mayon, a near-perfect cone volcano, is in which country?", ["Japan", "Vanuatu", "Philippines", "Indonesia"], "Philippines", 2),
		// https://en.wikipedia.org/wiki/Nevado_del_Ruiz
		q("Nevado del Ruiz, whose 1985 eruption buried Armero, is in which country?", ["Chile", "Ecuador", "Peru", "Colombia"], "Colombia", 3),
		// https://en.wikipedia.org/wiki/Laki
		q("Laki, whose 1783 eruption caused famine, is in which country?", ["Italy", "Japan", "Indonesia", "Iceland"], "Iceland", 2),
		// https://en.wikipedia.org/wiki/Volcán_de_Fuego
		q("Volcán de Fuego is in which country?", ["Guatemala", "Nicaragua", "Mexico", "El Salvador"], "Guatemala", 3),
		// https://en.wikipedia.org/wiki/Erta_Ale
		q("Erta Ale, with a lava lake, is in which country?", ["Kenya", "Ethiopia", "Eritrea", "Djibouti"], "Ethiopia", 3),
		// https://en.wikipedia.org/wiki/Hallasan
		q("Hallasan volcano is on which island?", ["Taiwan", "Hokkaido", "Jeju", "Kyushu"], "Jeju", 2),
		// https://en.wikipedia.org/wiki/Pico_do_Fogo
		q("Pico do Fogo volcano is in which island nation?", ["Comoros", "Mauritius", "Cape Verde", "São Tomé and Príncipe"], "Cape Verde", 3),
		// https://en.wikipedia.org/wiki/Emi_Koussi
		q("Emi Koussi, the Sahara's highest peak, is in which country?", ["Libya", "Sudan", "Chad", "Niger"], "Chad", 3),
		// https://en.wikipedia.org/wiki/Mount_Pico
		q("Mount Pico, Portugal's highest peak, is in which island group?", ["Cape Verde", "Azores", "Madeira", "Canary Islands"], "Azores", 2),
		// https://en.wikipedia.org/wiki/Osorno_(volcano)
		q("Osorno volcano is in which country?", ["Bolivia", "Argentina", "Peru", "Chile"], "Chile", 3),
		// https://en.wikipedia.org/wiki/Virunga_National_Park
		q("Virunga National Park, home of mountain gorillas, is in which country?", ["Rwanda", "DR Congo", "Uganda", "Burundi"], "DR Congo", 2),
		// https://en.wikipedia.org/wiki/Teide_National_Park
		q("Teide National Park is on which island?", ["Mallorca", "Lanzarote", "Tenerife", "Gran Canaria"], "Tenerife", 1),
		// https://en.wikipedia.org/wiki/Kinabalu_Park
		q("Kinabalu Park is in which country?", ["Malaysia", "Indonesia", "Brunei", "Philippines"], "Malaysia", 2),
		// https://en.wikipedia.org/wiki/Canaima_National_Park
		q("Canaima National Park, home to Angel Falls, is in which country?", ["Brazil", "Guyana", "Venezuela", "Colombia"], "Venezuela", 2),
		// https://en.wikipedia.org/wiki/Torres_del_Paine_National_Park
		q("Torres del Paine National Park is in which country?", ["Peru", "Argentina", "Chile", "Bolivia"], "Chile", 2),
		// https://en.wikipedia.org/wiki/Etosha_National_Park
		q("Etosha National Park is in which country?", ["Namibia", "Zambia", "Botswana", "Angola"], "Namibia", 2),
		// https://en.wikipedia.org/wiki/Fort_Jesus
		q("Fort Jesus, a Portuguese fort, is in which Kenyan city?", ["Mombasa", "Nairobi", "Malindi", "Lamu"], "Mombasa", 3),
		// https://en.wikipedia.org/wiki/Tongariro_National_Park
		q("Tongariro National Park is in which country?", ["New Zealand", "Australia", "Chile", "Fiji"], "New Zealand", 2),
		// https://en.wikipedia.org/wiki/Mana_Pools_National_Park
		q("Mana Pools National Park is in which country?", ["Botswana", "Mozambique", "Zimbabwe", "Zambia"], "Zimbabwe", 3),
	],
};
