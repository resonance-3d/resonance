import { REGION, inRegion } from './region.mjs';
export const WORLD = Object.freeze({
  id: 'montemurlo-01', name: 'Montemurlo',
  origin: { lon: 11.03694, lat: 43.92755 },
  bounds: REGION.bounds,
  speed: 2.4, runSpeed: 5.5, interactionRadius: 16, tickRate: 20,
});
const latScale = 111132;
const lonScale = 111320 * Math.cos(WORLD.origin.lat * Math.PI / 180);
// Local metric approximation valid for this ~2 km² prototype only; not a globe projection.
export function toLocal(lon, lat) { return { x: (lon - WORLD.origin.lon) * lonScale, y: (lat - WORLD.origin.lat) * latScale }; }
export function toGeo(x, y) { return { lon: WORLD.origin.lon + x / lonScale, lat: WORLD.origin.lat + y / latScale }; }
export const SIGNALS = [
  { id: 'piazza', name: 'Il primo eco', place: 'Piazza della Libertà', lon: 11.03698, lat: 43.92756, story: 'Sotto il rumore della piazza, una nota che nessun altro sembra sentire.' },
  { id: 'sentiero', name: 'La frequenza perduta', place: 'Verso Villa Giamari', lon: 11.03487, lat: 43.92870, story: 'Una seconda frequenza risponde. Le distanze, per un istante, non significano più nulla.' },
  { id: 'villa', name: 'La soglia', place: 'Parco di Villa Giamari', lon: 11.0329605, lat: 43.9300881, story: 'Tre echi, un solo accordo. Torna alla piazza: il passaggio è aperto.' },
].map(s => ({ ...s, ...toLocal(s.lon, s.lat) }));
export const PORTAL = { x: -15, y: 0 };
export function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
export function pointInRing(x,y,ring) {
  let inside = false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if (((a[1]>y)!==(b[1]>y)) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
export function createCollisionIndex(buildings) {
  const cells=new Map(); const size=32;
  for(const building of buildings) {
    const rings=building.rings.map(r=>r.map(([lon,lat])=>{const p=toLocal(lon,lat);return [p.x,p.y];}));
    const points=rings[0];
    const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
    const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
    for(let x=Math.floor(minX/size);x<=Math.floor(maxX/size);x++) for(let y=Math.floor(minY/size);y<=Math.floor(maxY/size);y++) {
      const key=x+','+y; if(!cells.has(key)) cells.set(key,[]); cells.get(key).push(rings);
    }
  }
  return (x,y) => {
    const candidates=cells.get(Math.floor(x/size)+','+Math.floor(y/size)) ?? [];
    return candidates.some(rings=>pointInRing(x,y,rings[0])&&!rings.slice(1).some(r=>pointInRing(x,y,r)));
  };
}
export function validInput(value) {
  return value && value.type==='input' && Number.isFinite(value.x) && Number.isFinite(value.y) && Math.abs(value.x)<=1 && Math.abs(value.y)<=1 && typeof value.run==='boolean';
}
export function stepPlayer(player,input,dt,blocked,canTraverse=()=>true) {
  if(!validInput(input) || dt<=0 || dt>0.1) return;
  const len=Math.hypot(input.x,input.y); if(!len) return;
  const speed=(input.run?WORLD.runSpeed:WORLD.speed)*dt/Math.max(1,len);
  const dx=input.x*speed,dy=input.y*speed;
  const allowed=(x,y)=> {
    if(player.room==='chamber') return Math.abs(x)<10.3 && y>-8.3 && y<8.3;
    const p=toGeo(x,y),b=WORLD.bounds;
    if(p.lon<b.west || p.lon>b.east || p.lat<b.south || p.lat>b.north || !inRegion(p.lon,p.lat)) return false;
    if(!canTraverse(toGeo(player.x,player.y),p))return false;
    return ![[0,0],[.4,0],[-.4,0],[0,.4],[0,-.4]].some(([a,b])=>blocked(x+a,y+b));
  };
  if(allowed(player.x+dx,player.y+dy)){player.x+=dx;player.y+=dy;}
  else {if(allowed(player.x+dx,player.y))player.x+=dx;if(allowed(player.x,player.y+dy))player.y+=dy;}
}
export function interact(player) {
  if(player.room==='chamber') {
    if(distance(player,{x:0,y:0})<4 && !player.completed) { player.completed=true; return 'L’accordo è ricomposto. Hai scoperto la prima risonanza.'; }
    if(distance(player,{x:0,y:-6})<3) { player.room='world';player.x=PORTAL.x;player.y=PORTAL.y;return 'Sei tornato a Montemurlo.'; }
    return 'Avvicinati al cristallo centrale oppure alla soglia luminosa per uscire.';
  }
  for(const signal of SIGNALS) if(!player.signals.includes(signal.id)&&distance(player,signal)<WORLD.interactionRadius) {player.signals.push(signal.id);return signal.story;}
  if(distance(player,PORTAL)<10) {
    if(player.signals.length===SIGNALS.length) {player.room='chamber';player.x=0;player.y=-6;return 'Il mondo cambia frequenza. Entra nel cuore della risonanza.';}
    return 'Il passaggio attende tre echi. Cerca i segnali sulla mappa.';
  }
  return 'Avvicinati a un segnale per sintonizzarti.';
}
