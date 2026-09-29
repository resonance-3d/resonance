from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen
import re,json
out=Path('docs/world-production/sources');base='https://www502.regione.toscana.it/wmsraster/com.rt.wms.RTmap/wms?';urls=set()
for i,(lon,lat) in enumerate([(11.028,43.920),(11.042,43.920),(11.028,43.931),(11.045,43.931)]):
 p=dict(map='wmscartoteca',SERVICE='WMS',VERSION='1.1.1',REQUEST='GetFeatureInfo',LAYERS='rt_cartoteca.lidar2k_DSM_autocorrelazione_2021',QUERY_LAYERS='rt_cartoteca.lidar2k_DSM_autocorrelazione_2021',STYLES='',SRS='EPSG:4326',BBOX=f'{lon-.0001},{lat-.0001},{lon+.0001},{lat+.0001}',WIDTH=101,HEIGHT=101,X=50,Y=50,INFO_FORMAT='text/html',FEATURE_COUNT=10)
 f=out/f'dsm-catalog-{i}.html'
 if not f.exists():f.write_bytes(urlopen(base+urlencode(p),timeout=30).read())
 urls.update(re.findall(r'https://[^\s<>\"\']+\.zip',f.read_text()))
(out/'dsm-catalog.json').write_text(json.dumps(sorted(urls),indent=2)+'\n')
for url in sorted(urls):
 file=out/url.split('/')[-1]
 if not file.exists():file.write_bytes(urlopen(url,timeout=90).read())
 print(file.name,file.stat().st_size,flush=True)
