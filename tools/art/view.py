import json,sys
from PIL import Image, ImageDraw
from extract import render
def zoom(lines,path,sc=12):
    im=render(lines,(156,196,96,255)); W,H=im.size
    big=im.resize((W*sc,H*sc),Image.NEAREST).convert('RGB')
    out=Image.new('RGB',(W*sc+30,H*sc+30),(255,255,255)); out.paste(big,(30,30)); d=ImageDraw.Draw(out)
    for x in range(0,W,5): d.line([(30+x*sc,30),(30+x*sc,30+H*sc)],fill=(255,255,255) if x%10 else (255,0,0)); d.text((30+x*sc+1,10),str(x),fill=(0,0,0))
    for y in range(0,H,5): d.line([(30,30+y*sc),(30+W*sc,30+y*sc)],fill=(255,255,255) if y%10 else (255,0,0)); d.text((2,30+y*sc),str(y),fill=(0,0,0))
    out.save(path)
if __name__=='__main__':
    F=json.load(open(sys.argv[1])); zoom(F[sys.argv[2]],sys.argv[3],int(sys.argv[4]) if len(sys.argv)>4 else 12)
