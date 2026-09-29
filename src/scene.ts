import {
  Viewer, Ion, Color, Cartesian3, Cartesian2, Math as CMath, Rectangle,
  createWorldTerrainAsync, createOsmBuildingsAsync,
  PolygonHierarchy, HeightReference, Cartographic, HeadingPitchRange,
  JulianDate, Entity, ScreenSpaceEventHandler, ScreenSpaceEventType,
  Cesium3DTileStyle, Cesium3DTileFeature, CustomDataSource, LabelStyle, VerticalOrigin,
  ConstantPositionProperty, ConstantProperty, Credit, Matrix4, Transforms, HeadingPitchRoll,
  CustomShader, DirectionalLight, SkyAtmosphere, CornerType, ClassificationType,
  DistanceDisplayCondition, sampleTerrainMostDetailed, PerspectiveFrustum,
} from 'cesium';
import { WORLD, SIGNALS, PORTAL, toGeo, toLocal, createCollisionIndex } from '../shared/world.mjs';
import { cameraRelativeInput } from '../shared/controls.mjs';
import { createFacadeShader, fixedToLocal, surfaceMaterial, regionalFacadeMaterial, updateRegionalFacades } from './environment';
import { CivicStudy } from './civic';
import { loadLocalElevation, regionalTerrainProvider } from './terrain-provider.mjs';
import type { TerrainProvider } from 'cesium';
import { civicBlocked } from '../shared/civic.mjs';
import { SPAWN, SPAWN_HEADING } from '../shared/spawn.mjs';
import { localOrthoProvider, neutralBaseProvider } from './local-imagery';
import { REGION } from '../shared/region.mjs';
import { Character } from './character';
import { clampOrbitPitch,orbitOffset,clearCameraDistance } from '../shared/camera.mjs';
import type { Dataset, Player, Peer } from './types';

const color=(hex:string)=>Color.fromCssColorString(hex);
export class WorldScene {
  viewer:Viewer;
  private civic?:CivicStudy;
  private base=new CustomDataSource('Geografia locale');
  private decoration=new CustomDataSource('Segnali');
  private chamber=new CustomDataSource('Camera della risonanza');
  private peers=new Map<string,Entity>();
  private avatar:Entity;
  private halo:Entity;
  private live=false;
  private room='world';
  private smooth={...SPAWN};
  private target={...SPAWN};
  private follow=true;
  private heading=SPAWN_HEADING;
  private pitch=CMath.toRadians(-18);
  private groundHeight=0;
  private originHeight=0;
  private terrain?:TerrainProvider;
  private elevation?:Awaited<ReturnType<typeof loadLocalElevation>>;
  private regionalBuildings=new Set<string>();
  private samplingHeight=false;
  private preparingTerrain=false;
  private sampledAt={...SPAWN};
  private shader?:CustomShader;
  private eyeToLocal=new Matrix4();
  private dragging=false;
  private lastMouse={x:0,y:0};
  private props=new CustomDataSource('Arredo di fantasia');
  private readonly onMouseMove=(event:MouseEvent)=>{
    if(!this.follow || (document.pointerLockElement!==this.viewer.scene.canvas&&!this.dragging))return;
    const locked=document.pointerLockElement===this.viewer.scene.canvas;
    const dx=locked?event.movementX:event.clientX-this.lastMouse.x;
    const dy=locked?event.movementY:event.clientY-this.lastMouse.y;
    this.lastMouse={x:event.clientX,y:event.clientY};
    this.heading=CMath.zeroToTwoPi(this.heading+dx*.002);
    this.pitch=clampOrbitPitch(this.pitch-dy*.002);
  };
  private readonly onMouseUp=()=>{this.dragging=false;};
  private readonly onPointerChange=()=>this.onCapture(document.pointerLockElement===this.viewer.scene.canvas);
  onCapture:(captured:boolean)=>void=()=>{};
  onMode:(thirdPerson:boolean)=>void=()=>{};
  private destroyed=false;
  private removeTick?:()=>void;
  private character=new Character();
  private motionSpeed=0;
  private signalState='';
  private actorHeading=SPAWN_HEADING;
  private cameraRange=5.8;
  private cameraGround=0;
  private displayedHeight=0;
  private lastTerrainCheck=0;
  private blocked:(x:number,y:number)=>boolean;
  private readonly markerPosition=new ConstantPositionProperty();
  private readonly markerPoint=new Cartesian3();
  private readonly cameraPoint=new Cartesian3();
  private readonly cameraFocus=new Cartesian3();
  private readonly localFrame=new Matrix4();
  private readonly cameraLocal=new Cartesian3();
  private frameTimes:number[]=[];
  private statsAt=0;
  onPerformance:(text:string)=>void=()=>{};
  private readonly onResize=()=>{
    const canvas=this.viewer.scene.canvas;
    this.viewer.resolutionScale=Math.min(1,1600/Math.max(1,canvas.clientWidth),900/Math.max(1,canvas.clientHeight));
    if(this.viewer.camera.frustum instanceof PerspectiveFrustum)this.viewer.camera.frustum.fov=2*Math.atan(Math.tan(CMath.toRadians(50)/2)*Math.max(1,canvas.clientWidth/Math.max(1,canvas.clientHeight)));
  };
  private readonly onWheel=(event:WheelEvent)=>{if(this.follow){event.preventDefault();this.cameraRange=Math.max(2.8,Math.min(10,this.cameraRange+event.deltaY*.005));}};
  private tiles?:Awaited<ReturnType<typeof createOsmBuildingsAsync>>;
  private signals=new Map<string,Entity>();
  onSelect:(name:string,description:string)=>void=()=>{};
  onSource:(state:string,detail:string)=>void=()=>{};
  constructor(container:string,private data:Dataset,private preferStreaming=false){
    const buildingsBlocked=createCollisionIndex(data.buildings);
    this.blocked=(x,y)=>buildingsBlocked(x,y)||civicBlocked(x,y);
    // Explicitly disable the library's bundled demo token and default ion imagery.
    Ion.defaultAccessToken='';
    this.viewer=new Viewer(container,{
      baseLayer:false,baseLayerPicker:false,geocoder:false,homeButton:false,
      sceneModePicker:false,navigationHelpButton:false,animation:false,timeline:false,
      fullscreenButton:false,infoBox:false,selectionIndicator:false,
      skyBox:false,skyAtmosphere:false,shadows:false,
      contextOptions:{webgl:{alpha:false}},
    });
    this.onResize();window.addEventListener('resize',this.onResize);
    this.viewer.scene.msaaSamples=2;
    // Smooth subpixel street edges without raising the render-resolution budget.
    this.viewer.scene.postProcessStages.fxaa.enabled=true;
    this.viewer.scene.backgroundColor=color('#b3d2e6');
    this.viewer.scene.globe.baseColor=color('#4d5a4e');
    this.viewer.imageryLayers.addImageryProvider(neutralBaseProvider());
    this.viewer.scene.globe.depthTestAgainstTerrain=true;
    this.viewer.scene.globe.maximumScreenSpaceError=5;
    this.viewer.scene.screenSpaceCameraController.minimumZoomDistance=.3;
    this.viewer.scene.screenSpaceCameraController.maximumZoomDistance=5000;
    this.viewer.scene.skyAtmosphere=new SkyAtmosphere();
    this.viewer.scene.skyAtmosphere.saturationShift=-.15;
    this.viewer.scene.skyAtmosphere.brightnessShift=.05;
    this.viewer.scene.fog.enabled=false;

    const lightDirection=Matrix4.multiplyByPointAsVector(Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(WORLD.origin.lon,WORLD.origin.lat)),new Cartesian3(.35,.55,-.8),new Cartesian3());
    this.viewer.scene.light=new DirectionalLight({direction:Cartesian3.normalize(lightDirection,lightDirection),color:Color.WHITE,intensity:2.1});
    this.viewer.clock.currentTime=JulianDate.fromIso8601('2026-09-22T11:00:00Z');
    this.viewer.cesiumWidget.creditDisplay.addStaticCredit(new Credit('© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',true)); 
    // Data credits are also visible in the HTML footer and linked to the source database.
    this.viewer.dataSources.add(this.base);this.viewer.dataSources.add(this.decoration);this.viewer.dataSources.add(this.chamber);this.viewer.dataSources.add(this.props);
    this.chamber.show=false;
    this.base.entities.suspendEvents();
    this.addLocalData();if(!preferStreaming)this.addLocalBuildings();
    this.base.entities.resumeEvents();this.addSignals();this.addInterior();this.addProps();
    this.civic=new CivicStudy(this.viewer,data,()=>this.refreshCivic(),()=>this.onSelect('Studio del centro','Un elemento del campione non è disponibile. Ricarica per riprovare; la base geografica resta disponibile.'));
    this.avatar=this.viewer.entities.add({position:this.markerPosition,point:{pixelSize:8,color:color('#e4ffec'),outlineColor:color('#284b44'),outlineWidth:2,disableDepthTestDistance:Number.POSITIVE_INFINITY}});
    this.halo=this.viewer.entities.add({show:false});
    void this.character.load(model=>this.viewer.scene.primitives.add(model)).catch(()=>this.onSelect('Personaggio non disponibile','Ricarica la pagina per ritentare il caricamento del modello locale.'));
    const click=new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    click.setInputAction((event:{position:Cartesian2})=>{
      if(this.follow)return;
      const picked=this.viewer.scene.pick(event.position);
      if(picked?.id instanceof Entity){
        const e=picked.id as Entity;
        if(e.name)this.onSelect(e.name,e.description?.getValue(JulianDate.now())??'Elemento di Montemurlo.');
      }else if(picked instanceof Cesium3DTileFeature){
        const name=picked.getProperty('name')||'Edificio di Montemurlo';
        const id=`${picked.getProperty('elementType')??'element'}/${picked.getProperty('elementId')??'—'}`;
        const measured=picked.getProperty('height'),estimated=picked.getProperty('cesium#estimatedHeight');
        const height=measured?`Altezza dichiarata: ${measured}.`:estimated?`Altezza stimata dal dataset: ${estimated} m.`:'Altezza non dichiarata nei metadati.';
        this.onSelect(String(name),`${id} · ${height} Dati Cesium OSM Buildings; interni e ingressi non inclusi.`);
      }
    },ScreenSpaceEventType.LEFT_CLICK);
    this.viewer.scene.renderError.addEventListener(()=>this.onSource('error','Il rendering 3D si è interrotto. Prova a ricaricare o usa un browser con WebGL attivo.'));
    this.explore();
    this.viewer.scene.canvas.addEventListener('pointerdown',event=>{if(this.follow&&event.button===0){this.dragging=true;this.lastMouse={x:event.clientX,y:event.clientY};}});
    document.addEventListener('pointermove',this.onMouseMove);
    document.addEventListener('pointerup',this.onMouseUp);
    document.addEventListener('pointerlockchange',this.onPointerChange);
    this.viewer.scene.canvas.addEventListener('wheel',this.onWheel,{passive:false});
    let previous=performance.now();
    this.removeTick=this.viewer.scene.preUpdate.addEventListener(()=>{
      if(this.destroyed)return;
      const time=performance.now(),elapsed=time-previous,dt=Math.min(elapsed/1000,.1);previous=time;
      const oldX=this.smooth.x,oldY=this.smooth.y;
      const alpha=1-Math.exp(-12*dt);
      this.smooth.x+=(this.target.x-this.smooth.x)*alpha;this.smooth.y+=(this.target.y-this.smooth.y)*alpha;
      const dx=this.smooth.x-oldX,dy=this.smooth.y-oldY,speed=dt>0?Math.hypot(dx,dy)/dt:0;
      if(speed>.15){const desired=Math.atan2(dx,dy);const delta=Math.atan2(Math.sin(desired-this.actorHeading),Math.cos(desired-this.actorHeading));this.actorHeading+=delta*(1-Math.exp(-15*dt));}
      const geo=toGeo(this.smooth.x,this.smooth.y);
      // Read loaded terrain without a network round trip; occasional detailed samples correct LOD changes.
      if(this.room==='world'&&this.terrain&&!this.preparingTerrain){
        const local=this.elevation?.core(geo.lon,geo.lat)?this.elevation.ellipsoid(geo.lon,geo.lat):undefined;
        const loaded=local??this.viewer.scene.globe.getHeight(Cartographic.fromDegrees(geo.lon,geo.lat));
        if(loaded!==undefined&&(local!==undefined||Math.abs(loaded-this.groundHeight)<4))this.groundHeight=loaded;
        if(local===undefined&&!this.samplingHeight&&time-this.lastTerrainCheck>1500&&Math.hypot(this.smooth.x-this.sampledAt.x,this.smooth.y-this.sampledAt.y)>8){
          this.samplingHeight=true;this.lastTerrainCheck=time;const at={...this.smooth};
          void sampleTerrainMostDetailed(this.terrain,[Cartographic.fromDegrees(geo.lon,geo.lat)]).then(samples=>{
            if(!this.destroyed&&this.room==='world'&&Math.hypot(this.smooth.x-at.x,this.smooth.y-at.y)<15&&Number.isFinite(samples[0].height)){this.groundHeight=samples[0].height;this.sampledAt=at;}
          }).catch(()=>{this.sampledAt=at;}).finally(()=>{this.samplingHeight=false;});
        }
      }
      const ground=this.room==='world'?this.groundHeight:800;
      this.displayedHeight+=(ground-this.displayedHeight)*(1-Math.exp(-12*dt));
      this.motionSpeed+=(speed-this.motionSpeed)*(1-Math.exp(-10*dt));
      const onStairs=this.room==='world'&&this.elevation?.stairs.locate(geo.lon,geo.lat);
      this.character.update(geo.lon,geo.lat,onStairs?ground:this.displayedHeight,this.actorHeading,this.motionSpeed);
      if(!this.follow)this.markerPosition.setValue(Cartesian3.fromDegrees(geo.lon,geo.lat,this.displayedHeight+1,undefined,this.markerPoint));
      if(this.follow&&!this.preparingTerrain){
        const blocked=this.room==='world'?this.blocked:(x:number,y:number)=>Math.abs(x)>10.5||y>8.5||y< -8.5;
        const distance=clearCameraDistance(this.smooth.x,this.smooth.y,this.heading,this.pitch,this.cameraRange,blocked);
        const offset=orbitOffset(this.heading,this.pitch,distance);
        const behind=toGeo(this.smooth.x+offset.x,this.smooth.y+offset.y);
        this.cameraGround=this.room==='world'?this.height(behind.lon,behind.lat):800;
        Cartesian3.fromDegrees(geo.lon,geo.lat,this.displayedHeight,undefined,this.cameraFocus);
        Transforms.eastNorthUpToFixedFrame(this.cameraFocus,undefined,this.localFrame);
        Cartesian3.fromElements(offset.x,offset.y,Math.max(offset.z,this.cameraGround-this.displayedHeight+.4),this.cameraLocal);
        Matrix4.multiplyByPoint(this.localFrame,this.cameraLocal,this.cameraPoint);
        const pitch=-Math.atan2(this.cameraLocal.z-1.15,Math.max(.01,Math.hypot(offset.x,offset.y)));
        this.viewer.camera.setView({destination:this.cameraPoint,orientation:{heading:this.heading,pitch,roll:0}});
      }
      Matrix4.multiply(fixedToLocal,this.viewer.camera.inverseViewMatrix,this.eyeToLocal);
      updateRegionalFacades(this.eyeToLocal);
      if(this.shader){this.shader.setUniform('u_eyeToLocal',this.eyeToLocal);this.shader.setUniform('u_ground',this.originHeight);}
      if(!document.hidden&&elapsed<1000)this.frameTimes.push(elapsed);
      if(time-this.statsAt>2000){
        const frames=this.frameTimes.sort((a,b)=>a-b),mean=frames.reduce((a,b)=>a+b,0)/Math.max(1,frames.length),p95=frames[Math.floor(frames.length*.95)]??0;
        this.onPerformance(`${Math.round(1000/mean)} fps · 95% fotogrammi entro ${Math.round(p95)} ms · ${this.character.clip} · personaggio 1,75 m`);
        this.frameTimes=[];this.statsAt=time;
      }
    });
  }
  private height(lon:number,lat:number){
    if(!this.live)return 0;
    if(this.elevation?.core(lon,lat))return this.elevation.ellipsoid(lon,lat)??this.groundHeight;
    const sampled=this.viewer.scene.globe.getHeight(Cartographic.fromDegrees(lon,lat));
    return sampled??this.groundHeight;
  }
  private addLocalData(){
    for(const area of this.data.areas){
      this.base.entities.add({id:'ground-area-'+area.id,polygon:{hierarchy:Cartesian3.fromDegreesArray(area.coordinates.flat()),material:area.kind==='water'?color('#455f65'):surfaceMaterial(area.kind==='green'?'grass':'paving',48,48),classificationType:ClassificationType.TERRAIN}});
    }
    for(const road of this.data.roads){
      const path=['footway','path','steps','cycleway','pedestrian'].includes(road.kind);
      const width=path?2.2:['primary','secondary','tertiary'].includes(road.kind)?7:road.kind==='service'?3.5:5.5;
      const positions=Cartesian3.fromDegreesArray(road.coordinates.flat());
      if(!path)this.base.entities.add({corridor:{positions,width:width+1.6,cornerType:CornerType.BEVELED,material:color('#99968a'),classificationType:ClassificationType.TERRAIN,zIndex:1}});
      this.base.entities.add({name:road.name||'Percorso',corridor:{positions,width,cornerType:CornerType.BEVELED,material:surfaceMaterial(path?'paving':'asphalt',32,1),classificationType:ClassificationType.TERRAIN,zIndex:2}});
    }
  }
  private addLocalBuildings(){
    for(const building of this.data.buildings){
      if(this.base.entities.getById(building.id))continue;
      const outer=building.rings[0];
      const materials=['#dbd3bc','#b9c3b7','#c9bfab','#e0d7c4','#aebbad'];
      let hash=0;for(const ch of building.id)hash=(hash*31+ch.charCodeAt(0))>>>0;
      this.base.entities.add({id:building.id,name:building.name||'Edificio di Montemurlo',description:`${building.id} · ${building.height} m${building.heightEstimated?' (altezza stimata)':''}. Sagoma OpenStreetMap; facciata semplificata.`,polygon:{
        hierarchy:new PolygonHierarchy(Cartesian3.fromDegreesArray(outer.flat()),building.rings.slice(1).map(r=>new PolygonHierarchy(Cartesian3.fromDegreesArray(r.flat())))),
        height:0,extrudedHeight:building.height,material:color(materials[hash%materials.length]),outline:false,
      }});
    }
  }
  private addRegionalBuildings(){
    const elevation=this.elevation;if(!elevation)return;
    for(const building of this.data.buildings){
      if(this.civic?.replaced.has(building.id))continue;
      const ring=building.rings[0];
      if(!ring.every(([lon,lat])=>elevation.core(lon,lat)))continue;
      const heights=ring.map(([lon,lat])=>elevation.ellipsoid(lon,lat)!).sort((a,b)=>a-b);
      const floor=heights[Math.floor(heights.length/2)],bottom=heights[0]-.5;
      this.base.entities.removeById(building.id);
      this.base.entities.add({id:building.id,name:building.name||'Edificio di Montemurlo',description:`${building.id} · terreno regionale; altezza edificio ${building.height} m${building.heightEstimated?' stimata':''}. Fondazione adattata al rilievo; quota del pavimento non rilevata.`,polygon:{
        hierarchy:new PolygonHierarchy(Cartesian3.fromDegreesArray(ring.flat()),building.rings.slice(1).map(r=>new PolygonHierarchy(Cartesian3.fromDegreesArray(r.flat())))),
        height:bottom,extrudedHeight:floor+building.height,material:regionalFacadeMaterial(this.originHeight),outline:false,
      }});
      this.regionalBuildings.add(building.id);
    }
  }
  private addSignals(){
    for(const signal of SIGNALS){
      const e=this.decoration.entities.add({id:'signal-'+signal.id,name:signal.name,description:signal.story,
        position:Cartesian3.fromDegrees(signal.lon,signal.lat),
        point:{pixelSize:13,color:color('#e4c475'),outlineColor:color('#554e31'),outlineWidth:3,heightReference:HeightReference.CLAMP_TO_GROUND,disableDepthTestDistance:Number.POSITIVE_INFINITY},
        label:{text:signal.place,distanceDisplayCondition:new DistanceDisplayCondition(0,600),font:'12px sans-serif',fillColor:color('#f8f5e7'),outlineColor:color('#243932'),outlineWidth:4,style:LabelStyle.FILL_AND_OUTLINE,pixelOffset:new Cartesian2(0,-24),verticalOrigin:VerticalOrigin.BOTTOM,heightReference:HeightReference.CLAMP_TO_GROUND,disableDepthTestDistance:Number.POSITIVE_INFINITY},
      });this.signals.set(signal.id,e);
    }
    const p=toGeo(PORTAL.x,PORTAL.y);
    this.decoration.entities.add({name:'La soglia',description:'Un passaggio immaginario. Raccogli i tre echi per aprirlo.',position:Cartesian3.fromDegrees(p.lon,p.lat),point:{pixelSize:10,color:color('#98d6ce'),outlineColor:color('#183c37'),outlineWidth:2,heightReference:HeightReference.CLAMP_TO_GROUND,disableDepthTestDistance:Number.POSITIVE_INFINITY}});
    const circle=Array.from({length:129},(_,i)=>{const angle=i*Math.PI*2/128;return [REGION.center.lon+Math.cos(angle)*1000/(111320*Math.cos(REGION.center.lat*Math.PI/180)),REGION.center.lat+Math.sin(angle)*1000/111132];});
    this.decoration.entities.add({polyline:{positions:Cartesian3.fromDegreesArray(circle.flat()),width:1,material:color('#edf4ce').withAlpha(.55),clampToGround:true}});
  }
  private addProps(){
    for(const signal of SIGNALS){
      const position=Cartesian3.fromDegrees(signal.lon,signal.lat);
      this.props.entities.add({position:Cartesian3.fromDegrees(signal.lon,signal.lat,1.7),orientation:Transforms.headingPitchRollQuaternion(position,new HeadingPitchRoll()),ellipsoid:{radii:new Cartesian3(.18,.18,.9),material:color('#8ff0db').withAlpha(.8),heightReference:HeightReference.RELATIVE_TO_GROUND}});
      this.props.entities.add({position,ellipse:{semiMajorAxis:1.8,semiMinorAxis:1.8,material:color('#83dfc8').withAlpha(.2),classificationType:ClassificationType.TERRAIN}});
    }
  }
  private addInterior(){
    const makeBox=(x:number,y:number,z:number,sx:number,sy:number,sz:number,hex:string)=>{
      const geo=toGeo(x,y);this.chamber.entities.add({position:Cartesian3.fromDegrees(geo.lon,geo.lat,800+z),orientation:Transforms.headingPitchRollQuaternion(Cartesian3.fromDegrees(geo.lon,geo.lat,800+z),new HeadingPitchRoll()),box:{dimensions:new Cartesian3(sx,sy,sz),material:color(hex)}});
    };
    makeBox(0,0,-.5,24,20,1,'#314947');
    makeBox(-11.5,0,1.5,1,20,3,'#56706a');makeBox(11.5,0,1.5,1,20,3,'#56706a');makeBox(0,9.5,1.5,24,1,3,'#56706a');
    for(const x of [-8,8])for(const y of [-6,0,6])makeBox(x,y,2,1.2,1.2,4,'#91a194');
    makeBox(0,0,.3,4,4,.6,'#718e80');
    this.chamber.entities.add({position:Cartesian3.fromDegrees(WORLD.origin.lon,WORLD.origin.lat,802),ellipsoid:{radii:new Cartesian3(.8,.8,1.7),material:color('#b6f8d8')},label:{text:'IL CUORE DELLA RISONANZA',font:'12px sans-serif',pixelOffset:new Cartesian2(0,-65),fillColor:color('#d6f9e8'),disableDepthTestDistance:Number.POSITIVE_INFINITY}});
    const exit=toGeo(0,-6);this.chamber.entities.add({position:Cartesian3.fromDegrees(exit.lon,exit.lat,800.05),ellipse:{semiMajorAxis:1.4,semiMinorAxis:1.4,material:color('#ddc987')}});
  }
  async connectStreaming(token:string){
    if(!token){this.onSource('local','Estratto OSM reale · terreno piatto · altezze in parte stimate');return;}
    this.onSource('loading','Connessione a terreno ed edifici Cesium…');Ion.defaultAccessToken=token;
    let imageryReady=false;
    const imageryTask=localOrthoProvider().then(provider=>{
      if(this.destroyed)return;this.viewer.imageryLayers.addImageryProvider(provider);
      imageryReady=true;
      for(const area of this.data.areas){if(area.kind!=='water'){const e=this.base.entities.getById('ground-area-'+area.id);if(e)e.show=false;}}
    }).catch(error=>console.warn('Ortofoto locali:',error));
    let terrainReady=false,buildingsReady=false;
    const results=await Promise.allSettled([
      createWorldTerrainAsync({requestVertexNormals:false}).then(async baseline=>{
        let terrain:TerrainProvider=baseline;
        try{this.elevation=await loadLocalElevation();terrain=regionalTerrainProvider(baseline,this.elevation);}
        catch(error){console.warn('Rilievo regionale non disponibile; uso il terreno Cesium.',error);}

        const spawnGeo=toGeo(SPAWN.x,SPAWN.y);
        const samples=await sampleTerrainMostDetailed(terrain,[Cartographic.fromDegrees(WORLD.origin.lon,WORLD.origin.lat),Cartographic.fromDegrees(spawnGeo.lon,spawnGeo.lat)]);
        if(Number.isFinite(samples[0].height))this.originHeight=samples[0].height;
        this.groundHeight=this.displayedHeight=Number.isFinite(samples[1].height)?samples[1].height:this.originHeight;
        this.terrain=terrain;this.viewer.terrainProvider=terrain;this.live=true;terrainReady=true;
        // Load the surrounding ground from above before placing the eye beneath coarse LODs.
        this.preparingTerrain=true;
        this.viewer.camera.setView({destination:Cartesian3.fromDegrees(spawnGeo.lon,spawnGeo.lat,this.groundHeight+650),orientation:{heading:0,pitch:-Math.PI/2,roll:0}});
        await new Promise<void>(resolve=>{
          let frames=0;
          const finish=()=>{remove();clearTimeout(timeout);resolve();};
          const remove=this.viewer.scene.postRender.addEventListener(()=>{if(++frames>3&&this.viewer.scene.globe.tilesLoaded)finish();});
          const timeout=setTimeout(finish,12000);
        });
        await this.civic?.setTerrain(terrain,this.originHeight,(lon,lat)=>this.elevation?.core(lon,lat)?this.elevation.ellipsoid(lon,lat):undefined);
        if(this.elevation)this.civic?.addStairways(this.elevation);
        this.addRegionalBuildings();this.refreshCivic();
        this.preparingTerrain=false;
        terrain.errorEvent.addEventListener(()=>this.onSource('partial','Alcune porzioni del terreno non sono disponibili. Verifica connessione e quote Cesium.'));}),
      createOsmBuildingsAsync().then(tiles=>{this.tiles=tiles;tiles.tileFailed.addEventListener(()=>this.onSource('partial','Alcuni edifici non sono disponibili. Verifica connessione e quote Cesium.'));tiles.maximumScreenSpaceError=12;tiles.showCreditsOnScreen=true;this.shader=createFacadeShader();tiles.customShader=this.shader;this.viewer.scene.primitives.add(tiles);tiles.show=this.room==='world';buildingsReady=true;this.refreshCivic();}),
    ]);
    if(!buildingsReady&&this.preferStreaming){this.base.entities.suspendEvents();this.addLocalBuildings();this.base.entities.resumeEvents();}
    if(terrainReady||buildingsReady){
      for(const entity of this.base.entities.values){
        if(entity.polygon){
          if(entity.id.startsWith('way/')||entity.id.startsWith('relation/'))entity.show=this.regionalBuildings.has(entity.id)||!buildingsReady;
          if(terrainReady&&entity.polygon.height&&!this.regionalBuildings.has(entity.id)){
            entity.polygon.heightReference=new ConstantProperty(HeightReference.RELATIVE_TO_GROUND);
            if(entity.polygon.extrudedHeight){
              entity.polygon.extrudedHeightReference=new ConstantProperty(HeightReference.RELATIVE_TO_GROUND);
            }
          }
        }
      }
    }
    this.refreshCivic();
    await imageryTask;
    const failed=results.some(r=>r.status==='rejected')||!imageryReady;
    for(const result of results)if(result.status==='rejected')console.warn('Streaming: '+String(result.reason)+'; status '+(result.reason?.statusCode??'unknown'));
    this.onSource(failed?(terrainReady||buildingsReady?'partial':'unavailable'):'live',failed?`Terreno: ${terrainReady?'connesso':'non disponibile'} · edifici: ${buildingsReady?'connessi':'estratto locale'} · ortofoto: ${imageryReady?'locali':'non disponibili'}. Controlla token, asset e quote.`:(this.elevation?'DTM Regione Toscana 1 m (2008–2010) + ortofoto 2024/2025 + Cesium · quote EGM96 approssimate':'Cesium World Terrain + OSM Buildings · rilievo regionale non disponibile'));
    // Preserve the player's selected view when the provider becomes ready.
  }
  setState(self:Player,others:Peer[]){
    this.target={x:self.x,y:self.y};
    if(self.room!==this.room){
      this.room=self.room;this.smooth={...this.target};this.displayedHeight=self.room==='world'?this.groundHeight:800;
      const outside=self.room==='world';this.base.show=outside;this.decoration.show=outside;this.chamber.show=!outside;this.props.show=outside;this.civic?.setVisible(outside);if(this.tiles)this.tiles.show=outside;
      this.viewer.scene.globe.show=outside;
      this.heading=0;this.pitch=CMath.toRadians(-18);this.explore();
    }
    const signalState=self.signals.join(',');
    if(signalState!==this.signalState){this.signalState=signalState;for(const signal of SIGNALS){const e=this.signals.get(signal.id)!;if(e.point)e.point.color=new ConstantProperty(color(self.signals.includes(signal.id)?'#99e3c2':'#e4c475'));}}
    const active=new Set<string>();
    for(const peer of others){
      if(peer.id===self.id)continue;active.add(peer.id);
      let e=this.peers.get(peer.id);if(!e){e=this.viewer.entities.add({point:{pixelSize:10,color:color('#9cc5e5'),outlineColor:color('#213b4e'),outlineWidth:2,disableDepthTestDistance:Number.POSITIVE_INFINITY},label:{text:peer.name,font:'11px sans-serif',pixelOffset:new Cartesian2(0,-18),fillColor:Color.WHITE,outlineColor:Color.BLACK,outlineWidth:3,style:LabelStyle.FILL_AND_OUTLINE}});this.peers.set(peer.id,e);}
      const geo=toGeo(peer.x,peer.y);e.position=new ConstantPositionProperty(Cartesian3.fromDegrees(geo.lon,geo.lat,(self.room==='world'?this.height(geo.lon,geo.lat):800)+1));
    }
    for(const [id,e] of this.peers)if(!active.has(id)){this.viewer.entities.remove(e);this.peers.delete(id);}
  }
  private refreshCivic(){
    const ids=[...new Set([...(this.civic?.replaced??[]),...this.regionalBuildings])];
    if(this.tiles){
      // Check both representations: ion metadata versions can expose numeric or string IDs.
      const show=ids.length?ids.map(id=>{const n=id.split('/')[1];return `(String(${"${elementId}"}) !== '${n}')`;}).join(' && '):'true';
      this.tiles.style=new Cesium3DTileStyle({show});
    }
    for(const id of this.civic?.replaced??[]){const e=this.base.entities.getById(id);if(e)e.show=!this.tiles&&!ids.includes(id);}
    this.civic?.setVisible(this.room==='world');
  }
  setEdgeSmoothing(enabled:boolean){this.viewer.scene.postProcessStages.fxaa.enabled=enabled;}
  overview(_animate=true){
    if(this.room==='chamber')return;
    this.decoration.show=true;
    this.follow=false;this.dragging=false;
    if(document.pointerLockElement===this.viewer.scene.canvas)document.exitPointerLock();
    this.viewer.scene.screenSpaceCameraController.enableInputs=true;this.viewer.camera.frustum.far=6000;
    this.viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    const center=Cartesian3.fromDegrees(11.0345,43.9285,this.height(11.0345,43.9285));
    this.viewer.camera.lookAt(center,new HeadingPitchRange(CMath.toRadians(-18),CMath.toRadians(-48),1450));
    this.avatar.show=true;this.onMode(false);
  }
  explore(){
    this.decoration.show=this.room==='world';
    this.follow=true;
    this.viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    this.viewer.scene.screenSpaceCameraController.enableInputs=false;
    this.viewer.camera.frustum.near=.1;
    this.viewer.camera.frustum.far=2200;
    this.avatar.show=false;this.halo.show=false;this.onMode(true);
  }
  captureMouse(){
    this.explore();
    // Pointer lock must originate in an explicit click; drag remains available if denied.
    try{const result=this.viewer.scene.canvas.requestPointerLock();
      if(result)result.catch(()=>this.onCapture(false));
    }catch{this.onCapture(false);}
  }
  movement(right:number,forward:number){return cameraRelativeInput(right,forward,this.heading);}
  turn(horizontal:number,vertical:number){this.heading=CMath.zeroToTwoPi(this.heading+horizontal);this.pitch=clampOrbitPitch(this.pitch+vertical);}
  get isFollowing(){return this.follow;}
  destroy(){
    this.destroyed=true;window.removeEventListener('resize',this.onResize);this.removeTick?.();this.character.destroy();
    this.viewer.scene.canvas.removeEventListener('wheel',this.onWheel);
    document.removeEventListener('pointermove',this.onMouseMove);document.removeEventListener('pointerup',this.onMouseUp);document.removeEventListener('pointerlockchange',this.onPointerChange);
    if(document.pointerLockElement===this.viewer.scene.canvas)document.exitPointerLock();
    this.civic?.destroy();this.viewer.destroy();this.shader?.destroy();
  }
}
