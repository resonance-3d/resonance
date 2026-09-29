import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCollisionIndex, pointInRing, stepPlayer } from '../shared/world.mjs';
import { civicPoint, civicBlocked } from '../shared/civic.mjs';
import { REPUBLIC_TREES, REPUBLIC_BOWLS, REPUBLIC_BENCHES, REPUBLIC_LIGHTS, REPUBLIC_MONUMENT, REPUBLIC_PAVING } from '../shared/republic.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/montemurlo.json',import.meta.url)));
const buildings=createCollisionIndex(data.buildings);
const blocked=(x,y)=>buildings(x,y)||civicBlocked(x,y);
test('square furniture is on the square, outside buildings, with matching collisions',()=>{
 for(const [a,b] of [...REPUBLIC_TREES,...REPUBLIC_BOWLS,...REPUBLIC_BENCHES,...REPUBLIC_LIGHTS,REPUBLIC_MONUMENT]){
  const p=civicPoint(a,b);
  assert.equal(buildings(p.x,p.y),false,`${a},${b}: building`);
  assert.equal(pointInRing(a,b,REPUBLIC_PAVING),true,`${a},${b}: paving`);
  assert.equal(civicBlocked(p.x,p.y),true,`${a},${b}: collision`);
 }
});
test('a person can traverse the square and reach both municipal entrances',()=>{
 for(const endA of [13.75,27.75]){
  const nodes=[[-25,-57],[13.75,-57],[endA,-54],[endA,-41.6]];
  const p={...civicPoint(...nodes[0]),room:'world'};
  for(const target of nodes.slice(1)){
   const q=civicPoint(...target);
   for(let i=0;i<800&&Math.hypot(q.x-p.x,q.y-p.y)>.15;i++){
    const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);
    stepPlayer(p,{type:'input',x:dx/d,y:dy/d,run:false},.05,blocked);
   }
   assert.ok(Math.hypot(q.x-p.x,q.y-p.y)<.2,`entrance ${endA}: clear approach to ${target}`);
  }
 }
});
test('new square meshes fit the shared rendering budget',()=>{
 let bytes=0,triangles=0;
 const assets=['bench','bench-cross','bowl','linden','light','memorial','roses'];
 for(const asset of assets){
  const b=fs.readFileSync(new URL(`../public/models/civic/republic-${asset}.glb`,import.meta.url));
  assert.equal(b.readUInt32LE(8),b.length);
  const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
  bytes+=b.length;
  for(const primitive of gltf.meshes[0].primitives)triangles+=gltf.accessors[primitive.attributes.POSITION].count/3;
  assert.ok(gltf.meshes[0].primitives.length<=6,asset);
 }
 assert.ok(bytes<600*1024,`${bytes} mesh bytes`);
 assert.ok(triangles<8500,`${triangles} unique triangles`);
});
