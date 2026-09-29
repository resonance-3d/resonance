import { toLocal, toGeo } from './world.mjs';
import { civicGeo } from './civic.mjs';

// Authored approximations: positions along the town-hall sides; two further paths
// come from the existing OSM extract. Counts/widths are gameplay estimates, not surveys.
export const STAIRWAYS=[
  {id:'municipio-ovest',name:'Scalinata laterale ovest del municipio',civic:[-6.6,-42,-23],width:3.2,compact:true},
  {id:'municipio-est',name:'Scalinata laterale est del municipio',civic:[43.2,-42,-23],width:3.4,compact:true},
  {id:'parco-369627087',name:'Scalinata verso il parco',geo:[[11.0352054,43.9280513],[11.0352279,43.9281402]],width:2.6},
  {id:'parco-369629103',name:'Scalinata del percorso pedonale',geo:[[11.0356285,43.927728],[11.0357077,43.9277204]],width:2.4},
];

export function createStairways(rawHeight,frontLevel){
  const flights=[];
  const front=frontLevel===undefined?[]:[
    {id:'municipio-fronte-ovest',name:'Gradinata frontale ovest',civic:[12.6,-53.5,-45.4],width:4.2,compact:true,high:frontLevel,apron:1},
    {id:'municipio-fronte-est',name:'Gradinata frontale est',civic:[25.7,-53.5,-45.4],width:4.4,compact:true,high:frontLevel,apron:1},
    ...[13.75,27.75].map((a,i)=>({id:`municipio-portone-${i}`,name:'Gradini del portone',civic:[a,-42.2,-40.3],width:3.2,compact:true,low:frontLevel,high:frontLevel+.32,apron:0,terminal:true,curbs:false})),
  ];
  for(const def of [...front,...STAIRWAYS]){
    let ends=def.civic?[civicGeo(def.civic[0],def.civic[1]),civicGeo(def.civic[0],def.civic[2])]:def.geo.map(([lon,lat])=>({lon,lat}));
    let heights=ends.map(g=>rawHeight(g.lon,g.lat));
    if(def.low!==undefined)heights[0]=def.low;
    if(def.high!==undefined)heights[1]=def.high;
    if(heights.some(h=>!Number.isFinite(h))||Math.abs(heights[1]-heights[0])<.25)continue;
    if(heights[1]<heights[0]){ends.reverse();heights.reverse();}
    const start=toLocal(ends[0].lon,ends[0].lat),end=toLocal(ends[1].lon,ends[1].lat);
    const length=Math.hypot(end.x-start.x,end.y-start.y),ux=(end.x-start.x)/length,uy=(end.y-start.y)/length;
    const rise=heights[1]-heights[0],count=Math.ceil((rise-1e-9)/.16),riser=rise/count;
    const run=def.compact?count*.42:Math.max(count*.32,length-2);
    const flightStart=(length-run)/2,flightEnd=flightStart+run,tread=run/count,apron=def.apron??2;
    const local=(x,y)=>({t:(x-start.x)*ux+(y-start.y)*uy,s:-(x-start.x)*uy+(y-start.y)*ux});
    const point=(t,s=0)=>toGeo(start.x+ux*t-uy*s,start.y+uy*t+ux*s);
    const level=t=>t<flightStart?heights[0]:t>=flightEnd?heights[1]:heights[0]+Math.min(count,Math.floor((t-flightStart)/tread)+1)*riser;
    flights.push({...def,curbs:def.curbs!==false,terminal:def.terminal===true,start,end,length,ux,uy,rise,count,riser,tread,flightStart,flightEnd,apron,low:heights[0],high:heights[1],local,point,level});
  }
  function locate(lon,lat,margin=0){
    const p=toLocal(lon,lat);
    for(const f of flights){const q=f.local(p.x,p.y);if(q.t>=-f.apron-margin-1e-6&&q.t<=f.length+f.apron+margin+1e-6&&Math.abs(q.s)<=f.width/2+margin+1e-6)return {flight:f,...q};}
  }
  function floor(lon,lat,raw=rawHeight(lon,lat)){
    const hit=locate(lon,lat);if(!hit)return terrain(lon,lat,raw);
    const {flight:f,t}=hit;
    if(t<0)return f.apron?raw+(f.low-raw)*(1+t/f.apron):f.low;
    if(t>f.length)return f.apron?raw+(f.high-raw)*(1-(t-f.length)/f.apron):f.high;
    return f.level(t);
  }
  function terrain(lon,lat,raw=rawHeight(lon,lat)){
    // Recess a little beyond the mesh edge: even heightmap triangles crossing a
    // tread cannot poke through the visible stair slabs at normal walking LOD.
    const hit=locate(lon,lat,.8);if(!hit)return raw;
    const {flight:f,t,s}=hit;
    const g=f.point(Math.max(-f.apron,Math.min(f.length+f.apron,t)),Math.max(-f.width/2,Math.min(f.width/2,s)));
    const h=floor(g.lon,g.lat);
    const side=Math.max(0,Math.abs(s)-f.width/2),tip=Math.max(0,-f.apron-t,t-f.length-f.apron);
    const endFade=Math.max(0,Math.min(1,(t+f.apron)/.8,(f.length+f.apron-t)/.8));
    const weight=Math.max(0,1-Math.max(side,tip)/.8)*endFade;
    return raw+(Math.min(raw,h-.4)-raw)*weight;
  }
  function blocked(x,y){
    return flights.some(f=>{if(f.curbs===false)return false;const {t,s}=f.local(x,y);return t>=0&&t<=f.length&&Math.abs(Math.abs(s)-f.width/2)<.15;});
  }
  function sameFlight(a,b){
    const first=locate(a.lon,a.lat),second=locate(b.lon,b.lat);
    return first&&second&&first.flight===second.flight?first.flight:undefined;
  }
  return {flights,locate,floor,terrain,blocked,sameFlight};
}
