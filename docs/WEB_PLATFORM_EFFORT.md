# Piattaforma web: archivio, streaming e multiplayer

Valutazione del 27 settembre 2026. Proposta tecnica e stime preliminari, non
migrazione implementata né benchmark. Il gioco resta nel browser con CPU/GPU locali.

## Archivio proprio e cache dei fornitori

Gli ambienti prodotti da Resonance e i dati ottenuti con diritti adeguati possono
essere pubblicati in un archivio versionato, distribuito tramite storage e CDN.
La permanenza e la distribuzione dipendono dalle licenze delle fonti. L'autorizzazione
Google dichiarata da Fabrizio riguarda la ricostruzione da immagini; non estenderla
automaticamente a dataset di altri fornitori o ad altri utilizzi.

Cesium ion consente Archives/Exports per i dati caricati dall'utente: possiamo
usarlo per preparare i nostri asset e poi ospitare l'output. Questa funzione non
permette di esportare gli asset Asset Depot come World Terrain e OSM Buildings.
I termini standard consentono cache client/proxy generiche per prestazioni, con
i limiti temporali degli asset; non equivalgono a un archivio permanente dedicato
dei contenuti Cesium. Eventuali accordi specifici prevalgono.

La priorità locale va definita per livello informativo: terreno, immagini,
edifici e collisioni possono avere coperture diverse. Un catalogo indica copertura,
versione, provenienza e stato di verifica. Si usa il nostro asset dove presente;
altrove la fonte esterna ammessa. Servono raccordi e regole di sostituzione per
evitare duplicati. Avere una facciata non rende completa una zona.

Il risparmio va misurato in byte richiesti al fornitore e nelle unità del suo piano,
non solo contando chiamate. Storage e traffico della nostra CDN restano costi.

## Riscontro nel prototipo

- `src/terrain-provider.mjs`: terreno regionale prioritario nelle tile interne
  dettagliate; quelle grossolane e ai bordi possono ancora usare World Terrain.
  La cache Map di 96 elementi è in memoria. Il raster regionale viene letto intero.
- `src/local-imagery.ts`: piramide di ortofoto regionali servita localmente.
- `src/scene.ts`: Cesium gestisce LOD del terreno e dei tileset. Nascondere oggetti
  locali per distanza non costituisce uno scaricamento di mesh e texture.
- `src/main.ts`: caricamento iniziale dell'intero estratto Montemurlo.
- `server/index.mjs`: WebSocket personalizzato, limite configurato di 32 connessioni,
  filtro dei giocatori entro 350 m, scansione di tutti contro tutti a ogni tick.
  Nessuna prova di capacità a 32 o più utenti deriva da quel limite configurato.
  Mancano account e persistenza durevole; il server statico non imposta una politica
  esplicita di Cache-Control/ETag.
- Colyseus non è attualmente una dipendenza del progetto.

## Architettura proposta

Conservare CesiumJS per rendering geografico e selezione dei dettagli. Preparare
offline gerarchie di tile, mesh semplificate e texture a risoluzioni appropriate:
il renderer non produce da solo i LOD di un singolo modello caricato.

Servire contenuti statici versionati dalla CDN; il backend di gioco gestisce
simulazione e stato dinamico. Integrare Colyseus per stanze e sincronizzazione,
con indice spaziale dei giocatori, filtro per destinatario e margine alle soglie
per evitare continui ingressi/uscite. Ogni client si collega al server e riceve
gli stati pertinenti, non stabilisce connessioni dirette con i giocatori vicini.

Una stanza Colyseus resta in un processo: distribuire stanze non distribuisce
automaticamente una singola simulazione globale. Partire con istanze regionali
e passaggi espliciti. I passaggi continui fra server e grandi folle concentrate
sono problemi aggiuntivi. Collisioni stabili e autorevoli devono restare coerenti
con la superficie percorribile, indipendentemente dal LOD visivo.

Usare versioni fissate, formati aperti e confini chiari tra componenti. La possibilità
di mantenere una versione o un fork riduce la dipendenza, ma richiede manutenzione.
Rust/WASM potrà servire per elaborazioni misurate come costose; non è un prerequisito.

## Stima preliminare del nucleo tecnico

Ipotesi: sviluppatore senior a tempo pieno, esperienza web/3D/rete, riuso delle
librerie, contenuti campione esistenti, una città, movimento e interazioni basilari.
Obiettivo da verificare: decine di utenti per istanza e centinaia complessive
distribuite. Non è una promessa di capacità o di compatibilità con ogni dispositivo.

| Pacchetto | Settimane-persona |
| --- | ---: |
| Catalogo, versionamento, distribuzione e cache degli asset propri | 2–4 |
| Streaming dei settori, preparazione LOD, texture e collisioni coerenti | 6–10 |
| Multiplayer, interesse spaziale, istanze e persistenza essenziale | 5–8 |
| Profilazione, prove di carico, affidabilità e distribuzione iniziale | 3–6 |
| Totale indicativo | 16–28 |

Sono circa 640–1120 ore a 40 ore/settimana, ordine di grandezza 4–7 mesi-persona.
Le fasce sono giudizio preliminare di progettazione: da rivedere dopo la prova
iniziale, non un preventivo. Lavoro simultaneo non implica una riduzione lineare
dei tempi. La manutenzione successiva non è inclusa.

Esclusi: ricostruzione fedele di tutta Montemurlo, generazione automatica da foto,
upload/revisione/moderazione della community, Resonance Studio, contenuti e sistemi
di un RPG completo, sandbox dei creatori, fatturazione SaaS, mondo globale senza
interruzioni e folle massive. La piattaforma complessiva richiede una stima separata
e un piccolo team; non va presentata come completabile con il solo nucleo sopra.

## Primo incremento proposto

2–4 settimane-persona, comprese nella stima del nucleo, per una prova su quattro
settori adiacenti con contenuti esistenti. Nessuna espansione geografica necessaria.

Misurare caricamento iniziale, byte a cache vuota/piena, memoria CPU/GPU ove
osservabile, tempi dei frame e pause durante attraversamenti ripetuti. Verificare
che i settori lontani liberino risorse senza perdere scalinate o collisioni.
Provare carichi crescenti, anche 50/100 client simulati come punti di prova,
sia distribuiti sia concentrati. Registrare tempo dei tick e traffico per utente.
I client simulati non sostituiscono prove grafiche su dispositivi reali.

Definire hardware/browser minimi prima di fissare budget: 30 fps è un possibile
obiettivo iniziale, non una prestazione già ottenuta. Continuare solo sulla base
dei risultati e aggiornare le stime. La verifica visiva resta quella prescritta
da WORLD_RECONSTRUCTION.md; un benchmark superato non certifica fedeltà geografica.

## Fonti ufficiali consultate

- https://cesium.com/learn/ion/cesium-ion-archives-and-exports/
- https://cesium.com/legal/terms-of-service/ — §2.2.2 e definizioni degli output.
- https://cesium.com/learn/ion/content-usage-and-attribution-guide/
- https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html
- https://docs.colyseus.io/scalability
- https://docs.colyseus.io/state/view
