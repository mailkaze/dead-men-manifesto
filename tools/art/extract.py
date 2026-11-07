import numpy as np
from PIL import Image
from scipy import ndimage
from pal import PAL
NAMES=list(PAL); PV=np.array([PAL[n] for n in NAMES],float)
CH={'O':'O','h1':'1','h2':'2','h3':'3','h4':'4','k1':'S','k2':'s','k3':'t','e1':'E','eW':'W','g1':'a','g2':'b','g3':'c','g4':'d','c1':'C','p1':'x','p2':'y','p3':'z','m1':'m','m2':'M'}
RCH={v:k for k,v in CH.items()}
def lab(c):
    c=np.asarray(c,float)/255
    return np.stack([0.299*c[...,0]+0.587*c[...,1]+0.114*c[...,2], c[...,0]-c[...,1], c[...,2]-(c[...,0]+c[...,1])/2],-1)*[2.0,1.2,1.2]
def components(path, region=None, minh=120):
    a=np.asarray(Image.open(path).convert('RGB')).astype(int)
    sat=np.abs(a-a.mean(2,keepdims=True)).sum(2)
    bg=(sat<22)&(a.mean(2)>140)
    m=~bg
    if region: 
        mm=np.zeros_like(m); x0,y0,x1,y1=region; mm[y0:y1,x0:x1]=m[y0:y1,x0:x1]; m=mm
    m=ndimage.binary_opening(m,iterations=1)
    lab_,n=ndimage.label(ndimage.binary_closing(m,iterations=3))
    out=[]
    for s in ndimage.find_objects(lab_):
        if s[0].stop-s[0].start>=minh: out.append((s[1].start,s[0].start,s[1].stop,s[0].stop))
    return out
def extract(path,box,s,pad=6):
    a=np.asarray(Image.open(path).convert('RGB')).astype(int)
    x0,y0,x1,y1=box; x0-=pad;y0-=pad;x1+=pad;y1+=pad
    best=None
    for ox in np.arange(0,s,1.0):
      for oy in np.arange(0,s,1.0):
        W=int((x1-x0-ox)/s);H=int((y1-y0-oy)/s);arr=np.zeros((H,W,3));sd=0
        for j in range(H):
          for i in range(W):
            ya=int(y0+oy+j*s+s*.25);yb=max(ya+1,int(y0+oy+j*s+s*.75));xa=int(x0+ox+i*s+s*.25);xb=max(xa+1,int(x0+ox+i*s+s*.75))
            c=a[ya:yb,xa:xb].reshape(-1,3); arr[j,i]=np.median(c,0); sd+=c.std(0).sum()
        if best is None or sd<best[0]: best=(sd,arr)
    arr=best[1];H,W=arr.shape[:2]
    isbg=(np.abs(arr-arr.mean(2,keepdims=True)).sum(2)<22)&(arr.mean(2)>140)
    vis=np.zeros((H,W),bool);st=[(x,y) for x in range(W) for y in (0,H-1)]+[(x,y) for y in range(H) for x in (0,W-1)]
    while st:
        x,y=st.pop()
        if 0<=x<W and 0<=y<H and not vis[y,x] and isbg[y,x]: vis[y,x]=True;st+=[(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
    labb,n=ndimage.label(isbg)
    for k in range(1,n+1):
        mk=labb==k
        if mk.sum()>=4: vis|=mk
    src=arr.copy(); mm=src.mean(2,keepdims=True); src=np.clip(mm+(src-mm)*1.25,0,255); src=np.clip((src-12)*1.08,0,255)
    idx=((lab(src)[:,:,None,:]-lab(PV)[None,None])**2).sum(-1).argmin(-1)
    g=np.array([CH[n] for n in NAMES])[idx].astype('<U1'); g[vis]='.'
    def nb(y,x): return [(y+dy,x+dx) for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]]
    for _ in range(2):
        for y in range(H):
            for x in range(W):
                if g[y,x]!='.' and sum(1 for yy,xx in nb(y,x) if 0<=yy<H and 0<=xx<W and g[yy,xx]!='.')<=1: g[y,x]='.'
    g2=g.copy()
    for y in range(H):
        for x in range(W):
            if g[y,x]!='.' and any(not(0<=yy<H and 0<=xx<W) or g[yy,xx]=='.' for yy,xx in nb(y,x)): g2[y,x]='O'
    ys,xs=np.where(g2!='.')
    g2=g2[ys.min():ys.max()+1, xs.min():xs.max()+1]
    return [''.join(r) for r in g2]
def render(lines,bg=None):
    H=len(lines);W=max(len(l) for l in lines);im=Image.new('RGBA',(W,H),bg or (0,0,0,0))
    for y,l in enumerate(lines):
        for x,c in enumerate(l):
            if c!='.': im.putpixel((x,y),PAL[RCH[c]]+(255,))
    return im
