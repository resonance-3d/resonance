import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {REGION,metresFromTownHall} from '../shared/region.mjs';
import {CIVIC_MODELS} from '../shared/civic.mjs';
const input=process.argv[2]??'public/data/montemurlo.json';
const data=JSON.parse(fs.readFileSync(input)),out='public/data/world';fs.mkdirSync(out,{recursive:true});
const previous=fs.existsSync(`${out}/manifest.json`)?JSON.parse(fs.readFileSync(`${out}/manifest.json`)):null;
const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sx=111320*Math.cos(REGION.center.lat*Math.PI/180),sy=111132;
const local=([lon,lat])=>[(lon-REGION.center.lon)*sx,(lat-REGION.center.lat)*sy];
const geo=([x,y])=>[REGION.center.lon+x/sx,REGION.center.lat+y/sy];
const pointIn=(p,ring)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
const segmentDistance=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],q=dx*dx+dy*dy,t=q?Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dy)/q)):0;return Math.hypot(a[0]+dx*t,a[1]+dy*t);};
function intersectsCircle(coords,polygon){const r=coords.map(local);return r.some(p=>Math.hypot(...p)<=1000)||r.slice(1).some((p,i)=>segmentDistance(r[i],p)<=1000)||(polygon&&pointIn([0,0],r));}
const sectors=[];
for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){
 const min=[x*200-100,y*200-100],max=[min[0]+200,min[1]+200];
 if(Math.hypot(Math.max(min[0],Math.min(0,max[0])),Math.max(min[1],Math.min(0,max[1])))>1000)continue;
 sectors.push({id:`E${x<0?'m':'p'}${Math.abs(x)}-N${y<0?'m':'p'}${Math.abs(y)}`,x,y,priority:Math.hypot(x,y),bounds:[...geo(min),...geo(max)],status:x===0&&y===0?'in_progress':'geographic_base',visualAudit:'not_complete',buildings:[],roads:[],structures:[],steps:[],observations:[],blockingChecks:['frontages','accesses_and_steps','retaining_walls','terrain_connections','street_level_comparison','walkthrough']});
}
const assign=(coords)=>{const r=coords.map(local),cx=r.reduce((n,p)=>n+p[0],0)/r.length,cy=r.reduce((n,p)=>n+p[1],0)/r.length;const x=Math.floor((cx+100)/200),y=Math.floor((cy+100)/200);return sectors.find(s=>s.x===x&&s.y===y)??sectors.reduce((a,b)=>Math.hypot(a.x*200-cx,a.y*200-cy)<Math.hypot(b.x*200-cx,b.y*200-cy)?a:b);};
const entities=[];
for(const [category,items,polygon] of [['buildings',data.buildings,true],['roads',data.roads,false],['structures',data.structures??[],false]])for(const item of items){
 const coords=item.rings?.[0]??item.coordinates;if(!intersectsCircle(coords,polygon))continue;
 const sector=assign(coords);sector[category].push(item.id);if(category==='roads'&&item.kind==='steps')sector.steps.push(item.id);
 const c=coords.reduce((a,p)=>[a[0]+p[0]/coords.length,a[1]+p[1]/coords.length],[0,0]);
 entities.push({id:item.id,category,name:item.name||'',kind:item.kind,sector:sector.id,center:c,distanceMetres:Math.round(metresFromTownHall(...c)),modelStatus:CIVIC_MODELS.some(m=>m.id===item.id)?'authored_interpretation':'geographic_base',visualAudit:'not_complete',height:category==='buildings'?{metres:item.height,estimated:item.heightEstimated,source:item.heightSource??(item.tags?.height?'OSM height':item.tags?.['building:levels']?'OSM floors × 3 m':'fallback 8 m')}:undefined,stepCount:item.tags?.step_count??null,source:`https://www.openstreetmap.org/${item.id}`,observations:[],unknowns:category==='buildings'?['current_frontages','entrance_levels','steps_and_ramps','balconies_and_passages']:category==='structures'?['height','material','openings']:item.kind==='steps'?['step_count','width','landings','current_condition']:['current_width','kerbs','crossings','grade_separation']});
}
const features=new Map([...data.buildings,...data.roads,...(data.structures??[])].map(item=>[item.id,item]));
for(const sector of sectors){
 sector.sourceFingerprint=fingerprint([...sector.buildings,...sector.roads,...sector.structures].sort().map(id=>features.get(id)));
 const prior=previous?.sectors.find(s=>s.id===sector.id);
 if(prior){
  sector.observations=prior.observations??[];
  if(prior.sourceFingerprint===sector.sourceFingerprint){
   sector.status=prior.status;sector.visualAudit=prior.visualAudit;
   if(prior.checks)sector.checks=prior.checks;
  }else if(prior.checks){
   sector.previousChecks=prior.checks;
   sector.changeReason='Dati del settore aggiornati: conservare osservazioni, ripetere i controlli.';
  }
 }
}
sectors.sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
const manifest={version:1,generatedAt:new Date().toISOString(),region:REGION,areaKm2:Math.PI,extractionBounds:data.bounds,counts:{buildings:entities.filter(e=>e.category==='buildings').length,roads:entities.filter(e=>e.category==='roads').length,structures:entities.filter(e=>e.category==='structures').length,mappedStairways:entities.filter(e=>e.kind==='steps').length,sectors:sectors.length,verifiedSectors:sectors.filter(s=>s.status==='verified').length},quality:'Geographic base and production inventory. Not a completed visual reconstruction.',sectors};
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(`${out}/inventory.json`,JSON.stringify({entities},null,2)+'\n');
fs.writeFileSync(`${out}/sectors.geojson`,JSON.stringify({type:'FeatureCollection',features:sectors.map(s=>({type:'Feature',properties:{id:s.id,status:s.status,buildings:s.buildings.length,steps:s.steps.length},geometry:{type:'Polygon',coordinates:[[[s.bounds[0],s.bounds[1]],[s.bounds[2],s.bounds[1]],[s.bounds[2],s.bounds[3]],[s.bounds[0],s.bounds[3]],[s.bounds[0],s.bounds[1]]]]}}))}));
const report=`# Montemurlo: raggio 1 km dal municipio\n\nCentro: ${REGION.center.lat}, ${REGION.center.lon}. Area circolare: 3,142 km².\n\n${manifest.counts.buildings} sagome, ${manifest.counts.roads} percorsi, ${manifest.counts.mappedStairways} scale mappate e ${manifest.counts.structures} muri/recinzioni. ${sectors.length} settori di lavorazione (intersecano il cerchio).\n\n**Stato: base geografica. Nessun settore intero certificato come ricostruzione visiva completa.**\nLe scale non mappate, gli ingressi e gli altri dettagli vanno cercati nelle foto: l'assenza da OSM non equivale ad assenza reale.\n\n| Settore | Edifici | Percorsi | Scale mappate | Stato |\n|---|---:|---:|---:|---|\n`+sectors.map(s=>`| ${s.id} | ${s.buildings.length} | ${s.roads.length} | ${s.steps.length} | ${s.status} |`).join('\n')+'\n';
fs.writeFileSync('docs/world-production/INVENTORY.md',report);console.log(manifest.counts);
