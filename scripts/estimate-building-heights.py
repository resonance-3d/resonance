"""Conservative height candidates from DSM 2021 minus regional terrain.
Keeps explicit OSM heights and authored landmarks. These are estimates, not surveyed floors.
"""
from pathlib import Path
import json,zipfile,numpy as np,math
from pyproj import Transformer
from matplotlib.path import Path as Polygon
root=Path(__file__).resolve().parents[1];src=root/'docs/world-production/sources'
data=json.loads((src/'expanded-montemurlo.json').read_text());meta=json.loads((root/'public/data/terrain/montemurlo-dtm.json').read_text());b=meta['bounds'];dtm=np.fromfile(root/'public/data/terrain/montemurlo-dtm.bin',dtype='<u2').reshape(meta['height'],meta['width'])/100
tr=Transformer.from_crs(4326,7791,always_xy=True);inv=Transformer.from_crs(7791,4326,always_xy=True)
rasters=[]
for f in sorted(src.glob('DSM_*.zip')):
 with zipfile.ZipFile(f) as z:
  with z.open(next(n for n in z.namelist() if n.endswith('.asc'))) as stream:
   h={}
   for _ in range(6):k,v=stream.readline().decode().split();h[k.lower()]=float(v)
   a=np.loadtxt(stream,dtype=np.float32)
 rasters.append((f.stem,h,a))
def ground(lons,lats):
 x=(lons-b['west'])/(b['east']-b['west'])*(meta['width']-1);y=(b['north']-lats)/(b['north']-b['south'])*(meta['height']-1)
 xi=np.clip(np.floor(x).astype(int),0,meta['width']-2);yi=np.clip(np.floor(y).astype(int),0,meta['height']-2);u=np.clip(x-xi,0,1);v=np.clip(y-yi,0,1)
 return dtm[yi,xi]*(1-u)*(1-v)+dtm[yi,xi+1]*u*(1-v)+dtm[yi+1,xi]*(1-u)*v+dtm[yi+1,xi+1]*u*v
curated={'way/282884818','way/282884592','way/282884503','way/282884494','way/282884764'};audit=[];accepted=0
for item in data['buildings']:
 points=np.array(item['rings'][0]);ring=np.column_stack(tr.transform(points[:,0],points[:,1]));samples=[]
 for name,h,a in rasters:
  lo=np.floor(ring.min(axis=0)).astype(int);hi=np.ceil(ring.max(axis=0)).astype(int)
  x0=h['xllcorner']+.5;y0=h['yllcorner']+.5
  c0=max(0,int(math.floor(lo[0]-x0)));c1=min(a.shape[1],int(math.ceil(hi[0]-x0))+1)
  r0=max(0,int(math.floor(a.shape[0]-1-(hi[1]-y0))));r1=min(a.shape[0],int(math.ceil(a.shape[0]-1-(lo[1]-y0)))+1)
  if c1<=c0 or r1<=r0:continue
  cols,rows=np.meshgrid(np.arange(c0,c1),np.arange(r0,r1));xy=np.column_stack((x0+cols.ravel(),y0+a.shape[0]-1-rows.ravel()))
  inside=Polygon(ring).contains_points(xy)
  for hole in item['rings'][1:]:
   hole=np.array(hole);inside&=~Polygon(np.column_stack(tr.transform(hole[:,0],hole[:,1]))).contains_points(xy)
  distance=np.full(len(xy),np.inf)
  for p,q in zip(ring[:-1],ring[1:]):
   v=q-p;l=np.dot(v,v)
   if l==0:continue
   t=np.clip((xy-p)@v/l,0,1);distance=np.minimum(distance,np.linalg.norm(xy-(p+t[:,None]*v),axis=1))
  z=a[rows.ravel(),cols.ravel()];ok=inside&(distance>=1)&(z!=h['nodata_value'])
  samples.extend(z[ok].tolist())
 if len(samples)<12:audit.append(dict(id=item['id'],status='insufficient_roof_samples',samples=len(samples)));continue
 z=np.array(samples);p10,p50,p85,p95=np.percentile(z,[10,50,85,95]);base=float(np.median(ground(points[:,0],points[:,1])));candidate=round(float(p85-base),1)
 status='accepted_estimate' if 3<=candidate<=35 and p95-p10<=7 else 'manual_review'
 if item['id'] in curated:status='preserved_authored_model'
 elif item.get('tags',{}).get('height') or item.get('tags',{}).get('building:levels'):status='preserved_osm_height_or_floors'
 row=dict(id=item['id'],status=status,samples=len(samples),terrainMedianMetres=round(base,2),roofP85Metres=round(float(p85),2),roofRangeP10P95Metres=round(float(p95-p10),2),candidateHeightMetres=candidate,previousHeightMetres=item['height']);audit.append(row)
 if status=='accepted_estimate':
  item.update(height=candidate,heightEstimated=True,heightSource='DSM Regione Toscana 2021 P85 meno quota mediana DTM 2008–2010; stima automatica, da verifica visiva')
  accepted+=1
(root/'docs/world-production/staging/building-height-audit.json').write_text(json.dumps(dict(method='EPSG:7791 DSM 2021; 1 m interior sampling; P85 roof minus median DTM; reject spread >7 m or height outside 3–35 m. Different epochs/alignment and vegetation may bias estimates.',entries=audit),indent=2)+'\n')
(root/'public/data/montemurlo.json').write_text(json.dumps(data,separators=(',',':')))
print(json.dumps(dict(acceptedEstimates=accepted,total=len(audit),manualReview=sum(v['status']=='manual_review' for v in audit),insufficient=sum(v['status']=='insufficient_roof_samples' for v in audit))))
