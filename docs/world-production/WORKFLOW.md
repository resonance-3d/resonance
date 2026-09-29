# Riprendere il lotto del centro

Leggere prima `../WORLD_RECONSTRUCTION.md`. Ambito: raggio 1 km; non dichiarare tutto
completato perché il terreno e i volumi sono presenti.

## Ordine dei prossimi settori

1. Ep0-Np0: municipio e dintorni. Conservare le gradinate approvate. Controllare
   esplicitamente le due piccole scale OSM 1394598309 e 1394598311, soglie delle case,
   percorsi della piazza e collegamenti al parco. Il settore contiene 32 sagome,
   quindi i cinque modelli curati non ne completano l'inventario.
2. Ep0-Np1 / Em1-Np1: parco e collegamenti verso Villa Giamari. Foto storiche da
   confrontare con ortofoto 2024/2025; distinguere sistemazioni nuove e vecchie.
3. Ep1-Np1: accessi della scuola Capoluogo e muri di contenimento; terreno già controllato,
   ma facciate e accessi a terra non verificati.
4. Ep3-Np1: Rocca, pieve e percorsi a gradini. Foto disponibili parzialmente occultate:
   nessuna deduzione di rampe continue o assenza di scale dal solo DTM.
5. Proseguire per settori contigui lungo le strade, senza isolare luoghi di interesse.

Le fotografie raccolte finora non documentano tutti i 1.278 edifici. La copertura a terra
è il requisito aperto per riprodurre fedelmente gli altri fronti: integrare fonti
con licenza utilizzabile, registrando epoche, autore e lati effettivamente visibili.

## Elaborazioni ripetibili già realizzate

- `scripts/import-osm.py`: estratto OSM e conservazione tag di altezza, tetti,
  scale, muri e percorsi. Gli archivi sorgenti del lotto sono in `sources/`.
- `scripts/build-centre-terrain.py`: mosaico DTM 2008/2010, staging più audit delle coperture.
  Richiede NumPy e pyproj. Trasferire il risultato a runtime solo dopo i controlli sulle quote.
- `scripts/fetch-ortho.py`: piramide WMS limitata a 21 file, riusa file presenti.
  Non estendere a download indiscriminati; rispettare il servizio pubblico.
- `scripts/estimate-building-heights.py`: conserva modelli approvati e altezze OSM;
  stime DSM filtrate e audit. Richiede NumPy, pyproj e matplotlib. Modifica il dataset runtime.
- `node scripts/build-world-inventory.mjs`: ricostruisce settori e inventario dalla base runtime.
  Conserva osservazioni e verifiche dei settori invariati; invalida i controlli se cambia la fonte.
  `observations.json` contiene le annotazioni fotografiche e non viene sovrascritto.
- `npm run audit:world`: verifica coerenza delle dichiarazioni di completamento.
- `npm test`, `npm run build`: regressione tecnica, non verifica della fedeltà.

Per misurare un comando: `python3 scripts/measure-command.py nome-lotto comando argomenti`.
Scrive `runs/commands.jsonl`. Non inserire token o credenziali negli argomenti registrati.
Gli archivi di ricerca non sono copiati nel gioco: Vite distribuisce solo `public/`.

Atlante: `/data/world/atlas.html` sul server locale. La demo non ha nuove modalità o
pulsanti per la produzione. L'atlante separato permette di selezionare/ingrandire un settore,
leggere riferimenti e lacune e vedere tutte le scale censite, anche se non ancora modellate.
