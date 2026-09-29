# Terreno locale di Resonance — Montemurlo

La demo integra il DTM regionale nel raggio di 1 km dal municipio, con un margine rettangolare esterno. Il raster locale sostituisce il suolo Cesium in questa zona; una fascia di 45 m lo raccorda al terreno esterno. Nessun nuovo pulsante o modalità.

## Dati e quote

- **Fonte dei dati: Regione Toscana – Rilievi LIDAR**. DTM 1 m: lotto 004, fogli 20j01 / 20j02 / 20j09 / 20j10, volo 2010; copertura mancante integrata con lotto 002, fogli 20j09 / 20j10 / 20j17 / 20j18, volo 2008. [Catalogo e fonte](https://dati.toscana.it/it/dataset/lidar), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Trasformazione orizzontale EPSG:3003 → WGS84 mediante PROJ; operazione disponibile con accuratezza planimetrica dichiarata di 4 m. Ricampionamento bilineare a circa 1 m; interi centimetrici per comprimere il file, **non** per dichiarare accuratezza centimetrica.
- **CARTA TECNICA DELLA REGIONE TOSCANA**, foglio 20J02, volo 2000, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Usata come controllo indipendente, non come geometria aggiuntiva nel gioco. Il PDF nell'archivio conferma attribuzione e licenza.
- Controlli: fronte municipio circa **75,1 m**; cortile Capoluogo circa **89,7 m**. La CTR riporta **89,41 m** vicino all'accesso, **91,14–95,25 m** più a nord e **97,46–97,49 m** ancora più a monte. La curva dei **100 m** non attraversa il cortile nel DTM. Le cifre della CTR sono valori del documento storico, non nuove misure sul posto.

## Riferimento verticale

Le quote originali del DTM sono geoidiche. Cesium usa quote ellissoidiche WGS84. Il gioco aggiunge la separazione del modello **EGM96**, circa **45,02 m** presso la scuola, interpolata ai quattro angoli dell'area; non aggiunge 45 m all'altitudine geografica dichiarata. [Griglia NGA distribuita da PROJ](https://cdn.proj.org/us_nga_egm96_15.tif), [metodo PROJ](https://proj.org/en/stable/operations/transformations/vgridshift.html).

L'esatto geoide del rilievo regionale non è identificato nei documenti acquisiti. **L'allineamento EGM96 è approssimato**, non una trasformazione altimetrica certificata. Le differenze di quota locali sono mantenute; ai bordi il raccordo compensa anche le discrepanze con Cesium.

## Cosa cambia nel gioco

Terreno, piedi, camera e arredi usano il rilievo locale. Nel nucleo corretto, gli edifici OSM ordinari sono estrusi dalle sagome locali, con tetto piano e fondazione alla nuova quota; le altezze stimate restano stimate. Le facciate generiche sono procedurali, non fotografiche. Municipio e case già ricostruite mantengono i modelli approvati. Il municipio è ancorato al terreno davanti alla porta, non al DTM interpolato sotto l'edificio.

Il server rifiuta attraversamenti dei tratti molto ripidi usando lo stesso raster. Il terreno viene caricato una volta (9,62 MiB, 5.044.516 campioni), poi campionato in memoria; le porzioni 3D mantengono il caricamento per livello di dettaglio.

## Limiti ancora aperti

Il volo 2010 precede la riqualificazione della piazza. Le superfici seguono il terreno storico; non sono una ricostruzione certificata dei piazzali attuali. La demo include otto rampe con gradini e pianerottoli geometrici: due ai lati del municipio, due ampie gradinate frontali, due accessi rialzati ai portoni e due sui percorsi pedonali OSM verso il parco. Le ulteriori scale censite nel raggio di 1 km sono nell’inventario, ancora da ricostruire e controllare. Sono ricostruzioni approssimative di gioco, autorizzate dall’utente e raccordate alle quote del terreno; numero, larghezza e posizione esatta dei gradini non sono misurati. Il robot e il server usano le medesime superfici calpestabili. La scuola non è appiattita a una quota arbitraria di 100 m.

Gli archivi originali, gli script di estrazione, le quote puntuali e la mappa di confronto si trovano in `docs/elevation-research/` e `scripts/build-centre-terrain.py` del progetto.

## Ampliamento del 24 settembre 2026

Il mosaico contiene 3.171.652 campioni dal volo 2010 e 1.872.864 dal 2008; nessun campione mancante nel rettangolo. Ortofoto 2024/2025 e stime di altezza DSM 2021 sono documentate nelle [fonti del lotto](../world/SOURCES.md). La differenza di epoca resta un limite: superfici recenti e scale non si ricavano automaticamente dal DTM storico.
