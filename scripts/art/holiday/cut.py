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
# 0.1.188: Ryan (Nov 26, 6:36 AM CT) "Make the lamppost ornament brass". The 5th ornament's painted metal is a
# desaturated taupe; its metal pixels are gradient-mapped (luminance kept) onto the Keyline brass ramp from
# docs/ART_DIRECTION.md (shadow #6e5320, mid #c9a35e, highlight #e0c788). The red bow, the snow, the lit glass and
# the alpha are left as painted.
BRASS=[(0.00,(26,18,8)),(0.18,(70,50,20)),(0.38,(138,106,56)),(0.58,(201,163,94)),(0.78,(224,199,136)),(1.00,(238,214,152))]
def brass(img):
    a=np.asarray(img).astype(float); rgb=a[...,:3]/255
    mx=rgb.max(2); mn=rgb.min(2); v=mx; s=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]; d=np.maximum(mx-mn,1e-6)
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    h=np.where(mx-mn<1e-6,0,h)
    metal=(h>=12)&(h<=52)&(s>=0.16)&(s<=0.62)&(v<0.86)&(a[...,3]>0)
    # soft edge of the mask in hue/value so the glass falloff and the bow edge blend, never band
    w=np.clip((v-0.0)/0.06,0,1)*np.clip((0.90-v)/0.04,0,1)*np.clip((h-8)/4,0,1)*np.clip((56-h)/4,0,1)*np.clip((0.66-s)/0.04,0,1)*np.clip((s-0.12)/0.04,0,1)
    w=np.where(metal|(w>0),w,0)
    w=w*(1-np.clip((v-0.58)/0.06,0,1)*np.clip((0.30-s)/0.04,0,1))  # snow stays white
    L=(0.299*r+0.587*g+0.114*b)
    L=np.clip((L-0.05)/0.75,0,1)
    xs=[p for p,_ in BRASS]; out=np.zeros_like(rgb)
    for c in range(3): out[...,c]=np.interp(L,xs,[col[c]/255 for _,col in BRASS])
    rgb2=rgb*(1-w[...,None])+out*w[...,None]
    a[...,:3]=np.clip(rgb2*255,0,255)
    return Image.fromarray(a.astype(np.uint8),'RGBA')
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
    m=cut(box,keep)
    if k=='orn-5': m=brass(m)
    w=round(m.width*h/m.height)
    s=m.resize((w,h),Image.LANCZOS)
    data,q=webp(s); open(f'{OUT}/{k}.webp','wb').write(data); tot+=len(data)
    print(k,m.size,'->',(w,h),'q',q,len(data),'B')
print('total',tot,'B',round(tot/1024,2),'KiB')
