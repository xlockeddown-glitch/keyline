#!/usr/bin/env python3
"""Emit src/game/banks/general.ts — a 1000+ question pyramid bank."""
from __future__ import annotations

import json
import random
from collections import defaultdict
from pathlib import Path

RNG = random.Random(20260913)


def js(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def plate_text(s: str) -> str:
    out = []
    for ch in s.lower().replace("’", "'"):
        out.append(ch if ch.isalnum() else " ")
    return " ".join("".join(out).split())


def leaks(prompt: str, answer: str) -> bool:
    q = plate_text(prompt)
    a = plate_text(answer)
    if len(a) < 4:
        return False
    return f" {q} ".find(f" {a} ") >= 0


class Bank:
    def __init__(self) -> None:
        self.rows: dict[str, list[tuple[str, list[str], str, int]]] = defaultdict(list)
        self.seen: set[str] = set()

    def add(self, cat: str, prompt: str, choices: list[str], answer: str, diff: int) -> None:
        if prompt in self.seen:
            return
        if leaks(prompt, answer):
            return
        if answer not in choices:
            raise SystemExit(f"answer missing: {prompt} / {answer} / {choices}")
        if len(choices) != 4:
            raise SystemExit(f"need 4 choices: {prompt}")
        if len(set(choices)) != 4:
            return
        self.seen.add(prompt)
        self.rows[cat].append((prompt, choices, answer, diff))

    def mc(self, cat: str, prompt: str, answer: str, pool: list[str], diff: int) -> None:
        others = [x for x in pool if x != answer]
        if len(others) < 3:
            return
        picks = others[:]
        RNG.shuffle(picks)
        choices = [answer, picks[0], picks[1], picks[2]]
        RNG.shuffle(choices)
        self.add(cat, prompt, choices, answer, diff)


B = Bank()


def name_gives_city(name: str, city: str) -> bool:
    n = " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in name).split())
    c = " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in city).split())
    if len(c) < 4:
        return False
    return f" {n} ".find(f" {c} ") >= 0


def add_pair_city(cat: str, items: list[tuple[str, str]], kind: str, easy: bool = True) -> None:
    names = [a for a, _ in items]
    cities = list(dict.fromkeys(b for _, b in items))
    d1, d2 = (1, 2) if easy else (2, 3)
    for name, city in items:
        if not name_gives_city(name, city):
            B.mc(cat, f"The {name} are based in which city?", city, cities, d1)
        # reverse only if city is unique
        homes = [n for n, c in items if c == city]
        if len(homes) == 1:
            B.mc(cat, f"Which {kind} calls {city} home?", name, names, d1 if easy else d2)


# --- Sports -----------------------------------------------------------------
NFL = [
    ("Arizona Cardinals", "Glendale"),
    ("Atlanta Falcons", "Atlanta"),
    ("Baltimore Ravens", "Baltimore"),
    ("Buffalo Bills", "Orchard Park"),
    ("Carolina Panthers", "Charlotte"),
    ("Chicago Bears", "Chicago"),
    ("Cincinnati Bengals", "Cincinnati"),
    ("Cleveland Browns", "Cleveland"),
    ("Dallas Cowboys", "Arlington"),
    ("Denver Broncos", "Denver"),
    ("Detroit Lions", "Detroit"),
    ("Green Bay Packers", "Green Bay"),
    ("Houston Texans", "Houston"),
    ("Indianapolis Colts", "Indianapolis"),
    ("Jacksonville Jaguars", "Jacksonville"),
    ("Kansas City Chiefs", "Kansas City"),
    ("Las Vegas Raiders", "Las Vegas"),
    ("Los Angeles Chargers", "Inglewood"),
    ("Los Angeles Rams", "Inglewood"),
    ("Miami Dolphins", "Miami Gardens"),
    ("Minnesota Vikings", "Minneapolis"),
    ("New England Patriots", "Foxborough"),
    ("New Orleans Saints", "New Orleans"),
    ("New York Giants", "East Rutherford"),
    ("New York Jets", "East Rutherford"),
    ("Philadelphia Eagles", "Philadelphia"),
    ("Pittsburgh Steelers", "Pittsburgh"),
    ("San Francisco 49ers", "Santa Clara"),
    ("Seattle Seahawks", "Seattle"),
    ("Tampa Bay Buccaneers", "Tampa"),
    ("Tennessee Titans", "Nashville"),
    ("Washington Commanders", "Landover"),
]
NBA = [
    ("Atlanta Hawks", "Atlanta"),
    ("Boston Celtics", "Boston"),
    ("Brooklyn Nets", "Brooklyn"),
    ("Charlotte Hornets", "Charlotte"),
    ("Chicago Bulls", "Chicago"),
    ("Cleveland Cavaliers", "Cleveland"),
    ("Dallas Mavericks", "Dallas"),
    ("Denver Nuggets", "Denver"),
    ("Detroit Pistons", "Detroit"),
    ("Golden State Warriors", "San Francisco"),
    ("Houston Rockets", "Houston"),
    ("Indiana Pacers", "Indianapolis"),
    ("LA Clippers", "Inglewood"),
    ("Los Angeles Lakers", "Los Angeles"),
    ("Memphis Grizzlies", "Memphis"),
    ("Miami Heat", "Miami"),
    ("Milwaukee Bucks", "Milwaukee"),
    ("Minnesota Timberwolves", "Minneapolis"),
    ("New Orleans Pelicans", "New Orleans"),
    ("New York Knicks", "New York"),
    ("Oklahoma City Thunder", "Oklahoma City"),
    ("Orlando Magic", "Orlando"),
    ("Philadelphia 76ers", "Philadelphia"),
    ("Phoenix Suns", "Phoenix"),
    ("Portland Trail Blazers", "Portland"),
    ("Sacramento Kings", "Sacramento"),
    ("San Antonio Spurs", "San Antonio"),
    ("Toronto Raptors", "Toronto"),
    ("Utah Jazz", "Salt Lake City"),
    ("Washington Wizards", "Washington"),
]
MLB = [
    ("Arizona Diamondbacks", "Phoenix"),
    ("Atlanta Braves", "Cumberland"),
    ("Baltimore Orioles", "Baltimore"),
    ("Boston Red Sox", "Boston"),
    ("Chicago Cubs", "Chicago"),
    ("Chicago White Sox", "Chicago"),
    ("Cincinnati Reds", "Cincinnati"),
    ("Cleveland Guardians", "Cleveland"),
    ("Colorado Rockies", "Denver"),
    ("Detroit Tigers", "Detroit"),
    ("Houston Astros", "Houston"),
    ("Kansas City Royals", "Kansas City"),
    ("Los Angeles Angels", "Anaheim"),
    ("Los Angeles Dodgers", "Los Angeles"),
    ("Miami Marlins", "Miami"),
    ("Milwaukee Brewers", "Milwaukee"),
    ("Minnesota Twins", "Minneapolis"),
    ("New York Mets", "Queens"),
    ("New York Yankees", "the Bronx"),
    ("Oakland Athletics", "Sacramento"),
    ("Philadelphia Phillies", "Philadelphia"),
    ("Pittsburgh Pirates", "Pittsburgh"),
    ("San Diego Padres", "San Diego"),
    ("San Francisco Giants", "San Francisco"),
    ("Seattle Mariners", "Seattle"),
    ("St. Louis Cardinals", "St. Louis"),
    ("Tampa Bay Rays", "St. Petersburg"),
    ("Texas Rangers", "Arlington"),
    ("Toronto Blue Jays", "Toronto"),
    ("Washington Nationals", "Washington"),
]
NHL = [
    ("Anaheim Ducks", "Anaheim"),
    ("Boston Bruins", "Boston"),
    ("Buffalo Sabres", "Buffalo"),
    ("Calgary Flames", "Calgary"),
    ("Carolina Hurricanes", "Raleigh"),
    ("Chicago Blackhawks", "Chicago"),
    ("Colorado Avalanche", "Denver"),
    ("Columbus Blue Jackets", "Columbus"),
    ("Dallas Stars", "Dallas"),
    ("Detroit Red Wings", "Detroit"),
    ("Edmonton Oilers", "Edmonton"),
    ("Florida Panthers", "Sunrise"),
    ("Los Angeles Kings", "Los Angeles"),
    ("Minnesota Wild", "Saint Paul"),
    ("Montreal Canadiens", "Montreal"),
    ("Nashville Predators", "Nashville"),
    ("New Jersey Devils", "Newark"),
    ("New York Islanders", "Elmont"),
    ("New York Rangers", "New York"),
    ("Ottawa Senators", "Ottawa"),
    ("Philadelphia Flyers", "Philadelphia"),
    ("Pittsburgh Penguins", "Pittsburgh"),
    ("San Jose Sharks", "San Jose"),
    ("Seattle Kraken", "Seattle"),
    ("St. Louis Blues", "St. Louis"),
    ("Tampa Bay Lightning", "Tampa"),
    ("Toronto Maple Leafs", "Toronto"),
    ("Utah Hockey Club", "Salt Lake City"),
    ("Vancouver Canucks", "Vancouver"),
    ("Vegas Golden Knights", "Las Vegas"),
    ("Washington Capitals", "Washington"),
    ("Winnipeg Jets", "Winnipeg"),
]
add_pair_city("sports", NFL, "NFL team")
add_pair_city("sports", NBA, "NBA team")
add_pair_city("sports", MLB, "MLB team")
add_pair_city("sports", NHL, "NHL team")

SPORTS_RULES = [
    ("How many points is a touchdown worth in American football, before the extra point?", "6", ["3", "6", "7", "2"], 1),
    ("A field goal in American football is usually worth how many points?", "3", ["1", "2", "3", "6"], 1),
    ("How many innings are in a regulation MLB game?", "9", ["7", "8", "9", "10"], 1),
    ("How many strikes make an out in baseball?", "3", ["2", "3", "4", "5"], 1),
    ("How many balls walk a batter?", "4", ["3", "4", "5", "6"], 1),
    ("A basketball shot from beyond the arc is worth how many points?", "3", ["1", "2", "3", "4"], 1),
    ("A free throw in basketball is worth how many points?", "1", ["1", "2", "3", "4"], 1),
    ("Ice hockey skates how many players per side at even strength, including the goalie?", "6", ["5", "6", "7", "11"], 1),
    ("A soccer goal is worth how many points?", "1", ["1", "2", "3", "6"], 1),
    ("Tennis games are typically won by a margin of how many points, at deuce?", "Two", ["One", "Two", "Three", "Four"], 1),
    ("A standard golf course has how many holes?", "18", ["9", "12", "18", "21"], 1),
    ("Bowling a strike means knocking down how many pins?", "10", ["8", "9", "10", "12"], 1),
    ("How many Grand Slam tennis tournaments are there each year?", "4", ["3", "4", "5", "8"], 1),
    ("The Super Bowl is the championship of which league?", "the NFL", ["the NBA", "the NFL", "MLS", "the NHL"], 1),
    ("March Madness is a tournament in which sport?", "College basketball", ["College football", "College basketball", "the NBA", "MLS"], 1),
    ("The World Series is the championship of which sport?", "Major League Baseball", ["NFL football", "Major League Baseball", "the NHL", "FIFA"], 1),
    ("The FIFA World Cup is contested in which sport?", "Soccer", ["Rugby", "Soccer", "Cricket", "Hockey"], 1),
    ("Wimbledon is a tournament in which sport?", "Tennis", ["Golf", "Tennis", "Cricket", "Polo"], 1),
    ("The Masters is a major in which sport?", "Golf", ["Tennis", "Golf", "Horse racing", "Sailing"], 1),
    ("The Tour de France is a race in which sport?", "Cycling", ["Running", "Cycling", "Skiing", "Motorsport"], 1),
    ("The Indianapolis 500 is a race in which sport?", "Open-wheel auto racing", ["NASCAR stock cars only", "Open-wheel auto racing", "Motorcycle motocross", "Drag racing"], 1),
    ("The Kentucky Derby is a race for which animals?", "Thoroughbred horses", ["Greyhounds", "Thoroughbred horses", "Camels", "Stock cars"], 1),
    ("A hat-trick usually means three…", "Goals by one player", ["Fouls", "Goals by one player", "Timeouts", "Substitutions"], 1),
    ("Offside is a rule in which sport among these?", "Soccer", ["Golf", "Bowling", "Soccer", "Swimming"], 1),
    ("A slam dunk is a play in which sport?", "Basketball", ["Volleyball", "Basketball", "Tennis", "Handball"], 1),
    ("A home run is a play in which sport?", "Baseball", ["Cricket only", "Baseball", "Softball only", "Rounders only"], 1),
    ("The yellow jersey is associated with which race?", "the Tour de France", ["the Boston Marathon", "the Tour de France", "Wimbledon", "the Super Bowl"], 1),
    ("A 'birdie' in golf is…", "One under par", ["One over par", "One under par", "A hole in one", "Par"], 1),
    ("An 'eagle' in golf is…", "Two under par", ["One under par", "Two under par", "Three under par", "Par"], 2),
    ("A 'bogey' in golf is…", "One over par", ["One under par", "One over par", "A hole-in-one", "Par"], 1),
    ("How many players are on the court for one NBA team at a time?", "5", ["4", "5", "6", "11"], 1),
    ("A baseball diamond has how many bases, including home?", "4", ["3", "4", "5", "6"], 1),
    ("How long is an NFL game, not counting overtime, in quarters?", "4 quarters of 15 minutes", ["2 halves of 45", "4 quarters of 15 minutes", "3 periods of 20", "9 innings"], 1),
    ("NHL regulation has how many periods?", "3", ["2", "3", "4", "9"], 1),
    ("A power play in hockey happens after a…", "Penalty", ["Icing only", "Penalty", "Faceoff win", "Timeout"], 1),
    ("The Vince Lombardi Trophy is awarded in…", "the Super Bowl", ["the World Series", "the Super Bowl", "the NBA Finals", "the Stanley Cup Final"], 1),
    ("The Commissioner's Trophy is awarded in…", "MLB's World Series", ["the Super Bowl", "MLB's World Series", "March Madness", "the Ryder Cup"], 2),
    ("The Larry O'Brien Trophy is awarded in…", "the NBA Finals", ["the Super Bowl", "the NBA Finals", "Wimbledon", "the World Cup"], 2),
    ("The Claret Jug is awarded at which golf major?", "The Open Championship", ["the Masters", "the U.S. Open", "The Open Championship", "the PGA Championship"], 3),
    ("A try in rugby union is worth how many points?", "5", ["3", "4", "5", "6"], 2),
    ("A cricket team bats with how many players?", "11", ["9", "11", "15", "7"], 2),
    ("The America's Cup is contested in which sport?", "Sailing", ["Horse racing", "Sailing", "Polo", "Rowing"], 2),
    ("Formula 1 scores a full 25 points for…", "Winning a Grand Prix (standard system)", ["Pole position only", "Winning a Grand Prix (standard system)", "Fastest lap only", "A DNF"], 2),
    ("The Ryder Cup is a team event in which sport?", "Golf", ["Tennis", "Golf", "Polo", "Cricket"], 2),
    ("A marathon is 26 miles plus how many additional yards, roughly?", "385 yards", ["0 yards", "385 yards", "1,000 yards", "a full extra mile"], 2),
    ("Decathlon athletes compete in how many events?", "10", ["5", "7", "10", "12"], 2),
    ("A heptathlon is how many events?", "7", ["5", "7", "8", "10"], 2),
    ("The pentathlon, in its modern Olympic form, includes fencing, swimming, riding, shooting, and…", "Running", ["Boxing", "Running", "Cycling", "Rowing"], 3),
    ("Curling stones are delivered toward a target called the…", "House", ["Wicket", "House", "Green", "Crease"], 2),
    ("A perfect game in bowling scores how many points?", "300", ["100", "200", "250", "300"], 1),
    ("In volleyball, a set is typically first to how many points, win by two?", "25", ["15", "21", "25", "30"], 2),
    ("Beach volleyball teams usually have how many players per side?", "2", ["2", "3", "6", "11"], 1),
    ("Indoor volleyball teams put how many players on the court per side?", "6", ["4", "5", "6", "8"], 1),
    ("The term 'love' meaning zero is used in…", "Tennis", ["Golf", "Tennis", "Boxing", "Bowling"], 1),
    ("A knockout ends a bout in which sport?", "Boxing", ["Golf", "Archery", "Boxing", "Curling"], 1),
    ("Sumo is a traditional sport of which country?", "Japan", ["China", "Japan", "Korea", "Mongolia"], 1),
    ("Pelota and jai alai are associated with which region?", "the Basque Country / Spain", ["Scotland", "the Basque Country / Spain", "Greece", "Brazil"], 3),
    ("Hurling is a national sport of…", "Ireland", ["Wales", "Ireland", "Scotland", "Cornwall"], 2),
    ("Aussie rules football is most associated with which city?", "Melbourne", ["Sydney", "Melbourne", "Auckland", "Perth only"], 2),
    ("The Ashes is a cricket series between England and…", "Australia", ["India", "Australia", "South Africa", "New Zealand"], 2),
    ("Wrigley Field is a stadium for which sport?", "Baseball", ["Football", "Baseball", "Soccer", "Hockey"], 1),
    ("Fenway Park is home to which MLB team?", "the Boston Red Sox", ["the Yankees", "the Boston Red Sox", "the Mets", "the Cubs"], 1),
    ("Lambeau Field is home to which NFL team?", "the Green Bay Packers", ["the Bears", "the Green Bay Packers", "the Vikings", "the Lions"], 1),
    ("Madison Square Garden is most associated with which two New York teams?", "the Knicks and the Rangers", ["the Yankees and Mets", "the Knicks and the Rangers", "the Giants and Jets", "the Nets only"], 2),
    ("Old Trafford is a stadium in which English city?", "Manchester", ["London", "Liverpool", "Manchester", "Leeds"], 2),
    ("Camp Nou is associated with which club?", "FC Barcelona", ["Real Madrid", "FC Barcelona", "Atlético", "Valencia"], 1),
    ("Anfield is home to which club?", "Liverpool", ["Everton", "Liverpool", "Arsenal", "Chelsea"], 2),
    ("The Bernabéu is home to which club?", "Real Madrid", ["Barcelona", "Real Madrid", "Sevilla", "Athletic Bilbao"], 1),
    ("Who holds the Olympic motto 'Faster, Higher, Stronger' in Latin as Citius, Altius…", "Fortius", ["Maximus", "Fortius", "Veritas", "Semper"], 3),
    ("How many rings are on the Olympic flag?", "5", ["3", "4", "5", "7"], 1),
    ("The first modern Olympics were held in which city?", "Athens", ["Paris", "Athens", "London", "Rome"], 2),
    ("The Olympic Games are held every how many years (Summer)?", "4", ["2", "3", "4", "5"], 1),
    ("A shutout in hockey means the goalie allowed how many goals?", "0", ["0", "1", "2", "3"], 1),
    ("A no-hitter is a feat in which sport?", "Baseball", ["Football", "Baseball", "Hockey", "Soccer"], 1),
    ("The Heisman Trophy is awarded in which sport?", "College football", ["the NFL", "College football", "College basketball", "the NBA"], 2),
    ("The Ballon d'Or is awarded in which sport?", "Soccer", ["Tennis", "Soccer", "Rugby", "Cycling"], 2),
    ("Serena Williams is a champion in which sport?", "Tennis", ["Golf", "Tennis", "Track", "Swimming"], 1),
    ("Michael Phelps is most famous in which sport?", "Swimming", ["Diving", "Swimming", "Water polo", "Rowing"], 1),
    ("Usain Bolt is most famous in which sport?", "Sprint running", ["Marathon", "Sprint running", "Hurdles only", "Long jump"], 1),
    ("Simone Biles is a champion in which sport?", "Gymnastics", ["Figure skating", "Gymnastics", "Diving", "Dance"], 1),
    ("Tiger Woods is a champion in which sport?", "Golf", ["Tennis", "Golf", "Baseball", "Polo"], 1),
    ("Michael Jordan played which sport professionally?", "Basketball", ["Baseball only", "Basketball", "Football", "Hockey"], 1),
    ("Pelé is a legend of which sport?", "Soccer", ["Tennis", "Soccer", "Boxing", "F1"], 1),
    ("Babe Ruth played which sport?", "Baseball", ["Football", "Baseball", "Boxing", "Golf"], 1),
    ("Muhammad Ali competed in which sport?", "Boxing", ["Wrestling", "Boxing", "MMA only", "Track"], 1),
    ("Wayne Gretzky played which sport?", "Hockey", ["Soccer", "Hockey", "Lacrosse only", "Baseball"], 1),
    ("Tom Brady is a champion in which sport?", "American football", ["Baseball", "American football", "Basketball", "Golf"], 1),
]
for prompt, ans, ch, d in SPORTS_RULES:
    B.add("sports", prompt, ch, ans, d)

# --- Local / maps -----------------------------------------------------------
STATES = [
    ("Alabama", "Montgomery"), ("Alaska", "Juneau"), ("Arizona", "Phoenix"),
    ("Arkansas", "Little Rock"), ("California", "Sacramento"), ("Colorado", "Denver"),
    ("Connecticut", "Hartford"), ("Delaware", "Dover"), ("Florida", "Tallahassee"),
    ("Georgia", "Atlanta"), ("Hawaii", "Honolulu"), ("Idaho", "Boise"),
    ("Illinois", "Springfield"), ("Indiana", "Indianapolis"), ("Iowa", "Des Moines"),
    ("Kansas", "Topeka"), ("Kentucky", "Frankfort"), ("Louisiana", "Baton Rouge"),
    ("Maine", "Augusta"), ("Maryland", "Annapolis"), ("Massachusetts", "Boston"),
    ("Michigan", "Lansing"), ("Minnesota", "Saint Paul"), ("Mississippi", "Jackson"),
    ("Missouri", "Jefferson City"), ("Montana", "Helena"), ("Nebraska", "Lincoln"),
    ("Nevada", "Carson City"), ("New Hampshire", "Concord"), ("New Jersey", "Trenton"),
    ("New Mexico", "Santa Fe"), ("New York", "Albany"), ("North Carolina", "Raleigh"),
    ("North Dakota", "Bismarck"), ("Ohio", "Columbus"), ("Oklahoma", "Oklahoma City"),
    ("Oregon", "Salem"), ("Pennsylvania", "Harrisburg"), ("Rhode Island", "Providence"),
    ("South Carolina", "Columbia"), ("South Dakota", "Pierre"), ("Tennessee", "Nashville"),
    ("Texas", "Austin"), ("Utah", "Salt Lake City"), ("Vermont", "Montpelier"),
    ("Virginia", "Richmond"), ("Washington", "Olympia"), ("West Virginia", "Charleston"),
    ("Wisconsin", "Madison"), ("Wyoming", "Cheyenne"),
]
state_names = [s for s, _ in STATES]
caps = [c for _, c in STATES]
for st, cap in STATES:
    B.mc("local", f"What is the capital of {st}?", cap, caps, 1)
    B.mc("political", f"{cap} is the capital of which U.S. state?", st, state_names, 1)

COUNTRIES = [
    ("France", "Paris"), ("United Kingdom", "London"), ("Germany", "Berlin"),
    ("Italy", "Rome"), ("Spain", "Madrid"), ("Portugal", "Lisbon"),
    ("Ireland", "Dublin"), ("Netherlands", "Amsterdam"), ("Belgium", "Brussels"),
    ("Switzerland", "Bern"), ("Austria", "Vienna"), ("Sweden", "Stockholm"),
    ("Norway", "Oslo"), ("Denmark", "Copenhagen"), ("Finland", "Helsinki"),
    ("Poland", "Warsaw"), ("Czechia", "Prague"), ("Hungary", "Budapest"),
    ("Greece", "Athens"), ("Turkey", "Ankara"), ("Russia", "Moscow"),
    ("Ukraine", "Kyiv"), ("Canada", "Ottawa"), ("Mexico", "Mexico City"),
    ("Brazil", "Brasília"), ("Argentina", "Buenos Aires"), ("Chile", "Santiago"),
    ("Peru", "Lima"), ("Colombia", "Bogotá"), ("Japan", "Tokyo"),
    ("China", "Beijing"), ("South Korea", "Seoul"), ("India", "New Delhi"),
    ("Australia", "Canberra"), ("New Zealand", "Wellington"), ("Egypt", "Cairo"),
    ("South Africa", "Pretoria"), ("Kenya", "Nairobi"), ("Nigeria", "Abuja"),
    ("Morocco", "Rabat"), ("Israel", "Jerusalem"), ("Saudi Arabia", "Riyadh"),
    ("Iran", "Tehran"), ("Iraq", "Baghdad"), ("Pakistan", "Islamabad"),
    ("Thailand", "Bangkok"), ("Vietnam", "Hanoi"), ("Indonesia", "Jakarta"),
    ("Philippines", "Manila"), ("Singapore", "Singapore"), ("Malaysia", "Kuala Lumpur"),
]
ccaps = [c for _, c in COUNTRIES]
cnames = [n for n, _ in COUNTRIES]
for n, c in COUNTRIES:
    B.mc("local", f"What is the capital of {n}?", c, ccaps, 1)
    B.mc("local", f"{c} is the capital of which country?", n, cnames, 2)

LANDMARKS = [
    ("the Eiffel Tower", "Paris"), ("the Colosseum", "Rome"), ("the Parthenon", "Athens"),
    ("Big Ben", "London"), ("the Statue of Liberty", "New York"), ("the Golden Gate Bridge", "San Francisco"),
    ("Machu Picchu", "Peru"), ("the Taj Mahal", "India"), ("Christ the Redeemer", "Rio de Janeiro"),
    ("the Great Pyramid of Giza", "Egypt"), ("the Great Wall", "China"), ("Mount Fuji", "Japan"),
    ("Sydney Opera House", "Sydney"), ("Table Mountain", "Cape Town"), ("the Acropolis", "Athens"),
    ("Neuschwanstein Castle", "Germany"), ("Sagrada Família", "Barcelona"), ("the Kremlin", "Moscow"),
    ("Petra", "Jordan"), ("Angkor Wat", "Cambodia"), ("Chichen Itza", "Mexico"),
    ("Stonehenge", "England"), ("Niagara Falls", "the U.S.–Canada border"), ("Grand Canyon", "Arizona"),
    ("Yellowstone", "Wyoming (mostly)"), ("Everglades", "Florida"), ("Uluru", "Australia"),
]
lcities = list(dict.fromkeys(c for _, c in LANDMARKS))
for place, where in LANDMARKS:
    B.mc("local", f"Where is {place}?", where, lcities, 1)

GEO = [
    ("How many continents are commonly counted in the school model?", "7", ["5", "6", "7", "8"], 1),
    ("How many oceans are commonly named?", "5", ["3", "4", "5", "7"], 1),
    ("The largest ocean is the…", "Pacific", ["Atlantic", "Pacific", "Indian", "Arctic"], 1),
    ("The smallest ocean is the…", "Arctic", ["Indian", "Southern", "Arctic", "Atlantic"], 1),
    ("Which is the longest river on most modern lists?", "the Nile (or Amazon, depending on measure)", ["the Mississippi", "the Nile (or Amazon, depending on measure)", "the Danube", "the Rhine"], 2),
    ("The Amazon River is primarily in which continent?", "South America", ["Africa", "South America", "Asia", "Australia"], 1),
    ("The Sahara is a desert in which continent?", "Africa", ["Asia", "Africa", "Australia", "North America"], 1),
    ("The Gobi Desert is in…", "Asia", ["Africa", "Asia", "Australia", "South America"], 1),
    ("Mount Everest sits on the border of Nepal and…", "China", ["India", "China", "Bhutan only", "Pakistan"], 2),
    ("The Andes are a mountain range in which continent?", "South America", ["North America", "South America", "Europe", "Africa"], 1),
    ("The Alps are in which continent?", "Europe", ["Asia", "Europe", "Africa", "Australia"], 1),
    ("The Rockies run through which continent?", "North America", ["South America", "North America", "Europe", "Asia"], 1),
    ("The Himalayas are in which continent?", "Asia", ["Europe", "Asia", "Africa", "Australia"], 1),
    ("Which Great Lake is entirely in the United States?", "Michigan", ["Superior", "Huron", "Michigan", "Ontario"], 2),
    ("How many Great Lakes are there?", "5", ["3", "4", "5", "6"], 1),
    ("The Mississippi River empties into the…", "Gulf of Mexico", ["Atlantic at New York", "Gulf of Mexico", "Pacific", "Hudson Bay"], 1),
    ("The Nile empties into which sea?", "the Mediterranean", ["the Red Sea", "the Mediterranean", "the Black Sea", "the Caspian"], 2),
    ("The Prime Meridian passes through which observatory town?", "Greenwich", ["Paris", "Greenwich", "Washington", "Rome"], 1),
    ("Latitude lines run…", "East–west", ["North–south", "East–west", "Only at the equator", "In spirals"], 1),
    ("Longitude lines run…", "North–south", ["East–west", "North–south", "Only at the poles", "In circles of latitude"], 1),
    ("The equator is a line of…", "Latitude 0°", ["Longitude 0°", "Latitude 0°", "the Tropic of Cancer", "the Arctic Circle"], 1),
    ("The International Date Line is near which meridian?", "180°", ["0°", "90°", "180°", "45°"], 2),
    ("How many time zones does the contiguous U.S. usually use?", "4", ["2", "3", "4", "6"], 1),
    ("A compass's red needle typically points toward…", "Magnetic north", ["True south", "Magnetic north", "the equator", "the sun"], 1),
    ("Which direction is opposite west?", "East", ["North", "East", "South", "Northwest"], 1),
    ("A map's scale tells you…", "How distance on the map relates to the ground", ["The title", "How distance on the map relates to the ground", "The printer", "Magnetic declination only"], 1),
    ("A topographic map is especially good for showing…", "Elevation and relief", ["Only roads", "Elevation and relief", "Election results", "Language"], 1),
    ("An isthmus is a…", "Narrow land link between larger lands", ["Inland sea", "Narrow land link between larger lands", "Volcanic island", "Glacier"], 2),
    ("An archipelago is a…", "Group of islands", ["Mountain chain", "Group of islands", "Desert basin", "River delta"], 1),
    ("A delta forms at a river's…", "Mouth", ["Source", "Mouth", "Waterfall", "Meander only"], 1),
    ("A peninsula is land surrounded by water on how many sides, roughly?", "Three", ["One", "Two", "Three", "Four"], 1),
    ("The Tropic of Cancer is in which hemisphere?", "Northern", ["Southern", "Northern", "Only the equator", "Both equally"], 2),
    ("Which continent is also a country?", "Australia", ["Europe", "Australia", "Antarctica as a UN member", "Africa"], 1),
    ("Antarctica is centered on which pole?", "the South Pole", ["the North Pole", "the South Pole", "the equator", "the Prime Meridian"], 1),
    ("The Arctic Ocean surrounds which pole?", "the North Pole", ["the South Pole", "the North Pole", "neither", "the equator"], 1),
    ("Which U.S. state is an archipelago in the Pacific?", "Hawaii", ["Florida", "Hawaii", "Alaska only", "California"], 1),
    ("Which U.S. state is largest by area?", "Alaska", ["Texas", "Alaska", "California", "Montana"], 1),
    ("Which U.S. state is smallest by area?", "Rhode Island", ["Delaware", "Rhode Island", "Connecticut", "Hawaii"], 1),
    ("Which U.S. state has the most people?", "California", ["Texas", "California", "Florida", "New York"], 1),
    ("The four cardinal directions are north, south, east, and…", "West", ["Up", "West", "In", "Left"], 1),
    ("A 'cape' on a map is typically a…", "Headland jutting into water", ["Mountain pass", "Headland jutting into water", "Desert", "Capital"], 2),
    ("A 'sound' in place names is often a…", "Sea inlet", ["Mountain", "Sea inlet", "Desert", "Glacier"], 2),
    ("The Continental Divide in North America sheds water to the Pacific and the…", "Atlantic / Gulf / Arctic systems", ["Indian Ocean", "Atlantic / Gulf / Arctic systems", "Mediterranean", "Caspian"], 3),
    ("The Dead Sea is notable for being…", "Very salty and low in elevation", ["A freshwater Great Lake", "Very salty and low in elevation", "A river in Egypt", "An ocean trench"], 2),
    ("The Mariana Trench is in which ocean?", "Pacific", ["Atlantic", "Pacific", "Indian", "Arctic"], 2),
    ("Kilimanjaro is a mountain in which continent?", "Africa", ["Asia", "Africa", "South America", "Europe"], 1),
    ("Aconcagua is the high peak of which continent?", "South America", ["North America", "South America", "Africa", "Europe"], 2),
    ("Denali is the high peak of which continent?", "North America", ["South America", "North America", "Europe", "Asia"], 2),
    ("Elbrus is often counted as the high peak of which continent?", "Europe", ["Asia only", "Europe", "Africa", "Australia"], 3),
    ("The Strait of Gibraltar separates Europe from…", "Africa", ["Asia", "Africa", "America", "Australia"], 1),
    ("The Bering Strait separates Alaska from…", "Russia", ["Canada", "Russia", "Japan", "Greenland"], 2),
    ("The English Channel separates England from…", "France", ["Ireland", "France", "Spain", "Norway"], 1),
    ("The Panama Canal connects the Atlantic and the…", "Pacific", ["Indian Ocean", "Pacific", "Arctic", "Caspian"], 1),
    ("The Suez Canal connects the Mediterranean and the…", "Red Sea", ["Black Sea", "Red Sea", "Persian Gulf directly", "Atlantic"], 2),
    ("Greenland is a large island associated politically with…", "Denmark", ["Canada", "Denmark", "Norway", "Iceland"], 2),
    ("Iceland sits on which ocean, roughly?", "the North Atlantic", ["the Pacific", "the North Atlantic", "the Indian", "the Southern"], 1),
    ("The island of Hispaniola is shared by Haiti and…", "the Dominican Republic", ["Cuba", "the Dominican Republic", "Jamaica", "Puerto Rico"], 2),
    ("Cuba is in which sea?", "the Caribbean", ["the Mediterranean", "the Caribbean", "the North Sea", "the Baltic"], 1),
    ("The Baltic Sea is in which continent's north?", "Europe", ["Asia", "Europe", "Africa", "Australia"], 1),
    ("The Black Sea is bordered by Turkey and…", "several European / Caucasian states", ["only Egypt", "several European / Caucasian states", "only Italy", "Japan"], 2),
    ("The Caspian Sea is actually a…", "Landlocked salt lake", ["True ocean", "Landlocked salt lake", "River", "Glacier"], 2),
]
for prompt, ans, ch, d in GEO:
    B.add("local", prompt, ch, ans, d)

# --- Political --------------------------------------------------------------
CIVICS = [
    ("How many branches does the U.S. federal government have?", "3", ["2", "3", "4", "5"], 1),
    ("The U.S. President is the head of which branch?", "Executive", ["Legislative", "Executive", "Judicial", "Military as a fourth branch"], 1),
    ("Congress is part of which branch?", "Legislative", ["Executive", "Legislative", "Judicial", "State"], 1),
    ("The Supreme Court is part of which branch?", "Judicial", ["Executive", "Legislative", "Judicial", "Electoral"], 1),
    ("A U.S. Representative's term is how many years?", "2", ["2", "4", "6", "8"], 1),
    ("A U.S. Senator's term is how many years?", "6", ["2", "4", "6", "8"], 1),
    ("A U.S. President's term is how many years?", "4", ["2", "4", "6", "8"], 1),
    ("How many terms may a U.S. President be elected to, under the 22nd Amendment?", "2", ["1", "2", "3", "unlimited"], 1),
    ("How many U.S. senators does each state have?", "2", ["1", "2", "3", "based on population"], 1),
    ("The U.S. Senate has how many members?", "100", ["50", "100", "435", "538"], 1),
    ("The U.S. House has how many voting members?", "435", ["100", "435", "50", "270"], 1),
    ("The Bill of Rights is the first how many amendments?", "10", ["5", "8", "10", "12"], 1),
    ("Freedom of speech is protected in which amendment?", "the First", ["the First", "the Second", "the Fourth", "the Fifth"], 1),
    ("The Second Amendment is most associated with…", "Arms", ["Speech", "Arms", "Search", "Slavery's end"], 1),
    ("The Fourth Amendment protects against unreasonable…", "Searches and seizures", ["Taxes", "Searches and seizures", "Quartering only", "Trials"], 1),
    ("Who signs a bill into federal law?", "the President", ["the Speaker", "the President", "the Chief Justice", "the Senate clerk"], 1),
    ("Who can veto a bill?", "the President", ["the House only", "the President", "the Cabinet", "the states"], 1),
    ("A veto can be overridden by…", "a two-thirds vote in both houses", ["a simple House vote", "a two-thirds vote in both houses", "the Supreme Court", "a governors' compact"], 2),
    ("The Electoral College elects the…", "President", ["Senate", "President", "House", "Court"], 1),
    ("How many electoral votes are needed to win the presidency, currently?", "270", ["250", "270", "300", "435"], 2),
    ("The Vice President is also the President of the…", "Senate", ["House", "Senate", "Cabinet", "Court"], 2),
    ("Impeachment of a president is brought by the…", "House", ["Senate", "House", "Court", "States"], 2),
    ("The Senate's role in impeachment is to…", "Try the case", ["Bring charges only", "Try the case", "Ignore it", "Elect a replacement"], 2),
    ("The first U.S. President was…", "George Washington", ["Jefferson", "George Washington", "Adams", "Madison"], 1),
    ("Who is credited as the principal author of the Declaration of Independence?", "Thomas Jefferson", ["Franklin", "Thomas Jefferson", "Hamilton", "Madison"], 1),
    ("The U.S. Constitution was written in which city?", "Philadelphia", ["New York", "Philadelphia", "Boston", "Washington"], 1),
    ("Independence Day in the U.S. is celebrated on…", "July 4", ["June 14", "July 4", "November 11", "December 15"], 1),
    ("Memorial Day in the U.S. honors…", "the war dead", ["living veterans only", "the war dead", "labor", "the flag"], 1),
    ("Veterans Day in the U.S. is on…", "November 11", ["May's last Monday", "November 11", "July 4", "the first Tuesday in November"], 1),
    ("Labor Day in the U.S. is observed in which month?", "September", ["May", "July", "September", "October"], 1),
    ("Thanksgiving in the U.S. falls on a…", "Thursday", ["Monday", "Thursday", "Friday", "Sunday"], 1),
    ("The U.S. flag's stars represent…", "the states", ["the original colonies only", "the states", "presidents", "wars"], 1),
    ("The U.S. flag's stripes represent…", "the original 13 colonies", ["the 50 states", "the original 13 colonies", "the amendments", "the branches"], 1),
    ("NATO is primarily a…", "Military alliance", ["Trade court", "Military alliance", "Currency union", "Soccer body"], 1),
    ("The United Nations headquarters is in…", "New York", ["Geneva only", "New York", "The Hague only", "Paris"], 1),
    ("The UN Security Council has how many permanent members?", "5", ["5", "10", "15", "193"], 2),
    ("The EU is a…", "Political and economic union of European states", ["Military pact only", "Political and economic union of European states", "UN agency", "soccer league"], 1),
    ("The euro is the currency of…", "many EU countries", ["all of Europe", "many EU countries", "only France", "the UK"], 1),
    ("The UK's currency is the…", "Pound sterling", ["Euro", "Pound sterling", "Franc", "Mark"], 1),
    ("Canada's national legislature sits in…", "Ottawa", ["Toronto", "Ottawa", "Montreal", "Vancouver"], 1),
    ("Mexico's national capital is…", "Mexico City", ["Guadalajara", "Mexico City", "Monterrey", "Cancún"], 1),
    ("A democracy, in the schoolbook sense, is government by…", "the people", ["one monarch only", "the people", "the army", "lot"], 1),
    ("A monarchy is headed by a…", "King or queen", ["President only", "King or queen", "Speaker", "Judge"], 1),
    ("A republic typically has a…", "Head of state who is not a hereditary monarch", ["King always", "Head of state who is not a hereditary monarch", "No laws", "Single voter"], 2),
    ("Federalism splits power between…", "National and state (or provincial) governments", ["Two houses only", "National and state (or provincial) governments", "Church and guilds", "Cities only"], 2),
    ("The U.S. census happens every how many years?", "10", ["4", "5", "10", "20"], 1),
    ("Gerrymandering refers to…", "Drawing districts for political advantage", ["A veto", "Drawing districts for political advantage", "A tax", "A treaty"], 2),
    ("A filibuster is associated with delaying action in the…", "U.S. Senate", ["Supreme Court", "U.S. Senate", "the Cabinet", "state houses only"], 2),
    ("The Speaker of the House is a leader in the…", "U.S. House of Representatives", ["Senate", "U.S. House of Representatives", "Court", "Pentagon"], 1),
    ("Marbury v. Madison is famous for establishing…", "Judicial review", ["Income tax", "Judicial review", "the draft", "Prohibition"], 3),
    ("Brown v. Board of Education concerned…", "School segregation", ["Gun rights", "School segregation", "Campaign finance", "Water rights"], 2),
    ("Miranda rights concern…", "Police warnings to suspects", ["Voting ID", "Police warnings to suspects", "Jury size", "Taxes"], 1),
    ("The 13th Amendment abolished…", "Slavery", ["Alcohol", "Slavery", "the poll tax", "Senatorial appointment"], 1),
    ("The 19th Amendment concerned…", "Women's suffrage", ["Income tax", "Women's suffrage", "Prohibition", "the two-term limit"], 1),
    ("Prohibition was ended by which amendment?", "the 21st", ["the 18th", "the 21st", "the 16th", "the 22nd"], 2),
    ("The 16th Amendment allowed a federal…", "Income tax", ["Draft", "Income tax", "Income-tax ban", "Poll tax"], 3),
    ("Who is Commander in Chief of the U.S. military?", "the President", ["the Speaker", "the President", "the Chief Justice", "the Secretary of State"], 1),
    ("Treaties, under the Constitution, are ratified by the…", "Senate", ["House", "Senate", "Court", "the states by compact"], 2),
    ("Cabinet secretaries are nominated by the President and confirmed by the…", "Senate", ["House", "Senate", "Court", "Governors"], 2),
    ("The Pentagon is the headquarters of the U.S. Department of…", "Defense", ["State", "Defense", "Justice", "Treasury"], 1),
    ("The State Department handles…", "Foreign affairs", ["Taxes", "Foreign affairs", "National parks", "the census"], 1),
    ("The Department of Justice is headed by the…", "Attorney General", ["Solicitor of the House", "Attorney General", "Chief Justice", "FBI director only"], 2),
    ("The IRS is part of which department?", "Treasury", ["Justice", "Treasury", "Commerce", "Interior"], 2),
    ("National parks are overseen chiefly by the Department of the…", "Interior", ["Agriculture only", "Interior", "Commerce", "Energy"], 2),
    ("NATO's Article 5 is about…", "Collective defense", ["Free trade", "Collective defense", "Currency", "Fishing"], 3),
    ("The World Court (ICJ) sits in…", "The Hague", ["New York", "The Hague", "Geneva only", "Brussels"], 3),
    ("The Magna Carta was sealed in which century?", "the 13th", ["the 10th", "the 13th", "the 18th", "the 20th"], 3),
    ("The French Revolution is dated to which year, classically?", "1789", ["1776", "1789", "1812", "1848"], 2),
    ("The Berlin Wall fell in…", "1989", ["1961", "1979", "1989", "1999"], 2),
    ("The United Nations was founded in…", "1945", ["1918", "1945", "1955", "1961"], 2),
    ("World War I ended in…", "1918", ["1914", "1918", "1929", "1939"], 1),
    ("World War II ended in…", "1945", ["1939", "1941", "1945", "1950"], 1),
    ("D-Day refers to the 1944 landings in…", "Normandy", ["Sicily only", "Normandy", "the Pacific only", "North Africa only"], 2),
    ("The Cold War was chiefly a rivalry between the U.S. and…", "the Soviet Union", ["Japan", "the Soviet Union", "Brazil", "Canada"], 1),
    ("Apartheid was a system in which country?", "South Africa", ["India", "South Africa", "Australia", "Brazil"], 1),
    ("Gandhi is most associated with independence for…", "India", ["Kenya", "India", "Ghana", "Egypt"], 1),
    ("Nelson Mandela was president of…", "South Africa", ["Kenya", "South Africa", "Nigeria", "Zimbabwe"], 1),
    ("The Commonwealth includes many countries formerly in the…", "British Empire", ["Ottoman Empire", "British Empire", "Soviet Union", "Holy Roman Empire"], 2),
]
for prompt, ans, ch, d in CIVICS:
    B.add("political", prompt, ch, ans, d)

# --- Food -------------------------------------------------------------------
DISHES = [
    ("pizza", "Italy"), ("sushi", "Japan"), ("tacos", "Mexico"), ("paella", "Spain"),
    ("poutine", "Canada"), ("pad thai", "Thailand"), ("pho", "Vietnam"), ("kimchi", "Korea"),
    ("croissant", "France"), ("sauerkraut", "Germany"), ("fish and chips", "Britain"),
    ("haggis", "Scotland"), ("pao de queijo", "Brazil"), ("empanadas", "several Latin countries"),
    ("ceviche", "Peru / the Andes coast"), ("arepas", "Venezuela / Colombia"),
    ("feijoada", "Brazil"), ("asado", "Argentina"), ("mole", "Mexico"),
    ("gumbo", "Louisiana"), ("jambalaya", "Louisiana"), ("chowder", "New England"),
    ("cheesesteak", "Philadelphia"), ("deep-dish pizza", "Chicago"), ("hot brown", "Kentucky"),
    ("lobster roll", "New England"), ("key lime pie", "Florida"), ("pecan pie", "the American South"),
    ("brisket barbecue", "Texas"), ("pulled pork", "the Carolinas"), ("cioppino", "San Francisco"),
    ("mission burrito", "San Francisco"), ("Coney dog", "Detroit"), ("garbage plate", "Rochester"),
    ("schnitzel", "Austria / Germany"), ("goulash", "Hungary"), ("pierogi", "Poland"),
    ("borscht", "Eastern Europe"), ("couscous", "North Africa"), ("tagine", "Morocco"),
    ("injera", "Ethiopia"), ("jollof rice", "West Africa"), ("bunny chow", "South Africa"),
    ("naan", "South Asia"), ("tikka masala", "Britain / South Asia"), ("vindaloo", "Goa / Portugal-India"),
    ("dim sum", "China"), ("ramen", "Japan"), ("udon", "Japan"), ("tempura", "Japan"),
    ("satay", "Indonesia / Malaysia"), ("laksa", "Malaysia / Singapore"), ("nasi goreng", "Indonesia"),
    ("banh mi", "Vietnam"), ("spring rolls", "East / Southeast Asia"), ("peking duck", "China"),
    ("mapo tofu", "China"), ("pho ga", "Vietnam"), ("tom yum", "Thailand"),
    ("moussaka", "Greece"), ("gyro", "Greece"), ("falafel", "the Levant"),
    ("hummus", "the Levant"), ("shawarma", "the Levant"), ("baklava", "the eastern Mediterranean"),
    ("tiramisu", "Italy"), ("risotto", "Italy"), ("lasagna", "Italy"), ("gelato", "Italy"),
    ("fondue", "Switzerland"), ("waffle", "Belgium"), ("stroopwafel", "the Netherlands"),
    ("smørrebrød", "Denmark"), ("meatballs with lingonberry", "Sweden"), ("reindeer stew", "the Nordic north"),
    ("vegemite on toast", "Australia"), ("pavlova", "Australia / New Zealand"), ("hāngī", "New Zealand"),
    ("poi", "Hawaii"), ("loco moco", "Hawaii"), ("spam musubi", "Hawaii"),
    ("baguette", "France"), ("escargot", "France"), ("crème brûlée", "France"),
    ("pretzel", "Germany / Alsace"), ("bratwurst", "Germany"), ("doner kebab", "Turkey / Germany"),
    ("börek", "the Balkans / Turkey"), ("cevapi", "the Balkans"),
]
origins = list(dict.fromkeys(o for _, o in DISHES))
for dish, origin in DISHES:
    B.mc("food", f"{dish[0].upper() + dish[1:]} is most associated with which place?", origin, origins, 1)

FOOD_FACTS = [
    ("Yeast makes bread rise by producing…", "Carbon dioxide", ["Oxygen", "Carbon dioxide", "Nitrogen", "Helium"], 1),
    ("Photosynthesis in plants produces sugars using sunlight, water, and…", "Carbon dioxide", ["Nitrogen gas only", "Carbon dioxide", "Helium", "Salt"], 1),
    ("Table salt is chemically…", "Sodium chloride", ["Sodium chloride", "Potassium iodide only", "Calcium carbonate", "Sugar"], 1),
    ("Caffeine is a stimulant found in coffee, tea, and…", "Cacao / chocolate", ["Lettuce", "Cacao / chocolate", "Milk", "Salt"], 1),
    ("A vegan diet excludes…", "All animal products", ["Only red meat", "All animal products", "Only dairy", "Gluten"], 1),
    ("Lactose is a sugar in…", "Milk", ["Wheat", "Milk", "Soy sauce", "Olive oil"], 1),
    ("Gluten is a protein in…", "Wheat and related grains", ["Rice only", "Wheat and related grains", "Corn oil", "Salt"], 1),
    ("Sourdough uses…", "Wild yeast and bacteria", ["Baking powder only", "Wild yeast and bacteria", "Eggs only", "Steam only"], 1),
    ("Espresso is extracted with hot water under…", "Pressure", ["Vacuum only", "Pressure", "Freezing", "Spin"], 1),
    ("Black tea is typically…", "Oxidized", ["Never oxidized", "Oxidized", "A herbal infusion only", "Coffee"], 2),
    ("Green tea is typically…", "Little-oxidized Camellia sinensis", ["A mint blend", "Little-oxidized Camellia sinensis", "Roasted barley only", "Coffee cherry"], 2),
    ("A cappuccino is espresso with steamed milk and…", "Foam", ["Ice cream", "Foam", "Whipped cream only", "Lemon"], 1),
    ("A latte is espresso with more…", "Steamed milk", ["Water only", "Steamed milk", "Cream only", "Syrup only"], 1),
    ("Champagne, strictly, comes from…", "Champagne, France", ["Catalonia", "Champagne, France", "California", "Veneto"], 1),
    ("Prosecco is a sparkling wine from…", "Italy", ["Spain", "Italy", "Germany", "Portugal"], 1),
    ("Cava is a sparkling wine from…", "Spain", ["France", "Spain", "Chile", "Australia"], 2),
    ("Port wine is associated with which country?", "Portugal", ["Spain", "Portugal", "France", "Italy"], 2),
    ("Tequila is made from…", "Blue agave", ["Wheat", "Blue agave", "Potatoes", "Rice"], 1),
    ("Whiskey is a spirit aged typically in…", "Wooden barrels", ["Glass only", "Wooden barrels", "Steel only", "Clay amphorae only"], 1),
    ("Vodka can be distilled from potatoes or…", "Grain", ["Agave only", "Grain", "Grapes only", "Cactus only"], 1),
    ("Beer is fermented from…", "Malted grain", ["Grapes", "Malted grain", "Apples only", "Honey only"], 1),
    ("Cider is fermented from…", "Apples", ["Pears only", "Apples", "Grapes", "Barley"], 1),
    ("Mead is fermented from…", "Honey", ["Malt", "Honey", "Agave", "Rice"], 1),
    ("Soy sauce is a fermented seasoning from…", "Soybeans (and often wheat)", ["Fish only", "Soybeans (and often wheat)", "Milk", "Corn syrup only"], 1),
    ("Miso is a paste made from…", "Fermented soybeans", ["Rice vinegar only", "Fermented soybeans", "Sesame only", "Fish"], 2),
    ("Tofu is made from…", "Soybeans", ["Almonds", "Soybeans", "Wheat gluten", "Rice"], 1),
    ("Tempeh is associated with which country?", "Indonesia", ["Japan", "Indonesia", "Korea", "Thailand"], 2),
    ("Olive oil is pressed from…", "Olives", ["Sunflower seeds", "Olives", "Corn", "Canola"], 1),
    ("Butter is churned from…", "Cream", ["Olive oil", "Cream", "Coconut water", "Egg whites"], 1),
    ("Cheese is made from…", "Milk", ["Grain", "Milk", "Fruit", "Eggs only"], 1),
    ("Mozzarella is classically a cheese of…", "Italy", ["France", "Italy", "Switzerland", "the Netherlands"], 1),
    ("Cheddar is a cheese named for a place in…", "England", ["France", "England", "Spain", "Ireland only"], 1),
    ("Brie is a cheese of…", "France", ["Italy", "France", "Greece", "Denmark"], 1),
    ("Feta is a cheese of…", "Greece", ["Italy", "Greece", "Spain", "France"], 1),
    ("Parmesan (Parmigiano) is a cheese of…", "Italy", ["France", "Italy", "Switzerland", "Austria"], 1),
    ("Roquefort is a blue cheese of…", "France", ["England", "France", "Italy", "Denmark"], 2),
    ("A baguette's crust comes largely from…", "Steam and a hot oven", ["Frying", "Steam and a hot oven", "Freezing", "Microwaving"], 2),
    ("Pasta is typically made from…", "Wheat dough", ["Rice only", "Wheat dough", "Corn husks", "Potato starch only"], 1),
    ("Risotto's creaminess comes from…", "Starch released from the rice", ["Heavy cream only", "Starch released from the rice", "Egg yolks only", "Cheese only"], 2),
    ("A roux is flour cooked in…", "Fat", ["Water", "Fat", "Vinegar", "Wine only"], 2),
    ("Stock is a savory liquid made by simmering…", "Bones and/or vegetables", ["Only sugar", "Bones and/or vegetables", "Only milk", "Only fruit"], 1),
    ("A vinaigrette is oil whisked with…", "Vinegar or acid", ["Cream", "Vinegar or acid", "Soy only", "Honey only"], 1),
    ("Mayonnaise is an emulsion of egg and…", "Oil", ["Water", "Oil", "Milk", "Wine"], 1),
    ("Hollandaise is a sauce of butter, egg yolk, and…", "Lemon / acid", ["Soy", "Lemon / acid", "Tomato", "Chocolate"], 2),
    ("Tomato is botanically a…", "Fruit", ["Root", "Fruit", "Fungus", "Grain"], 1),
    ("A peanut is botanically a…", "Legume", ["Tree nut only", "Legume", "Grain", "Fungus"], 2),
    ("A potato is a…", "Tuber", ["Fruit", "Tuber", "Seed", "Leaf"], 1),
    ("A carrot is a…", "Root", ["Stem", "Root", "Leaf", "Flower"], 1),
    ("Broccoli is eaten as a…", "Flower head", ["Root", "Flower head", "Seed pod only", "Tuber"], 2),
    ("Rice is a…", "Grain", ["Tuber", "Grain", "Legume", "Nut"], 1),
    ("Corn (maize) was first domesticated in…", "Mesoamerica", ["China", "Mesoamerica", "Egypt", "Italy"], 2),
    ("Wheat was first domesticated in the…", "Fertile Crescent", ["Andes", "Fertile Crescent", "Mesoamerica", "West Africa"], 3),
    ("Chocolate comes from the seeds of the…", "Cacao tree", ["Coffee shrub", "Cacao tree", "Vanilla orchid", "Tea bush"], 1),
    ("Vanilla comes from an…", "Orchid", ["Lily", "Orchid", "Rose", "Cactus"], 2),
    ("Black pepper comes from a…", "Berry / peppercorn vine", ["Root", "Berry / peppercorn vine", "Bark", "Flower only"], 2),
    ("Cinnamon is a…", "Bark", ["Seed", "Bark", "Root", "Leaf only"], 2),
    ("Saffron comes from the stigmas of a…", "Crocus", ["Rose", "Crocus", "Lily", "Tulip"], 2),
    ("Honey is made by…", "Bees", ["Wasps only", "Bees", "Ants", "Flies"], 1),
    ("Maple syrup is boiled from…", "Tree sap", ["Cane juice", "Tree sap", "Beet juice", "Corn"], 1),
    ("Cane sugar is extracted from…", "Sugarcane", ["Beets only", "Sugarcane", "Maples only", "Corn only"], 1),
    ("A calorie on a food label is actually a…", "Kilocalorie", ["Joule only", "Kilocalorie", "Watt", "Newton"], 3),
    ("Umami is associated with which compound, famously?", "Glutamate", ["Capsaicin", "Glutamate", "Menthol", "Ethanol"], 2),
    ("Capsaicin makes chili peppers…", "Hot", ["Sweet", "Hot", "Bitter only", "Sour"], 1),
    ("Scoville units measure…", "Chili heat", ["Salt", "Chili heat", "Sweetness", "Caffeine"], 2),
    ("Sushi rice is seasoned with…", "Vinegar (and often sugar and salt)", ["Soy only", "Vinegar (and often sugar and salt)", "Mustard", "Chili oil only"], 2),
    ("Wasabi is a…", "Pungent rhizome", ["Seaweed", "Pungent rhizome", "Fish roe", "Pickled plum"], 2),
    ("Nori is…", "Seaweed", ["Rice paper", "Seaweed", "Soy skin", "Egg"], 1),
    ("A bagel is boiled then…", "Baked", ["Fried", "Baked", "Steamed only", "Grilled only"], 1),
    ("A croissant's layers come from…", "Laminated butter dough", ["Puff candy", "Laminated butter dough", "Phyllo only", "Choux only"], 2),
    ("Phyllo is a…", "Paper-thin pastry", ["Egg foam", "Paper-thin pastry", "Choux puff", "Brioche"], 2),
    ("A soufflé rises because of…", "Beaten egg whites", ["Baking soda only", "Beaten egg whites", "Gelatin", "Yeast only"], 2),
    ("Gelato is typically served…", "Denser and a bit warmer than American ice cream", ["As a soup", "Denser and a bit warmer than American ice cream", "Frozen solid as a brick only", "As a drink only"], 2),
    ("A milkshake is typically ice cream blended with…", "Milk", ["Water", "Milk", "Oil", "Stock"], 1),
    ("A smoothie is typically fruit blended with a…", "Liquid", ["Roux", "Liquid", "Pastry", "Cheese"], 1),
    ("Breakfast cereal became an American staple in which state, famously?", "Michigan (Battle Creek)", ["Texas", "Michigan (Battle Creek)", "Florida", "Alaska"], 3),
    ("A 'blue plate' special is a diner term for…", "A set cheap meal", ["Dessert only", "A set cheap meal", "A cocktail", "A wine"], 2),
    ("Umami was identified as a fifth taste in which country?", "Japan", ["France", "Japan", "Italy", "the U.S."], 2),
    ("MSG is a salt of…", "Glutamic acid", ["Citric acid", "Glutamic acid", "Acetic acid", "Sulfuric acid"], 3),
    ("Pasteurization heats food to kill…", "Microbes", ["Vitamins only", "Microbes", "Color", "Water"], 1),
    ("Canning preserves food by sealing it after…", "Heat", ["Freezing only", "Heat", "Salting only", "Drying only"], 1),
    ("A brine is water with a lot of…", "Salt", ["Sugar only", "Salt", "Oil", "Flour"], 1),
    ("Ceviche 'cooks' fish using…", "Acid (citrus)", ["Fire only", "Acid (citrus)", "Smoke only", "Oil only"], 2),
    ("Barbecue, in the American pit sense, is cooking with…", "Low heat and smoke", ["A deep fryer", "Low heat and smoke", "A microwave", "Boiling"], 1),
    ("Braising is cooking slowly in a…", "Covered pot with some liquid", ["Dry sheet pan only", "Covered pot with some liquid", "Deep fryer", "Raw marinade only"], 2),
    ("Poaching is cooking gently in…", "Liquid below a boil", ["Fat at high heat", "Liquid below a boil", "a dry oven only", "a smoker only"], 2),
    ("Searing browns food using…", "High heat", ["Steam", "High heat", "Freezing", "Salt only"], 1),
    ("The Maillard reaction is…", "Browning of proteins and sugars", ["Melting ice", "Browning of proteins and sugars", "Fermentation of cabbage", "Whipping cream"], 3),
    ("Caramelization browns…", "Sugars", ["Proteins only", "Sugars", "Fats only", "Salt"], 2),
]
for prompt, ans, ch, d in FOOD_FACTS:
    B.add("food", prompt, ch, ans, d)

# --- Arts -------------------------------------------------------------------
PAINTINGS = [
    ("the Mona Lisa", "Leonardo da Vinci"),
    ("the Last Supper", "Leonardo da Vinci"),
    ("the Sistine Chapel ceiling", "Michelangelo"),
    ("David (the marble)", "Michelangelo"),
    ("The School of Athens", "Raphael"),
    ("The Birth of Venus", "Botticelli"),
    ("Girl with a Pearl Earring", "Vermeer"),
    ("The Night Watch", "Rembrandt"),
    ("The Starry Night", "Van Gogh"),
    ("Sunflowers (the famous series)", "Van Gogh"),
    ("The Persistence of Memory", "Dalí"),
    ("Guernica", "Picasso"),
    ("Les Demoiselles d'Avignon", "Picasso"),
    ("Water Lilies (the famous series)", "Monet"),
    ("Impression, Sunrise", "Monet"),
    ("American Gothic", "Grant Wood"),
    ("Nighthawks", "Edward Hopper"),
    ("Campbell's Soup Cans", "Warhol"),
    ("Marilyn (the silkscreens)", "Warhol"),
    ("The Kiss (the gold one)", "Klimt"),
    ("The Scream", "Munch"),
    ("Arrangement in Grey and Black (Whistler's Mother)", "Whistler"),
    ("Olympia", "Manet"),
    ("Luncheon on the Grass", "Manet"),
    ("A Sunday on La Grande Jatte", "Seurat"),
    ("The Dance (the red one)", "Matisse"),
    ("Composition with Red, Blue and Yellow", "Mondrian"),
    ("Broadway Boogie Woogie", "Mondrian"),
    ("The Arnolfini Portrait", "van Eyck"),
    ("Las Meninas", "Velázquez"),
    ("Saturn Devouring His Son", "Goya"),
    ("Liberty Leading the People", "Delacroix"),
    ("The Death of Marat", "David"),
    ("The Hay Wain", "Constable"),
    ("Rain, Steam and Speed", "Turner"),
    ("The Fighting Temeraire", "Turner"),
    ("Christina's World", "Wyeth"),
    ("The Great Wave off Kanagawa", "Hokusai"),
    ("Campbell-era pop portraits aside, soup cans are by", "Warhol"),
]
artists = list(dict.fromkeys(a for _, a in PAINTINGS if a != "Warhol" or True))
for work, artist in PAINTINGS:
    if work.startswith("Campbell-era"):
        continue
    B.mc("arts", f"Who is credited with {work}?", artist, artists, 1 if artist in {"Leonardo da Vinci", "Michelangelo", "Van Gogh", "Picasso", "Monet", "Warhol"} else 2)

AUTHORS = [
    ("Romeo and Juliet", "Shakespeare"),
    ("Hamlet", "Shakespeare"),
    ("Macbeth", "Shakespeare"),
    ("Pride and Prejudice", "Jane Austen"),
    ("Jane Eyre", "Charlotte Brontë"),
    ("Wuthering Heights", "Emily Brontë"),
    ("Moby-Dick", "Melville"),
    ("The Adventures of Huckleberry Finn", "Twain"),
    ("The Great Gatsby", "Fitzgerald"),
    ("To Kill a Mockingbird", "Harper Lee"),
    ("1984", "Orwell"),
    ("Animal Farm", "Orwell"),
    ("Brave New World", "Huxley"),
    ("The Catcher in the Rye", "Salinger"),
    ("One Hundred Years of Solitude", "García Márquez"),
    ("Crime and Punishment", "Dostoevsky"),
    ("War and Peace", "Tolstoy"),
    ("Anna Karenina", "Tolstoy"),
    ("The Odyssey", "Homer"),
    ("The Iliad", "Homer"),
    ("Don Quixote", "Cervantes"),
    ("Les Misérables", "Hugo"),
    ("The Divine Comedy", "Dante"),
    ("Frankenstein", "Mary Shelley"),
    ("Dracula", "Bram Stoker"),
    ("The Hobbit", "Tolkien"),
    ("The Lord of the Rings", "Tolkien"),
    ("Harry Potter and the Philosopher's Stone", "J. K. Rowling"),
    ("The Old Man and the Sea", "Hemingway"),
    ("Beloved", "Toni Morrison"),
    ("Their Eyes Were Watching God", "Zora Neale Hurston"),
    ("Invisible Man", "Ralph Ellison"),
    ("Things Fall Apart", "Chinua Achebe"),
    ("The Stranger", "Camus"),
    ("Waiting for Godot", "Beckett"),
]
authors = list(dict.fromkeys(a for _, a in AUTHORS))
for book, author in AUTHORS:
    B.mc("arts", f"Who wrote {book}?", author, authors, 1)

COMPOSERS = [
    ("the Ninth Symphony ('Ode to Joy')", "Beethoven"),
    ("The Four Seasons", "Vivaldi"),
    ("The Magic Flute", "Mozart"),
    ("The Marriage of Figaro", "Mozart"),
    ("Messiah (the oratorio with the Hallelujah chorus)", "Handel"),
    ("Swan Lake", "Tchaikovsky"),
    ("The Nutcracker", "Tchaikovsky"),
    ("Carmen", "Bizet"),
    ("La Traviata", "Verdi"),
    ("Aida", "Verdi"),
    ("The Ring Cycle", "Wagner"),
    ("Boléro", "Ravel"),
    ("Clair de Lune", "Debussy"),
    ("Rhapsody in Blue", "Gershwin"),
    ("West Side Story (the original score)", "Leonard Bernstein"),
    ("The Planets", "Holst"),
    ("Carmina Burana", "Orff"),
    ("The Firebird", "Stravinsky"),
    ("The Rite of Spring", "Stravinsky"),
]
composers = list(dict.fromkeys(c for _, c in COMPOSERS))
for work, composer in COMPOSERS:
    B.mc("arts", f"Who composed {work}?", composer, composers, 2)

ARTS_FACTS = [
    ("A sonnet typically has how many lines?", "14", ["8", "10", "12", "14"], 2),
    ("A haiku in English teaching is often how many syllables?", "17", ["5", "12", "17", "21"], 1),
    ("Iambic pentameter is associated with…", "Shakespearean verse", ["haiku only", "Shakespearean verse", "blues lyrics only", "limericks only"], 2),
    ("A novel is a…", "Long work of prose fiction", ["Play only", "Long work of prose fiction", "Symphony", "Painting"], 1),
    ("A play's text is a…", "Script / dramatic text", ["Score only", "Script / dramatic text", "Libretto only if sung", "Caption"], 1),
    ("An opera is drama that is chiefly…", "Sung", ["Spoken only", "Sung", "Danced only", "Silent"], 1),
    ("A ballet is drama that is chiefly…", "Danced", ["Sung only", "Danced", "Read", "Painted"], 1),
    ("A symphony is a work for…", "Orchestra", ["Solo piano only", "Orchestra", "Choir only", "Guitar"], 1),
    ("A concerto features a soloist with…", "an orchestra", ["a choir only", "an orchestra", "silence", "a narrator only"], 1),
    ("Chamber music is written for…", "a small group", ["a stadium rock band", "a small group", "a marching band only", "a pipe organ only"], 2),
    ("A fresco is painting on…", "Wet plaster", ["Canvas only", "Wet plaster", "Glass only", "Silk only"], 2),
    ("Tempera paint traditionally uses…", "Egg yolk", ["Oil only", "Egg yolk", "Acrylic polymer only", "Watercolor pans only"], 3),
    ("Oil paint's binder is…", "Drying oil", ["Egg", "Drying oil", "Gum arabic only", "Wax only"], 2),
    ("A lithograph is a print from…", "a stone or plate", ["a wood block only", "a stone or plate", "a bronze only", "a photograph negative only"], 3),
    ("A still life typically depicts…", "Objects", ["Battles", "Objects", "Portraits of kings", "Landscapes only"], 1),
    ("A landscape painting depicts…", "Outdoor scenery", ["A single apple", "Outdoor scenery", "A courtroom", "Sheet music"], 1),
    ("A portrait depicts…", "a person (or people)", ["a mountain only", "a person (or people)", "a bowl of fruit only", "a battle only"], 1),
    ("Perspective in drawing is a way to show…", "Depth", ["Color only", "Depth", "Sound", "Time only"], 1),
    ("Chiaroscuro is strong contrast of…", "Light and dark", ["Warm and cool only", "Light and dark", "Near and far only", "Rough and smooth only"], 2),
    ("Impressionism is associated with which century?", "the 19th", ["the 15th", "the 19th", "the 12th", "the 21st only"], 2),
    ("Cubism is associated with…", "Picasso and Braque", ["Monet only", "Picasso and Braque", "Warhol only", "Rembrandt"], 2),
    ("Surrealism is associated with dreamlike images and…", "Dalí among others", ["Constable", "Dalí among others", "Whistler only", "Homer"], 2),
    ("The Louvre is in which city?", "Paris", ["Rome", "Paris", "Madrid", "London"], 1),
    ("The Prado is in which city?", "Madrid", ["Barcelona", "Madrid", "Lisbon", "Seville"], 1),
    ("The Uffizi is in which city?", "Florence", ["Venice", "Florence", "Milan", "Naples"], 2),
    ("MoMA is in which city?", "New York", ["Chicago", "New York", "Los Angeles", "Boston"], 1),
    ("The Hermitage is in which city?", "Saint Petersburg", ["Moscow", "Saint Petersburg", "Kiev", "Warsaw"], 2),
    ("The Rijksmuseum is in which city?", "Amsterdam", ["Rotterdam", "Amsterdam", "The Hague", "Brussels"], 2),
    ("Tate Modern is in which city?", "London", ["Manchester", "London", "Edinburgh", "Dublin"], 1),
    ("A sonata is typically a work for…", "a solo instrument (often with piano)", ["full chorus only", "a solo instrument (often with piano)", "pipe organ and stadium", "a marching band"], 2),
    ("Jazz improvisation means musicians…", "Invent as they play", ["Only read the page", "Invent as they play", "Never play together", "Use no rhythm"], 1),
    ("The blues is a music form from the…", "African American South", ["Alps", "African American South", "Outback", "Siberia"], 1),
    ("Country music's historic capital is…", "Nashville", ["Austin only", "Nashville", "Memphis only", "Atlanta only"], 1),
    ("Reggae is associated with which country?", "Jamaica", ["Trinidad only", "Jamaica", "Cuba only", "Brazil"], 1),
    ("Samba and bossa nova are associated with…", "Brazil", ["Argentina", "Brazil", "Spain", "Portugal only"], 1),
    ("Flamenco is associated with…", "Spain", ["Italy", "Spain", "France", "Greece"], 1),
    ("The tango is associated with…", "Argentina / Uruguay", ["Brazil", "Argentina / Uruguay", "Mexico", "Chile"], 1),
    ("Hip-hop's early geography is…", "the Bronx / New York", ["Seattle", "the Bronx / New York", "Nashville", "New Orleans only"], 2),
    ("A treble clef is a symbol in…", "Musical notation", ["Algebra", "Musical notation", "Heraldry only", "Cartography only"], 1),
    ("A piano has how many keys on the standard modern instrument?", "88", ["64", "76", "88", "100"], 2),
    ("A violin is played with a…", "Bow (and sometimes plucked)", ["Mallet only", "Bow (and sometimes plucked)", "Pick only", "Reed"], 1),
    ("A clarinet uses a…", "Single reed", ["Double reed", "Single reed", "No reed — brass mouthpiece", "Bow"], 2),
    ("An oboe uses a…", "Double reed", ["Single reed", "Double reed", "Brass mouthpiece", "Bow"], 2),
    ("A trumpet is a…", "Brass instrument", ["Woodwind", "Brass instrument", "String", "Percussion only"], 1),
    ("Timpani are…", "Tuned drums", ["Flutes", "Tuned drums", "Harps", "Organs"], 2),
    ("A cello is a member of which family?", "Strings", ["Brass", "Strings", "Percussion", "Woodwind"], 1),
    ("The 'high' voice type in classical singing is often the…", "Soprano", ["Bass", "Soprano", "Baritone", "Tenor only"], 1),
    ("A baritone is a…", "Male voice type", ["Drum", "Male voice type", "Dance", "Paint"], 1),
    ("Broadway is a theatre district in…", "New York", ["London", "New York", "Chicago", "Los Angeles"], 1),
    ("The West End is a theatre district in…", "London", ["New York", "London", "Paris", "Dublin"], 1),
    ("A Tony Award is given for…", "American theatre", ["Film only", "American theatre", "Television only", "Jazz only"], 2),
    ("An Oscar is given for…", "Film", ["Stage only", "Film", "Radio only", "Painting"], 1),
    ("An Emmy is given for…", "Television", ["Film only", "Television", "Books", "Architecture"], 1),
    ("A Grammy is given for…", "Music recordings", ["Dance only", "Music recordings", "Sculpture", "Fashion only"], 1),
    ("A Pulitzer can be awarded for…", "Journalism, letters, and music, among others", ["Olympics only", "Journalism, letters, and music, among others", "Cooking only", "Fashion only"], 2),
    ("The Nobel Prize in Literature is awarded from…", "Sweden (the Swedish Academy)", ["France", "Sweden (the Swedish Academy)", "the U.S. Congress", "the Vatican"], 2),
    ("Citizen Kane is a film directed by…", "Orson Welles", ["Hitchcock", "Orson Welles", "Ford", "Capra"], 2),
    ("Psycho is a film directed by…", "Alfred Hitchcock", ["Welles", "Alfred Hitchcock", "Kubrick", "Spielberg"], 2),
    ("2001: A Space Odyssey is a film directed by…", "Stanley Kubrick", ["Lucas", "Stanley Kubrick", "Scott", "Cameron"], 2),
    ("The Godfather is a film directed by…", "Francis Ford Coppola", ["Scorsese", "Francis Ford Coppola", "Coppola the younger only", "De Niro"], 2),
    ("Spirited Away is a film from which studio?", "Studio Ghibli", ["Pixar", "Studio Ghibli", "Disney only", "Aardman"], 2),
    ("A storyboard is used to plan…", "Shots in a film or animation", ["a symphony only", "Shots in a film or animation", "a tax return", "a recipe only"], 1),
    ("CGI in film means…", "Computer-generated imagery", ["Camera-grip intern", "Computer-generated imagery", "Color grade inverse", "Casting guild index"], 1),
    ("A libretto is the text of an…", "Opera (or similar)", ["Oil painting", "Opera (or similar)", "Statue", "Symphony without words"], 2),
    ("A motif is a…", "Recurring idea or figure", ["One-off joke only", "Recurring idea or figure", "Frame", "Credit roll"], 2),
    ("Alliteration is the repetition of…", "Initial sounds", ["End rhymes only", "Initial sounds", "Whole stanzas", "Stage directions"], 2),
    ("Onomatopoeia is a word that…", "Imitates a sound", ["Means the opposite", "Imitates a sound", "Has no vowels", "Is always Latin"], 1),
    ("A metaphor says one thing is another; a simile uses…", "like or as", ["only capitals", "like or as", "stage Latin", "footnotes"], 1),
    ("The Renaissance began in which peninsula, famously?", "Italy", ["Iberia", "Italy", "Scandinavia", "Japan"], 1),
    ("The Harlem Renaissance was a flowering of…", "Black arts and letters in New York", ["French cooking", "Black arts and letters in New York", "Dutch painting", "English gardens"], 2),
    ("Bauhaus was a school of…", "Design and architecture", ["Opera only", "Design and architecture", "Ceramics only in China", "Epic poetry"], 2),
    ("Art Deco is a style of…", "the 1920s–30s, geometric and luxe", ["medieval icon painting", "the 1920s–30s, geometric and luxe", "cave painting", "rococo only"], 2),
    ("Gothic cathedrals are known for…", "Pointed arches and stained glass", ["Mud brick only", "Pointed arches and stained glass", "Steel and glass boxes", "Pagodas"], 1),
    ("A flying buttress is a feature of…", "Gothic architecture", ["Greek temples", "Gothic architecture", "Japanese teahouses", "Adobe pueblos"], 2),
    ("The Parthenon is a temple of…", "Athena, on the Acropolis", ["Mars in Rome", "Athena, on the Acropolis", "Odin in Uppsala", "Ra in Karnak"], 2),
    ("A mosaic is an image made of…", "Small tesserae", ["one huge canvas", "Small tesserae", "welded steel only", "neon only"], 1),
    ("Calligraphy is the art of…", "Beautiful writing", ["Loud singing", "Beautiful writing", "Fast running", "Deep frying"], 1),
    ("A sonnet cycle is a…", "Sequence of sonnets", ["Single haiku", "Sequence of sonnets", "Jazz standard", "Film trilogy"], 3),
    ("Iambic means a poetic foot of…", "unstressed then stressed", ["two stresses", "unstressed then stressed", "three unstressed", "no stress"], 3),
]
for prompt, ans, ch, d in ARTS_FACTS:
    B.add("arts", prompt, ch, ans, d)

# extra hard sports / local to thicken the top
HARD = [
    ("sports", "How many dimples are on a typical modern golf ball, roughly?", "300–400", ["50–80", "150–200", "300–400", "1,000+"], 3),
    ("sports", "A cricket pitch is how many yards between wickets?", "22", ["18", "20", "22", "26"], 3),
    ("sports", "The Fosbury Flop is a technique in which event?", "High jump", ["Pole vault", "High jump", "Long jump", "Hurdles"], 3),
    ("sports", "A 'albatross' in golf is…", "Three under par", ["Two under par", "Three under par", "Four under par", "A hole-in-one always"], 3),
    ("sports", "The Iditarod is a race of…", "Sled dogs", ["Camels", "Sled dogs", "Horses on ice", "Snowmobiles only"], 2),
    ("local", "The Prime Meridian was agreed internationally in which year, at Washington?", "1884", ["1776", "1815", "1884", "1945"], 3),
    ("local", "A nautical mile is based on…", "One minute of latitude", ["One mile of railroad", "One minute of latitude", "One knot of rope", "One furlong"], 3),
    ("local", "How many degrees are in a circle of longitude around Earth?", "360", ["180", "360", "90", "24"], 1),
    ("local", "The tropic lines sit near which latitudes?", "23.5°", ["0°", "23.5°", "45°", "66.5°"], 3),
    ("local", "The Arctic Circle sits near which latitude?", "66.5°N", ["23.5°N", "45°N", "66.5°N", "90° only as a circle"], 3),
    ("political", "The Federalist Papers were written by Hamilton, Madison, and…", "Jay", ["Jefferson", "Jay", "Adams", "Monroe"], 3),
    ("political", "How many articles are in the original U.S. Constitution (before amendments)?", "7", ["3", "7", "10", "27"], 3),
    ("political", "The 17th Amendment provided for…", "Direct election of senators", ["the income tax", "Direct election of senators", "Prohibition", "Women's vote"], 3),
    ("food", "Escoffier's five mother sauces include béchamel, velouté, espagnole, tomato, and…", "Hollandaise", ["Pesto", "Hollandaise", "Salsa", "Gravy"], 3),
    ("food", "A 'mother' in vinegar making is a…", "Culture of bacteria", ["Wooden cask", "Culture of bacteria", "Fruit fly", "Grape stem"], 3),
    ("arts", "The well-tempered clavier is a set of works by…", "Bach", ["Mozart", "Bach", "Chopin", "Liszt"], 3),
    ("arts", "Serialism in 20th-century music is associated with…", "Schoenberg", ["Vivaldi", "Schoenberg", "Haydn", "Gottschalk"], 3),
    ("arts", "The Bayeux Tapestry depicts which conquest?", "the Norman Conquest of England", ["the Crusades only", "the Norman Conquest of England", "the fall of Rome", "the Armada"], 3),
]
for cat, prompt, ans, ch, d in HARD:
    B.add(cat, prompt, ch, ans, d)

# fill remaining easy sports with league/trophy facts
LEAGUES = [
    ("The Premier League is the top soccer division in…", "England", ["Spain", "England", "Italy", "Germany"], 1),
    ("La Liga is the top soccer division in…", "Spain", ["France", "Spain", "Portugal", "Mexico"], 1),
    ("Serie A is the top soccer division in…", "Italy", ["Spain", "Italy", "France", "Greece"], 1),
    ("Bundesliga is the top soccer division in…", "Germany", ["Austria", "Germany", "Switzerland", "the Netherlands"], 1),
    ("Ligue 1 is the top soccer division in…", "France", ["Belgium", "France", "Switzerland", "Canada"], 1),
    ("MLS is a soccer league in…", "the United States and Canada", ["only Mexico", "the United States and Canada", "only England", "Australia"], 1),
    ("The NWSL is a league in which sport?", "Women's soccer", ["Women's basketball", "Women's soccer", "Softball", "Hockey"], 2),
    ("The WNBA is a league in which sport?", "Women's basketball", ["Women's soccer", "Women's basketball", "Tennis", "Volleyball"], 1),
    ("The NCAA governs…", "U.S. college sports", ["the NFL", "U.S. college sports", "FIFA", "the Olympics only"], 1),
    ("The Olympics' summer and winter editions are staggered so that a Games occurs every…", "2 years (alternating)", ["year", "2 years (alternating)", "5 years", "decade"], 2),
]
for prompt, ans, ch, d in LEAGUES:
    B.add("sports", prompt, ch, ans, d)

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from trivia_expand import apply

apply(B)

# emit
out_path = Path("/workspace/src/game/banks/general.ts")
out_path.parent.mkdir(parents=True, exist_ok=True)
cats = ["sports", "local", "political", "food", "arts"]
lines = [
    'import { q } from "../quiz";',
    'import type { TriviaCat, TriviaQ } from "../types";',
    "",
    "export const GENERAL_BANK: Partial<Record<TriviaCat, TriviaQ[]>> = {",
]
counts = {}
diffs = defaultdict(int)
for cat in cats:
    rows = B.rows[cat]
    counts[cat] = len(rows)
    lines.append(f"  {cat}: [")
    for prompt, choices, answer, diff in rows:
        diffs[diff] += 1
        ch = ", ".join(js(c) for c in choices)
        lines.append(f"    q({js(prompt)}, [{ch}], {js(answer)}, {diff}),")
    lines.append("  ],")
lines.append("};")
lines.append("")
out_path.write_text("\n".join(lines) + "\n")
print("wrote", out_path)
print("per cat", dict(counts), "sum", sum(counts.values()))
print("by diff", dict(diffs))
print("unique prompts", len(B.seen))
if sum(counts.values()) < 1000:
    raise SystemExit("under 1000")
