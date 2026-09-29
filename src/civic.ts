import { Axis, Cartesian3, Cartographic, Color, CustomDataSource, Model, Transforms, sampleTerrainMostDetailed, DistanceDisplayCondition, ClassificationType, ShadowMode, PolygonHierarchy } from 'cesium';
import type { Viewer, TerrainProvider } from 'cesium';
import { CIVIC_MODELS, PLANTERS, COLUMNS, civicGeo } from '../shared/civic.mjs';
import type { Dataset } from './types';
import type { createElevation } from '../shared/elevation.mjs';
import { surfaceMaterial, contactShade } from './environment';
import { FRONT_COURT, FRONT_TERRACE, FRONT_GARDENS } from '../shared/frontage.mjs';
import { REPUBLIC_PAVING, REPUBLIC_TREES, REPUBLIC_BOWLS, REPUBLIC_BENCHES, REPUBLIC_LIGHTS, REPUBLIC_MONUMENT, REPUBLIC_GARDENS } from '../shared/republic.mjs';

type Placement={a:number;b:number;model:Model;height:number};
export class CivicStudy {
  private models:Placement[]=[];
  private surfaces=new CustomDataSource('Studio centro di Montemurlo');
  private stairIds:string[]=[];
  private disposed=false;
  private visible=true;
  private provider?:TerrainProvider;
  private localHeight?:(lon:number,lat:number)=>number|undefined;
  private terrainVersion=0;
  readonly replaced=new Set<string>();
  constructor(private viewer:Viewer,data:Dataset,private onChange:()=>void,private onFailure:()=>void){
    viewer.dataSources.add(this.surfaces);
    const square=data.areas.find(a=>a.id==='way/934962881');
    if(square)this.surfaces.entities.add({name:'Piazza della Libertà',polygon:{hierarchy:Cartesian3.fromDegreesArray(square.coordinates.flat()),material:surfaceMaterial('civic',35,24),classificationType:ClassificationType.TERRAIN,zIndex:4}});
    this.addRepublic(data);
    for(const {asset,a,b,id} of CIVIC_MODELS)void this.load(asset==='municipio'?'municipio-photo':asset,a,b,id);
    for(const [a,b]of COLUMNS)void this.load('column',a,b);
    for(const [a,b]of PLANTERS){void this.load('planter',a,b);void this.load('tree',a,b);}
  }
  private addRepublic(data:Dataset){
    const coords=(points:number[][])=>Cartesian3.fromDegreesArray(points.flatMap(([a,b])=>{const p=civicGeo(a,b);return[p.lon,p.lat];}));
    const shade=(a:number,b:number,r:number,minor=r,angle=0)=>{const g=civicGeo(a,b);this.surfaces.entities.add({position:Cartesian3.fromDegrees(g.lon,g.lat),ellipse:{semiMajorAxis:r,semiMinorAxis:minor,rotation:angle-.489,material:contactShade,classificationType:ClassificationType.TERRAIN,zIndex:6}});};
    this.surfaces.entities.add({name:'Piazza della Repubblica · sistemazione 2023',polygon:{hierarchy:coords(REPUBLIC_PAVING),material:surfaceMaterial('republic',70,115),classificationType:ClassificationType.TERRAIN,zIndex:5,stRotation:-.489}});
    this.surfaces.entities.add({name:'Camminamento del municipio',polygon:{hierarchy:coords([[-2.8,-40.35],[40,-40.35],[40,-45.4],[-2.8,-45.4]]),material:surfaceMaterial('terracotta',56,8),classificationType:ClassificationType.TERRAIN,zIndex:6,stRotation:-.489}});
    for(const id of REPUBLIC_GARDENS){
      const bed=data.areas.find(a=>a.id===id);if(!bed)continue;
      this.surfaces.entities.add({name:'Aiuola del municipio',polygon:{hierarchy:Cartesian3.fromDegreesArray(bed.coordinates.flat()),material:surfaceMaterial('grass'),classificationType:ClassificationType.TERRAIN,zIndex:7}});
      this.surfaces.entities.add({corridor:{positions:Cartesian3.fromDegreesArray(bed.coordinates.flat()),width:.27,material:Color.fromCssColorString('#ceccc1'),classificationType:ClassificationType.TERRAIN,zIndex:8}});
    }
    for(const [a,b]of REPUBLIC_TREES){void this.load('republic-linden',a,b);shade(a+.6,b+.2,3.4,2.5);}
    for(const [a,b]of REPUBLIC_BOWLS){void this.load('republic-bowl',a,b);shade(a,b,1.05);}
    for(const [a,b,t]of REPUBLIC_BENCHES){void this.load(t?'republic-bench-cross':'republic-bench',a,b);shade(a,b,1.4,.57,t);}
    for(const [a,b]of REPUBLIC_LIGHTS)void this.load('republic-light',a,b);
    void this.load('republic-memorial',...REPUBLIC_MONUMENT as [number,number]);
    // Small beds framing the memorial, keeping its approach and the main diagonal open.
    for(const [a,b]of [[-5.3,-77],[1.3,-77],[-5.3,-80],[1.3,-80]])void this.load('republic-roses',a,b);
    for(const [a,b]of [[3,-46.7],[19,-47.4],[33.5,-49]])void this.load('republic-roses',a,b);
  }
  private async load(asset:string,a:number,b:number,replaces?:string){
    try{
      const g=civicGeo(a,b);
      const model=await Model.fromGltfAsync({url:`/models/civic/${asset}.glb`,modelMatrix:Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(g.lon,g.lat)),upAxis:Axis.Y,forwardAxis:Axis.X,minimumPixelSize:0,distanceDisplayCondition:new DistanceDisplayCondition(0,replaces?2500:650),shadows:ShadowMode.DISABLED});
      if(this.disposed){model.destroy();return;}
      const item={a,b,model,height:0};this.models.push(item);model.show=this.visible;this.viewer.scene.primitives.add(model);
      if(replaces){const ready=()=>{if(!this.disposed){this.replaced.add(replaces);this.onChange();}};if(model.ready)ready();else model.readyEvent.addEventListener(ready);}
      model.errorEvent.addEventListener(()=>{if(!this.disposed){if(replaces)this.replaced.delete(replaces);this.onChange();this.onFailure();}});
      if(this.provider)void this.place([item],this.provider,this.terrainVersion);
    }catch{if(!this.disposed)this.onFailure();}
  }
  private async place(items:Placement[],provider:TerrainProvider,version:number){
    try{
      // The municipal floor is anchored outside the entrance, not on interpolated DTM under its roof.
      const samples=items.map(p=>{const g=p.a===20.85&&p.b===-33.45?civicGeo(13.75,-40.8):civicGeo(p.a,p.b);const point=Cartographic.fromDegrees(g.lon,g.lat);point.height=this.localHeight?.(g.lon,g.lat)??NaN;return point;});
      const missing=samples.filter(p=>!Number.isFinite(p.height));
      if(missing.length)await sampleTerrainMostDetailed(provider,missing);
      if(this.disposed||version!==this.terrainVersion)return;
      items.forEach((item,i)=>{if(Number.isFinite(samples[i].height)){item.height=samples[i].height;const g=civicGeo(item.a,item.b);item.model.modelMatrix=Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(g.lon,g.lat,item.height));}});
    }catch{if(!this.disposed)this.onFailure();}
  }
  async setTerrain(provider:TerrainProvider,fallbackHeight:number,localHeight?:(lon:number,lat:number)=>number|undefined){
    this.localHeight=localHeight;
    this.provider=provider;const version=++this.terrainVersion;
    // Place at a safe approximate elevation immediately, then sample only once per prop.
    for(const item of this.models){const g=civicGeo(item.a,item.b);item.height=fallbackHeight;item.model.modelMatrix=Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(g.lon,g.lat,fallbackHeight));}
    await this.place([...this.models],provider,version);
  }
  addStairways(elevation:ReturnType<typeof createElevation>){
    for(const id of this.stairIds)this.surfaces.entities.removeById(id);this.stairIds=[];
    const stone=Color.fromCssColorString('#b7b0a0'),edge=Color.fromCssColorString('#ded7c7'),curb=Color.fromCssColorString('#858276');
    this.surfaces.entities.suspendEvents();
    // One horizontal terrace joins both front flights and the entrance steps.
    // Explicit mesh heights replace the old terrain-draped access ramps.
    const terraceLevel=elevation.frontage.level;
    let terraceSerial=0;
    const terraceSlab=(ring:number[][],height:number,material:ReturnType<typeof surfaceMaterial>|Color,base?:number)=>{
      const id=`frontage-${terraceSerial++}`;
      const positions=ring.map(([a,b])=>{const p=civicGeo(a,b);return Cartesian3.fromDegrees(p.lon,p.lat,height+elevation.separation(p.lon,p.lat));});
      const g=civicGeo(...ring[0] as [number,number]);
      this.surfaces.entities.add({id,name:'Basamento e accessi frontali del municipio',polygon:{hierarchy:new PolygonHierarchy(positions),perPositionHeight:true,
        ...(base===undefined?{}:{extrudedHeight:base+elevation.separation(g.lon,g.lat)}),material,outline:false,distanceDisplayCondition:new DistanceDisplayCondition(0,750)}});
      this.stairIds.push(id);
    };
    terraceSlab(FRONT_COURT,elevation.frontage.low,surfaceMaterial('republic',43,14),elevation.frontage.low-.6);
    // A narrow apron joins the authored forecourt to the regional terrain.
    const apronMaterial=surfaceMaterial('republic',2,2);
    for(const [axis,fixed,start,end,direction] of [[0,-3,-54.5,-40.2,-1],[0,40,-54.5,-40.2,1],[1,-54.5,-5,42,-1]]){
      for(let v=start;v<end;v+=2)for(let d=0;d<2;d+=2){
        const xy=(u:number,w:number)=>axis===0?[fixed+direction*w,u]:[u,fixed+direction*w];
        const ring=[xy(v,d),xy(Math.min(v+2,end),d),xy(Math.min(v+2,end),d+2),xy(v,d+2)];
        const id=`frontage-${terraceSerial++}`;
        const positions=ring.map(([a,b])=>{const p=civicGeo(a,b);return Cartesian3.fromDegrees(p.lon,p.lat,elevation.frontage.floor(p.lon,p.lat)!+elevation.separation(p.lon,p.lat));});
        this.surfaces.entities.add({id,polygon:{hierarchy:new PolygonHierarchy(positions),perPositionHeight:true,material:apronMaterial,distanceDisplayCondition:new DistanceDisplayCondition(0,750)}});this.stairIds.push(id);
      }
    }
    terraceSlab(FRONT_TERRACE,terraceLevel,surfaceMaterial('terracotta',43,5.2),terraceLevel-1.4);
    for(const ring of FRONT_GARDENS){
      terraceSlab(ring,terraceLevel+.02,surfaceMaterial('grass'),terraceLevel-1.4);
      for(let i=0;i<ring.length;i++){
        const p=ring[i],q=ring[(i+1)%ring.length],length=Math.hypot(q[0]-p[0],q[1]-p[1]);
        const da=-(q[1]-p[1])/length*.10,db=(q[0]-p[0])/length*.10;
        terraceSlab([[p[0]+da,p[1]+db],[q[0]+da,q[1]+db],[q[0]-da,q[1]-db],[p[0]-da,p[1]-db]],terraceLevel+.09,edge,terraceLevel-1.4);
      }
    }
    for(const flight of elevation.stairs.flights){
      let serial=0;
      const half=flight.width/2;
      const addSlab=(t0:number,t1:number,s0:number,s1:number,level:(t:number,s:number)=>number,material:Color,base?:number)=>{
        // Millimetric separation prevents coplanar landing/forecourt flicker.
        const corners=[[t0,s0],[t1,s0],[t1,s1],[t0,s1]];
        const positions=corners.map(([t,s])=>{const p=flight.point(t,s);return Cartesian3.fromDegrees(p.lon,p.lat,level(t,s)+.008+elevation.separation(p.lon,p.lat));});
        const center=flight.point((t0+t1)/2),id=`stair-${flight.id}-${serial++}`;
        this.surfaces.entities.add({id,name:flight.name,description:'Gradini e pianerottoli approssimativi, raccordati al rilievo locale. Misure non rilevate sul posto.',polygon:{
          hierarchy:new PolygonHierarchy(positions),perPositionHeight:true,
          ...(base===undefined?{}:{extrudedHeight:base+elevation.separation(center.lon,center.lat)}),
          material,outline:false,distanceDisplayCondition:new DistanceDisplayCondition(0,750),
        }});this.stairIds.push(id);
      };
      const pieces=[{a:0,b:flight.flightStart,h:flight.low},...Array.from({length:flight.count},(_,i)=>({a:flight.flightStart+i*flight.tread,b:flight.flightStart+(i+1)*flight.tread,h:flight.low+(i+1)*flight.riser})),{a:flight.flightEnd,b:flight.length,h:flight.high}];
      const foundation=flight.low-.8;
      for(const piece of pieces){
        if(piece.b-piece.a<.001)continue;
        addSlab(piece.a,piece.b,-half,half,()=>piece.h,stone,foundation);
        // Light nosing makes every real horizontal tread readable at street level.
        if(piece.a>=flight.flightStart&&piece.a<flight.flightEnd)addSlab(piece.a,piece.a+.045,-half+.15,half-.15,()=>piece.h+.006,edge);
        for(const side of flight.curbs===false?[]:[-1,1]){
          const s0=side<0?-half:-.13+half,s1=side<0?-half+.13:half;
          addSlab(piece.a,piece.b,s0,s1,()=>piece.h+.13,curb,foundation);
        }
      }
      // Small approach ramps match the unmodified ground at both ends and across
      // the width, instead of introducing a new invisible step at the entrance.
      for(const start of flight.apron>0?[-flight.apron,flight.length]:[])for(let i=0;i<8;i++){
        const t0=start+i*flight.apron/8,t1=start+(i+1)*flight.apron/8;
        addSlab(t0,t1,-half,half,(t,s)=>{const p=flight.point(t,s);return elevation.surface(p.lon,p.lat)!;},stone,foundation-.5);
      }
    }
    this.surfaces.entities.resumeEvents();
  }
  setVisible(show:boolean){this.visible=show;this.surfaces.show=show;for(const p of this.models)p.model.show=show;}
  destroy(){this.disposed=true;}
}
