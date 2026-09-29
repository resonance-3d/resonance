import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElevation} from '../shared/elevation.mjs';
import {createCollisionIndex,toLocal,toGeo,stepPlayer} from '../shared/world.mjs';
import {civicGeo,civicPoint,civicBlocked} from '../shared/civic.mjs';
const e=createElevation(JSON.parse(readFileSync(new URL('../public/data/terrain/montemurlo-dtm.json',import.meta.url))),readFileSync(new URL('../public/data/terrain/montemurlo-dtm.bin',import.meta.url)));
const data=JSON.parse(readFileSync(new URL('../public/data/montemurlo.json',import.meta.url))),buildings=createCollisionIndex(data.buildings);
const blocked=(x,y)=>buildings(x,y)||civicBlocked(x,y)||e.stairs.blocked(x,y)||e.frontage.blocked(x,y);
const close=(a,b,t=.0001)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

const legacy=e.stairs.flights.filter(f=>!f.id.includes('-fronte-')&&!f.terminal);

test('four original stairways have level landings, real horizontal treads and human-scale risers',()=>{
  assert.equal(legacy.length,4);
  for(const f of legacy){
    assert.ok(f.riser>.08&&f.riser<=.16);assert.ok(f.tread>=.32);
    for(let i=0;i<f.count;i++){
      const a=f.point(f.flightStart+(i+.2)*f.tread),b=f.point(f.flightStart+(i+.8)*f.tread);
      close(e.surface(a.lon,a.lat),e.surface(b.lon,b.lat));
      close(e.surface(a.lon,a.lat),f.low+(i+1)*f.riser);
      assert.ok(e.terrainEllipsoid(a.lon,a.lat)<e.ellipsoid(a.lon,a.lat)-.39);
    }
    for(const t of [.1,f.length-.1]){const p=f.point(t);close(e.surface(p.lon,p.lat),t<f.flightStart?f.low:f.high);}
    for(const t of [-f.apron,f.length+f.apron]){const p=f.point(t);close(e.surface(p.lon,p.lat),e.regional(p.lon,p.lat));}
  }
});
test('robot can ascend and descend all steps through the actual server movement rules',()=>{
  for(const f of legacy)for(const direction of [-1,1])for(const run of [false,true]){
    const start=f.point(direction>0?-f.apron-.2:f.length+f.apron+.2),p={...toLocal(start.lon,start.lat),room:'world'};
    const target=direction>0?f.length+f.apron-.1:-f.apron+.1;
    for(let i=0;i<600;i++){
      const at=f.local(p.x,p.y);if(direction>0?at.t>=target:at.t<=target)break;
      stepPlayer(p,{type:'input',x:f.ux*direction,y:f.uy*direction,run},.05,blocked,e.canTraverse);
    }
    const at=f.local(p.x,p.y);assert.ok(direction>0?at.t>=target:at.t<=target,`${f.id} ${direction} ${run}: stopped at ${at.t}`);
  }
});
test('side curbs stop lateral exits while both end approaches stay open',()=>{
  for(const f of legacy){
    for(const side of [-1,1]){
      const g=f.point((f.flightStart+f.flightEnd)/2,side*(f.width/2-.8)),p={...toLocal(g.lon,g.lat),room:'world'};
      for(let i=0;i<40;i++)stepPlayer(p,{type:'input',x:-f.uy*side,y:f.ux*side,run:true},.05,blocked,e.canTraverse);
      assert.ok(Math.abs(f.local(p.x,p.y).s)<f.width/2-.3);
    }
    for(const t of [-f.apron,0,f.length,f.length+f.apron]){const p=f.point(t),l=toLocal(p.lon,p.lat);assert.equal(blocked(l.x,l.y),false,`${f.id} blocked approach`);}
  }
});

test('stairs never cover building footprints, and terrain shoulders match the walking surface',()=>{
  for(const f of legacy){
    for(let t=-f.apron;t<=f.length+f.apron;t+=.5)for(const s of [-f.width/2,0,f.width/2]){
      const g=f.point(t,s),p=toLocal(g.lon,g.lat);assert.equal(buildings(p.x,p.y),false,`${f.id} intersects a building`);
    }
    for(const t of [-f.apron-.1,f.length+f.apron+.1]){const p=f.point(t);close(e.terrainEllipsoid(p.lon,p.lat),e.ellipsoid(p.lon,p.lat));}
    const shoulder=f.point(f.length/2,f.width/2+.6);close(e.terrainEllipsoid(shoulder.lon,shoulder.lat),e.ellipsoid(shoulder.lon,shoulder.lat));
  }
});


test('front flights are broad, visible, and join the same horizontal terrace',()=>{
  const front=e.stairs.flights.filter(f=>f.id.includes('-fronte-'));
  assert.equal(front.length,2);
  for(const f of front){
    assert.ok(f.width>=4&&f.count>=4&&f.riser<=.16);
    close(f.high,e.frontage.level);
    for(let i=0;i<f.count;i++){
      const p=f.point(f.flightStart+(i+.5)*f.tread);
      close(e.surface(p.lon,p.lat),f.low+(i+1)*f.riser);
      assert.ok(e.ellipsoid(p.lon,p.lat)-e.terrainEllipsoid(p.lon,p.lat)>.39);
    }
    for(const direction of [-1,1])for(const run of [false,true]){
      const start=f.point(direction>0?-f.apron-.1:f.length+.5),p={...toLocal(start.lon,start.lat),room:'world'};
      const target=direction>0?f.length+.4:-f.apron;
      for(let i=0;i<500;i++){
        const t=f.local(p.x,p.y).t;if(direction>0?t>=target:t<=target)break;
        stepPlayer(p,{type:'input',x:f.ux*direction,y:f.uy*direction,run},.05,blocked,e.canTraverse);
      }
      const t=f.local(p.x,p.y).t;assert.ok(direction>0?t>=target:t<=target,`${f.id}: stopped at ${t}`);
    }
  }
  for(const a of [0,12.6,25.7,35]){const g=civicGeo(a,-44);close(e.surface(g.lon,g.lat),e.frontage.level);}
});

test('both door approaches have climbable steps aligned to the municipal floor',()=>{
  const doors=e.stairs.flights.filter(f=>f.terminal);assert.equal(doors.length,2);
  for(const f of doors){
    close(f.low,e.frontage.level);close(f.high,e.frontage.level+.32);assert.equal(f.count,2);
    for(const direction of [-1,1]){
      const start=f.point(direction>0?-.2:f.length-.65),p={...toLocal(start.lon,start.lat),room:'world'};
      const target=direction>0?f.length-.65:-.15;
      for(let i=0;i<100;i++){
        const t=f.local(p.x,p.y).t;if(direction>0?t>=target:t<=target)break;
        stepPlayer(p,{type:'input',x:f.ux*direction,y:f.uy*direction,run:false},.05,blocked,e.canTraverse);
      }
      const t=f.local(p.x,p.y).t;assert.ok(direction>0?t>=target:t<=target,`door ${f.id}: stopped at ${t}`);
    }
  }
  const anchor=civicGeo(13.75,-40.8);close(e.surface(anchor.lon,anchor.lat),doors[0].high);
  for(const a of [3,19,33]){const p=civicPoint(a,-47);assert.equal(e.frontage.blocked(p.x,p.y),true);}
});


test('door flights without aprons never introduce nonfinite terrain heights at their boundaries',()=>{
  for(const f of e.stairs.flights.filter(f=>f.terminal)){
    for(const t of [-1e-7,0,1e-7,f.length-1e-7,f.length,f.length+1e-7])for(const s of [0,-f.width/2,f.width/2,f.width/2+.4]){
      const g=f.point(t,s);assert.ok(Number.isFinite(e.surface(g.lon,g.lat)));assert.ok(Number.isFinite(e.terrainEllipsoid(g.lon,g.lat)));
    }
  }
});
