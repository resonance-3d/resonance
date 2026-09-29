# Resonance — Montemurlo

Primo prototipo esplorabile di un RPG ambientato in una reinterpretazione della Terra.
Area attuale: raggio di 1 km dal municipio di Montemurlo, circa 3,142 km². Base geografica ampliata; ricostruzione dettagliata ancora parziale nel centro.

Direttive permanenti: [WORLD_RECONSTRUCTION.md](docs/WORLD_RECONSTRUCTION.md). [Inventario](docs/world-production/INVENTORY.md) e [misurazioni](docs/world-production/runs/2026-09-24-centre-1km.json). Con il server avviato, atlante separato dalla demo: http://127.0.0.1:5173/data/world/atlas.html.

## Avvio

Il repository contiene codice, documentazione, test e asset necessari alla demo.
Token, dipendenze installate, build, archivi ZIP originali dei rilievi e alcuni
intermedi rigenerabili restano esclusi da Git. Per rieseguire gli script di ricerca
altimetrica occorre recuperare gli input indicati nei documenti delle fonti.
Le licenze dei dati e dei modelli sono riportate nei rispettivi file `SOURCES.md`,
`SOURCE.md` e `LICENSE.md`; la scelta della licenza del codice è ancora da formalizzare.

Richiede Node.js 22.12+ (verificato con Node.js 24).

```sh
npm install
npm run dev
```

Apri http://127.0.0.1:5173. Il comando avvia il client e il server multiplayer locale.
Apri una seconda scheda per vedere un altro viandante. Non serve una GPU sul server.

- **Prendi il controllo**: attiva il mouse libero per guardarti intorno; **Esc** restituisce il cursore.
- **WASD**: movimento rispetto alla camera (W = avanti).
- **Frecce / trascinamento del mouse**: ruota la camera anche senza catturare il cursore.
- **Rotella**: regola la distanza dal personaggio.
- **Shift**: corsa.
- **E**: raccogli un segnale o attraversa una soglia vicina.
- **M**: alterna mappa e terza persona; muoversi riporta al personaggio.
- **J**: apri/chiudi il diario.
- **Mouse / rotella**: esplora la panoramica; clic su un edificio per i dettagli.
- Raccogli i tre echi, torna alla soglia vicino alla partenza, entra nella camera,
  raggiungi il cristallo centrale e premi E. Per uscire torna alla soglia luminosa.

La prova è pensata per computer con tastiera e WebGL. L'interfaccia si adatta a
schermi piccoli, ma i controlli touch di movimento non sono ancora implementati.

## Dati geografici: non occorre fare fotogrammetria

La demo mantiene un solo ambiente e la vista in terza persona. La configurazione ordinaria
combina il DTM regionale 2008–2010 a 1 m, ortofoto regionali 2024/2025 servite localmente,
Cesium World Terrain all'esterno e geometrie OSM. Senza token resta un fallback locale piatto.

L'estratto comprende 1.693 sagome, 743 percorsi e 170 aree nel rettangolo con margine;
1.278 sagome intersecano il cerchio richiesto. Le altezze ordinarie usano, dove possibile,
stime dal DSM regionale 2021, conservando dati OSM espliciti e cinque modelli civici approvati.
Le altre facciate sono generiche e i tetti ancora piani: questa base non è una ricostruzione
fotografica completa. Fonti, licenze e limiti: [SOURCES](public/data/world/SOURCES.md).

Il JSON e il raster locale sono caricati interamente; le porzioni del terreno e le immagini
seguono livelli di dettaglio. Il prototipo non dimostra lo streaming globale dei contenuti locali.
Client e server condividono quote e gradini degli accessi già ricostruiti. Sagome e arredi
hanno collisioni; pendenze e scalinate modellate sono percorribili. Ponti, sottopassi e tutte
le ulteriori scale del territorio non sono ancora ricostruiti sistematicamente.

## Collegare Cesium

Crea un account su https://ion.cesium.com e abilita gli asset **Cesium World Terrain**
e **Cesium OSM Buildings**. Crea un token per il browser con accesso in sola lettura
agli asset necessari. Limita gli URL consentiti a quelli del progetto, includendo
http://127.0.0.1:5173 durante lo sviluppo. Non usare token amministrativi.

Puoi inserire il token nell'app tramite **Impostazioni → Collega lo streaming**:
resta nella sessionStorage della scheda e viene inviato direttamente a Cesium.
Il server del gioco non lo riceve. Non occorre inviarlo in chat.

In alternativa, copia `.env.example` in `.env.local` e imposta:

```dotenv
VITE_CESIUM_ION_TOKEN=il_tuo_token_browser
```

Riavvia `npm run dev`. Le variabili `VITE_*` entrano nel client: questo deve essere
un token pubblico limitato, non una credenziale segreta. `.env.local` è ignorato da Git.
Il pulsante **Usa estratto locale** forza la modalità locale per la scheda; per tornare
allo streaming inserisci nuovamente il token nell'interfaccia o chiudi quella scheda.

Non vengono usati token dimostrativi della libreria, chiavi di terzi o Google Photorealistic Tiles. Le ortofoto regionali locali sono distribuite con attribuzione CC BY 4.0. Terreno ed edifici vengono richiesti in
modo indipendente e gli errori indicano quale servizio non è disponibile. Non
vengono ripubblicati i contenuti Cesium nell'object storage del gioco.

## Cosa è implementato

- Scena CesiumJS, TypeScript e Vite, con asset/worker serviti localmente.
- Geografia reale, minimappa, selezione degli edifici dalla mappa.
- Terza persona con camera orbitale, zoom e arretramento limitato dalle sagome OSM.
- RobotExpressive CC0 già animato: Idle, Walking, Running; scala di riferimento 1,75 m.
- Movimento a 2,4 m/s, corsa a 5,5 m/s; rotazione verso il movimento e quota interpolata.
- Primo trattamento contemporaneo inquietante: facciate procedurali sui tile Cesium,
  superfici di asfalto/pavimentazione, bordi stradali, lampioni e anomalie di fantasia.
- Tre segnali immaginari, progressione della missione, portale e interno 3D condiviso.
- Server Node.js/WebSocket autorevole sul movimento planare e sulle interazioni.
- Passo fisso a 20 Hz, velocità limitata, collisioni da sagome con cortili, confini.
- Invio dei soli giocatori nella stessa stanza e a meno di 350 metri.
- Massimo 32 connessioni per processo, heartbeat, timeout input e limiti messaggi.
- Sincronizzazione dei giocatori e interpolazione del personaggio locale.
- Attribuzione OSM e download del database derivato.

Non sono ancora implementati combattimento, NPC, inventario, account, salvataggi,
riconnessione con recupero dei progressi, client prediction, navmesh, collisioni 3D,
facciate con geometria dettagliata, regioni multiple, hosting pubblico e analisi delle prestazioni
su macchine minime. La sessione riparte dalla piazza a ogni riconnessione. La stanza
interna è condivisa da tutti i giocatori che la raggiungono; non ci sono ancora gruppi.
Il limite 32 è una protezione configurata, non una capacità certificata da un load test.

Questa prova verifica dati, esplorazione e architettura minima. Non è la demo commerciale
completa descritta nella valutazione di fattibilità. CesiumJS viene usato come renderer
unico per ridurre l'incertezza sui dati già serviti; l'adozione di Babylon.js rimane una
decisione successiva, da valutare con personaggi, combattimento e direzione artistica.

## Direzione artistica attuale

Priorità: esterni realistici e riconoscibili dagli abitanti. Medievale e futuristico
sono alternative future annotate, non ancora scelte. Valutazione di Street View,
vincoli Google SEE e alternativa Mapillary in `docs/ART_DIRECTION.md`.

## Primo trattamento dell’ambiente

Gli edifici Cesium ricevono intonaco, zoccolatura, finestre e coperture tramite uno
shader: sono dettagli visivi inventati, senza nuovi volumi, porte o interni percorribili.
Il riferimento dei piani è comune alla zona: su forti pendenze le finestre possono
non coincidere con i piani reali. Il fallback locale conserva facciate semplici.
Strade e piazza usano motivi ripetuti generati nel client e larghezze convenzionali.
I lampioni sono decorativi: non proiettano luci locali dinamiche e non hanno collisioni.
Questa è una prima prova di scala e atmosfera; vegetazione 3D, marciapiedi in volume,
porte, infissi e oggetti interattivi richiedono un successivo campione curato della piazza.

## Fluidità

Gli aggiornamenti di camera e modello sono sincronizzati con il rendering Cesium.
I materiali stradali sono condivisi per favorire il batching; gli edifici locali
vengono costruiti solo quando serve il fallback. L’interfaccia cambia quando cambia
il contenuto, la minimappa si aggiorna al massimo 10 volte al secondo. Il rendering
3D è limitato a 1600 × 900 pixel (l’interfaccia mantiene la risoluzione dello schermo).
Quota dal terreno caricato e campioni dettagliati al massimo ogni 1,5 s dopo 8 m;
interpolazione verticale per attenuare i salti di livello di dettaglio.

Nelle impostazioni sono visibili FPS e 95° percentile del tempo tra fotogrammi su
finestre di 2 s. Sono una misura locale, non una garanzia su hardware diversi.
Caricamento di tile e compilazione iniziale possono ancora causare scatti. Collisioni
planari, mancanza di predizione del client e differenze tra i dataset restano limiti.

## Verifiche e build

```sh
npm run build
npm test
npm start
```

`npm start` serve `dist` e WebSocket su http://127.0.0.1:8787. Per provare il multiplayer
usa `npm run dev` oppure `npm start`: il solo `vite preview` non avvia il server di gioco.
Le prove coprono coordinate, collisioni, cortili, raggiungibilità dei segnali, velocità,
input non validi, movimento relativo alla camera, confini, missione, interni, due client e rifiuto delle origini estranee.

L'app è mantenuta locale per impostazione predefinita. Una pubblicazione richiede HTTPS,
proxy WebSocket, gestione degli account, persistenza, test di carico e verifica della
licenza commerciale del fornitore. `HOST` e `PORT` configurano il server.

## Organizzazione

- `src/character.ts`: modello gratuito, scala e animazioni di locomozione.
- `shared/camera.mjs`: camera in terza persona e limitazione contro le sagome.
- `docs/ART_DIRECTION.md`: priorità estetiche, alternative future e fonti fotografiche.
- `src/scene.ts`: rendering, dati locali, streaming Cesium e interno.
- `src/environment.ts`: materiali procedurali e trattamento degli edifici Cesium.
- `shared/controls.mjs`: movimento relativo allo sguardo e limiti della camera.
- `src/main.ts`: interfaccia, missione, minimappa e input.
- `shared/world.mjs`: regione, coordinate, collisioni e regole condivise.
- `server/index.mjs`: simulazione autorevole e distribuzione dello stato.
- `public/data/montemurlo.json`: database geografico OSM derivato.
- `public/data/LICENSE.md`: attribuzione e licenza del database.
- `scripts/import-osm.py`: estrazione riproducibile da XML OSM (nessun rilievo).
- `docs/DECISIONS.md`: decisioni, limiti e verifica dello streaming.

## Fonti

- https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/
- https://cesium.com/platform/cesium-ion/content/cesium-osm-buildings/
- https://cesium.com/platform/cesium-ion/pricing/
- https://www.openstreetmap.org/copyright
- https://operations.osmfoundation.org/policies/api/

Il database geografico derivato è ODbL-1.0. Nessuna API pubblica OSM viene interrogata
durante le partite: l'estratto locale è un file statico del progetto. L'importazione
è un'attività di sviluppo limitata all'area selezionata, non un meccanismo globale.

## Campione del centro civico

La demo apre direttamente la versione approvata in terza persona, davanti al
municipio. **Gioca** attiva il mouse; WASD muove il personaggio, **J** apre il diario
e **M** alterna mappa e personaggio. I confronti visivi sono stati rimossi.
Municipio, casa con balconate, colonnato e sei sedute: misure e collocazioni
interpretative, non fotogrammetria. Fonti e limiti in
[public/models/civic/SOURCES.md](public/models/civic/SOURCES.md).
Rigenerare gli asset con `node scripts/build-civic.mjs` dopo modifiche al generatore.

### Estensione Piazza della Libertà

Piazza della Libertà include tre nuovi studi: casa bianca con negozi e coperture
sfalsate, casa d'angolo e casa ocra. La casa con balconate era già presente.
Le sagome restano quelle OSM; le facciate e gli abbinamenti alle fotografie del
2020 sono interpretativi. Fonte e limiti in `public/models/civic/SOURCES.md`.

Per confrontare la smussatura delle strade: **Impostazioni → Bordi più morbidi**.
Il filtro FXAA è attivo di default; il contatore sottostante mostra fps e p95.
Asfalto senza grana e fughe della pavimentazione filtrate restano attivi anche
spegnendo FXAA. Risoluzione e MSAA non sono stati aumentati.

### Studi precedenti archiviati

I modelli alternativi degli arredi sono conservati nei file, ma non sono più
selezionabili nella demo. Note storiche: `public/models/civic/STUDY.md`.

### Prova Google Photorealistic 3D Tiles

Apri `http://127.0.0.1:5173/photogrammetry.html`. Usa il token ion esistente e
l’asset ufficiale 2275207, senza altri fondali cartografici. **Quartiere**, **Piazza**
e **Facciate** confrontano la resa alle diverse distanze; **Dettaglio** regola il LOD.
È una prova visiva separata, senza personaggio o collisioni di gioco.
Copertura locale verificata, condizioni e costi in
[docs/PHOTOGRAMMETRY_EVALUATION.md](docs/PHOTOGRAMMETRY_EVALUATION.md).

### Municipio con facciata fotografica

La facciata fotografica è sempre attiva. Finestre e cornici sono nella texture, balconi
e tetto restano 3D. Foto Wikimedia Commons 2011 di Massimiliano Galardi, CC BY-SA 3.0,
adattate con imagegen; non è un rilievo attuale. Crediti e limiti in
[public/models/civic/photo-study/SOURCES.md](public/models/civic/photo-study/SOURCES.md).

### Piazza del municipio rinnovata

Apri `http://127.0.0.1:5173/`. Il robottino parte davanti al municipio, rivolto
verso la facciata fotografica, nella piazza rinnovata. I vecchi parametri di
confronto vengono ignorati e rimossi dall’indirizzo. La posizione iniziale è
condivisa tra client e server in `shared/spawn.mjs`.

Pavimentazione, tre aiuole frontali, tigli con bordi circolari, panchine bianche,
fioriere, lampioni e monumento interpretano la sistemazione del 2023. Il parco
e i fabbricati circostanti conservano il livello di dettaglio precedente.
Misure degli arredi e statua sono approssimate: [fonti e limiti](public/models/civic/REPUBLIC.md).

Rigenera gli arredi con `node scripts/build-republic.mjs`. La texture delle foglie
è un asset sintetico condiviso, già incluso nel progetto. I test verificano
collisioni, accesso a entrambi gli ingressi e budget geometrico dei nuovi asset.
