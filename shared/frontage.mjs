// Front access terraces visible in the municipality reference photograph.
// Layout follows the existing garden footprints; heights/counts remain estimates.
import { AX, AY, civicGeo } from './civic.mjs';
import { toLocal } from './world.mjs';
export const FRONT_COURT=[[-3,-54.5],[40,-54.5],[40,-40.2],[-3,-40.2]];
export const FRONT_TERRACE=[[-2.8,-45.4],[40,-45.4],[40,-40.2],[-2.8,-40.2]];
export const FRONT_GARDENS=[
  [[-2.6,-45.3],[10.3,-45.2],[10.4,-51.3],[6,-50.5],[5.9,-48.8],[5,-48.2],[4,-47.9],[1.2,-47.8],[-1.6,-47],[-2.5,-46.6]],
  [[15,-51.8],[23.4,-52.1],[23.2,-42.9],[14.8,-43.1]],
  [[28,-52.5],[28.2,-45],[39.6,-45],[38.9,-47.9],[38.1,-50],[36.9,-51.7],[36,-52.4],[34.6,-52.8]],
];
export function insideRing(a,b,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const p=ring[i],q=ring[j];if((p[1]>b)!==(q[1]>b)&&a<(q[0]-p[0])*(b-p[1])/(q[1]-p[1])+p[0])inside=!inside;
  }return inside;
}
export function createFrontage(rawHeight){
  const anchor=civicGeo(13.75,-40.8),level=rawHeight(anchor.lon,anchor.lat);
  const low=level-.7;
  const coordinates=(lon,lat)=>{const p=toLocal(lon,lat);return [p.x*AX+p.y*AY,-p.x*AY+p.y*AX];};
  const plateau=(a,b)=>insideRing(a,b,FRONT_TERRACE)||FRONT_GARDENS.some(r=>insideRing(a,b,r));
  function courtWeight(a,b){return Math.max(0,1-Math.max(0,-3-a,a-40,-54.5-b,b+40.2)/2);}
  function floor(lon,lat){const [a,b]=coordinates(lon,lat),raw=rawHeight(lon,lat);return raw===undefined||!Number.isFinite(level)?raw:plateau(a,b)?level:raw+(low-raw)*courtWeight(a,b);}
  function terrain(lon,lat){
    const [a,b]=coordinates(lon,lat),raw=rawHeight(lon,lat);
    // Recess beneath the whole forecourt, extending under the building wall:
    // coarser terrain triangles must not pierce the terrace or retaining walls.
    const edge=Math.max(0,-3-a,a-40,-54.5-b,b+38.8),weight=Math.max(0,1-edge/2);
    return raw===undefined||!Number.isFinite(level)?raw:raw+(Math.min(raw,low-.4)-raw)*weight;
  }
  function blocked(x,y){const a=x*AX+y*AY,b=-x*AY+y*AX;return FRONT_GARDENS.some(r=>insideRing(a,b,r));}
  return {level,low,floor,terrain,blocked};
}
