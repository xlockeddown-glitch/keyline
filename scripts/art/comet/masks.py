from rembg import remove, new_session
from PIL import Image
s=new_session('isnet-general-use')
for k in ['hero','open','cooling','locked']:
    remove(Image.open(f'{k}-src.png'),session=s,only_mask=True).save(f'{k}-mask.png'); print(k,flush=True)
