"""Pixela la habitación (assets/source/scenes/room.png) a escala de Jessica (factor 5 -> 275x153)
y borra la marca de agua de Gemini. Zona caminable, puntos para examinar y salidas se definen en
src/game.html (SCN.room: RPOLY, HS, exits).
Uso: python3 tools/art/process_room.py && python3 tools/build.py
"""
from PIL import Image
import numpy as np, pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent.parent
a=np.asarray(Image.open(ROOT/'assets/source/scenes/room.png').convert('RGB')).astype(int).copy()
a[722:768,1145:1376]=np.median(a[700:720,1300:1370].reshape(-1,3),0)
s=5.0;W=int(1376/s);H=int(768/s);o=np.zeros((H,W,3))
for j in range(H):
    for i in range(W):
        o[j,i]=np.median(a[int(j*s+s*.25):int(j*s+s*.75)+1,int(i*s+s*.25):int(i*s+s*.75)+1].reshape(-1,3),0)
Image.fromarray(o.astype('uint8')).quantize(64,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB').save(ROOT/'assets/scenes/room.png')
print('room',W,H)
