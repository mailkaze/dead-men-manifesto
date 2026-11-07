"""Procesa los vehículos de assets/source/vehicles/*.png (perfil, fondo blanco) para el tráfico.

Para añadir uno nuevo: copia la imagen a assets/source/vehicles/, añade una entrada a VEH con
  bbox   = recuadro del vehículo en la imagen original (x0,y0,x1,y1)
  L      = largo final en píxeles de juego (referencia: Jessica mide 57 de alto; SUV 161 de largo)
  wheels = (cx, cy, r) de cada rueda en la imagen original
  flip   = True si mira a la izquierda; shadowY = fila desde la que borrar sombra de suelo
y ejecuta: python3 tools/art/process_vehicles.py && python3 tools/build.py
Cada rueda se rota 12 veces (30°) sobre la imagen original y luego se pixela.
"""
from PIL import Image, ImageOps
import numpy as np, json, pathlib
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parent.parent
VEH=[
 dict(name='suv',f='suv',flip=False,bbox=(192,120,1190,648),L=161,wheels=[(402,549,95),(1015,549,95)],shadowY=None,speed=[75,125],exhaust=True),
 dict(name='sport',f='sport',flip=False,bbox=(68,240,1308,574),L=135,wheels=[(302,470,100),(1035,470,100)],shadowY=548,speed=[120,170],exhaust=True),
 dict(name='truck',f='truck',flip=False,bbox=(96,58,1280,690),L=215,wheels=[(307,595,93),(530,595,93),(1050,592,93)],shadowY=None,speed=[55,85],exhaust=True),
 dict(name='wagon',f='wagon',flip=True,bbox=(129,170,1250,584),L=135,wheels=[(355,490,90),(1040,490,90)],shadowY=545,speed=[80,120],exhaust=False),
]
out=[]
for v in VEH:
    src=Image.open(ROOT/'assets'/'source'/'vehicles'/f"{v['f']}.png").convert('RGB')
    Wd=src.width
    wheels=v['wheels'];x0,y0,x1,y1=v['bbox']
    if v['flip']:
        src=ImageOps.mirror(src);wheels=[(Wd-1-cx,cy,r) for cx,cy,r in wheels];x0,x1=Wd-1-x1,Wd-1-x0
    a0=np.asarray(src).astype(int).copy()
    if v['shadowY']:
        yy,xx=np.mgrid[0:a0.shape[0],0:a0.shape[1]]
        inw=np.zeros(a0.shape[:2],bool)
        for cx,cy,r in wheels: inw|=(xx-cx)**2+(yy-cy)**2<=r*r
        a0[(yy>=v['shadowY'])&~inw]=255
    src=Image.fromarray(a0.astype('uint8'))
    s=(x1-x0)/v['L'];W=int((x1-x0)/s)+1;H=int((y1-y0)/s)+1
    jj,ii=np.mgrid[0:H,0:W];ccx=x0+(ii+.5)*s;ccy=y0+(jj+.5)*s
    def sample(img,cells=None):
        a=np.asarray(img).astype(int);o=np.zeros((H,W,3))
        for j in range(H):
            for i in range(W):
                if cells is not None and not cells[j,i]: continue
                ya=int(y0+j*s+s*.2);yb=max(ya+1,int(y0+j*s+s*.8));xa=int(x0+i*s+s*.2);xb=max(xa+1,int(x0+i*s+s*.8))
                o[j,i]=np.median(a[ya:yb,xa:xb].reshape(-1,3),0)
        return o
    body=sample(src)
    isbg=np.abs(body-255).sum(2)<50
    vis=np.zeros((H,W),bool);st=[(x,y) for x in range(W) for y in (0,H-1)]+[(x,y) for y in range(H) for x in (0,W-1)]
    while st:
        x,y=st.pop()
        if 0<=x<W and 0<=y<H and not vis[y,x] and isbg[y,x]: vis[y,x]=True;st+=[(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
    pal=Image.fromarray(body.astype('uint8')).quantize(40,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    q=lambda o:np.asarray(Image.fromarray(o.astype('uint8')).quantize(palette=pal,dither=Image.Dither.NONE).convert('RGB'))
    wm=[(ccx-cx)**2+(ccy-cy)**2<=(r-1)**2 for cx,cy,r in wheels]
    for m in wm: vis&=~m
    bodyq=np.dstack([q(body),np.where(vis,0,255)]).astype('uint8');bodyim=Image.fromarray(bodyq,'RGBA')
    wb=[];fw=fh=0
    for m in wm:
        ys,xs=np.where(m);wb.append(dict(x=int(xs.min()),y=int(ys.min()),w=int(xs.max()-xs.min()+1),h=int(ys.max()-ys.min()+1)));fw=max(fw,wb[-1]['w']);fh=max(fh,wb[-1]['h'])
    strip=np.zeros((fh*len(wheels),fw*12,4),'uint8')
    for k,(cx,cy,r) in enumerate(wheels):
        for f in range(12):
            rot=src.rotate(-30*f,center=(cx,cy),resample=Image.BICUBIC,fillcolor=(255,255,255))
            o=q(sample(rot,wm[k]));b=wb[k]
            crop=o[b['y']:b['y']+b['h'],b['x']:b['x']+b['w']];al=(wm[k][b['y']:b['y']+b['h'],b['x']:b['x']+b['w']]*255).astype('uint8')
            strip[k*fh:k*fh+b['h'],f*fw:f*fw+b['w']]=np.dstack([crop,al])
    stripim=Image.fromarray(strip,'RGBA')
    wbottom=max(b['y']+b['h'] for b in wb)
    rpx=sum(r for _,_,r in wheels)/len(wheels)/s
    bp=f"assets/vehicles/{v['name']}_body.png";sp=f"assets/vehicles/{v['name']}_wheels.png"
    bodyim.save(ROOT/bp);stripim.save(ROOT/sp)
    out.append(dict(name=v['name'],w=W,h=H,wb=wbottom,r=round(rpx,2),wheels=wb,fw=fw,fh=fh,speed=v['speed'],exhaust=v['exhaust'],body=f'__ASSET:{bp}__',strip=f'__ASSET:{sp}__'))
    print(v['name'],W,H,'wheel r',round(rpx,1))
json.dump(out,open(ROOT/'assets'/'vehicles'/'vehicles.json','w'),ensure_ascii=False,indent=1)
