import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REGION,inRegion} from '../shared/region.mjs';
import {toLocal,stepPlayer} from '../shared/world.mjs';
import {createElevation} from '../shared/elevation.mjs';
import {CIVIC_MODELS} from '../shared/civic.mjs';
import {completionProblems,REQUIRED_CHECKS} from '../shared/world-quality.mjs';
const json=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const data=json('public/data/montemurlo.json');

test('the requested circle, not the extraction rectangle, limits server movement',()=>{
 const p=REGION.center,r=6371008.8,deg=180/Math.PI;
 for(const bearing of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const near={lon:p.lon+Math.sin(bearing)*999/r*deg/Math.cos(p.lat/deg),lat:p.lat+Math.cos(bearing)*999/r*deg};
  const far={lon:p.lon+Math.sin(bearing)*1001/r*deg/Math.cos(p.lat/deg),lat:p.lat+Math.cos(bearing)*1001/r*deg};
  assert.equal(inRegion(near.lon,near.lat),true);assert.equal(inRegion(far.lon,far.lat),false);
 }
 const edge=toLocal(p.lon+999.9/r*deg/Math.cos(p.lat/deg),p.lat),player={...edge,room:'world'};
 stepPlayer(player,{x:1,y:0,run:true},.05,()=>false);assert.ok(player.x<=edge.x+.01);
 assert.equal(inRegion(REGION.bounds.east,REGION.bounds.north),false);
});
test('the entire playable circle has finite regional terrain outside the blend margin',()=>{
 const e=createElevation(json('public/data/terrain/montemurlo-dtm.json'),fs.readFileSync(new URL('../public/data/terrain/montemurlo-dtm.bin',import.meta.url)));
 for(let angle=0;angle<Math.PI*2;angle+=Math.PI/36)for(const radius of [0,500,1000]){
  const lon=REGION.center.lon+Math.cos(angle)*radius/(111320*Math.cos(REGION.center.lat*Math.PI/180)),lat=REGION.center.lat+Math.sin(angle)*radius/111132;
  assert.equal(e.core(lon,lat),true);assert.ok(Number.isFinite(e.regional(lon,lat)));assert.ok(Number.isFinite(e.terrainEllipsoid(lon,lat)));
 }
});
test('automatic roof estimates retain reviewed buildings and explicit OSM heights',()=>{
 const original=json('docs/world-production/sources/expanded-montemurlo.json');
 for(const building of original.buildings){
  const current=data.buildings.find(b=>b.id===building.id);assert.ok(current);
  if(CIVIC_MODELS.some(m=>m.id===building.id)||building.tags?.height||building.tags?.['building:levels'])assert.equal(current.height,building.height,building.id);
  if(current.heightSource){assert.equal(current.heightEstimated,true);assert.ok(current.height>=3&&current.height<=35);}
 }
});
test('inventory retains every mapped stairway and links features to real sectors',()=>{
 const m=json('public/data/world/manifest.json'),i=json('public/data/world/inventory.json');
 assert.equal(new Set(m.sectors.map(s=>s.id)).size,m.sectors.length);
 for(const road of data.roads.filter(r=>r.kind==='steps')){
  if(road.coordinates.some(p=>inRegion(...p)))assert.ok(i.entities.some(e=>e.id===road.id&&e.unknowns.includes('step_count')),road.id);
 }
 for(const entry of i.entities)assert.ok(m.sectors.some(s=>s.id===entry.sector&&s[entry.category].includes(entry.id)),entry.id);
});
test('the local imagery pyramid is complete, within the terrain bounds, and licensed',()=>{
 const m=json('public/data/imagery/manifest.json');assert.deepEqual(m.bounds,REGION.bounds);assert.equal(m.license,'CC BY 4.0');
 let count=0,bytes=0;
 for(let level=0;level<=m.maximumLevel;level++)for(let x=0;x<2**level;x++)for(let y=0;y<2**level;y++){
  const b=fs.readFileSync(new URL(`../public/data/imagery/${level}/${x}/${y}.jpg`,import.meta.url));assert.equal(b.readUInt16BE(0),0xffd8);bytes+=b.length;count++;
 }
 assert.equal(count,m.tileCount);assert.equal(bytes,m.totalBytes);
});
test('completion cannot silently omit stairs or mark an unobserved sector as verified',()=>{
 const sector={status:'verified',visualAudit:'complete',observations:['Facade checked'],checks:Object.fromEntries(REQUIRED_CHECKS.map(k=>[k,{status:'verified',evidence:['reference-photo-and-walkthrough'],reviewedAt:'2026-09-24'}]))};
 assert.deepEqual(completionProblems(sector),[]);
 delete sector.checks.accesses_and_steps;assert.ok(completionProblems(sector).some(s=>s.startsWith('accesses_and_steps')));
 sector.checks.accesses_and_steps={status:'not_applicable'};assert.ok(completionProblems(sector).some(s=>s.includes('motivazione')));
 for(const s of json('public/data/world/manifest.json').sectors)if(s.status==='verified')assert.deepEqual(completionProblems(s),[],s.id);
});
