"""Genera assets/sprites/jessica.json (todos los fotogramas de Jessica) a partir de
tools/art/data/raw_frames.json (poses extraídas de las hojas de Gemini + retoques a mano).

Técnicas: paleta fija (pal.py), limpieza de ruido, piernas animadas por piezas (lift / swapshade /
splice2), brazos y pistola dibujados a mano para disparar de frente y de espaldas, coleta en capa
aparte ('tail') para balanceo y viento en tiempo de ejecución.
Uso: python3 tools/art/build_jessica.py
"""
import json, os, pathlib, numpy as np
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parent.parent
from PIL import Image
from pal import PAL
from extract import CH
F=json.load(open(HERE/'data'/'raw_frames.json'))
COL={c:PAL[n] for n,c in CH.items()}
def G(lines):
    w=max(len(l) for l in lines); return np.array([list(l.ljust(w,'.')) for l in lines])
FAM=set('1234abcd')
def clean(g):
    g=g.copy()
    for a,b in (('x','1'),('y','2'),('z','3')): g[g==a]=b
    H,W=g.shape
    for _ in range(2):
        out=g.copy()
        for y in range(1,H-1):
            for x in range(1,W-1):
                c=g[y,x]
                if c not in FAM: continue
                n=[g[y-1,x],g[y+1,x],g[y,x-1],g[y,x+1]]
                for cand in set(n):
                    if cand!=c and cand in FAM and n.count(cand)>=3: out[y,x]=cand
        g=out
    return g
def outline(g):
    H,W=g.shape;o=g.copy()
    for y in range(H):
        for x in range(W):
            if g[y,x]!='.' and any(not(0<=yy<H and 0<=xx<W) or g[yy,xx]=='.' for yy,xx in((y+1,x),(y-1,x),(y,x+1),(y,x-1))): o[y,x]='O'
    return o
def paste(g,ov,x0,y0):
    g=g.copy()
    for y,r in enumerate(ov):
        for x,c in enumerate(r):
            if c!='.' and 0<=y0+y<g.shape[0] and 0<=x0+x<g.shape[1]: g[y0+y,x0+x]=c
    return g
def pad(g,W,H,ox=0,oy=0):
    o=np.full((H,W),'.'); o[oy:oy+g.shape[0],ox:ox+g.shape[1]]=g; return o
def legs_mirror(g,hs,cx):
    o=g.copy(); o[hs:,:]='.'
    H,W=g.shape
    for y in range(hs,H):
        for x in range(W):
            if g[y,x]!='.':
                nx=int(round(2*cx-x))
                if 0<=nx<W: o[y,nx]=g[y,x]
    return o
def lift(g,hs,cond,n):
    o=g.copy();H,W=g.shape
    for y in range(hs,H):
        for x in range(W):
            if cond(x): o[y,x]='.'
    for y in range(hs,H):
        for x in range(W):
            if cond(x) and g[y,x]!='.': o[y-n,x]=g[y,x]
    return o
def splice(upper,legs,hs,bob=0,overlay=None):
    H,W=legs.shape; o=np.full((H,W),'.')
    o[hs:,:]=legs[hs:,:]
    for y in range(0,hs):
        for x in range(min(W,upper.shape[1])):
            c=upper[y,x]
            if c!='.' and y+bob<H: o[y+bob,x]=c
    if overlay is not None:
        ov,ox,oy=overlay; o=paste(o,ov,ox,oy+bob)
    return o
FR={};AN={}
def add(name,g,ax,ay,muz=None,tail=None,bob=0):
    d=dict(w=g.shape[1],h=g.shape[0],ax=ax,ay=ay,muz=muz)
    if tail:
        m=np.zeros(g.shape,bool)
        for (x0,y0,x1,y1) in tail['rects']:
            m[max(0,y0+bob):max(0,y1+bob+1),max(0,x0):x1+1]=True
        m&=(g!='.')
        body=g.copy();body[m]='.';tl=np.full(g.shape,'.');tl[m]=g[m]
        px,py=tail['pivot']
        d['rows']=[''.join(r) for r in body];d['tail']=dict(rows=[''.join(r) for r in tl],px=px,py=py+bob,len=tail['len'],mode=tail['mode'])
    else: d['rows']=[''.join(r) for r in g]
    FR[name]=d
# ---------------- DOWN ----------------
D=clean(G(F['down_idle_fix'])); D=pad(D,32,57)
hsD,cxD=47,11
Ds=D.copy()
Ds[34:47,0:5]='.'; Ds[35:47,18:24]='.'
Ds=outline(Ds)
GUN_D=["OcbO......ObcO","ObbcO....OcbbO",".ObbcO..OcbbO.","..ObbcOOcbbO..","..O2SMMMMS2O..","..O1SmOOmS1O..","..OO1mOOm1OO..","....OmmmmO....",".....OOOO....."]
Ds=paste(Ds,GUN_D,4,31)
legsA=lift(D,hsD,lambda x:x<cxD,2); legsB=lift(D,hsD,lambda x:x>cxD,2)
runA=lift(D,hsD,lambda x:x<cxD,3); runB=lift(D,hsD,lambda x:x>cxD,3)
TD=dict(rects=[(23,6,31,32),(24,33,31,41)],pivot=(23,5),len=33,mode='x')
for pre,up in (('',D),('s',Ds)):
    m=(10.5,36.5) if pre else None
    add(f'd_{pre}st0',splice(up,D,hsD,0),11,57,m,TD); add(f'd_{pre}st1',splice(up,D,hsD,1),11,57,m and (m[0],m[1]+1),TD,1)
    add(f'd_{pre}wA',splice(up,legsA,hsD,0),11,57,m,TD); add(f'd_{pre}wB',splice(up,legsB,hsD,0),11,57,m,TD)
    add(f'd_{pre}rA',splice(up,runA,hsD,0),11,57,m,TD); add(f'd_{pre}rB',splice(up,runB,hsD,0),11,57,m,TD)
    add(f'd_{pre}st2',splice(up,D,hsD,2),11,57,m and (m[0],m[1]+2),TD,2)
# ---------------- UP ----------------
U=clean(G(F['up_idle'])); hsU,cxU=43,10.5
Us=U.copy(); Us[33:43,0:5]='.'; Us[33:43,17:23]='.'; Us=outline(Us)
ELB_L=["OO.","ObO","OaO",".O."]; Us=paste(Us,ELB_L,3,30); Us=paste(Us,[r[::-1] for r in ELB_L],17,30)
uA=lift(U,hsU,lambda x:x<=10,2); uB=lift(U,hsU,lambda x:x>=11,2); urA=lift(U,hsU,lambda x:x<=10,3); urB=lift(U,hsU,lambda x:x>=11,3)
TU=dict(rects=[(6,16,13,26)],pivot=(9,14),len=11,mode='x')
for pre,up in (('',U),('s',Us)):
    m=(11,4) if pre else None
    add(f'u_{pre}st0',splice(up,U,hsU,0),11,55,m,TU); add(f'u_{pre}st1',splice(up,U,hsU,1),11,55,m,TU,1)
    add(f'u_{pre}wA',splice(up,uA,hsU,0),11,55,m,TU); add(f'u_{pre}wB',splice(up,uB,hsU,0),11,55,m,TU)
    add(f'u_{pre}rA',splice(up,urA,hsU,0),11,55,m,TU); add(f'u_{pre}rB',splice(up,urB,hsU,0),11,55,m,TU)
    add(f'u_{pre}st2',splice(up,U,hsU,2),11,55,m,TU,2)
# ---------------- RIGHT ----------------
RS=clean(G(F['right_shoot_idle'])); RW=clean(G(F['right_shoot_walk']))
W_=max(RS.shape[1],RW.shape[1]); H_=max(RS.shape[0],RW.shape[0]); RS=pad(RS,W_,H_); RW=pad(RW,W_,H_)
hsR,cxR=43,15.5
RI=RS.copy(); RI[26:29,26:]='.'; RI[29:37,23:]='.'; RI=outline(RI)
ARM=[".OOO.","OddcO","OdccO","OdcbO","OdcbO","OdcbO","OccbO","OCCCO","O2SSO","O21SO","OmmmO",".OmMO",".OmMO","..OO."]
FARH=["OO.","O1O","O2O",".O."]
def muzzle(g):
    best=None
    for y in range(18,37):
        xs=[x for x in range(g.shape[1]) if g[y,x]!='.']
        if xs and (best is None or max(xs)>best[0]): best=(max(xs),y)
    return (best[0]+1,best[1])
DARK={'4':'3','3':'2','2':'1','1':'1','d':'c','c':'b','b':'a'}
LITE={'1':'2','2':'3','3':'4','a':'b','b':'c','c':'d'}
def swapshade(g,hs,cx):
    o=g.copy();H,W=g.shape
    for y in range(hs+2,H):
        for x in range(W):
            c=g[y,x]
            if c=='.' or c=='O': continue
            o[y,x]=DARK.get(c,c) if x>=cx else LITE.get(c,c)
    return o
def hipcx(g,row):
    xs=[x for x in range(g.shape[1]) if g[row,x]!='.']; return (min(xs)+max(xs))/2
def splice2(up,uhs,legs,lhs,lcx,tcx,bob=0):
    H,W=up.shape;o=np.full((H,W),'.')
    dx=int(round(tcx-lcx))
    for y in range(lhs,legs.shape[0]):
        ty=uhs+(y-lhs)
        if ty>=H: break
        for x in range(legs.shape[1]):
            if legs[y,x]!='.' and 0<=x+dx<W: o[ty,x+dx]=legs[y,x]
    for y in range(uhs):
        for x in range(W):
            if up[y,x]!='.' and y+bob<H: o[y+bob,x]=up[y,x]
    return o
mS=muzzle(RS); print('muzzle shoot idle',mS)
IB=clean(G(F['right_idle_B'])); hsIB=42
IB[hsIB:,28:]='.'
RB=clean(G(F['right_run_B'])); hsRB=38
lcxRS=hipcx(RS,hsR+1); lcxRW=hipcx(RW,hsR+1); lcxIB=hipcx(IB,hsIB); lcxRB=hipcx(RB,hsRB)
T_IB=dict(rects=[(0,6,8,21),(0,22,9,30)],pivot=(7,4),len=26,mode='x')
T_RS=dict(rects=[(0,6,4,36)],pivot=(4,4),len=31,mode='x')
T_RUN=dict(rects=[(0,7,12,16)],pivot=(13,8),len=13,mode='y')
def frameset(up,uhs,ucx,tail,pre,m):
    H=uhs+14
    upP=pad(up,max(up.shape[1],40),max(up.shape[0],H))[:H]
    stand=lambda bob: splice2(upP,uhs,RS,hsR,lcxRS,ucx,bob)
    add(f'r_{pre}st0',stand(0),int(round(ucx)),H,m,tail); add(f'r_{pre}st1',stand(1),int(round(ucx)),H,m and (m[0],m[1]+1),tail,1)
    add(f'r_{pre}st2',stand(2),int(round(ucx)),H,m and (m[0],m[1]+2),tail,2)
    wA=splice2(upP,uhs,RW,hsR,lcxRW,ucx,0)
    wB=splice2(upP,uhs,swapshade(IB,hsIB-2,lcxIB),hsIB,lcxIB,ucx,0)
    add(f'r_{pre}wA',wA,int(round(ucx)),H,m,tail); add(f'r_{pre}wB',wB,int(round(ucx)),H,m,tail)
frameset(IB,hsIB,lcxIB,T_IB,'',None)
frameset(RS,hsR,lcxRS,T_RS,'s',mS)
for pre,src in (('',clean(G(F['right_run_A']))),('s',clean(G(F['right_shoot_run'])))):
    hs=40; cx=hipcx(src,hs+1); m=muzzle(src) if pre else None
    H=src.shape[0]
    A_=src.copy()
    B_=splice2(src,hs,swapshade(RB,hsRB-2,lcxRB),hsRB,lcxRB,cx,0)
    ax=int(round(cx))
    add(f'r_{pre}rA',A_,ax,H,m,T_RUN); add(f'r_{pre}rA2',A_,ax,H+1,m,T_RUN)
    add(f'r_{pre}rB',B_,ax,H,m,T_RUN); add(f'r_{pre}rB2',B_,ax,H+1,m,T_RUN)
# ---------------- ANIMS ----------------
for d in 'du':
    AN[d]={'idle':[f'{d}_st0',f'{d}_st1'],'walk':[f'{d}_wA',f'{d}_st1',f'{d}_wB',f'{d}_st1'],'run':[f'{d}_rA',f'{d}_st2',f'{d}_rB',f'{d}_st2'],
           'sidle':[f'{d}_sst0'],'swalk':[f'{d}_swA',f'{d}_sst1',f'{d}_swB',f'{d}_sst1'],'srun':[f'{d}_srA',f'{d}_sst2',f'{d}_srB',f'{d}_sst2']}
AN['r']={'idle':['r_st0','r_st1'],'walk':['r_wA','r_st1','r_wB','r_st1'],'run':['r_rA','r_rA2','r_rB','r_rB2'],
         'sidle':['r_sst0'],'swalk':['r_swA','r_sst1','r_swB','r_sst1'],'srun':['r_srA','r_srA2','r_srB','r_srB2']}
pal={c:'#%02x%02x%02x'%v for c,v in COL.items() if c not in 'xyz'}
json.dump({'pal':pal,'frames':FR,'anims':AN},open(ROOT/'assets'/'sprites'/'jessica.json','w'))
print(len(FR),'frames')
# preview sheet
def img(fr):
    im=Image.new('RGBA',(fr['w'],fr['h']))
    rows=fr['rows']
    if 'tail' in fr: rows=[''.join(t if t!='.' else b for b,t in zip(br,tr)) for br,tr in zip(fr['rows'],fr['tail']['rows'])]
    for y,r in enumerate(rows):
        for x,c in enumerate(r):
            if c!='.': im.putpixel((x,y),COL[c]+(255,))
    return im
rows=[]
for d in 'dur':
    for st in ['idle','walk','run','sidle','swalk','srun']:
        rows.append([FR[n] for n in AN[d][st]])
cw,chh=56,62
sheet=Image.new('RGBA',(cw*4,chh*len(rows)),(156,196,96,255))
for j,row in enumerate(rows):
    for i,fr in enumerate(row):
        sheet.alpha_composite(img(fr),(i*cw+20-fr['ax'] if fr['ax']<20 else i*cw, j*chh+chh-2-fr['ay']))
os.makedirs(HERE/'out',exist_ok=True);sheet.save(HERE/'out'/'anim_sheet.png')
sheet.resize((sheet.width*3,sheet.height*3),Image.NEAREST).save(HERE/'out'/'anim_sheet_x3.png')
