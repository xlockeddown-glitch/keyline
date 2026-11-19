# True/False seed sources (0.1.158)

Twenty-four statements, four in each of six fields. All are evergreen public facts; none are city-local or tied to a current event.

## Science

- `tf-sci-boil` — Water boils at ~100 °C at standard sea-level pressure. [CRC Handbook / standard atmospheric boiling point](https://en.wikipedia.org/wiki/Boiling_point_of_water)
- `tf-sci-sound` — Light is far faster than sound in air (~3×10⁸ m/s vs ~343 m/s). [NIST / standard values](https://en.wikipedia.org/wiki/Speed_of_light)
- `tf-sci-ag` — Gold is Au (Latin *aurum*); Ag is silver (*argentum*). [IUPAC periodic table](https://iupac.org/what-we-do/periodic-table-of-elements/)
- `tf-sci-venus` — Venus is the hottest planet; its CO₂ atmosphere yields surface temperatures over 450 °C, hotter than Mercury. [NASA Solar System Exploration, Venus](https://science.nasa.gov/venus/)

## History

- `tf-his-titanic` — RMS Titanic struck an iceberg on 14 April 1912 on its maiden voyage and sank early on 15 April. [Encyclopaedia Britannica](https://www.britannica.com/topic/Titanic)
- `tf-his-moon` — Apollo 11 landed on 20 July 1969. [NASA Apollo 11](https://www.nasa.gov/mission_pages/apollo/missions/apollo11.html)
- `tf-his-wall` — No human-made structure, including the Great Wall, is visible to the naked eye from the Moon. [NASA: "China's Wall Less Visible in Space"](https://www.nasa.gov/image-article/chinas-wall-less-great-from-space/)
- `tf-his-napoleon` — Napoleon was about 1.69 m (5 ft 7 in), around average for a Frenchman of his time; the "short" story comes from French vs English inches. [Britannica, Napoleon I](https://www.britannica.com/biography/Napoleon-I)

## Geography

- `tf-geo-aus` — Australia is the only country that covers a whole continent's mainland. [Geoscience Australia](https://www.ga.gov.au/education/classroom-resources/the-continent-of-australia)
- `tf-geo-africa` — Asia is the largest continent (~44.6 million km²); Africa is second (~30.4 million km²). [National Geographic / UN statistics](https://en.wikipedia.org/wiki/Continent)
- `tf-geo-nile` — The Nile flows north and empties into the Mediterranean through its delta in Egypt. [Encyclopaedia Britannica, Nile River](https://www.britannica.com/place/Nile-River)
- `tf-geo-everest` — Everest is highest above sea level; Mauna Kea is taller base to peak (over 10,000 m from the sea floor). [USGS / NOAA on Mauna Kea](https://www.usgs.gov/faqs/what-tallest-mountain-world)

## Nature

- `tf-nat-spider` — Spiders are arachnids (eight legs, two body parts), not insects. [Smithsonian / entomology primers](https://www.si.edu/spotlight/buginfo/spider)
- `tf-nat-octopus` — An octopus has three hearts (two branchial, one systemic). [NOAA Ocean facts](https://oceanservice.noaa.gov/facts/octopus-hearts.html)
- `tf-nat-penguin` — Wild penguins live in the Southern Hemisphere; only the Galápagos penguin ranges just north of the equator. [British Antarctic Survey](https://www.bas.ac.uk/about/antarctica/wildlife/penguins/)
- `tf-nat-bamboo` — Bamboos belong to the grass family, Poaceae. [Kew / Royal Botanic Gardens](https://www.kew.org/read-and-watch/bamboo-facts)

## Sports

- `tf-spo-soccer` — Each side fields 11 players, including the goalkeeper (Law 3). [IFAB Laws of the Game](https://www.theifab.com/laws/latest/the-players/)
- `tf-spo-hoop` — The rim is 10 feet (3.05 m) above the floor in the NBA, NCAA and FIBA. [NBA official rules](https://official.nba.com/rule-no-1-court-dimensions-equipment/)
- `tf-spo-marathon` — 42.195 km (26 miles 385 yards), standardized in 1921 from the 1908 London Olympic course. [World Athletics](https://worldathletics.org/)
- `tf-spo-masters` — The Masters is played at Augusta National Golf Club, Georgia, not St Andrews. [Masters Tournament](https://www.masters.com/)

## Arts

- `tf-art-mona` — Leonardo da Vinci painted the *Mona Lisa*; it hangs in the Louvre. [Musée du Louvre](https://www.louvre.fr/en/explore/the-palace/from-the-mona-lisa-to-the-wedding-feast-at-cana)
- `tf-art-starry` — Vincent van Gogh painted *The Starry Night* in 1889; it is at MoMA. [MoMA collection](https://www.moma.org/collection/works/79802)
- `tf-art-sistine` — Michelangelo painted the Sistine Chapel ceiling, 1508–1512, for Pope Julius II. [Vatican Museums](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/cappella-sistina.html)
- `tf-art-monet` — Monet was a founder of Impressionism; Cubism was led by Picasso and Braque. [Musée d'Orsay / MoMA](https://www.musee-orsay.fr/en)

Closest Number cards in this slice are generated estimation sums (amber/red/violet math), not a static fact seed, so they have no external sources.

## 0.1.173 — Put in order (server-only)

`src/game/banks/order.ts` holds the numeric keys, facts and validator. Ascending keys mean the order requested by the stem; north-to-south uses **negative latitude**, so northern cities sort first. Values below are deliberately well separated. The validator rejects non-finite values, duplicate labels, tied keys, unsupported fields/tiers and wrong item counts. For calendar years the minimum adjacent separation is **10 years** (BCE represented as negative years); for all other units it is **5% of max(1, |a|, |b|)**. This avoids near ties and ambiguity from rounding, measurement methods or small revisions. Green takes the first three items; amber/red take all four. Tiers rotate green, amber, red through the list, so ten sets ship as green and deal only their first three keys (marked **green: deals 3** below; the fourth key is authored but never dealt). The validator also rejects a fact that names an authored item the card does not deal, or that counts the wrong number of items ("these four" on a three-item card). No population estimates are used.

The following table records all 30 authored sets (the exact labels, keys and short facts are in the server module). Each row lists all four authored keys; a row marked **green: deals 3** deals the first three. Numbers are listed in ascending order, except the latitude row lists actual north-to-south latitude. Approximate measurements are sufficient for these widely separated comparisons.

| Server card suffix | Keys / units | Sources |
| --- | --- | --- |
| documents (green: deals 3) | 1776, 1823, 1863, 1964 CE | [National Archives milestone documents](https://www.archives.gov/milestone-documents/list) |
| amendments | 1791, 1865, 1920, 1971 ratification years | [US Constitution amendments](https://constitution.congress.gov/constitution/) |
| space | 1957, 1969, 1981, 2000 CE | [NASA history](https://www.nasa.gov/history/), [ISS Expedition 1](https://www.nasa.gov/mission/expedition-1/) |
| exploration (green: deals 3) | 1492, 1522, 1620, 1768 CE | [Royal Museums Greenwich: explorers](https://www.rmg.co.uk/stories/explorers), [Mayflower history](https://www.plimoth.org/explore/mayflower-ii) |
| inventions | 1769, 1876, 1903, 1947 CE | [Science Museum: Watt](https://www.sciencemuseum.org.uk/objects-and-stories/james-watt-and-steam-engine), [Bell patent](https://www.archives.gov/milestone-documents/telephone-patent), [Wright flight](https://www.nps.gov/wrbr/learn/historyculture/the-first-flight.htm), [Bell Labs transistor](https://www.bell-labs.com/about/history/innovation-stories/transistor/) |
| britain | 1066, 1215, 1666, 1815 CE | [English Heritage histories](https://www.english-heritage.org.uk/learn/histories/), [Magna Carta](https://www.parliament.uk/about/living-heritage/evolutionofparliament/originsofparliament/birthofparliament/overview/magnacarta/), [London Museum: Great Fire](https://www.londonmuseum.org.uk/collections/london-stories/great-fire-london/) |
| world (green: deals 3) | 1453, 1789, 1914, 1989 CE | [Britannica: fall of Constantinople](https://www.britannica.com/event/Fall-of-Constantinople-1453), [French Revolution](https://www.britannica.com/event/French-Revolution), [IWM: First World War](https://www.iwm.org.uk/history/how-the-world-went-to-war-in-1914), [Berlin Wall Foundation](https://www.stiftung-berliner-mauer.de/en) |
| us | 1803, 1850, 1867, 1959 CE | [Louisiana Purchase](https://www.archives.gov/milestone-documents/louisiana-purchase-treaty), [Alaska Purchase](https://history.state.gov/milestones/1866-1898/alaska-purchase), [US state admission dates](https://www.senate.gov/states/statesmap.htm) |
| transport | 1825, 1863, 1914, 1994 CE | [National Railway Museum](https://www.railwaymuseum.org.uk/), [London Transport Museum](https://www.ltmuseum.co.uk/collections/stories/transport/very-short-history-underground), [Panama Canal history](https://pancanal.com/en/history-of-the-panama-canal/), [Channel Tunnel](https://www.getlinkgroup.com/en/our-group/eurotunnel/channel-tunnel/) |
| ancient (green: deals 3) | 776, 490, 323, 44 BCE | [Ancient Olympics](https://olympics.com/ioc/ancient-olympic-games), [Marathon](https://www.britannica.com/event/Battle-of-Marathon), [Alexander](https://www.britannica.com/biography/Alexander-the-Great), [Caesar](https://www.britannica.com/biography/Julius-Caesar-Roman-ruler) |
| continents | 7.7, 14.2, 30.4, 44.6 million km² | [Britannica continents](https://www.britannica.com/science/continent) and continent entries; Australia means the continent, excluding Oceania |
| countries | 377975, 3287263, 7741220, 17098242 km² total area | [CIA World Factbook area](https://www.cia.gov/the-world-factbook/field/area/) |
| islands (green: deals 3) | 209331, 587041, 743330, 2166086 km² | [Britannica island list](https://www.britannica.com/topic/list-of-islands-2041638), corresponding island entries |
| oceans | 15.6, 70.6, 85.1, 168.7 million km² | [NOAA: how many oceans](https://oceanservice.noaa.gov/facts/howmanyoceans.html), [Britannica oceans](https://www.britannica.com/science/ocean) |
| north | Reykjavík 64.15° N, London 51.51° N, Cairo 30.04° N, Canberra 35.28° S | [GeoNames](https://www.geonames.org/), city coordinates |
| equator (green: deals 3) | Oslo 59.91° N, Rome 41.90° N, Singapore 1.35° N, Cape Town 33.92° S | [GeoNames](https://www.geonames.org/), city coordinates |
| mountains | 1345, 3776, 5895, 8849 m above sea level | [Britannica mountain entries](https://www.britannica.com/place/Mount-Everest); Ben Nevis, Fuji, Kilimanjaro, Everest |
| lakes | 64, 406, 1470, 1642 m maximum depth | [EPA Great Lakes](https://www.epa.gov/greatlakes/great-lakes-facts-and-figures), [Tanganyika](https://www.britannica.com/place/Lake-Tanganyika), [Baikal](https://www.britannica.com/place/Lake-Baikal) |
| rivers (green: deals 3) | 346, 1230, 2850, 6650 km | [Britannica river entries](https://www.britannica.com/place/Nile-River); Thames, Rhine, Danube, Nile. Lengths vary by survey; these gaps do not affect the order. |
| states | 4001, 170312, 695662, 1723337 km² total area | [US Census state area measurements](https://www.census.gov/geographies/reference-files/2010/geo/state-area.html) |
| orbits | 0.387, 1, 5.203, 30.07 AU mean distance | [NASA planets](https://science.nasa.gov/solar-system/planets/), planet facts pages |
| radii (green: deals 3) | 3389.5, 6051.8, 25362, 58232 km mean radius | NASA planet facts pages: Mars, Venus, Uranus, Saturn |
| years | 225, 687, 10759, 60190 Earth days (rounded) | NASA planet facts pages: Venus, Mars, Saturn, Neptune |
| melting | 231.93, 660.32, 1084.62, 3422 °C | [Royal Society of Chemistry periodic table](https://periodic-table.rsc.org/): tin, aluminium, copper, tungsten |
| atomic (green: deals 3) | 2, 6, 26, 79 protons | RSC: helium, carbon, iron, gold |
| density | 0.534, 1.74, 7.134, 22.587 g/cm³ | RSC: lithium, magnesium, zinc, osmium |
| boiling | 4.22, 77.36, 373.15, 3134 K at standard pressure | RSC: helium, nitrogen, iron; [NIST water](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4) |
| moons (green: deals 3) | 11.1, 1560.8, 1737.4, 2634.1 km mean radius | [NASA moons](https://science.nasa.gov/solar-system/moons/): Phobos, Europa, Moon, Ganymede |
| spectrum | 0.0001, 0.1, 500, 1000000000 nm representative wavelengths | [NASA electromagnetic spectrum](https://science.nasa.gov/ems/). Representative values within bands; labels explicitly say representative, not a unique wavelength per band. |
| masses | 0.0553, 0.107, 1, 317.8 Earth masses | NASA planet facts: Mercury, Mars, Earth, Jupiter |

Generated math uses deterministic seeded pools (green addition, amber multiplication, red squares minus an integer). Both operands are drawn independently of rank, and a set is kept only if it passes the validator and its answer order differs from the ascending and descending order of the first operands and of the second operands, so no label digit gives the order away. Each card is checked at generation time; tests check 9,000 generated cards for the validator, the operand rule and the arithmetic. Arithmetic is evaluated server-side; numeric results never go to a deal. Grading accepts only the per-deal opaque token permutation. One adjacent transposition clears with `floor(normal integer coin award / 2)`: the server wallet applies it for a signed-in walker, and a guest's local pocket applies the same rule to its whole coin total, from the grade's `order.result` (the only half-coin signal; `mult` is never halved). Other permutations and malformed submissions miss. The server keeps only the graded outcome (exact, swap or miss), never the submitted list, and a replayed token returns the first outcome and its paid coins. Exact orders use the ordinary timed vault payout. Correct order labels are revealed only after grading. Order takes one quarter of the existing 20% format slot where TF/near also fits (5% of all such lamps); where neither fits, it uses the same 20% slot. No existing TF/near rate changes for clients that do not opt in to order.
