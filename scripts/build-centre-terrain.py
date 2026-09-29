"""Mosaic licensed DTM sheets for the 1 km area, newest valid samples first.
The reviewed civic models are preserved; sampler differences are regression-tested.
"""
from pathlib import Path
import numpy as np,zipfile,json,math
from pyproj import Transformer
root=Path(__file__).resolve().parents[1];src=root/'docs/elevation-research/sources';out=root/'docs/world-production/staging/terrain';out.mkdir(parents=True,exist_ok=True)
b=dict(west=11.023,south=43.9171,east=11.051,north=43.9373)
width=math.ceil((b['east']-b['west'])*111320*math.cos(math.radians(43.9272)))+1;height=math.ceil((b['north']-b['south'])*111132)+1
tr=Transformer.from_crs(4326,3003,always_xy=True,allow_ballpark=False)
lon=np.linspace(b['west'],b['east'],width);lat=np.linspace(b['north'],b['south'],height)
X,Y=tr.transform(*np.meshgrid(lon,lat));grid=np.full((height,width),np.nan);yearmap=np.zeros((height,width),dtype=np.uint16);sources=[]
for year,tiles in [(2008,['20j09','20j10','20j17','20j18']),(2010,['20j01','20j02','20j09','20j10'])]:
 for tile in tiles:
  file=src/f'{tile}-dtm-{year}.zip'
  with zipfile.ZipFile(file) as z:
   with z.open(next(n for n in z.namelist() if n.endswith('.asc'))) as f:
    h={}
    for _ in range(6):k,v=f.readline().decode().split();h[k.lower()]=float(v)
    a=np.loadtxt(f)
  c=(X-h['xllcenter'])/h['cellsize'];r=h['nrows']-1-(Y-h['yllcenter'])/h['cellsize']
  ci=np.floor(c).astype(np.int32);ri=np.floor(r).astype(np.int32);valid=(ci>=0)&(ci<a.shape[1]-1)&(ri>=0)&(ri<a.shape[0]-1)
  yy,xx=np.where(valid);cc,rr=ci[valid],ri[valid];u,v=c[valid]-cc,r[valid]-rr
  z00,z10,z01,z11=a[rr,cc],a[rr,cc+1],a[rr+1,cc],a[rr+1,cc+1]
  ok=(z00!=h['nodata_value'])&(z10!=h['nodata_value'])&(z01!=h['nodata_value'])&(z11!=h['nodata_value'])
  sampled=z00*(1-u)*(1-v)+z10*u*(1-v)+z01*(1-u)*v+z11*u*v
  grid[yy[ok],xx[ok]]=sampled[ok];yearmap[yy[ok],xx[ok]]=year;sources.append(dict(file=file.name,year=year,validSamples=int(ok.sum())))
missing=int(np.sum(~np.isfinite(grid)));print('missing',missing,'of',grid.size,flush=True)
assert missing==0,'Do not invent missing elevations'
assert grid.max()<655.35 and grid.min()>=0
(grid*100).round().astype('<u2').tofile(out/'montemurlo-dtm.bin')
vtr=Transformer.from_pipeline(f'+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step +proj=vgridshift +grids={src}/us_nga_egm96_15.tif +multiplier=1 +step +proj=unitconvert +xy_in=rad +xy_out=deg')
g=[round(vtr.transform(x,y,0)[2],5) for x,y in [(b['west'],b['north']),(b['east'],b['north']),(b['west'],b['south']),(b['east'],b['south'])]]
meta=dict(version=2,width=width,height=height,bounds=b,encoding='uint16-le-centimetres',rowOrder='north-to-south',blendMetres=45,geoidCorners=g,surveyYear='2008–2010',source='Fonte dei dati: Regione Toscana – Rilievi LIDAR',sourceUrl='https://dati.toscana.it/it/dataset/lidar',license='CC BY 4.0',horizontalAccuracyMetres=4,verticalAlignment='Approximate EGM96 separation; source geoid not identified.',binary='montemurlo-dtm.bin',sourceSheets=sources)
(out/'montemurlo-dtm.json').write_text(json.dumps(meta,indent=2)+'\n')
# Save native sampled elevations for the offline building-height audit only.
np.savez_compressed(root/'docs/world-production/staging/terrain-audit.npz',height=grid.astype('f4'),surveyYear=yearmap)
print(json.dumps(dict(width=width,height=height,min=float(grid.min()),max=float(grid.max()),years={str(y):int(np.sum(yearmap==y)) for y in [2008,2010]},bytes=grid.size*2)))
