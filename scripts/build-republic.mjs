// Original reusable square furniture. Reference notes: public/models/civic/REPUBLIC.md.
import fs from 'node:fs';
import { AX,AY } from '../shared/civic.mjs';
const out='public/models/civic';
const palette={bronze:'#465952', soil:'#51493d',flowers:'#a94c78', leafLight:'#72804f',leafDark:'#3c5135',plaster:'#ded6b7',stone:'#b4ae99',wood:'#64503a',glass:'#34484c',roof:'#91533b',metal:'#414c49',brick:'#ad7455',pale:'#ddd9ce',seat:'#69635a',green:'#4b6841',bark:'#66513e',white:'#eeece2',red:'#b74b40',flag:'#387657'};
let groups=new Map();
function reset(){groups=new Map();}
function vertex(p){return [p[0],p[2],-p[1]];}
function tri(mat,a,b,c){
 const p=[a,b,c].map(vertex),u=p[1].map((v,i)=>v-p[0][i]),v=p[2].map((v,i)=>v-p[0][i]);
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);if(l<1e-8)return;
 if(!groups.has(mat))groups.set(mat,{positions:[],normals:[]});const g=groups.get(mat);
 for(const q of p){g.positions.push(...q);g.normals.push(...n.map(x=>x/l));}
}
function quad(m,a,b,c,d){tri(m,a,b,c);tri(m,a,c,d);}
function box(m,x,y,z,w,d,h){const a=[x-w/2,y-d/2,z-h/2],b=[x+w/2,y-d/2,z-h/2],c=[x+w/2,y+d/2,z-h/2],e=[x-w/2,y+d/2,z-h/2];const top=p=>[p[0],p[1],p[2]+h];quad(m,a,b,top(b),top(a));quad(m,b,c,top(c),top(b));quad(m,c,e,top(e),top(c));quad(m,e,a,top(a),top(e));quad(m,top(a),top(b),top(c),top(e));quad(m,e,c,b,a);}
function lathe(m,x,y,profile,segments=24){for(let j=0;j<profile.length-1;j++)for(let i=0;i<segments;i++){const t=i/segments*Math.PI*2,u=(i+1)/segments*Math.PI*2;const p=(k,ang)=>[x+profile[k][0]*Math.cos(ang),y+profile[k][0]*Math.sin(ang),profile[k][1]];quad(m,p(j,t),p(j,u),p(j+1,u),p(j+1,t));}}
function save(name,anchor=[0,0],rotate=true){
 const chunks=[],views=[],accessors=[],primitives=[],materials=[];let offset=0;
 const add=(arr,type)=>{const buf=Buffer.from(new Float32Array(arr).buffer),idx=views.length;views.push({buffer:0,byteOffset:offset,byteLength:buf.length});chunks.push(buf);offset+=buf.length;const count=arr.length/(type==='uv'?2:3),a={bufferView:idx,componentType:5126,count,type:type==='uv'?'VEC2':'VEC3'};if(type==='position'){a.min=[0,1,2].map(i=>Math.min(...arr.filter((_,j)=>j%3===i)));a.max=[0,1,2].map(i=>Math.max(...arr.filter((_,j)=>j%3===i)));}accessors.push(a);return accessors.length-1;};
 for(const [name,g]of groups){
   // Coordinates authored along the real building axes; rotate to east/north, then glTF Y-up.
   if(rotate){for(let i=0;i<g.positions.length;i+=3){const a=g.positions[i]-anchor[0],b=-g.positions[i+2]-anchor[1];g.positions[i]=AX*a-AY*b;g.positions[i+2]=-(AY*a+AX*b);}for(let i=0;i<g.normals.length;i+=3){const a=g.normals[i],b=-g.normals[i+2];g.normals[i]=AX*a-AY*b;g.normals[i+2]=-(AY*a+AX*b);}}
   const rgb=(palette[name]??'#ffffff').slice(1).match(/../g).map(x=>Math.pow(parseInt(x,16)/255,2.2));
   const attributes={POSITION:add(g.positions,'position'),NORMAL:add(g.normals,'normal')};if(g.uvs)attributes.TEXCOORD_0=add(g.uvs,'uv');
   primitives.push({attributes,material:materials.length});materials.push({name,doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:name==='metal'?.35:0,roughnessFactor:name==='glass'?.28:.85}});
   if(g.uvs)Object.assign(materials.at(-1),{alphaMode:'MASK',alphaCutoff:.45,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},roughnessFactor:.95,metallicFactor:0}});
 }
 const bin=Buffer.concat(chunks),json={asset:{version:'2.0',generator:'Resonance civic study'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives}],materials,buffers:[{byteLength:bin.length}],bufferViews:views,accessors};if([...groups.values()].some(g=>g.uvs)){json.images=[{uri:'republic-leaves.png'}];json.samplers=[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}];json.textures=[{source:0,sampler:0}];}const txt=Buffer.from(JSON.stringify(json));const padded=Buffer.concat([txt,Buffer.alloc((4-txt.length%4)%4,32)]),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+padded.length+bin.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(`${out}/${name}.glb`,Buffer.concat([header,padded,bh,bin]));console.log(`${name}: ${bin.length/1024|0} KiB, ${primitives.length} material batches`);
}
function branch(a,b,r){
 const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),n=d.map(v=>v/length);
 const u=Math.abs(n[2])<.9?[-n[1],n[0],0]:[1,0,0],ul=Math.hypot(...u);for(let k=0;k<3;k++)u[k]/=ul;
 const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
 const p=(t,i)=>{const angle=i*Math.PI/5,radius=r*(1-t*.45);return a.map((val,k)=>val+d[k]*t+radius*(u[k]*Math.cos(angle)+v[k]*Math.sin(angle)));};
 for(let i=0;i<10;i++)quad('bark',p(0,i),p(0,i+1),p(1,i+1),p(1,i));
}
function foliage(x,y,z,rx,ry,rz,seed){
 const slices=12,rings=7;
 const p=(j,i)=>{const t=j/rings*Math.PI,u=i/slices*2*Math.PI;const irregular=1+.11*Math.sin(u*3+seed)*Math.sin(t*4+seed);return[x+rx*Math.sin(t)*Math.cos(u)*irregular,y+ry*Math.sin(t)*Math.sin(u)*irregular,z+rz*Math.cos(t)*irregular];};
 for(let j=0;j<rings;j++)for(let i=0;i<slices;i++){
  const m=j<3?'leafLight':j>6?'leafDark':'green';quad(m,p(j,i),p(j,i+1),p(j+1,i+1),p(j+1,i));
 }
}

// Monolithic white concrete seat. Variant avoids a runtime rotation per frame.
function bench(){
 box('white',0,0,.405,2.24,.58,.15);
 for(const x of [-.93,.93])box('white',x,0,.105,.24,.58,.46);
}
reset();bench();save('republic-bench');
reset();bench();for(const g of groups.values()){
 for(const values of [g.positions,g.normals])for(let i=0;i<values.length;i+=3){const x=values[i],b=-values[i+2];values[i]=-b;values[i+2]=-x;}
}save('republic-bench-cross');

reset();
lathe('white',0,0,[[.38,-.22],[.46,0],[.65,.13],[.77,.36],[.83,.64],[.79,.81],[.71,.85],[.66,.79],[.69,.66],[.55,.33]],40);
lathe('soil',0,0,[[0,.7],[.7,.7]],32);
foliage(0,0,1.28,.39,.4,.69,3);
for(let i=0;i<9;i++){
 const t=i*2.399,x=Math.cos(t)*.55,y=Math.sin(t)*.55;
 foliage(x,y,.83,.21,.21,.13,i);
 lathe('flowers',x,y,[[0,.95],[.09,.98],[.11,1.01],[0,1.02]],6);
}save('republic-bowl');

function leafCluster(x,y,z,r,seed){
 for(let k=0;k<3;k++){
  const angle=seed+k*Math.PI/3,ux=Math.cos(angle)*r,uy=Math.sin(angle)*r;
  const tilt=k===2?.72:.2,vx=-Math.sin(angle)*r*tilt,vy=Math.cos(angle)*r*tilt,vz=r*Math.sqrt(1-tilt*tilt);
  const p=(u,v)=>[x+ux*u+vx*v,y+uy*u+vy*v,z+vz*v];
  quad('foliage',p(-1,-1),p(1,-1),p(1,1),p(-1,1));
  const g=groups.get('foliage');g.uvs??=[];g.uvs.push(0,1,1,1,1,0,0,1,1,0,0,0);
 }
}
reset();
lathe('white',0,0,[[1.81,-.25],[2.02,-.25],[2.02,.23],[1.98,.28],[1.82,.28],[1.81,.23],[1.81,-.25]],64);
lathe('soil',0,0,[[0,.08],[1.81,.08]],48);
branch([0,0,-.3],[.12,.07,5.3],.32);
for(let i=0;i<10;i++){
 const t=i*2.4,x=Math.cos(t)*1.4,y=Math.sin(t)*1.4,z=5.4+(i%3)*.75;
 branch([.06,.02,2.9+i*.16],[x,y,z],.13);
}
for(let i=0;i<38;i++){
 const t=Math.acos(1-2*(i+.5)/38),u=i*2.39996;
 leafCluster(Math.cos(u)*Math.sin(t)*1.95,Math.sin(u)*Math.sin(t)*1.8,6.1+Math.cos(t)*1.65,1.05,u);
}
leafCluster(0,0,6.1,1.3,0);
save('republic-linden');

reset();
lathe('metal',0,0,[[.11,-.4],[.11,.3],[.065,.45],[.052,5.6]],12);
box('metal',.27,0,5.62,.68,.14,.09);box('pale',.41,0,5.57,.36,.1,.035);
save('republic-light');

// Memorial: measured appearance is unavailable; base and bronze silhouette only.
function limb(a,b,r,mat='bronze'){
 const parent=groups;groups=new Map();branch(a,b,r);const g=groups.get('bark');groups=parent;
 if(!groups.has(mat))groups.set(mat,{positions:[],normals:[]});groups.get(mat).positions.push(...g.positions);groups.get(mat).normals.push(...g.normals);
}
function oval(x,y,z,rx,ry,rz){
 const N=12,M=8,p=(j,i)=>[x+rx*Math.sin(j/M*Math.PI)*Math.cos(i/N*Math.PI*2),y+ry*Math.sin(j/M*Math.PI)*Math.sin(i/N*Math.PI*2),z+rz*Math.cos(j/M*Math.PI)];
 for(let j=0;j<M;j++)for(let i=0;i<N;i++)quad('bronze',p(j,i),p(j,i+1),p(j+1,i+1),p(j+1,i));
}
reset();
box('stone',0,0,.02,4,4,.3);box('pale',0,0,.21,3.3,3.3,.2);box('pale',0,0,.42,2.6,2.6,.23);
box('white',0,0,1.7,1.62,1.52,2.35);box('pale',0,0,2.95,1.93,1.84,.18);
box('stone',0,-.768,1.82,.88,.015,1.23);
// Dark plaque with restrained incised bands; no invented names or inscriptions.
for(let i=0;i<5;i++)box('pale',0,-.78,2.12-i*.13,.53-(i%2)*.1,.006,.025);
box('bronze',0,0,3.075,.9,.7,.11);
limb([-.23,-.02,3.12],[-.18,0,3.91],.15);limb([.22,.12,3.12],[.16,0,3.91],.14);
oval(-.23,-.13,3.16,.15,.26,.1);oval(.23,-.06,3.16,.15,.26,.1);
lathe('bronze',0,0,[[.32,3.72],[.3,4.2],[.25,4.48],[.15,4.53]],12);
oval(0,-.01,4.72,.16,.16,.22);oval(0,.01,4.86,.21,.2,.105);
limb([-.26,0,4.42],[-.42,-.12,4.04],.11);limb([-.42,-.12,4.04],[-.15,-.23,4.0],.09);
limb([.26,0,4.42],[.39,-.06,4.15],.11);limb([.39,-.06,4.15],[.39,-.2,4.49],.085);
limb([.45,-.19,3.2],[.45,-.19,4.86],.036);
box('bronze',0,.24,4.14,.44,.19,.45);
save('republic-memorial');

reset();
for(let i=0;i<6;i++)foliage(Math.cos(i*Math.PI/3)*.55,Math.sin(i*Math.PI/3)*.38,.32,.42,.4,.33,i);
for(let i=0;i<12;i++)lathe('flowers',Math.cos(i*2.4)*.67,Math.sin(i*2.4)*.45,[[0,.59],[.065,.63],[0,.67]],6);
save('republic-roses');
