import urllib.request, time, os
S,W,N,E=39.92448,-75.198,39.97751,-75.13056
n=5
for i in range(n):
  for j in range(n):
    p=f'tiles/{i}_{j}.osm'
    if os.path.exists(p) and os.path.getsize(p)>1000: continue
    s=S+(N-S)*i/n; nn=S+(N-S)*(i+1)/n; w=W+(E-W)*j/n; e=W+(E-W)*(j+1)/n
    u=f'https://api.openstreetmap.org/api/0.6/map?bbox={w:.5f},{s:.5f},{e:.5f},{nn:.5f}'
    req=urllib.request.Request(u,headers={'User-Agent':'keyline-art/1.0 (xlockeddown@gmail.com)'})
    try:
      d=urllib.request.urlopen(req,timeout=120).read(); open(p,'wb').write(d); print(p,len(d),flush=True)
    except Exception as ex: print(p,'ERR',ex,flush=True)
    time.sleep(1)
