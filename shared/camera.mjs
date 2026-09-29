// Metres, clockwise heading from north; elevation is measured down from the horizon.
export const CHARACTER_HEIGHT=1.75;
export function clampOrbitPitch(pitch){return Math.max(-1.1,Math.min(-.08,pitch));}
export function orbitOffset(heading,pitch,distance){
  const horizontal=Math.cos(pitch)*distance;
  return {x:-Math.sin(heading)*horizontal,y:-Math.cos(heading)*horizontal,z:1.15-Math.sin(pitch)*distance};
}
// Shorten the camera boom against the same conservative footprints used by movement.
export function clearCameraDistance(x,y,heading,pitch,requested,blocked){
  const direction=orbitOffset(heading,pitch,1);
  for(let d=.5;d<=requested+.2;d+=.2){
    const px=x+direction.x*d,py=y+direction.y*d;
    if([[0,0],[.2,0],[-.2,0],[0,.2],[0,-.2]].some(([a,b])=>blocked(px+a,py+b)))return Math.max(.35,d-.3);
  }
  return requested;
}
export function locomotion(speed){return speed<.15?'Idle':speed>3.5?'Running':'Walking';}
