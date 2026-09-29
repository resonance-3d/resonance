# Resonance — studio visivo degli arredi di Piazza della Libertà

Studio del 22 settembre 2026, archiviato. I modelli restano nei file ma la variante
non è più selezionabile dalla demo; i vecchi parametri sono ignorati.

## Cosa è stato fatto

- Colonnato sostituito da un unico modello con architrave continua in mattoni,
  fascia chiara e basi chiare. Sette sostegni nelle posizioni della demo precedente;
  misure e numero sono ancora approssimativi, non estratti tramite rilievo.
- Sedute/fioriere con profilo più arrotondato e giunti radiali. Riferimento formale
  principale: fotografie comunali del 2020 già citate in SOURCES.md.
- Vegetazione originale con ramificazioni e chiome irregolari; non ricostruisce
  singoli alberi reali né garantisce corrispondenza botanica.
- Nessuna modifica ai cinque edifici, alle posizioni degli arredi o alle collisioni
  condivise. Non è la ricostruzione completa della nuova piazza, né del suo stato 2026.

## Riferimenti consultati

- Google Street View, **8 Via Indipendenza**, Montemurlo, ripresa **ottobre 2022**,
  panorama `VoPuhnBWTu4EhlkR8J3yAg`, consultato nell'interfaccia pubblica:
  https://www.google.com/maps/@?api=1&map_action=pano&pano=VoPuhnBWTu4EhlkR8J3yAg&heading=270
- Google Street View, **4 Via Indipendenza**, ripresa ottobre 2022,
  panorama `vMoVCMJS1DTmZkbhM6U2LA`. La cronologia mostrata per questo punto
  elencava 2022, 2018, 2016, 2012, 2011 e 2008. Non prova assenza di riprese più
  recenti in altri punti.
- Il panorama contributivo “Montemurlo Comune” di Davide Cetta, ripresa indicata
  gennaio 2016 / pubblicazione settembre 2017, è stato visto ma scartato come
  riferimento della riqualificazione recente.
- Comune di Montemurlo, fotografie del 18 novembre 2020:
  https://www.gonews.it/2020/11/18/montemurlo-nuovi-arredi-in-piazza-della-liberta/

Sono geometrie e materiali generati da codice dopo osservazione visiva, non
fotogrammetria né un servizio automatico immagine→mesh. Non sono scaricati o
inclusi panorami, ritagli fotografici o texture Google nei file del progetto.

## Distinzione tra prova tecnica e diritti di utilizzo

Questa prova non attesta conformità alle condizioni Google e non costituisce
un'autorizzazione a integrare asset derivati in un prodotto distribuito.
Le linee guida Street View vietano la creazione di dati dalle immagini mediante
digitalizzazione/tracciamento; chiamare il risultato “oggetto grafico” non basta
per escludere tale questione. Il confine tra osservazione artistica e derivazione
contrattualmente limitata non viene risolto da questo esperimento.
https://about.google/brand-resource-center/products-and-services/geo-guidelines/

La variante originale resta disponibile. Per una produzione con provenienza più
chiara: immagini proprie o autorizzate, fonti aperte compatibili con l'uso previsto,
oppure streaming ufficiale di modelli con la licenza del fornitore.

## Costo grafico

Tre file nuovi, circa 630 kB complessivi, senza texture fotografiche.
I file sono condivisi dalle istanze. 51 gruppi di materiale potenzialmente
visibili per questi arredi, come la variante precedente (21+30 contro 3+48).
Questo non garantisce fps uguali: il numero di triangoli è maggiore. Quote
campionate sul terreno, modelli visibili entro 650 m, nessuna nuova ombra dinamica.


Verifica locale: caricamento della variante e ritorno alla base controllati nel
browser, nessun errore console nella scheda della variante. Una lettura a camera
ferma, vista Arredi, 1280×720, due client connessi e streaming caricato ha mostrato
100 fps e p95 10 ms; è un campione puntuale, non un confronto prestazionale controllato.
Build completata e 21 test esistenti superati (collisioni, scala, missione, multiplayer).
