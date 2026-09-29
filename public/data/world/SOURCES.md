# Montemurlo, raggio 1 km — fonti e stato della ricostruzione

Lotto avviato il 24 settembre 2026. Centro: 43.9271961481 N, 11.0369735300 E.
Area richiesta: cerchio di raggio 1.000 m, **3,142 km²**. Il rettangolo di estrazione
comprende un margine di rendering e contiene più edifici del cerchio.

## Base geografica e immagini dall'alto

- **OpenStreetMap contributors**, estratto del 24/09/2026. [ODbL 1.0](https://www.openstreetmap.org/copyright).
  1.693 sagome nel rettangolo, 1.278 intersecano il cerchio; 584 percorsi, 67 muri/recinzioni
  e 13 tratti classificati come scalinate nel cerchio. I tratti non equivalgono al numero
  di strade o scale fisiche. L'assenza da OSM non dimostra l'assenza sul posto.
- **Fonte dei dati: “Ortofoto 2024/2025” – Regione Toscana**, layer `rt_ofc.5k24.32bit`.
  [Metadati ufficiali](https://www502.regione.toscana.it/geoscopio/servizi/wms/OFC_RT.htm).
  Licenza **CC BY 4.0** indicata nel record della [Cartoteca](https://www502.regione.toscana.it/geoscopio/servizi/wms/CARTOTECA.htm).
  Le risposte di catalogo sono conservate nel progetto. GSD della fonte dichiarato: 20 cm;
  piramide locale esportata a circa 55 cm/pixel al livello massimo, quindi risoluzione ridotta.
  21 JPEG, tre livelli; il gioco serve file locali, senza richieste al WMS a ogni movimento.
  Date puntuali delle singole riprese non accertate; 2024/2025 è l'etichetta del prodotto.
- **Fonte dei dati: “Rilievi LIDAR” – Regione Toscana**, DTM 1 m, voli 2008 e 2010,
  CC BY 4.0. [Dettagli altimetrici e limiti](../terrain/SOURCES.md).

## Altezza dei fabbricati

**Fonte dei dati: “DSM da autocorrelazione 2021” – Regione Toscana**, sezioni
263051, 263052, 263053, 263054, griglia 1 m. Licenza **CC BY 4.0** e riferimento
EPSG:7791 (RDN2008/TM32) verificati nel PDF allegato all'archivio regionale.
[Catalogo](https://www502.regione.toscana.it/geoscopio/servizi/wms/CARTOTECA.htm),
[archivio 263054](https://www502.regione.toscana.it/geoscopio/download/altimetria/DSM_autocorrelazione_2021/DSM_263054.zip).

Metodo: campionamento a oltre 1 m dal bordo delle sagome, almeno 12 campioni, percentile
85 della superficie meno quota mediana del DTM sul contorno. Esclusi risultati fuori
3–35 m o con intervallo P10–P95 superiore a 7 m. Preservati i cinque modelli civici
autorizzati e le altezze/numero di piani espliciti OSM. **1.567 stime accettate dal filtro
nel rettangolo, 84 casi da revisione e 15 con campioni insufficienti**; gli altri conservano
il dato precedente. Il controllo automatico non è verifica visiva: alberi, disallineamenti,
parti diverse del tetto e fonti di epoche diverse possono falsare le altezze. I tetti della
base restano estrusioni piane; le facciate generiche non sono fotografie degli edifici.

Script e audit: `scripts/estimate-building-heights.py` e
`docs/world-production/staging/building-height-audit.json`. Nessuna promessa di accuratezza
metrica certificata, attualità del fabbricato o precisione dei piani.

## Riferimenti a terra

Il campione del municipio resta quello approvato, con [fonti fotografiche](../../models/civic/photo-study/SOURCES.md)
e [sistemazione della piazza](../../models/civic/REPUBLIC.md) già documentate.
Nuove osservazioni parziali: [Villa Giamari A](https://commons.wikimedia.org/wiki/File:Villa_Giamari_A.jpg),
Massimiliano Galardi, 20/08/2011, CC BY-SA 3.0; e
[Castello di Montemurlo](https://commons.wikimedia.org/wiki/File:Castello_di_Montemurlo.jpg),
Panzagiovanni, 04/09/2017, CC BY-SA 4.0. Queste due fotografie sono riferimenti di ricerca:
nessuna nuova facciata è stata derivata da esse in questo lotto. Le osservazioni e le
occlusioni sono esplicite in `observations.json`.

Google Maps/Street View non costituisce un'autorizzazione generale a estrarre immagini,
texture o dati per il gioco. Per questo ampliamento non sono state incorporate immagini Google.
Le condizioni della fonte e la data vanno controllate per ogni nuovo uso concreto.

## Completamento

101 settori da 200 × 200 m intersecano il cerchio; i settori ai bordi lo oltrepassano.
Stato attuale: **base geografica sull'intera area e ricostruzione parziale del centro**.
Nessun settore intero è dichiarato verificato. Le scale OSM non modellate sono visibili
nell'atlante come elementi da controllare, non cancellate dall'inventario. Foto oblique/a
terra e controlli di accessi, muri e arredi restano necessari per la fedeltà a scala pedone.
