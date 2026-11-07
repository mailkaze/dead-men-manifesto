import json,sys
from PIL import Image
J=json.load(open('jessica.json'));P={c:tuple(int(v[i:i+2],16) for i in (1,3,5)) for c,v in J['pal'].items()}
def img(fr):
    if 'tail' in fr: fr=dict(fr,rows=[''.join(t if t!='.' else b for b,t in zip(br,tr)) for br,tr in zip(fr['rows'],fr['tail']['rows'])])
    im=Image.new('RGBA',(fr['w'],fr['h']),(156,196,96,255))
    for y,r in enumerate(fr['rows']):
        for x,c in enumerate(r):
            if c!='.': im.putpixel((x,y),P[c]+(255,))
    return im
names=sys.argv[2:]; ims=[img(J['frames'][n]) for n in names]
W=sum(i.width+4 for i in ims);H=max(i.height for i in ims)
s=Image.new('RGBA',(W,H),(255,255,255,255));x=0
for i in ims: s.alpha_composite(i,(x,H-i.height));x+=i.width+4
s.resize((W*6,H*6),Image.NEAREST).save(sys.argv[1])
