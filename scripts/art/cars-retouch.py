"""Retouch generated sources before process.py: R2 glass -> dark gold tint, drop Honda hub badges (R2) and Lotus badges (Roadster)."""
from PIL import Image, ImageDraw; import numpy as np
D='/workspace/carart/v3'
def disc(im,x,y,r,col): ImageDraw.Draw(im).ellipse((x-r,y-r,x+r,y+r),fill=col)
for v in ['side','front','back']:
    im=Image.open(f'{D}/roadster2-{v}-src-orig.jpg').convert('RGB'); a=np.asarray(im).astype(float)
    H=a.shape[0]; r,g,b=a[...,0],a[...,1],a[...,2]
    yl=(r>120)&(g>80)&(b<0.7*g)&(r-b>60); yl[int(H*.5):]=False   # yellow/amber glass, upper half only
    a[yl]=a[yl]*[.30,.26,.20]+[14,12,10]
    im=Image.fromarray(a.clip(0,255).astype('uint8'))
    if v=='side':
        for x in (287,984): disc(im,x,446,10,(28,28,30)); disc(im,x,446,4,(70,66,60))
    im.save(f'{D}/roadster2-{v}-src.jpg',quality=95)
im=Image.open(f'{D}/roadster-turn-orig.jpg').convert('RGB')
disc(im,790,382,9,tuple(np.asarray(im)[372,770]))      # Lotus nose badge -> body white
for x,y in ((152,414),(509,412)): disc(im,x,y,8,(58,58,62)); disc(im,x,y,3,(120,120,124))  # yellow hub caps -> grey
im.save(f'{D}/roadster-turn.jpg',quality=95)
