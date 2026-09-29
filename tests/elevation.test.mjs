import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Cartographic, GeographicTilingScheme, Event, HeightmapTerrainData } from 'cesium';
import { createElevation } from '../shared/elevation.mjs';
import { regionalTerrainProvider } from '../src/terrain-provider.mjs';
import { SPAWN } from '../shared/spawn.mjs';
import { toGeo, stepPlayer } from '../shared/world.mjs';
const meta=JSON.parse(readFileSync(new URL('../public/data/terrain/montemurlo-dtm.json',import.meta.url)));
const raster=readFileSync(new URL('../public/data/terrain/montemurlo-dtm.bin',import.meta.url));
const elevation=createElevation(meta,raster);
const near=(a,b,tolerance=.25)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);

test('runtime regional heights preserve the independently measured relief, not a uniform 100 m school',()=>{
  near(elevation.regional(11.03689,43.92705),75.1,.5);
  near(elevation.regional(11.03865,43.92921),89.7);
  // CTR spot heights from a different survey (2000), outside the building footprint.
  near(elevation.regional(11.038248959232014,43.92911807932255),89.41,.5);
  near(elevation.regional(11.038634441969055,43.92972477112159),92.03,.5);
  near(elevation.regional(11.038315131002811,43.92974235297641),95.25,.8);
  assert.ok(elevation.regional(11.039834519918044,43.93041091327906)>100);
});
test('regional heights and WGS84 heights use distinct vertical references',()=>{
  const lon=11.03865,lat=43.92921;
  near(elevation.ellipsoid(lon,lat)-elevation.regional(lon,lat),45.024,.01);
  assert.ok(elevation.core(lon,lat));
  const p=toGeo(SPAWN.x,SPAWN.y);assert.ok(elevation.core(p.lon,p.lat));
  assert.throws(()=>createElevation(meta,new Uint8Array(10)),/length/);
});
test('crop edges blend continuously to the original terrain, without extrapolation',()=>{
  const {west,east,south,north}=meta.bounds,lat=(north+south)/2;
  for(const lon of [west-.001,west,east,east+.001])assert.equal(elevation.blend(lon,lat,123),123);
  assert.equal(elevation.regional(west-.001,lat),undefined);
  near(elevation.blend(west+1e-8,lat,123),123,1e-6);
  const p=toGeo(SPAWN.x,SPAWN.y);near(elevation.blend(p.lon,p.lat,123),elevation.ellipsoid(p.lon,p.lat),1e-8);
});
test('composite terrain refines locally, delegates outside, and renders the same height as the feet',async()=>{
  const scheme=new GeographicTilingScheme();let calls=0;
  const base={tilingScheme:scheme,errorEvent:new Event(),getLevelMaximumGeometricError:l=>400000/2**l,getTileDataAvailable:(x,y,l)=>l===0,loadTileDataAvailability:()=>undefined,
    requestTileGeometry:()=>{calls++;return Promise.resolve(new HeightmapTerrainData({buffer:new Float32Array(4).fill(110),width:2,height:2,childTileMask:0}));}};
  const provider=regionalTerrainProvider(base,elevation);
  const p=Cartographic.fromDegrees(11.03865,43.92921),tile=scheme.positionToTileXY(p,19),rect=scheme.tileXYToRectangle(tile.x,tile.y,19);
  assert.equal(provider.availability.computeMaximumLevelAtPosition(p),19);
  const data=await provider.requestTileGeometry(tile.x,tile.y,19);
  near(data.interpolateHeight(rect,p.longitude,p.latitude),elevation.ellipsoid(11.03865,43.92921),.08);
  assert.equal(data.isChildAvailable(tile.x,tile.y,tile.x*2,tile.y*2),false);
  const root=scheme.positionToTileXY(p,0);const rootData=await provider.requestTileGeometry(root.x,root.y,0);
  const child=scheme.positionToTileXY(p,1);assert.equal(rootData.isChildAvailable(root.x,root.y,child.x,child.y),true);
  const away=await provider.requestTileGeometry(0,0,4),awayRect=scheme.tileXYToRectangle(0,0,4);assert.equal(away.interpolateHeight(awayRect,(awayRect.west+awayRect.east)/2,(awayRect.north+awayRect.south)/2),110);
  assert.ok(calls<=3);
});
test('neighbouring local tiles agree exactly at their shared boundary',async()=>{
  const scheme=new GeographicTilingScheme();
  const base={tilingScheme:scheme,errorEvent:new Event(),getLevelMaximumGeometricError:()=>1,getTileDataAvailable:()=>true,loadTileDataAvailability:()=>undefined,requestTileGeometry:()=>Promise.resolve(new HeightmapTerrainData({buffer:new Float32Array(4).fill(110),width:2,height:2}))};
  const provider=regionalTerrainProvider(base,elevation),p=Cartographic.fromDegrees(11.03865,43.92921),tile=scheme.positionToTileXY(p,18);
  const r=scheme.tileXYToRectangle(tile.x,tile.y,18),s=scheme.tileXYToRectangle(tile.x+1,tile.y,18);
  const [a,b]=await Promise.all([provider.requestTileGeometry(tile.x,tile.y,18),provider.requestTileGeometry(tile.x+1,tile.y,18)]);
  for(let i=0;i<=64;i++){const lat=r.north-(r.north-r.south)*i/64;near(a.interpolateHeight(r,r.east,lat),b.interpolateHeight(s,s.west,lat),1e-6);}
});
test('server traversal rejects a sudden ledge and still permits ordinary slopes',()=>{
  const m={width:5,height:2,bounds:{west:11,east:11.00005,south:43.9,north:43.901},blendMetres:0.01,geoidCorners:[45,45,45,45]};
  const terrain=createElevation(m,new Uint16Array([7500,7500,7900,7900,7900,7500,7500,7900,7900,7900]).buffer);
  assert.equal(terrain.canTraverse({lon:11.000008,lat:43.9005},{lon:11.00004,lat:43.9005}),false);
  const p={...SPAWN,room:'world'},before={...p};stepPlayer(p,{type:'input',x:1,y:0,run:false},.05,()=>false,()=>false);assert.deepEqual(p,before);
  const spawn=toGeo(SPAWN.x,SPAWN.y);assert.equal(elevation.canTraverse(spawn,toGeo(SPAWN.x+.1,SPAWN.y)),true);
});

test('corrected relief leaves a walkable route from municipal spawn to the school entrance street',async()=>{
  const { createCollisionIndex,toLocal }=await import('../shared/world.mjs');
  const { civicBlocked }=await import('../shared/civic.mjs');
  const data=JSON.parse(readFileSync(new URL('../public/data/montemurlo.json',import.meta.url))),blocked=createCollisionIndex(data.buildings);
  const target=toLocal(11.03825,43.92912),step=1.5;
  const start=[Math.round(SPAWN.x/step)*step,Math.round(SPAWN.y/step)*step],queue=[start],seen=new Set([start.join(',')]);let reached=false;
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];if(Math.hypot(x-target.x,y-target.y)<6){reached=true;break;}
    for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){
      const nx=x+dx,ny=y+dy,key=nx+','+ny;if(nx< -100||nx>230||ny< -100||ny>300||seen.has(key))continue;
      const clear=[0,.5,1].every(t=>[[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]].every(([a,b])=>!blocked(x+dx*t+a,y+dy*t+b)&&!civicBlocked(x+dx*t+a,y+dy*t+b)));
      if(clear&&elevation.canTraverse(toGeo(x,y),toGeo(nx,ny))){seen.add(key);queue.push([nx,ny]);}
    }
  }
  assert.equal(reached,true,'Terrain must not fence off the school from the square');
});

test('edge tiles upsample an available ancestor and honour request backpressure',async()=>{
  const scheme=new GeographicTilingScheme(),p=Cartographic.fromDegrees(meta.bounds.west+.0001,43.92921),tile=scheme.positionToTileXY(p,18),r=scheme.tileXYToRectangle(tile.x,tile.y,18);
  let throttled=true;
  const base={tilingScheme:scheme,errorEvent:new Event(),getLevelMaximumGeometricError:()=>1,getTileDataAvailable:(x,y,l)=>l===0,loadTileDataAvailability:()=>undefined,
    requestTileGeometry:()=>throttled?undefined:Promise.resolve(new HeightmapTerrainData({buffer:new Float32Array(4).fill(110),width:2,height:2,childTileMask:0}))};
  const provider=regionalTerrainProvider(base,elevation);
  assert.equal(provider.requestTileGeometry(tile.x,tile.y,18),undefined);
  throttled=false;
  const data=await provider.requestTileGeometry(tile.x,tile.y,18);
  near(data.interpolateHeight(r,p.longitude,p.latitude),elevation.blend(meta.bounds.west+.0001,43.92921,110),.15);
});
