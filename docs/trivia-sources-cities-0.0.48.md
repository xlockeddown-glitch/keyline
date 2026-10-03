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
| S115 | Wikipedia, "Denver" — https://en.wikipedia.org/wiki/Denver |
| S116 | Wikipedia, "William Larimer Jr." — https://en.wikipedia.org/wiki/William_Larimer_Jr. |
| S117 | Wikipedia, "Colorado State Capitol" — https://en.wikipedia.org/wiki/Colorado_State_Capitol |
| S118 | Wikipedia, "Colorado" — https://en.wikipedia.org/wiki/Colorado |
| S119 | Wikipedia, "Denver Union Station" — https://en.wikipedia.org/wiki/Denver_Union_Station |
| S120 | Wikipedia, "A Line (RTD)" — https://en.wikipedia.org/wiki/A_Line_(RTD) |
| S121 | Wikipedia, "Denver International Airport" — https://en.wikipedia.org/wiki/Denver_International_Airport |
| S122 | Wikipedia, "Blue Mustang" — https://en.wikipedia.org/wiki/Blue_Mustang |
| S123 | Wikipedia, "Big Blue Bear" — https://en.wikipedia.org/wiki/I_See_What_You_Mean_(Argent) |
| S124 | Wikipedia, "16th Street Mall" — https://en.wikipedia.org/wiki/16th_Street_Mall |
| S125 | Wikipedia, "Larimer Square" — https://en.wikipedia.org/wiki/Larimer_Square |
| S126 | Wikipedia, "Daniels & Fisher Tower" — https://en.wikipedia.org/wiki/Daniels_%26_Fisher_Tower |
| S127 | Wikipedia, "Brown Palace Hotel (Denver, Colorado)" — https://en.wikipedia.org/wiki/Brown_Palace_Hotel_(Denver) |
| S128 | Wikipedia, "Margaret Brown" — https://en.wikipedia.org/wiki/Margaret_Brown |
| S129 | Wikipedia, "Clyfford Still Museum" — https://en.wikipedia.org/wiki/Clyfford_Still_Museum |
| S130 | Wikipedia, "Denver Art Museum" — https://en.wikipedia.org/wiki/Denver_Art_Museum |
| S131 | Wikipedia, "Denver Public Library" — https://en.wikipedia.org/wiki/Denver_Public_Library |
| S132 | Wikipedia, "Denver City and County Building" — https://en.wikipedia.org/wiki/Denver_City_and_County_Building |
| S133 | Wikipedia, "Denver Mint" — https://en.wikipedia.org/wiki/Denver_Mint |
| S134 | Wikipedia, "Coors Field" — https://en.wikipedia.org/wiki/Coors_Field |
| S135 | Wikipedia, "Colorado Rockies" — https://en.wikipedia.org/wiki/Colorado_Rockies |
| S136 | Wikipedia, "Todd Helton" — https://en.wikipedia.org/wiki/Todd_Helton |
| S137 | Wikipedia, "Denver Broncos" — https://en.wikipedia.org/wiki/Denver_Broncos |
| S138 | Wikipedia, "John Elway" — https://en.wikipedia.org/wiki/John_Elway |
| S139 | Wikipedia, "Mile High Stadium" — https://en.wikipedia.org/wiki/Mile_High_Stadium |
| S140 | Wikipedia, "Empower Field at Mile High" — https://en.wikipedia.org/wiki/Empower_Field_at_Mile_High |
| S141 | Wikipedia, "Denver Nuggets" — https://en.wikipedia.org/wiki/Denver_Nuggets |
| S142 | Wikipedia, "Nikola Jokić" — https://en.wikipedia.org/wiki/Nikola_Joki%C4%87 |
| S143 | Wikipedia, "Ball Arena" — https://en.wikipedia.org/wiki/Ball_Arena |
| S144 | Wikipedia, "Colorado Avalanche" — https://en.wikipedia.org/wiki/Colorado_Avalanche |
| S145 | Wikipedia, "Colorado Rapids" — https://en.wikipedia.org/wiki/Colorado_Rapids |
| S146 | Wikipedia, "Colorado Mammoth" — https://en.wikipedia.org/wiki/Colorado_Mammoth |
| S147 | Wikipedia, "Denver Pioneers" — https://en.wikipedia.org/wiki/Denver_Pioneers |
| S148 | Wikipedia, "Red Rocks Amphitheatre" — https://en.wikipedia.org/wiki/Red_Rocks_Amphitheatre |
| S149 | Wikipedia, "Denver Zoo" — https://en.wikipedia.org/wiki/Denver_Zoo_Conservation_Alliance |
| S150 | Wikipedia, "Buell Theatre" — https://en.wikipedia.org/wiki/Denver_Performing_Arts_Complex |
| S151 | Wikipedia, "Boettcher Concert Hall" — https://en.wikipedia.org/wiki/Boettcher_Concert_Hall |
| S152 | Wikipedia, "Paramount Theatre (Denver)" — https://en.wikipedia.org/wiki/Paramount_Theatre_(Denver) |
| S153 | Wikipedia, "Auraria Campus" — https://en.wikipedia.org/wiki/Auraria_Campus |
| S154 | Wikipedia, "Auraria, Colorado" — https://en.wikipedia.org/wiki/Auraria,_Denver |
| S155 | Wikipedia, "John Hickenlooper" — https://en.wikipedia.org/wiki/John_Hickenlooper |
| S156 | Wikipedia, "Wynkoop Brewing Company" — https://en.wikipedia.org/wiki/LoDo,_Denver |
| S157 | Wikipedia, "Great American Beer Festival" — https://en.wikipedia.org/wiki/Great_American_Beer_Festival |
| S158 | Wikipedia, "Coors Brewing Company" — https://en.wikipedia.org/wiki/Coors_Brewing_Company |
| S159 | Wikipedia, "Denver omelette" — https://en.wikipedia.org/wiki/Omelette |
| S160 | Wikipedia, "Rocky Mountain oysters" — https://en.wikipedia.org/wiki/Rocky_Mountain_oysters |
| S161 | Wikipedia, "Casa Bonita" — https://en.wikipedia.org/wiki/Casa_Bonita |
| S162 | Wikipedia, "The Denver Post" — https://en.wikipedia.org/wiki/The_Denver_Post |
| S163 | Wikipedia, "Rocky Mountain News" — https://en.wikipedia.org/wiki/Rocky_Mountain_News |
| S164 | Wikipedia, "Federico Peña" — https://en.wikipedia.org/wiki/Federico_Pe%C3%B1a |
| S165 | Wikipedia, "Wellington Webb" — https://en.wikipedia.org/wiki/Wellington_Webb |
| S166 | Wikipedia, "Mayor of Denver" — https://en.wikipedia.org/wiki/List_of_mayors_of_Denver |
| S167 | Wikipedia, "Colorado Territory" — https://en.wikipedia.org/wiki/Colorado_Territory |
| S168 | Wikipedia, "Sand Creek massacre" — https://en.wikipedia.org/wiki/Sand_Creek_massacre |
| S169 | Wikipedia, "Denver Pacific Railway" — https://en.wikipedia.org/wiki/Denver_Pacific_Railway_and_Telegraph_Company |
| S170 | Wikipedia, "Moffat Tunnel" — https://en.wikipedia.org/wiki/Moffat_Tunnel |
| S171 | Wikipedia, "Pikes Peak" — https://en.wikipedia.org/wiki/Pikes_Peak |
| S172 | Wikipedia, "Aquilegia coerulea" — https://en.wikipedia.org/wiki/Aquilegia_coerulea |
| S173 | Wikipedia, "South Platte River" — https://en.wikipedia.org/wiki/South_Platte_River |
| S174 | Wikipedia, "Colfax Avenue" — https://en.wikipedia.org/wiki/Colfax_Avenue |
| S175 | Wikipedia, "Tattered Cover" — https://en.wikipedia.org/wiki/Tattered_Cover |
| S176 | Wikipedia, "On the Road" — https://en.wikipedia.org/wiki/On_the_Road |
| S177 | Wikipedia, "Five Points, Denver" — https://en.wikipedia.org/wiki/Five_Points,_Denver |
| S178 | Wikipedia, "Denver boot" — https://en.wikipedia.org/wiki/Wheel_clamp |
| S179 | Wikipedia, "Rocky Mountain High" — https://en.wikipedia.org/wiki/Rocky_Mountain_High |
| S180 | Wikipedia, "Emmanuel Shearith Israel Chapel" — https://en.wikipedia.org/wiki/Emmanuel_Shearith_Israel_Chapel |
| S181 | Wikipedia, "Oxford Hotel (Denver)" — https://en.wikipedia.org/wiki/Oxford_Hotel_(Denver) |
| S182 | Wikipedia, "Equitable Building (Denver)" — https://en.wikipedia.org/wiki/Equitable_Building_(Denver) |
| S183 | Wikipedia, "Cathedral Basilica of the Immaculate Conception (Denver)" — https://en.wikipedia.org/wiki/Cathedral_Basilica_of_the_Immaculate_Conception_(Denver) |
| S184 | Wikipedia, "Museum of Contemporary Art Denver" — https://en.wikipedia.org/wiki/Museum_of_Contemporary_Art_Denver |
| S185 | Wikipedia, "Molly Brown House" — https://en.wikipedia.org/wiki/Molly_Brown_House |
| S186 | Wikipedia, "Civic Center Park" — https://en.wikipedia.org/wiki/Denver_Civic_Center |
| S187 | Wikipedia, "History Colorado Center" — https://en.wikipedia.org/wiki/History_Colorado_Center |
| S188 | Wikipedia, "Byers-Evans House" — https://en.wikipedia.org/wiki/Byers%E2%80%93Evans_House |
| S189 | Wikipedia, "Sakura Square" — https://en.wikipedia.org/wiki/Sakura_Square |
| S190 | Wikipedia, "Denver Firefighters Museum" — https://en.wikipedia.org/wiki/Denver_Firefighters_Museum |
| S191 | Wikipedia, "Downtown Aquarium, Denver" — https://en.wikipedia.org/wiki/Downtown_Aquarium_(Denver) |
| S192 | Wikipedia, "Voorhies Memorial" — https://en.wikipedia.org/wiki/Voorhies_Memorial |
| S193 | Wikipedia, "Denver Botanic Gardens" — https://en.wikipedia.org/wiki/Denver_Botanic_Gardens |
| S194 | Wikipedia, "Denver Museum of Nature and Science" — https://en.wikipedia.org/wiki/Denver_Museum_of_Nature_and_Science |
| S195 | Wikipedia, "Clara Brown" — https://en.wikipedia.org/wiki/Clara_Brown |
| S196 | Wikipedia, "Barney Ford" — https://en.wikipedia.org/wiki/Barney_Ford |
| S197 | Wikipedia, "Horace Tabor" — https://en.wikipedia.org/wiki/Horace_Tabor |
| S198 | Wikipedia, "Baby Doe Tabor" — https://en.wikipedia.org/wiki/Baby_Doe_Tabor |
| S199 | Wikipedia, "Leadville, Colorado" — https://en.wikipedia.org/wiki/Leadville,_Colorado |
| S200 | Wikipedia, "Ogden Theatre" — https://en.wikipedia.org/wiki/Ogden_Theatre |
| S201 | Wikipedia, "Bluebird Theater" — https://en.wikipedia.org/wiki/Bluebird_Theater |
| S202 | Wikipedia, "Union Station (Denver)" — https://en.wikipedia.org/wiki/Denver_Union_Station |
| S203 | Wikipedia, "Colorado Convention Center" — https://en.wikipedia.org/wiki/Colorado_Convention_Center |
| S204 | Wikipedia, "Denver Center for the Performing Arts" — https://en.wikipedia.org/wiki/Denver_Center_for_the_Performing_Arts |
| S205 | Wikipedia, "Peyton Manning" — https://en.wikipedia.org/wiki/Peyton_Manning |
| S206 | Wikipedia, "Kansas Pacific Railway" — https://en.wikipedia.org/wiki/Kansas_Pacific_Railway |
| S207 | Wikipedia, "Commons Park" — https://en.wikipedia.org/wiki/Commons_Park |
| S208 | Wikipedia, "Colorado Gold Rush" — https://en.wikipedia.org/wiki/Pike%27s_Peak_gold_rush |

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

## Denver (151 cards)

| Card | Answer | Source |
| --- | --- | --- |
| Denver's best-known nickname is the… | Mile High City | S115 |
| Denver is named for James W. Denver, governor of… | Kansas Territory | S115 |
| Denver was founded in 1858 during which gold rush? | Pikes Peak Gold Rush | S115 |
| Denver City was laid out in 1858 by a party led by… | William Larimer | S116 |
| Denver grew up where Cherry Creek meets the… | South Platte River | S115 |
| Denver is the capital of… | Colorado | S115 |
| A step on the Colorado State Capitol's west side marks an elevation of exactly… | one mile | S117 |
| The Capitol's interior is lined with rare Colorado rose onyx quarried near… | Beulah | S117 |
| Colorado joined the Union a century after 1776, earning which nickname? | Centennial State | S118 |
| Denver Union Station reopened after its renovation in… | 2014 | S119 |
| RTD's A Line commuter train runs from Union Station to… | Denver International Airport | S120 |
| Denver International Airport opened in… | 1995 | S121 |
| DIA's peaked white tent roof is meant to recall… | snowcapped mountains | S121 |
| The fiery-eyed horse at DIA, nicknamed 'Blucifer', is officially titled… | Blue Mustang | S122 |
| Blue Mustang's sculptor, Luis Jiménez, died in 2006 when part of it… | fell on him | S122 |
| The Big Blue Bear peering into the Colorado Convention Center is officially titled… | I See What You Mean | S123 |
| The Big Blue Bear was created by artist… | Lawrence Argent | S123 |
| The 16th Street Mall was designed by the firm of… | I. M. Pei | S124 |
| The free buses that run the length of the 16th Street Mall are the… | MallRide | S124 |
| Larimer Square was saved from the wrecking ball in the 1960s by preservationist… | Dana Crawford | S125 |
| When finished in 1910, the Daniels & Fisher Tower was the tallest building between the Mississippi River and… | California | S126 |
| The Brown Palace Hotel opened in… | 1892 | S127 |
| The Brown Palace Hotel is built in the shape of a… | triangle | S127 |
| The Brown Palace Hotel was designed by architect… | Frank Edbrooke | S127 |
| Denver's Margaret 'Molly' Brown is remembered as a survivor of… | the Titanic | S128 |
| The 1960 Broadway musical about Margaret Brown is… | The Unsinkable Molly Brown | S128 |
| The Clyfford Still Museum opened in… | 2011 | S129 |
| Clyfford Still was a leading painter of… | Abstract Expressionism | S129 |
| The Denver Art Museum's 1971 North Building was designed by Italian architect… | Gio Ponti | S130 |
| The Denver Art Museum's angular Hamilton Building opened in… | 2006 | S130 |
| The Hamilton Building's shards are clad in… | titanium | S130 |
| The Central Library's 1995 expansion was designed by… | Michael Graves | S131 |
| Denver's City and County Building was completed in… | 1932 | S132 |
| The Denver Mint struck its first coins in… | 1906 | S133 |
| Coors Field opened in… | 1995 | S134 |
| Coors Field's mile-high line of purple seats is in row… | 20 | S134 |
| Coors Field sits in which Denver district? | LoDo | S134 |
| The Colorado Rockies played their first season in… | 1993 | S135 |
| The Rockies' only World Series appearance came in… | 2007 | S135 |
| Todd Helton spent his whole MLB career with the Rockies as a… | first baseman | S136 |
| The Broncos won Super Bowl 50 over the… | Carolina Panthers | S137 |
| Which quarterback led the Broncos to back-to-back Super Bowl wins after the 1997 and 1998 seasons? | John Elway | S138 |
| Old Mile High Stadium opened in 1948 under the name… | Bears Stadium | S139 |
| Empower Field at Mile High opened in… | 2001 | S140 |
| Nikola Jokić led the Nuggets to their first NBA title in… | 2023 | S141 |
| Nuggets star Nikola Jokić comes from… | Serbia | S142 |
| The Nuggets and the Avalanche share… | Ball Arena | S143 |
| Before 2020, Ball Arena was named the… | Pepsi Center | S143 |
| The Colorado Avalanche moved to Denver in 1995 from… | Quebec City | S144 |
| The Avalanche won the Stanley Cup in 1996, 2001 and… | 2022 | S144 |
| The Colorado Rapids play in… | MLS | S145 |
| The Colorado Mammoth play professional… | box lacrosse | S146 |
| The University of Denver Pioneers have won many national titles in… | ice hockey | S147 |
| Red Rocks Amphitheatre stands in which town west of Denver? | Morrison | S148 |
| Red Rocks Amphitheatre is owned by… | the City and County of Denver | S148 |
| The tilted red sandstone at Red Rocks belongs to the… | Fountain Formation | S148 |
| The Denver Zoo is in… | City Park | S149 |
| Within the Denver Performing Arts Complex, which venue is designed for amplified musicals? | Buell Theatre | S150 |
| Boettcher Concert Hall was the first U.S. symphony hall built… | in the round | S151 |
| Boettcher Concert Hall is home to the… | Colorado Symphony | S151 |
| Denver's Paramount Theatre is decorated in which style? | Art Deco | S152 |
| How many schools share Denver's Auraria Campus? | three | S153 |
| Auraria, the settlement on the west bank of Cherry Creek, was named for a town in… | Georgia | S154 |
| Wynkoop Brewing Company was co-founded by which future Denver mayor? | John Hickenlooper | S155 |
| Wynkoop Brewing Company opened in… | 1988 | S156 |
| Denver's Great American Beer Festival is put on by the… | Brewers Association | S157 |
| Coors beer is brewed in which town just west of Denver? | Golden | S158 |
| A Denver omelette is filled with ham, onions and… | green peppers | S159 |
| Rocky Mountain oysters are actually… | bull testicles | S160 |
| Casa Bonita, the pink palace in Lakewood, is famous for its indoor… | cliff divers | S161 |
| Casa Bonita was bought in 2021 by the creators of… | South Park | S161 |
| The Denver Post was founded in… | 1892 | S162 |
| The Rocky Mountain News, first printed in 1859, stopped publishing in… | 2009 | S163 |
| The Rocky Mountain News was founded by… | William Byers | S163 |
| Federico Peña, Denver's mayor from 1983, later became U.S. Secretary of… | Transportation | S164 |
| Who was Denver's first African American mayor? | Wellington Webb | S165 |
| After serving as Denver's mayor and Colorado's governor, John Hickenlooper became a… | U.S. senator | S155 |
| At the 2008 Democratic convention in Denver, the presidential nominee was… | Barack Obama | S115 |
| Denver's mayor serves a term of… | four years | S166 |
| Denver was awarded the 1976 Winter Olympics and then… | turned them down | S115 |
| Colorado became a U.S. state in… | 1876 | S118 |
| Colorado Territory was organized in… | 1861 | S167 |
| The 1864 Sand Creek massacre was led by U.S. Army colonel… | John Chivington | S168 |
| When gold seekers founded Denver, which people's lands were they on? | Arapaho | S115 |
| In 1870 the Denver Pacific Railway linked Denver to the transcontinental line at… | Cheyenne | S169 |
| The Moffat Tunnel carries trains under the… | Continental Divide | S170 |
| The view from Pikes Peak inspired which song? | America the Beautiful | S171 |
| Colorado's state flower is the… | Rocky Mountain columbine | S172 |
| Colorado's highest peak is… | Mount Elbert | S118 |
| Denver's official elevation is about… | 5,280 feet | S115 |
| The South Platte joins the North Platte in which state? | Nebraska | S173 |
| Which Denver street was called 'the longest, wickedest street in America'? | Colfax Avenue | S174 |
| Denver's Tattered Cover is a well-known… | bookstore | S175 |
| Which Jack Kerouac novel has its characters passing through Denver? | On the Road | S176 |
| Jazz-era Five Points was nicknamed the Harlem of the… | West | S177 |
| In Denver, the 'Denver boot' is a… | wheel clamp | S178 |
| John Denver's 1972 ode to Colorado is… | Rocky Mountain High | S179 |
| Denver's oldest standing church building, now Emmanuel Gallery, was later used as a… | synagogue | S180 |
| The Oxford Hotel near Union Station opened in… | 1891 | S181 |
| The Equitable Building on 17th Street was completed in… | 1892 | S182 |
| Denver's Cathedral of the Immaculate Conception was raised to a minor basilica in… | 1979 | S183 |
| The Museum of Contemporary Art Denver building was designed by… | David Adjaye | S184 |
| Ball Arena opened in… | 1999 | S143 |
| The Molly Brown House Museum is also known as the House of… | Lions | S185 |
| Denver's Civic Center became a National Historic Landmark in 2012 as a showcase of the… | City Beautiful movement | S186 |
| The History Colorado Center on Broadway opened in… | 2012 | S187 |
| The Byers–Evans House now holds History Colorado's center for the history of… | Colorado women | S188 |
| Sakura Square sits at 19th Street and… | Larimer Street | S189 |
| Sakura Square has a bust of Minoru Yasui, a Japanese American… | lawyer | S189 |
| The Denver Firefighters Museum is housed in the former… | Fire Station No. 1 | S190 |
| Denver's Downtown Aquarium was originally called… | Colorado's Ocean Journey | S191 |
| The Downtown Aquarium and its restaurant are owned by… | Landry's | S191 |
| The pond at the Voorhies Memorial holds a sculpture of a… | sea lion | S192 |
| The Voorhies Memorial's murals were painted by… | Allen Tupper True | S192 |
| The Denver Botanic Gardens sit in which neighborhood? | Cheesman Park | S193 |
| The Denver Museum of Nature & Science is an affiliate of the… | Smithsonian Institution | S194 |
| Clara Brown, a Colorado gold rush pioneer, was called the Angel of the… | Rockies | S195 |
| Clara Brown reached Denver working as a cook on a… | wagon train | S195 |
| Barney Ford argued Colorado shouldn't become a state until all men could… | vote | S196 |
| Barney Ford was especially keen on opening barbershops, restaurants and… | hotels | S196 |
| Horace Tabor, the Silver King, made his fortune from mines in… | Leadville | S197 |
| Horace Tabor's second wife, Elizabeth, was better known as… | Baby Doe | S197 |
| Horace Tabor was ruined by the silver collapse in the Panic of… | 1893 | S197 |
| Baby Doe Tabor was born in… | Oshkosh, Wisconsin | S198 |
| Which Colorado silver town is the highest incorporated city in the U.S.? | Leadville | S199 |
| Colfax Avenue's Ogden Theatre was built in… | 1917 | S200 |
| Colfax Avenue's Bluebird Theater was originally known as the… | Thompson Theater | S201 |
| In 2024, Denver's Tattered Cover bookstore chain became part of… | Barnes & Noble | S175 |
| Denver Union Station stands at 17th Street and… | Wynkoop Street | S202 |
| The first station on Union Station's site opened in 1881 and later… | burned down | S202 |
| The hotel inside Denver Union Station's historic building is the… | Crawford Hotel | S202 |
| Beneath Union Station's plaza lies an underground… | bus station | S202 |
| The Colorado Convention Center opened in… | 1990 | S203 |
| The Denver Performing Arts Complex's ten venues are joined by a glass roof that is… | 80 feet tall | S150 |
| The Denver Center for the Performing Arts was founded in 1972 by… | Donald Seawell | S204 |
| The Broncos began play in 1960 as a charter member of the… | American Football League | S137 |
| Before becoming the Nuggets in 1974, Denver's ABA team was called the… | Rockets | S141 |
| John Elway's famous 98-yard march known as The Drive came against the… | Cleveland Browns | S138 |
| To tame the thin air, baseballs used at Coors Field are stored in a… | humidor | S134 |
| Workers building Coors Field dug up fossils of… | dinosaurs | S134 |
| Coors Field's fences were pushed back, giving it the MLB's largest… | outfield | S134 |
| Broncos quarterback Peyton Manning was nicknamed… | the Sheriff | S205 |
| Before the NFL, Peyton Manning played college football for… | Tennessee | S205 |
| At the 2020 census, Denver's population was about… | 715,000 | S115 |
| In August 1993 Denver hosted the Catholic Church's… | World Youth Day | S115 |
| In 1870 the Kansas Pacific Railway linked Denver by rail to… | Kansas City | S206 |
| Commons Park holds an AIDS memorial called… | The Grove | S207 |
| About how many gold seekers took part in the Pikes Peak gold rush? | 100,000 | S208 |
| The ten-county Denver metro area is home to about… | 3.1 million people | S115 |
| Leadville sits between Colorado's two tallest peaks, Mount Elbert and… | Mount Massive | S199 |
| The Denver Firefighters Museum's home, Fire Station No. 1, was built in… | 1909 | S190 |
