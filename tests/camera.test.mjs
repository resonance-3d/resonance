import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitOffset,clearCameraDistance,clampOrbitPitch,locomotion} from '../shared/camera.mjs';
import {createCollisionIndex,toGeo} from '../shared/world.mjs';
import fs from 'node:fs';
test('third-person camera stays behind the player and above the aim point',()=>{
  for(const h of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const p=orbitOffset(h,-.3,6);
    assert.ok(p.x*Math.sin(h)+p.y*Math.cos(h)<0);assert.ok(p.z>1.15);
    assert.ok(Math.abs(Math.hypot(p.x,p.y,p.z-1.15)-6)<1e-10);
  }
  assert.ok(clampOrbitPitch(100)<0);assert.ok(clampOrbitPitch(-100)>-Math.PI/2);
});
test('camera boom shortens before a building and respects courtyard holes',()=>{
  const ring=points=>points.map(([x,y])=>{const p=toGeo(x,y);return [p.lon,p.lat];});
  const blocked=createCollisionIndex([{rings:[ring([[-4,-8],[4,-8],[4,-3],[-4,-3]])]}]);
  const d=clearCameraDistance(0,0,0,-.3,6,blocked);
  assert.ok(d<3.2&&d>2);assert.equal(clearCameraDistance(0,0,Math.PI,-.3,6,blocked),6);
  const courtyard=createCollisionIndex([{rings:[ring([[-10,-10],[10,-10],[10,10],[-10,10]]),ring([[-8,-8],[8,-8],[8,8],[-8,8]])]}]);
  assert.equal(clearCameraDistance(0,0,0,-.3,6,courtyard),6);
});
test('downloaded character provides the locomotion clips and consistent metre scale',()=>{
  const bytes=fs.readFileSync(new URL('../public/models/robot/RobotExpressive.glb',import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  const model=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  for(const speed of [0,2.4,5.5])assert.ok(model.animations.some(a=>a.name===locomotion(speed)));
  const m=JSON.parse(fs.readFileSync(new URL('../public/models/robot/metadata.json',import.meta.url)));
  assert.ok(Math.abs((m.sourceMaxY-m.sourceMinY)*m.scale-1.75)<1e-8);
});
