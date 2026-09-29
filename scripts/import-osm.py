"""One-time extraction of an OSM XML response. No photogrammetry or tile generation.
Usage: python3 scripts/import-osm.py /path/to/map.osm
Only geometry and selected public place tags are retained (no contributor metadata).
"""
import sys, json, math, datetime, argparse
parser=argparse.ArgumentParser()
parser.add_argument("input")
parser.add_argument("--bbox",default="11.023,43.920,11.041,43.933")
parser.add_argument("--output",default="public/data/montemurlo.json")
args=parser.parse_args()
west,south,east,north=map(float,args.bbox.split(","))
import xml.etree.ElementTree as ET
from pathlib import Path
root = ET.parse(args.input).getroot()
nodes = {n.get('id'): [float(n.get('lon')), float(n.get('lat'))] for n in root.findall('node')}
ways = {w.get('id'): w for w in root.findall('way')}
def tags(e): return {t.get('k'): t.get('v') for t in e.findall('tag')}
def coords(w): return [nodes[n.get('ref')] for n in w.findall('nd') if n.get('ref') in nodes]
def inside(c): return west <= c[0] <= east and south <= c[1] <= north
def valid(c): return len(c) >= 4 and c[0] == c[-1] and any(inside(p) for p in c)
def number(s, default):
 try: return float(str(s).replace(' m','').replace(',','.'))
 except (TypeError, ValueError): return default
def building(key, t, rings):
 measured = number(t.get('height'), 0)
 levels = number(t.get('building:levels'), 0)
 return {'id':key,'name':t.get('name',''),'kind':t.get('building','yes'), 'height': max(3,min(65,measured or levels*3 or 8)), 'heightEstimated':not bool(measured), 'rings':rings,'tags':{k:v for k,v in t.items() if k in {'height','building:levels','building:material','building:colour','roof:shape','roof:height','roof:material','roof:colour','roof:direction','roof:orientation','amenity','historic','religion','building'}}}
buildings=[]; roads=[]; areas=[]; structures=[]; members=set()
for relation in root.findall('relation'):
 t=tags(relation)
 if 'building' not in t: continue
 rings=[]; relation_members=[]
 for role in ['outer','inner']:
  segments=[]
  for m in relation.findall('member'):
   if m.get('type')=='way' and m.get('role','outer')==role and m.get('ref') in ways:
    segments.append(coords(ways[m.get('ref')])); relation_members.append(m.get('ref'))
  while segments:
   chain=segments.pop(0)
   changed=True
   while len(chain)>1 and chain[0]!=chain[-1] and changed:
    changed=False
    for i,s in enumerate(segments):
     if s and chain[-1]==s[0]: chain+=s[1:]; segments.pop(i); changed=True; break
     if s and chain[-1]==s[-1]: chain+=list(reversed(s))[1:]; segments.pop(i); changed=True; break
   if valid(chain): rings.append({'role':role,'coordinates':chain})
 if any(r['role']=='outer' for r in rings):
  outers=[r['coordinates'] for r in rings if r['role']=='outer']; inners=[r['coordinates'] for r in rings if r['role']=='inner']
  # This small extract contains single-outer building relations. Keep each outer explicit.
  for i,outer in enumerate(outers): buildings.append(building('relation/'+relation.get('id')+('/'+str(i) if i else ''),t,[outer]+(inners if len(outers)==1 else [])))
  members.update(relation_members)
for key,w in ways.items():
 t=tags(w); c=coords(w)
 if not any(inside(p) for p in c): continue
 if 'building' in t and key not in members and valid(c): buildings.append(building('way/'+key,t,[c]))
 if 'highway' in t and len(c)>1:
  roads.append({'id':'way/'+key,'name':t.get('name',''),'kind':t['highway'],'coordinates':c,'tags':{k:v for k,v in t.items() if k in {'width','surface','step_count','incline','handrail','ramp','bridge','tunnel','layer','sidewalk','foot','access','oneway','lanes'}}})
 if len(c)>1 and (t.get('barrier') in ['wall','retaining_wall','fence','hedge','kerb'] or t.get('man_made')=='retaining_wall'):
  structures.append({'id':'way/'+key,'kind':t.get('barrier',t.get('man_made')),'coordinates':c,'height':number(t.get('height'),0) or None})
 kind='water' if t.get('natural')=='water' or t.get('water') else 'green' if t.get('landuse') in ['forest','grass','meadow','orchard','farmland','vineyard'] or t.get('leisure') in ['park','garden','pitch'] or t.get('natural') in ['wood','scrub','grassland'] else 'square' if t.get('place')=='square' or (t.get('highway')=='pedestrian' and t.get('area')=='yes') else None
 if kind and valid(c): areas.append({'id':'way/'+key,'kind':kind,'name':t.get('name',''),'coordinates':c})
data={'attribution':'© OpenStreetMap contributors','license':'ODbL-1.0','source':'https://api.openstreetmap.org/api/0.6/map?bbox='+args.bbox,'retrieved':datetime.date.today().isoformat(),'bounds':[west,south,east,north],'buildings':buildings,'roads':roads,'areas':areas,'structures':structures}
Path(args.output).write_text(json.dumps(data,separators=(',',':')))
print(f'Extract: {len(buildings)} buildings, {len(roads)} roads, {len(areas)} areas.')
