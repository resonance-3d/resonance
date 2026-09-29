# Resonance — piattaforma comunitaria del mondo reale

> Revisione successiva del 27 settembre: leggere prima
> [UNREAL_AND_RECONSTRUCTION_TOOL.md](UNREAL_AND_RECONSTRUCTION_TOOL.md).
> Unreal è nuovamente candidato; Panoramax escluso per scelta dell'utente;
> autorizzazione scritta Google dichiarata dall'utente per la ricostruzione.
> Le raccomandazioni originarie sotto sono storiche dove contrastano con la revisione.

Ricerca e proposta del 27 settembre 2026. Non è una migrazione implementata né una
certificazione legale. Le raccomandazioni sotto restano proposte; i requisiti derivano
dall'ultima richiesta di Fabrizio. Nessuna licenza è applicata al repository con questo documento.

## Direzione richiesta

- Accesso via browser; Roblox escluso per ora.
- Mondo reale riconoscibile e progressivamente ricostruito dalla community.
- Foto geolocalizzate, caricamento web e possibile applicazione locale di acquisizione.
- Ricostruzione assistita/automatizzata, revisioni, contestazioni e moderazione prima della pubblicazione.
- Codice open-source; servizio SaaS commerciale per aziende e autori di esperienze.
- Resonance RPG come prima esperienza della piattaforma, non unico uso del mondo.

Le direttive di [WORLD_RECONSTRUCTION.md](WORLD_RECONSTRUCTION.md) restano valide:
scale, accessi e raccordi non diventano dettagli facoltativi perché la produzione è automatizzata.
Il raggio iniziale di 1 km rimane un obiettivo geografico, non un'area già verificata.

## Piattaforme comparabili e componenti riutilizzabili

Ricerca documentale, senza prova operativa delle piattaforme. Attività di sviluppo e
forum non equivalgono a SLA, utenti simultanei o garanzia di sostenibilità economica.

| Progetto | Evidenza e utilità | Limite rispetto alla visione |
| --- | --- | --- |
| Panoramax | Rete federata di foto geolocalizzate, contributi e istanze autonome; contatori ufficiali consultati superiori a 120 milioni di foto e 2.600 contributori. | È un archivio fotografico, non un generatore di mondo 3D giocabile. Licenza delle immagini distinta da quella del software e variabile per istanza. |
| Niantic Spatial / Scaniverse | Acquisizione, ricostruzione, mesh/splat e posizionamento; prodotto Enterprise e attività della community nel 2026. | Servizio commerciale, non una base interamente open-source. Non copre da solo creazione di giochi e governo comunitario del mondo. |
| CesiumJS / ion | CesiumJS Apache-2.0, release 1.145 nell'elenco corrente; streaming geografico e formati aperti. | CesiumJS e il servizio ion sono prodotti distinti; ion non è il codice open-source del renderer. Non genera automaticamente accessi e geometrie di gioco. |
| PlayCanvas / SuperSplat | Editor e viewer SuperSplat aperti; aggiornamenti WebGPU e LOD nel settembre 2026. | Visualizzazione/authoring di scene; non un globo comunitario verificato. Non presumere che ogni servizio ospitato sia open-source. |
| OpenDroneMap e WebODM | Fotogrammetria e produzione di mesh/modelli georeferenziati; forum ODM attivo nel settembre 2026 e release WebODM. | Nel 2026 WebODM dichiara di essersi separato da OpenDroneMap: valutare i due progetti distintamente. Non sono una piattaforma multiplayer globale. |
| Decentraland | Creazione di esperienze e community; SDK, client e repository pubblici, attività comunitaria nel 2026. | Mondo virtuale, non ricostruzione fedele della Terra. Il client Bevy web documentato non certifica da solo parità/prestazioni fra tutti i client. |
| Open3DMap | Visione particolarmente vicina: scansioni geolocalizzate e ricostruzione distribuita. | README con varie funzioni ancora pianificate, tra cui fusione/moderazione/API. LICENSE CC BY-NC 4.0: non è una licenza open-source OSI, né consente automaticamente il nostro SaaS commerciale. Community e affidabilità operative non verificate. |

Fonti primarie:

- Panoramax: [statistiche](https://panoramax.fr/stats), [contributi](https://docs.panoramax.fr/how-to-contribute/share-pictures/), [licenze delle immagini](https://docs.panoramax.fr/backend/install/settings/), [offuscamento](https://docs.panoramax.fr/backend/install/deep_dive/blur_api/).
- Niantic: [migrazione Lightship → Scaniverse](https://www.nianticspatial.com/faq/scaniverse-lightship-migration), [guida acquisizione](https://www.nianticspatial.com/capture/scaniverse-getting-started), [forum](https://community.nianticspatial.com/top). Lightship.dev e Geospatial Browser sono stati dismessi nel febbraio 2026: non proporli come prodotti correnti separati.
- Cesium: [CesiumJS](https://cesium.com/platform/cesiumjs), [release](https://github.com/CesiumGS/cesium/releases).
- PlayCanvas: [aggiornamenti](https://blog.playcanvas.com/), [SuperSplat](https://developer.playcanvas.com/user-manual/gaussian-splatting/editing/supersplat/).
- Fotogrammetria: [ODM](https://opendronemap.org/odm/), [community ODM](https://community.opendronemap.org/), [WebODM attuale e AGPL](https://github.com/WebODM/WebODM), [release](https://github.com/WebODM/WebODM/releases).
- Decentraland: [SDK](https://docs.decentraland.org/creator/scenes-sdk7/getting-started/sdk-101), [Bevy Explorer](https://github.com/decentraland/bevy-explorer), [forum](https://forum.decentraland.org/top).
- Open3DMap: [repository e roadmap](https://github.com/x4dqn/Open3Dmap), [licenza](https://github.com/x4dqn/Open3Dmap/blob/main/LICENSE).

Fra i progetti esaminati non è stata verificata una soluzione matura che combini tutte
le richieste. Questo non dimostra che non esista alcun concorrente.

## Scelta tecnica proposta

Conservare CesiumJS come base geografica del client web, sviluppando la produzione
dei contenuti come servizio separato. Non convertire il prototipo in un unico file
del mondo. Usare 3D Tiles/glTF, texture compresse e livelli di dettaglio; verificare
l'effettivo supporto dei formati nel renderer scelto prima di adottarli nella pipeline.

Tre livelli distinti:

1. Base reale: settori e oggetti con identificativi, coordinate, epoca, provenienza,
   licenza, livello di verifica e versioni ripristinabili.
2. Esperienze: modifiche e regole separate per ciascun autore/gioco, senza sovrascrivere
   il mondo reale. Codice degli autori isolato, autorizzazioni e limiti di risorse.
3. Servizi: catalogo geografico, storage/CDN, ricostruzione, moderazione, multiplayer,
   gestione organizzazioni, quote e fatturazione.

Il browser carica e scarica settori in base a posizione, visibilità e budget di memoria,
con prefetch limitato. Collisioni locali semplificate e coerenti con la versione visiva.
Il backend multiplayer simula regioni attive e invia solo eventi pertinenti al giocatore;
la CDN serve i contenuti statici. Un globo continuo non richiede un unico processo server.
Il numero di utenti dell'intera piattaforma va distinto da quelli nella stessa piazza.

Il prototipo non dimostra già queste proprietà per tutti gli asset locali. Prima di
estendere l'area, misurare e separare i caricamenti locali monolitici: la suddivisione
dell'inventario in settori non prova l'esistenza di streaming del runtime.

## Epic e Unreal

[EOS](https://onlineservices.epicgames.com/) offre servizi per account/socialità,
sessioni/lobby/P2P/voce, statistiche, salvataggi e sicurezza. È utilizzabile con motori
diversi; non richiede la scelta di Unreal. Non sostituisce la nostra pipeline 3D,
il catalogo geografico o il sistema di revisione delle immagini.

Lo [SDK pubblicizzato](https://onlineservices.epicgames.com/sdk) è C/C# per piattaforme
native. Esistono Web API, ma la parità di tutte le funzioni nel browser non è stata
verificata. Valutare eventuali servizi EOS tramite adattatori e una prova per funzione;
non farne un requisito dell'installazione open-source autonoma.

I servizi EOS gratuiti non equivalgono a macchine GPU, CDN geografica illimitata o
server di gioco gratuiti. Epic distingue i [partner di hosting](https://onlineservices.epicgames.com/partners).
Stats/leaderboard non dimostrano un servizio completo di osservabilità e cost accounting.

Con [Pixel Streaming](https://dev.epicgames.com/documentation/unreal-engine/overview-of-pixel-streaming-in-unreal-engine),
Unreal gira su un computer remoto e manda video interattivo al browser. Per viste
indipendenti vanno dimensionati rendering, encoding, banda e latenza. È una possibile
offerta specialistica futura, non la proposta iniziale per il mondo pubblico.
L'[EULA Unreal](https://www.unrealengine.com/eula/unreal) non è una licenza open-source:
codice sorgente accessibile e software open-source non sono sinonimi.

## Acquisizione e pubblicazione

Pipeline proposta:

1. Acquisizione guidata: viste sovrapposte, percorso, data, metadati e autorizzazione.
   L'app deve richiedere le viste mancanti di scale, ingressi e raccordi.
2. Quarantena privata: validazione file, limiti upload, moderazione e tutela della privacy.
3. Controllo qualità e allineamento: calibrazione, corrispondenze, scala e ancoraggi
   geografici/altimetrici. Il GPS del telefono da solo non dà precisione centimetrica.
4. Ricostruzione su worker CPU/GPU isolati; produrre mesh e texture. Valutare splat per
   resa visiva, senza confonderli con collisioni, porte e superfici navigabili verificate.
5. Preparazione LOD, tile, collisioni e verifica dei confini con i settori vicini.
6. Revisione in staging con foto e checklist; correzioni e nuove acquisizioni se necessarie.
7. Pubblicazione di una versione atomica del settore; segnalazioni e rollback.

Automatizzare non significa inventare parti non osservate e chiamarle fedeli.
Inizialmente la revisione umana rimane necessaria. Un modello linguistico può aiutare
a classificare, descrivere e orchestrare; non sostituisce il rilievo e la fotogrammetria.

Non basare il prodotto sull'estrazione automatica da Google Maps/Street View: i
[termini EEA](https://cloud.google.com/terms/maps-platform/eea) limitano scraping e
creazione di contenuti derivati. La combinazione con foto proprie non rimuove tali
vincoli. Per quell'uso occorre un'autorizzazione appropriata; privilegiare foto proprie,
fonti pubbliche aperte e Panoramax verificando licenza e provenienza di ogni lotto.

## Moderazione e governance

Prevedere controlli prima della pubblicazione e della ricostruzione costosa: privacy
(volti/targhe), contenuti sessuali/inappropriati, abuso degli upload, false coordinate
e materiale di terzi. AI e segnalazioni sono strumenti, non garanzie di assenza di abusi.

Per CSAM valutare un servizio specialistico di rilevamento noto e gestione delle
segnalazioni, ad esempio [Shield / Project Arachnid](https://projectarachnid.ca/en/).
Accesso ai sospetti ristretto a personale autorizzato: mai revisione pubblica o voto
della community su quel materiale. Definire con specialisti gli obblighi applicabili
di segnalazione, conservazione e rimozione. Non usare dataset illeciti per addestrare
classificatori interni.

Le contestazioni geografiche possono essere pubbliche, motivate da fonti e riesaminate.
Usare reputazione, ruoli, cronologia, appello e protezione dalle segnalazioni abusive.
Una rimozione deve raggiungere anche texture/mesh derivate, cache e versioni pubbliche,
non soltanto la foto iniziale. Limitare coordinate sensibili esposte dagli upload.

## Licenza e SaaS

La [definizione OSI](https://opensource.org/osd) ammette l'uso commerciale. Non si può
promettere contemporaneamente licenza open-source e pagamento obbligatorio da ogni
azienda che esegue il software sui propri server.

Proposta da far verificare prima dell'adozione:

- Backend e strumenti propri sotto AGPL-3.0; SDK di integrazione con licenza permissiva.
- Servizio ospitato a pagamento per elaborazione, storage, traffico, supporto e SLA.
- Self-hosting consentito, anche commerciale, rispettando le licenze.
- Eventuale licenza commerciale alternativa solo per codice su cui abbiamo i diritti
  necessari, con accordi appropriati per i contributi e verifica delle dipendenze.

L'[AGPL](https://www.gnu.org/licenses/gpl-faq.en.html) prevede l'offerta del sorgente
corrispondente agli utenti di una versione modificata accessibile in rete. Non impone
il pagamento; non rende automaticamente AGPL ogni gioco indipendente che chiama un'API.
I confini fra componenti e opere derivate richiedono una valutazione concreta.

Foto, mesh, database e marchio richiedono regole separate dal codice. Gli upload devono
concedere diritti adeguati di elaborazione e distribuzione commerciale; mantenere gli
obblighi delle fonti importate. Non assegnare automaticamente una nuova licenza a tutto.

## Prova successiva e misure

Proporre un isolato attorno al municipio, preservando i dettagli già approvati, con
acquisizioni autorizzate di più persone. Prima dimostrare upload → revisione → settore
versionato in streaming; poi estendere Montemurlo e aprire la creazione di esperienze.

Misurare per lotto: foto/byte, copertura e viste mancanti, scarti, minuti umani,
CPU/GPU-ore, numero di tentativi, dimensioni finali, errore rispetto ai controlli,
tempo di prima visualizzazione, memoria, p95 frame time, traffico per sessione e
carico multiplayer. Per il costo mensile separare elaborazione, storage, egress,
server, moderazione e supporto. Il numero di km² non basta a stimarlo.

Questa sessione è ricerca/documentazione: nessun settore ricostruito, nessun benchmark
nuovo, nessun costo unitario di produzione misurato. Le percentuali dell'abbonamento
Codex non rappresentano un preventivo API o il costo di un settore.
