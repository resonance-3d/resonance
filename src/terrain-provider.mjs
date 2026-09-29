import { Cartographic, Credit, HeightmapTerrainData, Rectangle, TileAvailability, Math as CMath } from 'cesium';
import { createElevation } from '../shared/elevation.mjs';

export async function loadLocalElevation(){
  const metaResponse=await fetch('/data/terrain/montemurlo-dtm.json');
  if(!metaResponse.ok)throw Error('Regional terrain metadata unavailable');
  const meta=await metaResponse.json();
  const response=await fetch('/data/terrain/'+meta.binary);
  if(!response.ok)throw Error('Regional terrain raster unavailable');
  return createElevation(meta,await response.arrayBuffer());
}

// Composite provider: original Cesium tiles outside the crop, regional heightmaps inside.
// No global mesh and no network calls per frame; retain native quadtree streaming/LOD.
export function regionalTerrainProvider(base,elevation){
  const scheme=base.tilingScheme,b=elevation.meta.bounds;
  const bounds=Rectangle.fromDegrees(b.west,b.south,b.east,b.north),maxLevel=19,size=65;
  const localAvailability=new TileAvailability(scheme,maxLevel);
  for(let level=0;level<=maxLevel;level++){
    const nw=scheme.positionToTileXY(Cartographic.fromDegrees(b.west,b.north),level);
    const se=scheme.positionToTileXY(Cartographic.fromDegrees(b.east,b.south),level);
    localAvailability.addAvailableTileRange(level,nw.x,nw.y,se.x,se.y);
  }
  const intersects=(x,y,level)=>!!Rectangle.intersection(scheme.tileXYToRectangle(x,y,level),bounds);
  const localTile=(x,y,level)=>level<=maxLevel&&intersects(x,y,level);
  const available=(x,y,level)=>localTile(x,y,level)||base.getTileDataAvailable(x,y,level);
  const availability=Object.create(base.availability??localAvailability);
  availability.computeMaximumLevelAtPosition=p=>Math.max(localAvailability.computeMaximumLevelAtPosition(p),base.availability?.computeMaximumLevelAtPosition(p)??0);
  availability.isTileAvailable=(level,x,y)=>localTile(x,y,level)||(base.availability?.isTileAvailable(level,x,y)??false);
  availability.computeBestAvailableLevelOverRectangle=r=>Math.max(localAvailability.computeBestAvailableLevelOverRectangle(r),base.availability?.computeBestAvailableLevelOverRectangle(r)??0);
  const cache=new Map();
  function original(x,y,level,request){
    // Deep regional tiles can refine beyond the World Terrain source's availability.
    while(level>0&&base.getTileDataAvailable(x,y,level)!==true){x=Math.floor(x/2);y=Math.floor(y/2);level--;}
    const key=`${level}/${x}/${y}`;
    if(cache.has(key))return cache.get(key);
    const promise=base.requestTileGeometry(x,y,level,request);
    if(!promise)return undefined; // honour Cesium's request scheduler backpressure
    const result=promise.then(data=>({data,rectangle:scheme.tileXYToRectangle(x,y,level)})).catch(error=>{cache.delete(key);throw error;});
    cache.set(key,result);
    if(cache.size>96)cache.delete(cache.keys().next().value);
    return result;
  }
  function children(x,y,level,data){
    let mask=0;
    for(const [dx,dy,bit]of [[0,1,1],[1,1,2],[0,0,4],[1,0,8]]){
      const cx=x*2+dx,cy=y*2+dy;
      if(localTile(cx,cy,level+1)||(base.getTileDataAvailable(cx,cy,level+1)??(data?.isChildAvailable(x,y,cx,cy)??false)))mask|=bit;
    }
    return mask;
  }
  const provider={
    tilingScheme:scheme,errorEvent:base.errorEvent,
    credit:new Credit('Fonte dei dati: <a href="/data/terrain/SOURCES.md">Regione Toscana – Rilievi LIDAR 2008–2010 e DSM da autocorrelazione 2021</a> · CC BY 4.0 · Cesium World Terrain',true),
    hasWaterMask:false,hasVertexNormals:false,availability,
    getLevelMaximumGeometricError:level=>base.getLevelMaximumGeometricError(level),
    getTileDataAvailable:available,
    loadTileDataAvailability:(x,y,level)=>localTile(x,y,level)?undefined:base.loadTileDataAvailability(x,y,level),
    requestTileGeometry(x,y,level,request){
      if(!intersects(x,y,level))return base.requestTileGeometry(x,y,level,request);
      const tileRect=scheme.tileXYToRectangle(x,y,level);
      const fullyLocal=level>=12&&[[tileRect.west,tileRect.north],[tileRect.east,tileRect.south]].every(([lon,lat])=>elevation.core(CMath.toDegrees(lon),CMath.toDegrees(lat)));
      // Interior tiles need no World Terrain geometry or additional network request at all.
      const pending=fullyLocal?Promise.resolve({data:undefined,rectangle:tileRect}):original(x,y,level,request);
      if(!pending)return undefined;
      return pending.then(({data,rectangle:sourceRect})=>{
        if(level<12){
          // Preserve distant, global geometry. Only extend child availability toward our crop.
          const extended=Object.create(data),originalChild=data.isChildAvailable.bind(data);
          extended.isChildAvailable=(px,py,cx,cy)=>localTile(cx,cy,level+1)||originalChild(px,py,cx,cy);
          return extended;
        }
        const r=scheme.tileXYToRectangle(x,y,level),buffer=new Float32Array(size*size);
        for(let row=0;row<size;row++)for(let col=0;col<size;col++){
          const lon=r.west+(r.east-r.west)*col/(size-1),lat=r.north-(r.north-r.south)*row/(size-1);
          // Inside the core, avoid the expensive triangle search on the base quantized mesh.
          const longitude=CMath.toDegrees(lon),latitude=CMath.toDegrees(lat),w=elevation.weight(longitude,latitude);
          let h;
          if(w===1)h=elevation.terrainEllipsoid(longitude,latitude);
          else{
            const originalHeight=data.interpolateHeight(sourceRect,lon,lat);
            if(!Number.isFinite(originalHeight))throw Error('Cannot sample baseline terrain');
            h=elevation.blend(longitude,latitude,originalHeight);
          }
          buffer[row*size+col]=h;
        }
        return new HeightmapTerrainData({buffer,width:size,height:size,childTileMask:children(x,y,level,data),credits:data?.credits});
      });
    },
  };
  return provider;
}
