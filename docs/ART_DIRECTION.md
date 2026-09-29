# Resonance — direzione artistica e riconoscibilità

Aggiornamento richiesto da Fabrizio il 22 settembre 2026.

## Priorità attuale

- Visuale **in terza persona**, con un personaggio animato già pronto e gratuito.
- Esterni il più possibile realistici: gli abitanti dovrebbero riconoscere strade,
  edifici e punti di riferimento di Montemurlo.
- L’atmosfera contemporanea inquietante e le anomalie restano la cornice narrativa;
  materiali generici ripetuti non soddisfano da soli l’obiettivo di riconoscibilità.
- Conservare il dislivello reale, correggendo fluidità e percezione della scala.
- Non richiedere all’utente rilievi o fotogrammetria. Privilegiare dati già disponibili.

## Alternative annotate, da decidere in seguito

Proposta di Fabrizio del 22 settembre: usare volumi 3D semplici e texture delle facciate
per finestre, cornici e persiane. Conservare geometria per sagoma, portici, balconi e
scale; eventuali normal map per piccoli rilievi. Da confrontare visivamente e misurare,
senza assumere un aumento automatico degli FPS.
Aggiornamento del 24 settembre: prima variante applicata al municipio, disponibile
con `?facciata=foto&vista=municipio`. Usa due foto Wikimedia Commons CC BY-SA 3.0
del 2011, rielaborate tramite imagegen. Non utilizza immagini Google. Fianchi e retro
sono interpretativi. La facciata fotografica e la piazza rinnovata sono ora l’unica versione della demo,
con partenza del personaggio davanti al municipio; vedere
`public/models/civic/photo-study/SOURCES.md` per dettagli e misure.
La verifica delle mesh ufficiali Google è documentata in `PHOTOGRAMMETRY_EVALUATION.md`;
la prova locale è disponibile in `/photogrammetry.html`.

Se una ricostruzione riconoscibile non risulta sostenibile per copertura, licenze,
costo o qualità a livello strada, mantenere geografia e rilievi e reinterpretare
l’area in stile **medievale** oppure **futuristico**. Non è stata ancora scelta né
implementata nessuna delle due direzioni. Il robot temporaneo non decide lo stile.

## Immagini e servizi: verifica del 22 settembre 2026

Street View è una raccolta di panorami: visualizzarla tramite il servizio autorizzato
non equivale ad avere mesh, collisioni, facciate con profondità e percorsi liberi.
I termini Google vietano estrazione e creazione di contenuti derivati dai contenuti
Maps: non è una fonte di texture da ritagliare e redistribuire nel gioco.

Per nuovi progetti collegati a fatturazione SEE, dal 8 luglio 2025 l’API Map Tiles
non fornisce Photorealistic 3D Tiles né tile satellitari. Google indica Maps JavaScript
3D come alternativa, che non è il medesimo accesso alle tile per il renderer Cesium.
Eventuali accordi o disponibilità tramite Cesium ion vanno verificati con il fornitore;
Il test successivo tramite il token ion esistente ha verificato accesso e copertura
del centro di Montemurlo; resta da concordare la licenza per il gioco pubblico.
Non sono stati attivati piani a pagamento.

Mapillary distribuisce immagini stradali sotto CC BY-SA: può essere una fonte di
riferimenti o texture derivate nel rispetto di attribuzione e ShareAlike. La copertura
locale, la qualità, la specifica licenza e le condizioni di accesso alle immagini vanno
controllate prima di integrare un asset. Non fornisce automaticamente la città 3D
pronta per il gioco. Assemblaggio delle facciate e correzione delle occlusioni restano
lavoro di produzione, anche partendo da foto esistenti.

Proposta successiva: verificare copertura e diritti per un singolo isolato riconoscibile
(piazza/municipio), costruire un campione con alcuni edifici caratteristici e confrontarlo
con il luogo reale prima di promettere lo stesso risultato per tutti i 2,1 km².

## Scala e limiti della demo

RobotExpressive (Quaternius/Tomás Laulhé, adattamento Don McCurdy), CC0, circa 464 kB,
è incluso localmente con animazioni Idle, Walking, Running. Altezza di riferimento:
1,75 m, normalizzata dalle geometrie del modello; la posa animata cambia la silhouette.
Nessun ingrandimento automatico in base ai pixel. Crediti in public/models/robot/SOURCE.md.

Nell’estratto locale 1.087 sagome su 1.104 usano 8 m per mancanza di altezza e numero
di piani; tutte le altezze del file attuale sono stimate. Questo dato riguarda il JSON
locale e **non dimostra** che ogni edificio Cesium abbia la stessa altezza. La selezione
in mappa mostra le altezze dichiarate/stimate disponibili nei metadati live. La griglia
di finestre è ancora decorativa, ancorata alla quota regionale, e non identifica i
piani reali degli edifici. Nessuna moltiplicazione arbitraria delle altezze applicata.

## Fonti ufficiali

- Termini Google SEE, §3.3.2: https://cloud.google.com/terms/maps-platform/eea
- Limitazioni API Map Tiles SEE: https://developers.google.com/maps/comms/eea/map-tiles
- Tipi di contenuto Map Tiles: https://developers.google.com/maps/documentation/tile/overview
- Licenza Mapillary: https://help.mapillary.com/hc/en-us/articles/115001770409-CC-BY-SA-license-for-open-data
- Modello e licenza: https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive

## Primo campione implementato — centro civico

Municipio e casa con balconate con sagome OSM e facciate modellate da riferimenti pubblici; colonnato e
sei sedute circolari per Piazza della Libertà; trattamento chiaro delle superfici
pedonali. Viste Municipio/Piazza e confronto dettagli attivi/disattivi, con luce
neutra diurna. Fonte e limiti: `public/models/civic/SOURCES.md`.

Questa prova riguarda il complesso immediato, non 200 metri di città fedelmente
ricostruita. Sala Banti e il resto del quartiere restano generici. Il campione permette di
valutare riconoscibilità e costi artistici prima di estenderlo. I dettagli mancanti
non sono dati misurati: rimangono esplicitamente stime.

## Estensione della piazza e leggibilità delle strade

Aggiunti tre studi di edifici sul fronte nord: casa bianca con negozi e tetti
sfalsati, casa d'angolo chiara e casa ocra. Sagome geografiche conservate;
abbinamento fotografico e altezze sono interpretativi. Fonte comunale 2020,
nessuna fotografia applicata come texture; limiti e identificativi in SOURCES.md.
La ricostruzione da foto richiede ancora selezione, modellazione e verifica:
una singola foto non rivela quote, fianchi e retro.

Asfalto senza grana, pavimentazione con fughe filtrate per pixel e FXAA attivo.
Risoluzione e MSAA non aumentati; niente nuove ombre o servizi a pagamento.

La verifica delle linee guida consumer Google (non solo delle API) conferma
il divieto Street View di creare dati tramite digitalizzazione o tracciamento:
https://about.google/brand-resource-center/products-and-services/geo-guidelines/
Non consideriamo Street View una fonte automaticamente autorizzata per
ricostruire il quartiere. Mapillary è un'alternativa con licenza esplicita, ma
la sequenza locale osservata è del 2016 e non basta per questi prospetti.

## Prova aggiuntiva prima della decisione Roblox

Su richiesta di Fabrizio, la demo Cesium resta disponibile. È stata aggiunta una
variante opzionale degli arredi (`?piazza=studio`): architrave continua del colonnato
osservata nella vista Google Street View di ottobre 2022 da via Indipendenza;
sedute più arrotondate e vegetazione procedurale originale. Non è una ricostruzione
automatica o completa della piazza. Il campione non risolve la valutazione dei
diritti d'uso dei riferimenti. Dettagli in `public/models/civic/STUDY.md`.

Alternative ancora disponibili: modelli originali da fotografie autorizzate,
Mapillary CC BY-SA con copertura da verificare, dati topografici e altimetrici
regionali con licenza verificata per singolo dataset, mesh fotogrammetriche
fornite in streaming tramite servizi ufficiali compatibili con il progetto.
Roblox cambierebbe il motore e gli strumenti di gioco, non la disponibilità
intrinseca di facciate fedeli o le condizioni delle fonti.
