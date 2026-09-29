import test from 'node:test';
import { SPAWN, SPAWN_HEADING } from '../shared/spawn.mjs';
import { clearCameraDistance } from '../shared/camera.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { toLocal,createCollisionIndex,pointInRing,stepPlayer,SIGNALS,PORTAL } from '../shared/world.mjs';
import { civicPoint,civicGeo,civicBlocked,PLANTERS,COLUMNS,AX,AY,CIVIC_MODELS } from '../shared/civic.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/montemurlo.json',import.meta.url)));
const buildings=createCollisionIndex(data.buildings);
const blocked=(x,y)=>buildings(x,y)||civicBlocked(x,y);
test('civic props sit inside the mapped square and outside building footprints',()=>{
 const square=data.areas.find(a=>a.id==='way/934962881').coordinates.map(c=>{const p=toLocal(...c);return [p.x,p.y];});
 for(const [a,b]of [...PLANTERS,...COLUMNS]){
  const p=civicPoint(a,b),g=civicGeo(a,b),round=toLocal(g.lon,g.lat);
  assert.ok(Math.hypot(p.x-round.x,p.y-round.y)<1e-6);
  assert.ok(pointInRing(p.x,p.y,square));assert.equal(buildings(p.x,p.y),false);assert.equal(civicBlocked(p.x,p.y),true);
 }
 for(const p of [SPAWN,PORTAL,...SIGNALS])for(const [dx,dy] of [[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]])assert.equal(blocked(p.x+dx,p.y+dy),false);
 assert.equal(clearCameraDistance(SPAWN.x,SPAWN.y,SPAWN_HEADING,-Math.PI/10,5.8,blocked),5.8,'initial camera has a clear view');
});
test('every replacement model encloses its collision footprint at the registered anchor',()=>{
 assert.equal(new Set(CIVIC_MODELS.map(m=>m.id)).size,CIVIC_MODELS.length);
 for(const {asset,id,a,b} of CIVIC_MODELS){
  const file=fs.readFileSync(new URL(`../public/models/civic/${asset}.glb`,import.meta.url));
  assert.equal(file.readUInt32LE(8),file.length,asset);
  const size=file.readUInt32LE(12),gltf=JSON.parse(file.subarray(20,20+size));
  const primitives=gltf.meshes[0].primitives;
  assert.ok(primitives.length<=10,`${asset}: material budget`);
  const bounds=primitives.map(p=>gltf.accessors[p.attributes.POSITION]);
  const min=[0,1,2].map(i=>Math.min(...bounds.map(v=>v.min[i])));
  const max=[0,1,2].map(i=>Math.max(...bounds.map(v=>v.max[i])));
  assert.ok([...min,...max].every(Number.isFinite));
  assert.ok(min[1]<0&&max[1]>7&&max[1]<13,`${asset}: metre scale`);
  const anchor=civicPoint(a,b);
  for(const c of data.buildings.find(building=>building.id===id).rings[0]){
   const p=toLocal(...c),x=p.x-anchor.x,z=-(p.y-anchor.y);
   assert.ok(x>=min[0]-.1&&x<=max[0]+.1&&z>=min[2]-.1&&z<=max[2]+.1,`${asset}: footprint alignment`);
  }
 }
});
test('movement cannot cross a round seat, but the gaps remain passable',()=>{
 const center=civicPoint(...PLANTERS[0]),p={x:center.x-4,y:center.y,room:'world'};
 for(let i=0;i<50;i++)stepPlayer(p,{type:'input',x:1,y:0,run:true},.05,blocked);
 assert.ok(p.x<center.x-1.8);assert.equal(blocked(p.x,p.y),false);
 const gap=civicPoint(-10,-2);assert.equal(blocked(gap.x,gap.y),false);
});
test('generated municipal model uses metres and stays aligned with the source footprint',()=>{
 const file=fs.readFileSync(new URL('../public/models/civic/municipio.glb',import.meta.url));
 assert.equal(file.readUInt32LE(0),0x46546c67);assert.equal(file.readUInt32LE(8),file.length);
 const size=file.readUInt32LE(12),gltf=JSON.parse(file.subarray(20,20+size).toString());
 const accessors=gltf.meshes[0].primitives.map(p=>gltf.accessors[p.attributes.POSITION]);
 const min=accessors.reduce((a,v)=>a.map((n,i)=>Math.min(n,v.min[i])),[Infinity,Infinity,Infinity]);
 const max=accessors.reduce((a,v)=>a.map((n,i)=>Math.max(n,v.max[i])),[-Infinity,-Infinity,-Infinity]);
 assert.ok(max[1]>10&&max[1]<12,'two-storey roof height');assert.ok(min[1]<0,'foundation penetrates ground');
 const anchor=civicPoint(20.85,-33.45);
 for(const c of data.buildings.find(b=>b.id==='way/282884818').rings[0]){
  const p=toLocal(...c),x=p.x-anchor.x,z=-(p.y-anchor.y);
  assert.ok(x>=min[0]-.1&&x<=max[0]+.1&&z>=min[2]-.1&&z<=max[2]+.1);
 }
 assert.ok(gltf.meshes[0].primitives.length<=10,'batched materials limit draw calls');
 assert.ok(Math.abs(AX*AX+AY*AY-1)<1e-10);
});
