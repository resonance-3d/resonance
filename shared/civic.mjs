// Survey-independent approximation. Footprints remain OSM; see models/civic/SOURCES.md.
import { toGeo } from './world.mjs';
import { republicBlocked } from './republic.mjs';
const norm=Math.hypot(.883,.47);
export const AX=.883/norm, AY=-.47/norm;
export const civicPoint=(a,b)=>({x:AX*a-AY*b,y:AY*a+AX*b});
export const civicGeo=(a,b)=>{const p=civicPoint(a,b);return toGeo(p.x,p.y);};
export const CIVIC_MODELS=[
  {id:'way/282884818',asset:'municipio',a:20.85,b:-33.45},
  {id:'way/282884592',asset:'casa-piazza',a:.9,b:33.7},
  {id:'way/282884503',asset:'casa-bianca',a:-24.6,b:49},
  {id:'way/282884494',asset:'casa-angolo',a:-44.1,b:36},
  {id:'way/282884764',asset:'casa-ocra',a:-71.8,b:39.6},
];
export const CIVIC_BUILDINGS=CIVIC_MODELS.map(m=>m.id);
export const PLANTERS=[[-10,-6],[-10,2],[-10,10],[8,8],[17,8],[26,8]];
export const COLUMNS=Array.from({length:7},(_,i)=>[32,0+i*1.75]);
export function civicBlocked(x,y){
  const a=x*AX+y*AY,b=x*(-AY)+y*AX;
  return republicBlocked(a,b)||PLANTERS.some(([u,v])=>Math.hypot(a-u,b-v)<1.8)||COLUMNS.some(([u,v])=>Math.abs(a-u)<.55&&Math.abs(b-v)<.6);
}
