# Direzione del prodotto — 27 settembre 2026

Ulteriore orientamento: Fabrizio preferisce valutare una piattaforma web propria
composta da librerie mantenute, evitando per ora Unity/Godot. Analisi di archivio
locale, cache Cesium, stato effettivo del codice e stima del nucleo tecnico in
[WEB_PLATFORM_EFFORT](WEB_PLATFORM_EFFORT.md). Nessuna migrazione implementata;
Colyseus è proposto, non già presente nel runtime.

Aggiornamento successivo: gioco nel browser con CPU/GPU locali confermato; esclusi
Pixel Streaming e installazione come soluzione richiesta. Unreal + Cesium resta
candidato tramite porting web di terzi da verificare, non export UE5 standard.
Panoramax escluso. Fabrizio dichiara autorizzazione
scritta Google per ricostruzione da immagini Maps; AGPL come orientamento per componenti
indipendenti, non automaticamente per moduli Unreal. Vedere la
[revisione tecnica e il tool](UNREAL_AND_RECONSTRUCTION_TOOL.md), che prevale sulle
raccomandazioni precedenti nei punti modificati.

Fabrizio richiede una piattaforma web open-source per ricostruire il mondo reale con
contributi fotografici della community, revisione e moderazione, con Resonance come
prima esperienza e possibile offerta SaaS. Roblox è escluso per ora. Analisi delle
alternative, raccomandazioni e questioni di licenza sono in
[PLATFORM_VISION_2026-09-27](PLATFORM_VISION_2026-09-27.md).
La proposta non costituisce una migrazione implementata né applica una nuova licenza.

# Stato della ricostruzione — 24 settembre 2026

L’ambito è ora il cerchio di raggio 1 km dal municipio (3,142 km²), con base regionale e OSM ampliata. Le decisioni precedenti sotto riportate sono storiche; per metodo, stato e fonti correnti seguire [WORLD_RECONSTRUCTION](WORLD_RECONSTRUCTION.md) e [inventario](world-production/INVENTORY.md). Non considerare il chilometro interamente verificato a terra.

# Decisioni — primo prototipo, 22 settembre 2026

## Obiettivo

Verificare un RPG browser ambientato in una reinterpretazione della Terra usando
geografia esistente. Non ricostruire luoghi con fotogrammetria e non sviluppare un
servizio globale di tiles. Regione: bbox 11.023,43.920,11.041,43.933; circa 2,1 km².
Punto iniziale nella sagoma OSM di Piazza della Libertà, vicino al municipio.

## Fonte pronta e superficie giocabile

Cesium offre separatamente terreno e edifici pronti. Il collegamento usa le API
ufficiali createWorldTerrainAsync e createOsmBuildingsAsync. È necessario un token
dell'utente. Il renderer gestisce LOD e caricamento; il server non serve queste tile.

In assenza di token, l'estratto OSM incluso mostra sagome reali con quote semplificate.
È un fallback esplicito. Non viene presentato come terreno reale o streaming attivo.
I segnali, il portale e l'interno sono creazioni di gioco ancorate a coordinate reali.
Non corrispondono a veri ingressi, passaggi o interni del municipio o di Villa Giamari.

Il terreno in streaming risolve la rappresentazione geografica; non fornisce da solo
una superficie fisica condivisa. Il server attuale simula solo x/y su un piano, con
sagome OSM come ostacoli. Il client appoggia visivamente il personaggio al terreno
Cesium caricato. Questo è un limite esplicito della prova, non fisica 3D autorevole.

## Coordinate

Per questa sola area: conversione locale metrica approssimata alla latitudine
centrale. La scena visualizza in ECEF tramite Cesium. Per regioni estese e transizioni
si passerà a ENU rigoroso con origini versionate e datum altimetrico concordato.
Non riutilizzare l'approssimazione locale per l'intero pianeta.

## Verifica necessaria con token

1. Aprire le impostazioni, collegare un token limitato agli asset e al dominio locale.
2. Controllare che entrambe le risorse risultino connesse e che i crediti siano visibili.
3. Esplorare piazza, parco, zone industriali e pendenze; registrare assenze e disallineamenti.
4. Misurare richieste, byte, memoria e frame time su un computer minimo definito.
5. Confrontare collisioni dell'estratto con edifici in streaming e valutare come versionarli.
6. Chiarire con Cesium licenza e volumi per utenti esterni prima di un rilascio pubblico.

Collegamento live e resa della piazza sono stati verificati con il token configurato.
Questo non certifica la completezza o precisione di ogni edificio della regione.

## Prossima scelta tecnica

Se i dati serviti risultano adeguati: conservare il collegamento al fornitore,
aggiungere personaggio e movimento 3D, quindi una singola interazione RPG curata.
Solo dopo confrontare CesiumJS con Babylon + adattatore 3D Tiles sullo stesso caso.
Lo sviluppo di una pipeline globale di generazione non è un prerequisito di questa prova.

## Soggettiva e direzione visiva

Scelta dell’utente: contemporanea inquietante, luoghi reali con anomalie. La camera
parte all’altezza degli occhi; WASD segue lo sguardo, M apre la mappa, J il diario.
Il mouse viene catturato solo con un clic esplicito. Trascinamento e frecce restano
alternative; perdita del focus e rilascio del cursore azzerano l’input.

Il primo trattamento aggiunge materiali tramite CustomShader ai tile OSM già serviti.
Non richiede nuovi rilievi, generazione o hosting di tile. Le coordinate locali per
lo shader sono ricavate dallo spazio camera per evitare perdita di precisione ECEF.
La griglia delle finestre è decorativa e ha un riferimento altimetrico regionale.
Non crea aperture o geometrie percorribili. Strade a larghezza convenzionale e piazze
sono appoggiate al terreno; arredi e anomalie sono creazioni di gioco. I lampioni
non aggiungono illuminazione puntuale né collisioni.

Prossimo campione artistico: un tratto di piazza/strada con marciapiedi in volume,
porte e infissi modulari, vegetazione e un ingresso interattivo. Va valutato in
soggettiva prima di estendere il trattamento all’intera regione.

Per l’avvio in soggettiva viene precaricato il terreno circostante con una camera
alta durante la schermata di preparazione. La quota del giocatore viene campionata
sul terreno dettagliato, evitando di usare il livello grossolano iniziale del globo;
nuovi campioni sono richiesti dopo uno spostamento di almeno 2 m, uno alla volta.
Questo segue visivamente il terreno ma non aggiunge gravità, salti o collisioni 3D.

Verifiche: build TypeScript/Vite e 14 test superati; browser Chrome con terreno e
facciate in streaming, passaggio mappa/soggettiva, raccolta del primo eco e diario.

## Revisione: terza persona e realismo prioritario

La richiesta successiva dell’utente sostituisce la soggettiva con la terza persona.
RobotExpressive CC0 incluso localmente, normalizzato a 1,75 m; camera orbitale con
zoom, campo visivo verticale costante e arretramento limitato dalle collisioni OSM.
La scala non dipende dalla distanza sullo schermo. Camera e animazioni usano il ciclo
preUpdate del renderer; l’orologio delle animazioni è indipendente dal cielo fisso.
Il personaggio locale ha le animazioni; gli altri giocatori restano indicatori.

Quota caricata letta localmente, campioni dettagliati distanziati (1,5 s / 8 m),
interpolazione verticale. Materiali condivisi e aggiornamenti HUD evitati quando
invariati. Risoluzione 3D limitata a 1600×900, MSAA 2, distanza della camera di gioco
limitata a 2200 m. Nessuna promessa di FPS su altre macchine o test di carico.

Obiettivo artistico e analisi Street View/Google/Mapillary, con alternative medievale
e futuristica ancora aperte, registrati in ART_DIRECTION.md.
