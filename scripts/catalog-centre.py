"""Read-only, bounded queries to the public regional WMS catalogue."""
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen
import re,json,html,time
out=Path('docs/world-production/sources');out.mkdir(exist_ok=True,parents=True)
# Six points cover the 2x3 native 1:2000 sheets around the requested circle.
points=[(11.028,43.920),(11.042,43.920),(11.028,43.928),(11.042,43.928),(11.028,43.935),(11.042,43.935),(11.028,43.916),(11.042,43.916)]
base='https://www502.regione.toscana.it/wmsraster/com.rt.wms.RTmap/wms?'
urls=set()
for i,(lon,lat) in enumerate(points):
 p=dict(map='wmscartoteca',SERVICE='WMS',VERSION='1.1.1',REQUEST='GetFeatureInfo',LAYERS='rt_cartoteca.lidar2k,rt_cartoteca.ofc5k_2024_2025',QUERY_LAYERS='rt_cartoteca.lidar2k,rt_cartoteca.ofc5k_2024_2025',STYLES='',SRS='EPSG:4326',BBOX=f'{lon-.0001},{lat-.0001},{lon+.0001},{lat+.0001}',WIDTH=101,HEIGHT=101,X=50,Y=50,INFO_FORMAT='text/html',FEATURE_COUNT=20)
 url=base+urlencode(p);file=out/f'catalog-{i}.html'
 if not file.exists():file.write_bytes(urlopen(url,timeout=30).read())
 text=file.read_text();links=[html.unescape(s) for s in re.findall(r'https://[^\s<>\"\']+',text) if '.zip' in s]
 urls.update(s for s in links if '_dtm_' in s)
 print(i,len(text),len(links),[(s.split('/')[-1]) for s in links if '_dtm_' in s])
(out/'dtm-catalog.json').write_text(json.dumps(sorted(urls),indent=2)+'\n')
