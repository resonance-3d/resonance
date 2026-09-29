import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { WORLD, createCollisionIndex, validInput, stepPlayer, interact, distance } from '../shared/world.mjs';

import { civicBlocked } from '../shared/civic.mjs';
import { SPAWN } from '../shared/spawn.mjs';
import { createElevation } from '../shared/elevation.mjs';

export async function createGameServer({ port=8787, host='127.0.0.1' }={}) {
  const dataset=JSON.parse(await readFile(new URL('../public/data/montemurlo.json',import.meta.url),'utf8'));
  const terrainMeta=JSON.parse(await readFile(new URL('../public/data/terrain/montemurlo-dtm.json',import.meta.url),'utf8'));
  const terrain=createElevation(terrainMeta,await readFile(new URL('../public/data/terrain/montemurlo-dtm.bin',import.meta.url)));
  const buildingsBlocked=createCollisionIndex(dataset.buildings);
  const blocked=(x,y)=>buildingsBlocked(x,y)||civicBlocked(x,y)||terrain.stairs.blocked(x,y)||terrain.frontage.blocked(x,y);
  const players=new Map();
  const publicRoot=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm','.jpg':'image/jpeg','.md':'text/plain'};
  const http=createServer(async(req,res)=>{
    if(req.url==='/api/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,players:players.size,region:WORLD.id}));return;}
    try {
      const path=resolve(publicRoot,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(path!==publicRoot&&!path.startsWith(publicRoot+sep)){res.writeHead(403);res.end();return;}
      const file=path===publicRoot?resolve(publicRoot,'index.html'):path;
      const info=await stat(file);if(!info.isFile())throw Error('not a file');
      res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));
    }catch{res.writeHead(404);res.end('Avvia il client con npm run dev oppure genera dist con npm run build.');}
  });
  const wss=new WebSocketServer({server:http,path:'/ws',maxPayload:2048});
  const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<128*1024)ws.send(JSON.stringify(data));};
  wss.on('connection',(ws,request)=>{
    // Local prototype: same-origin browser connections. No accounts or durable persistence yet.
    const origin=request.headers.origin;
    if(origin){try{if(new URL(origin).host!==request.headers.host){ws.close(1008,'Origin non consentita');return;}}catch{ws.close(1008);return;}}
    if(players.size>=32){ws.close(1013,'Istanza piena');return;}
    const id=randomUUID();
    const player={id,name:'Viandante '+id.slice(0,4),...SPAWN,room:'world',signals:[],completed:false};
    const session={ws,player,input:{type:'input',x:0,y:0,run:false},lastInput:0,lastInteraction:0,bucket:0,bucketAt:Date.now(),alive:true};
    players.set(id,session);send(ws,{type:'welcome',id});
    ws.on('pong',()=>{session.alive=true;});
    ws.on('message',raw=>{
      const now=Date.now();if(now-session.bucketAt>1000){session.bucket=0;session.bucketAt=now;}
      if(++session.bucket>90){ws.close(1008,'Troppi messaggi');return;}
      let message;try{message=JSON.parse(raw.toString());}catch{return;}
      if(validInput(message)){session.input=message;session.lastInput=now;}
      else if(message?.type==='interact'&&now-session.lastInteraction>400){session.lastInteraction=now;send(ws,{type:'notice',text:interact(player)});}
    });
    ws.on('close',()=>players.delete(id)); ws.on('error',()=>ws.close());
  });
  const timer=setInterval(()=>{
    for(const session of players.values())if(Date.now()-session.lastInput<350)stepPlayer(session.player,session.input,1/WORLD.tickRate,blocked,terrain.canTraverse);
    for(const session of players.values()) {
      const nearby=[...players.values()].map(s=>s.player).filter(p=>p.room===session.player.room&&distance(p,session.player)<350).map(({id,name,x,y,room})=>({id,name,x,y,room}));
      send(session.ws,{type:'state',self:session.player,players:nearby,population:players.size});
    }
  },1000/WORLD.tickRate);
  const heartbeat=setInterval(()=>{for(const s of players.values()){if(!s.alive){s.ws.terminate();continue;}s.alive=false;s.ws.ping();}},15000);
  try { await new Promise((yes,no)=>{http.once('error',no);http.listen(port,host,yes);}); }
  catch(error) { clearInterval(timer); clearInterval(heartbeat); wss.close(); throw error; }
  return {port:http.address().port,close:async()=>{clearInterval(timer);clearInterval(heartbeat);for(const s of players.values())s.ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>http.close(r));}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=await createGameServer({port:Number(process.env.PORT??8787),host:process.env.HOST??'127.0.0.1'});
  console.log(`Resonance server: http://127.0.0.1:${server.port}`);
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close().then(()=>process.exit(0)));
}
