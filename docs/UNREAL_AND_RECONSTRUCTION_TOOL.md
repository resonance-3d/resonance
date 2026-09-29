# Resonance: Unreal e strumento di ricostruzione

Revisione del 27 settembre 2026, successiva a PLATFORM_VISION_2026-09-27.md.
È una proposta architetturale, non una migrazione eseguita. Nessuna nuova licenza
applicata al codice e nessuna nuova geometria o texture prodotta in questa sessione.

## Requisiti aggiornati e correzioni

- Valutare seriamente Unreal + Cesium come runtime: la precedente esclusione era
  troppo netta e dipendeva soprattutto dal vincolo browser.
- Decisione esplicita successiva: anche il gioco deve girare nel browser utilizzando
  CPU/GPU locali. Pixel Streaming e installazione del gioco non sono la soluzione richiesta.
- Panoramax escluso per scelta dell'utente.
- Fabrizio dichiara di avere un'autorizzazione scritta Google per usare le immagini
  Maps nella ricostruzione descritta. Considerarla fonte autorizzata per quell'uso;
  non ricavare dal contratto non esaminato ulteriori diritti, limiti o prezzi.
  Registrare il riferimento contrattuale nell'integrazione, senza pubblicare documenti
  riservati. La fonte di ogni asset deve rimanere quella effettivamente utilizzata.
- AGPL è l'orientamento provvisorio per i componenti propri indipendenti. Non implica
  che ogni azienda debba pagare e non si applica automaticamente a un modulo Unreal.
- Open3DMap non è una dipendenza consigliata. La cronologia consultabile presenta
  come voce più recente il 20 agosto 2025; la pagina indicizzata non è una verifica live
  dell'intero repository. Nessuna evidenza sufficiente di manutenzione corrente.
  Gli altri esempi della ricerca precedente sono componenti o prodotti parzialmente
  comparabili, non soluzioni equivalenti all'intera piattaforma.

Fonte: [cronologia Open3DMap](https://github.com/x4dqn/Open3Dmap/commits/main/).

## Cosa semplifica Unreal

Unreal offre authoring, materiali, animazioni, fisica, profiling e networking, oltre a
[World Partition](https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine)
e [HLOD](https://dev.epicgames.com/documentation/unreal-engine/world-partition---hierarchical-level-of-detail-in-unreal-engine).
[Cesium for Unreal](https://github.com/CesiumGS/cesium-unreal) è Apache-2.0 e può
consumare fonti compatibili diverse da ion. Non occorre rinunciare a Cesium.

Distinguere tre meccanismi: streaming geografico Cesium; caricamento delle celle
Unreal e relativi HLOD; distribuzione/aggiornamento degli asset da rete. World Partition
non equivale automaticamente a download da CDN di un catalogo comunitario in evoluzione.
Non dare per scontato che HLOD/Nanite ricostruiscano automaticamente i tile dinamici.

Il client si collega normalmente al server autorevole. La
[relevancy](https://dev.epicgames.com/documentation/unreal-engine/actor-relevancy-in-unreal-engine)
e il [Replication Graph](https://dev.epicgames.com/documentation/unreal-engine/replication-graph-in-unreal-engine)
riducono gli aggiornamenti inviati a ogni connessione; non eliminano simulazione,
fisica, AI e persistenza. Testare giocatori distribuiti e concentrati nella stessa piazza.
Non promettere un numero di giocatori per server prima del benchmark.

Per Cesium le tile non caricate possono non offrire collisioni. Il server dedicato
deve mantenere dati fisici delle regioni attive indipendenti dalla camera di un client.
Vedi [collocazione degli oggetti e culling](https://cesium.com/learn/unreal/unreal-placing-objects/).

Mobile beneficia della stessa base di sviluppo, ma richiede contenuti, controlli e
budget grafici specifici; non assumere parità con il desktop. Fonte:
[rendering mobile](https://dev.epicgames.com/documentation/unreal-engine/mobile-rendering-features-in-unreal-engine).
Per il browser la via ufficiale considerata è
[Pixel Streaming](https://dev.epicgames.com/documentation/unreal-engine/overview-of-pixel-streaming-in-unreal-engine):
rendering remoto, costo GPU/banda e capacità per viste indipendenti da dimensionare.
Rust/WASM nel tool non converte automaticamente il runtime Unreal in un'app web.

## Studio e licenze

Unreal è source-available sotto EULA Epic, non open-source OSI. L'EULA limita la
distribuzione degli Engine Tools e le combinazioni con licenze incompatibili.
Un editor derivato non può essere trattato come un fork AGPL liberamente distribuibile.
Proposta: Studio indipendente; adattatore Unreal separato con licenza compatibile;
eventuali strumenti basati sull'Editor da valutare con Epic. Fonti:
[EULA](https://www.unrealengine.com/eula/unreal).

Il vecchio Unreal Studio è stato incorporato in UE 4.24; il prodotto di riferimento
per un eventuale derivato è Unreal Editor. Fonte:
[annuncio Epic](https://forums.unrealengine.com/t/unreal-studio-retirement-and-features-going-free-in-ue-4-24/133374).

## Tool proposto

Un solo progetto di acquisizione/revisione con due modalità di esecuzione:

| Parte | Implementazione proposta | Ruolo |
| --- | --- | --- |
| Interfaccia web | TypeScript, anteprima CesiumJS | Mappa, riferimenti, annotazioni, confronto e revisione |
| Client locale | Tauri con UI condivisa | Cartelle, upload riprendibile, esecuzione di worker locali |
| Nucleo geometrico | Rust nativo, sottoinsieme compilabile WASM | Coordinate, geometrie parametriche, misure e controlli ripetibili |
| Ricostruzione | Worker esterni CPU/GPU, orchestrazione tramite API/CLI | Fotogrammetria, segmentazione, texture e semplificazione |
| Pubblicazione | Servizio versionato e storage/CDN | Manifest, asset, LOD, revisioni, rollback e attribuzioni |
| Integrazione gioco | Adattatore Unreal oppure client CesiumJS | Import e visualizzazione della medesima definizione del settore |

Tauri non rende necessario WASM per chiamare Rust: il processo nativo comunica con
la UI. WASM serve a condividere funzioni adatte al browser; non è il posto predefinito
per una ricostruzione massiva. Fonte: [architettura Tauri](https://tauri.app/concept/architecture/).
Iniziare riutilizzando UI e generatori esistenti, portando in Rust le parti condivise
che ne traggono beneficio; evitare una riscrittura preventiva del progetto.

Il nostro valore è una descrizione strutturata e modificabile del settore: edifici,
superfici, scale, rampe e accessi con fonti, epoca e stato osservato/misurato/stimato/
sconosciuto. Da questa descrizione devono derivare mesh e collisioni concordanti.
Le correzioni comunitarie sopravvivono alle rigenerazioni e prevalgono sui dati generici.

Due percorsi complementari:

- Foto compatibili con fotogrammetria: stimare camere e geometria con motori esistenti,
  poi semplificare e controllare. Valutare [COLMAP](https://colmap.github.io/) come
  componente open-source; non riscrivere SfM/MVS in Rust per principio.
- Foto sparse/panorami e geografia: ricostruzione assistita di volumi e strutture,
  facciate rettificate in texture, dettagli volumetrici dove necessari. Mascherare
  occlusioni e chiedere nuove viste; immagini ottenute ruotando nello stesso panorama
  non aggiungono nuove posizioni di osservazione né parallasse.

La demo del municipio usa già il secondo metodo, con parametri e interventi umani:
non dimostra ancora un generatore automatico. Il registro effettivo della facciata
indica fotografie Wikimedia CC BY-SA, non Google: vedere
[fonti della demo](../public/models/civic/photo-study/SOURCES.md) e
[generatore](../scripts/build-photo-municipio.mjs). Non cambiare retroattivamente la provenienza.

## Candidati pronti e costo

Cesium ion offre già
[Reality Modeling da foto a 3D Tiles](https://cesium.com/blog/2025/07/22/introducing-reality-modeling-and-analysis/).
È da provare sui nostri input, non da considerare automaticamente adatto a panorami
eterogenei o a geometrie di gioco. Il listino lo indica ancora Technology Preview.

Listini consultati il 27 settembre 2026, USD: ion Commercial individuale 149/mese
(100 GB storage, 150 GB streaming/mese); Premium individuale 499/mese.
Per integrazioni usate fuori dall'organizzazione Cesium chiede contatto commerciale:
questi prezzi non sono un preventivo per il nostro SaaS.
[Listino Cesium](https://cesium.com/platform/cesium-ion/pricing/).

[Unreal](https://www.unrealengine.com/license): royalty standard 5% sui ricavi lordi
del prodotto oltre 1 milione USD lifetime, con eccezioni; per usi soggetti a seat,
1.850 USD/anno. La classificazione del nostro gioco, Studio e SaaS va valutata separatamente.

[RealityScan desktop](https://www.realityscan.com/license?lang=en-US) è un altro motore
pronto da confrontare: gratuito per soggetti idonei sotto 1 milione USD di ricavi annui,
1.250 USD/seat/anno sopra soglia. Non è open-source; automatizzazione e uso come servizio
per terzi richiedono verifica contrattuale specifica prima dell'integrazione produttiva.

Tenere separati costi di immagini, ricostruzione, storage/CDN, game server, eventuale
Pixel Streaming, moderazione e lavoro umano. Nessun costo per km² dimostrato oggi.

## Privacy e qualità

Il mondo pubblicato deve essere privo di persone e veicoli fotografati, come richiesto.
Non introdurre elementi sfocati nella scena: rimuovere o escludere gli oggetti transitori
dalle texture. I controlli privacy servono ai file caricati e alle anteprime condivise,
nei quali persone/targhe possono comunque apparire. Per fonti già trattate evitare
passaggi inutili. Una ricostruzione generativa di un'area occlusa rimane stimata.

Trasformare WORLD_RECONSTRUCTION.md in controlli obbligatori del tool: pianta e viste
a terra; quote e datum; basamenti; scale frontali/laterali e pianerottoli; accessi;
raccordi; confronto visivo; percorribilità; nessuna sovrascrittura dei dettagli approvati.
I test automatici assistono la revisione, non certificano da soli la fedeltà.

Prima prova proposta: isolato del municipio, stesso dato prodotto per anteprima web
e import Unreal; acquisizione multiutente, revisione di una scalinata e rigenerazione
che conserva la correzione. Misurare bytes, CPU/GPU-ore, minuti umani, scarti, frame time,
memoria e rete. Preservare facciata approvata, terza persona, modalità unica e spawn.

## Chiarimento successivo: Unreal nel browser con rendering locale

Il vincolo browser con risorse locali è confermato. Epic ha trasferito HTML5 al
supporto della community dopo UE 4.23; non considerare UE5 standard come dotato di
un'esportazione web ufficiale equivalente a desktop/mobile.
[Annuncio Epic](https://www2.unrealengine.com/blog/unreal-engine-4-23-released).

Esistono tuttavia porting di terzi. Il progetto
[SpeculativeCoder](https://github.com/SpeculativeCoder/UnrealEngine-HTML5-ES3)
documenta UE4.27/WebGL2, con limiti e mobile sperimentale. Non è la base UE5 richiesta.

[SimplyStream / Wonder Interactive](https://simplystream.com/) dichiara invece un
fork UE5.8 WebGPU/WASM, con rendering locale. Questo corregge l'impressione precedente
che Pixel Streaming fosse l'unica strada praticabile da considerare per UE5.
La [guida Engine SDK](https://simplystream.com/docs/build-guides) dichiara moduli
WebGPU proprietari precompilati: il porting non è interamente open-source.

Valutazione documentale soltanto: nessuna build o demo misurata in questa sessione.
Non verificati compatibilità Cesium for Unreal e cesium-native con il target browser,
threading e rete, disponibilità delle funzioni grafiche, memoria, mobile, self-hosting,
diritti di redistribuzione e costo totale. Il sito dichiara assenza di canone iniziale
e tariffa per minuto per il rendering locale; non significa gratuità dell'intera piattaforma.

Unreal resta quindi candidato condizionato a una prova del porting, senza migrare ora.
Prova proposta: personaggio, piccolo settore Cesium e asset propri, caricamento dinamico,
due client collegati a server autorevole con trasporto compatibile col browser,
misure di avvio/memoria/frame time; controllare l'assenza di video-rendering remoto.
Lo Studio e il formato del settore possono procedere indipendentemente dal runtime.

## Confronto successivo: Unity, Godot e stack web

Ricerca del 27 settembre 2026; nessuna migrazione scelta o eseguita. Il requisito
rimane browser con risorse locali. La facilità di accesso favorisce il web; download,
memoria e qualità devono però essere verificati sui dispositivi minimi concordati.

- **Unity + Cesium:** il supporto web esiste ora nel plugin Cesium, da v1.20.0.
  L'[annuncio del 16 marzo 2026](https://cesium.com/blog/2026/03/16/introducing-cesium-for-unity-web/)
  lo descriveva come sperimentale. La
  [documentazione corrente 1.25.1](https://cesium.com/learn/cesium-unity/ref-doc/supported-platforms.html)
  include WebGL e WebGPU, Unity 6+, multithreading C/C++ e configurazione degli header.
  Esiste una [guida ufficiale di deploy](https://cesium.com/learn/unity/building-an-app-for-the-web/).
  Le vecchie risposte del forum che negano il supporto web non rappresentano più lo stato attuale.
- **Godot:** licenza [MIT](https://godotengine.org/license/), adatta anche a uno Studio
  derivato, conservando attribuzioni. Export web ufficiale; la
  [documentazione stable](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
  indica renderer Compatibility/WebGL2, niente export web per C# in Godot 4 e necessità
  di compilare specificamente le GDExtension per il browser.
- **Godot + Cesium:** il candidato
  [3D Tiles for Godot di Battle Road](https://github.com/Battle-Road-Labs/3D-Tiles-For-Godot)
  integra cesium-native, ma il README indica ancora Web e Android come futuri.
  [ThunderFly](https://github.com/ThunderFly-aerospace/cesium-godot) dichiara il proprio
  progetto in pausa a favore di Battle Road. Non è stata verificata una combinazione
  Godot/Cesium pronta per browser: potrebbe richiedere un porting, non soltanto un test.
- **CesiumJS con componenti web:** resta l'alternativa con geografia già funzionante
  nel prototipo. Per fisica e multiplayer esistono [Rapier](https://rapier.rs/) e
  [Colyseus](https://colyseus.io/). Sono candidati da integrare, non componenti già
  presenti nel progetto né una soluzione automatica alla scalabilità globale.

Raccomandazione: conservare CesiumJS come riferimento, valutare Unity come confronto
con un editor completo se la dipendenza proprietaria è accettabile; per Godot risolvere
prima la fattibilità del porting Cesium sul web. Non adottare due renderer sovrapposti
come scorciatoia senza affrontare profondità, coordinate, collisioni e costi di memoria.
Non costruire un nuovo motore da zero. Nessun benchmark nuovo eseguito in questa ricerca.
