"""Build the runtime 1 m regional terrain and independently audit CTR spot heights.
Offline inputs retained in docs/elevation-research/sources. Requires numpy, pyproj, pyshp.
EGM96 is an explicit approximate vertical alignment, not a certified regional datum conversion.
"""
from pathlib import Path
import io, json, zipfile
import numpy as np
from pyproj import Transformer
import shapefile
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'docs/elevation-research/sources'
OUT=ROOT/'public/data/terrain';OUT.mkdir(parents=True,exist_ok=True)
tr=Transformer.from_crs('EPSG:4326','EPSG:3003',always_xy=True,allow_ballpark=False)
inv=Transformer.from_crs('EPSG:3003','EPSG:4326',always_xy=True,allow_ballpark=False)
west,east,south,north=11.0345,11.0415,43.9258,43.9315
width=565;height=635
lons=np.linspace(west,east,width);lats=np.linspace(north,south,height)
LON,LAT=np.meshgrid(lons,lats);X,Y=tr.transform(LON,LAT)
grid=np.full(X.shape,np.nan)
for tile in ['20j10','20j02']:
 with zipfile.ZipFile(SRC/f'{tile}-dtm-2010.zip') as archive:
  name=next(n for n in archive.namelist() if n.endswith('.asc'))
  with archive.open(name) as f:
   header={}
   for _ in range(6):
    k,v=f.readline().decode().split();header[k]=float(v)
   a=np.loadtxt(f)
 # Bilinear resampling in the native projection, no nearest-cell stair artefacts.
 c=(X-header['xllcenter'])/header['cellsize'];r=header['nrows']-1-(Y-header['yllcenter'])/header['cellsize']
 c0=np.floor(c).astype(int);r0=np.floor(r).astype(int)
 ok=(c0>=0)&(c0<a.shape[1]-1)&(r0>=0)&(r0<a.shape[0]-1)
 ci,ri=c0[ok],r0[ok];u,v=c[ok]-ci,r[ok]-ri
 corners=[a[ri,ci],a[ri,ci+1],a[ri+1,ci],a[ri+1,ci+1]]
 assert all(np.all(z!=header['NODATA_value']) for z in corners)
 grid[ok]=corners[0]*(1-u)*(1-v)+corners[1]*u*(1-v)+corners[2]*(1-u)*v+corners[3]*u*v
assert np.isfinite(grid).all()
# Source document says geoid-related heights, but does not identify its geoid.
# EGM96 supplies a plausible local WGS84 alignment; preserve raw regional heights separately.
vtr=Transformer.from_pipeline(f'+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step +proj=vgridshift +grids={SRC}/us_nga_egm96_15.tif +multiplier=1 +step +proj=unitconvert +xy_in=rad +xy_out=deg')
geoid=[round(vtr.transform(lon,lat,0)[2],5) for lon,lat in [(west,north),(east,north),(west,south),(east,south)]]
(grid*100).round().astype('<u2').tofile(OUT/'montemurlo-dtm.bin')
meta=dict(version=1,width=width,height=height,bounds=dict(west=west,east=east,south=south,north=north),encoding='uint16-le-centimetres',rowOrder='north-to-south',blendMetres=45,geoidCorners=geoid,surveyYear=2010,source='Fonte dei dati: Regione Toscana – Rilievi LIDAR',license='CC BY 4.0',sourceUrl='https://dati.toscana.it/it/dataset/lidar',horizontalAccuracyMetres=4,verticalAlignment='Approximate EGM96 separation; source regional geoid not identified. Not a survey-grade vertical transformation.',binary='montemurlo-dtm.bin')
(OUT/'montemurlo-dtm.json').write_text(json.dumps(meta,indent=2)+'\n')
# Independent 2000 topographic survey: spot heights near the school.
with zipfile.ZipFile(SRC/'school-ctr-2000.zip') as z:inner=zipfile.ZipFile(io.BytesIO(z.read('20J02_2000.ZIP')))
prefix='20J02_2000_PQ'
r=shapefile.Reader(shp=io.BytesIO(inner.read(prefix+'.SHP')),dbf=io.BytesIO(inner.read(prefix+'.DBF')),shx=io.BytesIO(inner.read(prefix+'.SHX')))
points=[]
for sr in r.iterShapeRecords():
 lon,lat=inv.transform(*sr.shape.points[0])
 if 11.0379<lon<11.0403 and 43.9288<lat<43.9306:
  points.append(dict(type='Feature',geometry=dict(type='Point',coordinates=[lon,lat]),properties=dict(surveyYear=2000,height=sr.record['VALORE'],record=sr.record['RECORD'],sheet='20J02')))
(ROOT/'docs/elevation-research/school-ctr-spots.geojson').write_text(json.dumps(dict(type='FeatureCollection',source='CARTA TECNICA DELLA REGIONE TOSCANA, CTR 1:2000, 20J02, 2000',license='CC BY 3.0',features=points),indent=2)+'\n')
print(f'{width} × {height} samples, {grid.min():.2f}–{grid.max():.2f} m; EGM96 separations {geoid}; {len(points)} independent spot heights')
