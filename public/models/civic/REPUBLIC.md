# Piazza del municipio — Resonance

Studio della sistemazione di piazza della Repubblica e dell'area del monumento ai Caduti (piazza Donatori di Sangue), davanti al municipio di Montemurlo. Collegamento con piazza della Libertà. Aggiornamento: 24 settembre 2026.

## Riferimenti effettivamente consultati

- [Veduta aerea Google Maps](https://www.google.com/maps/@43.9271,11.0367,180m/data=!3m1!1e3): consultazione visiva per rapporti tra municipio, rotatoria, alberi, monumento, parcheggio e parco. La data di copyright non è la data di ripresa; quest'ultima non era indicata. Nessuna immagine aerea, tile o mesh Google è incorporata nei nuovi file.
- [Nuovi arredi per la piazza pedonale, 11 marzo 2023](https://www.notiziediprato.it/vita-in-citta/nuovi-arredi-per-la-piazza-pedonale-del-centro-cittadino-di-montemurlo/): foto a terra con lastre grigie rettangolari, panchine bianche senza schienale, bordi circolari degli alberi e fioriere arrotondate presso la rotatoria.
- [Comunicato del Comune di Montemurlo, 22 aprile 2023](https://www.edicoladellenotizie.it/la-cerimonia-per-il-25-aprile-ritorna-al-monumento-ai-caduti-in-piazza-donatori-di-sangue/): foto della piazza con piantumazioni, monumento e sedute; distingue le fioriere piantumate dalle foto precedenti ai lavori sul verde.
- Estratto OpenStreetMap del progetto: sagoma del municipio, tre aiuole frontali (`369627866`, `369627868`, `369627869`), parco, collegamento pedonale e strade. © OpenStreetMap contributors, ODbL. Restano validi attribuzione e accesso al database già presenti nella demo.

Le fotografie giornalistiche sono state consultate come riferimenti, non distribuite come texture. Queste note documentano la provenienza e non attestano una licenza generale su contenuti Google o sulle foto esterne.

## Contenuto e limiti

- Pavimentazione continua che segue Cesium World Terrain, con lastre sfalsate filtrate e variazione cromatica contenuta. Materiale procedurale originale, senza foto aeree proiettate sul terreno.
- Camminamento color cotto e tre aiuole del municipio sulle sagome OSM; cordoli a terra. Non è un rilievo delle quote dei gradini o degli accessi.
- Tre tigli, nove sedute, cinque fioriere, quattro lampioni, monumento e piccoli gruppi di rose. Quantità, collocazioni e misure sono una stima visiva, non un inventario comunale verificato. Gli arredi sono nuovi modelli originali generati da `scripts/build-republic.mjs`.
- Basamento e sagoma bronzea del monumento sono semplificati: non riproducono con precisione scultura, iscrizioni o nominativi.
- La facciata fotografica del municipio, già approvata, è ora la variante predefinita; i suoi riferimenti e la sua licenza sono separati in `photo-study/SOURCES.md`.
- Il parco oltre il margine della piazza, il parcheggio e gli edifici vicini conservano il trattamento della demo precedente. Non sono stati ricostruiti in dettaglio in questo intervento.

## Vegetazione e prestazioni

`republic-leaves.png` è una texture originale sintetica generata con image_gen integrato, senza immagini di riferimento. Il prompt completo è in [REPUBLIC-LEAVES-PROMPT.txt](./REPUBLIC-LEAVES-PROMPT.txt). È condivisa dai tre tigli, con canali alpha, ritaglio alpha (non trasparenza sovrapposta) e mipmap. Tronchi, bordi e rami restano 3D; le chiome usano piani incrociati.

Sette GLB riutilizzati, materiali raggruppati, nessuna nuova ombra dinamica, distanza massima degli arredi 650 m. Nessuna nuova chiamata a servizi esterni per le texture. Collocamento degli oggetti sul terreno al caricamento, non a ogni fotogramma. Le collisioni delle sedute, dei vasi, dei tigli e del basamento sono condivise da client e server. Le rose sono vegetazione decorativa attraversabile.

La scena approvata è ora l’unica modalità della demo: aprire `/`. Il personaggio parte davanti al municipio; i vecchi parametri di confronto vengono ignorati.

## Verifica del 24 settembre 2026

Build TypeScript/Vite riuscita. Suite completa: 24 test passati; dopo l'ultima revisione delle chiome, ripetuti e superati i 7 test pertinenti a modelli, collisioni e percorsi. Rendering verificato nel browser con streaming attivo, vista generale e vista municipio. Un errore iniziale nel nuovo shader delle ombre di contatto è stato corretto; nessun nuovo errore nel controllo successivo.

Dimensioni: 467.836 byte di GLB unici, 6.230 triangoli unici (le istanze ripetute aumentano il totale disegnato), texture foglie 2.161.829 byte, 1254 × 1254 RGBA. Indicatore della demo nella vista della piazza ferma: circa 30 fps, 95% dei fotogrammi entro 34 ms. È una misura locale puntuale, non un benchmark comparativo né una garanzia su altri dispositivi.


## Correzione degli accessi frontali

Il camminamento e le aiuole davanti al municipio ora hanno una geometria rialzata esplicita: due scalinate frontali di cinque gradini tra le aiuole, pianerottolo comune, due gradini davanti a ciascun portone e muretti di contenimento. Il piazzale inferiore è raccordato al terreno regionale. Il basamento segue le forme visibili nella foto storica del municipio già presente nei riferimenti; dimensioni e quote sono approssimate, non misurate sul posto. La pavimentazione continua descritta sopra non è più il modello degli accessi frontali.
