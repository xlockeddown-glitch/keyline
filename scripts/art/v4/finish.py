"""Trim, scale (side 192 / front+back 96 wide) and palette-quantize like cars-process.py -> out/."""
import os; from PIL import Image
os.makedirs('out',exist_ok=True)
for c in ['ioniq5','model3']:
    for v,w in [('side',192),('front',96),('back',96)]:
        im=Image.open(f'png/{c}-{v}.png').convert('RGBA'); im=im.crop(im.getchannel('A').getbbox())
        h=round(im.height*w/im.width); im=im.resize((w,h),Image.LANCZOS)
        a=im.getchannel('A'); q=im.convert('RGB').quantize(255,method=Image.MEDIANCUT).convert('RGBA'); q.putalpha(a.point(lambda x:0 if x<40 else 255))
        q.quantize(256,method=Image.FASTOCTREE).save(f'out/{c}-{v}.png',optimize=True); print(c,v,q.size)
