import {Model,ModelAnimationLoop,Matrix4,Cartesian3,HeadingPitchRoll,Transforms} from 'cesium';
import {locomotion} from '../shared/camera.mjs';
import metadata from '../public/models/robot/metadata.json';

export class Character {
  model?:Model;
  private animation='';
  private disposed=false;
  private position=new Cartesian3();
  private orientation=new HeadingPitchRoll();
  private matrix=new Matrix4();
  async load(add:(model:Model)=>void){
    const model=await Model.fromGltfAsync({url:'/models/robot/RobotExpressive.glb',scale:metadata.scale,minimumPixelSize:0,modelMatrix:Matrix4.clone(Matrix4.IDENTITY)});
    if(this.disposed){model.destroy();return;}
    this.model=model;add(model);
    model.activeAnimations.animateWhilePaused=true;
  }
  update(lon:number,lat:number,height:number,heading:number,speed:number){
    const model=this.model;if(!model)return;
    Cartesian3.fromDegrees(lon,lat,height+metadata.baseOffset,undefined,this.position);
    this.orientation.heading=heading-Math.PI/2;
    Transforms.headingPitchRollToFixedFrame(this.position,this.orientation,undefined,undefined,this.matrix);
    model.modelMatrix=this.matrix;
    const name=locomotion(speed);
    if(model.ready&&name!==this.animation){
      model.activeAnimations.removeAll();
      const started=performance.now();
      model.activeAnimations.add({name,loop:ModelAnimationLoop.REPEAT,animationTime:duration=>((performance.now()-started)/1000)%duration/duration});
      this.animation=name;
    }
  }
  get clip(){return this.animation||'Caricamento';}
  destroy(){this.disposed=true;}
}
