// Requested production scope, distinct from the extraction/rendering buffer.
export const REGION=Object.freeze({
  id:'montemurlo-centre-1km',
  center:{lon:11.036973530040587,lat:43.927196148087795},
  radiusMetres:1000,sectorMetres:200,
  bounds:{west:11.023,south:43.9171,east:11.051,north:43.9373},
});
export function metresFromTownHall(lon,lat){
  const radians=Math.PI/180,p=REGION.center;
  const dlat=(lat-p.lat)*radians,dlon=(lon-p.lon)*radians;
  const a=Math.sin(dlat/2)**2+Math.cos(p.lat*radians)*Math.cos(lat*radians)*Math.sin(dlon/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
export const inRegion=(lon,lat)=>metresFromTownHall(lon,lat)<=REGION.radiusMetres;
