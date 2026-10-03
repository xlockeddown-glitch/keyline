# Trivia sources — 0.0.48 (k48a): Seattle, Denver, Nashville

Every new city trivia card in 0.0.48 was checked on 2026-10-03 against the source named for it below.
Each card was matched to a passage in that source (Wikipedia article text pulled through the MediaWiki API;
each article cites its own primary and official references). Cards live in `src/game/banks/cities_part_g.ts`.
Door cards on the new lamps (`quiz` in `src/game/data.ts`) are listed at the end.

## Source keys

| Key | Source |
| --- | --- |
| S1 | Wikipedia, "Space Needle" — https://en.wikipedia.org/wiki/Space_Needle |
| S2 | Wikipedia, "Seattle" — https://en.wikipedia.org/wiki/Seattle |
| S3 | Wikipedia, "King County, Washington" — https://en.wikipedia.org/wiki/King_County,_Washington |
| S4 | Wikipedia, "Chief Seattle" — https://en.wikipedia.org/wiki/Chief_Seattle |
| S5 | Wikipedia, "Denny Party" — https://en.wikipedia.org/wiki/Denny_Party |
| S6 | Wikipedia, "Alki Point" — https://en.wikipedia.org/wiki/Alki_Point,_Seattle |
| S7 | Wikipedia, "Yesler Way" — https://en.wikipedia.org/wiki/Yesler_Way |
| S8 | Wikipedia, "Henry Yesler" — https://en.wikipedia.org/wiki/Henry_Yesler |
| S9 | Wikipedia, "Great Seattle Fire" — https://en.wikipedia.org/wiki/Great_Seattle_Fire |
| S10 | Wikipedia, "Seattle Underground" — https://en.wikipedia.org/wiki/Seattle_Underground |
| S11 | Wikipedia, "Bill Speidel" — https://en.wikipedia.org/wiki/Bill_Speidel |
| S12 | Wikipedia, "Klondike Gold Rush" — https://en.wikipedia.org/wiki/Klondike_Gold_Rush |
| S13 | Wikipedia, "Smith Tower" — https://en.wikipedia.org/wiki/Smith_Tower |
| S14 | Wikipedia, "Columbia Center" — https://en.wikipedia.org/wiki/Columbia_Center |
| S15 | Wikipedia, "Seattle Central Library" — https://en.wikipedia.org/wiki/Seattle_Central_Library |
| S16 | Wikipedia, "King Street Station" — https://en.wikipedia.org/wiki/King_Street_Station |
| S17 | Wikipedia, "Union Station (Seattle)" — https://en.wikipedia.org/wiki/Union_Station_(Seattle) |
| S18 | Wikipedia, "Seattle Center Monorail" — https://en.wikipedia.org/wiki/Seattle_Center_Monorail |
| S19 | Wikipedia, "Century 21 Exposition" — https://en.wikipedia.org/wiki/Century_21_Exposition |
| S20 | Wikipedia, "Alaska–Yukon–Pacific Exposition" — https://en.wikipedia.org/wiki/Alaska%E2%80%93Yukon%E2%80%93Pacific_Exposition |
| S21 | Wikipedia, "Pike Place Market" — https://en.wikipedia.org/wiki/Pike_Place_Market |
| S22 | Wikipedia, "Rachel the Pig" — https://en.wikipedia.org/wiki/Rachel_(Gerber) |
| S23 | Wikipedia, "Gum Wall" — https://en.wikipedia.org/wiki/Gum_Wall |
| S24 | Wikipedia, "Original Starbucks" — https://en.wikipedia.org/wiki/Original_Starbucks |
| S25 | Wikipedia, "Starbucks" — https://en.wikipedia.org/wiki/Starbucks |
| S26 | Wikipedia, "Seattle Great Wheel" — https://en.wikipedia.org/wiki/Seattle_Great_Wheel |
| S27 | Wikipedia, "Seattle Aquarium" — https://en.wikipedia.org/wiki/Seattle_Aquarium |
| S28 | Wikipedia, "Colman Dock" — https://en.wikipedia.org/wiki/Colman_Dock |
| S29 | Wikipedia, "Olympic Sculpture Park" — https://en.wikipedia.org/wiki/Olympic_Sculpture_Park |
| S30 | Wikipedia, "Hammering Man" — https://en.wikipedia.org/wiki/Hammering_Man |
| S31 | Wikipedia, "Benaroya Hall" — https://en.wikipedia.org/wiki/Benaroya_Hall |
| S32 | Wikipedia, "Museum of Pop Culture" — https://en.wikipedia.org/wiki/Museum_of_Pop_Culture |
| S33 | Wikipedia, "Chihuly Garden and Glass" — https://en.wikipedia.org/wiki/Chihuly_Garden_and_Glass |
| S34 | Wikipedia, "Dale Chihuly" — https://en.wikipedia.org/wiki/Dale_Chihuly |
| S35 | Wikipedia, "Pacific Science Center" — https://en.wikipedia.org/wiki/Pacific_Science_Center |
| S36 | Wikipedia, "Denny Park" — https://en.wikipedia.org/wiki/Denny_Park |
| S37 | Wikipedia, "Freeway Park" — https://en.wikipedia.org/wiki/Freeway_Park |
| S38 | Wikipedia, "Waterfall Garden Park" — https://en.wikipedia.org/wiki/Waterfall_Garden_Park |
| S39 | Wikipedia, "Occidental Park" — https://en.wikipedia.org/wiki/Occidental_Park |
| S40 | Wikipedia, "Hing Hay Park" — https://en.wikipedia.org/wiki/Hing_Hay_Park |
| S41 | Wikipedia, "Wing Luke Museum" — https://en.wikipedia.org/wiki/Wing_Luke_Museum |
| S42 | Wikipedia, "Uwajimaya" — https://en.wikipedia.org/wiki/Uwajimaya |
| S43 | Wikipedia, "Moore Theatre" — https://en.wikipedia.org/wiki/Moore_Theatre |
| S44 | Wikipedia, "5th Avenue Theatre" — https://en.wikipedia.org/wiki/5th_Avenue_Theatre |
| S45 | Wikipedia, "Paramount Theatre (Seattle)" — https://en.wikipedia.org/wiki/Paramount_Theatre_(Seattle) |
| S46 | Wikipedia, "Arctic Building" — https://en.wikipedia.org/wiki/Arctic_Building |
| S47 | Wikipedia, "Seattle City Hall" — https://en.wikipedia.org/wiki/Seattle_City_Hall |
| S48 | Wikipedia, "Climate Pledge Arena" — https://en.wikipedia.org/wiki/Climate_Pledge_Arena |
| S49 | Wikipedia, "International Fountain" — https://en.wikipedia.org/wiki/International_Fountain |
| S50 | Wikipedia, "Seattle Center Armory" — https://en.wikipedia.org/wiki/Seattle_Center_Armory |
| S51 | Wikipedia, "Fremont Troll" — https://en.wikipedia.org/wiki/Fremont_Troll |
| S52 | Wikipedia, "Hiram M. Chittenden Locks" — https://en.wikipedia.org/wiki/Ballard_Locks |
| S53 | Wikipedia, "Gas Works Park" — https://en.wikipedia.org/wiki/Gas_Works_Park |
| S54 | Wikipedia, "Kerry Park (Seattle)" — https://en.wikipedia.org/wiki/Kerry_Park |
| S55 | Wikipedia, "Elliott Bay" — https://en.wikipedia.org/wiki/Elliott_Bay |
| S56 | Wikipedia, "State Route 99 Tunnel" — https://en.wikipedia.org/wiki/State_Route_99_tunnel |
| S57 | Wikipedia, "Seafair" — https://en.wikipedia.org/wiki/Seafair |
| S58 | Wikipedia, "Mount Rainier" — https://en.wikipedia.org/wiki/Mount_Rainier |
| S59 | Wikipedia, "Puget Sound" — https://en.wikipedia.org/wiki/Puget_Sound |
| S60 | Wikipedia, "Evergreen Point Floating Bridge" — https://en.wikipedia.org/wiki/Evergreen_Point_Floating_Bridge |
| S61 | Wikipedia, "Discovery Park (Seattle)" — https://en.wikipedia.org/wiki/Discovery_Park_(Seattle) |
| S62 | Wikipedia, "Washington (state)" — https://en.wikipedia.org/wiki/Washington_(state) |
| S63 | Wikipedia, "Chinook salmon" — https://en.wikipedia.org/wiki/Chinook_salmon |
| S64 | Wikipedia, "Geoduck" — https://en.wikipedia.org/wiki/Geoduck |
| S65 | Wikipedia, "Nisqually earthquake" — https://en.wikipedia.org/wiki/2001_Nisqually_earthquake |
| S66 | Wikipedia, "Seattle Seahawks" — https://en.wikipedia.org/wiki/Seattle_Seahawks |
| S67 | Wikipedia, "Lumen Field" — https://en.wikipedia.org/wiki/Lumen_Field |
| S68 | Wikipedia, "T-Mobile Park" — https://en.wikipedia.org/wiki/T-Mobile_Park |
| S69 | Wikipedia, "Ken Griffey Jr." — https://en.wikipedia.org/wiki/Ken_Griffey_Jr. |
| S70 | Wikipedia, "Ichiro Suzuki" — https://en.wikipedia.org/wiki/Ichiro_Suzuki |
| S71 | Wikipedia, "Seattle Mariners" — https://en.wikipedia.org/wiki/Seattle_Mariners |
| S72 | Wikipedia, "Edgar Martínez" — https://en.wikipedia.org/wiki/Edgar_Mart%C3%ADnez |
| S73 | Wikipedia, "Seattle Sounders FC" — https://en.wikipedia.org/wiki/Seattle_Sounders_FC |
| S74 | Wikipedia, "Seattle Kraken" — https://en.wikipedia.org/wiki/Seattle_Kraken |
| S75 | Wikipedia, "Seattle Storm" — https://en.wikipedia.org/wiki/Seattle_Storm |
| S76 | Wikipedia, "Seattle SuperSonics" — https://en.wikipedia.org/wiki/Seattle_SuperSonics |
| S77 | Wikipedia, "Seattle Pilots" — https://en.wikipedia.org/wiki/Seattle_Pilots |
| S78 | Wikipedia, "University of Washington Huskies" — https://en.wikipedia.org/wiki/Washington_Huskies |
| S79 | Wikipedia, "Seattle Reign FC" — https://en.wikipedia.org/wiki/Seattle_Reign_FC |
| S80 | Wikipedia, "Seattle Metropolitans" — https://en.wikipedia.org/wiki/Seattle_Metropolitans |
| S81 | Wikipedia, "Sub Pop" — https://en.wikipedia.org/wiki/Sub_Pop |
| S82 | Wikipedia, "Pearl Jam" — https://en.wikipedia.org/wiki/Pearl_Jam |
| S83 | Wikipedia, "Soundgarden" — https://en.wikipedia.org/wiki/Soundgarden |
| S84 | Wikipedia, "Jimi Hendrix" — https://en.wikipedia.org/wiki/Jimi_Hendrix |
| S85 | Wikipedia, "Kurt Cobain" — https://en.wikipedia.org/wiki/Kurt_Cobain |
| S86 | Wikipedia, "Layne Staley" — https://en.wikipedia.org/wiki/Layne_Staley |
| S87 | Wikipedia, "Garfield High School (Seattle)" — https://en.wikipedia.org/wiki/Garfield_High_School_(Seattle) |
| S88 | Wikipedia, "Sir Mix-a-Lot" — https://en.wikipedia.org/wiki/Sir_Mix-a-Lot |
| S89 | Wikipedia, "Macklemore" — https://en.wikipedia.org/wiki/Macklemore |
| S90 | Wikipedia, "Frasier" — https://en.wikipedia.org/wiki/Frasier |
| S91 | Wikipedia, "Sleepless in Seattle" — https://en.wikipedia.org/wiki/Sleepless_in_Seattle |
| S92 | Wikipedia, "Bumbershoot" — https://en.wikipedia.org/wiki/Bumbershoot |
| S93 | Wikipedia, "Seattle Opera" — https://en.wikipedia.org/wiki/Seattle_Opera |
| S94 | Wikipedia, "Marion Oliver McCaw Hall" — https://en.wikipedia.org/wiki/McCaw_Hall |
| S95 | Wikipedia, "Seattle Repertory Theatre" — https://en.wikipedia.org/wiki/Seattle_Repertory_Theatre |
| S96 | Wikipedia, "Northwest Folklife" — https://en.wikipedia.org/wiki/Northwest_Folklife |
| S97 | Wikipedia, "Seattle Asian Art Museum" — https://en.wikipedia.org/wiki/Seattle_Asian_Art_Museum |
| S98 | Wikipedia, "Dick's Drive-In" — https://en.wikipedia.org/wiki/Dick%27s_Drive-In |
| S99 | Wikipedia, "Seattle-style hot dog" — https://en.wikipedia.org/wiki/Seattle-style_hot_dog |
| S100 | Wikipedia, "Ivar's" — https://en.wikipedia.org/wiki/Ivar%27s |
| S101 | Wikipedia, "Beecher's Handmade Cheese" — https://en.wikipedia.org/wiki/Beecher%27s_Handmade_Cheese |
| S102 | Wikipedia, "Rainier Beer" — https://en.wikipedia.org/wiki/Rainier_Brewing_Company |
| S103 | Wikipedia, "Top Pot Doughnuts" — https://en.wikipedia.org/wiki/Top_Pot_Doughnuts |
| S104 | Wikipedia, "Theo Chocolate" — https://en.wikipedia.org/wiki/Theo_Chocolate |
| S105 | Wikipedia, "Bertha Knight Landes" — https://en.wikipedia.org/wiki/Bertha_Knight_Landes |
| S106 | Wikipedia, "Seattle general strike of 1919" — https://en.wikipedia.org/wiki/Seattle_General_Strike |
| S107 | Wikipedia, "1999 Seattle WTO protests" — https://en.wikipedia.org/wiki/1999_Seattle_WTO_protests |
| S108 | Wikipedia, "Seattle City Council" — https://en.wikipedia.org/wiki/Seattle_City_Council |
| S109 | Wikipedia, "Norm Rice" — https://en.wikipedia.org/wiki/Norm_Rice |
| S110 | Wikipedia, "Port of Seattle" — https://en.wikipedia.org/wiki/Port_of_Seattle |
| S111 | Wikipedia, "Seattle Post-Intelligencer" — https://en.wikipedia.org/wiki/Seattle_Post-Intelligencer |
| S112 | Wikipedia, "Amazon (company)" — https://en.wikipedia.org/wiki/Amazon_(company) |
| S113 | Wikipedia, "Boeing" — https://en.wikipedia.org/wiki/Boeing |
| S114 | Wikipedia, "Puyallup Assembly Center" — https://en.wikipedia.org/wiki/Camp_Harmony |

## Seattle (157 cards)

| Card | Answer | Source |
| --- | --- | --- |
| How tall is the Space Needle? | 605 feet | S1 |
| The Space Needle's design was a compromise between Edward E. Carlson and… | John Graham | S1 |
| Seattle's best-known nickname is the… | Emerald City | S2 |
| Seattle lies between Puget Sound and which lake to its east? | Lake Washington | S2 |
| Seattle is the county seat of… | King County | S2 |
| Seattle's King County now officially honors… | Dr. Martin Luther King | S3 |
| King County was first named in 1852 for vice president-elect… | William R. King | S3 |
| Seattle takes its name from… | Chief Seattle | S2 |
| Chief Seattle was a leader of the Duwamish and the… | Suquamish | S4 |
| The Denny Party landed at Alki Point in… | 1851 | S5 |
| Seattle's founding settlers first built cabins at which point? | Alki Point | S5 |
| The name of the first settlement, Alki, is Chinook Jargon for… | by and by | S6 |
| Seattle's original 'Skid Road' is said to be today's… | Yesler Way | S7 |
| Who ran the steam sawmill at the heart of early Seattle's waterfront? | Henry Yesler | S8 |
| The Great Seattle Fire of 1889 began in a… | cabinet shop | S9 |
| After the 1889 fire, streets were raised a story, burying old storefronts now toured as the… | Seattle Underground | S10 |
| Bill Speidel's walking tour, begun in 1965, takes visitors… | below Pioneer Square | S11 |
| The steamer Portland's 1897 arrival with 'a ton of gold' set off which rush through Seattle? | Klondike Gold Rush | S12 |
| The Klondike gold fields that Seattle outfitted stampeders for were in… | Yukon | S12 |
| Smith Tower in Pioneer Square opened in… | 1914 | S13 |
| Until 2016, Smith Tower's 35th-floor observatory was called the… | Chinese Room | S13 |
| How many stories is Columbia Center, Seattle's tallest building? | 76 | S14 |
| Columbia Center's public observation deck is the… | Sky View Observatory | S14 |
| Seattle Central Library was designed by Rem Koolhaas and… | Joshua Prince-Ramus | S15 |
| Seattle Central Library's glass-and-steel building opened in… | 2004 | S15 |
| King Street Station's clock tower was modeled on a campanile in which Italian city? | Venice | S16 |
| King Street Station opened in… | 1906 | S16 |
| Seattle's Union Station was built for the Union Pacific and the… | Milwaukee Road | S17 |
| The Seattle Center Monorail runs between Seattle Center and… | Westlake Center | S18 |
| The 1962 Seattle World's Fair was officially called the… | Century 21 Exposition | S19 |
| Seattle hosted which world's fair in 1909? | Alaska–Yukon–Pacific Exposition | S20 |
| At Pike Place Market's best-known fish stand, workers famously… | throw the fish | S21 |
| Pike Place Market's bronze piggy bank mascot is named… | Rachel | S22 |
| Architect Victor Steinbrueck led a 1971 citizens' vote to save… | Pike Place Market | S21 |
| The Gum Wall is in Post Alley beneath… | Pike Place Market | S23 |
| The Gum Wall was fully steam-cleaned for the first time in two decades in… | 2015 | S23 |
| The Gum Wall is beside the box office of which theater? | Market Theater | S23 |
| The first Starbucks was founded by Gordon Bowker, Jerry Baldwin and… | Zev Siegl | S24 |
| Starbucks opened its first store in Seattle in… | 1971 | S25 |
| Starbucks takes its name from a character in… | Moby-Dick | S25 |
| The Seattle Great Wheel stands at the end of which pier? | Pier 57 | S26 |
| When it opened in 2012, the Seattle Great Wheel was the tallest Ferris wheel on the… | West Coast | S26 |
| The Seattle Aquarium sits on which waterfront pier? | Pier 59 | S27 |
| From Colman Dock, state ferries sail to Bainbridge Island and… | Bremerton | S28 |
| Olympic Sculpture Park is run by the… | Seattle Art Museum | S29 |
| Olympic Sculpture Park opened in… | 2007 | S29 |
| Alexander Calder's red steel sculpture at Olympic Sculpture Park is… | Eagle | S29 |
| The giant moving sculpture outside the Seattle Art Museum is… | Hammering Man | S30 |
| Hammering Man at the Seattle Art Museum is the work of… | Jonathan Borofsky | S30 |
| Benaroya Hall is the home of the… | Seattle Symphony | S31 |
| Benaroya Hall opened in… | 1998 | S31 |
| The Museum of Pop Culture was founded by Microsoft co-founder… | Paul Allen | S32 |
| MoPOP opened in 2000 under what original name? | Experience Music Project | S32 |
| Chihuly Garden and Glass opened at Seattle Center in… | 2012 | S33 |
| Glass artist Dale Chihuly was born in… | Tacoma | S34 |
| Pacific Science Center's white arches were designed by… | Minoru Yamasaki | S35 |
| Seattle's oldest park, given to the city by a pioneer in 1861 as a cemetery, is… | Denny Park | S36 |
| Freeway Park, built as a lid over Interstate 5, was designed by… | Lawrence Halprin | S37 |
| Freeway Park opened on which date in 1976? | July 4 | S37 |
| Waterfall Garden Park was built at the original building of which company? | UPS | S38 |
| Occidental Park sits in which historic neighborhood? | Pioneer Square | S39 |
| Hing Hay Park is in Seattle's… | International District | S40 |
| Hing Hay Park's ornate pavilion came from… | Taipei | S40 |
| Wing Luke, namesake of the Wing Luke Museum, was elected to Seattle's… | city council | S41 |
| Uwajimaya's founder first sold goods from a truck in… | Tacoma | S42 |
| The Moore Theatre, opened in 1907, is Seattle's… | oldest active theater | S43 |
| The 5th Avenue Theatre's interior was modeled on… | Beijing's Forbidden City | S44 |
| The Paramount Theatre on Pine Street opened in… | 1928 | S45 |
| The Arctic Building is ringed with terra-cotta heads of… | walruses | S46 |
| Seattle's current City Hall opened in… | 2003 | S47 |
| Climate Pledge Arena's naming rights belong to… | Amazon | S48 |
| Seattle Center's International Fountain was first built for… | the 1962 World's Fair | S49 |
| The Seattle Center Armory was built in 1939 as a… | National Guard armory | S50 |
| The Fremont Troll crouches under which bridge? | Aurora Bridge | S51 |
| The Fremont Troll clutches a real… | Volkswagen Beetle | S51 |
| The Ballard Locks are officially named for… | Hiram M. Chittenden | S52 |
| Gas Works Park sits on the north shore of… | Lake Union | S53 |
| Kerry Park's famous skyline view is from which hill? | Queen Anne Hill | S54 |
| Like Rome, Seattle is said to be built on how many hills? | seven | S2 |
| Downtown Seattle's waterfront faces which bay? | Elliott Bay | S55 |
| The State Route 99 tunnel under downtown opened in… | 2019 | S56 |
| The machine that bored the SR 99 tunnel was nicknamed… | Bertha | S56 |
| The SR 99 tunnel replaced which double-decked waterfront highway? | Alaskan Way Viaduct | S56 |
| When completed in 1914, Smith Tower was among the tallest skyscrapers outside… | New York City | S13 |
| Seattle's summer festival with hydroplane races and the Blue Angels is… | Seafair | S57 |
| Mount Rainier, seen from Seattle on clear days, is a… | stratovolcano | S58 |
| Mount Rainier rises to about… | 14,410 feet | S58 |
| Puget Sound reaches the Pacific through the Strait of… | Juan de Fuca | S59 |
| Salmon get past the Ballard Locks by way of a… | fish ladder | S52 |
| The SR 520 bridge across Lake Washington is the world's longest… | floating bridge | S60 |
| Discovery Park, Seattle's largest city park, sits on which peninsula neighborhood? | Magnolia | S61 |
| Washington's state tree, seen across Seattle's parks, is the… | western hemlock | S62 |
| The king salmon sold at Seattle's fish stalls is also called… | Chinook | S63 |
| The geoducks sold at Pike Place Market are giant… | clams | S64 |
| The 2001 earthquake that damaged the Alaskan Way Viaduct is named for… | Nisqually | S65 |
| In Super Bowl XLVIII, the Seahawks beat the… | Denver Broncos | S66 |
| Seahawks fans call themselves the… | 12th Man | S66 |
| Lumen Field, home of the Seahawks, opened in… | 2002 | S67 |
| The domed stadium that stood where Lumen Field is now was the… | Kingdome | S67 |
| Lumen Field fans set a Guinness crowd-noise record in 2013 of… | 137.6 decibels | S67 |
| The Mariners' ballpark opened in 1999 under the name… | Safeco Field | S68 |
| T-Mobile Park sits in which Seattle neighborhood? | SoDo | S68 |
| Ken Griffey Jr. finished his career with how many home runs? | 630 | S69 |
| Ichiro Suzuki set the MLB single-season hits record in… | 2004 | S70 |
| The 2001 Mariners tied the MLB record for regular-season wins with… | 116 | S71 |
| Mariners Hall of Famer Edgar Martínez is best known as a… | designated hitter | S72 |
| The Seattle Sounders won MLS Cup in 2016 and again in… | 2019 | S73 |
| The Sounders became the first MLS club to win the CONCACAF Champions League in… | 2022 | S73 |
| The Seattle Kraken's first NHL season was… | 2021–22 | S74 |
| The Seattle Storm play in the… | WNBA | S75 |
| The SuperSonics left Seattle in 2008 and became the… | Oklahoma City Thunder | S76 |
| The SuperSonics won their only NBA championship in… | 1979 | S76 |
| Seattle's one-season MLB team of 1969 was the… | Pilots | S77 |
| After one season, the Seattle Pilots moved and became the… | Milwaukee Brewers | S77 |
| Washington Huskies football is played at… | Husky Stadium | S78 |
| Seattle Reign FC plays in the… | NWSL | S79 |
| In 1917 the Seattle Metropolitans became the first U.S. team to win the… | Stanley Cup | S80 |
| Seattle's Sub Pop label released which band's debut album, Bleach? | Nirvana | S81 |
| Pearl Jam's 1991 debut album is titled… | Ten | S82 |
| Soundgarden's lead singer was… | Chris Cornell | S83 |
| Jimi Hendrix was born in Seattle in… | 1942 | S84 |
| Jimi Hendrix is buried in which city just south of Seattle? | Renton | S84 |
| Before Seattle, Kurt Cobain grew up in… | Aberdeen | S85 |
| Alice in Chains singer Layne Staley was born in… | Bellevue | S86 |
| Quincy Jones went to which Seattle high school? | Garfield | S87 |
| Sir Mix-a-Lot's 1992 No. 1 hit was… | Baby Got Back | S88 |
| Macklemore's 2012 breakout hit with Ryan Lewis was… | Thrift Shop | S89 |
| Psychiatrist Frasier Crane hosts his radio show in… | Seattle | S90 |
| The 1993 film Sleepless in Seattle starred Tom Hanks and… | Meg Ryan | S91 |
| Bumbershoot, held every Labor Day weekend, is a festival of… | music and arts | S92 |
| Seattle Opera performs at… | McCaw Hall | S93 |
| Pacific Northwest Ballet shares McCaw Hall with the… | Seattle Opera | S94 |
| Seattle Repertory Theatre performs at… | Seattle Center | S95 |
| Northwest Folklife Festival takes over Seattle Center every… | Memorial Day weekend | S96 |
| The Seattle Art Museum's Asian art collection is shown in which park? | Volunteer Park | S97 |
| Dick's Drive-In opened its first stand in Wallingford in… | 1954 | S98 |
| A Seattle-style hot dog is topped with… | cream cheese | S99 |
| Ivar's seafood restaurants were founded by folk singer… | Ivar Haglund | S100 |
| Beecher's Handmade Cheese makes its cheese in view of shoppers at… | Pike Place Market | S101 |
| A giant red letter atop the old Rainier brewery was the letter… | R | S102 |
| The Seattle Aquarium on the waterfront opened in… | 1977 | S27 |
| Top Pot Doughnuts got its name from a neon sign salvaged from a… | Chinese restaurant | S103 |
| Theo Chocolate, in Fremont, was the first U.S. maker of chocolate that was organic and… | Fair Trade | S104 |
| Washington leads the United States in growing… | apples | S62 |
| Bertha Knight Landes, elected in 1926, was the first woman mayor of… | a major U.S. city | S105 |
| The Seattle General Strike of 1919 lasted about… | five days | S106 |
| The 1999 protests in Seattle targeted a meeting of the… | WTO | S107 |
| Seattle's City Council has how many members? | nine | S108 |
| Washington's state capital is… | Olympia | S62 |
| Who was Seattle's first elected African American mayor? | Norm Rice | S109 |
| The Port of Seattle was created by a public vote in… | 1911 | S110 |
| Which Seattle daily went online-only in 2009? | the Post-Intelligencer | S111 |
| Washington became a U.S. state in… | 1889 | S62 |
| Seattle-based Amazon was founded in 1994 by… | Jeff Bezos | S112 |
| Boeing was founded in Seattle in… | 1916 | S113 |
| In 1942, many Japanese Americans from Seattle were first held at 'Camp Harmony' in… | Puyallup | S114 |
| Seattle was incorporated as a city in… | 1869 | S2 |
