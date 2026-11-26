"""Cut the six Holiday Lights pieces from Ryan's approved mock (holiday-mock-v2.jpg), key out the night field,
and write WebP files under a 2,048 B per-file cap. Ornament drop shadows stay as soft black alpha (they sit on the
same dark Journal panel); the map lamp's ground shadow is cut (the shared CSS ellipse is the only map shadow)."""
import io, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd
SRC=sys.argv[2] if len(sys.argv)>2 else "/workspace/kl-holiday-mock/holiday-mock-v2.jpg"
OUT=sys.argv[1] if len(sys.argv)>1 else "public/sprites/holiday"
import os; os.makedirs(OUT,exist_ok=True)
BG=np.array([29.,30.,34.]); SH=np.array([18.,19.,23.])
PIECES={ # name: (box x0,y0,x1,y1 in mock px, target height px, keep shadow)
 'orn-1':((238,142,538,560),56,True),
 'orn-2':((696,175,1100,543),56,True),
 'orn-3':((1266,187,1516,520),56,True),
 'orn-4':((1758,192,2065,521),56,True),
 'orn-5':((2340,125,2460,560),64,True),
 'lamp':((1246,636,1518,1458),104,False),
}
im=np.asarray(Image.open(SRC).convert('RGB')).astype(float)
def cut(box,keep):
    x0,y0,x1,y1=box; p=8
    a=im[y0-p:y1+p,x0-p:x1+p]
    dbg=np.sqrt(((a-BG)**2).sum(2)); dsh=np.sqrt(((a-SH)**2).sum(2))
    lum=a.mean(2); bgl=BG.mean()
    fg=dbg>10
    fg=nd.binary_opening(fg,iterations=1)
    fg=nd.binary_fill_holes(nd.binary_closing(fg,iterations=3))
    lab,n=nd.label(nd.binary_dilation(fg,iterations=4))
    sizes=nd.sum(np.ones_like(lab),lab,range(1,n+1))
    keepl=[i+1 for i,s in enumerate(sizes) if s>150]
    fg&=np.isin(lab,keepl)
    alpha=np.zeros(lum.shape); rgb=a.copy()
    shadow=(dsh<5.5)&(np.abs(a-SH).max(2)<6)
    # glow / soft edge: light pixels close to bg -> unmix
    soft=fg&(dbg<45)&(lum>bgl)&~shadow
    al=np.clip(dbg/45,0,1)
    alpha[fg]=1.0
    alpha[dbg<8]=0.0
    alpha[soft]=al[soft]
    ok=soft&(al>0.02)
    rgb[ok]=(a[ok]-(1-al[ok,None])*BG)/al[ok,None]
    # dark-neutral (shadow tone) pixels: black with partial alpha
    darkish=fg&shadow
    sa=np.clip(1-lum/bgl,0,1)
    if keep:
        alpha[darkish]=sa[darkish]; rgb[darkish]=0
    else:
        # cut ground shadow only where it is not enclosed by object outline: below/around base
        alpha[darkish]=0
    # far shadow halo outside fg (keep=True): soft black
    if keep:
        halo=(~fg)&(lum<bgl-3)&(np.abs(a-a.mean(2,keepdims=True)).max(2)<6)
        alpha[halo]=np.clip(1-lum[halo]/bgl,0,1); rgb[halo]=0
    rgba=np.dstack([np.clip(rgb,0,255),alpha*255]).astype(np.uint8)
    img=Image.fromarray(rgba,'RGBA')
    bb=img.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    return img.crop(bb)
def webp(img,cap=2000):
    A=np.asarray(img.getchannel('A')).astype(int); A=np.where(A<10,0,np.where(A>245,255,A))
    arr=np.asarray(img).copy(); arr[...,3]=A; arr[A==0,:3]=0; img=Image.fromarray(arr,'RGBA')
    best=None
    for q in range(90,35,-5):
      for aq in (90,70,50):
        b=io.BytesIO(); img.save(b,'WEBP',quality=q,alpha_quality=aq,method=6)
        if len(b.getvalue())<=cap: return b.getvalue(),(q,aq)
        best=(b.getvalue(),(q,aq))
    return best
tot=0
for k,(box,h,keep) in PIECES.items():
    m=cut(box,keep); pass
    w=round(m.width*h/m.height)
    s=m.resize((w,h),Image.LANCZOS)
    data,q=webp(s); open(f'{OUT}/{k}.webp','wb').write(data); tot+=len(data)
    print(k,m.size,'->',(w,h),'q',q,len(data),'B')
print('total',tot,'B',round(tot/1024,2),'KiB')
