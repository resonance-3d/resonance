// Piazza della Repubblica / Donatori di Sangue. Visual estimates, metres in civic axes.
// OSM fixes the streets and garden footprints; furniture is interpreted from 2023 photos.
export const REPUBLIC_PAVING=[[-61.8,-38.4],[-3,-40.4],[40,-40.4],[40,-51.5],[33,-55],[25,-58],[21,-64],[20.5,-72],[23,-79],[28,-84],[32,-87],[32,-92],[-10.8,-92],[-14.8,-80],[-18,-71],[-24,-64],[-34,-58],[-61.8,-50.4]];
export const REPUBLIC_TREES=[[0,-60],[8,-66],[16,-72]];
export const REPUBLIC_BOWLS=[[23,-58],[20.5,-62.5],[20.8,-78],[24,-82],[27,-85]];
// [a,b,angle radians]. Long bench dimension follows local a when angle=0.
export const REPUBLIC_BENCHES=[[-3.8,-61,0],[4.2,-67,0],[12.2,-73,0],[-6.6,-86,0],[-2.8,-86,0],[-12,-73,Math.PI/2],[-11,-84,Math.PI/2],[2,-54.7,0],[33,-54.6,0]];
export const REPUBLIC_LIGHTS=[[-9,-58],[-10,-77],[20,-88],[28,-55]];
export const REPUBLIC_MONUMENT=[-2,-78];
export const REPUBLIC_GARDENS=['way/369627866','way/369627868','way/369627869'];
export function republicBlocked(a,b){
  if(REPUBLIC_TREES.some(([x,y])=>Math.hypot(a-x,b-y)<2.02))return true;
  if(REPUBLIC_BOWLS.some(([x,y])=>Math.hypot(a-x,b-y)<.83))return true;
  if(REPUBLIC_LIGHTS.some(([x,y])=>Math.hypot(a-x,b-y)<.16))return true;
  if(Math.abs(a-REPUBLIC_MONUMENT[0])<2&&Math.abs(b-REPUBLIC_MONUMENT[1])<2)return true;
  return REPUBLIC_BENCHES.some(([x,y,t])=>{
    const u=(a-x)*Math.cos(t)+(b-y)*Math.sin(t),v=-(a-x)*Math.sin(t)+(b-y)*Math.cos(t);
    return Math.abs(u)<1.12&&Math.abs(v)<.29;
  });
}
