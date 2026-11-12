from PIL import Image
im=Image.open('/home/box/keyline-art/comet-v1.jpeg').convert('RGB')
C={'hero':(470,60,1640,1240),'open':(90,1230,720,1935),'cooling':(735,1280,1335,1945),'locked':(1395,1310,1990,1945)}
for k,b in C.items(): im.crop(b).save(f'{k}-src.png')
import json; json.dump(C,open('crops.json','w'))
