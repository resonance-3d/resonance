export type Coordinate = [number,number];
export interface Building {id:string;name:string;kind:string;height:number;heightEstimated:boolean;rings:Coordinate[][]}
export interface Dataset {attribution:string;retrieved:string;buildings:Building[];roads:{id:string;name:string;kind:string;coordinates:Coordinate[]}[];areas:{id:string;kind:string;coordinates:Coordinate[]}[]}
export interface Player {id:string;name:string;x:number;y:number;room:string;signals:string[];completed:boolean}
export interface Peer {id:string;name:string;x:number;y:number;room:string}
