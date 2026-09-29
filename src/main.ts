import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';
import { WORLD, SIGNALS, PORTAL, toGeo, distance } from '../shared/world.mjs';
import { WorldScene } from './scene';
import { Network } from './network';
import type { Dataset, Player, Peer } from './types';

const mark=`<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 3 43 24 24 45 5 24Z" stroke="currentColor"/><path d="m24 11 12 13-12 13-12-13Z" stroke="currentColor"/><path d="M24 17v14M17 24h14" stroke="currentColor"/></svg>`;
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
  <div id="world" aria-label="Mondo 3D di Montemurlo"></div>
  <div class="vignette"></div><div class="reticle" aria-hidden="true"></div><div class="view-tools"><button id="take-control">Gioca</button><button id="journal-toggle" aria-expanded="false">Diario · J</button><span id="look-hint">Trascina per ruotare la camera · Rotella per avvicinarti</span></div>
  <header class="topbar">
    <a class="brand" href="/" aria-label="Resonance">${mark}<span>RESONANCE<small>UN’ALTRA FREQUENZA DEL MONDO</small></span></a>
    <div class="region"><span class="status-dot"></span>TOSCANA, ITALIA <b>Montemurlo</b></div>
    <button class="icon-button" id="settings-open" aria-label="Apri impostazioni e fonti">⚙</button>
  </header>
  <aside class="journal">
    <div class="eyebrow">CAPITOLO ZERO <span>01 / 01</span></div>
    <h1>Gli echi<br>di Montemurlo<span>.</span></h1>
    <p class="intro">Il mondo che conosci.<br>Qualcosa che non hai mai sentito.</p>
    <div class="rule"></div>
    <div class="quest-heading"><span class="small-diamond">◇</span><div><span class="eyebrow">LA TUA PRIMA TRACCIA</span><h2>Segui la risonanza</h2></div></div>
    <p class="quest-copy" id="quest-copy">Tre segnali attraversano il paese. Raggiungili e sintonizzati per aprire la soglia.</p>
    <ol class="objectives">${SIGNALS.map((s,i)=>`<li id="objective-${s.id}"><span class="objective-number">0${i+1}</span><div><b>${s.name}</b><small>${s.place}</small></div><span class="objective-check">○</span></li>`).join('')}</ol>
    <div class="quest-progress"><div><span id="progress-label">0 di 3 echi ritrovati</span><span id="progress-percent">0%</span></div><div class="progress-track"><i id="progress-fill"></i></div></div>
    <button id="explore" class="primary">Prendi il controllo <span>↗</span></button>
    <p class="prototype-label">PROTOTIPO ESPLORABILE · 2,1 KM²</p>
  </aside>
  <div class="compass"><span>N</span><svg viewBox="0 0 40 40" aria-hidden="true"><path d="m20 3 7 28-7-6-7 6Z" fill="currentColor"/></svg><small>43°55′ N · 11°02′ E</small></div>
  <aside class="map-panel"><div class="map-heading"><span>IL TERRITORIO</span><button id="overview" aria-label="Mostra panoramica del territorio">↗</button></div><canvas id="minimap" width="480" height="340" aria-label="Mappa di Montemurlo con giocatore e segnali"></canvas><div class="map-footer"><span><i></i>Tu sei qui</span><span id="nearby">In connessione…</span></div></aside>
  <div class="source-status" id="source-status"><span class="source-dot"></span><span id="source-label">Preparazione del territorio…</span><button id="source-open">Fonti ↗</button></div>
  <div class="interaction hidden" id="interaction"><span class="interaction-rune">◇</span><div><small id="interaction-type">SEGNALE RILEVATO</small><b id="interaction-title">Il primo eco</b></div><button id="interact" aria-label="Interagisci"><kbd>E</kbd> Sintonizzati</button></div>
  <footer class="bottom"><div class="controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Muoviti</span><span><kbd>⇧</kbd> Corri</span><span><kbd>E</kbd> Interagisci</span><span><kbd>M</kbd> Mappa / personaggio</span></div><span class="connection"><i id="connection-dot"></i><span id="connection-label">Connessione…</span></span></footer>
  <div class="toast hidden" id="toast" role="status" aria-live="polite"></div>
  <div class="selection hidden" id="selection"><button id="selection-close" aria-label="Chiudi dettagli">×</button><span class="eyebrow">NEL TERRITORIO</span><h3 id="selection-name"></h3><p id="selection-copy"></p></div>
  <div class="loading" id="loading"><div class="loading-mark">${mark}</div><span>ASCOLTA IL MONDO</span><p>Preparazione di Montemurlo…</p></div>
  <dialog id="settings"><form method="dialog"><button class="dialog-close" aria-label="Chiudi impostazioni">×</button></form><span class="eyebrow">IL MONDO DI RESONANCE</span><h2>Dalla Terra al gioco.</h2><p>La geografia arriva da dati già disponibili. Nessuna fotogrammetria da realizzare.</p><div class="source-item"><span>01</span><div><b>Estratto locale di Montemurlo</b><p id="dataset-details">Sagome, strade e aree verdi OpenStreetMap. Altezze in parte stimate. Il rilievo del centro è descritto nelle fonti sottostanti.</p></div><span class="source-badge">PRONTO</span></div><div class="source-item"><span>02</span><div><b>Terreno ed edifici in streaming</b><p>Cesium World Terrain e Cesium OSM Buildings vengono caricati direttamente dal servizio mentre esplori. Serve un token del tuo account.</p></div></div><form id="token-form"><label for="ion-token">Token pubblico di Cesium ion</label><input id="ion-token" type="password" autocomplete="off" placeholder="Incolla qui il token di sola lettura"/><p class="form-note">Resta solo in questa scheda del browser. Per una configurazione permanente usa il file .env.local. Limita il token agli asset e agli URL del progetto.</p><div class="form-buttons"><button class="primary" type="submit">Collega lo streaming <span>↗</span></button><button class="secondary" id="clear-token" type="button">Usa estratto locale</button></div><p id="token-feedback" role="status"></p></form><p class="form-note">Campione del centro: municipio, quattro case affacciate sulla piazza, colonnato e sedute circolari. Ricostruzione interpretativa da riferimenti pubblici; altezze e dettagli stimati. <a href="/models/civic/SOURCES.md" target="_blank">Riferimenti e limiti ↗</a></p><label class="quality-option"><input id="smooth-edges" type="checkbox" checked/> Bordi più morbidi</label><p class="form-note">Filtro leggero per strade ed edifici. Puoi disattivarlo per confrontare la fluidità.</p><p id="performance" class="form-note">Misurazione della fluidità…</p><p class="form-note">Personaggio: RobotExpressive di Quaternius, adattamento Don McCurdy · CC0 · altezza di riferimento 1,75 m. <a href="/models/robot/SOURCE.md" target="_blank">Crediti del modello ↗</a></p><div class="credits"><a href="https://ion.cesium.com/tokens" target="_blank" rel="noopener noreferrer">Crea un token Cesium ↗</a><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL ↗</a><a href="/data/montemurlo.json" target="_blank">Scarica il database geografico ↗</a></div><p class="form-note">Portali, segnali e camera della risonanza sono luoghi di fantasia. Multiplayer sperimentale, massimo 32 connessioni; progressi validi solo finché resti connesso. Le collisioni usano l’estratto locale e possono differire dagli edifici Cesium.</p></dialog>
`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
// Retire comparison links as well as buttons: every visit uses the approved scene.
const currentUrl=new URL(location.href);
for(const key of ['facciata','piazza','vista'])currentUrl.searchParams.delete(key);
if(currentUrl.href!==location.href)history.replaceState(null,'',currentUrl);
{
  const credit=document.createElement('a');credit.className='photo-credit';credit.href='/models/civic/photo-study/SOURCES.md';credit.target='_blank';credit.rel='noopener';
  credit.textContent='Facciata: foto M. Galardi · CC BY-SA 3.0 · adattamento IA';app.append(credit);
  const note=document.createElement('p');note.className='form-note';note.innerHTML='Municipio con facciata fotografica: foto Wikimedia Commons del 2011 di Massimiliano Galardi, raddrizzate e ricostruite con IA. Fianchi e retro interpretativi. Finestre e cornici sono nella texture; balconi e tetto restano 3D. <a href="/models/civic/photo-study/SOURCES.md" target="_blank">Foto originali, licenza e limiti ↗</a>';$('settings').append(note);
}
const republicNote=document.createElement('p');republicNote.className='form-note';republicNote.innerHTML='Piazza del municipio: pavimentazione, aiuole, tigli, sedute bianche, fioriere e monumento ispirati alla sistemazione del 2023. Posizioni e misure degli arredi stimate; statua semplificata. <a href="/models/civic/REPUBLIC.md" target="_blank">Riferimenti della piazza ↗</a>';$('settings').append(republicNote);
const terrainNote=document.createElement('p');terrainNote.className='form-note';terrainNote.innerHTML='Raggio esplorabile: 1 km dal municipio (3,14 km²). Base regionale: LiDAR 2008–2010 a 1 m e ortofoto 2024/2025, CC BY 4.0. Altezze ordinarie stimate anche dal DSM 2021; facciate fuori dal campione ancora generiche. Allineamento verticale EGM96 approssimato. Scalinate e accessi del municipio conservati; gli altri settori restano da verificare a terra. <a href="/data/terrain/SOURCES.md" target="_blank">Fonti e limiti ↗</a>';$('settings').append(terrainNote);
const settings=$<HTMLDialogElement>('settings');
$('settings-open').onclick=() => settings.showModal();$('source-open').onclick=()=>settings.showModal();
settings.addEventListener('click',e=>{if(e.target===settings){const r=settings.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settings.close();}});
$('selection-close').onclick=()=>$('selection').classList.add('hidden');
const tokenOverride=sessionStorage.getItem('resonance-ion-token');
const useLocal=sessionStorage.getItem('resonance-local')==='yes';
const token=useLocal?'':tokenOverride||import.meta.env.VITE_CESIUM_ION_TOKEN||'';
$('token-form').onsubmit=e=>{e.preventDefault();const value=$<HTMLInputElement>('ion-token').value.trim();if(value.length<20){$('token-feedback').textContent='Inserisci un token Cesium ion valido.';return;}sessionStorage.setItem('resonance-ion-token',value);sessionStorage.removeItem('resonance-local');location.reload();};
$('clear-token').onclick=()=>{sessionStorage.removeItem('resonance-ion-token');sessionStorage.setItem('resonance-local','yes');location.reload();};
let toastTimer:ReturnType<typeof setTimeout>;
function toast(text:string){$('toast').textContent=text;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),6000);}

async function start(){
  const response=await fetch('/data/montemurlo.json');if(!response.ok)throw Error('Estratto geografico non disponibile.');
  const data:Dataset=await response.json();
  $('dataset-details').textContent=`${data.buildings.length.toLocaleString('it')} sagome di edifici, strade e aree verdi. Estratto del ${data.retrieved}. Altezze degli edifici in parte stimate. Il terreno regionale del centro viene applicato con lo streaming.`;
  const scene=new WorldScene('world',data,Boolean(token));
  scene.onPerformance=text=>{$('performance').textContent=text;};
  scene.onSelect=(name,description)=>{$('selection-name').textContent=name;$('selection-copy').textContent=description;$('selection').classList.remove('hidden');};
  scene.onSource=(state,detail)=>{
    $('source-status').dataset.state=state;
    $('source-label').textContent=state==='live'?(detail.startsWith('DTM')?'Terreno locale + streaming':'Terreno + edifici in streaming'):state==='loading'?'Connessione a Cesium…':state==='local'?'OSM locale · terreno piatto':state==='error'?'Rendering non disponibile':state==='unavailable'?'Streaming non disponibile · OSM locale':'Streaming parziale · verifica fonti';
    $('source-status').title=detail;$('token-feedback').textContent=detail;
    if(state==='partial'||state==='error'||state==='unavailable')toast(detail);
  };
  void scene.connectStreaming(token).catch(error=>{console.error('Terrain initialization: '+String(error)+'\n'+error?.stack);scene.onSource('error','Errore durante il caricamento del terreno.');}).finally(()=>{$('loading').classList.add('hidden');});
  const toggleMap=()=>{if(scene.isFollowing)scene.overview();else scene.explore();};
  const toggleJournal=()=>{const open=document.body.classList.toggle('journal-open');$('journal-toggle').setAttribute('aria-expanded',String(open));};
  scene.onMode=thirdPerson=>{document.body.classList.toggle('third-person',thirdPerson);$('selection').classList.add('hidden');$('overview').setAttribute('aria-label',thirdPerson?'Mostra mappa del territorio':'Segui il personaggio');};
  scene.onCapture=captured=>{document.body.classList.toggle('mouse-captured',captured);$('look-hint').textContent=captured?'Mouse per ruotare · Rotella per avvicinarti · Esc libera il cursore':'Trascina per ruotare la camera · Rotella per avvicinarti';};
  $('explore').onclick=$('take-control').onclick=()=>{document.body.classList.remove('journal-open');$('journal-toggle').setAttribute('aria-expanded','false');scene.captureMouse();};
  $('journal-toggle').onclick=toggleJournal;
  $('overview').onclick=toggleMap;
  $('smooth-edges').onchange=()=>scene.setEdgeSmoothing($<HTMLInputElement>('smooth-edges').checked);
  scene.explore();
  const network=new Network();let connected=false;let player:Player|undefined;let peers:Peer[]=[];
  const keys=new Set<string>();
  const minimap=$<HTMLCanvasElement>('minimap'),ctx=minimap.getContext('2d')!;
  const mapBase=document.createElement('canvas');mapBase.width=minimap.width;mapBase.height=minimap.height;
  const m=mapBase.getContext('2d')!;
  const b=WORLD.bounds;
  const project=(lon:number,lat:number)=>[(lon-b.west)/(b.east-b.west)*minimap.width,(b.north-lat)/(b.north-b.south)*minimap.height];
  m.fillStyle='#233a37';m.fillRect(0,0,mapBase.width,mapBase.height);
  for(const building of data.buildings){m.beginPath();building.rings[0].forEach(([lon,lat],i)=>{const [x,y]=project(lon,lat);i?m.lineTo(x,y):m.moveTo(x,y);});m.fillStyle='#60716a';m.fill();}
  for(const road of data.roads){m.beginPath();road.coordinates.forEach(([lon,lat],i)=>{const [x,y]=project(lon,lat);i?m.lineTo(x,y):m.moveTo(x,y);});m.strokeStyle='#89958a';m.lineWidth=1;m.stroke();}
  function drawMap(){
    ctx.drawImage(mapBase,0,0);
    for(const s of SIGNALS){const [x,y]=project(s.lon,s.lat);ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle=player?.signals.includes(s.id)?'#9ce7c2':'#e5c780';ctx.fill();}
    for(const p of peers){const geo=toGeo(p.x,p.y),[x,y]=project(geo.lon,geo.lat);ctx.beginPath();ctx.arc(x,y,p.id===player?.id?5:3,0,Math.PI*2);ctx.fillStyle=p.id===player?.id?'#f3f5de':'#94c9ef';ctx.fill();ctx.strokeStyle='#1e3832';ctx.lineWidth=2;ctx.stroke();}
  }
  network.onStatus=online=>{connected=online;$('connection-dot').classList.toggle('online',online);$('connection-label').textContent=online?'Connesso all’istanza':'Server non raggiungibile';if(!online){keys.clear();$('interaction').classList.add('hidden');$('nearby').textContent='Offline';}};
  network.onNotice=toast;
  let questKey='',interactionKey='',lastPopulation=-1,lastMapAt=0;
  network.onState=(self,others,population)=>{
    player=self;peers=others;scene.setState(self,others);
    if(population!==lastPopulation){$('nearby').textContent=`${population} ${population===1?'viandante':'viandanti'}`;lastPopulation=population;}
    const nextQuest=`${self.room}:${self.completed}:${self.signals.join(',')}`;
    if(nextQuest!==questKey){questKey=nextQuest;
    for(const s of SIGNALS){const done=self.signals.includes(s.id);$('objective-'+s.id).classList.toggle('done',done);$('objective-'+s.id).querySelector('.objective-check')!.textContent=done?'✓':'○';}
    const progress=Math.round(self.signals.length/3*100);
    $('progress-label').textContent=self.completed?'Prima risonanza completata':`${self.signals.length} di 3 echi ritrovati`;$('progress-percent').textContent=progress+'%';$('progress-fill').style.width=progress+'%';
    $('quest-copy').textContent=self.completed?'Hai ricomposto l’accordo. Torna alla soglia luminosa per uscire e continua a esplorare.':self.room==='chamber'?'Raggiungi il cristallo al centro della camera e premi E.':self.signals.length===3?'L’accordo è completo. Torna alla soglia in Piazza della Libertà e premi E.':'Tre segnali attraversano il paese. Raggiungili e sintonizzati per aprire la soglia.';
    }
    let title='',type='',action='Sintonizzati';
    if(self.room==='chamber'){title=distance(self,{x:0,y:0})<4?'Il cuore della risonanza':'La soglia luminosa';type='CAMERA DELLA RISONANZA';action=distance(self,{x:0,y:0})<4?'Attiva':'Interagisci';}
    else {const signal=SIGNALS.find(s=>!self.signals.includes(s.id)&&distance(self,s)<WORLD.interactionRadius);if(signal){title=signal.name;type='SEGNALE RILEVATO';}else if(distance(self,PORTAL)<10){title=self.signals.length===3?'Attraversa la soglia':'Una soglia silenziosa';type='PASSAGGIO';action='Interagisci';}}
    const nextInteraction=`${connected}:${title}:${type}:${action}`;
    if(nextInteraction!==interactionKey){interactionKey=nextInteraction;
    $('interaction').classList.toggle('hidden',!title||!connected);
    $('interaction-title').textContent=title;$('interaction-type').textContent=type;$('interact').innerHTML=`<kbd>E</kbd> ${action}`;
    }
    if(performance.now()-lastMapAt>100){drawMap();lastMapAt=performance.now();}
  };
  const interact=()=>{if(connected)network.send({type:'interact'});else toast('Avvia il server del prototipo per esplorare e interagire.');};
  $('interact').onclick=interact;
  window.addEventListener('keydown',e=>{
    if(settings.open||!$('loading').classList.contains('hidden')||e.target instanceof HTMLInputElement)return;
    const key=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e','m','j'].includes(key))e.preventDefault();
    if(!e.repeat&&key==='e')interact();if(!e.repeat&&key==='m')toggleMap();if(!e.repeat&&key==='j')toggleJournal();
    keys.add(key);
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)&&!scene.isFollowing)scene.explore();
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  const resetInput=()=>{keys.clear();network.send({type:'input',x:0,y:0,run:false});};
  window.addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();});settings.addEventListener('close',resetInput);
  document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)resetInput();});
  const openSettings=()=>{resetInput();if(document.pointerLockElement)document.exitPointerLock();settings.showModal();};
  $('settings-open').onclick=$('source-open').onclick=openSettings;
  const inputTimer=setInterval(()=>{
    const active=!settings.open&&!document.hidden;
    const held=(...values:string[])=>active&&values.some(v=>keys.has(v));
    if(scene.isFollowing)scene.turn((Number(held('arrowright'))-Number(held('arrowleft')))*.055,(Number(held('arrowup'))-Number(held('arrowdown')))*.035);
    const movement=scene.movement(Number(held('d'))-Number(held('a')),Number(held('w'))-Number(held('s')));
    network.send({type:'input',...movement,run:held('shift')});
  },50);
  network.connect();drawMap();
  window.addEventListener('beforeunload',()=>{clearInterval(inputTimer);network.close();scene.destroy();});
}
start().catch(error=>{console.error(error);$('loading').innerHTML='<span>IL MONDO NON È DISPONIBILE</span><p></p><button class="primary" id="reload">Riprova</button>';$('loading').querySelector('p')!.textContent=error instanceof Error?error.message:'Errore di inizializzazione';$('reload').onclick=()=>location.reload();});
