"""Keyline 0.1.8 car art generator (run: python3 scripts/art/cars-gen.py).
Chunky storybook style matching the cab: dark ink outline, painted body gradient, tinted glass with a
reflection, spoked wheels. Each car has side (faces right; left = mirrored in CSS), front and back views.
Silhouettes follow the real cars' proportions (length:height compressed ~0.75 like the cab):
  Civic: 11th-gen sedan, long hood, fastback-ish C-pillar, thin LED lights, C-shaped tails.
  F-150: 14th-gen crew cab, tall flat hood, big bar grille, C-clamp headlights, bed.
  Mustang GT: S650 fastback, long hood + short deck, shark nose, tri-bar tails.
  Roadster (2008-12): Elise-based open two-seater, no roof, low windshield, headrests, side intake.
  Roadster 2.0 (next-gen): low wide wedge, long sloping glass canopy, thin full-width light bars.
"""
import math, os
OUT = os.path.join(os.path.dirname(__file__), "../../public/sprites/cars")
INK = "#21160f"
SW = 'stroke="%s" stroke-width' % INK

def wheel(x, y, r, rim, n=6):
    s = f'<circle cx="{x}" cy="{y}" r="{r}" fill="#17171b" {SW}="3"/>'
    s += f'<circle cx="{x}" cy="{y}" r="{r*.62:.1f}" fill="{rim}" {SW}="1.5"/>'
    for i in range(n):
        a = i * 2 * math.pi / n - math.pi / 2
        s += f'<path d="M{x} {y} L{x+math.cos(a)*r*.56:.1f} {y+math.sin(a)*r*.56:.1f}" stroke="#4f545c" stroke-width="2.2"/>'
    s += f'<circle cx="{x}" cy="{y}" r="{r*.18:.1f}" fill="#33363c"/>'
    s += f'<path d="M{x-r*.45:.1f} {y-r*.32:.1f} A{r*.55:.1f} {r*.55:.1f} 0 0 1 {x+r*.12:.1f} {y-r*.55:.1f}" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none"/>'
    return s

def arch(x, y, r):
    return f'<path d="M{x-r-5} {y+2} A{r+5} {r+5} 0 0 1 {x+r+5} {y+2} Z" fill="#0d0b0a"/>'

C = {
 "civic": dict(body="#c3c9d1", dark="#7a828d", lite="#f1f4f8", glass="#2b3d52", rim="#c9ced6"),
 "f150": dict(body="#2f5f9e", dark="#1b3760", lite="#86abdc", glass="#22323f", rim="#d5d9df"),
 "mustang": dict(body="#d02a2a", dark="#7a1212", lite="#ff8f80", glass="#1d2733", rim="#2b2b30"),
 "roadster": dict(body="#2e8a5a", dark="#174f37", lite="#93e3b4", glass="#1c2a30", rim="#c9ced6"),
 "roadster2": dict(body="#e21b2c", dark="#6f0913", lite="#ff9aa2", glass="#121a26", rim="#e8ecf2"),
}

SIDE = {
 "civic": dict(
   shape="M18 92 L18 74 Q18 66 26 64 L58 62 Q68 60 76 54 Q88 42 100 40 L128 40 Q136 41 142 46 L154 60 L182 64 Q194 67 194 78 L194 88 Q194 94 188 94 L24 94 Q18 94 18 92 Z",
   win="M80 59 Q92 46 101 45 L111 45 L111 59 Z M115 59 L115 45 L127 45 Q133 46 137 50 L146 59 Z",
   wheels=[(50, 91, 15), (158, 91, 15)],
   extra=lambda c: f'''<path d="M24 72 Q100 68 190 70" stroke="{c['dark']}" stroke-width="1.6" fill="none"/>
<path d="M113 62 L113 88 M76 62 L72 86" stroke="{c['dark']}" stroke-width="1.4"/>
<path d="M146 60 L152 56 L156 60 Z" fill="{c['dark']}" {SW}="1.5"/>
<path d="M18 66 L30 65 L28 71 L18 72 Z" fill="#c0392b" {SW}="1.8"/>
<path d="M178 66 L194 70 L193 74 L180 71 Z" fill="#fff4cf" {SW}="1.8"/>
<path d="M176 86 L194 86" stroke="#15171b" stroke-width="4"/>'''),
 "f150": dict(
   shape="M10 90 L10 50 Q10 46 14 46 L86 46 L88 24 Q89 20 94 20 L146 20 Q152 20 155 25 L166 44 L192 46 Q198 47 198 54 L198 88 Q198 94 192 94 L16 94 Q10 94 10 90 Z",
   win="M93 42 L95 26 L118 26 L118 42 Z M122 42 L122 26 L146 26 Q150 26 152 30 L159 42 Z",
   wheels=[(46, 88, 18), (162, 88, 18)],
   extra=lambda c: f'''<path d="M87 46 L87 84" stroke="{INK}" stroke-width="2.4"/>
<path d="M14 50 L84 50" stroke="{c['dark']}" stroke-width="3"/>
<path d="M120 46 L120 84 M152 46 L152 74" stroke="{c['dark']}" stroke-width="1.5"/>
<path d="M90 60 L196 60" stroke="{c['lite']}" stroke-opacity=".5" stroke-width="1.5"/>
<path d="M188 50 L198 50 L198 66 L192 66 L192 56 L188 56 Z" fill="#fff4cf" {SW}="1.8"/>
<rect x="190" y="68" width="8" height="14" fill="#3a3f47" {SW}="1.5"/>
<rect x="10" y="52" width="6" height="16" rx="1.5" fill="#c0392b" {SW}="1.8"/>
<rect x="92" y="86" width="56" height="5" rx="2" fill="#2a2d33" {SW}="1.5"/>
<path d="M26 92 Q28 66 46 64 Q64 66 66 92 M142 92 Q144 66 162 64 Q180 66 182 92" fill="none" stroke="#141519" stroke-width="5"/>'''),
 "mustang": dict(
   shape="M14 88 L14 68 Q14 63 21 62 L44 60 Q58 56 72 46 Q84 38 98 38 L110 38 Q120 39 128 50 L134 57 L178 62 Q192 64 196 72 L196 86 Q196 94 188 94 L20 94 Q14 94 14 88 Z",
   win="M62 57 Q74 47 86 44 L102 43 L102 57 Z M106 57 L106 43 L111 43 Q118 44 124 52 L127 57 Z",
   wheels=[(48, 90, 16), (160, 90, 16)],
   extra=lambda c: f'''<path d="M44 60 L38 56 L22 58" fill="none" {SW}="2.5"/>
<path d="M150 60 L168 61 L164 57 L154 57 Z" fill="#1a1a1e" {SW}="1.5"/>
<path d="M22 74 Q100 70 192 74" stroke="{c['dark']}" stroke-width="1.6" fill="none"/>
<path d="M104 60 L102 86" stroke="{c['dark']}" stroke-width="1.4"/>
<path d="M15 64 L22 64 M15 67 L22 67 M15 70 L22 70" stroke="#ff3b30" stroke-width="2"/>
<path d="M182 64 L196 70 L195 73 L184 69 Z" fill="#fff4cf" {SW}="1.8"/>
<path d="M190 80 L196 80" stroke="#15171b" stroke-width="5"/>
<text x="138" y="76" font-family="Arial Black,Arial" font-weight="900" font-size="7" fill="#2a0808">5.0</text>'''),
 "roadster": dict(
   shape="M24 90 L24 70 Q24 64 32 63 L108 62 L126 62 Q156 63 176 69 Q188 73 186 84 L186 90 Q186 94 180 94 L30 94 Q24 94 24 90 Z",
   win="M110 62 L116 47 L120 47 L128 62 Z",
   wheels=[(56, 92, 14), (152, 92, 14)],
   pre=lambda c: f'''<path d="M66 63 Q68 46 80 45 Q90 46 91 63 Z" fill="#2a2522" {SW}="2.5"/>
<path d="M86 63 Q88 50 97 49 Q105 50 106 63 Z" fill="#3a332e" {SW}="2.5"/>
<path d="M72 50 Q80 47 86 50" stroke="#6b5f55" stroke-width="1.5" fill="none"/>''',
   extra=lambda c: f'''<path d="M60 70 L76 69 L74 80 L62 80 Z" fill="#141519" {SW}="2"/>
<path d="M30 70 Q100 67 180 72" stroke="{c['dark']}" stroke-width="1.5" fill="none"/>
<path d="M24 66 Q27 63 31 66 Q27 70 24 68 Z" fill="#c0392b" {SW}="1.6"/>
<path d="M166 66 Q178 66 184 72 L176 72 Q170 70 166 66 Z" fill="#fff4cf" {SW}="1.8"/>'''),
 "roadster2": dict(
   shape="M10 86 L10 68 Q10 63 17 62 L40 58 Q68 36 108 33 Q134 33 152 46 L160 54 L194 66 Q202 70 200 80 L198 88 Q196 94 188 94 L16 94 Q10 94 10 86 Z",
   win="M44 57 Q72 39 108 37 Q130 37 147 49 L152 56 Z",
   wheels=[(48, 89, 17), (166, 89, 17)],
   extra=lambda c: f'''<path d="M46 56 Q74 40 108 38" stroke="#c9dcf0" stroke-opacity=".55" stroke-width="2" fill="none"/>
<path d="M100 58 L98 86" stroke="{c['dark']}" stroke-width="1.4"/>
<path d="M70 74 L92 72" stroke="#120507" stroke-width="3" stroke-linecap="round"/>
<path d="M16 92 L194 92" stroke="#121214" stroke-width="5"/>
<path d="M184 67 L200 73" stroke="#e8f8ff" stroke-width="2.4" stroke-linecap="round"/>
<path d="M10 64 L16 63" stroke="#ff2d55" stroke-width="2.4" stroke-linecap="round"/>
<path d="M22 78 Q110 72 194 76" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" fill="none"/>'''),
}

def side(k):
    c, s = C[k], SIDE[k]
    d = s["shape"]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208 116" width="208" height="116">
<defs><linearGradient id="b{k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c['lite']}"/><stop offset=".38" stop-color="{c['body']}"/><stop offset=".78" stop-color="{c['body']}"/><stop offset="1" stop-color="{c['dark']}"/></linearGradient>
<linearGradient id="w{k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f8aa6"/><stop offset=".5" stop-color="{c['glass']}"/><stop offset="1" stop-color="#0c1118"/></linearGradient>
<clipPath id="c{k}"><path d="{d}"/></clipPath></defs>
<ellipse cx="104" cy="107" rx="96" ry="6" fill="#000" opacity=".32"/>
{s.get('pre', lambda c: '')(c)}
<path d="{d}" fill="url(#b{k})"/>
<g clip-path="url(#c{k})"><rect x="0" y="82" width="208" height="20" fill="{c['dark']}" opacity=".45"/></g>
{''.join(arch(*w) for w in s['wheels'])}
<path d="{s['win']}" fill="url(#w{k})" {SW}="2.4" stroke-linejoin="round"/>
{s['extra'](c)}
<path d="{d}" fill="none" {SW}="3.5" stroke-linejoin="round"/>
{''.join(wheel(*w, c['rim'], 5 if k == 'f150' else 6) for w in s['wheels'])}
</svg>'''

# Front/back: (body half-width, roof half-width, roof y, belt y, bottom y, open-top)
FB = {"civic": (44, 30, 32, 60, 96, False), "f150": (52, 38, 16, 50, 98, False),
      "mustang": (46, 28, 34, 62, 96, False), "roadster": (42, 0, 46, 64, 96, True),
      "roadster2": (52, 26, 40, 64, 94, False)}

def fb(k, back):
    c = C[k]; hw, rw, top, belt, bot, open_ = FB[k]; cx = 60
    l, r = cx - hw, cx + hw
    if open_:
        body = f"M{l} {bot-6} L{l} {belt+4} Q{l} {belt-2} {l+10} {belt-3} L{r-10} {belt-3} Q{r} {belt-2} {r} {belt+4} L{r} {bot-6} Q{r} {bot} {r-6} {bot} L{l+6} {bot} Q{l} {bot} {l} {bot-6} Z"
    else:
        rl, rr = cx - rw, cx + rw
        body = f"M{l} {bot-6} L{l} {belt+5} Q{l} {belt} {l+8} {belt-2} L{rl} {top+8} Q{rl+2} {top} {rl+10} {top} L{rr-10} {top} Q{rr-2} {top} {rr} {top+8} L{r-8} {belt-2} Q{r} {belt} {r} {belt+5} L{r} {bot-6} Q{r} {bot} {r-6} {bot} L{l+6} {bot} Q{l} {bot} {l} {bot-6} Z"
    parts = []
    if k == "mustang":  # twin stripes painted under the glass and lamps
        parts.append(f'<g clip-path="url(#f{k})"><rect x="{cx-9}" y="0" width="6" height="120" fill="#141414"/><rect x="{cx+3}" y="0" width="6" height="120" fill="#141414"/></g>')
    if open_:
        # Low windshield frame with two headrests seen through/over it.
        hy = belt - 16
        parts.append(f'<path d="M{cx-26} {hy+2} Q{cx-26} {hy-6} {cx-17} {hy-6} Q{cx-9} {hy-6} {cx-9} {hy+2} L{cx-9} {belt} L{cx-26} {belt} Z M{cx+9} {hy+2} Q{cx+9} {hy-6} {cx+17} {hy-6} Q{cx+26} {hy-6} {cx+26} {hy+2} L{cx+26} {belt} L{cx+9} {belt} Z" fill="#2a2522" {SW}="2.2"/>')
        if not back:
            parts.append(f'<path d="M{l+8} {belt-2} L{l+14} {belt-12} L{r-14} {belt-12} L{r-8} {belt-2} Z" fill="url(#v{k})" fill-opacity=".55" {SW}="2.2"/>')
    else:
        g = f"M{cx-rw+5} {top+7} L{cx+rw-5} {top+7} L{r-12} {belt-4} L{l+12} {belt-4} Z"
        parts.append(f'<path d="{g}" fill="url(#v{k})" {SW}="2.4" stroke-linejoin="round"/>')
        parts.append(f'<path d="M{cx-rw+9} {top+10} L{cx-6} {top+10} L{l+20} {belt-7}" stroke="#cfe0f0" stroke-opacity=".4" stroke-width="2" fill="none"/>')
    y = belt + 4
    if k == "civic":
        if back:
            parts.append(f'<path d="M{l+3} {y} L{l+26} {y} L{l+24} {y+5} L{l+8} {y+5} L{l+6} {y+10} L{l+3} {y+10} Z M{r-3} {y} L{r-26} {y} L{r-24} {y+5} L{r-8} {y+5} L{r-6} {y+10} L{r-3} {y+10} Z" fill="#c0392b" {SW}="1.8"/>')
            parts.append(f'<rect x="{cx-13}" y="{y+16}" width="26" height="8" rx="1.5" fill="#efe9d6" {SW}="1.5"/>')
        else:
            parts.append(f'<path d="M{l+3} {y} L{l+28} {y+3} L{l+26} {y+7} L{l+4} {y+6} Z M{r-3} {y} L{r-28} {y+3} L{r-26} {y+7} L{r-4} {y+6} Z" fill="#fff4cf" {SW}="1.8"/>')
            parts.append(f'<rect x="{cx-18}" y="{y+5}" width="36" height="5" rx="2" fill="#15171b" {SW}="1.5"/><rect x="{l+10}" y="{y+16}" width="{2*hw-20}" height="8" rx="3" fill="#15171b" {SW}="1.8"/>')
    elif k == "f150":
        if back:
            parts.append(f'<rect x="{l+2}" y="{y-2}" width="8" height="22" rx="1.5" fill="#c0392b" {SW}="1.8"/><rect x="{r-10}" y="{y-2}" width="8" height="22" rx="1.5" fill="#c0392b" {SW}="1.8"/>')
            parts.append(f'<path d="M{l+14} {y+6} L{r-14} {y+6}" stroke="{c["dark"]}" stroke-width="2"/><rect x="{cx-14}" y="{y+22}" width="28" height="8" rx="1.5" fill="#efe9d6" {SW}="1.5"/>')
            parts.append(f'<rect x="{l}" y="{bot-10}" width="{2*hw}" height="7" rx="2" fill="#cfd4da" {SW}="1.8"/>')
        else:
            parts.append(f'<rect x="{l+20}" y="{y-1}" width="{2*hw-40}" height="26" rx="3" fill="#2a2e35" {SW}="2.2"/>')
            for i in range(4):
                parts.append(f'<path d="M{l+22} {y+4+i*6} L{r-22} {y+4+i*6}" stroke="#cfd4da" stroke-width="2.4"/>')
            parts.append(f'<path d="M{l+3} {y-2} L{l+17} {y-2} L{l+17} {y+3} L{l+8} {y+3} L{l+8} {y+14} L{l+17} {y+14} L{l+17} {y+19} L{l+3} {y+19} Z M{r-3} {y-2} L{r-17} {y-2} L{r-17} {y+3} L{r-8} {y+3} L{r-8} {y+14} L{r-17} {y+14} L{r-17} {y+19} L{r-3} {y+19} Z" fill="#fff4cf" {SW}="1.8"/>')
            parts.append(f'<ellipse cx="{cx}" cy="{y+12}" rx="7" ry="3.5" fill="#1d3f8a" stroke="#cfd4da" stroke-width="1.2"/><rect x="{l}" y="{bot-10}" width="{2*hw}" height="7" rx="2" fill="#cfd4da" {SW}="1.8"/>')
    elif k == "mustang":
        if back:
            parts.append(f'<rect x="{l+6}" y="{y}" width="{2*hw-12}" height="12" rx="2" fill="#1a1a1e" {SW}="1.8"/>')
            for sgn in (-1, 1):
                for i in range(3):
                    x0 = cx + sgn * (hw - 10 - i * 6) - 2
                    parts.append(f'<rect x="{x0}" y="{y+1}" width="4" height="10" rx="1" fill="#ff3b30"/>')
            parts.append(f'<rect x="{cx-12}" y="{y+15}" width="24" height="7" rx="1.5" fill="#efe9d6" {SW}="1.5"/>')
            parts.append(f'<circle cx="{l+12}" cy="{bot-4}" r="3" fill="#888" {SW}="1.2"/><circle cx="{l+20}" cy="{bot-4}" r="3" fill="#888" {SW}="1.2"/><circle cx="{r-12}" cy="{bot-4}" r="3" fill="#888" {SW}="1.2"/><circle cx="{r-20}" cy="{bot-4}" r="3" fill="#888" {SW}="1.2"/>')
        else:
            parts.append(f'<path d="M{cx-22} {y+3} L{cx+22} {y+3} L{cx+18} {y+22} L{cx-18} {y+22} Z" fill="#15171b" {SW}="2"/><path d="M{cx-5} {y+12} L{cx+5} {y+10} L{cx+3} {y+15} Z" fill="#c9ced6"/>')
            parts.append(f'<path d="M{l+3} {y} L{l+20} {y+3} L{l+18} {y+8} L{l+4} {y+6} Z M{r-3} {y} L{r-20} {y+3} L{r-18} {y+8} L{r-4} {y+6} Z" fill="#fff4cf" {SW}="1.8"/>')
    elif k == "roadster":
        if back:
            parts.append(f'<circle cx="{l+9}" cy="{y+5}" r="5" fill="#c0392b" {SW}="1.8"/><circle cx="{l+20}" cy="{y+5}" r="4" fill="#e67e22" {SW}="1.8"/><circle cx="{r-9}" cy="{y+5}" r="5" fill="#c0392b" {SW}="1.8"/><circle cx="{r-20}" cy="{y+5}" r="4" fill="#e67e22" {SW}="1.8"/>')
            parts.append(f'<rect x="{cx-12}" y="{y+14}" width="24" height="7" rx="1.5" fill="#efe9d6" {SW}="1.5"/>')
        else:
            parts.append(f'<ellipse cx="{l+12}" cy="{y+3}" rx="10" ry="6" fill="#fff4cf" {SW}="1.8"/><ellipse cx="{r-12}" cy="{y+3}" rx="10" ry="6" fill="#fff4cf" {SW}="1.8"/>')
            parts.append(f'<path d="M{cx-14} {y+14} Q{cx} {y+20} {cx+14} {y+14} L{cx+12} {y+22} Q{cx} {y+25} {cx-12} {y+22} Z" fill="#15171b" {SW}="1.8"/>')
    elif k == "roadster2":
        col = "#ff2d55" if back else "#e8f8ff"
        parts.append(f'<rect x="{l+4}" y="{y}" width="{2*hw-8}" height="3.5" rx="1.75" fill="{col}" {SW}="1.4"/>')
        parts.append(f'<rect x="{l+8}" y="{bot-12}" width="{2*hw-16}" height="7" rx="3" fill="#121214" {SW}="1.6"/>')
        if back:
            parts.append(f'<rect x="{cx-12}" y="{y+8}" width="24" height="7" rx="1.5" fill="#efe9d6" {SW}="1.5"/>')
    tires = f'<rect x="{l+3}" y="{bot-5}" width="15" height="12" rx="3" fill="#141417" {SW}="2"/><rect x="{r-18}" y="{bot-5}" width="15" height="12" rx="3" fill="#141417" {SW}="2"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 116" width="120" height="116">
<defs><linearGradient id="h{k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c['lite']}"/><stop offset=".42" stop-color="{c['body']}"/><stop offset="1" stop-color="{c['dark']}"/></linearGradient>
<linearGradient id="v{k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f8aa6"/><stop offset=".55" stop-color="{c['glass']}"/><stop offset="1" stop-color="#0c1118"/></linearGradient><clipPath id="f{k}"><path d="{body}"/></clipPath></defs>
<ellipse cx="60" cy="106" rx="{hw+6}" ry="6" fill="#000" opacity=".32"/>
{tires}
{parts[0] if open_ else ''}
<path d="{body}" fill="url(#h{k})"/>
{''.join(parts[1:] if open_ else parts)}
<path d="M{l+6} {bot-3} L{r-6} {bot-3}" stroke="{c['dark']}" stroke-width="2"/>
<path d="{body}" fill="none" {SW}="3.5" stroke-linejoin="round"/>
</svg>'''

for k in C:
    open(f"{OUT}/{k}-side.svg", "w").write(side(k))
    open(f"{OUT}/{k}-front.svg", "w").write(fb(k, False))
    open(f"{OUT}/{k}-back.svg", "w").write(fb(k, True))
