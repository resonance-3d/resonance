import {
  Cartesian2, Cartesian3, Color, CustomShader, UniformType, LightingModel,
  Matrix4, Transforms, ColorMaterialProperty, Material, Event,
} from 'cesium';
import { WORLD } from '../shared/world.mjs';

// All ornament is fictional. This changes shading, never the source tile geometry.
export function createFacadeShader() {
  return new CustomShader({
    lightingModel: LightingModel.PBR,
    uniforms: {
      u_eyeToLocal: {type:UniformType.MAT4,value:Matrix4.clone(Matrix4.IDENTITY)},
      u_ground: {type:UniformType.FLOAT,value:0},
    },
    fragmentShaderText: `
      float noise21(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float rectMask(vec2 p, vec2 lo, vec2 hi, vec2 aa) {
        vec2 a=smoothstep(lo-aa,lo+aa,p)*(1.0-smoothstep(hi-aa,hi+aa,p));
        return a.x*a.y;
      }
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 p=(u_eyeToLocal*vec4(fsInput.attributes.positionEC,1.0)).xyz;
        vec3 n=normalize(mat3(u_eyeToLocal)*fsInput.attributes.normalEC);
        float buildingSeed=fract(sin(float(fsInput.featureIds.featureId_0)*12.9898)*43758.5453);
        float h=p.z-u_ground;
        vec2 tangent=normalize(vec2(-n.y,n.x)+vec2(0.00001));
        // Signed distance along the facade preserves window width on rotated walls.
        float u=dot(p.xy,tangent);
        vec2 uv=vec2(u/3.25,h/3.1);
        vec2 tile=fract(uv);
        vec2 aa=max(fwidth(uv),vec2(.004));
        float grain=noise21(floor(vec2(u,h)*32.0));
        vec3 plaster=mix(vec3(.57,.57,.54),vec3(.71,.66,.56),buildingSeed);
        plaster*=.92+.12*grain;
        float streak=.025*sin(u*11.0)*sin(u*2.3);
        plaster-=vec3(streak*(1.0-tile.y));
        float trim=1.0-smoothstep(.014,.014+aa.y,abs(tile.y-.02));
        vec3 facade=mix(plaster,vec3(.38,.39,.38),trim*.7);
        float stoneBase=1.0-smoothstep(1.0,1.25,h);
        facade=mix(facade,vec3(.34,.36,.35)*(0.9+grain*.13),stoneBase);
        float frame=rectMask(tile,vec2(.27,.23),vec2(.73,.83),aa);
        float glass=rectMask(tile,vec2(.30,.27),vec2(.70,.79),aa);
        float mullion=1.0-smoothstep(.010,.010+aa.x,abs(tile.x-.5));
        float crossbar=1.0-smoothstep(.013,.013+aa.y,abs(tile.y-.52));
        vec3 windowColor=mix(vec3(.055,.11,.135),vec3(.15,.22,.24),tile.y);
        float lit=step(.86,noise21(floor(uv)+buildingSeed*19.0));
        windowColor=mix(windowColor,vec3(.67,.45,.20),lit*.75);
        facade=mix(facade,vec3(.29,.32,.32),frame);
        facade=mix(facade,windowColor,glass*(1.0-mullion)*(1.0-crossbar));
        // Roofs get a weathered tile/bitumen treatment, without inventing roof geometry.
        vec2 roofUv=p.xy*1.8;
        vec2 roofCell=fract(roofUv);
        float seam=step(.94,roofCell.x)+step(.95,roofCell.y);
        vec3 roof=mix(vec3(.26,.28,.28),vec3(.36,.23,.18),step(.35,buildingSeed));
        roof*=.9+grain*.12-seam*.12;
        float roofMask=smoothstep(.55,.8,abs(n.z));
        material.diffuse=mix(facade,roof,roofMask);
        material.roughness=mix(.88,.3,glass*(1.0-roofMask));
        material.specular=vec3(.04);
        material.emissive=vec3(.19,.10,.028)*lit*glass*(1.0-roofMask);
      }
    `,
  });
}
export const fixedToLocal=Matrix4.inverseTransformation(
  Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(WORLD.origin.lon,WORLD.origin.lat)),new Matrix4(),
);

// Opaque, analytically filtered paving: no high-frequency raster grain or downloads.
// Cesium's public Fabric constructor registers the type for MaterialProperty.getType.
const pavingType='ResonanceFilteredPaving';
const template=new Material({
  fabric:{type:pavingType,uniforms:{color:Color.WHITE,repeat:new Cartesian2(1,1)},source:`
    czm_material czm_getMaterial(czm_materialInput materialInput) {
      czm_material m=czm_getDefaultMaterial(materialInput);
      vec2 uv=materialInput.st*repeat;
      vec2 footprint=max(fwidth(uv),vec2(0.0001));
      // Independent axes avoid a discontinuous derivative at staggered row boundaries.
      float row=floor(uv.y);
      vec2 cell=fract(uv+vec2(mod(row,2.0)*0.5,0.0));
      vec2 edge=min(cell,1.0-cell);
      vec2 joint=1.0-smoothstep(vec2(0.018)-footprint*0.5,vec2(0.018)+footprint*0.5,edge);
      vec2 visibility=1.0-smoothstep(vec2(0.12),vec2(0.5),footprint);
      float lines=max(joint.x*visibility.x,joint.y*visibility.y);
      vec2 tile=floor(uv+vec2(mod(row,2.0)*0.5,0.0));
      float slab=fract(sin(dot(tile,vec2(127.1,311.7)))*43758.5453);
      float variation=(slab-.5)*.035*(1.0-smoothstep(.25,1.0,max(footprint.x,footprint.y)));
      m.diffuse=color.rgb*(1.0+variation-0.13*lines);
      m.alpha=1.0;
      return m;
    }
  `},translucent:false,
});
template.destroy();
const contactType='ResonanceContactShade';
const contactTemplate=new Material({fabric:{type:contactType,source:`
  czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material m=czm_getDefaultMaterial(materialInput);
    float r=length((materialInput.st-.5)*2.0);
    m.diffuse=vec3(.08,.095,.08);
    m.alpha=.19*(1.0-smoothstep(.15,1.0,r));
    return m;
  }
`},translucent:true});
contactTemplate.destroy();
export const contactShade={isConstant:true,definitionChanged:new Event(),getType:()=>contactType,getValue:()=>({}),equals:(other:unknown)=>other===contactShade};
class PavingMaterial {
  readonly isConstant=true;
  readonly definitionChanged=new Event();
  constructor(private color:Color,private repeat:Cartesian2){}
  getType(){return pavingType;}
  getValue(_time:unknown,result:{color?:Color;repeat?:Cartesian2}={}){
    result.color=Color.clone(this.color,result.color);
    result.repeat=Cartesian2.clone(this.repeat,result.repeat);
    return result;
  }
  equals(other:unknown){return this===other;}
}
const materials=new Map<string,ColorMaterialProperty|PavingMaterial>();
export function surfaceMaterial(kind:string,repeatX=1,repeatY=1) {
  const key=`${kind}:${repeatX}:${repeatY}`;
  if(!materials.has(key)){
    const base=Color.fromCssColorString(kind==='asphalt'?'#404344':kind==='grass'?'#4b5744':kind==='civic'?'#bbb8ad':kind==='republic'?'#adafae':kind==='terracotta'?'#98674f':'#767369');
    materials.set(key,['paving','civic','republic','terracotta'].includes(kind)?new PavingMaterial(base,new Cartesian2(repeatX,repeatY)):new ColorMaterialProperty(base));
  }
  return materials.get(key)!;
}

// Same lightweight window treatment for footprints re-anchored to the regional DTM.
// Share a single material so Cesium can batch the local footprints; ornament remains fictional.
const localFacadeType='ResonanceRegionalFacade';
const localFacadeTemplate=new Material({fabric:{type:localFacadeType,uniforms:{eyeToLocal:Matrix4.toArray(Matrix4.IDENTITY),ground:0},source:`
  float facadeNoise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material m=czm_getDefaultMaterial(materialInput);
    vec3 p=(eyeToLocal*vec4(-materialInput.positionToEyeEC,1.0)).xyz;
    vec3 n=normalize(mat3(eyeToLocal)*materialInput.normalEC);
    vec2 tangent=normalize(vec2(-n.y,n.x)+vec2(.00001));
    float h=p.z-ground,u=dot(p.xy,tangent);
    vec2 uv=vec2(u/3.25,h/3.1),cell=fract(uv),aa=max(fwidth(uv),vec2(.004));
    vec2 edge=smoothstep(vec2(.27,.23)-aa,vec2(.27,.23)+aa,cell)*(1.0-smoothstep(vec2(.73,.83)-aa,vec2(.73,.83)+aa,cell));
    float window=edge.x*edge.y*step(.5,h);
    float mullion=1.0-smoothstep(.012,.012+aa.x,abs(cell.x-.5));
    float seed=facadeNoise(floor(p.xy/30.0));
    vec3 plaster=mix(vec3(.57,.57,.54),vec3(.71,.66,.56),seed);
    plaster*=.96+.06*facadeNoise(floor(vec2(u,h)*24.0));
    vec3 wall=mix(plaster,vec3(.12,.19,.21),window*(1.0-mullion));
    wall=mix(vec3(.34,.36,.35),wall,smoothstep(.8,1.1,h));
    vec3 roof=mix(vec3(.26,.28,.28),vec3(.36,.23,.18),step(.35,seed));
    m.diffuse=mix(wall,roof,smoothstep(.55,.8,abs(n.z)));
    m.alpha=1.0;return m;
  }
`},translucent:false});localFacadeTemplate.destroy();
const regionalEyeFrame=Matrix4.toArray(Matrix4.IDENTITY);
export function updateRegionalFacades(frame:Matrix4){Matrix4.toArray(frame,regionalEyeFrame);}
const regionalMaterials=new Map<number,ReturnType<typeof makeRegionalMaterial>>();
function makeRegionalMaterial(ground:number){
  const value={eyeToLocal:regionalEyeFrame,ground};
  const property={isConstant:false,definitionChanged:new Event(),getType:()=>localFacadeType,getValue:(_time:unknown,result:Record<string,unknown>={})=>{Object.assign(result,value);return result;},equals:(other:unknown)=>other===property};
  return property;
}

export function regionalFacadeMaterial(ground:number){
  if(!regionalMaterials.has(ground))regionalMaterials.set(ground,makeRegionalMaterial(ground));
  return regionalMaterials.get(ground)!;
}
