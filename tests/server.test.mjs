import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { SPAWN } from '../shared/spawn.mjs';
import { createGameServer } from '../server/index.mjs';

function client(port){
 const socket=new WebSocket(`ws://127.0.0.1:${port}/ws`);const messages=[];socket.on('message',raw=>messages.push(JSON.parse(raw)));
 return {socket,messages,wait:async predicate=>{
  const end=Date.now()+3000;while(Date.now()<end){const found=messages.find(predicate);if(found)return found;await new Promise(r=>setTimeout(r,10));}throw Error('Timed out waiting for game state');
 }};
}
test('two clients see each other; server validates movement and interactions',async()=>{
 const game=await createGameServer({port:0});const a=client(game.port),b=client(game.port);
 try{
  const first=await a.wait(m=>m.type==='state'&&m.population===2);await b.wait(m=>m.type==='state'&&m.players.length===2);
  assert.equal(first.self.signals.length,0);
  a.socket.send(JSON.stringify({type:'position',x:9999,y:9999}));
  a.socket.send(JSON.stringify({type:'input',x:500,y:0,run:true}));
  a.socket.send(JSON.stringify({type:'interact'}));
  await a.wait(m=>m.type==='notice');
  a.messages.length=0;
  const state=await a.wait(m=>m.type==='state');
  assert.equal(state.self.signals.length,0,'the square spawn is outside signal range');
  assert.equal(state.self.x,SPAWN.x);assert.equal(state.self.y,SPAWN.y);
  a.socket.send(JSON.stringify({type:'input',x:1,y:0,run:false}));
  const moved=await a.wait(m=>m.type==='state'&&m.self.x>SPAWN.x);assert.ok(moved.self.x<=SPAWN.x+.5);
  const other=await b.wait(m=>m.type==='state'&&m.players.some(p=>p.id===moved.self.id&&p.x>SPAWN.x));assert.equal(other.players.length,2);
  a.socket.close();await b.wait(m=>m.type==='state'&&m.population===1&&m.players.length===1);
 }finally{a.socket.terminate();b.socket.terminate();await game.close();}
});
test('cross-origin browser connection is rejected',async()=>{
 const game=await createGameServer({port:0});
 try{const socket=new WebSocket(`ws://127.0.0.1:${game.port}/ws`,{origin:'https://unrelated.example'});const code=await new Promise((resolve,reject)=>{socket.on('close',resolve);socket.on('error',reject);});assert.equal(code,1008);}finally{await game.close();}
});

// Regression: normalise the static root before checking containment (trailing slash).
import { existsSync } from 'node:fs';
test('production serves the app and real Cesium JSON assets', {skip:!existsSync(new URL('../dist/index.html',import.meta.url))}, async()=>{
 const game=await createGameServer({port:0});
 try{
  const base=`http://127.0.0.1:${game.port}`;
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/<title>Resonance/);
  for(const path of ['/data/montemurlo.json','/cesium/Assets/approximateTerrainHeights.json']){
   const response=await fetch(base+path);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/application\/json/);assert.ok(await response.json());
  }
 }finally{await game.close();}
});
