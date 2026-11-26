import json, math, random, gzip, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
S,W,N,E=39.92448,-75.198,39.97751,-75.13056
Z=float(sys.argv[1]) if len(sys.argv)>1 else 15
SC=256*2**Z
def px(lat,lng):
  x=(lng+180)/360*SC
  s=math.sin(math.radians(lat)); y=(0.5-math.log((1+s)/(1-s))/(4*math.pi))*SC
  return x,y
x0,y0=px(N,W); x1,y1=px(S,E)
Wd=round(x1-x0); Ht=round(y1-y0)
print('size',Wd,Ht, file=sys.stderr)
def P(lat,lng):
  x,y=px(lat,lng); return ((x-x0)/(x1-x0)*Wd,(y-y0)/(y1-y0)*Ht)
F=json.load(open('features.json'))
K=2  # supersample
def ring_px(r): return [(a*K,b*K) for a,b in (P(la,lo) for la,lo in r)]
def mask_of(feats):
  m=Image.new('L',(Wd*K,Ht*K),0); d=ImageDraw.Draw(m)
  for f in feats:
    for r in f['rings']:
      if len(r)>2: d.polygon(ring_px(r),fill=255)
    for r in f.get('holes',[]):
      if len(r)>2: d.polygon(ring_px(r),fill=0)
  return m
rng=np.random.default_rng(182); random.seed(182)
def noise(scale,seed):
  r=np.random.default_rng(seed)
  small=r.random((max(2,Ht*K//scale),max(2,Wd*K//scale))).astype(np.float32)
  return np.asarray(Image.fromarray((small*255).astype(np.uint8)).resize((Wd*K,Ht*K),Image.BICUBIC),dtype=np.float32)/255
water=[f for f in F if f['k']=='water']
parks=[f for f in F if f['k']=='park' and (f['name'] or True)]
LM=['r4720912','w25271595','w40083518','w40083567','w28533972','w32272623','w50189935','w42784822','w40083914','w40086417','w261314259','w332757057','w309294828','w334239472','w183625405','w336855435','r19277077','w353034105','w222122351','w60945611','w60945635','w60945640','w60945641','w60945642','w60945643','w60945644','w60945645','w664678411','w664678412','w865740088','r11817436','w337636420','r3366773']
lm=[f for f in F if f['id'] in LM]
mw=np.asarray(mask_of(water),dtype=np.float32)/255
mp=np.asarray(mask_of(parks),dtype=np.float32)/255
mp=mp*(1-mw)
ml=np.asarray(mask_of(lm),dtype=np.float32)/255
H,Wk=mw.shape
rgb=np.zeros((H,Wk,3),np.float32); a=np.zeros((H,Wk),np.float32)
def comp(mask,col,alpha):
  global rgb,a
  m=mask*alpha
  rgb=rgb*(1-m[...,None])+np.asarray(col,np.float32)[None,None,:]*m[...,None] if col.ndim==1 else rgb*(1-m[...,None])+col*m[...,None]
  a=a+m*(1-a)
def edge(mask,width):
  im=Image.fromarray((mask*255).astype(np.uint8))
  er=np.asarray(im.filter(ImageFilter.MinFilter(width*2+1)),np.float32)/255
  return np.clip(mask-er,0,1)
n1=noise(40,1); n2=noise(9,2); n3=noise(160,3)
# water: deep navy painted with streaky tone
wcol=np.stack([18+10*n1+2*n3, 26+12*n1+3*n3, 48+22*n1+5*n3],-1)/255
comp(mw,wcol,0.92)
# ripples: light flecks
fl=(noise(3,7)>0.985).astype(np.float32)*(n3>0.5)
comp(mw*fl,np.array([0.42,0.52,0.66]),0.55)
# quay edge
comp(edge(mw,3*K)*1.0,np.array([0.36,0.36,0.38]),0.85)
# parks: dark green paint
pcol=np.stack([38+14*n1+3*n2, 66+22*n1+4*n2, 40+10*n1+2*n2],-1)/255
comp(mp,pcol,0.9)
comp(edge(mp,2*K),np.array([0.30,0.31,0.29]),0.8)
# tree clumps
tree=Image.new('L',(Wk,H),0); hl=Image.new('L',(Wk,H),0); sh=Image.new('L',(Wk,H),0)
dt=ImageDraw.Draw(tree); dh=ImageDraw.Draw(hl); ds=ImageDraw.Draw(sh)
ys,xs=np.nonzero(mp[::6,::6]>0.5)
cnt=0
for yy,xx in zip(ys*6,xs*6):
  if random.random()>0.10: continue
  r=random.uniform(2.6,5.2)*K*(2**(Z-15))
  if mp[min(H-1,int(yy+r)),xx]<0.5 or mp[max(0,int(yy-r)),xx]<0.5: continue
  for k in range(random.randint(3,5)):
    cx=xx+random.uniform(-r,r)*0.7; cy=yy+random.uniform(-r,r)*0.7; rr=r*random.uniform(0.55,0.85)
    ds.ellipse([cx-rr+r*0.25,cy-rr+r*0.3,cx+rr+r*0.25,cy+rr+r*0.3],fill=255)
    dt.ellipse([cx-rr,cy-rr,cx+rr,cy+rr],fill=255)
    dh.ellipse([cx-rr*0.7-rr*0.25,cy-rr*0.7-rr*0.25,cx+rr*0.3,cy+rr*0.3],fill=255)
  cnt+=1
print('clumps',cnt,file=sys.stderr)
T=np.asarray(tree,np.float32)/255; Hl=np.asarray(hl,np.float32)/255*T; Sh=np.asarray(sh,np.float32)/255*(1-T)
comp(Sh*mp,np.array([0.08,0.12,0.08]),0.55)
comp(T,np.stack([22+10*n2,48+16*n2,24+8*n2],-1)/255,0.97)
comp(Hl,np.stack([52+14*n2,86+18*n2,46+8*n2],-1)/255,0.8)
comp(edge(T,1*K),np.array([0.06,0.10,0.06]),0.7)
# landmarks: stone (City Hall, PMA, 30th st) or brick
stone={'r4720912','w28533972','w32272623','w50189935','w337636420','r3366773','w336855435','w183625405','w309294828','r19277077'}
for f in lm:
  m=np.asarray(mask_of([f]),np.float32)/255
  if f['id'] in stone: base=np.stack([128+20*n2,122+18*n2,108+14*n2],-1)/255; ed=np.array([0.22,0.21,0.20])
  else: base=np.stack([122+18*n2,52+10*n2,40+8*n2],-1)/255; ed=np.array([0.20,0.10,0.08])
  # drop shadow
  sm=np.roll(np.roll(m,int(2*K),0),int(2*K),1)*(1-m)
  comp(sm,np.array([0.05,0.05,0.07]),0.5)
  comp(m,base,1.0)
  inner=edge(m,int(3*K))-edge(m,int(1.5*K))
  comp(np.clip(inner,0,1),base*1.18,0.6)
  comp(edge(m,int(1*K)),ed,0.9)
# paper grain
g=noise(2,11)
rgb=np.clip(rgb*(0.98+0.04*n3[...,None]),0,1)
# streets transparent: erase graph streets
d=json.load(gzip.open('/workspace/kl-180/public/streets/v2/philly.950f3989dd.json.gz'))
n=len(d['nodes'])//2; la=0; lo=0; LL=[]
for i in range(n):
  la+=d['nodes'][2*i]; lo+=d['nodes'][2*i+1]; LL.append((la/1e5,lo/1e5))
er=Image.new('L',(Wk,H),0); de=ImageDraw.Draw(er)
mpp=156543.03*math.cos(math.radians(39.95))/2**Z/K  # m per supersampled px
for w in d['ways']:
  f=w[2]
  if not (f&3) or (f&4): continue
  wid=max(2,int((9 if f&8 else 6)/mpp))
  ix=w[3]; pts=[ix]
  for k in range(4,len(w)): ix+=w[k]; pts.append(ix)
  q=[(P(*LL[i])[0]*K,P(*LL[i])[1]*K) for i in pts]
  if len(q)>1: de.line(q,fill=255,width=wid)
Er=np.asarray(er.filter(ImageFilter.GaussianBlur(K)),np.float32)/255
keep=np.clip(1-Er*1.15,0,1)
# keep landmarks/water unerased? erase only parks & trees; water ok to erase bridges
a=a*np.maximum(keep,ml)
out=np.dstack([rgb,a])
img=Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8),'RGBA').resize((Wd,Ht),Image.LANCZOS)
img.save(f'overlay-z{int(Z)}.png')
json.dump({'w':Wd,'h':Ht,'z':Z,'bounds':{'nw':[N,W],'ne':[N,E],'se':[S,E],'sw':[S,W]}},open(f'meta-z{int(Z)}.json','w'))
