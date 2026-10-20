# Keyline 0.1.8 car art: chunky storybook side/front/back views, dark ink outline, painted shading.
import os
OUT='/workspace/kl-sky/public/sprites/cars'
INK='#21160f'
M={
 'civic':dict(body='#c3c9d1',dark='#7d8590',lite='#eef2f6',glass='#2b3d52',rim='#c9ced6',
   # side, facing right, ground y=104
   shape='M14 80 Q12 66 24 63 L58 58 Q74 34 96 32 L134 32 Q150 34 164 56 L184 60 Q196 63 196 76 L196 86 Q196 92 188 92 L22 92 Q14 92 14 86 Z',
   win='M66 58 L92 38 Q96 37 112 37 L112 58 Z M118 58 L118 37 L132 37 Q144 39 156 58 Z',
   wheels=[(52,90,15),(160,90,15)], extra='', light='#ffe6a8', tail='#c0392b',
   w=150, roof=96, fbody=58, grille='civic'),
 'f150':dict(body='#2f5f9e',dark='#1c3a63',lite='#7fa6d8',glass='#22323f',rim='#d5d9df',
   shape='M10 84 L10 58 Q10 54 14 54 L92 54 L96 30 Q97 26 102 26 L142 26 Q150 26 156 34 L168 52 L188 56 Q196 58 196 66 L196 88 Q196 94 190 94 L16 94 Q10 94 10 88 Z',
   win='M104 50 L106 32 L126 32 L126 50 Z M132 50 L132 32 L146 32 Q150 33 154 38 L162 50 Z',
   wheels=[(46,92,17),(158,92,17)], extra='<path d="M14 54 L92 54" stroke="#16304f" stroke-width="3"/><rect x="186" y="62" width="10" height="20" rx="2" fill="#dfe4ea" stroke="'+INK+'" stroke-width="2"/><rect x="8" y="84" width="190" height="6" rx="3" fill="#cfd4da" stroke="'+INK+'" stroke-width="2"/>',
   light='#ffe6a8', tail='#c0392b', w=166, roof=110, fbody=70, grille='truck'),
 'mustang':dict(body='#cf2a2a',dark='#7e1414',lite='#ff8a7a',glass='#1d2733',rim='#2a2a2e',
   shape='M10 82 Q10 70 20 68 L52 64 Q72 40 96 38 L122 38 Q136 40 150 58 L186 62 Q198 64 198 78 L198 86 Q198 92 190 92 L18 92 Q10 92 10 86 Z',
   win='M62 63 L94 44 L112 44 L112 62 Z M118 62 L118 44 L126 44 Q134 46 144 60 Z',
   wheels=[(48,90,16),(164,90,16)], extra='STRIPES', light='#ffe6a8', tail='#ff3b30', w=156, roof=88, fbody=56, grille='pony'),
 'roadster':dict(body='#2e8a5a',dark='#18533a',lite='#8fe0b0',glass='#1c2a30',rim='#c9ced6',
   shape='M24 84 Q22 72 32 70 L74 66 Q90 48 104 46 L124 46 Q134 48 142 62 L174 66 Q186 68 186 80 L186 86 Q186 92 178 92 L32 92 Q24 92 24 86 Z',
   win='M84 64 L102 50 L122 50 Q130 52 136 62 Z',
   wheels=[(58,90,14),(154,90,14)], extra='<path d="M100 48 Q112 44 124 48" stroke="'+INK+'" stroke-width="5" fill="none" stroke-linecap="round"/>',
   light='#ffe6a8', tail='#c0392b', w=132, roof=70, fbody=50, grille='roadster'),
 'roadster2':dict(body='#e21b2c',dark='#7a0a16',lite='#ff9aa2',glass='#141c28',rim='#e8ecf2',
   shape='M8 82 Q8 72 18 70 L58 64 Q84 36 112 34 L128 34 Q148 36 166 56 L188 62 Q200 66 198 80 L196 86 Q194 92 186 92 L16 92 Q8 92 8 86 Z',
   win='M66 62 Q88 40 112 38 L128 38 Q146 40 160 58 Z',
   wheels=[(48,90,16),(164,90,16)], extra='R2', light='#dff4ff', tail='#ff2d55', w=162, roof=92, fbody=56, grille='r2'),
}
def wheel(x,y,r,rim,spokes=5):
    s=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#17171b" stroke="{INK}" stroke-width="3"/>'
    s+=f'<circle cx="{x}" cy="{y}" r="{r*0.6:.1f}" fill="{rim}" stroke="{INK}" stroke-width="1.5"/>'
    import math
    for i in range(spokes):
        a=i*2*math.pi/spokes-math.pi/2
        s+=f'<path d="M{x} {y} L{x+math.cos(a)*r*0.55:.1f} {y+math.sin(a)*r*0.55:.1f}" stroke="#5b6069" stroke-width="2"/>'
    s+=f'<circle cx="{x}" cy="{y}" r="{r*0.18:.1f}" fill="#3b3f46"/>'
    s+=f'<path d="M{x-r*0.42:.1f} {y-r*0.3:.1f} A{r*0.52:.1f} {r*0.52:.1f} 0 0 1 {x+r*0.1:.1f} {y-r*0.52:.1f}" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none"/>'
    return s
def side(k,c):
    d=c['shape']; g=f'g{k}'
    x=c['extra']
    if x=='STRIPES':
        x=f'<g clip-path="url(#c{k})"><path d="M52 64 Q100 38 150 58 L190 62" stroke="#141414" stroke-width="5" fill="none"/><path d="M16 82 L196 82" stroke="#141414" stroke-width="4"/></g><text x="64" y="80" font-family="Arial Black,Arial" font-weight="900" font-size="9" fill="#141414">GT</text><path d="M150 58 L170 58 L166 54 L154 54 Z" fill="{c["dark"]}" stroke="{INK}" stroke-width="2"/><circle cx="182" cy="74" r="2.5" fill="#d9b44a"/>'
    if x=='R2':
        x=f'<path d="M20 80 L190 76" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/><path d="M14 88 L196 84" stroke="#ff4d6d" stroke-width="2" opacity=".9"/><path d="M8 78 L22 72" stroke="#1a0a0e" stroke-width="5" stroke-linecap="round"/>'
    wh=''.join(f'<path d="M{wx-r-5} {wy+1} A{r+5} {r+5} 0 0 1 {wx+r+5} {wy+1} Z" fill="#0d0b0a"/>' for wx,wy,r in c['wheels'])
    whs=''.join(wheel(wx,wy,r,c['rim'],6 if k!='f150' else 5) for wx,wy,r in c['wheels'])
    hx=max(float(p) for p in __import__('re').findall(r'[ML] ?(\d+)',d))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208 116" width="208" height="116">
<defs><linearGradient id="{g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c['lite']}"/><stop offset=".35" stop-color="{c['body']}"/><stop offset=".78" stop-color="{c['body']}"/><stop offset="1" stop-color="{c['dark']}"/></linearGradient>
<linearGradient id="w{k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f8aa6"/><stop offset=".5" stop-color="{c['glass']}"/><stop offset="1" stop-color="#0c1118"/></linearGradient>
<clipPath id="c{k}"><path d="{d}"/></clipPath></defs>
<ellipse cx="104" cy="106" rx="96" ry="7" fill="#000" opacity=".32"/>
<path d="{d}" fill="url(#{g})"/>
{x}
<g clip-path="url(#c{k})"><rect x="0" y="80" width="208" height="20" fill="{c['dark']}" opacity=".45"/><path d="M0 72 L208 70" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></g>
{wh}
<path d="{c['win']}" fill="url(#w{k})" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="{c['win']}" fill="none" stroke="#bcd3ea" stroke-opacity=".35" stroke-width="1" transform="translate(1.5 1.5)"/>
<path d="{d}" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>
<rect x="{hx-12}" y="{68 if k!='f150' else 62}" width="12" height="7" rx="3" fill="{c['light']}" stroke="{INK}" stroke-width="2"/>
<rect x="{min(float(p) for p in __import__('re').findall(r'M ?(\d+)',d))-1}" y="{70 if k!='f150' else 60}" width="8" height="7" rx="2" fill="{c['tail']}" stroke="{INK}" stroke-width="2"/>
{whs}
</svg>'''
def frontback(k,c,back):
    W=c['w']*0.62; cx=60; bw=W; rw=c['roof']*0.62; top=22 if k=='f150' else 34 if k in('roadster',) else 28
    bot=96; belt=60 if k!='f150' else 54
    l=cx-bw/2; r=cx+bw/2; rl=cx-rw/2; rr=cx+rw/2
    body=f'M{l} {bot-6} L{l} {belt+6} Q{l} {belt} {l+8} {belt-2} L{rl} {top+8} Q{rl+2} {top} {rl+10} {top} L{rr-10} {top} Q{rr-2} {top} {rr} {top+8} L{r-8} {belt-2} Q{r} {belt} {r} {belt+6} L{r} {bot-6} Q{r} {bot} {r-6} {bot} L{l+6} {bot} Q{l} {bot} {l} {bot-6} Z'
    gl=f'M{rl+5} {top+7} L{rr-5} {top+7} L{r-12} {belt-4} L{l+12} {belt-4} Z'
    if k=='roadster': gl=f'M{rl+4} {top+6} L{rr-4} {top+6} L{r-14} {belt-6} L{l+14} {belt-6} Z'
    lc=c['tail'] if back else c['light']
    lamps=f'<rect x="{l+4}" y="{belt+6}" width="{bw*0.2:.1f}" height="8" rx="3" fill="{lc}" stroke="{INK}" stroke-width="2"/><rect x="{r-4-bw*0.2:.1f}" y="{belt+6}" width="{bw*0.2:.1f}" height="8" rx="3" fill="{lc}" stroke="{INK}" stroke-width="2"/>'
    if k=='roadster2' and back: lamps=f'<rect x="{l+4}" y="{belt+7}" width="{bw-8}" height="5" rx="2.5" fill="{lc}" stroke="{INK}" stroke-width="2"/>'
    mid=''
    if not back:
        gw={'civic':.34,'truck':.5,'pony':.42,'roadster':.3,'r2':0}[c['grille']]
        if gw: mid=f'<rect x="{cx-bw*gw/2:.1f}" y="{belt+7}" width="{bw*gw:.1f}" height="{14 if k=="f150" else 9}" rx="3" fill="{"#c9ced6" if k=="f150" else "#1a1c22"}" stroke="{INK}" stroke-width="2"/>'
        if k=='mustang': mid+=f'<circle cx="{cx}" cy="{belt+11.5}" r="2.5" fill="#d9b44a"/>'
    else:
        mid=f'<rect x="{cx-14}" y="{belt+18}" width="28" height="8" rx="1.5" fill="#efe9d6" stroke="{INK}" stroke-width="1.5"/>'
    stripes=f'<g clip-path="url(#f{k})"><rect x="{cx-8}" y="0" width="5" height="120" fill="#141414"/><rect x="{cx+3}" y="0" width="5" height="120" fill="#141414"/></g>' if k=='mustang' else ''
    tires=f'<rect x="{l+3}" y="{bot-4}" width="14" height="12" rx="3" fill="#141417" stroke="{INK}" stroke-width="2"/><rect x="{r-17}" y="{bot-4}" width="14" height="12" rx="3" fill="#141417" stroke="{INK}" stroke-width="2"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 116" width="120" height="116">
<defs><linearGradient id="h{k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c['lite']}"/><stop offset=".4" stop-color="{c['body']}"/><stop offset="1" stop-color="{c['dark']}"/></linearGradient>
<linearGradient id="v{k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f8aa6"/><stop offset=".55" stop-color="{c['glass']}"/><stop offset="1" stop-color="#0c1118"/></linearGradient><clipPath id="f{k}"><path d="{body}"/></clipPath></defs>
<ellipse cx="60" cy="106" rx="{bw/2+6}" ry="6" fill="#000" opacity=".32"/>
{tires}
<path d="{body}" fill="url(#h{k})"/>{stripes}
<path d="{gl}" fill="url(#v{k})" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M{rl+9} {top+10} L{cx-4} {top+10} L{l+20} {belt-7}" stroke="#cfe0f0" stroke-opacity=".4" stroke-width="2" fill="none"/>
{lamps}{mid}
<path d="M{l+6} {bot-6} L{r-6} {bot-6}" stroke="{c['dark']}" stroke-width="3"/>
<path d="{body}" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>
</svg>'''
for k,c in M.items():
    open(f'{OUT}/{k}-side.svg','w').write(side(k,c))
    open(f'{OUT}/{k}-front.svg','w').write(frontback(k,c,False))
    open(f'{OUT}/{k}-back.svg','w').write(frontback(k,c,True))
    p=f'{OUT}/{k}-top.svg'
    if os.path.exists(p): os.remove(p)
