# Scalinate percorribili — 24 settembre 2026

## Verifica precedente: omissione degli accessi frontali

La successiva segnalazione dell'utente evidenzia un'omissione strutturale: le quattro scale sotto descritte **non ricostruiscono le gradinate antistanti al municipio**. La verifica tecnica di percorribilità non costituisce una verifica di fedeltà al luogo.

La foto già disponibile `public/models/civic/photo-study/references/municipio-09.jpg` mostra chiaramente rampe frontali, muretti di contenimento delle aiuole, un piano rialzato e ulteriori gradini davanti agli ingressi. Questi elementi sono stati omessi nella modellazione del basamento. La foto è storica: documenta l'omissione, ma non basta da sola a certificare lo stato dopo la riqualificazione.

La pavimentazione del progetto resta appoggiata al terreno, mentre le quattro scale sono raccordi indipendenti derivati dalle quote DTM 2010. Non si deve ricavare il numero dei gradini frontali dal solo dislivello di quel raster, né confondere gli accessi del municipio con la scalinata del parco verso via Carducci.

Correzione individuata in quella verifica (implementata nella revisione seguente): ricostruire congiuntamente basamento, terrazze, rampe frontali, pianerottoli e muretti, verificandone la disposizione con riferimenti aggiornati; poi allineare terreno sottostante, aiuole, ingressi del modello e superfici percorribili. Conservare la facciata approvata. Verificare la riconoscibilità da vista frontale e laterale prima di considerare completata la piazza.

Riferimento cronologico: [comunicato del Comune dell'8 ottobre 2021](https://met.cittametropolitana.fi.it/news.aspx?n=343064), che descrive la pedonalizzazione e il raccordo con la scalinata verso via Carducci. Il DTM 2010 precede tali lavori; questo non spiega da solo l'omissione degli accessi già visibili nella foto storica.

## Implementazione precedente

Aggiunte quattro scale geometriche leggere alla demo unica:

- Lato ovest del municipio, lungo il passaggio esterno alla Sala Cristiano Banti: 6 gradini.
- Lato est del municipio: 4 gradini.
- Percorso verso il parco, OSM `way/369627087`: 7 gradini.
- Raccordo pedonale OSM `way/369629103`: 5 gradini.

Posizioni dei due percorsi del parco riprese dall'estratto OpenStreetMap già presente. Posizione dei due raccordi del municipio, larghezze e numero dei gradini sono **approssimazioni di gioco autorizzate**, non il risultato di un rilievo architettonico. Gli estremi sono raccordati alle quote regionali esistenti. Le alzate sono circa 13–16 cm. Le rampe del municipio hanno pedate da 42 cm; i percorsi del parco hanno pedate più lunghe lungo il tracciato mappato.

`shared/stairways.mjs` definisce le stesse superfici per rendering e movimento. Pedate e pianerottoli sono piani orizzontali; piccoli raccordi alle estremità assorbono l'incontro con il terreno. Cordoli laterali bloccano gli attraversamenti del fianco. Il suolo Cesium viene incassato sotto la geometria, senza una rampa che copra i gradini.

Il server ammette il superamento delle singole alzate sulle scale e conserva il controllo dei pendii altrove. Il robot appoggia alla quota della pedata; la camera continua a smorzare gli spostamenti verticali. Non è ancora presente una posa dei singoli piedi con cinematica inversa.

Rendering procedurale senza nuove texture, download di modelli o ombre. Le superfici condividono tre colori per consentire il raggruppamento da parte di Cesium. Distanza di visualizzazione: 750 m. Nessuna nuova modalità o pulsante.

Test specifici: percorribilità completa nelle due direzioni camminando e correndo, cordoli, estremi liberi, pedate orizzontali, altezza delle alzate e terreno sottostante alla superficie visibile.

Validazione finale: **36 test superati**. Controllo visivo ravvicinato di entrambe le scalinate del municipio, anche con il robot su una pedata. La pagina temporanea di verifica è stata rimossa; lo spawn normale resta davanti al municipio.


## Revisione: accessi frontali implementati

Aggiunte due rampe frontali larghe 4,2 e 4,4 m negli spazi tra le tre aiuole, ciascuna con cinque alzate da circa 14 cm; due ulteriori gradini da 16 cm davanti a ciascun portone. Le quote stimate sono circa 74,43 m per il piazzale inferiore, 75,13 m per il pianerottolo e 75,45 m per la soglia dei portoni. **Misure di ricostruzione approssimative, non quote rilevate né certificazione della sistemazione attuale.**

`shared/frontage.mjs` definisce il pianerottolo, le aiuole e il piazzale raccordato; il municipio viene ancorato alla nuova quota di ingresso. Il rendering comprende superfici orizzontali, alzate, pianerottoli e muri delle aiuole. Terreno sottostante incassato anche lungo i bordi per evitare affioramenti; collisioni delle aiuole e quote dei gradini condivise con il server. Le facciate fotografiche e lo spawn rimangono quelli approvati. Nessuna nuova modalità.

Verifiche aggiunte: salita e discesa delle due rampe frontali, gradini dei due portoni, continuità con il pianerottolo, collisione delle aiuole e quote finite ai bordi dei raccordi senza rampa di invito.

Validazione della revisione frontale: build riuscita, **39 test superati**, controllo visivo nella demo ordinaria dalla posizione di spawn e con camera arretrata per vedere entrambe le rampe. Corretti gli affioramenti del DTM lungo il basamento e la sovrapposizione delle superfici dei pianerottoli con il piazzale.
