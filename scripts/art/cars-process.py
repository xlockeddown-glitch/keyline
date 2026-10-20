"""Cut a 3-view turnaround (<id>-turn.jpg: side | front | back on magenta) into map sprites like sprite-rig:
key out magenta, ink the magenta-tinted rim dark, flip the side to face right if needed, 256-colour palette PNGs.
  python3 process.py civic [--flip]   -> out/<id>-side.png, -front.png, -back.png (side 192 px wide, front/back 96 px)"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
D='/workspace/carart/v3'
def key(a):
    a=a.astype(float); bg=np.median(np.concatenate([a[:6].reshape(-1,3),a[-6:].reshape(-1,3)]),0)
    d=np.sqrt(((a-bg)**2).sum(-1)); al=np.clip((d-45)/45,0,1)
    sh=(a[...,0]>a[...,1]+25)&(a[...,2]>a[...,1]+5)&(a[...,0]<170); al[sh]=0  # magenta-cast ground shadow
    m=ndimage.binary_fill_holes(al>.5); al[m&sh]=1; al[m & (al<1)] = np.maximum(al[m & (al<1)], .0)
    rim=(al>0)&(al<1)|(ndimage.binary_dilation(~m,iterations=2)&m)
    pink=(a[...,0]>a[...,1]+30)&(a[...,2]>a[...,1]+20)
    a[rim&pink]=[38,24,16]  # ink the fringe warm dark brown, like sprite-rig's maroon-outline fix
    return np.dstack([a,al*255]).astype('uint8'), m
cid=sys.argv[1]; flip='--flip' in sys.argv
import os; os.makedirs(f'{D}/out',exist_ok=True)
def comps(path,k):
    rgba,m=key(np.asarray(Image.open(path).convert('RGB')))
    lab,n=ndimage.label(ndimage.binary_closing(m,iterations=6)); objs=ndimage.find_objects(lab)
    sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1))
    big=[objs[i] for i in np.argsort(-sz)[:k]]
    return [rgba[o]*(lab[o]>0)[...,None] for o in sorted(big,key=lambda o:o[1].start)]
if os.path.exists(f'{D}/{cid}-turn.jpg'): crops=comps(f'{D}/{cid}-turn.jpg',3)
else: crops=[comps(f'{D}/{cid}-{v}-src.jpg',1)[0] for v in ['side','front','back']]
for name,c,w in zip(['side','front','back'],crops,[192,96,96]):
    c=c.astype(float); r,g,b,al=c[...,0],c[...,1],c[...,2],c[...,3]
    pk=(r>g+20)&(b>g+8)&(al>0)
    # magenta-cast ground shadow: kill pinkish pixels in the bottom band below the wheels' widest row
    H=c.shape[0]; band=np.zeros_like(pk); band[int(H*.85):]=True
    al[pk&band]=0
    lab,n=ndimage.label(al>0); sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1))
    if n>1: al[~np.isin(lab,1+np.where(sz>=sz.max()*.02)[0])]=0
    rows=np.where((al>0).sum(1)>0)[0]; c=c[:rows.max()+1]; pk=pk[:rows.max()+1]
    # remaining magenta-cast pixels (glass reflections) -> neutral dark glass
    lum=c[...,:3][pk].mean(-1,keepdims=True)*.55; c[...,:3][pk]=np.concatenate([lum*.9,lum*.95,lum*1.05],-1)
    im=Image.fromarray(np.clip(c,0,255).astype('uint8'))

    if name=='side' and flip: im=im.transpose(Image.FLIP_LEFT_RIGHT)
    h=round(im.height*w/im.width); im=im.resize((w,h),Image.LANCZOS)
    a=im.getchannel('A'); q=im.convert('RGB').quantize(255,method=Image.MEDIANCUT).convert('RGBA'); q.putalpha(a.point(lambda v:0 if v<40 else 255))
    q.quantize(256,method=Image.FASTOCTREE).save(f'{D}/out/{cid}-{name}.png',optimize=True); print(name,q.size)
