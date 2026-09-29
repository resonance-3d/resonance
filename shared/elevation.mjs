import { createFrontage } from './frontage.mjs';
import { createStairways } from './stairways.mjs';
// Shared CPU sampler: the same source surface drives terrain, feet and server traversal.
// Regional MSL-like heights remain separate from the approximate WGS84 alignment.
export function createElevation(meta, buffer) {
  const {width,height,bounds:b,blendMetres,geoidCorners:g}=meta;
  const bytes=buffer instanceof ArrayBuffer?new Uint8Array(buffer):buffer;
  if(bytes.byteLength!==width*height*2)throw Error('Invalid terrain raster length');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const values=new Float32Array(width*height);
  for(let i=0;i<values.length;i++)values[i]=view.getUint16(i*2,true)/100;
  const sx=111320*Math.cos((b.north+b.south)/2*Math.PI/180),sy=111132;
  const mix=(a,b,t)=>a+(b-a)*t;
  function weight(lon,lat){
    const edge=Math.min((lon-b.west)*sx,(b.east-lon)*sx,(lat-b.south)*sy,(b.north-lat)*sy);
    const t=Math.max(0,Math.min(1,edge/blendMetres));return t*t*(3-2*t);
  }
  function regional(lon,lat){
    if(lon<b.west||lon>b.east||lat<b.south||lat>b.north)return undefined;
    const x=(lon-b.west)/(b.east-b.west)*(width-1),y=(b.north-lat)/(b.north-b.south)*(height-1);
    const c=Math.min(width-2,Math.floor(x)),r=Math.min(height-2,Math.floor(y)),u=x-c,v=y-r,i=r*width+c;
    return mix(mix(values[i],values[i+1],u),mix(values[i+width],values[i+width+1],u),v);
  }
  function separation(lon,lat){
    const u=(lon-b.west)/(b.east-b.west),v=(b.north-lat)/(b.north-b.south);
    return mix(mix(g[0],g[1],u),mix(g[2],g[3],u),v);
  }
  const frontage=createFrontage(regional);
  const stairs=createStairways(frontage.floor,frontage.level);
  const surface=(lon,lat)=>stairs.floor(lon,lat);
  function terrainEllipsoid(lon,lat){const h=stairs.terrain(lon,lat,frontage.terrain(lon,lat));return h===undefined?undefined:h+separation(lon,lat);}
  function ellipsoid(lon,lat){const h=surface(lon,lat);return h===undefined?undefined:h+separation(lon,lat);}
  function blend(lon,lat,base){const w=weight(lon,lat);return w===0?base:mix(base,terrainEllipsoid(lon,lat),w);}
  function core(lon,lat){return weight(lon,lat)===1;}
  // Subdivide long segments: checking only endpoints could cross a wall and return to its level.
  function canTraverse(a,b){
    const distance=Math.hypot((b.lon-a.lon)*sx,(b.lat-a.lat)*sy),steps=Math.max(1,Math.ceil(distance/.25));
    let previous=surface(a.lon,a.lat),previousPoint=a;
    for(let i=1;i<=steps;i++){
      const t=i/steps,lon=mix(a.lon,b.lon,t),lat=mix(a.lat,b.lat,t),next=surface(lon,lat);
      const current={lon,lat},flight=stairs.sameFlight(previousPoint,current);
      // Individual risers are climbable, but do not treat arbitrary cliffs as steps.
      const allowance=flight?flight.riser+.015:0;
      if(core(lon,lat)&&previous!==undefined&&next!==undefined&&Math.abs(next-previous)>Math.max(allowance,.01+distance/steps*1.4))return false;
      previous=next;previousPoint=current;
    }
    return true;
  }
  return {meta,regional,surface,ellipsoid,terrainEllipsoid,stairs,frontage,separation,weight,blend,core,canTraverse};
}
