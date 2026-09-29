// Photo-derived civic variant; source/licensing: public/models/civic/photo-study/SOURCES.md.
import fs from 'node:fs';
import { AX, AY } from '../shared/civic.mjs';
import { toLocal } from '../shared/world.mjs';
const out='public/models/civic';
const groups = new Map();
function vertex([a,b,z]) { a-=20.85; b+=33.45; return [AX*a-AY*b,z,-(AY*a+AX*b)]; }
function tri(mat,a,b,c,uv=[[0,1],[1,1],[1,0]]) {
  const p=[a,b,c].map(vertex),u=p[1].map((v,i)=>v-p[0][i]),v=p[2].map((v,i)=>v-p[0][i]);
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);
  if(l<1e-8)return;
  if(!groups.has(mat))groups.set(mat,{p:[],n:[],uv:[]});const g=groups.get(mat);
  p.forEach((q,i)=>{g.p.push(...q);g.n.push(...n.map(x=>x/l));g.uv.push(...uv[i]);});
}
function quad(m,a,b,c,d,uv=[[0,1],[1,1],[1,0],[0,0]]) {tri(m,a,b,c,uv.slice(0,3));tri(m,a,c,d,[uv[0],uv[2],uv[3]]);}
function box(m,x,y,z,w,d,h){const a=[x-w/2,y-d/2,z-h/2],b=[x+w/2,y-d/2,z-h/2],c=[x+w/2,y+d/2,z-h/2],e=[x-w/2,y+d/2,z-h/2];const top=p=>[p[0],p[1],p[2]+h];quad(m,a,b,top(b),top(a));quad(m,b,c,top(c),top(b));quad(m,c,e,top(e),top(c));quad(m,e,a,top(a),top(e));quad(m,top(a),top(b),top(c),top(e));quad(m,e,c,b,a);}
const data=JSON.parse(fs.readFileSync('public/data/montemurlo.json','utf8'));
const ring=data.buildings.find(b=>b.id==='way/282884818').rings[0].slice(0,-1).map(c=>{const p=toLocal(...c);return[p.x*AX+p.y*AY,-p.x*AY+p.y*AX];});
for(let i=0;i<ring.length;i++){
 const a=ring[i],b=ring[(i+1)%ring.length];
 quad('plaster',[...a,-3],[...b,-3],[...b,0],[...a,0]);
 // Main facade gets one continuous photograph; other elevations are explicitly interpretive.
 if(Math.abs(a[1]+40.2)<1&&Math.abs(b[1]+40.2)<1){
  const uv=p=>Math.max(0,Math.min(1,(p[0]-.95)/(40.76-.95)));
  quad('photo',[...a,0],[...b,0],[...b,8.6],[...a,8.6],[[uv(a),1],[uv(b),1],[uv(b),0],[uv(a),0]]);
 }else{
  const steps=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/3.6));
  for(let j=0;j<steps;j++){
   const p=[a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps],q=[a[0]+(b[0]-a[0])*(j+1)/steps,a[1]+(b[1]-a[1])*(j+1)/steps];
   // Reuse a single ordinary window bay, not the entrances.
   quad('photo',[...p,0],[...q,0],[...q,8.6],[...p,8.6],[[.005,1],[.09,1],[.09,0],[.005,0]]);
  }
 }
}
// Low-poly hipped roof, cornice, and projecting balconies remain actual geometry.
box('stone',20.85,-33.45,8.56,41.1,15,.18);
const x=20.85,y=-33.45,w=41.5,d=15.1,z=8.7,rise=2.15;
const p=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],r1=[x-w/2+d*.42,y,z+rise],r2=[x+w/2-d*.42,y,z+rise];
quad('roof',p[0],p[1],r2,r1);tri('roof',p[1],p[2],r2);quad('roof',p[2],p[3],r1,r2);tri('roof',p[3],p[0],r1);
for(const bx of [13.75,27.75]){
 box('stone',bx,-40.9,4.45,3,1.55,.22);box('stone',bx,-41.6,5.35,3,.18,.14);
 for(const s of [-1,1]){box('stone',bx+s*1.4,-40.9,4.93,.16,1.5,.95);box('stone',bx+s*.95,-40.5,4.05,.23,.6,.6);}
 for(let j=-5;j<=5;j++)box('stone',bx+j*.23,-41.6,4.94,.085,.10,.76);
}
box('metal',27.75,-41.8,6.5,.055,.055,3.3);
for(const [i,m]of ['green','white','red'].entries())box(m,28.01+i*.31,-41.8,7.35,.31,.035,.9);
const views=[],accessors=[],chunks=[],materials=[],primitives=[];let offset=0;
function add(values,size,position=false){const buf=Buffer.from(new Float32Array(values).buffer);const view=views.length;views.push({buffer:0,byteOffset:offset,byteLength:buf.length});chunks.push(buf);offset+=buf.length;const a={bufferView:view,componentType:5126,count:values.length/size,type:size===2?'VEC2':'VEC3'};if(position){a.min=Array.from({length:size},(_,i)=>Math.min(...values.filter((_,j)=>j%size===i)));a.max=Array.from({length:size},(_,i)=>Math.max(...values.filter((_,j)=>j%size===i)));}accessors.push(a);return accessors.length-1;}
const colors={plaster:'#c9bfa5',stone:'#b3a58b',roof:'#95593f',metal:'#414c49',green:'#387657',white:'#eeece2',red:'#b74b40'};
for(const [name,g]of groups){
 const attributes={POSITION:add(g.p,3,true),NORMAL:add(g.n,3)};
 if(name==='photo')attributes.TEXCOORD_0=add(g.uv,2);
 const rgb=name==='photo'?[1,1,1]:colors[name].slice(1).match(/../g).map(x=>(parseInt(x,16)/255)**2.2);
 materials.push({name,doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:0,roughnessFactor:.92,...(name==='photo'?{baseColorTexture:{index:0}}:{})}});
 primitives.push({attributes,material:materials.length-1});
}
const bin=Buffer.concat(chunks),json={asset:{version:'2.0',generator:'Resonance photo study',copyright:'Photo-derived facade: Massimiliano Galardi, CC BY-SA 3.0; adaptation Resonance, see photo-study/SOURCES.md'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives}],materials,textures:[{source:0,sampler:0}],images:[{uri:'photo-study/facade.jpg'}],samplers:[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}],buffers:[{byteLength:bin.length}],bufferViews:views,accessors};
const raw=Buffer.from(JSON.stringify(json)),jsonChunk=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),header=Buffer.alloc(20),bh=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+jsonChunk.length+bin.length,8);header.writeUInt32LE(jsonChunk.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
fs.writeFileSync(`${out}/municipio-photo.glb`,Buffer.concat([header,jsonChunk,bh,bin]));
console.log(JSON.stringify({triangles:primitives.reduce((n,p)=>n+accessors[p.attributes.POSITION].count/3,0),materialBatches:materials.length,geometryBytes:bin.length}));
