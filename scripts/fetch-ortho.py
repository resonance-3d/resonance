"""Bounded local imagery pyramid; no requests to the public WMS during gameplay.
Source metadata and CC BY 4.0 statement: docs/world-production/sources/catalog-*.html.
"""
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen
import json,time
base='https://www502.regione.toscana.it/ows_ofc/com.rt.wms.RTmap/wms?'
bounds=dict(west=11.023,south=43.9171,east=11.051,north=43.9373)
out=Path('public/data/imagery');out.mkdir(parents=True,exist_ok=True)
start=time.perf_counter();size=0;count=0
for z in range(3):
 n=2**z
 for x in range(n):
  for y in range(n):
   w=bounds['west']+(bounds['east']-bounds['west'])*x/n;e=bounds['west']+(bounds['east']-bounds['west'])*(x+1)/n
   north=bounds['north']-(bounds['north']-bounds['south'])*y/n;s=bounds['north']-(bounds['north']-bounds['south'])*(y+1)/n
   p=out/str(z)/str(x)/f'{y}.jpg';p.parent.mkdir(parents=True,exist_ok=True)
   if not p.exists():
    q=dict(map='owsofc_rt',SERVICE='WMS',VERSION='1.1.1',REQUEST='GetMap',LAYERS='rt_ofc.5k24.32bit',STYLES='',SRS='EPSG:4326',BBOX=f'{w},{s},{e},{north}',WIDTH=1024,HEIGHT=1024,FORMAT='image/jpeg')
    data=urlopen(base+urlencode(q),timeout=60).read()
    if not data.startswith(b'\xff\xd8'):raise ValueError(f'Not a JPEG: {data[:150]}')
    p.write_bytes(data)
   size+=p.stat().st_size;count+=1
 print('level',z,'tiles',count,'bytes',size,flush=True)
meta=dict(bounds=bounds,maximumLevel=2,tileSize=1024,sourceLayer='rt_ofc.5k24.32bit',surveyLabel='2024/2025 (date puntuali non verificate)',license='CC BY 4.0',attribution='Ortofoto 2024/2025: Regione Toscana · CC BY 4.0',sourceUrl='https://www502.regione.toscana.it/geoscopio/servizi/wms/OFC_RT.htm',tileCount=count,totalBytes=size,fetchSeconds=round(time.perf_counter()-start,2))
(out/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n');print(meta)
