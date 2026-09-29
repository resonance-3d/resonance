import { civicPoint, AX, AY } from './civic.mjs';

// Clear pedestrian space in front of the municipal entrance, facing the facade.
export const SPAWN=Object.freeze(civicPoint(13.75,-59));
export const SPAWN_HEADING=Math.atan2(-AY,AX);
