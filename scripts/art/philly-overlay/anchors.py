import json,math,numpy as np
from PIL import Image, ImageDraw
F={o['id']:o for o in json.load(open('features.json'))}
S,W,N,E=39.92448,-75.198,39.97751,-75.13056
im=np.asarray(Image.open('philly-overlay.webp').convert('RGBA'),np.float32)
H,Wd=im.shape[:2]; A=im[...,3]/255
def merc(lat,lng):
  s=math.sin(math.radians(lat)); return (lng+180)/360,(0.5-math.log((1+s)/(1-s))/(4*math.pi))
X0,Y0=merc(N,W); X1,Y1=merc(S,E)
def topx(lat,lng):
  x,y=merc(lat,lng); return (x-X0)/(X1-X0)*Wd,(y-Y0)/(Y1-Y0)*H
def centroid(ring):
  pts=[topx(*p) for p in ring]; a=cx=cy=0
  for (x1,y1),(x2,y2) in zip(pts,pts[1:]):
    c=x1*y2-x2*y1; a+=c; cx+=(x1+x2)*c; cy+=(y1+y2)*c
  return cx/(3*a), cy/(3*a)
def unproj(px,py):
  x=X0+px/Wd*(X1-X0); y=Y0+py/H*(Y1-Y0)
  return math.degrees(math.atan(math.sinh(math.pi*(1-2*y)))), x*360-180
out=[]
for nm,fid in [('Philadelphia City Hall','r4720912'),('Rittenhouse Square','w32122312'),('Washington Square','w705317585'),('Franklin Square','w705322048'),('Logan Square','r21281848')]:
  ring=max(F[fid]['rings'],key=len)
  pts=[topx(*p) for p in ring]
  m=Image.new('L',(Wd,H),0); ImageDraw.Draw(m).polygon(pts,fill=255); M=np.asarray(m,np.float32)/255
  best=None
  for dy in range(-8,9):
    for dx in range(-8,9):
      Ms=np.roll(np.roll(M,dy,0),dx,1)
      s=(Ms*A).sum()/((Ms+A*(Ms>0)).sum()+1e-6)
      if best is None or s>best[0]: best=(s,dx,dy)
  cx,cy=centroid(ring); lat,lng=unproj(cx,cy)
  out.append({'name':nm,'osm':fid,'lat':round(lat,6),'lng':round(lng,6),'px':round(cx+best[1],2),'py':round(cy+best[2],2),'shift_img_px':[best[1],best[2]]})
  print(nm,best)
json.dump({'image':{'w':Wd,'h':Ht if False else H},'anchors':out},open('anchors.json','w'),indent=1)
