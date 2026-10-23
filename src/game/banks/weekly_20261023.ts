import { q } from "../quiz";
import type { CityId, TriviaCat, TriviaQ } from "../types";

/**
 * Friday weekly trivia cards (2026-10-23) — 15 new city cards, no math (math is under its 20% cap at
 * 16.4%, but other topics are thinner). Gaps: Tucson, Austin, Temple and Denver are the four thinnest
 * city decks (127, 142, 148, 155), and celebrity (0.6%), books (2.1%) and political (4.0%) are the
 * thinnest topics. Settled facts only; every card was checked against the source URL above it.
 * Wired via cities.ts (CITY_WEEKLY_20261023).
 */
export const CITY_WEEKLY_20261023: Partial<Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>>> = {
  tucson: {
    local: [
      // https://www.tgms.org/show
      // https://en.wikipedia.org/wiki/Tucson_Gem_%26_Mineral_Show
      q("The Tucson Gem and Mineral Show, billed as the world's largest of its kind, is held each…", ["February", "June", "September", "November"], "February", 2),
      // https://www.pima.gov/the-chuck-huckelberry-loop
      q("Tucson's Chuck Huckelberry Loop is more than 130 miles of…", ["paved bike and walking paths", "streetcar and light-rail track", "scenic mountain highways", "old irrigation canals"], "paved bike and walking paths", 2),
      // https://www.transit.dot.gov/about/news/us-department-transportation-celebrates-grand-opening-tucson-streetcar-further-expanding
      // https://en.wikipedia.org/wiki/Sun_Link
      q("Tucson's Sun Link streetcar began carrying riders in…", ["2014", "2008", "2017", "2011"], "2014", 3),
    ],
    history: [
      // https://www.library.pima.gov/content/dillinger-captured-in-tucson/
      // https://hotelcongress.com/about/history/
      q("In 1934, a fire at Tucson's Hotel Congress helped police track down which gangster's gang?", ["John Dillinger", "Al Capone", "Baby Face Nelson", "Pretty Boy Floyd"], "John Dillinger", 2),
    ],
    sports: [
      // https://eltourdetucson.org/about-perimeter/
      // https://en.wikipedia.org/wiki/El_Tour_de_Tucson
      q("El Tour de Tucson, held each November since 1983, is a big…", ["charity bike ride", "charity marathon", "classic car rally", "hot-air balloon race"], "charity bike ride", 2),
    ],
  },
  austin: {
    books: [
      // https://texasbookfestival.org/mission-history/
      q("The Texas Book Festival, held around the Capitol in Austin, was founded in 1995 by…", ["Laura Bush", "Lady Bird Johnson", "Ann Richards", "Barbara Bush"], "Laura Bush", 2),
    ],
    arts: [
      // https://blantonmuseum.org/permanent-collection/austin/
      // https://ellsworthkelly.org/exhibition/austin/
      q("Ellsworth Kelly's 'Austin', the only building the artist designed, opened in 2018 at…", ["the Blanton Museum of Art", "the Harry Ransom Center", "the Texas State Capitol", "the Bullock Museum"], "the Blanton Museum of Art", 3),
    ],
    local: [
      // https://library.austintexas.gov/news/austin-central-library-named-one-times-25
      // https://en.wikipedia.org/wiki/Austin_Public_Library
      q("Austin's Central Library, beside Shoal Creek and Lady Bird Lake, opened in…", ["2017", "2009", "2013", "2021"], "2017", 3),
    ],
    political: [
      // https://www.austintexas.gov/clerk/programs/history-council
      // https://services.austintexas.gov/edims/document.cfm?id=205115
      q("Starting in 2014, Austin moved its regular city council elections from May to…", ["November", "March", "August", "June"], "November", 2),
    ],
  },
  temple: {
    local: [
      // https://www.bswhealth.com/locations/hospital/temple/emergency-care
      // https://www.dshs.texas.gov/dshs-ems-trauma-systems/trauma-system-development/texas-trauma-facilities
      q("Baylor Scott & White Medical Center in Temple is a trauma center of which level, the highest in Texas?", ["Level I", "Level II", "Level III", "Level IV"], "Level I", 2),
    ],
    celebrity: [
      // https://www.tshaonline.org/handbook/entries/torn-elmore-rual-rip
      // https://en.wikipedia.org/wiki/Rip_Torn
      q("Temple-born actor Rip Torn was a first cousin of which Oscar-winning actress?", ["Sissy Spacek", "Sally Field", "Ellen Burstyn", "Holly Hunter"], "Sissy Spacek", 3),
    ],
  },
  denver: {
    history: [
      // https://history.denverlibrary.org/building/justina-ford-houseblack-american-west-museum
      // https://www.historycolorado.org/location/justina-ford-house
      q("Denver's Black American West Museum is in the former home of Justina Ford, Colorado's first Black woman…", ["doctor", "lawyer", "newspaper editor", "state legislator"], "doctor", 2),
    ],
    local: [
      // https://elitchgardens.com/plan-a-visit/park-history/
      // https://coloradoencyclopedia.org/article/elitch-gardens
      q("Elitch Gardens, founded in 1890 on a northwest Denver farm, moved downtown in…", ["1995", "1975", "1984", "2003"], "1995", 3),
    ],
    celebrity: [
      // https://id.loc.gov/authorities/names/n94059941.html
      // https://en.wikipedia.org/wiki/Tim_Allen
      q("'Home Improvement' star Tim Allen was born in which city?", ["Denver", "Detroit", "Chicago", "Cleveland"], "Denver", 2),
    ],
    political: [
      // https://www.denvergov.org/Government/Legislation-and-Transparency/How-City-Government-Works
      // https://denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Auditors-Office
      q("Besides the mayor and council, Denver voters elect a clerk and recorder and an independent…", ["auditor", "treasurer", "city manager", "police chief"], "auditor", 2),
    ],
  },
};
