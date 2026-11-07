"""Procesa la calle: edificios, suelo (acera + carretera) y ciudad de fondo.

- Edificios: se escalan para que todas las puertas midan ~DOOR px (Jessica mide 57).
  Para añadir uno: imagen en assets/source/street/, entrada en BUILDINGS con
  (nombre, bbox en la imagen original, altura de la puerta en px originales, x de la puerta en px de juego, texto al examinar).
- Suelo: se pixela a 191x106; el juego lo repite alternando con su espejo (sin costuras).
- Fondo: ciudad recortada sin acera, 305x124, también repetida en espejo y con parallax 0.3.
Uso: python3 tools/art/process_street.py && python3 tools/build.py
"""
from PIL import Image
import numpy as np, json, pathlib
HERE=pathlib.Path(__file__).resolve().parent; ROOT=HERE.parent.parent
SRC=ROOT/'assets'/'source'/'street'; OUT=ROOT/'assets'/'street'
DOOR=64
BUILDINGS=[
 ('arcade',(306,173,1070,591),180,151,'JESSICA: El salón recreativo. De niña me pasaba aquí las tardes enteras.'),
 ('genetech',(205,0,1153,686),150,133,'JESSICA: Gene-Tech... Nunca he visto entrar ni salir a nadie de este edificio.'),
 ('bistro',(329,125,1058,631),158,209,'JESSICA: El Neo-Bistro. El café es malo, pero no cierran en toda la noche.'),
 ('bluetech',(320,176,1055,648),165,179,'JESSICA: Puertas automáticas y ni un cartel. Aquí pasa algo raro.'),
 ('industrial',(295,57,1118,651),140,129,'JESSICA: Cámaras, antenas, puertas blindadas... Mejor no acercarme demasiado.'),
]
def sample(a,x0,y0,x1,y1,s):
    W=int((x1-x0)/s);H=int((y1-y0)/s);o=np.zeros((H,W,3))
    for j in range(H):
        for i in range(W):
            ya=int(y0+j*s+s*.2);yb=max(ya+1,int(y0+j*s+s*.8));xa=int(x0+i*s+s*.2);xb=max(xa+1,int(x0+i*s+s*.8))
            o[j,i]=np.median(a[ya:min(yb,a.shape[0]),xa:xb].reshape(-1,3),0)
    return o
meta=[]
for name,(x0,y0,x1,y1),door,doorx,text in BUILDINGS:
    a=np.asarray(Image.open(SRC/f'building_{name}.png').convert('RGB')).astype(int)
    bg=np.median(np.concatenate([a[5:40,5:40].reshape(-1,3),a[700:740,5:60].reshape(-1,3)]),0)
    o=sample(a,x0-2,y0,x1+2,y1+1,door/DOOR);H,W=o.shape[:2]
    isbg=np.abs(o-bg).sum(2)<26
    vis=np.zeros((H,W),bool);st=[(x,y) for x in range(W) for y in (0,H-1)]+[(x,y) for y in range(H) for x in (0,W-1)]
    while st:
        x,y=st.pop()
        if 0<=x<W and 0<=y<H and not vis[y,x] and isbg[y,x]: vis[y,x]=True;st+=[(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
    img=Image.fromarray(o.astype('uint8')).quantize(48,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA')
    al=np.array(img);al[vis,3]=0;img=Image.fromarray(al);img=img.crop(img.getbbox())
    p=f'assets/street/building_{name}.png';img.save(ROOT/p)
    meta.append(dict(src=f'__ASSET:{p}__',w=img.width,h=img.height,door=doorx,t=text));print(name,img.size)
json.dump(meta,open(OUT/'buildings.json','w'),ensure_ascii=False,indent=1)
# ground (remove watermark first)
g=np.asarray(Image.open(SRC/'ground.png').convert('RGB')).astype(int).copy()
g[722:768,1140:1376]=np.median(g[700:720,1100:1376].reshape(-1,3),0)
Image.fromarray(sample(g,0,0,1376,768,7.2).astype('uint8')).quantize(40,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB').save(OUT/'ground.png')
# skyline without the sidewalk (rows >= 559)
a=np.asarray(Image.open(SRC/'skyline.png').convert('RGB')).astype(int)
Image.fromarray(sample(a,0,0,1376,559,559/124).astype('uint8')).quantize(48,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB').save(OUT/'skyline.png')
print('ground + skyline ok')
