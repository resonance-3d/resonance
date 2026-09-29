// Original low-poly architectural study. No photographs are embedded or traced as textures.
import fs from 'node:fs';
import { AX,AY } from '../shared/civic.mjs';
import { toLocal } from '../shared/world.mjs';
const out='public/models/civic';
const data=JSON.parse(fs.readFileSync('public/data/montemurlo.json'));
const palette={plaster:'#ded6b7',stone:'#b4ae99',wood:'#64503a',glass:'#34484c',roof:'#91533b',metal:'#414c49',brick:'#ad7455',pale:'#ddd9ce',seat:'#69635a',green:'#4b6841',bark:'#66513e',white:'#eeece2',red:'#b74b40',flag:'#387657'};
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
function roof(x,y,w,d,z,rise){const p=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],r1=[x-w/2+Math.min(d*.42,w*.4),y,z+rise],r2=[x+w/2-Math.min(d*.42,w*.4),y,z+rise];quad('roof',p[0],p[1],r2,r1);tri('roof',p[1],p[2],r2);quad('roof',p[2],p[3],r1,r2);tri('roof',p[3],p[0],r1);
 // Shallow repeated clay-tile seams follow the roof slope, without separate draw calls.
 for(let u=x-w/2+d*.45;u<x+w/2-d*.45;u+=.35)for(const side of [-1,1]){const a=[u,y+side*d/2,z+.025],b=[u,y,z+rise+.025];quad('roof',a,[a[0]+.055,a[1],a[2]+.03],[b[0]+.055,b[1],b[2]+.03],b);}}
function windowFront(x,y,z,door=false){const h=door?3.05:2.05,w=door?1.6:1.25;box('stone',x,y-.035,z,w+.3,.13,h+.25);box('wood',x,y-.115,z,w,.075,h);box('glass',x,y-.16,z,w-.18,.03,h-.18);for(const s of [-1,1]){box('wood',x+s*w*.29,y-.205,z,w*.43,.07,h-.12);for(let k=-h/2+.15;k<h/2-.08;k+=.12)box('stone',x+s*w*.29,y-.245,z+k,w*.4,.018,.018);}box('stone',x,y-.15,z-h/2-.12,w+.45,.32,.12);box('stone',x,y-.12,z+h/2+.22,w+.4,.2,.13);}
function save(name,anchor=[0,0],rotate=true){
 const chunks=[],views=[],accessors=[],primitives=[],materials=[];let offset=0;
 const add=(arr,type)=>{const buf=Buffer.from(new Float32Array(arr).buffer),idx=views.length;views.push({buffer:0,byteOffset:offset,byteLength:buf.length});chunks.push(buf);offset+=buf.length;const count=arr.length/3,a={bufferView:idx,componentType:5126,count,type:'VEC3'};if(type==='position'){a.min=[0,1,2].map(i=>Math.min(...arr.filter((_,j)=>j%3===i)));a.max=[0,1,2].map(i=>Math.max(...arr.filter((_,j)=>j%3===i)));}accessors.push(a);return accessors.length-1;};
 for(const [name,g]of groups){
   // Coordinates authored along the real building axes; rotate to east/north, then glTF Y-up.
   if(rotate){for(let i=0;i<g.positions.length;i+=3){const a=g.positions[i]-anchor[0],b=-g.positions[i+2]-anchor[1];g.positions[i]=AX*a-AY*b;g.positions[i+2]=-(AY*a+AX*b);}for(let i=0;i<g.normals.length;i+=3){const a=g.normals[i],b=-g.normals[i+2];g.normals[i]=AX*a-AY*b;g.normals[i+2]=-(AY*a+AX*b);}}
   const rgb=palette[name].slice(1).match(/../g).map(x=>Math.pow(parseInt(x,16)/255,2.2));
   primitives.push({attributes:{POSITION:add(g.positions,'position'),NORMAL:add(g.normals,'normal')},material:materials.length});materials.push({name,doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:name==='metal'?.35:0,roughnessFactor:name==='glass'?.28:.85}});
 }
 const bin=Buffer.concat(chunks),json={asset:{version:'2.0',generator:'Resonance civic study'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives}],materials,buffers:[{byteLength:bin.length}],bufferViews:views,accessors};const txt=Buffer.from(JSON.stringify(json));const padded=Buffer.concat([txt,Buffer.alloc((4-txt.length%4)%4,32)]),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+padded.length+bin.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(`${out}/${name}.glb`,Buffer.concat([header,padded,bh,bin]));console.log(`${name}: ${bin.length/1024|0} KiB, ${primitives.length} material batches`);
}
reset();
const ring=data.buildings.find(b=>b.id==='way/282884818').rings[0].slice(0,-1).map(c=>{const p=toLocal(...c);return[p.x*AX+p.y*AY,-p.x*AY+p.y*AX];});
for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];quad('plaster',[...a,-3],[...b,-3],[...b,8.6],[...a,8.6]);}
// Long south-west facade: eleven bays, two doors/balconies, two storeys.
for(let i=0;i<11;i++){const x=3.25+i*3.5;windowFront(x,-40.22,6.6);windowFront(x,-40.22,i===3||i===7?1.55:2.35,i===3||i===7);}
box('stone',20.85,-40.3,4.3,40,.17,.18);box('stone',20.85,-40.3,.25,40,.15,.5);
for(const x of [13.75,27.75]){box('stone',x,-40.9,4.5,3,1.55,.22);box('stone',x,-41.6,5.45,3,.2,.17);for(const s of [-1,1])box('stone',x+s*1.4,-40.9,5, .2,1.5,1);for(let i=-5;i<=5;i++)lathe('stone',x+i*.23,-41.6,[[.07,4.6],[.11,4.9],[.065,5.35]],8);tri('stone',[x-1.15,-40.33,8.06],[x+1.15,-40.33,8.06],[x,-40.33,8.5]);}
// Flagpole and tricolour at the civic entrance.
box('metal',27.75,-41.8,6.5,.055,.055,3.3);for(const [i,m]of ['flag','white','red'].entries())box(m,28.01+i*.31,-41.8,7.35,.31,.035,.9);
// Side windows, authored in facade plane, rotated about building center.
const mainGroups=groups;groups=new Map();for(const y of [0,4.4,8.8])for(const z of [2.35,6.6])windowFront(y,0,z);const side=groups;groups=mainGroups;for(const [m,g]of side){for(const s of [0,1]){const p=g.positions;for(let i=0;i<p.length;i+=9){const q=[];for(let j=0;j<9;j+=3){const u=p[i+j],v=-p[i+j+2],h=p[i+j+1];q.push([s?40.76-v:.95+v,-37.9+u,h]);}tri(m,...q);}}}
box('stone',20.85,-33.45,8.53,41.1,15,.24);roof(20.85,-33.45,41.5,15.1,8.7,2.15);save('municipio',[20.85,-33.45]);
reset();box('brick',0,0,2.3,1.05,1.15,4.6);for(let z=.15;z<4.6;z+=.14)box('stone',0,-.582,z,1.06,.012,.012);box('pale',0,0,.12,1.14,1.24,.24);box('stone',0,0,3.45,1.13,1.85,.42);save('column');
reset();lathe('seat',0,0,[[0,-.15],[1.65,-.15],[1.8,.18],[1.72,.45],[1.05,.5],[1.02,.25],[0,.25]],40);lathe('pale',0,0,[[1.03,.4],[.98,.95],[.78,1.02],[.72,.91],[.75,.4]],40);lathe('bark',0,0,[[0,.35],[.72,.35],[.72,.42],[0,.42]],32);save('planter', [0,0],false);
reset();lathe('bark',0,0,[[.19,-.5],[.16,2.5],[.09,3.5]],10);for(let j=0;j<5;j++){const a=j*2.4,x=Math.cos(a)*.7,y=Math.sin(a)*.7;lathe('green',x,y,[[0,2.6],[.9,3.0],[1.15,3.7],[.8,4.5],[0,4.9]],12);}save('tree',[0,0],false);
// Three-storey house facing the square: balcony rhythm visible in the 2020 references.
reset();
const house=data.buildings.find(b=>b.id==='way/282884592').rings[0].slice(0,-1).map(c=>{const p=toLocal(...c);return[p.x*AX+p.y*AY,-p.x*AY+p.y*AX];});
for(let i=0;i<house.length;i++){const a=house[i],b=house[(i+1)%house.length];quad('plaster',[...a,-3],[...b,-3],[...b,9.8],[...a,9.8]);}
for(const z of [1.4,4.6,7.7])for(const x of [-4.7,.9,6.3]){
 const y=23.15-(x+.5)*.018;
 box('stone',x,y-.08,z,1.85,.17,2.65);box(z<2?'wood':'glass',x,y-.19,z,1.55,.07,2.4);
 if(z>2){box('wood',x,y-.24,z+.85,1.6,.05,.6);box('stone',x,y-.24,z,.08,.05,2.4);}
}
for(const z of [3.3,6.4]){
 box('stone',.9,22.45,z,15.5,1.7,.24);
 for(let x=-6.7;x<8.6;x+=.36)box('metal',x,21.64,z+.57,.035,.035,1.05);
 box('metal',.9,21.64,z+1.08,15.5,.065,.065);
 for(const x of [-6.85,8.65]){box('metal',x,22.45,z+1.08,.065,1.7,.065);box('metal',x,21.64,z+.56,.065,.065,1.1);}
}
box('stone',.9,33.7,9.8,18.3,22.2,.22);roof(.9,33.7,18.6,22.5,9.95,1.9);
// The hip roof helper expects its long direction along X; this near-square roof uses a short ridge.
save('casa-piazza',[.9,33.7]);

// Northern front of Piazza della Libertà, interpreted from the municipal 2020 photos.
// Openings and roof levels are visual estimates; the wall footprints remain OSM.
function footprint(id){return data.buildings.find(b=>b.id===id).rings[0].slice(0,-1).map(c=>{const p=toLocal(...c);return[p.x*AX+p.y*AY,-p.x*AY+p.y*AX];});}
function shell(id,mat,height){
 const ring=footprint(id);
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];quad(mat,[...a,-3],[...b,-3],[...b,height],[...a,height]);}
}
// Author details facing -Y and transform them into each actual footprint edge.
function edgeDetails(a,b,draw){
 const parent=groups;groups=new Map();const length=Math.hypot(b[0]-a[0],b[1]-a[1]);draw(length);const details=groups;groups=parent;
 const ux=(b[0]-a[0])/length,uy=(b[1]-a[1])/length;
 for(const [mat,g]of details)for(let i=0;i<g.positions.length;i+=9){const vertices=[];for(let j=0;j<9;j+=3){const x=g.positions[i+j],y=-g.positions[i+j+2],z=g.positions[i+j+1];vertices.push([a[0]+ux*x-uy*y,a[1]+uy*x+ux*y,z]);}tri(mat,...vertices);}
}
function opening(x,z,w=1.25,h=1.7,shutter='wood'){
 box('pale',x,-.055,z,w+.16,.13,h+.18);
 box('glass',x,-.13,z,w,.035,h);
 box(shutter,x,-.165,z+h*.27,w,.06,h*.46);
 box('pale',x,-.18,z,.055,.035,h);
 box('pale',x,-.18,z-h/2-.05,w+.26,.26,.09);
}
function shop(x,w=2.5){
 box('stone',x,-.04,1.55,w+.15,.13,3.1);box('glass',x,-.13,1.4,w,.04,2.65);
 for(const dx of [-w/2,0,w/2])box('metal',x+dx,-.19,1.4,.07,.07,2.7);
 box('metal',x,-.18,.3,w,.07,.35);box('pale',x,-.18,2.85,w,.1,.28);
}
function balcony(x,z,width,depth=1.05){
 box('stone',x,-depth/2,z,width,depth+.15,.18);
 box('metal',x,-depth,z+1.02,width,.07,.07);
 box('metal',x,-depth,z+.22,width,.055,.055);
 for(let u=-width/2;u<=width/2+.01;u+=.45)box('metal',x+u,-depth,z+.6,.035,.035,.86);
 for(const u of [-width/2,width/2])box('metal',x+u,-depth/2,z+1.02,.065,depth,.065);
}
// White shopfront house: stone-clad base, brown roller shutters, a small central balcony,
// and visibly offset roof heights. Rear details are deliberately sparse.
reset();shell('way/282884503','white',7.25);
const whiteFront=[[-33.02,29.48],[-16.68,28.85]];
edgeDetails(...whiteFront,length=>{
 box('seat',length/2,-.04,1.7,length,.12,3.4);
 // Low relief masonry courses: one batched material, no image texture.
 for(let z=.2;z<3.35;z+=.28)box('stone',length/2,-.108,z,length,.025,.028);
 for(const x of [2.2,8.15,13.7])shop(x,x===8.15?3.2:2.7);
 opening(2.6,5.35,2.15,1.8);opening(8.2,5.05,1.4,2.5);opening(13.4,5.35,1.8,1.8);
 balcony(8.2,3.67,3.7,.9);box('metal',12.6,-.75,3.5,6.9,1.5,.12);
});
// Taller western bay and a raised rear volume give the characteristic stepped silhouette.
box('white',-29.25,34.3,7.65,7.1,10.8,.8);
roof(-29.25,34.3,7.8,11.5,8.05,1.2);roof(-21.2,34.1,9.1,11.5,7.3,1.15);
box('white',-24.7,53.1,7.85,12.3,26,1.2);roof(-24.7,53.1,13.3,27.2,8.5,1.6);
edgeDetails([-16.68,28.85],[-16.21,40.55],length=>{for(let x=3;x<length-1;x+=4.3)opening(x,5.4);});
save('casa-bianca',[-24.6,49]);

// Corner house to its west: pale plaster, green shutters and a wraparound balcony.
reset();shell('way/282884494','pale',7.05);
for(const [a,b]of [ [[-52.38,27.55],[-44.98,27.31]], [[-44.89,29.89],[-36.18,29.6]], [[-36.18,29.6],[-35.81,40.17]] ]){
 edgeDetails(a,b,length=>{
  box('stone',length/2,-.035,.45,length,.12,.9);
  for(let x=1.6;x<length-.9;x+=3.35){shop(x,2.15);opening(x,5.1,1.2,2.4,'green');}
  balcony(length/2,3.45,length+.1,.95);
 });
}
roof(-48.5,35.5,8.6,17.3,7.1,1.45);roof(-41,36.9,10.9,16.3,7.1,1.45);
// Rooftop chimney is a silhouette cue, not a surveyed installation.
box('pale',-43,37,8.8,.65,.75,1.65);box('stone',-43,37,9.65,.86,.95,.14);
save('casa-angolo',[-44.1,36]);

// Ochre frontage farther west: two storeys, long iron balcony and shop openings.
// Attribution to this footprint is provisional; do not label it as a measured reconstruction.
palette.ochre='#e2cf91';
reset();shell('way/282884764','ochre',7.3);
edgeDetails([-81.88,28.23],[-63.12,27.2],length=>{
 box('stone',length/2,-.04,.4,length,.12,.8);
 for(let x=2;x<length-1;x+=3.65){shop(x,2.5);opening(x,5.3,1.25,2.5);}
 balcony(length/2,3.6,length-.75,1.1);
 box('pale',length/2,-.15,7.14,length+.2,.4,.22);
});
edgeDetails([-63.12,27.2],[-61.75,51.71],length=>{for(let x=3;x<length-2;x+=4.7)opening(x,5.2,1.25,2.05);});
roof(-71.8,39.6,20.6,25.6,7.35,1.8);
box('ochre',-73,42.5,9,7.8,4.2,1.35);roof(-73,42.5,8.3,4.8,9.72,.65);
save('casa-ocra',[-71.8,39.6]);

// Optional visual study, observed in Street View Oct 2022 (see STUDY.md).
// No downloaded images, photo textures, panorama stitching or reconstruction service.
// Dimensions and placement are estimates; the existing collision footprints are retained.
reset();
for(let i=0;i<7;i++){
 const y=(i-3)*1.75;
 box('brick',0,y,1.4,1.05,1.15,5.6);
 box('pale',0,y,.12,1.10,1.20,.24);
 // Subtle courses on both long faces, batched rather than separate scene objects.
 for(let z=.38;z<4.6;z+=.19)for(const side of [-1,1])box('stone',side*.529,y,z,.012,1.15,.012);
}
box('brick',0,0,4.06,1.05,11.65,1.12);
box('pale',0,0,3.46,1.10,11.7,.17);
box('stone',0,0,4.65,1.1,11.75,.075);
save('studio-colonnade');

reset();
// Rounded seat and flared planter, with finer circular tessellation at walking distance.
lathe('seat',0,0,[[0,-.15],[1.56,-.15],[1.72,0],[1.79,.16],[1.77,.30],[1.66,.43],[1.51,.48],[1.04,.49],[1.01,.35],[0,.35]],64);
lathe('pale',0,0,[[1.04,.43],[1.04,.62],[.99,.83],[.90,1.0],[.81,1.07],[.75,1.03],[.72,.89],[.76,.48]],64);
lathe('bark',0,0,[[0,.54],[.755,.54],[.755,.59],[0,.59]],32);
// Narrow radial joints in the ring; no photographic surface data.
for(let i=0;i<12;i++){
 const a=i*Math.PI/6,da=.007;
 quad('stone',[1.05*Math.cos(a),1.05*Math.sin(a),.493],[1.52*Math.cos(a),1.52*Math.sin(a),.483],[1.52*Math.cos(a+da),1.52*Math.sin(a+da),.483],[1.05*Math.cos(a+da),1.05*Math.sin(a+da),.493]);
}
save('studio-planter',[0,0],false);

palette.leafLight='#70854a';palette.leafDark='#40593a';
reset();
function branch(a,b,r){
 const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),n=d.map(v=>v/length);
 const u=Math.abs(n[2])<.9?[-n[1],n[0],0]:[1,0,0],ul=Math.hypot(...u);for(let k=0;k<3;k++)u[k]/=ul;
 const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
 const p=(t,i)=>{const angle=i*Math.PI/5,radius=r*(1-t*.45);return a.map((val,k)=>val+d[k]*t+radius*(u[k]*Math.cos(angle)+v[k]*Math.sin(angle)));};
 for(let i=0;i<10;i++)quad('bark',p(0,i),p(0,i+1),p(1,i+1),p(1,i));
}
function foliage(x,y,z,rx,ry,rz,seed){
 const slices=16,rings=9;
 const p=(j,i)=>{const t=j/rings*Math.PI,u=i/slices*2*Math.PI;const irregular=1+.11*Math.sin(u*3+seed)*Math.sin(t*4+seed);return[x+rx*Math.sin(t)*Math.cos(u)*irregular,y+ry*Math.sin(t)*Math.sin(u)*irregular,z+rz*Math.cos(t)*irregular];};
 for(let j=0;j<rings;j++)for(let i=0;i<slices;i++){
  const m=j<3?'leafLight':j>6?'leafDark':'green';quad(m,p(j,i),p(j,i+1),p(j+1,i+1),p(j+1,i));
 }
}
branch([0,0,.45],[.08,.03,2.9],.14);
for(let i=0;i<8;i++){
 const t=i*2.4,x=Math.cos(t)*(i%2?.85:.5),y=Math.sin(t)*(i%2?.85:.5),z=3.15+(i%3)*.45;
 branch([.04,0,1.6+i*.10],[x,y,z],.065);
 foliage(x,y,z,.78,.77,.92,i*1.7);
}
foliage(.12,-.08,4.2,.7,.72,.72,15);
save('studio-tree',[0,0],false);
