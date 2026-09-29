# Resonance — prova delle mesh ufficiali

Verifica del 22 settembre 2026. Fonti e condizioni possono cambiare.

## Risultati verificati

- Il token esistente in `.env.local` ottiene HTTP 200 dall’endpoint Cesium ion
  dell’asset Google Photorealistic 3D Tiles **2275207**. Nessun token copiato nel report.
- La pagina `/photogrammetry.html` carica realmente le mesh Google: verificati
  municipio, piazza della Libertà, parco e quartiere circostante a Montemurlo
  (centro della vista 43.92755 N, 11.03694 E).
- La copertura osservata non certifica tutto il territorio comunale. Data di
  acquisizione e accuratezza metrica locale non accertate.
- Prova separata dal gioco: nessun OSM Buildings, mappa OSM, Bing o geocoder.
  Crediti Cesium e Google con attribuzioni dinamiche visibili.
- Tre viste e tre livelli di dettaglio. Quote camera approssimative; nessun
  personaggio, multiplayer o sistema di collisioni di gioco integrato.
- Nessuna mesh esportata, texture estratta o copia offline del dataset.

## Come funziona

CesiumJS richiede al servizio solo le porzioni necessarie alla vista, con dettagli
diversi secondo la distanza. Geometrie e immagini sono già prodotte dal fornitore;
non servono fotografie o rilievi dell’utente. La richiesta iniziale della radice
abilita richieste successive per almeno tre ore secondo la documentazione Google.
[Documentazione ufficiale](https://developers.google.com/maps/documentation/tile/3d-tiles).

## Licenza e costi

È contenuto proprietario in streaming, non un pacchetto di asset acquistato.
I termini Cesium per Google vietano estrazione, redistribuzione e derivazione
di contenuti; limitano caching e associazione a mappe non Google. Escludono servizi
diretti ai bambini secondo COPPA. Quindi non è una fonte di GLB da importare in Roblox.
[Appendice contrattuale](https://cesium.com/legal/terms-for-google/).

Gli oggetti originali possono sovrapporsi alle tile, distinguendo le attribuzioni.
La documentazione ammette anche modelli propri in primo piano e tile sullo sfondo.
Non equivale al permesso di ricavare texture, collision mesh o navigazione dalle tile.
Rendering interattivo e collisioni transitorie per il gioco vanno chiariti con Cesium
prima di considerare autorizzata l’architettura multiplayer finale.
[Policy Map Tiles](https://developers.google.com/maps/documentation/tile/policies).

Prezzi pubblici USD/mese: Community gratuito e 1.000 root tile; Commercial individuale
149 e 5.000; Premium individuale 499 e 10.000. I piani indicano uso commerciale interno:
per soluzioni usate fuori dall’organizzazione è richiesto un confronto sulla licenza
d’integrazione. Non sono preventivi per il lancio pubblico di Resonance.
[Listino Cesium](https://cesium.com/platform/cesium-ion/pricing/).

Non si conta ogni edificio: una nuova inizializzazione o ricarica della scena può
consumare una nuova richiesta radice. Quota effettiva e ulteriori consumi vanno
controllati nella dashboard dell’account.
[Chiarimento Cesium sulle richieste](https://community.cesium.com/t/google-photorealistic-3d-tiles-root-connections-question-s/38315).

Cesium ha confermato per un altro gioco VR che il test può usare Community, con
licenza commerciale da concordare per la distribuzione successiva. È un precedente,
non un’autorizzazione specifica a Resonance.
[Risposta della responsabile prodotto](https://community.cesium.com/t/cesium-licensing/43201).

## Italia / SEE

Google limita l’accesso diretto Map Tiles per progetti nuovi dal 8 luglio 2025
collegati a fatturazione SEE, e per progetti che perdono lo stato non modificato:
Photorealistic 3D Tiles non disponibili in quel canale. Il test tramite ion oggi
funziona. Questo risultato tecnico non sostituisce una conferma contrattuale Cesium
per un’attività italiana e utenti europei.
[Condizioni SEE](https://developers.google.com/maps/comms/eea/map-tiles).

## Valutazione per il gioco

La vista aerea è molto riconoscibile. Nella vista ravvicinata, anche a caricamento
terminato e con dettaglio massimo (SSE 2), si osservano facciate poco nitide,
alberi e arredi deformati, e picchi di geometria nella piazza. Non sono soltanto
artefatti transitori di caricamento. Il dataset
non fornisce automaticamente porte apribili, interni o edifici distruttibili.
LOD e caricamenti cambiano la geometria visibile: collisioni autorevoli sul server,
percorsi dei personaggi e stabilità della quota restano lavoro separato. Non è stato
eseguito un confronto FPS controllato con il gioco: una vista statica con rendering
su richiesta non rappresenta il carico di un RPG in movimento.

Alternativa suggerita da Fabrizio: volumi semplici con facciate in texture; mantenere
3D portici, scale, balconi e sagome rilevanti. Cornici, finestre e persiane possono
essere dipinte o simulate con normal map. Usare texture proprie o con licenza adatta,
non ricavate dalle tile Google. Produzione e controllo dei materiali restano necessari;
meno geometria non implica automaticamente meno memoria o più FPS.

## Da confermare prima di un lancio

Richiedere a Cesium: licenza per RPG pubblico multiplayer, condizioni italiane/SEE,
target d’età, collisioni runtime e lato server, sovrapposizione degli asset originali,
politica per registrazioni dei giocatori, quote, overage e preventivo d’integrazione.
Nessuna richiesta commerciale inviata, nessun piano a pagamento attivato.

Verifica tecnica: compilazione TypeScript e build Vite riuscite; le tre viste e il
selettore di dettaglio verificati nel browser. Nessun errore console nella prova finale.
