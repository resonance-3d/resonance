# Primo lotto misurato — 24 settembre 2026

**Risultato: base geografica nel raggio di 1 km, non ricostruzione fedele completata.**
Area circolare: 3,142 km². 1.278 sagome nell'obiettivo; 1.693 con il margine di rendering.
101 settori censiti, nessuno ancora integralmente verificato a livello strada.

| Misura | Risultato | Interpretazione |
|---|---:|---|
| Quota settimanale Codex utilizzata, inizio → fine | 14% → 19% | +5 punti percentuali, stessa finestra |
| Durata osservata della sessione | 36,2 minuti | Include ragionamento, rete, verifiche e strumenti; non solo CPU |
| Mosaico DTM, tempo reale comando | 4,307 s | Circa 4,14 s di CPU e 783 MiB di picco RSS del processo figlio |
| Stima delle altezze DSM, tempo reale comando | 4,052 s | Circa 3,90 s di CPU e 280 MiB di picco RSS |
| Esportazione piramide ortofoto | 16,84 s | 21 richieste/file, 5.978.766 byte |
| Raster terreno distribuito | 10.089.032 byte | 5.044.516 campioni; caricato interamente in memoria |
| Ultima build | 1,906 s | Passata; avviso dimensione bundle Cesium |
| Test | 45 superati | Nessun fallimento; non certificano la fedeltà fotografica |
| Vista municipio, prima → dopo | 30 → 30 fps | p95 del tempo fotogramma 34 → 34 ms |
| Vista panoramica dopo ampliamento | 30 fps, p95 34 ms | Nessuna misura precedente comparabile |

FPS: letture dell'indicatore dell'app (finestra mobile 2 secondi), Codex in-app browser,
viewport 1280 × 720, camera ferma e dati caricati. Non sono una misura GPU o un benchmark
sistematico dei percorsi; un limite del browser può nascondere differenze di capacità residua.

Il contatore Codex è **arrotondato e condiviso dall'account**: altri task possono avere
contribuito. La differenza non è un numero di token, un costo API, una percentuale mensile
dell'abbonamento o il costo della ricostruzione completa di 1 km di raggio. Non sono stati
consumati crediti di reset. Non è disponibile una misura precisa dei token di questa sessione.

Misurare separatamente i prossimi settori rifiniti prima di estrapolare un costo della città.
La copertura fotografica a terra, la modellazione di accessi e facciate, e la verifica visiva
restano lavoro aperto: in questo lotto è stata costruita soprattutto l'infrastruttura geografica.

Dati grezzi: `runs/2026-09-24-centre-1km.json` e `runs/commands.jsonl`.
