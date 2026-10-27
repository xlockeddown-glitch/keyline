"""0.1.9: factory-colour recolors of the v3 car sprites (public/sprites/cars/<car>-<view>.png) ->
public/sprites/cars/paint/<car>-<color>-<view>.png. Only body paint changes: bright, low-saturation pixels in the
big connected panels. Glass, tyres, lights, rims, badges and plates (dark, saturated, or small islands) keep their pixels.
  python3 scripts/art/cars-paint.py   (colours are read from src/game/carPaint.ts)"""
import re, os, numpy as np
from PIL import Image
from scipy import ndimage
R=os.path.dirname(os.path.abspath(__file__))+'/../..'
src=open(f'{R}/src/game/carPaint.ts').read()
cols={}
for car,body in re.findall(r'\n  (\w+): \[\n(.*?)\n  \],',src,re.S):
    cols[car]=re.findall(r'id: "(\w+)", name: "[^"]+", hex: "#(\w{6})"',body)
os.makedirs(f'{R}/public/sprites/cars/paint',exist_ok=True)
def mask(a,car=''):
    rgb=a[...,:3].astype(float); mx=rgb.max(-1); mn=rgb.min(-1); sat=(mx-mn)/np.maximum(mx,1)
    m=(a[...,3]>0)&(sat<0.16)&(mx>105)
    if car=='belair57':  # 0.1.55: turquoise body (ivory roof sweep and chrome keep their pixels)
        r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
        m=(a[...,3]>0)&(sat>0.22)&(g>r+25)&(b>r+15)&(mx>60)
    lab,n=ndimage.label(m); 
    if not n: return m
    sz=ndimage.sum(m,lab,range(1,n+1)); keep=1+np.where(sz>=sz.max()*0.12)[0]
    return np.isin(lab,keep)
for car,cl in cols.items():
    for view in ['side','front','back']:
        a=np.asarray(Image.open(f'{R}/public/sprites/cars/{car}-{view}.png').convert('RGBA')).astype(float)
        m=mask(a,car); L=a[...,:3].mean(-1); Lm=np.median(L[m])
        for cid,hx in cl[1:]:
            t=np.array([int(hx[i:i+2],16) for i in (0,2,4)],float)
            s=(L[m]/Lm)[:,None]
            hi=np.clip((s-1)/max(255/Lm-1,1e-3),0,1)*0.55
            new=np.where(s<=1,t*s,t+(255-t)*hi)
            if t.max()<60: new=t+(L[m][:,None]-Lm)*0.32  # blacks keep a soft sheen
            b=a.copy(); b[...,:3][m]=np.clip(new,0,255)
            im=Image.fromarray(b.astype('uint8'))
            al=im.getchannel('A'); q=im.convert('RGB').quantize(255,method=Image.MEDIANCUT).convert('RGBA'); q.putalpha(al.point(lambda v:0 if v<40 else 255))
            q.quantize(256,method=Image.FASTOCTREE).save(f'{R}/public/sprites/cars/paint/{car}-{cid}-{view}.png',optimize=True)
print('ok',{k:len(v) for k,v in cols.items()})
