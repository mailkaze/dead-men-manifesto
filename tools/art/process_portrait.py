"""Extrae el retrato de Jessica para los diálogos desde la maqueta de Gemini
(assets/source/jessica/dialogue_mock.png): recupera su cuadrícula (5.4 px), 24 colores,
quita el fondo azul del cuadro de diálogo y unifica el contorno.
Uso: python3 tools/art/process_portrait.py && python3 tools/build.py
"""
from PIL import Image
import numpy as np, pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent.parent
a=np.asarray(Image.open(ROOT/'assets/source/jessica/dialogue_mock.png').convert('RGB')).astype(int)
x0,x1,y0,y1,s=44,326,378,748,5.4
W=int((x1-x0)/s);H=int((y1-y0)/s);out=Image.new('RGBA',(W,H));p=out.load()
for j in range(H):
    for i in range(W):
        c=np.median(a[int(y0+j*s+s*0.3):int(y0+j*s+s*0.7)+1,int(x0+i*s+s*0.3):int(x0+i*s+s*0.7)+1].reshape(-1,3),0)
        if abs(c-np.array([170,170,170])).sum()<36: continue
        p[i,j]=tuple(int(v) for v in c)+(255,)
q=out.convert('RGB').quantize(24,method=Image.Quantize.MEDIANCUT).convert('RGB');q.putalpha(out.getchannel('A'))
a=np.array(q).astype(int);H,W=a.shape[:2]
def bgish(px):
    r,g,b,al=px
    return al==0 or (b>70 and r<40) or (r>200 and g>200 and b>200) or (abs(r-g)<6 and abs(g-b)<6 and 45<r<120)
seen=np.zeros((H,W),bool);st=[(x,y) for x in range(W) for y in (0,H-1)]+[(x,y) for y in range(H) for x in (0,W-1)]
while st:
    x,y=st.pop()
    if not(0<=x<W and 0<=y<H) or seen[y,x] or not bgish(a[y,x]): continue
    seen[y,x]=True;a[y,x,3]=0;st+=[(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
for y in range(H):
    for x in range(W):
        if a[y,x,3] and sum(a[yy,xx,3]>0 for xx,yy in [(x+1,y),(x-1,y),(x,y+1),(x,y-1)] if 0<=xx<W and 0<=yy<H)<=1: a[y,x,3]=0
for y in range(H):
    for x in range(W):
        r,g,b,al=a[y,x]
        if al and r<30 and g<25 and b<60: a[y,x,:3]=(20,12,30)
img=Image.fromarray(a.astype('uint8'),'RGBA');img=img.crop(img.getbbox())
a=np.array(img);a[0:2,18:,3]=0;a[18:34,50:,3]=0
Image.fromarray(a).save(ROOT/'assets/ui/portrait_jessica.png');print('portrait',img.size)
