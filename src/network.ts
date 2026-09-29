import type { Player, Peer } from './types';
export class Network {
  socket?:WebSocket;
  onState:(self:Player,peers:Peer[],population:number)=>void=()=>{};
  onNotice:(message:string)=>void=()=>{};
  onStatus:(connected:boolean)=>void=()=>{};
  private retry?:ReturnType<typeof setTimeout>;
  private stopped=false;
  connect(){
    const endpoint=import.meta.env.VITE_WS_URL || `${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`;
    this.socket=new WebSocket(endpoint);
    this.socket.onopen=()=>this.onStatus(true);
    this.socket.onmessage=event=>{try{const data=JSON.parse(event.data);if(data.type==='state')this.onState(data.self,data.players,data.population);if(data.type==='notice')this.onNotice(data.text);}catch{/* Ignore malformed transport messages. */}};
    this.socket.onclose=()=>{this.onStatus(false);if(!this.stopped)this.retry=setTimeout(()=>this.connect(),3000);};
    this.socket.onerror=()=>this.socket?.close();
  }
  send(data:unknown){if(this.socket?.readyState===WebSocket.OPEN&&this.socket.bufferedAmount<32768)this.socket.send(JSON.stringify(data));}
  close(){this.stopped=true;clearTimeout(this.retry);this.socket?.close();}
}
