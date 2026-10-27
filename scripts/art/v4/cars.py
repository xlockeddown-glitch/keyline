"""0.1.51 Ioniq 5 + Model 3: painted vector 3-views (side faces right) -> svg files; render.mjs rasterizes them."""
INK='#2a221c'
def defs(body):
    return f'''<defs>
<linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#f1f1ef"/><stop offset=".7" stop-color="#d9dadb"/><stop offset="1" stop-color="#b3b6b9"/></linearGradient>
<linearGradient id="bdx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8cacc"/><stop offset=".18" stop-color="#f4f4f2"/><stop offset=".5" stop-color="#ffffff"/><stop offset=".82" stop-color="#f4f4f2"/><stop offset="1" stop-color="#c8cacc"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4654"/><stop offset=".45" stop-color="#1b232d"/><stop offset="1" stop-color="#0e1218"/></linearGradient>
<linearGradient id="tire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2b2e"/><stop offset="1" stop-color="#121214"/></linearGradient>
<radialGradient id="rim" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#e6e8ea"/><stop offset=".7" stop-color="#9aa0a6"/><stop offset="1" stop-color="#5d6268"/></radialGradient>
<radialGradient id="rimd" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#6b7077"/><stop offset=".7" stop-color="#3c4046"/><stop offset="1" stop-color="#25282c"/></radialGradient>
</defs>'''
def wheel(x,y,r,kind):
    s=f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#tire)" stroke="{INK}" stroke-width="2.5"/>'
    rr=r*.68
    if kind=='pin':  # Ioniq 5 pixel/pinwheel aero rim
        s+=f'<circle cx="{x}" cy="{y}" r="{rr}" fill="url(#rim)" stroke="#3a3d42" stroke-width="2"/>'
        for i in range(4):
            s+=f'<path transform="rotate({i*90} {x} {y})" d="M{x} {y} L{x+rr*.95} {y-rr*.25} L{x+rr*.95} {y+rr*.35} Z" fill="#4a4f56"/>'
        for dx in (-1,1):
            for dy in (-1,1):
                s+=f'<rect x="{x+dx*rr*.45-3}" y="{y+dy*rr*.45-3}" width="6" height="6" fill="#2e3136"/>'
    else:  # Model 3 aero cover, dark grey
        s+=f'<circle cx="{x}" cy="{y}" r="{rr}" fill="url(#rimd)" stroke="#1d1f22" stroke-width="2"/>'
        for i in range(5):
            s+=f'<path transform="rotate({i*72} {x} {y})" d="M{x} {y-rr*.25} Q{x+rr*.35} {y-rr*.75} {x+rr*.15} {y-rr*.95}" stroke="#8b9097" stroke-width="3" fill="none"/>'
    s+=f'<circle cx="{x}" cy="{y}" r="{r*.12}" fill="#1a1b1e"/>'
    s+=f'<path d="M{x-rr*.7} {y-rr*.3} A{rr*.8} {rr*.8} 0 0 1 {x-rr*.1} {y-rr*.8}" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none"/>'
    return s
def arch(x,y,r): return f'<path d="M{x-r-8} {y+2} A{r+8} {r+8} 0 0 1 {x+r+8} {y+2} Z" fill="#141416"/>'

def ioniq_side():
    # v2: shorter, taller crossover-hatch: short front overhang, raked rear glass + ducktail, thick C-pillar.
    W,H=420,180; wy=136; r=40
    body='M34 152 L30 128 L32 80 L40 66 L70 36 Q76 30 88 30 L250 29 Q268 30 280 38 L332 72 L384 80 Q398 83 398 98 L398 132 Q396 150 384 152 Z'
    g=f'<path d="{body}" fill="url(#bd)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    g+=f'<path d="M32 136 L398 136 L396 146 Q394 152 384 152 L34 152 Z" fill="#26282c"/>'
    g+=arch(96,wy,r)+arch(326,wy,r)
    g+=f'<path d="M50 136 A46 46 0 0 1 142 136" stroke="#2a2c30" stroke-width="8" fill="none"/><path d="M280 136 A46 46 0 0 1 372 136" stroke="#2a2c30" stroke-width="8" fill="none"/>'
    # ducktail spoiler over the raked rear glass
    g+=f'<path d="M70 36 L54 40 L52 46 L68 43 Z" fill="#26282c"/>'
    # tall greenhouse tapering at the rear; thick body-colour C-pillar with a black inset
    g+=f'<path d="M100 38 L248 36 Q262 37 272 44 L318 74 L104 76 Z" fill="url(#gl)" stroke="{INK}" stroke-width="2"/>'
    g+=f'<path d="M72 42 L92 38 L96 76 L52 76 Z" fill="url(#gl)" stroke="{INK}" stroke-width="2"/>'
    g+=f'<path d="M180 37 L192 37 L190 76 L178 76 Z" fill="#14181e"/><path d="M94 38 L104 38 L106 76 L96 76 Z" fill="#14181e"/>'
    g+=f'<path d="M120 44 L240 42" stroke="#fff" stroke-opacity=".28" stroke-width="3"/>'
    # straight parametric crease, door cuts, handles, mirror
    g+=f'<path d="M110 124 L300 86" stroke="#9fa3a8" stroke-width="2.5"/><path d="M110 126 L300 88" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>'
    g+=f'<path d="M186 76 L184 134 M282 76 L292 134" stroke="#9aa0a6" stroke-width="1.6"/><rect x="150" y="86" width="20" height="4" rx="2" fill="#8e9399"/><rect x="246" y="86" width="20" height="4" rx="2" fill="#8e9399"/>'
    g+=f'<path d="M312 68 L330 64 L332 76 L318 78 Z" fill="#26282c"/>'
    for i in range(3):
        for j in range(2): g+=f'<rect x="{32+j*5}" y="{84+i*6}" width="4" height="4" fill="#ff3340"/>'
    for i in range(2):
        for j in range(3): g+=f'<rect x="{384+j*5}" y="{88+i*6}" width="4" height="4" fill="#f4fbff" stroke="#9fb6c6" stroke-width=".6"/>'
    g+=wheel(96,wy,r,'pin')+wheel(326,wy,r,'pin')
    return W,H,g

def ioniq_fb(back):
    W,H=300,236
    g=''
    # mirrors
    g+=f'<path d="M30 92 L52 86 L56 104 L32 108 Z" fill="#26282c" stroke="{INK}" stroke-width="2"/><path d="M270 92 L248 86 L244 104 L268 108 Z" fill="#26282c" stroke="{INK}" stroke-width="2"/>'
    # tyres
    g+=f'<rect x="44" y="180" width="38" height="52" rx="8" fill="url(#tire)" stroke="{INK}" stroke-width="2.5"/><rect x="218" y="180" width="38" height="52" rx="8" fill="url(#tire)" stroke="{INK}" stroke-width="2.5"/>'
    body='M58 210 L46 190 L42 130 Q44 104 66 98 L84 40 Q88 26 104 24 L196 24 Q212 26 216 40 L234 98 Q256 104 258 130 L254 190 L242 210 Z'
    g+=f'<path d="{body}" fill="url(#bdx)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    # roof rails
    g+=f'<path d="M98 26 L94 34 M202 26 L206 34" stroke="#3c3f44" stroke-width="4"/>'
    # glass
    gy=96 if not back else 92
    g+=f'<path d="M90 40 Q94 32 106 32 L194 32 Q206 32 210 40 L226 {gy} L74 {gy} Z" fill="url(#gl)" stroke="{INK}" stroke-width="2"/>'
    g+=f'<path d="M120 36 L146 36 L112 {gy-4} L90 {gy-4} Z" fill="#fff" fill-opacity=".10"/>'
    if not back:
        # clamshell hood line, pixel headlights at the corners, thin horizontal light bar between
        g+=f'<path d="M64 110 Q150 100 236 110" stroke="#a5a9ae" stroke-width="2" fill="none"/>'
        g+=f'<rect x="56" y="128" width="188" height="14" rx="3" fill="#1c1f24"/>'
        g+=f'<rect x="92" y="133" width="116" height="3" fill="#e9f6ff"/>'
        for x0 in (60,204):
            for i in range(2):
                for j in range(4): g+=f'<rect x="{x0+j*9}" y="{130+i*5}" width="7" height="4" fill="#f4fbff"/>'
        # V lower bumper with pixel DRL strips
        g+=f'<path d="M76 172 L150 196 L224 172 L222 190 L150 208 L78 190 Z" fill="#26282c"/>'
        g+=f'<path d="M84 178 L150 200 L216 178" stroke="#5a5f66" stroke-width="2" fill="none"/>'
        g+=f'<rect x="138" y="150" width="24" height="8" rx="2" fill="#c3c7cc" stroke="#7b8087"/>'
    else:
        # full-width pixel tail bar
        g+=f'<rect x="48" y="120" width="204" height="20" rx="3" fill="#1c1f24"/>'
        for j in range(22):
            for i in range(2):
                hot = j<5 or j>16
                g+=f'<rect x="{52+j*9}" y="{123+i*8}" width="7" height="6" fill="{"#ff2b3a" if hot else "#7a1520"}"/>'
        g+=f'<rect x="126" y="152" width="48" height="16" rx="2" fill="#f2f2ee" stroke="#555" stroke-width="1.5"/>'
        g+=f'<path d="M60 180 L240 180 L234 206 L66 206 Z" fill="#26282c"/>'
        for x0 in (70,206):
            for i in range(2): g+=f'<rect x="{x0}" y="{186+i*7}" width="24" height="4" fill="#ff3340"/>'
    return W,H,g

def m3_side():
    W,H=480,150; wy=112; r=34
    body='M30 128 L22 96 Q22 78 40 74 L92 66 Q146 26 222 22 Q300 22 342 52 L384 64 Q440 72 458 86 L464 104 Q462 124 448 128 Z'
    g=f'<path d="{body}" fill="url(#bd)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    g+=f'<path d="M30 116 L462 116 L460 122 Q458 128 448 128 L30 128 Z" fill="#2a2c30"/>'
    g+=arch(108,wy,r)+arch(374,wy,r)
    # all-glass roof and greenhouse
    g+=f'<path d="M102 66 Q152 30 222 27 Q290 27 330 54 L342 66 Z" fill="url(#gl)" stroke="{INK}" stroke-width="2"/>'
    g+=f'<path d="M226 28 L232 66 L222 66 Z" fill="#14181e"/>'
    g+=f'<path d="M150 46 Q200 33 280 36" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none"/>'
    # shoulder line, door cuts, flush handles
    g+=f'<path d="M40 82 Q240 72 446 86" stroke="#fff" stroke-opacity=".8" stroke-width="2" fill="none"/><path d="M40 86 Q240 77 446 90" stroke="#a9adb2" stroke-width="1.5" fill="none"/>'
    g+=f'<path d="M226 68 L222 114 M340 66 L346 114" stroke="#9aa0a6" stroke-width="1.5"/><rect x="186" y="76" width="18" height="3" rx="1.5" fill="#9a9fa5"/><rect x="300" y="76" width="18" height="3" rx="1.5" fill="#9a9fa5"/>'
    g+=f'<path d="M346 60 L362 58 L362 68 L350 68 Z" fill="#26282c"/>'
    # slim lights
    g+=f'<path d="M436 82 L458 88 L456 92 L436 88 Z" fill="#f4fbff" stroke="#8aa0b0" stroke-width="1"/>'
    g+=f'<path d="M24 82 L46 80 L46 86 L26 88 Z" fill="#e0202c"/>'
    g+=wheel(108,wy,r,'aero')+wheel(374,wy,r,'aero')
    return W,H,g

def m3_fb(back):
    W,H=300,206
    g=''
    g+=f'<path d="M30 92 L52 88 L54 102 L32 104 Z" fill="#26282c" stroke="{INK}" stroke-width="2"/><path d="M270 92 L248 88 L246 102 L268 104 Z" fill="#26282c" stroke="{INK}" stroke-width="2"/>'
    g+=f'<rect x="44" y="156" width="36" height="46" rx="8" fill="url(#tire)" stroke="{INK}" stroke-width="2.5"/><rect x="220" y="156" width="36" height="46" rx="8" fill="url(#tire)" stroke="{INK}" stroke-width="2.5"/>'
    body='M60 182 L44 166 L40 128 Q42 108 70 102 L96 46 Q104 30 124 28 L176 28 Q196 30 204 46 L230 102 Q258 108 260 128 L256 166 L240 182 Z'
    g+=f'<path d="{body}" fill="url(#bdx)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    g+=f'<path d="M100 44 Q108 34 126 34 L174 34 Q192 34 200 44 L222 100 L78 100 Z" fill="url(#gl)" stroke="{INK}" stroke-width="2"/>'
    g+=f'<path d="M128 38 L152 38 L112 96 L92 96 Z" fill="#fff" fill-opacity=".10"/>'
    if not back:
        # smooth nose, no grille: slim swept headlights, small dark lower intake
        g+=f'<path d="M62 116 Q150 104 238 116" stroke="#b0b4b8" stroke-width="2" fill="none"/>'
        g+=f'<path d="M50 128 L100 134 L96 142 L54 138 Z" fill="#1c1f24"/><path d="M58 131 L94 136" stroke="#f4fbff" stroke-width="3"/>'
        g+=f'<path d="M250 128 L200 134 L204 142 L246 138 Z" fill="#1c1f24"/><path d="M242 131 L206 136" stroke="#f4fbff" stroke-width="3"/>'
        g+=f'<path d="M104 160 Q150 168 196 160 L190 172 Q150 178 110 172 Z" fill="#26282c"/>'
        g+=f'<path d="M146 118 L154 118 M150 118 L150 126" stroke="#6b7077" stroke-width="2"/>'
    else:
        g+=f'<path d="M48 118 L104 122 L104 132 L50 130 Z" fill="#b8121c" stroke="#3a0a0e" stroke-width="1.5"/><path d="M252 118 L196 122 L196 132 L250 130 Z" fill="#b8121c" stroke="#3a0a0e" stroke-width="1.5"/>'
        g+=f'<path d="M56 121 L98 124 M244 121 L202 124" stroke="#ff4b55" stroke-width="2.5"/>'
        g+=f'<path d="M104 126 L196 126" stroke="#a9adb2" stroke-width="1.5"/>'
        g+=f'<rect x="128" y="138" width="44" height="14" rx="2" fill="#f2f2ee" stroke="#555" stroke-width="1.5"/>'
        g+=f'<path d="M64 162 L236 162 L232 178 L68 178 Z" fill="#26282c"/>'
    return W,H,g

import os
SQ={'ioniq5-front':'translate(0 30) scale(1 .87)','ioniq5-back':'translate(0 30) scale(1 .87)'}
os.makedirs('svg',exist_ok=True)
for name,(W,H,g) in {'ioniq5-side':ioniq_side(),'ioniq5-front':ioniq_fb(False),'ioniq5-back':ioniq_fb(True),'model3-side':m3_side(),'model3-front':m3_fb(False),'model3-back':m3_fb(True)}.items():
    open(f'svg/{name}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W*4}" height="{H*4}">{defs(0)}<g transform="{SQ.get(name,"")}">{g}</g></svg>')
print('ok')
