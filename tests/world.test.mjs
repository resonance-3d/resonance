import test from 'node:test';
import { SPAWN } from '../shared/spawn.mjs';
import { civicBlocked } from '../shared/civic.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORLD,SIGNALS,PORTAL,toLocal,toGeo,distance,createCollisionIndex,stepPlayer,validInput,interact } from '../shared/world.mjs';
const data=JSON.parse(readFileSync(new URL('../public/data/montemurlo.json',import.meta.url)));
const buildingsBlocked=createCollisionIndex(data.buildings);
const blocked=(x,y)=>buildingsBlocked(x,y)||civicBlocked(x,y);
const player=()=>({id:'test',x:0,y:0,room:'world',signals:[],completed:false});

test('local coordinates round-trip throughout Montemurlo',()=>{
  for(const lon of [WORLD.bounds.west,WORLD.origin.lon,WORLD.bounds.east])for(const lat of [WORLD.bounds.south,WORLD.origin.lat,WORLD.bounds.north]){const p=toLocal(lon,lat),g=toGeo(p.x,p.y);assert.ok(Math.abs(g.lon-lon)<1e-10);assert.ok(Math.abs(g.lat-lat)<1e-10);}
});
test('diagonal speed is capped and invalid input cannot teleport',()=>{
  const p=player();for(let i=0;i<20;i++)stepPlayer(p,{type:'input',x:1,y:1,run:false},.05,()=>false);
  assert.ok(Math.abs(distance(p,{x:0,y:0})-WORLD.speed)<1e-9);
  const before={...p};for(const x of [Infinity,NaN,1000])stepPlayer(p,{type:'input',x,y:0,run:false},.05,()=>false);
  assert.deepEqual(p,before);assert.equal(validInput({type:'position',x:0,y:0,run:false}),false);
});
test('movement slides along obstacles but never enters them',()=>{
  const p=player();const wall=(x,y)=>x>=2;
  for(let i=0;i<40;i++)stepPlayer(p,{type:'input',x:1,y:1,run:true},.05,wall);
  assert.ok(p.x<1.6);assert.ok(p.y>5);
});
test('polygon courtyard remains walkable',()=>{
  const ring=arr=>arr.map(([x,y])=>{const g=toGeo(x,y);return [g.lon,g.lat];});
  const collision=createCollisionIndex([{rings:[ring([[-10,-10],[10,-10],[10,10],[-10,10],[-10,-10]]),ring([[-3,-3],[3,-3],[3,3],[-3,3],[-3,-3]])]}]);
  assert.equal(collision(0,0),false);assert.equal(collision(8,0),true);assert.equal(collision(20,0),false);
});
test('spawn, portal and signals are outside recorded building footprints',()=>{
  for(const p of [SPAWN,PORTAL,...SIGNALS])assert.equal(blocked(p.x,p.y),false,JSON.stringify(p));
});
test('all signals can be reached from the square without crossing buildings',()=>{
  const step=3,start=[Math.round(SPAWN.x/step)*step,Math.round(SPAWN.y/step)*step],queue=[start],seen=new Set([start.join(',')]),reached=new Set();
  const clear=(x,y)=>![[0,0],[.5,0],[-.5,0],[0,.5],[0,-.5]].some(([a,b])=>blocked(x+a,y+b));
  for(let i=0;i<queue.length&&reached.size<SIGNALS.length;i++){
    const [x,y]=queue[i];for(const s of SIGNALS)if(distance({x,y},s)<WORLD.interactionRadius-2)reached.add(s.id);
    for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
      const nx=x+dx,ny=y+dy,key=nx+','+ny;
      if(nx < -500||nx>100||ny < -100||ny>450||seen.has(key))continue;
      seen.add(key);
      if([1/3,2/3,1].every(t=>clear(x+dx*t,y+dy*t)))queue.push([nx,ny]);
    }
  }
  assert.deepEqual([...reached].sort(),SIGNALS.map(s=>s.id).sort());
});
test('quest requires proximity, grants each signal once and gates the interior',()=>{
  const p=player();p.x=PORTAL.x;p.y=PORTAL.y;interact(p);assert.equal(p.room,'world');
  p.x=10000;p.y=10000;interact(p);assert.equal(p.signals.length,0);
  for(const s of SIGNALS){p.x=s.x;p.y=s.y;interact(p);interact(p);}
  assert.equal(p.signals.length,3);p.x=PORTAL.x;p.y=PORTAL.y;interact(p);assert.equal(p.room,'chamber');
  p.x=0;p.y=0;interact(p);assert.equal(p.completed,true);
  p.y=-6;interact(p);assert.equal(p.room,'world');assert.equal(p.x,PORTAL.x);
});
test('region and interior boundaries contain the player',()=>{
  const p=player();Object.assign(p,toLocal(WORLD.bounds.east,WORLD.origin.lat));stepPlayer(p,{type:'input',x:1,y:0,run:true},.05,()=>false);assert.ok(toGeo(p.x,p.y).lon<=WORLD.bounds.east);
  p.room='chamber';p.x=10;p.y=0;stepPlayer(p,{type:'input',x:1,y:0,run:true},.05,()=>false);assert.ok(p.x<10.3);
  for(let i=0;i<20;i++)stepPlayer(p,{type:'input',x:1,y:0,run:true},.05,()=>false);assert.ok(p.x<10.3);
});
