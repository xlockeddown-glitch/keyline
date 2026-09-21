#!/usr/bin/env python3
"""Emit math_more, science_more, history_more, nature_more, cities extra banks."""
from __future__ import annotations

import json
import random
from collections import defaultdict
from pathlib import Path

RNG = random.Random(20260919)
ROOT = Path("/workspace")
OUT = ROOT / "src/game/banks"


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


class Rows:
    def __init__(self) -> None:
        self.rows: list[tuple[str, list[str], str, int]] = []
        self.seen: set[str] = set()

    def add(self, prompt: str, choices: list[str], answer: str, diff: int) -> None:
        if prompt in self.seen:
            return
        if leaks(prompt, answer):
            return
        if answer not in choices or len(choices) != 4 or len(set(choices)) != 4:
            return
        self.seen.add(prompt)
        self.rows.append((prompt, choices, answer, diff))

    def mc(self, prompt: str, answer: str, pool: list[str], diff: int) -> None:
        others = [x for x in pool if x != answer]
        if len(others) < 3:
            return
        RNG.shuffle(others)
        ch = [answer, others[0], others[1], others[2]]
        RNG.shuffle(ch)
        self.add(prompt, ch, answer, diff)


def nearby(ans: int, spread: list[int] | None = None) -> list[str]:
    spread = spread or [-10, -2, -1, 1, 2, 10, 5, -5, ans, ans * 2 if ans else 1]
    out: list[int] = []
    for d in spread:
        v = ans + d if abs(d) <= 20 or d in (-10, 10, 5, -5) else d
        if v == ans:
            continue
        if v not in out:
            out.append(v)
        if len(out) >= 8:
            break
    # extra common mistakes
    for v in (ans + 1, ans - 1, ans + 10, max(0, ans - 10), ans * 2, abs(ans - 2)):
        if v != ans and v not in out:
            out.append(v)
    RNG.shuffle(out)
    picks = out[:3]
    while len(picks) < 3:
        n = ans + RNG.choice([-12, -8, -4, 3, 4, 6, 7, 9, 11, 12])
        if n != ans and n not in picks:
            picks.append(n)
    return [str(x) for x in picks]


def emit_array(path: Path, export: str, rows: list[tuple[str, list[str], str, int]]) -> None:
    lines = [
        'import { q } from "../quiz";',
        'import type { TriviaQ } from "../types";',
        "",
        f"export const {export}: TriviaQ[] = [",
    ]
    for prompt, choices, answer, diff in rows:
        ch = ", ".join(js(c) for c in choices)
        lines.append(f"  q({js(prompt)}, [{ch}], {js(answer)}, {diff}),")
    lines.append("];")
    lines.append("")
    path.write_text("\n".join(lines) + "\n")
    print("wrote", path, "n=", len(rows))


def gen_math() -> None:
    R = Rows()

    def plate(prompt: str, ans: int | str, diff: int, extra: list[str] | None = None) -> None:
        if isinstance(ans, int):
            ch = [str(ans)] + nearby(ans)
        else:
            pool = extra or []
            if ans not in pool:
                pool = [ans] + pool
            others = [x for x in pool if x != ans]
            if len(others) < 3:
                return
            RNG.shuffle(others)
            ch = [ans, others[0], others[1], others[2]]
        RNG.shuffle(ch)
        if len(set(ch)) != 4:
            return
        R.add(prompt, [str(x) for x in ch], str(ans), diff)

    # easy arithmetic
    for a in range(0, 21):
        for b in range(0, 21):
            if a + b == 0 and a == 0:
                continue
            plate(f"What is {a} + {b}?", a + b, 1)
            if a >= b:
                plate(f"What is {a} − {b}?", a - b, 1)
            if a <= 12 and b <= 12:
                plate(f"What is {a} × {b}?", a * b, 1 if a * b <= 81 else 2)
            if b and a % b == 0 and a // b <= 20:
                plate(f"What is {a} ÷ {b}?", a // b, 1)

    # two-digit
    for a in range(21, 80, 3):
        for b in (4, 5, 6, 7, 8, 9, 11, 12, 15, 16, 25):
            plate(f"What is {a} + {b}?", a + b, 2)
            if a > b:
                plate(f"What is {a} − {b}?", a - b, 2)
            if a <= 40 and b <= 12:
                plate(f"What is {a} × {b}?", a * b, 2)

    for a in range(22, 70, 2):
        for b in (13, 14, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28):
            plate(f"What is {a} + {b}?", a + b, 2)
            if a > b:
                plate(f"What is {a} − {b}?", a - b, 2)

    for n in range(2, 16):
        plate(f"What is {n}²?", n * n, 1 if n <= 10 else 2)
    for n, p, d in [(2, 4, 1), (2, 5, 2), (2, 6, 2), (2, 7, 2), (2, 8, 2), (2, 9, 3), (2, 10, 3),
                    (3, 3, 1), (3, 4, 2), (3, 5, 3), (4, 3, 2), (5, 3, 2), (10, 3, 1), (10, 4, 1)]:
        plate(f"What is {n}^{p}?", n ** p, d)

    for n in (8, 10, 12, 16, 18, 20, 24, 30, 36, 40, 48, 50, 60, 80, 100):
        plate(f"Half of {n} is…", n // 2, 1)
        if n % 4 == 0:
            plate(f"A quarter of {n} is…", n // 4, 1)

    for pct, whole in [(10, 50), (10, 80), (10, 90), (10, 200), (20, 50), (20, 80), (20, 150),
                       (25, 80), (25, 120), (5, 80), (5, 200), (15, 60), (15, 200), (30, 90),
                       (40, 50), (50, 90), (75, 80), (12, 50), (8, 25)]:
        ans = pct * whole // 100
        if pct * whole % 100 == 0:
            plate(f"{pct}% of {whole} is…", ans, 1 if pct in (10, 50, 25) else 2)

    for a, b, c in [(2, 3, 11), (2, 5, 17), (3, 4, 19), (4, 1, 21), (5, 5, 30), (3, 6, 21),
                    (2, 8, 20), (6, 2, 20), (3, 9, 24), (4, 8, 28), (5, 10, 35), (7, 3, 24)]:
        # ax + b = c
        if (c - b) % a == 0:
            x = (c - b) // a
            plate(f"If {a}x + {b} = {c}, x is…", x, 2)

    for w, h in [(2, 3), (3, 4), (3, 5), (4, 5), (4, 6), (5, 6), (5, 8), (6, 7), (6, 9), (7, 8), (8, 10), (9, 12)]:
        plate(f"The area of a {w}-by-{h} rectangle is…", w * h, 1 if w * h <= 30 else 2)
        plate(f"The perimeter of a {w}-by-{h} rectangle is…", 2 * (w + h), 1 if w + h <= 12 else 2)

    for s in (3, 4, 5, 6, 7, 8, 9, 10, 12):
        plate(f"The area of a {s}-by-{s} square is…", s * s, 1 if s <= 6 else 2)
        plate(f"The perimeter of a {s}-by-{s} square is…", 4 * s, 1)

    for a, b, hyp in [(3, 4, 5), (5, 12, 13), (6, 8, 10), (8, 15, 17), (7, 24, 25), (9, 12, 15)]:
        plate(f"A right triangle with legs {a} and {b} has hypotenuse…", hyp, 2 if hyp <= 13 else 3)

    for nums in [(2, 4, 6), (1, 3, 5), (4, 4, 4), (10, 20, 30), (5, 10, 15), (7, 8, 9), (0, 5, 10), (2, 8, 14)]:
        plate(f"The mean of {nums[0]}, {nums[1]}, and {nums[2]} is…", sum(nums) // 3, 2)

    for seq, nxt, d in [
        ((2, 4, 6, 8), 10, 1), ((5, 10, 15, 20), 25, 1), ((3, 6, 9, 12), 15, 1),
        ((1, 2, 4, 8), 16, 2), ((1, 3, 9, 27), 81, 3), ((1, 4, 9, 16), 25, 2),
        ((2, 3, 5, 8), 13, 2), ((10, 20, 40, 80), 160, 2), ((100, 90, 80, 70), 60, 1),
        ((1, 1, 2, 3), 5, 2),
    ]:
        plate(f"The next number in {', '.join(map(str, seq))} is…", nxt, d)

    for n in (2, 3, 4, 5, 6, 8, 9, 10, 12):
        plate(f"How many sides does a regular polygon with interior angle hint — wait, a shape named for {n} sides: how many sides?", n, 1)
    # those last prompts are bad/leaky. skip by not using them - actually they leak. Don't add awkward ones.
    # Remove the bad ones by not including that loop's prompts in seen... they're already added.
    # I'll filter them out:
    R.rows = [r for r in R.rows if "wait" not in r[0]]
    R.seen = {r[0] for r in R.rows}

    NAMED = [
        ("A dozen is how many?", "12", ["10", "12", "16", "20"], 1),
        ("A baker's dozen is how many?", "13", ["11", "12", "13", "14"], 2),
        ("A score is how many?", "20", ["10", "12", "20", "50"], 2),
        ("A gross is how many?", "144", ["12", "100", "120", "144"], 3),
        ("How many degrees in a right angle?", "90", ["45", "60", "90", "180"], 1),
        ("How many degrees in a triangle's interior angles, sum?", "180", ["90", "180", "270", "360"], 1),
        ("How many degrees in a quadrilateral's interior angles, sum?", "360", ["180", "270", "360", "540"], 2),
        ("How many faces does a cube have?", "6", ["4", "6", "8", "12"], 1),
        ("How many edges does a cube have?", "12", ["6", "8", "12", "16"], 2),
        ("How many vertices does a cube have?", "8", ["4", "6", "8", "12"], 2),
        ("How many faces does a tetrahedron have?", "4", ["3", "4", "5", "6"], 2),
        ("π is approximately…", "3.14", ["2.72", "3.14", "1.62", "1.41"], 1),
        ("e, the base of natural logs, is approximately…", "2.72", ["3.14", "2.72", "1.62", "1.41"], 2),
        ("The golden ratio is approximately…", "1.62", ["3.14", "2.72", "1.62", "0.50"], 3),
        ("√2 is approximately…", "1.41", ["1.41", "1.73", "2.24", "3.14"], 2),
        ("The square root of three is approximately…", "1.73", ["1.41", "1.73", "2.24", "2.72"], 2),
        ("How many millimeters in a meter?", "1000", ["10", "100", "1000", "10000"], 1),
        ("How many grams in a kilogram?", "1000", ["10", "100", "1000", "16"], 1),
        ("How many milliliters in a liter?", "1000", ["10", "100", "1000", "128"], 1),
        ("How many pints in a quart (US)?", "2", ["2", "4", "8", "16"], 2),
        ("How many quarts in a gallon (US)?", "4", ["2", "4", "8", "16"], 1),
        ("How many cups in a pint (US)?", "2", ["2", "4", "8", "16"], 2),
        ("How many teaspoons in a tablespoon (US)?", "3", ["2", "3", "4", "8"], 2),
        ("How many seconds in an hour?", "3600", ["60", "360", "3600", "86400"], 2),
        ("How many minutes in a day?", "1440", ["24", "60", "1440", "3600"], 3),
        ("How many weeks in a common year, roughly?", "52", ["12", "48", "52", "365"], 1),
        ("Prime numbers are divisible only by…", "1 and themselves", ["even numbers", "1 and themselves", "10", "their square"], 1),
        ("Which value is prime?", "17", ["15", "16", "17", "18"], 1),
        ("Select the prime.", "19", ["20", "21", "22", "19"], 1),
        ("Pick the prime number.", "23", ["21", "22", "24", "23"], 1),
        ("Which of these is composite, not prime?", "27", ["23", "29", "31", "27"], 2),
        ("The smallest prime is…", "2", ["0", "1", "2", "3"], 1),
        ("The only even prime is…", "2", ["0", "2", "4", "6"], 1),
        ("Factorial 4! equals…", "24", ["8", "12", "16", "24"], 2),
        ("Factorial 5! equals…", "120", ["25", "60", "100", "120"], 2),
        ("Factorial 6! equals…", "720", ["120", "360", "720", "840"], 3),
        ("0! is defined as…", "1", ["0", "1", "undefined in all systems", "10"], 3),
        ("The slope of y = 3x + 2 is…", "3", ["2", "3", "5", "0"], 2),
        ("The y-intercept of y = 3x + 2 is…", "2", ["3", "2", "0", "5"], 2),
        ("The slope of a horizontal line is…", "0", ["0", "1", "undefined", "infinity as a number"], 2),
        ("The slope of a vertical line is…", "undefined", ["0", "1", "undefined", "−1"], 2),
        ("Distance = rate × …", "time", ["mass", "time", "area", "slope"], 1),
        ("Area of a circle is…", "πr²", ["2πr", "πr²", "πd", "4/3πr³"], 2),
        ("Circumference of a circle is…", "2πr", ["πr²", "2πr", "4/3πr³", "πr"], 2),
        ("Volume of a cube of side s is…", "s³", ["s²", "6s", "s³", "4s"], 2),
        ("Volume of a rectangular box is…", "length × width × height", ["length + width + height", "length × width × height", "2(l+w+h)", "only base area"], 1),
        ("An equilateral triangle has…", "three equal sides", ["two equal sides", "three equal sides", "no equal sides", "one right angle always"], 1),
        ("A scalene triangle has…", "no equal sides", ["two equal sides", "three equal sides", "no equal sides", "four sides"], 2),
        ("Complementary angles sum to…", "90°", ["45°", "90°", "180°", "360°"], 2),
        ("Supplementary angles sum to…", "180°", ["90°", "180°", "270°", "360°"], 2),
        ("1/2 + 1/4 = …", "3/4", ["1/6", "1/4", "2/4", "3/4"], 1),
        ("1/2 + 1/3 = …", "5/6", ["2/5", "1/5", "5/6", "2/6"], 2),
        ("3/4 − 1/2 = …", "1/4", ["1/4", "1/2", "2/4", "1"], 1),
        ("2/3 of 12 is…", "8", ["4", "6", "8", "9"], 1),
        ("3/5 of 20 is…", "12", ["8", "10", "12", "15"], 2),
        ("0.5 × 0.5 = …", "0.25", ["0.05", "0.10", "0.25", "1.00"], 2),
        ("1.5 × 2 = …", "3", ["2.5", "3", "3.5", "4"], 1),
        ("Convert 3/8 to a decimal.", "0.375", ["0.25", "0.3", "0.375", "0.38"], 3),
        ("Convert 1/8 to a decimal.", "0.125", ["0.12", "0.125", "0.18", "0.8"], 2),
        ("Convert 2/5 to a decimal.", "0.4", ["0.2", "0.25", "0.4", "0.5"], 2),
        ("The median of 1, 9, 3, 7, 5 is…", "5", ["1", "3", "5", "7"], 2),
        ("The mode of 2, 2, 3, 5, 2 is…", "2", ["2", "3", "5", "3.5"], 2),
        ("The range of 3, 9, 4 is…", "6", ["3", "4", "6", "9"], 2),
        ("If a map scale is 1:100,000, 1 cm on the map is how many km on the ground?", "1", ["0.1", "1", "10", "100"], 3),
        ("Absolute value of −7 is…", "7", ["−7", "0", "7", "14"], 1),
        ("−3 × −4 = …", "12", ["−12", "7", "12", "−7"], 2),
        ("−8 + 3 = …", "−5", ["−11", "−5", "5", "11"], 2),
        ("A number is divisible by 3 if…", "the sum of its digits is divisible by 3", ["it is even", "the sum of its digits is divisible by 3", "it ends in 0", "it ends in 5"], 2),
        ("A number is divisible by 5 if it ends in…", "0 or 5", ["2 or 4", "0 or 5", "3 or 6", "1 or 9"], 1),
        ("A number is divisible by 10 if it ends in…", "0", ["5", "0", "2", "even digits only"], 1),
        ("GCD of 12 and 18 is…", "6", ["2", "3", "6", "36"], 2),
        ("LCM of 4 and 6 is…", "12", ["2", "10", "12", "24"], 2),
        ("GCD of 8 and 12 is…", "4", ["2", "4", "8", "24"], 2),
        ("LCM of 3 and 5 is…", "15", ["8", "15", "30", "1"], 2),
        ("A pentagon's interior angles sum to…", "540°", ["360°", "540°", "720°", "180°"], 3),
        ("A hexagon's interior angles sum to…", "720°", ["540°", "720°", "900°", "360°"], 3),
        ("How many diagonals does a square have?", "2", ["1", "2", "4", "6"], 2),
        ("Binary 1010 as decimal is…", "10", ["5", "8", "10", "12"], 3),
        ("Binary 1111 as decimal is…", "15", ["7", "8", "14", "15"], 3),
        ("How many bits in a byte, classically?", "8", ["4", "8", "16", "32"], 2),
        ("1,000,000 is 10 to the…", "6th", ["3rd", "6th", "9th", "12th"], 2),
        ("A million has how many zeros (in 1,000,000)?", "6", ["3", "5", "6", "9"], 1),
        ("A billion (short scale) has how many zeros?", "9", ["6", "9", "12", "15"], 2),
        ("Scientific notation for 3,000 is…", "3 × 10³", ["3 × 10²", "3 × 10³", "3 × 10⁶", "30 × 10"], 2),
        ("log₁₀(1000) is…", "3", ["2", "3", "10", "100"], 3),
        ("log₁₀(100) is…", "2", ["1", "2", "10", "50"], 2),
        ("sin(90°) is…", "1", ["0", "0.5", "1", "√2/2"], 3),
        ("sin(0°) is…", "0", ["0", "1", "0.5", "undefined"], 2),
        ("cos(0°) is…", "1", ["0", "1", "−1", "0.5"], 2),
        ("tan(45°) is…", "1", ["0", "0.5", "1", "undefined"], 3),
        ("The sum of the first n positives is n(n+1)/2. For n=10 that is…", "55", ["45", "50", "55", "100"], 3),
        ("Fibonacci after 8, 13 is…", "21", ["18", "20", "21", "24"], 2),
        ("A coin has how many faces?", "2", ["1", "2", "4", "6"], 1),
        ("A standard die has how many faces?", "6", ["4", "6", "8", "12"], 1),
        ("Probability of rolling a 6 on a fair die is…", "1/6", ["1/2", "1/4", "1/6", "1/12"], 2),
        ("Probability of heads on a fair coin is…", "1/2", ["1/3", "1/2", "1/4", "1"], 1),
        ("If you flip two fair coins, P(two heads) is…", "1/4", ["1/2", "1/3", "1/4", "1/8"], 2),
        ("Convert 2 hours to minutes.", "120", ["60", "90", "120", "200"], 1),
        ("Convert 3.5 hours to minutes.", "210", ["180", "200", "210", "240"], 2),
        ("Convert 90 minutes to hours.", "1.5", ["1", "1.5", "2", "9"], 1),
        ("A 20% tip on $40 is…", "$8", ["$4", "$6", "$8", "$10"], 2),
        ("A 15% tip on $80 is…", "$12", ["$8", "$10", "$12", "$15"], 2),
        ("If a $50 item is 10% off, the price is…", "$45", ["$40", "$45", "$48", "$55"], 1),
        ("Simple interest I = Prt. $100 at 5% for 2 years is…", "$10", ["$5", "$7", "$10", "$15"], 3),
        ("Speed 60 mph for 2 hours covers…", "120 miles", ["30 miles", "60 miles", "90 miles", "120 miles"], 1),
        ("Speed 50 mph for 30 minutes covers…", "25 miles", ["15 miles", "25 miles", "30 miles", "50 miles"], 2),
        ("A clock's hour hand moves how many degrees per hour?", "30", ["15", "30", "60", "90"], 3),
        ("How many degrees between 12 and 3 on a clock?", "90", ["30", "60", "90", "120"], 1),
        ("Roman numeral X is…", "10", ["5", "10", "50", "100"], 1),
        ("Roman numeral L is…", "50", ["10", "50", "100", "500"], 2),
        ("Roman numeral C is…", "100", ["50", "100", "500", "1000"], 2),
        ("Roman numeral D is…", "500", ["100", "500", "1000", "50"], 3),
        ("Roman numeral M is…", "1000", ["500", "1000", "2000", "100"], 2),
        ("Roman numeral IV is…", "4", ["3", "4", "6", "14"], 1),
        ("Roman numeral IX is…", "9", ["8", "9", "11", "19"], 1),
        ("Roman numeral XL is…", "40", ["39", "40", "60", "90"], 2),
        ("Roman numeral XC is…", "90", ["40", "90", "110", "190"], 3),
    ]
    for prompt, ans, ch, d in NAMED:
        R.add(prompt, ch, ans, d)

    emit_array(OUT / "math_more.ts", "MATH_MORE", R.rows)


def gen_science() -> None:
    R = Rows()
    ELEMENTS = [
        ("H", "Hydrogen", 1), ("He", "Helium", 2), ("Li", "Lithium", 3), ("Be", "Beryllium", 4),
        ("B", "Boron", 5), ("C", "Carbon", 6), ("N", "Nitrogen", 7), ("O", "Oxygen", 8),
        ("F", "Fluorine", 9), ("Ne", "Neon", 10), ("Na", "Sodium", 11), ("Mg", "Magnesium", 12),
        ("Al", "Aluminum", 13), ("Si", "Silicon", 14), ("P", "Phosphorus", 15), ("S", "Sulfur", 16),
        ("Cl", "Chlorine", 17), ("Ar", "Argon", 18), ("K", "Potassium", 19), ("Ca", "Calcium", 20),
        ("Fe", "Iron", 26), ("Cu", "Copper", 29), ("Zn", "Zinc", 30), ("Ag", "Silver", 47),
        ("Au", "Gold", 79), ("Hg", "Mercury", 80), ("Pb", "Lead", 82), ("U", "Uranium", 92),
        ("Sn", "Tin", 50), ("I", "Iodine", 53), ("W", "Tungsten", 74), ("Pt", "Platinum", 78),
        ("Ni", "Nickel", 28), ("Co", "Cobalt", 27), ("Mn", "Manganese", 25), ("Cr", "Chromium", 24),
        ("Ti", "Titanium", 22),
    ]
    # clean dupes
    seen_el = set()
    els = []
    for row in ELEMENTS:
        if not isinstance(row, tuple) or len(row) != 3:
            continue
        if row[0] in seen_el:
            continue
        seen_el.add(row[0])
        els.append(row)
    names = [n for _, n, _ in els]
    syms = [s for s, _, _ in els]
    for sym, name, num in els:
        R.mc(f"The chemical symbol {sym} stands for…", name, names, 1 if num <= 20 else 2)
        R.mc(f"{name}'s atomic number is…", str(num), [str(num), str(num + 1), str(max(1, num - 1)), str(num + 6)], 2 if num > 10 else 1)

    PLANETS = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
    for i, p in enumerate(PLANETS, 1):
        R.mc(f"Which planet is {['closest to the Sun', 'second from the Sun', 'third from the Sun', 'fourth from the Sun', 'fifth from the Sun', 'sixth from the Sun', 'seventh from the Sun', 'eighth from the Sun'][i-1]}?", p, PLANETS, 1 if i <= 4 else 2)

    FACTS = [
        ("The SI unit of force is the…", "newton", ["joule", "watt", "newton", "pascal"], 2),
        ("The SI unit of energy is the…", "joule", ["newton", "joule", "pascal", "ampere"], 2),
        ("The SI unit of power is the…", "watt", ["joule", "watt", "volt", "ohm"], 2),
        ("The SI unit of electric current is the…", "ampere", ["volt", "ohm", "ampere", "watt"], 2),
        ("The SI unit of electric potential is the…", "volt", ["ampere", "volt", "ohm", "coulomb"], 2),
        ("The SI unit of resistance is the…", "ohm", ["volt", "ampere", "ohm", "farad"], 2),
        ("The SI unit of frequency is the…", "hertz", ["watt", "hertz", "lux", "becquerel"], 2),
        ("The SI unit of pressure is the…", "pascal", ["bar only", "pascal", "torr only", "atmosphere only"], 2),
        ("The SI unit of temperature is the…", "kelvin", ["celsius only", "kelvin", "fahrenheit", "rankine"], 2),
        ("Ohm's law is often written…", "V = IR", ["F = ma", "V = IR", "E = mc²", "P = ρgh"], 2),
        ("Kinetic energy of a mass m at speed v is…", "½mv²", ["mv", "½mv²", "mgh only", "Fd only"], 3),
        ("Gravitational potential energy near Earth is approximately…", "mgh", ["½mv²", "mgh", "mc²", "qV"], 2),
        ("Momentum is…", "mass × velocity", ["mass × acceleration", "mass × velocity", "force × time only always", "energy / time"], 2),
        ("Acceleration is change of…", "velocity per time", ["distance only", "velocity per time", "mass", "charge"], 1),
        ("Velocity has both speed and…", "direction", ["color", "direction", "temperature", "charge"], 1),
        ("A vector has magnitude and…", "direction", ["only size", "direction", "only unit", "only sign of charge"], 1),
        ("A scalar has…", "magnitude only (no direction)", ["only direction", "magnitude only (no direction)", "always a unit vector", "always two axes"], 2),
        ("Newton's first law is about…", "inertia", ["action-reaction only", "inertia", "F = ma as a slogan only of the second", "gravity only"], 2),
        ("Newton's third law says forces come in…", "equal and opposite pairs", ["triples", "equal and opposite pairs", "random sets", "only attractions"], 1),
        ("Universal gravitation says the force goes as…", "1/r²", ["1/r", "1/r²", "r²", "r"], 3),
        ("c in E = mc² is the…", "speed of light", ["speed of sound", "speed of light", "charge of an electron", "a heat capacity"], 1),
        ("A photon is a…", "quantum of light", ["nucleus", "quantum of light", "type of rock", "cell"], 2),
        ("An isotope has the same number of protons and a different number of…", "neutrons", ["electrons always as the definition", "neutrons", "photons", "quarks of the atom's name"], 2),
        ("Atomic number is the number of…", "protons", ["neutrons", "protons", "nucleons always as a synonym", "electrons in ions always"], 1),
        ("Mass number is protons plus…", "neutrons", ["electrons", "neutrons", "photons", "neutrinos"], 2),
        ("A covalent bond shares…", "electrons", ["protons", "electrons", "neutrons", "photons"], 1),
        ("An ionic bond is attraction of…", "oppositely charged ions", ["two nuclei only", "oppositely charged ions", "two photons", "two neutrons"], 2),
        ("pH 7 is…", "neutral (in water at standard)", ["strongly acid", "neutral (in water at standard)", "strongly base", "undefined"], 1),
        ("pH 1 is…", "strongly acidic", ["neutral", "strongly acidic", "strongly basic", "a salt only"], 1),
        ("pH 13 is…", "strongly basic", ["strongly acidic", "neutral", "strongly basic", "pure water"], 1),
        ("Acids donate…", "protons (H⁺) in the Brønsted sense", ["electrons only always", "protons (H⁺) in the Brønsted sense", "neutrons", "photons"], 3),
        ("Oxidation is…", "loss of electrons (in the simple redox sense)", ["gain of electrons", "loss of electrons (in the simple redox sense)", "gain of neutrons", "loss of protons only as a name"], 3),
        ("The most abundant gas in dry air is…", "nitrogen", ["oxygen", "nitrogen", "carbon dioxide", "argon"], 1),
        ("Argon is a…", "noble gas", ["halogen", "noble gas", "alkali metal", "metalloid"], 2),
        ("Helium was first noticed in the…", "Sun's spectrum", ["Earth's core first", "Sun's spectrum", "Moon rocks first", "ocean vents first"], 3),
        ("Ozone's formula is…", "O₃", ["O₂", "O₃", "CO₂", "NO₂"], 2),
        ("Dry ice is…", "solid carbon dioxide", ["solid oxygen", "solid carbon dioxide", "solid nitrogen", "frozen water"], 2),
        ("Sublimation is…", "solid to gas", ["liquid to solid", "solid to gas", "gas to liquid", "liquid to gas only"], 2),
        ("Condensation is…", "gas to liquid", ["liquid to gas", "gas to liquid", "solid to gas", "solid to liquid"], 1),
        ("Evaporation is…", "liquid to gas", ["gas to liquid", "liquid to gas", "solid to liquid", "gas to solid"], 1),
        ("Melting is…", "solid to liquid", ["liquid to solid", "solid to liquid", "gas to solid", "liquid to gas"], 1),
        ("Freezing is…", "liquid to solid", ["solid to liquid", "liquid to solid", "gas to liquid", "solid to gas"], 1),
        ("A catalyst…", "speeds a reaction without being consumed", ["is always used up", "speeds a reaction without being consumed", "always slows a reaction", "changes the equilibrium constant in elementary teaching as a must"], 2),
        ("Enzymes are…", "biological catalysts", ["lipids only", "biological catalysts", "only salts", "only metals"], 1),
        ("Proteins are chains of…", "amino acids", ["sugars only", "amino acids", "fatty acids only", "nucleotides only"], 1),
        ("DNA's bases pair A with…", "T", ["C", "G", "T", "U in DNA"], 2),
        ("In RNA, adenine pairs with…", "uracil", ["thymine only", "uracil", "guanine", "cytosine"], 2),
        ("Mitochondria are the cell's…", "powerhouses (ATP)", ["libraries", "powerhouses (ATP)", "walls", "vacuoles only"], 1),
        ("The nucleus of a cell holds…", "most of the DNA", ["only ATP", "most of the DNA", "only fat", "only water"], 1),
        ("Ribosomes make…", "proteins", ["DNA only", "proteins", "lipids only", "ATP only"], 2),
        ("Chlorophyll is green because it…", "reflects green light (absorbs other wavelengths)", ["emits only green photons as a laser", "reflects green light (absorbs other wavelengths)", "is rust", "is gold leaf"], 2),
        ("Stomata on leaves are for…", "gas exchange", ["only climbing", "gas exchange", "only storing starch always", "only color"], 2),
        ("Xylem transports…", "water (and minerals) up from roots", ["sugars only down", "water (and minerals) up from roots", "only oxygen to flowers", "only pollen"], 3),
        ("Phloem transports…", "sugars", ["only water up", "sugars", "only minerals from soil as a one-way xylem job", "only air"], 3),
        ("A vertebrate has a…", "backbone", ["exoskeleton of chitin always", "backbone", "shell of calcium always", "no skeleton"], 1),
        ("Mammals are distinguished in part by…", "hair and milk", ["feathers", "hair and milk", "scales only", "gills as adults always"], 1),
        ("Birds are the living dinosaurs in the…", "theropod line, with feathers", ["amphibian line", "theropod line, with feathers", "fish line only", "mammal line"], 3),
        ("Amphibians typically…", "start in water and often live on land as adults", ["live only in deserts as eggs on sand", "start in water and often live on land as adults", "fly as a rule", "have hair"], 1),
        ("Reptiles are…", "amniotes with typically scaly skin", ["feathered as a rule", "amniotes with typically scaly skin", "always aquatic as larvae like tadpoles", "mammals"], 2),
        ("Insects are…", "hexapod arthropods", ["arachnids", "hexapod arthropods", "crustaceans only", "mollusks"], 2),
        ("Arachnids include…", "spiders, scorpions, mites, ticks", ["beetles", "spiders, scorpions, mites, ticks", "snails", "starfish"], 1),
        ("Crustaceans include…", "crabs, lobsters, shrimp (among others)", ["spiders", "crabs, lobsters, shrimp (among others)", "beetles", "snails"], 1),
        ("Mollusks include…", "snails, clams, squid", ["insects", "snails, clams, squid", "starfish", "sponges only"], 2),
        ("Echinoderms include…", "starfish and sea urchins", ["insects", "starfish and sea urchins", "snails", "jellies only"], 3),
        ("Fungi are more closely related to…", "animals than to plants", ["plants than to animals", "animals than to plants", "bacteria than to either", "viruses"], 3),
        ("A virus is…", "an obligate infectious particle, not a cell", ["a bacterium always", "an obligate infectious particle, not a cell", "a fungus", "a plant"], 2),
        ("Antibiotics target…", "bacteria (not viruses, as a rule)", ["viruses as a rule", "bacteria (not viruses, as a rule)", "broken bones", "only cancer"], 2),
        ("Vaccines train the…", "immune system", ["liver to make insulin only", "immune system", "bones to grow only", "hair"], 1),
        ("Insulin is made in the…", "pancreas", ["liver as the only source", "pancreas", "spleen", "thyroid"], 2),
        ("The thyroid sits in the…", "neck", ["abdomen", "neck", "foot", "skull only as a gland of the brain"], 1),
        ("Adrenaline is produced by the…", "adrenal glands", ["thyroid", "adrenal glands", "pineal only", "thymus only"], 2),
        ("The cerebrum is the…", "large thinking part of the brain", ["heart", "large thinking part of the brain", "liver", "kidney"], 1),
        ("The cerebellum helps…", "coordinate movement", ["filter blood", "coordinate movement", "make insulin", "pump blood"], 2),
        ("The femur is the…", "thigh bone", ["shin", "thigh bone", "upper arm", "collarbone"], 1),
        ("The tibia is a bone of the…", "lower leg", ["upper arm", "lower leg", "hand", "skull"], 2),
        ("The humerus is a bone of the…", "upper arm", ["thigh", "upper arm", "foot", "jaw"], 2),
        ("The mandible is the…", "lower jaw", ["upper jaw only as maxilla", "lower jaw", "collarbone", "kneecap"], 2),
        ("The patella is the…", "kneecap", ["elbow", "kneecap", "heel", "wrist"], 1),
        ("Red marrow makes…", "blood cells", ["only fat", "blood cells", "only keratin", "only enamel"], 2),
        ("Plasma is the…", "liquid part of blood", ["cell only", "liquid part of blood", "bone only", "nerve only"], 2),
        ("Platelets help…", "clotting", ["seeing", "clotting", "hearing", "tasting"], 1),
        ("The cornea is at the…", "front of the eye", ["back of the eye as the retina", "front of the eye", "inner ear", "tongue"], 2),
        ("The retina is at the…", "back of the eye", ["front as the cornea", "back of the eye", "eardrum", "nostril"], 2),
        ("The cochlea is in the…", "inner ear", ["eye", "inner ear", "nose", "throat"], 2),
        ("Taste buds are on the…", "tongue (and some nearby tissue)", ["only the inner ear", "tongue (and some nearby tissue)", "only the retina", "only bone"], 1),
        ("The largest internal organ is the…", "liver", ["heart", "liver", "spleen", "pancreas"], 2),
        ("Bile is made in the…", "liver", ["pancreas", "liver", "spleen", "kidney"], 2),
        ("Bile is stored in the…", "gallbladder", ["spleen", "gallbladder", "appendix", "bladder of urine"], 2),
        ("The appendix is attached to the…", "cecum / large intestine", ["stomach", "cecum / large intestine", "liver", "lung"], 3),
        ("Alveoli are tiny sacs in the…", "lungs", ["kidneys", "lungs", "liver", "brain"], 2),
        ("Nephrons are the working units of the…", "kidney", ["lung", "kidney", "heart", "spleen"], 3),
        ("A light-year measures…", "distance", ["time only", "distance", "mass", "temperature"], 2),
        ("A parsec is a unit of…", "distance", ["time", "distance", "luminosity only", "mass"], 3),
        ("Polaris is a star near the…", "north celestial pole", ["south celestial pole", "north celestial pole", "Sun as a planet", "Moon"], 2),
        ("A constellation is a…", "pattern of stars in a region of sky", ["planet", "pattern of stars in a region of sky", "galaxy as a synonym", "comet"], 1),
        ("The Milky Way is a…", "galaxy", ["planet", "galaxy", "star", "comet"], 1),
        ("Andromeda is the nearest large…", "spiral galaxy to us", ["star", "spiral galaxy to us", "planet", "moon of Jupiter"], 2),
        ("A nebula is a…", "cloud of gas and dust", ["black hole always", "cloud of gas and dust", "planet", "asteroid only"], 2),
        ("A supernova is a…", "exploding star", ["quiet star", "exploding star", "planet forming always", "comet"], 1),
        ("A comet is a…", "icy small body that can grow a tail near the Sun", ["rocky planet", "icy small body that can grow a tail near the Sun", "star", "galaxy"], 1),
        ("An asteroid is a…", "rocky small body, mostly in the belt", ["star", "rocky small body, mostly in the belt", "galaxy", "cloud of gas only"], 1),
        ("The asteroid belt lies between…", "Mars and Jupiter", ["Earth and Mars", "Mars and Jupiter", "Jupiter and Saturn", "Neptune and Pluto"], 2),
        ("Io, Europa, Ganymede, and Callisto are moons of…", "Jupiter", ["Saturn", "Jupiter", "Uranus", "Neptune"], 2),
        ("Titan is a moon of…", "Saturn", ["Jupiter", "Saturn", "Mars", "Earth"], 2),
        ("Triton is a moon of…", "Neptune", ["Uranus", "Neptune", "Saturn", "Pluto"], 3),
        ("Phobos and Deimos are moons of…", "Mars", ["Earth", "Mars", "Venus", "Mercury"], 2),
        ("Mercury and Venus have how many moons?", "0", ["0", "1", "2", "many"], 2),
        ("Saturn is famous for its…", "rings", ["red spot only as Jupiter's", "rings", "life", "solid rock surface like Earth's"], 1),
        ("Jupiter's Great Red Spot is a…", "storm", ["ocean", "storm", "volcano", "ring gap"], 1),
        ("Olympus Mons is a volcano on…", "Mars", ["Earth", "Mars", "the Moon", "Venus as a name of a mountain there too but the famous tallest is Mars"], 2),
        ("Mare on the Moon are…", "dark plains of old lava", ["seas of water", "dark plains of old lava", "polar ice only", "forests"], 2),
        ("Tides on Earth are raised chiefly by the…", "Moon", ["Jupiter", "Moon", "Polaris", "asteroid belt"], 1),
        ("Auroras are caused by…", "charged particles and the magnetic field", ["only earthquakes", "charged particles and the magnetic field", "only volcanoes", "only the Moon's shadow"], 2),
        ("Earth's magnetic field is generated in the…", "outer core", ["crust only", "outer core", "atmosphere only", "Moon"], 3),
        ("P waves are…", "primary earthquake waves, faster", ["only ocean waves", "primary earthquake waves, faster", "only sound in air", "only light"], 3),
        ("The Mohorovičić discontinuity is the boundary of the…", "crust and mantle", ["core and mantle as the Gutenberg", "crust and mantle", "inner and outer core", "lithosphere and space"], 3),
        ("Basalt is a common…", "extrusive igneous rock", ["sedimentary sandstone", "extrusive igneous rock", "metamorphic marble", "mineral oil"], 3),
        ("Granite is a common…", "intrusive igneous rock", ["lava glass", "intrusive igneous rock", "evaporite", "coal"], 2),
        ("Marble is metamorphosed…", "limestone", ["sandstone", "limestone", "shale only as slate", "basalt"], 2),
        ("Slate is metamorphosed…", "shale", ["limestone", "shale", "granite", "coal"], 3),
        ("Sandstone is a…", "sedimentary rock of sand grains", ["lava", "sedimentary rock of sand grains", "pure metal", "ice"], 1),
        ("Limestone is often made of…", "calcium carbonate (shells, reefs, precipitates)", ["pure silica glass", "calcium carbonate (shells, reefs, precipitates)", "iron only", "salt only as halite"], 2),
        ("Halite is…", "rock salt", ["fool's gold", "rock salt", "mica", "quartz"], 2),
        ("Pyrite is nicknamed…", "fool's gold", ["fool's gold", "black lead", "heavy spar", "iceland spar"], 1),
        ("Quartz is…", "silicon dioxide", ["carbon", "silicon dioxide", "iron oxide", "calcium carbonate"], 2),
        ("Mica splits in…", "sheets", ["cubes only", "sheets", "needles only", "grains of sand only"], 2),
        ("The water cycle includes evaporation, condensation, and…", "precipitation", ["only melting", "precipitation", "only sublimation of iron", "only photosynthesis"], 1),
        ("A cirrus cloud is…", "high and wispy", ["low and dark always", "high and wispy", "a thunderstorm's anvil only as a name", "fog on the ground only"], 2),
        ("A cumulonimbus is a…", "tall storm cloud", ["fog", "tall storm cloud", "high ice veil only as cirrostratus", "streak of jet exhaust"], 2),
        ("Lightning is a…", "giant spark", ["only a sound", "giant spark", "only rain", "only wind"], 1),
        ("Thunder is the…", "sound of the lightning channel expanding", ["light of the bolt", "sound of the lightning channel expanding", "rain", "hail only"], 2),
        ("A hurricane in the NW Pacific is often called a…", "typhoon", ["tornado", "typhoon", "blizzard", "chinook"], 2),
        ("A tornado is a…", "violent rotating column from a thunderstorm", ["ocean cyclone always", "violent rotating column from a thunderstorm", "snowstorm", "fog bank"], 1),
        ("The Fujita / Enhanced Fujita scale rates…", "tornado intensity", ["hurricanes", "tornado intensity", "earthquakes", "snow"], 2),
        ("The Saffir–Simpson scale rates…", "hurricanes", ["tornadoes", "hurricanes", "earthquakes", "volcanoes"], 2),
        ("The Beaufort scale rates…", "wind", ["rain", "wind", "snow depth", "earthquakes"], 3),
        ("A monsoon is a…", "seasonal wind (and the rain it often brings)", ["one thunderstorm", "seasonal wind (and the rain it often brings)", "one tornado", "a desert only"], 2),
        ("Dew point is the temperature at which…", "air becomes saturated", ["water always boils", "air becomes saturated", "iron melts", "the Sun sets"], 3),
        ("Relative humidity is…", "how close the air is to saturation", ["the absolute grams always as a percent of 100 g", "how close the air is to saturation", "rainfall in inches", "cloud height"], 2),
        ("The greenhouse effect is…", "trapping of outgoing infrared by gases", ["only the ozone hole", "trapping of outgoing infrared by gases", "only volcanic ash", "only city lights"], 2),
        ("Photosynthesis stores sunlight as…", "chemical energy in sugars", ["only heat in the soil", "chemical energy in sugars", "only sound", "only magnetism"], 1),
        ("Respiration in cells releases energy from…", "food (sugars, etc.)", ["only sunlight on the skin as the only source", "food (sugars, etc.)", "only metals", "only nitrogen gas"], 1),
        ("The food chain's base is usually…", "producers (plants / phytoplankton)", ["lions", "producers (plants / phytoplankton)", "fungi only as the base of every chain", "humans"], 1),
        ("A decomposer is typically a…", "fungus or bacterium", ["hawk", "fungus or bacterium", "deer", "whale"], 1),
        ("Carbon-14 dating works on…", "once-living things of the right age", ["all rocks of any age", "once-living things of the right age", "stars", "pure metals of any age"], 3),
        ("Half-life does not depend on…", "how much you start with (for a given isotope, in the simple law)", ["the isotope", "how much you start with (for a given isotope, in the simple law)", "the decay constant", "time"], 3),
        ("A Geiger counter detects…", "ionizing radiation", ["wind", "ionizing radiation", "pH", "mass only"], 2),
        ("X-rays were discovered by…", "Röntgen", ["Curie as the only name", "Röntgen", "Einstein as a lab discovery", "Faraday"], 3),
        ("Penicillin was noticed by…", "Fleming", ["Pasteur as the mold plate", "Fleming", "Salk", "Jenner as the mold"], 2),
        ("Vaccination against smallpox is associated with…", "Jenner", ["Fleming", "Jenner", "Salk as smallpox", "Pasteur as the first smallpox"], 2),
        ("Polio vaccine is associated with…", "Salk (and Sabin)", ["Jenner", "Salk (and Sabin)", "Fleming as a virus killer pill", "Röntgen"], 2),
        ("The structure of DNA was described in 1953 by…", "Watson and Crick (using Franklin's data, and Wilkins)", ["Darwin and Wallace", "Watson and Crick (using Franklin's data, and Wilkins)", "Mendel only", "Pasteur and Koch"], 2),
        ("Mendel studied inheritance in…", "pea plants", ["fruit flies only as the first", "pea plants", "mice only", "humans in a monastery hospital"], 2),
        ("Darwin and Wallace proposed…", "evolution by natural selection", ["the atom", "evolution by natural selection", "the germ theory as a first", "relativity"], 1),
        ("The germ theory of disease is associated with…", "Pasteur and Koch (among others)", ["Newton", "Pasteur and Koch (among others)", "Galileo", "Kepler"], 2),
        ("Heliocentrism in the modern era is associated with…", "Copernicus (and Galileo's advocacy)", ["Ptolemy as the modern", "Copernicus (and Galileo's advocacy)", "Aristotle as the modern", "Pliny"], 2),
        ("Galileo used a telescope to see…", "moons of Jupiter (among other sights)", ["bacteria", "moons of Jupiter (among other sights)", "DNA", "X-rays"], 2),
        ("Kepler's laws describe…", "planetary orbits", ["falling apples only", "planetary orbits", "electric circuits", "genetics"], 2),
        ("Faraday linked…", "electricity and magnetism in experiments", ["only chemistry of gases", "electricity and magnetism in experiments", "only stars", "only peas"], 3),
        ("Maxwell's equations describe…", "electric and magnetic fields", ["only gravity", "electric and magnetic fields", "only evolution", "only geology"], 3),
        ("The first programmable electronic computers were built in the…", "1940s", ["1840s as electronic", "1940s", "1990s as the first", "2000s"], 3),
        ("The World Wide Web was proposed by…", "Tim Berners-Lee", ["Bill Gates as the web", "Tim Berners-Lee", "Steve Jobs as the web", "Elon Musk"], 2),
        ("GPS relies on…", "timing signals from satellites", ["only compass needles", "timing signals from satellites", "only barometers", "only star charts on paper"], 2),
    ]
    for prompt, ans, ch, d in FACTS:
        R.add(prompt, ch, ans, d)
    emit_array(OUT / "science_more.ts", "SCIENCE_MORE", R.rows)


def gen_history() -> None:
    R = Rows()
    FACTS = [
        ("The Code of Hammurabi is from ancient…", "Babylon / Mesopotamia", ["Rome", "Babylon / Mesopotamia", "China of Qin", "Mali"], 2),
        ("Cuneiform writing began in…", "Mesopotamia", ["Egypt only as the first", "Mesopotamia", "China only as the first", "Mesoamerica only as the first"], 2),
        ("Egyptian hieroglyphs were deciphered using the…", "Rosetta Stone", ["Dead Sea Scrolls", "Rosetta Stone", "Behistun only as Egyptian", "Phaistos disc"], 2),
        ("The Old Kingdom of Egypt is the age of the great…", "pyramids at Giza (chiefly)", ["Alexandrian library only", "pyramids at Giza (chiefly)", "Ptolemaic navy only", "Fatimid Cairo only"], 2),
        ("Hatshepsut was a…", "pharaoh of Egypt", ["Roman empress", "pharaoh of Egypt", "Chinese empress of Tang only", "Mughal princess"], 2),
        ("Akhenaten is associated with…", "a religious reform toward the Aten", ["the first pyramid", "a religious reform toward the Aten", "Alexander's conquest", "the Ptolemies only"], 3),
        ("Tutankhamun's tomb was opened in the 1920s by…", "Howard Carter", ["Schliemann", "Howard Carter", "Layard", "Petrie as the only name"], 2),
        ("The Epic of Gilgamesh is from…", "Mesopotamia", ["Greece", "Mesopotamia", "India as the Mahabharata", "Norse myth"], 2),
        ("The Iliad is set around a war at…", "Troy", ["Thebes in Egypt", "Troy", "Babylon", "Rome"], 1),
        ("The city archaeologists identify with Troy is in…", "Anatolia (Turkey)", ["Greece's Peloponnese only", "Anatolia (Turkey)", "Crete only", "Sicily"], 2),
        ("The Olympic Games of antiquity were held at…", "Olympia", ["Athens only", "Olympia", "Sparta", "Delphi as the games' only site"], 2),
        ("Sparta was a…", "militarized Greek city-state", ["Persian capital", "militarized Greek city-state", "Egyptian nome", "Phoenician colony only"], 1),
        ("Athens in the 5th century BCE is associated with…", "democracy (for male citizens) and the arts", ["the first pharaohs", "democracy (for male citizens) and the arts", "the Mongol khans", "the caliphate"], 1),
        ("Pericles was a leader of…", "Athens", ["Sparta", "Athens", "Persia", "Macedon"], 2),
        ("Socrates taught in…", "Athens", ["Rome", "Athens", "Alexandria as his home", "Babylon"], 1),
        ("Plato was a student of…", "Socrates", ["Aristotle as his teacher", "Socrates", "Alexander", "Cicero"], 2),
        ("Aristotle taught…", "Alexander the Great (among others)", ["Julius Caesar", "Alexander the Great (among others)", "Charlemagne as a boy", "Washington"], 2),
        ("Alexander the Great was from…", "Macedon", ["Sparta", "Macedon", "Rome", "Persia"], 1),
        ("Alexander's empire reached from Greece to…", "the Indus / northwest India", ["only Sicily", "the Indus / northwest India", "only Gaul", "China's Yellow River"], 2),
        ("The Hellenistic age follows the conquests of…", "Alexander", ["Augustus", "Alexander", "Charlemagne", "Genghis Khan"], 2),
        ("Rome was traditionally founded in…", "753 BCE", ["509 BCE as founding of the city", "753 BCE", "44 BCE", "27 BCE"], 3),
        ("The Roman Republic traditionally begins in…", "509 BCE", ["753 BCE", "509 BCE", "44 BCE", "476 CE"], 3),
        ("Julius Caesar was assassinated in…", "44 BCE", ["49 BCE", "44 BCE", "27 BCE", "14 CE"], 2),
        ("Augustus was the first…", "Roman emperor", ["king of Rome in the stories of Romulus as emperor", "Roman emperor", "pope", "Holy Roman Emperor"], 1),
        ("Pax Romana refers to a long…", "Roman peace / order in the early empire", ["civil war of Marius", "Roman peace / order in the early empire", "sack of Rome by Gauls only", "Byzantine iconoclasm"], 2),
        ("Pompeii was buried by…", "Vesuvius in 79 CE", ["Etna in 79 CE", "Vesuvius in 79 CE", "a flood of the Tiber as the only story", "an earthquake in 62 as the burial"], 2),
        ("Constantine is associated with…", "tolerating and favoring Christianity in the empire", ["banning all religion", "tolerating and favoring Christianity in the empire", "founding Rome", "the Twelve Tables"], 2),
        ("Constantinople was founded on the site of…", "Byzantium", ["Troy", "Byzantium", "Carthage", "Alexandria"], 2),
        ("The Western Roman Empire's traditional end is…", "476 CE", ["410 as the only date", "476 CE", "1453", "800"], 2),
        ("The Byzantine Empire ended in…", "1453, with the fall of Constantinople", ["476", "1453, with the fall of Constantinople", "800", "1204 as the final end"], 2),
        ("Justinian is remembered for a…", "code of Roman law", ["the first pyramid", "code of Roman law", "the Magna Carta", "the U.S. Constitution"], 2),
        ("The Hagia Sophia in Istanbul was built as a…", "church (later a mosque)", ["Greek temple of Athena", "church (later a mosque)", "ziggurat", "synagogue of antiquity"], 2),
        ("Muhammad was born in…", "Mecca", ["Medina as birth", "Mecca", "Damascus", "Baghdad"], 1),
        ("The Hijra, start of the Islamic calendar, is the move to…", "Medina", ["Mecca as a leaving of Medina", "Medina", "Jerusalem", "Cairo"], 2),
        ("The Abbasid capital was…", "Baghdad", ["Mecca as the political capital", "Baghdad", "Córdoba as the only capital", "Istanbul in the 8th century"], 2),
        ("Al-Andalus refers to Muslim…", "Iberia", ["Sicily only", "Iberia", "Egypt only", "Persia"], 2),
        ("The Battle of Tours (Poitiers, 732) is associated with…", "Charles Martel", ["Charlemagne as the only name", "Charles Martel", "William of Normandy", "Richard I"], 3),
        ("Charlemagne was crowned emperor in…", "800", ["732", "800", "1066", "1215"], 2),
        ("The Holy Roman Empire was centered in…", "German-speaking Europe (among other lands)", ["only Spain", "German-speaking Europe (among other lands)", "only England", "only Russia"], 2),
        ("1066 is the year of the…", "Norman Conquest of England", ["Magna Carta", "Norman Conquest of England", "Fall of Constantinople", "Spanish Armada"], 1),
        ("The Domesday Book is a survey of…", "England under William I", ["France under Louis XIV", "England under William I", "Spain under Philip II", "Russia under Peter"], 3),
        ("The Magna Carta was sealed at…", "Runnymede, 1215", ["Hastings, 1066", "Runnymede, 1215", "Agincourt, 1415", "Runnymede, 1776"], 2),
        ("The Black Death peaked in Europe in the…", "1340s", ["1240s", "1340s", "1540s", "1640s"], 2),
        ("The Hundred Years' War was between…", "England and France", ["Spain and Portugal", "England and France", "Ottomans and Hungary only", "Genoa and Venice only"], 2),
        ("Joan of Arc fought in…", "the French cause in the Hundred Years' War", ["the Reconquista of Spain as a French captain", "the French cause in the Hundred Years' War", "the Crusade of 1095 as a leader", "the Armada"], 2),
        ("The Wars of the Roses were English civil wars of the…", "15th century", ["11th century", "15th century", "17th century only as the Civil War of Cromwell", "19th century"], 3),
        ("Henry VIII broke with Rome over…", "his marriage and the English church", ["the Spanish Armada", "his marriage and the English church", "the Glorious Revolution", "American independence"], 2),
        ("Elizabeth I's reign saw the defeat of the…", "Spanish Armada (1588)", ["French at Agincourt", "Spanish Armada (1588)", "Dutch at Trafalgar as her battle", "Ottomans at Lepanto as an English fleet"], 2),
        ("The printing press in Europe is dated to the…", "1450s", ["1350s", "1450s", "1550s as the first press", "1650s"], 2),
        ("Martin Luther's 95 Theses are dated…", "1517", ["1415", "1517", "1618", "1648"], 2),
        ("The Thirty Years' War ended in…", "1648 (Peace of Westphalia)", ["1517", "1588", "1648 (Peace of Westphalia)", "1688"], 3),
        ("The Peace of Westphalia is a landmark of…", "state sovereignty in Europe", ["the Crusades", "state sovereignty in Europe", "decolonization of Africa", "the EU"], 3),
        ("The Scientific Revolution is associated with…", "Copernicus, Galileo, Newton (among others)", ["only Aquinas", "Copernicus, Galileo, Newton (among others)", "only Homer", "only Hammurabi"], 1),
        ("The Enlightenment is associated with…", "reason, rights, and criticism of old authority", ["only Gothic cathedrals", "reason, rights, and criticism of old authority", "only feudal dues", "only icon painting"], 1),
        ("John Locke argued for…", "natural rights and government by consent", ["the divine right of kings as his main thesis", "natural rights and government by consent", "only mercantilism", "absolute serfdom"], 2),
        ("Adam Smith's Wealth of Nations appeared in…", "1776", ["1688", "1776", "1789 as his only year", "1848"], 3),
        ("The American Revolution's fighting is often dated 1775 to…", "1783", ["1776 only", "1783", "1789", "1812 as the end of the Revolution"], 2),
        ("Yorktown (1781) was a decisive…", "Franco-American victory over the British", ["British victory", "Franco-American victory over the British", "Spanish loss of Mexico", "French loss of Quebec as 1781"], 2),
        ("The French Revolution's Tennis Court Oath is…", "1789", ["1776", "1789", "1793 only", "1815"], 2),
        ("The Reign of Terror is associated with…", "Robespierre / the Jacobins", ["Napoleon as first consul only", "Robespierre / the Jacobins", "Louis XIV", "de Gaulle"], 2),
        ("Napoleon crowned himself (in effect) in…", "1804", ["1789", "1799 as emperor", "1804", "1815"], 2),
        ("The Battle of Trafalgar (1805) was a victory of…", "Nelson / Britain", ["Napoleon", "Nelson / Britain", "the U.S.", "Russia"], 2),
        ("The Battle of Waterloo (1815) ended…", "Napoleon's rule", ["the American Revolution", "Napoleon's rule", "the Crimean War", "WWI"], 1),
        ("The Congress of Vienna (1814–15) tried to…", "restore a balance of power after Napoleon", ["found the UN", "restore a balance of power after Napoleon", "end WWII", "partition Africa as its only act"], 2),
        ("Simón Bolívar is associated with independence in…", "Spanish South America", ["Brazil only as a Portuguese prince", "Spanish South America", "Mexico only as Hidalgo's only rival", "Haiti only as Toussaint"], 2),
        ("Haitian independence (1804) followed a revolution of…", "enslaved and free people of color against France", ["only creole planters against Spain", "enslaved and free people of color against France", "only British occupation", "only U.S. invasion"], 2),
        ("The Opium Wars were between Britain (and later others) and…", "Qing China", ["Japan", "Qing China", "Siam", "Korea"], 2),
        ("The Meiji Restoration transformed…", "Japan", ["China as the name of 1868", "Japan", "Korea as 1868", "Vietnam"], 2),
        ("The Indian Rebellion of 1857 is also called the…", "Sepoy Mutiny / First War of Independence", ["Boxer Rebellion", "Sepoy Mutiny / First War of Independence", "Taiping Rebellion", "Mau Mau"], 3),
        ("The Taiping Rebellion was in…", "China", ["India", "China", "Japan", "Vietnam"], 3),
        ("The scramble for Africa is dated chiefly to the…", "late 19th century", ["16th century only", "late 19th century", "21st century", "11th century"], 2),
        ("The Berlin Conference (1884–85) concerned…", "European claims in Africa", ["the UN", "European claims in Africa", "the League of Nations", "NATO"], 2),
        ("World War I's spark is often given as the assassination at…", "Sarajevo", ["Berlin", "Sarajevo", "Vienna as the shot", "Paris"], 2),
        ("The assassin of Archduke Franz Ferdinand was…", "Gavrilo Princip", ["Black Hand as a person's name", "Gavrilo Princip", "Princip as a German colonel", "a French anarchist of 1914 fame"], 3),
        ("The U.S. entered World War I in…", "1917", ["1914", "1915", "1917", "1918 as the declaration"], 2),
        ("The Treaty of Versailles is dated…", "1919", ["1918 as the treaty", "1919", "1920 as the only year", "1923"], 2),
        ("The League of Nations was founded after…", "WWI", ["WWII as the League", "WWI", "the Napoleonic wars", "the Cold War"], 1),
        ("The Russian Revolutions of 1917 ended…", "the Romanov monarchy (and then brought the Bolsheviks)", ["the Soviet Union", "the Romanov monarchy (and then brought the Bolsheviks)", "the Mongol yoke in 1917", "Peter the Great"], 2),
        ("Lenin led the…", "Bolsheviks", ["Mensheviks as his party name", "Bolsheviks", "Kadets", "Whites as his color"], 2),
        ("Stalin's rule of the USSR is associated with…", "collectivization, famine, and the Terror", ["only the New Economic Policy as his whole story", "collectivization, famine, and the Terror", "only glasnost", "only the space race of the 1960s as his years"], 2),
        ("The Holodomor was a famine in…", "Ukraine (1932–33)", ["Ireland of the 1840s as this name", "Ukraine (1932–33)", "China of 1959 as this name", "Bengal of 1943 as this name"], 3),
        ("The Long March was a retreat of Chinese…", "Communists", ["Nationalists as the Long Marchers", "Communists", "Japanese occupiers", "Mongols"], 2),
        ("Mao Zedong proclaimed the People's Republic in…", "1949", ["1911", "1927", "1949", "1966 as founding"], 2),
        ("The 1911 Revolution in China ended the…", "Qing dynasty", ["Ming", "Qing dynasty", "Yuan", "Han"], 2),
        ("Pearl Harbor was attacked on…", "December 7, 1941", ["June 6, 1944", "December 7, 1941", "May 8, 1945", "August 6, 1945"], 1),
        ("D-Day was…", "June 6, 1944", ["December 7, 1941", "June 6, 1944", "May 8, 1945", "September 1, 1939"], 1),
        ("VE Day in Europe was…", "May 1945", ["June 1944", "May 1945", "August 1945 as Europe", "December 1941"], 2),
        ("VJ Day / Japan's surrender was…", "August 1945", ["May 1945", "August 1945", "December 1941", "June 1944"], 2),
        ("The atomic bombings of 1945 were of…", "Hiroshima and Nagasaki", ["Tokyo and Kyoto", "Hiroshima and Nagasaki", "Osaka and Kobe", "only tests in Nevada"], 1),
        ("The Holocaust was the genocide of…", "Jews (and other groups) by Nazi Germany", ["only POWs of one battle", "Jews (and other groups) by Nazi Germany", "only a famine", "only a civil war of Spain"], 1),
        ("Auschwitz was a…", "Nazi camp complex in occupied Poland", ["Soviet gulag in Siberia", "Nazi camp complex in occupied Poland", "Japanese camp in Manchuria only as this name", "U.S. internment camp"], 1),
        ("The Nuremberg Trials prosecuted…", "Nazi leaders", ["only Japanese leaders as this name", "Nazi leaders", "only Italian leaders", "only collaborators in France as this name"], 2),
        ("The Marshall Plan rebuilt…", "Western Europe after WWII", ["the USSR as the main recipient", "Western Europe after WWII", "only Japan as this name", "only China as this name"], 2),
        ("NATO was founded in…", "1949", ["1919", "1945 as NATO", "1949", "1955 as NATO's founding"], 2),
        ("The Warsaw Pact was founded in…", "1955", ["1949", "1955", "1961", "1968 as founding"], 3),
        ("The Korean War is dated…", "1950–1953", ["1945–1948", "1950–1953", "1959–1975", "1964–1973"], 2),
        ("The Vietnam War's U.S. combat phase is often closed in…", "1973/1975", ["1950", "1964 only as the end", "1973/1975", "1989"], 2),
        ("The Cuban Missile Crisis was in…", "1962", ["1959 as the missiles", "1961 as the only year", "1962", "1968"], 2),
        ("The Berlin Wall went up in…", "1961", ["1949", "1953", "1961", "1989 as building"], 2),
        ("The Civil Rights Act in the U.S. is dated…", "1964", ["1954 as the Act", "1964", "1965 as the Act of this name", "1968 as this Act's only year"], 2),
        ("The Voting Rights Act in the U.S. is dated…", "1965", ["1964 as this Act's name", "1965", "1968", "1954"], 2),
        ("Brown v. Board of Education is dated…", "1954", ["1896", "1954", "1964", "1965"], 2),
        ("Rosa Parks's bus protest was in…", "Montgomery, 1955", ["Selma, 1965 as the bus", "Montgomery, 1955", "Birmingham as the only bus", "Washington in 1963 as a bus"], 2),
        ("The March on Washington (1963) is remembered for…", "King's 'I Have a Dream'", ["the bus boycott as that day's speech", "King's 'I Have a Dream'", "the Selma bridge as that day's speech", "Malcolm X's only speech that day as the March's keynote"], 1),
        ("Stonewall (1969) is a landmark of…", "LGBTQ+ rights protest in New York", ["labor in Chicago 1886 as this name", "LGBTQ+ rights protest in New York", "antiwar in Kent State as this name", "farmworkers in Delano as this name"], 2),
        ("The moon landing of Apollo 11 was…", "1969", ["1961", "1965", "1969", "1975"], 1),
        ("Sputnik was launched in…", "1957", ["1945", "1957", "1961", "1969"], 2),
        ("Yuri Gagarin orbited Earth in…", "1961", ["1957", "1961", "1969", "1975"], 2),
        ("The Iranian Revolution was in…", "1979", ["1953 as this name", "1979", "1989", "2001"], 2),
        ("The Soviet invasion of Afghanistan began in…", "1979", ["1968", "1979", "1989", "2001 as Soviet"], 2),
        ("Solidarity in Poland is associated with…", "Lech Wałęsa and the Gdansk strikes", ["only the Prague Spring", "Lech Wałęsa and the Gdansk strikes", "only 1956 Hungary", "only Tito"], 3),
        ("The Tiananmen Square protests were in…", "1989", ["1976 as this name", "1989", "1991", "1997"], 2),
        ("German reunification is dated…", "1990", ["1989 as the treaty year only", "1990", "1991 as Germany", "1992"], 2),
        ("The Soviet Union dissolved in…", "1991", ["1989", "1990", "1991", "1993"], 1),
        ("The Maastricht Treaty is a founding text of the…", "European Union", ["UN", "European Union", "NATO", "WTO as the only name"], 2),
        ("Apartheid in South Africa ended in the…", "1990s (first majority elections 1994)", ["1960s as the end", "1970s as the end", "1990s (first majority elections 1994)", "2000s as the first election"], 2),
        ("The Rwandan genocide was in…", "1994", ["1975", "1984", "1994", "2004"], 2),
        ("The Dayton Accords concerned peace in…", "Bosnia", ["Kosovo only as Dayton", "Bosnia", "Rwanda", "Northern Ireland as Dayton"], 3),
        ("The Good Friday Agreement is dated…", "1998", ["1972", "1985", "1998", "2007"], 3),
        ("September 11 attacks were in…", "2001", ["1998", "2001", "2003", "2011"], 1),
        ("The euro notes and coins entered circulation in…", "2002", ["1992", "1999 as notes in wallets", "2002", "2009"], 3),
        ("The Arab Spring is dated chiefly…", "2010–2012", ["2001", "2003", "2010–2012", "2020"], 2),
        ("COVID-19 was declared a pandemic in…", "2020", ["2012", "2016", "2019 as the WHO pandemic declaration year", "2020"], 1),
        ("The U.S. Civil War began with firing on…", "Fort Sumter", ["Fort McHenry", "Fort Sumter", "the Alamo as 1861", "Harpers Ferry as the war's first battle"], 2),
        ("Gettysburg was fought in…", "1863", ["1861", "1862", "1863", "1865"], 2),
        ("The Emancipation Proclamation took effect…", "January 1, 1863", ["1861", "January 1, 1863", "1865 as this text", "1870"], 2),
        ("Appomattox Court House is where…", "Lee surrendered to Grant", ["Lincoln was shot", "Lee surrendered to Grant", "the Emancipation was signed", "Sherman began his march as a signing"], 2),
        ("Reconstruction in the U.S. followed the…", "Civil War", ["Revolution", "Civil War", "War of 1812", "Spanish-American War"], 1),
        ("The 13th, 14th, and 15th Amendments are the…", "Reconstruction Amendments", ["Bill of Rights", "Reconstruction Amendments", "Progressive-era only", "New Deal amendments"], 2),
        ("Plessy v. Ferguson (1896) upheld…", "racial segregation ('separate but equal')", ["school integration", "racial segregation ('separate but equal')", "the end of slavery as a holding", "women's suffrage"], 2),
        ("The 19th Amendment (U.S.) concerned…", "women's suffrage", ["Prohibition", "women's suffrage", "income tax", "two-term limit"], 1),
        ("The New Deal was the program of…", "Franklin D. Roosevelt", ["Hoover as the New Deal name", "Franklin D. Roosevelt", "Truman as the New Deal", "Eisenhower"], 1),
        ("Pearl Harbor brought the U.S. into…", "World War II", ["World War I", "World War II", "Korea", "Vietnam as the trigger"], 1),
        ("The G.I. Bill after WWII aided…", "veterans (education, housing, etc.)", ["only Japanese Americans in camps as this bill", "veterans (education, housing, etc.)", "only railroads", "only banks as 1933"], 2),
        ("McCarthyism is associated with…", "anti-communist hunts in the U.S.", ["only the New Deal", "anti-communist hunts in the U.S.", "only civil rights sit-ins", "only isolationism of 1940"], 2),
        ("The Voting Rights march in Selma is associated with…", "1965 and the Edmund Pettus Bridge", ["1955 Montgomery as this bridge", "1965 and the Edmund Pettus Bridge", "1963 Birmingham church as this march's name", "1968 Memphis"], 2),
        ("Watergate led to the resignation of…", "Richard Nixon", ["Johnson", "Richard Nixon", "Ford as the scandal's president", "Carter"], 1),
        ("The Iran hostage crisis began in…", "1979", ["1968", "1973", "1979", "1986 as the start"], 2),
        ("The first Gulf War to expel Iraq from Kuwait was in…", "1991", ["1980 as Desert Storm", "1991", "2003 as this expulsion war's name", "2011"], 2),
        ("The 2003 Iraq War toppled…", "Saddam Hussein", ["Nasser", "Saddam Hussein", "the Shah as 2003", "Gaddafi as 2003"], 2),
        ("Nelson Mandela was released from prison in…", "1990", ["1976", "1985", "1990", "1999"], 2),
        ("The first human on the Moon was…", "Neil Armstrong", ["Yuri Gagarin as the Moon", "Neil Armstrong", "John Glenn as the Moon", "Buzz Aldrin as first out"], 1),
        ("The second human on the Moon (same landing) was…", "Buzz Aldrin", ["Michael Collins as the walker", "Buzz Aldrin", "Alan Shepard as Apollo 11", "Jim Lovell"], 2),
        ("Michael Collins on Apollo 11…", "orbited in the command module", ["walked first", "orbited in the command module", "stayed on Earth", "piloted a Shuttle"], 2),
        ("The Library of Alexandria is a wonder of…", "Hellenistic Egypt", ["Rome of the Republic as its site", "Hellenistic Egypt", "Athens of Pericles as its site", "Baghdad only as this name"], 2),
        ("The Colossus of Rhodes was a…", "statue at a harbor", ["lighthouse of Alexandria as this name", "statue at a harbor", "tomb of Mausolus as this name", "hanging garden"], 2),
        ("The Terracotta Army was buried with…", "Qin Shi Huang", ["Kublai Khan", "Qin Shi Huang", "Mao", "Yongle only"], 2),
        ("Angkor Wat was built as a…", "Khmer temple (later Buddhist as well)", ["Japanese castle", "Khmer temple (later Buddhist as well)", "Mughal tomb", "Inca palace"], 2),
        ("Machu Picchu is associated with the…", "Inca", ["Aztec", "Maya as the only name", "Inca", "Olmec"], 1),
        ("Tenochtitlan was the capital of the…", "Aztec", ["Inca", "Maya as the only imperial capital of this name", "Aztec", "Moche"], 1),
        ("Chichen Itza is a city of the…", "Maya", ["Aztec as the only name", "Maya", "Inca", "Mississippian"], 1),
        ("Cahokia was a city of the…", "Mississippian culture", ["Ancestral Pueblo only", "Mississippian culture", "Iroquois as a stone city of pyramids", "Norse"], 3),
        ("The Iroquois (Haudenosaunee) Confederacy is in…", "the Northeast woodlands", ["the Pacific Northwest only", "the Northeast woodlands", "the Andes", "the Plains as a stone confederacy only"], 2),
        ("The Silk Road linked…", "East Asia and the Mediterranean world (among other routes)", ["only Peru and Mexico", "East Asia and the Mediterranean world (among other routes)", "only Australia and New Zealand", "only the Great Lakes"], 1),
        ("Zheng He led treasure voyages for…", "Ming China", ["the Ottomans", "Ming China", "Portugal as his flag", "Spain"], 3),
        ("Ibn Battuta was a…", "traveler of the 14th-century Islamic world", ["Ming admiral", "traveler of the 14th-century Islamic world", "Portuguese captain of 1498", "Viking of 1000"], 3),
        ("Marco Polo's Travels describe…", "a Venetian in Yuan China (as the book has it)", ["a Portuguese in Japan", "a Venetian in Yuan China (as the book has it)", "a Spaniard in Peru as this book", "a Dutchman in New York"], 2),
        ("Vasco da Gama reached India by sea in…", "1498", ["1488 as India", "1492 as India", "1498", "1521"], 3),
        ("Magellan's expedition is the first to…", "circumnavigate the globe (he died en route)", ["reach America", "circumnavigate the globe (he died en route)", "reach India by the Cape as the first of da Gama's rivals", "map Australia"], 2),
        ("Cortés led the Spanish war against the…", "Aztec", ["Inca as his theater", "Aztec", "Maya as his only war", "Mapuche as 1519"], 2),
        ("Pizarro led the Spanish war against the…", "Inca", ["Aztec", "Inca", "Maya as 1532", "Taíno as his Andes war"], 2),
        ("The Middle Passage was the…", "forced Atlantic crossing of enslaved Africans", ["Oregon Trail", "forced Atlantic crossing of enslaved Africans", "Silk Road", "Northwest Passage as a slave route name"], 1),
        ("Abolition of the British slave trade is dated…", "1807 (trade); 1833 emancipation act", ["1776 as British abolition", "1807 (trade); 1833 emancipation act", "1865 as British", "1888 as British"], 3),
        ("Brazil abolished slavery in…", "1888", ["1807", "1833 as Brazil", "1865 as Brazil", "1888"], 3),
        ("The Haitian Revolution is a landmark of…", "the destruction of slavery by the enslaved", ["only creole tax protest", "the destruction of slavery by the enslaved", "only a Napoleonic parade", "only U.S. occupation"], 2),
    ]
    for prompt, ans, ch, d in FACTS:
        R.add(prompt, ch, ans, d)
    emit_array(OUT / "history_more.ts", "HISTORY_MORE", R.rows)


def gen_nature() -> None:
    R = Rows()
    YOUNG = [
        ("cat", "kitten"), ("dog", "puppy"), ("horse", "foal"), ("cow", "calf"),
        ("sheep", "lamb"), ("goat", "kid"), ("pig", "piglet"), ("bear", "cub"),
        ("lion", "cub"), ("tiger", "cub"), ("wolf", "pup"), ("fox", "kit"),
        ("deer", "fawn"), ("kangaroo", "joey"), ("swan", "cygnet"), ("goose", "gosling"),
        ("duck", "duckling"), ("hen", "chick"), ("owl", "owlet"), ("eagle", "eaglet"),
        ("frog", "tadpole (then froglet)"), ("butterfly", "caterpillar (then chrysalis)"),
        ("eel", "elver (after leptocephalus)"), ("salmon", "fry / parr / smolt (stages)"),
    ]
    names = [a for a, _ in YOUNG]
    youngs = [b for _, b in YOUNG]
    for adult, baby in YOUNG:
        R.mc(f"A young {adult} is called a…", baby, youngs, 1)

    GROUPS = [
        ("lions", "pride"), ("wolves", "pack"), ("crows", "murder"), ("geese (on the ground)", "gaggle"),
        ("geese (in flight)", "skein / wedge"), ("fish", "school / shoal"), ("whales", "pod"),
        ("bees", "swarm / hive"), ("ants", "colony"), ("cows", "herd"), ("sheep", "flock"),
        ("birds (general)", "flock"), ("owls", "parliament"), ("ravens", "unkindness"),
        ("peacocks", "ostentation"), ("porpoises", "pod"), ("kangaroos", "mob / troop"),
        ("baboons", "troop"), ("otters", "romp / raft"), ("jellyfish", "smack"),
    ]
    gnames = [b for _, b in GROUPS]
    for animal, group in GROUPS:
        R.mc(f"A group of {animal} is called a…", group, gnames, 2)

    TREES = [
        ("coast redwood", "California"), ("giant sequoia", "California (Sierra)"),
        ("baobab (African)", "African savanna"), ("kauri", "New Zealand"),
        ("kauri of Southeast Asia as relatives", "Malesia"), ("banyan", "South Asia"),
        ("bristlecone pine", "the Great Basin / western U.S."), ("Douglas fir", "western North America"),
        ("Sitka spruce", "Pacific Northwest"), ("white birch", "northern forests"),
        ("sugar maple", "northeastern North America"), ("live oak", "the U.S. South / live-oak belt"),
        ("saguaro", "the Sonoran Desert"), ("Joshua tree", "the Mojave"),
        ("mangrove (as a guild)", "tropical coasts"), ("cypress of the swamps", "southeastern U.S. wetlands"),
        ("olive", "the Mediterranean"), ("cork oak", "western Mediterranean"),
        ("ginkgo", "China (wild remnant)"), ("dawn redwood", "China"),
        ("eucalyptus (many species)", "Australia"), ("kauri of Queensland as a cousin", "Australia"),
    ]
    # skip the messy relative ones
    places = list(dict.fromkeys(p for _, p in TREES if "relatives" not in _ and "cousin" not in _))
    for tree, place in TREES:
        if "relatives" in tree or "cousin" in tree:
            continue
        R.mc(f"The {tree} is native chiefly to…", place, places, 2)

    FACTS = [
        ("A carnivore eats…", "animals", ["only plants", "animals", "only wood", "only nectar"], 1),
        ("A herbivore eats…", "plants", ["only meat", "plants", "only fungi", "only clay"], 1),
        ("An omnivore eats…", "plants and animals", ["only plants", "only meat", "plants and animals", "only insects"], 1),
        ("A detritivore eats…", "dead organic matter", ["only live prey", "dead organic matter", "only sunlight", "only stone"], 2),
        ("A parasite lives…", "on or in a host, at the host's expense", ["only as a mutual friend", "on or in a host, at the host's expense", "only on rocks with no host", "only as a predator that always kills at once as the definition"], 2),
        ("Mutualism is a relation that…", "helps both partners", ["hurts both", "helps both partners", "helps one and hurts the other as the name", "has no effect"], 2),
        ("Commensalism helps one partner and…", "does not much affect the other", ["kills the other as the name", "does not much affect the other", "helps the other equally as mutualism's name", "is always predation"], 3),
        ("A keystone predator can…", "structure a whole community by what it eats", ["never eat", "structure a whole community by what it eats", "only live in zoos", "only eat fruit"], 3),
        ("An invasive species is…", "non-native and harmful in its new range", ["always native", "non-native and harmful in its new range", "always extinct", "always a pet"], 1),
        ("An endemic species lives…", "only in a particular place", ["everywhere on Earth", "only in a particular place", "only in labs", "only in the ocean as the word's meaning"], 2),
        ("Extinct means…", "no living members", ["rare", "no living members", "only in zoos as the definition", "only nocturnal"], 1),
        ("Endangered means…", "at high risk of extinction", ["already gone", "at high risk of extinction", "overabundant", "newly described only"], 1),
        ("A biome is a…", "large community type (forest, tundra, desert…)", ["single organism", "large community type (forest, tundra, desert…)", "gene", "cloud"], 1),
        ("Tundra is…", "cold, treeless, often with permafrost", ["tropical rainforest", "cold, treeless, often with permafrost", "hot desert only as a synonym", "coral reef"], 1),
        ("Taiga is…", "boreal conifer forest", ["tropical grassland", "boreal conifer forest", "mangrove", "chaparral only"], 2),
        ("Chaparral is a…", "shrubland of Mediterranean climates", ["rainforest", "shrubland of Mediterranean climates", "ice cap", "mangrove swamp"], 3),
        ("Temperate deciduous forest drops leaves in…", "autumn", ["only the dry season of the tropics as a rule of this biome", "autumn", "every full moon", "never"], 1),
        ("A rainforest has…", "high rainfall and typically high diversity", ["almost no rain", "high rainfall and typically high diversity", "only ice", "only grass and no trees as the name"], 1),
        ("The canopy is the…", "upper layer of a forest", ["soil only", "upper layer of a forest", "a river", "a cloud type only as ecology's word"], 1),
        ("The understory is…", "the layer under the canopy", ["outer space", "the layer under the canopy", "the ocean floor always", "a desert pavement"], 2),
        ("Epiphytes grow…", "on other plants, not as parasites necessarily", ["only as root parasites always", "on other plants, not as parasites necessarily", "only underwater as kelp", "only on ice"], 3),
        ("A succulent plant stores…", "water in thick tissues", ["only salt", "water in thick tissues", "only air in wood", "only light as sugar in the name"], 1),
        ("C4 and CAM photosynthesis are adaptations to…", "hot / dry or intense-light climates (among uses)", ["only the deep sea", "hot / dry or intense-light climates (among uses)", "only polar night", "only caves"], 3),
        ("Nitrogen-fixing bacteria often live with…", "legumes", ["cacti only", "legumes", "conifers only as the famous nodules", "ferns only"], 2),
        ("Mycorrhizae are…", "fungus–root partnerships", ["virus–leaf diseases only", "fungus–root partnerships", "insect galls only", "lichen of rock only as this word"], 3),
        ("A lichen is a partnership of…", "fungus and alga (or cyanobacterium)", ["two mammals", "fungus and alga (or cyanobacterium)", "two birds", "a fish and a shark only"], 2),
        ("Coral bleaching is often from…", "stress (especially heat) expelling algae", ["too much extra coral growth as the name", "stress (especially heat) expelling algae", "only extra fish", "only moonlight"], 2),
        ("Kelp forests grow in…", "cool coastal seas", ["deserts", "cool coastal seas", "the high Himalaya", "freshwater ponds only"], 2),
        ("Phytoplankton are…", "tiny drifting photosynthesizers", ["whales", "tiny drifting photosynthesizers", "only corals", "only kelp as large trees"], 2),
        ("Krill are…", "small crustaceans, key in polar seas", ["tiny whales", "small crustaceans, key in polar seas", "seaweeds", "penguins"], 2),
        ("Baleen whales feed with…", "comb-like baleen plates", ["teeth only as all whales", "comb-like baleen plates", "beaks like birds", "hands"], 2),
        ("Toothed whales include…", "dolphins, orcas, sperm whales", ["blue whales", "dolphins, orcas, sperm whales", "humpbacks as toothed", "right whales as toothed"], 2),
        ("Echolocation is used by…", "bats and toothed whales (among others)", ["only earthworms", "bats and toothed whales (among others)", "only birds of paradise", "only snakes as a rule"], 2),
        ("A nocturnal animal is active at…", "night", ["noon only", "night", "only dawn as the word", "only winter"], 1),
        ("A crepuscular animal is active at…", "dawn and dusk", ["noon", "dawn and dusk", "midnight only", "only in hibernation"], 2),
        ("Hibernation is a…", "seasonal torpor in winter (in the popular sense)", ["daily sleep of all mammals as this word", "seasonal torpor in winter (in the popular sense)", "migration", "molting only"], 1),
        ("Migration is a…", "seasonal long-distance movement", ["one afternoon nap", "seasonal long-distance movement", "changing color only", "growing a new shell only"], 1),
        ("Camouflage helps an animal…", "blend in", ["stand out always as the word", "blend in", "sing", "hibernate as the word"], 1),
        ("Mimicry is looking like…", "something else, often dangerous or inedible", ["your parent only as genetics", "something else, often dangerous or inedible", "the weather", "a biome"], 2),
        ("Aposematic colors often…", "warn that an animal is toxic or fierce", ["hide it in leaves", "warn that an animal is toxic or fierce", "are only for attracting mates as the word", "are always brown"], 3),
        ("The red-spotted newt's eft is…", "a toxic, brightly colored juvenile on land", ["a fish", "a toxic, brightly colored juvenile on land", "a bird", "a mushroom"], 3),
        ("Amphibians typically have…", "moist skin and a life tied to water", ["feathers", "moist skin and a life tied to water", "hair and milk", "dry scales and eggs on land as the only story of frogs"], 1),
        ("Reptile eggs on land are…", "amniotic", ["jelly masses only like frogs always", "amniotic", "never shelled in any reptile", "always laid in the sea"], 3),
        ("Monotremes lay eggs and include…", "the platypus and echidnas", ["kangaroos", "the platypus and echidnas", "whales", "armadillos only"], 2),
        ("Marsupials raise young in a…", "pouch (typically)", ["nest of sticks only", "pouch (typically)", "hive", "shell"], 1),
        ("The opossum is a…", "marsupial of the Americas", ["monotreme", "marsupial of the Americas", "placental cat", "primate"], 2),
        ("The koala eats…", "eucalyptus leaves (chiefly)", ["bamboo only", "eucalyptus leaves (chiefly)", "fish", "nectar only"], 1),
        ("The giant panda eats…", "bamboo (chiefly)", ["eucalyptus", "bamboo (chiefly)", "krill", "ants only"], 1),
        ("The sloth lives in…", "Neotropical trees", ["the tundra", "Neotropical trees", "the Sahara", "Antarctica"], 1),
        ("The capybara is the world's largest…", "rodent", ["cat", "rodent", "bat", "marsupial"], 2),
        ("The blue whale is the…", "largest animal known", ["smallest cetacean", "largest animal known", "fastest fish", "tallest tree"], 1),
        ("The cheetah is the…", "fastest land animal (sprint)", ["slowest sloth as this title", "fastest land animal (sprint)", "largest cat always", "only nocturnal cat"], 1),
        ("The peregrine falcon is famed as a…", "fast stooping bird", ["flightless bird", "fast stooping bird", "largest eagle always", "penguin"], 2),
        ("The ostrich is a…", "flightless bird of Africa", ["flying hawk", "flightless bird of Africa", "penguin of the Arctic", "parrot of New Zealand only"], 1),
        ("The kiwi is a…", "flightless bird of New Zealand", ["parrot of Australia as this name", "flightless bird of New Zealand", "eagle of North America", "penguin of Africa"], 2),
        ("The dodo was a…", "extinct flightless bird of Mauritius", ["living eagle of Europe", "extinct flightless bird of Mauritius", "penguin of Antarctica", "parrot of New Zealand still living as this name"], 1),
        ("Passenger pigeons were…", "once-abundant North American birds, now extinct", ["European garden birds still common", "once-abundant North American birds, now extinct", "Antarctic penguins", "African ostriches"], 2),
        ("The ivory-billed woodpecker is…", "critically endangered or extinct (status debated)", ["a common backyard feeder bird of cities worldwide", "critically endangered or extinct (status debated)", "a penguin", "a European robin"], 3),
        ("Rachel Carson's Silent Spring warned about…", "pesticides (especially DDT) and wildlife", ["only nuclear war", "pesticides (especially DDT) and wildlife", "only overfishing of whales as the book's sole topic", "only climate models of the 2000s"], 2),
        ("DDT thinned the eggshells of…", "birds of prey (among others)", ["only worms", "birds of prey (among others)", "only sharks", "only kelp"], 2),
        ("The Endangered Species Act is a law of the…", "United States", ["UN only as a treaty of this name", "United States", "EU only as this Act's name", "Brazil only"], 2),
        ("CITES regulates…", "international trade in wildlife", ["only local zoning", "international trade in wildlife", "only weather", "only mining of coal"], 3),
        ("A watershed is the land that…", "drains to a river or lake", ["only sits above treeline", "drains to a river or lake", "is always a desert", "is the ocean floor"], 2),
        ("An aquifer is…", "underground water-bearing rock or sediment", ["a cloud", "underground water-bearing rock or sediment", "a glacier on a peak always as this word", "a tide"], 2),
        ("Permafrost is…", "ground frozen for years", ["seasonal snow only", "ground frozen for years", "a kind of cloud", "warm sand"], 1),
        ("A glacier is…", "ice that moves under its weight", ["a frozen lake that never moves as the definition", "ice that moves under its weight", "only sea ice", "only frost on a window"], 1),
        ("Calving of a glacier is…", "breaking off icebergs", ["growing trees on ice", "breaking off icebergs", "melting into rain only", "turning to permafrost"], 2),
        ("An iceberg is…", "floating glacier ice", ["sea ice as the only name", "floating glacier ice", "a cloud", "a salt dome"], 1),
        ("Pack ice is…", "sea ice", ["glacier ice on a mountain as this name", "sea ice", "river ice only", "frost"], 2),
        ("The timberline is…", "the elevation or latitude beyond which trees do not grow", ["the ocean shore always", "the elevation or latitude beyond which trees do not grow", "a political border", "a river"], 2),
        ("A riparian zone is…", "along a river", ["on a glacier", "along a river", "in a desert far from water as the word", "on a peak"], 1),
        ("An estuary mixes…", "fresh water and the sea", ["only two glaciers", "fresh water and the sea", "only two deserts", "magma and air"], 1),
        ("A wetland might be a…", "marsh, swamp, bog, or fen", ["only a dune", "marsh, swamp, bog, or fen", "only a cliff", "only a lava field"], 1),
        ("A bog is often…", "acid, peat-forming, fed by rain", ["a salt lagoon always", "acid, peat-forming, fed by rain", "a coral atoll", "a geyser basin only"], 3),
        ("A fen is a peatland that is…", "less acid, fed by groundwater", ["always a salt marsh", "less acid, fed by groundwater", "a desert pavement", "a lava tube"], 3),
        ("A swamp has…", "trees in standing water (typically)", ["only grass and no trees as the swamp's definition", "trees in standing water (typically)", "only ice", "only dunes"], 2),
        ("A marsh has…", "grasses and reeds, few trees", ["a closed canopy of mahogany as the name", "grasses and reeds, few trees", "only cacti", "only moss on peaks"], 2),
        ("Peat is…", "partly decayed plant matter", ["pure coal always as a synonym at the surface", "partly decayed plant matter", "lava", "pure sand"], 2),
        ("Coal formed from…", "ancient plant matter under heat and pressure", ["only dinosaur bones", "ancient plant matter under heat and pressure", "only evaporating seas as salt", "only volcanic glass"], 2),
        ("Petroleum formed chiefly from…", "ancient plankton and organic muds", ["only dinosaur flesh as the schoolyard story", "ancient plankton and organic muds", "only granite", "only rain"], 2),
        ("Natural gas is often found with…", "oil", ["only glaciers", "oil", "only the ozone layer", "only granite plutons"], 1),
        ("The carbon cycle includes…", "photosynthesis, respiration, ocean uptake, and fossil fuels", ["only the water cycle as a synonym", "photosynthesis, respiration, ocean uptake, and fossil fuels", "only the rock cycle of granite", "only tides"], 2),
        ("The nitrogen cycle depends on…", "microbes that fix, nitrify, and denitrify", ["only lightning as the whole cycle", "microbes that fix, nitrify, and denitrify", "only birds", "only granite weathering as the whole cycle"], 3),
        ("Eutrophication is…", "over-enrichment of water, often causing algal blooms", ["a kind of drought", "over-enrichment of water, often causing algal blooms", "a kind of earthquake", "a kind of cloud"], 3),
        ("A dead zone in the sea is often from…", "low oxygen after nutrient pollution", ["too many coral as the name", "low oxygen after nutrient pollution", "too much ice only as the name", "too many whales"], 3),
        ("Bycatch is…", "unwanted catch in fishing gear", ["a kind of bait", "unwanted catch in fishing gear", "a kind of seaweed farm", "a kind of bird song"], 2),
        ("A keystone of kelp forests on the North American Pacific is often the…", "sea otter (among others)", ["camel", "sea otter (among others)", "lion", "penguin of the Arctic"], 2),
        ("Sea otters eat…", "urchins, among other invertebrates", ["kelp as their main diet", "urchins, among other invertebrates", "only krill", "only fish as a cat would"], 2),
        ("Urchins, unchecked, can…", "graze kelp to barrens", ["plant kelp", "graze kelp to barrens", "build coral", "fix nitrogen on land"], 3),
        ("Beavers are…", "ecosystem engineers of streams", ["desert antelope", "ecosystem engineers of streams", "marine mammals of the open ocean", "flightless birds"], 1),
        ("A lodge of a beaver is a…", "house of sticks and mud", ["nest in a tree cavity only", "house of sticks and mud", "hive", "burrow in dry sand only"], 1),
        ("Prairie dogs live in…", "colonies of burrows on grasslands", ["the deep sea", "colonies of burrows on grasslands", "the high canopy of rainforests", "Antarctica"], 1),
        ("Bison are native to…", "North American grasslands (and a European cousin)", ["Australia", "North American grasslands (and a European cousin)", "Antarctica", "Madagascar only"], 1),
        ("The passenger of the Great Plains' horse culture included the…", "bison hunt", ["only whale hunt of the plains", "bison hunt", "only seal hunt", "only penguin hunt"], 2),
        ("Fire on many prairies and pine savannas is…", "a natural and cultural process that maintains the system", ["always a disaster with no ecology", "a natural and cultural process that maintains the system", "impossible because grass cannot burn", "only from lightning in rainforests as the only fire ecology"], 3),
        ("Serotinous cones open with…", "heat / fire", ["only frost", "heat / fire", "only moonlight", "only flood of the sea"], 3),
        ("A nurse log is a…", "fallen tree that seedlings grow on", ["living doctor of the forest as an animal", "fallen tree that seedlings grow on", "kind of fungus only", "kind of cloud"], 2),
        ("Old-growth forest has…", "large old trees, snags, and complex structure", ["only seedlings in rows", "large old trees, snags, and complex structure", "only grass", "only ice"], 2),
        ("A snag is a…", "standing dead tree", ["fallen log only as this word", "standing dead tree", "seedling", "vine"], 2),
        ("The spotted owl is associated with…", "old forests of the Pacific Northwest (among other owls)", ["the Sahara", "old forests of the Pacific Northwest (among other owls)", "Antarctic ice", "coral atolls"], 3),
        ("The whooping crane was saved in part by…", "captive breeding and habitat protection", ["introducing cats to nests", "captive breeding and habitat protection", "draining all wetlands", "banning all flyways of other birds only"], 2),
        ("The California condor was brought back by…", "captive breeding", ["only hope with no program", "captive breeding", "introducing DDT", "hunting bounties"], 2),
        ("Island species often evolve…", "in isolation and are vulnerable to invaders", ["faster wings always and no risk", "in isolation and are vulnerable to invaders", "only as fish", "only as whales"], 2),
        ("Darwin's finches of the Galápagos show…", "beak shapes matching foods", ["identical beaks on all islands", "beak shapes matching foods", "that birds cannot evolve", "that all finches eat only fish"], 2),
        ("The Galápagos are in the…", "Pacific, off Ecuador", ["Atlantic off Africa", "Pacific, off Ecuador", "Indian Ocean off India", "Arctic"], 2),
        ("Madagascar is famed for…", "lemurs and other endemic lineages", ["kangaroos as natives", "lemurs and other endemic lineages", "polar bears", "penguins of the north"], 1),
        ("New Zealand had no native…", "land mammals except bats (before humans)", ["birds", "land mammals except bats (before humans)", "insects", "plants"], 3),
        ("Australia's native mammals are mostly…", "marsupials and monotremes (plus bats and rodents)", ["only primates", "marsupials and monotremes (plus bats and rodents)", "only ungulates of Africa as natives", "only marine otters"], 2),
        ("The duck-billed platypus is a…", "monotreme that lays eggs and hunts in water", ["marsupial kangaroo", "monotreme that lays eggs and hunts in water", "placental otter of Europe", "bird"], 2),
        ("Echidnas eat…", "ants and termites (chiefly)", ["eucalyptus only", "ants and termites (chiefly)", "krill", "bamboo"], 2),
    ]
    for prompt, ans, ch, d in FACTS:
        R.add(prompt, ch, ans, d)
    emit_array(OUT / "nature_more.ts", "NATURE_MORE", R.rows)


CITY_EXTRA = {
    "austin": {
        "local": [
            ("Sixth Street is Austin's famous…", "entertainment strip", ["river dam", "entertainment strip", "airport runway", "capitol lawn"], 1),
            ("The Drag in Austin is along…", "Guadalupe Street by UT", ["Congress Avenue only", "Guadalupe Street by UT", "MoPac only", "Burnet Road only"], 2),
            ("Rainey Street is a…", "bungalow-bar district", ["museum campus", "bungalow-bar district", "airport", "cemetery"], 2),
            ("Zilker Park hosts…", "the Austin City Limits Music Festival (among other things)", ["SXSW's only indoor halls", "the Austin City Limits Music Festival (among other things)", "the Texas State Fair as its main home", "the Houston Rodeo"], 2),
            ("Mount Bonnell looks over…", "Lake Austin / the western hills", ["the Gulf", "Lake Austin / the western hills", "the Red River", "Caddo Lake"], 1),
            ("The University of Texas tower is a…", "main-building landmark on campus", ["capitol dome", "main-building landmark on campus", "church steeple of a parish", "lighthouse"], 1),
            ("I-35 through Austin roughly splits…", "east and west", ["north from the river only", "east and west", "the lakes from the hills as a beltway", "the airport from the capitol as a river"], 2),
            ("Barton Creek feeds…", "Barton Springs", ["Lady Bird Lake from the east only", "Barton Springs", "Lake Travis as a dam", "the Pedernales only"], 2),
            ("The Pennybacker is a…", "through-arch bridge on Loop 360", ["rail depot", "through-arch bridge on Loop 360", "capitol gate", "dam"], 2),
            ("Mueller is a…", "redeveloped airport site on the east side", ["west-lake canyon", "redeveloped airport site on the east side", "UT dorm only", "state cemetery"], 3),
            ("East Austin's historic core includes…", "the 11th and 12th Street corridors", ["Westlake hills only", "the 11th and 12th Street corridors", "Lakeway", "Bee Cave"], 3),
            ("The Violet Crown is a nickname tied to Austin's…", "evening sky", ["capitol granite", "evening sky", "bat species", "football team"], 3),
        ],
        "food": [
            ("Franklin Barbecue's line is famous for…", "brisket", ["kolaches only", "brisket", "sushi", "cioppino"], 1),
            ("A breakfast taco in Austin is often on a…", "flour tortilla", ["bagel only", "flour tortilla", "baguette", "lettuce wrap only"], 1),
            ("Torchy's is a local chain of…", "taco shops", ["brisket pits only", "taco shops", "donut shops only", "crawfish stands"], 2),
        ],
        "arts": [
            ("ACL Live is a…", "studio and theater on Willie Nelson Boulevard", ["football stadium", "studio and theater on Willie Nelson Boulevard", "library", "courthouse"], 2),
            ("Willie Nelson is closely tied to which Texas city as a home base?", "Austin", ["Amarillo", "Austin", "El Paso", "Beaumont"], 1),
        ],
    },
    "temple": {
        "local": [
            ("Temple, Texas, sits in which county?", "Bell", ["Travis", "Bell", "McLennan", "Williamson"], 1),
            ("Temple grew as a…", "railroad town", ["port", "railroad town", "mining camp of silver", "whaling station"], 1),
            ("Temple is named for a…", "railroad engineer, Bernard Moore Temple", ["Spanish missionary only", "railroad engineer, Bernard Moore Temple", "U.S. president", "Comanche chief as the legal namesake"], 2),
            ("Scott & White began as a…", "railroad hospital", ["fort", "railroad hospital", "university of music", "cotton gin only"], 2),
            ("Temple lies along which interstate between Austin and Waco?", "I-35", ["I-10", "I-35", "I-45", "I-20"], 1),
            ("Belton is Temple's…", "county-seat neighbor", ["port on the Gulf", "county-seat neighbor", "mountain suburb in the Rockies", "border crossing"], 2),
            ("Stillhouse Hollow and Belton Lake are…", "reservoirs near Temple", ["Gulf bays", "reservoirs near Temple", "Great Lakes", "oxbows of the Mississippi only"], 2),
            ("Temple College is a…", "community college in town", ["Ivy League university", "community college in town", "service academy", "conservatory in New York"], 1),
            ("The Santa Fe depot in Temple is a…", "rail landmark downtown", ["airport tower", "rail landmark downtown", "capitol", "lighthouse"], 1),
            ("Killeen and Fort Cavazos (Fort Hood) sit…", "west of Temple in the same region", ["on the Gulf", "west of Temple in the same region", "in the Panhandle only", "in the Big Bend"], 2),
        ],
        "food": [
            ("Central Texas towns like Temple sit in the…", "barbecue and kolache belt", ["cioppino belt", "barbecue and kolache belt", "lobster-roll belt", "gumbo-only belt"], 1),
        ],
        "sports": [
            ("Temple's high-school teams are the…", "Wildcats", ["Longhorns as the high-school name", "Wildcats", "Bears of Baylor as the high school", "Aggies as the high school"], 2),
        ],
    },
    "nyc": {
        "local": [
            ("New York City has how many boroughs?", "5", ["4", "5", "6", "12"], 1),
            ("The Staten Island Ferry is famous for being…", "free", ["a toll tunnel only", "free", "a subway line under the harbor as its name", "a helipad"], 1),
            ("The High Line is a…", "park on an old rail viaduct", ["subway line", "park on an old rail viaduct", "bridge to New Jersey", "airport"], 1),
            ("One World Trade Center's height in feet nods to…", "1776", ["1492", "1776", "1865", "2001 as the only number of the spire"], 2),
            ("Central Park was designed by…", "Olmsted and Vaux", ["L'Enfant", "Olmsted and Vaux", "Burnham only", "Moses as the original designer"], 2),
            ("The Brooklyn Bridge opened in…", "1883", ["1776", "1811", "1883", "1931"], 2),
            ("The subway's first IRT line opened in…", "1904", ["1863 as the IRT", "1904", "1932 as the first subway", "1950"], 3),
            ("Broadway as a street runs the length of…", "Manhattan (and beyond)", ["only the Theater District as a three-block street", "Manhattan (and beyond)", "only Brooklyn", "only Staten Island"], 2),
            ("Ellis Island is in…", "New York Harbor (shared jurisdiction lore with New Jersey)", ["the Hudson at Albany", "New York Harbor (shared jurisdiction lore with New Jersey)", "Long Island Sound only", "Jamaica Bay only"], 2),
            ("The Apollo Theater is in…", "Harlem", ["Greenwich Village", "Harlem", "DUMBO", "Riverdale"], 1),
            ("Wall Street is in…", "Lower Manhattan", ["Midtown only", "Lower Manhattan", "the Bronx", "Queens"], 1),
            ("Grand Central is in…", "Midtown", ["Downtown Brooklyn", "Midtown", "Harlem", "Staten Island"], 1),
            ("The Cloisters museum is in…", "Fort Tryon Park / northern Manhattan", ["Coney Island", "Fort Tryon Park / northern Manhattan", "JFK", "Red Hook"], 3),
            ("Rockefeller Center is in…", "Midtown", ["Battery Park", "Midtown", "Astoria", "Park Slope"], 1),
        ],
        "arts": [
            ("Broadway theatre is concentrated around…", "Times Square / Midtown", ["Wall Street", "Times Square / Midtown", "Coney Island", "the Cloisters"], 1),
            ("MoMA is in…", "Midtown Manhattan", ["Brooklyn Heights", "Midtown Manhattan", "Staten Island", "the Bronx Zoo grounds"], 1),
        ],
        "food": [
            ("A New York slice is typically…", "wide, foldable, thin-crust pizza", ["deep-dish only", "wide, foldable, thin-crust pizza", "Detroit pan only", "a bagel"], 1),
            ("A chopped cheese is a sandwich of…", "Upper Manhattan / the Bronx bodegas", ["only Staten Island diners as the birth", "Upper Manhattan / the Bronx bodegas", "only Long Island diners", "only New Jersey diners as this name"], 3),
        ],
    },
    "sf": {
        "local": [
            ("The Golden Gate Bridge's color is officially…", "international orange", ["gold leaf", "international orange", "navy blue", "forest green"], 2),
            ("Alcatraz is in…", "San Francisco Bay", ["the Pacific a mile west of the Farallones as the rock", "San Francisco Bay", "Tahoe", "the Delta only"], 1),
            ("Lombard Street's crooked block is on…", "Russian Hill", ["Twin Peaks only", "Russian Hill", "Bayview only", "the Sunset only"], 2),
            ("The Castro is a historic…", "LGBTQ+ neighborhood", ["financial district only", "LGBTQ+ neighborhood", "naval yard", "airport"], 1),
            ("Mission District murals are concentrated on…", "Balmy and Clarion alleys (among others)", ["the Golden Gate's towers", "Balmy and Clarion alleys (among others)", "Alcatraz's rec yard only", "the Presidio golf greens only"], 3),
            ("The Presidio is a…", "former Army post, now a park", ["baseball park only", "former Army post, now a park", "university only", "subway yard"], 2),
            ("Coit Tower stands on…", "Telegraph Hill", ["Twin Peaks", "Telegraph Hill", "Mount Davidson", "Bernal Heights only as the tower"], 2),
            ("The Embarcadero faces…", "the Bay", ["the ocean beach only", "the Bay", "the Santa Cruz mountains only", "Tahoe"], 1),
            ("Ocean Beach faces the…", "Pacific", ["Bay Bridge anchorage only", "Pacific", "Delta", "Carquinez"], 1),
            ("BART is the region's…", "rapid-transit rail", ["only cable-car company", "rapid-transit rail", "ferry-only system as the name", "airport code"], 1),
            ("A San Francisco cable car is a…", "moving-cable street railway", ["subway", "moving-cable street railway", "monorail", "maglev"], 1),
            ("The Painted Ladies of Postcard Row face…", "Alamo Square", ["Oracle Park", "Alamo Square", "Fort Point", "Lands End only"], 2),
        ],
        "food": [
            ("A Mission burrito is associated with…", "San Francisco's Mission District", ["the Castro as the burrito's name", "San Francisco's Mission District", "North Beach as the burrito", "Fisherman's Wharf as the burrito's birth"], 1),
            ("Cioppino on the wharf is a…", "San Francisco seafood stew", ["Mission burrito", "San Francisco seafood stew", "sourdough starter only", "Irish coffee only"], 2),
            ("Sourdough in San Francisco is famed for its…", "wild starter and tang", ["absence of yeast of any kind as a legal definition", "wild starter and tang", "use of only baking powder", "corn masa"], 1),
        ],
        "arts": [
            ("City Lights Bookstore is in…", "North Beach", ["the Sunset", "North Beach", "Bayview", "Hunter's Point shipyard"], 2),
            ("The Fillmore is a…", "historic music hall", ["baseball park", "historic music hall", "courthouse", "ferry"], 2),
        ],
    },
    "london": {
        "local": [
            ("The Thames is tidal through…", "London", ["Manchester", "London", "Birmingham", "Edinburgh"], 1),
            ("The Tube is London's…", "underground railway", ["bus only", "underground railway", "airport", "river taxi only as the name"], 1),
            ("Big Ben is properly the…", "Great Bell (the Elizabeth Tower holds it)", ["whole Houses of Parliament", "Great Bell (the Elizabeth Tower holds it)", "Tower Bridge", "a palace at Kew"], 2),
            ("Tower Bridge is not the same as the…", "Tower of London", ["Shard", "Tower of London", "London Eye", "Gherkin"], 1),
            ("The Tower of London has long housed the…", "Crown Jewels (among other uses)", ["Bank of England gold only as this site", "Crown Jewels (among other uses)", "BBC archives only", "Wimbledon trophies only"], 1),
            ("Westminster Abbey is a…", "church of coronations and burials", ["palace of the PM as the house", "church of coronations and burials", "football ground", "market"], 1),
            ("The London Eye stands on the…", "South Bank", ["in Hyde Park as the wheel", "South Bank", "at Greenwich as the only wheel", "in the City's square mile as a parish wheel"], 2),
            ("Greenwich is famed for the…", "Prime Meridian and the old Royal Observatory", ["Tower ravens", "Prime Meridian and the old Royal Observatory", "Wembley only", "Heathrow only"], 1),
            ("The City of London, legally, is…", "the historic square mile of finance", ["all of Greater London as a legal identity of this name", "the historic square mile of finance", "only Westminster", "only Southwark"], 2),
            ("Camden Market is in…", "north London", ["Greenwich", "north London", "Croydon only", "Heathrow"], 2),
            ("Notting Hill is famed for a…", "Carnival", ["hogmanay", "Carnival", "Hogwarts fan park as the borough's name", "highland games"], 2),
            ("The Shard is a…", "skyscraper near London Bridge", ["bridge", "skyscraper near London Bridge", "market", "palace"], 1),
        ],
        "arts": [
            ("The West End is London's…", "theatre district", ["finance square mile only as this name", "theatre district", "docklands only", "airport"], 1),
            ("Tate Modern is in a former…", "power station", ["palace", "power station", "cathedral", "prison only"], 2),
            ("The British Museum is in…", "Bloomsbury", ["Greenwich", "Bloomsbury", "South Kensington only as this museum", "the City's guildhall"], 2),
        ],
        "food": [
            ("A full English breakfast often includes…", "eggs, bacon, sausage, beans, tomato, toast (and more)", ["only croissants", "eggs, bacon, sausage, beans, tomato, toast (and more)", "only sushi", "only porridge as a legal definition"], 1),
            ("Pie and mash is a…", "London working-class plate (eel liquor in the old shops)", ["Scots breakfast", "London working-class plate (eel liquor in the old shops)", "Welsh rarebit as this name", "Irish stew as this name"], 3),
        ],
    },
    "chicago": {
        "local": [
            ("The Loop is Chicago's…", "downtown core, named for the 'L'", ["lakefront beach only", "downtown core, named for the 'L'", "airport", "stockyard still operating as the name"], 1),
            ("The 'L' is Chicago's…", "elevated (and subway) rapid transit", ["commuter ferry", "elevated (and subway) rapid transit", "highway only", "riverwalk only"], 1),
            ("Lake Michigan is to Chicago's…", "east", ["west", "east", "only south", "only north as a river"], 1),
            ("The Chicago River was famously reversed to flow…", "away from the lake (toward the Mississippi system)", ["into Lake Superior", "away from the lake (toward the Mississippi system)", "into the Ohio only as a natural mouth", "into the Gulf at Chicago"], 2),
            ("Millennium Park's Cloud Gate is nicknamed…", "the Bean", ["the Spike", "the Bean", "the Arch", "the Onion"], 1),
            ("The Willis Tower was long called the…", "Sears Tower", ["Hancock only", "Sears Tower", "Tribune Tower only", "Marina City"], 1),
            ("Wrigley Field is in…", "the North Side", ["the Loop only", "the North Side", "Hyde Park only", "Midway"], 1),
            ("Guaranteed Rate / Sox Park is on the…", "South Side", ["North Side", "South Side", "in Evanston", "in Gary as the Sox"], 2),
            ("Navy Pier juts into…", "Lake Michigan", ["the Chicago River only as a pier of that name", "Lake Michigan", "the Sanitary Canal only", "Lake Superior"], 1),
            ("The Magnificent Mile is along…", "Michigan Avenue", ["State Street only as this mile", "Michigan Avenue", "Lake Shore Drive's whole length as a shopping mall", "Halsted only"], 2),
            ("Hyde Park is home to the…", "University of Chicago (and the Museum of Science and Industry nearby)", ["only O'Hare", "University of Chicago (and the Museum of Science and Industry nearby)", "only Wrigley", "only Midway's terminals"], 2),
            ("The Art Institute sits on…", "Michigan Avenue downtown", ["the far South Side only", "Michigan Avenue downtown", "O'Hare", "Navy Pier only as its only site"], 1),
        ],
        "food": [
            ("Chicago deep-dish is a…", "tall, buttery-crust pizza", ["thin New York slice", "tall, buttery-crust pizza", "Detroit pan as this city's name", "a hot dog"], 1),
            ("A Chicago hot dog is not to be…", "ketchup'd (in the local commandment)", ["put in a bun", "ketchup'd (in the local commandment)", "given sport peppers", "given pickle"], 2),
            ("Italian beef is a Chicago…", "thin-sliced roast-beef sandwich, often dipped", ["deep-dish topping only", "thin-sliced roast-beef sandwich, often dipped", "hot dog", "rib tip only"], 1),
        ],
        "arts": [
            ("Second City is a…", "comedy theater / school", ["opera house only", "comedy theater / school", "football club", "newspaper only"], 2),
            ("The Chicago Symphony Orchestra's hall is…", "Orchestra Hall on Michigan Avenue", ["Wrigley", "Orchestra Hall on Michigan Avenue", "the Bean as a hall", "O'Hare Terminal 5"], 2),
        ],
    },
    "detroit": {
        "local": [
            ("Detroit sits on which river, across from Windsor?", "the Detroit River", ["the Rouge only as the international line", "the Detroit River", "the St. Clair only as downtown", "the Hudson"], 1),
            ("Motown Records was founded in…", "Detroit", ["Chicago", "Detroit", "Cleveland", "Memphis as this label"], 1),
            ("The Renaissance Center is a…", "riverfront tower cluster (GM's headquarters among tenants)", ["auto plant only in Dearborn as this name", "riverfront tower cluster (GM's headquarters among tenants)", "baseball park", "airport"], 2),
            ("Belle Isle is a…", "park island in the Detroit River", ["suburb in Ohio", "park island in the Detroit River", "factory in Flint", "lake in Michigan's U.P. only"], 2),
            ("The Guardian Building is a…", "Art Deco skyscraper downtown", ["auto plant", "Art Deco skyscraper downtown", "stadium", "bridge to Canada only"], 3),
            ("Campus Martius is a…", "downtown park / square", ["Ford's Rouge plant", "downtown park / square", "airport", "cemetery of the auto barons only"], 2),
            ("The Ambassador Bridge links Detroit to…", "Windsor, Ontario", ["Toledo", "Windsor, Ontario", "Cleveland", "Chicago"], 1),
            ("A tunnel also links Detroit to…", "Windsor", ["Toronto", "Windsor", "Buffalo", "Montreal"], 2),
            ("Dearborn is home to…", "Ford's historic Rouge and The Henry Ford", ["GM's only plant as this city's name", "Ford's historic Rouge and The Henry Ford", "Motown's Hitsville as the only site", "the Lions' original Tiger Stadium"], 2),
            ("Hitsville U.S.A. is the…", "original Motown house on West Grand", ["Renaissance Center", "original Motown house on West Grand", "Tiger Stadium", "the Guardian Building"], 2),
            ("The QLine is a…", "streetcar on Woodward", ["people-mover in the suburbs only", "streetcar on Woodward", "ferry to Belle Isle as the name", "highway"], 3),
            ("Woodward Avenue is Detroit's famous…", "north-south corridor toward the suburbs", ["international border crossing to Ohio", "north-south corridor toward the suburbs", "only airport runway", "only a freeway with no street name"], 2),
        ],
        "food": [
            ("Detroit-style pizza is…", "square, airy, and baked in a pan", ["a New York fold", "square, airy, and baked in a pan", "Chicago deep-dish as this name", "a cone"], 1),
            ("A Coney dog in Detroit is a…", "chili dog in the local Greek-diner tradition", ["lobster roll", "chili dog in the local Greek-diner tradition", "Italian beef", "hot chicken"], 1),
        ],
        "arts": [
            ("The Motown sound is built on…", "pop, soul, and a house band (the Funk Brothers)", ["only techno as Hitsville", "pop, soul, and a house band (the Funk Brothers)", "only punk of the Grande", "only gospel of the South as this label's only style"], 2),
            ("Detroit techno's early geography is…", "the city and its Black electronic musicians of the 1980s", ["only Berlin as the birth", "the city and its Black electronic musicians of the 1980s", "only Chicago house as this name", "only Kraftwerk's studio in Düsseldorf as Detroit"], 3),
        ],
        "sports": [
            ("The Lions play downtown at…", "Ford Field", ["Comerica as football", "Ford Field", "Little Caesars as football only", "the old Silverdome still"], 1),
            ("The Tigers play at…", "Comerica Park", ["Ford Field", "Comerica Park", "Joe Louis Arena still", "the Palace of Auburn Hills still"], 1),
        ],
    },
    "tucson": {
        "local": [
            ("Tucson sits in which desert?", "the Sonoran", ["the Mojave", "the Sonoran", "the Great Basin only", "the Chihuahuan only as the city's desert"], 1),
            ("Saguaro National Park flanks Tucson on the…", "east and west", ["only the north as a single unit", "east and west", "only the south as a park of organ pipe", "only the city center"], 2),
            ("The University of Arizona is in…", "Tucson", ["Phoenix", "Tucson", "Flagstaff", "Yuma"], 1),
            ("Tucson's historic core includes…", "the Presidio and downtown", ["only the airport", "the Presidio and downtown", "only Kitt Peak as downtown", "only Nogales"], 2),
            ("Fourth Avenue is a…", "district of shops and the street fair", ["interstate", "district of shops and the street fair", "dry river only", "mine"], 2),
            ("The Santa Cruz River through Tucson is often…", "dry at the surface", ["a year-round barge canal", "dry at the surface", "a Great Lake", "tidal"], 2),
            ("Mount Lemmon is in the…", "Santa Catalinas", ["Grand Canyon", "Santa Catalinas", "White Mountains of N.H.", "Rockies of Colorado only"], 2),
            ("Kitt Peak is a…", "observatory west of town", ["ballpark", "observatory west of town", "capitol", "presidio of Spain still garrisoned"], 2),
            ("Tucson is in which county?", "Pima", ["Maricopa", "Pima", "Coconino", "Yavapai"], 2),
            ("The Tohono O'odham Nation borders Tucson to the…", "west and south (among other lands)", ["only the Utah line", "west and south (among other lands)", "only New Mexico", "only California"], 3),
            ("Old Tucson is a…", "movie-studio / park west of the city", ["university", "movie-studio / park west of the city", "capitol", "airport"], 3),
            ("Davis-Monthan is an…", "Air Force base famed for the boneyard", ["naval yard", "Air Force base famed for the boneyard", "Army fort of cavalry only as this name", "civilian only airport of Phoenix"], 2),
        ],
        "food": [
            ("Tucson is a UNESCO City of…", "Gastronomy", ["Music only as this title", "Gastronomy", "Literature only", "Film only"], 2),
            ("Sonoran hot dogs are wrapped in…", "bacon and piled with beans, onion, tomato, mayo, mustard, jalapeño (the local stack)", ["only sauerkraut", "bacon and piled with beans, onion, tomato, mayo, mustard, jalapeño (the local stack)", "only chili of Cincinnati", "only ketchup as the law"], 2),
            ("White Sonora wheat and mesquite are part of…", "the Borderlands food story", ["New England baking only", "the Borderlands food story", "Pacific Northwest salmon only", "Cajun roux only"], 3),
        ],
        "nature": [
            ("A saguaro is a…", "tall columnar cactus of the Sonoran Desert", ["tree of the taiga", "tall columnar cactus of the Sonoran Desert", "kelp", "mangrove"], 1),
            ("The monsoon in southern Arizona is a…", "summer thunderstorm season", ["winter only snow", "summer thunderstorm season", "year-round drizzle of Seattle as this name", "hurricane of the Gulf as Tucson's weather"], 2),
        ],
    },
    "toronto": {
        "local": [
            ("The CN Tower was built as a…", "communications and observation tower", ["only a stadium", "communications and observation tower", "only a mall", "parliament"], 1),
            ("Toronto sits on which Great Lake?", "Ontario", ["Superior", "Michigan", "Huron", "Ontario"], 1),
            ("The PATH is Toronto's…", "downtown underground walkway", ["subway as this brand name", "downtown underground walkway", "airport code", "ferry to Niagara"], 2),
            ("Yonge Street is a…", "long north–south artery (and a historic length boast)", ["only a subway yard", "long north–south artery (and a historic length boast)", "only a lake shore of Muskoka", "only a highway in Ottawa"], 2),
            ("Queen's Park is the site of…", "Ontario's legislature", ["Parliament in Ottawa as this park", "Ontario's legislature", "the CN Tower", "Casa Loma only"], 2),
            ("Casa Loma is a…", "hilltop mansion / castle folly", ["subway station only", "hilltop mansion / castle folly", "ballpark", "island airport terminal"], 2),
            ("The Distillery District is a…", "Victorian industrial precinct turned arts and shops", ["financial tower cluster only", "Victorian industrial precinct turned arts and shops", "university campus of Waterloo", "port of Hamilton"], 2),
            ("Toronto Islands lie in…", "Lake Ontario, south of downtown", ["Lake Superior", "Lake Ontario, south of downtown", "Georgian Bay only", "the Ottawa River"], 1),
            ("Billy Bishop is an…", "island airport downtown", ["only Pearson as this name", "island airport downtown", "union station", "ferry to Rochester"], 2),
            ("Pearson is Toronto's…", "main international airport", ["island downtown strip", "main international airport", "union station", "CN Tower elevator"], 1),
            ("Union Station is the…", "main intercity and GO rail hub downtown", ["city hall", "main intercity and GO rail hub downtown", "CN Tower", "aquarium only"], 1),
            ("St. Lawrence Market is a…", "historic market downtown", ["stadium", "historic market downtown", "university", "island"], 2),
        ],
        "food": [
            ("A peameal bacon sandwich is a…", "Toronto St. Lawrence classic", ["Montreal smoked meat as this name", "Toronto St. Lawrence classic", "poutine of Quebec as this name", "beaver tail as this sandwich"], 2),
            ("Toronto's Chinatown and Kensington are…", "adjacent downtown food and shop districts", ["only suburbs of Mississauga as these names", "adjacent downtown food and shop districts", "only Ottawa", "only Niagara"], 2),
        ],
        "sports": [
            ("The Maple Leafs play hockey at…", "Scotiabank Arena", ["Rogers Centre as hockey only", "Scotiabank Arena", "BMO Field", "the Gardens still as the current arena's name"], 1),
            ("The Blue Jays play at…", "Rogers Centre", ["Scotiabank Arena", "Rogers Centre", "BMO Field", "Tim Hortons Field in Hamilton as the Jays"], 1),
        ],
        "arts": [
            ("TIFF is a…", "film festival", ["fashion week only as this acronym in Toronto", "film festival", "food fair only", "marathon"], 1),
        ],
    },
    "la": {
        "local": [
            ("Los Angeles is in which county of the same name, plus it sprawls into…", "a basin and valleys of Southern California", ["the Bay Area as its county", "a basin and valleys of Southern California", "the Central Valley as the city limit", "the Mojave as downtown"], 1),
            ("Hollywood is a…", "district of Los Angeles", ["separate city of Orange County", "district of Los Angeles", "neighborhood of Burbank only as the legal city", "part of Santa Monica only"], 1),
            ("The Hollywood Sign is mounted on…", "Mount Lee / the Hollywood Hills", ["Palos Verdes", "Mount Lee / the Hollywood Hills", "Catalina", "downtown's Bunker Hill only"], 2),
            ("Griffith Observatory looks over…", "the basin and the Hollywood Sign", ["only Catalina as its view", "the basin and the Hollywood Sign", "only Palm Springs", "only San Diego"], 1),
            ("Wilshire Boulevard runs…", "from downtown toward the sea (the Miracle Mile among stretches)", ["only along the 405 as a loop", "from downtown toward the sea (the Miracle Mile among stretches)", "only in Orange County", "only in the Valley as a north–south"], 2),
            ("Sunset Boulevard runs…", "from downtown through Hollywood toward the coast", ["only in Long Beach", "from downtown through Hollywood toward the coast", "only in Pasadena as a freeway", "only to Palm Springs"], 2),
            ("The 405 is a…", "freeway through the Westside and Valley approaches", ["subway", "freeway through the Westside and Valley approaches", "river", "runway"], 1),
            ("Union Station is in…", "downtown L.A.", ["Santa Monica", "downtown L.A.", "LAX's terminals", "Pasadena only"], 1),
            ("LAX is Los Angeles's…", "main airport", ["only port", "main airport", "city hall", "subway yard"], 1),
            ("The Port of Los Angeles is at…", "San Pedro / Wilmington", ["Santa Monica Pier as the container port", "San Pedro / Wilmington", "Malibu", "Burbank"], 2),
            ("Venice Beach is known for a…", "boardwalk and muscle beach", ["container port", "boardwalk and muscle beach", "observatory", "studio backlot only"], 1),
            ("Angels Flight downtown is a…", "tiny funicular on Bunker Hill", ["airport tram of LAX as this name", "tiny funicular on Bunker Hill", "subway to Long Beach", "ferry to Catalina"], 3),
            ("Bunker Hill downtown was reshaped by…", "redevelopment towers and cultural buildings", ["only oil derricks still", "redevelopment towers and cultural buildings", "only a mission as the skyline", "only a harbor"], 3),
            ("The L.A. River is a…", "mostly channelized watercourse through the basin", ["year-round barge canal to the Midwest", "mostly channelized watercourse through the basin", "Great Lake", "tidal fjord"], 2),
        ],
        "food": [
            ("The French Dip's origin story is fought over by…", "Philippe's and Cole's in L.A.", ["two stands in Austin", "Philippe's and Cole's in L.A.", "two shacks in New Orleans", "two carts in Portland"], 3),
            ("A California burrito often includes…", "fries", ["only rice as a Mission clone", "fries", "only spaghetti", "only cole slaw"], 2),
            ("In-N-Out Burger was born in…", "the Los Angeles area (Baldwin Park)", ["San Francisco", "the Los Angeles area (Baldwin Park)", "San Diego as the first stand of this name only in lore of another chain", "Sacramento"], 2),
        ],
        "arts": [
            ("The Getty Center campus sits in the…", "Santa Monica Mountains foothills / Brentwood side", ["downtown's river channel", "Santa Monica Mountains foothills / Brentwood side", "Long Beach port", "LAX"], 2),
            ("LACMA is on…", "Wilshire's Miracle Mile", ["the Venice boardwalk", "Wilshire's Miracle Mile", "Catalina", "Pasadena's Rose Bowl as the museum"], 2),
        ],
        "sports": [
            ("Dodger Stadium sits in…", "Chavez Ravine", ["Inglewood", "Chavez Ravine", "Pasadena", "Long Beach"], 2),
            ("SoFi Stadium is in…", "Inglewood", ["downtown L.A.", "Inglewood", "Pasadena", "Anaheim"], 2),
        ],
    },
    "boston": {
        "local": [
            ("The Freedom Trail is a…", "walking line of Revolutionary sites", ["subway only", "walking line of Revolutionary sites", "highway to New York", "ferry to Provincetown only as this name"], 1),
            ("Beacon Hill is known especially for…", "brick rows and the State House", ["the airport", "brick rows and the State House", "Fenway as the hill of seats", "the harbor islands only"], 1),
            ("The Charles River in Boston faces…", "Cambridge (and others)", ["Salem", "Cambridge (and others)", "Providence", "Worcester downtown"], 1),
            ("The T is Boston's…", "transit system (MBTA)", ["baseball team", "transit system (MBTA)", "university", "newspaper"], 1),
            ("The Green Monster is a…", "left-field wall at Fenway", ["subway line", "left-field wall at Fenway", "harbor fort", "hill in Brookline only"], 1),
            ("Faneuil Hall is a…", "meeting hall and market landmark", ["ballpark", "meeting hall and market landmark", "university chapel only", "airport"], 1),
            ("The North End is Boston's historic…", "Italian district (among older layers)", ["Chinatown as this name", "Italian district (among older layers)", "only the Seaport as this name", "only Back Bay as this name"], 2),
            ("Back Bay's streets are…", "alphabetical from the Public Garden out (Arlington, Berkeley…)", ["numbered like Manhattan only", "alphabetical from the Public Garden out (Arlington, Berkeley…)", "only alleys of the North End", "a cow-path with no plan"], 3),
            ("The Public Garden is next to the…", "Boston Common", ["Fenway Park as a garden", "Boston Common", "Logan terminals", "Harvard Yard as a Boston park of this name"], 1),
            ("Logan Airport sits in…", "East Boston", ["Cambridge", "East Boston", "Brookline", "Somerville"], 2),
            ("The Ted Williams Tunnel is part of the…", "Big Dig", ["Green Monster", "Big Dig", "Freedom Trail as a tunnel", "T's Red Line as this name"], 2),
            ("Harvard is in…", "Cambridge", ["Boston proper as the Yard's city", "Cambridge", "Somerville as the Yard", "Brookline"], 1),
            ("MIT is in…", "Cambridge", ["Boston's Back Bay as the Infinite", "Cambridge", "Quincy", "Salem"], 1),
            ("The State House's dome is famously…", "gilded", ["granite raw", "gilded", "glass", "thatch"], 2),
        ],
        "food": [
            ("Boston cream pie is a…", "custard cake with chocolate glaze", ["apple pie", "custard cake with chocolate glaze", "whoopie pie as this name", "cannoli"], 1),
            ("A lobster roll in New England is often…", "warm butter or mayo on a split-top bun", ["a deep-dish pizza", "warm butter or mayo on a split-top bun", "a Coney dog", "a po' boy of roast beef only"], 1),
            ("Clam chowder in Boston is typically…", "cream-based (New England)", ["red Manhattan as the house law", "cream-based (New England)", "clear Rhode Island as the only Boston bowl", "tomato only"], 1),
        ],
        "arts": [
            ("The Boston Symphony plays in…", "Symphony Hall", ["Fenway", "Symphony Hall", "Faneuil as a concert hall of this name", "the State House"], 1),
            ("The MFA is the…", "Museum of Fine Arts, Boston", ["only Isabella Stewart Gardner as this acronym", "Museum of Fine Arts, Boston", "only Harvard's Fogg as this acronym", "only the ICA as this acronym"], 2),
        ],
        "sports": [
            ("The Celtics play at…", "TD Garden", ["Fenway", "TD Garden", "Gillette", "Harvard Stadium as the NBA"], 1),
            ("The Bruins play at…", "TD Garden", ["Fenway", "TD Garden", "Gillette", "Agganis Arena as the NHL"], 1),
        ],
    },
    "nola": {
        "local": [
            ("The French Quarter is also called the…", "Vieux Carré", ["Garden District as this name", "Vieux Carré", "Bywater as this name", "Marigny as the Quarter's legal name"], 2),
            ("Bourbon Street runs through the…", "French Quarter", ["Garden District", "French Quarter", "Audubon Park only", "Metairie cemetery only"], 1),
            ("Jackson Square faces…", "the cathedral and the river", ["only the lake", "the cathedral and the river", "only the airport", "only the Superdome"], 1),
            ("The Garden District is famed for…", "antebellum houses and streetcars", ["the Quarter's balconies only as this name", "antebellum houses and streetcars", "oil platforms", "only warehouses of the Bywater as this name"], 2),
            ("St. Charles Avenue is a…", "streetcar line under oaks", ["interstate spur only", "streetcar line under oaks", "levee of the lake only", "runway"], 1),
            ("The Mississippi at New Orleans is held by…", "levees", ["no banks", "levees", "only dunes", "fjords"], 1),
            ("Lake Pontchartrain is north of…", "the city", ["the Gulf as a lake of the Quarter", "the city", "Baton Rouge as this lake's only shore", "Houston"], 1),
            ("The Garden District's neighbor toward downtown includes the…", "Central Business District / Warehouse District", ["only the Rigolets", "Central Business District / Warehouse District", "only Chalmette as downtown", "only Kenner downtown"], 2),
            ("Congo Square is in…", "Louis Armstrong Park / Treme", ["the Garden District", "Louis Armstrong Park / Treme", "Metairie", "the West Bank as this square"], 3),
            ("Treme is a historic…", "African American neighborhood next to the Quarter", ["only a suburb of Baton Rouge", "African American neighborhood next to the Quarter", "only the East as a new landfill", "only the river batture of Algiers as this name"], 2),
            ("The West Bank is…", "across the Mississippi from downtown", ["north of the lake only", "across the Mississippi from downtown", "the French Quarter's other name", "Baton Rouge"], 2),
            ("Mardi Gras Indians are…", "Black masking traditions of the city", ["a tourist krewe from Dallas only", "Black masking traditions of the city", "a Carnival of Mobile as this city's only story", "a jazz funeral's only name"], 3),
            ("A jazz funeral often includes a…", "second line", ["ski jump", "second line", "ice palace", "tea ceremony"], 1),
            ("Above-ground tombs in New Orleans are a response in part to…", "a high water table", ["only fashion of Paris as the only reason", "a high water table", "permafrost", "bedrock deeper than the Grand Canyon as a must"], 2),
        ],
        "food": [
            ("A po' boy is a…", "New Orleans sandwich on French bread", ["Chicago beef", "New Orleans sandwich on French bread", "lobster roll", "cheesesteak"], 1),
            ("A muffuletta is stacked with…", "Italian meats, cheese, and olive salad", ["only roast beef debris as this name", "Italian meats, cheese, and olive salad", "only fried shrimp as this name", "only white gravy"], 2),
            ("Beignets at the Café du Monde are served with…", "powdered sugar", ["gravy", "powdered sugar", "chili", "syrup of cane only as the law"], 1),
            ("Gumbo is often thickened with…", "roux, okra, and/or filé", ["only cornstarch as the Creole law", "roux, okra, and/or filé", "only gelatin", "only cream"], 2),
            ("Jambalaya is a…", "rice dish of meat and the trinity", ["only a pastry", "rice dish of meat and the trinity", "only a cocktail", "only a salad of greens"], 1),
        ],
        "arts": [
            ("Preservation Hall presents…", "traditional New Orleans jazz", ["opera in Latin", "traditional New Orleans jazz", "only brass of marching D.C.", "only country of the Opry"], 1),
            ("Congo Square is a historic site of…", "African and Afro-Caribbean music and gathering", ["only British musters", "African and Afro-Caribbean music and gathering", "only opera", "only film studios of Hollywood"], 2),
        ],
        "sports": [
            ("The Saints play at the…", "Caesars Superdome", ["Smoothie King as football only", "Caesars Superdome", "Tad Gormley as the NFL", "Tulane's old home as the only NFL house"], 1),
        ],
    },
}


def emit_cities() -> None:
    lines = [
        'import { q } from "../quiz";',
        'import type { CityId, TriviaCat, TriviaQ } from "../types";',
        "",
        "export const CITY_EXTRA: Record<CityId, Partial<Record<TriviaCat, TriviaQ[]>>> = {",
    ]
    n = 0
    for city, cats in CITY_EXTRA.items():
        lines.append(f"  {city}: {{")
        for cat, rows in cats.items():
            lines.append(f"    {cat}: [")
            for prompt, ans, ch, d in rows:
                if ans not in ch:
                    raise SystemExit(f"city ans missing {city} {prompt}")
                n += 1
                chs = ", ".join(js(c) if isinstance(c, str) else js(str(c)) for c in ch)
                lines.append(f"      q({js(prompt)}, [{chs}], {js(ans)}, {d}),")
            lines.append("    ],")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    path = OUT / "cities.ts"
    path.write_text("\n".join(lines) + "\n")
    print("wrote", path, "n=", n)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    gen_math()
    gen_science()
    gen_history()
    gen_nature()
    emit_cities()


if __name__ == "__main__":
    main()
